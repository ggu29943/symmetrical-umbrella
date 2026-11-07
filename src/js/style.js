// ───────────────────────── 版式预设 + 全片时间表 ─────────────────────────
'use strict';
// 时间表：[名称, 时长, 与上一场景的交叠(交叉淡化)]；最后一场自动补足到 DURATION（186 秒）
const PLAN = [
  ['open', 11.5, 0], ['ch1', 2.6, 0.5], ['charge', 16.5, 0.6], ['induct', 14, 0.6], ['process', 26.5, 0.6], ['thunder', 9.6, 0.6],
  ['ch2', 2.6, 0.5], ['cg', 12.8, 0.6], ['icc', 9.8, 0.6], ['look', 12.2, 0.6], ['heatdry', 10.2, 0.6], ['volcano', 7.2, 0.6],
  ['tle', 20.8, 0.6], ['ball', 10.2, 0.6], ['ch3', 2.6, 0.5], ['dist', 7.6, 0.6], ['safe', 8.2, 0.6], ['end', 0, 0.6],
];
const TL = {};
(() => { let t = 0; PLAN.forEach(([n, d, ov], i) => { const t0 = Math.max(0, t - ov); const dur = i === PLAN.length - 1 ? DURATION - t0 : d; TL[n] = { t0, dur, fi: ov }; t = t0 + dur; }); })();

// 共享纹理（惰性生成）
const TEX = {
  _c: {},
  get(name, fn) { return this._c[name] || (this._c[name] = fn()); },
};

// 文字预设（只用中文；"尚无定论"统一琥珀色标记）
const C_TXT = '#eef4ff', C_SUB = '#c4d3ee', C_DIM = 'rgba(196,211,238,0.68)', C_AMB = '#ffc56b', C_GOLD = '#ffc46e', C_CYAN = '#7fd3ff';
const ST = {
  head: { size: 58, weight: 700, family: 'serif', inA: 'rise', outA: 'drift', stagger: 0.04, inDur: 0.85, outDur: 0.6, outStagger: 0.018, tracking: 0.06, glow: [110, 160, 255], glowK: 0.55 },
  term: { size: 62, weight: 900, family: 'serif', inA: 'flicker', outA: 'blur', stagger: 0.07, inDur: 0.75, outDur: 0.6, outStagger: 0.03, tracking: 0.12, glow: [120, 180, 255], glowK: 0.9 },
  sub: { size: 32, weight: 400, family: 'sans', color: C_SUB, inA: 'rise', outA: 'drift', stagger: 0.022, inDur: 0.7, outDur: 0.5, outStagger: 0.012, tracking: 0.06 },
  label: { size: 28, weight: 500, family: 'sans', color: C_TXT, inA: 'rise', outA: 'drift', stagger: 0.03, inDur: 0.6, outDur: 0.45, outStagger: 0.015, tracking: 0.08, glow: [90, 140, 230], glowK: 0.45 },
  note: { size: 22, weight: 300, family: 'sans', color: C_DIM, inA: 'fade', outA: 'drift', stagger: 0.012, inDur: 0.6, outDur: 0.45, outStagger: 0.006, tracking: 0.08 },
  num: { kind: 'count', size: 64, weight: 300, family: 'mono', inA: 'rise', inDur: 0.6, outDur: 0.5, tracking: 0 },
};
const mk = (preset, o) => T(Object.assign({}, ST[preset], o));
// 闪电类型名统一为"中文 + 英文"（如「绿色幽灵 GHOST」）：英文部分小一号、细一些、字距放宽，颜色取该类型辉光色的浅色
function biName(o) {
  const chars = Array.from(o.text).filter(c => c !== '\n'), k = chars.findIndex((c, i) => c === ' ' && /[A-Za-z]/.test(chars[i + 1] || ''));
  if (k < 0) return o;
  const en = chars.slice(k + 1).join(''), g = o.glow || ST.term.glow;
  const col = o.enColor || `rgb(${mixc(g, [255, 255, 255], 0.5).map(v => v | 0).join(',')})`;
  // 英文整词作为一个整体（mergeFrom）：字距由字体正常处理，入场时整词平稳淡入（不逐字母闪烁），退场时与中文同时模糊离开
  return Object.assign({}, o, {
    hl: [...(o.hl || []), [en, col]], mergeFrom: k + 1, altIn: 'fade', altOut: 'blur',
    kmap: (i, k0) => i <= k ? k0 : k + 2,             // 入场：中文点亮后，英文随即淡入
    kmapOut: (i, k0) => i < k ? k0 : k - 1,           // 退场：英文与最后一个汉字同时离开
    charCss: (ch, i) => i < k ? '' : i === k ? 'font-size:0.5em;margin-left:0.55em' : `font-size:0.5em;font-family:${FONT.sans};font-weight:500;letter-spacing:0.14em`,
  });
}
// "尚无定论"标记：琥珀色细框 + 文字
function UNK(at, out, x, y, text = '尚无定论', o = {}) {
  const size = o.size || 30;
  const t = T(Object.assign({}, ST.label, { text, at: at + 0.15, out, x: x + size * 0.6, y, ay: 0.5, size, weight: 700, color: C_AMB, glow: [255, 170, 60], glowK: 0.5, tracking: 0.2, inA: 'flicker', outA: 'drift' }, o.t || {}));
  const w = Array.from(text).length * size * 1.2 + size * 1.0, h = size * 1.75;
  T({ kind: 'box', at, out: out + 0.05, x, y, ay: 0.5, w, h, inDur: 0.55, outDur: 0.5, bg: 'rgba(255,180,70,0.07)', border: '1.5px solid rgba(255,197,107,0.85)', radius: 3, shadow: '0 0 24px rgba(255,170,60,0.18)' });
  return t;
}
// 数据卡
function CARD(at, out, x, y, w, h, title, value, o = {}) {
  T({ kind: 'box', at, out: out + 0.1, x, y, w, h, inDur: 0.6, outDur: 0.55 });
  T({ kind: 'line', at: at + 0.05, out: out + 0.05, x1: x, y1: y, x2: x, y2: y + h, color: 'rgba(140,200,255,0.95)', width: 3, inDur: 0.5, outDur: 0.4 });
  mk('label', { text: title, at: at + 0.2, out, x: x + 26, y: y + 18, size: 22, weight: 400, color: C_DIM, tracking: 0.14 });
  if (typeof value === 'string') mk('label', { text: value, at: at + 0.32, out, x: x + 26, y: y + 50, size: o.vsize || 40, weight: 700, family: o.vfam || 'sans', color: C_TXT, tracking: 0.04 });
  else T(Object.assign({}, ST.num, { at: at + 0.3, out, x: x + 26, y: y + 48, size: o.vsize || 42, weight: 500, family: 'mono', count: value, glow: [120, 180, 255], glowK: 0.4 }));
  if (o.foot) mk('note', { text: o.foot, at: at + 0.55, out, x: x + 26, y: y + h - 38, size: 20 });
}
// 摄像机辅助：同时设置主画布与辉光层
function camera(ctx, x, y, s) { Cam.set(x, y, s); Cam.apply(ctx); Cam.apply(GL.x4, 0.25); }
// 画布内的小号说明文字（刻度等）
function ctext(ctx, s, x, y, o = {}) {
  ctx.save(); ctx.font = `${o.weight || 400} ${o.size || 18}px ${o.family || FONT.mono}`; ctx.fillStyle = o.color || 'rgba(190,210,240,0.7)';
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'middle'; ctx.globalAlpha = o.a === undefined ? 1 : o.a; ctx.fillText(s, x, y); ctx.restore();
}
// 章节卡
function chapter(key, num, title, toc, seedOff) {
  const D = TL[key];
  scene({
    name: key, t0: D.t0, dur: D.dur, fi: D.fi,
    setup(S) {
      S.b = genBolt(SEED * 31 + seedOff, { x0: 480, y0: 540, angle: 0, length: 1000, step: 16, wander: 0.3, pull: 0.3, branch: 0.12, maxDepth: 2, rough: 0.25, branchLen: [0.03, 0.09] });
      S.f = flashOf(S.b, { t0: 0.45, lead: 0.3, stepped: false, strokes: [0, 0.08], peaks: [0.9, 0.6], tau: 0.07, bI: 0.5 });
      hit(D.t0 + S.f.tc, 0.45, 'soft');
      const a = D.t0 + 0.35, o = D.t0 + D.dur - 1.05;
      T({ kind: 'count', at: a, out: o, x: 400, y: 540, ax: 1, ay: 0.5, size: 150, weight: 200, family: 'mono', count: { from: 0, to: num, dur: 0.6, fmt: v => String(Math.round(v)).padStart(2, '0') }, glow: [120, 180, 255], glowK: 0.6, inDur: 0.6, outDur: 0.5 });
      T({ kind: 'line', at: a + 0.1, out: o + 0.05, x1: 470, y1: 470, x2: 470, y2: 610, color: 'rgba(160,210,255,0.9)', width: 2, inDur: 0.45, outDur: 0.4 });
      mk('term', { text: title, at: a + 0.2, out: o, x: 530, y: 515, ay: 0.5, size: 82, inA: 'rise', stagger: 0.05, outA: 'drift', tracking: 0.1 });
      mk('note', { text: toc, at: a + 0.5, out: o, x: 534, y: 590, ay: 0.5, size: 24, tracking: 0.3, color: 'rgba(170,200,240,0.75)' });
    },
    draw(ctx, lt, t, S) {
      sky(ctx, [4, 6, 14], [10, 14, 28]);
      const cl = deckTex();
      const L = S.f.light(lt);
      drawCloud(ctx, cl, -200 - lt * 30, -60, 2400, 700, [{ x: 960, y: 520, r: 900, i: L * 0.7 }], { alpha: 0.55, amb: 0.03 });
      // 地平线辉光
      const g = ctx.createLinearGradient(0, 540, 0, 545); ctx.fillStyle = 'rgba(80,140,255,0.05)'; ctx.fillRect(0, 539, W, 2);
      drawBolt(ctx, S.b, S.f.state(lt), { width: 1.6 });
    },
  });
}
