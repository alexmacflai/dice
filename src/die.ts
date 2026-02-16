import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry";

export type Die = {
  id: string;
  group: THREE.Group;
  row: number;
  col: number;
};

type Face = "front" | "back" | "right" | "left" | "top" | "bottom";
type PipSpec = { face: Face; x: number; y: number; z: number };
type DieResources = {
  boxGeo: THREE.BoxGeometry;
  lineGeom: LineSegmentsGeometry;
  lineMat: LineMaterial;
  occluderMat: THREE.MeshBasicMaterial;
  pipGeo: THREE.CircleGeometry;
  pipMat: THREE.MeshBasicMaterial;
  pips: PipSpec[];
  faceQuat: Record<Face, THREE.Quaternion>;
};

const RESOURCE_CACHE = new Map<string, DieResources>();
const UP_AXIS = new THREE.Vector3(0, 0, 1);
const FACE_NORMAL: Record<Face, THREE.Vector3> = {
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1),
  right: new THREE.Vector3(1, 0, 0),
  left: new THREE.Vector3(-1, 0, 0),
  top: new THREE.Vector3(0, 1, 0),
  bottom: new THREE.Vector3(0, -1, 0),
};

function buildResources(size: number, lineWidthPx: number): DieResources {
  const boxGeo = new THREE.BoxGeometry(size, size, size);

  // Edges (thick lines). Note: WebGL ignores LineBasicMaterial.linewidth in most browsers.
  const edges = new THREE.EdgesGeometry(boxGeo);
  const positions = edges.attributes.position.array as ArrayLike<number>;

  // Dedupe segments to avoid double-thick seams.
  const EPS = 1e-6;
  const q = (n: number) => Math.round(n / EPS);
  const keyForPoint = (x: number, y: number, z: number) => `${q(x)},${q(y)},${q(z)}`;
  const keyForSegment = (ax: number, ay: number, az: number, bx: number, by: number, bz: number) => {
    const a = keyForPoint(ax, ay, az);
    const b = keyForPoint(bx, by, bz);
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  };
  const deduped: number[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < positions.length; i += 6) {
    const ax = positions[i + 0];
    const ay = positions[i + 1];
    const az = positions[i + 2];
    const bx = positions[i + 3];
    const by = positions[i + 4];
    const bz = positions[i + 5];

    const key = keyForSegment(ax, ay, az, bx, by, bz);
    if (seen.has(key)) continue;
    seen.add(key);

    deduped.push(ax, ay, az, bx, by, bz);
  }
  const lineGeom = new LineSegmentsGeometry();
  lineGeom.setPositions(deduped);
  const lineMat = new LineMaterial({
    color: 0xfff6ff,
    linewidth: lineWidthPx, // in pixels
    depthTest: true,
    depthWrite: false,
  });

  // LineMaterial needs a resolution to compute pixel linewidth.
  // We set an initial value here. Update on resize in main.ts.
  lineMat.resolution.set(window.innerWidth, window.innerHeight);

  // Invisible occluder (depth-only)
  const occluderMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  occluderMat.colorWrite = false;
  occluderMat.depthWrite = true;
  occluderMat.depthTest = true;
  // Push the occluder slightly back in depth to avoid thick-line quads being partially clipped.
  occluderMat.polygonOffset = true;
  occluderMat.polygonOffsetFactor = 1;
  occluderMat.polygonOffsetUnits = 1;

  // Pips
  const pipMat = new THREE.MeshBasicMaterial({
    color: 0xfff6ff,
    depthTest: true,
    depthWrite: false, // prevent z-fighting with the occluder
  });
  const pipRadius = size * 0.064; // scales with die size
  const pipGeo = new THREE.CircleGeometry(pipRadius, 14);

  // Pip layout (all derived from `size`)
  const pipLift = size * 0.01; // Tune: lift pips slightly above die faces to prevent z-fighting. --- IGNORE ---
  const faceZ = size / 2 + pipLift; // Z position for pips on the front face. Back face is -faceZ.
  const pipInset = size * 0.24; // Pull pips away from edges so thicker lines don’t collide visually.

  // Signed distance used for left/right/up/down pip positions.
  const d = size / 2 - pipInset;
  const offset = faceZ;

  const faceQuat = {
    front: new THREE.Quaternion().setFromUnitVectors(UP_AXIS, FACE_NORMAL.front),
    back: new THREE.Quaternion().setFromUnitVectors(UP_AXIS, FACE_NORMAL.back),
    right: new THREE.Quaternion().setFromUnitVectors(UP_AXIS, FACE_NORMAL.right),
    left: new THREE.Quaternion().setFromUnitVectors(UP_AXIS, FACE_NORMAL.left),
    top: new THREE.Quaternion().setFromUnitVectors(UP_AXIS, FACE_NORMAL.top),
    bottom: new THREE.Quaternion().setFromUnitVectors(UP_AXIS, FACE_NORMAL.bottom),
  } satisfies Record<Face, THREE.Quaternion>;

  const pips: PipSpec[] = [
    { face: "front", x: 0, y: 0, z: offset },
    { face: "right", x: offset, y: -d, z: d }, { face: "right", x: offset, y: d, z: -d },
    { face: "top", x: -d, y: offset, z: d }, { face: "top", x: 0, y: offset, z: 0 }, { face: "top", x: d, y: offset, z: -d },
    { face: "bottom", x: -d, y: -offset, z: d }, { face: "bottom", x: -d, y: -offset, z: -d }, { face: "bottom", x: d, y: -offset, z: d }, { face: "bottom", x: d, y: -offset, z: -d },
    { face: "left", x: -offset, y: -d, z: d }, { face: "left", x: -offset, y: -d, z: -d }, { face: "left", x: -offset, y: d, z: d }, { face: "left", x: -offset, y: d, z: -d }, { face: "left", x: -offset, y: 0, z: 0 },
    { face: "back", x: -d, y: d, z: -offset }, { face: "back", x: d, y: d, z: -offset }, { face: "back", x: -d, y: -d, z: -offset }, { face: "back", x: d, y: -d, z: -offset }, { face: "back", x: -d, y: 0, z: -offset }, { face: "back", x: d, y: 0, z: -offset },
  ];

  return { boxGeo, lineGeom, lineMat, occluderMat, pipGeo, pipMat, pips, faceQuat };
}

function getResources(size: number, lineWidthPx: number) {
  const key = `${size}:${lineWidthPx}`;
  let resources = RESOURCE_CACHE.get(key);
  if (!resources) {
    resources = buildResources(size, lineWidthPx);
    RESOURCE_CACHE.set(key, resources);
  }
  return resources;
}

export function createDie(size = 1.5, lineWidthPx = 1): THREE.Group {
  const die = new THREE.Group();
  const resources = getResources(size, lineWidthPx);

  const edgeLines = new LineSegments2(resources.lineGeom, resources.lineMat);
  edgeLines.computeLineDistances();
  edgeLines.renderOrder = 1;
  edgeLines.scale.setScalar(1.0005);
  die.add(edgeLines);

  const occluder = new THREE.Mesh(resources.boxGeo, resources.occluderMat);
  occluder.renderOrder = -10;
  die.add(occluder);

  const pipInstances = new THREE.InstancedMesh(resources.pipGeo, resources.pipMat, resources.pips.length);
  pipInstances.renderOrder = 1;
  const tempObj = new THREE.Object3D();
  for (let i = 0; i < resources.pips.length; i++) {
    const pip = resources.pips[i];
    tempObj.position.set(pip.x, pip.y, pip.z);
    tempObj.quaternion.copy(resources.faceQuat[pip.face]);
    tempObj.scale.set(1, 1, 1);
    tempObj.updateMatrix();
    pipInstances.setMatrixAt(i, tempObj.matrix);
  }
  die.add(pipInstances);

  return die;
}
