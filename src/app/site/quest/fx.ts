import type { Dots } from "./dots";

/* The small stuff that answers a move: dust off his feet when he lands,
   runs, rolls or kicks off the air, coral sparks where the sword finds a
   bug, a blue spray when he picks something up (blue is what is there to
   collect). In world px, each bit gone in under a second. None under
   reduced motion. */

type Kind = "dust" | "spark" | "shine";
type Bit = { x: number; y: number; vx: number; vy: number; age: number; life: number; kind: Kind };

// Pulled down this hard, slowed this much each second.
const FALL: Record<Kind, number> = { dust: 60, spark: 700, shine: 120 };
const DRAG: Record<Kind, number> = { dust: 0.05, spark: 0.3, shine: 0.3 };

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

export class Fx {
  private bits: Bit[] = [];

  constructor(private on: boolean) {}

  /* Dust at his feet (x, y), pushed one way by `push` px/s. */
  dust(x: number, y: number, n: number, push = 0): void {
    if (!this.on) return;
    for (let i = 0; i < n; i++) {
      this.bits.push({
        x: x + rand(-10, 10),
        y: y - 2,
        vx: push + rand(-60, 60),
        vy: rand(-70, -20),
        age: 0,
        life: rand(0.3, 0.55),
        kind: "dust",
      });
    }
  }

  burst(x: number, y: number, n: number, kind: "spark" | "shine"): void {
    if (!this.on) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = rand(90, 260);
      this.bits.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 80,
        age: 0,
        life: rand(0.35, 0.7),
        kind,
      });
    }
  }

  update(dt: number): void {
    for (const b of this.bits) {
      b.age += dt;
      b.vy += FALL[b.kind] * dt;
      b.vx *= Math.pow(DRAG[b.kind], dt);
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
    this.bits = this.bits.filter((b) => b.age < b.life);
  }

  draw(grey: Dots, coral: Dots, blue: Dots, cam: number): void {
    for (const b of this.bits) {
      const q = 1 - b.age / b.life;
      const batch = b.kind === "dust" ? grey : b.kind === "spark" ? coral : blue;
      batch.add(b.x - cam, b.y, 1.1 + q * (b.kind === "dust" ? 0.6 : 1.1), q);
    }
  }
}
