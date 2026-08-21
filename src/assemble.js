import { img } from "./assets.js";
import { playAssembleTheme } from "./audio.js";
import { H } from "./canvas.js";
import { CONFIG } from "./config.js";
import { fitSprite, heroes } from "./state.js";
import { banner } from "./waves.js";

//=====================================================================//
export function assembleTheWomen() {
  if (heroes.length) return;
  const roster = [
    "ddReed",
    "ddBeast",
    "ddBucky",
    "ddMystique",
    "ddLoki",
    "ddMagneto",
  ];
  roster.forEach((name, i) => {
    const sprite = img[name];
    const size = fitSprite(sprite, CONFIG.player.height);
    heroes.push({
      sprite,
      x: -size.w - i * 70,
      y: (H / (roster.length + 1)) * (i + 1) - size.h / 2,
      w: size.w,
      h: size.h,
      speed: 420 + i * 18,
    });
  });
  banner("ASSEMBLE", "", "#4ade80");
  playAssembleTheme();
}

//=====================================================================//
//  UPDATE
