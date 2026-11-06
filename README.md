# 闪电 · 天空放电的科学

一支约 3 分钟（3:06）的闪电科普短片：1920×1080，60 fps，画面文字为中文（闪电类型名统一附英文，如「绿色幽灵 GHOST」），只有配乐、没有配音。
**画面、文字动效和配乐全部由代码生成**，没有使用任何外部图片、视频或音频素材。

## 成品

| 文件 | 用途 |
|---|---|
| `dist/lightning_1080p60.mp4` | 成品视频（H.264 + AAC，可直接存到 iPad / iPhone 的"照片"或"文件"中播放） |
| `dist/cover.png` | 封面图（1920×1080，与正片同一套引擎绘制：程序化闪电、团块体积云、辉光、同款字体） |
| `dist/cover_3x4.png` | 竖版封面（1080×1440，3:4，适合小红书等平台） |
| `dist/lightning.html` | 单文件网页版：双击用浏览器打开即可播放或录屏，不需要联网。每次打开都会重新生成闪电形态 |

### 网页版操作
- 点击画面开始播放（浏览器要求先点击才允许播放声音）
- `空格` 暂停 / 继续；`←` `→` 快退 / 快进 5 秒；`F` 全屏；`R` 换一组新生成的闪电
- 网址后加 `?seed=7` 可以固定闪电形态（成品视频用的就是 7），加 `?t=50` 可以从第 50 秒开始
- 录屏时建议用 Chrome 全屏播放；画面内部分辨率固定为 1920×1080，会自动缩放到窗口大小

## 如何重新生成

需要 Node.js（带 Playwright 和 Chromium）、Python 3（numpy、scipy）、ffmpeg。

```bash
node tools/fonts.js          # 收集全片用到的字，下载对应的字体子集（Noto Sans/Serif SC、JetBrains Mono，SIL OFL 许可）
node tools/timeline.js       # 导出时间表：场景起止、每一道闪电的时刻
python3 tools/music.py       # 按时间表合成配乐并完成母带处理（压缩 + 限幅，−13 LUFS）→ build/music.wav
ffmpeg -i build/music.wav -c:a aac -b:a 256k build/music.m4a
cp build/music.m4a src/
node tools/render.js 4 7     # 4 个进程逐帧渲染全部 11,160 帧（种子 7）→ build/seg_*.mp4（每段 10 秒）
# 只重渲某几段：ONLY="80-150" node tools/render.js 4 7（单位：秒）
# 拼接并压制成品（命令见 tools/encode.sh）
bash tools/encode.sh
node tools/build.js          # 打包单文件网页版 → dist/lightning.html
node tools/cover.js          # 渲染封面 → dist/cover.png（可加种子参数换一种闪电形态，默认 31）
node tools/cover.js dist/cover_3x4.png 58 src/cover_v.html   # 渲染竖版 3:4 封面
```

辅助工具：
- `node tools/shot.js <目录> 12.5 50.2 …`：截取指定时刻的画面
- `node tools/overlap.js`：每 0.2 秒采样一次，自动检查文字之间是否重叠、是否贴边
- `node tools/fadecheck.js <开始秒> <结束秒> <x> <y> <宽> <高>`：逐帧测量画面某区域的亮度，检查淡出是否平滑（有无台阶式跳变）

## 代码结构

- `src/js/util.js`：数学函数、可设种子的随机数、噪声、缓动曲线
- `src/js/gfx.js`：闪电生成（带偏向的随机游走 + 概率分叉 + 中点位移细节）和多层辉光渲染、团块式体积云、雨、地形、星空
- `src/js/text.js`：动态文字系统（逐字入场 / 退场、透视、跟随物体、引线、数字滚动）
- `src/js/main.js`：场景调度、交叉淡化、播放器、逐帧导出接口
- `src/js/style.js`：版式预设与全片时间表
- `src/js/s1_formation.js`、`s1b_process.js`、`s2_types.js`、`s3_upper.js`、`s4_end.js`：各个场景
- `docs/storyboard.md`：分镜脚本与科学数字自查表
