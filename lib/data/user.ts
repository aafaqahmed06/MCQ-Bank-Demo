import type { UserProfile } from "@/types";

export const MOCK_COLLEGES = [
  "NUST School of Health Sciences",
  "Foundation University Medical Colleg",
  "Army Medical College",
  "Wah Medical College",
  "CMH Lahore",
] as const;

export const YEAR_OPTIONS = [1, 2, 3, 4, 5] as const;

export const USER_STORAGE_KEY = "mcq-bank-user-profile";

export const defaultUserProfile: UserProfile = {
  college: "",
  year: 1,
};
