import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import ProfileEditor from "@/components/ProfileEditor";
import AccountSecurityForm from "@/components/AccountSecurityForm";

export default function AccountPage() {
  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="mx-auto w-full max-w-xl space-y-6">
          <header className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">
              Account Settings
            </h1>
            <p className="text-[var(--text-muted)]">
              Manage your study context and sign-in security.
            </p>
          </header>

          <section className="hud-card rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-[var(--text-heading)]">
              Profile
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Update your name and study context. Changes are reflected across
              the app.
            </p>
            <div className="mt-6">
              <ProfileEditor />
            </div>
          </section>

          <section className="hud-card rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-[var(--text-heading)]">
              Security
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Manage the email and password used to sign in.
            </p>
            <div className="mt-6">
              <AccountSecurityForm />
            </div>
          </section>
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}