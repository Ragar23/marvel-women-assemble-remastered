"""Every sprite for the No Way Home branch.

Drawn the way make_hires.py draws Thor: a small logical grid, one character
per pixel, outlined at grid resolution and upscaled with NEAREST so the
blocks stay hard-edged. The cast is 27x34 at x11, which lands on 297x374 —
the same density as the hand-drawn images/dd-cyclops.png.

Run from the repo root:  python3 tools/make_nwh.py
"""
import sys
sys.path.insert(0, "tools")
import pixelgrid as pg
from pixelgrid import grid, put, box, save_set

GW, GH = 27, 34

pg.PALETTE.update({
    #---- the suit: red, and the blue that carries the legs and the sides
    "R": (198, 34, 42),   "r": (138, 20, 28),   "H": (240, 82, 82),
    "B": (32, 56, 138),   "b": (18, 34, 92),    "L": (66, 102, 200),
    #---- eye lenses, and the black that rims them and webs the suit
    "W": (248, 248, 252), "w": (188, 198, 216), "E": (16, 16, 24),
    #---- skin
    "K": (238, 190, 150), "k": (196, 146, 108),
    #---- Strange: the robe, the cloak, and the light he works by
    "N": (48, 68, 100),   "n": (28, 42, 66),
    "C": (168, 38, 46),   "c": (110, 22, 30),
    "G": (240, 178, 52),  "g": (172, 118, 26),
    "Y": (255, 228, 146), "X": (255, 250, 216),
    #---- the Goblin: his greens and the purple under them
    "V": (74, 168, 72),   "v": (42, 106, 42),   "Q": (152, 240, 142),
    "P": (112, 66, 154),  "p": (70, 40, 104),
    #---- Octavius: the arms, and the coat they came out of
    "S": (192, 196, 208), "s": (128, 132, 148), "D": (56, 58, 68),
    "O": (74, 118, 76),   "o": (44, 76, 48),
    #---- Electro
    "Z": (92, 200, 255),  "z": (26, 118, 200),
    #---- Sandman
    "A": (216, 180, 112), "a": (152, 120, 66),
    #---- the Lizard
    "J": (98, 172, 90),   "j": (52, 108, 50),
    #---- symbiote black, and the tear in the world that let it through
    "M": (40, 40, 52),    "m": (22, 22, 30),
    "T": (198, 122, 255), "t": (118, 58, 178),
    #---- civilians
    "1": (58, 62, 78),    "2": (170, 88, 72),   "3": (86, 108, 84),
    "4": (142, 142, 154), "5": (44, 38, 34),    "6": (232, 228, 218),
    "7": (94, 58, 38),    "8": (28, 26, 32),    "9": (196, 168, 128),
})


def g27():
    return grid(GW, GH)


#=====================================================================#
#  THE THREE OF THEM
#
#  Same character three times over, so they cannot be told apart by
#  palette — they are told apart the way the film tells them apart: how
#  heavy each one is, how big the lenses are, and what he is doing with
#  his hands. Tom is braced low, Tobey stands square and heavy with a
#  web-shooter up, Andrew is the lean one crouched furthest forward.
#
#  Gloves are red, not skin: the one thing that made the first pass read
#  as a gingerbread man was pale blobs floating at the ends of the arms.
#=====================================================================#
CX = 13                                     # everybody's centre column


def mask(g, wide=False):
    """The lenses do most of the work at this size, so they get a third of
    the head. `wide` is the big-lensed suit."""
    if wide:
        put(g, 1, 9, "RRRRRRR")
        put(g, 2, 8, "RRRRRRRRR")
        put(g, 3, 8, "RRRRRRRRR")
        put(g, 4, 7, "RWWWRRRWWWR")
        put(g, 5, 7, "REWWRRRWWER")
        put(g, 6, 8, "RrRRRRRrR")
        put(g, 7, 9, "RRRRRRR")
        put(g, 8, 10, "rRRRr")
    else:
        put(g, 1, 10, "RRRRR")
        put(g, 2, 9, "RRRRRRR")
        put(g, 3, 8, "RRRRRRRRR")
        put(g, 4, 8, "RWWRRRWWR")
        put(g, 5, 8, "RWWRRRWWR")
        put(g, 6, 8, "RrRRRRRrR")
        put(g, 7, 9, "RRRRRRR")
        put(g, 8, 10, "rRRRr")


def spider(g, top=12):
    """The emblem, four rows of it. Any less and it is a smudge; any more
    and it swallows the chest."""
    put(g, top, CX - 2, "E"); put(g, top, CX + 2, "E")
    put(g, top + 1, CX - 1, "EEE")
    put(g, top + 2, CX - 1, "EEE")
    put(g, top + 3, CX - 2, "E"); put(g, top + 3, CX + 2, "E")


def arms(g, rows, colour="R", shade="r", step=2, start=1):
    """Shoulder to hand, stepping outward every `step` rows so the limb
    stays a connected diagonal instead of a horizontal T. Three wide: two
    reads as wire at this size, and the gloves are the same red as the
    sleeve rather than skin."""
    out = start
    rows = list(rows)
    for i, r in enumerate(rows):
        put(g, r, CX - 3 - out, shade + colour + colour)
        put(g, r, CX + 1 + out, colour + colour + shade)
        if i % step == step - 1:
            out += 1
    #the fist, a row proud of the sleeve
    r = rows[-1] + 1
    put(g, r, CX - 3 - out, shade + colour + colour)
    put(g, r, CX + 1 + out, colour + colour + shade)


def webbing(g, rows, xs):
    """Single darker pixels rather than a drawn grid, which at this size
    would close up into a solid. Kept off the chest columns so it cannot
    swallow the emblem."""
    for r in rows:
        for x in xs:
            if not (0 <= x < GW and 0 <= r < GH):
                continue
            if CX - 3 <= x <= CX + 3 and 11 <= r <= 17:
                continue
            if g[r][x] == "R":
                g[r][x] = "r"
            elif g[r][x] == "B":
                g[r][x] = "b"


def legs(g, top, spread, boot="R", bootShade="r", leg="B", legShade="b"):
    """Two legs splaying outward from `top`, with a one-column gap between
    them so the outline pass inks it black instead of fusing them."""
    r = top
    out = 0
    for step in spread:
        for _ in range(step):
            put(g, r, CX - 3 - out, leg + leg + legShade)
            put(g, r, CX + 1 + out, legShade + leg + leg)
            r += 1
        out += 1
    put(g, r, CX - 4 - out, boot * 4); put(g, r, CX + 1 + out, boot * 4)
    put(g, r + 1, CX - 5 - out, boot * 5); put(g, r + 1, CX + 1 + out, boot * 5)
    put(g, r + 2, CX - 5 - out, bootShade + boot * 4)
    put(g, r + 2, CX + 1 + out, boot * 4 + bootShade)


def holland():
    """Braced and low. The everyman build: neither heavy nor lean."""
    g = g27()
    mask(g)
    put(g, 9, CX - 1, "RRR")
    put(g, 10, CX - 5, "rRRRRRRRRRr")
    box(g, 11, CX - 3, 16, CX + 3, "R")
    arms(g, range(11, 18), step=2)
    spider(g, 12)
    put(g, 17, CX - 3, "BRRRRRB")
    put(g, 18, CX - 3, "BBBBBBB")
    legs(g, 19, (2, 3, 3, 3))
    webbing(g, (11, 14, 18, 22, 26), (CX - 6, CX - 2, CX + 2, CX + 6))
    return g


def maguire():
    """Square on and heavier, with the near web-shooter already up. The
    raised arm steps a column per row so it stays welded to the shoulder."""
    g = g27()
    mask(g)
    put(g, 9, CX - 1, "RRR")
    put(g, 10, CX - 6, "rRRRRRRRRRRRr")
    box(g, 11, CX - 4, 16, CX + 4, "R")
    #far arm down, near arm up and out
    out = 3
    for i, r in enumerate(range(11, 18)):
        put(g, r, CX - 4 - out, "rR")
        if i % 2 == 1:
            out += 1
    put(g, 17, CX - 4 - out, "RR")
    for i, (r, x) in enumerate([(10, 18), (9, 19), (8, 20), (7, 21)]):
        put(g, r, x, "RR")
    put(g, 6, 21, "HRr")                     # the shooter, firing
    spider(g, 12)
    put(g, 17, CX - 3, "BRRRRRB")
    put(g, 18, CX - 3, "BBBBBBB")
    legs(g, 19, (4, 4, 4))
    webbing(g, (11, 14, 18, 22, 26), (CX - 7, CX - 3, CX + 1, CX + 5))
    return g


def garfield():
    """The lean one, crouched furthest forward, with the big lenses and the
    most blue in the suit."""
    g = g27()
    mask(g, wide=True)
    put(g, 9, CX - 1, "RRR")
    put(g, 10, CX - 4, "rRRRRRRRr")
    box(g, 11, CX - 2, 16, CX + 2, "R")
    put(g, 13, CX - 3, "B"); put(g, 13, CX + 3, "B")
    put(g, 14, CX - 3, "B"); put(g, 14, CX + 3, "B")
    put(g, 15, CX - 3, "B"); put(g, 15, CX + 3, "B")
    arms(g, range(11, 18), step=2, start=1)
    spider(g, 12)
    put(g, 16, CX - 3, "BBRRRBB")
    put(g, 17, CX - 3, "BBBBBBB")
    put(g, 18, CX - 3, "bBBBBBb")
    #crouched: shorter drop, wider splay
    legs(g, 19, (2, 2, 3, 3))
    webbing(g, (11, 13, 17, 21, 25), (CX - 7, CX - 3, CX + 1, CX + 5))
    return g


#=====================================================================#
#  STRANGE
#
#  The odd one out of the four and he has to look it: a robe instead of a
#  suit, the cloak reading as its own thing behind him, and both hands
#  lit. Everything gold on him is the same gold as the spell meter, which
#  is the point — he is the one holding it together.
#=====================================================================#
def strange():
    g = g27()
    #---- the cloak first, so everything else sits on top of it. It has to
    #read as a cloak and not a doorway: a collar standing up past the ears,
    #a mantle only as wide as his shoulders, and a hem that stops well
    #above the boots. The first pass framed him on both sides down to the
    #floor and came out looking like a coffin.
    put(g, 4, 6, "cC"); put(g, 4, 19, "Cc")          # collar, up past the ears
    put(g, 5, 6, "cCC"); put(g, 5, 18, "CCc")
    put(g, 6, 6, "cCC"); put(g, 6, 18, "CCc")
    put(g, 7, 5, "cCC"); put(g, 7, 18, "CCc")
    put(g, 8, 5, "cCC"); put(g, 8, 18, "CCc")
    put(g, 9, 5, "cCC"); put(g, 9, 18, "CCc")
    for r in range(10, 18):
        put(g, r, 4, "cCCC"); put(g, r, 18, "CCCc")
    for r in range(18, 24):
        put(g, r, 3, "cCCC"); put(g, r, 19, "CCCc")
    put(g, 24, 3, "cCC"); put(g, 24, 20, "CCc")
    put(g, 25, 4, "cC"); put(g, 25, 21, "Cc")        # ragged hem
    put(g, 26, 4, "c"); put(g, 26, 22, "c")

    #---- head: grey at the temples, the goatee under the mouth. The hair
    #sits on top rather than wrapping the jaw, which read as a helmet.
    put(g, 2, 10, "88888")
    put(g, 3, 9, "8444448")
    put(g, 4, 9, "8KKKKK4")
    put(g, 5, 9, "4KEKEK4")
    put(g, 6, 9, "kKKKKKk")
    put(g, 7, 10, "k8Kk")
    put(g, 8, 11, "KKK")
    put(g, 9, 11, "nNn")

    #---- robe, with the Eye of Agamotto at the throat
    put(g, 10, CX - 5, "nNNNNNNNNNn")
    box(g, 11, CX - 4, 18, CX + 4, "N")
    put(g, 11, CX - 1, "GGG")
    put(g, 12, CX - 1, "GYG")
    put(g, 13, CX - 1, "GGG")
    #both hands out and lit: he is mid-cast, which is the only reason he is
    #standing in a shooting lane at all
    out = 1
    for i, r in enumerate(range(11, 17)):
        put(g, r, CX - 5 - out, "nNN")
        put(g, r, CX + 3 + out, "NNn")
        if i % 2 == 1:
            out += 1
    put(g, 17, CX - 5 - out, "GYY"); put(g, 17, CX + 3 + out, "YYG")
    put(g, 18, CX - 5 - out, "gGG"); put(g, 18, CX + 3 + out, "GGg")
    put(g, 19, CX - 4, "GGGGGGGGG")          # the sash
    for r in range(20, 30):
        put(g, r, CX - 5, "nNNNNNNNNNn")
    put(g, 30, CX - 5, "nnNNNNNNNnn")
    put(g, 31, CX - 5, "88888888888")
    put(g, 32, CX - 4, "888888888")
    return g


save_set([("nwh-holland", holland())])
save_set([("nwh-maguire", maguire())])
save_set([("nwh-garfield", garfield())])
save_set([("nwh-strange", strange())])


#=====================================================================#
#  A BODY TO HANG THE REST ON
#
#  The coven in the Doomsday branch all came out looking like the same
#  doll in different colours, and the fix there was per-character build
#  and detail. Same lesson here: everyone below shares this skeleton, but
#  build, hair, headgear and a `detail` pass are what actually carry who
#  they are, so nothing reads as a recolour.
#=====================================================================#
def person(top, mid, low, build="normal", hair=None, hairStyle="short",
           skin="K", skinShade="k", detail=None, headgear=None, bald=False):
    g = g27()
    wide = {"lean": 2, "normal": 3, "heavy": 4}[build]

    #---- head
    put(g, 3, 9, skin * 7)
    put(g, 4, 9, f"{skin}{skin}E{skin}E{skin}{skin}")
    put(g, 5, 9, skin * 7)
    put(g, 6, 10, f"{skinShade}{skin}{skin}{skin}{skinShade}")
    put(g, 7, 11, skin * 3)
    if headgear:
        headgear(g)
    elif hair and not bald:
        put(g, 1, 10, hair * 5)
        put(g, 2, 9, hair * 7)
        put(g, 3, 9, hair + skin * 5 + hair)
        if hairStyle == "long":
            for r in range(4, 10):
                put(g, r, 8, hair); put(g, r, 16, hair)
            put(g, 10, 8, hair); put(g, 10, 16, hair)

    #---- shoulders, torso, arms
    put(g, 8, CX - wide - 2, top * (wide * 2 + 5))
    box(g, 9, CX - wide, 17, CX + wide, top)
    out = 1
    for i, r in enumerate(range(9, 16)):
        put(g, r, CX - wide - 2 - out, top + top + top)
        put(g, r, CX + wide + out, top + top + top)
        if i % 3 == 2:
            out += 1
    put(g, 16, CX - wide - 2 - out, skinShade + skin + skin)
    put(g, 16, CX + wide + out, skin + skin + skinShade)

    if detail:
        detail(g)

    #---- belt, legs, shoes
    put(g, 18, CX - wide, mid * (wide * 2 + 1))
    for r in range(19, 30):
        put(g, r, CX - wide, low * (wide - 1))
        put(g, r, CX + 2, low * (wide - 1))
    put(g, 30, CX - wide - 1, "5" * wide)
    put(g, 30, CX + 2, "5" * wide)
    put(g, 31, CX - wide - 1, "5" * wide)
    put(g, 31, CX + 2, "5" * wide)
    return g


#=====================================================================#
#  THE COVEN'S PLACE IN THIS FILM: ELECTRO, THE LIZARD, SANDMAN
#
#  Three named ones that stop and fight instead of walking past. Each is
#  built from a different silhouette so they never read as one enemy in
#  three colours: Electro is a lean man wearing lightning, the Lizard is
#  heavy and hunched with a tail, Sandman has no legs at all.
#=====================================================================#
def electro():
    def arcs(g):
        #the current running off him — the whole reason he is lit
        for r, x in ((7, 5), (9, 3), (11, 2), (13, 3), (15, 5),
                     (7, 21), (9, 23), (11, 24), (13, 23), (15, 21)):
            put(g, r, x, "Z")
            put(g, r + 1, x, "z")
        put(g, 10, CX - 2, "ZZZZZ")
        put(g, 11, CX - 1, "zZz")

    def head(g):
        #no hair: the arc is coming off his skull
        put(g, 1, 10, "zZZZz")
        put(g, 2, 9, "zZZZZZz")
        put(g, 2, 8, "Z"); put(g, 2, 16, "Z")
    return person("z", "Z", "z", build="lean", skin="Z", skinShade="z",
                  headgear=head, detail=arcs)


def lizard():
    def scales(g):
        put(g, 10, CX - 2, "jJJJj")
        put(g, 13, CX - 3, "jJjJjJj")
        #the tail, swung out behind and dropping to the floor
        for i, r in enumerate(range(19, 30)):
            put(g, r, 2 + i // 3, "jJ")
        put(g, 30, 5, "jJJ")

    def head(g):
        #a snout thrown out to one side, which is the whole silhouette: a
        #symmetrical green head just reads as a man with a filter on him
        put(g, 2, 9, "jJJJJJj")
        put(g, 3, 8, "jJJJJJJJj")
        put(g, 4, 8, "jJWJJWJJJ")
        put(g, 5, 8, "jJJJJJJJJJJ")
        put(g, 6, 9, "jJJJJJWWWW")
        put(g, 7, 10, "jJJJjj")
        put(g, 8, 11, "6666")
    return person("J", "j", "J", build="heavy", skin="J", skinShade="j",
                  headgear=head, detail=scales)


def sandman():
    """No legs: a column of sand instead, which is both what he looks like
    and the clearest way to tell him from the other two at a glance. The
    arms are drawn a shade down from the torso or they disappear into it."""
    g = g27()
    put(g, 2, 10, "aAAAa")
    put(g, 3, 9, "aAAAAAa")
    put(g, 4, 9, "aAEAEAa")
    put(g, 5, 9, "aAAAAAa")
    put(g, 6, 10, "aAAAa")
    put(g, 7, 11, "AAA")
    put(g, 8, 8, "aAAAAAAAAAa")
    box(g, 9, 9, 16, 17, "A")
    put(g, 12, 9, "aAaAaAaAa")
    #arms thrown wide, coarsening into loose sand at the ends
    for i, r in enumerate(range(9, 14)):
        put(g, r, 7 - i, "aaA")
        put(g, r, 18 + i, "Aaa")
    put(g, 14, 3, "aa"); put(g, 14, 22, "aa")
    put(g, 15, 2, "a"); put(g, 15, 24, "a")
    #the column: a shaft rather than a skirt, coming apart as it falls
    for r in range(17, 33):
        spread = 4 + (r - 17) // 5
        put(g, r, CX - spread, "a" + "A" * (spread * 2 - 1) + "a")
        if r % 3 == 0:
            put(g, r, CX - spread + 1, "a")
            put(g, r, CX + spread - 2, "a")
    for r, x in ((20, 10), (24, 16), (28, 9), (31, 17)):
        put(g, r, x, ".")
    return g


#=====================================================================#
#  THE RANK AND FILE
#=====================================================================#
def drone():
    """A bat-glider the size of a dog, with a bomb slung under it. Small,
    fast, and there are a lot of them."""
    g = grid(23, 18)
    put(g, 2, 1, "pP"); put(g, 2, 20, "Pp")
    put(g, 3, 1, "pPPP"); put(g, 3, 18, "PPPp")
    put(g, 4, 2, "pPPPP"); put(g, 4, 15, "PPPPp")
    put(g, 5, 4, "pPPPP"); put(g, 5, 14, "PPPPp")
    box(g, 5, 9, 9, 13, "V")
    put(g, 6, 9, "vQQQv")
    put(g, 7, 9, "vVEVv")
    put(g, 8, 9, "vVVVv")
    #the bomb
    put(g, 11, 10, "vVv")
    put(g, 12, 9, "vVVVv")
    put(g, 13, 9, "vVVVv")
    put(g, 14, 10, "vVv")
    put(g, 10, 11, "V")
    return g


def gliderRider():
    """The glider with a trooper on it, coming at you flat out. Wide and
    low, so it never gets confused with a drone."""
    g = grid(27, 20)
    #the board
    put(g, 13, 2, "PPPPPPPPPPPPPPPPPPPPPPP")
    put(g, 14, 3, "ppPPPPPPPPPPPPPPPPPpp")
    put(g, 15, 5, "pppPPPPPPPPPPPpp")
    #the fins
    put(g, 11, 1, "pP"); put(g, 12, 1, "PPp")
    put(g, 11, 24, "Pp"); put(g, 12, 23, "pPP")
    #the rider, crouched over it
    put(g, 4, 11, "vVVVv")
    put(g, 5, 10, "vVQQQVv")
    put(g, 6, 10, "vVEVEVv")
    put(g, 7, 11, "vVVVv")
    box(g, 8, 10, 12, 16, "V")
    put(g, 9, 8, "vVV"); put(g, 9, 17, "VVv")
    put(g, 10, 6, "vVV"); put(g, 10, 19, "VVv")
    #the jets
    put(g, 16, 6, "GY"); put(g, 16, 18, "YG")
    put(g, 17, 7, "G"); put(g, 17, 18, "G")
    return g


def ockArm():
    """A tentacle on its own, stood up on its coils, with the claw open.
    This is the one that stops and burns a lane."""
    g = grid(21, 30)
    #the claw
    put(g, 1, 3, "SS"); put(g, 1, 15, "SS")
    put(g, 2, 4, "SSs"); put(g, 2, 14, "sSS")
    put(g, 3, 5, "sSS"); put(g, 3, 13, "SSs")
    put(g, 4, 7, "sSSSSSs")
    put(g, 5, 7, "SDDDDDS")
    put(g, 6, 7, "SDRRRDS".replace("R", "V"))
    put(g, 7, 7, "sSSSSSs")
    #the spine, segmenting as it drops
    for i, r in enumerate(range(8, 26)):
        w = 3 + i // 5
        put(g, r, 10 - w // 2, ("D" if i % 3 == 2 else "S") * w)
    #the coils it stands on
    put(g, 26, 4, "sSSSSSSSSSSSs")
    put(g, 27, 3, "sSSSSSSSSSSSSSs")
    put(g, 28, 3, "DDDDDDDDDDDDDDD")
    return g


def symbiote(frame):
    """Three frames of the same mass, wobbling. The teeth stay put so the
    animation reads as movement rather than a different creature."""
    g = grid(21, 20)
    lean = (-1, 0, 1)[frame]
    put(g, 2, 8 + lean, "mMMMm")
    put(g, 3, 6 + lean, "mMMMMMMMm")
    put(g, 4, 5 + lean, "mMWMMMWMMm")
    put(g, 5, 5, "mMWMMMWMMMm")
    put(g, 6, 4, "mMMMMMMMMMMMm")
    box(g, 7, 4, 13, 16, "M")
    put(g, 8, 6, "WEWEWEWEW")
    put(g, 9, 6, "EWEWEWEWE")
    #the tendrils, which are what actually move
    for i in range(4):
        x = 3 + i * 4 + (lean if i % 2 else -lean)
        put(g, 14, x, "mM")
        put(g, 15, x, "M")
        put(g, 16, x + (1 if frame else 0), "m")
    put(g, 14, 4, "mMMMMMMMMMMMm")
    return g


def anomaly():
    """What comes through the tear when nobody is holding it shut: a mass
    with something else's skyline inside it. Big and slow."""
    g = grid(26, 26)
    #a rough disc, so it reads as a hole rather than a crate
    for r in range(1, 25):
        k = abs(r - 13) / 12
        w = int(12 * (1 - k * k) ** 0.5)
        if w <= 0:
            continue
        put(g, r, 13 - w, ("t" if r % 5 == 0 else "T") * (w * 2))
    #the other city, showing through the middle of it
    for x, top in ((8, 13), (11, 10), (14, 15), (17, 11)):
        for r in range(top, 21):
            put(g, r, x, "mM")
    #the rim, still burning where it tore
    for r in range(2, 24, 2):
        k = abs(r - 13) / 12
        w = int(12 * (1 - k * k) ** 0.5)
        if w > 1:
            put(g, r, 13 - w, "X")
            put(g, r, 12 + w, "X")
    return g


save_set([("nwh-electro", electro())])
save_set([("nwh-lizard", lizard())])
save_set([("nwh-sandman", sandman())])
save_set([("nwh-drone", drone())])
save_set([("nwh-glider", gliderRider())])
save_set([("nwh-ockarm", ockArm())])
save_set([("nwh-symbiote1", symbiote(0)), ("nwh-symbiote2", symbiote(1)),
          ("nwh-symbiote3", symbiote(2))])
save_set([("nwh-anomaly", anomaly())])


#=====================================================================#
#  THE TWO THAT STOP THE WAVE
#
#  Drawn on their own square grid rather than the cast's 27x34: they are
#  rendered at 230 and 250 px against a hero's 96, so at cast resolution
#  they would blow up into slabs.
#=====================================================================#
def doc_ock():
    """Octavius is his arms. The man in the middle is deliberately small —
    four tentacles reaching out past him is the whole silhouette."""
    g = grid(38, 34)
    cx = 19

    #---- the four arms, two high and two low, each with a claw on the end
    def tentacle(rows, x0, dx, claw_r, claw_x):
        x = x0
        for i, r in enumerate(rows):
            put(g, r, int(x), ("D" if i % 3 == 2 else "S") * 3)
            x += dx
        put(g, claw_r, claw_x, "SS")
        put(g, claw_r, claw_x + 5, "SS")
        put(g, claw_r + 1, claw_x + 1, "sSSSs")
        put(g, claw_r + 2, claw_x + 2, "DVD")

    tentacle(range(12, 4, -1), cx - 6, -1.6, 2, 3)
    tentacle(range(12, 4, -1), cx + 3, 1.6, 2, 28)
    tentacle(range(16, 26), cx - 6, -1.2, 26, 2)
    tentacle(range(16, 26), cx + 3, 1.2, 26, 29)

    #---- the harness the arms come out of
    box(g, 12, cx - 7, 16, cx + 6, "D")
    put(g, 13, cx - 6, "sSSSSSSSSSSs")
    put(g, 15, cx - 6, "sSSSSSSSSSSs")

    #---- the man: bowl cut, round goggles, green coat
    put(g, 3, cx - 4, "5555555")
    put(g, 4, cx - 5, "555555555")
    put(g, 5, cx - 5, "5KKKKKKK5")
    put(g, 6, cx - 5, "5XEKKKEX5")
    put(g, 7, cx - 4, "KKKKKKK")
    put(g, 8, cx - 3, "kKKKKk")
    put(g, 9, cx - 3, "OOOOOO")
    box(g, 10, cx - 5, 11, cx + 4, "O")
    put(g, 10, cx - 1, "666")
    box(g, 17, cx - 5, 24, cx + 4, "O")
    put(g, 18, cx - 1, "666")
    put(g, 21, cx - 1, "666")
    for r in range(17, 25):
        put(g, r, cx - 6, "o"); put(g, r, cx + 5, "o")
    #legs under the coat
    for r in range(25, 31):
        put(g, r, cx - 5, "ooo"); put(g, r, cx + 2, "ooo")
    put(g, 31, cx - 6, "5555"); put(g, 31, cx + 2, "5555")
    return g


def green_goblin():
    """Mask, hood, and the glider under him. He is read from the mask
    first, so it gets the top third to itself."""
    g = grid(36, 36)
    cx = 18

    #---- the hood, thrown back off the mask
    put(g, 1, cx - 5, "pPPPPPPPPp")
    put(g, 2, cx - 7, "pPPPPPPPPPPPPp")
    put(g, 3, cx - 8, "pPP")
    put(g, 3, cx + 6, "PPp")
    for r in range(4, 12):
        put(g, r, cx - 9, "pPP"); put(g, r, cx + 7, "PPp")
    put(g, 12, cx - 8, "pP"); put(g, 12, cx + 7, "Pp")

    #---- the mask: the ears, the brow, and the grin
    put(g, 2, cx - 5, "vVVVVVVVVv")
    put(g, 3, cx - 6, "vVVVVVVVVVVv")
    put(g, 2, cx - 8, "vV"); put(g, 2, cx + 7, "Vv")   # the pointed ears
    put(g, 3, cx - 8, "vVV"); put(g, 3, cx + 6, "VVv")
    put(g, 4, cx - 7, "vVVVVVVVVVVVVv")
    put(g, 5, cx - 7, "vVEEVVVVVVEEVv")
    put(g, 6, cx - 7, "vVEQVVVVVVQEVv")
    put(g, 7, cx - 6, "vVVVVVVVVVVv")
    put(g, 8, cx - 5, "vVVVVVVVVv")
    put(g, 9, cx - 5, "EWEWEWEWE")            # the grin
    put(g, 10, cx - 4, "vVVVVVVv")
    put(g, 11, cx - 3, "vVVVVv")

    #---- the armour, and the bomb in his hand
    put(g, 12, cx - 7, "vVVVVVVVVVVVVv")
    box(g, 13, cx - 6, 20, cx + 5, "V")
    put(g, 14, cx - 5, "vVvVvVvVvV")
    put(g, 17, cx - 5, "vVvVvVvVvV")
    for i, r in enumerate(range(13, 20)):
        put(g, r, cx - 9 - i // 2, "vVV")
        put(g, r, cx + 6 + i // 2, "VVv")
    put(g, 20, cx - 13, "vVVv")
    put(g, 19, cx + 9, "vVVv")
    #the pumpkin bomb, lit
    put(g, 21, cx - 14, "gGg")
    put(g, 22, cx - 15, "gGYGg")
    put(g, 23, cx - 15, "gGYGg")
    put(g, 24, cx - 14, "gGg")
    #legs, tucked
    for r in range(21, 26):
        put(g, r, cx - 5, "vVV"); put(g, r, cx + 3, "VVv")
    put(g, 26, cx - 6, "PPPP"); put(g, 26, cx + 3, "PPPP")

    #---- the glider under him
    put(g, 28, cx - 15, "P" * 31)
    put(g, 29, cx - 13, "pP" + "P" * 22 + "Pp")
    put(g, 30, cx - 10, "pp" + "P" * 16 + "pp")
    put(g, 27, cx - 17, "pPP"); put(g, 27, cx + 15, "PPp")
    put(g, 31, cx - 7, "GYG"); put(g, 31, cx + 5, "GYG")
    put(g, 32, cx - 6, "G"); put(g, 32, cx + 6, "G")
    return g


#=====================================================================#
#  THE LINE-UP THAT ANSWERS THE W KEY
#
#  Not more heroes: the people who were actually in the room. Each is
#  built off person() with a different build, hair and one prop, because
#  six civilians in a row is exactly where everything-looks-the-same
#  happens if you let it.
#=====================================================================#
def mj():
    return person("5", "1", "1", build="lean", hair="7", hairStyle="long")


def ned():
    def shirt(g):
        put(g, 11, CX - 3, "666")
        put(g, 13, CX - 2, "6")
    return person("2", "5", "1", build="heavy", hair="8", detail=shirt)


def may():
    def coat(g):
        put(g, 10, CX - 3, "6")
        put(g, 12, CX - 3, "6")
        put(g, 14, CX - 3, "6")
    return person("3", "5", "1", build="lean", hair="9", hairStyle="long",
                  detail=coat)


def happy():
    def suit(g):
        #a collar and a tie, which is all Happy ever needs to be Happy
        put(g, 9, CX - 1, "6E6")
        put(g, 10, CX, "2")
        put(g, 11, CX, "2")
        put(g, 12, CX, "2")
    return person("1", "5", "1", build="heavy", hair="5", detail=suit)


def wong():
    def robes(g):
        put(g, 10, CX - 4, "GGGGGGGGG")
        put(g, 16, CX - 3, "GGGGGGG")
    return person("C", "G", "c", build="heavy", hair="8", detail=robes,
                  skin="K", skinShade="k")


def matt():
    def glasses(g):
        put(g, 4, 9, "EEEEEEE")
        put(g, 10, CX - 3, "2")
        put(g, 12, CX - 3, "2")
    return person("5", "2", "5", build="normal", hair="2", detail=glasses)


save_set([("nwh-ock", doc_ock())])
save_set([("nwh-goblin", green_goblin())])
for name, fn in (("nwh-mj", mj), ("nwh-ned", ned), ("nwh-may", may),
                 ("nwh-happy", happy), ("nwh-wong", wong), ("nwh-matt", matt)):
    save_set([(name, fn())])
