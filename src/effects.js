import { CONFIG } from "./config.js";
import { corpses, floatTexts, fx, particles, pops } from "./state.js";
import { rand } from "./util.js";

//=====================================================================//
export function burst(x, y, color, count, power) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(60, power);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(0.3, 0.8),
      maxLife: 0.8,
      size: rand(2, 5),
      color,
    });
  }
}

//A killed enemy hands its sprite to a corpse that spins, grows and fades,
//so a kill reads as an event rather than a disappearance.
export function spawnCorpse(enemy, sprite) {
  corpses.push({
    sprite,
    x: enemy.x,
    y: enemy.y,
    w: enemy.w,
    h: enemy.h,
    t: 0,
    dur: CONFIG.anim.deathTime,
    spin: rand(-2.6, 2.6),
    driftX: -enemy.speed * 0.35,
    driftY: rand(-70, 70),
  });
}

//An expanding ring, used wherever something is collected or detonates.
export function pop(x, y, color, radius) {
  pops.push({ x, y, color, r: radius, t: 0, dur: 0.35 });
}

export function floatText(x, y, text, color) {
  floatTexts.push({ x, y, text, color, life: 1 });
}

export function addShake(amount) {
  fx.shake = Math.min(26, fx.shake + amount);
}

export function screenFlash(color, strength) {
  fx.flash = { color, alpha: strength };
}

//=====================================================================//
//  ULTIMATES
