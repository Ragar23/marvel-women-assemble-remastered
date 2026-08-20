# MARVEL. ¡WOMEN, ASSEMBLE! — Remastered

A remaster of the original browser arcade game built in 2021 with vanilla JavaScript
and the HTML5 Canvas API. Pick a hero, hold the line against waves of Outriders,
Ultrons, Chitauri and Black Order lieutenants, and keep them off the Infinity
Stones. Every fifth wave, Thanos turns up.

This repository is the **working copy** where all improvements happen.
The original game is preserved, untouched, at
[Ragar23/marvel-women-assemble](https://github.com/Ragar23/marvel-women-assemble)
(playable here: <https://ragar23.github.io/marvel-women-assemble/>).

The original project README is kept as [`README.original.md`](./README.original.md).

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
| `Esc` | Pause |
| `M` | Mute |
| `W` | Easter egg — the women assemble |

## What's in it

- **Three heroes that play differently**, tuned to near-identical single-target
  damage so the choice is about style, not power:
  | Hero | Damage | Cooldown | Special |
  | --- | --- | --- | --- |
  | Scarlet Witch | 2 | 0.22s | Balanced |
  | Captain Marvel | 1 | 0.11s | Rapid fire |
  | Thor | 3 | 0.34s | Bolts pierce 2 extra enemies |
- **Escalating waves** — eight enemy types, arriving faster and tougher as you go.
  Ultrons weave, Cull Obsidian soaks damage, Leviathans are slow and enormous.
- **A Thanos boss fight** every fifth wave, with a health bar, homing blasts and
  summoned minions.
- **Three lives plus an Infinity Stones health bar.** Anything that reaches the
  left edge damages the Stones by an amount matched to how dangerous it was.
- **Power-ups** from kills — rapid fire, shield, screen-clearing blast.
- **A combo multiplier** up to x5, reset by taking a hit or letting one through.

Everything worth arguing about — speeds, hit points, drop rates, wave sizes — is
in the `CONFIG`, `HEROES`, `ENEMY_TYPES` and `WAVE_PLAN` objects at the top of
`index.js`. Speeds are in pixels per **second**, so the game plays identically on
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
a `state` machine (`menu` / `playing` / `paused` / `gameover`) deciding what is on
screen. Splitting `index.js` into modules is the main outstanding cleanup — see
Phase 4 of the roadmap.

## What is next

See [`ROADMAP.md`](./ROADMAP.md) for the prioritised list of fixes and improvements —
starting with the bugs that are currently reachable during normal play.

## Credits

Built by [Raquel R. García](https://github.com/Ragar23). Marvel characters, artwork and
music belong to Marvel / Disney; this is a non-commercial fan project made for learning.
