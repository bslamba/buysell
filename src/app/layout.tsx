import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { brand } from "@/config/brand";
import { currentUser, atLeast } from "@/lib/auth/guards";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

/**
 * Inter, self-hosted from @fontsource-variable.
 *
 * Deliberately NOT `next/font/google`: that fetches the font from Google at
 * BUILD time, so every deploy depends on a third party being reachable, and
 * every page load leaks a request to Google. Shipping the woff2 in the bundle
 * removes both. (This was not theoretical - the first build failed exactly
 * this way.)
 *
 * Inter is the face because it is the closest freely-licensable match to
 * Apple's SF Pro, which is what an Apple-glass surface needs. The reference
 * site is fully client-rendered, so its own typeface could not be read from
 * markup. Change this one import to change the face everywhere.
 */

export const metadata: Metadata = {
  metadataBase: new URL(`https://${brand.domain}`),
  title: { default: `${brand.name} — ${brand.tagline}`, template: `%s · ${brand.name}` },
  description: brand.description,
  icons: { icon: "/logo-mark.svg", apple: "/logo-mark.svg" },
  openGraph: {
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.shortPitch,
    type: "website",
    locale: "en_IN",
  },
};

export const viewport: Viewport = {
  themeColor: "#05030A",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const navUser = user
    ? { label: user.name?.split(" ")[0] ?? user.phone?.slice(-10) ?? "Account", isAdmin: atLeast(user.role, "moderator") }
    : null;

  return (
    <html lang="en-IN">
      <body className="min-h-dvh antialiased">
        <SiteNav user={navUser} />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
