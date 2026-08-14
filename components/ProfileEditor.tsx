"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";

type College = { id: string; name: string; short_name: string | null };
type Program = { id: string; college_id: string; name: string };
type AcademicYear = { id: string; program_id: string; year_number: number; name: string };

const HIDDEN_COLLEGE_IDS = new Set(["diagnknow-qb"]);

export default function ProfileEditor() {
  const { user, profile, refreshProfile } = useAuth();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const [colleges, setColleges] = useState<College[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);

  const [fullName, setFullName] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [programId, setProgramId] = useState("");
  const [yearId, setYearId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (supabaseRef.current == null) {
    supabaseRef.current = createClient();
  }

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = supabaseRef.current!;
      const [cols, progs, ys] = await Promise.all([
        supabase.from("colleges").select("id, name, short_name").order("name"),
        supabase.from("programs").select("id, college_id, name").order("name"),
        supabase
          .from("academic_years")
          .select("id, program_id, year_number, name")
          .order("year_number"),
      ]);
      if (!active) return;
      const visibleCols = (cols.data ?? []).filter(
        (c) => !HIDDEN_COLLEGE_IDS.has(c.id as string),
      );
      const visibleCollegeIds = new Set(visibleCols.map((c) => c.id as string));
      const visibleProgs = (progs.data ?? []).filter((p) =>
        visibleCollegeIds.has(p.college_id as string),
      );
      const visibleProgramIds = new Set(visibleProgs.map((p) => p.id as string));
      const visibleYears = (ys.data ?? []).filter((y) =>
        visibleProgramIds.has(y.program_id as string),
      );
      setColleges(visibleCols as College[]);
      setPrograms(visibleProgs as Program[]);
      setYears(visibleYears as AcademicYear[]);

      setFullName(profile?.full_name ?? "");
      setCollegeId(profile?.college_id ?? "");
      setProgramId(profile?.program_id ?? "");
      setYearId(profile?.academic_year_id ?? "");
      setLoading(false);
    }
    if (user) void load();
    return () => {
      active = false;
    };
  }, [user, profile]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    const { error: err } = await supabaseRef.current!
      .from("profiles")
      .update({
        full_name: fullName,
        college_id: collegeId || null,
        program_id: programId || null,
        academic_year_id: yearId || null,
      })
      .eq("id", user.id);

    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    await refreshProfile();
    setSaved(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void saveProfile();
  }

  const selectClass =
    "w-full rounded-xl border border-cyan-300/25 bg-[var(--bg-card-solid)]/70 px-4 py-3.5 text-base text-[var(--text-body)] focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/25";

  if (loading) {
    return <p className="hud-muted py-6 text-center">Loading…</p>;
  }

  const filteredYears = years.filter((y) => y.program_id === programId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <label
          htmlFor="profileFullName"
          className="block text-sm font-medium text-[var(--text-label)]"
        >
          Full name
        </label>
        <input
          id="profileFullName"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={selectClass}
        />
      </div>

      <div className="space-y-3">
        <label
          htmlFor="profileCollege"
          className="block text-sm font-medium text-[var(--text-label)]"
        >
          College
        </label>
        <select
          id="profileCollege"
          value={collegeId}
          onChange={(e) => {
            const id = e.target.value;
            setCollegeId(id);
            const prog = programs.find((p) => p.college_id === id);
            setProgramId(prog ? prog.id : "");
            setYearId("");
          }}
          className={selectClass}
        >
          <option value="">Select college</option>
          {colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <label
          htmlFor="profileProgram"
          className="block text-sm font-medium text-[var(--text-label)]"
        >
          Program
        </label>
        <select
          id="profileProgram"
          value={programId}
          onChange={(e) => {
            setProgramId(e.target.value);
            setYearId("");
          }}
          className={selectClass}
        >
          <option value="">Select program</option>
          {programs
            .filter((p) => p.college_id === collegeId)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
      </div>

      <div className="space-y-3">
        <label
          htmlFor="profileYear"
          className="block text-sm font-medium text-[var(--text-label)]"
        >
          Academic year
        </label>
        <select
          id="profileYear"
          value={yearId}
          onChange={(e) => setYearId(e.target.value)}
          className={selectClass}
        >
          <option value="">Select year</option>
          {filteredYears.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
            </option>
          ))}
        </select>
      </div>

      {saved && (
        <p
          className="box-success rounded-lg px-3 py-2 text-sm"
          role="status"
        >
          Profile updated.
        </p>
      )}

      {error && (
        <p
          className="alert-error rounded-lg px-3 py-2 text-sm"
          role="alert"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="hud-primary-btn w-full rounded-xl px-5 py-3.5 font-medium disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}