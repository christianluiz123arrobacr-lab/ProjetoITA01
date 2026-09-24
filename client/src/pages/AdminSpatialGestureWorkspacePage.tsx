import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Box,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Focus,
  Grid3X3,
  Maximize2,
  MousePointer2,
  Plus,
  Redo2,
  Rotate3D,
  Ruler,
  Shapes,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import SpatialGestureWorkspaceControls, {
  type GestureMenuAction,
} from "@/components/admin/SpatialGestureWorkspaceControls";
import { unprojectScreenDelta, type Vec3 } from "@/lib/gestures/spatialGestureEngine";
import type { SpatialInteractionState } from "@/lib/gestures/spatialInteractionMachine";
import "./adminSpatialGestureWorkspace.css";

type SolidKind =
  | "cube"
  | "box"
  | "regularPrism"
  | "pyramid"
  | "cylinder"
  | "cone"
  | "sphere";

type Dimensions = {
  width: number;
  height: number;
  depth: number;
  radius: number;
  sides: number;
};

type SceneObject = {
  id: string;
  name: string;
  kind: SolidKind;
  role: "independent" | "outer" | "inner";
  position: Vec3;
  rotation: Vec3;
  scale: number;
  dimensions: Dimensions;
  color: string;
};

type ViewState = { x: number; y: number; zoom: number };
type Vec2 = { x: number; y: number; z: number };
type Mesh = { vertices: Vec3[]; faces: number[][] };
type Panel = "objects" | "properties" | "geometry" | "measure";
type CutMode = "none" | "axial" | "base" | "central" | "diagonal";
type Measurement = { from: string; to: string; distance: number };

const VIEWBOX = { width: 900, height: 620, cx: 450, cy: 310 };
const COLORS = ["#22d3ee", "#a78bfa", "#fb7185", "#fbbf24", "#34d399", "#60a5fa", "#f472b6"];
const SOLID_LABELS: Record<SolidKind, string> = {
  cube: "Cubo",
  box: "Paralelepípedo",
  regularPrism: "Prisma regular",
  pyramid: "Pirâmide",
  cylinder: "Cilindro",
  cone: "Cone",
  sphere: "Esfera",
};

const DEFAULT_DIMENSIONS: Record<SolidKind, Dimensions> = {
  cube: { width: 3, height: 3, depth: 3, radius: 1.5, sides: 4 },
  box: { width: 4.2, height: 3, depth: 2.7, radius: 1.5, sides: 4 },
  regularPrism: { width: 3, height: 4, depth: 3, radius: 1.8, sides: 6 },
  pyramid: { width: 3.6, height: 4, depth: 3.6, radius: 1.8, sides: 4 },
  cylinder: { width: 3, height: 4, depth: 3, radius: 1.7, sides: 16 },
  cone: { width: 3, height: 4, depth: 3, radius: 1.8, sides: 16 },
  sphere: { width: 3, height: 3, depth: 3, radius: 2, sides: 16 },
};

function cloneObjects(objects: SceneObject[]) {
  return objects.map(object => ({
    ...object,
    position: { ...object.position },
    rotation: { ...object.rotation },
    dimensions: { ...object.dimensions },
  }));
}

function createObject(kind: SolidKind, index: number, role: SceneObject["role"] = "independent", position?: Vec3): SceneObject {
  const offset = ((index % 5) - 2) * 0.72;
  return {
    id: `solid-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    name: `${SOLID_LABELS[kind]} ${index + 1}`,
    kind,
    role,
    position: position ?? { x: offset, y: ((index % 3) - 1) * 0.32, z: (index % 2) * 0.45 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
    dimensions: { ...DEFAULT_DIMENSIONS[kind] },
    color: COLORS[index % COLORS.length],
  };
}

function initialObjects() {
  const cube = createObject("cube", 0, "independent", { x: 0, y: 0, z: 0 });
  cube.name = "Cubo principal";
  return [cube];
}

function rotatePoint(point: Vec3, rotation: Vec3) {
  const rx = (rotation.x * Math.PI) / 180;
  const ry = (rotation.y * Math.PI) / 180;
  const rz = (rotation.z * Math.PI) / 180;
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);
  const x1 = point.x;
  const y1 = point.y * cx - point.z * sx;
  const z1 = point.y * sx + point.z * cx;
  const x2 = x1 * cy + z1 * sy;
  const y2 = y1;
  const z2 = -x1 * sy + z1 * cy;
  return { x: x2 * cz - y2 * sz, y: x2 * sz + y2 * cz, z: z2 };
}

function transformPoint(point: Vec3, object: SceneObject) {
  const scaled = {
    x: point.x * object.scale,
    y: point.y * object.scale,
    z: point.z * object.scale,
  };
  const rotated = rotatePoint(scaled, object.rotation);
  return {
    x: rotated.x + object.position.x,
    y: rotated.y + object.position.y,
    z: rotated.z + object.position.z,
  };
}

function project(point: Vec3, view: ViewState): Vec2 {
  const rotated = rotatePoint(point, { x: view.x, y: view.y, z: 0 });
  const perspective = 1 / Math.max(0.5, 1 - rotated.z / 28);
  const scale = 68 * view.zoom * perspective;
  return {
    x: VIEWBOX.cx + rotated.x * scale,
    y: VIEWBOX.cy - rotated.y * scale,
    z: rotated.z,
  };
}

function radialMesh(radius: number, height: number, sides: number, topRadius = radius): Mesh {
  const vertices: Vec3[] = [];
  for (let ring = 0; ring < 2; ring += 1) {
    const y = ring ? height / 2 : -height / 2;
    const r = ring ? topRadius : radius;
    for (let i = 0; i < sides; i += 1) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      vertices.push({ x: Math.cos(angle) * r, y, z: Math.sin(angle) * r });
    }
  }
  const faces: number[][] = [];
  faces.push(Array.from({ length: sides }, (_, i) => i).reverse());
  if (topRadius > 0) faces.push(Array.from({ length: sides }, (_, i) => sides + i));
  for (let i = 0; i < sides; i += 1) faces.push([i, (i + 1) % sides, sides + ((i + 1) % sides), sides + i]);
  return { vertices, faces };
}

function meshFor(object: SceneObject): Mesh {
  const { width, height, depth, radius, sides } = object.dimensions;
  if (object.kind === "cube" || object.kind === "box") {
    const w = width / 2, h = height / 2, d = depth / 2;
    return {
      vertices: [
        { x: -w, y: -h, z: -d }, { x: w, y: -h, z: -d }, { x: w, y: h, z: -d }, { x: -w, y: h, z: -d },
        { x: -w, y: -h, z: d }, { x: w, y: -h, z: d }, { x: w, y: h, z: d }, { x: -w, y: h, z: d },
      ],
      faces: [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [3, 2, 6, 7], [1, 5, 6, 2], [0, 3, 7, 4]],
    };
  }
  if (object.kind === "pyramid") return radialMesh(radius, height, Math.max(3, Math.round(sides)), 0);
  if (object.kind === "regularPrism") return radialMesh(radius, height, Math.max(3, Math.round(sides)));
  if (object.kind === "cylinder") return radialMesh(radius, height, 18);
  if (object.kind === "cone") return radialMesh(radius, height, 18, 0);
  const vertices: Vec3[] = [];
  const faces: number[][] = [];
  const latitudes = 7;
  const longitudes = 14;
  for (let lat = 0; lat <= latitudes; lat += 1) {
    const phi = (lat / latitudes) * Math.PI;
    for (let lon = 0; lon < longitudes; lon += 1) {
      const theta = (lon / longitudes) * Math.PI * 2;
      vertices.push({ x: radius * Math.sin(phi) * Math.cos(theta), y: radius * Math.cos(phi), z: radius * Math.sin(phi) * Math.sin(theta) });
    }
  }
  for (let lat = 0; lat < latitudes; lat += 1) {
    for (let lon = 0; lon < longitudes; lon += 1) {
      const next = (lon + 1) % longitudes;
      faces.push([lat * longitudes + lon, lat * longitudes + next, (lat + 1) * longitudes + next, (lat + 1) * longitudes + lon]);
    }
  }
  return { vertices, faces };
}

function metricsFor(object: SceneObject) {
  const { width, height, depth, radius, sides } = object.dimensions;
  const scale3 = object.scale ** 3;
  const scale2 = object.scale ** 2;
  if (object.kind === "cube") return { volume: width ** 3 * scale3, area: 6 * width ** 2 * scale2, formula: "V = a³ · A = 6a²" };
  if (object.kind === "box") return { volume: width * height * depth * scale3, area: 2 * (width * height + width * depth + height * depth) * scale2, formula: "V = abc · A = 2(ab + ac + bc)" };
  if (object.kind === "sphere") return { volume: (4 / 3) * Math.PI * radius ** 3 * scale3, area: 4 * Math.PI * radius ** 2 * scale2, formula: "V = 4πr³/3 · A = 4πr²" };
  if (object.kind === "cylinder") return { volume: Math.PI * radius ** 2 * height * scale3, area: 2 * Math.PI * radius * (radius + height) * scale2, formula: "V = πr²h · A = 2πr(r+h)" };
  if (object.kind === "cone") return { volume: (Math.PI * radius ** 2 * height * scale3) / 3, area: Math.PI * radius * (radius + Math.hypot(radius, height)) * scale2, formula: "V = πr²h/3 · A = πr(r+g)" };
  const baseArea = (sides * radius ** 2 * Math.sin((2 * Math.PI) / sides)) / 2;
  if (object.kind === "pyramid") return { volume: (baseArea * height * scale3) / 3, area: baseArea * scale2, formula: "V = Ab·h/3" };
  return { volume: baseArea * height * scale3, area: baseArea * scale2, formula: "V = Ab·h" };
}

function distance(a: Vec3, b: Vec3) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function AdminSpatialGestureWorkspace() {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const objectsRef = useRef<SceneObject[]>([]);
  const continuousAnchorRef = useRef<SceneObject[] | null>(null);
  const pointerRef = useRef<{ mode: "object" | "view"; x: number; y: number; id?: string } | null>(null);
  const previousInteractionRef = useRef<SpatialInteractionState>("idle");
  const [objects, setObjects] = useState<SceneObject[]>(initialObjects);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [past, setPast] = useState<SceneObject[][]>([]);
  const [future, setFuture] = useState<SceneObject[][]>([]);
  const [view, setView] = useState<ViewState>({ x: 20, y: -28, zoom: 1 });
  const [panelOpen, setPanelOpen] = useState(true);
  const [panel, setPanel] = useState<Panel>("objects");
  const [showAxes, setShowAxes] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showCenter, setShowCenter] = useState(true);
  const [showFaces, setShowFaces] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [cutMode, setCutMode] = useState<CutMode>("none");
  const [showNet, setShowNet] = useState(false);
  const [measureMode, setMeasureMode] = useState(false);
  const [measurementStartId, setMeasurementStartId] = useState<string | null>(null);
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [notice, setNotice] = useState("Cena pronta. Use mouse, teclado ou ative a câmera.");

  objectsRef.current = objects;
  const selected = objects.find(object => object.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId && objects[0]) setSelectedId(objects[0].id);
    if (selectedId && !objects.some(object => object.id === selectedId)) setSelectedId(objects[0]?.id ?? null);
  }, [objects, selectedId]);

  useEffect(() => {
    if (!autoRotate) return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      if (now - previous > 28) {
        setView(current => ({ ...current, y: current.y + 0.28 }));
        previous = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoRotate]);

  function commitObjects(next: SceneObject[] | ((current: SceneObject[]) => SceneObject[])) {
    setObjects(current => {
      const resolved = typeof next === "function" ? next(current) : next;
      setPast(history => [...history.slice(-39), cloneObjects(current)]);
      setFuture([]);
      return cloneObjects(resolved);
    });
  }

  function updateObject(id: string, updater: (object: SceneObject) => SceneObject, record = false) {
    const operation = (current: SceneObject[]) => current.map(object => object.id === id ? updater(object) : object);
    if (record) commitObjects(operation);
    else setObjects(operation);
  }

  function beginContinuousEdit() {
    if (!continuousAnchorRef.current) continuousAnchorRef.current = cloneObjects(objectsRef.current);
  }

  function endContinuousEdit() {
    const anchor = continuousAnchorRef.current;
    continuousAnchorRef.current = null;
    if (!anchor || JSON.stringify(anchor) === JSON.stringify(objectsRef.current)) return;
    setPast(history => [...history.slice(-39), anchor]);
    setFuture([]);
  }

  function createSolid(kind: SolidKind) {
    const object = createObject(kind, objectsRef.current.length, "independent", {
      x: ((objectsRef.current.length % 4) - 1.5) * 0.8,
      y: 0.25,
      z: 0.7 + (objectsRef.current.length % 3) * 0.35,
    });
    commitObjects(current => [...current, object]);
    setSelectedId(object.id);
    setPanel("properties");
    setNotice(`${object.name} criado como objeto independente.`);
    return object.id;
  }

  function selectObject(id: string) {
    if (measureMode) {
      if (!measurementStartId) {
        setMeasurementStartId(id);
        setNotice("Primeiro centro marcado. Escolha o segundo objeto.");
      } else if (measurementStartId !== id) {
        const from = objectsRef.current.find(object => object.id === measurementStartId);
        const to = objectsRef.current.find(object => object.id === id);
        if (from && to) setMeasurement({ from: from.id, to: to.id, distance: distance(from.position, to.position) });
        setMeasureMode(false);
        setMeasurementStartId(null);
        setPanel("measure");
        setNotice("Distância entre centros calculada.");
      }
    }
    setSelectedId(id);
  }

  function moveObject(id: string, delta: Vec3, record = false) {
    updateObject(id, object => {
      let position = {
        x: object.position.x + delta.x,
        y: object.position.y + delta.y,
        z: object.position.z + delta.z,
      };
      if (snapEnabled) {
        const others = objectsRef.current.filter(item => item.id !== id);
        for (const other of others) {
          if (Math.abs(position.x - other.position.x) < 0.22) position.x = other.position.x;
          if (Math.abs(position.y - other.position.y) < 0.22) position.y = other.position.y;
          if (Math.abs(position.z - other.position.z) < 0.22) position.z = other.position.z;
        }
        for (const axis of ["x", "y", "z"] as const) if (Math.abs(position[axis]) < 0.16) position[axis] = 0;
      }
      return { ...object, position };
    }, record);
  }

  function rotateObject(id: string, delta: Vec3) {
    updateObject(id, object => ({ ...object, rotation: { x: object.rotation.x + delta.x, y: object.rotation.y + delta.y, z: object.rotation.z + delta.z } }));
  }

  function scaleObject(id: string, factor: number) {
    updateObject(id, object => ({ ...object, scale: Math.max(0.28, Math.min(3.2, object.scale * factor)) }));
  }

  function undo() {
    setPast(history => {
      const previous = history.at(-1);
      if (!previous) return history;
      setFuture(next => [cloneObjects(objectsRef.current), ...next.slice(0, 39)]);
      setObjects(cloneObjects(previous));
      setNotice("Última alteração desfeita.");
      return history.slice(0, -1);
    });
  }

  function redo() {
    setFuture(history => {
      const next = history[0];
      if (!next) return history;
      setPast(previous => [...previous.slice(-39), cloneObjects(objectsRef.current)]);
      setObjects(cloneObjects(next));
      setNotice("Alteração refeita.");
      return history.slice(1);
    });
  }

  function duplicateSelected() {
    if (!selected) return null;
    const duplicate: SceneObject = {
      ...selected,
      id: `solid-${Date.now()}-copy`,
      name: `${selected.name} — cópia`,
      role: "independent",
      position: { x: selected.position.x + 0.65, y: selected.position.y + 0.4, z: selected.position.z + 0.4 },
      rotation: { ...selected.rotation },
      dimensions: { ...selected.dimensions },
      color: COLORS[objectsRef.current.length % COLORS.length],
    };
    commitObjects(current => [...current, duplicate]);
    setSelectedId(duplicate.id);
    setNotice(`${duplicate.name} criado.`);
    return duplicate.id;
  }

  function deleteSelected() {
    if (!selected) return false;
    if (!window.confirm(`Excluir “${selected.name}” da cena?`)) return false;
    commitObjects(current => current.filter(object => object.id !== selected.id));
    setSelectedId(null);
    setMeasurement(null);
    setNotice("Objeto excluído.");
    return true;
  }

  function resetScene() {
    if (!window.confirm("Resetar toda a cena e apagar as alterações atuais?")) return;
    const next = initialObjects();
    commitObjects(next);
    setSelectedId(next[0].id);
    setView({ x: 20, y: -28, zoom: 1 });
    setCutMode("none");
    setShowNet(false);
    setMeasurement(null);
    setNotice("Cena restaurada para o estado inicial.");
  }

  function clearScene() {
    if (!objectsRef.current.length || !window.confirm("Limpar todos os objetos da cena?")) return false;
    commitObjects([]);
    setSelectedId(null);
    setMeasurement(null);
    setNotice("Cena limpa.");
    return true;
  }

  function createInscribedScene(outerKind: SolidKind, innerKind: SolidKind) {
    const outer = createObject(outerKind, 0, "outer", { x: 0, y: 0, z: 0 });
    outer.name = `${SOLID_LABELS[outerKind]} externo`;
    outer.scale = 1.25;
    const inner = createObject(innerKind, 1, "inner", { x: 0, y: 0, z: 0 });
    inner.name = `${SOLID_LABELS[innerKind]} interno`;
    inner.scale = 0.62;
    commitObjects([outer, inner]);
    setSelectedId(inner.id);
    setPanel("geometry");
    setNotice("Cena inscrita criada com objetos externo e interno independentes.");
    return inner.id;
  }

  function handleMenuAction(action: GestureMenuAction) {
    const [group, command] = action.split(":") as [string, string];
    if (group === "create") {
      const id = createSolid(command as SolidKind);
      return { selectedObjectId: id, message: `${SOLID_LABELS[command as SolidKind]} criado e selecionado.` };
    }
    if (action === "scene:undo") undo();
    else if (action === "scene:redo") redo();
    else if (action === "scene:duplicate") return { selectedObjectId: duplicateSelected(), message: "Objeto duplicado." };
    else if (action === "scene:delete") deleteSelected();
    else if (action === "scene:clear") clearScene();
    else if (action === "scene:inscribed-cube-sphere") return { selectedObjectId: createInscribedScene("cube", "sphere"), message: "Esfera inscrita no cubo criada." };
    else if (action === "scene:inscribed-cylinder-cone") return { selectedObjectId: createInscribedScene("cylinder", "cone"), message: "Cone inscrito no cilindro criado." };
    else if (action === "toggle:axes") setShowAxes(value => !value);
    else if (action === "toggle:grid") setShowGrid(value => !value);
    else if (action === "toggle:center") setShowCenter(value => !value);
    else if (action === "toggle:faces") setShowFaces(value => !value);
    else if (action === "toggle:snap") setSnapEnabled(value => !value);
    else if (action === "toggle:auto-rotate") setAutoRotate(value => !value);
    else if (action === "toggle:fullscreen") setFullscreen(value => !value);
    else if (action === "toggle:net") setShowNet(value => !value);
    else if (action === "view:iso") setView({ x: 20, y: -28, zoom: 1 });
    else if (action === "view:front") setView({ x: 0, y: 0, zoom: 1 });
    else if (action === "view:top") setView({ x: 90, y: 0, zoom: 1 });
    else if (action === "tool:measure") { setMeasureMode(true); setMeasurementStartId(null); setPanel("measure"); }
    else if (action === "tool:cuts") { setPanel("geometry"); setCutMode(current => current === "none" ? "axial" : current); }
    else if (action === "tool:formulas" || action === "tool:metrics") setPanel("measure");
    else if (action === "tool:properties" || action === "tool:dimensions") setPanel("properties");
    else if (group === "transform") setPanel("properties");
    setNotice("Comando aplicado.");
    return { selectedObjectId: selectedId, message: "Comando aplicado. Solte a pinça para voltar à cena." };
  }

  function handleInteractionChange(state: SpatialInteractionState) {
    const previous = previousInteractionRef.current;
    const transforming = state === "object_dragging" || state === "object_rotating" || state === "object_scaling";
    const wasTransforming = previous === "object_dragging" || previous === "object_rotating" || previous === "object_scaling";
    if (transforming && !wasTransforming) beginContinuousEdit();
    if (!transforming && wasTransforming) endContinuousEdit();
    previousInteractionRef.current = state;
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const target = (event.target as HTMLElement).closest<SVGGElement>("[data-spatial-object-id]");
    if (target) {
      const id = target.dataset.spatialObjectId;
      if (!id) return;
      selectObject(id);
      beginContinuousEdit();
      pointerRef.current = { mode: "object", x: event.clientX, y: event.clientY, id };
    } else {
      pointerRef.current = { mode: "view", x: event.clientX, y: event.clientY };
    }
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const pointer = pointerRef.current;
    if (!pointer) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (pointer.mode === "view") setView(current => ({ ...current, x: current.x + dy * 0.25, y: current.y + dx * 0.25 }));
    else if (pointer.id) moveObject(pointer.id, unprojectScreenDelta(dx, dy, 0, view.x, view.y, 88));
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerRef.current?.mode === "object") endContinuousEdit();
    pointerRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, select, textarea") || target?.isContentEditable) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); return; }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); return; }
      if (event.key === "Delete") { deleteSelected(); return; }
      if (event.key.toLowerCase() === "d" && selectedId) { duplicateSelected(); return; }
      if (event.key.toLowerCase() === "g") setShowGrid(value => !value);
      if (event.key.toLowerCase() === "a") setShowAxes(value => !value);
      if (event.key === "+" && selectedId) updateObject(selectedId, object => ({ ...object, scale: Math.min(3.2, object.scale + 0.1) }), true);
      if (event.key === "-" && selectedId) updateObject(selectedId, object => ({ ...object, scale: Math.max(0.28, object.scale - 0.1) }), true);
      const directions: Record<string, Vec3> = { ArrowLeft: { x: -0.12, y: 0, z: 0 }, ArrowRight: { x: 0.12, y: 0, z: 0 }, ArrowUp: { x: 0, y: 0.12, z: 0 }, ArrowDown: { x: 0, y: -0.12, z: 0 } };
      if (selectedId && directions[event.key]) { event.preventDefault(); moveObject(selectedId, directions[event.key], true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, selected]);

  const renderedObjects = useMemo(() => objects.map(object => {
    const mesh = meshFor(object);
    const world = mesh.vertices.map(vertex => transformPoint(vertex, object));
    const projected = world.map(vertex => project(vertex, view));
    const faces = mesh.faces
      .map((face, faceIndex) => ({ face, faceIndex, depth: face.reduce((sum, index) => sum + projected[index].z, 0) / face.length }))
      .sort((a, b) => a.depth - b.depth);
    return { object, projected, faces, center: project(object.position, view) };
  }), [objects, view]);

  const selectedMetrics = selected ? metricsFor(selected) : null;
  const measuredLine = measurement
    ? (() => {
        const from = objects.find(object => object.id === measurement.from);
        const to = objects.find(object => object.id === measurement.to);
        return from && to ? { from: project(from.position, view), to: project(to.position, view) } : null;
      })()
    : null;

  return (
    <div ref={rootRef} className={`admin-spatial-workspace ${fullscreen ? "admin-spatial-workspace--fullscreen" : ""}`}>
      <SpatialGestureWorkspaceControls
        sceneRef={sceneRef}
        selectedObjectId={selectedId}
        selectedLabel={selected?.name ?? "Nenhum objeto"}
        rotationX={view.x}
        rotationY={view.y}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        snapEnabled={snapEnabled}
        onSelectObject={selectObject}
        onMove={moveObject}
        onRotate={rotateObject}
        onScale={scaleObject}
        onMenuAction={handleMenuAction}
        onResetScene={resetScene}
        onInteractionChange={handleInteractionChange}
      />

      <section className="admin-spatial-stage-shell">
        <div className="admin-spatial-stage-heading">
          <div><small>Geometria Espacial por Gestos</small><h1>Cena tridimensional</h1></div>
          <div className="admin-spatial-stage-actions">
            <button type="button" onClick={undo} disabled={!past.length}><Undo2 /> Desfazer</button>
            <button type="button" onClick={redo} disabled={!future.length}><Redo2 /> Refazer</button>
            <button type="button" onClick={() => createSolid("cube")}><Plus /> Objeto</button>
            <button type="button" onClick={() => setPanelOpen(value => !value)}>{panelOpen ? <ChevronRight /> : <ChevronLeft />} Painel</button>
          </div>
        </div>

        <div className={`admin-spatial-stage-layout ${panelOpen ? "" : "admin-spatial-stage-layout--collapsed"}`}>
          <div
            ref={sceneRef}
            className="admin-spatial-canvas"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            role="application"
            aria-label="Cena de geometria espacial. Arraste um objeto para mover ou arraste o fundo para girar a câmera."
          >
            <div className="admin-spatial-canvas__hint"><MousePointer2 /> Arraste o fundo para orbitar · objeto para mover</div>
            <svg viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="workspaceGlow"><stop offset="0" stopColor="#164e63" stopOpacity=".55" /><stop offset="1" stopColor="#020617" stopOpacity="0" /></radialGradient>
                <pattern id="workspaceGrid" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M 34 0 L 0 0 0 34" fill="none" stroke="#1e3a52" strokeWidth="1" /></pattern>
              </defs>
              <rect width="900" height="620" fill="#040b16" />
              <ellipse cx="450" cy="330" rx="330" ry="230" fill="url(#workspaceGlow)" />
              {showGrid ? <rect x="55" y="55" width="790" height="510" rx="30" fill="url(#workspaceGrid)" opacity=".56" /> : null}
              {showAxes ? <g opacity=".72"><line x1="90" y1="310" x2="810" y2="310" stroke="#fb7185" strokeWidth="1.5" /><line x1="450" y1="65" x2="450" y2="555" stroke="#4ade80" strokeWidth="1.5" /><line x1="180" y1="500" x2="720" y2="120" stroke="#60a5fa" strokeWidth="1.5" /><text x="818" y="306" fill="#fb7185">X</text><text x="456" y="76" fill="#4ade80">Y</text><text x="726" y="118" fill="#60a5fa">Z</text></g> : null}
              {renderedObjects.map(({ object, projected, faces, center }) => (
                <g
                  key={object.id}
                  data-spatial-object-id={object.id}
                  data-selected={object.id === selectedId}
                  className="admin-spatial-object"
                  tabIndex={0}
                  role="button"
                  aria-label={`Selecionar ${object.name}`}
                  onClick={event => { event.stopPropagation(); selectObject(object.id); }}
                  onKeyDown={event => { if (event.key === "Enter" || event.key === " ") selectObject(object.id); }}
                >
                  {faces.map(({ face, faceIndex }) => (
                    <polygon
                      key={faceIndex}
                      points={face.map(index => `${projected[index].x},${projected[index].y}`).join(" ")}
                      fill={showFaces ? object.color : "transparent"}
                      fillOpacity={object.role === "inner" ? 0.26 : 0.14}
                      stroke={object.id === selectedId ? "#f8fafc" : object.color}
                      strokeWidth={object.id === selectedId ? 2.8 : 1.2}
                      strokeLinejoin="round"
                    />
                  ))}
                  {showCenter ? <g><circle cx={center.x} cy={center.y} r={object.id === selectedId ? 6 : 3} fill={object.id === selectedId ? "#f8fafc" : object.color} /><text x={center.x + 9} y={center.y - 8} fill="#cbd5e1" fontSize="11">{object.name}</text></g> : null}
                </g>
              ))}
              {measuredLine ? <g><line x1={measuredLine.from.x} y1={measuredLine.from.y} x2={measuredLine.to.x} y2={measuredLine.to.y} stroke="#facc15" strokeWidth="3" strokeDasharray="8 6" /><text x={(measuredLine.from.x + measuredLine.to.x) / 2} y={(measuredLine.from.y + measuredLine.to.y) / 2 - 10} fill="#fde047" textAnchor="middle" fontSize="13">{measurement?.distance.toFixed(2)} u</text></g> : null}
              {cutMode !== "none" && selected ? <g className="admin-spatial-cut"><ellipse cx={project(selected.position, view).x} cy={project(selected.position, view).y} rx="105" ry={cutMode === "base" ? 28 : 82} transform={cutMode === "diagonal" ? `rotate(-32 ${project(selected.position, view).x} ${project(selected.position, view).y})` : undefined} /><text x={project(selected.position, view).x} y={project(selected.position, view).y - 96} textAnchor="middle">Corte {cutMode}</text></g> : null}
            </svg>
            {!objects.length ? <div className="admin-spatial-empty"><Shapes /><h2>Cena vazia</h2><p>Adicione um sólido pela barra, pelo painel ou abrindo a palma.</p><button type="button" onClick={() => createSolid("cube")}>Criar cubo</button></div> : null}
            <div className="admin-spatial-canvas__status" aria-live="polite"><span>{objects.length} objeto{objects.length === 1 ? "" : "s"}</span><span>{selected?.name ?? "Nenhum selecionado"}</span><strong>{notice}</strong></div>
          </div>

          {panelOpen ? (
            <aside className="admin-spatial-inspector">
              <nav aria-label="Painéis da cena">
                {(["objects", "properties", "geometry", "measure"] as Panel[]).map(item => <button key={item} type="button" aria-pressed={panel === item} onClick={() => setPanel(item)}>{item === "objects" ? "Objetos" : item === "properties" ? "Propriedades" : item === "geometry" ? "Geometria" : "Análise"}</button>)}
              </nav>
              {panel === "objects" ? (
                <div className="admin-spatial-panel-content">
                  <div className="admin-spatial-panel-title"><div><small>Cena</small><h2>Objetos</h2></div><button type="button" onClick={() => createSolid("cube")} aria-label="Adicionar cubo"><Plus /></button></div>
                  <div className="admin-spatial-object-list">
                    {objects.map(object => <button key={object.id} type="button" data-selected={object.id === selectedId} onClick={() => selectObject(object.id)}><i style={{ background: object.color }} /><span><b>{object.name}</b><small>{SOLID_LABELS[object.kind]} · {object.role === "independent" ? "livre" : object.role}</small></span></button>)}
                  </div>
                  <div className="admin-spatial-quick-create">
                    {(Object.keys(SOLID_LABELS) as SolidKind[]).map(kind => <button key={kind} type="button" onClick={() => createSolid(kind)}>{SOLID_LABELS[kind]}</button>)}
                  </div>
                  <div className="admin-spatial-row"><button type="button" onClick={duplicateSelected} disabled={!selected}><Copy /> Duplicar</button><button type="button" className="danger" onClick={deleteSelected} disabled={!selected}><Trash2 /> Excluir</button></div>
                </div>
              ) : null}
              {panel === "properties" ? (
                <div className="admin-spatial-panel-content">
                  <div className="admin-spatial-panel-title"><div><small>Selecionado</small><h2>{selected?.name ?? "Nenhum objeto"}</h2></div><Box /></div>
                  {selected ? <>
                    <label>Nome<input value={selected.name} onChange={event => updateObject(selected.id, object => ({ ...object, name: event.target.value }), false)} onBlur={endContinuousEdit} onFocus={beginContinuousEdit} /></label>
                    <h3>Posição</h3><div className="admin-spatial-vector-grid">{(["x", "y", "z"] as const).map(axis => <label key={axis}>{axis.toUpperCase()}<input type="number" step="0.1" value={selected.position[axis].toFixed(2)} onChange={event => updateObject(selected.id, object => ({ ...object, position: { ...object.position, [axis]: Number(event.target.value) } }), true)} /></label>)}</div>
                    <h3>Rotação</h3><div className="admin-spatial-vector-grid">{(["x", "y", "z"] as const).map(axis => <label key={axis}>{axis.toUpperCase()}<input type="number" step="5" value={selected.rotation[axis].toFixed(0)} onChange={event => updateObject(selected.id, object => ({ ...object, rotation: { ...object.rotation, [axis]: Number(event.target.value) } }), true)} /></label>)}</div>
                    <label>Escala uniforme <output>{selected.scale.toFixed(2)}×</output><input type="range" min="0.28" max="3.2" step="0.02" value={selected.scale} onPointerDown={beginContinuousEdit} onPointerUp={endContinuousEdit} onChange={event => updateObject(selected.id, object => ({ ...object, scale: Number(event.target.value) }))} /></label>
                    <h3>Dimensões</h3><div className="admin-spatial-vector-grid">{(selected.kind === "sphere" ? ["radius"] : selected.kind === "cylinder" || selected.kind === "cone" ? ["radius", "height"] : selected.kind === "regularPrism" || selected.kind === "pyramid" ? ["radius", "height", "sides"] : ["width", "height", "depth"]).map(key => <label key={key}>{key}<input type="number" min="0.2" step={key === "sides" ? 1 : 0.1} value={selected.dimensions[key as keyof Dimensions]} onChange={event => updateObject(selected.id, object => ({ ...object, dimensions: { ...object.dimensions, [key]: Math.max(key === "sides" ? 3 : 0.2, Number(event.target.value)) } }), true)} /></label>)}</div>
                  </> : <p className="admin-spatial-muted">Selecione um objeto na cena ou na lista.</p>}
                </div>
              ) : null}
              {panel === "geometry" ? (
                <div className="admin-spatial-panel-content">
                  <div className="admin-spatial-panel-title"><div><small>Construção</small><h2>Geometria</h2></div><Shapes /></div>
                  <h3>Cenas inscritas</h3><button className="wide" type="button" onClick={() => createInscribedScene("cube", "sphere")}>Esfera inscrita no cubo</button><button className="wide" type="button" onClick={() => createInscribedScene("cylinder", "cone")}>Cone inscrito no cilindro</button>
                  <h3>Cortes</h3><div className="admin-spatial-chip-grid">{(["none", "axial", "base", "central", "diagonal"] as CutMode[]).map(mode => <button key={mode} type="button" aria-pressed={cutMode === mode} onClick={() => setCutMode(mode)}>{mode}</button>)}</div>
                  <button className="wide" type="button" aria-pressed={showNet} onClick={() => setShowNet(value => !value)}>Planificação {showNet ? "visível" : "oculta"}</button>
                  <h3>Visualização</h3><div className="admin-spatial-chip-grid"><button type="button" aria-pressed={showAxes} onClick={() => setShowAxes(value => !value)}><Focus /> Eixos</button><button type="button" aria-pressed={showGrid} onClick={() => setShowGrid(value => !value)}><Grid3X3 /> Grade</button><button type="button" aria-pressed={showFaces} onClick={() => setShowFaces(value => !value)}><Eye /> Faces</button><button type="button" aria-pressed={autoRotate} onClick={() => setAutoRotate(value => !value)}><Rotate3D /> Auto</button><button type="button" onClick={() => setFullscreen(value => !value)}><Maximize2 /> Tela cheia</button></div>
                  <h3>Vistas</h3><div className="admin-spatial-chip-grid"><button type="button" onClick={() => setView({ x: 20, y: -28, zoom: 1 })}>Isométrica</button><button type="button" onClick={() => setView({ x: 0, y: 0, zoom: 1 })}>Frontal</button><button type="button" onClick={() => setView({ x: 90, y: 0, zoom: 1 })}>Superior</button></div>
                </div>
              ) : null}
              {panel === "measure" ? (
                <div className="admin-spatial-panel-content">
                  <div className="admin-spatial-panel-title"><div><small>Cálculo e medição</small><h2>Análise</h2></div><Ruler /></div>
                  {selected && selectedMetrics ? <div className="admin-spatial-metrics"><p>{selectedMetrics.formula}</p><div><span>Volume<b>{selectedMetrics.volume.toFixed(2)} u³</b></span><span>Área<b>{selectedMetrics.area.toFixed(2)} u²</b></span></div></div> : <p className="admin-spatial-muted">Selecione um sólido para ver fórmulas, área e volume.</p>}
                  <button className="wide" type="button" aria-pressed={measureMode} onClick={() => { setMeasureMode(value => !value); setMeasurementStartId(null); }}>{measureMode ? "Cancelar medição" : "Medir entre centros"}</button>
                  {measureMode ? <p className="admin-spatial-callout">{measurementStartId ? "Escolha o segundo objeto." : "Escolha o primeiro objeto na cena ou lista."}</p> : null}
                  {measurement ? <div className="admin-spatial-measurement"><span>Distância atual</span><b>{measurement.distance.toFixed(3)} unidades</b><button type="button" onClick={() => setMeasurement(null)}>Limpar medida</button></div> : null}
                </div>
              ) : null}
            </aside>
          ) : null}
        </div>
      </section>

      {showNet && selected ? <aside className="admin-spatial-net"><button type="button" onClick={() => setShowNet(false)} aria-label="Fechar planificação"><X /></button><small>Planificação</small><h2>{selected.name}</h2><div className={`net-shape net-shape--${selected.kind}`}><i /><i /><i /><i /><i /><i /></div><p>Representação vetorial esquemática da superfície do sólido selecionado.</p></aside> : null}
    </div>
  );
}

export default function AdminSpatialGestureWorkspacePage() {
  return (
    <AdminGuard allowedRoles={["admin"]}>
      <AdminLayout title="Geometria Espacial por Gestos" subtitle="Ambiente administrativo experimental com interação local pela câmera.">
        <AdminSpatialGestureWorkspace />
      </AdminLayout>
    </AdminGuard>
  );
}
