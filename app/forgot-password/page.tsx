import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LayoutWrapper from "@/components/LayoutWrapper";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | DiagKnow",
  description: "Request a password reset link for your DiagKnow account.",
};

export default async function ForgotPasswordPage() {
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
            Reset your password
          </h1>
          <p className="hud-muted mt-1">
            Enter your email and we&apos;ll send you a link to create a new
            password.
          </p>
          <div className="mt-6">
            <ForgotPasswordForm />
          </div>
        </section>
      </div>
    </LayoutWrapper>
  );
}