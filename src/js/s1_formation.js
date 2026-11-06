// ───────────────────────── 开场 + 第一部分：闪电是怎么产生的 ─────────────────────────
'use strict';

// 雷暴云层（顶部铺满）
// 云层（从下方仰视）：顶部铺满，底部边缘起伏；团块在边缘附近更扁更大
const edgeShape = (lo, amp1, amp2, s) => (u, v) => { const e = lo + (fbm(u * 2.2, 0.3, 3, s) - 0.5) * amp1 + (fbm(u * 7, 0.6, 3, s + 1) - 0.5) * amp2; return smooth((e - v) / 0.12); };
const deckTex = () => TEX.get('deck', () => makeCloud(SEED + 11, 1440, 560, edgeShape(0.7, 0.3, 0.14, SEED + 61), { puffs: 1500, rMin: 0.02, rMax: 0.2, flat: (u, v) => 0.6, th0: 0.4 }));
const baseTex = () => TEX.get('base', () => makeCloud(SEED + 12, 1440, 320, edgeShape(0.78, 0.22, 0.16, SEED + 62), { puffs: 1300, rMin: 0.025, rMax: 0.2, flat: () => 0.55, th0: 0.4, dark: [8, 10, 18], top: [48, 56, 80] }));
const cbTex = () => TEX.get('cb', () => makeCloud(SEED + 13, 900, 780, cbShape, { puffs: 1100, rMin: 0.015, rMax: 0.1, flat: (u, v) => v < 0.32 ? 0.4 : 0.95, th0: 0.45, base: 0.7, dark: [12, 17, 34], top: [72, 88, 126] }));

// ════════ 0 · 冷开场 ════════
scene({
  name: 'open', t0: TL.open.t0, dur: TL.open.dur, fi: 1.4,
  setup(S, sc) {
    S.far = makeRidge(SEED + 3, 900, 70, 2.2); S.near = makeRidge(SEED + 4, 1000, 110, 3.5);
    S.gFar = makeGround(SEED + 3, S.far, { top: [30, 36, 56], mid: [17, 20, 32], bot: [12, 14, 24], rows: 6, tex: 0.22, grass: 0.7, edgeA: 0.35 });
    S.gNear = makeGround(SEED + 4, S.near, { top: [18, 21, 34], mid: [8, 10, 16], bot: [2, 3, 6], rows: 9, tex: 0.32, grass: 1.3, edgeA: 0.22 });
    S.rain = makeRain(SEED + 5, 1100, { alpha: 0.2 });
    const gx = 905, gy = ridgeY(S.far, 905) + 1;
    S.bolt = genBolt(SEED * 7 + 1, { x0: 1060, y0: 300, x1: gx, y1: gy, step: 24, branch: 0.14, gravAng: Math.PI / 2, grav: 0.05, maxDepth: 3, branchLen: [0.12, 0.4] });
    S.fl = flashOf(S.bolt, { t0: 2.5, lead: 0.55, steps: 30, strokes: [0, 0.075, 0.16, 0.27], peaks: [1.8, 1.3, 1.1, 0.9], leadLvl: 0.4 });
    hit(sc.t0 + S.fl.tc, 1.0, 'strike');
    S.tb = genBolt(SEED * 7 + 2, { x0: 640, y0: 470, angle: 0.02, length: 650, step: 16, wander: 0.42, pull: 0.3, branch: 0.2, maxDepth: 2, rough: 0.28, branchLen: [0.04, 0.12] });
    S.tf = flashOf(S.tb, { t0: 7.6, lead: 0.2, stepped: false, strokes: [0, 0.1], peaks: [1.1, 0.7], tau: 0.06, bI: 0.6 });
    hit(sc.t0 + S.tf.tc, 0.5, 'soft');
    S.ic = [[0.85, 520, 230, 0.55], [1.55, 1450, 200, 0.4], [1.68, 1380, 260, 0.5], [5.6, 300, 180, 0.3]];
    S.ic.forEach(c => hit(sc.t0 + c[0], c[3] * 0.4, 'soft'));
    // 文字
    const o = sc.t0;
    mk('head', { text: '天上，为什么会放电？', at: o + 4.15, out: o + 6.7, x: 140, y: 560, ay: 0.5, size: 70, weight: 900, inA: 'flicker', inDur: 0.8, stagger: 0.07, outA: 'drift', persp: { p: 1400, ry: 16 } });
    T({ text: '闪电', at: o + 7.75, out: o + 10.5, x: 960, y: 455, ax: 0.5, ay: 0.5, size: 230, weight: 900, family: 'serif', tracking: 0.32, inA: 'focus', inDur: 1.2, stagger: 0.2, order: 'center', outA: 'blur', outDur: 0.8, outStagger: 0.08, glow: [120, 180, 255], glowK: 1.1 });
    T({ kind: 'line', at: o + 8.15, out: o + 10.35, x1: 760, y1: 618, x2: 1160, y2: 618, color: 'rgba(160,205,255,0.8)', width: 1.5, inDur: 0.9, outDur: 0.5 });
    mk('sub', { text: '天空放电的科学', at: o + 8.4, out: o + 10.45, x: 960, y: 672, ax: 0.5, ay: 0.5, size: 30, weight: 300, tracking: 0.8, inA: 'spread', inDur: 1.0, stagger: 0.02 });
  },
  draw(ctx, lt, t, S) {
    const L = S.fl.light(lt);
    const sh = pulse(lt, S.fl.tc, 0.18) * 7;
    camera(ctx, (noise1(lt * 30, 1) - 0.5) * sh, (noise1(lt * 30, 2) - 0.5) * sh, 1.0 + lt * 0.0045);
    sky(ctx, [6, 8, 16], [16, 20, 36]);
    let ic = 0; const lights = [{ x: 1000, y: 380, r: 1000, i: L * 0.42 }];
    for (const [tt, x, y, k] of S.ic) { const v = pulse(lt, tt, 0.07) + pulse(lt, tt + 0.09, 0.05) * 0.6; ic += v * k; lights.push({ x, y, r: 520, i: v * k }); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba([90, 120, 200], clamp(L * 0.16 + ic * 0.05)); ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore();
    drawCloud(ctx, deckTex(), -120, -80, 2160, 760, lights, { amb: 0.04 + L * 0.12 });
    drawBolt(ctx, S.bolt, S.fl.state(lt), { width: 3.2 });
    GL.flush(ctx);
    const gy0 = ridgeY(S.far, 905);
    drawGround(ctx, S.gFar, { flash: L * 0.7, lights: [{ x: 905, y: gy0 + 8, r: 340, i: L * 0.55 }], refl: [{ x: 905, y: gy0 + 2, i: L * 0.7, len: 110 }] });
    drawGround(ctx, S.gNear, { flash: L * 0.45 });
    drawRain(ctx, S.rain, t, clamp(L * 0.6), 1);
    // 片名段落：压暗背景
    const dk = env(lt, 7.6, 20, 0.9, 0) * 0.55;
    if (dk > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(0,0,0,${dk})`; ctx.fillRect(0, 0, W, H); ctx.restore(); Cam.apply(ctx); }
    drawBolt(ctx, S.tb, S.tf.state(lt), { width: 1.5 });
    // 曝光
    if (L > 0.05) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(200,220,255,${clamp(L * 0.13)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  },
});

// ════════ 章节一 ════════
chapter('ch1', 1, '闪电从何而来', '起电 · 击穿 · 先导 · 回击 · 雷声', 101);
section('intro', 0, TL.ch1.t0 + TL.ch1.dur, 'dark');

// ════════ 1 · 雷暴云起电 ════════
{
  const D = TL.charge, X0 = 700, Y0 = 60, CW = 1000, CH = 870;
  const yk = km => 945 - km * 55;
  const IC = { x: 380, y: 650, r: 200 }; // 显微放大窗
  scene({
    name: 'charge', t0: D.t0, dur: D.dur, fi: D.fi,
    setup(S, sc) {
      const R = RNG(SEED * 13 + 3);
      // 碰撞对：冰晶上升、霰粒下落，在 tc 时刻相撞并交换电荷
      S.pairs = [];
      S.pairs.push({ px: IC.x - 30, py: IC.y + 20, tc: 4.0, vc: 26, vg: 22, rot: 0.3 });
      for (let k = 0; k < 14; k++) S.pairs.push({ px: IC.x + R.range(-140, 140), py: IC.y + R.range(-120, 120), tc: 4.9 + k * 0.62 + R.range(-0.2, 0.2), vc: R.range(40, 60), vg: R.range(30, 45), rot: R() * 6 });
      S.drops = []; for (let k = 0; k < 70; k++) S.drops.push({ x: R.range(-1, 1), y: R.range(-1, 1), v: R.range(5, 18), r: R.range(1, 2.4) });
      // 云中电荷
      S.plus = []; S.minus = []; S.low = [];
      for (let k = 0; k < 34; k++) S.plus.push({ x0: R.range(1000, 1330), y0: R.range(yk(7.6), yk(6.2)), x1: R.range(830, 1620), y1: R.range(yk(12.4), yk(10.4)), d: R.range(0, 1.8), ph: R() * 9 });
      for (let k = 0; k < 34; k++) S.minus.push({ x: R.range(960, 1420), y: R.range(yk(7.4), yk(6.0)), d: R.range(0, 3), ph: R() * 9 });
      for (let k = 0; k < 7; k++) S.low.push({ x: R.range(1080, 1300), y: R.range(yk(2.6), yk(2.0)), ph: R() * 9 });
      S.flick = [[2.2, 1130, 520], [6.8, 1260, 420], [11.4, 1040, 600], [13.6, 1350, 380]];
      S.flick.forEach(f => hit(sc.t0 + f[0], 0.18, 'soft'));
      const o = sc.t0, cr = p => S.pos(S.pairs[0], o + 0, p);
      // 文字
      mk('head', { text: '答案，藏在雷暴云里', at: o + 0.7, out: o + 4.5, x: 110, y: 130, ay: 0.5 });
      mk('label', { text: '冰晶', at: o + 2.5, out: o + 7.3, follow: tt => S.pos(S.pairs[0], tt - o, 'c'), dx: -96, dy: -30, ax: 1, ay: 0.5, size: 30, weight: 700, lead: { from: tt => S.pos(S.pairs[0], tt - o, 'c'), ox: 10, delay: 0.1 } });
      mk('label', { text: '霰粒', at: o + 2.8, out: o + 7.3, follow: tt => S.pos(S.pairs[0], tt - o, 'g'), dx: 100, dy: -36, ax: 0, ay: 0.5, size: 30, weight: 700, lead: { from: tt => S.pos(S.pairs[0], tt - o, 'g'), ox: -10, delay: 0.1 } });
      mk('note', { text: '（一种松软的小冰球）', at: o + 3.3, out: o + 7.3, follow: tt => S.pos(S.pairs[0], tt - o, 'g'), dx: 100, dy: 2, ax: 0, ay: 0.5, size: 20 });
      mk('sub', { text: '碰撞之中，电荷发生转移', at: o + 4.7, out: o + 9.9, x: IC.x, y: IC.y + IC.r + 56, ax: 0.5, ay: 0.5, size: 32, color: C_TXT });
      mk('sub', { text: '冰晶带正电，被上升气流送到云顶', at: o + 8.9, out: o + 14.2, x: 1200, y: 100, ax: 0.5, ay: 0.5, size: 32, color: C_TXT, hl: [['正电', C_GOLD]] });
      mk('sub', { text: '霰粒带负电\n聚在云的中下部', at: o + 9.9, out: o + 14.6, x: 1535, y: 575, ax: 0, ay: 0.5, size: 32, color: C_TXT, lh: 1.5, hl: [['负电', C_CYAN]] });
      mk('note', { text: '主流解释：非感应起电理论 · 微观细节仍在研究', at: o + 11.4, out: o + 15.0, x: 1850, y: 1030, ax: 1, ay: 1, hl: [['仍在研究', C_AMB]] });
    },
    // 碰撞对中粒子的位置：k = 'c' 冰晶 / 'g' 霰粒
    pos: null,
    draw(ctx, lt, t, S) {
      camera(ctx, 0, 0, 1.0 + lt * 0.002);
      sky(ctx, [4, 7, 16], [12, 16, 30]);
      // 地面
      ctx.fillStyle = 'rgba(14,18,30,1)'; ctx.fillRect(-200, yk(0), W + 400, 300);
      ctx.fillStyle = 'rgba(120,160,230,0.25)'; ctx.fillRect(-200, yk(0), W + 400, 1.5);
      const fl = S.flick.reduce((a, [tt]) => a + pulse(lt, tt, 0.08) * 0.5, 0);
      const lights = S.flick.map(([tt, x, y]) => ({ x, y, r: 420, i: pulse(lt, tt, 0.08) * 0.55 }));
      lights.push({ x: 1160, y: 560, r: 700, i: 0.16 + 0.03 * Math.sin(lt * 1.7) });
      drawCloud(ctx, cbTex(), X0, Y0, CW, CH, lights, { amb: 0.07 });
      const a1 = smooth((lt - 0.4) / 1.2);
      // 高度标尺
      ctx.save(); ctx.globalAlpha = a1; ctx.strokeStyle = 'rgba(160,190,240,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(660, yk(0)); ctx.lineTo(660, yk(15)); ctx.stroke();
      for (let k = 0; k <= 15; k += 3) { ctx.beginPath(); ctx.moveTo(652, yk(k)); ctx.lineTo(668, yk(k)); ctx.stroke(); ctext(ctx, k + ' 公里', 640, yk(k), { align: 'right', size: 17, family: FONT.sans }); }
      ctx.restore();
      // 等温线
      const iso = [[4.5, '0 ℃'], [6, '−10 ℃'], [7.5, '−20 ℃'], [10, '−40 ℃']];
      ctx.save(); ctx.setLineDash([6, 10]); ctx.lineDashOffset = -lt * 8;
      iso.forEach(([km, s], i) => { const a = smooth((lt - 0.8 - i * 0.25) / 1.0) * 0.55, la = a * (1 - smooth((lt - 8.6) / 0.8)); ctx.strokeStyle = `rgba(150,190,255,${a * 0.6})`; ctx.beginPath(); ctx.moveTo(690, yk(km)); ctx.lineTo(1700, yk(km)); ctx.stroke(); ctext(ctx, s, 1712, yk(km), { a: la, size: 17 }); });
      ctx.restore();
      // 主负电荷区色带
      const mb = smooth((lt - 8.6) / 1.5) * (1 - smooth((lt - 15) / 1));
      if (mb > 0) { const g = ctx.createLinearGradient(0, yk(7.5), 0, yk(6)); g.addColorStop(0, 'rgba(60,170,255,0)'); g.addColorStop(0.5, `rgba(60,170,255,${0.10 * mb})`); g.addColorStop(1, 'rgba(60,170,255,0)'); ctx.fillStyle = g; ctx.fillRect(900, yk(7.5), 600, yk(6) - yk(7.5)); }
      // 上升气流流线
      ctx.save(); ctx.lineCap = 'round';
      for (let k = 0; k < 46; k++) {
        const s = (lt * 0.11 + k * 0.1379) % 1, side = k % 2 ? 1 : -1;
        const path = q => { const x = 1170 + ((k % 9) - 4) * 20 + (q > 0.74 ? Math.pow((q - 0.74) / 0.26, 1.6) * side * 330 : 0); return [x, yk(1.4) - q * (yk(1.4) - yk(12.2))]; };
        const [x1, y1] = path(Math.max(0, s - 0.035)), [x2, y2] = path(s);
        ctx.strokeStyle = `rgba(120,190,255,${0.32 * Math.sin(Math.PI * s) * a1})`; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      ctx.restore();
      // 云中电荷
      const nCol = S.pairs.filter(p => lt > p.tc).length;
      for (const m of S.minus) { const a = smooth((lt - 6.5 - m.d) / 1.2) * (1 - smooth((lt - 16) / 0.5)); if (a > 0) chargeSign(ctx, m.x + Math.sin(lt + m.ph) * 4, m.y + Math.cos(lt * 0.8 + m.ph) * 3, 13, false, a * 0.95); }
      for (const p of S.plus) {
        const a = smooth((lt - 6.0 - p.d * 0.5) / 1.0) * (1 - smooth((lt - 16) / 0.5)); if (a <= 0) continue;
        const q = smoother((lt - 8.4 - p.d) / 3.6);
        const x = lerp(p.x0, p.x1, q) + Math.sin(q * Math.PI) * 60 * Math.sin(p.ph), y = lerp(p.y0, p.y1, q);
        chargeSign(ctx, x + Math.sin(lt * 1.3 + p.ph) * 3, y, 13, true, a);
      }
      for (const p of S.low) { const a = smooth((lt - 11) / 1.5) * 0.45 * (1 - smooth((lt - 16) / 0.5)); if (a > 0) chargeSign(ctx, p.x + Math.sin(lt + p.ph) * 3, p.y, 10, true, a); }
      // 放大窗与引线
      const ia = smooth((lt - 1.2) / 0.9) * (1 - smooth((lt - 15.2) / 0.8));
      if (ia > 0) {
        const ax = 1120, ay = yk(6.6);
        ctx.save(); ctx.globalAlpha = ia;
        ctx.strokeStyle = 'rgba(150,200,255,0.35)'; ctx.lineWidth = 1;
        const ang = Math.atan2(ay - IC.y, ax - IC.x), dd = Math.hypot(ax - IC.x, ay - IC.y), ta = Math.asin(IC.r / dd);
        ctx.beginPath(); ctx.moveTo(IC.x + Math.cos(ang - Math.PI / 2 + ta) * IC.r * -1 * 0 + Math.cos(ang + Math.PI / 2) * IC.r, IC.y + Math.sin(ang + Math.PI / 2) * IC.r); ctx.lineTo(ax, ay);
        ctx.moveTo(IC.x + Math.cos(ang - Math.PI / 2) * IC.r, IC.y + Math.sin(ang - Math.PI / 2) * IC.r); ctx.lineTo(ax, ay); ctx.stroke();
        ctx.fillStyle = 'rgba(200,225,255,0.9)'; ctx.beginPath(); ctx.arc(ax, ay, 4, 0, 7); ctx.fill();
        // 窗口内容
        const rr = IC.r * Ease.outExpo(clamp((lt - 1.2) / 0.9));
        ctx.save(); ctx.beginPath(); ctx.arc(IC.x, IC.y, rr, 0, Math.PI * 2); ctx.clip();
        const g = ctx.createRadialGradient(IC.x, IC.y, 0, IC.x, IC.y, IC.r); g.addColorStop(0, 'rgba(18,30,58,0.96)'); g.addColorStop(1, 'rgba(6,10,22,0.98)'); ctx.fillStyle = g; ctx.fillRect(IC.x - IC.r, IC.y - IC.r, IC.r * 2, IC.r * 2);
        for (const d of S.drops) { const y = IC.y + (((d.y * IC.r + lt * d.v) + IC.r) % (IC.r * 2)) - IC.r; ctx.fillStyle = 'rgba(140,190,255,0.35)'; ctx.beginPath(); ctx.arc(IC.x + d.x * IC.r, y, d.r, 0, 7); ctx.fill(); }
        for (const p of S.pairs) this.drawPair(ctx, p, lt);
        ctx.restore();
        ctx.strokeStyle = 'rgba(170,210,255,0.75)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(IC.x, IC.y, rr, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(170,210,255,0.25)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(IC.x, IC.y, rr + 6, -0.6, 0.2); ctx.stroke();
        ctx.restore();
      }
    },
    drawPair(ctx, p, lt) {
      const c = this.S.pos(p, lt, 'c'), g = this.S.pos(p, lt, 'g'), after = lt >= p.tc;
      const inC = q => Math.hypot(q[0] - IC.x, q[1] - IC.y) < IC.r - 14;
      // 霰粒：不规则的白色小冰球
      ctx.save(); ctx.translate(g[0], g[1]); ctx.rotate(p.rot + lt * 0.3);
      ctx.fillStyle = 'rgba(205,215,235,0.92)'; ctx.beginPath();
      for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI * 2, r = 17 * (0.86 + 0.14 * hash2(i % 16, p.rot * 100 | 0, 2)); i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.fill();
      ctx.fillStyle = 'rgba(150,165,195,0.55)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc((hash2(i, 3, p.tc * 10 | 0) - 0.5) * 18, (hash2(i, 5, p.tc * 10 | 0) - 0.5) * 18, 2.4, 0, 7); ctx.fill(); }
      ctx.restore();
      // 冰晶：六角片
      ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(p.rot - lt * 0.8); ctx.strokeStyle = 'rgba(200,235,255,0.95)'; ctx.lineWidth = 1.6; ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 11, Math.sin(a) * 11); ctx.moveTo(Math.cos(a) * 6 + Math.cos(a + 0.9) * 3, Math.sin(a) * 6 + Math.sin(a + 0.9) * 3); ctx.lineTo(Math.cos(a) * 6, Math.sin(a) * 6); ctx.lineTo(Math.cos(a) * 6 + Math.cos(a - 0.9) * 3, Math.sin(a) * 6 + Math.sin(a - 0.9) * 3); }
      ctx.stroke(); ctx.restore();
      // 碰撞火花与电荷
      const sp = pulse(lt, p.tc, 0.12);
      if (sp > 0.02) { ctx.save(); ctx.strokeStyle = `rgba(255,240,200,${sp})`; ctx.lineWidth = 1.5; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + p.rot, r1 = 6, r2 = 10 + 22 * (1 - sp); const mx = (c[0] + g[0]) / 2, my = (c[1] + g[1]) / 2; ctx.beginPath(); ctx.moveTo(mx + Math.cos(a) * r1, my + Math.sin(a) * r1); ctx.lineTo(mx + Math.cos(a) * r2, my + Math.sin(a) * r2); ctx.stroke(); } ctx.restore(); }
      if (after) { const a = smooth((lt - p.tc) / 0.3); if (inC(c)) chargeSign(ctx, c[0] + 15, c[1] - 15, 12, true, a); if (inC(g)) chargeSign(ctx, g[0] + 22, g[1] - 22, 14, false, a); }
    },
  });
  // 位置函数（同时给文字跟随使用）
  SCENES[SCENES.length - 1].S = null;
  const sc = SCENES[SCENES.length - 1];
  const oldSetup = sc.setup;
  sc.setup = (S, s) => {
    S.pos = (p, lt, k) => {
      const dt = lt - p.tc;
      if (k === 'c') return [p.px - 8 + (dt > 0 ? -dt * 16 : 0), p.py + 13 - dt * p.vc];
      return [p.px + 8 + (dt > 0 ? dt * 9 : 0), p.py - 15 + dt * p.vg];
    };
    s.S = S; oldSetup(S, s);
  };
}

// ════════ 2 · 地面感应与"击穿之谜" ════════
{
  const D = TL.induct;
  scene({
    name: 'induct', t0: D.t0, dur: D.dur, fi: D.fi,
    setup(S, sc) {
      const R = RNG(SEED * 17 + 5);
      S.ridge = makeRidge(SEED + 21, 900, 40, 2.4, 3); S.G = makeGround(SEED + 21, S.ridge);
      S.trees = [760, 1180, 1590].map((x, i) => makeTree(SEED + 30 + i, x, ridgeY(S.ridge, x) + 4, R.range(120, 170)));
      S.tower = makeTower(1390, ridgeY(S.ridge, 1390) + 4, 190);
      S.minus = []; for (let k = 0; k < 46; k++) S.minus.push({ x: R.range(560, 1880), y: R.range(215, 300), ph: R() * 9 });
      S.plus = []; for (let k = 0; k < 46; k++) S.plus.push({ x: R.range(600, 1840), ph: R() * 9 });
      S.spark = []; for (let k = 0; k < 8; k++) S.spark.push(genBolt(SEED * 3 + k, { x0: 0, y0: 0, angle: -Math.PI / 2 + R.range(-0.6, 0.6), length: R.range(16, 30), step: 6, wander: 0.6, branch: 0.3, maxDepth: 1, rough: 0.3 }));
      S.rain = makeRain(SEED + 22, 500, { alpha: 0.12 });
      const o = sc.t0;
      mk('head', { text: '地面感应出正电荷', at: o + 0.8, out: o + 4.5, x: 330, y: 968, ax: 0.5, ay: 0.5, size: 56, weight: 900, persp: { p: 800, rx: 58 }, hl: [['正电荷', C_GOLD]], glow: [255, 180, 80], glowK: 0.5 });
      mk('sub', { text: '云与地之间的电压，可达', at: o + 4.5, out: o + 8.25, x: 110, y: 420, ay: 0.5, size: 32, color: C_TXT });
      T(Object.assign({}, ST.num, { at: o + 4.7, out: o + 8.25, x: 106, y: 518, ay: 0.5, size: 104, weight: 300, family: 'mono', glow: [130, 190, 255], glowK: 0.6, count: { from: 0, to: 1, dur: 2.2, html: true, chars: '伏亿量级上', fmt: v => `10<span style="font-size:0.48em;vertical-align:0.95em;margin-left:0.04em">${4 + Math.min(4, Math.floor(v * 4.999))}</span><span style="font-family:${FONT.sans};font-size:0.36em;margin-left:0.3em;letter-spacing:0.1em">伏</span>` } }));
      mk('sub', { text: '—— 上亿伏的量级', at: o + 6.0, out: o + 8.3, x: 110, y: 612, ay: 0.5, size: 28, color: C_SUB });
      mk('label', { text: '击穿空气所需的电场', at: o + 9.05, out: o + 12.9, x: 110, y: 440, ay: 1, size: 26, weight: 400 });
      mk('label', { text: '约 3 MV/m', at: o + 9.5, out: o + 12.9, x: 110 + 520 + 18, y: 474, ay: 0.5, size: 26, family: 'mono', color: C_AMB, glow: null });
      mk('label', { text: '云中实测的电场', at: o + 9.35, out: o + 12.9, x: 110, y: 540, ay: 1, size: 26, weight: 400 });
      mk('label', { text: '约 0.1–0.4 MV/m', at: o + 9.8, out: o + 12.9, x: 110 + 520 + 18, y: 574, ay: 0.5, size: 26, family: 'mono', color: C_CYAN, glow: null });
      mk('head', { text: '闪电究竟如何被“点燃”？', at: o + 10.4, out: o + 13.0, x: 110, y: 680, ay: 0.5, size: 44, weight: 700 });
      UNK(o + 11.0, o + 13.0, 110, 752);
    },
    draw(ctx, lt, t, S) {
      camera(ctx, 0, 0, 1.0 + lt * 0.0025);
      sky(ctx, [6, 8, 16], [14, 17, 28]);
      const dr = lt * 14;
      const fl = pulse(lt, 3.2, 0.1) * 0.3 + pulse(lt, 9.0, 0.08) * 0.25;
      drawCloud(ctx, baseTex(), -260 + dr, -60, 2400, 420, [{ x: 1200, y: 180, r: 800, i: fl }], { amb: 0.05 });
      // 电场线（从地面正电荷指向云底负电荷）
      const fa = smooth((lt - 2.6) / 4) * (1 - smooth((lt - 13.4) / 0.6)), amp = 2 + smooth((lt - 6) / 5) * 9;
      if (fa > 0) {
        ctx.save(); ctx.setLineDash([12, 16]); ctx.lineDashOffset = lt * 70; ctx.lineCap = 'round';
        for (let k = 0; k < 14; k++) {
          const x0 = 680 + k * 85 + ((dr * 0.6) % 85);
          const yg = ridgeY(S.ridge, x0), yc = 300;
          ctx.strokeStyle = `rgba(150,200,255,${(0.18 + 0.4 * fa * (0.6 + 0.4 * Math.sin(lt * 3 + k))) * fa})`; ctx.lineWidth = 1.4 + fa * 0.8;
          ctx.beginPath();
          for (let i = 0; i <= 24; i++) { const s = i / 24, y = lerp(yg, yc, s), x = x0 + Math.sin(s * Math.PI) * (k - 6.5) * 4 + (noise1(lt * 7 + k * 3 + s * 9, k) - 0.5) * amp; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.stroke();
          // 箭头（向上）
        }
        ctx.restore();
      }
      // 云底负电荷
      for (const m of S.minus) { const x = ((m.x + dr - 560) % 1320 + 1320) % 1320 + 560; chargeSign(ctx, x + Math.sin(lt + m.ph) * 3, m.y, 13, false, 0.9 * (1 - smooth((lt - 13.4) / 0.6))); }
      // 地面
      drawGround(ctx, S.G, { flash: fl * 0.6 });
      ctx.save(); ctx.globalCompositeOperation = 'source-over';
      for (const tr of S.trees) { ctx.fillStyle = '#06080d'; ctx.fill(tr.path); }
      ctx.fillStyle = '#080a10'; ctx.fill(S.tower.path); ctx.restore();
      ctx.strokeStyle = 'rgba(255,190,110,0.18)'; ctx.lineWidth = 1.2; ctx.beginPath(); S.ridge.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      // 地面感应正电荷：从云影中心向两侧出现，并随云移动
      for (const p of S.plus) {
        const x = ((p.x + dr * 0.95 - 600) % 1240 + 1240) % 1240 + 600;
        const a = smooth((lt - 0.6 - Math.abs(x - 1200) / 900 * 2.2) / 0.8) * (1 - smooth((lt - 13.4) / 0.6));
        if (a > 0) chargeSign(ctx, x, ridgeY(S.ridge, x) + 22 + Math.sin(lt * 2 + p.ph) * 2, 12, true, a);
      }
      // 尖端电晕放电
      const ca = smooth((lt - 7.2) / 1.5) * (1 - smooth((lt - 13.2) / 0.6));
      if (ca > 0) {
        const tops = S.trees.map(t => t.top).concat([S.tower.top]);
        tops.forEach((tp, i) => {
          const f = flicker(lt, 18, i * 7 + 3); if (f < 0.45) return;
          const b = S.spark[Math.floor(flicker(lt, 18, i + 40) * S.spark.length)];
          ctx.save(); ctx.translate(tp[0], tp[1]); GL.x4.save(); GL.x4.translate(tp[0], tp[1]);
          drawBolt(ctx, b, { I: ca * 0.9 * f, rf: -1, bI: 0.8 }, { width: 1.1, glow: [170, 140, 255] });
          GL.x4.restore(); ctx.restore();
        });
      }
      // 电场强度对比条
      const ba = smooth((lt - 9.05) / 0.6) * (1 - smooth((lt - 12.95) / 0.5));
      if (ba > 0) {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        const g1 = Ease.outExpo(clamp((lt - 9.1) / 1.2)), g2 = Ease.outExpo(clamp((lt - 9.45) / 1.2));
        ctx.globalAlpha = ba;
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(110, 462, 520, 24); ctx.fillRect(110, 562, 520, 24);
        ctx.fillStyle = 'rgba(255,190,100,0.85)'; ctx.fillRect(110, 462, 520 * g1, 24);
        ctx.fillStyle = 'rgba(110,200,255,0.35)'; ctx.fillRect(110, 562, 70 * g2, 24);
        ctx.fillStyle = 'rgba(110,200,255,0.9)'; ctx.fillRect(110, 562, 17 * g2, 24);
        ctx.restore(); Cam.apply(ctx);
      }
      drawRain(ctx, S.rain, t, 0, 0.8);
    },
  });
}
