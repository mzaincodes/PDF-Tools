"use client";

import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";

// Configure the worker once, using a bundler-resolved URL so it works locally
// and on Vercel without relying on any external CDN.
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
}

export { pdfjsLib };

/** Load a pdf.js document from raw bytes. */
export async function loadPdfDocument(
  data: ArrayBuffer | Uint8Array,
  password?: string
): Promise<PDFDocumentProxy> {
  const task = pdfjsLib.getDocument({
    data: data instanceof Uint8Array ? data : new Uint8Array(data),
    password,
    // Keep everything in-memory; no font/cmap fetching to external URLs.
    isEvalSupported: false,
    useSystemFonts: true,
  });
  return task.promise;
}

export interface RenderedPage {
  index: number;
  width: number;
  height: number;
  dataUrl: string;
}

/** Render a single page to a canvas at a given scale and return a data URL. */
export async function renderPage(
  doc: PDFDocumentProxy,
  pageNumber: number,
  scale = 1.5,
  type: "image/jpeg" | "image/png" = "image/jpeg",
  quality = 0.92
): Promise<RenderedPage> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: type === "image/png" });
  if (!context) throw new Error("Could not create a canvas context.");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  if (type === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  await page.render({ canvasContext: context, viewport }).promise;
  const dataUrl = canvas.toDataURL(type, quality);
  page.cleanup();
  // Free the canvas.
  canvas.width = 0;
  canvas.height = 0;
  return { index: pageNumber - 1, width: viewport.width, height: viewport.height, dataUrl };
}

/** Render a page and return an image Blob (used for zips). */
export async function renderPageBlob(
  doc: PDFDocumentProxy,
  pageNumber: number,
  scale = 1.5,
  type: "image/jpeg" | "image/png" = "image/jpeg",
  quality = 0.92
): Promise<{ blob: Blob; width: number; height: number }> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: type === "image/png" });
  if (!context) throw new Error("Could not create a canvas context.");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  if (type === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  await page.render({ canvasContext: context, viewport }).promise;
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), type, quality)
  );
  page.cleanup();
  canvas.width = 0;
  canvas.height = 0;
  return { blob, width: viewport.width, height: viewport.height };
}

/** Generate lightweight thumbnails for every page (used by the organizer & sidebar). */
export async function renderThumbnails(
  data: ArrayBuffer,
  scale = 0.4,
  onProgress?: (done: number, total: number) => void
): Promise<RenderedPage[]> {
  const doc = await loadPdfDocument(data.slice(0));
  const out: RenderedPage[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    out.push(await renderPage(doc, i, scale, "image/jpeg", 0.7));
    onProgress?.(i, doc.numPages);
  }
  await doc.destroy();
  return out;
}
