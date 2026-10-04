import { NextResponse } from "next/server";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { contactSchema } from "@/lib/validations";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public contact form endpoint.
 *
 * Unauthenticated by design, so it is strictly rate-limited per IP and stores
 * nothing that identifies the sender beyond what they typed. Messages are
 * reviewed in the admin panel.
 */
export async function POST(request: Request) {
  const limit = await rateLimit(clientKey(request, "contact"), 5, 10 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "RATE_LIMITED", message: "Too many messages. Please try again later." },
      },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "Something went wrong. Please try again." },
      },
      { status: 400 },
    );
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Please check your details.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const supabase = createAdminClient();
    const { name, email, topic, message } = parsed.data;
    // Stored without a user_id: this is not tied to an account.
    await supabase.from("feedback").insert({
      user_id: null,
      context: "contact_form",
      comment: `[${topic}] ${name} <${email}>\n\n${message}`,
    });
    return NextResponse.json({ ok: true, data: { received: true } });
  } catch (error) {
    console.error("[contact] failed to store message:", error);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL", message: "Something went wrong. Please try again." },
      },
      { status: 500 },
    );
  }
}
