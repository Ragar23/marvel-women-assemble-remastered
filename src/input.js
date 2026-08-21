import { fireUlt } from "./abilities.js";
import { assembleTheWomen } from "./assemble.js";
import { toggleMute } from "./audio.js";
import { togglePause } from "./loop.js";
import { sess } from "./state.js";

//=====================================================================//
export const heldKeys = new Set();

document.addEventListener("keydown", (event) => {
  const movement = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  if (movement.includes(event.code) || event.code === "KeyS") {
    heldKeys.add(event.code);
    event.preventDefault();
  }

  if (event.code === "Space") {
    event.preventDefault(); //Space scrolls the page otherwise
    if (sess.state === "playing") fireUlt();
  }

  if (event.code === "KeyM") toggleMute();

  if (event.code === "Escape" && (sess.state === "playing" || sess.state === "paused")) {
    togglePause();
  }

  if (event.code === "KeyW" && sess.state === "playing") assembleTheWomen();
});

document.addEventListener("keyup", (event) => heldKeys.delete(event.code));

//Losing focus mid-run should pause, not hand you a silent death.
window.addEventListener("blur", () => {
  heldKeys.clear();
  if (sess.state === "playing") togglePause();
});

//=====================================================================//
//  THE EASTER EGG
