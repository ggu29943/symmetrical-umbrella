# 用法: python3 tools/sheet.py out.jpg a.jpg b.jpg ...  （两列拼图，半分辨率，带文件名标签）
import sys
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
W, H = 960, 540
sheet = Image.new('RGB', (W * 2, H * ((len(files) + 1) // 2)), (40, 40, 40))
for i, f in enumerate(files):
    im = Image.open(f).resize((W, H), Image.LANCZOS)
    d = ImageDraw.Draw(im); d.rectangle([0, 0, 120, 26], fill=(0, 0, 0)); d.text((6, 6), f.split('/')[-1], fill=(255, 255, 0))
    sheet.paste(im, ((i % 2) * W, (i // 2) * H))
sheet.save(out, quality=85)
