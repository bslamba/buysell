import Link from "next/link";
import { CATEGORIES, type VerificationTier } from "@/config/categories";
import { PageHeader, Badge, Card, Eyebrow } from "@/components/ui";

export const metadata = { title: "Categories" };

const TIERS: { tier: VerificationTier; title: string; blurb: string }[] = [
  {
    tier: "certified",
    title: "Fully certified",
    blurb: "Software can interrogate the device itself — battery cycles, drive health, IMEI, serial. These carry a complete condition report, and the report is guaranteed.",
  },
  {
    tier: "assisted",
    title: "Assisted checks",
    blurb: "No self-diagnostic is possible, so we verify what can be verified: serial lookups, guided photos of the right angles, and every automated photo and price check.",
  },
  {
    tier: "basic",
    title: "Standard checks",
    blurb: "Photo originality, price sanity, prohibited-goods screening and seller history. Everything on WorthIt passes at least this.",
  },
];

function rupees(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Categories"
        title="What you can sell, and how hard we check it"
        sub="The catalogue is open — almost anything can be listed. What changes by category is how much verification runs before the listing appears, because a ₹60,000 laptop and a ₹300 textbook do not carry the same risk."
      />

      <div className="mx-auto max-w-6xl space-y-20 px-6 py-20">
        {TIERS.map(({ tier, title, blurb }) => {
          const items = CATEGORIES.filter((c) => c.tier === tier);
          return (
            <section key={tier}>
              <div className="flex flex-wrap items-baseline gap-4">
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h2>
                <Badge tone={tier === "certified" ? "ok" : tier === "assisted" ? "violet" : "plain"}>
                  {items.length} {items.length === 1 ? "category" : "categories"}
                </Badge>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">{blurb}</p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((c) => (
                  <Card key={c.slug} hover className="flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold tracking-[-0.01em]">{c.label}</h3>
                      <Link href={`/browse?category=${c.slug}`} className="shrink-0 text-xs font-semibold text-violet-300 hover:text-violet-200">
                        Browse →
                      </Link>
                    </div>

                    <dl className="mt-5 space-y-2 text-[13px]">
                      <div className="flex justify-between gap-4">
                        <dt className="text-text-faint">Price range</dt>
                        <dd className="tabular text-text-muted">{rupees(c.minPricePaise)} – {rupees(c.maxPricePaise)}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-text-faint">Photos</dt>
                        <dd className="tabular text-text-muted">{c.minImages}–{c.maxImages}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-text-faint">Identity check</dt>
                        <dd className="text-text-muted">
                          {c.requiresImei ? "IMEI + CEIR" : c.requiresSerial ? "Serial number" : "Not required"}
                        </dd>
                      </div>
                      {c.requiresKycAbovePaise ? (
                        <div className="flex justify-between gap-4">
                          <dt className="text-text-faint">ID needed above</dt>
                          <dd className="tabular text-text-muted">{rupees(c.requiresKycAbovePaise)}</dd>
                        </div>
                      ) : null}
                    </dl>

                    <div className="mt-5 border-t border-white/[0.06] pt-4">
                      <Eyebrow>You&apos;ll be asked for</Eyebrow>
                      <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
                        {c.requiredAttributes.map((a) => a.replace(/_/g, " ")).join(", ")}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}

        <section className="glass rounded-[18px] p-10">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">What we will not list</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
            Weapons and ammunition, controlled substances, prescription medicines, identity documents,
            wildlife products, counterfeit or &ldquo;first copy&rdquo; goods, SIM cards, and anything
            gambling-related. These are screened automatically and rejected without review.
          </p>
        </section>
      </div>
    </>
  );
}
