import { AlertTriangle } from "lucide-react";
import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import ProfileEditor from "@/components/ProfileEditor";
import AccountSecurityForm from "@/components/AccountSecurityForm";
import PreferencesSection from "@/components/PreferencesSection";
import { Icon } from "@/components/ui";
import { SUPPORT_EMAIL } from "@/lib/site";

function SettingsRow({
  title,
  description,
  children,
  last = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section
      className={last ? "py-8" : "border-b border-border-subtle py-8"}
    >
      <h2 className="text-h3 font-semibold text-text-primary">{title}</h2>
      <p className="mt-1 text-sm text-text-tertiary">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function AccountPage() {
  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="mx-auto w-full max-w-xl">
          <header className="space-y-1.5">
            <h1 className="text-h1 font-bold tracking-tight text-text-primary">
              Account Settings
            </h1>
            <p className="text-text-tertiary">
              Manage your study context, preferences, and sign-in security.
            </p>
          </header>

          <div className="mt-2">
            <SettingsRow
              title="Profile"
              description="Update your name and study context. Changes are reflected across the app."
            >
              <ProfileEditor />
            </SettingsRow>

            <SettingsRow title="Preferences" description="Appearance and motion, for this device.">
              <PreferencesSection />
            </SettingsRow>

            <SettingsRow
              title="Security"
              description="Manage the email and password used to sign in."
            >
              <AccountSecurityForm />
            </SettingsRow>

            <SettingsRow title="Danger Zone" description="Irreversible account actions." last>
              <div className="flex items-start gap-3 rounded-card border border-error/30 bg-error-soft p-4">
                <Icon icon={AlertTriangle} size="sm" className="mt-0.5 shrink-0 text-error" />
                <div className="text-sm text-error-text">
                  <p className="font-medium">Account deletion isn&apos;t self-serve yet.</p>
                  <p className="mt-1">
                    To permanently delete your account and data, email{" "}
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="underline hover:no-underline">
                      {SUPPORT_EMAIL}
                    </a>{" "}
                    from your account&apos;s email address.
                  </p>
                </div>
              </div>
            </SettingsRow>
          </div>
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}
