import Link from "next/link";
import { brand } from "@/config/brand";
import { CATEGORIES, RAIL_CATEGORIES, GROUP_ORDER, GROUP_LABELS, categoriesByGroup } from "@/config/categories";
import { Button, Actions, Eyebrow } from "@/components/ui";
import { CategoryIcon } from "@/components/icons";
import { LogoMark } from "@/components/logo";
import { Shelf } from "@/components/shelf";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, faqLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

const FAQS = [
  { q: "Is it safe to buy used products online in India?", a: "It is when the listing has been verified. On WorthIt every listing passes eleven automated checks before it appears — photographs are fingerprinted against every image ever uploaded, phone IMEIs are checked against the Government of India's CEIR stolen-device register, and prices are compared against real market data. Your payment is then held until the item arrives and you confirm it matches." },
  { q: "What does it cost to sell on WorthIt?", a: "Nothing. There is no listing fee and no commission taken from your payout. Buyers pay a small protection fee at checkout, which is what funds the verification." },
  { q: "How do I know a used phone is not stolen?", a: "Every phone listed on WorthIt has its IMEI checked against the CEIR register maintained by India's Department of Telecommunications before the listing goes live. A device reported lost or stolen is rejected automatically and never reaches a buyer." },
  { q: "Which cities does WorthIt cover?", a: "WorthIt is in early access in Bengaluru. We are deliberately saturating one city before opening others, because a marketplace is only useful when things actually sell." },
  { q: "Can businesses sell on WorthIt?", a: "Yes. Companies, dealers, refurbishers and IT asset disposal firms can register a corporate account and run bulk lot auctions, with a serial manifest and certified data wipe. Retail buyers can take single pieces from a bulk lot where the seller allows it." },
];

const CHECKS = [
  { t: "Photos can't be borrowed", b: "Every image is fingerprinted and matched against every photo ever uploaded here — including ones from deleted listings. Resize it, crop it, brighten it: still caught." },
  { t: "Stolen phones don't get listed", b: "Every IMEI is checked against the Government of India's CEIR register before the listing goes live. No other marketplace here does this at listing time." },
  { t: "Too good to be true is a red flag", b: "A device priced far under its real market value is the oldest trick in classifieds. We know what things actually sell for, so bait listings never appear." },
  { t: "Your number stays yours", b: "Phone numbers hidden in descriptions get stripped, however cleverly they're spelled out. Conversations stay here, where your payment is protected." },
];

export default function HomePage() {
  const certified = CATEGORIES.filter((c) => c.tier === "certified");

  return (
    <>
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }]), faqLd(FAQS)]} />

      {/* ── Hero: mark, name, one plain description, two links ───────────── */}
      <section className="band">
        <div className="container-a py-20 text-center sm:py-28">
          <div className="flex justify-center">
            <LogoMark size={84} />
          </div>
          <h1 className="t-hero mt-8 text-balance">{brand.name}</h1>
          <p className="t-subhead mx-auto mt-4 max-w-[620px] text-balance text-ink-2">
            Buy and sell used things in India without the guesswork. Every listing is
            machine-checked before it goes live, and your payment is held until you say
            the item is right.
          </p>
          <Actions className="mt-8 justify-center">
            <Button href="/browse">Shop the store</Button>
            <Button href="/sell" variant="link">Sell an item</Button>
          </Actions>
        </div>
      </section>

      {/* ── Full-bleed dark band: the proposition ────────────────────────── */}
      <section className="band-deep on-deep">
        <div className="container-a py-24 text-center sm:py-32">
          <Eyebrow className="!text-brand-300">Verified before it appears</Eyebrow>
          <h2 className="t-headline mx-auto mt-4 max-w-[15ch] text-balance">
            Eleven checks. Before anyone sees it.
          </h2>
          <p className="t-subhead mx-auto mt-5 max-w-[600px] text-balance text-white/70">
            Other marketplaces moderate what gets reported. We check everything up front —
            and what reaches a human is only what the machine genuinely could not decide.
          </p>
          <Actions className="mt-9 justify-center">
            <Button href="/browse">Browse verified listings</Button>
            <Button href="/help" variant="link">How verification works</Button>
          </Actions>

          <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-10 sm:grid-cols-3">
            {[
              { v: "11", k: "automated checks on every listing" },
              { v: "< 10s", k: "typical time from submit to live" },
              { v: "0", k: "items we hold — no inventory, no markup" },
            ].map((s) => (
              <div key={s.k}>
                <dt className="t-hero !text-[52px] leading-none tabular">{s.v}</dt>
                <dd className="t-small mt-3 text-white/60">{s.k}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Category shelf: left-to-right, Apple Store behaviour ─────────── */}
      <section className="band-grey">
        <Shelf
          title="Shop by category"
          subtitle="Twenty categories, each with its own verification rules."
          seeAll={{ href: "/categories", label: "See all categories" }}
        >
          {RAIL_CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/browse/${c.slug}`} className="tile w-[236px] p-7">
              <span className="text-brand"><CategoryIcon name={c.icon} size={28} /></span>
              <h3 className="mt-6 text-[21px] font-semibold leading-tight tracking-[-0.015em]">{c.label}</h3>
              <p className="t-small mt-2 text-ink-2">{c.blurb}</p>
              <span className="a-link mt-6 !text-[14px]">Shop</span>
            </Link>
          ))}
        </Shelf>
      </section>

      {/* ── Two-up grid of the checks ────────────────────────────────────── */}
      <section className="band py-20">
        <div className="container-a">
          <h2 className="t-headline max-w-[16ch] text-balance">Why a listing here is worth trusting.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {CHECKS.map((c) => (
              <div key={c.t} className="band-grey rounded-[18px] p-9">
                <h3 className="t-title text-balance">{c.t}</h3>
                <p className="t-body mt-4 text-ink-2">{c.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Certified categories shelf ───────────────────────────────────── */}
      <section className="band-grey">
        <Shelf
          title="Fully certified categories"
          subtitle="Software reads the device itself, so these carry a complete condition report."
          seeAll={{ href: "/categories", label: "How verification tiers work" }}
        >
          {certified.map((c) => (
            <Link key={c.slug} href={`/browse/${c.slug}`}
              className="tile flex w-[300px] flex-col justify-between p-8">
              <div>
                <Eyebrow>Certified</Eyebrow>
                <h3 className="t-title mt-3">{c.label}</h3>
                <p className="t-small mt-3 text-ink-2">{c.seo.description}</p>
              </div>
              <span className="a-link mt-7 !text-[14px]">Shop {c.label}</span>
            </Link>
          ))}
        </Shelf>
      </section>

      {/* ── Full-bleed: business ─────────────────────────────────────────── */}
      <section className="band py-20">
        <div className="container-a">
          <div className="grid items-center gap-12 rounded-[22px] bg-surface p-10 lg:grid-cols-2 lg:p-16">
            <div>
              <Eyebrow>For businesses</Eyebrow>
              <h2 className="t-headline mt-4 text-balance">Retiring 500 laptops? Auction them.</h2>
              <p className="t-body mt-5 max-w-md text-ink-2">
                Companies, dealers and IT asset disposal firms list bulk lots with a serial
                manifest and certified data wipe. Dealers bid for the whole lot while retail
                buyers take single pieces — one listing, both kinds of demand.
              </p>
              <Actions className="mt-8">
                <Button href="/sell/business">Business selling</Button>
                <Button href="/auctions" variant="link">See live auctions</Button>
              </Actions>
            </div>
            <ul className="space-y-4">
              {[
                "Sealed-lot auctions with proxy bidding and anti-sniping",
                "Single-piece purchase from any bulk lot you allow",
                "Serial manifests and grade mix published up front",
                "Data-wipe certificates for compliance sign-off",
                "GSTIN verified before auctions are enabled",
              ].map((t) => (
                <li key={t} className="flex gap-3 t-body text-ink-2">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Full category directory, grouped ─────────────────────────────── */}
      <section className="band-grey py-20">
        <div className="container-a">
          <h2 className="t-headline text-balance">Everything you can buy and sell.</h2>
          <div className="mt-12 space-y-10">
            {GROUP_ORDER.map((g) => {
              const items = categoriesByGroup(g);
              if (items.length === 0) return null;
              return (
                <div key={g}>
                  <h3 className="t-eyebrow text-ink-3">{GROUP_LABELS[g]}</h3>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {items.map((c) => (
                      <Link key={c.slug} href={`/browse/${c.slug}`}
                        className="tile flex items-center gap-2.5 rounded-full px-5 py-3">
                        <span className="text-brand"><CategoryIcon name={c.icon} size={17} /></span>
                        <span className="t-small font-medium">{c.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Two-up: sell / wishlist ──────────────────────────────────────── */}
      <section className="band py-20">
        <div className="container-a grid gap-5 md:grid-cols-2">
          {[
            { e: "Selling", t: "Free to list. No commission.", b: "You keep the full price you agreed. Buyers pay a protection fee instead — which is what makes your listing worth trusting in the first place.", cta: "/sell", label: "Start selling", link: "/sell/fees", linkLabel: "See the fees" },
            { e: "Wishlist", t: "Tell us what to find.", b: "Nothing live that matches? Describe it and we'll alert you the moment a verified listing appears — and nudge sellers who have one in a drawer.", cta: "/wish", label: "Create an alert", link: "/browse", linkLabel: "Browse instead" },
          ].map((c) => (
            <div key={c.t} className="band-grey rounded-[18px] p-10 text-center">
              <Eyebrow>{c.e}</Eyebrow>
              <h2 className="t-title mt-3 text-balance">{c.t}</h2>
              <p className="t-body mx-auto mt-4 max-w-sm text-ink-2">{c.b}</p>
              <Actions className="mt-7 justify-center">
                <Button href={c.cta}>{c.label}</Button>
                <Button href={c.link} variant="link">{c.linkLabel}</Button>
              </Actions>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="band-grey py-20">
        <div className="container-a max-w-[820px]">
          <h2 className="t-headline text-balance">Questions people ask first.</h2>
          <div className="mt-10 divide-y divide-hairline border-y border-hairline">
            {FAQS.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 marker:hidden">
                  <h3 className="t-lead font-medium">{f.q}</h3>
                  <span className="mt-1 shrink-0 text-brand transition-transform group-open:rotate-45">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="t-body mt-4 max-w-2xl text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
