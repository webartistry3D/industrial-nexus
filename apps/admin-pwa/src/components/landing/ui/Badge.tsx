import { type ReactNode } from "react";

type BadgeVariant = "green" | "blue" | "orange" | "gray";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  green:
    "bg-[rgba(0,191,165,0.15)] text-[#00BFA5] border border-[rgba(0,191,165,0.2)]",
  blue: "bg-[rgba(30,136,229,0.15)] text-[#42A5F5] border border-[rgba(30,136,229,0.2)]",
  orange:
    "bg-[rgba(232,93,4,0.15)] text-[#FF7800] border border-[rgba(232,93,4,0.2)]",
  gray: "bg-[rgba(150,180,220,0.08)] text-[#C8D4E3] border border-[rgba(150,180,220,0.15)]",
};

const dotColors: Record<BadgeVariant, string> = {
  green: "bg-[#00BFA5]",
  blue: "bg-[#42A5F5]",
  orange: "bg-[#FF7800]",
  gray: "bg-[#C8D4E3]",
};

export function Badge({ children, variant = "gray", dot = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${variantStyles[variant]}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
