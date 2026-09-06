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


def lerp(a, b, t):
    return tuple(int(x + (y - x) * t) for x, y in zip(a, b))


#=====================================================================#
#  THE CITY
#
#  The old skyline was three ranks of plain rectangles with windows
#  sprinkled at random, which reads as a bar chart. Two things fix that
#  and neither is detail for its own sake.
#
#  The first is that buildings have tops. A Manhattan skyline is
#  setbacks, spires, water towers and masts, and the silhouette against
#  the sky is the only part of a night city you actually see.
#
#  The second is that windows are not noise. A tower is lit by floor and
#  by column — a stack of offices someone left on, a lift core dark all
#  the way up — so lighting each building with one habit of its own, and
#  keeping whole buildings dark, is what makes the rest look occupied.
#=====================================================================#
def crown(d, x, w, top, tone, lit, rank, rng):
    """Whatever the building does where it stops. Returns nothing: it
    draws above `top`, which the body has already reached."""
    kind = rng.random()
    cx = x + w / 2

    if kind < 0.22:
        #Setbacks: the ziggurat step-ins of a pre-war tower
        step_w, step_y = w, top
        for _ in range(rng.randint(2, 3)):
            step_w *= rng.uniform(0.55, 0.75)
            h = rng.randint(10, 26)
            d.rectangle([cx - step_w / 2, step_y - h, cx + step_w / 2, step_y], fill=tone)
            step_y -= h
        if rng.random() < 0.6:
            d.line([(cx, step_y), (cx, step_y - rng.randint(14, 34))], fill=tone, width=3)
    elif kind < 0.36:
        #A spire off a narrow shoulder
        sh = rng.randint(12, 22)
        d.polygon([(x + w * 0.3, top), (x + w * 0.7, top),
                   (x + w * 0.62, top - sh), (x + w * 0.38, top - sh)], fill=tone)
        d.polygon([(cx - 3, top - sh), (cx + 3, top - sh),
                   (cx, top - sh - rng.randint(26, 60))], fill=tone)
    elif kind < 0.5:
        #Water tower on legs, the most New York thing on a roof
        tw, th = rng.randint(12, 18), rng.randint(12, 18)
        ty = top - rng.randint(8, 14)
        d.rectangle([cx - tw / 2, ty - th, cx + tw / 2, ty], fill=tone)
        d.polygon([(cx - tw / 2 - 2, ty - th), (cx + tw / 2 + 2, ty - th),
                   (cx, ty - th - 8)], fill=tone)
        for leg in (-tw / 2 + 2, tw / 2 - 2):
            d.line([(cx + leg, ty), (cx + leg, top)], fill=tone, width=2)
    elif kind < 0.62:
        #A mast, with the red light aircraft are meant to see
        mh = rng.randint(22, 52)
        d.line([(cx, top), (cx, top - mh)], fill=tone, width=2)
        if rank < 2:
            d.ellipse([cx - 2, top - mh - 2, cx + 2, top - mh + 2], fill=(190, 60, 60))
    elif kind < 0.7:
        #A pitched crown
        d.polygon([(x, top), (x + w, top), (cx, top - rng.randint(16, 30))], fill=tone)
    #and the rest simply stop, which most of them do


def windows(d, x, w, top, base, lit, rank, rng):
    """One habit per building. A tower lit at random is noise; a tower
    lit by floor, or by column, or barely at all, is a tower."""
    style = rng.random()
    if style < 0.18:
        return  #dark all the way up, and the skyline needs a few

    step_y, step_x = 11, 9
    cols = int((w - 10) // step_x)
    rows = int((base - top - 14) // step_y)
    if cols < 1 or rows < 1:
        return

    #A lift core: one column that is never lit, which is the detail that
    #stops a grid of windows reading as graph paper.
    core = rng.randrange(cols) if cols > 3 else -1
    density = 0.22 - rank * 0.05

    if style < 0.42:
        #By floor: whole storeys left on
        for r in range(rows):
            on = rng.random() < density * 1.6
            for c in range(cols):
                if c == core or (not on and rng.random() > density * 0.35):
                    continue
                wx, wy = x + 6 + c * step_x, top + 10 + r * step_y
                d.rectangle([wx, wy, wx + 4, wy + 6], fill=lit)
    elif style < 0.66:
        #By column: a stack of the same office, floor after floor
        for c in range(cols):
            if c == core:
                continue
            on = rng.random() < density * 1.7
            for r in range(rows):
                if not on and rng.random() > density * 0.3:
                    continue
                wx, wy = x + 6 + c * step_x, top + 10 + r * step_y
                d.rectangle([wx, wy, wx + 4, wy + 6], fill=lit)
    else:
        #Scattered, but sparse — the building nobody is working late in
        for r in range(rows):
            for c in range(cols):
                if c == core or rng.random() > density * 0.7:
                    continue
                wx, wy = x + 6 + c * step_x, top + 10 + r * step_y
                d.rectangle([wx, wy, wx + 4, wy + 6], fill=lit)


#=====================================================================#
#  THE STATUE
#
#  Drawn rather than suggested. The old one was a cone with a stick for
#  an arm and a dot for the torch, and at the size it sits on screen it
#  read as a Christmas tree.
#
#  What makes the silhouette hers, in order of how much each one carries:
#  the seven-point crown, the raised torch arm, the tablet held across
#  the body, and the robe falling wider than the shoulders. Everything
#  here is in those four things; the rest is shading.
#
#  Lit from the left, because the sodium glow on this horizon is, and
#  given a warm rim on the torch side so the flame looks like it is
#  throwing light rather than sitting on top of her.
#=====================================================================#
def statue(im, cx, feet_y, body):
    """Her, at `body` pixels from the soles of her feet to the top of her
    head. Everything is measured off that, in the proportions the real
    thing has: the head is a seventh of her, the shoulders a quarter, the
    hem only half again as wide as the shoulders — not the bell the first
    pass drew — and the torch reaches half her height again above her.

    Lit from the left, because the sodium glow on this horizon is, with a
    warm edge on the torch side so the flame reads as throwing light
    rather than sitting on top of her.
    """
    d = ImageDraw.Draw(im, "RGBA")
    b = body

    COPPER = (54, 98, 92)
    COPPER_LIT = (84, 136, 124)
    COPPER_DARK = (30, 60, 58)
    COPPER_EDGE = (120, 172, 152)
    STONE = (26, 30, 44)
    STONE_LIT = (40, 45, 62)
    STONE_DARK = (17, 20, 31)

    #---- the pedestal ----
    #Dark, and darker than the buildings beside her: the first pass made
    #it pale and it read as a rock she was standing on.
    ped_h = b * 0.72
    top_w, bot_w = b * 0.30, b * 0.46
    py = feet_y
    d.polygon([(cx - bot_w / 2, py), (cx + bot_w / 2, py),
               (cx + top_w / 2, py - ped_h), (cx - top_w / 2, py - ped_h)], fill=STONE)
    d.polygon([(cx - bot_w / 2, py), (cx - bot_w * 0.18, py),
               (cx - top_w * 0.12, py - ped_h), (cx - top_w / 2, py - ped_h)], fill=STONE_LIT)
    #cornice, and the balcony rail she stands behind
    d.rectangle([cx - top_w * 0.62, py - ped_h - b * 0.035,
                 cx + top_w * 0.62, py - ped_h], fill=STONE_LIT)
    d.rectangle([cx - top_w * 0.56, py - ped_h - b * 0.06,
                 cx + top_w * 0.56, py - ped_h - b * 0.035], fill=STONE_DARK)

    base = py - ped_h - b * 0.06           # her soles
    Y = lambda f: base - b * f             # f = fraction of her height, up
    hem_half = b * 0.175
    sh_half = b * 0.12

    #---- the robe ----
    #Straight-sided and only half again wider at the hem than at the
    #shoulder, with the hem broken so one knee reads as forward. A single
    #symmetrical trapezoid was what made the first attempt a dress.
    d.polygon([
        (cx - hem_half, Y(0)), (cx - hem_half * 0.15, Y(0.02)),
        (cx + hem_half * 0.2, Y(0)), (cx + hem_half * 0.98, Y(0.015)),
        (cx + sh_half * 1.02, Y(0.46)), (cx + sh_half, Y(0.78)),
        (cx - sh_half, Y(0.78)), (cx - sh_half * 1.06, Y(0.46)),
    ], fill=COPPER)
    #the lit half, down her left
    d.polygon([
        (cx - hem_half, Y(0)), (cx - hem_half * 0.42, Y(0.01)),
        (cx - sh_half * 0.34, Y(0.46)), (cx - sh_half * 0.42, Y(0.78)),
        (cx - sh_half, Y(0.78)), (cx - sh_half * 1.06, Y(0.46)),
    ], fill=COPPER_LIT)
    #drapery: lines that converge as the cloth does, not parallel bars
    for k in range(6):
        t = (k + 0.6) / 6.6
        d.line([(cx - sh_half * 0.9 + sh_half * 1.8 * t, Y(0.74)),
                (cx - hem_half * 0.94 + hem_half * 1.9 * t, Y(0.012))],
               fill=COPPER_DARK, width=max(1, int(b * 0.008)))

    #---- shoulders, neck, head ----
    d.polygon([(cx - sh_half, Y(0.78)), (cx + sh_half, Y(0.78)),
               (cx + sh_half * 0.72, Y(0.845)), (cx - sh_half * 0.72, Y(0.845))],
              fill=COPPER)
    d.polygon([(cx - sh_half, Y(0.78)), (cx - sh_half * 0.2, Y(0.78)),
               (cx - sh_half * 0.2, Y(0.845)), (cx - sh_half * 0.72, Y(0.845))],
              fill=COPPER_LIT)
    #A neck, not a notch: copper with the shadow only on the side away
    #from the glow. Drawn dark all over, it read as a gap under her chin.
    d.rectangle([cx - b * 0.035, Y(0.875), cx + b * 0.035, Y(0.83)], fill=COPPER)
    d.rectangle([cx + b * 0.008, Y(0.875), cx + b * 0.035, Y(0.83)], fill=COPPER_DARK)

    hh = b * 0.145                      # a seventh of her, as it should be
    hx, hy = cx, Y(0.925)
    d.ellipse([hx - hh * 0.40, hy - hh * 0.5, hx + hh * 0.40, hy + hh * 0.5], fill=COPPER)
    d.ellipse([hx - hh * 0.40, hy - hh * 0.5, hx + hh * 0.04, hy + hh * 0.5], fill=COPPER_LIT)
    #A face at this size is one shadow and nothing else. The first pass
    #ruled a brow and a jaw across her and she came out bandaged.
    d.polygon([(hx + hh * 0.04, hy - hh * 0.34), (hx + hh * 0.4, hy - hh * 0.2),
               (hx + hh * 0.4, hy + hh * 0.24), (hx + hh * 0.08, hy + hh * 0.44)],
              fill=COPPER_DARK)

    #---- the crown: seven points, fanned across the top only ----
    for i in range(7):
        a = math.radians(204 + i * 22)
        r0, r1 = hh * 0.52, hh * 1.16
        x0, y0 = hx + math.cos(a) * r0, hy + math.sin(a) * r0
        x1, y1 = hx + math.cos(a) * r1, hy + math.sin(a) * r1
        n = (-math.sin(a) * hh * 0.13, math.cos(a) * hh * 0.13)
        d.polygon([(x0 + n[0], y0 + n[1]), (x0 - n[0], y0 - n[1]), (x1, y1)],
                  fill=COPPER_EDGE if math.cos(a) < -0.2 else COPPER)
    #the band the points spring from, at the hairline — it was drawn as a
    #full ellipse before, which put a ring straight across her face
    d.arc([hx - hh * 0.44, hy - hh * 0.56, hx + hh * 0.44, hy + hh * 0.04],
          200, 340, fill=COPPER_DARK, width=max(1, int(b * 0.009)))

    #---- the raised arm and the torch ----
    hand_x, hand_y = cx + b * 0.30, Y(1.30)
    aw = max(2, int(b * 0.055))
    d.line([(cx + sh_half * 0.86, Y(0.80)), (hand_x, hand_y)], fill=COPPER, width=aw)
    d.line([(cx + sh_half * 0.86 - aw * 0.28, Y(0.80)), (hand_x - aw * 0.28, hand_y)],
           fill=COPPER_LIT, width=max(1, int(aw * 0.42)))
    #The sleeve falling from the raised arm, tucked back under the
    #shoulder so it grows out of her instead of stepping off the edge.
    d.polygon([(cx + sh_half * 0.35, Y(0.775)), (cx + sh_half * 1.1, Y(0.80)),
               (cx + b * 0.132, Y(0.95)), (cx + b * 0.07, Y(0.99)),
               (cx + sh_half * 0.3, Y(0.86))], fill=COPPER)

    #---- the tablet, held against her, not beside her ----
    tw, th = b * 0.13, b * 0.20
    tx, ty = cx - b * 0.155, Y(0.44)
    d.polygon([(tx, ty), (tx + tw, ty - th * 0.22), (tx + tw, ty + th * 0.78), (tx, ty + th)],
              fill=COPPER_DARK)
    d.polygon([(tx + b * 0.012, ty + b * 0.016), (tx + tw - b * 0.012, ty - th * 0.22 + b * 0.016),
               (tx + tw - b * 0.012, ty + th * 0.68), (tx + b * 0.012, ty + th - b * 0.016)],
              fill=(44, 78, 76))
    #the forearm across it, which is what makes it held rather than
    #propped beside her. Copper, not the lit tone: a pale bar across the
    #tablet read as a strap.
    d.line([(cx - sh_half * 0.86, Y(0.72)), (tx + tw * 0.66, ty + th * 0.06)],
           fill=COPPER, width=max(2, int(b * 0.042)))
    d.line([(cx - sh_half * 0.86, Y(0.72) - b * 0.012), (tx + tw * 0.66, ty + th * 0.06 - b * 0.012)],
           fill=COPPER_LIT, width=max(1, int(b * 0.016)))

    #---- the torch ----
    d.polygon([(hand_x - b * 0.032, hand_y + b * 0.02), (hand_x + b * 0.032, hand_y + b * 0.02),
               (hand_x + b * 0.022, hand_y - b * 0.06), (hand_x - b * 0.022, hand_y - b * 0.06)],
              fill=(196, 164, 92))
    d.ellipse([hand_x - b * 0.042, hand_y - b * 0.09, hand_x + b * 0.042, hand_y - b * 0.05],
              fill=(214, 184, 112))
    glow = Image.new("RGBA", im.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([hand_x - b * 0.24, hand_y - b * 0.34, hand_x + b * 0.24, hand_y + b * 0.10],
               fill=(255, 206, 128, 70))
    im.alpha_composite(glow.filter(ImageFilter.GaussianBlur(max(4, b * 0.09))))
    d = ImageDraw.Draw(im, "RGBA")
    d.polygon([(hand_x - b * 0.034, hand_y - b * 0.08), (hand_x + b * 0.034, hand_y - b * 0.08),
               (hand_x, hand_y - b * 0.20)], fill=(255, 214, 130))
    d.polygon([(hand_x - b * 0.016, hand_y - b * 0.08), (hand_x + b * 0.016, hand_y - b * 0.08),
               (hand_x, hand_y - b * 0.15)], fill=(255, 248, 214))

    #---- and the scaffolding she is wrapped in ----
    #She is mid-refit in the film, and the scaffold is half of why the
    #shot is recognisable. Tube and clamp: standards up, ledgers across,
    #and diagonal bracing in two bays only — a brace in every bay is a
    #lattice, and a lattice at this size fills in solid.
    #
    #Drawn last, so it stands in front of her rather than behind.
    STEEL = (112, 104, 84)
    STEEL_LIT = (146, 138, 112)
    DECK = (86, 78, 60)
    LAMP = (255, 196, 96)

    sc_half = hem_half * 1.22
    sc_top = 0.96                       # up to her chin, not over her face
    lifts = 6
    stands = 5
    px = max(1, int(b * 0.006))

    #standards
    for i in range(stands):
        x = cx - sc_half + (2 * sc_half) * i / (stands - 1)
        d.line([(x, Y(-0.01)), (x, Y(sc_top))], fill=STEEL, width=px)
    #ledgers, one per lift
    for k in range(lifts + 1):
        f = sc_top * k / lifts
        d.line([(cx - sc_half, Y(f)), (cx + sc_half, Y(f))],
               fill=STEEL_LIT if k % 2 else STEEL, width=px)
    #bracing, two bays, opposite diagonals so it reads as a truss
    bay = 2 * sc_half / (stands - 1)
    for i, k in ((0, 1), (3, 3)):
        x0 = cx - sc_half + bay * i
        f0, f1 = sc_top * k / lifts, sc_top * (k + 1) / lifts
        d.line([(x0, Y(f0)), (x0 + bay, Y(f1))], fill=STEEL, width=px)
        d.line([(x0 + bay, Y(f0)), (x0, Y(f1))], fill=STEEL, width=px)
    #two working platforms, which is what tells you somebody is up there
    for k in (2, 4):
        f = sc_top * k / lifts
        d.rectangle([cx - sc_half - b * 0.012, Y(f), cx + sc_half + b * 0.012,
                     Y(f) + max(1, int(b * 0.012))], fill=DECK)
    #the hoist mast, running past her shoulder with a jib over the crown
    mx = cx + sc_half + b * 0.05
    d.line([(mx, Y(-0.01)), (mx, Y(1.18))], fill=STEEL, width=px)
    d.line([(mx, Y(1.18)), (mx - b * 0.16, Y(1.18))], fill=STEEL, width=px)
    d.line([(mx - b * 0.12, Y(1.18)), (mx - b * 0.12, Y(1.05))], fill=STEEL, width=px)
    #work lights, warm against all that copper
    for lx, lf in ((cx - sc_half, 0.64), (cx + sc_half, 0.32), (mx, 1.18)):
        d.ellipse([lx - px, Y(lf) - px, lx + px, Y(lf) + px], fill=LAMP)


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
    rng = random.Random(23)

    #the stars that survive a city sky, which is not many
    for _ in range(90):
        x, y = rng.randrange(BG_W), rng.randrange(int(BG_H * 0.45))
        v = rng.randint(90, 190)
        d.point((x, y), fill=(v, v, int(v * 1.1)))

    #Four ranks now rather than three, and the far ones are washed toward
    #the sky rather than merely darker: distance takes contrast away
    #before it takes brightness, which is the whole of aerial perspective
    #and the cheapest depth there is.
    HAZE = (38, 44, 78)
    for rank, (base_y, height, tone, lit) in enumerate((
        (BG_H * 0.58, 0.24, (30, 36, 68), (108, 122, 178)),
        (BG_H * 0.66, 0.30, (24, 29, 58), (116, 128, 184)),
        (BG_H * 0.76, 0.37, (16, 19, 43), (96, 108, 165)),
        (BG_H * 0.88, 0.44, (9, 11, 28), (74, 84, 135)),
    )):
        #the further back, the more of the sky is mixed into it
        tone = lerp(tone, HAZE, max(0.0, 0.34 - rank * 0.12))
        x = -40
        while x < BG_W + 40:
            w = rng.randint(38, 116)
            h = rng.randint(int(BG_H * height * 0.4), int(BG_H * height))
            top = base_y - h
            d.rectangle([x, top, x + w, BG_H], fill=tone)
            crown(d, x, w, top, tone, lit, rank, rng)
            windows(d, x, w, top, BG_H, lit, rank, rng)
            x += w + rng.randint(4, 20)

        #a band of haze between ranks, so they separate without a line
        if rank < 3:
            veil = Image.new("RGBA", (BG_W, BG_H), (0, 0, 0, 0))
            vd = ImageDraw.Draw(veil)
            vd.rectangle([0, base_y - 30, BG_W, base_y + 40], fill=HAZE + (44,))
            im = Image.alpha_composite(im.convert("RGBA"),
                                       veil.filter(ImageFilter.GaussianBlur(18))).convert("RGB")
            d = ImageDraw.Draw(im)

    #---- her, standing where the harbour would be ----
    im = im.convert("RGBA")
    #Far side of the harbour, not in the foreground: she is a landmark
    #the fight happens in front of, and at the first size she was a
    #wall down the right of the play area.
    statue(im, BG_W * 0.845, BG_H * 1.06, BG_H * 0.27)

    #the tear in the sky, which is the whole plot
    tear = Image.new("RGBA", (BG_W, BG_H), (0, 0, 0, 0))
    td = ImageDraw.Draw(tear)
    trng = random.Random(5)
    x, y = BG_W * 0.06, BG_H * 0.16
    pts = [(x, y)]
    while x < BG_W * 0.52:
        x += 34
        y += trng.uniform(-1, 1) * 26
        pts.append((x, y))
    td.line(pts, fill=(255, 214, 132, 70), width=26)
    td.line(pts, fill=(255, 240, 200, 130), width=6)
    tear = tear.filter(ImageFilter.GaussianBlur(3))
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
