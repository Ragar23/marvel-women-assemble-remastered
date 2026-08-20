//=====================================================================//
//  MARVEL. ¡WOMEN, ASSEMBLE! — Remastered
//  Phase 1: correctness fixes. See ROADMAP.md.
//=====================================================================//

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

//----Tuning----//
//Speeds are pixels per SECOND, not per frame, so the game plays the same
//on a 60Hz laptop and on a 144Hz monitor.
const SPEED = {
  player: 600,
  ball: 480,
  spaceDog: 360,
  chitauri: 360,
  villain: 240,
  hero: 240,
  capMarvelFlyBy: 480,
  walkingChitauri: 1200,
};
const POINTS_PER_KILL = 10;
const MIN_ENEMIES = 6;
const SPAWN_X = 1300;

//----Game state----//
let animationId = null;
let isRunning = false;
let isGameOver = false;
let lastFrameTime = 0;
let pointsCounter = 0;

//----Loading the Images------//
//Every sprite is loaded up front. Collision boxes are measured from
//image.width / image.height, and those read 0 until the image has decoded,
//so the game must not start before they are all in.
const imageSources = {
  bg: "./images/bg.png",
  spaceDogs: "./images/outriders.png",
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
};

const img = {};

function loadImages() {
  return Promise.all(
    Object.entries(imageSources).map(([name, src]) => {
      return new Promise((resolve) => {
        const image = new Image();
        //A missing sprite should not deadlock the loading screen.
        image.onload = () => resolve(image);
        image.onerror = () => {
          console.warn(`Could not load ${src}`);
          resolve(image);
        };
        image.src = src;
        img[name] = image;
      });
    })
  );
}

//-----The DOM Elements------//
const startBtn = document.querySelector("#start-button");
const backGround = document.querySelector("#FirsPart");
const gameOvBtn = document.querySelector("#end-button");
const endGameScreen = document.querySelector("#GameOverScreen");
const instru = document.querySelector("#howToPlay");
const hideHeader = document.querySelector("#hideHeader");
const marvelStudios = document.querySelector("#studios");
const audioFirstScreen = document.querySelector("#audio");
const backToStart = document.querySelector("#backTo-button");
const finalScoreDisplay = document.querySelector("#finalScore");
const cpMarvelPlayer = document.querySelector("#cpMarvel");
const wandaPlayer = document.querySelector("#wanda");

audioFirstScreen.volume = 0.1;

//----The player----//
let chooseCharacter = "wanda";

const player = { x: 0, y: 50 };

function playerImage() {
  return chooseCharacter === "cpMarvel" ? img.marvel : img.wanda;
}

//----Input----//
//Holding the keys in a Set means releasing one direction no longer cancels
//the others.
const heldKeys = new Set();

//----Entities----//
//Each entity carries its own position AND its own sprite, so whatever gets
//drawn is exactly what gets collision-checked.
function entity(image, x, y, vx) {
  return { image, x, y, vx };
}

let arrayOfBalls = [];
let arrayOfSpaceDogs = [];
let arrayOfChitauris = [];
let villains = [];
let heroes = [];
let stanLee = null;
let walkingChitauriX = 200;

//Static set dressing
const thanos = { x: 1250, y: 300 };
const gaunlet = { x: 0, y: 450 };
const spidermanPos = { x: 20, y: 480 };
const grootPos = { x: 85, y: 670 };

//Animation timers in seconds, independent of frame rate
let grootTimer = 0;
let grootStanding = true;
let chitauriTimer = 0;
let chitIndex = 0;

function randomY(image) {
  return Math.floor(Math.random() * Math.max(1, canvas.height - image.height));
}

function newSpaceDog() {
  return entity(img.spaceDogs, SPAWN_X, randomY(img.spaceDogs), -SPEED.spaceDog);
}

function newChitauri() {
  return entity(img.chit2, 1800, randomY(img.chit2), -SPEED.chitauri);
}

//---Collision helpers---//
function boxOf(image, x, y) {
  return {
    left: x,
    right: x + image.width,
    top: y,
    bottom: y + image.height,
  };
}

function boxOfEntity(e) {
  return boxOf(e.image, e.x, e.y);
}

function intersects(a, b) {
  return (
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  );
}

function playerBox() {
  return boxOf(playerImage(), player.x, player.y);
}

//---Drawing---//
function drawScore() {
  ctx.font = "40px Marvel";
  ctx.fillStyle = "#fd0202";
  ctx.fillText(`MARVEL POINTS ${pointsCounter}`, 20, 50);
}

function showFinalScore() {
  finalScoreDisplay.innerText = `You've reached a score of ${pointsCounter} points by killing the space dogs!`;
}

//To animate Groot
function grootDancing(dt) {
  grootTimer += dt;
  if (grootTimer >= 0.5) {
    grootStanding = !grootStanding;
    grootTimer = 0;
  }
  ctx.drawImage(
    grootStanding ? img.grootLeft : img.grootRight,
    grootPos.x,
    grootPos.y
  );
}

//The Chitauri walking along the bottom of the screen
function walkingChitauri(dt) {
  const frames = [img.chit2, img.chit3, img.chit4];
  chitauriTimer += dt;
  if (chitauriTimer >= 1 / 6) {
    chitIndex = (chitIndex + 1) % frames.length;
    chitauriTimer = 0;
  }
  const frame = frames[chitIndex];
  ctx.drawImage(frame, walkingChitauriX, 670);
  walkingChitauriX -= SPEED.walkingChitauri * dt;
  if (walkingChitauriX + frame.width < 0) {
    walkingChitauriX = canvas.width;
  }
}

//Move a flock of enemies, draw them, and resolve every collision they are
//involved in. Dead entities are collected and removed AFTER the loop, so
//nothing gets skipped by splicing mid-iteration.
function updateEnemies(flock, respawn, dt) {
  const deadEnemies = new Set();
  const deadBalls = new Set();

  for (const enemy of flock) {
    enemy.x += enemy.vx * dt;
    ctx.drawImage(enemy.image, enemy.x, enemy.y);

    const enemyBox = boxOfEntity(enemy);

    //Shot down?
    for (const ball of arrayOfBalls) {
      if (deadBalls.has(ball)) continue;
      if (intersects(enemyBox, boxOf(img.ball, ball.x, ball.y))) {
        deadEnemies.add(enemy);
        deadBalls.add(ball);
        pointsCounter += POINTS_PER_KILL;
        break;
      }
    }
    if (deadEnemies.has(enemy)) continue;

    //Off the left edge — recycle it back to the right
    if (enemy.x + enemy.image.width < 0) {
      const replacement = respawn();
      enemy.x = replacement.x;
      enemy.y = replacement.y;
      continue;
    }

    //Reached the player, or the Infinity Stones?
    if (intersects(enemyBox, playerBox())) {
      isGameOver = true;
    }
    if (intersects(enemyBox, boxOf(img.gaunlet, gaunlet.x, gaunlet.y))) {
      isGameOver = true;
    }

    //Any of the assembled women wipes it out
    for (const hero of heroes) {
      if (intersects(enemyBox, boxOfEntity(hero))) {
        deadEnemies.add(enemy);
        break;
      }
    }
  }

  if (deadEnemies.size) {
    const survivors = flock.filter((e) => !deadEnemies.has(e));
    flock.length = 0;
    flock.push(...survivors);
  }
  if (deadBalls.size) {
    arrayOfBalls = arrayOfBalls.filter((b) => !deadBalls.has(b));
  }

  while (flock.length < MIN_ENEMIES) {
    flock.push(respawn());
  }
}

function movePlayer(dt) {
  const step = SPEED.player * dt;
  const sprite = playerImage();

  if (heldKeys.has("ArrowDown") && player.y + sprite.height < canvas.height) {
    player.y += step;
  }
  if (heldKeys.has("ArrowUp") && player.y > 0) {
    player.y -= step;
  }
  if (heldKeys.has("ArrowLeft") && player.x > 0) {
    player.x -= step;
  }
  if (heldKeys.has("ArrowRight") && player.x + sprite.width < canvas.width) {
    player.x += step;
  }
}

//----The game loop----//
function frame(now) {
  if (!isRunning) return;

  //Seconds since the previous frame, clamped so that tabbing away and
  //coming back does not teleport everything across the screen.
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;

  ctx.drawImage(img.bg, 0, 0);

  movePlayer(dt);
  ctx.drawImage(playerImage(), player.x, player.y);

  //Villains sweeping in from the right
  for (const villain of villains) {
    villain.x += villain.vx * dt;
    ctx.drawImage(villain.image, villain.x, villain.y);
    if (intersects(boxOfEntity(villain), playerBox())) {
      isGameOver = true;
    }
  }

  //The women assembling from the left (the W easter egg)
  for (const hero of heroes) {
    hero.x += hero.vx * dt;
    ctx.drawImage(hero.image, hero.x, hero.y);
  }

  ctx.drawImage(img.thanos, thanos.x, thanos.y);
  ctx.drawImage(img.gaunlet, gaunlet.x, gaunlet.y);
  ctx.drawImage(img.spiderman, spidermanPos.x, spidermanPos.y);
  stanLee.x += stanLee.vx * dt;
  ctx.drawImage(stanLee.image, stanLee.x, stanLee.y);

  drawScore();
  grootDancing(dt);
  walkingChitauri(dt);

  //Balls move first, so a shot fired this frame can still connect
  for (const ball of arrayOfBalls) {
    ball.x += SPEED.ball * dt;
    ctx.drawImage(
      chooseCharacter === "cpMarvel" ? img.blast : img.ball,
      ball.x,
      ball.y
    );
  }
  arrayOfBalls = arrayOfBalls.filter((ball) => ball.x < canvas.width);

  updateEnemies(arrayOfSpaceDogs, newSpaceDog, dt);
  updateEnemies(arrayOfChitauris, newChitauri, dt);

  if (isGameOver) {
    endTheGame();
  } else {
    animationId = requestAnimationFrame(frame);
  }
}

//----Controls----//
document.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
    heldKeys.add(event.code);
    event.preventDefault();
  }

  if (!isRunning) return;

  //---making shoot possible--//
  if (event.code === "KeyS") {
    arrayOfBalls.push({ x: player.x + 50, y: player.y + 20 });
  }

  //---the easter egg: the women assemble---//
  if (event.code === "KeyW") {
    assembleTheWomen();
  }
});

document.addEventListener("keyup", (event) => {
  heldKeys.delete(event.code);
});

function assembleTheWomen() {
  if (heroes.length) return;
  heroes = [
    entity(img.valkiria, -600, 50, SPEED.hero),
    entity(img.rescuePotts, -600, 150, SPEED.hero),
    entity(img.mantis, -600, 250, SPEED.hero),
    entity(img.marvel, -1200, 250, SPEED.capMarvelFlyBy),
    entity(img.okoye, -600, 350, SPEED.hero),
    entity(img.wasp, -600, 450, SPEED.hero),
    entity(img.shuri, -600, 550, SPEED.hero),
    entity(img.gamora, -600, 650, SPEED.hero),
  ];
}

//----Start / reset / end----//
function resetGame() {
  isGameOver = false;
  pointsCounter = 0;
  player.x = 0;
  player.y = 50;
  heldKeys.clear();

  arrayOfBalls = [];
  arrayOfSpaceDogs = [];
  arrayOfChitauris = [];
  heroes = [];

  while (arrayOfSpaceDogs.length < MIN_ENEMIES) {
    arrayOfSpaceDogs.push(newSpaceDog());
  }
  while (arrayOfChitauris.length < MIN_ENEMIES) {
    //The Chitauri arrive as a second wave, further out
    const c = newChitauri();
    c.x += 1500 + Math.random() * 4000;
    arrayOfChitauris.push(c);
  }

  villains = [
    entity(img.proxima, 10800, 200, -SPEED.villain),
    entity(img.corvus, 10000, 350, -SPEED.villain),
    entity(img.nebula, 10400, 600, -SPEED.villain),
    entity(img.levi, 10350, 250, -SPEED.villain),
  ];

  stanLee = entity(img.stanLee, -3000, 670, SPEED.hero);
  walkingChitauriX = 200;
  grootTimer = 0;
  chitauriTimer = 0;
  chitIndex = 0;

  showFinalScore();
  rewindMusic();
}

function startTheGame() {
  //Guard against a second loop being stacked on top of the first, which
  //used to make everything run at double speed.
  if (isRunning) return;

  canvas.style.display = "block";
  startBtn.style.display = "none";
  backGround.style.display = "none";
  gameOvBtn.style.display = "none";
  endGameScreen.style.display = "none";
  hideHeader.style.display = "none";
  instru.style.display = "none";
  marvelStudios.style.display = "none";
  backToStart.style.display = "none";

  audioFirstScreen.pause();
  audioFirstScreen.style.display = "none";
  playMusic();

  isRunning = true;
  lastFrameTime = performance.now();
  animationId = requestAnimationFrame(frame);
}

function endTheGame() {
  isRunning = false;
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  canvas.style.display = "none";
  backGround.style.display = "block";
  gameOvBtn.style.display = "block";
  endGameScreen.style.display = "block";
  backToStart.style.display = "block";
  showFinalScore();

  audio.pause();
  audio2.pause();
}

//---AUDIO SETTINGS---//
const MUSIC_START_SECONDS = 96;

const audio = new Audio(
  "./assets/Alan Silvestri - Portals (From Avengers EndgameAudio Only).mp3"
);
audio.volume = 0.01;

const audio2 = new Audio("./assets/avengers_assemble_.mp3");
audio2.volume = 0.03;

//Sound effect for choosing character
const audioBalls = new Audio("./assets/ballsSound.mp3");
audioBalls.volume = 0.02;

//Browsers reject play() until the user has interacted with the page, and an
//unhandled rejection shows up as an error in the console.
function playSafely(sound) {
  const attempt = sound.play();
  if (attempt && typeof attempt.catch === "function") {
    attempt.catch(() => {});
  }
}

function playMusic() {
  playSafely(audio);
  playSafely(audio2);
}

//Restarting used to call audio.load(), which aborts the in-flight request and
//re-downloads several megabytes of MP3 every time. Rewinding is enough.
function rewindMusic() {
  audio.pause();
  audio2.pause();
  //Seeking before the metadata has arrived throws; in that case the
  //loadedmetadata handler below sets the start point instead.
  if (audio.readyState > 0) {
    audio.currentTime = MUSIC_START_SECONDS;
  }
  if (audio2.readyState > 0) {
    audio2.currentTime = 0;
  }
}

audio.addEventListener(
  "loadedmetadata",
  function () {
    this.currentTime = MUSIC_START_SECONDS;
  },
  false
);

//Timer for first Audio in splashScreen
audioFirstScreen.addEventListener(
  "loadedmetadata",
  function () {
    this.currentTime = 162;
  },
  false
);

//Where some things happen
window.addEventListener("load", () => {
  canvas.style.display = "none";
  gameOvBtn.style.display = "none";
  endGameScreen.style.display = "none";
  backToStart.style.display = "none";

  //No starting until every sprite has decoded
  startBtn.disabled = true;
  const startLabel = startBtn.innerText;
  startBtn.innerText = "LOADING...";

  loadImages().then(() => {
    resetGame();
    startBtn.disabled = false;
    startBtn.innerText = startLabel;
    document.body.dataset.assetsReady = "true";
  });

  wandaPlayer.addEventListener("click", () => {
    chooseCharacter = "wanda";
    wandaPlayer.className = "wanda";
    playSafely(audioBalls);
  });

  cpMarvelPlayer.addEventListener("click", () => {
    chooseCharacter = "cpMarvel";
    playSafely(audioBalls);
  });

  startBtn.addEventListener("click", () => {
    startTheGame();
  });

  gameOvBtn.addEventListener("click", () => {
    resetGame();
    startTheGame();
  });

  backToStart.addEventListener("click", () => {
    endGameScreen.style.display = "none";
    backToStart.style.display = "none";
    backGround.style.display = "block";
    hideHeader.style.display = "block";
    instru.style.display = "block";
    marvelStudios.style.display = "block";
    gameOvBtn.style.display = "none";
    startBtn.style.display = "block";
    audioFirstScreen.style.display = "block";
    resetGame();
  });
});
