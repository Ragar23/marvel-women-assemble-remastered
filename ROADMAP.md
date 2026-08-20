# Roadmap

Ordered by impact. Everything in Phase 1 is a real defect found by reading the current
`index.js` — line numbers refer to the code as it stands at the seed commit.

---

## Phase 1 — Fix what is broken ✅ done

All eleven are fixed. Verified in headless Chromium: the game boots, the loop
survives sustained fire, diagonal movement works, the easter egg fires, and a
passive run ends at 3.5s versus 3.0s before — so the difficulty was not changed
by accident. The diagnoses below are kept as a record of what was wrong.

### ✅ 1.1 Crash: Chitauri collisions are indexed by the wrong loop

`index.js:391` calls `collisionWithWanda(arrayOfChitauris[i])` from inside the
space-dogs loop. The two arrays are spliced independently whenever something is shot,
so `i` runs past the end of `arrayOfChitauris` and the call receives `undefined` —
reading `.x` off it throws and the animation loop dies mid-game.

**Fix:** give the Chitauri their own loop, or guard the lookup.

### ✅ 1.2 Wrong hitboxes for everything that is not a space dog

`collisionWithWanda`, `collisionWithGaunlet` and `collisionWithWomen` all measure the
incoming enemy with `spaceDogsImage.width` / `.height`, whatever the enemy actually is.
`collisionWithBall` uses `.width` for the *bottom* edge of both the enemy and the ball
(`index.js:656`, `index.js:661`), so every hitbox is square regardless of the sprite.

**Fix:** one `intersects(a, b)` helper taking explicit width/height, used everywhere.

### ✅ 1.3 `arrayOfSpaceDogs < 6` compares an array to a number

`index.js:406`. This coerces the array to a string and is always `false`, so the
top-up never runs. Once you shoot the last space dog the wave is gone for good.
Presumably meant to be `.length`.

### ✅ 1.4 Enemies spawned without a `y`

`index.js:207-211`: every `S` press pushes `{ x: 1300 }` and
`{ x: 1800, x: 1800, x: 1800 }` (the same key three times — the object has one
property). With no `y`, the sprite draws at `NaN` and its collision maths is `NaN`,
so it is invisible and harmless.

Separately: **shooting should not spawn enemies.** Right now firing makes the game
harder, which is almost certainly not the intent.

### ✅ 1.5 Splicing arrays while looping over them

`index.js:315-319` and `index.js:384-388` `splice()` inside a forward `for` loop, which
skips the next element. Two enemies overlapping a single shot means one survives.

**Fix:** mark as dead, sweep after the loop (or iterate backwards).

### ✅ 1.6 `keyup` clears every direction at once

`index.js:234` resets all four flags no matter which key was released. Release `→`
while still holding `↑` and the hero stops dead.

**Fix:** switch on `event.code`, or track held keys in a `Set`.

### ✅ 1.7 Movement is tied to frame rate

Every position update adds a fixed number of pixels per frame. On a 144 Hz monitor the
game runs ~2.4× faster than on a 60 Hz one — the same game, wildly different difficulty.

**Fix:** delta-time the loop, express speeds in pixels per second.

### ✅ 1.8 Final score shows 0 on every other game over

`finalScore()` (`index.js:183`) *toggles* between the real score and the placeholder
text instead of just setting it. It is also called from both the game-over branch and
`resetVariables()`, so the toggles fight each other.

**Fix:** set the text, don't toggle it.

### ✅ 1.9 Levi is checked for collisions where it is not drawn

`index.js:362` draws the sprite at `y = 250`, but `index.js:395` collision-checks it
against `leviY`, which is `150` and never changes. You die to empty space a hundred
pixels above it, and fly straight through the sprite itself.

**Fix:** draw and collide against the same position — one entity object per enemy.

### ✅ 1.10 The game loop is never really cancelled

`intervalId` holds a `requestAnimationFrame` handle, but the branch that cancels it
(`index.js:449`) runs *after* the frame that already scheduled the next one. Clicking
START twice stacks a second loop on top of the first, and everything moves at double speed.

**Fix:** a single `running` flag plus one scheduling site.

### ✅ 1.11 Collisions run before the sprites have loaded

Images are used the moment `draw()` starts. Until a sprite has decoded, `.width` is `0`,
so early hitboxes are wrong — and the very first frames are the ones where the hero
sits at the left edge.

**Fix:** preload all assets, show a loading state, start the game only when ready.

---

## Phase 2 — Make it feel like a game

- **The game is over in three and a half seconds.** Now that Phase 1 is in, this
  is the single most glaring problem. Do nothing at all and a space dog reaches
  the Infinity Stones at `(0, 450)` in ~3.5s — the original was 3.0s, so this is
  inherited, not new. The stones need either a health bar, a shield, or a much
  slower first wave.
- **Shot cooldown** — nothing limits the fire rate. Holding `S` produces a solid
  wall of projectiles that clears the screen, which is the only reason the game
  is survivable at all right now. Cooldown and stone health have to be tuned together.
- **Lives** — three of them, with i-frames after a hit. This was in the original backlog and never landed.
- **Difficulty curve** — enemy speed and spawn rate rising with score, instead of everything at once from second zero.
- **Waves** — replace the hand-written spawn coordinates (`x: 11800`, `x: 23100` …) with a spawner driven by time and difficulty.
- **Hit feedback** — an explosion sprite, a small screen shake, a sound on impact.
- **High score** in `localStorage`.
- **Pause** on `Esc` / window blur.
- **A restart that actually restarts** — `resetVariables()` never resets `chit1ImageX`, which is decremented every single frame, so the walking Chitauri is already far off the left edge when the second run begins. The held-direction flags are not reset either.

## Phase 3 — Reach more players

- **Responsive canvas** — it is hard-coded to 1364×768 (`index.html`), which overflows most laptop screens and every phone. Scale to the viewport, keep the aspect ratio.
- **Touch controls** for mobile.
- **Audio that behaves** — browsers block autoplay, so the splash-screen music silently fails today. Add a mute toggle and remember the choice.
- **Accessibility** — keyboard-reachable buttons, visible focus, respect `prefers-reduced-motion`, real `alt` text on the character images.
- **Asset weight** — `assets/` is ~10 MB of MP3, most of it downloaded before you can play. Trim and compress.

## Phase 4 — Make it pleasant to work on

- **Split `index.js`** (740 lines, one scope) into modules: `assets`, `input`, `player`, `enemies`, `collision`, `audio`, `ui`, `loop`.
- **Replace the 20+ loose `let` position variables** with entity objects in arrays.
- **A game state machine** — `menu → playing → paused → gameOver` — instead of toggling `style.display` on eight elements in four places.
- **Config file** for speeds, spawn rates and points, so tuning is not a code hunt.
- **Tooling** — Vite dev server, ESLint + Prettier.
- **CI** — GitHub Actions building and deploying to GitHub Pages on push to `main`.
- **A few tests** around collision maths and scoring.

---

## Known and left alone

- The tab requests `/favicon.ico` and gets a 404. Cosmetic, and true of the
  original too. A favicon comes with the Phase 3 polish.

## Deliberately not changing

- The look. The Marvel font, the red buttons, the Endgame music and the Stan Lee cameo are the point.
- The `W` easter egg.
- The original repo — it stays exactly as it was in 2021.
