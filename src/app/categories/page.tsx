import Link from "next/link";
import { CATEGORIES, GROUP_ORDER, GROUP_LABELS, categoriesByGroup } from "@/config/categories";
import { PageHeader, Badge, Card, Eyebrow } from "@/components/ui";
import { CategoryIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { buildMetadata, breadcrumbLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "All Categories — Buy & Sell Used Items in India",
  description: "Every category on WorthIt, from phones and laptops to furniture, appliances, fashion and collectibles — each with its own verification rules.",
  path: "/categories",
  keywords: [
    "used items categories india", "second hand marketplace categories",
    "sell used electronics india", "buy used furniture online india",
    "second hand appliances", "preloved fashion india",
  ],
});

const TIER_COPY = {
  certified: { label: "Fully certified", tone: "ok" as const, note: "Software reads the device itself — a complete condition report, guaranteed." },
  assisted: { label: "Assisted checks", tone: "brand" as const, note: "Serial lookups, guided photos, and every automated photo and price check." },
  basic: { label: "Standard checks", tone: "plain" as const, note: "Photo originality, price sanity, prohibited-goods screening and seller history." },
};

function rupees(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default function CategoriesPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Categories", path: "/categories" }])} />

      <PageHeader
        eyebrow="Categories"
        title="Everything you can buy and sell"
        sub="The catalogue is open — almost anything can be listed. What changes by category is how much verification runs before it appears, because a ₹60,000 laptop and a ₹300 textbook do not carry the same risk."
      />

      <div className="container-a py-16">
        {/* Verification tiers, explained once */}
        <section className="grid gap-3 sm:grid-cols-3">
          {(["certified", "assisted", "basic"] as const).map((t) => {
            const n = CATEGORIES.filter((c) => c.tier === t).length;
            return (
              <Card key={t}>
                <Badge tone={TIER_COPY[t].tone}>{TIER_COPY[t].label}</Badge>
                <p className="mt-3 text-sm leading-relaxed text-ink-2">{TIER_COPY[t].note}</p>
                <p className="mt-3 text-xs text-ink-3">{n} {n === 1 ? "category" : "categories"}</p>
              </Card>
            );
          })}
        </section>

        <div className="mt-16 space-y-16">
          {GROUP_ORDER.map((g) => {
            const items = categoriesByGroup(g);
            if (items.length === 0) return null;
            return (
              <section key={g}>
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">{GROUP_LABELS[g]}</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((c) => (
                    <Card key={c.slug} hover className="flex flex-col">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 shrink-0 text-brand"><CategoryIcon name={c.icon} /></span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold tracking-[-0.01em]">
                            <Link href={`/browse/${c.slug}`} className="hover:text-brand-600">{c.label}</Link>
                          </h3>
                          <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{c.blurb}</p>
                        </div>
                      </div>

                      <dl className="mt-5 space-y-1.5 text-[13px]">
                        <div className="flex justify-between gap-4">
                          <dt className="text-ink-3">Price range</dt>
                          <dd className="tabular text-ink-2">{rupees(c.minPricePaise)} – {rupees(c.maxPricePaise)}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-ink-3">Photos</dt>
                          <dd className="tabular text-ink-2">{c.minImages}–{c.maxImages}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-ink-3">Identity check</dt>
                          <dd className="text-right text-ink-2">
                            {c.requiresImei ? "IMEI + CEIR" : c.requiresSerial ? "Serial number" : "Not required"}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-4 border-t border-hairline pt-4">
                        <p className="text-[12px] leading-relaxed text-ink-3">
                          {c.subcategories.slice(0, 6).join(" · ")}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <section className="tile mt-20 rounded-[18px] p-10">
          <Eyebrow>Not permitted</Eyebrow>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">What we will not list, and why</h2>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold">Prohibited outright</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">
                Weapons and ammunition, controlled substances, prescription medicines, identity
                documents, wildlife products, counterfeit or &ldquo;first copy&rdquo; goods, SIM cards,
                gambling-related items, live animals. Screened automatically and rejected without review.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Excluded because we can&apos;t verify them</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">
                Gift cards and vouchers, event tickets, real estate and services. Each is either
                unverifiable before payment or a different business entirely. Listing something we
                cannot check would undo the one thing that makes WorthIt worth using.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
