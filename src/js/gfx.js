// ───────────────────────── 图形库：辉光、闪电生成与渲染、云、雨、地形、星空 ─────────────────────────
'use strict';

// ── 摄像机：所有绘制共用一个仿射矩阵（平移+缩放），辉光层同步 ──
const Cam = {
  x: 0, y: 0, s: 1, // 屏幕 = (世界 - 中心) * s + 中心 + (x,y)
  set(x = 0, y = 0, s = 1) { this.x = x; this.y = y; this.s = s; },
  apply(ctx, k = 1) { const s = this.s; ctx.setTransform(s * k, 0, 0, s * k, (W / 2 * (1 - s) + this.x) * k, (H / 2 * (1 - s) + this.y) * k); },
  toScreen(px, py) { return [(px - W / 2) * this.s + W / 2 + this.x, (py - H / 2) * this.s + H / 2 + this.y]; },
};

// ── 辉光层：在 1/4 分辨率上绘制发光体，再模糊、放大、相加 ──
const GL = {
  init() {
    this.c4 = makeCanvas(W / 4, H / 4); this.x4 = this.c4.getContext('2d');
    this.b4 = makeCanvas(W / 4, H / 4); this.y4 = this.b4.getContext('2d');
    this.c16 = makeCanvas(W / 16, H / 16); this.x16 = this.c16.getContext('2d');
    this.b16 = makeCanvas(W / 16, H / 16); this.y16 = this.b16.getContext('2d');
  },
  begin() { const x = this.x4; x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W / 4, H / 4); x.globalCompositeOperation = 'lighter'; Cam.apply(x, 0.25); this.used = false; return x; },
  get ctx() { this.used = true; return this.x4; },
  flush(ctx, k = 1) { this.apply(ctx, k); const x = this.x4, m = x.getTransform(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W / 4, H / 4); x.globalCompositeOperation = 'lighter'; x.setTransform(m); this.used = false; },
  apply(ctx, k = 1) {
    if (!this.used) return;
    const y4 = this.y4, y16 = this.y16, x16 = this.x16;
    y4.setTransform(1, 0, 0, 1, 0, 0); y4.clearRect(0, 0, W / 4, H / 4); y4.filter = 'blur(2.5px)'; y4.drawImage(this.c4, 0, 0); y4.filter = 'none';
    // 先模糊、再缩小：直接把细线从 1/4 缩到 1/16 会产生混叠，导致辉光随时间"一跳一跳"
    x16.setTransform(1, 0, 0, 1, 0, 0); x16.clearRect(0, 0, W / 16, H / 16); x16.imageSmoothingEnabled = true; x16.imageSmoothingQuality = 'high'; x16.drawImage(this.b4, 0, 0, W / 16, H / 16);
    y16.setTransform(1, 0, 0, 1, 0, 0); y16.clearRect(0, 0, W / 16, H / 16); y16.filter = 'blur(3px)'; y16.drawImage(this.c16, 0, 0); y16.filter = 'none';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = Math.min(1, 1.0 * k); ctx.drawImage(this.b4, 0, 0, W, H);
    ctx.globalAlpha = Math.min(1, 1.0 * k); ctx.drawImage(this.b16, 0, 0, W, H); ctx.drawImage(this.b16, 0, 0, W, H);
    ctx.restore();
  },
};

// ── 闪电生成：带偏向的随机游走 + 概率分叉 + 中点位移细节 ──
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
function genBolt(seed, o) {
  const R = RNG(seed);
  const O = Object.assign({
    step: 22, wander: 0.42, pull: 0.2, branch: 0.13, branchAng: [0.3, 1.0], branchLen: [0.1, 0.42], branchDecay: 0.55,
    maxDepth: 3, rough: 0.34, detail: 2, gravAng: null, grav: 0, maxSteps: 260, branchStop: 0.92,
  }, o);
  const segs = [], main = [];
  const hasT = O.x1 !== undefined;
  const span = hasT ? Math.hypot(O.x1 - O.x0, O.y1 - O.y0) : (O.length || 600);
  const a0 = O.angle !== undefined ? O.angle : Math.atan2(O.y1 - O.y0, O.x1 - O.x0);
  const stack = [{ x: O.x0, y: O.y0, ang: a0, base: a0, len: hasT ? Infinity : span, depth: 0, d: 0, main: true, j: 0 }];
  main.push({ x: O.x0, y: O.y0, d: 0 });
  let Dmain = 0;
  const push = (ax, ay, bx, by, da, db, s) => {
    // 中点位移细化
    let pts = [[ax, ay], [bx, by]];
    for (let k = 0; k < O.detail; k++) {
      const np = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const [x1, y1] = pts[i - 1], [x2, y2] = pts[i], L = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / (L || 1), ny = (x2 - x1) / (L || 1), g = R.gauss() * O.rough * L * 0.5;
        np.push([(x1 + x2) / 2 + nx * g, (y1 + y2) / 2 + ny * g], pts[i]);
      }
      pts = np;
    }
    const n = pts.length - 1;
    for (let i = 0; i < n; i++) {
      const sa = da + (db - da) * i / n, sb = da + (db - da) * (i + 1) / n;
      segs.push({ ax: pts[i][0], ay: pts[i][1], bx: pts[i + 1][0], by: pts[i + 1][1], da: sa, db: sb, lvl: s.depth, main: s.main, j: s.main ? (sa + sb) / 2 : s.j, w: 1 });
    }
  };
  while (stack.length) {
    const s = stack.pop();
    let { x, y, ang, d } = s, rem = s.len, steps = 0, segStart = segs.length;
    while (rem > 0 && steps++ < O.maxSteps) {
      let L = O.step * R.range(0.55, 1.45) * (s.depth ? 0.8 : 1);
      ang += R.gauss() * O.wander;
      if (O.gravAng !== null) ang += angDiff(O.gravAng, ang) * O.grav;
      let last = false;
      if (s.main && hasT) {
        const ta = Math.atan2(O.y1 - y, O.x1 - x), dist = Math.hypot(O.x1 - x, O.y1 - y);
        ang += angDiff(ta, ang) * (O.pull + (dist < span * 0.15 ? 0.35 : 0));
        if (dist < L * 1.3) { L = dist; ang = ta; last = true; }
      } else {
        ang += angDiff(s.base, ang) * O.pull * 0.7;
        if (L > rem) L = rem;
      }
      const nx = x + Math.cos(ang) * L, ny = y + Math.sin(ang) * L;
      push(x, y, nx, ny, d, d + L, s);
      x = nx; y = ny; d += L; rem -= L;
      if (s.main) main.push({ x, y, d });
      if (last) break;
      if (s.depth < O.maxDepth && R() < O.branch * Math.pow(O.branchDecay, s.depth)) {
        const side = O.branchSide || R.sign();
        const ba = ang + side * R.range(O.branchAng[0], O.branchAng[1]);
        const bl = span * R.range(O.branchLen[0], O.branchLen[1]) * Math.pow(0.6, s.depth);
        stack.push({ x, y, ang: ba, base: ba, len: bl, depth: s.depth + 1, d, main: false, j: s.main ? d : s.j });
      }
    }
    if (s.main) Dmain = d;
    // 分支从根部到末端逐渐变细
    const n = segs.length - segStart;
    for (let i = segStart; i < segs.length; i++) segs[i].w = s.main ? 1 : Math.pow(0.62, s.depth) * (1 - 0.65 * (i - segStart) / Math.max(1, n));
  }
  if (!Dmain) Dmain = main[main.length - 1].d;
  const B = { segs, main, Dmain, seed, maxD: Math.max(...segs.map(s => s.db)) };
  B.at = dd => { // 主通道上距起点 dd 处的坐标
    const m = B.main; if (dd <= 0) return [m[0].x, m[0].y];
    for (let i = 1; i < m.length; i++) if (m[i].d >= dd) { const f = (dd - m[i - 1].d) / (m[i].d - m[i - 1].d); return [lerp(m[i - 1].x, m[i].x, f), lerp(m[i - 1].y, m[i].y, f)]; }
    return [m[m.length - 1].x, m[m.length - 1].y];
  };
  B.tip = lf => { // 先导最前端（取所有已生长段中最深/最远的点，偏向主通道）
    const [x, y] = B.at(Math.min(lf, Dmain)); return [x, y];
  };
  return B;
}

// ── 闪电渲染 ──
// st: { lf 先导前沿(像素路程), lead 先导亮度, tip 先导尖端闪光, tipLen, rf 回击前沿(主通道路程，越小越靠云), I 回击亮度, bI 分支亮度系数 }
const BUCK = 10;
function drawBolt(ctx, B, st, sty = {}) {
  const up = !!st.up, lf = st.lf === undefined ? Infinity : st.lf, lead = st.lead || 0, I = st.I || 0, rf = st.rf === undefined ? (up ? Infinity : -1) : st.rf;
  const bI = st.bI === undefined ? 0.55 : st.bI, tip = st.tip || 0, tipLen = st.tipLen || 40, onlyMain = st.onlyMain;
  const width = sty.width || 2.4, core = sty.core || COL.core, glow = sty.glow || COL.blue, leadCol = sty.leadCol || [170, 150, 255];
  const gk = sty.glowK === undefined ? 1 : sty.glowK;
  if (lead <= 0 && I <= 0.002 && tip <= 0) return;
  // 分桶（为了批量绘制）：
  //  · 回击段：只按"静态"的结构亮度系数分桶（主干 / 分支层级 / 粗细），整体亮度 I 连续相乘 —— 淡出时平滑、不跳档
  //  · 先导段：按当前亮度分桶（先导本身就在逐步变化）
  const FB = 16, buckets = new Map();
  for (const s of B.segs) {
    if (s.da >= lf) continue;
    if (onlyMain && !s.main) continue;
    let bx = s.bx, by = s.by;
    if (s.db > lf) { const f = (lf - s.da) / (s.db - s.da); bx = lerp(s.ax, s.bx, f); by = lerp(s.ay, s.by, f); }
    let b = lead * (s.main ? 1 : 0.7) * (0.55 + 0.45 * s.w);
    if (tip > 0 && lf - s.db < tipLen) b += tip * (1 - (lf - s.db) / tipLen);
    const wc = s.main ? 0 : s.lvl === 1 ? 1 : 2;
    let key = null;
    if (I > 0 && (up ? s.j <= rf : s.j >= rf)) {
      const fs = s.main ? 1 : Math.pow(0.7, s.lvl - 1) * (0.4 + 0.6 * s.w);
      if (I * (s.main ? 1 : bI) * fs > b) { const qs = s.main ? FB : Math.min(FB - 1, Math.floor(fs * FB)); key = 'S' + wc + '_' + qs; }
    }
    if (!key) { if (b < 0.01) continue; key = 'L' + wc + '_' + Math.min(BUCK - 1, Math.floor(Math.min(b, 2) / 2 * BUCK)); }
    let arr = buckets.get(key); if (!arr) buckets.set(key, arr = []);
    arr.push(s.ax, s.ay, bx, by);
  }
  const gctx = GL.ctx;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  gctx.lineCap = 'round';
  for (const [key, arr] of buckets) {
    const str = key[0] === 'S', wc = +key[1], q = +key.slice(3);
    const b = str ? (wc === 0 ? I : I * bI) * (q >= FB ? 1 : (q + 0.5) / FB) : (q + 0.5) / BUCK * 2;
    if (b < 0.004) continue;
    const wf = wc === 0 ? 1 : wc === 1 ? 0.55 : 0.32;
    const c = str ? mixc(glow, core, clamp(0.45 + b * 0.7)) : mixc(leadCol, [235, 235, 255], clamp(b * 0.5));
    const path = new Path2D();
    for (let i = 0; i < arr.length; i += 4) { path.moveTo(arr[i], arr[i + 1]); path.lineTo(arr[i + 2], arr[i + 3]); }
    // 辉光（低分辨率）
    gctx.strokeStyle = rgba(str ? glow : leadCol, clamp(Math.min(b, 1.3) * 0.7 * gk));
    gctx.lineWidth = width * wf * 5; // 辉光宽度保持不变、只用透明度表现明暗：低分辨率下线宽连续变化会被"量化"，造成一跳一跳
    gctx.stroke(path);
    // 近处光晕
    ctx.strokeStyle = rgba(str ? glow : leadCol, clamp(b * 0.3));
    ctx.lineWidth = width * wf * 3.4;
    ctx.stroke(path);
    // 核心
    ctx.strokeStyle = rgba(c, clamp(b));
    ctx.lineWidth = width * wf * (0.75 + 0.35 * Math.min(b, 2));
    ctx.stroke(path);
  }
  ctx.restore();
}

// ── 一次完整闪电的时间结构 ──
// o: { t0 先导起始, lead 先导时长, stepped 是否梯级, strokes:[相对连接时刻的回击时间], peaks:[亮度], ret 回击上行时长,
//      tau 衰减, after 余辉, cont 连续电流{dur, lvl}, firstBranch 首次回击分支亮度 }
function flashOf(B, o) {
  const O = Object.assign({ t0: 0, lead: 0.25, stepped: true, steps: 40, strokes: [0], peaks: null, ret: 0.0, tau: 0.045, after: 0.22, afterK: 0.14, cont: null, bI: 0.55, leadLvl: 0.32, maxLead: null }, o);
  const tc = O.t0 + O.lead;
  O.tc = tc;
  O.state = t => {
    const st = { lf: 0, lead: 0, I: 0, rf: B.Dmain + 1, bI: O.bI, tip: 0, tipLen: B.maxD / O.steps * 1.2 };
    if (t < O.t0) return st;
    const maxD = O.maxLead || B.maxD;
    // 先导
    if (t < tc) {
      const p = (t - O.t0) / O.lead;
      if (O.stepped) { const k = Math.floor(p * O.steps), ph = p * O.steps - k; st.lf = (k + 1) / O.steps * B.Dmain * 1.0; st.tip = 0.9 * Math.exp(-ph * 4); st.tipLen = B.Dmain / O.steps * 1.3; }
      else st.lf = p * B.Dmain;
      st.lf = Math.min(st.lf, maxD); st.lead = O.leadLvl;
      return st;
    }
    st.lf = O.full ? Infinity : B.Dmain; st.lead = Math.max(0, O.leadLvl * (1 - (t - tc) / 0.05));
    // 回击（继后回击只点亮主通道，分支不再亮起）
    let I = 0;
    O.strokes.forEach((ds, i) => {
      const ts = tc + ds, pk = O.peaks ? O.peaks[i] : (i === 0 ? 1.6 : 1.25 - i * 0.12);
      if (t >= ts) {
        const dt = t - ts;
        I += pk * ((1 - O.afterK) * Math.exp(-dt / O.tau) + O.afterK * Math.exp(-dt / O.after));
        if (O.cont && i === O.strokes.length - 1) I += pk * O.cont.lvl * (dt < O.cont.dur ? (1 - 0.3 * dt / O.cont.dur) * (0.85 + 0.15 * noise1(t * 60, 7)) : Math.exp(-(dt - O.cont.dur) / 0.06));
        if (i === 0) {
          if (O.ret > 0 && dt < O.ret) st.rf = B.Dmain * (1 - dt / O.ret); else st.rf = -1;
        }
      }
    });
    if (O.strokes.length > 1 && t >= tc + O.strokes[1]) st.bI = O.bI * Math.exp(-(t - tc - O.strokes[1]) / 0.03);
    st.I = I;
    return st;
  };
  O.light = t => { // 用于照亮云/天空的光强
    let I = 0; if (t < tc) return t > O.t0 ? 0.03 : 0;
    O.strokes.forEach((ds, i) => { const ts = tc + ds, pk = O.peaks ? O.peaks[i] : (i === 0 ? 1.6 : 1.25 - i * 0.12); if (t >= ts) I += pk * Math.exp(-(t - ts) / (O.tau * 1.4)); });
    if (O.cont) { const ts = tc + O.strokes[O.strokes.length - 1], dt = t - ts; if (dt > 0) I += O.cont.lvl * (dt < O.cont.dur ? 1 : Math.exp(-(dt - O.cont.dur) / 0.06)); }
    return I;
  };
  return O;
}

// ── 云纹理（"团块"模型）：在形状区域内撒数百个半球状团块，取高度场的最大值，
//    再用法线光照 + 环境光遮蔽塑造体积；生成暗面（夜色微光）与受光面（闪电照亮）两张贴图 ──
function makeCloud(seed, w, h, shape, o = {}) {
  const O = Object.assign({ puffs: 600, rMin: 0.025, rMax: 0.11, flat: null, fx: 6, fy: 4, wob: 0.14, fine: 0.02, soft: 0.05, th0: 0.35, base: 0.75,
    dark: [9, 12, 22], top: [66, 78, 108], lit: [222, 234, 255], litK: 1, ao: 2.6 }, o);
  const R = RNG(seed), S = Math.min(w, h);
  const H = new Float32Array(w * h), K = 3.2 / (S * O.rMax); // 软并集：H = log(Σexp(K·h)) / K
  // 每像素的扰动噪声（打破完美圆形）
  const nz = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) nz[y * w + x] = fbm(x / w * O.fx * (w / h) / 2, y / h * O.fy, 4, seed + 3) - 0.5;
  let placed = 0, tries = 0;
  while (placed < O.puffs && tries++ < O.puffs * 40) {
    const u = R(), v = R(), sv = shape(u, v);
    if (sv <= O.th0 * 0.7 || R() > (O.place ? O.place(sv, u, v) : sv)) continue;
    placed++;
    const r = S * lerp(O.rMin, O.rMax, Math.pow(R(), 2.6)) * (0.6 + 0.6 * clamp(sv)) * (o.rScale ? o.rScale(u, v) : 1);
    const fy = O.flat ? O.flat(u, v) : 1;
    const cx = u * w, cy = v * h, rx = r, ry = r * fy;
    const x0 = Math.max(0, cx - rx * 1.4 | 0), x1 = Math.min(w - 1, cx + rx * 1.4 | 0), y0 = Math.max(0, cy - ry * 1.4 | 0), y1 = Math.min(h - 1, cy + ry * 1.4 | 0);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * w + x, dx = (x - cx) / rx, dy = (y - cy) / ry;
      const d = Math.sqrt(dx * dx + dy * dy) * (1 + nz[i] * O.wob * 2);
      if (d >= 1) continue;
      H[i] += Math.exp(K * r * Math.sqrt(1 - d * d)) - 1;
    }
  }
  // 云体"底座"（保证内部实心）+ 细节
  const hMx = S * O.rMax;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, sv = shape(x / w, y / h);
    const hb = smooth((sv - O.th0) / 0.35 + nz[i] * 0.6) * hMx * O.base;
    H[i] = Math.log(1 + H[i] + (hb > 0 ? Math.exp(K * hb) - 1 : 0)) / K;
    if (H[i] > 0.5) H[i] += (fbm(x / w * 30, y / h * 30 * h / w, 3, seed + 9) - 0.5) * S * O.fine; else H[i] = 0;
  }
  // 模糊高度（用于环境光遮蔽）
  const Bh = boxBlur(H, w, h, Math.max(3, S * 0.025 | 0));
  const dark = makeCanvas(w, h), lit = makeCanvas(w, h);
  const dd = dark.getContext('2d').createImageData(w, h), ld = lit.getContext('2d').createImageData(w, h);
  const nl = v => { const l = Math.hypot(...v); return v.map(c => c / l); };
  const A = nl([-0.4, -0.75, 0.55]), Bv = nl([0.15, 0.3, 0.94]);
  const soft = S * O.soft, hMax = S * O.rMax;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x, hh = H[i];
    if (hh <= 0) continue;
    const a = smooth(hh / soft);
    let nx = -(H[i + 1] - H[i - 1]) * 0.5, ny = -(H[i + w] - H[i - w]) * 0.5, nzz = 1; const nn = Math.hypot(nx, ny, nzz); nx /= nn; ny /= nn; nzz /= nn;
    const ao = clamp(1 - (Bh[i] - hh) / hMax * O.ao, 0.15, 1);
    const l1 = Math.max(0, nx * A[0] + ny * A[1] + nzz * A[2]);
    const l2 = Math.max(0, nx * Bv[0] + ny * Bv[1] + nzz * Bv[2]);
    const low = 1 - 0.4 * (y / h);
    const hl = 0.5 + 0.5 * (nx * A[0] + ny * A[1] + nzz * A[2]);
    const sh = clamp((0.08 + 0.95 * hl * hl) * ao * low);
    const c = mixc(O.dark, O.top, sh);
    const j = i * 4;
    dd.data[j] = c[0]; dd.data[j + 1] = c[1]; dd.data[j + 2] = c[2]; dd.data[j + 3] = a * 255;
    const thin = 1 - clamp(hh / hMax);
    const h2 = 0.5 + 0.5 * (nx * Bv[0] + ny * Bv[1] + nzz * Bv[2]);
    const lb = clamp((0.06 + 0.7 * h2 * h2 * ao + 0.4 * thin * a) * O.litK);
    ld.data[j] = O.lit[0] * lb; ld.data[j + 1] = O.lit[1] * lb; ld.data[j + 2] = O.lit[2] * lb; ld.data[j + 3] = a * 255;
  }
  dark.getContext('2d').putImageData(dd, 0, 0); lit.getContext('2d').putImageData(ld, 0, 0);
  return { dark, lit, w, h, H, O };
}
function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) { let acc = 0; const row = y * w; for (let x = -r; x <= r; x++) acc += src[row + clamp(x, 0, w - 1)]; for (let x = 0; x < w; x++) { tmp[row + x] = acc / (2 * r + 1); acc += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)]; } }
  for (let x = 0; x < w; x++) { let acc = 0; for (let y = -r; y <= r; y++) acc += tmp[clamp(y, 0, h - 1) * w + x]; for (let y = 0; y < h; y++) { out[y * w + x] = acc / (2 * r + 1); acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; } }
  return out;
}
// 圆滑的形状基元
const blob = (u, v, cx, cy, rx, ry) => { const dx = (u - cx) / rx, dy = (v - cy) / ry; return Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)); };
const smin = (a, b, k = 0.15) => { const h = clamp(0.5 + 0.5 * (b - a) / k); return lerp(b, a, h) - k * h * (1 - h); };
const smax = (a, b, k = 0.15) => -smin(-a, -b, k);

// 积雨云（带云砧）形状
function cbShape(u, v) {
  let d = 0;
  d = smax(d, blob(u, v, 0.5, 0.62, 0.17, 0.42) * 1.1, 0.1);            // 主塔
  d = smax(d, blob(u, v, 0.38, 0.72, 0.16, 0.25), 0.1);
  d = smax(d, blob(u, v, 0.63, 0.7, 0.16, 0.26), 0.1);
  d = smax(d, blob(u, v, 0.5, 0.22, 0.48, 0.1) * 1.05, 0.12);           // 云砧
  d = smax(d, blob(u, v, 0.78, 0.21, 0.22, 0.07), 0.08);
  d = smax(d, blob(u, v, 0.5, 0.86, 0.36, 0.1), 0.08);                  // 云底
  return d * 1.35;
}
// 云层（横向铺满）
function deckShape(top, bottom, ragged = 0.08) { return (u, v) => smooth((v - top) / 0.08) * (1 - smooth((v - bottom) / ragged)) * 1.1 + 0.25; }

// 绘制云：暗面 + 受光面（按光源径向遮罩）
const _lit = { c: null, x: null };
function drawCloud(ctx, cl, x, y, w, h, lights = [], o = {}) {
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  if (!o.litOnly) { ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(cl.dark, x, y, w, h); ctx.restore(); } // litOnly：只叠加被照亮的部分
  const amb = o.amb || 0;
  if (amb > 0.003) { ctx.save(); ctx.globalAlpha = clamp(amb * alpha); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(cl.lit, x, y, w, h); ctx.restore(); }
  const L = lights.filter(l => l.i > 0.004);
  if (!L.length) return;
  if (!_lit.c) { _lit.c = makeCanvas(W / 2, H / 2); _lit.x = _lit.c.getContext('2d'); }
  const lc = _lit.x;
  lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalCompositeOperation = 'source-over'; lc.clearRect(0, 0, W / 2, H / 2);
  Cam.apply(lc, 0.5);
  lc.globalCompositeOperation = 'lighter';
  for (const l of L) {
    const g = lc.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
    const c = l.c || [255, 255, 255];
    g.addColorStop(0, rgba(c, clamp(l.i))); g.addColorStop(0.35, rgba(c, clamp(l.i * 0.55))); g.addColorStop(1, rgba(c, 0));
    lc.fillStyle = g; lc.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  lc.globalCompositeOperation = 'destination-in';
  lc.drawImage(cl.lit, x, y, w, h);
  if (o.tint) { lc.globalCompositeOperation = 'source-atop'; lc.fillStyle = rgba(o.tint, o.tintA || 0.35); lc.fillRect(x, y, w, h); }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha; ctx.drawImage(_lit.c, 0, 0, W, H); ctx.restore();
}

// ── 雨 ──
function makeRain(seed, n, o = {}) {
  const R = RNG(seed), drops = [];
  for (let i = 0; i < n; i++) drops.push({ x: R() * W * 1.3 - W * 0.15, y: R() * H, z: R(), s: R.range(0.8, 1.2) });
  return Object.assign({ drops, speed: 1500, wind: -0.18, len: 34, alpha: 0.18, col: [160, 185, 225] }, o);
}
function drawRain(ctx, rain, t, flash = 0, k = 1) {
  if (k <= 0) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.lineCap = 'round';
  for (let layer = 0; layer < 2; layer++) {
    const near = layer === 1;
    ctx.strokeStyle = rgba(mixc(rain.col, [235, 245, 255], clamp(flash)), (near ? 0.75 : 0.45) * rain.alpha * k * (1 + flash * 2.2));
    ctx.lineWidth = near ? 1.6 : 1;
    ctx.beginPath();
    for (const d of rain.drops) {
      if ((d.z > 0.6) !== near) continue;
      const sp = rain.speed * (0.55 + d.z * 0.7) * d.s, L = rain.len * (0.4 + d.z) * d.s;
      const y = ((d.y + t * sp) % (H + 200)) - 100, x = ((d.x + (y + 100) * rain.wind + W * 2) % (W * 1.3)) - W * 0.15;
      ctx.moveTo(x, y); ctx.lineTo(x + rain.wind * L, y + L);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// ── 地形剪影 ──
function makeRidge(seed, y0, amp, freq = 3, oct = 4, xa = -40, xb = W + 40) {
  const pts = []; for (let x = xa; x <= xb; x += 6) pts.push([x, y0 - (fbm(x / W * freq, 0.5, oct, seed) - 0.35) * amp]);
  return pts;
}
// ── 地面：让"黑色剪影"变成看得出的大地 ──
// 近地平线处略亮、越近越暗（大气透视）；随距离压缩的地表起伏纹理；层层田野轮廓线；
// 地平线上细碎的草丛 / 灌木边缘；一条微弱的天光反光线勾出地平线。
function makeGround(seed, pts, o = {}) {
  const O = Object.assign({ top: [32, 38, 58], mid: [15, 18, 29], bot: [5, 6, 11], tex: 0.3, rows: 10, grass: 1, edge: [120, 140, 185], edgeA: 0.4, line: [125, 145, 195], lineA: 0.1, depth: null }, o);
  const x0 = pts[0][0], x1 = pts[pts.length - 1][0], ys = pts.map(p => p[1]);
  const yMin = Math.min(...ys) - 10, yAvg = ys.reduce((a, b) => a + b, 0) / ys.length, yB = O.depth || H + 40;
  const w = Math.ceil(x1 - x0), h = Math.ceil(yB - yMin);
  const c = makeCanvas(w, h), g = c.getContext('2d');
  g.translate(-x0, -yMin);
  const path = new Path2D(); path.moveTo(x0, yB); for (const p of pts) path.lineTo(p[0], p[1]); path.lineTo(x1, yB); path.closePath();
  const gr = g.createLinearGradient(0, yAvg - 20, 0, yB);
  gr.addColorStop(0, rgba(O.top)); gr.addColorStop(clamp(90 / (yB - yAvg)), rgba(mixc(O.top, O.mid, 0.6))); gr.addColorStop(0.45, rgba(O.mid)); gr.addColorStop(1, rgba(O.bot));
  g.fillStyle = gr; g.fill(path);
  // 地表起伏纹理：越近地平线越扁（透视压缩）
  const id = g.getImageData(0, 0, w, h), D = id.data, ry = x => { const i = clamp(Math.round((x - x0) / 6), 0, pts.length - 1); return pts[i][1]; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const j = (y * w + x) * 4; if (D[j + 3] === 0) continue;
    const wy = y + yMin, wx = x + x0, top = ry(wx), dep = clamp((wy - top) / (yB - top));
    const sy = 3 + dep * dep * 60, sx = 40 + dep * 260;
    const n = fbm(wx / sx, wy / sy, 3, seed) - 0.5, n2 = fbm(wx / (sx * 0.35), wy / (sy * 0.5), 2, seed + 7) - 0.5;
    const k = 1 + (n * 2 * O.tex + n2 * O.tex * 0.6) * (0.6 + 0.4 * (1 - dep));
    D[j] = clamp(D[j] * k, 0, 255); D[j + 1] = clamp(D[j + 1] * k, 0, 255); D[j + 2] = clamp(D[j + 2] * k, 0, 255);
  }
  g.putImageData(id, 0, 0);
  // 田野 / 地形轮廓线（透视间距：近地平线处密，近处疏）
  g.save(); g.clip(path); g.lineJoin = 'round';
  for (let k = 1; k <= O.rows; k++) {
    const t = k / (O.rows + 1), d = Math.pow(t, 1.9) * (yB - yAvg) * 0.9;
    g.strokeStyle = rgba(O.line, O.lineA * (1 - t * 0.55)); g.lineWidth = 0.8 + t * 1.6; g.beginPath();
    pts.forEach((p, i) => { const y = p[1] + d + (fbm(p[0] / 260, k * 3.1, 2, seed + 11) - 0.5) * d * 0.5; i ? g.lineTo(p[0], y) : g.moveTo(p[0], y); });
    g.stroke();
  }
  g.restore();
  // 地平线上的草丛 / 灌木细碎边缘
  if (O.grass > 0) {
    g.fillStyle = rgba(O.top); g.strokeStyle = rgba(mixc(O.top, [0, 0, 0], 0.15)); g.lineWidth = 1;
    for (let x = x0; x < x1; x += 2) {
      const hsh = hash1(Math.round(x), seed), y = ry(x) + 1;
      if (hsh < 0.18 * O.grass) { const r = 2 + hash1(Math.round(x), seed + 3) * 6 * O.grass; g.beginPath(); g.arc(x, y - r * 0.5, r, Math.PI, 0); g.fill(); }
      const bh = (1 + hash1(Math.round(x), seed + 5) * 5) * O.grass; g.beginPath(); g.moveTo(x, y + 1); g.lineTo(x + (hash1(Math.round(x), seed + 9) - 0.5) * 3, y - bh); g.stroke();
    }
  }
  // 地平线反光线
  g.strokeStyle = rgba(O.edge, O.edgeA); g.lineWidth = 1.2; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1] + 0.5) : g.moveTo(p[0], p[1] + 0.5)); g.stroke();
  return { c, x0, yMin, path, pts, O };
}
// 绘制地面；flash：整体被闪光照亮的程度；lights：局部光斑 [{x,y,r,i,c}]；refl：湿地面上闪电的倒影 [{x,i,w}]
function drawGround(ctx, G, o = {}) {
  ctx.drawImage(G.c, G.x0, G.yMin);
  const fl = o.flash || 0, L = (o.lights || []).filter(l => l.i > 0.004), R = (o.refl || []).filter(r => r.i > 0.004);
  if (fl <= 0.003 && !L.length && !R.length) return;
  ctx.save(); ctx.clip(G.path); ctx.globalCompositeOperation = 'lighter';
  if (fl > 0.003) { const c = o.flashC || [120, 140, 200]; const yt = G.yMin + 10; const gr = ctx.createLinearGradient(0, yt, 0, H + 40); gr.addColorStop(0, rgba(c, clamp(fl * 0.32))); gr.addColorStop(0.5, rgba(c, clamp(fl * 0.12))); gr.addColorStop(1, rgba(c, 0)); ctx.fillStyle = gr; ctx.fillRect(G.x0, yt - 20, G.c.width, H + 80 - yt); }
  for (const l of L) { // 地面上的光斑：把圆形渐变整体压扁成椭圆（透视），边缘完全柔和
    const c = l.c || [190, 210, 255]; ctx.save(); ctx.translate(l.x, l.y); ctx.scale(1, l.flat || 0.35);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, l.r); g.addColorStop(0, rgba(c, clamp(l.i))); g.addColorStop(0.4, rgba(c, clamp(l.i * 0.35))); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.fillRect(-l.r, -l.r, l.r * 2, l.r * 2); ctx.restore(); }
  for (const r of R) {
    const yt = (r.y || G.yMin + 12), w = r.w || 26, c = r.c || [200, 220, 255];
    const g = ctx.createLinearGradient(0, yt, 0, yt + (r.len || 180)); g.addColorStop(0, rgba(c, clamp(r.i * 0.55))); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.filter = 'blur(5px)'; ctx.fillRect(r.x - w / 2, yt, w, r.len || 180); ctx.filter = 'none';
  }
  ctx.restore();
}
function drawRidge(ctx, pts, col, bottom = H + 10) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], bottom); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.lineTo(pts[pts.length - 1][0], bottom); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}
const ridgeY = (pts, x) => { for (let i = 1; i < pts.length; i++) if (pts[i][0] >= x) { const f = (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]); return lerp(pts[i - 1][1], pts[i][1], f); } return pts[pts.length - 1][1]; };

// 程序化树剪影
function makeTree(seed, x, y, h) {
  const R = RNG(seed), p = new Path2D();
  const br = (x, y, a, L, w, d) => {
    const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L;
    p.moveTo(x - w, y); p.lineTo(x2 - w * 0.6, y2); p.lineTo(x2 + w * 0.6, y2); p.lineTo(x + w, y); p.closePath();
    if (d > 0) { const n = R.int(2, 3); for (let i = 0; i < n; i++) br(x2, y2, a + R.range(-0.7, 0.7), L * R.range(0.6, 0.78), w * 0.62, d - 1); }
    else { p.moveTo(x2 + 9, y2); p.arc(x2, y2, R.range(6, 12), 0, Math.PI * 2); }
  };
  br(x, y, -Math.PI / 2, h * 0.38, h * 0.035, 5);
  return { path: p, top: [x, y - h * 0.95] };
}
// 铁塔剪影
function makeTower(x, y, h) {
  const p = new Path2D(), w0 = h * 0.16;
  p.moveTo(x - w0, y); p.lineTo(x - 3, y - h); p.lineTo(x + 3, y - h); p.lineTo(x + w0, y); p.lineTo(x + w0 - 4, y); p.lineTo(x, y - h + 8); p.lineTo(x - w0 + 4, y); p.closePath();
  for (let i = 1; i < 7; i++) { const yy = y - h * i / 7, ww = w0 * (1 - i / 7); p.rect(x - ww, yy, ww * 2, 2.5); }
  for (let i = 0; i < 6; i++) { const y1 = y - h * i / 7, y2 = y - h * (i + 1) / 7, w1 = w0 * (1 - i / 7), w2 = w0 * (1 - (i + 1) / 7); p.moveTo(x - w1, y1); p.lineTo(x + w2, y2); p.lineTo(x + w2 + 2, y2); p.lineTo(x - w1 + 2, y1); p.moveTo(x + w1, y1); p.lineTo(x - w2, y2); p.lineTo(x - w2 - 2, y2); p.lineTo(x + w1 - 2, y1); }
  p.rect(x - 1, y - h - 26, 2, 26);
  return { path: p, top: [x, y - h - 26] };
}

// ── 星空 ──
function makeStars(seed, n, yMax = H) { const R = RNG(seed), s = []; for (let i = 0; i < n; i++) s.push({ x: R() * W, y: R() * yMax, r: Math.pow(R(), 3) * 1.6 + 0.35, b: R.range(0.25, 1), f: R.range(0.3, 2) }); return s; }
function drawStars(ctx, stars, t, k = 1) {
  ctx.save(); ctx.fillStyle = '#fff';
  for (const s of stars) { ctx.globalAlpha = clamp(s.b * k * (0.75 + 0.25 * Math.sin(t * s.f * 3 + s.x))); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

// ── 天空渐变 ──
function sky(ctx, top, bottom, y0 = 0, y1 = H) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, rgba(top)); g.addColorStop(1, rgba(bottom)); ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3); }

// 发光圆点（电荷、粒子）
function glowDot(ctx, x, y, r, c, a = 1, gk = 1) {
  ctx.fillStyle = rgba(c, a); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  if (gk > 0) { const g = GL.ctx; g.fillStyle = rgba(c, clamp(a * 0.8 * gk)); g.beginPath(); g.arc(x, y, r * 2.4 + 3, 0, Math.PI * 2); g.fill(); }
}
// 电荷符号
function chargeSign(ctx, x, y, s, plus, a = 1) {
  const c = plus ? COL.plus : COL.minus;
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = rgba(c, 1); ctx.lineWidth = Math.max(1.5, s * 0.22); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - s / 2, y); ctx.lineTo(x + s / 2, y); if (plus) { ctx.moveTo(x, y - s / 2); ctx.lineTo(x, y + s / 2); } ctx.stroke(); ctx.restore();
  const g = GL.ctx; g.fillStyle = rgba(c, 0.16 * a); g.beginPath(); g.arc(x, y, s * 0.9, 0, Math.PI * 2); g.fill();
}
