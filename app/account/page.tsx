import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import ProfileEditor from "@/components/ProfileEditor";

export default function AccountPage() {
  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="mx-auto w-full max-w-lg space-y-6">
          <section className="hud-card fade-in rounded-xl p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-[var(--text-heading)]">
              Account Settings
            </h1>
            <p className="mt-1 text-[var(--text-muted)]">
              Update your name and study context. Changes are reflected across
              the app.
            </p>
            <div className="mt-6">
              <ProfileEditor />
            </div>
          </section>
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}