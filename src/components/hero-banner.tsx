"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The interactive field.
 *
 * A canvas is pinned to the viewport behind the page. Dots drift across the
 * whole screen, and wherever the pointer goes the nearest ones peel away and
 * gather into a loose W around it, then wander home when it moves on.
 *
 * Implementation notes that matter:
 *
 * • The canvas is `fixed`, not `absolute`, so the effect covers the entire
 *   page rather than one band — the cursor gets a reaction anywhere on screen,
 *   including over the dark section and the shelves.
 * • It sits at z-1: above the opaque section backgrounds (otherwise the bands
 *   would hide it) and below the z-50 nav (which stays legible).
 * • Canvas, not DOM. A thousand animated elements would thrash layout; one
 *   canvas costs a single composite per frame, and the ~900 idle dots are
 *   batched into a single path so a frame is two fill calls, not a thousand.
 * • Dots are seeded from a small deterministic PRNG rather than Math.random,
 *   so the field is identical on every load. That is partly aesthetic and
 *   partly the hydration rule we have already been bitten by twice.
 * • The W is *suggested*, not traced. Every dot carries its own fixed offset
 *   from the stroke, so the letter reads as a swarm settling into a shape
 *   rather than a font rendered in circles.
 * • rAF stops entirely when the page scrolls out of view or the tab is hidden,
 *   and never starts under prefers-reduced-motion; a decorative loop should
 *   not spin a laptop fan or fight someone's vestibular system.
 */

const DOT_COUNT = 1500;     // ~1 dot per 860px² on a laptop screen
const W_POINTS = 130;       // dots recruited into the letter
const W_SIZE = 105;         // px across — half the previous 210
const LETTER_DOT_R = 1.55;  // base radius inside the letter, jittered per dot
const SCATTER = 0.055;      // per-dot offset from the stroke, in W widths
const INFLUENCE = 250;      // px, how far the pointer reaches

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
 *
 * The sampling along it is deliberately uneven: each sample is nudged along the
 * polyline before it is taken, so the dots do not sit at metronomic intervals.
 */
function wTargets(count: number, rand: () => number): { x: number; y: number }[] {
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
    const slot = (i + (rand() - 0.5) * 1.6) / (count - 1);
    let d = Math.min(Math.max(slot, 0), 1) * total;
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

/** Two uniforms summed give a soft peak at zero: most dots hug the stroke,
 *  a few stray well off it. A flat random would read as a fuzzy band. */
function softOffset(rand: () => number) {
  return (rand() + rand() - 1);
}

interface Dot {
  hx: number; hy: number;   // home, stored 0..1
  x: number; y: number;     // current
  r: number;                // idle radius
  lr: number;               // radius inside the letter
  jx: number; jy: number;   // its own offset from the stroke, in W widths
  pull: number;             // how eagerly it joins — varies, so arrival is ragged
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

    const rand = prng(20260829);
    const targets = wTargets(W_POINTS, rand);
    let dots: Dot[] = [];
    let w = 0, h = 0, dpr = 1;
    let pointer = { x: -9999, y: -9999, active: false };
    let raf = 0;
    let running = false;

    function seed() {
      dots = Array.from({ length: DOT_COUNT }, () => ({
        hx: rand(), hy: rand(),
        x: 0, y: 0,
        r: 0.5 + rand() * 1.1,
        lr: LETTER_DOT_R * (0.62 + rand() * 0.85),
        jx: softOffset(rand) * SCATTER,
        jy: softOffset(rand) * SCATTER,
        pull: 0.085 + rand() * 0.11,
        phase: rand() * Math.PI * 2,
        drift: 0.35 + rand() * 0.9,
        target: -1,
      }));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
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
      const near: { i: number; dist: number }[] = [];
      for (let i = 0; i < dots.length; i++) {
        const dist = Math.hypot(dots[i].hx * w - pointer.x, dots[i].hy * h - pointer.y);
        if (dist < INFLUENCE) near.push({ i, dist });
      }
      near.sort((a, b) => a.dist - b.dist);
      const take = Math.min(near.length, W_POINTS);
      for (let k = 0; k < take; k++) dots[near[k].i].target = k;
    }

    function frame(t: number) {
      ctx!.clearRect(0, 0, w, h);
      const time = t * 0.001;

      // Idle dots first, batched into one path — same colour, one fill.
      ctx!.fillStyle = "rgba(109, 40, 217, 0.20)";
      ctx!.beginPath();
      for (const d of dots) {
        if (d.target >= 0) continue;
        const tx = d.hx * w + Math.sin(time * d.drift + d.phase) * 9;
        const ty = d.hy * h + Math.cos(time * d.drift * 0.8 + d.phase) * 9;
        d.x += (tx - d.x) * 0.045;
        d.y += (ty - d.y) * 0.045;
        ctx!.moveTo(d.x + d.r, d.y);
        ctx!.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      }
      ctx!.fill();

      // Then the letter. Each dot aims at its own point plus its own permanent
      // offset, so the W is a swarm holding a shape, not a traced outline.
      ctx!.fillStyle = "rgba(109, 40, 217, 0.85)";
      ctx!.beginPath();
      for (const d of dots) {
        if (d.target < 0) continue;
        const p = targets[d.target];
        const tx = pointer.x + (p.x + d.jx) * W_SIZE;
        const ty = pointer.y + (p.y + d.jy) * W_SIZE;
        d.x += (tx - d.x) * d.pull;
        d.y += (ty - d.y) * d.pull;
        ctx!.moveTo(d.x + d.lr, d.y);
        ctx!.arc(d.x, d.y, d.lr, 0, Math.PI * 2);
      }
      ctx!.fill();

      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    function onPointer(e: PointerEvent) {
      // The canvas is fixed to the viewport, so client coordinates are already
      // canvas coordinates — no rect offset, and no recalculation on scroll.
      pointer = { x: e.clientX, y: e.clientY, active: true };
      assign();
    }
    function onLeave() { pointer.active = false; assign(); }
    function onVisibility() { document.hidden ? stop() : start(); }

    seed();
    resize();
    start();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    // Stop the loop entirely when the page is scrolled away from.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    io.observe(host);

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={hostRef}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] h-full w-full"
      />
      {children}
    </div>
  );
}
