import { brand } from "@/config/brand";
import { PageHeader, Card } from "@/components/ui";
import { Prose } from "@/components/prose";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: "What we collect, how device identifiers and image fingerprints are stored, who we share data with, and your rights under Indian law.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy policy" sub="Last updated 29 August 2026." />

      <div className="mx-auto max-w-6xl px-6 py-16">
        <Card className="mb-12 border-warn/25">
          <p className="text-sm leading-relaxed text-text-muted">
            <strong className="font-semibold text-warn">Draft — not yet reviewed by counsel.</strong>{" "}
            This describes how the product is built to handle data. It must be reviewed against the
            Digital Personal Data Protection Act, 2023 before {brand.name} handles real user data at
            scale.
          </p>
        </Card>

        <Prose>
          <h2>What we collect</h2>
          <ul>
            <li><strong>Your account:</strong> mobile number, and email and name if you sign in with Google.</li>
            <li><strong>Your listings:</strong> photographs, descriptions, prices, and the city you sell from.</li>
            <li><strong>Device identifiers:</strong> IMEIs and serial numbers of items you list.</li>
            <li><strong>Transactions:</strong> orders, payment references and delivery addresses.</li>
            <li><strong>Messages:</strong> conversations between buyers and sellers on the platform.</li>
            <li><strong>Technical data:</strong> IP address and device information, used for rate limiting and fraud prevention.</li>
          </ul>

          <h2>How device identifiers are stored</h2>
          <p>
            IMEIs and serial numbers are stored as a <strong>salted one-way hash</strong>, never in
            readable form. Only the last four digits are ever displayed. This lets us detect the same
            device being listed twice and check it against the government&apos;s stolen-device
            register, while making a database leak useless as a device registry.
          </p>

          <h2>Photographs</h2>
          <p>
            Every uploaded image is fingerprinted — a cryptographic hash plus two perceptual hashes.
            <strong> These fingerprints outlive the listing.</strong> If you delete a listing, its
            images are removed, but the fingerprints are retained so the same photographs cannot be
            re-used by someone else to sell something they do not have. Fingerprints cannot be turned
            back into an image.
          </p>

          <h2>Why we process it</h2>
          <ul>
            <li>To run the marketplace and complete transactions you ask for.</li>
            <li>To verify listings and prevent fraud, stolen goods and counterfeits.</li>
            <li>To meet legal obligations, including intermediary due diligence and tax records.</li>
            <li>To improve pricing accuracy, using aggregated and de-identified transaction data.</li>
          </ul>

          <h2>Who we share it with</h2>
          <p>
            Payment and escrow partners, delivery partners, SMS and email providers, cloud
            infrastructure providers, and law-enforcement or regulators where legally required.
            <strong> We do not sell your personal data, and we do not share your phone number with
            other users.</strong>
          </p>
          <p>
            To check whether a phone is reported stolen, we submit its IMEI to the Government of
            India&apos;s CEIR service. No other personal data accompanies that lookup.
          </p>

          <h2>How long we keep it</h2>
          <p>
            Account and transaction records are kept while your account is open and afterwards for as
            long as tax and legal obligations require. Image fingerprints and hashed device
            identifiers are kept indefinitely, because their whole purpose is to detect re-use over
            time. Messages are retained for dispute resolution.
          </p>

          <h2>Your rights</h2>
          <p>
            You can ask to access, correct or delete your personal data, or to close your account,
            by writing to {brand.supportEmail}. Some records must be kept for legal reasons even
            after closure, and hashed identifiers and image fingerprints — which cannot identify you
            on their own — are retained for platform integrity.
          </p>

          <h2>Security</h2>
          <p>
            Data is encrypted in transit and at rest. Access is restricted to staff who need it and
            every administrative action is logged. One-time passcodes are stored hashed, never in
            plain text.
          </p>

          <h2>Children</h2>
          <p>{brand.name} is not for anyone under 18 and we do not knowingly collect their data.</p>

          <h2>Contact</h2>
          <p>Privacy questions or requests: {brand.supportEmail}.</p>
        </Prose>
      </div>
    </>
  );
}
