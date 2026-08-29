import { brand } from "@/config/brand";
import { CATEGORIES } from "@/config/categories";
import { Button, Card, Badge } from "@/components/ui";

const TRUST_POINTS = [
  { title: "Photos are fingerprinted", body: "Every image is matched against every photo ever uploaded here. Lifting someone else's pictures does not get past the door." },
  { title: "IMEIs are checked against CEIR", body: "Phones are looked up in the Government of India's stolen-and-blocked device register before the listing can go live." },
  { title: "Prices are sanity-checked", body: "A device priced far below its real market value is the oldest trick there is. We know what things actually sell for." },
  { title: "Contact details stay off listings", body: "Numbers hidden in descriptions get stripped. Talk here, and your payment stays protected." },
];

export default function HomePage() {
  const certified = CATEGORIES.filter((c) => c.tier === "certified");
  return (
    <div className="mx-auto max-w-6xl px-5">
      <section className="py-20">
        <Badge tone="good">Bengaluru · now in early access</Badge>
        <h1 className="mt-5 max-w-3xl text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Buy used without the guesswork.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-500">
          {brand.description} No inventory, no middleman markup — just proof that what
          you are looking at is real.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/browse">Browse listings</Button>
          <Button href="/sell" variant="secondary">Sell something</Button>
        </div>
      </section>

      <section className="border-t border-ink-200 py-16 dark:border-ink-700">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-500">
          What happens before a listing appears
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {TRUST_POINTS.map((p) => (
            <Card key={p.title}>
              <h3 className="text-base font-bold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{p.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-ink-200 py-16 dark:border-ink-700">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-500">
          Fully certified categories
        </h2>
        <p className="mt-3 max-w-xl text-sm text-ink-500">
          These can be checked by software running on the device itself, so they carry a
          full condition report. Everything else on {brand.name} still passes photo,
          price and seller checks.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {certified.map((c) => (
            <span key={c.slug} className="rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-sm font-medium dark:border-ink-700 dark:bg-ink-900">
              {c.label}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
