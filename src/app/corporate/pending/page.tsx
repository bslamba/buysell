import { Button, Card, Eyebrow } from "@/components/ui";

export const metadata = { title: "Verification pending", robots: { index: false, follow: false } };

export default function CorporatePendingPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-32">
      <Card className="text-center">
        <Eyebrow>In review</Eyebrow>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
          We&apos;re verifying your company
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-2">
          An administrator is checking your GSTIN and incorporation details. This usually takes one
          working day, and we&apos;ll email you as soon as it&apos;s done.
        </p>
        <div className="mt-8 flex justify-center"><Button href="/corporate">Back to accounts</Button></div>
      </Card>
    </div>
  );
}
