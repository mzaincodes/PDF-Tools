import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden border-b", className)}>
      <div className="pointer-events-none absolute inset-0 -z-10 surface-grid opacity-30 mask-fade-b" />
      <div className="pointer-events-none absolute left-1/2 top-[-40%] -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/15 blur-[110px]" />
      <div className="container py-16 text-center sm:py-20">
        <Reveal>
          {eyebrow && (
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card/60 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-brand" />
              {eyebrow}
            </span>
          )}
          <h1 className="mx-auto max-w-3xl text-balance font-display text-4xl font-bold tracking-tight sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mx-auto mt-4 max-w-2xl text-balance text-muted-foreground sm:text-lg">
              {description}
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
