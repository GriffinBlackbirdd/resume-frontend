"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CinematicButton } from "@/components/ui/cinematic-button";

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
        <div className="text-white font-bold text-lg tracking-wider brand-heading">
          Alpha
        </div>
      </div>
      
      <CinematicButton variant="sunglow" size="sm">
        Sign In
      </CinematicButton>
    </div>
  );
};