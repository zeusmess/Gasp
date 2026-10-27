"""Tile rendered frames into one timestamped contact sheet: sheet.py <dir> <out.jpg> [cols]."""
import glob
import os
import sys

from PIL import Image, ImageDraw

src, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
files = sorted(glob.glob(os.path.join(src, "*.jpg")))
ims = [Image.open(f) for f in files]
w, h = ims[0].size
lab = 22
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * (h + lab)), (20, 20, 20))
d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(files, ims)):
    x, y = (i % cols) * w, (i // cols) * (h + lab)
    sheet.paste(im, (x, y))
    d.text((x + 6, y + h + 4), os.path.basename(f).split("_")[1][:-4] + "s", fill=(255, 220, 235))
os.makedirs(os.path.dirname(out), exist_ok=True)
sheet.save(out, quality=88)
print(out, sheet.size)
