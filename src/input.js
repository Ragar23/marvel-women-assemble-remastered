import { fireUlt } from "./abilities.js";
import { assembleTheWomen } from "./assemble.js";
import { toggleMute } from "./audio.js";
import { canvas } from "./canvas.js";
import { touchPauseBtn, touchUltBtn } from "./dom.js";
import { togglePause } from "./loop.js";
import { sess, world } from "./state.js";

//=====================================================================//
export const heldKeys = new Set();

//Where the finger has put him, and whether there is one. updatePlayer reads
//this the same way it reads the arrow keys.
export const touch = { active: false, x: 0, y: 0 };

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

//=====================================================================//
//  TOUCH
//
//  Flying is a drag anywhere on the canvas, and it is relative rather than
//  absolute: the ship keeps its offset from the finger instead of jumping
//  under it, so your own thumb is never parked on top of the thing you are
//  trying to watch. Holding also fires, which is what the S key does and
//  costs a phone nothing.
//=====================================================================//
export const isTouch =
  typeof window.matchMedia === "function" &&
  (window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window);

if (isTouch) document.body.classList.add("is-touch");

//The canvas is 1364x768 whatever size it is drawn at, so a client point has
//to be scaled into its own coordinates or the ship lags the finger.
function stagePoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

let drag = null;

canvas.addEventListener("pointerdown", (event) => {
  if (sess.state !== "playing" || !world.player) return;
  event.preventDefault();
  //Capture, or a fast drag that leaves the canvas strands the ship mid-flight
  canvas.setPointerCapture(event.pointerId);
  const p = stagePoint(event);
  drag = { id: event.pointerId, px: p.x, py: p.y, ox: world.player.x, oy: world.player.y };
  touch.active = true;
  touch.x = world.player.x;
  touch.y = world.player.y;
});

canvas.addEventListener("pointermove", (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  event.preventDefault();
  const p = stagePoint(event);
  touch.x = drag.ox + (p.x - drag.px);
  touch.y = drag.oy + (p.y - drag.py);
});

function endDrag(event) {
  if (!drag || (event && event.pointerId !== drag.id)) return;
  drag = null;
  touch.active = false;
}

canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);
//A pointer that leaves without capture releasing would otherwise fly on
window.addEventListener("blur", () => endDrag());

if (touchUltBtn) {
  touchUltBtn.addEventListener("click", (event) => {
    event.preventDefault();
    if (sess.state === "playing") fireUlt();
  });
}
if (touchPauseBtn) {
  touchPauseBtn.addEventListener("click", (event) => {
    event.preventDefault();
    if (sess.state === "playing" || sess.state === "paused") togglePause();
  });
}
