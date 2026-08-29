"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The interactive banner.
 *
 * A field of drifting dots covers the whole band. Wherever the pointer goes,
 * the nearest dots peel away and assemble into a letter W around it, then drift
 * home when it moves on. The W is sampled from a five-point polyline rather
 * than a font, so it stays crisp at any size and needs no text measurement.
 *
 * Implementation notes that matter:
 *
 * • Canvas, not DOM. Three hundred animated elements would thrash layout;
 *   one canvas costs a single composite per frame.
 * • Dots are seeded from a small deterministic PRNG rather than Math.random,
 *   so the field is identical on every load. That is partly aesthetic and
 *   partly the hydration rule we have already been bitten by twice.
 * • The pointer listener is on `window`, so the effect follows the cursor even
 *   when it is over the text — the banner reacts to the whole screen, which is
 *   what makes it feel alive rather than like a widget.
 * • rAF stops entirely when the banner scrolls out of view, and never starts
 *   under prefers-reduced-motion; a decorative loop should not spin a laptop
 *   fan or fight someone's vestibular system.
 */

const DOT_COUNT = 340;
const W_POINTS = 64;        // dots recruited into the letter — enough to read as a stroke
const W_SIZE = 210;         // px across, matching the logo's 40pt path width
const LETTER_DOT_R = 3.1;   // uniform, mirroring the mark's constant stroke width
const INFLUENCE = 360;      // px, how far the pointer reaches

/** mulberry32 — tiny, seedable, good enough for scattering dots. */
function prng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The W, taken from the logo mark itself rather than drawn symmetrically.
 *
 * The mark's path in its 64pt grid is:
 *   M12.5 20.5 → 22 44.5 → 31.5 30 → 41 44.5 → 52.5 14.5
 *
 * That shape is deliberately asymmetric — the final stroke overshoots upward so
 * the W also reads as a tick — and a symmetric W loses the whole idea. These
 * are those exact vertices, translated to the path's own centre (32.5, 29.5)
 * and divided by its 40pt width, so the proportions are identical to the logo.
 */
function wTargets(count: number): { x: number; y: number }[] {
  const verts = [
    { x: -0.5000, y: -0.2250 },
    { x: -0.2625, y:  0.3750 },
    { x: -0.0250, y:  0.0125 },
    { x:  0.2125, y:  0.3750 },
    { x:  0.5000, y: -0.3750 },
  ];
  const segs = verts.slice(0, -1).map((v, i) => {
    const w = verts[i + 1];
    return { v, w, len: Math.hypot(w.x - v.x, w.y - v.y) };
  });
  const total = segs.reduce((s, g) => s + g.len, 0);
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    let d = (i / (count - 1)) * total;
    for (const g of segs) {
      if (d <= g.len || g === segs[segs.length - 1]) {
        const t = Math.min(d / g.len, 1);
        out.push({ x: g.v.x + (g.w.x - g.v.x) * t, y: g.v.y + (g.w.y - g.v.y) * t });
        break;
      }
      d -= g.len;
    }
  }
  return out;
}

interface Dot {
  hx: number; hy: number;   // home
  x: number; y: number;     // current
  r: number;
  phase: number;
  drift: number;
  target: number;           // index into the W, or -1
}

export function HeroBanner({ children }: { children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const targets = wTargets(W_POINTS);
    let dots: Dot[] = [];
    let w = 0, h = 0, dpr = 1;
    let pointer = { x: -9999, y: -9999, active: false };
    let raf = 0;
    let running = false;

    function seed() {
      const rand = prng(20260829);
      dots = Array.from({ length: DOT_COUNT }, () => ({
        hx: rand(), hy: rand(),        // stored 0..1, scaled on resize
        x: 0, y: 0,
        r: 0.7 + rand() * 1.9,
        phase: rand() * Math.PI * 2,
        drift: 0.35 + rand() * 0.9,
        target: -1,
      }));
    }

    function resize() {
      const rect = host!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const d of dots) { d.x = d.hx * w; d.y = d.hy * h; }
    }

    function assign() {
      // Recruit the dots nearest the pointer, closest-first, so the letter
      // builds outward from where the eye already is.
      for (const d of dots) d.target = -1;
      if (!pointer.active) return;
      const near = dots
        .map((d, i) => ({ i, dist: Math.hypot(d.hx * w - pointer.x, d.hy * h - pointer.y) }))
        .filter((o) => o.dist < INFLUENCE)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, W_POINTS);
      near.forEach((o, k) => { dots[o.i].target = k; });
    }

    function frame(t: number) {
      ctx!.clearRect(0, 0, w, h);
      const time = t * 0.001;

      for (const d of dots) {
        let tx: number, ty: number, pull: number;

        if (d.target >= 0) {
          const p = targets[d.target];
          tx = pointer.x + p.x * W_SIZE;
          ty = pointer.y + p.y * W_SIZE;
          pull = 0.14;
        } else {
          // Idle drift keeps the field breathing instead of sitting dead.
          tx = d.hx * w + Math.sin(time * d.drift + d.phase) * 9;
          ty = d.hy * h + Math.cos(time * d.drift * 0.8 + d.phase) * 9;
          pull = 0.045;
        }

        d.x += (tx - d.x) * pull;
        d.y += (ty - d.y) * pull;

        const inLetter = d.target >= 0;
        ctx!.beginPath();
        // Constant radius inside the letter: the logo's stroke is a single
        // uniform width, so varying dot sizes would render a different W.
        ctx!.arc(d.x, d.y, inLetter ? LETTER_DOT_R : d.r, 0, Math.PI * 2);
        ctx!.fillStyle = inLetter ? "rgba(109, 40, 217, 0.92)" : "rgba(109, 40, 217, 0.26)";
        ctx!.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    function onPointer(e: PointerEvent) {
      const rect = host!.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
      assign();
    }
    function onLeave() { pointer.active = false; assign(); }

    seed();
    resize();
    start();

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    // Stop the loop entirely when the banner is off screen.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    io.observe(host);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={hostRef} className="relative isolate overflow-hidden">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
      />
      {children}
    </div>
  );
}
