/**
 * App-wide providers component.
 *
 * Wraps the application with all necessary providers:
 * - Error Boundary for catching and displaying errors
 * - Toast notifications (Sonner)
 */

"use client";

import { type ReactNode } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Application providers wrapper.
 *
 * Add all global providers here to keep the root layout clean.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "white",
            color: "#1f2937",
            border: "1px solid #e5e7eb",
          },
        }}
        closeButton
        richColors
      />
    </ErrorBoundary>
  );
}
