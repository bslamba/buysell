import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Coarse routing gate only.
 *
 * This exists so an unauthenticated visitor gets a clean redirect instead of a
 * flash of a protected page. It is NOT the authorisation boundary — every
 * protected route re-checks with `requireRole` / `requireOrgMember`, which read
 * live state from the database.
 */

import { atLeast, type Role } from "@/lib/auth/roles";

const RULES: { prefix: string; minimum: Role }[] = [
  { prefix: "/admin", minimum: "moderator" },
  { prefix: "/corporate", minimum: "user" },
  { prefix: "/sell", minimum: "user" },
  { prefix: "/account", minimum: "user" },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const rule = RULES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  if (!rule) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.AUTH_SECRET, salt: "authjs.session-token", secureCookie: process.env.NODE_ENV === "production" });

  if (!token?.sub) {
    const url = new URL("/signin", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const role = (token.role as Role) ?? "user";
  if (!atLeast(role, rule.minimum)) {
    return NextResponse.redirect(new URL("/403", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/corporate/:path*", "/sell/:path*", "/account/:path*"],
};
