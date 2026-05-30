/* =====================================================================
   PhysicsLab — interactive simulations + law library
   Plain JS, no dependencies. Each experiment is self-contained.
   ===================================================================== */

/* ---------- small helpers ---------- */
const $ = (id) => document.getElementById(id);
const cssVar = (name) =>
  getComputedStyle(document.body).getPropertyValue(name).trim();

/* ---------- Theme toggle ---------- */
(function theme() {
  const btn = $("themeToggle");
  const saved = localStorage.getItem("physlab-theme");
  if (saved === "light") {
    document.body.setAttribute("data-theme", "light");
    btn.textContent = "☀️";
  }
  btn.addEventListener("click", () => {
    const light = document.body.getAttribute("data-theme") === "light";
    if (light) {
      document.body.removeAttribute("data-theme");
      btn.textContent = "🌙";
      localStorage.setItem("physlab-theme", "dark");
    } else {
      document.body.setAttribute("data-theme", "light");
      btn.textContent = "☀️";
      localStorage.setItem("physlab-theme", "light");
    }
  });
})();

/* =====================================================================
   1. PROJECTILE MOTION
   ===================================================================== */
(function projectile() {
  const canvas = $("projectileCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const ground = H - 30;

  const vel = $("pVel"), ang = $("pAng"), grav = $("pGrav");
  const velV = $("pVelVal"), angV = $("pAngVal"), gravV = $("pGravVal");
  const readout = $("pReadout");

  let t = 0, flying = false, raf = null;
  let v0, theta, g, scale, trail = [];

  function computeStats() {
    const v = +vel.value, a = (+ang.value * Math.PI) / 180, gg = +grav.value;
    const range = (v * v * Math.sin(2 * a)) / gg;
    const height = (v * v * Math.sin(a) ** 2) / (2 * gg);
    const flight = (2 * v * Math.sin(a)) / gg;
    return { range, height, flight };
  }

  function refreshLabels() {
    velV.textContent = vel.value;
    angV.textContent = ang.value;
    gravV.textContent = (+grav.value).toFixed(1);
    const s = computeStats();
    readout.textContent =
      `Range: ${s.range.toFixed(1)} m · Max height: ${s.height.toFixed(1)} m · Flight time: ${s.flight.toFixed(2)} s`;
    if (!flying) drawStatic();
  }

  function drawScene() {
    ctx.clearRect(0, 0, W, H);
    // sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, ground);
    sky.addColorStop(0, "rgba(91,140,255,0.10)");
    sky.addColorStop(1, "rgba(91,140,255,0.02)");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, ground);
    // ground
    ctx.fillStyle = cssVar("--accent");
    ctx.globalAlpha = 0.25;
    ctx.fillRect(0, ground, W, H - ground);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = cssVar("--accent");
    ctx.beginPath(); ctx.moveTo(0, ground); ctx.lineTo(W, ground); ctx.stroke();
  }

  function drawStatic() {
    drawScene();
    // launcher arrow showing angle
    const a = (+ang.value * Math.PI) / 180;
    const len = 55;
    ctx.strokeStyle = cssVar("--accent-2");
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(24, ground);
    ctx.lineTo(24 + Math.cos(a) * len, ground - Math.sin(a) * len);
    ctx.stroke();
    ctx.lineWidth = 1;
    // bob at start
    ctx.fillStyle = cssVar("--warn");
    ctx.beginPath();
    ctx.arc(24, ground, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function launch() {
    if (flying) cancelAnimationFrame(raf);
    const s = computeStats();
    v0 = +vel.value;
    theta = (+ang.value * Math.PI) / 180;
    g = +grav.value;
    // scale so the full range/height fits the canvas
    const maxX = Math.max(s.range, 1);
    const maxY = Math.max(s.height, 1);
    scale = Math.min((W - 50) / maxX, (ground - 30) / maxY);
    t = 0; trail = []; flying = true;
    step();
  }

  function step() {
    drawScene();
    const x = v0 * Math.cos(theta) * t;
    const y = v0 * Math.sin(theta) * t - 0.5 * g * t * t;
    const px = 24 + x * scale;
    const py = ground - y * scale;
    trail.push([px, py]);

    // trail
    ctx.strokeStyle = cssVar("--accent");
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    trail.forEach(([tx, ty], i) => (i ? ctx.lineTo(tx, ty) : ctx.moveTo(tx, ty)));
    ctx.stroke();
    ctx.globalAlpha = 1;

    // projectile
    ctx.fillStyle = cssVar("--warn");
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();

    t += 0.05;
    if (y < 0 && t > 0.1) { flying = false; drawStatic(); redrawTrail(); return; }
    raf = requestAnimationFrame(step);
  }

  function redrawTrail() {
    ctx.strokeStyle = cssVar("--accent");
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    trail.forEach(([tx, ty], i) => (i ? ctx.lineTo(tx, ty) : ctx.moveTo(tx, ty)));
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  [vel, ang, grav].forEach((el) => el.addEventListener("input", refreshLabels));
  $("pLaunch").addEventListener("click", launch);
  refreshLabels();
})();

/* =====================================================================
   2. SIMPLE PENDULUM
   ===================================================================== */
(function pendulum() {
  const canvas = $("pendulumCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const pivot = { x: W / 2, y: 40 };

  const lenEl = $("penLen"), gravEl = $("penGrav"), angEl = $("penAng");
  const lenV = $("penLenVal"), gravV = $("penGravVal"), angV = $("penAngVal");
  const readout = $("penReadout");
  const toggle = $("penToggle");

  let L, g, theta0, theta, omega = 0, running = true, raf = null;
  let last = null;

  function reset() {
    L = +lenEl.value;
    g = +gravEl.value;
    theta0 = (+angEl.value * Math.PI) / 180;
    theta = theta0;
    omega = 0;
    last = null;
    const T = 2 * Math.PI * Math.sqrt(L / g);
    readout.textContent = `Period: ${T.toFixed(2)} s · Frequency: ${(1 / T).toFixed(2)} Hz`;
  }

  function refreshLabels() {
    lenV.textContent = (+lenEl.value).toFixed(1);
    gravV.textContent = (+gravEl.value).toFixed(1);
    angV.textContent = angEl.value;
    reset();
  }

  function frame(ts) {
    if (!last) last = ts;
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;

    if (running) {
      // pendulum equation: angular acceleration = -(g/L) sin θ
      const pxPerM = 90; // visual scaling only
      const alpha = -(g / L) * Math.sin(theta);
      omega += alpha * dt;
      omega *= 0.999; // tiny damping so it looks natural
      theta += omega * dt;
    }

    draw();
    raf = requestAnimationFrame(frame);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const pxLen = 70 + (L / 3) * 200; // map 0.5–3 m to pixels
    const bob = {
      x: pivot.x + Math.sin(theta) * pxLen,
      y: pivot.y + Math.cos(theta) * pxLen,
    };

    // arc reference
    ctx.strokeStyle = cssVar("--line");
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(pivot.x, pivot.y, pxLen, Math.PI * 0.25, Math.PI * 0.75);
    ctx.stroke();
    ctx.setLineDash([]);

    // string
    ctx.strokeStyle = cssVar("--muted");
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(bob.x, bob.y);
    ctx.stroke();

    // pivot
    ctx.fillStyle = cssVar("--muted");
    ctx.beginPath();
    ctx.arc(pivot.x, pivot.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // bob
    const grd = ctx.createRadialGradient(bob.x - 5, bob.y - 5, 2, bob.x, bob.y, 20);
    grd.addColorStop(0, cssVar("--accent-2"));
    grd.addColorStop(1, cssVar("--accent"));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(bob.x, bob.y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1;
  }

  toggle.addEventListener("click", () => {
    running = !running;
    toggle.textContent = running ? "Pause ⏸" : "Play ▶";
    if (running) last = null;
  });
  [lenEl, gravEl, angEl].forEach((el) => el.addEventListener("input", refreshLabels));
  refreshLabels();
  raf = requestAnimationFrame(frame);
})();

/* =====================================================================
   3. NEWTON'S SECOND LAW  (cart on a track)
   ===================================================================== */
(function newton() {
  const canvas = $("newtonCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const trackY = H / 2 + 40;

  const forceEl = $("nForce"), massEl = $("nMass");
  const forceV = $("nForceVal"), massV = $("nMassVal");
  const readout = $("nReadout");

  let x = 60, v = 0, a = 0, pushing = false, raf = null, last = null;

  function refreshLabels() {
    forceV.textContent = forceEl.value;
    massV.textContent = massEl.value;
    a = +forceEl.value / +massEl.value;
    updateReadout();
    if (!pushing) draw();
  }
  function updateReadout() {
    readout.textContent = `Acceleration: ${a.toFixed(2)} m/s² · Velocity: ${v.toFixed(2)} m/s`;
  }

  function reset() {
    pushing = false; x = 60; v = 0; last = null;
    a = +forceEl.value / +massEl.value;
    updateReadout(); draw();
  }

  function frame(ts) {
    if (!last) last = ts;
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;
    if (pushing) {
      a = +forceEl.value / +massEl.value;
      v += a * dt * 12; // visual gain
      x += v * dt;
      if (x > W - 70) { x = W - 70; v = 0; pushing = false; }
      updateReadout();
    }
    draw();
    raf = requestAnimationFrame(frame);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // track
    ctx.strokeStyle = cssVar("--muted");
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(30, trackY + 26); ctx.lineTo(W - 30, trackY + 26); ctx.stroke();

    // cart size scales with mass
    const m = +massEl.value;
    const cw = 44 + m * 4;
    const ch = 26 + m * 1.5;
    const cx = x, cy = trackY + 26 - ch;

    // body
    ctx.fillStyle = cssVar("--accent");
    roundRect(ctx, cx, cy, cw, ch, 6); ctx.fill();
    // wheels
    ctx.fillStyle = cssVar("--text");
    [cx + 12, cx + cw - 12].forEach((wx) => {
      ctx.beginPath(); ctx.arc(wx, trackY + 26, 7, 0, Math.PI * 2); ctx.fill();
    });
    // mass label
    ctx.fillStyle = "#fff";
    ctx.font = "600 13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(m + " kg", cx + cw / 2, cy + ch / 2 + 4);

    // force arrow
    const f = +forceEl.value;
    if (f > 0) {
      const alen = 20 + f * 0.9;
      ctx.strokeStyle = cssVar("--warn");
      ctx.fillStyle = cssVar("--warn");
      ctx.lineWidth = 4;
      const ay = cy + ch / 2;
      ctx.beginPath(); ctx.moveTo(cx - alen, ay); ctx.lineTo(cx - 4, ay); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 4, ay); ctx.lineTo(cx - 14, ay - 7); ctx.lineTo(cx - 14, ay + 7);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = cssVar("--warn");
      ctx.font = "600 12px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(f + " N", cx - alen - 4, ay - 10);
    }
    ctx.lineWidth = 1;
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  $("nPush").addEventListener("click", () => { pushing = true; last = null; });
  $("nReset").addEventListener("click", reset);
  [forceEl, massEl].forEach((el) => el.addEventListener("input", refreshLabels));
  refreshLabels();
  raf = requestAnimationFrame(frame);
})();

/* =====================================================================
   4. OHM'S LAW  (live circuit)
   ===================================================================== */
(function ohm() {
  const canvas = $("ohmCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  const voltEl = $("oVolt"), resEl = $("oRes");
  const voltV = $("oVoltVal"), resV = $("oResVal");
  const readout = $("oReadout");

  let phase = 0, raf = null;

  function stats() {
    const V = +voltEl.value, R = +resEl.value;
    const I = V / R;
    const P = V * I;
    return { V, R, I, P };
  }

  function refreshLabels() {
    voltV.textContent = (+voltEl.value).toFixed(1);
    resV.textContent = resEl.value;
    const s = stats();
    readout.textContent = `Current: ${s.I.toFixed(2)} A · Power: ${s.P.toFixed(1)} W`;
  }

  function frame() {
    const s = stats();
    ctx.clearRect(0, 0, W, H);

    // circuit rectangle path
    const L = 90, R = W - 90, T = 90, B = H - 70;
    ctx.strokeStyle = cssVar("--muted");
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.rect(L, T, R - L, B - T);
    ctx.stroke();

    // battery (left side)
    ctx.strokeStyle = cssVar("--accent-2");
    ctx.lineWidth = 4;
    const my = (T + B) / 2;
    ctx.beginPath(); ctx.moveTo(L, my - 16); ctx.lineTo(L, my + 16); ctx.stroke(); // long
    ctx.beginPath(); ctx.moveTo(L - 8, my - 8); ctx.lineTo(L - 8, my + 8); ctx.stroke();
    ctx.fillStyle = cssVar("--text");
    ctx.font = "600 13px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(s.V.toFixed(1) + " V", L - 16, my + 4);

    // resistor (top, zig-zag) — bigger zig for higher R
    ctx.strokeStyle = cssVar("--warn");
    ctx.lineWidth = 3;
    const rx = (L + R) / 2 - 40, ry = T;
    const amp = 5 + s.R * 0.4;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    for (let i = 0; i < 8; i++) {
      ctx.lineTo(rx + i * 10 + 5, ry + (i % 2 ? amp : -amp));
    }
    ctx.lineTo(rx + 80, ry);
    ctx.stroke();
    ctx.fillStyle = cssVar("--warn");
    ctx.textAlign = "center";
    ctx.fillText(s.R + " Ω", rx + 40, ry - 14);

    // bulb (right side) — brightness ∝ power
    const bx = R, by = my;
    const brightness = Math.min(s.P / 60, 1);
    ctx.fillStyle = `rgba(255, 200, 60, ${0.15 + brightness * 0.85})`;
    ctx.beginPath(); ctx.arc(bx, by, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = cssVar("--warn"); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(bx, by, 16, 0, Math.PI * 2); ctx.stroke();
    if (brightness > 0.05) {
      ctx.fillStyle = `rgba(255, 220, 120, ${brightness * 0.35})`;
      ctx.beginPath(); ctx.arc(bx, by, 16 + brightness * 18, 0, Math.PI * 2); ctx.fill();
    }

    // current flow dots — speed ∝ current
    const speed = Math.min(s.I, 8);
    phase += speed * 0.6;
    const perim = perimeterPoints(L, T, R, B, 40);
    ctx.fillStyle = cssVar("--accent");
    for (let i = 0; i < perim.length; i++) {
      if ((i + Math.floor(phase)) % 4 === 0) {
        const p = perim[i];
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.lineWidth = 1;
    raf = requestAnimationFrame(frame);
  }

  function perimeterPoints(L, T, R, B, n) {
    const pts = [];
    const top = []; for (let i = 0; i <= n; i++) top.push({ x: L + ((R - L) * i) / n, y: T });
    const right = []; for (let i = 0; i <= n; i++) right.push({ x: R, y: T + ((B - T) * i) / n });
    const bot = []; for (let i = 0; i <= n; i++) bot.push({ x: R - ((R - L) * i) / n, y: B });
    const left = []; for (let i = 0; i <= n; i++) left.push({ x: L, y: B - ((B - T) * i) / n });
    return pts.concat(top, right, bot, left);
  }

  [voltEl, resEl].forEach((el) => el.addEventListener("input", refreshLabels));
  refreshLabels();
  raf = requestAnimationFrame(frame);
})();

/* =====================================================================
   5. HOOKE'S LAW  (hanging spring)
   ===================================================================== */
(function hooke() {
  const canvas = $("hookeCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const topY = 40, anchorX = W / 2;

  const kEl = $("hk"), mEl = $("hm");
  const kV = $("hkVal"), mV = $("hmVal");
  const readout = $("hReadout");

  const G = 9.8;
  let targetExt = 0, ext = 0, raf = null;

  function refreshLabels() {
    kV.textContent = kEl.value;
    mV.textContent = (+mEl.value).toFixed(1);
    const F = +mEl.value * G;          // weight stretching the spring
    const k = +kEl.value;
    const x = F / k;                   // extension in metres
    targetExt = x;
    readout.textContent = `Extension: ${(x * 100).toFixed(1)} cm · Restoring force: ${F.toFixed(1)} N`;
  }

  function frame() {
    ext += (targetExt - ext) * 0.12; // ease toward target (springy)
    draw();
    raf = requestAnimationFrame(frame);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // ceiling
    ctx.fillStyle = cssVar("--muted");
    ctx.fillRect(anchorX - 60, topY - 12, 120, 8);
    for (let i = -55; i < 60; i += 12) {
      ctx.beginPath();
      ctx.moveTo(anchorX + i, topY - 12);
      ctx.lineTo(anchorX + i - 8, topY - 22);
      ctx.strokeStyle = cssVar("--muted");
      ctx.stroke();
    }

    const naturalLen = 110;
    const springLen = naturalLen + ext * 260; // px per metre of extension
    const coils = 10;
    const bobY = topY + springLen;

    // spring coils
    ctx.strokeStyle = cssVar("--accent");
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(anchorX, topY);
    const segs = coils * 2;
    for (let i = 1; i <= segs; i++) {
      const y = topY + (springLen * i) / segs;
      const x = anchorX + (i % 2 ? 16 : -16);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(anchorX, bobY);
    ctx.stroke();

    // mass block
    const m = +mEl.value;
    const size = 34 + m * 4;
    const grd = ctx.createLinearGradient(0, bobY, 0, bobY + size);
    grd.addColorStop(0, cssVar("--accent-2"));
    grd.addColorStop(1, cssVar("--accent"));
    ctx.fillStyle = grd;
    ctx.fillRect(anchorX - size / 2, bobY, size, size);
    ctx.fillStyle = "#06223a";
    ctx.font = "700 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(m + " kg", anchorX, bobY + size / 2 + 5);

    // measurement bracket
    ctx.strokeStyle = cssVar("--warn");
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(anchorX + 90, topY + naturalLen);
    ctx.lineTo(anchorX + 90, bobY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = cssVar("--warn");
    ctx.font = "600 12px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`x = ${(ext * 100).toFixed(1)} cm`, anchorX + 96, (topY + naturalLen + bobY) / 2);
    ctx.lineWidth = 1;
  }

  [kEl, mEl].forEach((el) => el.addEventListener("input", refreshLabels));
  refreshLabels();
  raf = requestAnimationFrame(frame);
})();

/* =====================================================================
   LAW LIBRARY  (cards)
   ===================================================================== */
(function library() {
  const laws = window.PHYSICS_LAWS || [];
  const grid = $("lawGrid");
  const search = $("lawSearch");
  const clearBtn = $("searchClear");
  const count = $("searchCount");
  const noResults = $("noResults");

  function highlight(str, q) {
    if (!q) return str;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return str.replace(re, "<mark>$1</mark>");
  }

  // Build every card ONCE (so the canvases/animations are never thrown away).
  const cards = laws.map((l) => {
    const a = document.createElement("a");
    a.className = "law-card";
    a.href = `law.html?id=${l.slug}`;
    a.innerHTML = `
      <span class="card-preview"><canvas width="720" height="420"></canvas></span>
      <h3></h3>
      <div class="by"></div>
      <p></p>
      <div class="eq"><code></code></div>
      <span class="card-cta">Open lesson →</span>`;
    grid.appendChild(a);
    return {
      law: l,
      el: a,
      canvas: a.querySelector("canvas"),
      h3: a.querySelector("h3"),
      byEl: a.querySelector(".by"),
      pEl: a.querySelector("p"),
      eqEl: a.querySelector(".eq code"),
      started: false,
    };
  });

  // Start each card's animation only when it first scrolls into view.
  const dummyCap = { textContent: "" }; // animations write a caption; cards ignore it
  function startAnim(card) {
    if (card.started) return;
    const runner = (window.PHYS_ANIM || {})[card.law.anim];
    if (!runner) return;
    const P = {};
    (card.law.controls || []).forEach((c) => (P[c.id] = c.value));
    runner(card.canvas, dummyCap, P, null); // no readout on the card preview
    card.started = true;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { startAnim(en.target.__card); io.unobserve(en.target); } });
  }, { rootMargin: "120px" });
  cards.forEach((c) => { c.el.__card = c; io.observe(c.el); });

  // Search just shows/hides cards and refreshes the highlighted text.
  function applyFilter(q = "") {
    const query = q.trim().toLowerCase();
    let shown = 0;
    cards.forEach((c) => {
      const l = c.law;
      const hit = (l.name + " " + l.by + " " + l.short + " " + l.eq).toLowerCase().includes(query);
      c.el.hidden = !hit;
      if (hit) {
        shown++;
        c.h3.innerHTML = highlight(l.name, query);
        c.byEl.innerHTML = highlight(l.by, query);
        c.pEl.innerHTML = highlight(l.short, query);
        c.eqEl.innerHTML = highlight(l.eq, query);
        if (isInViewport(c.el)) startAnim(c);
      }
    });
    noResults.hidden = shown > 0;
    count.textContent = query
      ? `${shown} of ${laws.length} laws match “${q.trim()}”`
      : `${laws.length} laws in the library`;
  }
  function isInViewport(el) {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  }

  search.addEventListener("input", () => {
    clearBtn.hidden = search.value.length === 0;
    applyFilter(search.value);
  });
  clearBtn.addEventListener("click", () => {
    search.value = "";
    clearBtn.hidden = true;
    applyFilter("");
    search.focus();
  });

  // honour a search carried over from another page (?q=… → jump + filter)
  const incomingQ = new URLSearchParams(location.search).get("q");
  if (incomingQ) {
    search.value = incomingQ;
    clearBtn.hidden = false;
    const side = $("sideSearch");
    if (side) side.value = incomingQ;
    applyFilter(incomingQ);
    const laws = document.getElementById("laws");
    if (laws) laws.scrollIntoView();
  } else {
    applyFilter();
  }
})();

/* =====================================================================
   SIDEBAR  (vertical nav: mobile toggle + active-link highlight)
   ===================================================================== */
(function sidebar() {
  const bar = $("sidebar");
  const toggle = $("sidebarToggle");
  const links = Array.from(bar.querySelectorAll(".nav a"));

  const open = () => bar.classList.add("open");
  const close = () => bar.classList.remove("open");

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    bar.classList.toggle("open");
  });
  // on mobile, close the sidebar after choosing a destination
  links.forEach((a) => a.addEventListener("click", close));
  // tap outside / Escape closes it
  document.addEventListener("click", (e) => {
    if (!bar.contains(e.target) && e.target !== toggle) close();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  // highlight the link for whichever section is currently in view
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const id = "#" + en.target.id;
          links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === id));
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));
})();

/* =====================================================================
   SIDEBAR SEARCH  (forwards to the Law Library search + jumps there)
   ===================================================================== */
(function sideSearch() {
  const side = $("sideSearch");
  const main = $("lawSearch");
  if (!side || !main) return;
  let jumped = false;
  side.addEventListener("input", () => {
    main.value = side.value;
    main.dispatchEvent(new Event("input", { bubbles: true }));
    if (side.value && !jumped) {
      document.getElementById("laws").scrollIntoView({ behavior: "smooth", block: "start" });
      jumped = true;
    }
    if (!side.value) jumped = false;
  });
})();

/* =====================================================================
   EDITABLE CONTROLS — every experiment value is type-able, not fixed
   ===================================================================== */
(function editableControls() {
  if (!window.PHYS_makeEditable) return;
  document.querySelectorAll(".controls label").forEach((label) => {
    const slider = label.querySelector('input[type="range"]');
    const disp = label.querySelector("span");
    if (slider) window.PHYS_makeEditable(slider, disp);
  });
})();
