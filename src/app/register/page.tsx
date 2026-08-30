import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { brand } from "@/config/brand";
import { currentUser } from "@/lib/auth/guards";
import { Card, Eyebrow } from "@/components/ui";
import { LogoMark } from "@/components/logo";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Complete your account", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Only same-origin relative paths, so ?next= can't be used for an open redirect. */
function safeNext(raw?: string): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

/**
 * Registration, after the phone is verified.
 *
 * Read from the database rather than the session: the JWT refreshes on a timer,
 * and someone who has just finished registering in another tab should not be
 * asked to do it twice.
 */
export default async function RegisterPage({
  searchParams,
}: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeNext(next);

  const me = await currentUser();
  if (!me) redirect(`/signin?next=${encodeURIComponent(`/register?next=${target}`)}`);

  const [row] = await db
    .select({ name: users.name, registeredAt: users.registeredAt })
    .from(users).where(eq(users.id, me.id)).limit(1);

  if (row?.registeredAt) redirect(target);

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <div className="mb-8 flex justify-center"><LogoMark size={52} /></div>
      <div className="text-center">
        <Eyebrow>One more step</Eyebrow>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Complete your account</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-2">
          Your email is verified. We need a name, your date of birth, and a mobile number
          we can verify — the number is what keeps one person to one account, not ten.
          Buyers never see it.
        </p>
      </div>

      <Card className="mt-10">
        <RegisterForm next={target} initialName={row?.name} />
      </Card>

      <p className="mt-8 text-center text-xs leading-relaxed text-ink-3">
        {brand.name} uses your email for order updates and your mobile number only to verify
        that you are one person. Neither is ever shown on a listing.
      </p>
    </div>
  );
}
