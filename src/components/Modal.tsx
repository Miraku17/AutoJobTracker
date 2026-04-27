"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const w =
    size === "sm"
      ? "max-w-sm"
      : size === "lg"
      ? "max-w-2xl"
      : size === "xl"
      ? "max-w-4xl"
      : "max-w-lg";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center px-4 py-8 overflow-y-auto"
      style={{ isolation: "isolate" }}
    >
      <div
        className="absolute inset-0 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(0,0,0,0.65), rgba(7,15,29,0.55) 70%)",
        }}
      />
      <div
        className={cn(
          "relative w-full p-6 my-auto animate-rise rounded-sm border border-ink/25",
          w
        )}
        style={{
          backgroundColor: "#0f1f3a",
          boxShadow:
            "0 1px 0 rgba(0,0,0,0.55), 0 30px 70px -16px rgba(0,0,0,0.85), 0 0 0 1px rgba(245,247,250,0.06)",
        }}
      >
        {/* corner marks */}
        <span aria-hidden className="absolute -top-px -left-px w-3 h-3 border-t border-l border-ink" />
        <span aria-hidden className="absolute -top-px -right-px w-3 h-3 border-t border-r border-ink" />
        <span aria-hidden className="absolute -bottom-px -left-px w-3 h-3 border-b border-l border-ink" />
        <span aria-hidden className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-ink" />

        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="eyebrow-accent mb-1">Form</div>
            <h2 className="display text-2xl">{title}</h2>
          </div>
          <button
            className="btn-ghost !p-1.5 -mr-1"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="hairline pt-4">{children}</div>
      </div>
    </div>
  );
}
