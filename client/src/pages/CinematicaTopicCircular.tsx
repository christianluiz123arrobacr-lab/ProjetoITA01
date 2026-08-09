import type { ReactNode } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CircleDot,
  Compass,
  Gauge,
  Lightbulb,
  RotateCw,
  Target,
  Zap,
} from "lucide-react";

import { MathFormula } from "@/components/MathFormula";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type FormulaCardProps = {
  title: string;
  formula: string;
  note: string;
};

type InfoBoxProps = {
  title: string;
  children: ReactNode;
  tone?: "blue" | "amber" | "green" | "purple" | "red";
  icon?: ReactNode;
};

const toneClasses = {
  blue: "border-blue-200 bg-blue-50 text-blue-950",
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  green: "border-emerald-200 bg-emerald-50 text-emerald-950",
  purple: "border-violet-200 bg-violet-50 text-violet-950",
  red: "border-red-200 bg-red-50 text-red-950",
};

function InfoBox({ title, children, tone = "blue", icon }: InfoBoxProps) {
  return (
    <div className={`rounded-2xl border p-5 ${toneClasses[tone]}`}>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-black">{title}</h3>
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-slate-700">
        {children}
      </div>
    </div>
  );
}

function FormulaCard({ title, formula, note }: FormulaCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h4 className="mb-3 font-black text-slate-900">{title}</h4>
      <div className="rounded-xl border border-blue-100 bg-white px-3 py-2">
        <MathFormula formula={formula} display={true} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{note}</p>
    </div>
  );
}

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-5">
        <h2 className="text-3xl font-black text-slate-950">{title}</h2>
        {subtitle ? (
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate-600">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function VectorDiagram() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[320px] items-center justify-center rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-violet-50 p-6">
      <div className="absolute inset-10 rounded-full border-4 border-dashed border-blue-300" />
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900" />
      <div className="absolute right-[18%] top-[31%] h-5 w-5 rounded-full bg-blue-600 shadow-lg shadow-blue-600/30" />
      <div className="absolute right-[18%] top-[31%] h-1 w-24 origin-left rotate-[28deg] rounded-full bg-emerald-500">
        <span className="absolute -right-2 -top-2 h-4 w-4 rotate-45 border-r-4 border-t-4 border-emerald-500" />
        <span className="absolute -right-9 -top-8 text-sm font-black text-emerald-700">
          v
        </span>
      </div>
      <div className="absolute right-[18%] top-[31%] h-1 w-28 origin-left rotate-[143deg] rounded-full bg-violet-600">
        <span className="absolute -right-2 -top-2 h-4 w-4 rotate-45 border-r-4 border-t-4 border-violet-600" />
        <span className="absolute -right-10 top-3 text-sm font-black text-violet-700">
          ac
        </span>
      </div>
      <div className="absolute bottom-5 left-5 rounded-2xl bg-white/90 px-4 py-3 text-xs font-bold text-slate-700 shadow-sm">
        <p>
          <span className="text-emerald-700">v</span> tangente
        </p>
        <p>
          <span className="text-violet-700">ac</span> para o centro
        </p>
      </div>
    </div>
  );
}

export default function CinematicaTopicCircular() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <Link href="/cinematica">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md">
              <RotateCw className="h-5 w-5" />
            </div>
            <div className="text-right sm:text-left">
              <h1 className="text-lg font-black text-slate-950 sm:text-xl">
                Movimento Circular Uniforme
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                Cinemática angular, centrípeta e transmissões
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-10">
        <section className="mb-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700 shadow-sm">
              <BookOpen className="h-4 w-4" />
              Teoria de alto rendimento
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              MCU sem decoreba: direção muda, rapidez não.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-600">
              No Movimento Circular Uniforme, o corpo percorre uma circunferência
              mantendo constante o módulo da velocidade. A pegadinha é que a
              velocidade é vetor: mesmo com rapidez constante, a direção muda a
              cada instante. Logo, existe aceleração.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                "Período e frequência",
                "Velocidade angular e tangencial",
                "Centrípeta e transmissões",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <Card className="rounded-3xl border-blue-100 bg-white/90 p-6 shadow-xl">
            <VectorDiagram />
          </Card>
        </section>

        <div className="space-y-12">
          <Section
            id="01"
            title="Ideia central"
            subtitle="O erro mais comum é achar que velocidade constante significa aceleração zero. Isso só vale quando o vetor velocidade inteiro é constante, não apenas seu módulo."
          >
            <Card className="rounded-3xl border-slate-200 bg-white p-7 shadow-lg">
              <div className="grid gap-5 lg:grid-cols-2">
                <InfoBox
                  title="O que fica constante"
                  tone="green"
                  icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                >
                  <p>
                    A rapidez, isto é, o módulo da velocidade tangencial, não
                    muda. O corpo percorre arcos iguais em tempos iguais.
                  </p>
                  <MathFormula formula="v = \text{constante}" display={true} />
                </InfoBox>

                <InfoBox
                  title="O que muda o tempo todo"
                  tone="amber"
                  icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
                >
                  <p>
                    A direção do vetor velocidade muda continuamente, pois a
                    velocidade é sempre tangente à circunferência.
                  </p>
                  <MathFormula formula="\vec{v}\; \text{não é constante}" display={true} />
                </InfoBox>
              </div>

              <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-black text-violet-950">
                  <Target className="h-5 w-5 text-violet-700" />
                  Leitura vetorial correta
                </h3>
                <p className="leading-relaxed text-slate-700">
                  No MCU, a aceleração centrípeta é perpendicular à velocidade
                  tangencial. Por isso ela muda a direção do movimento sem mudar
                  a rapidez. Se a aceleração tivesse componente tangencial, aí a
                  rapidez mudaria e o movimento deixaria de ser uniforme.
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-white p-4">
                    <MathFormula formula="\vec{a}_c \perp \vec{v}" display={true} />
                    <p className="text-center text-sm font-semibold text-slate-600">
                      muda direção
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <MathFormula formula="a_t = 0" display={true} />
                    <p className="text-center text-sm font-semibold text-slate-600">
                      não muda rapidez
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </Section>

          <Section
            id="02"
            title="Grandezas fundamentais"
            subtitle="Aqui está o kit mínimo do MCU: período, frequência, deslocamento angular, velocidade angular e velocidade tangencial."
          >
            <Card className="rounded-3xl border-slate-200 bg-white p-7 shadow-lg">
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <FormulaCard
                  title="Período"
                  formula="T = \frac{\Delta t}{n}"
                  note="Tempo necessário para completar uma volta. Unidade: segundo."
                />
                <FormulaCard
                  title="Frequência"
                  formula="f = \frac{n}{\Delta t}"
                  note="Número de voltas por unidade de tempo. Unidade: hertz."
                />
                <FormulaCard
                  title="Relação T e f"
                  formula="f = \frac{1}{T}"
                  note="Se cada volta demora mais, cabem menos voltas por segundo."
                />
                <FormulaCard
                  title="Velocidade angular"
                  formula="\omega = \frac{\Delta \theta}{\Delta t}"
                  note="Mede a rapidez com que o ângulo varia. Unidade: rad/s."
                />
                <FormulaCard
                  title="Uma volta completa"
                  formula="\omega = \frac{2\pi}{T} = 2\pi f"
                  note="Uma volta equivale a 2π radianos."
                />
                <FormulaCard
                  title="Velocidade tangencial"
                  formula="v = \omega R = \frac{2\pi R}{T}"
                  note="Mede a rapidez ao longo da circunferência."
                />
              </div>

              <div className="mt-7 grid gap-5 lg:grid-cols-2">
                <InfoBox
                  title="A ponte entre o angular e o linear"
                  tone="blue"
                  icon={<Compass className="h-5 w-5 text-blue-600" />}
                >
                  <p>
                    A relação mais importante antes de decorar qualquer fórmula
                    é esta: o comprimento do arco é proporcional ao ângulo
                    varrido. Se o ângulo está em radianos:
                  </p>
                  <MathFormula formula="s = R\theta" display={true} />
                  <p>
                    Derivando em relação ao tempo, aparece naturalmente a
                    relação entre velocidade tangencial e velocidade angular:
                  </p>
                  <MathFormula formula="v = \frac{ds}{dt} = R\frac{d\theta}{dt} = R\omega" display={true} />
                </InfoBox>

                <InfoBox
                  title="Média vs instantânea"
                  tone="purple"
                  icon={<Target className="h-5 w-5 text-violet-700" />}
                >
                  <p>
                    Em qualquer movimento circular, podemos definir uma
                    velocidade angular média:
                  </p>
                  <MathFormula formula="\omega_m = \frac{\Delta \theta}{\Delta t}" display={true} />
                  <p>
                    No MCU, a velocidade angular não muda. Por isso, a média e a
                    instantânea coincidem. É a mesma lógica do MRU, só que no
                    mundo angular.
                  </p>
                  <MathFormula formula="\omega_m = \omega = \text{constante}" display={true} />
                </InfoBox>
              </div>
            </Card>
          </Section>

          <Section
            id="03"
            title="Aceleração e força centrípeta"
            subtitle="Centrípeta quer dizer dirigida para o centro. Não é uma força nova: é o nome da resultante radial."
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-3xl border-slate-200 bg-white p-7 shadow-lg">
                <h3 className="mb-4 flex items-center gap-2 text-2xl font-black text-slate-950">
                  <Compass className="h-6 w-6 text-blue-600" />
                  Aceleração centrípeta
                </h3>
                <p className="mb-5 leading-relaxed text-slate-700">
                  Ela existe porque o vetor velocidade muda de direção. Seu
                  módulo pode ser calculado por duas formas equivalentes:
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormulaCard
                    title="Se você tem v"
                    formula="a_c = \frac{v^2}{R}"
                    note="Use quando o enunciado der velocidade tangencial."
                  />
                  <FormulaCard
                    title="Se você tem omega"
                    formula="a_c = \omega^2R"
                    note="Use quando o enunciado der velocidade angular."
                  />
                </div>
                <InfoBox
                  title="Não misture dados"
                  tone="red"
                  icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
                >
                  <p>
                    Em polias e discos, cada ponto pode ter raio, velocidade
                    tangencial e aceleração diferentes. Use sempre o raio do
                    ponto analisado. Misturar raio de uma polia com velocidade
                    de outra é erro clássico.
                  </p>
                </InfoBox>
              </Card>

              <Card className="rounded-3xl border-slate-200 bg-white p-7 shadow-lg">
                <h3 className="mb-4 flex items-center gap-2 text-2xl font-black text-slate-950">
                  <Zap className="h-6 w-6 text-amber-500" />
                  Força centrípeta
                </h3>
                <p className="mb-5 leading-relaxed text-slate-700">
                  A força centrípeta é a resultante das forças reais na direção
                  radial. Ela pode ser tração, atrito, gravidade, normal ou uma
                  combinação delas.
                </p>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <MathFormula formula="F_c = ma_c = \frac{mv^2}{R} = m\omega^2R" display={true} />
                </div>
                <div className="mt-5 grid gap-3">
                  {[
                    "Carro em curva plana: o atrito fornece a resultante radial.",
                    "Pedra presa ao barbante: a tração aponta para o centro.",
                    "Satélite em órbita circular: a gravidade faz papel centrípeto.",
                    "Objeto em pista circular vertical: peso e normal podem participar.",
                  ].map((example) => (
                    <div
                      key={example}
                      className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-slate-700"
                    >
                      {example}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </Section>

          <Section
            id="04"
            title="De onde vem a fórmula da centrípeta"
            subtitle="Se a fórmula ac = v²/R aparece sem dedução, o aluno decora e esquece. A ideia nasce da geometria dos vetores velocidade."
          >
            <Card className="rounded-3xl border-slate-200 bg-white p-7 shadow-lg">
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-5">
                  <p className="leading-relaxed text-slate-700">
                    Em um intervalo de tempo muito pequeno, o corpo anda um arco
                    pequeno da circunferência. O módulo da velocidade continua o
                    mesmo, mas a direção muda. Então os vetores velocidade antes
                    e depois têm o mesmo tamanho, só estão levemente girados.
                  </p>

                  <InfoBox
                    title="A semelhança que importa"
                    tone="purple"
                    icon={<Lightbulb className="h-5 w-5 text-violet-700" />}
                  >
                    <p>
                      O triângulo formado pelos dois raios é semelhante ao
                      triângulo formado pelos dois vetores velocidade. Para um
                      ângulo muito pequeno:
                    </p>
                    <MathFormula formula="\frac{\Delta v}{v} \approx \frac{\Delta s}{R}" display={true} />
                  </InfoBox>

                  <p className="leading-relaxed text-slate-700">
                    Como o corpo percorre um arco{" "}
                    <MathFormula formula="\Delta s = v\Delta t" display={false} />, substituímos:
                  </p>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <MathFormula formula="\frac{\Delta v}{v} \approx \frac{v\Delta t}{R}" display={true} />
                    <MathFormula formula="\frac{\Delta v}{\Delta t} \approx \frac{v^2}{R}" display={true} />
                    <MathFormula formula="a_c = \frac{v^2}{R}" display={true} />
                  </div>
                </div>

                <div className="space-y-5">
                  <InfoBox
                    title="Interpretação física"
                    tone="blue"
                    icon={<Compass className="h-5 w-5 text-blue-600" />}
                  >
                    <p>
                      A fórmula mostra duas coisas fortes: aumentar a velocidade
                      pesa muito, porque ela entra ao quadrado; aumentar o raio
                      suaviza a curva, porque divide a aceleração necessária.
                    </p>
                  </InfoBox>

                  <InfoBox
                    title="Análise dimensional"
                    tone="green"
                    icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                  >
                    <p>
                      A unidade também confirma que a fórmula faz sentido:
                    </p>
                    <MathFormula formula="\frac{v^2}{R} = \frac{(m/s)^2}{m} = \frac{m}{s^2}" display={true} />
                    <p>
                      Ou seja, o resultado tem unidade de aceleração.
                    </p>
                  </InfoBox>

                  <InfoBox
                    title="A fórmula irmã"
                    tone="amber"
                    icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
                  >
                    <p>
                      Como <MathFormula formula="v=\omega R" display={false} />,
                      podemos trocar a forma linear pela forma angular:
                    </p>
                    <MathFormula formula="a_c = \frac{(\omega R)^2}{R} = \omega^2R" display={true} />
                  </InfoBox>
                </div>
              </div>
            </Card>
          </Section>

          <Section
            id="05"
            title="Trabalho, energia e a direção da força"
            subtitle="Aqui está uma das ideias mais bonitas do MCU: a força centrípeta muda a direção do movimento, mas não muda a energia cinética."
          >
            <Card className="rounded-3xl border-slate-200 bg-white p-7 shadow-lg">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="mb-4 flex items-center gap-2 text-2xl font-black text-slate-950">
                    <Zap className="h-6 w-6 text-amber-500" />
                    A centrípeta não realiza trabalho no MCU ideal
                  </h3>
                  <p className="mb-4 leading-relaxed text-slate-700">
                    Trabalho depende da componente da força na direção do
                    deslocamento. No MCU, o deslocamento instantâneo é tangente à
                    trajetória, enquanto a força centrípeta aponta para o centro.
                    As duas direções são perpendiculares.
                  </p>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <MathFormula formula="W = Fd\cos\theta" display={true} />
                    <MathFormula formula="\theta = 90^\circ \Rightarrow \cos 90^\circ = 0" display={true} />
                    <MathFormula formula="W_c = 0" display={true} />
                  </div>
                  <p className="mt-4 leading-relaxed text-slate-700">
                    Conclusão: a força centrípeta pura não aumenta nem diminui a
                    energia cinética. Ela gasta sua função física mudando a
                    direção do vetor velocidade.
                  </p>
                </div>

                <div className="space-y-5">
                  <InfoBox
                    title="O que aconteceria se ela tivesse componente tangencial?"
                    tone="red"
                    icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
                  >
                    <p>
                      Aí haveria trabalho, a energia cinética mudaria e o
                      movimento deixaria de ser circular uniforme. A rapidez
                      aumentaria ou diminuiria.
                    </p>
                    <MathFormula formula="F_t \neq 0 \Rightarrow a_t \neq 0" display={true} />
                  </InfoBox>

                  <InfoBox
                    title="Pedra no barbante: se o fio arrebenta"
                    tone="blue"
                    icon={<Target className="h-5 w-5 text-blue-600" />}
                  >
                    <p>
                      A pedra não “sai para fora” radialmente. Essa frase é
                      intuitiva, mas errada. No instante em que o fio arrebenta,
                      a tração desaparece e a pedra segue pela tangente, na
                      direção da velocidade que tinha naquele instante.
                    </p>
                    <MathFormula formula="\text{sem força radial} \Rightarrow \text{movimento tangencial}" display={true} />
                  </InfoBox>

                  <InfoBox
                    title="A curva exige uma resultante radial"
                    tone="purple"
                    icon={<CircleDot className="h-5 w-5 text-violet-700" />}
                  >
                    <p>
                      Se a resultante radial for insuficiente, o corpo não
                      acompanha a curva. É por isso que carro derrapa, fio rompe
                      e objeto escapa da trajetória.
                    </p>
                  </InfoBox>
                </div>
              </div>
            </Card>
          </Section>

          <Section
            id="06"
            title="MCU vs movimento circular variado"
            subtitle="A diferença não é a forma da trajetória. A diferença é se a rapidez muda ou não."
          >
            <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="bg-gradient-to-r from-blue-600 to-violet-600 text-white">
                    <tr>
                      <th className="px-5 py-4 font-black">Caso</th>
                      <th className="px-5 py-4 font-black">Rapidez</th>
                      <th className="px-5 py-4 font-black">Aceleração tangencial</th>
                      <th className="px-5 py-4 font-black">Aceleração centrípeta</th>
                      <th className="px-5 py-4 font-black">Força resultante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-5 py-4 font-black text-slate-900">
                        MCU
                      </td>
                      <td className="px-5 py-4 text-slate-700">Constante</td>
                      <td className="px-5 py-4">
                        <MathFormula formula="a_t = 0" display={false} />
                      </td>
                      <td className="px-5 py-4">
                        <MathFormula formula="a_c \neq 0" display={false} />
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        Puramente radial
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-4 font-black text-slate-900">
                        Circular variado
                      </td>
                      <td className="px-5 py-4 text-slate-700">Varia</td>
                      <td className="px-5 py-4">
                        <MathFormula formula="a_t \neq 0" display={false} />
                      </td>
                      <td className="px-5 py-4">
                        <MathFormula formula="a_c = \frac{v^2}{R}" display={false} />
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        Radial + tangencial
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <InfoBox
                title="Regra física"
                tone="green"
                icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              >
                <p>
                  A componente radial da aceleração muda a direção da velocidade.
                  A componente tangencial muda o módulo da velocidade.
                </p>
                <MathFormula formula="\vec{a} = \vec{a}_c + \vec{a}_t" display={true} />
              </InfoBox>

              <InfoBox
                title="Erro de prova"
                tone="amber"
                icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
              >
                <p>
                  Se o enunciado diz que o objeto “acelera enquanto faz uma
                  curva”, não é MCU. É movimento circular variado ou movimento
                  curvilíneo com aceleração tangencial.
                </p>
              </InfoBox>
            </div>
          </Section>

          <Section
            id="07"
            title="Quando não é MCU"
            subtitle="Essa seção evita um erro sério: nem todo movimento circular é uniforme."
          >
            <Card className="rounded-3xl border-slate-200 bg-white p-7 shadow-lg">
              <div className="grid gap-5 md:grid-cols-3">
                <InfoBox
                  title="Rapidez muda"
                  tone="red"
                  icon={<Gauge className="h-5 w-5 text-red-600" />}
                >
                  <p>
                    Se o módulo da velocidade aumenta ou diminui, existe
                    aceleração tangencial e o movimento não é uniforme.
                  </p>
                  <MathFormula formula="a_t \neq 0" display={true} />
                </InfoBox>
                <InfoBox
                  title="Força tangencial"
                  tone="amber"
                  icon={<Zap className="h-5 w-5 text-amber-600" />}
                >
                  <p>
                    Se a resultante tem componente tangencial, ela altera a
                    rapidez. MCU exige resultante puramente radial.
                  </p>
                  <MathFormula formula="F_t = 0" display={true} />
                </InfoBox>
                <InfoBox
                  title="Raio variável"
                  tone="purple"
                  icon={<CircleDot className="h-5 w-5 text-violet-700" />}
                >
                  <p>
                    Se a trajetória não mantém raio fixo em torno de um centro,
                    você não está no modelo simples de circunferência uniforme.
                  </p>
                  <MathFormula formula="R = \text{constante}" display={true} />
                </InfoBox>
              </div>
            </Card>
          </Section>

          <Section
            id="08"
            title="Transmissão de movimento circular"
            subtitle="Aqui mora muita questão boa: mesmo disco, correia sem escorregamento e engrenagens."
          >
            <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-950 text-white">
                    <tr>
                      <th className="px-5 py-4 font-black">Situação</th>
                      <th className="px-5 py-4 font-black">O que é igual</th>
                      <th className="px-5 py-4 font-black">O que muda</th>
                      <th className="px-5 py-4 font-black">Ideia física</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-5 py-4 font-black text-slate-900">
                        Mesmo eixo ou mesmo disco
                      </td>
                      <td className="px-5 py-4">
                        <MathFormula formula="T,\; f,\; \omega" display={false} />
                      </td>
                      <td className="px-5 py-4">
                        <MathFormula formula="v,\; a_c" display={false} />
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        Todos giram juntos, mas pontos mais afastados percorrem
                        circunferências maiores.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-4 font-black text-slate-900">
                        Correia sem escorregamento
                      </td>
                      <td className="px-5 py-4">
                        <MathFormula formula="v_1 = v_2" display={false} />
                      </td>
                      <td className="px-5 py-4">
                        <MathFormula formula="T,\; f,\; \omega" display={false} />
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        A borda das polias acompanha a mesma velocidade linear da
                        correia.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-4 font-black text-slate-900">
                        Engrenagens em contato
                      </td>
                      <td className="px-5 py-4">
                        <MathFormula formula="v_1 = v_2" display={false} />
                      </td>
                      <td className="px-5 py-4">
                        <MathFormula formula="\omega,\; T,\; f" display={false} />
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        A menor gira mais rápido e o sentido de rotação inverte.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <FormulaCard
                title="Mesmo disco"
                formula="\omega_A = \omega_B,\quad v \propto R,\quad a_c \propto R"
                note="Mesmo tempo de volta. Quanto maior o raio, maior a velocidade tangencial."
              />
              <FormulaCard
                title="Correia ou engrenagem"
                formula="v_1 = v_2 \Rightarrow \omega_1R_1 = \omega_2R_2"
                note="Raio menor exige velocidade angular maior para manter a mesma velocidade tangencial."
              />
            </div>
          </Section>

          <Section
            id="09"
            title="Órbita circular: caso separado"
            subtitle="Satélite não é transmissão por polia. É dinâmica gravitacional. Misturar esses raciocínios é pedir para errar."
          >
            <Card className="rounded-3xl border-slate-200 bg-white p-7 shadow-lg">
              <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                <InfoBox
                  title="A gravidade faz papel centrípeto"
                  tone="blue"
                  icon={<CircleDot className="h-5 w-5 text-blue-600" />}
                >
                  <p>
                    Em órbita circular, a força gravitacional aponta para o
                    centro da trajetória e fornece a resultante centrípeta.
                  </p>
                  <MathFormula formula="\frac{GMm}{R^2} = \frac{mv^2}{R}" display={true} />
                </InfoBox>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="mb-3 leading-relaxed text-slate-700">
                    Cancelando a massa do satélite e simplificando:
                  </p>
                  <MathFormula formula="v = \sqrt{\frac{GM}{R}}" display={true} />
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Em órbita gravitacional circular, quanto maior o raio
                    orbital, menor a velocidade orbital. Isso é diferente de
                    pontos no mesmo disco, onde <MathFormula formula="v = \omega R" display={false} /> com
                    <MathFormula formula="\omega" display={false} /> comum.
                  </p>
                </div>
              </div>
            </Card>
          </Section>

          <Section
            id="graficos"
            title="Gráficos do MCU"
            subtitle="No MCU, a parte escalar e angular é previsível. O que varia é a direção do vetor velocidade, não os módulos das grandezas principais."
          >
            <Card className="rounded-3xl border-slate-200 bg-white p-7 shadow-lg">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="mb-3 text-xl font-black text-slate-950">
                    Ângulo em função do tempo
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-slate-700">
                    Como a velocidade angular é constante, o ângulo cresce de
                    forma linear com o tempo.
                  </p>
                  <MathFormula formula="\theta(t) = \theta_0 + \omega t" display={true} />
                  <p className="rounded-xl bg-white p-3 text-sm font-semibold text-slate-600">
                    Gráfico <MathFormula formula="\theta \times t" display={false} />: reta.
                    A inclinação da reta é <MathFormula formula="\omega" display={false} />.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="mb-3 text-xl font-black text-slate-950">
                    Velocidade angular em função do tempo
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-slate-700">
                    No MCU, a velocidade angular não aumenta nem diminui.
                  </p>
                  <MathFormula formula="\omega(t) = \text{constante}" display={true} />
                  <p className="rounded-xl bg-white p-3 text-sm font-semibold text-slate-600">
                    Gráfico <MathFormula formula="\omega \times t" display={false} />:
                    reta horizontal.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="mb-3 text-xl font-black text-slate-950">
                    Módulo da velocidade
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-slate-700">
                    A rapidez fica constante, embora o vetor velocidade mude de
                    direção continuamente.
                  </p>
                  <MathFormula formula="|\vec{v}(t)| = v = \text{constante}" display={true} />
                  <p className="rounded-xl bg-white p-3 text-sm font-semibold text-slate-600">
                    Gráfico <MathFormula formula="v \times t" display={false} />:
                    reta horizontal se o eixo mostra o módulo.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="mb-3 text-xl font-black text-slate-950">
                    Módulo da aceleração centrípeta
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-slate-700">
                    Se <MathFormula formula="v" display={false} /> e{" "}
                    <MathFormula formula="R" display={false} /> são constantes,
                    o módulo de <MathFormula formula="a_c" display={false} /> também é constante.
                    A direção, porém, acompanha o raio para o centro.
                  </p>
                  <MathFormula formula="a_c(t) = \frac{v^2}{R} = \text{constante}" display={true} />
                </div>
              </div>
            </Card>
          </Section>

          <Section
            id="10"
            title="Exemplos resolvidos"
            subtitle="Três modelos que cobrem o grosso das questões: cálculo direto, correia e comparação entre pontos do disco."
          >
            <div className="grid gap-6">
              <Card className="rounded-3xl border-slate-200 bg-white p-7 shadow-lg">
                <h3 className="mb-4 text-2xl font-black text-slate-950">
                  Exemplo 1: cálculo direto
                </h3>
                <p className="mb-4 leading-relaxed text-slate-700">
                  Um corpo descreve uma circunferência de raio{" "}
                  <MathFormula formula="2\,\text{m}" display={false} /> com período{" "}
                  <MathFormula formula="4\,\text{s}" display={false} />. Calcule{" "}
                  <MathFormula formula="f" display={false} />,{" "}
                  <MathFormula formula="\omega" display={false} />,{" "}
                  <MathFormula formula="v" display={false} /> e{" "}
                  <MathFormula formula="a_c" display={false} />.
                </p>
                <div className="grid gap-4 md:grid-cols-4">
                  <FormulaCard title="Frequência" formula="f = \frac{1}{4} = 0{,}25\,\text{Hz}" note="Inverso do período." />
                  <FormulaCard title="Velocidade angular" formula="\omega = \frac{2\pi}{4} = \frac{\pi}{2}\,\text{rad/s}" note="Uma volta tem 2π rad." />
                  <FormulaCard title="Velocidade tangencial" formula="v = \omega R = \frac{\pi}{2}\cdot 2 = \pi\,\text{m/s}" note="Velocidade ao longo da circunferência." />
                  <FormulaCard title="Centrípeta" formula="a_c = \omega^2R = \frac{\pi^2}{2}\,\text{m/s}^2" note="Aponta para o centro." />
                </div>
              </Card>

              <Card className="rounded-3xl border-slate-200 bg-white p-7 shadow-lg">
                <h3 className="mb-4 text-2xl font-black text-slate-950">
                  Exemplo 2: polias por correia
                </h3>
                <p className="mb-4 leading-relaxed text-slate-700">
                  Duas polias de raios <MathFormula formula="10\,\text{cm}" display={false} /> e{" "}
                  <MathFormula formula="30\,\text{cm}" display={false} /> estão ligadas por correia sem
                  escorregamento. A menor gira com{" "}
                  <MathFormula formula="12\,\text{rad/s}" display={false} />.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormulaCard
                    title="Velocidade da correia"
                    formula="v = \omega_1R_1 = 12\cdot 0{,}10 = 1{,}2\,\text{m/s}"
                    note="Sem escorregamento, essa é a velocidade tangencial nas bordas."
                  />
                  <FormulaCard
                    title="Velocidade angular da maior"
                    formula="\omega_2 = \frac{v}{R_2} = \frac{1{,}2}{0{,}30} = 4\,\text{rad/s}"
                    note="A polia maior gira mais devagar."
                  />
                </div>
              </Card>

              <Card className="rounded-3xl border-slate-200 bg-white p-7 shadow-lg">
                <h3 className="mb-4 text-2xl font-black text-slate-950">
                  Exemplo 3: pontos no mesmo disco
                </h3>
                <p className="mb-4 leading-relaxed text-slate-700">
                  O ponto A está a <MathFormula formula="10\,\text{cm}" display={false} /> do centro e B
                  está a <MathFormula formula="20\,\text{cm}" display={false} />. Os dois pertencem ao
                  mesmo disco rígido.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormulaCard title="Angular" formula="\omega_A = \omega_B" note="Ambos completam a volta no mesmo tempo." />
                  <FormulaCard title="Tangencial" formula="v_B = 2v_A" note="B tem o dobro do raio." />
                  <FormulaCard title="Centrípeta" formula="a_{cB} = 2a_{cA}" note="Com mesma omega, ac é proporcional ao raio." />
                </div>
              </Card>

              <Card className="rounded-3xl border-slate-200 bg-white p-7 shadow-lg">
                <h3 className="mb-4 text-2xl font-black text-slate-950">
                  Exemplo 4: carro em curva plana com atrito
                </h3>
                <p className="mb-4 leading-relaxed text-slate-700">
                  Um carro faz uma curva plana de raio <MathFormula formula="R" display={false} />.
                  Quem fornece a força centrípeta é o atrito estático entre os
                  pneus e o chão. No limite antes de derrapar:
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormulaCard
                    title="Atrito máximo"
                    formula="F_{at,\max} = \mu mg"
                    note="A pista plana não tem componente do peso na direção radial."
                  />
                  <FormulaCard
                    title="Condição da curva"
                    formula="\mu mg = \frac{mv^2}{R}"
                    note="O atrito faz o papel de resultante radial."
                  />
                  <FormulaCard
                    title="Velocidade máxima"
                    formula="v_{\max} = \sqrt{\mu gR}"
                    note="Acima disso, falta atrito e o carro derrapa."
                  />
                </div>
              </Card>

              <Card className="rounded-3xl border-slate-200 bg-white p-7 shadow-lg">
                <h3 className="mb-4 text-2xl font-black text-slate-950">
                  Exemplo 5: loop vertical
                </h3>
                <p className="mb-4 leading-relaxed text-slate-700">
                  Em uma circunferência vertical, a direção radial muda de
                  posição para posição. Por isso, a equação da resultante radial
                  precisa ser montada em cada ponto, e não decorada no automático.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormulaCard
                    title="No topo"
                    formula="N + mg = \frac{mv^2}{R}"
                    note="Normal e peso apontam para o centro."
                  />
                  <FormulaCard
                    title="Na base"
                    formula="N - mg = \frac{mv^2}{R}"
                    note="Normal aponta para o centro; peso aponta contra o centro."
                  />
                </div>
                <InfoBox
                  title="Cuidado fino"
                  tone="amber"
                  icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
                >
                  <p>
                    “Força centrípeta” não é sempre <MathFormula formula="N" display={false} />,
                    nem sempre <MathFormula formula="mg" display={false} />. Ela é a soma das
                    componentes reais que apontam para o centro.
                  </p>
                </InfoBox>
              </Card>

              <Card className="rounded-3xl border-slate-200 bg-white p-7 shadow-lg">
                <h3 className="mb-4 text-2xl font-black text-slate-950">
                  Exemplo 6: pêndulo cônico
                </h3>
                <p className="mb-4 leading-relaxed text-slate-700">
                  No pêndulo cônico, a massa descreve uma circunferência
                  horizontal. A tração do fio se divide em duas componentes:
                  uma sustenta o peso e outra fornece a resultante centrípeta.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormulaCard
                    title="Equilíbrio vertical"
                    formula="T\cos\theta = mg"
                    note="Não há aceleração vertical."
                  />
                  <FormulaCard
                    title="Direção radial"
                    formula="T\sin\theta = \frac{mv^2}{R}"
                    note="A componente horizontal da tração aponta para o centro."
                  />
                  <FormulaCard
                    title="Dividindo as equações"
                    formula="\tan\theta = \frac{v^2}{gR}"
                    note="Ótima forma para ligar geometria e dinâmica."
                  />
                </div>
              </Card>
            </div>
          </Section>

          <Section
            id="11"
            title="Pegadinhas e checklist"
            subtitle="Antes de sair usando fórmula, identifique a estrutura do problema. MCU pune chute bonito."
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-3xl border-slate-200 bg-white p-7 shadow-lg">
                <h3 className="mb-5 flex items-center gap-2 text-2xl font-black text-slate-950">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                  Erros comuns
                </h3>
                <div className="space-y-3">
                  {[
                    "Achar que rapidez constante implica aceleração zero.",
                    "Confundir velocidade angular com velocidade tangencial.",
                    "Usar v = omega R sem conferir o raio correto.",
                    "Tratar força centrípeta como força extra misteriosa.",
                    "Inventar força centrífuga para fora no referencial inercial.",
                    "Aplicar regra de mesmo disco em problema de correia.",
                    "Esquecer que rpm deve ser convertido para Hz.",
                    "Esquecer que uma volta equivale a 2π radianos.",
                  ].map((item) => (
                    <div key={item} className="flex gap-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-slate-700">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      {item}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="rounded-3xl border-slate-200 bg-white p-7 shadow-lg">
                <h3 className="mb-5 flex items-center gap-2 text-2xl font-black text-slate-950">
                  <Lightbulb className="h-6 w-6 text-blue-600" />
                  Checklist de prova
                </h3>
                <div className="space-y-3">
                  {[
                    "O problema fala de mesmo eixo ou mesmo disco?",
                    "O problema fala de correia sem escorregamento?",
                    "O problema fala de engrenagens?",
                    "Pediram velocidade angular ou tangencial?",
                    "A unidade está em rpm, Hz ou rad/s?",
                    "A aceleração é centrípeta ou também existe tangencial?",
                    "Qual força real fornece a resultante para o centro?",
                    "Estou usando o raio do ponto correto?",
                  ].map((item) => (
                    <div key={item} className="flex gap-3 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                      {item}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="rounded-3xl border-slate-200 bg-white p-7 shadow-lg lg:col-span-2">
                <h3 className="mb-5 flex items-center gap-2 text-2xl font-black text-slate-950">
                  <Target className="h-6 w-6 text-violet-600" />
                  Frases-gatilho do enunciado
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    {
                      clue: "“completa uma volta”",
                      action: "troque a volta por 2π radianos.",
                    },
                    {
                      clue: "“mesmo eixo”, “mesmo disco” ou “solidárias”",
                      action: "use mesma velocidade angular.",
                    },
                    {
                      clue: "“correia sem escorregamento”",
                      action: "use mesma velocidade tangencial.",
                    },
                    {
                      clue: "“engrenagens em contato”",
                      action: "use mesma velocidade tangencial e sentidos opostos.",
                    },
                    {
                      clue: "“rpm”",
                      action: "divida por 60 antes de usar ω = 2πf.",
                    },
                    {
                      clue: "“fio arrebenta” ou “perde contato”",
                      action: "o corpo segue pela tangente naquele instante.",
                    },
                    {
                      clue: "“velocidade constante em módulo”",
                      action: "não conclua aceleração zero; verifique a direção.",
                    },
                    {
                      clue: "“curva com rapidez aumentando”",
                      action: "não é MCU: existe aceleração tangencial.",
                    },
                  ].map((item) => (
                    <div
                      key={item.clue}
                      className="rounded-2xl border border-violet-100 bg-violet-50 p-4"
                    >
                      <p className="text-sm font-black text-violet-900">
                        {item.clue}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-700">
                        {item.action}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </Section>

          <Section
            id="12"
            title="Resumo final"
            subtitle="O MCU é simples, mas não é bobo. A rapidez não muda; a direção muda; a aceleração aponta para o centro."
          >
            <Card className="rounded-3xl border-slate-200 bg-slate-950 p-7 text-white shadow-xl">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  "f = \\frac{1}{T}",
                  "\\omega = \\frac{2\\pi}{T} = 2\\pi f",
                  "v = \\omega R",
                  "a_c = \\frac{v^2}{R}",
                  "a_c = \\omega^2R",
                  "F_c = \\frac{mv^2}{R} = m\\omega^2R",
                ].map((formula) => (
                  <div key={formula} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                    <MathFormula formula={formula} display={true} />
                  </div>
                ))}
              </div>
              <p className="mt-6 rounded-2xl bg-white/[0.06] p-5 text-sm font-semibold leading-relaxed text-slate-200">
                A moral do MCU é direta: rapidez constante não significa vetor
                velocidade constante. Se a direção muda, existe aceleração. E se
                existe aceleração, existe força resultante radial. O centro da
                trajetória manda na dinâmica inteira.
              </p>
            </Card>
          </Section>

          <div className="flex flex-col gap-3 rounded-3xl border border-blue-100 bg-white p-6 shadow-lg sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Próximo passo
              </h2>
              <p className="text-sm text-slate-600">
                Treine MCU no banco de questões ou volte para o módulo de Cinemática.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/banco-de-questoes">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Banco de questões
                </Button>
              </Link>
              <Link href="/cinematica">
                <Button variant="outline">Voltar à Cinemática</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
