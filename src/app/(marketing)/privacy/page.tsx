import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Starvia collects, uses and protects student data, including what is stored, who can see it, and your rights.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "2026-01-01";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated={UPDATED}>
      <p>
        Starvia ({siteConfig.name}) is a study platform for school students. This policy explains
        what we collect, why we collect it, and how it is protected. We have written it to be read,
        not to be skimmed past.
      </p>

      <LegalSection title="1. Information we collect">
        <p>We collect only what the product needs to work:</p>
        <ul>
          <li>
            <strong>Account information</strong> — your name, email address and, if you sign in with
            Google, the basic profile information Google shares with us.
          </li>
          <li>
            <strong>Study profile</strong> — your class, board, subjects, learning level and optional
            exam target. This is what lets the AI pitch answers at the right level.
          </li>
          <li>
            <strong>Learning activity</strong> — conversations with the AI tutor, generated
            tutorials, quizzes and attempts, flashcards, topic progress, streaks and XP.
          </li>
          <li>
            <strong>Usage records</strong> — how many AI requests you have made each day, which is
            how daily plan limits are enforced.
          </li>
          <li>
            <strong>Payment records</strong> — if you subscribe, we store the plan, amount, status
            and the identifiers returned by our payment provider. We never store your card details.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. What we do not collect">
        <p>
          We do not collect your phone number, your address, your date of birth, or your exact
          location. We do not ask for your school&apos;s name. We do not use advertising trackers or
          sell data to third parties.
        </p>
      </LegalSection>

      <LegalSection title="3. How we use your information">
        <ul>
          <li>To provide the study features you use — tutoring, tutorials, quizzes and planning.</li>
          <li>To adapt AI explanations to your class, board and subjects.</li>
          <li>To enforce plan limits and keep the service affordable for everyone.</li>
          <li>To show your progress, streaks and achievements back to you.</li>
          <li>To respond when you contact us.</li>
        </ul>
        <p>
          We do not use your study content to train AI models, and we do not sell or rent your
          information.
        </p>
      </LegalSection>

      <LegalSection title="4. AI processing">
        <p>
          When you ask the AI tutor a question, generate a tutorial or solve a problem, the content
          you provide is sent from our servers to Google&apos;s Gemini API so that a response can be
          generated. This happens server-side: your browser never holds the API key. Only the
          content needed for that request is sent.
        </p>
      </LegalSection>

      <LegalSection title="5. Storage and security">
        <ul>
          <li>
            Data is stored in Supabase (PostgreSQL) with Row Level Security enabled, so a signed-in
            student can only read and write their own rows.
          </li>
          <li>
            Secrets — the AI key, the Supabase service-role key and payment secrets — exist only in
            server-side environment variables and are never sent to the browser.
          </li>
          <li>All traffic is encrypted in transit using HTTPS.</li>
          <li>Payment verification is performed on our server, never in the browser.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Children's privacy">
        <p>
          Starvia is intended for school students and is designed to collect the minimum possible
          personal information. We do not serve advertising. If you are a parent or guardian and
          would like an account or its data removed, contact us and we will action the request.
        </p>
      </LegalSection>

      <LegalSection title="7. Your rights">
        <p>
          You can view and change your study profile at any time from the profile page. You can
          delete conversations, tutorials and flashcards from within the app. To delete your account
          and associated data entirely, email{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>.
        </p>
      </LegalSection>

      <LegalSection title="8. Data retention">
        <p>
          We keep your study data for as long as your account is active so your progress, streaks
          and history remain available. If you delete your account, your personal data and study
          content are removed.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to this policy">
        <p>
          If this policy changes in a way that affects you, we will update the date at the top of
          this page. Continued use of Starvia after a change means you accept the updated policy.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          Questions about privacy can be sent to{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a> or through the{" "}
          <Link href="/contact">contact page</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
