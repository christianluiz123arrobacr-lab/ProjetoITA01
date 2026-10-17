import type { Vec3 } from "./spatialGestureEngine";

export type Projected = { x: number; y: number; z: number };
export type PickMesh = { objectId: string; world: Vec3[]; projected: Projected[]; faces: number[][]; vertexIndices?: number[]; allowEdges?: boolean };
export type Pick = { objectId: string; kind: "vertex" | "edge" | "face" | "surface" | "solid"; indices: number[]; world: Vec3; local?: Vec3; screen: { x: number; y: number }; label: string };
export type Ray = { origin: Vec3; direction: Vec3 };

const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Vec3, b: Vec3): Vec3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
export const pointDistance = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export function rayTriangle(ray: Ray, a: Vec3, b: Vec3, c: Vec3): { point: Vec3; t: number } | null {
  const e1 = sub(b, a), e2 = sub(c, a), p = cross(ray.direction, e2);
  const det = dot(e1, p);
  if (Math.abs(det) < 1e-9) return null;
  const inv = 1 / det, tvec = sub(ray.origin, a);
  const u = dot(tvec, p) * inv;
  if (u < -1e-6 || u > 1 + 1e-6) return null;
  const q = cross(tvec, e1), v = dot(ray.direction, q) * inv;
  if (v < -1e-6 || u + v > 1 + 1e-6) return null;
  const t = dot(e2, q) * inv;
  if (t < 0) return null;
  return { t, point: { x: ray.origin.x + ray.direction.x * t, y: ray.origin.y + ray.direction.y * t, z: ray.origin.z + ray.direction.z * t } };
}

export function pickGeometry(meshes: PickMesh[], x: number, y: number, ray: Ray, snap = 13): Pick | null {
  const vertexHits: Array<{ distance: number; pick: Pick }> = [];
  const edgeHits: Array<{ distance: number; pick: Pick }> = [];
  const faceHits: Array<{ distance: number; pick: Pick }> = [];
  for (const mesh of meshes) {
    (mesh.vertexIndices ?? mesh.projected.map((_, index) => index)).forEach(index => {
      const point = mesh.projected[index];
      const distance = Math.hypot(x - point.x, y - point.y);
      if (distance <= snap) vertexHits.push({ distance, pick: { objectId: mesh.objectId, kind: "vertex", indices: [index], world: mesh.world[index], screen: point, label: `Vértice ${index + 1}` } });
    });
    const edges = new Set<string>();
    if (mesh.allowEdges !== false) for (const face of mesh.faces) for (let i = 0; i < face.length; i += 1) {
      const a = face[i], b = face[(i + 1) % face.length], key = [a, b].sort((m, n) => m - n).join(":");
      if (edges.has(key)) continue;
      edges.add(key);
      const pa = mesh.projected[a], pb = mesh.projected[b];
      const d = (pb.x - pa.x) ** 2 + (pb.y - pa.y) ** 2;
      const t = d ? Math.max(0, Math.min(1, ((x - pa.x) * (pb.x - pa.x) + (y - pa.y) * (pb.y - pa.y)) / d)) : 0;
      const sx = pa.x + t * (pb.x - pa.x), sy = pa.y + t * (pb.y - pa.y);
      const distance = Math.hypot(x - sx, y - sy);
      if (distance <= snap * 0.75) edgeHits.push({ distance, pick: { objectId: mesh.objectId, kind: "edge", indices: [a, b], world: { x: mesh.world[a].x + t * (mesh.world[b].x - mesh.world[a].x), y: mesh.world[a].y + t * (mesh.world[b].y - mesh.world[a].y), z: mesh.world[a].z + t * (mesh.world[b].z - mesh.world[a].z) }, screen: { x: sx, y: sy }, label: `Aresta ${a + 1}–${b + 1}` } });
    }
    mesh.faces.forEach((face, faceIndex) => {
      for (let i = 1; i < face.length - 1; i += 1) {
        const hit = rayTriangle(ray, mesh.world[face[0]], mesh.world[face[i]], mesh.world[face[i + 1]]);
        if (hit) faceHits.push({ distance: hit.t, pick: { objectId: mesh.objectId, kind: "face", indices: [faceIndex], world: hit.point, screen: { x, y }, label: `Face ${faceIndex + 1} · ponto na superfície` } });
      }
    });
  }
  vertexHits.sort((a, b) => a.distance - b.distance);
  edgeHits.sort((a, b) => a.distance - b.distance);
  faceHits.sort((a, b) => a.distance - b.distance);
  const front = faceHits[0]?.distance;
  const pointDepth = (point: Vec3) => dot(sub(point, ray.origin), ray.direction) / dot(ray.direction, ray.direction);
  const visible = (pick: Pick) => front === undefined || pointDepth(pick.world) <= front + 0.025;
  return vertexHits.find(hit => visible(hit.pick))?.pick ?? edgeHits.find(hit => visible(hit.pick))?.pick ?? faceHits[0]?.pick ?? null;
}

export function faceArea(vertices: Vec3[], face: number[]) {
  let area = 0;
  for (let i = 1; i < face.length - 1; i += 1) {
    const c = cross(sub(vertices[face[i]], vertices[face[0]]), sub(vertices[face[i + 1]], vertices[face[0]]));
    area += Math.hypot(c.x, c.y, c.z) / 2;
  }
  return area;
}

export function faceNormal(vertices: Vec3[], face: number[]): Vec3 | null {
  if (face.length < 3) return null;
  const normal = cross(sub(vertices[face[1]], vertices[face[0]]), sub(vertices[face[2]], vertices[face[0]]));
  const length = Math.hypot(normal.x, normal.y, normal.z);
  return length > 1e-9 ? { x: normal.x / length, y: normal.y / length, z: normal.z / length } : null;
}
