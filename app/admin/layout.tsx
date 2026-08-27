import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";

// Server-side is_admin() gate (requireAdmin). Every app/admin page and
// server action re-runs the same check -- layouts don't re-render on client
// navigation between admin tabs -- and Postgres (RLS + SECURITY DEFINER
// RPCs: set_mcq_status, set_question_report_status, assert_can_delete_user)
// remains the real security boundary.
const TABS = [
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/review", label: "Review Queue" },
  { href: "/admin/coverage", label: "Coverage" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-[var(--border-color)] bg-[var(--bg-nav-inner)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <span className="text-base font-semibold tracking-tight text-[var(--text-heading)]">
              DiagKnow Admin
            </span>
            <nav>
              <ul className="flex items-center gap-1">
                {TABS.map((tab) => (
                  <li key={tab.href}>
                    <Link
                      href={tab.href}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--text-muted-light)] transition-colors hover:bg-cyan-500/8 hover:text-[var(--text-heading)]"
                    >
                      {tab.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <Link
            href="/home"
            className="text-sm font-medium text-[var(--text-muted-light)] hover:text-[var(--text-heading)]"
          >
            Back to app
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
