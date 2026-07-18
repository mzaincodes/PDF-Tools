"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Sparkles, ShieldCheck, AlertCircle, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadZone } from "./upload-zone";
import { OptionsForm, defaultOptionValues, type OptionValues } from "./options-form";
import { ResultView } from "./result-view";
import { getTool } from "@/lib/tools";
import { takePendingFiles } from "@/lib/file-transfer";
import { useRecentTools } from "@/hooks/use-tool-prefs";
import { cn } from "@/lib/utils";
import type { ProcessResult } from "@/types";

type Status = "idle" | "ready" | "processing" | "done" | "error";

export function ToolWorkspace({ slug }: { slug: string }) {
  const tool = getTool(slug);
  const { push } = useRecentTools();
  const [files, setFiles] = React.useState<File[]>([]);
  const [values, setValues] = React.useState<OptionValues>(() => (tool ? defaultOptionValues(tool) : {}));
  const [status, setStatus] = React.useState<Status>("idle");
  const [progress, setProgress] = React.useState(0);
  const [label, setLabel] = React.useState("");
  const [result, setResult] = React.useState<ProcessResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Accept a file handed over from the homepage / another tool.
  React.useEffect(() => {
    if (!tool) return;
    const pending = takePendingFiles();
    if (pending?.length) {
      const ok = pending.filter((f) => tool.accept.some((m) => f.type === m || (m === "application/pdf" && f.name.toLowerCase().endsWith(".pdf"))));
      if (ok.length) setFiles(tool.multiple ? ok : ok.slice(0, 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!tool) return null;

  const minFiles = tool.minFiles ?? 1;
  const canRun = files.length >= minFiles && status !== "processing";

  const setOption = (id: string, value: string | number | boolean) =>
    setValues((v) => ({ ...v, [id]: value }));

  const run = async () => {
    if (files.length < minFiles) {
      toast.error(`Please upload at least ${minFiles} file${minFiles > 1 ? "s" : ""}.`);
      return;
    }
    setStatus("processing");
    setProgress(0);
    setLabel("Preparing");
    setError(null);
    try {
      const { getProcessor } = await import("@/lib/pdf");
      const processor = getProcessor(tool.processorId);
      if (!processor) throw new Error("This tool is not available yet.");
      const res = await processor(files, values, (v, l) => {
        setProgress(Math.round(v));
        if (l) setLabel(l);
      });
      setResult(res);
      setStatus("done");
      push(tool.slug);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong while processing your file.";
      setError(msg);
      setStatus("error");
      toast.error(msg);
    }
  };

  const reset = () => {
    setFiles([]);
    setValues(defaultOptionValues(tool));
    setStatus("idle");
    setProgress(0);
    setResult(null);
    setError(null);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-card/60 p-5 shadow-soft-lg backdrop-blur sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      <AnimatePresence mode="wait">
        {status === "done" && result ? (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6">
            <ResultView result={result} onReset={reset} />
          </motion.div>
        ) : status === "processing" ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-16 text-center"
          >
            <span className="relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-brand text-white shadow-glow">
              <span className="absolute inset-0 rounded-3xl bg-primary/30 animate-pulse-ring" />
              <Loader2 className="h-9 w-9 animate-spin" />
            </span>
            <h3 className="mt-6 font-display text-xl font-bold">{label || "Processing"}…</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Working locally in your browser — nothing is uploaded.
            </p>
            <div className="mt-6 w-full max-w-md">
              <Progress value={progress} />
              <p className="mt-2 text-sm font-medium tabular-nums text-muted-foreground">{progress}%</p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <UploadZone tool={tool} files={files} onChange={(f) => setFiles(f)} />

            {files.length >= minFiles && (tool.options?.length ?? 0) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border bg-background/40 p-5"
              >
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Options
                </div>
                <OptionsForm tool={tool} values={values} onChange={setOption} />
              </motion.div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {files.length > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {tool.category === "security" ? (
                    <Lock className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  )}
                  Files are processed privately on your device.
                </p>
                <Button
                  size="lg"
                  variant="gradient"
                  onClick={run}
                  disabled={!canRun}
                  className={cn("sm:min-w-[220px]", !canRun && "opacity-60")}
                >
                  {tool.title}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
