import { W, H, C, TAU, rgb, rgba, mix, clamp, inv, rnd, osc, glow, rr, sparkle, caps, LOOP } from './paint.js';
import { ghost, tile } from './cast.js';

const hz = (cycles) => cycles / LOOP;

const BS = 0.25;
let bg = null;
let bgc = null;

export function backdrop(ctx, t, o = {}) {
  const dim = o.dim ?? 0;

  if (!bg) {
    bg = document.createElement('canvas');
    bg.width = W * BS;
    bg.height = H * BS;
    bgc = bg.getContext('2d');
    bgc.scale(BS, BS);
  }

  const g = bgc.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, rgb(mix(C.deep, C.void, 0.25 + dim * 0.4)));
  g.addColorStop(0.48, rgb(mix(C.deep2, C.void, 0.18 + dim * 0.5)));
  g.addColorStop(1, rgb(mix(C.void, C.deep, 0.35 - dim * 0.3)));
  bgc.fillStyle = g;
  bgc.fillRect(0, 0, W, H);

  const e = (o.energy ?? 1) * (1 - dim * 0.6);
  glow(bgc, 420 + osc(t, hz(2)) * 220, 300 + osc(t, hz(1), 0.3) * 130, 760, C.brand, 0.34 * e);
  glow(bgc, 1520 + osc(t, hz(3), 0.6) * 200, 760 + osc(t, hz(1), 0.1) * 150, 820, C.pink, 0.16 * e);
  glow(bgc, 960 + osc(t, hz(1), 0.8) * 320, 540, 900, C.brandLo, 0.3 * e);

  for (let i = 0; i < 7; i++) {
    const sp = hz(1 + Math.floor(rnd(i, 3) * 3));
    const x = (((rnd(i, 1) * 2400 + t * 40 * (i % 2 ? 1 : -1)) % 2400) + 2400) % 2400 - 240;
    const y = 180 + rnd(i, 2) * 700 + osc(t, sp, i) * 60;
    ghost(bgc, x, y, 170 + rnd(i, 4) * 210, {
      glow: 0,
      alpha: 0.03 * (1 - dim),
      noEyes: true,
      flat: true,
      tint: mix(C.brand, C.lilac, 0.35),
      flip: i % 2 === 0,
    });
  }

  ctx.drawImage(bg, 0, 0, W, H);

  ctx.save();
  for (let i = 0; i < 150; i++) {
    const x = rnd(i, 11) * W;
    const y = rnd(i, 12) * H;
    const tw = 0.25 + 0.75 * osc(t, hz(8 + Math.floor(rnd(i, 13) * 20)), rnd(i, 14)) ** 2;
    ctx.globalAlpha = tw * (0.16 + rnd(i, 15) * 0.4) * (1 - dim * 0.5);
    ctx.fillStyle = rgb(i % 5 ? C.lilac : C.cyan);
    ctx.beginPath();
    ctx.arc(x, y, 1 + rnd(i, 16) * 2.1, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  for (let i = 0; i < 9; i++) {
    const x = rnd(i, 21) * W;
    const y = rnd(i, 22) * H;
    const p = (t * hz(10 + Math.floor(rnd(i, 23) * 10)) + rnd(i, 24)) % 1;
    sparkle(ctx, x, y, 9 + rnd(i, 25) * 9, C.white, Math.sin(p * Math.PI) * 0.5 * (1 - dim), p * 2);
  }
}

let vig = null;

export function vignette(ctx) {
  if (!vig) {
    vig = document.createElement('canvas');
    vig.width = W * BS;
    vig.height = H * BS;
    const v = vig.getContext('2d');
    v.scale(BS, BS);
    const g = v.createRadialGradient(W / 2, H / 2, H * 0.46, W / 2, H / 2, H * 1.06);
    g.addColorStop(0, rgba(C.void, 0));
    g.addColorStop(1, rgba(C.void, 0.6));
    v.fillStyle = g;
    v.fillRect(0, 0, W, H);
  }
  ctx.drawImage(vig, 0, 0, W, H);
}

export function flash(ctx, a, c = C.white) {
  if (a <= 0.002) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = clamp(a);
  ctx.fillStyle = rgba(c, 1);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function bracket(ctx, x, y, sx, sy) {
  const a = 54;
  ctx.beginPath();
  ctx.moveTo(x + sx * a, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + sy * a);
  ctx.stroke();
}

export function hud(ctx, t, s) {
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = rgba(C.lilac, 0.2);
  ctx.lineCap = 'round';
  bracket(ctx, 44, 44, 1, 1);
  bracket(ctx, W - 44, 44, -1, 1);
  bracket(ctx, 44, H - 44, 1, -1);
  bracket(ctx, W - 44, H - 44, -1, -1);
  ctx.restore();

  tile(ctx, 112, 92, 62, { glow: 0.5, blink: s.blink });
  const wm = caps(ctx, 'KIRO', 156, 106, 36, 900, 0.1, C.white, 0.96, 'left');
  ctx.save();
  ctx.strokeStyle = rgba(C.lilac, 0.3);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(176 + wm, 70);
  ctx.lineTo(176 + wm, 108);
  ctx.stroke();
  ctx.restore();
  caps(ctx, 'STARTING SOON', 200 + wm, 100, 18, 600, 0.36, C.lilac, 0.6, 'left');

  const idx = String(s.slide).padStart(2, '0');
  caps(ctx, `${idx} / ${String(s.count).padStart(2, '0')}`, W - 80, 76, 17, 700, 0.3, C.lilac, 0.5, 'right');
  ctx.save();
  ctx.globalAlpha = clamp(s.titleIn);
  const dx = (1 - clamp(s.titleIn)) * 34;
  caps(ctx, s.title, W - 80 + dx, 110, 27, 800, 0.2, C.white, 0.9, 'right');
  ctx.restore();

  const x0 = 80;
  const x1 = W - 80;
  const by = 986;
  const dots = '.'.repeat(1 + Math.floor((t * 2.6) % 4));
  caps(ctx, `LOADING THE SHOW${dots}`, x0, by - 26, 19, 700, 0.32, C.lilac, 0.75, 'left');
  caps(ctx, 'PLEASE STAND BY', x1, by - 26, 19, 700, 0.32, C.lilac, 0.45, 'right');

  rr(ctx, x0, by, x1 - x0, 9, 4.5);
  ctx.fillStyle = rgba(C.white, 0.1);
  ctx.fill();

  const travel = x1 - x0 + 760;
  for (const ph of [0, 0.5]) {
    const q = ((t / (LOOP / 4)) + ph) % 1;
    const head = x0 - 380 + q * travel;
    if (head < x0 - 340 || head > x1 + 380) continue;
    ctx.save();
    rr(ctx, x0, by, x1 - x0, 9, 4.5);
    ctx.clip();
    const g = ctx.createLinearGradient(head - 330, 0, head, 0);
    g.addColorStop(0, rgba(C.brandLo, 0));
    g.addColorStop(0.55, rgba(C.brand, 0.85));
    g.addColorStop(1, rgba(C.pink, 1));
    ctx.fillStyle = g;
    ctx.fillRect(head - 330, by, 330, 9);
    ctx.restore();
    if (head > x0 && head < x1) glow(ctx, head, by + 4.5, 60, C.pink, 0.6);
    if (ph === 0) {
      const edge = inv(x0 + 250, x0 + 400, head) * inv(x1 + 20, x1 - 300, head);
      if (edge > 0.02) {
        ghost(ctx, head, by - 30, 44, { glow: 0.35 * edge, alpha: edge, look: [1, 0], blink: s.blink });
      }
    }
  }

  ctx.save();
  ctx.globalAlpha = clamp(s.tipIn) * 0.55;
  caps(ctx, s.tip, W / 2, 1042, 19, 500, 0.22, C.lilac, 1, 'center');
  ctx.restore();

  if (s.chunk > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(s.chunk);
    const n = s.count;
    for (let i = 0; i < n; i++) {
      const x = W / 2 - (n * 22) / 2 + i * 22;
      rr(ctx, x, 948, 15, 8, 3);
      ctx.fillStyle = i < s.slide ? rgba(C.pink, 0.95) : rgba(C.white, 0.16);
      ctx.fill();
    }
    ctx.restore();
  }
}
