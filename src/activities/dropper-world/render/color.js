// Color helpers.
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
const shadeCache = new Map();
export function shade(hex, amt) {
  const k = hex + amt; if (shadeCache.has(k)) return shadeCache.get(k);
  const [r, g, b] = hexToRgb(hex); const f = amt < 0 ? 0 : 255, t = Math.abs(amt);
  const out = `rgb(${Math.round(r + (f - r) * t)},${Math.round(g + (f - g) * t)},${Math.round(b + (f - b) * t)})`;
  shadeCache.set(k, out); return out;
}
