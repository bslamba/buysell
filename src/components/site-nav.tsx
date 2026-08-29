"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";
import { SearchIcon } from "./icons";

export interface NavUser {
  label: string;
  isAdmin: boolean;
}

/**
 * The global bar, built to Apple's proportions: 44px tall, translucent with a
 * heavy backdrop blur, and links at 12px spread evenly across the width rather
 * than clustered left. At that size the bar reads as a thin rule of text over
 * the page rather than a piece of furniture sitting on top of it — which is the
 * whole point of the design.
 */

const LINKS = [
  { href: "/browse", label: "Store" },
  { href: "/browse/phones", label: "Phones" },
  { href: "/browse/laptops", label: "Laptops" },
  { href: "/browse/electronics", label: "Electronics" },
  { href: "/browse/home-furniture", label: "Home" },
  { href: "/browse/fashion", label: "Fashion" },
  { href: "/auctions", label: "Auctions" },
  { href: "/sell", label: "Sell" },
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

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-canvas/80 backdrop-blur-2xl backdrop-saturate-[1.8]">
      <nav aria-label="Global" className="mx-auto flex h-11 max-w-[1024px] items-center justify-between px-6">
        <Link href="/" aria-label="WorthIt home" className="shrink-0 opacity-90 transition-opacity hover:opacity-100">
          <Logo size={19} textClass="text-[14px]" />
        </Link>

        <ul className="hidden items-center lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href}
                className={`px-[11px] py-2 text-[12px] leading-none tracking-[-0.01em] transition-opacity ${
                  pathname === l.href ? "text-ink opacity-100" : "text-ink opacity-[0.82] hover:opacity-100"
                }`}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => setSearch((v) => !v)}
            aria-label="Search" aria-expanded={search}
            className="p-2 text-ink opacity-[0.82] transition-opacity hover:opacity-100">
            <SearchIcon size={15} />
          </button>
          <Link href={user ? "/account" : "/signin"}
            className="hidden px-[11px] py-2 text-[12px] leading-none tracking-[-0.01em] text-ink opacity-[0.82] transition-opacity hover:opacity-100 lg:block">
            {user ? user.label : "Sign in"}
          </Link>
          {user?.isAdmin && (
            <Link href="/admin" className="hidden px-[11px] py-2 text-[12px] leading-none text-brand lg:block">Admin</Link>
          )}
          <button type="button" onClick={() => setMenu((v) => !v)}
            aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu}
            className="p-2 text-ink opacity-[0.82] lg:hidden">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              {menu
                ? <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                : <path d="M1.5 5h13M1.5 11h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </nav>

      {/* Search drawer — Apple drops this in under the bar rather than navigating away */}
      {search && (
        <div className="border-t border-black/[0.06] bg-canvas/95 backdrop-blur-2xl">
          <form onSubmit={submitSearch} role="search" className="mx-auto max-w-[1024px] px-6 py-5">
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

      {/* Mobile menu */}
      {menu && (
        <div className="border-t border-black/[0.06] bg-canvas lg:hidden">
          <ul className="mx-auto max-w-[1024px] px-6 py-4">
            {LINKS.map((l) => (
              <li key={l.href} className="border-b border-hairline/60 last:border-0">
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
