import type Anthropic from "@anthropic-ai/sdk";
import { PROJECTS } from "../../projects";
import { FUN } from "../../site/content";
import type { Card, FitRow } from "../../chat-protocol";

/* The nine cards the model can put on screen. None of them fetch anything:
   calling one is the model saying "show this card". Eight render from the
   same data files the prompt was built from and take no input beyond
   show_project's slug; show_fit carries the model's own reading of a job
   ad, checked field by field in parseFit() below. */

const SLUGS = PROJECTS.map((project) => project.slug);

const NO_INPUT: Anthropic.Tool.InputSchema = { type: "object", properties: {} };

// A fit card lists the requirements that matter, not every line of the ad.
const FIT_ROWS = 8;
const FIT_CHARS = { role: 100, requirement: 120, evidence: 280 };
const MATCHES: FitRow["match"][] = ["yes", "partly", "no"];

const card = (
  name: string,
  description: string,
  input_schema: Anthropic.Tool.InputSchema = NO_INPUT,
): Anthropic.Tool => ({
  name,
  description,
  input_schema,
  // The input streams as it is generated instead of arriving in one burst,
  // and the API no longer validates it: toCard() below does.
  eager_input_streaming: true,
});

const ALL_TOOLS: Anthropic.Tool[] = [
  card(
    "show_me",
    "Show a card with my photo, short bio, location, languages and availability. Use when the visitor asks who I am or wants my background.",
  ),
  card(
    "show_projects",
    "Show a carousel of all my projects. Use when the visitor asks what I have built or worked on, or wants an overview of my work.",
  ),
  card(
    "show_project",
    "Show one project in detail: what it does, what I built, outcomes, stack and links. Use when the visitor asks about one specific project.",
    {
      type: "object",
      properties: { slug: { type: "string", enum: SLUGS } },
      required: ["slug"],
    },
  ),
  card(
    "show_skills",
    "Show my skills and tech stack, grouped. Use when the visitor asks what I work with, my stack, or my skills.",
  ),
  card(
    "show_experience",
    "Show my work history and education as timelines, as on my CV. Use when the visitor asks where I work or worked, my experience, or my education.",
  ),
  card(
    "show_contact",
    "Show my email, GitHub, LinkedIn and CV. Use when the visitor wants to contact me, hire me, see my CV, or asks about availability.",
  ),
  card(
    "show_fun",
    "Show my hobbies and what I do off the clock. Use when the visitor asks what I do for fun, my hobbies, or something personal and light.",
  ),
  card(
    "show_github",
    "Show my GitHub activity: public repositories, pushes in the last month, and when each project repo was last pushed. Use when the visitor asks whether I am active on GitHub, about open source, commits or recent coding activity.",
  ),
  card(
    "show_fit",
    "Show how I match a job ad the visitor pasted: one row per key requirement, each marked yes, partly or no, with the fact from my CV, projects or skills that backs it. Use only when the visitor pastes a job description or a list of requirements and wants to know if I fit.",
    {
      type: "object",
      properties: {
        role: {
          type: "string",
          description: "The job title as the ad gives it; omit when it has none.",
        },
        rows: {
          type: "array",
          minItems: 1,
          maxItems: FIT_ROWS,
          description: `Up to ${FIT_ROWS} of the ad's key requirements, the most important first.`,
          items: {
            type: "object",
            properties: {
              requirement: {
                type: "string",
                description: "The requirement in a few words, in the ad's language.",
              },
              match: {
                type: "string",
                enum: MATCHES,
                description:
                  "yes: a fact shows it directly. partly: only something close or smaller does. no: nothing in the facts shows it.",
              },
              evidence: {
                type: "string",
                description:
                  "One short sentence naming the fact: the project, job or skill. For no, say plainly that I have not done it.",
              },
              slug: {
                type: "string",
                enum: SLUGS,
                description: "The project that proves it, if one does.",
              },
            },
            required: ["requirement", "match", "evidence"],
          },
        },
      },
      required: ["rows"],
    },
  ),
];

// show_fun only exists once there is something true to show.
export const TOOLS = ALL_TOOLS.filter(
  (tool) => tool.name !== "show_fun" || FUN.length > 0,
);

const field = (value: unknown, max: number): string | null =>
  typeof value === "string" && value.trim() && value.length <= max
    ? value.trim()
    : null;

/* A fit card's input, from the model or back from the browser with the
   history. A row with a missing or overlong field, an unknown match or a
   slug outside the list is dropped; a card left with no rows is no card. */
function parseFit(input: unknown): Card | null {
  if (typeof input !== "object" || input === null || !("rows" in input)) {
    return null;
  }
  const { rows } = input;
  if (!Array.isArray(rows)) return null;
  const valid = rows.slice(0, FIT_ROWS).flatMap((row: unknown): FitRow[] => {
    if (typeof row !== "object" || row === null) return [];
    const { requirement, match, evidence, slug } = row as Record<string, unknown>;
    const text = field(requirement, FIT_CHARS.requirement);
    const proof = field(evidence, FIT_CHARS.evidence);
    const level = MATCHES.find((m) => m === match);
    if (!text || !proof || !level) return [];
    return [
      {
        requirement: text,
        match: level,
        evidence: proof,
        ...(typeof slug === "string" && SLUGS.includes(slug) && { slug }),
      },
    ];
  });
  const role = "role" in input ? field(input.role, FIT_CHARS.role) : null;
  return valid.length > 0 ? { kind: "fit", role, rows: valid } : null;
}

/* Maps a model's tool call to a card, or null when the call is not one of
   ours (an unknown name, or a slug outside the enum: with eager input
   streaming the API does not check the input, so this does). */
export function toCard({
  name,
  input,
}: Pick<Anthropic.ToolUseBlock, "name" | "input">): Card | null {
  switch (name) {
    case "show_me":
      return { kind: "me" };
    case "show_projects":
      return { kind: "projects" };
    case "show_project": {
      const slug =
        typeof input === "object" && input !== null && "slug" in input
          ? input.slug
          : undefined;
      return typeof slug === "string" && SLUGS.includes(slug)
        ? { kind: "project", slug }
        : null;
    }
    case "show_skills":
      return { kind: "skills" };
    case "show_experience":
      return { kind: "experience" };
    case "show_contact":
      return { kind: "contact" };
    case "show_fun":
      return FUN.length > 0 ? { kind: "fun" } : null;
    case "show_github":
      return { kind: "github" };
    case "show_fit":
      return parseFit(input);
    default:
      return null;
  }
}

/* The other way, for the history: the call that showed a card. */
export function toToolCall(card: Card): { name: string; input: object } {
  switch (card.kind) {
    case "project":
      return { name: "show_project", input: { slug: card.slug } };
    case "fit":
      return {
        name: "show_fit",
        input: { ...(card.role && { role: card.role }), rows: card.rows },
      };
    default:
      return { name: `show_${card.kind}`, input: {} };
  }
}

/* A card that came back from the browser with the history counts only if
   it is one the model could have shown. */
export function parseCard(value: unknown): Card | null {
  if (typeof value !== "object" || value === null || !("kind" in value)) {
    return null;
  }
  if (value.kind === "fit") return parseFit(value);
  const slug = "slug" in value ? value.slug : undefined;
  return typeof value.kind === "string"
    ? toCard({ name: `show_${value.kind}`, input: { slug } })
    : null;
}
