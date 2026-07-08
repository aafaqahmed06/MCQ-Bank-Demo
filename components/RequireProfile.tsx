"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { USER_STORAGE_KEY } from "@/lib/data/user";

export default function RequireProfile({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      router.replace("/onboarding");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
