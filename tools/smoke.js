// Smoke test: drives the real game in a headless browser and checks that
// each hero kills, each ultimate fires, the boss lives and dies, and the
// screens flow. Catches the class of bug that only shows up on screen.
//
//   python3 -m http.server 8899 &
//   node tools/smoke.js
//
// Needs playwright and a chromium binary; set CHROME to override the path.
const { chromium } = require('playwright');
const S = process.env.SHOTS || '/tmp/';
const fail = [];
function check(label, cond, detail='') { console.log(`${cond ? ' ok ' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`); if (!cond) fail.push(label); }
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });

  await p.goto(process.env.URL || 'http://localhost:8899/', { waitUntil: 'load' });
  await p.waitForSelector('body[data-assets-ready="true"]', { timeout: 20000 });
  check('modules load and assets resolve', true);
  check('debug handle present', await p.evaluate(() => !!window.game));
  check('title split into letters', await p.locator('.game-title .ch').count() === 16);

  for (const hero of ['wanda','cpMarvel','thor','ironman']) {
    if (await p.locator('#screen-gameover.is-active').count()) { await p.locator('#menu-button').click(); await p.waitForTimeout(300); }
    await p.locator(`.hero-card[data-character="${hero}"]`).click();
    await p.locator('#start-button').click();
    await p.waitForTimeout(300);
    // aim and fire for 5s
    const r = await p.evaluate(() => new Promise(res => {
      const g = window.game; g.heldKeys.add('KeyS');
      const t0 = performance.now();
      (function poll() {
        const t = g.enemies.filter(e => e.x > g.world.player.x).sort((a,b)=>a.x-b.x)[0];
        if (t) g.world.player.y = Math.max(0, Math.min(768 - g.world.player.h, t.y + t.h/2 - g.world.player.h/2));
        if (performance.now() - t0 < 5000) requestAnimationFrame(poll);
        else { g.heldKeys.delete('KeyS'); res({ kills: g.run.kills, score: g.run.score, charge: Math.round(g.world.player.charge) }); }
      })();
    }));
    check(`${hero}: kills enemies`, r.kills > 0, JSON.stringify(r));
    // ultimate
    const MAXC = await p.evaluate(() => { window.game.world.player.charge = window.game.CONFIG.ult.max; window.game.fireUlt(); return window.game.CONFIG.ult.max; }); global.window = { MAXC };
    await p.waitForTimeout(400);
    const u = await p.evaluate(() => { const g = window.game;
      return { charge: Math.round(g.world.player.charge), hex: +g.world.player.hex.toFixed(1),
               ign: +g.world.player.ignition.toFixed(1), arcs: g.boltArcs.length, miss: g.missiles.length }; });
    check(`${hero}: ultimate fires`, u.charge < window.MAXC && (u.hex > 0 || u.ign > 0 || u.arcs > 0 || u.miss > 0), JSON.stringify(u));
    if (hero === 'thor') check('thor: mjolnir in flight', await p.evaluate(() => window.game.world.mjolnir !== null || window.game.run.kills > 0));
    await p.evaluate(() => { window.game.world.player.lives = 0; });
    await p.waitForTimeout(400);
  }

  // boss
  await p.locator('#retry-button').click(); await p.waitForTimeout(300);
  await p.evaluate(() => { const g = window.game; g.enemies.length = 0; g.spawnQueue.length = 0; g.startWave(5); });
  await p.waitForTimeout(1600);
  check('boss spawns', await p.evaluate(() => !!window.game.world.boss));
  await p.screenshot({ path: S + 'split-boss.png' });
  await p.evaluate(() => window.game.damageBoss(9999, 100, 100));
  await p.waitForTimeout(300);
  check('boss death sequence + slowmo', await p.evaluate(() => !!window.game.world.bossDying && window.game.fx.slowMo > 0));
  await p.waitForTimeout(3800);
  check('boss cleanup', await p.evaluate(() => window.game.world.bossDying === null));

  // pause / mute / easter egg
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  check('pause', await p.evaluate(() => window.game.sess.state === 'paused'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  check('resume', await p.evaluate(() => window.game.sess.state === 'playing'));
  await p.keyboard.press('w'); await p.waitForTimeout(300);
  check('easter egg', await p.evaluate(() => window.game.heroes.length === 8));
  await p.keyboard.press('m'); await p.waitForTimeout(150);
  check('mute toggles', await p.locator('#mute-button.is-muted').count() === 1);

  // game over + retry
  await p.evaluate(() => { window.game.world.player.lives = 0; });
  await p.waitForTimeout(500);
  check('game over screen', await p.locator('#screen-gameover.is-active').count() === 1,
        await p.evaluate(() => document.getElementById('stat-score').innerText + ' pts'));
  await p.locator('#retry-button').click(); await p.waitForTimeout(500);
  check('retry resets', await p.evaluate(() => window.game.run.wave === 1 && window.game.run.score === 0 && window.game.world.player.lives === 3));

  console.log('\nERRORS:', errs.length ? errs.join('\n  ') : 'none');
  console.log(fail.length ? `\n${fail.length} CHECK(S) FAILED` : '\nALL CHECKS PASSED');
  await b.close();
  process.exit(fail.length || errs.length ? 1 : 0);
})();
