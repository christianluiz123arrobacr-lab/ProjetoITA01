import React, { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { MathFormula } from "@/components/MathFormula";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdvancedTheory } from "@/components/AdvancedTheory";
import { ITAOpticsTheory } from "@/content/optics/ita_optics_theory";

type MirrorType = "concavo" | "convexo";

type ImageStatus = {
  label: string;
  description: string;
  className: string;
};

const TWO_PI = 2 * Math.PI;

const formatNumber = (value: number, digits = 2) => {
  if (!Number.isFinite(value)) return "—";

  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const formatUnit = (value: number, unit: string, digits = 2) => {
  if (!Number.isFinite(value)) return "∞";
  return `${formatNumber(value, digits)} ${unit}`;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

export const MirrorsSimulator: React.FC = () => {
  const [mirrorType, setMirrorType] = useState<MirrorType>("concavo");
  const [focalMagnitude, setFocalMagnitude] = useState(100);
  const [objectDistance, setObjectDistance] = useState(200);
  const [objectHeight, setObjectHeight] = useState(50);

  const [showRays, setShowRays] = useState(true);
  const [showNotablePoints, setShowNotablePoints] = useState(true);
  const [showExtensions, setShowExtensions] = useState(true);
  const [showTable, setShowTable] = useState(true);

  const f = useMemo(() => {
    return mirrorType === "concavo" ? focalMagnitude : -focalMagnitude;
  }, [mirrorType, focalMagnitude]);

  const p = objectDistance;

  const isImageAtInfinity = useMemo(() => {
    return Math.abs(p - f) < 1e-9;
  }, [p, f]);

  const imageDistance = useMemo(() => {
    if (isImageAtInfinity) return Infinity;
    return (f * p) / (p - f);
  }, [f, p, isImageAtInfinity]);

  const magnification = useMemo(() => {
    if (isImageAtInfinity) return Infinity;
    return -imageDistance / p;
  }, [imageDistance, p, isImageAtInfinity]);

  const imageHeight = useMemo(() => {
    if (isImageAtInfinity) return Infinity;
    return magnification * objectHeight;
  }, [magnification, objectHeight, isImageAtInfinity]);

  const isVirtual = useMemo(() => {
    if (isImageAtInfinity) return false;
    return imageDistance < 0;
  }, [imageDistance, isImageAtInfinity]);

  const isUpright = useMemo(() => {
    if (isImageAtInfinity) return false;
    return imageHeight > 0;
  }, [imageHeight, isImageAtInfinity]);

  const imageSizeLabel = useMemo(() => {
    if (isImageAtInfinity) return "imprópria";
    const absA = Math.abs(magnification);

    if (Math.abs(absA - 1) < 0.03) return "igual";
    return absA > 1 ? "maior" : "menor";
  }, [magnification, isImageAtInfinity]);

  const status = useMemo<ImageStatus>(() => {
    if (isImageAtInfinity) {
      return {
        label: "Imagem imprópria",
        description:
          "O objeto está no foco. Os raios refletidos saem paralelos e a imagem se forma no infinito.",
        className: "text-amber-700",
      };
    }

    if (isVirtual) {
      return {
        label: "Imagem virtual",
        description:
          "A imagem se forma atrás do espelho. Ela aparece pelo prolongamento dos raios refletidos.",
        className: "text-purple-700",
      };
    }

    return {
      label: "Imagem real",
      description:
        "A imagem se forma na frente do espelho, pelo cruzamento real dos raios refletidos.",
      className: "text-emerald-700",
    };
  }, [isImageAtInfinity, isVirtual]);

  const resetDefault = () => {
    setMirrorType("concavo");
    setFocalMagnitude(100);
    setObjectDistance(200);
    setObjectHeight(50);
    setShowRays(true);
    setShowNotablePoints(true);
    setShowExtensions(true);
    setShowTable(true);
  };

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-4">
          <Card className="border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                Controles dos Espelhos
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Ajuste o tipo de espelho, a distância focal, a posição e a altura
                do objeto.
              </p>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="mb-4 text-sm font-bold text-blue-900">
                  Tipo de espelho
                </p>

                <Select
                  value={mirrorType}
                  onValueChange={(value) => setMirrorType(value as MirrorType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="concavo">
                      Côncavo, convergente
                    </SelectItem>

                    <SelectItem value="convexo">
                      Convexo, divergente
                    </SelectItem>
                  </SelectContent>
                </Select>

                <p className="mt-3 text-xs leading-relaxed text-blue-800">
                  {mirrorType === "concavo"
                    ? "Espelho côncavo tem foco real na frente do espelho."
                    : "Espelho convexo tem foco virtual atrás do espelho."}
                </p>
              </div>

              <ControlRow
                label="Distância focal"
                symbol="|f|"
                value={formatUnit(focalMagnitude, "cm")}
              >
                <Slider
                  value={[focalMagnitude]}
                  onValueChange={(value) => setFocalMagnitude(value[0])}
                  min={20}
                  max={150}
                  step={5}
                  className="w-full"
                />
              </ControlRow>

              <ControlRow
                label="Distância do objeto"
                symbol="p"
                value={formatUnit(objectDistance, "cm")}
              >
                <Slider
                  value={[objectDistance]}
                  onValueChange={(value) => setObjectDistance(value[0])}
                  min={20}
                  max={300}
                  step={5}
                  className="w-full"
                />
              </ControlRow>

              <ControlRow
                label="Altura do objeto"
                symbol="o"
                value={formatUnit(objectHeight, "cm")}
              >
                <Slider
                  value={[objectHeight]}
                  onValueChange={(value) => setObjectHeight(value[0])}
                  min={10}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </ControlRow>

              <div className="grid grid-cols-2 gap-3">
                <ToggleButton
                  active={showRays}
                  onClick={() => setShowRays((previous) => !previous)}
                >
                  Raios
                </ToggleButton>

                <ToggleButton
                  active={showNotablePoints}
                  onClick={() => setShowNotablePoints((previous) => !previous)}
                >
                  Pontos
                </ToggleButton>

                <ToggleButton
                  active={showExtensions}
                  onClick={() => setShowExtensions((previous) => !previous)}
                >
                  Prolong.
                </ToggleButton>

                <ToggleButton
                  active={showTable}
                  onClick={() => setShowTable((previous) => !previous)}
                >
                  Tabela
                </ToggleButton>

                <button
                  type="button"
                  onClick={resetDefault}
                  className="col-span-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Restaurar padrão
                </button>
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h4 className="text-base font-bold text-slate-900">
                Resultados principais
              </h4>
            </div>

            <div className="space-y-3 p-5">
              <MetricCard
                label="Natureza da imagem"
                value={status.label}
                description={status.description}
                valueClassName={status.className}
              />

              <MetricCard
                label="Distância focal com sinal"
                value={`f = ${formatNumber(f, 2)} cm`}
                description={
                  mirrorType === "concavo"
                    ? "Côncavo: foco real, f positivo."
                    : "Convexo: foco virtual, f negativo."
                }
                valueClassName={f > 0 ? "text-blue-700" : "text-purple-700"}
              />

              <MetricCard
                label="Distância da imagem"
                value={
                  isImageAtInfinity
                    ? "p' = ∞"
                    : `p' = ${formatNumber(imageDistance, 2)} cm`
                }
                description={
                  isImageAtInfinity
                    ? "Imagem no infinito."
                    : imageDistance > 0
                    ? "Imagem na frente do espelho."
                    : "Imagem atrás do espelho."
                }
                valueClassName={
                  isImageAtInfinity
                    ? "text-amber-700"
                    : imageDistance > 0
                    ? "text-emerald-700"
                    : "text-purple-700"
                }
              />

              <MetricCard
                label="Aumento linear"
                value={
                  isImageAtInfinity
                    ? "A = ∞"
                    : `A = ${formatNumber(magnification, 2)}`
                }
                description={
                  isImageAtInfinity
                    ? "O aumento tende ao infinito."
                    : `Imagem ${isUpright ? "direita" : "invertida"} e ${imageSizeLabel}.`
                }
              />

              <MetricCard
                label="Altura da imagem"
                value={
                  isImageAtInfinity
                    ? "i = ∞"
                    : `i = ${formatNumber(imageHeight, 2)} cm`
                }
                valueClassName={isUpright ? "text-blue-700" : "text-red-700"}
              />

              <MetricCard
                label="Orientação"
                value={
                  isImageAtInfinity
                    ? "imprópria"
                    : isUpright
                    ? "direita"
                    : "invertida"
                }
              />
            </div>
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-8">
          <Card className="overflow-hidden border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h4 className="text-base font-bold text-slate-900">
                Visualização do Espelho
              </h4>
              <p className="mt-1 text-sm text-slate-500">
                Raios principais, foco, centro de curvatura, objeto e imagem.
                Sim, agora o espelho realmente parece ensinar Óptica.
              </p>
            </div>

            <div className="bg-slate-50 p-4 md:p-5">
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="overflow-x-auto">
                  <MirrorDiagram
                    mirrorType={mirrorType}
                    f={f}
                    focalMagnitude={focalMagnitude}
                    p={p}
                    objectHeight={objectHeight}
                    imageDistance={imageDistance}
                    imageHeight={imageHeight}
                    magnification={magnification}
                    isImageAtInfinity={isImageAtInfinity}
                    isVirtual={isVirtual}
                    showRays={showRays}
                    showNotablePoints={showNotablePoints}
                    showExtensions={showExtensions}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h4 className="text-base font-bold text-slate-900">
                Cálculos rápidos
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <CalcMiniCard
                title="Dados de entrada"
                values={[
                  ["tipo", mirrorType === "concavo" ? "côncavo" : "convexo"],
                  ["f", `${formatNumber(f, 2)} cm`],
                  ["p", formatUnit(p, "cm")],
                  ["o", formatUnit(objectHeight, "cm")],
                ]}
              />

              <CalcMiniCard
                title="Imagem"
                values={[
                  [
                    "p'",
                    isImageAtInfinity
                      ? "∞"
                      : `${formatNumber(imageDistance, 2)} cm`,
                  ],
                  [
                    "i",
                    isImageAtInfinity
                      ? "∞"
                      : `${formatNumber(imageHeight, 2)} cm`,
                  ],
                  [
                    "A",
                    isImageAtInfinity ? "∞" : formatNumber(magnification, 2),
                  ],
                  ["natureza", isImageAtInfinity ? "imprópria" : isVirtual ? "virtual" : "real"],
                ]}
              />

              <CalcMiniCard
                title="Características"
                values={[
                  ["orientação", isImageAtInfinity ? "imprópria" : isUpright ? "direita" : "invertida"],
                  ["tamanho", imageSizeLabel],
                  ["posição", isImageAtInfinity ? "infinito" : imageDistance > 0 ? "frente" : "atrás"],
                  ["caso", status.label],
                ]}
              />

              <CalcMiniCard
                title="Pontos notáveis"
                values={[
                  ["F", `${formatNumber(f, 2)} cm`],
                  ["C", `${formatNumber(2 * f, 2)} cm`],
                  ["V", "0 cm"],
                  ["R", `${formatNumber(2 * focalMagnitude, 2)} cm`],
                ]}
              />
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h4 className="text-base font-bold text-slate-900">
                Equações dos espelhos
              </h4>
            </div>

            <div className="space-y-5 p-5">
              <FormulaSection
                title="Equação de Gauss"
                formulas={[
                  String.raw`\frac{1}{f} = \frac{1}{p} + \frac{1}{p'}`,
                  String.raw`p' = \frac{fp}{p-f}`,
                  String.raw`p' = \frac{(${formatNumber(f, 2)})(${formatNumber(
                    p,
                    2
                  )})}{${formatNumber(p, 2)} - (${formatNumber(f, 2)})}`,
                  isImageAtInfinity
                    ? String.raw`p' \to \infty`
                    : String.raw`p' = ${formatNumber(
                        imageDistance,
                        3
                      )}\,\text{cm}`,
                ]}
              />

              <FormulaSection
                title="Aumento linear transversal"
                formulas={[
                  String.raw`A = \frac{i}{o} = -\frac{p'}{p}`,
                  isImageAtInfinity
                    ? String.raw`A \to \infty`
                    : String.raw`A = -\frac{${formatNumber(
                        imageDistance,
                        3
                      )}}{${formatNumber(p, 3)}}`,
                  isImageAtInfinity
                    ? String.raw`i \to \infty`
                    : String.raw`A = ${formatNumber(magnification, 3)}`,
                  isImageAtInfinity
                    ? String.raw`\text{Imagem imprópria.}`
                    : String.raw`i = A\cdot o = ${formatNumber(
                        imageHeight,
                        3
                      )}\,\text{cm}`,
                ]}
              />

              <FormulaSection
                title="Relação entre foco e raio de curvatura"
                formulas={[
                  String.raw`f = \frac{R}{2}`,
                  String.raw`R = 2f`,
                  String.raw`|R| = 2|f| = 2\cdot ${formatNumber(
                    focalMagnitude,
                    2
                  )}`,
                  String.raw`|R| = ${formatNumber(
                    2 * focalMagnitude,
                    2
                  )}\,\text{cm}`,
                ]}
              />

              <FormulaSection
                title="Convenção de sinais"
                formulas={[
                  String.raw`f > 0 \Rightarrow \text{espelho côncavo}`,
                  String.raw`f < 0 \Rightarrow \text{espelho convexo}`,
                  String.raw`p' > 0 \Rightarrow \text{imagem real}`,
                  String.raw`p' < 0 \Rightarrow \text{imagem virtual}`,
                  String.raw`A > 0 \Rightarrow \text{imagem direita}`,
                  String.raw`A < 0 \Rightarrow \text{imagem invertida}`,
                ]}
              />
            </div>
          </Card>

          {showTable && (
            <Card className="border border-slate-200 shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h4 className="text-base font-bold text-slate-900">
                  Casos clássicos
                </h4>
              </div>

              <ClassicCasesTable focalMagnitude={focalMagnitude} />
            </Card>
          )}
        </div>
      </div>

      <AdvancedTheory
        title={ITAOpticsTheory.title}
        introduction={ITAOpticsTheory.introduction}
        sections={ITAOpticsTheory.sections}
      />
    </div>
  );
};

function MirrorDiagram({
  mirrorType,
  f,
  focalMagnitude,
  p,
  objectHeight,
  imageDistance,
  imageHeight,
  magnification,
  isImageAtInfinity,
  isVirtual,
  showRays,
  showNotablePoints,
  showExtensions,
}: {
  mirrorType: MirrorType;
  f: number;
  focalMagnitude: number;
  p: number;
  objectHeight: number;
  imageDistance: number;
  imageHeight: number;
  magnification: number;
  isImageAtInfinity: boolean;
  isVirtual: boolean;
  showRays: boolean;
  showNotablePoints: boolean;
  showExtensions: boolean;
}) {
  const width = 940;
  const height = 460;
  const vertexX = 500;
  const axisY = 230;

  const allDistances = [
    p,
    f,
    2 * f,
    -focalMagnitude,
    focalMagnitude,
    -2 * focalMagnitude,
    2 * focalMagnitude,
  ];

  if (Number.isFinite(imageDistance)) {
    allDistances.push(imageDistance);
  }

  const minDistance = Math.min(...allDistances, -260);
  const maxDistance = Math.max(...allDistances, 320);
  const span = Math.max(maxDistance - minDistance, 500);
  const scale = Math.min(1.45, 720 / span);

  const distanceToX = (distance: number) => {
    return vertexX - distance * scale;
  };

  const heightToY = (value: number) => {
    return axisY - value * 0.9;
  };

  const objectX = distanceToX(p);
  const objectTipY = heightToY(objectHeight);

  const finiteImageDistance = Number.isFinite(imageDistance)
    ? imageDistance
    : 5000;

  const displayImageDistance = Number.isFinite(imageDistance)
    ? clamp(imageDistance, -300, 380)
    : 380;

  const imageX = distanceToX(displayImageDistance);
  const imageTipY = Number.isFinite(imageHeight)
    ? heightToY(clamp(imageHeight, -150, 150))
    : heightToY(-150);

  const focusX = distanceToX(f);
  const centerX = distanceToX(2 * f);

  const imageIsOutOfView =
    Number.isFinite(imageDistance) &&
    Math.abs(imageDistance - displayImageDistance) > 1e-6;

  const mirrorPath =
    mirrorType === "concavo"
      ? `M ${vertexX} 75 Q ${vertexX + 42} ${axisY} ${vertexX} 385`
      : `M ${vertexX} 75 Q ${vertexX - 42} ${axisY} ${vertexX} 385`;

  const rayMirrorPointX = vertexX;
  const rayMirrorPointY = objectTipY;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="mx-auto w-full min-w-[840px] rounded-lg border border-slate-800 bg-slate-950"
    >
      <defs>
        <marker
          id="mirror-arrow-red"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
        </marker>

        <marker
          id="mirror-arrow-blue"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
        </marker>

        <marker
          id="mirror-arrow-yellow"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#facc15" />
        </marker>

        <marker
          id="mirror-arrow-green"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
        </marker>
      </defs>

      <rect x="0" y="0" width={width} height={height} fill="#0f172a" />

      <line
        x1="35"
        y1={axisY}
        x2={width - 35}
        y2={axisY}
        stroke="#e5e7eb"
        strokeWidth="2"
        opacity="0.65"
      />

      <text x="42" y={axisY - 12} fill="#cbd5e1" fontSize="13" fontWeight="700">
        eixo principal
      </text>

      <path d={mirrorPath} fill="none" stroke="#94a3b8" strokeWidth="6" />

      {Array.from({ length: 19 }).map((_, index) => {
        const y = 85 + index * 16;
        const direction = mirrorType === "concavo" ? 1 : -1;

        return (
          <line
            key={index}
            x1={vertexX + direction * 8}
            y1={y}
            x2={vertexX + direction * 24}
            y2={y + 12}
            stroke="#64748b"
            strokeWidth="2"
          />
        );
      })}

      <circle cx={vertexX} cy={axisY} r="5" fill="#f8fafc" />
      <text x={vertexX + 10} y={axisY + 18} fill="#f8fafc" fontSize="13" fontWeight="700">
        V
      </text>

      {showNotablePoints && (
        <>
          <circle cx={focusX} cy={axisY} r="5" fill="#facc15" />
          <text x={focusX - 4} y={axisY + 24} fill="#facc15" fontSize="13" fontWeight="800">
            F
          </text>

          <circle cx={centerX} cy={axisY} r="5" fill="#facc15" opacity="0.8" />
          <text x={centerX - 5} y={axisY + 24} fill="#facc15" fontSize="13" fontWeight="800">
            C
          </text>

          <line
            x1={focusX}
            y1={axisY - 12}
            x2={focusX}
            y2={axisY + 12}
            stroke="#facc15"
            strokeWidth="2"
          />

          <line
            x1={centerX}
            y1={axisY - 12}
            x2={centerX}
            y2={axisY + 12}
            stroke="#facc15"
            strokeWidth="2"
          />
        </>
      )}

      <line
        x1={objectX}
        y1={axisY}
        x2={objectX}
        y2={objectTipY}
        stroke="#ef4444"
        strokeWidth="5"
        markerEnd="url(#mirror-arrow-red)"
      />

      <text
        x={objectX - 18}
        y={objectTipY - 16}
        fill="#ef4444"
        fontSize="14"
        fontWeight="800"
      >
        objeto
      </text>

      <text
        x={objectX - 28}
        y={axisY + 34}
        fill="#fca5a5"
        fontSize="13"
        fontWeight="700"
      >
        p = {formatNumber(p, 0)} cm
      </text>

      {!isImageAtInfinity && (
        <>
          <line
            x1={imageX}
            y1={axisY}
            x2={imageX}
            y2={imageTipY}
            stroke="#3b82f6"
            strokeWidth="5"
            strokeDasharray={isVirtual ? "8 6" : undefined}
            markerEnd="url(#mirror-arrow-blue)"
            opacity={imageIsOutOfView ? 0.65 : 1}
          />

          <text
            x={imageX - 22}
            y={imageTipY + (imageHeight >= 0 ? -16 : 28)}
            fill="#3b82f6"
            fontSize="14"
            fontWeight="800"
          >
            imagem
          </text>

          <text
            x={imageX - 42}
            y={axisY + 54}
            fill="#93c5fd"
            fontSize="13"
            fontWeight="700"
          >
            p' = {formatNumber(imageDistance, 1)} cm
          </text>
        </>
      )}

      {isImageAtInfinity && (
        <g>
          <rect
            x={vertexX - 165}
            y="35"
            width="330"
            height="38"
            rx="12"
            fill="rgba(245, 158, 11, 0.16)"
            stroke="#f59e0b"
          />

          <text
            x={vertexX}
            y="60"
            textAnchor="middle"
            fill="#fde68a"
            fontSize="15"
            fontWeight="800"
          >
            OBJETO NO FOCO: IMAGEM NO INFINITO
          </text>
        </g>
      )}

      {showRays && !isImageAtInfinity && (
        <>
          <line
            x1={objectX}
            y1={objectTipY}
            x2={rayMirrorPointX}
            y2={rayMirrorPointY}
            stroke="#facc15"
            strokeWidth="3"
            markerEnd="url(#mirror-arrow-yellow)"
          />

          <line
            x1={rayMirrorPointX}
            y1={rayMirrorPointY}
            x2={imageX}
            y2={imageTipY}
            stroke="#facc15"
            strokeWidth="3"
            strokeDasharray={isVirtual ? "8 6" : undefined}
            markerEnd={isVirtual ? undefined : "url(#mirror-arrow-yellow)"}
            opacity={isVirtual ? 0.55 : 1}
          />

          <line
            x1={objectX}
            y1={objectTipY}
            x2={vertexX}
            y2={axisY}
            stroke="#22c55e"
            strokeWidth="3"
            markerEnd="url(#mirror-arrow-green)"
          />

          <line
            x1={vertexX}
            y1={axisY}
            x2={imageX}
            y2={imageTipY}
            stroke="#22c55e"
            strokeWidth="3"
            strokeDasharray={isVirtual ? "8 6" : undefined}
            markerEnd={isVirtual ? undefined : "url(#mirror-arrow-green)"}
            opacity={isVirtual ? 0.55 : 1}
          />

          {isVirtual && showExtensions && (
            <>
              <line
                x1={vertexX}
                y1={rayMirrorPointY}
                x2={imageX}
                y2={imageTipY}
                stroke="#facc15"
                strokeWidth="2"
                strokeDasharray="5 7"
                opacity="0.45"
              />

              <line
                x1={vertexX}
                y1={axisY}
                x2={imageX}
                y2={imageTipY}
                stroke="#22c55e"
                strokeWidth="2"
                strokeDasharray="5 7"
                opacity="0.45"
              />
            </>
          )}
        </>
      )}

      {showRays && isImageAtInfinity && (
        <>
          <line
            x1={objectX}
            y1={objectTipY}
            x2={vertexX}
            y2={objectTipY}
            stroke="#facc15"
            strokeWidth="3"
            markerEnd="url(#mirror-arrow-yellow)"
          />

          <line
            x1={vertexX}
            y1={objectTipY}
            x2={width - 60}
            y2={objectTipY}
            stroke="#facc15"
            strokeWidth="3"
            markerEnd="url(#mirror-arrow-yellow)"
          />

          <line
            x1={objectX}
            y1={objectTipY}
            x2={vertexX}
            y2={axisY}
            stroke="#22c55e"
            strokeWidth="3"
            markerEnd="url(#mirror-arrow-green)"
          />

          <line
            x1={vertexX}
            y1={axisY}
            x2={width - 60}
            y2={axisY}
            stroke="#22c55e"
            strokeWidth="3"
            markerEnd="url(#mirror-arrow-green)"
          />
        </>
      )}

      <rect
        x={width - 270}
        y="24"
        width="238"
        height="134"
        rx="16"
        fill="rgba(15, 23, 42, 0.84)"
        stroke="#334155"
      />

      <text x={width - 248} y="52" fill="#f8fafc" fontSize="14" fontWeight="800">
        Diagnóstico
      </text>

      <text x={width - 248} y="78" fill="#cbd5e1" fontSize="13">
        espelho: {mirrorType === "concavo" ? "côncavo" : "convexo"}
      </text>

      <text x={width - 248} y="100" fill="#cbd5e1" fontSize="13">
        f = {formatNumber(f, 1)} cm
      </text>

      <text x={width - 248} y="122" fill="#cbd5e1" fontSize="13">
        p' = {isImageAtInfinity ? "∞" : `${formatNumber(imageDistance, 1)} cm`}
      </text>

      <text
        x={width - 248}
        y="144"
        fill={isImageAtInfinity ? "#fde68a" : isVirtual ? "#c4b5fd" : "#86efac"}
        fontSize="13"
        fontWeight="800"
      >
        {isImageAtInfinity ? "imagem imprópria" : isVirtual ? "virtual" : "real"}
      </text>

      {imageIsOutOfView && (
        <text x="42" y={height - 32} fill="#fbbf24" fontSize="13" fontWeight="700">
          A imagem calculada está fora da escala visual. O valor numérico está correto nos cards.
        </text>
      )}
    </svg>
  );
}

function ClassicCasesTable({ focalMagnitude }: { focalMagnitude: number }) {
  const rows = [
    {
      position: "Objeto além de C",
      condition: `p > ${formatNumber(2 * focalMagnitude, 0)} cm`,
      image: "real, invertida e menor",
      mirror: "côncavo",
    },
    {
      position: "Objeto em C",
      condition: `p = ${formatNumber(2 * focalMagnitude, 0)} cm`,
      image: "real, invertida e igual",
      mirror: "côncavo",
    },
    {
      position: "Objeto entre C e F",
      condition: `${formatNumber(focalMagnitude, 0)} cm < p < ${formatNumber(
        2 * focalMagnitude,
        0
      )} cm`,
      image: "real, invertida e maior",
      mirror: "côncavo",
    },
    {
      position: "Objeto em F",
      condition: `p = ${formatNumber(focalMagnitude, 0)} cm`,
      image: "imprópria, no infinito",
      mirror: "côncavo",
    },
    {
      position: "Objeto entre F e V",
      condition: `p < ${formatNumber(focalMagnitude, 0)} cm`,
      image: "virtual, direita e maior",
      mirror: "côncavo",
    },
    {
      position: "Qualquer posição real",
      condition: "p > 0",
      image: "virtual, direita e menor",
      mirror: "convexo",
    },
  ];

  return (
    <div className="overflow-x-auto p-5">
      <table className="w-full min-w-[740px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 text-left font-bold text-slate-700">
              Caso
            </th>
            <th className="px-4 py-3 text-left font-bold text-slate-700">
              Condição
            </th>
            <th className="px-4 py-3 text-left font-bold text-blue-700">
              Imagem
            </th>
            <th className="px-4 py-3 text-left font-bold text-slate-700">
              Espelho
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={`${row.position}-${row.mirror}`} className="border-b border-slate-100">
              <td className="px-4 py-3 font-semibold text-slate-900">
                {row.position}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {row.condition}
              </td>
              <td className="px-4 py-3 font-semibold text-blue-700">
                {row.image}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {row.mirror}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ControlRow({
  label,
  symbol,
  value,
  children,
}: {
  label: string;
  symbol: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label className="text-sm font-medium text-slate-700">
          {label} <span className="text-slate-500">({symbol})</span>
        </label>

        <span className="text-sm font-bold text-slate-900">{value}</span>
      </div>

      {children}
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-bold ${
        active
          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function MetricCard({
  label,
  value,
  description,
  valueClassName = "text-slate-900",
}: {
  label: React.ReactNode;
  value: string;
  description?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className={`mt-2 text-lg font-bold ${valueClassName}`}>{value}</p>

      {description && (
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

function CalcMiniCard({
  title,
  values,
}: {
  title: string;
  values: [string, string][];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 text-sm font-bold text-slate-800">{title}</p>

      <div className="space-y-2">
        {values.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-600">{label}</span>
            <span className="text-sm font-bold text-slate-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormulaSection({
  title,
  formulas,
}: {
  title: string;
  formulas: string[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 text-sm font-semibold text-slate-700">{title}</p>

      <div className="space-y-3 overflow-x-auto rounded-lg border border-slate-200 bg-white p-4">
        {formulas.map((formula, index) => (
          <MathFormula key={`${formula}-${index}`} formula={formula} />
        ))}
      </div>
    </div>
  );
}

export default MirrorsSimulator;
