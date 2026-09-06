//=====================================================================//
//  THE INCURSIONS, BEHIND THE MENU
//
//  The one piece of this game that is genuinely 3D. Everything else is a
//  2D canvas and stays that way: a WebGL context competing with the game
//  loop is how a phone loses frames, and this branch has already paid
//  that bill once. So it lives on the screen that is idle — the menu —
//  and it stops dead the moment a run starts.
//
//  What it draws is the sky tearing open. Violet rifts split the dark,
//  hold for a moment with something bright behind them, throw a
//  shockwave, and close; another opens somewhere else. That is the whole
//  premise of the game underneath it — the spell broke and the universes
//  are coming through — and it is the one image the menu should be
//  showing while nobody has pressed START yet.
//
//  Why 3D earns its place here: the rifts sit at different depths and
//  the camera drifts, so they part from one another as you look at them,
//  and the storm comes *through* the screen rather than across it. Flat,
//  this would be a loop of purple lines.
//
//  Everything is best-effort. three.js is fetched lazily after the menu
//  is already usable, WebGL is probed before 670KB is downloaded rather
//  than after, and a machine asking for reduced motion gets none of it.
//  A failure at any point leaves the menu exactly as it was.
//=====================================================================//
const CANVAS_ID = "portal-canvas";

//The palette the film uses when the sky goes: deep violet in the body of
//the tear, lilac at its edges, and near-white only in the core, which is
//what keeps it reading as light rather than as paint.
const VIOLET = 0x7c3aed;
const LILAC = 0xc084fc;
const CORE = 0xf5ecff;

let THREE = null;
let renderer = null;
let scene = null;
let camera = null;
let drift = null; //everything hangs off this, so the camera can wander
let rifts = [];
let rings = [];
let motes = null;
let frameId = null;
let running = false;
let started = false;
let clock = 0;

function motionAllowed() {
  return !(
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function webglAvailable() {
  try {
    const probe = document.createElement("canvas");
    return !!(probe.getContext("webgl2") || probe.getContext("webgl"));
  } catch {
    return false;
  }
}

//A soft violet blot, built once and shared by every tear. A ribbon on
//its own is an edge; what makes a tear read as light spilling through is
//the haze around it, and a radial gradient on an additive plane is far
//cheaper than any amount of extra geometry.
let glowTexture = null;
function glow() {
  if (glowTexture) return glowTexture;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(226,200,255,0.95)");
  grd.addColorStop(0.35, "rgba(168,85,247,0.45)");
  grd.addColorStop(1, "rgba(109,40,217,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  glowTexture = new THREE.CanvasTexture(c);
  return glowTexture;
}

//=====================================================================//
//  A TEAR
//
//  Built as a ribbon rather than a line: WebGL caps line width at one
//  pixel on most drivers, so a tear drawn with LineBasicMaterial is a
//  hairline no matter what you ask for. This is a strip of triangles
//  either side of a jagged spine, and because it is real geometry it can
//  be given width that swells in the middle and closes to nothing at
//  both ends — which is what makes it read as something torn rather than
//  something drawn.
//=====================================================================//
const SEGMENTS = 40;

function makeRibbon(colour, opacity) {
  const geo = new THREE.BufferGeometry();
  const count = (SEGMENTS + 1) * 2;
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  const index = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const a = i * 2;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geo.setIndex(index);
  const mat = new THREE.MeshBasicMaterial({
    color: colour,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending, //light on light, never a flat shape
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geo, mat);
}

function seedRift(rift) {
  //Somewhere else, at some other depth, at some other angle. The spread
  //is wide on x because the menu is wide and a column of tears down the
  //middle would sit behind the title and be lost.
  rift.x = (Math.random() - 0.5) * 16;
  rift.y = (Math.random() - 0.5) * 7;
  rift.z = -2 - Math.random() * 16;
  rift.tilt = (Math.random() - 0.5) * 1.5;
  rift.length = 4.4 + Math.random() * 5.2;
  rift.width = 0.17 + Math.random() * 0.26;
  //The spine's kinks, held so the tear keeps its own shape while it is
  //open and only trembles. Re-rolled fresh each time one is reused.
  rift.kinks = [];
  for (let i = 0; i <= SEGMENTS; i++) rift.kinks.push((Math.random() - 0.5) * 0.5);
  rift.age = 0;
  rift.life = 2.6 + Math.random() * 2.8;
  rift.flashed = false;
}

function makeRift() {
  const group = new THREE.Group();
  const halo = makeRibbon(VIOLET, 0.34);
  const body = makeRibbon(LILAC, 0.6);
  const core = makeRibbon(CORE, 1);
  const bloom = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: glow(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  group.add(bloom, halo, body, core);
  drift.add(group);
  const rift = { group, halo, body, core, bloom };
  seedRift(rift);
  //Staggered, or every tear in the sky opens on the same frame
  rift.age = Math.random() * rift.life;
  return rift;
}

//How open a tear is at a given moment: nothing, then fast to full, held,
//then closing. Not a sine — a tear snaps open and lingers.
function openness(t) {
  if (t < 0.12) return (t / 0.12) ** 0.5;
  if (t < 0.7) return 1;
  return Math.max(0, 1 - (t - 0.7) / 0.3);
}

function shapeRift(rift, dt) {
  const t = rift.age / rift.life;
  const open = openness(t);
  const half = rift.length / 2;
  const cos = Math.cos(rift.tilt);
  const sin = Math.sin(rift.tilt);

  for (const [mesh, scale, jitter] of [
    [rift.halo, 5.2, 0.5],
    [rift.body, 2.3, 0.7],
    [rift.core, 0.5, 1],
  ]) {
    const pos = mesh.geometry.attributes.position;
    for (let i = 0; i <= SEGMENTS; i++) {
      const u = i / SEGMENTS;
      //Along the spine, tilted
      const along = (u - 0.5) * rift.length * 2 * half / rift.length;
      //Lateral kink, trembling a little so the edge is never still
      const kink =
        rift.kinks[i] * open +
        Math.sin(clock * 7 + i * 1.7) * 0.03 * jitter * open;
      const px = rift.x + along * -sin + kink * cos;
      const py = rift.y + along * cos + kink * sin;
      //Width swells in the middle and shuts at both tips
      const w = rift.width * scale * open * Math.sin(Math.PI * u) ** 0.7;
      pos.setXYZ(i * 2, px - w * cos, py - w * sin, rift.z);
      pos.setXYZ(i * 2 + 1, px + w * cos, py + w * sin, rift.z);
    }
    pos.needsUpdate = true;
  }
  //Brightest as it opens, so the moment of tearing is the loudest one
  const flare = open * (0.7 + 0.3 * Math.sin(clock * 5 + rift.x));
  rift.core.material.opacity = flare;
  rift.body.material.opacity = 0.6 * open;
  rift.halo.material.opacity = 0.34 * open;
  //The haze grows with the tear and sits just behind it
  const spread = rift.length * (0.9 + 0.25 * Math.sin(clock * 3 + rift.y));
  rift.bloom.position.set(rift.x, rift.y, rift.z - 0.05);
  rift.bloom.rotation.z = rift.tilt;
  rift.bloom.scale.set(spread * 0.55, spread, 1);
  rift.bloom.material.opacity = 0.5 * open;
}

//=====================================================================//
//  THE SHOCKWAVE
//
//  Thrown at the instant a tear reaches full width. Pooled: rings are
//  reused rather than built and disposed, which is what keeps this from
//  allocating geometry every couple of seconds for as long as the menu
//  is up.
//=====================================================================//
function makeRing() {
  const geo = new THREE.RingGeometry(0.82, 1, 72);
  const mat = new THREE.MeshBasicMaterial({
    color: LILAC,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.visible = false;
  drift.add(mesh);
  return { mesh, age: 0, life: 1, live: false };
}

function throwRing(x, y, z) {
  const ring = rings.find((r) => !r.live);
  if (!ring) return; //all busy; the sky is loud enough already
  ring.live = true;
  ring.age = 0;
  ring.life = 1.1 + Math.random() * 0.5;
  ring.mesh.visible = true;
  ring.mesh.position.set(x, y, z);
}

//=====================================================================//
export async function startPortal() {
  if (started || !motionAllowed() || !webglAvailable()) return;
  started = true;

  const canvas = document.getElementById(CANVAS_ID);
  if (!canvas) return;

  try {
    THREE = await import("../vendor/three.module.min.js");
  } catch {
    return; //no library, no portal, no difference to anything else
  }

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true, //the city behind it still shows through
      antialias: true,
      powerPreference: "low-power",
    });
    //Capped rather than devicePixelRatio outright: a phone at 3x is
    //drawing nine times the pixels for a backdrop nobody is looking at.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(58, 1, 0.1, 120);
    camera.position.z = 14;

    drift = new THREE.Group();
    scene.add(drift);

    for (let i = 0; i < 9; i++) rifts.push(makeRift());
    for (let i = 0; i < 7; i++) rings.push(makeRing());

    //---- the storm coming through ----
    //Points down the z axis. The perspective does the work: they arrive
    //rather than drift, which is the difference between this and a
    //particle field painted on the back of a 2D canvas.
    const COUNT = 420;
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 9;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * r * 0.6;
      pos[i * 3 + 2] = -Math.random() * 70;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    motes = new THREE.Points(
      moteGeo,
      new THREE.PointsMaterial({
        color: LILAC,
        size: 0.075,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      })
    );
    drift.add(motes);

    resize();
    window.addEventListener("resize", resize);
    canvas.classList.add("is-lit"); //fades in, so it never pops
    running = true;
    loop();
  } catch {
    //A half-built scene is worse than none: put it back the way it was
    stopPortal();
  }
}

function resize() {
  if (!renderer || !camera) return;
  const canvas = renderer.domElement;
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

let last = 0;
function loop(now = 0) {
  if (!running) return;
  frameId = requestAnimationFrame(loop);
  //Clamped the same way the game's own loop is, and for the same reason:
  //a tab that was away hands back a delta measured in seconds.
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  clock += dt;

  for (const rift of rifts) {
    rift.age += dt;
    if (rift.age >= rift.life) seedRift(rift);
    //One shockwave per tear, at the moment it finishes opening
    if (!rift.flashed && rift.age / rift.life > 0.12) {
      rift.flashed = true;
      throwRing(rift.x, rift.y, rift.z);
    }
    shapeRift(rift, dt);
  }

  for (const ring of rings) {
    if (!ring.live) continue;
    ring.age += dt;
    const k = ring.age / ring.life;
    if (k >= 1) {
      ring.live = false;
      ring.mesh.visible = false;
      continue;
    }
    const s = 0.4 + k * 7;
    ring.mesh.scale.set(s, s, s);
    ring.mesh.material.opacity = 0.72 * (1 - k) ** 2;
  }

  if (motes) {
    const p = motes.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let z = p.getZ(i) + dt * 9;
      if (z > 12) z = -70; //past the camera, sent to the back again
      p.setZ(i, z);
    }
    p.needsUpdate = true;
  }

  //A slow wander, which is what parts the tears from one another and
  //makes the depth legible without anyone being asked to notice it.
  drift.rotation.y = Math.sin(clock * 0.09) * 0.16;
  drift.rotation.x = Math.cos(clock * 0.07) * 0.08;

  renderer.render(scene, camera);
}

//Called when a run starts. The game gets the whole machine to itself.
export function pausePortal() {
  running = false;
  if (frameId !== null) cancelAnimationFrame(frameId);
  frameId = null;
}

export function resumePortal() {
  if (!renderer || running) return;
  running = true;
  last = 0;
  loop();
}

//Only on the way out, or if building it failed halfway.
export function stopPortal() {
  pausePortal();
  window.removeEventListener("resize", resize);
  for (const rift of rifts) {
    for (const mesh of [rift.halo, rift.body, rift.core, rift.bloom]) {
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
  }
  rifts = [];
  for (const ring of rings) {
    ring.mesh.geometry.dispose();
    ring.mesh.material.dispose();
  }
  rings = [];
  if (motes) {
    motes.geometry.dispose();
    motes.material.dispose();
    motes = null;
  }
  if (glowTexture) {
    glowTexture.dispose();
    glowTexture = null;
  }
  if (renderer) {
    renderer.dispose();
    renderer = null;
  }
  scene = null;
  camera = null;
  drift = null;
}
