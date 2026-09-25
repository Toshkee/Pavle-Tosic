import Nav from "./site/Nav";
import Hero from "./site/Hero";
import Spec from "./site/Spec";
import Features from "./site/Features";
import Field from "./site/Field";
import Inside from "./site/Inside";
import Log from "./site/Log";
import Order from "./site/Order";
import Footer from "./site/Footer";
import MorphBackdrop from "./site/MorphBackdrop";

/* Thin server shell. Every section is its own component under ./site so the
   client/server boundary stays explicit (Next 16 defaults to server) and this
   file never grows into the old 2,400-line page. */
export default function Home() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Nav />
      {/* One evening, dusk into night, in the hero's hand-painted anime
          style (AI-generated, Higgsfield z_image, credited in the footer):
          countryside at dusk, sky islands at sunset, a moonlit night sky, a
          night train over the sea. The moonlit sky is the batch's sunset
          cumulus graded to night offline (cool silver clouds, extra stars,
          the shooting star kept): at sunset it read as the islands again.
          The night train is lifted off its bridge and crosses it (the
          slide's `plane`, see MorphBackdrop). A painting can span a run of
          sections, and each section picks its weather layer (Ambience.tsx). */}
      <MorphBackdrop
        slides={[
          { src: "/images/morph/dusk-countryside.webp", small: "/images/morph/dusk-countryside-sm.webp", sectionIds: ["about"] },
          { src: "/images/morph/sky-islands.webp", small: "/images/morph/sky-islands-sm.webp", sectionIds: ["work", "clients"] },
          { src: "/images/morph/moonlit-sky.webp", small: "/images/morph/moonlit-sky-sm.webp", sectionIds: ["stack"] },
          {
            src: "/images/morph/night-train.webp",
            small: "/images/morph/night-train-sm.webp",
            sectionIds: ["log", "contact"],
            plane: "/images/morph/night-train-cars.webp",
          },
        ]}
      />
      <main id="main" className="relative">
        <Hero />
        {/* bridges the hero's black fade into the photo backdrop, no hard seam */}
        <div aria-hidden className="hero-seam" />
        <Spec />
        <Features />
        <Field />
        <Inside />
        <Log />
        <Order />
      </main>
      <Footer />
    </>
  );
}
