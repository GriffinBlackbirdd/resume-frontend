import * as React from "react";
import { cn } from "@/lib/utils";

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, variant = "primary", size = "md", icon, children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center font-sf font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-sunglow text-mine-shaft hover:bg-sunglow/90 focus:ring-sunglow shadow-sm hover:shadow-md rounded-xl",
      secondary: "bg-mine-shaft dark:bg-onyx-gray text-vista-white dark:text-platinum-gray hover:bg-mine-shaft/90 dark:hover:bg-onyx-gray/90 focus:ring-mine-shaft dark:focus:ring-gray-600 shadow-sm hover:shadow-md rounded-xl",
      outline: "border-2 border-sunglow text-sunglow bg-vista-white dark:bg-onyx-gray hover:bg-sunglow/10 dark:hover:bg-sunglow/20 focus:ring-sunglow rounded-xl",
      ghost: "text-mine-shaft dark:text-platinum-gray hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-300 dark:focus:ring-gray-600 rounded-lg",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md rounded-xl",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2.5",
    };

    return (
      <button
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      >
        {children}
        {icon && <span className="flex-shrink-0">{icon}</span>}
      </button>
    );
  }
);

ActionButton.displayName = "ActionButton";

export { ActionButton };