import { img } from "./assets.js";
import { playSfx } from "./audio.js";
import { H, W, ctx } from "./canvas.js";
import { CONFIG } from "./config.js";
import { addShake, burst, pop, screenFlash } from "./effects.js";
import { boltArcs, enemies, heroDef, particles, punches, world } from "./state.js";
import { clamp, drawSprite, overlaps, rand, sweep } from "./util.js";
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
    //A heading rather than a plain vertical speed, so it can steer and
    //reflect at the same time.
    angle: world.player.throwUp ? -cfg.launchAngle : cfg.launchAngle,
    spin: 0,
    phase: "out",
    life: cfg.outTime,
    bounces: 0,
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

    //Steer toward whatever it has not hit yet, the way Mjolnir does.
    //Steering alone missed nearly everything; bouncing alone was luck.
    let best = null;
    let bestDist = Infinity;
    for (const e of enemies) {
      if (s.hits.has(e.id)) continue;
      const dx = e.x + e.w / 2 - s.x;
      if (dx < -40) continue;
      const d = Math.hypot(dx, e.y + e.h / 2 - s.y);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    if (best) {
      const want = Math.atan2(best.y + best.h / 2 - s.y, best.x + best.w / 2 - s.x);
      let diff = want - s.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      s.angle += clamp(diff, -cfg.turn * dt, cfg.turn * dt);
    }
    //Never let it flatten out: it has to keep crossing the screen. Working
    //on the vertical component keeps this correct once it turns for home.
    const vy = Math.sin(s.angle);
    if (Math.abs(vy) < cfg.minSin) {
      const up = vy >= 0 ? 1 : -1;
      const fwd = Math.cos(s.angle) >= 0 ? 1 : -1;
      s.angle = Math.atan2(up * cfg.minSin, fwd * Math.sqrt(1 - cfg.minSin ** 2));
    }

    s.x += Math.cos(s.angle) * cfg.speed * dt;
    s.y += Math.sin(s.angle) * cfg.speed * dt;

    //It bounces off the far side too and zig-zags back, so a throw sweeps
    //the screen twice rather than making one diagonal pass.
    if (s.x >= W - 24 && Math.cos(s.angle) > 0) {
      s.x = W - 24;
      s.angle = Math.PI - s.angle;
      s.bounces++;
      burst(s.x, s.y, "#e2e8f0", 12, 240);
      addShake(2);
      playSfx("hit", 0.15, 1.7);
    }

    //Reflecting off the top and bottom is the whole point of the throw
    if (s.y <= 22 || s.y >= H - 22) {
      s.y = s.y <= 22 ? 22 : H - 22;
      s.angle = -s.angle;
      s.bounces++;
      burst(s.x, s.y, "#e2e8f0", 10, 220);
      addShake(2);
      playSfx("hit", 0.15, 1.9);
    }
    //Home once it has swept back level with him, or when the flight is spent
    if (s.life <= 0 || (Math.cos(s.angle) < 0 && s.x < world.player.x + world.player.w)) {
      s.phase = "back";
    }
  } else {
    //Home to his hand; he cannot throw again until he catches it
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
  const box = { x: s.x - 27, y: s.y - 27, w: 54, h: 54 };
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
  const sprite = img.shield || img[heroDef().bullet];
  if (!sprite) return;
  drawSprite(sprite, s.x - 22, s.y - 22, 44, 44, { rot: s.spin, flash: 0.15 });
}

//=====================================================================//
//  CLOSE COMBAT
//
//  With the shield in the air he is not unarmed — he closes in. The reach
//  is short on purpose: it fills the window where he would otherwise have
//  nothing to do, and it costs him the safety of range to use it.
//=====================================================================//
export function punch() {
  const cfg = CONFIG.punch;
  world.player.cooldown = cfg.cooldown;
  world.player.recoil = 1;
  world.player.punchHand = 1 - world.player.punchHand;

  const box = {
    x: world.player.x + world.player.w * 0.55,
    y: world.player.y + (world.player.h * (1 - cfg.height)) / 2,
    w: cfg.reach,
    h: world.player.h * cfg.height,
  };

  let landed = 0;
  for (const enemy of [...enemies]) {
    if (!overlaps(box, enemy)) continue;
    landed++;
    //Shoved back, so a connected punch buys him room
    enemy.x += cfg.knockback * 0.06;
    enemy.knock = 0.18;
    damageEnemy(enemy, cfg.damage, enemy.x, enemy.y + enemy.h / 2);
  }
  sweep(enemies, (e) => e.hp > 0);

  if (world.boss && overlaps(box, world.boss)) {
    landed++;
    damageBoss(cfg.damage, world.boss.x, world.boss.y + world.boss.h / 2);
  }

  punches.push({
    x: box.x + box.w * 0.75,
    y: world.player.y + world.player.h * (world.player.punchHand ? 0.38 : 0.62),
    t: 0,
    dur: 0.16,
    hit: landed > 0,
  });

  if (landed) {
    addShake(5);
    playSfx("hit", 0.34, 0.75);
    burst(box.x + box.w, world.player.y + world.player.h / 2, "#f2f4f8", 14, 260);
  } else {
    playSfx("shoot", 0.1, 0.6);
  }
  return landed > 0;
}

export function updatePunches(dt) {
  for (const s of punches) s.t += dt;
  sweep(punches, (s) => s.t < s.dur);
}

//A short arc sweeping out from his fist, brighter when it connects
export function drawPunches() {
  for (const s of punches) {
    const k = s.t / s.dur;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = s.hit ? "#ffffff" : "rgba(226,232,240,.7)";
    ctx.lineWidth = s.hit ? 6 : 3;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 26 + k * 46, -0.9, 0.9);
    ctx.stroke();
    ctx.restore();
  }
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

//Every Mjolnir strike he lands throws lightning into everything nearby
export function forkLightning(x, y) {
  const range = CONFIG.worthy.forkRange;
  for (const enemy of enemies) {
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + enemy.h / 2;
    if (Math.hypot(cx - x, cy - y) > range) continue;
    boltArcs.push({ from: { x, y }, to: { x: cx, y: cy }, t: 0, dur: 0.22 });
    damageEnemy(enemy, CONFIG.worthy.forkDamage, cx, cy);
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
