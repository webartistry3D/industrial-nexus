"use client";

import { motion } from "framer-motion";
import { CalendarCheck, Mail } from "lucide-react";
import { Button } from "../ui/Button";

export function CTABanner() {
  return (
    <section
      id="demo"
      className="relative py-28 overflow-hidden"
      aria-label="Call to action"
      style={{ background: "#112240" }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 65% 90% at 50% 50%, rgba(30,136,229,0.13) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-px"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(150,180,220,0.2), transparent)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(150,180,220,0.2), transparent)",
        }}
      />

      <div className="max-w-[720px] mx-auto px-6 text-center relative z-10">
        <motion.p
          className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#42A5F5] mb-5"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Get Started
        </motion.p>

        <motion.h2
          className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.08] mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.08 }}
        >
          Ready to Modernize Your Industrial Logistics Operations?
        </motion.h2>

        <motion.p
          className="text-[1.05rem] text-[#98A8C0] leading-relaxed mb-10 max-w-[540px] mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Join manufacturers and industrial suppliers across the Lagos–Ogun
          corridor who have moved from operational chaos to logistics precision.
          Your first shipment on the platform takes less than 48 hours to set up.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.22 }}
        >
          <Button variant="primary" size="lg" href="mailto:demo@industrialnexus.io">
            <CalendarCheck size={17} />
            Schedule a Demo
          </Button>
          <Button variant="outline" size="lg" href="mailto:sales@industrialnexus.io">
            <Mail size={17} />
            Contact Sales
          </Button>
        </motion.div>

        {/* Social proof chips */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 mt-12 pt-10 border-t border-[rgba(150,180,220,0.1)]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          {[
            "No setup fees",
            "48-hour onboarding",
            "Dedicated ops support",
            "Enterprise SLA",
          ].map((chip) => (
            <div
              key={chip}
              className="flex items-center gap-1.5 text-xs text-[#8A9BB5]"
            >
              <span className="w-1 h-1 rounded-full bg-[#42A5F5]" aria-hidden="true" />
              {chip}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
