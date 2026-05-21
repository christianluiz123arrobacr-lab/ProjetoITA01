import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Target,
  Zap,
  Shield,
  Calculator,
  Ruler,
  Compass,
  Activity,
  Layers,
  Rocket,
  ListChecks,
  Scale,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { MathFormula } from "@/components/MathFormula";

type TabId = "teoria" | "exemplos" | "resumo";

type SectionProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  gradient: string;
  children: ReactNode;
};

type FormulaBoxProps = {
  formula: string;
  label?: string;
};

type NoteBoxProps = {
  title: string;
  children: ReactNode;
  tone?: "blue" | "green" | "amber" | "red" | "purple" | "slate" | "indigo";
};

type FormulaStepProps = {
  title: string;
  explanation?: ReactNode;
  formula: string;
  tone?: "blue" | "green" | "amber" | "purple" | "slate";
};

type ExampleItem = {
  id: string;
  title: string;
  enunciado: string;
  content: ReactNode;
};

function FormulaBox({ formula, label }: FormulaBoxProps) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center overflow-x-auto shadow-inner">
      {label && (
        <p className="text-xs font-bold uppercase tracking-wide mb-2 text-slate-500">
          {label}
        </p>
      )}
      <div className="text-slate-900">
        <MathFormula formula={formula} display={true} />
      </div>
    </div>
  );
}

function InlineFormulaBox({ formula }: { formula: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 mx-1 align-middle">
      <MathFormula formula={formula} />
    </span>
  );
}

function Section({ icon: Icon, title, subtitle, gradient, children }: SectionProps) {
  return (
    <section className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
      <div className={`${gradient} px-8 py-5`}>
        <div className="flex items-start gap-3">
          <Icon className="w-6 h-6 text-white mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {subtitle && <p className="text-white/85 text-sm mt-1">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-8 space-y-7">{children}</div>
    </section>
  );
}

function NoteBox({ title, children, tone = "blue" }: NoteBoxProps) {
  const styles = {
    blue: "bg-blue-50 border-blue-400 text-blue-900",
    green: "bg-green-50 border-green-400 text-green-900",
    amber: "bg-amber-50 border-amber-400 text-amber-900",
    red: "bg-red-50 border-red-400 text-red-900",
    purple: "bg-purple-50 border-purple-400 text-purple-900",
    slate: "bg-slate-50 border-slate-400 text-slate-900",
    indigo: "bg-indigo-50 border-indigo-400 text-indigo-900",
  };

  return (
    <div className={`${styles[tone]} border-l-4 rounded-r-xl p-5`}>
      <p className="font-bold mb-2">{title}</p>
      <div className="text-slate-700 text-sm leading-7">{children}</div>
    </div>
  );
}

function FormulaStep({ title, explanation, formula, tone = "slate" }: FormulaStepProps) {
  const dotStyles = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    amber: "bg-amber-500",
    purple: "bg-purple-500",
    slate: "bg-slate-500",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <span className={`h-3 w-3 rounded-full ${dotStyles[tone]} mt-1.5 flex-shrink-0`} />
        <div>
          <p className="font-bold text-slate-900">{title}</p>
          {explanation && <div className="text-sm text-slate-700 leading-7 mt-1">{explanation}</div>}
        </div>
      </div>
      <FormulaBox formula={formula} />
    </div>
  );
}

function MiniTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-xl font-black text-slate-900 mt-2">{children}</h3>;
}

function SubTitle({ children }: { children: ReactNode }) {
  return <h4 className="text-lg font-bold text-slate-800 mt-4 mb-2">{children}</h4>;
}

function Paragraph({ children }: { children: ReactNode }) {
  return <p className="text-slate-700 leading-8">{children}</p>;
}

function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3 text-slate-700 leading-7">
          <span className="mt-3 h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedSteps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3">
          <span className="bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
            {index + 1}
          </span>
          <span className="text-slate-700 text-sm leading-7">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function FormulaGrid({ children }: { children: ReactNode }) {
  return <div className="grid md:grid-cols-2 gap-4">{children}</div>;
}

export default function DynamicsTopicNewton() {
  const [openExamples, setOpenExamples] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<TabId>("teoria");

  const toggleExample = (id: string) => {
    setOpenExamples((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const examples: ExampleItem[] = [
    {
      id: "ex1",
      title: "Exemplo 1 — Bloco em superfície horizontal sem atrito",
      enunciado:
        "Um bloco de massa m = 5 kg está sobre uma superfície horizontal sem atrito. Uma força horizontal constante de módulo F = 20 N puxa o bloco para a direita. Determine a aceleração do bloco.",
      content: (
        <div className="space-y-5">
          <NoteBox title="DCL descrito" tone="slate">
            As forças sobre o bloco são: peso <InlineFormulaBox formula={String.raw`P = mg`} /> para baixo,
            normal <InlineFormulaBox formula={String.raw`N`} /> para cima e força aplicada{" "}
            <InlineFormulaBox formula={String.raw`F`} /> para a direita. Como não há atrito, nenhuma força horizontal se opõe ao movimento.
          </NoteBox>

          <FormulaGrid>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <p className="font-bold text-slate-800">Eixo vertical</p>
              <FormulaStep
                title="Não há aceleração vertical"
                explanation="O bloco não sobe nem afunda na superfície."
                formula={String.raw`a_y = 0`}
                tone="blue"
              />
              <FormulaStep
                title="Aplicando a Segunda Lei no eixo y"
                formula={String.raw`\sum F_y = ma_y`}
                tone="blue"
              />
              <FormulaStep
                title="Normal e peso se equilibram"
                formula={String.raw`N - mg = 0 \Rightarrow N = mg`}
                tone="blue"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <p className="font-bold text-slate-800">Eixo horizontal</p>
              <FormulaStep
                title="A única força horizontal é F"
                formula={String.raw`\sum F_x = ma_x`}
                tone="green"
              />
              <FormulaStep
                title="Substituindo os valores"
                formula={String.raw`F = ma \Rightarrow 20 = 5a`}
                tone="green"
              />
              <FormulaStep
                title="Resultado"
                formula={String.raw`a = 4 \ \text{m/s}^2`}
                tone="green"
              />
            </div>
          </FormulaGrid>

          <NoteBox title="Ideia física" tone="green">
            Sem atrito, toda força horizontal aplicada vira força resultante horizontal. Como a massa é{" "}
            <InlineFormulaBox formula={String.raw`5 \ \text{kg}`} />, uma força de{" "}
            <InlineFormulaBox formula={String.raw`20 \ \text{N}`} /> produz aceleração de{" "}
            <InlineFormulaBox formula={String.raw`4 \ \text{m/s}^2`} />.
          </NoteBox>
        </div>
      ),
    },
    {
      id: "ex2",
      title: "Exemplo 2 — Bloco com atrito cinético",
      enunciado:
        "Um bloco de massa m = 10 kg está sobre uma superfície horizontal. Uma força horizontal de módulo F = 50 N puxa o bloco para a direita. O coeficiente de atrito cinético é μc = 0,2. Considere g = 10 m/s². Determine a aceleração do bloco.",
      content: (
        <div className="space-y-5">
          <NoteBox title="DCL descrito" tone="slate">
            As forças são: peso para baixo, normal para cima, força aplicada para a direita e atrito cinético para a esquerda. O atrito aponta contra o deslizamento relativo.
          </NoteBox>

          <FormulaStep
            title="Normal no eixo vertical"
            explanation="Como não há aceleração vertical, normal e peso se equilibram."
            formula={String.raw`N - mg = 0 \Rightarrow N = mg = 10 \cdot 10 = 100 \ \text{N}`}
            tone="blue"
          />

          <FormulaStep
            title="Cálculo do atrito cinético"
            explanation="O bloco já está deslizando, então usamos a fórmula do atrito cinético."
            formula={String.raw`f_c = \mu_c N = 0{,}2 \cdot 100 = 20 \ \text{N}`}
            tone="amber"
          />

          <FormulaStep
            title="Força resultante horizontal"
            explanation="A força aplicada aponta para a direita; o atrito aponta para a esquerda."
            formula={String.raw`F - f_c = ma \Rightarrow 50 - 20 = 10a`}
            tone="green"
          />

          <FormulaStep
            title="Resultado"
            formula={String.raw`30 = 10a \Rightarrow a = 3 \ \text{m/s}^2`}
            tone="green"
          />

          <NoteBox title="Ideia física" tone="green">
            A força aplicada não vira inteira aceleração, porque o atrito “come” parte da força. O que sobra é a força resultante horizontal.
          </NoteBox>
        </div>
      ),
    },
    {
      id: "ex3",
      title: "Exemplo 3 — Plano inclinado sem atrito",
      enunciado:
        "Um bloco está sobre um plano inclinado sem atrito, com ângulo θ = 30°. Considere g = 10 m/s². Determine a aceleração do bloco ao longo do plano.",
      content: (
        <div className="space-y-5">
          <NoteBox title="DCL descrito" tone="slate">
            As forças são peso vertical para baixo e normal perpendicular ao plano. O peso é decomposto em duas componentes: uma paralela à rampa e outra perpendicular à rampa.
          </NoteBox>

          <FormulaGrid>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <p className="font-bold text-slate-800">Eixo perpendicular</p>
              <FormulaStep
                title="O bloco não sai nem entra no plano"
                formula={String.raw`a_y = 0`}
                tone="blue"
              />
              <FormulaStep
                title="Normal equilibra a componente perpendicular do peso"
                formula={String.raw`N - mg\cos\theta = 0 \Rightarrow N = mg\cos\theta`}
                tone="blue"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <p className="font-bold text-slate-800">Eixo paralelo</p>
              <FormulaStep
                title="A componente paralela do peso acelera o bloco"
                formula={String.raw`mg\sin\theta = ma`}
                tone="green"
              />
              <FormulaStep
                title="A massa cancela"
                formula={String.raw`a = g\sin\theta`}
                tone="green"
              />
              <FormulaStep
                title="Substituindo o ângulo"
                formula={String.raw`a = 10\sin 30^\circ = 10 \cdot \frac{1}{2} = 5 \ \text{m/s}^2`}
                tone="green"
              />
            </div>
          </FormulaGrid>

          <NoteBox title="Ideia física" tone="green">
            Sem atrito, a massa cancela. Dois blocos de massas diferentes descem com a mesma aceleração no mesmo plano inclinado ideal.
          </NoteBox>
        </div>
      ),
    },
    {
      id: "ex4",
      title: "Exemplo 4 — Plano inclinado com atrito",
      enunciado:
        "Um bloco desce um plano inclinado de ângulo θ = 37°. O coeficiente de atrito cinético é μc = 0,25. Considere g = 10 m/s², sen 37° = 0,6 e cos 37° = 0,8. Determine a aceleração.",
      content: (
        <div className="space-y-5">
          <NoteBox title="DCL descrito" tone="slate">
            Como o bloco desce, o atrito cinético aponta para cima da rampa. A componente do peso para baixo é{" "}
            <InlineFormulaBox formula={String.raw`mg\sin\theta`} /> e o atrito vale{" "}
            <InlineFormulaBox formula={String.raw`\mu_c mg\cos\theta`} />.
          </NoteBox>

          <FormulaStep
            title="Normal no eixo perpendicular"
            formula={String.raw`N = mg\cos\theta`}
            tone="blue"
          />

          <FormulaStep
            title="Atrito cinético"
            formula={String.raw`f_c = \mu_c N = \mu_c mg\cos\theta`}
            tone="amber"
          />

          <FormulaStep
            title="Segunda Lei no eixo paralelo"
            explanation="A componente do peso puxa para baixo; o atrito puxa para cima."
            formula={String.raw`mg\sin\theta - f_c = ma`}
            tone="green"
          />

          <FormulaStep
            title="Substituindo o atrito"
            formula={String.raw`mg\sin\theta - \mu_c mg\cos\theta = ma`}
            tone="green"
          />

          <FormulaStep
            title="Isolando a aceleração"
            formula={String.raw`a = g(\sin\theta - \mu_c\cos\theta)`}
            tone="green"
          />

          <FormulaStep
            title="Substituição numérica"
            formula={String.raw`a = 10(0{,}6 - 0{,}25 \cdot 0{,}8) = 4 \ \text{m/s}^2`}
            tone="green"
          />

          <NoteBox title="Ideia física" tone="green">
            O atrito reduz a aceleração em relação ao caso sem atrito. A resultante paralela é o que sobra da componente do peso depois de vencer o atrito.
          </NoteBox>
        </div>
      ),
    },
    {
      id: "ex5",
      title: "Exemplo 5 — Sistema de dois blocos",
      enunciado:
        "Dois blocos, m₁ = 2 kg e m₂ = 3 kg, estão em contato sobre uma superfície horizontal sem atrito. Uma força horizontal F = 20 N empurra o bloco m₁ para a direita. Determine a aceleração do sistema e a força de contato entre os blocos.",
      content: (
        <div className="space-y-5">
          <NoteBox title="Estratégia" tone="blue">
            Para achar a aceleração, analisamos o sistema completo. Para achar a força de contato, isolamos um dos blocos.
          </NoteBox>

          <FormulaGrid>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <p className="font-bold text-slate-800">Sistema completo</p>
              <FormulaStep
                title="Massa total"
                formula={String.raw`M = m_1 + m_2 = 2 + 3 = 5 \ \text{kg}`}
                tone="blue"
              />
              <FormulaStep
                title="Segunda Lei para o conjunto"
                formula={String.raw`F = Ma \Rightarrow 20 = 5a`}
                tone="green"
              />
              <FormulaStep
                title="Aceleração"
                formula={String.raw`a = 4 \ \text{m/s}^2`}
                tone="green"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <p className="font-bold text-slate-800">Isolando o bloco m₂</p>
              <FormulaStep
                title="A força de contato acelera m₂"
                formula={String.raw`C = m_2a`}
                tone="purple"
              />
              <FormulaStep
                title="Substituindo"
                formula={String.raw`C = 3 \cdot 4 = 12 \ \text{N}`}
                tone="purple"
              />
            </div>
          </FormulaGrid>
        </div>
      ),
    },
    {
      id: "ex6",
      title: "Exemplo 6 — Máquina de Atwood",
      enunciado:
        "Dois blocos de massas m₁ = 2 kg e m₂ = 3 kg estão ligados por um fio ideal que passa por uma polia ideal. Considere g = 10 m/s². Determine a aceleração do sistema e a tração no fio.",
      content: (
        <div className="space-y-5">
          <NoteBox title="DCL descrito" tone="slate">
            Como <InlineFormulaBox formula={String.raw`m_2 > m_1`} />, o bloco <InlineFormulaBox formula={String.raw`m_2`} /> desce e o bloco{" "}
            <InlineFormulaBox formula={String.raw`m_1`} /> sobe. A tração é a mesma no fio ideal.
          </NoteBox>

          <FormulaGrid>
            <FormulaStep
              title="Equação para m₂"
              explanation="Escolhemos positivo para baixo, pois m₂ desce."
              formula={String.raw`m_2g - T = m_2a \Rightarrow 30 - T = 3a`}
              tone="blue"
            />

            <FormulaStep
              title="Equação para m₁"
              explanation="Escolhemos positivo para cima, pois m₁ sobe."
              formula={String.raw`T - m_1g = m_1a \Rightarrow T - 20 = 2a`}
              tone="green"
            />
          </FormulaGrid>

          <FormulaStep
            title="Somando as equações"
            explanation="A tração cancela, pois é força interna ao sistema."
            formula={String.raw`30 - T + T - 20 = 3a + 2a \Rightarrow 10 = 5a`}
            tone="purple"
          />

          <FormulaStep
            title="Aceleração"
            formula={String.raw`a = 2 \ \text{m/s}^2`}
            tone="purple"
          />

          <FormulaStep
            title="Tração"
            formula={String.raw`T - 20 = 2 \cdot 2 \Rightarrow T = 24 \ \text{N}`}
            tone="amber"
          />

          <NoteBox title="Ideia física" tone="green">
            A diferença entre os pesos é a força que acelera o sistema. A tração não é igual ao peso de nenhum dos blocos, porque ambos estão acelerando.
          </NoteBox>
        </div>
      ),
    },
    {
      id: "ex7",
      title: "Exemplo 7 — Elevador acelerado",
      enunciado:
        "Uma pessoa de massa m = 70 kg está dentro de um elevador que acelera para cima com a = 2 m/s². Considere g = 10 m/s². Determine a força normal exercida pelo piso sobre a pessoa.",
      content: (
        <div className="space-y-5">
          <NoteBox title="DCL descrito" tone="slate">
            As forças sobre a pessoa são peso para baixo e normal para cima. Como o elevador acelera para cima, a pessoa também acelera para cima.
          </NoteBox>

          <FormulaStep
            title="Segunda Lei no eixo vertical"
            formula={String.raw`\sum F_y = ma`}
            tone="blue"
          />

          <FormulaStep
            title="Normal para cima e peso para baixo"
            formula={String.raw`N - mg = ma`}
            tone="blue"
          />

          <FormulaStep
            title="Isolando a normal"
            formula={String.raw`N = m(g+a)`}
            tone="green"
          />

          <FormulaStep
            title="Substituindo"
            formula={String.raw`N = 70(10+2) = 840 \ \text{N}`}
            tone="green"
          />

          <NoteBox title="Ideia física" tone="green">
            O peso real é <InlineFormulaBox formula={String.raw`P = 700 \ \text{N}`} />, mas a normal é{" "}
            <InlineFormulaBox formula={String.raw`840 \ \text{N}`} />. É a normal que a pessoa “sente” como peso aparente.
          </NoteBox>
        </div>
      ),
    },
    {
      id: "ex8",
      title: "Exemplo 8 — Ação e reação, normal e peso",
      enunciado:
        "Um livro de massa m = 2 kg está parado sobre uma mesa horizontal. Considere g = 10 m/s². Determine a normal sobre o livro e identifique corretamente os pares de ação e reação.",
      content: (
        <div className="space-y-5">
          <FormulaStep
            title="Normal sobre o livro"
            explanation="Como o livro está parado, a força resultante vertical é nula."
            formula={String.raw`N - mg = 0 \Rightarrow N = mg = 2 \cdot 10 = 20 \ \text{N}`}
            tone="green"
          />

          <FormulaGrid>
            <NoteBox title="Par de ação e reação do peso" tone="purple">
              <InlineFormulaBox formula={String.raw`\vec{P}_{\text{Terra} \to \text{livro}}`} /> e{" "}
              <InlineFormulaBox formula={String.raw`\vec{P}_{\text{livro} \to \text{Terra}}`} />.
            </NoteBox>

            <NoteBox title="Par de ação e reação da normal" tone="purple">
              <InlineFormulaBox formula={String.raw`\vec{N}_{\text{mesa} \to \text{livro}}`} /> e{" "}
              <InlineFormulaBox formula={String.raw`\vec{N}_{\text{livro} \to \text{mesa}}`} />.
            </NoteBox>
          </FormulaGrid>

          <NoteBox title="Cuidado clássico" tone="red">
            Peso e normal não são par de ação e reação, mesmo que tenham mesmo módulo nesse caso. Eles atuam no mesmo corpo: o livro. Pares de ação e reação atuam em corpos diferentes.
          </NoteBox>
        </div>
      ),
    },
    {
      id: "ex9",
      title: "Exemplo 9 — Polia com vínculo geométrico simples",
      enunciado:
        "Uma carga B é sustentada por uma polia móvel presa a um fio ideal. A extremidade livre E do fio é puxada para cima com aceleração de módulo aE. Determine a relação entre a aceleração da extremidade livre e a aceleração da carga B.",
      content: (
        <div className="space-y-5">
          <NoteBox title="Ideia do vínculo" tone="blue">
            A polia móvel é sustentada por dois trechos de fio. Quando a carga sobe uma distância{" "}
            <InlineFormulaBox formula={String.raw`x_B`} />, cada um dos dois trechos encurta{" "}
            <InlineFormulaBox formula={String.raw`x_B`} />. Então a extremidade livre precisa compensar o dobro.
          </NoteBox>

          <FormulaStep
            title="Relação entre os deslocamentos"
            formula={String.raw`x_E = 2x_B`}
            tone="blue"
          />

          <FormulaStep
            title="Derivando uma vez"
            explanation="A derivada do deslocamento em relação ao tempo dá velocidade."
            formula={String.raw`\frac{dx_E}{dt} = 2\frac{dx_B}{dt} \Rightarrow v_E = 2v_B`}
            tone="green"
          />

          <FormulaStep
            title="Derivando novamente"
            explanation="A derivada da velocidade em relação ao tempo dá aceleração."
            formula={String.raw`\frac{dv_E}{dt} = 2\frac{dv_B}{dt} \Rightarrow a_E = 2a_B`}
            tone="purple"
          />

          <FormulaStep
            title="Relação final"
            formula={String.raw`a_B = \frac{a_E}{2}`}
            tone="amber"
          />

          <NoteBox title="Ideia física" tone="green">
            Em uma polia móvel sustentada por dois ramos de fio, puxar a extremidade livre uma certa distância não faz a carga subir a mesma distância. A carga sobe metade.
          </NoteBox>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dinamica">
              <a className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </a>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Leis de Newton</h1>
              <p className="text-xs text-slate-500">Dinâmica — fundamentos completos</p>
            </div>
          </div>

          <div className="flex gap-2">
            {(["teoria", "exemplos", "resumo"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {activeTab === "teoria" && (
          <div className="space-y-10">
            <Section
              icon={BookOpen}
              title="Parte 1 — Contexto Físico e Histórico"
              subtitle="Da Cinemática para a pergunta central da Dinâmica: por que o corpo acelera?"
              gradient="bg-gradient-to-r from-amber-500 to-orange-500"
            >
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-5 rounded-r-xl">
                <Paragraph>
                  A <strong>Dinâmica</strong> é a parte da Mecânica que tenta responder a uma pergunta mais profunda do que a Cinemática.
                </Paragraph>
                <Paragraph>
                  A Cinemática pergunta: <em>“Como o corpo se move?”</em> Ela descreve posição, velocidade, aceleração, trajetória, tempo, deslocamento e gráficos.
                </Paragraph>
                <Paragraph>
                  A Dinâmica pergunta: <em>“Por que o corpo se move desse jeito?”</em> Ela quer saber quais interações fazem um corpo acelerar, frear, mudar de direção, permanecer parado ou continuar em movimento retilíneo uniforme.
                </Paragraph>
              </div>

              <Paragraph>
                Essa diferença é essencial. Dizer que um bloco tem aceleração de{" "}
                <InlineFormulaBox formula={String.raw`2 \ \text{m/s}^2`} /> é Cinemática. Explicar que essa aceleração ocorre porque a força resultante sobre ele é diferente de zero é Dinâmica.
              </Paragraph>

              <Paragraph>
                Durante muito tempo, a explicação do movimento foi contaminada por uma ideia intuitiva, mas errada: a ideia de que uma força seria necessária para manter um corpo em movimento.
              </Paragraph>

              <Paragraph>
                Essa ideia parece razoável no cotidiano. Quando você empurra uma mesa, ela só se move enquanto você continua empurrando. Quando para de empurrar, ela para. Um carrinho lançado no chão também vai perdendo velocidade até parar. Então parece natural concluir: <strong>“Se não há força empurrando, o corpo para.”</strong>
              </Paragraph>

              <Paragraph>
                O problema é que o cotidiano está cheio de atrito e resistência do ar. O que faz a mesa parar não é a ausência da força da mão. É a presença de forças resistentes, principalmente o atrito entre a mesa e o chão.
              </Paragraph>

              <Paragraph>
                A grande virada conceitual veio com Galileu e foi consolidada por Newton. Galileu percebeu que, se reduzirmos os efeitos resistivos, um corpo tende a manter seu movimento por mais tempo. Quanto menor o atrito, mais tempo ele continua se movendo. No limite ideal de ausência de atrito, um corpo lançado em uma superfície horizontal continuaria em movimento retilíneo uniforme indefinidamente.
              </Paragraph>

              <div className="bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 rounded-2xl p-7 text-center shadow-inner">
                <p className="text-amber-600 font-black text-lg mb-2">A virada conceitual</p>
                <p className="text-slate-900 text-2xl font-black">O movimento não precisa ser sustentado por força.</p>
                <p className="text-green-700 text-2xl font-black mt-1">O que precisa de força resultante é a mudança do movimento.</p>
              </div>

              <Paragraph>
                Newton organizou essa visão em três leis fundamentais, que formam a base da Mecânica Clássica: Primeira Lei, Segunda Lei e Terceira Lei de Newton.
              </Paragraph>

              <Paragraph>
                Essas leis explicam desde situações simples, como um livro parado sobre uma mesa, até sistemas de blocos, polias, elevadores, rampas, veículos, colisões iniciais, curvas e movimentos de corpos submetidos a várias forças.
              </Paragraph>

              <Paragraph>
                A ideia de Newton é poderosa porque conecta três conceitos centrais: <strong>força</strong>, <strong>massa</strong> e <strong>aceleração</strong>.
              </Paragraph>

              <FormulaGrid>
                <NoteBox title="Força" tone="blue">
                  Representa uma interação entre corpos.
                </NoteBox>
                <NoteBox title="Massa" tone="green">
                  Representa a resistência do corpo a mudanças no movimento.
                </NoteBox>
                <NoteBox title="Aceleração" tone="purple">
                  Representa a mudança da velocidade vetorial.
                </NoteBox>
              </FormulaGrid>

              <FormulaStep
                title="Equação central da Dinâmica"
                explanation="A Segunda Lei de Newton resume a relação entre força resultante, massa e aceleração."
                formula={String.raw`\vec{F}_{\text{res}} = m\vec{a}`}
                tone="blue"
              />

              <Paragraph>
                Essa equação é simples na aparência, mas é uma das mais profundas da Física. Ela diz que o movimento de um corpo não é determinado por uma força isolada qualquer, mas pela soma vetorial de todas as forças que atuam nele.
              </Paragraph>

              <NoteBox title="Pergunta madura em Dinâmica" tone="amber">
                Não basta perguntar “existe força?”. A pergunta correta é: <strong>qual é a força resultante?</strong>
              </NoteBox>

              <Paragraph>
                Um corpo pode ter várias forças atuando nele e, mesmo assim, ter força resultante nula. Nesse caso, ele não acelera.
              </Paragraph>

              <BulletList
                items={[
                  <>Um livro parado sobre a mesa sofre peso para baixo e normal para cima. Existem forças, mas a resultante é nula.</>,
                  <>Um carro em linha reta com velocidade constante pode ter força do motor para frente e forças resistivas para trás. Se elas se equilibram, a aceleração é nula.</>,
                  <>Um elevador parado tem peso e normal sobre a pessoa, mas a resultante é nula.</>,
                ]}
              />
            </Section>

            <Section
              icon={Lightbulb}
              title="Parte 2 — Ideia Intuitiva do Conteúdo"
              subtitle="Força resultante altera velocidade vetorial, não sustenta movimento."
              gradient="bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-7 text-center shadow-inner">
                <p className="text-indigo-600 font-black uppercase tracking-wide text-xs mb-3">Ideia principal</p>
                <p className="text-slate-900 text-2xl font-black">Força resultante não mantém velocidade.</p>
                <p className="text-green-700 text-2xl font-black mt-1">Força resultante muda velocidade.</p>
              </div>

              <Paragraph>
                Essa frase precisa ser entendida com cuidado. A velocidade é uma grandeza vetorial. Isso significa que ela possui módulo, direção e sentido.
              </Paragraph>

              <FormulaGrid>
                <NoteBox title="Mudar o módulo" tone="green">
                  O corpo fica mais rápido ou mais lento. Exemplo: carro arrancando ou freando.
                </NoteBox>
                <NoteBox title="Mudar a direção" tone="blue">
                  O corpo faz uma curva. Mesmo com rapidez constante, a velocidade vetorial muda.
                </NoteBox>
                <NoteBox title="Mudar o sentido" tone="purple">
                  O corpo inverte o movimento, como uma bolinha que sobe, para e começa a descer.
                </NoteBox>
              </FormulaGrid>

              <Paragraph>
                Por isso, existe aceleração sempre que a velocidade vetorial muda. Mesmo que o velocímetro marque sempre o mesmo valor, se o corpo está fazendo uma curva, a direção da velocidade muda. Logo, há aceleração. Logo, há força resultante.
              </Paragraph>

              <MiniTitle>2.1 A força como interação</MiniTitle>

              <Paragraph>
                Força não é uma coisa que o corpo “possui”. Força é uma interação entre corpos. Um corpo não tem força guardada dentro dele como se fosse combustível. Um corpo recebe forças quando interage com outros corpos.
              </Paragraph>

              <BulletList
                items={[
                  <>A Terra exerce força gravitacional sobre uma pedra.</>,
                  <>A mesa exerce força normal sobre um livro.</>,
                  <>Uma corda exerce tração sobre um bloco.</>,
                  <>O chão exerce atrito sobre o pé de uma pessoa.</>,
                  <>Uma mola exerce força elástica sobre um objeto.</>,
                  <>O ar exerce resistência sobre um corpo em movimento.</>,
                ]}
              />

              <NoteBox title="Teste para saber se uma força é real" tone="amber">
                Sempre que você desenhar uma força, deve conseguir responder: <strong>quem exerce essa força?</strong> Se você não consegue dizer quem exerce, provavelmente desenhou uma força fantasma.
              </NoteBox>

              <MiniTitle>2.2 A massa como resistência à mudança</MiniTitle>

              <Paragraph>
                Massa está associada à inércia. Inércia é a tendência de um corpo manter seu estado de movimento. Se o corpo está parado, tende a permanecer parado. Se está em movimento retilíneo uniforme, tende a permanecer em movimento retilíneo uniforme.
              </Paragraph>

              <Paragraph>
                Quanto maior a massa, maior a dificuldade de alterar a velocidade do corpo. Um carrinho vazio acelera facilmente quando você empurra. Um carrinho cheio de cimento exige muito mais força para adquirir a mesma aceleração.
              </Paragraph>

              <FormulaGrid>
                <FormulaStep
                  title="Segunda Lei"
                  explanation="A força resultante é proporcional à massa e à aceleração."
                  formula={String.raw`\vec{F}_{\text{res}} = m\vec{a}`}
                  tone="blue"
                />
                <FormulaStep
                  title="Isolando a aceleração"
                  explanation="A aceleração cresce com a força resultante e diminui com a massa."
                  formula={String.raw`\vec{a} = \frac{\vec{F}_{\text{res}}}{m}`}
                  tone="green"
                />
              </FormulaGrid>

              <MiniTitle>2.3 A aceleração como efeito da força resultante</MiniTitle>

              <Paragraph>
                A aceleração não aponta necessariamente no sentido do movimento. Ela aponta no sentido da força resultante.
              </Paragraph>

              <Paragraph>
                Um corpo lançado verticalmente para cima, após sair da mão, desprezando a resistência do ar, sofre apenas o peso para baixo. Durante a subida, sua velocidade aponta para cima, mas sua aceleração aponta para baixo.
              </Paragraph>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <FormulaStep
                  title="Força resultante após o lançamento"
                  explanation="Desprezando o ar, a única força é o peso."
                  formula={String.raw`\vec{P} = m\vec{g}`}
                  tone="blue"
                />
                <FormulaStep
                  title="Aplicando a Segunda Lei"
                  formula={String.raw`m\vec{a} = m\vec{g}`}
                  tone="green"
                />
                <FormulaStep
                  title="Cancelando a massa"
                  formula={String.raw`\vec{a} = \vec{g}`}
                  tone="purple"
                />
              </div>

              <NoteBox title="Conclusão conceitual" tone="purple">
                Força resultante e aceleração têm sempre mesma direção e mesmo sentido. Velocidade e aceleração podem ter sentidos iguais ou opostos.
              </NoteBox>

              <MiniTitle>2.4 O papel da força resultante</MiniTitle>

              <Paragraph>
                Imagine um bloco sobre uma superfície horizontal sendo puxado por uma força para a direita. Ao mesmo tempo, existe atrito para a esquerda.
              </Paragraph>

              <FormulaGrid>
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                  <p className="font-bold text-slate-800">Caso 1: sobra força</p>
                  <FormulaStep
                    title="Soma das forças"
                    formula={String.raw`F_{\text{res}} = 30 - 10`}
                    tone="blue"
                  />
                  <FormulaStep
                    title="Força resultante"
                    formula={String.raw`F_{\text{res}} = 20 \ \text{N}`}
                    tone="green"
                  />
                  <p className="text-sm text-slate-700 leading-7">
                    A aceleração depende dos <strong>20 N que sobraram</strong>, não dos 30 N aplicados separadamente.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                  <p className="font-bold text-slate-800">Caso 2: não sobra força</p>
                  <FormulaStep
                    title="Soma das forças"
                    formula={String.raw`F_{\text{res}} = 30 - 30`}
                    tone="blue"
                  />
                  <FormulaStep
                    title="Resultante nula"
                    formula={String.raw`F_{\text{res}} = 0`}
                    tone="green"
                  />
                  <FormulaStep
                    title="Aceleração nula"
                    formula={String.raw`0 = ma \Rightarrow a = 0`}
                    tone="purple"
                  />
                  <p className="text-sm text-slate-700 leading-7">
                    O corpo pode estar parado ou pode estar se movendo com velocidade constante.
                  </p>
                </div>
              </FormulaGrid>
            </Section>

            <Section
              icon={Shield}
              title="Parte 3 — Definições Formais"
              subtitle="As ferramentas que você realmente usa ao resolver problemas de Dinâmica."
              gradient="bg-gradient-to-r from-slate-700 to-slate-900"
            >
              <MiniTitle>3.1 Força</MiniTitle>
              <Paragraph>
                Força é uma grandeza física vetorial associada à interação entre corpos, capaz de alterar o estado de movimento de um corpo e/ou produzir deformações.
              </Paragraph>
              <BulletList
                items={[
                  <>módulo;</>,
                  <>direção;</>,
                  <>sentido;</>,
                  <>ponto de aplicação.</>,
                ]}
              />
              <Paragraph>
                Representamos força por <InlineFormulaBox formula={String.raw`\vec{F}`} />. A unidade de força no Sistema Internacional é o newton, símbolo{" "}
                <InlineFormulaBox formula={String.raw`\text{N}`} />.
              </Paragraph>
              <FormulaStep
                title="Unidade de força"
                explanation="A unidade vem diretamente da Segunda Lei."
                formula={String.raw`1 \ \text{N} = 1 \ \text{kg} \cdot \frac{\text{m}}{\text{s}^2}`}
                tone="blue"
              />

              <MiniTitle>3.2 Força resultante</MiniTitle>
              <Paragraph>
                A força resultante sobre um corpo é a soma vetorial de todas as forças que atuam nesse corpo.
              </Paragraph>
              <FormulaStep
                title="Soma vetorial das forças"
                formula={String.raw`\vec{F}_{\text{res}} = \vec{F}_1 + \vec{F}_2 + \vec{F}_3 + \cdots`}
                tone="green"
              />

              <FormulaGrid>
                <NoteBox title="Forças na mesma direção" tone="blue">
                  Escolha um sentido positivo e trabalhe com sinais. Exemplo:{" "}
                  <InlineFormulaBox formula={String.raw`F_{\text{res}} = 20 - 8 = 12 \ \text{N}`} />.
                </NoteBox>

                <NoteBox title="Forças perpendiculares" tone="green">
                  Use Pitágoras e trigonometria:{" "}
                  <InlineFormulaBox formula={String.raw`F_{\text{res}} = \sqrt{F_x^2 + F_y^2}`} /> e{" "}
                  <InlineFormulaBox formula={String.raw`\tan\theta = \frac{F_y}{F_x}`} />.
                </NoteBox>
              </FormulaGrid>

              <MiniTitle>3.3 Massa e inércia</MiniTitle>
              <Paragraph>
                Massa é uma grandeza escalar associada à inércia de um corpo. No Sistema Internacional, sua unidade é o quilograma, símbolo{" "}
                <InlineFormulaBox formula={String.raw`\text{kg}`} />.
              </Paragraph>
              <Paragraph>
                Inércia é a tendência que um corpo tem de manter seu estado de movimento. A inércia não é uma força. Ela é uma propriedade da matéria.
              </Paragraph>
              <FormulaStep
                title="Massa no denominador"
                explanation="Quanto maior a massa, menor a aceleração para uma mesma força resultante."
                formula={String.raw`a = \frac{F_{\text{res}}}{m}`}
                tone="purple"
              />

              <NoteBox title="Aviso importante" tone="red">
                Não se deve desenhar uma “força de inércia” em problemas resolvidos em referenciais inerciais. Em referenciais não inerciais, aparecem forças fictícias, mas isso é outro cuidado conceitual.
              </NoteBox>

              <MiniTitle>3.4 Referencial inercial</MiniTitle>
              <Paragraph>
                Referencial inercial é um referencial no qual vale a Primeira Lei de Newton. Em um referencial inercial, se a força resultante sobre um corpo é nula, o corpo permanece em repouso ou em movimento retilíneo uniforme.
              </Paragraph>

              <FormulaGrid>
                <FormulaStep title="Resultante nula" formula={String.raw`\vec{F}_{\text{res}} = \vec{0}`} tone="blue" />
                <FormulaStep title="Aceleração nula" formula={String.raw`\vec{a} = \vec{0}`} tone="green" />
                <FormulaStep title="Velocidade constante" formula={String.raw`\vec{v} = \text{constante}`} tone="purple" />
              </FormulaGrid>

              <Paragraph>
                A Terra geralmente é tratada como referencial aproximadamente inercial em problemas comuns de Ensino Médio, ENEM, FUVEST e vestibulares militares. Essa aproximação funciona bem para blocos, planos inclinados, elevadores, polias e movimentos próximos à superfície terrestre.
              </Paragraph>

              <MiniTitle>3.5 Primeira Lei de Newton</MiniTitle>
              <blockquote className="border-l-4 border-green-500 pl-5 py-3 bg-green-50 rounded-r-xl text-slate-700 italic">
                Todo corpo tende a permanecer em repouso ou em movimento retilíneo uniforme, a menos que uma força resultante externa atue sobre ele.
              </blockquote>

              <FormulaStep
                title="Forma matemática"
                formula={String.raw`\vec{F}_{\text{res}} = \vec{0} \Rightarrow \vec{a} = \vec{0} \Rightarrow \vec{v} = \text{constante}`}
                tone="green"
              />

              <NoteBox title="Equilíbrio não significa repouso" tone="amber">
                Se <InlineFormulaBox formula={String.raw`\vec{v} = \vec{0}`} />, o corpo está em repouso. Se{" "}
                <InlineFormulaBox formula={String.raw`\vec{v} \neq \vec{0}`} /> e constante, o corpo está em MRU. Os dois casos são equilíbrio.
              </NoteBox>

              <MiniTitle>3.6 Segunda Lei de Newton</MiniTitle>
              <Paragraph>
                A Segunda Lei de Newton afirma que a força resultante sobre um corpo é igual ao produto da massa do corpo pela aceleração adquirida.
              </Paragraph>

              <FormulaStep
                title="Princípio Fundamental da Dinâmica"
                formula={String.raw`\vec{F}_{\text{res}} = m\vec{a}`}
                tone="blue"
              />

              <FormulaGrid>
                <NoteBox title="Direção" tone="blue">
                  A aceleração tem a mesma direção da força resultante.
                </NoteBox>
                <NoteBox title="Sentido" tone="green">
                  A aceleração tem o mesmo sentido da força resultante.
                </NoteBox>
                <NoteBox title="Massa" tone="purple">
                  Para uma mesma força, maior massa gera menor aceleração.
                </NoteBox>
              </FormulaGrid>

              <FormulaGrid>
                <FormulaStep title="Eixo x" formula={String.raw`\sum F_x = ma_x`} tone="blue" />
                <FormulaStep title="Eixo y" formula={String.raw`\sum F_y = ma_y`} tone="green" />
              </FormulaGrid>

              <MiniTitle>3.7 Terceira Lei de Newton</MiniTitle>
              <blockquote className="border-l-4 border-rose-500 pl-5 py-3 bg-rose-50 rounded-r-xl text-slate-700 italic">
                Se um corpo A exerce uma força sobre um corpo B, então o corpo B exerce sobre A uma força de mesma intensidade, mesma direção e sentido oposto.
              </blockquote>

              <FormulaStep
                title="Ação e reação"
                formula={String.raw`\vec{F}_{A \to B} = -\vec{F}_{B \to A}`}
                tone="purple"
              />

              <BulletList
                items={[
                  <>mesmo módulo;</>,
                  <>mesma direção;</>,
                  <>sentidos opostos;</>,
                  <>corpos diferentes;</>,
                  <>mesma natureza;</>,
                  <>forças simultâneas.</>,
                ]}
              />

              <MiniTitle>3.8 Diagrama de Corpo Livre</MiniTitle>
              <Paragraph>
                O diagrama de corpo livre, ou DCL, é a representação de todas as forças que atuam sobre um corpo escolhido.
              </Paragraph>

              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                <p className="font-bold text-indigo-900 mb-4">Passos para construir um DCL correto</p>
                <NumberedSteps
                  items={[
                    <>Escolha o corpo a ser analisado.</>,
                    <>Isole mentalmente esse corpo.</>,
                    <>Desenhe apenas as forças que atuam nele.</>,
                    <>Não desenhe forças que ele exerce nos outros.</>,
                    <>Identifique quem exerce cada força.</>,
                    <>Escolha eixos convenientes.</>,
                    <>Decomponha forças inclinadas quando necessário.</>,
                    <>Aplique a Segunda Lei em cada eixo.</>,
                  ]}
                />
              </div>

              <MiniTitle>3.9 Forças importantes</MiniTitle>

              <SubTitle>Peso</SubTitle>
              <Paragraph>Peso é a força gravitacional exercida por um astro sobre um corpo.</Paragraph>
              <FormulaGrid>
                <FormulaStep title="Forma vetorial" formula={String.raw`\vec{P} = m\vec{g}`} tone="blue" />
                <FormulaStep title="Módulo do peso" formula={String.raw`P = mg`} tone="green" />
              </FormulaGrid>

              <SubTitle>Normal</SubTitle>
              <Paragraph>
                A força normal é a força de contato exercida por uma superfície sobre um corpo, perpendicular à superfície. Ela não é sempre igual ao peso.
              </Paragraph>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="p-3 text-left">Situação</th>
                      <th className="p-3 text-center">Normal</th>
                      <th className="p-3 text-left">Comentário</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-slate-50">
                      <td className="p-3 border-b border-slate-200">Superfície horizontal sem aceleração vertical</td>
                      <td className="p-3 border-b border-slate-200 text-center">
                        <MathFormula formula={String.raw`N = mg`} />
                      </td>
                      <td className="p-3 border-b border-slate-200">Caso particular.</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-3 border-b border-slate-200">Plano inclinado</td>
                      <td className="p-3 border-b border-slate-200 text-center">
                        <MathFormula formula={String.raw`N = mg\cos\theta`} />
                      </td>
                      <td className="p-3 border-b border-slate-200">Menor que o peso.</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-3 border-b border-slate-200">Elevador acelerando para cima</td>
                      <td className="p-3 border-b border-slate-200 text-center">
                        <MathFormula formula={String.raw`N = m(g+a)`} />
                      </td>
                      <td className="p-3 border-b border-slate-200">Peso aparente maior.</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-3 border-b border-slate-200">Elevador acelerando para baixo</td>
                      <td className="p-3 border-b border-slate-200 text-center">
                        <MathFormula formula={String.raw`N = m(g-a)`} />
                      </td>
                      <td className="p-3 border-b border-slate-200">Peso aparente menor.</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-3">Queda livre</td>
                      <td className="p-3 text-center">
                        <MathFormula formula={String.raw`N = 0`} />
                      </td>
                      <td className="p-3">Ausência aparente de peso.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <SubTitle>Tração</SubTitle>
              <Paragraph>
                Tração é a força exercida por fios, cordas ou cabos esticados. Em um fio ideal, consideramos fio de massa desprezível, inextensível e com mesma tração ao longo do mesmo fio.
              </Paragraph>

              <SubTitle>Atrito estático</SubTitle>
              <Paragraph>
                O atrito estático atua quando não há escorregamento relativo entre as superfícies. Ele se ajusta conforme a tendência de escorregamento, até atingir um valor máximo.
              </Paragraph>
              <FormulaGrid>
                <FormulaStep title="Intervalo possível" formula={String.raw`0 \leq f_e \leq f_{e,\text{máx}}`} tone="amber" />
                <FormulaStep title="Atrito estático máximo" formula={String.raw`f_{e,\text{máx}} = \mu_e N`} tone="amber" />
                <FormulaStep title="Relação geral" formula={String.raw`f_e \leq \mu_e N`} tone="amber" />
              </FormulaGrid>

              <SubTitle>Atrito cinético</SubTitle>
              <Paragraph>O atrito cinético atua quando há escorregamento relativo entre as superfícies.</Paragraph>
              <FormulaGrid>
                <FormulaStep title="Atrito cinético" formula={String.raw`f_c = \mu_c N`} tone="blue" />
                <FormulaStep title="Comparação usual" formula={String.raw`\mu_e > \mu_c`} tone="blue" />
              </FormulaGrid>

              <SubTitle>Forças internas e externas</SubTitle>
              <Paragraph>
                Quando analisamos um sistema formado por vários corpos, podemos classificar as forças em internas e externas. Forças internas são forças trocadas entre partes do próprio sistema. Forças externas são forças exercidas por corpos que não pertencem ao sistema.
              </Paragraph>

              <NoteBox title="Estratégia útil" tone="blue">
                Para achar a aceleração de um conjunto, muitas vezes é melhor analisar o sistema inteiro. Para achar forças internas, é necessário isolar um dos corpos.
              </NoteBox>
            </Section>

            <Section
              icon={Calculator}
              title="Parte 4 — Demonstrações Matemáticas"
              subtitle="Agora as fórmulas ficam junto da explicação. Porque fórmula solta é só decoração algébrica."
              gradient="bg-gradient-to-r from-violet-600 to-purple-700"
            >
              <MiniTitle>4.1 Da Segunda Lei para a condição de equilíbrio</MiniTitle>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <FormulaStep
                  title="Partimos da Segunda Lei"
                  formula={String.raw`\vec{F}_{\text{res}} = m\vec{a}`}
                  tone="blue"
                />
                <FormulaStep
                  title="Se a força resultante é nula"
                  formula={String.raw`\vec{F}_{\text{res}} = \vec{0}`}
                  tone="green"
                />
                <FormulaStep
                  title="Substituindo na Segunda Lei"
                  formula={String.raw`\vec{0} = m\vec{a}`}
                  tone="purple"
                />
                <FormulaStep
                  title="Como a massa não é zero"
                  explanation="Para um corpo material comum, m é diferente de zero."
                  formula={String.raw`m \neq 0 \Rightarrow \vec{a} = \vec{0}`}
                  tone="amber"
                />
                <FormulaStep
                  title="Consequência cinemática"
                  explanation="Se a aceleração é nula, a velocidade vetorial não varia."
                  formula={String.raw`\vec{v} = \text{constante}`}
                  tone="green"
                />
              </div>

              <NoteBox title="Conclusão" tone="green">
                Se a força resultante é nula, o corpo pode estar em repouso ou em movimento retilíneo uniforme.
              </NoteBox>

              <MiniTitle>4.2 Segunda Lei em componentes</MiniTitle>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <FormulaStep
                  title="Equação vetorial"
                  formula={String.raw`\vec{F}_{\text{res}} = m\vec{a}`}
                  tone="blue"
                />
                <FormulaStep
                  title="Decompondo a força resultante"
                  formula={String.raw`\vec{F}_{\text{res}} = F_{\text{res},x}\hat{i} + F_{\text{res},y}\hat{j}`}
                  tone="green"
                />
                <FormulaStep
                  title="Decompondo a aceleração"
                  formula={String.raw`\vec{a} = a_x\hat{i} + a_y\hat{j}`}
                  tone="purple"
                />
                <FormulaGrid>
                  <FormulaStep
                    title="Eixo x"
                    formula={String.raw`\sum F_x = ma_x`}
                    tone="blue"
                  />
                  <FormulaStep
                    title="Eixo y"
                    formula={String.raw`\sum F_y = ma_y`}
                    tone="green"
                  />
                </FormulaGrid>
              </div>

              <MiniTitle>4.3 Plano inclinado sem atrito</MiniTitle>
              <Paragraph>
                Considere um bloco de massa <InlineFormulaBox formula={String.raw`m`} /> em um plano inclinado de ângulo{" "}
                <InlineFormulaBox formula={String.raw`\theta`} />, sem atrito. As forças são peso e normal.
              </Paragraph>

              <FormulaGrid>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <p className="font-bold text-slate-800">Eixo perpendicular</p>
                  <FormulaStep
                    title="O bloco não sai nem entra no plano"
                    formula={String.raw`a_y = 0`}
                    tone="blue"
                  />
                  <FormulaStep
                    title="Aplicando a Segunda Lei"
                    formula={String.raw`N - mg\cos\theta = 0`}
                    tone="blue"
                  />
                  <FormulaStep
                    title="Normal"
                    formula={String.raw`N = mg\cos\theta`}
                    tone="green"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <p className="font-bold text-slate-800">Eixo paralelo</p>
                  <FormulaStep
                    title="Componente que puxa o bloco rampa abaixo"
                    formula={String.raw`mg\sin\theta = ma`}
                    tone="amber"
                  />
                  <FormulaStep
                    title="Cancelando a massa"
                    formula={String.raw`a = g\sin\theta`}
                    tone="green"
                  />
                </div>
              </FormulaGrid>

              <MiniTitle>4.4 Plano inclinado com atrito cinético</MiniTitle>
              <Paragraph>
                Se o bloco desce o plano inclinado com atrito cinético, o atrito aponta para cima do plano.
              </Paragraph>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <FormulaStep
                  title="Normal"
                  formula={String.raw`N = mg\cos\theta`}
                  tone="blue"
                />
                <FormulaStep
                  title="Atrito cinético"
                  explanation="O atrito depende da normal."
                  formula={String.raw`f_c = \mu_c N = \mu_c mg\cos\theta`}
                  tone="amber"
                />
                <FormulaStep
                  title="Segunda Lei no eixo paralelo"
                  explanation="Peso paralelo para baixo; atrito para cima."
                  formula={String.raw`mg\sin\theta - f_c = ma`}
                  tone="green"
                />
                <FormulaStep
                  title="Substituindo o atrito"
                  formula={String.raw`mg\sin\theta - \mu_c mg\cos\theta = ma`}
                  tone="green"
                />
                <FormulaStep
                  title="Aceleração"
                  formula={String.raw`a = g(\sin\theta - \mu_c\cos\theta)`}
                  tone="purple"
                />
              </div>

              <MiniTitle>4.5 Condição de iminência de escorregamento</MiniTitle>
              <Paragraph>
                Na iminência de descer, o atrito estático aponta para cima do plano e assume valor máximo.
              </Paragraph>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <FormulaStep
                  title="Atrito máximo"
                  formula={String.raw`f_e = \mu_e N`}
                  tone="amber"
                />
                <FormulaStep
                  title="Normal no plano inclinado"
                  formula={String.raw`N = mg\cos\theta`}
                  tone="blue"
                />
                <FormulaStep
                  title="Equilíbrio no eixo paralelo"
                  formula={String.raw`mg\sin\theta - f_e = 0`}
                  tone="green"
                />
                <FormulaStep
                  title="Substituindo o atrito"
                  formula={String.raw`mg\sin\theta = \mu_e mg\cos\theta`}
                  tone="green"
                />
                <FormulaStep
                  title="Relação final"
                  formula={String.raw`\tan\theta = \mu_e`}
                  tone="purple"
                />
              </div>

              <MiniTitle>4.6 Sistema de dois blocos</MiniTitle>

              <FormulaGrid>
                <FormulaStep
                  title="Massa total"
                  formula={String.raw`M = m_1 + m_2`}
                  tone="blue"
                />
                <FormulaStep
                  title="Segunda Lei no conjunto"
                  formula={String.raw`F = (m_1 + m_2)a`}
                  tone="green"
                />
                <FormulaStep
                  title="Aceleração"
                  formula={String.raw`a = \frac{F}{m_1 + m_2}`}
                  tone="green"
                />
                <FormulaStep
                  title="Força de contato"
                  explanation="Para achar força interna, isolamos um dos blocos."
                  formula={String.raw`C = m_2a = \frac{m_2F}{m_1 + m_2}`}
                  tone="purple"
                />
              </FormulaGrid>

              <MiniTitle>4.7 Máquina de Atwood ideal</MiniTitle>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <FormulaStep
                  title="Equação para o bloco mais pesado"
                  formula={String.raw`m_2g - T = m_2a`}
                  tone="blue"
                />
                <FormulaStep
                  title="Equação para o bloco mais leve"
                  formula={String.raw`T - m_1g = m_1a`}
                  tone="green"
                />
                <FormulaStep
                  title="Somando as equações"
                  explanation="A tração cancela."
                  formula={String.raw`(m_2 - m_1)g = (m_1 + m_2)a`}
                  tone="purple"
                />
                <FormulaStep
                  title="Aceleração"
                  formula={String.raw`a = \frac{(m_2 - m_1)g}{m_1 + m_2}`}
                  tone="purple"
                />
                <FormulaStep
                  title="Tração"
                  formula={String.raw`T = \frac{2m_1m_2g}{m_1 + m_2}`}
                  tone="amber"
                />
              </div>

              <MiniTitle>4.8 Elevador acelerado</MiniTitle>

              <FormulaGrid>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <p className="font-bold text-slate-800">Acelerando para cima</p>
                  <FormulaStep
                    title="Normal maior que o peso"
                    formula={String.raw`N - mg = ma`}
                    tone="blue"
                  />
                  <FormulaStep
                    title="Resultado"
                    formula={String.raw`N = m(g+a)`}
                    tone="green"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <p className="font-bold text-slate-800">Acelerando para baixo</p>
                  <FormulaStep
                    title="Normal menor que o peso"
                    formula={String.raw`mg - N = ma`}
                    tone="amber"
                  />
                  <FormulaStep
                    title="Resultado"
                    formula={String.raw`N = m(g-a)`}
                    tone="green"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 md:col-span-2">
                  <p className="font-bold text-slate-800">Queda livre</p>
                  <FormulaStep
                    title="Aceleração igual à gravidade"
                    formula={String.raw`a = g`}
                    tone="blue"
                  />
                  <FormulaStep
                    title="Normal nula"
                    formula={String.raw`N = m(g-g) = 0`}
                    tone="red"
                  />
                </div>
              </FormulaGrid>
            </Section>

            <Section
              icon={Ruler}
              title="Parte 5 — Interpretação Termo a Termo"
              subtitle="O que cada símbolo realmente significa dentro das fórmulas."
              gradient="bg-gradient-to-r from-cyan-600 to-blue-700"
            >
              <MiniTitle>5.1 Segunda Lei de Newton</MiniTitle>

              <FormulaStep
                title="Fórmula central"
                formula={String.raw`\vec{F}_{\text{res}} = m\vec{a}`}
                tone="blue"
              />

              <SubTitle>O termo <InlineFormulaBox formula={String.raw`\vec{F}_{\text{res}}`} /></SubTitle>
              <Paragraph>
                Representa a soma vetorial de todas as forças que atuam sobre o corpo. Não é “a maior força”, não é “a força aplicada”, não é “a força que está no sentido do movimento”. É a resultante.
              </Paragraph>

              <FormulaStep
                title="Soma vetorial"
                formula={String.raw`\vec{F}_{\text{res}} = \vec{F}_1 + \vec{F}_2 + \vec{F}_3 + \cdots`}
                tone="blue"
              />

              <SubTitle>O termo <InlineFormulaBox formula={String.raw`m`} /></SubTitle>
              <Paragraph>
                Representa a massa do corpo, medida da inércia. Quanto maior a massa, maior a resistência à alteração do movimento.
              </Paragraph>

              <FormulaStep
                title="Isolando a aceleração"
                formula={String.raw`a = \frac{F_{\text{res}}}{m}`}
                tone="green"
              />

              <SubTitle>O termo <InlineFormulaBox formula={String.raw`\vec{a}`} /></SubTitle>
              <Paragraph>
                Representa a aceleração vetorial. Ela indica a taxa de variação da velocidade vetorial.
              </Paragraph>

              <FormulaGrid>
                <FormulaStep
                  title="Definição média de aceleração"
                  formula={String.raw`\vec{a} = \frac{\Delta \vec{v}}{\Delta t}`}
                  tone="purple"
                />
                <FormulaStep
                  title="Aceleração pela Segunda Lei"
                  formula={String.raw`\vec{a} = \frac{\vec{F}_{\text{res}}}{m}`}
                  tone="blue"
                />
              </FormulaGrid>

              <NoteBox title="Direção da aceleração" tone="purple">
                Como a massa é positiva, dividir a força resultante por <InlineFormulaBox formula={String.raw`m`} /> não muda a direção nem o sentido do vetor. Portanto,{" "}
                <InlineFormulaBox formula={String.raw`\vec{F}_{\text{res}}`} /> e <InlineFormulaBox formula={String.raw`\vec{a}`} /> têm mesma direção e mesmo sentido.
              </NoteBox>

              <MiniTitle>5.2 Peso</MiniTitle>
              <FormulaGrid>
                <FormulaStep title="Peso vetorial" formula={String.raw`\vec{P} = m\vec{g}`} tone="blue" />
                <FormulaStep title="Módulo do peso" formula={String.raw`P = mg`} tone="green" />
              </FormulaGrid>

              <Paragraph>
                O termo <InlineFormulaBox formula={String.raw`P`} /> é o módulo da força peso. O termo{" "}
                <InlineFormulaBox formula={String.raw`m`} /> é a massa. O termo{" "}
                <InlineFormulaBox formula={String.raw`g`} /> é a aceleração da gravidade local.
              </Paragraph>

              <FormulaGrid>
                <FormulaStep title="Valor aproximado" formula={String.raw`g \approx 9{,}8 \ \text{m/s}^2`} tone="blue" />
                <FormulaStep title="Valor comum em exercícios" formula={String.raw`g = 10 \ \text{m/s}^2`} tone="green" />
              </FormulaGrid>

              <MiniTitle>5.3 Normal</MiniTitle>
              <Paragraph>
                A normal é sempre perpendicular à superfície de contato. Ela não possui uma fórmula universal única do tipo{" "}
                <InlineFormulaBox formula={String.raw`N = mg`} />. Deve ser determinada pela Segunda Lei no eixo perpendicular à superfície.
              </Paragraph>

              <FormulaGrid>
                <FormulaStep
                  title="Superfície horizontal simples"
                  formula={String.raw`N - mg = 0 \Rightarrow N = mg`}
                  tone="blue"
                />
                <FormulaStep
                  title="Plano inclinado"
                  formula={String.raw`N - mg\cos\theta = 0 \Rightarrow N = mg\cos\theta`}
                  tone="green"
                />
                <FormulaStep
                  title="Elevador subindo acelerado"
                  formula={String.raw`N - mg = ma \Rightarrow N = m(g+a)`}
                  tone="purple"
                />
              </FormulaGrid>

              <MiniTitle>5.4 Tração</MiniTitle>
              <Paragraph>
                A tração aparece em cordas, fios e cabos esticados. Em fio ideal, a tração tem o mesmo módulo ao longo de todo o fio.
              </Paragraph>

              <FormulaGrid>
                <FormulaStep title="Pendurado parado" formula={String.raw`T = mg`} tone="blue" />
                <FormulaStep title="Subindo acelerado" formula={String.raw`T = m(g+a)`} tone="green" />
                <FormulaStep title="Descendo acelerado" formula={String.raw`T = m(g-a)`} tone="amber" />
              </FormulaGrid>

              <MiniTitle>5.5 Atrito</MiniTitle>
              <FormulaGrid>
                <NoteBox title="Atrito estático" tone="amber">
                  <InlineFormulaBox formula={String.raw`f_e \leq \mu_e N`} />. Ele se ajusta até um limite máximo. A igualdade só ocorre na iminência de escorregar.
                </NoteBox>

                <NoteBox title="Atrito cinético" tone="blue">
                  <InlineFormulaBox formula={String.raw`f_c = \mu_c N`} />. Vale quando já há deslizamento relativo entre as superfícies.
                </NoteBox>
              </FormulaGrid>

              <MiniTitle>5.6 Componentes do peso no plano inclinado</MiniTitle>
              <FormulaGrid>
                <FormulaStep title="Componente paralela" formula={String.raw`P_{\parallel} = mg\sin\theta`} tone="green" />
                <FormulaStep title="Componente perpendicular" formula={String.raw`P_{\perp} = mg\cos\theta`} tone="blue" />
                <FormulaStep title="Normal" formula={String.raw`N = mg\cos\theta`} tone="purple" />
                <FormulaStep title="Aceleração sem atrito" formula={String.raw`a = g\sin\theta`} tone="green" />
              </FormulaGrid>

              <MiniTitle>5.7 Ação e reação</MiniTitle>
              <FormulaStep
                title="Terceira Lei"
                formula={String.raw`\vec{F}_{A \to B} = -\vec{F}_{B \to A}`}
                tone="purple"
              />
              <Paragraph>
                O sinal negativo indica sentidos opostos. Os módulos são iguais, as direções são iguais, os sentidos são opostos e as forças atuam em corpos diferentes.
              </Paragraph>

              <NoteBox title="Peso e normal não são ação e reação" tone="red">
                Peso é força da Terra sobre o corpo. A reação ao peso é a força do corpo sobre a Terra. Normal é força da superfície sobre o corpo. A reação à normal é a força do corpo sobre a superfície.
              </NoteBox>
            </Section>

            <Section
              icon={Scale}
              title="Parte 6 — Unidades e Análise Dimensional"
              subtitle="Conferindo se as fórmulas fazem sentido físico também nas unidades."
              gradient="bg-gradient-to-r from-emerald-600 to-teal-700"
            >
              <MiniTitle>6.1 Grandezas fundamentais</MiniTitle>
              <BulletList
                items={[
                  <>comprimento: metro, <InlineFormulaBox formula={String.raw`\text{m}`} />;</>,
                  <>massa: quilograma, <InlineFormulaBox formula={String.raw`\text{kg}`} />;</>,
                  <>tempo: segundo, <InlineFormulaBox formula={String.raw`\text{s}`} />.</>,
                ]}
              />

              <FormulaGrid>
                <FormulaStep title="Velocidade" formula={String.raw`[v] = \frac{\text{m}}{\text{s}}`} tone="blue" />
                <FormulaStep title="Aceleração" formula={String.raw`[a] = \frac{\text{m}}{\text{s}^2}`} tone="green" />
              </FormulaGrid>

              <MiniTitle>6.2 Unidade de força</MiniTitle>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <FormulaStep title="Segunda Lei" formula={String.raw`F = ma`} tone="blue" />
                <FormulaStep title="Dimensões" formula={String.raw`[F] = [m][a]`} tone="green" />
                <FormulaStep title="Substituindo unidades" formula={String.raw`[F] = \text{kg} \cdot \frac{\text{m}}{\text{s}^2}`} tone="purple" />
                <FormulaStep title="Newton" formula={String.raw`1 \ \text{N} = 1 \ \text{kg} \cdot \frac{\text{m}}{\text{s}^2}`} tone="amber" />
              </div>

              <MiniTitle>6.3 Peso, normal, tração e atrito</MiniTitle>
              <FormulaGrid>
                <NoteBox title="Peso" tone="blue">
                  <InlineFormulaBox formula={String.raw`P = mg`} /> tem unidade{" "}
                  <InlineFormulaBox formula={String.raw`\text{kg}\cdot \frac{\text{m}}{\text{s}^2} = \text{N}`} />.
                </NoteBox>

                <NoteBox title="Normal" tone="green">
                  Normal é força de contato. Portanto, é medida em newtons.
                </NoteBox>

                <NoteBox title="Tração" tone="purple">
                  Tração também é força. Portanto, é medida em newtons.
                </NoteBox>

                <NoteBox title="Atrito" tone="amber">
                  Atrito é força. Portanto, é medido em newtons.
                </NoteBox>
              </FormulaGrid>

              <MiniTitle>6.4 Coeficiente de atrito é adimensional</MiniTitle>

              <FormulaGrid>
                <FormulaStep title="Atrito cinético" formula={String.raw`f_c = \mu_c N`} tone="blue" />
                <FormulaStep title="Isolando o coeficiente" formula={String.raw`\mu_c = \frac{f_c}{N}`} tone="green" />
                <FormulaStep title="Unidades cancelam" formula={String.raw`[\mu_c] = \frac{\text{N}}{\text{N}} = 1`} tone="purple" />
              </FormulaGrid>

              <MiniTitle>6.5 Conferindo plano inclinado sem atrito</MiniTitle>
              <FormulaGrid>
                <FormulaStep title="Fórmula" formula={String.raw`a = g\sin\theta`} tone="blue" />
                <FormulaStep title="Unidade de g" formula={String.raw`[g] = \frac{\text{m}}{\text{s}^2}`} tone="green" />
                <FormulaStep title="Seno é adimensional" formula={String.raw`[\sin\theta] = 1`} tone="purple" />
                <FormulaStep title="Unidade final" formula={String.raw`[a] = \frac{\text{m}}{\text{s}^2}`} tone="amber" />
              </FormulaGrid>

              <MiniTitle>6.6 Conferindo plano inclinado com atrito</MiniTitle>
              <FormulaStep
                title="Fórmula"
                explanation="Seno, cosseno e coeficiente de atrito são adimensionais. A unidade da aceleração vem de g."
                formula={String.raw`a = g(\sin\theta - \mu_c\cos\theta)`}
                tone="blue"
              />

              <MiniTitle>6.7 Conferindo a máquina de Atwood</MiniTitle>
              <FormulaGrid>
                <FormulaStep
                  title="Aceleração"
                  explanation="A razão entre massas é adimensional, então a unidade vem de g."
                  formula={String.raw`a = \frac{(m_2 - m_1)g}{m_1 + m_2}`}
                  tone="green"
                />
                <FormulaStep
                  title="Tração"
                  formula={String.raw`[T] = \frac{\text{kg}^2}{\text{kg}}\cdot \frac{\text{m}}{\text{s}^2} = \text{N}`}
                  tone="purple"
                />
              </FormulaGrid>
            </Section>

            <Section
              icon={Compass}
              title="Parte 7 — Casos Especiais"
              subtitle="Situações que aparecem o tempo todo em prova."
              gradient="bg-gradient-to-r from-teal-600 to-cyan-700"
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="p-3 text-left">Caso</th>
                      <th className="p-3 text-left">Condição</th>
                      <th className="p-3 text-left">Interpretação</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-slate-50">
                      <td className="p-3 border-b border-slate-200 font-semibold">Equilíbrio estático</td>
                      <td className="p-3 border-b border-slate-200">
                        <MathFormula formula={String.raw`\vec{v} = \vec{0}`} />,{" "}
                        <MathFormula formula={String.raw`\vec{a} = \vec{0}`} />
                      </td>
                      <td className="p-3 border-b border-slate-200">Corpo parado e permanecendo parado.</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-3 border-b border-slate-200 font-semibold">Equilíbrio dinâmico</td>
                      <td className="p-3 border-b border-slate-200">
                        <MathFormula formula={String.raw`\vec{v} = \text{constante}`} />
                      </td>
                      <td className="p-3 border-b border-slate-200">Corpo em MRU, com resultante nula.</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-3 border-b border-slate-200 font-semibold">Força paralela à velocidade</td>
                      <td className="p-3 border-b border-slate-200">
                        <MathFormula formula={String.raw`\vec{F}_{\text{res}} \parallel \vec{v}`} />
                      </td>
                      <td className="p-3 border-b border-slate-200">Muda o módulo da velocidade.</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-3 border-b border-slate-200 font-semibold">Força perpendicular à velocidade</td>
                      <td className="p-3 border-b border-slate-200">
                        <MathFormula formula={String.raw`\vec{F}_{\text{res}} \perp \vec{v}`} />
                      </td>
                      <td className="p-3 border-b border-slate-200">Muda a direção da velocidade.</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-3 font-semibold">Normal nula</td>
                      <td className="p-3">
                        <MathFormula formula={String.raw`N = 0`} />
                      </td>
                      <td className="p-3">Perda de contato ou queda livre.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <MiniTitle>7.1 Força resultante perpendicular à velocidade</MiniTitle>
              <Paragraph>
                Isso ocorre em movimentos curvilíneos, como o movimento circular uniforme. A rapidez pode ser constante, mas a direção da velocidade muda.
              </Paragraph>
              <FormulaGrid>
                <FormulaStep title="Aceleração centrípeta" formula={String.raw`a_c = \frac{v^2}{R}`} tone="blue" />
                <FormulaStep title="Força centrípeta" formula={String.raw`F_c = m\frac{v^2}{R}`} tone="green" />
              </FormulaGrid>

              <MiniTitle>7.2 Atrito estático nulo</MiniTitle>
              <Paragraph>
                Pode haver contato entre superfícies sem atrito atuando. O atrito estático só aparece se houver tendência de escorregamento relativo.
              </Paragraph>
              <FormulaStep title="Sem tendência de escorregamento" formula={String.raw`f_e = 0`} tone="amber" />

              <MiniTitle>7.3 Fio ideal com mesma tração</MiniTitle>
              <Paragraph>
                Em um fio ideal, sem massa, a tração é a mesma ao longo do fio. Se a tração fosse diferente em dois pontos de um trecho sem massa, haveria resultante sobre massa nula, criando uma inconsistência no modelo ideal.
              </Paragraph>

              <MiniTitle>7.4 Polia ideal</MiniTitle>
              <Paragraph>
                Uma polia ideal é sem massa, sem atrito no eixo e apenas muda a direção da tração, sem alterar seu módulo.
              </Paragraph>

              <MiniTitle>7.5 Forças internas cancelando no sistema</MiniTitle>
              <FormulaGrid>
                <FormulaStep title="Ação e reação interna" formula={String.raw`\vec{F}_{A \to B} = -\vec{F}_{B \to A}`} tone="blue" />
                <FormulaStep title="Soma no sistema completo" formula={String.raw`\vec{F}_{A \to B} + \vec{F}_{B \to A} = \vec{0}`} tone="green" />
              </FormulaGrid>
              <Paragraph>
                Essas forças não entram na resultante externa do sistema completo, mas entram quando analisamos cada corpo separadamente.
              </Paragraph>

              <MiniTitle>7.6 Vínculo geométrico em fio inextensível</MiniTitle>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <FormulaStep title="Comprimento total constante" formula={String.raw`L = x_1 + x_2 + \text{constante}`} tone="blue" />
                <FormulaStep title="Parte variável constante" formula={String.raw`x_1 + x_2 = \text{constante}`} tone="green" />
                <FormulaStep title="Derivando uma vez" formula={String.raw`v_1 + v_2 = 0`} tone="purple" />
                <FormulaStep title="Derivando novamente" formula={String.raw`a_1 + a_2 = 0`} tone="amber" />
                <FormulaStep title="Em módulo" formula={String.raw`|a_1| = |a_2|`} tone="green" />
              </div>

              <NoteBox title="Polia móvel" tone="amber">
                Em polias móveis, a relação pode mudar para algo como{" "}
                <InlineFormulaBox formula={String.raw`|a_{\text{extremidade}}| = 2|a_{\text{carga}}|`} />, dependendo da geometria do fio.
              </NoteBox>
            </Section>

            <Section
              icon={Activity}
              title="Parte 8 — Interpretação Gráfica"
              subtitle="Como ler gráficos de força, aceleração e velocidade usando Newton."
              gradient="bg-gradient-to-r from-blue-600 to-indigo-700"
            >
              <MiniTitle>8.1 Gráfico força resultante versus aceleração</MiniTitle>

              <FormulaStep
                title="Segunda Lei em módulo"
                formula={String.raw`F_{\text{res}} = ma`}
                tone="blue"
              />

              <Paragraph>
                Se colocarmos <InlineFormulaBox formula={String.raw`a`} /> no eixo horizontal e{" "}
                <InlineFormulaBox formula={String.raw`F_{\text{res}}`} /> no eixo vertical, teremos uma reta que passa pela origem.
              </Paragraph>

              <FormulaStep
                title="Coeficiente angular"
                explanation="O coeficiente angular da reta é a massa."
                formula={String.raw`m = \frac{\Delta F_{\text{res}}}{\Delta a}`}
                tone="green"
              />

              <MiniTitle>8.2 Gráfico aceleração versus força resultante</MiniTitle>

              <FormulaGrid>
                <FormulaStep title="Isolando a aceleração" formula={String.raw`a = \frac{F_{\text{res}}}{m}`} tone="blue" />
                <FormulaStep title="Coeficiente angular" formula={String.raw`a = \frac{1}{m}F_{\text{res}}`} tone="green" />
              </FormulaGrid>

              <Paragraph>
                Nesse caso, o coeficiente angular é <InlineFormulaBox formula={String.raw`\frac{1}{m}`} />. Quanto maior a massa, menor a inclinação.
              </Paragraph>

              <MiniTitle>8.3 Gráfico força resultante versus tempo</MiniTitle>
              <FormulaStep
                title="Aceleração a partir da força"
                formula={String.raw`a = \frac{F_{\text{res}}}{m}`}
                tone="blue"
              />

              <Paragraph>
                Se <InlineFormulaBox formula={String.raw`F_{\text{res}}`} /> é constante, então a aceleração é constante. Se{" "}
                <InlineFormulaBox formula={String.raw`F_{\text{res}} = 0`} />, então{" "}
                <InlineFormulaBox formula={String.raw`a = 0`} />.
              </Paragraph>

              <MiniTitle>8.4 Gráfico aceleração versus tempo</MiniTitle>
              <FormulaGrid>
                <FormulaStep title="Definição" formula={String.raw`a = \frac{\Delta v}{\Delta t}`} tone="blue" />
                <FormulaStep title="Área no gráfico a×t" formula={String.raw`\Delta v = a\Delta t`} tone="green" />
                <FormulaStep title="Equação horária da velocidade" formula={String.raw`v = v_0 + at`} tone="purple" />
              </FormulaGrid>

              <MiniTitle>8.5 Gráfico velocidade versus tempo</MiniTitle>
              <Paragraph>
                No gráfico <InlineFormulaBox formula={String.raw`v \times t`} />, a inclinação representa a aceleração.
              </Paragraph>

              <FormulaStep
                title="Inclinação"
                formula={String.raw`a_m = \frac{\Delta v}{\Delta t}`}
                tone="blue"
              />

              <MiniTitle>8.6 Gráfico do atrito estático</MiniTitle>
              <Paragraph>
                Enquanto o bloco não escorrega, o atrito estático se ajusta para equilibrar a força aplicada.
              </Paragraph>

              <FormulaGrid>
                <FormulaStep title="Equilíbrio horizontal" formula={String.raw`F - f_e = 0`} tone="blue" />
                <FormulaStep title="Atrito se ajusta" formula={String.raw`f_e = F`} tone="green" />
                <FormulaStep title="Valor máximo" formula={String.raw`f_{e,\text{máx}} = \mu_e N`} tone="amber" />
              </FormulaGrid>

              <MiniTitle>8.7 Gráfico da normal em um elevador</MiniTitle>
              <FormulaGrid>
                <FormulaStep title="Acelerando para cima" formula={String.raw`N = m(g+a)`} tone="blue" />
                <FormulaStep title="Acelerando para baixo" formula={String.raw`N = m(g-a)`} tone="green" />
                <FormulaStep title="Queda livre" formula={String.raw`a = g \Rightarrow N = 0`} tone="amber" />
              </FormulaGrid>

              <NoteBox title="Ponte entre Dinâmica e Cinemática" tone="purple">
                Se a questão dá força, você acha aceleração. Se acha aceleração, pode usar Cinemática. Essa transição é comum em provas fortes.
              </NoteBox>
            </Section>

            <Section
              icon={Layers}
              title="Parte 9 — Aplicações Práticas"
              subtitle="Onde as Leis de Newton aparecem fora do quadro."
              gradient="bg-gradient-to-r from-orange-600 to-red-600"
            >
              <FormulaGrid>
                <NoteBox title="Cinto de segurança" tone="blue">
                  Durante uma freada brusca, o passageiro tende a continuar em movimento por inércia. O cinto exerce força no sentido de desacelerar o corpo.
                </NoteBox>

                <NoteBox title="Airbag" tone="green">
                  O airbag aumenta o tempo de desaceleração. Como{" "}
                  <InlineFormulaBox formula={String.raw`a_m = \frac{\Delta v}{\Delta t}`} />, aumentar{" "}
                  <InlineFormulaBox formula={String.raw`\Delta t`} /> reduz a aceleração média e, portanto, reduz a força média.
                </NoteBox>

                <NoteBox title="Caminhar" tone="purple">
                  O pé empurra o chão para trás. O chão empurra o pé para frente por atrito estático. Sem atrito, você escorrega.
                </NoteBox>

                <NoteBox title="Carro acelerando" tone="amber">
                  O motor gira as rodas. Os pneus empurram o chão para trás. O chão empurra os pneus para frente por atrito estático.
                </NoteBox>

                <NoteBox title="Frenagem" tone="red">
                  A força resultante aponta no sentido oposto à velocidade. A aceleração também aponta para trás, reduzindo o módulo da velocidade.
                </NoteBox>

                <NoteBox title="Elevadores" tone="blue">
                  A sensação de peso muda porque a normal muda. Para cima:{" "}
                  <InlineFormulaBox formula={String.raw`N = m(g+a)`} />. Para baixo:{" "}
                  <InlineFormulaBox formula={String.raw`N = m(g-a)`} />.
                </NoteBox>

                <NoteBox title="Plano inclinado" tone="green">
                  Rampas reduzem a componente do peso ao longo do movimento:{" "}
                  <InlineFormulaBox formula={String.raw`P_{\parallel} = mg\sin\theta`} />.
                </NoteBox>

                <NoteBox title="Polias" tone="purple">
                  Polias podem mudar direção de força e impor vínculos entre acelerações. Em polia móvel, a carga pode subir metade do deslocamento da extremidade.
                </NoteBox>
              </FormulaGrid>

              <MiniTitle>Satélites e órbitas</MiniTitle>
              <Paragraph>
                Um satélite em órbita não está “sem gravidade”. Ele está caindo continuamente em torno da Terra. A força gravitacional atua como força centrípeta.
              </Paragraph>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <FormulaStep title="Força gravitacional como centrípeta" formula={String.raw`F_g = F_c`} tone="blue" />
                <FormulaStep title="Igualando expressões" formula={String.raw`\frac{GMm}{R^2} = m\frac{v^2}{R}`} tone="green" />
                <FormulaStep title="Velocidade orbital" formula={String.raw`v = \sqrt{\frac{GM}{R}}`} tone="purple" />
              </div>

              <MiniTitle>Esportes</MiniTitle>
              <Paragraph>
                Em uma arrancada, o corredor empurra o chão para trás e o chão empurra o corredor para frente. Em um salto, o atleta empurra o chão para baixo e o chão empurra o atleta para cima pela normal.
              </Paragraph>

              <FormulaStep
                title="Impulsão vertical"
                explanation="Se o atleta acelera para cima, a normal deve superar o peso."
                formula={String.raw`N - mg = ma \Rightarrow N > mg`}
                tone="green"
              />
            </Section>
          </div>
        )}

        {activeTab === "exemplos" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <Calculator className="w-6 h-6 text-indigo-600" />
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Exemplos Resolvidos</h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Clique em cada exemplo para ver DCL, equações, substituição numérica e ideia física.
                  </p>
                </div>
              </div>
            </div>

            {examples.map((ex) => (
              <div key={ex.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
                <button
                  onClick={() => toggleExample(ex.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="text-left">
                    <h3 className="font-black text-slate-900">{ex.title}</h3>
                    <p className="text-slate-500 text-sm mt-2 leading-6">{ex.enunciado}</p>
                  </div>
                  {openExamples[ex.id] ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" />
                  )}
                </button>

                {openExamples[ex.id] && (
                  <div className="px-6 pb-6 border-t border-slate-100 pt-5">{ex.content}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "resumo" && (
          <div className="space-y-10">
            <Section
              icon={AlertTriangle}
              title="Parte 11 — Armadilhas e Erros Comuns"
              subtitle="Onde a maioria erra e depois culpa a prova, esse velho esporte nacional."
              gradient="bg-gradient-to-r from-red-600 to-rose-700"
            >
              <FormulaGrid>
                {[
                  {
                    title: "Achar que força mantém movimento",
                    text: "Força resultante não mantém movimento. Força resultante altera movimento. Corpo em MRU tem resultante nula.",
                  },
                  {
                    title: "Confundir força aplicada com força resultante",
                    text: "A aceleração vem da força que sobra depois da soma vetorial, não de uma força isolada qualquer.",
                  },
                  {
                    title: "Confundir massa com peso",
                    text: "Massa é medida em kg. Peso é força e é medido em N.",
                  },
                  {
                    title: "Achar que normal sempre vale mg",
                    text: "Normal deve ser calculada pela Segunda Lei no eixo perpendicular ao contato.",
                  },
                  {
                    title: "Achar que peso e normal são ação e reação",
                    text: "Não são. Ambos atuam no mesmo corpo. Ação e reação atuam em corpos diferentes.",
                  },
                  {
                    title: "Colocar ação e reação no mesmo DCL",
                    text: "No DCL de um corpo, desenhe só forças que atuam naquele corpo.",
                  },
                  {
                    title: "Usar fe = μeN sempre",
                    text: "Para atrito estático, a relação geral é fe ≤ μeN. Igualdade só na iminência.",
                  },
                  {
                    title: "Errar o sentido do atrito",
                    text: "O atrito se opõe à tendência de deslizamento relativo entre superfícies, não sempre ao movimento do corpo.",
                  },
                  {
                    title: "Esquecer que aceleração é vetorial",
                    text: "Em curva, mesmo com rapidez constante, há aceleração porque a direção da velocidade muda.",
                  },
                  {
                    title: "Tratar polia como enfeite",
                    text: "Polias impõem vínculos geométricos. Nem sempre as acelerações têm mesmo módulo.",
                  },
                  {
                    title: "Misturar forças internas e externas",
                    text: "Forças internas cancelam no sistema completo, mas aparecem no DCL de corpos isolados.",
                  },
                  {
                    title: "Não testar casos limites",
                    text: "Testar θ = 0° e θ = 90° no plano inclinado evita fórmulas absurdas.",
                  },
                ].map((trap) => (
                  <div key={trap.title} className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-xl">
                    <p className="font-bold text-red-800 text-sm mb-1">{trap.title}</p>
                    <p className="text-slate-700 text-sm leading-6">{trap.text}</p>
                  </div>
                ))}
              </FormulaGrid>
            </Section>

            <Section
              icon={Target}
              title="Parte 12 — Pontos Importantes para ITA/IME e Vestibulares Difíceis"
              subtitle="Modelagem, vínculos, sistemas e escolhas inteligentes."
              gradient="bg-gradient-to-r from-indigo-700 to-purple-800"
            >
              <MiniTitle>12.1 O DCL vale mais que a fórmula decorada</MiniTitle>
              <Paragraph>
                Em problemas difíceis, a Segunda Lei quase sempre aparece de forma simples. O desafio real está em saber quais forças entram, quais não entram, qual eixo escolher e quais vínculos existem.
              </Paragraph>

              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                <p className="font-bold text-indigo-900 mb-4">Sequência segura</p>
                <NumberedSteps
                  items={[
                    <>Escolha o corpo ou sistema.</>,
                    <>Faça o DCL.</>,
                    <>Escolha eixos convenientes.</>,
                    <>Escreva <InlineFormulaBox formula={String.raw`\sum F = ma`} /> em cada eixo.</>,
                    <>Escreva os vínculos geométricos.</>,
                    <>Resolva o sistema de equações.</>,
                    <>Verifique se o resultado faz sentido físico.</>,
                  ]}
                />
              </div>

              <MiniTitle>12.2 Escolha inteligente de sistema</MiniTitle>
              <Paragraph>
                Se o problema pede aceleração de um conjunto, muitas vezes analise o conjunto inteiro. Depois, para achar tração, normal de contato ou força interna, isole um corpo.
              </Paragraph>

              <FormulaGrid>
                <FormulaStep title="Sistema completo" formula={String.raw`F = (m_1 + m_2)a`} tone="blue" />
                <FormulaStep title="Aceleração" formula={String.raw`a = \frac{F}{m_1 + m_2}`} tone="green" />
              </FormulaGrid>

              <MiniTitle>12.3 Centro de massa e forças externas</MiniTitle>
              <FormulaStep
                title="Centro de massa"
                formula={String.raw`\vec{F}_{\text{ext,res}} = M\vec{a}_{CM}`}
                tone="purple"
              />
              <Paragraph>
                Forças internas podem alterar movimentos relativos entre partes do sistema, mas não aceleram o centro de massa do sistema como um todo.
              </Paragraph>

              <MiniTitle>12.4 Atrito estático exige análise de tendência</MiniTitle>
              <Paragraph>
                Antes de escolher o sentido do atrito estático, pergunte: se não houvesse atrito, para onde esse corpo tenderia a escorregar em relação à superfície?
              </Paragraph>

              <MiniTitle>12.5 Em polias, deduza o vínculo</MiniTitle>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <FormulaStep title="Comprimento constante" formula={String.raw`L = x_A + 2x_B + \text{constante}`} tone="blue" />
                <FormulaStep title="Parte variável" formula={String.raw`x_A + 2x_B = \text{constante}`} tone="green" />
                <FormulaStep title="Velocidades" formula={String.raw`v_A + 2v_B = 0`} tone="purple" />
                <FormulaStep title="Acelerações" formula={String.raw`a_A + 2a_B = 0`} tone="amber" />
                <FormulaStep title="Em módulo" formula={String.raw`|a_A| = 2|a_B|`} tone="green" />
              </div>

              <MiniTitle>12.6 Testes de limite</MiniTitle>
              <FormulaGrid>
                <FormulaStep title="Plano inclinado" formula={String.raw`a = g\sin\theta`} tone="blue" />
                <FormulaStep title="Plano horizontal" formula={String.raw`\theta = 0^\circ \Rightarrow a = 0`} tone="green" />
                <FormulaStep title="Plano vertical" formula={String.raw`\theta = 90^\circ \Rightarrow a = g`} tone="purple" />
                <FormulaStep title="Atwood" formula={String.raw`a = \frac{(m_2 - m_1)g}{m_1 + m_2}`} tone="amber" />
                <FormulaStep title="Massas iguais" formula={String.raw`m_2 = m_1 \Rightarrow a = 0`} tone="green" />
                <FormulaStep title="Uma massa desprezível" formula={String.raw`m_1 \approx 0 \Rightarrow a \approx g`} tone="blue" />
              </FormulaGrid>

              <MiniTitle>12.7 Referenciais não inerciais</MiniTitle>
              <Paragraph>
                A forma simples <InlineFormulaBox formula={String.raw`\sum F = ma`} /> vale diretamente em referenciais inerciais. Em elevadores, carros acelerados e referenciais girantes, pode ser mais seguro resolver a partir do solo.
              </Paragraph>
            </Section>

            <Section
              icon={Zap}
              title="Parte 13 — Resumo Final Organizado"
              subtitle="A página inteira condensada sem virar resumo burro."
              gradient="bg-gradient-to-r from-slate-700 to-slate-900"
            >
              <div className="bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 rounded-2xl p-7 text-center shadow-inner">
                <p className="text-amber-600 font-black text-lg mb-3">Ideia central da Dinâmica</p>
                <p className="text-slate-900 text-2xl font-black">Força resultante não mantém movimento.</p>
                <p className="text-green-700 text-2xl font-black mt-1">Força resultante altera movimento.</p>
              </div>

              <FormulaGrid>
                <NoteBox title="Primeira Lei" tone="green">
                  <InlineFormulaBox formula={String.raw`\vec{F}_{\text{res}} = \vec{0}`} /> implica{" "}
                  <InlineFormulaBox formula={String.raw`\vec{a} = \vec{0}`} /> e{" "}
                  <InlineFormulaBox formula={String.raw`\vec{v} = \text{constante}`} />.
                </NoteBox>

                <NoteBox title="Segunda Lei" tone="blue">
                  <InlineFormulaBox formula={String.raw`\vec{F}_{\text{res}} = m\vec{a}`} />. A aceleração tem mesma direção e mesmo sentido da resultante.
                </NoteBox>

                <NoteBox title="Terceira Lei" tone="purple">
                  <InlineFormulaBox formula={String.raw`\vec{F}_{A \to B} = -\vec{F}_{B \to A}`} />. Ação e reação atuam em corpos diferentes.
                </NoteBox>

                <NoteBox title="Peso" tone="amber">
                  <InlineFormulaBox formula={String.raw`\vec{P} = m\vec{g}`} /> e{" "}
                  <InlineFormulaBox formula={String.raw`P = mg`} />.
                </NoteBox>
              </FormulaGrid>

              <MiniTitle>Fórmulas principais</MiniTitle>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="p-3 text-left">Tema</th>
                      <th className="p-3 text-center">Fórmula</th>
                      <th className="p-3 text-left">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-slate-50">
                      <td className="p-3 border-b border-slate-200 font-semibold">Força resultante</td>
                      <td className="p-3 border-b border-slate-200 text-center">
                        <MathFormula formula={String.raw`\vec{F}_{\text{res}} = m\vec{a}`} />
                      </td>
                      <td className="p-3 border-b border-slate-200">Equação central.</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-3 border-b border-slate-200 font-semibold">Peso</td>
                      <td className="p-3 border-b border-slate-200 text-center">
                        <MathFormula formula={String.raw`P = mg`} />
                      </td>
                      <td className="p-3 border-b border-slate-200">Peso é força.</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-3 border-b border-slate-200 font-semibold">Normal em plano inclinado</td>
                      <td className="p-3 border-b border-slate-200 text-center">
                        <MathFormula formula={String.raw`N = mg\cos\theta`} />
                      </td>
                      <td className="p-3 border-b border-slate-200">Sem aceleração perpendicular.</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-3 border-b border-slate-200 font-semibold">Atrito estático</td>
                      <td className="p-3 border-b border-slate-200 text-center">
                        <MathFormula formula={String.raw`f_e \leq \mu_e N`} />
                      </td>
                      <td className="p-3 border-b border-slate-200">Igualdade só na iminência.</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-3 border-b border-slate-200 font-semibold">Atrito cinético</td>
                      <td className="p-3 border-b border-slate-200 text-center">
                        <MathFormula formula={String.raw`f_c = \mu_c N`} />
                      </td>
                      <td className="p-3 border-b border-slate-200">Durante deslizamento.</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-3 border-b border-slate-200 font-semibold">Plano sem atrito</td>
                      <td className="p-3 border-b border-slate-200 text-center">
                        <MathFormula formula={String.raw`a = g\sin\theta`} />
                      </td>
                      <td className="p-3 border-b border-slate-200">Independe da massa.</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-3 border-b border-slate-200 font-semibold">Plano com atrito</td>
                      <td className="p-3 border-b border-slate-200 text-center">
                        <MathFormula formula={String.raw`a = g(\sin\theta - \mu_c\cos\theta)`} />
                      </td>
                      <td className="p-3 border-b border-slate-200">Bloco descendo com atrito cinético.</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-3 border-b border-slate-200 font-semibold">Atwood</td>
                      <td className="p-3 border-b border-slate-200 text-center">
                        <MathFormula formula={String.raw`a = \frac{(m_2 - m_1)g}{m_1 + m_2}`} />
                      </td>
                      <td className="p-3 border-b border-slate-200">Para m₂ maior que m₁.</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-3 font-semibold">Elevador</td>
                      <td className="p-3 text-center">
                        <MathFormula formula={String.raw`N = m(g \pm a)`} />
                      </td>
                      <td className="p-3">Sinal depende do sentido da aceleração.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <MiniTitle>Quatro perguntas para qualquer problema</MiniTitle>

              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                <NumberedSteps
                  items={[
                    <>Qual corpo ou sistema estou analisando?</>,
                    <>Quais forças externas atuam nele?</>,
                    <>Qual é a força resultante em cada eixo?</>,
                    <>Que aceleração essa resultante produz?</>,
                  ]}
                />
              </div>

              <NoteBox title="Frase final" tone="amber">
                A equação central é sempre <InlineFormulaBox formula={String.raw`\vec{F}_{\text{res}} = m\vec{a}`} />. Mas a inteligência do problema está antes da fórmula: está no DCL, na escolha do sistema, nos vínculos e na interpretação física.
              </NoteBox>
            </Section>

            <Section
              icon={ListChecks}
              title="Checklist Final de Revisão"
              subtitle="Antes de resolver uma questão de Dinâmica."
              gradient="bg-gradient-to-r from-emerald-700 to-green-800"
            >
              <FormulaGrid>
                {[
                  "Escolhi corretamente o corpo ou sistema?",
                  "Desenhei apenas forças que atuam nesse corpo?",
                  "Identifiquei quem exerce cada força?",
                  "Separei forças internas e externas?",
                  "Escolhi eixos inteligentes?",
                  "Decompus forças inclinadas corretamente?",
                  "Usei ΣF = ma em cada eixo?",
                  "Verifiquei se há vínculo de fio ou polia?",
                  "Chequei o sentido do atrito pela tendência de escorregamento?",
                  "Testei casos limites para ver se a resposta faz sentido?",
                ].map((item, index) => (
                  <div key={item} className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
                    <span className="bg-green-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-slate-700 text-sm leading-6">{item}</p>
                  </div>
                ))}
              </FormulaGrid>
            </Section>

            <Section
              icon={Rocket}
              title="Mensagem para Prova Difícil"
              subtitle="O que realmente diferencia uma resolução boa."
              gradient="bg-gradient-to-r from-black to-slate-800"
            >
              <Paragraph>
                Em Dinâmica, a fórmula raramente é o problema. O problema é o modelo. A prova difícil quer saber se você consegue escolher o sistema, enxergar as forças reais, ignorar forças fantasmas, escrever vínculos e só depois aplicar a Segunda Lei.
              </Paragraph>

              <div className="bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 rounded-2xl p-7 text-center shadow-inner">
                <p className="text-slate-900 text-2xl font-black">
                  Não comece procurando fórmula.
                </p>
                <p className="text-green-700 text-2xl font-black mt-1">
                  Comece desenhando o DCL.
                </p>
              </div>
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}
