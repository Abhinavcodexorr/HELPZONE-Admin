"use client";

import { useEffect, useId, useState } from "react";
import type { Point } from "@/lib/dashboard-stats";

function smoothPath(coords: { x: number; y: number }[]) {
  if (coords.length === 0) return "";
  return coords.reduce((path, c, i) => {
    if (i === 0) return `M ${c.x} ${c.y}`;
    const prev = coords[i - 1];
    const mid = (prev.x + c.x) / 2;
    return `${path} C ${mid} ${prev.y}, ${mid} ${c.y}, ${c.x} ${c.y}`;
  }, "");
}

function project(values: number[], width: number, height: number, padX: number, padY: number) {
  const max = Math.max(...values, 1);
  const stepX = values.length > 1 ? (width - padX * 2) / (values.length - 1) : 0;
  return values.map((v, i) => ({
    x: padX + i * stepX,
    y: padY + (1 - v / max) * (height - padY * 2),
  }));
}

export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 120;
  const h = 40;
  const coords = project(values, w, h, 3, 5);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-28 overflow-visible" aria-hidden>
      <path
        d={smoothPath(coords)}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        className="animate-draw-line"
      />
    </svg>
  );
}

export function LineChart({ points, color }: { points: Point[]; color: string }) {
  const gradientId = useId();
  const w = 320;
  const h = 130;
  const coords = project(points.map((p) => p.value), w, h, 8, 14);
  const line = smoothPath(coords);
  const last = coords[coords.length - 1];
  // Show ~5 evenly spaced labels, always including the first and last point.
  const visible = new Set(
    points.length <= 5
      ? points.map((_, i) => i)
      : Array.from({ length: 5 }, (_, k) => Math.round((k * (points.length - 1)) / 4))
  );

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-36 w-full overflow-visible" role="img" aria-label="Applications over time">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={8}
            x2={w - 8}
            y1={14 + f * (h - 28)}
            y2={14 + f * (h - 28)}
            stroke="var(--border)"
            strokeDasharray="3 5"
          />
        ))}
        {last && (
          <path
            d={`${line} L ${last.x} ${h - 14} L ${coords[0].x} ${h - 14} Z`}
            fill={`url(#${gradientId})`}
            className="animate-fade-in"
          />
        )}
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          className="animate-draw-line"
        />
        {last && <circle cx={last.x} cy={last.y} r={4} fill="var(--surface)" stroke={color} strokeWidth={2.5} />}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-subtle">
        {points.map((p, i) => (
          <span key={p.label + i} className={visible.has(i) ? "" : "invisible"}>
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RingProgress({ percent, color }: { percent: number; color: string }) {
  const [shown, setShown] = useState(0);
  const r = 30;
  const circumference = 2 * Math.PI * r;

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(percent));
    return () => cancelAnimationFrame(id);
  }, [percent]);

  return (
    <div className="relative h-[84px] w-[84px] shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown / 100)}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-foreground">
        {Math.round(percent)}%
      </span>
    </div>
  );
}
