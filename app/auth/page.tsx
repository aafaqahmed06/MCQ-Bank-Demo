import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LayoutWrapper from "@/components/LayoutWrapper";
import AuthShell from "@/components/AuthShell";
import AuthForm from "@/components/AuthForm";

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
      <AuthShell title="Welcome back" subtitle="Sign in or create an account to start practicing.">
        {error && (
          <p className="alert-error mb-4 rounded-control px-4 py-3 text-sm" role="alert">
            We couldn&apos;t complete that sign-in. Please try again.
          </p>
        )}
        <AuthForm />
      </AuthShell>
    </LayoutWrapper>
  );
}
