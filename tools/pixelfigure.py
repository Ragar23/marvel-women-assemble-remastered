"""Shared builder for the side-facing pixel figures.

Every character in the game stands on the same 52x48 grid at 2x, facing
right in a stride. Writing fourteen of those by hand would guarantee they
drifted apart, so the pose lives here once and each character supplies only
its colours and props.
"""
from PIL import Image, ImageDraw

W, H, SCALE = 52, 48, 2
OUTLINE = (16, 16, 22, 255)


def shade(rgb, factor):
    r, g, b = rgb[:3]
    return (max(0, min(255, int(r * factor))),
            max(0, min(255, int(g * factor))),
            max(0, min(255, int(b * factor))), 255)


def outline(im, skip=()):
    px = im.load()
    w, h = im.size
    solid = [[px[x, y][3] > 0 and px[x, y] not in skip for x in range(w)] for y in range(h)]
    filled = [[px[x, y][3] > 0 for x in range(w)] for y in range(h)]
    for y in range(h):
        for x in range(w):
            if filled[y][x]:
                continue
            if any(0 <= x + dx < w and 0 <= y + dy < h and solid[y + dy][x + dx]
                   for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                px[x, y] = OUTLINE


def figure(suit, skin=(232, 177, 138), accent=None, hair=None, boots=None,
           gloves=None, cape=None, hood=None, helmet=None, eye=(28, 32, 46),
           visor=None, belt=True, extra=None):
    """The common stride. `extra` is a callback for anything the character
    holds or radiates, drawn last so it sits in front."""
    lit, dark = shade(suit, 1.28), shade(suit, 0.62)
    accent = accent or suit
    boots = boots or dark
    gloves = gloves or dark

    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    if cape:
        d.polygon([(20, 15), (30, 14), (34, 40), (8, 44)], fill=shade(cape, 0.7))
        d.polygon([(20, 15), (25, 15), (24, 42), (12, 43)], fill=cape)

    # far leg and arm, behind the body
    d.polygon([(17, 29), (23, 29), (19, 38), (13, 37)], fill=dark)
    d.polygon([(13, 36), (19, 37), (15, 44), (9, 42)], fill=dark)
    d.polygon([(8, 40), (15, 43), (13, 47), (6, 44)], fill=shade(boots, 0.7))
    d.polygon([(15, 18), (21, 17), (18, 25), (12, 24)], fill=dark)
    d.polygon([(10, 23), (16, 25), (14, 30), (8, 28)], fill=shade(gloves, 0.7))

    # torso
    d.polygon([(18, 16), (32, 15), (33, 28), (20, 30)], fill=suit)
    d.polygon([(18, 16), (22, 16), (23, 29), (20, 30)], fill=lit)
    d.polygon([(31, 15), (32, 15), (33, 28), (32, 28)], fill=dark)
    if belt:
        d.polygon([(20, 28), (33, 27), (33, 31), (20, 32)], fill=shade(accent, 0.85))

    # near leg
    d.polygon([(22, 29), (29, 29), (30, 37), (23, 38)], fill=suit)
    d.polygon([(24, 36), (30, 36), (31, 44), (25, 45)], fill=suit)
    d.polygon([(24, 43), (31, 43), (32, 47), (24, 47)], fill=boots)

    # head
    if hood:
        d.ellipse([(20, 2), (34, 17)], fill=hood)
        d.polygon([(27, 7), (34, 8), (34, 14), (28, 15)], fill=(18, 16, 24, 255))
        d.polygon([(19, 4), (26, 3), (24, 16), (18, 14)], fill=shade(hood, 0.7))
    else:
        d.ellipse([(21, 3), (33, 16)], fill=skin)
        if hair:
            d.polygon([(20, 2), (32, 2), (33, 8), (20, 9)], fill=hair)
            d.ellipse([(20, 2), (28, 12)], fill=hair)
        if helmet:
            d.ellipse([(20, 2), (33, 16)], fill=helmet)
            d.polygon([(27, 8), (33, 9), (33, 15), (28, 15)], fill=shade(helmet, 0.75))
    if visor:
        d.polygon([(26, 8), (34, 9), (34, 12), (26, 11)], fill=visor)
    elif not hood:
        d.rectangle([(30, 9), (31, 10)], fill=eye)
    d.polygon([(23, 16), (29, 15), (29, 18), (23, 19)], fill=shade(skin, 0.8) if not hood else shade(hood, 0.6))

    # front arm, reaching
    d.polygon([(30, 16), (38, 17), (38, 23), (30, 22)], fill=suit)
    d.polygon([(30, 16), (38, 17), (38, 18), (30, 17)], fill=lit)
    d.polygon([(37, 16), (42, 17), (42, 24), (37, 23)], fill=gloves)

    if extra:
        extra(d, im, {"suit": suit, "lit": lit, "dark": dark, "accent": accent})
    return im


def save(im, name, skip=()):
    outline(im, skip)
    im.resize((W * SCALE, H * SCALE), Image.NEAREST).save(f"images/{name}.png")
    return name
