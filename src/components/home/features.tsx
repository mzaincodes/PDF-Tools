import { ShieldCheck, Zap, WifiOff, Layers3, Sparkles, Infinity as InfinityIcon } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Truly private",
    description:
      "Your documents are processed on your device and never uploaded. What happens on your computer stays on your computer.",
    grad: "from-emerald-500 to-teal-500",
  },
  {
    icon: Zap,
    title: "Blazing fast",
    description:
      "No waiting for uploads or downloads. Operations run instantly using WebAssembly and native browser APIs.",
    grad: "from-amber-500 to-orange-500",
  },
  {
    icon: WifiOff,
    title: "Works offline",
    description:
      "Once loaded, most tools keep working without a connection. Perfect for planes, cafés and secure environments.",
    grad: "from-sky-500 to-indigo-500",
  },
  {
    icon: Layers3,
    title: "Batch ready",
    description:
      "Merge dozens of files, convert whole folders of images and split large documents — all in a single pass.",
    grad: "from-violet-500 to-fuchsia-500",
  },
  {
    icon: InfinityIcon,
    title: "No limits",
    description:
      "No daily caps, no watermarks, no forced sign-ups. Use every tool as often as you like, completely free.",
    grad: "from-rose-500 to-pink-500",
  },
  {
    icon: Sparkles,
    title: "Beautifully simple",
    description:
      "A polished, accessible interface with keyboard shortcuts, dark mode and thoughtful micro-interactions throughout.",
    grad: "from-indigo-500 to-purple-500",
  },
];

export function Features() {
  return (
    <section className="container py-20 sm:py-28">
      <SectionHeading
        eyebrow="Why PDFpro"
        title={
          <>
            Built different, by <span className="text-gradient">design</span>
          </>
        }
        description="A commercial-grade PDF suite that respects your privacy and your time."
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <Reveal key={feature.title} delay={i * 0.05}>
            <div className="group relative h-full overflow-hidden rounded-2xl border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20 group-hover:from-primary group-hover:to-fuchsia-500" />
              <span
                className={cn(
                  "mb-5 inline-grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform duration-300 group-hover:scale-110",
                  feature.grad
                )}
              >
                <feature.icon className="h-6 w-6" />
              </span>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
