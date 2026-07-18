"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import {
  UploadCloud,
  ShieldCheck,
  Zap,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Lock,
  FileSignature,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { setPendingFiles } from "@/lib/file-transfer";
import { TOOL_COUNT } from "@/lib/tools";
import { cn } from "@/lib/utils";

const floatingCards = [
  { icon: FileText, label: "Merge", className: "left-[4%] top-[18%]", delay: 0, grad: "from-indigo-500 to-violet-500" },
  { icon: ImageIcon, label: "To JPG", className: "right-[6%] top-[12%]", delay: 1.2, grad: "from-rose-500 to-pink-500" },
  { icon: Lock, label: "Protect", className: "left-[8%] bottom-[14%]", delay: 0.6, grad: "from-emerald-500 to-teal-500" },
  { icon: FileSignature, label: "Sign", className: "right-[4%] bottom-[18%]", delay: 1.8, grad: "from-sky-500 to-indigo-500" },
];

export function Hero() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const onDrop = React.useCallback(
    (accepted: File[]) => {
      if (!accepted.length) return;
      setError(null);
      setPendingFiles(accepted);
      router.push("/tools/edit-text");
    },
    [router]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    noClick: true,
    onDropRejected: () => setError("Please drop a PDF file."),
  });

  return (
    <section className="relative overflow-hidden">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 surface-grid opacity-[0.5] mask-fade-b" />
        <div className="absolute left-1/2 top-[-10%] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-primary/25 blur-[120px] animate-aurora" />
        <div className="absolute right-[8%] top-[10%] h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/20 blur-[120px] animate-aurora animation-delay-2000" />
        <div className="absolute left-[6%] bottom-[0%] h-[24rem] w-[24rem] rounded-full bg-sky-500/20 blur-[120px] animate-aurora animation-delay-4000" />
      </div>

      {/* Floating tool chips (desktop) */}
      {floatingCards.map((card) => (
        <motion.div
          key={card.label}
          className={cn("pointer-events-none absolute z-0 hidden lg:block", card.className)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + card.delay * 0.15, duration: 0.8 }}
        >
          <div className="animate-float" style={{ animationDelay: `${card.delay}s` }}>
            <div className="glass flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-soft-lg">
              <span className={cn("grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br text-white", card.grad)}>
                <card.icon className="h-4.5 w-4.5" />
              </span>
              <span className="text-sm font-medium">{card.label}</span>
            </div>
          </div>
        </motion.div>
      ))}

      <div className="container relative z-10 flex flex-col items-center py-20 text-center sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/70 px-4 py-1.5 text-sm font-medium shadow-sm backdrop-blur"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span>{TOOL_COUNT}+ premium tools · runs 100% in your browser</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="max-w-4xl text-balance font-display text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl md:leading-[1.05]"
        >
          All your PDF tools in <span className="text-gradient">one place</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl"
        >
          Merge, compress, convert, edit, sign and protect PDFs in seconds. No uploads, no sign-up —
          your files never leave your device.
        </motion.p>

        {/* Upload zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 w-full max-w-xl"
        >
          <div
            {...getRootProps()}
            className={cn(
              "group relative overflow-hidden rounded-3xl border-2 border-dashed p-8 transition-all duration-300",
              isDragActive
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border bg-card/60 backdrop-blur hover:border-primary/50 hover:bg-card"
            )}
          >
            <input {...getInputProps()} />
            <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/5 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <div className="flex flex-col items-center gap-4">
              <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow">
                <span className="absolute inset-0 rounded-2xl bg-primary/40 animate-pulse-ring" />
                <UploadCloud className="h-7 w-7" />
              </span>
              <div>
                <p className="text-lg font-semibold">
                  {isDragActive ? "Drop to start editing" : "Drop a PDF to get started"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  or choose a file — it opens instantly in the editor
                </p>
              </div>
              <Button type="button" variant="gradient" size="lg" onClick={open} className="pointer-events-auto">
                <UploadCloud className="h-4 w-4" />
                Select PDF file
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-success" /> 100% private
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-warning" /> Instant processing
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" /> Free forever
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button asChild variant="outline" size="lg">
            <Link href="/tools">
              Browse all tools
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
