import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of PDFpro's free, in-browser PDF tools.",
  alternates: { canonical: "/terms" },
};

const SECTIONS = [
  {
    heading: "1. Acceptance of terms",
    body: [
      `By accessing or using ${siteConfig.name} ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.`,
    ],
  },
  {
    heading: "2. Description of the service",
    body: [
      "The Service provides a suite of tools for working with PDF and related files. All processing is performed locally within your web browser. We do not receive, store or process your files on our servers.",
    ],
  },
  {
    heading: "3. Acceptable use",
    body: [
      "You agree to use the Service only for lawful purposes and only on files you own or are authorized to modify. You must not use the Service to infringe intellectual property rights, bypass security controls you are not authorized to bypass, or process unlawful content.",
    ],
  },
  {
    heading: "4. No warranty",
    body: [
      'The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied. While we work hard to ensure accurate results, we do not warrant that the Service will be uninterrupted, error-free or that output will meet your specific requirements.',
      "Always keep a backup of important documents before processing them.",
    ],
  },
  {
    heading: "5. Limitation of liability",
    body: [
      "To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special or consequential damages, or any loss of data, arising out of or relating to your use of the Service.",
    ],
  },
  {
    heading: "6. Intellectual property",
    body: [
      "You retain all rights to the files you process. The Service's own branding, design and code are the property of their respective owners and may not be copied without permission.",
    ],
  },
  {
    heading: "7. Changes to the service",
    body: [
      "We may add, modify or remove tools and features at any time. We may also update these terms; continued use of the Service after changes constitutes acceptance of the revised terms.",
    ],
  },
  {
    heading: "8. Contact",
    body: ["Questions about these terms can be directed to us through the contact page."],
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of Service" description="Last updated: January 2026" />
      <section className="container py-16">
        <div className="mx-auto max-w-3xl space-y-10">
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
      </section>
    </>
  );
}
