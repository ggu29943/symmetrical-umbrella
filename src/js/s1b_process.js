// ───────────────────────── 梯级先导 → 回击 → 直窜先导与多次回击；雷声 ─────────────────────────
'use strict';
{
  const D = TL.process;
  const A0 = 0.9, A1 = 7.9, RET = 0.7, HOLD1 = 15.4, C0 = 15.9, SK = [17.6, 19.5, 21.3], DART = 0.6, RS = 23.5;
  const MS = [0, 58, 123, 185];
  const msAt = lt => (lt - C0) / (SK[2] - C0) * MS[3];
  scene({
    name: 'process', t0: D.t0, dur: D.dur, fi: D.fi,
    setup(S, sc) {
      S.ridge = makeRidge(SEED + 41, 905, 34, 2.0, 3);
      S.tower = makeTower(1240, ridgeY(S.ridge, 1240) + 4, 250);
      S.tree = makeTree(SEED + 42, 700, ridgeY(S.ridge, 700) + 4, 210);
      S.trees2 = [380, 520, 1560, 1760].map((x, i) => makeTree(SEED + 50 + i, x, ridgeY(S.ridge, x) + 4, 90 + i * 17));
      const J = [S.tower.top[0] - 12, S.tower.top[1] - 88]; S.J = J;
      S.B = genBolt(SEED * 19 + 1, { x0: 930, y0: 255, x1: J[0], y1: J[1], step: 21, branch: 0.15, gravAng: Math.PI / 2, grav: 0.05, maxDepth: 3, branchLen: [0.1, 0.4] });
      S.U = genBolt(SEED * 19 + 2, { x0: S.tower.top[0], y0: S.tower.top[1], x1: J[0], y1: J[1] + 1, step: 11, wander: 0.35, branch: 0, maxDepth: 0, rough: 0.25 });
      S.Ut = genBolt(SEED * 19 + 3, { x0: S.tree.top[0], y0: S.tree.top[1], angle: -Math.PI / 2 + 0.3, length: 64, step: 9, branch: 0.2, maxDepth: 1, rough: 0.3 });
      S.LL = S.U.Dmain + S.B.Dmain;
      const o = sc.t0;
      hit(o + A1, 1.0, 'strike'); SK.forEach((s, i) => hit(o + s, 0.55 - i * 0.07, 'strike'));
      [0, 0.058, 0.123, 0.185].forEach((d, i) => hit(o + RS + d, i ? 0.5 : 0.8, 'strike'));
      for (let k = 0; k < 46; k += 3) hit(o + A0 + (k / 46) * (A1 - A0), 0.08, 'tick');
      // —— 阶段 A：梯级先导 ——
      T(Object.assign({}, ST.num, { at: o + A0 + 0.05, out: o + A1 - 0.55, x: 1850, y: 74, ax: 1, ay: 0.5, size: 34, weight: 400, family: 'mono', count: { from: 0, to: 20000, dur: A1 - A0, ease: 'linear', chars: '微秒', fmt: v => `t = ${Math.round(v / 10) * 10 >= 0 ? (Math.round(v / 10) * 10).toLocaleString('en-US') : 0} 微秒` }, glow: [150, 140, 255], glowK: 0.4 }));
      mk('note', { text: '画面已放慢约 350 倍', at: o + A0 + 0.3, out: o + A1 - 0.55, x: 1850, y: 120, ax: 1, ay: 0.5, size: 21 });
      const tipF = tt => { const p = clamp((tt - o - A0) / (A1 - A0)); return S.B.at(p * S.B.Dmain); };
      mk('term', { text: '梯级先导', at: o + 1.6, out: o + 7.3, follow: tipF, dx: -92, dy: -6, ax: 1, ay: 0.5, size: 50, glow: [160, 140, 255], lead: { from: tipF, ox: 14, delay: 0.05, color: 'rgba(190,180,255,0.75)' } });
      mk('sub', { text: '每步约 50 米，停顿数十微秒', at: o + 2.6, out: o + 7.3, x: 110, y: 640, ay: 0.5, size: 32, color: C_TXT });
      mk('sub', { text: '边走边分叉，向下试探', at: o + 3.3, out: o + 7.35, x: 110, y: 698, ay: 0.5, size: 32 });
      mk('label', { text: '地面尖端伸出“上行先导”迎接', at: o + 6.3, out: o + 9.0, x: 1302, y: 722, ay: 0.5, size: 27, lead: { from: () => [S.tower.top[0] + 2, S.tower.top[1] + 26], ox: -8, delay: 0.05 } });
      // —— 阶段 B：回击 ——
      T(Object.assign({}, ST.term, { text: '回\n击', at: o + A1 + 0.05, out: o + 15.1, x: 735, y: 430, ax: 0.5, ay: 0.5, size: 150, lh: 1.12, tracking: 0, inA: 'stamp', inDur: 0.55, stagger: 0.14, outA: 'blur', outDur: 0.7, glow: [150, 200, 255], glowK: 1.3 }));
      const cx = 1390, cw = 450;
      CARD(o + 9.2, o + 14.9, cx, 250, cw, 112, '传播速度', '约 1/3 光速');
      CARD(o + 10.1, o + 15.0, cx, 384, cw, 112, '峰值电流（典型值）', { from: 0, to: 30000, dur: 1.4, chars: '约安', fmt: v => '约 ' + (Math.round(v / 100) * 100).toLocaleString('en-US') + ' 安' });
      CARD(o + 11.0, o + 15.1, cx, 518, cw, 150, '通道温度', { from: 0, to: 30000, dur: 1.4, chars: '近℃', fmt: v => '近 ' + (Math.round(v / 100) * 100).toLocaleString('en-US') + ' ℃' }, { foot: '约为太阳表面（约 5,500 ℃）的 5 倍' });
      // —— 阶段 C：直窜先导与多次回击 ——
      const mid = () => S.B.at(S.B.Dmain * 0.55);
      mk('sub', { text: '直窜先导：沿原通道再次下行', at: o + 16.5, out: o + 22.4, x: 110, y: 520, ay: 0.5, size: 34, color: C_TXT, hl: [['直窜先导', '#c8b8ff']], lead: { from: mid, ox: 470, oy: 0, delay: 0.1 } });
      mk('sub', { text: '每一次，都引发一次新的回击', at: o + 17.3, out: o + 22.45, x: 110, y: 576, ay: 0.5, size: 32 });
      mk('head', { text: '一次闪电，平均 3–5 次回击', at: o + 22.6, out: o + 25.6, x: 960, y: 130, ax: 0.5, ay: 0.5, size: 50 });
      mk('sub', { text: '所以，它看起来在闪烁', at: o + 23.0, out: o + 25.65, x: 960, y: 200, ax: 0.5, ay: 0.5, size: 34, color: C_TXT, glow: [150, 200, 255], glowK: 0.5, flick: tt => 1 + 3 * S.rsI(tt - o) });
    },
    draw(ctx, lt, t, S) {
      const B = S.B, U = S.U;
      // —— 计算闪电状态 ——
      let stB = { I: 0 }, stU = { I: 0 }, stT = { I: 0 }, light = 0, head = null, extra = [];
      if (lt >= A0 && lt < A1) {
        const p = (lt - A0) / (A1 - A0), N = 46, k = Math.floor(p * N), ph = p * N - k;
        stB = { lf: Math.min(B.Dmain, (k + 1) / N * B.Dmain), lead: 0.42, tip: 0.95 * Math.exp(-ph * 5), tipLen: B.Dmain / N * 1.4 };
        light = 0.04 + stB.tip * 0.05;
        const pu = clamp((lt - 6.4) / (A1 - 6.4)); if (pu > 0) stU = { lf: pu * U.Dmain, lead: 0.4, tip: 0.5, tipLen: 14 };
        const pt = clamp((lt - 6.7) / 0.6); if (pt > 0) stT = { lf: pt * S.Ut.maxD, lead: 0.32 };
      } else if (lt >= A1 && lt < C0) {
        const pos = clamp((lt - A1) / RET) * S.LL;
        let I = lt < A1 + RET ? 1.9 : 0.6 + 1.3 * Math.exp(-(lt - A1 - RET) / 0.35);
        I *= 1 + 0.04 * Math.sin(lt * 9);
        if (lt > HOLD1) I = lerp(I, 0.12, smooth((lt - HOLD1) / 0.9));
        const bI = 0.5 * (1 - smooth((lt - HOLD1) / 0.6));
        stU = { lf: U.Dmain, I, up: true, rf: pos };
        stB = { lf: B.Dmain, I, rf: pos > U.Dmain ? B.Dmain - (pos - U.Dmain) : B.Dmain + 1, bI, lead: pos < S.LL ? 0.4 : 0 };
        stT = { lf: S.Ut.maxD, lead: 0.32 * (1 - smooth((lt - A1) / 1.0)) };
        if (pos < S.LL) head = pos < U.Dmain ? U.at(pos) : B.at(B.Dmain - (pos - U.Dmain));
        light = I * 0.55;
      } else if (lt >= C0) {
        let I = 0.12 * (1 - smooth((lt - RS - 1.6) / 0.6)), up = 0;
        for (const s of SK) {
          if (lt >= s - DART && lt < s) { const dh = (lt - (s - DART)) / DART * S.LL; extra.push(dh); head = dh < B.Dmain ? B.at(dh) : U.at(U.Dmain - (dh - B.Dmain)); }
          if (lt >= s) { I += 1.5 * Math.exp(-(lt - s) / 0.42); }
        }
        // 真实速度重放
        const rI = S.rsI(lt);
        I += rI;
        stB = { lf: B.Dmain, I, rf: -1, bI: lt > RS && lt < RS + 0.06 ? 0.5 : 0 };
        stU = { lf: U.Dmain, I, up: true };
        light = I * 0.5;
      }
      const sh = pulse(lt, A1, 0.2) * 9 + pulse(lt, RS, 0.12) * 5;
      camera(ctx, (noise1(lt * 30, 1) - 0.5) * sh, (noise1(lt * 30, 2) - 0.5) * sh, 1.02 - lt * 0.0006);
      sky(ctx, [6, 8, 16], [16, 19, 32]);
      if (light > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba([90, 120, 200], clamp(light * 0.12)); ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore(); }
      drawCloud(ctx, baseTex(), -200, -70, 2300, 400, [{ x: 930, y: 250, r: 900, i: light * 0.9 }], { amb: 0.045 });
      // 闪电
      drawBolt(ctx, B, stB, { width: 3.0 });
      drawBolt(ctx, U, stU, { width: 2.6 });
      drawBolt(ctx, S.Ut, stT, { width: 1.8 });
      for (const dh of extra) drawBolt(ctx, B, { lf: Math.min(dh, B.Dmain), lead: 0.65, onlyMain: true }, { width: 3.0, leadCol: [200, 200, 255] });
      if (head) { glowDot(ctx, head[0], head[1], 5, [255, 255, 255], 1, 2.2); }
      // 地面
      drawRidge(ctx, S.ridge, rgba(mixc([6, 8, 13], [26, 30, 44], clamp(light * 0.5))));
      ctx.fillStyle = rgba(mixc([6, 8, 13], [22, 26, 38], clamp(light * 0.5)));
      ctx.fill(S.tree.path); S.trees2.forEach(tr => ctx.fill(tr.path)); ctx.fill(S.tower.path);
      // 时间轴（阶段 C）
      const ta = smooth((lt - 16.0) / 0.6) * (1 - smooth((lt - 25.4) / 0.6));
      if (ta > 0) {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = ta;
        const x0 = 420, x1 = 1500, y = 1000, mx = m => x0 + (x1 - x0) * m / 250;
        ctx.strokeStyle = 'rgba(170,200,245,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
        for (let m = 0; m <= 250; m += 50) { ctx.beginPath(); ctx.moveTo(mx(m), y); ctx.lineTo(mx(m), y + 8); ctx.stroke(); ctext(ctx, m + (m === 250 ? ' 毫秒' : ''), mx(m), y + 24, { align: 'center', size: 17, family: FONT.mono }); }
        const pm = clamp(msAt(lt), 0, 250);
        MS.forEach((m, i) => {
          const vis = i === 0 ? 1 : smooth((pm - m) / 3);
          const fl = lt > RS ? pulse(lt, RS + m / 1000, 0.05) : (i ? pulse(lt, SK[i - 1], 0.3) : 0);
          if (vis <= 0) return;
          const h = (i === 0 ? 70 : 52 - i * 5) * vis;
          ctx.fillStyle = `rgba(${200 + 55 * fl | 0},${225 + 30 * fl | 0},255,${0.75 + 0.25 * fl})`; ctx.fillRect(mx(m) - 2, y - h, 4, h);
          const g = GL.x4; g.save(); g.setTransform(0.25, 0, 0, 0.25, 0, 0); g.fillStyle = `rgba(140,190,255,${0.5 + fl})`; g.fillRect(mx(m) - 6, y - h, 12, h); g.restore();
          ctext(ctx, ['第 1 次', '第 2 次', '第 3 次', '第 4 次'][i], mx(m), y - h - 16, { align: 'center', size: 16, family: FONT.sans, a: vis * 0.85 });
        });
        if (lt < RS - 0.5) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(mx(pm) - 0.75, y - 84, 1.5, 92); }
        ctx.restore(); Cam.apply(ctx);
      }
      if (light > 0.3) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(210,225,255,${clamp((light - 0.3) * 0.12)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    },
  });
  const sc = SCENES[SCENES.length - 1], su = sc.setup;
  sc.setup = (S, s) => { S.rsI = lt => { let v = 0; [0, 0.058, 0.123, 0.185].forEach((d, i) => { const dt = lt - RS - d; if (dt >= 0) v += (i ? 1.1 : 1.6) * (0.85 * Math.exp(-dt / 0.03) + 0.15 * Math.exp(-dt / 0.2)); }); return v; }; su(S, s); };
}

// ════════ 雷声的成因 ════════
{
  const D = TL.thunder, SPLIT = 4.7;
  scene({
    name: 'thunder', t0: D.t0, dur: D.dur, fi: D.fi,
    setup(S, sc) {
      const o = sc.t0;
      S.ch = genBolt(SEED * 23 + 1, { x0: 560, y0: 70, x1: 520, y1: 905, step: 22, branch: 0.06, maxDepth: 1, gravAng: Math.PI / 2, grav: 0.06 });
      S.src = [0.08, 0.25, 0.42, 0.6, 0.78, 0.95].map(f => S.ch.at(f * S.ch.Dmain));
      S.L = [1480, 905];
      hit(o + 0.9, 0.7, 'boom');
      S.src.forEach((p, i) => { const d = Math.hypot(p[0] - S.L[0], p[1] - S.L[1]); hit(o + SPLIT + 0.25 + d / 420, 0.35 + 0.1 * (i % 3), 'rumble'); });
      // A
      mk('label', { text: '通道直径：仅几厘米', at: o + 0.45, out: o + 3.7, x: 1090, y: 420, ay: 0.5, size: 28, lead: { from: () => [968, 532], ox: -10, delay: 0.05 } });
      mk('head', { text: '几微秒内急剧升温，空气猛烈膨胀', at: o + 0.9, out: o + 3.95, x: 960, y: 150, ax: 0.5, ay: 0.5, size: 48 });
      mk('term', { text: '冲击波', at: o + 1.5, out: o + 4.0, x: 800, y: 905, ax: 1, ay: 0.5, size: 46, inA: 'stamp' });
      T({ kind: 'line', at: o + 2.0, out: o + 3.95, x1: 830, y1: 905, x2: 1060, y2: 905, color: 'rgba(170,210,255,0.85)', width: 2, inDur: 0.6, outDur: 0.4 });
      mk('term', { text: '声波', at: o + 2.35, out: o + 4.05, x: 1090, y: 905, ax: 0, ay: 0.5, size: 46, inA: 'rise', color: '#cfe2ff' });
      // B
      mk('head', { text: '通道各段离你远近不同', at: o + SPLIT + 0.55, out: o + 8.7, x: 1300, y: 210, ax: 0.5, ay: 0.5, size: 46 });
      mk('sub', { text: '声音先后到达，便成了滚滚雷鸣', at: o + SPLIT + 1.2, out: o + 8.75, x: 1300, y: 280, ax: 0.5, ay: 0.5, size: 32, color: C_TXT });
    },
    draw(ctx, lt, t, S) {
      const aA = 1 - smooth((lt - SPLIT) / 0.5), aB = smooth((lt - SPLIT) / 0.5);
      sky(ctx, [4, 6, 14], [8, 11, 22]);
      if (aA > 0) {
        ctx.save(); ctx.globalAlpha = aA;
        camera(ctx, 0, 0, 1 + lt * 0.01);
        const cx = 960, cy = 540;
        const heat = smooth((lt - 0.55) / 0.25) * (1 - 0.6 * smooth((lt - 1.5) / 2));
        // 背景网格（空气）
        ctx.strokeStyle = 'rgba(100,140,210,0.07)'; ctx.lineWidth = 1;
        for (let x = 0; x <= W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y <= H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        // 冲击波 → 声波
        const st = lt - 0.9;
        if (st > 0) {
          const r = 14 + st * 560, sharp = 1 - smooth((r - 120) / 260);
          ctx.lineWidth = 2 + 3 * sharp; ctx.strokeStyle = `rgba(235,245,255,${(0.85 * sharp + 0.0) * aA})`;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
          const g = GL.ctx; g.strokeStyle = `rgba(160,200,255,${0.8 * sharp})`; g.lineWidth = 10; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
          // 声波：柔和的多重同心环
          for (let k = 0; k < 5; k++) {
            const rk = r - k * 46; if (rk < 30) continue;
            const a = (1 - sharp) * (0.4 - k * 0.07) * (1 - smooth((r - 700) / 500));
            if (a <= 0) continue;
            ctx.lineWidth = 14; ctx.strokeStyle = `rgba(120,170,255,${a * 0.35})`; ctx.beginPath(); ctx.arc(cx, cy, rk, 0, Math.PI * 2); ctx.stroke();
            ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(190,215,255,${a})`; ctx.beginPath(); ctx.arc(cx, cy, rk, 0, Math.PI * 2); ctx.stroke();
          }
        }
        // 通道截面
        glowDot(ctx, cx, cy, 9 + heat * 4, mixc([150, 140, 255], [255, 255, 255], heat), 0.9, 1 + heat * 3);
        ctx.restore();
      }
      if (aB > 0) {
        ctx.save(); ctx.globalAlpha = aB;
        const lb = lt - SPLIT;
        camera(ctx, 0, 0, 1.0);
        ctx.fillStyle = '#05070c'; ctx.fillRect(-100, 905, W + 200, 300);
        ctx.strokeStyle = 'rgba(140,170,220,0.25)'; ctx.beginPath(); ctx.moveTo(-100, 905); ctx.lineTo(W + 100, 905); ctx.stroke();
        const I = 0.22 + 1.4 * pulse(lb, 0.25, 0.08);
        drawBolt(ctx, S.ch, { I, rf: -1, bI: 0.5 }, { width: 2.6 });
        // 各段发出的声波
        S.src.forEach((p, i) => {
          const r = (lb - 0.25) * 420; if (r <= 0) return;
          const d = Math.hypot(p[0] - S.L[0], p[1] - S.L[1]);
          const a = 0.55 * (1 - smooth((r - d) / 300)) * aB;
          if (a <= 0.01) return;
          ctx.strokeStyle = `rgba(150,195,255,${a})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(p[0], p[1], r, -1.2, 1.2); ctx.stroke();
          glowDot(ctx, p[0], p[1], 3, [200, 225, 255], 0.8 * aB, 0.6);
        });
        // 听者
        const [lx, ly] = S.L; ctx.fillStyle = 'rgba(200,215,240,0.85)';
        ctx.beginPath(); ctx.arc(lx, ly - 64, 11, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(lx - 14, ly); ctx.lineTo(lx - 10, ly - 48); ctx.quadraticCurveTo(lx, ly - 54, lx + 10, ly - 48); ctx.lineTo(lx + 14, ly); ctx.fill();
        // 波形记录
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        const wx0 = 640, wx1 = 1840, wy = 1000;
        ctx.strokeStyle = 'rgba(170,200,245,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(wx0, wy); ctx.lineTo(wx1, wy); ctx.stroke();
        ctx.strokeStyle = 'rgba(210,230,255,0.95)'; ctx.lineWidth = 1.8; ctx.beginPath();
        const arr = S.src.map(p => 0.25 + Math.hypot(p[0] - S.L[0], p[1] - S.L[1]) / 420);
        for (let x = wx0; x <= wx1; x += 2) {
          const tt = (x - wx0) / (wx1 - wx0) * 4.6; if (tt > lb) break;
          let a = 0; arr.forEach((ta, i) => { if (tt > ta) a += (0.7 + 0.3 * (i % 2)) * Math.exp(-(tt - ta) / 0.45); });
          const y = wy - a * 46 * (hash1(x * 7 | 0, 3) - 0.5) * 2;
          x === wx0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke(); ctx.restore(); Cam.apply(ctx);
        ctx.restore();
      }
    },
  });
}
