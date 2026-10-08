import Image from "next/image";
import { LuFileText, LuGithub, LuLinkedin } from "react-icons/lu";
import { EMAIL } from "../../contact";
import { MEMOJI, RESUME, SOCIAL, SPEC } from "../content";

const AVAILABILITY = SPEC.find((row) => row.label === "Availability")?.value;

/* "How can I reach you?": the address first, then the profiles and CV. */
export default function ContactCard() {
  const links = [
    { label: "GitHub", href: SOCIAL.github, Icon: LuGithub },
    { label: "LinkedIn", href: SOCIAL.linkedin, Icon: LuLinkedin },
    { label: "CV (PDF)", href: RESUME, Icon: LuFileText },
  ];

  return (
    <article className="relative overflow-hidden rounded-3xl border border-line p-6 sm:p-8 sm:pr-44">
      {/* The sticker's torso is cut flat 16px above its bottom edge, so it
          sits 7px low (16/320 of 144px) to stand on the card's border. It is
          the largest thing painted when the card lands, so it loads
          eagerly. */}
      <Image
        src={MEMOJI.call}
        alt=""
        width={320}
        height={320}
        loading="eager"
        className="pointer-events-none absolute right-4 -bottom-[7px] hidden size-36 object-contain sm:block"
      />
      {AVAILABILITY && (
        <p className="flex items-center gap-2 text-sm text-faint">
          <span aria-hidden className="size-2 rounded-full bg-emerald-500" />
          {AVAILABILITY}
        </p>
      )}
      <a
        href={`mailto:${EMAIL}`}
        className="mt-2 block text-2xl font-bold tracking-tight break-all text-ink hover:underline sm:text-3xl"
      >
        {EMAIL}
      </a>
      <ul className="mt-6 grid gap-2 sm:grid-cols-3">
        {links.map(({ label, href, Icon }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface"
            >
              <Icon aria-hidden className="size-[18px]" />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}
