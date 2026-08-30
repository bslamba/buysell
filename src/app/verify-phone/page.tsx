import { redirect } from "next/navigation";

export const metadata = { title: "Verify your phone", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Kept as a redirect, not deleted.
 *
 * Phone verification used to live here, reusing the sign-in form back when
 * phone was the sign-in identity. It is now part of completing the profile, so
 * there is exactly one place a number gets attached to an account. The route
 * stays because /sell links to it and someone may have it bookmarked; sending
 * them to the real page beats a 404.
 */
export default async function VerifyPhonePage({
  searchParams,
}: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/sell";
  redirect(`/register?next=${encodeURIComponent(target)}`);
}
