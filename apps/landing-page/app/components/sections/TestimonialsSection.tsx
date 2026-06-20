"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Section, SectionHeader, Container } from "../ui/Section";

const testimonials = [
  {
    quote:
      "Before Industrial Nexus, our team was fielding driver calls at 2am to track critical shipments. Now the Control Tower shows every vehicle in real time. Production planning has fundamentally changed — we can actually make commitments to our factory floor and keep them.",
    name: "Adebayo Ogunwale",
    role: "Operations Manager",
    company: "Dangote Group Subsidiary",
    initials: "AO",
    avatarGradient: "from-[#1E88E5] to-[#0D47A1]",
  },
  {
    quote:
      "The Weight Watch Engine alone saved us from three overloading incidents in the first month. Our cargo insurance premiums dropped and we haven't had a single damage claim since onboarding. The platform genuinely pays for itself in the first quarter.",
    name: "Chinyere Iwuanyanwu",
    role: "Procurement Lead",
    company: "Atlas Copco Nigeria",
    initials: "CI",
    avatarGradient: "from-[#00897B] to-[#004D40]",
  },
  {
    quote:
      "We distribute industrial consumables to 14 factories across the Agbara corridor. Industrial Nexus gave us visibility we never had. Every delivery dispute we've faced since launch has been resolved in under 10 minutes — with photo evidence, GPS timestamps, and a recipient signature.",
    name: "Kingsley Anufor",
    role: "Warehouse Supervisor",
    company: "Lafarge Africa — Ewekoro Plant",
    initials: "KA",
    avatarGradient: "from-[#E85D04] to-[#BF360C]",
  },
  {
    quote:
      "What impressed me most was how quickly our drivers adopted the system. The Driver PWA is intuitive — you can't skip a step. That's the point. Our SOP compliance went from approximately 60% to full compliance in two weeks without a single training session.",
    name: "Folake Adeyemi",
    role: "Factory Executive",
    company: "Nigerian Breweries — Supply Chain",
    initials: "FA",
    avatarGradient: "from-[#7B1FA2] to-[#4A148C]",
  },
];

export function TestimonialsSection() {
  return (
    <Section id="testimonials" className="bg-[#0D1D35]">
      <Container>
        <SectionHeader
          eyebrow="From Operations Teams"
          title="Built With Those Who Run Industrial Supply Chains"
          subtitle="Industrial Nexus was shaped by the real operational demands of manufacturers and logistics operators across Southwest Nigeria."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="bg-[#0A1628] border border-[rgba(150,180,220,0.1)] rounded-2xl p-8 hover:border-[rgba(150,180,220,0.2)] transition-colors duration-200"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.6,
                delay: (i % 2) * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4" aria-label="5 stars">
                {Array.from({ length: 5 }).map((_, j) => (
                  <span key={j} className="text-[#E85D04] text-sm" aria-hidden="true">
                    ★
                  </span>
                ))}
              </div>

              {/* Quote icon */}
              <Quote
                size={20}
                className="text-[#3D5A80] mb-4"
                aria-hidden="true"
              />

              <blockquote className="text-[0.9rem] text-[#C8D4E3] leading-[1.75] mb-7 italic">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-3 pt-5 border-t border-[rgba(150,180,220,0.08)]">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatarGradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                  aria-hidden="true"
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-[11px] text-[#8A9BB5]">
                    {t.role} · {t.company}
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
