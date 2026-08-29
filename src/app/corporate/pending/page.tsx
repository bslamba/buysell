import { Button } from "@/components/ui";

export const metadata = { title: "Verification pending" };

export default function CorporatePendingPage() {
  return (
    <div className="mx-auto max-w-md px-5 py-32 text-center">
      <h1 className="text-2xl font-bold tracking-tight">We&apos;re verifying your company</h1>
      <p className="mt-3 text-sm text-ink-500">
        A Pakka administrator is checking your GSTIN and incorporation details. This
        usually takes one working day. We&apos;ll email you as soon as it&apos;s done.
      </p>
      <div className="mt-8 flex justify-center"><Button href="/corporate">Back to accounts</Button></div>
    </div>
  );
}
