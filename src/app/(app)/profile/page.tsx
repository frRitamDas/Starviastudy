import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { PageContainer, PageHeader } from "@/components/shared/page";
import { ProfileForm } from "@/components/profile/profile-form";
import { SubscriptionPanel } from "@/components/profile/subscription-panel";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

/** Profile and subscription settings. */
export default async function ProfilePage() {
  const session = await getSession();
  if (!session) return null;

  const profile = session.profile;

  return (
    <PageContainer width="default">
      <PageHeader title="Profile" description="Update your details any time — the AI adapts instantly." />
      <div className="space-y-6">
        <SubscriptionPanel
          plan={session.subscription.plan}
          status={session.subscription.status}
          currentPeriodEnd={session.subscription.currentPeriodEnd}
          cancelAtPeriodEnd={session.subscription.cancelAtPeriodEnd}
        />
        <ProfileForm
          initial={{
            fullName: profile.full_name ?? "",
            classLevel: profile.class_level ?? "",
            board: profile.board ?? "",
            subjects: profile.subjects ?? [],
            learningLevel: profile.learning_level ?? "",
            examTarget: profile.exam_target ?? "",
          }}
        />
      </div>
    </PageContainer>
  );
}
