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
export const heroCards = Array.from(document.querySelectorAll(".hero-card"));
export const gameOverTitle = document.getElementById("gameover-title");
export const statScore = document.getElementById("stat-score");
export const statWave = document.getElementById("stat-wave");
export const statKills = document.getElementById("stat-kills");
export const statCombo = document.getElementById("stat-combo");

export function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle("is-active", key === name);
  });
}

//=====================================================================//
//  UTILITIES
