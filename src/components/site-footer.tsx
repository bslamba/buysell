import Link from "next/link";
import { brand } from "@/config/brand";
import { Logo } from "./logo";

const COLUMNS = [
  {
    heading: "Marketplace",
    links: [
      { href: "/browse", label: "Browse listings" },
      { href: "/categories", label: "Categories" },
      { href: "/sell", label: "Sell an item" },
      { href: "/auctions", label: "Corporate auctions" },
      { href: "/wish", label: "Wishlist a find" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/team", label: "Team" },
      { href: "/corporate", label: "For businesses" },
      { href: "/socials", label: "Socials" },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/help", label: "Help centre" },
      { href: "/contact", label: "Contact" },
      { href: "/shipping", label: "Shipping & delivery" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/terms", label: "Terms of use" },
      { href: "/privacy", label: "Privacy policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.6fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-text-muted">{brand.shortPitch}</p>
            <div className="mt-6 flex gap-2">
              {Object.entries(brand.socials).map(([key, url]) => (
                <a key={key} href={url} target="_blank" rel="noreferrer noopener"
                  className="glass glass-hover rounded-full px-3.5 py-1.5 text-xs font-medium capitalize">
                  {key}
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-faint">{col.heading}</h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-text-muted transition-colors hover:text-text">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="rule-fade mt-14" />
        <div className="mt-8 flex flex-col gap-3 text-xs text-text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {brand.legalName}. All rights reserved.</p>
          <p>Every listing is machine-checked before it goes live.</p>
        </div>
      </div>
    </footer>
  );
}
