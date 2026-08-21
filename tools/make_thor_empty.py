"""Thor with an empty hand, for the frames where Mjolnir is in flight.
Erases the hammer from the existing thor.png rather than redrawing him.
Run with: python3 tools/make_thor_empty.py"""
from PIL import Image

B = 3  # thor.png is a 32x34 grid at 3x
im = Image.open("images/thor.png").convert("RGBA")
px = im.load()

def clear(c0, r0, c1, r1):
    for r in range(r0, r1 + 1):
        for c in range(c0, c1 + 1):
            for y in range(r * B, (r + 1) * B):
                for x in range(c * B, (c + 1) * B):
                    if 0 <= x < im.width and 0 <= y < im.height:
                        px[x, y] = (0, 0, 0, 0)

clear(22, 5, 31, 14)   # the head of the hammer
clear(24, 15, 28, 23)  # the handle running down behind his arm

im.save("images/thor-empty.png")
print("thor-empty.png written")
