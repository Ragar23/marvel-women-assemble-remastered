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
    //Iron Man: a swarm that arcs out, then hunts
    missileCount: 18,
    missileDamage: 3,
    missileSpeed: 700,
    missileTurn: 5.5, //radians per second of steering authority
    missileLife: 3.2,
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
  wanda: {
    sprite: "wanda",
    bullet: "ball",
    bulletSize: [43, 36],
    damage: 2,
    cooldown: 0.22,
    tint: "#e0457b",
    shootRate: 0.85,
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
    shootRate: 1.35,
    ult: "ignition",
    ultName: "BINARY IGNITION",
  },
  thor: {
    sprite: "thor",
    bullet: "mjolnir",
    bulletSize: [54, 48],
    damage: CONFIG_MJOLNIR_DAMAGE,
    cooldown: 0.12, //only gates the throw; the flight time is the real cooldown
    throwsMjolnir: true,
    tint: "#7dd3fc",
    ult: "godblast",
    ultName: "GOD BLAST",
  },
  ironman: {
    sprite: "ironman",
    bullet: "repulsor",
    bulletSize: [40, 20],
    damage: 1,
    cooldown: 0.16,
    //Twin repulsors: one shot from each palm, so he covers a band rather
    //than a line. Offsets are fractions of his height.
    barrels: [-0.26, 0.26],
    ult: "barrage",
    ultName: "MICRO-MISSILES",
    tint: "#ff6b3d",
    shootRate: 1.15,
  },
};

//baseSpeed px/s, hp, points, stone damage when it gets through
export const ENEMY_TYPES = {
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
export const WAVE_PLAN = [
  { count: 20, mix: ["outrider"] },
  { count: 26, mix: ["outrider", "ultron"] },
  { count: 32, mix: ["outrider", "ultron", "chitauri"] },
  { count: 36, mix: ["outrider", "chitauri", "nebula", "cull"] },
  { count: 42, mix: ["outrider", "ultron", "chitauri", "proxima", "corvus"] },
  { count: 48, mix: ["ultron", "chitauri", "nebula", "corvus", "cull", "levi"] },
];

//=====================================================================//
//  ASSETS
