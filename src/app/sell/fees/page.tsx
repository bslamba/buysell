import Link from "next/link";
import { Card, Eyebrow, Button, Badge } from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import { buildMetadata, breadcrumbLd, faqLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Selling Fees — Free for Sellers, Explained in Full",
  description: "WorthIt charges sellers nothing: no listing fee, no commission, no subscription. Here is exactly what buyers pay, and why the fee sits on that side.",
  path: "/sell/fees",
  keywords: ["selling fees india", "marketplace commission india", "free to sell online", "olx vs worthit fees", "no commission marketplace"],
});

const FAQS = [
  { q: "Does WorthIt take a commission from sellers?", a: "No. There is no commission, no listing fee and no subscription for individual sellers. You receive the full price the buyer agreed to pay for the item." },
  { q: "What does the buyer pay?", a: "A protection fee of roughly 4-6% of the item price plus a small fixed amount, shown clearly before payment. It covers escrow, the condition guarantee and dispute resolution." },
  { q: "Why charge the buyer instead of the seller?", a: "Because supply is the hard side of a resale marketplace and safety is what buyers actually want to pay for. Charging sellers reduces listings; charging buyers for protection sells something they value. Vinted proved this at over €10 billion of annual sales." },
];

export default function FeesPage() {
  return (
    <>
      <JsonLd data={[
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Sell", path: "/sell" }, { name: "Fees", path: "/sell/fees" }]),
        faqLd(FAQS),
      ]} />

      <header className="border-b border-white/[0.06] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <Eyebrow>Selling</Eyebrow>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Sellers pay nothing. Here&apos;s the whole picture.
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-text-muted">
            No listing fee, no commission, no subscription. That is not a launch promotion — it is
            how the business is designed, and this page explains why.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <Badge tone="ok">What you pay</Badge>
            <div className="mt-6 space-y-3.5">
              {[["Listing fee", "₹0"], ["Commission on sale", "₹0"], ["Monthly subscription", "₹0"], ["Payout fee", "₹0"]].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-text-muted">{k}</span>
                  <span className="tabular text-lg font-semibold text-ok">{v}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 border-t border-white/[0.08] pt-4 text-sm leading-relaxed text-text-muted">
              Optional extras exist — promoted placement, extended certification — and are priced at
              the point you choose them. Nothing is ever deducted automatically.
            </p>
          </Card>

          <Card>
            <Badge tone="violet">What the buyer pays</Badge>
            <div className="mt-6 space-y-3.5">
              {[["Item price", "set by you"], ["Buyer protection fee", "~4–6% + ₹29"], ["Shipping", "quoted at checkout"]].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-text-muted">{k}</span>
                  <span className="tabular text-sm font-semibold">{v}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 border-t border-white/[0.08] pt-4 text-sm leading-relaxed text-text-muted">
              The protection fee funds escrow, the condition guarantee, and someone answering the
              phone when a dispute happens. It is shown in full before payment — never a surprise.
            </p>
          </Card>
        </div>

        <Card className="mt-4">
          <Eyebrow>Worked example</Eyebrow>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">A laptop listed at ₹40,000</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <tbody>
                {[
                  ["Your asking price", "₹40,000", ""],
                  ["Buyer protection fee (5% + ₹29)", "₹2,029", "paid by the buyer"],
                  ["Shipping", "₹250", "paid by the buyer"],
                  ["Buyer pays in total", "₹42,279", ""],
                  ["You receive", "₹40,000", "the full asking price"],
                ].map(([k, v, note], i, arr) => (
                  <tr key={k} className={i === arr.length - 1 ? "border-t border-white/[0.1]" : "border-b border-white/[0.05]"}>
                    <td className="py-3 pr-4 text-text-muted">{k}</td>
                    <td className={`py-3 pr-4 text-right tabular font-semibold ${i === arr.length - 1 ? "text-xl text-ok" : ""}`}>{v}</td>
                    <td className="py-3 text-xs text-text-faint">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <section className="mt-16">
          <Eyebrow>The reasoning</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-balance text-2xl font-semibold tracking-[-0.03em]">
            Why the fee sits on the buyer&apos;s side
          </h2>
          <div className="mt-6 max-w-2xl space-y-4 text-[15px] leading-relaxed text-text-muted">
            <p>
              In any resale marketplace, supply is the hard side. Buyers arrive on their own when
              there is something worth buying; sellers have to be persuaded, and their alternative
              is a free listing on a classifieds site. A seller fee, however small, loses that
              argument every time.
            </p>
            <p>
              Buyers are the opposite. What a buyer actually wants in used goods is not a lower
              price — it is not getting cheated. That is a thing worth paying for, and it is the
              thing the fee buys.
            </p>
            <p>
              This is not a theory. Vinted runs this exact model across 26 markets, has been
              profitable since 2023, and does over €10 billion of annual sales with sellers paying
              nothing at all.
            </p>
          </div>
        </section>

        <section className="mt-16">
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="glass group rounded-[18px] px-6 py-5">
                <summary className="cursor-pointer list-none text-[15px] font-semibold marker:hidden">
                  <span className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold">{f.q}</h3>
                    <span className="mt-0.5 shrink-0 text-violet-300 transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-14 flex flex-wrap gap-3">
          <Button href="/sell/new">List an item</Button>
          <Link href="/sell/how-it-works" className="glass glass-hover rounded-full px-5 py-2.5 text-sm font-semibold">
            How selling works
          </Link>
        </div>
      </div>
    </>
  );
}
