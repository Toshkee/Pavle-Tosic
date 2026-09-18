import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Not found | Pavle Tošić",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-[100svh] flex-col justify-end px-6 pb-[12svh] md:px-[6vw]">
      <p className="mb-3 font-display text-[13px] font-medium uppercase tracking-[0.32em] text-body">
        404
      </p>
      <h1 className="wordmark text-[clamp(2.6rem,9vw,7rem)]">Not here.</h1>
      <p className="mt-6 max-w-[46ch] text-[15px] text-body">
        That page does not exist on this site. The work, the log and the
        contact details are all on the front page.
      </p>
      <p className="mt-6">
        <Link href="/" className="link-underline text-ink">
          Back to the front page
        </Link>
      </p>
    </main>
  );
}
