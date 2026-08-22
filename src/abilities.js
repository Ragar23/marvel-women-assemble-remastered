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
    //Red, because it is his optic blast and nothing else — the overload
    //only widens what the visor already does.
    world.player.ignition = CONFIG.ult.ignitionDuration;
    screenFlash(heroTint(), 0.38);
    addShake(16);
    burst(world.player.x + world.player.w / 2, world.player.y + world.player.h / 2, heroTint(), 50, 420);
  } else if (kind === "pantherblast") {
    //Shuri: kinetic energy dumped back out in one purple shockwave — and
    //what the suit cannot spend in that instant stays wrapped around her.
    world.player.panther = CONFIG.ult.pantherDuration;
    screenFlash("#c084fc", 0.45);
    addShake(20);
    for (let i = 0; i < 5; i++) {
      pop(world.player.x + world.player.w / 2, world.player.y + world.player.h / 2,
          "#c084fc", 110 + i * 90);
    }
    burst(world.player.x + world.player.w / 2, world.player.y + world.player.h / 2,
          "#c084fc", 70, 520);
    for (const enemy of [...enemies]) {
      damageEnemy(enemy, 999, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
    }
    enemies.length = 0;
    if (world.boss) damageBoss(28, world.boss.x, world.boss.y + world.boss.h / 2);
  } else if (kind === "flameon") {
    //Johnny goes up: everything on screen burns, and he stays alight
    world.player.worthy = CONFIG.worthy.duration;
    screenFlash("#ff8a3d", 0.5);
    addShake(22);
    burst(world.player.x + world.player.w / 2, world.player.y + world.player.h / 2,
          "#ff8a3d", 80, 560);
    for (const enemy of [...enemies]) {
      damageEnemy(enemy, 999, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
    }
    enemies.length = 0;
    if (world.boss) damageBoss(22, world.boss.x, world.boss.y + world.boss.h / 2);
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

//Where Stormbreaker sits in his hand, which is where a bolt earthed through
//it has to start. Measured off the sprite: the axe is up and out on his
//left, so the arc leaves from above his shoulder rather than his chest.
export function weaponPoint() {
  return {
    x: world.player.x + world.player.w * 0.78,
    y: world.player.y + world.player.h * 0.34,
  };
}

//Stormbreaker's attack. One bolt earths through the axe into whatever is
//nearest, then jumps from that to the next thing along — so a line of
//sentinels goes down together and a straggler on its own does not.
export function stormStrike() {
  const cfg = CONFIG.storm;
  world.player.cooldown = cfg.cooldown;
  world.player.recoil = 1;
  playSfx("thunder", 0.28, 1.35);
  addShake(3);

  const struck = [];
  let from = weaponPoint();
  const pool = world.boss ? [...enemies, world.boss] : [...enemies];

  for (let i = 0; i < cfg.chain; i++) {
    let best = null;
    let bestDist = cfg.range * cfg.range;
    for (const c of pool) {
      if (struck.includes(c)) continue;
      const dx = c.x + c.w / 2 - from.x;
      const dy = c.y + c.h / 2 - from.y;
      //Only forward: a bolt that turns back past his shoulder looks wrong
      //and would let him farm things he has already walked away from.
      if (dx < -40) continue;
      const d = dx * dx + dy * dy;
      if (d < bestDist) { bestDist = d; best = c; }
    }
    if (!best) break;
    const to = { x: best.x + best.w / 2, y: best.y + best.h / 2 };
    boltArcs.push({
      //Only the first link is tethered to the axe; the rest hang off the
      //body they jumped from, and those do not move once drawn.
      fromWeapon: i === 0,
      from,
      to,
      t: 0,
      dur: cfg.arcTime,
      bold: true,
    });
    burst(to.x, to.y, "#e0f2fe", 12, 260);
    if (best === world.boss) damageBoss(cfg.damage, to.x, to.y);
    else damageEnemy(best, cfg.damage, to.x, to.y);
    struck.push(best);
    from = to;
  }
  sweep(enemies, (e) => e.hp > 0);

  //Nothing in reach still earths, straight down the lane, so holding S
  //always reads as doing something.
  if (!struck.length) {
    boltArcs.push({
      fromWeapon: true,
      from: weaponPoint(),
      to: { x: W, y: world.player.y + world.player.h * 0.34 },
      t: 0,
      dur: cfg.arcTime,
      bold: true,
    });
  }
}

//The God Blast. It used to chip seven off everything on screen; now the sky
//goes out and every one of them takes a strike out of the dark.
export function godBlast() {
  screenFlash("#ffffff", 0.65);
  addShake(26);
  fx.slowMo = 0.6;
  fx.storm = CONFIG.ult.stormDuration;
  boltArcs.length = 0;
  missiles.length = 0;
  world.mjolnir = null;

  for (const enemy of [...enemies]) {
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + enemy.h / 2;
    //Down out of the sky rather than out from him, and each one staggered a
    //little so the wave is struck in a ragged sweep instead of all at once.
    boltArcs.push({
      from: { x: cx + rand(-50, 50), y: -60 },
      to: { x: cx, y: cy },
      t: -rand(0, 0.28),
      dur: 0.75,
      bold: true,
    });
    burst(cx, cy, "#7dd3fc", 24, 380);
    pop(cx, cy, "#e0f2fe", 70);
    damageEnemy(enemy, CONFIG.ult.godBlastDamage, cx, cy);
  }
  enemies.length = 0;

  if (world.boss) {
    const bx = world.boss.x + world.boss.w / 2;
    const by = world.boss.y + world.boss.h / 2;
    //Three at once on the boss: he does not die to it, he is pinned by it
    for (let i = 0; i < 3; i++) {
      boltArcs.push({
        from: { x: bx + rand(-90, 90), y: -60 },
        to: { x: bx + rand(-30, 30), y: by },
        t: -i * 0.12,
        dur: 0.8,
        bold: true,
      });
    }
    damageBoss(CONFIG.ult.stormBossDamage, bx, by);
  }
}

//The lane-clearing beam is a moving hitbox, so it needs updating per frame.
//It is the same beam the visor fires normally, so it is centred on the
//visor rather than the chest and it burns in his own colour.
export function ignitionBeam() {
  const h = world.player.h * CONFIG.ult.ignitionWidth;
  return {
    x: world.player.x + world.player.w,
    y: world.player.y + world.player.h * (0.5 + (heroDef().barrels || [0])[0]) - h / 2,
    w: W,
    h,
  };
}

export function updateIgnition(dt) {
  if (world.player.ignition <= 0) return;
  world.player.ignition = Math.max(0, world.player.ignition - dt);

  const beam = ignitionBeam();
  for (const enemy of [...enemies]) {
    if (!overlaps(enemy, beam)) continue;
    burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, heroTint(), 14, 300);
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

//Shuri's leftover charge. It shields her the way Johnny's flame does —
//nothing survives closing on her while it is lit — and sheds sparks so the
//field reads as energy rather than a drawn circle.
export function updatePanther(dt) {
  if (world.player.panther <= 0) return;
  world.player.panther = Math.max(0, world.player.panther - dt);

  const cx = world.player.x + world.player.w / 2;
  const cy = world.player.y + world.player.h / 2;
  world.player.invuln = Math.max(world.player.invuln, 0.1);

  const field = {
    x: cx - world.player.w * 0.95,
    y: cy - world.player.h * 0.95,
    w: world.player.w * 1.9,
    h: world.player.h * 1.9,
  };
  for (const enemy of [...enemies]) {
    if (!overlaps(enemy, field)) continue;
    burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#c084fc", 16, 320);
    damageEnemy(
      enemy,
      CONFIG.ult.pantherContactDamage,
      enemy.x + enemy.w / 2,
      enemy.y + enemy.h / 2
    );
  }
  sweep(enemies, (e) => e.hp > 0);

  //A slow drip of sparks, not a burst per frame, or the field turns solid
  if (Math.random() < dt * 34) {
    const a = rand(0, Math.PI * 2);
    const r = world.player.w * 0.75;
    particles.push({
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r,
      vx: Math.cos(a) * rand(40, 130),
      vy: Math.sin(a) * rand(40, 130),
      life: 0.5,
      maxLife: 0.5,
      size: rand(2, 5),
      color: Math.random() < 0.5 ? "#c084fc" : "#e9d5ff",
    });
  }
}

//=====================================================================//
//  INPUT
