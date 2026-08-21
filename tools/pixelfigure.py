"""Shared builder for the side-facing pixel figures.

Drawn at 104x96 with no upscaling, which is the same density as the original
scarlet-witch.png (98x96) — the earlier 52x48-at-2x builder had barely a
quarter of that and every character came out looking like the same doll in
different colours.

Silhouette varies per character through `build`, `hair`, `cape`, `helmet`
and a `detail` callback for costume work, so a heavy character is visibly
heavier and a costume can carry straps, emblems and panel lines.
"""
import pathlib
from PIL import Image, ImageDraw

W, H = 104, 96
OUTLINE = (14, 14, 20, 255)

BUILDS = {                 # torso half-width, limb thickness, shoulder drop
    "slim":     (13, 7, 2),
    "athletic": (16, 9, 1),
    "heavy":    (21, 12, 0),
}


def shade(rgb, f):
    r, g, b = rgb[:3]
    return (max(0, min(255, int(r * f))), max(0, min(255, int(g * f))),
            max(0, min(255, int(b * f))), 255)


def outline(im):
    #Reads the image's own size: the bosses are not on the standard canvas.
    w, h = im.size
    px = im.load()
    filled = [[px[x, y][3] > 0 for x in range(w)] for y in range(h)]
    for y in range(h):
        for x in range(w):
            if filled[y][x]:
                continue
            if any(0 <= x + dx < w and 0 <= y + dy < h and filled[y + dy][x + dx]
                   for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                px[x, y] = OUTLINE


def limb(d, pts, thick, colour):
    """A jointed limb: quads between the points plus discs at the joints, so
    the segments actually connect instead of floating apart."""
    for i in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        dx, dy = x1 - x0, y1 - y0
        length = max(1e-6, (dx * dx + dy * dy) ** 0.5)
        nx, ny = -dy / length * thick / 2, dx / length * thick / 2
        d.polygon([(x0 + nx, y0 + ny), (x1 + nx, y1 + ny),
                   (x1 - nx, y1 - ny), (x0 - nx, y0 - ny)], fill=colour)
    for x, y in pts:
        d.ellipse([(x - thick / 2, y - thick / 2), (x + thick / 2, y + thick / 2)], fill=colour)


def figure(suit, skin=(232, 177, 138), build="athletic", hair=None,
           hairStyle="short", boots=None, gloves=None, cape=None, hood=None,
           helmet=None, visor=None, belt=None, detail=None, extra=None):
    hw, limb_thick, drop = BUILDS[build]
    limb_t = limb_thick
    lit, dark = shade(suit, 1.30), shade(suit, 0.60)
    boots = boots or dark
    gloves = gloves or dark
    belt = belt or shade(suit, 0.5)
    cx = 50                                   # body centre line

    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    if cape:
        d.polygon([(cx - hw, 38), (cx + 6, 36), (cx + 14, 88), (cx - 30, 92)],
                  fill=shade(cape, 0.62))
        d.polygon([(cx - hw, 38), (cx - 2, 37), (cx - 4, 86), (cx - 24, 89)], fill=cape)

    # ---- far limbs, behind the body ----
    limb(d, [(cx - 4, 64), (cx - 14, 76), (cx - 22, 88)], limb_t, dark)
    d.polygon([(cx - 30, 84), (cx - 18, 88), (cx - 20, 94), (cx - 33, 90)],
              fill=shade(boots, 0.68))
    limb(d, [(cx - hw + 4, 42 + drop), (cx - 20, 56), (cx - 28, 68)], limb_t - 1, dark)
    d.ellipse([(cx - 34, 63), (cx - 22, 75)], fill=shade(gloves, 0.7))

    # ---- torso ----
    d.polygon([(cx - hw, 36 + drop), (cx + hw, 34 + drop), (cx + hw - 1, 66), (cx - hw + 2, 68)],
              fill=suit)
    d.polygon([(cx - hw, 36 + drop), (cx - hw + 6, 35 + drop), (cx - hw + 5, 67), (cx - hw + 2, 68)],
              fill=lit)
    d.polygon([(cx + hw - 5, 34 + drop), (cx + hw, 34 + drop), (cx + hw - 1, 66), (cx + hw - 6, 66)],
              fill=dark)
    # shoulders sit proud of the chest, which is most of what reads as bulk
    d.ellipse([(cx - hw - 3, 34 + drop), (cx - hw + 9, 46 + drop)], fill=lit)
    d.ellipse([(cx + hw - 9, 32 + drop), (cx + hw + 3, 44 + drop)], fill=suit)

    if detail:
        detail(d, im, {"cx": cx, "hw": hw, "suit": suit, "lit": lit, "dark": dark})

    d.polygon([(cx - hw + 2, 64), (cx + hw - 1, 62), (cx + hw - 1, 70), (cx - hw + 2, 72)],
              fill=belt)

    # ---- near leg ----
    limb(d, [(cx + 4, 64), (cx + 12, 77), (cx + 10, 90)], limb_t + 2, suit)
    limb(d, [(cx + 4, 64), (cx + 10, 77)], 4, lit)
    d.polygon([(cx + 2, 87), (cx + 17, 87), (cx + 18, 95), (cx + 1, 95)], fill=boots)
    d.polygon([(cx + 2, 87), (cx + 8, 87), (cx + 8, 95), (cx + 1, 95)], fill=shade(boots, 1.28))

    # ---- head ----
    hx0, hy0, hx1, hy1 = cx - 12, 4, cx + 12, 32
    if hood:
        d.ellipse([(hx0 - 2, hy0), (hx1 + 2, hy1 + 2)], fill=hood)
        d.polygon([(cx + 2, 12), (cx + 14, 14), (cx + 14, 28), (cx + 3, 28)],
                  fill=(16, 14, 22, 255))
        d.polygon([(hx0 - 2, hy0 + 3), (cx - 4, hy0 + 1), (cx - 6, hy1), (hx0, hy1 - 2)],
                  fill=shade(hood, 0.68))
    else:
        d.ellipse([(hx0, hy0), (hx1, hy1)], fill=skin)
        d.polygon([(cx + 6, 22), (cx + 13, 23), (cx + 12, 30), (cx + 5, 30)],
                  fill=shade(skin, 0.86))          # jaw shadow
        if hair and hairStyle == "short":
            d.ellipse([(hx0 - 1, hy0 - 1), (hx1, hy0 + 17)], fill=hair)
            d.polygon([(hx0 - 1, hy0 + 6), (cx + 2, hy0 + 2), (cx + 4, hy0 + 12), (hx0 - 1, hy0 + 16)],
                      fill=shade(hair, 0.8))
        elif hair and hairStyle == "long":
            d.ellipse([(hx0 - 3, hy0 - 1), (hx1, hy0 + 18)], fill=hair)
            d.polygon([(hx0 - 3, hy0 + 8), (cx - 2, hy0 + 6), (cx - 4, 46), (hx0 - 6, 44)], fill=hair)
        elif hair and hairStyle == "swept":
            d.ellipse([(hx0 - 1, hy0 - 2), (hx1 + 1, hy0 + 15)], fill=hair)
            d.polygon([(hx0 - 4, hy0 + 2), (cx, hy0 - 2), (cx + 8, hy0 + 4), (hx0 - 2, hy0 + 12)],
                      fill=shade(hair, 1.15))
        if helmet:
            d.ellipse([(hx0 - 2, hy0 - 2), (hx1 + 2, hy1)], fill=helmet)
            d.polygon([(cx + 4, 14), (cx + 14, 15), (cx + 13, 28), (cx + 4, 27)],
                      fill=shade(helmet, 0.78))
    if visor:
        d.polygon([(cx - 4, 14), (cx + 14, 15), (cx + 14, 21), (cx - 4, 20)], fill=visor)
        d.polygon([(cx - 2, 15), (cx + 6, 16), (cx + 6, 18), (cx - 2, 17)],
                  fill=shade(visor, 1.5))
    elif not hood:
        d.rectangle([(cx + 7, 16), (cx + 9, 18)], fill=(30, 32, 44, 255))
    d.polygon([(cx - 6, 30), (cx + 6, 29), (cx + 5, 37), (cx - 5, 38)],
              fill=shade(skin if not hood else hood, 0.75))

    # ---- front arm, reaching ----
    limb(d, [(cx + hw - 4, 41 + drop), (cx + hw + 10, 44), (cx + hw + 22, 45)], limb_t, suit)
    limb(d, [(cx + hw - 4, 40 + drop), (cx + hw + 8, 42)], 4, lit)
    d.ellipse([(cx + hw + 18, 39), (cx + hw + 32, 53)], fill=gloves)

    if extra:
        extra(d, im, {"cx": cx, "hw": hw, "suit": suit, "lit": lit, "dark": dark})
    return im


#Any sprite name listed in images/handmade.txt is art someone drew by hand
#and dropped in. The generators leave those alone, so re-running a tool
#never quietly overwrites better art than it can make.
def handmade():
    f = pathlib.Path("images/handmade.txt")
    if not f.exists():
        return set()
    return {
        line.split("#")[0].strip()
        for line in f.read_text().splitlines()
        if line.split("#")[0].strip()
    }


def save(im, name):
    if name in handmade():
        print(f"  skip {name}.png (listed in images/handmade.txt)")
        return name
    outline(im)
    im.save(f"images/{name}.png")
    return name
