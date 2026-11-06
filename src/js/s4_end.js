// ───────────────────────── 第三部分：实用知识 · 结尾 ─────────────────────────
'use strict';
chapter('ch3', 3, '雷暴中的你', '估算距离 · 安全常识', 303);

// ════════ 数秒估算距离 ════════
{
  const D = TL.dist, F = 0.8, ARR = 4.0;
  scene({
    name: 'dist', t0: D.t0, dur: D.dur, fi: D.fi,
    setup(S, sc) {
      const o = sc.t0;
      S.ridge = makeRidge(SEED + 150, 770, 26, 2.5, 3); S.G = makeGround(SEED + 150, S.ridge, { rows: 12 });
      S.stars = makeStars(SEED + 151, 120, 600);
      S.b = genBolt(SEED * 53 + 1, { x0: 1560, y0: 470, x1: 1530, y1: ridgeY(S.ridge, 1530) + 1, step: 12, branch: 0.16, maxDepth: 2, gravAng: Math.PI / 2, grav: 0.06 });
      S.f = flashOf(S.b, { t0: F - 0.15, lead: 0.15, stepped: false, strokes: [0, 0.07, 0.15], peaks: [1.7, 1.2, 0.9] });
      S.L = [360, 830];
      hit(o + S.f.tc, 0.4, 'flashonly'); hit(o + ARR, 0.8, 'rumble');
      for (let k = 1; k <= 9; k++) hit(o + F + (ARR - F) * k / 9, 0.12, 'tick');
      mk('head', { text: '看到闪电，数到雷声响起', at: o + 0.3, out: o + 4.1, x: 110, y: 150, ay: 0.5, size: 50 });
      mk('note', { text: '演示中的计时已加速', at: o + 1.0, out: o + 4.15, x: 112, y: 210, ay: 0.5, size: 22 });
      T(Object.assign({}, ST.num, { at: o + F, out: o + 4.0, x: 960, y: 360, ax: 0.5, ay: 0.5, size: 150, weight: 300, family: 'mono', glow: [140, 190, 255], glowK: 0.7, count: { from: 0, to: 9.999, dur: ARR - F, ease: 'linear', chars: '秒', fmt: v => `${Math.min(9, Math.floor(v))}<span style="font-family:${FONT.sans};font-size:0.3em;margin-left:0.2em">秒</span>`, html: true } }));
      mk('head', { text: '9 秒 ÷ 3 ≈ 3 公里', at: o + 4.5, out: o + 7.05, x: 960, y: 360, ax: 0.5, ay: 0.5, size: 76, weight: 700, family: 'sans', inA: 'focus', stagger: 0.04, hl: [['3 公里', C_CYAN]] });
      mk('sub', { text: '声音约每 3 秒走 1 公里，而光几乎瞬间就到', at: o + 5.0, out: o + 7.1, x: 960, y: 450, ax: 0.5, ay: 0.5, size: 32 });
    },
    draw(ctx, lt, t, S) {
      camera(ctx, 0, 0, 1.0 + lt * 0.003);
      sky(ctx, [4, 6, 15], [18, 22, 40], 0, 770);
      drawStars(ctx, S.stars, lt, 0.5);
      const L = S.f.light(lt);
      drawCloud(ctx, cumTex(4), 1360, 300, 420, 360, [{ x: 1560, y: 470, r: 360, i: L * 0.7 }], { amb: 0.03 });
      drawBolt(ctx, S.b, S.f.state(lt), { width: 2.2 });
      GL.flush(ctx);
      drawGround(ctx, S.G, { flash: L * 0.3, lights: [{ x: 1530, y: 776, r: 300, i: L * 0.35 }] });
      // 声波从闪电处传向听者
      const p = clamp((lt - S.f.tc) / (ARR - S.f.tc)), r = p * Math.hypot(1530 - S.L[0], 770 - S.L[1]);
      if (lt > S.f.tc && lt < ARR + 0.6) {
        const a = lt < ARR ? 0.7 : 0.7 * (1 - (lt - ARR) / 0.6);
        ctx.save(); ctx.strokeStyle = rgba([160, 200, 255], a); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(1530, 770, r, Math.PI * 0.8, Math.PI * 1.15); ctx.stroke();
        for (let k = 1; k < 4; k++) { ctx.strokeStyle = rgba([160, 200, 255], a * (0.4 - k * 0.1)); ctx.beginPath(); ctx.arc(1530, 770, Math.max(1, r - k * 26), Math.PI * 0.82, Math.PI * 1.13); ctx.stroke(); }
        ctx.restore();
      }
      // 听者
      const [lx, ly] = S.L, hitp = pulse(lt, ARR, 0.25);
      ctx.fillStyle = 'rgba(200,215,240,0.9)';
      ctx.beginPath(); ctx.arc(lx, ly - 64, 11, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(lx - 14, ly); ctx.lineTo(lx - 10, ly - 48); ctx.quadraticCurveTo(lx, ly - 54, lx + 10, ly - 48); ctx.lineTo(lx + 14, ly); ctx.fill();
      if (hitp > 0.02) { ctx.strokeStyle = rgba([200, 225, 255], hitp); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(lx, ly - 40, 40 + (1 - hitp) * 60, 0, 7); ctx.stroke(); }
      // 距离标尺
      const da = smooth((lt - 4.3) / 0.6) * (1 - smooth((lt - 7.0) / 0.5));
      if (da > 0) {
        const w = Ease.outExpo(clamp((lt - 4.3) / 1.0));
        ctx.save(); ctx.globalAlpha = da; ctx.strokeStyle = 'rgba(127,211,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, 880); ctx.lineTo(lerp(lx, 1530, w), 880); ctx.stroke();
        for (let k = 0; k <= 3; k++) { const x = lerp(lx, 1530, k / 3); if (x > lerp(lx, 1530, w) + 1) continue; ctx.beginPath(); ctx.moveTo(x, 872); ctx.lineTo(x, 888); ctx.stroke(); ctext(ctx, k + ' 公里', x, 912, { align: 'center', size: 18, family: FONT.sans, color: 'rgba(170,220,255,0.85)' }); }
        ctx.restore();
      }
    },
  });
}

// ════════ 雷暴安全常识 ════════
{
  const D = TL.safe;
  const ICONS = [
    { x: 1090, y: 340, ok: true, name: '建筑物内' }, { x: 1385, y: 340, ok: true, name: '硬顶汽车内' }, { x: 1680, y: 340, ok: false, name: '孤立的大树下' },
    { x: 1090, y: 650, ok: false, name: '山顶、高处' }, { x: 1385, y: 650, ok: false, name: '水中、水边' }, { x: 1680, y: 650, ok: false, name: '空旷地带' },
  ];
  scene({
    name: 'safe', t0: D.t0, dur: D.dur, fi: D.fi,
    setup(S, sc) {
      const o = sc.t0;
      mk('head', { text: '间隔不到 30 秒', at: o + 0.4, out: o + 7.5, x: 110, y: 290, ay: 0.5, size: 56, family: 'sans', weight: 700, hl: [['30 秒', C_CYAN]] });
      mk('sub', { text: '→ 立即进入室内', at: o + 0.9, out: o + 7.52, x: 112, y: 360, ay: 0.5, size: 38, color: C_TXT });
      mk('head', { text: '最后一声雷后', at: o + 1.6, out: o + 7.55, x: 110, y: 480, ay: 0.5, size: 56, family: 'sans', weight: 700 });
      mk('sub', { text: '→ 再等 30 分钟', at: o + 2.1, out: o + 7.57, x: 112, y: 550, ay: 0.5, size: 38, color: C_TXT, hl: [['30 分钟', C_CYAN]] });
      T({ kind: 'line', at: o + 2.8, out: o + 7.45, x1: 112, y1: 650, x2: 640, y2: 650, color: 'rgba(255,197,107,0.7)', width: 1.5, inDur: 0.8, outDur: 0.5 });
      mk('label', { text: '雷声响起，即刻入室', at: o + 3.0, out: o + 7.6, x: 112, y: 700, ay: 0.5, size: 34, color: C_AMB, glow: [255, 170, 60], glowK: 0.5, tracking: 0.2 });
      ICONS.forEach((ic, i) => mk('label', { text: ic.name, at: o + 0.9 + i * 0.28, out: o + 7.5 + i * 0.02, x: ic.x, y: ic.y + 118, ax: 0.5, ay: 0.5, size: 26, color: ic.ok ? '#bfe8ff' : '#ffc0b8', glow: null }));
      for (const tt of [1.2, 4.6]) hit(o + tt, 0.2, 'soft');
    },
    draw(ctx, lt, t, S) {
      camera(ctx, 0, 0, 1.0);
      sky(ctx, [4, 6, 14], [12, 15, 26]);
      const L = pulse(lt, 1.2, 0.08) * 0.5 + pulse(lt, 4.6, 0.08) * 0.4;
      drawCloud(ctx, deckTex(), -200, -260, 2300, 760, [{ x: 1500, y: 200, r: 800, i: L * 0.5 }], { amb: 0.02, alpha: 0.5 });
      // 图标
      ICONS.forEach((ic, i) => {
        const a = Ease.outCubic(clamp((lt - 0.7 - i * 0.28) / 0.6)) * (1 - smooth((lt - 7.5) / 0.5));
        if (a <= 0) return;
        ctx.save(); ctx.translate(ic.x, ic.y + (1 - a) * 20); ctx.globalAlpha = a;
        // 底盘
        ctx.fillStyle = ic.ok ? 'rgba(80,170,255,0.07)' : 'rgba(255,90,80,0.06)'; ctx.strokeStyle = ic.ok ? 'rgba(120,200,255,0.35)' : 'rgba(255,130,120,0.3)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.roundRect(-118, -92, 236, 176, 10); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(220,232,255,0.92)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        drawIcon(ctx, i, lt);
        // 勾 / 叉
        ctx.translate(92, -66); ctx.lineWidth = 4;
        if (ic.ok) { ctx.strokeStyle = '#7fe3ff'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-3, 9); ctx.lineTo(13, -10); ctx.stroke(); }
        else { ctx.strokeStyle = '#ff8a7a'; ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(10, 10); ctx.moveTo(10, -10); ctx.lineTo(-10, 10); ctx.stroke(); }
        ctx.restore();
      });
    },
  });
  function drawIcon(c, i, lt) {
    c.beginPath();
    if (i === 0) { c.moveTo(-60, 60); c.lineTo(-60, -5); c.lineTo(0, -55); c.lineTo(60, -5); c.lineTo(60, 60); c.closePath(); c.moveTo(-16, 60); c.lineTo(-16, 22); c.lineTo(16, 22); c.lineTo(16, 60); }
    if (i === 1) { c.moveTo(-78, 30); c.lineTo(-78, 5); c.lineTo(-50, 0); c.lineTo(-30, -32); c.lineTo(32, -32); c.lineTo(52, 0); c.lineTo(78, 6); c.lineTo(78, 30); c.closePath(); c.moveTo(-22, -26); c.lineTo(-38, -2); c.moveTo(0, -30); c.lineTo(0, 0); c.moveTo(-60, 0); c.lineTo(66, 0); c.moveTo(-34, 44); c.arc(-48, 44, 14, 0, 7); c.moveTo(62, 44); c.arc(48, 44, 14, 0, 7); }
    if (i === 2) { c.moveTo(0, 65); c.lineTo(0, 5); c.moveTo(0, 25); c.lineTo(-18, 8); c.moveTo(0, 15); c.lineTo(16, 0); c.moveTo(42, -22); c.arc(0, -22, 42, 0, 7); c.moveTo(-70, 65); c.lineTo(70, 65); }
    if (i === 3) { c.moveTo(-80, 60); c.lineTo(-20, -40); c.lineTo(0, -15); c.lineTo(22, -55); c.lineTo(80, 60); c.moveTo(18, -52); c.lineTo(26, -52); }
    if (i === 4) { for (let r = 0; r < 3; r++) { const y = -10 + r * 26; for (let x = -76; x <= 76; x += 4) { const yy = y + Math.sin(x / 12 + lt * 3 + r) * 6; x === -76 ? c.moveTo(x, yy) : c.lineTo(x, yy); } } }
    if (i === 5) { c.moveTo(-90, 60); c.lineTo(90, 60); c.moveTo(6, -18); c.arc(0, -18, 6, 0, 7); c.moveTo(0, -10); c.lineTo(0, 22); c.moveTo(0, 22); c.lineTo(-9, 54); c.moveTo(0, 22); c.lineTo(9, 54); c.moveTo(-14, 0); c.lineTo(14, 0); }
    c.stroke();
    // 风险项上方的小闪电
    if (i >= 2) { const f = 0.4 + 0.6 * flicker(lt + i, 6, i); c.save(); c.strokeStyle = `rgba(255,220,140,${0.85 * f})`; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-70, -80); c.lineTo(-80, -58); c.lineTo(-70, -60); c.lineTo(-78, -40); c.stroke(); c.restore(); }
  }
}

// ════════ 结尾 ════════
{
  const D = TL.end, GA = 5.2, FB = 6.2;
  scene({
    name: 'end', t0: D.t0, dur: D.dur, fi: D.fi, fo: 1.4,
    setup(S, sc) {
      const o = sc.t0, R = RNG(SEED * 59);
      S.fl = []; for (let k = 0; k < 420; k++) { const lat = R.gauss() * 0.35, lon = R.range(-1.3, 1.3); S.fl.push({ lat, lon, t: R.range(0.3, GA), s: R.range(0.5, 1) }); }
      S.stars = makeStars(SEED + 160, 300, 1080);
      S.b = genBolt(SEED * 59 + 7, { x0: 990, y0: 40, x1: 930, y1: 860, step: 20, branch: 0.17, maxDepth: 3, gravAng: Math.PI / 2, grav: 0.05, branchLen: [0.08, 0.32] });
      S.f = flashOf(S.b, { t0: FB, lead: 1.0, stepped: true, steps: 36, strokes: [0, 0.09], peaks: [1.7, 1.1], tau: 0.08, after: 1.2, afterK: 0.4, leadLvl: 0.36 });
      hit(o + S.f.tc, 0.9, 'final');
      mk('sub', { text: '就在这三分钟里', at: o + 0.5, out: o + 4.9, x: 960, y: 170, ax: 0.5, ay: 0.5, size: 38, color: C_TXT, tracking: 0.2 });
      T(Object.assign({}, ST.num, { at: o + 0.9, out: o + 4.95, x: 960, y: 262, ax: 0.5, ay: 0.5, size: 92, weight: 700, family: 'sans', glow: [140, 190, 255], glowK: 0.7, count: { from: 0, to: 8000, dur: 3.0, chars: '约道闪电', fmt: v => `约 ${(Math.round(v / 10) * 10).toLocaleString('en-US')} 道闪电` } }));
      mk('note', { text: '卫星观测：全球平均每秒约 40–50 次闪电', at: o + 2.6, out: o + 5.0, x: 960, y: 340, ax: 0.5, ay: 0.5, size: 22 });
      mk('head', { text: '没有哪两道，走过同一条路', at: o + FB + 1.55, out: o + D.dur - 1.6, x: 960, y: 965, ax: 0.5, ay: 0.5, size: 56, weight: 700, tracking: 0.18, inA: 'focus', stagger: 0.09, order: 'center', outA: 'blur', outDur: 0.9 });
    },
    draw(ctx, lt, t, S) {
      sky(ctx, [0, 0, 0], [0, 0, 0]);
      const ga = 1 - smooth((lt - GA) / 0.8);
      if (ga > 0) {
        camera(ctx, 0, 0, 1.0 + lt * 0.006);
        ctx.save(); ctx.globalAlpha = ga;
        drawStars(ctx, S.stars, lt, 0.6);
        const cx = 960, cy = 1700, R = 1300;
        const eg = ctx.createRadialGradient(cx, cy - 300, R * 0.5, cx, cy, R); eg.addColorStop(0, '#060a18'); eg.addColorStop(1, '#0c1430');
        ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(90,150,255,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, 7); ctx.stroke();
        const g = GL.ctx; g.strokeStyle = `rgba(70,130,255,${0.5 * ga})`; g.lineWidth = 30; g.beginPath(); g.arc(cx, cy, R + 8, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
        for (const f of S.fl) {
          const d = lt - f.t; if (d < 0 || d > 0.4) continue;
          const a = Math.exp(-d / 0.08) * f.s;
          const ang = -Math.PI / 2 + f.lon * 0.55, rr = R * (0.55 + 0.4 * (0.5 - f.lat));
          const x = cx + Math.cos(ang) * rr * 1.0, y = cy + Math.sin(ang) * rr;
          if (y > 1080 || y < cy - R) continue;
          glowDot(ctx, x, y, 2 + a * 2, [220, 235, 255], a * ga, 1.4);
        }
        ctx.restore();
      }
      if (lt > FB - 0.2) {
        camera(ctx, 0, 0, 1.0 + (lt - FB) * 0.004);
        const st = S.f.state(lt);
        // 冷却：白 → 蓝 → 紫 → 暗红
        const cool = clamp((lt - S.f.tc - 0.3) / 2.6);
        const glow = cool < 0.5 ? mixc(COL.blue, COL.violet, cool * 2) : mixc(COL.violet, [200, 50, 60], (cool - 0.5) * 2);
        const core = mixc(COL.core, [255, 120, 110], cool);
        if (lt > S.f.tc + 0.3) st.I = Math.max(st.I, 0.7 * (1 - smooth((lt - S.f.tc - 0.3) / 3.2)));
        drawBolt(ctx, S.b, st, { width: 2.8, glow, core });
        const L = S.f.light(lt);
        if (L > 0.2) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(200,215,255,${clamp((L - 0.2) * 0.1)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
      }
    },
  });
}
section('end', TL.end.t0, DURATION, 'end');
