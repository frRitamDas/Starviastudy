"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/shared/copy-button";

/**
 * Markdown renderer for AI output.
 *
 * Supports GitHub-flavoured Markdown, LaTeX via KaTeX, tables and code blocks
 * with a copy button. Styling is intentionally restrained so answers read like
 * a textbook, not a chat log.
 */
export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("markdown text-sm leading-relaxed sm:text-[0.9375rem]", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-6 text-lg font-semibold first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2.5 mt-6 text-base font-semibold first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-5 text-sm font-semibold first:mt-0">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-3 ml-5 list-disc space-y-1.5 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-5 list-decimal space-y-1.5 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-4"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-2 border-border pl-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-5 border-border" />,
          table: ({ children }) => (
            <div className="mb-4 w-full overflow-x-auto rounded-xl border border-border">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-border px-3 py-2 text-left font-medium">{children}</th>
          ),
          td: ({ children }) => <td className="border-b border-border px-3 py-2">{children}</td>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          code: ({ className, children, ...props }) => {
            const isBlock = /language-/.test(className ?? "");
            if (!isBlock) {
              return (
                <code
                  className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[0.85em]"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            const language = className?.replace("language-", "") ?? "";
            const raw = String(children).replace(/\n$/, "");
            return (
              <div className="group relative mb-4 overflow-hidden rounded-xl border border-border bg-muted/40">
                <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
                  <span className="font-mono text-xs text-muted-foreground">{language || "code"}</span>
                  <CopyButton value={raw} label="Copy" className="opacity-0 group-hover:opacity-100" />
                </div>
                <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
                  <code className="font-mono">{raw}</code>
                </pre>
              </div>
            );
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
