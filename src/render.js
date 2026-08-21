import { drawMissiles } from "./abilities.js";
import { img } from "./assets.js";
import { H, W, ctx } from "./canvas.js";
import { CONFIG } from "./config.js";
import { drawBanner, drawHud } from "./hud.js";
import { drawMjolnir } from "./mjolnir.js";
import { boltArcs, bullets, corpses, enemies, enemyShots, floatTexts, fx, heroDef, heroes, particles, pops, powerUps, world } from "./state.js";
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
  drawSetDressing();

  //Power-ups
  for (const p of powerUps) drawPowerUp(p);

  //The women assembling
  for (const h of heroes) ctx.drawImage(h.sprite, h.x, h.y, h.w, h.h);

  //Enemies, their remains, and the boss
  for (const c of corpses) drawCorpse(c);
  for (const enemy of enemies) drawEnemy(enemy);
  if (world.boss) drawBoss();
  if (world.bossDying) drawBossDeath();

  //Bullets
  for (const b of bullets) drawBullet(b);
  for (const s of enemyShots) drawEnemyShot(s);

  drawMissiles();
  drawMjolnir();
  if (world.player.ignition > 0) drawIgnitionBeam();
  drawPlayer();
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
  //Groot dancing, the Chitauri patrol, Spidey and Stan Lee — all the cameos
  //Kept clear of the Infinity Stones bar, which owns the bottom-left.
  ctx.drawImage(img.spiderman, 430, H - 290);
  ctx.drawImage(fx.grootStanding ? img.grootLeft : img.grootRight, 500, H - 98);
  ctx.drawImage([img.chit2, img.chit3, img.chit4][fx.chitFrame], 620, H - 98);
  ctx.drawImage(img.stanLee, 750, H - 98);
}

export function enemySprite(enemy) {
  return enemy.def.animated
    ? [img.chit2, img.chit3, img.chit4][fx.chitFrame]
    : img[enemy.def.sprite];
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

  //A slim health bar, only once it has actually taken a hit
  if (enemy.maxHp > 1 && enemy.hp < enemy.maxHp) {
    const pct = enemy.hp / enemy.maxHp;
    ctx.fillStyle = "rgba(0,0,0,.6)";
    ctx.fillRect(enemy.x, enemy.y - 8, enemy.w, 4);
    ctx.fillStyle = pct > 0.5 ? "#4ade80" : pct > 0.25 ? "#f0b323" : "#ff3b3f";
    ctx.fillRect(enemy.x, enemy.y - 8, enemy.w * pct, 4);
  }
}

export function drawBoss() {
  //Breathing idle, swelling on the wind-up, shoved right by each hit,
  //lunging left as he releases a blast.
  const breath = Math.sin(fx.elapsed * 2) * 0.018;
  const swell = world.boss.windup * 0.09;
  drawSprite(
    img.thanos,
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

  //Aura: tightens and brightens as the blast charges
  ctx.save();
  ctx.strokeStyle = `rgba(192,132,252,${0.45 + world.boss.windup * 0.5})`;
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

export function drawBossDeath() {
  const p = world.bossDying.t / world.bossDying.dur;
  drawSprite(img.thanos, world.bossDying.x, world.bossDying.y, world.bossDying.w, world.bossDying.h, {
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
  grd.addColorStop(0.4, "#c084fc");
  grd.addColorStop(1, "rgba(168,85,247,0)");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, s.w, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPowerUp(p) {
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

export function drawPlayer() {
  //Blink while invulnerable so the state is readable
  const blinking = world.player.invuln > 0 && Math.floor(fx.elapsed * 14) % 2 === 0;
  if (!blinking) {
    const r = world.player.recoil;
    drawSprite(
      img[heroDef().sprite],
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

//Thor's God Blast: a jagged polyline redrawn every frame, so it crackles.
export function drawBoltArcs() {
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
export function drawIgnitionBeam() {
  const y = world.player.y + world.player.h / 2;
  const fade = Math.min(1, world.player.ignition * 2);
  const x = world.player.x + world.player.w;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const [h, alpha] of [[world.player.h * 0.62, 0.25], [world.player.h * 0.3, 0.5], [10, 0.95]]) {
    ctx.globalAlpha = alpha * fade;
    const grd = ctx.createLinearGradient(x, 0, W, 0);
    grd.addColorStop(0, "#ffffff");
    grd.addColorStop(0.25, "#f0b323");
    grd.addColorStop(1, "rgba(240,179,35,0.15)");
    ctx.fillStyle = grd;
    ctx.fillRect(x, y - h / 2 + Math.sin(fx.elapsed * 40) * 2, W - x, h);
  }
  ctx.restore();
}

export function drawBullet(b) {
  const hero = heroDef();
  const sprite = img[hero.bullet];
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
