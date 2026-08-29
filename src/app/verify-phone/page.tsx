import { requireUser } from "@/lib/auth/guards";
import { Card } from "@/components/ui";
import { SignInForm } from "../signin/signin-form";

export const metadata = { title: "Verify your phone" };

export default async function VerifyPhonePage({
  searchParams,
}: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  await requireUser("/verify-phone");
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/sell";

  return (
    <div className="mx-auto max-w-sm px-5 py-20">
      <h1 className="text-2xl font-bold tracking-tight">Verify your phone to sell</h1>
      <p className="mt-2 text-sm text-ink-500">
        Selling needs a verified Indian mobile number. Buyers never see it.
      </p>
      <Card className="mt-8">
        <SignInForm next={target} googleEnabled={false} />
      </Card>
    </div>
  );
}
