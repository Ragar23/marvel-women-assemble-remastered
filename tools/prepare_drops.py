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

    print("bringing the player's suit sets to one box")
    for names in SWAP_SETS:
        w, h = match_box(names)
        print(f"  {' + '.join(names)}  ->  {w}x{h}")
