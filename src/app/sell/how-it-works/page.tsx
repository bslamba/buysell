import Link from "next/link";
import { Card, Button, Eyebrow, SectionTitle } from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import { buildMetadata, breadcrumbLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "How Selling Works — List, Verify, Get Paid",
  description: "From photographing your item to money in your account: what happens at each step, what the automated checks look for, and how to get listed first time.",
  path: "/sell/how-it-works",
  keywords: ["how to sell online india", "how to sell used items", "sell second hand online india", "listing tips india", "how to sell my phone online"],
});

const STEPS = [
  { n: "01", t: "Photograph the actual item", b: "Five or more photographs of the thing you are selling, in daylight, from every angle including the damage. Not a catalogue picture, not a screenshot, not the photo from the listing you saw last week. Every image is fingerprinted against every photograph ever uploaded here, so borrowed images are rejected before a human ever sees them.", tip: "Photograph the flaws deliberately. A listing that shows the scratch sells faster than one that hides it, because the buyer stops wondering what else you left out." },
  { n: "02", t: "Fill in the details honestly", b: "Each category asks for specific facts — storage, processor, age, working status. Phones need an IMEI, which we check against the government's stolen-device register. Laptops and cameras need a serial. These are not bureaucracy: they are what lets a stranger believe you.", tip: "Dial *#06# to see a phone's IMEI. A laptop serial is on the underside or in system information." },
  { n: "03", t: "Price it against reality", b: "We suggest a price from what comparable items actually sold for. Wildly above it and the listing sits unsold; wildly below it and the automation reads it as bait and blocks it — because a device at 35% of market value is far more often a scam than a bargain.", tip: "If you genuinely need a fast sale, price at the lower end of the suggested band rather than below it." },
  { n: "04", t: "Automated review, usually in seconds", b: "Eleven checks run in parallel: photo originality, stolen-device lookup, price sanity, contact details hidden in the text, prohibited goods, seller history. Most listings clear in under ten seconds. What the machine cannot decide goes to a person, sorted by priority rather than arrival.", tip: "A rejection always names what to fix. Fix it and resubmit — resubmissions are not penalised." },
  { n: "05", t: "A buyer pays, and the money is held", b: "Payment is collected up front and held. You are not shipping on trust and you are not chasing a transfer. You get a prepaid label and a pickup slot.", tip: "Ship within 48 hours. Listings from sellers who ship fast get ranked higher." },
  { n: "06", t: "Buyer confirms, you get paid", b: "The buyer has an inspection window to check the item against your listing. Confirm or let it lapse, and the money moves to you. Describe the item accurately and this step is a formality.", tip: "Most disputes come from something the seller knew and did not mention. There is no version of this where hiding a fault ends well." },
];

export default function HowItWorksPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([
        { name: "Home", path: "/" }, { name: "Sell", path: "/sell" },
        { name: "How it works", path: "/sell/how-it-works" },
      ])} />

      <header className="border-b border-white/[0.06] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <Eyebrow>Selling</Eyebrow>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            From your drawer to their desk
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-text-muted">
            Six steps, and the only one that takes real effort is the photographs. Here is exactly
            what happens at each, and what the automated checks are looking for.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="space-y-4">
          {STEPS.map((s) => (
            <Card key={s.n} hover>
              <div className="grid gap-6 md:grid-cols-[60px_1fr]">
                <span className="font-mono text-sm text-violet-300">{s.n}</span>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.02em]">{s.t}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">{s.b}</p>
                  <p className="mt-4 rounded-xl bg-violet-400/[0.08] px-4 py-3 text-[13px] leading-relaxed text-violet-200 ring-1 ring-violet-400/15">
                    <strong className="font-semibold">Tip.</strong> {s.tip}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <section className="mt-20">
          <SectionTitle
            eyebrow="Getting rejected"
            title="The four reasons listings fail, in order of frequency"
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              { t: "A photo has been used before", b: "Either you reused your own photo from another listing, or the image belongs to someone else. Take fresh photographs of this specific item." },
              { t: "A phone number in the description", b: "However you spell it out. Buyers reach you through WorthIt chat — that is what keeps the payment protected, for both of you." },
              { t: "Required details missing", b: "Each category has a short list of facts it needs. The form will not let you submit without them, but attributes typed as “NA” count as missing." },
              { t: "Priced far below market", b: "Under 40% of the market median for that model is blocked automatically. If your item genuinely is worth that little, say why in the description." },
            ].map((r) => (
              <Card key={r.t}>
                <h3 className="text-base font-semibold tracking-[-0.01em]">{r.t}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-text-muted">{r.b}</p>
              </Card>
            ))}
          </div>
        </section>

        <div className="mt-16 flex flex-wrap gap-3">
          <Button href="/sell/new">List an item</Button>
          <Link href="/sell/fees" className="glass glass-hover rounded-full px-5 py-2.5 text-sm font-semibold">
            What it costs
          </Link>
        </div>
      </div>
    </>
  );
}
