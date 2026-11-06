// ───────────────────────── 第二部分：闪电的类型（一） ─────────────────────────
'use strict';
// 子场景：带透明度的局部合成（用于场景内部的交叉淡化）
const SUB = { c: null, x: null };
function subscene(ctx, a, fn) {
  if (a <= 0.001) return;
  if (a >= 0.999) { fn(ctx); return; }
  GL.flush(ctx);
  if (!SUB.c) { SUB.c = makeCanvas(W, H); SUB.x = SUB.c.getContext('2d'); }
  const sb = SUB.x; sb.setTransform(1, 0, 0, 1, 0, 0); sb.globalCompositeOperation = 'source-over'; sb.globalAlpha = 1; sb.fillStyle = '#000'; sb.fillRect(0, 0, W, H);
  const m = ctx.getTransform(); sb.setTransform(m);
  fn(sb); GL.flush(sb);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.drawImage(SUB.c, 0, 0); ctx.restore();
}
// 术语 + 说明的组合排版
function TERM(at, out, x, y, name, subs = [], o = {}) {
  const size = o.size || 60;
  mk('term', Object.assign({ text: name, at, out, x, y, ay: 0.5, size }, o.term || {}));
  subs.forEach((s, i) => {
    const so = typeof s === 'string' ? { text: s } : s;
    mk(so.preset || 'sub', Object.assign({ at: at + 0.45 + i * 0.5, out: out + 0.04 * (i + 1), x: x + 2, y: y + size * 0.62 + 30 + i * (o.gap || 48), ay: 0.5, size: 31, color: C_SUB }, so));
  });
}
// 沿闪电主通道取若干点作为照亮云的光源
const boltLights = (B, n, r, I, c) => { const L = []; for (let i = 0; i < n; i++) { const p = B.at(B.Dmain * (i + 0.5) / n); L.push({ x: p[0], y: p[1], r, i: I, c }); } return L; };
// 积云形状
function cumShape(u, v) {
  let d = 0;
  d = smax(d, blob(u, v, 0.5, 0.62, 0.36, 0.32), 0.1);
  d = smax(d, blob(u, v, 0.32, 0.7, 0.22, 0.2), 0.1);
  d = smax(d, blob(u, v, 0.68, 0.68, 0.24, 0.24), 0.1);
  d = smax(d, blob(u, v, 0.5, 0.36, 0.24, 0.26), 0.1);
  d = smax(d, blob(u, v, 0.42, 0.25, 0.14, 0.15), 0.08);
  return d * 1.6 * smooth((0.9 - v) / 0.06);
}
const cumTex = k => TEX.get('cum' + k, () => makeCloud(SEED + 70 + k, 560, 480, cumShape, { puffs: 700, rMin: 0.02, rMax: 0.11, th0: 0.4, dark: [11, 15, 28], top: [62, 76, 108] }));
// 向右倾斜、云砧拉长的雷暴
function stormShape(u, v) {
  let d = 0;
  d = smax(d, blob(u, v, 0.28, 0.52, 0.15, 0.46) * 1.15, 0.1);
  d = smax(d, blob(u, v, 0.3, 0.3, 0.11, 0.2), 0.1);
  d = smax(d, blob(u, v, 0.2, 0.68, 0.13, 0.2), 0.1);
  d = smax(d, blob(u, v, 0.36, 0.66, 0.13, 0.22), 0.1);
  d = smax(d, blob(u, v, 0.48, 0.2, 0.46, 0.085) * 1.05, 0.1);
  d = smax(d, blob(u, v, 0.8, 0.19, 0.2, 0.06), 0.08);
  d = smax(d, blob(u, v, 0.28, 0.82, 0.24, 0.08), 0.08);
  return d * 1.45;
}

chapter('ch2', 2, '闪电的类型', '云地 · 云中 · 外观 · 远方 · 火山 · 高空 · 球状', 202);

// ════════ 云地闪：负极性 vs 正极性 ════════
{
  const D = TL.cg;
  scene({
    name: 'cg', t0: D.t0, dur: D.dur, fi: D.fi,
    setup(S, sc) {
      const o = sc.t0, R = RNG(SEED * 29);
      S.cl = TEX.get('storm', () => makeCloud(SEED + 81, 1300, 620, stormShape, { puffs: 1500, rMin: 0.015, rMax: 0.09, flat: (u, v) => v < 0.3 ? 0.42 : 0.95, th0: 0.45, dark: [10, 13, 26], top: [58, 70, 102] }));
      S.ridge = makeRidge(SEED + 82, 945, 40, 3, 3, -160, W + 480); S.G = makeGround(SEED + 82, S.ridge);
      S.rain = makeRain(SEED + 83, 700, { alpha: 0.2 });
      S.n1 = genBolt(SEED * 29 + 1, { x0: 560, y0: 640, x1: 515, y1: ridgeY(S.ridge, 515) + 2, step: 20, branch: 0.2, gravAng: Math.PI / 2, grav: 0.06, maxDepth: 3, branchLen: [0.12, 0.42] });
      S.f1 = flashOf(S.n1, { t0: 1.0, lead: 0.4, steps: 26, strokes: [0, 0.07, 0.15, 0.26], peaks: [1.7, 1.25, 1.05, 0.85] });
      S.n2 = genBolt(SEED * 29 + 2, { x0: 690, y0: 650, x1: 770, y1: ridgeY(S.ridge, 770) + 2, step: 20, branch: 0.17, gravAng: Math.PI / 2, grav: 0.06, maxDepth: 2 });
      S.f2 = flashOf(S.n2, { t0: 3.25, lead: 0.3, steps: 20, strokes: [0, 0.09, 0.17], peaks: [1.4, 1.0, 0.8] });
      S.p1 = genBolt(SEED * 29 + 3, { x0: 1660, y0: 150, x1: 2160, y1: ridgeY(S.ridge, 2160) + 2, angle: 0.05, pull: 0.07, step: 26, branch: 0.05, wander: 0.3, maxDepth: 2, gravAng: Math.PI / 2, grav: 0.02 });
      S.fp = flashOf(S.p1, { t0: 6.55, lead: 0.42, stepped: false, strokes: [0], peaks: [2.3], tau: 0.06, cont: { dur: 0.55, lvl: 0.6 }, bI: 0.35 });
      hit(o + S.f1.tc, 0.85, 'strike'); hit(o + S.f2.tc, 0.6, 'strike'); hit(o + S.fp.tc, 1.15, 'strike');
      S.minus = []; S.plus = [];
      for (let k = 0; k < 22; k++) S.minus.push([R.range(380, 760), R.range(430, 560), R() * 9]);
      for (let k = 0; k < 26; k++) S.plus.push([R.range(300, 1750), R.range(95, 165), R() * 9]);
      TERM(o + 1.5, o + 5.2, 110, 760, '负极性云地闪', ['约占九成 · 把负电荷送到地面', '常有多次回击'], { term: { hl: [['负极性', C_CYAN]] } });
      TERM(o + 7.0, o + 11.85, 560, 360, '正极性云地闪', ['约占一成 · 多从高处的云砧发出', '可落在远离雷暴核心的地方', '通常只击一次，却更强、更持久', { text: '更容易引发火灾', color: '#ffb27a' }], { term: { hl: [['正极性', C_GOLD]] }, gap: 46 });
    },
    draw(ctx, lt, t, S) {
      const px = lerp(80, -360, smoother((lt - 3.9) / 2.8));
      const L1 = S.f1.light(lt), L2 = S.f2.light(lt), Lp = S.fp.light(lt);
      const sh = pulse(lt, S.fp.tc, 0.2) * 8;
      camera(ctx, px + (noise1(lt * 30, 1) - 0.5) * sh, (noise1(lt * 30, 2) - 0.5) * sh, 1.0);
      sky(ctx, [6, 8, 18], [18, 22, 38]);
      const Ls = L1 + L2 + Lp;
      if (Ls > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba([90, 115, 190], clamp(Ls * 0.1)); ctx.fillRect(-W, -H, W * 4, H * 3); ctx.restore(); }
      // 雨幡（只在雷暴核心下方）
      ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 1.2;
      for (const d of S.rain.drops) {
        const x0 = 200 + d.x / (W * 1.3) * 760, sp = 1300 * (0.6 + d.z * 0.6), L = 26 * (0.5 + d.z);
        const y = 640 + ((d.y + lt * sp) % 320), ex = Math.min(1, (x0 - 200) / 90, (960 - x0) / 90);
        if (ex <= 0) continue;
        ctx.strokeStyle = `rgba(150,170,215,${0.22 * ex * (1 + (L1 + L2) * 1.5) * (1 - (y - 640) / 340)})`;
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 - 5, y + L); ctx.stroke();
      }
      ctx.restore();
      drawCloud(ctx, S.cl, -120, -40, 2050, 920, [{ x: 560, y: 600, r: 700, i: (L1 + L2) * 0.55 }, { x: 1660, y: 160, r: 800, i: Lp * 0.5 }], { amb: 0.035 });
      // 电荷示意（淡）
      const ca = 0.55 * smooth((lt - 0.4) / 1) * (1 - smooth((lt - 12.0) / 0.6));
      for (const [x, y, ph] of S.minus) chargeSign(ctx, x + Math.sin(lt + ph) * 3, y, 11, false, ca);
      for (const [x, y, ph] of S.plus) chargeSign(ctx, x + Math.sin(lt + ph) * 3, y, 11, true, ca);
      drawBolt(ctx, S.n1, S.f1.state(lt), { width: 2.8 });
      drawBolt(ctx, S.n2, S.f2.state(lt), { width: 2.4 });
      const sp = S.fp.state(lt);
      if (lt > S.fp.tc + 0.55) { sp.I = Math.max(sp.I, 0.42 * (1 - smooth((lt - S.fp.tc - 0.55) / 4.2))); sp.bI = 0.3; }
      drawBolt(ctx, S.p1, sp, { width: 3.4, glow: [150, 175, 255] });
      // 正闪落点：草地起火
      const fs = lt - S.fp.tc - 0.3;
      const gpo = S.p1.main[S.p1.main.length - 1], gp = [gpo.x, gpo.y];
      if (fs > 0) {
        const fa = smooth(fs / 1.2) * (1 - smooth((lt - 12.1) / 0.6));
        for (let k = 0; k < 14; k++) {
          const ph = hash1(k, 3), fx = gp[0] + (ph - 0.5) * 90, life = (lt * (1.2 + ph) + ph * 5) % 1;
          const fy = gp[1] + 4 - life * (30 + 30 * hash1(k, 4)), r = (1 - life) * (5 + 6 * hash1(k, 6));
          glowDot(ctx, fx + Math.sin(lt * 7 + k) * 3, fy, r, [255, 150 - life * 80, 40], 0.8 * fa * (1 - life), 1.4);
        }
      }
      GL.flush(ctx);
      const fire = fs > 0 ? smooth(fs / 1.2) * (1 - smooth((lt - 12.1) / 0.6)) : 0;
      drawGround(ctx, S.G, { flash: Ls * 0.55, lights: [{ x: 515, y: ridgeY(S.ridge, 515) + 6, r: 320, i: (L1 + L2) * 0.4 }, { x: gp[0], y: gp[1] + 6, r: 420, i: Lp * 0.5 }, { x: gp[0], y: gp[1] + 4, r: 170, i: fire * 0.45, c: [255, 140, 60] }] });
      if (Ls > 0.3) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(200,215,255,${clamp((Ls - 0.3) * 0.1)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    },
  });
}

// ════════ 云内闪 · 云际闪 · 云空闪 ════════
{
  const D = TL.icc;
  scene({
    name: 'icc', t0: D.t0, dur: D.dur, fi: D.fi,
    setup(S, sc) {
      const o = sc.t0;
      S.c1 = cumTex(1); S.c2 = cumTex(2); S.c3 = cumTex(3); S.c4 = cumTex(4);
      S.G = makeGround(SEED + 95, makeRidge(SEED + 95, 1002, 22, 3, 2), { rows: 5, grass: 0.8 });
      S.ic = genBolt(SEED * 31 + 1, { x0: 170, y0: 480, angle: 0.04, length: 420, step: 16, wander: 0.5, pull: 0.25, branch: 0.26, maxDepth: 3, branchAng: [0.5, 1.3], branchLen: [0.15, 0.45], rough: 0.32 });
      S.fic = flashOf(S.ic, { t0: 0.9, lead: 0.55, stepped: false, strokes: [0, 0.16, 0.3], peaks: [1.0, 0.85, 0.6], tau: 0.08, bI: 0.9 });
      S.cc = genBolt(SEED * 31 + 2, { x0: 965, y0: 440, x1: 1150, y1: 410, angle: -0.9, pull: 0.1, step: 13, branch: 0.1, maxDepth: 2, wander: 0.38 });
      S.fcc = flashOf(S.cc, { t0: 3.1, lead: 0.3, stepped: false, strokes: [0, 0.08], peaks: [1.6, 1.1], tau: 0.05 });
      S.ca = genBolt(SEED * 31 + 3, { x0: 1510, y0: 600, angle: 2.35, length: 300, step: 14, wander: 0.4, pull: 0.2, branch: 0.24, maxDepth: 3, branchLen: [0.15, 0.4], rough: 0.3 });
      S.fca = flashOf(S.ca, { t0: 5.25, lead: 0.28, stepped: false, strokes: [0], peaks: [1.7], tau: 0.035, after: 0.06, afterK: 0.05, bI: 0.8 });
      hit(o + S.fic.tc, 0.5, 'soft'); hit(o + S.fcc.tc, 0.7, 'strike'); hit(o + S.fca.tc, 0.75, 'cut');
      mk('head', { text: '约四分之三的闪电，从不着地', at: o + 0.5, out: o + 8.9, x: 960, y: 110, ax: 0.5, ay: 0.5, size: 52 });
      const lab = (at, x, name, sub) => { mk('term', { text: name, at: o + at, out: o + 8.75, x, y: 860, ax: 0.5, ay: 0.5, size: 48 }); mk('sub', { text: sub, at: o + at + 0.45, out: o + 8.8, x, y: 925, ax: 0.5, ay: 0.5, size: 28 }); };
      lab(1.2, 365, '云内闪', '在同一朵云内部放电');
      lab(3.4, 1055, '云际闪', '在两朵云之间跳跃');
      lab(5.55, 1690, '云空闪', '窜入晴空，戛然而止');
    },
    draw(ctx, lt, t, S) {
      camera(ctx, -lt * 6, 0, 1.0 + lt * 0.003);
      sky(ctx, [5, 7, 17], [16, 20, 36]);
      const Li = S.fic.light(lt), Lc = S.fcc.light(lt), La = S.fca.light(lt);
      drawGround(ctx, S.G, { flash: (Li * 0.3 + Lc + La) * 0.35 });
      // 云内闪：通道大部分被云遮住，整朵云从内部亮起
      drawBolt(ctx, S.ic, S.fic.state(lt), { width: 2.2 });
      drawCloud(ctx, S.c1, 20, 190, 690, 600, boltLights(S.ic, 6, 280, Li * 0.26), { amb: 0.04 });
      ctx.save(); ctx.globalAlpha = 0.35; drawBolt(ctx, S.ic, S.fic.state(lt), { width: 2.0 }); ctx.restore();
      // 云际闪：两座分开的云塔
      drawCloud(ctx, S.c2, 690, 280, 330, 330, [{ x: 965, y: 440, r: 340, i: Lc * 0.6 }], { amb: 0.04 });
      drawCloud(ctx, S.c4, 1110, 250, 340, 340, [{ x: 1150, y: 410, r: 340, i: Lc * 0.6 }], { amb: 0.04 });
      drawBolt(ctx, S.cc, S.fcc.state(lt), { width: 2.6 });
      // 云空闪
      drawCloud(ctx, S.c3, 1460, 190, 460, 440, [{ x: 1520, y: 590, r: 380, i: La * 0.5 }], { amb: 0.04 });
      drawBolt(ctx, S.ca, S.fca.state(lt), { width: 2.6 });
      const Ls = Li * 0.3 + Lc + La;
      if (Ls > 0.25) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(200,215,255,${clamp((Ls - 0.25) * 0.08)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    },
  });
}

// ════════ 片状 · 叉状 · 链状 ════════
{
  const D = TL.look, A1 = 4.3, B1 = 8.3;
  scene({
    name: 'look', t0: D.t0, dur: D.dur, fi: D.fi,
    setup(S, sc) {
      const o = sc.t0;
      S.ridge = makeRidge(SEED + 91, 905, 50, 2.6, 3); S.G = makeGround(SEED + 91, S.ridge);
      S.sheet = [[0.7, 600, 330, 1.0], [1.32, 1300, 280, 0.8], [1.46, 1100, 420, 1.1], [2.55, 450, 260, 0.7], [3.35, 1500, 380, 0.9]];
      S.sheet.forEach(f => hit(o + f[0], f[3] * 0.45, 'soft'));
      S.fork = genBolt(SEED * 37 + 1, { x0: 1150, y0: -30, x1: 960, y1: 905, step: 19, branch: 0.3, maxDepth: 4, gravAng: Math.PI / 2, grav: 0.07, branchLen: [0.1, 0.38], branchAng: [0.35, 1.1], rough: 0.36 });
      S.ff = flashOf(S.fork, { t0: A1 + 0.35, lead: 0.55, stepped: true, steps: 28, strokes: [0], peaks: [1.9], tau: 0.09, after: 1.6, afterK: 0.3, bI: 0.9 });
      hit(o + S.ff.tc, 0.9, 'strike');
      S.bead = genBolt(SEED * 37 + 2, { x0: 1010, y0: -30, x1: 1080, y1: 905, step: 20, branch: 0.07, maxDepth: 1, gravAng: Math.PI / 2, grav: 0.05 });
      S.fb = flashOf(S.bead, { t0: B1 + 0.3, lead: 0.2, stepped: false, strokes: [0, 0.07], peaks: [1.8, 1.2], tau: 0.05, after: 0.3, afterK: 0.2 });
      hit(o + S.fb.tc, 0.8, 'strike');
      S.beads = []; { const R = RNG(SEED * 37 + 3); for (let d = 14; d < S.bead.Dmain - 10; d += R.range(34, 52)) S.beads.push({ d, b: R.range(0.55, 1), end: R.range(1.2, 2.7), len: R.range(4, 9) }); }
      // 叉状闪电的标注引线：取一条一级分支的末端
      const br = S.fork.segs.filter(s => s.lvl === 1 && s.db < S.fork.Dmain && s.bx < 1000 && s.by > 280 && s.by < 620).sort((a, b) => a.bx - b.bx);
      const tip = br.length ? [br[0].bx, br[0].by] : [880, 460];
      TERM(o + 0.7, o + 3.85, 110, 790, '片状闪电', ['看不见通道，只见整片云被照亮', { text: '——其实是被云遮住的云内闪', color: C_TXT }], { gap: 46 });
      TERM(o + A1 + 1.0, o + B1 - 0.55, 110, 360, '叉状闪电', [{ text: '枝杈，是先导留下的“岔路”', lead: { from: () => tip, ox: 420, delay: 0.2, elbow: 'h' } }, '回击时被一同点亮']);
      TERM(o + B1 + 0.9, o + 11.2, 110, 360, '链状闪电', ['消退时，断成一串发光的“珠子”'], { term: { outA: 'beads' } });
      UNK(o + B1 + 2.0, o + 11.25, 112, 520, '成因尚无定论');
    },
    draw(ctx, lt, t, S) {
      const aA = 1 - smooth((lt - A1) / 0.35), aB = smooth((lt - A1) / 0.35) * (1 - smooth((lt - B1) / 0.5)), aC = smooth((lt - B1) / 0.5);
      subscene(ctx, aA, c => {
        camera(c, 0, 0, 1.0 + lt * 0.01);
        sky(c, [6, 8, 16], [14, 16, 28]);
        const L = S.sheet.map(([tt, x, y, k]) => ({ x, y, r: 900, i: (pulse(lt, tt, 0.07) + pulse(lt, tt + 0.06, 0.05) * 0.5) * k * 0.65 }));
        const Ls = L.reduce((a, l) => a + l.i, 0);
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba([90, 110, 170], clamp(Ls * 0.12)); c.fillRect(-W, -H, W * 3, H * 3); c.restore();
        drawCloud(c, deckTex(), -150, -60, 2220, 900, L, { amb: 0.04 });
        drawGround(c, S.G, { flash: Ls * 0.5 });
      });
      subscene(ctx, aB, c => {
        camera(c, 0, 0, 1.0 + (lt - A1) * 0.008);
        sky(c, [4, 6, 14], [12, 15, 28]);
        const L = S.ff.light(lt - 0);
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba([90, 110, 180], clamp(L * 0.12)); c.fillRect(-W, -H, W * 3, H * 3); c.restore();
        const st = S.ff.state(lt);
        if (lt > S.ff.tc + 0.2) st.I = Math.max(st.I, 0.5 * (1 - smooth((lt - S.ff.tc - 2.4) / 1.2)));
        drawBolt(c, S.fork, st, { width: 2.6 });
        GL.flush(c);
        drawGround(c, S.G, { flash: L * 0.55, lights: [{ x: 960, y: ridgeY(S.ridge, 960) + 6, r: 360, i: L * 0.4 }], refl: [{ x: 960, y: ridgeY(S.ridge, 960) + 2, i: L * 0.6, len: 120 }] });
      });
      subscene(ctx, aC, c => {
        camera(c, 0, 0, 1.03 - (lt - B1) * 0.004);
        sky(c, [4, 6, 14], [12, 15, 28]);
        const L = S.fb.light(lt);
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba([90, 110, 180], clamp(L * 0.12)); c.fillRect(-W, -H, W * 3, H * 3); c.restore();
        const st = S.fb.state(lt);
        if (lt > S.fb.tc + 0.2) st.I *= 1 - smooth((lt - S.fb.tc - 0.2) / 0.35);
        drawBolt(c, S.bead, st, { width: 2.8 });
        // 珠状：通道消退时，亮度沿通道分解为一串光珠，珠子比通道多停留一会儿再逐颗熄灭
        const ts = lt - S.fb.tc - 0.18;
        if (ts > 0) {
          for (const b of S.beads) {
            const a = smooth(ts / 0.25) * (1 - smooth((ts - b.end) / 0.5)) * b.b;
            if (a <= 0.01) continue;
            const p = S.bead.at(b.d), q = S.bead.at(b.d + b.len);
            c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
            c.strokeStyle = rgba([200, 190, 255], a * 0.45); c.lineWidth = 15; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke();
            c.strokeStyle = rgba([255, 246, 236], a); c.lineWidth = 8; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); c.restore();
            const g = GL.ctx; g.strokeStyle = rgba([170, 160, 255], a); g.lineWidth = 34; g.lineCap = 'round'; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke();
          }
        }
        GL.flush(c);
        drawGround(c, S.G, { flash: L * 0.55, lights: [{ x: 1080, y: ridgeY(S.ridge, 1080) + 6, r: 360, i: L * 0.4 }], refl: [{ x: 1080, y: ridgeY(S.ridge, 1080) + 2, i: L * 0.6, len: 120 }] });
      });
    },
  });
}

// ════════ 热闪电 · 干闪电 ════════
{
  const D = TL.heatdry, SP = 5.0;
  scene({
    name: 'heatdry', t0: D.t0, dur: D.dur, fi: D.fi,
    setup(S, sc) {
      const o = sc.t0, R = RNG(SEED * 41);
      S.stars = makeStars(SEED + 101, 260, 760);
      S.plain = makeRidge(SEED + 102, 830, 14, 3, 2); S.Gp = makeGround(SEED + 102, S.plain, { top: [24, 29, 46], mid: [10, 12, 20], bot: [3, 4, 8], rows: 12, grass: 0.6, edgeA: 0.25 });
      S.lights = []; for (let k = 0; k < 26; k++) S.lights.push([R.range(80, 1100), R.range(-2, 3), R.range(0.3, 1)]);
      S.heat = [[0.9, 0.9], [1.6, 0.6], [1.74, 0.8], [2.85, 0.7], [3.9, 0.9]];
      S.heat.forEach(([tt, k]) => hit(o + tt, k * 0.25, 'silent'));
      S.hills = makeRidge(SEED + 103, 820, 220, 2.2, 4); S.Gh = makeGround(SEED + 103, S.hills, { top: [44, 31, 28], mid: [19, 13, 13], bot: [6, 4, 5], edge: [210, 150, 120], edgeA: 0.22, line: [190, 130, 110], lineA: 0.07, rows: 9 });
      S.dcl = TEX.get('drycl', () => makeCloud(SEED + 104, 1440, 380, edgeShape(0.75, 0.25, 0.15, SEED + 105), { puffs: 1100, rMin: 0.03, rMax: 0.2, flat: () => 0.55, th0: 0.4, dark: [16, 12, 16], top: [70, 56, 60], lit: [255, 225, 210] }));
      S.virga = []; for (let k = 0; k < 90; k++) S.virga.push([R.range(300, 1750), R.range(0, 1), R.range(120, 260)]);
      const gx = 1260; S.gp = [gx, ridgeY(S.hills, gx) + 3];
      S.db = genBolt(SEED * 41 + 1, { x0: 1180, y0: 330, x1: S.gp[0], y1: S.gp[1], step: 20, branch: 0.16, maxDepth: 3, gravAng: Math.PI / 2, grav: 0.06 });
      S.fd = flashOf(S.db, { t0: SP + 0.85, lead: 0.3, steps: 18, strokes: [0, 0.09], peaks: [1.8, 1.2] });
      hit(o + S.fd.tc, 0.9, 'strike');
      S.trees = [[420, 70], [560, 50], [1480, 60], [1690, 80]].map(([x, h], i) => makeTree(SEED + 110 + i, x, ridgeY(S.hills, x) + 4, h));
      // 文字
      TERM(o + 0.95, o + 4.45, 110, 300, '热闪电', [{ text: '并不是“热”出来的', color: C_TXT }, '只是太远——雷声传不到你耳边']);
      mk('note', { text: '通常超过约 15–20 公里', at: o + 1.6, out: o + 4.5, x: 860, y: 760, ax: 0.5, ay: 0.5, size: 22, color: 'rgba(200,215,240,0.8)', persp: { p: 1200, rz: -4 } });
      TERM(o + SP + 0.5, o + 9.25, 110, 250, '干闪电', [{ text: '雨在半空就蒸发了，闪电却落了地', color: C_TXT }, { text: '容易引燃野火', hl: [['野火', '#ffa060']] }]);
      mk('label', { text: '雨幡', at: o + SP + 1.4, out: o + 9.25, x: 760, y: 520, ax: 1, ay: 0.5, size: 28, lead: { from: () => [930, 470], ox: 12, delay: 0.1 } });
    },
    draw(ctx, lt, t, S) {
      const aA = 1 - smooth((lt - SP) / 0.6), aB = smooth((lt - SP) / 0.6);
      subscene(ctx, aA, c => {
        camera(c, 0, 0, 1.0 + lt * 0.004);
        sky(c, [4, 7, 20], [26, 34, 62], 0, 830);
        drawStars(c, S.stars, lt, 0.9);
        // 远方雷暴：云顶在地平线附近，被无声地照亮
        const I = S.heat.reduce((a, [tt, k]) => a + (pulse(lt, tt, 0.08) + pulse(lt, tt + 0.07, 0.05) * 0.6) * k, 0);
        drawCloud(c, cumTex(2), 1250, 650, 300, 260, [{ x: 1400, y: 770, r: 260, i: I * 0.75, c: [255, 240, 235] }], { amb: 0.02, alpha: 0.95 });
        drawCloud(c, cumTex(3), 1440, 690, 230, 200, [{ x: 1550, y: 790, r: 220, i: I * 0.5, c: [255, 235, 230] }], { amb: 0.02 });
        const hg = c.createRadialGradient(1450, 830, 0, 1450, 830, 500); hg.addColorStop(0, rgba([140, 150, 220], clamp(I * 0.25))); hg.addColorStop(1, 'rgba(140,150,220,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = hg; c.fillRect(900, 400, 1100, 500); c.restore();
        drawGround(c, S.Gp, { flash: I * 0.12, lights: [{ x: 1450, y: 840, r: 520, i: I * 0.16 }] });
        for (const [x, dy, b] of S.lights) glowDot(c, x, ridgeY(S.plain, x) + dy, 1.3, [255, 210, 150], b * 0.8, 0.5);
        // 距离示意
        const da = smooth((lt - 1.2) / 0.8) * (1 - smooth((lt - 4.4) / 0.4));
        if (da > 0) { c.save(); c.setLineDash([8, 10]); c.strokeStyle = `rgba(190,210,245,${0.55 * da})`; c.lineWidth = 1.4; c.beginPath(); c.moveTo(330, 860); c.lineTo(330 + (1380 - 330) * Ease.outCubic(clamp((lt - 1.2) / 1.2)), 860 - (860 - 790) * Ease.outCubic(clamp((lt - 1.2) / 1.2))); c.stroke(); c.restore(); glowDot(c, 330, 860, 4, [220, 230, 255], da, 0.5); }
      });
      subscene(ctx, aB, c => {
        const lb = lt - SP;
        const L = S.fd.light(lt);
        const sh = pulse(lt, S.fd.tc, 0.2) * 6;
        camera(c, (noise1(lt * 30, 1) - 0.5) * sh, (noise1(lt * 30, 2) - 0.5) * sh, 1.0 + lb * 0.006);
        sky(c, [14, 10, 16], [58, 36, 32], 0, 820);
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba([150, 120, 140], clamp(L * 0.1)); c.fillRect(-W, -H, W * 3, H * 3); c.restore();
        // 雨幡：从云底落下、在半空消失的雨丝
        c.save(); c.lineCap = 'round';
        for (const [x, ph, len] of S.virga) {
          const y0 = 330 + (fbm(x / 500, 0, 2, 3) - 0.5) * 60, off = ((lb * 0.9 + ph) % 1);
          const g = c.createLinearGradient(0, y0, 0, y0 + len); g.addColorStop(0, `rgba(150,140,160,${0.35 + L * 0.3})`); g.addColorStop(1, 'rgba(150,140,160,0)');
          c.strokeStyle = g; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x + off * 8, y0); c.lineTo(x - 14 + off * 8, y0 + len); c.stroke();
        }
        c.restore();
        drawCloud(c, S.dcl, -150, -60, 2220, 470, [{ x: 1180, y: 330, r: 900, i: L * 0.5, c: [255, 230, 220] }], { amb: 0.05 });
        drawBolt(c, S.db, S.fd.state(lt), { width: 2.8, glow: [170, 160, 255] });
        // 火
        const fs = lt - S.fd.tc - 0.15;
        if (fs > 0) {
          const fa = smooth(fs / 1.4);
          const [gx, gy] = S.gp;
          const fg = c.createRadialGradient(gx, gy, 0, gx, gy, 70 * fa + 10); fg.addColorStop(0, `rgba(255,140,40,${0.4 * fa})`); fg.addColorStop(1, 'rgba(255,90,20,0)');
          c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = fg; c.fillRect(gx - 200, gy - 200, 400, 400); c.restore();
          c.save(); c.globalCompositeOperation = 'lighter';
          for (let k = 0; k < 34; k++) {
            const ph = hash1(k, 11), life = (lt * (1.4 + ph) + ph * 7) % 1, fx = gx + (ph - 0.5) * 90 * fa + Math.sin(lt * 5 + k) * 3 * life;
            const fh = (22 + 36 * hash1(k, 12)) * fa * (1 - life * 0.5), fw = (5 + 5 * hash1(k, 13)) * (1 - life);
            const fy = gy + 3 - life * fh * 0.9;
            c.fillStyle = rgba([255, 190 - life * 130, 60 - life * 40], 0.6 * (1 - life) * fa);
            c.beginPath(); c.moveTo(fx - fw, fy); c.quadraticCurveTo(fx - fw * 0.3, fy - fh * 0.45, fx + Math.sin(lt * 9 + k) * 3, fy - fh * 0.75); c.quadraticCurveTo(fx + fw * 0.3, fy - fh * 0.45, fx + fw, fy); c.closePath(); c.fill();
          }
          c.restore();
          const g2 = GL.ctx; g2.fillStyle = `rgba(255,120,40,${0.5 * fa})`; g2.beginPath(); g2.ellipse(gx, gy - 14, 50 * fa + 5, 26 * fa + 4, 0, 0, 7); g2.fill();
          // 烟
          for (let k = 0; k < 10; k++) {
            const ph = hash1(k, 21), life = (lt * 0.25 + ph) % 1;
            const sx = gx + life * 120 + (ph - 0.5) * 40, sy = gy - 40 - life * 300, r = 20 + life * 70;
            const sg = c.createRadialGradient(sx, sy, 0, sx, sy, r); sg.addColorStop(0, `rgba(60,50,50,${0.35 * fa * (1 - life)})`); sg.addColorStop(1, 'rgba(60,50,50,0)');
            c.fillStyle = sg; c.fillRect(sx - r, sy - r, r * 2, r * 2);
          }
        }
        GL.flush(c);
        const hc = rgba(mixc([10, 7, 7], [40, 30, 32], clamp(L * 0.4)));
        const fA = lt > S.fd.tc + 0.15 ? smooth((lt - S.fd.tc - 0.15) / 1.4) : 0;
        drawGround(c, S.Gh, { flash: L * 0.5, flashC: [170, 140, 150], lights: [{ x: S.gp[0], y: S.gp[1] + 10, r: 300, i: L * 0.4 }, { x: S.gp[0], y: S.gp[1] + 6, r: 230, i: fA * 0.5, c: [255, 130, 50] }] });
        c.fillStyle = hc; S.trees.forEach(tr => c.fill(tr.path));
      });
    },
  });
}

// ════════ 火山闪电 ════════
{
  const D = TL.volcano;
  scene({
    name: 'volcano', t0: D.t0, dur: D.dur, fi: D.fi,
    setup(S, sc) {
      const o = sc.t0, R = RNG(SEED * 43);
      S.cone = new Path2D();
      S.cone.moveTo(180, 1090); S.cone.bezierCurveTo(560, 960, 820, 800, 880, 735); S.cone.lineTo(905, 728); S.cone.lineTo(960, 742); S.cone.lineTo(1015, 726); S.cone.lineTo(1045, 735); S.cone.bezierCurveTo(1110, 800, 1360, 960, 1760, 1090); S.cone.closePath();
      S.puffs = []; for (let k = 0; k < 300; k++) S.puffs.push({ b: R.range(-16, D.dur), v: R.range(150, 240), r0: R.range(26, 55), sx: R.range(-1, 1), s: R(), sh: R.range(0.7, 1.2) });
      S.lava = [[930, 742, -1], [1000, 744, 1], [968, 746, 0.35]].map(([x, y, dir], i) => { const pts = [[x, y]]; let px = x, py = y; for (let k = 0; k < 26; k++) { py += 11; const slope = 0.75 + k * 0.035; px += dir * 11 * slope + (fbm(k * 0.4, i * 3, 2, 7) - 0.5) * 16; pts.push([px, py]); } return pts; });
      S.small = []; for (let k = 0; k < 24; k++) S.small.push(genBolt(SEED * 43 + 10 + k, { x0: 0, y0: 0, angle: R.range(0, Math.PI * 2), length: R.range(22, 70), step: 8, wander: 0.6, branch: 0.25, maxDepth: 1, rough: 0.35 }));
      S.big = [[1.0, 840, 520, -0.4], [2.4, 1040, 420, 0.35], [3.3, 900, 330, 0.1], [4.6, 1080, 560, 2.6], [5.8, 960, 380, -0.2]].map(([tt, x, y, a], i) => {
        const B = genBolt(SEED * 43 + 50 + i, { x0: x, y0: y, angle: a, length: R.range(200, 330), step: 14, wander: 0.5, branch: 0.22, maxDepth: 2, rough: 0.33 });
        hit(o + tt + 0.12, 0.55, 'strike');
        return { B, f: flashOf(B, { t0: tt, lead: 0.12, stepped: false, strokes: [0, 0.07], peaks: [1.5, 1.0], tau: 0.05 }) };
      });
      for (let k = 0; k < 7; k += 0.5) hit(o + k + 0.13, 0.12, 'crackle');
      TERM(o + 0.8, o + 6.55, 110, 270, '火山闪电', [{ text: '火山灰在喷发柱中碰撞、碎裂而带电', color: C_TXT }, '高处结成的冰粒也会参与起电'], { term: { glow: [255, 150, 90] } });
    },
    draw(ctx, lt, t, S) {
      camera(ctx, 0, 0, 1.0 + lt * 0.006);
      sky(ctx, [5, 5, 12], [46, 20, 18]);
      const hz = ctx.createRadialGradient(960, 760, 0, 960, 760, 900); hz.addColorStop(0, 'rgba(160,60,25,0.35)'); hz.addColorStop(1, 'rgba(160,60,25,0)'); ctx.fillStyle = hz; ctx.fillRect(0, 0, W, H);
      let L = 0; for (const { f } of S.big) L += f.light(lt);
      const vent = 0.4 + 0.6 * flicker(lt, 14, 9);
      // 喷发柱：自下而上翻滚的火山灰（底部被熔岩映红，被闪电照亮）
      const cx = 960, cy = 735;
      for (const p of S.puffs) {
        const age = lt - p.b; if (age < 0) continue;
        const life = age / 16; if (life > 1) continue;
        const y = cy - p.v * age * (1 - age / 34) * p.sh, x = cx + p.sx * (16 + age * 15) + Math.pow(age, 1.7) * 7 * (0.4 + p.s);
        const r = p.r0 + age * 20;
        const low = clamp(1 - (cy - y) / 380);
        const col = mixc(mixc([58, 50, 50], [175, 75, 30], low * 0.75), [150, 140, 200], clamp(L * 0.35));
        const a = 0.42 * (1 - life) * smooth(age / 0.5);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.55, rgba(col, a * 0.7)); g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      // 熔岩喷泉
      for (let k = 0; k < 60; k++) {
        const ph = hash1(k, 31), T = 1.4 + ph, age = (lt + ph * 9) % T, vx = (hash1(k, 32) - 0.5) * 160, vy = -(240 + hash1(k, 33) * 220);
        const x = cx + (hash1(k, 34) - 0.5) * 40 + vx * age, y = cy - 4 + vy * age + 300 * age * age;
        if (y > cy + 30) continue;
        glowDot(ctx, x, y, 1.8 + ph * 1.4, [255, 170 - age * 50, 60], 0.9 * (1 - age / T), 0.9);
      }
      // 火山口附近的密集小火花
      for (let k = 0; k < 6; k++) {
        const slot = Math.floor(lt * 15) + k * 1000, h = hash1(slot, 3);
        if (h < 0.3) continue;
        const B = S.small[Math.floor(hash1(slot, 4) * S.small.length)];
        const x = cx + (hash1(slot, 5) - 0.5) * 240, y = cy - 40 - hash1(slot, 6) * 220;
        ctx.save(); ctx.translate(x, y); GL.x4.save(); GL.x4.translate(x, y);
        drawBolt(ctx, B, { I: 0.7 + h * 0.9, rf: -1, bI: 0.8 }, { width: 1.5, glow: [170, 150, 255] });
        GL.x4.restore(); ctx.restore();
      }
      for (const { B, f } of S.big) drawBolt(ctx, B, f.state(lt), { width: 2.6, glow: [170, 150, 255] });
      if (L > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba([120, 100, 200], clamp(L * 0.08)); ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore(); }
      GL.flush(ctx);
      // 火山锥
      ctx.fillStyle = '#08060a'; ctx.fill(S.cone);
      // 熔岩流
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      S.lava.forEach((pts, i) => {
        const n = pts.length;
        for (let k = 1; k < n; k++) {
          const f = k / n, a = (1 - f) * (0.75 + 0.25 * Math.sin(lt * 2 + k * 0.6 + i));
          ctx.strokeStyle = `rgba(255,${120 - f * 60 | 0},30,${a})`; ctx.lineWidth = 3.2 * (1 - f * 0.6);
          ctx.beginPath(); ctx.moveTo(pts[k - 1][0], pts[k - 1][1]); ctx.lineTo(pts[k][0], pts[k][1]); ctx.stroke();
        }
        const g = GL.ctx; g.strokeStyle = 'rgba(255,90,20,0.6)'; g.lineWidth = 12; g.beginPath(); pts.slice(0, 18).forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
      });
      ctx.restore();
      const lg = ctx.createRadialGradient(cx, cy + 4, 0, cx, cy + 4, 120); lg.addColorStop(0, `rgba(255,170,70,${0.75 * vent + 0.2})`); lg.addColorStop(0.3, 'rgba(255,90,20,0.45)'); lg.addColorStop(1, 'rgba(255,60,10,0)');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = lg; ctx.fillRect(cx - 160, cy - 160, 320, 320); ctx.restore();
      const g2 = GL.ctx; g2.fillStyle = `rgba(255,110,30,${0.5 + 0.3 * vent})`; g2.beginPath(); g2.ellipse(cx, cy, 90, 40, 0, 0, 7); g2.fill();
    },
  });
}
