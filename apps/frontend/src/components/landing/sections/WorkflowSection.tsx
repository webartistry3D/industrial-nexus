"use client";

import { motion } from "framer-motion";
import {
  ClipboardList,
  Wrench,
  Scale,
  Truck,
  Satellite,
  MapPin,
  PenLine,
  BarChart3,
} from "lucide-react";
import { Section, SectionHeader, Container } from "@/components/landing/ui/Section";

const workflowSteps = [
  { icon: ClipboardList, label: "Order Created", sub: "Structured intake" },
  { icon: Wrench, label: "Kitting", sub: "Technical prep" },
  { icon: Scale, label: "Weight Watch", sub: "Auto validation" },
  { icon: Truck, label: "Driver Assignment", sub: "Smart dispatch" },
  { icon: Satellite, label: "Live Tracking", sub: "Real-time GPS" },
  { icon: MapPin, label: "Geofencing", sub: "Event-driven alerts" },
  { icon: PenLine, label: "Digital POD", sub: "Photo + signature" },
  { icon: BarChart3, label: "Analytics", sub: "Performance data" },
];

export function WorkflowSection() {
  return (
    <Section id="workflow" className="bg-[#0A1628]">
      <Container>
        <SectionHeader
          eyebrow="How It Works"
          title="A Logistics Platform Built for Industry"
          subtitle="Industrial Nexus transforms fragmented logistics operations into one intelligent operational network — from order creation to verified delivery and performance analytics."
        />

        <div className="relative">
          {/* Connector line */}
          <div
            className="hidden lg:block absolute top-8 left-[6.25%] right-[6.25%] h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(150,180,220,0.15) 10%, rgba(150,180,220,0.15) 90%, transparent)",
            }}
            aria-hidden="true"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-5 lg:gap-2">
            {workflowSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.label}
                  className="flex flex-col items-center text-center"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.07,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <motion.div
                    className="relative w-16 h-16 rounded-2xl bg-[#112240] border border-[rgba(150,180,220,0.18)] flex items-center justify-center mb-3 z-10"
                    whileHover={{
                      borderColor: "rgba(30,136,229,0.55)",
                      boxShadow: "0 0 20px rgba(30,136,229,0.22)",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon size={22} className="text-[#42A5F5]" aria-hidden="true" />
                  </motion.div>
                  <div className="text-[0.78rem] font-semibold text-white mb-1 leading-tight">
                    {step.label}
                  </div>
                  <div className="text-[0.7rem] text-[#8A9BB5]">{step.sub}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}
