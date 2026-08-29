import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryBySlug } from "@/config/categories";
import { SAMPLE_LISTINGS, sampleById, samplesForCategory, showSamples } from "@/config/catalogue";
import { ListingImage } from "@/components/listing-image";
import { ListingCard } from "@/components/listing-card";
import { Button, Actions, Eyebrow, Badge } from "@/components/ui";
import { CategoryIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { buildMetadata, breadcrumbLd, productLd } from "@/lib/seo";

export const dynamic = "force-static";

const CONDITION_LABEL: Record<string, string> = {
  new: "New", like_new: "Like new", good: "Good", fair: "Fair", for_parts: "For parts",
};

const CONDITION_BLURB: Record<string, string> = {
  like_new: "Barely used and showing no meaningful wear. Photographed from every angle so you can judge for yourself.",
  good: "Used and cared for. Light cosmetic marks consistent with its age, and everything works as it should.",
  fair: "Visible wear, fully functional. Priced to reflect the marks, which are photographed rather than hidden.",
};

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function generateStaticParams() {
  return SAMPLE_LISTINGS.map((l) => ({ publicId: l.publicId }));
}

export async function generateMetadata({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const l = sampleById.get(publicId);
  if (!l) return {};
  return buildMetadata({
    title: `${l.title} — Used ${l.categoryLabel}`,
    description: `${l.title} in ${CONDITION_LABEL[l.condition]?.toLowerCase() ?? l.condition} condition, ${inr(l.pricePaise)} in ${l.city}. Verified before listing, payment protected until you accept.`,
    path: `/listing/${l.publicId}`,
    keywords: [`used ${l.title}`, `second hand ${l.categoryLabel} india`, `buy used ${l.categoryLabel} bangalore`],
  });
}

/**
 * Listing detail, laid out the way a product page is: a sticky buy bar that
 * appears with the title and price, a hero, then progressively deeper sections —
 * condition, specification, what's included, delivery.
 *
 * The section that does not exist on a normal product page, and is the whole
 * reason to buy here, is the condition report. It sits directly under the hero
 * because it is the thing a used-goods buyer is actually anxious about.
 */
export default async function ListingPage({
  params,
}: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const l = showSamples() ? sampleById.get(publicId) : undefined;
  if (!l) notFound();

  const category = categoryBySlug.get(l.categorySlug);
  const saved = l.wasPaise - l.pricePaise;
  const savedPct = Math.round((saved / l.wasPaise) * 100);
  const protectionPaise = Math.round(l.pricePaise * 0.05) + 2900;
  const related = samplesForCategory(l.categorySlug).filter((r) => r.publicId !== l.publicId).slice(0, 6);

  const CHECKS = [
    { label: "Photographs verified original", detail: "Matched against every image ever uploaded to WorthIt.", ok: true },
    ...(category?.requiresImei
      ? [{ label: "IMEI checked against CEIR", detail: "Not on the Government of India lost or stolen register.", ok: true }]
      : []),
    ...(category?.requiresSerial
      ? [{ label: "Serial number verified", detail: "Matches the device and the photographs supplied.", ok: true }]
      : []),
    { label: "Price checked against market", detail: `${savedPct}% below typical retail, within the normal resale band.`, ok: true },
    { label: "Seller phone verified", detail: "A verified Indian mobile number is required to list.", ok: true },
    { label: "No contact details in listing", detail: "Conversations stay on WorthIt, where payment is protected.", ok: true },
  ];

  return (
    <>
      <JsonLd data={[
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Store", path: "/browse" },
          { name: l.categoryLabel, path: `/browse/${l.categorySlug}` },
          { name: l.title, path: `/listing/${l.publicId}` },
        ]),
        productLd({
          title: l.title,
          description: `${l.title} in ${CONDITION_LABEL[l.condition] ?? l.condition} condition. ${l.note}.`,
          path: `/listing/${l.publicId}`,
          pricePaise: l.pricePaise,
          condition: l.condition,
          brandName: l.specs.Brand,
          available: true,
        }),
      ]} />

      {/* Sticky buy bar */}
      <div className="sticky top-8 z-40 border-b border-black/[0.05] bg-canvas/80 backdrop-blur-2xl backdrop-saturate-[1.8]">
        <div className="mx-auto flex h-11 max-w-[940px] items-center justify-between gap-4 px-5">
          <p className="truncate text-[14px] font-semibold tracking-[-0.015em]">{l.title}</p>
          <div className="flex shrink-0 items-center gap-4">
            <span className="hidden text-[13px] tabular text-ink-2 sm:inline">{inr(l.pricePaise)}</span>
            <a href="#buy" className="a-btn a-btn-fill a-btn-sm">Buy</a>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="band-grey">
        <div className="container-a py-12">
          <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 t-caption text-ink-3">
            <Link href="/" className="hover:text-ink-2">Home</Link><span>/</span>
            <Link href="/browse" className="hover:text-ink-2">Store</Link><span>/</span>
            <Link href={`/browse/${l.categorySlug}`} className="hover:text-ink-2">{l.categoryLabel}</Link>
            <span>/</span><span className="text-ink-2">{l.title}</span>
          </nav>

          <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <ListingImage seed={l.publicId} icon={l.icon} className="!aspect-[4/3]" />
              <div className="mt-4 grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((n) => (
                  <ListingImage key={n} seed={`${l.publicId}-${n}`} icon={l.icon} className="!aspect-square opacity-70" />
                ))}
              </div>
              <p className="t-caption mt-4 text-ink-3">
                Sample listing — real listings carry the seller&apos;s own photographs, taken to the
                standard set out in the category rules.
              </p>
            </div>

            <div id="buy">
              <Eyebrow>{l.categoryLabel}</Eyebrow>
              <h1 className="t-title mt-3 text-balance">{l.title}</h1>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Badge tone="brand">{CONDITION_LABEL[l.condition] ?? l.condition}</Badge>
                <Badge tone="ok">Verified</Badge>
                <Badge tone="plain">Sample</Badge>
              </div>

              <div className="mt-7">
                <p className="text-[40px] font-semibold leading-none tracking-[-0.03em] tabular">
                  {inr(l.pricePaise)}
                </p>
                <p className="t-body mt-2 text-ink-2">
                  <span className="line-through">{inr(l.wasPaise)}</span> new ·{" "}
                  <span className="font-semibold text-ok">You save {inr(saved)} ({savedPct}%)</span>
                </p>
              </div>

              <dl className="mt-7 space-y-2 border-y border-hairline py-5 t-small">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-2">Item price</dt><dd className="tabular">{inr(l.pricePaise)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-2">Buyer protection (5% + ₹29)</dt><dd className="tabular">{inr(protectionPaise)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-2">Delivery in {l.city}</dt><dd className="tabular">₹250</dd>
                </div>
                <div className="flex justify-between gap-4 pt-2 text-[17px] font-semibold">
                  <dt>Total</dt><dd className="tabular">{inr(l.pricePaise + protectionPaise + 25000)}</dd>
                </div>
              </dl>

              <Actions className="mt-7">
                <Button href="/signin?next=/browse">Buy with protection</Button>
                <Button href={`/browse/${l.categorySlug}`} variant="link">See similar</Button>
              </Actions>

              <ul className="mt-8 space-y-2.5 t-small text-ink-2">
                {[
                  "Payment held until you receive it and confirm it matches",
                  "48-hour inspection window after delivery",
                  "Full refund including return shipping if it is not as described",
                  "Insured in transit",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ok" />{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Condition report */}
      <section className="band py-20">
        <div className="container-a">
          <Eyebrow>Condition report</Eyebrow>
          <h2 className="t-headline mt-3 max-w-[18ch] text-balance">
            What we checked before this appeared.
          </h2>
          <p className="t-body mt-5 max-w-2xl text-ink-2">
            {CONDITION_BLURB[l.condition] ?? "Condition as described by the seller and verified against the photographs supplied."}
          </p>

          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {CHECKS.map((c) => (
              <div key={c.label} className="flex gap-4 rounded-[14px] bg-surface p-5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok/15 text-ok">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2.5 6.2l2.3 2.3L9.5 3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{c.label}</h3>
                  <p className="t-small mt-1 text-ink-2">{c.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specifications */}
      <section className="band-grey py-20">
        <div className="container-a grid gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Specification</Eyebrow>
            <h2 className="t-title mt-3">The details.</h2>
            <dl className="mt-8 divide-y divide-hairline border-y border-hairline">
              {Object.entries(l.specs).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 py-3.5">
                  <dt className="t-small text-ink-2">{k}</dt>
                  <dd className="t-small text-right font-medium">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-6 py-3.5">
                <dt className="t-small text-ink-2">Listing reference</dt>
                <dd className="t-small text-right font-medium">{l.publicId}</dd>
              </div>
            </dl>
          </div>

          <div>
            <Eyebrow>In the box</Eyebrow>
            <h2 className="t-title mt-3">What&apos;s included.</h2>
            <ul className="mt-8 space-y-3">
              {["The item as photographed", "Original charger or power supply where applicable", "Any accessories listed in the description", "WorthIt condition report"].map((t) => (
                <li key={t} className="flex gap-3 t-body text-ink-2">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{t}
                </li>
              ))}
            </ul>

            <div className="mt-10 rounded-[14px] bg-canvas p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand">
                  <CategoryIcon name={l.icon} size={20} />
                </span>
                <div>
                  <p className="text-[15px] font-semibold">Verified seller</p>
                  <p className="t-caption text-ink-2">Phone verified · listing in {l.city}</p>
                </div>
              </div>
              <p className="t-small mt-4 text-ink-2">
                Message the seller through WorthIt. Anyone asking you to pay outside the platform is
                a fraud attempt — report it and we will act on the account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="band py-20">
          <div className="container-a">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="t-title">More in {l.categoryLabel}.</h2>
              <Link href={`/browse/${l.categorySlug}`} className="a-link">See all</Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.slice(0, 3).map((r) => (
                <ListingCard key={r.publicId} item={{ ...r, isSample: true }} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
