"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Section, SectionHeader, Container } from "@/components/landing/ui/Section";

const rows = [
  {
    feature: "Industrial SOP enforcement",
    nexus: "Platform-enforced on every shipment",
    traditional: "Manual, inconsistent, unverifiable",
  },
  {
    feature: "Vehicle weight & validation",
    nexus: "Automated Weight Watch Engine",
    traditional: "Driver estimation, no validation",
  },
  {
    feature: "Real-time shipment visibility",
    nexus: "Live GPS, minute-by-minute",
    traditional: "Phone calls and WhatsApp pings",
  },
  {
    feature: "Geofence event notifications",
    nexus: "Multi-radius and polygon zones",
    traditional: "Not available",
  },
  {
    feature: "Digital proof of delivery",
    nexus: "Photo, signature, GPS, timestamp",
    traditional: "Paper waybill or none at all",
  },
  {
    feature: "Intelligent dispatch",
    nexus: "Algorithmic driver-cargo matching",
    traditional: "Manual phone dispatch",
  },
  {
    feature: "Performance analytics",
    nexus: "Carrier, route, and SLA analytics",
    traditional: "No data captured",
  },
  {
    feature: "Client self-service portal",
    nexus: "Real-time tracking and history",
    traditional: "Periodic manual updates",
  },
];

export function ComparisonSection() {
  return (
    <Section id="why" className="bg-[#0A1628]">
      <Container>
        <SectionHeader
          eyebrow="Why Industrial Nexus"
          title="Optimized Logistics Infrastructure as a Service"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rows.map((row, i) => (
            <motion.div
              key={row.feature}
              className="bg-[#112240] rounded-2xl border border-[rgba(150,180,220,0.12)] overflow-hidden"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Capability header */}
              <div className="px-5 py-3.5 bg-[#0D1D35] border-b border-[rgba(150,180,220,0.1)]">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#C8D4E3]">
                  Capability
                </span>
                <p className="text-sm font-semibold text-white mt-1">{row.feature}</p>
              </div>

              {/* Comparison rows */}
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00BFA5] mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#42A5F5] block mb-1">
                      Industrial Nexus
                    </span>
                    <p className="text-sm text-white flex items-start gap-2">
                      <Check size={14} className="text-[#00BFA5] mt-0.5 flex-shrink-0" aria-hidden="true" />
                      {row.nexus}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4A5568] mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A9BB5] block mb-1">
                      Traditional Logistics
                    </span>
                    <p className="text-sm text-[#8A9BB5] flex items-start gap-2">
                      <X size={14} className="text-[#4A5568] mt-0.5 flex-shrink-0" aria-hidden="true" />
                      {row.traditional}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
