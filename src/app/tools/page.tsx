import type { Metadata } from "next";
import { ToolsExplorer } from "@/components/tools/tools-explorer";
import { TOOL_COUNT } from "@/lib/tools";

export const metadata: Metadata = {
  title: "All PDF Tools",
  description:
    "Browse 50+ free, private PDF tools — merge, split, compress, convert, edit, sign, OCR and more. Everything runs in your browser.",
  alternates: { canonical: "/tools" },
};

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 -z-10 surface-grid opacity-30 mask-fade-b" />
        <div className="container py-14 text-center sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-4 py-1.5 text-sm font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-brand" />
            {TOOL_COUNT}+ tools · 100% in your browser
          </span>
          <h1 className="mt-6 text-balance font-display text-4xl font-bold tracking-tight sm:text-5xl">
            The complete <span className="text-gradient">PDF toolkit</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-muted-foreground sm:text-lg">
            Every tool you need to work with PDFs — fast, private and free. Pick one and start in seconds.
          </p>
        </div>
      </section>

      <section className="container py-10 sm:py-14">
        <ToolsExplorer initialCategory={category} />
      </section>
    </>
  );
}
