"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/sell", label: "Overview" },
  { href: "/sell/how-it-works", label: "How it works" },
  { href: "/sell/fees", label: "Fees" },
  { href: "/sell/business", label: "Business selling" },
];

export function SellNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Selling" className="scrollbar-none flex min-w-0 flex-1 justify-center gap-1 overflow-x-auto">
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link key={l.href} href={l.href}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active ? "bg-white/[0.09] text-text" : "text-text-muted hover:bg-white/[0.05] hover:text-text"
            }`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
