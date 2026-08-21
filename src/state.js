import { img } from "./assets.js";
import { H, W } from "./canvas.js";
import { CONFIG, HEROES } from "./config.js";
import { rand } from "./util.js";
import { startWave } from "./waves.js";

//=====================================================================//
//  GAME STATE
//
//  Arrays are exported as consts and mutated in place, because an imported
//  binding cannot be reassigned. Scalars are grouped into objects for the
//  same reason: `run.score = 0` works across modules, a bare `score = 0`
//  would not.
//=====================================================================//

//Which screen we are on, and the handles that drive the loop.
export const sess = {
  state: "menu", // menu | playing | paused | gameover
  animationId: null,
  lastFrameTime: 0,
  chosenHero: "wanda",
};

//Everything the scoreboard cares about; cleared on every new run.
export const run = {
  score: 0, kills: 0, combo: 0, bestCombo: 1, wave: 0, stonesHp: 0,
  waveElapsed: 0, betweenWaves: false, betweenTimer: 0,
};

//Presentation state: shake, flashes, timers, the animated set dressing.
export const fx = {
  shake: 0, flash: null, elapsed: 0, waveBanner: null,
  hitStop: 0, slowMo: 0, timeScale: 1,
  grootTimer: 0, grootStanding: true, chitFrame: 0, chitTimer: 0,
  stars: [],
};

//The singular actors.
export const world = {
  player: null, boss: null, bossDying: null, mjolnir: null, shield: null,
  nextEnemyId: 0,
};

export const bullets = [];
export const enemyShots = [];
export const enemies = [];
export const powerUps = [];
export const particles = [];
export const floatTexts = [];
export const heroes = [];
export const spawnQueue = [];
export const corpses = [];
export const pops = [];
export const boltArcs = [];
export const missiles = [];

//=====================================================================//

//The box the player takes damage on. Pickups deliberately use the full
//sprite bounds instead, so collecting a drop stays generous.
export function playerHitbox() {
  const s = CONFIG.player.hitScale;
  return {
    x: world.player.x + (world.player.w * (1 - s)) / 2,
    y: world.player.y + (world.player.h * (1 - s)) / 2,
    w: world.player.w * s,
    h: world.player.h * s,
  };
}

export function heroDef() {
  return HEROES[sess.chosenHero];
}

//Never hand canvas an undefined colour: assigning one to fillStyle is a
//silent no-op that leaves the previous colour in place, which paints the
//element in whatever was drawn before it.
export function heroTint() {
  return heroDef().tint || "#ffffff";
}

export function speedMultiplier() {
  return Math.min(
    CONFIG.difficulty.speedCap,
    1 + CONFIG.difficulty.speedStep * (run.wave - 1)
  );
}

export function comboMultiplier() {
  return Math.min(
    CONFIG.combo.max,
    1 + Math.floor(run.combo / CONFIG.combo.killsPerStep)
  );
}

export function makeStars() {
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

export function resetGame() {
  const sprite = img[heroDef().sprite];
  world.player = {
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
    worthy: 0, //Cap: seconds holding Mjolnir
    throwUp: false, //which way his next throw leaves his hand
    ignition: 0, //Captain Marvel: seconds of beam remaining
  };

  bullets.length = 0;
  enemyShots.length = 0;
  enemies.length = 0;
  powerUps.length = 0;
  particles.length = 0;
  floatTexts.length = 0;
  heroes.length = 0;
  world.boss = null;
  spawnQueue.length = 0;
  corpses.length = 0;
  pops.length = 0;
  boltArcs.length = 0;
  missiles.length = 0;
  world.mjolnir = null;
  world.shield = null;
  world.bossDying = null;
  fx.hitStop = 0;
  fx.slowMo = 0;
  fx.timeScale = 1;

  run.score = 0;
  run.kills = 0;
  run.combo = 0;
  run.bestCombo = 1;
  run.wave = 0;
  run.stonesHp = CONFIG.stones.maxHp;

  run.waveElapsed = 0;
  fx.waveBanner = null;
  run.betweenWaves = false;
  run.betweenTimer = 0;

  fx.shake = 0;
  fx.flash = null;
  fx.elapsed = 0;
  fx.grootTimer = 0;
  fx.grootStanding = true;
  fx.chitFrame = 0;
  fx.chitTimer = 0;
  fx.stars = makeStars();

  startWave(1);
}

//=====================================================================//
//  WAVES
