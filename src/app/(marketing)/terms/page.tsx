import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of Starvia, including plans, payments, acceptable use and limitations.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "2026-01-01";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated={UPDATED}>
      <p>
        These terms govern your use of Starvia ({siteConfig.name}). By creating an account or using
        the service, you agree to them. If you do not agree, please do not use Starvia.
      </p>

      <LegalSection title="1. Who can use Starvia">
        <p>
          Starvia is intended for school students. If you are under the age of majority in your
          jurisdiction, you should use Starvia with the knowledge of a parent or guardian, who is
          responsible for any subscription purchased.
        </p>
      </LegalSection>

      <LegalSection title="2. Your account">
        <p>
          You are responsible for keeping your login credentials secure and for activity that
          happens under your account. Provide accurate information when you sign up, and keep your
          study profile up to date so the AI can help you correctly.
        </p>
      </LegalSection>

      <LegalSection title="3. Plans, limits and fair use">
        <ul>
          <li>
            Each plan includes a daily allowance of AI features. Limits reset at midnight IST and are
            enforced on our servers.
          </li>
          <li>
            Attempting to bypass limits — including through multiple accounts, automated scripts, or
            manipulating requests — is a breach of these terms and may result in suspension.
          </li>
          <li>We may adjust limits or features with reasonable notice.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Payments and subscriptions">
        <ul>
          <li>Paid plans are billed monthly in Indian rupees through Razorpay.</li>
          <li>
            A plan is activated only after the payment is verified on our server. We do not accept a
            browser&apos;s claim that a payment succeeded.
          </li>
          <li>
            You may cancel at any time from your profile. A cancelled plan remains active until the
            end of the period you have already paid for, after which the account returns to the free
            plan.
          </li>
          <li>
            Except where required by law, payments already made are non-refundable. If something has
            gone wrong with a payment, contact us and we will look into it.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>Use Starvia for anything unlawful, or to harm or harass others.</li>
          <li>Attempt to gain access to another user&apos;s account or data.</li>
          <li>
            Probe, scan or attack the service, or attempt to extract our API keys, secrets or
            source.
          </li>
          <li>Resell, redistribute or scrape Starvia or its generated content at scale.</li>
          <li>Upload content that is illegal, abusive or infringes someone else&apos;s rights.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. AI-generated content">
        <p>
          Starvia uses AI to generate explanations, tutorials, quizzes and solutions. AI can make
          mistakes, even when it sounds confident. Starvia is built to state uncertainty rather than
          guess, but you should always cross-check important answers against your textbook or with a
          teacher. Starvia is a study aid, not a substitute for teaching or for official exam
          material.
        </p>
      </LegalSection>

      <LegalSection title="7. Your content">
        <p>
          You keep ownership of the questions, notes and other content you submit. You grant us the
          permission needed to store and process that content to provide the service — for example,
          to generate and save a tutorial you asked for.
        </p>
      </LegalSection>

      <LegalSection title="8. Availability">
        <p>
          We aim to keep Starvia available and fast, but the service is provided on an
          &ldquo;as is&rdquo; basis. AI features depend on third-party providers and may occasionally
          be unavailable or rate-limited. We may modify, suspend or discontinue features, and we
          will not be liable for interruptions beyond our reasonable control.
        </p>
      </LegalSection>

      <LegalSection title="9. Limitation of liability">
        <p>
          To the maximum extent permitted by law, Starvia is not liable for indirect or consequential
          losses, or for outcomes such as exam results. Our total liability for any claim relating to
          the service is limited to the amount you paid us in the twelve months before the claim.
        </p>
      </LegalSection>

      <LegalSection title="10. Termination">
        <p>
          You may stop using Starvia at any time and request deletion of your account. We may suspend
          or terminate accounts that breach these terms, abuse the service, or attempt to compromise
          its security.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to these terms">
        <p>
          We may update these terms as the product evolves. Material changes will be reflected in the
          date at the top of this page. Continued use after a change means you accept the updated
          terms.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>
          Questions about these terms can be sent to{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a> or through the{" "}
          <Link href="/contact">contact page</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
