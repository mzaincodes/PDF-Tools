import { PDFDocument } from "pdf-lib";
import type { ProcessResult, ProcessProgress } from "@/types";
import { loadPdfDocument, renderPage } from "./pdfjs";
import { pdfBlob } from "./helpers";

type Opts = Record<string, string | number | boolean>;

export async function ocr(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  const language = String(o.language ?? "eng");
  const output = String(o.output ?? "searchable");
  const base = files[0].name.replace(/\.pdf$/i, "");

  onProgress(4, "Loading recognition engine");
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(language, 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        onProgress(Math.min(95, 10 + m.progress * 80), "Recognizing text");
      }
    },
  });

  try {
    const doc = await loadPdfDocument(await files[0].arrayBuffer());
    const total = doc.numPages;

    if (output === "text") {
      let all = "";
      for (let i = 1; i <= total; i++) {
        onProgress(10 + ((i - 1) / total) * 80, `Reading page ${i} of ${total}`);
        const { dataUrl } = await renderPage(doc, i, 2, "image/jpeg", 0.9);
        const { data } = await worker.recognize(dataUrl);
        all += `--- Page ${i} ---\n${data.text.trim()}\n\n`;
      }
      await doc.destroy();
      await worker.terminate();
      const blob = new Blob([all], { type: "text/plain" });
      onProgress(100, "Done");
      return {
        files: [{ name: `${base}-ocr.txt`, blob, size: blob.size }],
        meta: [{ label: "Pages read", value: String(total) }],
        message: "Text recognized from your scanned pages.",
      };
    }

    // Searchable PDF: OCR each page to a single-page searchable PDF, then merge.
    const merged = await PDFDocument.create();
    for (let i = 1; i <= total; i++) {
      onProgress(10 + ((i - 1) / total) * 82, `Processing page ${i} of ${total}`);
      const { dataUrl } = await renderPage(doc, i, 2, "image/jpeg", 0.85);
      const { data } = await worker.recognize(dataUrl, {}, { pdf: true });
      const pdfBytes = data.pdf as unknown as number[] | Uint8Array | undefined;
      if (!pdfBytes) continue;
      const bytes = pdfBytes instanceof Uint8Array ? pdfBytes : Uint8Array.from(pdfBytes);
      const src = await PDFDocument.load(bytes);
      const [page] = await merged.copyPages(src, [0]);
      merged.addPage(page);
    }
    await doc.destroy();
    await worker.terminate();
    onProgress(96, "Saving");
    const out = await merged.save();
    onProgress(100, "Done");
    return {
      files: [{ name: `${base}-searchable.pdf`, blob: pdfBlob(out), size: out.length }],
      meta: [{ label: "Pages", value: String(total) }],
      message: "Your PDF is now searchable and selectable.",
    };
  } catch (err) {
    await worker.terminate().catch(() => {});
    throw err;
  }
}
