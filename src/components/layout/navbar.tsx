"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { SearchCommand, SearchTrigger } from "@/components/shared/search-command";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/categories";
import { toolsByCategory, TOOL_COUNT } from "@/lib/tools";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/tools", label: "All Tools" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300",
          scrolled ? "glass-strong border-b shadow-sm" : "border-b border-transparent bg-background/0"
        )}
      >
        <nav className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <Logo />
          </div>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 lg:flex">
            <div
              className="relative"
              onMouseEnter={() => setMenuOpen(true)}
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
                onClick={() => setMenuOpen((v) => !v)}
              >
                Categories
                <ChevronDown className={cn("h-4 w-4 transition-transform", menuOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="absolute left-0 top-full w-[min(46rem,90vw)] pt-2"
                  >
                    <div className="glass-strong grid grid-cols-2 gap-1.5 rounded-2xl border p-3 shadow-soft-lg md:grid-cols-3">
                      {CATEGORIES.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/tools?category=${cat.id}`}
                          className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-accent"
                        >
                          <span
                            className={cn(
                              "grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                              cat.gradient
                            )}
                          >
                            <cat.icon className="h-4.5 w-4.5" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold">{cat.name}</span>
                            <span className="block text-xs text-muted-foreground">{cat.tagline}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground",
                  pathname === link.href ? "text-foreground" : "text-foreground/80"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <SearchTrigger onClick={() => setSearchOpen(true)} className="w-48 xl:w-60" />
            </div>
            <ThemeSwitcher className="hidden sm:inline-flex" />
            <Button asChild variant="gradient" className="hidden sm:inline-flex">
              <Link href="/tools">
                Open a Tool
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <button
              className="grid h-10 w-10 place-items-center rounded-lg hover:bg-accent lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="glass-strong overflow-hidden border-t lg:hidden"
            >
              <div className="container space-y-4 py-4">
                <SearchTrigger onClick={() => setSearchOpen(true)} className="w-full" />
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/tools?category=${cat.id}`}
                      className="flex items-center gap-2.5 rounded-xl border bg-card/50 p-3"
                    >
                      <span className={cn("grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br text-white", cat.gradient)}>
                        <cat.icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium">{cat.name}</span>
                    </Link>
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  {NAV_LINKS.map((link) => (
                    <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent">
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-xs text-muted-foreground">{TOOL_COUNT}+ tools · 100% private</span>
                  <ThemeSwitcher />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
