import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/queue", label: "Review queue" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/orgs", label: "Organisations" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/metrics", label: "Metrics" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("moderator", "/admin");
  return (
    <div className="mx-auto max-w-6xl gap-8 px-5 py-10 md:flex">
      <aside className="mb-8 md:mb-0 md:w-48 md:shrink-0">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-400">
          Signed in as {user.role}
        </p>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium hover:bg-ink-100 dark:hover:bg-ink-900">
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
