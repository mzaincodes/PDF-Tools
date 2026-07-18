import { UploadCloud, Cpu, Download } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";

const STEPS = [
  {
    icon: UploadCloud,
    title: "Upload your file",
    description: "Drag & drop or select a file. It's loaded straight into your browser's memory — never a server.",
  },
  {
    icon: Cpu,
    title: "Process locally",
    description: "The tool does its work on your device using WebAssembly. You watch the progress in real time.",
  },
  {
    icon: Download,
    title: "Download instantly",
    description: "Grab your finished file the moment it's ready. Temporary data is wiped from memory automatically.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 surface-grid opacity-30" />
      <div className="container">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              Three steps. Zero <span className="text-gradient">uploads</span>.
            </>
          }
          description="A workflow engineered for speed and privacy from the ground up."
        />

        <div className="relative mt-16 grid gap-8 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.1} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow">
                    <step.icon className="h-7 w-7" />
                  </span>
                  <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-card text-xs font-bold shadow-sm">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
