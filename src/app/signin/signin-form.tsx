"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Button, Field, inputClass } from "@/components/ui";

type Step = "phone" | "code";

/**
 * The catch block below means "the request never completed" — a dropped
 * connection, DNS, offline. It must NOT also mean "the server answered with
 * something I could not parse", because that is a server fault and telling
 * someone to check their wifi sends them looking in the wrong place. These two
 * helpers keep the distinction: a body that will not parse is reported as a
 * server error, with its status, and the detail is in the server log.
 */
async function readJson(res: Response): Promise<{ ok?: boolean; error?: string; devCode?: string; needsRegistration?: boolean } | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function serverFailure(res: Response): string {
  return `The server could not handle that (error ${res.status}). ${
    res.status >= 500 ? "The detail is in the server log." : "Please try again."
  }`;
}

export function SignInForm({ next, googleEnabled }: { next: string; googleEnabled: boolean }) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  async function sendCode() {
    setError(null); setNotice(null); setBusy(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await readJson(res);
      if (!data) { setError(serverFailure(res)); return; }
      if (!data.ok) { setError(data.error ?? "Could not send the code."); return; }
      setStep("code");
      setCooldown(30);
      setNotice(data.devCode ? `Development mode — your code is ${data.devCode}` : `Code sent to +91 ${phone.replace(/\D/g, "").slice(-10)}.`);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode() {
    setError(null); setBusy(true);
    try {
      // Pre-flight for a precise error message. This does not consume the code.
      const pre = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await readJson(pre);
      if (!data) { setError(serverFailure(pre)); return; }
      if (!data.ok) { setError(data.error ?? "That code is not right."); return; }

      const result = await signIn("phone-otp", { phone, code, redirect: false });
      if (result?.error) { setError("Sign-in failed. Request a new code and try again."); return; }
      // A phone-verified account still has to finish registration — name, date
      // of birth and a verified email — before it can do anything here.
      window.location.href = data.needsRegistration
        ? `/register?next=${encodeURIComponent(next)}`
        : next;
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {googleEnabled && (
        <>
          <Button variant="ghost" className="w-full" onClick={() => signIn("google", { callbackUrl: next })}>
            Continue with Google
          </Button>
          <div className="flex items-center gap-3 text-xs text-ink-3">
            <span className="h-px flex-1 bg-hairline" />
            or use your phone
            <span className="h-px flex-1 bg-hairline" />
          </div>
        </>
      )}

      {step === "phone" ? (
        <form onSubmit={(e) => { e.preventDefault(); void sendCode(); }} className="space-y-5">
          <Field label="Mobile number" hint="Indian mobile numbers only. We'll send a 6-digit code.">
            <div className="flex items-center gap-2">
              <span className="border border-hairline bg-canvas rounded-xl px-3.5 py-3 text-sm text-ink-2">+91</span>
              <input
                className={inputClass}
                inputMode="numeric" autoComplete="tel" placeholder="98765 43210"
                value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={15} required
              />
            </div>
          </Field>
          <Button type="submit" className="w-full" disabled={busy || phone.replace(/\D/g, "").length < 10}>
            {busy ? "Sending…" : "Send code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); void submitCode(); }} className="space-y-5">
          <Field label="Enter the 6-digit code" hint={`Sent to +91 ${phone.replace(/\D/g, "").slice(-10)}`}>
            <input
              ref={codeRef} className={`${inputClass} text-center text-2xl font-semibold tracking-[0.45em]`}
              inputMode="numeric" autoComplete="one-time-code" placeholder="······"
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6} required
            />
          </Field>
          <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
            {busy ? "Verifying…" : "Verify and continue"}
          </Button>
          <div className="flex items-center justify-between text-xs">
            <button type="button" className="text-ink-2 hover:text-ink"
              onClick={() => { setStep("phone"); setCode(""); setError(null); setNotice(null); }}>
              Change number
            </button>
            <button type="button" className="font-semibold text-brand hover:text-brand-600 disabled:text-ink-3"
              disabled={cooldown > 0 || busy} onClick={() => void sendCode()}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}

      {notice && <p className="rounded-xl bg-brand-100 px-4 py-3 text-sm text-brand-600 ring-1 ring-brand/20">{notice}</p>}
      {error && <p role="alert" className="rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad ring-1 ring-bad/25">{error}</p>}
    </div>
  );
}
