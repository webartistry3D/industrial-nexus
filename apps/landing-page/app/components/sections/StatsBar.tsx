"use client";

import { motion } from "framer-motion";
import { CountUp } from "../ui/CountUp";

const stats = [
  { value: 98, suffix: "%", label: "Target On-Time Delivery", animate: true },
  { value: 40, suffix: "%", label: "Lead Time Reduction Target", animate: true },
  { value: 100, suffix: "%", label: "Digital Proof of Delivery", animate: true },
  { value: 1, suffix: "%", prefix: "<", label: "Transit Damage Goal", animate: true },
  { value: 8, suffix: "", label: "Industrial Zones Covered", animate: true },
];

export function StatsBar() {
  return (
    <div className="bg-[#0D1D35] border-y border-[rgba(150,180,220,0.1)] py-8">
      <div className="max-w-[1180px] mx-auto px-6">
        <div className="flex flex-wrap items-center justify-center md:justify-between gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <div className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none mb-1 font-mono">
                {stat.prefix && (
                  <span className="text-[#E85D04]">{stat.prefix}</span>
                )}
                <CountUp target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-[11px] text-[#8A9BB5] font-medium mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
