"use client";

import { LockSimple } from "@phosphor-icons/react";

export function PrivacyNote() {
  return (
    <p className="flex items-start gap-2 text-sm leading-relaxed text-ink-muted">
      <LockSimple
        size={16}
        weight="bold"
        aria-hidden
        className="mt-0.5 shrink-0 text-accent"
      />
      <span>
        Your username and password go straight from this device to Riot&apos;s
        servers — through no server of ours, never stored, never logged.
        Tokens live in memory only.
      </span>
    </p>
  );
}
