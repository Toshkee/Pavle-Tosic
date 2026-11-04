import { PROJECTS } from "../projects";
import { facts } from "../api/chat/prompt";
import { NAME, ROLE } from "../site/content";

/* /llms.txt: the site for AI crawlers and agents, in the llms.txt
   convention (a title, a summary, then sections). The facts are the same
   text the chat model reads, built from content.ts and projects.ts, so
   what a crawler learns here can never disagree with what the chat says.
   Static: prerendered at build and served from the asset cache. */

const SITE = "https://pavletosic.com";

export const dynamic = "force-static";

export function GET(): Response {
  const body = [
    `# ${NAME}`,
    `> ${ROLE} in Montenegro. This site is a chat that answers as him, from the facts below, plus a case study per project.`,
    "## Pages",
    [
      `- [Front page](${SITE}): the chat that answers as Pavle`,
      `- [About](${SITE}/about): the CV as a page`,
      `- [Case studies](${SITE}/work): every project, one page each`,
      ...PROJECTS.map(
        (project) =>
          `- [${project.title}](${SITE}/work/${project.slug}): case study`,
      ),
      `- [How this site is built](${SITE}/how-its-built): the engineering behind it`,
      `- [Toshkee's Quest](${SITE}/play): a small arcade game`,
      `- [Privacy](${SITE}/privacy): what the chat does with a question`,
    ].join("\n"),
    facts(SITE),
  ].join("\n\n");

  return new Response(`${body}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
