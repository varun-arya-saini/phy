"use client";

import { useEffect, useRef, useState } from "react";
import EditableRange from "../EditableRange";
import { cssVar, roundRect } from "./_utils";

export default function Newton() {
  const canvasRef = useRef(null);
  const readoutRef = useRef(null);
  const rafRef = useRef(null);
  const api = useRef({});
  const pushing = useRef(false);

  const [force, setForce] = useState(40);
  const [mass, setMass] = useState(4);
  const p = useRef({ force, mass });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const trackY = H / 2 + 40;

    let x = 60;
    let v = 0;
    let a = 0;
    let last = null;

    function updateReadout() {
      if (readoutRef.current) {
        readoutRef.current.textContent = `Acceleration: ${a.toFixed(
          2
        )} m/s² · Velocity: ${v.toFixed(2)} m/s`;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = cssVar("--muted");
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, trackY + 26);
      ctx.lineTo(W - 30, trackY + 26);
      ctx.stroke();

      const m = +p.current.mass;
      const cw = 44 + m * 4;
      const ch = 26 + m * 1.5;
      const cx = x;
      const cy = trackY + 26 - ch;

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

      const f = +p.current.force;
      if (f > 0) {
        const alen = 20 + f * 0.9;
        ctx.strokeStyle = cssVar("--warn");
        ctx.fillStyle = cssVar("--warn");
        ctx.lineWidth = 4;
        const ay = cy + ch / 2;
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
      if (pushing.current) {
        a = +p.current.force / +p.current.mass;
        v += a * dt * 12;
        x += v * dt;
        if (x > W - 70) {
          x = W - 70;
          v = 0;
          pushing.current = false;
        }
        updateReadout();
      }
      draw();
      rafRef.current = requestAnimationFrame(frame);
    }

    function refresh() {
      a = +p.current.force / +p.current.mass;
      updateReadout();
      if (!pushing.current) draw();
    }

    function reset() {
      pushing.current = false;
      x = 60;
      v = 0;
      last = null;
      a = +p.current.force / +p.current.mass;
      updateReadout();
      draw();
    }

    function push() {
      pushing.current = true;
      last = null;
    }

    api.current = { refresh, reset, push };
    refresh();
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    p.current = { force, mass };
    api.current.refresh?.();
  }, [force, mass]);

  return (
    <section id="newton" className="experiment">
      <div className="exp-info">
        <span className="tag">Mechanics · Dynamics</span>
        <h2>Newton&apos;s Second Law</h2>
        <p className="statement">
          The acceleration of an object is directly proportional to the net
          force on it and inversely proportional to its mass. Push harder →
          faster acceleration; heavier object → slower.
        </p>
        <div className="formula">
          Force&nbsp;<code>F = m · a</code>
        </div>
        <div className="controls">
          <EditableRange label="Force" value={force} min={0} max={120} step="1" unit="N" onChange={setForce} />
          <EditableRange label="Mass" value={mass} min={1} max={20} step="1" unit="kg" onChange={setMass} />
          <button className="btn btn-primary" onClick={() => api.current.push?.()}>
            Apply force ▶
          </button>
          <button className="btn btn-ghost" onClick={() => api.current.reset?.()}>
            Reset
          </button>
        </div>
        <div className="readout" ref={readoutRef}>
          Acceleration: — · Velocity: —
        </div>
      </div>
      <canvas className="exp-canvas" ref={canvasRef} width={560} height={380} />
    </section>
  );
}
