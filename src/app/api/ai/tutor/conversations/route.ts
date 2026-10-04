import { getSession } from "@/lib/session";
import { fail, ok, handleApiError } from "@/lib/api/response";
import {
  deleteConversation,
  listConversations,
  listMessages,
  renameConversation,
} from "@/lib/conversations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** List the caller's conversations. */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const url = new URL(request.url);
    const conversationId = url.searchParams.get("id");

    if (conversationId) {
      const messages = await listMessages(session.user.id, conversationId);
      return ok({ messages });
    }

    const conversations = await listConversations(session.user.id);
    return ok({ conversations });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Rename a conversation. */
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const body = await request.json();
    const conversationId = typeof body?.conversationId === "string" ? body.conversationId : "";
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!conversationId || !title) return fail("BAD_REQUEST", "Missing conversation or title.");

    await renameConversation(session.user.id, conversationId, title);
    return ok({ renamed: true });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Delete a conversation and all of its messages. */
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const body = await request.json().catch(() => null);
    const conversationId =
      (typeof body?.conversationId === "string" && body.conversationId) ||
      new URL(request.url).searchParams.get("id");

    if (!conversationId) return fail("BAD_REQUEST", "Missing conversation.");

    await deleteConversation(session.user.id, conversationId);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
