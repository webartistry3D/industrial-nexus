"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[#E85D04] text-white shadow-[0_0_28px_rgba(232,93,4,0.35)] hover:bg-[#FF7800] hover:shadow-[0_4px_40px_rgba(232,93,4,0.5)]",
  outline:
    "bg-transparent text-[#C8D4E3] border border-[rgba(150,180,220,0.25)] hover:border-[rgba(150,180,220,0.5)] hover:bg-[rgba(150,180,220,0.06)]",
  ghost:
    "bg-transparent text-[#8A9BB5] border border-[rgba(150,180,220,0.12)] hover:bg-[rgba(150,180,220,0.06)] hover:text-[#F0F4FA]",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-lg",
  lg: "px-7 py-3.5 text-base rounded-xl",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  className = "",
  type = "button",
}: ButtonProps) {
  const base =
    "inline-flex items-center gap-2 font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap";
  const classes = `${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if (href) {
    return (
      <motion.a
        href={href}
        className={classes}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={classes}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}
