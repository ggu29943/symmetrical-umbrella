// ───────────────────────── 引擎：场景调度、逐帧渲染、播放器、导出接口 ─────────────────────────
'use strict';
const SCENES = [], HITS = [], SECTIONS = [];
let SEED = 1;
// 场景：{ name, t0, dur, fi, fo, setup(S), draw(ctx, lt, t, S) }
function scene(def) { def.fi = def.fi ?? 0.6; def.fo = def.fo ?? 0; def.t1 = def.t0 + def.dur; SCENES.push(def); return def; }
// 音乐同步点：kind = 'strike' | 'soft' | 'silent' | 'boom' | 'cue'
function hit(t, s = 1, kind = 'strike') { HITS.push({ t: +t.toFixed(4), s, kind }); }
function section(name, t0, t1, mood) { SECTIONS.push({ name, t0, t1, mood }); }

const E = {
  init(seed) {
    SEED = seed;
    this.main = document.getElementById('cv'); this.ctx = this.main.getContext('2d');
    this.buf = [makeCanvas(W, H), makeCanvas(W, H)]; this.bx = this.buf.map(c => c.getContext('2d'));
    GL.init();
    // 胶片颗粒与暗角
    this.grain = []; for (let k = 0; k < 4; k++) { const c = makeCanvas(256, 256), x = c.getContext('2d'), d = x.createImageData(256, 256); const R = RNG(900 + k); for (let i = 0; i < d.data.length; i += 4) { const v = 128 + R.gauss() * 40; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); this.grain.push(this.ctx.createPattern(c, 'repeat')); }
    this.vig = makeCanvas(W, H); { const x = this.vig.getContext('2d'), g = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.62)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
    for (const s of SCENES) { s.S = { R: RNG(seed * 1000 + s.t0 * 10 | 0) }; if (s.setup) s.setup(s.S, s); }
  },
  frame(t) {
    ditherFrame(Math.round(t * FPS));
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const act = SCENES.filter(s => t >= s.t0 && t < s.t1);
    act.forEach((s, i) => {
      const lt = t - s.t0;
      const a = Math.min(s.fi > 0 ? smooth(lt / s.fi) : 1, s.fo > 0 ? smooth((s.t1 - t) / s.fo) : 1);
      if (a <= 0) return;
      const bx = this.bx[i % 2];
      bx.setTransform(1, 0, 0, 1, 0, 0); bx.globalCompositeOperation = 'source-over'; bx.globalAlpha = 1; bx.filter = 'none';
      bx.fillStyle = '#000'; bx.fillRect(0, 0, W, H);
      Cam.set(0, 0, 1); GL.begin(); Cam.apply(bx);
      s.draw(bx, lt, t, s.S, s);
      GL.apply(bx, s.S.glowK ?? 1);
      if (s.post) { bx.setTransform(1, 0, 0, 1, 0, 0); s.post(bx, lt, t, s.S); }
      ctx.globalAlpha = a; ctx.drawImage(this.buf[i % 2], 0, 0); ctx.globalAlpha = 1;
    });
    // 后期：暗角 + 颗粒
    ctx.drawImage(this.vig, 0, 0);
    const fr = Math.floor(t * FPS);
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.07; ctx.fillStyle = this.grain[fr % 4];
    ctx.translate(-(hash1(fr, 1) * 256 | 0), -(hash1(fr, 2) * 256 | 0)); ctx.fillRect(0, 0, W + 256, H + 256); ctx.restore();
    TX.update(t);
  },
};

// ── 播放器 ──
const P = {
  playing: false, t: 0, last: 0,
  start() {
    const au = document.getElementById('music');
    this.au = au && au.src ? au : null;
    document.getElementById('cover').classList.add('gone');
    this.play();
  },
  play() { this.playing = true; this.last = performance.now(); if (this.au) { this.au.currentTime = this.t; this.au.play().catch(() => { }); } requestAnimationFrame(this.loop); },
  pause() { this.playing = false; if (this.au) this.au.pause(); },
  seek(t) { this.t = clamp(t, 0, DURATION); if (this.au) this.au.currentTime = this.t; E.frame(this.t); },
  loop: () => {
    if (!P.playing) return;
    const now = performance.now();
    if (P.au && !P.au.paused && Math.abs(P.au.currentTime - P.t) < 0.25) P.t = P.au.currentTime; else P.t += (now - P.last) / 1000;
    P.last = now;
    if (P.t >= DURATION) { P.t = DURATION - 1e-3; E.frame(P.t); P.pause(); document.getElementById('cover').classList.remove('gone'); document.getElementById('cover').querySelector('.hint').textContent = '再看一遍（每次闪电的形态都会重新生成）'; P.t = 0; return; }
    E.frame(P.t);
    const bar = document.getElementById('bar'); if (bar) bar.style.width = (P.t / DURATION * 100).toFixed(2) + '%';
    requestAnimationFrame(P.loop);
  },
};

function fitStage() {
  const st = document.getElementById('stage'), k = Math.min(innerWidth / W, innerHeight / H);
  st.style.transform = `translate(${(innerWidth - W * k) / 2}px,${(innerHeight - H * k) / 2}px) scale(${k})`;
}

async function boot() {
  const q = new URLSearchParams(location.search);
  const seed = q.has('seed') ? +q.get('seed') : (Math.random() * 1e6 | 0);
  TX.init(document.getElementById('txt'));
  if (document.fonts) { try { await Promise.race([Promise.all([...document.fonts].map(f => f.load().catch(() => 0))).then(() => document.fonts.ready), new Promise(r => setTimeout(r, 8000))]); } catch (e) { } }
  E.init(seed);
  window.RENDER_READY = true;
  if (q.has('render')) { document.body.classList.add('render'); document.getElementById('cover').remove(); E.frame(+(q.get('t') || 0)); return; }
  fitStage(); addEventListener('resize', fitStage);
  E.frame(q.has('t') ? +q.get('t') : 0.0);
  if (q.has('t')) { P.t = +q.get('t'); }
  document.getElementById('cover').addEventListener('click', () => P.start());
  addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); if (!document.getElementById('cover').classList.contains('gone')) return P.start(); P.playing ? P.pause() : P.play(); }
    if (e.code === 'ArrowRight') P.seek(P.t + 5); if (e.code === 'ArrowLeft') P.seek(P.t - 5);
    if (e.code === 'KeyF') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
    if (e.code === 'KeyR') { location.search = ''; }
  });
}
// 导出给渲染脚本
window.seekFrame = i => { E.frame(i / FPS); return true; };
window.timeline = () => ({ duration: DURATION, fps: FPS, hits: HITS.slice().sort((a, b) => a.t - b.t), sections: SECTIONS, scenes: SCENES.map(s => ({ name: s.name, t0: s.t0, t1: s.t1 })), text: TX.allText() });
window.textBoxes = t => { E.frame(t); return TX.items.filter(i => i.shown && i.kind !== 'line' && i.kind !== 'box').map(i => { const r = i.inner.getBoundingClientRect(); return { id: (i.text || i.kind).slice(0, 14), x: r.x, y: r.y, w: r.width, h: r.height, at: i.at, out: i.out }; }); };
addEventListener('load', boot);
