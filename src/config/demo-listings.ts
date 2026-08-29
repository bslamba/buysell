import type { IconName } from "./categories";

/**
 * Sample listings.
 *
 * These exist so the store renders as a real storefront before any seller has
 * listed anything — an empty grid tells you nothing about whether the layout
 * works. They are shown ONLY when the database returns zero rows, and every one
 * carries a visible "Sample" badge so nobody mistakes them for inventory.
 *
 * `showDemoListings()` is the single switch. When real listings exist they take
 * over automatically; setting NEXT_PUBLIC_HIDE_DEMO_LISTINGS=true turns these
 * off entirely, which is what production should do at launch.
 */

export interface DemoListing {
  id: string;
  publicId: string;
  title: string;
  pricePaise: number;
  wasPaise?: number;
  categorySlug: string;
  icon: IconName;
  condition: string;
  city: string;
  note: string;
}

const R = 100;

export const DEMO_LISTINGS: DemoListing[] = [
  { id: "d1", publicId: "SAMPLE-01", title: "MacBook Air M2, 16GB / 512GB", pricePaise: 74_500 * R, wasPaise: 1_14_900 * R, categorySlug: "laptops", icon: "laptop", condition: "like_new", city: "Bengaluru", note: "42 battery cycles · 100% health" },
  { id: "d2", publicId: "SAMPLE-02", title: "iPhone 14 Pro 256GB, Deep Purple", pricePaise: 52_000 * R, wasPaise: 1_29_900 * R, categorySlug: "phones", icon: "phone", condition: "good", city: "Bengaluru", note: "IMEI checked · 89% battery" },
  { id: "d3", publicId: "SAMPLE-03", title: "ThinkPad X1 Carbon Gen 10, i7", pricePaise: 46_000 * R, wasPaise: 1_58_000 * R, categorySlug: "laptops", icon: "laptop", condition: "good", city: "Bengaluru", note: "Ex-corporate · data wiped" },
  { id: "d4", publicId: "SAMPLE-04", title: "Herman Miller Aeron, Size B", pricePaise: 38_000 * R, wasPaise: 1_10_000 * R, categorySlug: "home-office", icon: "desk", condition: "good", city: "Bengaluru", note: "Fully adjustable · no tears" },
  { id: "d5", publicId: "SAMPLE-05", title: "Sony A7 III with 28-70mm kit lens", pricePaise: 82_000 * R, wasPaise: 1_64_990 * R, categorySlug: "electronics", icon: "chip", condition: "good", city: "Bengaluru", note: "18,400 shutter actuations" },
  { id: "d6", publicId: "SAMPLE-06", title: "Dell UltraSharp 27\" 4K Monitor", pricePaise: 21_500 * R, wasPaise: 58_000 * R, categorySlug: "home-office", icon: "desk", condition: "like_new", city: "Bengaluru", note: "Zero dead pixels · stand included" },
  { id: "d7", publicId: "SAMPLE-07", title: "Teak 6-Seater Dining Table", pricePaise: 24_000 * R, wasPaise: 72_000 * R, categorySlug: "home-furniture", icon: "sofa", condition: "good", city: "Bengaluru", note: "Solid wood · minor surface marks" },
  { id: "d8", publicId: "SAMPLE-08", title: "LG 260L Double Door Refrigerator", pricePaise: 14_500 * R, wasPaise: 34_990 * R, categorySlug: "appliances", icon: "washer", condition: "good", city: "Bengaluru", note: "3 years old · working perfectly" },
  { id: "d9", publicId: "SAMPLE-09", title: "PlayStation 5 Slim with 2 controllers", pricePaise: 34_000 * R, wasPaise: 54_990 * R, categorySlug: "electronics", icon: "chip", condition: "like_new", city: "Bengaluru", note: "Boxed · under warranty" },
  { id: "d10", publicId: "SAMPLE-10", title: "Bugaboo Fox 3 Pram", pricePaise: 42_000 * R, wasPaise: 1_15_000 * R, categorySlug: "kids-baby", icon: "stroller", condition: "good", city: "Bengaluru", note: "Rain cover and bassinet included" },
  { id: "d11", publicId: "SAMPLE-11", title: "Fender Player Stratocaster, Sunburst", pricePaise: 48_000 * R, wasPaise: 79_000 * R, categorySlug: "music-gear", icon: "music", condition: "good", city: "Bengaluru", note: "Recent setup · gig bag included" },
  { id: "d12", publicId: "SAMPLE-12", title: "Trek FX 3 Disc Hybrid, 54cm", pricePaise: 32_000 * R, wasPaise: 68_000 * R, categorySlug: "sports-fitness", icon: "dumbbell", condition: "good", city: "Bengaluru", note: "Frame number verified" },
  { id: "d13", publicId: "SAMPLE-13", title: "iPad Pro 11\" M2, 256GB + Pencil", pricePaise: 58_000 * R, wasPaise: 99_900 * R, categorySlug: "phones", icon: "phone", condition: "like_new", city: "Bengaluru", note: "Serial verified · screen flawless" },
  { id: "d14", publicId: "SAMPLE-14", title: "Sennheiser HD 660S Headphones", pricePaise: 18_500 * R, wasPaise: 39_990 * R, categorySlug: "electronics", icon: "chip", condition: "good", city: "Bengaluru", note: "New earpads fitted" },
];

/** Sample data is a development aid, never a production feature. */
export function showDemoListings(): boolean {
  return process.env.NEXT_PUBLIC_HIDE_DEMO_LISTINGS !== "true";
}

export function demoForCategory(slug: string): DemoListing[] {
  return DEMO_LISTINGS.filter((d) => d.categorySlug === slug);
}
