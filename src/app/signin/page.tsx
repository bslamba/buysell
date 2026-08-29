import { redirect } from "next/navigation";
import { brand } from "@/config/brand";
import { env } from "@/env";
import { currentUser } from "@/lib/auth/guards";
import { Card, Eyebrow } from "@/components/ui";
import { LogoMark } from "@/components/logo";
import { SignInForm } from "./signin-form";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Only same-origin relative paths, so ?next= can't be used for an open redirect. */
function safeNext(raw?: string): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default async function SignInPage({
  searchParams,
}: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeNext(next);
  if (await currentUser()) redirect(target);

  const googleEnabled = Boolean(env().AUTH_GOOGLE_ID && env().AUTH_GOOGLE_SECRET);

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <div className="mb-8 flex justify-center"><LogoMark size={52} /></div>
      <div className="text-center">
        <Eyebrow>Welcome</Eyebrow>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Sign in to {brand.name}</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-text-muted">
          Your phone number is what keeps this marketplace honest — it&apos;s how we stop one person
          running ten seller accounts. Buyers never see it.
        </p>
      </div>

      <Card className="mt-10">
        <SignInForm next={target} googleEnabled={googleEnabled} />
      </Card>

      <p className="mt-8 text-center text-xs leading-relaxed text-text-faint">
        By continuing you agree to {brand.name}&apos;s{" "}
        <a href="/terms" className="text-violet-300 hover:text-violet-200">terms</a> and{" "}
        <a href="/privacy" className="text-violet-300 hover:text-violet-200">privacy policy</a>.
      </p>
    </div>
  );
}
