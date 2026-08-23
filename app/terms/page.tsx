import type { Metadata } from "next";
import Link from "next/link";
import LayoutWrapper from "@/components/LayoutWrapper";
import { SITE_NAME, SUPPORT_EMAIL, TERMS_EFFECTIVE_DATE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Terms of Service | ${SITE_NAME}`,
  description: `Terms of Service for using ${SITE_NAME}.`,
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

export default function TermsPage() {
  return (
    <LayoutWrapper>
      <div className="flex flex-1 flex-col py-8 md:py-12">
        <article className="hud-card fade-in w-full rounded-xl p-6 sm:p-8">
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent-cyan)]">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--text-heading)]">
            Terms of Service
          </h1>
          <p className="hud-muted mt-2 text-sm">
            Last updated: {TERMS_EFFECTIVE_DATE}
          </p>

          <p className="hud-muted mt-6 leading-relaxed">
            These Terms of Service (&quot;Terms&quot;) govern your use of {SITE_NAME}
            (&quot;the Service&quot;), which is developed and operated by an individual
            developer, not a registered company (&quot;we&quot;, &quot;our&quot;, or
            &quot;us&quot;). By accessing or using the Service, you agree to these Terms. If you
            do not agree, please do not use the Service.
          </p>

          <Section id="eligibility" title="1. Eligibility">
            <p>
              You must be at least 13 years old to use the Service. You are responsible for
              maintaining the confidentiality of your account credentials and for all activity
              under your account.
            </p>
          </Section>

          <Section id="account" title="2. Accounts">
            <p>
              You may create an account with an email address and password, or by signing in
              with Google. You agree to provide accurate information and to keep it current.
              Email-based signups require confirmation of your email address before you can
              sign in.
            </p>
          </Section>

          <Section id="acceptable-use" title="3. Acceptable Use">
            <p>You agree not to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Share, scrape, or redistribute the Service&apos;s question bank outside the Service;</li>
              <li>Use automated means to access the Service without permission;</li>
              <li>Attempt to access other users&apos; accounts or data;</li>
              <li>Interfere with or disrupt the Service or its underlying systems;</li>
              <li>Use the Service for any unlawful purpose.</li>
            </ul>
          </Section>

          <Section id="educational-purpose" title="4. Educational Purpose">
            <p>
              The Service provides practice questions for medical education. It is a study
              tool, not medical advice, and does not guarantee exam results. Always refer to
              official curriculum materials and qualified instructors for exam preparation.
            </p>
          </Section>

          <Section id="content" title="5. Content and Intellectual Property">
            <p>
              The question bank, branding, and software that make up the Service are owned by
              or licensed to us. You may use them only for your own study within the Service.
              Your practice data belongs to you, and your use of it is governed by our Privacy
              Policy.
            </p>
          </Section>

          <Section id="termination" title="6. Termination">
            <p>
              You may request deletion of your account at any time by contacting us at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium text-[var(--accent-cyan)] hover:underline active:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              . Deletion requests are processed by our team rather than performed automatically
              in-app. We may suspend or terminate your access if we reasonably believe you have
              violated these Terms.
            </p>
          </Section>

          <Section id="disclaimer" title="7. Disclaimer of Warranties">
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without
              warranties of any kind, whether express or implied, including fitness for a
              particular purpose. We do not warrant that the Service will be uninterrupted or
              error-free.
            </p>
          </Section>

          <Section id="liability" title="8. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, we will not be liable for any indirect,
              incidental, special, or consequential damages arising from your use of the
              Service. Our total liability will not exceed the amount you paid for the Service,
              if any, in the twelve months before the claim.
            </p>
          </Section>

          <Section id="fees" title="9. Fees">
            <p>
              The Service is currently offered free of charge. If we introduce paid features in
              the future, we will update these Terms and provide notice before any charges
              apply to you.
            </p>
          </Section>

          <Section id="governing-law" title="10. Governing Law">
            <p>
              These Terms are governed by the laws of Pakistan, without regard to
              conflict-of-law principles. Any disputes arising from these Terms or your use of
              the Service will be resolved in the competent courts of Pakistan.
            </p>
          </Section>

          <Section id="changes" title="11. Changes to These Terms">
            <p>
              We may update these Terms from time to time. Material changes will be reflected
              by the &quot;Last updated&quot; date above. Continued use of the Service after
              changes constitutes acceptance.
            </p>
          </Section>

          <Section id="contact" title="12. Contact">
            <p>
              Questions about these Terms can be sent to{" "}
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
