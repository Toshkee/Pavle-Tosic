import type { Card } from "../../chat-protocol";
import { projectBySlug } from "../../projects";
import ContactCard from "./ContactCard";
import ExperienceCard from "./ExperienceCard";
import FunCard from "./FunCard";
import GithubCard from "./GithubCard";
import MeCard from "./MeCard";
import ProjectDetail from "./ProjectDetail";
import ProjectsCard from "./ProjectsCard";
import SkillsCard from "./SkillsCard";

/* One card the model chose to show. Every card renders from the same data
   files the system prompt is built from. */
export default function CardView({ card }: { card: Card }) {
  switch (card.kind) {
    case "me":
      return <MeCard />;
    case "projects":
      return <ProjectsCard />;
    case "project": {
      const project = projectBySlug(card.slug);
      return project ? (
        <div className="overflow-hidden rounded-3xl border border-line">
          <ProjectDetail project={project} />
        </div>
      ) : null;
    }
    case "skills":
      return <SkillsCard />;
    case "experience":
      return <ExperienceCard />;
    case "contact":
      return <ContactCard />;
    case "fun":
      return <FunCard />;
    case "github":
      return <GithubCard />;
  }
}
