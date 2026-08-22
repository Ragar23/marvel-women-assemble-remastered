"""The other Earth, for the incursion meter and the sky behind the fight.

An incursion is two universes' Earths meeting, so the thing bearing down on
you has to read as an Earth and not as a fireball: continents, a terminator,
an atmosphere. It is the same shape as the green world already painted into
dd-bg.png and the opposite colour, because that is the whole idea.

Deterministic — seeded, so re-running it produces the same planet.

Run: python3 tools/make_incursion.py
"""
import math
import random
from PIL import Image, ImageDraw, ImageFilter

SIZE = 512
random.seed(20261218)  # the release date, for no reason at all


def value_noise(size, cells, seed):
    """Bilinear value noise. Enough for continents at this scale, and it
    avoids a dependency on numpy or a Perlin library for one image."""
    rnd = random.Random(seed)
    grid = [[rnd.random() for _ in range(cells + 1)] for _ in range(cells + 1)]
    out = [[0.0] * size for _ in range(size)]
    step = size / cells
    for y in range(size):
        gy = y / step
        y0 = int(gy)
        ty = gy - y0
        ty = ty * ty * (3 - 2 * ty)  # smoothstep, or the cells show as diamonds
        for x in range(size):
            gx = x / step
            x0 = int(gx)
            tx = gx - x0
            tx = tx * tx * (3 - 2 * tx)
            a = grid[y0][x0] + (grid[y0][x0 + 1] - grid[y0][x0]) * tx
            b = grid[y0 + 1][x0] + (grid[y0 + 1][x0 + 1] - grid[y0 + 1][x0]) * tx
            out[y][x] = a + (b - a) * ty
    return out


def fbm(size):
    """Octaves stacked, so the coastlines have detail at more than one scale."""
    layers = [(4, 0.55, 1), (9, 0.28, 2), (19, 0.17, 3)]
    out = [[0.0] * size for _ in range(size)]
    for cells, weight, seed in layers:
        n = value_noise(size, cells, seed)
        for y in range(size):
            row, nrow = out[y], n[y]
            for x in range(size):
                row[x] += nrow[x] * weight
    return out


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


#Land reads violet against a crimson sea. A single hue at two brightnesses
#came out as a lava ball rather than a world with coastlines on it.
OCEAN = (46, 8, 20)
OCEAN_LIT = (176, 38, 54)
LAND = (22, 10, 30)
LAND_LIT = (86, 40, 74)
FISSURE = (255, 132, 60)
RIM = (255, 96, 78)


def planet():
    im = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    px = im.load()
    height = fbm(SIZE)
    r = SIZE / 2 - 6
    cx = cy = SIZE / 2
    #Lit from the upper right, which is where the game's own sun is
    #Well off to the side rather than over the viewer's shoulder, so there is
    #a terminator to see instead of a disc lit flat from the front.
    lx, ly, lz = 0.78, -0.46, 0.43

    for y in range(SIZE):
        for x in range(SIZE):
            dx = (x - cx) / r
            dy = (y - cy) / r
            d2 = dx * dx + dy * dy
            if d2 > 1:
                continue
            dz = math.sqrt(1 - d2)
            #Lambert, floored so the night side is not pure black
            light = max(0.0, dx * lx + dy * ly + dz * lz)
            shade = 0.06 + 0.94 * light

            h = height[y][x]
            land = h > 0.52
            base = lerp(LAND, LAND_LIT, shade) if land else lerp(OCEAN, OCEAN_LIT, shade)

            #Fissures: the crust splitting where the two universes meet
            crack = abs(h - 0.52)
            if crack < 0.012:
                glow = 1 - crack / 0.012
                base = lerp(base, FISSURE, glow * 0.85)

            #The atmosphere catching light right on the limb
            limb = d2 ** 8
            if limb > 0.02:
                base = lerp(base, RIM, min(1, limb) * 0.75)

            px[x, y] = base + (255,)

    #A soft halo outside the disc, so it sits in the sky rather than on it
    halo = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(halo)
    d.ellipse([6, 6, SIZE - 6, SIZE - 6], fill=(255, 70, 60, 120))
    halo = halo.filter(ImageFilter.GaussianBlur(26))
    return Image.alpha_composite(halo, im)


out = planet()
out.save("images/dd-incursion.png", optimize=True)
print(f"  dd-incursion.png {out.size}")
