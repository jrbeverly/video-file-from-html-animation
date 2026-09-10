import {
  W, H, C, TAU, rgb, rgba, mix, clamp, lerp, inv, ramp, easeOut, easeIn, easeInOut,
  backOut, bounce, elastic, osc, rnd, rndr, glow, haze, rr, sparkle, caps, layout, font,
  SPB, LOOP,
} from './paint.js';
import {
  ghost, tile, pacGhost, pacman, board, droid, pellet, puff, burst, speedLines,
  ghostCloud,
} from './cast.js';

const beats = (s) => s / SPB;

function hero(ctx, str, cx, y, size, track, prog, o = {}) {
  const L = layout(ctx, str, size, 900, track);
  const left = cx - L.w / 2;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = font(900, size);
  L.chars.forEach((c, i) => {
    const p = clamp((prog - i * (o.stagger ?? 0.055)) / (o.dur ?? 0.3));
    if (p <= 0) return;
    const e = backOut(p, 2.6);
    ctx.save();
    ctx.translate(left + c.x + c.w / 2, y);
    ctx.scale(e, 2 - e);
    ctx.rotate((1 - p) * (i % 2 ? 0.2 : -0.2));
    ctx.globalAlpha = clamp(p * 2);
    ctx.fillStyle = rgba(C.brandLo, 0.85);
    ctx.fillText(c.ch, -c.w / 2 + size * 0.045, size * 0.055);
    if (o.outline) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = size * 0.09;
      ctx.strokeStyle = rgba(mix(C.brand, C.void, 0.35), 0.9);
      ctx.strokeText(c.ch, -c.w / 2, 0);
    }
    if (o.tint) {
      const g = ctx.createLinearGradient(0, -size * 0.82, 0, size * 0.08);
      g.addColorStop(0, rgb(C.white));
      g.addColorStop(0.55, rgb(C.lilac));
      g.addColorStop(1, rgb(mix(C.brand, C.pink, 0.4)));
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = rgb(C.white);
    }
    ctx.fillText(c.ch, -c.w / 2, 0);
    ctx.restore();
  });
  ctx.restore();
  return L.w;
}

function motes(ctx, t, n, y0, y1, seed) {
  const span = y1 - y0;
  for (let i = 0; i < n; i++) {
    const laps = 2 + Math.floor(rnd(i, seed) * 3);
    const x = rnd(i, seed + 1) * W + osc(t, (2 + Math.floor(rnd(i, seed + 2) * 3)) / LOOP, i) * 60;
    const y = y1 - (((t / LOOP) * laps + rnd(i, seed + 3)) % 1) * span;
    const h = 26 + rnd(i, seed + 4) * 34;
    ghost(ctx, x, y, h, {
      alpha: 0.42 * clamp(inv(y0, y0 + 140, y) * inv(y1, y1 - 180, y)),
      glow: 0.3,
      flip: i % 2 === 0,
      blink: osc(t, 21 / LOOP, i) > 0.93 ? 0.1 : 1,
    });
  }
}

const CARD = { tileY: 296, tileSize: 206, startY: 546, soonY: 726, subY: 806 };

export function cardFace(t) {
  return { blink: (t + 2.5) % 5 < 0.13 ? 0.05 : 1, look: [osc(t, 1 / LOOP) * 0.4, 0] };
}

function titleCard(ctx, t, o = {}) {
  const f = cardFace(t);
  tile(ctx, 960, o.tileY ?? CARD.tileY, o.tileSize ?? CARD.tileSize, {
    alpha: o.tileAlpha ?? 1,
    blink: f.blink,
    look: f.look,
  });
  hero(ctx, 'STARTING', 960, CARD.startY, 124, 0.16, o.startP ?? 1, { stagger: 0.07 });
  hero(ctx, 'SOON', 960, CARD.soonY, 178, 0.09, o.soonP ?? 1, {
    stagger: 0.1,
    tint: true,
    outline: true,
  });
  caps(ctx, 'GRAB A COFFEE  ·  WE START SHORTLY', 960, CARD.subY, 25, 600, 0.34, C.lilac, (o.subP ?? 1) * 0.75);
}

export const title = {
  key: 'title',
  bars: 3,
  slide: 1,
  label: 'WELCOME',
  tip: 'the stream begins in a moment',
  bg: {},
  draw(ctx, s, t) {
    const b = beats(s);
    motes(ctx, t, 7, 240, 1000, 60);
    titleCard(ctx, t);

    const gin = clamp(inv(0.8, 2.4, b));
    if (gin <= 0) return;
    const leave = clamp(inv(10.8, 12.2, b));
    const x = lerp(lerp(2260, 1524, easeOut(gin)), 2320, easeIn(leave));
    const gy = 600 + osc(b, 0.16) * 26;
    const wave = b > 3.0 && b < 5.6 ? Math.max(0, osc(b, 1.6)) : 0;
    const peek = b > 8.6 && b < 10.6;
    ghost(ctx, x, gy, 218, {
      glow: 0.6,
      blink: (b > 6.3 && b < 6.55) || (b > 8.0 && b < 8.25) ? 0.05 : 1,
      look: peek ? [clamp(osc(b, 0.9) * 2, -1, 1), -0.2] : [-0.6, 0],
      hands: wave > 0 ? true : undefined,
      wave,
      happy: b > 3.4 && b < 5.4,
      tilt: leave > 0 ? leave * 0.4 : osc(b, 0.2) * 0.05,
      wide: peek ? 1.25 : 1,
    });
    if (peek) {
      for (let i = 0; i < 3; i++) {
        const p = (b - 8.6 + i * 0.4) % 1.2;
        if (p > 0 && p < 1) sparkle(ctx, x + 120, gy - 130 - p * 60, 26 * (1 - p), C.gold, 1 - p, p * 3);
      }
    }
    if (leave > 0) speedLines(ctx, x - 120, gy, 420, 220, leave * 0.9, 3, 1);
  },
};

export const skate = {
  key: 'skate',
  slide: 2,
  bars: 5,
  label: 'KICKFLIP',
  tip: 'compiling ollie physics',
  bg: {},
  draw(ctx, s, t) {
    const b = beats(s);
    const gy = 872;

    for (let i = 0; i < 13; i++) {
      const x = -40 + i * 156 + rndr(i, 71, -18, 18);
      const bw = 92 + rnd(i, 72) * 58;
      const bh = 150 + rnd(i, 73) * 250;
      ctx.fillStyle = rgba(mix(C.deep2, C.void, 0.42), 0.95);
      rr(ctx, x, gy - bh, bw, bh + 30, 10);
      ctx.fill();
      for (let k = 0; k < 12; k++) {
        const wx = x + 16 + (k % 3) * ((bw - 40) / 2);
        const wy = gy - bh + 26 + Math.floor(k / 3) * 44;
        if (wy > gy - 40) continue;
        const lit = rnd(i * 17 + k, 74);
        ctx.fillStyle = rgba(C.brand, lit > 0.55 ? 0.55 + lit * 0.4 : 0.14);
        rr(ctx, wx, wy, 13, 17, 3);
        ctx.fill();
      }
      if (i % 4 === 1) tile(ctx, x + bw / 2, gy - bh - 34, 46, { glow: 0.35 });
    }

    ctx.save();
    ctx.fillStyle = rgba(mix(C.deep2, C.brand, 0.2), 0.9);
    ctx.beginPath();
    ctx.moveTo(0, gy + 10);
    for (let i = 0; i <= 26; i++) {
      const x = (i / 26) * W;
      ctx.lineTo(x, gy - 66 - Math.sin(i * 0.62) * 40 - Math.sin(i * 0.21 + 1.4) * 34);
    }
    ctx.lineTo(W, gy + 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    haze(ctx, gy - 300, gy, C.brand, 0.3);
    const gg = ctx.createLinearGradient(0, gy - 6, 0, H);
    gg.addColorStop(0, rgba(C.deep2, 0.95));
    gg.addColorStop(1, rgba(C.void, 0.98));
    ctx.fillStyle = gg;
    ctx.fillRect(0, gy - 6, W, H - gy + 6);
    ctx.save();
    ctx.strokeStyle = rgba(C.glow, 0.55);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, gy - 4);
    ctx.lineTo(W, gy - 4);
    ctx.stroke();
    ctx.setLineDash([46, 40]);
    ctx.strokeStyle = rgba(C.brand, 0.8);
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, gy + 42);
    ctx.lineTo(W, gy + 42);
    ctx.stroke();
    ctx.restore();

    const takeoff = 6.6;
    const landing = 10.0;
    const sx = -240 + (b - 0.6) * 154;
    const air = clamp(inv(takeoff, landing, b));
    const hop = b > takeoff && b < landing ? Math.sin(air * Math.PI) * 306 : 0;
    const crouch = ramp(6.0, takeoff, b) * (1 - clamp(inv(takeoff, takeoff + 0.25, b)));
    const impact = b >= landing ? Math.exp(-(b - landing) * 9) : 0;

    const DV = 290;
    const dx = b > 12 ? -140 + (b - 12) * DV : -1e4;
    if (dx > -260 && dx < 2200) droid(ctx, dx, gy - 78, 72, dx * 0.9);

    for (let i = 0; i < 5; i++) {
      const gx = 788 + i * 86;
      const knock = 12 + (gx + 27) / DV;
      const gh = 96;
      const k = b - knock;
      if (k > 0) {
        if (k > 3.4) continue;
        const vx = 150 + rnd(i, 101) * 430;
        const vy = 380 + rnd(i, 102) * 320;
        const px = gx + vx * k;
        const py = gy - 46 - vy * k + 130 * k * k;
        ctx.save();
        ghost(ctx, px, py, gh, {
          glow: 0.3,
          alpha: clamp(1 - inv(1.9, 3.2, k)),
          tilt: (i % 2 ? 1 : -1) * (2.2 + rnd(i, 103)) * k,
          look: [-0.8, 0.6],
          wide: 1.35,
          mouth: 1,
        });
        ctx.restore();
        if (k < 0.5) {
          burst(ctx, gx, gy - 60, k / 0.5, 190, C.gold, 7, i, 60);
          puff(ctx, gx, gy - 20, 40 * (1 - k / 0.5) + 12, 0.7 * (1 - k / 0.5));
        }
        continue;
      }
      const near = clamp(1 - Math.abs(sx - gx) / 300);
      const duck = near * (0.35 + air * 0.5);
      const popUp = clamp(inv(landing + 0.4 + i * 0.12, landing + 0.8 + i * 0.12, b));
      const brace = clamp(inv(knock - 1.1, knock - 0.2, b));
      ghost(ctx, gx, gy - 46 + duck * 40 - popUp * 44 * Math.abs(Math.sin(b * 3 + i)), gh, {
        glow: 0.3,
        sy: 1 - duck * 0.3,
        sx: 1 + duck * 0.24,
        wide: 1 + near * 0.4 + brace * 0.5,
        look: [brace > 0.1 ? -1 : clamp((sx - gx) / 280, -1, 1), duck > 0.1 ? -0.5 : 0],
        happy: popUp > 0.4 && brace < 0.2,
        mouth: brace > 0.4 ? 1 : 0,
        flip: brace > 0.1 ? true : sx > gx,
      });
      if (popUp > 0.1 && popUp < 1) burst(ctx, gx, gy - 130, popUp, 70, C.gold, 5, i, 40);
    }

    if (sx > -320 && sx < 2260) {
      const rideY = gy - 20 - hop;
      const rot = b > takeoff && b < landing ? -Math.sin(air * TAU) * 0.3 : impact * 0.12;
      for (let k = 3; k >= 1; k--) {
        const bb = b - k * 0.07;
        const ax = -240 + (bb - 0.6) * 154;
        const aa = clamp(inv(takeoff, landing, bb));
        const ah = bb > takeoff && bb < landing ? Math.sin(aa * Math.PI) * 306 : 0;
        ghost(ctx, ax, gy - 20 - ah - 88, 152, { alpha: 0.09 * ((4 - k) / 3), glow: 0, noEyes: true });
      }
      speedLines(ctx, sx - 110, rideY - 70, 340, 190, hop > 4 ? 0.5 : 0.28, 7, 1);
      board(ctx, sx, rideY, 236, {
        rot,
        roll: b * 1.4,
        flip: clamp(inv(takeoff + 0.15, landing - 0.25, b)),
      });
      ghost(ctx, sx - 6, rideY - 86 - crouch * -16 + impact * 12, 152, {
        glow: 0.55,
        tilt: rot * 0.8,
        sy: 1 - crouch * 0.16 - impact * 0.22,
        sx: 1 + crouch * 0.1 + impact * 0.18,
        look: [0.7, hop > 40 ? -0.4 : 0],
        wide: hop > 40 ? 1.2 : 1,
        happy: b > landing + 0.3 && b < landing + 2,
        mouth: hop > 120 ? 1 : 0,
      });
      if (impact > 0.02) {
        for (let i = 0; i < 9; i++) {
          const a = Math.PI + (i / 8) * Math.PI;
          const d = (1 - impact) * 150;
          puff(ctx, sx + Math.cos(a) * d * 1.5, gy - 10 + Math.sin(a) * d * 0.35, 26 * impact + 8, impact * 0.8);
        }
      }
    }
  },
};

export const shy = {
  key: 'shy',
  slide: 3,
  bars: 4,
  label: 'PEEK-A-BOO',
  tip: 'summoning shy ghosts',
  bg: { dim: 0.15 },
  draw(ctx, s, t) {
    const b = beats(s);
    const ledge = 802;

    const POPS = [
      [0.7, 296, 0, 152, 'peek'],
      [1.2, 1584, 0, 140, 'peek'],
      [1.7, 742, 372, 124, 'air'],
      [2.2, 1204, 264, 132, 'air'],
      [2.7, 512, 0, 166, 'peek'],
      [3.2, 1428, 452, 118, 'air'],
      [3.7, 168, 236, 128, 'air'],
      [4.2, 1760, 0, 146, 'peek'],
      [4.7, 962, 168, 116, 'air'],
      [5.2, 1050, 0, 158, 'peek'],
      [5.7, 380, 468, 122, 'air'],
      [6.2, 1620, 300, 134, 'air'],
      [10.2, 372, 344, 122, 'air'],
      [10.7, 1516, 220, 130, 'air'],
      [11.2, 690, 196, 112, 'air'],
      [11.7, 1288, 476, 124, 'air'],
      [12.2, 176, 512, 118, 'air'],
      [12.7, 1712, 372, 126, 'air'],
      [13.2, 928, 268, 130, 'air'],
      [13.7, 1120, 0, 148, 'peek'],
    ];

    POPS.forEach(([t0, x, y, h, kind], i) => {
      const p = b - t0;
      if (p < 0 || p > 2.6) return;
      const up = clamp(inv(0, 0.45, p));
      const down = clamp(inv(2.0, 2.5, p));
      const look = clamp(osc(p, 0.55, i * 0.3) * 1.6, -1, 1);
      const blink = p > 1.0 && p < 1.2 ? 0.05 : 1;
      if (kind === 'peek') {
        const gy = lerp(ledge + h * 0.72, ledge - h * 0.02, backOut(up, 1.4) * (1 - easeIn(down)));
        ghost(ctx, x, gy, h, {
          glow: 0.45,
          look: [look, -0.25],
          blink,
          wide: 1.2,
          flip: look < 0,
        });
      } else {
        const sc = backOut(up, 2.2) * (1 - easeIn(down));
        ghost(ctx, x, y + 220 + (1 - sc) * 26, h * sc, {
          glow: 0.5,
          look: [look, 0],
          blink,
          wide: 1.15,
          flip: look < 0,
          alpha: clamp(sc * 1.6),
        });
        if (up < 1) burst(ctx, x, y + 220, up, h * 1.05, C.lilac, 6, i, h * 0.52);
        if (down > 0 && down < 1) burst(ctx, x, y + 220, down, h * 1.25, C.pink, 6, i + 2, h * 0.52);
      }
    });

    const big = b - 7.4;
    if (big > -0.2 && big < 5) {
      const up = clamp(inv(0, 0.7, big));
      const down = clamp(inv(3.4, 4.3, big));
      const hide = ramp(1.3, 1.8, big) * (1 - ramp(2.7, 3.1, big));
      const gy = lerp(ledge + 190, 528, backOut(up, 1.5)) + easeIn(down) * 420;
      if (up > 0.2) burst(ctx, 960, gy, clamp(inv(0.2, 1.4, big)), 330, C.gold, 9, 5, 190);
      ghost(ctx, 960, gy, 322, {
        glow: 0.75,
        blink: big > 2.3 && big < 2.5 ? 0.05 : 1,
        look: [osc(big, 0.5) * 0.7, hide > 0.5 ? 0.2 : -0.1],
        blush: hide,
        hands: hide > 0.18 ? 'shy' : undefined,
        peek: 1 - hide,
        wide: 1.15,
        tilt: osc(big, 0.3) * 0.05,
      });
    }

    const lg = ctx.createLinearGradient(0, ledge - 10, 0, H);
    lg.addColorStop(0, rgb(mix(C.deep2, C.brand, 0.16)));
    lg.addColorStop(1, rgb(C.void));
    ctx.fillStyle = lg;
    ctx.fillRect(0, ledge, W, H - ledge);
    ctx.save();
    ctx.strokeStyle = rgba(C.brand, 0.35);
    ctx.lineWidth = 3;
    for (let i = 0; i < 15; i++) {
      const x = 64 + i * 128;
      ctx.beginPath();
      ctx.moveTo(x, ledge + 26);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(C.lilac, 0.5);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, ledge + 2);
    ctx.lineTo(W, ledge + 2);
    ctx.moveTo(0, ledge + 26);
    ctx.lineTo(W, ledge + 26);
    ctx.stroke();
    ctx.restore();
    haze(ctx, ledge - 240, ledge, C.brand, 0.2);

    for (let i = 0; i < 6; i++) {
      const p = (b * 0.3 + rnd(i, 81)) % 1;
      const side = i % 2 ? 1 : 0;
      const x = side ? 1630 + rnd(i, 82) * 230 : 60 + rnd(i, 82) * 230;
      const y = 170 + rnd(i, 83) * 430;
      const a = Math.sin(p * Math.PI) ** 2 * 0.95;
      if (a < 0.03) continue;
      const dir = side ? -6 : 6;
      glow(ctx, x, y, 150, C.lilac, a * 0.4);
      ctx.save();
      ctx.globalAlpha = a;
      for (const sx of [-19, 19]) {
        ctx.fillStyle = rgb(C.white);
        ctx.beginPath();
        ctx.ellipse(x + sx, y, 12, 17, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgb(C.ink);
        ctx.beginPath();
        ctx.ellipse(x + sx + dir, y, 7, 11, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  },
};

export const chase = {
  key: 'chase',
  slide: 4,
  bars: 6,
  label: 'POWER-UP',
  tip: 'resolving ghost dependencies',
  bg: {},
  draw(ctx, s, t) {
    const b = beats(s);
    const lane = 648;
    const PWR = 1520;
    const EAT = 11;
    const TURN = 12;
    const VF = 184;
    const VP = 190;
    const BACK = 21;
    const VB = 320;
    const OFF = [260, 430, 600, 770];
    const VG = [130, 130, 130, 152];
    const EATB = [12.75, 15.04, 17.33];

    ctx.save();
    ctx.lineCap = 'round';
    for (const [y, dir] of [[500, 1], [800, -1]]) {
      ctx.strokeStyle = rgba(C.brand, 0.9);
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(118, y);
      ctx.lineTo(W - 118, y);
      ctx.stroke();
      ctx.strokeStyle = rgba(C.brand, 0.32);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(140, y + dir * 18);
      ctx.lineTo(W - 140, y + dir * 18);
      ctx.stroke();
      haze(ctx, y + dir * 170, y, C.brand, 0.12);
    }
    ctx.restore();

    for (let i = 0; i < 7; i++) {
      const bw = i % 2 ? 118 : 196;
      const x = 150 + i * 246 + (i % 2 ? 40 : 0);
      rr(ctx, x, 322, bw, 94, 22);
      ctx.fillStyle = rgba(C.brandLo, 0.22);
      ctx.fill();
      ctx.strokeStyle = rgba(C.brand, 0.7);
      ctx.lineWidth = 7;
      ctx.stroke();
      rr(ctx, x + 16, 338, bw - 32, 62, 14);
      ctx.strokeStyle = rgba(C.brand, 0.25);
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    const fwd = b < EAT;
    const back = b >= BACK;
    const rawPx = -140 + (b - 2) * VF;
    const px = back ? -170 + (b - BACK) * VB : fwd ? rawPx : PWR - (b - EAT - 0.4) * VP;
    const face = fwd || back ? 1 : -1;

    const gpos = (i, bb) => {
      const X = -140 + (EAT - 2) * VF - OFF[i];
      if (bb < EAT) return -140 + (bb - 2) * VF - OFF[i];
      return X - Math.max(0, bb - TURN - 0.25 * i) * VG[i];
    };

    for (let i = 0; i < 19; i++) {
      const x = 132 + i * 88;
      if (x > PWR - 70) continue;
      const gone = x < (fwd ? rawPx : PWR) - 10;
      const re = clamp(inv(19.4, 21.4, b));
      pellet(ctx, x, lane, 9, gone ? re * (0.35 + 0.65 * Math.abs(osc(b, 1.1, i))) : 1);
    }
    if (b < EAT) pellet(ctx, PWR, lane, 22 + osc(b, 2.2) * 5, 1, true);

    if (px > -220 && px < W + 220) {
      speedLines(ctx, px - face * 84, lane, 210, 130, fwd ? 0.28 : 0.5, 9, face);
      pacman(ctx, px, lane, 58, face, b * 3.4);
    }

    const GH = [
      [C.pink, 0],
      [C.cyan, 1],
      [C.gold, 2],
      [C.brand, 3],
    ];
    GH.forEach(([col, i]) => {
      const last = i === 3;
      let gx = gpos(i, b);
      if (last && back) gx = -390 + (b - BACK) * VB;

      if (!last && b > EATB[i]) {
        const e = b - EATB[i];
        const cx = gpos(i, EATB[i]);
        if (e < 0.34) {
          const k = e / 0.34;
          pacGhost(ctx, lerp(cx, cx + 60, k), lane, 116 * (1 - k * 0.85), {
            scared: 1,
            phase: b * 1.5 + i,
            dir: -1,
            alpha: 1 - k * 0.7,
          });
          burst(ctx, cx + 40, lane, k, 220, C.cyan, 8, i, 60);
        } else {
          const d = e - 0.34;
          pacGhost(ctx, cx + d * 150, lane - d * 96, 104, {
            eyesOnly: true,
            dir: 1,
            dirY: -0.7,
            alpha: clamp(1 - d / 5),
          });
        }
        if (e < 2) {
          const sy = lane - 66 - e * 48;
          caps(ctx, String(200 * 2 ** i), cx + 4, sy + 5, 56, 900, 0.06, C.brandLo, (1 - e / 2) * 0.8);
          caps(ctx, String(200 * 2 ** i), cx, sy, 56, 900, 0.06, C.cyan, 1 - e / 2);
        }
        return;
      }

      if (gx < -220 || gx > W + 220) return;
      if (last && back) {
        speedLines(ctx, gx - 84, lane, 210, 130, 0.35, 21, 1);
        ghost(ctx, gx, lane + osc(b, 1.6, 0.6) * 8, 134, {
          glow: 0.6,
          look: [1, 0.15],
          wide: 1.16,
          tilt: 0.13,
          blink: osc(b, 0.9) > 0.94 ? 0.05 : 1,
        });
        return;
      }
      const scared = clamp(inv(EAT, TURN, b));
      const spin = clamp(inv(EAT + 0.2, TURN, b));
      pacGhost(ctx, gx, lane + osc(b, 1.6, i * 0.2) * 7, 116, {
        tint: col,
        scared,
        phase: b * 1.5 + i,
        dir: scared > 0.5 ? -1 : 1,
        alpha: scared > 0.5 && b > 16 ? 0.62 + 0.38 * Math.abs(osc(b, 3)) : 1,
      });
      if (spin > 0 && spin < 1) burst(ctx, gx, lane, spin, 170, C.cyan, 6, i, 80);
    });

    if (b > EAT && b < EAT + 1.6) {
      const p = inv(EAT, EAT + 1.6, b);
      burst(ctx, PWR, lane, p, 480, C.gold, 12, 1, 60);
      glow(ctx, PWR, lane, 900 * (1 - p) + 200, C.gold, (1 - p) * 0.7);
    }
    if (back && b < BACK + 2.6) {
      const p = inv(BACK + 0.6, BACK + 2.6, b);
      caps(ctx, 'UH-OH', px + 20, lane - 105 - p * 30, 46, 900, 0.16, C.gold, clamp(inv(BACK + 0.5, BACK + 0.9, b)) * (1 - p));
    }
  },
};

export const curious = {
  key: 'curious',
  slide: 5,
  bars: 4,
  label: 'CURIOUS',
  tip: 'they can see the cursor',
  bg: {},
  draw(ctx, s, t) {
    const b = beats(s);
    const settle = clamp(inv(12, 13.4, b));
    const ox = lerp(960 + Math.sin(b * 0.62) * 700, 960, easeInOut(settle));
    const oy = lerp(470 + Math.sin(b * 0.93 + 1.1) * 236, 452, easeInOut(settle));
    const blinkAll = b > 14.4 && b < 14.75;
    const pop = clamp(inv(14.9, 15.6, b));

    if (pop < 1) {
      const pulse = 1 + osc(b, 2.4) * 0.16 * settle;
      glow(ctx, ox, oy, 260 * pulse, C.gold, 0.95 * (1 - pop));
      ctx.save();
      ctx.globalAlpha = 1 - pop;
      ctx.fillStyle = rgb(mix(C.gold, C.white, 0.5));
      ctx.beginPath();
      ctx.arc(ox, oy, 24 * pulse, 0, TAU);
      ctx.fill();
      ctx.restore();
      sparkle(ctx, ox, oy, 88, C.white, 0.6 * (1 - pop), b * 1.4);
    }

    const rows = [
      { y: 300, n: 6, h: 104 },
      { y: 508, n: 5, h: 138 },
      { y: 742, n: 6, h: 172 },
    ];
    let idx = 0;
    for (const r of rows) {
      for (let i = 0; i < r.n; i++) {
        const k = idx++;
        const x = (W / (r.n + 1)) * (i + 1) + rndr(k, 31, -46, 46);
        const y = r.y + rndr(k, 32, -26, 26) + osc(b, 0.32, k * 0.2) * 12;
        const inn = clamp(inv(k * 0.13, k * 0.13 + 1.1, b));
        if (inn <= 0) continue;
        const dx = ox - x;
        const dy = oy - y;
        const d = Math.hypot(dx, dy) || 1;
        const near = clamp(1 - d / 900);
        ghost(ctx, x, y, r.h * backOut(inn, 1.6), {
          glow: 0.35 + near * 0.4,
          look: [clamp(dx / 280, -1, 1), clamp(dy / 240, -1, 1)],
          tilt: clamp(dx / 2200, -0.22, 0.22),
          blink: blinkAll || (osc(b, 0.31, k * 0.7) > 0.965) ? 0.05 : 1,
          wide: 1 + near * 0.28,
          alpha: clamp(inn * 1.4),
          happy: pop > 0.2 && k % 3 === 0,
        });
      }
    }

    if (pop > 0) burst(ctx, ox, oy, clamp(inv(14.9, 16.2, b)), 680, C.gold, 14, 2, 40);
  },
};

export const drift = {
  key: 'drift',
  slide: 6,
  bars: 4,
  label: 'DRIFT',
  tip: 'buffering good vibes',
  bg: { dim: 0.5, energy: 0.6 },
  draw(ctx, s, t) {
    const b = beats(s);
    const warp = clamp(inv(10.0, 14.3, b));
    const blast = clamp(inv(14.55, 16.05, b));
    if (blast >= 1) return;
    const COLS = [C.brand, C.pink, C.cyan, C.lilac, C.gold, C.glow];

    const pos = (i, bb) => {
      const a = rndr(i, 41, 0, TAU);
      const sp = 1 + rndr(i, 42, 0, 0.5);
      let x = 960 + Math.sin(bb * 0.23 * sp + a) * 700 + Math.sin(bb * 0.15 * sp + a * 2) * 260;
      let y = 520 + Math.cos(bb * 0.19 * sp + a * 1.4) * 320 + Math.sin(bb * 0.31 * sp + a) * 90;
      const k = easeIn(clamp(inv(10.0, 14.3, bb))) * 0.92;
      x = 960 + (x - 960) * (1 - k);
      y = 470 + (y - 470) * (1 - k);
      const bl = clamp(inv(14.55, 16.05, bb));
      if (bl > 0) {
        const ang = (i / 9) * TAU + rndr(i, 44, -0.4, 0.4);
        const d = bl ** 1.35 * 2300;
        x += Math.cos(ang) * d;
        y += Math.sin(ang) * d * 0.72;
      }
      return [x, y];
    };

    const trailA = 1 - clamp(inv(0.3, 0.62, blast));
    const dt = 0.043 * (1 - blast * 0.82);
    if (trailA > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      const STEPS = 68;
      for (let i = 0; i < 9; i++) {
        const col = COLS[i % COLS.length];
        for (let k = STEPS; k > 0; k--) {
          const bb = b - k * dt;
          if (bb < -0.4) continue;
          const [x0, y0] = pos(i, bb);
          const [x1, y1] = pos(i, bb - dt * 1.05);
          const f = 1 - k / STEPS;
          ctx.globalAlpha = f * f * 0.26 * (1 - warp * 0.35) * trailA;
          ctx.strokeStyle = rgba(col, 1);
          ctx.lineWidth = 3 + f * f * 28;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x0, y0);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    const ghostA = 1 - clamp(inv(0.82, 0.98, blast));
    if (ghostA > 0.01) {
      for (let i = 0; i < 9; i++) {
        const [x, y] = pos(i, b);
        const [px, py] = pos(i, b - 0.09);
        const vx = x - px;
        const h = 96 + rndr(i, 43, 0, 54);
        glow(ctx, x, y, h * 1.5, COLS[i % COLS.length], 0.4 * ghostA);
        ghost(ctx, x, y, h * (1 - warp * 0.3), {
          alpha: ghostA,
          glow: 0.3,
          aura: COLS[i % COLS.length],
          flip: vx < 0,
          tilt: clamp(vx * 0.012, -0.35, 0.35) + blast * (i % 2 ? 5 : -5),
          look: [clamp(vx * 0.05, -1, 1), 0],
          blink: osc(b, 0.4, i) > 0.95 ? 0.05 : 1,
          happy: warp > 0.4 && blast <= 0,
          mouth: blast > 0 ? 1 : 0,
        });
      }
    }

    const pullA = warp * (1 - clamp(blast * 2.2));
    if (pullA > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 42; i++) {
        const a = rnd(i, 51) * TAU;
        const d0 = 200 + rnd(i, 52) * 900;
        const p = (b * 0.5 + rnd(i, 53)) % 1;
        const r0 = d0 * (1 - p);
        ctx.globalAlpha = pullA * 0.5 * Math.sin(p * Math.PI);
        ctx.strokeStyle = rgba(C.lilac, 1);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(960 + Math.cos(a) * r0, 470 + Math.sin(a) * r0 * 0.7);
        ctx.lineTo(960 + Math.cos(a) * (r0 + 190 * warp), 470 + Math.sin(a) * (r0 + 190 * warp) * 0.7);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (blast > 0) {
      const bp = easeOut(blast);
      const fade = 1 - clamp(inv(0.5, 0.95, blast));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (let i = 0; i < 34; i++) {
        const a = (i / 34) * TAU + rnd(i, 55) * 0.36;
        const r0 = 30 + bp * (760 + rnd(i, 56) * 820);
        const len = 90 + bp * 320 + rnd(i, 57) * 130;
        ctx.globalAlpha = fade * (0.35 + rnd(i, 58) * 0.5);
        ctx.strokeStyle = rgba(i % 3 ? C.lilac : C.pink, 1);
        ctx.lineWidth = 2 + rnd(i, 59) * 5;
        ctx.beginPath();
        ctx.moveTo(960 + Math.cos(a) * r0, 470 + Math.sin(a) * r0 * 0.72);
        ctx.lineTo(960 + Math.cos(a) * (r0 + len), 470 + Math.sin(a) * (r0 + len) * 0.72);
        ctx.stroke();
      }
      ctx.globalAlpha = fade * 0.55;
      ctx.strokeStyle = rgba(C.white, 1);
      ctx.lineWidth = 16 * (1 - bp) + 2;
      ctx.beginPath();
      ctx.ellipse(960, 470, bp * 1150, bp * 1150 * 0.72, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    const core = warp * 0.5 * (1 - clamp(inv(0, 0.42, blast)));
    const pop = blast > 0 ? Math.max(0, 1 - blast * 8) * 0.6 : 0;
    if (core + pop > 0.02) glow(ctx, 960, 470, 300 + warp * 700, C.white, core + pop);
  },
};

export const finale = {
  key: 'finale',
  slide: 1,
  bars: 6,
  label: 'WELCOME',
  tip: 'the stream begins in a moment',
  bg: {},
  draw(ctx, s, t) {
    const b = beats(s);
    const pts = ghostCloud();
    const CH = 552;
    const cx = 960;
    const cy = 470;
    const solid = clamp(inv(11.2, 12.6, b));
    const lock = easeOut(clamp(inv(13.4, 15.6, b)));
    const tA = clamp(inv(13.6, 15.1, b));
    const gh = lerp(CH, CARD.tileSize * 0.659, lock);
    const gy = lerp(cy, CARD.tileY, lock);

    motes(ctx, t, 7, 240, 1000, 60);

    if (solid < 1) {
      glow(ctx, cx, cy, CH * 0.95, C.glow, 0.5 * (1 - solid) * clamp(inv(2.2, 5.5, b)));
      pts.forEach((p, i) => {
        const tx = cx + p[0] * CH;
        const ty = cy + p[1] * CH;
        const a = rnd(i, 61) * TAU;
        const t0 = 1.4 + (i % 37) * 0.23 + rnd(i, 62) * 0.6;
        const p1 = clamp(inv(t0, t0 + 2.1, b));
        if (p1 <= 0) return;
        const e = elastic(p1);
        ghost(ctx, lerp(cx + Math.cos(a) * 1500, tx, e), lerp(cy + Math.sin(a) * 1100, ty, e), 30 * clamp(p1 * 2), {
          glow: 0,
          flat: true,
          alpha: (1 - solid) * clamp(p1 * 2),
          flip: i % 2 === 0,
        });
      });
    }

    if (solid > 0 && tA < 1) {
      const f = cardFace(t);
      ghost(ctx, cx, gy, gh * (1 + (1 - easeOut(clamp(inv(11.2, 13.0, b)))) * 0.1), {
        glow: 0.8,
        alpha: solid * (1 - tA),
        blink: f.blink,
        look: f.look,
      });
    }

    titleCard(ctx, t, {
      tileY: gy,
      tileSize: gh / 0.659,
      tileAlpha: tA,
      startP: inv(15.6, 18.0, b) * 1.5,
      soonP: inv(18.0, 20.4, b) * 1.5,
      subP: ramp(20.4, 22.2, b),
    });

    if (tA > 0 && tA < 1) burst(ctx, cx, gy, tA, 620, C.lilac, 12, 7, 190);
  },
};

export const SCENES = [title, skate, shy, chase, curious, drift, finale];
