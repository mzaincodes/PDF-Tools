import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { ToolCard } from "@/components/shared/tool-card";
import { Reveal } from "@/components/shared/reveal";
import { CATEGORIES } from "@/lib/categories";
import { toolsByCategory, TOOL_COUNT } from "@/lib/tools";
import { cn } from "@/lib/utils";

export function HomeTools() {
  return (
    <section id="tools" className="container scroll-mt-24 py-20 sm:py-28">
      <SectionHeading
        eyebrow="Every tool you need"
        title={
          <>
            {TOOL_COUNT}+ tools, thoughtfully <span className="text-gradient">organized</span>
          </>
        }
        description="From everyday merges to advanced OCR and encryption — pick a category and get to work in seconds."
      />

      <div className="mt-14 space-y-16">
        {CATEGORIES.map((category, ci) => {
          const tools = toolsByCategory(category.id);
          if (!tools.length) return null;
          return (
            <Reveal key={category.id} delay={0.02 * ci} className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-soft",
                      category.gradient
                    )}
                  >
                    <category.icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                <Link
                  href={`/tools?category=${category.id}`}
                  className="group inline-flex items-center gap-1 text-sm font-medium text-primary"
                >
                  View all
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
