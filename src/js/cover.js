// ───────────────────────── 封面：用正片同一套引擎（程序化闪电 + 团块体积云 + 辉光）绘制 ─────────────────────────
// 构图：雷暴云底像天花板一样铺满画面并向地平线退去（近处团块大、远处扁小），
//       地平线处露出一条微亮的天空；主闪电从云中劈下，标题置于暗处。
// 版式由页面中的 window.COVER 配置决定（横版 cover.html / 竖版 cover_v.html 共用本文件）。
'use strict';
(async () => {
  const C = Object.assign({
    seed: 31, HZ: 900, sky: [700, 975],
    deck: { tw: 1600, th: 820, x: -150, y: -40, w: 2220, h: 1000, puffs: 3000 },
    ridgeFar: [985, 30], ridgeNear: [1050, 60],
    bolt: { x0: 1235, y0: 300, gx: 1150 }, bolt2: { x0: 1740, y0: 640, gx: 1780 },
    lights: [{ x: 1760, y: 660, r: 360, i: 0.3 }, { x: 760, y: 200, r: 460, i: 0.14 }, { x: 1560, y: 120, r: 380, i: 0.12 }, { x: 360, y: 520, r: 420, i: 0.08 }],
    airY: 620, airR: 760,
    rain: { x0: 700, y0: 380, yEnd: 990, sx: [600, 1960], sy: [300, 1000], n: 1100, fade: 900 },
    dark: [400, 760, 820], lightK: 1, rTop: 1.7, darkFirst: false,
  }, window.COVER || {});
  const q = new URLSearchParams(location.search), seed = +(q.get('seed') || C.seed);
  if (document.fonts) { try { await Promise.all([...document.fonts].map(f => f.load().catch(() => 0))); await document.fonts.ready; } catch (e) { } }
  const ctx = document.getElementById('cv').getContext('2d');
  GL.init(); Cam.set(0, 0, 1); GL.begin(); Cam.apply(ctx);
  const HZ = C.HZ; // 云底远端（地平线附近）

  // 天空：只在地平线处露出，一条微亮的冷色光带
  sky(ctx, [4, 5, 12], [62, 72, 102], C.sky[0], C.sky[1]);
  // 云底：透视——上方（近处）团块大而饱满，越往地平线越扁、越小
  const edge = (u, v) => { const e = 0.93 + (fbm(u * 3, 0.3, 3, seed + 61) - 0.5) * 0.05 + (fbm(u * 12, 0.6, 2, seed + 62) - 0.5) * 0.02; return smooth((e - v) / 0.04); };
  const D = C.deck;
  const deck = makeCloud(seed + 11, D.tw, D.th, edge, { puffs: D.puffs, rMin: 0.02, rMax: 0.16, th0: 0.4, base: 0.6,
    rScale: (u, v) => lerp(C.rTop, 0.35, Math.pow(v, 0.8)), flat: (u, v) => lerp(0.8, 0.3, v), dark: [10, 13, 24], top: [70, 82, 112] });
  const ridgeFar = makeRidge(seed + 3, C.ridgeFar[0], C.ridgeFar[1], 2.4, 3), ridgeNear = makeRidge(seed + 4, C.ridgeNear[0], C.ridgeNear[1], 3.4, 3);
  const gFar = makeGround(seed + 3, ridgeFar, { top: [30, 36, 56], mid: [16, 19, 30], bot: [10, 12, 20], rows: 5, grass: 0.7 });
  const gNear = makeGround(seed + 4, ridgeNear, { top: [17, 20, 32], mid: [7, 8, 14], bot: [2, 3, 6], rows: 7, grass: 1.2, edgeA: 0.24 });
  // 主闪电（在云的前方劈下）与远处的第二道闪电
  const gx = C.bolt.gx, B = genBolt(seed * 7 + 1, { x0: C.bolt.x0, y0: C.bolt.y0, x1: gx, y1: ridgeY(ridgeFar, gx) + 1, step: 20, branch: 0.26, maxDepth: 4, gravAng: Math.PI / 2, grav: 0.06, branchLen: [0.1, 0.4], branchAng: [0.35, 1.1], rough: 0.36 });
  const B2 = genBolt(seed * 7 + 2, { x0: C.bolt2.x0, y0: C.bolt2.y0, x1: C.bolt2.gx, y1: ridgeY(ridgeFar, C.bolt2.gx) + 1, step: 12, branch: 0.16, maxDepth: 2, gravAng: Math.PI / 2, grav: 0.06 });
  const top = B.main[0];

  // 云：闪电入云处最亮；云内几处暗闪勾出团块；远端边缘被地平线天光勾出银边
  const L = [{ x: top.x, y: top.y, r: 600, i: 0.4 }, { x: top.x - 300, y: top.y + 120, r: 420, i: 0.22 }, { x: top.x + 280, y: top.y + 160, r: 420, i: 0.24 }, ...C.lights];
  for (let x = 60; x < W; x += 160) L.push({ x, y: HZ - 10, r: 200, i: 0.12, c: [200, 215, 255] });
  L.forEach(l => l.i *= C.lightK);
  drawCloud(ctx, deck, D.x, D.y, D.w, D.h, L, { amb: 0.03 });
  // 闪电照亮的空气
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const sg = ctx.createRadialGradient(top.x - 30, C.airY, 0, top.x - 30, C.airY, C.airR); sg.addColorStop(0, 'rgba(120,150,235,0.12)'); sg.addColorStop(1, 'rgba(120,150,235,0)');
  ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H); ctx.restore();
  // 雨幕（只在雷暴下方，近闪电处被照亮）
  const RN = C.rain;
  for (let x = RN.x0; x < W + 20; x += 5) {
    const n = fbm(x / 240, 0.5, 3, seed + 90), k = smooth((n - 0.3) / 0.4) * smooth((x - RN.x0) / 300);
    if (k < 0.02) continue;
    const y0 = RN.y0 + (fbm(x / 80, 0.2, 2, seed + 91) - 0.5) * 60, lit = Math.exp(-Math.abs(x - top.x) / 320), c = mixc([40, 46, 70], [110, 126, 175], lit);
    const g = ctx.createLinearGradient(0, y0, 0, RN.yEnd); g.addColorStop(0, rgba(c, 0)); g.addColorStop(0.3, rgba(c, 0.16 * k)); g.addColorStop(1, rgba(c, 0.05 * k));
    ctx.fillStyle = g; ctx.fillRect(x, y0, 6, RN.yEnd - y0);
  }
  ctx.save(); ctx.lineCap = 'round'; const R = RNG(seed + 5);
  for (let i = 0; i < RN.n; i++) {
    const x = R.range(RN.sx[0], RN.sx[1]), y = R.range(RN.sy[0], RN.sy[1]), Ln = R.range(14, 40), z = R();
    const a = 0.11 * z * smooth((x - RN.x0) / 300) * (1 - smooth((y - RN.fade) / 100));
    ctx.strokeStyle = `rgba(170,190,235,${a})`; ctx.lineWidth = 0.8 + z * 0.8;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Ln * 0.18, y + Ln); ctx.stroke();
  }
  ctx.restore();
  // 标题区域柔和压暗（羽化，无硬边）；darkFirst 时只压暗背景、不压暗闪电
  const darken = () => { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); const [dx, dy, dr] = C.dark; const lg = ctx.createRadialGradient(dx, dy, 0, dx, dy, dr); lg.addColorStop(0, 'rgba(0,0,0,0.5)'); lg.addColorStop(0.6, 'rgba(0,0,0,0.28)'); lg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H); ctx.restore(); };
  if (C.darkFirst) darken();
  drawBolt(ctx, B2, { I: 0.6, rf: -1, bI: 0.6 }, { width: 1.6 });
  drawBolt(ctx, B, { I: 1.15, rf: -1, bI: 0.9 }, { width: 3.0 });
  // 落点的辉光
  const gp = B.main[B.main.length - 1];
  const gg = ctx.createRadialGradient(gp.x, gp.y, 0, gp.x, gp.y, 280); gg.addColorStop(0, 'rgba(190,215,255,0.35)'); gg.addColorStop(1, 'rgba(190,215,255,0)');
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gg; ctx.fillRect(gp.x - 280, gp.y - 280, 560, 560); ctx.restore();
  GL.flush(ctx, 0.85);
  // 地面：被闪电照亮的远处大地（落点有光斑与湿地倒影）+ 近处地面
  drawGround(ctx, gFar, { flash: 0.5, lights: [{ x: gp.x, y: gp.y + 8, r: 440, i: 0.5 }], refl: [{ x: gp.x, y: gp.y + 2, i: 0.6, len: 70 }] });
  drawGround(ctx, gNear, { flash: 0.3 });
  if (!C.darkFirst) darken();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  // 暗角与颗粒（与正片一致）
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.62)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  const gc = makeCanvas(256, 256), gx2 = gc.getContext('2d'), d = gx2.createImageData(256, 256), GR = RNG(901);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + GR.gauss() * 40; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  gx2.putImageData(d, 0, 0); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.06; ctx.fillStyle = ctx.createPattern(gc, 'repeat'); ctx.fillRect(0, 0, W, H);
  ctx.restore();
  window.COVER_READY = true;
})();
