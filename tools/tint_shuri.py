"""Repaint the panther suit in Shuri's colours.

The drawing that came in is T'Challa's suit: black under silver-grey
panelling. Shuri's is the same cut in near-black with the vibranium lines
running violet, which is also the tint the game already gives her in
src/config.js. So this is a recolour rather than a redraw — the pose and
every pixel boundary in the original art are kept exactly as drawn.

Run: python3 tools/tint_shuri.py
"""
from PIL import Image

#The drawing as it arrived, kept untouched so this can be re-run and
#re-tuned. Writing back over images/dd-shuri.png would darken it again on
#every pass and there would be no way back to the original.
SRC = "images/src/dd-shuri.png"
OUT = "images/dd-shuri.png"


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def main():
    im = Image.open(SRC).convert("RGBA")
    px = im.load()
    w, h = im.size
    #The mask reads as silver above this line and as suit below it, so the
    #eye slits keep their cold white while the body panels go violet.
    mask_line = h * 0.30

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            if lum < 60:
                #Outline and the deepest folds: left alone, near enough black
                px[x, y] = (12, 10, 18, a)
            elif lum < 150:
                #The body of the suit. Dark, with just enough violet in it to
                #stop it reading as flat black next to the accents.
                t = (lum - 60) / 90
                px[x, y] = lerp((30, 25, 44), (86, 68, 122), t) + (a,)
            elif y < mask_line:
                #Eye slits and mask edge stay silver
                t = min(1, (lum - 150) / 105)
                px[x, y] = lerp((176, 182, 200), (238, 240, 248), t) + (a,)
            else:
                #Vibranium seams and claws: her violet
                t = min(1, (lum - 150) / 105)
                px[x, y] = lerp((146, 92, 214), (222, 190, 255), t) + (a,)

    im.save(OUT, optimize=True)
    print(f"  dd-shuri.png repainted {im.size}")


main()
