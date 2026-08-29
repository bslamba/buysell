import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing here is secret — these are blocked because they are either
        // private, infinite, or have no business in an index.
        disallow: [
          "/admin", "/admin/", "/api/", "/account", "/signin",
          "/verify-phone", "/corporate/", "/403",
          "/browse?*", // faceted URLs; the clean /browse/<category> pages rank instead
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
