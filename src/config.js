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
  //The spell is the thing you are actually defending. The meter runs the
  //other way to the health bar it replaces: it starts at nothing and
  //everything that gets past you tears it a little wider. At `max` it
  //fails outright and everyone who ever knew comes through.
  incursion: {
    max: 100,
    //A wave cleared without a single thing getting through pushes it back.
    //It is the only way to give ground back, so holding the line is worth
    //more than killing quickly.
    holdReward: 9,
    //Where the sky changes and the seams start to show. Fractions of `max`.
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
  //Wave 5 is Octavius; wave 10 is the Goblin. They alternate after that,
  //each turn tougher than the last.
  bossOrder: ["ock", "goblin"],
  //Ultimates: a meter filled by kills, spent with Space.
  ult: {
    max: 100,
    chargePerKill: 4.5, //about 22 kills for a full bar
    chargePerBossHit: 1.2,
    hexDuration: 5, //Wanda: how long the world crawls
    hexSlow: 0.28, //enemies move at this fraction of their speed

    //---- the four this branch actually uses ----
    //Peter 1 pulls on the Iron Spider and fights with the legs for as long
    //as it holds. They out-reach his fists by a long way and hit everything
    //in the arc at once, which is the whole point of having four of them.
    ironSpiderDuration: 25,
    ironSpiderReach: 210,
    ironSpiderDamage: 6,
    ironSpiderCooldown: 0.13,
    //Peter 2's suit takes over. Anything the black web touches dies —
    //except the one thing the fight is actually about, which takes the
    //damage he would have done anyway.
    symbioteDuration: 25,
    symbioteBossDamage: 3,
    //Peter 3 does not suit up. He throws one thing, once, and the screen
    //is empty afterwards.
    webBombBossDamage: 26,
    //Strange stops them where they stand. Not slowed — stopped: nothing
    //moves, nothing tracks, nothing fires, and the wind-ups hold.
    stasisDuration: 15,
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
  //Three of the same man and the sorcerer who pulled them through. They
  //cannot be told apart by palette, so they are told apart the way the
  //film tells them apart: what each one does with his hands.
  holland: {
    sprite: "nwhHolland",
    bullet: "web",
    bulletSize: [76, 34],
    damage: 2,
    cooldown: 0.16,
    //The web leaves the shooter at the wrist, not the middle of his chest.
    barrels: [-0.06],
    melee: true, //and he closes in, the way Shuri and Captain America do
    tint: "#e63946",
    shootRate: 1.15,
    ult: "ironspider",
    ultName: "IRON SPIDER",
  },
  maguire: {
    sprite: "nwhMaguire",
    bullet: "web",
    bulletSize: [76, 34],
    damage: 2,
    cooldown: 0.14,
    //His shooter is organic and already raised, so the shot leaves high.
    barrels: [-0.24],
    tint: "#3b82f6",
    ult: "symbiote",
    ultName: "THE SYMBIOTE",
  },
  garfield: {
    sprite: "nwhGarfield",
    bullet: "web",
    bulletSize: [76, 34],
    damage: 3,
    cooldown: 0.2,
    range: 460, //he throws heavier and shorter, so he has to close in
    melee: true,
    barrels: [-0.04],
    tint: "#38bdf8",
    ult: "webbomb",
    ultName: "WEB BOMB",
  },
  strange: {
    sprite: "nwhStrange",
    bullet: "mandala",
    bulletSize: [64, 30],
    damage: 3,
    cooldown: 0.22,
    pierce: 2, //a bolt of the spell goes through more than one of them
    tint: "#f0b429",
    shootRate: 0.9,
    ult: "stasis",
    ultName: "MIRROR DIMENSION",
  },
};

//baseSpeed px/s, hp, points, damage to the spell when it gets through
export const ENEMY_TYPES = {
  //The Goblin's drones: small, quick, and there are a lot of them.
  drone: { sprite: "nwhDrone", speed: 400, height: 66, hp: 2, points: 12, leak: 8 },
  //A manned glider does not weave past — line up with it and it winds up,
  //then commits. Standing in a lane is a decision rather than the game.
  glider: {
    sprite: "nwhGlider", speed: 560, height: 74, hp: 3, points: 18, leak: 8, weave: 140,
    behaviour: "charge", chargeWindup: 0.45, chargeSpeed: 1000, chargeGap: 2.4,
    //And a razor bat off the rail as it comes. `throws` is read for any
    //enemy, whatever else it is doing, so it does not have to fight the
    //one behaviour slot the charge already occupies.
    throws: { sprite: "nwhBat", gap: 2.8, first: 1.4, speed: 430, size: 34, spin: 9 },
  },
  //A tentacle on its own, off the harness and still working. It walks to
  //its line, tracks you while it decides, locks, and burns a lane.
  ockArm: {
    sprite: "nwhOckArm", speed: 300, height: 116, hp: 5, points: 34, leak: 10,
    tint: "#7dd3fc",
    behaviour: "beam", holdAt: 0.66,
    beamGap: 2.3, //tracking you, deciding
    beamCharge: 0.85, //locked, and drawn as a hairline
    beamTime: 0.5, //the lane is lethal for this long
    beamHeight: 26,
    //It holds for this many shots and then walks on. One that stopped for
    //good would let a late wave stack six across the screen.
    beamShots: 2,
  },
  symbiote: {
    sprite: "nwhSymbiote1", speed: 430, height: 82, hp: 2, points: 20, leak: 9,
    frames: ["nwhSymbiote1", "nwhSymbiote2", "nwhSymbiote3"],
  },
  //The three the spell pulled in by name. `holdAt` is a fraction of the
  //screen width they will not walk past: they stop and fight, so the only
  //way past them is through.
  electro: {
    //Max Dillon walks in. He is a man until he reaches his line, and then
    //he is not — humanSprite is what he wears until that moment, and
    //humanHeight is how small a man is next to what he becomes.
    humanSprite: "nwhElectroHuman",
    humanHeight: 74,
    sprite: "nwhElectro", speed: 300, height: 96, hp: 20, points: 170,
    leak: 12, elite: true, name: "ELECTRO", tint: "#7dd3fc",
    //He arcs to where you are, so he gets much further in than the others.
    behaviour: "blink", blinkGap: 1.4, blinkDist: 160, holdAt: 0.34,
  },
  lizard: {
    sprite: "nwhLizard", speed: 250, height: 124, hp: 26, points: 190,
    leak: 13, elite: true, name: "THE LIZARD", tint: "#6ee7a0",
    behaviour: "spear", spearGap: 1.5, weave: 70, holdAt: 0.62,
  },
  sandman: {
    humanSprite: "nwhSandmanHuman",
    humanHeight: 76,
    sprite: "nwhSandman", speed: 175, height: 104, hp: 34, points: 240,
    leak: 16, elite: true, name: "SANDMAN", tint: "#fcd34d",
    //Bullets go through sand and it closes up again behind them.
    behaviour: "armour", armour: 0.34, armourHp: 9, holdAt: 0.5,
  },
};

export const BOSSES = {
  ock: {
    sprite: "nwhOck",
    name: "DOCTOR OCTOPUS",
    //He says it on arrival. Named on the boss rather than checked for by
    //name where he is summoned, so the Goblin can be given one too
    //without anything having to learn who is speaking.
    voice: "helloPeter",
    size: 230,
    hp: (wave) => 46 + wave * 8,
    tint: "#9fd8ff",
    shotColor: "#dceeff",
    shots: 3,
    spread: 150,
    fireGap: 1.5,
    minion: "glider",
    summonGap: 1.9,
    bobSpeed: 1.8, //restless, where the Goblin is deliberate
  },
  goblin: {
    sprite: "nwhGoblin",
    name: "GREEN GOBLIN",
    size: 250,
    hp: (wave) => 58 + wave * 9,
    tint: "#4ade80",
    shotColor: "#bbf7d0",
    //He does not hang in the middle bobbing: he flies at whatever height
    //Peter is at and stays on him, which is what makes him the fight the
    //film has rather than a turret with a health bar.
    seek: 220, //px/s he closes the gap in y
    //And what he throws is the pumpkin bomb off his own drawing.
    shotSprite: "nwhPumpkin",
    shotSize: 34,
    shots: 5,
    spread: 210,
    fireGap: 1.6,
    minion: "drone",
    summonGap: 2.2,
    bobSpeed: 1.0,
    //He is the one the film is actually about, so he is not Octavius with
    //different numbers. Three phases, entered on health, each a different
    //problem: a volley, a wall, and a clock.
    //
    //`at` is the health fraction at or below which the phase begins, so
    //they are listed from full health down.
    phases: [
      {
        at: 1,
        name: "NORMAN OSBORN",
        shots: 5, spread: 210, fireGap: 1.6, summonGap: 2.2,
      },
      {
        //He puts the glider between you and him. Nothing touches him until
        //it is broken, and he spends the time it buys filling the screen.
        at: 0.66,
        name: "THE GLIDER",
        ward: (wave) => 22 + wave * 2,
        shots: 6, spread: 260, fireGap: 1.15, summonGap: 1.3,
      },
      {
        //No more drones, no more patience. He stops trying to beat you and
        //starts tearing the spell open by hand, so the fight becomes a race
        //he wins by default if you let it run.
        at: 0.33,
        name: "THE GOBLIN",
        shots: 8, spread: 330, fireGap: 0.85, summonGap: 0,
        incursionPerSecond: 2.4,
      },
    ],
    //Breaking the glider leaves him open, and hitting him while he reels
    //hurts more. It is the whole reward for going through it.
    staggerTime: 1.8,
    staggerDamage: 1.85,
  },
};

//Which enemies each wave may draw from, and how many to send.
//Shorter waves than they were, and spawned further apart (see the gap in
//startWave). The difficulty was coming from how many were on screen at
//once rather than from any of them being worth fighting, and an elite
//arriving into a crowd of six was a death you could not read.
export const WAVE_PLAN = [
  { count: 16, mix: ["drone"] },
  { count: 20, mix: ["drone", "glider"] },
  //Tentacles from here on. One at a time at first: the wave has to teach
  //the telegraph before it starts stacking them.
  { count: 24, mix: ["drone", "glider", "symbiote", "ockArm"] },
  { count: 26, mix: ["drone", "symbiote", "glider", "ockArm"] },
  { count: 30, mix: ["drone", "glider", "symbiote", "ockArm"] },
  { count: 34, mix: ["glider", "symbiote", "ockArm", "drone"] },
];

//The named three arrive one at a time, on top of the ordinary wave, so
//each one lands as an event instead of being lost in the crowd.
//One at a time until late, and never three. Each of them is a fight on
//its own now — they hold their line and the only way past is through — so
//two at once is already both lanes, and three was the wall that made the
//late waves unplayable rather than hard.
export const ELITE_SCHEDULE = {
  3: ["electro"],
  4: ["lizard"],
  6: ["sandman"],
  7: ["lizard"],
  8: ["electro"],
  9: ["sandman", "lizard"],
};

//=====================================================================//
//  ASSETS
