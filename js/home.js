/* Entry point for index.html — assembles the home page, then wires up the
   global chrome (quick links + sidebar) once the sections exist so the
   sidebar's scroll-spy can find them. */
import {
  mountQuickLinks,
  mountSidebar,
  buildHero,
  buildLibrary,
  buildFooter,
} from "./components.js";
import {
  buildProjectile,
  buildPendulum,
  buildNewton,
  buildOhm,
  buildHooke,
} from "./experiments.js";
import { PHYSICS_LAWS, CHEM_TOPICS, MATH_TOPICS } from "./data/index.js";

const main = document.createElement("main");
main.className = "container";
main.append(
  buildProjectile(),
  buildPendulum(),
  buildNewton(),
  buildOhm(),
  buildHooke(),
  buildLibrary({
    topics: PHYSICS_LAWS,
    noun: "laws",
    sectionId: "laws",
    title: "The Law Library",
    sub: "The exact statements behind classical physics, in plain words.",
    placeholder: "Search laws — try “Newton”, “energy”, “F = ma”…",
    connectSearch: true,
  }),
  buildLibrary({
    topics: CHEM_TOPICS,
    noun: "topics",
    sectionId: "chemistry",
    title: "The Chemistry Library",
    sub: "Atoms, bonds, reactions and the rules they obey — each one interactive.",
    placeholder: "Search chemistry — try “atom”, “acid”, “pH”…",
  }),
  buildLibrary({
    topics: MATH_TOPICS,
    noun: "topics",
    sectionId: "maths",
    title: "The Maths Library",
    sub: "From the number line to calculus — every idea you can drag, watch and explore.",
    placeholder: "Search maths — try “circle”, “slope”, “vector”…",
  })
);

document.body.append(buildHero(), main, buildFooter());

mountSidebar();
mountQuickLinks();
