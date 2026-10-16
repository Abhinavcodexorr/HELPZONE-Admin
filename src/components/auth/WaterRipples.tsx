"use client";

import { useEffect, useRef } from "react";

interface Ripple {
  x: number;
  y: number;
  start: number;
  /** Random phases so every ripple wobbles differently. */
  p1: number;
  p2: number;
  p3: number;
}

/** Fire this on window to start a ripple at viewport coordinates (e.g. from the Sign in button). */
export const RIPPLE_EVENT = "hz:ripple";

const DURATION_MS = 5200;
const RINGS = 4;
const RING_GAP = 58;
const SEGMENTS = 120;

/**
 * Click (or tap) the background and slow, wobbly water waves spread out from that
 * point and fade. Each ring is an irregular loop (not a perfect circle) whose shape
 * keeps drifting as it travels. Drawn on a canvas over the background and under the
 * card; clicks on anything marked [data-no-ripple] (the form) are ignored.
 */
export function WaterRipples() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ripples: Ripple[] = [];
    let raf = 0;
    let dpr = 1;
    let width = 0;
    let height = 0;

    function resize() {
      const rect = host!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    /** Traces one wobbly closed loop of mean radius `r`, `seconds` into the ripple's life. */
    function tracePath(rp: Ripple, r: number, ring: number, seconds: number) {
      const wob = r * 0.035 + 3;
      ctx!.beginPath();
      for (let i = 0; i <= SEGMENTS; i += 1) {
        const a = (i / SEGMENTS) * Math.PI * 2;
        const radius =
          r +
          wob * Math.sin(2 * a + rp.p1 + seconds * 0.55 + ring * 0.7) +
          wob * 0.7 * Math.sin(3 * a + rp.p2 - seconds * 0.8 + ring * 1.1) +
          wob * 0.45 * Math.sin(5 * a + rp.p3 + seconds * 0.45 - ring * 0.5);
        const px = rp.x + Math.cos(a) * radius;
        const py = rp.y + Math.sin(a) * radius;
        if (i === 0) ctx!.moveTo(px, py);
        else ctx!.lineTo(px, py);
      }
      ctx!.closePath();
    }

    function frame(now: number) {
      ctx!.clearRect(0, 0, width, height);
      const maxR = Math.hypot(width, height) * 0.55;
      ctx!.lineJoin = "round";

      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const rp = ripples[i];
        const t = (now - rp.start) / DURATION_MS;
        if (t >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        const seconds = (now - rp.start) / 1000;
        const eased = 1 - Math.pow(1 - t, 1.9); // gentle start, long glide
        const radius = eased * maxR;

        // A soft glow where the drop lands.
        if (t < 0.18) {
          const fade = 1 - t / 0.18;
          const flash = ctx!.createRadialGradient(rp.x, rp.y, 0, rp.x, rp.y, 70);
          flash.addColorStop(0, `rgba(255,255,255,${0.45 * fade})`);
          flash.addColorStop(1, "rgba(255,255,255,0)");
          ctx!.fillStyle = flash;
          ctx!.beginPath();
          ctx!.arc(rp.x, rp.y, 70, 0, Math.PI * 2);
          ctx!.fill();
        }

        for (let k = 0; k < RINGS; k += 1) {
          const ringR = radius - k * RING_GAP;
          if (ringR <= 6) continue;
          const amp = Math.pow(1 - t, 1.35) * (1 - k * 0.2);

          // Trough: a darker band just outside the crest, like light bending through water.
          ctx!.shadowBlur = 0;
          tracePath(rp, ringR + 9, k, seconds);
          ctx!.strokeStyle = `rgba(0,8,50,${0.2 * amp})`;
          ctx!.lineWidth = 16;
          ctx!.stroke();

          // Body sheen.
          tracePath(rp, ringR, k, seconds);
          ctx!.strokeStyle = `rgba(255,255,255,${0.07 * amp})`;
          ctx!.lineWidth = 20;
          ctx!.stroke();

          // Crest: thin bright glowing line.
          ctx!.shadowColor = `rgba(255,255,255,${0.55 * amp})`;
          ctx!.shadowBlur = 14;
          tracePath(rp, ringR, k, seconds);
          ctx!.strokeStyle = `rgba(255,255,255,${0.5 * amp})`;
          ctx!.lineWidth = 2.6;
          ctx!.stroke();
          ctx!.shadowBlur = 0;
        }
      }

      raf = ripples.length ? requestAnimationFrame(frame) : 0;
      if (!ripples.length) ctx!.clearRect(0, 0, width, height);
    }

    function addRipple(clientX: number, clientY: number) {
      const rect = host!.getBoundingClientRect();
      ripples.push({
        x: clientX - rect.left,
        y: clientY - rect.top,
        start: performance.now(),
        p1: Math.random() * Math.PI * 2,
        p2: Math.random() * Math.PI * 2,
        p3: Math.random() * Math.PI * 2,
      });
      if (ripples.length > 6) ripples.shift();
      if (!raf) raf = requestAnimationFrame(frame);
    }

    function onPointerDown(e: PointerEvent) {
      if ((e.target as HTMLElement).closest("[data-no-ripple]")) return;
      addRipple(e.clientX, e.clientY);
    }
    function onTrigger(e: Event) {
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
      addRipple(x, y);
    }
    host.addEventListener("pointerdown", onPointerDown);
    window.addEventListener(RIPPLE_EVENT, onTrigger);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      host.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener(RIPPLE_EVENT, onTrigger);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] h-full w-full" />;
}
