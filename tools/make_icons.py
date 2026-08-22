"""Home-screen icons.

iPhone Safari has no Fullscreen API, so the only way to play without browser
chrome on an iPhone is to add the page to the home screen — and that wants a
real icon rather than the data-URI favicon the page carries for tabs.

Doom's mask on the teaser's green, upscaled nearest-neighbour so the pixel
art stays hard-edged at icon sizes.

Run: python3 tools/make_icons.py
"""
from PIL import Image, ImageDraw

SIZES = (192, 512)
BG_OUTER = (10, 26, 14)
BG_INNER = (26, 66, 34)


def icon(size):
    im = Image.new("RGBA", (size, size), BG_OUTER + (255,))
    d = ImageDraw.Draw(im)
    #A soft pool of green behind him, the way the teaser lights everything
    for i in range(28, 0, -1):
        k = i / 28
        r = int(size * 0.62 * k)
        d.ellipse(
            [size / 2 - r, size / 2 - r, size / 2 + r, size / 2 + r],
            fill=tuple(round(BG_OUTER[c] + (BG_INNER[c] - BG_OUTER[c]) * (1 - k)) for c in range(3)) + (255,),
        )

    doom = Image.open("images/dd-doom.png").convert("RGBA")
    #Whole pixels only, or the sprite comes out soft at the edges
    scale = max(1, int(size * 0.72 / max(doom.size)))
    doom = doom.resize((doom.width * scale, doom.height * scale), Image.NEAREST)
    im.alpha_composite(doom, ((size - doom.width) // 2, (size - doom.height) // 2))
    return im


for size in SIZES:
    out = icon(size)
    out.save(f"images/icon-{size}.png", optimize=True)
    print(f"  icon-{size}.png {out.size}")

#iOS uses this one for the home screen and does not read the manifest for it
icon(180).save("images/apple-touch-icon.png", optimize=True)
print("  apple-touch-icon.png (180, 180)")
