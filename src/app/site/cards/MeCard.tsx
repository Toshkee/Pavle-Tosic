import { ABOUT, ABOUT_HEADING, NAME, PHOTO, ROLE, SPEC } from "../content";
import Zoomable from "../Zoomable";

/* "Who are you?": my photo (opens full size), name, the About copy and the
   checkable facts. */
export default function MeCard() {
  return (
    <article className="rounded-3xl border border-line p-6 sm:p-8">
      <div className="flex items-center gap-5">
        <Zoomable
          media={{ kind: "image", src: PHOTO.src, full: PHOTO.full, alt: PHOTO.alt }}
          width={480}
          height={480}
          frameClassName="size-24 shrink-0 rounded-2xl sm:size-28"
          className="size-full object-cover"
        />
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-ink">{NAME}</h3>
          <p className="text-body">{ROLE}</p>
        </div>
      </div>
      <p className="mt-6 text-lg font-semibold text-ink">{ABOUT_HEADING}</p>
      {ABOUT.map((paragraph) => (
        <p key={paragraph} className="mt-3 text-[15px] leading-relaxed text-body">
          {paragraph}
        </p>
      ))}
      <dl className="mt-6 divide-y divide-line border-y border-line text-sm">
        {SPEC.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-6 py-2.5">
            <dt className="text-faint">{label}</dt>
            <dd className="text-right text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
