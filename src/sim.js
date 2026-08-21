import { updateIgnition, updateMissiles } from "./abilities.js";
import { playSfx } from "./audio.js";
import { H, W } from "./canvas.js";
import { CONFIG } from "./config.js";
import { burst, floatText } from "./effects.js";
import { heldKeys } from "./input.js";
import { endGame } from "./loop.js";
import { throwMjolnir, updateMjolnir } from "./mjolnir.js";
import { punch, throwShield, updatePunches, updateShield, updateWorthy } from "./shield.js";
import { bullets, enemies, fx, heroDef, heroTint, run, world } from "./state.js";
import { clamp, overlaps, sweep } from "./util.js";
import { startWave, waveIsClear } from "./waves.js";
import { damageEnemy, updateBoss, updateBossDeath, updateBullets, updateDressing, updateEffects, updateEnemies, updateHeroes, updatePowerUps, updateSpawning } from "./world.js";

//=====================================================================//
export function update(dt) {
  fx.elapsed += dt;
  run.waveElapsed += dt;

  updatePlayer(dt);
  updateSpawning(dt);
  updateEnemies(dt);
  updateBoss(dt);
  updateBossDeath(dt);
  updateBullets(dt);
  updatePowerUps(dt);
  updateMissiles(dt);
  updateMjolnir(dt);
  updateShield(dt);
  updatePunches(dt);
  updateWorthy(dt);
  //While Johnny is alight, anything that touches him burns
  if (heroDef().ult === "flameon" && world.player.worthy > 0) {
    world.player.invuln = Math.max(world.player.invuln, 0.1);
    for (const enemy of [...enemies]) {
      if (!overlaps(enemy, world.player)) continue;
      burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ff8a3d", 16, 300);
      damageEnemy(enemy, 999, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
    }
    sweep(enemies, (e) => e.hp > 0);
  }
  updateHeroes(dt);
  updateDressing(dt);
  updateEffects(dt);

  //Wave cleared → breather → next wave
  if (!run.betweenWaves && waveIsClear()) {
    run.betweenWaves = true;
    run.betweenTimer = 2.2;
    const bonus = 100 * run.wave;
    run.score += bonus;
    playSfx("wave", 0.35);
    floatText(W / 2 - 60, H / 2, `WAVE CLEAR +${bonus}`, "#4ade80");
  }
  if (run.betweenWaves) {
    run.betweenTimer -= dt;
    if (run.betweenTimer <= 0) startWave(run.wave + 1);
  }

  if (run.stonesHp <= 0 || world.player.lives <= 0) endGame();
}

export function updatePlayer(dt) {
  const step = CONFIG.player.speed * dt;
  const m = CONFIG.player.margin;
  const up = heldKeys.has("ArrowUp");
  const down = heldKeys.has("ArrowDown");
  if (up) world.player.y -= step;
  if (down) world.player.y += step;
  if (heldKeys.has("ArrowLeft")) world.player.x -= step;
  if (heldKeys.has("ArrowRight")) world.player.x += step;

  //Bank into the turn, level out when the keys are released
  const targetBank = (down ? 1 : 0) - (up ? 1 : 0);
  world.player.bank +=
    (targetBank * CONFIG.anim.bankAngle - world.player.bank) *
    Math.min(1, dt * CONFIG.anim.bankEase);
  world.player.recoil = Math.max(
    0,
    world.player.recoil - dt * CONFIG.anim.recoilDecay
  );
  world.player.y = clamp(world.player.y, m, H - world.player.h - m);
  world.player.x = clamp(world.player.x, m, W - world.player.w - m);

  world.player.invuln = Math.max(0, world.player.invuln - dt);
  world.player.shield = Math.max(0, world.player.shield - dt);
  world.player.rapid = Math.max(0, world.player.rapid - dt);
  world.player.hex = Math.max(0, world.player.hex - dt);
  world.player.cooldown -= dt;
  updateIgnition(dt);

  if (heldKeys.has("KeyS") && world.player.cooldown <= 0) fire();
}

export function fire() {
  const hero = heroDef();
  if (hero.throwsMjolnir) {
    throwMjolnir();
    return;
  }
  //Shuri fights close in as well as firing, so anything in reach gets hit
  if (hero.melee) {
    const reached = punch();
    if (reached) return;
  }

  if (hero.ult === "worthy") {
    //While worthy he wields Mjolnir the same way Thor does — the same
    //hammer, the same throw-and-return. Otherwise it is the shield, and
    //fists whenever whatever he threw is still in the air.
    if (world.player.worthy > 0) {
      if (world.mjolnir) punch();
      else throwMjolnir();
    } else if (world.shield) {
      punch();
    } else {
      throwShield();
    }
    return;
  }
  const [bw, bh] = hero.bulletSize;
  world.player.cooldown =
    hero.cooldown * (world.player.rapid > 0 ? CONFIG.powerUp.rapidFactor : 1);
  world.player.recoil = 1;
  //Most heroes fire a single shot down the centre; Iron Man has two palms.
  const barrels = hero.barrels || [0];
  for (const offset of barrels) {
    bullets.push({
      x: world.player.x + world.player.w - 10,
      y: world.player.y + world.player.h / 2 - bh / 2 + offset * world.player.h,
      w: bw,
      h: bh,
      dmg: hero.damage,
      pierce: hero.pierce || 0,
      struck: new Set(),
      range: hero.range,
    });
  }
  //muzzle flash
  burst(world.player.x + world.player.w, world.player.y + world.player.h / 2, heroTint(), 5, 150);
  playSfx("shoot", 0.16, heroDef().shootRate || 1);
}

//=====================================================================//
//  MJOLNIR
