import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { Badge } from "@/components/ui";

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
    <div className="mx-auto max-w-6xl gap-10 px-6 py-12 md:flex">
      <aside className="mb-8 md:mb-0 md:w-52 md:shrink-0">
        <Badge tone="brand">{user.role}</Badge>
        <nav className="mt-5 flex gap-1 overflow-x-auto md:flex-col">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              className="whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
