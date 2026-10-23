import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variantStyles = {
      primary:
        "bg-[#8C5E42] text-[#FDFBF7] hover:bg-[#724B34] focus:ring-[#8C5E42]",
      secondary:
        "bg-[#FAF5EE] text-[#5C4D42] border border-[#E3D8CC] hover:bg-[#F2EAE0] focus:ring-[#8C5E42]",
      outline:
        "border border-[#D5C6B5] text-[#4A3C32] hover:bg-[#F2ECE4] focus:ring-[#8C5E42]",
      ghost:
        "text-[#5C4D42] hover:bg-[#FAF5EE] hover:text-[#2D241E] focus:ring-[#8C5E42]",
    };

    const sizeStyles = {
      sm: "px-4 py-1.5 text-xs",
      md: "px-6 py-2.5 text-sm",
      lg: "px-8 py-3.5 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
