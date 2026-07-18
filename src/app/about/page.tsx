import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Zap, Heart, Lock, Cpu, Globe, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { TOOL_COUNT } from "@/lib/tools";

export const metadata: Metadata = {
  title: "About",
  description:
    "PDFpro is a privacy-first PDF toolkit that runs entirely in your browser. Learn about our mission and the technology behind it.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  { icon: Lock, title: "Privacy by architecture", text: "We can't see your files because they never reach us. Privacy isn't a policy — it's how the product is built." },
  { icon: Zap, title: "Speed you can feel", text: "No upload queues, no server round-trips. Everything happens instantly on your own device." },
  { icon: Heart, title: "Free and fair", text: "No watermarks, no forced accounts, no dark patterns. Great tools should be accessible to everyone." },
];

const TECH = [
  { icon: Cpu, title: "WebAssembly", text: "Heavy processing like OCR and rendering runs at near-native speed inside your browser." },
  { icon: Globe, title: "Modern web APIs", text: "We use the File, Canvas and Web Worker APIs to handle documents without a backend." },
  { icon: ShieldCheck, title: "Zero storage", text: "Files live in memory only for as long as you're working, then they're gone." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our mission"
        title={<>Powerful PDF tools that <span className="text-gradient">respect your privacy</span></>}
        description="We believe you shouldn't have to upload your private documents to a stranger's server just to merge two files. So we built a better way."
      />

      <section className="container py-16">
        <div className="mx-auto max-w-3xl space-y-6 text-lg leading-relaxed text-muted-foreground">
          <Reveal>
            <p>
              PDFpro started with a simple frustration: every time you want to tweak a PDF, you're asked to
              hand it over to some website that uploads, stores and processes it on servers you'll never see.
              For contracts, medical records and financial documents, that's a lot of trust to give away.
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <p>
              Modern browsers are astonishingly capable. With WebAssembly and a handful of powerful web APIs,
              we can do everything those services do — merging, compressing, converting, OCR, encryption — right
              on your own device. Your files never travel anywhere. There's nothing to leak, because there's
              nothing to store.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p>
              Today PDFpro offers{" "}
              <span className="font-semibold text-foreground">{TOOL_COUNT}+ professional tools</span>, all free,
              all private, all running in the tab you're reading this in.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container py-8">
        <div className="grid gap-5 md:grid-cols-3">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.06}>
              <div className="h-full rounded-2xl border bg-card p-6 shadow-soft">
                <span className="mb-4 inline-grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand text-white shadow-sm">
                  <v.icon className="h-6 w-6" />
                </span>
                <h3 className="mb-2 text-lg font-semibold">{v.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container py-16">
        <div className="mx-auto max-w-4xl rounded-3xl border bg-card/50 p-8 sm:p-10">
          <h2 className="text-center font-display text-2xl font-bold tracking-tight sm:text-3xl">
            The technology behind it
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {TECH.map((t) => (
              <div key={t.title} className="text-center">
                <span className="mx-auto mb-3 inline-grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <t.icon className="h-5 w-5" />
                </span>
                <h3 className="mb-1.5 font-semibold">{t.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container pb-20 text-center">
        <Button asChild variant="gradient" size="xl">
          <Link href="/tools">
            Explore the tools
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    </>
  );
}
