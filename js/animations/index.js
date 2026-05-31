/* =====================================================================
   The shared animation engine, assembled from the base physics engine
   plus the chemistry/maths additions. `PHYS_ANIM` maps an anim id to a
   runner: fn(canvas, captionEl, paramObj, readoutEl).

   These functions touch the DOM / canvas / requestAnimationFrame, so only
   import this from client components ("use client").
   ===================================================================== */
import { PHYS_ANIM as BASE, makeEditable } from "./base.js";
import { EXTRA_ANIM } from "./extra.js";

export const PHYS_ANIM = { ...BASE, ...EXTRA_ANIM };
export { makeEditable };
