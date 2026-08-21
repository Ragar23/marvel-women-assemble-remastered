"""One-shot refactor: split index.js into ES modules under src/.

Two things make this more than a copy-paste:
  * Shared arrays get reassigned (`enemies = enemies.filter(...)`), and an
    imported binding cannot be assigned to. They become exported consts,
    mutated in place via sweep()/replaceAll().
  * Shared scalars get reassigned everywhere, so they move into grouped
    objects: run.score, fx.shake, world.player, sess.state.
Renaming has to skip strings, comments, template literals and object keys,
so the source is walked with a small tokenizer instead of regex.
"""
import re, os

src = open("index.js").read()

# --- the one local that shadows a global we are about to move ---
src = src.replace("  const flash = o.flash || 0;", "  const flashAmount = o.flash || 0;")
src = src.replace("  if (flash > 0) {", "  if (flashAmount > 0) {")
src = src.replace("ctx.globalAlpha = clamp(flash, 0, 1);", "ctx.globalAlpha = clamp(flashAmount, 0, 1);")

# --- the easter egg reaches into the audio module's `muted`; give it a door ---
src = src.replace("""  //The one moment this track was made for.
  if (!muted) {
    assembleTheme.currentTime = 0;
    playSafely(assembleTheme);
  }""", "  playAssembleTheme();")
src = src.replace("""function toggleMute() {""",
"""//The easter egg's theme, the one moment this track was made for.
export function playAssembleTheme() {
  if (muted) return;
  assembleTheme.currentTime = 0;
  playSafely(assembleTheme);
}

function toggleMute() {""")

# --- excise the global declaration block; state.js defines it properly ---
decls = re.search(r"let state = \"menu\";.*?\nlet stars;\n", src, re.S)
src = src[:decls.start()] + "//__STATE__\n" + src[decls.end():]

# ---------------------------------------------------------------- tokenizer
def code_spans(s):
    spans, i, n, start = [], 0, len(s), 0
    while i < n:
        c, nxt = s[i], (s[i+1] if i+1 < n else "")
        if c == "/" and nxt == "/":
            spans.append((start, i)); j = s.find("\n", i); i = n if j < 0 else j; start = i
        elif c == "/" and nxt == "*":
            spans.append((start, i)); j = s.find("*/", i+2); i = n if j < 0 else j+2; start = i
        elif c in "'\"":
            spans.append((start, i)); q = c; i += 1
            while i < n and s[i] != q: i += 2 if s[i] == "\\" else 1
            i += 1; start = i
        elif c == "`":
            spans.append((start, i)); i += 1
            while i < n:
                if s[i] == "\\": i += 2; continue
                if s[i] == "`": i += 1; break
                if s[i] == "$" and i+1 < n and s[i+1] == "{":
                    i += 2; depth, sub = 1, i
                    while i < n and depth:
                        if s[i] == "{": depth += 1
                        elif s[i] == "}": depth -= 1
                        elif s[i] in "'\"`":
                            q = s[i]; i += 1
                            while i < n and s[i] != q: i += 2 if s[i] == "\\" else 1
                        i += 1
                    spans.append((sub, i-1)); continue
                i += 1
            start = i
        else:
            i += 1
    spans.append((start, n))
    return [(a, b) for a, b in spans if b > a]

RENAME = {}
for n_ in "score kills combo bestCombo wave stonesHp waveElapsed betweenWaves betweenTimer".split(): RENAME[n_] = "run." + n_
for n_ in "shake flash elapsed waveBanner hitStop slowMo timeScale grootTimer grootStanding chitFrame chitTimer stars".split(): RENAME[n_] = "fx." + n_
for n_ in "player boss bossDying mjolnir nextEnemyId".split(): RENAME[n_] = "world." + n_
for n_ in "state animationId lastFrameTime chosenHero".split(): RENAME[n_] = "sess." + n_

ident = re.compile(r"\b[A-Za-z_$][A-Za-z0-9_$]*\b")

def rewrite(s, table):
    out, last = [], 0
    for a, b in code_spans(s):
        out.append(s[last:a]); chunk = s[a:b]; pieces, prev = [], 0
        for m in ident.finditer(chunk):
            if m.group(0) not in table: continue
            before = chunk[:m.start()].rstrip(); after = chunk[m.end():].lstrip()
            if before.endswith(".") or after.startswith(":"): continue
            pieces.append(chunk[prev:m.start()]); pieces.append(table[m.group(0)]); prev = m.end()
        pieces.append(chunk[prev:]); out.append("".join(pieces)); last = b
    out.append(s[last:]); return "".join(out)

src = rewrite(src, RENAME)

ARRAYS = "bullets enemyShots enemies powerUps particles floatTexts heroes spawnQueue corpses pops boltArcs missiles".split()
for a in ARRAYS:
    src = re.sub(rf"(?m)^(\s*){a} = \[\];", rf"\1{a}.length = 0;", src)
    src = re.sub(rf"{a} = {a}\.filter\(", f"sweep({a}, ", src)
src = src.replace("enemies = survivors;", "replaceAll(enemies, survivors);")

# ------------------------------------------------------------ split into modules
MODULES = [
    ("canvas",    None),
    ("config",    "const CONFIG_MJOLNIR_DAMAGE"),
    ("assets",    "const imageSources"),
    ("dom",       "const screens"),
    ("util",      "const rand"),
    ("state",     "//__STATE__"),
    ("waves",     "function startWave"),
    ("effects",   "function burst"),
    ("abilities", "function chargeUlt"),
    ("input",     "const heldKeys"),
    ("assemble",  "function assembleTheWomen"),
    ("sim",       "function update("),
    ("mjolnir",   "function throwMjolnir"),
    ("world",     "function updateSpawning"),
    ("render",    "function draw("),
    ("hud",       "function drawHud"),
    ("loop",      "function frame("),
    ("audio",     "const MUSIC_START_SECONDS"),
    ("boot",      "function splitTitle"),
]
cuts = [0]
for name, marker in MODULES[1:]:
    i = src.index(marker)
    i = src.rfind("//===", 0, i)          # start at the section banner if present
    if i < cuts[-1] or src.count("\n", i, src.index(marker)) > 8:
        i = src.rindex("\n", 0, src.index(marker)) + 1
    cuts.append(i)
cuts.append(len(src))
chunks = {MODULES[k][0]: src[cuts[k]:cuts[k+1]] for k in range(len(MODULES))}

STATE_MODULE = '''//=====================================================================//
//  GAME STATE
//
//  Arrays are exported as consts and mutated in place, because an imported
//  binding cannot be reassigned. Scalars are grouped into objects for the
//  same reason: `run.score = 0` works across modules, a bare `score = 0`
//  would not.
//=====================================================================//

//Which screen we are on, and the handles that drive the loop.
export const sess = {
  state: "menu", // menu | playing | paused | gameover
  animationId: null,
  lastFrameTime: 0,
  chosenHero: "wanda",
};

//Everything the scoreboard cares about; cleared on every new run.
export const run = {
  score: 0, kills: 0, combo: 0, bestCombo: 1, wave: 0, stonesHp: 0,
  waveElapsed: 0, betweenWaves: false, betweenTimer: 0,
};

//Presentation state: shake, flashes, timers, the animated set dressing.
export const fx = {
  shake: 0, flash: null, elapsed: 0, waveBanner: null,
  hitStop: 0, slowMo: 0, timeScale: 1,
  grootTimer: 0, grootStanding: true, chitFrame: 0, chitTimer: 0,
  stars: [],
};

//The singular actors.
export const world = {
  player: null, boss: null, bossDying: null, mjolnir: null, nextEnemyId: 0,
};

export const bullets = [];
export const enemyShots = [];
export const enemies = [];
export const powerUps = [];
export const particles = [];
export const floatTexts = [];
export const heroes = [];
export const spawnQueue = [];
export const corpses = [];
export const pops = [];
export const boltArcs = [];
export const missiles = [];
'''
chunks["state"] = chunks["state"].replace("//__STATE__\n", "") 
# drop the old section banner, the new module supplies its own
chunks["state"] = re.sub(r"^//=+//\n//  GAME STATE\n//=+//\n\n?", "", chunks["state"])
chunks["state"] = STATE_MODULE + "\n" + chunks["state"]

chunks["util"] += '''
//Arrays are shared as consts, so filtering has to happen in place.
export function sweep(arr, keep) {
  let j = 0;
  for (const item of arr) if (keep(item)) arr[j++] = item;
  arr.length = j;
}

export function replaceAll(arr, next) {
  arr.length = 0;
  for (const item of next) arr.push(item);
}
'''

# --------------------------------------------------- exports and imports
DEF = re.compile(r"(?m)^(function|const|let|class)\s+([A-Za-z_$][\w$]*)")
owner, bodies = {}, {}
for name, text in chunks.items():
    text = DEF.sub(lambda m: f"export {m.group(1)} {m.group(2)}", text)
    bodies[name] = text
    for m in DEF.finditer(text.replace("export ", "")):
        owner[m.group(2)] = name
for name, text in bodies.items():
    for m in re.finditer(r"(?m)^export (const|let) ([A-Za-z_$][\w$]*), ", text):
        pass

os.makedirs("src", exist_ok=True)
for name, text in bodies.items():
    used = set()
    for a, b in code_spans(text):
        for m in ident.finditer(text[a:b]):
            w = m.group(0)
            before = text[a:b][:m.start()].rstrip()
            if before.endswith("."): continue
            if w in owner and owner[w] != name: used.add(w)
    by_mod = {}
    for w in sorted(used): by_mod.setdefault(owner[w], []).append(w)
    header = "".join(
        f'import {{ {", ".join(names)} }} from "./{mod}.js";\n'
        for mod, names in sorted(by_mod.items()))
    out = (header + "\n" + text.lstrip("\n")) if header else text
    open(f"src/{name}.js", "w").write(out)
    print(f"src/{name}.js  {len(out.splitlines()):>4} lines  imports from {len(by_mod)} modules")

open("index.js", "w").write(
    '//Entry point. The game lives in src/ — see src/state.js for how the\n'
    '//shared arrays and grouped scalars work.\n'
    'import "./src/boot.js";\n')
os.remove("index.generated.js") if os.path.exists("index.generated.js") else None
print("\nindex.js is now the entry point")
