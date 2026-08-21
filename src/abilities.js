import { playSfx } from "./audio.js";
import { H, W, ctx } from "./canvas.js";
import { CONFIG } from "./config.js";
import { addShake, burst, pop, screenFlash } from "./effects.js";
import { becomeWorthy } from "./shield.js";
import { boltArcs, enemies, fx, heroDef, heroTint, missiles, particles, world } from "./state.js";
import { clamp, overlaps, rand, sweep } from "./util.js";
import { banner } from "./waves.js";
import { damageBoss, damageEnemy } from "./world.js";

//=====================================================================//
export function chargeUlt(amount) {
  if (!world.player) return;
  world.player.charge = Math.min(CONFIG.ult.max, world.player.charge + amount);
}

export function ultReady() {
  return world.player && world.player.charge >= CONFIG.ult.max;
}

//Wanda's hex slows the whole battlefield; everything that moves reads this.
export function enemySpeedScale() {
  return world.player && world.player.hex > 0 ? CONFIG.ult.hexSlow : 1;
}

export function fireUlt() {
  if (!ultReady()) return;
  world.player.charge = 0;
  const kind = heroDef().ult;
  banner(heroDef().ultName, "", heroTint());
  playSfx(kind === "godblast" ? "thunder" : "ultimate", 0.45);

  if (kind === "hex") {
    world.player.hex = CONFIG.ult.hexDuration;
    screenFlash("#e0457b", 0.4);
    addShake(14);
    //A ring of chaos energy thrown outward from her
    for (let i = 0; i < 5; i++) {
      pop(world.player.x + world.player.w / 2, world.player.y + world.player.h / 2, "#e0457b", 90 + i * 70);
    }
    burst(world.player.x + world.player.w / 2, world.player.y + world.player.h / 2, "#e0457b", 60, 460);
  } else if (kind === "ignition") {
    world.player.ignition = CONFIG.ult.ignitionDuration;
    screenFlash("#f0b323", 0.38);
    addShake(16);
    burst(world.player.x + world.player.w / 2, world.player.y + world.player.h / 2, "#f0b323", 50, 420);
  } else if (kind === "worthy") {
    becomeWorthy();
  } else if (kind === "barrage") {
    launchBarrage();
  } else {
    //God Blast: lightning arcs to everything on screen at once
    godBlast();
  }
}

//Iron Man's barrage: missiles burst outward first, then turn and hunt. The
//initial spread is what makes it read as a swarm rather than a shotgun.
export function launchBarrage() {
  screenFlash("#f0b323", 0.3);
  addShake(12);
  const n = CONFIG.ult.missileCount;
  for (let i = 0; i < n; i++) {
    const spread = (i / (n - 1) - 0.5) * Math.PI * 0.8;
    missiles.push({
      x: world.player.x + world.player.w * 0.6,
      y: world.player.y + world.player.h / 2,
      angle: spread,
      speed: CONFIG.ult.missileSpeed,
      life: CONFIG.ult.missileLife,
      //Stagger the launch so they pour out instead of appearing at once
      delay: i * 0.035,
      smoke: 0,
    });
  }
}

export function nearestTarget(m) {
  let best = null;
  let bestDist = Infinity;
  const candidates = world.boss ? [...enemies, world.boss] : enemies;
  for (const c of candidates) {
    const dx = c.x + c.w / 2 - m.x;
    const dy = c.y + c.h / 2 - m.y;
    //Only hunt what is still ahead; a missile should not turn back on itself
    if (dx < -60) continue;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

export function updateMissiles(dt) {
  for (const m of missiles) {
    if (m.delay > 0) {
      m.delay -= dt;
      continue;
    }
    m.life -= dt;

    const target = nearestTarget(m);
    if (target) {
      const want = Math.atan2(
        target.y + target.h / 2 - m.y,
        target.x + target.w / 2 - m.x
      );
      //Steer by the shortest way round, capped by the turn rate
      let diff = want - m.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      m.angle += clamp(diff, -CONFIG.ult.missileTurn * dt, CONFIG.ult.missileTurn * dt);
    }

    m.x += Math.cos(m.angle) * m.speed * dt;
    m.y += Math.sin(m.angle) * m.speed * dt;

    m.smoke -= dt;
    if (m.smoke <= 0) {
      m.smoke = 0.02;
      particles.push({
        x: m.x,
        y: m.y,
        vx: rand(-30, 30),
        vy: rand(-30, 30),
        life: 0.3,
        maxLife: 0.3,
        size: rand(2, 4),
        color: Math.random() < 0.5 ? "#f0b323" : "#9aa3b2",
      });
    }

    const hitbox = { x: m.x - 7, y: m.y - 7, w: 14, h: 14 };
    if (target && overlaps(hitbox, target)) {
      detonate(m, target);
      continue;
    }
    if (m.x > W + 80 || m.y < -80 || m.y > H + 80) m.life = 0;
  }
  sweep(missiles, (m) => m.life > 0 && !m.spent);
}

export function detonate(m, target) {
  m.spent = true;
  burst(m.x, m.y, "#ffb347", 16, 320);
  pop(m.x, m.y, "#f0b323", 46);
  addShake(2);
  if (target === world.boss) {
    damageBoss(CONFIG.ult.missileDamage, m.x, m.y);
  } else {
    damageEnemy(target, CONFIG.ult.missileDamage, m.x, m.y);
    if (target.hp <= 0) sweep(enemies, (e) => e !== target);
  }
}

export function drawMissiles() {
  for (const m of missiles) {
    if (m.delay > 0) continue;
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.angle);
    ctx.fillStyle = "#d7dbe4";
    ctx.fillRect(-9, -3, 14, 6);
    ctx.fillStyle = "#c02630";
    ctx.fillRect(3, -3, 5, 6);
    //Exhaust, flickering so it reads as thrust
    ctx.fillStyle = "#f0b323";
    ctx.globalAlpha = 0.6 + Math.random() * 0.4;
    ctx.fillRect(-14 - Math.random() * 6, -2, 6, 4);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

export function godBlast() {
  screenFlash("#ffffff", 0.5);
  addShake(26);
  fx.slowMo = 0.5;
  const from = { x: world.player.x + world.player.w, y: world.player.y + world.player.h / 2 };
  boltArcs.length = 0;
  missiles.length = 0;
  world.mjolnir = null;

  for (const enemy of [...enemies]) {
    boltArcs.push({
      from,
      to: { x: enemy.x + enemy.w / 2, y: enemy.y + enemy.h / 2 },
      t: 0,
      dur: 0.45,
    });
    burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#7dd3fc", 18, 320);
    damageEnemy(
      enemy,
      CONFIG.ult.godBlastDamage,
      enemy.x + enemy.w / 2,
      enemy.y + enemy.h / 2
    );
  }
  sweep(enemies, (e) => e.hp > 0);

  if (world.boss) {
    boltArcs.push({
      from,
      to: { x: world.boss.x + world.boss.w / 2, y: world.boss.y + world.boss.h / 2 },
      t: 0,
      dur: 0.45,
    });
    damageBoss(CONFIG.ult.godBlastDamage * 5, world.boss.x, world.boss.y + world.boss.h / 2);
  }
}

//The lane-clearing beam is a moving hitbox, so it needs updating per frame.
export function updateIgnition(dt) {
  if (world.player.ignition <= 0) return;
  world.player.ignition = Math.max(0, world.player.ignition - dt);

  const beam = {
    x: world.player.x + world.player.w,
    y: world.player.y + world.player.h * 0.18,
    w: W,
    h: world.player.h * 0.64,
  };
  for (const enemy of [...enemies]) {
    if (!overlaps(enemy, beam)) continue;
    burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#f0b323", 14, 300);
    damageEnemy(
      enemy,
      CONFIG.ult.ignitionDamage,
      enemy.x + enemy.w / 2,
      enemy.y + enemy.h / 2
    );
  }
  sweep(enemies, (e) => e.hp > 0);
  if (world.boss && overlaps(world.boss, beam)) damageBoss(dt * 26, world.boss.x, world.boss.y + world.boss.h / 2);
}

//=====================================================================//
//  INPUT
