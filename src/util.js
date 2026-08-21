import { ctx } from "./canvas.js";

//=====================================================================//
export const rand = (min, max) => min + Math.random() * (max - min);
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

//Every sprite goes through here, which is what makes rotation, scale and
//fading possible at all — drawImage(x, y) alone cannot express any of it.
//`flash` brightens the sprite by drawing it again additively: ctx.filter
//would be simpler, but Safari did not support it until 16.4.
export function drawSprite(image, x, y, w, h, opts) {
  const o = opts || {};
  const rot = o.rot || 0;
  const sx = o.sx === undefined ? 1 : o.sx;
  const sy = o.sy === undefined ? 1 : o.sy;
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  const flashAmount = o.flash || 0;

  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.translate(x + w / 2, y + h / 2);
  if (rot) ctx.rotate(rot);
  if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
  ctx.drawImage(image, -w / 2, -h / 2, w, h);
  if (flashAmount > 0) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = clamp(flashAmount, 0, 1);
    ctx.drawImage(image, -w / 2, -h / 2, w, h);
    ctx.drawImage(image, -w / 2, -h / 2, w, h);
  }
  ctx.restore();
}

export function overlaps(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

//=====================================================================//
//  GAME STATE

//Arrays are shared as consts, so filtering has to happen in place.
export function sweep(arr, keep) {
  let j = 0;
  for (const item of arr) if (keep(item)) arr[j++] = item;
  arr.length = j;
}

export function replaceAll(arr, next) {
  arr.length = 0;
  for (const item of next) arr.push(item);
}
