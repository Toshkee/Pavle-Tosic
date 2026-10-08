import ReactMarkdown, { type Components } from "react-markdown";

/* The model's answer. The prompt asks for light Markdown only, and this
   enforces it: anything outside the list is unwrapped to plain text, raw
   HTML is never rendered, and react-markdown's default URL transform drops
   javascript: and other unsafe link targets. */
const ALLOWED = ["p", "strong", "em", "ul", "ol", "li", "a", "code", "br"];

const components: Components = {
  a: ({ href, children }) => {
    const external = href?.startsWith("http");
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="link-underline font-medium text-ink"
      >
        {children}
      </a>
    );
  },
};

export default function Markdown({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-body sm:text-base [&_code]:rounded [&_code]:bg-surface [&_code]:px-1 [&_code]:text-[0.9em] [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown
        allowedElements={ALLOWED}
        unwrapDisallowed
        components={components}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
