/**
 * Single source of truth for brand identity.
 * Change these four values and the entire app re-brands.
 * See docs/NAMING.md for the shortlist and the reasoning behind "Pakka".
 */
export const brand = {
  name: "Pakka",
  legalName: "Gryffin Global IT Services Private Limited",
  tagline: "Pakka checked. Pakka safe.",
  description:
    "India's verification-first marketplace for pre-owned goods. Every listing is machine-checked before it goes live.",
  domain: "pakka.in",
  supportEmail: "help@pakka.in",
  locale: "en-IN",
  currency: "INR",
  currencySymbol: "₹",
  defaultCity: "Bengaluru",
} as const;

export type Brand = typeof brand;
