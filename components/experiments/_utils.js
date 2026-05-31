/* Canvas helpers shared by the home-page experiments. Client-only: they
   read live CSS theme tokens off the document at draw time. */

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
