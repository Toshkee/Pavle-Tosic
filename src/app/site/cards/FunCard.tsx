import { FUN } from "../content";
import Zoomable from "../Zoomable";

/* "What do you do for fun?": hobbies and stories, each with its photos or
   clips; any of them opens full size when clicked. Rendered only once FUN
   has entries (see tools.ts). */
export default function FunCard() {
  return (
    <article className="rounded-3xl border border-line p-6 sm:p-8">
      <h3 className="text-xl font-bold tracking-tight text-ink">
        Off the clock
      </h3>
      <ul className="mt-5 grid gap-4 sm:grid-cols-3">
        {FUN.map((item) => (
          <li key={item.title} className="overflow-hidden rounded-2xl bg-surface">
            {/* One photo fills the 8:5 frame; two vertical clips share it
                as 4:5 halves. */}
            <div
              className={`grid aspect-[8/5] gap-px ${item.media.length > 1 ? "grid-cols-2" : ""}`}
            >
              {item.media.map((media) => (
                <Zoomable
                  key={media.src}
                  media={media}
                  width={media.kind === "video" ? 400 : 640}
                  height={media.kind === "video" ? 500 : 400}
                  frameClassName="h-full w-full"
                  className="h-full w-full object-cover"
                />
              ))}
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-ink">{item.title}</h4>
              <p className="mt-1 text-sm leading-relaxed text-body">
                {item.text}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
