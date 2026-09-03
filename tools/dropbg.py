"""Knock the background out of a dropped-in sprite.

    python3 tools/dropbg.py images/incoming.png images/nwh-lizard.png

Pixel art usually arrives on a flat backdrop, and on this project that
backdrop is very often the same near-black as the sprite's own outline. So
this does NOT colour-key: keying every dark pixel would eat the outline and
punch holes through any dark area inside the figure — a black eye, a shadow
under a jaw, the gap between two legs.

Instead it floods inward from the edges. Only background that is actually
connected to the edge of the canvas is cleared; anything the drawing
encloses is left alone, whatever colour it is.

Then it crops to the drawing. Sprites are scaled to a fixed height at
runtime (see fitSprite in src/state.js), so transparent margin inside the
file shrinks the character on screen and pads out its hitbox.

On tolerance: it defaults to an exact match, and that is deliberate.
Connectivity alone does not save the outline when the outline is the same
colour as the backdrop — on this project's own art the outline is
(12, 12, 18) against a (10, 10, 12) ground, six values apart, so any
tolerance loose enough to absorb noise walks straight through it and out
the other side. Measured: at tol=26 the flood ate 22,506 of the 22,506
outline pixels and the sprite came out 22px narrower. A flat PNG needs no
tolerance. Raise it only for a noisy or resaved source, check the
`inexact` count in the report, and look at the result.
"""
import sys
from collections import deque

from PIL import Image


def background_colour(px, w, h):
    """Whatever occupies most of the border. Sampling one corner is enough
    until the day a sprite arrives with a vignette on it."""
    counts = {}
    for x in range(w):
        for y in (0, h - 1):
            counts[px[x, y][:3]] = counts.get(px[x, y][:3], 0) + 1
    for y in range(h):
        for x in (0, w - 1):
            counts[px[x, y][:3]] = counts.get(px[x, y][:3], 0) + 1
    return max(counts, key=counts.get)


def close_enough(a, b, tol):
    return abs(a[0] - b[0]) <= tol and abs(a[1] - b[1]) <= tol and abs(a[2] - b[2]) <= tol


def drop(path, out, tol=0, crop=True):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()
    bg = background_colour(px, w, h)

    #Flood from every edge pixel that looks like the background. A queue
    #rather than recursion: a 400x400 sprite is 160,000 deep in the worst
    #case and Python's stack is nowhere near that.
    seen = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            q.append((x, y))

    cleared = 0
    inexact = 0
    while q:
        x, y = q.popleft()
        if not (0 <= x < w and 0 <= y < h) or seen[y][x]:
            continue
        seen[y][x] = True
        r, g, b, a = px[x, y]
        if a == 0:
            #already transparent, but still a route inward
            q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
            continue
        if not close_enough((r, g, b), bg, tol):
            continue
        px[x, y] = (r, g, b, 0)
        cleared += 1
        if (r, g, b) != bg:
            inexact += 1
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    box = im.getbbox()
    if crop and box:
        im = im.crop(box)
    im.save(out, optimize=True)
    return {
        "background": bg,
        "cleared": cleared,
        "of": w * h,
        #Pixels cleared that were not the background exactly. Anything much
        #above zero means the tolerance is reaching into the drawing.
        "inexact": inexact,
        "was": (w, h),
        "now": im.size,
        "cropped": box,
    }


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    tol = int(sys.argv[3]) if len(sys.argv) > 3 else 0
    info = drop(sys.argv[1], sys.argv[2], tol)
    print(f"  {sys.argv[2]}")
    for k, v in info.items():
        print(f"    {k}: {v}")
    if info["inexact"] > info["cleared"] * 0.02:
        print("    WARNING: the tolerance is reaching past the background."
              " Lower it and look at the result.")
