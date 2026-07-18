import type { ToolProcessor } from "@/types";
import * as ops from "./operations";
import * as convert from "./convert";
import * as inspect from "./inspect";
import * as security from "./security";
import { ocr } from "./ocr";

/**
 * Central map of processor id -> client-side processing function.
 * Every function runs entirely in the browser. Nothing is uploaded.
 */
export const PROCESSORS: Record<string, ToolProcessor> = {
  // organize
  merge: ops.merge,
  split: ops.split,
  rotate: ops.rotate,
  deletePages: ops.deletePages,
  extractPages: ops.extractPages,
  crop: ops.crop,
  addBlankPages: ops.addBlankPages,
  addPageNumbers: ops.addPageNumbers,
  duplicatePage: ops.duplicatePage,
  replacePage: ops.replacePage,
  compress: ops.compress,
  // edit
  watermark: ops.watermark,
  // forms
  flatten: ops.flatten,
  clearForm: ops.clearForm,
  // security
  protect: security.protect,
  encrypt: security.encrypt,
  unlock: security.unlock,
  permissions: security.permissions,
  removeMetadata: security.removeMetadata,
  // ocr / extraction
  ocr,
  extractText: convert.extractText,
  extractImages: inspect.extractImages,
  // convert
  pdfToImages: convert.pdfToImages,
  imagesToPdf: convert.imagesToPdf,
  pdfToWord: convert.pdfToWord,
  wordToPdf: convert.wordToPdf,
  excelToPdf: convert.excelToPdf,
  pptToPdf: convert.pptToPdf,
  pdfToHtml: convert.pdfToHtml,
  htmlToPdf: convert.htmlToPdf,
  // utilities
  docInfo: inspect.docInfo,
  pageSizes: inspect.pageSizes,
  thumbnails: inspect.thumbnails,
};

export function getProcessor(id?: string): ToolProcessor | undefined {
  return id ? PROCESSORS[id] : undefined;
}
