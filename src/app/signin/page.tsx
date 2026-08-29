import { redirect } from "next/navigation";
import { brand } from "@/config/brand";
import { env } from "@/env";
import { currentUser } from "@/lib/auth/guards";
import { SignInForm } from "./signin-form";

export const metadata = { title: "Sign in" };

/** Only allow same-origin relative paths, so ?next= can't be used for an open redirect. */
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
    <div className="mx-auto max-w-sm px-5 py-20">
      <h1 className="text-2xl font-bold tracking-tight">Sign in to {brand.name}</h1>
      <p className="mt-2 text-sm text-ink-500">
        Your phone number is what keeps this marketplace honest — it is how we stop one
        person running ten fake seller accounts.
      </p>
      <div className="mt-8">
        <SignInForm next={target} googleEnabled={googleEnabled} />
      </div>
      <p className="mt-8 text-xs leading-relaxed text-ink-400">
        By continuing you agree to {brand.name}&apos;s terms of use and privacy policy.
        We never share your number with buyers or sellers.
      </p>
    </div>
  );
}
