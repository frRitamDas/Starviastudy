import { getSession, toStudentContext } from "@/lib/session";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { tutorMessageSchema } from "@/lib/validations";
import { reserveUsage, refundUsage } from "@/lib/usage/limits";
import { streamTutorResponse, generateTutorResponse } from "@/lib/ai";
import {
  addMessage,
  createConversation,
  deleteMessage,
  deriveTitle,
  getConversation,
  listMessages,
  touchConversation,
} from "@/lib/conversations";
import { awardProgress } from "@/lib/gamification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * AI Tutor — streaming endpoint.
 *
 * Order of operations (this order matters and must not be changed):
 *   authenticate → load plan → reserve a usage unit → call Gemini → record.
 * The unit is reserved before the model call so a burst of parallel requests
 * cannot exceed the daily limit, and refunded if the call fails.
 */
export async function POST(request: Request) {
  let refunded = false;
  let userId: string | null = null;

  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");
    userId = session.user.id;

    const limit = await rateLimit(clientKey(request, `tutor:${userId}`), 30, 60_000);
    if (!limit.allowed) {
      return fail("RATE_LIMITED", "You're sending messages too quickly. Please slow down.");
    }

    const body = await request.json();
    const parsed = tutorMessageSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Check your message.");
    }

    const { conversationId, message, subject, topic, difficulty } = parsed.data;

    // Enforce the daily plan limit before any database write, so a student who
    // is out of allowance never leaves an empty conversation behind.
    await reserveUsage(session.user.id, session.subscription.plan, "tutor");

    // Load or create the conversation, always scoped to this user.
    let activeConversationId = conversationId ?? null;
    if (activeConversationId) {
      const existing = await getConversation(session.user.id, activeConversationId);
      if (!existing) {
        await refundUsage(session.user.id, "tutor");
        refunded = true;
        return fail("NOT_FOUND", "That conversation no longer exists.");
      }
    } else {
      const created = await createConversation({
        userId: session.user.id,
        title: deriveTitle(message),
        subject: subject ?? null,
        topic: topic ?? null,
      });
      activeConversationId = created.id;
    }

    const history = await listMessages(session.user.id, activeConversationId);
    const priorTurns = history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    await addMessage({
      conversationId: activeConversationId,
      userId: session.user.id,
      role: "user",
      content: message,
    });

    const ctx = toStudentContext(session.profile);
    const encoder = new TextEncoder();
    let assistantText = "";

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          send("meta", { conversationId: activeConversationId });

          for await (const chunk of streamTutorResponse({
            userId: session.user.id,
            message,
            ctx,
            subject: subject ?? session.profile.subjects?.[0] ?? null,
            topic,
            difficulty,
            history: priorTurns,
          })) {
            assistantText += chunk;
            send("delta", { text: chunk });
          }

          if (!assistantText.trim()) {
            // Nothing usable came back — refund and report cleanly.
            await refundUsage(session.user.id, "tutor");
            refunded = true;
            send("error", { code: "AI_UNAVAILABLE", message: "AI is temporarily unavailable. Please try again." });
            controller.close();
            return;
          }

          const saved = await addMessage({
            conversationId: activeConversationId,
            userId: session.user.id,
            role: "assistant",
            content: assistantText,
          });
          await touchConversation(activeConversationId);

          const reward = await awardProgress({
            userId: session.user.id,
            action: "tutor_message",
          });

          send("done", {
            messageId: saved.id,
            conversationId: activeConversationId,
            xp: reward.xp,
            currentStreak: reward.currentStreak,
          });
          controller.close();
        } catch {
          if (!refunded) {
            await refundUsage(session.user.id, "tutor");
            refunded = true;
          }
          send("error", {
            code: "AI_UNAVAILABLE",
            message: "AI is temporarily unavailable. Please try again.",
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (userId && !refunded) {
      try {
        await refundUsage(userId, "tutor");
      } catch {
        /* best-effort */
      }
    }
    return handleApiError(error);
  }
}

/** Non-streaming tutor answer, used by "regenerate response". */
export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const body = await request.json();
    const conversationId = typeof body?.conversationId === "string" ? body.conversationId : null;
    const removeMessageId = typeof body?.removeMessageId === "string" ? body.removeMessageId : null;
    if (!conversationId) return fail("BAD_REQUEST", "Missing conversation.");

    const conversation = await getConversation(session.user.id, conversationId);
    if (!conversation) return fail("NOT_FOUND", "That conversation no longer exists.");

    const history = await listMessages(session.user.id, conversationId);
    const lastUser = [...history].reverse().find((m) => m.role === "user");
    if (!lastUser) return fail("BAD_REQUEST", "There is nothing to regenerate yet.");

    await reserveUsage(session.user.id, session.subscription.plan, "tutor");

    try {
      if (removeMessageId) await deleteMessage(session.user.id, removeMessageId);

      const ctx = toStudentContext(session.profile);
      const priorTurns = history
        .filter((m) => m.role === "user" || m.role === "assistant")
        .filter((m) => m.id !== removeMessageId && m.id !== lastUser.id)
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const answer = await generateTutorResponse({
        userId: session.user.id,
        message: lastUser.content,
        ctx,
        subject: conversation.subject,
        topic: conversation.topic,
        history: priorTurns,
      });

      const saved = await addMessage({
        conversationId,
        userId: session.user.id,
        role: "assistant",
        content: answer.text,
        model: answer.model,
      });
      await touchConversation(conversationId);

      return ok({ message: saved });
    } catch (error) {
      await refundUsage(session.user.id, "tutor");
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
