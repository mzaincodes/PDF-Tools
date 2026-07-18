import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How PDFpro protects your privacy: files are processed entirely in your browser and never uploaded.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  {
    heading: "The short version",
    body: [
      "PDFpro processes your files entirely inside your web browser. Your documents are never uploaded to, transmitted to, or stored on our servers. Because we never receive your files, we cannot read, share, sell or lose them.",
    ],
  },
  {
    heading: "What we do not collect",
    body: [
      "We do not collect, store or transmit the contents of any file you open with PDFpro. All merging, splitting, compression, conversion, OCR, encryption and editing happens locally on your device.",
      "We do not require an account, and we do not ask for your name, email or payment information to use the core tools.",
    ],
  },
  {
    heading: "Information handled locally",
    body: [
      "Some preferences — such as your theme choice, recently used tools and favorite tools — are stored in your browser's local storage. This data stays on your device and is never sent to us. You can clear it at any time from your browser settings.",
    ],
  },
  {
    heading: "Analytics & cookies",
    body: [
      "If analytics are enabled, we may collect anonymous, aggregated usage information (such as which pages are visited) to improve the product. This never includes the contents of your files. We do not use advertising cookies or third-party trackers that profile you.",
    ],
  },
  {
    heading: "Third-party components",
    body: [
      "PDFpro is built on open-source libraries that run in your browser. Optical character recognition downloads a language model to your device on first use; this is fetched from a content delivery network and cached locally. The file you are processing is never part of that request.",
    ],
  },
  {
    heading: "Children's privacy",
    body: [
      "PDFpro is a general-purpose utility and is not directed at children under 13. We do not knowingly collect personal information from children.",
    ],
  },
  {
    heading: "Changes to this policy",
    body: [
      "We may update this policy from time to time. Material changes will be reflected on this page with an updated revision date.",
    ],
  },
  {
    heading: "Contact",
    body: ["If you have any questions about this policy, please reach out via our contact page."],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy" description="Last updated: January 2026" />
      <section className="container py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 flex items-start gap-4 rounded-2xl border border-success/30 bg-success/5 p-6">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-success" />
            <p className="text-sm leading-relaxed">
              <span className="font-semibold">Privacy by design.</span> {siteConfig.name} never uploads your
              files. Everything you do here stays on your own device — that's not just a promise, it's how the
              app is built.
            </p>
          </div>
          <div className="space-y-10">
            {SECTIONS.map((section) => (
              <div key={section.heading}>
                <h2 className="mb-3 font-display text-xl font-bold tracking-tight">{section.heading}</h2>
                {section.body.map((p, i) => (
                  <p key={i} className="mb-3 leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
