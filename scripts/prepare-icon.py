from PIL import Image, ImageChops
from pathlib import Path

root = Path(__file__).resolve().parents[1]
src = root / 'public' / 'siedu-icon.png'
img = Image.open(src).convert('RGBA')
bg = Image.new('RGBA', img.size, (255, 255, 255, 255))
diff = ImageChops.difference(img, bg).convert('L')
box = diff.point(lambda p: 255 if p > 8 else 0).getbbox()
if box:
    img = img.crop(box)
side = max(img.size)
canvas = Image.new('RGBA', (side, side), (255, 255, 255, 0))
canvas.alpha_composite(img, ((side-img.width)//2, (side-img.height)//2))
for size, name in [(192, 'siedu-icon-192.png'), (512, 'siedu-icon-512.png')]:
    canvas.resize((size, size), Image.Resampling.LANCZOS).save(root / 'public' / name, optimize=True)
