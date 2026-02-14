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

export function createDie(size = 1.5, lineWidthPx = 2): THREE.Group {
  const die = new THREE.Group();

  const boxGeo = new THREE.BoxGeometry(size, size, size);

  // Edges (thick lines). Note: WebGL ignores LineBasicMaterial.linewidth in most browsers.
  const edges = new THREE.EdgesGeometry(boxGeo);
  const positions = edges.attributes.position.array as ArrayLike<number>;

  // Dedupe segments to avoid double-thick seams.
  const EPS = 1e-6;
  const q = (n: number) => Math.round(n / EPS);

  const keyForPoint = (x: number, y: number, z: number) => `${q(x)},${q(y)},${q(z)}`;
  const keyForSegment = (
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number
  ) => {
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
    color: 0xff2a2a,
    linewidth: lineWidthPx, // in pixels
    depthTest: true,
    depthWrite: false,
  });

  // LineMaterial needs a resolution to compute pixel linewidth.
  // We set an initial value here. Update on resize in main.ts.
  lineMat.resolution.set(window.innerWidth, window.innerHeight);

  const edgeLines = new LineSegments2(lineGeom, lineMat);
  edgeLines.computeLineDistances();
  edgeLines.renderOrder = 1;
  // Nudge the line mesh slightly outward so it consistently sits in front of the occluder depth.
  edgeLines.scale.setScalar(1.0005);
  die.add(edgeLines);

  // Invisible occluder (depth-only)
  const occluderMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  occluderMat.colorWrite = false;
  occluderMat.depthWrite = true;
  occluderMat.depthTest = true;
  // Push the occluder slightly back in depth to avoid thick-line quads being partially clipped.
  occluderMat.polygonOffset = true;
  occluderMat.polygonOffsetFactor = 1;
  occluderMat.polygonOffsetUnits = 1;
  const occluder = new THREE.Mesh(boxGeo, occluderMat);
  occluder.renderOrder = -10;
  die.add(occluder);

  // Pips
  const pipMat = new THREE.MeshBasicMaterial({
    color: 0xff2a2a,
    depthTest: true,
    depthWrite: false, // prevent z-fighting with the occluder
  });
  const pipRadius = size * 0.08; // scales with die size
  const pipGeo = new THREE.CircleGeometry(pipRadius, 24);

  // Pip layout (all derived from `size`)
  const pipLift = size * 0.01; // Tune: lift pips slightly above die faces to prevent z-fighting. --- IGNORE ---
  const faceZ = size / 2 + pipLift; // Z position for pips on the front face. Back face is -faceZ.
  const pipInset = size * 0.24; // Pull pips away from edges so thicker lines don’t collide visually.

  // Signed distance used for left/right/up/down pip positions.
  const d = size / 2 - pipInset;

  // For readability: this is the signed distance used for left/right/up/down pip positions.
  const offset = faceZ;

  type Face = "front" | "back" | "right" | "left" | "top" | "bottom";

  const faceNormal = (face: Face) => {
    switch (face) {
      case "front": return new THREE.Vector3(0, 0, 1);
      case "back": return new THREE.Vector3(0, 0, -1);
      case "right": return new THREE.Vector3(1, 0, 0);
      case "left": return new THREE.Vector3(-1, 0, 0);
      case "top": return new THREE.Vector3(0, 1, 0);
      case "bottom": return new THREE.Vector3(0, -1, 0);
    }
  };

  // CircleGeometry is in the XY plane facing +Z.
  const faceQuat = (face: Face) => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), faceNormal(face));
    return q;
  };

  const addPip = (face: Face, x: number, y: number, z: number) => {
    const pip = new THREE.Mesh(pipGeo, pipMat);
    pip.position.set(x, y, z);
    pip.quaternion.copy(faceQuat(face));
    pip.renderOrder = 0;
    die.add(pip);
  };

  // Same layout you already have:
  addPip("front", 0, 0, offset); // front = 1
  addPip("right", offset, -d, d); addPip("right", offset, d, -d); // right = 2
  addPip("top", -d, offset, d); addPip("top", 0, offset, 0); addPip("top", d, offset, -d); // top = 3
  addPip("bottom", -d, -offset, d); addPip("bottom", -d, -offset, -d); addPip("bottom", d, -offset, d); addPip("bottom", d, -offset, -d); // bottom = 4
  addPip("left", -offset, -d, d); addPip("left", -offset, -d, -d); addPip("left", -offset, d, d); addPip("left", -offset, d, -d); addPip("left", -offset, 0, 0); // left = 5
  addPip("back", -d, d, -offset); addPip("back", d, d, -offset); addPip("back", -d, -d, -offset); addPip("back", d, -d, -offset); addPip("back", -d, 0, -offset); addPip("back", d, 0, -offset); // back = 6

  return die;
}