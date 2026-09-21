"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, ErrorState } from "@/components/ui";

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
      <div className="w-full max-w-md rounded-card border border-border-default bg-surface-elevated p-8 shadow-elevated">
        <ErrorState
          icon={AlertTriangle}
          title="Something went wrong"
          description={
            <>
              <p>An unexpected error occurred while loading this page. Your progress up to this point is safe.</p>
              {error.digest && (
                <p className="mt-2 text-xs text-text-tertiary">Reference: {error.digest}</p>
              )}
            </>
          }
          action={
            <Button onClick={() => unstable_retry()}>Try again</Button>
          }
        />
      </div>
    </div>
  );
}
