"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FloatingDockProps {
  className?: string;
}

export const FloatingDock = ({ className }: FloatingDockProps) => {
  return (
    <div className={cn(
      "fixed top-6 left-1/2 -translate-x-1/2 z-50",
      "flex items-center justify-between w-96",
      "px-6 py-2.5 rounded-full",
      "bg-gradient-to-r from-white/5 via-white/10 to-white/5",
      "backdrop-blur-xl border border-white/10",
      "shadow-2xl shadow-purple-500/20",
      "hover:shadow-purple-500/30 transition-all duration-300",
      "group",
      className
    )}>
      <div className="flex items-center">
        <div className="text-white font-bold text-lg tracking-wider">
          Alpha
        </div>
      </div>
      
      <button className={cn(
        "px-4 py-1.5 rounded-full",
        "bg-gradient-to-r from-purple-500/20 to-blue-500/20",
        "backdrop-blur-sm border border-white/20",
        "text-white text-sm font-semibold tracking-wide",
        "hover:from-purple-500/30 hover:to-blue-500/30",
        "hover:border-white/30 hover:scale-105",
        "transition-all duration-200",
        "shadow-lg hover:shadow-xl",
        "group-hover:shadow-purple-500/20"
      )}>
        Sign In
      </button>
    </div>
  );
};