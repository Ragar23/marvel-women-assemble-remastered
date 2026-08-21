//=====================================================================//
export const imageSources = {
  bg: "./images/bg.png",
  spaceDogs: "./images/outriders.png",
  ultron: "./images/ultron.png",
  cull: "./images/cull.png",
  wanda: "./images/scarlet-witch.png",
  ball: "./images/energyBall.png",
  proxima: "./images/proxima.png",
  corvus: "./images/corvus.png",
  nebula: "./images/nebula.bad.png",
  thanos: "./images/thanos.png",
  valkiria: "./images/valkiria.png",
  rescuePotts: "./images/rescuePotts.png",
  marvel: "./images/marvel.png",
  okoye: "./images/okoye.png",
  wasp: "./images/wasp.png",
  shuri: "./images/shuri.png",
  gamora: "./images/gamora.png",
  grootLeft: "./images/babyGroot.png",
  grootRight: "./images/babyGrootLeft.png",
  blast: "./images/blast.png",
  stanLee: "./images/StanLee.png",
  gaunlet: "./images/stones.png",
  mantis: "./images/mantis.png",
  levi: "./images/levi.png",
  spiderman: "./images/spiderman.png",
  chit2: "./images/chit2.png",
  chit3: "./images/chit3.png",
  chit4: "./images/chit4.png",
  thor: "./images/thor.png",
  ironman: "./images/ironman.png",
  repulsor: "./images/repulsor.png",
  lightning: "./images/lightning.png",
  mjolnir: "./images/mjolnir.png",
  cap: "./images/cap.png",
  capEmpty: "./images/cap-empty.png",
  capWorthy: "./images/cap-worthy.png",
  thorEmpty: "./images/thor-empty.png",
  shield: "./images/shield.png",
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
