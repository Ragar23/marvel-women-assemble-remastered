"""Knock the background out of a dropped-in sprite.

    python3 tools/dropbg.py IN.png OUT.png [tol] [passes] [despeckle]

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

On framed art: some drawings arrive with a thin border ruled around the
outside. The flood clears the border, hits the real background behind it,
finds it does not match the border colour it sampled, and stops — leaving
the background sealed inside a frame that is no longer there. `passes`
runs the flood again, recomputing the background from whatever is on the
exposed perimeter now, which is exactly that trapped colour. Two passes
clears a frame; more is almost always a sign the art needs looking at.

On specks: a stray mark in a corner is still opaque after the flood, and
the crop box has to stretch to include it, which pads the file and so
shrinks the character on screen. `despeckle` drops any island smaller
than that fraction of the biggest one before cropping. It only ever
removes pixels the drawing left behind on its own island — anything
touching the figure is part of the figure.

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
    """Whatever occupies most of the exposed perimeter: the border on the
    first pass, and on any pass after that whatever the last one uncovered.
    That is what makes a second pass find the colour a frame was hiding."""
    counts = {}

    def note(x, y):
        if px[x, y][3] == 0:
            return
        counts[px[x, y][:3]] = counts.get(px[x, y][:3], 0) + 1

    for x in range(w):
        for y in (0, h - 1):
            note(x, y)
    for y in range(h):
        for x in (0, w - 1):
            note(x, y)
    #Anything opaque with transparency against it is on the perimeter too
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0:
                continue
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
                    note(x, y)
                    break
    return max(counts, key=counts.get) if counts else (0, 0, 0)


def close_enough(a, b, tol):
    return abs(a[0] - b[0]) <= tol and abs(a[1] - b[1]) <= tol and abs(a[2] - b[2]) <= tol


def _flood(px, w, h, bg, tol):
    """One sweep inward from the edges. Returns (cleared, inexact)."""
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
    return cleared, inexact


def _despeckle(px, w, h, frac):
    """Clear every opaque island smaller than `frac` of the largest one.
    Nothing connected to the drawing can be touched: an island is by
    definition everything the drawing does not reach."""
    seen = [[False] * w for _ in range(h)]
    islands = []
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
            islands.append(cells)
    if not islands:
        return 0, 0
    biggest = max(len(i) for i in islands)
    dropped = 0
    specks = 0
    for cells in islands:
        if len(cells) >= biggest * frac:
            continue
        specks += 1
        for x, y in cells:
            r, g, b, _ = px[x, y]
            px[x, y] = (r, g, b, 0)
            dropped += 1
    return dropped, specks


def drop(path, out, tol=0, crop=True, passes=1, despeckle=0.0):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()

    cleared = 0
    inexact = 0
    backgrounds = []
    for _ in range(max(1, passes)):
        bg = background_colour(px, w, h)
        backgrounds.append(bg)
        c, i = _flood(px, w, h, bg, tol)
        cleared += c
        inexact += i
        if c == 0:
            break  #nothing left that this pass can reach

    dropped, specks = (0, 0)
    if despeckle > 0:
        dropped, specks = _despeckle(px, w, h, despeckle)

    box = im.getbbox()
    if crop and box:
        im = im.crop(box)
    im.save(out, optimize=True)
    return {
        "backgrounds": backgrounds,
        "cleared": cleared,
        "of": w * h,
        #Pixels cleared that were not the background exactly. Anything much
        #above zero means the tolerance is reaching into the drawing.
        "inexact": inexact,
        "specks dropped": f"{specks} island(s), {dropped}px",
        "was": (w, h),
        "now": im.size,
        "cropped": box,
    }


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    tol = int(sys.argv[3]) if len(sys.argv) > 3 else 0
    passes = int(sys.argv[4]) if len(sys.argv) > 4 else 1
    speck = float(sys.argv[5]) if len(sys.argv) > 5 else 0.0
    info = drop(sys.argv[1], sys.argv[2], tol, passes=passes, despeckle=speck)
    print(f"  {sys.argv[2]}")
    for k, v in info.items():
        print(f"    {k}: {v}")
    if info["inexact"] > info["cleared"] * 0.02:
        print("    WARNING: the tolerance is reaching past the background."
              " Lower it and look at the result.")
