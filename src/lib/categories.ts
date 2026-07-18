import {
  FolderCog,
  PencilRuler,
  FileSignature,
  ShieldCheck,
  ScanText,
  Repeat,
  Wrench,
} from "lucide-react";
import type { ToolCategory } from "@/types";

export const CATEGORIES: ToolCategory[] = [
  {
    id: "organize",
    name: "Organize",
    tagline: "Essential file management",
    description:
      "Merge, split, compress and reorganize documents with pixel-perfect control — all in your browser.",
    icon: FolderCog,
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    id: "edit",
    name: "Edit",
    tagline: "Annotate & design",
    description:
      "A full annotation studio: text, images, highlights, shapes, freehand drawing and watermarks.",
    icon: PencilRuler,
    gradient: "from-violet-500 to-fuchsia-500",
  },
  {
    id: "forms",
    name: "Forms",
    tagline: "Fill, build & sign",
    description:
      "Fill interactive forms, build fillable fields and drop in a legally-styled electronic signature.",
    icon: FileSignature,
    gradient: "from-sky-500 to-indigo-500",
  },
  {
    id: "security",
    name: "Security",
    tagline: "Protect & redact",
    description:
      "Lock down sensitive documents, strip metadata and permanently redact confidential content.",
    icon: ShieldCheck,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    id: "ocr",
    name: "OCR",
    tagline: "Scan to text",
    description:
      "Turn scanned pages into searchable, selectable text and extract embedded content instantly.",
    icon: ScanText,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: "convert",
    name: "Convert",
    tagline: "To & from PDF",
    description:
      "Move seamlessly between PDF and images, text and office formats without losing fidelity.",
    icon: Repeat,
    gradient: "from-rose-500 to-pink-500",
  },
  {
    id: "utilities",
    name: "Utilities",
    tagline: "Inspect & compare",
    description:
      "View, compare, inspect and generate thumbnails — the power tools for everyday PDF work.",
    icon: Wrench,
    gradient: "from-cyan-500 to-blue-500",
  },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<ToolCategory["id"], ToolCategory>;
