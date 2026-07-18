import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, textClassName }: { className?: string; textClassName?: string }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5", className)} aria-label="PDFpro home">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-gradient-brand shadow-glow transition-transform duration-300 group-hover:scale-105">
        <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-white/20" />
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" aria-hidden>
          <path
            d="M6 2.75h7.5L18.25 7.5V19A2.25 2.25 0 0 1 16 21.25H6A2.25 2.25 0 0 1 3.75 19V5A2.25 2.25 0 0 1 6 2.75Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M13 3v4.5h4.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M7.5 13.5h6M7.5 16.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className={cn("text-lg font-semibold tracking-tight", textClassName)}>
        PDF<span className="text-gradient">{" "}TOOLS</span>
      </span>
    </Link>
  );
}
