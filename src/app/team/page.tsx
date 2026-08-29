import { brand } from "@/config/brand";
import { PageHeader, Card, Button, Eyebrow } from "@/components/ui";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Team & Careers at WorthIt",
  description: "A deliberately small team building verification software for India's used-goods market. Open roles in engineering, trust and safety, and corporate supply.",
  path: "/team",
  keywords: ["worthit careers", "startup jobs bangalore", "trust and safety jobs india", "marketplace engineering jobs india"],
});

const ROLES = [
  { t: "Founding engineer — verification", b: "You'd own the diagnostic engine: reading battery cycles, SMART data and thermals across Windows, macOS and Android, and turning that into a condition report we're willing to guarantee." },
  { t: "Trust & safety lead", b: "You'd run the review queue, tune the automated rules, and own the number that matters most — how often we wrongly reject an honest seller." },
  { t: "Supply lead — corporate & ITAD", b: "You'd open the corporate hardware channel: IT asset managers, refurbishers and disposal firms who currently sell to scrap brokers for a fraction of value." },
];

export default function TeamPage() {
  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="Small, and hiring for the hard parts"
        sub={`${brand.name} is built inside ${brand.legalName}. The team is deliberately small — the leverage here is software, not headcount.`}
      />

      <div className="mx-auto max-w-6xl px-6 py-16">
        <Card>
          <Eyebrow>Leadership</Eyebrow>
          <h2 className="mt-4 text-xl font-semibold tracking-[-0.02em]">Harsimran Kaur — Founder</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
            Founder and CEO of {brand.legalName}, which builds software across digital marketing,
            web and app development, and IT consulting. {brand.name} is the company&apos;s first
            consumer marketplace.
          </p>
        </Card>

        <section className="mt-16">
          <Eyebrow>Open roles</Eyebrow>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Three people we&apos;re looking for</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {ROLES.map((r) => (
              <Card key={r.t} hover className="flex h-full flex-col">
                <h3 className="text-base font-semibold leading-snug tracking-[-0.01em]">{r.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">{r.b}</p>
              </Card>
            ))}
          </div>
          <div className="mt-10">
            <Button href={`mailto:${brand.supportEmail}?subject=Working%20at%20${brand.name}`}>
              Write to us
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
