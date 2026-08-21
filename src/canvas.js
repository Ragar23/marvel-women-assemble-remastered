//=====================================================================//
//  MARVEL. ¡WOMEN, ASSEMBLE! — Remastered
//  Waves, lives, combos, power-ups and a Thanos boss fight.
//=====================================================================//

export const canvas = document.getElementById("myCanvas");
export const ctx = canvas.getContext("2d");

//Canvas smooths images when it scales them, which turns pixel art to mush.
//It matters most for the bosses, drawn several times their native size.
ctx.imageSmoothingEnabled = false;
export const W = canvas.width;
export const H = canvas.height;

//=====================================================================//
//  TUNING — every number worth arguing about lives here.
//  All speeds are pixels per SECOND, so the game plays identically on a
//  60Hz laptop and a 120Hz display.
