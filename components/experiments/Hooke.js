"use client";

import { useEffect, useRef, useState } from "react";
import EditableRange from "../EditableRange";
import { cssVar } from "./_utils";

const G = 9.8;

export default function Hooke() {
  const canvasRef = useRef(null);
  const readoutRef = useRef(null);
  const rafRef = useRef(null);

  const [k, setK] = useState(20);
  const [mass, setMass] = useState(2);
  const p = useRef({ k, mass });
  const targetExt = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const topY = 40;
    const anchorX = W / 2;
    let ext = 0;

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

      const naturalLen = 110;
      const springLen = naturalLen + ext * 260;
      const coils = 10;
      const bobY = topY + springLen;

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

      const m = +p.current.mass;
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
      ctx.fillText(
        `x = ${(ext * 100).toFixed(1)} cm`,
        anchorX + 96,
        (topY + naturalLen + bobY) / 2
      );
      ctx.lineWidth = 1;
    }

    function frame() {
      ext += (targetExt.current - ext) * 0.12;
      draw();
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    p.current = { k, mass };
    const F = +mass * G;
    const x = F / +k;
    targetExt.current = x;
    if (readoutRef.current) {
      readoutRef.current.textContent = `Extension: ${(x * 100).toFixed(
        1
      )} cm · Restoring force: ${F.toFixed(1)} N`;
    }
  }, [k, mass]);

  return (
    <section id="hooke" className="experiment">
      <div className="exp-info">
        <span className="tag">Elasticity</span>
        <h2>Hooke&apos;s Law</h2>
        <p className="statement">
          The extension of a spring is directly proportional to the force
          stretching it, as long as the elastic limit isn&apos;t exceeded.
        </p>
        <div className="formula">
          Force&nbsp;<code>F = k · x</code>
        </div>
        <div className="controls">
          <EditableRange label="Spring constant k" value={k} min={5} max={80} step="1" unit="N/m" onChange={setK} />
          <EditableRange label="Hanging mass" value={mass} min={0} max={10} step={0.5} unit="kg" onChange={setMass} />
        </div>
        <div className="readout" ref={readoutRef}>
          Extension: — · Restoring force: —
        </div>
      </div>
      <canvas className="exp-canvas" ref={canvasRef} width={560} height={380} />
    </section>
  );
}
