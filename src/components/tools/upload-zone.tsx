"use client";

import * as React from "react";
import { useDropzone, type Accept } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, X, GripVertical, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Tool } from "@/types";

const EXT_MAP: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/jpg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "text/html": [".html", ".htm"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "application/vnd.ms-powerpoint": [".ppt"],
};

function buildAccept(mimes: string[]): Accept {
  const acc: Accept = {};
  for (const m of mimes) acc[m] = EXT_MAP[m] ?? [];
  return acc;
}

interface UploadZoneProps {
  tool: Tool;
  files: File[];
  onChange: (files: File[]) => void;
}

export function UploadZone({ tool, files, onChange }: UploadZoneProps) {
  const [error, setError] = React.useState<string | null>(null);
  const multiple = !!tool.multiple;
  const maxFiles = tool.maxFiles ?? (multiple ? 50 : 1);

  const onDrop = React.useCallback(
    (accepted: File[], rejected: unknown[]) => {
      if (rejected.length) {
        setError(`Some files were rejected. Please upload ${tool.acceptLabel}.`);
      } else {
        setError(null);
      }
      if (!accepted.length) return;
      const next = multiple ? [...files, ...accepted].slice(0, maxFiles) : accepted.slice(0, 1);
      onChange(next);
    },
    [files, multiple, maxFiles, onChange, tool.acceptLabel]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: buildAccept(tool.accept),
    multiple,
    maxFiles,
    noClick: files.length > 0,
    noKeyboard: files.length > 0,
  });

  const remove = (index: number) => onChange(files.filter((_, i) => i !== index));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= files.length) return;
    const next = [...files];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const dragIndex = React.useRef<number | null>(null);

  return (
    <div className="space-y-4">
      {files.length === 0 ? (
        <div
          {...getRootProps()}
          className={cn(
            "group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-300 sm:p-14",
            isDragActive
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border bg-card/50 hover:border-primary/50 hover:bg-card"
          )}
        >
          <input {...getInputProps()} />
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/5 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <div className="flex flex-col items-center gap-5">
            <span className="relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-brand text-white shadow-glow">
              <span className="absolute inset-0 rounded-3xl bg-primary/40 animate-pulse-ring" />
              <UploadCloud className="h-9 w-9" />
            </span>
            <div>
              <p className="text-xl font-semibold">
                {isDragActive ? "Drop your files here" : `Drop ${tool.acceptLabel} here`}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                or click to browse{multiple ? ` · up to ${maxFiles} files` : ""}
              </p>
            </div>
            <Button type="button" variant="gradient" size="lg" onClick={open}>
              <UploadCloud className="h-4 w-4" />
              Select {multiple ? "files" : "file"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {files.map((file, i) => (
              <motion.div
                key={`${file.name}-${i}`}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                draggable={multiple}
                onDragStart={() => (dragIndex.current = i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex.current !== null && dragIndex.current !== i) {
                    move(dragIndex.current, i);
                  }
                  dragIndex.current = null;
                }}
                className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 shadow-sm"
              >
                {multiple && (
                  <button
                    className="cursor-grab text-muted-foreground active:cursor-grabbing"
                    aria-label="Drag to reorder"
                  >
                    <GripVertical className="h-5 w-5" />
                  </button>
                )}
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                {multiple && (
                  <span className="hidden items-center gap-0.5 sm:flex">
                    <Button variant="ghost" size="icon-sm" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => move(i, i + 1)}
                      disabled={i === files.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </Button>
                  </span>
                )}
                <Button variant="ghost" size="icon-sm" onClick={() => remove(i)} aria-label="Remove file">
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>

          {multiple && files.length < maxFiles && (
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <Button type="button" variant="outline" className="w-full border-dashed" onClick={open}>
                <Plus className="h-4 w-4" />
                Add more files
              </Button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}
    </div>
  );
}
