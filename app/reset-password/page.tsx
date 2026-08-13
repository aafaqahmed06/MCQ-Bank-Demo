import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LayoutWrapper from "@/components/LayoutWrapper";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set New Password | DiagKnow",
  description: "Create a new password for your DiagKnow account.",
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only reachable via the recovery link → callback exchange establishes a
  // session. A signed-out visitor has nothing to reset.
  if (!user) redirect("/auth");

  return (
    <LayoutWrapper>
      <div className="flex flex-1 flex-col items-center justify-center py-8 md:py-12">
        <section className="hud-card fade-in w-full max-w-md rounded-xl p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-[var(--text-heading)]">
            Set a new password
          </h1>
          <p className="hud-muted mt-1">
            Choose a strong password to secure your account.
          </p>
          <div className="mt-6">
            <ResetPasswordForm />
          </div>
        </section>
      </div>
    </LayoutWrapper>
  );
}