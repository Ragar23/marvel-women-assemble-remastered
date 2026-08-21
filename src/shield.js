import { img } from "./assets.js";
import { playSfx } from "./audio.js";
import { CONFIG } from "./config.js";
import { addShake, burst, pop } from "./effects.js";
import { enemies, particles, world } from "./state.js";
import { drawSprite, rand, sweep } from "./util.js";
import { damageBoss, damageEnemy } from "./world.js";

//=====================================================================//
//  CAPTAIN AMERICA'S SHIELD
//
//  The ultimate is a ricochet: the shield dashes in straight lines from
//  one enemy to the next, picking the nearest it has not already struck,
//  then comes home. Mjolnir arcs toward a single target and carries three
//  hits; this chains through a dozen and never curves.
//=====================================================================//

export function throwShieldStorm() {
  if (world.shield) return;
  world.shield = {
    x: world.player.x + world.player.w * 0.7,
    y: world.player.y + world.player.h / 2,
    spin: 0,
    hops: 0,
    hits: new Set(),
    target: null,
    returning: false,
  };
  playSfx("hammer", 0.35, 1.4);
  burst(world.shield.x, world.shield.y, "#dbeafe", 12, 240);
  addShake(6);
}

function nextLink(s) {
  let best = null;
  let bestDist = Infinity;
  const candidates = world.boss && !s.hits.has("boss") ? [...enemies, world.boss] : enemies;
  for (const c of candidates) {
    const key = c === world.boss ? "boss" : c.id;
    if (s.hits.has(key)) continue;
    const dx = c.x + c.w / 2 - s.x;
    const dy = c.y + c.h / 2 - s.y;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

function strike(s, target) {
  const cfg = CONFIG.shield;
  const key = target === world.boss ? "boss" : target.id;
  s.hits.add(key);
  s.hops++;
  burst(s.x, s.y, "#e2e8f0", 18, 320);
  pop(s.x, s.y, "#c0392b", 40);
  addShake(3);
  playSfx("hit", 0.3, 1.4);

  if (target === world.boss) {
    damageBoss(cfg.damage, s.x, s.y);
  } else {
    damageEnemy(target, cfg.damage, s.x, s.y);
    if (target.hp <= 0) sweep(enemies, (e) => e !== target);
  }
  if (s.hops >= cfg.maxHops) s.returning = true;
  s.target = null;
}

export function updateShieldStorm(dt) {
  const s = world.shield;
  if (!s) return;
  const cfg = CONFIG.shield;
  s.spin += dt * 26;

  //Re-target every frame the shield is between links
  if (!s.returning) {
    if (!s.target || s.target.hp <= 0 || (s.target !== world.boss && !enemies.includes(s.target))) {
      s.target = nextLink(s);
    }
    if (!s.target) s.returning = true;
  }

  const aim = s.returning
    ? { x: world.player.x + world.player.w / 2, y: world.player.y + world.player.h / 2 }
    : { x: s.target.x + s.target.w / 2, y: s.target.y + s.target.h / 2 };

  //Straight-line dashes, not curves: that is what makes it read as a ricochet
  const dx = aim.x - s.x;
  const dy = aim.y - s.y;
  const dist = Math.hypot(dx, dy) || 1;
  const step = cfg.speed * dt;
  s.x += (dx / dist) * step;
  s.y += (dy / dist) * step;

  if (Math.random() < 0.8) {
    particles.push({
      x: s.x, y: s.y,
      vx: rand(-40, 40), vy: rand(-40, 40),
      life: 0.22, maxLife: 0.22, size: rand(2, 4),
      color: Math.random() < 0.5 ? "#e2e8f0" : "#c0392b",
    });
  }

  if (dist <= step + 6) {
    if (s.returning) {
      burst(s.x, s.y, "#dbeafe", 12, 220);
      world.shield = null;
      return;
    }
    strike(s, s.target);
  }
}

export function drawShieldStorm() {
  const s = world.shield;
  if (!s) return;
  drawSprite(img.shield, s.x - 22, s.y - 22, 44, 44, { rot: s.spin, flash: 0.2 });
}
