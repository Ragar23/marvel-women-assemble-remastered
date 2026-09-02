"""Chunky pixel-art builder: a small logical grid, one character per pixel.

This is the technique make_hires.py used for Thor and the Sentinel, lifted
out so more than one generator can share it. Draw on a grid of single
characters, outline the silhouette at grid resolution, then upscale with
NEAREST so every logical pixel stays a hard-edged block. That is what makes
it sit next to hand-drawn sprite art instead of reading as mush beside it.

A generator sets its own grid size and palette:

    import pixelgrid as pg
    pg.PALETTE.update({"R": (198, 34, 42)})
    g = pg.grid(27, 34)
    pg.put(g, 4, 9, "RRRRR")
    pg.save_set([("my-sprite", g)])
"""
import pathlib
from PIL import Image

SCALE = 11
OUTLINE = (12, 12, 18, 255)

#Filled in by whichever generator is running.
PALETTE = {}


def grid(w, h):
    return [["." for _ in range(w)] for _ in range(h)]


def put(g, row, x, cells):
    """Paint a run of pixels. Anything off-grid is dropped rather than
    wrapping round, so a stray column in a pose cannot corrupt the row."""
    h = len(g)
    w = len(g[0])
    for i, ch in enumerate(cells):
        if ch == "." or not (0 <= x + i < w) or not (0 <= row < h):
            continue
        g[row][x + i] = ch


def box(g, r0, x0, r1, x1, ch):
    for r in range(r0, r1 + 1):
        put(g, r, x0, ch * (x1 - x0 + 1))


def outlined(g):
    """A one-pixel black border around the silhouette, at grid resolution —
    so it scales up into a chunky border rather than a hairline."""
    h, w = len(g), len(g[0])
    out = [row[:] for row in g]
    for y in range(h):
        for x in range(w):
            if g[y][x] != ".":
                continue
            if any(
                0 <= x + dx < w and 0 <= y + dy < h and g[y + dy][x + dx] not in (".", "#")
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1),
                               (1, 1), (1, -1), (-1, 1), (-1, -1))
            ):
                out[y][x] = "#"
    return out


def render(g, scale=None):
    h, w = len(g), len(g[0])
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = im.load()
    for y in range(h):
        for x in range(w):
            ch = g[y][x]
            if ch == ".":
                continue
            if ch == "#":
                px[x, y] = OUTLINE
            else:
                col = PALETTE[ch]
                px[x, y] = col if len(col) == 4 else col + (255,)
    s = scale or SCALE
    return im.resize((w * s, h * s), Image.NEAREST)


def handmade():
    """Sprite names listed in images/handmade.txt are art someone drew by
    hand. Generators skip them, so a re-run never overwrites better art."""
    f = pathlib.Path("images/handmade.txt")
    if not f.exists():
        return set()
    return {
        line.split("#")[0].strip()
        for line in f.read_text().splitlines()
        if line.split("#")[0].strip()
    }


def save_set(pairs, scale=None):
    """Sprites that swap for one another mid-frame are drawn at the player's
    width and height, so a pair with different aspect ratios would visibly
    stretch on the swap. Cropping the whole set to one shared box keeps them
    interchangeable. A set of one is just a tight crop."""
    rendered = [(name, render(outlined(g), scale)) for name, g in pairs]
    shared = None
    for _, im in rendered:
        b = im.getbbox()
        shared = b if shared is None else (
            min(shared[0], b[0]), min(shared[1], b[1]),
            max(shared[2], b[2]), max(shared[3], b[3]),
        )
    skip = handmade()
    for name, im in rendered:
        if name in skip:
            print(f"  skip {name}.png (listed in images/handmade.txt)")
            continue
        cropped = im.crop(shared)
        cropped.save(f"images/{name}.png", optimize=True)
        print(f"  {name}.png {cropped.size}")
