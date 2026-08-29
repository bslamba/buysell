import { brand } from "@/config/brand";
import { PageHeader, Card, Field, inputClass, Button, Eyebrow } from "@/components/ui";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact WorthIt",
  description: "Support for a listing, order or account, plus partnership enquiries for corporate hardware disposal and ITAD.",
  path: "/contact",
  keywords: ["contact worthit", "marketplace support india", "itad partnership india"],
});

const CHANNELS = [
  { t: "Support", b: "Anything about a listing, an order or your account.", v: brand.supportEmail },
  { t: "Corporate & ITAD", b: "Retiring hardware, bulk lots, auction access.", v: `partners@${brand.domain}` },
  { t: "Press", b: "Interviews, data on the used-goods market in India.", v: `press@${brand.domain}` },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        sub="A person reads every message. If it concerns a specific listing or order, include the reference so we can pull the history."
      />

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <form className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Your name"><input className={inputClass} name="name" required /></Field>
              <Field label="Email"><input className={inputClass} type="email" name="email" required /></Field>
            </div>
            <Field label="What's this about?">
              <select className={inputClass} name="topic" defaultValue="support">
                <option value="support" className="bg-canvas">A listing, order or my account</option>
                <option value="corporate" className="bg-canvas">Corporate hardware / auctions</option>
                <option value="safety" className="bg-canvas">Reporting something unsafe</option>
                <option value="press" className="bg-canvas">Press</option>
                <option value="other" className="bg-canvas">Something else</option>
              </select>
            </Field>
            <Field label="Reference" hint="Listing or order ID, if you have one.">
              <input className={inputClass} name="ref" placeholder="e.g. WI-4K92MX" />
            </Field>
            <Field label="Message">
              <textarea className={`${inputClass} min-h-36 resize-y`} name="message" required />
            </Field>
            <Button type="submit">Send message</Button>
            <p className="text-xs leading-relaxed text-ink-3">
              This form is the design; message delivery is wired up in the next build phase. In the
              meantime email {brand.supportEmail} directly.
            </p>
          </form>
        </Card>

        <div className="space-y-4">
          {CHANNELS.map((c) => (
            <Card key={c.t}>
              <Eyebrow>{c.t}</Eyebrow>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{c.b}</p>
              <p className="mt-3 text-sm font-medium text-brand">{c.v}</p>
            </Card>
          ))}
          <Card>
            <Eyebrow>Registered office</Eyebrow>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">
              {brand.legalName}<br />Bengaluru, Karnataka, India
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
