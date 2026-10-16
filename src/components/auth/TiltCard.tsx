"use client";

import { useRef } from "react";

/** Tilts toward the cursor in 3D (a few degrees, with a soft glare). No-op on touch screens, which never fire mousemove. */
export function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transition = "transform 0.08s ease-out";
    el.style.transform = `perspective(1000px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateZ(0)`;
    el.style.setProperty("--glare-x", `${((x + 0.5) * 100).toFixed(0)}%`);
    el.style.setProperty("--glare-y", `${((y + 0.5) * 100).toFixed(0)}%`);
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
    el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
  }

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`relative [transform-style:preserve-3d] ${className}`}>
      {/* glare that follows the cursor */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 [div:hover>&]:opacity-100"
        style={{
          background: "radial-gradient(500px circle at var(--glare-x, 50%) var(--glare-y, 0%), rgba(255,255,255,0.14), transparent 45%)",
        }}
      />
      {children}
    </div>
  );
}
