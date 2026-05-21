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
  Scale,
  Activity,
  Layers,
  Rocket,
  ListChecks,
  Compass,
  Brain,
  History,
  Search,
  Eye,
  Footprints,
  Car,
  TrendingUp,
  MoveRight,
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
  tone?: "blue" | "green" | "amber" | "red" | "purple" | "slate" | "indigo" | "rose";
};

type FormulaStepProps = {
  title: string;
  explanation?: ReactNode;
  formula: string;
  tone?: "blue" | "green" | "amber" | "purple" | "red" | "slate" | "rose";
};

type TopicBlockProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  tone?: "indigo" | "green" | "amber" | "rose" | "blue" | "slate" | "purple";
  icon?: LucideIcon;
};

type ExampleItem = {
  id: string;
  title: string;
  enunciado: string;
  content: ReactNode;
};

function FormulaBox({ formula, label }: { formula: string; label?: string }) {
  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-black border border-slate-700/80 p-5 text-center overflow-x-auto shadow-[0_18px_45px_rgba(15,23,42,0.35)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-400/40 to-transparent" />

      {label && (
        <p className="text-xs font-black uppercase tracking-[0.18em] mb-3 text-slate-400">
          {label}
        </p>
      )}

      <div className="text-slate-100 [&_.katex]:text-slate-100 [&_.katex-display]:text-slate-100 [&_.katex-display]:my-0">
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
    <section className="group bg-white rounded-[1.75rem] shadow-[0_18px_55px_rgba(15,23,42,0.10)] overflow-hidden border border-slate-200/80">
      <div className={`${gradient} relative px-8 py-6 overflow-hidden`}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent_35%)]" />
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-start gap-4">
          <div className="rounded-2xl bg-white/15 border border-white/20 p-3 shadow-inner">
            <Icon className="w-6 h-6 text-white" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
            {subtitle && (
              <p className="text-white/85 text-sm mt-1 leading-6 max-w-3xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-7 bg-gradient-to-br from-white to-slate-50/60">
        {children}
      </div>
    </section>
  );
}

function NoteBox({ title, children, tone = "blue" }: NoteBoxProps) {
  const styles = {
    blue: "bg-blue-50/90 border-blue-400 text-blue-950",
    green: "bg-green-50/90 border-green-400 text-green-950",
    amber: "bg-amber-50/90 border-amber-400 text-amber-950",
    red: "bg-red-50/90 border-red-400 text-red-950",
    purple: "bg-purple-50/90 border-purple-400 text-purple-950",
    slate: "bg-slate-50/90 border-slate-400 text-slate-950",
    indigo: "bg-indigo-50/90 border-indigo-400 text-indigo-950",
    rose: "bg-rose-50/90 border-rose-400 text-rose-950",
  };

  return (
    <div className={`${styles[tone]} border-l-4 rounded-2xl p-5 shadow-sm`}>
      <p className="font-black mb-2 tracking-tight">{title}</p>
      <div className="text-slate-700 text-sm leading-7">{children}</div>
    </div>
  );
}

function FormulaStep({ title, explanation, formula, tone = "slate" }: FormulaStepProps) {
  const dotStyles = {
    blue: "bg-blue-400 shadow-blue-400/40",
    green: "bg-green-400 shadow-green-400/40",
    amber: "bg-amber-400 shadow-amber-400/40",
    purple: "bg-purple-400 shadow-purple-400/40",
    red: "bg-red-400 shadow-red-400/40",
    rose: "bg-rose-400 shadow-rose-400/40",
    slate: "bg-slate-400 shadow-slate-400/40",
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-[0_14px_35px_rgba(15,23,42,0.28)]">
      <div className="flex items-start gap-3 mb-4">
        <span
          className={`h-3 w-3 rounded-full ${dotStyles[tone]} mt-1.5 flex-shrink-0 shadow-lg`}
        />

        <div>
          <p className="font-black text-slate-100 tracking-tight">{title}</p>
          {explanation && (
            <div className="text-sm text-slate-300 leading-7 mt-1">
              {explanation}
            </div>
          )}
        </div>
      </div>

      <FormulaBox formula={formula} />
    </div>
  );
}

function TopicBlock({
  title,
  subtitle,
  children,
  tone = "indigo",
  icon: Icon,
}: TopicBlockProps) {
  const styles = {
    indigo: "border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 to-white",
    green: "border-green-200/80 bg-gradient-to-br from-green-50/80 to-white",
    amber: "border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white",
    rose: "border-rose-200/80 bg-gradient-to-br from-rose-50/80 to-white",
    blue: "border-blue-200/80 bg-gradient-to-br from-blue-50/80 to-white",
    slate: "border-slate-200/80 bg-gradient-to-br from-slate-50 to-white",
    purple: "border-purple-200/80 bg-gradient-to-br from-purple-50/80 to-white",
  };

  const iconStyles = {
    indigo: "text-indigo-700 bg-indigo-100 border-indigo-200",
    green: "text-green-700 bg-green-100 border-green-200",
    amber: "text-amber-700 bg-amber-100 border-amber-200",
    rose: "text-rose-700 bg-rose-100 border-rose-200",
    blue: "text-blue-700 bg-blue-100 border-blue-200",
    slate: "text-slate-700 bg-slate-100 border-slate-200",
    purple: "text-purple-700 bg-purple-100 border-purple-200",
  };

  return (
    <div
      className={`rounded-3xl border ${styles[tone]} p-5 md:p-6 space-y-5 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div className={`rounded-2xl p-3 border ${iconStyles[tone]} shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
        )}

        <div className="min-w-0">
          <h3 className="text-xl font-black text-slate-950 tracking-tight">{title}</h3>
          {subtitle && (
            <p className="text-sm text-slate-600 mt-1 leading-6 max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-5">{children}</div>
    </div>
  );
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

function ThreeGrid({ children }: { children: ReactNode }) {
  return <div className="grid md:grid-cols-3 gap-4">{children}</div>;
}

function PageHero() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 border border-slate-800 shadow-[0_22px_70px_rgba(15,23,42,0.35)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.32),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.16),transparent_32%)]" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />

      <div className="relative p-7 md:p-9">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-amber-300 font-black uppercase tracking-[0.22em] text-xs mb-3">
              Dinâmica clássica
            </p>

            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Atrito sem decorar fórmula no escuro.
            </h2>

            <p className="text-slate-300 leading-7 mt-4 max-w-2xl">
              Força de atrito estático, força de atrito cinético, normal, sentido do atrito,
              plano inclinado, blocos, rodas, caminhada e armadilhas de prova. Porque
              escrever <span className="font-bold text-white">f = μN</span> e sair correndo
              é exatamente como a humanidade cria alunos traumatizados.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 min-w-full md:min-w-[330px]">
            <div className="rounded-2xl bg-white/10 border border-white/10 p-4 text-center">
              <p className="text-2xl font-black text-white">e</p>
              <p className="text-xs text-slate-300 mt-1">estático</p>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/10 p-4 text-center">
              <p className="text-2xl font-black text-white">c</p>
              <p className="text-xs text-slate-300 mt-1">cinético</p>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/10 p-4 text-center">
              <p className="text-2xl font-black text-white">N</p>
              <p className="text-xs text-slate-300 mt-1">normal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DynamicsTopicFriction() {
  const [openExamples, setOpenExamples] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<TabId>("teoria");

  const toggleExample = (id: string) => {
    setOpenExamples((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const examples: ExampleItem[] = [
    {
      id: "ex1",
      title: "Bloco em superfície horizontal com atrito cinético",
      enunciado:
        "Um bloco de massa m = 10 kg desliza sobre uma superfície horizontal rugosa. Uma força horizontal F = 60 N puxa o bloco para a direita. O coeficiente de atrito cinético é μc = 0,2. Considere g = 10 m/s². Determine a aceleração.",
      content: (
        <div className="space-y-5">
          <NoteBox title="Raciocínio antes das contas" tone="blue">
            A força aplicada tenta acelerar o bloco para a direita. A força de atrito
            cinético aparece para a esquerda, porque o bloco desliza para a direita em
            relação à superfície. A aceleração vem da força que sobra.
          </NoteBox>

          <TopicBlock title="DCL descrito" tone="slate" icon={Eye}>
            <BulletList
              items={[
                <>peso <InlineFormulaBox formula={String.raw`P = mg`} /> para baixo;</>,
                <>normal <InlineFormulaBox formula={String.raw`N`} /> para cima;</>,
                <>força aplicada <InlineFormulaBox formula={String.raw`F`} /> para a direita;</>,
                <>força de atrito cinético <InlineFormulaBox formula={String.raw`f_c`} /> para a esquerda.</>,
              ]}
            />
          </TopicBlock>

          <FormulaGrid>
            <FormulaStep
              title="Normal"
              explanation="Como não há aceleração vertical, normal e peso se equilibram."
              formula={String.raw`N = mg = 10 \cdot 10 = 100 \ \text{N}`}
              tone="blue"
            />

            <FormulaStep
              title="Força de atrito cinético"
              formula={String.raw`f_c = \mu_c N = 0{,}2 \cdot 100 = 20 \ \text{N}`}
              tone="amber"
            />

            <FormulaStep
              title="Segunda Lei no eixo horizontal"
              formula={String.raw`F - f_c = ma`}
              tone="green"
            />

            <FormulaStep
              title="Aceleração"
              formula={String.raw`60 - 20 = 10a \Rightarrow a = 4 \ \text{m/s}^2`}
              tone="green"
            />
          </FormulaGrid>

          <NoteBox title="Significado físico" tone="green">
            A força aplicada é <InlineFormulaBox formula={String.raw`60 \ \text{N}`} />,
            mas a força de atrito “desconta” <InlineFormulaBox formula={String.raw`20 \ \text{N}`} />.
            A força resultante horizontal é <InlineFormulaBox formula={String.raw`40 \ \text{N}`} />.
          </NoteBox>
        </div>
      ),
    },
    {
      id: "ex2",
      title: "Atrito estático: o bloco escorrega ou não?",
      enunciado:
        "Um bloco de massa m = 20 kg está parado sobre uma superfície horizontal. O coeficiente de atrito estático é μe = 0,4. Uma força horizontal F = 60 N é aplicada. Considere g = 10 m/s². O bloco escorrega?",
      content: (
        <div className="space-y-5">
          <NoteBox title="Raciocínio antes das contas" tone="amber">
            Em atrito estático, primeiro calculamos o máximo atrito possível. Depois
            comparamos com a força que tenta mover o bloco. O atrito estático real não
            vale automaticamente o máximo. Sim, a Física exige esse mínimo de civilização.
          </NoteBox>

          <FormulaGrid>
            <FormulaStep
              title="Normal"
              formula={String.raw`N = mg = 20 \cdot 10 = 200 \ \text{N}`}
              tone="blue"
            />

            <FormulaStep
              title="Atrito estático máximo"
              formula={String.raw`f_{e,\text{máx}} = \mu_e N = 0{,}4 \cdot 200 = 80 \ \text{N}`}
              tone="amber"
            />

            <FormulaStep
              title="Comparação"
              formula={String.raw`F = 60 \ \text{N} \leq 80 \ \text{N}`}
              tone="green"
            />

            <FormulaStep
              title="Atrito real"
              formula={String.raw`f_e = 60 \ \text{N}`}
              tone="green"
            />
          </FormulaGrid>

          <NoteBox title="Resposta" tone="green">
            O bloco não escorrega. O atrito estático máximo é{" "}
            <InlineFormulaBox formula={String.raw`80 \ \text{N}`} />, mas o atrito real vale
            apenas <InlineFormulaBox formula={String.raw`60 \ \text{N}`} />, porque é isso
            que precisa para equilibrar a força aplicada.
          </NoteBox>
        </div>
      ),
    },
    {
      id: "ex3",
      title: "Plano inclinado na iminência de escorregar",
      enunciado:
        "Um bloco fica na iminência de escorregar em um plano inclinado quando θ = 30°. Determine o coeficiente de atrito estático. Use tan 30° ≈ 0,58.",
      content: (
        <div className="space-y-5">
          <NoteBox title="Ideia física" tone="purple">
            Na iminência de escorregar, a força de atrito estático atinge o valor máximo.
            A componente do peso para baixo da rampa fica exatamente equilibrada por esse
            máximo.
          </NoteBox>

          <FormulaGrid>
            <FormulaStep
              title="Componente do peso"
              formula={String.raw`P_{\parallel} = mg\sin\theta`}
              tone="green"
            />

            <FormulaStep
              title="Normal"
              formula={String.raw`N = mg\cos\theta`}
              tone="blue"
            />

            <FormulaStep
              title="Iminência de escorregamento"
              formula={String.raw`mg\sin\theta = \mu_e mg\cos\theta`}
              tone="amber"
            />

            <FormulaStep
              title="Coeficiente de atrito estático"
              formula={String.raw`\mu_e = \tan\theta = \tan 30^\circ \approx 0{,}58`}
              tone="purple"
            />
          </FormulaGrid>

          <NoteBox title="Resposta" tone="green">
            <InlineFormulaBox formula={String.raw`\mu_e \approx 0{,}58`} />. O ângulo crítico
            mostra o maior ângulo para o qual o bloco ainda consegue ficar parado sem
            escorregar.
          </NoteBox>
        </div>
      ),
    },
    {
      id: "ex4",
      title: "Bloco descendo plano inclinado com atrito cinético",
      enunciado:
        "Um bloco desce um plano inclinado de 37° com atrito cinético. O coeficiente de atrito cinético é μc = 0,25. Considere g = 10 m/s², sin 37° = 0,6 e cos 37° = 0,8. Determine a aceleração.",
      content: (
        <div className="space-y-5">
          <NoteBox title="Raciocínio físico" tone="blue">
            A componente do peso <InlineFormulaBox formula={String.raw`mg\sin\theta`} />
            puxa o bloco para baixo da rampa. A força de atrito cinético aponta para cima
            da rampa, reduzindo a aceleração.
          </NoteBox>

          <FormulaGrid>
            <FormulaStep
              title="Normal"
              formula={String.raw`N = mg\cos\theta`}
              tone="blue"
            />

            <FormulaStep
              title="Atrito cinético"
              formula={String.raw`f_c = \mu_c mg\cos\theta`}
              tone="amber"
            />

            <FormulaStep
              title="Segunda Lei no eixo do plano"
              formula={String.raw`mg\sin\theta - f_c = ma`}
              tone="green"
            />

            <FormulaStep
              title="Aceleração"
              formula={String.raw`a = g(\sin\theta - \mu_c\cos\theta)`}
              tone="purple"
            />

            <FormulaStep
              title="Substituindo"
              formula={String.raw`a = 10(0{,}6 - 0{,}25 \cdot 0{,}8)`}
              tone="green"
            />

            <FormulaStep
              title="Resultado"
              formula={String.raw`a = 4 \ \text{m/s}^2`}
              tone="green"
            />
          </FormulaGrid>

          <NoteBox title="Interpretação" tone="green">
            Sem atrito, a aceleração seria <InlineFormulaBox formula={String.raw`6 \ \text{m/s}^2`} />.
            O atrito reduz esse valor para <InlineFormulaBox formula={String.raw`4 \ \text{m/s}^2`} />.
          </NoteBox>
        </div>
      ),
    },
    {
      id: "ex5",
      title: "Pessoa caminhando: sentido da força de atrito",
      enunciado:
        "Uma pessoa caminha para frente sobre um chão horizontal. Explique o sentido da força de atrito exercida pelo chão sobre o pé da pessoa.",
      content: (
        <div className="space-y-5">
          <TopicBlock title="O que aconteceria sem atrito?" tone="blue" icon={Footprints}>
            <Paragraph>
              Durante a caminhada, o pé empurra o chão para trás. Sem atrito, o pé tenderia
              a escorregar para trás em relação ao chão.
            </Paragraph>
          </TopicBlock>

          <NoteBox title="Sentido da força de atrito" tone="green">
            Como o pé tende a escorregar para trás, a força de atrito estático exercida
            pelo chão sobre o pé aponta para frente.
          </NoteBox>

          <NoteBox title="Moral da história" tone="amber">
            Esse é o exemplo que destrói a frase “atrito sempre se opõe ao movimento”.
            A pessoa se move para frente e a força de atrito no pé também aponta para
            frente. O atrito se opõe ao escorregamento relativo, não ao movimento do corpo
            em relação ao solo.
          </NoteBox>
        </div>
      ),
    },
    {
      id: "ex6",
      title: "Bloco sobre bloco: verifica se escorrega",
      enunciado:
        "Um bloco A de massa 2 kg está sobre um bloco B de massa 4 kg. O bloco B está sobre uma superfície sem atrito. Uma força F = 12 N puxa B para a direita. O coeficiente de atrito estático entre A e B é μe = 0,5. Considere g = 10 m/s². A escorrega sobre B?",
      content: (
        <div className="space-y-5">
          <NoteBox title="Estratégia" tone="purple">
            Primeiro suponha que os blocos não escorregam e aceleram juntos. Depois calcule
            o atrito necessário para acelerar o bloco de cima. Por fim compare com o atrito
            estático máximo.
          </NoteBox>

          <FormulaGrid>
            <FormulaStep
              title="Massa total"
              formula={String.raw`M = m_A + m_B = 2 + 4 = 6 \ \text{kg}`}
              tone="blue"
            />

            <FormulaStep
              title="Aceleração do conjunto"
              formula={String.raw`F = Ma \Rightarrow 12 = 6a \Rightarrow a = 2 \ \text{m/s}^2`}
              tone="green"
            />

            <FormulaStep
              title="Atrito necessário em A"
              formula={String.raw`f_e = m_Aa = 2 \cdot 2 = 4 \ \text{N}`}
              tone="amber"
            />

            <FormulaStep
              title="Atrito estático máximo"
              formula={String.raw`f_{e,\text{máx}} = \mu_e m_Ag = 0{,}5 \cdot 2 \cdot 10 = 10 \ \text{N}`}
              tone="purple"
            />
          </FormulaGrid>

          <NoteBox title="Resposta" tone="green">
            Como <InlineFormulaBox formula={String.raw`4 \leq 10`} />, o atrito estático é
            suficiente. O bloco A não escorrega sobre B.
          </NoteBox>
        </div>
      ),
    },
    {
      id: "ex7",
      title: "Força inclinada alterando a normal e o atrito",
      enunciado:
        "Um bloco de massa 5 kg é puxado por uma força F = 50 N formando 37° acima da horizontal. O coeficiente de atrito cinético é μc = 0,2. Use g = 10 m/s², sin 37° = 0,6 e cos 37° = 0,8. Determine a aceleração.",
      content: (
        <div className="space-y-5">
          <NoteBox title="Raciocínio físico" tone="blue">
            A força inclinada puxa o bloco para frente e também tem uma componente para
            cima. Essa componente vertical reduz a normal. Como o atrito depende da normal,
            o atrito também diminui.
          </NoteBox>

          <FormulaGrid>
            <FormulaStep
              title="Componente horizontal"
              formula={String.raw`F_x = F\cos37^\circ = 50 \cdot 0{,}8 = 40 \ \text{N}`}
              tone="green"
            />

            <FormulaStep
              title="Componente vertical"
              formula={String.raw`F_y = F\sin37^\circ = 50 \cdot 0{,}6 = 30 \ \text{N}`}
              tone="blue"
            />

            <FormulaStep
              title="Normal"
              formula={String.raw`N + F_y - mg = 0 \Rightarrow N = mg - F_y = 50 - 30 = 20 \ \text{N}`}
              tone="purple"
            />

            <FormulaStep
              title="Atrito cinético"
              formula={String.raw`f_c = \mu_c N = 0{,}2 \cdot 20 = 4 \ \text{N}`}
              tone="amber"
            />

            <FormulaStep
              title="Segunda Lei horizontal"
              formula={String.raw`F_x - f_c = ma`}
              tone="green"
            />

            <FormulaStep
              title="Aceleração"
              formula={String.raw`40 - 4 = 5a \Rightarrow a = 7{,}2 \ \text{m/s}^2`}
              tone="green"
            />
          </FormulaGrid>

          <NoteBox title="Interpretação" tone="green">
            A força inclinada facilita o movimento porque reduz a normal e, com isso, reduz
            a força de atrito cinético.
          </NoteBox>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <header className="bg-white/85 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-auto md:h-20 py-3 md:py-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link href="/dinamica">
              <a className="p-2 hover:bg-slate-100 rounded-full transition-colors border border-slate-200 bg-white shadow-sm">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </a>
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.14)]" />
                <h1 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight">
                  Atrito
                </h1>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Dinâmica — força de atrito estático e cinético
              </p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {(["teoria", "exemplos", "resumo"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all capitalize whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-slate-950 text-white shadow-lg shadow-slate-900/20"
                    : "text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-10">
        {activeTab === "teoria" && (
          <div className="space-y-10">
            <PageHero />

            <Section
              icon={History}
              title="Contexto físico e histórico"
              subtitle="Por que o atrito foi tão importante para entender movimento?"
              gradient="bg-gradient-to-r from-amber-500 to-orange-600"
            >
              <TopicBlock
                title="O atrito fez a humanidade desconfiar da própria intuição"
                tone="amber"
                icon={History}
              >
                <Paragraph>
                  O atrito aparece em quase tudo no mundo real: ao caminhar, frear, empurrar
                  uma caixa, acelerar um carro, segurar um objeto ou apoiar um bloco numa
                  rampa. Ele é tão cotidiano que, por muito tempo, atrapalhou a compreensão
                  correta do movimento.
                </Paragraph>

                <Paragraph>
                  No dia a dia, quando você empurra uma caixa e depois para de empurrar,
                  ela para. Quando lança um carrinho, ele perde velocidade. Quando chuta uma
                  bola, ela rola e depois para. A conclusão intuitiva seria: “para continuar
                  se movendo, o corpo precisa de uma força empurrando”.
                </Paragraph>

                <NoteBox title="A conclusão intuitiva está errada" tone="red">
                  O corpo não para porque “acabou a força do movimento”. Ele para porque
                  existe uma força resultante contrária ao movimento, geralmente a força de
                  atrito e, em alguns casos, a resistência do ar.
                </NoteBox>

                <Paragraph>
                  Galileu e Newton ajudaram a separar movimento de resistência ao movimento.
                  Quanto menor o atrito, mais tempo um corpo tende a manter sua velocidade.
                  No limite ideal, sem atrito e sem resistência do ar, um corpo lançado em
                  superfície horizontal continuaria em movimento retilíneo uniforme.
                </Paragraph>

                <FormulaStep
                  title="Ligação com a Primeira Lei de Newton"
                  explanation="Se não existe força resultante, não existe aceleração. Logo, a velocidade permanece constante."
                  formula={String.raw`\vec{F}_{\text{res}} = \vec{0} \Rightarrow \vec{a} = \vec{0} \Rightarrow \vec{v} = \text{constante}`}
                  tone="amber"
                />
              </TopicBlock>

              <TopicBlock title="A ideia histórica central" tone="blue" icon={Lightbulb}>
                <Paragraph>
                  O atrito é uma das principais razões pelas quais a Primeira Lei de Newton
                  parece estranha à primeira vista. O cotidiano mostra corpos parando, mas
                  isso não significa que repouso seja o destino natural do movimento. Significa
                  apenas que o mundo real quase sempre tem forças resistivas.
                </Paragraph>

                <div className="bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 rounded-2xl p-7 text-center shadow-inner">
                  <p className="text-amber-600 font-black text-lg mb-2">
                    Ideia para guardar
                  </p>
                  <p className="text-slate-900 text-2xl font-black">
                    O atrito não refuta a inércia.
                  </p>
                  <p className="text-green-700 text-2xl font-black mt-1">
                    Ele explica por que o cotidiano esconde a inércia.
                  </p>
                </div>
              </TopicBlock>
            </Section>

            <Section
              icon={Lightbulb}
              title="Ideia intuitiva da força de atrito"
              subtitle="Atrito não é simplesmente uma força contra o movimento. Essa frase é a casca de banana da Dinâmica."
              gradient="bg-gradient-to-r from-indigo-600 to-purple-700"
            >
              <TopicBlock
                title="O que é a força de atrito?"
                tone="indigo"
                icon={Brain}
              >
                <Paragraph>
                  A força de atrito é uma força de contato que aparece quando duas superfícies
                  estão em contato e existe deslizamento relativo, ou pelo menos tendência de
                  deslizamento relativo, entre elas.
                </Paragraph>

                <ThreeGrid>
                  <NoteBox title="É força de contato" tone="blue">
                    Precisa de contato entre superfícies. Sem contato, não há força de atrito
                    entre sólidos.
                  </NoteBox>

                  <NoteBox title="É paralela à superfície" tone="purple">
                    Em mesa horizontal, é horizontal. Em plano inclinado, é paralela ao plano.
                  </NoteBox>

                  <NoteBox title="Depende do deslizamento relativo" tone="green">
                    O ponto principal é a tendência de uma superfície escorregar em relação à outra.
                  </NoteBox>
                </ThreeGrid>

                <FormulaStep
                  title="Definição formal"
                  formula={String.raw`\text{força de atrito} \Rightarrow \text{força de contato paralela à superfície}`}
                  tone="purple"
                />
              </TopicBlock>

              <TopicBlock title="Por que o atrito existe?" tone="slate" icon={Eye}>
                <Paragraph>
                  Superfícies aparentemente lisas têm irregularidades microscópicas. Quando
                  duas superfícies encostam, essas irregularidades se encaixam, deformam e
                  interagem. Além disso, há interações eletromagnéticas microscópicas entre
                  átomos e moléculas das regiões de contato.
                </Paragraph>

                <Paragraph>
                  No ensino médio e nos vestibulares, usamos um modelo simplificado: a força
                  de atrito depende da força normal e do coeficiente de atrito do par de
                  superfícies. É um modelo, não um contrato assinado com o universo.
                </Paragraph>
              </TopicBlock>

              <TopicBlock title="Modelo básico de atrito seco" tone="amber" icon={Calculator}>
                <Paragraph>
                  Na maioria das questões, usamos o modelo de atrito seco de Coulomb. Ele
                  funciona muito bem para blocos, planos inclinados, sistemas e problemas
                  clássicos.
                </Paragraph>

                <BulletList
                  items={[
                    <>a força de atrito cinético é aproximadamente proporcional à normal;</>,
                    <>a força de atrito estático possui um valor máximo proporcional à normal;</>,
                    <>o coeficiente de atrito depende do par de superfícies;</>,
                    <>a área aparente de contato não entra diretamente nas fórmulas básicas;</>,
                    <>efeitos como temperatura, lubrificação, desgaste e velocidade são desprezados.</>,
                  ]}
                />

                <FormulaGrid>
                  <FormulaStep
                    title="Atrito estático máximo"
                    formula={String.raw`f_{e,\text{máx}} = \mu_e N`}
                    tone="amber"
                  />

                  <FormulaStep
                    title="Atrito cinético"
                    formula={String.raw`f_c = \mu_c N`}
                    tone="blue"
                  />
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock
                title="Atrito não se opõe necessariamente ao movimento"
                tone="green"
                icon={MoveRight}
              >
                <Paragraph>
                  A força de atrito se opõe ao deslizamento relativo ou à tendência de
                  deslizamento relativo entre superfícies. Ela não se opõe necessariamente
                  ao movimento do corpo em relação ao solo.
                </Paragraph>

                <FormulaGrid>
                  <NoteBox title="Caixa puxada" tone="blue">
                    A caixa tende a escorregar para a direita sobre a mesa. A força de atrito
                    na caixa aponta para a esquerda.
                  </NoteBox>

                  <NoteBox title="Pessoa caminhando" tone="green">
                    O pé tende a escorregar para trás. O chão exerce força de atrito para frente.
                  </NoteBox>

                  <NoteBox title="Carro acelerando" tone="purple">
                    O pneu empurra o chão para trás. O chão exerce força de atrito para frente.
                  </NoteBox>

                  <NoteBox title="Bloco em esteira" tone="amber">
                    A esteira pode exercer atrito no bloco no mesmo sentido do movimento dela.
                  </NoteBox>
                </FormulaGrid>
              </TopicBlock>
            </Section>

            <Section
              icon={Scale}
              title="Normal e atrito"
              subtitle="A normal é a chave do atrito. Usar N = mg em tudo é pedir para errar com convicção."
              gradient="bg-gradient-to-r from-slate-700 to-slate-900"
            >
              <TopicBlock title="Por que o atrito depende da normal?" tone="blue" icon={Scale}>
                <Paragraph>
                  A normal mede o quanto uma superfície comprime a outra. Quanto maior essa
                  compressão, maior tende a ser a intensidade máxima da força de atrito que
                  as superfícies conseguem sustentar.
                </Paragraph>

                <NoteBox title="Regra de ouro" tone="blue">
                  A normal deve ser calculada pela Segunda Lei no eixo perpendicular ao contato.
                  Ela não é sempre igual ao peso.
                </NoteBox>

                <FormulaGrid>
                  <FormulaStep
                    title="Horizontal simples"
                    explanation="Só vale quando não há aceleração vertical e não há outras forças verticais relevantes."
                    formula={String.raw`N = mg`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Plano inclinado"
                    explanation="A normal equilibra a componente perpendicular do peso."
                    formula={String.raw`N = mg\cos\theta`}
                    tone="blue"
                  />

                  <FormulaStep
                    title="Elevador acelerando para cima"
                    formula={String.raw`N = m(g+a)`}
                    tone="purple"
                  />

                  <FormulaStep
                    title="Elevador acelerando para baixo"
                    formula={String.raw`N = m(g-a)`}
                    tone="amber"
                  />
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Força inclinada altera a normal" tone="amber" icon={Compass}>
                <Paragraph>
                  Quando uma força inclinada puxa o bloco para cima, ela reduz a normal.
                  Quando empurra o bloco para baixo, ela aumenta a normal. Como o atrito
                  depende da normal, isso altera a força de atrito.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Força inclinada para cima"
                    formula={String.raw`N = mg - F\sin\alpha`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Força inclinada para baixo"
                    formula={String.raw`N = mg + F\sin\alpha`}
                    tone="red"
                  />
                </FormulaGrid>

                <NoteBox title="Interpretação" tone="amber">
                  Puxar para cima alivia o contato e reduz o atrito. Empurrar para baixo
                  comprime mais o bloco contra a superfície e aumenta o atrito.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Bloco pressionado contra uma parede" tone="purple" icon={Layers}>
                <Paragraph>
                  Se um bloco é pressionado horizontalmente contra uma parede vertical, a
                  normal da parede é horizontal. O peso tende a fazer o bloco escorregar para
                  baixo, então a força de atrito estático pode apontar para cima.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Normal"
                    formula={String.raw`N = F`}
                    tone="blue"
                  />

                  <FormulaStep
                    title="Condição para não cair"
                    formula={String.raw`mg \leq \mu_e F`}
                    tone="purple"
                  />
                </FormulaGrid>
              </TopicBlock>
            </Section>

            <Section
              icon={Shield}
              title="Força de atrito estático"
              subtitle="O atrito estático se ajusta. Ele não é uma fórmula fixa, para a tristeza de quem queria só decorar."
              gradient="bg-gradient-to-r from-emerald-600 to-green-700"
            >
              <TopicBlock title="O que é força de atrito estático?" tone="green" icon={Shield}>
                <Paragraph>
                  A força de atrito estático atua quando não há deslizamento relativo entre
                  as superfícies. O corpo pode estar em movimento em relação ao solo, como
                  no caso de uma pessoa caminhando ou de uma roda rolando sem escorregar.
                  O importante é que as superfícies em contato não estejam escorregando uma
                  sobre a outra.
                </Paragraph>

                <NoteBox title="Ideia principal" tone="green">
                  A força de atrito estático se ajusta conforme a necessidade, até um valor máximo.
                </NoteBox>

                <FormulaGrid>
                  <FormulaStep
                    title="Intervalo possível"
                    formula={String.raw`0 \leq f_e \leq f_{e,\text{máx}}`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Valor máximo"
                    formula={String.raw`f_{e,\text{máx}} = \mu_e N`}
                    tone="amber"
                  />

                  <FormulaStep
                    title="Relação geral"
                    formula={String.raw`f_e \leq \mu_e N`}
                    tone="purple"
                  />
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Leitura termo a termo" tone="slate" icon={Eye}>
                <BulletList
                  items={[
                    <><InlineFormulaBox formula={String.raw`f_e`} /> é o módulo da força de atrito estático real naquele instante.</>,
                    <><InlineFormulaBox formula={String.raw`f_{e,\text{máx}}`} /> é o maior valor que a força de atrito estático pode atingir.</>,
                    <><InlineFormulaBox formula={String.raw`\mu_e`} /> é o coeficiente de atrito estático, sem unidade.</>,
                    <><InlineFormulaBox formula={String.raw`N`} /> é a força normal entre as superfícies.</>,
                  ]}
                />

                <NoteBox title="A igualdade só vale no limite" tone="red">
                  <InlineFormulaBox formula={String.raw`f_e = \mu_e N`} /> só vale quando o
                  corpo está na iminência de escorregar. Antes disso, o atrito estático pode
                  ser menor.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Exemplo mental: caixa parada" tone="blue" icon={Brain}>
                <Paragraph>
                  Se você puxa uma caixa com <InlineFormulaBox formula={String.raw`5 \ \text{N}`} />
                  e ela continua parada, a força de atrito estático vale{" "}
                  <InlineFormulaBox formula={String.raw`5 \ \text{N}`} />, desde que esse
                  valor não ultrapasse o máximo.
                </Paragraph>

                <FormulaStep
                  title="Equilíbrio horizontal"
                  formula={String.raw`F - f_e = 0 \Rightarrow f_e = F`}
                  tone="blue"
                />

                <NoteBox title="Moral" tone="amber">
                  Se o máximo atrito estático for 30 N, mas só precisam 5 N para equilibrar
                  a força aplicada, o atrito real vale 5 N. Não 30 N. Não é promoção de
                  supermercado, não precisa usar tudo.
                </NoteBox>
              </TopicBlock>
            </Section>

            <Section
              icon={MoveRight}
              title="Força de atrito cinético"
              subtitle="Quando já existe escorregamento relativo, entra o atrito cinético."
              gradient="bg-gradient-to-r from-blue-600 to-cyan-700"
            >
              <TopicBlock title="O que é força de atrito cinético?" tone="blue" icon={MoveRight}>
                <Paragraph>
                  A força de atrito cinético atua quando as superfícies já estão deslizando
                  uma em relação à outra. Um bloco escorregando sobre uma mesa, uma caixa
                  descendo uma rampa ou uma roda travada deslizando no asfalto são exemplos
                  clássicos.
                </Paragraph>

                <FormulaStep
                  title="Fórmula do atrito cinético"
                  formula={String.raw`f_c = \mu_c N`}
                  tone="blue"
                />

                <BulletList
                  items={[
                    <><InlineFormulaBox formula={String.raw`f_c`} /> é o módulo da força de atrito cinético.</>,
                    <><InlineFormulaBox formula={String.raw`\mu_c`} /> é o coeficiente de atrito cinético.</>,
                    <><InlineFormulaBox formula={String.raw`N`} /> é a força normal entre as superfícies.</>,
                  ]}
                />
              </TopicBlock>

              <TopicBlock title="Por que iniciar o movimento costuma ser mais difícil?" tone="amber" icon={Brain}>
                <Paragraph>
                  Em geral, o atrito estático máximo é maior que o atrito cinético. Antes
                  do deslizamento, as irregularidades microscópicas conseguem se prender
                  melhor. Depois que o corpo começa a escorregar, os contatos são formados
                  e quebrados continuamente.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Comparação usual"
                    formula={String.raw`\mu_e > \mu_c`}
                    tone="amber"
                  />

                  <FormulaStep
                    title="Em termos de forças"
                    formula={String.raw`f_c < f_{e,\text{máx}}`}
                    tone="green"
                  />
                </FormulaGrid>

                <NoteBox title="Cuidado" tone="blue">
                  Isso é o modelo básico mais comum em vestibulares. Situações reais podem
                  ser mais complicadas, com velocidade, temperatura, desgaste e lubrificação.
                </NoteBox>
              </TopicBlock>
            </Section>

            <Section
              icon={Compass}
              title="Como descobrir o sentido da força de atrito"
              subtitle="Essa é a parte em que a prova separa quem entende de quem só repetiu frase pronta."
              gradient="bg-gradient-to-r from-violet-600 to-purple-700"
            >
              <TopicBlock title="Procedimento correto" tone="purple" icon={Compass}>
                <NumberedSteps
                  items={[
                    <>Imagine que não existe atrito.</>,
                    <>Pergunte para onde uma superfície tenderia a escorregar em relação à outra.</>,
                    <>A força de atrito aponta contra essa tendência de deslizamento relativo.</>,
                  ]}
                />

                <NoteBox title="Frase certa" tone="purple">
                  Atrito se opõe ao deslizamento relativo ou à tendência de deslizamento relativo.
                </NoteBox>

                <NoteBox title="Frase perigosa" tone="red">
                  “Atrito sempre se opõe ao movimento.” Isso funciona em alguns casos e
                  falha feio em outros. É aquele tipo de frase que parece útil até custar
                  uma questão.
                </NoteBox>
              </TopicBlock>

              <FormulaGrid>
                <TopicBlock title="Bloco puxado na mesa" tone="blue">
                  <Paragraph>
                    O bloco tende a escorregar para a direita. A força de atrito sobre o
                    bloco aponta para a esquerda.
                  </Paragraph>
                </TopicBlock>

                <TopicBlock title="Bloco parado na rampa" tone="green">
                  <Paragraph>
                    O bloco tende a escorregar para baixo do plano. A força de atrito estático
                    aponta para cima do plano.
                  </Paragraph>
                </TopicBlock>

                <TopicBlock title="Pessoa caminhando" tone="amber">
                  <Paragraph>
                    O pé tende a escorregar para trás. A força de atrito do chão sobre o pé
                    aponta para frente.
                  </Paragraph>
                </TopicBlock>

                <TopicBlock title="Pneu acelerando" tone="purple">
                  <Paragraph>
                    O pneu tende a empurrar o chão para trás. O chão exerce força de atrito
                    estático para frente no pneu.
                  </Paragraph>
                </TopicBlock>
              </FormulaGrid>
            </Section>

            <Section
              icon={Compass}
              title="Atrito no plano inclinado"
              subtitle="Plano inclinado com atrito: onde a decomposição vetorial encontra a maldade dos vestibulares."
              gradient="bg-gradient-to-r from-green-700 to-emerald-800"
            >
              <TopicBlock title="Decomposição do peso" tone="green" icon={Compass}>
                <Paragraph>
                  No plano inclinado, o peso aponta verticalmente para baixo, mas o movimento
                  acontece ao longo do plano. Por isso, decompomos o peso em duas partes.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Componente paralela"
                    explanation="Tende a puxar o bloco para baixo da rampa."
                    formula={String.raw`P_{\parallel} = mg\sin\theta`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Componente perpendicular"
                    explanation="Comprime o bloco contra a superfície."
                    formula={String.raw`P_{\perp} = mg\cos\theta`}
                    tone="blue"
                  />

                  <FormulaStep
                    title="Normal"
                    formula={String.raw`N = mg\cos\theta`}
                    tone="purple"
                  />
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Bloco descendo com atrito cinético" tone="blue" icon={MoveRight}>
                <Paragraph>
                  Se o bloco desce, a força de atrito cinético aponta para cima do plano.
                  Escolhendo o sentido positivo para baixo da rampa:
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Atrito cinético"
                    formula={String.raw`f_c = \mu_c mg\cos\theta`}
                    tone="amber"
                  />

                  <FormulaStep
                    title="Segunda Lei"
                    formula={String.raw`mg\sin\theta - f_c = ma`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Aceleração"
                    formula={String.raw`a = g(\sin\theta - \mu_c\cos\theta)`}
                    tone="purple"
                  />
                </FormulaGrid>

                <NoteBox title="Leitura da fórmula" tone="blue">
                  <InlineFormulaBox formula={String.raw`g\sin\theta`} /> é a aceleração que
                  existiria sem atrito. <InlineFormulaBox formula={String.raw`\mu_c g\cos\theta`} />
                  é a redução causada pelo atrito.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Bloco subindo com velocidade inicial" tone="rose" icon={TrendingUp}>
                <Paragraph>
                  Se o bloco está subindo a rampa, a componente do peso aponta para baixo
                  do plano e a força de atrito cinético também aponta para baixo do plano.
                  As duas forças contribuem para frear a subida.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Retardamento"
                    formula={String.raw`mg\sin\theta + f_c = ma_{\text{retardamento}}`}
                    tone="rose"
                  />

                  <FormulaStep
                    title="Resultado"
                    formula={String.raw`a_{\text{retardamento}} = g(\sin\theta + \mu_c\cos\theta)`}
                    tone="amber"
                  />
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Bloco parado no plano inclinado" tone="amber" icon={Shield}>
                <Paragraph>
                  Se o bloco está parado, a força de atrito é estática. Ela aponta para cima
                  do plano se a tendência é escorregar para baixo.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Atrito estático necessário"
                    formula={String.raw`f_e = mg\sin\theta`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Condição para não escorregar"
                    formula={String.raw`mg\sin\theta \leq \mu_e mg\cos\theta`}
                    tone="amber"
                  />

                  <FormulaStep
                    title="Iminência de escorregamento"
                    formula={String.raw`mg\sin\theta = \mu_e mg\cos\theta`}
                    tone="purple"
                  />

                  <FormulaStep
                    title="Ângulo crítico"
                    formula={String.raw`\mu_e = \tan\theta`}
                    tone="purple"
                  />
                </FormulaGrid>
              </TopicBlock>
            </Section>

            <Section
              icon={Layers}
              title="Atrito em superfície horizontal e sistemas"
              subtitle="Blocos, sistemas e aquela mania das provas de esconder o atrito onde você menos queria."
              gradient="bg-gradient-to-r from-slate-700 to-slate-900"
            >
              <TopicBlock title="Bloco puxado por força horizontal" tone="blue" icon={MoveRight}>
                <Paragraph>
                  Em superfície horizontal simples, se não há aceleração vertical, a normal é
                  igual ao peso. Se o bloco está parado, o atrito é estático. Se desliza, o
                  atrito é cinético.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Condição para permanecer parado"
                    formula={String.raw`F \leq \mu_e N`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Com N = mg"
                    formula={String.raw`F \leq \mu_e mg`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Depois que desliza"
                    formula={String.raw`F - f_c = ma`}
                    tone="amber"
                  />

                  <FormulaStep
                    title="Aceleração"
                    formula={String.raw`a = \frac{F - \mu_c mg}{m}`}
                    tone="purple"
                  />
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Sistema de blocos" tone="purple" icon={Layers}>
                <Paragraph>
                  Em sistemas, o método é mais importante que a fórmula. Escolha o sistema,
                  faça o DCL, separe forças internas e externas e aplique a Segunda Lei.
                </Paragraph>

                <NumberedSteps
                  items={[
                    <>Escolha o corpo ou sistema.</>,
                    <>Faça o DCL.</>,
                    <>Identifique forças internas e externas.</>,
                    <>Aplique <InlineFormulaBox formula={String.raw`\sum F = ma`} />.</>,
                    <>Se for atrito estático, calcule o atrito necessário.</>,
                    <>Compare com <InlineFormulaBox formula={String.raw`f_{e,\text{máx}} = \mu_e N`} />.</>,
                  ]}
                />

                <FormulaGrid>
                  <FormulaStep
                    title="Atrito necessário"
                    formula={String.raw`f_{\text{necessário}} = ma`}
                    tone="blue"
                  />

                  <FormulaStep
                    title="Teste de escorregamento"
                    formula={String.raw`f_{\text{necessário}} \leq f_{e,\text{máx}}`}
                    tone="green"
                  />
                </FormulaGrid>
              </TopicBlock>
            </Section>

            <Section
              icon={Car}
              title="Atrito em caminhada, rodas e frenagem"
              subtitle="Onde o atrito aparece no mesmo sentido do movimento e humilha a frase decorada."
              gradient="bg-gradient-to-r from-blue-700 to-indigo-800"
            >
              <ThreeGrid>
                <TopicBlock title="Caminhada" tone="green" icon={Footprints}>
                  <Paragraph>
                    O pé empurra o chão para trás. O chão empurra o pé para frente por força
                    de atrito estático. Sem essa força, o pé escorregaria para trás.
                  </Paragraph>
                </TopicBlock>

                <TopicBlock title="Carro acelerando" tone="blue" icon={Car}>
                  <Paragraph>
                    O pneu tende a empurrar o chão para trás. O chão exerce força de atrito
                    estático para frente no pneu. Essa força acelera o carro.
                  </Paragraph>
                </TopicBlock>

                <TopicBlock title="Frenagem" tone="amber" icon={AlertTriangle}>
                  <Paragraph>
                    Se a roda rola sem escorregar, o atrito é estático. Se a roda trava e
                    desliza, o atrito passa a ser cinético. Por isso sistemas como ABS são
                    tão importantes.
                  </Paragraph>
                </TopicBlock>
              </ThreeGrid>

              <NoteBox title="Rolamento sem escorregamento versus deslizamento" tone="purple">
                Rolamento sem escorregamento envolve força de atrito estático. Roda travada
                deslizando envolve força de atrito cinético. Essa diferença é conceitual,
                prática e muito cobrada.
              </NoteBox>
            </Section>

            <Section
              icon={Activity}
              title="Gráficos e análise dimensional"
              subtitle="O gráfico do atrito mostra por que é mais difícil começar a mover do que manter deslizando."
              gradient="bg-gradient-to-r from-violet-700 to-purple-800"
            >
              <TopicBlock title="Gráfico da força de atrito pela força aplicada" tone="purple" icon={Activity}>
                <Paragraph>
                  Enquanto o bloco não escorrega, a força de atrito estático se ajusta para
                  equilibrar a força aplicada.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Trecho estático"
                    formula={String.raw`f_e = F`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Limite estático"
                    formula={String.raw`f_{e,\text{máx}} = \mu_e N`}
                    tone="amber"
                  />

                  <FormulaStep
                    title="Depois do escorregamento"
                    formula={String.raw`f_c = \mu_c N`}
                    tone="blue"
                  />
                </FormulaGrid>

                <NoteBox title="Descrição do gráfico" tone="purple">
                  O gráfico começa em zero, cresce junto com a força aplicada, atinge o
                  máximo estático e depois cai para o valor cinético, permanecendo
                  aproximadamente constante no modelo básico.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Unidade do coeficiente de atrito" tone="slate" icon={Scale}>
                <Paragraph>
                  A força de atrito é força, então sua unidade é newton. Como o coeficiente
                  aparece multiplicando a normal, ele não possui unidade.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Fórmula geral"
                    formula={String.raw`f = \mu N`}
                    tone="blue"
                  />

                  <FormulaStep
                    title="Isolando o coeficiente"
                    formula={String.raw`\mu = \frac{f}{N}`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Análise dimensional"
                    formula={String.raw`[\mu] = \frac{\text{N}}{\text{N}} = 1`}
                    tone="purple"
                  />
                </FormulaGrid>

                <NoteBox title="Conclusão" tone="green">
                  O coeficiente de atrito é adimensional. O certo é escrever{" "}
                  <InlineFormulaBox formula={String.raw`\mu = 0{,}4`} />, não{" "}
                  <InlineFormulaBox formula={String.raw`\mu = 0{,}4 \ \text{N}`} />.
                </NoteBox>
              </TopicBlock>
            </Section>

            <Section
              icon={Target}
              title="Como reconhecer questões de atrito"
              subtitle="O enunciado quase sempre entrega o crime. Só precisa olhar com menos desespero."
              gradient="bg-gradient-to-r from-rose-600 to-red-700"
            >
              <TopicBlock title="Palavras que denunciam atrito" tone="rose" icon={Search}>
                <BulletList
                  items={[
                    <>superfície rugosa;</>,
                    <>coeficiente de atrito;</>,
                    <>iminência de movimento;</>,
                    <>não escorrega;</>,
                    <>desliza;</>,
                    <>força mínima para mover;</>,
                    <>plano inclinado com atrito;</>,
                    <>bloco sobre bloco;</>,
                    <>esteira;</>,
                    <>pneu ou roda travada;</>,
                    <>força inclinada.</>,
                  ]}
                />
              </TopicBlock>

              <TopicBlock title="Roteiro mental" tone="indigo" icon={ListChecks}>
                <NumberedSteps
                  items={[
                    <>Existe contato?</>,
                    <>Existe deslizamento ou tendência de deslizamento relativo?</>,
                    <>É força de atrito estático ou força de atrito cinético?</>,
                    <>Qual é a normal?</>,
                    <>Qual é o sentido da força de atrito?</>,
                    <>Se for estático, o atrito necessário ultrapassa o máximo?</>,
                    <>Qual é a força resultante?</>,
                    <>Aplique <InlineFormulaBox formula={String.raw`\sum F = ma`} />.</>,
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
                <Calculator className="w-6 h-6 text-amber-600" />
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Exemplos resolvidos</h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Resoluções com DCL, normal, força de atrito e Segunda Lei.
                  </p>
                </div>
              </div>
            </div>

            {examples.map((ex) => (
              <div
                key={ex.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100"
              >
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
                  <div className="px-6 pb-6 border-t border-slate-100 pt-5">
                    {ex.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "resumo" && (
          <div className="space-y-10">
            <Section
              icon={Zap}
              title="Resumo final de Atrito"
              subtitle="A versão compacta para revisar sem virar refém da decoreba."
              gradient="bg-gradient-to-r from-amber-600 to-orange-700"
            >
              <TopicBlock title="Definição" tone="amber" icon={BookOpen}>
                <Paragraph>
                  A força de atrito é uma força de contato paralela à superfície, que se
                  opõe ao deslizamento relativo ou à tendência de deslizamento relativo entre
                  superfícies.
                </Paragraph>
              </TopicBlock>

              <FormulaGrid>
                <TopicBlock title="Força de atrito estático" tone="green" icon={Shield}>
                  <FormulaStep
                    title="Relação geral"
                    formula={String.raw`f_e \leq \mu_e N`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Valor máximo"
                    formula={String.raw`f_{e,\text{máx}} = \mu_e N`}
                    tone="amber"
                  />

                  <NoteBox title="Ideia" tone="green">
                    O atrito estático se ajusta. A igualdade só vale na iminência de escorregamento.
                  </NoteBox>
                </TopicBlock>

                <TopicBlock title="Força de atrito cinético" tone="blue" icon={MoveRight}>
                  <FormulaStep
                    title="Fórmula"
                    formula={String.raw`f_c = \mu_c N`}
                    tone="blue"
                  />

                  <FormulaStep
                    title="Comparação usual"
                    formula={String.raw`\mu_e > \mu_c`}
                    tone="purple"
                  />

                  <NoteBox title="Ideia" tone="blue">
                    Atua quando já há deslizamento relativo entre as superfícies.
                  </NoteBox>
                </TopicBlock>
              </FormulaGrid>

              <TopicBlock title="Normal" tone="slate" icon={Scale}>
                <Paragraph>
                  A normal mede a compressão entre as superfícies. Como o atrito depende da
                  normal, qualquer mudança na normal muda também a força de atrito.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Horizontal simples"
                    formula={String.raw`N = mg`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Plano inclinado simples"
                    formula={String.raw`N = mg\cos\theta`}
                    tone="blue"
                  />

                  <FormulaStep
                    title="Força inclinada para cima"
                    formula={String.raw`N = mg - F\sin\alpha`}
                    tone="purple"
                  />

                  <FormulaStep
                    title="Força inclinada para baixo"
                    formula={String.raw`N = mg + F\sin\alpha`}
                    tone="amber"
                  />
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Plano inclinado" tone="green" icon={Compass}>
                <FormulaGrid>
                  <FormulaStep
                    title="Componente paralela"
                    formula={String.raw`P_{\parallel} = mg\sin\theta`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Componente perpendicular"
                    formula={String.raw`P_{\perp} = mg\cos\theta`}
                    tone="blue"
                  />

                  <FormulaStep
                    title="Descendo com atrito cinético"
                    formula={String.raw`a = g(\sin\theta - \mu_c\cos\theta)`}
                    tone="purple"
                  />

                  <FormulaStep
                    title="Iminência de escorregamento"
                    formula={String.raw`\mu_e = \tan\theta`}
                    tone="amber"
                  />
                </FormulaGrid>
              </TopicBlock>
            </Section>

            <Section
              icon={AlertTriangle}
              title="Armadilhas clássicas"
              subtitle="A lista de pequenos crimes contra a Física."
              gradient="bg-gradient-to-r from-red-600 to-rose-700"
            >
              <FormulaGrid>
                <NoteBox title="Atrito sempre contra o movimento" tone="red">
                  Errado. Atrito se opõe ao deslizamento relativo ou à tendência de deslizamento relativo.
                </NoteBox>

                <NoteBox title="Usar fe = μeN sempre" tone="red">
                  Errado. Isso só vale na iminência de escorregamento.
                </NoteBox>

                <NoteBox title="Esquecer que o atrito estático se ajusta" tone="red">
                  O atrito estático real pode ser menor que o máximo.
                </NoteBox>

                <NoteBox title="Usar N = mg em qualquer caso" tone="red">
                  Normal deve ser calculada no eixo perpendicular ao contato.
                </NoteBox>

                <NoteBox title="Errar caminhada e pneus" tone="red">
                  Nessas situações, o atrito pode apontar no mesmo sentido do movimento.
                </NoteBox>

                <NoteBox title="Coeficiente de atrito com unidade" tone="red">
                  Coeficiente de atrito é adimensional.
                </NoteBox>

                <NoteBox title="Confundir força aplicada com resultante" tone="red">
                  A aceleração vem da força resultante, não de uma força isolada.
                </NoteBox>

                <NoteBox title="Não verificar o máximo estático" tone="red">
                  Em atrito estático, sempre compare o necessário com o máximo.
                </NoteBox>
              </FormulaGrid>
            </Section>

            <Section
              icon={Target}
              title="Checklist de prova"
              subtitle="O roteiro para não virar vítima de uma questão de atrito com cara inocente."
              gradient="bg-gradient-to-r from-emerald-700 to-green-800"
            >
              <NumberedSteps
                items={[
                  <>Existe contato entre superfícies?</>,
                  <>Existe deslizamento ou tendência de deslizamento relativo?</>,
                  <>O atrito é estático ou cinético?</>,
                  <>Qual é a normal?</>,
                  <>Qual é o sentido da força de atrito?</>,
                  <>Se for estático, qual atrito é necessário?</>,
                  <>Esse atrito necessário ultrapassa <InlineFormulaBox formula={String.raw`\mu_e N`} />?</>,
                  <>Se desliza, use <InlineFormulaBox formula={String.raw`f_c = \mu_c N`} />.</>,
                  <>Aplique <InlineFormulaBox formula={String.raw`\sum F = ma`} /> no eixo certo.</>,
                ]}
              />
            </Section>

            <Section
              icon={Brain}
              title="Frase final"
              gradient="bg-gradient-to-r from-slate-700 to-slate-900"
            >
              <div className="bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 rounded-2xl p-7 text-center shadow-inner">
                <p className="text-slate-900 text-2xl font-black">
                  Atrito não é uma fórmula.
                </p>
                <p className="text-amber-700 text-2xl font-black mt-1">
                  É uma análise de contato, normal e tendência de escorregamento.
                </p>
              </div>
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}
