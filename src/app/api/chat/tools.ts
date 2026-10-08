import type Anthropic from "@anthropic-ai/sdk";
import { PROJECTS } from "../../projects";
import { FUN } from "../../site/content";
import type { Card } from "../../chat-protocol";

/* The cards the model can put on screen. Each tool takes no input except
   show_project, and none of them fetch anything: calling one is the model
   saying "show this card", and the card renders from the same data files the
   prompt was built from. */

const SLUGS = PROJECTS.map((project) => project.slug);

const NO_INPUT: Anthropic.Tool.InputSchema = { type: "object", properties: {} };

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
];

// show_fun only exists once there is something true to show.
export const TOOLS = ALL_TOOLS.filter(
  (tool) => tool.name !== "show_fun" || FUN.length > 0,
);

/* Maps a model's tool call to a card, or null when the call is not one of
   ours (an unknown name, or a slug outside the enum: with eager input
   streaming the API does not check the input, so this does). */
export function toCard({ name, input }: Anthropic.ToolUseBlock): Card | null {
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
    default:
      return null;
  }
}
