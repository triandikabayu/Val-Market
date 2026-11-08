"use client";

import { CircleNotch } from "@phosphor-icons/react";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 px-5 h-11 font-sans font-bold text-sm uppercase tracking-wide transition-colors duration-200 ease-(--ease-out-quart) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40";

const variants = {
  primary:
    "clip-corner bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-press focus-visible:outline-on-accent",
  secondary:
    "border border-line bg-transparent text-ink hover:border-ink-muted hover:bg-surface-2 active:bg-line/30 focus-visible:outline-ink",
  ghost:
    "bg-transparent text-ink-muted hover:text-ink hover:bg-surface-2 active:bg-line/30 focus-visible:outline-ink",
} as const;

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading && (
        <CircleNotch
          size={16}
          className="animate-spin"
          aria-hidden
          weight="bold"
        />
      )}
      {children}
    </button>
  );
}
