"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Download, RotateCcw, FileDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Confetti } from "./confetti";
import { downloadBlob, formatBytes } from "@/lib/utils";
import type { ProcessResult } from "@/types";

interface ResultViewProps {
  result: ProcessResult;
  onReset: () => void;
}

export function ResultView({ result, onReset }: ResultViewProps) {
  const hasFiles = result.files.length > 0;

  const downloadAll = () => {
    result.files.forEach((f, i) => setTimeout(() => downloadBlob(f.blob, f.name), i * 250));
  };

  return (
    <div className="relative">
      <Confetti fire={hasFiles} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
          className="grid h-20 w-20 place-items-center rounded-full bg-success/12 text-success"
        >
          {hasFiles ? <CheckCircle2 className="h-10 w-10" /> : <Info className="h-10 w-10 text-primary" />}
        </motion.span>

        <h3 className="mt-6 font-display text-2xl font-bold tracking-tight">
          {hasFiles ? "All done!" : "Here are the details"}
        </h3>
        <p className="mt-2 max-w-md text-muted-foreground">
          {result.message ?? "Your file has been processed successfully — completely in your browser."}
        </p>

        {result.meta && result.meta.length > 0 && (
          <div className="mt-8 w-full max-w-lg overflow-hidden rounded-2xl border bg-card/60">
            <dl className="divide-y">
              {result.meta.map((m) => (
                <div key={m.label} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                  <dt className="text-muted-foreground">{m.label}</dt>
                  <dd className="max-w-[60%] truncate text-right font-medium" title={m.value}>
                    {m.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {hasFiles && (
          <div className="mt-8 w-full max-w-lg space-y-3">
            {result.files.map((f) => (
              <div
                key={f.name}
                className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-sm"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white">
                  <FileDown className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
                </div>
                <Button size="sm" variant="gradient" onClick={() => downloadBlob(f.blob, f.name)}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {hasFiles && result.files.length > 1 && (
            <Button variant="gradient" size="lg" onClick={downloadAll}>
              <Download className="h-4 w-4" />
              Download all
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            Start over
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
