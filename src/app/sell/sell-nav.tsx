"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/sell", label: "Overview" },
  { href: "/sell/how-it-works", label: "How it works" },
  { href: "/sell/fees", label: "Fees" },
  { href: "/sell/business", label: "Business" },
];

export function SellNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Selling" className="scrollbar-none flex min-w-0 flex-1 justify-end gap-1 overflow-x-auto sm:justify-center">
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link key={l.href} href={l.href}
            className={`whitespace-nowrap px-3 py-2 text-[12px] leading-none tracking-[-0.01em] transition-opacity ${
              active ? "text-ink opacity-100" : "text-ink opacity-[0.82] hover:opacity-100"
            }`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
