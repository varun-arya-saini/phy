/* =====================================================================
   Shared data for every library + the lesson pages. Each entry has a
   slug, statement, formula breakdown, examples, slider `controls`, and an
   `anim` id that maps to a runner in lib/animations.

   Plain data — safe to import from server or client components.
   ===================================================================== */
import { PHYSICS_LAWS } from "./laws.js";
import { CHEM_TOPICS } from "./chemistry.js";
import { MATH_TOPICS } from "./maths.js";

export { PHYSICS_LAWS, CHEM_TOPICS, MATH_TOPICS };

/** Every collection, in the order they appear on the home page. */
export const COLLECTIONS = [PHYSICS_LAWS, CHEM_TOPICS, MATH_TOPICS];

/** Flat list of every topic across all subjects. */
export const ALL_TOPICS = COLLECTIONS.flatMap((c) => c);

/**
 * Find a topic by slug and report which collection it belongs to, so the
 * lesson pager can stay within the same subject.
 * @returns {{ topic: object, collection: object[] } | null}
 */
export function findTopic(slug) {
  for (const collection of COLLECTIONS) {
    const topic = collection.find((t) => t.slug === slug);
    if (topic) return { topic, collection };
  }
  return null;
}
