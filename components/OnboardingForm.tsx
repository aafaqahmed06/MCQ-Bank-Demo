"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";

type College = { id: string; name: string; short_name: string | null };
type Program = { id: string; college_id: string; name: string };
type AcademicYear = { id: string; program_id: string; year_number: number; name: string };

export default function OnboardingForm() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const [colleges, setColleges] = useState<College[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);

  const [fullName, setFullName] = useState(() => {
    const raw = user?.user_metadata?.full_name;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw)) return (raw[0] as string) ?? "";
    return "";
  });
  const [collegeId, setCollegeId] = useState("");
  const [programId, setProgramId] = useState("");
  const [yearId, setYearId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (supabaseRef.current == null) {
    supabaseRef.current = createClient();
  }

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = supabaseRef.current!;

      const { data: cols } = await supabase
        .from("colleges")
        .select("id, name, short_name")
        .order("name");
      if (!active) return;
      if (cols && cols.length) {
        setColleges(cols as College[]);
        setCollegeId((cols[0] as College).id);
      }

      const { data: progs } = await supabase
        .from("programs")
        .select("id, college_id, name")
        .order("name");
      if (!active) return;
      if (progs && progs.length) {
        setPrograms(progs as Program[]);
        const first = progs[0] as Program;
        setProgramId(first.id);
      }

      const { data: ys } = await supabase
        .from("academic_years")
        .select("id, program_id, year_number, name")
        .order("year_number");
      if (!active) return;
      if (ys && ys.length) {
        setYears(ys as AcademicYear[]);
        setYearId((ys[0] as AcademicYear).id);
      }

      if (active) setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    setError(null);
    const supabase = supabaseRef.current!;

    const { error: err } = await supabase
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
    router.replace("/home");
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
          htmlFor="fullName"
          className="block text-sm font-medium text-[var(--text-label)]"
        >
          Full name
        </label>
        <input
          id="fullName"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Aafaq Ahmed"
          className={selectClass}
        />
      </div>

      <div className="space-y-3">
        <label
          htmlFor="college"
          className="block text-sm font-medium text-[var(--text-label)]"
        >
          College
        </label>
        <select
          id="college"
          value={collegeId}
          onChange={(e) => {
            const id = e.target.value;
            setCollegeId(id);
            const prog = programs.find((p) => p.college_id === id);
            setProgramId(prog ? prog.id : programs[0]?.id ?? "");
          }}
          className={selectClass}
        >
          {colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <label
          htmlFor="program"
          className="block text-sm font-medium text-[var(--text-label)]"
        >
          Program
        </label>
        <select
          id="program"
          value={programId}
          onChange={(e) => setProgramId(e.target.value)}
          className={selectClass}
        >
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
          htmlFor="year"
          className="block text-sm font-medium text-[var(--text-label)]"
        >
          Academic year
        </label>
        <select
          id="year"
          value={yearId}
          onChange={(e) => setYearId(e.target.value)}
          className={selectClass}
        >
          {filteredYears.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (!saving) handleSubmit(e);
        }}
        className="hud-primary-btn w-full rounded-xl px-5 py-3.5 font-medium disabled:opacity-60"
      >
        {saving ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}