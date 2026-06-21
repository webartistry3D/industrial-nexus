"use client";

import { motion } from "framer-motion";
import {
  ClipboardList,
  Package,
  Scale,
  Truck,
  Satellite,
  BadgeCheck,
} from "lucide-react";
import { Section, SectionHeader, Container } from "@/components/landing/ui/Section";

const steps = [
  {
    num: "01",
    icon: ClipboardList,
    title: "Create Order",
    description:
      "Structured intake with cargo specs, handling requirements, and delivery SLAs.",
  },
  {
    num: "02",
    icon: Package,
    title: "Technical Kitting",
    description:
      "Consumables aggregated, packaged, and quality-checked at the logistics hub.",
  },
  {
    num: "03",
    icon: Scale,
    title: "Weight Validation",
    description:
      "Automated vehicle capacity and cargo compatibility check before dispatch approval.",
  },
  {
    num: "04",
    icon: Truck,
    title: "Dispatch",
    description:
      "Intelligent driver assignment with route optimization and SOP briefing.",
  },
  {
    num: "05",
    icon: Satellite,
    title: "Live Tracking",
    description:
      "Real-time GPS monitoring with geofence alerts and dwell-time notifications.",
  },
  {
    num: "06",
    icon: BadgeCheck,
    title: "Verified Delivery",
    description:
      "Photo, signature, GPS, and timestamp capture for complete delivery evidence.",
  },
];

export function HowItWorksSection() {
  return (
    <Section id="how-it-works" className="bg-[#0A1628]">
      <Container>
        <SectionHeader
          eyebrow="Simple to Operate"
          title="From Order to Verified Delivery"
          subtitle="Industrial Nexus enforces operational discipline through technology — not manual supervision or hope."
        />

        <div className="relative">
          {/* Connector line (desktop) */}
          <div
            className="hidden lg:block absolute top-10 left-[calc(100%/12+16px)] right-[calc(100%/12+16px)] h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(150,180,220,0.2) 15%, rgba(150,180,220,0.2) 85%, transparent)",
            }}
            aria-hidden="true"
          />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isLast = i === steps.length - 1;
              return (
                <motion.div
                  key={step.num}
                  className="flex flex-col items-center text-center"
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.55,
                    delay: i * 0.09,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <motion.div
                    className="relative w-16 h-16 rounded-2xl bg-[#112240] border border-[rgba(150,180,220,0.18)] flex items-center justify-center mb-4 z-10 cursor-default"
                    whileHover={{
                      borderColor: "rgba(30,136,229,0.6)",
                      boxShadow: "0 0 24px rgba(30,136,229,0.2)",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon
                      size={24}
                      className={isLast ? "text-[#00BFA5]" : "text-[#42A5F5]"}
                      aria-hidden="true"
                    />
                    <span
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#0A1628] border border-[rgba(150,180,220,0.2)] flex items-center justify-center font-mono text-[8px] font-bold text-[#42A5F5]"
                      aria-hidden="true"
                    >
                      {step.num}
                    </span>
                  </motion.div>
                  <h3 className="text-[0.88rem] font-semibold text-white mb-2 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-[0.75rem] text-[#8A9BB5] leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}
