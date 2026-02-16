import "./style.css";
import * as THREE from "three";
import { createDie, type Die } from "./die";
import {
  MusicEngine,
  type MusicSelection,
  type RotationMode as AudioRotationMode,
  type PlayMode as AudioPlayMode,
} from "./audio";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app not found");
const appEl = app;

// HUD fallback: ensure the toggle exists even if index.html got messed up
function ensureHud() {
  let hud = document.querySelector<HTMLDivElement>("#hud");

  if (!hud) {
    hud = document.createElement("div");
    hud.id = "hud";
    hud.setAttribute("aria-label", "controls");
    hud.innerHTML = `
      <div class="hud-bar">
        <div class="hud-pill" role="group" aria-label="grid scale">
          <span class="hud-thumb" aria-hidden="true"></span>
          <button id="grid-scale-05x" class="hud-btn" type="button" aria-pressed="false">0.5x</button>
          <button id="grid-scale-1x" class="hud-btn is-active" type="button" aria-pressed="true">1x</button>
          <button id="grid-scale-2x" class="hud-btn" type="button" aria-pressed="false">2x</button>
        </div>
        <div class="hud-pill" role="group" aria-label="rotation mode">
          <span class="hud-thumb" aria-hidden="true"></span>
          <button id="mode-order" class="hud-btn is-active" type="button" aria-pressed="true">order</button>
          <button id="mode-chaos" class="hud-btn" type="button" aria-pressed="false">chaos</button>
        </div>
        <div class="hud-pill" role="group" aria-label="line mode">
          <span class="hud-thumb" aria-hidden="true"></span>
          <button id="lines-on" class="hud-btn is-active" type="button" aria-pressed="true">lines</button>
          <button id="lines-off" class="hud-btn" type="button" aria-pressed="false">no lines</button>
        </div>
        <div class="hud-pill" role="group" aria-label="play mode">
          <span class="hud-thumb" aria-hidden="true"></span>
          <button id="play-manual" class="hud-btn is-active" type="button" aria-pressed="true">manual</button>
          <button id="play-autoplay" class="hud-btn" type="button" aria-pressed="false">autoplay</button>
        </div>
        <div class="hud-pill" role="group" aria-label="music mode">
          <span class="hud-thumb" aria-hidden="true"></span>
          <button id="music-soft" class="hud-btn is-active" type="button" aria-pressed="true">soft</button>
          <button id="music-crisp" class="hud-btn" type="button" aria-pressed="false">crisp</button>
          <button id="music-manic" class="hud-btn" type="button" aria-pressed="false">manic</button>
          <button id="music-mute" class="hud-btn" type="button" aria-pressed="false">mute</button>
        </div>
      </div>
    `;
    document.body.appendChild(hud);
  }

  const hudBar = hud.querySelector<HTMLDivElement>(".hud-bar");
  if (hudBar && !hud.querySelector("#play-manual")) {
    const playPill = document.createElement("div");
    playPill.className = "hud-pill";
    playPill.setAttribute("role", "group");
    playPill.setAttribute("aria-label", "play mode");
    playPill.innerHTML = `
      <span class="hud-thumb" aria-hidden="true"></span>
      <button id="play-manual" class="hud-btn is-active" type="button" aria-pressed="true">manual</button>
      <button id="play-autoplay" class="hud-btn" type="button" aria-pressed="false">autoplay</button>
    `;
    hudBar.appendChild(playPill);
  }
  if (hudBar && !hud.querySelector("#grid-scale-1x")) {
    const scalePill = document.createElement("div");
    scalePill.className = "hud-pill";
    scalePill.setAttribute("role", "group");
    scalePill.setAttribute("aria-label", "grid scale");
    scalePill.innerHTML = `
      <span class="hud-thumb" aria-hidden="true"></span>
      <button id="grid-scale-05x" class="hud-btn" type="button" aria-pressed="false">0.5x</button>
      <button id="grid-scale-1x" class="hud-btn is-active" type="button" aria-pressed="true">1x</button>
      <button id="grid-scale-2x" class="hud-btn" type="button" aria-pressed="false">2x</button>
    `;
    hudBar.insertBefore(scalePill, hudBar.firstElementChild);
  }
  if (hudBar && !hud.querySelector("#music-soft")) {
    const musicPill = document.createElement("div");
    musicPill.className = "hud-pill";
    musicPill.setAttribute("role", "group");
    musicPill.setAttribute("aria-label", "music mode");
    musicPill.innerHTML = `
      <span class="hud-thumb" aria-hidden="true"></span>
      <button id="music-soft" class="hud-btn is-active" type="button" aria-pressed="true">soft</button>
      <button id="music-crisp" class="hud-btn" type="button" aria-pressed="false">crisp</button>
      <button id="music-manic" class="hud-btn" type="button" aria-pressed="false">manic</button>
      <button id="music-mute" class="hud-btn" type="button" aria-pressed="false">mute</button>
    `;
    hudBar.appendChild(musicPill);
  }
  if (hud && !hud.querySelector(".hud-mobile")) {
    const mobileBar = document.createElement("div");
    mobileBar.className = "hud-mobile";
    mobileBar.setAttribute("role", "navigation");
    mobileBar.setAttribute("aria-label", "mobile controls");
    mobileBar.innerHTML = `
      <button class="hud-mobile-trigger" type="button" data-menu="mode" aria-expanded="false">order</button>
      <button class="hud-mobile-trigger" type="button" data-menu="lines" aria-expanded="false">lines</button>
      <button class="hud-mobile-trigger" type="button" data-menu="play" aria-expanded="false">manual</button>
      <button class="hud-mobile-trigger" type="button" data-menu="music" aria-expanded="false">soft</button>
    `;
    hud.appendChild(mobileBar);
  }
  hud.querySelector('#hud .hud-mobile-trigger[data-menu="scale"]')?.remove();
  if (hud && !hud.querySelector('#hud .hud-mobile-trigger[data-menu="music"]')) {
    const mobileBar = hud.querySelector<HTMLDivElement>(".hud-mobile");
    if (mobileBar) {
      const trigger = document.createElement("button");
      trigger.className = "hud-mobile-trigger";
      trigger.type = "button";
      trigger.dataset.menu = "music";
      trigger.setAttribute("aria-expanded", "false");
      trigger.textContent = "soft";
      mobileBar.appendChild(trigger);
    }
  }
  if (hud && !hud.querySelector(".hud-mobile-menu")) {
    const mobileMenu = document.createElement("div");
    mobileMenu.className = "hud-mobile-menu";
    mobileMenu.setAttribute("aria-hidden", "true");
    hud.appendChild(mobileMenu);
  }

  // Ensure existing/static HUD pills have required animated layers.
  document.querySelectorAll<HTMLDivElement>(".hud-pill").forEach((pill) => {
    let thumb = pill.querySelector<HTMLSpanElement>(".hud-thumb");
    if (!thumb) {
      thumb = document.createElement("span");
      thumb.className = "hud-thumb";
      thumb.setAttribute("aria-hidden", "true");
      pill.prepend(thumb);
    }
    let mask = pill.querySelector<HTMLSpanElement>(".hud-mask");
    if (!mask) {
      mask = document.createElement("span");
      mask.className = "hud-mask";
      mask.setAttribute("aria-hidden", "true");
      pill.appendChild(mask);
    }
  });
}

ensureHud();

const MOBILE_HUD_BREAKPOINT_PX = 900;
let mobileHudReservePx = 0;

function isMobileHudMode() {
  return window.matchMedia(`(max-width: ${MOBILE_HUD_BREAKPOINT_PX}px)`).matches;
}

function setMobileHudReserve(px: number) {
  mobileHudReservePx = Math.max(0, Math.round(px));
  document.documentElement.style.setProperty("--hud-mobile-reserve", `${mobileHudReservePx}px`);
}

function syncMobileHudReserve() {
  if (!isMobileHudMode()) {
    setMobileHudReserve(0);
    return;
  }
  const hudMobile = document.querySelector<HTMLDivElement>("#hud .hud-mobile");
  if (!hudMobile) {
    setMobileHudReserve(0);
    return;
  }
  setMobileHudReserve(hudMobile.offsetHeight);
}

let wasMobileHudMode = isMobileHudMode();

function getViewportSize() {
  return {
    width: Math.max(1, appEl.clientWidth),
    height: Math.max(1, appEl.clientHeight),
  };
}

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

// ==== Quick Tuning Controls (keep these near the top) ====
// Rendering
const MAX_PIXEL_RATIO = 1.35;
const BASE_DIE_COLOR = 0xfff6ff;
const HIGHLIGHT_COLOR = 0xffffff;
const BLUR_LAYER_PX = 8;

// Grid layout
const BASE_DIE_SIZE = 1;
// 1 = fill cell, <1 smaller die in cell, >1 larger die in cell.
const DIE_CELL_FILL = 1.1;

// Wave/ripple timing
const RIPPLE_DELAY_PER_STEP_MS = 150;

// Rotation timing (independent for each mode)
const ORDER_MS_PER_90 = 120;
const CHAOS_MS_PER_90 = 120;

// Rotation transition/easing for each mode
const ORDER_ROTATION_EASING_FN = (t: number) => {
  const kick = 0.12;
  if (t <= kick) {
    const a = t / kick;
    return kick * a * a;
  }
  const u = (t - kick) / (1 - kick);
  return kick + (1 - kick) * (1 - Math.pow(1 - u, 3));
};
const CHAOS_ROTATION_EASING_FN = ORDER_ROTATION_EASING_FN;
const ORDER_TURNS90_MIN = 2;
const ORDER_TURNS90_MAX = 6;
const CHAOS_FULL_TURNS = 1;
const CHAOS_EXTRA_90_MIN = 0;
const CHAOS_EXTRA_90_MAX = 4;

// Hover scale tuning:
// Change this value to increase/decrease max hover size (1.10 = 110%).
const HOVER_MAX_SCALE = 1.35;
// Change this value to increase/decrease how far the hover influence reaches (in dice-grid steps).
const HOVER_FALLOFF_DISTANCE_STEPS = 5;
// Change this value to increase/decrease how much nearby dice scale down with distance.
const HOVER_FALLOFF_POWER = 2;
// Change this value to control hover response smoothness.
// Smaller = snappier response, larger = softer/slower follow.
const HOVER_RESPONSE_MS = 64;
// Change this value to increase/decrease how much dice shrink while spinning (0.8 = 80% at deepest point).
const SPIN_MIN_SCALE = 0.24;
// Change this value to choose when (during spin progress) the minimum scale is reached.
// Example: 0.2 means the smallest scale happens at 20% of the rotation duration.
const SPIN_MIN_SCALE_PROGRESS = 0.2;

type GridLayoutConfig = {
  minCellPx: number;
  maxCellPx: number;
  cellGapRatio: number; // gapPx = cellPx * ratio
  outerPaddingPx: number; // safety pad from viewport edges
  maxHoverScale: number;
  cameraMarginPx: number; // additional framing margin
  maxDiceCount?: number;
};

type GridLayout = {
  cellPx: number;
  gapPx: number;
  stepPx: number;
  stepXPx: number;
  stepYPx: number;
  cols: number;
  rows: number;
  gridWidthPx: number;
  gridHeightPx: number;
  offsetXPx: number;
  offsetYPx: number;
  worldUnitsPerPx: number;
};

const GRID_LAYOUT_CONFIG: GridLayoutConfig = {
  minCellPx: 40,
  maxCellPx: 80,
  cellGapRatio: 0.5,
  outerPaddingPx: 4,
  maxHoverScale: HOVER_MAX_SCALE,
  cameraMarginPx: 0,
  maxDiceCount: 2000,
};

const AUTOPLAY_BPM_DEFAULT = 64;
type AutoplayRhythmProfile = {
  barBeats: number;
  multipliers: readonly number[];
};

const AUTOPLAY_RHYTHM_BY_MODE: Record<"soft" | "crisp" | "manic", AutoplayRhythmProfile> = {
  soft: {
    barBeats: 4,
    multipliers: [4, 2, 1, 1, 0.5, 0.25, 0.25, 0.125],
  },
  crisp: {
    barBeats: 4,
    // Swing/shuffle feel: bias toward long-short triplet-style spacing.
    multipliers: [2, 1, 1, 2 / 3, 2 / 3, 0.5, 1 / 3, 1 / 3, 0.25, 1 / 12, 1 / 12, 1 / 12, 1 / 12],
  },
  manic: {
    barBeats: 3,
    multipliers: [4, 2, 2, 1, 0.5, 0.125, 0.0625],
  },
};
const getRenderPixelRatio = () => Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);

const blurRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
blurRenderer.domElement.classList.add("blur-layer");
blurRenderer.domElement.style.pointerEvents = "none";
renderer.domElement.classList.add("main-layer");

syncMobileHudReserve();
const initialViewport = getViewportSize();
renderer.setPixelRatio(getRenderPixelRatio());
renderer.setSize(initialViewport.width, initialViewport.height);
renderer.setClearColor(0x000000, 0);
blurRenderer.setPixelRatio(getRenderPixelRatio());
blurRenderer.setSize(initialViewport.width, initialViewport.height);
blurRenderer.setClearColor(0x000000, 0);
blurRenderer.domElement.style.filter = "blur(0px)";
blurRenderer.domElement.style.opacity = "0";
blurRenderer.domElement.style.mixBlendMode = "screen";
appEl.appendChild(blurRenderer.domElement);
appEl.appendChild(renderer.domElement);

// Scene
const scene = new THREE.Scene();
scene.background = null;
const blurScene = new THREE.Scene();
blurScene.background = null;

// Camera (orthographic = truly isometric, no perspective distortion)
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);

// Dice grid
const dice: Die[] = [];
const diceById = new Map<string, Die>();
let viewportWidth = appEl.clientWidth;
let viewportHeight = appEl.clientHeight;
let currentStepXWorld = BASE_DIE_SIZE;
let currentStepYWorld = BASE_DIE_SIZE;
let currentBaseDieScale = 1;
let currentLayout: GridLayout = {
  cellPx: GRID_LAYOUT_CONFIG.minCellPx,
  gapPx: GRID_LAYOUT_CONFIG.minCellPx * GRID_LAYOUT_CONFIG.cellGapRatio,
  stepPx: GRID_LAYOUT_CONFIG.minCellPx * (1 + GRID_LAYOUT_CONFIG.cellGapRatio),
  stepXPx: GRID_LAYOUT_CONFIG.minCellPx * (1 + GRID_LAYOUT_CONFIG.cellGapRatio),
  stepYPx: GRID_LAYOUT_CONFIG.minCellPx * (1 + GRID_LAYOUT_CONFIG.cellGapRatio),
  cols: 1,
  rows: 1,
  gridWidthPx: GRID_LAYOUT_CONFIG.minCellPx * GRID_LAYOUT_CONFIG.maxHoverScale,
  gridHeightPx: GRID_LAYOUT_CONFIG.minCellPx * GRID_LAYOUT_CONFIG.maxHoverScale,
  offsetXPx: 0,
  offsetYPx: 0,
  worldUnitsPerPx: 1,
};

function updateOrthoCameraToViewport(w: number, h: number) {
  const safeW = Math.max(1, w);
  const safeH = Math.max(1, h);
  const worldUnitsPerPx = Math.max(1e-6, currentLayout.worldUnitsPerPx);
  const viewW = safeW * worldUnitsPerPx;
  const viewH = safeH * worldUnitsPerPx;

  camera.left = -viewW / 2;
  camera.right = viewW / 2;
  camera.top = viewH / 2;
  camera.bottom = -viewH / 2;
  camera.updateProjectionMatrix();
}

// No tilt: grid is fully frontal
const gridGroup = new THREE.Group();
gridGroup.rotation.set(0, 0, 0); // no tilt, fully frontal
scene.add(gridGroup);
const blurGridGroup = new THREE.Group();
blurGridGroup.rotation.set(0, 0, 0);
blurScene.add(blurGridGroup);

const pointer = new THREE.Vector2();
const hoverPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const hoverPointWorld = new THREE.Vector3();
let primaryHoveredDieId: string | null = null;
let blurActiveDieId: string | null = null;
let blurPendingDieId: string | null = null;
let blurCurrentPx = 0;
let blurTargetPx = 0;

// Removed ISO_BASE_EULER and ISO_BASE_QUAT per instructions
type RotationMode = "order" | "chaos";
type PlayMode = "manual" | "autoplay";
type GridScalePreset = "0.5x" | "1x" | "2x";
type PersistedSettings = {
  rotationMode?: RotationMode;
  playMode?: PlayMode;
  linesEnabled?: boolean;
  gridScalePreset?: GridScalePreset;
  musicSelection?: MusicSelection;
};

const GRID_SCALE_PRESETS: Record<GridScalePreset, { minCellPx: number; maxCellPx: number }> = {
  "0.5x": { minCellPx: 28, maxCellPx: 56 },
  "1x": { minCellPx: 40, maxCellPx: 80 },
  "2x": { minCellPx: 64, maxCellPx: 120 },
};

const SETTINGS_STORAGE_KEY = "dice.controls.v1";

function parsePersistedSettings(): PersistedSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedSettings;
    return parsed ?? {};
  } catch {
    return {};
  }
}

const persistedSettings = parsePersistedSettings();
const persistedGridScale = persistedSettings.gridScalePreset;
const initialGridScalePreset: GridScalePreset =
  persistedGridScale === "0.5x" || persistedGridScale === "1x" || persistedGridScale === "2x"
    ? persistedGridScale
    : "1x";

let rotationMode: RotationMode = persistedSettings.rotationMode === "chaos" ? "chaos" : "order";
let playMode: PlayMode = persistedSettings.playMode === "autoplay" ? "autoplay" : "manual";
let currentGridScalePreset: GridScalePreset = initialGridScalePreset;
let preferredDesktopGridScalePreset: GridScalePreset = initialGridScalePreset;
let autoplayBpm = AUTOPLAY_BPM_DEFAULT;
let nextAutoplayRollAtMs = Number.POSITIVE_INFINITY;
let linesEnabled = persistedSettings.linesEnabled ?? true;
const legacyMusicSelection = (persistedSettings as { musicSelection?: string }).musicSelection;
let musicSelection: MusicSelection =
  persistedSettings.musicSelection === "crisp" ||
  persistedSettings.musicSelection === "manic" ||
  persistedSettings.musicSelection === "mute"
    ? persistedSettings.musicSelection
    : legacyMusicSelection === "weird"
      ? "manic"
    : "soft";
const music = new MusicEngine({
  initialSelection: musicSelection,
  onTempoChange: (bpm) => {
    autoplayBpm = bpm;
  },
});
autoplayBpm = music.getActiveBpm();

function persistSettings() {
  const payload: PersistedSettings = {
    rotationMode,
    playMode,
    linesEnabled,
    gridScalePreset: preferredDesktopGridScalePreset,
    musicSelection,
  };
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures (private mode, quota, etc).
  }
}

type Trigger = {
  timeMs: number;
  axisWorld: THREE.Vector3;
  angleRad: number;
  durationMs: number;
  snapAtEnd: boolean; // true for order
  easingMode: RotationMode;
};

type SpinEvent = {
  id: number;
  axisWorld: THREE.Vector3;
  angleRad: number;
  durationMs: number;
  startTimeMs: number;
  lastEased: number;
  snapAtEnd: boolean;
  easingMode: RotationMode;
};

type DieAnimState = {
  die: Die;
  triggers: Trigger[];
  events: SpinEvent[];
  hoverCurrentScale: number;
  hoverToScale: number;
  orderSnapActive: boolean;
  orderSnapFrom: THREE.Quaternion;
  orderSnapTo: THREE.Quaternion;
  orderSnapStartTimeMs: number;
};

type PersistedDieState = {
  quaternion: THREE.Quaternion;
};

// Raycasting: click/tap a die
const raycaster = new THREE.Raycaster();

const animById = new Map<string, DieAnimState>();
const blurGroupById = new Map<string, THREE.Group>();
const persistedDieStateById = new Map<string, PersistedDieState>();

function durationForAngleMs(angleRad: number, msPer90: number) {
  const steps = Math.max(1, Math.round(Math.abs(angleRad) / (Math.PI / 2)));
  return steps * msPer90;
}

function ensureAnimState(d: Die): DieAnimState {
  const existing = animById.get(d.id);
  if (existing) return existing;

  const st: DieAnimState = {
    die: d,
    triggers: [],
    events: [],
    hoverCurrentScale: 1,
    hoverToScale: 1,
    orderSnapActive: false,
    orderSnapFrom: new THREE.Quaternion(),
    orderSnapTo: new THREE.Quaternion(),
    orderSnapStartTimeMs: 0,
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

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function quatAngleRad(a: THREE.Quaternion, b: THREE.Quaternion) {
  const dot = Math.min(1, Math.max(-1, Math.abs(a.dot(b))));
  return 2 * Math.acos(dot);
}

let nextEventId = 1;

function fitCellCount(usablePx: number, footprintPx: number, stepPx: number) {
  if (usablePx < footprintPx || stepPx <= 0) return 0;
  return Math.floor((usablePx - footprintPx) / stepPx) + 1;
}

function applyDiceCap(cols: number, rows: number, maxDiceCount?: number) {
  if (!maxDiceCount || maxDiceCount <= 0) return { cols, rows };
  if (cols * rows <= maxDiceCount) return { cols, rows };

  if (cols > maxDiceCount) cols = maxDiceCount;
  rows = Math.min(rows, Math.max(1, Math.floor(maxDiceCount / Math.max(1, cols))));
  while (cols > 0 && rows > 0 && cols * rows > maxDiceCount) {
    cols--;
  }
  if (cols <= 0 || rows <= 0) return { cols: 0, rows: 0 };
  return { cols, rows };
}

function computeGridLayout(viewW: number, viewH: number, cfg: GridLayoutConfig): GridLayout {
  const safeViewW = Math.max(1, viewW);
  const safeViewH = Math.max(1, viewH);
  const minCell = Math.max(1, Math.floor(Math.min(cfg.minCellPx, cfg.maxCellPx)));
  const maxCell = Math.max(minCell, Math.floor(Math.max(cfg.minCellPx, cfg.maxCellPx)));
  const safePadPx = cfg.outerPaddingPx + cfg.cameraMarginPx;
  const usableW = Math.max(0, safeViewW - safePadPx * 2);
  const usableH = Math.max(0, safeViewH - safePadPx * 2);
  const fallbackWorldUnitsPerPx = BASE_DIE_SIZE / minCell;

  let best: GridLayout | null = null;

  for (let cellPx = maxCell; cellPx >= minCell; cellPx--) {
    const gapPx = cellPx * cfg.cellGapRatio;
    const stepPx = cellPx + gapPx;
    const footprintPx = cellPx * cfg.maxHoverScale;
    const fitCols = fitCellCount(usableW, footprintPx, stepPx);
    const fitRows = fitCellCount(usableH, footprintPx, stepPx);
    if (fitCols < 1 || fitRows < 1) continue;

    const capped = applyDiceCap(fitCols, fitRows, cfg.maxDiceCount);
    if (capped.cols < 1 || capped.rows < 1) continue;

    const gridWidthPx = (capped.cols - 1) * stepPx + footprintPx;
    const gridHeightPx = (capped.rows - 1) * stepPx + footprintPx;
    const slackXPx = Math.max(0, usableW - gridWidthPx);
    const slackYPx = Math.max(0, usableH - gridHeightPx);
    const extraStepX = capped.cols > 1 ? slackXPx / (capped.cols - 1) : 0;
    const extraStepY = capped.rows > 1 ? slackYPx / (capped.rows - 1) : 0;
    const stepXPx = stepPx + extraStepX;
    const stepYPx = stepPx + extraStepY;
    const offsetXPx = capped.cols > 1 ? 0 : slackXPx / 2;
    const offsetYPx = capped.rows > 1 ? 0 : slackYPx / 2;

    const candidate: GridLayout = {
      cellPx,
      gapPx,
      stepPx,
      stepXPx,
      stepYPx,
      cols: capped.cols,
      rows: capped.rows,
      gridWidthPx: capped.cols > 1 ? usableW : gridWidthPx,
      gridHeightPx: capped.rows > 1 ? usableH : gridHeightPx,
      offsetXPx,
      offsetYPx,
      worldUnitsPerPx: BASE_DIE_SIZE / cellPx,
    };

    if (!best) {
      best = candidate;
      continue;
    }

    const candidateCount = candidate.cols * candidate.rows;
    const bestCount = best.cols * best.rows;
    if (candidateCount > bestCount || (candidateCount === bestCount && candidate.cellPx > best.cellPx)) {
      best = candidate;
    }
  }

  if (best) return best;

  return {
    cellPx: minCell,
    gapPx: minCell * cfg.cellGapRatio,
    stepPx: minCell * (1 + cfg.cellGapRatio),
    stepXPx: minCell * (1 + cfg.cellGapRatio),
    stepYPx: minCell * (1 + cfg.cellGapRatio),
    cols: 0,
    rows: 0,
    gridWidthPx: 0,
    gridHeightPx: 0,
    offsetXPx: Math.max(0, usableW / 2),
    offsetYPx: Math.max(0, usableH / 2),
    worldUnitsPerPx: fallbackWorldUnitsPerPx,
  };
}

function makeDie(id: string, row: number, col: number): Die {
  const group = createDie(BASE_DIE_SIZE);
  const blurGroup = createDie(BASE_DIE_SIZE);
  group.rotation.set(0, 0, 0);
  blurGroup.rotation.copy(group.rotation);

  const persisted = persistedDieStateById.get(id);
  if (persisted) {
    group.quaternion.copy(persisted.quaternion);
    blurGroup.quaternion.copy(group.quaternion);
  }

  group.traverse((obj: any) => {
    obj.userData.dieId = id;
  });

  gridGroup.add(group);
  blurGridGroup.add(blurGroup);
  blurGroup.visible = false;
  applyLinesToGroup(group, linesEnabled);
  applyLinesToGroup(blurGroup, linesEnabled);

  const dieObj: Die = { id, group, row, col };
  diceById.set(id, dieObj);
  blurGroupById.set(id, blurGroup);
  ensureAnimState(dieObj);
  return dieObj;
}

function removeDieById(id: string) {
  const dieObj = diceById.get(id);
  if (!dieObj) return;
  persistedDieStateById.set(id, {
    quaternion: dieObj.group.quaternion.clone(),
  });
  const blurGroup = blurGroupById.get(id);
  if (blurGroup) {
    blurGridGroup.remove(blurGroup);
    blurGroupById.delete(id);
  }
  gridGroup.remove(dieObj.group);
  diceById.delete(id);
  animById.delete(id);
}

function reconcileDicePool(targetRows: number, targetCols: number) {
  const desiredIds = new Set<string>();
  for (let r = 0; r < targetRows; r++) {
    for (let c = 0; c < targetCols; c++) {
      desiredIds.add(`${r}-${c}`);
    }
  }

  for (const id of Array.from(diceById.keys())) {
    if (!desiredIds.has(id)) removeDieById(id);
  }

  const nextDice: Die[] = [];
  for (let r = 0; r < targetRows; r++) {
    for (let c = 0; c < targetCols; c++) {
      const id = `${r}-${c}`;
      let dieObj = diceById.get(id);
      if (!dieObj) {
        dieObj = makeDie(id, r, c);
      } else {
        dieObj.row = r;
        dieObj.col = c;
      }
      nextDice.push(dieObj);
    }
  }

  dice.length = 0;
  dice.push(...nextDice);

  if (primaryHoveredDieId && !diceById.has(primaryHoveredDieId)) {
    primaryHoveredDieId = null;
  }
  if (blurActiveDieId && !diceById.has(blurActiveDieId)) {
    blurActiveDieId = null;
    blurTargetPx = 0;
  }
  if (blurPendingDieId && !diceById.has(blurPendingDieId)) {
    blurPendingDieId = null;
  }

  if (playMode === "autoplay") {
    setHighlight(null);
    applyHoverTargets(null);
  }
}

function applyGridPositions(layout: GridLayout) {
  if (layout.cols < 1 || layout.rows < 1) {
    currentStepXWorld = BASE_DIE_SIZE;
    currentStepYWorld = BASE_DIE_SIZE;
    currentBaseDieScale = 1;
    return;
  }

  const safePadPx = GRID_LAYOUT_CONFIG.outerPaddingPx + GRID_LAYOUT_CONFIG.cameraMarginPx;
  const hoverFootprintPx = layout.cellPx * GRID_LAYOUT_CONFIG.maxHoverScale;
  const startCenterX =
    camera.left + (safePadPx + layout.offsetXPx + hoverFootprintPx / 2) * layout.worldUnitsPerPx;
  const startCenterY =
    camera.top - (safePadPx + layout.offsetYPx + hoverFootprintPx / 2) * layout.worldUnitsPerPx;

  currentStepXWorld = layout.stepXPx * layout.worldUnitsPerPx;
  currentStepYWorld = layout.stepYPx * layout.worldUnitsPerPx;
  currentBaseDieScale = ((layout.cellPx * layout.worldUnitsPerPx) / BASE_DIE_SIZE) * DIE_CELL_FILL;

  for (const d of dice) {
    const x = startCenterX + d.col * currentStepXWorld;
    const y = startCenterY - d.row * currentStepYWorld;
    d.group.position.set(x, y, 0);
    const blurGroup = blurGroupById.get(d.id);
    if (blurGroup) {
      blurGroup.position.copy(d.group.position);
    }
  }
}

function relayoutToViewport(w: number, h: number) {
  viewportWidth = Math.max(1, w);
  viewportHeight = Math.max(1, h);
  currentLayout = computeGridLayout(viewportWidth, viewportHeight, GRID_LAYOUT_CONFIG);
  updateOrthoCameraToViewport(viewportWidth, viewportHeight);
  reconcileDicePool(currentLayout.rows, currentLayout.cols);
  applyGridPositions(currentLayout);
}

function syncLineMaterialResolution(width: number, height: number) {
  for (const d of dice) {
    d.group.traverse((obj: any) => {
      const mat: any = (obj as any).material;
      if (!mat || typeof mat.linewidth !== "number" || !mat.resolution) return;
      mat.resolution.set(width, height);
    });
  }
  for (const blurGroup of blurGroupById.values()) {
    blurGroup.traverse((obj: any) => {
      const mat: any = (obj as any).material;
      if (!mat || typeof mat.linewidth !== "number" || !mat.resolution) return;
      mat.resolution.set(width, height);
    });
  }
}

{
  const { width, height } = getViewportSize();
  relayoutToViewport(width, height);
}
syncLineMaterialResolution(viewportWidth, viewportHeight);

function scheduleWaveRoll(clicked: Die) {
  const now = performance.now();
  music.triggerOriginNote({
    timeMs: now,
    row: clicked.row,
    col: clicked.col,
    dieId: clicked.id,
    rotationMode: rotationMode as AudioRotationMode,
    playMode: playMode as AudioPlayMode,
  });

  // Ripple effect
  for (const d of dice) {
    const dr = d.row - clicked.row;
    const dc = d.col - clicked.col;
    const distSteps = Math.sqrt(dr * dr + dc * dc);
    const startTime = now + distSteps * RIPPLE_DELAY_PER_STEP_MS;

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

      const turns90 = randomInt(ORDER_TURNS90_MIN, ORDER_TURNS90_MAX); // 180..450 degrees
      angleRad = turns90 * (Math.PI / 2);
      const durationMs = durationForAngleMs(angleRad, ORDER_MS_PER_90);
      insertTrigger(st, startTime, axisWorld, angleRad, durationMs, true, "order");
    } else {
      axisWorld = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
      const fullTurns = CHAOS_FULL_TURNS; // full 360° spins
      const remainderTurns = randomInt(CHAOS_EXTRA_90_MIN, CHAOS_EXTRA_90_MAX); // extra 90° chunks
      angleRad = fullTurns * Math.PI * 2 + remainderTurns * (Math.PI / 2);

      const durationMs = durationForAngleMs(angleRad, CHAOS_MS_PER_90);
      insertTrigger(st, startTime, axisWorld, angleRad, durationMs, false, "chaos");
    }
  }
}

function insertTrigger(
  st: DieAnimState,
  timeMs: number,
  axisWorld: THREE.Vector3,
  angleRad: number,
  durationMs: number,
  snapAtEnd: boolean,
  easingMode: RotationMode
) {
  st.triggers.push({ timeMs, axisWorld, angleRad, durationMs, snapAtEnd, easingMode });
  st.triggers.sort((a, b) => a.timeMs - b.timeMs);
}

function setDieHoverTargetScale(st: DieAnimState, targetScale: number) {
  if (Math.abs(st.hoverToScale - targetScale) < 1e-4) return;
  st.hoverToScale = targetScale;
}

function computeHoverTargetScaleFromPointer(candidate: Die, pointerWorld: THREE.Vector3) {
  const dx = candidate.group.position.x - pointerWorld.x;
  const dy = candidate.group.position.y - pointerWorld.y;
  const stepX = Math.max(1e-6, currentStepXWorld);
  const stepY = Math.max(1e-6, currentStepYWorld);
  const distSteps = Math.sqrt((dx * dx) / (stepX * stepX) + (dy * dy) / (stepY * stepY));

  if (distSteps >= HOVER_FALLOFF_DISTANCE_STEPS) return 1;

  const normalized = 1 - distSteps / HOVER_FALLOFF_DISTANCE_STEPS;
  const falloff = Math.pow(normalized, HOVER_FALLOFF_POWER);
  return 1 + (HOVER_MAX_SCALE - 1) * falloff;
}

function applyHoverTargets(pointerWorld: THREE.Vector3 | null) {
  primaryHoveredDieId = null;
  let nearestDistSq = Number.POSITIVE_INFINITY;

  for (const d of dice) {
    const st = ensureAnimState(d);
    const targetScale = pointerWorld ? computeHoverTargetScaleFromPointer(d, pointerWorld) : 1;
    setDieHoverTargetScale(st, targetScale);

    if (!pointerWorld) continue;
    const dx = d.group.position.x - pointerWorld.x;
    const dy = d.group.position.y - pointerWorld.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      primaryHoveredDieId = d.id;
    }
  }

  if (!primaryHoveredDieId) {
    blurPendingDieId = null;
    blurTargetPx = 0;
    return;
  }

  if (blurActiveDieId === null) {
    // No active blur yet: assign immediately then fade in.
    blurActiveDieId = primaryHoveredDieId;
    blurPendingDieId = null;
    blurTargetPx = BLUR_LAYER_PX;
    return;
  }

  if (blurActiveDieId === primaryHoveredDieId) {
    // Same die: keep fading/holding in.
    blurPendingDieId = null;
    blurTargetPx = BLUR_LAYER_PX;
    return;
  }

  // Different hovered die: fade out old one first, then switch/fade in in tick().
  blurPendingDieId = primaryHoveredDieId;
  blurTargetPx = 0;
}

function setHighlight(dieId: string | null) {
  for (const d of dice) {
    const isSelected = dieId === d.id;
    d.group.traverse((obj: any) => {
      // Only affects materials that have a `color` (lines + pips)
      const mat = (obj as any).material;
      if (!mat || !mat.color) return;
      // If this material is shared across dice, clone it once per object
      if (!obj.userData.__matCloned) {
        (obj as any).material = mat.clone();
        obj.userData.__matCloned = true;
      }
      ((obj as any).material as any).color.set(isSelected ? HIGHLIGHT_COLOR : BASE_DIE_COLOR);
    });
  }
}

function getDieIdFromPointer(ev: PointerEvent) {
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -(((ev.clientY - rect.top) / rect.height) * 2 - 1);

  pointer.set(x, y);
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(gridGroup.children, true);
  if (hits.length === 0) return null;

  let obj: THREE.Object3D | null = hits[0].object;
  while (obj && !obj.userData.dieId) obj = obj.parent;
  return obj?.userData.dieId ?? null;
}

function onPointerMove(ev: PointerEvent) {
  if ((ev.target as HTMLElement | null)?.closest?.("#hud")) return;
  if (playMode === "autoplay") {
    applyHoverTargets(null);
    return;
  }

  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -(((ev.clientY - rect.top) / rect.height) * 2 - 1);

  pointer.set(x, y);
  raycaster.setFromCamera(pointer, camera);
  const hitOnPlane = raycaster.ray.intersectPlane(hoverPlane, hoverPointWorld);
  applyHoverTargets(hitOnPlane ? hoverPointWorld : null);
}

function onPointerLeave() {
  applyHoverTargets(null);
}

async function onPointerDown(ev: PointerEvent) {
  try {
    await music.resumeIfNeeded();
  } catch {
    // If browser blocks resume, this interaction still handles visuals.
  }
  // Ignore clicks on the HUD
  if ((ev.target as HTMLElement | null)?.closest?.("#hud")) return;
  if (playMode === "autoplay") return;
  const dieId = getDieIdFromPointer(ev);
  if (!dieId) return;
  setHighlight(dieId);
  console.log("clicked", dieId);
  // If you see no rotation after click, check the console for errors.

  if (dieId) {
    const clickedDie = diceById.get(dieId);
    if (clickedDie) scheduleWaveRoll(clickedDie);
  }
}

renderer.domElement.addEventListener("pointerdown", onPointerDown);
renderer.domElement.addEventListener("pointermove", onPointerMove);
renderer.domElement.addEventListener("pointerleave", onPointerLeave);

// HUD: rotation mode
const btnOrder = document.querySelector<HTMLButtonElement>("#mode-order");
const btnChaos = document.querySelector<HTMLButtonElement>("#mode-chaos");
const btnLinesOn = document.querySelector<HTMLButtonElement>("#lines-on");
const btnLinesOff = document.querySelector<HTMLButtonElement>("#lines-off");
const btnPlayManual = document.querySelector<HTMLButtonElement>("#play-manual");
const btnPlayAutoplay = document.querySelector<HTMLButtonElement>("#play-autoplay");
const btnGridScale05x = document.querySelector<HTMLButtonElement>("#grid-scale-05x");
const btnGridScale1x = document.querySelector<HTMLButtonElement>("#grid-scale-1x");
const btnGridScale2x = document.querySelector<HTMLButtonElement>("#grid-scale-2x");
const btnMusicSoft = document.querySelector<HTMLButtonElement>("#music-soft");
const btnMusicCrisp = document.querySelector<HTMLButtonElement>("#music-crisp");
const btnMusicManic = document.querySelector<HTMLButtonElement>("#music-manic");
const btnMusicMute = document.querySelector<HTMLButtonElement>("#music-mute");
const modePill = btnOrder?.closest(".hud-pill") as HTMLDivElement | null;
const linesPill = btnLinesOn?.closest(".hud-pill") as HTMLDivElement | null;
const playPill = btnPlayManual?.closest(".hud-pill") as HTMLDivElement | null;
const scalePill = btnGridScale1x?.closest(".hud-pill") as HTMLDivElement | null;
const musicPill = btnMusicSoft?.closest(".hud-pill") as HTMLDivElement | null;
console.log("HUD buttons", {
  btnOrder: !!btnOrder,
  btnChaos: !!btnChaos,
  btnPlayManual: !!btnPlayManual,
  btnPlayAutoplay: !!btnPlayAutoplay,
  btnGridScale05x: !!btnGridScale05x,
  btnGridScale1x: !!btnGridScale1x,
  btnGridScale2x: !!btnGridScale2x,
  btnMusicSoft: !!btnMusicSoft,
  btnMusicCrisp: !!btnMusicCrisp,
  btnMusicManic: !!btnMusicManic,
  btnMusicMute: !!btnMusicMute,
  foundHud: !!document.querySelector("#hud"),
});

function ensurePillThumb(pill: HTMLDivElement | null) {
  if (!pill) return null;
  let thumb = pill.querySelector<HTMLSpanElement>(".hud-thumb");
  if (!thumb) {
    thumb = document.createElement("span");
    thumb.className = "hud-thumb";
    thumb.setAttribute("aria-hidden", "true");
    pill.prepend(thumb);
  }
  return thumb;
}

function ensurePillMask(pill: HTMLDivElement | null) {
  if (!pill) return null;
  let mask = pill.querySelector<HTMLSpanElement>(".hud-mask");
  if (!mask) {
    mask = document.createElement("span");
    mask.className = "hud-mask";
    mask.setAttribute("aria-hidden", "true");
    pill.appendChild(mask);
  }
  return mask;
}

function syncPillMaskLabels(pill: HTMLDivElement, mask: HTMLSpanElement) {
  const buttons = Array.from(pill.querySelectorAll<HTMLButtonElement>(".hud-btn"));
  for (const btn of buttons) {
    if (!btn.id) continue;
    let label = mask.querySelector<HTMLSpanElement>(`.hud-mask-label[data-btn-id="${btn.id}"]`);
    if (!label) {
      label = document.createElement("span");
      label.className = "hud-mask-label";
      label.dataset.btnId = btn.id;
      mask.appendChild(label);
    }
    label.textContent = btn.textContent ?? "";
    label.style.left = `${btn.offsetLeft}px`;
    label.style.top = `${btn.offsetTop}px`;
    label.style.width = `${btn.offsetWidth}px`;
    label.style.height = `${btn.offsetHeight}px`;
  }
}

function positionPillThumb(
  pill: HTMLDivElement | null,
  activeBtn: HTMLButtonElement | null,
  immediate = false
) {
  if (!pill || !activeBtn) return;
  const thumb = ensurePillThumb(pill);
  const mask = ensurePillMask(pill);
  if (!thumb || !mask) return;

  const left = activeBtn.offsetLeft;
  const width = activeBtn.offsetWidth;
  const right = pill.clientWidth - (left + width);
  const topInset = 4;
  const bottomInset = 4;

  if (immediate) thumb.style.transition = "none";
  if (immediate) mask.style.transition = "none";
  thumb.style.left = `${Math.round(left)}px`;
  thumb.style.width = `${Math.round(width)}px`;
  syncPillMaskLabels(pill, mask);
  mask.style.clipPath = `inset(${topInset}px ${Math.round(right)}px ${bottomInset}px ${Math.round(left)}px round 999px)`;
  if (immediate) {
    requestAnimationFrame(() => {
      if (thumb) thumb.style.transition = "";
      if (mask) mask.style.transition = "";
    });
  }
}

type MobileMenuKey = "mode" | "lines" | "play" | "music";

const mobileBar = document.querySelector<HTMLDivElement>("#hud .hud-mobile");
const mobileMenu = document.querySelector<HTMLDivElement>("#hud .hud-mobile-menu");
const hudRoot = document.querySelector<HTMLDivElement>("#hud");
const mobileTriggers = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#hud .hud-mobile-trigger")
);
let openMobileMenuKey: MobileMenuKey | null = null;

hudRoot?.addEventListener("pointerdown", () => {
  void music.resumeIfNeeded();
});

function getMobileMenuValue(menu: MobileMenuKey) {
  if (menu === "mode") return rotationMode;
  if (menu === "lines") return linesEnabled ? "lines" : "no lines";
  if (menu === "play") return playMode;
  return musicSelection;
}

function getMobileMenuOptions(menu: MobileMenuKey) {
  if (menu === "mode") return ["order", "chaos"];
  if (menu === "lines") return ["lines", "no lines"];
  if (menu === "play") return ["manual", "autoplay"];
  return ["soft", "crisp", "manic", "mute"];
}

function getMobileTrigger(menu: MobileMenuKey) {
  return mobileTriggers.find((trigger) => trigger.dataset.menu === menu) ?? null;
}

function syncMobileHudState() {
  for (const trigger of mobileTriggers) {
    const menu = trigger.dataset.menu as MobileMenuKey | undefined;
    if (!menu) continue;
    trigger.textContent = getMobileMenuValue(menu);
    const isOpen = openMobileMenuKey === menu;
    trigger.classList.toggle("is-open", isOpen);
    trigger.setAttribute("aria-expanded", String(isOpen));
  }

  if (openMobileMenuKey) {
    renderMobileMenu(openMobileMenuKey);
    positionMobileMenu(openMobileMenuKey);
  }
}

function positionMobileMenu(menu: MobileMenuKey) {
  if (!mobileMenu || !mobileBar) return;
  const hud = document.querySelector<HTMLDivElement>("#hud");
  const trigger = getMobileTrigger(menu);
  if (!hud || !trigger) return;

  const hudRect = hud.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();
  const menuWidth = mobileMenu.offsetWidth;
  const centeredLeft = triggerRect.left + triggerRect.width / 2 - menuWidth / 2 - hudRect.left;
  const minLeft = 8;
  const maxLeft = Math.max(minLeft, hudRect.width - menuWidth - 8);
  const clampedLeft = Math.max(minLeft, Math.min(maxLeft, centeredLeft));

  mobileMenu.style.left = `${Math.round(clampedLeft)}px`;
  mobileMenu.style.bottom = `${Math.round(mobileBar.offsetHeight + 8)}px`;
}

function closeMobileMenu() {
  openMobileMenuKey = null;
  if (!mobileMenu) return;
  mobileMenu.classList.remove("is-open");
  mobileMenu.setAttribute("aria-hidden", "true");
  syncMobileHudState();
}

function renderMobileMenu(menu: MobileMenuKey) {
  if (!mobileMenu) return;
  const selectedValue = getMobileMenuValue(menu);
  const options = getMobileMenuOptions(menu);
  mobileMenu.innerHTML = options
    .map((value) => {
      const isActive = value === selectedValue;
      return `<button class="hud-mobile-option ${isActive ? "is-active" : ""}" type="button" data-menu="${menu}" data-value="${value}">${value}</button>`;
    })
    .join("");
}

function openMobileMenu(menu: MobileMenuKey) {
  if (!mobileMenu) return;
  if (openMobileMenuKey === menu) {
    closeMobileMenu();
    return;
  }

  openMobileMenuKey = menu;
  renderMobileMenu(menu);
  mobileMenu.classList.add("is-open");
  mobileMenu.setAttribute("aria-hidden", "false");
  syncMobileHudState();
}

function setMode(next: RotationMode) {
  rotationMode = next;

  if (btnOrder && btnChaos) {
    const isOrder = next === "order";
    btnOrder.classList.toggle("is-active", isOrder);
    btnChaos.classList.toggle("is-active", !isOrder);
    btnOrder.setAttribute("aria-pressed", String(isOrder));
    btnChaos.setAttribute("aria-pressed", String(!isOrder));
    positionPillThumb(modePill, isOrder ? btnOrder : btnChaos);
  }
  syncMobileHudState();
  persistSettings();
}

btnOrder?.addEventListener("click", () => setMode("order"));
btnChaos?.addEventListener("click", () => setMode("chaos"));

function randomAutoplayIntervalMs() {
  // Per-mode rhythm profiles make autoplay phrasing feel distinct.
  const rhythmMode = musicSelection === "mute" ? "soft" : musicSelection;
  const profile = AUTOPLAY_RHYTHM_BY_MODE[rhythmMode];
  const msPerBeat = 60000 / Math.max(1, autoplayBpm);
  const msPerBar = msPerBeat * profile.barBeats;
  const idx = randomInt(0, profile.multipliers.length - 1);
  const multiplier = profile.multipliers[idx];
  return msPerBar * multiplier;
}

function randomAutoplayOriginCount() {
  const roll = Math.random();
  if (roll < 0.5) return 1;
  if (roll < 0.77) return 2;
  if (roll < 0.92) return 3;
  return 4;
}

function scheduleNextAutoplayRoll(nowMs: number) {
  nextAutoplayRollAtMs = nowMs + randomAutoplayIntervalMs();
}

function setPlayMode(next: PlayMode) {
  playMode = next;
  const isManual = next === "manual";

  if (btnPlayManual && btnPlayAutoplay) {
    btnPlayManual.classList.toggle("is-active", isManual);
    btnPlayAutoplay.classList.toggle("is-active", !isManual);
    btnPlayManual.setAttribute("aria-pressed", String(isManual));
    btnPlayAutoplay.setAttribute("aria-pressed", String(!isManual));
    positionPillThumb(playPill, isManual ? btnPlayManual : btnPlayAutoplay);
  }
  syncMobileHudState();

  if (isManual) {
    nextAutoplayRollAtMs = Number.POSITIVE_INFINITY;
    persistSettings();
    return;
  }

  setHighlight(null);
  applyHoverTargets(null);
  scheduleNextAutoplayRoll(performance.now());
  persistSettings();
}

btnPlayManual?.addEventListener("click", () => setPlayMode("manual"));
btnPlayAutoplay?.addEventListener("click", () => setPlayMode("autoplay"));

function setMusicSelection(next: MusicSelection) {
  musicSelection = next;
  music.setSelection(next);

  const isSoft = next === "soft";
  const isCrisp = next === "crisp";
  const isManic = next === "manic";
  const isMute = next === "mute";

  btnMusicSoft?.classList.toggle("is-active", isSoft);
  btnMusicCrisp?.classList.toggle("is-active", isCrisp);
  btnMusicManic?.classList.toggle("is-active", isManic);
  btnMusicMute?.classList.toggle("is-active", isMute);
  btnMusicSoft?.setAttribute("aria-pressed", String(isSoft));
  btnMusicCrisp?.setAttribute("aria-pressed", String(isCrisp));
  btnMusicManic?.setAttribute("aria-pressed", String(isManic));
  btnMusicMute?.setAttribute("aria-pressed", String(isMute));

  const activeBtn = isSoft
    ? btnMusicSoft
    : isCrisp
      ? btnMusicCrisp
      : isManic
        ? btnMusicManic
        : btnMusicMute;
  positionPillThumb(musicPill, activeBtn ?? null);
  syncMobileHudState();

  if (next !== "mute") {
    autoplayBpm = music.getActiveBpm();
  }
  persistSettings();
}

btnMusicSoft?.addEventListener("click", () => setMusicSelection("soft"));
btnMusicCrisp?.addEventListener("click", () => setMusicSelection("crisp"));
btnMusicManic?.addEventListener("click", () => setMusicSelection("manic"));
btnMusicMute?.addEventListener("click", () => setMusicSelection("mute"));

function setGridScalePreset(preset: GridScalePreset, options?: { persist?: boolean }) {
  const shouldPersist = options?.persist ?? true;
  const effectivePreset = isMobileHudMode() ? "1x" : preset;
  currentGridScalePreset = effectivePreset;
  if (!isMobileHudMode()) {
    preferredDesktopGridScalePreset = effectivePreset;
  }
  const values = GRID_SCALE_PRESETS[effectivePreset];
  GRID_LAYOUT_CONFIG.minCellPx = values.minCellPx;
  GRID_LAYOUT_CONFIG.maxCellPx = values.maxCellPx;

  const is05 = effectivePreset === "0.5x";
  const is1 = effectivePreset === "1x";
  const is2 = effectivePreset === "2x";

  btnGridScale05x?.classList.toggle("is-active", is05);
  btnGridScale1x?.classList.toggle("is-active", is1);
  btnGridScale2x?.classList.toggle("is-active", is2);
  btnGridScale05x?.setAttribute("aria-pressed", String(is05));
  btnGridScale1x?.setAttribute("aria-pressed", String(is1));
  btnGridScale2x?.setAttribute("aria-pressed", String(is2));
  positionPillThumb(scalePill, is05 ? btnGridScale05x ?? null : is1 ? btnGridScale1x ?? null : btnGridScale2x ?? null);
  syncMobileHudState();

  relayoutToViewport(viewportWidth, viewportHeight);
  syncLineMaterialResolution(viewportWidth, viewportHeight);
  if (shouldPersist) {
    persistSettings();
  }
}

btnGridScale05x?.addEventListener("click", () => setGridScalePreset("0.5x"));
btnGridScale1x?.addEventListener("click", () => setGridScalePreset("1x"));
btnGridScale2x?.addEventListener("click", () => setGridScalePreset("2x"));

function applyLinesToGroup(group: THREE.Group, enabled: boolean) {
  group.traverse((obj: any) => {
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

function setLines(enabled: boolean) {
  linesEnabled = enabled;
  for (const d of dice) applyLinesToGroup(d.group, enabled);
  for (const blurGroup of blurGroupById.values()) applyLinesToGroup(blurGroup, enabled);
}

function setLinesMode(enabled: boolean) {
  if (enabled) {
    btnLinesOn?.classList.add("is-active");
    btnLinesOff?.classList.remove("is-active");
    btnLinesOn?.setAttribute("aria-pressed", "true");
    btnLinesOff?.setAttribute("aria-pressed", "false");
    positionPillThumb(linesPill, btnLinesOn ?? null);
  } else {
    btnLinesOff?.classList.add("is-active");
    btnLinesOn?.classList.remove("is-active");
    btnLinesOff?.setAttribute("aria-pressed", "true");
    btnLinesOn?.setAttribute("aria-pressed", "false");
    positionPillThumb(linesPill, btnLinesOff ?? null);
  }
  setLines(enabled);
  syncMobileHudState();
  persistSettings();
}

btnLinesOn?.addEventListener("click", () => setLinesMode(true));
btnLinesOff?.addEventListener("click", () => setLinesMode(false));

for (const trigger of mobileTriggers) {
  trigger.addEventListener("click", () => {
    const menu = trigger.dataset.menu as MobileMenuKey | undefined;
    if (!menu) return;
    openMobileMenu(menu);
  });
}

mobileMenu?.addEventListener("click", (ev) => {
  const button = (ev.target as HTMLElement | null)?.closest?.(".hud-mobile-option") as HTMLButtonElement | null;
  if (!button) return;
  const menu = button.dataset.menu as MobileMenuKey | undefined;
  const value = button.dataset.value;
  if (!menu || !value) return;

  if (menu === "mode" && (value === "order" || value === "chaos")) setMode(value);
  if (menu === "lines") setLinesMode(value === "lines");
  if (menu === "play" && (value === "manual" || value === "autoplay")) setPlayMode(value);
  if (menu === "music" && (value === "soft" || value === "crisp" || value === "manic" || value === "mute")) {
    setMusicSelection(value);
  }
  closeMobileMenu();
});

document.addEventListener("pointerdown", (ev) => {
  const target = ev.target as HTMLElement | null;
  if (target?.closest?.("#hud")) return;
  closeMobileMenu();
});

positionPillThumb(modePill, btnOrder ?? btnChaos ?? null, true);
positionPillThumb(linesPill, btnLinesOn ?? btnLinesOff ?? null, true);
positionPillThumb(playPill, btnPlayManual ?? btnPlayAutoplay ?? null, true);
positionPillThumb(scalePill, btnGridScale1x ?? btnGridScale05x ?? btnGridScale2x ?? null, true);
positionPillThumb(
  musicPill,
  btnMusicSoft ?? btnMusicCrisp ?? btnMusicManic ?? btnMusicMute ?? null,
  true
);

setMode(rotationMode);
setLinesMode(linesEnabled);
setPlayMode(playMode);
setGridScalePreset(currentGridScalePreset, { persist: false });
setMusicSelection(musicSelection);
syncMobileHudState();

// Render loop
function tick() {

  const now = performance.now();
  const dtMs = now - lastTickMs;
  lastTickMs = now;
  const hoverBlend = 1 - Math.exp(-dtMs / Math.max(1, HOVER_RESPONSE_MS));
  let activeSpinningDiceCount = 0;

  if (playMode === "autoplay" && now >= nextAutoplayRollAtMs) {
    if (dice.length) {
      const originCount = Math.min(dice.length, randomAutoplayOriginCount());
      const pickedIndexes = new Set<number>();

      while (pickedIndexes.size < originCount) {
        pickedIndexes.add(randomInt(0, dice.length - 1));
      }

      for (const idx of pickedIndexes) {
        scheduleWaveRoll(dice[idx]);
      }
    }
    scheduleNextAutoplayRoll(now);
  }

  for (const d of dice) {
    const st = ensureAnimState(d);
    st.hoverCurrentScale = THREE.MathUtils.lerp(st.hoverCurrentScale, st.hoverToScale, hoverBlend);

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
        easingMode: trig.easingMode,
      });
    }

    if (st.events.length > 0 && st.orderSnapActive) {
      st.orderSnapActive = false;
    }

    let spinScale = 1;
    if (st.events.length) {
      // Stable deterministic order so results are consistent
      st.events.sort((a, b) => a.id - b.id);

      // 2) Apply all active events simultaneously (per-frame delta)
      for (let i = st.events.length - 1; i >= 0; i--) {
        const ev = st.events[i];

        const t = Math.min(1, Math.max(0, (now - ev.startTimeMs) / ev.durationMs));
        const eased =
          ev.easingMode === "order"
            ? ORDER_ROTATION_EASING_FN(t)
            : CHAOS_ROTATION_EASING_FN(t);
        // Spin-linked scale pulse: starts at 100%, reaches SPIN_MIN_SCALE at SPIN_MIN_SCALE_PROGRESS,
        // then recovers to 100% by the end. Duration is tied to rotation via the same event `t`.
        const peakProgress = THREE.MathUtils.clamp(SPIN_MIN_SCALE_PROGRESS, 0.01, 0.99);
        const pulse =
          t <= peakProgress
            ? t / peakProgress
            : Math.max(0, 1 - (t - peakProgress) / (1 - peakProgress));
        const evSpinScale = 1 - (1 - SPIN_MIN_SCALE) * pulse;
        spinScale = Math.min(spinScale, evSpinScale);

        const deltaE = eased - ev.lastEased;
        ev.lastEased = eased;

        if (Math.abs(deltaE) > 1e-8) {
          const dAngle = ev.angleRad * deltaE;
          const dq = new THREE.Quaternion().setFromAxisAngle(ev.axisWorld, dAngle);
          // WORLD rotation => pre-multiply
          d.group.quaternion.premultiply(dq);
        }

        if (t === 1) {
          st.events.splice(i, 1);
        }
      }
    }

    // Order mode: continuously steer toward nearest valid face orientation
    // during rolling so landings are naturally aligned without a final snap.
    if (rotationMode === "order") {
      const targetSnapQuat = d.group.quaternion.clone();
      snapQuatToOrtho90(targetSnapQuat);
      const settleTauMs =
        st.events.length > 0 ? 260 : st.triggers.length > 0 ? 170 : 85;
      const settleAlpha = 1 - Math.exp(-dtMs / Math.max(1, settleTauMs));
      d.group.quaternion.slerp(targetSnapQuat, settleAlpha);

      // Finish exactly on-grid once we're effectively settled.
      if (st.events.length === 0 && st.triggers.length === 0) {
        const remaining = quatAngleRad(d.group.quaternion, targetSnapQuat);
        if (remaining < 1e-4) {
          d.group.quaternion.copy(targetSnapQuat);
        }
      }
      st.orderSnapActive = false;
    } else {
      st.orderSnapActive = false;
    }

    // Hover and spin scales are additive by composition (multiplied), so neither cancels the other.
    d.group.scale.setScalar(currentBaseDieScale * st.hoverCurrentScale * spinScale);

    const blurGroup = blurGroupById.get(d.id);
    if (blurGroup) {
      blurGroup.visible = d.id === blurActiveDieId;
      blurGroup.quaternion.copy(d.group.quaternion);
      blurGroup.scale.copy(d.group.scale);
    }
    if (st.events.length > 0) {
      activeSpinningDiceCount++;
    }
  }

  music.setRippleActiveCount(activeSpinningDiceCount, dice.length);
  music.tick(now);

  // Blur uses a linear transition (constant px/ms), independent from hover scale easing.
  const blurSpeedPxPerMs = BLUR_LAYER_PX / Math.max(1, HOVER_RESPONSE_MS);
  const blurMaxStep = blurSpeedPxPerMs * dtMs;
  const blurDelta = blurTargetPx - blurCurrentPx;
  if (Math.abs(blurDelta) <= blurMaxStep) {
    blurCurrentPx = blurTargetPx;
  } else {
    blurCurrentPx += Math.sign(blurDelta) * blurMaxStep;
  }
  const blurNorm = BLUR_LAYER_PX > 0 ? THREE.MathUtils.clamp(blurCurrentPx / BLUR_LAYER_PX, 0, 1) : 0;
  blurRenderer.domElement.style.filter = `blur(${blurCurrentPx.toFixed(3)}px)`;
  // Fade opacity with blur amount so it doesn't pop in as a sharp duplicate before blur ramps up.
  blurRenderer.domElement.style.opacity = blurNorm.toFixed(3);

  // Complete handoff after fully faded out: switch blurred die, then fade back in.
  if (blurPendingDieId && blurCurrentPx < 0.05) {
    blurActiveDieId = blurPendingDieId;
    blurPendingDieId = null;
    blurTargetPx = BLUR_LAYER_PX;
  }

  if (!primaryHoveredDieId && blurCurrentPx < 0.05) {
    blurActiveDieId = null;
  }

  blurRenderer.render(blurScene, camera);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
let lastTickMs = performance.now();
tick();

window.addEventListener("beforeunload", () => {
  music.dispose();
});

// Resize
window.addEventListener("resize", () => {
  const nowMobileHudMode = isMobileHudMode();
  syncMobileHudReserve();
  if (!nowMobileHudMode) closeMobileMenu();

  if (nowMobileHudMode !== wasMobileHudMode) {
    if (nowMobileHudMode) {
      setGridScalePreset("1x", { persist: false });
    } else {
      setGridScalePreset(preferredDesktopGridScalePreset, { persist: false });
    }
    wasMobileHudMode = nowMobileHudMode;
  }
  const { width: w, height: h } = getViewportSize();

  renderer.setPixelRatio(getRenderPixelRatio());
  renderer.setSize(w, h);
  blurRenderer.setPixelRatio(getRenderPixelRatio());
  blurRenderer.setSize(w, h);

  relayoutToViewport(w, h);

  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";

  syncLineMaterialResolution(w, h);
  positionPillThumb(modePill, rotationMode === "order" ? btnOrder ?? null : btnChaos ?? null, true);
  positionPillThumb(
    linesPill,
    btnLinesOn?.classList.contains("is-active") ? btnLinesOn ?? null : btnLinesOff ?? null,
    true
  );
  positionPillThumb(
    playPill,
    btnPlayManual?.classList.contains("is-active") ? btnPlayManual ?? null : btnPlayAutoplay ?? null,
    true
  );
  positionPillThumb(
    scalePill,
    btnGridScale05x?.classList.contains("is-active")
      ? btnGridScale05x ?? null
      : btnGridScale1x?.classList.contains("is-active")
        ? btnGridScale1x ?? null
        : btnGridScale2x ?? null,
    true
  );
  positionPillThumb(
    musicPill,
    btnMusicSoft?.classList.contains("is-active")
      ? btnMusicSoft ?? null
      : btnMusicCrisp?.classList.contains("is-active")
        ? btnMusicCrisp ?? null
        : btnMusicManic?.classList.contains("is-active")
          ? btnMusicManic ?? null
          : btnMusicMute ?? null,
    true
  );
  syncMobileHudState();
});
