//=====================================================================//
//  THE PORTAL BEHIND THE MENU
//
//  The one piece of this game that is genuinely 3D. Everything else is a
//  2D canvas and stays that way: a WebGL context competing with the game
//  loop is how you lose frames on a phone, and the sound bug already
//  taught us what that costs. So this lives on the one screen that is
//  doing nothing — the menu — and it stops dead the moment a run starts.
//
//  What it draws is the image the film is about: the spell broken open,
//  Strange's mandala rings turning at angles to each other with the
//  multiverse receding through the middle of them.
//
//  Everything here is best-effort. three.js is fetched lazily, after the
//  menu is already usable, and if the import fails, the device has no
//  WebGL, or the machine says it prefers reduced motion, the menu is
//  exactly what it was without it. Nothing above calls into this
//  expecting an answer.
//=====================================================================//
const CANVAS_ID = "portal-canvas";

let renderer = null;
let scene = null;
let camera = null;
let rings = [];
let motes = null;
let frameId = null;
let running = false;
let started = false;

//Honour the setting rather than deciding for them: this is decoration on
//a menu, which is exactly the kind of thing the preference is for.
function motionAllowed() {
  return !(
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

//A context that is not going to work is better found out now than after
//670KB of library has been fetched.
function webglAvailable() {
  try {
    const probe = document.createElement("canvas");
    return !!(probe.getContext("webgl2") || probe.getContext("webgl"));
  } catch {
    return false;
  }
}

export async function startPortal() {
  if (started || !motionAllowed() || !webglAvailable()) return;
  started = true;

  const canvas = document.getElementById(CANVAS_ID);
  if (!canvas) return;

  let THREE;
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
    camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.z = 15;

    //---- the mandala, four rings on different axes ----
    //Torus rather than a flat ring: the whole point of doing this in 3D
    //is that they pass through each other as they turn.
    const GOLD = 0xf0b429;
    const HOT = 0xffe08a;
    for (let i = 0; i < 4; i++) {
      const radius = 3.4 - i * 0.55;
      const geo = new THREE.TorusGeometry(radius, 0.035 + i * 0.012, 8, 128);
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 ? HOT : GOLD,
        transparent: true,
        opacity: 0.62 - i * 0.07,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = i * 0.5;
      ring.rotation.y = i * 0.7;
      scene.add(ring);
      rings.push({
        mesh: ring,
        //Each on its own axis and its own speed, so they never sync up
        sx: (i % 2 ? -1 : 1) * (0.06 + i * 0.03),
        sy: (i % 3 ? 1 : -1) * (0.09 + i * 0.02),
        sz: 0.04 + i * 0.015,
      });

      //And the spokes, as a ring of short segments standing off each torus
      const spokes = 16 + i * 4;
      const points = [];
      for (let s = 0; s < spokes; s++) {
        const a = (s / spokes) * Math.PI * 2;
        points.push(
          new THREE.Vector3(Math.cos(a) * radius * 0.9, Math.sin(a) * radius * 0.9, 0),
          new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0)
        );
      }
      const spokeGeo = new THREE.BufferGeometry().setFromPoints(points);
      const spokeMat = new THREE.LineBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0.38 - i * 0.06,
      });
      const spokeMesh = new THREE.LineSegments(spokeGeo, spokeMat);
      ring.add(spokeMesh); //carried by the ring, so it turns with it
    }

    //---- what is coming through the middle ----
    //Points receding down the z axis. In 2D this was a static PNG; here
    //the perspective does the work and they genuinely come at you.
    const COUNT = 260;
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 2.6;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * r;
      pos[i * 3 + 2] = -Math.random() * 60;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    motes = new THREE.Points(
      moteGeo,
      new THREE.PointsMaterial({
        color: 0xffe08a,
        size: 0.08,
        transparent: true,
        opacity: 0.65,
        sizeAttenuation: true,
      })
    );
    scene.add(motes);

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

  for (const r of rings) {
    r.mesh.rotation.x += r.sx * dt;
    r.mesh.rotation.y += r.sy * dt;
    r.mesh.rotation.z += r.sz * dt;
  }
  if (motes) {
    const p = motes.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let z = p.getZ(i) + dt * 7;
      if (z > 13) z = -60; //past the camera, sent to the back again
      p.setZ(i, z);
    }
    p.needsUpdate = true;
  }
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
  for (const r of rings) {
    r.mesh.geometry.dispose();
    r.mesh.material.dispose();
  }
  rings = [];
  if (motes) {
    motes.geometry.dispose();
    motes.material.dispose();
    motes = null;
  }
  if (renderer) {
    renderer.dispose();
    renderer = null;
  }
  scene = null;
  camera = null;
}
