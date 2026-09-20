"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useCollegeOptions } from "@/components/useCollegeOptions";
import CollegeCombobox from "@/components/CollegeCombobox";

export default function ProfileEditor() {
  const { user, profile, refreshProfile } = useAuth();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const { colleges, programs, years, loading: optionsLoading } = useCollegeOptions();

  // ProfileEditor only ever renders inside RequireProfile (app/account/page.tsx),
  // which already waits for the profile to finish loading -- so it's safe to
  // read it directly on first render, not just after some later effect.
  const [fullName, setFullName] = useState(() => profile?.full_name ?? "");
  const [collegeId, setCollegeId] = useState(() => profile?.college_id ?? "");
  const [programId, setProgramId] = useState(() => profile?.program_id ?? "");
  const [yearId, setYearId] = useState(() => profile?.academic_year_id ?? "");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (supabaseRef.current == null) {
    supabaseRef.current = createClient();
  }

  // Re-syncs if `profile` is ever refetched as a new object (e.g. after
  // refreshProfile() below) -- unlike onboarding, this is an edit screen, so
  // carrying over the current values is correct here. Adjusted during render
  // (guarded by `syncedProfile`) rather than in an effect, per React's
  // guidance for "reset state when a prop changes"
  // (react.dev/learn/you-might-not-need-an-effect).
  const [syncedProfile, setSyncedProfile] = useState(profile);
  if (profile !== syncedProfile) {
    setSyncedProfile(profile);
    setFullName(profile?.full_name ?? "");
    setCollegeId(profile?.college_id ?? "");
    setProgramId(profile?.program_id ?? "");
    setYearId(profile?.academic_year_id ?? "");
  }

  async function saveProfile() {
    if (!user) return;

    if (!fullName.trim() || !collegeId || !programId || !yearId) {
      setSaved(false);
      setError("Please fill in your name, college, program, and academic year.");
      return;
    }

    setSaving(true);
    setSaved(false);
    setError(null);
    const { error: err } = await supabaseRef.current!
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        college_id: collegeId,
        program_id: programId,
        academic_year_id: yearId,
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

  if (optionsLoading) {
    return <p className="hud-muted py-6 text-center">Loading…</p>;
  }

  const filteredPrograms = programs.filter((p) => p.college_id === collegeId);
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
        <CollegeCombobox
          inputId="profileCollege"
          colleges={colleges}
          value={collegeId}
          onChange={(id) => {
            setCollegeId(id);
            const prog = programs.find((p) => p.college_id === id);
            setProgramId(prog ? prog.id : "");
            setYearId("");
          }}
          placeholder="Search by college name, acronym, or city…"
          className={selectClass}
        />
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
          disabled={!collegeId}
          className={selectClass}
        >
          <option value="">Select program</option>
          {filteredPrograms.map((p) => (
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
          disabled={!programId}
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
