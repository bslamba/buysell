import Link from "next/link";
import { Card, Button, Badge, Eyebrow, SectionTitle } from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import { buildMetadata, breadcrumbLd, faqLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Business Selling — Bulk Lots, Auctions & ITAD in India",
  description: "For companies retiring IT assets, dealers and refurbishers: bulk upload, sealed-lot auctions with proxy bidding, serial manifests and certified data wipe.",
  path: "/sell/business",
  keywords: [
    "IT asset disposal india", "ITAD india", "sell used laptops in bulk",
    "corporate IT disposal bangalore", "business liquidation india",
    "bulk auction used electronics", "refurbisher marketplace india",
    "sell company laptops india", "e-waste disposal corporate india",
  ],
});

const FEATURES = [
  { t: "Bulk upload from a CSV", b: "Hundreds of items in one file. Every row still passes the full moderation pipeline — corporate does not mean unreviewed, because a lot that turns out to be misdescribed damages the buyer's trust in all of them." },
  { t: "Sealed-lot auctions", b: "Dealers bid for the whole lot with proxy bidding, so they set a maximum and the platform bids on their behalf. Anti-sniping extends the close when a bid lands in the final seconds, which means the highest bidder wins rather than the fastest connection." },
  { t: "Single-piece sales from a bulk lot", b: "Switch it on and retail buyers can take one unit at a fixed price while dealers compete for the remainder. One listing, two kinds of demand — which usually beats the price a pure bulk auction reaches." },
  { t: "Serial manifests and grade mix", b: "Publish the actual serials and the condition breakdown — 12 Grade A, 40 Grade B, 8 Grade C. Bidders bid on facts instead of a photograph of a pallet, and bid higher for it." },
  { t: "Certified data wipe", b: "Attach data destruction certificates to the lot. Your compliance team needs this, and it is usually the thing that blocks a disposal from happening at all." },
  { t: "GSTIN verified before you go live", b: "Company accounts are checked against the public GST registry before auctions are enabled. It is a small hurdle for you and a large signal to every buyer." },
];

const FAQS = [
  { q: "What kind of businesses can sell on WorthIt?", a: "Companies disposing of IT assets, dealers, refurbishers, IT asset disposition (ITAD) firms, retailers clearing open-box stock, and businesses closing or downsizing. Registration requires a GSTIN and takes about a day to verify." },
  { q: "How do lot auctions work?", a: "You create a lot with a quantity, grade mix, serial manifest, reserve and start price. Bidders place bids or set a proxy maximum. Anti-sniping extends the close if a bid lands near the end. When it closes above reserve, the highest bidder wins." },
  { q: "Can retail buyers buy from a bulk lot?", a: "Yes, if you enable single-piece purchase on that lot. Retail buyers take individual units at a fixed price you set, while dealers bid for the rest. You cap how many units one buyer can take." },
  { q: "What does it cost a business to sell?", a: "Commission on completed auctions, currently 3-6% of the lot value depending on category and volume, agreed before your account is enabled. There is no upfront cost and no listing fee." },
  { q: "Do you handle logistics for bulk lots?", a: "Bulk lots are collected by the buyer from your premises by default, which is what keeps the economics working at pallet scale. Individual items ship through our standard logistics partners." },
];

export default function BusinessSellingPage() {
  return (
    <>
      <JsonLd data={[
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Sell", path: "/sell" }, { name: "Business selling", path: "/sell/business" }]),
        faqLd(FAQS),
      ]} />

      <header className="border-b border-hairline py-16">
        <div className="container-a">
          <Badge tone="brand">For businesses</Badge>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Your old hardware is worth more than the scrap rate
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-2">
            Most Indian companies dispose of retired laptops and IT equipment through a broker who
            pays by weight. Those machines have years of working life and buyers who want them.
            India&apos;s IT asset disposition market is worth around $817 million and growing about
            9% a year — most of that value never reaches the company that owned the asset.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button href="/corporate/register">Register your company</Button>
            <Button href="/auctions" variant="ghost">See live auctions</Button>
          </div>
        </div>
      </header>

      <div className="container-a py-16">
        <SectionTitle eyebrow="What you get" title="Built for volume, not for one-off listings" />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.t} hover className="flex h-full flex-col">
              <h2 className="text-base font-semibold tracking-[-0.01em]">{f.t}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{f.b}</p>
            </Card>
          ))}
        </div>

        <section className="mt-20">
          <SectionTitle eyebrow="Getting started" title="Four steps to your first auction" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Register", b: "Company name, GSTIN, CIN and an authorised signatory." },
              { n: "02", t: "Get verified", b: "We check the GSTIN against the public registry. Usually one working day." },
              { n: "03", t: "Build the lot", b: "Quantity, grade mix, serial manifest, reserve and close date." },
              { n: "04", t: "Run it", b: "Bidders compete, anti-sniping protects the close, you pick collection." },
            ].map((s) => (
              <Card key={s.n} hover>
                <span className="font-mono text-xs text-brand">{s.n}</span>
                <h3 className="mt-3 text-base font-semibold tracking-[-0.01em]">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{s.b}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <Eyebrow>Common questions</Eyebrow>
          <div className="mt-6 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="tile group rounded-[18px] px-6 py-5">
                <summary className="cursor-pointer list-none text-[15px] font-semibold marker:hidden">
                  <span className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold">{f.q}</h3>
                    <span className="mt-0.5 shrink-0 text-brand transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <Card className="mt-16">
          <Eyebrow>Sustainability</Eyebrow>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">It counts toward your disclosures</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">
            Reuse sits above recycling in the waste hierarchy, and the E-Waste Management Rules
            place responsibility on the producer. Every lot sold here comes with a record of what
            was disposed of, to whom, and with what data destruction — which is what your ESG
            reporting actually needs.{" "}
            <Link href="/contact" className="text-brand hover:text-brand-600">Talk to us about a first lot →</Link>
          </p>
        </Card>
      </div>
    </>
  );
}
