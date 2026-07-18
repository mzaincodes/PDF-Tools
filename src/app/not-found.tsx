import Link from "next/link";
import { Home, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { POPULAR_TOOLS } from "@/lib/tools";
import { ToolCard } from "@/components/shared/tool-card";

export default function NotFound() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 surface-grid opacity-30 mask-fade-b" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/15 blur-[110px]" />
      <div className="container flex flex-col items-center py-24 text-center">
        <p className="font-display text-8xl font-extrabold tracking-tight text-gradient sm:text-9xl">404</p>
        <h1 className="mt-4 text-balance font-display text-2xl font-bold tracking-tight sm:text-3xl">
          This page went missing
        </h1>
        <p className="mt-3 max-w-md text-balance text-muted-foreground">
          The page you're looking for doesn't exist or has moved. Let's get you back on track.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="gradient" size="lg">
            <Link href="/">
              <Home className="h-4 w-4" /> Back home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/tools">
              <Search className="h-4 w-4" /> Browse tools
            </Link>
          </Button>
        </div>

        <div className="mt-16 w-full max-w-4xl">
          <p className="mb-5 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
            Popular tools <ArrowRight className="h-4 w-4" />
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {POPULAR_TOOLS.slice(0, 4).map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
