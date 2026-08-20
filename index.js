//=====================================================================//
//  MARVEL. ¡WOMEN, ASSEMBLE! — Remastered
//  Waves, lives, combos, power-ups and a Thanos boss fight.
//=====================================================================//

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

//=====================================================================//
//  TUNING — every number worth arguing about lives here.
//  All speeds are pixels per SECOND, so the game plays identically on a
//  60Hz laptop and a 120Hz display.
//=====================================================================//
const CONFIG = {
  player: {
    speed: 980,
    invulnAfterHit: 1.6,
    lives: 3,
    margin: 8,
  },
  bullet: { speed: 1250 },
  stones: { maxHp: 100 },
  combo: { killsPerStep: 6, max: 5 },
  powerUp: {
    dropChance: 0.14,
    driftSpeed: 170,
    rapidDuration: 8,
    rapidFactor: 0.35,
    shieldDuration: 7,
    size: 44,
  },
  //Wave N multiplies every enemy speed by this, capped, so runs build.
  difficulty: { speedStep: 0.075, speedCap: 2.1, hpEveryWaves: 4 },
  bossEvery: 5,
  //Ultimates: a meter filled by kills, spent with Space.
  ult: {
    max: 100,
    chargePerKill: 4.5, //about 22 kills for a full bar
    chargePerBossHit: 1.2,
    hexDuration: 5, //Wanda: how long the world crawls
    hexSlow: 0.28, //enemies move at this fraction of their speed
    ignitionDuration: 1.7, //Captain Marvel: beam uptime
    ignitionDamage: 999,
    godBlastDamage: 7, //Thor: damage to everything on screen
  },
  //Animation and juice. Durations in seconds, angles in radians.
  anim: {
    bankAngle: 0.26, //how far the hero tilts at full vertical speed
    bankEase: 10, //how quickly the tilt catches up with the input
    recoilPx: 16,
    recoilDecay: 6.5,
    spawnIn: 0.35, //enemies fade and scale in over this
    deathTime: 0.32,
    hitStop: 0.05, //frames frozen on a kill
    bossSlowMo: 1.5,
    slowMoScale: 0.32,
  },
};

const HEROES = {
  wanda: {
    sprite: "wanda",
    bullet: "ball",
    bulletSize: [43, 36],
    damage: 2,
    cooldown: 0.22,
    tint: "#e0457b",
    ult: "hex",
    ultName: "CHAOS HEX",
  },
  cpMarvel: {
    sprite: "marvel",
    bullet: "blast",
    bulletSize: [76, 42],
    damage: 1,
    cooldown: 0.11,
    tint: "#f0b323",
    ult: "ignition",
    ultName: "BINARY IGNITION",
  },
  thor: {
    sprite: "thor",
    bullet: "lightning",
    bulletSize: [70, 38],
    damage: 3,
    cooldown: 0.34,
    //Each bolt arcs through this many extra enemies before it dies.
    pierce: 2,
    tint: "#7dd3fc",
    ult: "godblast",
    ultName: "GOD BLAST",
  },
};

//baseSpeed px/s, hp, points, stone damage when it gets through
const ENEMY_TYPES = {
  outrider: { sprite: "spaceDogs", speed: 480, hp: 1, points: 10, leak: 7 },
  ultron: { sprite: "ultron", speed: 620, hp: 1, points: 15, leak: 7, weave: 150 },
  chitauri: { sprite: "chit2", speed: 430, hp: 2, points: 20, leak: 9, animated: true },
  nebula: { sprite: "nebula", speed: 545, hp: 3, points: 35, leak: 12 },
  proxima: { sprite: "proxima", speed: 500, hp: 4, points: 40, leak: 14, weave: 90 },
  corvus: { sprite: "corvus", speed: 505, hp: 4, points: 40, leak: 14 },
  cull: { sprite: "cull", speed: 300, hp: 6, points: 55, leak: 20 },
  levi: { sprite: "levi", speed: 265, hp: 9, points: 90, leak: 24 },
};

//Which enemies each wave may draw from, and how many to send.
const WAVE_PLAN = [
  { count: 20, mix: ["outrider"] },
  { count: 26, mix: ["outrider", "ultron"] },
  { count: 32, mix: ["outrider", "ultron", "chitauri"] },
  { count: 36, mix: ["outrider", "chitauri", "nebula", "cull"] },
  { count: 42, mix: ["outrider", "ultron", "chitauri", "proxima", "corvus"] },
  { count: 48, mix: ["ultron", "chitauri", "nebula", "corvus", "cull", "levi"] },
];

//=====================================================================//
//  ASSETS
//=====================================================================//
const imageSources = {
  bg: "./images/bg.png",
  spaceDogs: "./images/outriders.png",
  ultron: "./images/ultron.png",
  cull: "./images/cull.png",
  wanda: "./images/scarlet-witch.png",
  ball: "./images/energyBall.png",
  proxima: "./images/proxima.png",
  corvus: "./images/corvus.png",
  nebula: "./images/nebula.bad.png",
  thanos: "./images/thanos.png",
  valkiria: "./images/valkiria.png",
  rescuePotts: "./images/rescuePotts.png",
  marvel: "./images/marvel.png",
  okoye: "./images/okoye.png",
  wasp: "./images/wasp.png",
  shuri: "./images/shuri.png",
  gamora: "./images/gamora.png",
  grootLeft: "./images/babyGroot.png",
  grootRight: "./images/babyGrootLeft.png",
  blast: "./images/blast.png",
  stanLee: "./images/StanLee.png",
  gaunlet: "./images/stones.png",
  mantis: "./images/mantis.png",
  levi: "./images/levi.png",
  spiderman: "./images/spiderman.png",
  chit2: "./images/chit2.png",
  chit3: "./images/chit3.png",
  chit4: "./images/chit4.png",
  thor: "./images/thor.png",
  lightning: "./images/lightning.png",
};

const img = {};

function loadImages(onProgress) {
  const total = Object.keys(imageSources).length;
  let done = 0;
  return Promise.all(
    Object.entries(imageSources).map(
      ([name, src]) =>
        new Promise((resolve) => {
          const image = new Image();
          const settle = () => {
            done++;
            if (onProgress) onProgress(done / total);
            resolve(image);
          };
          //A missing sprite must not deadlock the loading screen.
          image.onload = settle;
          image.onerror = () => {
            console.warn(`Could not load ${src}`);
            settle();
          };
          image.src = src;
          img[name] = image;
        })
    )
  );
}

//=====================================================================//
//  DOM
//=====================================================================//
const screens = {
  menu: document.getElementById("screen-menu"),
  game: document.getElementById("screen-game"),
  gameover: document.getElementById("screen-gameover"),
};
const startBtn = document.getElementById("start-button");
const retryBtn = document.getElementById("retry-button");
const menuBtn = document.getElementById("menu-button");
const muteBtn = document.getElementById("mute-button");
const pauseOverlay = document.getElementById("pause-overlay");
const heroCards = Array.from(document.querySelectorAll(".hero-card"));
const gameOverTitle = document.getElementById("gameover-title");
const statScore = document.getElementById("stat-score");
const statWave = document.getElementById("stat-wave");
const statKills = document.getElementById("stat-kills");
const statCombo = document.getElementById("stat-combo");

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle("is-active", key === name);
  });
}

//=====================================================================//
//  UTILITIES
//=====================================================================//
const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

//Every sprite goes through here, which is what makes rotation, scale and
//fading possible at all — drawImage(x, y) alone cannot express any of it.
//`flash` brightens the sprite by drawing it again additively: ctx.filter
//would be simpler, but Safari did not support it until 16.4.
function drawSprite(image, x, y, w, h, opts) {
  const o = opts || {};
  const rot = o.rot || 0;
  const sx = o.sx === undefined ? 1 : o.sx;
  const sy = o.sy === undefined ? 1 : o.sy;
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  const flash = o.flash || 0;

  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.translate(x + w / 2, y + h / 2);
  if (rot) ctx.rotate(rot);
  if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
  ctx.drawImage(image, -w / 2, -h / 2, w, h);
  if (flash > 0) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = clamp(flash, 0, 1);
    ctx.drawImage(image, -w / 2, -h / 2, w, h);
    ctx.drawImage(image, -w / 2, -h / 2, w, h);
  }
  ctx.restore();
}

function overlaps(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

//=====================================================================//
//  GAME STATE
//=====================================================================//
let state = "menu"; // menu | playing | paused | gameover
let animationId = null;
let lastFrameTime = 0;
let chosenHero = "wanda";

let player, bullets, enemyShots, enemies, powerUps, particles, floatTexts;
let boss, spawnQueue, heroes;
let corpses, pops, bossDying, boltArcs;
let hitStop, slowMo, timeScale;
let nextEnemyId = 0;

let score, kills, combo, bestCombo, wave, stonesHp;
let waveElapsed, waveBanner, betweenWaves, betweenTimer;
let shake, flash, elapsed, grootTimer, grootStanding, chitFrame, chitTimer;
let stars;

function heroDef() {
  return HEROES[chosenHero];
}

function speedMultiplier() {
  return Math.min(
    CONFIG.difficulty.speedCap,
    1 + CONFIG.difficulty.speedStep * (wave - 1)
  );
}

function comboMultiplier() {
  return Math.min(
    CONFIG.combo.max,
    1 + Math.floor(combo / CONFIG.combo.killsPerStep)
  );
}

function makeStars() {
  const out = [];
  for (let i = 0; i < 110; i++) {
    const depth = Math.ceil(rand(1, 3));
    out.push({
      x: rand(0, W),
      y: rand(0, H),
      depth,
      size: depth === 1 ? 2.4 : depth === 2 ? 1.6 : 1,
      speed: depth === 1 ? 260 : depth === 2 ? 150 : 80,
    });
  }
  return out;
}

function resetGame() {
  const sprite = img[heroDef().sprite];
  player = {
    x: 60,
    y: H / 2 - sprite.height / 2,
    w: sprite.width,
    h: sprite.height,
    lives: CONFIG.player.lives,
    invuln: 0,
    cooldown: 0,
    rapid: 0,
    shield: 0,
    bank: 0, //current tilt, eased toward the input each frame
    recoil: 0, //1 right after firing, decaying to 0
    charge: 0, //ultimate meter, 0 → CONFIG.ult.max
    hex: 0, //Wanda: seconds of slowed time remaining
    ignition: 0, //Captain Marvel: seconds of beam remaining
  };

  bullets = [];
  enemyShots = [];
  enemies = [];
  powerUps = [];
  particles = [];
  floatTexts = [];
  heroes = [];
  boss = null;
  spawnQueue = [];
  corpses = [];
  pops = [];
  boltArcs = [];
  bossDying = null;
  hitStop = 0;
  slowMo = 0;
  timeScale = 1;

  score = 0;
  kills = 0;
  combo = 0;
  bestCombo = 1;
  wave = 0;
  stonesHp = CONFIG.stones.maxHp;

  waveElapsed = 0;
  waveBanner = null;
  betweenWaves = false;
  betweenTimer = 0;

  shake = 0;
  flash = null;
  elapsed = 0;
  grootTimer = 0;
  grootStanding = true;
  chitFrame = 0;
  chitTimer = 0;
  stars = makeStars();

  startWave(1);
}

//=====================================================================//
//  WAVES
//=====================================================================//
function startWave(n) {
  wave = n;
  waveElapsed = 0;
  betweenWaves = false;
  spawnQueue = [];

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

function banner(title, subtitle, color) {
  waveBanner = { title, subtitle, color, life: 2.4, maxLife: 2.4 };
}

function spawnEnemy(typeName) {
  const def = ENEMY_TYPES[typeName];
  const sprite = img[def.sprite];
  const y = rand(10, H - sprite.height - 10);
  //Bigger, tougher enemies appear from further out so they read as a threat.
  const hpBonus = Math.floor((wave - 1) / CONFIG.difficulty.hpEveryWaves);
  enemies.push({
    id: nextEnemyId++,
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

function summonThanos() {
  const size = 250;
  boss = {
    x: W + 120,
    y: H / 2 - size / 2,
    w: size,
    h: size,
    hp: 40 + wave * 8,
    maxHp: 40 + wave * 8,
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

function waveIsClear() {
  return (
    spawnQueue.length === 0 &&
    enemies.length === 0 &&
    boss === null &&
    bossDying === null
  );
}

//=====================================================================//
//  EFFECTS
//=====================================================================//
function burst(x, y, color, count, power) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(60, power);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(0.3, 0.8),
      maxLife: 0.8,
      size: rand(2, 5),
      color,
    });
  }
}

//A killed enemy hands its sprite to a corpse that spins, grows and fades,
//so a kill reads as an event rather than a disappearance.
function spawnCorpse(enemy, sprite) {
  corpses.push({
    sprite,
    x: enemy.x,
    y: enemy.y,
    w: enemy.w,
    h: enemy.h,
    t: 0,
    dur: CONFIG.anim.deathTime,
    spin: rand(-2.6, 2.6),
    driftX: -enemy.speed * 0.35,
    driftY: rand(-70, 70),
  });
}

//An expanding ring, used wherever something is collected or detonates.
function pop(x, y, color, radius) {
  pops.push({ x, y, color, r: radius, t: 0, dur: 0.35 });
}

function floatText(x, y, text, color) {
  floatTexts.push({ x, y, text, color, life: 1 });
}

function addShake(amount) {
  shake = Math.min(26, shake + amount);
}

function screenFlash(color, strength) {
  flash = { color, alpha: strength };
}

//=====================================================================//
//  ULTIMATES
//=====================================================================//
function chargeUlt(amount) {
  if (!player) return;
  player.charge = Math.min(CONFIG.ult.max, player.charge + amount);
}

function ultReady() {
  return player && player.charge >= CONFIG.ult.max;
}

//Wanda's hex slows the whole battlefield; everything that moves reads this.
function enemySpeedScale() {
  return player && player.hex > 0 ? CONFIG.ult.hexSlow : 1;
}

function fireUlt() {
  if (!ultReady()) return;
  player.charge = 0;
  const kind = heroDef().ult;
  banner(heroDef().ultName, "", heroDef().tint);
  playSfx(audioBalls, 0.4);

  if (kind === "hex") {
    player.hex = CONFIG.ult.hexDuration;
    screenFlash("#e0457b", 0.4);
    addShake(14);
    //A ring of chaos energy thrown outward from her
    for (let i = 0; i < 5; i++) {
      pop(player.x + player.w / 2, player.y + player.h / 2, "#e0457b", 90 + i * 70);
    }
    burst(player.x + player.w / 2, player.y + player.h / 2, "#e0457b", 60, 460);
  } else if (kind === "ignition") {
    player.ignition = CONFIG.ult.ignitionDuration;
    screenFlash("#f0b323", 0.38);
    addShake(16);
    burst(player.x + player.w / 2, player.y + player.h / 2, "#f0b323", 50, 420);
  } else {
    //God Blast: lightning arcs to everything on screen at once
    godBlast();
  }
}

function godBlast() {
  screenFlash("#ffffff", 0.5);
  addShake(26);
  slowMo = 0.5;
  const from = { x: player.x + player.w, y: player.y + player.h / 2 };
  boltArcs = [];

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
  enemies = enemies.filter((e) => e.hp > 0);

  if (boss) {
    boltArcs.push({
      from,
      to: { x: boss.x + boss.w / 2, y: boss.y + boss.h / 2 },
      t: 0,
      dur: 0.45,
    });
    damageBoss(CONFIG.ult.godBlastDamage * 2, boss.x, boss.y + boss.h / 2);
  }
}

//The lane-clearing beam is a moving hitbox, so it needs updating per frame.
function updateIgnition(dt) {
  if (player.ignition <= 0) return;
  player.ignition = Math.max(0, player.ignition - dt);

  const beam = {
    x: player.x + player.w,
    y: player.y + player.h * 0.18,
    w: W,
    h: player.h * 0.64,
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
  enemies = enemies.filter((e) => e.hp > 0);
  if (boss && overlaps(boss, beam)) damageBoss(dt * 26, boss.x, boss.y + boss.h / 2);
}

//=====================================================================//
//  INPUT
//=====================================================================//
const heldKeys = new Set();

document.addEventListener("keydown", (event) => {
  const movement = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  if (movement.includes(event.code) || event.code === "KeyS") {
    heldKeys.add(event.code);
    event.preventDefault();
  }

  if (event.code === "Space") {
    event.preventDefault(); //Space scrolls the page otherwise
    if (state === "playing") fireUlt();
  }

  if (event.code === "KeyM") toggleMute();

  if (event.code === "Escape" && (state === "playing" || state === "paused")) {
    togglePause();
  }

  if (event.code === "KeyW" && state === "playing") assembleTheWomen();
});

document.addEventListener("keyup", (event) => heldKeys.delete(event.code));

//Losing focus mid-run should pause, not hand you a silent death.
window.addEventListener("blur", () => {
  heldKeys.clear();
  if (state === "playing") togglePause();
});

//=====================================================================//
//  THE EASTER EGG
//=====================================================================//
function assembleTheWomen() {
  if (heroes.length) return;
  const roster = [
    "valkiria",
    "rescuePotts",
    "mantis",
    "okoye",
    "wasp",
    "shuri",
    "gamora",
    "marvel",
  ];
  roster.forEach((name, i) => {
    const sprite = img[name];
    heroes.push({
      sprite,
      x: -sprite.width - i * 70,
      y: (H / (roster.length + 1)) * (i + 1) - sprite.height / 2,
      w: sprite.width,
      h: sprite.height,
      speed: 420 + i * 18,
    });
  });
  banner("ASSEMBLE", "", "#f0b323");
  playSfx(audioBalls);
}

//=====================================================================//
//  UPDATE
//=====================================================================//
function update(dt) {
  elapsed += dt;
  waveElapsed += dt;

  updatePlayer(dt);
  updateSpawning(dt);
  updateEnemies(dt);
  updateBoss(dt);
  updateBossDeath(dt);
  updateBullets(dt);
  updatePowerUps(dt);
  updateHeroes(dt);
  updateDressing(dt);
  updateEffects(dt);

  //Wave cleared → breather → next wave
  if (!betweenWaves && waveIsClear()) {
    betweenWaves = true;
    betweenTimer = 2.2;
    const bonus = 100 * wave;
    score += bonus;
    floatText(W / 2 - 60, H / 2, `WAVE CLEAR +${bonus}`, "#4ade80");
  }
  if (betweenWaves) {
    betweenTimer -= dt;
    if (betweenTimer <= 0) startWave(wave + 1);
  }

  if (stonesHp <= 0 || player.lives <= 0) endGame();
}

function updatePlayer(dt) {
  const step = CONFIG.player.speed * dt;
  const m = CONFIG.player.margin;
  const up = heldKeys.has("ArrowUp");
  const down = heldKeys.has("ArrowDown");
  if (up) player.y -= step;
  if (down) player.y += step;
  if (heldKeys.has("ArrowLeft")) player.x -= step;
  if (heldKeys.has("ArrowRight")) player.x += step;

  //Bank into the turn, level out when the keys are released
  const targetBank = (down ? 1 : 0) - (up ? 1 : 0);
  player.bank +=
    (targetBank * CONFIG.anim.bankAngle - player.bank) *
    Math.min(1, dt * CONFIG.anim.bankEase);
  player.recoil = Math.max(
    0,
    player.recoil - dt * CONFIG.anim.recoilDecay
  );
  player.y = clamp(player.y, m, H - player.h - m);
  player.x = clamp(player.x, m, W - player.w - m);

  player.invuln = Math.max(0, player.invuln - dt);
  player.shield = Math.max(0, player.shield - dt);
  player.rapid = Math.max(0, player.rapid - dt);
  player.hex = Math.max(0, player.hex - dt);
  player.cooldown -= dt;
  updateIgnition(dt);

  if (heldKeys.has("KeyS") && player.cooldown <= 0) fire();
}

function fire() {
  const hero = heroDef();
  const [bw, bh] = hero.bulletSize;
  player.cooldown =
    hero.cooldown * (player.rapid > 0 ? CONFIG.powerUp.rapidFactor : 1);
  player.recoil = 1;
  bullets.push({
    x: player.x + player.w - 10,
    y: player.y + player.h / 2 - bh / 2,
    w: bw,
    h: bh,
    dmg: hero.damage,
    pierce: hero.pierce || 0,
    struck: new Set(),
  });
  //muzzle flash
  burst(player.x + player.w, player.y + player.h / 2, hero.tint, 5, 150);
  playSfx(audioBalls, 0.12);
}

function updateSpawning(dt) {
  while (spawnQueue.length && spawnQueue[0].at <= waveElapsed) {
    spawnEnemy(spawnQueue.shift().type);
  }
}

function damageEnemy(enemy, amount, hitX, hitY) {
  enemy.hp -= amount;
  enemy.hitFlash = 0.12;
  if (enemy.hp > 0) {
    burst(hitX, hitY, "#ffd27f", 5, 180);
    return false;
  }

  combo++;
  bestCombo = Math.max(bestCombo, comboMultiplier());
  kills++;
  const gained = enemy.def.points * comboMultiplier();
  score += gained;
  burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ff8a3d", 22, 340);
  floatText(enemy.x + enemy.w / 2, enemy.y, `+${gained}`, "#f0b323");
  addShake(2.5);
  spawnCorpse(enemy, enemySprite(enemy));
  //Freezing everything for a few frames is the cheapest way to make a hit
  //land. Kept short so the game never feels like it is stuttering.
  hitStop = Math.max(hitStop, CONFIG.anim.hitStop);
  chargeUlt(CONFIG.ult.chargePerKill);
  maybeDropPowerUp(enemy);
  return true;
}

function maybeDropPowerUp(enemy) {
  if (Math.random() > CONFIG.powerUp.dropChance) return;
  const kinds = ["rapid", "shield", "blast"];
  powerUps.push({
    kind: kinds[Math.floor(rand(0, kinds.length))],
    x: enemy.x + enemy.w / 2,
    y: enemy.y + enemy.h / 2,
    w: CONFIG.powerUp.size,
    h: CONFIG.powerUp.size,
    bob: rand(0, Math.PI * 2),
  });
}

function enemyLeaked(enemy) {
  stonesHp -= enemy.def.leak;
  combo = 0;
  addShake(9);
  screenFlash("#a855f7", 0.4);
  //Right of the Stones bar, clear of the power-up timers stacked above it.
  floatText(410, H - 46, `-${enemy.def.leak}`, "#c084fc");
}

function updateEnemies(dt) {
  const survivors = [];

  for (const enemy of enemies) {
    enemy.x -= enemy.speed * dt * enemySpeedScale();
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    enemy.spawnT = Math.min(1, enemy.spawnT + dt / CONFIG.anim.spawnIn);
    enemy.bob += dt * 3.4;
    if (enemy.def.weave) {
      enemy.phase += dt * 2.2;
      enemy.y = clamp(
        enemy.baseY + Math.sin(enemy.phase) * enemy.def.weave,
        0,
        H - enemy.h
      );
    }

    //Off the left edge — the Stones take the hit
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
    if (overlaps(enemy, player)) {
      hitPlayer();
      burst(enemy.x, enemy.y, "#ff4d4d", 18, 300);
      continue;
    }

    survivors.push(enemy);
  }

  enemies = survivors;
}

function updateBoss(dt) {
  if (!boss) return;
  boss.hitFlash = Math.max(0, boss.hitFlash - dt);

  if (boss.entering) {
    boss.x -= 240 * dt;
    if (boss.x <= W - boss.w - 70) {
      boss.x = W - boss.w - 70;
      boss.entering = false;
    }
  } else {
    boss.phase += dt;
    boss.y = H / 2 - boss.h / 2 + Math.sin(boss.phase * 0.9) * (H / 2 - boss.h / 2 - 20);

    boss.fireTimer -= dt;
    //The last 0.6s before a shot is a visible wind-up: he swells, the aura
    //tightens and motes converge on him. It makes the fight readable.
    const WINDUP = 0.6;
    boss.windup = boss.fireTimer < WINDUP ? 1 - boss.fireTimer / WINDUP : 0;
    if (boss.windup > 0 && Math.random() < 0.5) {
      const a = rand(0, Math.PI * 2);
      const r = boss.w * 0.9;
      particles.push({
        x: boss.x + boss.w / 2 + Math.cos(a) * r,
        y: boss.y + boss.h / 2 + Math.sin(a) * r,
        vx: -Math.cos(a) * 260,
        vy: -Math.sin(a) * 260,
        life: 0.32,
        maxLife: 0.32,
        size: rand(2, 4),
        color: "#c084fc",
      });
    }

    if (boss.fireTimer <= 0) {
      boss.fireTimer = clamp(1.7 - wave * 0.05, 0.7, 1.7);
      boss.windup = 0;
      boss.lunge = 1;
      const cy = boss.y + boss.h / 2;
      const targetY = player.y + player.h / 2;
      const dy = clamp((targetY - cy) * 1.2, -260, 260);
      enemyShots.push({
        x: boss.x,
        y: cy - 14,
        w: 30,
        h: 28,
        vx: -680,
        vy: dy,
      });
      burst(boss.x, cy, "#c084fc", 14, 280);
      addShake(5);
    }
    boss.lunge = Math.max(0, boss.lunge - dt * 4);
    boss.knock = Math.max(0, boss.knock - dt * 6);

    boss.spawnTimer -= dt;
    if (boss.spawnTimer <= 0) {
      boss.spawnTimer = 2.4;
      spawnEnemy(Math.random() < 0.5 ? "outrider" : "ultron");
    }
  }

  for (const bullet of bullets) {
    if (bullet.spent) continue;
    if (overlaps(boss, bullet)) {
      bullet.spent = true;
      damageBoss(bullet.dmg, bullet.x, bullet.y + bullet.h / 2);
      if (!boss) return;
    }
  }

  if (overlaps(boss, player)) hitPlayer();
}

function damageBoss(amount, hitX, hitY) {
  if (!boss) return;
  boss.hp -= amount;
  boss.hitFlash = 0.1;
  boss.knock = 1; //visibly shoved back by the hit
  chargeUlt(CONFIG.ult.chargePerBossHit);
  burst(hitX, hitY, "#ffd27f", 6, 200);
  if (boss.hp > 0) return;

  const gained = 1000 * wave;
  score += gained;
  kills++;
  floatText(boss.x + 40, boss.y + boss.h / 2, `+${gained}`, "#f0b323");
  addShake(24);
  screenFlash("#ffffff", 0.45);
  //He does not vanish: he comes apart in slow motion over a second and a half
  bossDying = {
    x: boss.x,
    y: boss.y,
    w: boss.w,
    h: boss.h,
    t: 0,
    dur: 1.6,
    nextBurst: 0,
    spin: rand(-0.7, 0.7),
  };
  slowMo = CONFIG.anim.bossSlowMo;
  hitStop = Math.max(hitStop, 0.12);
  boss = null;
}

function updateBossDeath(dt) {
  if (!bossDying) return;
  bossDying.t += dt;
  bossDying.nextBurst -= dt;
  if (bossDying.nextBurst <= 0) {
    bossDying.nextBurst = 0.13;
    burst(
      bossDying.x + rand(20, bossDying.w - 20),
      bossDying.y + rand(20, bossDying.h - 20),
      Math.random() < 0.5 ? "#c084fc" : "#ffd27f",
      26,
      420
    );
    addShake(6);
  }
  if (bossDying.t >= bossDying.dur) {
    burst(
      bossDying.x + bossDying.w / 2,
      bossDying.y + bossDying.h / 2,
      "#ffffff",
      70,
      620
    );
    pop(bossDying.x + bossDying.w / 2, bossDying.y + bossDying.h / 2, "#c084fc", 420);
    bossDying = null;
  }
}

function updateBullets(dt) {
  for (const b of bullets) b.x += CONFIG.bullet.speed * dt;
  bullets = bullets.filter((b) => !b.spent && b.x < W + 60);

  const shotScale = enemySpeedScale();
  for (const s of enemyShots) {
    s.x += s.vx * dt * shotScale;
    s.y += s.vy * dt * shotScale;
    if (overlaps(s, player)) {
      s.spent = true;
      hitPlayer();
    }
  }
  enemyShots = enemyShots.filter(
    (s) => !s.spent && s.x + s.w > -40 && s.y < H + 60 && s.y + s.h > -60
  );
}

function updatePowerUps(dt) {
  for (const p of powerUps) {
    p.x -= CONFIG.powerUp.driftSpeed * dt;
    p.bob += dt * 3;
    if (overlaps(p, player)) {
      p.taken = true;
      const colors = { rapid: "#f0b323", shield: "#38bdf8", blast: "#ff3b3f" };
      pop(p.x + p.w / 2, p.y + p.h / 2, colors[p.kind], 90);
      applyPowerUp(p.kind);
    }
  }
  powerUps = powerUps.filter((p) => !p.taken && p.x + p.w > 0);
}

function applyPowerUp(kind) {
  playSfx(audioBalls, 0.3);
  if (kind === "rapid") {
    player.rapid = CONFIG.powerUp.rapidDuration;
    floatText(player.x, player.y - 10, "RAPID FIRE", "#f0b323");
  } else if (kind === "shield") {
    player.shield = CONFIG.powerUp.shieldDuration;
    floatText(player.x, player.y - 10, "SHIELD", "#38bdf8");
  } else {
    floatText(player.x, player.y - 10, "BLAST", "#ff3b3f");
    screenFlash("#ffffff", 0.4);
    addShake(16);
    for (const enemy of [...enemies]) {
      damageEnemy(enemy, 999, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
    }
    enemies = [];
  }
  burst(player.x + player.w / 2, player.y + player.h / 2, "#ffffff", 20, 300);
}

function updateHeroes(dt) {
  for (const h of heroes) h.x += h.speed * dt;
  heroes = heroes.filter((h) => h.x < W + 120);
}

function hitPlayer() {
  if (player.invuln > 0 || player.shield > 0) return;
  player.lives--;
  player.invuln = CONFIG.player.invulnAfterHit;
  combo = 0;
  addShake(18);
  screenFlash("#ff2b2b", 0.45);
  burst(player.x + player.w / 2, player.y + player.h / 2, "#ff4d4d", 34, 420);
}

function updateDressing(dt) {
  grootTimer += dt;
  if (grootTimer >= 0.45) {
    grootStanding = !grootStanding;
    grootTimer = 0;
  }
  chitTimer += dt;
  if (chitTimer >= 1 / 7) {
    chitFrame = (chitFrame + 1) % 3;
    chitTimer = 0;
  }
  for (const star of stars) {
    star.x -= star.speed * dt;
    if (star.x < -4) {
      star.x = W + 4;
      star.y = rand(0, H);
    }
  }
}

function updateEffects(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 220 * dt;
    p.life -= dt;
  }
  particles = particles.filter((p) => p.life > 0);

  for (const t of floatTexts) {
    t.y -= 46 * dt;
    t.life -= dt;
  }
  floatTexts = floatTexts.filter((t) => t.life > 0);

  for (const c of corpses) {
    c.t += dt;
    c.x += c.driftX * dt;
    c.y += c.driftY * dt;
  }
  corpses = corpses.filter((c) => c.t < c.dur);

  for (const o of pops) o.t += dt;
  pops = pops.filter((o) => o.t < o.dur);

  for (const a of boltArcs) a.t += dt;
  boltArcs = boltArcs.filter((a) => a.t < a.dur);

  shake = Math.max(0, shake - 60 * dt);
  if (flash) {
    flash.alpha -= dt * 3.4;
    if (flash.alpha <= 0) flash = null;
  }
  if (waveBanner) {
    waveBanner.life -= dt;
    if (waveBanner.life <= 0) waveBanner = null;
  }
}

//=====================================================================//
//  DRAW
//=====================================================================//
function draw() {
  ctx.save();
  if (shake > 0) {
    ctx.translate(rand(-shake, shake) * 0.5, rand(-shake, shake) * 0.5);
  }

  //bg.png is a single painted scene, not a tile, so scrolling it shows a
  //hard seam at the wrap. It stays put; the starfield supplies the motion.
  ctx.drawImage(img.bg, 0, 0, W, H);

  drawStars();
  drawSetDressing();

  //Power-ups
  for (const p of powerUps) drawPowerUp(p);

  //The women assembling
  for (const h of heroes) ctx.drawImage(h.sprite, h.x, h.y, h.w, h.h);

  //Enemies, their remains, and the boss
  for (const c of corpses) drawCorpse(c);
  for (const enemy of enemies) drawEnemy(enemy);
  if (boss) drawBoss();
  if (bossDying) drawBossDeath();

  //Bullets
  for (const b of bullets) drawBullet(b);
  for (const s of enemyShots) drawEnemyShot(s);

  if (player.ignition > 0) drawIgnitionBeam();
  drawPlayer();
  drawBoltArcs();
  drawParticles();
  for (const o of pops) drawPop(o);
  drawFloatTexts();

  ctx.restore();

  drawHud();
  drawBanner();

  if (flash) {
    ctx.fillStyle = flash.color;
    ctx.globalAlpha = clamp(flash.alpha, 0, 1);
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

function drawStars() {
  for (const star of stars) {
    ctx.fillStyle = star.depth === 1 ? "rgba(255,255,255,.85)" : "rgba(180,200,255,.5)";
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
}

function drawSetDressing() {
  //Groot dancing, the Chitauri patrol, Spidey and Stan Lee — all the cameos
  //Kept clear of the Infinity Stones bar, which owns the bottom-left.
  ctx.drawImage(img.spiderman, 430, H - 290);
  ctx.drawImage(grootStanding ? img.grootLeft : img.grootRight, 500, H - 98);
  ctx.drawImage([img.chit2, img.chit3, img.chit4][chitFrame], 620, H - 98);
  ctx.drawImage(img.stanLee, 750, H - 98);
}

function enemySprite(enemy) {
  return enemy.def.animated
    ? [img.chit2, img.chit3, img.chit4][chitFrame]
    : img[enemy.def.sprite];
}

function drawEnemy(enemy) {
  const sprite = enemySprite(enemy);
  //Ease the spawn so it arrives rather than appears
  const t = enemy.spawnT;
  const ease = 1 - (1 - t) * (1 - t);
  //hitFlash peaks at 0.12, so this squashes by about a fifth on impact
  const squash = enemy.hitFlash * 1.7;
  const hexed = player && player.hex > 0;

  drawSprite(
    sprite,
    enemy.x,
    enemy.y + Math.sin(enemy.bob) * 3,
    enemy.w,
    enemy.h,
    {
      rot: Math.sin(enemy.bob * 0.7) * 0.07 + (hexed ? Math.sin(elapsed * 9) * 0.12 : 0),
      sx: (0.55 + 0.45 * ease) * (1 + squash),
      sy: (0.55 + 0.45 * ease) * (1 - squash * 0.8),
      alpha: ease,
      flash: enemy.hitFlash * 7 + (hexed ? 0.22 : 0),
    }
  );

  //A slim health bar, only once it has actually taken a hit
  if (enemy.maxHp > 1 && enemy.hp < enemy.maxHp) {
    const pct = enemy.hp / enemy.maxHp;
    ctx.fillStyle = "rgba(0,0,0,.6)";
    ctx.fillRect(enemy.x, enemy.y - 8, enemy.w, 4);
    ctx.fillStyle = pct > 0.5 ? "#4ade80" : pct > 0.25 ? "#f0b323" : "#ff3b3f";
    ctx.fillRect(enemy.x, enemy.y - 8, enemy.w * pct, 4);
  }
}

function drawBoss() {
  //Breathing idle, swelling on the wind-up, shoved right by each hit,
  //lunging left as he releases a blast.
  const breath = Math.sin(elapsed * 2) * 0.018;
  const swell = boss.windup * 0.09;
  drawSprite(
    img.thanos,
    boss.x + boss.knock * 10 - boss.lunge * 22,
    boss.y,
    boss.w,
    boss.h,
    {
      sx: 1 + swell + breath,
      sy: 1 + swell - breath,
      rot: boss.lunge * -0.05,
      flash: boss.hitFlash * 6 + boss.windup * 0.5,
    }
  );

  //Aura: tightens and brightens as the blast charges
  ctx.save();
  ctx.strokeStyle = `rgba(192,132,252,${0.45 + boss.windup * 0.5})`;
  ctx.lineWidth = 3 + boss.windup * 4;
  ctx.beginPath();
  ctx.arc(
    boss.x + boss.w / 2,
    boss.y + boss.h / 2,
    boss.w / 2 + 8 + Math.sin(elapsed * 3) * 5 - boss.windup * 18,
    0,
    Math.PI * 2
  );
  ctx.stroke();
  ctx.restore();
}

function drawBossDeath() {
  const p = bossDying.t / bossDying.dur;
  drawSprite(img.thanos, bossDying.x, bossDying.y, bossDying.w, bossDying.h, {
    rot: bossDying.spin * p,
    sx: 1 - p * 0.25,
    sy: 1 - p * 0.25,
    alpha: 1 - p * 0.9,
    //Flickering white as he comes apart
    flash: (1 - p) * (0.5 + Math.sin(elapsed * 30) * 0.4),
  });
}

function drawEnemyShot(s) {
  const cx = s.x + s.w / 2;
  const cy = s.y + s.h / 2;
  const grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, s.w);
  grd.addColorStop(0, "#ffffff");
  grd.addColorStop(0.4, "#c084fc");
  grd.addColorStop(1, "rgba(168,85,247,0)");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, s.w, 0, Math.PI * 2);
  ctx.fill();
}

function drawPowerUp(p) {
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2 + Math.sin(p.bob) * 5;
  const colors = { rapid: "#f0b323", shield: "#38bdf8", blast: "#ff3b3f" };
  const letters = { rapid: "R", shield: "S", blast: "B" };

  ctx.save();
  ctx.shadowColor = colors[p.kind];
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(8,10,18,.9)";
  ctx.beginPath();
  ctx.arc(cx, cy, p.w / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = colors[p.kind];
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = colors[p.kind];
  ctx.font = "28px Marvel";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letters[p.kind], cx, cy + 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawPlayer() {
  //Blink while invulnerable so the state is readable
  const blinking = player.invuln > 0 && Math.floor(elapsed * 14) % 2 === 0;
  if (!blinking) {
    const r = player.recoil;
    drawSprite(
      img[heroDef().sprite],
      player.x - r * CONFIG.anim.recoilPx,
      player.y,
      player.w,
      player.h,
      {
        rot: player.bank,
        //Squash on the way back from the recoil, and flare while ignited
        sx: 1 + r * 0.14,
        sy: 1 - r * 0.1,
        flash: r * 0.4 + (player.ignition > 0 ? 0.7 : 0),
      }
    );
  }
  //Wanda wears her hex while it is running
  if (player.hex > 0) {
    ctx.save();
    ctx.strokeStyle = `rgba(224,69,123,${0.5 + Math.sin(elapsed * 6) * 0.25})`;
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(
        player.x + player.w / 2,
        player.y + player.h / 2,
        player.w * (0.7 + i * 0.28),
        elapsed * (2 + i) ,
        elapsed * (2 + i) + Math.PI * 1.2
      );
      ctx.stroke();
    }
    ctx.restore();
  }
  if (player.shield > 0) {
    ctx.strokeStyle = `rgba(56,189,248,${0.45 + Math.sin(elapsed * 8) * 0.2})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w * 0.8,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }
}

function drawCorpse(c) {
  const p = c.t / c.dur;
  drawSprite(c.sprite, c.x, c.y, c.w, c.h, {
    rot: c.spin * p,
    sx: 1 + p * 0.45,
    sy: 1 + p * 0.45,
    alpha: 1 - p,
    flash: (1 - p) * 0.5,
  });
}

function drawPop(o) {
  const p = o.t / o.dur;
  ctx.save();
  ctx.globalAlpha = 1 - p;
  ctx.strokeStyle = o.color;
  ctx.lineWidth = 4 * (1 - p) + 1;
  ctx.beginPath();
  ctx.arc(o.x, o.y, o.r * p, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

//Thor's God Blast: a jagged polyline redrawn every frame, so it crackles.
function drawBoltArcs() {
  for (const a of boltArcs) {
    const fade = 1 - a.t / a.dur;
    const dx = a.to.x - a.from.x;
    const dy = a.to.y - a.from.y;
    const steps = 9;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.strokeStyle = "#e0f2fe";
    ctx.shadowColor = "#7dd3fc";
    ctx.shadowBlur = 18;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(a.from.x, a.from.y);
    for (let i = 1; i < steps; i++) {
      const k = i / steps;
      ctx.lineTo(
        a.from.x + dx * k + rand(-26, 26),
        a.from.y + dy * k + rand(-26, 26)
      );
    }
    ctx.lineTo(a.to.x, a.to.y);
    ctx.stroke();
    ctx.restore();
  }
}

//Captain Marvel's beam, drawn as stacked glows so it reads as heat.
function drawIgnitionBeam() {
  const y = player.y + player.h / 2;
  const fade = Math.min(1, player.ignition * 2);
  const x = player.x + player.w;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const [h, alpha] of [[player.h * 0.62, 0.25], [player.h * 0.3, 0.5], [10, 0.95]]) {
    ctx.globalAlpha = alpha * fade;
    const grd = ctx.createLinearGradient(x, 0, W, 0);
    grd.addColorStop(0, "#ffffff");
    grd.addColorStop(0.25, "#f0b323");
    grd.addColorStop(1, "rgba(240,179,35,0.15)");
    ctx.fillStyle = grd;
    ctx.fillRect(x, y - h / 2 + Math.sin(elapsed * 40) * 2, W - x, h);
  }
  ctx.restore();
}

function drawBullet(b) {
  const hero = heroDef();
  const sprite = img[hero.bullet];
  //Three fading ghosts behind each shot read as motion blur
  for (let i = 3; i >= 1; i--) {
    drawSprite(sprite, b.x - i * 20, b.y, b.w, b.h, { alpha: 0.14 * (4 - i) });
  }
  if (hero.ult === "godblast") {
    //Thor's bolts flicker and stretch along their travel
    drawSprite(sprite, b.x, b.y, b.w, b.h, {
      sx: 1.18 + Math.sin(elapsed * 45) * 0.16,
      sy: 0.92,
      flash: 0.35 + Math.sin(elapsed * 38) * 0.25,
    });
  } else if (hero.ult === "hex") {
    drawSprite(sprite, b.x, b.y, b.w, b.h, { rot: elapsed * 11 });
  } else {
    drawSprite(sprite, b.x, b.y, b.w, b.h, { flash: 0.2 });
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawFloatTexts() {
  ctx.font = "30px Marvel";
  ctx.textAlign = "center";
  for (const t of floatTexts) {
    ctx.globalAlpha = clamp(t.life, 0, 1);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

//=====================================================================//
//  HUD
//=====================================================================//
function drawHud() {
  //Top strip
  ctx.fillStyle = "rgba(5,6,10,.55)";
  ctx.fillRect(0, 0, W, 64);

  //Lives, as little hero portraits
  const icon = img[heroDef().sprite];
  const iconH = 34;
  const iconW = (icon.width / icon.height) * iconH;
  for (let i = 0; i < player.lives; i++) {
    ctx.drawImage(icon, 20 + i * (iconW + 8), 14, iconW, iconH);
  }

  //Score and combo
  ctx.font = "36px Marvel";
  ctx.textAlign = "right";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${score}`, W - 24, 44);
  ctx.font = "22px Marvel";
  ctx.fillStyle = "#9aa3b2";
  ctx.fillText("SCORE", W - 24, 62);

  const mult = comboMultiplier();
  if (mult > 1) {
    ctx.font = "32px Marvel";
    ctx.fillStyle = "#f0b323";
    ctx.fillText(`COMBO x${mult}`, W - 150, 44);
  }

  //Wave, tucked in beside the lives so the centre stays free for the boss bar
  ctx.textAlign = "left";
  ctx.font = "32px Marvel";
  ctx.fillStyle = "#ff3b3f";
  ctx.fillText(`WAVE ${wave}`, 20 + player.lives * (iconW + 8) + 24, 42);

  drawStonesBar();
  drawUltMeter();
  if (boss) drawBossBar();
  drawActivePowerUps();
}

function drawUltMeter() {
  const hero = heroDef();
  const barW = 250;
  const x = W - barW - 24;
  const y = H - 42;
  const pct = clamp(player.charge / CONFIG.ult.max, 0, 1);
  const ready = pct >= 1;

  ctx.save();
  ctx.fillStyle = "rgba(5,6,10,.7)";
  ctx.fillRect(x, y, barW, 18);
  //Pulse the fill once it is spendable
  ctx.fillStyle = hero.tint;
  ctx.globalAlpha = ready ? 0.75 + Math.sin(elapsed * 8) * 0.25 : 1;
  ctx.fillRect(x, y, barW * pct, 18);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, barW, 18);
  ctx.restore();

  ctx.font = "20px Marvel";
  ctx.textAlign = "right";
  ctx.fillStyle = ready ? hero.tint : "#9aa3b2";
  ctx.fillText(ready ? `${hero.ultName} — SPACE` : hero.ultName, x + barW, y - 6);
  ctx.textAlign = "left";
}

function drawStonesBar() {
  const x = 24;
  const y = H - 56;
  const barW = 320;
  const barH = 22;
  const pct = clamp(stonesHp / CONFIG.stones.maxHp, 0, 1);

  ctx.drawImage(img.gaunlet, x, y - 24, 44, 44);

  ctx.fillStyle = "rgba(5,6,10,.7)";
  ctx.fillRect(x + 56, y - 12, barW, barH);
  const grd = ctx.createLinearGradient(x + 56, 0, x + 56 + barW, 0);
  grd.addColorStop(0, "#a855f7");
  grd.addColorStop(0.5, "#38bdf8");
  grd.addColorStop(1, "#f0b323");
  ctx.fillStyle = pct > 0.3 ? grd : "#ff3b3f";
  ctx.fillRect(x + 56, y - 12, barW * pct, barH);
  ctx.strokeStyle = "rgba(255,255,255,.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 56, y - 12, barW, barH);

  ctx.font = "20px Marvel";
  ctx.fillStyle = "#d7dbe4";
  ctx.fillText("INFINITY STONES", x + 56, y - 20);
}

function drawBossBar() {
  const barW = 620;
  const x = W / 2 - barW / 2;
  const pct = clamp(boss.hp / boss.maxHp, 0, 1);

  ctx.fillStyle = "rgba(5,6,10,.75)";
  ctx.fillRect(x, 78, barW, 26);
  ctx.fillStyle = "#a855f7";
  ctx.fillRect(x, 78, barW * pct, 26);
  ctx.strokeStyle = "rgba(255,255,255,.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, 78, barW, 26);

  ctx.font = "24px Marvel";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("THANOS", W / 2, 98);
  ctx.textAlign = "left";
}

function drawActivePowerUps() {
  let y = H - 96;
  ctx.font = "22px Marvel";
  if (player.rapid > 0) {
    ctx.fillStyle = "#f0b323";
    ctx.fillText(`RAPID FIRE ${player.rapid.toFixed(1)}s`, 24, y);
    y -= 26;
  }
  if (player.shield > 0) {
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`SHIELD ${player.shield.toFixed(1)}s`, 24, y);
  }
}

function drawBanner() {
  if (!waveBanner) return;
  const t = waveBanner.life / waveBanner.maxLife;
  const alpha = t > 0.8 ? (1 - t) / 0.2 : Math.min(1, t / 0.35);
  //Progress through the entry, used to slam the text in past its final size
  const entry = clamp((1 - t) / 0.18, 0, 1);
  const scale = entry < 1 ? 2.6 - 1.6 * (1 - (1 - entry) * (1 - entry)) : 1;

  //Cinematic bars, opening and closing with the banner
  const barH = 54 * clamp(Math.min(entry * 2, alpha * 1.4), 0, 1);
  ctx.save();
  ctx.fillStyle = "rgba(5,6,10,.72)";
  ctx.fillRect(0, H / 2 - 108, W, barH);
  ctx.fillRect(0, H / 2 + 108 - barH, W, barH);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.textAlign = "center";
  ctx.translate(W / 2, H / 2 - 20);
  ctx.scale(scale, scale);
  ctx.font = "90px Marvel";
  ctx.fillStyle = waveBanner.color;
  ctx.shadowColor = waveBanner.color;
  ctx.shadowBlur = 30;
  ctx.fillText(waveBanner.title, 0, 0);
  if (waveBanner.subtitle) {
    ctx.font = "38px Marvel";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(waveBanner.subtitle, 0, 54);
  }
  ctx.restore();
  ctx.textAlign = "left";
}

//=====================================================================//
//  LOOP + SCREEN FLOW
//=====================================================================//
function frame(now) {
  if (state !== "playing") return;
  const realDt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;

  //Hit-stop: hold the world still for a few frames, but keep drawing so the
  //freeze reads as impact rather than a dropped frame.
  if (hitStop > 0) {
    hitStop -= realDt;
    draw();
    animationId = requestAnimationFrame(frame);
    return;
  }

  //Slow motion for the boss death, easing back to full speed afterwards.
  if (slowMo > 0) {
    slowMo -= realDt;
    timeScale = CONFIG.anim.slowMoScale;
  } else {
    timeScale = Math.min(1, timeScale + realDt * 1.8);
  }
  const dt = realDt * timeScale;

  update(dt);
  //update() can end the run; don't draw a frame of a dead game
  if (state === "playing") {
    draw();
    animationId = requestAnimationFrame(frame);
  }
}

function startRun() {
  resetGame();
  showScreen("game");
  state = "playing";
  lastFrameTime = performance.now();
  animationId = requestAnimationFrame(frame);
  playMusic();
}

function togglePause() {
  if (state === "playing") {
    state = "paused";
    if (animationId !== null) cancelAnimationFrame(animationId);
    animationId = null;
    pauseOverlay.classList.add("is-visible");
    audio.pause();
  } else if (state === "paused") {
    state = "playing";
    pauseOverlay.classList.remove("is-visible");
    lastFrameTime = performance.now();
    animationId = requestAnimationFrame(frame);
    playMusic();
  }
}

function endGame() {
  state = "gameover";
  if (animationId !== null) cancelAnimationFrame(animationId);
  animationId = null;
  pauseOverlay.classList.remove("is-visible");

  gameOverTitle.innerText =
    stonesHp <= 0
      ? "THEY TOOK THE STONES"
      : "YOU SHOULD HAVE GONE FOR THE HEAD";
  countUp(statScore, score);
  countUp(statWave, wave, 0.6);
  countUp(statKills, kills, 0.75);
  countUp(statCombo, bestCombo, 0.6, "x");

  showScreen("gameover");
  audio.pause();
}

//=====================================================================//
//  AUDIO
//=====================================================================//
const MUSIC_START_SECONDS = 96;
let muted = false;

const audio = new Audio(
  "./assets/Alan Silvestri - Portals (From Avengers EndgameAudio Only).mp3"
);
audio.volume = 0.22;
audio.loop = true;

const audioBalls = new Audio("./assets/ballsSound.mp3");

audio.addEventListener("loadedmetadata", function () {
  this.currentTime = MUSIC_START_SECONDS;
});

//Browsers reject play() until the page has been interacted with, and an
//unhandled rejection surfaces as a console error.
function playSafely(sound) {
  const attempt = sound.play();
  if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
}

function playMusic() {
  if (muted) return;
  playSafely(audio);
}

//Short effects need to overlap, so each one plays on its own clone.
function playSfx(sound, volume = 0.25) {
  if (muted) return;
  const shot = sound.cloneNode();
  shot.volume = volume;
  playSafely(shot);
}

function toggleMute() {
  muted = !muted;
  muteBtn.classList.toggle("is-muted", muted);
  if (muted) audio.pause();
  else if (state === "playing") playMusic();
}

//=====================================================================//
//  BOOT
//=====================================================================//
heroCards.forEach((card) => {
  card.addEventListener("click", () => {
    heroCards.forEach((c) => c.classList.remove("is-selected"));
    card.classList.add("is-selected");
    chosenHero = card.dataset.character;
    playSfx(audioBalls, 0.3);
  });
});

startBtn.addEventListener("click", startRun);
retryBtn.addEventListener("click", startRun);
menuBtn.addEventListener("click", () => {
  state = "menu";
  showScreen("menu");
});
muteBtn.addEventListener("click", toggleMute);

//Wrap each letter of the title so it can be animated in one at a time.
function splitTitle() {
  const title = document.querySelector(".game-title");
  if (!title) return;
  const text = title.textContent;
  title.textContent = "";
  [...text].forEach((character, i) => {
    const span = document.createElement("span");
    span.className = "ch";
    span.style.setProperty("--i", i);
    span.textContent = character;
    title.appendChild(span);
  });
}

//Numbers that tick up read as earned; numbers that appear read as given.
function countUp(el, target, duration = 0.9, prefix = "") {
  const start = performance.now();
  function step(now) {
    const p = Math.min(1, (now - start) / (duration * 1000));
    const eased = 1 - Math.pow(1 - p, 3);
    el.innerText = prefix + Math.round(target * eased);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

window.addEventListener("load", () => {
  splitTitle();
  const bar = document.querySelector("#loading-bar span");
  loadImages((progress) => {
    if (bar) bar.style.width = `${Math.round(progress * 100)}%`;
  }).then(() => {
    startBtn.disabled = false;
    startBtn.innerText = "START";
    document.getElementById("loading-bar").classList.add("is-done");
    document.body.dataset.assetsReady = "true";
  });
});
