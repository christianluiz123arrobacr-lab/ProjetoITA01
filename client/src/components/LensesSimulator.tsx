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

type LensType = "convergente" | "divergente";

type ImageStatus = {
  label: string;
  description: string;
  className: string;
};

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

export const LensesSimulator: React.FC = () => {
  const [lensType, setLensType] = useState<LensType>("convergente");
  const [focalMagnitude, setFocalMagnitude] = useState(100);
  const [objectDistance, setObjectDistance] = useState(200);
  const [objectHeight, setObjectHeight] = useState(50);

  const [showRays, setShowRays] = useState(true);
  const [showNotablePoints, setShowNotablePoints] = useState(true);
  const [showExtensions, setShowExtensions] = useState(true);
  const [showTable, setShowTable] = useState(true);

  const f = useMemo(() => {
    return lensType === "convergente" ? focalMagnitude : -focalMagnitude;
  }, [lensType, focalMagnitude]);

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

  const lensPower = useMemo(() => {
    return 100 / f;
  }, [f]);

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
          "O objeto está no foco. Os raios emergem paralelos e a imagem se forma no infinito.",
        className: "text-amber-700",
      };
    }

    if (isVirtual) {
      return {
        label: "Imagem virtual",
        description:
          "A imagem se forma no mesmo lado do objeto, pelo prolongamento dos raios emergentes.",
        className: "text-purple-700",
      };
    }

    return {
      label: "Imagem real",
      description:
        "A imagem se forma no lado oposto ao objeto, pelo encontro real dos raios emergentes.",
      className: "text-emerald-700",
    };
  }, [isImageAtInfinity, isVirtual]);

  const resetDefault = () => {
    setLensType("convergente");
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
                Controles das Lentes
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Ajuste o tipo de lente, a distância focal, a posição e a altura
                do objeto.
              </p>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="mb-4 text-sm font-bold text-blue-900">
                  Tipo de lente
                </p>

                <Select
                  value={lensType}
                  onValueChange={(value) => setLensType(value as LensType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="convergente">
                      Convergente, bordas finas
                    </SelectItem>

                    <SelectItem value="divergente">
                      Divergente, bordas grossas
                    </SelectItem>
                  </SelectContent>
                </Select>

                <p className="mt-3 text-xs leading-relaxed text-blue-800">
                  {lensType === "convergente"
                    ? "Lente convergente tem foco real e distância focal positiva."
                    : "Lente divergente tem foco virtual e distância focal negativa."}
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
                  lensType === "convergente"
                    ? "Convergente: f positivo."
                    : "Divergente: f negativo."
                }
                valueClassName={f > 0 ? "text-blue-700" : "text-purple-700"}
              />

              <MetricCard
                label="Potência da lente"
                value={`P = ${formatNumber(lensPower, 2)} di`}
                description="Em dioptrias, usando f em metros."
                valueClassName={lensPower > 0 ? "text-blue-700" : "text-purple-700"}
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
                    ? "Imagem no lado oposto ao objeto."
                    : "Imagem no mesmo lado do objeto."
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
            </div>
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-8">
          <Card className="overflow-hidden border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h4 className="text-base font-bold text-slate-900">
                Visualização da Lente
              </h4>

              <p className="mt-1 text-sm text-slate-500">
                Raios principais, focos, objeto e imagem. A luz atravessa a lente
                e ainda assim consegue causar menos confusão que muito deploy.
              </p>
            </div>

            <div className="bg-slate-50 p-4 md:p-5">
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="overflow-x-auto">
                  <LensDiagram
                    lensType={lensType}
                    f={f}
                    focalMagnitude={focalMagnitude}
                    p={p}
                    objectHeight={objectHeight}
                    imageDistance={imageDistance}
                    imageHeight={imageHeight}
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
                  ["tipo", lensType === "convergente" ? "convergente" : "divergente"],
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
                  [
                    "natureza",
                    isImageAtInfinity
                      ? "imprópria"
                      : isVirtual
                      ? "virtual"
                      : "real",
                  ],
                ]}
              />

              <CalcMiniCard
                title="Características"
                values={[
                  [
                    "orientação",
                    isImageAtInfinity
                      ? "imprópria"
                      : isUpright
                      ? "direita"
                      : "invertida",
                  ],
                  ["tamanho", imageSizeLabel],
                  [
                    "posição",
                    isImageAtInfinity
                      ? "infinito"
                      : imageDistance > 0
                      ? "lado oposto"
                      : "mesmo lado",
                  ],
                  ["caso", status.label],
                ]}
              />

              <CalcMiniCard
                title="Focos e potência"
                values={[
                  ["F", `${formatNumber(f, 2)} cm`],
                  ["2F", `${formatNumber(2 * f, 2)} cm`],
                  ["P", `${formatNumber(lensPower, 2)} di`],
                  ["|f| em m", `${formatNumber(focalMagnitude / 100, 2)} m`],
                ]}
              />
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h4 className="text-base font-bold text-slate-900">
                Equações das lentes
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
                    ? String.raw`A \to \infty`
                    : String.raw`A = ${formatNumber(magnification, 3)}`,
                  isImageAtInfinity
                    ? String.raw`i \to \infty`
                    : String.raw`i = A\cdot o = ${formatNumber(
                        imageHeight,
                        3
                      )}\,\text{cm}`,
                ]}
              />

              <FormulaSection
                title="Potência da lente"
                formulas={[
                  String.raw`P = \frac{1}{f}`,
                  String.raw`\text{com } f \text{ em metros}`,
                  String.raw`f = ${formatNumber(f / 100, 3)}\,\text{m}`,
                  String.raw`P = \frac{1}{${formatNumber(
                    f / 100,
                    3
                  )}} = ${formatNumber(lensPower, 3)}\,\text{di}`,
                ]}
              />

              <FormulaSection
                title="Convenção de sinais"
                formulas={[
                  String.raw`f > 0 \Rightarrow \text{lente convergente}`,
                  String.raw`f < 0 \Rightarrow \text{lente divergente}`,
                  String.raw`p' > 0 \Rightarrow \text{imagem real, lado oposto ao objeto}`,
                  String.raw`p' < 0 \Rightarrow \text{imagem virtual, mesmo lado do objeto}`,
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

              <ClassicLensCasesTable focalMagnitude={focalMagnitude} />
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

function LensDiagram({
  lensType,
  f,
  focalMagnitude,
  p,
  objectHeight,
  imageDistance,
  imageHeight,
  isImageAtInfinity,
  isVirtual,
  showRays,
  showNotablePoints,
  showExtensions,
}: {
  lensType: LensType;
  f: number;
  focalMagnitude: number;
  p: number;
  objectHeight: number;
  imageDistance: number;
  imageHeight: number;
  isImageAtInfinity: boolean;
  isVirtual: boolean;
  showRays: boolean;
  showNotablePoints: boolean;
  showExtensions: boolean;
}) {
  const width = 940;
  const height = 460;
  const lensX = 470;
  const axisY = 230;

  const allDistances = [
    -p,
    focalMagnitude,
    -focalMagnitude,
    2 * focalMagnitude,
    -2 * focalMagnitude,
  ];

  if (Number.isFinite(imageDistance)) {
    allDistances.push(imageDistance);
  }

  const minDistance = Math.min(...allDistances, -330);
  const maxDistance = Math.max(...allDistances, 330);
  const span = Math.max(maxDistance - minDistance, 540);
  const scale = Math.min(1.25, 760 / span);

  const signedDistanceToX = (signedDistance: number) => {
    return lensX + signedDistance * scale;
  };

  const heightToY = (value: number) => {
    return axisY - value * 0.9;
  };

  const objectX = signedDistanceToX(-p);
  const objectTipY = heightToY(objectHeight);

  const displayImageDistance = Number.isFinite(imageDistance)
    ? clamp(imageDistance, -360, 390)
    : 390;

  const imageX = signedDistanceToX(displayImageDistance);
  const imageTipY = Number.isFinite(imageHeight)
    ? heightToY(clamp(imageHeight, -150, 150))
    : heightToY(-150);

  const leftFocusX = signedDistanceToX(-focalMagnitude);
  const rightFocusX = signedDistanceToX(focalMagnitude);
  const leftDoubleFocusX = signedDistanceToX(-2 * focalMagnitude);
  const rightDoubleFocusX = signedDistanceToX(2 * focalMagnitude);

  const imageIsOutOfView =
    Number.isFinite(imageDistance) &&
    Math.abs(imageDistance - displayImageDistance) > 1e-6;

  const leftFocusLabel = lensType === "convergente" ? "F" : "F'";
  const rightFocusLabel = lensType === "convergente" ? "F'" : "F";

  const lensTopY = 70;
  const lensBottomY = 390;

  const rayParallelLensPoint = {
    x: lensX,
    y: objectTipY,
  };

  const centralRayRightX = width - 55;
  const centralRaySlope = (axisY - objectTipY) / (lensX - objectX);
  const centralRayRightY = axisY + centralRaySlope * (centralRayRightX - lensX);

  const parallelRayActualRightX = width - 55;
  const parallelRayActualRightY =
    isVirtual && Number.isFinite(imageDistance)
      ? getLineYThroughTwoPoints(
          imageX,
          imageTipY,
          lensX,
          objectTipY,
          parallelRayActualRightX
        )
      : !isImageAtInfinity && Number.isFinite(imageDistance)
      ? getLineYThroughTwoPoints(
          lensX,
          objectTipY,
          imageX,
          imageTipY,
          parallelRayActualRightX
        )
      : objectTipY;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="mx-auto w-full min-w-[840px] rounded-lg border border-slate-800 bg-slate-950"
    >
      <defs>
        <marker
          id="lens-arrow-red"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
        </marker>

        <marker
          id="lens-arrow-blue"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
        </marker>

        <marker
          id="lens-arrow-yellow"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#facc15" />
        </marker>

        <marker
          id="lens-arrow-green"
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

      <line
        x1={lensX}
        y1={lensTopY}
        x2={lensX}
        y2={lensBottomY}
        stroke="#94a3b8"
        strokeWidth="4"
      />

      {lensType === "convergente" ? (
        <>
          <path
            d={`M ${lensX - 10} ${lensTopY + 12} L ${lensX} ${lensTopY} L ${
              lensX + 10
            } ${lensTopY + 12}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3"
          />

          <path
            d={`M ${lensX - 10} ${lensBottomY - 12} L ${lensX} ${lensBottomY} L ${
              lensX + 10
            } ${lensBottomY - 12}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3"
          />
        </>
      ) : (
        <>
          <path
            d={`M ${lensX - 10} ${lensTopY} L ${lensX} ${lensTopY + 16} L ${
              lensX + 10
            } ${lensTopY}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3"
          />

          <path
            d={`M ${lensX - 10} ${lensBottomY} L ${lensX} ${
              lensBottomY - 16
            } L ${lensX + 10} ${lensBottomY}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3"
          />
        </>
      )}

      <circle cx={lensX} cy={axisY} r="5" fill="#f8fafc" />
      <text x={lensX + 10} y={axisY + 18} fill="#f8fafc" fontSize="13" fontWeight="700">
        O
      </text>

      {showNotablePoints && (
        <>
          <circle cx={leftFocusX} cy={axisY} r="5" fill="#facc15" />
          <text x={leftFocusX - 8} y={axisY + 24} fill="#facc15" fontSize="13" fontWeight="800">
            {leftFocusLabel}
          </text>

          <circle cx={rightFocusX} cy={axisY} r="5" fill="#facc15" />
          <text x={rightFocusX - 8} y={axisY + 24} fill="#facc15" fontSize="13" fontWeight="800">
            {rightFocusLabel}
          </text>

          <circle cx={leftDoubleFocusX} cy={axisY} r="4" fill="#facc15" opacity="0.75" />
          <text x={leftDoubleFocusX - 15} y={axisY + 42} fill="#facc15" fontSize="12" fontWeight="700">
            2{leftFocusLabel}
          </text>

          <circle cx={rightDoubleFocusX} cy={axisY} r="4" fill="#facc15" opacity="0.75" />
          <text x={rightDoubleFocusX - 15} y={axisY + 42} fill="#facc15" fontSize="12" fontWeight="700">
            2{rightFocusLabel}
          </text>
        </>
      )}

      <line
        x1={objectX}
        y1={axisY}
        x2={objectX}
        y2={objectTipY}
        stroke="#ef4444"
        strokeWidth="5"
        markerEnd="url(#lens-arrow-red)"
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
            markerEnd="url(#lens-arrow-blue)"
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
            x={lensX - 165}
            y="35"
            width="330"
            height="38"
            rx="12"
            fill="rgba(245, 158, 11, 0.16)"
            stroke="#f59e0b"
          />

          <text
            x={lensX}
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

      {showRays && (
        <>
          <line
            x1={objectX}
            y1={objectTipY}
            x2={lensX}
            y2={objectTipY}
            stroke="#facc15"
            strokeWidth="3"
            markerEnd="url(#lens-arrow-yellow)"
          />

          <line
            x1={lensX}
            y1={objectTipY}
            x2={parallelRayActualRightX}
            y2={parallelRayActualRightY}
            stroke="#facc15"
            strokeWidth="3"
            markerEnd="url(#lens-arrow-yellow)"
          />

          {isVirtual && showExtensions && !isImageAtInfinity && (
            <line
              x1={lensX}
              y1={objectTipY}
              x2={imageX}
              y2={imageTipY}
              stroke="#facc15"
              strokeWidth="2"
              strokeDasharray="5 7"
              opacity="0.55"
            />
          )}

          <line
            x1={objectX}
            y1={objectTipY}
            x2={lensX}
            y2={axisY}
            stroke="#22c55e"
            strokeWidth="3"
            markerEnd="url(#lens-arrow-green)"
          />

          <line
            x1={lensX}
            y1={axisY}
            x2={centralRayRightX}
            y2={centralRayRightY}
            stroke="#22c55e"
            strokeWidth="3"
            markerEnd="url(#lens-arrow-green)"
          />

          {isVirtual && showExtensions && !isImageAtInfinity && (
            <line
              x1={lensX}
              y1={axisY}
              x2={imageX}
              y2={imageTipY}
              stroke="#22c55e"
              strokeWidth="2"
              strokeDasharray="5 7"
              opacity="0.55"
            />
          )}

          {!isVirtual && !isImageAtInfinity && (
            <>
              <line
                x1={lensX}
                y1={objectTipY}
                x2={imageX}
                y2={imageTipY}
                stroke="#facc15"
                strokeWidth="2"
                opacity="0.38"
              />

              <line
                x1={lensX}
                y1={axisY}
                x2={imageX}
                y2={imageTipY}
                stroke="#22c55e"
                strokeWidth="2"
                opacity="0.38"
              />
            </>
          )}
        </>
      )}

      <rect
        x={width - 270}
        y="24"
        width="238"
        height="142"
        rx="16"
        fill="rgba(15, 23, 42, 0.84)"
        stroke="#334155"
      />

      <text x={width - 248} y="52" fill="#f8fafc" fontSize="14" fontWeight="800">
        Diagnóstico
      </text>

      <text x={width - 248} y="78" fill="#cbd5e1" fontSize="13">
        lente: {lensType === "convergente" ? "convergente" : "divergente"}
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

function getLineYThroughTwoPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x: number
) {
  if (Math.abs(x2 - x1) < 1e-9) return y2;
  const slope = (y2 - y1) / (x2 - x1);
  return y1 + slope * (x - x1);
}

function ClassicLensCasesTable({
  focalMagnitude,
}: {
  focalMagnitude: number;
}) {
  const rows = [
    {
      position: "Objeto além de 2F",
      condition: `p > ${formatNumber(2 * focalMagnitude, 0)} cm`,
      image: "real, invertida e menor",
      lens: "convergente",
    },
    {
      position: "Objeto em 2F",
      condition: `p = ${formatNumber(2 * focalMagnitude, 0)} cm`,
      image: "real, invertida e igual",
      lens: "convergente",
    },
    {
      position: "Objeto entre F e 2F",
      condition: `${formatNumber(focalMagnitude, 0)} cm < p < ${formatNumber(
        2 * focalMagnitude,
        0
      )} cm`,
      image: "real, invertida e maior",
      lens: "convergente",
    },
    {
      position: "Objeto em F",
      condition: `p = ${formatNumber(focalMagnitude, 0)} cm`,
      image: "imprópria, no infinito",
      lens: "convergente",
    },
    {
      position: "Objeto entre F e O",
      condition: `p < ${formatNumber(focalMagnitude, 0)} cm`,
      image: "virtual, direita e maior",
      lens: "convergente",
    },
    {
      position: "Qualquer posição real",
      condition: "p > 0",
      image: "virtual, direita e menor",
      lens: "divergente",
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
              Lente
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={`${row.position}-${row.lens}`} className="border-b border-slate-100">
              <td className="px-4 py-3 font-semibold text-slate-900">
                {row.position}
              </td>

              <td className="px-4 py-3 text-slate-700">{row.condition}</td>

              <td className="px-4 py-3 font-semibold text-blue-700">
                {row.image}
              </td>

              <td className="px-4 py-3 text-slate-700">{row.lens}</td>
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

export default LensesSimulator;
