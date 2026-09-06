import { fire } from "./sim.js";

//=====================================================================//
export //The Doomsday branch's dd-* art and the original Chitauri sprites stay
//in the repo but are not loaded here — this branch draws none of them.
const imageSources = {
  bg: "./images/nwh-bg.png",
  grootLeft: "./images/nwh-bugle1.png",
  grootRight: "./images/nwh-bugle2.png",
  stanLee: "./images/StanLee.png",
  gaunlet: "./images/stones.png",
  //The spell itself, drawn in the sky and again on the meter
  incursion: "./images/nwh-spell.png",
  blast: "./images/blast.png",
  lightning: "./images/lightning.png",

  //The three of them, and the one who pulled them through
  nwhHolland: "./images/nwh-holland.png",
  nwhMaguire: "./images/nwh-maguire.png",
  //What the first two change into, drawn on the same grid as the sprite
  //each replaces so the swap does not resize or stretch him.
  nwhHollandIron: "./images/nwh-holland-iron.png",
  nwhMaguireSymbiote: "./images/nwh-maguire-symbiote.png",
  nwhGarfield: "./images/nwh-garfield.png",
  nwhStrange: "./images/nwh-strange.png",

  //What the broken spell sent
  nwhDrone: "./images/nwh-drone.png",
  nwhGlider: "./images/nwh-glider.png",
  nwhOckArm: "./images/nwh-ockarm.png",
  nwhSymbiote1: "./images/nwh-symbiote1.png",
  nwhSymbiote2: "./images/nwh-symbiote2.png",
  nwhSymbiote3: "./images/nwh-symbiote3.png",
  nwhElectro: "./images/nwh-electro.png",
  //Who they were before the accident. Each is the sprite its enemy wears
  //until it reaches the line and turns.
  nwhElectroHuman: "./images/nwh-electro-human.png",
  nwhSandmanHuman: "./images/nwh-sandman-human.png",
  nwhLizard: "./images/nwh-lizard.png",
  nwhSandman: "./images/nwh-sandman.png",
  nwhOck: "./images/nwh-ock.png",
  nwhGoblin: "./images/nwh-goblin.png",

  //Projectiles
  web: "./images/nwh-web.png",
  //The Goblin's, cut from the sheet his drawing arrived on: the bomb he
  //throws and the razor bat the gliders throw.
  nwhPumpkin: "./images/nwh-pumpkin.png",
  nwhBat: "./images/nwh-bat.png",
  mandala: "./images/nwh-mandala.png",

  //Not more heroes: the people who were actually in the room. They answer
  //the W key.
  nwhMj: "./images/nwh-mj.png",
  nwhNed: "./images/nwh-ned.png",
  nwhMay: "./images/nwh-may.png",
  nwhHappy: "./images/nwh-happy.png",
  nwhWong: "./images/nwh-wong.png",
  nwhMatt: "./images/nwh-matt.png",
};

export const img = {};

export function loadImages(onProgress) {
  const total = Object.keys(imageSources).length;
  let done = 0;
  return Promise.all(
    Object.entries(imageSources).map(
      ([name, src]) =>
        new Promise((resolve) => {
          const image = new Image();
          const settle = () => {
            done++;
            if (onProgress) onProgress(done / total);
            resolve(image);
          };
          //A missing sprite must not deadlock the loading screen.
          image.onload = settle;
          image.onerror = () => {
            console.warn(`Could not load ${src}`);
            settle();
          };
          image.src = src;
          img[name] = image;
        })
    )
  );
}

//=====================================================================//
//  DOM
