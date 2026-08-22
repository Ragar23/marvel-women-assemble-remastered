import { fire } from "./sim.js";

//=====================================================================//
export //images/spiderman.png is deliberately not loaded: he is no longer drawn,
//but the sprite is kept in the repo for a future playable character.
const imageSources = {
  bg: "./images/dd-bg.png",
  chit2: "./images/chit2.png",
  chit3: "./images/chit3.png",
  chit4: "./images/chit4.png",
  levi: "./images/levi.png",
  grootLeft: "./images/babyGroot.png",
  grootRight: "./images/babyGrootLeft.png",
  stanLee: "./images/StanLee.png",
  gaunlet: "./images/stones.png",
  blast: "./images/blast.png",
  lightning: "./images/lightning.png",

  //Doomsday cast
  ddThor: "./images/dd-thor.png",
  //The same Thor with the hammer instead of the axe, for when he picks it
  ddThorMjolnir: "./images/dd-thor-mjolnir.png",
  ddThorEmpty: "./images/dd-thor-empty.png",
  ddCyclops: "./images/dd-cyclops.png",
  ddShuri: "./images/dd-shuri.png",
  ddTorch: "./images/dd-torch.png",
  //Three frames of him alight, cycled while he is throwing fire
  ddTorchFlame1: "./images/dd-torch-flame1.png",
  ddTorchFlame2: "./images/dd-torch-flame2.png",
  ddTorchFlame3: "./images/dd-torch-flame3.png",
  ddDoom: "./images/dd-doom.png",
  ddSentinel: "./images/dd-sentinel.png",
  ddWitchHex: "./images/dd-witch-hex.png",
  ddWitchVeil: "./images/dd-witch-veil.png",
  ddWitchWard: "./images/dd-witch-ward.png",
  stormbreaker: "./images/dd-stormbreaker.png",
  mjolnir: "./images/mjolnir.png",
  optic: "./images/dd-optic.png",
  claw: "./images/dd-claw.png",
  fire: "./images/dd-fire.png",

  //The line-up that answers the W key
  ddReed: "./images/dd-reed.png",
  ddBeast: "./images/dd-beast.png",
  ddBucky: "./images/dd-bucky.png",
  ddMystique: "./images/dd-mystique.png",
  ddLoki: "./images/dd-loki.png",
  ddMagneto: "./images/dd-magneto.png",
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
