"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface CompareProps {
  firstImage: string;
  secondImage: string;
  firstImageClassName?: string;
  secondImageClassname?: string;
  className?: string;
  slideMode?: "hover" | "drag";
}

export function Compare({
  firstImage,
  secondImage,
  firstImageClassName = "",
  secondImageClassname = "",
  className = "",
  slideMode = "hover",
}: CompareProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && slideMode !== "hover") return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleMouseDown = () => {
    if (slideMode === "drag") {
      setIsDragging(true);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mouseup", handleMouseUp);
      return () => document.removeEventListener("mouseup", handleMouseUp);
    }
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
      onMouseDown={handleMouseDown}
    >
      {/* First Image */}
      <img
        src={firstImage}
        alt="Before"
        className={`absolute inset-0 w-full h-full ${firstImageClassName}`}
        onError={(e) => {
          console.error('Error loading first image:', firstImage);
          e.currentTarget.style.display = 'none';
        }}
      />

      {/* Second Image with clipping */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={secondImage}
          alt="After"
          className={`absolute inset-0 w-full h-full ${secondImageClassname}`}
          style={{ right: 0, left: "auto" }}
          onError={(e) => {
            console.error('Error loading second image:', secondImage);
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* Simple Slider Line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white/30 cursor-pointer"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Orange knob */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-8 bg-sunglow rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing">
            <div className="w-4 h-0.5 bg-vista-white"></div>
          </div>
        </div>
      </div>
    </div>
  );
}