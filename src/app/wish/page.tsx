import { CATEGORIES } from "@/config/categories";
import { PageHeader, Card, Field, inputClass, Button, Eyebrow } from "@/components/ui";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Wishlist — Tell Us What to Find",
  description: "Nothing live that matches? Describe what you want and get alerted the moment a verified listing appears.",
  path: "/wish",
  keywords: ["wanted ads india", "looking to buy used india", "product alert marketplace india"],
});

export default function WishPage() {
  return (
    <>
      <PageHeader
        eyebrow="Wishlist"
        title="Tell us what you're looking for"
        sub="Nothing live that matches? Describe it and we'll alert you the moment a verified listing appears — and nudge sellers who have one sitting in a drawer."
      />

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <form className="space-y-6">
            <Field label="What are you after?" hint="Be specific — “MacBook Air M2, 16GB, space grey” beats “a laptop”.">
              <input className={inputClass} name="item" placeholder="e.g. ThinkPad X1 Carbon, 16GB RAM" required />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Category">
                <select className={inputClass} name="category" defaultValue="laptops">
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug} className="bg-canvas">{c.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Budget ceiling" hint="We'll only alert you below this.">
                <input className={inputClass} name="budget" inputMode="numeric" placeholder="₹ 60,000" />
              </Field>
            </div>

            <Field label="City" hint="Leave blank to hear about listings anywhere in India.">
              <input className={inputClass} name="city" placeholder="Bengaluru" />
            </Field>

            <Field label="Anything else that matters?">
              <textarea className={`${inputClass} min-h-28 resize-y`} name="notes"
                placeholder="Condition you'd accept, must-have specs, deal-breakers…" />
            </Field>

            <Button type="submit">Create the alert</Button>
            <p className="text-xs leading-relaxed text-ink-3">
              Saving wishlists needs an account and a connected database — this form is the design,
              wired up in the next build phase.
            </p>
          </form>
        </Card>

        <div className="space-y-4">
          {[
            { t: "We only alert on verified listings", b: "You'll never get a notification for something still sitting in the review queue, or for a listing that failed its checks." },
            { t: "Sellers see demand, not your details", b: "A seller with a matching item sees that people are looking. They don't see who you are or what you'd pay." },
            { t: "It shapes what we go and find", b: "Repeated wishes for the same model tell us which corporate lots to chase. Demand here becomes supply later." },
          ].map((x) => (
            <Card key={x.t}>
              <Eyebrow>Why bother</Eyebrow>
              <h3 className="mt-3 text-base font-semibold tracking-[-0.01em]">{x.t}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-2">{x.b}</p>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
