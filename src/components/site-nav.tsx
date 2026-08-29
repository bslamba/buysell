"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Logo } from "./logo";
import { CategoryIcon, SearchIcon } from "./icons";
import { RAIL_CATEGORIES } from "@/config/categories";

export interface NavUser {
  label: string;
  isAdmin: boolean;
}

const PRIMARY = [
  { href: "/categories", label: "Categories" },
  { href: "/auctions", label: "Auctions" },
  { href: "/team", label: "Team" },
  { href: "/socials", label: "Socials" },
  { href: "/help", label: "Help Centre" },
];

function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  return (
    <form
      role="search"
      onSubmit={(e) => { e.preventDefault(); router.push(`/browse?q=${encodeURIComponent(q.trim())}`); }}
      className={`glass-input flex items-center gap-2.5 rounded-full ${compact ? "px-4 py-2.5" : "px-5 py-3"} w-full`}
    >
      <SearchIcon className="shrink-0 text-text-faint" />
      <input
        value={q} onChange={(e) => setQ(e.target.value)}
        name="q" type="search" autoComplete="off"
        aria-label="Search listings"
        placeholder="What are you looking for?"
        className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-faint"
      />
      {q && (
        <button type="submit" className="shrink-0 rounded-full bg-violet-400/20 px-3 py-1 text-xs font-semibold text-violet-200">
          Search
        </button>
      )}
    </form>
  );
}

function CategoryRail() {
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get("category");
  const onBrowse = pathname === "/browse";

  return (
    <div className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="scrollbar-none flex gap-1 overflow-x-auto py-2.5">
          <Link
            href="/browse"
            className={`flex min-w-[74px] shrink-0 flex-col items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-medium transition-colors ${
              onBrowse && !active ? "bg-white/[0.09] text-text" : "text-text-muted hover:bg-white/[0.05] hover:text-text"
            }`}
          >
            <CategoryIcon name="grid" />
            All
          </Link>
          {RAIL_CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/browse?category=${c.slug}`}
              className={`flex min-w-[74px] shrink-0 flex-col items-center gap-1.5 rounded-xl px-3 py-2 text-center text-[11px] font-medium leading-tight transition-colors ${
                active === c.slug ? "bg-white/[0.09] text-text" : "text-text-muted hover:bg-white/[0.05] hover:text-text"
              }`}
            >
              <CategoryIcon name={c.icon} />
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SiteNav({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header className="glass-bar sticky top-0 z-50">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-4 px-6">
        <Link href="/" aria-label="WorthIt home" className="shrink-0"><Logo /></Link>

        <div className="hidden min-w-0 flex-1 lg:block">
          <Suspense fallback={<div className="h-11" />}><SearchBar /></Suspense>
        </div>

        <nav aria-label="Primary" className="hidden shrink-0 items-center gap-0.5 xl:flex">
          {PRIMARY.map((l) => (
            <Link key={l.href} href={l.href}
              className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith(l.href) ? "text-text" : "text-text-muted hover:text-text"
              }`}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex">
          {user ? (
            <>
              {user.isAdmin && (
                <Link href="/admin" className="rounded-full px-3 py-2 text-sm font-semibold text-violet-300 hover:bg-violet-400/10">
                  Admin
                </Link>
              )}
              <Link href="/account" className="glass glass-hover rounded-full px-4 py-2 text-sm font-medium">
                {user.label}
              </Link>
            </>
          ) : (
            <Link href="/signin" className="glass glass-hover rounded-full px-4 py-2 text-sm font-medium">
              Sign in
            </Link>
          )}
          <Link href="/sell"
            className="rounded-full bg-gradient-to-br from-violet-400 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_28px_-8px_rgba(124,58,237,0.85)] transition-all hover:brightness-110">
            Sell →
          </Link>
        </div>

        <button type="button" onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}
          className="glass ml-auto rounded-xl p-2.5 lg:hidden">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            {open
              ? <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              : <path d="M2.5 5h13M2.5 9h13M2.5 13h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
          </svg>
        </button>
      </div>

      <Suspense fallback={null}><CategoryRail /></Suspense>

      {open && (
        <div className="border-t border-white/[0.06] px-6 pb-6 pt-4 lg:hidden">
          <Suspense fallback={null}><SearchBar compact /></Suspense>
          <div className="mt-4 flex flex-col gap-1">
            {PRIMARY.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-xl px-3 py-3 text-sm font-medium text-text-muted hover:bg-white/[0.05] hover:text-text">
                {l.label}
              </Link>
            ))}
            <div className="rule-fade my-3" />
            {user ? (
              <>
                {user.isAdmin && <Link href="/admin" className="rounded-xl px-3 py-3 text-sm font-semibold text-violet-300">Admin</Link>}
                <Link href="/account" className="rounded-xl px-3 py-3 text-sm font-medium">{user.label}</Link>
              </>
            ) : (
              <Link href="/signin" className="rounded-xl px-3 py-3 text-sm font-medium">Sign in</Link>
            )}
            <Link href="/sell" className="mt-1 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 px-5 py-3 text-center text-sm font-semibold text-white">
              Sell an item
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
