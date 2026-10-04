"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Shown when a student hits a daily AI limit.
 * The copy is encouraging, not scolding, and the upgrade path is one tap away.
 */
export function LimitDialog({
  open,
  onOpenChange,
  featureLabel,
  limit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureLabel: string;
  limit: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/60">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle>You&apos;ve reached today&apos;s limit</DialogTitle>
          <DialogDescription className="text-pretty">
            You&apos;ve used all {limit} {featureLabel} for today. Upgrade to keep learning without
            limits — or come back tomorrow, your allowance resets at midnight IST.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
          <Button asChild onClick={() => onOpenChange(false)}>
            <Link href="/pricing">See plans</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
