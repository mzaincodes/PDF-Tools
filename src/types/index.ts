import type { LucideIcon } from "lucide-react";

export type CategoryId =
  | "organize"
  | "edit"
  | "forms"
  | "security"
  | "ocr"
  | "convert"
  | "utilities";

export interface ToolCategory {
  id: CategoryId;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  /** tailwind gradient stops for the category accent */
  gradient: string;
}

/**
 * How a tool is fulfilled in the browser.
 * - processor : takes files + options, runs a pure client-side function, returns downloadable output.
 * - editor    : opens the full canvas editor.
 * - viewer    : opens the PDF viewer / inspector.
 */
export type ToolHandler = "processor" | "editor" | "viewer";

export type OptionType =
  | "select"
  | "radio"
  | "text"
  | "number"
  | "range"
  | "switch"
  | "page-range"
  | "color"
  | "password";

export interface ToolOption {
  id: string;
  label: string;
  type: OptionType;
  default?: string | number | boolean;
  help?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { label: string; value: string; description?: string }[];
  /** show this option only when another option has a given value */
  showWhen?: { id: string; equals: string | number | boolean };
}

export interface ToolStep {
  title: string;
  description: string;
}

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface Tool {
  slug: string;
  title: string;
  short: string;
  description: string;
  category: CategoryId;
  icon: LucideIcon;
  handler: ToolHandler;
  /** id used to resolve the client-side processing function */
  processorId?: string;
  /** input mime/extension acceptance */
  accept: string[];
  acceptLabel: string;
  multiple?: boolean;
  minFiles?: number;
  maxFiles?: number;
  options?: ToolOption[];
  /** tailwind gradient utility for the icon tile */
  gradient: string;
  popular?: boolean;
  isNew?: boolean;
  keywords?: string[];
  steps?: ToolStep[];
  benefits?: string[];
  faqs?: ToolFaq[];
  /** output filename suffix, e.g. "merged" -> document-merged.pdf */
  outputSuffix?: string;
}

export interface ProcessResult {
  /** produced files, ready to download */
  files: { name: string; blob: Blob; size: number }[];
  /** optional summary metrics shown on the success screen */
  meta?: { label: string; value: string }[];
  message?: string;
}

export type ProcessProgress = (value: number, label?: string) => void;

export type ToolProcessor = (
  files: File[],
  options: Record<string, string | number | boolean>,
  onProgress: ProcessProgress
) => Promise<ProcessResult>;
