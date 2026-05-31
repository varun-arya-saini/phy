/* =====================================================================
   The five interactive home-page practicals, ported from the former React
   components to plain DOM + canvas. Each `buildX()` returns a <section> with
   its info panel, sliders and its own requestAnimationFrame-driven canvas.
   ===================================================================== */
import { cssVar, roundRect, editableRange } from "./utils.js";

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

/* -------------------------- Projectile --------------------------- */
export function buildProjectile() {
  const canvas = el("canvas", { class: "exp-canvas", width: 560, height: 380 });
  const readout = el("div", { class: "readout" }, "Range: — · Max height: — · Flight time: —");
  const p = { vel: 25, ang: 45, grav: 9.8 };

  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height, ground = H - 30;
  let t = 0, v0, theta, g, scale, trail = [], flying = false, raf = null;

  function computeStats() {
    const v = +p.vel, a = (+p.ang * Math.PI) / 180, gg = +p.grav;
    return {
      range: (v * v * Math.sin(2 * a)) / gg,
      height: (v * v * Math.sin(a) ** 2) / (2 * gg),
      flight: (2 * v * Math.sin(a)) / gg,
    };
  }
  function drawScene() {
    ctx.clearRect(0, 0, W, H);
    const sky = ctx.createLinearGradient(0, 0, 0, ground);
    sky.addColorStop(0, "rgba(91,140,255,0.10)");
    sky.addColorStop(1, "rgba(91,140,255,0.02)");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, ground);
    ctx.fillStyle = cssVar("--accent");
    ctx.globalAlpha = 0.25;
    ctx.fillRect(0, ground, W, H - ground);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = cssVar("--accent");
    ctx.beginPath();
    ctx.moveTo(0, ground);
    ctx.lineTo(W, ground);
    ctx.stroke();
  }
  function drawStatic() {
    drawScene();
    const a = (+p.ang * Math.PI) / 180, len = 55;
    ctx.strokeStyle = cssVar("--accent-2");
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(24, ground);
    ctx.lineTo(24 + Math.cos(a) * len, ground - Math.sin(a) * len);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = cssVar("--warn");
    ctx.beginPath();
    ctx.arc(24, ground, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  function redrawTrail() {
    ctx.strokeStyle = cssVar("--accent");
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    trail.forEach(([tx, ty], i) => (i ? ctx.lineTo(tx, ty) : ctx.moveTo(tx, ty)));
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function step() {
    drawScene();
    const x = v0 * Math.cos(theta) * t;
    const y = v0 * Math.sin(theta) * t - 0.5 * g * t * t;
    const px = 24 + x * scale, py = ground - y * scale;
    trail.push([px, py]);
    redrawTrail();
    ctx.fillStyle = cssVar("--warn");
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
    t += 0.05;
    if (y < 0 && t > 0.1) {
      flying = false;
      drawStatic();
      redrawTrail();
      return;
    }
    raf = requestAnimationFrame(step);
  }
  function launch() {
    if (flying) cancelAnimationFrame(raf);
    const s = computeStats();
    v0 = +p.vel;
    theta = (+p.ang * Math.PI) / 180;
    g = +p.grav;
    scale = Math.min((W - 50) / Math.max(s.range, 1), (ground - 30) / Math.max(s.height, 1));
    t = 0;
    trail = [];
    flying = true;
    step();
  }
  function refresh() {
    const s = computeStats();
    readout.textContent = `Range: ${s.range.toFixed(1)} m · Max height: ${s.height.toFixed(1)} m · Flight time: ${s.flight.toFixed(2)} s`;
    if (!flying) drawStatic();
  }

  const controls = el(
    "div",
    { class: "controls" },
    editableRange({ label: "Launch speed", value: p.vel, min: 5, max: 60, step: "1", unit: "m/s" }, (v) => { p.vel = v; refresh(); }),
    editableRange({ label: "Angle", value: p.ang, min: 5, max: 85, step: "1", unit: "°" }, (v) => { p.ang = v; refresh(); }),
    editableRange({ label: "Gravity", value: p.grav, min: 1.6, max: 24.8, step: 0.1, unit: "m/s²" }, (v) => { p.grav = v; refresh(); }),
    el("button", { class: "btn btn-primary", onClick: launch }, "Launch ▶")
  );

  refresh();

  return el(
    "section",
    { id: "projectile", class: "experiment" },
    el(
      "div",
      { class: "exp-info" },
      el("span", { class: "tag" }, "Mechanics · Kinematics"),
      el("h2", {}, "Projectile Motion"),
      el("p", { class: "statement", html: "An object launched into the air follows a parabolic path under constant gravity. Horizontal velocity stays constant; vertical velocity changes by <code>g</code> each second." }),
      el("div", { class: "formula", html: "Range&nbsp;<code>R = (v² · sin 2θ) / g</code><br>Max height&nbsp;<code>H = (v² · sin²θ) / 2g</code>" }),
      controls,
      readout
    ),
    canvas
  );
}

/* --------------------------- Pendulum ---------------------------- */
export function buildPendulum() {
  const canvas = el("canvas", { class: "exp-canvas", width: 560, height: 380 });
  const readout = el("div", { class: "readout" }, "Period: — · Frequency: —");
  const p = { len: 1.5, grav: 9.8, ang: 30 };
  let running = true;

  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height, pivot = { x: W / 2, y: 40 };
  let L, g, theta, omega = 0, last = null, raf = null;

  function reset() {
    L = +p.len;
    g = +p.grav;
    theta = (+p.ang * Math.PI) / 180;
    omega = 0;
    last = null;
    const T = 2 * Math.PI * Math.sqrt(L / g);
    readout.textContent = `Period: ${T.toFixed(2)} s · Frequency: ${(1 / T).toFixed(2)} Hz`;
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const pxLen = 70 + (L / 3) * 200;
    const bob = { x: pivot.x + Math.sin(theta) * pxLen, y: pivot.y + Math.cos(theta) * pxLen };
    ctx.strokeStyle = cssVar("--line");
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(pivot.x, pivot.y, pxLen, Math.PI * 0.25, Math.PI * 0.75);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = cssVar("--muted");
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(bob.x, bob.y);
    ctx.stroke();
    ctx.fillStyle = cssVar("--muted");
    ctx.beginPath();
    ctx.arc(pivot.x, pivot.y, 5, 0, Math.PI * 2);
    ctx.fill();
    const grd = ctx.createRadialGradient(bob.x - 5, bob.y - 5, 2, bob.x, bob.y, 20);
    grd.addColorStop(0, cssVar("--accent-2"));
    grd.addColorStop(1, cssVar("--accent"));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(bob.x, bob.y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1;
  }
  function frame(ts) {
    if (!last) last = ts;
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;
    if (running) {
      const alpha = -(g / L) * Math.sin(theta);
      omega += alpha * dt;
      omega *= 0.999;
      theta += omega * dt;
    }
    draw();
    raf = requestAnimationFrame(frame);
  }

  const playBtn = el("button", { class: "btn btn-ghost" }, "Pause ⏸");
  playBtn.addEventListener("click", () => {
    running = !running;
    playBtn.textContent = running ? "Pause ⏸" : "Play ▶";
  });

  const controls = el(
    "div",
    { class: "controls" },
    editableRange({ label: "Length", value: p.len, min: 0.5, max: 3, step: 0.1, unit: "m" }, (v) => { p.len = v; reset(); }),
    editableRange({ label: "Gravity", value: p.grav, min: 1.6, max: 24.8, step: 0.1, unit: "m/s²" }, (v) => { p.grav = v; reset(); }),
    editableRange({ label: "Start angle", value: p.ang, min: 5, max: 60, step: "1", unit: "°" }, (v) => { p.ang = v; reset(); }),
    playBtn
  );

  reset();
  raf = requestAnimationFrame(frame);

  return el(
    "section",
    { id: "pendulum", class: "experiment reverse" },
    el(
      "div",
      { class: "exp-info" },
      el("span", { class: "tag" }, "Oscillations · SHM"),
      el("h2", {}, "Simple Pendulum"),
      el("p", { class: "statement" }, "For small swings, a pendulum's period depends only on its length and gravity — not on how heavy the bob is or how far you pull it."),
      el("div", { class: "formula", html: "Period&nbsp;<code>T = 2π · √(L / g)</code>" }),
      controls,
      readout
    ),
    canvas
  );
}

/* ---------------------------- Newton ----------------------------- */
export function buildNewton() {
  const canvas = el("canvas", { class: "exp-canvas", width: 560, height: 380 });
  const readout = el("div", { class: "readout" }, "Acceleration: — · Velocity: —");
  const p = { force: 40, mass: 4 };

  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height, trackY = H / 2 + 40;
  let x = 60, v = 0, a = 0, last = null, raf = null, pushing = false;

  function updateReadout() {
    readout.textContent = `Acceleration: ${a.toFixed(2)} m/s² · Velocity: ${v.toFixed(2)} m/s`;
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = cssVar("--muted");
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, trackY + 26);
    ctx.lineTo(W - 30, trackY + 26);
    ctx.stroke();
    const m = +p.mass;
    const cw = 44 + m * 4, ch = 26 + m * 1.5, cx = x, cy = trackY + 26 - ch;
    ctx.fillStyle = cssVar("--accent");
    roundRect(ctx, cx, cy, cw, ch, 6);
    ctx.fill();
    ctx.fillStyle = cssVar("--text");
    [cx + 12, cx + cw - 12].forEach((wx) => {
      ctx.beginPath();
      ctx.arc(wx, trackY + 26, 7, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#fff";
    ctx.font = "600 13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(m + " kg", cx + cw / 2, cy + ch / 2 + 4);
    const f = +p.force;
    if (f > 0) {
      const alen = 20 + f * 0.9, ay = cy + ch / 2;
      ctx.strokeStyle = cssVar("--warn");
      ctx.fillStyle = cssVar("--warn");
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - alen, ay);
      ctx.lineTo(cx - 4, ay);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 4, ay);
      ctx.lineTo(cx - 14, ay - 7);
      ctx.lineTo(cx - 14, ay + 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = cssVar("--warn");
      ctx.font = "600 12px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(f + " N", cx - alen - 4, ay - 10);
    }
    ctx.lineWidth = 1;
  }
  function frame(ts) {
    if (!last) last = ts;
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;
    if (pushing) {
      a = +p.force / +p.mass;
      v += a * dt * 12;
      x += v * dt;
      if (x > W - 70) {
        x = W - 70;
        v = 0;
        pushing = false;
      }
      updateReadout();
    }
    draw();
    raf = requestAnimationFrame(frame);
  }
  function refresh() {
    a = +p.force / +p.mass;
    updateReadout();
    if (!pushing) draw();
  }
  function reset() {
    pushing = false;
    x = 60;
    v = 0;
    last = null;
    a = +p.force / +p.mass;
    updateReadout();
    draw();
  }

  const controls = el(
    "div",
    { class: "controls" },
    editableRange({ label: "Force", value: p.force, min: 0, max: 120, step: "1", unit: "N" }, (val) => { p.force = val; refresh(); }),
    editableRange({ label: "Mass", value: p.mass, min: 1, max: 20, step: "1", unit: "kg" }, (val) => { p.mass = val; refresh(); }),
    el("button", { class: "btn btn-primary", onClick: () => { pushing = true; last = null; } }, "Apply force ▶"),
    el("button", { class: "btn btn-ghost", onClick: reset }, "Reset")
  );

  refresh();
  raf = requestAnimationFrame(frame);

  return el(
    "section",
    { id: "newton", class: "experiment" },
    el(
      "div",
      { class: "exp-info" },
      el("span", { class: "tag" }, "Mechanics · Dynamics"),
      el("h2", {}, "Newton's Second Law"),
      el("p", { class: "statement" }, "The acceleration of an object is directly proportional to the net force on it and inversely proportional to its mass. Push harder → faster acceleration; heavier object → slower."),
      el("div", { class: "formula", html: "Force&nbsp;<code>F = m · a</code>" }),
      controls,
      readout
    ),
    canvas
  );
}

/* ------------------------------ Ohm ------------------------------ */
export function buildOhm() {
  const canvas = el("canvas", { class: "exp-canvas", width: 560, height: 380 });
  const readout = el("div", { class: "readout" }, "Current: — · Power: —");
  const p = { volt: 12, res: 6 };

  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  let phase = 0, raf = null;

  function stats() {
    const V = +p.volt, R = +p.res, I = V / R, P = V * I;
    return { V, R, I, P };
  }
  function perimeterPoints(L, T, R, B, n) {
    const top = [], right = [], bot = [], left = [];
    for (let i = 0; i <= n; i++) top.push({ x: L + ((R - L) * i) / n, y: T });
    for (let i = 0; i <= n; i++) right.push({ x: R, y: T + ((B - T) * i) / n });
    for (let i = 0; i <= n; i++) bot.push({ x: R - ((R - L) * i) / n, y: B });
    for (let i = 0; i <= n; i++) left.push({ x: L, y: B - ((B - T) * i) / n });
    return [].concat(top, right, bot, left);
  }
  function frame() {
    const s = stats();
    ctx.clearRect(0, 0, W, H);
    const L = 90, R = W - 90, T = 90, B = H - 70;
    ctx.strokeStyle = cssVar("--muted");
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.rect(L, T, R - L, B - T);
    ctx.stroke();
    ctx.strokeStyle = cssVar("--accent-2");
    ctx.lineWidth = 4;
    const my = (T + B) / 2;
    ctx.beginPath();
    ctx.moveTo(L, my - 16);
    ctx.lineTo(L, my + 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(L - 8, my - 8);
    ctx.lineTo(L - 8, my + 8);
    ctx.stroke();
    ctx.fillStyle = cssVar("--text");
    ctx.font = "600 13px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(s.V.toFixed(1) + " V", L - 16, my + 4);
    ctx.strokeStyle = cssVar("--warn");
    ctx.lineWidth = 3;
    const rx = (L + R) / 2 - 40, ry = T, amp = 5 + s.R * 0.4;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    for (let i = 0; i < 8; i++) ctx.lineTo(rx + i * 10 + 5, ry + (i % 2 ? amp : -amp));
    ctx.lineTo(rx + 80, ry);
    ctx.stroke();
    ctx.fillStyle = cssVar("--warn");
    ctx.textAlign = "center";
    ctx.fillText(s.R + " Ω", rx + 40, ry - 14);
    const bx = R, by = my, brightness = Math.min(s.P / 60, 1);
    ctx.fillStyle = `rgba(255, 200, 60, ${0.15 + brightness * 0.85})`;
    ctx.beginPath();
    ctx.arc(bx, by, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = cssVar("--warn");
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, by, 16, 0, Math.PI * 2);
    ctx.stroke();
    if (brightness > 0.05) {
      ctx.fillStyle = `rgba(255, 220, 120, ${brightness * 0.35})`;
      ctx.beginPath();
      ctx.arc(bx, by, 16 + brightness * 18, 0, Math.PI * 2);
      ctx.fill();
    }
    const speed = Math.min(s.I, 8);
    phase += speed * 0.6;
    const perim = perimeterPoints(L, T, R, B, 40);
    ctx.fillStyle = cssVar("--accent");
    for (let i = 0; i < perim.length; i++) {
      if ((i + Math.floor(phase)) % 4 === 0) {
        const pt = perim[i];
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.lineWidth = 1;
    raf = requestAnimationFrame(frame);
  }

  function refresh() {
    const I = +p.volt / +p.res, P = +p.volt * I;
    readout.textContent = `Current: ${I.toFixed(2)} A · Power: ${P.toFixed(1)} W`;
  }

  const controls = el(
    "div",
    { class: "controls" },
    editableRange({ label: "Voltage", value: p.volt, min: 0, max: 24, step: 0.5, unit: "V" }, (v) => { p.volt = v; refresh(); }),
    editableRange({ label: "Resistance", value: p.res, min: 1, max: 24, step: "1", unit: "Ω" }, (v) => { p.res = v; refresh(); })
  );

  refresh();
  raf = requestAnimationFrame(frame);

  return el(
    "section",
    { id: "ohm", class: "experiment reverse" },
    el(
      "div",
      { class: "exp-info" },
      el("span", { class: "tag" }, "Electricity"),
      el("h2", {}, "Ohm's Law"),
      el("p", { class: "statement" }, "The current through a conductor is directly proportional to the voltage across it, provided temperature stays constant. More voltage → more current; more resistance → less current."),
      el("div", { class: "formula", html: "Voltage&nbsp;<code>V = I · R</code>" }),
      controls,
      readout
    ),
    canvas
  );
}

/* ----------------------------- Hooke ----------------------------- */
export function buildHooke() {
  const G = 9.8;
  const canvas = el("canvas", { class: "exp-canvas", width: 560, height: 380 });
  const readout = el("div", { class: "readout" }, "Extension: — · Restoring force: —");
  const p = { k: 20, mass: 2 };
  let targetExt = 0;

  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height, topY = 40, anchorX = W / 2;
  let ext = 0, raf = null;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = cssVar("--muted");
    ctx.fillRect(anchorX - 60, topY - 12, 120, 8);
    for (let i = -55; i < 60; i += 12) {
      ctx.beginPath();
      ctx.moveTo(anchorX + i, topY - 12);
      ctx.lineTo(anchorX + i - 8, topY - 22);
      ctx.strokeStyle = cssVar("--muted");
      ctx.stroke();
    }
    const naturalLen = 110, springLen = naturalLen + ext * 260, coils = 10, bobY = topY + springLen;
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
    const m = +p.mass, size = 34 + m * 4;
    const grd = ctx.createLinearGradient(0, bobY, 0, bobY + size);
    grd.addColorStop(0, cssVar("--accent-2"));
    grd.addColorStop(1, cssVar("--accent"));
    ctx.fillStyle = grd;
    ctx.fillRect(anchorX - size / 2, bobY, size, size);
    ctx.fillStyle = "#06223a";
    ctx.font = "700 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(m + " kg", anchorX, bobY + size / 2 + 5);
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
  function frame() {
    ext += (targetExt - ext) * 0.12;
    draw();
    raf = requestAnimationFrame(frame);
  }
  function refresh() {
    const F = +p.mass * G, x = F / +p.k;
    targetExt = x;
    readout.textContent = `Extension: ${(x * 100).toFixed(1)} cm · Restoring force: ${F.toFixed(1)} N`;
  }

  const controls = el(
    "div",
    { class: "controls" },
    editableRange({ label: "Spring constant k", value: p.k, min: 5, max: 80, step: "1", unit: "N/m" }, (v) => { p.k = v; refresh(); }),
    editableRange({ label: "Hanging mass", value: p.mass, min: 0, max: 10, step: 0.5, unit: "kg" }, (v) => { p.mass = v; refresh(); })
  );

  refresh();
  raf = requestAnimationFrame(frame);

  return el(
    "section",
    { id: "hooke", class: "experiment" },
    el(
      "div",
      { class: "exp-info" },
      el("span", { class: "tag" }, "Elasticity"),
      el("h2", {}, "Hooke's Law"),
      el("p", { class: "statement" }, "The extension of a spring is directly proportional to the force stretching it, as long as the elastic limit isn't exceeded."),
      el("div", { class: "formula", html: "Force&nbsp;<code>F = k · x</code>" }),
      controls,
      readout
    ),
    canvas
  );
}
