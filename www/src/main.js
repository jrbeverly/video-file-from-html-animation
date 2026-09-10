import { W, H, C, LOOP, rgb } from './paint.js';
import { render } from './show.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

window.renderAt = (seconds) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = rgb(C.void);
  ctx.fillRect(0, 0, W, H);
  render(ctx, seconds);
};

await Promise.race([
  document.fonts.load('900 100px Outfit'),
  new Promise((resolve) => setTimeout(resolve, 1200)),
]);

window.renderAt(0);
window.captureReady = true;

if (!new URLSearchParams(location.search).has('capture')) {
  const started = performance.now();
  const frame = (now) => {
    window.renderAt(((now - started) / 1000) % LOOP);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
