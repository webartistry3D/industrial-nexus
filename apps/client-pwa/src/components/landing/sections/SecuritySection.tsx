"use client";

import { motion } from "framer-motion";
import { Lock, Users, FileText, KeyRound, ShieldCheck } from "lucide-react";
import { Section, SectionHeader, Container } from "@/components/landing/ui/Section";

const securityFeatures = [
  {
    icon: Lock,
    title: "AES-256 Encryption",
    description: "All data encrypted at rest and in transit using AES-256 and TLS 1.3 standards.",
  },
  {
    icon: Users,
    title: "Role-Based Access Control",
    description: "Granular permission architecture — operations teams, clients, and drivers see only what they need.",
  },
  {
    icon: FileText,
    title: "Immutable Audit Logs",
    description: "Every platform action timestamped, signed, and stored with tamper-evident integrity.",
  },
  {
    icon: KeyRound,
    title: "Multi-Factor Authentication",
    description: "MFA enforced by default across all user roles. No exceptions, no workarounds.",
  },
  {
    icon: ShieldCheck,
    title: "Data Integrity Guarantees",
    description: "Delivery records, weight validations, and POD evidence cannot be altered post-submission.",
  },
];

export function SecuritySection() {
  return (
    <Section id="security" className="bg-[#0A1628]">
      <Container>
        <SectionHeader
          eyebrow="Enterprise Security"
          title="Industrial-Grade Data Security"
          subtitle="Your operational data, shipment records, and client information are protected by enterprise security architecture built to financial services standards."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {securityFeatures.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className="bg-[#0D1D35] border border-[rgba(150,180,220,0.1)] rounded-xl p-6 text-center hover:border-[rgba(30,136,229,0.3)] transition-colors duration-200 group"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.55,
                  delay: i * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="w-12 h-12 rounded-xl bg-[rgba(30,136,229,0.12)] flex items-center justify-center mx-auto mb-4 group-hover:bg-[rgba(30,136,229,0.18)] transition-colors">
                  <Icon size={22} className="text-[#42A5F5]" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2 leading-tight">
                  {feature.title}
                </h3>
                <p className="text-[0.78rem] text-[#8A9BB5] leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
