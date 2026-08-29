import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { CATEGORIES, type CategoryRule } from "@/config/categories";

/**
 * SEO helpers.
 *
 * Two things drive organic traffic for a marketplace, and neither is keyword
 * density:
 *
 *   1. A page that deserves to rank for a specific query. That means one
 *      category-intent page per category, with real copy, real subcategory
 *      terms, and real listings on it.
 *   2. Structured data, so Google can render the result as something richer
 *      than a blue link — breadcrumbs, product cards, a sitelinks searchbox.
 *
 * Everything here exists to serve those two. Keyword meta tags are included
 * because Bing still reads them; Google has ignored them since 2009, so they
 * are a footnote, not a strategy.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? `https://${brand.domain}`;

export function canonical(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

interface PageSeo {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  /** Set false for pages that should never be indexed (account, admin, auth). */
  index?: boolean;
  type?: "website" | "article";
}

export function buildMetadata({
  title, description, path, keywords, index = true, type = "website",
}: PageSeo): Metadata {
  const url = canonical(path);
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: index
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } }
      : { index: false, follow: false },
    openGraph: {
      title: `${title} · ${brand.name}`,
      description,
      url,
      siteName: brand.name,
      locale: "en_IN",
      type,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${brand.name}`,
      description,
    },
  };
}

export function categoryMetadata(c: CategoryRule): Metadata {
  return buildMetadata({
    title: c.seo.title,
    description: c.seo.description,
    path: `/browse/${c.slug}`,
    keywords: c.seo.keywords,
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * JSON-LD
 * ──────────────────────────────────────────────────────────────────────────*/

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${SITE_URL}/#organization`,
    name: brand.name,
    legalName: brand.legalName,
    url: SITE_URL,
    logo: `${SITE_URL}/logo-mark.svg`,
    description: brand.description,
    slogan: brand.tagline,
    email: brand.supportEmail,
    areaServed: { "@type": "Country", name: "India" },
    address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressRegion: "Karnataka", addressCountry: "IN" },
    sameAs: Object.values(brand.socials),
  };
}

/** Enables the sitelinks searchbox in Google results. */
export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: brand.name,
    description: brand.shortPitch,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/browse?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: canonical(t.path),
    })),
  };
}

export function categoryCollectionLd(c: CategoryRule, items: { title: string; path: string; pricePaise: number }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: c.seo.title,
    description: c.seo.description,
    url: canonical(`/browse/${c.slug}`),
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: c.subcategories.map((s) => ({ "@type": "Thing", name: s })),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: canonical(it.path),
        name: it.title,
      })),
    },
  };
}

export function productLd(p: {
  title: string; description: string; path: string; pricePaise: number;
  condition: string; brandName?: string; image?: string; available: boolean;
}) {
  const CONDITION: Record<string, string> = {
    new: "https://schema.org/NewCondition",
    like_new: "https://schema.org/UsedCondition",
    good: "https://schema.org/UsedCondition",
    fair: "https://schema.org/UsedCondition",
    for_parts: "https://schema.org/DamagedCondition",
  };
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.description.slice(0, 300),
    url: canonical(p.path),
    ...(p.image ? { image: [p.image] } : {}),
    ...(p.brandName ? { brand: { "@type": "Brand", name: p.brandName } } : {}),
    itemCondition: CONDITION[p.condition] ?? "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      price: (p.pricePaise / 100).toFixed(2),
      priceCurrency: "INR",
      availability: p.available ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      url: canonical(p.path),
      seller: { "@id": `${SITE_URL}/#organization` },
    },
  };
}

export function faqLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Every keyword across the taxonomy — used by the sitemap and internal linking. */
export const ALL_CATEGORY_KEYWORDS = Array.from(
  new Set(CATEGORIES.flatMap((c) => c.seo.keywords)),
).sort();
