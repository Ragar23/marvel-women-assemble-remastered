import { audio, playMusic } from "./audio.js";
import { countUp } from "./boot.js";
import { CONFIG } from "./config.js";
import { gameOverTitle, pauseOverlay, showScreen, statCombo, statKills, statScore, statWave, touchPauseBtn } from "./dom.js";
import { draw } from "./render.js";
import { update } from "./sim.js";
import { releaseAllInput } from "./input.js";
import { fx, resetGame, run, sess } from "./state.js";
import { clamp } from "./util.js";

//=====================================================================//
export function frame(now) {
  if (sess.state !== "playing") return;
  //Floored at zero as well as capped. A negative delta — the clock stepping
  //back, or a requestAnimationFrame timestamp that does not share an origin
  //with performance.now() — makes `fx.hitStop -= realDt` count *up*, and the
  //loop then draws for ever inside the hit-stop branch without once calling
  //update(). The frame keeps painting, so it does not look like a hang.
  const realDt = clamp((now - sess.lastFrameTime) / 1000, 0, 0.05);
  sess.lastFrameTime = now;

  //Hit-stop: hold the world still for a few frames, but keep drawing so the
  //freeze reads as impact rather than a dropped frame.
  if (fx.hitStop > 0) {
    fx.hitStop -= realDt;
    draw();
    sess.animationId = requestAnimationFrame(frame);
    return;
  }

  //Slow motion for the boss death, easing back to full speed afterwards.
  if (fx.slowMo > 0) {
    fx.slowMo -= realDt;
    fx.timeScale = CONFIG.anim.slowMoScale;
  } else {
    fx.timeScale = Math.min(1, fx.timeScale + realDt * 1.8);
  }
  const dt = realDt * fx.timeScale;

  update(dt);
  //update() can end the run; don't draw a frame of a dead game
  if (sess.state === "playing") {
    draw();
    sess.animationId = requestAnimationFrame(frame);
  }
}

export function startRun() {
  //Whatever was under a thumb when the last run ended is not held any more
  releaseAllInput();
  resetGame();
  showScreen("game");
  sess.state = "playing";
  sess.lastFrameTime = performance.now();
  sess.animationId = requestAnimationFrame(frame);
  playMusic();
}

//The same button pauses and resumes, so it has to say which it is about to
//do. A phone has no Esc to fall back on if it gets this wrong.
function markPauseButton(paused) {
  if (!touchPauseBtn) return;
  touchPauseBtn.classList.toggle("is-paused", paused);
  touchPauseBtn.innerHTML = paused
    ? "<b>&#9654;</b><small>resume</small>"
    : "<b>&#10073;&#10073;</b><small>pause</small>";
}

export function togglePause() {
  if (sess.state === "playing") {
    sess.state = "paused";
    if (sess.animationId !== null) cancelAnimationFrame(sess.animationId);
    sess.animationId = null;
    pauseOverlay.classList.add("is-visible");
    markPauseButton(true);
    audio.pause();
  } else if (sess.state === "paused") {
    sess.state = "playing";
    pauseOverlay.classList.remove("is-visible");
    markPauseButton(false);
    sess.lastFrameTime = performance.now();
    sess.animationId = requestAnimationFrame(frame);
    playMusic();
  }
}

export function endGame() {
  //The screen is about to change out from under whatever is being pressed,
  //which is exactly when a held key would otherwise survive into the next
  //run — the controls are hidden, so their pointerup never arrives.
  releaseAllInput();
  sess.state = "gameover";
  if (sess.animationId !== null) cancelAnimationFrame(sess.animationId);
  sess.animationId = null;
  pauseOverlay.classList.remove("is-visible");

  gameOverTitle.innerText =
    run.incursion >= CONFIG.incursion.max
      ? "THE EARTHS HAVE MET"
      : "HELL ANSWERS TO ME";
  countUp(statScore, run.score);
  countUp(statWave, run.wave, 0.6);
  countUp(statKills, run.kills, 0.75);
  countUp(statCombo, run.bestCombo, 0.6, "x");

  showScreen("gameover");
  audio.pause();
}

//=====================================================================//
//  AUDIO
