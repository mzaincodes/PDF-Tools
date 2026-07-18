import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Home, ShieldCheck, Check, Sparkles } from "lucide-react";
import { getTool, TOOLS, toolsByCategory } from "@/lib/tools";
import { CATEGORY_MAP } from "@/lib/categories";
import { siteConfig } from "@/lib/site";
import { ToolRunner } from "@/components/tools/tool-runner";
import { ToolCard } from "@/components/shared/tool-card";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return { title: "Tool not found" };
  const title = `${tool.title} — Free & Private`;
  const description = tool.description;
  const url = `${siteConfig.url}/tools/${tool.slug}`;
  return {
    title,
    description,
    keywords: [tool.title, ...(tool.keywords ?? []), "PDF", "online", "free", "private"],
    alternates: { canonical: `/tools/${tool.slug}` },
    openGraph: { title: `${tool.title} · ${siteConfig.name}`, description, url, type: "website" },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const category = CATEGORY_MAP[tool.category];
  const Icon = tool.icon;
  // Editor / viewer / page-organizer / compare need a wide canvas to show full pages.
  const isWide = tool.handler !== "processor" || tool.slug === "organize";
  const related = [
    ...toolsByCategory(tool.category).filter((t) => t.slug !== tool.slug),
    ...TOOLS.filter((t) => t.popular && t.category !== tool.category),
  ].slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${tool.title} — ${siteConfig.name}`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description: tool.description,
  };
  const faqLd = tool.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: tool.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 surface-grid opacity-30 mask-fade-b" />
          <div className={cn("absolute left-1/2 top-[-30%] h-96 w-96 -translate-x-1/2 rounded-full blur-[120px] opacity-20 bg-gradient-to-br", tool.gradient)} />
        </div>
        <div className="container py-10 sm:py-14">
          <nav className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="flex items-center gap-1 hover:text-foreground">
              <Home className="h-3.5 w-3.5" /> Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/tools?category=${category.id}`} className="hover:text-foreground">
              {category.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">{tool.title}</span>
          </nav>

          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 flex justify-center">
              <span className={cn("relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-glow", tool.gradient)}>
                <Icon className="h-8 w-8" />
              </span>
            </div>
            <div className="mb-3 flex items-center justify-center gap-2">
              {tool.popular && <Badge variant="gradient">Popular</Badge>}
              {tool.isNew && <Badge variant="new">New</Badge>}
              <Badge variant="secondary">{category.name}</Badge>
            </div>
            <h1 className="text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {tool.title}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground sm:text-lg">
              {tool.description}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-success" /> Files never leave your browser
            </p>
          </div>
        </div>
      </section>

      {/* Workspace — interactive tools (editor, viewer, organizer, compare) get a
          much wider canvas so the full PDF page is comfortably visible. */}
      <section
        className={cn(
          "-mt-2 py-8 sm:py-12",
          isWide ? "mx-auto w-full max-w-[1400px] px-4 sm:px-6" : "container"
        )}
      >
        <div className={cn("mx-auto", isWide ? "max-w-none" : "max-w-5xl")}>
          <ToolRunner slug={tool.slug} />
        </div>
      </section>

      {/* Steps */}
      {tool.steps && (
        <section className="container py-12">
          <SectionHeading eyebrow="How it works" title={`${tool.title} in 3 simple steps`} />
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
            {tool.steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.08}>
                <div className="relative h-full rounded-2xl border bg-card p-6 shadow-soft">
                  <span className="mb-4 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mb-1.5 font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Benefits */}
      {tool.benefits && (
        <section className="container py-12">
          <div className="mx-auto grid max-w-4xl gap-8 rounded-3xl border bg-card/50 p-8 sm:p-10 md:grid-cols-[1fr_1.2fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Why you'll love it
              </span>
              <h2 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Everything you need, nothing you don't
              </h2>
            </div>
            <ul className="space-y-3">
              {tool.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success/12 text-success">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="text-sm leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* FAQ */}
      {tool.faqs && tool.faqs.length > 0 && (
        <section className="container py-12">
          <SectionHeading eyebrow="FAQ" title={`${tool.title} questions`} />
          <div className="mx-auto mt-10 max-w-3xl">
            <FaqAccordion faqs={tool.faqs} />
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="container py-12">
          <SectionHeading eyebrow="Keep going" title="Related tools" align="center" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
