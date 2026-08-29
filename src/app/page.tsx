import Link from "next/link";
import { brand } from "@/config/brand";
import { CATEGORIES, GROUP_ORDER, GROUP_LABELS, categoriesByGroup } from "@/config/categories";
import { Button, Card, Badge, Eyebrow, SectionTitle } from "@/components/ui";
import { CategoryIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, faqLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "01", title: "List it in three minutes", body: "Pick the category, add photos, and answer a few questions about condition. We suggest a price from what comparable items actually sold for." },
  { n: "02", title: "We check it before anyone sees it", body: "Photos are fingerprinted, IMEIs are matched against the government stolen-device register, and the price is compared against the real market. Most listings clear in seconds." },
  { n: "03", title: "Sell safely, get paid", body: "Buyers talk to you here, not on WhatsApp. Payment is held until the item arrives and the buyer confirms it matches." },
];

const CHECKS = [
  { title: "Photos can't be borrowed", body: "Every image is fingerprinted and matched against every photo ever uploaded here — including ones from deleted listings. Resize it, crop it, brighten it: still caught." },
  { title: "Stolen phones don't get listed", body: "Every IMEI is checked against the Government of India's CEIR register before the listing can go live. No competitor does this at listing time." },
  { title: "Too-good-to-be-true is a red flag", body: "A device priced far under its real market value is the oldest trick in classifieds. We know what things actually sell for, so bait listings never appear." },
  { title: "Your number stays yours", body: "Phone numbers hidden in descriptions get stripped — however cleverly they're spelled out. Conversations stay here, where your payment is protected." },
];

const STATS = [
  { v: "11", k: "automated checks", s: "run on every listing before a human ever sees it" },
  { v: "< 10s", k: "typical decision", s: "from submit to live for a clean listing" },
  { v: "0", k: "items we hold", s: "no warehouse, no markup, no inventory games" },
];

export default function HomePage() {
  const certified = CATEGORIES.filter((c) => c.tier === "certified");
  const featured = CATEGORIES.filter((c) => c.slug !== "other").slice(0, 8);

  const faqs = [
    { q: "Is it safe to buy used products online in India?", a: "It is when the listing has been verified. On WorthIt every listing passes eleven automated checks before it appears — photographs are fingerprinted against every image ever uploaded, phone IMEIs are checked against the Government of India's CEIR stolen-device register, and prices are compared against real market data. Your payment is then held until the item arrives and you confirm it matches." },
    { q: "What does it cost to sell on WorthIt?", a: "Nothing. There is no listing fee and no commission taken from your payout. Buyers pay a small protection fee at checkout, which is what funds the verification." },
    { q: "How do I know a used phone is not stolen?", a: "Every phone listed on WorthIt has its IMEI checked against the CEIR register maintained by India's Department of Telecommunications before the listing goes live. A device reported lost or stolen is rejected automatically and never reaches a buyer." },
    { q: "Which cities does WorthIt cover?", a: "WorthIt is in early access in Bengaluru. We are deliberately saturating one city before opening others, because a marketplace is only useful when things actually sell." },
    { q: "Can businesses sell on WorthIt?", a: "Yes. Companies, dealers, refurbishers and IT asset disposal firms can register a corporate account and run bulk lot auctions, with a serial manifest and certified data wipe. Retail buyers can take single pieces from a bulk lot where the seller allows it." },
  ];

  return (
    <>
      <JsonLd data={[
        breadcrumbLd([{ name: "Home", path: "/" }]),
        faqLd(faqs),
      ]} />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-24 sm:pt-32">
          <Badge tone="violet">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-300" />
            Now in early access · {brand.defaultCity}
          </Badge>

          <h1 className="mt-7 max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-7xl">
            <span className="text-gradient">Buy used</span>
            <br />
            without the guesswork.
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-text-muted">
            {brand.description}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button href="/browse">Browse listings</Button>
            <Button href="/sell" variant="glass">Sell something</Button>
          </div>

          <div className="mt-14 grid gap-3 sm:grid-cols-3">
            {STATS.map((s) => (
              <Card key={s.k} hover>
                <div className="text-4xl font-semibold tracking-[-0.04em] tabular">{s.v}</div>
                <div className="mt-2 text-sm font-medium">{s.k}</div>
                <div className="mt-1.5 text-[13px] leading-relaxed text-text-muted">{s.s}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle eyebrow="How it works" title="Three steps, and none of them involve meeting a stranger with cash." />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <Card key={s.n} hover className="flex flex-col">
                <span className="font-mono text-xs text-violet-300">{s.n}</span>
                <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em]">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">{s.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle
              eyebrow="Categories"
              title="Sell almost anything. Some things we check harder."
              sub="Twenty categories, each with its own rules. A ₹60,000 laptop and a ₹300 textbook do not carry the same risk, so they do not get the same checks."
            />
            <Link href="/categories" className="text-sm font-semibold text-violet-300 hover:text-violet-200">
              All categories →
            </Link>
          </div>

          <div className="mt-12 space-y-10">
            {GROUP_ORDER.map((g) => {
              const items = categoriesByGroup(g);
              if (items.length === 0) return null;
              return (
                <div key={g}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-faint">
                    {GROUP_LABELS[g]}
                  </h3>
                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                    {items.map((c) => (
                      <Link key={c.slug} href={`/browse/${c.slug}`}
                        className="glass glass-hover flex items-start gap-3.5 rounded-[16px] p-4">
                        <span className="mt-0.5 shrink-0 text-violet-300"><CategoryIcon name={c.icon} /></span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold tracking-[-0.01em]">{c.label}</span>
                          <span className="mt-1 block text-xs leading-relaxed text-text-muted">{c.blurb}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* The checks */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle
            eyebrow="Why it's different"
            title="Other marketplaces moderate what gets reported. We check everything before it appears."
            sub="Eleven automated checks run on every submission. What reaches a human moderator is only what the machine genuinely could not decide."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {CHECKS.map((c) => (
              <Card key={c.title} hover>
                <h3 className="text-lg font-semibold tracking-[-0.02em]">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">{c.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Card className="overflow-hidden !p-0">
            <div className="grid gap-10 p-10 lg:grid-cols-2 lg:p-14">
              <div>
                <Eyebrow>For businesses</Eyebrow>
                <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Retiring 500 laptops? Run it as an auction.
                </h2>
                <p className="mt-5 text-[15px] leading-relaxed text-text-muted">
                  Companies, dealers and ITAD firms can list bulk lots with a serial manifest and
                  certified data wipe. Dealers bid for the whole lot while retail buyers take single
                  pieces at a fixed price — one listing, both kinds of demand.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button href="/corporate/register">Register a company</Button>
                  <Button href="/auctions" variant="glass">See live auctions</Button>
                </div>
              </div>
              <ul className="space-y-3 self-center">
                {[
                  "Sealed-lot auctions with proxy bidding and anti-sniping",
                  "Single-piece purchase from any bulk lot you allow",
                  "Serial manifests and grade mix published up front",
                  "Data-wipe certificates for compliance sign-off",
                  "GSTIN verified before auctions are enabled",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-sm leading-relaxed text-text-muted">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ — visible copy behind the FAQPage schema */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle eyebrow="Common questions" title="What people ask before their first purchase" />
          <div className="mt-10 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="glass group rounded-[18px] px-6 py-5">
                <summary className="cursor-pointer list-none text-[15px] font-semibold tracking-[-0.01em] marker:hidden">
                  <span className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold">{f.q}</h3>
                    <span className="mt-0.5 shrink-0 text-violet-300 transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Certified strip + final CTA */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <Eyebrow>Fully certified categories</Eyebrow>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {certified.map((c) => (
              <span key={c.slug} className="glass rounded-full px-4 py-2 text-sm font-medium">{c.label}</span>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-text-muted">
            These can be checked by software running on the device itself, so they carry a full
            condition report. Everything else still passes photo, price and seller checks.
          </p>
          <div className="mt-12">
            <h2 className="text-balance text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Find out what it&apos;s worth.
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button href="/sell">Start selling</Button>
              <Button href="/browse" variant="glass">Browse first</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
