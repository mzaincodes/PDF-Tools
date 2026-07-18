"use client";

import * as React from "react";
import { getTool } from "@/lib/tools";
import { takePendingFiles } from "@/lib/file-transfer";
import { UploadZone } from "./upload-zone";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface UploadGateProps {
  slug: string;
  cta?: string;
  children: (files: File[], reset: () => void) => React.ReactNode;
}

/** Shows an upload area until enough files are provided, then renders the tool UI. */
export function UploadGate({ slug, cta = "Continue", children }: UploadGateProps) {
  const tool = getTool(slug);
  const [files, setFiles] = React.useState<File[]>([]);
  const [ready, setReady] = React.useState(false);
  const minFiles = tool?.minFiles ?? 1;

  React.useEffect(() => {
    if (!tool) return;
    const pending = takePendingFiles();
    if (pending?.length) {
      const ok = pending.filter(
        (f) =>
          tool.accept.some(
            (m) => f.type === m || (m === "application/pdf" && f.name.toLowerCase().endsWith(".pdf"))
          )
      );
      if (ok.length >= minFiles) {
        setFiles(tool.multiple ? ok : ok.slice(0, 1));
        setReady(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!tool) return null;

  if (ready && files.length >= minFiles) {
    return (
      <>
        {children(files, () => {
          setFiles([]);
          setReady(false);
        })}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-3xl border bg-card/60 p-5 shadow-soft-lg backdrop-blur sm:p-8">
      <UploadZone tool={tool} files={files} onChange={setFiles} />
      {files.length >= minFiles && (
        <div className="flex justify-end">
          <Button size="lg" variant="gradient" onClick={() => setReady(true)}>
            {cta}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
