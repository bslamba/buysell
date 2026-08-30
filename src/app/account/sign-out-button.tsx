"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

/**
 * Sign out.
 *
 * `redirect: false` then a full page navigation, rather than letting Auth.js do
 * the redirect: every page here is server-rendered against the session, so a
 * client-side route change would leave stale server HTML showing the user still
 * signed in until something forced a refetch.
 */
export function SignOutButton({ className = "" }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={`a-btn a-btn-ghost ${className}`}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await signOut({ redirect: false });
        } finally {
          window.location.href = "/";
        }
      }}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
