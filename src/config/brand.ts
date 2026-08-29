/**
 * Single source of truth for brand identity.
 * Change these values and the entire app re-brands.
 */
export const brand = {
  name: "WorthIt",
  legalName: "Gryffin Global IT Services Private Limited",
  tagline: "Know what it's worth.",
  shortPitch: "India's verification-first marketplace for pre-owned things.",
  description:
    "Every listing on WorthIt is machine-checked before it goes live — photos fingerprinted, IMEIs matched against the government stolen-device register, prices sanity-checked against what things actually sell for.",
  domain: "worthit.in",
  supportEmail: "help@worthit.in",
  supportPhone: "+91 80 4718 0000",
  locale: "en-IN",
  currency: "INR",
  currencySymbol: "₹",
  defaultCity: "Bengaluru",
  socials: {
    instagram: "https://instagram.com/worthit.in",
    linkedin: "https://linkedin.com/company/worthit-in",
    x: "https://x.com/worthit_in",
    youtube: "https://youtube.com/@worthit-in",
  },
} as const;

export type Brand = typeof brand;
