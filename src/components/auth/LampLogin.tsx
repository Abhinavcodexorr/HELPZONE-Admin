"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/ui/Logo";

// Dust drifting up through the beam. Fixed values (not random) so server and client markup match.
// l/t are % of the lamp box; the beam widens from the shade down, so lower motes spread wider.
const MOTES = [
  { l: 44, t: 38, s: 3, d: 7.2, de: 0, dx: 12 },
  { l: 58, t: 44, s: 2, d: 8.4, de: 1.1, dx: -9 },
  { l: 36, t: 52, s: 2, d: 6.6, de: 2.3, dx: 14 },
  { l: 66, t: 56, s: 3, d: 9.1, de: 0.6, dx: -12 },
  { l: 28, t: 62, s: 2, d: 7.8, de: 3.4, dx: 10 },
  { l: 74, t: 64, s: 2, d: 6.9, de: 1.8, dx: -14 },
  { l: 50, t: 60, s: 3, d: 8.8, de: 4.2, dx: 8 },
  { l: 20, t: 72, s: 2, d: 7.5, de: 2.9, dx: 16 },
  { l: 82, t: 74, s: 3, d: 9.4, de: 0.3, dx: -10 },
  { l: 40, t: 74, s: 2, d: 6.8, de: 5.1, dx: -8 },
  { l: 62, t: 78, s: 2, d: 8.1, de: 3.7, dx: 12 },
  { l: 10, t: 82, s: 3, d: 9.8, de: 1.4, dx: 14 },
  { l: 90, t: 84, s: 2, d: 7.1, de: 4.6, dx: -16 },
  { l: 52, t: 84, s: 3, d: 8.6, de: 2.0, dx: -6 },
];

const SHADE =
  "M72 40 L128 40 Q131 40 133 46 L166 140 Q167 146 161 146 L39 146 Q33 146 34 140 L67 46 Q69 40 72 40 Z";

/**
 * "Lamp login": a dark blue room with a floor lamp, switched on by default so the
 * sign-in card is there as soon as the page opens. Drag the cord down to click the
 * lamp off and on (a quick tap or Enter/Space works too).
 */
// How far (in lamp-drawing units) the cord must be pulled to click the lamp, and how far it can stretch.
const PULL_THRESHOLD = 20;
const PULL_MAX = 58;

export function LampLogin({ next }: { next: string }) {
  const [lit, setLit] = useState(true);
  const [drag, setDrag] = useState(0); // how far the cord is pulled down right now
  const [grabbing, setGrabbing] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const gesture = useRef<{ startY: number; moved: number; fired: boolean } | null>(null);
  const spring = useRef(0);

  useEffect(() => () => cancelAnimationFrame(spring.current), []);

  /** Springs the cord back up with a little bounce. */
  function springBack(from: number) {
    cancelAnimationFrame(spring.current);
    let x = from;
    let v = 0;
    const step = () => {
      v = (v - x * 0.2) * 0.76;
      x += v;
      if (Math.abs(x) < 0.12 && Math.abs(v) < 0.12) {
        setDrag(0);
        return;
      }
      setDrag(Math.max(x, -5));
      spring.current = requestAnimationFrame(step);
    };
    spring.current = requestAnimationFrame(step);
  }

  /** A quick tug (tap or keyboard): the cord dips, the lamp clicks, the cord springs back. */
  function tug() {
    setLit((v) => !v);
    setDrag(18);
    setTimeout(() => springBack(18), 90);
  }

  function onPointerDown(e: React.PointerEvent<SVGGElement>) {
    cancelAnimationFrame(spring.current);
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { startY: e.clientY, moved: 0, fired: false };
    setGrabbing(true);
  }

  function onPointerMove(e: React.PointerEvent<SVGGElement>) {
    const g = gesture.current;
    const svg = svgRef.current;
    if (!g || !svg) return;
    const unitsPerPx = 620 / svg.getBoundingClientRect().height;
    const raw = Math.max(0, (e.clientY - g.startY) * unitsPerPx);
    g.moved = Math.max(g.moved, e.clientY - g.startY);
    // Rubber band: the cord resists the further you pull.
    const shown = raw < PULL_MAX * 0.7 ? raw : PULL_MAX * 0.7 + (raw - PULL_MAX * 0.7) * 0.25;
    setDrag(Math.min(shown, PULL_MAX));
    // Click the lamp the moment the pull is long enough, like a real cord.
    if (!g.fired && raw >= PULL_THRESHOLD) {
      g.fired = true;
      setLit((v) => !v);
    }
  }

  function onPointerUp() {
    const g = gesture.current;
    gesture.current = null;
    setGrabbing(false);
    if (!g) return;
    if (g.fired) {
      springBack(drag);
    } else if (g.moved < 5) {
      tug(); // basically a tap
    } else {
      springBack(drag); // a short pull that didn't reach the click
    }
  }

  const fade = `transition-opacity duration-700 ${lit ? "opacity-100" : "opacity-0"}`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#03050c] text-[#eef3ff]">
      {/* the room, lit blue by the lamp */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 transition-opacity duration-[900ms] ${lit ? "opacity-100" : "opacity-0"}`}
        style={{
          background:
            "radial-gradient(70% 60% at 50% 22%, rgba(40,84,214,0.55), rgba(10,24,80,0.45) 45%, transparent 75%), linear-gradient(180deg, #0a1438 0%, #03050c 100%)",
        }}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 hidden transition-opacity duration-[900ms] lg:block ${lit ? "opacity-100" : "opacity-0"}`}
        style={{
          background:
            "radial-gradient(55% 75% at 27% 38%, rgba(52,104,240,0.6), rgba(12,28,92,0.4) 50%, transparent 78%), radial-gradient(38% 52% at 73% 48%, rgba(70,115,255,0.2), transparent 70%)",
        }}
      />
      {/* vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 50% 40%, transparent 45%, rgba(0,0,0,0.65) 100%)" }}
      />

      <Logo surface="dark" className="absolute left-6 top-6 z-20 h-9 w-auto opacity-90 sm:left-10 sm:top-8" />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl items-center gap-4 px-6 pb-14 pt-24 lg:grid-cols-2 lg:gap-8 lg:pt-10">
        {/* ── lamp ── */}
        <div className="flex justify-center">
          <div className="relative aspect-[200/620] h-[270px] sm:h-[330px] lg:h-[min(72vh,600px)]">
            {/* wide soft halo */}
            <div
              aria-hidden
              className={`pointer-events-none absolute -top-[27%] left-[-110%] aspect-square w-[320%] ${lit ? "opacity-100 [animation:lamp-on_0.8s_ease-out]" : "opacity-0"} transition-opacity duration-700`}
              style={{ background: "radial-gradient(circle, rgba(130,170,255,0.55) 0%, rgba(80,125,255,0.2) 38%, transparent 68%)" }}
            />
            {/* beam: soft wide cone + brighter blurred core */}
            <div
              aria-hidden
              className={`pointer-events-none absolute left-[-150%] top-[23.5%] h-[72%] w-[400%] ${fade}`}
              style={{
                background: "linear-gradient(180deg, rgba(150,188,255,0.36), rgba(90,135,255,0.04))",
                clipPath: "polygon(42.4% 0, 57.6% 0, 100% 100%, 0 100%)",
                WebkitMaskImage: "linear-gradient(90deg, transparent, black 26%, black 74%, transparent)",
                maskImage: "linear-gradient(90deg, transparent, black 26%, black 74%, transparent)",
              }}
            />
            <div
              aria-hidden
              className={`pointer-events-none absolute left-[-70%] top-[23.5%] h-[62%] w-[240%] blur-[12px] ${fade}`}
              style={{
                background: "linear-gradient(180deg, rgba(225,238,255,0.34), rgba(150,188,255,0))",
                clipPath: "polygon(37.3% 0, 62.7% 0, 91.7% 100%, 8.3% 100%)",
              }}
            />
            {/* dust in the beam */}
            <div aria-hidden className={`pointer-events-none absolute inset-0 ${fade}`}>
              {MOTES.map((m, i) => (
                <span
                  key={i}
                  className="mote absolute rounded-full bg-[#dbe8ff]"
                  style={{
                    left: `${m.l}%`,
                    top: `${m.t}%`,
                    width: m.s,
                    height: m.s,
                    animationDuration: `${m.d}s`,
                    animationDelay: `${m.de}s`,
                    ["--dx" as string]: `${m.dx}px`,
                    boxShadow: "0 0 6px rgba(190,215,255,0.9)",
                  }}
                />
              ))}
            </div>
            {/* pool of light on the floor */}
            <div
              aria-hidden
              className={`pointer-events-none absolute left-[-130%] top-[86%] h-[14%] w-[360%] ${fade}`}
              style={{ background: "radial-gradient(ellipse at center, rgba(175,205,255,0.6) 0%, rgba(100,145,255,0.26) 40%, transparent 68%)" }}
            />

            <svg ref={svgRef} viewBox="0 0 200 620" className="relative h-full w-full overflow-visible" role="img" aria-label="A floor lamp">
              <defs>
                <linearGradient id="shade-off" x1="0" x2="1">
                  <stop offset="0" stopColor="#141a2e" />
                  <stop offset="0.5" stopColor="#060914" />
                  <stop offset="1" stopColor="#141a2e" />
                </linearGradient>
                <linearGradient id="shade-on" x1="0" x2="1">
                  <stop offset="0" stopColor="#3f6fe6" />
                  <stop offset="0.5" stopColor="#f1f6ff" />
                  <stop offset="1" stopColor="#3f6fe6" />
                </linearGradient>
                <linearGradient id="shade-sheen" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
                  <stop offset="1" stopColor="#ffffff" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="pole" x1="0" x2="1">
                  <stop offset="0" stopColor="#2a3250" />
                  <stop offset="0.5" stopColor="#0a0d18" />
                  <stop offset="1" stopColor="#2a3250" />
                </linearGradient>
                <linearGradient id="steel" x1="0" x2="1">
                  <stop offset="0" stopColor="#f2f6ff" />
                  <stop offset="0.5" stopColor="#7c8cb0" />
                  <stop offset="1" stopColor="#f2f6ff" />
                </linearGradient>
                <filter id="bloom" x="-300%" y="-300%" width="700%" height="700%">
                  <feGaussianBlur stdDeviation="12" />
                </filter>
                <filter id="soft" x="-200%" y="-200%" width="500%" height="500%">
                  <feGaussianBlur stdDeviation="4.5" />
                </filter>
              </defs>

              {/* pole + base */}
              <rect x="97" y="150" width="6" height="392" fill="url(#pole)" />
              <rect x="94" y="146" width="12" height="14" rx="2" fill="url(#steel)" />
              <rect x="95" y="330" width="10" height="9" rx="1.5" fill="url(#steel)" />
              <ellipse cx="100" cy="562" rx="54" ry="12" fill="#04060d" />
              <ellipse cx="100" cy="553" rx="50" ry="10" fill="#10152a" />
              <ellipse cx="100" cy="553" rx="34" ry="5" fill="none" stroke="url(#steel)" strokeWidth="2" />
              {/* a faint reflection of the lit lamp on the base */}
              <ellipse
                cx="100"
                cy="551"
                rx="30"
                ry="3"
                fill="#9dbdff"
                style={{ opacity: lit ? 0.35 : 0, transition: "opacity 600ms ease" }}
                filter="url(#soft)"
              />

              {/* shade: dark, then the lit version and a top-to-bottom sheen fade in over it */}
              <path d={SHADE} fill="url(#shade-off)" />
              <path d={SHADE} fill="url(#shade-on)" style={{ opacity: lit ? 1 : 0, transition: "opacity 600ms ease" }} />
              <path d={SHADE} fill="url(#shade-sheen)" style={{ opacity: lit ? 1 : 0, transition: "opacity 600ms ease" }} />
              <ellipse cx="100" cy="40" rx="28" ry="4.5" fill="#000" opacity={lit ? 0.1 : 0.5} />
              {/* glowing underside of the shade */}
              <ellipse
                cx="100"
                cy="146"
                rx="61"
                ry="7"
                fill="#a9c6ff"
                filter="url(#soft)"
                style={{ opacity: lit ? 0.85 : 0, transition: "opacity 600ms ease" }}
              />
              <ellipse
                cx="100"
                cy="146"
                rx="61"
                ry="7"
                fill={lit ? "#eef4ff" : "#04060d"}
                style={{ transition: "fill 600ms ease" }}
              />

              {/* bulb: wide bloom, tighter glow, bright core */}
              <circle cx="100" cy="150" r="34" fill="#6f9bff" filter="url(#bloom)" style={{ opacity: lit ? 0.75 : 0, transition: "opacity 500ms ease" }} />
              <circle cx="100" cy="150" r="16" fill="#b9d1ff" filter="url(#soft)" style={{ opacity: lit ? 0.95 : 0, transition: "opacity 500ms ease" }} />
              <circle cx="100" cy="148" r="7.5" fill="#ffffff" style={{ opacity: lit ? 1 : 0.06, transition: "opacity 400ms ease" }} />

              {/* pull cord: drag the bead down to click the lamp */}
              <g
                role="button"
                tabIndex={0}
                aria-pressed={lit}
                aria-label={lit ? "Pull the cord to turn the lamp off" : "Pull the cord to turn the lamp on"}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    tug();
                  }
                }}
                style={{ touchAction: "none", cursor: grabbing ? "grabbing" : "grab" }}
                className="outline-none [&:focus-visible_circle]:stroke-white [&:focus-visible_circle]:stroke-2"
              >
                {/* generous grab area around the cord and bead, following the bead down */}
                <rect x="112" y="146" width="48" height={174 + drag} fill="transparent" />
                <line x1="136" y1="146" x2="136" y2={282 + drag} stroke={lit ? "#dbe6ff" : "#566079"} strokeWidth="1.6" />
                <circle cx="136" cy={287 + drag} r="5.5" fill="url(#steel)" stroke="transparent" />
              </g>
            </svg>

            {/* hint */}
            <p
              aria-hidden
              className={`pointer-events-none absolute left-[78%] top-[43%] whitespace-nowrap font-[family-name:var(--font-playfair)] text-sm italic text-[#7284ad] transition-opacity duration-500 ${lit ? "opacity-0" : "animate-pulse opacity-100"}`}
            >
              pull the cord
            </p>
          </div>
        </div>

        {/* ── sign-in card ── */}
        <div
          inert={!lit}
          aria-hidden={!lit}
          className={`mx-auto w-full max-w-[26rem] animate-slide-up transition-all duration-[800ms] ease-out ${
            lit ? "translate-y-0 opacity-100 delay-300 lg:translate-x-0" : "pointer-events-none translate-y-4 opacity-0 lg:translate-x-8 lg:translate-y-0"
          }`}
        >
          <div className="relative">
            {/* blue glow so the card is lit by the lamp */}
            <div aria-hidden className="absolute -inset-4 rounded-[40px] bg-[#4a76ff]/30 blur-3xl" />

            {/* gradient edge */}
            <div className="relative rounded-[30px] bg-gradient-to-br from-white/95 via-[#a9c1ff]/70 to-[#2f5be0]/60 p-[1.5px] shadow-[0_44px_90px_-26px_rgba(0,0,0,0.9)]">
              <div className="relative overflow-hidden rounded-[28.5px] bg-gradient-to-b from-white via-[#f6f9ff] to-[#e8f0ff] p-7 sm:p-9">
                {/* accent line + soft highlights */}
                <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2f5be0] via-[#7aa2ff] to-[#2f5be0]" />
                <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#2f5be0]/12 blur-3xl" />
                <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-[#7aa2ff]/15 blur-3xl" />

                {/* glossy lock badge */}
                <span className="absolute right-6 top-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#7fa2ff] via-[#3f6df0] to-[#2449c9] text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.55),0_10px_20px_-6px_rgba(47,91,224,0.7)] sm:right-8 sm:top-9">
                  <Lock className="h-5 w-5" />
                </span>

                <h1 className="relative font-[family-name:var(--font-playfair)] text-[2.4rem] leading-[1.05] tracking-tight text-[#0b1230]">
                  Welcome back.
                </h1>

                <div className="relative mt-8">
                  <LoginForm next={next} />
                </div>

                <p className="relative mt-7 border-t border-[#d9e3f8] pt-5 text-center text-xs leading-relaxed text-[#6b7a9e]">
                  <ShieldCheck className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px text-[#2f5be0]" />
                  Secured session · Access limited to authorised administrators
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
