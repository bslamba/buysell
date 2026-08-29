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
 *   including over the feature band and the shelves. It sits at z-1: above the
 *   opaque section grounds, below the z-50 nav.
 * • The letter is ALWAYS complete. Recruitment takes the nearest W_POINTS dots
 *   full stop, with no distance filter. An earlier version dropped dots beyond
 *   a radius, which meant that near a screen edge — or anywhere the field ran
 *   thin — the tail of the polyline never got a dot and the W rendered
 *   half-drawn. Every target index now gets filled, every time.
 * • Density is derived from viewport area rather than fixed, so a 27" monitor
 *   is not sparser than a laptop. Dots are drawn from one seeded pool, so the
 *   field is identical on every load — partly aesthetic, partly the hydration
 *   rule we have already been bitten by twice.
 * • The W is *suggested*, not traced. Sampling along the stroke is unevenly
 *   spaced, every dot carries a fixed offset drawn from a soft distribution,
 *   and each has its own pull rate, so the letter assembles raggedly.
 * • Four fill calls per frame, not two thousand: idle dots are batched into a
 *   far and a near path, and the letter into a halo and a core path. The idle
 *   field is drawn as rects rather than arcs — at a sub-pixel radius the two
 *   are indistinguishable, and `arc` tessellates where `rect` does not, which
 *   is the difference between 36fps and 60 at this density. The letter keeps
 *   arcs: those dots are large enough for the shape to read.
 * • rAF stops when the page is scrolled away from or the tab is hidden, and
 *   never starts under prefers-reduced-motion; a decorative loop should not
 *   spin a laptop fan or fight someone's vestibular system.
 */

const MAX_DOTS = 5000;      // seeded pool; the active slice is chosen by area
const PX_PER_DOT = 520;     // ~2500 dots at 1440x900 — a dense, fine grain
const MIN_DOTS = 1400;
const W_POINTS = 190;       // dots recruited into the letter
const W_SIZE = 76;          // px across (210 → 105 → 76)
const LETTER_DOT_R = 1.0;   // base radius inside the letter, jittered per dot
const SCATTER = 0.07;       // per-dot offset from the stroke, in W widths
const GLOW = 300;           // px, the radius the cursor visibly brightens

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
    const slot = (i + (rand() - 0.5) * 1.7) / (count - 1);
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
  return rand() + rand() - 1;
}

interface Dot {
  hx: number; hy: number;   // home, stored 0..1
  x: number; y: number;     // current
  r: number;                // idle radius
  lr: number;               // radius inside the letter
  jx: number; jy: number;   // its own offset from the stroke, in W widths
  stray: boolean;           // sits well off the stroke — drawn as faint halo
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
    const pool: Dot[] = Array.from({ length: MAX_DOTS }, () => {
      const jx = softOffset(rand) * SCATTER;
      const jy = softOffset(rand) * SCATTER;
      return {
        hx: rand(), hy: rand(),
        x: 0, y: 0,
        r: 0.32 + rand() * 0.72,
        lr: LETTER_DOT_R * (0.6 + rand() * 0.9),
        jx, jy,
        stray: Math.hypot(jx, jy) > SCATTER * 0.62,
        pull: 0.075 + rand() * 0.12,
        phase: rand() * Math.PI * 2,
        drift: 0.35 + rand() * 0.9,
        target: -1,
      };
    });

    let dots: Dot[] = [];
    // Reused across calls: allocating a few thousand objects per pointer move
    // is a garbage-collection pause you can feel.
    const cd2 = new Float64Array(MAX_DOTS);
    const cix = new Int32Array(MAX_DOTS);
    const near: Dot[] = [];
    const halo: Dot[] = [];
    let w = 0, h = 0, dpr = 1;
    let pointer = { x: -9999, y: -9999, active: false };
    let dirty = true;   // recruitment is recomputed once per frame, not per event
    let raf = 0;
    let running = false;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Density follows area, so the grain looks the same on a laptop and a
      // 27" display. The pool is fixed and seeded; only the slice changes.
      const want = Math.round((w * h) / PX_PER_DOT);
      const n = Math.max(MIN_DOTS, Math.min(MAX_DOTS, want));
      dots = pool.slice(0, n);
      for (const d of dots) { d.x = d.hx * w; d.y = d.hy * h; d.target = -1; }
      dirty = true;
    }

    function assign() {
      for (const d of dots) d.target = -1;
      if (!pointer.active) return;

      // Nearest W_POINTS, unconditionally — every target index gets a dot, so
      // the letter is never half-drawn. A radius filter is what used to crop
      // it near a screen edge; here the radius only bounds how much we sort.
      // Start local, widen until enough dots qualify, then sort that short
      // list rather than the whole field.
      let r = GLOW;
      let n = 0;
      for (let pass = 0; pass < 6; pass++) {
        const r2 = r * r;
        n = 0;
        for (let i = 0; i < dots.length; i++) {
          const dx = dots[i].hx * w - pointer.x;
          const dy = dots[i].hy * h - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2) { cd2[n] = d2; cix[n] = i; n++; }
        }
        if (n >= W_POINTS || r > 4 * (w + h)) break;
        r *= 1.7;
      }
      if (n === 0) return;

      // Insertion-rank the first W_POINTS by distance. n is a few hundred, so
      // a plain sort of the shortlist is cheaper than sorting the field.
      const order = Array.from({ length: n }, (_, k) => k);
      order.sort((a, b) => cd2[a] - cd2[b]);
      const take = Math.min(n, W_POINTS);
      for (let k = 0; k < take; k++) dots[cix[order[k]]].target = k;
    }

    function frame(t: number) {
      if (dirty) { assign(); dirty = false; }
      ctx!.clearRect(0, 0, w, h);
      const time = t * 0.001;
      const glow2 = GLOW * GLOW;

      // Idle dots, in two batches: the ones inside the cursor's reach are
      // brighter, so the pointer carries a visible field of influence rather
      // than only the letter itself.
      near.length = 0;
      ctx!.fillStyle = "rgba(109, 40, 217, 0.16)";
      ctx!.beginPath();
      for (const d of dots) {
        if (d.target >= 0) continue;
        const tx = d.hx * w + Math.sin(time * d.drift + d.phase) * 9;
        const ty = d.hy * h + Math.cos(time * d.drift * 0.8 + d.phase) * 9;
        d.x += (tx - d.x) * 0.045;
        d.y += (ty - d.y) * 0.045;
        if (pointer.active) {
          const dx = d.x - pointer.x, dy = d.y - pointer.y;
          if (dx * dx + dy * dy < glow2) { near.push(d); continue; }
        }
        ctx!.rect(d.x - d.r, d.y - d.r, d.r * 2, d.r * 2);
      }
      ctx!.fill();

      ctx!.fillStyle = "rgba(109, 40, 217, 0.42)";
      ctx!.beginPath();
      for (const d of near) {
        ctx!.rect(d.x - d.r, d.y - d.r, d.r * 2, d.r * 2);
      }
      ctx!.fill();

      // The letter, in two batches. Dots whose offset puts them well off the
      // stroke are drawn faint, so the W has a core and a spray around it
      // instead of one uniform outline.
      halo.length = 0;
      ctx!.fillStyle = "rgba(109, 40, 217, 0.9)";
      ctx!.beginPath();
      for (const d of dots) {
        if (d.target < 0) continue;
        const p = targets[d.target];
        const tx = pointer.x + (p.x + d.jx) * W_SIZE;
        const ty = pointer.y + (p.y + d.jy) * W_SIZE;
        d.x += (tx - d.x) * d.pull;
        d.y += (ty - d.y) * d.pull;
        if (d.stray) { halo.push(d); continue; }
        ctx!.moveTo(d.x + d.lr, d.y);
        ctx!.arc(d.x, d.y, d.lr, 0, Math.PI * 2);
      }
      ctx!.fill();

      ctx!.fillStyle = "rgba(109, 40, 217, 0.45)";
      ctx!.beginPath();
      for (const d of halo) {
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
      dirty = true;
    }
    function onLeave() { pointer.active = false; dirty = true; }
    function onVisibility() { document.hidden ? stop() : start(); }

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
