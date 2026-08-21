import { img } from "./assets.js";
import { playSfx } from "./audio.js";
import { H, W } from "./canvas.js";
import { CONFIG } from "./config.js";
import { addShake, burst, pop, screenFlash } from "./effects.js";
import { boltArcs, bullets, enemies, particles, world } from "./state.js";
import { drawSprite, overlaps, rand, sweep } from "./util.js";
import { damageBoss, damageEnemy } from "./world.js";

//=====================================================================//
//  CAPTAIN AMERICA
//
//  The shield is his main attack, the way Mjolnir is Thor's: one in the
//  air at a time, and he cannot throw again until he catches it. Where
//  Mjolnir homes, the shield ricochets — it leaves his hand at an angle
//  and bounces off the top and bottom of the screen, so it covers ground
//  he is not aiming at.
//
//  His ultimate puts the shield down and picks up Mjolnir for fifteen
//  seconds, throwing lightning that forks into everything nearby.
//=====================================================================//

export function throwShield() {
  if (world.shield || world.player.worthy > 0) return;
  const cfg = CONFIG.shield;
  world.shield = {
    x: world.player.x + world.player.w * 0.7,
    y: world.player.y + world.player.h / 2,
    vy: world.player.throwUp ? -cfg.ricochet : cfg.ricochet,
    spin: 0,
    phase: "out",
    life: cfg.outTime,
    hits: new Set(),
  };
  world.player.throwUp = !world.player.throwUp;
  world.player.recoil = 1;
  playSfx("hammer", 0.26, 1.5);
}

function strike(s, target) {
  const cfg = CONFIG.shield;
  const key = target === world.boss ? "boss" : target.id;
  s.hits.add(key);
  burst(s.x, s.y, "#e2e8f0", 16, 300);
  pop(s.x, s.y, "#c0392b", 38);
  addShake(3);
  playSfx("hit", 0.26, 1.45);

  if (target === world.boss) {
    damageBoss(cfg.damage, s.x, s.y);
  } else {
    damageEnemy(target, cfg.damage, s.x, s.y);
    if (target.hp <= 0) sweep(enemies, (e) => e !== target);
  }
  if (s.hits.size >= cfg.maxHits) s.phase = "back";
}

export function updateShield(dt) {
  const s = world.shield;
  if (!s) return;
  const cfg = CONFIG.shield;
  s.spin += dt * 24;

  if (s.phase === "out") {
    s.life -= dt;
    s.x += cfg.speed * dt;
    s.y += s.vy * dt;
    //The bounce is the whole point of the throw
    if (s.y <= 22) {
      s.y = 22;
      s.vy = -s.vy;
      burst(s.x, s.y, "#e2e8f0", 8, 200);
      playSfx("hit", 0.14, 1.8);
    } else if (s.y >= H - 22) {
      s.y = H - 22;
      s.vy = -s.vy;
      burst(s.x, s.y, "#e2e8f0", 8, 200);
      playSfx("hit", 0.14, 1.8);
    }
    if (s.life <= 0 || s.x > W - 20) s.phase = "back";
  } else {
    const px = world.player.x + world.player.w / 2;
    const py = world.player.y + world.player.h / 2;
    const dx = px - s.x;
    const dy = py - s.y;
    const dist = Math.hypot(dx, dy) || 1;
    const step = cfg.returnSpeed * dt;
    s.x += (dx / dist) * step;
    s.y += (dy / dist) * step;
    if (dist <= step + 8) {
      burst(s.x, s.y, "#dbeafe", 10, 200);
      world.shield = null;
      return;
    }
  }

  //It hurts on the way out and on the way home alike
  const box = { x: s.x - 20, y: s.y - 20, w: 40, h: 40 };
  for (const enemy of [...enemies]) {
    if (s.hits.has(enemy.id)) continue;
    if (overlaps(box, enemy)) {
      strike(s, enemy);
      break;
    }
  }
  if (world.boss && !s.hits.has("boss") && overlaps(box, world.boss)) strike(s, world.boss);
}

export function drawShield() {
  const s = world.shield;
  if (!s) return;
  drawSprite(img.shield, s.x - 22, s.y - 22, 44, 44, { rot: s.spin, flash: 0.15 });
}

//=====================================================================//
//  WORTHY — the Endgame moment
//=====================================================================//
export function becomeWorthy() {
  world.player.worthy = CONFIG.worthy.duration;
  world.shield = null; //he puts it down
  screenFlash("#dbeafe", 0.5);
  addShake(20);
  playSfx("thunder", 0.5);
  for (let i = 0; i < 4; i++) {
    pop(world.player.x + world.player.w / 2, world.player.y + world.player.h / 2,
        "#bae6fd", 80 + i * 70);
  }
  burst(world.player.x + world.player.w / 2, world.player.y + world.player.h / 2,
        "#bae6fd", 60, 460);
}

//A bolt that pierces everything and forks into whatever it passes
export function throwLightning() {
  const cfg = CONFIG.worthy;
  world.player.cooldown = cfg.boltCooldown;
  world.player.recoil = 1;
  bullets.push({
    x: world.player.x + world.player.w - 20,
    y: world.player.y + world.player.h / 2 - 34,
    w: 128,
    h: 68,
    dmg: cfg.boltDamage,
    pierce: 99,
    struck: new Set(),
    lightning: true,
  });
  addShake(4);
  playSfx("thunder", 0.3, 1.6);
}

//Called when a worthy bolt connects: the strike forks outward
export function forkLightning(x, y) {
  const range = CONFIG.worthy.boltArcRange;
  for (const enemy of enemies) {
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + enemy.h / 2;
    if (Math.hypot(cx - x, cy - y) > range) continue;
    boltArcs.push({ from: { x, y }, to: { x: cx, y: cy }, t: 0, dur: 0.22 });
    damageEnemy(enemy, 2, cx, cy);
  }
  sweep(enemies, (e) => e.hp > 0);
}

//Crackle around him for as long as he holds the hammer
export function updateWorthy(dt) {
  if (world.player.worthy <= 0) return;
  world.player.worthy = Math.max(0, world.player.worthy - dt);
  if (Math.random() < 0.4) {
    particles.push({
      x: world.player.x + rand(0, world.player.w),
      y: world.player.y + rand(0, world.player.h),
      vx: rand(-60, 60), vy: rand(-90, 30),
      life: 0.3, maxLife: 0.3, size: rand(2, 4),
      color: Math.random() < 0.5 ? "#bae6fd" : "#ffffff",
    });
  }
  if (world.player.worthy === 0) {
    screenFlash("#dbeafe", 0.3);
    pop(world.player.x + world.player.w / 2, world.player.y + world.player.h / 2, "#bae6fd", 120);
  }
}
