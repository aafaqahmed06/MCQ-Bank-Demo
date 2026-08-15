import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LayoutWrapper from "@/components/LayoutWrapper";
import AuthForm from "@/components/AuthForm";
import DkBot from "@/components/DkBot";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/home");

  const { error } = await searchParams;

  return (
    <LayoutWrapper>
      <div className="flex flex-1 flex-col items-center justify-center py-8 md:py-12">
        <section className="hud-card fade-in w-full max-w-md rounded-xl p-6 sm:p-8">
          <div className="flex justify-center">
            <DkBot state="happy" size="small" alt={null} />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-[var(--text-heading)]">
            DiagKnow
          </h1>
          <p className="hud-muted mt-1">
            Sign in or create an account to start practicing.
          </p>
          {error && (
            <p
              className="alert-error mt-3 rounded-xl px-4 py-3 text-sm"
              role="alert"
            >
              We couldn&apos;t complete that sign-in. Please try again.
            </p>
          )}
          <div className="mt-6">
            <AuthForm />
          </div>
        </section>
      </div>
    </LayoutWrapper>
  );
}