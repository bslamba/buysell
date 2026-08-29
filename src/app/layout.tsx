import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { brand } from "@/config/brand";
import { currentUser } from "@/lib/auth/guards";
import { atLeast } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: { default: `${brand.name} — ${brand.tagline}`, template: `%s · ${brand.name}` },
  description: brand.description,
};

async function Header() {
  const user = await currentUser();
  return (
    <header className="border-b border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-xl font-extrabold tracking-tight text-brand-600">{brand.name}</span>
          <span className="hidden text-xs text-ink-500 sm:inline">{brand.tagline}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/browse" className="rounded-lg px-3 py-2 font-medium hover:bg-ink-100 dark:hover:bg-ink-700">Browse</Link>
          <Link href="/auctions" className="rounded-lg px-3 py-2 font-medium hover:bg-ink-100 dark:hover:bg-ink-700">Auctions</Link>
          {user ? (
            <>
              <Link href="/sell" className="rounded-lg px-3 py-2 font-medium hover:bg-ink-100 dark:hover:bg-ink-700">Sell</Link>
              {atLeast(user.role, "moderator") && (
                <Link href="/admin" className="rounded-lg px-3 py-2 font-semibold text-brand-600 hover:bg-brand-50">Admin</Link>
              )}
              <Link href="/account" className="ml-1 rounded-lg border border-ink-200 px-3 py-2 font-medium dark:border-ink-700">
                {user.name ?? user.phone ?? "Account"}
              </Link>
            </>
          ) : (
            <Link href="/signin" className="ml-1 rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="min-h-dvh">
        <Header />
        <main>{children}</main>
        <footer className="mt-24 border-t border-ink-200 py-10 dark:border-ink-700">
          <div className="mx-auto max-w-6xl px-5 text-xs text-ink-500">
            <p>{brand.name} is operated by {brand.legalName}.</p>
            <p className="mt-1">Every listing is machine-checked before it goes live.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
