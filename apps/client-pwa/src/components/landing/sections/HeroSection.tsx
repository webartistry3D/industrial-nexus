"use client";

import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle,
  Shield,
  Weight,
  Activity,
  Play,
} from "lucide-react";
import { Button } from "@/components/landing/ui/Button";
import { HeroDashboard } from "@/components/landing/ui/HeroDashboard";

const trustPills = [
  { icon: Clock, label: "Real-Time Tracking" },
  { icon: CheckCircle, label: "SOP Compliance" },
  { icon: Activity, label: "Event-Driven Visibility" },
  { icon: Weight, label: "Weight Watch" },
  { icon: Shield, label: "Enterprise Security" },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: "easeOut" as const },
  },
};

export function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center pt-16 overflow-hidden"
      aria-label="Hero"
    >
      {/* Background layers */}
      <div className="absolute inset-0 grid-overlay" aria-hidden="true" />
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 55% 55% at 72% 50%, rgba(30,136,229,0.10) 0%, transparent 70%), radial-gradient(ellipse 40% 45% at 18% 65%, rgba(232,93,4,0.08) 0%, transparent 65%)",
        }}
      />

      <div className="max-w-[1180px] mx-auto px-6 py-20 lg:py-28 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">
          {/* Left: Copy */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Live badge */}
            <motion.div variants={itemVariants} className="mb-7">
              <span className="inline-flex items-center gap-2 bg-[rgba(232,93,4,0.10)] border border-[rgba(232,93,4,0.25)] rounded-full px-4 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E85D04] animate-pulse" />
                <span className="text-[11px] font-semibold text-[#E85D04] tracking-wide">
                  Now live across the Lagos–Ogun Industrial Corridor
                </span>
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-[2.6rem] sm:text-5xl lg:text-[3.4rem] xl:text-[4rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-white mb-6"
            >
              Industrial Logistics{" "}
              <span className="block">
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #42A5F5 0%, #1E88E5 55%, #00BFA5 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Operational
                </span>
              </span>
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #42A5F5 0%, #1E88E5 55%, #00BFA5 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Downtime
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="text-[1.05rem] leading-[1.75] text-[#98A8C0] max-w-[500px] mb-9"
            >
              Industrial Nexus is a specialized logistics execution platform
              that enables manufacturers and industrial suppliers to move
              critical consumables with real-time visibility, intelligent
              dispatching, and operational discipline.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-3 mb-12"
            >
              <Button variant="primary" size="lg" href="#demo">
                <Play size={15} />
                Request a Demo
              </Button>
              <Button variant="outline" size="lg" href="#platform">
                Explore Platform
              </Button>
            </motion.div>

            {/* Trust pills */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-2"
              role="list"
              aria-label="Key capabilities"
            >
              {trustPills.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  role="listitem"
                  className="inline-flex items-center gap-1.5 bg-[rgba(150,180,220,0.06)] border border-[rgba(150,180,220,0.12)] rounded-full px-3 py-1.5 text-[11px] font-medium text-[#C8D4E3]"
                >
                  <Icon size={11} className="text-[#42A5F5]" aria-hidden="true" />
                  {label}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Dashboard mockup */}
          <div className="hidden lg:block">
            <HeroDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}
