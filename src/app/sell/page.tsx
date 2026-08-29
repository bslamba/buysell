import { requireUser } from "@/lib/auth/guards";
import { CATEGORIES } from "@/config/categories";
import { PageHeader, Card, Button, Badge, Eyebrow } from "@/components/ui";

export const metadata = { title: "Sell" };
export const dynamic = "force-dynamic";

const RULES = [
  { title: "Photograph the actual item", body: "Not a catalogue picture, not a screenshot, not the seller's photo from the listing you saw last week. We fingerprint every image against everything ever uploaded here, so borrowed photos are rejected automatically." },
  { title: "Leave your number out of it", body: "Buyers reach you through WorthIt chat. A number in the description — however it's spelled out — stops the listing going live, because moving off-platform is exactly how people get defrauded." },
  { title: "Price it honestly", body: "We compare against what comparable items actually sold for. Wildly under market reads as bait and gets blocked; wildly over just means it sits unsold." },
  { title: "Have the IMEI or serial ready", body: "Phones need an IMEI, which we check against the government's stolen-device register. Dial *#06# to see it. Laptops and cameras need the serial." },
];

export default async function SellPage() {
  const user = await requireUser("/sell");
  const needsPhone = !user.phoneVerified;

  return (
    <>
      <PageHeader
        eyebrow="Sell"
        title="List it once. We do the convincing."
        sub="Selling is free — no listing fee, no commission taken from your payout. Buyers pay a small protection fee, which is what funds the checks that make your listing worth trusting."
      />

      <div className="mx-auto max-w-6xl px-6 py-16">
        {needsPhone ? (
          <Card className="mb-12">
            <Badge tone="warn">Verify your phone first</Badge>
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.02em]">One step before you can list</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-muted">
              A verified Indian mobile number is what stops one person running ten seller accounts.
              Buyers never see it.
            </p>
            <div className="mt-6"><Button href="/verify-phone?next=/sell">Verify my number</Button></div>
          </Card>
        ) : (
          <Card className="mb-12">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <Badge tone="ok">Ready to list</Badge>
                <h2 className="mt-4 text-xl font-semibold tracking-[-0.02em]">Create a listing</h2>
                <p className="mt-2 text-sm text-text-muted">Takes about three minutes.</p>
              </div>
              <Button href="/sell/new">Start a listing</Button>
            </div>
          </Card>
        )}

        <section>
          <Eyebrow>Before you start</Eyebrow>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Four things that decide whether it goes live</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {RULES.map((r) => (
              <Card key={r.title} hover>
                <h3 className="text-base font-semibold tracking-[-0.01em]">{r.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">{r.body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <Eyebrow>Pick a category</Eyebrow>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">What are you selling?</h2>
          <div className="mt-8 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <a key={c.slug} href={`/sell/new?category=${c.slug}`}
                className="glass glass-hover rounded-full px-4 py-2.5 text-sm font-medium">
                {c.label}
              </a>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
