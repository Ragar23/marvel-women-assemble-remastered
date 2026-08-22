"""Every sprite for the Doomsday theme. Run: python3 tools/make_doomsday.py"""
import sys, math
sys.path.insert(0, "tools")
from PIL import Image, ImageDraw
from pixelfigure import figure, save, shade, outline, limb, W, H

GREEN      = (46, 168, 74)
GREEN_HOT  = (150, 255, 160)
DOOM_GREEN = (56, 92, 52)
STEEL      = (150, 158, 172)
STEEL_LIT  = (206, 214, 228)
PURPLE     = (126, 74, 196)
PURPLE_HOT = (208, 160, 255)

# ---------------------------------------------------------------- heroes
YELLOW = (232, 196, 58)
YELLOW_D = (176, 142, 30)

def cyclops_kit(d, im, c):
    """Blue suit with the yellow harness: straps over both shoulders meeting
    at the chest, a yellow belt, and dark side panels."""
    cx, hw = c["cx"], c["hw"]
    d.polygon([(cx - hw + 3, 36), (cx + 2, 44), (cx + 2, 50), (cx - hw + 3, 42)], fill=YELLOW)
    d.polygon([(cx + hw - 4, 34), (cx + 2, 44), (cx + 2, 50), (cx + hw - 4, 40)], fill=YELLOW_D)
    d.rectangle([(cx - 2, 44), (cx + 4, 52)], fill=YELLOW)          # chest plate
    d.polygon([(cx - 1, 45), (cx + 3, 51), (cx + 3, 45), (cx - 1, 51)], fill=(196, 40, 44, 255))
    d.polygon([(cx + hw - 6, 40), (cx + hw - 1, 39), (cx + hw - 2, 62), (cx + hw - 7, 62)],
              fill=(24, 38, 84, 255))                                # dark side panel
    d.rectangle([(cx - hw + 2, 63), (cx + hw - 1, 71)], fill=YELLOW)  # belt
    d.rectangle([(cx - 2, 63), (cx + 6, 71)], fill=YELLOW_D)
    d.polygon([(cx - 1, 64), (cx + 5, 70), (cx + 5, 64), (cx - 1, 70)], fill=(196, 40, 44, 255))

def optic(d, im, c):
    cx = c["cx"]
    for i in range(cx + 12, 104):
        k = (i - cx - 12) / (104 - cx - 12)
        half = 3 + k * 6
        d.rectangle([(i, 17 - half), (i, 17 + half)], fill=(226, 40, 34, 180))
        d.rectangle([(i, 17 - half * 0.55), (i, 17 + half * 0.55)], fill=(255, 128, 110, 230))
        d.rectangle([(i, 16), (i, 18)], fill=(255, 250, 246, 255))

save(figure(suit=(52, 92, 190), build="athletic", hair=(84, 54, 34),
            boots=(112, 68, 40), gloves=(30, 32, 44), visor=(226, 52, 44),
            belt=YELLOW, detail=cyclops_kit, extra=optic), "dd-cyclops")

#Thor lives in tools/make_hires.py now, drawn on a 27x34 logical grid and
#upscaled, so that he stands next to the hand-drawn Cyclops without looking
#like a thumbnail of himself. The 104x96 builder below could not get there.

def shuri_kit(d, im, c):
    cx, hw = c["cx"], c["hw"]
    for i in range(6):                                               # vibranium seams
        d.line([(cx - hw + 3, 40 + i * 5), (cx + hw - 3, 38 + i * 5)],
               fill=(126, 74, 196, 255), width=1)
    d.polygon([(cx - 4, 42), (cx + 4, 40), (cx + 6, 50), (cx, 54), (cx - 6, 50)],
              fill=(150, 96, 226, 255))                              # panther silver

def shuri_claws(d, im, c):
    cx, hw = c["cx"], c["hw"]
    for i in range(3):
        d.polygon([(cx + hw + 30, 40 + i * 5), (cx + hw + 44, 36 + i * 6),
                   (cx + hw + 30, 44 + i * 5)], fill=(216, 176, 255, 255))

save(figure(suit=(46, 42, 62), build="slim", helmet=(38, 34, 54), skin=(92, 62, 48),
            boots=(34, 30, 48), gloves=(126, 74, 196), visor=(214, 176, 255),
            belt=(126, 74, 196), detail=shuri_kit, extra=shuri_claws), "dd-shuri")

#The Human Torch is in tools/make_hires.py for the same reason, and because
#he now needs four frames rather than two: the blue suit, and three of him
#alight that the game cycles while he is throwing fire.

# ---------------------------------------------------------------- Doctor Doom
# Drawn front-on rather than through the shared side-facing builder: he is
# the boss, he faces the player, and both hands are up and charged.
def doctor_doom():
    im = Image.new("RGBA", (104, 104), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    CLOAK = (44, 82, 44); CLOAK_L = (66, 112, 62); CLOAK_D = (26, 52, 30)
    MASK = (156, 162, 170); MASK_L = (206, 212, 220); MASK_D = (96, 102, 112)
    GOLD = (214, 176, 52); DARK = (20, 26, 20)

    d.polygon([(18, 40), (52, 22), (86, 40), (92, 100), (12, 100)], fill=CLOAK)   # cloak
    d.polygon([(18, 40), (52, 22), (52, 100), (12, 100)], fill=CLOAK_L)
    d.polygon([(74, 34), (86, 40), (92, 100), (74, 100)], fill=CLOAK_D)
    d.polygon([(30, 18), (52, 8), (74, 18), (78, 44), (26, 44)], fill=CLOAK_D)    # hood
    d.polygon([(30, 18), (52, 8), (52, 44), (26, 44)], fill=CLOAK)

    d.rounded_rectangle([(38, 20), (66, 54)], radius=5, fill=MASK)                # mask
    d.rounded_rectangle([(38, 20), (52, 54)], radius=5, fill=MASK_L)
    d.rectangle([(42, 30), (49, 37)], fill=(250, 250, 250))                       # eyes
    d.rectangle([(55, 30), (62, 37)], fill=(250, 250, 250))
    d.rectangle([(44, 32), (47, 36)], fill=DARK)
    d.rectangle([(57, 32), (60, 36)], fill=DARK)
    d.rectangle([(41, 42), (63, 51)], fill=MASK_D)                                # grille
    for gx in range(43, 63, 4):
        d.rectangle([(gx, 42), (gx + 1, 51)], fill=MASK_L)
    d.rectangle([(36, 54), (68, 58)], fill=GOLD)                                  # collar clasp
    d.ellipse([(48, 52), (56, 60)], fill=GOLD)

    d.rectangle([(34, 74), (70, 82)], fill=(58, 44, 30))                          # belt
    d.rectangle([(46, 72), (58, 84)], fill=GOLD)
    d.rectangle([(50, 76), (54, 80)], fill=DARK)
    d.rectangle([(24, 92), (48, 104)], fill=MASK_D)                               # boots
    d.rectangle([(56, 92), (80, 104)], fill=MASK_D)

    for cx, cy in ((20, 66), (84, 66)):                                           # charged hands
        for r, col in ((15, (60, 200, 80, 150)), (11, (120, 240, 130, 210)),
                       (7, (200, 255, 200, 245)), (3, (255, 255, 255, 255))):
            d.ellipse([(cx - r, cy - r), (cx + r, cy + r)], fill=col)
        d.rectangle([(cx - 6, cy - 4), (cx + 6, cy + 4)], fill=MASK_D)
        d.rectangle([(cx - 6, cy - 4), (cx + 6, cy - 1)], fill=MASK)
    save(im, "dd-doom")

doctor_doom()

# ---------------------------------------------------------------- the coven
def witch(tone, glow, name):
    def spell(d, im, c):
        cx, hw = c["cx"], c["hw"]
        for r, col in ((14, glow + (140,)), (9, glow + (215,)), (4, (255, 255, 255, 255))):
            d.ellipse([(cx + hw + 24 - r, 46 - r), (cx + hw + 24 + r, 46 + r)], fill=col)
    def robes(d, im, c):
        cx, hw = c["cx"], c["hw"]
        for i in range(5):                       # hanging folds
            d.line([(cx - hw + 4 + i * 6, 40), (cx - hw + 2 + i * 6, 70)],
                   fill=shade(tone, 0.62), width=1)
    save(figure(suit=tone, build="slim", hood=tone, boots=shade(tone, 0.55),
                gloves=shade(tone, 0.75), cape=shade(tone, 0.72),
                belt=shade(tone, 0.5), detail=robes, extra=spell), name)

witch((48, 78, 54), (140, 255, 150), "dd-witch-hex")
witch((40, 58, 66), (150, 220, 255), "dd-witch-ward")
witch((60, 48, 74), (206, 160, 255), "dd-witch-veil")

# The Sentinel moved to tools/make_hires.py with Thor and the Torch. It is
# the enemy on screen most of the time and the one the teaser shows closest,
# so it needed the same density as they got — weathered plate with two green
# optics, rather than the purple toy this file could manage.

# ---------------------------------------------------------------- the line-up
LINEUP = [
    ("dd-reed",     dict(suit=(58, 92, 168), build="slim", skin=(232, 177, 138),
                         hair=(210, 214, 224), hairStyle="swept", boots=(38, 62, 120),
                         gloves=(226, 230, 240), belt=(226, 230, 240))),
    ("dd-beast",    dict(suit=(52, 96, 196), build="heavy", skin=(64, 118, 214),
                         hair=(34, 70, 168), hairStyle="long", boots=(30, 58, 132),
                         gloves=(64, 118, 214), belt=(30, 58, 132))),
    ("dd-bucky",    dict(suit=(44, 46, 58), build="athletic", skin=(232, 177, 138),
                         hair=(72, 54, 40), hairStyle="long", boots=(28, 28, 38),
                         gloves=STEEL, belt=(28, 28, 38))),
    ("dd-mystique", dict(suit=(30, 66, 80), build="slim", skin=(78, 150, 168),
                         hair=(196, 58, 58), hairStyle="long", boots=(22, 46, 58),
                         gloves=(78, 150, 168), belt=(210, 180, 60))),
    ("dd-loki",     dict(suit=(38, 96, 66), build="slim", skin=(232, 177, 138),
                         hair=(40, 36, 40), hairStyle="long", boots=(28, 28, 36),
                         gloves=(150, 40, 46), cape=(150, 40, 46), belt=(212, 180, 60))),
    ("dd-magneto",  dict(suit=(158, 40, 46), build="athletic", skin=(232, 177, 138),
                         hair=(218, 220, 228), hairStyle="short", boots=(104, 26, 32),
                         gloves=(142, 40, 142), cape=(142, 40, 142), helmet=(158, 40, 46),
                         belt=(142, 40, 142))),
]
for name, kw in LINEUP:
    save(figure(**kw), name)
print("all doomsday art regenerated")
