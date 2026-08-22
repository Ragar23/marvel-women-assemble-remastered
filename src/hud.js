import { img } from "./assets.js";
import { H, W, ctx } from "./canvas.js";
import { CONFIG } from "./config.js";
import { comboMultiplier, fx, heroDef, heroTint, run, world } from "./state.js";
import { clamp } from "./util.js";

//=====================================================================//
export function drawHud() {
  //Top strip
  ctx.fillStyle = "rgba(5,6,10,.55)";
  ctx.fillRect(0, 0, W, 64);

  //Lives, as little hero portraits, with the next one filling in beneath
  const icon = img[heroDef().sprite];
  const iconH = 34;
  const iconW = (icon.width / icon.height) * iconH;
  for (let i = 0; i < world.player.lives; i++) {
    ctx.drawImage(icon, 20 + i * (iconW + 8), 10, iconW, iconH);
  }
  drawNextLife(Math.max(120, world.player.lives * (iconW + 8) - 8));

  //Score and combo
  ctx.font = "36px Marvel";
  ctx.textAlign = "right";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${run.score}`, W - 24, 44);
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
  ctx.fillText(`WAVE ${run.wave}`, 20 + world.player.lives * (iconW + 8) + 24, 40);

  drawStonesBar();
  drawUltMeter();
  if (world.boss) drawBossBar();
  drawActivePowerUps();
}

//A sliver under the lives, filling toward the next one. The milestone is
//worth seeing coming — a life that simply appears reads as luck, where a bar
//two thirds along is a reason to keep the combo up. It goes away at the cap,
//where there is nothing left to fill toward.
export function drawNextLife(barW) {
  if (world.player.lives >= CONFIG.player.maxLives) return;
  const x = 20;
  const y = 50;
  const pct = clamp(
    1 - (run.nextLife - run.score) / CONFIG.player.extraLifeEvery,
    0,
    1
  );
  ctx.fillStyle = "rgba(255,255,255,.14)";
  ctx.fillRect(x, y, barW, 4);
  ctx.fillStyle = "#4ade80";
  ctx.fillRect(x, y, barW * pct, 4);
}

export function drawUltMeter() {
  const hero = heroDef();
  const barW = 250;
  const x = W - barW - 24;
  const y = H - 42;
  const pct = clamp(world.player.charge / CONFIG.ult.max, 0, 1);
  const ready = pct >= 1;

  ctx.save();
  ctx.fillStyle = "rgba(5,6,10,.7)";
  ctx.fillRect(x, y, barW, 18);
  //Pulse the fill once it is spendable
  ctx.fillStyle = heroTint();
  ctx.globalAlpha = ready ? 0.75 + Math.sin(fx.elapsed * 8) * 0.25 : 1;
  ctx.fillRect(x, y, barW * pct, 18);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, barW, 18);
  ctx.restore();

  ctx.font = "20px Marvel";
  ctx.textAlign = "right";
  ctx.fillStyle = ready ? heroTint() : "#9aa3b2";
  ctx.fillText(ready ? `${hero.ultName} — SPACE` : hero.ultName, x + barW, y - 6);
  ctx.textAlign = "left";
}

export function drawStonesBar() {
  const x = 24;
  const y = H - 56;
  const barW = 320;
  const barH = 22;
  const pct = clamp(run.stonesHp / CONFIG.stones.maxHp, 0, 1);

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

export function drawBossBar() {
  const barW = 620;
  const x = W / 2 - barW / 2;
  const pct = clamp(world.boss.hp / world.boss.maxHp, 0, 1);

  ctx.fillStyle = "rgba(5,6,10,.75)";
  ctx.fillRect(x, 78, barW, 26);
  ctx.fillStyle = world.boss.def.tint;
  ctx.fillRect(x, 78, barW * pct, 26);
  ctx.strokeStyle = "rgba(255,255,255,.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, 78, barW, 26);

  ctx.font = "24px Marvel";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(world.boss.def.name, W / 2, 98);
  ctx.textAlign = "left";
}

export function drawActivePowerUps() {
  let y = H - 96;
  ctx.font = "22px Marvel";
  if (world.player.rapid > 0) {
    ctx.fillStyle = "#f0b323";
    ctx.fillText(`RAPID FIRE ${world.player.rapid.toFixed(1)}s`, 24, y);
    y -= 26;
  }
  if (world.player.worthy > 0) {
    ctx.fillStyle = "#bae6fd";
    ctx.fillText(`WORTHY ${world.player.worthy.toFixed(1)}s`, 24, y);
    y -= 26;
  }
  if (world.player.shield > 0) {
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`SHIELD ${world.player.shield.toFixed(1)}s`, 24, y);
  }
}

export function drawBanner() {
  if (!fx.waveBanner) return;
  const t = fx.waveBanner.life / fx.waveBanner.maxLife;
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
  ctx.fillStyle = fx.waveBanner.color;
  ctx.shadowColor = fx.waveBanner.color;
  ctx.shadowBlur = 30;
  ctx.fillText(fx.waveBanner.title, 0, 0);
  if (fx.waveBanner.subtitle) {
    ctx.font = "38px Marvel";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(fx.waveBanner.subtitle, 0, 54);
  }
  ctx.restore();
  ctx.textAlign = "left";
}

//=====================================================================//
//  LOOP + SCREEN FLOW
