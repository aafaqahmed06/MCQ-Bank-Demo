"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MOCK_COLLEGES, USER_STORAGE_KEY, YEAR_OPTIONS } from "@/lib/data/user";
import type { UserProfile } from "@/types";

export default function OnboardingForm() {
  const router = useRouter();
  const [college, setCollege] = useState<string>(MOCK_COLLEGES[0]);
  const [year, setYear] = useState<number>(1);

  function saveProfile() {
    const profile: UserProfile = { college, year };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
    router.push("/home");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveProfile();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <label
          htmlFor="college"
          className="block text-sm font-medium text-[var(--text-label)]"
        >
          College
        </label>
        <select
          id="college"
          value={college}
          onChange={(e) => setCollege(e.target.value)}
          className="w-full rounded-xl border border-cyan-300/25 bg-[var(--bg-card-solid)]/70 px-4 py-3.5 text-base text-[var(--text-body)] focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/25"
        >
          {MOCK_COLLEGES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <label
          htmlFor="year"
          className="block text-sm font-medium text-[var(--text-label)]"
        >
          Year
        </label>
        <select
          id="year"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-full rounded-xl border border-cyan-300/25 bg-[var(--bg-card-solid)]/70 px-4 py-3.5 text-base text-[var(--text-body)] focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/25"
        >
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>
              Year {y}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        onTouchEnd={(e) => { e.preventDefault(); saveProfile(); }}
        className="hud-primary-btn w-full rounded-xl px-5 py-3.5 font-medium"
      >
        Continue
      </button>
    </form>
  );
}
