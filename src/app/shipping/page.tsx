import { PageHeader, Card, Eyebrow } from "@/components/ui";
import { Prose } from "@/components/prose";

export const metadata = { title: "Shipping & delivery" };

const STEPS = [
  { n: "01", t: "Seller books a pickup", b: "Once a buyer pays, the seller gets a prepaid label and a pickup slot. Within Bengaluru that is usually same or next day." },
  { n: "02", t: "In transit, insured", b: "Every shipment is insured for the sale value while it is with the courier. You can track it from your orders page." },
  { n: "03", t: "You inspect it", b: "You have an inspection window after delivery to check the item against the listing before the payment is released to the seller." },
  { n: "04", t: "Payment releases", b: "Confirm it matches and the seller is paid. Say it does not and the payment stays held while we look at it." },
];

export default function ShippingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Shipping & delivery"
        title="How things get from them to you"
        sub="We don't hold stock, so nothing ships from a warehouse. The seller ships directly, on a label we provide, with the payment held until you've checked it."
      />

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <Card key={s.n} hover className="flex h-full flex-col">
              <span className="font-mono text-xs text-violet-300">{s.n}</span>
              <h2 className="mt-4 text-base font-semibold tracking-[-0.01em]">{s.t}</h2>
              <p className="mt-2.5 text-sm leading-relaxed text-text-muted">{s.b}</p>
            </Card>
          ))}
        </div>

        <div className="mt-16">
          <Eyebrow>The details</Eyebrow>
          <Prose>
            <h2>Where we deliver</h2>
            <p>
              WorthIt is in early access in Bengaluru. Sellers and buyers must both be within the
              serviceable area for a protected transaction. We will open other cities once listings
              here reliably sell.
            </p>

            <h2>What it costs</h2>
            <p>
              Shipping is quoted at checkout based on the item&apos;s size and distance. For local
              Bengaluru deliveries it is usually a couple of hundred rupees. Large items — furniture
              and appliances — are quoted separately because they need a different vehicle.
            </p>

            <h2>Local handover</h2>
            <p>
              For heavy or awkward items, buyer and seller can agree a handover instead of shipping.
              The payment still runs through WorthIt and is still held until you confirm — a handover
              changes the logistics, not the protection. Paying cash at a handover puts you outside
              everything we can do for you.
            </p>

            <h2>If something arrives damaged</h2>
            <p>
              Photograph it before you accept it if you can, and raise it within the inspection
              window. Shipments are insured in transit, so a courier-damaged item is not your loss
              and not the seller&apos;s.
            </p>

            <h2>Returns</h2>
            <p>
              Used goods are sold as described rather than on approval, so there is no
              change-of-mind return. What you do have is the inspection window: if the item does not
              match its listing or its condition report, you are refunded in full, including return
              shipping.
            </p>
          </Prose>
        </div>
      </div>
    </>
  );
}
