import type { Metadata } from "next";
import CritterGallery from "./CritterGallery";

export const metadata: Metadata = {
  title: "Lab — character concepts",
  description:
    "Isolated sandbox: a gallery of ambient-character concepts (refined + new cast) idling in phosphor green.",
};

export default function LabPage() {
  return <CritterGallery />;
}
