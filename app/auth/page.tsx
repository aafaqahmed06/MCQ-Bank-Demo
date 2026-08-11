import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LayoutWrapper from "@/components/LayoutWrapper";
import AuthForm from "@/components/AuthForm";

export default async function AuthPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/home");

  return (
    <LayoutWrapper>
      <div className="flex flex-1 flex-col items-center justify-center py-8 md:py-12">
        <section className="hud-card fade-in w-full max-w-md rounded-xl p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-[var(--text-heading)]">
            DiagKnow
          </h1>
          <p className="hud-muted mt-1">
            Sign in or create an account to start practicing.
          </p>
          <div className="mt-6">
            <AuthForm />
          </div>
        </section>
      </div>
    </LayoutWrapper>
  );
}