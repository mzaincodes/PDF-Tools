import { PDFDocument as CantooPDF } from "@cantoo/pdf-lib";
import { PDFDocument } from "pdf-lib";
import type { ProcessResult, ProcessProgress } from "@/types";
import { pdfBlob } from "./helpers";

type Opts = Record<string, string | number | boolean>;

/* ------------------------------------------------------------------ */
/* PROTECT (user password)                                             */
/* ------------------------------------------------------------------ */
export async function protect(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  const password = String(o.password ?? "").trim();
  if (!password) throw new Error("Please enter a password.");
  if (password.length < 3) throw new Error("Use a password with at least 3 characters.");
  onProgress(30, "Loading");
  const doc = await CantooPDF.load(await files[0].arrayBuffer(), { ignoreEncryption: true });
  onProgress(65, "Encrypting");
  doc.encrypt({ userPassword: password, ownerPassword: password, permissions: { printing: "highResolution" } });
  const bytes = await doc.save();
  onProgress(100, "Done");
  return {
    files: [{ name: "protected.pdf", blob: pdfBlob(bytes), size: bytes.length }],
    meta: [{ label: "Encryption", value: "Password applied" }],
    message: "Your PDF is now password-protected.",
  };
}

/* ------------------------------------------------------------------ */
/* ENCRYPT (user + owner password)                                     */
/* ------------------------------------------------------------------ */
export async function encrypt(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  const userPassword = String(o.userPassword ?? "").trim();
  const ownerPassword = String(o.ownerPassword ?? "").trim();
  if (!userPassword) throw new Error("Please enter a user password (required to open the PDF).");
  onProgress(30, "Loading");
  const doc = await CantooPDF.load(await files[0].arrayBuffer(), { ignoreEncryption: true });
  onProgress(65, "Encrypting");
  doc.encrypt({
    userPassword,
    ownerPassword: ownerPassword || userPassword,
    permissions: { printing: "highResolution", modifying: false },
  });
  const bytes = await doc.save();
  onProgress(100, "Done");
  return {
    files: [{ name: "encrypted.pdf", blob: pdfBlob(bytes), size: bytes.length }],
    meta: [{ label: "Encryption", value: "AES applied" }],
  };
}

/* ------------------------------------------------------------------ */
/* UNLOCK / DECRYPT                                                    */
/* ------------------------------------------------------------------ */
export async function unlock(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  const password = String(o.password ?? "");
  onProgress(30, "Decrypting");
  let doc: CantooPDF;
  try {
    doc = await CantooPDF.load(await files[0].arrayBuffer(), { password });
  } catch {
    throw new Error("Could not open the PDF. Please check the password and try again.");
  }
  onProgress(70, "Saving");
  // The source keeps its security handler, so copy the decrypted pages into a
  // fresh document that has no encryption at all.
  const out = await CantooPDF.create();
  const pages = await out.copyPages(doc, doc.getPageIndices());
  pages.forEach((p) => out.addPage(p));
  try {
    out.setTitle(doc.getTitle() ?? "");
    out.setAuthor(doc.getAuthor() ?? "");
  } catch {
    /* ignore metadata copy issues */
  }
  const bytes = await out.save();
  onProgress(100, "Done");
  return {
    files: [{ name: "unlocked.pdf", blob: pdfBlob(bytes), size: bytes.length }],
    message: "Password removed. This PDF now opens without a prompt.",
  };
}

/* ------------------------------------------------------------------ */
/* PERMISSION SETTINGS                                                 */
/* ------------------------------------------------------------------ */
export async function permissions(files: File[], o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  const ownerPassword = String(o.ownerPassword ?? "").trim();
  if (!ownerPassword) throw new Error("Set an owner password — it's required to enforce permissions.");
  onProgress(30, "Loading");
  const doc = await CantooPDF.load(await files[0].arrayBuffer(), { ignoreEncryption: true });
  onProgress(65, "Applying permissions");
  doc.encrypt({
    ownerPassword,
    permissions: {
      printing: o.allowPrinting !== false ? "highResolution" : undefined,
      copying: o.allowCopying === true,
      modifying: o.allowModifying === true,
    },
  });
  const bytes = await doc.save();
  onProgress(100, "Done");
  return {
    files: [{ name: "restricted.pdf", blob: pdfBlob(bytes), size: bytes.length }],
    meta: [
      { label: "Printing", value: o.allowPrinting !== false ? "Allowed" : "Blocked" },
      { label: "Copying", value: o.allowCopying === true ? "Allowed" : "Blocked" },
      { label: "Editing", value: o.allowModifying === true ? "Allowed" : "Blocked" },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* REMOVE METADATA                                                     */
/* ------------------------------------------------------------------ */
export async function removeMetadata(files: File[], _o: Opts, onProgress: ProcessProgress): Promise<ProcessResult> {
  onProgress(30, "Loading");
  const doc = await PDFDocument.load(await files[0].arrayBuffer(), { ignoreEncryption: true });
  onProgress(60, "Stripping metadata");
  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setProducer("");
  doc.setCreator("");
  try {
    doc.setCreationDate(new Date(0));
    doc.setModificationDate(new Date(0));
  } catch {
    /* ignore */
  }
  const bytes = await doc.save();
  onProgress(100, "Done");
  return {
    files: [{ name: "clean.pdf", blob: pdfBlob(bytes), size: bytes.length }],
    message: "All document metadata has been removed.",
  };
}
