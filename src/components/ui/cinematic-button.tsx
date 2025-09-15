import * as React from "react";
import { cn } from "@/lib/utils";

export interface CinematicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "sunglow" | "dynamic";
  size?: "sm" | "md" | "lg";
  shimmer?: boolean;
}

const CinematicButton = React.forwardRef<HTMLButtonElement, CinematicButtonProps>(
  ({ className, variant = "sunglow", size = "md", shimmer = true, children, ...props }, ref) => {
    const baseClasses = "relative inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 overflow-hidden group";

    const variants = {
      sunglow: "bg-gradient-to-r from-sunglow to-yellow-500 text-mine-shaft hover:from-yellow-400 hover:to-yellow-600 shadow-lg hover:shadow-xl transform hover:scale-105",
      dynamic: "bg-gradient-to-r from-sunglow via-purple-500 to-blue-500 text-white hover:from-yellow-400 hover:via-purple-600 hover:to-blue-600 shadow-2xl hover:shadow-3xl transform hover:scale-105"
    };

    const sizes = {
      sm: "px-4 py-1.5 text-sm",
      md: "px-6 py-2.5 text-base",
      lg: "px-8 py-3 text-lg"
    };

    return (
      <button
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      >
        {/* Shimmer Effect */}
        {shimmer && (
          <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
        )}

        {/* Gradient Border Animation */}
        <div className="absolute inset-0 rounded-full p-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sunglow to-yellow-500" />
        </div>

        <span className="relative z-10 flex items-center">
          {children}
        </span>
      </button>
    );
  }
);

CinematicButton.displayName = "CinematicButton";

export { CinematicButton };