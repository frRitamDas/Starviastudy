import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Message } from "@/types/database";

/** Conversation + message persistence helpers. All writes are server-side. */

export async function createConversation(params: {
  userId: string;
  title: string;
  subject?: string | null;
  topic?: string | null;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: params.userId,
      title: params.title.slice(0, 120),
      subject: params.subject ?? null,
      topic: params.topic ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error("conversation_create_failed");
  return data;
}

export async function getConversation(userId: string, conversationId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? null;
}

export async function listConversations(userId: string, limit = 50) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("conversations")
    .select("id, title, subject, topic, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function listMessages(userId: string, conversationId: string): Promise<Message[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function addMessage(params: {
  conversationId: string;
  userId: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string | null;
}): Promise<Message> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: params.conversationId,
      user_id: params.userId,
      role: params.role,
      content: params.content,
      model: params.model ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error("message_create_failed");
  return data;
}

/** Delete a single message (used by regenerate to drop the previous answer). */
export async function deleteMessage(userId: string, messageId: string) {
  const supabase = createAdminClient();
  await supabase.from("messages").delete().eq("id", messageId).eq("user_id", userId);
}

export async function deleteConversation(userId: string, conversationId: string) {
  const supabase = createAdminClient();
  await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId);
}

export async function touchConversation(conversationId: string) {
  const supabase = createAdminClient();
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

export async function renameConversation(
  userId: string,
  conversationId: string,
  title: string,
) {
  const supabase = createAdminClient();
  await supabase
    .from("conversations")
    .update({ title: title.slice(0, 120) })
    .eq("id", conversationId)
    .eq("user_id", userId);
}

/** A short, human title derived from the first question. */
export function deriveTitle(message: string) {
  const cleaned = message.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 60) return cleaned || "New conversation";
  return `${cleaned.slice(0, 57)}…`;
}
