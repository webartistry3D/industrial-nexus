"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  id?: string;
  className?: string;
  tight?: boolean;
}

export function Section({ children, id, className = "", tight = false }: SectionProps) {
  return (
    <section
      id={id}
      className={`${tight ? "py-16 md:py-20" : "py-24 md:py-32"} ${className}`}
    >
      {children}
    </section>
  );
}

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  center = true,
}: SectionHeaderProps) {
  return (
    <motion.div
      className={`${center ? "text-center mx-auto" : ""} max-w-2xl mb-16`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#42A5F5] mb-4">
        {eyebrow}
      </p>
      <h2 className="text-3xl md:text-4xl lg:text-[2.6rem] font-bold text-white tracking-tight leading-[1.12] mb-5">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[#8A9BB5] text-base md:text-lg leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.65,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-[1180px] mx-auto px-6 ${className}`}>{children}</div>
  );
}
