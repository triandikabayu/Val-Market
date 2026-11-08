"use client";

interface CountdownTimerProps {
  text: string;
}

export function CountdownTimer({ text }: CountdownTimerProps) {
  return (
    <p className="flex items-baseline gap-2">
      <span className="text-sm text-ink-muted">Resets in</span>
      <time className="font-mono text-lg font-semibold text-accent" role="timer">
        {text}
      </time>
    </p>
  );
}
