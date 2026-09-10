import { C, TAU, rgb, rgba, mix, clamp, rnd, rndr, glow, rr, sparkle } from './paint.js';

export const BODY = new Path2D(
  'm195.9 107.8c-2.84-27.64-18.85-62.98-60.73-64.4h-3.09c-29.9 0-52.18 21.88-56.84 52.31-2.68 9.26-2.46 20.79-4.86 35.12-2.48 14.9-7.38 20.23-10.77 28.96-1.88 5.11-1.19 17.58 10.84 18.65 6.63 0.59 14.92-2.78 15.03-3.96-2.25 4.59-5.08 12.84-4.78 19.82 0.6 11.64 8.71 17.78 21.25 17.78 14.07 0 24.1-8.4 30.32-12.14 3.01 7.78 6.93 12.14 14.41 12.14 13.02 0 27.47-13.13 33.84-23.58 11.19-19.55 18.26-42.4 16.17-71.32-0.08-2.87-0.35-6.08-0.79-9.38z'
);

const BX = 57.2;
const BY = 43.4;
const BW = 139.5;
export const BH = 168.7;
const CX = BX + BW / 2;
const CY = BY + BH / 2;
const EL = 135.5;
const ER = 164.4;
const EY = 104;
const ERX = 8.4;
const ERY = 13.6;

export function ghostFrame(ctx, x, y, h, o, fn) {
  ctx.save();
  ctx.translate(x, y);
  if (o.tilt) ctx.rotate(o.tilt);
  ctx.scale((o.flip ? -1 : 1) * (o.sx ?? 1), o.sy ?? 1);
  const s = h / BH;
  ctx.scale(s, s);
  ctx.translate(-CX, -CY);
  fn();
  ctx.restore();
}

const gradCache = new Map();

function bodyGrad(ctx, tint) {
  let m = gradCache.get(ctx);
  if (!m) {
    m = new Map();
    gradCache.set(ctx, m);
  }
  const key = tint.join();
  let g = m.get(key);
  if (!g) {
    g = ctx.createLinearGradient(0, BY, 0, BY + BH);
    g.addColorStop(0, rgb(tint));
    g.addColorStop(0.55, rgb(mix(tint, C.lilac, 0.16)));
    g.addColorStop(1, rgb(mix(tint, C.brand, 0.34)));
    m.set(key, g);
  }
  return g;
}

function eyeShape(ctx, px, py, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(px, py, rx, ry, 0, 0, TAU);
  ctx.fill();
}

export function ghost(ctx, x, y, h, o = {}) {
  const a = clamp(o.alpha ?? 1);
  if (a <= 0.004 || h <= 0) return;
  const tint = o.tint || C.white;
  const gl = o.glow ?? 0.45;
  if (gl > 0) glow(ctx, x, y - h * 0.04, h * 0.95, o.aura || C.glow, gl * a);

  ctx.save();
  ctx.globalAlpha = a;
  ghostFrame(ctx, x, y, h, o, () => {
    ctx.fillStyle = bodyGrad(ctx, tint);
    ctx.fill(BODY);

    if (!o.flat) {
      ctx.lineWidth = 3.4;
      ctx.strokeStyle = rgba(C.white, 0.5);
      ctx.stroke(BODY);
    }

    if (o.blush) {
      ctx.fillStyle = rgba(C.pink, 0.34 * o.blush);
      eyeShape(ctx, EL - 9, EY + 21, 11, 6.2);
      eyeShape(ctx, ER + 9, EY + 21, 11, 6.2);
    }

    if (o.noEyes) return;
    const bl = clamp(o.blink ?? 1);
    const lx = (o.look?.[0] ?? 0) * 19;
    const ly = (o.look?.[1] ?? 0) * 12;
    const wide = o.wide ?? 1;
    ctx.fillStyle = rgb(o.eye || C.ink);
    for (const px of [EL, ER]) {
      const cx = px + lx;
      const cy = EY + ly;
      if (o.happy) {
        ctx.strokeStyle = rgb(o.eye || C.ink);
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, cy + 5, ERX + 1.5, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else if (bl < 0.12) {
        ctx.strokeStyle = rgb(o.eye || C.ink);
        ctx.lineWidth = 4.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - ERX, cy);
        ctx.lineTo(cx + ERX, cy);
        ctx.stroke();
      } else {
        eyeShape(ctx, cx, cy, ERX * wide, ERY * bl * wide);
        if (h > 80 && bl > 0.5 && !o.flat) {
          ctx.fillStyle = rgba(C.white, 0.85);
          eyeShape(ctx, cx - ERX * 0.34, cy - ERY * 0.42 * bl, ERX * 0.28, ERY * 0.2);
          ctx.fillStyle = rgb(o.eye || C.ink);
        }
      }
    }

    if (o.mouth) {
      ctx.fillStyle = rgba(C.ink, 0.9);
      eyeShape(ctx, (EL + ER) / 2 + lx, EY + 30, 5.5 * o.mouth, 7.5 * o.mouth);
    }

    if (o.hands === 'shy') {
      const peek = o.peek ?? 0;
      const drop = peek * 24;
      for (const [px, s] of [[EL - 4, -1], [ER + 4, 1]]) {
        const hx = px + s * (2 + peek * 15);
        const hy = EY - 4 + drop;
        for (const pass of [0, 1]) {
          ctx.beginPath();
          ctx.ellipse(hx, hy + (pass ? 0 : 5), 21, 15, 0, 0, Math.PI);
          for (let k = -1; k <= 1; k++) {
            ctx.arc(hx + k * 12.6, hy + (pass ? 0 : 5) - 1, 7.4, Math.PI, 0, false);
          }
          ctx.closePath();
          if (pass === 0) {
            ctx.fillStyle = rgba(C.brandLo, 0.3);
            ctx.fill();
          } else {
            ctx.fillStyle = rgb(mix(tint, C.lilac, 0.34));
            ctx.fill();
            ctx.strokeStyle = rgba(C.brand, 0.45);
            ctx.lineWidth = 2.6;
            ctx.stroke();
          }
        }
      }
    } else if (o.hands) {
      const wv = (o.wave ?? 0) * 0.5;
      ctx.fillStyle = rgb(mix(tint, C.lilac, 0.1));
      ctx.beginPath();
      ctx.ellipse(BX + 8, CY + 12, 13, 11, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(BX + BW - 4 + wv * 14, CY - 4 - wv * 30, 13, 11, 0.4 * wv, 0, TAU);
      ctx.fill();
    }
  });
  ctx.restore();
}

let cloudPts = null;

export function ghostCloud() {
  if (cloudPts) return cloudPts;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const pts = [];
  const step = 8.8;
  const inEye = (px, py) =>
    [EL, ER].some((ex) => ((px - ex) / (ERX + 5)) ** 2 + ((py - EY) / (ERY + 4)) ** 2 < 1);
  for (let py = BY + step * 0.5; py < BY + BH; py += step) {
    for (let px = BX + step * 0.5; px < BX + BW; px += step) {
      if (g.isPointInPath(BODY, px, py) && !inEye(px, py)) {
        pts.push([(px - CX) / BH, (py - CY) / BH]);
      }
    }
  }
  cloudPts = pts;
  return pts;
}

export function tile(ctx, x, y, size, o = {}) {
  const a = clamp(o.alpha ?? 1);
  if (a <= 0.004) return;
  ctx.save();
  ctx.globalAlpha = a;
  if (o.tilt) {
    ctx.translate(x, y);
    ctx.rotate(o.tilt);
    ctx.translate(-x, -y);
  }
  glow(ctx, x, y, size * 1.15, C.brand, 0.55 * a * (o.glow ?? 1));
  const g = ctx.createLinearGradient(x - size / 2, y - size / 2, x + size / 2, y + size / 2);
  g.addColorStop(0, rgb(mix(C.brand, C.pink, 0.22)));
  g.addColorStop(1, rgb(mix(C.brand, C.brandLo, 0.55)));
  rr(ctx, x - size / 2, y - size / 2, size, size, size * 0.218);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = size * 0.014;
  ctx.strokeStyle = rgba(C.lilac, 0.4);
  ctx.stroke();
  ctx.restore();
  if (o.empty) return;
  ghost(ctx, x, y, size * 0.659, {
    alpha: a,
    glow: 0,
    blink: o.blink,
    look: o.look,
    happy: o.happy,
    ...(o.face || {}),
  });
}

export function pacGhost(ctx, x, y, h, o = {}) {
  const a = clamp(o.alpha ?? 1);
  if (a <= 0.004) return;
  const w = h * 0.86;
  const r = w / 2;
  const top = y - h / 2;
  const bot = y + h / 2;
  const scared = o.scared ?? 0;
  const base = o.tint || C.brand;
  const body = scared > 0 ? mix(mix(base, C.fear, clamp(scared * 2.2)), C.fear, scared) : base;
  const ph = o.phase ?? 0;

  ctx.save();
  ctx.globalAlpha = a;
  if (!o.eyesOnly) {
    glow(ctx, x, y, h * 0.85, body, 0.4 * a);
    const amp = h * 0.075;
    ctx.beginPath();
    ctx.moveTo(x - r, bot - amp);
    ctx.lineTo(x - r, top + r);
    ctx.arc(x, top + r, r, Math.PI, 0);
    ctx.lineTo(x + r, bot - amp);
    for (let i = 0; i <= 28; i++) {
      const t = i / 28;
      ctx.lineTo(x + r - t * w, bot - amp + Math.sin((t * 3 + ph) * TAU) * amp * 0.95);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, rgb(mix(body, C.white, 0.18)));
    g.addColorStop(1, rgb(body));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = h * 0.03;
    ctx.strokeStyle = rgba(mix(body, C.white, 0.45), 0.5);
    ctx.stroke();
  }

  const ey = top + h * (o.eyesOnly ? 0.42 : 0.38);
  const dx = (o.dir ?? 0) * w * 0.07;
  const dy = (o.dirY ?? 0) * w * 0.05;
  if (scared > 0.6 && !o.eyesOnly) {
    ctx.fillStyle = rgb(C.white);
    for (const s of [-1, 1]) {
      rr(ctx, x + s * w * 0.21 - w * 0.1, ey - w * 0.11, w * 0.2, w * 0.22, w * 0.05);
      ctx.fill();
    }
    ctx.strokeStyle = rgb(C.white);
    ctx.lineWidth = h * 0.045;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const px = x - w * 0.3 + (i / 6) * w * 0.6;
      const py = y + h * 0.19 + (i % 2 ? -1 : 1) * h * 0.05;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  } else {
    for (const s of [-1, 1]) {
      ctx.fillStyle = rgb(C.white);
      ctx.beginPath();
      ctx.ellipse(x + s * w * 0.21, ey, w * 0.17, w * 0.21, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgb(C.ink);
      ctx.beginPath();
      ctx.ellipse(x + s * w * 0.21 + dx, ey + dy, w * 0.085, w * 0.105, 0, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

const WOLF_RUFF = [
  [0.66, 0.986], [0.712, 0.983], [0.754, 0.979], [0.832, 0.965], [0.836, 1.059], [0.868, 1.031],
  [0.914, 0.968], [0.916, 1.075], [0.966, 1.038], [1.018, 0.973], [1.02, 1.078], [1.08, 1.037],
];

const WOLF_EARS = [
  [-0.83, 1.01], [-0.768, 1.255], [-0.718, 1.47], [-0.698, 1.277], [-0.666, 1.005],
  [-0.644, 1.207], [-0.61, 1.386], [-0.578, 1.1], [-0.552, 0.984], [-0.5, 0.988],
];

const WOLF_MARKS = [
  [[-0.438, -1.001], [-0.432, -1.139], [-0.366, -1.048], [-0.278, -0.957], [-0.416, -0.901]],
  [[-0.835, -0.785], [-0.846, -0.979], [-0.606, -0.777], [-0.731, -0.658], [-0.791, -0.581]],
  [[-0.076, -0.46], [-0.098, -0.531], [-0.093, -0.592], [0.211, -0.418], [0.139, -0.377],
    [0.04, -0.369], [-0.029, -0.399]],
];

export function pacman(ctx, x, y, r, face, chomp, o = {}) {
  const a = clamp(o.alpha ?? 1);
  if (a <= 0.004) return;
  const m = 0.03 + 0.155 * Math.abs(Math.sin(chomp * Math.PI));
  const col = o.tint || C.wolf;

  ctx.save();
  ctx.globalAlpha = a;
  glow(ctx, x, y, r * 2.2, col, 0.5 * a);
  ctx.translate(x, y);
  ctx.scale(face < 0 ? -1 : 1, 1);
  ctx.scale(r, r);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(m * Math.PI), Math.sin(m * Math.PI));
  ctx.arc(0, 0, 1, m * Math.PI, WOLF_RUFF[0][0] * Math.PI);
  for (const [t, rad] of WOLF_RUFF) ctx.lineTo(Math.cos(t * Math.PI) * rad, Math.sin(t * Math.PI) * rad);
  ctx.arc(0, 0, 1, 1.08 * Math.PI, (2 + WOLF_EARS[0][0]) * Math.PI);
  for (const [t, rad] of WOLF_EARS) ctx.lineTo(Math.cos(t * Math.PI) * rad, Math.sin(t * Math.PI) * rad);
  ctx.arc(0, 0, 1, 1.5 * Math.PI, (2 - m) * Math.PI);
  ctx.closePath();
  ctx.fillStyle = rgb(col);
  ctx.fill();

  ctx.fillStyle = rgb(col[0] + col[1] + col[2] > 380 ? C.ink : C.white);
  for (const mark of WOLF_MARKS) {
    ctx.beginPath();
    mark.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export function board(ctx, x, y, len, o = {}) {
  const flip = o.flip ?? 0;
  const sy = Math.cos(flip * TAU);
  const under = sy < 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(o.rot ?? 0);
  ctx.scale(1, Math.max(0.24, Math.abs(sy)) * (under ? -1 : 1));
  const t = len * 0.05;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const wheelY = len * 0.085;
  if (!under) {
    ctx.strokeStyle = rgb(C.lilac);
    ctx.lineWidth = t * 0.9;
    for (const wx of [-0.26, 0.26]) {
      ctx.beginPath();
      ctx.arc(wx * len, wheelY, len * 0.045, 0, TAU);
      ctx.stroke();
      ctx.save();
      ctx.setLineDash([len * 0.035, len * 0.035]);
      ctx.lineDashOffset = -(o.roll ?? 0) * len * 0.14;
      ctx.strokeStyle = rgb(C.brand);
      ctx.beginPath();
      ctx.arc(wx * len, wheelY, len * 0.045, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.beginPath();
  ctx.moveTo(-len * 0.5, -len * 0.072);
  ctx.bezierCurveTo(-len * 0.5, -len * 0.072, -len * 0.455, 0, -len * 0.32, 0);
  ctx.lineTo(len * 0.32, 0);
  ctx.bezierCurveTo(len * 0.455, 0, len * 0.5, -len * 0.072, len * 0.5, -len * 0.072);
  ctx.lineWidth = t;
  ctx.strokeStyle = under ? rgb(C.brand) : rgb([38, 16, 66]);
  ctx.stroke();
  ctx.lineWidth = t * 0.32;
  ctx.strokeStyle = under ? rgba(C.lilac, 0.75) : rgba(C.brand, 0.8);
  ctx.stroke();
  ctx.restore();
}

export function droid(ctx, x, y, r, dist) {
  const roll = dist / r;
  ctx.save();
  glow(ctx, x, y, r * 2.6, C.brand, 0.4);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(roll);
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
  g.addColorStop(0, rgb(C.white));
  g.addColorStop(1, rgb(mix(C.white, C.brand, 0.35)));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(C.brand, 0.9);
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(s * r * 0.42, s * r * 0.28, r * 0.24, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = rgba(C.brand, 0.55);
  ctx.lineWidth = r * 0.07;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, TAU);
  ctx.stroke();
  ctx.restore();
  ghost(ctx, x + r * 0.12, y - r * 1.05, r * 1.15, { glow: 0.25, look: [1, 0] });
  ctx.restore();
}

export function pellet(ctx, x, y, r, a = 1, big = false) {
  if (a <= 0.01) return;
  glow(ctx, x, y, r * (big ? 6 : 4), C.gold, 0.5 * a);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = rgb(mix(C.gold, C.white, 0.35));
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function puff(ctx, x, y, r, a, c = C.lilac) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = rgba(c, 0.5);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function burst(ctx, x, y, p, scale, c = C.lilac, n = 7, seed = 0, r0 = 0) {
  if (p <= 0 || p >= 1) return;
  const k = 1 - (1 - p) ** 2;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * TAU + seed;
    const d = r0 + k * (scale - r0);
    sparkle(ctx, x + Math.cos(ang) * d, y + Math.sin(ang) * d, scale * 0.085 * (1 - p), c, 1 - p, ang);
  }
}

export function speedLines(ctx, x, y, w, h, a, seed, dir = 1) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const yy = y - h / 2 + ((i + 0.5) / 7) * h + rndr(i, seed + 3, -9, 9);
    const len = w * (0.35 + rnd(i, seed) * 0.7);
    const off = rnd(i, seed + 1) * w * 0.3;
    const g = ctx.createLinearGradient(x - off * dir, yy, x - (off + len) * dir, yy);
    g.addColorStop(0, rgba(C.lilac, 0.65 * a));
    g.addColorStop(1, rgba(C.lilac, 0));
    ctx.strokeStyle = g;
    ctx.lineWidth = 3 + rnd(i, seed + 2) * 7;
    ctx.beginPath();
    ctx.moveTo(x - off * dir, yy);
    ctx.lineTo(x - (off + len) * dir, yy);
    ctx.stroke();
  }
  ctx.restore();
}

export function ghostPathAt(x, y, h, flip = false) {
  const s = h / BH;
  const m = new DOMMatrix();
  m.translateSelf(x, y);
  m.scaleSelf((flip ? -1 : 1) * s, s);
  m.translateSelf(-CX, -CY);
  const p = new Path2D();
  p.addPath(BODY, m);
  return p;
}
