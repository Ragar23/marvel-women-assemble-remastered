# Roadmap — Doomsday branch

This branch is a reskin. The engine, wave system, ultimates framework and
smoke test all come from `main`; what changed is the cast, the villains, the
palette and the menu.

## What the reskin needed

- **Twenty-one new sprites**, all side-facing on the same 52x48 grid so they
  sit together. `tools/pixelfigure.py` holds the shared stride and shading;
  `tools/make_doomsday.py` supplies each character's colours and props.
  Regenerate with `python3 tools/make_doomsday.py`.
- **A darker background.** `images/dd-bg.png` is generated from the original
  `bg.png` — desaturated, dimmed and pushed toward green — so the purple is
  gone without redrawing the scene.
- **A countdown** to 18 December 2026, counting whole calendar months first,
  the way the teaser's clock does.

## Two bugs the reskin exposed in the engine

Both were latent on `main` and would have bitten any future theme:

- `drawMjolnir` and `drawShield` hard-coded `img.mjolnir` and `img.shield`. A
  theme loading neither crashed the render loop on the first frame the weapon
  was in the air. Both now fall back to whatever the hero throws.
- `sess.chosenHero` defaulted to a hero id that no longer existed, so the
  first `resetGame()` read `undefined.sprite`.

A check that every `img.X` reference is actually present in `imageSources`
found both, and is worth running after any asset change.

## Still outstanding

- Boss-wave music, and sound effects tuned to the greener palette.
- The three witches share one hooded silhouette in three colours. Distinct
  silhouettes would read better at speed.
- Touch controls, WASD, and honouring reduced-motion on the canvas — all
  still open on `main` too.
