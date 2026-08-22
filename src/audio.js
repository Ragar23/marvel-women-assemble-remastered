import { heroCards, menuBtn, muteBtn, quitBtn, resumeBtn, retryBtn, showScreen, startBtn, weaponCards, weaponChoice } from "./dom.js";
import { quitToMenu, startRun, togglePause } from "./loop.js";
import { HEROES } from "./config.js";
import { sess } from "./state.js";
import { clamp } from "./util.js";

//=====================================================================//
export const MUSIC_START_SECONDS = 96;
export let muted = false;

export const audio = new Audio(
  "./assets/Alan Silvestri - Portals (From Avengers EndgameAudio Only).mp3"
);
audio.volume = 0.22;
audio.loop = true;

//One clip played at different volumes used to cover shooting, pickups and
//ultimates alike. Each event now has its own sound.
export const SFX_SOURCES = {
  shoot: "./assets/sfx-shoot.wav",
  hit: "./assets/sfx-hit.wav",
  explode: "./assets/sfx-explode.wav",
  pickup: "./assets/sfx-pickup.wav",
  hurt: "./assets/sfx-hurt.wav",
  ultimate: "./assets/sfx-ultimate.wav",
  thunder: "./assets/sfx-thunder.wav",
  hammer: "./assets/sfx-hammer.wav",
  wave: "./assets/sfx-wave.wav",
  select: "./assets/ballsSound.mp3",
};

//=====================================================================//
//  SOUND EFFECTS
//
//  These used to be <audio> elements, one per clip, cloned on every play so
//  that overlapping shots did not cut each other off. cloneNode() on a media
//  element is not cheap — the browser stands up a fresh decoder and media
//  pipeline for each one — and this game asks for a `shoot` every 0.13s on
//  the Torch, plus a `hit` per impact and an `explode` per kill. Dozens of
//  media elements a second is enough to drop a phone to a crawl, which is
//  exactly what turning the sound on did.
//
//  Each clip is decoded once into an AudioBuffer instead. Playing one is
//  then a BufferSource, which is what the Web Audio API expects you to
//  create and throw away per note, and costs approximately nothing.
//=====================================================================//
export const sfx = {}; //name → AudioBuffer, once decoded

let ctx = null;
let master = null;
let voices = 0;

//A God Blast kills a whole wave at once. Past this many at a time the ear
//hears mud and the phone hears work, so the rest are dropped.
const MAX_VOICES = 14;
//And the same effect twice inside this many seconds is one effect as far as
//anyone can tell — which is most of what a wave dying at once produces.
const REPEAT_GAP = 0.03;
const lastPlayed = new Map();

//Built on the first gesture, because that is the only time a browser will
//allow it. Returns null where there is no Web Audio at all, and the game
//simply runs without effects rather than falling back to something slower.
export function audioContext() {
  if (ctx) return ctx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  try {
    ctx = new Ctx();
  } catch {
    return null;
  }
  master = ctx.createGain();
  master.gain.value = 1;
  master.connect(ctx.destination);
  loadEffects();
  return ctx;
}

//All at once rather than one after another: awaiting each in turn left the
//last effects in the list unavailable for seconds after the first, which on
//a slow connection means a run that starts with no explosions.
function loadEffects() {
  return Promise.all(
    Object.entries(SFX_SOURCES).map(async ([name, src]) => {
      try {
        const data = await fetch(src).then((r) => r.arrayBuffer());
        //Safari still wants the callback form, so promise-wrap it either way
        sfx[name] = await new Promise((resolve, reject) => {
          const out = ctx.decodeAudioData(data, resolve, reject);
          if (out && typeof out.then === "function") out.then(resolve, reject);
        });
      } catch {
        /* that one effect stays silent; the rest are unaffected */
      }
    })
  );
}

//iOS starts every context suspended and only lets a gesture resume it.
export function unlockAudio() {
  const context = audioContext();
  if (context && context.state === "suspended") {
    const resumed = context.resume();
    if (resumed && typeof resumed.catch === "function") resumed.catch(() => {});
  }
}

//Kept for the easter egg, where it is the whole point.
export const assembleTheme = new Audio("./assets/avengers_assemble_.mp3");
assembleTheme.volume = 0.5;

audio.addEventListener("loadedmetadata", function () {
  this.currentTime = MUSIC_START_SECONDS;
});

//Browsers reject play() until the page has been interacted with, and an
//unhandled rejection surfaces as a console error.
export function playSafely(sound) {
  const attempt = sound.play();
  if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
}

export function playMusic() {
  if (muted) return;
  playSafely(audio);
}

//Short effects overlap freely: each play is its own source node.
//`rate` detunes a shared clip, which is how the four heroes get four
//distinct weapon sounds out of one recording.
export function playSfx(name, volume = 0.25, rate = 1) {
  if (muted) return;
  const context = audioContext();
  const buffer = sfx[name];
  //Still decoding, or no Web Audio: silent rather than slow
  if (!context || !buffer) return;

  const now = context.currentTime;
  if (now - (lastPlayed.get(name) || -Infinity) < REPEAT_GAP) return;
  if (voices >= MAX_VOICES) return;
  lastPlayed.set(name, now);

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  const gain = context.createGain();
  gain.gain.value = clamp(volume, 0, 1);
  source.connect(gain).connect(master);
  voices++;
  source.onended = () => {
    voices--;
    gain.disconnect();
  };
  source.start();
}

//The easter egg's theme, the one moment this track was made for.
export function playAssembleTheme() {
  if (muted) return;
  assembleTheme.currentTime = 0;
  playSafely(assembleTheme);
}

export function toggleMute() {
  muted = !muted;
  muteBtn.classList.toggle("is-muted", muted);
  if (muted) {
    audio.pause();
    assembleTheme.pause();
  } else if (sess.state === "playing") playMusic();
}

//=====================================================================//
//  BOOT
//=====================================================================//
//The weapon panel belongs to whoever has more than one; today that is Thor
//alone, but it is driven off the hero definition rather than his name.
function syncWeaponChoice() {
  if (!weaponChoice) return;
  weaponChoice.classList.toggle("is-open", !!HEROES[sess.chosenHero].weapons);
}

//Every gesture that could precede a sound builds the audio context, since a
//browser will only allow it from inside one. Whichever comes first wins; the
//rest are no-ops.
for (const el of [startBtn, retryBtn, ...heroCards, ...weaponCards]) {
  if (el) el.addEventListener("pointerdown", unlockAudio);
}
document.addEventListener("pointerdown", unlockAudio, { once: true });

heroCards.forEach((card) => {
  card.addEventListener("click", () => {
    heroCards.forEach((c) => c.classList.remove("is-selected"));
    card.classList.add("is-selected");
    sess.chosenHero = card.dataset.character;
    syncWeaponChoice();
    playSfx("select", 0.3);
  });
});

weaponCards.forEach((card) => {
  card.addEventListener("click", () => {
    weaponCards.forEach((c) => c.classList.remove("is-selected"));
    card.classList.add("is-selected");
    sess.weapon = card.dataset.weapon;
    playSfx("select", 0.3);
  });
});

//Thor is selected when the menu opens, so the panel starts open with him.
syncWeaponChoice();

//The pause overlay is the only way out of a run
if (resumeBtn) resumeBtn.addEventListener("click", () => togglePause());
if (quitBtn) quitBtn.addEventListener("click", () => quitToMenu());

startBtn.addEventListener("click", startRun);
retryBtn.addEventListener("click", startRun);
menuBtn.addEventListener("click", () => {
  sess.state = "menu";
  showScreen("menu");
});
muteBtn.addEventListener("click", toggleMute);

//Wrap each letter of the title so it can be animated in one at a time.
