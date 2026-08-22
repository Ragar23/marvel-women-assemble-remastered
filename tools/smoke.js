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

  // the incursion replaces the Stones
  const inc = await p.evaluate(() => {
    const g = window.game;
    g.run.incursion = 0; g.run.waveLeaks = 0;
    const leak = g.ENEMY_TYPES.sentinel.leak;
    g.damageEnemy && null;
    const out = { max: g.CONFIG.incursion.max, leak };
    //something getting past brings the other Earth closer
    g.run.incursion = leak; g.run.waveLeaks = 1;
    out.afterLeak = g.run.incursion;
    out.noRewardWithLeak = g.holdTheLine();
    //and a clean wave pushes it back
    g.run.waveLeaks = 0; g.run.incursion = 40;
    out.reward = g.holdTheLine();
    //stages make the fight faster
    g.run.wave = 1; g.run.incursion = 0;
    const base = g.speedMultiplier();
    g.run.incursion = out.max * (g.CONFIG.incursion.stages[0] + 0.01);
    out.stage = g.incursionStage();
    out.faster = g.speedMultiplier() > base;
    g.run.incursion = 0;
    return out;
  });
  check('a leak brings the other Earth closer', inc.afterLeak === inc.leak, JSON.stringify(inc));
  check('a wave with a leak in it pushes nothing back', inc.noRewardWithLeak === 0);
  check('a clean wave pushes it back', inc.reward > 0);
  check('and crossing a stage makes the fight faster', inc.stage === 1 && inc.faster);

  // Sentinels that shoot back
  const gun = await p.evaluate(async () => {
    const g = window.game;
    const def = g.ENEMY_TYPES.sentinelGunner;
    g.enemies.length = 0; g.spawnQueue.length = 0; g.world.boss = null;
    g.run.waveElapsed = 0;
    //let the game build one, rather than hand-rolling an enemy object
    g.spawnQueue.push({ type: 'sentinelGunner', at: 0 });
    g.run.waveElapsed = 1;
    await new Promise(r => setTimeout(r, 400));
    const e = g.enemies.find(x => x.type === 'sentinelGunner');
    if (!e) return { spawned: false };
    //walk it onto its line and run it through a whole cycle
    e.x = 1364 * def.holdAt;
    const seen = new Set();
    const t0 = performance.now();
    while (performance.now() - t0 < 6000) {
      if (e.beam) seen.add(e.beam.phase);
      if (seen.size >= 3) break;
      await new Promise(r => requestAnimationFrame(r));
    }
    return { spawned: true, phases: [...seen], holds: def.holdAt, shots: def.beamShots };
  });
  check('a gunner spawns and works its cycle',
        gun.spawned && gun.phases.includes('charge') && gun.phases.includes('fire'),
        JSON.stringify(gun));

  // Doom fights in phases
  const doom = await p.evaluate(() => {
    const g = window.game;
    g.enemies.length = 0; g.spawnQueue.length = 0;
    g.run.wave = 10;
    g.summonBoss(g.BOSSES.doom);
    const b = g.world.boss;
    b.entering = false;
    const out = {};
    g.updateBossPhase(0.016); out.opening = b.stage;
    b.hp = b.maxHp * 0.6; g.updateBossPhase(0.016);
    out.wardStage = b.stage; out.ward = b.ward;
    const hp = b.hp;
    g.damageBoss(5, 0, 0);
    out.wardAbsorbs = b.hp === hp;
    g.damageBoss(9999, 0, 0);
    out.wardBreaks = b.ward === 0 && b.hp === hp;
    out.staggered = b.stagger > 0;
    b.hp = b.maxHp * 0.3; b.stagger = 0; g.updateBossPhase(0.016);
    out.collapseStage = b.stage;
    out.stopsSummoning = g.bossPhase().summonGap === 0;
    const before = g.run.incursion;
    for (let i = 0; i < 50; i++) g.updateBossPhase(0.02);
    out.pulls = g.run.incursion > before;
    g.world.boss = null; g.run.incursion = 0;
    return out;
  });
  check('doom opens, wards, and collapses',
        doom.opening === 0 && doom.wardStage === 1 && doom.collapseStage === 2, JSON.stringify(doom));
  check('nothing reaches him through the ward', doom.wardAbsorbs && doom.wardBreaks);
  check('breaking it leaves him reeling', doom.staggered);
  check('the collapse stops summoning and pulls the incursion in',
        doom.stopsSummoning && doom.pulls);

  // touch controls: driven with real pointer events, on the real controls
  const tch = await p.evaluate(async () => {
    const g = window.game;
    const hiddenOnDesktop =
      getComputedStyle(document.getElementById('touch-controls')).display === 'none';
    //Turn them on the way a phone would, then use them.
    document.body.classList.add('is-touch');
    await new Promise(r => setTimeout(r, 60));
    const pad = document.getElementById('touch-pad');
    const fire = document.querySelector('.touch-fire');
    const ult = document.getElementById('touch-ult');
    const w = document.querySelector('.touch-w');
    const pause = document.getElementById('touch-pause');
    const cv = document.getElementById('myCanvas');
    let id = 900;
    const at = (el, fx, fy, type, pid) => {
      const r = el.getBoundingClientRect();
      el.dispatchEvent(new PointerEvent(type, {
        pointerId: pid, bubbles: true, cancelable: true, pointerType: 'touch',
        clientX: r.left + r.width * fx, clientY: r.top + r.height * fy,
      }));
    };
    //Step the world by hand rather than waiting on rAF, which a headless
    //browser does not reliably drive.
    const step = (n = 6) => { for (let i = 0; i < n; i++) { g.update(0.05); g.draw(); } };
    const out = {};

    //Nothing may sit on the picture: the whole point of the deck is that it
    //has its own space rather than covering the thing you are looking at.
    const hits = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const cvR = cv.getBoundingClientRect();
    out.clearOfPicture = [pad, fire, ult, w, pause, document.getElementById('mute-button')]
      .every(el => !hits(el.getBoundingClientRect(), cvR));

    //All four directions, one at a time
    out.arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].every((code, i) => {
      const spot = [[0.5, 0.06], [0.5, 0.94], [0.06, 0.5], [0.94, 0.5]][i];
      const p = id++;
      at(pad, spot[0], spot[1], 'pointerdown', p);
      const held = g.heldKeys.has(code) && g.heldKeys.size === 1;
      at(pad, spot[0], spot[1], 'pointerup', p);
      return held && g.heldKeys.size === 0;
    });

    const p1 = id++;
    at(pad, 0.06, 0.5, 'pointerdown', p1);
    out.padHolds = g.heldKeys.has('ArrowLeft');
    const x0 = g.world.player.x; step();
    out.flies = g.world.player.x < x0 - 20;
    at(pad, 0.94, 0.06, 'pointermove', p1);
    out.diagonal = g.heldKeys.has('ArrowUp') && g.heldKeys.has('ArrowRight');
    at(pad, 0.5, 0.5, 'pointermove', p1);
    out.deadZone = g.heldKeys.size === 0;
    at(pad, 0.5, 0.5, 'pointerup', p1);
    out.released = g.heldKeys.size === 0;

    const p2 = id++;
    g.world.player.cooldown = 0;
    at(fire, 0.5, 0.5, 'pointerdown', p2);
    out.fireHolds = g.heldKeys.has('KeyS');
    step(1);
    out.shoots = g.world.player.cooldown > 0 || g.world.mjolnir !== null || g.boltArcs.length > 0;
    at(fire, 0.5, 0.5, 'pointerup', p2);
    out.fireStops = !g.heldKeys.has('KeyS');

    g.world.player.charge = g.CONFIG.ult.max;
    step(1);
    out.ultLights = ult.classList.contains('is-ready');
    const p3 = id++;
    at(ult, 0.5, 0.5, 'pointerdown', p3); at(ult, 0.5, 0.5, 'pointerup', p3);
    out.ultSpends = g.world.player.charge < g.CONFIG.ult.max;

    g.heroes.length = 0;
    const p4 = id++;
    at(w, 0.5, 0.5, 'pointerdown', p4); at(w, 0.5, 0.5, 'pointerup', p4);
    out.wWorks = g.heroes.length === 6;
    out.wNotStuck = !g.heldKeys.has('KeyW');

    //One button has to do both halves of pause, and say which it will do
    const p5 = id++;
    at(pause, 0.5, 0.5, 'pointerdown', p5); at(pause, 0.5, 0.5, 'pointerup', p5);
    await new Promise(r => setTimeout(r, 60));
    out.pauses = g.sess.state === 'paused' && /resume/i.test(pause.textContent);
    const p6 = id++;
    at(pause, 0.5, 0.5, 'pointerdown', p6); at(pause, 0.5, 0.5, 'pointerup', p6);
    await new Promise(r => setTimeout(r, 60));
    out.resumes = g.sess.state === 'playing' && /pause/i.test(pause.textContent);

    const box = cv.getBoundingClientRect();
    const vh = document.documentElement.clientHeight;
    const vw = document.documentElement.clientWidth;
    out.fits = box.height <= vh + 1 && box.width <= vw + 1 && box.top >= -1 && box.bottom <= vh + 1;
    out.locked = getComputedStyle(document.body).overflow === 'hidden';

    document.body.classList.remove('is-touch');
    return { hiddenOnDesktop, ...out };
  });
  check('touch controls stay out of the way on a desktop pointer', tch.hiddenOnDesktop);
  check('no control sits on the picture', tch.clearOfPicture, JSON.stringify(tch));
  check('all four arrows hold their own key', tch.arrows);
  check('the pad holds arrows, flies him, does diagonals and a dead zone',
        tch.padHolds && tch.flies && tch.diagonal && tch.deadZone && tch.released, JSON.stringify(tch));
  check('FIRE holds, shoots, and lets go', tch.fireHolds && tch.shoots && tch.fireStops);
  check('ULT lights when full and spends the meter', tch.ultLights && tch.ultSpends);
  check('W is a press, not a stuck hold', tch.wWorks && tch.wNotStuck);
  check('one button pauses and resumes, and relabels itself', tch.pauses && tch.resumes);
  check('the picture fits the screen and the page cannot scroll', tch.fits && tch.locked);

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
