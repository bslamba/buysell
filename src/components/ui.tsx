import Link from "next/link";
import type { ReactNode } from "react";

export function Button({
  children, href, type = "button", variant = "primary", disabled, onClick, className = "",
}: {
  children: ReactNode; href?: string; type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost"; disabled?: boolean;
  onClick?: () => void; className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "border border-ink-200 bg-white text-ink-900 hover:bg-ink-50 dark:bg-ink-900 dark:text-ink-100 dark:border-ink-700",
    ghost: "text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-900",
  } as const;
  const cls = `${base} ${variants[variant]} ${className}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type={type} disabled={disabled} onClick={onClick} className={cls}>{children}</button>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900 ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn" | "bad"; children: ReactNode }) {
  const tones = {
    neutral: "bg-ink-100 text-ink-700 dark:bg-ink-700 dark:text-ink-100",
    good: "bg-brand-100 text-brand-700",
    warn: "bg-warn-100 text-warn-600",
    bad: "bg-danger-100 text-danger-600",
  } as const;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-200 px-6 py-16 text-center dark:border-ink-700">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">{body}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-ink-500">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-400 focus:border-brand-600 dark:border-ink-700 dark:bg-ink-950";
