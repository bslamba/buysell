import { brand } from "@/config/brand";
import { PageHeader, Card } from "@/components/ui";
import { Prose } from "@/components/prose";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of Use",
  description: "The terms governing use of WorthIt as a marketplace intermediary, including listing rules, fees, payment protection and liability.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of use" sub="Last updated 29 August 2026." />

      <div className="container-a py-16">
        <Card className="mb-12 border-warn/25">
          <p className="text-sm leading-relaxed text-ink-2">
            <strong className="font-semibold text-warn">Draft — not yet reviewed by counsel.</strong>{" "}
            This sets out the intended terms so the product can be built around them. It must be
            reviewed by a qualified lawyer before {brand.name} accepts a real transaction.
          </p>
        </Card>

        <Prose>
          <h2>1. Who we are</h2>
          <p>
            {brand.name} is operated by {brand.legalName}, a company registered in Bengaluru, India
            (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By using the platform you agree to these terms.
          </p>

          <h2>2. What {brand.name} is — and is not</h2>
          <p>
            {brand.name} is an <strong>intermediary marketplace</strong>. We connect buyers and
            sellers, verify listings, and hold payment until a transaction completes. We do not own,
            take possession of, inspect physically, import, or sell any item listed here. The
            contract of sale is between the buyer and the seller.
          </p>
          <p>
            We are an intermediary for the purposes of the Information Technology Act, 2000 and the
            rules made under it, and we observe the due diligence those rules require.
          </p>

          <h2>3. Eligibility</h2>
          <ul>
            <li>You must be at least 18 years old and able to enter a contract under Indian law.</li>
            <li>You must verify an Indian mobile number before listing anything.</li>
            <li>Some categories require identity verification above a stated value.</li>
            <li>One person may hold one account. Multiple accounts may be suspended without notice.</li>
          </ul>

          <h2>4. Listing rules</h2>
          <p>By listing an item you confirm that you own it and are entitled to sell it, that your
            photographs are of that specific item and taken by you, that your description is accurate,
            and that the item is not stolen, counterfeit or prohibited.</p>
          <p>
            Listings are checked automatically before publication. We may reject, suspend or remove
            any listing, and may refuse service, at our discretion. Prohibited items include weapons
            and ammunition, controlled substances, prescription medicines, identity documents,
            wildlife products, counterfeit goods, SIM cards and gambling-related items.
          </p>

          <h2>5. Fees</h2>
          <p>
            Listing and selling are free. Buyers pay a protection fee shown before payment. Optional
            services — promoted placement, extended certification — are priced at the point of use.
            We may change fees on notice; changes never apply to a transaction already begun.
          </p>

          <h2>6. Payments and protection</h2>
          <p>
            Payments are processed by a licensed payment partner and held until the buyer accepts the
            item or the inspection window closes. <strong>{brand.name} does not hold customer funds
            in its own accounts.</strong> Protection applies only to payments made through the
            platform. Anything settled in cash or by direct transfer sits outside it entirely.
          </p>

          <h2>7. Going off-platform</h2>
          <p>
            Sharing contact details in listings or messages to move a transaction off {brand.name} is
            a breach of these terms. It is the most common route to fraud in Indian classifieds, and
            it removes every protection we offer. Accounts that do it repeatedly are suspended.
          </p>

          <h2>8. Verification and condition reports</h2>
          <p>
            Our checks are thorough but not infallible. A condition report describes an item at the
            time it was generated, on the information the device and the seller provided. Where a
            report is materially wrong and the item was bought through the platform, the buyer
            protection remedy applies. Verification is not a warranty of future performance.
          </p>

          <h2>9. Liability</h2>
          <p>
            To the extent Indian law permits, our liability for any transaction is limited to the
            amount paid through the platform for that transaction. We are not liable for indirect or
            consequential loss. Nothing here limits liability that cannot lawfully be limited.
          </p>

          <h2>10. Suspension</h2>
          <p>
            We may suspend or close an account for breach of these terms, fraud or suspected fraud,
            listing stolen or counterfeit goods, abuse of other users or of our staff, or repeated
            attempts to transact off-platform.
          </p>

          <h2>11. Governing law</h2>
          <p>
            These terms are governed by the laws of India. The courts at Bengaluru, Karnataka have
            exclusive jurisdiction.
          </p>

          <h2>12. Contact</h2>
          <p>Questions about these terms: {brand.supportEmail}.</p>
        </Prose>
      </div>
    </>
  );
}
