"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./logo";

export interface NavUser {
  label: string;
  isAdmin: boolean;
}

const LINKS = [
  { href: "/browse", label: "Browse" },
  { href: "/categories", label: "Categories" },
  { href: "/sell", label: "Sell" },
  { href: "/auctions", label: "Auctions" },
  { href: "/help", label: "Help" },
];

export function SiteNav({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header className="glass-bar sticky top-0 z-50">
      <nav className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" aria-label="WorthIt home"><Logo /></Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link key={l.href} href={l.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-white/[0.08] text-text" : "text-text-muted hover:bg-white/[0.05] hover:text-text"
                }`}>
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {user.isAdmin && (
                <Link href="/admin" className="rounded-full px-4 py-2 text-sm font-semibold text-violet-300 hover:bg-violet-400/10">
                  Admin
                </Link>
              )}
              <Link href="/account" className="glass glass-hover rounded-full px-4 py-2 text-sm font-medium">
                {user.label}
              </Link>
            </>
          ) : (
            <Link href="/signin"
              className="rounded-full bg-gradient-to-br from-violet-400 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_28px_-8px_rgba(124,58,237,0.85)] transition-all hover:brightness-110">
              Sign in
            </Link>
          )}
        </div>

        <button type="button" onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}
          className="glass rounded-xl p-2.5 md:hidden">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            {open ? (
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <path d="M2.5 5h13M2.5 9h13M2.5 13h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/[0.06] px-6 pb-6 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
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
              <Link href="/signin" className="rounded-full bg-gradient-to-br from-violet-400 to-violet-600 px-5 py-3 text-center text-sm font-semibold text-white">
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
