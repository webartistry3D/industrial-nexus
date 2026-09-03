"use client";

import { motion } from "framer-motion";
import { CountUp } from "@/components/landing/ui/CountUp";
import { Section, SectionHeader, Container } from "@/components/landing/ui/Section";

const kpis = [
  {
    prefix: "",
    value: 98,
    suffix: "%",
    label: "Target On-Time Delivery Rate",
    note: "vs. industry avg. of 72%",
    color: "#42A5F5",
  },
  {
    prefix: "<",
    value: 1,
    suffix: "%",
    label: "Transit Damage Goal",
    note: "Enforced by Weight Watch",
    color: "#E85D04",
  },
  {
    prefix: "",
    value: 100,
    suffix: "%",
    label: "Driver SOP Compliance",
    note: "Platform-enforced, not voluntary",
    color: "#00BFA5",
  },
  {
    prefix: "",
    value: 40,
    suffix: "%",
    label: "Lead Time Reduction Target",
    note: "vs. manual dispatch operations",
    color: "#42A5F5",
  },
];

export function KPISection() {
  return (
    <Section id="performance" className="bg-[#0A1628]">
      <Container>
        <SectionHeader
          eyebrow="Performance Targets"
          title="Operational Excellence Measured"
          subtitle="Industrial Nexus is engineered to deliver measurable improvements to your logistics operations from the first week."
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              className="bg-[#112240] border border-[rgba(150,180,220,0.12)] rounded-2xl p-8 text-center group hover:border-[rgba(150,180,220,0.22)] transition-colors duration-200"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div
                className="text-4xl md:text-5xl font-black tracking-[-0.04em] leading-none mb-3 font-mono"
                style={{
                  background: `linear-gradient(135deg, ${kpi.color} 0%, ${kpi.color}bb 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {kpi.prefix && (
                  <span style={{ WebkitTextFillColor: kpi.color }}>
                    {kpi.prefix}
                  </span>
                )}
                <CountUp target={kpi.value} suffix={kpi.suffix} />
              </div>
              <div className="text-sm text-[#C8D4E3] font-medium mb-2 leading-snug">
                {kpi.label}
              </div>
              <div className="text-[11px] font-semibold" style={{ color: kpi.color }}>
                {kpi.note}
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
