import Hero from "@/components/Hero";
import Projectile from "@/components/experiments/Projectile";
import Pendulum from "@/components/experiments/Pendulum";
import Newton from "@/components/experiments/Newton";
import Ohm from "@/components/experiments/Ohm";
import Hooke from "@/components/experiments/Hooke";
import Library from "@/components/Library";
import { PHYSICS_LAWS, CHEM_TOPICS, MATH_TOPICS } from "@/lib/data";

export default function Home() {
  return (
    <>
      <Hero />
      <main className="container">
        <Projectile />
        <Pendulum />
        <Newton />
        <Ohm />
        <Hooke />

        <Library
          topics={PHYSICS_LAWS}
          noun="laws"
          sectionId="laws"
          title="The Law Library"
          sub="The exact statements behind classical physics, in plain words."
          placeholder="Search laws — try “Newton”, “energy”, “F = ma”…"
          connectSearch
        />

        <Library
          topics={CHEM_TOPICS}
          noun="topics"
          sectionId="chemistry"
          title="The Chemistry Library"
          sub="Atoms, bonds, reactions and the rules they obey — each one interactive."
          placeholder="Search chemistry — try “atom”, “acid”, “pH”…"
        />

        <Library
          topics={MATH_TOPICS}
          noun="topics"
          sectionId="maths"
          title="The Maths Library"
          sub="From the number line to calculus — every idea you can drag, watch and explore."
          placeholder="Search maths — try “circle”, “slope”, “vector”…"
        />
      </main>
    </>
  );
}
