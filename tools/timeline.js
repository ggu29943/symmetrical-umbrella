// 导出时间表（场景起止、所有闪电/音效同步点）到 build/timeline.json，供配乐脚本使用
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
(async () => {
  const seed = process.env.SEED || 7;
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.resolve('src/index.html') + `?render=1&seed=${seed}`);
  await p.waitForFunction(() => window.RENDER_READY === true, null, { timeout: 120000 });
  const tl = await p.evaluate(() => window.timeline()); delete tl.text;
  fs.mkdirSync('build', { recursive: true }); fs.writeFileSync('build/timeline.json', JSON.stringify(tl, null, 1));
  console.log('hits', tl.hits.length, 'scenes', tl.scenes.length); await b.close();
})();
