import { fireUlt } from "./abilities.js";
import { img, loadImages } from "./assets.js";
import { audioState, sfx } from "./audio.js";
import { BOSSES, CONFIG, ELITE_SCHEDULE, ENEMY_TYPES, HEROES, WAVE_PLAN } from "./config.js";
import { startBtn } from "./dom.js";
import { heldKeys } from "./input.js";
import { startPortal } from "./portal.js";
import { throwMjolnir } from "./mjolnir.js";
import { becomeWorthy, punch, throwShield } from "./shield.js";
import { boltArcs, bullets, comboMultiplier, corpses, enemies, enemyShots, floatTexts, fx, heroDef, heroTint, heroes, incursionProgress, incursionStage, missiles, particles, playerHitbox, pops, powerUps, punches, resetGame, run, sess, spawnQueue, speedMultiplier, world } from "./state.js";
import { draw } from "./render.js";
import { update } from "./sim.js";
import { bossForWave, startWave, summonBoss } from "./waves.js";
import { addScore, awardLife, bossPhase, damageBoss, damageEnemy, holdTheLine, maybeDropPowerUp, updateBossPhase } from "./world.js";

//The Marvel Studios card holds while the sprites load. It is dismissed
//either by the load finishing or by the player, whichever comes first —
//but never before MIN_SPLASH, or a warm cache turns the title card into a
//single flickered frame.
const MIN_SPLASH = 1500;

export function dismissSplash() {
  const splash = document.getElementById("studios-splash");
  if (!splash || splash.classList.contains("is-done")) return;
  splash.classList.add("is-done");
}

export function holdSplash(shownAt) {
  const waited = performance.now() - shownAt;
  setTimeout(dismissSplash, Math.max(0, MIN_SPLASH - waited));
}

//Numbers that tick up read as earned; numbers that appear read as given.
export function countUp(el, target, duration = 0.9, prefix = "") {
  const start = performance.now();
  function step(now) {
    const p = Math.min(1, (now - start) / (duration * 1000));
    const eased = 1 - Math.pow(1 - p, 3);
    el.innerText = prefix + Math.round(target * eased);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

window.addEventListener("load", () => {
  const shownAt = performance.now();
  const splash = document.getElementById("studios-splash");
  if (splash) splash.addEventListener("click", dismissSplash);
  document.addEventListener("keydown", dismissSplash, { once: true });

  const bar = document.querySelector("#loading-bar span");
  loadImages((progress) => {
    if (bar) bar.style.width = `${Math.round(progress * 100)}%`;
  }).then(() => {
    startBtn.disabled = false;
    startBtn.innerText = "START";
    document.getElementById("loading-bar").classList.add("is-done");
    document.body.dataset.assetsReady = "true";
    holdSplash(shownAt);
    //Last, and deliberately not awaited: the menu is already playable, and
    //the 3D behind it is worth nothing if it delays that.
    startPortal();
  });
});

//A single handle for the browser console and the smoke tests. Nothing in
//the game reads from window; this is purely an inspection door.
window.game = {
  CONFIG, HEROES, ENEMY_TYPES, WAVE_PLAN,
  sess, run, fx, world,
  enemies, bullets, enemyShots, powerUps, particles, floatTexts,
  heroes, spawnQueue, corpses, pops, boltArcs, missiles,
  img, sfx, heldKeys, audioState,
  heroDef, heroTint, playerHitbox, comboMultiplier,
  fireUlt, startWave, damageBoss, damageEnemy, throwMjolnir, resetGame,
  //Let a test step the world a frame at a time instead of waiting on
  //requestAnimationFrame, which a headless browser does not always drive.
  update, draw,
  addScore, awardLife, maybeDropPowerUp,
  holdTheLine, incursionProgress, incursionStage, speedMultiplier,
  bossPhase, updateBossPhase,
  bossForWave, summonBoss, throwShield, becomeWorthy, punch, punches,
  BOSSES, ELITE_SCHEDULE,
};
