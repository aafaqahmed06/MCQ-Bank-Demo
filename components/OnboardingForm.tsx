"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useCollegeOptions } from "@/components/useCollegeOptions";
import CollegeCombobox from "@/components/CollegeCombobox";

export default function OnboardingForm() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const { colleges, programs, years, loading } = useCollegeOptions();

  // Full name carries over from whatever the person already gave us at
  // sign-up -- Google's profile name, or the name typed on the email/
  // password sign-up form (AuthForm.tsx sets the same user_metadata field).
  // College/program/year intentionally start blank: no field should be
  // silently pre-selected on profile creation.
  const [fullName, setFullName] = useState(() => {
    const raw = user?.user_metadata?.full_name;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw)) return (raw[0] as string) ?? "";
    return "";
  });
  const [collegeId, setCollegeId] = useState("");
  const [programId, setProgramId] = useState("");
  const [yearId, setYearId] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (supabaseRef.current == null) {
    supabaseRef.current = createClient();
  }

  async function saveProfile() {
    if (!user) return;

    if (!fullName.trim() || !collegeId || !programId || !yearId) {
      setError("Please fill in your name, college, program, and academic year.");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = supabaseRef.current!;

    const { error: err } = await supabase
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

  const filteredPrograms = programs.filter((p) => p.college_id === collegeId);
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
          placeholder="Your full name"
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
        <CollegeCombobox
          inputId="college"
          colleges={colleges}
          value={collegeId}
          onChange={(id) => {
            setCollegeId(id);
            setProgramId("");
            setYearId("");
          }}
          placeholder="Search by college name, acronym, or city…"
          className={selectClass}
        />
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
          htmlFor="year"
          className="block text-sm font-medium text-[var(--text-label)]"
        >
          Academic year
        </label>
        <select
          id="year"
          value={yearId}
          onChange={(e) => setYearId(e.target.value)}
          disabled={!programId}
          className={selectClass}
        >
          <option value="">Select academic year</option>
          {filteredYears.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="alert-error rounded-lg px-3 py-2 text-sm" role="alert">
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
