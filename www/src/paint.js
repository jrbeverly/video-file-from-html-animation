export const W = 1920;
export const H = 1080;
export const TAU = Math.PI * 2;

// The show is authored on a musical grid: 128 BPM, 32 bars, 60 seconds.
export const SPB = 60 / 128;
export const BAR = SPB * 4;
export const LOOP = BAR * 32;

export const C = {
  void: [9, 3, 20],
  deep: [24, 7, 48],
  deep2: [45, 12, 86],
  brand: [153, 63, 245],
  brandLo: [96, 32, 168],
  glow: [181, 121, 255],
  lilac: [217, 194, 255],
  white: [254, 255, 254],
  ink: [1, 2, 2],
  pink: [232, 85, 195],
  cyan: [127, 227, 255],
  gold: [255, 198, 77],
  wolf: [254, 226, 4],
  fear: [58, 68, 214],
};

export const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
export const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
export const mix = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const inv = (a, b, v) => clamp((v - a) / (b - a));
export const smooth = (t) => t * t * (3 - 2 * t);
export const ramp = (a, b, v) => smooth(inv(a, b, v));
export const easeOut = (t) => 1 - (1 - t) ** 3;
export const easeIn = (t) => t * t * t;
export const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
export const backOut = (t, s = 1.9) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;
export const backIn = (t, s = 1.9) => (s + 1) * t ** 3 - s * t * t;
export const osc = (t, hz, ph = 0) => Math.sin((t * hz + ph) * TAU);

export const elastic = (t) =>
  t <= 0 ? 0 : t >= 1 ? 1 : 1 - 2 ** (-9 * t) * Math.cos(t * TAU * 1.35);

export function bounce(t) {
  const n = 7.5625;
  if (t < 0.3636) return n * t * t;
  if (t < 0.7273) return n * (t -= 0.5455) * t + 0.75;
  if (t < 0.9091) return n * (t -= 0.8182) * t + 0.9375;
  return n * (t -= 0.9545) * t + 0.984375;
}

export function hash(n) {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

export const rnd = (i, s = 0) => hash((i * 2654435761 + s * 40503) | 0);
export const rndr = (i, s, a, b) => a + rnd(i, s) * (b - a);

export function rr(ctx, x, y, w, h, r) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

const glowCache = new Map();

function glowTex(c) {
  const key = c.join();
  let tex = glowCache.get(key);
  if (tex) return tex;
  const S = 160;
  tex = document.createElement('canvas');
  tex.width = tex.height = S;
  const g = tex.getContext('2d');
  const rad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  rad.addColorStop(0, rgba(c, 1));
  rad.addColorStop(0.22, rgba(c, 0.55));
  rad.addColorStop(0.5, rgba(c, 0.16));
  rad.addColorStop(0.78, rgba(c, 0.03));
  rad.addColorStop(1, rgba(c, 0));
  g.fillStyle = rad;
  g.fillRect(0, 0, S, S);
  glowCache.set(key, tex);
  return tex;
}

export function glow(ctx, x, y, r, c, a = 1) {
  if (a <= 0.002 || r <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = clamp(a);
  ctx.drawImage(glowTex(c), x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

export function haze(ctx, y0, y1, c, a) {
  if (a <= 0.004) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, rgba(c, 0));
  g.addColorStop(1, rgba(c, a));
  ctx.fillStyle = g;
  ctx.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0));
  ctx.restore();
}

export function sparkle(ctx, x, y, r, c, a = 1, rot = 0) {
  if (a <= 0.01 || r <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = clamp(a);
  ctx.fillStyle = rgba(c, 1);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a0 = (i * TAU) / 4;
    const a1 = a0 + TAU / 8;
    const a2 = a0 + TAU / 4;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a0) * r, Math.sin(a0) * r);
    ctx.quadraticCurveTo(Math.cos(a1) * r * 0.16, Math.sin(a1) * r * 0.16, Math.cos(a2) * r, Math.sin(a2) * r);
  }
  ctx.fill();
  ctx.globalAlpha = clamp(a) * 0.9;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.16, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export const font = (weight, size) =>
  `${weight} ${size}px Outfit, "Segoe UI", system-ui, Arial, sans-serif`;

export function layout(ctx, str, size, weight, track) {
  ctx.font = font(weight, size);
  const tr = track * size;
  const chars = [];
  let x = 0;
  for (const ch of str) {
    const w = ctx.measureText(ch).width;
    chars.push({ ch, x, w });
    x += w + tr;
  }
  return { chars, w: Math.max(0, x - tr), size, weight };
}

export function caps(ctx, str, x, y, size, weight, track, color, a = 1, align = 'center') {
  const L = layout(ctx, str, size, weight, track);
  const left = align === 'center' ? x - L.w / 2 : align === 'right' ? x - L.w : x;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = rgba(color, 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = font(weight, size);
  for (const c of L.chars) ctx.fillText(c.ch, left + c.x, y);
  ctx.restore();
  return L.w;
}
