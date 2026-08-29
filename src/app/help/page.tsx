import Link from "next/link";
import { brand } from "@/config/brand";
import { PageHeader, Card, Button, Eyebrow } from "@/components/ui";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Help Centre — Buying, Selling & Safety",
  description: "How buyer protection works, why listings get rejected, what to do if someone asks you to pay off-platform, and everything else people actually ask.",
  path: "/help",
  keywords: ["marketplace help india", "is it safe to buy used online", "online marketplace scams india", "buyer protection india"],
});

const GROUPS = [
  {
    heading: "Buying",
    faqs: [
      { q: "How do I know a listing is genuine?", a: "Every listing you can see has already passed eleven automated checks. Photos were fingerprinted against every image ever uploaded here, the price was compared against real market data, and for phones the IMEI was checked against the government's stolen-device register. Anything that failed never appeared." },
      { q: "Is my payment protected?", a: "Payment is held until the item reaches you and you have had a chance to check it. If it does not match the listing, you are refunded. This is why we ask you to keep the conversation on WorthIt — a cash meetup has none of this." },
      { q: "Can I inspect before paying?", a: "Yes. You get an inspection window after delivery. If the item is not as described, say so within that window and the payment is returned rather than released to the seller." },
    ],
  },
  {
    heading: "Selling",
    faqs: [
      { q: "What does it cost to sell?", a: "Nothing. No listing fee and no commission from your payout. Buyers pay a small protection fee instead, which funds the verification that makes your listing credible." },
      { q: "Why was my listing rejected?", a: "The rejection message names what to fix. The most common reasons are a photo that has been used before, a phone number in the description, missing required details, or a price far below what the item actually sells for." },
      { q: "How long does review take?", a: "Most listings are decided in under ten seconds. Those the automation cannot decide go to a person, sorted by priority rather than arrival — typically a few hours." },
      { q: "Why do you need my IMEI?", a: "To check it against the Government of India's CEIR register, which lists devices reported lost or stolen. Dial *#06# to see it. We store it hashed and only ever display the last four digits." },
    ],
  },
  {
    heading: "Trust & safety",
    faqs: [
      { q: "Someone asked me to pay outside WorthIt. What do I do?", a: "Do not. It is the single most common way people are defrauded on classifieds in India, and nothing that happens off-platform can be protected or refunded. Report the conversation and we will act on the account." },
      { q: "What can't be sold here?", a: "Weapons, controlled substances, prescription medicines, identity documents, wildlife products, counterfeit goods, SIM cards, and gambling-related items. These are screened automatically." },
      { q: "How do you stop fake accounts?", a: "Every seller verifies an Indian mobile number, and higher-value categories require ID verification above a threshold. Listing velocity is capped by how much history an account has." },
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHeader
        eyebrow="Help centre"
        title="Questions people actually ask"
        sub="If none of this covers it, write to us — a person reads every message."
      />

      <div className="container-a py-16">
        <div className="space-y-16">
          {GROUPS.map((g) => (
            <section key={g.heading}>
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">{g.heading}</h2>
              <div className="mt-6 space-y-3">
                {g.faqs.map((f) => (
                  <details key={f.q} className="tile group rounded-[18px] px-6 py-5">
                    <summary className="cursor-pointer list-none text-[15px] font-semibold tracking-[-0.01em] marker:hidden">
                      <span className="flex items-start justify-between gap-4">
                        {f.q}
                        <span className="mt-1 shrink-0 text-brand transition-transform group-open:rotate-45">+</span>
                      </span>
                    </summary>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-2">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <Card className="mt-16">
          <Eyebrow>Still stuck</Eyebrow>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">Talk to a person</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-2">
            Email {brand.supportEmail} or use the contact form. If it is about a specific listing or
            order, include the reference and we will have the full history in front of us.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/contact">Contact us</Button>
            <Link href="/shipping" className="tile rounded-full px-5 py-2.5 text-sm font-semibold">
              Shipping & delivery
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
