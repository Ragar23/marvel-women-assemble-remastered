import { img } from "./assets.js";
import { playSfx } from "./audio.js";
import { H, W } from "./canvas.js";
import { CONFIG } from "./config.js";
import { addShake, burst } from "./effects.js";
import { forkLightning } from "./shield.js";
import { enemies, particles, playerHitbox, world } from "./state.js";
import { clamp, drawSprite, overlaps, rand, sweep } from "./util.js";
import { damageBoss, damageEnemy } from "./world.js";

//=====================================================================//
export function throwMjolnir() {
  if (world.mjolnir) return; //it has to come back before it can go out again
  const cfg = CONFIG.mjolnir;
  world.player.cooldown = 0.1;
  world.player.recoil = 1;
  world.mjolnir = {
    x: world.player.x + world.player.w * 0.7,
    y: world.player.y + world.player.h / 2,
    w: 54,
    h: 48,
    angle: 0,
    spin: 0,
    phase: "out",
    life: cfg.outTime,
    hits: new Set(),
  };
  playSfx("hammer", 0.3, 1.15);
  burst(world.mjolnir.x, world.mjolnir.y, "#cfd8e8", 8, 200);
}

export function mjolnirStrike(target) {
  const cfg = CONFIG.mjolnir;
  //In Cap's hands every strike throws lightning outward as well
  if (world.player.worthy > 0) forkLightning(world.mjolnir.x, world.mjolnir.y);
  burst(world.mjolnir.x, world.mjolnir.y, "#dbeafe", 20, 340);
  addShake(4);
  playSfx("hammer", 0.32, rand(0.85, 1.05));

  if (target === world.boss) {
    world.mjolnir.hits.add("boss");
    damageBoss(cfg.damage, world.mjolnir.x, world.mjolnir.y);
  } else {
    world.mjolnir.hits.add(target.id);
    damageEnemy(target, cfg.damage, world.mjolnir.x, world.mjolnir.y);
    if (target.hp <= 0) sweep(enemies, (e) => e !== target);
  }
  if (world.mjolnir.hits.size >= cfg.maxHits) world.mjolnir.phase = "back";
}

export function updateMjolnir(dt) {
  if (!world.mjolnir) return;
  const cfg = CONFIG.mjolnir;
  const m = world.mjolnir;
  m.spin += dt * 22; //it tumbles end over end

  let aim = null;
  if (m.phase === "out") {
    m.life -= dt;
    //Only chase what it has not already struck
    let best = null;
    let bestDist = Infinity;
    const candidates = world.boss && !m.hits.has("boss") ? [...enemies, world.boss] : enemies;
    for (const c of candidates) {
      if (c.id !== undefined && m.hits.has(c.id)) continue;
      const dx = c.x + c.w / 2 - m.x;
      const dy = c.y + c.h / 2 - m.y;
      if (dx < -80) continue;
      const d = dx * dx + dy * dy;
      if (d < bestDist) { bestDist = d; best = c; }
    }
    if (!best || m.life <= 0) m.phase = "back";
    else aim = { x: best.x + best.w / 2, y: best.y + best.h / 2 };
  }

  if (m.phase === "back") {
    aim = { x: world.player.x + world.player.w / 2, y: world.player.y + world.player.h / 2 };
  }

  if (aim) {
    const want = Math.atan2(aim.y - m.y, aim.x - m.x);
    let diff = want - m.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    m.angle += clamp(diff, -cfg.turn * dt, cfg.turn * dt);
  }

  const speed = m.phase === "back" ? cfg.returnSpeed : cfg.speed;
  m.x += Math.cos(m.angle) * speed * dt;
  m.y += Math.sin(m.angle) * speed * dt;

  //A trail of sparks, so the flight path reads
  if (Math.random() < 0.7) {
    particles.push({
      x: m.x, y: m.y,
      vx: rand(-40, 40), vy: rand(-40, 40),
      life: 0.25, maxLife: 0.25, size: rand(2, 4),
      color: Math.random() < 0.5 ? "#dbeafe" : "#7dd3fc",
    });
  }

  //It hurts on the way out and on the way home alike
  const box = { x: m.x - 22, y: m.y - 20, w: 44, h: 40 };
  for (const enemy of [...enemies]) {
    if (m.hits.has(enemy.id)) continue;
    if (overlaps(box, enemy)) { mjolnirStrike(enemy); break; }
  }
  if (world.boss && !m.hits.has("boss") && overlaps(box, world.boss)) mjolnirStrike(world.boss);

  //Caught: he can throw again
  if (m.phase === "back" && overlaps(box, playerHitbox())) {
    burst(m.x, m.y, "#cfd8e8", 10, 220);
    world.mjolnir = null;
    return;
  }
  //Never let it strand itself off screen
  if (m.x < -200 || m.x > W + 300 || m.y < -200 || m.y > H + 200) {
    m.phase = "back";
  }
}

export function drawMjolnir() {
  if (!world.mjolnir) return;
  drawSprite(
    img.mjolnir,
    world.mjolnir.x - world.mjolnir.w / 2,
    world.mjolnir.y - world.mjolnir.h / 2,
    world.mjolnir.w,
    world.mjolnir.h,
    { rot: world.mjolnir.spin, flash: 0.25 }
  );
}

