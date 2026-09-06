import { drawMissiles, ignitionBeam, weaponPoint } from "./abilities.js";
import { img } from "./assets.js";
import { H, W, ctx } from "./canvas.js";
import { CONFIG } from "./config.js";
import { drawBanner, drawHud, drawIncursionSky } from "./hud.js";
import { drawMjolnir } from "./mjolnir.js";
import { drawPunches, drawShield } from "./shield.js";
import { POWERUP_COLORS } from "./world.js";
import { boltArcs, bullets, corpses, enemies, enemyShots, floatTexts, fx, heroDef, heroTint, heroes, particles, pops, powerUps, world } from "./state.js";
import { clamp, drawSprite, rand } from "./util.js";

//=====================================================================//
export function draw() {
  ctx.save();
  if (fx.shake > 0) {
    ctx.translate(rand(-fx.shake, fx.shake) * 0.5, rand(-fx.shake, fx.shake) * 0.5);
  }

  //bg.png is a single painted scene, not a tile, so scrolling it shows a
  //hard seam at the wrap. It stays put; the starfield supplies the motion.
  ctx.drawImage(img.bg, 0, 0, W, H);

  drawStars();
  //The other Earth sits between the starfield and everything else: behind
  //the fight, in front of the painted backdrop.
  drawIncursionSky();
  drawSetDressing();

  //Power-ups
  for (const p of powerUps) drawPowerUp(p);

  //The women assembling
  for (const h of heroes) ctx.drawImage(h.sprite, h.x, h.y, h.w, h.h);

  //Enemies, their remains, and the boss
  for (const c of corpses) drawCorpse(c);
  for (const enemy of enemies) drawEnemy(enemy);
  for (const enemy of enemies) drawHeld(enemy);
  //Under the player and the bullets, so a lane full of beam never hides
  //where you actually are.
  drawEnemyBeams();
  if (world.boss) drawBoss();
  if (world.boss) drawHeld(world.boss);
  if (world.bossDying) drawBossDeath();

  //Bullets
  for (const b of bullets) drawBullet(b);
  for (const s of enemyShots) drawEnemyShot(s);

  drawMissiles();
  drawMjolnir();
  drawShield();
  drawPunches();
  if (world.player.ignition > 0) drawIgnitionBeam();
  drawPlayer();
  //The God Blast puts the lights out. It goes on after the world and the
  //player but before the lightning, so the bolts are the only thing left
  //burning — painted underneath them it would just grey the whole frame.
  if (fx.storm > 0) drawStormDark();
  drawBoltArcs();
  drawParticles();
  for (const o of pops) drawPop(o);
  drawFloatTexts();

  ctx.restore();

  drawHud();
  drawBanner();

  if (fx.flash) {
    ctx.fillStyle = fx.flash.color;
    ctx.globalAlpha = clamp(fx.flash.alpha, 0, 1);
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

export function drawStars() {
  for (const star of fx.stars) {
    ctx.fillStyle = star.depth === 1 ? "rgba(255,255,255,.85)" : "rgba(180,200,255,.5)";
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
}

export function drawSetDressing() {
  //A newsstand screen down at street level, cutting between the only two
  //things Jameson ever says about him. It sits clear of the spell meter.
  ctx.drawImage(fx.grootStanding ? img.grootLeft : img.grootRight, 500, H - 98);
  drawCameo();
}

function drawCameo() {
  const c = fx.cameo;
  if (!c) return;
  const waving = c.phase === "wave";
  //A small hop while he waves; he faces the way he is walking
  const hop = waving ? Math.abs(Math.sin(c.bob)) * 7 : Math.abs(Math.sin(c.bob * 0.5)) * 2;
  drawSprite(img.stanLee, c.x, H - 98 - hop, 90, 90, {
    sx: c.dir,
    rot: waving ? Math.sin(c.bob) * 0.12 : 0,
  });
}

export function enemySprite(enemy) {
  //Still the man he was: he wears his own face until he reaches the line.
  if (enemy.human && enemy.def.humanSprite) return img[enemy.def.humanSprite];
  //An animated enemy names its own frames. This used to be hard-coded to
  //the three Chitauri sprites, which meant only one enemy in the game
  //could ever be animated and only if it was that one.
  const frames = enemy.def.frames;
  return frames ? img[frames[fx.chitFrame % frames.length]] : img[enemy.def.sprite];
}

export function drawEnemy(enemy) {
  const sprite = enemySprite(enemy);
  //Ease the spawn so it arrives rather than appears
  const t = enemy.spawnT;
  const ease = 1 - (1 - t) * (1 - t);
  //hitFlash peaks at 0.12, so this squashes by about a fifth on impact
  const squash = enemy.hitFlash * 1.7;
  const hexed = world.player && world.player.hex > 0;

  drawSprite(
    sprite,
    enemy.x,
    enemy.y + Math.sin(enemy.bob) * 3,
    enemy.w,
    enemy.h,
    {
      rot: Math.sin(enemy.bob * 0.7) * 0.07 + (hexed ? Math.sin(fx.elapsed * 9) * 0.12 : 0),
      sx: (0.55 + 0.45 * ease) * (1 + squash),
      sy: (0.55 + 0.45 * ease) * (1 - squash * 0.8),
      alpha: ease,
      flash: enemy.hitFlash * 7 + (hexed ? 0.22 : 0),
    }
  );

  //The instant of the change: the new shape arrives blown out and
  //oversized and settles into itself over about half a second.
  if (enemy.changing > 0) {
    const k = enemy.changing;
    ctx.save();
    ctx.globalAlpha = k * 0.8;
    ctx.globalCompositeOperation = "lighter";
    drawSprite(sprite, enemy.x, enemy.y, enemy.w, enemy.h, {
      sx: 1 + k * 0.4,
      sy: 1 + k * 0.4,
      flash: 1,
    });
    ctx.restore();
  }

  //Elites carry their name and a bar from the moment they arrive — but
  //only once they are the elite. A man crossing the screen is not one.
  if (enemy.def.elite && !enemy.human) {
    ctx.font = "18px Marvel";
    ctx.textAlign = "center";
    ctx.fillStyle = enemy.def.tint;
    ctx.fillText(enemy.def.name, enemy.x + enemy.w / 2, enemy.y - 14);
    ctx.textAlign = "left";
    const pct = clamp(enemy.hp / enemy.maxHp, 0, 1);
    ctx.fillStyle = "rgba(0,0,0,.65)";
    ctx.fillRect(enemy.x - 6, enemy.y - 10, enemy.w + 12, 5);
    ctx.fillStyle = enemy.def.tint;
    ctx.fillRect(enemy.x - 6, enemy.y - 10, (enemy.w + 12) * pct, 5);
    //Cull's plating shows as a separate strip above his health
    if (enemy.def.behaviour === "armour" && !enemy.cracked) {
      const ap = clamp(enemy.plating / enemy.def.armourHp, 0, 1);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(enemy.x - 6, enemy.y - 17, (enemy.w + 12) * ap, 3);
    }
  } else if (enemy.maxHp > 1 && enemy.hp < enemy.maxHp) {
    const pct = enemy.hp / enemy.maxHp;
    ctx.fillStyle = "rgba(0,0,0,.6)";
    ctx.fillRect(enemy.x, enemy.y - 8, enemy.w, 4);
    ctx.fillStyle = pct > 0.5 ? "#4ade80" : pct > 0.25 ? "#f0b323" : "#ff3b3f";
    ctx.fillRect(enemy.x, enemy.y - 8, enemy.w * pct, 4);
  }
}

//A gunner's telegraph and its beam. The dashed hairline while it charges is
//drawn from exactly the numbers the hitbox will use, so what you dodge is
//what would have hit you.
export function drawEnemyBeams() {
  for (const enemy of enemies) {
    const b = enemy.beam;
    if (!b || b.phase === "track") continue;
    const def = enemy.def;
    const muzzle = enemy.x + enemy.w * 0.08;
    ctx.save();
    if (b.phase === "charge") {
      const k = 1 - b.t / def.beamCharge;
      ctx.globalAlpha = 0.35 + k * 0.55;
      ctx.strokeStyle = def.tint;
      ctx.lineWidth = 1 + k * 2;
      ctx.setLineDash([16, 12]);
      ctx.lineDashOffset = -fx.elapsed * 90;
      ctx.beginPath();
      ctx.moveTo(muzzle, b.aimY);
      ctx.lineTo(0, b.aimY);
      ctx.stroke();
    } else {
      //Stacked glows with a white core, and it thins as it dies
      const k = Math.min(1, b.t / (def.beamTime * 0.35));
      ctx.globalCompositeOperation = "lighter";
      for (const [h, alpha, color] of [
        [def.beamHeight, 0.28, def.tint],
        [def.beamHeight * 0.5, 0.5, def.tint],
        [def.beamHeight * 0.18, 0.95, "#ffffff"],
      ]) {
        ctx.globalAlpha = alpha * k;
        ctx.fillStyle = color;
        ctx.fillRect(0, b.aimY - (h * k) / 2 + Math.sin(fx.elapsed * 50) * 2, muzzle, h * k);
      }
    }
    ctx.restore();
  }
}

export function drawBoss() {
  //Breathing idle, swelling on the wind-up, shoved right by each hit,
  //lunging left as he releases a blast.
  const breath = Math.sin(fx.elapsed * 2) * 0.018;
  const swell = world.boss.windup * 0.09;
  drawSprite(
    img[world.boss.def.sprite],
    world.boss.x + world.boss.knock * 10 - world.boss.lunge * 22,
    world.boss.y,
    world.boss.w,
    world.boss.h,
    {
      sx: 1 + swell + breath,
      sy: 1 + swell - breath,
      rot: world.boss.lunge * -0.05,
      flash: world.boss.hitFlash * 6 + world.boss.windup * 0.5,
    }
  );

  //Staggered, he reels: shaken and washed out while the window is open
  if (world.boss.stagger > 0) {
    ctx.save();
    ctx.globalAlpha = 0.4 + Math.sin(fx.elapsed * 24) * 0.2;
    ctx.fillStyle = "#ffffff";
    ctx.globalCompositeOperation = "lighter";
    ctx.fillRect(world.boss.x, world.boss.y, world.boss.w, world.boss.h);
    ctx.restore();
  }

  if (world.boss.ward > 0) drawBossWard();

  //Aura: tightens and brightens as the blast charges
  ctx.save();
  ctx.strokeStyle = hexToRgba(world.boss.def.tint, 0.45 + world.boss.windup * 0.5);
  ctx.lineWidth = 3 + world.boss.windup * 4;
  ctx.beginPath();
  ctx.arc(
    world.boss.x + world.boss.w / 2,
    world.boss.y + world.boss.h / 2,
    world.boss.w / 2 + 8 + Math.sin(fx.elapsed * 3) * 5 - world.boss.windup * 18,
    0,
    Math.PI * 2
  );
  ctx.stroke();
  ctx.restore();
}

//The window he puts between you and him: a leaded hexagon in the green of
//the teaser's glass, panels and all. It thins as it takes damage, so how
//close it is to breaking is something you can see rather than a bar to read.
export function drawBossWard() {
  const b = world.boss;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const r = b.w * 0.72;
  const left = clamp(b.ward / b.wardMax, 0, 1);
  //Corners of the hexagon, point-up
  const corner = (i, radius) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius];
  };

  ctx.save();
  ctx.globalAlpha = 0.25 + left * 0.5 + Math.sin(fx.elapsed * 5) * 0.06;

  ctx.beginPath();
  ctx.moveTo(...corner(0, r));
  for (let i = 1; i < 6; i++) ctx.lineTo(...corner(i, r));
  ctx.closePath();
  const grd = ctx.createRadialGradient(cx, cy, r * 0.15, cx, cy, r);
  grd.addColorStop(0, "rgba(74,222,128,0.10)");
  grd.addColorStop(0.7, "rgba(46,168,74,0.28)");
  grd.addColorStop(1, "rgba(163,230,53,0.42)");
  ctx.fillStyle = grd;
  ctx.fill();

  //Leading: the frame, and the spokes that make it read as glass
  ctx.strokeStyle = `rgba(190,255,200,${0.5 + left * 0.5})`;
  ctx.lineWidth = 3 + left * 3;
  ctx.stroke();
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(...corner(i, r));
    ctx.stroke();
  }

  //Cracks, spreading from the rim inward as it goes
  if (left < 0.7) {
    ctx.strokeStyle = `rgba(255,255,255,${(0.7 - left) * 1.1})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const [ex, ey] = corner(i + 0.5, r * (0.55 + left * 0.4));
      ctx.beginPath();
      ctx.moveTo(...corner(i, r));
      ctx.lineTo(ex + Math.sin(fx.elapsed * 3 + i) * 4, ey);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export //Canvas has no colour-with-alpha helper, and the boss aura needs one.
function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function drawBossDeath() {
  const p = world.bossDying.t / world.bossDying.dur;
  drawSprite(img[world.bossDying.sprite], world.bossDying.x, world.bossDying.y, world.bossDying.w, world.bossDying.h, {
    rot: world.bossDying.spin * p,
    sx: 1 - p * 0.25,
    sy: 1 - p * 0.25,
    alpha: 1 - p * 0.9,
    //Flickering white as he comes apart
    flash: (1 - p) * (0.5 + Math.sin(fx.elapsed * 30) * 0.4),
  });
}

export function drawEnemyShot(s) {
  const cx = s.x + s.w / 2;
  const cy = s.y + s.h / 2;
  const grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, s.w);
  grd.addColorStop(0, "#ffffff");
  grd.addColorStop(0.4, s.color || "#c084fc");
  grd.addColorStop(1, "rgba(168,85,247,0)");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, s.w, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPowerUp(p) {
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2 + Math.sin(p.bob) * 5;
  const colors = POWERUP_COLORS;
  const letters = { rapid: "R", shield: "S", blast: "B", life: "1UP" };
  //"1UP" is three glyphs where the rest are one, so it needs its own size
  //or it runs straight out of the disc.
  const label = letters[p.kind];

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
  ctx.font = `${label.length > 1 ? 20 : 28}px Marvel`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy + 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

//Johnny is only alight while he is actually throwing fire — held S, or
//Flame On, which keeps him lit without it. Returns the frame to draw, or
//null for any hero who has no flame frames at all.
export function flameFrame(hero) {
  if (!hero.flameFrames) return null;
  if (world.player.firing <= 0 && world.player.worthy <= 0) return null;
  const i = Math.floor(fx.elapsed * (hero.flameFps || 12)) % hero.flameFrames.length;
  return hero.flameFrames[i];
}

//Which suit he is standing in. Both are drawn on the same grid as the
//sprite they replace, so this is a straight swap with nothing to correct.
function suitSprite(hero) {
  if (hero.ult === "ironspider" && world.player.ironSpider > 0) return "nwhHollandIron";
  if (hero.ult === "symbiote" && world.player.symbiote > 0) return "nwhMaguireSymbiote";
  return null;
}

//The Iron Spider's four legs. Kept out of the sprite and drawn here so
//they can move: at rest they arch back over his shoulders, and on a
//strike they snap forward through the arc that legStrike() just hit.
function drawSpiderLegs() {
  const p = world.player;
  const fade = Math.min(1, p.ironSpider * 2); //ease out over the last half-second
  const hx = p.x + p.w * 0.62;
  const hy = p.y + p.h * 0.42;
  const strike = p.legStrike; //1 → 0 across the swing
  //Ease so the snap out is fast and the recovery is slow
  const punch = strike > 0 ? Math.sin(Math.min(1, strike) * Math.PI) : 0;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < 4; i++) {
    //Two above, two below, fanned; the idle sway keeps them alive
    const spread = [-0.72, -0.3, 0.3, 0.72][i];
    const sway = Math.sin(fx.elapsed * 2.4 + i) * 0.06;
    const angle = spread + sway - punch * spread * 0.55;
    //Measured off the same constant the strike box uses, so what the legs
    //cover on screen is what they actually hit. This game telegraphs
    //honestly everywhere else; the legs do not get to be the exception.
    const reach = p.w * 0.85 + punch * (CONFIG.ult.ironSpiderReach - p.w * 0.35);

    //Elbow out and back, tip forward: a two-segment leg, not a spike
    const ex = hx + Math.cos(angle) * reach * 0.42 - p.w * 0.25 * (1 - punch);
    const ey = hy + Math.sin(angle) * reach * 0.62;
    const tx = hx + Math.cos(angle * 0.55) * reach;
    const ty = hy + Math.sin(angle * 0.9) * reach * 0.78;

    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(ex, ey);
    ctx.lineTo(tx, ty);
    ctx.strokeStyle = `rgba(240,178,52,${(0.85 + punch * 0.15) * fade})`;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,236,170,${0.5 * fade})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    //The tip, brightest at full extension
    ctx.fillStyle = `rgba(255,246,214,${(0.5 + punch * 0.5) * fade})`;
    ctx.beginPath();
    ctx.arc(tx, ty, 3.5 + punch * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

//The symbiote does not glow — it swallows light. A dark body under him
//and a few tendrils crawling off it, so the suit reads as alive.
function drawSymbioteAura() {
  const p = world.player;
  const fade = Math.min(1, p.symbiote * 2);
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  ctx.save();
  const grd = ctx.createRadialGradient(cx, cy, p.w * 0.25, cx, cy, p.w * 1.05);
  grd.addColorStop(0, `rgba(12,12,18,${0.5 * fade})`);
  grd.addColorStop(0.65, `rgba(24,24,34,${0.26 * fade})`);
  grd.addColorStop(1, "rgba(24,24,34,0)");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, p.w * 1.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(226,232,240,${0.3 * fade})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const a = fx.elapsed * (0.7 + i * 0.31) + i * 1.26;
    const r = p.w * (0.5 + 0.28 * Math.sin(fx.elapsed * 2 + i));
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(
      cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6,
      cx + Math.cos(a) * r, cy + Math.sin(a) * r
    );
    ctx.stroke();
  }
  ctx.restore();
}

//What being held looks like, on the thing being held: Strange's mandala,
//stopped dead. It does not rotate, and that is the whole point — every
//other ring in this game turns.
export function drawHeld(target) {
  const held = target.held;
  if (!held) return;
  const cx = target.x + target.w / 2;
  const cy = target.y + target.h / 2;
  const r = Math.max(target.w, target.h) * 0.62;
  ctx.save();
  ctx.globalAlpha = 0.75 * held;
  ctx.strokeStyle = "#f0b429";
  for (let ring = 0; ring < 2; ring++) {
    const rr = r * (1 - ring * 0.22);
    ctx.lineWidth = 2 - ring * 0.6;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
    //Spokes, fixed in place
    const spokes = 12 - ring * 4;
    ctx.beginPath();
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2;
      ctx.moveTo(cx + Math.cos(a) * rr * 0.82, cy + Math.sin(a) * rr * 0.82);
      ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPlayer() {
  const hero = heroDef();
  //Shuri's kinetic field and Johnny's flame both hold invulnerability open
  //for as long as they burn, and both draw an effect of their own. Blinking
  //through five and fifteen seconds of that would simply delete the hero
  //from the screen, so only the moment after a hit blinks.
  const aura =
    world.player.panther > 0 ||
    world.player.ironSpider > 0 ||
    world.player.symbiote > 0 ||
    (hero.ult === "flameon" && world.player.worthy > 0);
  //Blink while invulnerable so the state is readable
  const blinking =
    !aura && world.player.invuln > 0 && Math.floor(fx.elapsed * 14) % 2 === 0;
  if (!blinking) {
    const r = world.player.recoil;
    //Thor and Cap have their weapon in hand in the sprite, so while it is
    //in flight they need the empty-handed version instead.
    //Empty-handed whenever what he threw is still in the air — which now
    //includes Mjolnir, since Cap throws it too.
    const away = world.mjolnir || world.shield;
    const sprite = away
      ? hero.emptySprite || hero.sprite
      : suitSprite(hero) || flameFrame(hero) || hero.sprite;
    drawSprite(
      img[sprite],
      world.player.x - r * CONFIG.anim.recoilPx,
      world.player.y,
      world.player.w,
      world.player.h,
      {
        rot: world.player.bank,
        //Squash on the way back from the recoil, and flare while ignited
        sx: 1 + r * 0.14,
        sy: 1 - r * 0.1,
        flash: r * 0.4 + (world.player.ignition > 0 ? 0.7 : 0),
      }
    );
  }
  if (world.player.symbiote > 0) drawSymbioteAura();
  if (world.player.ironSpider > 0) drawSpiderLegs();

  //Shuri keeps the kinetic charge for a few seconds after she spends it:
  //counter-rotating arcs and a soft core, so it reads as a field she is
  //standing inside rather than a ring drawn on top of her.
  if (world.player.panther > 0) {
    const cx = world.player.x + world.player.w / 2;
    const cy = world.player.y + world.player.h / 2;
    //Fade out over the last half-second instead of switching off
    const fade = Math.min(1, world.player.panther * 2);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const grd = ctx.createRadialGradient(cx, cy, world.player.w * 0.2, cx, cy, world.player.w);
    grd.addColorStop(0, `rgba(192,132,252,${0.3 * fade})`);
    grd.addColorStop(0.6, `rgba(168,85,247,${0.16 * fade})`);
    grd.addColorStop(1, "rgba(168,85,247,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, world.player.w, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      //Alternate the spin direction so the arcs cross rather than march
      const dir = i % 2 ? -1 : 1;
      const spin = fx.elapsed * (2.2 + i * 0.9) * dir;
      ctx.strokeStyle = `rgba(${i % 2 ? "233,213,255" : "192,132,252"},${
        (0.75 - i * 0.12) * fade
      })`;
      ctx.beginPath();
      ctx.arc(cx, cy, world.player.w * (0.55 + i * 0.19), spin, spin + Math.PI * 1.1);
      ctx.stroke();
    }
    ctx.restore();
  }
  //Wanda wears her hex while it is running
  if (world.player.hex > 0) {
    ctx.save();
    ctx.strokeStyle = `rgba(224,69,123,${0.5 + Math.sin(fx.elapsed * 6) * 0.25})`;
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(
        world.player.x + world.player.w / 2,
        world.player.y + world.player.h / 2,
        world.player.w * (0.7 + i * 0.28),
        fx.elapsed * (2 + i) ,
        fx.elapsed * (2 + i) + Math.PI * 1.2
      );
      ctx.stroke();
    }
    ctx.restore();
  }
  if (world.player.shield > 0) {
    ctx.strokeStyle = `rgba(56,189,248,${0.45 + Math.sin(fx.elapsed * 8) * 0.2})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      world.player.x + world.player.w / 2,
      world.player.y + world.player.h / 2,
      world.player.w * 0.8,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }
}

export function drawCorpse(c) {
  const p = c.t / c.dur;
  drawSprite(c.sprite, c.x, c.y, c.w, c.h, {
    rot: c.spin * p,
    sx: 1 + p * 0.45,
    sy: 1 + p * 0.45,
    alpha: 1 - p,
    flash: (1 - p) * 0.5,
  });
}

export function drawPop(o) {
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

//The sky going out under the God Blast. It ramps in fast and lifts slowly,
//so the frame snaps to black on the strike and the world comes back.
export function drawStormDark() {
  const t = fx.storm / CONFIG.ult.stormDuration;
  //Full dark for the first fifth, then easing off across the rest
  const alpha = 0.82 * Math.min(1, t / 0.8);
  ctx.save();
  ctx.fillStyle = `rgba(2,6,16,${alpha})`;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

//Thor's lightning: a jagged polyline redrawn every frame, so it crackles.
//`fromWeapon` arcs re-read the axe every frame instead of remembering where
//it was, which is what keeps the bolt attached to it while he moves.
//`bold` is the ultimate and Stormbreaker's own strikes: thicker, brighter,
//and drawn twice so they read through the dark.
export function drawBoltArcs() {
  for (const a of boltArcs) {
    //A negative t is a stagger — the arc has been queued but has not struck
    if (a.t < 0) continue;
    const fade = 1 - a.t / a.dur;
    const from = a.fromWeapon ? weaponPoint() : a.from;
    const dx = a.to.x - from.x;
    const dy = a.to.y - from.y;
    const steps = a.bold ? 12 : 9;
    const jitter = a.bold ? 34 : 26;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.shadowColor = "#7dd3fc";
    ctx.shadowBlur = a.bold ? 30 : 18;
    //Twice: a wide soft pass for the glow, a narrow white one for the core
    for (const [width, color] of a.bold
      ? [[9, "#7dd3fc"], [3.5, "#ffffff"]]
      : [[3, "#e0f2fe"]]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      for (let i = 1; i < steps; i++) {
        const k = i / steps;
        //Pinned at both ends, loosest in the middle, so it reads as a bolt
        //between two points rather than a scribble near them.
        const spread = jitter * Math.sin(k * Math.PI);
        ctx.lineTo(from.x + dx * k + rand(-spread, spread),
                   from.y + dy * k + rand(-spread, spread));
      }
      ctx.lineTo(a.to.x, a.to.y);
      ctx.stroke();
    }
    ctx.restore();
  }
}

//Cyclops' overload, drawn as stacked glows so it reads as heat. It borrows
//the beam box the hitbox uses, so what burns and what is drawn cannot drift
//apart, and it burns in his own red rather than a colour of its own.
export function drawIgnitionBeam() {
  const beam = ignitionBeam();
  const y = beam.y + beam.h / 2;
  const fade = Math.min(1, world.player.ignition * 2);
  const x = beam.x;
  const tint = heroTint();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  //Outer wash, mid body, and a white-hot core down the middle
  for (const [h, alpha] of [[beam.h, 0.25], [beam.h * 0.5, 0.5], [beam.h * 0.14, 0.95]]) {
    ctx.globalAlpha = alpha * fade;
    const grd = ctx.createLinearGradient(x, 0, W, 0);
    grd.addColorStop(0, "#ffffff");
    grd.addColorStop(0.25, tint);
    grd.addColorStop(1, hexToRgba(tint, 0.15));
    ctx.fillStyle = grd;
    ctx.fillRect(x, y - h / 2 + Math.sin(fx.elapsed * 40) * 2, W - x, h);
  }
  ctx.restore();
}

//The web, blackened once and kept. ctx.filter would do this in a line but
//Safari only learned it recently, and a shot that silently stays red on
//somebody's phone is worse than a canvas we build once at the first black
//web and never touch again. source-in paints only where the web already
//is, so the shape survives exactly.
let blackWebCanvas = null;
function blackWeb(sprite) {
  if (blackWebCanvas) return blackWebCanvas;
  const c = document.createElement("canvas");
  c.width = sprite.width || 76;
  c.height = sprite.height || 34;
  const g = c.getContext("2d");
  g.drawImage(sprite, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = "#11111c";
  g.fillRect(0, 0, c.width, c.height);
  blackWebCanvas = c;
  return c;
}

export function drawBullet(b) {
  const hero = heroDef();
  const sprite = img[hero.bullet];
  //The symbiote's web is the same web with the light taken out of it
  if (b.symbiote) {
    for (let i = 3; i >= 1; i--) {
      drawSprite(sprite, b.x - i * 20, b.y, b.w, b.h, { alpha: 0.06 * (4 - i) });
    }
    drawSprite(blackWeb(sprite), b.x, b.y, b.w, b.h, {});
    return;
  }
  //Three fading ghosts behind each shot read as motion blur
  for (let i = 3; i >= 1; i--) {
    drawSprite(sprite, b.x - i * 20, b.y, b.w, b.h, { alpha: 0.09 * (4 - i) });
  }
  if (hero.ult === "godblast") {
    //Thor's bolts flicker and stretch along their travel
    drawSprite(sprite, b.x, b.y, b.w, b.h, {
      sx: 1.18 + Math.sin(fx.elapsed * 45) * 0.16,
      sy: 0.92,
      flash: 0.35 + Math.sin(fx.elapsed * 38) * 0.25,
    });
  } else if (hero.ult === "hex") {
    drawSprite(sprite, b.x, b.y, b.w, b.h, { rot: fx.elapsed * 11 });

  } else if (hero.ult === "barrage") {
    drawSprite(sprite, b.x, b.y, b.w, b.h, { flash: 0.2 });
  } else {
    drawSprite(sprite, b.x, b.y, b.w, b.h, { flash: 0.2 });
  }
}

export function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

export function drawFloatTexts() {
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
