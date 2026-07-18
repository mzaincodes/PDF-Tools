import { PDFDocument, StandardFonts, degrees } from "pdf-lib";
import JSZip from "jszip";
import type { ProcessResult, ProcessProgress } from "@/types";
import { formatBytes, parsePageRanges, reductionPercent } from "@/lib/utils";
import { PAGE_SIZES, hexToRgb, pdfBlob } from "./helpers";

type Opts = Record<string, string | number | boolean>;

async function load(file: File): Promise<PDFDocument> {
  const bytes = await file.arrayBuffer();
  return PDFDocument.load(bytes, { ignoreEncryption: true });
}

/* ------------------------------------------------------------------ */
/* MERGE                                                               */
/* ------------------------------------------------------------------ */
export async function merge(files: File[], _o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  const out = await PDFDocument.create();
  let pageCount = 0;
  for (let i = 0; i < files.length; i++) {
    onProgress((i / files.length) * 90, `Merging ${files[i].name}`);
    const src = await load(files[i]);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
    pageCount += pages.length;
  }
  onProgress(95, "Finalizing");
  const bytes = await out.save();
  onProgress(100, "Done");
  return {
    files: [{ name: "merged.pdf", blob: pdfBlob(bytes), size: bytes.length }],
    meta: [
      { label: "Files merged", value: String(files.length) },
      { label: "Total pages", value: String(pageCount) },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* SPLIT                                                               */
/* ------------------------------------------------------------------ */
export async function split(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  const src = await load(files[0]);
  const total = src.getPageCount();
  const mode = String(o.mode ?? "ranges");
  const groups: number[][] = [];

  if (mode === "each") {
    for (let i = 0; i < total; i++) groups.push([i]);
  } else if (mode === "fixed") {
    const size = Math.max(1, Number(o.size ?? 2));
    for (let i = 0; i < total; i += size) {
      groups.push(Array.from({ length: Math.min(size, total - i) }, (_, k) => i + k));
    }
  } else {
    const expr = String(o.ranges ?? "").trim();
    const parts = expr.split(",").map((p) => p.trim()).filter(Boolean);
    if (!parts.length) throw new Error("Enter at least one page range, e.g. 1-3, 5.");
    for (const part of parts) {
      const nums = parsePageRanges(part, total).map((n) => n - 1);
      if (nums.length) groups.push(nums);
    }
  }

  if (!groups.length) throw new Error("No pages matched your selection.");

  const zip = new JSZip();
  const base = files[0].name.replace(/\.pdf$/i, "");
  for (let g = 0; g < groups.length; g++) {
    onProgress((g / groups.length) * 92, `Creating part ${g + 1}`);
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(src, groups[g]);
    pages.forEach((p) => doc.addPage(p));
    const bytes = await doc.save();
    const label =
      groups[g].length === 1 ? `page-${groups[g][0] + 1}` : `part-${g + 1}`;
    zip.file(`${base}-${label}.pdf`, bytes);
  }
  onProgress(96, "Zipping");
  const blob = await zip.generateAsync({ type: "blob" });
  onProgress(100, "Done");
  return {
    files: [{ name: `${base}-split.zip`, blob, size: blob.size }],
    meta: [{ label: "Output files", value: String(groups.length) }],
  };
}

/* ------------------------------------------------------------------ */
/* ROTATE                                                              */
/* ------------------------------------------------------------------ */
export async function rotate(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  onProgress(20, "Loading");
  const doc = await load(files[0]);
  const angle = Number(o.angle ?? 90);
  const total = doc.getPageCount();
  const expr = String(o.pages ?? "").trim();
  const target = expr ? new Set(parsePageRanges(expr, total)) : null;

  doc.getPages().forEach((page, idx) => {
    if (!target || target.has(idx + 1)) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + angle) % 360));
    }
  });
  onProgress(80, "Saving");
  const bytes = await doc.save();
  onProgress(100, "Done");
  return {
    files: [{ name: "rotated.pdf", blob: pdfBlob(bytes), size: bytes.length }],
    meta: [{ label: "Pages rotated", value: target ? String(target.size) : String(total) }],
  };
}

/* ------------------------------------------------------------------ */
/* DELETE PAGES                                                        */
/* ------------------------------------------------------------------ */
export async function deletePages(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  onProgress(20, "Loading");
  const doc = await load(files[0]);
  const total = doc.getPageCount();
  const toDelete = parsePageRanges(String(o.pages ?? ""), total);
  if (!toDelete.length) throw new Error("Enter which pages to delete, e.g. 2, 5-7.");
  if (toDelete.length >= total) throw new Error("You can't delete every page.");
  // Remove from the end to keep indices valid.
  [...toDelete].sort((a, b) => b - a).forEach((p) => doc.removePage(p - 1));
  onProgress(80, "Saving");
  const bytes = await doc.save();
  onProgress(100, "Done");
  return {
    files: [{ name: "trimmed.pdf", blob: pdfBlob(bytes), size: bytes.length }],
    meta: [
      { label: "Pages removed", value: String(toDelete.length) },
      { label: "Pages left", value: String(total - toDelete.length) },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* EXTRACT PAGES                                                       */
/* ------------------------------------------------------------------ */
export async function extractPages(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  onProgress(20, "Loading");
  const src = await load(files[0]);
  const total = src.getPageCount();
  const keep = parsePageRanges(String(o.pages ?? ""), total);
  if (!keep.length) throw new Error("Enter which pages to extract, e.g. 1-2, 6.");
  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, keep.map((p) => p - 1));
  pages.forEach((p) => doc.addPage(p));
  onProgress(80, "Saving");
  const bytes = await doc.save();
  onProgress(100, "Done");
  return {
    files: [{ name: "extracted.pdf", blob: pdfBlob(bytes), size: bytes.length }],
    meta: [{ label: "Pages extracted", value: String(keep.length) }],
  };
}

/* ------------------------------------------------------------------ */
/* CROP                                                                */
/* ------------------------------------------------------------------ */
export async function crop(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  onProgress(20, "Loading");
  const doc = await load(files[0]);
  const margin = Number(o.margin ?? 24);
  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const m = Math.min(margin, width / 2 - 10, height / 2 - 10);
    if (m > 0) {
      page.setCropBox(m, m, width - m * 2, height - m * 2);
    }
  });
  onProgress(80, "Saving");
  const bytes = await doc.save();
  onProgress(100, "Done");
  return {
    files: [{ name: "cropped.pdf", blob: pdfBlob(bytes), size: bytes.length }],
    meta: [{ label: "Margin trimmed", value: `${margin} pt` }],
  };
}

/* ------------------------------------------------------------------ */
/* ADD BLANK PAGES                                                     */
/* ------------------------------------------------------------------ */
export async function addBlankPages(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  onProgress(20, "Loading");
  const doc = await load(files[0]);
  const position = Math.max(0, Number(o.position ?? 1));
  const count = Math.max(1, Number(o.count ?? 1));
  const sizeKey = String(o.size ?? "match");
  const first = doc.getPage(0);
  const [w, h] =
    sizeKey === "match" ? [first.getWidth(), first.getHeight()] : PAGE_SIZES[sizeKey] ?? PAGE_SIZES.a4;

  for (let i = 0; i < count; i++) {
    const page = doc.insertPage(Math.min(position + i, doc.getPageCount()));
    page.setSize(w, h);
  }
  onProgress(80, "Saving");
  const bytes = await doc.save();
  onProgress(100, "Done");
  return {
    files: [{ name: "with-pages.pdf", blob: pdfBlob(bytes), size: bytes.length }],
    meta: [{ label: "Blank pages added", value: String(count) }],
  };
}

/* ------------------------------------------------------------------ */
/* ADD PAGE NUMBERS                                                    */
/* ------------------------------------------------------------------ */
export async function addPageNumbers(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  onProgress(15, "Loading");
  const doc = await load(files[0]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const position = String(o.position ?? "bottom-center");
  const format = String(o.format ?? "n");
  const start = Number(o.start ?? 1);
  const size = Number(o.size ?? 11);
  const pages = doc.getPages();
  const total = pages.length;

  pages.forEach((page, idx) => {
    const n = start + idx;
    let text = String(n);
    if (format === "page-n") text = `Page ${n}`;
    else if (format === "n-of-total") text = `${n} of ${total}`;
    else if (format === "page-n-of-total") text = `Page ${n} of ${total}`;

    const { width, height } = page.getSize();
    const tw = font.widthOfTextAtSize(text, size);
    const pad = 28;
    const isTop = position.startsWith("top");
    const y = isTop ? height - pad - size : pad;
    let x = width / 2 - tw / 2;
    if (position.endsWith("left")) x = pad;
    else if (position.endsWith("right")) x = width - pad - tw;

    page.drawText(text, { x, y, size, font, color: hexToRgb("#334155") });
  });
  onProgress(85, "Saving");
  const bytes = await doc.save();
  onProgress(100, "Done");
  return {
    files: [{ name: "numbered.pdf", blob: pdfBlob(bytes), size: bytes.length }],
    meta: [{ label: "Pages numbered", value: String(total) }],
  };
}

/* ------------------------------------------------------------------ */
/* DUPLICATE PAGE                                                      */
/* ------------------------------------------------------------------ */
export async function duplicatePage(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  onProgress(20, "Loading");
  const doc = await load(files[0]);
  const total = doc.getPageCount();
  const target = Math.min(Math.max(1, Number(o.page ?? 1)), total);
  const times = Math.max(1, Number(o.times ?? 1));
  const [copied] = await doc.copyPages(doc, [target - 1]);
  // Insert copies right after the source page.
  for (let i = 0; i < times; i++) {
    const clone = i === 0 ? copied : (await doc.copyPages(doc, [target - 1]))[0];
    doc.insertPage(target + i, clone);
  }
  onProgress(80, "Saving");
  const bytes = await doc.save();
  onProgress(100, "Done");
  return {
    files: [{ name: "duplicated.pdf", blob: pdfBlob(bytes), size: bytes.length }],
    meta: [{ label: "Copies inserted", value: String(times) }],
  };
}

/* ------------------------------------------------------------------ */
/* REPLACE PAGE (two documents)                                        */
/* ------------------------------------------------------------------ */
export async function replacePage(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  if (files.length < 2) throw new Error("Upload the base PDF and a second PDF with the replacement page.");
  onProgress(20, "Loading");
  const base = await load(files[0]);
  const donor = await load(files[1]);
  const targetIdx = Math.min(Math.max(1, Number(o.target ?? 1)), base.getPageCount()) - 1;
  const sourceIdx = Math.min(Math.max(1, Number(o.source ?? 1)), donor.getPageCount()) - 1;
  const [newPage] = await base.copyPages(donor, [sourceIdx]);
  base.insertPage(targetIdx, newPage);
  base.removePage(targetIdx + 1);
  onProgress(80, "Saving");
  const bytes = await base.save();
  onProgress(100, "Done");
  return {
    files: [{ name: "replaced.pdf", blob: pdfBlob(bytes), size: bytes.length }],
    meta: [{ label: "Replaced page", value: String(targetIdx + 1) }],
  };
}

/* ------------------------------------------------------------------ */
/* WATERMARK                                                           */
/* ------------------------------------------------------------------ */
export async function watermark(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  onProgress(15, "Loading");
  const doc = await load(files[0]);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const text = String(o.text ?? "CONFIDENTIAL") || "CONFIDENTIAL";
  const opacity = Number(o.opacity ?? 20) / 100;
  const angle = Number(o.angle ?? 45);
  const size = Number(o.size ?? 60);
  const color = hexToRgb(String(o.color ?? "#7c3aed"));

  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const tw = font.widthOfTextAtSize(text, size);
    const rad = (angle * Math.PI) / 180;
    // Center the rotated text roughly on the page.
    const x = width / 2 - (tw / 2) * Math.cos(rad);
    const y = height / 2 - (tw / 2) * Math.sin(rad);
    page.drawText(text, { x, y, size, font, color, opacity, rotate: degrees(angle) });
  });
  onProgress(85, "Saving");
  const bytes = await doc.save();
  onProgress(100, "Done");
  return {
    files: [{ name: "watermarked.pdf", blob: pdfBlob(bytes), size: bytes.length }],
    meta: [{ label: "Watermark", value: text }],
  };
}

/* ------------------------------------------------------------------ */
/* FLATTEN                                                             */
/* ------------------------------------------------------------------ */
export async function flatten(files: File[], _o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  onProgress(25, "Loading");
  const doc = await load(files[0]);
  try {
    doc.getForm().flatten();
  } catch {
    // No form present — nothing to flatten, still re-save.
  }
  onProgress(80, "Saving");
  const bytes = await doc.save();
  onProgress(100, "Done");
  return { files: [{ name: "flattened.pdf", blob: pdfBlob(bytes), size: bytes.length }] };
}

/* ------------------------------------------------------------------ */
/* CLEAR FORM FIELDS                                                   */
/* ------------------------------------------------------------------ */
export async function clearForm(files: File[], _o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  onProgress(25, "Loading");
  const doc = await load(files[0]);
  const form = doc.getForm();
  const fields = form.getFields();
  if (!fields.length) throw new Error("This PDF has no interactive form fields to clear.");
  let cleared = 0;
  for (const field of fields) {
    const type = field.constructor.name;
    try {
      if (type === "PDFTextField") (field as ReturnType<typeof form.getTextField>).setText("");
      else if (type === "PDFCheckBox") (field as ReturnType<typeof form.getCheckBox>).uncheck();
      else if (type === "PDFDropdown") (field as ReturnType<typeof form.getDropdown>).clear?.();
      else if (type === "PDFRadioGroup") (field as ReturnType<typeof form.getRadioGroup>).clear?.();
      cleared++;
    } catch {
      /* skip unsupported field */
    }
  }
  onProgress(85, "Saving");
  const bytes = await doc.save();
  onProgress(100, "Done");
  return {
    files: [{ name: "cleared.pdf", blob: pdfBlob(bytes), size: bytes.length }],
    meta: [{ label: "Fields cleared", value: String(cleared) }],
  };
}

/* ------------------------------------------------------------------ */
/* COMPRESS                                                            */
/* ------------------------------------------------------------------ */
export async function compress(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  const level = String(o.level ?? "balanced");
  const original = files[0].size;
  onProgress(20, "Analyzing");

  // Text-based structural optimization via pdf-lib re-serialization with object streams.
  const doc = await load(files[0]);
  doc.setTitle(doc.getTitle() ?? "");
  onProgress(55, "Optimizing");
  let bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });

  // For image-heavy documents, an optional rasterization pass gives large savings.
  if (level !== "light") {
    onProgress(65, "Compressing images");
    const { rasterizeCompress } = await import("./raster");
    const scale = level === "strong" ? 1.1 : 1.4;
    const quality = level === "strong" ? 0.55 : 0.72;
    try {
      const rasterized = await rasterizeCompress(await files[0].arrayBuffer(), scale, quality, (p) =>
        onProgress(65 + p * 0.3, "Compressing images")
      );
      // Keep whichever result is smaller.
      if (rasterized.length < bytes.length) bytes = rasterized;
    } catch {
      /* fall back to structural compression only */
    }
  }

  onProgress(100, "Done");
  const saved = reductionPercent(original, bytes.length);
  return {
    files: [{ name: "compressed.pdf", blob: pdfBlob(bytes), size: bytes.length }],
    meta: [
      { label: "Original", value: formatBytes(original) },
      { label: "Compressed", value: formatBytes(bytes.length) },
      { label: "Saved", value: `${saved}%` },
    ],
    message: saved > 0 ? `Reduced file size by ${saved}%.` : "Already well optimized — minimal change.",
  };
}

/* ------------------------------------------------------------------ */
/* ORGANIZE (called by the interactive organizer)                      */
/* ------------------------------------------------------------------ */
export interface OrganizePlan {
  /** original page index (0-based) */
  index: number;
  /** extra rotation to apply in degrees */
  rotation: number;
}

export async function applyOrganize(file: File, plan: OrganizePlan[]): Promise<Uint8Array> {
  const src = await load(file);
  const out = await PDFDocument.create();
  const copied = await out.copyPages(
    src,
    plan.map((p) => p.index)
  );
  copied.forEach((page, i) => {
    const extra = plan[i].rotation % 360;
    if (extra) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + extra) % 360));
    }
    out.addPage(page);
  });
  return out.save();
}
