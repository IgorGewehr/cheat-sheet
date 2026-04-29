"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy, FileCode } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Callout } from "./callout";

// Detect callouts: paragraph beginning with > [!info] / > [!warning] etc. (GFM-like)
const CALLOUT_RE = /^\s*\[!(info|tip|success|warning|danger)\]\s*(.*)$/i;

function CodeBlock({ children, node: _node, ...props }: ComponentProps<"pre"> & { node?: unknown }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  // try to extract a "fileName" from first child code className: language-ts:filename
  let fileName: string | undefined;
  let lang: string | undefined;
  // children = single code element
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = children;
  if (c?.props?.className) {
    const m = String(c.props.className).match(/language-([\w+-]+)(?::(.+))?/);
    if (m) {
      lang = m[1];
      fileName = m[2];
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(ref.current?.textContent ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-line">
      {(fileName || lang) && (
        <div className="flex items-center justify-between px-3 py-2 bg-card-hover border-b border-line text-xs">
          <div className="flex items-center gap-2 text-muted">
            {fileName && <FileCode className="w-3.5 h-3.5" />}
            <span className="font-mono">{fileName ?? lang}</span>
          </div>
          {lang && fileName && (
            <span className="text-subtle font-mono text-[10px]">{lang}</span>
          )}
        </div>
      )}
      <div className="relative">
        <pre ref={ref} {...props} className="!my-0 !rounded-none">
          {children}
        </pre>
        <button
          onClick={copy}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-1 text-xs rounded bg-zinc-700/80 text-zinc-100 hover:bg-zinc-600"
          aria-label="Copiar código"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

function Blockquote({ children }: { children?: ReactNode }) {
  // detect callout syntax: first text content [!warning] Title
  const arr = Array.isArray(children) ? children : [children];
  // first child is usually a paragraph
  const first = arr.find((c) => c && typeof c === "object");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstP: any = first;
  let calloutType: "info" | "tip" | "success" | "warning" | "danger" | null = null;
  let calloutTitle: string | undefined;
  let restChildren: ReactNode = children;

  if (firstP?.props?.children) {
    const inner = Array.isArray(firstP.props.children) ? firstP.props.children : [firstP.props.children];
    const firstText = typeof inner[0] === "string" ? inner[0] : "";
    const m = firstText.match(CALLOUT_RE);
    if (m) {
      calloutType = m[1].toLowerCase() as Exclude<typeof calloutType, null>;
      calloutTitle = m[2]?.trim() || undefined;
      // strip the first line from the first paragraph
      const newFirstText = firstText.replace(CALLOUT_RE, "").trim();
      const newInner = newFirstText ? [newFirstText, ...inner.slice(1)] : inner.slice(1);
      const newFirst = { ...firstP, props: { ...firstP.props, children: newInner } };
      const restArr = arr.map((c) => (c === first ? newFirst : c));
      restChildren = restArr;
    }
  }

  if (calloutType) {
    return (
      <Callout type={calloutType} title={calloutTitle}>
        {restChildren}
      </Callout>
    );
  }

  return <blockquote>{children}</blockquote>;
}

export function MarkdownRenderer({ body }: { body: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        pre: CodeBlock,
        blockquote: Blockquote,
      }}
    >
      {body}
    </ReactMarkdown>
  );
}
