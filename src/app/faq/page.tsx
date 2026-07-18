import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { GENERAL_FAQS } from "@/lib/faqs";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about PDFpro — privacy, pricing, supported browsers, OCR and more.",
  alternates: { canonical: "/faq" },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: GENERAL_FAQS.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <PageHeader
        eyebrow="Help center"
        title={<>Frequently asked <span className="text-gradient">questions</span></>}
        description="Everything you need to know about how PDFpro works and keeps your files private."
      />
      <section className="container py-16">
        <Reveal className="mx-auto max-w-3xl">
          <FaqAccordion faqs={GENERAL_FAQS} />
        </Reveal>
        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border bg-card/50 p-8 text-center">
          <h2 className="text-xl font-semibold">Still have questions?</h2>
          <p className="mt-2 text-muted-foreground">
            We're happy to help. Reach out and we'll get back to you.
          </p>
          <Button asChild variant="gradient" className="mt-5">
            <Link href="/contact">Contact us</Link>
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">
            or email{" "}
            <a href={`mailto:hello@${siteConfig.url.replace(/^https?:\/\//, "")}`} className="text-primary hover:underline">
              our team
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
