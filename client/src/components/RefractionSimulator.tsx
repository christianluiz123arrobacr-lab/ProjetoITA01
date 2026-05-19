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

type OpticalMedium = {
  id: string;
  name: string;
  n: number;
  description: string;
};

type RefractionStatus = {
  label: string;
  description: string;
  className: string;
};

const MEDIA: OpticalMedium[] = [
  {
    id: "air",
    name: "Ar / Vácuo",
    n: 1,
    description: "Meio menos refringente, usado como aproximação para o ar.",
  },
  {
    id: "water",
    name: "Água",
    n: 1.33,
    description: "Meio mais refringente que o ar.",
  },
  {
    id: "glass",
    name: "Vidro",
    n: 1.5,
    description: "Meio típico em lentes, prismas e lâminas.",
  },
  {
    id: "diamond",
    name: "Diamante",
    n: 2.42,
    description: "Meio muito refringente, com forte desvio da luz.",
  },
];

const degToRad = (degrees: number) => (degrees * Math.PI) / 180;
const radToDeg = (radians: number) => (radians * 180) / Math.PI;

const formatNumber = (value: number, digits = 2) => {
  if (!Number.isFinite(value)) return "—";

  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export const RefractionSimulator: React.FC = () => {
  const [medium1Id, setMedium1Id] = useState("air");
  const [medium2Id, setMedium2Id] = useState("water");
  const [angleIncidence, setAngleIncidence] = useState(45);
  const [showReflection, setShowReflection] = useState(true);
  const [showAngles, setShowAngles] = useState(true);
  const [showNormal, setShowNormal] = useState(true);

  const medium1 = useMemo(
    () => MEDIA.find((medium) => medium.id === medium1Id) ?? MEDIA[0],
    [medium1Id]
  );

  const medium2 = useMemo(
    () => MEDIA.find((medium) => medium.id === medium2Id) ?? MEDIA[1],
    [medium2Id]
  );

  const n1 = medium1.n;
  const n2 = medium2.n;

  const radIncidence = useMemo(() => degToRad(angleIncidence), [angleIncidence]);

  const sinRefraction = useMemo(() => {
    return (n1 * Math.sin(radIncidence)) / n2;
  }, [n1, n2, radIncidence]);

  const isTotalReflection = useMemo(() => {
    return n1 > n2 && Math.abs(sinRefraction) > 1;
  }, [n1, n2, sinRefraction]);

  const angleRefraction = useMemo(() => {
    if (isTotalReflection) return null;
    return radToDeg(Math.asin(sinRefraction));
  }, [isTotalReflection, sinRefraction]);

  const criticalAngle = useMemo(() => {
    if (n1 <= n2) return null;
    return radToDeg(Math.asin(n2 / n1));
  }, [n1, n2]);

  const status = useMemo<RefractionStatus>(() => {
    if (isTotalReflection) {
      return {
        label: "Reflexão total interna",
        description:
          "O raio tenta passar para um meio menos refringente com ângulo maior que o ângulo limite. Resultado: não há raio refratado.",
        className: "text-red-700",
      };
    }

    if (n2 > n1) {
      return {
        label: "Aproxima da normal",
        description:
          "A luz passa para um meio mais refringente. Sua velocidade diminui e o raio refratado fica mais próximo da normal.",
        className: "text-blue-700",
      };
    }

    if (n2 < n1) {
      return {
        label: "Afasta da normal",
        description:
          "A luz passa para um meio menos refringente. Sua velocidade aumenta e o raio refratado se afasta da normal.",
        className: "text-amber-700",
      };
    }

    return {
      label: "Sem desvio",
      description:
        "Os índices de refração são iguais. O raio não muda de direção ao atravessar a interface.",
      className: "text-emerald-700",
    };
  }, [n1, n2, isTotalReflection]);

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-4">
          <Card className="border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                Controles da Refração
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Ajuste os meios ópticos e o ângulo de incidência para visualizar
                a Lei de Snell-Descartes.
              </p>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="mb-4 text-sm font-bold text-blue-900">
                  Meio de origem
                </p>

                <Select value={medium1Id} onValueChange={setMedium1Id}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {MEDIA.map((medium) => (
                      <SelectItem key={medium.id} value={medium.id}>
                        {medium.name} (n = {formatNumber(medium.n, 2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="mt-3 text-xs leading-relaxed text-blue-800">
                  {medium1.description}
                </p>
              </div>

              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="mb-4 text-sm font-bold text-indigo-900">
                  Meio de destino
                </p>

                <Select value={medium2Id} onValueChange={setMedium2Id}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {MEDIA.map((medium) => (
                      <SelectItem key={medium.id} value={medium.id}>
                        {medium.name} (n = {formatNumber(medium.n, 2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="mt-3 text-xs leading-relaxed text-indigo-800">
                  {medium2.description}
                </p>
              </div>

              <ControlRow
                label="Ângulo de incidência"
                symbol="θ₁"
                value={`${formatNumber(angleIncidence, 1)}°`}
              >
                <Slider
                  value={[angleIncidence]}
                  onValueChange={(value) => setAngleIncidence(value[0])}
                  min={0}
                  max={89}
                  step={1}
                  className="w-full"
                />
              </ControlRow>

              <div className="grid grid-cols-2 gap-3">
                <ToggleButton
                  active={showReflection}
                  onClick={() => setShowReflection((previous) => !previous)}
                >
                  Reflexão
                </ToggleButton>

                <ToggleButton
                  active={showAngles}
                  onClick={() => setShowAngles((previous) => !previous)}
                >
                  Ângulos
                </ToggleButton>

                <ToggleButton
                  active={showNormal}
                  onClick={() => setShowNormal((previous) => !previous)}
                >
                  Normal
                </ToggleButton>

                <button
                  type="button"
                  onClick={() => {
                    setMedium1Id("air");
                    setMedium2Id("water");
                    setAngleIncidence(45);
                    setShowReflection(true);
                    setShowAngles(true);
                    setShowNormal(true);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Padrão
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
                label="Comportamento do raio"
                value={status.label}
                description={status.description}
                valueClassName={status.className}
              />

              <MetricCard
                label="Índice do meio 1"
                value={`n₁ = ${formatNumber(n1, 2)}`}
                description={medium1.name}
                valueClassName="text-blue-700"
              />

              <MetricCard
                label="Índice do meio 2"
                value={`n₂ = ${formatNumber(n2, 2)}`}
                description={medium2.name}
                valueClassName="text-indigo-700"
              />

              <MetricCard
                label="Ângulo de incidência"
                value={`θ₁ = ${formatNumber(angleIncidence, 2)}°`}
              />

              <MetricCard
                label="Ângulo de refração"
                value={
                  isTotalReflection || angleRefraction === null
                    ? "não existe"
                    : `θ₂ = ${formatNumber(angleRefraction, 2)}°`
                }
                description={
                  isTotalReflection
                    ? "Como ocorre reflexão total, não há raio refratado."
                    : "Ângulo medido em relação à normal."
                }
                valueClassName={
                  isTotalReflection ? "text-red-700" : "text-emerald-700"
                }
              />

              <MetricCard
                label="Ângulo limite"
                value={
                  criticalAngle === null
                    ? "não existe"
                    : `θc = ${formatNumber(criticalAngle, 2)}°`
                }
                description={
                  criticalAngle === null
                    ? "Só existe quando a luz vai de um meio mais refringente para um menos refringente."
                    : "Acima desse ângulo, ocorre reflexão total interna."
                }
                valueClassName={
                  criticalAngle === null ? "text-slate-700" : "text-purple-700"
                }
              />
            </div>
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-8">
          <Card className="overflow-hidden border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h4 className="text-base font-bold text-slate-900">
                Visualização da Refração
              </h4>
              <p className="mt-1 text-sm text-slate-500">
                O raio incidente chega à interface. Parte reflete, parte refrata,
                exceto quando a física resolve fechar a porta e fazer reflexão total.
              </p>
            </div>

            <div className="bg-slate-50 p-4 md:p-5">
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="overflow-x-auto">
                  <RefractionDiagram
                    n1={n1}
                    n2={n2}
                    medium1Name={medium1.name}
                    medium2Name={medium2.name}
                    angleIncidence={angleIncidence}
                    angleRefraction={angleRefraction}
                    isTotalReflection={isTotalReflection}
                    criticalAngle={criticalAngle}
                    showReflection={showReflection}
                    showAngles={showAngles}
                    showNormal={showNormal}
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
                  ["n₁", formatNumber(n1, 2)],
                  ["n₂", formatNumber(n2, 2)],
                  ["θ₁", `${formatNumber(angleIncidence, 2)}°`],
                  ["sen θ₁", formatNumber(Math.sin(radIncidence), 4)],
                ]}
              />

              <CalcMiniCard
                title="Saída pela Lei de Snell"
                values={[
                  ["sen θ₂", formatNumber(sinRefraction, 4)],
                  [
                    "θ₂",
                    isTotalReflection || angleRefraction === null
                      ? "não existe"
                      : `${formatNumber(angleRefraction, 2)}°`,
                  ],
                  [
                    "θc",
                    criticalAngle === null
                      ? "não existe"
                      : `${formatNumber(criticalAngle, 2)}°`,
                  ],
                  ["fenômeno", status.label],
                ]}
              />

              <CalcMiniCard
                title="Leitura física"
                values={[
                  ["n₂ > n₁", n2 > n1 ? "sim" : "não"],
                  ["n₂ < n₁", n2 < n1 ? "sim" : "não"],
                  ["aproxima da normal", !isTotalReflection && n2 > n1 ? "sim" : "não"],
                  ["reflexão total", isTotalReflection ? "sim" : "não"],
                ]}
              />

              <CalcMiniCard
                title="Velocidade relativa"
                values={[
                  ["v ∝ 1/n", "quanto maior n, menor v"],
                  ["meio mais lento", n1 > n2 ? medium1.name : medium2.name],
                  ["meio mais rápido", n1 < n2 ? medium1.name : medium2.name],
                  ["desvio", n1 === n2 ? "nulo" : "existe"],
                ]}
              />
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h4 className="text-base font-bold text-slate-900">
                Equações da refração
              </h4>
            </div>

            <div className="space-y-5 p-5">
              <FormulaSection
                title="Lei de Snell-Descartes"
                formulas={[
                  String.raw`n_1\sin\theta_1 = n_2\sin\theta_2`,
                  String.raw`${formatNumber(n1, 2)}\sin(${formatNumber(
                    angleIncidence,
                    2
                  )}^{\circ}) = ${formatNumber(n2, 2)}\sin\theta_2`,
                  String.raw`\sin\theta_2 = \frac{${formatNumber(
                    n1,
                    2
                  )}\sin(${formatNumber(angleIncidence, 2)}^{\circ})}{${formatNumber(
                    n2,
                    2
                  )}}`,
                  String.raw`\sin\theta_2 = ${formatNumber(sinRefraction, 4)}`,
                ]}
              />

              <FormulaSection
                title="Ângulo de refração"
                formulas={
                  isTotalReflection || angleRefraction === null
                    ? [
                        String.raw`\sin\theta_2 > 1`,
                        String.raw`\text{Não existe ângulo de refração real.}`,
                        String.raw`\text{Ocorre reflexão total interna.}`,
                      ]
                    : [
                        String.raw`\theta_2 = \arcsin(${formatNumber(
                          sinRefraction,
                          4
                        )})`,
                        String.raw`\theta_2 = ${formatNumber(
                          angleRefraction,
                          3
                        )}^{\circ}`,
                      ]
                }
              />

              <FormulaSection
                title="Ângulo limite"
                formulas={
                  criticalAngle === null
                    ? [
                        String.raw`n_1 \le n_2`,
                        String.raw`\text{Não há reflexão total ao passar para meio mais refringente.}`,
                      ]
                    : [
                        String.raw`\sin\theta_c = \frac{n_2}{n_1}`,
                        String.raw`\sin\theta_c = \frac{${formatNumber(
                          n2,
                          2
                        )}}{${formatNumber(n1, 2)}}`,
                        String.raw`\theta_c = ${formatNumber(
                          criticalAngle,
                          3
                        )}^{\circ}`,
                      ]
                }
              />

              <FormulaSection
                title="Interpretação"
                formulas={[
                  String.raw`n = \frac{c}{v}`,
                  String.raw`\text{Maior índice de refração } \Rightarrow \text{ menor velocidade da luz no meio.}`,
                  String.raw`n_2 > n_1 \Rightarrow \text{ raio aproxima da normal.}`,
                  String.raw`n_2 < n_1 \Rightarrow \text{ raio afasta da normal.}`,
                ]}
              />
            </div>
          </Card>
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

function RefractionDiagram({
  n1,
  n2,
  medium1Name,
  medium2Name,
  angleIncidence,
  angleRefraction,
  isTotalReflection,
  criticalAngle,
  showReflection,
  showAngles,
  showNormal,
}: {
  n1: number;
  n2: number;
  medium1Name: string;
  medium2Name: string;
  angleIncidence: number;
  angleRefraction: number | null;
  isTotalReflection: boolean;
  criticalAngle: number | null;
  showReflection: boolean;
  showAngles: boolean;
  showNormal: boolean;
}) {
  const width = 900;
  const height = 460;

  const centerX = 450;
  const interfaceY = 220;
  const rayLength = 190;

  const incidentRad = degToRad(angleIncidence);
  const refractionRad = angleRefraction === null ? 0 : degToRad(angleRefraction);

  const incidentStartX = centerX - rayLength * Math.sin(incidentRad);
  const incidentStartY = interfaceY - rayLength * Math.cos(incidentRad);

  const reflectedEndX = centerX + rayLength * Math.sin(incidentRad);
  const reflectedEndY = interfaceY - rayLength * Math.cos(incidentRad);

  const refractedEndX = centerX + rayLength * Math.sin(refractionRad);
  const refractedEndY = interfaceY + rayLength * Math.cos(refractionRad);

  const incidentArc = arcPath(centerX, interfaceY, 58, -90, -90 - angleIncidence);
  const reflectedArc = arcPath(centerX, interfaceY, 78, -90, -90 + angleIncidence);

  const refractedArc =
    angleRefraction === null
      ? ""
      : arcPath(centerX, interfaceY, 62, 90, 90 - angleRefraction);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="mx-auto w-full min-w-[820px] rounded-lg border border-slate-800 bg-slate-950"
    >
      <defs>
        <marker
          id="arrow-yellow"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#facc15" />
        </marker>

        <marker
          id="arrow-green"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
        </marker>

        <marker
          id="arrow-red"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
        </marker>
      </defs>

      <rect x="0" y="0" width={width} height={interfaceY} fill="#0f172a" />
      <rect
        x="0"
        y={interfaceY}
        width={width}
        height={height - interfaceY}
        fill="#1e293b"
      />

      <line
        x1="0"
        y1={interfaceY}
        x2={width}
        y2={interfaceY}
        stroke="#e5e7eb"
        strokeWidth="2"
      />

      <text x="24" y="38" fill="#e5e7eb" fontSize="16" fontWeight="700">
        Meio 1: {medium1Name}
      </text>

      <text x="24" y="62" fill="#94a3b8" fontSize="13">
        n₁ = {formatNumber(n1, 2)}
      </text>

      <text x="24" y={interfaceY + 34} fill="#e5e7eb" fontSize="16" fontWeight="700">
        Meio 2: {medium2Name}
      </text>

      <text x="24" y={interfaceY + 58} fill="#94a3b8" fontSize="13">
        n₂ = {formatNumber(n2, 2)}
      </text>

      {showNormal && (
        <>
          <line
            x1={centerX}
            y1="35"
            x2={centerX}
            y2={height - 35}
            stroke="#e5e7eb"
            strokeWidth="2"
            strokeDasharray="8 8"
            opacity="0.65"
          />

          <text x={centerX + 12} y="55" fill="#cbd5e1" fontSize="13" fontWeight="700">
            normal
          </text>
        </>
      )}

      <circle cx={centerX} cy={interfaceY} r="6" fill="#f8fafc" />

      <line
        x1={incidentStartX}
        y1={incidentStartY}
        x2={centerX}
        y2={interfaceY}
        stroke="#facc15"
        strokeWidth="5"
        markerEnd="url(#arrow-yellow)"
      />

      <text
        x={incidentStartX - 18}
        y={incidentStartY - 14}
        fill="#facc15"
        fontSize="14"
        fontWeight="700"
      >
        raio incidente
      </text>

      {showReflection && (
        <line
          x1={centerX}
          y1={interfaceY}
          x2={reflectedEndX}
          y2={reflectedEndY}
          stroke={isTotalReflection ? "#ef4444" : "#facc15"}
          strokeWidth={isTotalReflection ? 5 : 3}
          opacity={isTotalReflection ? 1 : 0.38}
          markerEnd={isTotalReflection ? "url(#arrow-red)" : "url(#arrow-yellow)"}
        />
      )}

      {showReflection && (
        <text
          x={reflectedEndX - 15}
          y={reflectedEndY - 14}
          fill={isTotalReflection ? "#ef4444" : "#fde68a"}
          fontSize="14"
          fontWeight="700"
          opacity={isTotalReflection ? 1 : 0.75}
        >
          {isTotalReflection ? "raio refletido" : "reflexão parcial"}
        </text>
      )}

      {!isTotalReflection && angleRefraction !== null && (
        <>
          <line
            x1={centerX}
            y1={interfaceY}
            x2={refractedEndX}
            y2={refractedEndY}
            stroke="#22c55e"
            strokeWidth="5"
            markerEnd="url(#arrow-green)"
          />

          <text
            x={refractedEndX + 10}
            y={refractedEndY + 14}
            fill="#22c55e"
            fontSize="14"
            fontWeight="700"
          >
            raio refratado
          </text>
        </>
      )}

      {isTotalReflection && (
        <g>
          <rect
            x={centerX - 150}
            y={height - 72}
            width="300"
            height="38"
            rx="12"
            fill="rgba(239, 68, 68, 0.16)"
            stroke="#ef4444"
          />

          <text
            x={centerX}
            y={height - 48}
            textAnchor="middle"
            fill="#fecaca"
            fontSize="15"
            fontWeight="800"
          >
            REFLEXÃO TOTAL INTERNA
          </text>
        </g>
      )}

      {showAngles && (
        <>
          <path d={incidentArc} fill="none" stroke="#facc15" strokeWidth="3" />
          <text x={centerX - 82} y={interfaceY - 55} fill="#facc15" fontSize="14" fontWeight="700">
            θ₁ = {formatNumber(angleIncidence, 1)}°
          </text>

          {showReflection && (
            <>
              <path
                d={reflectedArc}
                fill="none"
                stroke={isTotalReflection ? "#ef4444" : "#facc15"}
                strokeWidth="3"
                opacity={isTotalReflection ? 1 : 0.55}
              />

              <text
                x={centerX + 46}
                y={interfaceY - 76}
                fill={isTotalReflection ? "#ef4444" : "#fde68a"}
                fontSize="14"
                fontWeight="700"
              >
                θr = θ₁
              </text>
            </>
          )}

          {!isTotalReflection && angleRefraction !== null && (
            <>
              <path d={refractedArc} fill="none" stroke="#22c55e" strokeWidth="3" />

              <text
                x={centerX + 48}
                y={interfaceY + 76}
                fill="#22c55e"
                fontSize="14"
                fontWeight="700"
              >
                θ₂ = {formatNumber(angleRefraction, 1)}°
              </text>
            </>
          )}
        </>
      )}

      <rect
        x={width - 270}
        y="24"
        width="240"
        height={criticalAngle === null ? 108 : 132}
        rx="16"
        fill="rgba(15, 23, 42, 0.82)"
        stroke="#334155"
      />

      <text x={width - 250} y="52" fill="#f8fafc" fontSize="14" fontWeight="800">
        Diagnóstico
      </text>

      <text x={width - 250} y="78" fill="#cbd5e1" fontSize="13">
        n₁senθ₁ = {formatNumber(n1 * Math.sin(degToRad(angleIncidence)), 4)}
      </text>

      <text x={width - 250} y="100" fill="#cbd5e1" fontSize="13">
        senθ₂ = {formatNumber((n1 * Math.sin(degToRad(angleIncidence))) / n2, 4)}
      </text>

      <text
        x={width - 250}
        y="122"
        fill={isTotalReflection ? "#fca5a5" : "#86efac"}
        fontSize="13"
        fontWeight="700"
      >
        {isTotalReflection ? "sem refração real" : "refração possível"}
      </text>

      {criticalAngle !== null && (
        <text x={width - 250} y="144" fill="#c4b5fd" fontSize="13" fontWeight="700">
          θc = {formatNumber(criticalAngle, 2)}°
        </text>
      )}
    </svg>
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

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleDegrees: number
) {
  const angleRadians = degToRad(angleDegrees);

  return {
    x: centerX + radius * Math.cos(angleRadians),
    y: centerY + radius * Math.sin(angleRadians),
  };
}

function arcPath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(centerX, centerY, radius, startAngle);
  const end = polarToCartesian(centerX, centerY, radius, endAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";
  const sweepFlag = endAngle > startAngle ? "1" : "0";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    sweepFlag,
    end.x,
    end.y,
  ].join(" ");
}

export default RefractionSimulator;
