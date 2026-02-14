import "./style.css";
import * as THREE from "three";
import { createDie, type Die } from "./die";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app not found");

// HUD fallback: ensure the toggle exists even if index.html got messed up
function ensureHud() {
  let hud = document.querySelector<HTMLDivElement>("#hud");

  if (!hud) {
    hud = document.createElement("div");
    hud.id = "hud";
    hud.setAttribute("aria-label", "mode selector");
    hud.innerHTML = `
      <div class="hud-pill" role="group" aria-label="rotation mode">
        <button id="mode-order" class="hud-btn is-active" type="button" aria-pressed="true">order</button>
        <button id="mode-chaos" class="hud-btn" type="button" aria-pressed="false">chaos</button>
      </div>
    `;
    document.body.appendChild(hud);
  }

  // Inject minimal HUD CSS if it's missing
  if (!document.querySelector("style[data-hud]") ) {
    const style = document.createElement("style");
    style.setAttribute("data-hud", "true");
    style.textContent = `
      #hud{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;pointer-events:auto}
      .hud-pill{display:inline-flex;gap:2px;padding:4px;border-radius:999px;background:rgba(20,20,20,.82);border:1px solid rgba(255,42,42,.55);box-shadow:0 8px 24px rgba(0,0,0,.65);backdrop-filter:blur(10px)}
      .hud-btn{appearance:none;border:0;border-radius:999px;padding:6px 10px;font:600 12px/1 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:.02em;text-transform:lowercase;color:rgba(255,255,255,.78);background:transparent;cursor:pointer}
      .hud-btn.is-active{color:#000;background:rgba(255,42,42,.98)}
      .hud-btn:focus-visible{outline:2px solid rgba(255,42,42,.95);outline-offset:2px}
    `;
    document.head.appendChild(style);
  }
}

ensureHud();

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(app.clientWidth, app.clientHeight);
app.appendChild(renderer.domElement);

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Camera (orthographic = truly isometric, no perspective distortion)
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);

// Dice grid (fixed for now)
const dice: Die[] = [];
const diceById = new Map<string, Die>();
const dieSize = 1;
const cols = 24;
const rows = 12;
const gap = 1; // space between dice

const step = dieSize + gap;
const gridW = (cols - 1) * step;
const gridH = (rows - 1) * step;
const startX = -gridW / 2;
const startY = gridH / 2;

function updateOrthoCamera(w: number, h: number) {
  const aspect = w / h;

  // Fit the grid height plus a margin so nothing clips.
  const margin = dieSize * 1.6;
  const viewH = gridH + margin * 2;
  const viewW = viewH * aspect;

  camera.left = -viewW / 2;
  camera.right = viewW / 2;
  camera.top = viewH / 2;
  camera.bottom = -viewH / 2;
  camera.updateProjectionMatrix();
}

updateOrthoCamera(app.clientWidth, app.clientHeight);

// No tilt: grid is fully frontal
const gridGroup = new THREE.Group();
gridGroup.rotation.set(0, 0, 0); // no tilt, fully frontal
scene.add(gridGroup);

const pointer = new THREE.Vector2();

// Removed ISO_BASE_EULER and ISO_BASE_QUAT per instructions

type Trigger = {
  timeMs: number;
  axisWorld: THREE.Vector3;
  angleRad: number;
  durationMs: number;
  snapAtEnd: boolean; // true for order
};

type SpinEvent = {
  id: number;
  axisWorld: THREE.Vector3;
  angleRad: number;
  durationMs: number;
  startTimeMs: number;
  lastEased: number;
  snapAtEnd: boolean;
};

type DieAnimState = {
  die: Die;
  triggers: Trigger[];
  events: SpinEvent[];
};

// Raycasting: click/tap a die
const raycaster = new THREE.Raycaster();

const animById = new Map<string, DieAnimState>();

// Milliseconds per 90° step. Total duration scales with steps.
const MS_PER_90 = 160;

function durationForAngleMs(angleRad: number) {
  const steps = Math.max(1, Math.round(Math.abs(angleRad) / (Math.PI / 2)));
  return steps * MS_PER_90;
}

function ensureAnimState(d: Die): DieAnimState {
  const existing = animById.get(d.id);
  if (existing) return existing;

  const st: DieAnimState = {
    die: d,
    triggers: [],
    events: [],
  };
  animById.set(d.id, st);
  return st;
}

function snapQuatToOrtho90(q: THREE.Quaternion) {
  // Robust snap: project to nearest signed axis-permutation matrix (cube orientation).
  // This guarantees an exact orthonormal 90°-grid orientation even after lots of accumulated float drift.

  const m = new THREE.Matrix4().makeRotationFromQuaternion(q);
  const e = m.elements;

  // Columns of the 3x3 rotation (Three.js uses column-major)
  const cols = [
    new THREE.Vector3(e[0], e[1], e[2]),
    new THREE.Vector3(e[4], e[5], e[6]),
    new THREE.Vector3(e[8], e[9], e[10]),
  ];

  // Pick, for each column, the axis (X/Y/Z) with largest absolute component.
  // Ensure the chosen axes are unique (permutation) using greedy selection.
  const used = new Set<number>();
  const snappedCols: THREE.Vector3[] = [];

  for (let c = 0; c < 3; c++) {
    const v = cols[c];
    const abs = [Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)];

    // Order candidates by strength
    const candidates = [0, 1, 2].sort((a, b) => abs[b] - abs[a]);

    let axis = candidates[0];
    if (used.has(axis)) {
      axis = candidates.find((a) => !used.has(a)) ?? axis;
    }
    used.add(axis);

    const sign = axis === 0 ? Math.sign(v.x || 1) : axis === 1 ? Math.sign(v.y || 1) : Math.sign(v.z || 1);

    const out = new THREE.Vector3(0, 0, 0);
    if (axis === 0) out.x = sign;
    if (axis === 1) out.y = sign;
    if (axis === 2) out.z = sign;

    snappedCols.push(out);
  }

  // Rebuild a proper right-handed basis:
  // set X and Y, then compute Z = X x Y. If it flips, fix Y.
  const x = snappedCols[0].clone();
  let y = snappedCols[1].clone();
  let z = new THREE.Vector3().crossVectors(x, y);

  if (z.lengthSq() === 0) {
    // Degenerate (shouldn’t happen), fall back to identity.
    q.identity();
    return q;
  }

  z.normalize();

  // If our snapped third column disagrees with right-handed Z, flip Y.
  const desiredZ = snappedCols[2].clone().normalize();
  if (desiredZ.lengthSq() > 0 && z.dot(desiredZ) < 0) {
    y.multiplyScalar(-1);
    z = new THREE.Vector3().crossVectors(x, y).normalize();
  }

  // Write columns back to matrix
  e[0] = x.x; e[1] = x.y; e[2] = x.z;
  e[4] = y.x; e[5] = y.y; e[6] = y.z;
  e[8] = z.x; e[9] = z.y; e[10] = z.z;

  q.setFromRotationMatrix(m);
  q.normalize();
  return q;
}

const easeFastAccelSlowDecel = (t: number) => {
  // Fast acceleration, slow deceleration
  const kick = 0.12;
  if (t <= kick) {
    const a = t / kick;
    return kick * a * a;
  }
  const u = (t - kick) / (1 - kick);
  return kick + (1 - kick) * (1 - Math.pow(1 - u, 3));
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let nextEventId = 1;

for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const group = createDie(dieSize);
    group.position.set(startX + c * step, startY - r * step, 0);

    // Rest: one face toward the camera (flat square look)
    group.rotation.set(0, 0, 0);

    // Tag all children so raycasting can recover the parent die group
    group.traverse((obj) => {
      obj.userData.dieId = `${r}-${c}`;
    });

    gridGroup.add(group);
    const dieObj: Die = { id: `${r}-${c}`, group, row: r, col: c };
    dice.push(dieObj);
    diceById.set(dieObj.id, dieObj);
    ensureAnimState(dieObj);
  }
}

function scheduleWaveRoll(clicked: Die) {
  const now = performance.now();

  // Ripple effect
  const delayPerStepMs = 120;

  for (const d of dice) {
    const dr = d.row - clicked.row;
    const dc = d.col - clicked.col;
    const distSteps = Math.sqrt(dr * dr + dc * dc);
    const startTime = now + distSteps * delayPerStepMs;

    const st = ensureAnimState(d);

    let axisWorld: THREE.Vector3;
    let angleRad: number;

    if (rotationMode === "order") {
      // 0:right, 1:left, 2:up, 3:down
      const dir = randomInt(0, 3);
      axisWorld = new THREE.Vector3(
        dir === 0 ? 1 : dir === 1 ? -1 : 0,
        dir === 2 ? 1 : dir === 3 ? -1 : 0,
        0
      ).normalize();

      const turns90 = randomInt(2, 5); // 180..450 degrees
      angleRad = turns90 * (Math.PI / 2);
      const durationMs = durationForAngleMs(angleRad);
      insertTrigger(st, startTime, axisWorld, angleRad, durationMs, true);
    } else {
      axisWorld = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
      const fullTurns = 2;              // full 360° spins
      const remainderTurns = randomInt(0, 3); // extra 90° chunks
      angleRad = fullTurns * Math.PI * 2 + remainderTurns * (Math.PI / 2);

      const durationMs = durationForAngleMs(angleRad);
      insertTrigger(st, startTime, axisWorld, angleRad, durationMs, false);
    }
  }
}

function insertTrigger(
  st: DieAnimState,
  timeMs: number,
  axisWorld: THREE.Vector3,
  angleRad: number,
  durationMs: number,
  snapAtEnd: boolean
) {
  st.triggers.push({ timeMs, axisWorld, angleRad, durationMs, snapAtEnd });
  st.triggers.sort((a, b) => a.timeMs - b.timeMs);
}

function setHighlight(dieId: string | null) {
  for (const d of dice) {
    const isSelected = dieId === d.id;
    d.group.traverse((obj) => {
      // Only affects materials that have a `color` (lines + pips)
      const mat = (obj as any).material;
      if (!mat || !mat.color) return;
      // If this material is shared across dice, clone it once per object
      if (!obj.userData.__matCloned) {
        (obj as any).material = mat.clone();
        obj.userData.__matCloned = true;
      }
      ((obj as any).material as any).color.set(isSelected ? 0xffffff : 0xff2a2a);
    });
  }
}

function onPointerDown(ev: PointerEvent) {
  // Ignore clicks on the HUD
  if ((ev.target as HTMLElement | null)?.closest?.("#hud")) return;

  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -(((ev.clientY - rect.top) / rect.height) * 2 - 1);

  pointer.set(x, y);
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(gridGroup.children, true);
  if (hits.length === 0) return;

  // Walk up to the object that has dieId
  let obj: THREE.Object3D | null = hits[0].object;
  while (obj && !obj.userData.dieId) obj = obj.parent;

  const dieId = obj?.userData.dieId ?? null;
  setHighlight(dieId);
  console.log("clicked", dieId);
  // If you see no rotation after click, check the console for errors.

  if (dieId) {
    const clickedDie = diceById.get(dieId);
    if (clickedDie) scheduleWaveRoll(clickedDie);
  }
}

renderer.domElement.addEventListener("pointerdown", onPointerDown);

// HUD: rotation mode
type RotationMode = "order" | "chaos";
let rotationMode: RotationMode = "order";

const btnOrder = document.querySelector<HTMLButtonElement>("#mode-order");
const btnChaos = document.querySelector<HTMLButtonElement>("#mode-chaos");
const btnLinesOn = document.querySelector<HTMLButtonElement>("#lines-on");
const btnLinesOff = document.querySelector<HTMLButtonElement>("#lines-off");
console.log("HUD buttons", {
  btnOrder: !!btnOrder,
  btnChaos: !!btnChaos,
  foundHud: !!document.querySelector("#hud"),
});

function setMode(next: RotationMode) {
  rotationMode = next;

  if (btnOrder && btnChaos) {
    const isOrder = next === "order";
    btnOrder.classList.toggle("is-active", isOrder);
    btnChaos.classList.toggle("is-active", !isOrder);
    btnOrder.setAttribute("aria-pressed", String(isOrder));
    btnChaos.setAttribute("aria-pressed", String(!isOrder));
  }
}

btnOrder?.addEventListener("click", () => setMode("order"));
btnChaos?.addEventListener("click", () => setMode("chaos"));

function setLines(enabled: boolean) {
  for (const d of dice) {
    d.group.traverse((obj) => {
      const mat: any = (obj as any).material;
      if (!mat || typeof mat.linewidth !== "number") return;

      mat.userData = mat.userData ?? {};
      if (mat.userData.__defaultLineWidthPx == null) {
        mat.userData.__defaultLineWidthPx = mat.linewidth;
      }

      if (enabled) {
        mat.linewidth = mat.userData.__defaultLineWidthPx;
        obj.visible = true;
      } else {
        mat.linewidth = 0;
        obj.visible = false;
      }

      mat.needsUpdate = true;
    });
  }
}

btnLinesOn?.addEventListener("click", () => {
  btnLinesOn.classList.add("is-active");
  btnLinesOff?.classList.remove("is-active");
  setLines(true);
});

btnLinesOff?.addEventListener("click", () => {
  btnLinesOff.classList.add("is-active");
  btnLinesOn?.classList.remove("is-active");
  setLines(false);
});

// Render loop
function tick() {

  const now = performance.now();

  for (const d of dice) {
    const st = ensureAnimState(d);

    // 1) Convert due triggers into spin events (additive, no cancel, no queue)
    while (st.triggers.length && st.triggers[0].timeMs <= now) {
      const trig = st.triggers.shift()!;
      st.events.push({
        id: nextEventId++,
        axisWorld: trig.axisWorld.clone(),
        angleRad: trig.angleRad,
        durationMs: trig.durationMs,
        startTimeMs: now,
        lastEased: 0,
        snapAtEnd: trig.snapAtEnd,
      });
    }

    if (!st.events.length) continue;

    // Stable deterministic order so results are consistent
    st.events.sort((a, b) => a.id - b.id);

    // 2) Apply all active events simultaneously (per-frame delta)
    for (let i = st.events.length - 1; i >= 0; i--) {
      const ev = st.events[i];

      const t = Math.min(1, Math.max(0, (now - ev.startTimeMs) / ev.durationMs));
      const eased = easeFastAccelSlowDecel(t);

      const deltaE = eased - ev.lastEased;
      ev.lastEased = eased;

      if (Math.abs(deltaE) > 1e-8) {
        const dAngle = ev.angleRad * deltaE;
        const dq = new THREE.Quaternion().setFromAxisAngle(ev.axisWorld, dAngle);
        // WORLD rotation => pre-multiply
        d.group.quaternion.premultiply(dq);
      }

      if (t === 1) {
        if (ev.snapAtEnd) snapQuatToOrtho90(d.group.quaternion);
        st.events.splice(i, 1);
      }
    }

    // When fully at rest in ORDER mode, enforce perfect cube alignment.
    if (rotationMode === "order" && st.events.length === 0) {
      snapQuatToOrtho90(d.group.quaternion);
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

// Resize
window.addEventListener("resize", () => {
  const w = app.clientWidth;
  const h = app.clientHeight;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);

  updateOrthoCamera(w, h);

  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
});