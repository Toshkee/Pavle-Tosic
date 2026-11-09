import { ABOUT, ABOUT_HEADING, NAME, PHOTO, ROLE, SPEC } from "../content";
import Zoomable from "../Zoomable";

/* "Who are you?": my photo (opens full size), name, the About copy and the
   checkable facts. */
export default function MeCard() {
  return (
    <article className="glass rounded-3xl p-6 sm:p-8">
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
      {/* On a phone each label sits over its value: side by side, the long
          ones wrapped into ragged right-aligned lines. Same on /about. */}
      <dl className="mt-6 divide-y divide-line border-y border-line text-sm">
        {SPEC.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-6">
            <dt className="shrink-0 text-faint">{label}</dt>
            <dd className="text-ink sm:text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
