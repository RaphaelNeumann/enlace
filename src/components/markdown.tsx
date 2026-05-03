import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface MarkdownProps {
  source: string;
  /** Wrapper class (use this to set max-width, alignment, font, etc.) */
  className?: string;
}

/**
 * Renders user-authored Markdown for the public site (story body, FAQ
 * answers, etc.). Uses `react-markdown` + `remark-gfm` so admins can
 * write headings, bold/italic, lists, blockquotes, links and tables in
 * the existing textarea fields. A minimal component override map keeps
 * the typography matching the site palette.
 *
 * Note: `react-markdown` already escapes raw HTML by default — we do
 * NOT pass `rehype-raw`, so admin input cannot inject scripts/styles.
 */
export function Markdown({ source, className }: MarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h3
              className="text-2xl md:text-3xl mt-6 mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h4
              className="text-xl md:text-2xl mt-5 mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {children}
            </h4>
          ),
          h3: ({ children }) => (
            <h5 className="text-lg md:text-xl tracking-[0.16em] uppercase mt-5 mb-2">
              {children}
            </h5>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed mb-3 last:mb-0">{children}</p>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 pl-4 italic opacity-90 my-3">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6 opacity-30" />,
          code: ({ children }) => (
            <code className="rounded px-1 py-[1px] text-[0.95em] bg-black/5">{children}</code>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
