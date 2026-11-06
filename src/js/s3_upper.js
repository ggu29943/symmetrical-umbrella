// ───────────────────────── 高空瞬态发光事件 · 球状闪电 ─────────────────────────
'use strict';

// ════════ 红色精灵 · 蓝色喷流 · ELVES ════════
{
  const D = TL.tle;
  const yA = km => 1000 - km * 9.4;                     // 高度 → 画面 y
  const curve = x => (x - 960) * (x - 960) / 24000;      // 地球曲率
  const SP1 = 4.75, SP2 = 6.15, GH = 8.45, BJ = 11.35, GJ = 14.2, EL = 17.05, GX = 1450, GHX = 1250;
  // 巨型喷流的"树"：返回与 genBolt 同结构的 B，可直接交给 drawBolt。
  // 每段的路程 da/db = 离云顶的高度（+ 每根分支少量延迟），于是生长前沿自下而上推进；分叉越高越多、张角越大
  function genJet(seed, x0, y0, yA) {
    const R = RNG(seed), segs = [], U = -Math.PI / 2, kmOf = y => (1000 - y) / 9.4;
    const halfW = km => 16 + 250 * Math.pow(clamp((km - 16) / 72), 1.6);      // 树冠外形（半宽，像素）
    const KM = [12, 35, 50, 62, 74, 90];
    const GLW = [[70, 125, 255], [95, 110, 255], [150, 80, 235], [200, 60, 185], [228, 48, 120], [235, 45, 95]];
    const CORE = [[225, 238, 255], [215, 220, 255], [232, 202, 250], [250, 186, 230], [255, 176, 202], [255, 170, 190]];
    const pick = (T, km) => { if (km <= KM[0]) return T[0]; for (let i = 1; i < KM.length; i++) if (km <= KM[i]) return mixc(T[i - 1], T[i], (km - KM[i - 1]) / (KM[i] - KM[i - 1])); return T[T.length - 1]; };
    const NB = 16, bandKm = b => 12 + (b + 0.5) / NB * 78;
    let count = 0;
    const stack = [{ x: x0, y: y0, ang: U, base: U, lvl: 0, dd: 0, top: R.range(34, 39), km0: kmOf(y0) }];
    while (stack.length) {
      const st = stack.pop(); count++; st.lim = R.range(0.55, 0.95);
      let { x, y, ang } = st; const segStart = segs.length;
      for (let n = 0; n < 400; n++) {
        const km = kmOf(y); if (km >= st.top) break;
        const hn = clamp((km - 25) / 55);
        const L = 7.5 * R.range(0.6, 1.4);
        ang += R.gauss() * (st.lvl ? 0.09 + 0.12 * hn : 0.06);
        ang += angDiff(st.base, ang) * 0.18;
        const ex = (x - x0) / halfW(km);
        if (Math.abs(ex) > st.lim) ang += angDiff(U - Math.sign(ex) * 0.05, ang) * 0.4 * clamp((Math.abs(ex) - st.lim) / 0.3);
        ang += angDiff(U, ang) * 0.06 * smooth((km - 68) / 14);                // 顶端的细丝逐渐转为竖直（像精灵的触须）
        ang = U + clamp(angDiff(ang, U), -1.25, 1.25);
        const nx = x + Math.cos(ang) * L, ny = y + Math.sin(ang) * L;
        // 中点位移，让通道有锯齿感
        const mx = (x + nx) / 2, my = (y + ny) / 2, g = R.gauss() * 0.11 * L;
        const pts = [[x, y], [mx - Math.sin(ang) * g, my + Math.cos(ang) * g], [nx, ny]];
        for (let i = 0; i < 2; i++) segs.push({ ax: pts[i][0], ay: pts[i][1], bx: pts[i + 1][0], by: pts[i + 1][1], da: y0 - pts[i][1] + st.dd, db: y0 - pts[i + 1][1] + st.dd, lvl: Math.min(st.lvl, 3), main: st.lvl === 0, j: 0, w: 1 });
        x = nx; y = ny;
        // 主干下段偶尔有短小的侧枝
        if (st.lvl === 0 && R() < 0.035) { const sd = R.sign(), ba = ang + sd * R.range(0.3, 0.6); stack.push({ x, y, ang: ba, base: ba, lvl: 2, dd: st.dd + R.range(4, 16), top: kmOf(y) + R.range(2.5, 6), km0: kmOf(y) }); }
        // 上段分叉：越高越频繁、张角越大
        if (st.lvl >= 1 && count < 95 && R() < (0.012 + 0.12 * hn) * (st.lvl >= 3 ? 0.65 : 1)) {
          const sd = R.sign(), th = (0.14 + 0.7 * hn) * R.range(0.75, 1.2);
          const cb = U + clamp(angDiff(st.base + sd * th * 0.85, U), -1.0, 1.0);
          stack.push({ x, y, ang: ang + sd * th, base: cb, lvl: st.lvl + 1, dd: st.dd + R.range(2, 22), top: R() < 0.22 ? Math.min(88, kmOf(y) + R.range(4, 12)) : R.range(76, 89), km0: kmOf(y) });
          ang -= sd * th * 0.25; st.base = U + clamp(angDiff(st.base - sd * th * 0.15, U), -1.0, 1.0);
        }
      }
      // 主干到 34–39 公里处一分为三，各自继续向上生长
      if (st.lvl === 0) {
        const k = 3; for (let i = 0; i < k; i++) { const sp = (i - (k - 1) / 2) * R.range(0.22, 0.34) + R.range(-0.05, 0.05); stack.push({ x, y, ang: ang + sp, base: U + sp * 0.8, lvl: 1, dd: st.dd + R.range(0, 10), top: R.range(80, 89), km0: kmOf(y) }); }
      }
      // 分支从根部到末端逐渐变细、变暗
      const n = segs.length - segStart;
      if (st.lvl) for (let i = segStart; i < segs.length; i++) segs[i].w = 1 - 0.62 * (i - segStart) / Math.max(1, n);
    }
    const B = { segs, main: [{ x: x0, y: y0, d: 0 }], Dmain: 1, seed, maxD: Math.max(...segs.map(s => Math.max(s.da, s.db))) };
    return { B, y0, NB, halfW, glowAt: km => pick(GLW, km),
      bandOf: y => (kmOf(y) - 12) / 78 * NB, bandCol: b => [pick(CORE, bandKm(b)), pick(GLW, bandKm(b))] };
  }
  scene({
    name: 'tle', t0: D.t0, dur: D.dur, fi: D.fi,
    setup(S, sc) {
      const o = sc.t0, R = RNG(SEED * 47);
      S.stars = makeStars(SEED + 120, 420, 820);
      S.tops = [[-80, 0.9, 1], [230, 1.1, 2], [560, 0.95, 3], [860, 1.2, 4], [1180, 1.0, 1], [1480, 1.1, 2], [1760, 0.95, 3]];
      // 精灵：每根"胡萝卜"由头部弥散红光 + 向下的细丝组成
      const mkSprite = (cx, n, sc2) => {
        const cols = [];
        for (let k = 0; k < n; k++) {
          const x = cx + (k - (n - 1) / 2) * R.range(38, 60) * sc2 + R.range(-12, 12), top = yA(R.range(80, 86)), head = yA(R.range(72, 76));
          const tend = genBolt(SEED * 47 + cols.length + cx, { x0: x, y0: head, angle: Math.PI / 2 + R.range(-0.1, 0.1), length: (yA(R.range(50, 56)) - head), step: 9, wander: 0.18, pull: 0.3, branch: 0.4, maxDepth: 3, branchAng: [0.08, 0.35], branchLen: [0.2, 0.55], rough: 0.18, gravAng: Math.PI / 2, grav: 0.15 });
          const up = genBolt(SEED * 47 + 90 + cols.length + cx, { x0: x, y0: head, angle: -Math.PI / 2, length: head - top, step: 8, wander: 0.15, branch: 0.3, maxDepth: 2, branchAng: [0.05, 0.3], branchLen: [0.2, 0.5], rough: 0.15 });
          cols.push({ x, top, head, tend, up, w: R.range(18, 30) * sc2, dl: R.range(0, 0.06) });
        }
        return cols;
      };
      S.sp1 = mkSprite(900, 6, 1); S.sp2 = mkSprite(470, 3, 0.75);
      S.jet = []; for (let k = 0; k < 6; k++) S.jet.push(genBolt(SEED * 47 + 200 + k, { x0: 560 + R.range(-6, 6), y0: 872 + curve(560), angle: -Math.PI / 2 + (k - 2.5) * 0.065, length: 872 - yA(R.range(42, 47)), step: 10, wander: 0.14, pull: 0.25, branch: 0.32, maxDepth: 2, branchAng: [0.06, 0.25], branchLen: [0.15, 0.4], rough: 0.16 }));
      // 巨型喷流：一整棵连续生长的"树"。云顶处是一根明亮的主干，向上逐级分叉；越往高处分叉越多、张角越大，
      // 树冠在 60–90 公里向两侧大幅铺开。颜色按高度连续过渡：底部蓝白 → 中段蓝紫 → 顶部红（与精灵同色）
      S.gj = genJet(SEED * 47 + 777, GX, 872 + curve(GX), yA);
      [0.35, 0.95, 1.7, 2.3].forEach(tt => hit(o + tt, 0.2, 'soft'));
      hit(o + GJ - 0.05, 0.4, 'strike'); hit(o + GJ + 0.1, 0.75, 'shimmer');
      hit(o + SP1 - 0.08, 0.5, 'strike'); hit(o + SP1, 0.6, 'shimmer'); hit(o + SP2, 0.4, 'shimmer'); hit(o + BJ, 0.6, 'shimmer'); hit(o + EL - 0.05, 0.5, 'strike'); hit(o + EL, 0.6, 'shimmer');
      // 文字
      S.sp3 = mkSprite(GHX, 7, 1.25);
      hit(o + GH - 0.08, 0.5, 'strike'); hit(o + GH, 0.6, 'shimmer'); hit(o + GH + 0.3, 0.35, 'shimmer');
      mk('head', { text: '云顶之上', at: o + 1.3, out: o + 4.15, x: 960, y: 380, ax: 0.5, ay: 0.5, size: 66, weight: 900, inA: 'focus', stagger: 0.12, order: 'center', outA: 'blur' });
      mk('sub', { text: '还有一个 1989 年才首次被拍到的世界', at: o + 1.9, out: o + 4.2, x: 960, y: 460, ax: 0.5, ay: 0.5, size: 34, color: C_TXT });
      const head1 = () => [900, yA(78)];
      TERM(o + SP1 + 0.25, o + 8.0, 1130, 250, '红色精灵 RED SPRITE', ['出现在 50–90 公里高空', '尺度可达数十公里，只闪现几毫秒'], { term: { glow: [255, 70, 90], lead: { from: head1, ox: -14, delay: 0.1, color: 'rgba(255,170,180,0.7)' } } });
      TERM(o + GH + 0.35, o + GH + 2.6, 230, 250, '绿色幽灵 GHOST', ['出现在部分红色精灵顶端的绿色辉光', '2019 年才首次被拍到', { text: '发光来源：除了氧，光谱里还有铁、镍 · 仍在研究', preset: 'note', size: 22, hl: [['仍在研究', C_AMB]] }], { term: { glow: [90, 255, 150], color: '#d6ffe4', enColor: '#9dffc0' } });
      TERM(o + BJ + 0.2, o + BJ + 2.55, 660, 600, '蓝色喷流 BLUE JET', ['从云顶向上射出', '可达约 40–50 公里'], { term: { glow: [90, 140, 255] } });
      TERM(o + GJ + 0.35, o + GJ + 2.65, 640, 410, '巨型喷流 GIGANTIC JET', ['从云顶直冲约 70–90 公里高空', '把雷暴云与电离层"连通"', { text: '2001 年才首次被记录到', preset: 'note', size: 22 }], { term: { glow: [200, 110, 255] } });
      TERM(o + EL + 0.2, o + EL + 3.1, 1220, 300, '淘气精灵 ELVES', ['约 90 公里高空急速扩张的光环', '直径可达数百公里，持续不到 1 毫秒'], { term: { glow: [255, 120, 70] } });
      mk('note', { text: '示意动画：这些现象极其短暂，此处已放慢', at: o + 2.6, out: o + EL + 3.15, x: 1850, y: 1040, ax: 1, ay: 1, size: 20 });
    },
    draw(ctx, lt, t, S) {
      const cy = lerp(-600, 0, smoother(lt / 2.6));
      camera(ctx, 0, cy, 1.0);
      sky(ctx, [1, 2, 8], [12, 18, 40], -200, 900);
      drawStars(ctx, S.stars, lt, 0.9);
      // 气辉
      ctx.save(); ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(80,220,140,0.07)'; ctx.beginPath(); for (let x = -40; x <= W + 40; x += 40) { const y = yA(95) + curve(x); x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); ctx.restore();
      // 高度标尺
      const ra = smooth((lt - 1.8) / 0.8) * (1 - smooth((lt - EL - 3.15) / 0.5));
      if (ra > 0) {
        ctx.save(); ctx.globalAlpha = ra; ctx.strokeStyle = 'rgba(170,200,245,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(84, yA(0) - 40); ctx.lineTo(84, yA(100)); ctx.stroke();
        for (let k = 10; k <= 100; k += 10) { ctx.beginPath(); ctx.moveTo(78, yA(k)); ctx.lineTo(92, yA(k)); ctx.stroke(); ctext(ctx, k + ' 公里', 100, yA(k), { size: 17, family: FONT.sans }); }
        ctx.restore();
      }
      // 云顶光源（雷暴内部的闪电从下方照亮云顶）
      const fl = [[SP1 - 0.08, 900, 1.0], [SP2 - 0.06, 470, 0.7], [GH - 0.08, GHX, 1.0], [BJ - 0.05, 560, 0.4], [GJ - 0.05, GX, 0.8], [EL - 0.05, 1300, 1.1], [2.1, 1500, 0.4], [3.3, 300, 0.35], [9.8, 1650, 0.4], [12.9, 760, 0.35]];
      const lights = fl.map(([tt, x, k]) => ({ x, y: 900, r: 330, i: (pulse(lt, tt, 0.06) + pulse(lt, tt + 0.05, 0.05) * 0.6) * k * 0.8 }));
      // 地球与远方大气：云顶后方是被地平线微光照亮的薄雾，而不是一条黑带
      ctx.fillStyle = '#060912'; ctx.beginPath(); ctx.moveTo(-60, 2000); for (let x = -60; x <= W + 60; x += 30) ctx.lineTo(x, 892 + curve(x)); ctx.lineTo(W + 60, 2000); ctx.fill();
      const haze = ctx.createLinearGradient(0, 800, 0, 960); haze.addColorStop(0, 'rgba(50,75,135,0)'); haze.addColorStop(0.55, 'rgba(50,75,135,0.22)'); haze.addColorStop(1, 'rgba(36,48,82,0.4)');
      ctx.fillStyle = haze; ctx.fillRect(-60, 800, W + 120, 170);
      // 雷暴云体：云顶带下方是厚厚的云体，一直延伸到镜头下方（镜头从云中升起时看到的是云，而不是黑底）
      const body = TEX.get('cbody3', () => makeCloud(SEED + 128, 1600, 760, (u, v) => smooth((v - 0.3) / 0.1 + (fbm(u * 5, 0.4, 3, SEED + 129) - 0.5) * 1.2), { puffs: 2200, rMin: 0.04, rMax: 0.22, flat: () => 0.7, th0: 0.4, base: 0.55, ao: 3.2, dark: [8, 10, 21], top: [54, 64, 96] }));
      const topT = TEX.get('tops', () => makeCloud(SEED + 125, 1600, 300, (u, v) => { const e = 0.42 + (fbm(u * 3, 0.2, 3, SEED + 126) - 0.5) * 0.45 + (fbm(u * 11, 0.5, 2, SEED + 127) - 0.5) * 0.22; return smooth((v - e) / 0.12); }, { puffs: 1200, rMin: 0.04, rMax: 0.22, flat: () => 0.7, th0: 0.4, dark: [10, 13, 26], top: [60, 72, 104] }));
      // 云体内部的闪电闪光（镜头穿出云层的那几秒）
      const inner = [[0.35, 520, 1250, 0.75], [0.95, 1420, 1380, 0.6], [1.05, 1350, 1300, 0.45], [1.7, 860, 1150, 0.55], [2.3, 300, 1300, 0.4]]
        .map(([tt, x, y, k]) => ({ x, y, r: 560, i: (pulse(lt, tt, 0.07) + pulse(lt, tt + 0.06, 0.05) * 0.6) * k }));
      drawCloud(ctx, topT, -120, 760, 2160, 360, lights, { amb: 0.035 });
      // 云体从云顶带的下半部分柔和地接上（顶缘羽化、不规则），一直延伸到镜头下方
      drawCloud(ctx, body, -140, 712, 2200, 960, [], { amb: 0.02 });
      // 越往下越隐入暗处（只有云顶被星光勾亮）；云内闪光叠在暗处之后，才显得透亮
      const deep = ctx.createLinearGradient(0, 1020, 0, 1720); deep.addColorStop(0, 'rgba(2,3,8,0)'); deep.addColorStop(0.3, 'rgba(2,3,8,0.45)'); deep.addColorStop(1, 'rgba(2,3,8,0.8)');
      ctx.fillStyle = deep; ctx.fillRect(-160, 1020, W + 320, 760);
      drawCloud(ctx, body, -140, 712, 2200, 960, inner, { litOnly: true });
      // —— 红色精灵 ——
      const sprite = (cols, t0, k) => {
        for (const c of cols) {
          const dt = lt - t0 - c.dl; if (dt < 0) continue;
          const a = (dt < 0.05 ? dt / 0.05 : Math.exp(-(dt - 0.05) / 0.32)) * k; if (a < 0.01) continue;
          const g = GL.ctx;
          // 头部与上方弥散红光
          const hg = ctx.createRadialGradient(c.x, c.head - 20, 0, c.x, c.head - 20, c.w * 3.2);
          hg.addColorStop(0, rgba([255, 80, 100], 0.32 * a)); hg.addColorStop(0.5, rgba([255, 60, 90], 0.14 * a)); hg.addColorStop(1, 'rgba(255,40,80,0)');
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(c.x, c.head - 25, c.w * 2.2, (c.head - c.top) * 1.3, 0, 0, 7); ctx.fill(); ctx.restore();
          g.fillStyle = rgba([255, 50, 80], 0.28 * a); g.beginPath(); g.ellipse(c.x, c.head - 20, c.w * 1.8, (c.head - c.top) * 1.1, 0, 0, 7); g.fill();
          // 下垂的触须（向下传播）与上方细丝
          const grow = clamp(dt / 0.09);
          drawBolt(ctx, c.tend, { lf: grow * c.tend.maxD, I: a * 0.9, rf: -1, bI: 0.9 }, { width: 1.5, core: [255, 175, 200], glow: [210, 40, 110], glowK: 1.2 });
          drawBolt(ctx, c.up, { lf: grow * c.up.maxD, I: a * 0.6, rf: -1, bI: 0.8 }, { width: 1.2, core: [255, 160, 170], glow: [255, 40, 70], glowK: 1.0 });
        }
      };
      sprite(S.sp1, SP1, 1.0); sprite(S.sp2, SP2, 0.75); sprite(S.sp3, GH, 1.1);
      // —— 绿色幽灵（GHOST）：精灵顶端稍后出现、停留更久的绿色辉光 ——
      const hd = lt - GH - 0.12;
      if (hd > 0) {
        const a = smooth(hd / 0.18) * Math.exp(-Math.max(0, hd - 0.5) / 0.8);
        if (a > 0.01) {
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          const caps = S.sp3.map(c => ({ x: c.x, y: c.top - 8 + Math.sin(lt * 2 + c.x) * 3, r: c.w * 2.4 }));
          caps.push({ x: GHX, y: yA(86), r: 230, flat: 0.22, k: 0.6 });
          for (const c of caps) {
            ctx.save(); ctx.translate(c.x, c.y - hd * 6); ctx.scale(1, c.flat || 0.42);
            const g = ctx.createRadialGradient(0, 0, 0, 0, 0, c.r); g.addColorStop(0, rgba([110, 255, 160], 0.42 * a * (c.k || 1))); g.addColorStop(0.5, rgba([70, 230, 130], 0.16 * a * (c.k || 1))); g.addColorStop(1, 'rgba(60,220,120,0)');
            ctx.fillStyle = g; ctx.fillRect(-c.r, -c.r, c.r * 2, c.r * 2); ctx.restore();
          }
          ctx.restore();
          const g2 = GL.ctx; g2.fillStyle = rgba([80, 255, 140], 0.35 * a); g2.beginPath(); g2.ellipse(GHX, yA(86), 230, 55, 0, 0, 7); g2.fill();
        }
      }
      // —— 蓝色喷流 ——
      const jd = lt - BJ;
      if (jd > 0) {
        const grow = Ease.outCubic(clamp(jd / 0.4)), a = jd < 0.4 ? 1 : Math.exp(-(jd - 0.4) / 0.45);
        if (a > 0.01) {
          const x0 = 560, y0 = 872 + curve(560), yt = lerp(y0, yA(45), grow);
          const cg = ctx.createLinearGradient(0, y0, 0, yt); cg.addColorStop(0, rgba([120, 170, 255], 0.5 * a)); cg.addColorStop(1, 'rgba(60,110,255,0)');
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(x0 - 10, y0); ctx.lineTo(x0 - 70 * grow, yt); ctx.lineTo(x0 + 70 * grow, yt); ctx.lineTo(x0 + 10, y0); ctx.fill(); ctx.restore();
          for (const B of S.jet) drawBolt(ctx, B, { lf: grow * B.maxD, I: a * 0.9, rf: -1, bI: 0.8 }, { width: 1.5, core: [200, 225, 255], glow: [60, 120, 255], glowK: 1.2 });
        }
      }
      // —— 巨型喷流 ——
      const gd = lt - GJ;
      if (gd > 0) {
        const J = S.gj, a = gd < 0.7 ? 1 : Math.exp(-(gd - 0.7) / 0.55);
        if (a > 0.01) {
          const lf = Ease.outCubic(clamp(gd / 0.55)) * J.B.maxD, yF = J.y0 - lf;   // 生长前沿（自下而上）
          // 一整片扇形弥散辉光：沿树的外形，颜色随高度渐变（同一个形状，不再是两段拼接）
          const fan = (c2, k, wk) => {
            const yS = Math.max(yF, yA(90)); if (J.y0 - yS < 4) return;
            const gr = c2.createLinearGradient(0, J.y0, 0, yS);
            for (let i = 0; i <= 10; i++) {
              const f = i / 10, y = lerp(J.y0, yS, f), km = (1000 - y) / 9.4;
              const front = smooth((y - yF) / 80), foot = 0.45 + 0.55 * smooth((km - 12.5) / 4), crown = 1 - smooth((km - 76) / 13);   // 前沿、云顶、顶端都渐隐
              gr.addColorStop(f, rgba(J.glowAt(km), k * a * front * foot * crown));
            }
            c2.fillStyle = gr; c2.beginPath();
            for (let i = 0; i <= 40; i++) { const y = lerp(J.y0, yS, i / 40); c2.lineTo(GX - J.halfW((1000 - y) / 9.4) * wk, y); }
            for (let i = 40; i >= 0; i--) { const y = lerp(J.y0, yS, i / 40); c2.lineTo(GX + J.halfW((1000 - y) / 9.4) * wk, y); }
            c2.closePath(); c2.fill();
          };
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.filter = 'blur(28px)'; fan(ctx, 0.15, 0.6); ctx.filter = 'blur(12px)'; fan(ctx, 0.1, 0.25); ctx.restore();
          GL.ctx.save(); GL.ctx.filter = 'blur(6px)'; fan(GL.ctx, 0.28, 0.75); GL.ctx.restore();
          drawBolt(ctx, J.B, { lf, I: a * 0.95, rf: -1, bI: 0.9 }, { width: 2.4, glowK: 1.15, bands: J.NB, bandOf: J.bandOf, bandCol: J.bandCol });
          drawBolt(ctx, J.B, { lf, I: a * 0.45, rf: -1, onlyMain: true }, { width: 5, glowK: 0.9, bands: J.NB, bandOf: J.bandOf, bandCol: J.bandCol });   // 主干更粗更亮
        }
      }
      // —— ELVES ——
      const ed = lt - EL;
      if (ed > 0 && ed < 1.6) {
        const p = Ease.outCubic(clamp(ed / 0.9)), rx = 20 + p * 760, ry = rx * 0.085, a = (1 - smooth((ed - 0.25) / 1.2)) * smooth(ed / 0.06);
        const cx = 1300, cyy = yA(90) + curve(1300);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 3; k++) { ctx.strokeStyle = rgba([255, 110 - k * 20, 70], a * (0.6 - k * 0.15)); ctx.lineWidth = 4 + k * 7 + p * 10; ctx.beginPath(); ctx.ellipse(cx, cyy, rx, ry, 0, 0, 7); ctx.stroke(); }
        ctx.restore();
        const g = GL.ctx; g.strokeStyle = rgba([255, 90, 50], a * 0.8); g.lineWidth = 26; g.beginPath(); g.ellipse(cx, cyy, rx, ry, 0, 0, 7); g.stroke();
      }
    },
  });
}

// ════════ 球状闪电 ════════
{
  const D = TL.ball, B0 = 1.0, B1 = 8.4;
  scene({
    name: 'ball', t0: D.t0, dur: D.dur, fi: D.fi,
    setup(S, sc) {
      const o = sc.t0;
      S.rain = makeRain(SEED + 140, 420, { alpha: 0.1, speed: 1200 });
      S.tree = makeTree(SEED + 141, 1560, 770, 260);
      S.G = makeGround(SEED + 142, makeRidge(SEED + 142, 772, 6, 2, 2), { top: [24, 28, 44], mid: [10, 12, 20], bot: [3, 4, 8], rows: 10, grass: 0.9 });
      S.posts = []; for (let k = 0; k < 12; k++) { const z = k / 11; S.posts.push([lerp(150, 1300, Math.pow(z, 0.8)), lerp(830, 760, z), lerp(70, 22, z)]); }
      S.pos = lt => { const p = clamp((lt - B0) / (B1 - B0)); return [lerp(560, 1360, p) + Math.sin(lt * 0.9) * 30, 640 + Math.sin(lt * 1.3) * 22 + (noise1(lt * 1.5, 4) - 0.5) * 26]; };
      hit(o + B0, 0.4, 'shimmer'); hit(o + B1, 0.45, 'pop');
      TERM(o + 0.6, o + 9.55, 110, 200, '球状闪电 BALL LIGHTNING', [{ text: '漂浮的光球，可持续数秒', color: C_TXT }, '2012 年，中国科研人员在青海偶然记录到它的光谱'], { term: { glow: [255, 170, 100] } });
      mk('note', { text: '光谱示意', at: o + 3.3, out: o + 9.5, x: 110, y: 362, ay: 0.5, size: 20 });
      mk('note', { text: '硅', at: o + 3.6, out: o + 9.5, x: 110 + 500 * (390.6 - 380) / 320, y: 440, ax: 0.5, ay: 0.5, size: 20, color: '#dfe8ff' });
      mk('note', { text: '钙', at: o + 3.7, out: o + 9.5, x: 110 + 500 * (422.7 - 380) / 320, y: 440, ax: 0.5, ay: 0.5, size: 20, color: '#dfe8ff' });
      mk('note', { text: '铁', at: o + 3.9, out: o + 9.5, x: 110 + 500 * (527 - 380) / 320, y: 440, ax: 0.5, ay: 0.5, size: 20, color: '#dfe8ff' });
      UNK(o + 5.4, o + 9.6, 960 - (6 * 54 * 1.2 + 54) / 2, 900, '成因尚无定论', { size: 54 });
      mk('sub', { text: '土壤中汽化的硅？', at: o + 6.1, out: o + 9.5, x: 1200, y: 250, ay: 0.5, size: 28, color: 'rgba(200,212,235,0.7)', drift: [3, -2] });
      mk('sub', { text: '微波？', at: o + 6.5, out: o + 9.52, x: 1620, y: 320, ay: 0.5, size: 28, color: 'rgba(200,212,235,0.7)', drift: [-2, -3] });
      mk('sub', { text: '等离子体结构？', at: o + 6.9, out: o + 9.54, x: 1330, y: 390, ay: 0.5, size: 28, color: 'rgba(200,212,235,0.7)', drift: [2, 2] });
      mk('note', { text: '——几种假说，均未证实', at: o + 7.3, out: o + 9.56, x: 1330, y: 450, ay: 0.5, size: 22 });
    },
    draw(ctx, lt, t, S) {
      camera(ctx, 0, 0, 1.0 + lt * 0.004);
      sky(ctx, [4, 6, 14], [16, 18, 30], 0, 770);
      // 远处云底的微弱闪光
      const far = pulse(lt, 2.4, 0.08) * 0.4 + pulse(lt, 6.8, 0.08) * 0.3;
      if (far > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba([80, 100, 160], far * 0.3); ctx.fillRect(-W, -H, W * 3, 900); ctx.restore(); }
      // 光球
      const vis = smooth((lt - B0) / 0.5) * (lt < B1 ? 1 : 0);
      const [bx, by] = S.pos(lt);
      const fk = 0.85 + 0.15 * noise1(lt * 14, 2);
      // 湿地面（被光球照亮）
      drawGround(ctx, S.G, { flash: far * 0.4, lights: [{ x: bx, y: 800 + (by - 600) * 0.4, r: 420, i: 0.22 * vis * fk, c: [255, 160, 80], flat: 0.3 }] });
      // 地面倒影
      if (vis > 0) {
        const ry = 1540 - by, rg = ctx.createLinearGradient(0, 780, 0, ry + 140);
        rg.addColorStop(0, rgba([255, 170, 90], 0.0)); rg.addColorStop(0.35, rgba([255, 170, 90], 0.16 * vis * fk)); rg.addColorStop(1, 'rgba(255,150,70,0)');
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rg; ctx.filter = 'blur(6px)';
        ctx.beginPath(); ctx.moveTo(bx - 8, 776); ctx.lineTo(bx - 26, ry + 140); ctx.lineTo(bx + 26, ry + 140); ctx.lineTo(bx + 8, 776); ctx.fill(); ctx.filter = 'none'; ctx.restore();
        // 照亮周围
        const am = ctx.createRadialGradient(bx, by, 0, bx, by, 520); am.addColorStop(0, rgba([255, 160, 80], 0.16 * vis * fk)); am.addColorStop(1, 'rgba(255,160,80,0)');
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = am; ctx.fillRect(bx - 520, by - 520, 1040, 1040); ctx.restore();
      }
      // 篱笆与树（剪影）
      ctx.fillStyle = '#05060b';
      for (const [x, y, h] of S.posts) ctx.fillRect(x - h * 0.05, y - h, h * 0.1, h);
      ctx.strokeStyle = '#05060b'; ctx.lineWidth = 2; ctx.beginPath(); S.posts.forEach(([x, y, h], i) => i ? ctx.lineTo(x, y - h * 0.7) : ctx.moveTo(x, y - h * 0.7)); ctx.stroke();
      ctx.fill(S.tree.path);
      if (vis > 0) {
        const r = 13 * (0.95 + 0.08 * Math.sin(lt * 23));
        glowDot(ctx, bx, by, r * 2.0, [255, 140, 60], 0.22 * vis * fk, 1.2);
        glowDot(ctx, bx, by, r, [255, 222, 180], 0.95 * vis * fk, 2.2);
        glowDot(ctx, bx - 3, by - 3, r * 0.45, [255, 255, 245], vis, 0);
        // 细小火花
        for (let k = 0; k < 3; k++) {
          const slot = Math.floor(lt * 10) * 3 + k; if (hash1(slot, 7) < 0.55) continue;
          const a = hash1(slot, 8) * Math.PI * 2, l = 10 + hash1(slot, 9) * 18;
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba([255, 230, 200], 0.8 * vis); ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(bx + Math.cos(a) * r, by + Math.sin(a) * r); ctx.lineTo(bx + Math.cos(a) * (r + l), by + Math.sin(a) * (r + l)); ctx.stroke(); ctx.restore();
        }
      }
      // 消失：一次轻微的"噗"
      const pp = lt - B1;
      if (pp > 0 && pp < 0.5) { const a = Math.exp(-pp / 0.08), [px, py] = S.pos(B1); glowDot(ctx, px, py, 8 + pp * 160, [255, 220, 180], a * 0.7, 2); }
      drawRain(ctx, S.rain, t, 0, 0.7);
      // 光谱示意条
      const sa = smooth((lt - 3.2) / 0.7) * (1 - smooth((lt - 9.5) / 0.5));
      if (sa > 0) {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = sa;
        const x0 = 110, y0 = 382, w = 500 * Ease.outExpo(clamp((lt - 3.2) / 1.0)), h = 34;
        const sg = ctx.createLinearGradient(x0, 0, x0 + 500, 0);
        [[0, '#5a1fa0'], [0.12, '#3030ff'], [0.3, '#00b0ff'], [0.42, '#00e070'], [0.6, '#e0e000'], [0.75, '#ff8000'], [1, '#ff1000']].forEach(([s, c]) => sg.addColorStop(s, c));
        ctx.fillStyle = sg; ctx.globalAlpha = sa * 0.28; ctx.fillRect(x0, y0, w, h);
        ctx.globalAlpha = sa;
        for (const [nm, k] of [[390.6, 1], [393.4, 0.6], [396.8, 0.6], [422.7, 0.85], [438.4, 0.8], [527, 0.7]]) {
          const x = x0 + 500 * (nm - 380) / 320; if (x > x0 + w) continue;
          ctx.fillStyle = `rgba(255,255,255,${0.9 * k})`; ctx.fillRect(x - 1.2, y0, 2.4, h);
        }
        ctx.strokeStyle = 'rgba(190,210,245,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(x0 - 0.5, y0 - 0.5, w + 1, h + 1);
        ctx.restore(); Cam.apply(ctx);
      }
    },
  });
}
