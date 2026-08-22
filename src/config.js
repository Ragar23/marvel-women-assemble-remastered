import { punch } from "./shield.js";

//=====================================================================//
export const CONFIG_MJOLNIR_DAMAGE = 6;

export const CONFIG = {
  player: {
    speed: 980,
    //Every hero is drawn this tall, whatever the source PNG measures.
    height: 96,
    invulnAfterHit: 1.6,
    lives: 3,
    //Three is enough to learn on and nowhere near enough to reach wave six
    //with, so they are earned back rather than being all you ever get: a
    //milestone every so many points, and the occasional drop outright. The
    //cap stops a good run from banking a dozen and coasting.
    maxLives: 5,
    extraLifeEvery: 5000,
    margin: 8,
    //Damage is taken on a box smaller than the sprite. Action poses carry
    //effects — a repulsor blast, thruster flames — inside their bounds, and
    //dying to the glow around a character is never the right answer. A
    //forgiving hitbox is also standard for the genre.
    hitScale: 0.58,
  },
  bullet: { speed: 1250 },
  //An incursion is two universes' Earths meeting, and both die when they
  //touch. The meter runs the other way to the health bar it replaces: it
  //starts at nothing and everything that gets past you brings the other
  //Earth closer. At `max` the two collide and the run is over.
  incursion: {
    max: 100,
    //A wave cleared without a single thing getting through pushes it back.
    //It is the only way to give ground back, so holding the line is worth
    //more than killing quickly.
    holdReward: 9,
    //Where the sky changes and reality starts to thin. Fractions of `max`.
    stages: [0.4, 0.75],
    //Every stage crossed makes everything on screen faster. The run gets
    //harder because you are losing, which is what a collapsing universe
    //ought to feel like.
    stageSpeed: 0.14,
  },
  combo: { killsPerStep: 6, max: 5 },
  powerUp: {
    dropChance: 0.14,
    //Weighted rather than picked evenly: a fourth kind on equal footing
    //would make an extra life one drop in four, and it is meant to be the
    //one you change course to reach.
    kinds: [
      ["rapid", 30],
      ["shield", 30],
      ["blast", 26],
      ["life", 8],
    ],
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
    //Cyclops' Optic Overload: the same beam he fires normally, opened all
    //the way up. It is his one screen-clearing window, so it stays open
    //long enough to sweep the lane rather than blinking past.
    ignitionDuration: 3.4, //beam uptime
    //Beam height as a fraction of his own, so it scales with the sprite.
    //Wider than he is tall: this is the blast with the visor off.
    ignitionWidth: 1.35,
    ignitionDamage: 999,
    //Shuri: the kinetic charge she dumps out does not stop at the
    //shockwave. It clings to her for these seconds afterwards, and burns
    //anything that closes while it does.
    pantherDuration: 5,
    pantherContactDamage: 999,
    //Thor: the God Blast no longer chips at the wave, it ends it. The sky
    //goes black and every enemy on screen takes a strike out of it.
    godBlastDamage: 999,
    stormDuration: 1.5, //how long the dark holds before the light comes back
    stormBossDamage: 40,
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
  //Stormbreaker never leaves his hand. Holding S earths a bolt through the
  //axe into whatever is nearest and jumps it on to the next thing along, so
  //his rhythm is a steady crackle rather than throw-and-wait.
  storm: {
    damage: 3,
    cooldown: 0.45,
    chain: 3, //how many it forks to in one strike
    range: 620, //and how far the fork will reach for the next one
    arcTime: 0.26, //how long each bolt stays drawn
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
    tint: "#7dd3fc",
    ult: "godblast",
    ultName: "GOD BLAST",
    //He is the only one who picks his weapon before the run, and the two
    //play differently rather than trading numbers: the axe never leaves his
    //hand and throws chained lightning off it, the hammer leaves and has to
    //come back before he can throw again. heroDef() folds the chosen one
    //over the base, so everything below can be overridden per weapon.
    weapons: {
      stormbreaker: {
        name: "STORMBREAKER",
        blurb: "Chained thunder",
        icon: "images/dd-stormbreaker.png",
        channelsStorm: true,
      },
      mjolnir: {
        name: "MJOLNIR",
        blurb: "Thrown, and it comes back",
        icon: "images/mjolnir.png",
        sprite: "ddThorMjolnir",
        bullet: "mjolnir",
        bulletSize: [54, 48],
        throwsMjolnir: true,
      },
    },
  },
  cyclops: {
    sprite: "ddCyclops",
    bullet: "optic",
    bulletSize: [110, 42],
    damage: 2,
    cooldown: 0.24,
    pierce: 99, //the beam does not stop at the first thing it meets
    //The optic blast leaves the visor, not the hand: the shot spawns this
    //far above the sprite's centre, as a fraction of its height. Measured
    //from the art — if you swap the sprite, re-measure the visor row.
    barrels: [-0.31],
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
    //Johnny out of costume-mode: the blue suit, no flame. He only lights
    //up when he actually throws fire.
    sprite: "ddTorch",
    //Held S cycles these, and so does Flame On — the difference is that
    //the ultimate keeps him alight without the key held down.
    flameFrames: ["ddTorchFlame1", "ddTorchFlame2", "ddTorchFlame3"],
    flameFps: 14,
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
  sentinel: { sprite: "ddSentinel", speed: 380, height: 100, hp: 2, points: 12, leak: 8 },
  //It no longer just weaves past: line up with it and it winds up, then
  //commits. Standing in a lane is a decision now rather than the whole game.
  sentinelFast: {
    sprite: "ddSentinel", speed: 560, height: 100, hp: 1, points: 16, leak: 8, weave: 140,
    behaviour: "charge", chargeWindup: 0.45, chargeSpeed: 980, chargeGap: 2.4,
  },
  //The one that stops and shoots back. It walks to its line, tracks you
  //while it decides, locks, and burns a lane. Everything it does is visible
  //before it happens — the hairline is a promise, not a warning.
  sentinelGunner: {
    sprite: "ddSentinelGunner", speed: 300, height: 104, hp: 5, points: 34, leak: 10,
    tint: "#a3e635",
    behaviour: "beam", holdAt: 0.66,
    beamGap: 2.3, //tracking you, deciding
    beamCharge: 0.85, //locked, and drawn as a hairline
    beamTime: 0.5, //the lane is lethal for this long
    beamHeight: 26,
    //It holds its line for this many shots and then walks on, unlike the
    //coven, who hold until they are killed. A gunner that stopped for good
    //would let a late wave stack six of them across the screen and stall
    //the run behind a wall no one asked for.
    beamShots: 2,
  },
  chitauri: { sprite: "chit2", speed: 430, height: 81, hp: 2, points: 20, leak: 9, animated: true },
  levi: { sprite: "levi", speed: 265, height: 250, hp: 9, points: 90, leak: 24 },

  //Doom's coven. Marvel has confirmed the Latverian Witches but not their
  //powers, so these are three distinct ideas built from the premise: a
  //hooded order serving Doom, blending Latverian sorcery.
  //`holdAt` is a fraction of the screen width the coven will not walk past.
  //They used to stroll off the left edge like everything else, which meant
  //the cheapest answer to a named elite with a health bar was to let it go.
  //They stop and fight now, so the only way past them is through.
  witchHex: {
    sprite: "ddWitchHex", speed: 250, height: 96, hp: 12, points: 190, leak: 16,
    elite: true, name: "THE HEXWEAVER", tint: "#8cff96",
    behaviour: "spear", spearGap: 1.5, weave: 70, holdAt: 0.62,
  },
  witchVeil: {
    sprite: "ddWitchVeil", speed: 300, height: 96, hp: 10, points: 170, leak: 14,
    elite: true, name: "THE VEILED", tint: "#cea0ff",
    //She blinks toward you, so she is allowed much further in than the
    //other two before the floor stops her.
    behaviour: "blink", blinkGap: 1.4, blinkDist: 160, holdAt: 0.34,
  },
  witchWard: {
    sprite: "ddWitchWard", speed: 175, height: 96, hp: 20, points: 240, leak: 22,
    elite: true, name: "THE WARDEN", tint: "#96dcff",
    behaviour: "armour", armour: 0.34, armourHp: 9, holdAt: 0.5,
  },
};

export const BOSSES = {
  sentinelPrime: {
    sprite: "ddSentinel",
    name: "SENTINEL PRIME",
    size: 230,
    hp: (wave) => 34 + wave * 6,
    //Green, now that the rank and file are steel with green optics rather
    //than purple. Acid rather than Doom's emerald, so the two bosses do not
    //read as the same fight.
    tint: "#a3e635",
    shotColor: "#d9f99d",
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
    //He is the film's villain and he was a Sentinel Prime with different
    //numbers. Three phases instead, entered on health and each one a
    //different problem: a volley, a wall, and a clock.
    //
    //`at` is the health fraction at or below which the phase begins, so
    //they are listed from full health down.
    phases: [
      {
        at: 1,
        name: "LATVERIA'S SORCERER",
        shots: 5, spread: 210, fireGap: 1.6, summonGap: 2.2,
      },
      {
        //He puts a window between you and him. Nothing touches him until it
        //is broken, and he spends the time it buys filling the screen.
        at: 0.66,
        name: "THE WARD",
        ward: (wave) => 22 + wave * 2,
        shots: 6, spread: 260, fireGap: 1.15, summonGap: 1.3,
      },
      {
        //No more minions, no more patience. He stops trying to beat you and
        //starts pulling the other Earth in by hand, so the fight becomes a
        //race he wins by default if you let it run.
        at: 0.33,
        name: "THE COLLAPSE",
        shots: 8, spread: 330, fireGap: 0.85, summonGap: 0,
        incursionPerSecond: 2.4,
      },
    ],
    //Breaking the ward leaves him open, and hitting him while he is reels
    //hurts more. It is the whole reward for going through it.
    staggerTime: 1.8,
    staggerDamage: 1.85,
  },
};

//Which enemies each wave may draw from, and how many to send.
export const WAVE_PLAN = [
  { count: 20, mix: ["sentinel"] },
  { count: 26, mix: ["sentinel", "sentinelFast"] },
  //Gunners from here on. One at a time at first: the wave has to teach the
  //telegraph before it starts stacking them.
  { count: 32, mix: ["sentinel", "sentinelFast", "chitauri", "sentinelGunner"] },
  { count: 36, mix: ["sentinel", "chitauri", "sentinelFast", "sentinelGunner"] },
  { count: 42, mix: ["sentinel", "sentinelFast", "chitauri", "sentinelGunner", "levi"] },
  { count: 48, mix: ["sentinelFast", "chitauri", "sentinelGunner", "sentinel", "levi"] },
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
