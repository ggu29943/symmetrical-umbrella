// 渲染封面：node tools/cover.js <输出.png> [种子]
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const out = process.argv[2] || 'dist/cover.png', seed = process.argv[3] || 31;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve('src/cover.html') + `?seed=${seed}`);
  await p.waitForFunction(() => window.COVER_READY === true, null, { timeout: 120000 });
  await p.locator('#stage').screenshot({ path: out, type: out.endsWith('.jpg') ? 'jpeg' : 'png', ...(out.endsWith('.jpg') ? { quality: 92 } : {}) });
  if (errs.length) console.log('ERRORS', errs);
  console.log('wrote', out); await b.close();
})();
