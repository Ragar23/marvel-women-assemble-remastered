import { img } from "./assets.js";
import { playAssembleTheme } from "./audio.js";
import { H } from "./canvas.js";
import { heroes } from "./state.js";
import { banner } from "./waves.js";

//=====================================================================//
export function assembleTheWomen() {
  if (heroes.length) return;
  const roster = [
    "valkiria",
    "rescuePotts",
    "mantis",
    "okoye",
    "wasp",
    "shuri",
    "gamora",
    "marvel",
  ];
  roster.forEach((name, i) => {
    const sprite = img[name];
    heroes.push({
      sprite,
      x: -sprite.width - i * 70,
      y: (H / (roster.length + 1)) * (i + 1) - sprite.height / 2,
      w: sprite.width,
      h: sprite.height,
      speed: 420 + i * 18,
    });
  });
  banner("ASSEMBLE", "", "#f0b323");
  playAssembleTheme();
}

//=====================================================================//
//  UPDATE
