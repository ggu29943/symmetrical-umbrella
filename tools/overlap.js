// 自动检查：每 0.2 秒采样一次，找出画面中互相重叠的文字块
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + path.resolve('src/index.html') + '?render=1&seed=7');
  await p.waitForFunction(() => window.RENDER_READY === true, null, { timeout: 120000 });
  const seen = new Map(), off = new Map();
  const DUR = await p.evaluate(() => DURATION);
  for (let t = 0; t < DUR; t += 0.2) {
    const bx = await p.evaluate(tt => window.textBoxes(tt), t);
    for (const a of bx) {
      if (a.x < 20 || a.y < 10 || a.x + a.w > 1900 || a.y + a.h > 1075) { const k = a.id; if (!off.has(k)) off.set(k, t.toFixed(1)); }
    }
    for (let i = 0; i < bx.length; i++) for (let j = i + 1; j < bx.length; j++) {
      const A = bx[i], B = bx[j];
      const ix = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x), iy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
      if (ix > 4 && iy > 4) { const k = A.id + ' ⟷ ' + B.id; if (!seen.has(k)) seen.set(k, t.toFixed(1)); }
    }
  }
  console.log('OVERLAPS:'); for (const [k, t] of seen) console.log(' ', t, k);
  console.log('NEAR EDGE:'); for (const [k, t] of off) console.log(' ', t, k);
  await b.close();
})();
