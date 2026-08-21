"""The menu backdrop: a Latverian stained-glass window, recreated in the
green of the Doomsday teaser. Run: python3 tools/make_glass.py"""
import math, random
from PIL import Image, ImageDraw, ImageFilter

W, H = 1400, 900
random.seed(11)
im = Image.new("RGB", (W, H), (4, 10, 6))
d = ImageDraw.Draw(im)

LEAD = (6, 12, 8)
GREENS = [(26, 74, 34), (38, 104, 46), (54, 138, 60), (74, 176, 78),
          (96, 208, 96), (132, 232, 120)]

cols = 9
cw = W // cols
for c in range(cols):
    x0 = c * cw
    # each bay is a tall gothic light: a lancet with an arched head
    peak = 90 + (c % 3) * 40
    tone = 1.0 - abs(c - (cols - 1) / 2) / cols * 0.5   # brighter toward the middle
    for row, (y0, y1) in enumerate([(peak, 300), (310, 560), (570, 780), (790, H)]):
        for k in range(6):
            yy0 = y0 + (y1 - y0) * k / 6
            yy1 = y0 + (y1 - y0) * (k + 1) / 6
            base = GREENS[(c + k + row) % len(GREENS)]
            shade = tuple(int(v * tone * random.uniform(0.72, 1.12)) for v in base)
            d.rectangle([(x0 + 8, yy0), (x0 + cw - 8, yy1 - 3)], fill=shade)
    # the arched head of the bay
    d.pieslice([(x0 + 8, peak - 70), (x0 + cw - 8, peak + 70)], 180, 360,
               fill=tuple(int(v * tone) for v in GREENS[(c + 2) % len(GREENS)]))
    # leading
    d.rectangle([(x0, 0), (x0 + 8, H)], fill=LEAD)
    for y in (300, 560, 780):
        d.rectangle([(x0, y), (x0 + cw, y + 7)], fill=LEAD)
    # vertical tracery inside each bay
    d.rectangle([(x0 + cw // 2 - 2, peak), (x0 + cw // 2 + 2, H)], fill=LEAD)

d.rectangle([(W - 8, 0), (W, H)], fill=LEAD)

# light blooming through from behind, brightest at the top
glow = Image.new("RGB", (W, H), (0, 0, 0))
gd = ImageDraw.Draw(glow)
for i in range(40):
    k = i / 40
    r = int(520 * (1 - k)) + 60
    gd.ellipse([(W // 2 - r, -220 - r // 3), (W // 2 + r, 260 + r // 2)],
               fill=(int(10 * (1 - k)), int(26 * (1 - k)), int(12 * (1 - k))))
im = Image.blend(im, im.filter(ImageFilter.GaussianBlur(1.2)), 0.5)
from PIL import ImageChops
im = ImageChops.add(im, glow)

# vignette, so the panels do not fight the menu text
mask = Image.new("L", (W, H), 0)
md = ImageDraw.Draw(mask)
for i in range(60):
    k = i / 60
    md.ellipse([(-W * 0.25 + W * 0.75 * k, -H * 0.25 + H * 0.75 * k),
                (W * 1.25 - W * 0.75 * k, H * 1.25 - H * 0.75 * k)], fill=int(255 * (1 - k)))
im = Image.composite(im, Image.new("RGB", (W, H), (2, 6, 3)), mask.filter(ImageFilter.GaussianBlur(80)))
im.save("images/dd-glass.jpg", quality=82)
print("dd-glass.jpg", im.size)
