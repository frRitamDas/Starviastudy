"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface FaqEntry {
  question: string;
  answer: string;
}

/** Accordion of frequently asked questions. */
export function FaqList({ items }: { items: FaqEntry[] }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((item, index) => (
        <AccordionItem key={item.question} value={`item-${index}`}>
          <AccordionTrigger className="text-left text-sm font-medium sm:text-base">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground text-pretty">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
