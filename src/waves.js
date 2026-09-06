import { img } from "./assets.js";
import { playSfx, playVoice } from "./audio.js";
import { H, W } from "./canvas.js";
import { BOSSES, CONFIG, ELITE_SCHEDULE, ENEMY_TYPES, WAVE_PLAN } from "./config.js";
import { addShake } from "./effects.js";
import { enemies, fitSprite, fx, run, spawnQueue, speedMultiplier, world } from "./state.js";
import { clamp, rand } from "./util.js";

//=====================================================================//
export function startWave(n) {
  run.wave = n;
  run.waveElapsed = 0;
  run.betweenWaves = false;
  //Held clean, this wave pushes the incursion back when it clears
  run.waveLeaks = 0;
  spawnQueue.length = 0;

  const isBoss = n % CONFIG.bossEvery === 0;
  if (isBoss) {
    const def = bossForWave(n);
    summonBoss(def);
    banner(`WAVE ${n}`, `${def.name} IS COMING`, def.tint);
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
  //Elites come in partway through the wave, spaced apart
  const elites = ELITE_SCHEDULE[n] || (n > 9 ? ["corvus", "cull", "proxima", "nebula"].slice(0, 1 + (n % 3)) : []);
  elites.forEach((type, i) => {
    spawnQueue.push({ type, at: 4 + i * 7 });
  });
  spawnQueue.sort((a, b) => a.at - b.at);
  banner(`WAVE ${n}`, plan.mix.length > 3 ? "THEY KEEP COMING" : "", "#ff3b3f");
}

export function banner(title, subtitle, color) {
  fx.waveBanner = { title, subtitle, color, life: 2.4, maxLife: 2.4 };
}

export function spawnEnemy(typeName) {
  const def = ENEMY_TYPES[typeName];
  //Two of them arrive as the man they used to be and change on the way in.
  //They walk on at his size, in his sprite, and the world turns them.
  const human = !!def.humanSprite;
  const sprite = img[human ? def.humanSprite : def.sprite];
  const size = fitSprite(sprite, human ? def.humanHeight : def.height);
  const y = rand(10, H - size.h - 10);
  //Bigger, tougher enemies appear from further out so they read as a threat.
  const hpBonus = Math.floor((run.wave - 1) / CONFIG.difficulty.hpEveryWaves);
  //The name lands when the thing arrives, not when the man does — the
  //banner is the introduction, and he has not been introduced yet.
  if (def.elite && !human) {
    banner(def.name, "", def.tint);
    playSfx("thunder", 0.3, 1.5);
    addShake(8);
  }
  enemies.push({
    id: world.nextEnemyId++,
    type: typeName,
    def,
    x: W + rand(20, 220),
    y,
    baseY: y,
    w: size.w,
    h: size.h,
    hp: def.hp + hpBonus,
    maxHp: def.hp + hpBonus,
    speed: def.speed * speedMultiplier(),
    phase: rand(0, Math.PI * 2),
    hitFlash: 0,
    timer: 0,
    plating: def.armourHp || 0,
    //Still a man, and so not yet doing whatever he does. updateElite is
    //skipped and the sprite is his until transform() flips this.
    human,
    changing: 0, //1 → 0 across the change itself
    spawnT: 0, //0 → 1 as it fades and scales into the world
    bob: rand(0, Math.PI * 2), //phase-offset so the swarm never syncs up
  });
}

//Wave 5 is Ultron, wave 10 is Thanos, and they alternate after that.
export function bossForWave(n) {
  const order = CONFIG.bossOrder;
  const index = Math.floor(n / CONFIG.bossEvery) - 1;
  return BOSSES[order[index % order.length]];
}

export function summonBoss(def) {
  const size = def.size;
  world.boss = {
    def,
    x: W + 120,
    y: H / 2 - size / 2,
    w: size,
    h: size,
    hp: def.hp(run.wave),
    maxHp: def.hp(run.wave),
    entering: true,
    phase: 0, //bob timer, not the fight phase
    stage: 0, //which of def.phases he is in
    ward: 0,
    wardMax: 0,
    stagger: 0,
    fireTimer: 1.4,
    spawnTimer: 2.6,
    hitFlash: 0,
    windup: 0,
    lunge: 0,
    knock: 0,
  };

  //"Hello, Peter." Spoken rather than played as an effect: it is not
  //allowed to be culled by the voice cap and it pulls the music down
  //while it talks, because the only reason it is here is to be heard.
  if (def.voice) playVoice(def.voice);
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
