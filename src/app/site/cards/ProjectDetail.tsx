import Link from "next/link";
import { LuArrowRight, LuExternalLink, LuGithub } from "react-icons/lu";
import { thumbOf, type Project } from "../../projects";
import Zoomable from "../Zoomable";

/* One project, in full: shown on its own when the model calls show_project,
   and inside the dialog when a carousel card is opened. */
export default function ProjectDetail({ project }: { project: Project }) {

  return (
    <article className="p-6 sm:p-8">
      <p className="text-sm text-faint">
        {project.role}, {project.context}
      </p>
      <h3 className="mt-1 text-3xl font-bold tracking-tight text-ink">
        {project.title}
      </h3>
      <p className="mt-3 max-w-[65ch] text-[15px] leading-relaxed text-body">
        {project.blurb}
      </p>

      {/* A fixed-height strip, so desktop stills and phone screens both
          keep their own shape; each opens full size when clicked. */}
      <ul className="no-scrollbar -mx-6 mt-6 flex snap-x gap-3 overflow-x-auto px-6 sm:-mx-8 sm:px-8">
        {project.gallery.map((image) => (
          <li key={image.src} className="shrink-0 snap-start">
            <Zoomable
              media={{
                kind: "image",
                src: thumbOf(image.src),
                full: image.src,
                alt: `${project.title}: ${image.label}`,
              }}
              width={project.phone ? 320 : 640}
              height={project.phone ? 692 : 400}
              frameClassName="rounded-xl border border-line bg-plate"
              className="h-44 w-auto sm:h-52"
            />
            <p className="mt-1.5 text-xs text-faint">{image.label}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        {project.kpis.map((kpi) => (
          // dt must come first in the markup; flex-col-reverse puts the
          // number on top.
          <div
            key={kpi.label}
            className="flex flex-col-reverse rounded-2xl bg-surface p-4"
          >
            <dt className="mt-0.5 text-sm text-faint">{kpi.label}</dt>
            <dd className="font-semibold text-ink">{kpi.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section>
          <h4 className="text-sm font-semibold text-ink">What I built</h4>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-body">
            {project.highlights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4 className="text-sm font-semibold text-ink">What shipped</h4>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-body">
            {project.result.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      </div>

      <ul className="mt-6 flex flex-wrap gap-2">
        {project.stack.map((tech) => (
          <li
            key={tech}
            className="rounded-full border border-line px-3 py-1 text-xs font-medium text-body"
          >
            {tech}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        {project.live && (
          <a
            href={project.live}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-85"
          >
            Visit {project.domain}
            <LuExternalLink aria-hidden className="size-3.5" />
          </a>
        )}
        {project.code && (
          <a
            href={project.code}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface"
          >
            <LuGithub aria-hidden className="size-4" />
            Code
          </a>
        )}
        <Link
          href={`/work/${project.slug}`}
          className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface"
        >
          Case study
          <LuArrowRight aria-hidden className="size-3.5" />
        </Link>
      </div>
      {project.note && (
        <p className="mt-3 text-xs text-faint">{project.note}</p>
      )}
    </article>
  );
}
