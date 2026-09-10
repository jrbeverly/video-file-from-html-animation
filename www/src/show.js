import {
  W, H, C, TAU, rgba, clamp, inv, ramp, easeOut, easeInOut, backOut, osc, rnd, glow, sparkle,
  BAR, LOOP,
} from './paint.js';
import { ghostPathAt, pellet } from './cast.js';
import { backdrop, hud, vignette, flash } from './stage.js';
import { SCENES } from './scenes.js';

const TRANS = BAR * 0.5;
const N = SCENES.length;
const START = [];
let acc = 0;
for (const sc of SCENES) {
  START.push(acc);
  acc += sc.bars * BAR;
}

// The Kiro body path winds anticlockwise. Boxes and arcs unioned with it have to
// match, or the nonzero fill rule cancels the overlap into a hole.
function box(path, x, y, w, h) {
  path.moveTo(x, y);
  path.lineTo(x, y + h);
  path.lineTo(x + w, y + h);
  path.lineTo(x + w, y);
  path.closePath();
}

const SHY_H = 560;

function lens(path, cx, cy, rx, ry) {
  path.moveTo(cx - rx, cy);
  path.quadraticCurveTo(cx, cy - ry * 2.1, cx + rx, cy);
  path.quadraticCurveTo(cx, cy + ry * 2.1, cx - rx, cy);
}

function eachEye(p, fn) {
  const cols = 4;
  const rows = 3;
  const cw = W / cols;
  const chh = H / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const q = clamp((p - rnd(i, 101) * 0.4) / 0.6);
      if (q <= 0) continue;
      fn(cw * (c + 0.5), chh * (r + 0.5), easeOut(clamp(q * 1.7)) * cw * 0.78, easeOut(q) * chh * 0.42, q, cw, chh);
    }
  }
}

const HARD = SCENES.map((sc) => sc.key !== 'title');
const SLIDES = new Set(SCENES.map((sc) => sc.slide)).size;

const TRANSITIONS = {
  skate: {
    clip(ctx, p) {
      const e = easeInOut(p);
      const x = -420 + e * (W + 900);
      ctx.beginPath();
      ctx.moveTo(-20, -20);
      ctx.lineTo(x + 260, -20);
      ctx.quadraticCurveTo(x - 120, H / 2, x + 260, H + 20);
      ctx.lineTo(-20, H + 20);
      ctx.closePath();
      ctx.clip();
    },
    over(ctx, p) {
      const e = easeInOut(p);
      const x = -420 + e * (W + 900);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.sin(p * Math.PI);
      ctx.strokeStyle = rgba(C.lilac, 0.9);
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(x + 260, -20);
      ctx.quadraticCurveTo(x - 120, H / 2, x + 260, H + 20);
      ctx.stroke();
      for (let i = 0; i < 16; i++) {
        const y = (i / 15) * H;
        const len = 180 + rnd(i, 91) * 420;
        ctx.lineWidth = 2 + rnd(i, 92) * 5;
        ctx.strokeStyle = rgba(i % 3 ? C.white : C.pink, 0.5);
        ctx.beginPath();
        ctx.moveTo(x - 260 - rnd(i, 93) * 200, y);
        ctx.lineTo(x - 260 - rnd(i, 93) * 200 - len, y);
        ctx.stroke();
      }
      ctx.restore();
    },
  },
  shy: {
    clip(ctx, p) {
      const path = new Path2D();
      const cw = W / 6;
      const chh = H / 3;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 6; c++) {
          const q = clamp((p - ((c / 6 + r / 3) / 2) * 0.5) / 0.5);
          if (q <= 0) continue;
          const cx = c * cw + cw / 2;
          const cy = r * chh + chh / 2;
          path.addPath(ghostPathAt(cx, cy, backOut(q, 1.3) * SHY_H));
          if (q > 0.55) {
            const k = inv(0.55, 1, q);
            box(path, cx - (cw * k) / 2 - 1, cy - (chh * k) / 2 - 1, cw * k + 2, chh * k + 2);
          }
        }
      }
      ctx.clip(path);
    },
    over(ctx, p) {
      const cw = W / 6;
      const chh = H / 3;
      ctx.save();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 6; c++) {
          const q = clamp((p - ((c / 6 + r / 3) / 2) * 0.5) / 0.5);
          if (q <= 0 || q > 0.6) continue;
          const cx = c * cw + cw / 2;
          const cy = r * chh + chh / 2;
          const f = 1 - q / 0.6;
          ctx.strokeStyle = rgba(C.lilac, f * 0.55);
          ctx.lineWidth = 4;
          ctx.stroke(ghostPathAt(cx, cy, backOut(q, 1.3) * SHY_H));
          sparkle(ctx, cx, cy - 80, 30 * f, C.lilac, f * 0.7, q * 4);
        }
      }
      ctx.restore();
    },
  },
  chase: {
    clip(ctx, p) {
      const x = -520 + p * (W + 1100);
      const m = 0.06 + 0.22 * Math.abs(Math.sin(p * 13));
      const path = new Path2D();
      path.rect(-20, -20, Math.max(0, x) + 20, H + 40);
      path.moveTo(x, H / 2);
      path.arc(x, H / 2, 470, m * Math.PI, -m * Math.PI);
      path.closePath();
      ctx.clip(path);
    },
    over(ctx, p) {
      const x = -520 + p * (W + 1100);
      const m = 0.06 + 0.22 * Math.abs(Math.sin(p * 13));
      glow(ctx, x, H / 2, 720, C.gold, 0.3);
      ctx.save();
      ctx.strokeStyle = rgba(C.gold, 0.95);
      ctx.lineWidth = 11;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x, H / 2);
      ctx.arc(x, H / 2, 470, m * Math.PI, -m * Math.PI);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = rgba(C.ink, 0.85);
      ctx.beginPath();
      ctx.arc(x + 30, H / 2 - 216, 30, 0, TAU);
      ctx.fill();
      ctx.restore();
      for (let i = 0; i < 8; i++) {
        const px = x + 560 + i * 200;
        if (px < W + 60) pellet(ctx, px, H / 2, 15, clamp(inv(0.02, 0.25, p)) * 0.9, true);
      }
    },
  },
  curious: {
    clip(ctx, p) {
      const path = new Path2D();
      eachEye(p, (cx, cy, rx, ry, q, cw, chh) => {
        lens(path, cx, cy, rx, ry);
        if (q > 0.72) {
          const k = inv(0.72, 1, q);
          path.rect(cx - cw * k * 0.55, cy - chh * k * 0.55, cw * k * 1.1, chh * k * 1.1);
        }
      });
      ctx.clip(path);
    },
    over(ctx, p) {
      ctx.save();
      ctx.lineWidth = 7;
      ctx.lineJoin = 'round';
      eachEye(p, (cx, cy, rx, ry, q) => {
        if (q > 0.94) return;
        ctx.globalAlpha = 1 - q;
        const path = new Path2D();
        lens(path, cx, cy, rx, ry);
        ctx.strokeStyle = rgba(C.lilac, 0.95);
        ctx.stroke(path);
        const ir = Math.min(rx * 0.34, 62);
        const iy = Math.min(ry * 0.78, 70);
        ctx.fillStyle = rgba(C.brand, 0.95);
        ctx.beginPath();
        ctx.ellipse(cx, cy, ir, iy, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(C.ink, 0.95);
        ctx.beginPath();
        ctx.ellipse(cx, cy, ir * 0.55, iy * 0.6, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(C.white, 0.85);
        ctx.beginPath();
        ctx.ellipse(cx - ir * 0.3, cy - iy * 0.35, ir * 0.2, iy * 0.2, 0, 0, TAU);
        ctx.fill();
      });
      ctx.restore();
    },
  },
  drift: {
    clip(ctx, p) {
      const n = 9;
      const bh = H / n;
      const path = new Path2D();
      for (let i = 0; i < n; i++) {
        const q = clamp((p - (i / n) * 0.4) / 0.6);
        if (q <= 0) continue;
        const w = easeInOut(q) * W * 1.04;
        path.rect(i % 2 ? W - w : 0, i * bh - 1, w, bh + 2);
      }
      ctx.clip(path);
    },
    over(ctx, p) {
      const n = 9;
      const bh = H / n;
      const COLS = [C.brand, C.pink, C.cyan, C.lilac, C.glow];
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const q = clamp((p - (i / n) * 0.4) / 0.6);
        if (q <= 0 || q >= 1) continue;
        const w = easeInOut(q) * W * 1.04;
        const x = i % 2 ? W - w : w;
        const col = COLS[i % COLS.length];
        const x0 = i % 2 ? x : x - 340;
        const g = ctx.createLinearGradient(x0, 0, x0 + 340, 0);
        g.addColorStop(i % 2 ? 1 : 0, rgba(col, 0));
        g.addColorStop(i % 2 ? 0 : 1, rgba(col, 0.75));
        ctx.fillStyle = g;
        ctx.fillRect(x0, i * bh, 340, bh);
        glow(ctx, x, i * bh + bh / 2, bh * 1.2, col, 0.8);
      }
      ctx.restore();
    },
  },
  finale: {
    clip(ctx, p) {
      const e = easeInOut(p);
      const path = ghostPathAt(960, 470, e * 3200);
      if (p > 0.62) {
        const r = inv(0.62, 1, p) * 1500;
        path.moveTo(960 + r, 470);
        path.arc(960, 470, r, 0, TAU, true);
      }
      ctx.clip(path);
    },
    over(ctx, p) {
      const e = easeInOut(p);
      const path = ghostPathAt(960, 470, e * 3200);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = clamp(1 - p * 2.4) * 0.85;
      ctx.fillStyle = rgba(C.white, 1);
      ctx.fill(path);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = rgba(C.white, (1 - p) * 0.9);
      ctx.lineWidth = 18 * (1 - p) + 3;
      ctx.stroke(path);
      ctx.restore();
      flash(ctx, Math.sin(p * Math.PI) ** 2 * 0.35, C.brand);
    },
  },
};

export const iris = TRANSITIONS.finale;

function drawScene(ctx, i, local, t) {
  const sc = SCENES[i];
  backdrop(ctx, t, sc.bg);
  sc.draw(ctx, local, t);
}

function sceneAt(tt) {
  for (let i = N - 1; i >= 0; i--) if (tt >= START[i]) return i;
  return 0;
}

export function render(ctx, t) {
  const tt = ((t % LOOP) + LOOP) % LOOP;
  const i = sceneAt(tt);
  const sc = SCENES[i];
  const local = tt - START[i];
  const p = local / TRANS;
  const tr = TRANSITIONS[sc.key];
  const len = sc.bars * BAR;

  ctx.save();
  if (tr && p < 1) {
    const shake = Math.sin(p * Math.PI) * 9;
    ctx.translate(osc(p, 7.3) * shake, osc(p, 5.1, 0.3) * shake * 0.6);
    const j = (i - 1 + N) % N;
    drawScene(ctx, j, (tt - START[j] + LOOP) % LOOP, t);
    ctx.save();
    tr.clip(ctx, p);
    drawScene(ctx, i, local, t);
    ctx.restore();
    tr.over(ctx, p);
  } else {
    drawScene(ctx, i, local, t);
  }
  ctx.restore();

  vignette(ctx);
  const hard = HARD[i];
  const nextHard = HARD[(i + 1) % N];
  hud(ctx, t, {
    slide: sc.slide,
    count: SLIDES,
    title: sc.label,
    titleIn: hard ? ramp(TRANS * 0.8, TRANS * 1.9, local) : 1,
    tip: sc.tip,
    tipIn: (hard ? ramp(TRANS * 1.4, TRANS * 2.6, local) : 1) *
      (nextHard ? 1 - ramp(len - 0.7, len, local) : 1),
    chunk: hard ? (p < 1 ? 1 : clamp(1 - (local - TRANS) / 0.5)) : 0,
    blink: (t + 2.5) % 5 < 0.13 ? 0.05 : 1,
  });
}

export function sceneStart(i) {
  return START[((i % N) + N) % N];
}

export const sceneCount = N;
export const total = acc;
