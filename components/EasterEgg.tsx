"use client";

import { useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const TAP_THRESHOLD = 7;
const TAP_TIMEOUT = 2000;

export default function EasterEggTrigger({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const countRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = useCallback(() => {
    countRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countRef.current >= TAP_THRESHOLD) {
      countRef.current = 0;
      router.push("/easter-egg");
    } else {
      timerRef.current = setTimeout(() => {
        countRef.current = 0;
      }, TAP_TIMEOUT);
    }
  }, [router]);

  return (
    <div onClick={handleTap} onTouchEnd={handleTap}>
      {children}
    </div>
  );
}