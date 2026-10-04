import { createClient } from "@/lib/supabase/server";
import { ok, handleApiError } from "@/lib/api/response";

export const runtime = "nodejs";

/** Sign the current user out. */
export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return ok({ signedOut: true });
  } catch (error) {
    return handleApiError(error);
  }
}
