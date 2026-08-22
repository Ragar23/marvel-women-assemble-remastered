"""Menu art, derived from the teaser frames in images/src/.

The three frames dropped into images/src/ are full-size stills — six
megabytes between them, one with a countdown burned into it, all three at
resolutions no part of the page asks for. This turns them into the versions
the menu actually loads, and keeps the originals untouched so it can be
re-run with different crops.

Run: python3 tools/make_menu_art.py
"""
from PIL import Image, ImageDraw, ImageFilter

SRC = "images/src"


def fit(im, width):
    """Down to a sane width, never up — enlarging a still just makes it soft
    and heavy at the same time."""
    if im.width <= width:
        return im
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)


#---------------------------------------------------------------- backdrop
#The still already carries a countdown, burned in at a date months out of
#step with the live one further down the menu. The first row of that text is
#y=650, so the crop stops above it and the page's own clock does the job.
teaser = Image.open(f"{SRC}/doomsday-coming.png").convert("RGB")
teaser = teaser.crop((0, 0, teaser.width, 650))
fit(teaser, 1920).save("images/dd-teaser.jpg", quality=84, optimize=True, progressive=True)

#---------------------------------------------------------------- splash
studios = Image.open(f"{SRC}/marvel-studios.png").convert("RGB")
fit(studios, 1600).save("images/dd-studios.jpg", quality=86, optimize=True, progressive=True)


#---------------------------------------------------------------- title
def feather(im, inset=0.07, blur=38):
    """Fade the frame's edges to nothing.

    The logo still is a rectangle of stained glass, and dropped straight onto
    the menu it reads as a screenshot pasted over the page — you can see
    where it stops. Feathering the border lets it sit in the backdrop instead
    of on top of it.
    """
    im = im.convert("RGBA")
    mask = Image.new("L", im.size, 0)
    d = ImageDraw.Draw(mask)
    mx, my = im.width * inset, im.height * inset
    d.rectangle([mx, my, im.width - mx, im.height - my], fill=255)
    im.putalpha(mask.filter(ImageFilter.GaussianBlur(blur)))
    return im


title = Image.open(f"{SRC}/avengers-doomsday.png").convert("RGBA")
#Trimmed to the lockup. The still is mostly window either side of it, and
#every pixel of that costs bytes in a format that cannot throw them away.
tw, th = title.size
title = title.crop((int(tw * 0.02), int(th * 0.10), int(tw * 0.98), int(th * 0.94)))
#A soft-edged photograph is expensive as a PNG and there is no alpha in JPEG,
#so the palette comes down instead. 192 colours holds the metal and the green
#rim without banding the glass behind them, at a sixth of the size.
feather(fit(title, 1200)).quantize(colors=192, method=Image.FASTOCTREE).save(
    "images/dd-title.png", optimize=True
)

for n in ("dd-teaser.jpg", "dd-studios.jpg", "dd-title.png"):
    im = Image.open(f"images/{n}")
    kb = len(open(f"images/{n}", "rb").read()) // 1024
    print(f"  {n:16} {im.size}  {kb}KB")
