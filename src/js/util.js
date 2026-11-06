// ───────────────────────── 基础工具：数学、随机、噪声、缓动 ─────────────────────────
'use strict';
// 画布尺寸默认 1920×1080（正片）；封面等页面可在加载前设置 window.STAGE = { w, h } 改为其他比例
const W = (typeof window !== 'undefined' && window.STAGE && window.STAGE.w) || 1920, H = (typeof window !== 'undefined' && window.STAGE && window.STAGE.h) || 1080, FPS = 60, DURATION = 186;

const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const invLerp = (a, b, x) => clamp((x - a) / (b - a));
const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const smoother = t => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const Ease = {
  outCubic: t => 1 - Math.pow(1 - clamp(t), 3),
  inCubic: t => Math.pow(clamp(t), 3),
  inOutCubic: t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
  outExpo: t => { t = clamp(t); return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); },
  inExpo: t => { t = clamp(t); return t <= 0 ? 0 : Math.pow(2, 10 * t - 10); },
  inOutExpo: t => { t = clamp(t); if (t <= 0) return 0; if (t >= 1) return 1; return t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2; },
  outQuint: t => 1 - Math.pow(1 - clamp(t), 5),
  inQuad: t => clamp(t) * clamp(t),
  outBack: t => { t = clamp(t); const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inOutSine: t => -(Math.cos(Math.PI * clamp(t)) - 1) / 2,
};
// 包络：在 [a,b] 内为 1，前后各有 fi / fo 秒的平滑过渡
function env(t, a, b, fi = 0.5, fo = 0.5) {
  if (t < a - fi || t > b + fo) return 0;
  if (t < a) return smooth((t - (a - fi)) / fi);
  if (t > b) return 1 - smooth((t - b) / fo);
  return 1;
}
// 指数衰减脉冲：t0 起亮，tau 衰减
const pulse = (t, t0, tau, rise = 0.004) => t < t0 ? 0 : (t - t0 < rise ? (t - t0) / rise : Math.exp(-(t - t0 - rise) / tau));

// ── 可设种子的随机数（mulberry32） ──
function RNG(seed) {
  let s = (seed >>> 0) || 1;
  const f = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.range = (a, b) => a + (b - a) * f();
  f.int = (a, b) => Math.floor(a + (b - a + 1) * f());
  f.pick = arr => arr[Math.floor(f() * arr.length)];
  f.gauss = () => { let u = 0, v = 0; while (u === 0) u = f(); while (v === 0) v = f(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  f.sign = () => f() < .5 ? -1 : 1;
  return f;
}
// 整数哈希 → [0,1)
function hash2(x, y, s = 0) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const hash1 = (x, s = 0) => hash2(x, 0x5bd1e995, s);
// 二维值噪声与分形噪声
function vnoise(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, oct = 5, s = 0, lac = 2.03, gain = 0.5) {
  let sum = 0, amp = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) { sum += amp * vnoise(x * f, y * f, s + i * 17); norm += amp; amp *= gain; f *= lac; }
  return sum / norm;
}
// 一维平滑噪声（用于闪烁、漂移）
function noise1(x, s = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash1(i, s), hash1(i + 1, s), u); }
// 时间离散化的确定性"随机闪烁"
const flicker = (t, rate, s = 0) => hash1(Math.floor(t * rate), s);

// 颜色
function rgba(c, a = 1) { return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const COL = {
  bg: [5, 7, 13], core: [240, 248, 255], ice: [207, 232, 255], blue: [111, 182, 255], deep: [58, 92, 255],
  violet: [150, 130, 255], plus: [255, 190, 90], minus: [90, 200, 255], red: [255, 60, 78], magenta: [200, 40, 120],
  lava: [255, 110, 30], ember: [255, 80, 20], green: [90, 255, 160],
};

function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
