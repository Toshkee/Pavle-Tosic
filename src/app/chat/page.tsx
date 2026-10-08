import type { Metadata } from "next";
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
   already shows it and the request starts on mount. */
export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { q } = await searchParams;
  const question = typeof q === "string" ? q.trim() : "";
  return <Chat initialQuestion={question || null} />;
}
