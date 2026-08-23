import type { Metadata } from "next";
import Link from "next/link";
import LayoutWrapper from "@/components/LayoutWrapper";
import { PRIVACY_EFFECTIVE_DATE, SITE_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_NAME}`,
  description: `How ${SITE_NAME} collects, uses, and protects your personal data.`,
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 id={id} className="text-xl font-semibold text-[var(--text-heading)]">
        {title}
      </h2>
      <div className="hud-muted mt-3 space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <LayoutWrapper>
      <div className="flex flex-1 flex-col py-8 md:py-12">
        <article className="hud-card fade-in w-full rounded-xl p-6 sm:p-8">
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent-cyan)]">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--text-heading)]">
            Privacy Policy
          </h1>
          <p className="hud-muted mt-2 text-sm">
            Last updated: {PRIVACY_EFFECTIVE_DATE}
          </p>

          <p className="hud-muted mt-6 leading-relaxed">
            This Privacy Policy explains how {SITE_NAME} (&quot;we&quot;, &quot;our&quot;, or
            &quot;us&quot;) collects, uses, and protects information when you use our website
            and practice tools. By creating an account or using the service, you agree to
            the practices described below.
          </p>

          <Section id="info-we-collect" title="1. Information We Collect">
            <p>
              <strong className="text-[var(--text-body)]">Account information.</strong> When you
              sign up, we collect your email address and the full name you provide. If you sign
              in with Google, we receive the name and email address Google shares with us.
            </p>
            <p>
              <strong className="text-[var(--text-body)]">Profile information.</strong> To tailor
              your practice, you may provide your college, program, and academic year. This is
              stored on your profile.
            </p>
            <p>
              <strong className="text-[var(--text-body)]">Practice data.</strong> We record your
              progress across topics, quiz and exam results, question bookmarks, and any
              question reports you submit. This data is associated with your account.
            </p>
            <p>
              <strong className="text-[var(--text-body)]">Technical data.</strong> Our hosting
              provider (Vercel) and database provider (Supabase) may collect standard logs such
              as IP addresses and browser information to operate and secure the service.
            </p>
            <p>
              <strong className="text-[var(--text-body)]">CAPTCHA data.</strong> We use
              Cloudflare Turnstile to protect sign-up, sign-in, and password recovery from
              automated abuse. Turnstile runs in your browser and processes limited device and
              browser signals on Cloudflare&apos;s servers to verify you are human; we do not
              receive the underlying signals ourselves. See{" "}
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--accent-cyan)] hover:underline active:underline"
              >
                Cloudflare&apos;s Privacy Policy
              </a>{" "}
              for details.
            </p>
          </Section>

          <Section id="how-we-use" title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Create and authenticate your account;</li>
              <li>Personalize your practice and track your learning progress;</li>
              <li>Power the leaderboard with your practice performance;</li>
              <li>Respond to question reports and support requests;</li>
              <li>Maintain the security, safety, and integrity of the service.</li>
            </ul>
            <p>
              <strong className="text-[var(--text-body)]">Leaderboard visibility.</strong> If you
              use the leaderboard, your full name, college, program, exams completed, correct
              answers, and accuracy are visible to other signed-in users of the Service. This
              information is not anonymized or aggregated — it identifies you by name. If you do
              not want this information visible to other users, contact us at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium text-[var(--accent-cyan)] hover:underline active:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section id="sharing" title="3. Sharing and Disclosure">
            <p>
              We do not sell your personal information. We share data only with service
              providers who help run the service (for example, authentication and database
              hosting) under appropriate confidentiality obligations, and when required by law
              or to protect our legal rights.
            </p>
          </Section>

          <Section id="aggregates" title="4. Aggregates and Anonymized Data">
            <p>
              We may use aggregated, de-identified statistics (for example, the number of
              questions answered or topic performance) to improve the product. Aggregates never
              include personally identifiable information.
            </p>
          </Section>

          <Section id="retention" title="5. Data Retention">
            <p>
              We keep your account and practice data for as long as your account is active.
              Account deletion is handled by our team on request (see{" "}
              <a href="#your-rights" className="font-medium text-[var(--accent-cyan)] hover:underline active:underline">
                Your Rights
              </a>{" "}
              below) rather than as a self-service action in the app. Once processed, your
              profile and practice data are removed; backup copies may take a short time to be
              purged by our hosting providers.
            </p>
          </Section>

          <Section id="your-rights" title="6. Your Rights">
            <p>
              Depending on where you live, you may have the right to access, correct, export,
              or delete your personal information. You can update your profile in-app. To
              request account deletion or data access, contact us at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium text-[var(--accent-cyan)] hover:underline active:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section id="cookies" title="7. Cookies and Authentication">
            <p>
              We use essential cookies and tokens to keep you signed in and secure. These are
              required for the service to function and are not used for advertising or
              cross-site tracking.
            </p>
            <p>
              We also use your browser&apos;s local storage to remember non-account preferences
              on your device, such as light/dark theme and whether you have completed the
              onboarding tutorial. This information stays on your device and is not sent to us.
            </p>
          </Section>

          <Section id="children" title="8. Children&apos;s Privacy">
            <p>
              The service is intended for adult medical students and practitioners. We do not
              knowingly collect information from children under 13. If you believe a child has
              provided us personal data, contact us and we will delete it.
            </p>
          </Section>

          <Section id="changes" title="9. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will note the
              &quot;Last updated&quot; date above. Continued use of the service after changes
              constitutes acceptance of the revised policy.
            </p>
          </Section>

          <Section id="contact" title="10. Contact Us">
            <p>
              Questions about this Privacy Policy can be sent to{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium text-[var(--accent-cyan)] hover:underline active:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </Section>

          <p className="mt-8 text-sm">
            <Link
              href="/"
              className="text-[var(--text-muted)] hover:text-[var(--accent-cyan)] active:text-[var(--accent-cyan)]"
            >
              &larr; Back to home
            </Link>
          </p>
        </article>
      </div>
    </LayoutWrapper>
  );
}
