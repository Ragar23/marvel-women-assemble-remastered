import { chargeUlt, enemySpeedScale } from "./abilities.js";
import { playSfx } from "./audio.js";
import { H, W } from "./canvas.js";
import { CONFIG } from "./config.js";
import { addShake, burst, floatText, pop, screenFlash, spawnCorpse } from "./effects.js";
import { enemySprite } from "./render.js";
import { boltArcs, bullets, comboMultiplier, corpses, enemies, enemyShots, floatTexts, fx, heroes, incursionStage, particles, playerHitbox, pops, powerUps, run, spawnQueue, world } from "./state.js";
import { clamp, overlaps, rand, replaceAll, sweep } from "./util.js";
import { banner, spawnEnemy } from "./waves.js";

export function updateSpawning(dt) {
  while (spawnQueue.length && spawnQueue[0].at <= run.waveElapsed) {
    spawnEnemy(spawnQueue.shift().type);
  }
}

export function damageEnemy(enemy, amount, hitX, hitY) {
  //Cull Obsidian's plating soaks most of a hit until it is broken open
  if (enemy.def.behaviour === "armour" && !enemy.cracked) {
    enemy.plating = (enemy.plating || enemy.def.armourHp) - amount;
    if (enemy.plating > 0) {
      enemy.hitFlash = 0.12;
      burst(hitX, hitY, "#fde68a", 6, 200);
      playSfx("hit", 0.2, 0.55);
      return false;
    }
    enemy.cracked = true;
    burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#fbbf24", 30, 400);
    addShake(7);
    floatText(enemy.x + enemy.w / 2, enemy.y, "ARMOUR BROKEN", "#fbbf24");
  }
  enemy.hp -= amount;
  enemy.hitFlash = 0.12;
  if (enemy.hp > 0) {
    burst(hitX, hitY, "#ffd27f", 5, 180);
    playSfx("hit", 0.18, rand(0.9, 1.15));
    return false;
  }
  playSfx("explode", 0.22, rand(0.9, 1.2));

  run.combo++;
  run.bestCombo = Math.max(run.bestCombo, comboMultiplier());
  run.kills++;
  const gained = enemy.def.points * comboMultiplier();
  addScore(gained);
  burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ff8a3d", 22, 340);
  floatText(enemy.x + enemy.w / 2, enemy.y, `+${gained}`, "#f0b323");
  addShake(2.5);
  spawnCorpse(enemy, enemySprite(enemy));
  //Freezing everything for a few frames is the cheapest way to make a hit
  //land. Kept short so the game never feels like it is stuttering.
  fx.hitStop = Math.max(fx.hitStop, CONFIG.anim.hitStop);
  chargeUlt(CONFIG.ult.chargePerKill);
  maybeDropPowerUp(enemy);
  return true;
}

//Every point in the game goes through here, so the milestone cannot be
//missed by a route that forgot to check it. Crossing two thresholds at once
//— a boss at a high wave pays out five figures — hands back two lives.
export function addScore(amount) {
  run.score += amount;
  while (run.score >= run.nextLife) {
    run.nextLife += CONFIG.player.extraLifeEvery;
    awardLife();
  }
}

export function awardLife() {
  //At the cap it converts rather than evaporating, so the milestone is never
  //a reward you watch go past.
  if (world.player.lives >= CONFIG.player.maxLives) {
    run.score += 500;
    floatText(world.player.x, world.player.y - 10, "+500", "#f0b323");
    return;
  }
  world.player.lives++;
  playSfx("pickup", 0.5, 1.6);
  pop(world.player.x + world.player.w / 2, world.player.y + world.player.h / 2, "#4ade80", 120);
  burst(world.player.x + world.player.w / 2, world.player.y + world.player.h / 2, "#4ade80", 26, 380);
  floatText(world.player.x, world.player.y - 10, "EXTRA LIFE", "#4ade80");
  addShake(6);
}

export function maybeDropPowerUp(enemy) {
  if (Math.random() > CONFIG.powerUp.dropChance) return;
  //A life is worth nothing at the cap, so it is taken out of the draw
  //rather than dropped and wasted.
  const kinds = CONFIG.powerUp.kinds.filter(
    ([kind]) => kind !== "life" || world.player.lives < CONFIG.player.maxLives
  );
  const total = kinds.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rand(0, total);
  const kind = (kinds.find(([, weight]) => (roll -= weight) < 0) || kinds[0])[0];
  powerUps.push({
    kind,
    x: enemy.x + enemy.w / 2,
    y: enemy.y + enemy.h / 2,
    w: CONFIG.powerUp.size,
    h: CONFIG.powerUp.size,
    bob: rand(0, Math.PI * 2),
  });
}

export function enemyLeaked(enemy) {
  const before = incursionStage();
  run.incursion = Math.min(CONFIG.incursion.max, run.incursion + enemy.def.leak);
  run.waveLeaks++;
  run.combo = 0;
  addShake(9);
  screenFlash("#ff3b3f", 0.4);
  //Right of the incursion meter, clear of the power-up timers above it
  floatText(430, H - 46, `+${enemy.def.leak}`, "#ff6b6b");
  //Crossing a stage is worth announcing: everything gets faster from here
  if (incursionStage() > before) {
    banner("REALITY THINS", "THE OTHER EARTH IS CLOSER", "#ff3b3f");
    addShake(18);
    screenFlash("#ff3b3f", 0.55);
    playSfx("thunder", 0.4, 0.6);
  }
}

//The only way to give ground back. A wave taken without letting anything
//through pushes the other Earth away again.
export function holdTheLine() {
  if (run.waveLeaks > 0) return 0;
  const before = run.incursion;
  run.incursion = Math.max(0, run.incursion - CONFIG.incursion.holdReward);
  return before - run.incursion;
}

//The Black Order do not simply advance. Each has one idea, and the timers
//that drive it live on the enemy itself.
function updateElite(enemy, dt) {
  const def = enemy.def;
  enemy.timer = (enemy.timer || 0) - dt;

  if (def.behaviour === "spear") {
    //Hangs back and throws at wherever you actually are
    if (enemy.timer <= 0) {
      enemy.timer = def.spearGap;
      const cy = enemy.y + enemy.h / 2;
      const dy = clamp((world.player.y + world.player.h / 2 - cy) * 1.4, -320, 320);
      enemyShots.push({
        x: enemy.x, y: cy - 10, w: 22, h: 20,
        vx: -720, vy: dy, color: def.tint,
      });
      burst(enemy.x, cy, def.tint, 8, 200);
      playSfx("shoot", 0.16, 0.7);
    }
  } else if (def.behaviour === "charge") {
    //Lines up, winds up visibly, then commits
    const aligned = Math.abs(
      world.player.y + world.player.h / 2 - (enemy.y + enemy.h / 2)
    ) < 70;
    if (!enemy.charging && enemy.timer <= 0 && aligned) {
      enemy.charging = "windup";
      enemy.timer = def.chargeWindup;
      enemy.hitFlash = def.chargeWindup;
    } else if (enemy.charging === "windup" && enemy.timer <= 0) {
      enemy.charging = "go";
      enemy.timer = 0.7;
      addShake(4);
      burst(enemy.x, enemy.y + enemy.h / 2, def.tint, 16, 320);
    } else if (enemy.charging === "go") {
      enemy.x -= def.chargeSpeed * dt; //dt is already scaled by the caller
      if (enemy.timer <= 0) {
        enemy.charging = null;
        enemy.timer = def.chargeGap;
      }
    }
  } else if (def.behaviour === "beam") {
    //A gunner works one cycle: track, lock, burn. Everything it is about to
    //do is on screen before it happens — the hairline drawn while it charges
    //is exactly where the beam will be, so a death is always a decision you
    //made rather than one it made for you.
    const b = (enemy.beam = enemy.beam || {
      phase: "track",
      t: def.beamGap,
      aimY: enemy.y + enemy.h / 2,
    });
    b.t -= dt;
    if (b.phase === "track") {
      //It follows you while it is still deciding, so standing still is the
      //one thing that cannot work.
      b.aimY +=
        (world.player.y + world.player.h / 2 - b.aimY) * Math.min(1, dt * 3.2);
      //And it will not fire on the walk in, only once it is on its line
      if (b.t <= 0 && enemy.x <= W * def.holdAt + 6) {
        b.phase = "charge";
        b.t = def.beamCharge;
      }
    } else if (b.phase === "charge") {
      //Locked. Moving out of the lane from here is the whole answer.
      if (b.t <= 0) {
        b.phase = "fire";
        b.t = def.beamTime;
        playSfx("shoot", 0.3, 0.45);
        addShake(5);
      }
    } else {
      const beam = {
        x: 0,
        y: b.aimY - def.beamHeight / 2,
        w: enemy.x,
        h: def.beamHeight,
      };
      //hitPlayer() already respects invulnerability, so a live beam cannot
      //eat a whole run in the frames it is up.
      if (overlaps(beam, playerHitbox())) hitPlayer();
      if (b.t <= 0) {
        b.phase = "track";
        b.t = def.beamGap;
        b.shots = (b.shots || 0) + 1;
        //Out of shots: it stops holding its line and walks on, so ignoring
        //one costs you rather than parking it there forever.
        if (def.beamShots && b.shots >= def.beamShots) enemy.releasedHold = true;
      }
    }
  } else if (def.behaviour === "blink") {
    //Vanishes and reappears further in
    if (enemy.timer <= 0) {
      enemy.timer = def.blinkGap;
      burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, def.tint, 14, 260);
      enemy.x -= def.blinkDist;
      enemy.y = clamp(
        world.player.y + world.player.h / 2 - enemy.h / 2 + rand(-90, 90),
        0, H - enemy.h
      );
      burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, def.tint, 14, 260);
      playSfx("hit", 0.16, 0.6);
    }
  }
  //"armour" needs no timer: it is handled where damage is applied
}

export function updateEnemies(dt) {
  const survivors = [];
  //Everything an enemy *does* runs on this clock, not on dt: advancing,
  //weaving, and every wind-up and cooldown inside updateElite. At Strange's
  //zero that is a real stop — a gunner halfway through a lock stays there
  //instead of firing the moment he lets go. Purely visual decay (the hit
  //flash, the fade-in) stays on real time so a frozen enemy still settles.
  const edt = dt * enemySpeedScale();

  for (const enemy of enemies) {
    enemy.x -= enemy.speed * edt;
    //The coven hold a line rather than crossing it. Named, health-barred and
    //walking off the left edge, the cheapest answer to a witch was to stand
    //aside and pay the leak; now the only way past one is through it.
    if (enemy.def.holdAt !== undefined && !enemy.releasedHold) {
      enemy.x = Math.max(enemy.x, W * enemy.def.holdAt);
    }
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    enemy.spawnT = Math.min(1, enemy.spawnT + dt / CONFIG.anim.spawnIn);
    enemy.bob += edt * 3.4;
    if (enemy.def.behaviour) updateElite(enemy, edt);
    if (enemy.def.weave) {
      enemy.phase += edt * 2.2;
      enemy.y = clamp(
        enemy.baseY + Math.sin(enemy.phase) * enemy.def.weave,
        0,
        H - enemy.h
      );
    }

    //Off the left edge — the other Earth comes a step closer
    if (enemy.x + enemy.w < 0) {
      enemyLeaked(enemy);
      continue;
    }

    //Shot down?
    let dead = false;
    for (const bullet of bullets) {
      if (bullet.spent || bullet.struck.has(enemy.id)) continue;
      if (overlaps(enemy, bullet)) {
        bullet.struck.add(enemy.id);
        if (bullet.pierce > 0) bullet.pierce--;
        else bullet.spent = true;
        dead = damageEnemy(enemy, bullet.dmg, bullet.x, bullet.y + bullet.h / 2);
        break;
      }
    }
    if (dead) continue;

    //Swept away by the assembled women
    if (heroes.some((h) => overlaps(enemy, h))) {
      damageEnemy(enemy, 999, enemy.x, enemy.y);
      continue;
    }

    //Reached the player
    if (overlaps(enemy, playerHitbox())) {
      hitPlayer();
      burst(enemy.x, enemy.y, "#ff4d4d", 18, 300);
      continue;
    }

    survivors.push(enemy);
  }

  replaceAll(enemies, survivors);
}

export function updateBoss(dt) {
  if (!world.boss) return;
  //Real time: a hit still flashes while he is held
  world.boss.hitFlash = Math.max(0, world.boss.hitFlash - dt);
  //And from here down he is on the same clock as everything else, so
  //Strange stops him mid-wind-up rather than only stopping his minions.
  dt *= enemySpeedScale();

  //Which phase he is in, and what changes when he enters a new one
  if (world.boss.def.phases) updateBossPhase(dt);

  if (world.boss.entering) {
    world.boss.x -= 240 * dt;
    if (world.boss.x <= W - world.boss.w - 70) {
      world.boss.x = W - world.boss.w - 70;
      world.boss.entering = false;
    }
  } else {
    world.boss.phase += dt;
    world.boss.y =
      H / 2 - world.boss.h / 2 +
      Math.sin(world.boss.phase * world.boss.def.bobSpeed) * (H / 2 - world.boss.h / 2 - 20);

    world.boss.fireTimer -= dt;
    //The last 0.6s before a shot is a visible wind-up: he swells, the aura
    //tightens and motes converge on him. It makes the fight readable.
    const WINDUP = 0.6;
    world.boss.windup = world.boss.fireTimer < WINDUP ? 1 - world.boss.fireTimer / WINDUP : 0;
    if (world.boss.windup > 0 && Math.random() < 0.5) {
      const a = rand(0, Math.PI * 2);
      const r = world.boss.w * 0.9;
      particles.push({
        x: world.boss.x + world.boss.w / 2 + Math.cos(a) * r,
        y: world.boss.y + world.boss.h / 2 + Math.sin(a) * r,
        vx: -Math.cos(a) * 260,
        vy: -Math.sin(a) * 260,
        life: 0.32,
        maxLife: 0.32,
        size: rand(2, 4),
        color: "#c084fc",
      });
    }

    if (world.boss.fireTimer <= 0 && world.boss.stagger <= 0) {
      const bd = bossPhase();
      world.boss.fireTimer = clamp(bd.fireGap - run.wave * 0.04, 0.5, bd.fireGap);
      world.boss.windup = 0;
      world.boss.lunge = 1;
      const cy = world.boss.y + world.boss.h / 2;
      const targetY = world.player.y + world.player.h / 2;
      const dy = clamp((targetY - cy) * 1.2, -260, 260);
      //Ultron fires a spread; Thanos fires one heavy bolt
      const n = bd.shots;
      for (let i = 0; i < n; i++) {
        const offset = n === 1 ? 0 : (i / (n - 1) - 0.5) * bd.spread;
        enemyShots.push({
          x: world.boss.x,
          y: cy - 14,
          w: 30,
          h: 28,
          vx: -680,
          vy: dy + offset,
          color: world.boss.def.shotColor,
        });
      }
      burst(world.boss.x, cy, world.boss.def.shotColor, 14, 280);
      addShake(5);
    }
    world.boss.lunge = Math.max(0, world.boss.lunge - dt * 4);
    world.boss.knock = Math.max(0, world.boss.knock - dt * 6);

    //A summonGap of zero is a phase that has stopped calling for help
    const summonGap = bossPhase().summonGap;
    if (summonGap > 0) {
      world.boss.spawnTimer -= dt;
      if (world.boss.spawnTimer <= 0) {
        world.boss.spawnTimer = summonGap;
        spawnEnemy(world.boss.def.minion);
      }
    }
  }

  for (const bullet of bullets) {
    if (bullet.spent) continue;
    if (overlaps(world.boss, bullet)) {
      bullet.spent = true;
      //A web that one-shots everything else does not one-shot him
      const dmg = bullet.capVsBoss === undefined ? bullet.dmg : bullet.capVsBoss;
      damageBoss(dmg, bullet.x, bullet.y + bullet.h / 2);
      if (!world.boss) return;
    }
  }

  if (overlaps(world.boss, playerHitbox())) hitPlayer();
}

//The phase he is in right now. Bosses without phases behave as they always
//did: the definition is its own single phase.
export function bossPhase() {
  const b = world.boss;
  if (!b || !b.def.phases) return b ? b.def : null;
  return b.def.phases[b.stage || 0];
}

export function updateBossPhase(dt) {
  const b = world.boss;
  const frac = b.hp / b.maxHp;
  //The last phase whose threshold he has fallen to
  let stage = 0;
  b.def.phases.forEach((p, i) => {
    if (frac <= p.at) stage = i;
  });

  if (stage !== b.stage) {
    b.stage = stage;
    const phase = b.def.phases[stage];
    banner(b.def.name, phase.name, b.def.tint);
    screenFlash(b.def.tint, 0.4);
    addShake(16);
    playSfx("ultimate", 0.4, 0.8);
    b.fireTimer = 1;
    if (phase.ward) {
      b.ward = b.wardMax = phase.ward(run.wave);
      playSfx("thunder", 0.35, 1.4);
    }
  }

  b.stagger = Math.max(0, (b.stagger || 0) - dt);

  //The collapse phase does not need to beat you, only to outlast you
  const pull = bossPhase().incursionPerSecond;
  if (pull) {
    const before = incursionStage();
    run.incursion = Math.min(CONFIG.incursion.max, run.incursion + pull * dt);
    if (incursionStage() > before) {
      banner("REALITY THINS", "HE IS PULLING IT IN", "#ff3b3f");
      addShake(18);
    }
  }
}

export function damageBoss(amount, hitX, hitY) {
  if (!world.boss) return;

  //Nothing reaches him through the window. It has to come down first.
  if (world.boss.ward > 0) {
    world.boss.ward -= amount;
    burst(hitX, hitY, "#bbf7d0", 8, 240);
    playSfx("hit", 0.2, 1.5);
    if (world.boss.ward > 0) return;
    world.boss.ward = 0;
    //And breaking it leaves him reeling, which is the only window in the
    //fight where he is worth more than he costs.
    world.boss.stagger = world.boss.def.staggerTime;
    banner("WARD SHATTERED", "", "#bbf7d0");
    screenFlash("#ffffff", 0.5);
    addShake(20);
    playSfx("explode", 0.45, 1.3);
    burst(world.boss.x + world.boss.w / 2, world.boss.y + world.boss.h / 2, "#bbf7d0", 60, 520);
    return;
  }

  //Hits land harder while he is staggered
  if (world.boss.stagger > 0) amount *= world.boss.def.staggerDamage || 1;
  world.boss.hp -= amount;
  world.boss.hitFlash = 0.1;
  world.boss.knock = 1; //visibly shoved back by the hit
  chargeUlt(CONFIG.ult.chargePerBossHit);
  burst(hitX, hitY, "#ffd27f", 6, 200);
  if (world.boss.hp > 0) return;

  const gained = 1000 * run.wave;
  addScore(gained);
  run.kills++;
  floatText(world.boss.x + 40, world.boss.y + world.boss.h / 2, `+${gained}`, "#f0b323");
  addShake(24);
  screenFlash("#ffffff", 0.45);
  playSfx("explode", 0.6, 0.7);
  //He does not vanish: he comes apart in slow motion over a second and a half
  world.bossDying = {
    sprite: world.boss.def.sprite,
    x: world.boss.x,
    y: world.boss.y,
    w: world.boss.w,
    h: world.boss.h,
    t: 0,
    dur: 1.6,
    nextBurst: 0,
    spin: rand(-0.7, 0.7),
  };
  fx.slowMo = CONFIG.anim.bossSlowMo;
  fx.hitStop = Math.max(fx.hitStop, 0.12);
  world.boss = null;
}

export function updateBossDeath(dt) {
  if (!world.bossDying) return;
  world.bossDying.t += dt;
  world.bossDying.nextBurst -= dt;
  if (world.bossDying.nextBurst <= 0) {
    world.bossDying.nextBurst = 0.13;
    burst(
      world.bossDying.x + rand(20, world.bossDying.w - 20),
      world.bossDying.y + rand(20, world.bossDying.h - 20),
      Math.random() < 0.5 ? "#c084fc" : "#ffd27f",
      26,
      420
    );
    addShake(6);
  }
  if (world.bossDying.t >= world.bossDying.dur) {
    burst(
      world.bossDying.x + world.bossDying.w / 2,
      world.bossDying.y + world.bossDying.h / 2,
      "#ffffff",
      70,
      620
    );
    pop(world.bossDying.x + world.bossDying.w / 2, world.bossDying.y + world.bossDying.h / 2, "#c084fc", 420);
    world.bossDying = null;
  }
}

export function updateBullets(dt) {
  for (const b of bullets) {
    b.x += CONFIG.bullet.speed * dt;
    //Shuri's pulses carry only so far before they dissipate
    if (b.range !== undefined) {
      b.travelled = (b.travelled || 0) + CONFIG.bullet.speed * dt;
      if (b.travelled > b.range) b.spent = true;
    }
    if (!b.vy) continue;
    b.spin += dt * 18;
    b.y += b.vy * dt;
    if (b.y <= 0) {
      b.y = 0;
      b.vy = -b.vy;
      burst(b.x, b.y, "#e2e8f0", 6, 160);
    } else if (b.y + b.h >= H) {
      b.y = H - b.h;
      b.vy = -b.vy;
      burst(b.x, b.y + b.h, "#e2e8f0", 6, 160);
    }
  }
  sweep(bullets, (b) => !b.spent && b.x < W + 60);

  const shotScale = enemySpeedScale();
  for (const s of enemyShots) {
    s.x += s.vx * dt * shotScale;
    s.y += s.vy * dt * shotScale;
    if (overlaps(s, playerHitbox())) {
      s.spent = true;
      hitPlayer();
    }
  }
  sweep(enemyShots, 
    (s) => !s.spent && s.x + s.w > -40 && s.y < H + 60 && s.y + s.h > -60
  );
}

export function updatePowerUps(dt) {
  for (const p of powerUps) {
    p.x -= CONFIG.powerUp.driftSpeed * dt;
    p.bob += dt * 3;
    if (overlaps(p, world.player)) {
      p.taken = true;
      const colors = POWERUP_COLORS;
      pop(p.x + p.w / 2, p.y + p.h / 2, colors[p.kind], 90);
      applyPowerUp(p.kind);
    }
  }
  sweep(powerUps, (p) => !p.taken && p.x + p.w > 0);
}

//Shared with the drawing code, so a new kind cannot end up drawn in one
//colour and collected in another.
export const POWERUP_COLORS = {
  rapid: "#f0b323",
  shield: "#38bdf8",
  blast: "#ff3b3f",
  life: "#4ade80",
};

export function applyPowerUp(kind) {
  playSfx("pickup", 0.35);
  if (kind === "life") {
    awardLife();
    return;
  }
  if (kind === "rapid") {
    world.player.rapid = CONFIG.powerUp.rapidDuration;
    floatText(world.player.x, world.player.y - 10, "RAPID FIRE", "#f0b323");
  } else if (kind === "shield") {
    world.player.shield = CONFIG.powerUp.shieldDuration;
    floatText(world.player.x, world.player.y - 10, "SHIELD", "#38bdf8");
  } else {
    floatText(world.player.x, world.player.y - 10, "BLAST", "#ff3b3f");
    screenFlash("#ffffff", 0.4);
    addShake(16);
    for (const enemy of [...enemies]) {
      damageEnemy(enemy, 999, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
    }
    enemies.length = 0;
  }
  burst(world.player.x + world.player.w / 2, world.player.y + world.player.h / 2, "#ffffff", 20, 300);
}

export function updateHeroes(dt) {
  for (const h of heroes) h.x += h.speed * dt;
  sweep(heroes, (h) => h.x < W + 120);
}

export function hitPlayer() {
  if (world.player.invuln > 0 || world.player.shield > 0) return;
  world.player.lives--;
  world.player.invuln = CONFIG.player.invulnAfterHit;
  run.combo = 0;
  playSfx("hurt", 0.45);
  addShake(18);
  screenFlash("#ff2b2b", 0.45);
  burst(world.player.x + world.player.w / 2, world.player.y + world.player.h / 2, "#ff4d4d", 34, 420);
}

//He enters from whichever side, walks to about the middle, stops to wave,
//then carries on out of frame — the way the cameos actually go.
function startCameo() {
  const cfg = CONFIG.cameo;
  const fromLeft = Math.random() < 0.5;
  fx.cameo = {
    dir: fromLeft ? 1 : -1,
    x: fromLeft ? -100 : W + 100,
    phase: "walk",
    waved: false,
    timer: 0,
    bob: 0,
  };
}

function updateCameo(dt) {
  const c = fx.cameo;
  const cfg = CONFIG.cameo;
  c.bob += dt * 9;

  if (c.phase === "walk") {
    c.x += c.dir * cfg.walkSpeed * dt;
    const mark = c.dir > 0 ? W * cfg.waveAt : W * (1 - cfg.waveAt);
    if (!c.waved && ((c.dir > 0 && c.x >= mark) || (c.dir < 0 && c.x <= mark))) {
      c.phase = "wave";
      c.waved = true;
      c.timer = cfg.waveTime;
    }
    //Gone once he is fully off the far side
    if (c.x < -140 || c.x > W + 140) {
      fx.cameo = null;
      fx.cameoTimer = rand(CONFIG.cameo.minGap, CONFIG.cameo.maxGap);
    }
  } else {
    c.timer -= dt;
    //A couple of sparkles while he waves, so the eye catches him
    if (Math.random() < 0.25) {
      particles.push({
        x: c.x + rand(0, 90),
        y: H - 100 + rand(0, 40),
        vx: rand(-20, 20), vy: rand(-40, -10),
        life: 0.5, maxLife: 0.5, size: rand(2, 3),
        color: "#f0b323",
      });
    }
    if (c.timer <= 0) c.phase = "walk";
  }
}

export function updateDressing(dt) {
  //Stan Lee turns up now and then rather than standing at the bottom
  if (fx.cameo) {
    updateCameo(dt);
  } else {
    fx.cameoTimer -= dt;
    if (fx.cameoTimer <= 0) startCameo();
  }

  fx.grootTimer += dt;
  if (fx.grootTimer >= 0.45) {
    fx.grootStanding = !fx.grootStanding;
    fx.grootTimer = 0;
  }
  fx.chitTimer += dt;
  if (fx.chitTimer >= 1 / 7) {
    fx.chitFrame = (fx.chitFrame + 1) % 3;
    fx.chitTimer = 0;
  }
  for (const star of fx.stars) {
    star.x -= star.speed * dt;
    if (star.x < -4) {
      star.x = W + 4;
      star.y = rand(0, H);
    }
  }
}

export function updateEffects(dt) {
  fx.storm = Math.max(0, fx.storm - dt);

  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 220 * dt;
    p.life -= dt;
  }
  sweep(particles, (p) => p.life > 0);

  for (const t of floatTexts) {
    t.y -= 46 * dt;
    t.life -= dt;
  }
  sweep(floatTexts, (t) => t.life > 0);

  for (const c of corpses) {
    c.t += dt;
    c.x += c.driftX * dt;
    c.y += c.driftY * dt;
  }
  sweep(corpses, (c) => c.t < c.dur);

  for (const o of pops) o.t += dt;
  sweep(pops, (o) => o.t < o.dur);

  for (const a of boltArcs) a.t += dt;
  sweep(boltArcs, (a) => a.t < a.dur);

  fx.shake = Math.max(0, fx.shake - 60 * dt);
  if (fx.flash) {
    fx.flash.alpha -= dt * 3.4;
    if (fx.flash.alpha <= 0) fx.flash = null;
  }
  if (fx.waveBanner) {
    fx.waveBanner.life -= dt;
    if (fx.waveBanner.life <= 0) fx.waveBanner = null;
  }
}

//=====================================================================//
//  DRAW
