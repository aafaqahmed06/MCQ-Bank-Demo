import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { formatLastActive } from "@/lib/activity";
import type { AdminUserRow } from "@/types";

// Service-role client, not the cookie-based server client: two things here
// are genuinely unreachable via an admin's own RLS-scoped session --
// (1) profiles has no SELECT policy allowing a row to read others' rows
// (20260708000009_rls.sql grants `using (id = auth.uid())` only, no
// is_admin() bypass), and (2) email lives in auth.users, which PostgREST
// never exposes at all -- only the Auth Admin API (service-role) can read
// it. This route is already gated admin-only by app/admin/layout.tsx, and
// none of this ever reaches the client: it's assembled here and passed down
// as plain props.
interface RawProfileRow {
  id: string;
  full_name: string | null;
  role: AdminUserRow["role"];
  last_active_at: string | null;
  created_at: string;
  colleges: { name: string } | null;
  programs: { name: string } | null;
  academic_years: { name: string } | null;
}

const ROLE_STYLE: Record<string, string> = {
  student: "bg-[var(--bg-card-alt)] text-[var(--text-muted)]",
  reviewer: "bg-cyan-500/10 text-[var(--accent-cyan-strong)]",
  admin: "bg-amber-500/10 text-[var(--accent-violet)]",
  super_admin: "bg-red-500/10 text-error",
};

async function fetchAllUserEmails(
  admin: ReturnType<typeof createAdminClient>
): Promise<Map<string, string>> {
  const emailById = new Map<string, string>();
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      if (u.email) emailById.set(u.id, u.email);
    }
    if (data.users.length < perPage) break;
  }
  return emailById;
}

export default async function AdminUsersPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data, error }, emailById] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "id, full_name, role, last_active_at, created_at, colleges ( name ), programs ( name ), academic_years ( name )"
      )
      .order("full_name", { ascending: true }),
    fetchAllUserEmails(admin),
  ]);

  if (error) {
    return (
      <p className="alert-error rounded-lg px-4 py-3 text-sm" role="alert">
        Could not load users: {error.message}
      </p>
    );
  }

  // colleges/programs/academic_years are many-to-one embeds (profiles.college_id
  // etc -> id), so PostgREST returns single objects, but the untyped
  // SupabaseClient infers embeds as arrays -- same cardinality mismatch
  // handled the same way in lib/coverage.ts and app/admin/reports/page.tsx.
  const rows: AdminUserRow[] = ((data as unknown as RawProfileRow[] | null) ?? []).map(
    (p) => ({
      id: p.id,
      full_name: p.full_name,
      email: emailById.get(p.id) ?? null,
      role: p.role,
      collegeName: p.colleges?.name ?? null,
      programName: p.programs?.name ?? null,
      academicYearName: p.academic_years?.name ?? null,
      lastActiveAt: p.last_active_at,
      createdAt: p.created_at,
    })
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)]">
          Users
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          {rows.length} account{rows.length === 1 ? "" : "s"}.
        </p>
      </header>

      <div className="hud-card overflow-x-auto rounded-xl p-4 sm:p-6">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wide text-[var(--text-muted-light)]">
              <th className="px-3 py-3 font-medium">Name</th>
              <th className="px-3 py-3 font-medium">Email</th>
              <th className="px-3 py-3 font-medium">College / Program / Year</th>
              <th className="px-3 py-3 font-medium">Role</th>
              <th className="px-3 py-3 font-medium">Last active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[var(--border-color)] text-[var(--text-body)] last:border-0"
              >
                <td className="px-3 py-3 font-medium text-[var(--text-heading)]">
                  <Link
                    href={`/admin/users/${row.id}`}
                    className="hover:text-[var(--accent-cyan-strong)] hover:underline"
                  >
                    {row.full_name ?? "(no name)"}
                  </Link>
                </td>
                <td className="px-3 py-3 text-[var(--text-muted)]">
                  {row.email ?? "—"}
                </td>
                <td className="px-3 py-3 text-[var(--text-muted)]">
                  {[row.collegeName, row.programName, row.academicYearName]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_STYLE[row.role]}`}
                  >
                    {row.role}
                  </span>
                </td>
                <td className="px-3 py-3 text-[var(--text-muted)]">
                  {formatLastActive(row.lastActiveAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
