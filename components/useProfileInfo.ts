"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";

type ProfileInfo = {
  collegeName: string;
  programName: string;
  yearName: string;
};

export function useProfileInfo() {
  const { profile } = useAuth();
  const [info, setInfo] = useState<ProfileInfo | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!profile || !profile.college_id || !profile.program_id || !profile.academic_year_id) {
        if (active) setInfo(null);
        return;
      }
      const supabase = createClient();
      const [c, p, y] = await Promise.all([
        supabase.from("colleges").select("name").eq("id", profile.college_id).single(),
        supabase.from("programs").select("name").eq("id", profile.program_id).single(),
        supabase.from("academic_years").select("name").eq("id", profile.academic_year_id).single(),
      ]);
      if (!active) return;
      setInfo({
        collegeName: (c.data?.name as string) ?? "",
        programName: (p.data?.name as string) ?? "",
        yearName: (y.data?.name as string) ?? "",
      });
    }
    void load();
    return () => {
      active = false;
    };
  }, [
    profile?.college_id,
    profile?.program_id,
    profile?.academic_year_id,
    profile,
  ]);

  return info;
}