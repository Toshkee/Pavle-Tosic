import type { Metadata } from "next";
import { headers } from "next/headers";
import Chat from "../site/Chat";

export const metadata: Metadata = {
  title: "Ask me anything | Pavle Tošić",
  description:
    "Ask Pavle Tošić about his projects, stack, experience and availability.",
  alternates: { canonical: "https://pavletosic.com/chat" },
  // Every /chat?q=... is a different question; the front page is the one
  // to index.
  robots: { index: false, follow: true },
};

/* Reads the starter question from ?q= on the server, so the first render
   already shows it and the request starts on mount. ?fit (the landing's
   Job fit tile) opens with the input waiting for a job ad instead.

   Only a question that came from this site's own pages (the landing form,
   a tile, a case study) is asked on arrival: the browser marks those
   requests Sec-Fetch-Site: same-origin, and a page cannot forge it. A link
   from anywhere else, or a typed address, only fills the input, so nobody
   can hand out a link that makes this site ask their question by itself. */
export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { q, fit } = await searchParams;
  const question = typeof q === "string" ? q.trim() : "";
  const ours = (await headers()).get("sec-fetch-site") === "same-origin";
  return (
    <Chat
      initialQuestion={(ours && question) || null}
      initialDraft={ours ? "" : question}
      initialFit={!question && fit !== undefined}
    />
  );
}
