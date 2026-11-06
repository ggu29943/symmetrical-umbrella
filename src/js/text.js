// ───────────────────────── 动态文字系统：逐字入场 / 退场、透视、跟随、引线、数字滚动 ─────────────────────────
'use strict';
const FONT = {
  sans: "'NSans','Noto Sans SC','WenQuanYi Zen Hei',sans-serif",
  serif: "'NSerif','Noto Serif SC','WenQuanYi Zen Hei',serif",
  mono: "'NMono','JetBrains Mono','NSans','Noto Sans SC','WenQuanYi Zen Hei',monospace",
};
const TX = {
  items: [], root: null, svg: null,
  init(root) {
    this.root = root;
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', W); this.svg.setAttribute('height', H); this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    this.svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;pointer-events:none';
    root.appendChild(this.svg);
    for (const it of this.items) this.build(it);
  },
  // 统一入口
  add(spec) {
    const it = Object.assign({
      kind: 'text', x: W / 2, y: H / 2, ax: 0, ay: 0, size: 48, weight: 500, family: 'sans', color: '#eef4ff', tracking: 0.04, lh: 1.35,
      inA: 'rise', outA: 'drift', inDur: 0.7, outDur: 0.55, stagger: 0.035, outStagger: 0.02, order: 'lr', glow: null, opacity: 1,
      persp: null, follow: null, lead: null, delayIn: 0, z: 0,
    }, spec);
    if (it.out === undefined) it.out = it.at + 3;
    this.items.push(it);
    if (this.root) this.build(it);
    return it;
  },
  build(it) {
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:absolute;left:0;top:0;width:0;height:0;transform-style:preserve-3d;display:none;will-change:transform`;
    const inner = document.createElement('div');
    inner.style.cssText = `position:absolute;left:0;top:0;white-space:pre;transform-style:preserve-3d;font-family:${FONT[it.family] || it.family};font-size:${it.size}px;font-weight:${it.weight};color:${it.color};letter-spacing:${it.tracking}em;line-height:${it.lh};text-align:${it.align || 'left'};font-variant-numeric:tabular-nums;font-kerning:normal`;
    if (it.css) inner.style.cssText += ';' + it.css;
    wrap.appendChild(inner); this.root.appendChild(wrap);
    it.wrap = wrap; it.inner = inner; it.spans = [];
    if (it.kind === 'box') {
      inner.style.width = it.w + 'px'; inner.style.height = it.h + 'px';
      inner.style.background = it.bg || 'linear-gradient(135deg,rgba(120,170,255,0.10),rgba(120,170,255,0.03))';
      inner.style.border = it.border || '1px solid rgba(170,205,255,0.28)'; inner.style.borderRadius = (it.radius || 6) + 'px';
      inner.style.boxShadow = it.shadow || '0 0 40px rgba(60,120,255,0.12) inset';
    } else if (it.kind === 'count') {
      inner.textContent = '';
    } else if (it.kind === 'line') {
      // 线条由 SVG 绘制
    } else {
      const chars = Array.from(it.text);
      let line = 0, col = 0;
      chars.forEach((ch, i) => {
        if (ch === '\n') { inner.appendChild(document.createElement('br')); line++; col = 0; return; }
        const s = document.createElement('span');
        s.textContent = ch; s.style.display = 'inline-block'; s.style.whiteSpace = 'pre';
        if (it.charCss) s.style.cssText += ';' + it.charCss(ch, it.spans.length);
        inner.appendChild(s); it.spans.push({ el: s, ch, line, col: col++ });
      });
      const n = it.spans.length;
      // 入场顺序
      const ord = it.spans.map((s, i) => i);
      if (it.order === 'center') ord.forEach((_, i) => it.spans[i].k = Math.abs(i - (n - 1) / 2));
      else if (it.order === 'random') { const R = RNG(n * 7919 + Math.floor(it.at * 100)); it.spans.forEach(s => s.k = R() * n * 0.6); }
      else if (it.order === 'rl') it.spans.forEach((s, i) => s.k = n - 1 - i);
      else it.spans.forEach((s, i) => s.k = i);
      if (it.kmap) it.spans.forEach((s, i) => s.k = it.kmap(i, s.k));   // 自定义逐字节奏（如英文名作为一组快速跟进）
      if (it.kmapOut) it.spans.forEach((s, i) => s.ko = it.kmapOut(i, s.k, n));   // 退场可用另一套节奏
      it.kMax = Math.max(0, ...it.spans.map(s => s.k));
      // 关键词着色：hl: [['正电', '#ffc46e'], ...]
      if (it.hl) { const flat = it.spans.map(s => s.ch).join(''); for (const [w, c] of it.hl) { let k = flat.indexOf(w); while (k >= 0) { for (let j = k; j < k + Array.from(w).length; j++) it.spans[j].hlc = c; k = flat.indexOf(w, k + 1); } } }
      if (it.ax === 0.5 && it.tracking) inner.style.paddingLeft = it.tracking + 'em';
    }
    if (it.lead) {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('fill', 'none'); p.setAttribute('stroke', it.lead.color || 'rgba(190,215,255,0.75)'); p.setAttribute('stroke-width', it.lead.width || 1.4);
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', it.lead.dot || 4); c.setAttribute('fill', it.lead.color || 'rgba(210,230,255,0.95)');
      this.svg.appendChild(p); this.svg.appendChild(c); it.lp = p; it.lc = c;
    }
    if (it.kind === 'line') {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      p.setAttribute('stroke', it.color); p.setAttribute('stroke-width', it.width || 1.5);
      this.svg.appendChild(p); it.ln = p; wrap.style.display = 'none';
    }
  },
  endTime(it) { return it.out + it.outDur + (it.kMax || 0) * it.outStagger + 0.05; },
  update(t) {
    for (const it of this.items) this.updateItem(it, t);
  },
  updateItem(it, t) {
    const vis = t >= it.at + it.delayIn - 0.001 && t <= this.endTime(it);
    if (!vis) { if (it.shown) { it.wrap.style.display = 'none'; if (it.lp) { it.lp.style.display = 'none'; it.lc.style.display = 'none'; } if (it.ln) it.ln.style.display = 'none'; it.shown = false; } return; }
    if (!it.shown) { if (it.kind !== 'line') it.wrap.style.display = 'block'; it.shown = true; }
    const lt = t - it.at - it.delayIn;
    // 位置（可跟随画面中的物体）
    let x = it.x, y = it.y;
    if (it.follow) { const p = it.follow(t); x = p[0] + (it.dx || 0); y = p[1] + (it.dy || 0); }
    // 整体入/出进度
    const gin = Ease.outCubic(lt / it.inDur), gout = Ease.inCubic((t - it.out) / it.outDur);
    if (it.kind === 'line') return this.updLine(it, t, lt);
    let tf = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
    if (it.persp) { const P = it.persp; tf += ` perspective(${P.p || 1200}px) rotateX(${P.rx || 0}deg) rotateY(${P.ry || 0}deg) rotateZ(${P.rz || 0}deg)`; }
    if (it.wobble) tf += ` rotateZ(${(Math.sin(t * 0.7) * it.wobble).toFixed(3)}deg)`;
    if (it.drift) tf += ` translate3d(${(it.drift[0] * lt).toFixed(2)}px,${(it.drift[1] * lt).toFixed(2)}px,0)`;
    it.wrap.style.transform = tf;
    it.inner.style.transform = `translate(${-it.ax * 100}%,${-it.ay * 100}%)`;
    const fk = it.flick ? it.flick(t) : 1;
    if (it.kind === 'box' || it.kind === 'count') return this.updBlock(it, t, lt, gin, gout, fk);
    const n = it.spans.length;
    for (let i = 0; i < n; i++) {
      const s = it.spans[i];
      const pin = clamp((lt - s.k * it.stagger) / it.inDur);
      const pout = clamp((t - it.out - (s.ko ?? s.k) * it.outStagger) / it.outDur);
      const st = this.charStyle(it, s, i, pin, pout, t);
      const css = `opacity:${(st.o * it.opacity).toFixed(3)};transform:translate3d(${st.x.toFixed(2)}px,${st.y.toFixed(2)}px,${(st.z || 0).toFixed(1)}px) scale(${st.s.toFixed(4)}) rotate(${(st.r || 0).toFixed(2)}deg);filter:${st.b > 0.05 ? `blur(${st.b.toFixed(2)}px)` : 'none'};text-shadow:${this.shadow(it, st.g * fk)};display:inline-block;white-space:pre${(st.c || s.hlc) ? ';color:' + (st.c || s.hlc) : ''}`;
      if (s.css !== css) { s.el.style.cssText = css + (it.charCss ? ';' + it.charCss(s.ch, i) : ''); s.css = css; }
    }
    this.updLead(it, t, lt, x, y);
  },
  shadow(it, g) {
    if (!it.glow && g <= 1.001) return 'none';
    const c = it.glow || [140, 190, 255];
    const k = (it.glowK || 1) * g;
    return `0 0 ${(10 * k).toFixed(1)}px rgba(${c[0]},${c[1]},${c[2]},${clamp(0.55 * k, 0, 1).toFixed(3)}),0 0 ${(28 * k).toFixed(1)}px rgba(${c[0]},${c[1]},${c[2]},${clamp(0.35 * k, 0, 1).toFixed(3)})`;
  },
  // 每个字的入场 / 退场样式
  charStyle(it, s, i, pin, pout, t) {
    const S = it.size;
    let o = 1, x = 0, y = 0, z = 0, sc = 1, b = 0, g = 1, r = 0, c = null;
    // —— 入场 ——
    const e = Ease.outExpo(pin), e3 = Ease.outCubic(pin);
    switch (it.inA) {
      case 'rise': o = smooth(pin * 1.4); y = (1 - e3) * S * 0.55; b = (1 - e) * 10; break;
      case 'drop': o = smooth(pin * 1.4); y = -(1 - e3) * S * 0.6; b = (1 - e) * 8; break;
      case 'focus': o = smooth(pin * 1.6); sc = 1 + (1 - e) * 0.5; b = (1 - e) * 22; z = (1 - e) * 120; break;
      case 'spread': o = smooth(pin * 1.5); x = (1 - e) * (i - (it.spans.length - 1) / 2) * S * 0.9; b = (1 - e) * 12; break;
      case 'fly': o = smooth(pin * 1.5); z = -(1 - e) * 700; y = (1 - e) * S * 0.3; b = (1 - e) * 6; break;
      case 'stamp': o = smooth(pin * 3); sc = 1 + (1 - Ease.outBack(pin)) * 0.9; g = 1 + (1 - e) * 4; b = (1 - e) * 4; break;
      case 'flicker': { // 霓虹 / 电弧式点亮
        const h = hash2(Math.floor(t * 40), i * 31 + 7, 3);
        o = pin >= 1 ? 1 : (h < pin * 1.15 ? (0.55 + 0.45 * pin) : 0.04);
        g = 1 + (1 - e3) * 3.5; c = pin < 1 ? `rgb(${lerp(170, 238, pin) | 0},${lerp(215, 244, pin) | 0},255)` : null; break;
      }
      case 'type': o = pin > 0 ? 1 : 0; g = 1 + Math.max(0, 1 - pin * 3) * 2.5; break;
      case 'fade': o = smooth(pin); b = (1 - e) * 4; break;
      case 'beads': o = smooth(pin * 1.3); sc = lerp(0.25, 1, e3); b = (1 - e) * 6; g = 1 + (1 - e3) * 2.5; break;
    }
    // —— 退场 ——
    if (pout > 0) {
      const q = Ease.inCubic(pout), q2 = Ease.inOutCubic(pout);
      switch (it.outA) {
        case 'drift': o *= 1 - smooth(pout * 1.15); y -= q2 * S * 0.45; b += q * 10; break;
        case 'sink': o *= 1 - smooth(pout * 1.15); y += q2 * S * 0.4; b += q * 10; break;
        case 'blur': o *= 1 - smooth(pout); b += q * 18; sc *= 1 + q * 0.12; break;
        case 'scatter': { const a = hash2(i, 9, 2) * Math.PI * 2, d = q * S * (0.8 + hash2(i, 3, 5)); o *= 1 - smooth(pout * 1.1); x += Math.cos(a) * d; y += Math.sin(a) * d - q * S * 0.3; b += q * 12; r += (hash2(i, 4, 1) - 0.5) * 60 * q; break; }
        case 'dissolve': { const h = hash2(Math.floor(t * 30), i * 13 + 1, 9); o *= pout < 1 ? (h > pout ? 1 - pout * 0.6 : 0) : 0; g += pout * 2; break; }
        case 'cut': o *= pout > 0.02 ? 0 : 1; break;
        case 'beads': { o *= 1 - smooth(pout * 1.1); sc *= lerp(1, 0.2, q); g += q * 3; b += q * 4; break; }
        case 'recede': o *= 1 - smooth(pout * 1.1); z -= q2 * 400; b += q * 8; break;
        case 'wipe': o *= 1 - smooth(pout * 1.3); x += q2 * S * 0.6; b += q * 8; break;
      }
    }
    return { o, x, y, z, s: sc, b, g, r, c };
  },
  updBlock(it, t, lt, gin, gout, fk) {
    const pin = clamp(lt / it.inDur), pout = clamp((t - it.out) / it.outDur);
    const e = Ease.outExpo(pin), q = Ease.inCubic(pout);
    let o = smooth(pin * 1.6) * (1 - smooth(pout)), clip = '', b = 0, y = 0;
    if (it.kind === 'box') { clip = `inset(0 ${((1 - e) * 100).toFixed(2)}% 0 0)`; if (pout > 0) clip = `inset(0 0 0 ${(q * 100).toFixed(2)}%)`; }
    else { y = (1 - Ease.outCubic(pin)) * it.size * 0.4; b = (1 - e) * 8 + q * 12; }
    if (it.kind === 'count') {
      const C = it.count, q0 = clamp((lt - (C.delay || 0)) / C.dur), p = C.ease === 'linear' ? q0 : Ease.outCubic(q0);
      const v = lerp(C.from, C.to, p);
      const txt = C.fmt ? C.fmt(v, p, t) : Math.round(v).toLocaleString('en-US');
      if (it._txt !== txt) { if (C.html) it.inner.innerHTML = txt; else it.inner.textContent = txt; it._txt = txt; }
    }
    it.inner.style.opacity = (o * it.opacity).toFixed(3);
    it.inner.style.clipPath = clip;
    it.inner.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none';
    it.inner.style.transform = `translate(${-it.ax * 100}%,${-it.ay * 100}%) translateY(${y.toFixed(2)}px)`;
    if (it.kind === 'count') it.inner.style.textShadow = this.shadow(it, fk);
  },
  updLead(it, t, lt, x, y) {
    if (!it.lp) return;
    const L = it.lead, a = L.from(t);
    const pin = Ease.outCubic(clamp((lt - (L.delay || 0)) / (L.dur || 0.5))), pout = Ease.inCubic(clamp((t - it.out) / it.outDur));
    const ex = x + (L.ox || 0), ey = y + (L.oy || 0);
    // 折线：锚点 → 拐点 → 文字
    const mx = L.elbow === 'h' ? ex : a[0], my = L.elbow === 'h' ? a[1] : ey;
    const pts = L.elbow ? [a, [mx, my], [ex, ey]] : [a, [ex, ey]];
    let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    it.lp.setAttribute('d', 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L'));
    it.lp.setAttribute('stroke-dasharray', `${len} ${len}`);
    // 入场：从锚点画向文字；退场：从锚点端收回
    const off = pout > 0 ? -len * pout : len * (1 - pin);
    it.lp.setAttribute('stroke-dashoffset', off.toFixed(1));
    it.lp.style.display = 'block'; it.lc.style.display = 'block';
    it.lc.setAttribute('cx', a[0].toFixed(1)); it.lc.setAttribute('cy', a[1].toFixed(1));
    const dotS = Ease.outBack(clamp(lt / 0.35)) * (1 - pout);
    it.lc.setAttribute('r', ((L.dot || 4) * dotS).toFixed(2));
    it.lp.style.opacity = (1 - smooth(pout)).toFixed(3);
  },
  updLine(it, t, lt) {
    const pin = Ease.outExpo(clamp(lt / it.inDur)), pout = Ease.inOutCubic(clamp((t - it.out) / it.outDur));
    const x1 = it.x1, y1 = it.y1, x2 = it.x2, y2 = it.y2;
    const a = pout > 0 ? pout : 0, b = pin;
    it.ln.setAttribute('x1', lerp(x1, x2, a).toFixed(1)); it.ln.setAttribute('y1', lerp(y1, y2, a).toFixed(1));
    it.ln.setAttribute('x2', lerp(x1, x2, b).toFixed(1)); it.ln.setAttribute('y2', lerp(y1, y2, b).toFixed(1));
    it.ln.style.display = 'block'; it.ln.style.opacity = it.opacity;
  },
  allText() { return this.items.map(i => (i.text || '') + (i.chars || '') + (i.count && i.count.chars || '')).join(''); },
};
// 便捷函数
const T = spec => TX.add(spec);
