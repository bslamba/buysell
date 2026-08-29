import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/config/categories";
import { SITE_URL } from "@/lib/seo";

/**
 * Static routes plus one entry per category landing page.
 *
 * Listings are deliberately not enumerated here yet — a sitemap full of URLs
 * that 404 the moment an item sells is worse than a smaller honest one. When
 * listing pages exist, add a second sitemap that queries only `approved` rows.
 */
const STATIC: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, freq: "daily" },
  { path: "/browse", priority: 0.9, freq: "hourly" },
  { path: "/categories", priority: 0.9, freq: "weekly" },
  { path: "/sell", priority: 0.9, freq: "weekly" },
  { path: "/sell/how-it-works", priority: 0.7, freq: "monthly" },
  { path: "/sell/fees", priority: 0.7, freq: "monthly" },
  { path: "/sell/business", priority: 0.7, freq: "monthly" },
  { path: "/auctions", priority: 0.8, freq: "daily" },
  { path: "/wish", priority: 0.6, freq: "monthly" },
  { path: "/about", priority: 0.6, freq: "monthly" },
  { path: "/team", priority: 0.4, freq: "monthly" },
  { path: "/help", priority: 0.7, freq: "monthly" },
  { path: "/contact", priority: 0.5, freq: "monthly" },
  { path: "/shipping", priority: 0.5, freq: "monthly" },
  { path: "/socials", priority: 0.3, freq: "monthly" },
  { path: "/terms", priority: 0.3, freq: "yearly" },
  { path: "/privacy", priority: 0.3, freq: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    ...STATIC.map((s) => ({
      url: `${SITE_URL}${s.path}`,
      lastModified: now,
      changeFrequency: s.freq,
      priority: s.priority,
    })),
    ...CATEGORIES.map((c) => ({
      url: `${SITE_URL}/browse/${c.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
