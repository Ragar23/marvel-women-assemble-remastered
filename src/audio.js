import { heroCards, menuBtn, muteBtn, retryBtn, showScreen, startBtn, weaponCards, weaponChoice } from "./dom.js";
import { startRun } from "./loop.js";
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

export const sfx = {};
for (const [name, src] of Object.entries(SFX_SOURCES)) {
  const a = new Audio(src);
  a.preload = "auto";
  sfx[name] = a;
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

//Short effects need to overlap, so each one plays on its own clone.
//`rate` detunes a shared clip, which is how the four heroes get four
//distinct weapon sounds out of one recording.
export function playSfx(name, volume = 0.25, rate = 1) {
  if (muted) return;
  const source = sfx[name];
  if (!source) return;
  const shot = source.cloneNode();
  shot.volume = clamp(volume, 0, 1);
  shot.playbackRate = rate;
  playSafely(shot);
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

startBtn.addEventListener("click", startRun);
retryBtn.addEventListener("click", startRun);
menuBtn.addEventListener("click", () => {
  sess.state = "menu";
  showScreen("menu");
});
muteBtn.addEventListener("click", toggleMute);

//Wrap each letter of the title so it can be animated in one at a time.
