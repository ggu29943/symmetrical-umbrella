// 测试单文件网页版：点击播放 → 时间推进、音频可解码、无报错
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.resolve('dist/lightning.html'));
  await p.waitForFunction(() => window.RENDER_READY === true, null, { timeout: 120000 });
  const dur = await p.evaluate(() => new Promise(r => { const a = document.getElementById('music'); if (a.readyState >= 1) r(a.duration); else a.addEventListener('loadedmetadata', () => r(a.duration)); setTimeout(() => r(-1), 10000); }));
  await p.click('#cover');
  await p.waitForTimeout(4000);
  const st = await p.evaluate(() => ({ t: P.t, playing: P.playing, audioT: document.getElementById('music').currentTime, fonts: [...document.fonts].filter(f => f.status === 'loaded').length }));
  console.log('audio duration', dur, 'state', st);
  await p.screenshot({ path: process.argv[2] || 'build/playtest.jpg', type: 'jpeg', quality: 80 });
  console.log(errs.length ? 'ERRORS ' + errs.join(' | ') : 'no errors');
  await b.close();
})();
