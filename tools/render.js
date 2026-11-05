// 逐帧离线渲染（确定性：同一种子每次结果相同）
// 用法: node tools/render.js [workers=4] [seed=7]  → build/chunk_*.mp4
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const WORKERS = +(process.argv[2] || 4), SEED = +(process.argv[3] || 7), FPS = 60, TOTAL = 180 * FPS;
const FROM = +(process.env.FROM || 0), TO = +(process.env.TO || TOTAL);
fs.mkdirSync('build', { recursive: true });
async function worker(id, a, b) {
  const br = await chromium.launch({ args: ['--disable-gpu-vsync', '--disable-frame-rate-limit'] });
  const p = await br.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve('src/index.html') + `?render=1&seed=${SEED}`);
  await p.waitForFunction(() => window.RENDER_READY === true, null, { timeout: 180000 });
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'superfast', '-crf', '11', '-pix_fmt', 'yuv420p', '-r', String(FPS), `build/chunk_${String(id).padStart(2, '0')}.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = a; f < b; f++) {
    await p.evaluate(i => window.seekFrame(i), f);
    const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - a) % 300 === 0) console.log(`[w${id}] frame ${f} (${((f - a) / (b - a) * 100).toFixed(0)}%)  ${((Date.now() - t0) / Math.max(1, f - a)).toFixed(0)} ms/f`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  await br.close();
  if (errs.length) console.log(`[w${id}] page errors:`, errs.slice(0, 5));
  console.log(`[w${id}] done ${a}-${b} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
(async () => {
  const n = TO - FROM, per = Math.ceil(n / WORKERS), jobs = [];
  for (let i = 0; i < WORKERS; i++) { const a = FROM + i * per, b = Math.min(TO, a + per); if (a < b) jobs.push(worker(i, a, b)); }
  await Promise.all(jobs);
  fs.writeFileSync('build/chunks.txt', [...Array(WORKERS).keys()].map(i => `file 'chunk_${String(i).padStart(2, '0')}.mp4'`).join('\n') + '\n');
  console.log('ALL DONE');
})();
