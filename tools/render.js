// 逐帧离线渲染（确定性：同一种子每次结果相同）
// 用法: node tools/render.js [workers=4] [seed=7]  → build/seg_XXXXX.mp4（每段 10 秒）+ build/chunks.txt
// 只重渲某几段：ONLY="60-75,140-150" node tools/render.js   （单位：秒；与这些时间段相交的 10 秒分段会被重新渲染）
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const WORKERS = +(process.argv[2] || 4), SEED = +(process.argv[3] || 7), FPS = 60, SEG = 600;
const TOTAL = Math.round(JSON.parse(fs.readFileSync('build/timeline.json', 'utf8')).duration * FPS); // 先运行 tools/timeline.js
fs.mkdirSync('build', { recursive: true });
const segName = a => `seg_${String(a).padStart(5, '0')}.mp4`;
const all = []; for (let a = 0; a < TOTAL; a += SEG) all.push([a, Math.min(TOTAL, a + SEG)]);
const only = (process.env.ONLY || '').split(',').filter(Boolean).map(r => r.split('-').map(v => Math.round(+v * FPS)));
const todo = only.length ? all.filter(([a, b]) => only.some(([x, y]) => a < y && b > x)) : all.slice();
console.log(`segments to render: ${todo.length}/${all.length}`);
async function worker(id) {
  const br = await chromium.launch({ args: ['--disable-gpu-vsync', '--disable-frame-rate-limit'] });
  const p = await br.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve('src/index.html') + `?render=1&seed=${SEED}`);
  await p.waitForFunction(() => window.RENDER_READY === true, null, { timeout: 180000 });
  while (todo.length) {
    const [a, b] = todo.shift(), t0 = Date.now(), tmp = `build/tmp_${segName(a)}`;
    const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'superfast', '-crf', '11', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-f', 'mp4', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = a; f < b; f++) {
      await p.evaluate(i => window.seekFrame(i), f);
      const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); const code = await new Promise(r => ff.on('close', r));
    if (code !== 0) throw new Error(`ffmpeg failed on segment ${a}`);
    fs.renameSync(tmp, `build/${segName(a)}`);
    console.log(`[w${id}] seg ${a}-${b} (${(a / FPS).toFixed(0)}–${(b / FPS).toFixed(0)} s) ${((Date.now() - t0) / (b - a)).toFixed(0)} ms/f, ${todo.length} left`);
  }
  await br.close();
  if (errs.length) console.log(`[w${id}] page errors:`, errs.slice(0, 5));
}
(async () => {
  await Promise.all([...Array(WORKERS).keys()].map(worker));
  const missing = all.filter(([a]) => !fs.existsSync(`build/${segName(a)}`));
  if (missing.length) { console.log('MISSING segments:', missing.map(s => s[0]).join(' ')); process.exit(1); }
  fs.writeFileSync('build/chunks.txt', all.map(([a]) => `file '${segName(a)}'`).join('\n') + '\n');
  console.log('ALL DONE');
})().catch(e => { console.log('RENDER FAILED:', e.message); process.exit(1); });
