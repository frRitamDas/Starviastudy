import { getSession } from "@/lib/session";
import { fail, ok, handleApiError } from "@/lib/api/response";
import { onboardingSchema, profileUpdateSchema } from "@/lib/validations";
import { updateProfile } from "@/lib/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Read the caller's profile. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");
    return ok({ profile: session.profile });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Update the caller's profile.
 * Onboarding sends the full payload and sets `onboarded`; the profile page
 * sends a partial update.
 */
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const body = await request.json();
    const isOnboarding = body?.mode === "onboarding";

    if (isOnboarding) {
      const parsed = onboardingSchema.safeParse(body);
      if (!parsed.success) {
        return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Check your details.");
      }
      const profile = await updateProfile(session.user.id, {
        full_name: parsed.data.fullName,
        class_level: parsed.data.classLevel,
        board: parsed.data.board,
        subjects: parsed.data.subjects,
        learning_level: parsed.data.learningLevel,
        exam_target: parsed.data.examTarget ?? null,
        onboarded: true,
      });
      return ok({ profile });
    }

    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Check your details.");
    }

    const d = parsed.data;
    const profile = await updateProfile(session.user.id, {
      ...(d.fullName !== undefined ? { full_name: d.fullName } : {}),
      ...(d.classLevel !== undefined ? { class_level: d.classLevel } : {}),
      ...(d.board !== undefined ? { board: d.board } : {}),
      ...(d.subjects !== undefined ? { subjects: d.subjects } : {}),
      ...(d.learningLevel !== undefined ? { learning_level: d.learningLevel } : {}),
      ...(d.examTarget !== undefined ? { exam_target: d.examTarget } : {}),
      ...(d.avatarUrl !== undefined ? { avatar_url: d.avatarUrl } : {}),
      onboarded: true,
    });

    return ok({ profile });
  } catch (error) {
    return handleApiError(error);
  }
}
