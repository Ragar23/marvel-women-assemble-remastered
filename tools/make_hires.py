"""The hi-fidelity half of the cast: Thor and the Human Torch.

The generators in make_doomsday.py draw straight onto a 104x96 canvas, which
is all the resolution they get. The hand-drawn art that has since replaced
Cyclops, Beast and Mystique is chunky pixel art — a small logical grid blown
up so every pixel is a visible block — and next to it the 104x96 figures
read as mush.

So these are authored the same way the hand-drawn art is: a 27x34 logical
grid, one character per pixel, outlined and then upscaled with NEAREST so
the blocks stay hard-edged. 27x34 at x11 lands on 297x374, which is the same
density as images/dd-cyclops.png (231x325, roughly a 21x30 grid).

Run: python3 tools/make_hires.py
"""
import sys
sys.path.insert(0, "tools")
from PIL import Image
from pixelfigure import handmade

SCALE = 11
GW, GH = 27, 34
OUTLINE = (12, 12, 18, 255)

PALETTE = {
    #---- Thor
    "A": (64, 78, 104),    "a": (98, 118, 150),   "d": (40, 50, 70),
    "S": (206, 214, 230),  "s": (150, 160, 182),  "t": (102, 112, 134),
    "C": (168, 40, 46),    "c": (112, 26, 32),
    "K": (238, 190, 150),  "k": (200, 150, 112),
    "H": (232, 204, 136),  "h": (182, 152, 86),   "B": (156, 126, 66),
    "E": (28, 32, 46),     "G": (198, 160, 72),   "g": (128, 96, 44),
    #---- Human Torch, cold
    "N": (44, 72, 150),    "n": (26, 44, 104),    "l": (78, 116, 204),
    "W": (244, 246, 252),
    #---- Human Torch, alight
    "F": (255, 104, 22),   "f": (255, 158, 44),
    "Y": (255, 212, 88),   "X": (255, 246, 204),
}


def grid():
    return [["." for _ in range(GW)] for _ in range(GH)]


def put(g, row, x, cells):
    """Paint a run of pixels. Anything off-grid is dropped rather than
    wrapping round, so a stray column in a pose cannot corrupt the row."""
    for i, ch in enumerate(cells):
        if ch == "." or not (0 <= x + i < GW) or not (0 <= row < GH):
            continue
        g[row][x + i] = ch


def outlined(g):
    """A one-pixel black border around the whole silhouette, at grid
    resolution — so it scales up into a chunky border rather than a hairline."""
    out = [row[:] for row in g]
    for y in range(GH):
        for x in range(GW):
            if g[y][x] != ".":
                continue
            if any(0 <= x + dx < GW and 0 <= y + dy < GH and g[y + dy][x + dx] not in (".", "#")
                   for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1),
                                  (1, 1), (1, -1), (-1, 1), (-1, -1))):
                out[y][x] = "#"
    return out


def render(g):
    im = Image.new("RGBA", (GW, GH), (0, 0, 0, 0))
    px = im.load()
    for y in range(GH):
        for x in range(GW):
            ch = g[y][x]
            if ch == ".":
                continue
            px[x, y] = OUTLINE if ch == "#" else PALETTE[ch] + (255,)
    return im.resize((GW * SCALE, GH * SCALE), Image.NEAREST)


def save_set(pairs):
    """Sprites that swap for one another mid-frame — Thor with and without
    Stormbreaker, Johnny lit and unlit — are drawn at whatever size the
    PNG happens to be but at the *player's* width and height, so a pair with
    different aspect ratios would visibly stretch on the swap. Cropping the
    whole set to one shared box keeps them interchangeable."""
    rendered = [(name, render(outlined(g))) for name, g in pairs]
    box = None
    for _, im in rendered:
        b = im.getbbox()
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]),
                                     max(box[2], b[2]), max(box[3], b[3]))
    skip = handmade()
    for name, im in rendered:
        if name in skip:
            print(f"  skip {name}.png (listed in images/handmade.txt)")
            continue
        im.crop(box).save(f"images/{name}.png", optimize=True)
        print(f"  {name}.png {im.crop(box).size}")


#=====================================================================#
#  THOR
#
#  Stormbreaker is held up and out on his left, clear of the head, so the
#  empty-handed version loses the axe without leaving a hole in his
#  silhouette — he simply reads as having just thrown it.
#=====================================================================#
def thor_body():
    g = grid()
    #---- head: hair down past the jaw, beard along it
    put(g, 1, 9, "HHHHHHH")
    put(g, 2, 8, "hHHHHHHHh")
    put(g, 3, 8, "hHHKKKHHh")
    put(g, 4, 8, "hHKKKKKHh")
    put(g, 5, 8, "hHKEKKEKh")
    put(g, 6, 8, "hHKKKKKKh")
    put(g, 7, 8, "hhKKKKKhh")
    put(g, 8, 8, "hhKBBBKhh")
    put(g, 9, 9, "hkBBBkh")
    put(g, 10, 10, "kKKKk")

    #---- cape: gathered at the shoulder, widening as it falls. The dark
    #column is the inner edge, in the body's own shadow — a slab of one flat
    #red at this size reads as a wall rather than cloth.
    put(g, 11, 4, "c")
    put(g, 12, 3, "Cc")
    put(g, 13, 2, "CCc")
    put(g, 14, 2, "CCc")
    for r in range(15, 23):
        put(g, r, 1, "CCCc")
    put(g, 23, 1, "CCc")
    put(g, 24, 2, "Cc")
    put(g, 25, 3, "c")

    #---- torso: chest band, and the strap lines running down off it
    put(g, 11, 6, "sSS"); put(g, 11, 9, "AAAAAAA"); put(g, 11, 16, "SSs")
    put(g, 12, 6, "tSs"); put(g, 12, 9, "aAAAAAa"); put(g, 12, 17, "sSt")
    put(g, 13, 6, "Aa");  put(g, 13, 9, "sSSSSSs"); put(g, 13, 18, "SsK")
    put(g, 14, 6, "Aa");  put(g, 14, 9, "AsAAAsA"); put(g, 14, 19, "KKK")
    put(g, 15, 6, "Aa");  put(g, 15, 9, "AsAAAsA"); put(g, 15, 20, "kK")
    put(g, 16, 6, "Aa");  put(g, 16, 9, "AsAAAsA")
    put(g, 17, 6, "St");  put(g, 17, 9, "AAAAAAA")
    put(g, 18, 6, "St");  put(g, 18, 9, "AAAAAAA")
    put(g, 19, 6, "Kk");  put(g, 19, 9, "AAAAAAA")
    put(g, 20, 7, "k");   put(g, 20, 9, "GGGGGGG")
    put(g, 21, 9, "dAAAAAd")

    #---- legs, splaying outward as they drop. Straight down they read as a
    #shop dummy next to the braced stance of the hand-drawn art; the gap
    #between them stays two columns wide so the outline pass inks it black.
    for r in (22, 23):
        put(g, r, 8, "AAa"); put(g, r, 14, "aAA")
    for r in (24, 25):
        put(g, r, 7, "AAa"); put(g, r, 15, "aAA")
    for r in (26, 27):
        put(g, r, 6, "AAa"); put(g, r, 16, "aAA")
    put(g, 28, 6, "ddd"); put(g, 28, 16, "ddd")
    put(g, 29, 6, "ttt"); put(g, 29, 16, "ttt")
    put(g, 30, 5, "SSSS"); put(g, 30, 16, "SSSS")
    put(g, 31, 4, "SSSSS"); put(g, 31, 16, "SSSSS")
    put(g, 32, 4, "tSSSS"); put(g, 32, 16, "SSSSt")
    return g


def thor_axe(g):
    """Stormbreaker: haft through the middle, the broad blade flaring off
    one side of it and the short back-spike off the other."""
    for r in range(3, 22):
        put(g, r, 20, "gG")
    put(g, 22, 20, "GG")
    #blade
    put(g, 4, 22, "ss")
    put(g, 5, 22, "sSS")
    put(g, 6, 22, "SSSs")
    put(g, 7, 22, "SSSs")
    put(g, 8, 22, "SSSs")
    put(g, 9, 22, "sSSs")
    put(g, 10, 22, "sSS")
    put(g, 11, 22, "ss")
    #back-spike
    put(g, 6, 17, "sSS")
    put(g, 7, 17, "SSS")
    put(g, 8, 17, "sSS")
    #the collar that binds the head to the haft
    for r in range(6, 10):
        put(g, r, 19, "G" + "S" * 2 + "G")
    #and the fist closing over it, drawn last so it sits in front
    put(g, 14, 19, "KKKK")
    put(g, 15, 19, "kKKk")
    return g


save_set([
    ("dd-thor", thor_axe(thor_body())),
    ("dd-thor-empty", thor_body()),
])


#=====================================================================#
#  HUMAN TORCH
#
#  Johnny out of costume-mode is a man in the Fantastic Four blues. The
#  flame is a separate three-frame cycle the game runs only while he is
#  actually throwing fire.
#=====================================================================#
def torch_body(fire=False):
    #suit, suit dark, suit light, emblem, skin, skin shade, hair, hair dark
    kit = "FfYXYfXY" if fire else "NnlWKkHh"
    S, D, L, M, K, k, H, h = kit

    g = grid()
    #---- head: swept hair, and while he is alight the face goes with it
    put(g, 1, 9, H * 7)
    put(g, 2, 8, h + H * 7 + h)
    put(g, 3, 8, h + H + K * 5 + H + h)
    put(g, 4, 8, h + H + K * 6 + h)
    put(g, 5, 8, h + H + K + ("Y" if fire else "E") + K * 2 +
                 ("Y" if fire else "E") + K + h)
    put(g, 6, 8, h + H + K * 6 + h)
    put(g, 7, 8, h + K * 7 + h)
    put(g, 8, 9, k + K * 5 + k)
    put(g, 9, 10, k + K * 3 + k)
    put(g, 10, 9, S * 7)

    #---- torso, arms at his sides, and the roundel with the 4 in it.
    #Alight, the arms move a column clear of the torso: the cold figure is
    #legible because navy sits against skin, and once everything is the same
    #orange only a gap keeps him from reading as one lozenge.
    lx, rx = (6, 18) if fire else (7, 16)
    put(g, 11, lx, L + S); put(g, 11, 9, S * 7); put(g, 11, rx, S + L)
    put(g, 12, lx, L + S); put(g, 12, 9, D + S * 5 + D); put(g, 12, rx, S + L)
    put(g, 13, lx, L + S); put(g, 13, 9, S + M * 5 + S); put(g, 13, rx, S + L)
    put(g, 14, lx, L + S); put(g, 14, 9, S + M + D + M + D + M + S); put(g, 14, rx, S + L)
    put(g, 15, lx, L + S); put(g, 15, 9, S + M + D * 3 + M + S); put(g, 15, rx, S + L)
    put(g, 16, lx, L + S); put(g, 16, 9, S + M * 3 + D + M + S); put(g, 16, rx, S + L)
    put(g, 17, lx, L + S); put(g, 17, 9, S + M * 5 + S); put(g, 17, rx, S + L)
    put(g, 18, lx, K + K); put(g, 18, 9, S * 7); put(g, 18, rx, K + K)
    put(g, 19, lx, K + k); put(g, 19, 9, S * 7); put(g, 19, rx, k + K)
    put(g, 20, 9, D + S * 5 + D)
    put(g, 21, 9, D + S * 5 + D)

    #---- legs and boots, braced the same way Thor's are
    for r in (22, 23):
        put(g, r, 8, S * 3); put(g, r, 13, S * 3)
    for r in (24, 25):
        put(g, r, 7, S * 3); put(g, r, 14, S * 3)
    for r in (26, 27):
        put(g, r, 6, S * 3); put(g, r, 15, S * 3)
    for r in (28, 29, 30):
        put(g, r, 6, D * 3); put(g, r, 15, D * 3)
    put(g, 31, 5, D * 4); put(g, 31, 15, D * 4)
    put(g, 32, 5, D * 4); put(g, 32, 15, D * 4)
    return g


#The flame is built on the outside of the silhouette, never into it. A
#plain dilation fills the gap between his legs and under his arms too, and
#three frames later Johnny has become an orange lozenge — so the shell is
#taken from the *outer* boundary only, found by flooding in from the edge
#of the canvas.
def outside(g):
    """Every empty cell reachable from the border without crossing the
    figure, i.e. the background but not the gaps inside him."""
    seen = set()
    stack = [(x, y) for x in range(GW) for y in (0, GH - 1) if g[y][x] == "."]
    stack += [(x, y) for y in range(GH) for x in (0, GW - 1) if g[y][x] == "."]
    while stack:
        x, y = stack.pop()
        if (x, y) in seen:
            continue
        seen.add((x, y))
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < GW and 0 <= ny < GH and g[ny][nx] == "." and (nx, ny) not in seen:
                stack.append((nx, ny))
    return seen


def shell(g, out):
    """The outside cells that touch him: where flame can catch."""
    return [(x, y) for (x, y) in out
            if any(0 <= x + dx < GW and 0 <= y + dy < GH and g[y + dy][x + dx] != "."
                   for dx in (-1, 0, 1) for dy in (-1, 0, 1))]


#Licks off the top of his head and shoulders, which is where the eye reads
#"on fire" first. (column, base height)
CRESTS = [(9, 2), (11, 4), (13, 3), (15, 2), (7, 1), (17, 1)]


def torch_flame(frame):
    #Bake his outline into the grid before any flame goes on, so the black
    #edge stays between the man and the fire. Grow the flame straight off
    #the raw figure instead and the two melt into one orange mass.
    g = outlined(torch_body(fire=True))

    #A broken ring of flame on that outline. Leaving roughly a third of it
    #bare is what keeps the figure legible underneath.
    out = outside(g)
    for x, y in shell(g, out):
        if (x * 2 + y * 3 + frame * 5) % 3 == 0:
            continue
        g[y][x] = "Y" if (x + y + frame) % 2 else "F"

    #A second, sparser ring further out, so the edge has depth
    out = outside(g)
    for x, y in shell(g, out):
        if (x * 3 + y * 5 + frame * 7) % 4:
            continue
        g[y][x] = "F"

    #Crests, riding on top of whatever the rings left
    for i, (col, base) in enumerate(CRESTS):
        t = next((y for y in range(GH) if g[y][col] != "."), None)
        if t is None:
            continue
        for step in range(base + ((frame + i) % 3)):
            put(g, t - step - 1, col, "F" if step else "Y")

    #A white-hot core, so he is not a flat orange cut-out
    for r in range(12, 20):
        put(g, r, 11, "XXX")
    put(g, 11, 12, "X")
    put(g, 20, 12, "X")
    return g


save_set([
    ("dd-torch", torch_body()),
    ("dd-torch-flame1", torch_flame(0)),
    ("dd-torch-flame2", torch_flame(1)),
    ("dd-torch-flame3", torch_flame(2)),
])
print("hi-res art regenerated")
