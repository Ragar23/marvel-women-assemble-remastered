"""Take the hand-drawn art as it arrives and make it usable by the game.

    python3 tools/prepare_drops.py

Reads the untouched drops from images/src/ and writes images/. Every
setting a given drawing needed is recorded here rather than typed at a
shell once and forgotten, so re-running this reproduces exactly what
shipped.

Three things happen to each drawing:

1. The backdrop is knocked out and the result cropped to the drawing
   (tools/dropbg.py). The settings differ per image because the drops
   do: some arrived on white, some on near-black, one on sky blue, two
   inside a ruled frame that seals the backdrop in behind it, and a
   couple with stray marks parked in a corner.

2. The player's two suit sets are brought to one box. drawSprite()
   stretches whatever it is handed into the width and height it is given,
   so two sprites of different proportions change shape at the swap. They
   are scaled to a common figure height first and only then padded to a
   common width — padding alone would have left the Iron Spider drawing,
   which is squat, filling half the height of the sprite it replaces and
   so arriving at half Peter's size.

   The enemies who transform are deliberately NOT brought to one box.
   Max Dillon is a man and Electro is not; Flint Marko is a man and the
   thing he becomes is three times his size. The game recomputes their
   width and height at the moment they change instead, so the change of
   size *is* the transformation rather than a glitch in it.

3. Peter 2's symbiote is derived from Peter 2 rather than drawn twice.
   It used to be a recolour of the generated sprite, which no longer
   exists — the black suit has to be the same drawing as the red one or
   he turns into somebody else halfway through a run.
"""
import pathlib
import sys

sys.path.insert(0, "tools")

from PIL import Image

from dropbg import drop

SRC = pathlib.Path("images/src")
OUT = pathlib.Path("images")

#---------------------------------------------------------------- knockout
#  name: (tolerance, passes, despeckle)
#
#  tolerance 4 throughout: every one of these is a resaved PNG whose
#  ground is a shade or two off flat, and an exact match leaves the box
#  standing. Checked against a loud background before it was settled on.
#
#  passes 4 on Garfield: his drop has nested ruled borders, and each one
#  seals the next colour in behind it. Two passes leaves a white block
#  still sitting behind his shoulder.
#
#  despeckle 0.12 on Electro: a gem and a stray head are parked in the
#  bottom corner of his drop, and both are far too big for the default
#  to consider them specks. They are still nowhere near his own island.
DROPS = {
    "nwh-electro": (4, 2, 0.12),
    "nwh-electro-human": (4, 2, 0.02),
    "nwh-sandman": (4, 2, 0.02),
    "nwh-sandman-human": (4, 2, 0.02),
    "nwh-garfield": (4, 4, 0.02),
    "nwh-maguire": (4, 2, 0.02),
    "nwh-strange": (4, 2, 0.02),
    "nwh-holland-iron": (4, 2, 0.02),
}

#---------------------------------------------------------------- swap sets
#  Sprites the game exchanges for one another while a run is on. Each set
#  is padded to one box so nothing changes shape at the swap.
SWAP_SETS = [
    ("nwh-holland", "nwh-holland-iron"),
    ("nwh-maguire", "nwh-maguire-symbiote"),
]


def symbiote_from(src, dst):
    """The black suit, taken from the red one.

    Not a flat fill: the drawing's own shading has to survive or he goes
    from a figure to a silhouette. Luminance is kept and crushed towards
    black, and the few genuinely bright pixels — the lenses, the emblem —
    are pushed the other way instead, which is the one thing that reads
    as the symbiote rather than as a shadow.
    """
    im = Image.open(src).convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            if lum > 200:
                px[x, y] = (245, 245, 250, a)  #lenses and emblem, kept
            else:
                v = int(10 + lum * 0.16)
                px[x, y] = (v, v, int(v * 1.25), a)
    im.save(dst, optimize=True)
    return im.size


def match_box(names):
    """Bring a swap set to one box, at one figure size.

    Height first: each drawing is scaled so they are all the same number
    of pixels tall, which is what actually makes them the same size on
    screen — the game fits every sprite to a fixed height, so a drawing
    that fills less of its own file arrives smaller. Only then is the
    width padded out to the widest of them, transparently and centred,
    with the feet on the bottom edge.
    """
    paths = [OUT / f"{n}.png" for n in names]
    ims = [Image.open(p).convert("RGBA") for p in paths]
    h = max(i.height for i in ims)
    scaled = []
    for im in ims:
        if im.height != h:
            #NEAREST: this is pixel art and it is not to be smoothed
            im = im.resize((max(1, round(im.width * h / im.height)), h), Image.NEAREST)
        scaled.append(im)
    w = max(i.width for i in scaled)
    for path, im in zip(paths, scaled):
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        canvas.paste(im, ((w - im.width) // 2, h - im.height), im)
        canvas.save(path, optimize=True)
    return w, h


#=====================================================================#
#  THE GOBLIN SHEET
#
#  His drop is not one drawing but five on one page: him on his glider,
#  two pumpkin bombs and two razor bats. Cutting it by bounding box does
#  not work — his box is wide enough to swallow a bomb and half a bat —
#  so each piece is taken by which connected island its pixels belong to.
#
#  The bats matter here: their white tips are drawn detached from the
#  blade, so a bat is three islands, not one. Anything whose island falls
#  inside the region is taken with it.
#=====================================================================#
#  name: (region on the sheet, or None to mean "the largest island")
GOBLIN_SHEET = {
    "nwh-goblin": None,
    "nwh-pumpkin": (100, 10, 400, 300),
    "nwh-bat": (1340, 10, 1830, 500),
}


def islands_of(im):
    """Every connected run of opaque pixels, largest first."""
    from collections import deque
    w, h = im.size
    px = im.load()
    seen = [[False] * w for _ in range(h)]
    out = []
    for y0 in range(h):
        for x0 in range(w):
            if seen[y0][x0] or px[x0, y0][3] == 0:
                continue
            q = deque([(x0, y0)])
            seen[y0][x0] = True
            cells = []
            while q:
                x, y = q.popleft()
                cells.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if (0 <= nx < w and 0 <= ny < h and not seen[ny][nx]
                            and px[nx, ny][3] != 0):
                        seen[ny][nx] = True
                        q.append((nx, ny))
            out.append(cells)
    out.sort(key=len, reverse=True)
    return out


def cut_goblin_sheet():
    src = SRC / "nwh-goblin-sheet.png"
    if not src.exists():
        print("  skip: no images/src/nwh-goblin-sheet.png")
        return
    #crop=False: the pieces are found on the full page, not on a crop of it
    drop(str(src), "/tmp/goblin-sheet-cut.png", 4, passes=2, despeckle=0.0, crop=False)
    sheet = Image.open("/tmp/goblin-sheet-cut.png").convert("RGBA")
    parts = islands_of(sheet)

    for name, region in GOBLIN_SHEET.items():
        keep = [parts[0]] if region is None else [
            c for c in parts
            if all(region[0] <= x <= region[2] and region[1] <= y <= region[3]
                   for x, y in c)
        ]
        if not keep:
            print(f"  {name}: nothing found in {region}")
            continue
        out = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
        src_px, out_px = sheet.load(), out.load()
        for cells in keep:
            for x, y in cells:
                out_px[x, y] = src_px[x, y]
        box = out.getbbox()
        out = out.crop(box)
        #The bomb and the bat are each drawn on a plate of pure black,
        #which is not the black the page is on — so the sheet's own flood
        #never reached it. They get their own pass here, on the cropped
        #piece, where the plate is the outermost colour. It cannot be done
        #on the whole sheet: a pass loose enough to take pure black would
        #take the Goblin's outline with it, and he is drawn in it.
        if name != "nwh-goblin":
            tmp = f"/tmp/{name}-piece.png"
            out.save(tmp)
            drop(tmp, tmp, 6, passes=1, despeckle=0.0)
            out = Image.open(tmp).convert("RGBA")
        #He is a boss, and bosses are drawn into a square box — a sprite
        #that is not square is stretched to fit it. Padded, not scaled.
        if name == "nwh-goblin":
            side = max(out.size)
            square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
            square.paste(out, ((side - out.width) // 2, side - out.height), out)
            out = square
        out.save(OUT / f"{name}.png", optimize=True)
        print(f"  {name}.png  {out.size}  ({len(keep)} island(s))")


if __name__ == "__main__":
    print("knocking out backdrops")
    for name, (tol, passes, speck) in DROPS.items():
        src = SRC / f"{name}.png"
        if not src.exists():
            print(f"  skip {name}: no images/src/{name}.png")
            continue
        info = drop(str(src), str(OUT / f"{name}.png"), tol, passes=passes,
                    despeckle=speck)
        print(f"  {name}.png  {info['was']} -> {info['now']}"
              f"  cleared {info['cleared']}  {info['specks dropped']}")

    print("deriving the symbiote from Peter 2")
    size = symbiote_from(OUT / "nwh-maguire.png", OUT / "nwh-maguire-symbiote.png")
    print(f"  nwh-maguire-symbiote.png  {size}")

    print("cutting the goblin sheet")
    cut_goblin_sheet()

    print("bringing the player's suit sets to one box")
    for names in SWAP_SETS:
        w, h = match_box(names)
        print(f"  {' + '.join(names)}  ->  {w}x{h}")
