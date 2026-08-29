"use client";

import Link from "next/link";
import { useRef, useState, useEffect, type ReactNode } from "react";

/**
 * The horizontal shelf from the Apple Store grid.
 *
 * Tiles run left to right, scroll-snap so they land squarely, and the arrows
 * page by roughly one tile. The arrows disable at each end rather than
 * disappearing, so the control never shifts the layout — and they hide entirely
 * on touch, where the gesture is the affordance.
 */
export function Shelf({ title, subtitle, seeAll, children }: {
  title: string; subtitle?: string; seeAll?: { href: string; label: string }; children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  function measure() {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function page(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 640), behavior: "smooth" });
  }

  return (
    <section className="py-14">
      <div className="container-a flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="t-title text-balance">{title}</h2>
          {subtitle ? <p className="t-body mt-2 text-ink-2">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-4">
          {seeAll ? <Link href={seeAll.href} className="a-link">{seeAll.label}</Link> : null}
          <div className="hidden items-center gap-2 md:flex">
            {([-1, 1] as const).map((d) => (
              <button key={d} type="button" onClick={() => page(d)}
                disabled={d === -1 ? atStart : atEnd}
                aria-label={d === -1 ? "Previous" : "Next"}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-2 transition-opacity hover:text-ink disabled:opacity-30">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d={d === -1 ? "M9 2L4 7l5 5" : "M5 2l5 5-5 5"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={ref} onScroll={measure}
        className="shelf mt-8 pl-[max(24px,calc((100vw-1240px)/2))] pr-6">
        {children}
      </div>
    </section>
  );
}
