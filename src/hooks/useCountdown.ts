"use client";

import { useEffect, useState } from "react";

/**
 * Ticks a live HH:MM:SS countdown toward `Date.now() + remainingSeconds`.
 * Target is rebuilt whenever remainingSeconds changes (loading → ready),
 * so the hook stays correct as fetch data arrives. Pure text updates —
 * no animation, per DESIGN.md motion rules.
 */
export function useCountdown(remainingSeconds: number | null): string {
  const [target, setTarget] = useState<number | null>(null);

  useEffect(() => {
    setTarget(
      remainingSeconds == null ? null : Date.now() + remainingSeconds * 1000,
    );
  }, [remainingSeconds]);

  const [text, setText] = useState("--:--:--");

  useEffect(() => {
    if (target == null) return;
    const tick = () => {
      const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
      const h = String(Math.floor(s / 3600)).padStart(2, "0");
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const sec = String(s % 60).padStart(2, "0");
      setText(`${h}:${m}:${sec}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return target == null ? "--:--:--" : text;
}
