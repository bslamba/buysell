"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { MIN_AGE } from "@/lib/auth/email";

type Step = "details" | "code";

async function readJson(res: Response): Promise<{ ok?: boolean; error?: string; devCode?: string; field?: string } | null> {
  try { return await res.json(); } catch { return null; }
}
function serverFailure(res: Response): string {
  return `The server could not handle that (error ${res.status}). ${res.status >= 500 ? "The detail is in the server log." : "Please try again."}`;
}

/** Today minus MIN_AGE years, as the date input's max — the browser then refuses
 *  an under-age date before a round trip, and the server checks it again. */
function maxDob(): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - MIN_AGE);
  return d.toISOString().slice(0, 10);
}

export function RegisterForm({ next, initialName }: { next: string; initialName?: string | null }) {
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState(initialName ?? "");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
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

  useEffect(() => { if (step === "code") codeRef.current?.focus(); }, [step]);

  async function submitDetails() {
    setError(null); setNotice(null); setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, dateOfBirth: dob, email }),
      });
      const data = await readJson(res);
      if (!data) { setError(serverFailure(res)); return; }
      if (!data.ok) { setError(data.error ?? "Could not send the code."); return; }
      setStep("code");
      setCooldown(30);
      setNotice(data.devCode ? `Development mode — your code is ${data.devCode}` : `Code sent to ${email.trim()}.`);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally { setBusy(false); }
  }

  async function submitCode() {
    setError(null); setBusy(true);
    try {
      const res = await fetch("/api/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await readJson(res);
      if (!data) { setError(serverFailure(res)); return; }
      if (!data.ok) { setError(data.error ?? "That code is not right."); return; }
      // A full navigation, not a client route change: the gate that sent the
      // user here reads the database, so the next page will see the new state.
      window.location.href = next;
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally { setBusy(false); }
  }

  const detailsReady = name.trim().length >= 2 && dob.length === 10 && email.trim().length > 5;

  return (
    <div className="space-y-5">
      {step === "details" ? (
        <>
          <Field label="Full name">
            <input
              className={inputClass} value={name} onChange={(e) => setName(e.target.value)}
              autoComplete="name" placeholder="Harsimran Kaur" maxLength={120}
            />
          </Field>

          <Field label="Date of birth" hint={`You need to be ${MIN_AGE} or over to buy and sell.`}>
            <input
              type="date" className={inputClass} value={dob} max={maxDob()} min="1906-01-01"
              onChange={(e) => setDob(e.target.value)} autoComplete="bday"
            />
          </Field>

          <Field label="Email address" hint="We'll send a 6-digit code to confirm it's yours.">
            <input
              type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email" placeholder="you@example.com" maxLength={254}
              onKeyDown={(e) => { if (e.key === "Enter" && detailsReady && !busy) submitDetails(); }}
            />
          </Field>

          <Button className="w-full" onClick={submitDetails} disabled={busy || !detailsReady}>
            {busy ? "Sending…" : "Send code"}
          </Button>
        </>
      ) : (
        <>
          <Field label="Enter the 6-digit code" hint={`Sent to ${email.trim()}`}>
            <input
              ref={codeRef} className={`${inputClass} text-center tracking-[0.4em]`}
              inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => { if (e.key === "Enter" && code.length === 6 && !busy) submitCode(); }}
            />
          </Field>

          <Button className="w-full" onClick={submitCode} disabled={busy || code.length !== 6}>
            {busy ? "Verifying…" : "Verify and finish"}
          </Button>

          <div className="flex items-center justify-between">
            <button type="button" className="t-small text-ink-2 hover:text-ink"
              onClick={() => { setStep("details"); setCode(""); setError(null); setNotice(null); }}>
              Change details
            </button>
            <button type="button" className="t-small text-brand disabled:text-ink-3"
              disabled={cooldown > 0 || busy} onClick={submitDetails}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </>
      )}

      {notice ? <p className="rounded-xl bg-brand-100 px-4 py-3 t-small text-brand-700">{notice}</p> : null}
      {error ? <p className="rounded-xl bg-bad/10 px-4 py-3 t-small text-bad" role="alert">{error}</p> : null}
    </div>
  );
}
