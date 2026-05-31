/* Entry point for law.html — renders a single lesson based on ?slug=, with
   the interactive "Try it yourself" demo driven by the shared animation
   engine. Replaces the former Next.js /law/[slug] dynamic route. */
import { mountQuickLinks, mountSidebar } from "./components.js";
import { findTopic } from "./data/index.js";
import { PHYS_ANIM } from "./animations/index.js";
import { editableRange } from "./utils.js";

const el = (tag, props = {}, ...kids) => {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (v == null) return;
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function")
      node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k in node) node[k] = v;
    else node.setAttribute(k, v);
  });
  kids.flat().forEach((c) =>
    node.append(c instanceof Node ? c : document.createTextNode(c))
  );
  return node;
};

const slug = new URLSearchParams(window.location.search).get("slug");
const found = slug ? findTopic(slug) : null;

const main = el("main", { class: "detail-main" });

if (!found) {
  main.append(
    el(
      "div",
      { class: "not-found" },
      el("h1", {}, "Law not found"),
      el("p", {}, "We couldn't find that law. Head back to the library to pick one."),
      el("a", { class: "btn btn-primary", href: "index.html#laws" }, "← Back to the Law Library")
    )
  );
  document.title = "PhysicsLab — Law";
} else {
  const { topic: law, collection } = found;
  document.title = `PhysicsLab — ${law.name}`;

  const idx = collection.findIndex((l) => l.slug === slug);
  const prev = collection[(idx - 1 + collection.length) % collection.length];
  const next = collection[(idx + 1) % collection.length];

  /* ---- "Try it yourself" demo block ---- */
  const canvas = el("canvas", { class: "demo-canvas", width: 720, height: 420 });
  const readout = el("div", { class: "demo-readout" });
  const caption = el("div", { class: "demo-caption" });
  const controlsWrap = el("div", { class: "demo-controls" });

  // One stable parameter object the engine closes over (mutated in place).
  const P = {};
  (law.controls || []).forEach((c) => {
    P[c.id] = c.value;
    controlsWrap.append(
      editableRange(
        { label: c.label, value: c.value, min: c.min, max: c.max, step: c.step, unit: c.unit || "" },
        (v) => {
          P[c.id] = v;
        }
      )
    );
  });

  const demo = el(
    "section",
    { class: "demo-block" },
    el(
      "div",
      { class: "demo-head" },
      el("h2", {}, "Try it yourself"),
      el("span", { class: "demo-hint" }, "Drag the sliders ↓")
    ),
    canvas,
    controlsWrap,
    readout,
    caption
  );

  /* ---- formula + variables ---- */
  const varList = el("ul", { class: "var-list" });
  law.vars.forEach((v) => {
    varList.append(
      el(
        "li",
        {},
        el("code", { html: v.sym }),
        el("span", { html: v.meaning })
      )
    );
  });

  const detailBlock = el("section", { class: "explain-block" }, el("h2", {}, "In detail"));
  law.details.forEach((para) => detailBlock.append(el("p", { html: para })));

  const exampleList = el("ul", { class: "example-list" });
  law.examples.forEach((e) => exampleList.append(el("li", { html: e })));

  const article = el(
    "article",
    { class: "law-detail" },
    el(
      "header",
      { class: "law-hero" },
      el("span", { class: "tag" }, law.tag),
      el("h1", {}, law.name),
      el("p", { class: "discoverer" }, `${law.by} · ${law.year}`),
      el("p", { class: "lead", html: law.statement })
    ),
    demo,
    el(
      "section",
      { class: "formula-block" },
      el("h2", {}, "The formula"),
      el("div", { class: "formula big" }, el("code", { html: law.eq })),
      varList
    ),
    detailBlock,
    el(
      "section",
      { class: "examples-block" },
      el("h2", {}, "Everyday examples"),
      exampleList
    ),
    el(
      "nav",
      { class: "law-pager" },
      el(
        "a",
        { href: `law.html?slug=${encodeURIComponent(prev.slug)}`, class: "pager prev" },
        el("span", {}, "← Previous"),
        el("strong", {}, prev.name)
      ),
      el(
        "a",
        { href: `law.html?slug=${encodeURIComponent(next.slug)}`, class: "pager next" },
        el("span", {}, "Next →"),
        el("strong", {}, next.name)
      )
    )
  );

  main.append(article);

  // Kick off the demo animation (engine drives its own rAF loop).
  const runner = PHYS_ANIM[law.anim];
  if (runner) runner(canvas, caption, P, readout);
}

document.body.append(main);

mountSidebar();
mountQuickLinks();
