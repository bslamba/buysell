import type { Check, CheckResult } from "../types";
import { PROHIBITED_PATTERNS } from "@/config/categories";

/* ────────────────────────────────────────────────────────────────────────────
 * Contact-leak detection
 *
 * This is the disintermediation defence. If a seller can put their number in the
 * description, every transaction moves to WhatsApp and the platform earns nothing
 * and protects no one. Sellers get creative, so we normalise aggressively before
 * matching: strip separators, fold spelled-out digits, fold leetspeak.
 * ──────────────────────────────────────────────────────────────────────────*/

const DIGIT_WORDS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6",
  seven: "7", eight: "8", nine: "9", oh: "0", o: "0",
  ek: "1", do: "2", teen: "3", char: "4", paanch: "5", panch: "5",
  chhe: "6", che: "6", saat: "7", aath: "8", nau: "9", shunya: "0",
};

const LEET: Record<string, string> = { o: "0", O: "0", l: "1", I: "1", i: "1", S: "5", s: "5", B: "8", g: "9", z: "2" };

export function normaliseForContactScan(input: string): string {
  let s = input.toLowerCase();
  // spelled-out digits, in English and romanised Hindi
  s = s.replace(/\b([a-z]+)\b/g, (m) => DIGIT_WORDS[m] ?? m);
  // leetspeak inside digit runs only, so we don't mangle ordinary prose
  s = s.replace(/(?:[0-9][^0-9a-z]{0,2}){4,}[0-9a-z]*/g, (run) =>
    run.replace(/[a-z]/g, (c) => LEET[c] ?? c));
  // drop separators commonly used to break up a number
  s = s.replace(/[\s.\-_()\[\]{}|/\\*+#,:;'"`~]/g, "");
  return s;
}

const PHONE_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /(?:\+?91|0)?[6-9]\d{9}/, label: "Indian mobile number" },
  { re: /\b\d{3,5}\d{6,8}\b/, label: "landline or long digit run" },
];

const HANDLE_PATTERNS: { re: RegExp; label: string; score: number }[] = [
  { re: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, label: "email address", score: 35 },
  { re: /\b(?:wa\.me|whatsapp|whats\s*app|wtsp|watsapp|w\.?a\.?)\b/i, label: "WhatsApp reference", score: 30 },
  { re: /\b(?:telegram|t\.me|insta(?:gram)?|snapchat|signal\s+me)\b/i, label: "off-platform messenger", score: 25 },
  { re: /https?:\/\/|www\.[a-z0-9-]+\.[a-z]{2,}/i, label: "external link", score: 25 },
  { re: /\b(?:call|whatsapp|ping|msg|message|contact|dm)\s+(?:me|us)\s+(?:on|at|@)\b/i, label: "contact instruction", score: 30 },
  { re: /\b(?:my|mera)\s*(?:number|num|no|mobile|contact)\b/i, label: "number offer", score: 30 },
];

export const contactLeakCheck: Check = async (ctx) => {
  const out: CheckResult[] = [];
  const raw = `${ctx.listing.title}\n${ctx.listing.description}`;
  const normalised = normaliseForContactScan(raw);

  for (const { re, label } of PHONE_PATTERNS) {
    const hit = normalised.match(re);
    // Ignore digit runs that are plausibly a model number or serial in raw text
    if (hit && !/^(?:19|20)\d{8}$/.test(hit[0])) {
      out.push({
        key: "text.phone_number",
        passed: false, severity: "blocker", scoreDelta: 100,
        message: `Remove the ${label} from your listing. Buyers contact you through WorthIt chat — that is what keeps your payment protected.`,
        detail: { matched: hit[0].replace(/\d(?=\d{4})/g, "x") },
        sellerFixable: true,
      });
      break;
    }
  }

  for (const { re, label, score } of HANDLE_PATTERNS) {
    if (re.test(raw)) {
      out.push({
        key: "text.contact_handle",
        passed: false, severity: "high", scoreDelta: score,
        message: `Remove the ${label} from your listing.`,
        detail: { label }, sellerFixable: true,
      });
    }
  }

  if (out.length === 0) {
    out.push({ key: "text.contact", passed: true, severity: "info", scoreDelta: 0, message: "No contact details in the listing text." });
  }
  return out;
};

/* ────────────────────────────────────────────────────────────────────────────
 * Scam-script detection
 *
 * These phrases are lifted from the actual scripts used in Indian classifieds
 * fraud. Individually weak, collectively decisive.
 * ──────────────────────────────────────────────────────────────────────────*/

const SCAM_PHRASES: { re: RegExp; label: string; score: number }[] = [
  { re: /\b(?:army|military|indian\s+army|defence|navy|air\s*force)\s+(?:officer|personnel|posting|transfer)\b/i, label: "army-posting script", score: 45 },
  { re: /\b(?:advance|token)\s+(?:payment|amount|money)\s+(?:required|first|before)\b/i, label: "advance payment demand", score: 40 },
  { re: /\b(?:courier|cargo|transport)\s+(?:will|shall)\s+deliver\b/i, label: "courier-delivery script", score: 40 },
  { re: /\b(?:google\s*pay|gpay|phonepe|paytm|upi)\s*(?:id|number|karo|kar\s*do|only)\b/i, label: "direct UPI request", score: 45 },
  { re: /\b(?:bank|account)\s+(?:transfer|details)\s+(?:only|karo|required)\b/i, label: "bank transfer request", score: 40 },
  { re: /\burgent(?:ly)?\s+sell(?:ing)?\b.*\b(?:posting|transfer|relocat|leaving\s+(?:the\s+)?(?:city|country))\b/i, label: "urgency + relocation", score: 25 },
  { re: /\b(?:no\s+bargain|fixed\s+price)\b.*\b(?:advance|token)\b/i, label: "no-bargain + advance", score: 25 },
  { re: /\b(?:seal(?:ed)?\s*pack|box\s*pack)\b.*\b(?:half|50%|below)\s*price\b/i, label: "sealed-pack underpricing", score: 35 },
];

export const scamPhraseCheck: Check = async (ctx) => {
  const raw = `${ctx.listing.title}\n${ctx.listing.description}`;
  const hits = SCAM_PHRASES.filter((p) => p.re.test(raw));
  if (hits.length === 0) {
    return [{ key: "text.scam_phrases", passed: true, severity: "info", scoreDelta: 0, message: "No known fraud phrasing detected." }];
  }
  const total = hits.reduce((s, h) => s + h.score, 0);
  return [{
    key: "text.scam_phrases",
    passed: false,
    severity: total >= 70 ? "blocker" : "high",
    scoreDelta: Math.min(total, 100),
    message: `Listing text matches known fraud patterns: ${hits.map((h) => h.label).join(", ")}.`,
    detail: { labels: hits.map((h) => h.label) },
    sellerFixable: false,
  }];
};

/* ────────────────────────────────────────────────────────────────────────────
 * Prohibited goods and category-banned terms
 * ──────────────────────────────────────────────────────────────────────────*/

export const prohibitedCheck: Check = async (ctx) => {
  const raw = `${ctx.listing.title} ${ctx.listing.description}`;
  const out: CheckResult[] = [];

  for (const { pattern, reason } of PROHIBITED_PATTERNS) {
    if (pattern.test(raw)) {
      out.push({
        key: "text.prohibited",
        passed: false, severity: "blocker", scoreDelta: 100,
        message: reason, detail: { pattern: pattern.source }, sellerFixable: false,
      });
    }
  }
  for (const term of ctx.category.bannedTerms ?? []) {
    if (raw.toLowerCase().includes(term.toLowerCase())) {
      out.push({
        key: "text.banned_term",
        passed: false, severity: "blocker", scoreDelta: 100,
        message: `"${term}" is not allowed in ${ctx.category.label} listings.`,
        detail: { term }, sellerFixable: false,
      });
    }
  }
  if (out.length === 0) {
    out.push({ key: "text.prohibited", passed: true, severity: "info", scoreDelta: 0, message: "No prohibited content." });
  }
  return out;
};

/* ────────────────────────────────────────────────────────────────────────────
 * Description quality + near-duplicate text
 * ──────────────────────────────────────────────────────────────────────────*/

export const textQualityCheck: Check = async (ctx) => {
  const out: CheckResult[] = [];
  const desc = ctx.listing.description.trim();
  const title = ctx.listing.title.trim();

  if (desc.length < 40) {
    out.push({
      key: "text.too_short", passed: false, severity: "medium", scoreDelta: 15,
      message: "Add at least a couple of sentences describing condition, age and what's included.",
      sellerFixable: true,
    });
  }
  const caps = title.replace(/[^A-Za-z]/g, "");
  if (caps.length > 8 && caps === caps.toUpperCase()) {
    out.push({
      key: "text.all_caps", passed: false, severity: "low", scoreDelta: 5,
      message: "Titles in ALL CAPS are rewritten automatically.", sellerFixable: true,
    });
  }
  // Keyword stuffing: same token repeated many times
  const tokens = desc.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  const worst = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (worst && worst[1] > 8 && tokens.length > 20 && worst[1] / tokens.length > 0.15) {
    out.push({
      key: "text.keyword_stuffing", passed: false, severity: "medium", scoreDelta: 15,
      message: `"${worst[0]}" is repeated ${worst[1]} times. Remove repeated keywords.`,
      detail: { token: worst[0], count: worst[1] }, sellerFixable: true,
    });
  }

  const similar = await ctx.services.findSimilarText(desc, ctx.listing.id);
  for (const s of similar) {
    if (s.similarity < 0.85) continue;
    const sameUser = s.sellerId === ctx.listing.sellerId;
    out.push({
      key: sameUser ? "text.duplicate_same_user" : "text.duplicate_other_user",
      passed: false,
      severity: sameUser ? "medium" : "high",
      scoreDelta: sameUser ? 18 : 35,
      message: sameUser
        ? "This description is nearly identical to another of your listings."
        : "This description is nearly identical to another seller's listing.",
      detail: { matchedListingId: s.listingId, similarity: Number(s.similarity.toFixed(2)) },
      sellerFixable: true,
    });
  }

  if (out.length === 0) {
    out.push({ key: "text.quality", passed: true, severity: "info", scoreDelta: 0, message: "Description quality is fine." });
  }
  return out;
};

/** Shingle-based Jaccard similarity — cheap, no model needed, good enough at k=5. */
export function textSimilarity(a: string, b: string, k = 5): number {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const shingles = (s: string) => {
    const w = norm(s).split(" ");
    const set = new Set<string>();
    for (let i = 0; i + k <= w.length; i++) set.add(w.slice(i, i + k).join(" "));
    return set;
  };
  const A = shingles(a), B = shingles(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const s of A) if (B.has(s)) inter++;
  return inter / (A.size + B.size - inter);
}
