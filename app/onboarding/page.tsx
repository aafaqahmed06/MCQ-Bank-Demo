import OnboardingForm from "@/components/OnboardingForm";
import LayoutWrapper from "@/components/LayoutWrapper";

export default function OnboardingPage() {
  return (
    <LayoutWrapper>
      <div className="space-y-6">
        <section className="hud-card fade-in mx-auto w-full max-w-2xl rounded-xl p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-[var(--text-heading)]">Set up your profile</h1>
          <p className="hud-muted mt-1">
            Select your college and year to personalize your dashboard.
          </p>
          <div className="mt-6">
            <OnboardingForm />
          </div>
        </section>
      </div>
    </LayoutWrapper>
  );
}
