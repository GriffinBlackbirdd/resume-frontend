import * as React from "react";
import { cn } from "@/lib/utils";

export interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gradient";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const BrandButton = React.forwardRef<HTMLButtonElement, BrandButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-sunglow text-mine-shaft hover:bg-yellow-500 focus:ring-sunglow shadow-sm hover:shadow-md",
      secondary: "bg-gray-200 text-mine-shaft hover:bg-gray-300 focus:ring-gray-400",
      outline: "border-2 border-sunglow text-sunglow bg-transparent hover:bg-sunglow/10 focus:ring-sunglow",
      ghost: "text-sunglow hover:bg-sunglow/10 focus:ring-sunglow",
      gradient: "bg-gradient-to-r from-sunglow to-yellow-500 text-mine-shaft hover:from-yellow-400 hover:to-yellow-600 focus:ring-sunglow shadow-lg hover:shadow-xl"
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg"
    };

    return (
      <button
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

BrandButton.displayName = "BrandButton";

export { BrandButton };