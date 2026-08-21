"""Captain America: a side-facing throwing stance, and the shield that flies
off on its own. Same 52x48 grid at 2x as the Iron Man sprite.
Run with: python3 tools/make_cap.py"""
from PIL import Image, ImageDraw

K  = (16, 18, 26, 255)
B  = (43, 79, 158, 255)    # suit blue
Bl = (72, 118, 214, 255)   # lit
Bd = (26, 48, 104, 255)    # shadowed
R  = (192, 57, 43, 255)    # red
Rd = (138, 34, 26, 255)
Wh = (238, 242, 250, 255)  # white
Wd = (196, 205, 224, 255)
Sk = (232, 177, 138, 255)  # skin
Sd = (196, 140, 104, 255)

# ------------------------------------------------ the hero
W, H, SCALE = 52, 48, 2
cx, cy, r = 44, 20, 8


def build(weapon):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    # far leg, trailing
    d.polygon([(17, 29), (23, 29), (19, 38), (13, 37)], fill=Bd)
    d.polygon([(13, 36), (19, 37), (15, 44), (9, 42)], fill=Bd)
    d.polygon([(8, 40), (15, 43), (13, 47), (6, 44)], fill=Rd)
    # far arm, drawn back for the throw
    d.polygon([(15, 18), (21, 17), (18, 25), (12, 24)], fill=Bd)
    d.polygon([(10, 23), (16, 25), (14, 30), (8, 28)], fill=Rd)

    # torso, leaning into the throw
    d.polygon([(18, 16), (32, 15), (33, 28), (20, 30)], fill=B)
    d.polygon([(18, 16), (22, 16), (23, 29), (20, 30)], fill=Bl)
    d.polygon([(31, 15), (32, 15), (33, 28), (32, 28)], fill=Bd)
    d.polygon([(20, 23), (33, 22), (33, 25), (20, 26)], fill=Wh)   # chest stripes
    d.polygon([(20, 26), (33, 25), (33, 28), (20, 29)], fill=R)
    # white star straight onto the blue, no plate behind it
    d.polygon([(26, 16), (27, 18.4), (29.4, 18.4), (27.4, 20), (28.2, 22.4),
               (26, 21), (23.8, 22.4), (24.6, 20), (22.6, 18.4), (25, 18.4)], fill=Wh)
    d.polygon([(20, 28), (33, 27), (33, 31), (20, 32)], fill=Rd)   # belt

    # near leg, forward
    d.polygon([(22, 29), (29, 29), (30, 37), (23, 38)], fill=B)
    d.polygon([(24, 36), (30, 36), (31, 44), (25, 45)], fill=B)
    d.polygon([(24, 43), (31, 43), (32, 47), (24, 47)], fill=R)

    # head, in profile: cowl over everything, face open at the front
    d.ellipse([(21, 3), (33, 16)], fill=B)                          # cowl
    d.polygon([(27, 9), (33, 9), (33, 15), (28, 15)], fill=Sk)      # face opening
    d.polygon([(31, 13), (33, 13), (33, 15), (31, 15)], fill=Sd)    # jaw shadow
    d.rectangle([(30, 10), (31, 11)], fill=(28, 32, 46, 255))       # eye
    # the A, drawn as strokes so it survives at this size
    d.rectangle([(28, 4), (28, 8)], fill=Wh)
    d.rectangle([(31, 4), (31, 8)], fill=Wh)
    d.rectangle([(29, 3), (30, 3)], fill=Wh)
    d.rectangle([(29, 6), (30, 6)], fill=Wh)
    # side wing
    d.polygon([(22, 6), (26, 7), (26, 9), (22, 9)], fill=Wh)
    d.polygon([(23, 7), (25, 7.6), (25, 8.4), (23, 8.4)], fill=B)
    d.polygon([(23, 16), (29, 15), (29, 17), (23, 18)], fill=Sd)    # neck

    # throwing arm, extended
    d.polygon([(30, 16), (38, 17), (38, 23), (30, 22)], fill=B)
    d.polygon([(30, 16), (38, 17), (38, 18), (30, 17)], fill=Bl)
    d.polygon([(37, 16), (42, 17), (42, 24), (37, 23)], fill=R)    # glove

    # what he is holding
    if weapon is None:
        return im
    if weapon == "mjolnir":
        # Worthy: Mjolnir in hand, wreathed in lightning
        d.rectangle([(36, 17), (43, 19)], fill=(104, 68, 42, 255))      # handle
        d.rectangle([(43, 13), (50, 23)], fill=(150, 158, 172, 255))    # head
        d.rectangle([(43, 13), (50, 14)], fill=(206, 214, 228, 255))
        d.rectangle([(43, 22), (50, 23)], fill=(96, 104, 120, 255))
        d.rectangle([(44, 16), (46, 18)], fill=(214, 226, 240, 255))    # sheen
        # short diagonal arcs, so it crackles rather than sprouting ears
        for pts in (((42, 11), (44, 12), (43, 10)),
                    ((51, 12), (49, 13), (52, 14)),
                    ((41, 25), (44, 24), (42, 27)),
                    ((51, 24), (49, 23), (52, 26))):
            d.polygon(pts, fill=(186, 243, 255, 255))
        return im
    for rad, col in ((r, R), (r - 1.5, Wh), (r - 3, R), (r - 4.5, B)):
        d.ellipse([(cx - rad, cy - rad), (cx + rad, cy + rad)], fill=col)
    d.polygon([(cx, cy - 3), (cx + 1, cy - 1), (cx + 3, cy - 1), (cx + 1.4, cy + 0.4),
               (cx + 2, cy + 2.6), (cx, cy + 1.4), (cx - 2, cy + 2.6), (cx - 1.4, cy + 0.4),
               (cx - 3, cy - 1), (cx - 1, cy - 1)], fill=Wh)

    return im


def outline(image):
    px = image.load()
    w, h = image.size
    filled = [[px[x, y][3] > 0 for x in range(w)] for y in range(h)]
    for y in range(h):
        for x in range(w):
            if filled[y][x]:
                continue
            if any(0 <= x+dx < w and 0 <= y+dy < h and filled[y+dy][x+dx]
                   for dx, dy in ((1,0),(-1,0),(0,1),(0,-1))):
                px[x, y] = K

held = build("shield")
outline(held)
held.resize((W * SCALE, H * SCALE), Image.NEAREST).save("images/cap.png")
print(f"cap.png {W*SCALE}x{H*SCALE}")

# The same figure with an empty hand, for the frames where the shield is in
# flight — otherwise he throws it and is still visibly holding it.
empty = build(None)
outline(empty)
empty.resize((W * SCALE, H * SCALE), Image.NEAREST).save("images/cap-empty.png")
print(f"cap-empty.png {W*SCALE}x{H*SCALE}")

# Worthy: the Endgame moment, for the fifteen seconds he holds the hammer.
worthy = build("mjolnir")
outline(worthy)
worthy.resize((W * SCALE, H * SCALE), Image.NEAREST).save("images/cap-worthy.png")
print(f"cap-worthy.png {W*SCALE}x{H*SCALE}")

# ------------------------------------------------ the thrown shield
S, SC = 22, 2
sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
ds = ImageDraw.Draw(sh)
c, rad = (S - 1) / 2, (S - 1) / 2
for rr, col in ((rad, R), (rad - 2, Wh), (rad - 3.5, R), (rad - 5.5, B)):
    ds.ellipse([(c - rr, c - rr), (c + rr, c + rr)], fill=col)
ds.polygon([(c, c - 3.4), (c + 1, c - 1), (c + 3.4, c - 1), (c + 1.5, c + 0.5),
            (c + 2.2, c + 3), (c, c + 1.5), (c - 2.2, c + 3), (c - 1.5, c + 0.5),
            (c - 3.4, c - 1), (c - 1, c - 1)], fill=Wh)
outline(sh)
sh.resize((S * SC, S * SC), Image.NEAREST).save("images/shield.png")
print(f"shield.png {S*SC}x{S*SC}")
