"use client";

import { useEffect, useRef, useState } from "react";
import EditableRange from "../EditableRange";
import { cssVar } from "./_utils";

export default function Ohm() {
  const canvasRef = useRef(null);
  const readoutRef = useRef(null);
  const rafRef = useRef(null);

  const [volt, setVolt] = useState(12);
  const [res, setRes] = useState(6);
  const p = useRef({ volt, res });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    let phase = 0;

    function stats() {
      const V = +p.current.volt;
      const R = +p.current.res;
      const I = V / R;
      const P = V * I;
      return { V, R, I, P };
    }

    function perimeterPoints(L, T, R, B, n) {
      const pts = [];
      const top = [];
      for (let i = 0; i <= n; i++) top.push({ x: L + ((R - L) * i) / n, y: T });
      const right = [];
      for (let i = 0; i <= n; i++) right.push({ x: R, y: T + ((B - T) * i) / n });
      const bot = [];
      for (let i = 0; i <= n; i++) bot.push({ x: R - ((R - L) * i) / n, y: B });
      const left = [];
      for (let i = 0; i <= n; i++) left.push({ x: L, y: B - ((B - T) * i) / n });
      return pts.concat(top, right, bot, left);
    }

    function frame() {
      const s = stats();
      ctx.clearRect(0, 0, W, H);

      const L = 90;
      const R = W - 90;
      const T = 90;
      const B = H - 70;
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
      const rx = (L + R) / 2 - 40;
      const ry = T;
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

      const bx = R;
      const by = my;
      const brightness = Math.min(s.P / 60, 1);
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
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    p.current = { volt, res };
    const I = +volt / +res;
    const P = +volt * I;
    if (readoutRef.current) {
      readoutRef.current.textContent = `Current: ${I.toFixed(
        2
      )} A · Power: ${P.toFixed(1)} W`;
    }
  }, [volt, res]);

  return (
    <section id="ohm" className="experiment reverse">
      <div className="exp-info">
        <span className="tag">Electricity</span>
        <h2>Ohm&apos;s Law</h2>
        <p className="statement">
          The current through a conductor is directly proportional to the
          voltage across it, provided temperature stays constant. More voltage →
          more current; more resistance → less current.
        </p>
        <div className="formula">
          Voltage&nbsp;<code>V = I · R</code>
        </div>
        <div className="controls">
          <EditableRange label="Voltage" value={volt} min={0} max={24} step={0.5} unit="V" onChange={setVolt} />
          <EditableRange label="Resistance" value={res} min={1} max={24} step="1" unit="Ω" onChange={setRes} />
        </div>
        <div className="readout" ref={readoutRef}>
          Current: — · Power: —
        </div>
      </div>
      <canvas className="exp-canvas" ref={canvasRef} width={560} height={380} />
    </section>
  );
}
