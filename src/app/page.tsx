import SmoothScroll from "./SmoothScroll";
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
      <SmoothScroll />
      <Nav />
      <MorphBackdrop
        slides={[
          { src: "/images/morph/forest.webp", sectionId: "spec" },
          { src: "/images/morph/night-peak.webp", sectionId: "features" },
          { src: "/images/morph/lake.webp", sectionId: "field" },
          { src: "/images/morph/hills.webp", sectionId: "log" },
          { src: "/images/morph/beach.webp", sectionId: "order" },
        ]}
      />
      <main id="main" className="relative">
        <Hero />
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
