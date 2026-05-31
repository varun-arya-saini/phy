/* Canvas helpers shared by the home-page experiments. They read live CSS
   theme tokens off the document at draw time, so colours follow the theme. */

export const cssVar = (name) =>
  getComputedStyle(document.body).getPropertyValue(name).trim();

export function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/**
 * A range slider paired with a type-able number box. Typing a value outside
 * the slider's range auto-expands it, so values are never capped to presets.
 * Builds the markup the original React <EditableRange> produced.
 *
 * @param {object} cfg  { label, value, min, max, step, unit }
 * @param {(n:number)=>void} onChange  called with the new numeric value
 * @returns {HTMLLabelElement}
 */
export function editableRange(cfg, onChange) {
  const { label, value, min, max, step = "any", unit = "" } = cfg;
  const range = { min, max };
  let current = value;

  const wrap = document.createElement("label");
  wrap.append(document.createTextNode(label));

  const row = document.createElement("span");
  row.className = "ctl-row";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = String(range.min);
  slider.max = String(range.max);
  slider.step = String(step);
  slider.value = String(value);

  const num = document.createElement("input");
  num.type = "number";
  num.className = "num-input";
  num.step = String(step);
  num.value = String(value);

  let editing = false;

  const sync = () => {
    slider.value = String(current);
    if (!editing) num.value = String(current);
  };

  slider.addEventListener("input", () => {
    current = parseFloat(slider.value);
    num.value = slider.value;
    onChange(current);
  });

  num.addEventListener("input", () => {
    editing = true;
    const v = parseFloat(num.value);
    if (isNaN(v)) return;
    if (v > range.max) {
      range.max = v;
      slider.max = String(v);
    }
    if (v < range.min) {
      range.min = v;
      slider.min = String(v);
    }
    current = v;
    slider.value = String(v);
    onChange(v);
  });

  num.addEventListener("blur", () => {
    editing = false;
    num.value = String(current);
  });

  row.append(slider, num);
  if (unit) {
    const u = document.createElement("span");
    u.className = "ctl-unit";
    u.textContent = unit;
    row.append(u);
  }
  wrap.append(row);

  // Let callers push a new value in (mirrors the controlled React prop).
  wrap.setValue = (v) => {
    current = v;
    sync();
  };
  return wrap;
}
