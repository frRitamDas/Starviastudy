"use client";

import * as React from "react";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { cn, relativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ConversationSummary {
  id: string;
  title: string;
  subject: string | null;
  topic: string | null;
  created_at: string;
  updated_at: string;
}

/** Conversation history list. Deleting is confirmed before it happens. */
export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  className,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="p-3">
        <Button variant="outline" className="w-full justify-start" size="sm" onClick={onNew}>
          <MessageSquarePlus className="h-4 w-4" />
          New conversation
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3 scrollbar-thin">
        {conversations.length ? (
          <ul className="flex flex-col gap-0.5">
            {conversations.map((conversation) => {
              const active = conversation.id === activeId;
              return (
                <li key={conversation.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 pr-9 text-left transition-colors",
                      active ? "bg-muted" : "hover:bg-muted/60",
                    )}
                  >
                    <span className="block truncate text-sm">{conversation.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {relativeTime(conversation.updated_at)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(conversation.id)}
                    aria-label={`Delete ${conversation.title}`}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            Your conversations will appear here.
          </p>
        )}
      </div>
    </div>
  );
}
