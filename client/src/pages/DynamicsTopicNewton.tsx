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

type NoteBoxProps = {
  title: string;
  children: ReactNode;
  tone?: "blue" | "green" | "amber" | "red" | "purple" | "slate" | "indigo";
};

type FormulaStepProps = {
  title: string;
  explanation?: ReactNode;
  formula: string;
  tone?: "blue" | "green" | "amber" | "purple" | "red" | "slate";
};

type ExampleItem = {
  id: string;
  title: string;
  enunciado: string;
  content: ReactNode;
};

function FormulaBox({ formula, label }: { formula: string; label?: string }) {
  return (
    <div className="rounded-xl bg-slate-950 border border-slate-700 p-4 text-center overflow-x-auto shadow-inner">
      {label && (
        <p className="text-xs font-bold uppercase tracking-wide mb-2 text-slate-400">
          {label}
        </p>
      )}
      <div className="text-slate-200 [&_.katex]:text-slate-200 [&_.katex-display]:text-slate-200">
        <MathFormula formula={formula} display={true} />
      </div>
    </div>
  );
}

function InlineFormulaBox({ formula }: { formula: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-900 border border-slate-700 px-2 py-0.5 mx-1 align-middle text-slate-200 [&_.katex]:text-slate-200">
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
    blue: "bg-blue-400",
    green: "bg-green-400",
    amber: "bg-amber-400",
    purple: "bg-purple-400",
    red: "bg-red-400",
    slate: "bg-slate-400",
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <span className={`h-3 w-3 rounded-full ${dotStyles[tone]} mt-1.5 flex-shrink-0`} />
        <div>
          <p className="font-bold text-slate-100">{title}</p>
          {explanation && (
            <div className="text-sm text-slate-300 leading-7 mt-1">{explanation}</div>
          )}
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

function TopicBlock({
  title,
  children,
  tone = "indigo",
}: {
  title: string;
  children: ReactNode;
  tone?: "indigo" | "green" | "amber" | "rose" | "blue" | "slate";
}) {
  const styles = {
    indigo: "border-indigo-200 bg-indigo-50/50",
    green: "border-green-200 bg-green-50/50",
    amber: "border-amber-200 bg-amber-50/50",
    rose: "border-rose-200 bg-rose-50/50",
    blue: "border-blue-200 bg-blue-50/50",
    slate: "border-slate-200 bg-slate-50/70",
  };

  return (
    <div className={`rounded-2xl border ${styles[tone]} p-6 space-y-5`}>
      <h3 className="text-lg font-black text-slate-900">{title}</h3>
      {children}
    </div>
  );
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
      title: "Bloco em superfície horizontal sem atrito",
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
            <TopicBlock title="Eixo vertical" tone="blue">
              <FormulaStep
                title="Não há aceleração vertical"
                explanation="O bloco não sobe nem afunda na superfície."
                formula={String.raw`a_y = 0`}
                tone="blue"
              />
              <FormulaStep
                title="Normal e peso se equilibram"
                formula={String.raw`N - mg = 0 \Rightarrow N = mg`}
                tone="blue"
              />
            </TopicBlock>

            <TopicBlock title="Eixo horizontal" tone="green">
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
            </TopicBlock>
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
      title: "Bloco com atrito cinético",
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
        </div>
      ),
    },
    {
      id: "ex3",
      title: "Plano inclinado sem atrito",
      enunciado:
        "Um bloco está sobre um plano inclinado sem atrito, com ângulo θ = 30°. Considere g = 10 m/s². Determine a aceleração do bloco ao longo do plano.",
      content: (
        <div className="space-y-5">
          <NoteBox title="DCL descrito" tone="slate">
            As forças são peso vertical para baixo e normal perpendicular ao plano. O peso é decomposto em duas componentes: uma paralela à rampa e outra perpendicular à rampa.
          </NoteBox>

          <FormulaGrid>
            <TopicBlock title="Eixo perpendicular" tone="blue">
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
            </TopicBlock>

            <TopicBlock title="Eixo paralelo" tone="green">
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
            </TopicBlock>
          </FormulaGrid>
        </div>
      ),
    },
    {
      id: "ex4",
      title: "Sistema de dois blocos",
      enunciado:
        "Dois blocos, m₁ = 2 kg e m₂ = 3 kg, estão em contato sobre uma superfície horizontal sem atrito. Uma força horizontal F = 20 N empurra o bloco m₁ para a direita. Determine a aceleração do sistema e a força de contato entre os blocos.",
      content: (
        <div className="space-y-5">
          <NoteBox title="Estratégia" tone="blue">
            Para achar a aceleração, analisamos o sistema completo. Para achar a força de contato, isolamos um dos blocos.
          </NoteBox>

          <FormulaGrid>
            <TopicBlock title="Sistema completo" tone="blue">
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
            </TopicBlock>

            <TopicBlock title="Isolando o bloco m₂" tone="purple">
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
            </TopicBlock>
          </FormulaGrid>
        </div>
      ),
    },
    {
      id: "ex5",
      title: "Máquina de Atwood",
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
            title="Aceleração e tração"
            formula={String.raw`a = 2 \ \text{m/s}^2 \qquad T = 24 \ \text{N}`}
            tone="amber"
          />
        </div>
      ),
    },
    {
      id: "ex6",
      title: "Elevador acelerado",
      enunciado:
        "Uma pessoa de massa m = 70 kg está dentro de um elevador que acelera para cima com a = 2 m/s². Considere g = 10 m/s². Determine a força normal exercida pelo piso sobre a pessoa.",
      content: (
        <div className="space-y-5">
          <NoteBox title="DCL descrito" tone="slate">
            As forças sobre a pessoa são peso para baixo e normal para cima. Como o elevador acelera para cima, a pessoa também acelera para cima.
          </NoteBox>

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
      id: "ex7",
      title: "Ação e reação, normal e peso",
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
              <p className="text-xs text-slate-500">Dinâmica — fundamentos organizados por lei</p>
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
              title="Antes das Leis de Newton"
              subtitle="A diferença entre descrever o movimento e explicar por que ele acontece."
              gradient="bg-gradient-to-r from-amber-500 to-orange-500"
            >
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-5 rounded-r-xl">
                <Paragraph>
                  A <strong>Cinemática</strong> descreve o movimento: posição, velocidade, aceleração, trajetória, tempo e gráficos. Ela responde: <em>“como o corpo se move?”</em>
                </Paragraph>
                <Paragraph>
                  A <strong>Dinâmica</strong> tenta explicar a causa do movimento. Ela pergunta: <em>“por que o corpo acelera, freia, muda de direção ou permanece em equilíbrio?”</em>
                </Paragraph>
              </div>

              <Paragraph>
                Durante muito tempo, parecia natural pensar que uma força seria necessária para manter um corpo em movimento. Afinal, quando você empurra uma mesa e para de empurrar, ela para. O cérebro humano vê atrito e inventa filosofia errada, como de costume.
              </Paragraph>

              <Paragraph>
                O problema é que, no cotidiano, quase sempre há forças resistentes: atrito, resistência do ar e deformações. Galileu percebeu que, quanto menores as resistências, mais tempo o corpo mantém seu movimento. No limite ideal sem resistências, um corpo continuaria em movimento retilíneo uniforme indefinidamente.
              </Paragraph>

              <div className="bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 rounded-2xl p-7 text-center shadow-inner">
                <p className="text-amber-600 font-black text-lg mb-2">Ideia que muda tudo</p>
                <p className="text-slate-900 text-2xl font-black">Força resultante não mantém movimento.</p>
                <p className="text-green-700 text-2xl font-black mt-1">Força resultante altera movimento.</p>
              </div>

              <Paragraph>
                Newton organizou essa visão em três leis fundamentais. Elas conectam força, massa, aceleração, interações entre corpos e equilíbrio.
              </Paragraph>

              <FormulaStep
                title="Equação central que aparecerá em quase tudo"
                explanation="A aceleração vem da força resultante, não de uma força isolada qualquer."
                formula={String.raw`\vec{F}_{\text{res}} = m\vec{a}`}
                tone="blue"
              />
            </Section>

            <Section
              icon={Shield}
              title="Primeira Lei de Newton — Princípio da Inércia"
              subtitle="A lei que explica repouso, MRU e equilíbrio sem cair no erro de achar que força mantém movimento."
              gradient="bg-gradient-to-r from-emerald-600 to-green-700"
            >
              <TopicBlock title="Enunciado e ideia física" tone="green">
                <Paragraph>
                  A Primeira Lei de Newton afirma que todo corpo tende a permanecer em repouso ou em movimento retilíneo uniforme, a menos que uma força resultante externa atue sobre ele.
                </Paragraph>

                <FormulaStep
                  title="Forma matemática da Primeira Lei"
                  explanation="Se a resultante é nula, a aceleração é nula. Se a aceleração é nula, a velocidade vetorial permanece constante."
                  formula={String.raw`\vec{F}_{\text{res}} = \vec{0} \Rightarrow \vec{a} = \vec{0} \Rightarrow \vec{v} = \text{constante}`}
                  tone="green"
                />

                <NoteBox title="Equilíbrio não significa necessariamente repouso" tone="amber">
                  Se <InlineFormulaBox formula={String.raw`\vec{v} = \vec{0}`} />, o corpo está em repouso. Se{" "}
                  <InlineFormulaBox formula={String.raw`\vec{v} \neq \vec{0}`} /> e constante, o corpo está em MRU. Nos dois casos, a resultante é nula.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Interpretação termo a termo dentro da Primeira Lei" tone="green">
                <SubTitle>Força resultante nula</SubTitle>
                <Paragraph>
                  Não significa ausência de forças. Significa que, depois de somar vetorialmente todas as forças, o resultado é zero.
                </Paragraph>

                <FormulaStep
                  title="Exemplo de equilíbrio"
                  explanation="Um livro parado na mesa tem peso para baixo e normal para cima."
                  formula={String.raw`N - P = 0 \Rightarrow N = P`}
                  tone="green"
                />

                <SubTitle>Aceleração nula</SubTitle>
                <Paragraph>
                  Se a aceleração é nula, a velocidade não muda. O corpo pode continuar parado ou continuar em movimento retilíneo uniforme.
                </Paragraph>

                <FormulaStep
                  title="Velocidade constante"
                  formula={String.raw`\vec{a} = \vec{0} \Rightarrow \vec{v} = \text{constante}`}
                  tone="blue"
                />
              </TopicBlock>

              <TopicBlock title="Casos especiais da Primeira Lei" tone="blue">
                <FormulaGrid>
                  <NoteBox title="Equilíbrio estático" tone="green">
                    O corpo está parado e continua parado:{" "}
                    <InlineFormulaBox formula={String.raw`\vec{v} = \vec{0}`} />.
                  </NoteBox>

                  <NoteBox title="Equilíbrio dinâmico" tone="blue">
                    O corpo se move com velocidade constante:{" "}
                    <InlineFormulaBox formula={String.raw`\vec{v} = \text{constante}`} />.
                  </NoteBox>

                  <NoteBox title="MRU" tone="purple">
                    Movimento retilíneo uniforme é compatível com força resultante nula.
                  </NoteBox>

                  <NoteBox title="Repouso" tone="amber">
                    Repouso também é compatível com força resultante nula.
                  </NoteBox>
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Interpretação gráfica ligada à Primeira Lei" tone="blue">
                <Paragraph>
                  Se a força resultante é nula, a aceleração é nula. Logo, no gráfico velocidade versus tempo, a velocidade fica constante.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Resultante nula"
                    formula={String.raw`\vec{F}_{\text{res}} = \vec{0}`}
                    tone="green"
                  />
                  <FormulaStep
                    title="Aceleração nula"
                    formula={String.raw`\vec{a} = \vec{0}`}
                    tone="blue"
                  />
                  <FormulaStep
                    title="Gráfico v × t"
                    explanation="Velocidade constante gera uma reta horizontal."
                    formula={String.raw`v = \text{constante}`}
                    tone="purple"
                  />
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Armadilhas da Primeira Lei" tone="rose">
                <FormulaGrid>
                  <NoteBox title="Erro: força mantém movimento" tone="red">
                    Força resultante não mantém movimento. Ela altera movimento.
                  </NoteBox>

                  <NoteBox title="Erro: resultante nula significa parado" tone="red">
                    Resultante nula significa velocidade constante. Essa velocidade pode ser zero ou diferente de zero.
                  </NoteBox>

                  <NoteBox title="Erro: inércia é força" tone="red">
                    Inércia não é força. É propriedade da matéria.
                  </NoteBox>

                  <NoteBox title="Erro: desenhar força do movimento" tone="red">
                    “Força do movimento” não existe em DCL newtoniano. Movimento não empurra nada, apesar de algumas apostilas tentarem o contrário.
                  </NoteBox>
                </FormulaGrid>
              </TopicBlock>
            </Section>

            <Section
              icon={Calculator}
              title="Segunda Lei de Newton — Princípio Fundamental da Dinâmica"
              subtitle="A lei que liga força resultante, massa e aceleração. Aqui entram peso, normal, tração, atrito, plano inclinado, elevador e sistemas."
              gradient="bg-gradient-to-r from-indigo-600 to-purple-700"
            >
              <TopicBlock title="Enunciado e fórmula central" tone="indigo">
                <Paragraph>
                  A Segunda Lei de Newton afirma que a força resultante sobre um corpo é igual ao produto da massa pela aceleração.
                </Paragraph>

                <FormulaStep
                  title="Segunda Lei de Newton"
                  explanation="A aceleração tem a mesma direção e o mesmo sentido da força resultante."
                  formula={String.raw`\vec{F}_{\text{res}} = m\vec{a}`}
                  tone="blue"
                />

                <FormulaGrid>
                  <NoteBox title="Mais força resultante" tone="blue">
                    Para a mesma massa, maior força resultante gera maior aceleração.
                  </NoteBox>

                  <NoteBox title="Mais massa" tone="purple">
                    Para a mesma força resultante, maior massa gera menor aceleração.
                  </NoteBox>
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Interpretação termo a termo da Segunda Lei" tone="indigo">
                <SubTitle>O termo <InlineFormulaBox formula={String.raw`\vec{F}_{\text{res}}`} /></SubTitle>
                <Paragraph>
                  É a soma vetorial de todas as forças que atuam no corpo. Não é a força aplicada, não é a maior força e não é necessariamente a força no sentido do movimento.
                </Paragraph>

                <FormulaStep
                  title="Soma vetorial"
                  formula={String.raw`\vec{F}_{\text{res}} = \vec{F}_1 + \vec{F}_2 + \vec{F}_3 + \cdots`}
                  tone="blue"
                />

                <SubTitle>O termo <InlineFormulaBox formula={String.raw`m`} /></SubTitle>
                <Paragraph>
                  É a massa do corpo. Mede a inércia, isto é, a resistência que o corpo oferece à mudança de movimento.
                </Paragraph>

                <FormulaStep
                  title="A massa aparece no denominador da aceleração"
                  formula={String.raw`\vec{a} = \frac{\vec{F}_{\text{res}}}{m}`}
                  tone="purple"
                />

                <SubTitle>O termo <InlineFormulaBox formula={String.raw`\vec{a}`} /></SubTitle>
                <Paragraph>
                  É a aceleração vetorial. Ela representa a variação da velocidade vetorial no tempo.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Definição média de aceleração"
                    formula={String.raw`\vec{a} = \frac{\Delta \vec{v}}{\Delta t}`}
                    tone="green"
                  />
                  <FormulaStep
                    title="Aceleração causada pela resultante"
                    formula={String.raw`\vec{a} = \frac{\vec{F}_{\text{res}}}{m}`}
                    tone="blue"
                  />
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Unidade e análise dimensional dentro da Segunda Lei" tone="blue">
                <Paragraph>
                  A unidade de força vem diretamente da Segunda Lei. Como massa é medida em quilograma e aceleração em metro por segundo ao quadrado, a força é medida em newtons.
                </Paragraph>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <FormulaStep title="Segunda Lei" formula={String.raw`F = ma`} tone="blue" />
                  <FormulaStep title="Dimensões" formula={String.raw`[F] = [m][a]`} tone="green" />
                  <FormulaStep title="Substituindo unidades" formula={String.raw`[F] = \text{kg} \cdot \frac{\text{m}}{\text{s}^2}`} tone="purple" />
                  <FormulaStep title="Newton" formula={String.raw`1 \ \text{N} = 1 \ \text{kg} \cdot \frac{\text{m}}{\text{s}^2}`} tone="amber" />
                </div>

                <NoteBox title="Peso também é força" tone="amber">
                  Como <InlineFormulaBox formula={String.raw`P = mg`} />, o peso também tem unidade{" "}
                  <InlineFormulaBox formula={String.raw`\text{N}`} />. Massa é kg. Peso é N. Esse erro é uma praga resistente.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Diagrama de Corpo Livre dentro da Segunda Lei" tone="slate">
                <Paragraph>
                  O DCL é o desenho das forças reais que atuam sobre um corpo. Em problemas de Segunda Lei, ele é mais importante do que sair jogando fórmula como quem joga sal grosso.
                </Paragraph>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                  <p className="font-bold text-indigo-900 mb-4">Sequência segura para aplicar a Segunda Lei</p>
                  <NumberedSteps
                    items={[
                      <>Escolha o corpo ou sistema.</>,
                      <>Desenhe apenas as forças que atuam nele.</>,
                      <>Identifique quem exerce cada força.</>,
                      <>Escolha eixos convenientes.</>,
                      <>Decomponha forças inclinadas.</>,
                      <>Escreva <InlineFormulaBox formula={String.raw`\sum F_x = ma_x`} /> e <InlineFormulaBox formula={String.raw`\sum F_y = ma_y`} />.</>,
                    ]}
                  />
                </div>

                <FormulaGrid>
                  <FormulaStep title="Eixo x" formula={String.raw`\sum F_x = ma_x`} tone="blue" />
                  <FormulaStep title="Eixo y" formula={String.raw`\sum F_y = ma_y`} tone="green" />
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Peso como aplicação da Segunda Lei" tone="amber">
                <Paragraph>
                  Peso é a força gravitacional exercida por um astro sobre um corpo. Perto da superfície da Terra:
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep title="Forma vetorial" formula={String.raw`\vec{P} = m\vec{g}`} tone="blue" />
                  <FormulaStep title="Módulo do peso" formula={String.raw`P = mg`} tone="green" />
                </FormulaGrid>

                <Paragraph>
                  O peso aponta aproximadamente para o centro da Terra. Ele depende da massa e do campo gravitacional local.
                </Paragraph>

                <NoteBox title="Massa não é peso" tone="red">
                  Um corpo de massa <InlineFormulaBox formula={String.raw`70 \ \text{kg}`} /> tem peso, na Terra com{" "}
                  <InlineFormulaBox formula={String.raw`g = 10 \ \text{m/s}^2`} />, igual a{" "}
                  <InlineFormulaBox formula={String.raw`P = 700 \ \text{N}`} />.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Normal como aplicação da Segunda Lei" tone="blue">
                <Paragraph>
                  A força normal é uma força de contato perpendicular à superfície. Ela deve ser calculada pela Segunda Lei no eixo perpendicular ao contato.
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
                    title="Elevador acelerando para cima"
                    formula={String.raw`N - mg = ma \Rightarrow N = m(g+a)`}
                    tone="purple"
                  />
                  <FormulaStep
                    title="Elevador acelerando para baixo"
                    formula={String.raw`mg - N = ma \Rightarrow N = m(g-a)`}
                    tone="amber"
                  />
                </FormulaGrid>

                <NoteBox title="Armadilha" tone="red">
                  Normal igual ao peso é caso particular, não lei da natureza. Física não é Ctrl+C Ctrl+V de situação fácil.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Tração como aplicação da Segunda Lei" tone="slate">
                <Paragraph>
                  Tração é a força transmitida por fios, cordas e cabos esticados. Em fio ideal, normalmente assumimos massa desprezível, fio inextensível e mesma tração ao longo do mesmo fio.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep title="Corpo pendurado parado" formula={String.raw`T = mg`} tone="blue" />
                  <FormulaStep title="Corpo subindo acelerado" formula={String.raw`T - mg = ma \Rightarrow T = m(g+a)`} tone="green" />
                  <FormulaStep title="Corpo descendo acelerado" formula={String.raw`mg - T = ma \Rightarrow T = m(g-a)`} tone="amber" />
                </FormulaGrid>

                <NoteBox title="Armadilha" tone="red">
                  Tração não é sempre igual ao peso. Ela só vale <InlineFormulaBox formula={String.raw`mg`} /> em situações específicas de equilíbrio.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Atrito como aplicação da Segunda Lei" tone="amber">
                <Paragraph>
                  O atrito é uma força de contato paralela à superfície. Ele se opõe à tendência de deslizamento relativo entre as superfícies.
                </Paragraph>

                <FormulaGrid>
                  <TopicBlock title="Atrito estático" tone="amber">
                    <FormulaStep
                      title="Relação geral"
                      explanation="Ele se ajusta conforme a necessidade."
                      formula={String.raw`f_e \leq \mu_e N`}
                      tone="amber"
                    />
                    <FormulaStep
                      title="Valor máximo"
                      explanation="A igualdade só ocorre na iminência de escorregar."
                      formula={String.raw`f_{e,\text{máx}} = \mu_e N`}
                      tone="amber"
                    />
                  </TopicBlock>

                  <TopicBlock title="Atrito cinético" tone="blue">
                    <FormulaStep
                      title="Durante o deslizamento"
                      formula={String.raw`f_c = \mu_c N`}
                      tone="blue"
                    />
                    <FormulaStep
                      title="Comparação comum"
                      formula={String.raw`\mu_e > \mu_c`}
                      tone="green"
                    />
                  </TopicBlock>
                </FormulaGrid>

                <NoteBox title="Armadilha" tone="red">
                  Nunca comece colocando <InlineFormulaBox formula={String.raw`f_e = \mu_e N`} /> para atrito estático, a menos que o problema diga que está na iminência de escorregar.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Plano inclinado dentro da Segunda Lei" tone="green">
                <Paragraph>
                  No plano inclinado, a escolha esperta é usar um eixo paralelo ao plano e outro perpendicular ao plano. Escolher eixo ruim é uma forma elegante de perder tempo.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep title="Componente paralela do peso" formula={String.raw`P_{\parallel} = mg\sin\theta`} tone="green" />
                  <FormulaStep title="Componente perpendicular do peso" formula={String.raw`P_{\perp} = mg\cos\theta`} tone="blue" />
                  <FormulaStep title="Normal" formula={String.raw`N = mg\cos\theta`} tone="purple" />
                  <FormulaStep title="Sem atrito" formula={String.raw`a = g\sin\theta`} tone="green" />
                </FormulaGrid>

                <SubTitle>Com atrito cinético, bloco descendo</SubTitle>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <FormulaStep title="Atrito" formula={String.raw`f_c = \mu_c mg\cos\theta`} tone="amber" />
                  <FormulaStep title="Segunda Lei no eixo paralelo" formula={String.raw`mg\sin\theta - f_c = ma`} tone="green" />
                  <FormulaStep title="Aceleração" formula={String.raw`a = g(\sin\theta - \mu_c\cos\theta)`} tone="purple" />
                </div>

                <SubTitle>Iminência de escorregamento</SubTitle>
                <FormulaStep
                  title="Ângulo crítico"
                  explanation="Na iminência de descer, o atrito estático é máximo."
                  formula={String.raw`\mu_e = \tan\theta`}
                  tone="amber"
                />
              </TopicBlock>

              <TopicBlock title="Elevador dentro da Segunda Lei" tone="blue">
                <Paragraph>
                  No elevador, a sensação de peso muda porque a normal muda. O peso real continua sendo <InlineFormulaBox formula={String.raw`P = mg`} />.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Acelerando para cima"
                    explanation="A pessoa sente-se mais pesada."
                    formula={String.raw`N = m(g+a)`}
                    tone="blue"
                  />
                  <FormulaStep
                    title="Acelerando para baixo"
                    explanation="A pessoa sente-se mais leve."
                    formula={String.raw`N = m(g-a)`}
                    tone="green"
                  />
                  <FormulaStep
                    title="Queda livre"
                    explanation="A normal desaparece, mas o peso continua existindo."
                    formula={String.raw`a = g \Rightarrow N = 0`}
                    tone="red"
                  />
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Sistemas de blocos e polias dentro da Segunda Lei" tone="slate">
                <SubTitle>Sistema de dois blocos</SubTitle>
                <FormulaGrid>
                  <FormulaStep title="Aceleração do conjunto" formula={String.raw`a = \frac{F}{m_1 + m_2}`} tone="blue" />
                  <FormulaStep title="Força de contato" formula={String.raw`C = \frac{m_2F}{m_1 + m_2}`} tone="green" />
                </FormulaGrid>

                <SubTitle>Máquina de Atwood ideal</SubTitle>
                <FormulaGrid>
                  <FormulaStep title="Aceleração" formula={String.raw`a = \frac{(m_2 - m_1)g}{m_1 + m_2}`} tone="purple" />
                  <FormulaStep title="Tração" formula={String.raw`T = \frac{2m_1m_2g}{m_1 + m_2}`} tone="amber" />
                </FormulaGrid>

                <SubTitle>Vínculo geométrico em fio</SubTitle>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <FormulaStep title="Comprimento constante" formula={String.raw`L = x_1 + x_2 + \text{constante}`} tone="blue" />
                  <FormulaStep title="Velocidades" formula={String.raw`v_1 + v_2 = 0`} tone="green" />
                  <FormulaStep title="Acelerações" formula={String.raw`a_1 + a_2 = 0`} tone="purple" />
                </div>
              </TopicBlock>

              <TopicBlock title="Interpretação gráfica dentro da Segunda Lei" tone="blue">
                <Paragraph>
                  Se a massa é constante, força resultante e aceleração são diretamente proporcionais.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Gráfico Fᵣₑₛ × a"
                    explanation="O coeficiente angular é a massa."
                    formula={String.raw`F_{\text{res}} = ma`}
                    tone="blue"
                  />
                  <FormulaStep
                    title="Coeficiente angular"
                    formula={String.raw`m = \frac{\Delta F_{\text{res}}}{\Delta a}`}
                    tone="green"
                  />
                  <FormulaStep
                    title="Gráfico a × Fᵣₑₛ"
                    explanation="O coeficiente angular é o inverso da massa."
                    formula={String.raw`a = \frac{1}{m}F_{\text{res}}`}
                    tone="purple"
                  />
                  <FormulaStep
                    title="Gráfico v × t"
                    explanation="A inclinação fornece a aceleração; pela Segunda Lei, isso permite descobrir a força resultante."
                    formula={String.raw`a = \frac{\Delta v}{\Delta t}`}
                    tone="amber"
                  />
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Armadilhas da Segunda Lei" tone="rose">
                <FormulaGrid>
                  <NoteBox title="Confundir força aplicada com resultante" tone="red">
                    A aceleração vem da força resultante, não de uma força isolada.
                  </NoteBox>
                  <NoteBox title="Achar que aceleração segue a velocidade" tone="red">
                    A aceleração segue a força resultante, não necessariamente a velocidade.
                  </NoteBox>
                  <NoteBox title="Errar o sentido do atrito" tone="red">
                    Atrito se opõe à tendência de deslizamento relativo, não sempre ao movimento.
                  </NoteBox>
                  <NoteBox title="Usar normal igual a peso sempre" tone="red">
                    Normal deve ser calculada pelo eixo perpendicular ao contato.
                  </NoteBox>
                </FormulaGrid>
              </TopicBlock>
            </Section>

            <Section
              icon={Scale}
              title="Terceira Lei de Newton — Ação e Reação"
              subtitle="A lei das interações entre corpos. Aqui entram pares de forças, peso e normal, forças internas e externas."
              gradient="bg-gradient-to-r from-rose-600 to-red-700"
            >
              <TopicBlock title="Enunciado e fórmula central" tone="rose">
                <Paragraph>
                  Se um corpo A exerce uma força sobre um corpo B, então o corpo B exerce sobre A uma força de mesma intensidade, mesma direção e sentido oposto.
                </Paragraph>

                <FormulaStep
                  title="Terceira Lei de Newton"
                  formula={String.raw`\vec{F}_{A \to B} = -\vec{F}_{B \to A}`}
                  tone="red"
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
              </TopicBlock>

              <TopicBlock title="Interpretação termo a termo da Terceira Lei" tone="rose">
                <SubTitle>O termo <InlineFormulaBox formula={String.raw`\vec{F}_{A \to B}`} /></SubTitle>
                <Paragraph>
                  É a força que o corpo A exerce no corpo B. Portanto, essa força atua em B.
                </Paragraph>

                <SubTitle>O termo <InlineFormulaBox formula={String.raw`\vec{F}_{B \to A}`} /></SubTitle>
                <Paragraph>
                  É a força que o corpo B exerce no corpo A. Portanto, essa força atua em A.
                </Paragraph>

                <SubTitle>O sinal negativo</SubTitle>
                <Paragraph>
                  Indica que as forças têm sentidos opostos, não que uma força é “menor” ou “menos real”.
                </Paragraph>

                <FormulaStep
                  title="Mesmo módulo, sentidos opostos"
                  formula={String.raw`|\vec{F}_{A \to B}| = |\vec{F}_{B \to A}|`}
                  tone="purple"
                />
              </TopicBlock>

              <TopicBlock title="Peso e normal dentro da Terceira Lei" tone="rose">
                <Paragraph>
                  Uma das maiores confusões da Dinâmica é achar que peso e normal são ação e reação. Não são.
                </Paragraph>

                <FormulaGrid>
                  <NoteBox title="Peso" tone="blue">
                    Peso é força da Terra sobre o corpo:{" "}
                    <InlineFormulaBox formula={String.raw`\vec{P}_{\text{Terra} \to \text{corpo}}`} />.
                  </NoteBox>

                  <NoteBox title="Reação ao peso" tone="green">
                    A reação ao peso é a força do corpo sobre a Terra:{" "}
                    <InlineFormulaBox formula={String.raw`\vec{P}_{\text{corpo} \to \text{Terra}}`} />.
                  </NoteBox>

                  <NoteBox title="Normal" tone="purple">
                    Normal é força da superfície sobre o corpo:{" "}
                    <InlineFormulaBox formula={String.raw`\vec{N}_{\text{superfície} \to \text{corpo}}`} />.
                  </NoteBox>

                  <NoteBox title="Reação à normal" tone="amber">
                    A reação à normal é a força do corpo sobre a superfície:{" "}
                    <InlineFormulaBox formula={String.raw`\vec{N}_{\text{corpo} \to \text{superfície}}`} />.
                  </NoteBox>
                </FormulaGrid>

                <NoteBox title="Por que peso e normal não são ação e reação?" tone="red">
                  Porque peso e normal atuam no mesmo corpo. Pares de ação e reação atuam em corpos diferentes.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Forças internas e externas dentro da Terceira Lei" tone="slate">
                <Paragraph>
                  Quando analisamos um sistema com vários corpos, pares de ação e reação internos podem se cancelar no sistema completo.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Par interno"
                    formula={String.raw`\vec{F}_{A \to B} = -\vec{F}_{B \to A}`}
                    tone="blue"
                  />
                  <FormulaStep
                    title="Cancelamento no sistema A+B"
                    formula={String.raw`\vec{F}_{A \to B} + \vec{F}_{B \to A} = \vec{0}`}
                    tone="green"
                  />
                </FormulaGrid>

                <NoteBox title="Estratégia de prova" tone="blue">
                  Para achar aceleração de um conjunto, analise o sistema completo. Para achar forças internas, isole um corpo.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Aplicações práticas da Terceira Lei" tone="blue">
                <FormulaGrid>
                  <NoteBox title="Caminhar" tone="green">
                    O pé empurra o chão para trás. O chão empurra o pé para frente por atrito estático.
                  </NoteBox>

                  <NoteBox title="Carro acelerando" tone="blue">
                    O pneu empurra o chão para trás. O chão empurra o pneu para frente.
                  </NoteBox>

                  <NoteBox title="Salto" tone="purple">
                    O atleta empurra o chão para baixo. O chão empurra o atleta para cima.
                  </NoteBox>

                  <NoteBox title="Livro na mesa" tone="amber">
                    O livro empurra a mesa para baixo. A mesa empurra o livro para cima.
                  </NoteBox>
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Armadilhas da Terceira Lei" tone="rose">
                <FormulaGrid>
                  <NoteBox title="Colocar ação e reação no mesmo DCL" tone="red">
                    No DCL de um corpo, entram apenas forças que atuam naquele corpo.
                  </NoteBox>

                  <NoteBox title="Achar que ação vem antes da reação" tone="red">
                    Ação e reação são simultâneas.
                  </NoteBox>

                  <NoteBox title="Achar que o corpo maior faz força maior" tone="red">
                    As forças têm mesmo módulo, mesmo que os efeitos sejam diferentes por causa das massas.
                  </NoteBox>

                  <NoteBox title="Misturar par de equilíbrio com ação e reação" tone="red">
                    Peso e normal podem se equilibrar no mesmo corpo, mas não formam par de ação e reação.
                  </NoteBox>
                </FormulaGrid>
              </TopicBlock>
            </Section>

            <Section
              icon={Rocket}
              title="Como as três leis aparecem juntas em problemas difíceis"
              subtitle="Porque em prova real elas não aparecem separadinhas, infelizmente para a paz mundial."
              gradient="bg-gradient-to-r from-slate-700 to-slate-900"
            >
              <TopicBlock title="Cinto de segurança" tone="blue">
                <Paragraph>
                  Pela Primeira Lei, o corpo tende a manter seu movimento quando o carro freia. Pela Segunda Lei, o cinto exerce força para desacelerar o corpo. Pela Terceira Lei, o corpo também exerce força no cinto.
                </Paragraph>
              </TopicBlock>

              <TopicBlock title="Plano inclinado com atrito" tone="green">
                <Paragraph>
                  A Primeira Lei aparece quando o bloco está em equilíbrio. A Segunda Lei aparece quando há aceleração. A Terceira Lei aparece nas forças de contato entre bloco e plano.
                </Paragraph>
              </TopicBlock>

              <TopicBlock title="Sistemas de blocos" tone="purple">
                <Paragraph>
                  A Segunda Lei calcula a aceleração do sistema. A Terceira Lei explica as forças internas de contato. A Primeira Lei aparece quando a resultante externa é nula.
                </Paragraph>
              </TopicBlock>

              <TopicBlock title="Checklist para ITA/IME e provas fortes" tone="amber">
                <NumberedSteps
                  items={[
                    <>Escolha o corpo ou sistema.</>,
                    <>Faça o DCL antes da fórmula.</>,
                    <>Separe forças internas e externas.</>,
                    <>Aplique <InlineFormulaBox formula={String.raw`\sum F = ma`} /> em cada eixo.</>,
                    <>Use vínculos de fio/polia quando existirem.</>,
                    <>Cheque ação e reação em corpos diferentes.</>,
                    <>Teste casos limites para ver se a resposta faz sentido.</>,
                  ]}
                />
              </TopicBlock>
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
                    Resoluções com DCL, Segunda Lei, substituição numérica e interpretação física.
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
              icon={Zap}
              title="Resumo Final das Leis de Newton"
              subtitle="Tudo organizado por lei, do jeito que deveria ter sido desde o começo, mas aparentemente precisamos sofrer primeiro."
              gradient="bg-gradient-to-r from-indigo-700 to-purple-800"
            >
              <TopicBlock title="Primeira Lei de Newton" tone="green">
                <FormulaStep
                  title="Condição de equilíbrio"
                  formula={String.raw`\vec{F}_{\text{res}} = \vec{0} \Rightarrow \vec{a} = \vec{0} \Rightarrow \vec{v} = \text{constante}`}
                  tone="green"
                />
                <Paragraph>
                  Serve para repouso e MRU. Equilíbrio não significa necessariamente parado.
                </Paragraph>
              </TopicBlock>

              <TopicBlock title="Segunda Lei de Newton" tone="indigo">
                <FormulaStep
                  title="Equação central"
                  formula={String.raw`\vec{F}_{\text{res}} = m\vec{a}`}
                  tone="blue"
                />
                <FormulaGrid>
                  <FormulaStep title="Peso" formula={String.raw`P = mg`} tone="amber" />
                  <FormulaStep title="Normal em plano inclinado" formula={String.raw`N = mg\cos\theta`} tone="blue" />
                  <FormulaStep title="Atrito estático" formula={String.raw`f_e \leq \mu_e N`} tone="amber" />
                  <FormulaStep title="Atrito cinético" formula={String.raw`f_c = \mu_c N`} tone="green" />
                  <FormulaStep title="Plano sem atrito" formula={String.raw`a = g\sin\theta`} tone="purple" />
                  <FormulaStep title="Elevador" formula={String.raw`N = m(g \pm a)`} tone="blue" />
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Terceira Lei de Newton" tone="rose">
                <FormulaStep
                  title="Ação e reação"
                  formula={String.raw`\vec{F}_{A \to B} = -\vec{F}_{B \to A}`}
                  tone="red"
                />
                <Paragraph>
                  As forças têm mesmo módulo, mesma direção, sentidos opostos e atuam em corpos diferentes.
                </Paragraph>
              </TopicBlock>
            </Section>

            <Section
              icon={AlertTriangle}
              title="Erros comuns por lei"
              subtitle="O mapa dos buracos onde aluno cai sorrindo."
              gradient="bg-gradient-to-r from-red-600 to-rose-700"
            >
              <FormulaGrid>
                <NoteBox title="Primeira Lei: achar que força mantém movimento" tone="red">
                  Força resultante altera movimento. Se a resultante é nula, a velocidade é constante.
                </NoteBox>

                <NoteBox title="Primeira Lei: achar que equilíbrio é só repouso" tone="red">
                  MRU também é equilíbrio.
                </NoteBox>

                <NoteBox title="Segunda Lei: usar força aplicada no lugar da resultante" tone="red">
                  A aceleração vem da soma vetorial das forças.
                </NoteBox>

                <NoteBox title="Segunda Lei: normal sempre igual a peso" tone="red">
                  Normal depende da situação dinâmica.
                </NoteBox>

                <NoteBox title="Terceira Lei: peso e normal como ação e reação" tone="red">
                  Peso e normal atuam no mesmo corpo. Logo, não são par de ação e reação.
                </NoteBox>

                <NoteBox title="Terceira Lei: colocar ação e reação no mesmo DCL" tone="red">
                  Ação e reação atuam em corpos diferentes.
                </NoteBox>
              </FormulaGrid>
            </Section>

            <Section
              icon={ListChecks}
              title="Checklist final de resolução"
              subtitle="Antes de sair aplicando fórmula feito planilha possuída."
              gradient="bg-gradient-to-r from-emerald-700 to-green-800"
            >
              <NumberedSteps
                items={[
                  <>Qual corpo ou sistema estou analisando?</>,
                  <>Quais forças atuam nele?</>,
                  <>Essas forças são externas ou internas ao sistema escolhido?</>,
                  <>Qual lei de Newton está sendo usada?</>,
                  <>Qual é a resultante em cada eixo?</>,
                  <>Há vínculo de fio, polia ou contato?</>,
                  <>A resposta faz sentido nos casos limites?</>,
                ]}
              />
            </Section>

            <Section
              icon={Target}
              title="Frase final para guardar"
              gradient="bg-gradient-to-r from-slate-700 to-slate-900"
            >
              <div className="bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 rounded-2xl p-7 text-center shadow-inner">
                <p className="text-slate-900 text-2xl font-black">
                  A fórmula é simples.
                </p>
                <p className="text-green-700 text-2xl font-black mt-1">
                  O difícil é escolher o corpo, desenhar o DCL e somar as forças certas.
                </p>
              </div>
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}
