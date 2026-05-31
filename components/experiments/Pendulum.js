"use client";

import { useEffect, useRef, useState } from "react";
import EditableRange from "../EditableRange";
import { cssVar } from "./_utils";

export default function Pendulum() {
  const canvasRef = useRef(null);
  const readoutRef = useRef(null);
  const rafRef = useRef(null);
  const api = useRef({});

  const [len, setLen] = useState(1.5);
  const [grav, setGrav] = useState(9.8);
  const [ang, setAng] = useState(30);
  const [running, setRunning] = useState(true);
  const p = useRef({ len, grav, ang });
  const runningRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const pivot = { x: W / 2, y: 40 };

    let L, g, theta0, theta;
    let omega = 0;
    let last = null;

    function reset() {
      L = +p.current.len;
      g = +p.current.grav;
      theta0 = (+p.current.ang * Math.PI) / 180;
      theta = theta0;
      omega = 0;
      last = null;
      const T = 2 * Math.PI * Math.sqrt(L / g);
      if (readoutRef.current) {
        readoutRef.current.textContent = `Period: ${T.toFixed(
          2
        )} s · Frequency: ${(1 / T).toFixed(2)} Hz`;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const pxLen = 70 + (L / 3) * 200;
      const bob = {
        x: pivot.x + Math.sin(theta) * pxLen,
        y: pivot.y + Math.cos(theta) * pxLen,
      };

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

      if (runningRef.current) {
        const alpha = -(g / L) * Math.sin(theta);
        omega += alpha * dt;
        omega *= 0.999;
        theta += omega * dt;
      }

      draw();
      rafRef.current = requestAnimationFrame(frame);
    }

    api.current = { reset };
    reset();
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    p.current = { len, grav, ang };
    api.current.reset?.();
  }, [len, grav, ang]);

  const toggle = () => {
    const next = !runningRef.current;
    runningRef.current = next;
    setRunning(next);
  };

  return (
    <section id="pendulum" className="experiment reverse">
      <div className="exp-info">
        <span className="tag">Oscillations · SHM</span>
        <h2>Simple Pendulum</h2>
        <p className="statement">
          For small swings, a pendulum&apos;s period depends only on its length
          and gravity — not on how heavy the bob is or how far you pull it.
        </p>
        <div className="formula">
          Period&nbsp;<code>T = 2π · √(L / g)</code>
        </div>
        <div className="controls">
          <EditableRange label="Length" value={len} min={0.5} max={3} step={0.1} unit="m" onChange={setLen} />
          <EditableRange label="Gravity" value={grav} min={1.6} max={24.8} step={0.1} unit="m/s²" onChange={setGrav} />
          <EditableRange label="Start angle" value={ang} min={5} max={60} step="1" unit="°" onChange={setAng} />
          <button className="btn btn-ghost" onClick={toggle}>
            {running ? "Pause ⏸" : "Play ▶"}
          </button>
        </div>
        <div className="readout" ref={readoutRef}>
          Period: — · Frequency: —
        </div>
      </div>
      <canvas className="exp-canvas" ref={canvasRef} width={560} height={380} />
    </section>
  );
}
