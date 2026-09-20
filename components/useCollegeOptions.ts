"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type College = {
  id: string;
  name: string;
  short_name: string | null;
  city: string | null;
};
export type Program = { id: string; college_id: string; name: string };
export type AcademicYear = {
  id: string;
  program_id: string;
  year_number: number;
  name: string;
};

const HIDDEN_COLLEGE_IDS = new Set(["diagnknow-qb"]);

/**
 * Shared college/program/academic-year fetch for OnboardingForm.tsx and
 * ProfileEditor.tsx (previously duplicated in both). Pure data fetch --
 * selection state and cascading-reset-on-change logic stay in each form,
 * since the two forms handle "no value yet" differently (onboarding starts
 * blank; the editor pre-fills from the existing profile).
 */
export function useCollegeOptions() {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  if (supabaseRef.current == null) {
    supabaseRef.current = createClient();
  }

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = supabaseRef.current!;
      const [cols, progs, ys] = await Promise.all([
        supabase.from("colleges").select("id, name, short_name, city").order("name"),
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
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  return { colleges, programs, years, loading };
}
