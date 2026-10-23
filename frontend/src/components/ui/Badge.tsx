import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "accent";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-colors";

  const variants = {
    default: "bg-[#FAF5EE] text-[#8C5E42] border border-[#E3D8CC]",
    outline: "border border-[#D5C6B5] text-[#5C4D42]",
    accent: "bg-[#8C5E42] text-white",
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
