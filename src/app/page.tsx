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
      {/* One blocky world, golden hour to dawn, a biome per section:
          Minecraft-with-shaders voxel scenes (AI-generated, Higgsfield
          z_image, credited in the footer): cherry-blossom temple, sea cliffs,
          torii in the sea, minecart canyon, sunrise over the clouds. Each
          carries its own weather layer (Ambience.tsx). */}
      <MorphBackdrop
        slides={[
          { src: "/images/morph/voxel-sakura-temple.webp", small: "/images/morph/voxel-sakura-temple-sm.webp", sectionId: "about" },
          { src: "/images/morph/voxel-sea-cliffs.webp", small: "/images/morph/voxel-sea-cliffs-sm.webp", sectionId: "work" },
          { src: "/images/morph/voxel-torii-sea.webp", small: "/images/morph/voxel-torii-sea-sm.webp", sectionId: "clients" },
          { src: "/images/morph/voxel-rail-canyon.webp", small: "/images/morph/voxel-rail-canyon-sm.webp", sectionId: "log" },
          { src: "/images/morph/voxel-cloud-sunrise.webp", small: "/images/morph/voxel-cloud-sunrise-sm.webp", sectionId: "contact" },
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
