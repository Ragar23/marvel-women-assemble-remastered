import { img } from "./assets.js";
import { H, W } from "./canvas.js";
import { CONFIG, ENEMY_TYPES, WAVE_PLAN } from "./config.js";
import { enemies, fx, run, spawnQueue, speedMultiplier, world } from "./state.js";
import { clamp, rand } from "./util.js";

//=====================================================================//
export function startWave(n) {
  run.wave = n;
  run.waveElapsed = 0;
  run.betweenWaves = false;
  spawnQueue.length = 0;

  const isBoss = n % CONFIG.bossEvery === 0;
  if (isBoss) {
    summonThanos();
    banner(`WAVE ${n}`, "THANOS IS COMING", "#c084fc");
    return;
  }

  const plan = WAVE_PLAN[Math.min(n - 1, WAVE_PLAN.length - 1)];
  const total = plan.count + Math.max(0, n - WAVE_PLAN.length) * 4;
  //Spread the wave out over time, tightening as the waves go up. An enemy
  //crosses the screen in roughly 2.8s, so a 0.6s gap keeps about five of
  //them in play at once, and the late waves roughly double that.
  const gap = clamp(0.66 - (n - 1) * 0.07, 0.24, 0.66);

  for (let i = 0; i < total; i++) {
    spawnQueue.push({
      type: plan.mix[Math.floor(rand(0, plan.mix.length))],
      at: 0.7 + i * gap * rand(0.72, 1.28),
    });
  }
  spawnQueue.sort((a, b) => a.at - b.at);
  banner(`WAVE ${n}`, plan.mix.length > 3 ? "THEY KEEP COMING" : "", "#ff3b3f");
}

export function banner(title, subtitle, color) {
  fx.waveBanner = { title, subtitle, color, life: 2.4, maxLife: 2.4 };
}

export function spawnEnemy(typeName) {
  const def = ENEMY_TYPES[typeName];
  const sprite = img[def.sprite];
  const y = rand(10, H - sprite.height - 10);
  //Bigger, tougher enemies appear from further out so they read as a threat.
  const hpBonus = Math.floor((run.wave - 1) / CONFIG.difficulty.hpEveryWaves);
  enemies.push({
    id: world.nextEnemyId++,
    type: typeName,
    def,
    x: W + rand(20, 220),
    y,
    baseY: y,
    w: sprite.width,
    h: sprite.height,
    hp: def.hp + hpBonus,
    maxHp: def.hp + hpBonus,
    speed: def.speed * speedMultiplier(),
    phase: rand(0, Math.PI * 2),
    hitFlash: 0,
    spawnT: 0, //0 → 1 as it fades and scales into the world
    bob: rand(0, Math.PI * 2), //phase-offset so the swarm never syncs up
  });
}

export function summonThanos() {
  const size = 250;
  world.boss = {
    x: W + 120,
    y: H / 2 - size / 2,
    w: size,
    h: size,
    hp: 40 + run.wave * 8,
    maxHp: 40 + run.wave * 8,
    entering: true,
    phase: 0,
    fireTimer: 1.4,
    spawnTimer: 2.6,
    hitFlash: 0,
    windup: 0, //0 → 1 as he charges a blast, giving you a tell
    lunge: 0, //snaps to 1 on release, then decays
    knock: 0, //knocked back by each hit that lands
  };
}

export function waveIsClear() {
  return (
    spawnQueue.length === 0 &&
    enemies.length === 0 &&
    world.boss === null &&
    world.bossDying === null
  );
}

//=====================================================================//
//  EFFECTS
