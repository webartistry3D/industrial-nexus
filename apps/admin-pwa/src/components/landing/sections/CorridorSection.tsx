"use client";

import { motion } from "framer-motion";
import { Section, SectionHeader, Container } from "@/components/landing/ui/Section";

const zones = [
  {
    name: "Apapa Port Complex",
    description: "Nigeria's primary sea freight gateway — import clearance and port-to-factory logistics",
    color: "#E85D04",
  },
  {
    name: "Ikeja Industrial District",
    description: "Lagos State's primary manufacturing zone — electronics, FMCG, and light industry",
    color: "#1E88E5",
  },
  {
    name: "Agbara Industrial Estate",
    description: "Heavy manufacturing and chemical processing hub south of Lagos",
    color: "#00BFA5",
  },
  {
    name: "Sagamu–Ota Corridor",
    description: "Ogun State's industrial spine connecting international manufacturers",
    color: "#1E88E5",
  },
  {
    name: "Lekki Free Trade Zone",
    description: "Emerging deep-sea port logistics hub for eastern Lagos expansion",
    color: "#00BFA5",
  },
  {
    name: "Ogun–Guangdong FTZ",
    description: "Sino-Nigerian industrial park servicing China-linked manufacturing operations",
    color: "#E85D04",
  },
  {
    name: "Flowergate Industrial",
    description: "Fast-growing Sagamu-axis industrial cluster for consumer goods manufacturing",
    color: "#1E88E5",
  },
  {
    name: "Ota Industrial Zone",
    description: "Dense manufacturing corridor housing Nigeria's largest industrial tenant base",
    color: "#00BFA5",
  },
];

export function CorridorSection() {
  return (
    <Section id="corridor" className="bg-[#0D1D35]">
      <Container>
        <SectionHeader
          eyebrow="Coverage Area"
          title="Lagos–Ogun Industrial Corridor"
          subtitle="Industrial Nexus is purpose-built for the industrial geography of Southwest Nigeria's manufacturing heartland."
        />

        <div className="grid grid-cols-1 gap-12 items-start">
          {/* Zone list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {zones.map((zone, i) => (
              <motion.div
                key={zone.name}
                className="flex items-start gap-3 bg-[#0A1628] border border-[rgba(150,180,220,0.1)] rounded-xl p-4 hover:border-[rgba(150,180,220,0.2)] transition-colors cursor-default"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.5,
                  delay: (i % 4) * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <span
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: zone.color }}
                  aria-hidden="true"
                />
                <div>
                  <div className="text-[0.85rem] font-semibold text-white mb-1 leading-tight">
                    {zone.name}
                  </div>
                  <div className="text-[0.75rem] text-[#8A9BB5] leading-snug">
                    {zone.description}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </Container>
    </Section>
  );
}
