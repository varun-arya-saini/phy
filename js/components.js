/* =====================================================================
   Shared UI built with plain DOM APIs — the vanilla equivalents of the
   former React components (QuickLinks, Sidebar, ThemeToggle, Hero,
   Library, footer). Imported by both home.js and law.js.
   ===================================================================== */
import { PHYS_ANIM } from "./animations/index.js";

/** True when we're on the home page (anything that isn't the law page). */
export function isHomePage() {
  return !/law\.html$/.test(window.location.pathname);
}

/** href to a home-page section — an in-page anchor on home, else a link back. */
function sectionHref(id) {
  return isHomePage() ? `#${id}` : `index.html#${id}`;
}

const el = (tag, props = {}, ...kids) => {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (v == null) return;
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function")
      node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k in node && k !== "list") node[k] = v;
    else node.setAttribute(k, v);
  });
  kids.flat().forEach((c) =>
    node.append(c instanceof Node ? c : document.createTextNode(c))
  );
  return node;
};

/* ----------------------------- Theme ----------------------------- */
function buildThemeToggle() {
  const btn = el("button", { class: "theme-toggle", title: "Toggle theme" });
  const render = () => {
    const light =
      document.documentElement.getAttribute("data-theme") === "light";
    btn.textContent = light ? "☀️ Theme" : "🌙 Theme";
  };
  btn.addEventListener("click", () => {
    const light =
      document.documentElement.getAttribute("data-theme") === "light";
    if (light) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("physlab-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("physlab-theme", "light");
    }
    render();
  });
  render();
  return btn;
}

/* --------------------------- Quick links -------------------------- */
export function mountQuickLinks() {
  const wrap = el(
    "div",
    { class: "quick-links" },
    el(
      "a",
      { href: sectionHref("laws"), class: "quick-link", title: "Physics Library" },
      el("span", { class: "ql-icon" }, "⚛"),
      el("span", { class: "ql-name" }, "Physics")
    ),
    el(
      "a",
      { href: sectionHref("chemistry"), class: "quick-link", title: "Chemistry Library" },
      el("span", { class: "ql-icon" }, "🧪"),
      el("span", { class: "ql-name" }, "Chemistry")
    ),
    el(
      "a",
      { href: sectionHref("maths"), class: "quick-link", title: "Maths Library" },
      el("span", { class: "ql-icon" }, "📐"),
      el("span", { class: "ql-name" }, "Maths")
    )
  );
  document.body.prepend(wrap);
}

/* ----------------------------- Sidebar ---------------------------- */
const NAV = [
  { id: "projectile", label: "🎯 Projectile Motion" },
  { id: "pendulum", label: "⏱ Simple Pendulum" },
  { id: "newton", label: "🛒 Newton's Second Law" },
  { id: "ohm", label: "💡 Ohm's Law" },
  { id: "hooke", label: "🔧 Hooke's Law" },
  { id: "laws", label: "📚 Physics Library" },
  { id: "chemistry", label: "🧪 Chemistry Library" },
  { id: "maths", label: "📐 Maths Library" },
];

export function mountSidebar() {
  const home = isHomePage();
  let jumped = false;
  let query = "";

  const toggle = el(
    "button",
    { class: "sidebar-toggle", title: "Menu", "aria-label": "Toggle menu" },
    "☰"
  );

  const input = el("input", {
    type: "text",
    class: "side-search-input",
    placeholder: home ? "Search laws…" : "Search laws… (Enter)",
    autocomplete: "off",
    "aria-label": "Search laws",
  });

  const navLinks = NAV.map((n) =>
    el(
      "a",
      {
        href: sectionHref(n.id),
        "data-id": n.id,
        onClick: () => aside.classList.remove("open"),
      },
      n.label
    )
  );

  const aside = el(
    "aside",
    { class: "sidebar", id: "sidebar" },
    el(
      "a",
      { href: "index.html", class: "brand" },
      el("span", { class: "logo" }, "⚛"),
      el("span", {}, "Physics", el("strong", {}, "Lab"))
    ),
    el(
      "div",
      { class: "side-search" },
      el("span", { class: "side-search-icon" }, "🔍"),
      input
    ),
    el("span", { class: "nav-heading" }, "Explore"),
    el("nav", { class: "nav" }, ...navLinks),
    buildThemeToggle()
  );

  document.body.prepend(aside);
  document.body.prepend(toggle);

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    aside.classList.toggle("open");
  });

  // Close the mobile drawer on outside click / Escape.
  document.addEventListener("click", (e) => {
    if (!aside.contains(e.target) && e.target !== toggle)
      aside.classList.remove("open");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") aside.classList.remove("open");
  });

  // Live search.
  input.addEventListener("input", () => {
    query = input.value;
    if (!home) return;
    window.dispatchEvent(
      new CustomEvent("physlab-sidesearch", { detail: query })
    );
    if (query && !jumped) {
      document
        .getElementById("laws")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      jumped = true;
    }
    if (!query) jumped = false;
  });
  input.addEventListener("keydown", (e) => {
    if (home || e.key !== "Enter") return;
    const q = query.trim();
    window.location.href =
      "index.html" + (q ? `?q=${encodeURIComponent(q)}` : "") + "#laws";
  });

  // Scroll-spy (home only): highlight the section currently in view.
  if (home) {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(
      Boolean
    );
    const byId = Object.fromEntries(
      navLinks.map((a) => [a.dataset.id, a])
    );
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            navLinks.forEach((a) => a.classList.remove("active"));
            byId[en.target.id]?.classList.add("active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
  }
}

/* ------------------------------ Hero ------------------------------ */
export function buildHero() {
  return el(
    "section",
    { class: "hero" },
    el(
      "div",
      { class: "hero-text" },
      el("h1", { html: 'See the laws of physics <em>come alive</em>.' }),
      el(
        "p",
        {},
        "Interactive practicals you can play with, the exact statements behind them, and the formulas that make them work — all in one place."
      ),
      el(
        "div",
        { class: "hero-actions" },
        el(
          "a",
          { class: "btn btn-primary", href: "#projectile" },
          "Start experimenting →"
        ),
        el("a", { class: "btn btn-ghost", href: "#laws" }, "Browse the laws")
      )
    ),
    el(
      "div",
      { class: "hero-orbit", "aria-hidden": "true" },
      el("div", { class: "nucleus" }),
      el("div", { class: "ring ring1" }, el("span", { class: "electron" })),
      el("div", { class: "ring ring2" }, el("span", { class: "electron" })),
      el("div", { class: "ring ring3" }, el("span", { class: "electron" }))
    )
  );
}

/* ----------------------------- Footer ----------------------------- */
export function buildFooter() {
  return el(
    "footer",
    { class: "site-footer" },
    el(
      "p",
      {},
      "Interactive Physics, Chemistry & Maths — explore the laws, play with the practicals, and read the formulas behind them."
    ),
    el(
      "p",
      { class: "muted" },
      "PhysicsLab · an interactive demonstration of classical physics"
    )
  );
}

/* ----------------------------- Library ---------------------------- */
/** Highlight every case-insensitive occurrence of `q` inside `text`. */
function highlightInto(node, text, q) {
  if (!q) {
    node.append(text);
    return;
  }
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${safe})`, "gi");
  text.split(re).forEach((part) => {
    if (part.toLowerCase() === q.toLowerCase() && part)
      node.append(el("mark", {}, part));
    else if (part) node.append(document.createTextNode(part));
  });
}

/**
 * A searchable grid of topic cards. Each card lazily starts its canvas
 * animation when it scrolls into view. Used for Physics, Chemistry & Maths.
 */
export function buildLibrary(cfg) {
  const {
    topics,
    noun = "topics",
    sectionId,
    title,
    sub,
    placeholder,
    connectSearch = false,
  } = cfg;

  let query = "";
  const started = new Set();
  const cards = [];

  const input = el("input", {
    type: "text",
    class: "search-input",
    placeholder,
    autocomplete: "off",
  });
  const clearBtn = el("button", { class: "search-clear", title: "Clear" }, "✕");
  clearBtn.style.display = "none";
  const count = el("p", { class: "search-count" });
  const grid = el("div", { class: "law-grid" });
  const noResults = el(
    "p",
    { class: "no-results" },
    `No ${noun} match your search. Try another keyword.`
  );
  noResults.style.display = "none";

  function startAnim(i) {
    if (started.has(i)) return;
    const topic = topics[i];
    const runner = PHYS_ANIM[topic.anim];
    const canvas = cards[i]?.querySelector("canvas");
    if (!runner || !canvas) return;
    const P = {};
    (topic.controls || []).forEach((c) => (P[c.id] = c.value));
    runner(canvas, { textContent: "" }, P, null);
    started.add(i);
  }

  // Build the cards once.
  topics.forEach((l, i) => {
    const h3 = el("h3", {});
    highlightInto(h3, l.name, "");
    const by = el("div", { class: "by" });
    highlightInto(by, l.by, "");
    const short = el("p", {});
    highlightInto(short, l.short, "");
    const code = el("code", {});
    highlightInto(code, l.eq, "");

    const card = el(
      "a",
      { href: `law.html?slug=${encodeURIComponent(l.slug)}`, class: "law-card", "data-idx": i },
      el("span", { class: "card-preview" }, el("canvas", { width: 720, height: 420 })),
      h3,
      by,
      short,
      el("div", { class: "eq" }, code),
      el("span", { class: "card-cta" }, "Open lesson →")
    );
    cards.push(card);
    grid.append(card);
  });

  function rerender() {
    const q = query.trim().toLowerCase();
    let shown = 0;
    topics.forEach((l, i) => {
      const hit = (l.name + " " + l.by + " " + l.short + " " + l.eq)
        .toLowerCase()
        .includes(q);
      cards[i].hidden = !hit;
      if (hit) shown++;
      // Re-highlight matched text.
      const card = cards[i];
      const h3 = card.querySelector("h3");
      const by = card.querySelector(".by");
      const short = card.querySelector("p");
      const code = card.querySelector(".eq code");
      [h3, by, short, code].forEach((n) => (n.textContent = ""));
      const qt = query.trim();
      highlightInto(h3, l.name, qt);
      highlightInto(by, l.by, qt);
      highlightInto(short, l.short, qt);
      highlightInto(code, l.eq, qt);
    });
    count.textContent = q
      ? `${shown} of ${topics.length} ${noun} match “${query.trim()}”`
      : `${topics.length} ${noun} in the library`;
    clearBtn.style.display = query.length > 0 ? "" : "none";
    noResults.style.display = shown === 0 ? "" : "none";
  }

  input.addEventListener("input", () => {
    query = input.value;
    rerender();
  });
  clearBtn.addEventListener("click", () => {
    query = "";
    input.value = "";
    rerender();
  });

  const section = el(
    "section",
    { id: sectionId, class: "library" },
    el("h2", { class: "section-title" }, title),
    el("p", { class: "section-sub" }, sub),
    el(
      "div",
      { class: "search-wrap" },
      el("span", { class: "search-icon" }, "🔍"),
      input,
      clearBtn
    ),
    count,
    grid,
    noResults
  );

  rerender();

  // Lazy-start each card's animation when it scrolls into view.
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          startAnim(Number(en.target.dataset.idx));
          io.unobserve(en.target);
        }
      });
    },
    { rootMargin: "120px" }
  );
  cards.forEach((c) => io.observe(c));

  // Physics library: honour ?q= carried over, and the sidebar's live search.
  if (connectSearch) {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      query = q;
      input.value = q;
      rerender();
      setTimeout(() => section.scrollIntoView(), 0);
    }
    window.addEventListener("physlab-sidesearch", (e) => {
      query = e.detail || "";
      input.value = query;
      rerender();
    });
  }

  return section;
}
