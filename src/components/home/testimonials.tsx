import { Star } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";

const TESTIMONIALS = [
  {
    quote:
      "Finally a PDF tool I can use for confidential contracts without worrying about where the files go. Everything stays on my machine.",
    name: "Sarah Chen",
    role: "Legal Counsel",
    initials: "SC",
    grad: "from-indigo-500 to-violet-500",
  },
  {
    quote:
      "The compression is unreal — cut a 40MB scanned report down to 6MB with no visible quality loss. It's replaced three paid apps for me.",
    name: "Marcus Reyes",
    role: "Product Designer",
    initials: "MR",
    grad: "from-rose-500 to-pink-500",
  },
  {
    quote:
      "I batch-convert hundreds of images to PDF every week. It's instant, works offline, and I never hit an upload limit. Chef's kiss.",
    name: "Aisha Patel",
    role: "Operations Lead",
    initials: "AP",
    grad: "from-emerald-500 to-teal-500",
  },
  {
    quote:
      "The editor feels like a native desktop app in the browser. Signing and annotating PDFs has never been this smooth.",
    name: "Tom Becker",
    role: "Freelance Consultant",
    initials: "TB",
    grad: "from-amber-500 to-orange-500",
  },
  {
    quote:
      "OCR that runs in the browser and actually works? Turned a folder of scanned invoices into searchable PDFs in minutes.",
    name: "Elena Novak",
    role: "Accountant",
    initials: "EN",
    grad: "from-sky-500 to-indigo-500",
  },
  {
    quote:
      "Clean, fast and genuinely private. I recommend it to my whole team — no accounts, no nonsense, just great tools.",
    name: "David Okonkwo",
    role: "Engineering Manager",
    initials: "DO",
    grad: "from-fuchsia-500 to-purple-500",
  },
];

export function Testimonials() {
  return (
    <section className="border-y bg-card/40 py-20 sm:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="Loved by professionals"
          title={
            <>
              Trusted by <span className="text-gradient">200,000+</span> people
            </>
          }
          description="Join the professionals who switched to a faster, more private way to work with PDFs."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={(i % 3) * 0.06}>
              <figure className="flex h-full flex-col rounded-2xl border bg-card p-6 shadow-soft">
                <div className="mb-4 flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br text-sm font-semibold text-white ${t.grad}`}
                  >
                    {t.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{t.name}</span>
                    <span className="block text-xs text-muted-foreground">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
