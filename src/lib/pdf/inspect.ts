import { PDFDocument } from "pdf-lib";
import { OPS } from "pdfjs-dist";
import JSZip from "jszip";
import type { ProcessResult, ProcessProgress } from "@/types";
import { loadPdfDocument } from "./pdfjs";
import { detectFormat, ptToMm } from "./helpers";
import { formatBytes } from "@/lib/utils";

type Opts = Record<string, string | number | boolean>;

/* ------------------------------------------------------------------ */
/* DOCUMENT INFORMATION                                                */
/* ------------------------------------------------------------------ */
export async function docInfo(files: File[], _o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  onProgress(30, "Inspecting");
  const bytes = await files[0].arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  const fmt = (d?: Date) => (d ? d.toLocaleString() : "—");
  const first = doc.getPageCount() ? doc.getPage(0).getSize() : { width: 0, height: 0 };

  onProgress(70, "Reading metadata");
  let producer = "";
  try {
    const meta = await (await loadPdfDocument(bytes.slice(0))).getMetadata();
    producer = (meta.info as { Producer?: string })?.Producer ?? "";
  } catch {
    /* ignore */
  }

  onProgress(100, "Done");
  return {
    files: [],
    message: files[0].name,
    meta: [
      { label: "File name", value: files[0].name },
      { label: "File size", value: formatBytes(files[0].size) },
      { label: "Pages", value: String(doc.getPageCount()) },
      { label: "PDF is encrypted", value: doc.isEncrypted ? "Yes" : "No" },
      { label: "Title", value: doc.getTitle() || "—" },
      { label: "Author", value: doc.getAuthor() || "—" },
      { label: "Subject", value: doc.getSubject() || "—" },
      { label: "Keywords", value: doc.getKeywords() || "—" },
      { label: "Creator", value: doc.getCreator() || "—" },
      { label: "Producer", value: doc.getProducer() || producer || "—" },
      { label: "Created", value: fmt(doc.getCreationDate()) },
      { label: "Modified", value: fmt(doc.getModificationDate()) },
      { label: "First page size", value: `${Math.round(first.width)} × ${Math.round(first.height)} pt` },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* PAGE SIZE DETECTION                                                 */
/* ------------------------------------------------------------------ */
export async function pageSizes(files: File[], _o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  onProgress(40, "Measuring");
  const doc = await PDFDocument.load(await files[0].arrayBuffer(), { ignoreEncryption: true });
  const groups = new Map<string, number>();
  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const fmt = detectFormat(width, height);
    const key = `${fmt} · ${Math.round(width)}×${Math.round(height)} pt · ${ptToMm(width)}×${ptToMm(height)} mm`;
    groups.set(key, (groups.get(key) ?? 0) + 1);
  });
  onProgress(100, "Done");
  return {
    files: [],
    message: `${doc.getPageCount()} pages measured`,
    meta: [
      { label: "Total pages", value: String(doc.getPageCount()) },
      ...Array.from(groups.entries()).map(([k, v]) => ({ label: `${v} page${v > 1 ? "s" : ""}`, value: k })),
    ],
  };
}

/* ------------------------------------------------------------------ */
/* THUMBNAIL GENERATOR                                                 */
/* ------------------------------------------------------------------ */
export async function thumbnails(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  const targetWidth = Number(o.width ?? 320);
  const doc = await loadPdfDocument(await files[0].arrayBuffer());
  const zip = new JSZip();
  const base = files[0].name.replace(/\.pdf$/i, "");
  const total = doc.numPages;

  for (let i = 1; i <= total; i++) {
    onProgress((i / total) * 92, `Rendering page ${i}`);
    const page = await doc.getPage(i);
    const unscaled = page.getViewport({ scale: 1 });
    const scale = targetWidth / unscaled.width;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png")
    );
    zip.file(`${base}-thumb-${String(i).padStart(3, "0")}.png`, blob);
    canvas.width = 0;
    canvas.height = 0;
  }
  await doc.destroy();
  onProgress(96, "Zipping");
  const blob = await zip.generateAsync({ type: "blob" });
  onProgress(100, "Done");
  return {
    files: [{ name: `${base}-thumbnails.zip`, blob, size: blob.size }],
    meta: [{ label: "Thumbnails", value: String(total) }],
  };
}

/* ------------------------------------------------------------------ */
/* EXTRACT IMAGES                                                      */
/* ------------------------------------------------------------------ */
function getImageObject(page: { objs: { has(n: string): boolean; get(n: string, cb?: (v: unknown) => void): unknown } }, name: string): Promise<unknown> {
  return new Promise((resolve) => {
    try {
      if (page.objs.has(name)) {
        resolve(page.objs.get(name));
      } else {
        page.objs.get(name, resolve);
      }
    } catch {
      resolve(null);
    }
  });
}

async function imageToPngBlob(img: unknown): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Newer pdf.js may hand back an ImageBitmap.
  const anyImg = img as { width?: number; height?: number; kind?: number; data?: Uint8Array | Uint8ClampedArray; bitmap?: ImageBitmap };
  const bitmap = anyImg.bitmap ?? (typeof ImageBitmap !== "undefined" && img instanceof ImageBitmap ? img : null);
  if (bitmap) {
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    ctx.drawImage(bitmap, 0, 0);
  } else if (anyImg.data && anyImg.width && anyImg.height) {
    const { width, height, data } = anyImg;
    const bpp = data.length / (width * height);
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let p = 0; p < width * height; p++) {
      if (bpp >= 4) {
        rgba[p * 4] = data[p * 4];
        rgba[p * 4 + 1] = data[p * 4 + 1];
        rgba[p * 4 + 2] = data[p * 4 + 2];
        rgba[p * 4 + 3] = data[p * 4 + 3];
      } else if (bpp >= 3) {
        rgba[p * 4] = data[p * 3];
        rgba[p * 4 + 1] = data[p * 3 + 1];
        rgba[p * 4 + 2] = data[p * 3 + 2];
        rgba[p * 4 + 3] = 255;
      } else {
        const g = data[p];
        rgba[p * 4] = g;
        rgba[p * 4 + 1] = g;
        rgba[p * 4 + 2] = g;
        rgba[p * 4 + 3] = 255;
      }
    }
    canvas.width = width;
    canvas.height = height;
    ctx.putImageData(new ImageData(rgba, width, height), 0, 0);
  } else {
    return null;
  }
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  canvas.width = 0;
  canvas.height = 0;
  return blob;
}

export async function extractImages(files: File[], _o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  const doc = await loadPdfDocument(await files[0].arrayBuffer());
  const zip = new JSZip();
  const base = files[0].name.replace(/\.pdf$/i, "");
  let count = 0;

  for (let i = 1; i <= doc.numPages; i++) {
    onProgress((i / doc.numPages) * 90, `Scanning page ${i}`);
    const page = await doc.getPage(i);
    const ops = await page.getOperatorList();
    const names = new Set<string>();
    for (let j = 0; j < ops.fnArray.length; j++) {
      if (ops.fnArray[j] === OPS.paintImageXObject || ops.fnArray[j] === OPS.paintImageXObjectRepeat) {
        const arg = ops.argsArray[j]?.[0];
        if (typeof arg === "string") names.add(arg);
      }
    }
    for (const name of names) {
      const img = await getImageObject(page as never, name);
      if (!img) continue;
      const blob = await imageToPngBlob(img);
      if (blob && blob.size > 128) {
        count++;
        zip.file(`${base}-p${i}-img${count}.png`, blob);
      }
    }
    page.cleanup();
  }
  await doc.destroy();

  if (!count) {
    throw new Error(
      "No extractable embedded images were found. If this is a scanned document, try PDF to JPG to export the pages as images."
    );
  }
  onProgress(96, "Zipping");
  const blob = await zip.generateAsync({ type: "blob" });
  onProgress(100, "Done");
  return {
    files: [{ name: `${base}-images.zip`, blob, size: blob.size }],
    meta: [{ label: "Images extracted", value: String(count) }],
  };
}
