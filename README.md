# AVENGERS: DOOMSDAY — arcade

A Doomsday-themed reskin of the remastered arcade shooter, on its own branch.
Same engine, different war: Doom's Sentinels come for the Stones, his coven of
Latverian Witches arrives one at a time, and Doom himself waits at wave ten.

The countdown on the menu runs to **18 December 2026**. It is a single
constant, `RELEASE`, at the top of `src/boot.js`.

> This is the `doomsday` branch. `main` is the Avengers remaster, and nothing
> here is merged back into it.

## Play it

No build step, no dependencies — it is plain HTML, CSS and JS.

```bash
git clone https://github.com/Ragar23/marvel-women-assemble-remastered.git
cd marvel-women-assemble-remastered
python3 -m http.server 5501   # or: npx serve .
```

Then open <http://localhost:5501>. Opening `index.html` directly with `file://`
mostly works too, but a local server is more reliable for the audio and font files.

> The START button stays disabled until every sprite has decoded, because the
> collision boxes are measured from `image.width` / `image.height`.

## Controls

| Key | Action |
| --- | --- |
| `↑` `↓` `←` `→` | Move |
| `S` | Shoot — hold to keep firing |
| `Space` | Ultimate — once the meter is full |
| `Esc` | Pause |
| `M` | Mute |
| `W` | Easter egg — the women assemble |

## What's in it

- **Four heroes that play differently**, each with an ultimate charged by kills
  and spent with `Space`:
  - **Thor** — throws **Stormbreaker**, which seeks its own targets, strikes
    several and returns to his hand; he cannot throw again until he catches it.
    **God Blast** arcs lightning to every enemy on screen.
  - **Cyclops** — a long optic blast from the visor that pierces everything in
    its path. **Optic Overload** is that same beam with the visor off: the
    same red, wider than he is tall, held open across the screen for three
    and a half seconds.
  - **Shuri** as Black Panther — kinetic claw pulses that carry only so far, so
    she has to close in, and she punches anything within reach. **Kinetic
    Blast** dumps the stored energy back out as one purple shockwave, and what
    the suit cannot spend in that instant stays wrapped around her for five
    seconds, burning anything that closes.
  - **Human Torch** — fireballs, and he only catches light while he is throwing
    them: hold `S` and the sprite runs a three-frame flame cycle. **Flame On**
    sets him alight for fifteen seconds without the key held: everything on
    screen burns at once, and anything that touches him afterwards burns too.

- **Sentinels** replace the space dogs — slower, heavier, and there are a lot
  of them, in two speeds.
- **The Latverian Witches** arrive one at a time, named, with a health bar from
  the moment they appear. Marvel confirmed the coven at SDCC but has not
  detailed their powers, so these are three distinct ideas built from the
  premise, named by coven title rather than invented as canon: **The Hexweaver**
  throws hexbolts from range, **The Veiled** blinks toward you, and **The
  Warden** carries a ward that soaks damage until it breaks open.
- **A boss every fifth wave** — a **Sentinel Prime** at wave 5, **Doctor Doom**
  at wave 10 with a five-bolt green wave, alternating after that.
- **The line-up** answering `W`: Reed Richards, Beast, Bucky Barnes, Mystique,
  Loki and Magneto.

- **Stan Lee wanders through.** Every twenty to fifty seconds he walks on from
  one side, stops in the middle to wave, and carries on out of frame.
- **Animation throughout.** The hero banks into turns and kicks back when firing,
  enemies bob and fade in and spin apart when killed, Thanos telegraphs his blasts
  and comes apart in slow motion, and every kill freezes the game for a few frames
  so the hit lands.

Everything worth arguing about — speeds, hit points, drop rates, wave sizes,
animation timings — is in the `CONFIG`, `HEROES`, `ENEMY_TYPES` and `WAVE_PLAN`
objects at the top of `index.js`. Speeds are in pixels per **second**, so the game plays identically on
a 60Hz laptop and a 120Hz display.

## How it is built today

| File | Contains |
| --- | --- |
| `index.html` | The three screens — menu, game, game over — and the `<canvas>` |
| `index.js` | Tuning, asset loading, input, waves, entities, collisions, effects, HUD, audio |
| `style.css` | The menu and game-over design, and the responsive canvas |
| `tools/` | `make-thor-sprite.py`, which draws `thor.png` and `lightning.png` |
| `images/` | Sprites and backgrounds |
| `assets/` | Music, sound effects and the `Marvel.ttf` font |

Everything runs off a single `requestAnimationFrame` loop driven by delta time, with
a state machine (`menu` / `playing` / `paused` / `gameover`) deciding what is on
screen.

> Because the game is ES modules, it must be served over HTTP — opening
> `index.html` from the filesystem will not work.

## Regenerating art and sound

Most of the art and all nine sound effects are generated, not hand-authored,
so they can be tweaked and rebuilt:

```bash
python3 tools/make_hires.py       # Thor and the Human Torch — needs Pillow
python3 tools/tint_shuri.py       # repaints the panther suit in her violet
python3 tools/make_doomsday.py    # the rest of the Doomsday cast
python3 tools/make_ironman.py
python3 tools/make_mjolnir.py
python3 tools/make_sounds.py      # stdlib only
```

`make_hires.py` draws on a 27x34 logical grid and upscales it, which is the
same density as the hand-drawn art it stands next to — the 104x96 builder in
`make_doomsday.py` could not reach it. Anything named in `images/handmade.txt`
is art someone drew by hand and every generator skips it; see that file before
swapping a sprite, particularly for the sets the game cross-fades between.

## Testing

`tools/smoke.js` drives the real game in a headless browser and checks that each
hero kills, each ultimate fires, the boss lives and dies, and the screens flow:

```bash
python3 -m http.server 8899 &
node tools/smoke.js
```

## What is next

See [`ROADMAP.md`](./ROADMAP.md) for the prioritised list of fixes and improvements —
starting with the bugs that are currently reachable during normal play.

## Credits

Built by [Raquel R. García](https://github.com/Ragar23). Marvel characters, artwork and
music belong to Marvel / Disney; this is a non-commercial fan project made for learning.
