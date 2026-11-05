// 打包为单个可离线播放的 HTML：内嵌字体、全部脚本与配乐（base64）
const fs = require('fs'), path = require('path');
let html = fs.readFileSync('src/index.html', 'utf8');
const css = fs.readFileSync('src/fonts.css', 'utf8');
html = html.replace('<!--FONTS--><link rel="stylesheet" href="fonts.css">', `<style>\n${css}</style>`);
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const js = scripts.map(s => `// ── ${s} ──\n` + fs.readFileSync(path.join('src', s), 'utf8')).join('\n');
html = html.replace(/<!--SCRIPTS-->[\s\S]*<!--\/SCRIPTS-->/, `<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`);
const audio = fs.readFileSync('build/music.m4a').toString('base64');
html = html.replace('<audio id="music" preload="auto" src="music.m4a"></audio>', `<audio id="music" preload="auto" src="data:audio/mp4;base64,${audio}"></audio>`);
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/lightning.html', html);
console.log('dist/lightning.html', (html.length / 1e6).toFixed(2), 'MB');
