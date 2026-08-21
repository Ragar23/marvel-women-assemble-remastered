import { fireUlt } from "./abilities.js";
import { img, loadImages } from "./assets.js";
import { sfx } from "./audio.js";
import { BOSSES, CONFIG, ELITE_SCHEDULE, ENEMY_TYPES, HEROES, WAVE_PLAN } from "./config.js";
import { startBtn } from "./dom.js";
import { heldKeys } from "./input.js";
import { throwMjolnir } from "./mjolnir.js";
import { becomeWorthy, punch, throwShield } from "./shield.js";
import { boltArcs, bullets, comboMultiplier, corpses, enemies, enemyShots, floatTexts, fx, heroDef, heroTint, heroes, missiles, particles, playerHitbox, pops, powerUps, punches, resetGame, run, sess, spawnQueue, world } from "./state.js";
import { bossForWave, startWave, summonBoss } from "./waves.js";
import { damageBoss, damageEnemy } from "./world.js";

export function splitTitle() {
  const title = document.querySelector(".game-title");
  if (!title) return;
  const text = title.textContent;
  title.textContent = "";
  [...text].forEach((character, i) => {
    const span = document.createElement("span");
    span.className = "ch";
    span.style.setProperty("--i", i);
    span.textContent = character;
    title.appendChild(span);
  });
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
  splitTitle();
  const bar = document.querySelector("#loading-bar span");
  loadImages((progress) => {
    if (bar) bar.style.width = `${Math.round(progress * 100)}%`;
  }).then(() => {
    startBtn.disabled = false;
    startBtn.innerText = "START";
    document.getElementById("loading-bar").classList.add("is-done");
    document.body.dataset.assetsReady = "true";
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
  bossForWave, summonBoss, throwShield, becomeWorthy, punch, punches,
  BOSSES, ELITE_SCHEDULE,
};
