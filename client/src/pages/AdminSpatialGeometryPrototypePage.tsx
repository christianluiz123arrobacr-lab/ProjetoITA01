import { useEffect, useMemo, useRef, useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MathFormula } from "@/components/MathFormula";
import {
  BadgeInfo,
  Box,
  Calculator,
  Eye,
  EyeOff,
  Layers,
  ListTree,
  Maximize2,
  Minimize2,
  MousePointerClick,
  PauseCircle,
  PlayCircle,
  Plus,
  Rotate3D,
  RotateCcw,
  Ruler,
  Sparkles,
} from "lucide-react";

type Vec3 = {
  x: number;
  y: number;
  z: number;
};

type ScaleInput = number | Vec3;

type ProjectedPoint = {
  x: number;
  y: number;
  z: number;
  perspective: number;
};

type SolidType =
  | "cube"
  | "box"
  | "regularPrism"
  | "pyramid"
  | "cylinder"
  | "cone"
  | "sphere";

type SceneMode = "simple" | "inscribed";
type InteractionMode = "rotate" | "moveInner" | "rotateInner";
type SelectedTarget = "outer" | "inner";

type GeometryActionId =
  | "edge"
  | "height"
  | "radius"
  | "diameter"
  | "faceDiagonal"
  | "spaceDiagonal"
  | "baseDiagonal"
  | "apothem"
  | "circumradius"
  | "slant"
  | "baseArea"
  | "lateralArea"
  | "faceArea"
  | "totalArea"
  | "volume"
  | "axialSection"
  | "centralSection"
  | "greatCircle";

type SolidDefinition = {
  type: SolidType;
  label: string;
  shortLabel: string;
  description: string;
};

type PolyFace = {
  points: Vec3[];
  opacity?: number;
};

type SolidMesh = {
  faces: PolyFace[];
  edges: Vec3[][];
};

type SolidMetrics = {
  volume: number;
  baseArea?: number;
  lateralArea?: number;
  totalArea: number;
  formulas: {
    volume: string;
    area: string;
  };
  substitution: {
    volume: string;
    area: string;
  };
  explanation: string;
};

type RenderTheme = {
  face: string;
  edge: string;
  dashed?: boolean;
  opacity: number;
  label: string;
};

type GeometryAction = {
  id: GeometryActionId;
  label: string;
  description: string;
};

type InspectorFormula = {
  label: string;
  formula: string;
  substitution: string;
};

type InspectorData = {
  title: string;
  description: string;
  formulas: InspectorFormula[];
  actionId?: GeometryActionId;
};

type DragState = {
  startX: number;
  startY: number;
  startRotationX: number;
  startRotationY: number;
  startInnerRotationX: number;
  startInnerRotationY: number;
  startInnerOffsetX: number;
  startInnerOffsetY: number;
  moved: boolean;
};

type MenuDragState = {
  startX: number;
  startY: number;
  startMenuX: number;
  startMenuY: number;
};

type GeometryElementKind = "face" | "edge" | "vertex";

type GeometryElement = {
  kind: GeometryElementKind;
  target: SelectedTarget;
  index: number;
  worldPoint: Vec3;
  label: string;
};

type GeometryMeasurement = {
  id: string;
  from: GeometryElement;
  to: GeometryElement;
  distance: number;
};

type FloatingMenu =
  | {
      kind: "solid";
      x: number;
      y: number;
      target: SelectedTarget;
    }
  | {
      kind: "background";
      x: number;
      y: number;
    }
  | {
      kind: "element";
      x: number;
      y: number;
      element: GeometryElement;
    };

type AdjustmentTarget = "base" | "height" | "radius";
type OverlapQuality = "fast" | "precise";
type FullscreenMenuSection =
  | null
  | "add"
  | "scenes"
  | "teach"
  | "measure"
  | "edit"
  | "transform"
  | "formula"
  | "display";

type SmartCutId = "axial" | "base" | "central" | "diagonal";

type ClassicFitPreset = {
  id: string;
  label: string;
  outer: SolidType;
  inner: SolidType;
  sides: number;
  description: string;
};

type OverlapEstimate = {
  intersectionVolume: number;
  unionVolume: number;
  outerOnlyVolume: number;
  innerOnlyVolume: number;
  occupiedPercent: number;
  sampleResolution: number;
  estimatedErrorPercent: number;
  state: "separado" | "tocando" | "interseção" | "contido";
};

const VIEWBOX_WIDTH = 980;
const VIEWBOX_HEIGHT = 720;
const CENTER_X = VIEWBOX_WIDTH / 2;
const CENTER_Y = VIEWBOX_HEIGHT / 2;
const PROJECT_SCALE = 138;

const SOLIDS: SolidDefinition[] = [
  {
    type: "cube",
    label: "Cubo",
    shortLabel: "Cubo",
    description: "Todas as arestas possuem a mesma medida.",
  },
  {
    type: "box",
    label: "Paralelepípedo",
    shortLabel: "Paral.",
    description: "Possui comprimento, largura e altura independentes.",
  },
  {
    type: "regularPrism",
    label: "Prisma regular",
    shortLabel: "Prisma",
    description: "Prisma com base poligonal regular de n lados.",
  },
  {
    type: "pyramid",
    label: "Pirâmide regular",
    shortLabel: "Pirâmide",
    description: "Pirâmide com base regular e vértice alinhado ao centro.",
  },
  {
    type: "cylinder",
    label: "Cilindro",
    shortLabel: "Cilindro",
    description: "Sólido com duas bases circulares paralelas.",
  },
  {
    type: "cone",
    label: "Cone",
    shortLabel: "Cone",
    description: "Sólido com base circular e um vértice.",
  },
  {
    type: "sphere",
    label: "Esfera",
    shortLabel: "Esfera",
    description: "Conjunto de pontos a uma mesma distância do centro.",
  },
];

const INSCRIBED_PRESETS = [
  {
    label: "Prisma regular inscrito em cilindro",
    outer: "cylinder" as SolidType,
    inner: "regularPrism" as SolidType,
    sides: 6,
  },
  {
    label: "Esfera inscrita em cubo",
    outer: "cube" as SolidType,
    inner: "sphere" as SolidType,
    sides: 6,
  },
  {
    label: "Cubo inscrito em esfera",
    outer: "sphere" as SolidType,
    inner: "cube" as SolidType,
    sides: 4,
  },
  {
    label: "Cone inscrito em cilindro",
    outer: "cylinder" as SolidType,
    inner: "cone" as SolidType,
    sides: 32,
  },
];

const CLASSIC_FIT_PRESETS: ClassicFitPreset[] = [
  {
    id: "sphere-in-cube",
    label: "Esfera no cubo",
    outer: "cube",
    inner: "sphere",
    sides: 6,
    description: "A esfera toca as seis faces: d = a.",
  },
  {
    id: "cube-in-sphere",
    label: "Cubo na esfera",
    outer: "sphere",
    inner: "cube",
    sides: 4,
    description: "A diagonal espacial do cubo é o diâmetro da esfera.",
  },
  {
    id: "cone-in-cylinder",
    label: "Cone no cilindro",
    outer: "cylinder",
    inner: "cone",
    sides: 32,
    description: "Cone e cilindro compartilham raio da base e altura.",
  },
  {
    id: "prism-in-cylinder",
    label: "Prisma no cilindro",
    outer: "cylinder",
    inner: "regularPrism",
    sides: 6,
    description: "A base do prisma fica inscrita na base circular.",
  },
];

const QUICK_ADD_SOLIDS: SolidType[] = [
  "cube",
  "box",
  "regularPrism",
  "pyramid",
  "cylinder",
  "cone",
  "sphere",
];

const VIEW_PRESETS = [
  { label: "Isométrica", rotationX: 18, rotationY: -28 },
  { label: "Frente", rotationX: 0, rotationY: 0 },
  { label: "Topo", rotationX: 72, rotationY: 0 },
  { label: "Lateral", rotationX: 0, rotationY: 90 },
];

const SMART_CUTS: Array<{
  id: SmartCutId;
  label: string;
  description: string;
}> = [
  {
    id: "axial",
    label: "Corte axial",
    description: "Passa pelo eixo principal e mostra a seção mais usada em cone/cilindro.",
  },
  {
    id: "base",
    label: "Corte da base",
    description: "Destaca a região da base para montar área da base e volume.",
  },
  {
    id: "central",
    label: "Corte central",
    description: "Passa pelo centro; na esfera, mostra o círculo máximo.",
  },
  {
    id: "diagonal",
    label: "Corte diagonal",
    description: "Mostra o triângulo ou retângulo escondido em diagonais.",
  },
];

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "0";

  return value.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function degToRad(value: number) {
  return (value * Math.PI) / 180;
}

function rotatePoint(point: Vec3, angleX: number, angleY: number): Vec3 {
  const xRad = degToRad(angleX);
  const yRad = degToRad(angleY);

  const cosX = Math.cos(xRad);
  const sinX = Math.sin(xRad);
  const cosY = Math.cos(yRad);
  const sinY = Math.sin(yRad);

  const yAfterX = point.y * cosX - point.z * sinX;
  const zAfterX = point.y * sinX + point.z * cosX;

  const xAfterY = point.x * cosY + zAfterX * sinY;
  const zAfterY = -point.x * sinY + zAfterX * cosY;

  return {
    x: xAfterY,
    y: yAfterX,
    z: zAfterY,
  };
}

function rotateAroundX(point: Vec3, angle: number): Vec3 {
  const rad = degToRad(angle);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos,
  };
}

function rotateAroundY(point: Vec3, angle: number): Vec3 {
  const rad = degToRad(angle);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: -point.x * sin + point.z * cos,
  };
}

function rotateAroundZ(point: Vec3, angle: number): Vec3 {
  const rad = degToRad(angle);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
    z: point.z,
  };
}

function rotatePoint3D(point: Vec3, rotation: Vec3): Vec3 {
  return rotateAroundZ(
    rotateAroundY(rotateAroundX(point, rotation.x), rotation.y),
    rotation.z
  );
}

function inverseRotatePoint3D(point: Vec3, rotation: Vec3): Vec3 {
  return rotateAroundX(
    rotateAroundY(rotateAroundZ(point, -rotation.z), -rotation.y),
    -rotation.x
  );
}

function projectPoint(
  point: Vec3,
  angleX: number,
  angleY: number
): ProjectedPoint {
  const rotated = rotatePoint(point, angleX, angleY);
  const distance = 7;
  const perspective = distance / (distance - rotated.z);

  return {
    x: CENTER_X + rotated.x * PROJECT_SCALE * perspective,
    y: CENTER_Y - rotated.y * PROJECT_SCALE * perspective,
    z: rotated.z,
    perspective,
  };
}

function normalizeScale(scale: ScaleInput): Vec3 {
  return typeof scale === "number" ? { x: scale, y: scale, z: scale } : scale;
}

function transformPoint(point: Vec3, scale: ScaleInput, offset: Vec3): Vec3 {
  const normalizedScale = normalizeScale(scale);

  return {
    x: point.x * normalizedScale.x + offset.x,
    y: point.y * normalizedScale.y + offset.y,
    z: point.z * normalizedScale.z + offset.z,
  };
}

function transformPointWithRotation(
  point: Vec3,
  scale: ScaleInput,
  offset: Vec3,
  objectRotation: Vec3 = { x: 0, y: 0, z: 0 }
): Vec3 {
  const normalizedScale = normalizeScale(scale);
  const scaled = {
    x: point.x * normalizedScale.x,
    y: point.y * normalizedScale.y,
    z: point.z * normalizedScale.z,
  };
  const rotated = rotatePoint3D(scaled, objectRotation);

  return {
    x: rotated.x + offset.x,
    y: rotated.y + offset.y,
    z: rotated.z + offset.z,
  };
}

function createRegularPolygon(sides: number, radius: number, y: number) {
  return Array.from({ length: sides }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / sides;

    return {
      x: Math.cos(angle) * radius,
      y,
      z: Math.sin(angle) * radius,
    };
  });
}

function createBoxMesh(width: number, height: number, depth: number): SolidMesh {
  const x = width / 2;
  const y = height / 2;
  const z = depth / 2;

  const p = {
    a: { x: -x, y: -y, z: -z },
    b: { x, y: -y, z: -z },
    c: { x, y, z: -z },
    d: { x: -x, y, z: -z },
    e: { x: -x, y: -y, z },
    f: { x, y: -y, z },
    g: { x, y, z },
    h: { x: -x, y, z },
  };

  return {
    faces: [
      { points: [p.a, p.b, p.c, p.d], opacity: 0.14 },
      { points: [p.e, p.f, p.g, p.h], opacity: 0.2 },
      { points: [p.a, p.e, p.h, p.d], opacity: 0.16 },
      { points: [p.b, p.f, p.g, p.c], opacity: 0.18 },
      { points: [p.d, p.c, p.g, p.h], opacity: 0.22 },
      { points: [p.a, p.b, p.f, p.e], opacity: 0.12 },
    ],
    edges: [
      [p.a, p.b],
      [p.b, p.c],
      [p.c, p.d],
      [p.d, p.a],
      [p.e, p.f],
      [p.f, p.g],
      [p.g, p.h],
      [p.h, p.e],
      [p.a, p.e],
      [p.b, p.f],
      [p.c, p.g],
      [p.d, p.h],
    ],
  };
}

function createPrismMesh(
  sides: number,
  radius: number,
  height: number
): SolidMesh {
  const bottom = createRegularPolygon(sides, radius, -height / 2);
  const top = createRegularPolygon(sides, radius, height / 2);

  const faces: PolyFace[] = [
    { points: top, opacity: 0.22 },
    { points: [...bottom].reverse(), opacity: 0.12 },
  ];

  const edges: Vec3[][] = [];

  for (let index = 0; index < sides; index += 1) {
    const next = (index + 1) % sides;

    faces.push({
      points: [bottom[index], bottom[next], top[next], top[index]],
      opacity: 0.16,
    });

    edges.push(
      [bottom[index], bottom[next]],
      [top[index], top[next]],
      [bottom[index], top[index]]
    );
  }

  return { faces, edges };
}

function createPyramidMesh(
  sides: number,
  radius: number,
  height: number
): SolidMesh {
  const base = createRegularPolygon(sides, radius, -height / 2);
  const apex = { x: 0, y: height / 2, z: 0 };

  const faces: PolyFace[] = [{ points: [...base].reverse(), opacity: 0.16 }];
  const edges: Vec3[][] = [];

  for (let index = 0; index < sides; index += 1) {
    const next = (index + 1) % sides;

    faces.push({
      points: [base[index], base[next], apex],
      opacity: 0.18,
    });

    edges.push([base[index], base[next]], [base[index], apex]);
  }

  return { faces, edges };
}

function createCylinderMesh(
  radius: number,
  height: number,
  segments = 64
): SolidMesh {
  const bottom = createRegularPolygon(segments, radius, -height / 2);
  const top = createRegularPolygon(segments, radius, height / 2);

  const faces: PolyFace[] = [
    { points: top, opacity: 0.18 },
    { points: [...bottom].reverse(), opacity: 0.1 },
  ];

  const edges: Vec3[][] = [];

  for (let index = 0; index < segments; index += 1) {
    const next = (index + 1) % segments;

    if (index % 4 === 0) {
      edges.push([bottom[index], top[index]]);
    }

    edges.push([bottom[index], bottom[next]], [top[index], top[next]]);
  }

  return { faces, edges };
}

function createConeMesh(
  radius: number,
  height: number,
  segments = 64
): SolidMesh {
  const base = createRegularPolygon(segments, radius, -height / 2);
  const apex = { x: 0, y: height / 2, z: 0 };

  const faces: PolyFace[] = [{ points: [...base].reverse(), opacity: 0.12 }];
  const edges: Vec3[][] = [];

  for (let index = 0; index < segments; index += 1) {
    const next = (index + 1) % segments;

    if (index % 4 === 0) {
      edges.push([base[index], apex]);
    }

    edges.push([base[index], base[next]]);
  }

  return { faces, edges };
}

function getMeshForSolid(type: SolidType, sides: number): SolidMesh {
  switch (type) {
    case "cube":
      return createBoxMesh(2.35, 2.35, 2.35);
    case "box":
      return createBoxMesh(3.05, 2.15, 1.85);
    case "regularPrism":
      return createPrismMesh(sides, 1.35, 2.4);
    case "pyramid":
      return createPyramidMesh(sides, 1.45, 2.65);
    case "cylinder":
      return createCylinderMesh(1.35, 2.45);
    case "cone":
      return createConeMesh(1.35, 2.55);
    default:
      return { faces: [], edges: [] };
  }
}

function pointInsideRegularPolygon(
  x: number,
  z: number,
  sides: number,
  radius: number
) {
  const vertices = createRegularPolygon(sides, radius, 0).map((point) => ({
    x: point.x,
    z: point.z,
  }));

  let inside = false;

  for (let current = 0, previous = vertices.length - 1; current < vertices.length; previous = current, current += 1) {
    const a = vertices[current];
    const b = vertices[previous];
    const intersects =
      a.z > z !== b.z > z &&
      x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z + Number.EPSILON) + a.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function pointInsideSolid(type: SolidType, point: Vec3, sides: number) {
  if (type === "cube") {
    return (
      Math.abs(point.x) <= 1.175 &&
      Math.abs(point.y) <= 1.175 &&
      Math.abs(point.z) <= 1.175
    );
  }

  if (type === "box") {
    return (
      Math.abs(point.x) <= 1.525 &&
      Math.abs(point.y) <= 1.075 &&
      Math.abs(point.z) <= 0.925
    );
  }

  if (type === "regularPrism") {
    return (
      Math.abs(point.y) <= 1.2 &&
      pointInsideRegularPolygon(point.x, point.z, sides, 1.35)
    );
  }

  if (type === "pyramid") {
    const halfHeight = 1.325;

    if (point.y < -halfHeight || point.y > halfHeight) {
      return false;
    }

    const fraction = (halfHeight - point.y) / (2 * halfHeight);
    return pointInsideRegularPolygon(point.x, point.z, sides, 1.45 * fraction);
  }

  if (type === "cylinder") {
    return Math.abs(point.y) <= 1.225 && point.x ** 2 + point.z ** 2 <= 1.35 ** 2;
  }

  if (type === "cone") {
    const halfHeight = 1.275;

    if (point.y < -halfHeight || point.y > halfHeight) {
      return false;
    }

    const fraction = (halfHeight - point.y) / (2 * halfHeight);
    return point.x ** 2 + point.z ** 2 <= (1.35 * fraction) ** 2;
  }

  return point.x ** 2 + point.y ** 2 + point.z ** 2 <= 1.35 ** 2;
}

function getSolidBounds(
  type: SolidType,
  sides: number,
  scale: ScaleInput,
  offset: Vec3,
  objectRotation: Vec3 = { x: 0, y: 0, z: 0 }
) {
  const points =
    type === "sphere"
      ? [
          { x: -1.35, y: -1.35, z: -1.35 },
          { x: 1.35, y: 1.35, z: 1.35 },
        ]
      : (() => {
          const mesh = getMeshForSolid(type, sides);
          return mesh.faces
            .flatMap((face) => face.points)
            .concat(mesh.edges.flat());
        })();

  const transformed = points.map((point) =>
    transformPointWithRotation(point, scale, offset, objectRotation)
  );

  return transformed.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      maxX: Math.max(bounds.maxX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxY: Math.max(bounds.maxY, point.y),
      minZ: Math.min(bounds.minZ, point.z),
      maxZ: Math.max(bounds.maxZ, point.z),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
      minZ: Number.POSITIVE_INFINITY,
      maxZ: Number.NEGATIVE_INFINITY,
    }
  );
}

function estimateSolidOverlap({
  outerSolid,
  innerSolid,
  sides,
  outerScale,
  innerScale,
  innerOffset,
  innerRotation,
  sampleResolution,
  outerVolume,
  innerVolume,
}: {
  outerSolid: SolidType;
  innerSolid: SolidType;
  sides: number;
  outerScale: ScaleInput;
  innerScale: ScaleInput;
  innerOffset: Vec3;
  innerRotation: Vec3;
  sampleResolution: number;
  outerVolume: number;
  innerVolume: number;
}): OverlapEstimate {
  const normalizedOuterScale = normalizeScale(outerScale);
  const normalizedInnerScale = normalizeScale(innerScale);
  const outerBounds = getSolidBounds(outerSolid, sides, normalizedOuterScale, { x: 0, y: 0, z: 0 });
  const innerBounds = getSolidBounds(innerSolid, sides, innerScale, innerOffset, innerRotation);

  const bounds = {
    minX: Math.min(outerBounds.minX, innerBounds.minX),
    maxX: Math.max(outerBounds.maxX, innerBounds.maxX),
    minY: Math.min(outerBounds.minY, innerBounds.minY),
    maxY: Math.max(outerBounds.maxY, innerBounds.maxY),
    minZ: Math.min(outerBounds.minZ, innerBounds.minZ),
    maxZ: Math.max(outerBounds.maxZ, innerBounds.maxZ),
  };

  let outerCount = 0;
  let innerCount = 0;
  let intersectionCount = 0;
  const boundsVolume =
    Math.max(bounds.maxX - bounds.minX, 0) *
    Math.max(bounds.maxY - bounds.minY, 0) *
    Math.max(bounds.maxZ - bounds.minZ, 0);

  for (let xIndex = 0; xIndex < sampleResolution; xIndex += 1) {
    const x =
      bounds.minX +
      ((xIndex + 0.5) / sampleResolution) * (bounds.maxX - bounds.minX);

    for (let yIndex = 0; yIndex < sampleResolution; yIndex += 1) {
      const y =
        bounds.minY +
        ((yIndex + 0.5) / sampleResolution) * (bounds.maxY - bounds.minY);

      for (let zIndex = 0; zIndex < sampleResolution; zIndex += 1) {
        const z =
          bounds.minZ +
          ((zIndex + 0.5) / sampleResolution) * (bounds.maxZ - bounds.minZ);

        const point = { x, y, z };
        const outerLocal = {
          x: point.x / normalizedOuterScale.x,
          y: point.y / normalizedOuterScale.y,
          z: point.z / normalizedOuterScale.z,
        };
        const inOuter = pointInsideSolid(outerSolid, outerLocal, sides);
        const innerTranslated = inverseRotatePoint3D(
          {
            x: point.x - innerOffset.x,
            y: point.y - innerOffset.y,
            z: point.z - innerOffset.z,
          },
          innerRotation
        );
        const innerLocal = {
          x: innerTranslated.x / normalizedInnerScale.x,
          y: innerTranslated.y / normalizedInnerScale.y,
          z: innerTranslated.z / normalizedInnerScale.z,
        };
        const inInner = pointInsideSolid(innerSolid, innerLocal, sides);

        if (inOuter) {
          outerCount += 1;
        }

        if (inInner) {
          innerCount += 1;
        }

        if (inOuter && inInner) {
          intersectionCount += 1;
        }
      }
    }
  }

  const cellVolume = boundsVolume / sampleResolution ** 3;
  const sampledOuterVolume = outerCount * cellVolume;
  const sampledInnerVolume = innerCount * cellVolume;
  const sampledIntersection = intersectionCount * cellVolume;
  const outerCorrection =
    sampledOuterVolume > 0 ? outerVolume / sampledOuterVolume : 1;
  const innerCorrection =
    sampledInnerVolume > 0 ? innerVolume / sampledInnerVolume : 1;
  const correction = Math.min(outerCorrection, innerCorrection);
  const rawIntersection = sampledIntersection * correction;
  const intersectionVolume = clamp(
    rawIntersection,
    0,
    Math.min(outerVolume, innerVolume)
  );
  const unionVolume = outerVolume + innerVolume - intersectionVolume;
  const occupiedPercent =
    outerVolume > 0 ? (intersectionVolume / outerVolume) * 100 : 0;
  const estimatedErrorPercent = clamp((1 / sampleResolution) * 180, 1.6, 10);
  const state =
    intersectionVolume <= Math.max(outerVolume, innerVolume) * 0.002
      ? "separado"
      : innerVolume > 0 && intersectionVolume / innerVolume > 0.985
        ? "contido"
        : intersectionVolume <= Math.max(outerVolume, innerVolume) * 0.018
          ? "tocando"
          : "interseção";

  return {
    intersectionVolume,
    unionVolume,
    outerOnlyVolume: Math.max(outerVolume - intersectionVolume, 0),
    innerOnlyVolume: Math.max(innerVolume - intersectionVolume, 0),
    occupiedPercent,
    sampleResolution,
    estimatedErrorPercent,
    state,
  };
}

function renderIntersectionCloud({
  outerSolid,
  innerSolid,
  sides,
  outerScale,
  innerScale,
  innerOffset,
  innerRotation,
  angleX,
  angleY,
}: {
  outerSolid: SolidType;
  innerSolid: SolidType;
  sides: number;
  outerScale: ScaleInput;
  innerScale: ScaleInput;
  innerOffset: Vec3;
  innerRotation: Vec3;
  angleX: number;
  angleY: number;
}) {
  const sampleResolution = 14;
  const normalizedOuterScale = normalizeScale(outerScale);
  const normalizedInnerScale = normalizeScale(innerScale);
  const outerBounds = getSolidBounds(
    outerSolid,
    sides,
    normalizedOuterScale,
    { x: 0, y: 0, z: 0 }
  );
  const innerBounds = getSolidBounds(
    innerSolid,
    sides,
    normalizedInnerScale,
    innerOffset,
    innerRotation
  );
  const bounds = {
    minX: Math.max(outerBounds.minX, innerBounds.minX),
    maxX: Math.min(outerBounds.maxX, innerBounds.maxX),
    minY: Math.max(outerBounds.minY, innerBounds.minY),
    maxY: Math.min(outerBounds.maxY, innerBounds.maxY),
    minZ: Math.max(outerBounds.minZ, innerBounds.minZ),
    maxZ: Math.min(outerBounds.maxZ, innerBounds.maxZ),
  };

  if (
    bounds.minX >= bounds.maxX ||
    bounds.minY >= bounds.maxY ||
    bounds.minZ >= bounds.maxZ
  ) {
    return null;
  }

  const points: ProjectedPoint[] = [];

  for (let xIndex = 0; xIndex < sampleResolution; xIndex += 1) {
    const x =
      bounds.minX +
      ((xIndex + 0.5) / sampleResolution) * (bounds.maxX - bounds.minX);

    for (let yIndex = 0; yIndex < sampleResolution; yIndex += 1) {
      const y =
        bounds.minY +
        ((yIndex + 0.5) / sampleResolution) * (bounds.maxY - bounds.minY);

      for (let zIndex = 0; zIndex < sampleResolution; zIndex += 1) {
        const z =
          bounds.minZ +
          ((zIndex + 0.5) / sampleResolution) * (bounds.maxZ - bounds.minZ);
        const point = { x, y, z };
        const outerLocal = {
          x: point.x / normalizedOuterScale.x,
          y: point.y / normalizedOuterScale.y,
          z: point.z / normalizedOuterScale.z,
        };
        const innerTranslated = inverseRotatePoint3D(
          {
            x: point.x - innerOffset.x,
            y: point.y - innerOffset.y,
            z: point.z - innerOffset.z,
          },
          innerRotation
        );
        const innerLocal = {
          x: innerTranslated.x / normalizedInnerScale.x,
          y: innerTranslated.y / normalizedInnerScale.y,
          z: innerTranslated.z / normalizedInnerScale.z,
        };

        if (
          pointInsideSolid(outerSolid, outerLocal, sides) &&
          pointInsideSolid(innerSolid, innerLocal, sides)
        ) {
          points.push(projectPoint(point, angleX, angleY));
        }
      }
    }
  }

  if (points.length === 0) return null;

  const maxVisiblePoints = 180;
  const stride = Math.max(Math.ceil(points.length / maxVisiblePoints), 1);
  const visiblePoints = points
    .filter((_, index) => index % stride === 0)
    .sort((a, b) => a.z - b.z);
  const center = visiblePoints.reduce(
    (sum, point) => ({
      x: sum.x + point.x / visiblePoints.length,
      y: sum.y + point.y / visiblePoints.length,
      z: 0,
      perspective: 1,
    }),
    { x: 0, y: 0, z: 0, perspective: 1 }
  );

  return (
    <g pointerEvents="none">
      <circle
        cx={center.x}
        cy={center.y}
        r="86"
        fill="#facc15"
        opacity="0.1"
        filter="url(#intersectionGlow)"
      />
      {visiblePoints.map((point, index) => (
        <circle
          key={`intersection-point-${index}`}
          cx={point.x}
          cy={point.y}
          r={4.4 * point.perspective}
          fill={index % 3 === 0 ? "#facc15" : "#22d3ee"}
          opacity={0.24 + Math.min(point.perspective * 0.22, 0.32)}
        />
      ))}
      <text
        x={center.x}
        y={center.y - 96}
        textAnchor="middle"
        className="fill-yellow-100 text-[22px] font-black"
        stroke="#713f12"
        strokeWidth="5"
        paintOrder="stroke"
      >
        interseção
      </text>
    </g>
  );
}

function polygonPath(points: ProjectedPoint[]) {
  return (
    points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ") + " Z"
  );
}

function midpoint(points: Vec3[]): Vec3 {
  return points.reduce(
    (sum, point) => ({
      x: sum.x + point.x / points.length,
      y: sum.y + point.y / points.length,
      z: sum.z + point.z / points.length,
    }),
    { x: 0, y: 0, z: 0 }
  );
}

function distanceBetweenPoints(a: Vec3, b: Vec3) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function elementKindLabel(kind: GeometryElementKind) {
  if (kind === "face") return "Face";
  if (kind === "edge") return "Aresta";
  return "Vértice";
}

function buildGeometryElement({
  kind,
  index,
  target,
  worldPoint,
}: {
  kind: GeometryElementKind;
  index: number;
  target: SelectedTarget;
  worldPoint: Vec3;
}): GeometryElement {
  return {
    kind,
    index,
    target,
    worldPoint,
    label: `${elementKindLabel(kind)} ${index + 1}`,
  };
}

function renderMesh({
  mesh,
  angleX,
  angleY,
  scale,
  offset,
  objectRotation = { x: 0, y: 0, z: 0 },
  theme,
  onGeometryClick,
  onGeometryDoubleClick,
  onGeometryPointerDown,
  onElementClick,
  onElementDoubleClick,
  onElementPointerDown,
}: {
  mesh: SolidMesh;
  angleX: number;
  angleY: number;
  scale: ScaleInput;
  offset: Vec3;
  objectRotation?: Vec3;
  theme: RenderTheme;
  onGeometryClick?: () => void;
  onGeometryDoubleClick?: (event: React.MouseEvent) => void;
  onGeometryPointerDown?: (event: React.PointerEvent) => void;
  onElementClick?: (element: Omit<GeometryElement, "target">) => void;
  onElementDoubleClick?: (
    element: Omit<GeometryElement, "target">,
    event: React.MouseEvent
  ) => void;
  onElementPointerDown?: (
    element: Omit<GeometryElement, "target">,
    event: React.PointerEvent
  ) => void;
}) {
  const transformedFaces = mesh.faces.map((face, index) => {
    const transformed = face.points.map((point) =>
      transformPointWithRotation(point, scale, offset, objectRotation)
    );

    const projected = transformed.map((point) =>
      projectPoint(point, angleX, angleY)
    );

    const avgZ =
      projected.reduce((sum, point) => sum + point.z, 0) / projected.length;

    return {
      ...face,
      index,
      projected,
      avgZ,
      element: {
        kind: "face" as GeometryElementKind,
        index,
        worldPoint: midpoint(transformed),
        label: `Face ${index + 1}`,
      },
    };
  });

  const transformedEdges = mesh.edges.map((edge, index) => {
    const transformed = edge.map((point) =>
      transformPointWithRotation(point, scale, offset, objectRotation)
    );

    const projected = transformed.map((point) =>
      projectPoint(point, angleX, angleY)
    );

    const avgZ =
      projected.reduce((sum, point) => sum + point.z, 0) / projected.length;

    return {
      index,
      projected,
      avgZ,
      worldPoints: transformed,
      element: {
        kind: "edge" as GeometryElementKind,
        index,
        worldPoint: midpoint(transformed),
        label: `Aresta ${index + 1}`,
      },
    };
  });
  const vertexMap = new Map<string, {
    index: number;
    worldPoint: Vec3;
    projected: ProjectedPoint;
    avgZ: number;
    element: Omit<GeometryElement, "target">;
  }>();

  transformedEdges.forEach((edge) => {
    edge.worldPoints.forEach((worldPoint) => {
      const key = `${worldPoint.x.toFixed(4)}:${worldPoint.y.toFixed(4)}:${worldPoint.z.toFixed(4)}`;

      if (vertexMap.has(key)) return;

      const projected = projectPoint(worldPoint, angleX, angleY);
      const index = vertexMap.size;
      vertexMap.set(key, {
        index,
        worldPoint,
        projected,
        avgZ: projected.z,
        element: {
          kind: "vertex",
          index,
          worldPoint,
          label: `Vértice ${index + 1}`,
        },
      });
    });
  });
  const transformedVertices = Array.from(vertexMap.values());

  const handleElementClick = (
    element: Omit<GeometryElement, "target">,
    event: React.MouseEvent | React.PointerEvent
  ) => {
    event.preventDefault();
    event.stopPropagation();
    onGeometryClick?.();
    onElementClick?.(element);
  };

  return (
    <g>
      {[...transformedFaces]
        .sort((a, b) => a.avgZ - b.avgZ)
        .map((face) => (
          <path
            key={`face-${theme.label}-${face.index}`}
            d={polygonPath(face.projected)}
            fill={theme.face}
            opacity={face.opacity ?? theme.opacity}
            stroke="none"
          />
        ))}

      {[...transformedFaces]
        .sort((a, b) => a.avgZ - b.avgZ)
        .map((face) => (
          <path
            key={`face-hit-${theme.label}-${face.index}`}
            d={polygonPath(face.projected)}
            fill="transparent"
            pointerEvents="all"
            className="cursor-pointer"
            onClick={(event) => handleElementClick(face.element, event)}
            onDoubleClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onElementDoubleClick?.(face.element, event);
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
              onElementPointerDown?.(face.element, event);
            }}
          />
        ))}

      {[...transformedEdges]
        .sort((a, b) => a.avgZ - b.avgZ)
        .map((edge) => (
          <g key={`edge-group-${theme.label}-${edge.index}`}>
            <line
              x1={edge.projected[0].x}
              y1={edge.projected[0].y}
              x2={edge.projected[1].x}
              y2={edge.projected[1].y}
              stroke={theme.edge}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={theme.dashed ? "8 8" : undefined}
              opacity={theme.dashed ? 0.75 : 0.95}
            />

            {onGeometryClick ? (
              <line
                x1={edge.projected[0].x}
                y1={edge.projected[0].y}
                x2={edge.projected[1].x}
                y2={edge.projected[1].y}
                stroke="transparent"
                strokeWidth="22"
                strokeLinecap="round"
                pointerEvents="all"
                className="cursor-pointer"
                onClick={(event) => {
                  handleElementClick(edge.element, event);
                }}
                onDoubleClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onElementDoubleClick?.(edge.element, event);
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  onGeometryPointerDown?.(event);
                  onElementPointerDown?.(edge.element, event);
                }}
              />
            ) : null}
          </g>
        ))}

      {[...transformedVertices]
        .sort((a, b) => a.avgZ - b.avgZ)
        .map((vertex) => (
          <circle
            key={`vertex-hit-${theme.label}-${vertex.index}`}
            cx={vertex.projected.x}
            cy={vertex.projected.y}
            r="13"
            fill="transparent"
            pointerEvents="all"
            className="cursor-crosshair"
            onClick={(event) => handleElementClick(vertex.element, event)}
            onDoubleClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onElementDoubleClick?.(vertex.element, event);
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
              onElementPointerDown?.(vertex.element, event);
            }}
          />
        ))}
    </g>
  );
}

function renderSphere({
  angleX,
  angleY,
  scale,
  offset,
  theme,
  onGeometryClick,
  onGeometryDoubleClick,
  onGeometryPointerDown,
}: {
  angleX: number;
  angleY: number;
  scale: ScaleInput;
  offset: Vec3;
  theme: RenderTheme;
  onGeometryClick?: () => void;
  onGeometryDoubleClick?: (event: React.MouseEvent) => void;
  onGeometryPointerDown?: (event: React.PointerEvent) => void;
}) {
  const normalizedScale = normalizeScale(scale);
  const center = projectPoint(offset, angleX, angleY);
  const radiusX = 145 * normalizedScale.x * center.perspective;
  const radiusY = 145 * normalizedScale.y * center.perspective;
  const radius = Math.max(radiusX, radiusY);

  return (
    <g
      onClick={(event) => {
        if (!onGeometryClick) return;
        event.preventDefault();
        event.stopPropagation();
        onGeometryClick();
      }}
      onDoubleClick={(event) => {
        if (!onGeometryDoubleClick) return;
        event.preventDefault();
        event.stopPropagation();
        onGeometryDoubleClick(event);
      }}
      onPointerDown={(event) => {
        onGeometryPointerDown?.(event);
      }}
      className={onGeometryClick ? "cursor-pointer" : undefined}
    >
      <circle
        cx={center.x}
        cy={center.y}
        r={radius}
        fill={theme.face}
        opacity={theme.opacity}
        stroke={theme.edge}
        strokeWidth="3"
      />

      <ellipse
        cx={center.x}
        cy={center.y}
        rx={radiusX}
        ry={radiusY * 0.28}
        fill="none"
        stroke={theme.edge}
        strokeWidth="3"
        strokeDasharray={theme.dashed ? "8 8" : undefined}
        opacity="0.75"
      />

      <ellipse
        cx={center.x}
        cy={center.y}
        rx={radiusX * 0.34}
        ry={radiusY}
        fill="none"
        stroke={theme.edge}
        strokeWidth="3"
        strokeDasharray={theme.dashed ? "8 8" : undefined}
        opacity="0.45"
      />

      <circle
        cx={center.x - radiusX * 0.28}
        cy={center.y - radiusY * 0.28}
        r={Math.min(radiusX, radiusY) * 0.12}
        fill="#ffffff"
        opacity="0.25"
      />
    </g>
  );
}

function baseAreaRegularPolygon(sides: number, side: number) {
  return (sides * side * side) / (4 * Math.tan(Math.PI / sides));
}

function apothemRegularPolygon(sides: number, side: number) {
  return side / (2 * Math.tan(Math.PI / sides));
}

function circumradiusRegularPolygon(sides: number, side: number) {
  return side / (2 * Math.sin(Math.PI / sides));
}

function getSolidMetrics({
  type,
  sides,
  side,
  width,
  depth,
  height,
  radius,
}: {
  type: SolidType;
  sides: number;
  side: number;
  width: number;
  depth: number;
  height: number;
  radius: number;
}): SolidMetrics {
  if (type === "cube") {
    return {
      volume: side ** 3,
      totalArea: 6 * side ** 2,
      formulas: {
        volume: String.raw`V = a^3`,
        area: String.raw`A_T = 6a^2`,
      },
      substitution: {
        volume: String.raw`V = ${formatNumber(side)}^3 = ${formatNumber(
          side ** 3
        )}`,
        area: String.raw`A_T = 6 \cdot ${formatNumber(
          side
        )}^2 = ${formatNumber(6 * side ** 2)}`,
      },
      explanation:
        "No cubo, todas as arestas são iguais. A base é um quadrado de lado a, e a altura também mede a.",
    };
  }

  if (type === "box") {
    return {
      volume: width * depth * height,
      totalArea: 2 * (width * depth + width * height + depth * height),
      formulas: {
        volume: String.raw`V = c \cdot l \cdot h`,
        area: String.raw`A_T = 2(cl + ch + lh)`,
      },
      substitution: {
        volume: String.raw`V = ${formatNumber(width)} \cdot ${formatNumber(
          depth
        )} \cdot ${formatNumber(height)} = ${formatNumber(
          width * depth * height
        )}`,
        area: String.raw`A_T = 2(${formatNumber(
          width * depth
        )} + ${formatNumber(width * height)} + ${formatNumber(
          depth * height
        )}) = ${formatNumber(
          2 * (width * depth + width * height + depth * height)
        )}`,
      },
      explanation:
        "O paralelepípedo pode ser visto como um prisma de base retangular. Volume é área da base vezes altura.",
    };
  }

  if (type === "regularPrism") {
    const baseArea = baseAreaRegularPolygon(sides, side);
    const perimeter = sides * side;
    const lateralArea = perimeter * height;

    return {
      volume: baseArea * height,
      baseArea,
      lateralArea,
      totalArea: 2 * baseArea + lateralArea,
      formulas: {
        volume: String.raw`V = A_b \cdot h`,
        area: String.raw`A_T = 2A_b + A_L`,
      },
      substitution: {
        volume: String.raw`V = ${formatNumber(baseArea)} \cdot ${formatNumber(
          height
        )} = ${formatNumber(baseArea * height)}`,
        area: String.raw`A_T = 2 \cdot ${formatNumber(
          baseArea
        )} + ${formatNumber(lateralArea)} = ${formatNumber(
          2 * baseArea + lateralArea
        )}`,
      },
      explanation:
        "Em qualquer prisma, o volume é área da base vezes altura. Se a base é um polígono regular, calculamos a área da base pela relação entre lado, apótema e perímetro.",
    };
  }

  if (type === "pyramid") {
    const baseArea = baseAreaRegularPolygon(sides, side);
    const perimeter = sides * side;
    const apothem = apothemRegularPolygon(sides, side);
    const slant = Math.sqrt(height ** 2 + apothem ** 2);
    const lateralArea = (perimeter * slant) / 2;

    return {
      volume: (baseArea * height) / 3,
      baseArea,
      lateralArea,
      totalArea: baseArea + lateralArea,
      formulas: {
        volume: String.raw`V = \frac{A_b \cdot h}{3}`,
        area: String.raw`A_T = A_b + A_L`,
      },
      substitution: {
        volume: String.raw`V = \frac{${formatNumber(
          baseArea
        )} \cdot ${formatNumber(height)}}{3} = ${formatNumber(
          (baseArea * height) / 3
        )}`,
        area: String.raw`A_T = ${formatNumber(baseArea)} + ${formatNumber(
          lateralArea
        )} = ${formatNumber(baseArea + lateralArea)}`,
      },
      explanation:
        "A pirâmide tem volume igual a um terço do prisma de mesma base e mesma altura. A área total soma a base com as faces laterais triangulares.",
    };
  }

  if (type === "cylinder") {
    return {
      volume: Math.PI * radius ** 2 * height,
      baseArea: Math.PI * radius ** 2,
      lateralArea: 2 * Math.PI * radius * height,
      totalArea: 2 * Math.PI * radius * (radius + height),
      formulas: {
        volume: String.raw`V = \pi r^2h`,
        area: String.raw`A_T = 2\pi r(r+h)`,
      },
      substitution: {
        volume: String.raw`V = \pi \cdot ${formatNumber(
          radius
        )}^2 \cdot ${formatNumber(height)} = ${formatNumber(
          Math.PI * radius ** 2 * height
        )}`,
        area: String.raw`A_T = 2\pi \cdot ${formatNumber(
          radius
        )}(${formatNumber(radius)}+${formatNumber(height)}) = ${formatNumber(
          2 * Math.PI * radius * (radius + height)
        )}`,
      },
      explanation:
        "O cilindro é um prisma de base circular. Por isso, o volume continua sendo área da base vezes altura.",
    };
  }

  if (type === "cone") {
    const geratriz = Math.sqrt(radius ** 2 + height ** 2);

    return {
      volume: (Math.PI * radius ** 2 * height) / 3,
      baseArea: Math.PI * radius ** 2,
      lateralArea: Math.PI * radius * geratriz,
      totalArea: Math.PI * radius * (radius + geratriz),
      formulas: {
        volume: String.raw`V = \frac{\pi r^2h}{3}`,
        area: String.raw`A_T = \pi r(r+g)`,
      },
      substitution: {
        volume: String.raw`V = \frac{\pi \cdot ${formatNumber(
          radius
        )}^2 \cdot ${formatNumber(height)}}{3} = ${formatNumber(
          (Math.PI * radius ** 2 * height) / 3
        )}`,
        area: String.raw`A_T = \pi \cdot ${formatNumber(
          radius
        )}(${formatNumber(radius)}+${formatNumber(geratriz)}) = ${formatNumber(
          Math.PI * radius * (radius + geratriz)
        )}`,
      },
      explanation:
        "O cone tem volume igual a um terço do cilindro de mesma base e mesma altura. A área lateral depende da geratriz.",
    };
  }

  return {
    volume: (4 * Math.PI * radius ** 3) / 3,
    totalArea: 4 * Math.PI * radius ** 2,
    formulas: {
      volume: String.raw`V = \frac{4}{3}\pi r^3`,
      area: String.raw`A = 4\pi r^2`,
    },
    substitution: {
      volume: String.raw`V = \frac{4}{3}\pi \cdot ${formatNumber(
        radius
      )}^3 = ${formatNumber((4 * Math.PI * radius ** 3) / 3)}`,
      area: String.raw`A = 4\pi \cdot ${formatNumber(
        radius
      )}^2 = ${formatNumber(4 * Math.PI * radius ** 2)}`,
    },
    explanation:
      "Na esfera, todo ponto da superfície está à mesma distância do centro. O raio controla tanto o volume quanto a área.",
  };
}

function getActionsForSolid(type: SolidType): GeometryAction[] {
  if (type === "cube") {
    return [
      {
        id: "edge",
        label: "Aresta",
        description: "Identifica a medida fundamental do cubo.",
      },
      {
        id: "faceDiagonal",
        label: "Diagonal da face",
        description: "Mostra a diagonal de uma face quadrada.",
      },
      {
        id: "spaceDiagonal",
        label: "Diagonal espacial",
        description: "Mostra a diagonal que atravessa o cubo.",
      },
      {
        id: "faceArea",
        label: "Área da face",
        description: "Calcula a área de uma das faces.",
      },
      {
        id: "volume",
        label: "Volume",
        description: "Calcula o volume do cubo.",
      },
    ];
  }

  if (type === "box") {
    return [
      {
        id: "edge",
        label: "Arestas",
        description: "Comprimento, largura e altura.",
      },
      {
        id: "baseDiagonal",
        label: "Diagonal da base",
        description: "Diagonal do retângulo da base.",
      },
      {
        id: "spaceDiagonal",
        label: "Diagonal espacial",
        description: "Diagonal interna do paralelepípedo.",
      },
      {
        id: "volume",
        label: "Volume",
        description: "Produto das três dimensões.",
      },
    ];
  }

  if (type === "regularPrism") {
    return [
      {
        id: "edge",
        label: "Lado da base",
        description: "Aresta do polígono regular da base.",
      },
      {
        id: "apothem",
        label: "Apótema",
        description: "Distância do centro ao lado do polígono.",
      },
      {
        id: "circumradius",
        label: "Raio circunscrito",
        description: "Raio do círculo que passa pelos vértices.",
      },
      {
        id: "baseArea",
        label: "Área da base",
        description: "Área do polígono regular.",
      },
      {
        id: "height",
        label: "Altura",
        description: "Distância entre as bases.",
      },
      {
        id: "volume",
        label: "Volume",
        description: "Área da base vezes altura.",
      },
    ];
  }

  if (type === "pyramid") {
    return [
      {
        id: "edge",
        label: "Lado da base",
        description: "Aresta do polígono da base.",
      },
      {
        id: "apothem",
        label: "Apótema da base",
        description: "Distância do centro ao lado da base.",
      },
      {
        id: "slant",
        label: "Geratriz",
        description: "Altura inclinada da face lateral.",
      },
      {
        id: "height",
        label: "Altura",
        description: "Distância do vértice ao plano da base.",
      },
      {
        id: "volume",
        label: "Volume",
        description: "Um terço do prisma equivalente.",
      },
    ];
  }

  if (type === "cylinder") {
    return [
      {
        id: "radius",
        label: "Raio",
        description: "Distância do centro à borda da base.",
      },
      {
        id: "diameter",
        label: "Diâmetro",
        description: "Duas vezes o raio.",
      },
      {
        id: "height",
        label: "Altura",
        description: "Distância entre as bases.",
      },
      {
        id: "axialSection",
        label: "Corte axial",
        description: "Seção retangular passando pelo eixo.",
      },
      {
        id: "volume",
        label: "Volume",
        description: "Área da base vezes altura.",
      },
    ];
  }

  if (type === "cone") {
    return [
      {
        id: "radius",
        label: "Raio",
        description: "Raio da base circular.",
      },
      {
        id: "height",
        label: "Altura",
        description: "Distância do vértice ao centro da base.",
      },
      {
        id: "slant",
        label: "Geratriz",
        description: "Segmento inclinado da superfície lateral.",
      },
      {
        id: "axialSection",
        label: "Corte axial",
        description: "Triângulo isósceles formado pelo corte.",
      },
      {
        id: "volume",
        label: "Volume",
        description: "Um terço do cilindro equivalente.",
      },
    ];
  }

  return [
    {
      id: "radius",
      label: "Raio",
      description: "Distância do centro à superfície.",
    },
    {
      id: "diameter",
      label: "Diâmetro",
      description: "Duas vezes o raio.",
    },
    {
      id: "greatCircle",
      label: "Círculo máximo",
      description: "Corte central da esfera.",
    },
    {
      id: "totalArea",
      label: "Área",
      description: "Área da superfície esférica.",
    },
    {
      id: "volume",
      label: "Volume",
      description: "Volume da esfera.",
    },
  ];
}

function getInspectorForAction({
  type,
  action,
  sides,
  side,
  width,
  depth,
  height,
  radius,
}: {
  type: SolidType;
  action: GeometryActionId;
  sides: number;
  side: number;
  width: number;
  depth: number;
  height: number;
  radius: number;
}): InspectorData {
  const baseArea = baseAreaRegularPolygon(sides, side);
  const apothem = apothemRegularPolygon(sides, side);
  const circumradius = circumradiusRegularPolygon(sides, side);
  const faceDiagonal = side * Math.sqrt(2);
  const cubeSpaceDiagonal = side * Math.sqrt(3);
  const boxBaseDiagonal = Math.sqrt(width ** 2 + depth ** 2);
  const boxSpaceDiagonal = Math.sqrt(width ** 2 + depth ** 2 + height ** 2);
  const coneSlant = Math.sqrt(radius ** 2 + height ** 2);

  if (type === "cube") {
    if (action === "faceDiagonal") {
      return {
        title: "Diagonal da face do cubo",
        description:
          "A face do cubo é um quadrado. A diagonal da face vem pelo Teorema de Pitágoras aplicado em dois lados iguais.",
        actionId: action,
        formulas: [
          {
            label: "Diagonal da face",
            formula: String.raw`d_f = a\sqrt{2}`,
            substitution: String.raw`d_f = ${formatNumber(
              side
            )}\sqrt{2} = ${formatNumber(faceDiagonal)}`,
          },
        ],
      };
    }

    if (action === "spaceDiagonal") {
      return {
        title: "Diagonal espacial do cubo",
        description:
          "A diagonal espacial atravessa o cubo ligando dois vértices opostos. Ela usa as três dimensões do sólido.",
        actionId: action,
        formulas: [
          {
            label: "Diagonal espacial",
            formula: String.raw`D = a\sqrt{3}`,
            substitution: String.raw`D = ${formatNumber(
              side
            )}\sqrt{3} = ${formatNumber(cubeSpaceDiagonal)}`,
          },
        ],
      };
    }

    if (action === "faceArea") {
      return {
        title: "Área de uma face do cubo",
        description:
          "Cada face é um quadrado. A área de uma face é lado vezes lado.",
        actionId: action,
        formulas: [
          {
            label: "Área da face",
            formula: String.raw`A_f = a^2`,
            substitution: String.raw`A_f = ${formatNumber(
              side
            )}^2 = ${formatNumber(side ** 2)}`,
          },
        ],
      };
    }

    if (action === "volume") {
      return {
        title: "Volume do cubo",
        description: "O volume do cubo é a aresta elevada ao cubo.",
        actionId: action,
        formulas: [
          {
            label: "Volume",
            formula: String.raw`V = a^3`,
            substitution: String.raw`V = ${formatNumber(
              side
            )}^3 = ${formatNumber(side ** 3)}`,
          },
        ],
      };
    }

    return {
      title: "Aresta do cubo",
      description:
        "A aresta é a medida fundamental do cubo. Com ela, você descobre volume, área, diagonal da face e diagonal espacial.",
      actionId: action,
      formulas: [
        {
          label: "Aresta",
          formula: String.raw`a = ${formatNumber(side)}`,
          substitution: String.raw`a = ${formatNumber(side)}`,
        },
      ],
    };
  }

  if (type === "box") {
    if (action === "baseDiagonal") {
      return {
        title: "Diagonal da base do paralelepípedo",
        description:
          "A diagonal da base aparece aplicando Pitágoras no retângulo da base.",
        actionId: action,
        formulas: [
          {
            label: "Diagonal da base",
            formula: String.raw`d_b = \sqrt{c^2+l^2}`,
            substitution: String.raw`d_b = \sqrt{${formatNumber(
              width
            )}^2+${formatNumber(depth)}^2} = ${formatNumber(
              boxBaseDiagonal
            )}`,
          },
        ],
      };
    }

    if (action === "spaceDiagonal") {
      return {
        title: "Diagonal espacial do paralelepípedo",
        description:
          "A diagonal espacial usa as três dimensões: comprimento, largura e altura.",
        actionId: action,
        formulas: [
          {
            label: "Diagonal espacial",
            formula: String.raw`D = \sqrt{c^2+l^2+h^2}`,
            substitution: String.raw`D = \sqrt{${formatNumber(
              width
            )}^2+${formatNumber(depth)}^2+${formatNumber(
              height
            )}^2} = ${formatNumber(boxSpaceDiagonal)}`,
          },
        ],
      };
    }

    if (action === "volume") {
      return {
        title: "Volume do paralelepípedo",
        description:
          "O volume é o produto das três dimensões: comprimento, largura e altura.",
        actionId: action,
        formulas: [
          {
            label: "Volume",
            formula: String.raw`V = c\cdot l\cdot h`,
            substitution: String.raw`V = ${formatNumber(
              width
            )}\cdot ${formatNumber(depth)}\cdot ${formatNumber(
              height
            )} = ${formatNumber(width * depth * height)}`,
          },
        ],
      };
    }

    return {
      title: "Arestas do paralelepípedo",
      description:
        "Aqui as arestas podem ter medidas diferentes: comprimento, largura e altura.",
      actionId: action,
      formulas: [
        {
          label: "Dimensões",
          formula: String.raw`c=${formatNumber(width)},\quad l=${formatNumber(
            depth
          )},\quad h=${formatNumber(height)}`,
          substitution: String.raw`c=${formatNumber(width)},\quad l=${formatNumber(
            depth
          )},\quad h=${formatNumber(height)}`,
        },
      ],
    };
  }

  if (type === "regularPrism") {
    if (action === "apothem") {
      return {
        title: "Apótema da base do prisma regular",
        description:
          "O apótema é a distância do centro da base até o lado do polígono regular.",
        actionId: action,
        formulas: [
          {
            label: "Apótema",
            formula: String.raw`a_p = \frac{l}{2\tan\left(\frac{\pi}{n}\right)}`,
            substitution: String.raw`a_p = \frac{${formatNumber(
              side
            )}}{2\tan\left(\frac{\pi}{${sides}}\right)} = ${formatNumber(
              apothem
            )}`,
          },
        ],
      };
    }

    if (action === "circumradius") {
      return {
        title: "Raio circunscrito da base",
        description:
          "É o raio do círculo que passa pelos vértices do polígono da base.",
        actionId: action,
        formulas: [
          {
            label: "Raio circunscrito",
            formula: String.raw`R = \frac{l}{2\sin\left(\frac{\pi}{n}\right)}`,
            substitution: String.raw`R = \frac{${formatNumber(
              side
            )}}{2\sin\left(\frac{\pi}{${sides}}\right)} = ${formatNumber(
              circumradius
            )}`,
          },
        ],
      };
    }

    if (action === "baseArea") {
      return {
        title: "Área da base do prisma regular",
        description:
          "A área da base vem da metade do produto entre perímetro e apótema.",
        actionId: action,
        formulas: [
          {
            label: "Área da base",
            formula: String.raw`A_b = \frac{P\cdot a_p}{2} = \frac{nla_p}{2}`,
            substitution: String.raw`A_b = \frac{${sides}\cdot ${formatNumber(
              side
            )}\cdot ${formatNumber(apothem)}}{2} = ${formatNumber(
              baseArea
            )}`,
          },
        ],
      };
    }

    if (action === "height") {
      return {
        title: "Altura do prisma",
        description:
          "A altura é a distância entre as bases paralelas. No prisma reto, ela coincide com as arestas laterais.",
        actionId: action,
        formulas: [
          {
            label: "Altura",
            formula: String.raw`h = ${formatNumber(height)}`,
            substitution: String.raw`h = ${formatNumber(height)}`,
          },
        ],
      };
    }

    if (action === "volume") {
      return {
        title: "Volume do prisma regular",
        description:
          "Todo prisma segue a mesma ideia: volume é área da base vezes altura.",
        actionId: action,
        formulas: [
          {
            label: "Volume",
            formula: String.raw`V = A_b\cdot h`,
            substitution: String.raw`V = ${formatNumber(
              baseArea
            )}\cdot ${formatNumber(height)} = ${formatNumber(
              baseArea * height
            )}`,
          },
        ],
      };
    }

    return {
      title: "Lado da base do prisma regular",
      description:
        "O lado da base define o polígono regular e permite calcular apótema, raio circunscrito e área da base.",
      actionId: action,
      formulas: [
        {
          label: "Lado",
          formula: String.raw`l = ${formatNumber(side)}`,
          substitution: String.raw`l = ${formatNumber(side)}`,
        },
      ],
    };
  }

  if (type === "pyramid") {
    if (action === "slant") {
      return {
        title: "Geratriz da pirâmide regular",
        description:
          "A geratriz aparece no triângulo formado pela altura da pirâmide e pelo apótema da base.",
        actionId: action,
        formulas: [
          {
            label: "Geratriz",
            formula: String.raw`g = \sqrt{h^2+a_p^2}`,
            substitution: String.raw`g = \sqrt{${formatNumber(
              height
            )}^2+${formatNumber(apothem)}^2} = ${formatNumber(
              Math.sqrt(height ** 2 + apothem ** 2)
            )}`,
          },
        ],
      };
    }

    if (action === "volume") {
      return {
        title: "Volume da pirâmide",
        description:
          "A pirâmide tem um terço do volume do prisma de mesma base e mesma altura.",
        actionId: action,
        formulas: [
          {
            label: "Volume",
            formula: String.raw`V = \frac{A_bh}{3}`,
            substitution: String.raw`V = \frac{${formatNumber(
              baseArea
            )}\cdot ${formatNumber(height)}}{3} = ${formatNumber(
              (baseArea * height) / 3
            )}`,
          },
        ],
      };
    }

    if (action === "height") {
      return {
        title: "Altura da pirâmide",
        description:
          "A altura vai do vértice ao centro da base. Ela não é a mesma coisa que a geratriz. Confundir isso é um clássico do desastre.",
        actionId: action,
        formulas: [
          {
            label: "Altura",
            formula: String.raw`h = ${formatNumber(height)}`,
            substitution: String.raw`h = ${formatNumber(height)}`,
          },
        ],
      };
    }

    return {
      title: "Base da pirâmide regular",
      description:
        "A base é um polígono regular. O lado da base ajuda a encontrar apótema e área da base.",
      actionId: action,
      formulas: [
        {
          label: "Apótema da base",
          formula: String.raw`a_p = \frac{l}{2\tan\left(\frac{\pi}{n}\right)}`,
          substitution: String.raw`a_p = ${formatNumber(apothem)}`,
        },
      ],
    };
  }

  if (type === "cylinder") {
    if (action === "diameter") {
      return {
        title: "Diâmetro do cilindro",
        description:
          "O diâmetro da base é o dobro do raio. Aparentemente simples, até alguém esquecer numa questão.",
        actionId: action,
        formulas: [
          {
            label: "Diâmetro",
            formula: String.raw`d = 2r`,
            substitution: String.raw`d = 2\cdot ${formatNumber(
              radius
            )} = ${formatNumber(2 * radius)}`,
          },
        ],
      };
    }

    if (action === "height") {
      return {
        title: "Altura do cilindro",
        description:
          "A altura é a distância entre as duas bases circulares paralelas.",
        actionId: action,
        formulas: [
          {
            label: "Altura",
            formula: String.raw`h = ${formatNumber(height)}`,
            substitution: String.raw`h = ${formatNumber(height)}`,
          },
        ],
      };
    }

    if (action === "axialSection") {
      return {
        title: "Corte axial do cilindro",
        description:
          "O corte axial passa pelo eixo do cilindro e forma um retângulo de base 2r e altura h.",
        actionId: action,
        formulas: [
          {
            label: "Seção axial",
            formula: String.raw`A_{\text{seção}} = 2r\cdot h`,
            substitution: String.raw`A_{\text{seção}} = 2\cdot ${formatNumber(
              radius
            )}\cdot ${formatNumber(height)} = ${formatNumber(
              2 * radius * height
            )}`,
          },
        ],
      };
    }

    if (action === "volume") {
      return {
        title: "Volume do cilindro",
        description: "O cilindro funciona como um prisma de base circular.",
        actionId: action,
        formulas: [
          {
            label: "Volume",
            formula: String.raw`V = \pi r^2h`,
            substitution: String.raw`V = \pi\cdot ${formatNumber(
              radius
            )}^2\cdot ${formatNumber(height)} = ${formatNumber(
              Math.PI * radius ** 2 * height
            )}`,
          },
        ],
      };
    }

    return {
      title: "Raio do cilindro",
      description:
        "O raio controla a base circular e aparece ao quadrado no volume.",
      actionId: action,
      formulas: [
        {
          label: "Área da base",
          formula: String.raw`A_b = \pi r^2`,
          substitution: String.raw`A_b = \pi\cdot ${formatNumber(
            radius
          )}^2 = ${formatNumber(Math.PI * radius ** 2)}`,
        },
      ],
    };
  }

  if (type === "cone") {
    if (action === "slant") {
      return {
        title: "Geratriz do cone",
        description:
          "A geratriz do cone vem do triângulo retângulo formado pelo raio, pela altura e pela lateral inclinada.",
        actionId: action,
        formulas: [
          {
            label: "Geratriz",
            formula: String.raw`g = \sqrt{r^2+h^2}`,
            substitution: String.raw`g = \sqrt{${formatNumber(
              radius
            )}^2+${formatNumber(height)}^2} = ${formatNumber(coneSlant)}`,
          },
        ],
      };
    }

    if (action === "axialSection") {
      return {
        title: "Corte axial do cone",
        description:
          "O corte axial do cone forma um triângulo isósceles de base 2r e altura h.",
        actionId: action,
        formulas: [
          {
            label: "Área da seção axial",
            formula: String.raw`A_{\text{seção}} = \frac{2r\cdot h}{2}=rh`,
            substitution: String.raw`A_{\text{seção}} = ${formatNumber(
              radius
            )}\cdot ${formatNumber(height)} = ${formatNumber(
              radius * height
            )}`,
          },
        ],
      };
    }

    if (action === "volume") {
      return {
        title: "Volume do cone",
        description:
          "O cone tem um terço do volume do cilindro de mesma base e mesma altura.",
        actionId: action,
        formulas: [
          {
            label: "Volume",
            formula: String.raw`V = \frac{\pi r^2h}{3}`,
            substitution: String.raw`V = \frac{\pi\cdot ${formatNumber(
              radius
            )}^2\cdot ${formatNumber(height)}}{3} = ${formatNumber(
              (Math.PI * radius ** 2 * height) / 3
            )}`,
          },
        ],
      };
    }

    if (action === "height") {
      return {
        title: "Altura do cone",
        description:
          "A altura vai do vértice ao centro da base. Ela não é a geratriz.",
        actionId: action,
        formulas: [
          {
            label: "Altura",
            formula: String.raw`h = ${formatNumber(height)}`,
            substitution: String.raw`h = ${formatNumber(height)}`,
          },
        ],
      };
    }

    return {
      title: "Raio do cone",
      description:
        "O raio aparece na base circular e no triângulo que define a geratriz.",
      actionId: action,
      formulas: [
        {
          label: "Área da base",
          formula: String.raw`A_b = \pi r^2`,
          substitution: String.raw`A_b = \pi\cdot ${formatNumber(
            radius
          )}^2 = ${formatNumber(Math.PI * radius ** 2)}`,
        },
      ],
    };
  }

  if (type === "sphere") {
    if (action === "diameter") {
      return {
        title: "Diâmetro da esfera",
        description:
          "O diâmetro atravessa a esfera passando pelo centro. Ele vale duas vezes o raio.",
        actionId: action,
        formulas: [
          {
            label: "Diâmetro",
            formula: String.raw`d = 2r`,
            substitution: String.raw`d = 2\cdot ${formatNumber(
              radius
            )} = ${formatNumber(2 * radius)}`,
          },
        ],
      };
    }

    if (action === "greatCircle" || action === "centralSection") {
      return {
        title: "Círculo máximo da esfera",
        description:
          "O corte central da esfera forma um círculo máximo, com o mesmo raio da esfera.",
        actionId: action,
        formulas: [
          {
            label: "Área do círculo máximo",
            formula: String.raw`A = \pi r^2`,
            substitution: String.raw`A = \pi\cdot ${formatNumber(
              radius
            )}^2 = ${formatNumber(Math.PI * radius ** 2)}`,
          },
        ],
      };
    }

    if (action === "totalArea") {
      return {
        title: "Área da esfera",
        description: "A área da superfície esférica depende apenas do raio.",
        actionId: action,
        formulas: [
          {
            label: "Área",
            formula: String.raw`A = 4\pi r^2`,
            substitution: String.raw`A = 4\pi\cdot ${formatNumber(
              radius
            )}^2 = ${formatNumber(4 * Math.PI * radius ** 2)}`,
          },
        ],
      };
    }

    if (action === "volume") {
      return {
        title: "Volume da esfera",
        description: "O volume da esfera cresce com o cubo do raio.",
        actionId: action,
        formulas: [
          {
            label: "Volume",
            formula: String.raw`V = \frac{4}{3}\pi r^3`,
            substitution: String.raw`V = \frac{4}{3}\pi\cdot ${formatNumber(
              radius
            )}^3 = ${formatNumber((4 * Math.PI * radius ** 3) / 3)}`,
          },
        ],
      };
    }

    return {
      title: "Raio da esfera",
      description:
        "O raio é a distância do centro até qualquer ponto da superfície.",
      actionId: action,
      formulas: [
        {
          label: "Raio",
          formula: String.raw`r = ${formatNumber(radius)}`,
          substitution: String.raw`r = ${formatNumber(radius)}`,
        },
      ],
    };
  }

  return {
    title: "Medida selecionada",
    description: "Escolha uma ação para visualizar a relação geométrica.",
    actionId: action,
    formulas: [],
  };
}

function getInscribedRelationship({
  outerSolid,
  innerSolid,
  polygonSides,
  radius,
  side,
  innerScale,
}: {
  outerSolid: SolidType;
  innerSolid: SolidType;
  polygonSides: number;
  radius: number;
  side: number;
  height: number;
  innerScale: number;
}) {
  if (outerSolid === "cylinder" && innerSolid === "regularPrism") {
    const innerRadius = radius * innerScale;
    const innerSide = 2 * innerRadius * Math.sin(Math.PI / polygonSides);

    return {
      title: "Prisma regular inscrito em cilindro",
      formula: String.raw`l = 2R\sin\left(\frac{\pi}{n}\right)`,
      substitution: String.raw`l = 2 \cdot ${formatNumber(
        innerRadius
      )} \cdot \sin\left(\frac{\pi}{${polygonSides}}\right) = ${formatNumber(
        innerSide
      )}`,
      text:
        "A base do prisma fica inscrita no círculo da base do cilindro. Então o raio do cilindro é o raio circunscrito do polígono regular da base do prisma.",
    };
  }

  if (outerSolid === "cube" && innerSolid === "sphere") {
    return {
      title: "Esfera inscrita em cubo",
      formula: String.raw`r = \frac{a}{2}`,
      substitution: String.raw`r = \frac{${formatNumber(
        side
      )}}{2} = ${formatNumber(side / 2)}`,
      text:
        "A esfera toca as seis faces do cubo. Por isso, o diâmetro da esfera é igual à aresta do cubo.",
    };
  }

  if (outerSolid === "sphere" && innerSolid === "cube") {
    const cubeSide = (2 * radius) / Math.sqrt(3);

    return {
      title: "Cubo inscrito em esfera",
      formula: String.raw`d_{\text{cubo}} = a\sqrt{3} = 2R`,
      substitution: String.raw`a = \frac{2R}{\sqrt{3}} = \frac{2 \cdot ${formatNumber(
        radius
      )}}{\sqrt{3}} = ${formatNumber(cubeSide)}`,
      text:
        "A diagonal espacial do cubo é igual ao diâmetro da esfera. Essa é a relação central do problema.",
    };
  }

  if (outerSolid === "cylinder" && innerSolid === "cone") {
    return {
      title: "Cone inscrito em cilindro",
      formula: String.raw`V_{\text{cone}} = \frac{1}{3}V_{\text{cilindro}}`,
      substitution: String.raw`V_{\text{cone}} = \frac{\pi r^2h}{3}`,
      text:
        "Quando o cone tem a mesma base e a mesma altura do cilindro, seu volume é exatamente um terço do volume do cilindro.",
    };
  }

  return {
    title: "Modo livre de inscrição",
    formula: String.raw`V_{\text{ocupado}} = \frac{V_{\text{interno}}}{V_{\text{externo}}}\cdot 100\%`,
    substitution: String.raw`\text{percentual} = \frac{V_i}{V_e}\cdot 100\%`,
    text:
      "Neste modo, o sólido interno pode ser deslocado e escalado livremente. Para uma inscrição perfeita, normalmente ele precisa ficar centralizado e respeitar uma relação entre raio, aresta, altura ou diagonal.",
  };
}

function measurementLabel({
  x,
  y,
  text,
}: {
  x: number;
  y: number;
  text: string;
}) {
  return (
    <g>
      <rect
        x={x - 42}
        y={y - 15}
        width="84"
        height="30"
        rx="12"
        fill="#020617"
        opacity="0.78"
      />
      <text
        x={x}
        y={y + 5}
        textAnchor="middle"
        fontSize="13"
        fontWeight="900"
        fill="#fde68a"
      >
        {text}
      </text>
    </g>
  );
}

function measurementLine({
  from,
  to,
  label,
}: {
  from: ProjectedPoint;
  to: ProjectedPoint;
  label: string;
}) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  return (
    <g>
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke="#facc15"
        strokeWidth="7"
        strokeLinecap="round"
        opacity="0.95"
      />
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke="#78350f"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.65"
      />
      <circle cx={from.x} cy={from.y} r="7" fill="#fde68a" />
      <circle cx={to.x} cy={to.y} r="7" fill="#fde68a" />
      {measurementLabel({ x: midX, y: midY - 20, text: label })}
    </g>
  );
}

function projectOverlayPoint({
  point,
  angleX,
  angleY,
  scale,
  offset,
  objectRotation = { x: 0, y: 0, z: 0 },
}: {
  point: Vec3;
  angleX: number;
  angleY: number;
  scale: ScaleInput;
  offset: Vec3;
  objectRotation?: Vec3;
}) {
  return projectPoint(
    transformPointWithRotation(point, scale, offset, objectRotation),
    angleX,
    angleY
  );
}

function renderAxes({
  angleX,
  angleY,
}: {
  angleX: number;
  angleY: number;
}) {
  const origin = projectPoint({ x: -3.1, y: -2.8, z: -2.5 }, angleX, angleY);
  const xEnd = projectPoint({ x: -2.1, y: -2.8, z: -2.5 }, angleX, angleY);
  const yEnd = projectPoint({ x: -3.1, y: -1.8, z: -2.5 }, angleX, angleY);
  const zEnd = projectPoint({ x: -3.1, y: -2.8, z: -1.5 }, angleX, angleY);

  return (
    <g opacity="0.85">
      {measurementLine({ from: origin, to: xEnd, label: "X" })}
      {measurementLine({ from: origin, to: yEnd, label: "Y" })}
      {measurementLine({ from: origin, to: zEnd, label: "Z" })}
    </g>
  );
}

function renderCenterMark({
  angleX,
  angleY,
  scale,
  offset,
  objectRotation = { x: 0, y: 0, z: 0 },
}: {
  angleX: number;
  angleY: number;
  scale: ScaleInput;
  offset: Vec3;
  objectRotation?: Vec3;
}) {
  const center = projectOverlayPoint({
    point: { x: 0, y: 0, z: 0 },
    angleX,
    angleY,
    scale,
    offset,
    objectRotation,
  });

  return (
    <g>
      <circle cx={center.x} cy={center.y} r="11" fill="#facc15" opacity="0.9" />
      <circle cx={center.x} cy={center.y} r="4" fill="#78350f" />
      {measurementLabel({ x: center.x, y: center.y - 28, text: "centro" })}
    </g>
  );
}

function renderGrid() {
  return (
    <g opacity="0.18">
      {Array.from({ length: 15 }, (_, index) => {
        const value = 70 + index * 60;

        return (
          <g key={value}>
            <line
              x1={value}
              y1="60"
              x2={value}
              y2="660"
              stroke="#c7d2fe"
              strokeWidth="1"
            />
            <line
              x1="80"
              y1={value - 10}
              x2="900"
              y2={value - 10}
              stroke="#c7d2fe"
              strokeWidth="1"
            />
          </g>
        );
      })}
    </g>
  );
}

function renderMeasurementOverlay({
  type,
  action,
  angleX,
  angleY,
  scale,
  offset,
  objectRotation = { x: 0, y: 0, z: 0 },
}: {
  type: SolidType;
  action: GeometryActionId | null;
  angleX: number;
  angleY: number;
  scale: ScaleInput;
  offset: Vec3;
  objectRotation?: Vec3;
}) {
  if (!action) return null;

  const p = (point: Vec3) =>
    projectOverlayPoint({ point, angleX, angleY, scale, offset, objectRotation });

  if (type === "sphere") {
    const center = p({ x: 0, y: 0, z: 0 });
    const right = p({ x: 1.35, y: 0, z: 0 });
    const left = p({ x: -1.35, y: 0, z: 0 });
    const radius = Math.hypot(right.x - center.x, right.y - center.y);

    if (action === "diameter") {
      return measurementLine({ from: left, to: right, label: "d = 2r" });
    }

    if (action === "greatCircle" || action === "centralSection") {
      return (
        <g>
          <ellipse
            cx={center.x}
            cy={center.y}
            rx={radius}
            ry={radius * 0.28}
            fill="#facc15"
            opacity="0.22"
            stroke="#facc15"
            strokeWidth="5"
          />
          {measurementLabel({
            x: center.x,
            y: center.y - radius * 0.35,
            text: "círculo máximo",
          })}
        </g>
      );
    }

    return measurementLine({ from: center, to: right, label: "r" });
  }

  if (action === "spaceDiagonal") {
    return measurementLine({
      from: p({ x: -1.18, y: -1.18, z: -1.18 }),
      to: p({ x: 1.18, y: 1.18, z: 1.18 }),
      label: "D",
    });
  }

  if (action === "faceDiagonal" || action === "baseDiagonal") {
    return measurementLine({
      from: p({ x: -1.18, y: -1.18, z: -1.18 }),
      to: p({ x: 1.18, y: 1.18, z: -1.18 }),
      label: action === "faceDiagonal" ? "d_f" : "d_b",
    });
  }

  if (action === "height") {
    return measurementLine({
      from: p({ x: 1.55, y: -1.25, z: 0 }),
      to: p({ x: 1.55, y: 1.25, z: 0 }),
      label: "h",
    });
  }

  if (action === "radius") {
    return measurementLine({
      from: p({ x: 0, y: -1.2, z: 0 }),
      to: p({ x: 1.35, y: -1.2, z: 0 }),
      label: "r",
    });
  }

  if (action === "diameter") {
    return measurementLine({
      from: p({ x: -1.35, y: -1.2, z: 0 }),
      to: p({ x: 1.35, y: -1.2, z: 0 }),
      label: "2r",
    });
  }

  if (action === "apothem") {
    return measurementLine({
      from: p({ x: 0, y: -1.2, z: 0 }),
      to: p({ x: 0.68, y: -1.2, z: -0.72 }),
      label: "a_p",
    });
  }

  if (action === "circumradius") {
    return measurementLine({
      from: p({ x: 0, y: -1.2, z: 0 }),
      to: p({ x: 1.35, y: -1.2, z: 0 }),
      label: "R",
    });
  }

  if (action === "slant") {
    return measurementLine({
      from: p({ x: 0, y: 1.35, z: 0 }),
      to: p({ x: 1.35, y: -1.2, z: 0 }),
      label: "g",
    });
  }

  if (action === "axialSection") {
    const a = p({ x: -1.35, y: -1.25, z: 0 });
    const b = p({ x: 1.35, y: -1.25, z: 0 });
    const c = p({ x: 1.35, y: 1.25, z: 0 });
    const d = p({ x: -1.35, y: 1.25, z: 0 });

    if (type === "cone") {
      const apex = p({ x: 0, y: 1.35, z: 0 });

      return (
        <g>
          <path
            d={`M ${a.x} ${a.y} L ${b.x} ${b.y} L ${apex.x} ${apex.y} Z`}
            fill="#facc15"
            opacity="0.22"
            stroke="#facc15"
            strokeWidth="5"
          />
          {measurementLabel({
            x: (a.x + b.x + apex.x) / 3,
            y: (a.y + b.y + apex.y) / 3 - 20,
            text: "corte axial",
          })}
        </g>
      );
    }

    return (
      <g>
        <path
          d={`M ${a.x} ${a.y} L ${b.x} ${b.y} L ${c.x} ${c.y} L ${d.x} ${d.y} Z`}
          fill="#facc15"
          opacity="0.22"
          stroke="#facc15"
          strokeWidth="5"
        />
        {measurementLabel({
          x: (a.x + c.x) / 2,
          y: (a.y + c.y) / 2 - 20,
          text: "corte axial",
        })}
      </g>
    );
  }

  if (action === "faceArea" || action === "baseArea" || action === "lateralArea") {
    const a = p({ x: -1.18, y: -1.18, z: -1.18 });
    const b = p({ x: 1.18, y: -1.18, z: -1.18 });
    const c = p({ x: 1.18, y: 1.18, z: -1.18 });
    const d = p({ x: -1.18, y: 1.18, z: -1.18 });

    return (
      <g>
        <path
          d={`M ${a.x} ${a.y} L ${b.x} ${b.y} L ${c.x} ${c.y} L ${d.x} ${d.y} Z`}
          fill="#facc15"
          opacity="0.22"
          stroke="#facc15"
          strokeWidth="5"
        />
        {measurementLabel({
          x: (a.x + c.x) / 2,
          y: (a.y + c.y) / 2 - 20,
          text: "área",
        })}
      </g>
    );
  }

  return measurementLine({
    from: p({ x: -1.18, y: -1.18, z: -1.18 }),
    to: p({ x: 1.18, y: -1.18, z: -1.18 }),
    label: "aresta",
  });
}

export default function AdminSpatialGeometryPrototypePage() {
  const visualRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const menuDragStateRef = useRef<MenuDragState | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const [mode, setMode] = useState<SceneMode>("simple");
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("rotate");
  const [selectedSolid, setSelectedSolid] = useState<SolidType>("regularPrism");
  const [outerSolid, setOuterSolid] = useState<SolidType>("cylinder");
  const [innerSolid, setInnerSolid] = useState<SolidType>("regularPrism");
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget>("outer");
  const [selectedAction, setSelectedAction] = useState<GeometryActionId | null>(null);

  const [polygonSides, setPolygonSides] = useState(6);
  const [side, setSide] = useState(4);
  const [width, setWidth] = useState(6);
  const [depth, setDepth] = useState(3);
  const [height, setHeight] = useState(7);
  const [radius, setRadius] = useState(3);

  const [innerBaseScale, setInnerBaseScale] = useState(0.78);
  const [innerHeightScale, setInnerHeightScale] = useState(0.78);
  const [innerRadiusScale, setInnerRadiusScale] = useState(0.78);
  const [innerOffsetX, setInnerOffsetX] = useState(0);
  const [innerOffsetY, setInnerOffsetY] = useState(0);
  const [innerOffsetZ, setInnerOffsetZ] = useState(0);
  const [innerRotationX, setInnerRotationX] = useState(0);
  const [innerRotationY, setInnerRotationY] = useState(0);
  const [innerRotationZ, setInnerRotationZ] = useState(0);
  const [isDraggingScene, setIsDraggingScene] = useState(false);
  const [overlapQuality, setOverlapQuality] = useState<OverlapQuality>("fast");

  const [rotationX, setRotationX] = useState(18);
  const [rotationY, setRotationY] = useState(-28);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showInnerSolid, setShowInnerSolid] = useState(true);
  const [showFaces, setShowFaces] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showCenter, setShowCenter] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [floatingMenu, setFloatingMenu] = useState<FloatingMenu | null>(null);
  const [fullscreenMenuSection, setFullscreenMenuSection] =
    useState<FullscreenMenuSection>(null);
  const [activeAdjustment, setActiveAdjustment] = useState<AdjustmentTarget | null>(
    null
  );
  const [activeSmartCut, setActiveSmartCut] = useState<SmartCutId | null>("axial");
  const [showNet, setShowNet] = useState(false);
  const [netOpenAmount, setNetOpenAmount] = useState(0);
  const [measurementStart, setMeasurementStart] = useState<GeometryElement | null>(
    null
  );
  const [geometryMeasurements, setGeometryMeasurements] = useState<
    GeometryMeasurement[]
  >([]);

  useEffect(() => {
    if (!autoRotate || interactionMode !== "rotate") return;

    const intervalId = window.setInterval(() => {
      setRotationY((current) => {
        const next = current + 1.1;
        return next > 180 ? -180 : next;
      });
    }, 60);

    return () => window.clearInterval(intervalId);
  }, [autoRotate, interactionMode]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    return () => {
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isFullscreen]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setNetOpenAmount(showNet ? 1 : 0);
    }, 40);

    return () => window.clearTimeout(timeoutId);
  }, [showNet]);

  const activeSolid = mode === "simple" ? selectedSolid : outerSolid;
  const inspectedSolid =
    mode === "inscribed" && selectedTarget === "inner" ? innerSolid : activeSolid;

  const activeDefinition =
    SOLIDS.find((solid) => solid.type === activeSolid) ?? SOLIDS[0];

  const inspectedDefinition =
    SOLIDS.find((solid) => solid.type === inspectedSolid) ?? SOLIDS[0];

  const outerRenderScale = useMemo((): Vec3 => {
    if (activeSolid === "sphere") {
      const value = clamp(radius / 3, 0.25, 2.2);
      return { x: value, y: value, z: value };
    }

    if (activeSolid === "box") {
      return {
        x: clamp(width / 6, 0.25, 2.2),
        y: clamp(height / 7, 0.25, 2.2),
        z: clamp(depth / 3, 0.25, 2.2),
      };
    }

    if (activeSolid === "cube") {
      return {
        x: clamp(side / 4, 0.25, 2.2),
        y: clamp(height / 7, 0.25, 2.2),
        z: clamp(side / 4, 0.25, 2.2),
      };
    }

    if (activeSolid === "cylinder" || activeSolid === "cone") {
      const radialScale = clamp(radius / 3, 0.25, 2.2);
      return {
        x: radialScale,
        y: clamp(height / 7, 0.25, 2.2),
        z: radialScale,
      };
    }

    return {
      x: clamp(side / 4, 0.25, 2.2),
      y: clamp(height / 7, 0.25, 2.2),
      z: clamp(side / 4, 0.25, 2.2),
    };
  }, [activeSolid, depth, height, radius, side, width]);

  const innerRenderScale = useMemo((): Vec3 => {
    if (innerSolid === "sphere") {
      return {
        x: innerRadiusScale,
        y: innerRadiusScale,
        z: innerRadiusScale,
      };
    }

    if (innerSolid === "cylinder" || innerSolid === "cone") {
      return {
        x: innerRadiusScale,
        y: innerHeightScale,
        z: innerRadiusScale,
      };
    }

    return {
      x: innerBaseScale,
      y: innerHeightScale,
      z: innerBaseScale,
    };
  }, [innerBaseScale, innerHeightScale, innerRadiusScale, innerSolid]);

  const innerObjectRotation = useMemo(
    () => ({
      x: innerRotationX,
      y: innerRotationY,
      z: innerRotationZ,
    }),
    [innerRotationX, innerRotationY, innerRotationZ]
  );

  const overlapResolution =
    isDraggingScene ? 18 : overlapQuality === "precise" ? 48 : 30;

  const outerMetrics = useMemo(
    () =>
      getSolidMetrics({
        type: activeSolid,
        sides: polygonSides,
        side,
        width,
        depth,
        height,
        radius,
      }),
    [activeSolid, polygonSides, side, width, depth, height, radius]
  );

  const innerMetrics = useMemo(() => {
    const innerRadius = radius * innerRadiusScale;
    const innerHeight = height * innerHeightScale;

    const innerSide =
      outerSolid === "cylinder" && innerSolid === "regularPrism"
        ? 2 * innerRadius * Math.sin(Math.PI / polygonSides)
        : side * innerBaseScale;

    return getSolidMetrics({
      type: innerSolid,
      sides: polygonSides,
      side: innerSide,
      width: width * innerBaseScale,
      depth: depth * innerBaseScale,
      height: innerHeight,
      radius: innerRadius,
    });
  }, [
    innerSolid,
    outerSolid,
    polygonSides,
    side,
    width,
    depth,
    height,
    radius,
    innerBaseScale,
    innerHeightScale,
    innerRadiusScale,
  ]);

  const relationship = getInscribedRelationship({
    outerSolid,
    innerSolid,
    polygonSides,
    radius,
    side,
    height,
    innerScale: innerRadiusScale,
  });

  const overlapEstimate = useMemo(
    () =>
      mode === "inscribed"
        ? estimateSolidOverlap({
            outerSolid,
            innerSolid,
            sides: polygonSides,
            outerScale: outerRenderScale,
            innerScale: innerRenderScale,
            innerOffset: {
              x: innerOffsetX,
              y: innerOffsetY,
              z: innerOffsetZ,
            },
            innerRotation: innerObjectRotation,
            sampleResolution: overlapResolution,
            outerVolume: outerMetrics.volume,
            innerVolume: innerMetrics.volume,
          })
        : null,
    [
      mode,
      outerSolid,
      innerSolid,
      polygonSides,
      outerRenderScale,
      innerRenderScale,
      innerOffsetX,
      innerOffsetY,
      innerOffsetZ,
      innerObjectRotation,
      overlapResolution,
      outerMetrics.volume,
      innerMetrics.volume,
    ]
  );

  const occupiedVolume =
    mode === "inscribed"
      ? overlapEstimate?.intersectionVolume ?? innerMetrics.volume
      : 0;

  const unionVolume =
    mode === "inscribed"
      ? overlapEstimate?.unionVolume ?? outerMetrics.volume + innerMetrics.volume
      : 0;

  const innerOutsideVolume =
    mode === "inscribed" ? overlapEstimate?.innerOnlyVolume ?? 0 : 0;

  const outerOnlyVolume =
    mode === "inscribed" ? overlapEstimate?.outerOnlyVolume ?? outerMetrics.volume : 0;

  const occupation =
    mode === "inscribed"
      ? overlapEstimate?.occupiedPercent ?? 0
      : outerMetrics.volume > 0
        ? (innerMetrics.volume / outerMetrics.volume) * 100
        : 0;

  const emptyVolume =
    mode === "inscribed" ? outerOnlyVolume : 0;

  const currentClassicFit =
    CLASSIC_FIT_PRESETS.find(
      (preset) => preset.outer === outerSolid && preset.inner === innerSolid
    ) ?? null;

  const outerMesh = getMeshForSolid(activeSolid, polygonSides);
  const innerMesh = getMeshForSolid(innerSolid, polygonSides);

  const actions = getActionsForSolid(inspectedSolid);
  const inspectedMetrics =
    mode === "inscribed" && selectedTarget === "inner"
      ? innerMetrics
      : outerMetrics;
  const netBaseArea =
    inspectedMetrics.baseArea ??
    (inspectedSolid === "sphere" ? 0 : inspectedMetrics.totalArea / 6);
  const netLateralArea =
    inspectedMetrics.lateralArea ??
    Math.max(inspectedMetrics.totalArea - netBaseArea * 2, 0);

  const sceneObjects = [
    {
      id: "outer" as SelectedTarget,
      label: mode === "simple" ? activeDefinition.label : `Externo: ${activeDefinition.label}`,
      solid: activeSolid,
      metrics: outerMetrics,
      color: "Azul",
      visible: true,
    },
    ...(mode === "inscribed"
      ? [
          {
            id: "inner" as SelectedTarget,
            label: `Interno: ${
              SOLIDS.find((item) => item.type === innerSolid)?.label ?? "Sólido"
            }`,
            solid: innerSolid,
            metrics: innerMetrics,
            color: "Laranja",
            visible: showInnerSolid,
          },
        ]
      : []),
  ];

  const inspector = selectedAction
    ? getInspectorForAction({
        type: inspectedSolid,
        action: selectedAction,
        sides: polygonSides,
        side:
          mode === "inscribed" && selectedTarget === "inner"
            ? side * innerBaseScale
            : side,
        width:
          mode === "inscribed" && selectedTarget === "inner"
            ? width * innerBaseScale
            : width,
        depth:
          mode === "inscribed" && selectedTarget === "inner"
            ? depth * innerBaseScale
            : depth,
        height:
          mode === "inscribed" && selectedTarget === "inner"
            ? height * innerHeightScale
            : height,
        radius:
          mode === "inscribed" && selectedTarget === "inner"
            ? radius * innerRadiusScale
            : radius,
      })
    : null;

  const isCentered =
    Math.abs(innerOffsetX) < 0.05 &&
    Math.abs(innerOffsetY) < 0.05 &&
    Math.abs(innerOffsetZ) < 0.05;

  const exceedsSuggestedScale =
    innerBaseScale > 1 || innerHeightScale > 1 || innerRadiusScale > 1;

  function closeFloatingMenu() {
    setFloatingMenu(null);
    setFullscreenMenuSection(null);
    setActiveAdjustment(null);
  }

  function resetRotation() {
    setRotationX(18);
    setRotationY(-28);
    setAutoRotate(false);
  }

  function applyViewPreset(rotation: { rotationX: number; rotationY: number }) {
    setRotationX(rotation.rotationX);
    setRotationY(rotation.rotationY);
    setAutoRotate(false);
    closeFloatingMenu();
  }

  function centralizeInner() {
    setInnerOffsetX(0);
    setInnerOffsetY(0);
    setInnerOffsetZ(0);
  }

  function resetInnerRotation() {
    setInnerRotationX(0);
    setInnerRotationY(0);
    setInnerRotationZ(0);
  }

  function normalizeAngle(value: number) {
    const normalized = value % 360;
    return normalized < 0 ? normalized + 360 : normalized;
  }

  function rotateInnerBy(axis: "x" | "y" | "z", degrees: number) {
    if (axis === "x") {
      setInnerRotationX((current) => normalizeAngle(current + degrees));
      return;
    }

    if (axis === "y") {
      setInnerRotationY((current) => normalizeAngle(current + degrees));
      return;
    }

    setInnerRotationZ((current) => normalizeAngle(current + degrees));
  }

  function setAllInnerScales(value: number) {
    const safeValue = clamp(value, 0.2, 1.15);
    setInnerBaseScale(safeValue);
    setInnerHeightScale(safeValue);
    setInnerRadiusScale(safeValue);
  }

  function getClassicFitScale(outer: SolidType, inner: SolidType) {
    if (outer === "cube" && inner === "sphere") {
      return clamp(side / (2 * Math.max(radius, 0.1)), 0.2, 1.05);
    }

    if (outer === "sphere" && inner === "cube") {
      return clamp((2 * radius) / (Math.max(side, 0.1) * Math.sqrt(3)), 0.2, 1.05);
    }

    if (outer === "cylinder" && inner === "cone") {
      return 1;
    }

    if (outer === "cylinder" && inner === "regularPrism") {
      return 1;
    }

    return 0.78;
  }

  function applyClassicFit(preset: ClassicFitPreset) {
    setMode("inscribed");
    setOuterSolid(preset.outer);
    setInnerSolid(preset.inner);
    setPolygonSides(preset.sides);
    setInnerOffsetX(0);
    setInnerOffsetY(0);
    setInnerOffsetZ(0);
    resetInnerRotation();
    setAllInnerScales(getClassicFitScale(preset.outer, preset.inner));
    setSelectedTarget("inner");
    setInteractionMode("moveInner");
    setShowInnerSolid(true);
    setActiveAdjustment(null);
    setSelectedAction(null);
    closeFloatingMenu();
  }

  function fitCurrentSolids() {
    setMode("inscribed");
    setInnerOffsetX(0);
    setInnerOffsetY(0);
    setInnerOffsetZ(0);
    resetInnerRotation();
    setAllInnerScales(getClassicFitScale(outerSolid, innerSolid));
    setSelectedTarget("inner");
    setInteractionMode("moveInner");
    setShowInnerSolid(true);
    setActiveAdjustment(null);
    setSelectedAction(null);
    closeFloatingMenu();
  }

  function getSuggestedContainer(type: SolidType): SolidType {
    if (type === "sphere") return "cube";
    if (type === "cube" || type === "box") return "sphere";
    if (type === "cone" || type === "regularPrism") return "cylinder";
    if (type === "cylinder") return "box";
    return "cube";
  }

  function placeSelectedInsideAnother() {
    const solidToPlace =
      mode === "inscribed" && selectedTarget === "inner"
        ? innerSolid
        : mode === "simple"
          ? selectedSolid
          : outerSolid;

    const suggestedContainer = getSuggestedContainer(solidToPlace);

    setMode("inscribed");
    setOuterSolid(suggestedContainer);
    setInnerSolid(solidToPlace);
    setPolygonSides(solidToPlace === "regularPrism" ? 6 : polygonSides);
    setInnerOffsetX(0);
    setInnerOffsetY(0);
    setInnerOffsetZ(0);
    resetInnerRotation();
    setAllInnerScales(getClassicFitScale(suggestedContainer, solidToPlace));
    setSelectedTarget("inner");
    setInteractionMode("moveInner");
    setShowInnerSolid(true);
    setActiveAdjustment(null);
    setSelectedAction(null);
    closeFloatingMenu();
  }

  function clearSelection() {
    setSelectedAction(null);
  }

  function applySmartCut(cut: SmartCutId) {
    setActiveSmartCut(cut);

    if (cut === "axial") {
      setSelectedAction("axialSection");
      return;
    }

    if (cut === "central") {
      setSelectedAction(inspectedSolid === "sphere" ? "greatCircle" : "centralSection");
      return;
    }

    if (cut === "diagonal") {
      setSelectedAction(
        inspectedSolid === "cube" || inspectedSolid === "box"
          ? "spaceDiagonal"
          : "baseDiagonal"
      );
      return;
    }

    setSelectedAction("baseArea");
  }

  const isAdjustingInner =
    mode === "inscribed" && selectedTarget === "inner";

  const adjustmentDetails = activeAdjustment
    ? {
        base: {
          label: isAdjustingInner ? "Escala da base interna" : "Aresta/base",
          value: isAdjustingInner ? innerBaseScale : side,
          min: isAdjustingInner ? 0.2 : 1,
          max: isAdjustingInner ? 1.05 : 20,
          step: isAdjustingInner ? 0.01 : 0.5,
          suffix: isAdjustingInner ? "%" : "u",
        },
        height: {
          label: isAdjustingInner ? "Escala da altura interna" : "Altura",
          value: isAdjustingInner ? innerHeightScale : height,
          min: isAdjustingInner ? 0.2 : 1,
          max: isAdjustingInner ? 1.05 : 24,
          step: isAdjustingInner ? 0.01 : 0.5,
          suffix: isAdjustingInner ? "%" : "u",
        },
        radius: {
          label: isAdjustingInner ? "Escala do raio interno" : "Raio",
          value: isAdjustingInner ? innerRadiusScale : radius,
          min: isAdjustingInner ? 0.2 : 1,
          max: isAdjustingInner ? 1.05 : 16,
          step: isAdjustingInner ? 0.01 : 0.5,
          suffix: isAdjustingInner ? "%" : "u",
        },
      }[activeAdjustment]
    : null;

  function setAdjustmentValue(target: AdjustmentTarget, value: number) {
    if (isAdjustingInner) {
      const safeValue = clamp(value, 0.2, 1.15);

      if (target === "base") {
        setInnerBaseScale(safeValue);
        return;
      }

      if (target === "height") {
        setInnerHeightScale(safeValue);
        return;
      }

      setInnerRadiusScale(safeValue);
      return;
    }

    if (target === "base") {
      const safeValue = clamp(value, 1, 20);

      if (activeSolid === "cylinder" || activeSolid === "cone" || activeSolid === "sphere") {
        setRadius(clamp(value, 1, 16));
        return;
      }

      setSide(safeValue);
      setWidth(safeValue);
      setDepth(safeValue);
      return;
    }

    if (target === "height") {
      setHeight(clamp(value, 1, 24));
      return;
    }

    setRadius(clamp(value, 1, 16));
  }

  function nudgeAdjustment(target: AdjustmentTarget, delta: number) {
    const current =
      isAdjustingInner
        ? target === "base"
          ? innerBaseScale
          : target === "height"
            ? innerHeightScale
            : innerRadiusScale
        : target === "base"
          ? side
          : target === "height"
            ? height
            : radius;

    setAdjustmentValue(
      target,
      current + delta
    );
  }

  function getMenuPosition(clientX: number, clientY: number) {
    const rect = visualRef.current?.getBoundingClientRect();

    if (!rect) {
      return { x: 24, y: 24 };
    }

    return {
      x: clamp(clientX - rect.left, 12, Math.max(rect.width - 292, 12)),
      y: clamp(clientY - rect.top, 12, Math.max(rect.height - 360, 12)),
    };
  }

  function startMenuDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!floatingMenu) return;

    event.preventDefault();
    event.stopPropagation();

    menuDragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startMenuX: floatingMenu.x,
      startMenuY: floatingMenu.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveFloatingMenu(event: React.PointerEvent<HTMLDivElement>) {
    const dragState = menuDragStateRef.current;

    if (!dragState || !floatingMenu) return;

    const rect = visualRef.current?.getBoundingClientRect();
    const maxX = Math.max((rect?.width ?? 420) - 340, 12);
    const maxY = Math.max((rect?.height ?? 520) - 220, 12);

    setFloatingMenu({
      ...floatingMenu,
      x: clamp(dragState.startMenuX + event.clientX - dragState.startX, 12, maxX),
      y: clamp(dragState.startMenuY + event.clientY - dragState.startY, 12, maxY),
    });
  }

  function stopMenuDrag(event: React.PointerEvent<HTMLDivElement>) {
    menuDragStateRef.current = null;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // A captura pode ter sido liberada pelo navegador.
    }
  }

  function openSolidMenu(target: SelectedTarget, event: React.MouseEvent) {
    const position = getMenuPosition(event.clientX, event.clientY);

    setSelectedTarget(target);
    setActiveAdjustment(null);
    setFullscreenMenuSection(null);
    setFloatingMenu({ kind: "solid", target, ...position });
  }

  function handleElementClick(element: GeometryElement) {
    setSelectedTarget(element.target);
    setSelectedAction(null);

    if (!measurementStart) return;

    const sameElement =
      measurementStart.target === element.target &&
      measurementStart.kind === element.kind &&
      measurementStart.index === element.index;

    if (sameElement) return;

    const distance = distanceBetweenPoints(
      measurementStart.worldPoint,
      element.worldPoint
    );

    setGeometryMeasurements((current) => [
      ...current.slice(-4),
      {
        id: `${Date.now()}-${measurementStart.target}-${measurementStart.kind}-${element.target}-${element.kind}`,
        from: measurementStart,
        to: element,
        distance,
      },
    ]);
    setMeasurementStart(null);
    closeFloatingMenu();
  }

  function openElementMenu(
    target: SelectedTarget,
    element: Omit<GeometryElement, "target">,
    event: React.MouseEvent
  ) {
    const position = getMenuPosition(event.clientX, event.clientY);
    const fullElement = buildGeometryElement({
      ...element,
      target,
    });

    setSelectedTarget(target);
    setActiveAdjustment(null);
    setFullscreenMenuSection(null);
    setFloatingMenu({ kind: "element", element: fullElement, ...position });
  }

  function prepareElementMenuOnTouch(
    target: SelectedTarget,
    element: Omit<GeometryElement, "target">,
    event: React.PointerEvent
  ) {
    if (event.pointerType === "mouse") return;

    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      const position = getMenuPosition(event.clientX, event.clientY);
      const fullElement = buildGeometryElement({
        ...element,
        target,
      });
      setSelectedTarget(target);
      setActiveAdjustment(null);
      setFullscreenMenuSection(null);
      setFloatingMenu({ kind: "element", element: fullElement, ...position });
    }, 560);
  }

  function startMeasurementFrom(element: GeometryElement) {
    setMeasurementStart(element);
    setFloatingMenu(null);
    setFullscreenMenuSection(null);
  }

  function highlightElement(element: GeometryElement) {
    setSelectedTarget(element.target);

    if (element.kind === "face") {
      setSelectedAction("faceArea");
      closeFloatingMenu();
      return;
    }

    if (element.kind === "edge") {
      setSelectedAction("edge");
      closeFloatingMenu();
      return;
    }

    setShowCenter(true);
    closeFloatingMenu();
  }

  function prepareSolidMenuOnTouch(
    target: SelectedTarget,
    event: React.PointerEvent
  ) {
    if (event.pointerType === "mouse") return;

    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      const position = getMenuPosition(event.clientX, event.clientY);
      setSelectedTarget(target);
      setActiveAdjustment(null);
      setFullscreenMenuSection(null);
      setFloatingMenu({ kind: "solid", target, ...position });
    }, 560);
  }

  function openBackgroundMenu(clientX: number, clientY: number) {
    const position = getMenuPosition(clientX, clientY);
    setActiveAdjustment(null);
    setFullscreenMenuSection(null);
    setFloatingMenu({ kind: "background", ...position });
  }

  function cancelLongPress() {
    if (!longPressTimerRef.current) return;

    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }

  function addSolidToScene(type: SolidType) {
    if (mode === "simple") {
      setOuterSolid(selectedSolid);
    }

    setMode("inscribed");
    setInnerSolid(type);
    setShowInnerSolid(true);
    setSelectedTarget("inner");
    setInteractionMode("moveInner");
    setInnerOffsetX(0);
    setInnerOffsetY(0);
    setInnerOffsetZ(0);
    resetInnerRotation();
    setAllInnerScales(0.72);
    setActiveAdjustment(null);
    clearSelection();
    closeFloatingMenu();
  }

  function replaceSelectedSolid(type: SolidType) {
    if (mode === "inscribed" && selectedTarget === "inner") {
      setInnerSolid(type);
    } else if (mode === "simple") {
      setSelectedSolid(type);
    } else {
      setOuterSolid(type);
    }

    clearSelection();
    setActiveAdjustment(null);
    closeFloatingMenu();
  }

  function adjustSelectedSolid(action: "volume" | "area") {
    if (action === "volume") {
      setSelectedAction("volume");
      setActiveAdjustment(null);
      closeFloatingMenu();
      return;
    }

    if (action === "area") {
      const areaAction =
        actions.find((item) => item.id === "totalArea") ??
        actions.find((item) => item.id === "baseArea") ??
        actions.find((item) => item.id === "faceArea") ??
        actions.find((item) => item.id === "lateralArea");

      setSelectedAction(areaAction?.id ?? "volume");
      setActiveAdjustment(null);
      closeFloatingMenu();
      return;
    }
  }

  function applyPreset(preset: (typeof INSCRIBED_PRESETS)[number]) {
    setMode("inscribed");
    setOuterSolid(preset.outer);
    setInnerSolid(preset.inner);
    setPolygonSides(preset.sides);
    setInnerOffsetX(0);
    setInnerOffsetY(0);
    setInnerOffsetZ(0);
    resetInnerRotation();
    setAllInnerScales(getClassicFitScale(preset.outer, preset.inner));
    setSelectedTarget("inner");
    setInteractionMode("moveInner");
    setShowInnerSolid(true);
    setActiveAdjustment(null);
    setSelectedAction(null);
    setFullscreenMenuSection(null);
  }

  function selectGeometry(target: SelectedTarget) {
    setSelectedTarget(target);
    setSelectedAction(null);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;

    setAutoRotate(false);
    closeFloatingMenu();
    setIsDraggingScene(true);

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startRotationX: rotationX,
      startRotationY: rotationY,
      startInnerRotationX: innerRotationX,
      startInnerRotationY: innerRotationY,
      startInnerOffsetX: innerOffsetX,
      startInnerOffsetY: innerOffsetY,
      moved: false,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState) return;

    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      dragState.moved = true;
      cancelLongPress();
    }

    if (interactionMode === "moveInner" && mode === "inscribed") {
      setInnerOffsetX(clamp(dragState.startInnerOffsetX + dx / 160, -1.2, 1.2));
      setInnerOffsetY(clamp(dragState.startInnerOffsetY - dy / 160, -1.2, 1.2));
      return;
    }

    if (interactionMode === "rotateInner" && mode === "inscribed") {
      setInnerRotationY(normalizeAngle(dragState.startInnerRotationY + dx * 0.72));
      setInnerRotationX(normalizeAngle(dragState.startInnerRotationX - dy * 0.72));
      return;
    }

    setRotationY(
      clamp(dragState.startRotationY + dx * 0.42, -180, 180)
    );
    setRotationX(
      clamp(dragState.startRotationX - dy * 0.28, -80, 80)
    );
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    dragStateRef.current = null;
    setIsDraggingScene(false);
    cancelLongPress();

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // O navegador pode liberar a captura antes do evento final.
    }
  }

  const overlayTarget =
    mode === "inscribed" && selectedTarget === "inner"
      ? {
          type: innerSolid,
          scale: innerRenderScale,
          offset: {
            x: innerOffsetX,
            y: innerOffsetY,
            z: innerOffsetZ,
          },
          objectRotation: innerObjectRotation,
        }
      : {
          type: activeSolid,
          scale: outerRenderScale,
          offset: { x: 0, y: 0, z: 0 },
          objectRotation: { x: 0, y: 0, z: 0 },
        };

  function renderFullscreenMenuHeader(title: string, subtitle: string) {
    return (
      <div
        className="mb-3 flex touch-none cursor-move items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/10 p-3"
        onPointerDown={startMenuDrag}
        onPointerMove={moveFloatingMenu}
        onPointerUp={stopMenuDrag}
        onPointerCancel={stopMenuDrag}
      >
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-cyan-200">
            {title}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">
            {subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={closeFloatingMenu}
          className="rounded-full border border-white/10 px-2 py-1 text-xs font-bold text-slate-300 hover:bg-white/10"
        >
          fechar
        </button>
      </div>
    );
  }

  function fullscreenMenuButton({
    label,
    description,
    tone = "slate",
    onClick,
  }: {
    label: string;
    description?: string;
    tone?: "slate" | "cyan" | "emerald" | "violet" | "amber" | "orange";
    onClick: () => void;
  }) {
    const toneClass = {
      slate: "border-white/10 bg-white/10 text-white hover:bg-white/15",
      cyan: "border-cyan-300/25 bg-cyan-400/15 text-cyan-50 hover:bg-cyan-400/25",
      emerald:
        "border-emerald-300/25 bg-emerald-400/15 text-emerald-50 hover:bg-emerald-400/25",
      violet:
        "border-violet-300/25 bg-violet-400/15 text-violet-50 hover:bg-violet-400/25",
      amber:
        "border-amber-300/25 bg-amber-400/15 text-amber-50 hover:bg-amber-400/25",
      orange:
        "border-orange-300/25 bg-orange-400/15 text-orange-50 hover:bg-orange-400/25",
    }[tone];

    return (
      <button
        type="button"
        onClick={onClick}
        className={`rounded-2xl border px-3 py-3 text-left shadow-sm transition ${toneClass}`}
      >
        <p className="text-sm font-black">{label}</p>
        {description ? (
          <p className="mt-1 text-[11px] font-semibold leading-4 opacity-75">
            {description}
          </p>
        ) : null}
      </button>
    );
  }

  function renderFullscreenBackButton() {
    return (
      <button
        type="button"
        onClick={() => {
          setFullscreenMenuSection(null);
          setActiveAdjustment(null);
        }}
        className="mb-3 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-slate-200 hover:bg-white/15"
      >
        voltar para categorias
      </button>
    );
  }

  function renderFullscreenBackgroundMenu() {
    if (!fullscreenMenuSection) {
      return (
        <>
          {renderFullscreenMenuHeader(
            "Menu rápido",
            "Escolha uma categoria. As opções detalhadas aparecem só depois."
          )}
          <div className="grid grid-cols-2 gap-2">
            {fullscreenMenuButton({
              label: "Adicionar",
              description: "Colocar sólido interno",
              tone: "cyan",
              onClick: () => setFullscreenMenuSection("add"),
            })}
            {fullscreenMenuButton({
              label: "Cenas",
              description: "Encaixes clássicos",
              tone: "emerald",
              onClick: () => setFullscreenMenuSection("scenes"),
            })}
            {fullscreenMenuButton({
              label: "Aula",
              description: "Apresentação limpa",
              tone: "violet",
              onClick: () => setFullscreenMenuSection("teach"),
            })}
            {fullscreenMenuButton({
              label: "Medidas",
              description: "Interseção e planificação",
              tone: "amber",
              onClick: () => setFullscreenMenuSection("measure"),
            })}
          </div>
        </>
      );
    }

    if (fullscreenMenuSection === "add") {
      return (
        <>
          {renderFullscreenMenuHeader("Adicionar sólido", "Escolha a forma que entra como sólido interno.")}
          {renderFullscreenBackButton()}
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ADD_SOLIDS.map((solidType) =>
              fullscreenMenuButton({
                label: SOLIDS.find((solid) => solid.type === solidType)?.shortLabel ?? solidType,
                description: SOLIDS.find((solid) => solid.type === solidType)?.label,
                tone: "cyan",
                onClick: () => addSolidToScene(solidType),
              })
            )}
          </div>
        </>
      );
    }

    if (fullscreenMenuSection === "scenes") {
      return (
        <>
          {renderFullscreenMenuHeader("Cenas prontas", "Abra uma situação clássica para explicar em aula.")}
          {renderFullscreenBackButton()}
          <div className="grid gap-2">
            {CLASSIC_FIT_PRESETS.map((preset) =>
              fullscreenMenuButton({
                label: preset.label,
                description: preset.description,
                tone: "emerald",
                onClick: () => applyClassicFit(preset),
              })
            )}
          </div>
        </>
      );
    }

    if (fullscreenMenuSection === "teach") {
      return (
        <>
          {renderFullscreenMenuHeader("Ferramentas de aula", "Controle o que aparece durante a explicação.")}
          {renderFullscreenBackButton()}
          <div className="grid grid-cols-2 gap-2">
            {fullscreenMenuButton({
              label: showFaces ? "Ocultar faces" : "Mostrar faces",
              tone: "violet",
              onClick: () => setShowFaces((current) => !current),
            })}
            {fullscreenMenuButton({
              label: showAxes ? "Ocultar eixos" : "Mostrar eixos",
              tone: "violet",
              onClick: () => setShowAxes((current) => !current),
            })}
            {fullscreenMenuButton({
              label: showGrid ? "Ocultar grade" : "Mostrar grade",
              tone: "violet",
              onClick: () => setShowGrid((current) => !current),
            })}
            {fullscreenMenuButton({
              label: showCenter ? "Ocultar centros" : "Mostrar centros",
              tone: "violet",
              onClick: () => setShowCenter((current) => !current),
            })}
          </div>
        </>
      );
    }

    return (
      <>
        {renderFullscreenMenuHeader("Medidas rápidas", "Ative recursos de explicação matemática.")}
        {renderFullscreenBackButton()}
        <div className="grid grid-cols-2 gap-2">
          {fullscreenMenuButton({
            label: showNet ? "Fechar planificação" : "Planificação",
            description: "Abrir sólido em faces",
            tone: "amber",
            onClick: () => setShowNet((current) => !current),
          })}
          {fullscreenMenuButton({
            label: overlapQuality === "precise" ? "Precisão rápida" : "Precisão alta",
            description: `${overlapEstimate?.sampleResolution ?? overlapResolution}³ pontos`,
            tone: "amber",
            onClick: () =>
              setOverlapQuality((current) =>
                current === "precise" ? "fast" : "precise"
              ),
          })}
          {fullscreenMenuButton({
            label: "Corte axial",
            tone: "amber",
            onClick: () => applySmartCut("axial"),
          })}
          {fullscreenMenuButton({
            label: "Corte central",
            tone: "amber",
            onClick: () => applySmartCut("central"),
          })}
        </div>
      </>
    );
  }

  function renderFullscreenSolidMenu(target: SelectedTarget) {
    const targetLabel = target === "inner" ? "Sólido interno" : "Sólido externo";

    if (!fullscreenMenuSection) {
      return (
        <>
          {renderFullscreenMenuHeader(
            targetLabel,
            "Escolha o tipo de edição. Os controles detalhados aparecem depois."
          )}
          <div className="grid grid-cols-2 gap-2">
            {fullscreenMenuButton({
              label: "Editar",
              description: "Aresta, altura, raio",
              tone: "cyan",
              onClick: () => setFullscreenMenuSection("edit"),
            })}
            {fullscreenMenuButton({
              label: "Mover / girar",
              description: target === "inner" ? "Posição e rotação" : "Girar cena",
              tone: "violet",
              onClick: () => setFullscreenMenuSection("transform"),
            })}
            {fullscreenMenuButton({
              label: "Fórmulas",
              description: "Volume, área e cortes",
              tone: "amber",
              onClick: () => setFullscreenMenuSection("formula"),
            })}
            {fullscreenMenuButton({
              label: "Visual",
              description: "Mostrar, ocultar, trocar",
              tone: "emerald",
              onClick: () => setFullscreenMenuSection("display"),
            })}
          </div>
        </>
      );
    }

    if (fullscreenMenuSection === "edit") {
      return (
        <>
          {renderFullscreenMenuHeader("Editar medidas", "Ajuste uma dimensão por vez.")}
          {renderFullscreenBackButton()}
          <div className="grid grid-cols-3 gap-2">
            {fullscreenMenuButton({
              label: "Base",
              tone: activeAdjustment === "base" ? "cyan" : "slate",
              onClick: () => setActiveAdjustment("base"),
            })}
            {fullscreenMenuButton({
              label: "Altura",
              tone: activeAdjustment === "height" ? "cyan" : "slate",
              onClick: () => setActiveAdjustment("height"),
            })}
            {fullscreenMenuButton({
              label: "Raio",
              tone: activeAdjustment === "radius" ? "cyan" : "slate",
              onClick: () => setActiveAdjustment("radius"),
            })}
          </div>

          {activeAdjustment && adjustmentDetails ? (
            <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wide text-cyan-100">
                <span>{adjustmentDetails.label}</span>
                <span>
                  {adjustmentDetails.suffix === "%"
                    ? `${formatNumber(adjustmentDetails.value * 100)}%`
                    : `${formatNumber(adjustmentDetails.value)} ${adjustmentDetails.suffix}`}
                </span>
              </div>
              <input
                type="range"
                min={adjustmentDetails.min}
                max={adjustmentDetails.max}
                step={adjustmentDetails.step}
                value={adjustmentDetails.value}
                onChange={(event) =>
                  setAdjustmentValue(activeAdjustment, Number(event.target.value))
                }
                className="w-full accent-cyan-300"
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                {fullscreenMenuButton({
                  label: "Diminuir",
                  onClick: () =>
                    nudgeAdjustment(activeAdjustment, isAdjustingInner ? -0.03 : -0.5),
                })}
                {fullscreenMenuButton({
                  label: "Aumentar",
                  onClick: () =>
                    nudgeAdjustment(activeAdjustment, isAdjustingInner ? 0.03 : 0.5),
                })}
              </div>
            </div>
          ) : null}
        </>
      );
    }

    if (fullscreenMenuSection === "transform") {
      return (
        <>
          {renderFullscreenMenuHeader("Mover / girar", "Controle a manipulação direta do objeto.")}
          {renderFullscreenBackButton()}
          <div className="grid grid-cols-2 gap-2">
            {fullscreenMenuButton({
              label: "Girar cena",
              tone: interactionMode === "rotate" ? "violet" : "slate",
              onClick: () => setInteractionMode("rotate"),
            })}
            {fullscreenMenuButton({
              label: "Mover interno",
              tone: interactionMode === "moveInner" ? "violet" : "slate",
              onClick: () => {
                setMode("inscribed");
                setSelectedTarget("inner");
                setInteractionMode("moveInner");
              },
            })}
            {fullscreenMenuButton({
              label: "Rotacionar interno",
              tone: interactionMode === "rotateInner" ? "violet" : "slate",
              onClick: () => {
                setMode("inscribed");
                setSelectedTarget("inner");
                setInteractionMode("rotateInner");
              },
            })}
            {fullscreenMenuButton({
              label: "Centralizar",
              onClick: centralizeInner,
            })}
          </div>

          {target === "inner" ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[90, 180, 360].map((degrees) =>
                fullscreenMenuButton({
                  label: `+${degrees}°`,
                  tone: "violet",
                  onClick: () => rotateInnerBy("y", degrees),
                })
              )}
            </div>
          ) : null}
        </>
      );
    }

    if (fullscreenMenuSection === "formula") {
      return (
        <>
          {renderFullscreenMenuHeader("Fórmulas e medidas", "Escolha o que destacar no desenho.")}
          {renderFullscreenBackButton()}
          <div className="grid grid-cols-2 gap-2">
            {fullscreenMenuButton({
              label: "Volume",
              tone: "amber",
              onClick: () => adjustSelectedSolid("volume"),
            })}
            {fullscreenMenuButton({
              label: "Área total",
              tone: "amber",
              onClick: () => adjustSelectedSolid("area"),
            })}
            {fullscreenMenuButton({
              label: "Corte axial",
              tone: "amber",
              onClick: () => applySmartCut("axial"),
            })}
            {fullscreenMenuButton({
              label: "Corte diagonal",
              tone: "amber",
              onClick: () => applySmartCut("diagonal"),
            })}
          </div>
        </>
      );
    }

    return (
      <>
        {renderFullscreenMenuHeader("Visual do sólido", "Mostrar, ocultar, trocar ou encaixar.")}
        {renderFullscreenBackButton()}
        <div className="grid grid-cols-2 gap-2">
          {fullscreenMenuButton({
            label: showFaces ? "Ocultar faces" : "Mostrar faces",
            tone: "emerald",
            onClick: () => setShowFaces((current) => !current),
          })}
          {fullscreenMenuButton({
            label: showInnerSolid ? "Ocultar interno" : "Mostrar interno",
            tone: "emerald",
            onClick: () => setShowInnerSolid((current) => !current),
          })}
          {fullscreenMenuButton({
            label: "Encaixar",
            tone: "emerald",
            onClick: fitCurrentSolids,
          })}
          {fullscreenMenuButton({
            label: "Dentro de outro",
            tone: "emerald",
            onClick: placeSelectedInsideAnother,
          })}
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {QUICK_ADD_SOLIDS.map((solidType) =>
            fullscreenMenuButton({
              label: SOLIDS.find((solid) => solid.type === solidType)?.shortLabel ?? solidType,
              tone: "slate",
              onClick: () => replaceSelectedSolid(solidType),
            })
          )}
        </div>
      </>
    );
  }

  function renderElementMenu(element: GeometryElement) {
    const targetLabel = element.target === "inner" ? "interno" : "externo";

    return (
      <>
        {renderFullscreenMenuHeader(
          `${element.label} do sólido ${targetLabel}`,
          "Escolha uma ação geométrica para esta parte específica."
        )}

        <div className="grid grid-cols-2 gap-2">
          {fullscreenMenuButton({
            label: "Medir até...",
            description: "Toque em outra face, aresta ou vértice",
            tone: "cyan",
            onClick: () => startMeasurementFrom(element),
          })}
          {fullscreenMenuButton({
            label: "Destacar",
            description:
              element.kind === "face"
                ? "Mostrar área da face"
                : element.kind === "edge"
                  ? "Destacar aresta"
                  : "Marcar vértice",
            tone: "amber",
            onClick: () => highlightElement(element),
          })}
          {fullscreenMenuButton({
            label: "Corte daqui",
            description: "Usar como referência de seção",
            tone: "violet",
            onClick: () => {
              applySmartCut(element.kind === "face" ? "base" : "diagonal");
              closeFloatingMenu();
            },
          })}
          {fullscreenMenuButton({
            label: "Limpar medidas",
            description: "Remover linhas criadas",
            tone: "slate",
            onClick: () => {
              setGeometryMeasurements([]);
              setMeasurementStart(null);
              closeFloatingMenu();
            },
          })}
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/10 p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-300">
            Ponto de referência
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            A medição usa o centro da face, o ponto médio da aresta ou o próprio
            vértice. Depois podemos evoluir para distância mínima real entre
            face/aresta.
          </p>
        </div>
      </>
    );
  }

  function renderGeometryMeasurement(measurement: GeometryMeasurement) {
    const from = projectPoint(measurement.from.worldPoint, rotationX, rotationY);
    const to = projectPoint(measurement.to.worldPoint, rotationX, rotationY);
    const middle = {
      x: (from.x + to.x) / 2,
      y: (from.y + to.y) / 2,
    };

    return (
      <g key={measurement.id} pointerEvents="none">
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="#22d3ee"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.28"
        />
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="#facc15"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="10 8"
        />
        <circle cx={from.x} cy={from.y} r="8" fill="#22d3ee" />
        <circle cx={to.x} cy={to.y} r="8" fill="#facc15" />
        {measurementLabel({
          x: middle.x,
          y: middle.y - 20,
          text: `d = ${formatNumber(measurement.distance)} u`,
        })}
      </g>
    );
  }

  function renderMeasurementStartMarker() {
    if (!measurementStart) return null;

    const point = projectPoint(measurementStart.worldPoint, rotationX, rotationY);

    return (
      <g pointerEvents="none">
        <circle
          cx={point.x}
          cy={point.y}
          r="18"
          fill="#22d3ee"
          opacity="0.24"
          stroke="#67e8f9"
          strokeWidth="3"
        />
        {measurementLabel({
          x: point.x,
          y: point.y - 28,
          text: "origem da medida",
        })}
      </g>
    );
  }

  return (
    <AdminGuard allowedRoles={["admin"]}>
      <AdminLayout
        title="Simulador de Geometria Espacial"
        subtitle="Laboratório 3D para sólidos, volumes, áreas, cortes e relações de inscrição."
      >
        <div
          className={
            isFullscreen
              ? "fixed inset-0 z-[9999] h-screen select-none overflow-hidden bg-slate-950"
              : "select-none"
          }
          onDoubleClick={(event) => {
            event.preventDefault();
          }}
        >
          {isFullscreen ? (
            <div className="absolute left-3 right-3 top-3 z-40 flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/90 px-3 py-3 shadow-2xl backdrop-blur lg:flex-row lg:items-center lg:justify-between lg:px-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                  Modo tela cheia
                </p>
                <h2 className="text-lg font-black text-slate-900">
                  Laboratório de Geometria Espacial
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={interactionMode === "rotate" ? "default" : "outline"}
                  onClick={() => setInteractionMode("rotate")}
                  className="rounded-2xl"
                >
                  Girar
                </Button>

                <Button
                  type="button"
                  variant={interactionMode === "moveInner" ? "default" : "outline"}
                  onClick={() => {
                    setMode("inscribed");
                    setInteractionMode("moveInner");
                    setSelectedTarget("inner");
                  }}
                  className="rounded-2xl"
                >
                  Mover interno
                </Button>

                <Button
                  type="button"
                  variant={interactionMode === "rotateInner" ? "default" : "outline"}
                  onClick={() => {
                    setMode("inscribed");
                    setInteractionMode("rotateInner");
                    setSelectedTarget("inner");
                  }}
                  className="rounded-2xl"
                >
                  Rotacionar interno
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const rect = visualRef.current?.getBoundingClientRect();
                    openBackgroundMenu(
                      (rect?.left ?? 0) + 80,
                      (rect?.top ?? 0) + 150
                    );
                  }}
                  className="rounded-2xl"
                >
                  Adicionar
                </Button>

                {VIEW_PRESETS.map((view) => (
                  <Button
                    key={view.label}
                    type="button"
                    variant="outline"
                    onClick={() => applyViewPreset(view)}
                    className="rounded-2xl"
                  >
                    {view.label}
                  </Button>
                ))}

                <Button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="gap-2 rounded-2xl"
                >
                  <Minimize2 className="h-4 w-4" />
                  Modo compacto
                </Button>
              </div>
            </div>
          ) : null}

        <div
          className={
            isFullscreen
              ? "relative h-screen overflow-hidden p-0"
              : "grid gap-6 xl:grid-cols-[1.25fr_0.75fr]"
          }
        >
          <Card
            className={`overflow-hidden border-slate-200 bg-white ${
              isFullscreen
                ? "h-full min-h-0 rounded-none border-0 bg-transparent shadow-none"
                : ""
            }`}
          >
            <div
              className={`border-b border-slate-100 p-5 ${
                isFullscreen ? "hidden" : ""
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                    <Box className="h-4 w-4" />
                    Visualização 3D didática
                  </div>

                  <h2 className="mt-1 text-2xl font-black text-slate-900">
                    {mode === "simple"
                      ? activeDefinition.label
                      : `${
                          SOLIDS.find((item) => item.type === innerSolid)?.label
                        } dentro de ${
                          SOLIDS.find((item) => item.type === outerSolid)?.label
                        }`}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {mode === "simple"
                      ? activeDefinition.description
                      : relationship.text}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={mode === "simple" ? "default" : "outline"}
                    className="rounded-2xl"
                    onClick={() => {
                      setMode("simple");
                      setInteractionMode("rotate");
                      setSelectedTarget("outer");
                      clearSelection();
                    }}
                  >
                    Sólido simples
                  </Button>

                  <Button
                    type="button"
                    variant={mode === "inscribed" ? "default" : "outline"}
                    className="rounded-2xl"
                    onClick={() => {
                      setMode("inscribed");
                      setSelectedTarget("inner");
                      clearSelection();
                    }}
                  >
                    Sólido inscrito
                  </Button>
                </div>
              </div>
            </div>

            <div
              ref={visualRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onMouseDown={(event) => {
                if (event.detail > 1) event.preventDefault();
              }}
              className={`relative select-none touch-none overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 ${
                isFullscreen ? "h-screen min-h-screen" : "min-h-[860px]"
              } ${
                interactionMode === "moveInner" && mode === "inscribed"
                  ? "cursor-move"
                  : interactionMode === "rotateInner" && mode === "inscribed"
                    ? "cursor-grab active:cursor-grabbing"
                  : "cursor-grab active:cursor-grabbing"
              }`}
            >
              <div className="absolute left-6 top-6 z-20 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200">
                  Volume externo
                </p>
                <p className="mt-1 text-2xl font-black">
                  {formatNumber(outerMetrics.volume)} u³
                </p>
              </div>

              <div className="absolute right-6 top-6 z-20 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white backdrop-blur">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-200">
                  <MousePointerClick className="h-4 w-4" />
                  Interação direta
                </p>
                <p className="mt-1 max-w-[260px] text-xs leading-5 text-slate-200">
                  Arraste para girar. Clique no sólido para escolher diagonal,
                  raio, altura, corte, volume e outras medidas.
                </p>
              </div>

              {mode === "inscribed" ? (
                <div className="absolute bottom-6 left-6 z-20 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-200">
                    Interseção visual
                  </p>
                  <p className="mt-1 text-xl font-black">
                    {formatNumber(occupiedVolume)} u³
                  </p>
                  <p className="mt-1 text-xs font-semibold text-orange-100">
                    {overlapEstimate?.state ?? "calculando"} · {formatNumber(occupation)}%
                    do externo
                  </p>
                </div>
              ) : null}

              {measurementStart ? (
                <div className="absolute left-1/2 top-28 z-30 w-[min(520px,calc(100vw_-_32px))] -translate-x-1/2 rounded-2xl border border-cyan-300/30 bg-cyan-950/90 px-4 py-3 text-center text-white shadow-2xl backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-wide text-cyan-200">
                    Medição ativa
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    Origem: {measurementStart.label}. Toque em outra face,
                    aresta ou vértice para criar a linha de distância.
                  </p>
                </div>
              ) : null}

              <svg
                className="absolute inset-0 h-full w-full"
                viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <radialGradient id="spatialGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#312e81" stopOpacity="0" />
                  </radialGradient>
                  <filter id="intersectionGlow" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="16" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <rect
                  width={VIEWBOX_WIDTH}
                  height={VIEWBOX_HEIGHT}
                  fill="transparent"
                  className="cursor-crosshair"
                  onDoubleClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    openBackgroundMenu(event.clientX, event.clientY);
                  }}
                  onPointerDown={(event) => {
                    if (event.pointerType === "mouse") return;

                    longPressTimerRef.current = window.setTimeout(() => {
                      longPressTimerRef.current = null;
                      openBackgroundMenu(event.clientX, event.clientY);
                    }, 560);
                  }}
                />
                <circle
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r="330"
                  fill="url(#spatialGlow)"
                  onDoubleClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    openBackgroundMenu(event.clientX, event.clientY);
                  }}
                  onPointerDown={(event) => {
                    if (event.pointerType === "mouse") return;

                    longPressTimerRef.current = window.setTimeout(() => {
                      longPressTimerRef.current = null;
                      openBackgroundMenu(event.clientX, event.clientY);
                    }, 560);
                  }}
                />

                {showGrid ? renderGrid() : null}
                {showAxes ? renderAxes({ angleX: rotationX, angleY: rotationY }) : null}

                {activeSolid === "sphere"
                  ? renderSphere({
                      angleX: rotationX,
                      angleY: rotationY,
                      scale: outerRenderScale,
                      offset: { x: 0, y: 0, z: 0 },
                      onGeometryClick: () => selectGeometry("outer"),
                      onGeometryDoubleClick: (event) => openSolidMenu("outer", event),
                      onGeometryPointerDown: (event) =>
                        prepareSolidMenuOnTouch("outer", event),
                      onElementClick: (element) =>
                        handleElementClick(buildGeometryElement({ ...element, target: "outer" })),
                      onElementDoubleClick: (element, event) =>
                        openElementMenu("outer", element, event),
                      onElementPointerDown: (element, event) =>
                        prepareElementMenuOnTouch("outer", element, event),
                      theme: {
                        face: "#38bdf8",
                        edge: selectedTarget === "outer" ? "#facc15" : "#bae6fd",
                        opacity: showFaces ? 0.18 : 0.04,
                        label: "outer-sphere",
                      },
                    })
                  : renderMesh({
                      mesh: outerMesh,
                      angleX: rotationX,
                      angleY: rotationY,
                      scale: outerRenderScale,
                      offset: { x: 0, y: 0, z: 0 },
                      onGeometryClick: () => selectGeometry("outer"),
                      onGeometryDoubleClick: (event) => openSolidMenu("outer", event),
                      onGeometryPointerDown: (event) =>
                        prepareSolidMenuOnTouch("outer", event),
                      theme: {
                        face: "#38bdf8",
                        edge: selectedTarget === "outer" ? "#facc15" : "#bae6fd",
                        opacity: showFaces ? 0.18 : 0.04,
                        label: "outer",
                      },
                    })}

                {mode === "inscribed" && showInnerSolid
                  ? innerSolid === "sphere"
                    ? renderSphere({
                        angleX: rotationX,
                        angleY: rotationY,
                        scale: innerRenderScale,
                        offset: {
                          x: innerOffsetX,
                          y: innerOffsetY,
                          z: innerOffsetZ,
                        },
                        onGeometryClick: () => selectGeometry("inner"),
                        onGeometryDoubleClick: (event) => openSolidMenu("inner", event),
                        onGeometryPointerDown: (event) =>
                          prepareSolidMenuOnTouch("inner", event),
                        theme: {
                          face: "#f97316",
                          edge: selectedTarget === "inner" ? "#facc15" : "#fed7aa",
                          opacity: showFaces ? 0.34 : 0.08,
                          dashed: true,
                          label: "inner-sphere",
                        },
                      })
                    : renderMesh({
                        mesh: innerMesh,
                        angleX: rotationX,
                        angleY: rotationY,
                        scale: innerRenderScale,
                        offset: {
                          x: innerOffsetX,
                          y: innerOffsetY,
                          z: innerOffsetZ,
                        },
                        objectRotation: innerObjectRotation,
                        onGeometryClick: () => selectGeometry("inner"),
                        onGeometryDoubleClick: (event) => openSolidMenu("inner", event),
                        onGeometryPointerDown: (event) =>
                          prepareSolidMenuOnTouch("inner", event),
                        onElementClick: (element) =>
                          handleElementClick(buildGeometryElement({ ...element, target: "inner" })),
                        onElementDoubleClick: (element, event) =>
                          openElementMenu("inner", element, event),
                        onElementPointerDown: (element, event) =>
                          prepareElementMenuOnTouch("inner", element, event),
                        theme: {
                          face: "#f97316",
                          edge: selectedTarget === "inner" ? "#facc15" : "#fed7aa",
                          opacity: showFaces ? 0.3 : 0.08,
                          dashed: true,
                          label: "inner",
                        },
                      })
                  : null}

                {showCenter
                  ? renderCenterMark({
                      angleX: rotationX,
                      angleY: rotationY,
                      scale: outerRenderScale,
                      offset: { x: 0, y: 0, z: 0 },
                    })
                  : null}

                {mode === "inscribed" && showCenter
                  ? renderCenterMark({
                      angleX: rotationX,
                      angleY: rotationY,
                      scale: innerRenderScale,
                      offset: {
                        x: innerOffsetX,
                        y: innerOffsetY,
                        z: innerOffsetZ,
                      },
                      objectRotation: innerObjectRotation,
                    })
                  : null}

                {mode === "inscribed" && showInnerSolid
                  ? renderIntersectionCloud({
                      outerSolid,
                      innerSolid,
                      sides: polygonSides,
                      outerScale: outerRenderScale,
                      innerScale: innerRenderScale,
                      innerOffset: {
                        x: innerOffsetX,
                        y: innerOffsetY,
                        z: innerOffsetZ,
                      },
                      innerRotation: innerObjectRotation,
                      angleX: rotationX,
                      angleY: rotationY,
                    })
                  : null}

                {renderMeasurementOverlay({
                  type: overlayTarget.type,
                  action: selectedAction,
                  angleX: rotationX,
                  angleY: rotationY,
                  scale: overlayTarget.scale,
                  offset: overlayTarget.offset,
                  objectRotation: overlayTarget.objectRotation,
                })}

                {geometryMeasurements.map((measurement) =>
                  renderGeometryMeasurement(measurement)
                )}
                {renderMeasurementStartMarker()}
              </svg>

              {floatingMenu ? (
                <div
                  className={`absolute z-30 overflow-y-auto border border-white/15 bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur ${
                    isFullscreen
                      ? "max-h-[min(520px,calc(100vh-120px))] w-[300px] rounded-3xl"
                      : "max-h-[calc(100vh-132px)] w-[320px] rounded-2xl"
                  }`}
                  style={{ left: floatingMenu.x, top: floatingMenu.y }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => event.stopPropagation()}
                >
                  {isFullscreen ? (
                    floatingMenu.kind === "element" ? (
                      renderElementMenu(floatingMenu.element)
                    ) : floatingMenu.kind === "solid" ? (
                      renderFullscreenSolidMenu(floatingMenu.target)
                    ) : (
                      renderFullscreenBackgroundMenu()
                    )
                  ) : floatingMenu.kind === "element" ? (
                    renderElementMenu(floatingMenu.element)
                  ) : floatingMenu.kind === "solid" ? (
                    <>
                      <div
                        className="mb-3 flex touch-none cursor-move items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-2"
                        onPointerDown={startMenuDrag}
                        onPointerMove={moveFloatingMenu}
                        onPointerUp={stopMenuDrag}
                        onPointerCancel={stopMenuDrag}
                      >
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-cyan-200">
                            Editar sólido
                          </p>
                          <p className="mt-1 text-sm font-black">
                            {floatingMenu.target === "inner" ? "Sólido interno" : "Sólido externo"}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-slate-400">
                            Arraste esta barra para reposicionar o menu.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={closeFloatingMenu}
                          className="rounded-full border border-white/10 px-2 py-1 text-xs font-bold text-slate-300 hover:bg-white/10"
                        >
                          fechar
                        </button>
                      </div>

                      <div className="grid gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveAdjustment("base")}
                          className={`rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-white/15 ${
                            activeAdjustment === "base"
                              ? "bg-cyan-400/20 text-cyan-100"
                              : "bg-white/10"
                          }`}
                        >
                          Ajustar aresta/base
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveAdjustment("base")}
                          className={`rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-white/15 ${
                            activeAdjustment === "base"
                              ? "bg-cyan-400/20 text-cyan-100"
                              : "bg-white/10"
                          }`}
                        >
                          Diminuir aresta/base
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveAdjustment("height")}
                          className={`rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-white/15 ${
                            activeAdjustment === "height"
                              ? "bg-cyan-400/20 text-cyan-100"
                              : "bg-white/10"
                          }`}
                        >
                          Ajustar altura
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveAdjustment("radius")}
                          className={`rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-white/15 ${
                            activeAdjustment === "radius"
                              ? "bg-cyan-400/20 text-cyan-100"
                              : "bg-white/10"
                          }`}
                        >
                          Ajustar raio
                        </button>
                      </div>

                      {activeAdjustment && adjustmentDetails ? (
                        <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-3">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-cyan-200">
                              {adjustmentDetails.label}
                            </p>
                            <p className="text-sm font-black text-white">
                              {adjustmentDetails.suffix === "%"
                                ? `${formatNumber(adjustmentDetails.value * 100)}%`
                                : `${formatNumber(adjustmentDetails.value)} ${adjustmentDetails.suffix}`}
                            </p>
                          </div>

                          <input
                            type="range"
                            min={adjustmentDetails.min}
                            max={adjustmentDetails.max}
                            step={adjustmentDetails.step}
                            value={adjustmentDetails.value}
                            onChange={(event) =>
                              setAdjustmentValue(
                                activeAdjustment,
                                Number(event.target.value)
                              )
                            }
                            className="w-full accent-cyan-300"
                          />

                          <div className="mt-3 grid grid-cols-[44px_1fr_44px] gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                nudgeAdjustment(
                                  activeAdjustment,
                                  isAdjustingInner ? -0.03 : -0.5
                                )
                              }
                              className="rounded-xl bg-white/10 px-3 py-2 text-lg font-black hover:bg-white/15"
                            >
                              -
                            </button>

                            <input
                              type="number"
                              min={adjustmentDetails.min}
                              max={adjustmentDetails.max}
                              step={adjustmentDetails.step}
                              value={Number(adjustmentDetails.value.toFixed(2))}
                              onChange={(event) =>
                                setAdjustmentValue(
                                  activeAdjustment,
                                  Number(event.target.value)
                                )
                              }
                              className="rounded-xl border border-white/10 bg-white px-3 py-2 text-center text-sm font-black text-slate-900 outline-none"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                nudgeAdjustment(
                                  activeAdjustment,
                                  isAdjustingInner ? 0.03 : 0.5
                                )
                              }
                              className="rounded-xl bg-white/10 px-3 py-2 text-lg font-black hover:bg-white/15"
                            >
                              +
                            </button>
                          </div>

                          {isAdjustingInner ? (
                            <p className="mt-2 text-xs leading-5 text-cyan-100/80">
                              Nesta etapa, o sólido interno usa escala. Dimensões
                              independentes por objeto entram na próxima camada
                              do laboratório.
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {mode === "inscribed" && floatingMenu.target === "inner" ? (
                        <div className="mt-3 rounded-2xl border border-violet-300/20 bg-violet-400/10 p-3">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wide text-violet-200">
                                Rotação do interno
                              </p>
                              <p className="mt-1 text-[11px] font-semibold text-violet-100/80">
                                Gire o sólido inscrito sem mexer na câmera.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={resetInnerRotation}
                              className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white hover:bg-white/15"
                            >
                              zerar
                            </button>
                          </div>

                          {[
                            {
                              axis: "x" as const,
                              label: "Eixo X",
                              value: innerRotationX,
                              setter: setInnerRotationX,
                            },
                            {
                              axis: "y" as const,
                              label: "Eixo Y",
                              value: innerRotationY,
                              setter: setInnerRotationY,
                            },
                            {
                              axis: "z" as const,
                              label: "Eixo Z",
                              value: innerRotationZ,
                              setter: setInnerRotationZ,
                            },
                          ].map((control) => (
                            <div key={control.axis} className="mt-3">
                              <div className="mb-1 flex items-center justify-between text-xs font-bold text-violet-100">
                                <span>{control.label}</span>
                                <span>{formatNumber(control.value)}°</span>
                              </div>

                              <input
                                type="range"
                                min="0"
                                max="360"
                                step="1"
                                value={control.value}
                                onChange={(event) =>
                                  control.setter(Number(event.target.value))
                                }
                                className="w-full accent-violet-300"
                              />

                              <div className="mt-2 grid grid-cols-3 gap-2">
                                {[90, 180, 360].map((degrees) => (
                                  <button
                                    key={`${control.axis}-${degrees}`}
                                    type="button"
                                    onClick={() => rotateInnerBy(control.axis, degrees)}
                                    className="rounded-lg bg-white/10 px-2 py-1 text-xs font-black text-white hover:bg-white/15"
                                  >
                                    +{degrees}°
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => {
                              setInteractionMode("rotateInner");
                              setSelectedTarget("inner");
                            }}
                            className="mt-3 w-full rounded-xl bg-violet-500 px-3 py-2 text-sm font-black text-white hover:bg-violet-400"
                          >
                            Arrastar para rotacionar interno
                          </button>
                        </div>
                      ) : null}

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => adjustSelectedSolid("volume")}
                          className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-400/20"
                        >
                          Volume
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustSelectedSolid("area")}
                          className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-sm font-bold text-amber-100 hover:bg-amber-400/20"
                        >
                          Área total
                        </button>
                      </div>

                      <div className="mt-3 border-t border-white/10 pt-3">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                          Inscrição
                        </p>

                        <div className="grid gap-2">
                          <button
                            type="button"
                            onClick={placeSelectedInsideAnother}
                            className="rounded-xl border border-indigo-300/30 bg-indigo-400/10 px-3 py-2 text-left text-sm font-bold text-indigo-100 hover:bg-indigo-400/20"
                          >
                            Colocar este sólido dentro de outro
                          </button>

                          <button
                            type="button"
                            onClick={fitCurrentSolids}
                            disabled={mode !== "inscribed"}
                            className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-left text-sm font-bold text-emerald-100 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Centralizar e encaixar no externo
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 border-t border-white/10 pt-3">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                          Trocar por
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {QUICK_ADD_SOLIDS.map((solidType) => (
                            <button
                              key={solidType}
                              type="button"
                              onClick={() => replaceSelectedSolid(solidType)}
                              className="rounded-xl bg-white/10 px-2 py-2 text-xs font-bold hover:bg-white/15"
                            >
                              {SOLIDS.find((solid) => solid.type === solidType)?.shortLabel}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="mb-3 flex touch-none cursor-move items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-2"
                        onPointerDown={startMenuDrag}
                        onPointerMove={moveFloatingMenu}
                        onPointerUp={stopMenuDrag}
                        onPointerCancel={stopMenuDrag}
                      >
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-orange-200">
                            Adicionar forma
                          </p>
                          <p className="mt-1 text-sm font-black">
                            Colocar sólido dentro da cena
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-slate-400">
                            Arraste esta barra para reposicionar o menu.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={closeFloatingMenu}
                          className="rounded-full border border-white/10 px-2 py-1 text-xs font-bold text-slate-300 hover:bg-white/10"
                        >
                          fechar
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {QUICK_ADD_SOLIDS.map((solidType) => (
                          <button
                            key={solidType}
                            type="button"
                            onClick={() => addSolidToScene(solidType)}
                            className="rounded-xl bg-white/10 px-3 py-2 text-left text-sm font-bold hover:bg-white/15"
                          >
                            {SOLIDS.find((solid) => solid.type === solidType)?.label}
                          </button>
                        ))}
                      </div>

                      <p className="mt-3 text-xs leading-5 text-slate-300">
                        O sólido adicionado entra como objeto interno. Depois use
                        “Mover sólido interno” para arrastar e ajustar a inscrição.
                      </p>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            <div
              className={`border-t border-slate-100 bg-slate-50 p-5 ${
                isFullscreen ? "hidden" : ""
              }`}
            >
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Rotate3D className="h-4 w-4" />
                  Controles do simulador
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={interactionMode === "rotate" ? "default" : "outline"}
                    onClick={() => setInteractionMode("rotate")}
                    className="rounded-2xl"
                  >
                    Arrastar para girar
                  </Button>

                  <Button
                    type="button"
                    variant={interactionMode === "moveInner" ? "default" : "outline"}
                    onClick={() => {
                      setMode("inscribed");
                      setInteractionMode("moveInner");
                      setSelectedTarget("inner");
                    }}
                    className="rounded-2xl"
                  >
                    Mover sólido interno
                  </Button>

                  <Button
                    type="button"
                    variant={interactionMode === "rotateInner" ? "default" : "outline"}
                    onClick={() => {
                      setMode("inscribed");
                      setInteractionMode("rotateInner");
                      setSelectedTarget("inner");
                    }}
                    className="rounded-2xl"
                  >
                    Rotacionar interno
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    {mode === "simple" ? "Sólido" : "Sólido externo"}
                  </label>

                  <select
                    value={mode === "simple" ? selectedSolid : outerSolid}
                    onChange={(event) => {
                      mode === "simple"
                        ? setSelectedSolid(event.target.value as SolidType)
                        : setOuterSolid(event.target.value as SolidType);
                      setSelectedTarget("outer");
                      clearSelection();
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-900"
                  >
                    {SOLIDS.map((solid) => (
                      <option key={solid.type} value={solid.type}>
                        {solid.label}
                      </option>
                    ))}
                  </select>
                </div>

                {mode === "inscribed" ? (
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Sólido interno
                    </label>

                    <select
                      value={innerSolid}
                      onChange={(event) => {
                        setInnerSolid(event.target.value as SolidType);
                        setSelectedTarget("inner");
                        clearSelection();
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-900"
                    >
                      {SOLIDS.map((solid) => (
                        <option key={solid.type} value={solid.type}>
                          {solid.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAutoRotate((current) => !current)}
                  disabled={interactionMode !== "rotate"}
                  className="mt-6 gap-2 rounded-2xl"
                >
                  {autoRotate ? (
                    <PauseCircle className="h-4 w-4" />
                  ) : (
                    <PlayCircle className="h-4 w-4" />
                  )}
                  {autoRotate ? "Pausar giro" : "Girar automático"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={resetRotation}
                  className="mt-6 gap-2 rounded-2xl"
                >
                  <RotateCcw className="h-4 w-4" />
                  Resetar visão
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFullscreen(true)}
                  className="mt-6 gap-2 rounded-2xl"
                >
                  <Maximize2 className="h-4 w-4" />
                  Tela cheia
                </Button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFaces((current) => !current)}
                  className="gap-2 rounded-2xl"
                >
                  {showFaces ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {showFaces ? "Ocultar faces" : "Mostrar faces"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInnerSolid((current) => !current)}
                  disabled={mode !== "inscribed"}
                  className="gap-2 rounded-2xl"
                >
                  {showInnerSolid ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  Interno
                </Button>

                <Button
                  type="button"
                  variant={showAxes ? "default" : "outline"}
                  onClick={() => setShowAxes((current) => !current)}
                  className="rounded-2xl"
                >
                  Eixos
                </Button>

                <Button
                  type="button"
                  variant={showGrid ? "default" : "outline"}
                  onClick={() => setShowGrid((current) => !current)}
                  className="rounded-2xl"
                >
                  Grade
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {VIEW_PRESETS.map((view) => (
                  <Button
                    key={view.label}
                    type="button"
                    variant="outline"
                    onClick={() => applyViewPreset(view)}
                    className="rounded-2xl"
                  >
                    {view.label}
                  </Button>
                ))}
              </div>
            </div>

            <div
              className={`border-t border-slate-100 bg-slate-50/80 p-5 ${
                isFullscreen ? "hidden" : ""
              }`}
            >
              <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Ruler className="h-4 w-4" />
                    Medidas do sólido
                  </div>

                  <h3 className="mt-2 text-xl font-black text-slate-900">
                    Ajuste os parâmetros
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Agora o uso principal é arrastar e clicar no sólido. Esses
                    campos ficam como ajuste fino para a matemática não virar
                    estimativa visual sem controle.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Lado / aresta
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={side}
                      onChange={(event) => {
                        setSide(Number(event.target.value));
                        clearSelection();
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Altura
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={height}
                      onChange={(event) => {
                        setHeight(Number(event.target.value));
                        clearSelection();
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Raio
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={radius}
                      onChange={(event) => {
                        setRadius(Number(event.target.value));
                        clearSelection();
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Nº lados da base
                    </label>
                    <select
                      value={polygonSides}
                      onChange={(event) => {
                        setPolygonSides(Number(event.target.value));
                        clearSelection();
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-900"
                    >
                      {[3, 4, 5, 6, 8, 12].map((value) => (
                        <option key={value} value={value}>
                          {value} lados
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Comprimento
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={width}
                      onChange={(event) => {
                        setWidth(Number(event.target.value));
                        clearSelection();
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Profundidade
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={depth}
                      onChange={(event) => {
                        setDepth(Number(event.target.value));
                        clearSelection();
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div
            className={`space-y-6 ${
              isFullscreen
                ? "absolute bottom-3 right-3 top-[92px] z-30 w-[420px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-2xl"
                : ""
            }`}
          >
            <Card className="border-slate-200 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ListTree className="h-4 w-4" />
                Cena
              </div>

              <h2 className="mt-2 text-2xl font-black text-slate-900">
                Objetos do laboratório
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Clique em um objeto para selecionar. Dê duplo clique no sólido
                no desenho para editar medidas ou trocar a forma.
              </p>

              <div className="mt-5 space-y-3">
                {sceneObjects.map((object) => (
                  <button
                    key={object.id}
                    type="button"
                    onClick={() => {
                      setSelectedTarget(object.id);
                      setSelectedAction(null);
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedTarget === object.id
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {object.label}
                        </p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                          {object.color} · {object.visible ? "visível" : "oculto"}
                        </p>
                      </div>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
                        {SOLIDS.find((solid) => solid.type === object.solid)?.shortLabel}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="rounded-xl bg-white p-2">
                        <p className="font-bold uppercase tracking-wide text-slate-400">
                          Volume
                        </p>
                        <p className="mt-1 font-black text-slate-900">
                          {formatNumber(object.metrics.volume)} u³
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-2">
                        <p className="font-bold uppercase tracking-wide text-slate-400">
                          Área total
                        </p>
                        <p className="mt-1 font-black text-slate-900">
                          {formatNumber(object.metrics.totalArea)} u²
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const rect = visualRef.current?.getBoundingClientRect();
                    openBackgroundMenu(
                      (rect?.left ?? 0) + 40,
                      (rect?.top ?? 0) + 120
                    );
                  }}
                  className="gap-2 rounded-2xl"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={centralizeInner}
                  disabled={mode !== "inscribed"}
                  className="rounded-2xl"
                >
                  Centralizar
                </Button>
              </div>
            </Card>

            <Card className="border-slate-200 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <Layers className="h-4 w-4" />
                Encaixe e ocupação
              </div>

              <h2 className="mt-2 text-2xl font-black text-slate-900">
                Colocar sólido dentro de outro
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Use os encaixes clássicos para montar relações de prova e ver
                volume ocupado, volume vazio e porcentagem de ocupação.
              </p>

              <div className="mt-5 grid gap-2">
                {CLASSIC_FIT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyClassicFit(preset)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      currentClassicFit?.id === preset.id
                        ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    <p className="text-sm font-black">{preset.label}</p>
                    <p className="mt-1 text-xs leading-5 opacity-80">
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>

              {mode === "inscribed" ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-emerald-950">
                        {relationship.title}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                        {isCentered ? "centros alinhados" : "centros deslocados"}
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={fitCurrentSolids}
                      className="rounded-2xl"
                    >
                      Encaixar
                    </Button>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-emerald-900">
                    {relationship.text}
                  </p>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wide text-emerald-700">
                      <span>Volume em comum</span>
                      <span>{formatNumber(occupation)}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${clamp(occupation, 0, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-white p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                          Precisão da interseção
                        </p>
                        <p className="mt-1 text-xs font-semibold text-emerald-900">
                          Estado: {overlapEstimate?.state ?? "calculando"} · grade{" "}
                          {overlapEstimate?.sampleResolution ?? 0}³ · erro aprox.{" "}
                          ±{formatNumber(overlapEstimate?.estimatedErrorPercent ?? 0)}%
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setOverlapQuality("fast")}
                          className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                            overlapQuality === "fast"
                              ? "bg-emerald-600 text-white"
                              : "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
                          }`}
                        >
                          Rápido
                        </button>
                        <button
                          type="button"
                          onClick={() => setOverlapQuality("precise")}
                          className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                            overlapQuality === "precise"
                              ? "bg-emerald-600 text-white"
                              : "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
                          }`}
                        >
                          Preciso
                        </button>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-emerald-800">
                      Enquanto você arrasta, o laboratório usa uma grade leve
                      para manter o movimento fluido. Ao soltar, ele recalcula
                      conforme o modo escolhido.
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-emerald-950">
                    <div className="rounded-xl bg-white p-3">
                      <p className="font-bold uppercase tracking-wide text-emerald-600">
                        Interseção
                      </p>
                      <p className="mt-1 font-black">
                        {formatNumber(occupiedVolume)} u³
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="font-bold uppercase tracking-wide text-emerald-600">
                        União
                      </p>
                      <p className="mt-1 font-black">
                        {formatNumber(unionVolume)} u³
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="font-bold uppercase tracking-wide text-emerald-600">
                        Externo vazio
                      </p>
                      <p className="mt-1 font-black">
                        {formatNumber(emptyVolume)} u³
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="font-bold uppercase tracking-wide text-emerald-600">
                        Interno fora
                      </p>
                      <p className="mt-1 font-black">
                        {formatNumber(innerOutsideVolume)} u³
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-emerald-950">
                    <div className="rounded-xl bg-white/80 p-3">
                      <p className="font-bold uppercase tracking-wide text-emerald-600">
                        Volume externo
                      </p>
                      <p className="mt-1 font-black">
                        {formatNumber(outerMetrics.volume)} u³
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/80 p-3">
                      <p className="font-bold uppercase tracking-wide text-emerald-600">
                        Volume interno
                      </p>
                      <p className="mt-1 font-black">
                        {formatNumber(innerMetrics.volume)} u³
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-white p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                        Controle fino do interno
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={resetInnerRotation}
                        className="rounded-2xl"
                      >
                        Zerar rotação
                      </Button>
                    </div>

                    {[
                      {
                        label: "Posição X",
                        value: innerOffsetX,
                        min: -1.2,
                        max: 1.2,
                        step: 0.01,
                        onChange: setInnerOffsetX,
                      },
                      {
                        label: "Posição Y",
                        value: innerOffsetY,
                        min: -1.2,
                        max: 1.2,
                        step: 0.01,
                        onChange: setInnerOffsetY,
                      },
                      {
                        label: "Posição Z",
                        value: innerOffsetZ,
                        min: -1.2,
                        max: 1.2,
                        step: 0.01,
                        onChange: setInnerOffsetZ,
                      },
                      {
                        label: "Rotação X",
                        value: innerRotationX,
                        min: 0,
                        max: 360,
                        step: 1,
                        onChange: setInnerRotationX,
                      },
                      {
                        label: "Rotação Y",
                        value: innerRotationY,
                        min: 0,
                        max: 360,
                        step: 1,
                        onChange: setInnerRotationY,
                      },
                      {
                        label: "Rotação Z",
                        value: innerRotationZ,
                        min: 0,
                        max: 360,
                        step: 1,
                        onChange: setInnerRotationZ,
                      },
                    ].map((control) => (
                      <div key={control.label} className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs font-bold text-emerald-900">
                          <span>{control.label}</span>
                          <span>
                            {formatNumber(control.value)}
                            {control.label.startsWith("Rotação") ? "°" : ""}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={control.min}
                          max={control.max}
                          step={control.step}
                          value={control.value}
                          onChange={(event) =>
                            control.onChange(Number(event.target.value))
                          }
                          className="w-full accent-emerald-500"
                        />
                      </div>
                    ))}
                  </div>

                  <p className="mt-3 text-xs leading-5 text-emerald-800">
                    Interseção e união são estimadas em tempo real por amostragem
                    3D ({overlapEstimate?.sampleResolution ?? 0}³ pontos). Ao
                    mover o sólido interno, os valores mudam automaticamente.
                  </p>

                  <div className="mt-4 rounded-2xl bg-white p-3">
                    <MathFormula formula={relationship.formula} display={true} />
                    <MathFormula
                      formula={relationship.substitution}
                      display={true}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">
                    Ainda não há sólido interno.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Escolha um encaixe clássico acima ou dê duplo clique/segure
                    no fundo do laboratório para adicionar uma forma.
                  </p>
                </div>
              )}
            </Card>

            <Card className="border-slate-200 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                <Ruler className="h-4 w-4" />
                Cortes inteligentes
              </div>

              <h2 className="mt-2 text-2xl font-black text-slate-900">
                Seções do sólido
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Escolha um corte para revelar a figura plana que aparece dentro
                do sólido. É aqui que nascem muitas contas de diagonal, geratriz,
                área da base e volume.
              </p>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {SMART_CUTS.map((cut) => (
                  <button
                    key={cut.id}
                    type="button"
                    onClick={() => applySmartCut(cut.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      activeSmartCut === cut.id
                        ? "border-amber-300 bg-amber-50 text-amber-950"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-300 hover:bg-amber-50"
                    }`}
                  >
                    <p className="text-sm font-black">{cut.label}</p>
                    <p className="mt-1 text-xs leading-5 opacity-80">
                      {cut.description}
                    </p>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-black text-amber-950">
                  Corte selecionado:{" "}
                  {SMART_CUTS.find((cut) => cut.id === activeSmartCut)?.label ??
                    "nenhum"}
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  O destaque amarelo no desenho mostra a medida ou seção
                  associada. Para cilindro e cone, o corte axial mostra
                  retângulo/triângulo; para esfera, o corte central mostra o
                  círculo máximo; para cubo e paralelepípedo, a diagonal revela
                  o triângulo retângulo interno.
                </p>
              </div>
            </Card>

            <Card className="border-slate-200 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-fuchsia-700">
                <Layers className="h-4 w-4" />
                Planificação
              </div>

              <h2 className="mt-2 text-2xl font-black text-slate-900">
                Abrir o sólido
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                A planificação mostra de onde vem a área total: bases mais
                faces laterais. É o antídoto contra decorar fórmula sem enxergar
                as peças.
              </p>

              <Button
                type="button"
                variant={showNet ? "default" : "outline"}
                onClick={() => setShowNet((current) => !current)}
                className="mt-4 w-full rounded-2xl"
              >
                {showNet ? "Ocultar planificação" : "Mostrar planificação"}
              </Button>

              {showNet ? (
                <div className="mt-5 rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4">
                  <div className="mb-4 rounded-2xl bg-white p-3">
                    <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wide text-fuchsia-700">
                      <span>Abertura da planificação</span>
                      <span>{formatNumber(netOpenAmount * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={netOpenAmount}
                      onChange={(event) => setNetOpenAmount(Number(event.target.value))}
                      className="w-full accent-fuchsia-600"
                    />
                  </div>

                  <div className="grid min-h-[170px] place-items-center rounded-2xl bg-white p-4">
                    {inspectedSolid === "cylinder" ? (
                      <div className="flex items-center justify-center gap-3">
                        <div
                          className="grid h-14 w-14 place-items-center rounded-full border-4 border-fuchsia-400 bg-fuchsia-100 text-[10px] font-black text-fuchsia-900 transition duration-700 ease-out"
                          style={{
                            transform: `translateX(${-34 * netOpenAmount}px) rotate(${-28 * netOpenAmount}deg)`,
                          }}
                        >
                          base
                        </div>
                        <div
                          className="grid h-24 w-32 place-items-center rounded-xl border-4 border-fuchsia-400 bg-fuchsia-100 text-xs font-black text-fuchsia-900 transition duration-700 ease-out"
                          style={{
                            transform: `scaleX(${0.78 + 0.22 * netOpenAmount})`,
                          }}
                        >
                          lateral
                        </div>
                        <div
                          className="grid h-14 w-14 place-items-center rounded-full border-4 border-fuchsia-400 bg-fuchsia-100 text-[10px] font-black text-fuchsia-900 transition duration-700 ease-out"
                          style={{
                            transform: `translateX(${34 * netOpenAmount}px) rotate(${28 * netOpenAmount}deg)`,
                          }}
                        >
                          base
                        </div>
                      </div>
                    ) : inspectedSolid === "cone" ? (
                      <div className="flex items-center justify-center gap-4">
                        <div
                          className="grid h-24 w-32 place-items-end rounded-t-full border-4 border-fuchsia-400 bg-fuchsia-100 pb-4 text-xs font-black text-fuchsia-900 transition duration-700 ease-out"
                          style={{
                            transform: `translateX(${-22 * netOpenAmount}px) rotate(${-10 * netOpenAmount}deg)`,
                            clipPath: `polygon(50% 0%, ${100 - 14 * netOpenAmount}% 100%, ${14 * netOpenAmount}% 100%)`,
                          }}
                        >
                          setor lateral
                        </div>
                        <div
                          className="grid h-16 w-16 place-items-center rounded-full border-4 border-fuchsia-400 bg-fuchsia-100 text-[10px] font-black text-fuchsia-900 transition duration-700 ease-out"
                          style={{
                            transform: `translateX(${28 * netOpenAmount}px) rotate(${32 * netOpenAmount}deg)`,
                          }}
                        >
                          base
                        </div>
                      </div>
                    ) : inspectedSolid === "sphere" ? (
                      <div className="text-center">
                        <div
                          className="mx-auto h-24 w-24 rounded-full border-4 border-fuchsia-400 bg-fuchsia-100 transition duration-700 ease-out"
                          style={{
                            transform: `scale(${0.84 + 0.16 * netOpenAmount}) rotate(${18 * netOpenAmount}deg)`,
                          }}
                        />
                        <p className="mt-3 text-xs font-bold text-fuchsia-800">
                          A esfera não possui planificação plana exata sem
                          distorção.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: inspectedSolid === "pyramid" ? 5 : 6 }).map(
                          (_, index) => (
                            <div
                              key={index}
                              className="grid h-16 w-16 place-items-center rounded-lg border-4 border-fuchsia-400 bg-fuchsia-100 text-xs font-black text-fuchsia-900 transition duration-700 ease-out"
                              style={{
                                transform:
                                  index === 0
                                    ? `scale(${0.92 + 0.08 * netOpenAmount})`
                                    : `translate(${((index % 4) - 1.5) * 12 * netOpenAmount}px, ${Math.floor(index / 2) * 10 * netOpenAmount}px) rotate(${(index % 2 === 0 ? -1 : 1) * 18 * netOpenAmount}deg)`,
                                transformOrigin: "center",
                              }}
                            >
                              {index === 0 ? "base" : "face"}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl bg-white p-3">
                    <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-xl bg-fuchsia-50 p-3">
                        <p className="font-black uppercase tracking-wide text-fuchsia-500">
                          Base
                        </p>
                        <p className="mt-1 font-black text-fuchsia-950">
                          {inspectedSolid === "sphere"
                            ? "não exata"
                            : `${formatNumber(netBaseArea)} u²`}
                        </p>
                      </div>
                      <div className="rounded-xl bg-fuchsia-50 p-3">
                        <p className="font-black uppercase tracking-wide text-fuchsia-500">
                          Lateral
                        </p>
                        <p className="mt-1 font-black text-fuchsia-950">
                          {inspectedSolid === "sphere"
                            ? "distorce"
                            : `${formatNumber(netLateralArea)} u²`}
                        </p>
                      </div>
                      <div className="rounded-xl bg-fuchsia-50 p-3">
                        <p className="font-black uppercase tracking-wide text-fuchsia-500">
                          Total
                        </p>
                        <p className="mt-1 font-black text-fuchsia-950">
                          {formatNumber(inspectedMetrics.totalArea)} u²
                        </p>
                      </div>
                    </div>
                    <MathFormula formula={inspectedMetrics.formulas.area} display={true} />
                    <MathFormula
                      formula={inspectedMetrics.substitution.area}
                      display={true}
                    />
                  </div>
                </div>
              ) : null}
            </Card>

            <Card className="border-slate-200 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-700">
                <MousePointerClick className="h-4 w-4" />
                Ações geométricas
              </div>

              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {inspectedDefinition.label}
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Clique no sólido azul ou laranja e escolha o que deseja analisar.
                O simulador destaca a medida no desenho e mostra a conta.
              </p>

              {mode === "inscribed" ? (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={selectedTarget === "outer" ? "default" : "outline"}
                    onClick={() => {
                      setSelectedTarget("outer");
                      clearSelection();
                    }}
                    className="rounded-2xl"
                  >
                    Externo
                  </Button>

                  <Button
                    type="button"
                    variant={selectedTarget === "inner" ? "default" : "outline"}
                    onClick={() => {
                      setSelectedTarget("inner");
                      clearSelection();
                    }}
                    className="rounded-2xl"
                  >
                    Interno
                  </Button>
                </div>
              ) : null}

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => setSelectedAction(action.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      selectedAction === action.id
                        ? "border-cyan-400 bg-cyan-50 text-cyan-950"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-300 hover:bg-cyan-50"
                    }`}
                  >
                    <p className="text-sm font-black">{action.label}</p>
                    <p className="mt-1 text-xs leading-5 opacity-80">
                      {action.description}
                    </p>
                  </button>
                ))}
              </div>

              {inspector ? (
                <div className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                  <p className="text-sm font-black text-cyan-950">
                    {inspector.title}
                  </p>

                  <p className="mt-2 text-sm leading-7 text-cyan-900">
                    {inspector.description}
                  </p>

                  <div className="mt-4 space-y-3">
                    {inspector.formulas.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-cyan-100 bg-white p-4"
                      >
                        <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
                          {item.label}
                        </p>
                        <div className="mt-2">
                          <MathFormula formula={item.formula} display={true} />
                        </div>
                        <div className="mt-2">
                          <MathFormula formula={item.substitution} display={true} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>

            <Card className="border-slate-200 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                <Calculator className="h-4 w-4" />
                Fórmulas e resultados
              </div>

              <h2 className="mt-2 text-2xl font-black text-slate-900">
                Como calcular {activeDefinition.label.toLowerCase()}
              </h2>

              <div className="mt-5 grid gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Volume
                  </p>
                  <div className="mt-2">
                    <MathFormula formula={outerMetrics.formulas.volume} display={true} />
                  </div>
                  <div className="mt-2">
                    <MathFormula
                      formula={outerMetrics.substitution.volume}
                      display={true}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Área total
                  </p>
                  <div className="mt-2">
                    <MathFormula formula={outerMetrics.formulas.area} display={true} />
                  </div>
                  <div className="mt-2">
                    <MathFormula
                      formula={outerMetrics.substitution.area}
                      display={true}
                    />
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-700">
                {outerMetrics.explanation}
              </p>
            </Card>

            <Card className="border-slate-200 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-orange-700">
                <Layers className="h-4 w-4" />
                Sólidos inscritos
              </div>

              <h2 className="mt-2 text-2xl font-black text-slate-900">
                Relação entre formas
              </h2>

              <div className="mt-5 grid gap-2">
                {INSCRIBED_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-950"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {mode === "inscribed" ? (
                <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-sm font-black text-orange-950">
                    {relationship.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-orange-900">
                    {relationship.text}
                  </p>
                  <div className="mt-3">
                    <MathFormula formula={relationship.formula} display={true} />
                  </div>
                  <div className="mt-2">
                    <MathFormula
                      formula={relationship.substitution}
                      display={true}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Ative o modo de sólido inscrito para comparar volumes e ver
                  relações como raio, aresta, diagonal e altura compartilhada.
                </p>
              )}
            </Card>

            {mode === "inscribed" ? (
              <Card className="border-slate-200 p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Sparkles className="h-4 w-4" />
                  Mover sólido interno
                </div>

                <h2 className="mt-2 text-2xl font-black text-slate-900">
                  Controle de posição interna
                </h2>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">
                    Status da inscrição
                  </p>

                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {isCentered
                      ? "Centros alinhados. Em problemas clássicos, esse costuma ser o estado ideal de inscrição."
                      : "O sólido interno está deslocado. Em questões tradicionais, a inscrição perfeita geralmente exige centros coincidentes."}
                  </p>

                  {exceedsSuggestedScale ? (
                    <p className="mt-2 text-sm font-bold text-red-700">
                      A escala passou de 100%. O sólido interno provavelmente atravessa o externo.
                    </p>
                  ) : null}
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Escala interna</span>
                      <span>
                        B {formatNumber(innerBaseScale * 100)}% · H{" "}
                        {formatNumber(innerHeightScale * 100)}% · R{" "}
                        {formatNumber(innerRadiusScale * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.05"
                      step="0.01"
                      value={(innerBaseScale + innerHeightScale + innerRadiusScale) / 3}
                      onChange={(event) =>
                        setAllInnerScales(Number(event.target.value))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Profundidade Z</span>
                      <span>{innerOffsetZ.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-1.2"
                      max="1.2"
                      step="0.01"
                      value={innerOffsetZ}
                      onChange={(event) =>
                        setInnerOffsetZ(Number(event.target.value))
                      }
                      className="w-full"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={centralizeInner}
                    className="w-full rounded-2xl"
                  >
                    Centralizar e ajustar inscrição
                  </Button>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Comparação de volumes
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    <div className="flex justify-between gap-3">
                      <span>Volume externo</span>
                      <strong>{formatNumber(outerMetrics.volume)} u³</strong>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Volume interno</span>
                      <strong>{formatNumber(innerMetrics.volume)} u³</strong>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Volume em comum</span>
                      <strong>{formatNumber(occupiedVolume)} u³</strong>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Volume da união</span>
                      <strong>{formatNumber(unionVolume)} u³</strong>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Externo vazio</span>
                      <strong>{formatNumber(emptyVolume)} u³</strong>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Interno fora</span>
                      <strong>{formatNumber(innerOutsideVolume)} u³</strong>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Ocupação real</span>
                      <strong>{formatNumber(occupation)}%</strong>
                    </div>
                  </div>

                  <div className="mt-4">
                    <MathFormula
                      formula={String.raw`V_{\cap} \approx V_{\text{interseção}}`}
                      display={true}
                    />
                    <MathFormula
                      formula={String.raw`V_{\cup} = V_{\text{externo}} + V_{\text{interno}} - V_{\cap}`}
                      display={true}
                    />
                  </div>
                </div>
              </Card>
            ) : null}

            <Card className="border-slate-200 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-purple-700">
                <BadgeInfo className="h-4 w-4" />
                Como usar em questão
              </div>

              <h2 className="mt-2 text-2xl font-black text-slate-900">
                Raciocínio de prova
              </h2>

              <div className="mt-5 space-y-3">
                {[
                  "Identifique o sólido externo e o sólido interno.",
                  "Descubra qual medida é compartilhada: raio, altura, aresta, diâmetro ou diagonal.",
                  "Use os botões de ação para destacar a medida no desenho.",
                  "Escreva a fórmula da área da base antes de tentar o volume.",
                  "Compare ou subtraia volumes somente depois de relacionar as medidas.",
                ].map((step, index) => (
                  <div
                    key={step}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-black text-slate-900">
                      Passo {index + 1}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
