import { brand } from "@/config/brand";
import { PageHeader, Card } from "@/components/ui";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Follow WorthIt",
  description: "Where we publish what we block — monthly numbers on listings rejected, scams stopped, and stolen devices caught.",
  path: "/socials",
  keywords: ["worthit instagram", "worthit linkedin", "marketplace transparency india"],
});

const BLURBS: Record<string, string> = {
  instagram: "Listings worth a second look, and the occasional look inside the review queue.",
  linkedin: "Corporate hardware disposal, ITAD partnerships, and what we're learning building this.",
  x: "Short updates, scam patterns we're blocking, and product changes as they ship.",
  youtube: "How the verification works, and walkthroughs of buying used without getting burned.",
};

export default function SocialsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Socials"
        title="Where else to find us"
        sub="We publish what we block. Every month we post how many listings failed which check — it's the cheapest honest signal we can give you."
      />

      <div className="container-a py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(brand.socials).map(([key, url]) => (
            <a key={key} href={url} target="_blank" rel="noreferrer noopener">
              <Card hover className="flex h-full flex-col">
                <h2 className="text-lg font-semibold capitalize tracking-[-0.02em]">{key}</h2>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-2">{BLURBS[key]}</p>
                <p className="mt-auto pt-6 text-xs text-brand">{url.replace("https://", "")} →</p>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
