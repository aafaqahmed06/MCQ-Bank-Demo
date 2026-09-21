import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LayoutWrapper from "@/components/LayoutWrapper";
import AuthShell from "@/components/AuthShell";
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
      <AuthShell
        title="Reset your password"
        subtitle="Enter your email and we'll send you a link to create a new password."
      >
        <ForgotPasswordForm />
      </AuthShell>
    </LayoutWrapper>
  );
}
