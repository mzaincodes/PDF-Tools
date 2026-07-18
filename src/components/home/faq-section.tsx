import Link from "next/link";
import { SectionHeading } from "@/components/shared/section-heading";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { Reveal } from "@/components/shared/reveal";
import { GENERAL_FAQS } from "@/lib/faqs";

export function FaqSection() {
  return (
    <section className="container py-20 sm:py-28">
      <SectionHeading
        eyebrow="Questions & answers"
        title={
          <>
            Everything you might <span className="text-gradient">ask</span>
          </>
        }
        description="Still curious? Reach out any time — we're happy to help."
      />
      <Reveal className="mx-auto mt-12 max-w-3xl">
        <FaqAccordion faqs={GENERAL_FAQS.slice(0, 6)} />
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Can’t find what you’re looking for?{" "}
          <Link href="/faq" className="font-medium text-primary hover:underline">
            Read the full FAQ
          </Link>{" "}
          or{" "}
          <Link href="/contact" className="font-medium text-primary hover:underline">
            contact us
          </Link>
          .
        </p>
      </Reveal>
    </section>
  );
}
