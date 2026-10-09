"use client";

import { useEffect, useRef, useState } from "react";

// Eases the displayed number toward `value` whenever it changes.
export function CountUp({ value, duration = 700 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = from.current;
    if (reduceMotion || start === value) {
      from.current = value;
      const id = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(id);
    }

    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(start + (value - start) * eased);
      from.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span className="tabular-nums">{display}</span>;
}
