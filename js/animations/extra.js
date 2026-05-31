/* =====================================================================
   chem-math-animations.js — animations for the Chemistry & Maths
   libraries. Loads AFTER animations.js and merges its functions into the
   shared PHYS_ANIM registry. Merged into the base engine in index.js.
   Same calling convention: fn(canvas, captionEl, P, readoutEl).
   ===================================================================== */
const TAU = Math.PI * 2;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const cssVar = (n) => getComputedStyle(document.body).getPropertyValue(n).trim();
  const setRO = (el, html) => { if (el) el.innerHTML = html; };
  const lerp = (a, b, t) => a + (b - a) * t;
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

  const EXTRA = {

    /* ============================ CHEMISTRY ============================ */

    /* ---- Atomic structure: electrons fill shells around a nucleus ---- */
    c_atom(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, cx = W / 2, cy = H / 2;
      cap.textContent = "Electrons orbit the nucleus in shells that fill 2, then 8, then 8. A full outer shell makes an atom stable.";
      const SYM = ["", "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca"];
      const caps = [2, 8, 8, 2];
      let t = 0;
      (function loop() {
        t += 0.012;
        ctx.clearRect(0, 0, W, H);
        const Z = clamp(Math.round(P.z), 1, 20);
        const shells = []; let left = Z;
        for (let i = 0; i < caps.length && left > 0; i++) { const n = Math.min(caps[i], left); shells.push(n); left -= n; }
        const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 24);
        g.addColorStop(0, "#ffd2cc"); g.addColorStop(1, cssVar("--accent"));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, TAU); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "700 17px Inter"; ctx.textAlign = "center";
        ctx.fillText(SYM[Z] || "?", cx, cy + 6);
        shells.forEach((n, si) => {
          const r = 50 + si * 40;
          ctx.strokeStyle = cssVar("--line"); ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
          const spin = t * (1.5 - si * 0.28) * (si % 2 ? -1 : 1);
          for (let k = 0; k < n; k++) {
            const a = spin + (k / n) * TAU;
            const ex = cx + Math.cos(a) * r, ey = cy + Math.sin(a) * r;
            ctx.fillStyle = cssVar("--accent-2"); ctx.beginPath(); ctx.arc(ex, ey, 6, 0, TAU); ctx.fill();
          }
        });
        setRO(ro, `${SYM[Z] || "?"} · Z = <b>${Z}</b> · electron arrangement = <b>${shells.join(", ")}</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Periodic table: highlight an element & show size trends ---- */
    c_periodic(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Elements line up in periods (rows) and groups (columns). Atoms shrink across a period and grow down a group.";
      const EL = [
        ["H", 1, 1], ["He", 18, 1], ["Li", 1, 2], ["Be", 2, 2], ["B", 13, 2], ["C", 14, 2], ["N", 15, 2], ["O", 16, 2], ["F", 17, 2], ["Ne", 18, 2],
        ["Na", 1, 3], ["Mg", 2, 3], ["Al", 13, 3], ["Si", 14, 3], ["P", 15, 3], ["S", 16, 3], ["Cl", 17, 3], ["Ar", 18, 3], ["K", 1, 4], ["Ca", 2, 4],
      ];
      const cell = 28, gap = 3, x0 = 30, y0 = 40;
      let t = 0;
      (function loop() {
        t += 0.06;
        ctx.clearRect(0, 0, W, H);
        const Z = clamp(Math.round(P.z), 1, 20);
        EL.forEach((e, i) => {
          const [sym, grp, per] = e;
          const x = x0 + (grp - 1) * (cell + gap), y = y0 + (per - 1) * (cell + gap);
          const sel = i + 1 === Z;
          ctx.fillStyle = sel ? cssVar("--accent") : cssVar("--card-2");
          roundRect(ctx, x, y, cell, cell, 4); ctx.fill();
          if (sel) { ctx.strokeStyle = cssVar("--warn"); ctx.lineWidth = 2 + (Math.sin(t) + 1); roundRect(ctx, x, y, cell, cell, 4); ctx.stroke(); }
          ctx.fillStyle = sel ? "#fff" : cssVar("--muted"); ctx.font = "600 10px Inter"; ctx.textAlign = "center";
          ctx.fillText(sym, x + cell / 2, y + cell / 2 + 4);
        });
        const [sym, grp, per] = EL[Z - 1];
        ctx.fillStyle = cssVar("--muted"); ctx.font = "600 12px Inter"; ctx.textAlign = "left";
        arrow(ctx, x0, H - 54, x0 + 150, H - 54, cssVar("--accent-2"), 2);
        ctx.fillText("smaller across →", x0, H - 62);
        arrow(ctx, x0 - 6, y0, x0 - 6, y0 + 110, cssVar("--accent-2"), 2);
        const radius = clamp(8 + (18 - grp) * 1.1 + per * 5, 8, 48);
        const rx = W - 80, ry = H / 2 + 6;
        ctx.fillStyle = cssVar("--accent"); ctx.beginPath(); ctx.arc(rx, ry, radius, 0, TAU); ctx.fill();
        ctx.fillStyle = cssVar("--text"); ctx.font = "600 13px Inter"; ctx.textAlign = "center";
        ctx.fillText(sym + " atom", rx, ry + radius + 18);
        setRO(ro, `<b>${sym}</b> · group <b>${grp}</b> · period <b>${per}</b> · atom size shown right`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Ionic bonding: Na donates an electron to Cl, ions attract ---- */
    c_ionic(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, y = H / 2;
      cap.textContent = "Sodium gives its single outer electron to chlorine. Both reach full shells, becoming + and − ions that snap together.";
      let phase, ep, hold, naX, clX;
      const reset = () => { phase = 0; ep = 0; hold = 0; naX = W * 0.32; clX = W * 0.68; };
      reset();
      const atom = (x, r, col, label, charge) => {
        ctx.strokeStyle = cssVar("--line"); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, r + 14, 0, TAU); ctx.stroke();
        const g = ctx.createRadialGradient(x - 4, y - 4, 3, x, y, r);
        g.addColorStop(0, "#fff"); g.addColorStop(1, col);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
        ctx.fillStyle = "#06223a"; ctx.font = "700 15px Inter"; ctx.textAlign = "center";
        ctx.fillText(label, x, y + 5);
        if (charge) { ctx.fillStyle = charge === "+" ? "#e8554d" : "#4d7de8"; ctx.font = "800 20px Inter"; ctx.fillText(charge, x + r + 12, y - r); }
      };
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        if (phase === 0) { ep += 0.012 * P.speed; if (ep >= 1) { ep = 1; phase = 1; } }
        else { naX = lerp(naX, W * 0.43, 0.05); clX = lerp(clX, W * 0.57, 0.05); if (++hold > 90) reset(); }
        atom(naX, 26, "#f4b13d", "Na", phase ? "+" : "");
        atom(clX, 30, "#5bd6b0", "Cl", phase ? "−" : "");
        if (phase === 0) {
          const ex = lerp(naX + 26, clX - 30, ep), ey = y - 46 * Math.sin(ep * Math.PI);
          ctx.fillStyle = cssVar("--accent-2"); ctx.beginPath(); ctx.arc(ex, ey, 7, 0, TAU); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.font = "700 10px Inter"; ctx.fillText("e⁻", ex, ey + 3);
        }
        setRO(ro, phase ? `Na⁺ and Cl⁻ attract → <b>ionic bond</b> (the compound NaCl)` : `sodium's outer electron transferring to chlorine…`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Covalent bonding: shared electron pairs orbit between atoms ---- */
    c_covalent(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, y = H / 2;
      cap.textContent = "Two atoms share pairs of electrons so both complete their outer shells. More shared pairs = a stronger multiple bond.";
      const x1 = W / 2 - 60, x2 = W / 2 + 60, mid = W / 2;
      let t = 0;
      (function loop() {
        t += 0.04;
        ctx.clearRect(0, 0, W, H);
        const order = clamp(Math.round(P.order), 1, 3);
        const core = (x, col, label) => {
          const g = ctx.createRadialGradient(x - 4, y - 4, 3, x, y, 30);
          g.addColorStop(0, "#fff"); g.addColorStop(1, col);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 30, 0, TAU); ctx.fill();
          ctx.fillStyle = "#06223a"; ctx.font = "700 16px Inter"; ctx.textAlign = "center";
          ctx.fillText(label, x, y + 6);
        };
        core(x1, "#7aa2ff", "A"); core(x2, "#7aa2ff", "B");
        const offs = order === 1 ? [0] : order === 2 ? [-16, 16] : [-22, 0, 22];
        offs.forEach((off, pi) => {
          const a = t + pi * 1.1;
          for (let s = 0; s < 2; s++) {
            const ang = a + s * Math.PI;
            const ex = mid + Math.cos(ang) * 46, ey = y + off + Math.sin(ang) * 12;
            ctx.fillStyle = cssVar("--accent-2"); ctx.beginPath(); ctx.arc(ex, ey, 5.5, 0, TAU); ctx.fill();
          }
        });
        const names = ["", "single bond", "double bond", "triple bond"];
        setRO(ro, `bond order = <b>${order}</b> → <b>${order}</b> shared pair(s) · a <b>${names[order]}</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- States of matter: heat unlocks particles solid→liquid→gas ---- */
    c_states(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Heating gives particles energy: locked solid → flowing liquid → free gas. The same particles, just more motion.";
      const bx = W * 0.22, bw = W * 0.56, by = 70, bh = H - 150, bbot = by + bh;
      const cols = 8, rows = 5, N = cols * rows;
      const parts = [];
      for (let i = 0; i < N; i++) {
        const c = i % cols, r = Math.floor(i / cols);
        const hx = bx + bw * ((c + 0.5) / cols), hy = by + bh * ((r + 0.5) / rows);
        parts.push({ hx, hy, x: hx, y: hy, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, ph: Math.random() * TAU });
      }
      let t = 0;
      (function loop() {
        t += 0.03;
        ctx.clearRect(0, 0, W, H);
        const e = P.temp / 100, mode = P.temp < 35 ? 0 : P.temp < 70 ? 1 : 2;
        const sp = 0.5 + e * 3.4, topLimit = mode === 1 ? by + bh * 0.42 : by;
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, bbot); ctx.lineTo(bx + bw, bbot); ctx.lineTo(bx + bw, by); ctx.stroke();
        ctx.fillStyle = cssVar("--accent-2");
        parts.forEach((p) => {
          if (mode === 0) { p.x = p.hx + Math.sin(t * 4 + p.ph) * e * 8; p.y = p.hy + Math.cos(t * 3 + p.ph) * e * 8; }
          else {
            p.x += p.vx * sp; p.y += p.vy * sp;
            if (p.x < bx + 7 || p.x > bx + bw - 7) { p.vx *= -1; p.x = clamp(p.x, bx + 7, bx + bw - 7); }
            if (p.y < topLimit + 7 || p.y > bbot - 7) { p.vy *= -1; p.y = clamp(p.y, topLimit + 7, bbot - 7); }
          }
          ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, TAU); ctx.fill();
        });
        const label = ["SOLID — vibrating in a lattice", "LIQUID — sliding, still touching", "GAS — flying freely"][mode];
        ctx.fillStyle = cssVar("--text"); ctx.font = "600 14px Inter"; ctx.textAlign = "center";
        ctx.fillText(label, W / 2, 40);
        setRO(ro, `temperature = <b>${P.temp}%</b> · state: <b>${["solid", "liquid", "gas"][mode]}</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Chemical reactions: same atoms regroup (2H₂ + O₂ → 2H₂O) ---- */
    c_reaction(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Bonds break and reform, but every atom is conserved — so the mass of reactants equals the mass of products.";
      const Rpos = [[120, 150], [165, 150], [120, 215], [165, 215], [128, 300], [173, 300]];
      const Ppos = [[535, 120], [605, 120], [535, 300], [605, 300], [570, 150], [570, 270]];
      const isO = (i) => i >= 4;
      let t = 0;
      (function loop() {
        t += 0.012 * P.speed;
        const p = Math.sin(t) * 0.5 + 0.5, e = p * p * (3 - 2 * p);
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = cssVar("--muted"); ctx.font = "600 16px Inter"; ctx.textAlign = "center";
        ctx.fillText("2H₂  +  O₂", W * 0.2, 70);
        arrow(ctx, W / 2 - 40, 64, W / 2 + 40, 64, cssVar("--accent-2"), 3);
        ctx.fillText("2H₂O", W * 0.8, 70);
        for (let i = 0; i < 6; i++) {
          const x = lerp(Rpos[i][0], Ppos[i][0], e), y = lerp(Rpos[i][1], Ppos[i][1], e);
          const r = isO(i) ? 17 : 10, col = isO(i) ? "#e8554d" : "#dfe7ff";
          const g = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, r);
          g.addColorStop(0, "#fff"); g.addColorStop(1, col);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
          ctx.fillStyle = "#06223a"; ctx.font = "700 11px Inter"; ctx.textAlign = "center";
          ctx.fillText(isO(i) ? "O" : "H", x, y + 4);
        }
        const baseY = H - 28;
        ctx.fillStyle = cssVar("--accent"); roundRect(ctx, W * 0.2 - 40, baseY - 18, 80, 14, 4); ctx.fill();
        roundRect(ctx, W * 0.8 - 40, baseY - 18, 80, 14, 4); ctx.fill();
        ctx.fillStyle = cssVar("--muted"); ctx.font = "600 12px Inter";
        ctx.fillText("mass = mass  (4 H + 2 O both sides)", W / 2, baseY - 4);
        setRO(ro, `4 hydrogen + 2 oxygen atoms before <b>and</b> after → <b>mass conserved</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Reaction rate: more heat & more particles → more collisions ---- */
    c_kinetics(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Reactions speed up when particles collide more often and harder — raise the temperature or the concentration.";
      const bx = 40, by = 60, bw = W - 220, bh = H - 110, bbot = by + bh;
      const MAX = 60;
      const parts = Array.from({ length: MAX }, () => ({
        x: bx + 10 + Math.random() * (bw - 20), y: by + 10 + Math.random() * (bh - 20),
        vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
      }));
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        const n = clamp(Math.round(P.conc), 4, MAX), sp = 0.4 + (P.temp / 100) * 3.6;
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 3; ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = cssVar("--accent");
        for (let i = 0; i < n; i++) {
          const p = parts[i];
          p.x += p.vx * sp; p.y += p.vy * sp;
          if (p.x < bx + 6 || p.x > bx + bw - 6) { p.vx *= -1; p.x = clamp(p.x, bx + 6, bx + bw - 6); }
          if (p.y < by + 6 || p.y > bbot - 6) { p.vy *= -1; p.y = clamp(p.y, by + 6, bbot - 6); }
          ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, TAU); ctx.fill();
        }
        const rate = clamp(((P.temp / 100) * n) / 22, 0, 1);
        const gx = W - 150, gy = by, gw = 36, gh = bh;
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2; ctx.strokeRect(gx, gy, gw, gh);
        ctx.fillStyle = cssVar("--warn"); ctx.fillRect(gx + 1, gy + gh - gh * rate + 1, gw - 2, gh * rate - 2);
        ctx.fillStyle = cssVar("--text"); ctx.font = "600 13px Inter"; ctx.textAlign = "center";
        ctx.fillText("rate", gx + gw / 2, gy - 10);
        setRO(ro, `${n} particles at <b>${P.temp}%</b> energy → reaction rate <b>${(rate * 100).toFixed(0)}%</b> (∝ collisions/sec)`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Activation energy: a catalyst lowers the barrier to cross ---- */
    c_catalyst(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Reactants must climb an energy barrier to become products. A catalyst opens a lower path, so more attempts succeed.";
      const x0 = 70, x1 = W - 70;
      const baseR = H * 0.4, baseP = H * 0.66;
      let s = 0;
      const prof = (u, hump) => lerp(baseR, baseP, u) - hump * Math.exp(-Math.pow((u - 0.5) / 0.16, 2));
      (function loop() {
        s += 0.006; if (s > 1) s = 0;
        ctx.clearRect(0, 0, W, H);
        const hump = 86 * (1 - 0.78 * (P.cat / 100));
        ctx.strokeStyle = cssVar("--line"); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, baseR); ctx.lineTo(x0 - 18, baseR); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x1, baseP); ctx.lineTo(x1 + 18, baseP); ctx.stroke();
        ctx.strokeStyle = cssVar("--accent"); ctx.lineWidth = 3; ctx.beginPath();
        for (let u = 0; u <= 1; u += 0.01) { const x = lerp(x0, x1, u); const yy = prof(u, hump); u === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
        ctx.stroke();
        const bx = lerp(x0, x1, s), bcol = cssVar("--warn");
        ctx.fillStyle = bcol; ctx.beginPath(); ctx.arc(bx, prof(s, hump) - 9, 9, 0, TAU); ctx.fill();
        const peak = prof(0.5, hump);
        ctx.strokeStyle = cssVar("--accent-2"); ctx.setLineDash([4, 5]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x0, baseR); ctx.lineTo(W / 2, baseR); ctx.lineTo(W / 2, peak); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = cssVar("--muted"); ctx.font = "600 12px Inter"; ctx.textAlign = "center";
        ctx.fillText("Eₐ", W / 2 + 16, (baseR + peak) / 2);
        ctx.textAlign = "left"; ctx.fillText("reactants", x0 - 14, baseR - 14);
        ctx.textAlign = "right"; ctx.fillText("products", x1 + 14, baseP + 22);
        setRO(ro, `catalyst = <b>${P.cat}%</b> → activation barrier lowered to <b>${(hump / 86 * 100).toFixed(0)}%</b> of its original height`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Chemical equilibrium: forward & reverse rates settle equal ---- */
    c_equilibrium(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Products build up until the reverse reaction matches the forward one. Amounts then hold steady — a dynamic balance.";
      const TOT = 40;
      let nA = 20, nB = 20;
      const boxes = (cnt, bx, by, bw, bh, col) => {
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = col;
        for (let i = 0; i < Math.round(cnt); i++) {
          const px = bx + 12 + ((i * 53) % (bw - 24)), py = by + 14 + ((Math.floor(i / Math.max(1, Math.floor((bw - 24) / 18))) * 18) % (bh - 28));
          ctx.beginPath(); ctx.arc(px, py, 5, 0, TAU); ctx.fill();
        }
      };
      (function loop() {
        const dA = (P.kf * nA - P.kr * nB) * 0.01;
        nA = clamp(nA - dA, 0, TOT); nB = TOT - nA;
        ctx.clearRect(0, 0, W, H);
        const bw = W * 0.32, bh = H - 150, by = 80;
        boxes(nA, 40, by, bw, bh, cssVar("--accent"));
        boxes(nB, W - 40 - bw, by, bw, bh, cssVar("--accent-2"));
        ctx.fillStyle = cssVar("--text"); ctx.font = "700 18px Inter"; ctx.textAlign = "center";
        ctx.fillText("A", 40 + bw / 2, by - 16); ctx.fillText("B", W - 40 - bw / 2, by - 16);
        const my = by + bh / 2;
        arrow(ctx, W / 2 - 36, my - 12, W / 2 + 36, my - 12, cssVar("--accent"), 1 + P.kf * 0.6);
        arrow(ctx, W / 2 + 36, my + 12, W / 2 - 36, my + 12, cssVar("--accent-2"), 1 + P.kr * 0.6);
        setRO(ro, `[A] = <b>${nA.toFixed(0)}</b> · [B] = <b>${nB.toFixed(0)}</b> · at equilibrium [A]:[B] ≈ <b>${P.kr}:${P.kf}</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Acids, bases & pH: indicator colour across the 0–14 scale ---- */
    c_ph(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "The pH scale runs 0 (acid) → 7 (neutral) → 14 (alkali). Universal indicator shows it as a colour; each step is ×10 in H⁺.";
      const phColor = (ph) => {
        const stops = [[0, 214, 40, 40], [3, 240, 120, 40], [6, 220, 210, 40], [7, 70, 200, 90], [9, 50, 150, 220], [11, 70, 90, 210], [14, 120, 50, 190]];
        for (let i = 0; i < stops.length - 1; i++) {
          if (ph <= stops[i + 1][0]) {
            const a = stops[i], b = stops[i + 1], f = (ph - a[0]) / (b[0] - a[0]);
            return `rgb(${Math.round(lerp(a[1], b[1], f))},${Math.round(lerp(a[2], b[2], f))},${Math.round(lerp(a[3], b[3], f))})`;
          }
        }
        return "rgb(120,50,190)";
      };
      const bubbles = Array.from({ length: 16 }, () => ({ x: Math.random(), y: Math.random(), r: 2 + Math.random() * 3 }));
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        const ph = clamp(P.ph, 0, 14);
        const bx = W * 0.18, bw = 220, bTop = 80, bBot = H - 60, lvl = bTop + 40;
        ctx.fillStyle = phColor(ph);
        ctx.fillRect(bx, lvl, bw, bBot - lvl);
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        bubbles.forEach((b) => { b.y -= 0.004; if (b.y < 0) b.y = 1; ctx.beginPath(); ctx.arc(bx + b.x * bw, lvl + b.y * (bBot - lvl), b.r, 0, TAU); ctx.fill(); });
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(bx, bTop); ctx.lineTo(bx, bBot); ctx.lineTo(bx + bw, bBot); ctx.lineTo(bx + bw, bTop); ctx.stroke();
        const sx = W - 120, sTop = 70, sBot = H - 60;
        for (let i = 0; i <= 14; i++) {
          const yy = lerp(sTop, sBot, i / 14);
          ctx.fillStyle = phColor(i); ctx.fillRect(sx, yy, 30, (sBot - sTop) / 14 + 1);
        }
        const my = lerp(sTop, sBot, ph / 14);
        arrow(ctx, sx - 22, my, sx - 4, my, cssVar("--text"), 3);
        ctx.fillStyle = cssVar("--text"); ctx.font = "600 12px Inter"; ctx.textAlign = "left";
        ctx.fillText("0 acid", sx + 36, sTop + 6); ctx.fillText("7", sx + 36, (sTop + sBot) / 2); ctx.fillText("14 base", sx + 36, sBot);
        const kind = ph < 6.5 ? "acidic" : ph > 7.5 ? "alkaline" : "neutral";
        setRO(ro, `pH = <b>${ph.toFixed(1)}</b> → <b>${kind}</b> · [H⁺] ≈ <b>10<sup>−${ph.toFixed(1)}</sup></b> mol/L`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Electrolysis: a voltage drives ions to opposite electrodes ---- */
    c_electrolysis(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "A voltage pulls positive ions to the cathode (−) and negative ions to the anode (+). More volts → faster, more bubbles.";
      const cellX = 90, cellW = W - 180, cellTop = 110, cellBot = H - 50;
      const cath = cellX + 40, anode = cellX + cellW - 40;
      const ions = Array.from({ length: 24 }, (_, i) => ({
        x: cellX + 60 + Math.random() * (cellW - 120), y: cellTop + 30 + Math.random() * (cellBot - cellTop - 50), sign: i % 2 ? 1 : -1,
      }));
      const bub = [];
      let fc = 0;
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        const V = P.volt, sp = V * 0.25;
        ctx.strokeStyle = cssVar("--accent-2"); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cath, 50); ctx.lineTo(cath, 30); ctx.lineTo(anode, 30); ctx.lineTo(anode, 50); ctx.stroke();
        ctx.fillStyle = cssVar("--text"); ctx.font = "700 14px Inter"; ctx.textAlign = "center";
        ctx.fillText(V.toFixed(1) + " V", W / 2, 24);
        ctx.fillStyle = "rgba(91,140,255,0.10)"; ctx.fillRect(cellX, cellTop, cellW, cellBot - cellTop);
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(cellX, cellTop); ctx.lineTo(cellX, cellBot); ctx.lineTo(cellX + cellW, cellBot); ctx.lineTo(cellX + cellW, cellTop); ctx.stroke();
        ctx.fillStyle = cssVar("--muted"); ctx.fillRect(cath - 8, 50, 16, cellBot - 50);
        ctx.fillStyle = cssVar("--warn"); ctx.fillRect(anode - 8, 50, 16, cellBot - 50);
        ctx.fillStyle = cssVar("--text"); ctx.font = "800 16px Inter";
        ctx.fillText("−", cath, cellTop - 6); ctx.fillText("+", anode, cellTop - 6);
        ions.forEach((io) => {
          const target = io.sign > 0 ? cath : anode;
          io.x += Math.sign(target - io.x) * sp; io.y += (Math.random() - 0.5) * 1.5;
          io.y = clamp(io.y, cellTop + 16, cellBot - 16);
          if (Math.abs(io.x - target) < 18) { io.x = cellX + 60 + Math.random() * (cellW - 120); }
          ctx.fillStyle = io.sign > 0 ? "#e8554d" : "#4d7de8";
          ctx.beginPath(); ctx.arc(io.x, io.y, 7, 0, TAU); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.font = "800 11px Inter"; ctx.fillText(io.sign > 0 ? "+" : "−", io.x, io.y + 4);
        });
        if (++fc % Math.max(2, Math.round(12 - V)) === 0 && V > 0.2) { bub.push({ x: cath, y: cellBot - 20 }); bub.push({ x: anode, y: cellBot - 20 }); }
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        for (let i = bub.length - 1; i >= 0; i--) { const b = bub[i]; b.y -= 1.5; if (b.y < cellTop) bub.splice(i, 1); else { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, TAU); ctx.fill(); } }
        setRO(ro, `voltage = <b>${V.toFixed(1)} V</b> · ions drift to the electrodes and discharge — gas bubbles off ${V > 0.2 ? "<b>steadily</b>" : "<b>barely</b>"}`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Diffusion: random walks spread particles until evenly mixed ---- */
    c_diffusion(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Each particle just jiggles at random, yet a crowded region always spreads to fill the space evenly. No stirring needed.";
      const bx = 50, by = 60, bw = W - 100, bh = H - 110;
      const N = 90;
      let parts, fc;
      const seed = () => { parts = Array.from({ length: N }, () => ({ x: bx + 8 + Math.random() * (bw * 0.28), y: by + 8 + Math.random() * (bh - 16) })); fc = 0; };
      seed();
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        const step = 0.6 + (P.temp / 100) * 4;
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 3; ctx.strokeRect(bx, by, bw, bh);
        ctx.strokeStyle = cssVar("--line"); ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.moveTo(bx + bw / 2, by); ctx.lineTo(bx + bw / 2, by + bh); ctx.stroke(); ctx.setLineDash([]);
        let leftCount = 0;
        ctx.fillStyle = cssVar("--accent");
        parts.forEach((p) => {
          p.x += (Math.random() - 0.5) * step * 2; p.y += (Math.random() - 0.5) * step * 2;
          p.x = clamp(p.x, bx + 6, bx + bw - 6); p.y = clamp(p.y, by + 6, by + bh - 6);
          if (p.x < bx + bw / 2) leftCount++;
          ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, TAU); ctx.fill();
        });
        const leftPct = (leftCount / N) * 100;
        if (++fc > 200 && Math.abs(leftPct - 50) < 6) seed();
        setRO(ro, `temperature = <b>${P.temp}%</b> · left half holds <b>${leftPct.toFixed(0)}%</b> of particles → evening out toward <b>50 / 50</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Radioactive decay: nuclei pop at random, halving each half-life ---- */
    c_decay(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Any one nucleus is unpredictable, yet a large sample always halves in a fixed time — the half-life.";
      const cols = 12, rows = 9, N = cols * rows;
      const gx = 60, gy = 60, cw = (W - 200) / cols, ch = (H - 110) / rows;
      let state, t;
      const seed = () => { state = new Array(N).fill(true); t = 0; };
      seed();
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        const half = Math.max(10, P.half);
        const pDecay = 1 - Math.pow(0.5, 1 / half);
        let alive = 0;
        for (let i = 0; i < N; i++) {
          if (state[i] && Math.random() < pDecay) state[i] = false;
          if (state[i]) alive++;
          const x = gx + (i % cols) * cw, y = gy + Math.floor(i / cols) * ch;
          ctx.fillStyle = state[i] ? cssVar("--accent") : cssVar("--card-2");
          ctx.beginPath(); ctx.arc(x + cw / 2, y + ch / 2, Math.min(cw, ch) * 0.32, 0, TAU); ctx.fill();
        }
        t++;
        if (alive < 3) seed();
        const hl = (t / half);
        const barX = W - 110, barY = gy, barH = H - 110;
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2; ctx.strokeRect(barX, barY, 40, barH);
        ctx.fillStyle = cssVar("--accent"); const fh = barH * (alive / N); ctx.fillRect(barX + 1, barY + barH - fh + 1, 38, fh - 2);
        ctx.fillStyle = cssVar("--text"); ctx.font = "600 12px Inter"; ctx.textAlign = "center";
        ctx.fillText("remaining", barX + 20, barY - 10);
        setRO(ro, `<b>${alive}</b> of ${N} nuclei remain · ≈ <b>${hl.toFixed(1)}</b> half-lives elapsed (theory: ${(N * Math.pow(0.5, hl)).toFixed(0)})`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Concentration: solute per volume; dilute to lower it ---- */
    c_concentration(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Concentration is solute ÷ volume. Add solute and it climbs; add solvent (dilute) and the same solute spreads thinner.";
      const bx = W / 2 - 110, bw = 220, bTop = 70, bBot = H - 50;
      const dots = Array.from({ length: 50 }, () => ({ x: Math.random(), y: Math.random(), px: 0, py: 0 }));
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        const n = clamp(Math.round(P.solute), 2, 50);
        const fillFrac = P.vol / 100, lvl = bBot - (bBot - bTop) * fillFrac;
        ctx.fillStyle = "rgba(91,140,255,0.16)"; ctx.fillRect(bx, lvl, bw, bBot - lvl);
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(bx, bTop); ctx.lineTo(bx, bBot); ctx.lineTo(bx + bw, bBot); ctx.lineTo(bx + bw, bTop); ctx.stroke();
        ctx.fillStyle = cssVar("--accent-2");
        for (let i = 0; i < n; i++) {
          const d = dots[i];
          d.x += (Math.random() - 0.5) * 0.01; d.y += (Math.random() - 0.5) * 0.01;
          d.x = clamp(d.x, 0.04, 0.96); d.y = clamp(d.y, 0.04, 0.96);
          const px = bx + 8 + d.x * (bw - 16), py = lvl + 6 + d.y * (bBot - lvl - 12);
          ctx.beginPath(); ctx.arc(px, py, 5, 0, TAU); ctx.fill();
        }
        const conc = n / fillFrac / 25;
        setRO(ro, `solute = <b>${n}</b> · volume = <b>${P.vol}%</b> → concentration ≈ <b>${conc.toFixed(2)} mol/L</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ============================== MATHS ============================== */

    /* ---- Number line: hop from a by b to reach the sum ---- */
    m_numberline(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, y = H / 2;
      cap.textContent = "Adding moves you right along the line, subtracting moves you left. Watch the hop from a by b.";
      const lo = -10, hi = 10, pad = 50;
      const X = (v) => lerp(pad, W - pad, (v - lo) / (hi - lo));
      let prog = 0, wait = 0;
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(pad - 10, y); ctx.lineTo(W - pad + 10, y); ctx.stroke();
        ctx.fillStyle = cssVar("--muted"); ctx.font = "600 11px Inter"; ctx.textAlign = "center";
        for (let v = lo; v <= hi; v++) {
          const x = X(v);
          ctx.strokeStyle = v === 0 ? cssVar("--accent-2") : cssVar("--line"); ctx.lineWidth = v === 0 ? 2 : 1;
          ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x, y + 7); ctx.stroke();
          if (v % 2 === 0) { ctx.fillStyle = cssVar("--muted"); ctx.fillText(v, x, y + 24); }
        }
        const a = Math.round(P.a), b = Math.round(P.b), sum = clamp(a + b, lo, hi);
        if (wait > 0) { wait--; if (wait === 0) prog = 0; }
        else { prog += 0.012; if (prog >= 1) { prog = 1; wait = 60; } }
        const cur = lerp(a, a + b, prog);
        const cx = X(clamp(cur, lo, hi)), hop = Math.abs(Math.sin(cur * Math.PI)) * 22;
        ctx.fillStyle = cssVar("--line"); ctx.beginPath(); ctx.arc(X(a), y, 6, 0, TAU); ctx.fill();
        if (b !== 0) arrow(ctx, X(a), y - 30, X(a + b), y - 30, cssVar("--accent-2"), 2);
        ctx.fillStyle = cssVar("--warn"); ctx.beginPath(); ctx.arc(cx, y - hop, 9, 0, TAU); ctx.fill();
        setRO(ro, `<b>${a}</b> ${b < 0 ? "−" : "+"} <b>${Math.abs(b)}</b> = <b>${a + b}</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Pythagoras: squares on the legs tile the square on the hypotenuse ---- */
    m_pythagoras(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Build a square on each side of a right triangle: the two smaller squares together exactly fill the largest.";
      const sc = 28, O = { x: W * 0.42, y: H * 0.66 };
      let t = 0;
      (function loop() {
        t += 0.04;
        ctx.clearRect(0, 0, W, H);
        const a = P.a, b = P.b, c = Math.hypot(a, b);
        const aP = a * sc, bP = b * sc, P1 = { x: O.x + bP, y: O.y }, P2 = { x: O.x, y: O.y - aP };
        const pulse = 0.18 + Math.abs(Math.sin(t)) * 0.16;
        // square on b (below)
        ctx.fillStyle = `rgba(91,140,255,${pulse})`; ctx.fillRect(O.x, O.y, bP, bP);
        // square on a (left)
        ctx.fillStyle = `rgba(56,232,200,${pulse})`; ctx.fillRect(O.x - aP, O.y - aP, aP, aP);
        // square on c (outward from hypotenuse)
        const dx = (P2.x - P1.x) / c / sc, dy = (P2.y - P1.y) / c / sc; // unit along hyp (per px already)
        const ux = (P2.x - P1.x) / (c * sc), uy = (P2.y - P1.y) / (c * sc);
        let nx = -uy, ny = ux;
        if ((nx) * (O.x - P1.x) + (ny) * (O.y - P1.y) > 0) { nx = -nx; ny = -ny; }
        const cP = c * sc;
        ctx.fillStyle = `rgba(255,180,84,${pulse + 0.05})`;
        ctx.beginPath(); ctx.moveTo(P1.x, P1.y); ctx.lineTo(P2.x, P2.y);
        ctx.lineTo(P2.x + nx * cP, P2.y + ny * cP); ctx.lineTo(P1.x + nx * cP, P1.y + ny * cP); ctx.closePath(); ctx.fill();
        // triangle
        ctx.strokeStyle = cssVar("--text"); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(P1.x, P1.y); ctx.lineTo(P2.x, P2.y); ctx.closePath(); ctx.stroke();
        ctx.fillStyle = cssVar("--text"); ctx.font = "600 13px Inter"; ctx.textAlign = "center";
        ctx.fillText(`a² = ${(a * a).toFixed(1)}`, O.x - aP / 2, O.y - aP / 2);
        ctx.fillText(`b² = ${(b * b).toFixed(1)}`, O.x + bP / 2, O.y + bP / 2);
        ctx.fillText(`c² = ${(c * c).toFixed(1)}`, (P1.x + P2.x) / 2 + nx * cP / 2, (P1.y + P2.y) / 2 + ny * cP / 2);
        setRO(ro, `${(a * a).toFixed(1)} + ${(b * b).toFixed(1)} = <b>${(a * a + b * b).toFixed(1)}</b> = c² · so c = <b>${c.toFixed(2)}</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Unit circle: a spinning point traces sine & cosine ---- */
    m_unitcircle(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Cosine is how far across the spinning point is; sine is how far up. The height over time traces a sine wave.";
      const cxL = W * 0.26, cy = H / 2, R = 110;
      const waveX0 = cxL + R + 30, waveW = W - waveX0 - 30;
      let th = 0; const trail = [];
      (function loop() {
        th += 0.02 * P.speed;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = cssVar("--line"); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cxL - R - 10, cy); ctx.lineTo(cxL + R + 10, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cxL, cy - R - 10); ctx.lineTo(cxL, cy + R + 10); ctx.stroke();
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cxL, cy, R, 0, TAU); ctx.stroke();
        const px = cxL + Math.cos(th) * R, py = cy - Math.sin(th) * R;
        ctx.strokeStyle = cssVar("--accent"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cxL, cy); ctx.lineTo(px, py); ctx.stroke();
        ctx.strokeStyle = cssVar("--accent-2"); ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(cxL, py); ctx.stroke(); ctx.setLineDash([]);
        trail.unshift(py);
        if (trail.length > waveW) trail.pop();
        ctx.strokeStyle = cssVar("--line"); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(waveX0, cy); ctx.lineTo(waveX0 + waveW, cy); ctx.stroke();
        ctx.strokeStyle = cssVar("--warn"); ctx.lineWidth = 2; ctx.beginPath();
        trail.forEach((yy, i) => { const x = waveX0 + i; i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); });
        ctx.stroke();
        ctx.fillStyle = cssVar("--warn"); ctx.beginPath(); ctx.arc(px, py, 7, 0, TAU); ctx.fill();
        setRO(ro, `θ = <b>${((th % TAU) * 180 / Math.PI).toFixed(0)}°</b> · cos θ = <b>${Math.cos(th).toFixed(2)}</b> · sin θ = <b>${Math.sin(th).toFixed(2)}</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Linear functions: slope & intercept shape a straight line ---- */
    m_linear(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "A line climbs by its slope m for every step right, and crosses the y-axis at c. A point glides along it.";
      const ox = W / 2, oy = H / 2, s = 28;
      const X = (x) => ox + x * s, Y = (y) => oy - y * s;
      let t = 0;
      (function loop() {
        t += 0.012; if (t > 1) t = 0;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = cssVar("--line"); ctx.lineWidth = 1;
        for (let g = -8; g <= 8; g++) { ctx.beginPath(); ctx.moveTo(X(g), 0); ctx.lineTo(X(g), H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, Y(g)); ctx.lineTo(W, Y(g)); ctx.stroke(); }
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke();
        const m = P.m, c = P.c, xL = -9, xR = 9;
        ctx.strokeStyle = cssVar("--accent"); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(X(xL), Y(m * xL + c)); ctx.lineTo(X(xR), Y(m * xR + c)); ctx.stroke();
        ctx.strokeStyle = cssVar("--accent-2"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(X(0), Y(c)); ctx.lineTo(X(1), Y(c)); ctx.lineTo(X(1), Y(m + c)); ctx.stroke();
        ctx.fillStyle = cssVar("--accent-2"); ctx.font = "600 11px Inter"; ctx.textAlign = "center";
        ctx.fillText("1", X(0.5), Y(c) + 14); ctx.fillText("m", X(1) + 12, Y(c + m / 2));
        const xx = lerp(xL, xR, t);
        ctx.fillStyle = cssVar("--warn"); ctx.beginPath(); ctx.arc(X(xx), Y(m * xx + c), 7, 0, TAU); ctx.fill();
        setRO(ro, `y = <b>${m.toFixed(1)}</b>x ${c < 0 ? "−" : "+"} <b>${Math.abs(c).toFixed(1)}</b> · slope <b>${m.toFixed(1)}</b>, intercept <b>${c.toFixed(1)}</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Quadratics: a, b, c reshape the parabola; a ball rides it ---- */
    m_quadratic(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Squaring x bends the line into a parabola. a sets its width and direction; the curve's roots are where it meets the x-axis.";
      const ox = W / 2, oy = H * 0.6, s = 26;
      const X = (x) => ox + x * s, Y = (y) => oy - y * s;
      let t = 0;
      (function loop() {
        t += 0.01; if (t > 1) t = 0;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = cssVar("--line"); ctx.lineWidth = 1;
        for (let g = -9; g <= 9; g++) { ctx.beginPath(); ctx.moveTo(X(g), 0); ctx.lineTo(X(g), H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, Y(g)); ctx.lineTo(W, Y(g)); ctx.stroke(); }
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke();
        const a = P.a, b = P.b, c = P.c, f = (x) => a * x * x + b * x + c;
        ctx.strokeStyle = cssVar("--accent"); ctx.lineWidth = 3; ctx.beginPath();
        let first = true;
        for (let x = -9; x <= 9; x += 0.1) { const yy = f(x); if (yy < -9 || yy > 9) { first = true; continue; } const sx = X(x), sy = Y(yy); first ? (ctx.moveTo(sx, sy), first = false) : ctx.lineTo(sx, sy); }
        ctx.stroke();
        const disc = b * b - 4 * a * c;
        ctx.fillStyle = cssVar("--accent-2");
        if (Math.abs(a) > 1e-6 && disc >= 0) {
          [(-b + Math.sqrt(disc)) / (2 * a), (-b - Math.sqrt(disc)) / (2 * a)].forEach((r) => { if (r >= -9 && r <= 9) { ctx.beginPath(); ctx.arc(X(r), Y(0), 6, 0, TAU); ctx.fill(); } });
        }
        if (Math.abs(a) > 1e-6) { const vx = -b / (2 * a), vy = f(vx); ctx.fillStyle = cssVar("--text"); ctx.beginPath(); ctx.arc(X(vx), Y(vy), 4, 0, TAU); ctx.fill(); }
        const bx = lerp(-6, 6, t), by = f(bx);
        if (by >= -9 && by <= 9) { ctx.fillStyle = cssVar("--warn"); ctx.beginPath(); ctx.arc(X(bx), Y(by), 7, 0, TAU); ctx.fill(); }
        setRO(ro, `y = <b>${a.toFixed(1)}</b>x² + <b>${b.toFixed(1)}</b>x + <b>${c.toFixed(1)}</b> · ${disc >= 0 ? "<b>2 real roots</b>" : "<b>no real roots</b>"}`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- The circle: roll out the circumference, fill the area ---- */
    m_circle(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Roll a circle one full turn and the track it leaves is exactly 2πr long. Its filled area is πr².";
      const s = 24, cy = H * 0.4;
      let roll = 0;
      (function loop() {
        roll += 0.01; if (roll > 1.15) roll = 0;
        ctx.clearRect(0, 0, W, H);
        const r = P.r, rp = r * s, startX = 80;
        const trackLen = TAU * rp, travelled = Math.min(roll, 1) * trackLen;
        const ground = cy + rp + 20;
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(startX, ground); ctx.lineTo(startX + trackLen + 20, ground); ctx.stroke();
        ctx.strokeStyle = cssVar("--accent-2"); ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(startX, ground); ctx.lineTo(startX + travelled, ground); ctx.stroke();
        const cxp = startX + travelled, ccy = ground - rp;
        ctx.fillStyle = "rgba(91,140,255,0.18)"; ctx.beginPath(); ctx.arc(cxp, ccy, rp, 0, TAU); ctx.fill();
        ctx.strokeStyle = cssVar("--accent"); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cxp, ccy, rp, 0, TAU); ctx.stroke();
        const spokeA = roll * TAU;
        ctx.strokeStyle = cssVar("--warn"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cxp, ccy); ctx.lineTo(cxp + Math.cos(spokeA + Math.PI / 2) * rp, ccy + Math.sin(spokeA + Math.PI / 2) * rp); ctx.stroke();
        ctx.fillStyle = cssVar("--muted"); ctx.font = "600 13px Inter"; ctx.textAlign = "center";
        ctx.fillText("one turn = 2πr", startX + trackLen / 2, ground + 26);
        setRO(ro, `r = <b>${r}</b> · circumference 2πr = <b>${(TAU * r).toFixed(2)}</b> · area πr² = <b>${(Math.PI * r * r).toFixed(2)}</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Derivatives: a secant slides into the tangent (the limit) ---- */
    m_derivative(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Bring the two points of a secant line together and its slope becomes the tangent's slope — the derivative at that point.";
      const ox = W / 2, oy = H * 0.55, s = 42;
      const X = (x) => ox + x * s, Y = (y) => oy - y * s;
      const f = (x) => 0.18 * x * x * x - x, df = (x) => 0.54 * x * x - 1;
      let h = 2.2;
      (function loop() {
        h -= 0.012; if (h < 0.04) h = 2.2;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = cssVar("--line"); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke();
        ctx.strokeStyle = cssVar("--accent"); ctx.lineWidth = 3; ctx.beginPath();
        let first = true;
        for (let x = -4; x <= 4; x += 0.05) { const yy = f(x); if (yy < -6 || yy > 6) { first = true; continue; } first ? (ctx.moveTo(X(x), Y(yy)), first = false) : ctx.lineTo(X(x), Y(yy)); }
        ctx.stroke();
        const x0 = clamp(P.x, -3, 3), x1 = clamp(x0 + h, -4, 4);
        const slope = (f(x1) - f(x0)) / (x1 - x0);
        const ext = 4;
        ctx.strokeStyle = cssVar("--accent-2"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(X(x0 - ext), Y(f(x0) - slope * ext)); ctx.lineTo(X(x0 + ext), Y(f(x0) + slope * ext)); ctx.stroke();
        ctx.fillStyle = cssVar("--warn"); ctx.beginPath(); ctx.arc(X(x0), Y(f(x0)), 7, 0, TAU); ctx.fill();
        ctx.fillStyle = cssVar("--text"); ctx.beginPath(); ctx.arc(X(x1), Y(f(x1)), 5, 0, TAU); ctx.fill();
        setRO(ro, `at x = <b>${x0.toFixed(2)}</b> · secant slope <b>${slope.toFixed(2)}</b> → tangent slope f′(x) = <b>${df(x0).toFixed(2)}</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Integration: Riemann rectangles converge on the true area ---- */
    m_integral(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Slice the area under the curve into rectangles. The more (thinner) strips you use, the closer the total to the exact area.";
      const x0 = 60, x1 = W - 60, base = H - 60, top = 60;
      const A = 0, B = 6;
      const f = (x) => 1.2 + 2.6 * Math.sin(x * 0.5) * Math.sin(x * 0.5) + 0.15 * x;
      const X = (x) => lerp(x0, x1, (x - A) / (B - A)), sy = (H - 120) / 5, Y = (y) => base - y * sy;
      let t = 0;
      (function loop() {
        t += 0.04;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x1, base); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x0, top); ctx.stroke();
        const n = clamp(Math.round(P.n), 1, 60), dx = (B - A) / n;
        let area = 0;
        for (let i = 0; i < n; i++) {
          const xm = A + (i + 0.5) * dx, h = f(xm); area += h * dx;
          const rx = X(A + i * dx), rw = X(A + (i + 1) * dx) - rx;
          ctx.fillStyle = `rgba(56,232,200,${0.25 + 0.12 * Math.sin(t + i)})`;
          ctx.fillRect(rx, Y(h), rw, base - Y(h));
          ctx.strokeStyle = cssVar("--accent-2"); ctx.lineWidth = 1; ctx.strokeRect(rx, Y(h), rw, base - Y(h));
        }
        ctx.strokeStyle = cssVar("--accent"); ctx.lineWidth = 3; ctx.beginPath();
        for (let x = A; x <= B; x += 0.05) { const sx = X(x); x === A ? ctx.moveTo(sx, Y(f(x))) : ctx.lineTo(sx, Y(f(x))); }
        ctx.stroke();
        let exact = 0; for (let x = A; x < B; x += 0.001) exact += f(x) * 0.001;
        setRO(ro, `<b>${n}</b> strips → area ≈ <b>${area.toFixed(3)}</b> · exact integral = <b>${exact.toFixed(3)}</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Vectors: add tip-to-tail; a walker traces the path to R ---- */
    m_vectors(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Lay vector b's tail on a's tip; the single arrow from start to finish is their sum. A walker traces the route.";
      const ox = W / 2 - 40, oy = H / 2 + 60, s = 26;
      const X = (x) => ox + x * s, Y = (y) => oy - y * s;
      let t = 0;
      (function loop() {
        t += 0.01; if (t > 2) t = 0;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = cssVar("--line"); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke();
        const ax = P.ax, ay = P.ay, bx = P.bx, by = P.by, rx = ax + bx, ry = ay + by;
        ctx.globalAlpha = 0.5;
        arrow(ctx, X(0), Y(0), X(ax), Y(ay), cssVar("--accent"), 3);
        arrow(ctx, X(ax), Y(ay), X(rx), Y(ry), cssVar("--accent-2"), 3);
        ctx.globalAlpha = 1;
        arrow(ctx, X(0), Y(0), X(rx), Y(ry), cssVar("--warn"), 4);
        let wx, wy;
        if (t < 1) { wx = lerp(0, ax, t); wy = lerp(0, ay, t); } else { wx = lerp(ax, rx, t - 1); wy = lerp(ay, ry, t - 1); }
        ctx.fillStyle = cssVar("--text"); ctx.beginPath(); ctx.arc(X(wx), Y(wy), 6, 0, TAU); ctx.fill();
        setRO(ro, `a⃗(${ax}, ${ay}) + b⃗(${bx}, ${by}) = R⃗(<b>${rx}</b>, <b>${ry}</b>) · |R⃗| = <b>${Math.hypot(rx, ry).toFixed(2)}</b>`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Probability: two-dice sums converge on the theoretical spread ---- */
    m_probability(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Roll two dice again and again: the tally of each total settles toward its true probability — 7 is the most likely.";
      const counts = new Array(13).fill(0); let total = 0; let d1 = 1, d2 = 1;
      const theo = [0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
      (function loop() {
        const rolls = clamp(Math.round(P.rate), 1, 40);
        for (let i = 0; i < rolls; i++) { d1 = 1 + Math.floor(Math.random() * 6); d2 = 1 + Math.floor(Math.random() * 6); counts[d1 + d2]++; total++; }
        if (total > 100000) { for (let i = 0; i < 13; i++) counts[i] = Math.floor(counts[i] / 2); total = Math.floor(total / 2); }
        ctx.clearRect(0, 0, W, H);
        const x0 = 60, baseY = H - 70, bw = (W - 120) / 11, maxC = Math.max(1, ...counts);
        for (let sum = 2; sum <= 12; sum++) {
          const x = x0 + (sum - 2) * bw;
          const h = (counts[sum] / maxC) * (H - 160);
          ctx.fillStyle = sum === 7 ? cssVar("--warn") : cssVar("--accent");
          ctx.fillRect(x + 4, baseY - h, bw - 8, h);
          const th = (theo[sum] / 6) * (H - 160) * (maxC ? (total / 36) / maxC : 1);
          ctx.strokeStyle = cssVar("--accent-2"); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x + 4, baseY - th); ctx.lineTo(x + bw - 4, baseY - th); ctx.stroke();
          ctx.fillStyle = cssVar("--muted"); ctx.font = "600 11px Inter"; ctx.textAlign = "center";
          ctx.fillText(sum, x + bw / 2, baseY + 16);
        }
        const die = (dx, v) => { ctx.fillStyle = cssVar("--card-2"); roundRect(ctx, dx, 30, 34, 34, 6); ctx.fill(); ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 1.5; roundRect(ctx, dx, 30, 34, 34, 6); ctx.stroke(); ctx.fillStyle = cssVar("--text"); ctx.font = "700 18px Inter"; ctx.textAlign = "center"; ctx.fillText(v, dx + 17, 53); };
        die(W - 110, d1); die(W - 66, d2);
        setRO(ro, `<b>${total.toLocaleString()}</b> rolls · grey line = theoretical · totals of <b>7</b> dominate (6 of 36 ways)`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Normal distribution: a Galton board builds the bell curve ---- */
    m_normal(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Balls bounce randomly left or right past each peg, yet always pile into the same symmetric bell shape.";
      const rows = 9, topY = 60, pegGap = 30, cx = W / 2;
      const bins = new Array(rows + 1).fill(0);
      const balls = [];
      let spawn = 0, totalBalls = 0;
      const binY = topY + rows * pegGap + 30;
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = cssVar("--muted");
        for (let r = 0; r < rows; r++) for (let c = 0; c <= r; c++) { const x = cx + (c - r / 2) * pegGap, y = topY + r * pegGap; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill(); }
        if (++spawn >= Math.max(4, 14 - Math.round(P.rate))) { spawn = 0; balls.push({ r: 0, c: 0, x: cx, y: topY - 14 }); }
        ctx.fillStyle = cssVar("--warn");
        for (let i = balls.length - 1; i >= 0; i--) {
          const b = balls[i];
          b.y += 4;
          const targetY = topY + b.r * pegGap;
          if (b.y >= targetY && b.r < rows) { const dir = Math.random() < 0.5 ? -0.5 : 0.5; b.c += dir; b.x = cx + b.c * pegGap; b.r++; }
          if (b.y >= binY) { const bin = clamp(Math.round(b.c + rows / 2), 0, rows); bins[bin]++; totalBalls++; balls.splice(i, 1); continue; }
          ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, TAU); ctx.fill();
        }
        const maxB = Math.max(1, ...bins), bw = pegGap;
        for (let i = 0; i <= rows; i++) {
          const x = cx + (i - rows / 2) * pegGap - bw / 2, h = (bins[i] / maxB) * (H - binY - 30);
          ctx.fillStyle = cssVar("--accent"); ctx.fillRect(x + 2, H - 30 - h, bw - 4, h);
        }
        setRO(ro, `<b>${totalBalls}</b> balls dropped → piling into a <b>bell curve</b> (68% land within one σ of the centre)`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Exponential growth: multiplying beats adding, fast ---- */
    m_exponential(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Linear growth adds the same amount each step; exponential growth multiplies — and quickly leaves the line far behind.";
      const x0 = 60, base = H - 50, top = 50, xR = W - 50;
      let t = 0;
      (function loop() {
        t += 0.008; if (t > 1.05) t = 0;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = cssVar("--muted"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(xR, base); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x0, top); ctx.stroke();
        const b = P.rate, steps = 8, maxY = Math.pow(b, steps);
        const X = (x) => lerp(x0, xR, x / steps), Y = (y) => base - (y / maxY) * (base - top);
        // linear reference
        ctx.strokeStyle = cssVar("--line"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(X(0), Y(1)); ctx.lineTo(X(steps), Y(1 + (b - 1) * steps * 0.5)); ctx.stroke();
        ctx.strokeStyle = cssVar("--accent"); ctx.lineWidth = 3; ctx.beginPath();
        const xmax = t * steps;
        for (let x = 0; x <= xmax; x += 0.05) { const yy = Math.pow(b, x); x === 0 ? ctx.moveTo(X(x), Y(yy)) : ctx.lineTo(X(x), Y(yy)); }
        ctx.stroke();
        const cur = Math.pow(b, xmax);
        ctx.fillStyle = cssVar("--warn"); ctx.beginPath(); ctx.arc(X(xmax), Y(cur), 7, 0, TAU); ctx.fill();
        ctx.fillStyle = cssVar("--muted"); ctx.font = "600 12px Inter"; ctx.textAlign = "left";
        ctx.fillText("exponential bˣ", x0 + 8, top + 16);
        setRO(ro, `growth ×<b>${b.toFixed(2)}</b> per step · after ${steps} steps → <b>${maxY.toFixed(1)}×</b> (a straight line would barely move)`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Fibonacci: squares & the golden spiral; ratio → φ ---- */
    m_fibonacci(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "Each Fibonacci square's side is the sum of the previous two. Quarter-circles through them trace the golden spiral.";
      const f = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];
      let prog = 0;
      (function loop() {
        prog += 0.01; if (prog > 1.3) prog = 0;
        ctx.clearRect(0, 0, W, H);
        const n = clamp(Math.round(P.n), 2, 10);
        let bb = { x: 0, y: 0, w: f[0], h: f[0] };
        const squares = [{ x: 0, y: 0, s: f[0] }];
        for (let i = 1; i < n; i++) {
          const s = f[i], d = i % 4; let sq;
          if (d === 0) { sq = { x: bb.x + bb.w, y: bb.y, s }; bb.w += s; }
          else if (d === 1) { sq = { x: bb.x, y: bb.y - s, s }; bb.y -= s; bb.h += s; }
          else if (d === 2) { sq = { x: bb.x - s, y: bb.y, s }; bb.x -= s; bb.w += s; }
          else { sq = { x: bb.x, y: bb.y + bb.h, s }; bb.h += s; }
          squares.push(sq);
        }
        const pad = 40, sc = Math.min((W - 2 * pad) / bb.w, (H - 2 * pad) / bb.h);
        const ox = pad - bb.x * sc + (W - 2 * pad - bb.w * sc) / 2, oy = pad - bb.y * sc + (H - 2 * pad - bb.h * sc) / 2;
        const TX = (x) => ox + x * sc, TY = (y) => oy + y * sc;
        const bcx = TX(bb.x + bb.w / 2), bcy = TY(bb.y + bb.h / 2);
        const shown = Math.min(n, Math.floor(prog * n) + 1);
        squares.forEach((sq, i) => {
          if (i >= shown) return;
          ctx.strokeStyle = cssVar("--line"); ctx.lineWidth = 1.5;
          ctx.strokeRect(TX(sq.x), TY(sq.y), sq.s * sc, sq.s * sc);
          ctx.fillStyle = i === shown - 1 ? cssVar("--accent") : cssVar("--muted");
          ctx.font = "600 12px Inter"; ctx.textAlign = "center";
          ctx.fillText(f[i], TX(sq.x + sq.s / 2), TY(sq.y + sq.s / 2) + 4);
          // quarter arc through the square, centred at the corner nearest the bbox centre
          const corners = [{ x: sq.x, y: sq.y }, { x: sq.x + sq.s, y: sq.y }, { x: sq.x + sq.s, y: sq.y + sq.s }, { x: sq.x, y: sq.y + sq.s }];
          let ci = 0, cd = 1e9;
          corners.forEach((c, k) => { const d = Math.hypot(TX(c.x) - bcx, TY(c.y) - bcy); if (d < cd) { cd = d; ci = k; } });
          const cen = corners[ci], far = corners[(ci + 2) % 4], adj = corners[(ci + 1) % 4];
          const cenX = TX(cen.x), cenY = TY(cen.y), R = sq.s * sc;
          const aA = Math.atan2(TY(adj.y) - cenY, TX(adj.x) - cenX);
          const aF = Math.atan2(TY(far.y) - cenY, TX(far.x) - cenX);
          const opp = aF + Math.PI;
          let best = Math.PI / 2, bestd = 1e9;
          [-Math.PI / 2, Math.PI / 2].forEach((dd) => { const mid = aA + dd / 2; const diff = Math.abs(Math.atan2(Math.sin(mid - opp), Math.cos(mid - opp))); if (diff < bestd) { bestd = diff; best = dd; } });
          ctx.strokeStyle = cssVar("--warn"); ctx.lineWidth = 2.5; ctx.beginPath();
          for (let u = 0; u <= 1; u += 0.04) { const ang = aA + best * u; const px = cenX + Math.cos(ang) * R, py = cenY + Math.sin(ang) * R; u === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
          ctx.stroke();
        });
        const ratio = f[Math.min(shown, n) - 1] / f[Math.max(0, Math.min(shown, n) - 2)];
        setRO(ro, `sequence: <b>${f.slice(0, n).join(", ")}</b> · ratio of last two ≈ <b>${ratio.toFixed(4)}</b> → φ = 1.61803…`);
        requestAnimationFrame(loop);
      })();
    },

    /* ---- Matrix transformations: a 2×2 matrix warps the grid ---- */
    m_matrix(cv, cap, P, ro) {
      const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
      cap.textContent = "A 2×2 matrix sends every point to a new one — stretching, rotating or shearing the whole grid. Its determinant scales area.";
      const ox = W / 2, oy = H / 2, s = 34;
      let t = 0;
      (function loop() {
        t += 0.012;
        ctx.clearRect(0, 0, W, H);
        const alpha = Math.abs(Math.sin(t));
        const a = lerp(1, P.a, alpha), b = lerp(0, P.b, alpha), c = lerp(0, P.c, alpha), d = lerp(1, P.d, alpha);
        const TX = (x, y) => ox + (a * x + b * y) * s, TY = (x, y) => oy - (c * x + d * y) * s;
        ctx.lineWidth = 1;
        for (let g = -6; g <= 6; g++) {
          ctx.strokeStyle = g === 0 ? cssVar("--muted") : cssVar("--line");
          ctx.beginPath(); ctx.moveTo(TX(g, -6), TY(g, -6)); ctx.lineTo(TX(g, 6), TY(g, 6)); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(TX(-6, g), TY(-6, g)); ctx.lineTo(TX(6, g), TY(6, g)); ctx.stroke();
        }
        ctx.fillStyle = "rgba(255,180,84,0.22)";
        ctx.beginPath(); ctx.moveTo(TX(0, 0), TY(0, 0)); ctx.lineTo(TX(1, 0), TY(1, 0)); ctx.lineTo(TX(1, 1), TY(1, 1)); ctx.lineTo(TX(0, 1), TY(0, 1)); ctx.closePath(); ctx.fill();
        arrow(ctx, TX(0, 0), TY(0, 0), TX(1, 0), TY(1, 0), cssVar("--accent"), 3);
        arrow(ctx, TX(0, 0), TY(0, 0), TX(0, 1), TY(0, 1), cssVar("--accent-2"), 3);
        const det = P.a * P.d - P.b * P.c;
        setRO(ro, `[${P.a.toFixed(1)} ${P.b.toFixed(1)}; ${P.c.toFixed(1)} ${P.d.toFixed(1)}] · determinant = ad − bc = <b>${det.toFixed(2)}</b> (area ×${Math.abs(det).toFixed(2)}${det < 0 ? ", flipped" : ""})`);
        requestAnimationFrame(loop);
      })();
    },
  };

export const EXTRA_ANIM = EXTRA;
