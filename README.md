# MARVEL. ¡WOMEN, ASSEMBLE! — Remastered

A remaster of the original browser arcade game built in 2021 with vanilla JavaScript
and the HTML5 Canvas API. You pick a hero, dodge the space dogs and Chitauri coming
in from the right, and shoot them for points.

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

> Serving over a local server matters more than it looks: the game reads
> `image.width` / `image.height` for its collision boxes, so anything that delays
> image loading changes how the game behaves.

## Controls

| Key | Action |
| --- | --- |
| `↑` / `↓` | Move up / down |
| `←` / `→` | Move backwards / forwards |
| `S` | Shoot |
| `W` | Easter egg — the women assemble |

## How it is built today

| File | Contains |
| --- | --- |
| `index.html` | Splash screen, how-to-play panel, game-over screen and the `<canvas>` |
| `index.js` | Everything else — asset loading, input, the `draw()` game loop, collisions, audio |
| `style.css` | Screen layout and the Marvel-font buttons |
| `images/` | Sprites and backgrounds |
| `assets/` | Music, sound effects and the `Marvel.ttf` font |

Everything runs off a single `requestAnimationFrame` loop in `draw()`, with module-level
`let` variables holding all game state.

## What is next

See [`ROADMAP.md`](./ROADMAP.md) for the prioritised list of fixes and improvements —
starting with the bugs that are currently reachable during normal play.

## Credits

Built by [Raquel R. García](https://github.com/Ragar23). Marvel characters, artwork and
music belong to Marvel / Disney; this is a non-commercial fan project made for learning.
