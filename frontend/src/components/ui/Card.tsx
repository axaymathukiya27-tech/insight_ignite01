import React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-white rounded-3xl border border-[#E3D8CC] shadow-sm hover:shadow-md transition-shadow p-6 sm:p-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
