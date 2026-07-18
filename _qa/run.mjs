// Senior-QA style end-to-end harness: drives every PDF tool in a real Chrome
// instance, uploads real files, and validates the downloaded output.
// Usage: node _qa/run.mjs [--only=slug,slug] [--base=http://localhost:3103]
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { PDFDocument as Cantoo } from "@cantoo/pdf-lib";
import JSZip from "jszip";

const CDP_PORT = 9222;
const BASE = (process.argv.find((a) => a.startsWith("--base=")) || "").split("=")[1] || "http://localhost:3103";
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").split("=")[1]?.split(",").filter(Boolean);
const ASSETS = path.resolve("_qa/assets");
const DL_ROOT = path.resolve("_qa/downloads");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const asset = (n) => path.join(ASSETS, n);

/* ------------------------------------------------------------------ */
/* CDP plumbing                                                        */
/* ------------------------------------------------------------------ */
let ws, msgId = 0;
const pending = new Map();
let consoleErrors = [];
let pageExceptions = [];

async function connect() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://localhost:${CDP_PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) {
        ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((r) => ws.addEventListener("open", r));
        ws.addEventListener("message", (ev) => {
          const m = JSON.parse(ev.data);
          if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
          else if (m.method === "Runtime.exceptionThrown") {
            pageExceptions.push((m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
          } else if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") {
            consoleErrors.push(m.params.args.map((a) => a.value ?? a.description ?? a.type).join(" ").slice(0, 200));
          }
        });
        return;
      }
    } catch {}
    await sleep(500);
  }
  throw new Error("Could not connect to Chrome");
}

const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const id = ++msgId;
    pending.set(id, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });

async function evaluate(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error("JS: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text).split("\n")[0]);
  return r.result?.value;
}

async function waitFor(expression, timeoutMs, label) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    let v;
    try { v = await evaluate(expression); } catch { v = false; }
    if (v) return v;
    await sleep(300);
  }
  throw new Error(`timeout waiting for ${label}`);
}

async function setFiles(files) {
  const doc = await send("DOM.getDocument", { depth: 1 });
  const { nodeId } = await send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: 'input[type="file"]' });
  if (!nodeId) throw new Error("no file input found");
  await send("DOM.setFileInputFiles", { files, nodeId });
}

/* in-page helpers, injected on each page load */
const HELPERS = `
window.__qa = {
  clickText(text, tag='button'){
    const el=[...document.querySelectorAll(tag)].find(b=>(b.textContent||'').trim().toLowerCase().includes(text.toLowerCase()));
    if(!el) return false; el.click(); return true;
  },
  hasButton(text){
    return !![...document.querySelectorAll('button')].find(b=>(b.textContent||'').trim().toLowerCase().includes(text.toLowerCase()));
  },
  hasText(text){ return (document.body.innerText||'').toLowerCase().includes(text.toLowerCase()); },
  setByLabel(labelText, value){
    const l=[...document.querySelectorAll('label')].find(x=>(x.textContent||'').trim().toLowerCase().includes(labelText.toLowerCase()));
    if(!l) return 'no-label';
    const input=(l.parentElement||document).querySelector('input');
    if(!input) return 'no-input';
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
    setter.call(input,value);
    input.dispatchEvent(new Event('input',{bubbles:true}));
    return 'ok';
  },
  errorText(){
    const el=document.querySelector('.text-destructive');
    return el ? el.textContent.trim() : '';
  }
};
true;
`;

async function goto(url) {
  consoleErrors = []; pageExceptions = [];
  await send("Page.navigate", { url });
  await sleep(1200);
  // wait for hydration: the theme button label resolves after mount
  await waitFor(
    `!![...document.querySelectorAll('button')].find(b=>/Switch to/.test(b.getAttribute('aria-label')||''))`,
    20000,
    "hydration"
  );
  await evaluate(HELPERS);
}

/* ------------------------------------------------------------------ */
/* download capture                                                     */
/* ------------------------------------------------------------------ */
function freshDir(slug) {
  const d = path.join(DL_ROOT, slug);
  fs.rmSync(d, { recursive: true, force: true });
  fs.mkdirSync(d, { recursive: true });
  return d;
}
async function waitForDownloads(dir, minCount, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const files = fs.readdirSync(dir).filter((f) => !f.endsWith(".crdownload") && !f.startsWith("."));
    if (files.length >= minCount) {
      await sleep(700); // let writes flush
      return fs.readdirSync(dir).filter((f) => !f.endsWith(".crdownload") && !f.startsWith("."));
    }
    await sleep(300);
  }
  return fs.readdirSync(dir).filter((f) => !f.endsWith(".crdownload") && !f.startsWith("."));
}

/* ------------------------------------------------------------------ */
/* validators                                                           */
/* ------------------------------------------------------------------ */
async function pdfPages(buf) {
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
  return doc.getPageCount();
}
async function validate(file, spec) {
  const buf = fs.readFileSync(file);
  const name = path.basename(file);
  if (spec.type === "pdf") {
    if (buf.subarray(0, 4).toString() !== "%PDF") throw new Error(`${name} is not a PDF`);
    const pages = await pdfPages(buf);
    if (spec.pages !== undefined && pages !== spec.pages) throw new Error(`${name}: expected ${spec.pages} pages, got ${pages}`);
    if (spec.maxRatioOf) {
      const original = fs.statSync(asset(spec.maxRatioOf)).size;
      const ratio = buf.length / original;
      if (ratio > spec.maxRatio) {
        throw new Error(
          `${name}: expected <= ${Math.round(spec.maxRatio * 100)}% of original, got ${Math.round(ratio * 100)}% (${original}B → ${buf.length}B)`
        );
      }
      return `${name} · ${pages}p · ${original}B → ${buf.length}B (${Math.round((1 - ratio) * 100)}% smaller)`;
    }
    return `${name} · ${pages}p · ${buf.length}B`;
  }
  if (spec.type === "zip") {
    if (buf.subarray(0, 2).toString() !== "PK") throw new Error(`${name} is not a ZIP`);
    const zip = await JSZip.loadAsync(buf);
    const entries = Object.keys(zip.files);
    if (spec.entries !== undefined && entries.length !== spec.entries) throw new Error(`${name}: expected ${spec.entries} entries, got ${entries.length}`);
    if (spec.minEntries && entries.length < spec.minEntries) throw new Error(`${name}: expected >=${spec.minEntries} entries, got ${entries.length}`);
    return `${name} · ${entries.length} entries · ${buf.length}B`;
  }
  if (spec.type === "text") {
    const t = buf.toString("utf8");
    for (const needle of spec.contains ?? []) {
      if (!t.toLowerCase().includes(needle.toLowerCase())) throw new Error(`${name}: missing text "${needle}"`);
    }
    if (t.trim().length < (spec.minLength ?? 1)) throw new Error(`${name}: content too short (${t.length})`);
    return `${name} · ${buf.length}B`;
  }
  if (spec.type === "encrypted") {
    try { await Cantoo.load(buf); } catch { return `${name} · encrypted ✓ · ${buf.length}B`; }
    throw new Error(`${name} opened WITHOUT a password — not encrypted`);
  }
  if (spec.type === "decrypted") {
    await Cantoo.load(buf); // must open with no password
    const pages = await pdfPages(buf);
    return `${name} · decrypted ✓ · ${pages}p`;
  }
  return `${name} · ${buf.length}B`;
}

/* ------------------------------------------------------------------ */
/* test matrix                                                          */
/* ------------------------------------------------------------------ */
const P = "sample.pdf", P2 = "sample2.pdf";
const T = (slug, files, expect, opts = {}) => ({ slug, files, expect, ...opts });

const TESTS = [
  // ---- organize ----
  T("merge", [P, P2], { type: "pdf", pages: 8 }),
  T("compress", [P], { type: "pdf", pages: 5 }),
  // Realistic case: an image-heavy document must actually get meaningfully smaller.
  T("compress-heavy", ["heavy.pdf"], { type: "pdf", pages: 3, maxRatioOf: "heavy.pdf", maxRatio: 0.7 }, { route: "compress" }),
  T("split", [P], { type: "zip", minEntries: 2 }),
  T("rotate", [P], { type: "pdf", pages: 5 }),
  T("delete-pages", [P], { type: "pdf", pages: 4 }),
  T("extract-pages", [P], { type: "pdf", pages: 2 }),
  T("crop", [P], { type: "pdf", pages: 5 }),
  T("add-blank-pages", [P], { type: "pdf", pages: 6 }),
  T("add-page-numbers", [P], { type: "pdf", pages: 5 }),
  T("duplicate-page", [P], { type: "pdf", pages: 6 }),
  T("replace-page", [P, P2], { type: "pdf", pages: 5 }),
  // ---- edit ----
  T("watermark", [P], { type: "pdf", pages: 5 }),
  // ---- forms ----
  T("clear-form-fields", ["form.pdf"], { type: "pdf", pages: 1 }),
  T("flatten", ["form.pdf"], { type: "pdf", pages: 1 }),
  // ---- security ----
  T("protect", [P], { type: "encrypted" }, { fields: [["Password", "qapass123"]] }),
  T("encrypt", [P], { type: "encrypted" }, { fields: [["User password", "qapass123"]] }),
  T("unlock", ["protected.pdf"], { type: "decrypted" }, { fields: [["Current password", "test123"]] }),
  T("decrypt", ["protected.pdf"], { type: "decrypted" }, { fields: [["Password", "test123"]] }),
  T("permission-settings", [P], { type: "encrypted" }, { fields: [["Owner password", "ownerpass"]] }),
  T("remove-metadata", [P], { type: "pdf", pages: 5 }),
  // ---- ocr (slow: downloads a language model) ----
  T("extract-text", [P], { type: "text", contains: ["Sample Document Page 1"] }),
  T("extract-images", [P], { type: "zip", minEntries: 1 }),
  T("ocr", [P], { type: "pdf" }, { timeout: 420000, slow: true, roundtrip: ["Sample Document"] }),
  T("searchable-pdf", [P], { type: "pdf" }, { timeout: 420000, slow: true, roundtrip: ["Sample Document"] }),
  T("scan-to-editable", [P], { type: "text", contains: ["Sample Document"] }, { timeout: 420000, slow: true }),
  // ---- convert ----
  T("pdf-to-jpg", [P], { type: "zip", entries: 5 }),
  T("jpg-to-pdf", ["photo.jpg"], { type: "pdf", pages: 1 }),
  T("png-to-pdf", ["photo.png"], { type: "pdf", pages: 1 }),
  T("pdf-to-txt", [P], { type: "text", contains: ["Sample Document"] }),
  T("pdf-to-word", [P], { type: "text", contains: ["Sample Document"] }),
  T("word-to-pdf", ["doc.docx"], { type: "pdf" }, { roundtrip: ["QA Word Heading", "First paragraph"] }),
  T("excel-to-pdf", ["book.xlsx"], { type: "pdf" }, { roundtrip: ["Product", "Widget"] }),
  T("powerpoint-to-pdf", ["deck.pptx"], { type: "pdf", pages: 2 }, { roundtrip: ["QA Deck Title", "Bullet point"] }),
  T("pdf-to-html", [P], { type: "text", contains: ["Sample Document"] }),
  T("html-to-pdf", ["page.html"], { type: "pdf" }, { roundtrip: ["QA HTML Heading", "List item one"] }),
  // ---- utilities ----
  T("document-information", [P], { type: "info", contains: ["Pages"] }),
  T("page-size-detection", [P], { type: "info", contains: ["Total pages"] }),
  T("thumbnail-generator", [P], { type: "zip", entries: 5 }),
  T("duplicate-page", [P], { type: "pdf", pages: 6 }),
];

// Interactive (non-processor) flows
const EDITOR_SLUGS = [
  "edit-text", "add-text-box", "highlight", "underline", "strike-through", "add-images",
  "whiteout", "draw-shapes", "freehand", "sticky-notes", "link-inserter", "redact",
  "fill-forms", "create-fillable-forms", "e-signature", "date-fields", "checkbox-fields",
  "radio-buttons", "dropdown-fields",
];

/* ------------------------------------------------------------------ */
/* runners                                                              */
/* ------------------------------------------------------------------ */
async function runProcessor(t) {
  const dir = freshDir(t.slug);
  await send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: dir });
  await goto(`${BASE}/tools/${t.route ?? t.slug}`);
  // The workspace's run button is labelled with the tool title, same as the <h1>.
  const title = (await evaluate(`document.querySelector('h1')?.textContent?.trim() || ''`)) || t.slug;
  await setFiles(t.files.map(asset));
  await waitFor(`window.__qa.hasButton(${JSON.stringify(title)})`, 20000, `run button "${title}"`);

  for (const [label, value] of t.fields ?? []) {
    const r = await evaluate(`window.__qa.setByLabel(${JSON.stringify(label)}, ${JSON.stringify(value)})`);
    if (r !== "ok") throw new Error(`could not set field "${label}": ${r}`);
  }
  await sleep(300);

  const clicked = await evaluate(`window.__qa.clickText(${JSON.stringify(title)})`);
  if (!clicked) throw new Error(`run button "${title}" not found`);

  const timeout = t.timeout ?? 60000;
  const outcome = await waitFor(
    `(window.__qa.hasText('All done!') && 'done') || (window.__qa.hasText('Here are the details') && 'info') || (window.__qa.errorText() && ('err:'+window.__qa.errorText()))`,
    timeout,
    "result"
  );
  if (String(outcome).startsWith("err:")) throw new Error(String(outcome).slice(4));

  if (t.expect.type === "info") {
    const body = await evaluate(`document.body.innerText`);
    for (const needle of t.expect.contains ?? []) {
      if (!body.includes(needle)) throw new Error(`info result missing "${needle}"`);
    }
    return "info panel rendered";
  }

  const ok = await evaluate(`window.__qa.clickText('Download')`);
  if (!ok) throw new Error("no Download button in result view");
  const files = await waitForDownloads(dir, 1);
  if (!files.length) throw new Error("no file was downloaded");
  const out = path.join(dir, files[0]);
  let detail = await validate(out, t.expect);

  // Round-trip: prove the text really survived into the produced PDF by running
  // it back through the app's own Extract Text tool.
  if (t.roundtrip) {
    const found = await roundtripText(out, t.roundtrip);
    detail += ` · text verified (${found})`;
  }
  return detail;
}

async function roundtripText(pdfFile, contains) {
  const dir = freshDir("_roundtrip");
  await send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: dir });
  await goto(`${BASE}/tools/extract-text`);
  const title = (await evaluate(`document.querySelector('h1')?.textContent?.trim() || ''`)) || "Extract Text";
  await setFiles([pdfFile]);
  await waitFor(`window.__qa.hasButton(${JSON.stringify(title)})`, 20000, "extract-text run button");
  await evaluate(`window.__qa.clickText(${JSON.stringify(title)})`);
  const outcome = await waitFor(
    `(window.__qa.hasText('All done!') && 'done') || (window.__qa.errorText() && ('err:'+window.__qa.errorText()))`,
    45000,
    "round-trip extraction"
  );
  if (String(outcome).startsWith("err:")) throw new Error("round-trip extract failed: " + String(outcome).slice(4));
  await evaluate(`window.__qa.clickText('Download')`);
  const files = await waitForDownloads(dir, 1);
  if (!files.length) throw new Error("round-trip produced no text file");
  const text = fs.readFileSync(path.join(dir, files[0]), "utf8");
  const missing = contains.filter((c) => !text.toLowerCase().includes(c.toLowerCase()));
  if (missing.length) throw new Error(`produced PDF is missing expected text: ${missing.join(", ")}`);
  return contains.join(" / ");
}

async function clickCanvas(dx = 0.5, dy = 0.4) {
  // The editor sits below the page hero, so bring it into view before
  // dispatching real mouse events at viewport coordinates.
  await evaluate(`(() => { const c=document.querySelector('canvas.upper-canvas')||document.querySelector('canvas.lower-canvas');
    c && c.scrollIntoView({block:'center', inline:'center'}); return true; })()`);
  await sleep(600);
  const rect = JSON.parse(
    await evaluate(`(() => { const c=document.querySelector('canvas.upper-canvas')||document.querySelector('canvas.lower-canvas');
      const r=c.getBoundingClientRect(); return JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height,vw:innerWidth,vh:innerHeight}); })()`)
  );
  const x = Math.round(rect.x + rect.w * dx);
  const y = Math.round(rect.y + rect.h * dy);
  if (x < 0 || y < 0 || x > rect.vw || y > rect.vh) {
    throw new Error(`canvas click point (${x},${y}) is outside the ${rect.vw}x${rect.vh} viewport; canvas rect=${JSON.stringify(rect)}`);
  }
  for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) {
    await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: type === "mouseMoved" ? 0 : 1 });
    await sleep(120);
  }
}

async function runEditor(slug) {
  const dir = freshDir(slug);
  const inputSize = fs.statSync(asset(P)).size;
  await send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: dir });
  await goto(`${BASE}/tools/${slug}`);
  await setFiles([asset(P)]);
  await sleep(900);
  if (!(await evaluate(`window.__qa.clickText('Open in editor')`))) throw new Error("'Open in editor' button not found");
  await waitFor(`!!document.querySelector('canvas.lower-canvas')`, 45000, "editor canvas");
  await waitFor(`window.__qa.hasText('Page 1 of')`, 20000, "editor status bar");
  await sleep(1200);

  // Close any dialog the tool's default mode opened (e.g. signature pad).
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await sleep(500);

  // Actually annotate: pick the Rectangle tool and drop a shape on the page.
  const picked = await evaluate(`(() => { const b=document.querySelector('button[aria-label="Rectangle"]'); if(!b) return false; b.click(); return true; })()`);
  if (!picked) throw new Error("Rectangle tool button not found");
  await sleep(400);
  await clickCanvas();
  await waitFor(`/[1-9]\\d* objects/.test(document.body.innerText)`, 10000, "annotation object on canvas");

  if (!(await evaluate(`window.__qa.clickText('Download')`))) throw new Error("editor Download button not found");
  const files = await waitForDownloads(dir, 1, 45000);
  if (!files.length) throw new Error("editor produced no download");
  const out = path.join(dir, files[0]);
  const detail = await validate(out, { type: "pdf", pages: 5 });
  // The annotation must actually be burned into the exported PDF.
  const outSize = fs.statSync(out).size;
  if (outSize <= inputSize + 500) {
    throw new Error(`annotation not burned in: output ${outSize}B vs input ${inputSize}B`);
  }
  return `${detail} · annotation burned in (+${outSize - inputSize}B)`;
}

async function runViewer(slug) {
  await goto(`${BASE}/tools/${slug}`);
  await setFiles([asset(P)]);
  await sleep(900);
  if (!(await evaluate(`window.__qa.clickText('Open document')`))) throw new Error("'Open document' button not found");
  await waitFor(`!!document.querySelector('.react-pdf__Page__canvas')`, 45000, "rendered PDF page");
  const n = await evaluate(`document.querySelectorAll('.react-pdf__Page__canvas').length`);
  return `viewer rendered ${n} page canvas(es)`;
}

async function runOrganize() {
  const dir = freshDir("organize");
  await send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: dir });
  await goto(`${BASE}/tools/organize`);
  await setFiles([asset(P)]);
  await sleep(900);
  if (!(await evaluate(`window.__qa.clickText('Organize pages')`))) throw new Error("'Organize pages' button not found");
  await waitFor(`document.querySelectorAll('img[alt^="Page"]').length >= 5`, 45000, "page thumbnails");
  if (!(await evaluate(`window.__qa.clickText('Apply & download')`))) throw new Error("'Apply & download' not found");
  const files = await waitForDownloads(dir, 1, 40000);
  if (!files.length) throw new Error("organizer produced no download");
  return await validate(path.join(dir, files[0]), { type: "pdf", pages: 5 });
}

/** Comparing a file against an identical copy must report matching lines and no diffs. */
async function runCompareIdentical() {
  await goto(`${BASE}/tools/compare`);
  await setFiles([asset(P), asset("sample-copy.pdf")]);
  await sleep(900);
  if (!(await evaluate(`window.__qa.clickText('Compare')`))) throw new Error("'Compare' gate button not found");
  await waitFor(`document.querySelectorAll('.react-pdf__Page__canvas').length >= 1`, 45000, "compare viewers");
  if (!(await evaluate(`window.__qa.clickText('Compare text')`))) throw new Error("'Compare text' button not found");
  await waitFor(`window.__qa.hasText('matching lines')`, 45000, "diff result");
  const body = await evaluate(`document.body.innerText`);
  const matching = Number(body.match(/(\d+)\s+matching lines/)?.[1] ?? 0);
  const added = Number(body.match(/(\d+)\s+added/)?.[1] ?? -1);
  const removed = Number(body.match(/(\d+)\s+removed/)?.[1] ?? -1);
  if (matching <= 0) throw new Error(`identical files reported ${matching} matching lines (diff is broken)`);
  if (added !== 0 || removed !== 0) throw new Error(`identical files reported ${added} added / ${removed} removed`);
  return `identical files → ${matching} matching, 0 added, 0 removed`;
}

async function runCompare() {
  await goto(`${BASE}/tools/compare`);
  await setFiles([asset(P), asset(P2)]);
  await sleep(900);
  if (!(await evaluate(`window.__qa.clickText('Compare')`))) throw new Error("'Compare' gate button not found");
  await waitFor(`document.querySelectorAll('.react-pdf__Page__canvas').length >= 1`, 45000, "compare viewers");
  if (!(await evaluate(`window.__qa.clickText('Compare text')`))) throw new Error("'Compare text' button not found");
  await waitFor(`window.__qa.hasText('matching lines')`, 45000, "diff result");
  const body = await evaluate(`document.body.innerText`);
  const m = body.match(/(\d+)\s+matching lines/);
  return `diff computed (${m ? m[1] : "?"} matching lines)`;
}

/* ------------------------------------------------------------------ */
/* main                                                                 */
/* ------------------------------------------------------------------ */
async function main() {
  fs.rmSync(DL_ROOT, { recursive: true, force: true });
  fs.mkdirSync(DL_ROOT, { recursive: true });
  await connect();
  await send("Runtime.enable");
  await send("Page.enable");
  await send("DOM.enable");

  await goto(`${BASE}/tools`);

  // generate a real JPEG using the browser (node has no JPEG encoder)
  if (!fs.existsSync(asset("photo.jpg"))) {
    const dataUrl = await evaluate(`
      (() => { const c=document.createElement('canvas'); c.width=320; c.height=220;
        const x=c.getContext('2d');
        const g=x.createLinearGradient(0,0,320,220); g.addColorStop(0,'#6366f1'); g.addColorStop(1,'#ec4899');
        x.fillStyle=g; x.fillRect(0,0,320,220);
        x.fillStyle='#fff'; x.font='bold 28px sans-serif'; x.fillText('QA IMAGE',60,120);
        return c.toDataURL('image/jpeg',0.92); })()
    `);
    fs.writeFileSync(asset("photo.jpg"), Buffer.from(dataUrl.split(",")[1], "base64"));
    console.log("generated photo.jpg");
  }

  const results = [];
  const run = async (name, kind, fn) => {
    if (ONLY && !ONLY.includes(name)) return;
    const t0 = Date.now();
    process.stdout.write(`▶ ${name.padEnd(24)} `);
    try {
      const detail = await fn();
      const ms = Date.now() - t0;
      console.log(`✓ PASS  ${detail}  (${(ms / 1000).toFixed(1)}s)`);
      results.push({ name, kind, ok: true, detail });
    } catch (e) {
      const ms = Date.now() - t0;
      console.log(`✗ FAIL  ${e.message}  (${(ms / 1000).toFixed(1)}s)`);
      results.push({ name, kind, ok: false, detail: e.message, errors: [...pageExceptions, ...consoleErrors].slice(0, 3) });
    }
  };

  console.log(`\n══ PROCESSOR TOOLS ══`);
  const seen = new Set();
  for (const t of TESTS) {
    if (seen.has(t.slug)) continue;
    seen.add(t.slug);
    if (t.slow && process.env.SKIP_SLOW) continue;
    await run(t.slug, "processor", () => runProcessor(t));
  }

  console.log(`\n══ EDITOR TOOLS ══`);
  for (const slug of EDITOR_SLUGS) await run(slug, "editor", () => runEditor(slug));

  console.log(`\n══ INTERACTIVE TOOLS ══`);
  await run("view", "viewer", () => runViewer("view"));
  await run("organize", "organizer", runOrganize);
  await run("compare", "compare", runCompare);
  await run("compare-identical", "compare", runCompareIdentical);

  const pass = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok);
  console.log(`\n${"═".repeat(60)}\nRESULT: ${pass} passed, ${fail.length} failed (of ${results.length})`);
  if (fail.length) {
    console.log(`\nFAILURES:`);
    for (const f of fail) {
      console.log(`  ✗ ${f.name} [${f.kind}] — ${f.detail}`);
      (f.errors ?? []).filter(Boolean).forEach((e) => console.log(`      js: ${e}`));
    }
  }
  fs.writeFileSync(path.resolve("_qa/report.json"), JSON.stringify(results, null, 2));
  ws.close();
  process.exit(fail.length ? 1 : 0);
}

main().catch((e) => { console.error("HARNESS ERROR:", e); process.exit(2); });
