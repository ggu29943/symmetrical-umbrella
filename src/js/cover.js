// ───────────────────────── 封面：用正片同一套引擎（程序化闪电 + 团块体积云 + 辉光）绘制 ─────────────────────────
// 构图：雷暴云底像天花板一样铺满画面并向地平线退去（近处团块大、远处扁小），
//       地平线处露出一条微亮的天空；主闪电从云中劈下，标题置于左侧暗处。
'use strict';
(async () => {
  const q = new URLSearchParams(location.search), seed = +(q.get('seed') || 31);
  if (document.fonts) { try { await Promise.all([...document.fonts].map(f => f.load().catch(() => 0))); await document.fonts.ready; } catch (e) { } }
  const ctx = document.getElementById('cv').getContext('2d');
  GL.init(); Cam.set(0, 0, 1); GL.begin(); Cam.apply(ctx);
  const HZ = 900; // 云底远端（地平线附近）

  // 天空：只在地平线处露出，一条微亮的冷色光带
  sky(ctx, [4, 5, 12], [62, 72, 102], 700, 975);
  // 云底：透视——上方（近处）团块大而饱满，越往地平线越扁、越小
  const edge = (u, v) => { const e = 0.93 + (fbm(u * 3, 0.3, 3, seed + 61) - 0.5) * 0.05 + (fbm(u * 12, 0.6, 2, seed + 62) - 0.5) * 0.02; return smooth((e - v) / 0.04); };
  const deck = makeCloud(seed + 11, 1600, 820, edge, { puffs: 3000, rMin: 0.02, rMax: 0.16, th0: 0.4, base: 0.6,
    rScale: (u, v) => lerp(1.7, 0.35, Math.pow(v, 0.8)), flat: (u, v) => lerp(0.8, 0.3, v), dark: [10, 13, 24], top: [70, 82, 112] });
  const ridgeFar = makeRidge(seed + 3, 985, 30, 2.4, 3), ridgeNear = makeRidge(seed + 4, 1050, 60, 3.4, 3);
  // 主闪电（在云的前方劈下）与远处的第二道闪电
  const gx = 1150, B = genBolt(seed * 7 + 1, { x0: 1235, y0: 300, x1: gx, y1: ridgeY(ridgeFar, gx) + 1, step: 20, branch: 0.26, maxDepth: 4, gravAng: Math.PI / 2, grav: 0.06, branchLen: [0.1, 0.4], branchAng: [0.35, 1.1], rough: 0.36 });
  const B2 = genBolt(seed * 7 + 2, { x0: 1740, y0: 640, x1: 1780, y1: ridgeY(ridgeFar, 1780) + 1, step: 12, branch: 0.16, maxDepth: 2, gravAng: Math.PI / 2, grav: 0.06 });
  const top = B.main[0];

  // 云：闪电入云处最亮；云内几处暗闪勾出团块；远端边缘被地平线天光勾出银边
  const L = [{ x: top.x, y: top.y, r: 600, i: 0.4 }, { x: top.x - 300, y: top.y + 120, r: 420, i: 0.22 }, { x: top.x + 280, y: top.y + 160, r: 420, i: 0.24 },
    { x: 1760, y: 660, r: 360, i: 0.3 }, { x: 760, y: 200, r: 460, i: 0.14 }, { x: 1560, y: 120, r: 380, i: 0.12 }, { x: 360, y: 520, r: 420, i: 0.08 }];
  for (let x = 60; x < W; x += 160) L.push({ x, y: HZ - 10, r: 200, i: 0.12, c: [200, 215, 255] });
  drawCloud(ctx, deck, -150, -40, 2220, 1000, L, { amb: 0.03 });
  // 闪电照亮的空气
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const sg = ctx.createRadialGradient(top.x - 30, 620, 0, top.x - 30, 620, 760); sg.addColorStop(0, 'rgba(120,150,235,0.12)'); sg.addColorStop(1, 'rgba(120,150,235,0)');
  ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H); ctx.restore();
  // 雨幕（只在雷暴下方，近闪电处被照亮）
  for (let x = 700; x < W + 20; x += 5) {
    const n = fbm(x / 240, 0.5, 3, seed + 90), k = smooth((n - 0.3) / 0.4) * smooth((x - 700) / 300);
    if (k < 0.02) continue;
    const y0 = 380 + (fbm(x / 80, 0.2, 2, seed + 91) - 0.5) * 60, lit = Math.exp(-Math.abs(x - top.x) / 320), c = mixc([40, 46, 70], [110, 126, 175], lit);
    const g = ctx.createLinearGradient(0, y0, 0, 990); g.addColorStop(0, rgba(c, 0)); g.addColorStop(0.3, rgba(c, 0.16 * k)); g.addColorStop(1, rgba(c, 0.05 * k));
    ctx.fillStyle = g; ctx.fillRect(x, y0, 6, 990 - y0);
  }
  ctx.save(); ctx.lineCap = 'round'; const R = RNG(seed + 5);
  for (let i = 0; i < 1100; i++) {
    const x = R.range(600, 1960), y = R.range(300, 1000), Ln = R.range(14, 40), z = R();
    const a = 0.11 * z * smooth((x - 700) / 300) * (1 - smooth((y - 900) / 100));
    ctx.strokeStyle = `rgba(170,190,235,${a})`; ctx.lineWidth = 0.8 + z * 0.8;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Ln * 0.18, y + Ln); ctx.stroke();
  }
  ctx.restore();
  drawBolt(ctx, B2, { I: 0.6, rf: -1, bI: 0.6 }, { width: 1.6 });
  drawBolt(ctx, B, { I: 1.15, rf: -1, bI: 0.9 }, { width: 3.0 });
  // 入云处与落点的辉光
  const gp = B.main[B.main.length - 1];
  const gg = ctx.createRadialGradient(gp.x, gp.y, 0, gp.x, gp.y, 280); gg.addColorStop(0, 'rgba(190,215,255,0.35)'); gg.addColorStop(1, 'rgba(190,215,255,0)');
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gg; ctx.fillRect(gp.x - 280, gp.y - 280, 560, 560); ctx.restore();
  GL.flush(ctx, 0.85);
  // 地形剪影（落点附近的山脊带一点受光）
  drawRidge(ctx, ridgeFar, '#0a0d17');
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1.4;
  for (let i = 1; i < ridgeFar.length; i++) { const p = ridgeFar[i], a = Math.exp(-Math.abs(p[0] - gp.x) / 260); ctx.strokeStyle = `rgba(150,180,240,${0.4 * a})`; ctx.beginPath(); ctx.moveTo(ridgeFar[i - 1][0], ridgeFar[i - 1][1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); }
  ctx.restore();
  drawRidge(ctx, ridgeNear, '#04050a');
  // 标题区域柔和压暗（羽化，无硬边）
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const lg = ctx.createRadialGradient(400, 760, 0, 400, 760, 820); lg.addColorStop(0, 'rgba(0,0,0,0.5)'); lg.addColorStop(0.6, 'rgba(0,0,0,0.28)'); lg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
  // 暗角与颗粒（与正片一致）
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.62)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  const gc = makeCanvas(256, 256), gx2 = gc.getContext('2d'), d = gx2.createImageData(256, 256), GR = RNG(901);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + GR.gauss() * 40; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  gx2.putImageData(d, 0, 0); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.06; ctx.fillStyle = ctx.createPattern(gc, 'repeat'); ctx.fillRect(0, 0, W, H);
  ctx.restore();
  window.COVER_READY = true;
})();
