import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "@/components/OnboardingForm";
import LayoutWrapper from "@/components/LayoutWrapper";
import DkBot from "@/components/DkBot";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        <section className="fade-in mx-auto w-full max-w-2xl rounded-card border border-border-default bg-surface p-6 sm:p-8">
          <div className="flex justify-center">
            <DkBot state="happy" size="medium" alt={null} />
          </div>
          <h1 className="mt-4 text-center text-h1 font-bold text-text-primary">
            Set up your profile
          </h1>
          <p className="mt-1 text-center text-text-tertiary">
            Tell us who you are to personalize your dashboard.
          </p>
          <div className="mt-6">
            <OnboardingForm />
          </div>
        </section>
      </div>
    </LayoutWrapper>
  );
}