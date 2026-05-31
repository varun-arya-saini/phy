"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A range slider paired with a type-able number box. Typing a value outside
 * the slider's range auto-expands the range, so values are never capped to
 * presets. The numeric value is owned by the parent (controlled).
 *
 * Props: label, value (number), min, max, step, unit, onChange(number).
 */
export default function EditableRange({
  label,
  value,
  min,
  max,
  step = "any",
  unit = "",
  onChange,
}) {
  const [range, setRange] = useState({ min, max });
  const [text, setText] = useState(String(value));
  const editing = useRef(false);

  // Keep the number box in sync when the value changes from elsewhere
  // (e.g. dragging the slider), unless the user is mid-edit in the box.
  useEffect(() => {
    if (!editing.current) setText(String(value));
  }, [value]);

  const commit = (raw) => {
    const v = parseFloat(raw);
    if (isNaN(v)) return;
    let lo = range.min;
    let hi = range.max;
    if (v > hi) hi = v;
    if (v < lo) lo = v;
    if (lo !== range.min || hi !== range.max) setRange({ min: lo, max: hi });
    onChange(v);
  };

  return (
    <label>
      {label}
      <span className="ctl-row">
        <input
          type="range"
          min={range.min}
          max={range.max}
          step={step}
          value={value}
          onChange={(e) => {
            setText(e.target.value);
            onChange(parseFloat(e.target.value));
          }}
        />
        <input
          type="number"
          className="num-input"
          step={step}
          value={text}
          onChange={(e) => {
            editing.current = true;
            setText(e.target.value);
            commit(e.target.value);
          }}
          onBlur={() => {
            editing.current = false;
            setText(String(value));
          }}
        />
        {unit ? <span className="ctl-unit">{unit}</span> : null}
      </span>
    </label>
  );
}
