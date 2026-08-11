"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function RequireProfile({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { loading, user, isProfileComplete } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth");
    } else if (!isProfileComplete) {
      router.replace("/onboarding");
    } else {
      setReady(true);
    }
  }, [loading, user, isProfileComplete, router]);

  if (!ready) return null;
  return <>{children}</>;
}