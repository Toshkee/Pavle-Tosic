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
      {/* Montenegro, dusk to night, one photo per section. Unsplash License
          (free for commercial use): Vadym Merzlikin, Gunnar Kaplick,
          Sebastien Devocelle, Eirik Skarstein, Sergio. */}
      <MorphBackdrop
        slides={[
          { src: "/images/morph/kotor-night.webp", small: "/images/morph/kotor-night-sm.webp", sectionId: "about" },
          { src: "/images/morph/bay-haze.webp", small: "/images/morph/bay-haze-sm.webp", sectionId: "work" },
          { src: "/images/morph/perast-dusk.webp", small: "/images/morph/perast-dusk-sm.webp", sectionId: "clients" },
          { src: "/images/morph/bay-sunrise.webp", small: "/images/morph/bay-sunrise-sm.webp", sectionId: "log" },
          { src: "/images/morph/bay-sunset.webp", small: "/images/morph/bay-sunset-sm.webp", sectionId: "contact" },
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
