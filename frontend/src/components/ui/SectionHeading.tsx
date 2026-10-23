import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  badge?: string;
  badgeIcon?: React.ReactNode;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}

export default function SectionHeading({
  badge,
  badgeIcon,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        align === "center" ? "text-center max-w-3xl mx-auto" : "text-left max-w-2xl",
        className
      )}
    >
      {badge && (
        <div
          className={cn(
            "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 border",
            "bg-[#FAF5EF] text-[#8C5E42] border-[#EADBCE]"
          )}
        >
          {badgeIcon}
          <span>{badge}</span>
        </div>
      )}
      <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2D241E] tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg text-[#615247] leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
