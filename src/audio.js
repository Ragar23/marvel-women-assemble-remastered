import { heroCards, menuBtn, muteBtn, quitBtn, resumeBtn, retryBtn, showScreen, startBtn, weaponCards, weaponChoice } from "./dom.js";
import { quitToMenu, startRun, togglePause } from "./loop.js";
import { HEROES } from "./config.js";
import { resumePortal } from "./portal.js";
import { sess } from "./state.js";
import { clamp } from "./util.js";

//=====================================================================//
//The Endgame track this borrowed ran 203 seconds and the good part did
//not arrive until 96, which is what this number was for. The No Way Home
//theme is 30 seconds long and already is the good part, so seeking into
//it would land past the end and play silence for the rest of the run.
export const MUSIC_START_SECONDS = 0;
export let muted = false;

export const audio = new Audio("./assets/no_way_home_theme_song.mp3");
//Named because playVoice() has to put it back after ducking it, and two
//places holding the same number is how it ends up quiet for ever.
export const MUSIC_VOLUME = 0.22;
audio.volume = MUSIC_VOLUME;
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
//  WHAT THEY SAY
//
//  Media elements, not decoded buffers, and deliberately so. Buffers
//  exist here because the game asks for a `shoot` every 0.13s and
//  standing up a media element per shot is what made the phone crawl.
//  None of that applies to a line of dialogue: it plays once, it never
//  overlaps itself, and eight seconds of stereo held as PCM is about
//  3MB of memory for something heard once a run. An element streams it,
//  needs no decode step at all, and tells us exactly when it has
//  finished — which is what the music has to wait for before it comes
//  back up.
//=====================================================================//
export const VOICES = {
  helloPeter: "./assets/hello_peter.mp3",
};

const voiceClips = {};
for (const [name, src] of Object.entries(VOICES)) {
  const clip = new Audio(src);
  clip.preload = "auto";
  voiceClips[name] = clip;
}

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
export const failed = {}; //name → why it did not, when one does not

let ctx = null;
let master = null;
let voices = 0;
//Whether a buffer has ever actually played, which is what iOS counts
let unlocked = false;

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
      } catch (err) {
        //A clip that will not decode used to vanish without a word, which
        //makes a silent sound indistinguishable from a sound nobody
        //triggered. It is still not fatal — the rest are unaffected — but
        //it is written down now, and audioState() reports it.
        failed[name] = (err && err.message) || String(err);
        console.warn(`audio: ${name} did not decode —`, err);
      }
    })
  );
}

//iOS starts every context suspended and only a gesture may resume it. Two
//things about that are easy to get wrong, and this had both.
//
//The first: resume() returns a promise that only settles when the call came
//from inside a gesture. Called from a timer, or from a visibilitychange
//handler, it does not reject — it simply never settles, and the context
//stays suspended for the rest of the session. So resuming can only ever be
//hung off a real touch, which is what the listener below is for.
//
//The second: a context there can report "running" and still be silent until
//a buffer has actually played through it. Playing that silent buffer while
//the context is suspended does nothing at all — and the old code marked the
//sound unlocked anyway, so the one thing that opens it never ran again.
export function unlockAudio() {
  const context = audioContext();
  if (!context) return;
  if (context.state !== "running") {
    const resumed = context.resume();
    //Prime it the moment it opens, not before
    if (resumed && typeof resumed.then === "function") resumed.then(primeOutput, () => {});
  }
  primeOutput();
}

function primeOutput() {
  if (unlocked || !ctx || ctx.state !== "running") return;
  try {
    const silence = ctx.createBufferSource();
    silence.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    silence.connect(master);
    silence.start(0);
    unlocked = true;
  } catch {
    /* it will be tried again on the next gesture */
  }
}

//A context is suspended out from under a run by anything the phone considers
//more important — a call, the screen locking, switching app — and iOS does
//not give it back on its own. The player is touching the screen constantly,
//though, so every touch is an opportunity to reopen it, and a touch is the
//only kind of moment where resume() actually works.
//
//Capture phase: the stick and the buttons call preventDefault() and the
//event never reaches the document otherwise. The common case costs one
//comparison, so this can sit on every pointerdown of a run.
for (const type of ["pointerdown", "touchend", "keydown"]) {
  document.addEventListener(
    type,
    () => {
      if (ctx && ctx.state === "running" && unlocked) return;
      unlockAudio();
    },
    { capture: true, passive: true }
  );
}

//Coming back to the tab is worth a try on the platforms where it is allowed
//— desktop and Android both resume from here. On iOS it will hang, which
//costs nothing: the next touch is what reopens it there.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  if (ctx && ctx.state === "suspended") unlockAudio();
});

//A single place to ask what the sound is actually doing, because none of
//this is visible when it goes wrong on someone else's phone.
export function audioState() {
  return {
    context: ctx ? ctx.state : "none",
    unlocked,
    decoded: Object.keys(sfx).length,
    failed,
    muted,
    voices,
  };
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
  //Nothing plays through a suspended context, and asking is how we notice
  //it went away. The touch listener above is what actually gets it back.
  if (context.state !== "running") {
    unlockAudio();
    return;
  }

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

//=====================================================================//
//  A LINE, RATHER THAN A NOISE
//
//  Effects are allowed to be dropped: past MAX_VOICES they are mud, and
//  the same one twice inside REPEAT_GAP is one sound to any ear. Neither
//  is true of somebody speaking. A line that arrives half the time is
//  worse than no line at all, so this goes around both caps.
//
//  It also pulls the music down while it talks. At the volume the theme
//  runs, a spoken line sits inside it rather than over it, and the whole
//  point of this one is that you hear what he says.
//=====================================================================//
let unduck = null;

export function playVoice(name, volume = 0.9) {
  if (muted) return;
  const clip = voiceClips[name];
  if (!clip) return;

  clip.volume = clamp(volume, 0, 1);
  clip.currentTime = 0;
  playSafely(clip);

  //Down while he talks, back up when he stops. Hung off the clip's own
  //`ended` rather than a timer set to its duration, so it is right even
  //if the clip was slow to start; and the previous restore is always
  //cancelled first, so two lines overlapping cannot strand the music
  //quiet for the rest of the run.
  duckMusic(clip);
}

function duckMusic(clip) {
  //Whatever was going to put the music back, is not any more — this line
  //owns the restore now. Cleared unconditionally, including when it is
  //the same clip retriggering, or the old listener fires against the new
  //line and hands the music back mid-sentence.
  if (unduck) {
    clearTimeout(unduck.timer);
    unduck.clip.removeEventListener("ended", unduck.restore);
    unduck = null;
  }
  audio.volume = MUSIC_VOLUME * 0.3;
  const restore = () => {
    audio.volume = MUSIC_VOLUME;
    clip.removeEventListener("ended", restore);
    unduck = null;
  };
  //Belt and braces: if `ended` never arrives — the tab went away, the
  //element stalled — a timer puts the music back anyway.
  const timer = setTimeout(restore, ((clip.duration || 9) + 1) * 1000);
  clip.addEventListener("ended", restore);
  unduck = { clip, restore, timer };
}

//The easter egg's theme, the one moment this track was made for.
export function playAssembleTheme() {
  if (muted) return;
  assembleTheme.currentTime = 0;
  playSafely(assembleTheme);
}

//Cut a line off where it is and hand the music straight back. Used when
//the sound is muted mid-sentence and when a run ends — a boss carrying on
//talking over the menu is the kind of thing nobody reports and everybody
//notices.
export function stopVoices() {
  for (const clip of Object.values(voiceClips)) {
    clip.pause();
    clip.currentTime = 0;
  }
  if (unduck) {
    clearTimeout(unduck.timer);
    unduck.clip.removeEventListener("ended", unduck.restore);
    unduck = null;
  }
  audio.volume = MUSIC_VOLUME;
}

export function toggleMute() {
  muted = !muted;
  muteBtn.classList.toggle("is-muted", muted);
  if (muted) {
    audio.pause();
    assembleTheme.pause();
    stopVoices();
  } else if (sess.state === "playing") playMusic();
}

//=====================================================================//
//  BOOT
//=====================================================================//
//The weapon panel belongs to whoever has more than one. Nobody on this
//branch does, so it stays shut — the markup for it is not even here.
//alone, but it is driven off the hero definition rather than his name.
function syncWeaponChoice() {
  if (!weaponChoice) return;
  weaponChoice.classList.toggle("is-open", !!HEROES[sess.chosenHero].weapons);
}

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
  resumePortal();
});
muteBtn.addEventListener("click", toggleMute);

//Wrap each letter of the title so it can be animated in one at a time.
