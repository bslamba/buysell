import { requireUser } from "@/lib/auth/guards";
import { Card, Eyebrow } from "@/components/ui";
import { SignInForm } from "../signin/signin-form";

export const metadata = { title: "Verify your phone" };
export const dynamic = "force-dynamic";

export default async function VerifyPhonePage({
  searchParams,
}: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  await requireUser("/verify-phone");
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/sell";

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <div className="text-center">
        <Eyebrow>One more step</Eyebrow>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Verify your phone to sell</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-text-muted">
          Selling needs a verified Indian mobile number. Buyers never see it.
        </p>
      </div>
      <Card className="mt-10">
        <SignInForm next={target} googleEnabled={false} />
      </Card>
    </div>
  );
}
