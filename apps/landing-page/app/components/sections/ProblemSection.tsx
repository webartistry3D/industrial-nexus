"use client";

import { motion } from "framer-motion";
import {
  Timer,
  EyeOff,
  Truck,
  Weight,
  Phone,
  FileX,
  PackageX,
  MessageSquareX,
} from "lucide-react";
import { Section, SectionHeader, Container } from "../ui/Section";

const painPoints = [
  {
    icon: Timer,
    title: "Production Downtime",
    description:
      "Delayed consumable deliveries halt production lines, costing manufacturers millions per idle hour.",
    accentColor: "#E85D04",
  },
  {
    icon: EyeOff,
    title: "Zero Shipment Visibility",
    description:
      "No live tracking means no proactive response. Operations teams discover problems only after damage is done.",
    accentColor: "#1E88E5",
  },
  {
    icon: Weight,
    title: "Overloaded Vehicles",
    description:
      "Manual dispatch ignores weight limits and cargo compatibility, leading to equipment damage and regulatory risk.",
    accentColor: "#E85D04",
  },
  {
    icon: FileX,
    title: "No Accountability Chain",
    description:
      "Disputes over delivery quality and timing have no evidence — no timestamps, no signatures, no GPS proof.",
    accentColor: "#1E88E5",
  },
  {
    icon: Phone,
    title: "Manual Dispatch",
    description:
      "Phone calls and WhatsApp coordination create fragmented operations that collapse under production pressure.",
    accentColor: "#E85D04",
  },
  {
    icon: PackageX,
    title: "Cargo Damage",
    description:
      "Industrial consumables mishandled in transit result in scrapped goods, warranty claims, and supplier disputes.",
    accentColor: "#1E88E5",
  },
  {
    icon: Truck,
    title: "No Route Intelligence",
    description:
      "Drivers navigate the Lagos–Ogun corridor without optimization, wasting fuel and time on congested routes.",
    accentColor: "#E85D04",
  },
  {
    icon: MessageSquareX,
    title: "No Performance Data",
    description:
      "Logistics decisions are made on instinct, not data. No visibility into carrier performance or delivery trends.",
    accentColor: "#1E88E5",
  },
];

export function ProblemSection() {
  return (
    <Section id="problem" className="bg-[#0D1D35]">
      <Container>
        <SectionHeader
          eyebrow="The Challenge"
          title="Industrial Logistics Shouldn't Be Guesswork"
          subtitle="Manufacturing and supply chains run on critical dependencies. When logistics fails, production stops — and the cost is not inconvenience, it's operational shutdown."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {painPoints.map((point, i) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.title}
                className="group bg-[#0A1628] border border-[rgba(150,180,220,0.1)] rounded-xl p-6 cursor-default transition-colors duration-200 hover:border-[rgba(232,93,4,0.3)]"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.55,
                  delay: (i % 4) * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                  style={{
                    background: `${point.accentColor}18`,
                    color: point.accentColor,
                  }}
                  aria-hidden="true"
                >
                  <Icon size={18} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2 leading-tight">
                  {point.title}
                </h3>
                <p className="text-[0.8rem] text-[#8A9BB5] leading-relaxed">
                  {point.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
