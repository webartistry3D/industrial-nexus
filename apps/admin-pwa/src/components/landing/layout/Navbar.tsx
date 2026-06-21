"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/landing/ui/Button";

const navLinks = [
  { label: "Solutions", href: "#solutions" },
  { label: "Platform", href: "#platform" },
  { label: "Corridor", href: "#corridor" },
  { label: "Why Us", href: "#why" },
  { label: "Security", href: "#security" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[rgba(10,22,40,0.97)] border-b border-[rgba(150,180,220,0.12)]"
            : "bg-[rgba(10,22,40,0.8)]"
        }`}
        style={{ backdropFilter: "blur(20px)" }}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-[1180px] mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group" aria-label="Industrial Nexus home">
            <div className="w-8 h-8 rounded-[6px] bg-gradient-to-br from-[#E85D04] to-[#FF7800] flex items-center justify-center text-white text-xs font-black tracking-tight shadow-[0_0_16px_rgba(232,93,4,0.4)]">
              IN
            </div>
            <span className="font-bold text-[1.05rem] text-white tracking-tight">
              Industrial Nexus
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8" role="navigation" aria-label="Main navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-[#C8D4E3] hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" href="/login">
              Sign In
            </Button>
            {/* <Button variant="primary" size="sm" href="#demo">
              Request Demo
              <ChevronRight size={14} />
            </Button> */}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-[#C8D4E3] hover:text-white p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="absolute top-16 left-0 right-0 bg-[#0D1D35] border-b border-[rgba(150,180,220,0.15)] p-6 flex flex-col gap-4"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-base font-medium text-[#C8D4E3] hover:text-white py-1"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-[rgba(150,180,220,0.12)] flex flex-col gap-3">
                {/* <Button variant="outline" size="md" href="#demo">
                  Request Demo
                </Button> */}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
