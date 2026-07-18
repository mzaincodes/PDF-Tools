"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { getTool } from "@/lib/tools";
import { ToolWorkspace } from "./tool-workspace";
import { UploadGate } from "./upload-gate";

const EditorLoading = () => (
  <div className="flex items-center justify-center rounded-3xl border bg-card/60 py-24">
    <Loader2 className="h-7 w-7 animate-spin text-primary" />
  </div>
);

const PdfEditor = dynamic(() => import("@/components/editor/pdf-editor").then((m) => m.PdfEditor), {
  ssr: false,
  loading: EditorLoading,
});
const PdfViewer = dynamic(() => import("./pdf-viewer").then((m) => m.PdfViewer), {
  ssr: false,
  loading: EditorLoading,
});
const OrganizeTool = dynamic(() => import("./organize-tool").then((m) => m.OrganizeTool), {
  ssr: false,
  loading: EditorLoading,
});
const CompareTool = dynamic(() => import("./compare-tool").then((m) => m.CompareTool), {
  ssr: false,
  loading: EditorLoading,
});

// Which editor tool should be active when a specific edit/form tool is opened.
const EDITOR_TOOL: Record<string, string> = {
  "edit-text": "select",
  "add-text-box": "text",
  highlight: "highlight",
  underline: "line",
  "strike-through": "line",
  "add-images": "image",
  whiteout: "whiteout",
  "draw-shapes": "rect",
  freehand: "draw",
  "sticky-notes": "note",
  "link-inserter": "text",
  redact: "redact",
  "fill-forms": "text",
  "create-fillable-forms": "text",
  "e-signature": "signature",
  "date-fields": "text",
  "checkbox-fields": "text",
  "radio-buttons": "text",
  "dropdown-fields": "text",
};

export function ToolRunner({ slug }: { slug: string }) {
  const tool = getTool(slug);
  if (!tool) return null;

  if (slug === "organize") {
    return <UploadGate slug={slug} cta="Organize pages">{(files, reset) => <OrganizeTool file={files[0]} onReset={reset} />}</UploadGate>;
  }

  if (slug === "compare") {
    return <UploadGate slug={slug} cta="Compare">{(files, reset) => <CompareTool files={files} onReset={reset} />}</UploadGate>;
  }

  if (tool.handler === "viewer") {
    return <UploadGate slug={slug} cta="Open document">{(files) => <PdfViewer key={files[0].name} file={files[0]} />}</UploadGate>;
  }

  if (tool.handler === "editor") {
    return (
      <UploadGate slug={slug} cta="Open in editor">
        {(files, reset) => (
          <PdfEditor
            file={files[0]}
            initialTool={(EDITOR_TOOL[slug] ?? "select") as never}
            onReset={reset}
          />
        )}
      </UploadGate>
    );
  }

  return <ToolWorkspace slug={slug} />;
}
