import type { Metadata } from "next";
import { Mail, MessageSquare, ShieldCheck, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ContactForm } from "@/components/shared/contact-form";
import { Reveal } from "@/components/shared/reveal";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the PDFpro team — feedback, feature requests and support.",
  alternates: { canonical: "/contact" },
};

const INFO = [
  { icon: MessageSquare, title: "Feedback & ideas", text: "Have a tool you'd love to see? We build based on what our users ask for." },
  { icon: ShieldCheck, title: "Privacy questions", text: "Curious how the in-browser processing works? We're happy to explain in detail." },
  { icon: Clock, title: "Fast responses", text: "We read every message and typically reply within one business day." },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Get in touch"
        title={<>We'd love to <span className="text-gradient">hear from you</span></>}
        description="Questions, feedback or feature requests — drop us a line and we'll get back to you."
      />
      <section className="container py-16">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-6">
            {INFO.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.06}>
                <div className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
            <div className="flex items-center gap-2 rounded-xl border bg-card/50 p-4 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 text-primary" />
              We never sell or share your details.
            </div>
          </div>
          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
