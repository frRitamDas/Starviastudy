import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata = { title: "Set up your profile" };
export const dynamic = "force-dynamic";

/**
 * Onboarding. Kept outside the app layout so it has no sidebar and no
 * bottom navigation — it is a single, focused flow.
 */
export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.profile.onboarded) redirect("/dashboard");

  return (
    <OnboardingWizard
      initial={{
        fullName: session.profile.full_name ?? "",
        classLevel: session.profile.class_level ?? "",
        board: session.profile.board ?? "",
        subjects: session.profile.subjects ?? [],
        learningLevel: session.profile.learning_level ?? "",
        examTarget: session.profile.exam_target ?? "",
      }}
    />
  );
}
