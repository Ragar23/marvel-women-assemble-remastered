"""Every sprite for the Doomsday theme. Run: python3 tools/make_doomsday.py"""
import sys, math
sys.path.insert(0, "tools")
from PIL import Image, ImageDraw
from pixelfigure import figure, save, shade, outline, W, H, SCALE

GREEN      = (46, 168, 74)
GREEN_HOT  = (150, 255, 160)
DOOM_GREEN = (56, 92, 52)
STEEL      = (150, 158, 172)
STEEL_LIT  = (206, 214, 228)
PURPLE     = (126, 74, 196)
PURPLE_HOT = (208, 160, 255)

# ---------------------------------------------------------------- heroes
def storm(d, im, c):
    # Stormbreaker: axe head and haft, with lightning at the edge
    d.polygon([(37, 12), (48, 10), (49, 22), (37, 20)], fill=STEEL)
    d.polygon([(37, 12), (48, 10), (48, 13), (37, 14)], fill=STEEL_LIT)
    d.polygon([(44, 20), (49, 22), (47, 27), (43, 25)], fill=shade(STEEL, 0.7))
    d.rectangle([(33, 15), (38, 18)], fill=(104, 68, 42, 255))
    for x0, y0, x1, y1 in ((46, 6, 47, 9), (50, 12, 51, 15), (45, 27, 46, 30)):
        d.rectangle([(x0, y0), (x1, y1)], fill=(186, 243, 255, 255))

save(figure(suit=(84, 96, 118), accent=(150, 158, 172), hair=(226, 200, 132),
            boots=(60, 62, 78), gloves=(70, 74, 92), cape=(150, 40, 46),
            extra=storm), "dd-thor")

def optic(d, im, c):
    # The beam leaves the visor, widening as it goes, with a white core
    for i in range(33, 52):
        k = (i - 33) / 19
        half = 2 + k * 4
        d.rectangle([(i, 10 - half), (i, 10 + half)], fill=(226, 40, 34, 190))
        d.rectangle([(i, 10 - half * 0.55), (i, 10 + half * 0.55)], fill=(255, 128, 110, 235))
        d.rectangle([(i, 9), (i, 11)], fill=(255, 246, 240, 255))

save(figure(suit=(48, 84, 176), accent=(214, 58, 52), skin=(232, 177, 138),
            hair=(96, 62, 40), boots=(196, 46, 42), gloves=(196, 46, 42),
            visor=(226, 52, 44), extra=optic), "dd-cyclops")

def claws(d, im, c):
    d.polygon([(38, 18), (44, 16), (45, 18), (39, 21)], fill=PURPLE_HOT + (255,) if len(PURPLE_HOT) == 3 else PURPLE_HOT)
    for i in range(3):
        d.rectangle([(41 + i * 2, 15 + i), (42 + i * 2, 24 - i)], fill=(216, 176, 255, 255))

save(figure(suit=(58, 52, 78), accent=PURPLE_HOT, skin=(92, 62, 48),
            helmet=(48, 42, 66), boots=(42, 36, 58), gloves=PURPLE,
            visor=(214, 176, 255), extra=claws), "dd-shuri")

def flame(d, im, c):
    for i, (r, col) in enumerate(((13, (255, 92, 20, 210)), (9, (255, 168, 42, 235)), (5, (255, 236, 150, 255)))):
        d.ellipse([(36 - r + 8, 20 - r), (36 + r + 8, 20 + r)], fill=col)
    for x, y, h in ((16, 6, 7), (24, 3, 9), (31, 5, 8), (10, 12, 6)):
        d.polygon([(x, y + h), (x + 3, y), (x + 6, y + h)], fill=(255, 150, 40, 230))
        d.polygon([(x + 1, y + h), (x + 3, y + 3), (x + 5, y + h)], fill=(255, 232, 140, 240))

save(figure(suit=(238, 118, 26), accent=(255, 214, 110), skin=(255, 196, 96),
            hair=(255, 176, 60), boots=(214, 84, 18), gloves=(255, 196, 96),
            extra=flame), "dd-torch")

# ---------------------------------------------------------------- villains
def doomhand(d, im, c):
    for r, col in ((11, (46, 168, 74, 190)), (7, (120, 240, 130, 225)), (3, (240, 255, 240, 255))):
        d.ellipse([(44 - r, 20 - r), (44 + r, 20 + r)], fill=col)

def doomface(d, im, c):
    #The mask: riveted steel with dark eye slots and a mouth grille, and the
    #green hood of the cowl behind it.
    d.polygon([(19, 3), (27, 2), (28, 17), (20, 16)], fill=(40, 70, 44, 255))
    d.ellipse([(21, 2), (34, 17)], fill=STEEL)
    d.polygon([(21, 2), (27, 2), (26, 16), (22, 15)], fill=STEEL_LIT)
    d.rectangle([(27, 7), (31, 10)], fill=(22, 24, 30, 255))     # eye slot
    d.rectangle([(28, 7), (29, 8)], fill=(150, 255, 160, 255))   # a glint of green
    d.rectangle([(28, 13), (33, 15)], fill=(30, 32, 40, 255))    # mouth grille
    for gx in range(28, 33, 2):
        d.rectangle([(gx, 13), (gx, 15)], fill=STEEL)
    d.rectangle([(22, 1), (32, 2)], fill=(212, 180, 60, 255))    # cowl clasp
    doomhand(d, im, c)

doom = figure(suit=DOOM_GREEN, accent=(96, 140, 88),
              boots=shade(DOOM_GREEN, 0.7), gloves=STEEL,
              cape=(38, 66, 40), extra=doomface)
save(doom, "dd-doom")

def hood_witch(tone, glow, name):
    def spell(d, im, c):
        for r, col in ((9, glow + (150,)), (5, glow + (220,)), (2, (255, 255, 255, 255))):
            d.ellipse([(42 - r, 20 - r), (42 + r, 20 + r)], fill=col)
    save(figure(suit=tone, accent=shade(tone, 1.3), hood=tone,
                boots=shade(tone, 0.6), gloves=shade(tone, 0.8),
                cape=shade(tone, 0.8), belt=False, extra=spell), name)

hood_witch((46, 74, 52), (140, 255, 150), "dd-witch-hex")
hood_witch((40, 58, 64), (150, 220, 255), "dd-witch-ward")
hood_witch((58, 48, 70), (206, 160, 255), "dd-witch-veil")

# ---- Sentinel: a slab of a robot, drawn at its own larger size ----
def sentinel():
    w, h, s = 30, 34, 3
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    body = (132, 68, 168); lit = (176, 116, 208); dark = (86, 40, 116)
    trim = (196, 176, 96)
    d.polygon([(6, 10), (24, 10), (26, 26), (4, 26)], fill=body)      # torso
    d.polygon([(6, 10), (11, 10), (9, 26), (4, 26)], fill=lit)
    d.polygon([(21, 10), (24, 10), (26, 26), (23, 26)], fill=dark)
    d.rectangle([(11, 15), (19, 19)], fill=trim)                      # chest plate
    d.polygon([(9, 2), (21, 2), (22, 9), (8, 9)], fill=body)          # head
    d.rectangle([(10, 4), (20, 6)], fill=(255, 244, 180))             # visor band
    d.rectangle([(1, 12), (5, 24)], fill=dark)                        # arms
    d.rectangle([(25, 12), (29, 24)], fill=dark)
    d.rectangle([(8, 26), (13, 33)], fill=dark)                       # legs
    d.rectangle([(17, 26), (22, 33)], fill=body)
    outline(im)
    im.resize((w * s, h * s), Image.NEAREST).save("images/dd-sentinel.png")

sentinel()

def lokihorns(d, im, c):
    gold = (212, 180, 60, 255)
    d.polygon([(23, 4), (26, 5), (21, -3)], fill=gold)
    d.polygon([(29, 4), (32, 5), (33, -3)], fill=gold)

# ---------------------------------------------------------------- the line-up
LINEUP = [
    ("dd-reed",     dict(suit=(58, 92, 168), accent=(226, 230, 240), skin=(232, 177, 138),
                         hair=(206, 210, 220), boots=(38, 62, 120), gloves=(226, 230, 240))),
    ("dd-beast",    dict(suit=(52, 96, 196), accent=(40, 74, 156), skin=(64, 118, 214),
                         hair=(38, 78, 176), boots=(30, 58, 132), gloves=(64, 118, 214))),
    ("dd-bucky",    dict(suit=(44, 46, 58), accent=STEEL, skin=(232, 177, 138),
                         hair=(72, 54, 40), boots=(30, 30, 40), gloves=STEEL)),
    ("dd-mystique", dict(suit=(28, 60, 74), accent=(210, 180, 60), skin=(78, 150, 168),
                         hair=(190, 60, 60), boots=(22, 46, 58), gloves=(78, 150, 168))),
    ("dd-loki",     dict(suit=(38, 96, 66), accent=(212, 180, 60), skin=(232, 177, 138),
                         hair=(44, 40, 44), boots=(30, 30, 38), gloves=(150, 40, 46),
                         cape=(150, 40, 46), helmet=(212, 180, 60), extra=lokihorns)),
    ("dd-magneto",  dict(suit=(150, 40, 46), accent=(140, 40, 140), skin=(232, 177, 138),
                         hair=(214, 216, 224), boots=(110, 28, 34), gloves=(140, 40, 140),
                         cape=(140, 40, 140), helmet=(150, 40, 46))),
]
for name, kw in LINEUP:
    save(figure(**kw), name)

print("generated:", len([n for n in __import__("os").listdir("images") if n.startswith("dd-")]), "doomsday sprites")

# ---------------------------------------------------------------- variants and props
# Thor without Stormbreaker, for the frames where it is in the air
save(figure(suit=(84, 96, 118), accent=(150, 158, 172), hair=(226, 200, 132),
            boots=(60, 62, 78), gloves=(70, 74, 92), cape=(150, 40, 46)), "dd-thor-empty")

# Johnny fully alight, for Flame On
def blaze(d, im, c):
    for x, y, h in ((8, 2, 10), (16, -1, 12), (25, 1, 11), (33, 4, 9), (4, 10, 8), (38, 12, 8)):
        d.polygon([(x, y + h), (x + 4, y), (x + 8, y + h)], fill=(255, 140, 30, 235))
        d.polygon([(x + 1, y + h), (x + 4, y + 4), (x + 7, y + h)], fill=(255, 238, 150, 245))
    for r, col in ((22, (255, 110, 20, 120)), (15, (255, 176, 50, 160))):
        d.ellipse([(26 - r, 24 - r), (26 + r, 24 + r)], fill=col)

save(figure(suit=(255, 168, 40), accent=(255, 236, 150), skin=(255, 226, 150),
            hair=(255, 220, 120), boots=(255, 132, 24), gloves=(255, 236, 150),
            extra=blaze), "dd-torch-flame")


def prop(name, w, h, s, paint):
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    paint(ImageDraw.Draw(im), im)
    outline(im)
    im.resize((w * s, h * s), Image.NEAREST).save(f"images/{name}.png")

# Stormbreaker, thrown
prop("dd-stormbreaker", 20, 16, 3, lambda d, im: (
    d.polygon([(1, 2), (11, 1), (12, 12), (1, 13)], fill=STEEL),
    d.polygon([(1, 2), (11, 1), (11, 4), (1, 5)], fill=STEEL_LIT),
    d.polygon([(9, 12), (13, 13), (11, 15), (8, 14)], fill=shade(STEEL, 0.7)),
    d.rectangle([(12, 6), (18, 9)], fill=(104, 68, 42, 255)),
    d.rectangle([(3, 6), (6, 8)], fill=(186, 243, 255, 255)),
))

# Optic blast bolt
prop("dd-optic", 26, 10, 3, lambda d, im: (
    d.ellipse([(0, 1), (25, 8)], fill=(226, 40, 34, 255)),
    d.ellipse([(3, 2), (24, 7)], fill=(255, 128, 110, 255)),
    d.ellipse([(7, 3), (23, 6)], fill=(255, 250, 245, 255)),
))

# Shuri's kinetic pulse
prop("dd-claw", 16, 14, 3, lambda d, im: (
    d.polygon([(2, 1), (14, 6), (2, 12), (6, 6)], fill=(126, 74, 196, 255)),
    d.polygon([(4, 3), (12, 6), (4, 10), (7, 6)], fill=(208, 160, 255, 255)),
    d.polygon([(6, 5), (11, 6), (6, 8)], fill=(255, 255, 255, 255)),
))

# Fireball
prop("dd-fire", 16, 14, 3, lambda d, im: (
    d.ellipse([(0, 1), (13, 12)], fill=(255, 110, 20, 255)),
    d.ellipse([(2, 3), (12, 11)], fill=(255, 186, 60, 255)),
    d.ellipse([(4, 5), (10, 9)], fill=(255, 250, 210, 255)),
    d.polygon([(13, 4), (16, 7), (13, 10)], fill=(255, 150, 40, 255)),
))
print("variants and props written")

# ---------------------------------------------------------------- background
# The original scene is a bright blue-purple moonscape. Doomsday wants it
# darker and green, so it is desaturated, dimmed, and tinted rather than
# redrawn from scratch.
from PIL import ImageEnhance
bg = Image.open("images/bg.png").convert("RGB")
bg = ImageEnhance.Color(bg).enhance(0.30)      # pull most of the purple out
bg = ImageEnhance.Brightness(bg).enhance(0.46) # and take it down
px = bg.load()
for y in range(bg.height):
    for x in range(bg.width):
        r, g, b = px[x, y]
        # push what light remains toward green, and hold the blues back
        px[x, y] = (int(r * 0.62), int(min(255, g * 1.08 + 6)), int(b * 0.66))
glow = Image.new("RGB", bg.size, (0, 0, 0))
gd = ImageDraw.Draw(glow)
for i in range(26):                              # a soft green wash from above
    k = i / 26
    gd.rectangle([(0, int(k * bg.height)), (bg.width, bg.height)],
                 fill=(0, int(16 * (1 - k)), int(6 * (1 - k))))
bg = Image.blend(bg, Image.blend(bg, glow, 0.0), 0)
bg = Image.composite(bg, bg, Image.new("L", bg.size, 255))
from PIL import ImageChops
bg = ImageChops.add(bg, glow)
bg.save("images/dd-bg.png")
print("dd-bg.png written", bg.size)
