// 用法: node tools/shot.js out_dir t1 t2 ...   （以固定种子截取若干时间点的画面）
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [out, ...ts] = process.argv.slice(2);
  const seed = process.env.SEED || 7;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const t0 = Date.now();
  await p.goto('file://' + path.resolve(__dirname, '../src/index.html') + `?render=1&seed=${seed}`);
  await p.waitForFunction(() => window.RENDER_READY === true, null, { timeout: 120000 });
  console.log('init ms', Date.now() - t0);
  for (const t of ts) {
    const t1 = Date.now();
    await p.evaluate(tt => window.seekFrame(Math.round(tt * 60)), +t);
    await p.screenshot({ path: `${out}/t${String(t).padStart(6, '0')}.jpg`, type: 'jpeg', quality: 85 });
    console.log('t', t, Date.now() - t1, 'ms');
  }
  if (errs.length) console.log('ERRORS:\n' + errs.join('\n'));
  await b.close();
})();
