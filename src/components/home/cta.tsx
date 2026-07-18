import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";

export function CtaBand() {
  return (
    <section className="container py-12">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-fuchsia-500/5 to-transparent p-10 text-center shadow-soft sm:p-16">
          <div className="pointer-events-none absolute inset-0 -z-10 surface-grid opacity-40" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <h2 className="mx-auto max-w-2xl text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to work smarter with your PDFs?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground sm:text-lg">
            No sign-up, no uploads, no catch. Pick a tool and get started in seconds.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="gradient" size="xl">
              <Link href="/tools">
                Explore all tools
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link href="/tools/merge">Try Merge PDF</Link>
            </Button>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" />
            100% private · files never leave your browser
          </p>
        </div>
      </Reveal>
    </section>
  );
}
