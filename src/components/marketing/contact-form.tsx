"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiClientError } from "@/lib/api/client";

const TOPICS = ["Support", "Bug report", "Wrong answer", "Feature request", "Other"];

/** Public contact form. Posts to a rate-limited server route. */
export function ContactForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [topic, setTopic] = React.useState(TOPICS[0]);
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || message.trim().length < 10) {
      toast.error("Please add your name, email and a message of at least 10 characters.");
      return;
    }
    setSending(true);
    try {
      await apiFetch("/api/contact", {
        method: "POST",
        json: { name: name.trim(), email: email.trim(), topic, message: message.trim() },
      });
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      toast.error(
        error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <h2 className="text-base font-semibold">Message sent</h2>
          <p className="max-w-sm text-sm text-muted-foreground text-pretty">
            Thanks for writing in. You&apos;ll get a reply at the email you provided, usually within
            1–2 working days.
          </p>
          <Button variant="outline" onClick={() => setSent(false)}>
            Send another
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send a message</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-name">Your name</Label>
              <Input
                id="c-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-email">Email</Label>
              <Input
                id="c-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={200}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-topic">Topic</Label>
            <select
              id="c-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-message">Message</Label>
            <Textarea
              id="c-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              maxLength={4000}
              placeholder="Tell us what happened, or what you'd like to see in Starvia."
              required
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={sending}>
              <Send className="h-4 w-4" />
              Send message
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
