import { fireUlt } from "./abilities.js";
import { img, loadImages } from "./assets.js";
import { sfx } from "./audio.js";
import { BOSSES, CONFIG, ELITE_SCHEDULE, ENEMY_TYPES, HEROES, WAVE_PLAN } from "./config.js";
import { startBtn } from "./dom.js";
import { heldKeys } from "./input.js";
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

//Avengers: Doomsday, 18 December 2026. One constant to change if it moves.
const RELEASE = new Date("2026-12-18T00:00:00Z");

//Counts whole calendar months first, then the remainder as days, so the
//clock reads the way the teaser's does.
function updateCountdown() {
  const el = document.getElementById("countdown");
  if (!el) return;
  const now = new Date();
  let diff = RELEASE - now;
  if (diff <= 0) {
    el.classList.add("is-out");
    for (const span of el.querySelectorAll("[data-unit]")) span.textContent = "00";
    return;
  }
  let months = 0;
  const probe = new Date(now.getTime());
  while (true) {
    const next = new Date(probe.getTime());
    next.setMonth(next.getMonth() + 1);
    if (next > RELEASE) break;
    probe.setTime(next.getTime());
    months++;
  }
  diff = RELEASE - probe;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, "0");
  const values = { months, days, hours, minutes, seconds };
  for (const span of el.querySelectorAll("[data-unit]")) {
    span.textContent = pad(values[span.dataset.unit]);
  }
}

window.addEventListener("load", () => {
  updateCountdown();
  setInterval(updateCountdown, 1000);

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
  });
});

//A single handle for the browser console and the smoke tests. Nothing in
//the game reads from window; this is purely an inspection door.
window.game = {
  CONFIG, HEROES, ENEMY_TYPES, WAVE_PLAN,
  sess, run, fx, world,
  enemies, bullets, enemyShots, powerUps, particles, floatTexts,
  heroes, spawnQueue, corpses, pops, boltArcs, missiles,
  img, sfx, heldKeys,
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
