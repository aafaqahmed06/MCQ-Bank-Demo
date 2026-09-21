"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useCollegeOptions } from "@/components/useCollegeOptions";
import CollegeCombobox from "@/components/CollegeCombobox";
import { Button, Icon, Skeleton, cn } from "@/components/ui";

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: "You",
  2: "Your Curriculum",
  3: "Ready",
};

const fieldClass =
  "w-full rounded-control border border-border-default bg-surface px-4 py-3.5 text-base text-text-primary transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

function StepIndicator({ step }: { step: Step }) {
  return (
    <ol className="mb-8 flex items-center justify-center gap-2" aria-label="Onboarding progress">
      {([1, 2, 3] as const).map((s) => {
        const state = s < step ? "done" : s === step ? "current" : "upcoming";
        return (
          <li key={s} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-caption font-semibold transition-colors duration-150",
                state === "done" && "bg-primary text-white",
                state === "current" && "border-2 border-primary text-primary",
                state === "upcoming" && "border border-border-default text-text-tertiary"
              )}
              aria-current={state === "current" ? "step" : undefined}
            >
              {state === "done" ? <Icon icon={Check} size="xs" /> : s}
            </span>
            <span
              className={cn(
                "hidden text-caption font-medium sm:inline",
                state === "upcoming" ? "text-text-tertiary" : "text-text-secondary"
              )}
            >
              {STEP_LABELS[s]}
            </span>
            {s < 3 && <span className="mx-1 h-px w-6 bg-border-default" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Deliberate three-step progression (You → Your Curriculum → Ready), per
 * .claude/rules/ui-upgrade-plan.md "Onboarding". Step 1 is name, step 2 is
 * college/program/year, step 3 confirms and hands off to Start practicing.
 */
export default function OnboardingForm() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const { colleges, programs, years, loading } = useCollegeOptions();

  const [step, setStep] = useState<Step>(1);

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

  if (loading) {
    return (
      <div>
        <StepIndicator step={1} />
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-[52px] w-full" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  const filteredPrograms = programs.filter((p) => p.college_id === collegeId);
  const filteredYears = years.filter((y) => y.program_id === programId);

  const collegeName = colleges.find((c) => c.id === collegeId)?.name ?? "";
  const programName = programs.find((p) => p.id === programId)?.name ?? "";
  const yearName = years.find((y) => y.id === yearId)?.name ?? "";

  return (
    <div>
      <StepIndicator step={step} />

      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-3">
            <label htmlFor="fullName" className="block text-sm font-medium text-text-secondary">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className={fieldClass}
              autoFocus
            />
          </div>
          <Button
            onClick={() => {
              if (!fullName.trim()) {
                setError("Please enter your name.");
                return;
              }
              setError(null);
              setStep(2);
            }}
            fullWidth
            size="lg"
          >
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-3">
            <label htmlFor="college" className="block text-sm font-medium text-text-secondary">
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
              className={fieldClass}
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="program" className="block text-sm font-medium text-text-secondary">
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
              className={fieldClass}
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
            <label htmlFor="year" className="block text-sm font-medium text-text-secondary">
              Academic year
            </label>
            <select
              id="year"
              value={yearId}
              onChange={(e) => setYearId(e.target.value)}
              disabled={!programId}
              className={fieldClass}
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
            <p className="alert-error rounded-control px-3 py-2 text-sm" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              onClick={() => {
                if (!collegeId || !programId || !yearId) {
                  setError("Please select your college, program, and academic year.");
                  return;
                }
                setError(null);
                setStep(3);
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-3 rounded-card border border-border-default bg-surface-secondary p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-tertiary">Name</span>
              <span className="font-medium text-text-primary">{fullName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-tertiary">College</span>
              <span className="font-medium text-text-primary">{collegeName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-tertiary">Program</span>
              <span className="font-medium text-text-primary">{programName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-tertiary">Year</span>
              <span className="font-medium text-text-primary">{yearName}</span>
            </div>
          </div>

          {error && (
            <p className="alert-error rounded-control px-3 py-2 text-sm" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep(2)} disabled={saving}>
              Back
            </Button>
            <Button onClick={() => void saveProfile()} loading={saving}>
              Start practicing
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
