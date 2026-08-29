import Link from "next/link";
import { currentUser } from "@/lib/auth/guards";
import { CATEGORIES, GROUP_ORDER, GROUP_LABELS, categoriesByGroup } from "@/config/categories";
import { Card, Button, Badge, Eyebrow, SectionTitle } from "@/components/ui";
import { CategoryIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { buildMetadata, breadcrumbLd, faqLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Sell Online in India — Free Listings, No Commission",
  description: "List for free and keep the whole sale price. WorthIt takes no commission from sellers — buyers pay a protection fee, which is what makes your listing worth trusting.",
  path: "/sell",
  keywords: [
    "sell online india", "sell used items india", "sell my phone online",
    "sell laptop online india", "sell furniture online", "free listing marketplace india",
    "no commission selling india", "sell second hand items bangalore",
  ],
});

const BENEFITS = [
  { t: "Listing is free, and so is selling", b: "No listing fee. No commission from your payout. You keep the price you agreed. Buyers pay a protection fee at checkout instead — which is what funds the verification that makes your listing credible in the first place." },
  { t: "Verified listings sell faster", b: "A buyer choosing between your listing and an identical one on a classifieds site is choosing between a stranger's word and a machine-checked report. That is the whole reason to list here rather than there." },
  { t: "You get paid, guaranteed", b: "Payment is collected before the item ships and held until the buyer confirms it matches. No chasing, no bounced transfers, no meeting a stranger with cash." },
];

const FAQS = [
  { q: "How much does it cost to sell on WorthIt?", a: "Nothing. There is no listing fee, no subscription and no commission deducted from your payout. WorthIt earns from a protection fee paid by the buyer at checkout." },
  { q: "How long does it take for my listing to go live?", a: "Most listings are decided in under ten seconds by the automated checks. Listings the automation cannot decide go to a human reviewer, sorted by priority — usually a few hours." },
  { q: "Why was my listing rejected?", a: "The rejection message names exactly what to fix. The most common causes are a photograph that has been used before, a phone number in the description, missing required details, or a price far below what the item actually sells for." },
  { q: "When do I get paid?", a: "Once the buyer receives the item and confirms it matches the listing, or when the inspection window closes without a dispute. Payment is already collected and held before the item ships, so there is nothing to chase." },
  { q: "Can I sell without verifying my phone number?", a: "No. A verified Indian mobile number is required for every category. It is the single most effective thing we do to stop one person running ten fake seller accounts, and buyers never see your number." },
];

export default async function SellPage() {
  const user = await currentUser();

  return (
    <>
      <JsonLd data={[
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Sell", path: "/sell" }]),
        faqLd(FAQS),
      ]} />

      {/* Hero */}
      <section className="border-b border-white/[0.06]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <Badge tone="ok">Free to list · no commission</Badge>
            <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-6xl">
              If you&apos;re not using it,<br />
              <span className="text-gradient">someone is.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-text-muted">
              List in about three minutes. We verify it, buyers trust it, and you keep every rupee
              of the sale price.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {user && !user.phoneVerified ? (
                <Button href="/verify-phone?next=/sell/new">Verify your number to start</Button>
              ) : (
                <Button href={user ? "/sell/new" : "/signin?next=/sell/new"}>List an item</Button>
              )}
              <Button href="/sell/how-it-works" variant="glass">See how it works</Button>
            </div>
          </div>

          <Card className="lg:justify-self-end lg:max-w-md">
            <Eyebrow>What you keep</Eyebrow>
            <div className="mt-5 space-y-4">
              {[
                { k: "Listing fee", v: "₹0" },
                { k: "Seller commission", v: "₹0" },
                { k: "Payout on a ₹40,000 sale", v: "₹40,000" },
              ].map((r, i) => (
                <div key={r.k} className={`flex items-baseline justify-between gap-4 ${i === 2 ? "border-t border-white/[0.08] pt-4" : ""}`}>
                  <span className="text-sm text-text-muted">{r.k}</span>
                  <span className={`tabular font-semibold tracking-[-0.02em] ${i === 2 ? "text-2xl text-ok" : "text-lg"}`}>{r.v}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-relaxed text-text-faint">
              Buyers pay a protection fee on top. <Link href="/sell/fees" className="text-violet-300 hover:text-violet-200">See the full fee breakdown →</Link>
            </p>
          </Card>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b border-white/[0.06] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle eyebrow="Why sell here" title="Reach buyers who already trust the listing" />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {BENEFITS.map((b) => (
              <Card key={b.t} hover>
                <h3 className="text-lg font-semibold tracking-[-0.02em]">{b.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">{b.b}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Category picker */}
      <section className="border-b border-white/[0.06] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle eyebrow="Start here" title="What are you selling?" />
          <div className="mt-10 space-y-8">
            {GROUP_ORDER.map((g) => {
              const items = categoriesByGroup(g);
              if (items.length === 0) return null;
              return (
                <div key={g}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-faint">{GROUP_LABELS[g]}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {items.map((c) => (
                      <Link key={c.slug} href={`/sell/new?category=${c.slug}`}
                        className="glass glass-hover flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium">
                        <span className="text-violet-300"><CategoryIcon name={c.icon} size={17} /></span>
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-8 text-sm text-text-muted">
            {CATEGORIES.length} categories. <Link href="/categories" className="text-violet-300 hover:text-violet-200">See what each one requires →</Link>
          </p>
        </div>
      </section>

      {/* Business */}
      <section className="border-b border-white/[0.06] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Card className="!p-0">
            <div className="grid gap-10 p-10 lg:grid-cols-2 lg:p-14">
              <div>
                <Eyebrow>Selling as a business</Eyebrow>
                <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Bulk lots, auctions and dealer tools
                </h2>
                <p className="mt-5 text-[15px] leading-relaxed text-text-muted">
                  Companies retiring IT assets, dealers, refurbishers and disposal firms get bulk
                  upload, sealed-lot auctions with proxy bidding, and the option to let retail
                  buyers take single pieces from a lot.
                </p>
                <div className="mt-8"><Button href="/sell/business">Business selling →</Button></div>
              </div>
              <ul className="space-y-3 self-center">
                {[
                  "Upload hundreds of items from a CSV",
                  "Run sealed-lot auctions with anti-sniping",
                  "Publish a serial manifest and grade mix",
                  "Issue data-wipe certificates for compliance",
                  "GSTIN verified before auctions are enabled",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-sm leading-relaxed text-text-muted">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />{t}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle eyebrow="Seller FAQ" title="What sellers ask before their first listing" />
          <div className="mt-10 space-y-3">
            {FAQS.map((f) => (
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
    </>
  );
}
