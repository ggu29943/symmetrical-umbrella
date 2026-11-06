// ───────────────────────── B 站封面：云层之上的"另一种闪电" ─────────────────────────
// 与正片"高空瞬态发光事件"一场同一套引擎、同一套高度比例（1 公里 = 9.4 像素）：
// 下方是被内部闪电照亮的雷暴云顶，云顶之上依次是蓝色喷流、红色精灵（顶端带一点绿色幽灵）、
// 横贯整个高度的巨型喷流，最高处是淘气精灵（ELVES）的光环。
// 这是把几种现象画在同一画面里的示意图（现实中它们各自只持续毫秒级，很少同时出现）。
'use strict';
(async () => {
  const q = new URLSearchParams(location.search), seed = +(q.get('seed') || 7);
  const C = Object.assign({ OY: -100, GX: 1530, BJX: 1150, SPX: 930, ELX: 1120, SPN: 7, ELR: 760, blueJet: true, darkX: 420 }, window.COVER || {});
  if (document.fonts) { try { await Promise.all([...document.fonts].map(f => f.load().catch(() => 0))); await document.fonts.ready; } catch (e) { } }
  const ctx = document.getElementById('cv').getContext('2d');
  const yA = km => 1000 - km * 9.4, curve = x => (x - W / 2) * (x - W / 2) / 24000, R = RNG(seed * 131 + 7);
  GL.init(); Cam.set(0, C.OY, 1); GL.begin(); Cam.apply(ctx);

  // ── 天空与星空 ──
  sky(ctx, [1, 2, 8], [14, 20, 44], 0, 900);
  drawStars(ctx, makeStars(seed + 120, 520, 820), 0, 0.95);
  // 气辉（约 95 公里，淡绿色的一道弧）
  ctx.save(); ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(80,220,140,0.08)'; ctx.beginPath(); for (let x = -40; x <= W + 40; x += 40) { const y = yA(95) + curve(x); x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); ctx.restore();

  // ── 淘气精灵 ELVES：约 90 公里高处急速扩张的红橙色光环 ──
  { const cx = C.ELX, cy = yA(90) + curve(cx), rx = C.ELR, ry = rx * 0.085;
    // 柔和的"甜甜圈"：中心暗、环上最亮、向外渐隐（侧面远看是一道压扁的红色光环）
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(cx, cy); ctx.scale(1, ry / rx); ctx.filter = 'blur(5px)';
    const eg = ctx.createRadialGradient(0, 0, rx * 0.55, 0, 0, rx * 1.12);
    eg.addColorStop(0, 'rgba(255,90,60,0)'); eg.addColorStop(0.62, rgba([255, 95, 60], 0.05)); eg.addColorStop(0.8, rgba([255, 110, 70], 0.2)); eg.addColorStop(0.88, rgba([255, 120, 80], 0.11)); eg.addColorStop(1, 'rgba(255,90,60,0)');
    ctx.fillStyle = eg; ctx.fillRect(-rx * 1.15, -rx * 1.15, rx * 2.3, rx * 2.3); ctx.restore();
    const g = GL.ctx; g.save(); g.strokeStyle = rgba([255, 90, 50], 0.22); g.lineWidth = 34; g.beginPath(); g.ellipse(cx, cy, rx * 0.86, ry * 0.86, 0, 0, 7); g.stroke(); g.restore(); }

  // ── 雷暴云顶（与正片同法：团块高度场 + 内部闪光照亮） ──
  ctx.fillStyle = '#060912'; ctx.beginPath(); ctx.moveTo(-60, 2000); for (let x = -60; x <= W + 60; x += 30) ctx.lineTo(x, 892 + curve(x)); ctx.lineTo(W + 60, 2000); ctx.fill();
  const haze = ctx.createLinearGradient(0, 800, 0, 960); haze.addColorStop(0, 'rgba(50,75,135,0)'); haze.addColorStop(0.55, 'rgba(50,75,135,0.24)'); haze.addColorStop(1, 'rgba(36,48,82,0.42)');
  ctx.fillStyle = haze; ctx.fillRect(-60, 800, W + 120, 170);
  const topT = makeCloud(seed + 125, 1600, 300, (u, v) => { const e = 0.42 + (fbm(u * 3, 0.2, 3, seed + 126) - 0.5) * 0.45 + (fbm(u * 11, 0.5, 2, seed + 127) - 0.5) * 0.22; return smooth((v - e) / 0.12); }, { puffs: 1300, rMin: 0.04, rMax: 0.22, flat: () => 0.7, th0: 0.4, dark: [10, 13, 26], top: [60, 72, 104] });
  const body = makeCloud(seed + 128, 1600, 760, (u, v) => smooth((v - 0.3) / 0.1 + (fbm(u * 5, 0.4, 3, seed + 129) - 0.5) * 1.2), { puffs: 2200, rMin: 0.04, rMax: 0.22, flat: () => 0.7, th0: 0.4, base: 0.55, ao: 3.2, dark: [8, 10, 21], top: [54, 64, 96] });
  // 云内闪电：喷流和精灵的"母雷暴"在云里放电，从内部把云顶照亮
  const lights = [
    { x: C.GX, y: 905, r: 250, i: 0.5, c: [170, 185, 255] }, { x: C.BJX, y: 905, r: 210, i: 0.32, c: [150, 175, 255] },
    { x: C.SPX, y: 905, r: 300, i: 0.22 }, { x: 380, y: 910, r: 320, i: 0.16 },
  ];
  drawCloud(ctx, topT, -120, 760, 2160, 360, lights, { amb: 0.022 });
  drawCloud(ctx, body, -140, 712, 2200, 960, [], { amb: 0.012 });
  const deep = ctx.createLinearGradient(0, 870, 0, 1180); deep.addColorStop(0, 'rgba(2,3,8,0)'); deep.addColorStop(0.35, 'rgba(2,3,8,0.55)'); deep.addColorStop(1, 'rgba(2,3,8,0.9)');
  ctx.fillStyle = deep; ctx.fillRect(-160, 870, W + 320, 420);
  // 云顶的被照亮处再叠一次（只加亮），让喷流脚下的云顶透出闪光
  drawCloud(ctx, topT, -120, 760, 2160, 360, [{ x: C.GX, y: 900, r: 200, i: 0.45, c: [170, 185, 255] }, { x: C.BJX, y: 900, r: 170, i: 0.3, c: [150, 175, 255] }, { x: 420, y: 930, r: 260, i: 0.16 }], { litOnly: true });
  drawCloud(ctx, body, -140, 712, 2200, 960, [{ x: C.GX, y: 1040, r: 420, i: 0.32, c: [170, 190, 255] }, { x: 520, y: 1100, r: 480, i: 0.2 }, { x: C.SPX, y: 1060, r: 420, i: 0.16 }], { litOnly: true });

  // ── 红色精灵（水母状：上方弥散红光 + 向下的触须 + 向上的细丝），顶端带一点绿色幽灵 ──
  const sprites = [];
  const mkSprite = (cx, n, sc) => { for (let k = 0; k < n; k++) {
    const x = cx + (k - (n - 1) / 2) * R.range(40, 60) * sc + R.range(-12, 12), top = yA(R.range(80, 86)), head = yA(R.range(72, 76));
    const tend = genBolt(seed * 47 + sprites.length + cx, { x0: x, y0: head, angle: Math.PI / 2 + R.range(-0.1, 0.1), length: yA(R.range(54, 59)) - head, step: 9, wander: 0.18, pull: 0.3, branch: 0.38, maxDepth: 3, branchAng: [0.08, 0.35], branchLen: [0.2, 0.55], rough: 0.18, gravAng: Math.PI / 2, grav: 0.15 });
    const up = genBolt(seed * 47 + 90 + sprites.length + cx, { x0: x, y0: head, angle: -Math.PI / 2, length: head - top, step: 8, wander: 0.15, branch: 0.3, maxDepth: 2, branchAng: [0.05, 0.3], branchLen: [0.2, 0.5], rough: 0.15 });
    sprites.push({ x, top, head, tend, up, w: R.range(18, 30) * sc, a: R.range(0.8, 1) * sc });
  } };
  mkSprite(C.SPX, C.SPN, 1.1);
  for (const c of sprites) {
    const a = Math.min(1, c.a);
    const hg = ctx.createRadialGradient(c.x, c.head - 20, 0, c.x, c.head - 20, c.w * 3.2);
    hg.addColorStop(0, rgba([255, 80, 100], 0.3 * a)); hg.addColorStop(0.5, rgba([255, 60, 90], 0.13 * a)); hg.addColorStop(1, 'rgba(255,40,80,0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(c.x, c.head - 25, c.w * 2.2, (c.head - c.top) * 1.3, 0, 0, 7); ctx.fill(); ctx.restore();
    const g = GL.ctx; g.fillStyle = rgba([255, 50, 80], 0.26 * a); g.beginPath(); g.ellipse(c.x, c.head - 20, c.w * 1.8, (c.head - c.top) * 1.1, 0, 0, 7); g.fill();
    drawBolt(ctx, c.tend, { I: a * 0.85, rf: -1, bI: 0.9 }, { width: 1.5, core: [255, 175, 200], glow: [210, 40, 110], glowK: 1.2 });
    drawBolt(ctx, c.up, { I: a * 0.55, rf: -1, bI: 0.8 }, { width: 1.2, core: [255, 160, 170], glow: [255, 40, 70], glowK: 1.0 });
  }
  { ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const c of sprites.filter((_, i) => i % 2 === 0)) { ctx.save(); ctx.translate(c.x, c.top - 10); ctx.scale(1, 0.42); const r = c.w * 2.2;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, rgba([110, 255, 160], 0.26)); g.addColorStop(0.5, rgba([70, 230, 130], 0.09)); g.addColorStop(1, 'rgba(60,220,120,0)');
      ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2); ctx.restore(); }
    ctx.restore(); }

  // ── 蓝色喷流：从云顶向上射出的蓝色锥体，到约 40–50 公里 ──
  if (C.blueJet) { const x0 = C.BJX, y0 = 872 + curve(x0), yt = yA(45);
    const cg = ctx.createLinearGradient(0, y0, 0, yt); cg.addColorStop(0, rgba([120, 170, 255], 0.5)); cg.addColorStop(1, 'rgba(60,110,255,0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = cg; ctx.beginPath(); ctx.filter = 'blur(10px)'; ctx.moveTo(x0 - 10, y0); ctx.lineTo(x0 - 60, yt); ctx.lineTo(x0 + 60, yt); ctx.lineTo(x0 + 10, y0); ctx.fill(); ctx.restore();
    for (let k = 0; k < 5; k++) { const B = genBolt(seed * 47 + 200 + k, { x0: x0 + R.range(-5, 5), y0, angle: -Math.PI / 2 + (k - 2) * 0.05, length: y0 - yA(R.range(41, 46)), step: 10, wander: 0.12, pull: 0.3, branch: 0.18, maxDepth: 2, branchAng: [0.05, 0.2], branchLen: [0.12, 0.3], rough: 0.15 });
      drawBolt(ctx, B, { I: 0.85, rf: -1, bI: 0.8 }, { width: 1.5, core: [200, 225, 255], glow: [60, 120, 255], glowK: 1.2 }); } }

  // ── 巨型喷流：与正片同一个生成器（一整棵连续生长的树，颜色随高度由蓝白过渡到红） ──
  { const J = genJet(seed * 47 + 777, C.GX, 882 + curve(C.GX)), GX = C.GX, yF = yA(91);
    const fan = (c2, k, wk) => {
      const yS = yA(90), gr = c2.createLinearGradient(0, J.y0, 0, yS);
      for (let i = 0; i <= 12; i++) {
        const f = i / 12, y = lerp(J.y0, yS, f), km = (1000 - y) / 9.4;
        const foot = 0.45 + 0.55 * smooth((km - 12.5) / 4), crown = 1 - 0.85 * smooth((km - 66) / 20), lobe = 1 + 0.6 * Math.exp(-Math.pow((km - 47) / 11, 2));
        gr.addColorStop(f, rgba(J.glowAt(km), k * foot * crown * lobe));
      }
      c2.fillStyle = gr; c2.beginPath();
      for (let i = 0; i <= 40; i++) { const y = lerp(J.y0, yS, i / 40); c2.lineTo(GX - J.halfW((1000 - y) / 9.4, -1) * wk, y); }
      for (let i = 40; i >= 0; i--) { const y = lerp(J.y0, yS, i / 40); c2.lineTo(GX + J.halfW((1000 - y) / 9.4, 1) * wk, y); }
      c2.closePath(); c2.fill();
    };
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.filter = 'blur(28px)'; fan(ctx, 0.16, 0.6); ctx.filter = 'blur(12px)'; fan(ctx, 0.1, 0.25); ctx.restore();
    GL.ctx.save(); GL.ctx.filter = 'blur(6px)'; fan(GL.ctx, 0.3, 0.75); GL.ctx.restore();
    const sty = { bands: J.NB, bandOf: J.bandOf, bandCol: J.bandCol };
    drawBolt(ctx, J.B, { I: 1.0, rf: -1, bI: 0.9 }, Object.assign({ width: 2.6, glowK: 1.2 }, sty));
    drawBolt(ctx, J.B, { I: 0.5, rf: -1, onlyMain: true }, Object.assign({ width: 5.5, glowK: 0.95 }, sty)); }

  GL.flush(ctx, 0.95);
  // ── 标题区柔和压暗、暗角与颗粒（与正片一致） ──
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const lg = ctx.createRadialGradient(C.darkX, 470, 0, C.darkX, 470, 760); lg.addColorStop(0, 'rgba(0,0,0,0.42)'); lg.addColorStop(0.6, 'rgba(0,0,0,0.22)'); lg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.38, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  const gc = makeCanvas(256, 256), gx2 = gc.getContext('2d'), d = gx2.createImageData(256, 256), GR = RNG(901);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + GR.gauss() * 40; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  gx2.putImageData(d, 0, 0); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.05; ctx.fillStyle = ctx.createPattern(gc, 'repeat'); ctx.fillRect(0, 0, W, H);
  ctx.restore();
  window.COVER_READY = true;
})();
