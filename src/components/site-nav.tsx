"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatedWordmark } from "./animated-wordmark";
import { SearchIcon } from "./icons";

export interface NavUser {
  label: string;
  isAdmin: boolean;
}

/**
 * The global bar.
 *
 * The trick that makes Apple's nav read as centred is not `justify-center` — it
 * is a NARROW container (980px) using `space-between`. On any normal display
 * that container is much narrower than the viewport, so the whole cluster
 * floats in the middle with even gaps, while the first and last items still
 * anchor to the container's edges. Widening the rail or splitting it into
 * left/centre/right groups breaks the effect immediately, which is what the
 * first version did.
 *
 * Height is 40px with 12px labels and a 16px mark. Apple's is 44px; ours reads
 * slimmer because the mark is smaller relative to the bar.
 */

const LINKS = [
  { href: "/browse", label: "Store" },
  { href: "/browse/phones", label: "Phones" },
  { href: "/browse/laptops", label: "Laptops" },
  { href: "/browse/electronics", label: "Electronics" },
  { href: "/browse/home-furniture", label: "Home" },
  { href: "/browse/fashion", label: "Fashion" },
  { href: "/auctions", label: "Auctions" },
  { href: "/help", label: "Support" },
];

export function SiteNav({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMenu(false); setSearch(false); }, [pathname]);
  useEffect(() => { if (search) searchRef.current?.focus(); }, [search]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setSearch(false); setMenu(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const v = q.trim();
    if (v) router.push(`/browse?q=${encodeURIComponent(v)}`);
  }

  const linkClass = (active: boolean) =>
    `px-[6px] py-1.5 text-[10px] leading-none tracking-[-0.005em] whitespace-nowrap transition-opacity ${
      active ? "opacity-100" : "opacity-[0.84] hover:opacity-100"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.05] bg-canvas/80 backdrop-blur-2xl backdrop-saturate-[1.8]">
      <nav aria-label="Global" className="mx-auto flex h-8 max-w-[940px] items-center justify-between gap-0 px-5">
        <Link href="/" aria-label="WorthIt home"
          className="shrink-0 font-semibold tracking-[-0.035em] opacity-90 transition-opacity hover:opacity-100">
          <AnimatedWordmark size="nav" withMark intensity="big" className="text-[11px]" />
        </Link>

        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={`hidden lg:block ${linkClass(pathname === l.href)}`}>
            {l.label}
          </Link>
        ))}

        {/* Sell is the one thing we want people to do, so it gets the only
            filled control in the bar. */}
        <Link href="/sell"
          className="hidden shrink-0 rounded-full bg-brand px-2.5 py-[4px] text-[10px] font-medium leading-none text-white transition-colors hover:bg-brand-600 lg:block">
          Sell
        </Link>

        <button type="button" onClick={() => setSearch((v) => !v)}
          aria-label="Search" aria-expanded={search}
          className="shrink-0 px-[6px] py-1.5 opacity-[0.84] transition-opacity hover:opacity-100">
          <SearchIcon size={12} />
        </button>

        <Link href={user ? "/account" : "/signin"} className={`hidden shrink-0 lg:block ${linkClass(false)}`}>
          {user ? user.label : "Sign in"}
        </Link>

        {user?.isAdmin && (
          <Link href="/admin" className="hidden shrink-0 px-[6px] py-1.5 text-[10px] leading-none text-brand lg:block">
            Admin
          </Link>
        )}

        <button type="button" onClick={() => setMenu((v) => !v)}
          aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu}
          className="shrink-0 px-[6px] py-1.5 opacity-[0.84] lg:hidden">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            {menu
              ? <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              : <path d="M1.5 5h13M1.5 11h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />}
          </svg>
        </button>
      </nav>

      {search && (
        <div className="border-t border-black/[0.05] bg-canvas/95 backdrop-blur-2xl">
          <form onSubmit={submitSearch} role="search" className="mx-auto max-w-[940px] px-5 py-5">
            <div className="flex items-center gap-3">
              <SearchIcon size={18} className="shrink-0 text-ink-3" />
              <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)}
                type="search" name="q" autoComplete="off" aria-label="Search listings"
                placeholder="Search for anything"
                className="w-full bg-transparent t-subhead text-ink outline-none placeholder:text-ink-3" />
              <button type="button" onClick={() => setSearch(false)}
                className="t-small shrink-0 text-ink-2 hover:text-ink">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {menu && (
        <div className="border-t border-black/[0.05] bg-canvas lg:hidden">
          <ul className="mx-auto max-w-[940px] px-5 py-4">
            {LINKS.map((l) => (
              <li key={l.href} className="border-b border-hairline/60">
                <Link href={l.href} className="block py-3.5 t-subhead">{l.label}</Link>
              </li>
            ))}
            <li className="mt-4 flex gap-3">
              <Link href={user ? "/account" : "/signin"} className="a-btn a-btn-ghost a-btn-sm flex-1">
                {user ? user.label : "Sign in"}
              </Link>
              <Link href="/sell" className="a-btn a-btn-fill a-btn-sm flex-1">Sell an item</Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
