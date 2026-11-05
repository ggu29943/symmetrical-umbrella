// 收集全片用到的所有字符，向 Google Fonts 请求"恰好包含这些字"的子集字体，内嵌为 base64，生成 src/fonts.css
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), https = require('https');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const get = (url, bin) => new Promise((res, rej) => https.get(url, { headers: { 'User-Agent': UA } }, r => {
  if (r.statusCode !== 200) return rej(new Error(r.statusCode + ' ' + url.slice(0, 120)));
  const ch = []; r.on('data', c => ch.push(c)); r.on('end', () => res(bin ? Buffer.concat(ch) : Buffer.concat(ch).toString()));
}).on('error', rej));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.resolve('src/index.html') + '?render=1&seed=7');
  await p.waitForFunction(() => window.RENDER_READY === true, null, { timeout: 120000 });
  const tl = await p.evaluate(() => window.timeline());
  const cover = await p.evaluate(() => document.title);
  await b.close();
  const html = fs.readFileSync('src/index.html', 'utf8').replace(/<[^>]+>/g, '');
  const extra = '0123456789 公里℃−毫秒第次秒伏约道闪电—，。、：；？！“”（）·→÷≈×+-.,/%=abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const all = Array.from(new Set(Array.from(tl.text + cover + html + extra).filter(c => c.trim() || c === ' '))).sort().join('');
  console.log('unique chars:', all.length);
  const fams = [['NSans', 'Noto Sans SC', [300, 400, 500, 700]], ['NSerif', 'Noto Serif SC', [700, 900]], ['NMono', 'JetBrains Mono', [200, 300, 400, 500]]];
  let css = '/* 自动生成：全片所用字符的字体子集（Noto Sans SC / Noto Serif SC / JetBrains Mono，SIL OFL） */\n';
  for (const [alias, fam, wts] of fams) {
    const chars = alias === 'NMono' ? Array.from(all).filter(c => c.charCodeAt(0) < 0x2100).join('') : all;
    // 分块请求，避免 URL 过长
    const arr = Array.from(chars), CH = 350;
    for (let i = 0; i < arr.length; i += CH) {
      const part = arr.slice(i, i + CH).join('');
      const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam).replace(/%20/g, '+')}:wght@${wts.join(';')}&text=${encodeURIComponent(part)}&display=block`;
      const c = await get(url);
      const faces = c.split('@font-face').slice(1);
      for (const f of faces) {
        const w = /font-weight:\s*(\d+)/.exec(f)[1], u = /url\(([^)]+)\)/.exec(f)[1], ur = /unicode-range:\s*([^;]+);/.exec(f);
        const bin = await get(u, true);
        css += `@font-face{font-family:'${alias}';font-style:normal;font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${bin.toString('base64')}) format('woff2');${ur ? 'unicode-range:' + ur[1] + ';' : ''}}\n`;
      }
      console.log(alias, 'chunk', i / CH, faces.length, 'faces');
    }
  }
  fs.writeFileSync('src/fonts.css', css);
  console.log('fonts.css bytes', css.length);
})();
