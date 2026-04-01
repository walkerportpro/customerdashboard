import React, { ReactNode } from "react";

interface StatusBadgeProps {
  variant: "green" | "yellow" | "red" | "blue" | "purple" | "accent";
  children: ReactNode;
}

const variantClasses: Record<StatusBadgeProps["variant"], string> = {
  green: "badge-green",
  yellow: "badge-yellow",
  red: "badge-red",
  blue: "badge-blue",
  purple: "badge-purple",
  accent: "bg-accent-500/10 text-accent-400 border border-accent-500/20 px-2 py-0.5 rounded-full text-xs font-medium",
};

export default function StatusBadge({ variant, children }: StatusBadgeProps) {
  return <span className={variantClasses[variant]}>{children}</span>;
}
