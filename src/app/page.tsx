import { Hero } from "@/components/home/hero";
import { Stats } from "@/components/home/stats";
import { HomeTools } from "@/components/home/home-tools";
import { Features } from "@/components/home/features";
import { HowItWorks } from "@/components/home/how-it-works";
import { Testimonials } from "@/components/home/testimonials";
import { FaqSection } from "@/components/home/faq-section";
import { CtaBand } from "@/components/home/cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <HomeTools />
      <Features />
      <HowItWorks />
      <Testimonials />
      <FaqSection />
      <CtaBand />
    </>
  );
}
