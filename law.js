/* =====================================================================
   law.js — renders an individual law page (law.html?id=slug) with an
   interactive, slider-driven animated demonstration.
   The animations themselves live in animations.js (window.PHYS_ANIM).
   ===================================================================== */

const $ = (id) => document.getElementById(id);

/* ---------- Theme toggle ---------- */
(function theme() {
  const btn = $("themeToggle");
  if (localStorage.getItem("physlab-theme") === "light") {
    document.body.setAttribute("data-theme", "light");
    btn.textContent = "☀️";
  }
  btn.addEventListener("click", () => {
    const light = document.body.getAttribute("data-theme") === "light";
    if (light) { document.body.removeAttribute("data-theme"); btn.textContent = "🌙"; localStorage.setItem("physlab-theme", "dark"); }
    else { document.body.setAttribute("data-theme", "light"); btn.textContent = "☀️"; localStorage.setItem("physlab-theme", "light"); }
  });
})();

/* ---------- Find the requested law ---------- */
const params = new URLSearchParams(location.search);
const slug = params.get("id");
// Search across every library (physics, chemistry, maths) for this slug,
// and remember which collection it belongs to so paging stays within it.
const COLLECTIONS = [window.PHYSICS_LAWS, window.CHEM_TOPICS, window.MATH_TOPICS].filter(Boolean);
let law = null, all = window.PHYSICS_LAWS || [];
for (const set of COLLECTIONS) {
  const found = set.find((l) => l.slug === slug);
  if (found) { law = found; all = set; break; }
}
const root = $("detail");

if (!law) {
  root.innerHTML = `
    <div class="not-found">
      <h1>Law not found</h1>
      <p>We couldn't find that law. Head back to the library to pick one.</p>
      <a class="btn btn-primary" href="index.html#laws">← Back to the Law Library</a>
    </div>`;
} else {
  document.title = `PhysicsLab — ${law.name}`;
  const idx = all.findIndex((l) => l.slug === slug);
  const prev = all[(idx - 1 + all.length) % all.length];
  const next = all[(idx + 1) % all.length];
  const controls = law.controls || [];

  root.innerHTML = `
    <article class="law-detail">
      <header class="law-hero">
        <span class="tag">${law.tag}</span>
        <h1>${law.name}</h1>
        <p class="discoverer">${law.by} · ${law.year}</p>
        <p class="lead">${law.statement}</p>
      </header>

      <section class="demo-block">
        <div class="demo-head">
          <h2>Try it yourself</h2>
          <span class="demo-hint">Drag the sliders ↓</span>
        </div>
        <canvas id="demoCanvas" width="720" height="420"></canvas>
        <div class="demo-controls" id="demoControls">
          ${controls.map((c) => `
            <label>${c.label}
              <span class="ctl-row">
                <input type="range" id="ctl-${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}" />
                <span class="ctl-val" id="val-${c.id}"></span>
                <span class="ctl-unit">${c.unit || ""}</span>
              </span>
            </label>`).join("")}
        </div>
        <div class="demo-readout" id="demoReadout"></div>
        <div class="demo-caption" id="demoCaption"></div>
      </section>

      <section class="formula-block">
        <h2>The formula</h2>
        <div class="formula big"><code>${law.eq}</code></div>
        <ul class="var-list">
          ${law.vars.map((v) => `<li><code>${v.sym}</code><span>${v.meaning}</span></li>`).join("")}
        </ul>
      </section>

      <section class="explain-block">
        <h2>In detail</h2>
        ${law.details.map((p) => `<p>${p}</p>`).join("")}
      </section>

      <section class="examples-block">
        <h2>Everyday examples</h2>
        <ul class="example-list">${law.examples.map((e) => `<li>${e}</li>`).join("")}</ul>
      </section>

      <nav class="law-pager">
        <a href="law.html?id=${prev.slug}" class="pager prev"><span>← Previous</span><strong>${prev.name}</strong></a>
        <a href="law.html?id=${next.slug}" class="pager next"><span>Next →</span><strong>${next.name}</strong></a>
      </nav>
    </article>`;

  // Live parameter object, kept in sync with the sliders + number boxes
  const P = {};
  controls.forEach((c) => (P[c.id] = c.value));
  controls.forEach((c) => {
    const inp = $("ctl-" + c.id);
    if (window.PHYS_makeEditable) window.PHYS_makeEditable(inp, $("val-" + c.id));
    inp.addEventListener("input", () => { P[c.id] = +inp.value; });
  });

  const runner = (window.PHYS_ANIM || {})[law.anim];
  if (runner) runner($("demoCanvas"), $("demoCaption"), P, $("demoReadout"));
}

/* ---------- Sidebar: mobile open/close (same as the front page) ---------- */
(function sidebar() {
  const bar = $("sidebar"), toggle = $("sidebarToggle");
  if (!bar || !toggle) return;
  const close = () => bar.classList.remove("open");
  toggle.addEventListener("click", (e) => { e.stopPropagation(); bar.classList.toggle("open"); });
  bar.querySelectorAll(".nav a").forEach((a) => a.addEventListener("click", close));
  document.addEventListener("click", (e) => { if (!bar.contains(e.target) && e.target !== toggle) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
})();

/* ---------- Sidebar search: jump to the home library with the query ---------- */
(function sideSearch() {
  const side = $("sideSearch");
  if (!side) return;
  const go = () => {
    const q = side.value.trim();
    location.href = "index.html" + (q ? `?q=${encodeURIComponent(q)}` : "") + "#laws";
  };
  side.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
})();
