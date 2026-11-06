#!/usr/bin/env bash
# 拼接渲染分段 + 配乐，压制成 iPad / iPhone 兼容的 H.264 High@4.2 1080p60 MP4
set -euo pipefail
CRF="${CRF:-18}"
DUR="$(python3 -c "import json;print(json.load(open('build/timeline.json'))['duration'])")"
mkdir -p dist
ffmpeg -hide_banner -loglevel warning -stats -y \
  -f concat -safe 0 -i build/chunks.txt -i build/music.m4a -map 0:v -map 1:a \
  -vf "scale=in_color_matrix=bt601:out_color_matrix=bt709:in_range=tv:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf "$CRF" -profile:v high -level:v 4.2 -maxrate 14M -bufsize 28M -g 120 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a copy -movflags +faststart -t "$DUR" \
  -metadata title="闪电 · 天空放电的科学" \
  dist/lightning_1080p60.mp4
ls -l dist/lightning_1080p60.mp4
