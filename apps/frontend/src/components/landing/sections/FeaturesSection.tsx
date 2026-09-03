"use client";

import { motion } from "framer-motion";
import {
  Scale,
  MapPin,
  Warehouse,
  LayoutDashboard,
  FileCheck,
  ClipboardCheck,
} from "lucide-react";
import { Section, SectionHeader, Container } from "@/components/landing/ui/Section";

const features = [
  {
    num: "01",
    icon: Scale,
    title: "Weight Watch Engine",
    description:
      "Automatically validates vehicle capacity, cargo compatibility, and handling requirements before any shipment is dispatched. Overloaded vehicles are blocked at the source — not discovered in the field.",
    tag: "Safety Critical",
    accentColor: "#E85D04",
  },
  {
    num: "02",
    icon: MapPin,
    title: "Event-Driven Geofencing",
    description:
      "Receive intelligent operational alerts as shipments enter multi-radius and polygon geofences. Automate notifications for arrival, departure, and dwell-time violations at industrial estates.",
    tag: "Real-Time",
    accentColor: "#1E88E5",
  },
  {
    num: "03",
    icon: Warehouse,
    title: "Technical Logistics Hub",
    description:
      "Track industrial consumables through aggregation, technical packaging, quality inspection, and dispatch staging. Complete traceability from warehouse inbound to vehicle departure.",
    tag: "End-to-End",
    accentColor: "#00BFA5",
  },
  {
    num: "04",
    icon: LayoutDashboard,
    title: "Control Tower Dashboard",
    description:
      "Monitor every active shipment, driver, and route from a single operational command center. Live map view, exception management, and real-time KPIs in one unified interface.",
    tag: "Operations",
    accentColor: "#1E88E5",
  },
  {
    num: "05",
    icon: FileCheck,
    title: "Digital Proof of Delivery",
    description:
      "Capture photo evidence, recipient signature, GPS-stamped timestamp, and driver confirmation at the point of delivery. Dispute resolution backed by irrefutable, tamper-proof records.",
    tag: "Accountability",
    accentColor: "#00BFA5",
  },
  {
    num: "06",
    icon: ClipboardCheck,
    title: "Industrial SOP Engine",
    description:
      "Ensure standardized logistics procedures are followed for every shipment. Non-compliant drivers cannot progress through delivery stages without resolution — compliance is structural, not aspirational.",
    tag: "Compliance",
    accentColor: "#E85D04",
  },
];

export function FeaturesSection() {
  return (
    <Section id="solutions" className="bg-[#0D1D35]">
      <Container>
        <SectionHeader
          eyebrow="Core Capabilities"
          title="Every Tool Industrial Operations Require"
          subtitle="Purpose-built for the complexity of industrial supply chains — not retrofitted from general-purpose courier software."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.num}
                className="group relative bg-[#0A1628] border border-[rgba(150,180,220,0.1)] rounded-2xl p-8 overflow-hidden transition-all duration-300 hover:border-[rgba(150,180,220,0.22)] hover:-translate-y-1"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.6,
                  delay: (i % 3) * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${f.accentColor}, transparent)`,
                  }}
                  aria-hidden="true"
                />

                <div className="flex items-start justify-between mb-5">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{
                      background: `${f.accentColor}18`,
                      color: f.accentColor,
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={20} />
                  </div>
                  <span
                    className="font-mono text-[10px] font-bold tracking-widest"
                    style={{ color: f.accentColor }}
                    aria-hidden="true"
                  >
                    {f.num}
                  </span>
                </div>

                <h3 className="text-[1.05rem] font-semibold text-white mb-3 leading-snug">
                  {f.title}
                </h3>
                <p className="text-sm text-[#8A9BB5] leading-relaxed mb-5">
                  {f.description}
                </p>
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full border"
                  style={{
                    background: `${f.accentColor}12`,
                    color: f.accentColor,
                    borderColor: `${f.accentColor}30`,
                  }}
                >
                  {f.tag}
                </span>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
