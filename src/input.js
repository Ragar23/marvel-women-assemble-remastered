import { fireUlt } from "./abilities.js";
import { assembleTheWomen } from "./assemble.js";
import { toggleMute } from "./audio.js";
import { togglePause } from "./loop.js";
import { sess } from "./state.js";

//=====================================================================//
export const heldKeys = new Set();

//Drop every key and un-light every control.
//
//A finger only releases a key when the browser delivers pointerup to the
//button it went down on — and when a run ends, the controls are hidden by
//the screen change, which releases the pointer capture and sends that
//pointerup somewhere else. The key stayed in the set, so the next run began
//with FIRE already down and the hero shooting on his own, or an arrow held
//and the hero drifting. Runs start and end through here instead.
//
//Declared as a function rather than a const so loop.js can import it
//without the two modules' evaluation order mattering.
export function releaseAllInput() {
  heldKeys.clear();
  //=====================================================================//
//  KEEPING THE PAGE STILL WHILE YOU PLAY
//
//  Playing needs two thumbs — one on the pad, one on FIRE — and two fingers
//  on a screen is precisely what a browser reads as a pinch. touch-action
//  does not help: iOS Safari ignores it for page zoom outright, and a pinch
//  spanning two separate elements is a page gesture either way. So the
//  gestures are refused directly, and only while a run is on screen: the
//  menu is a wall of small text and pinching it is the only way some people
//  can read it.
//=====================================================================//
const inPlay = () => document.body.dataset.screen === "game";

//Safari's own pinch events. Nothing else fires these, and preventing them is
//the only thing that stops the page scaling under two thumbs.
for (const type of ["gesturestart", "gesturechange", "gestureend"]) {
  document.addEventListener(
    type,
    (event) => {
      if (inPlay()) event.preventDefault();
    },
    { passive: false }
  );
}

//And the general case: any second finger dragging while a run is on.
document.addEventListener(
  "touchmove",
  (event) => {
    if (inPlay() && event.touches.length > 1) event.preventDefault();
  },
  { passive: false }
);

//Double-tap-to-zoom. Two quick taps on FIRE is an ordinary thing to do.
let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  (event) => {
    if (!inPlay()) return;
    const now = performance.now();
    if (now - lastTouchEnd < 320) event.preventDefault();
    lastTouchEnd = now;
  },
  { passive: false }
);

//=====================================================================//
const pad = document.getElementById("touch-pad");
  if (pad) pad.classList.remove("is-up", "is-down", "is-left", "is-right");
  for (const btn of document.querySelectorAll(".touch-btn")) {
    btn.classList.remove("is-down");
  }
}

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
  releaseAllInput();
  if (sess.state === "playing") togglePause();
});

//A phone backgrounds the tab without always firing blur — switching apps,
//taking a call, the screen locking. Anything held at that moment would still
//be held when you came back.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "hidden") return;
  releaseAllInput();
  if (sess.state === "playing") togglePause();
});

//=====================================================================//
//  THE EASTER EGG

//=====================================================================//
//  TOUCH
//
//  Every control here ends in heldKeys or in the same handler the keyboard
//  calls, so there is one input path in the game rather than two. The pad
//  looks like a d-pad and behaves like a stick: the direction comes from how
//  far off centre the thumb is, which gives diagonals for free and means
//  sliding from one arm to the next never drops the input.
//
//  The drag-to-fly this replaces put movement on the same surface as the
//  picture, which meant every shot you fired also flew you somewhere.
//=====================================================================//
export const isTouch =
  typeof window.matchMedia === "function" &&
  (window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window);

if (isTouch) document.body.classList.add("is-touch");

const ARROWS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

//Inside this fraction of the pad's radius counts as centre, so resting a
//thumb on it does not creep.
const DEAD_ZONE = 0.24;
//And an axis has to carry this much of the push before it counts, which is
//what stops a straight push registering as a diagonal.
const AXIS_BITE = 0.38;

function releaseArrows(pad) {
  for (const code of ARROWS) heldKeys.delete(code);
  pad.classList.remove("is-up", "is-down", "is-left", "is-right");
}

function aimPad(pad, event) {
  const rect = pad.getBoundingClientRect();
  const dx = event.clientX - (rect.left + rect.width / 2);
  const dy = event.clientY - (rect.top + rect.height / 2);
  const radius = rect.width / 2;
  const dist = Math.hypot(dx, dy);

  releaseArrows(pad);
  if (dist < radius * DEAD_ZONE) return;

  const held = [];
  if (dy < -dist * AXIS_BITE) held.push(["ArrowUp", "is-up"]);
  if (dy > dist * AXIS_BITE) held.push(["ArrowDown", "is-down"]);
  if (dx < -dist * AXIS_BITE) held.push(["ArrowLeft", "is-left"]);
  if (dx > dist * AXIS_BITE) held.push(["ArrowRight", "is-right"]);
  for (const [code, cls] of held) {
    heldKeys.add(code);
    pad.classList.add(cls);
  }
}

//=====================================================================//
//  KEEPING THE PAGE STILL WHILE YOU PLAY
//
//  Playing needs two thumbs — one on the pad, one on FIRE — and two fingers
//  on a screen is precisely what a browser reads as a pinch. touch-action
//  does not help: iOS Safari ignores it for page zoom outright, and a pinch
//  spanning two separate elements is a page gesture either way. So the
//  gestures are refused directly, and only while a run is on screen: the
//  menu is a wall of small text and pinching it is the only way some people
//  can read it.
//=====================================================================//
const inPlay = () => document.body.dataset.screen === "game";

//Safari's own pinch events. Nothing else fires these, and preventing them is
//the only thing that stops the page scaling under two thumbs.
for (const type of ["gesturestart", "gesturechange", "gestureend"]) {
  document.addEventListener(
    type,
    (event) => {
      if (inPlay()) event.preventDefault();
    },
    { passive: false }
  );
}

//And the general case: any second finger dragging while a run is on.
document.addEventListener(
  "touchmove",
  (event) => {
    if (inPlay() && event.touches.length > 1) event.preventDefault();
  },
  { passive: false }
);

//Double-tap-to-zoom. Two quick taps on FIRE is an ordinary thing to do.
let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  (event) => {
    if (!inPlay()) return;
    const now = performance.now();
    if (now - lastTouchEnd < 320) event.preventDefault();
    lastTouchEnd = now;
  },
  { passive: false }
);

//=====================================================================//
const pad = document.getElementById("touch-pad");
if (pad) {
  let padPointer = null;
  pad.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    padPointer = event.pointerId;
    //So a thumb that slides off the pad still steers, instead of sticking on
    //whatever direction it happened to leave by.
    capture(pad, event);
    aimPad(pad, event);
  });
  pad.addEventListener("pointermove", (event) => {
    if (event.pointerId !== padPointer) return;
    event.preventDefault();
    aimPad(pad, event);
  });
  const liftPad = (event) => {
    if (event && event.pointerId !== padPointer) return;
    padPointer = null;
    releaseArrows(pad);
  };
  pad.addEventListener("pointerup", liftPad);
  pad.addEventListener("pointercancel", liftPad);
  //Capture is lost when the pad is hidden out from under the thumb
  pad.addEventListener("lostpointercapture", () => liftPad());
}

//Capturing keeps a thumb that slides off the control still driving it. It
//throws if the pointer is not active — a synthetic event, or an element that
//has left the document — and an uncaught throw here would abort the rest of
//the handler and leave the control dead, so it is never allowed to matter.
function capture(el, event) {
  try {
    el.setPointerCapture(event.pointerId);
  } catch {
    /* not capturable; the control still works, it just stops at the edge */
  }
}

//The buttons are declared in the markup: data-hold is a key held for as long
//as the button is, data-press is a one-shot. Nothing here knows what any of
//them do — the keydown handler above does.
function pressKey(code) {
  document.dispatchEvent(new KeyboardEvent("keydown", { code }));
}

for (const btn of document.querySelectorAll("[data-hold], [data-press]")) {
  const hold = btn.dataset.hold;
  const press = btn.dataset.press;

  btn.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    capture(btn, event);
    btn.classList.add("is-down");
    if (hold) heldKeys.add(hold);
    if (press) pressKey(press);
  });

  const lift = () => {
    btn.classList.remove("is-down");
    if (hold) heldKeys.delete(hold);
  };
  btn.addEventListener("pointerup", lift);
  btn.addEventListener("pointercancel", lift);
  //A pointer that never comes back — the button hidden under the finger by
  //a screen change, the tab going away — is caught by releaseAllInput().
  btn.addEventListener("lostpointercapture", lift);
}
