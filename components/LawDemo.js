"use client";

import { useEffect, useRef, useState } from "react";
import EditableRange from "./EditableRange";
import { PHYS_ANIM } from "@/lib/animations";

/**
 * The "Try it yourself" block on a lesson page: an animated canvas driven by
 * a set of sliders. The animation engine reads parameters live from a single
 * stable object, so the sliders mutate that object in place.
 */
export default function LawDemo({ controls = [], anim }) {
  const canvasRef = useRef(null);
  const captionRef = useRef(null);
  const readoutRef = useRef(null);

  // One stable parameter object the engine closes over (mutated in place).
  const P = useRef(null);
  if (P.current === null) {
    const o = {};
    controls.forEach((c) => (o[c.id] = c.value));
    P.current = o;
  }

  const [vals, setVals] = useState(() => {
    const o = {};
    controls.forEach((c) => (o[c.id] = c.value));
    return o;
  });

  useEffect(() => {
    const runner = PHYS_ANIM[anim];
    if (runner) {
      runner(canvasRef.current, captionRef.current, P.current, readoutRef.current);
    }
    // The engine drives its own requestAnimationFrame loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anim]);

  const onChange = (id, v) => {
    P.current[id] = v;
    setVals((s) => ({ ...s, [id]: v }));
  };

  return (
    <section className="demo-block">
      <div className="demo-head">
        <h2>Try it yourself</h2>
        <span className="demo-hint">Drag the sliders ↓</span>
      </div>
      <canvas className="demo-canvas" ref={canvasRef} width={720} height={420} />
      <div className="demo-controls">
        {controls.map((c) => (
          <EditableRange
            key={c.id}
            label={c.label}
            value={vals[c.id]}
            min={c.min}
            max={c.max}
            step={c.step}
            unit={c.unit || ""}
            onChange={(v) => onChange(c.id, v)}
          />
        ))}
      </div>
      <div className="demo-readout" ref={readoutRef} />
      <div className="demo-caption" ref={captionRef} />
    </section>
  );
}
