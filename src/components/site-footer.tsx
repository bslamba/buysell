import Link from "next/link";
import { brand } from "@/config/brand";

/**
 * Apple's footer: 12px throughout, columns of plain links with no decoration,
 * a hairline, then the legal line. Deliberately quiet — it is a directory, not
 * a design opportunity.
 */
const COLUMNS = [
  {
    heading: "Shop",
    links: [
      { href: "/browse", label: "Store" },
      { href: "/browse/phones", label: "Phones" },
      { href: "/browse/laptops", label: "Laptops" },
      { href: "/browse/electronics", label: "Electronics" },
      { href: "/browse/home-furniture", label: "Home & Furniture" },
      { href: "/categories", label: "All categories" },
    ],
  },
  {
    heading: "Sell",
    links: [
      { href: "/sell", label: "Sell an item" },
      { href: "/sell/how-it-works", label: "How selling works" },
      { href: "/sell/fees", label: "Fees" },
      { href: "/sell/business", label: "Business selling" },
      { href: "/auctions", label: "Auctions" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/signin", label: "Sign in" },
      { href: "/wish", label: "Wishlist" },
      { href: "/corporate", label: "Company account" },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/help", label: "Help centre" },
      { href: "/shipping", label: "Shipping & returns" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    heading: "About",
    links: [
      { href: "/about", label: "About WorthIt" },
      { href: "/team", label: "Team & careers" },
      { href: "/socials", label: "Socials" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="band-grey">
      <div className="mx-auto max-w-[1024px] px-6 py-10">
        <p className="t-caption max-w-2xl text-ink-2">
          Every listing on {brand.name} is machine-checked before it goes live: photographs
          fingerprinted against every image ever uploaded, phone IMEIs matched against the
          Government of India&apos;s stolen-device register, and prices compared against real
          market data. Payment is held until you receive the item and confirm it matches.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-8 border-t border-hairline pt-8 sm:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="t-caption font-semibold text-ink">{col.heading}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="t-caption text-ink-2 hover:text-ink hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-caption text-ink-2">
            Copyright © {new Date().getFullYear()} {brand.legalName}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {[
              { href: "/privacy", label: "Privacy Policy" },
              { href: "/terms", label: "Terms of Use" },
              { href: "/shipping", label: "Shipping" },
              { href: "/contact", label: "Contact" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="t-caption text-ink-2 hover:text-ink hover:underline">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <p className="t-caption mt-4 text-ink-3">India</p>
      </div>
    </footer>
  );
}
