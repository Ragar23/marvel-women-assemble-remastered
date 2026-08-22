//=====================================================================//
export const screens = {
  menu: document.getElementById("screen-menu"),
  game: document.getElementById("screen-game"),
  gameover: document.getElementById("screen-gameover"),
};
export const startBtn = document.getElementById("start-button");
export const retryBtn = document.getElementById("retry-button");
export const menuBtn = document.getElementById("menu-button");
export const muteBtn = document.getElementById("mute-button");
export const pauseOverlay = document.getElementById("pause-overlay");
export const touchUltBtn = document.getElementById("touch-ult");
export const heroCards = Array.from(document.querySelectorAll(".hero-card"));
export const weaponCards = Array.from(document.querySelectorAll(".weapon-card"));
export const weaponChoice = document.getElementById("weapon-choice");
export const gameOverTitle = document.getElementById("gameover-title");
export const statScore = document.getElementById("stat-score");
export const statWave = document.getElementById("stat-wave");
export const statKills = document.getElementById("stat-kills");
export const statCombo = document.getElementById("stat-combo");

//The menu is the screen the markup ships with, so the attribute has to
//agree with it before anything is clicked.
document.body.dataset.screen = "menu";

export function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle("is-active", key === name);
  });
  //CSS needs to know which screen is up: on a phone the game screen stops
  //the page scrolling and puts the controls out, and the menu must not.
  document.body.dataset.screen = name;
}

//=====================================================================//
//  UTILITIES
