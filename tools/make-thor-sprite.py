#!/usr/bin/env python3
"""Draw the Thor sprite and his lightning bolt.

The 2021 art is chibi pixel art at roughly 90x90, so these are drawn on a
small logical grid and scaled up with nearest-neighbour to keep the chunky
pixel edges. Re-run to regenerate:

    python3 tools/make-thor-sprite.py
"""

import struct
import zlib

# ---------------------------------------------------------------- palette
OUTLINE = (20, 17, 28, 255)
HAIR = (242, 210, 122, 255)
HAIR_DK = (208, 169, 78, 255)
SKIN = (242, 196, 155, 255)
SKIN_DK = (214, 159, 118, 255)
CAPE = (180, 35, 44, 255)
CAPE_DK = (125, 21, 29, 255)
ARMOR = (57, 67, 92, 255)
ARMOR_LT = (91, 106, 140, 255)
METAL = (207, 214, 226, 255)
METAL_DK = (141, 151, 171, 255)
WOOD = (107, 74, 47, 255)
EYE = (43, 111, 181, 255)
BOLT = (169, 233, 255, 255)
BOLT_CORE = (255, 255, 255, 255)
CLEAR = (0, 0, 0, 0)


class Grid:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.px = [[CLEAR] * w for _ in range(h)]

    def set(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y][x] = c

    def rect(self, x0, y0, x1, y1, c, outline=False):
        if outline:
            self.rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1, OUTLINE)
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.set(x, y, c)

    def disc(self, cx, cy, r, c, outline=False):
        if outline:
            self.disc(cx, cy, r + 1, OUTLINE)
        for y in range(cy - r, cy + r + 1):
            for x in range(cx - r, cx + r + 1):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r + r * 0.4:
                    self.set(x, y, c)

    def poly(self, points, c, outline=False):
        """Scanline fill of a convex-ish polygon."""
        if outline:
            cx = sum(p[0] for p in points) / len(points)
            cy = sum(p[1] for p in points) / len(points)
            grown = [
                (
                    p[0] + (1 if p[0] > cx else -1),
                    p[1] + (1 if p[1] > cy else -1),
                )
                for p in points
            ]
            self.poly(grown, OUTLINE)
        ys = [p[1] for p in points]
        for y in range(min(ys), max(ys) + 1):
            xs = []
            for i in range(len(points)):
                x0, y0 = points[i]
                x1, y1 = points[(i + 1) % len(points)]
                if y0 == y1:
                    continue
                if min(y0, y1) <= y < max(y0, y1):
                    xs.append(x0 + (y - y0) * (x1 - x0) / (y1 - y0))
            if len(xs) >= 2:
                for x in range(int(round(min(xs))), int(round(max(xs))) + 1):
                    self.set(x, y, c)

    def line(self, pts, thick, c):
        """Thick polyline, used for the lightning bolt."""
        for i in range(len(pts) - 1):
            x0, y0 = pts[i]
            x1, y1 = pts[i + 1]
            steps = max(abs(x1 - x0), abs(y1 - y0)) * 4 or 1
            for s in range(steps + 1):
                x = x0 + (x1 - x0) * s / steps
                y = y0 + (y1 - y0) * s / steps
                self.disc(int(round(x)), int(round(y)), thick, c)

    def scaled(self, factor):
        out = Grid(self.w * factor, self.h * factor)
        for y in range(self.h):
            for x in range(self.w):
                for dy in range(factor):
                    for dx in range(factor):
                        out.px[y * factor + dy][x * factor + dx] = self.px[y][x]
        return out


def write_png(path, grid):
    raw = b"".join(
        b"\x00" + b"".join(bytes(px) for px in row) for row in grid.px
    )

    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    header = struct.pack(">IIBBBBB", grid.w, grid.h, 8, 6, 0, 0, 0)
    with open(path, "wb") as fh:
        fh.write(
            b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", header)
            + chunk(b"IDAT", zlib.compress(raw, 9))
            + chunk(b"IEND", b"")
        )
    print(f"wrote {path} ({grid.w}x{grid.h})")


# ------------------------------------------------------------------ Thor
def build_thor():
    g = Grid(32, 34)

    # Cape, behind everything, flaring out to the left as if flying right
    g.poly([(9, 13), (22, 13), (30, 31), (1, 31)], CAPE_DK, outline=True)
    g.poly([(10, 14), (21, 14), (27, 30), (4, 30)], CAPE)

    # Legs and boots
    g.rect(12, 25, 15, 30, ARMOR, outline=True)
    g.rect(17, 25, 20, 30, ARMOR, outline=True)
    g.rect(11, 29, 15, 31, METAL_DK, outline=True)
    g.rect(17, 29, 21, 31, METAL_DK, outline=True)

    # Torso
    g.rect(10, 16, 21, 26, ARMOR, outline=True)
    g.rect(13, 18, 18, 23, ARMOR_LT)
    g.rect(10, 23, 21, 24, WOOD)          # belt
    g.disc(11, 17, 3, ARMOR_LT, outline=True)   # shoulder pads
    g.disc(21, 17, 3, ARMOR_LT, outline=True)

    # Right arm, raised, holding the hammer
    g.rect(21, 19, 25, 22, SKIN, outline=True)

    # Mjolnir: a heavy squared-off head over a short thick handle
    g.rect(25, 13, 27, 21, WOOD, outline=True)
    g.rect(22, 6, 30, 13, METAL, outline=True)
    g.rect(23, 8, 29, 10, METAL_DK)
    g.rect(23, 11, 29, 12, METAL_DK)

    # Head
    g.disc(15, 10, 7, SKIN, outline=True)
    g.rect(11, 13, 19, 16, SKIN_DK)        # jaw shadow under the beard line

    # Hair: crown plus the two long side locks
    g.disc(15, 8, 7, HAIR, outline=True)
    g.rect(9, 15, 12, 16, SKIN)            # re-open the cheeks
    g.rect(18, 15, 21, 16, SKIN)
    g.rect(7, 8, 9, 17, HAIR, outline=True)
    g.rect(21, 8, 23, 17, HAIR, outline=True)
    g.disc(15, 5, 6, HAIR)

    # Face
    g.rect(11, 10, 12, 11, EYE)
    g.rect(18, 10, 19, 11, EYE)
    g.rect(11, 9, 12, 9, OUTLINE)          # brows
    g.rect(18, 9, 19, 9, OUTLINE)
    g.rect(11, 15, 19, 17, HAIR_DK)        # beard, sitting below the mouth
    g.rect(13, 13, 17, 14, SKIN_DK)        # mouth line

    return g.scaled(3)


def build_bolt():
    g = Grid(26, 14)
    path = [(2, 7), (8, 3), (13, 10), (19, 4), (24, 7)]
    g.line(path, 2, OUTLINE)
    g.line(path, 1, BOLT)
    g.line(path, 0, BOLT_CORE)
    return g.scaled(3)


if __name__ == "__main__":
    write_png("images/thor.png", build_thor())
    write_png("images/lightning.png", build_bolt())
