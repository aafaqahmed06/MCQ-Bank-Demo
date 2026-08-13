"use client";

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="hud-card w-full max-w-md rounded-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-[var(--text-heading)]">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          An unexpected error occurred while loading this page. Please try
          again.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-[var(--text-option-dim)]">
            Reference: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="hud-primary-btn mt-6 rounded-xl px-6 py-3 font-semibold"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
