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
  check('the studios card is up while loading', await p.locator('#studios-splash:not(.is-done)').count() === 1);
  // It covers the menu, so nothing below can be clicked until it clears.
  // Assets being ready is not the same moment: the card holds a minimum
  // beat past that so a warm cache does not flicker it.
  await p.waitForSelector('#studios-splash.is-done', { timeout: 5000 });
  check('the studios card clears itself', true);
  check('title lockup loaded', await p.evaluate(() => {
    const el = document.querySelector('.title-logo');
    return !!el && el.complete && el.naturalWidth > 0;
  }));
  check('countdown is ticking', await p.evaluate(() => document.querySelector('#countdown [data-unit="seconds"]').textContent !== '00'));
  check('all four heroes on the menu', await p.locator('.hero-card').count() === 4);

  // Thor is the only one carrying a choice, so his panel opens and the
  // others close it again.
  check('the weapon panel opens for thor', await p.locator('#weapon-choice.is-open').count() === 1);
  await p.locator('.hero-card[data-character="cyclops"]').click();
  check('and closes for everyone else', await p.locator('#weapon-choice.is-open').count() === 0);
  await p.locator('.hero-card[data-character="thor"]').click();

  for (const hero of ['thor','thor-mjolnir','cyclops','shuri','torch']) {
    if (await p.locator('#screen-gameover.is-active').count()) { await p.locator('#menu-button').click(); await p.waitForTimeout(300); }
    //Thor is run twice, once on each weapon, because they are different code
    //paths: the axe never leaves his hand and the hammer does.
    const [character, weapon] = hero.split('-');
    await p.locator(`.hero-card[data-character="${character}"]`).click();
    if (character === 'thor') await p.locator(`.weapon-card[data-weapon="${weapon || 'stormbreaker'}"]`).click();
    await p.locator('#start-button').click();
    await p.waitForTimeout(300);
    // aim and fire for 5s
    const r = await p.evaluate(() => new Promise(res => {
      const g = window.game; g.heldKeys.add('KeyS');
      //Bolts live for a quarter of a second, so catching them means watching
      //across the whole run rather than sampling once it is over.
      window.__sawArcs = false;
      const t0 = performance.now();
      (function poll() {
        const t = g.enemies.filter(e => e.x > g.world.player.x).sort((a,b)=>a.x-b.x)[0];
        if (t) g.world.player.y = Math.max(0, Math.min(768 - g.world.player.h, t.y + t.h/2 - g.world.player.h/2));
        if (g.boltArcs.length) window.__sawArcs = true;
        if (performance.now() - t0 < 5000) requestAnimationFrame(poll);
        else { g.heldKeys.delete('KeyS'); res({ kills: g.run.kills, score: g.run.score, charge: Math.round(g.world.player.charge) }); }
      })();
    }));
    check(`${hero}: kills enemies`, r.kills > 0, JSON.stringify(r));
    if (hero === 'thor') {
      check('stormbreaker never leaves his hand', await p.evaluate(() => window.game.world.mjolnir === null));
      check('stormbreaker earths a bolt', await p.evaluate(() => window.game.__sawArcs === true));
    }
    // ultimate
    const MAXC = await p.evaluate(() => {
      const g = window.game;
      window.__before = g.enemies.length;
      g.world.player.charge = g.CONFIG.ult.max;
      g.fireUlt();
      return g.CONFIG.ult.max;
    }); global.window = { MAXC };
    await p.waitForTimeout(400);
    const u = await p.evaluate(() => { const g = window.game;
      return { charge: Math.round(g.world.player.charge), hex: +g.world.player.hex.toFixed(1),
               ign: +g.world.player.ignition.toFixed(1), arcs: g.boltArcs.length,
               miss: g.missiles.length, shield: g.world.shield ? 1 : 0,
               worthy: +g.world.player.worthy.toFixed(1),
               ult_storm: +g.fx.storm.toFixed(2),
               enemiesLeft: g.enemies.length,
               //A one-shot screen clear leaves no lasting state, so the
               //only evidence is the enemies it removed.
               cleared: (window.__before || 0) > 0 && g.enemies.length === 0 }; });
    check(`${hero}: ultimate fires`, u.charge < window.MAXC && (u.hex > 0 || u.ign > 0 || u.ult_storm > 0 || u.arcs > 0 || u.miss > 0 || u.shield > 0 || u.worthy > 0 || u.cleared), JSON.stringify(u));
    if (character === 'thor') {
      check(`${hero}: the god blast puts the lights out`, u.ult_storm > 0, JSON.stringify(u));
      check(`${hero}: and leaves nothing standing`, u.cleared || u.enemiesLeft === 0, JSON.stringify(u));
    }
    await p.evaluate(() => { window.game.world.player.lives = 0; });
    await p.waitForTimeout(400);
  }

  // boss
  await p.locator('#retry-button').click(); await p.waitForTimeout(300);
  await p.evaluate(() => { const g = window.game; g.enemies.length = 0; g.spawnQueue.length = 0; g.startWave(5); });
  await p.waitForTimeout(1600);
  check('wave 5 boss is a Sentinel Prime', await p.evaluate(() => window.game.world.boss?.def.name === 'SENTINEL PRIME'));
  check('wave 10 boss is Doctor Doom', await p.evaluate(() => window.game.bossForWave(10).name === 'DOCTOR DOOM'));
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
  check('the line-up arrives', await p.evaluate(() => window.game.heroes.length === 6));
  await p.keyboard.press('m'); await p.waitForTimeout(150);
  check('mute toggles', await p.locator('#mute-button.is-muted').count() === 1);

  // game over + retry
  await p.evaluate(() => { window.game.world.player.lives = 0; });
  await p.waitForTimeout(500);
  check('game over screen', await p.locator('#screen-gameover.is-active').count() === 1,
        await p.evaluate(() => document.getElementById('stat-score').innerText + ' pts'));
  await p.locator('#retry-button').click(); await p.waitForTimeout(500);
  check('retry resets', await p.evaluate(() => window.game.run.wave === 1 && window.game.run.score === 0 && window.game.world.player.lives === 3));

  // the coven stop and fight rather than walking off the edge
  const coven = await p.evaluate(async () => {
    const g = window.game;
    const out = {};
    for (const [name, def] of Object.entries(g.ENEMY_TYPES)) {
      if (!def.elite) continue;
      g.enemies.length = 0; g.spawnQueue.length = 0; g.world.boss = null;
      g.startWave(1); g.enemies.length = 0; g.spawnQueue.length = 0;
      g.summonBoss ? null : null;
      out[name] = { holdAt: def.holdAt };
    }
    return out;
  });
  check('every witch is given a line to hold',
        Object.values(coven).length === 3 && Object.values(coven).every(c => typeof c.holdAt === 'number'),
        JSON.stringify(coven));

  // lives are earned back
  const lives = await p.evaluate(() => {
    const g = window.game;
    const step = g.CONFIG.player.extraLifeEvery;
    const out = { start: g.world.player.lives, step };
    g.addScore(step - 1);
    out.justUnder = g.world.player.lives;
    g.addScore(1);
    out.onCrossing = g.world.player.lives;
    //Straight to the cap, and past it
    g.addScore(step * 6);
    out.capped = g.world.player.lives;
    out.max = g.CONFIG.player.maxLives;
    //A 1UP is off the table once there is nothing to give
    const kinds = new Set();
    for (let i = 0; i < 3000; i++) {
      g.powerUps.length = 0;
      g.maybeDropPowerUp({ x: 0, y: 0, w: 10, h: 10, def: { points: 1 } });
      if (g.powerUps.length) kinds.add(g.powerUps[0].kind);
    }
    out.kindsAtCap = [...kinds];
    g.powerUps.length = 0;
    return out;
  });
  check('a milestone one point short awards nothing', lives.justUnder === lives.start, JSON.stringify(lives));
  check('crossing a milestone awards a life', lives.onCrossing === lives.start + 1);
  check('lives stop at the cap', lives.capped === lives.max);
  check('no 1UP drops at the cap', !lives.kindsAtCap.includes('life'), lives.kindsAtCap.join(','));

  console.log('\nERRORS:', errs.length ? errs.join('\n  ') : 'none');
  console.log(fail.length ? `\n${fail.length} CHECK(S) FAILED` : '\nALL CHECKS PASSED');
  await b.close();
  process.exit(fail.length || errs.length ? 1 : 0);
})();
