"use client";

import { useEffect, useRef, useState } from "react";
import EditableRange from "../EditableRange";
import { cssVar } from "./_utils";

export default function Projectile() {
  const canvasRef = useRef(null);
  const readoutRef = useRef(null);
  const api = useRef({});
  const flying = useRef(false);
  const rafRef = useRef(null);

  const [vel, setVel] = useState(25);
  const [ang, setAng] = useState(45);
  const [grav, setGrav] = useState(9.8);
  const p = useRef({ vel, ang, grav });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const ground = H - 30;

    let t = 0;
    let v0, theta, g, scale;
    let trail = [];

    function computeStats() {
      const v = +p.current.vel;
      const a = (+p.current.ang * Math.PI) / 180;
      const gg = +p.current.grav;
      const range = (v * v * Math.sin(2 * a)) / gg;
      const height = (v * v * Math.sin(a) ** 2) / (2 * gg);
      const flight = (2 * v * Math.sin(a)) / gg;
      return { range, height, flight };
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
      const a = (+p.current.ang * Math.PI) / 180;
      const len = 55;
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
      const px = 24 + x * scale;
      const py = ground - y * scale;
      trail.push([px, py]);

      ctx.strokeStyle = cssVar("--accent");
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      trail.forEach(([tx, ty], i) => (i ? ctx.lineTo(tx, ty) : ctx.moveTo(tx, ty)));
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = cssVar("--warn");
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fill();

      t += 0.05;
      if (y < 0 && t > 0.1) {
        flying.current = false;
        drawStatic();
        redrawTrail();
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    }

    function launch() {
      if (flying.current) cancelAnimationFrame(rafRef.current);
      const s = computeStats();
      v0 = +p.current.vel;
      theta = (+p.current.ang * Math.PI) / 180;
      g = +p.current.grav;
      const maxX = Math.max(s.range, 1);
      const maxY = Math.max(s.height, 1);
      scale = Math.min((W - 50) / maxX, (ground - 30) / maxY);
      t = 0;
      trail = [];
      flying.current = true;
      step();
    }

    function refresh() {
      const s = computeStats();
      if (readoutRef.current) {
        readoutRef.current.textContent = `Range: ${s.range.toFixed(
          1
        )} m · Max height: ${s.height.toFixed(1)} m · Flight time: ${s.flight.toFixed(
          2
        )} s`;
      }
      if (!flying.current) drawStatic();
    }

    api.current = { launch, refresh };
    refresh();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Redraw the static preview + readout whenever a control changes.
  useEffect(() => {
    p.current = { vel, ang, grav };
    api.current.refresh?.();
  }, [vel, ang, grav]);

  return (
    <section id="projectile" className="experiment">
      <div className="exp-info">
        <span className="tag">Mechanics · Kinematics</span>
        <h2>Projectile Motion</h2>
        <p className="statement">
          An object launched into the air follows a parabolic path under
          constant gravity. Horizontal velocity stays constant; vertical
          velocity changes by <code>g</code> each second.
        </p>
        <div className="formula">
          Range&nbsp;<code>R = (v² · sin 2θ) / g</code>
          <br />
          Max height&nbsp;<code>H = (v² · sin²θ) / 2g</code>
        </div>
        <div className="controls">
          <EditableRange label="Launch speed" value={vel} min={5} max={60} step="1" unit="m/s" onChange={setVel} />
          <EditableRange label="Angle" value={ang} min={5} max={85} step="1" unit="°" onChange={setAng} />
          <EditableRange label="Gravity" value={grav} min={1.6} max={24.8} step={0.1} unit="m/s²" onChange={setGrav} />
          <button className="btn btn-primary" onClick={() => api.current.launch?.()}>
            Launch ▶
          </button>
        </div>
        <div className="readout" ref={readoutRef}>
          Range: — · Max height: — · Flight time: —
        </div>
      </div>
      <canvas className="exp-canvas" ref={canvasRef} width={560} height={380} />
    </section>
  );
}
