import Link from "next/link";
import { NAME } from "./content";
import ThemeToggle from "./ThemeToggle";

/* The top row of the pages outside the chat (/about, /work, /privacy): the
   breadcrumb on the left, the theme toggle on the right, so a visitor who
   picked dark on the landing page can switch back from here too. The last
   crumb is the page itself, so it is not a link. */
export default function Crumbs({
  trail,
}: {
  trail: { label: string; href?: string }[];
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <nav aria-label="Breadcrumb" className="text-[13px] text-faint">
        <Link href="/" className="transition-colors hover:text-ink">
          {NAME}
        </Link>
        {trail.map(({ label, href }) => (
          <span key={label}>
            <span aria-hidden> / </span>
            {href ? (
              <Link href={href} className="transition-colors hover:text-ink">
                {label}
              </Link>
            ) : (
              <span className="text-muted">{label}</span>
            )}
          </span>
        ))}
      </nav>
      <ThemeToggle />
    </div>
  );
}
