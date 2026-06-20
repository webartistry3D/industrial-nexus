"use client";

import { motion } from "framer-motion";

const shipments = [
  {
    id: "NX-2024-0891",
    route: "Apapa → Agbara Industrial",
    status: "On Route",
    statusVariant: "green",
    icon: "📦",
  },
  {
    id: "NX-2024-0892",
    route: "Ikeja → Sagamu FTZ",
    status: "Kitting",
    statusVariant: "blue",
    icon: "🏭",
  },
  {
    id: "NX-2024-0889",
    route: "Ota → Flowergate Industrial",
    status: "Delivered",
    statusVariant: "green",
    icon: "✅",
  },
];

const statusColors: Record<string, string> = {
  green: "bg-[rgba(0,191,165,0.15)] text-[#00BFA5] border-[rgba(0,191,165,0.2)]",
  blue: "bg-[rgba(30,136,229,0.15)] text-[#42A5F5] border-[rgba(30,136,229,0.2)]",
  orange: "bg-[rgba(232,93,4,0.15)] text-[#FF7800] border-[rgba(232,93,4,0.2)]",
};

export function HeroDashboard() {
  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden border border-[rgba(150,180,220,0.2)] shadow-[0_40px_100px_rgba(0,0,0,0.6),0_0_0_1px_rgba(150,180,220,0.1)]"
      style={{ background: "#112240" }}
      initial={{ opacity: 0, x: 40, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Titlebar */}
      <div className="bg-[#0D1D35] border-b border-[rgba(150,180,220,0.1)] px-4 py-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 bg-[rgba(150,180,220,0.06)] border border-[rgba(150,180,220,0.1)] rounded-md px-3 py-1 font-mono text-[10px] text-[#8A9BB5] text-center mx-3">
          nexus.industrialnexus.io/control-tower
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-white">Control Tower</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(0,191,165,0.15)] text-[#00BFA5] border border-[rgba(0,191,165,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00BFA5] animate-pulse" />
            Live
          </span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Active Routes", value: "24", sub: "↑ 3 from yesterday", subColor: "#00BFA5" },
            { label: "On-Time Rate", value: "97.2%", sub: "↑ 1.4% this week", subColor: "#00BFA5" },
            { label: "Weight Alerts", value: "0", sub: "All clear", subColor: "#8A9BB5", valueColor: "#E85D04" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-[#1C3155] border border-[rgba(150,180,220,0.1)] rounded-lg p-3"
            >
              <div className="text-[9px] text-[#8A9BB5] mb-1 font-medium">{kpi.label}</div>
              <div
                className="text-xl font-black leading-none font-mono"
                style={{ color: kpi.valueColor ?? "white" }}
              >
                {kpi.value}
              </div>
              <div className="text-[9px] mt-1" style={{ color: kpi.subColor }}>
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Live map */}
        <div className="bg-[#0A1628] border border-[rgba(150,180,220,0.1)] rounded-lg overflow-hidden h-[140px] relative">
          <svg viewBox="0 0 380 140" className="w-full h-full" aria-label="Live logistics route map">
            {/* Grid */}
            {[35, 70, 105].map((y) => (
              <line key={y} x1="0" y1={y} x2="380" y2={y} stroke="rgba(150,180,220,0.04)" strokeWidth="1" />
            ))}
            {[60, 120, 180, 240, 300, 360].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2="140" stroke="rgba(150,180,220,0.04)" strokeWidth="1" />
            ))}

            {/* Route paths */}
            <path d="M55 108 Q95 65 155 45" stroke="#1E88E5" strokeWidth="1.5" fill="none" strokeDasharray="5 3" opacity="0.75" />
            <path d="M155 45 Q220 32 275 52" stroke="#1E88E5" strokeWidth="1.5" fill="none" strokeDasharray="5 3" opacity="0.75" />
            <path d="M55 108 Q120 120 195 115" stroke="#00BFA5" strokeWidth="1.5" fill="none" strokeDasharray="5 3" opacity="0.65" />
            <path d="M195 115 Q255 110 315 92" stroke="#00BFA5" strokeWidth="1.5" fill="none" strokeDasharray="5 3" opacity="0.65" />

            {/* Location nodes */}
            {[
              { cx: 55, cy: 108, color: "#E85D04", label: "Apapa" },
              { cx: 155, cy: 45, color: "#1E88E5", label: "Ikeja" },
              { cx: 275, cy: 52, color: "#1E88E5", label: "Sagamu" },
              { cx: 195, cy: 115, color: "#00BFA5", label: "Agbara" },
              { cx: 315, cy: 92, color: "#00BFA5", label: "Ota" },
            ].map((node) => (
              <g key={node.label}>
                <circle cx={node.cx} cy={node.cy} r="8" fill={node.color} opacity="0.18" />
                <circle cx={node.cx} cy={node.cy} r="4" fill={node.color} />
                <text x={node.cx + 8} y={node.cy - 5} fill={node.color} fontSize="8" fontFamily="Inter, sans-serif" fontWeight="600">{node.label}</text>
              </g>
            ))}

            {/* Animated vehicle */}
            <circle r="5" fill="#E85D04">
              <animateMotion dur="9s" repeatCount="indefinite" path="M55 108 Q95 65 155 45 Q220 32 275 52" />
            </circle>
            <circle r="9" fill="#E85D04" opacity="0.25">
              <animateMotion dur="9s" repeatCount="indefinite" path="M55 108 Q95 65 155 45 Q220 32 275 52" />
            </circle>
            <circle r="4" fill="#00BFA5">
              <animateMotion dur="14s" repeatCount="indefinite" path="M55 108 Q120 120 195 115 Q255 110 315 92" />
            </circle>
          </svg>
        </div>

        {/* Shipment rows */}
        <div className="flex flex-col gap-1.5">
          {shipments.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2.5 bg-[#1C3155] border border-[rgba(150,180,220,0.1)] rounded-lg px-3 py-2"
            >
              <span className="text-sm w-6 text-center flex-shrink-0">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-white font-mono">{s.id}</div>
                <div className="text-[9px] text-[#8A9BB5] truncate">{s.route}</div>
              </div>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColors[s.statusVariant]}`}
              >
                {s.status}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom stats row */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[rgba(150,180,220,0.08)]">
          {[
            { label: "Drivers Active", value: "18/22" },
            { label: "Geofence Events", value: "7 Today" },
            { label: "Weight Alerts", value: "0 Active" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-[11px] font-bold text-white font-mono">{s.value}</div>
              <div className="text-[9px] text-[#8A9BB5]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
