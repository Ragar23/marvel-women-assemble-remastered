"""Iron Man sprite: a side-facing hover-and-fire pose, to sit alongside
Wanda and Captain Marvel rather than Thor's static front view.
Drawn back-to-front so limbs behind him read as behind him.
Run with: python3 tools/make_ironman.py"""
from PIL import Image, ImageDraw

W, H, SCALE = 52, 48, 2
K  = (22, 11, 14, 255)
D  = (108, 18, 24, 255)   # red, in shadow (his far side)
R  = (183, 31, 37, 255)
L  = (228, 70, 74, 255)
O  = (148, 102, 16, 255)
G  = (212, 156, 32, 255)
Y  = (255, 219, 120, 255)
C  = (96, 206, 245, 255)
B  = (186, 243, 255, 255)
Wt = (255, 255, 255, 255)

im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(im)

# ================= far side of the body, drawn first =================
# trailing leg, swept back behind him
d.polygon([(18, 29), (24, 29), (20, 38), (14, 37)], fill=D)
d.polygon([(14, 36), (20, 37), (16, 44), (10, 42)], fill=D)
d.polygon([(9, 40), (16, 43), (14, 47), (7, 44)], fill=O)
# trailing arm, palm thruster pointed back
d.polygon([(15, 18), (21, 17), (19, 25), (13, 24)], fill=D)
d.polygon([(11, 23), (17, 25), (16, 30), (10, 28)], fill=O)

# ================= torso =================
d.polygon([(18, 17), (34, 16), (34, 21), (18, 22)], fill=R)   # shoulder span
d.polygon([(20, 17), (32, 16), (33, 28), (21, 30)], fill=R)   # chest
d.polygon([(20, 17), (23, 17), (24, 29), (21, 30)], fill=L)   # lit trailing edge
d.polygon([(31, 16), (32, 16), (33, 28), (32, 28)], fill=D)
d.polygon([(18, 17), (22, 17), (22, 22), (18, 22)], fill=L)   # near pauldron
d.polygon([(31, 16), (34, 16), (34, 21), (31, 21)], fill=D)   # far pauldron
d.polygon([(21, 28), (33, 27), (33, 31), (21, 32)], fill=G)   # belt
d.polygon([(30, 27), (33, 27), (33, 31), (30, 31)], fill=O)

# ================= leading leg =================
d.polygon([(23, 29), (30, 29), (31, 37), (24, 38)], fill=R)
d.polygon([(25, 36), (31, 36), (32, 44), (26, 45)], fill=R)
d.polygon([(25, 43), (32, 43), (33, 47), (25, 47)], fill=G)
d.polygon([(25, 43), (27, 43), (27, 47), (25, 47)], fill=Y)

# ================= arc reactor =================
d.ellipse([(23, 19), (29, 25)], fill=C)
d.ellipse([(24, 20), (28, 24)], fill=B)
d.ellipse([(25, 21), (27, 23)], fill=Wt)

# ================= head, on top so it stays legible =================
d.ellipse([(21, 2), (33, 16)], fill=R)                        # helmet dome
d.ellipse([(21, 3), (26, 15)], fill=L)                        # lit back of helm
d.polygon([(27, 3), (31, 2), (33, 8), (27, 8)], fill=R)       # brow, over the mask
d.polygon([(28, 5), (35, 7), (35, 13), (28, 15)], fill=G)     # faceplate, jutting
d.polygon([(33, 6), (35, 7), (35, 13), (33, 13)], fill=O)
d.polygon([(29, 8), (35, 9), (35, 11), (29, 10)], fill=C)     # eye slit
d.polygon([(29, 8), (31, 8), (31, 10), (29, 10)], fill=B)
d.polygon([(30, 12), (34, 13), (34, 14), (30, 13)], fill=O)   # mouth slit

# ================= firing arm, in front of everything =================
d.polygon([(31, 17), (41, 18), (41, 24), (31, 23)], fill=R)
d.polygon([(31, 17), (41, 18), (41, 19), (31, 18)], fill=L)
d.polygon([(40, 17), (45, 18), (45, 25), (40, 24)], fill=G)   # gauntlet
d.polygon([(40, 17), (45, 18), (45, 19), (40, 19)], fill=Y)

# ================= repulsors =================
d.ellipse([(43, 14), (51, 26)], fill=C)                       # blast from the palm
d.ellipse([(44, 16), (50, 24)], fill=B)
d.ellipse([(45, 18), (49, 22)], fill=Wt)
d.ellipse([(8, 26), (14, 32)], fill=C)                        # trailing palm
d.ellipse([(9, 27), (13, 31)], fill=Wt)

px = im.load()

def flame(x, y, length, thick):
    """A tapering streak, so thrusters read as thrust rather than as blobs."""
    for i in range(length):
        t = 1 - i / length
        half = max(0, int(thick * t))
        col = Wt if i < length * 0.25 else (B if i < length * 0.6 else C)
        for off in range(-half, half + 1):
            xx, yy = x - i, y + off
            if 0 <= xx < W and 0 <= yy < H and px[xx, yy][3] == 0:
                px[xx, yy] = col

flame(7, 45, 7, 2)
flame(25, 47, 6, 2)
flame(8, 29, 8, 2)

GLOW = {C, B, Wt}
filled = [[px[x, y][3] > 0 for x in range(W)] for y in range(H)]
solid  = [[px[x, y][3] > 0 and px[x, y] not in GLOW for x in range(W)] for y in range(H)]
for y in range(H):
    for x in range(W):
        if filled[y][x]:
            continue
        if any(0 <= x+dx < W and 0 <= y+dy < H and solid[y+dy][x+dx]
               for dx, dy in ((1,0),(-1,0),(0,1),(0,-1))):
            px[x, y] = K

im.resize((W * SCALE, H * SCALE), Image.NEAREST).save("images/ironman.png")
print(f"ironman.png {W*SCALE}x{H*SCALE}")
