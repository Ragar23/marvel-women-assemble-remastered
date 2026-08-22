import { fireUlt } from "./abilities.js";
import { assembleTheWomen } from "./assemble.js";
import { toggleMute } from "./audio.js";
import { quitToMenu, togglePause } from "./loop.js";
import { sess } from "./state.js";

//=====================================================================//
export const heldKeys = new Set();

//Drop every key and un-light every control.
//
//A finger only releases a key when the browser delivers pointerup to the
//control it went down on — and when a run ends, the controls are hidden by
//the screen change, which releases the pointer capture and sends that
//pointerup somewhere else. The key stayed in the set, so the next run began
//with FIRE already down and the hero shooting on his own. Runs start and end
//through here instead.
//
//Declared as a function rather than a const so loop.js can import it without
//the two modules' evaluation order mattering.
export function releaseAllInput() {
  heldKeys.clear();
  const stick = document.getElementById("touch-pad");
  if (stick) {
    stick.classList.remove("is-held");
    stick.style.setProperty("--dx", 0);
    stick.style.setProperty("--dy", 0);
  }
  for (const btn of document.querySelectorAll(".touch-btn")) {
    btn.classList.remove("is-down");
  }
}

//=====================================================================//
//  KEYBOARD
//=====================================================================//
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

  //Quit to the menu, from either side of a pause
  if (event.code === "KeyQ" && (sess.state === "playing" || sess.state === "paused")) {
    quitToMenu();
  }
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
//  TOUCH
//
//  Every control here ends in heldKeys or in the same handler the keyboard
//  calls, so there is one input path in the game rather than two.
//=====================================================================//
export const isTouch =
  typeof window.matchMedia === "function" &&
  (window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window);

if (isTouch) document.body.classList.add("is-touch");

//=====================================================================//
//  KEEPING THE PAGE STILL WHILE YOU PLAY
//
//  Playing needs two thumbs — one on the stick, one on FIRE — and two
//  fingers on a screen is precisely what a browser reads as a pinch.
//  touch-action does not help: iOS Safari ignores it for page zoom outright,
//  and a pinch spanning two separate elements is a page gesture either way.
//  So the gestures are refused directly, and only while a run is on screen:
//  the menu is small text and pinching it is the only way some people can
//  read it.
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
//  THE STICK
//
//  It was four arrow caps, which meant four small targets and eight
//  directions. This is one target the size of the whole circle — anywhere in
//  it steers — and the knob follows the thumb so where you are pushing is
//  visible. It still ends in the arrow keys, so nothing downstream knows a
//  touchscreen exists.
//=====================================================================//
const ARROWS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

//Inside this fraction of the radius counts as centre, so a thumb resting on
//it does not creep.
const DEAD_ZONE = 0.22;
//And an axis has to carry this much of the push before it counts, which is
//what stops a straight push registering as a diagonal.
const AXIS_BITE = 0.38;
//How far the knob may leave the middle, as a fraction of the radius.
const KNOB_TRAVEL = 0.62;

function releaseStick(stick) {
  for (const code of ARROWS) heldKeys.delete(code);
  stick.classList.remove("is-held");
  stick.style.setProperty("--dx", 0);
  stick.style.setProperty("--dy", 0);
}

function aimStick(stick, event) {
  const rect = stick.getBoundingClientRect();
  const radius = rect.width / 2;
  const dx = event.clientX - (rect.left + radius);
  const dy = event.clientY - (rect.top + radius);
  const dist = Math.hypot(dx, dy);

  //The knob follows the thumb but stops at the ring
  const reach = Math.min(dist, radius * KNOB_TRAVEL);
  const scale = dist > 0 ? reach / dist : 0;
  stick.style.setProperty("--dx", (dx * scale).toFixed(1));
  stick.style.setProperty("--dy", (dy * scale).toFixed(1));
  stick.classList.add("is-held");

  for (const code of ARROWS) heldKeys.delete(code);
  if (dist < radius * DEAD_ZONE) return;
  if (dy < -dist * AXIS_BITE) heldKeys.add("ArrowUp");
  if (dy > dist * AXIS_BITE) heldKeys.add("ArrowDown");
  if (dx < -dist * AXIS_BITE) heldKeys.add("ArrowLeft");
  if (dx > dist * AXIS_BITE) heldKeys.add("ArrowRight");
}

//Capturing keeps a thumb that slides off the control still driving it. It
//throws if the pointer is not active — a synthetic event, or an element that
//has left the document — and an uncaught throw would abort the rest of the
//handler and leave the control dead, so it is never allowed to matter.
function capture(el, event) {
  try {
    el.setPointerCapture(event.pointerId);
  } catch {
    /* not capturable; the control still works, it just stops at the edge */
  }
}

const stick = document.getElementById("touch-pad");
if (stick) {
  let stickPointer = null;

  stick.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    stickPointer = event.pointerId;
    capture(stick, event);
    aimStick(stick, event);
  });

  stick.addEventListener("pointermove", (event) => {
    if (event.pointerId !== stickPointer) return;
    event.preventDefault();
    aimStick(stick, event);
  });

  const liftStick = (event) => {
    if (event && event.pointerId !== stickPointer) return;
    stickPointer = null;
    releaseStick(stick);
  };

  stick.addEventListener("pointerup", liftStick);
  stick.addEventListener("pointercancel", liftStick);
  //Capture is lost when the stick is hidden out from under the thumb
  stick.addEventListener("lostpointercapture", () => liftStick());
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
  //A pointer that never comes back — the button hidden under the finger by a
  //screen change, the tab going away — is caught by releaseAllInput().
  btn.addEventListener("lostpointercapture", lift);
}
