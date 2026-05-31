/* =====================================================================
   animations.js — the shared physics animation engine.
   Exposes window.PHYS_ANIM = { <anim-id>: function(canvas, cap, P, ro) }.
   Used by the law detail pages (law.js) and the library card previews
   (script.js). An ES module — top-level helpers stay module-private.
   ===================================================================== */
const TAU = Math.PI * 2;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const cssVar = (n) => getComputedStyle(document.body).getPropertyValue(n).trim();
  const setRO = (el, html) => { if (el) el.innerHTML = html; };

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function arrow(c, x1, y1, x2, y2, color, width = 4) {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    c.strokeStyle = color; c.fillStyle = color; c.lineWidth = width;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    const h = 9 + width;
    c.beginPath();
    c.moveTo(x2, y2);
    c.lineTo(x2 - h * Math.cos(ang - 0.4), y2 - h * Math.sin(ang - 0.4));
    c.lineTo(x2 - h * Math.cos(ang + 0.4), y2 - h * Math.sin(ang + 0.4));
    c.closePath(); c.fill();
    c.lineWidth = 1;
  }

  const ANIMATIONS = {

    /* ---- Newton's 1st: puck glides at the chosen constant speed ---- */
    inertia(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, y = H * 0.62;
      cap.textContent = "No net force acts on the puck, so whatever speed you set, it keeps it — forever.";
      let x = 80;
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = "rgba(91,140,255,0.08)"; ctx.fillRect(0, y + 26, W, H - y - 26);
        ctx.strokeStyle = cssVar("--line");
        for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, y + 26); ctx.lineTo(i - 30, H); ctx.stroke(); }
        x += P.v; if (x > W + 30) x = -30;
        arrow(ctx, x, y, x + 30 + P.v * 14, y, cssVar("--warn"), 4);
        ctx.fillStyle = cssVar("--accent"); ctx.beginPath(); ctx.ellipse(x, y + 18, 26, 12, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = cssVar("--accent-2"); ctx.beginPath(); ctx.ellipse(x, y + 8, 26, 12, 0, 0, TAU); ctx.fill();
        setRO(ro, `velocity = <b>${P.v.toFixed(1)} m/s</b> (constant) · net force = <b>0 N</b> · acceleration = <b>0</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Newton's 2nd: one cart, your force & mass set the acceleration ---- */
    cart(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, baseY = H * 0.62;
      cap.textContent = "Acceleration = force ÷ mass. More force speeds it up; more mass slows it down.";
      let x = 120, v = 0;
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        const a = P.force / P.mass;
        v += a * 0.012; x += v;
        if (x > W - 110) { x = 120; v = 0; }
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(60, baseY + 30); ctx.lineTo(W - 40, baseY + 30); ctx.stroke();
        const w = 56 + P.mass * 7, h = 34 + P.mass * 2.5;
        if (P.force > 0) arrow(ctx, x - 18 - P.force * 0.7, baseY + 30 - h / 2, x - 6, baseY + 30 - h / 2, cssVar("--warn"), 4);
        ctx.fillStyle = cssVar("--accent"); roundRect(ctx, x, baseY + 30 - h, w, h, 6); ctx.fill();
        ctx.fillStyle = cssVar("--text");
        [x + 14, x + w - 14].forEach((wx) => { ctx.beginPath(); ctx.arc(wx, baseY + 30, 8, 0, TAU); ctx.fill(); });
        ctx.fillStyle = "#fff"; ctx.font = "600 14px Inter"; ctx.textAlign = "center";
        ctx.fillText(P.mass + " kg", x + w / 2, baseY + 30 - h / 2 + 5);
        setRO(ro, `F = <b>${P.force} N</b> · m = <b>${P.mass} kg</b> · a = F/m = <b>${a.toFixed(2)} m/s²</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Newton's 3rd: equal & opposite — lighter cart recoils faster ---- */
    recoil(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, y = H * 0.6;
      cap.textContent = "The same push acts on both carts (equal & opposite), so the lighter one speeds away faster.";
      const impulse = 9;
      let phase = 0, timer = 0, lx, rx, lv = 0, rv = 0;
      const reset = () => { lx = W / 2 - 95; rx = W / 2 + 45; lv = 0; rv = 0; phase = 0; timer = 0; };
      reset();
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(40, y + 30); ctx.lineTo(W - 40, y + 30); ctx.stroke();
        timer++;
        if (phase === 0 && timer > 50) { phase = 1; lv = -impulse / P.mA; rv = impulse / P.mB; }
        if (phase === 1) { lx += lv; rx += rv; if (lx < 50 || rx > W - 100) reset(); }
        if (phase === 0) {
          ctx.strokeStyle = cssVar("--accent-2"); ctx.lineWidth = 3; ctx.beginPath();
          const a = lx + 50 + P.mA * 6, b = rx;
          for (let i = 0; i <= 12; i++) ctx.lineTo(a + ((b - a) * i) / 12, y + 14 + (i % 2 ? -8 : 8));
          ctx.stroke();
        }
        const cart = (cx, m, label, dir, vel) => {
          const w = 40 + m * 6;
          ctx.fillStyle = cssVar("--accent"); roundRect(ctx, cx, y, w, 30, 6); ctx.fill();
          ctx.fillStyle = cssVar("--text");
          [cx + 12, cx + w - 12].forEach((wx) => { ctx.beginPath(); ctx.arc(wx, y + 30, 7, 0, TAU); ctx.fill(); });
          if (phase === 1) arrow(ctx, cx + w / 2, y + 15, cx + w / 2 + dir * (15 + Math.abs(vel) * 7), y + 15, cssVar("--warn"), 4);
          ctx.fillStyle = "#fff"; ctx.font = "600 12px Inter"; ctx.textAlign = "center";
          ctx.fillText(label + " · " + m + "kg", cx + w / 2, y + 19);
        };
        cart(lx, P.mA, "A", -1, lv);
        cart(rx, P.mB, "B", 1, rv);
        setRO(ro, `equal impulse on both · speed of A = <b>${(impulse / P.mA).toFixed(1)}</b>, B = <b>${(impulse / P.mB).toFixed(1)}</b> · momentum stays equal & opposite`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Gravitation: star mass sets orbit speed; slider sets orbit size ---- */
    orbit(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, cx = W / 2, cy = H / 2;
      cap.textContent = "A heavier star pulls harder, so the planet must orbit faster. A wider orbit means a weaker pull.";
      let ang = 0; const trail = [];
      (function loop() {
        const a = P.dist, b = P.dist * 0.62;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = cssVar("--line"); ctx.setLineDash([5, 7]);
        ctx.beginPath(); ctx.ellipse(cx, cy, a, b, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        const r0 = 14 + P.mass * 3;
        const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, r0 + 8);
        g.addColorStop(0, "#fff6c8"); g.addColorStop(0.5, cssVar("--warn")); g.addColorStop(1, "rgba(255,180,84,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r0 + 8, 0, TAU); ctx.fill();
        const px = cx + a * Math.cos(ang), py = cy + b * Math.sin(ang);
        const r = Math.hypot(px - cx, py - cy);
        ang += (0.5 / r) * Math.sqrt(P.mass) + 0.002;
        trail.push([px, py]); if (trail.length > 55) trail.shift();
        ctx.strokeStyle = cssVar("--accent"); ctx.globalAlpha = 0.5;
        ctx.beginPath(); trail.forEach(([tx, ty], i) => (i ? ctx.lineTo(tx, ty) : ctx.moveTo(tx, ty))); ctx.stroke();
        ctx.globalAlpha = 1;
        arrow(ctx, px, py, px + (cx - px) * (0.2 + P.mass * 0.03), py + (cy - py) * (0.2 + P.mass * 0.03), cssVar("--warn"), 3);
        const pg = ctx.createRadialGradient(px - 3, py - 3, 1, px, py, 13);
        pg.addColorStop(0, cssVar("--accent-2")); pg.addColorStop(1, cssVar("--accent"));
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, 13, 0, TAU); ctx.fill();
        setRO(ro, `star mass = <b>${P.mass}×</b> · orbit radius = <b>${P.dist} px</b> · pull ∝ mass ÷ distance²`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Ohm's law: voltage & resistance set current and brightness ---- */
    circuit(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Raise the voltage for more current; raise the resistance for less. The bulb's glow tracks the power.";
      const L = 110, R = W - 110, T = 110, B = H - 90, my = (T + B) / 2;
      let phase = 0;
      (function loop() {
        const I = P.volt / P.res, power = P.volt * I;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 4;
        ctx.beginPath(); ctx.rect(L, T, R - L, B - T); ctx.stroke();
        ctx.strokeStyle = cssVar("--accent-2"); ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(L, my - 18); ctx.lineTo(L, my + 18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(L - 9, my - 9); ctx.lineTo(L - 9, my + 9); ctx.stroke();
        ctx.fillStyle = cssVar("--text"); ctx.font = "600 14px Inter"; ctx.textAlign = "right";
        ctx.fillText(P.volt.toFixed(1) + " V", L - 18, my + 5);
        ctx.strokeStyle = cssVar("--warn"); ctx.lineWidth = 3;
        const rx = (L + R) / 2 - 50, amp = 5 + P.res * 0.45; ctx.beginPath(); ctx.moveTo(rx, T);
        for (let i = 0; i < 9; i++) ctx.lineTo(rx + i * 11 + 5, T + (i % 2 ? amp : -amp));
        ctx.lineTo(rx + 95, T); ctx.stroke();
        ctx.fillStyle = cssVar("--warn"); ctx.textAlign = "center"; ctx.fillText(P.res + " Ω", rx + 47, T - 16);
        const bright = clamp(power / 60, 0, 1);
        ctx.fillStyle = `rgba(255,205,70,${0.12 + bright * 0.88})`; ctx.beginPath(); ctx.arc(R, my, 17, 0, TAU); ctx.fill();
        if (bright > 0.04) { ctx.fillStyle = `rgba(255,220,120,${bright * 0.35})`; ctx.beginPath(); ctx.arc(R, my, 17 + bright * 22, 0, TAU); ctx.fill(); }
        ctx.strokeStyle = cssVar("--warn"); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(R, my, 17, 0, TAU); ctx.stroke();
        phase += clamp(I, 0, 8) * 0.02;
        const pts = [];
        const seg = (x1, y1, x2, y2, n) => { for (let i = 0; i < n; i++) pts.push([x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n]); };
        seg(L, T, R, T, 40); seg(R, T, R, B, 30); seg(R, B, L, B, 40); seg(L, B, L, T, 30);
        ctx.fillStyle = cssVar("--accent");
        pts.forEach((p, i) => { if ((i / pts.length + phase) % 0.1 < 0.03) { ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, TAU); ctx.fill(); } });
        setRO(ro, `I = V/R = <b>${I.toFixed(2)} A</b> · power = <b>${power.toFixed(1)} W</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Hooke's law: stiffness & mass set the oscillation rate ---- */
    spring(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, ax = W / 2, top = 50;
      cap.textContent = "A stiffer spring (higher k) bounces faster; a heavier mass bounces slower. T = 2π·√(m/k).";
      let t = 0;
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = cssVar("--muted"); ctx.fillRect(ax - 70, top - 12, 140, 8);
        const omega = Math.sqrt(P.k / P.mass);
        t += omega * 0.02;
        const ext = 130 + Math.sin(t) * 80;
        const bobY = top + ext;
        ctx.strokeStyle = cssVar("--accent"); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, top);
        const segs = 22;
        for (let i = 1; i <= segs; i++) ctx.lineTo(ax + (i % 2 ? 18 : -18), top + (ext * i) / segs);
        ctx.lineTo(ax, bobY); ctx.stroke();
        const size = 40 + P.mass * 5;
        const g = ctx.createLinearGradient(0, bobY, 0, bobY + size);
        g.addColorStop(0, cssVar("--accent-2")); g.addColorStop(1, cssVar("--accent"));
        ctx.fillStyle = g; roundRect(ctx, ax - size / 2, bobY, size, size, 8); ctx.fill();
        ctx.fillStyle = "#06223a"; ctx.font = "700 13px Inter"; ctx.textAlign = "center";
        ctx.fillText(P.mass + " kg", ax, bobY + size / 2 + 5);
        const dir = Math.sin(t) > 0 ? -1 : 1;
        arrow(ctx, ax + size / 2 + 30, bobY + size / 2, ax + size / 2 + 30, bobY + size / 2 + dir * 40, cssVar("--warn"), 3);
        setRO(ro, `k = <b>${P.k} N/m</b> · m = <b>${P.mass} kg</b> · period T ≈ <b>${(2 * Math.PI * Math.sqrt(P.mass / P.k)).toFixed(2)} s</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Conservation of energy: swing angle sets the energy total ---- */
    energy(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, px = W * 0.40, py = 60, len = 240;
      cap.textContent = "Energy trades between potential (height) and kinetic (speed). The two bars always add up to the same total.";
      let t = 0;
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        const A = (P.amp * Math.PI) / 180;
        t += 0.03;
        const theta = A * Math.cos(t);
        const bx = px + Math.sin(theta) * len, by = py + Math.cos(theta) * len;
        ctx.strokeStyle = cssVar("--line"); ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.arc(px, py, len, Math.PI / 2 - A, Math.PI / 2 + A); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();
        const g = ctx.createRadialGradient(bx - 4, by - 4, 2, bx, by, 20);
        g.addColorStop(0, cssVar("--accent-2")); g.addColorStop(1, cssVar("--accent"));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, 19, 0, TAU); ctx.fill();
        const peFrac = A === 0 ? 0 : (theta * theta) / (A * A), keFrac = 1 - peFrac;
        const barY = 90, barW = 46, barH = 250, barX = W - 150;
        const bar = (x, frac, col, label) => {
          ctx.fillStyle = cssVar("--card-2"); roundRect(ctx, x, barY, barW, barH, 8); ctx.fill();
          ctx.fillStyle = col; const h = barH * frac; roundRect(ctx, x, barY + barH - h, barW, h, 8); ctx.fill();
          ctx.fillStyle = cssVar("--text"); ctx.font = "600 13px Inter"; ctx.textAlign = "center";
          ctx.fillText(label, x + barW / 2, barY + barH + 22);
        };
        bar(barX, peFrac, cssVar("--accent"), "PE");
        bar(barX + 64, keFrac, cssVar("--accent-2"), "KE");
        ctx.fillStyle = cssVar("--muted"); ctx.font = "600 13px Inter"; ctx.textAlign = "center";
        ctx.fillText("PE + KE = constant", barX + 55, barY - 14);
        setRO(ro, `swing angle = <b>${P.amp}°</b> · PE = <b>${(peFrac * 100).toFixed(0)}%</b> · KE = <b>${(keFrac * 100).toFixed(0)}%</b> · total = <b>100%</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Conservation of momentum: general elastic collision ---- */
    collision(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, y = H * 0.55;
      cap.textContent = "Set the masses and the incoming speed — momentum before the hit always equals momentum after.";
      let a, b, collided;
      const rOf = (m) => 16 + m * 3.2;
      const reset = () => { a = { x: 90, v: P.u1 }; b = { x: W * 0.6, v: 0 }; collided = false; };
      reset();
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(40, y + 40); ctx.lineTo(W - 40, y + 40); ctx.stroke();
        const r1 = rOf(P.m1), r2 = rOf(P.m2);
        a.x += a.v; b.x += b.v;
        if (!collided && a.x + r1 >= b.x - r2 && a.v > b.v) {
          const m1 = P.m1, m2 = P.m2, u1 = a.v;
          a.v = ((m1 - m2) / (m1 + m2)) * u1;
          b.v = ((2 * m1) / (m1 + m2)) * u1;
          collided = true;
        }
        if (a.x < -60 || a.x > W + 60 || b.x > W + 60) reset();
        const ball = (o, r, col, label) => {
          const g = ctx.createRadialGradient(o.x - r / 3, y - r / 3, 3, o.x, y, r);
          g.addColorStop(0, "#fff"); g.addColorStop(0.3, col); g.addColorStop(1, col);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, y, r, 0, TAU); ctx.fill();
          if (Math.abs(o.v) > 0.05) arrow(ctx, o.x + Math.sign(o.v) * (r + 4), y, o.x + Math.sign(o.v) * (r + 38), y, cssVar("--warn"), 3);
          ctx.fillStyle = "#fff"; ctx.font = "700 13px Inter"; ctx.textAlign = "center"; ctx.fillText(label, o.x, y + 5);
        };
        ball(a, r1, cssVar("--accent"), P.m1);
        ball(b, r2, cssVar("--accent-2"), P.m2);
        const pBefore = P.m1 * P.u1;
        setRO(ro, `momentum before = <b>${pBefore.toFixed(1)}</b> · after = <b>${(P.m1 * a.v + P.m2 * b.v).toFixed(1)}</b> kg·m/s (conserved)`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Coulomb's law: charge signs decide attract/repel; size sets force ---- */
    charges(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, y = H / 2;
      cap.textContent = "Same signs repel, opposite signs attract. Bigger charges (and closer spacing) mean a stronger force.";
      let t = 0;
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        t += 0.02;
        const gap = 150 + Math.sin(t) * 80;
        const x1 = W / 2 - gap / 2, x2 = W / 2 + gap / 2;
        const product = P.q1 * P.q2;
        const repel = product > 0, attract = product < 0;
        const mag = clamp((Math.abs(product) * 9000) / (gap * gap) * 120, 0, 120);
        ctx.strokeStyle = cssVar("--line"); ctx.setLineDash([3, 6]);
        ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); ctx.setLineDash([]);
        if (mag > 1) {
          const d = repel ? -1 : 1;
          arrow(ctx, x1, y, x1 + d * mag, y, cssVar("--warn"), 4);
          arrow(ctx, x2, y, x2 - d * mag, y, cssVar("--warn"), 4);
        }
        const charge = (x, q) => {
          const col = q > 0 ? "#e8554d" : q < 0 ? "#4d7de8" : "#888";
          const r = 18 + Math.abs(q) * 5;
          const g = ctx.createRadialGradient(x - 6, y - 6, 3, x, y, r);
          g.addColorStop(0, "#fff"); g.addColorStop(0.3, col); g.addColorStop(1, col);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.font = "800 24px Inter"; ctx.textAlign = "center";
          ctx.fillText(q > 0 ? "+" : q < 0 ? "−" : "0", x, y + 8);
        };
        charge(x1, P.q1); charge(x2, P.q2);
        setRO(ro, `q₁ = <b>${P.q1}</b>, q₂ = <b>${P.q2}</b> · ${repel ? "<b>like charges → repel</b>" : attract ? "<b>opposite → attract</b>" : "<b>a charge is zero → no force</b>"}`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Boyle's law: drag the volume, watch the pressure respond ---- */
    piston(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Shrink the volume and the molecules hit the walls more often — the pressure climbs (P × V stays constant).";
      const cylX = 90, cylTop = 60, cylW = 300, cylBot = H - 60;
      const span = cylBot - cylTop - 30;
      const N = 34;
      const mol = Array.from({ length: N }, (_, i) => ({
        x: cylX + 20 + ((i * 53) % (cylW - 40)),
        y: cylTop + 60 + ((i * 97) % 100),
        vx: ((i % 5) - 2) * 1.5 + 0.7, vy: ((i % 3) - 1) * 1.7 + 0.8,
      }));
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        const gasH = (P.vol / 100) * span;
        const pistonY = cylBot - gasH;
        const pressure = 70 / P.vol;
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(cylX, cylTop); ctx.lineTo(cylX, cylBot); ctx.lineTo(cylX + cylW, cylBot); ctx.lineTo(cylX + cylW, cylTop); ctx.stroke();
        ctx.fillStyle = cssVar("--accent-2");
        mol.forEach((m) => {
          m.x += m.vx; m.y += m.vy;
          if (m.x < cylX + 8 || m.x > cylX + cylW - 8) m.vx *= -1;
          if (m.y < pistonY + 8 || m.y > cylBot - 8) m.vy *= -1;
          m.x = clamp(m.x, cylX + 8, cylX + cylW - 8);
          m.y = clamp(m.y, pistonY + 8, cylBot - 8);
          ctx.beginPath(); ctx.arc(m.x, m.y, 5, 0, TAU); ctx.fill();
        });
        ctx.fillStyle = cssVar("--accent"); roundRect(ctx, cylX - 6, pistonY - 18, cylW + 12, 18, 4); ctx.fill();
        ctx.fillStyle = cssVar("--muted"); ctx.fillRect(cylX + cylW / 2 - 6, pistonY - 56, 12, 40);
        const gx = cylX + cylW + 120, gy = H / 2;
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(gx, gy, 58, 0, TAU); ctx.stroke();
        const needle = Math.PI * 0.75 + clamp(pressure / 3.5, 0, 1) * Math.PI * 1.5;
        arrow(ctx, gx, gy, gx + Math.cos(needle) * 46, gy + Math.sin(needle) * 46, cssVar("--warn"), 3);
        ctx.fillStyle = cssVar("--text"); ctx.font = "600 13px Inter"; ctx.textAlign = "center";
        ctx.fillText("Pressure", gx, gy + 82);
        setRO(ro, `volume = <b>${P.vol}%</b> · pressure ≈ <b>${pressure.toFixed(2)}×</b> · P × V ≈ <b>${(pressure * P.vol).toFixed(0)}</b> (constant)`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Archimedes: object density decides how deep it floats (or sinks) ---- */
    buoyancy(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      const waterTop = H * 0.40, bw = 110, bx = W / 2 - bw / 2, bh = 96;
      cap.textContent = "If the object is less dense than water it floats, sinking just deep enough to displace its own weight.";
      let t = 0;
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        t += 0.03;
        ctx.fillStyle = "rgba(56,232,200,0.18)"; ctx.fillRect(0, waterTop, W, H - waterTop);
        ctx.strokeStyle = cssVar("--accent-2"); ctx.lineWidth = 2; ctx.beginPath();
        for (let x = 0; x <= W; x += 8) ctx.lineTo(x, waterTop + Math.sin(x / 40 + t) * 4); ctx.stroke();
        const floats = P.density <= 1;
        const bob = floats ? Math.sin(t) * 6 : 0;
        const subFrac = floats ? P.density : 1;
        let by = floats ? waterTop - bh * (1 - subFrac) + bob : H - 60 - bh;
        ctx.fillStyle = cssVar("--accent"); roundRect(ctx, bx, by, bw, bh, 8); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "600 14px Inter"; ctx.textAlign = "center";
        ctx.fillText(floats ? "floats" : "sinks", bx + bw / 2, by + bh / 2 + 5);
        const cx = bx + bw / 2;
        arrow(ctx, cx - 18, by + bh / 2, cx - 18, by + bh / 2 + 30 + P.density * 30, cssVar("--warn"), 4);
        arrow(ctx, cx + 18, by + bh / 2, cx + 18, by + bh / 2 - 30 - subFrac * 30, cssVar("--accent-2"), 4);
        ctx.fillStyle = cssVar("--warn"); ctx.font = "600 12px Inter"; ctx.textAlign = "center";
        ctx.fillText("weight", cx - 18, by + bh + 28);
        ctx.fillStyle = cssVar("--accent-2"); ctx.fillText("buoyancy", cx + 18, by - 18);
        setRO(ro, `density = <b>${P.density.toFixed(2)} ×water</b> · ${floats ? `floats with <b>${(subFrac * 100).toFixed(0)}%</b> submerged` : "<b>denser than water → sinks</b>"}`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- First law of thermodynamics: heat slider splits into ΔU + W ---- */
    thermo(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      const cylX = 110, cylW = 240, cylBot = H - 80, cylTopLimit = 80;
      const N = 28;
      const mol = Array.from({ length: N }, (_, i) => ({
        x: cylX + 20 + ((i * 53) % (cylW - 40)),
        y: cylBot - 30 - ((i * 71) % 110),
        vx: ((i % 5) - 2), vy: ((i % 4) - 1.5),
      }));
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        const heat = P.heat / 100;
        const pistonY = cylBot - 110 - heat * 120;
        const speed = 0.6 + heat * 2.4;
        ctx.fillStyle = `rgba(255,${120 + heat * 100},40,${0.2 + heat * 0.7})`;
        for (let i = 0; i < 5; i++) {
          const fx = cylX + 40 + i * 40;
          ctx.beginPath(); ctx.moveTo(fx, cylBot + 36);
          ctx.quadraticCurveTo(fx - 12, cylBot + 6, fx, cylBot - 6 - heat * 16);
          ctx.quadraticCurveTo(fx + 12, cylBot + 6, fx, cylBot + 36); ctx.fill();
        }
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(cylX, cylTopLimit); ctx.lineTo(cylX, cylBot); ctx.lineTo(cylX + cylW, cylBot); ctx.lineTo(cylX + cylW, cylTopLimit); ctx.stroke();
        ctx.fillStyle = cssVar("--accent-2");
        mol.forEach((m) => {
          m.x += m.vx * speed * 0.6; m.y += m.vy * speed * 0.6;
          if (m.x < cylX + 8 || m.x > cylX + cylW - 8) m.vx *= -1;
          if (m.y > cylBot - 8 || m.y < pistonY + 8) m.vy *= -1;
          m.x = clamp(m.x, cylX + 8, cylX + cylW - 8);
          m.y = clamp(m.y, pistonY + 8, cylBot - 8);
          ctx.beginPath(); ctx.arc(m.x, m.y, 4.5, 0, TAU); ctx.fill();
        });
        ctx.fillStyle = cssVar("--accent"); roundRect(ctx, cylX - 6, pistonY - 16, cylW + 12, 16, 4); ctx.fill();
        if (heat > 0.02) arrow(ctx, cylX + cylW / 2, pistonY - 20, cylX + cylW / 2, pistonY - 30 - heat * 40, cssVar("--accent"), 4);
        ctx.fillStyle = cssVar("--accent"); ctx.font = "600 13px Inter"; ctx.textAlign = "left";
        ctx.fillText("W (work)", cylX + cylW / 2 + 12, pistonY - 36);
        arrow(ctx, cylX + cylW + 70, cylBot, cylX + cylW + 20, cylBot, cssVar("--warn"), 4);
        ctx.fillStyle = cssVar("--warn"); ctx.fillText("Q (heat in)", cylX + cylW + 76, cylBot + 4);
        setRO(ro, `Q = <b>${P.heat}%</b> → raises internal energy ΔU (hotter, faster molecules) <b>and</b> does work W (lifts the piston)`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Snell's law: indices & incidence angle set how the beam bends ---- */
    refraction(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, bx = W / 2, by = H / 2;
      cap.textContent = "Light bends toward the normal entering a denser medium and away leaving it. Past the critical angle it reflects entirely.";
      const RAY = 230;
      let ph = 0;
      const photons = (x1, y1, x2, y2, col) => {
        for (let k = 0; k < 5; k++) {
          const f = ((ph + k / 5) % 1);
          const x = x1 + (x2 - x1) * f, y = y1 + (y2 - y1) * f;
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
        }
      };
      (function loop() {
        ph = (ph + 0.01) % 1;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = "rgba(91,140,255,0.05)"; ctx.fillRect(0, 0, W, by);
        ctx.fillStyle = "rgba(91,140,255,0.18)"; ctx.fillRect(0, by, W, H - by);
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(W, by); ctx.stroke();
        ctx.strokeStyle = cssVar("--line"); ctx.setLineDash([5, 6]);
        ctx.beginPath(); ctx.moveTo(bx, 36); ctx.lineTo(bx, H - 36); ctx.stroke(); ctx.setLineDash([]);

        const th1 = (P.angle * Math.PI) / 180;
        const ix = bx - Math.sin(th1) * RAY, iy = by - Math.cos(th1) * RAY;
        arrow(ctx, ix, iy, bx, by, cssVar("--warn"), 3);
        photons(ix, iy, bx, by, cssVar("--warn"));

        const sin2 = (P.n1 / P.n2) * Math.sin(th1);
        if (Math.abs(sin2) <= 1) {
          const th2 = Math.asin(sin2);
          const rx = bx + Math.sin(th2) * RAY, ry = by + Math.cos(th2) * RAY;
          arrow(ctx, bx, by, rx, ry, cssVar("--accent"), 3);
          photons(bx, by, rx, ry, cssVar("--accent"));
          setRO(ro, `θ₁ = <b>${P.angle}°</b> → θ₂ = <b>${((th2 * 180) / Math.PI).toFixed(1)}°</b> · n₁ sinθ₁ = n₂ sinθ₂ = <b>${(P.n1 * Math.sin(th1)).toFixed(3)}</b>`);
        } else {
          const fx = bx + Math.sin(th1) * RAY, fy = by - Math.cos(th1) * RAY;
          arrow(ctx, bx, by, fx, fy, cssVar("--accent-2"), 3);
          photons(bx, by, fx, fy, cssVar("--accent-2"));
          const crit = (Math.asin(P.n2 / P.n1) * 180) / Math.PI;
          setRO(ro, `θ₁ = <b>${P.angle}°</b> exceeds the critical angle <b>${crit.toFixed(1)}°</b> → <b>total internal reflection</b>`);
        }
        ctx.fillStyle = cssVar("--muted"); ctx.font = "600 13px Inter"; ctx.textAlign = "left";
        ctx.fillText(`n₁ = ${P.n1.toFixed(2)}`, 16, 26);
        ctx.fillText(`n₂ = ${P.n2.toFixed(2)}`, 16, H - 16);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Doppler effect: moving source bunches wavefronts ahead of it ---- */
    doppler(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, y = H / 2;
      cap.textContent = "Wavefronts bunch up ahead of the moving source (higher pitch) and stretch out behind it (lower pitch).";
      const C = 2.3;
      let sx, waves, emit;
      const reset = () => { sx = 70; waves = []; emit = 0; };
      reset();
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = cssVar("--line"); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        sx += P.speed * C * 0.42;
        if (sx > W - 60) reset();
        if (++emit >= 15) { emit = 0; waves.push({ x: sx, r: 0 }); }
        waves.forEach((w) => (w.r += C));
        waves = waves.filter((w) => w.r < W * 1.3);
        waves.forEach((w) => {
          const a = clamp(1 - w.r / (W * 1.1), 0, 1);
          ctx.strokeStyle = `rgba(91,140,255,${0.15 + a * 0.5})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(w.x, y, w.r, 0, TAU); ctx.stroke();
        });
        const obs = (ox, label, ahead) => {
          const moving = P.speed > 0.02;
          const hot = moving && ahead;
          ctx.fillStyle = hot ? "#e8554d" : moving ? "#4d7de8" : cssVar("--muted");
          ctx.beginPath(); ctx.arc(ox, y, 9, 0, TAU); ctx.fill();
          ctx.fillStyle = cssVar("--text"); ctx.font = "600 12px Inter"; ctx.textAlign = "center";
          ctx.fillText(label, ox, y - 18);
        };
        obs(W - 28, "higher ♪", true);
        obs(28, "lower ♪", false);
        const g = ctx.createRadialGradient(sx - 3, y - 3, 1, sx, y, 13);
        g.addColorStop(0, cssVar("--accent-2")); g.addColorStop(1, cssVar("--accent"));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, y, 13, 0, TAU); ctx.fill();
        if (P.speed > 0.02) arrow(ctx, sx + 14, y, sx + 22 + P.speed * 22, y, cssVar("--warn"), 3);
        const ratio = P.speed < 1 ? 1 / (1 - P.speed) : Infinity;
        const ahead = isFinite(ratio) ? `<b>${ratio.toFixed(2)}× f</b>` : "<b>shock wave</b>";
        setRO(ro, `source speed = <b>${P.speed.toFixed(2)}×</b> wave speed · pitch ahead ${ahead} · pitch behind <b>${(1 / (1 + P.speed)).toFixed(2)}× f</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Bernoulli: narrow the throat → flow speeds up, pressure drops ---- */
    bernoulli(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, cy = H / 2;
      cap.textContent = "Squeezed through the narrow throat, the fluid speeds up — and its pressure drops below the wide sections.";
      const wide = 95;
      const half = (x) => {
        const t = Math.exp(-Math.pow((x - W / 2) / (W * 0.15), 2));
        return wide - (wide - wide * (P.narrow / 100)) * t;
      };
      const N = 80;
      const parts = Array.from({ length: N }, (_, i) => ({
        x: (i / N) * W,
        lane: (((i * 37) % 100) / 100) * 1.7 - 0.85,
      }));
      const gauge = (x, label) => {
        const speed = wide / half(x);
        const col = 90 - (speed * speed - 1) * 26;
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2;
        ctx.strokeRect(x - 10, cy - half(x) - 86, 20, 86);
        ctx.fillStyle = cssVar("--accent-2");
        const h = clamp(col, 6, 80);
        ctx.fillRect(x - 9, cy - half(x) - 1 - h, 18, h);
        ctx.fillStyle = cssVar("--text"); ctx.font = "600 11px Inter"; ctx.textAlign = "center";
        ctx.fillText(label, x, cy - half(x) - 94);
      };
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = "rgba(56,232,200,0.10)";
        ctx.beginPath();
        for (let x = 0; x <= W; x += 6) ctx.lineTo(x, cy - half(x));
        for (let x = W; x >= 0; x -= 6) ctx.lineTo(x, cy + half(x));
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 3;
        ctx.beginPath(); for (let x = 0; x <= W; x += 6) ctx.lineTo(x, cy - half(x)); ctx.stroke();
        ctx.beginPath(); for (let x = 0; x <= W; x += 6) ctx.lineTo(x, cy + half(x)); ctx.stroke();
        ctx.fillStyle = cssVar("--accent");
        parts.forEach((p) => {
          const v = 1.6 * (wide / half(p.x));
          p.x += v;
          if (p.x > W) p.x -= W;
          const y = cy + p.lane * half(p.x);
          ctx.beginPath(); ctx.arc(p.x, y, 3, 0, TAU); ctx.fill();
        });
        gauge(W * 0.16, "high P");
        gauge(W / 2, "low P");
        gauge(W * 0.84, "high P");
        const vThroat = wide / half(W / 2);
        setRO(ro, `throat width = <b>${P.narrow}%</b> · flow there is <b>${vThroat.toFixed(2)}×</b> faster · so its pressure is <b>lowest</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Charles's law: raise temperature → gas expands in proportion ---- */
    charles(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Heat the gas and it expands to keep the pressure steady — volume rises in step with absolute temperature.";
      const cylX = 110, cylW = 250, cylBot = H - 60, cylTop = 50, span = cylBot - cylTop - 30;
      const N = 30;
      const mol = Array.from({ length: N }, (_, i) => ({
        x: cylX + 20 + ((i * 53) % (cylW - 40)),
        y: cylBot - 30 - ((i * 71) % 120),
        vx: ((i % 5) - 2) || 1, vy: ((i % 4) - 1.5) || 1,
      }));
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        const frac = clamp(P.temp / 520, 0.12, 1);
        const gasH = span * frac;
        const pistonY = cylBot - gasH;
        const speed = 0.5 + (P.temp / 500) * 2.3;
        const heat = clamp((P.temp - 150) / 350, 0, 1);
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(cylX, cylTop); ctx.lineTo(cylX, cylBot); ctx.lineTo(cylX + cylW, cylBot); ctx.lineTo(cylX + cylW, cylTop); ctx.stroke();
        ctx.fillStyle = `rgba(255,${150 - heat * 110},${90 - heat * 70},${0.08 + heat * 0.14})`;
        ctx.fillRect(cylX + 2, pistonY, cylW - 4, gasH);
        ctx.fillStyle = cssVar("--accent-2");
        mol.forEach((m) => {
          m.x += m.vx * speed * 0.5; m.y += m.vy * speed * 0.5;
          if (m.x < cylX + 8 || m.x > cylX + cylW - 8) m.vx *= -1;
          if (m.y > cylBot - 8 || m.y < pistonY + 8) m.vy *= -1;
          m.x = clamp(m.x, cylX + 8, cylX + cylW - 8);
          m.y = clamp(m.y, pistonY + 8, cylBot - 8);
          ctx.beginPath(); ctx.arc(m.x, m.y, 4.5, 0, TAU); ctx.fill();
        });
        ctx.fillStyle = cssVar("--accent"); roundRect(ctx, cylX - 6, pistonY - 16, cylW + 12, 16, 4); ctx.fill();
        ctx.fillStyle = cssVar("--muted"); ctx.fillRect(cylX + cylW / 2 - 6, pistonY - 52, 12, 38);
        // thermometer
        const tx = cylX + cylW + 80, tTop = cylTop + 10, tBot = cylBot - 10;
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(tx, tTop); ctx.lineTo(tx, tBot); ctx.stroke();
        ctx.beginPath(); ctx.arc(tx, tBot + 14, 13, 0, TAU); ctx.stroke();
        ctx.fillStyle = cssVar("--warn");
        const mercH = (tBot - tTop) * clamp((P.temp - 100) / 420, 0.05, 1);
        ctx.fillRect(tx - 3, tBot - mercH, 6, mercH);
        ctx.beginPath(); ctx.arc(tx, tBot + 14, 11, 0, TAU); ctx.fill();
        setRO(ro, `T = <b>${P.temp} K</b> · volume ∝ T → fills <b>${(frac * 100).toFixed(0)}%</b> · V/T = <b>${(frac / P.temp * 1000).toFixed(2)}</b> (constant)`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Faraday: a moving magnet through a coil drives the meter ---- */
    induction(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, cy = H * 0.46;
      cap.textContent = "Only a CHANGING field induces a voltage. Move the magnet faster, or add turns, for a bigger swing — reverse the motion and the needle flips.";
      const coilX = W * 0.5, coilW = 120;
      let t = 0;
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        t += 0.02 * P.speed;
        const swing = 110;
        const mx = coilX - 30 + Math.sin(t) * swing;
        const vel = Math.cos(t) * P.speed;
        const inside = Math.abs(mx - coilX) < coilW;
        const emf = inside ? vel * P.turns * 0.9 : vel * P.turns * 0.18;
        // coil
        ctx.strokeStyle = cssVar("--accent"); ctx.lineWidth = 3;
        const turns = P.turns;
        for (let i = 0; i < turns; i++) {
          const lx = coilX - coilW / 2 + (i / Math.max(1, turns - 1)) * coilW;
          ctx.beginPath(); ctx.ellipse(lx, cy, 10, 46, 0, 0, TAU); ctx.stroke();
        }
        // leads down to the meter
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(coilX - coilW / 2, cy + 46); ctx.lineTo(coilX - coilW / 2, H - 70); ctx.lineTo(W / 2 - 40, H - 70); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(coilX + coilW / 2, cy + 46); ctx.lineTo(coilX + coilW / 2, H - 70); ctx.lineTo(W / 2 + 40, H - 70); ctx.stroke();
        // magnet
        const mw = 90, mh = 30;
        ctx.fillStyle = "#e8554d"; roundRect(ctx, mx - mw / 2, cy - mh / 2, mw / 2, mh, 4); ctx.fill();
        ctx.fillStyle = "#4d7de8"; roundRect(ctx, mx, cy - mh / 2, mw / 2, mh, 4); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "700 15px Inter"; ctx.textAlign = "center";
        ctx.fillText("N", mx - mw / 4, cy + 5); ctx.fillText("S", mx + mw / 4, cy + 5);
        if (Math.abs(vel) > 0.02) arrow(ctx, mx, cy - mh / 2 - 8, mx + Math.sign(vel) * (18 + Math.abs(vel) * 16), cy - mh / 2 - 8, cssVar("--warn"), 3);
        // galvanometer
        const gx = W / 2, gy = H - 70, gr = 34;
        ctx.fillStyle = cssVar("--card-2"); ctx.beginPath(); ctx.arc(gx, gy, gr, 0, TAU); ctx.fill();
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(gx, gy, gr, 0, TAU); ctx.stroke();
        const defl = clamp(emf, -1, 1) * 1.1;
        const ang = -Math.PI / 2 + defl;
        ctx.strokeStyle = cssVar("--warn"); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(ang) * (gr - 6), gy + Math.sin(ang) * (gr - 6)); ctx.stroke();
        ctx.fillStyle = cssVar("--muted"); ctx.font = "600 11px Inter"; ctx.textAlign = "center";
        ctx.fillText("− 0 +", gx, gy + gr + 16);
        setRO(ro, `N = <b>${P.turns} turns</b> · ${inside ? "magnet inside the coil" : "magnet outside"} · induced EMF ≈ <b>${(emf).toFixed(2)}</b> (∝ speed × turns)`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Centripetal force: ball on a string, inward pull ∝ v²/r ---- */
    centripetal(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, cx = W / 2, cy = H / 2;
      cap.textContent = "The inward (centripetal) force keeps the ball on its circular path. Faster spin or a tighter circle needs a stronger pull.";
      let ang = 0;
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        const r = clamp(34 + P.r * 22, 34, Math.min(W, H) / 2 - 34);
        const F = (P.mass * P.v * P.v) / P.r;
        ctx.strokeStyle = cssVar("--line"); ctx.setLineDash([5, 7]);
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = cssVar("--muted"); ctx.beginPath(); ctx.arc(cx, cy, 4, 0, TAU); ctx.fill();
        ang += (P.v / P.r) * 0.02 + 0.004;
        const px = cx + Math.cos(ang) * r, py = cy + Math.sin(ang) * r;
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
        const flen = clamp(F * 1.1, 14, r - 6);
        arrow(ctx, px, py, px + ((cx - px) / r) * flen, py + ((cy - py) / r) * flen, cssVar("--warn"), 3);
        arrow(ctx, px, py, px - Math.sin(ang) * 34, py + Math.cos(ang) * 34, cssVar("--accent-2"), 3);
        const r0 = 9 + P.mass * 1.6;
        const g = ctx.createRadialGradient(px - 3, py - 3, 1, px, py, r0);
        g.addColorStop(0, cssVar("--accent-2")); g.addColorStop(1, cssVar("--accent"));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r0, 0, TAU); ctx.fill();
        ctx.lineWidth = 1;
        setRO(ro, `F = m·v²/r = <b>${F.toFixed(1)} N</b> · v = <b>${P.v} m/s</b> · r = <b>${P.r} m</b> (yellow = inward force, green = velocity)`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Kinetic energy: a sliding block with an energy bar ∝ ½mv² ---- */
    kinetic(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, baseY = H * 0.62;
      cap.textContent = "Kinetic energy grows with the square of speed: double the speed and you quadruple the energy.";
      let x = 70;
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        const KE = 0.5 * P.mass * P.v * P.v;
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(40, baseY + 30); ctx.lineTo(W - 40, baseY + 30); ctx.stroke();
        x += P.v * 0.8; if (x > W - 60) x = 70;
        const w = 38 + P.mass * 5, h = 28 + P.mass * 3;
        arrow(ctx, x, baseY + 30 - h / 2, x + 26 + P.v * 3, baseY + 30 - h / 2, cssVar("--accent-2"), 3);
        ctx.fillStyle = cssVar("--accent"); roundRect(ctx, x, baseY + 30 - h, w, h, 6); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "600 13px Inter"; ctx.textAlign = "center";
        ctx.fillText(P.mass + " kg", x + w / 2, baseY + 30 - h / 2 + 4);
        const barX = 50, barY = 38, barW = W - 100, barH = 18;
        ctx.strokeStyle = cssVar("--line"); ctx.strokeRect(barX, barY, barW, barH);
        const frac = clamp(KE / (0.5 * 10 * 12 * 12), 0, 1);
        ctx.fillStyle = cssVar("--warn"); ctx.fillRect(barX, barY, barW * frac, barH);
        ctx.fillStyle = cssVar("--text"); ctx.font = "600 12px Inter"; ctx.textAlign = "left";
        ctx.fillText("kinetic energy", barX, barY - 7);
        setRO(ro, `KE = ½·m·v² = <b>${KE.toFixed(1)} J</b> · m = <b>${P.mass} kg</b> · v = <b>${P.v} m/s</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Wave equation: a travelling sine wave, speed = f × λ ---- */
    wave(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, midY = H / 2;
      cap.textContent = "A wave's speed is its frequency times its wavelength. Stretch the wavelength or raise the frequency and it travels faster.";
      let shift = 0;
      (function loop() {
        shift += P.freq * 1.6;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = cssVar("--line"); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke();
        const lamPx = clamp(P.lambda * 70, 40, W);
        const k = TAU / lamPx, amp = 68;
        ctx.strokeStyle = cssVar("--accent"); ctx.lineWidth = 3; ctx.beginPath();
        for (let x = 0; x <= W; x += 3) {
          const y = midY - Math.sin(k * (x - shift)) * amp;
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke(); ctx.lineWidth = 1;
        const x0 = 40;
        ctx.strokeStyle = cssVar("--warn"); ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(x0, midY - amp - 12); ctx.lineTo(x0, midY + amp + 12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x0 + lamPx, midY - amp - 12); ctx.lineTo(x0 + lamPx, midY + amp + 12); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = cssVar("--warn"); ctx.font = "600 13px Inter"; ctx.textAlign = "center";
        ctx.fillText("λ", x0 + lamPx / 2, midY - amp - 18);
        const v = P.freq * P.lambda;
        setRO(ro, `v = f·λ = <b>${v.toFixed(1)} m/s</b> · f = <b>${P.freq} Hz</b> · λ = <b>${P.lambda} m</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Kepler's 3rd: wider orbits take longer, T² ∝ a³ ---- */
    kepler(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, cx = W / 2, cy = H / 2;
      cap.textContent = "The square of a planet's year equals the cube of its orbit size. Distant planets crawl; close ones race.";
      let ang = 0; const trail = [];
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        const r = clamp(28 + P.a * 44, 28, Math.min(W, H) / 2 - 26);
        ctx.strokeStyle = cssVar("--line"); ctx.setLineDash([5, 7]);
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        const g = ctx.createRadialGradient(cx, cy, 3, cx, cy, 22);
        g.addColorStop(0, "#fff6c8"); g.addColorStop(0.5, cssVar("--warn")); g.addColorStop(1, "rgba(255,180,84,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, TAU); ctx.fill();
        const T = Math.pow(P.a, 1.5);
        ang += 0.05 / T + 0.002;
        const px = cx + Math.cos(ang) * r, py = cy + Math.sin(ang) * r;
        trail.push([px, py]); if (trail.length > 60) trail.shift();
        ctx.strokeStyle = cssVar("--accent"); ctx.globalAlpha = 0.5;
        ctx.beginPath(); trail.forEach(([tx, ty], i) => (i ? ctx.lineTo(tx, ty) : ctx.moveTo(tx, ty))); ctx.stroke();
        ctx.globalAlpha = 1;
        const pg = ctx.createRadialGradient(px - 3, py - 3, 1, px, py, 9);
        pg.addColorStop(0, cssVar("--accent-2")); pg.addColorStop(1, cssVar("--accent"));
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, 9, 0, TAU); ctx.fill();
        setRO(ro, `a = <b>${P.a.toFixed(1)}</b> · T = a^(3/2) = <b>${T.toFixed(2)}</b> years (so T² = a³)`);
        requestAnimationFrame(loop);
      })();
    },
  };

  export const PHYS_ANIM = ANIMATIONS;

  /* ---------------------------------------------------------------
     Turn a range slider into a "slider + type-any-number" control.
     Replaces `displayEl` with an editable number box that stays in
     sync with the slider. Typing a value outside the slider's range
     auto-expands the slider, so values are never capped to presets.
     Returns the created number input.
     --------------------------------------------------------------- */
  export function makeEditable(slider, displayEl) {
    const num = document.createElement("input");
    num.type = "number";
    num.className = "num-input";
    const step = slider.getAttribute("step");
    num.step = step && step !== "" ? step : "any";
    num.value = slider.value;
    if (displayEl && displayEl.replaceWith) displayEl.replaceWith(num);
    else slider.insertAdjacentElement("afterend", num);

    // slider drag -> number box
    slider.addEventListener("input", () => {
      if (document.activeElement !== num) num.value = slider.value;
    });
    // typed number -> slider (extend the range if needed)
    const apply = () => {
      const v = parseFloat(num.value);
      if (isNaN(v)) return;
      if (v > +slider.max) slider.max = String(v);
      if (v < +slider.min) slider.min = String(v);
      slider.value = String(v);
      slider.dispatchEvent(new Event("input", { bubbles: true }));
    };
    num.addEventListener("input", apply);
    return num;
  }
