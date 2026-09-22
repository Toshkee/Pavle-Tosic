/* The Stack orbit's centre: a crafting table, "the tools I reach for" going
   round the thing you make things at. A CSS-3D cube, the same trick as
   VoxelMe.tsx: six backface-hidden faces cut from one 64x16 atlas
   (public/images/voxel/crafting-table.png, 1.6 KB, original 16x16 pixel
   art: grid on top, pickaxe on the front, hammer and saw on the sides),
   pixelated. It turns slowly on its own axis (CRAFTING BLOCK in
   globals.css); reduced motion leaves it at a three-quarter view. Purely
   decorative: the orbit around it already carries the accessible label. */

const FACES = ["front", "back", "right", "left", "top", "bottom"] as const;

export default function CraftingBlock() {
  return (
    <div className="craft" aria-hidden>
      <div className="craft__cube">
        {FACES.map((f) => (
          <span key={f} className={`craft__face craft__face--${f}`} />
        ))}
      </div>
    </div>
  );
}
