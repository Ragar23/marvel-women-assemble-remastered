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
  bossEvery: 5,
  //Wave 5 is Ultron — the enemy of the original 2021 game — and wave 10 is
  //Thanos. After that they alternate, each turn tougher than the last.
  bossOrder: ["ultron", "thanos"],
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
  //With the shield away he closes in and fights. Short reach, so he has to
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
    boltDamage: 9,
    boltCooldown: 0.42,
    boltArcRange: 260, //lightning forks to anything within this of a hit
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
    emptySprite: "thorEmpty",
    bullet: "mjolnir",
    bulletSize: [54, 48],
    damage: CONFIG_MJOLNIR_DAMAGE,
    cooldown: 0.12, //only gates the throw; the flight time is the real cooldown
    throwsMjolnir: true,
    tint: "#7dd3fc",
    ult: "godblast",
    ultName: "GOD BLAST",
  },
  cap: {
    sprite: "cap",
    //Shown while the shield is away, so he is not still holding it
    emptySprite: "capEmpty",
    worthySprite: "capWorthy",
    bullet: "lightning",
    bulletSize: [128, 68],
    damage: 4,
    cooldown: 0.12,

    tint: "#4d82d6",
    shootRate: 0.95,
    ult: "worthy",
    ultName: "WORTHY",
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
  //The Black Order. Each is an event rather than a statistic: a name, a
  //visible health bar from the moment it arrives, and its own behaviour.
  nebula: {
    sprite: "nebula", speed: 300, hp: 10, points: 160, leak: 14,
    elite: true, name: "NEBULA", tint: "#7dd3fc",
    //Blinks forward in bursts, so she closes distance unpredictably
    behaviour: "blink", blinkGap: 1.5, blinkDist: 150,
  },
  proxima: {
    sprite: "proxima", speed: 240, hp: 12, points: 190, leak: 16,
    elite: true, name: "PROXIMA MIDNIGHT", tint: "#f0abfc",
    //Hangs back and throws spears at wherever you are
    behaviour: "spear", spearGap: 1.6, weave: 70,
  },
  corvus: {
    sprite: "corvus", speed: 250, hp: 13, points: 200, leak: 16,
    elite: true, name: "CORVUS GLAIVE", tint: "#a5b4fc",
    //Lines up with you, then charges
    behaviour: "charge", chargeSpeed: 1500, chargeWindup: 0.55, chargeGap: 2.2,
  },
  cull: {
    sprite: "cull", speed: 170, hp: 20, points: 240, leak: 22,
    elite: true, name: "CULL OBSIDIAN", tint: "#fbbf24",
    //Armoured: shrugs off most damage until the plating is broken open
    behaviour: "armour", armour: 0.34, armourHp: 8,
  },
  levi: { sprite: "levi", speed: 265, hp: 9, points: 90, leak: 24 },
};

export const BOSSES = {
  ultron: {
    sprite: "ultron",
    name: "ULTRON",
    size: 200,
    hp: (wave) => 34 + wave * 6,
    tint: "#86efac",
    shotColor: "#4ade80",
    //Fires a spread and builds more of himself
    shots: 3,
    spread: 150,
    fireGap: 1.5,
    minion: "ultron",
    summonGap: 1.9,
    bobSpeed: 1.8, //restless, unlike Thanos's slow sweep
  },
  thanos: {
    sprite: "thanos",
    name: "THANOS",
    size: 250,
    hp: (wave) => 40 + wave * 8,
    tint: "#c084fc",
    shotColor: "#c084fc",
    shots: 1,
    spread: 0,
    fireGap: 1.7,
    minion: "outrider",
    summonGap: 2.4,
    bobSpeed: 0.9,
  },
};

//Which enemies each wave may draw from, and how many to send.
export const WAVE_PLAN = [
  { count: 20, mix: ["outrider"] },
  { count: 26, mix: ["outrider", "ultron"] },
  { count: 32, mix: ["outrider", "ultron", "chitauri"] },
  { count: 36, mix: ["outrider", "chitauri", "ultron"] },
  { count: 42, mix: ["outrider", "ultron", "chitauri", "levi"] },
  { count: 48, mix: ["ultron", "chitauri", "outrider", "levi"] },
];

//The Black Order arrive one at a time, on top of the ordinary wave, so each
//one lands as an event instead of being lost in the crowd.
export const ELITE_SCHEDULE = {
  3: ["nebula"],
  4: ["proxima"],
  6: ["corvus"],
  7: ["nebula", "proxima"],
  8: ["cull"],
  9: ["corvus", "cull"],
};

//=====================================================================//
//  ASSETS
