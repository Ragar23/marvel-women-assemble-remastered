import { punch } from "./shield.js";

//=====================================================================//
export const CONFIG_MJOLNIR_DAMAGE = 6;

export const CONFIG = {
  player: {
    speed: 980,
    invulnAfterHit: 1.6,
    lives: 3,
    margin: 8,
    //Damage is taken on a box smaller than the sprite. Action poses carry
    //effects — a repulsor blast, thruster flames — inside their bounds, and
    //dying to the glow around a character is never the right answer. A
    //forgiving hitbox is also standard for the genre.
    hitScale: 0.58,
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
  //Stan Lee does not stand around: he wanders on, stops to wave, and goes.
  cameo: {
    minGap: 22,
    maxGap: 50,
    walkSpeed: 95,
    waveAt: 0.5, //dead centre, so he is clear of Groot from either side
    waveTime: 1.5,
  },
  bossEvery: 5,
  //Wave 5 is a Sentinel Prime; wave 10 is Doom himself. They alternate
  //after that, each turn tougher than the last.
  bossOrder: ["sentinelPrime", "doom"],
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
    //Iron Man: a swarm that arcs out, then hunts
    missileCount: 18,
    missileDamage: 3,
    missileSpeed: 700,
    missileTurn: 5.5, //radians per second of steering authority
    missileLife: 3.2,
  },
  //Captain America's throw, and the fifteen seconds where he puts the
  //shield down and picks up Mjolnir instead.
  shield: {
    damage: 4,
    //Slower forward and steeper vertically than the first attempt, which
    //only managed one bounce per throw and so never read as a ricochet.
    speed: 900,
    returnSpeed: 1500,
    //It leaves his hand at a steep angle, so the first wall comes fast and
    //the ricochet is visible from the outset.
    launchAngle: 0.95, //radians, alternating up and down
    //It steers like Mjolnir, and reflects off the top and bottom while it
    //does. Steering alone missed almost everything; bouncing alone was luck.
    turn: 4.2,
    //Steering alone flattened the flight into a straight line at the target
    //and it stopped bouncing altogether. A floor on the vertical component
    //keeps it crossing the screen while it closes, so it zig-zags toward
    //targets instead of flying at them.
    minSin: 0.5,
    maxHits: 5,
    outTime: 2.1,
  },
  //Captain America and Shuri both close in and fight. Short reach, so he has to
  //put himself in danger to use it — which is the point of him.
  punch: {
    damage: 6,
    cooldown: 0.19,
    reach: 108,
    height: 0.82, //fraction of his height the swing covers
    knockback: 300,
  },
  worthy: {
    duration: 15,
    //He throws Mjolnir itself while worthy, so the only extra is the
    //lightning that forks out of every strike he lands with it.
    forkRange: 260,
    forkDamage: 2,
  },
  //Thor throws Mjolnir instead of firing bolts. One hammer at a time, so
  //his rhythm is throw-and-wait rather than hold-to-spray, and each throw
  //hits far harder than a bolt did.
  mjolnir: {
    damage: 6,
    speed: 1050,
    turn: 7,
    maxHits: 3,
    outTime: 1.0, //comes back on its own if it finds nothing
    returnSpeed: 1350,
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

export const HEROES = {
  thor: {
    sprite: "ddThor",
    emptySprite: "ddThorEmpty",
    bullet: "stormbreaker",
    bulletSize: [60, 48],
    damage: CONFIG_MJOLNIR_DAMAGE,
    cooldown: 0.12,
    throwsMjolnir: true, //Stormbreaker uses the same throw-and-return
    tint: "#7dd3fc",
    ult: "godblast",
    ultName: "GOD BLAST",
  },
  cyclops: {
    sprite: "ddCyclops",
    bullet: "optic",
    bulletSize: [110, 42],
    damage: 2,
    cooldown: 0.24,
    pierce: 99, //the beam does not stop at the first thing it meets
    tint: "#ff4d4d",
    shootRate: 1.1,
    ult: "ignition",
    ultName: "OPTIC OVERLOAD",
  },
  shuri: {
    sprite: "ddShuri",
    bullet: "claw",
    bulletSize: [56, 48],
    damage: 2,
    cooldown: 0.2,
    range: 340, //kinetic pulses fade fast; she has to close in
    melee: true, //and she punches, the way Captain America does
    tint: "#c084fc",
    ult: "pantherblast",
    ultName: "KINETIC BLAST",
  },
  torch: {
    sprite: "ddTorch",
    worthySprite: "ddTorchFlame",
    bullet: "fire",
    bulletSize: [56, 48],
    damage: 2,
    cooldown: 0.13,
    tint: "#ff8a3d",
    shootRate: 1.25,
    ult: "flameon",
    ultName: "FLAME ON",
  },
};

//baseSpeed px/s, hp, points, stone damage when it gets through
export const ENEMY_TYPES = {
  //Sentinels replace the space dogs: slower, heavier, and there are a lot
  //of them.
  sentinel: { sprite: "ddSentinel", speed: 380, hp: 2, points: 12, leak: 8 },
  sentinelFast: {
    sprite: "ddSentinel", speed: 560, hp: 1, points: 16, leak: 8, weave: 140,
  },
  chitauri: { sprite: "chit2", speed: 430, hp: 2, points: 20, leak: 9, animated: true },
  levi: { sprite: "levi", speed: 265, hp: 9, points: 90, leak: 24 },

  //Doom's coven. Marvel has confirmed the Latverian Witches but not their
  //powers, so these are three distinct ideas built from the premise: a
  //hooded order serving Doom, blending Latverian sorcery.
  witchHex: {
    sprite: "ddWitchHex", speed: 250, hp: 12, points: 190, leak: 16,
    elite: true, name: "THE HEXWEAVER", tint: "#8cff96",
    behaviour: "spear", spearGap: 1.5, weave: 70,
  },
  witchVeil: {
    sprite: "ddWitchVeil", speed: 300, hp: 10, points: 170, leak: 14,
    elite: true, name: "THE VEILED", tint: "#cea0ff",
    behaviour: "blink", blinkGap: 1.4, blinkDist: 160,
  },
  witchWard: {
    sprite: "ddWitchWard", speed: 175, hp: 20, points: 240, leak: 22,
    elite: true, name: "THE WARDEN", tint: "#96dcff",
    behaviour: "armour", armour: 0.34, armourHp: 9,
  },
};

export const BOSSES = {
  sentinelPrime: {
    sprite: "ddSentinel",
    name: "SENTINEL PRIME",
    size: 230,
    hp: (wave) => 34 + wave * 6,
    tint: "#c084fc",
    shotColor: "#d0a0ff",
    shots: 3,
    spread: 150,
    fireGap: 1.5,
    minion: "sentinelFast",
    summonGap: 1.9,
    bobSpeed: 1.8, //restless, where Doom is deliberate
  },
  doom: {
    sprite: "ddDoom",
    name: "DOCTOR DOOM",
    size: 250,
    hp: (wave) => 44 + wave * 8,
    tint: "#4ade80",
    shotColor: "#86efac",
    //A wide green wave rather than a single bolt
    shots: 5,
    spread: 210,
    fireGap: 1.6,
    minion: "sentinel",
    summonGap: 2.2,
    bobSpeed: 1.0,
  },
};

//Which enemies each wave may draw from, and how many to send.
export const WAVE_PLAN = [
  { count: 20, mix: ["sentinel"] },
  { count: 26, mix: ["sentinel", "sentinelFast"] },
  { count: 32, mix: ["sentinel", "sentinelFast", "chitauri"] },
  { count: 36, mix: ["sentinel", "chitauri", "sentinelFast"] },
  { count: 42, mix: ["sentinel", "sentinelFast", "chitauri", "levi"] },
  { count: 48, mix: ["sentinelFast", "chitauri", "sentinel", "levi"] },
];

//The Black Order arrive one at a time, on top of the ordinary wave, so each
//one lands as an event instead of being lost in the crowd.
export const ELITE_SCHEDULE = {
  3: ["witchVeil"],
  4: ["witchHex"],
  6: ["witchWard"],
  7: ["witchVeil", "witchHex"],
  8: ["witchWard"],
  9: ["witchHex", "witchWard", "witchVeil"],
};

//=====================================================================//
//  ASSETS
