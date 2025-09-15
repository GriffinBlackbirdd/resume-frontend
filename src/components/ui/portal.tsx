"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
}

/**
 * Portal Component
 *
 * Renders children directly to document.body to escape containing blocks.
 * Used for modals, overlays, and elements that need viewport-level positioning.
 *
 * Design Notes:
 * - Preserves all design system styling from child components
 * - Ensures modal overlays use proper Vista White backgrounds and Mine Shaft text
 * - Maintains z-index hierarchy for proper layering
 */
export function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    children,
    document.body
  );
}