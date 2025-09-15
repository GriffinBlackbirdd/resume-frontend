import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "underline";
  color?: "sunglow" | "mine-shaft" | "gray";
  size?: "sm" | "md" | "lg";
}

const TextButton = React.forwardRef<HTMLButtonElement, TextButtonProps>(
  ({ className, variant = "default", color = "sunglow", size = "md", children, ...props }, ref) => {
    const baseClasses = "font-medium transition-all duration-200 focus:outline-none";

    const colors = {
      sunglow: "text-sunglow hover:text-yellow-600",
      "mine-shaft": "text-mine-shaft hover:text-gray-700",
      gray: "text-gray-600 hover:text-gray-800"
    };

    const variants = {
      default: "",
      underline: "underline underline-offset-4 hover:underline-offset-2"
    };

    const sizes = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg"
    };

    return (
      <button
        className={cn(baseClasses, colors[color], variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TextButton.displayName = "TextButton";

export { TextButton };