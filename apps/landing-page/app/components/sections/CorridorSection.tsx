"use client";

import { motion } from "framer-motion";
import { Section, SectionHeader, Container } from "../ui/Section";

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
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

          {/* SVG Map */}
          <motion.div
            className="bg-[#0A1628] border border-[rgba(150,180,220,0.12)] rounded-2xl overflow-hidden h-[420px]"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Map of Lagos-Ogun industrial corridor"
          >
            <svg
              viewBox="0 0 480 420"
              className="w-full h-full"
              role="img"
              aria-label="Industrial corridor map showing Lagos and Ogun State zones"
            >
              <title>Lagos–Ogun Industrial Corridor</title>
              {/* Grid pattern */}
              <defs>
                <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(150,180,220,0.05)" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="480" height="420" fill="url(#mapgrid)"/>

              {/* Landmass silhouette suggestion */}
              <path
                d="M40 380 Q80 370 115 345 Q155 320 175 295 Q200 265 220 255 Q245 245 270 235 Q310 215 350 195 Q390 170 425 155 L440 75 Q420 58 385 48 Q345 38 305 48 Q265 58 235 80 Q200 98 180 118 Q158 140 138 162 Q115 185 100 205 Q82 225 70 255 Q58 280 50 310 Q43 342 40 380Z"
                fill="rgba(150,180,220,0.03)"
                stroke="rgba(150,180,220,0.08)"
                strokeWidth="1"
              />

              {/* Route lines */}
              <path d="M120 295 Q152 240 198 198" stroke="#1E88E5" strokeWidth="1.5" fill="none" strokeDasharray="5 4" opacity="0.7"/>
              <path d="M198 198 Q240 168 286 148" stroke="#1E88E5" strokeWidth="1.5" fill="none" strokeDasharray="5 4" opacity="0.7"/>
              <path d="M120 295 Q165 308 218 288" stroke="#00BFA5" strokeWidth="1.5" fill="none" strokeDasharray="5 4" opacity="0.65"/>
              <path d="M218 288 Q270 272 308 258" stroke="#00BFA5" strokeWidth="1.5" fill="none" strokeDasharray="5 4" opacity="0.65"/>
              <path d="M286 148 Q335 128 375 118" stroke="#E85D04" strokeWidth="1.5" fill="none" strokeDasharray="5 4" opacity="0.55"/>
              <path d="M308 258 Q348 238 380 218" stroke="#1E88E5" strokeWidth="1.5" fill="none" strokeDasharray="5 4" opacity="0.5"/>

              {/* Location nodes */}
              {[
                { cx: 120, cy: 295, color: "#E85D04", label: "Apapa" },
                { cx: 198, cy: 198, color: "#1E88E5", label: "Ikeja" },
                { cx: 218, cy: 288, color: "#00BFA5", label: "Agbara" },
                { cx: 286, cy: 148, color: "#1E88E5", label: "Sagamu" },
                { cx: 308, cy: 258, color: "#00BFA5", label: "Ota" },
                { cx: 375, cy: 118, color: "#E85D04", label: "Flowergate" },
                { cx: 380, cy: 218, color: "#1E88E5", label: "Lekki FTZ" },
                { cx: 420, cy: 155, color: "#E85D04", label: "Ogun FTZ" },
              ].map((node) => (
                <g key={node.label}>
                  <circle cx={node.cx} cy={node.cy} r="9" fill={node.color} opacity="0.18"/>
                  <circle cx={node.cx} cy={node.cy} r="4.5" fill={node.color}/>
                  <text x={node.cx + 10} y={node.cy - 4} fill={node.color} fontSize="9" fontFamily="Inter,sans-serif" fontWeight="600">{node.label}</text>
                </g>
              ))}

              {/* Animated trucks */}
              <g>
                <circle r="5.5" fill="#E85D04">
                  <animateMotion dur="11s" repeatCount="indefinite" path="M120 295 Q152 240 198 198 Q240 168 286 148"/>
                </circle>
                <circle r="10" fill="#E85D04" opacity="0.22">
                  <animateMotion dur="11s" repeatCount="indefinite" path="M120 295 Q152 240 198 198 Q240 168 286 148"/>
                </circle>
              </g>
              <g>
                <circle r="4" fill="#00BFA5">
                  <animateMotion dur="15s" repeatCount="indefinite" path="M120 295 Q165 308 218 288 Q270 272 308 258"/>
                </circle>
                <circle r="8" fill="#00BFA5" opacity="0.2">
                  <animateMotion dur="15s" repeatCount="indefinite" path="M120 295 Q165 308 218 288 Q270 272 308 258"/>
                </circle>
              </g>

              {/* Legend */}
              <rect x="16" y="14" width="136" height="78" rx="7" fill="rgba(10,22,40,0.85)" stroke="rgba(150,180,220,0.12)" strokeWidth="1"/>
              <circle cx="30" cy="34" r="4" fill="#E85D04"/>
              <text x="40" y="38" fill="#8A9BB5" fontSize="9" fontFamily="Inter,sans-serif">Apapa / Flowergate</text>
              <circle cx="30" cy="56" r="4" fill="#1E88E5"/>
              <text x="40" y="60" fill="#8A9BB5" fontSize="9" fontFamily="Inter,sans-serif">Ikeja / Sagamu / Lekki</text>
              <circle cx="30" cy="78" r="4" fill="#00BFA5"/>
              <text x="40" y="82" fill="#8A9BB5" fontSize="9" fontFamily="Inter,sans-serif">Agbara / Ota Corridor</text>
            </svg>
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}
