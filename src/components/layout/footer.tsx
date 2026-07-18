import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { CATEGORIES } from "@/lib/categories";
import { POPULAR_TOOLS } from "@/lib/tools";

const COMPANY = [
  { href: "/about", label: "About" },
  { href: "/tools", label: "All Tools" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const LEGAL = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export function Footer() {
  return (
    <footer className="relative mt-24 border-t bg-card/40">
      <div className="container py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Logo textClassName="text-xl" />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Every PDF tool you need, running entirely in your browser. Fast, private and free — your
              files never touch a server.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              100% client-side processing
            </div>
          </div>

          <FooterCol title="Popular Tools">
            {POPULAR_TOOLS.slice(0, 6).map((t) => (
              <FooterLink key={t.slug} href={`/tools/${t.slug}`}>
                {t.title}
              </FooterLink>
            ))}
          </FooterCol>

          <FooterCol title="Categories">
            {CATEGORIES.map((c) => (
              <FooterLink key={c.id} href={`/tools?category=${c.id}`}>
                {c.name}
              </FooterLink>
            ))}
          </FooterCol>

          <FooterCol title="Company">
            {COMPANY.map((l) => (
              <FooterLink key={l.href} href={l.href}>
                {l.label}
              </FooterLink>
            ))}
            {LEGAL.map((l) => (
              <FooterLink key={l.href} href={l.href}>
                {l.label}
              </FooterLink>
            ))}
          </FooterCol>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PDFpro. Crafted for people who care about privacy.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 text-sm text-muted-foreground">
              {LEGAL.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-foreground">
                  {l.label}
                </Link>
              ))}
            </div>
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
        {children}
      </Link>
    </li>
  );
}
