// 逐帧测量某一区域的平均亮度，检查淡出是否平滑（台阶式跳变 = 卡顿）
// 用法: node tools/fadecheck.js <开始秒> <结束秒> <x> <y> <w> <h>
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [a, b, x, y, w, h] = process.argv.slice(2).map(Number);
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + path.resolve('src/index.html') + '?render=1&seed=7');
  await p.waitForFunction(() => window.RENDER_READY === true, null, { timeout: 120000 });
  const vals = [];
  for (let f = Math.round(a * 60); f <= Math.round(b * 60); f++) {
    vals.push(await p.evaluate(([f, x, y, w, h]) => { window.seekFrame(f); const d = document.getElementById('cv').getContext('2d').getImageData(x, y, w, h).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; return s / (d.length / 4) / 3; }, [f, x, y, w, h]));
  }
  const diffs = vals.slice(1).map((v, i) => v - vals[i]);
  const flat = diffs.filter(d => Math.abs(d) < 0.02).length, jumps = diffs.filter(d => Math.abs(d) > 4 * Math.abs(diffs.reduce((s, d) => s + d, 0) / diffs.length)).length;
  console.log('帧数', vals.length, '| 几乎不变的帧', flat, '| 突变的帧', jumps);
  console.log('亮度序列:', vals.map(v => v.toFixed(2)).join(' '));
  await br.close();
})();
