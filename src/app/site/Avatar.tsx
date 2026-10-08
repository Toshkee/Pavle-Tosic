import Image from "next/image";
import { MEMOJI, NAME } from "./content";

/* My Memoji, at the centre of the landing page and on top of the chat.
   `busy` swaps in the one typing on a laptop while an answer is on its way,
   the way the reference's Memoji starts talking. */
export default function Avatar({
  className = "",
  busy = false,
  priority = false,
}: {
  className?: string;
  busy?: boolean;
  priority?: boolean;
}) {
  return (
    <Image
      src={busy ? MEMOJI.busy : MEMOJI.face}
      alt={NAME}
      width={320}
      height={320}
      priority={priority}
      className={`object-contain ${className}`}
    />
  );
}
