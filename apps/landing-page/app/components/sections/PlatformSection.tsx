"use client";

import { motion } from "framer-motion";
import { Section, SectionHeader, Container } from "../ui/Section";

function BrowserFrame({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      className="rounded-xl overflow-hidden border border-[rgba(150,180,220,0.15)] shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
      style={{ background: "#0A1628" }}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="bg-[#0D1D35] border-b border-[rgba(150,180,220,0.1)] px-3 py-2.5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FF5F57]" />
          <span className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
          <span className="w-2 h-2 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-[9px] text-[#8A9BB5] font-mono ml-2 flex-1 text-center">
          {title}
        </span>
      </div>
      <div className="p-3">{children}</div>
    </motion.div>
  );
}

function Row({ label, value, color = "#C8D4E3", mono = false }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[rgba(150,180,220,0.06)] last:border-0">
      <span className="text-[10px] text-[#8A9BB5]">{label}</span>
      <span className={`text-[10px] font-semibold ${mono ? "font-mono" : ""}`} style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export function PlatformSection() {
  return (
    <Section id="platform" className="bg-[#0D1D35]">
      <Container>
        <SectionHeader
          eyebrow="Platform Interfaces"
          title="Built for Every Stakeholder"
          subtitle="Three purpose-designed interfaces for operations teams, drivers in the field, and clients monitoring their critical shipments."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Admin Control Tower */}
          <BrowserFrame title="nexus.industrialnexus.io/control-tower" delay={0}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-white">Control Tower</span>
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(0,191,165,0.15)] text-[#00BFA5] border border-[rgba(0,191,165,0.2)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00BFA5] animate-pulse inline-block" />
                Live
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {[
                { l: "Active Routes", v: "24", c: "white" },
                { l: "On-Time Rate", v: "97.2%", c: "#00BFA5" },
                { l: "Weight Alerts", v: "0", c: "#E85D04" },
                { l: "Drivers Active", v: "18/22", c: "white" },
              ].map((k) => (
                <div key={k.l} className="bg-[#1C3155] rounded-lg p-2">
                  <div className="text-[8px] text-[#8A9BB5] mb-0.5">{k.l}</div>
                  <div className="text-sm font-black font-mono" style={{ color: k.c }}>
                    {k.v}
                  </div>
                </div>
              ))}
            </div>

            {[
              { id: "NX-0891", route: "Apapa → Agbara", status: "On Route", c: "#00BFA5" },
              { id: "NX-0892", route: "Ikeja → Sagamu FTZ", status: "Kitting", c: "#42A5F5" },
              { id: "NX-0893", route: "Ota → Flowergate", status: "⚠ Alert", c: "#E85D04" },
            ].map((row) => (
              <div
                key={row.id}
                className="flex items-center gap-2 bg-[#112240] rounded-lg px-2.5 py-2 mb-1.5 last:mb-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold text-white font-mono">{row.id}</div>
                  <div className="text-[8px] text-[#8A9BB5] truncate">{row.route}</div>
                </div>
                <span className="text-[8px] font-bold" style={{ color: row.c }}>
                  {row.status}
                </span>
              </div>
            ))}
          </BrowserFrame>

          {/* Driver PWA */}
          <BrowserFrame title="driver.industrialnexus.io — PWA" delay={0.1}>
            <div className="text-center mb-3 pb-3 border-b border-[rgba(150,180,220,0.08)]">
              <div className="text-[9px] text-[#8A9BB5] mb-1">Current Assignment</div>
              <div className="text-sm font-black text-white mb-1 font-mono">NX-2024-0891</div>
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(0,191,165,0.15)] text-[#00BFA5] border border-[rgba(0,191,165,0.2)]">
                ● En Route
              </span>
            </div>

            <div className="bg-[#112240] rounded-lg p-2.5 mb-3">
              <div className="text-[9px] text-[#8A9BB5] mb-1">Deliver to</div>
              <div className="text-[11px] font-semibold text-white">Agbara Industrial Estate</div>
              <div className="text-[9px] text-[#42A5F5] mt-1">📍 <span className="font-mono">12.4</span> km remaining · ETA <span className="font-mono">14:32</span></div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {[
                { emoji: "⚖️", label: "Weight OK", color: "#00BFA5" },
                { emoji: "📋", label: "SOP Met", color: "#00BFA5" },
                { emoji: "📸", label: "POD Pending", color: "#8A9BB5" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-[#112240] rounded-lg p-2 text-center"
                >
                  <div className="text-base mb-1">{item.emoji}</div>
                  <div
                    className="text-[8px] font-semibold"
                    style={{ color: item.color }}
                  >
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full bg-[#E85D04] text-white text-[10px] font-bold py-2.5 rounded-lg cursor-default">
              Capture Delivery Proof
            </button>
          </BrowserFrame>

          {/* Client Portal */}
          <BrowserFrame title="portal.industrialnexus.io" delay={0.2}>
            <div className="text-[11px] font-bold text-white mb-3">
              Lafarge Nigeria — Active Orders
            </div>

            <div className="bg-[#112240] rounded-lg p-2.5 mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-white">
                  Hydraulic Seals — 240 units
                </span>
                <span className="text-[8px] font-bold text-[#00BFA5]">On Time</span>
              </div>
              <div className="text-[8px] text-[#8A9BB5]">
                ETA: Today, <span className="font-mono">14:30</span> · Apapa Wharf
              </div>
            </div>

            <div className="bg-[#112240] rounded-lg p-2.5 mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-white">
                  Industrial Filters — 80 units
                </span>
                <span className="text-[8px] font-bold text-[#42A5F5]">Processing</span>
              </div>
              <div className="text-[8px] text-[#8A9BB5]">
                Dispatch: Tomorrow, <span className="font-mono">09:00</span> · Ikeja
              </div>
            </div>

            <div className="border-t border-[rgba(150,180,220,0.08)] pt-3">
              <div className="text-[9px] text-[#8A9BB5] mb-2 font-medium">
                Last 30 Days Performance
              </div>
              <Row label="On-Time Deliveries" value="96.8%" color="#00BFA5" mono />
              <Row label="Zero Damage Rate" value="99.2%" color="#00BFA5" mono />
              <Row label="Total Shipments" value="47" mono />
              <Row label="Avg. Lead Time" value="−38%" color="#42A5F5" mono />
            </div>
          </BrowserFrame>
        </div>
      </Container>
    </Section>
  );
}
