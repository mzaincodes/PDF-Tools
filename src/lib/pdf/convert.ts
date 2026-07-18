import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import JSZip from "jszip";
import type { ProcessResult, ProcessProgress } from "@/types";
import { loadPdfDocument, renderPageBlob } from "./pdfjs";
import { PAGE_SIZES, pdfBlob } from "./helpers";

type Opts = Record<string, string | number | boolean>;

/* ------------------------------------------------------------------ */
/* IMAGES -> PDF                                                        */
/* ------------------------------------------------------------------ */
export async function imagesToPdf(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  const doc = await PDFDocument.create();
  const pageSize = String(o.pageSize ?? "fit");
  const orientation = String(o.orientation ?? "auto");
  const margin = Number(o.margin ?? 0);
  const flattenBg = o.background !== false;

  for (let i = 0; i < files.length; i++) {
    onProgress((i / files.length) * 90, `Adding ${files[i].name}`);
    const bytes = new Uint8Array(await files[i].arrayBuffer());
    const isPng = files[i].type.includes("png");
    const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);

    let pw: number;
    let ph: number;
    if (pageSize === "fit") {
      pw = img.width + margin * 2;
      ph = img.height + margin * 2;
    } else {
      let [a, b] = PAGE_SIZES[pageSize] ?? PAGE_SIZES.a4;
      const landscape = orientation === "landscape" || (orientation === "auto" && img.width > img.height);
      if (landscape) [a, b] = [b, a];
      pw = a;
      ph = b;
    }

    const page = doc.addPage([pw, ph]);
    if (flattenBg) {
      page.drawRectangle({ x: 0, y: 0, width: pw, height: ph, color: rgb(1, 1, 1) });
    }
    const maxW = pw - margin * 2;
    const maxH = ph - margin * 2;
    const scale = Math.min(maxW / img.width, maxH / img.height, pageSize === "fit" ? 1 : Infinity);
    const w = img.width * scale;
    const h = img.height * scale;
    page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
  }

  onProgress(95, "Saving");
  const out = await doc.save();
  onProgress(100, "Done");
  return {
    files: [{ name: "converted.pdf", blob: pdfBlob(out), size: out.length }],
    meta: [{ label: "Images", value: String(files.length) }],
  };
}

/* ------------------------------------------------------------------ */
/* PDF -> IMAGES (zip)                                                  */
/* ------------------------------------------------------------------ */
export async function pdfToImages(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  const scale = Math.max(1, Number(o.quality ?? 2));
  const doc = await loadPdfDocument(await files[0].arrayBuffer());
  const zip = new JSZip();
  const base = files[0].name.replace(/\.pdf$/i, "");
  const total = doc.numPages;

  for (let i = 1; i <= total; i++) {
    onProgress((i / total) * 92, `Rendering page ${i}`);
    const { blob } = await renderPageBlob(doc, i, scale, "image/jpeg", 0.92);
    zip.file(`${base}-${String(i).padStart(3, "0")}.jpg`, blob);
  }
  await doc.destroy();
  onProgress(96, "Zipping");
  const blob = await zip.generateAsync({ type: "blob" });
  onProgress(100, "Done");
  return {
    files: [{ name: `${base}-images.zip`, blob, size: blob.size }],
    meta: [{ label: "Images created", value: String(total) }],
  };
}

/* ------------------------------------------------------------------ */
/* Text extraction (pdf.js)                                            */
/* ------------------------------------------------------------------ */
export async function extractPdfText(
  data: ArrayBuffer,
  onProgress?: ProcessProgress
): Promise<string[]> {
  const doc = await loadPdfDocument(data);
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    let text = "";
    for (const item of content.items as Array<{ str: string; transform: number[]; hasEOL?: boolean }>) {
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) text += "\n";
      text += item.str;
      if (item.hasEOL) text += "\n";
      lastY = y;
    }
    pages.push(text.trim());
    onProgress?.((i / doc.numPages) * 90, `Reading page ${i}`);
  }
  await doc.destroy();
  return pages;
}

export async function extractText(files: File[], _o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  const pages = await extractPdfText(await files[0].arrayBuffer(), onProgress);
  const joined = pages.map((p, i) => `--- Page ${i + 1} ---\n${p}`).join("\n\n");
  if (!joined.replace(/--- Page \d+ ---/g, "").trim()) {
    throw new Error("No selectable text found. This looks like a scanned PDF — try the OCR tool instead.");
  }
  const blob = new Blob([joined], { type: "text/plain" });
  const base = files[0].name.replace(/\.pdf$/i, "");
  onProgress(100, "Done");
  return {
    files: [{ name: `${base}.txt`, blob, size: blob.size }],
    meta: [
      { label: "Pages", value: String(pages.length) },
      { label: "Characters", value: String(joined.length) },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* PDF -> Word (.doc HTML) & PDF -> HTML                                */
/* ------------------------------------------------------------------ */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function pdfToWord(files: File[], _o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  const pages = await extractPdfText(await files[0].arrayBuffer(), onProgress);
  const base = files[0].name.replace(/\.pdf$/i, "");
  const body = pages
    .map(
      (p) =>
        `<div style="page-break-after:always">${p
          .split("\n")
          .map((line) => `<p>${escapeHtml(line) || "&nbsp;"}</p>`)
          .join("")}</div>`
    )
    .join("");
  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${escapeHtml(base)}</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5}p{margin:0 0 6pt}</style></head><body>${body}</body></html>`;
  const blob = new Blob(["﻿", html], { type: "application/msword" });
  onProgress(100, "Done");
  return { files: [{ name: `${base}.doc`, blob, size: blob.size }], meta: [{ label: "Pages", value: String(pages.length) }] };
}

export async function pdfToHtml(files: File[], _o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  const pages = await extractPdfText(await files[0].arrayBuffer(), onProgress);
  const base = files[0].name.replace(/\.pdf$/i, "");
  const sections = pages
    .map(
      (p, i) =>
        `<section class="page"><h2>Page ${i + 1}</h2>${p
          .split("\n")
          .map((l) => `<p>${escapeHtml(l) || "&nbsp;"}</p>`)
          .join("")}</section>`
    )
    .join("\n");
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(base)}</title><style>body{max-width:820px;margin:2rem auto;padding:0 1rem;font-family:system-ui,sans-serif;line-height:1.6;color:#1e293b}.page{border-bottom:1px solid #e2e8f0;padding:1.5rem 0}h2{color:#6d28d9;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase}p{margin:.25rem 0}</style></head><body>${sections}</body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  onProgress(100, "Done");
  return { files: [{ name: `${base}.html`, blob, size: blob.size }] };
}

/* ------------------------------------------------------------------ */
/* Shared text layout into a PDF                                       */
/* ------------------------------------------------------------------ */
async function paragraphsToPdf(paragraphs: { text: string; bold?: boolean; size?: number }[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const [pw, ph] = PAGE_SIZES.a4;
  const margin = 56;
  const maxW = pw - margin * 2;

  let page = doc.addPage([pw, ph]);
  let y = ph - margin;

  const wrap = (text: string, f: PDFFont, size: number): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(test, size) > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };

  for (const para of paragraphs) {
    const size = para.size ?? 11;
    const f = para.bold ? bold : font;
    const lines = para.text ? wrap(para.text, f, size) : [""];
    for (const line of lines) {
      if (y < margin + size) {
        page = doc.addPage([pw, ph]);
        y = ph - margin;
      }
      if (line) page.drawText(line, { x: margin, y, size, font: f, color: rgb(0.12, 0.12, 0.16) });
      y -= size * 1.5;
    }
    y -= size * 0.5;
  }
  return doc.save();
}

/* ------------------------------------------------------------------ */
/* Office -> PDF (client-side, structure-focused)                      */
/* ------------------------------------------------------------------ */
async function unzip(file: File): Promise<JSZip> {
  return JSZip.loadAsync(await file.arrayBuffer());
}

function xmlText(xml: string, tag: string): string[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  return Array.from(doc.getElementsByTagName(tag)).map((n) => n.textContent ?? "");
}

export async function wordToPdf(files: File[], _o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  onProgress(20, "Reading document");
  const zip = await unzip(files[0]);
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) throw new Error("This does not look like a valid .docx file.");
  const xml = new DOMParser().parseFromString(docXml, "application/xml");
  const paras = Array.from(xml.getElementsByTagName("w:p"));
  const paragraphs = paras.map((p) => {
    const runs = Array.from(p.getElementsByTagName("w:t")).map((t) => t.textContent ?? "");
    const style = p.getElementsByTagName("w:pStyle")[0]?.getAttribute("w:val") ?? "";
    const heading = /heading|title/i.test(style);
    return { text: runs.join(""), bold: heading, size: heading ? 16 : 11 };
  });
  onProgress(60, "Building PDF");
  const bytes = await paragraphsToPdf(paragraphs.length ? paragraphs : [{ text: "(empty document)" }]);
  const base = files[0].name.replace(/\.(docx?|DOCX?)$/i, "");
  onProgress(100, "Done");
  return { files: [{ name: `${base}.pdf`, blob: pdfBlob(bytes), size: bytes.length }], meta: [{ label: "Paragraphs", value: String(paragraphs.length) }] };
}

export async function excelToPdf(files: File[], _o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  onProgress(20, "Reading workbook");
  const zip = await unzip(files[0]);
  const sharedXml = (await zip.file("xl/sharedStrings.xml")?.async("string")) ?? "";
  const shared = xmlText(sharedXml, "t");
  const sheetFiles = Object.keys(zip.files).filter((f) => /^xl\/worksheets\/sheet\d+\.xml$/.test(f)).sort();
  if (!sheetFiles.length) throw new Error("No worksheets found in this spreadsheet.");

  const paragraphs: { text: string; bold?: boolean; size?: number }[] = [];
  for (let s = 0; s < sheetFiles.length; s++) {
    const sheetXml = (await zip.file(sheetFiles[s])?.async("string")) ?? "";
    const dom = new DOMParser().parseFromString(sheetXml, "application/xml");
    paragraphs.push({ text: `Sheet ${s + 1}`, bold: true, size: 15 });
    const rows = Array.from(dom.getElementsByTagName("row"));
    for (const row of rows) {
      const cells = Array.from(row.getElementsByTagName("c")).map((c) => {
        const v = c.getElementsByTagName("v")[0]?.textContent ?? "";
        if (c.getAttribute("t") === "s") return shared[Number(v)] ?? "";
        return v;
      });
      paragraphs.push({ text: cells.join("   |   "), size: 10 });
    }
    paragraphs.push({ text: "" });
  }
  onProgress(65, "Building PDF");
  const bytes = await paragraphsToPdf(paragraphs);
  const base = files[0].name.replace(/\.(xlsx?|XLSX?)$/i, "");
  onProgress(100, "Done");
  return { files: [{ name: `${base}.pdf`, blob: pdfBlob(bytes), size: bytes.length }], meta: [{ label: "Sheets", value: String(sheetFiles.length) }] };
}

export async function pptToPdf(files: File[], _o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  onProgress(20, "Reading presentation");
  const zip = await unzip(files[0]);
  const slideFiles = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)/)?.[1] ?? 0);
      const nb = Number(b.match(/slide(\d+)/)?.[1] ?? 0);
      return na - nb;
    });
  if (!slideFiles.length) throw new Error("No slides found in this presentation.");

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const [pw, ph] = [720, 540]; // 4:3 slide

  for (let i = 0; i < slideFiles.length; i++) {
    onProgress(20 + (i / slideFiles.length) * 70, `Slide ${i + 1}`);
    const xml = (await zip.file(slideFiles[i])?.async("string")) ?? "";
    const texts = xmlText(xml, "a:t").filter((t) => t.trim());
    const page = doc.addPage([pw, ph]);
    page.drawRectangle({ x: 0, y: 0, width: pw, height: ph, color: rgb(1, 1, 1) });
    page.drawText(`Slide ${i + 1}`, { x: 40, y: ph - 50, size: 12, font: bold, color: rgb(0.42, 0.16, 0.85) });
    let y = ph - 90;
    texts.forEach((t, idx) => {
      if (y < 40) return;
      const size = idx === 0 ? 22 : 14;
      const f = idx === 0 ? bold : font;
      const clipped = t.length > 90 ? t.slice(0, 87) + "…" : t;
      page.drawText(clipped, { x: 40, y, size, font: f, color: rgb(0.1, 0.1, 0.14) });
      y -= size * 1.7;
    });
  }
  onProgress(95, "Saving");
  const bytes = await doc.save();
  const base = files[0].name.replace(/\.(pptx?|PPTX?)$/i, "");
  onProgress(100, "Done");
  return { files: [{ name: `${base}.pdf`, blob: pdfBlob(bytes), size: bytes.length }], meta: [{ label: "Slides", value: String(slideFiles.length) }] };
}

export async function htmlToPdf(files: File[], _o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  onProgress(25, "Reading HTML");
  const text = await files[0].text();
  const dom = new DOMParser().parseFromString(text, "text/html");
  dom.querySelectorAll("script,style,noscript").forEach((n) => n.remove());
  const blocks: { text: string; bold?: boolean; size?: number }[] = [];
  dom.body.querySelectorAll("h1,h2,h3,h4,p,li,blockquote,td,th").forEach((el) => {
    const content = el.textContent?.replace(/\s+/g, " ").trim();
    if (!content) return;
    const tag = el.tagName.toLowerCase();
    const heading = tag.startsWith("h");
    blocks.push({ text: (tag === "li" ? "• " : "") + content, bold: heading, size: tag === "h1" ? 20 : tag === "h2" ? 16 : heading ? 14 : 11 });
  });
  if (!blocks.length) blocks.push({ text: dom.body.textContent?.trim() || "(no readable content)" });
  onProgress(65, "Building PDF");
  const bytes = await paragraphsToPdf(blocks);
  const base = files[0].name.replace(/\.html?$/i, "");
  onProgress(100, "Done");
  return { files: [{ name: `${base}.pdf`, blob: pdfBlob(bytes), size: bytes.length }] };
}
