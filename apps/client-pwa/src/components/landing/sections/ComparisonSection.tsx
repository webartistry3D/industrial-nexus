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
    feature: "Vehicle weight & capacity validation",
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
          title="Logistics Infrastructure vs. Logistics Improvisation"
          subtitle="Traditional logistics services were not built for industrial operational demands. Industrial Nexus was."
        />

        <motion.div
          className="overflow-x-auto rounded-2xl border border-[rgba(150,180,220,0.12)]"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <table className="w-full border-collapse min-w-[600px]" role="table">
            <thead>
              <tr>
                <th className="text-left px-6 py-4 bg-[#112240] border-b border-[rgba(150,180,220,0.12)] text-[12px] font-bold uppercase tracking-[0.08em] text-[#C8D4E3] w-[35%]">
                  Capability
                </th>
                <th className="text-left px-6 py-4 bg-[#112240] border-b border-[rgba(150,180,220,0.12)] text-[12px] font-bold uppercase tracking-[0.08em] text-[#42A5F5] w-[32%]">
                  Industrial Nexus
                </th>
                <th className="text-left px-6 py-4 bg-[#112240] border-b border-[rgba(150,180,220,0.12)] text-[12px] font-bold uppercase tracking-[0.08em] text-[#8A9BB5] w-[33%]">
                  Traditional Logistics
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className="border-b border-[rgba(150,180,220,0.07)] last:border-0 hover:bg-[rgba(150,180,220,0.03)] transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-[#C8D4E3]">
                    {row.feature}
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    <span className="flex items-start gap-2">
                      <Check
                        size={15}
                        className="text-[#00BFA5] mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      {row.nexus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#8A9BB5]">
                    <span className="flex items-start gap-2">
                      <X
                        size={15}
                        className="text-[#4A5568] mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      {row.traditional}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </Container>
    </Section>
  );
}
