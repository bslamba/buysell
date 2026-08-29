import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { brand } from "@/config/brand";
import { currentUser, atLeast } from "@/lib/auth/guards";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
import { organizationLd, websiteLd, SITE_URL } from "@/lib/seo";

/**
 * Inter, self-hosted from @fontsource-variable.
 *
 * Deliberately NOT `next/font/google`: that fetches the font from Google at
 * BUILD time, so every deploy depends on a third party being reachable, and
 * every page load leaks a request to Google. Shipping the woff2 in the bundle
 * removes both. (Not theoretical — the first clean build failed exactly this
 * way.) Inter is the face because it is the closest freely-licensable match to
 * Apple's SF Pro. Change this one import to change it everywhere.
 */

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${brand.name} — Buy & Sell Verified Used Products in India`,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  authors: [{ name: brand.legalName }],
  creator: brand.legalName,
  publisher: brand.legalName,
  category: "shopping",
  keywords: [
    "buy and sell used items india", "second hand marketplace india",
    "verified used products", "refurbished electronics india",
    "sell online india", "olx alternative", "used phones laptops furniture",
    "second hand bangalore", "recommerce india", "pre-owned marketplace",
  ],
  icons: {
    icon: [{ url: "/logo-mark.svg", type: "image/svg+xml" }],
    apple: "/logo-mark.svg",
  },
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.shortPitch,
    url: SITE_URL,
    siteName: brand.name,
    type: "website",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: `${brand.name} — ${brand.tagline}`, description: brand.shortPitch },
  formatDetection: { telephone: false },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: "#05030A",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const navUser = user
    ? { label: user.name?.split(" ")[0] ?? user.phone?.slice(-10) ?? "Account", isAdmin: atLeast(user.role, "moderator") }
    : null;

  return (
    <html lang="en-IN">
      <head>
        <JsonLd data={[organizationLd(), websiteLd()]} />
      </head>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-violet-600 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white">
          Skip to content
        </a>
        <SiteNav user={navUser} />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
