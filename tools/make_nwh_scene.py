"""Everything in the No Way Home branch that is not a character sprite:
the projectiles, the set dressing, the night skyline behind the fight, the
broken spell that stands in for the incursion globe, and the menu art.

Run from the repo root:  python3 tools/make_nwh_scene.py
"""
import math
import random
import sys

sys.path.insert(0, "tools")
from PIL import Image, ImageDraw, ImageFilter
import pixelgrid as pg
from pixelgrid import grid, put, box, save_set

pg.PALETTE.update({
    "W": (248, 248, 252), "w": (186, 196, 216), "E": (16, 16, 24),
    "G": (240, 178, 52),  "g": (172, 118, 26),
    "Y": (255, 228, 146), "X": (255, 250, 216),
    "R": (198, 34, 42),   "r": (138, 20, 28),
    "1": (48, 52, 66),    "6": (232, 228, 218), "8": (28, 26, 32),
})


#=====================================================================#
#  PROJECTILES
#=====================================================================#
def web():
    """A thrown web: a knot with the strand trailing behind it, so the
    direction of travel is legible on a single frame."""
    g = grid(22, 12)
    put(g, 5, 0, "wwWWww")
    put(g, 6, 2, "wwWW")
    put(g, 3, 12, "wWw")
    put(g, 4, 11, "wWWWw")
    put(g, 5, 10, "wWWWWWw")
    put(g, 6, 10, "wWWWWWw")
    put(g, 7, 11, "wWWWw")
    put(g, 8, 12, "wWw")
    #the strands crossing it, which is what makes it a web and not a rock
    put(g, 4, 13, "E"); put(g, 6, 12, "E"); put(g, 6, 15, "E"); put(g, 7, 13, "E")
    return g


def mandala():
    """Strange's bolt: a ring of the same gold as the spell meter, open at
    the trailing edge."""
    g = grid(22, 14)
    put(g, 4, 12, "gGYGg")
    put(g, 5, 10, "gGYXYGg")
    put(g, 6, 9, "gGYXXXYGg")
    put(g, 7, 10, "gGYXYGg")
    put(g, 8, 12, "gGYGg")
    put(g, 6, 3, "gGGg")
    put(g, 5, 6, "gG"); put(g, 7, 6, "gG")
    return g


def bugle(frame):
    """The set dressing: a newsstand screen down at street level running
    Jameson's broadcast, cutting between the two things it ever says."""
    g = grid(22, 16)
    box(g, 0, 1, 11, 20, "1")
    box(g, 1, 2, 10, 19, "8")
    if frame == 0:
        put(g, 3, 4, "RRRRRRRRRRRRRR")
        put(g, 5, 4, "6666666666")
        put(g, 7, 4, "666666666666")
    else:
        put(g, 3, 4, "GGGGGGGGGG")
        put(g, 5, 4, "666666666666")
        put(g, 7, 4, "6666666")
    #the stand it is bolted to
    put(g, 12, 8, "111111")
    put(g, 13, 8, "111111")
    put(g, 14, 5, "111111111111")
    put(g, 15, 5, "888888888888")
    return g


save_set([("nwh-web", web())], scale=6)
save_set([("nwh-mandala", mandala())], scale=6)
save_set([("nwh-bugle1", bugle(0)), ("nwh-bugle2", bugle(1))], scale=6)


#=====================================================================#
#  THE BROKEN SPELL
#
#  Stands in for the incursion globe: it is drawn in the sky and again on
#  the meter, so it has to read at 512 px and at 40. A ring of runes with
#  a crack running through it does both — the crack is the silhouette.
#=====================================================================#
def spell(size=512):
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = size / 2
    random.seed(17)

    def ring(radius, width, colour, dashes=0):
        bbox = [c - radius, c - radius, c + radius, c + radius]
        if not dashes:
            d.ellipse(bbox, outline=colour, width=width)
            return
        step = 360 / dashes
        for i in range(dashes):
            a0 = i * step
            d.arc(bbox, a0, a0 + step * 0.55, fill=colour, width=width)

    GOLD = (240, 178, 52, 255)
    HOT = (255, 236, 176, 255)
    DEEP = (150, 96, 16, 255)

    ring(c * 0.94, max(2, size // 90), DEEP)
    ring(c * 0.88, max(3, size // 64), GOLD, dashes=24)
    ring(c * 0.72, max(2, size // 100), GOLD)
    ring(c * 0.62, max(3, size // 80), HOT, dashes=12)
    ring(c * 0.40, max(2, size // 110), GOLD, dashes=8)
    ring(c * 0.22, max(3, size // 90), HOT)

    #the runes on the outer band
    for i in range(24):
        a = math.radians(i * 15)
        r0, r1 = c * 0.76, c * 0.86
        d.line(
            [(c + math.cos(a) * r0, c + math.sin(a) * r0),
             (c + math.cos(a) * r1, c + math.sin(a) * r1)],
            fill=GOLD, width=max(2, size // 120),
        )

    #the crack: a jagged line straight through the middle, drawn in the
    #background's own colour so it reads as the spell coming apart
    x, y = c - c * 0.98, c - c * 0.30
    pts = [(x, y)]
    while x < c + c * 0.98:
        x += size * 0.06
        y += random.uniform(-1, 1) * size * 0.07
        pts.append((x, y))
    d.line(pts, fill=(6, 10, 24, 255), width=max(4, size // 46))
    d.line([(p[0], p[1] - size / 70) for p in pts], fill=HOT, width=max(2, size // 150))
    return im


sp = spell()
sp.save("images/nwh-spell.png", optimize=True)
print(f"  nwh-spell.png {sp.size}")


#=====================================================================#
#  THE SKYLINE
#
#  Night, and a long way down: a deep blue-black city with the scaffolded
#  Statue of Liberty on the skyline, because that is where the film ends
#  up. Kept dark and low-contrast on purpose — everything that matters in
#  a run is drawn on top of it.
#=====================================================================#
BG_W, BG_H = 1366, 768


def vertical(im, top, bottom):
    d = ImageDraw.Draw(im)
    for y in range(im.height):
        t = y / max(1, im.height - 1)
        d.line(
            [(0, y), (im.width, y)],
            fill=tuple(int(a + (b - a) * t) for a, b in zip(top, bottom)),
        )


def skyline():
    im = Image.new("RGB", (BG_W, BG_H))
    vertical(im, (9, 14, 38), (34, 28, 54))

    #a low sodium glow on the horizon, where the city is still awake
    glow = Image.new("RGB", (BG_W, BG_H), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([BG_W * 0.1, BG_H * 0.55, BG_W * 0.95, BG_H * 1.2],
               fill=(96, 68, 44))
    im = Image.blend(im, glow.filter(ImageFilter.GaussianBlur(90)), 0.5)

    d = ImageDraw.Draw(im)
    random.seed(23)

    #the stars that survive a city sky, which is not many
    for _ in range(90):
        x, y = random.randrange(BG_W), random.randrange(int(BG_H * 0.45))
        v = random.randint(90, 190)
        d.point((x, y), fill=(v, v, int(v * 1.1)))

    #three ranks of buildings, each nearer and darker
    for rank, (base_y, height, tone, lit) in enumerate((
        (BG_H * 0.62, 0.30, (26, 30, 58), (120, 132, 190)),
        (BG_H * 0.72, 0.36, (17, 20, 44), (96, 108, 165)),
        (BG_H * 0.84, 0.42, (10, 12, 30), (74, 84, 135)),
    )):
        x = -40
        while x < BG_W + 40:
            w = random.randint(46, 128)
            h = random.randint(int(BG_H * height * 0.35), int(BG_H * height))
            top = base_y - h
            d.rectangle([x, top, x + w, BG_H], fill=tone)
            #lit windows, sparse and in a grid so they read as a building
            for wy in range(int(top) + 14, int(BG_H), 22):
                for wx in range(int(x) + 8, int(x + w) - 6, 16):
                    if random.random() < 0.16 - rank * 0.03:
                        d.rectangle([wx, wy, wx + 5, wy + 8], fill=lit)
            x += w + random.randint(6, 22)

    #the statue, scaffolded, off to one side
    sx, sy = BG_W * 0.80, BG_H * 0.60
    body = (46, 74, 72)
    d.polygon([(sx - 34, BG_H), (sx - 18, sy + 40), (sx + 18, sy + 40), (sx + 34, BG_H)],
              fill=body)
    d.rectangle([sx - 12, sy - 46, sx + 12, sy + 44], fill=body)
    d.ellipse([sx - 13, sy - 62, sx + 13, sy - 36], fill=(58, 90, 86))
    for i in range(7):                                    # the crown
        a = math.radians(180 + i * 30)
        d.line([(sx, sy - 50),
                (sx + math.cos(a) * 30, sy - 50 + math.sin(a) * 30)],
               fill=(58, 90, 86), width=4)
    d.line([(sx + 8, sy - 44), (sx + 30, sy - 120)], fill=body, width=9)  # the arm
    d.ellipse([sx + 22, sy - 140, sx + 42, sy - 116], fill=(240, 200, 110))
    #the scaffolding it is wrapped in
    for i in range(6):
        y = sy + 44 - i * 26
        d.line([(sx - 40, y), (sx + 40, y)], fill=(120, 104, 78), width=2)
    for i in range(5):
        x = sx - 40 + i * 20
        d.line([(x, sy - 70), (x, BG_H)], fill=(120, 104, 78), width=2)

    #the tear in the sky, which is the whole plot
    tear = Image.new("RGBA", (BG_W, BG_H), (0, 0, 0, 0))
    td = ImageDraw.Draw(tear)
    random.seed(5)
    x, y = BG_W * 0.06, BG_H * 0.16
    pts = [(x, y)]
    while x < BG_W * 0.52:
        x += 34
        y += random.uniform(-1, 1) * 26
        pts.append((x, y))
    td.line(pts, fill=(255, 214, 132, 70), width=26)
    td.line(pts, fill=(255, 240, 200, 130), width=6)
    tear = tear.filter(ImageFilter.GaussianBlur(3))
    im = im.convert("RGBA")
    im.alpha_composite(tear)
    return im.convert("RGB")


bg = skyline()
bg.save("images/nwh-bg.png", optimize=True)
print(f"  nwh-bg.png {bg.size}")


#=====================================================================#
#  MENU ART
#
#  The Doomsday branch cut its wordmark and its studios card out of the
#  teaser art the user shared. There is no screenshot to cut this one
#  from, so both are drawn: the title in assets/Marvel.ttf, which is the
#  face the game already ships and the closest thing here to the real
#  lettering, and the card off the skyline that is already generated.
#=====================================================================#
from PIL import ImageFont

MARVEL = "assets/Marvel.ttf"
TITLE_W, TITLE_H = 1200, 480


def gold_text(d, im, xy, text, font, anchor="mm"):
    """Fill the glyphs with a vertical gold ramp instead of one flat colour,
    which is most of what makes a wordmark look struck rather than typed."""
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).text(xy, text, font=font, fill=255, anchor=anchor)
    ramp = Image.new("RGBA", im.size)
    rd = ImageDraw.Draw(ramp)
    box_ = mask.getbbox()
    top, bottom = (box_[1], box_[3]) if box_ else (0, im.height)
    for y in range(im.height):
        t = min(1, max(0, (y - top) / max(1, bottom - top)))
        rd.line([(0, y), (im.width, y)], fill=(
            int(255 - 30 * t), int(232 - 74 * t), int(178 - 128 * t), 255))
    im.paste(ramp, (0, 0), mask)
    return mask


def title():
    im = Image.new("RGBA", (TITLE_W, TITLE_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    small = ImageFont.truetype(MARVEL, 108)
    big = ImageFont.truetype(MARVEL, 250)

    #"SPIDER-MAN" sits above it in plain white, the way the poster stacks
    #it. Marvel.ttf has no hyphen glyph — it renders as a blank of the
    #right width — so the dash is drawn into that gap by hand.
    d.text((TITLE_W / 2, 96), "SPIDER-MAN", font=small,
           fill=(236, 238, 246, 255), anchor="mm")
    full = small.getlength("SPIDER-MAN")
    dash_x = TITLE_W / 2 - full / 2 + small.getlength("SPIDER")
    dash_w = small.getlength("-")
    d.rectangle([dash_x + dash_w * 0.18, 90, dash_x + dash_w * 0.82, 101],
                fill=(236, 238, 246, 255))

    #a drop shadow under the wordmark, then the gold on top of it
    d.text((TITLE_W / 2 + 7, 292), "NO WAY HOME", font=big,
           fill=(24, 10, 6, 190), anchor="mm")
    mask = gold_text(d, im, (TITLE_W / 2, 285), "NO WAY HOME", big)

    #the crack from the spell, running through the lettering — only inside
    #the glyphs, so it reads as the title breaking rather than a scribble
    crack = Image.new("RGBA", im.size, (0, 0, 0, 0))
    cd = ImageDraw.Draw(crack)
    random.seed(9)
    x, y = 60, 300
    pts = [(x, y)]
    while x < TITLE_W - 40:
        x += 46
        y += random.uniform(-1, 1) * 26
        pts.append((x, y))
    cd.line(pts, fill=(10, 14, 32, 235), width=9)
    cd.line([(p[0], p[1] - 5) for p in pts], fill=(255, 246, 214, 210), width=3)
    im.paste(crack, (0, 0), Image.composite(
        crack.split()[3], Image.new("L", im.size, 0), mask))

    d.text((TITLE_W / 2, 424), "MARVEL STUDIOS", font=ImageFont.truetype(MARVEL, 58),
           fill=(190, 196, 214, 255), anchor="mm")
    return im


t = title()
t.save("images/nwh-title.png", optimize=True)
print(f"  nwh-title.png {t.size}")


def studios():
    """The card the menu holds behind while the sprites load."""
    card = bg.copy().convert("RGBA")
    card = card.resize((1600, int(1600 * card.height / card.width)), Image.LANCZOS)
    dark = Image.new("RGBA", card.size, (4, 8, 22, 150))
    card.alpha_composite(dark)
    logo = Image.open("images/Marvelstudios.png").convert("RGBA")
    w = int(card.width * 0.46)
    logo = logo.resize((w, int(w * logo.height / logo.width)), Image.LANCZOS)
    card.alpha_composite(logo, ((card.width - logo.width) // 2,
                                (card.height - logo.height) // 2))
    return card.convert("RGB")


s = studios()
s.save("images/nwh-studios.jpg", quality=86, optimize=True, progressive=True)
print(f"  nwh-studios.jpg {s.size}")


#=====================================================================#
#  HOME-SCREEN ICONS
#
#  Same job as tools/make_icons.py does on the Doomsday branch: an iPhone
#  can only play without browser chrome from the home screen, and that
#  wants a real icon rather than the page's data-URI favicon.
#=====================================================================#
def icon(size):
    im = Image.new("RGBA", (size, size), (10, 14, 34, 255))
    d = ImageDraw.Draw(im)
    for i in range(28, 0, -1):
        k = i / 28
        r = int(size * 0.62 * k)
        d.ellipse([size / 2 - r, size / 2 - r, size / 2 + r, size / 2 + r],
                  fill=(int(10 + 44 * (1 - k)), int(14 + 20 * (1 - k)),
                        int(34 + 30 * (1 - k)), 255))
    mask = Image.open("images/nwh-holland.png").convert("RGBA")
    scale = max(1, int(size * 0.78 / max(mask.size)))
    mask = mask.resize((mask.width * scale, mask.height * scale), Image.NEAREST)
    im.alpha_composite(mask, ((size - mask.width) // 2, (size - mask.height) // 2))
    return im


for size in (192, 512):
    out = icon(size)
    out.save(f"images/icon-{size}.png", optimize=True)
    print(f"  icon-{size}.png {out.size}")
icon(180).save("images/apple-touch-icon.png", optimize=True)
print("  apple-touch-icon.png (180, 180)")
