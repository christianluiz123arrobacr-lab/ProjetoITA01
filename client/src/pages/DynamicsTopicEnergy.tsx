import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  Calculator,
  ChevronDown,
  ChevronUp,
  Compass,
  Flame,
  Gauge,
  Layers,
  Lightbulb,
  Target,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { MathFormula } from "@/components/MathFormula";

type Tab = "teoria" | "exemplos" | "resumo";

type Example = {
  id: string;
  title: string;
  statement: string;
  content: ReactNode;
};

function FormulaBlock({ formula }: { formula: string }) {
  return (
    <div className="my-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-black border border-slate-700 shadow-[0_18px_45px_rgba(15,23,42,0.25)] p-5 overflow-x-auto">
      <div className="text-slate-100 [&_.katex]:text-slate-100 [&_.katex-display]:my-0">
        <MathFormula formula={formula} display={true} />
      </div>
    </div>
  );
}

function InlineFormula({ formula }: { formula: string }) {
  return (
    <span className="inline-flex align-middle mx-1 rounded-md bg-slate-900 border border-slate-700 px-2 py-0.5 text-slate-100 [&_.katex]:text-slate-100">
      <MathFormula formula={formula} />
    </span>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
  accent = "from-indigo-600 to-purple-700",
}: {
  icon: React.ElementType;
  title: string;
  children: ReactNode;
  accent?: string;
}) {
  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-[0_18px_55px_rgba(15,23,42,0.08)] overflow-hidden">
      <div className={`bg-gradient-to-r ${accent} px-7 py-5`}>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/15 border border-white/20 p-2">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            {title}
          </h2>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-5 text-slate-700 leading-8">
        {children}
      </div>
    </section>
  );
}

function NoteBox({
  title,
  children,
  type = "info",
}: {
  title: string;
  children: ReactNode;
  type?: "info" | "warning" | "success" | "dark";
}) {
  const styles = {
    info: "bg-indigo-50 border-indigo-200 text-indigo-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    dark: "bg-slate-950 border-slate-800 text-slate-200",
  };

  return (
    <div className={`rounded-2xl border p-5 ${styles[type]}`}>
      <p className="font-black mb-2">{title}</p>
      <div className="text-sm md:text-base leading-7">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <span className="mt-3 h-2 w-2 rounded-full bg-indigo-600 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ExampleAccordion({ example }: { example: Example }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="bg-white rounded-3xl border border-slate-200 shadow-[0_14px_45px_rgba(15,23,42,0.07)] overflow-hidden">
      <button
        onClick={() => setOpen((value) => !value)}
        className="w-full text-left p-6 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <h3 className="text-lg font-black text-slate-950">
              {example.title}
            </h3>
            <p className="text-sm text-slate-600 leading-7 mt-2">
              {example.statement}
            </p>
          </div>

          <div className="rounded-full bg-slate-950 text-white p-2 flex-shrink-0">
            {open ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-6 md:p-7 space-y-5 text-slate-700 leading-8">
          {example.content}
        </div>
      )}
    </article>
  );
}

export default function DynamicsTopicEnergy() {
  const [activeTab, setActiveTab] = useState<Tab>("teoria");

  const examples: Example[] = [
    {
      id: "ex1",
      title: "Exemplo 1 — Trabalho de uma força inclinada",
      statement:
        "Uma força de 50 N puxa um bloco por 10 m. A força faz 60° com o deslocamento. Determine o trabalho.",
      content: (
        <>
          <p>
            A força não está totalmente na direção do deslocamento. Só a
            componente paralela ao movimento realiza trabalho. A fórmula correta
            é:
          </p>

          <FormulaBlock formula={String.raw`W = Fd\cos\theta`} />

          <p>Substituindo:</p>

          <FormulaBlock
            formula={String.raw`W = 50 \cdot 10 \cdot \cos 60^\circ`}
          />

          <p>Como:</p>

          <FormulaBlock formula={String.raw`\cos 60^\circ = \frac{1}{2}`} />

          <p>Então:</p>

          <FormulaBlock
            formula={String.raw`W = 50 \cdot 10 \cdot \frac{1}{2} = 250 \ \text{J}`}
          />

          <NoteBox title="Interpretação física" type="success">
            A força total é 50 N, mas apenas a parte dela que aponta na direção
            do deslocamento transfere energia ao bloco. A componente
            perpendicular existe, mas não realiza trabalho nesse deslocamento.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex2",
      title: "Exemplo 2 — Bloco puxado com atrito",
      statement:
        "Um bloco de 4 kg parte do repouso. Uma força horizontal de 30 N o puxa por 5 m. O coeficiente de atrito cinético é 0,2 e g = 10 m/s². Determine a velocidade final.",
      content: (
        <>
          <p>
            A questão pede velocidade depois de um deslocamento. Isso grita
            energia, quase com megafone. Vamos usar o Teorema da Energia
            Cinética:
          </p>

          <FormulaBlock formula={String.raw`W_{\text{res}} = \Delta E_c`} />

          <p>Na horizontal simples:</p>

          <FormulaBlock
            formula={String.raw`N = mg = 4 \cdot 10 = 40 \ \text{N}`}
          />

          <p>O atrito cinético vale:</p>

          <FormulaBlock
            formula={String.raw`f_c = \mu_c N = 0{,}2 \cdot 40 = 8 \ \text{N}`}
          />

          <p>Trabalho da força aplicada:</p>

          <FormulaBlock
            formula={String.raw`W_F = Fd = 30 \cdot 5 = 150 \ \text{J}`}
          />

          <p>Trabalho do atrito:</p>

          <FormulaBlock
            formula={String.raw`W_{\text{at}} = -f_c d = -8 \cdot 5 = -40 \ \text{J}`}
          />

          <p>Trabalho resultante:</p>

          <FormulaBlock
            formula={String.raw`W_{\text{res}} = 150 - 40 = 110 \ \text{J}`}
          />

          <p>Como o bloco parte do repouso:</p>

          <FormulaBlock
            formula={String.raw`110 = \frac{1}{2} \cdot 4 \cdot v^2`}
          />

          <FormulaBlock formula={String.raw`110 = 2v^2`} />

          <FormulaBlock formula={String.raw`v^2 = 55`} />

          <FormulaBlock formula={String.raw`v = \sqrt{55} \approx 7{,}4 \ \text{m/s}`} />

          <NoteBox title="Resposta" type="success">
            A velocidade final é aproximadamente{" "}
            <InlineFormula formula={String.raw`7{,}4 \ \text{m/s}`} />.
            A força aplicada forneceu energia, mas o atrito roubou parte da
            festa, como sempre.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex3",
      title: "Exemplo 3 — Queda livre por energia",
      statement:
        "Um corpo é abandonado de uma altura de 20 m. Despreze o ar e use g = 10 m/s². Determine a velocidade antes de chegar ao solo.",
      content: (
        <>
          <p>
            Sem resistência do ar, só o peso realiza trabalho. Como o peso é
            conservativo, a energia mecânica se conserva:
          </p>

          <FormulaBlock formula={String.raw`E_{m,i} = E_{m,f}`} />

          <p>No topo, o corpo tem energia potencial gravitacional. No solo, essa
          energia virou energia cinética:</p>

          <FormulaBlock formula={String.raw`mgh = \frac{1}{2}mv^2`} />

          <p>A massa cancela:</p>

          <FormulaBlock formula={String.raw`gh = \frac{v^2}{2}`} />

          <FormulaBlock formula={String.raw`v = \sqrt{2gh}`} />

          <p>Substituindo:</p>

          <FormulaBlock
            formula={String.raw`v = \sqrt{2 \cdot 10 \cdot 20} = \sqrt{400}`}
          />

          <FormulaBlock formula={String.raw`v = 20 \ \text{m/s}`} />

          <NoteBox title="Ideia física" type="success">
            A velocidade final não depende da massa, desde que a resistência do
            ar seja desprezada. A altura determina a energia disponível.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex4",
      title: "Exemplo 4 — Rampa sem atrito",
      statement:
        "Um bloco parte do repouso do alto de uma rampa sem atrito de altura 5 m. Use g = 10 m/s². Determine a velocidade no fim da rampa.",
      content: (
        <>
          <p>
            Sem atrito, a energia mecânica se conserva. A normal não realiza
            trabalho, pois é perpendicular ao deslocamento ao longo da rampa.
          </p>

          <FormulaBlock formula={String.raw`mgh = \frac{1}{2}mv^2`} />

          <FormulaBlock formula={String.raw`v = \sqrt{2gh}`} />

          <FormulaBlock
            formula={String.raw`v = \sqrt{2 \cdot 10 \cdot 5} = \sqrt{100}`}
          />

          <FormulaBlock formula={String.raw`v = 10 \ \text{m/s}`} />

          <NoteBox title="Detalhe importante" type="info">
            A velocidade depende da altura perdida, não do comprimento da rampa,
            se não houver atrito. O comprimento muda o tempo de descida, não a
            energia final.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex5",
      title: "Exemplo 5 — Rampa com atrito",
      statement:
        "Um bloco desce uma rampa de 10 m, inclinada de 37°. O coeficiente de atrito cinético é 0,25. Use g = 10 m/s², sen 37° = 0,6 e cos 37° = 0,8. Determine a velocidade final.",
      content: (
        <>
          <p>
            Agora há atrito. A energia mecânica não se conserva. Usamos:
          </p>

          <FormulaBlock
            formula={String.raw`E_{m,i} + W_{\text{at}} = E_{m,f}`}
          />

          <p>A altura da rampa é:</p>

          <FormulaBlock
            formula={String.raw`h = d\sin\theta = 10 \cdot 0{,}6 = 6 \ \text{m}`}
          />

          <p>O atrito no plano vale:</p>

          <FormulaBlock formula={String.raw`f_c = \mu_c mg\cos\theta`} />

          <p>O trabalho do atrito ao longo da rampa é:</p>

          <FormulaBlock
            formula={String.raw`W_{\text{at}} = -\mu_c mg\cos\theta \cdot d`}
          />

          <p>A equação de energia fica:</p>

          <FormulaBlock
            formula={String.raw`mgh - \mu_c mg\cos\theta \cdot d = \frac{1}{2}mv^2`}
          />

          <p>Cancelando a massa:</p>

          <FormulaBlock
            formula={String.raw`gh - \mu_c g\cos\theta \cdot d = \frac{1}{2}v^2`}
          />

          <p>Substituindo:</p>

          <FormulaBlock
            formula={String.raw`10 \cdot 6 - 0{,}25 \cdot 10 \cdot 0{,}8 \cdot 10 = \frac{1}{2}v^2`}
          />

          <FormulaBlock formula={String.raw`60 - 20 = \frac{1}{2}v^2`} />

          <FormulaBlock formula={String.raw`v^2 = 80`} />

          <FormulaBlock formula={String.raw`v = \sqrt{80} \approx 8{,}9 \ \text{m/s}`} />

          <NoteBox title="Interpretação física" type="warning">
            Sem atrito, a velocidade seria maior. Parte da energia potencial
            gravitacional virou energia cinética e parte foi dissipada pelo
            atrito.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex6",
      title: "Exemplo 6 — Mola lançando bloco",
      statement:
        "Uma mola de constante 200 N/m é comprimida 0,10 m. Um bloco de 0,50 kg é lançado sobre superfície sem atrito. Determine a velocidade quando a mola volta à posição natural.",
      content: (
        <>
          <p>
            A energia potencial elástica inicial vira energia cinética. Sem
            atrito, há conservação de energia mecânica:
          </p>

          <FormulaBlock
            formula={String.raw`\frac{1}{2}kx^2 = \frac{1}{2}mv^2`}
          />

          <p>Substituindo:</p>

          <FormulaBlock
            formula={String.raw`\frac{1}{2}\cdot 200 \cdot (0{,}10)^2 = \frac{1}{2}\cdot 0{,}50 \cdot v^2`}
          />

          <FormulaBlock formula={String.raw`1 = 0{,}25v^2`} />

          <FormulaBlock formula={String.raw`v^2 = 4`} />

          <FormulaBlock formula={String.raw`v = 2 \ \text{m/s}`} />

          <NoteBox title="Cuidado com o sinal da mola" type="warning">
            O trabalho da força elástica durante a expansão é positivo, pois a
            mola empurra o bloco no sentido do deslocamento. Durante a compressão
            feita pelo bloco contra a mola, o trabalho da força elástica seria
            negativo:
            <FormulaBlock
              formula={String.raw`W_{\text{el}} = -\frac{1}{2}kx^2`}
            />
            O módulo da energia armazenada é positivo:
            <FormulaBlock
              formula={String.raw`E_{p,e} = \frac{1}{2}kx^2`}
            />
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex7",
      title: "Exemplo 7 — Distância até parar",
      statement:
        "Um bloco é lançado com velocidade inicial de 10 m/s sobre superfície horizontal rugosa. O coeficiente de atrito cinético é 0,25 e g = 10 m/s². Determine a distância até parar.",
      content: (
        <>
          <p>
            O atrito retira toda a energia cinética inicial do bloco. Usamos:
          </p>

          <FormulaBlock formula={String.raw`W_{\text{at}} = \Delta E_c`} />

          <p>Na horizontal:</p>

          <FormulaBlock formula={String.raw`f_c = \mu_c mg`} />

          <p>O trabalho do atrito é:</p>

          <FormulaBlock
            formula={String.raw`W_{\text{at}} = -\mu_c mgd`}
          />

          <p>Como o bloco para:</p>

          <FormulaBlock
            formula={String.raw`-\mu_c mgd = 0 - \frac{1}{2}mv_0^2`}
          />

          <p>Cancelando massa e sinais:</p>

          <FormulaBlock formula={String.raw`\mu_c gd = \frac{1}{2}v_0^2`} />

          <FormulaBlock
            formula={String.raw`d = \frac{v_0^2}{2\mu_c g}`}
          />

          <p>Substituindo:</p>

          <FormulaBlock
            formula={String.raw`d = \frac{10^2}{2 \cdot 0{,}25 \cdot 10} = \frac{100}{5}`}
          />

          <FormulaBlock formula={String.raw`d = 20 \ \text{m}`} />

          <NoteBox title="Maldade de prova" type="info">
            Como a energia cinética depende de{" "}
            <InlineFormula formula={String.raw`v^2`} />, dobrar a velocidade
            quadruplica a distância de parada, se o atrito for o mesmo.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex8",
      title: "Exemplo 8 — Pêndulo ideal",
      statement:
        "Um pêndulo de comprimento 2 m é solto do repouso fazendo 60° com a vertical. Determine a velocidade no ponto mais baixo. Use g = 10 m/s².",
      content: (
        <>
          <p>
            A tração não realiza trabalho, pois é perpendicular ao deslocamento
            instantâneo. A energia potencial perdida vira energia cinética.
          </p>

          <p>A altura em relação ao ponto mais baixo é:</p>

          <FormulaBlock formula={String.raw`h = L(1-\cos\theta)`} />

          <FormulaBlock
            formula={String.raw`h = 2(1-\cos60^\circ) = 2\left(1-\frac{1}{2}\right) = 1 \ \text{m}`}
          />

          <p>Conservando energia:</p>

          <FormulaBlock formula={String.raw`mgh = \frac{1}{2}mv^2`} />

          <FormulaBlock formula={String.raw`v = \sqrt{2gh}`} />

          <FormulaBlock
            formula={String.raw`v = \sqrt{2 \cdot 10 \cdot 1} = \sqrt{20}`}
          />

          <FormulaBlock formula={String.raw`v \approx 4{,}5 \ \text{m/s}`} />

          <NoteBox title="Ideia forte" type="success">
            Energia acha a velocidade. Se a questão pedisse a tração no ponto
            mais baixo, aí precisaríamos de Newton na direção radial.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex9",
      title: "Exemplo 9 — Looping: energia + Newton",
      statement:
        "Um carrinho deve completar um looping vertical de raio R. Determine a altura mínima H, em relação ao ponto mais baixo, para que ele complete o looping sem perder contato. Despreze atrito.",
      content: (
        <>
          <p>
            Esse exemplo é clássico porque mostra que energia e Newton trabalham
            juntos. Energia sozinha acha velocidade. Newton dá a condição de
            contato.
          </p>

          <p>
            No topo do looping, a condição mínima para manter contato é:
          </p>

          <FormulaBlock formula={String.raw`N = 0`} />

          <p>No topo, peso e normal apontam para o centro. Na condição mínima:</p>

          <FormulaBlock
            formula={String.raw`mg = m\frac{v_{\text{topo}}^2}{R}`}
          />

          <p>Cancelando a massa:</p>

          <FormulaBlock
            formula={String.raw`v_{\text{topo}}^2 = gR`}
          />

          <p>
            Agora usamos energia entre o ponto inicial, altura{" "}
            <InlineFormula formula={String.raw`H`} />, e o topo do looping,
            altura <InlineFormula formula={String.raw`2R`} />.
          </p>

          <FormulaBlock
            formula={String.raw`mgH = mg(2R) + \frac{1}{2}mv_{\text{topo}}^2`}
          />

          <p>Cancelando massa e substituindo:</p>

          <FormulaBlock
            formula={String.raw`gH = 2gR + \frac{1}{2}gR`}
          />

          <FormulaBlock formula={String.raw`H = 2R + \frac{R}{2}`} />

          <FormulaBlock formula={String.raw`H = \frac{5R}{2}`} />

          <NoteBox title="Resposta e interpretação" type="success">
            A altura mínima é:
            <FormulaBlock formula={String.raw`H_{\min} = \frac{5R}{2}`} />
            A parte <InlineFormula formula={String.raw`2R`} /> serve para
            chegar à altura do topo. A parte{" "}
            <InlineFormula formula={String.raw`\frac{R}{2}`} /> fornece a
            velocidade mínima necessária para manter a trajetória circular.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex10",
      title: "Exemplo 10 — Gráfico força versus deslocamento",
      statement:
        "Uma força varia com a posição: de 0 a 4 m ela cresce linearmente de 0 a 20 N; de 4 m a 8 m permanece em 20 N; de 8 m a 10 m cai linearmente até 0. Calcule o trabalho total.",
      content: (
        <>
          <p>
            Quando a questão dá gráfico ou descreve força variável, o trabalho é
            área. Sem drama, sem invocar fórmula aleatória.
          </p>

          <p>Primeiro trecho: triângulo de base 4 m e altura 20 N.</p>

          <FormulaBlock
            formula={String.raw`W_1 = \frac{4 \cdot 20}{2} = 40 \ \text{J}`}
          />

          <p>Segundo trecho: retângulo de base 4 m e altura 20 N.</p>

          <FormulaBlock
            formula={String.raw`W_2 = 4 \cdot 20 = 80 \ \text{J}`}
          />

          <p>Terceiro trecho: triângulo de base 2 m e altura 20 N.</p>

          <FormulaBlock
            formula={String.raw`W_3 = \frac{2 \cdot 20}{2} = 20 \ \text{J}`}
          />

          <p>Trabalho total:</p>

          <FormulaBlock
            formula={String.raw`W = W_1 + W_2 + W_3 = 40 + 80 + 20`}
          />

          <FormulaBlock formula={String.raw`W = 140 \ \text{J}`} />

          <NoteBox title="Observação de prova" type="info">
            Se alguma parte do gráfico estivesse abaixo do eixo, aquela área
            entraria negativa. Trabalho é soma algébrica das áreas.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex11",
      title: "Exemplo 11 — Rampa, atrito e mola",
      statement:
        "Um bloco de 2 kg parte do repouso do topo de uma rampa sem atrito de altura 5 m. Depois percorre 6 m em superfície horizontal rugosa com μ = 0,25 e comprime uma mola de k = 400 N/m na mesma superfície rugosa. Use g = 10 m/s². Determine a compressão máxima.",
      content: (
        <>
          <p>
            Esse é o tipo de questão em que tentar acompanhar aceleração trecho
            por trecho é pedir sofrimento. Energia resolve melhor.
          </p>

          <p>Energia inicial no alto:</p>

          <FormulaBlock
            formula={String.raw`E_i = mgh = 2 \cdot 10 \cdot 5 = 100 \ \text{J}`}
          />

          <p>Na horizontal rugosa:</p>

          <FormulaBlock
            formula={String.raw`f_c = \mu mg = 0{,}25 \cdot 2 \cdot 10 = 5 \ \text{N}`}
          />

          <p>Energia dissipada antes da mola:</p>

          <FormulaBlock
            formula={String.raw`E_{\text{diss},1} = f_c L = 5 \cdot 6 = 30 \ \text{J}`}
          />

          <p>Energia que chega à mola:</p>

          <FormulaBlock formula={String.raw`100 - 30 = 70 \ \text{J}`} />

          <p>
            Durante a compressão, o bloco ainda sofre atrito por uma distância{" "}
            <InlineFormula formula={String.raw`x`} />. A energia restante vira
            energia elástica e energia dissipada:
          </p>

          <FormulaBlock
            formula={String.raw`70 = \frac{1}{2}kx^2 + f_cx`}
          />

          <p>Substituindo:</p>

          <FormulaBlock
            formula={String.raw`70 = \frac{1}{2}\cdot 400x^2 + 5x`}
          />

          <FormulaBlock formula={String.raw`70 = 200x^2 + 5x`} />

          <FormulaBlock formula={String.raw`200x^2 + 5x - 70 = 0`} />

          <p>Usando Bhaskara:</p>

          <FormulaBlock
            formula={String.raw`x = \frac{-5 + \sqrt{5^2 - 4 \cdot 200 \cdot (-70)}}{400}`}
          />

          <FormulaBlock
            formula={String.raw`x = \frac{-5 + \sqrt{56025}}{400}`}
          />

          <FormulaBlock formula={String.raw`x \approx 0{,}58 \ \text{m}`} />

          <NoteBox title="Resposta" type="success">
            A compressão máxima é aproximadamente{" "}
            <InlineFormula formula={String.raw`0{,}58 \ \text{m}`} />. A energia
            não desapareceu: uma parte ficou armazenada na mola e outra foi
            dissipada pelo atrito.
          </NoteBox>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dinamica"
              className="rounded-full border border-slate-200 bg-white p-2 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </Link>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                Dinâmica
              </p>
              <h1 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight">
                Trabalho e Energia
              </h1>
            </div>
          </div>

          <div className="hidden md:flex gap-2">
            {(["teoria", "exemplos", "resumo"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-black capitalize transition-colors ${
                  activeTab === tab
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="md:hidden max-w-5xl mx-auto px-4 pb-4 flex gap-2">
          {(["teoria", "exemplos", "resumo"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2 rounded-full text-sm font-black capitalize transition-colors ${
                activeTab === tab
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 bg-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-10">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 border border-slate-800 shadow-[0_24px_75px_rgba(15,23,42,0.35)] p-7 md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.35),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.2),transparent_32%)]" />

          <div className="relative grid lg:grid-cols-[1.35fr_0.65fr] gap-8 items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-4 py-2 text-amber-300 text-xs font-black uppercase tracking-[0.18em] mb-5">
                <Flame className="w-4 h-4" />
                Mecânica energética
              </div>

              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
                Energia é a contabilidade inteligente do movimento.
              </h2>

              <p className="mt-5 text-slate-300 leading-8 max-w-3xl">
                Newton pergunta quais forças atuam agora. Energia pergunta como
                o sistema começou, como terminou e o que foi transformado no
                caminho. Uma abordagem não substitui a outra; as duas juntas
                param de fazer o aluno sofrer igual personagem secundário em
                filme ruim.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Trabalho", value: "W" },
                { label: "Energia cinética", value: "Ec" },
                { label: "Energia potencial", value: "Ep" },
                { label: "Energia mecânica", value: "Em" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm"
                >
                  <p className="text-3xl font-black text-white">{item.value}</p>
                  <p className="text-xs text-slate-300 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {activeTab === "teoria" && (
          <div className="space-y-10">
            <SectionCard
              icon={BookOpen}
              title="Contexto físico: por que energia mudou a Mecânica"
              accent="from-orange-600 to-rose-700"
            >
              <p>
                O conceito de energia é uma das ideias mais poderosas da Física
                porque permite estudar transformações sem acompanhar cada detalhe
                microscópico do movimento. Antes de energia virar uma ferramenta
                central, muitos problemas eram resolvidos pelo caminho mais
                direto: desenhar forças, aplicar{" "}
                <InlineFormula formula={String.raw`\sum F = ma`} />, encontrar
                aceleração e depois usar Cinemática.
              </p>

              <p>
                Esse método continua essencial. O problema é que ele pode ser
                trabalhoso quando a pergunta não exige saber a força em cada
                instante. Se a questão quer velocidade final, altura máxima,
                distância até parar ou compressão de uma mola, energia costuma
                ser o caminho mais limpo.
              </p>

              <div className="grid md:grid-cols-2 gap-5">
                <NoteBox title="Análise por Newton" type="info">
                  Pergunta: quais forças atuam agora? Qual é a força resultante?
                  Qual aceleração ela produz? É uma análise local, instante a
                  instante.
                </NoteBox>

                <NoteBox title="Análise por energia" type="success">
                  Pergunta: que energia havia no estado inicial? Que energia há
                  no estado final? Houve dissipação ou trabalho externo? É uma
                  análise global.
                </NoteBox>
              </div>

              <p>
                Em uma rampa sem atrito, Newton calcula a componente do peso,
                acha a aceleração e depois usa Cinemática. Energia compara o
                topo com a base:
              </p>

              <FormulaBlock formula={String.raw`mgh = \frac{1}{2}mv^2`} />

              <p>A massa cancela:</p>

              <FormulaBlock formula={String.raw`v = \sqrt{2gh}`} />

              <p>
                Energia não é uma substância mágica. É uma grandeza que organiza
                a contabilidade das transformações: altura virando velocidade,
                mola virando movimento, energia mecânica virando calor por
                atrito. Física, quando quer, sabe ser elegante. Pena que os
                enunciados às vezes discordam.
              </p>
            </SectionCard>

            <SectionCard
              icon={Lightbulb}
              title="Ideia intuitiva de trabalho"
              accent="from-indigo-600 to-purple-700"
            >
              <p>
                No cotidiano, trabalho parece significar esforço. Em Física,
                trabalho tem uma definição mais precisa: é a transferência de
                energia feita por uma força ao longo de um deslocamento.
              </p>

              <FormulaBlock formula={String.raw`W = Fd\cos\theta`} />

              <p>
                Aqui, <InlineFormula formula={String.raw`\theta`} /> é o ângulo
                entre a força e o deslocamento, não necessariamente entre a força
                e a horizontal. Essa confusão é tão comum que deveria vir com
                multa pedagógica.
              </p>

              <div className="grid md:grid-cols-3 gap-5">
                <NoteBox title="Trabalho positivo" type="success">
                  A força tem componente no mesmo sentido do deslocamento.
                  Transfere energia para o corpo.
                  <FormulaBlock formula={String.raw`W > 0`} />
                </NoteBox>

                <NoteBox title="Trabalho negativo" type="warning">
                  A força tem componente contrária ao deslocamento. Retira
                  energia mecânica do corpo.
                  <FormulaBlock formula={String.raw`W < 0`} />
                </NoteBox>

                <NoteBox title="Trabalho nulo" type="info">
                  A força é perpendicular ao deslocamento ou não há deslocamento.
                  Força não é sinônimo de trabalho.
                  <FormulaBlock formula={String.raw`W = 0`} />
                </NoteBox>
              </div>

              <p>
                Uma pessoa segurando uma caixa parada pode se cansar, mas a
                força dela sobre a caixa não realiza trabalho mecânico se a caixa
                não se desloca. O corpo humano gasta energia internamente, mas a
                caixa não recebeu energia por trabalho mecânico.
              </p>

              <FormulaBlock formula={String.raw`1 \ \text{J} = 1 \ \text{N}\cdot\text{m}`} />

              <p>
                Trabalho e energia têm a mesma unidade porque trabalho é uma
                forma de transferir energia.
              </p>
            </SectionCard>

            <SectionCard
              icon={Compass}
              title="Trabalho das forças principais"
              accent="from-slate-700 to-slate-950"
            >
              <h3 className="text-xl font-black text-slate-950">
                Trabalho da força peso
              </h3>

              <p>
                O peso é uma força conservativa. Seu trabalho depende apenas da
                variação de altura, não do caminho percorrido. Se o corpo desce,
                o peso realiza trabalho positivo. Se sobe, trabalho negativo.
              </p>

              <FormulaBlock formula={String.raw`W_P = mg(h_i - h_f)`} />

              <NoteBox title="Relação com energia potencial gravitacional" type="info">
                Como:
                <FormulaBlock
                  formula={String.raw`\Delta E_{p,g} = mg(h_f - h_i)`}
                />
                então:
                <FormulaBlock
                  formula={String.raw`W_P = -\Delta E_{p,g}`}
                />
              </NoteBox>

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Trabalho da normal
              </h3>

              <p>
                Em problemas básicos, a normal costuma não realizar trabalho
                porque é perpendicular ao deslocamento. Um bloco deslizando sobre
                mesa horizontal tem deslocamento horizontal e normal vertical.
              </p>

              <FormulaBlock formula={String.raw`W_N = Nd\cos90^\circ = 0`} />

              <p>
                Mas cuidado: a normal não é, por natureza, uma força de trabalho
                sempre nulo. Em elevadores, plataformas móveis ou superfícies que
                empurram o corpo na direção do movimento, a normal pode realizar
                trabalho.
              </p>

              <NoteBox title="Exemplo importante" type="warning">
                Em um elevador subindo, a normal aponta para cima e a pessoa se
                desloca para cima. A normal pode realizar trabalho positivo. Se o
                elevador sobe com velocidade constante, o peso realiza trabalho
                negativo de mesmo módulo, e a energia cinética não muda. O saldo
                importa.
              </NoteBox>

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Trabalho do atrito
              </h3>

              <p>
                O atrito cinético geralmente realiza trabalho negativo, pois se
                opõe ao deslizamento relativo. Em superfície horizontal simples:
              </p>

              <FormulaBlock formula={String.raw`W_{\text{at}} = -f_cd`} />

              <FormulaBlock formula={String.raw`f_c = \mu_c N`} />

              <FormulaBlock formula={String.raw`W_{\text{at}} = -\mu_c Nd`} />

              <p>Se a superfície é horizontal e não há aceleração vertical:</p>

              <FormulaBlock formula={String.raw`N = mg`} />

              <FormulaBlock
                formula={String.raw`W_{\text{at}} = -\mu_c mgd`}
              />

              <p>
                O atrito transforma energia mecânica em energia térmica,
                vibrações, som e deformações microscópicas. Ele não destrói a
                energia total; ele destrói a esperança ingênua de conservar
                energia mecânica em qualquer cenário.
              </p>

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Trabalho da força elástica
              </h3>

              <p>
                A força elástica é variável. Pela Lei de Hooke:
              </p>

              <FormulaBlock formula={String.raw`F_e = kx`} />

              <p>
                Em uma dimensão, considerando o sentido positivo do eixo:
              </p>

              <FormulaBlock formula={String.raw`F_e = -kx`} />

              <p>
                O sinal negativo indica que a força elástica é restauradora: ela
                aponta para a posição natural da mola.
              </p>

              <NoteBox title="O ajuste importante do sinal" type="warning">
                A área triangular no gráfico força versus deformação fornece o
                módulo:
                <FormulaBlock formula={String.raw`\frac{1}{2}kx^2`} />
                Se uma força externa comprime a mola lentamente, o trabalho da
                força externa é positivo. Mas o trabalho da força elástica da
                mola durante essa compressão é negativo:
                <FormulaBlock
                  formula={String.raw`W_{\text{el}} = -\frac{1}{2}kx^2`}
                />
                Quando a mola relaxa e empurra o bloco, o trabalho da força
                elástica pode ser positivo.
              </NoteBox>

              <p>Forma geral:</p>

              <FormulaBlock
                formula={String.raw`W_{\text{el}} = \frac{1}{2}kx_i^2 - \frac{1}{2}kx_f^2`}
              />
            </SectionCard>

            <SectionCard
              icon={Zap}
              title="Energia cinética, potencial e mecânica"
              accent="from-emerald-600 to-teal-700"
            >
              <h3 className="text-xl font-black text-slate-950">
                Energia cinética
              </h3>

              <p>
                Energia cinética é a energia associada ao movimento. Um corpo em
                movimento pode realizar trabalho sobre outros corpos porque tem
                energia cinética.
              </p>

              <FormulaBlock formula={String.raw`E_c = \frac{1}{2}mv^2`} />

              <p>
                A velocidade aparece ao quadrado. Isso significa que dobrar a
                velocidade quadruplica a energia cinética:
              </p>

              <FormulaBlock formula={String.raw`v' = 2v \Rightarrow E_c' = 4E_c`} />

              <p>
                É por isso que frenagem, acidentes e distância de parada ficam
                muito mais sérios em altas velocidades. A natureza cobra no
                quadrado, sem parcelamento.
              </p>

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Teorema da Energia Cinética
              </h3>

              <FormulaBlock formula={String.raw`W_{\text{res}} = \Delta E_c`} />

              <p>
                O trabalho resultante é igual à variação da energia cinética. Se
                o trabalho resultante é positivo, a energia cinética aumenta. Se
                é negativo, diminui. Se é zero, a energia cinética permanece
                constante.
              </p>

              <p>
                Uma demonstração rápida vem de Newton:
              </p>

              <FormulaBlock formula={String.raw`F_{\text{res}} = ma`} />

              <FormulaBlock formula={String.raw`F_{\text{res}}d = mad`} />

              <p>Usando:</p>

              <FormulaBlock formula={String.raw`v_f^2 = v_i^2 + 2ad`} />

              <FormulaBlock
                formula={String.raw`ad = \frac{v_f^2 - v_i^2}{2}`}
              />

              <p>Substituindo:</p>

              <FormulaBlock
                formula={String.raw`W_{\text{res}} = \frac{1}{2}mv_f^2 - \frac{1}{2}mv_i^2`}
              />

              <FormulaBlock formula={String.raw`W_{\text{res}} = \Delta E_c`} />

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Energia potencial gravitacional
              </h3>

              <FormulaBlock formula={String.raw`E_{p,g} = mgh`} />

              <p>
                Ela depende do nível de referência escolhido. O valor absoluto
                pode mudar, mas a variação é o que tem significado físico:
              </p>

              <FormulaBlock
                formula={String.raw`\Delta E_{p,g} = mg(h_f - h_i)`}
              />

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Energia potencial elástica
              </h3>

              <FormulaBlock formula={String.raw`E_{p,e} = \frac{1}{2}kx^2`} />

              <p>
                A mola comprimida e a mola esticada armazenam energia. A posição
                natural, se escolhida como referência, tem energia elástica nula.
              </p>

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Energia mecânica
              </h3>

              <FormulaBlock formula={String.raw`E_m = E_c + E_p`} />

              <p>Com gravidade:</p>

              <FormulaBlock
                formula={String.raw`E_m = \frac{1}{2}mv^2 + mgh`}
              />

              <p>Com mola:</p>

              <FormulaBlock
                formula={String.raw`E_m = \frac{1}{2}mv^2 + \frac{1}{2}kx^2`}
              />

              <p>Com gravidade e mola:</p>

              <FormulaBlock
                formula={String.raw`E_m = \frac{1}{2}mv^2 + mgh + \frac{1}{2}kx^2`}
              />
            </SectionCard>

            <SectionCard
              icon={Layers}
              title="Conservação, dissipação e forças não conservativas"
              accent="from-blue-700 to-indigo-800"
            >
              <p>
                A energia mecânica se conserva quando apenas forças conservativas
                realizam trabalho. Peso e força elástica são os exemplos mais
                importantes no ensino médio.
              </p>

              <FormulaBlock formula={String.raw`E_{m,i} = E_{m,f}`} />

              <p>Ou:</p>

              <FormulaBlock
                formula={String.raw`E_{c,i} + E_{p,i} = E_{c,f} + E_{p,f}`}
              />

              <NoteBox title="Conservação não significa que tudo fica igual" type="info">
                Em uma queda livre, a energia potencial diminui e a energia
                cinética aumenta. O que permanece constante é a soma.
              </NoteBox>

              <p>
                Quando forças não conservativas realizam trabalho, a energia
                mecânica varia:
              </p>

              <FormulaBlock
                formula={String.raw`W_{\text{nc}} = \Delta E_m`}
              />

              <p>Escrevendo de modo explícito:</p>

              <FormulaBlock
                formula={String.raw`W_{\text{nc}} = E_{m,f} - E_{m,i}`}
              />

              <p>Outra forma muito usada:</p>

              <FormulaBlock
                formula={String.raw`E_{m,i} + W_{\text{nc}} = E_{m,f}`}
              />

              <NoteBox title="Como não errar o sinal" type="warning">
                Se o atrito realiza trabalho negativo, então{" "}
                <InlineFormula formula={String.raw`W_{\text{nc}} < 0`} /> e a
                energia mecânica final é menor:
                <FormulaBlock formula={String.raw`E_{m,f} < E_{m,i}`} />
                Também dá para escrever:
                <FormulaBlock
                  formula={String.raw`E_{m,i} = E_{m,f} + E_{\text{dissipada}}`}
                />
              </NoteBox>

              <p>Para atrito cinético:</p>

              <FormulaBlock
                formula={String.raw`E_{\text{dissipada}} = f_cd`}
              />
            </SectionCard>

            <SectionCard
              icon={BarChart3}
              title="Gráficos e interpretação avançada"
              accent="from-violet-700 to-fuchsia-800"
            >
              <h3 className="text-xl font-black text-slate-950">
                Gráfico força versus deslocamento
              </h3>

              <p>
                Quando a força varia com a posição, o trabalho é a área sob o
                gráfico <InlineFormula formula={String.raw`F \times x`} />.
              </p>

              <FormulaBlock
                formula={String.raw`W = \int_{x_i}^{x_f} F(x)\,dx`}
              />

              <p>
                Área acima do eixo gera trabalho positivo. Área abaixo gera
                trabalho negativo. Se houver trechos positivos e negativos, o
                trabalho total é a soma algébrica.
              </p>

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Gráfico energia potencial versus posição
              </h3>

              <p>
                Para forças conservativas em uma dimensão, existe uma relação
                profunda entre força e energia potencial:
              </p>

              <FormulaBlock formula={String.raw`F = -\frac{dU}{dx}`} />

              <p>
                O sinal negativo significa que a força aponta no sentido em que a
                energia potencial diminui mais rapidamente. Não precisa entrar em
                pânico com a derivada. A ideia é simples: sistemas conservativos
                tendem a “descer” a curva de energia potencial.
              </p>

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Energia é escalar
              </h3>

              <p>
                Energia normalmente fornece módulo de velocidade, altura,
                distância, compressão ou variação de energia. Mas ela não entrega
                automaticamente a direção vetorial do movimento. Direção vem da
                geometria, do vínculo ou da dinâmica.
              </p>

              <NoteBox title="Exemplo de prova" type="warning">
                Em um looping, energia pode achar a velocidade no topo. Mas para
                achar a normal, você precisa de Newton:
                <FormulaBlock
                  formula={String.raw`\sum F_c = m\frac{v^2}{R}`}
                />
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Brain}
              title="Quando usar Newton e quando usar energia"
              accent="from-slate-800 to-black"
            >
              <div className="grid md:grid-cols-2 gap-5">
                <NoteBox title="Use Newton quando..." type="dark">
                  <BulletList
                    items={[
                      "a questão pede força interna, tração, normal ou contato;",
                      "o problema pede aceleração instantânea;",
                      "há vínculos geométricos importantes;",
                      "o movimento depende de forças em um ponto específico;",
                      "há trajetória circular e pedido de normal ou tensão.",
                    ]}
                  />
                </NoteBox>

                <NoteBox title="Use energia quando..." type="dark">
                  <BulletList
                    items={[
                      "a questão pede velocidade final ou inicial;",
                      "aparece altura máxima ou mínima;",
                      "há mola e compressão máxima;",
                      "há distância até parar por atrito;",
                      "o tempo não é necessário;",
                      "o problema compara estados inicial e final.",
                    ]}
                  />
                </NoteBox>
              </div>

              <p>
                A regra prática é: energia é ótima para velocidade, altura,
                distância e deformação. Newton é melhor para força, aceleração
                instantânea e vínculo. O aluno forte não casa com uma fórmula; ele
                escolhe ferramenta. Evolução mínima, mas já ajuda.
              </p>
            </SectionCard>
          </div>
        )}

        {activeTab === "exemplos" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-[0_14px_45px_rgba(15,23,42,0.07)]">
              <h2 className="text-2xl font-black text-slate-950">
                Exemplos resolvidos
              </h2>
              <p className="text-slate-600 leading-7 mt-2">
                Clique em cada exemplo. A ideia aqui é treinar estratégia, não
                apenas substituir número como se a Física fosse uma planilha
                deprimida.
              </p>
            </div>

            {examples.map((example) => (
              <ExampleAccordion key={example.id} example={example} />
            ))}
          </div>
        )}

        {activeTab === "resumo" && (
          <div className="space-y-10">
            <SectionCard
              icon={Calculator}
              title="Resumo das fórmulas principais"
              accent="from-orange-600 to-red-700"
            >
              <div className="grid md:grid-cols-2 gap-5">
                {[
                  {
                    title: "Trabalho de força constante",
                    formula: String.raw`W = Fd\cos\theta`,
                  },
                  {
                    title: "Teorema da Energia Cinética",
                    formula: String.raw`W_{\text{res}} = \Delta E_c`,
                  },
                  {
                    title: "Energia cinética",
                    formula: String.raw`E_c = \frac{1}{2}mv^2`,
                  },
                  {
                    title: "Energia potencial gravitacional",
                    formula: String.raw`E_{p,g} = mgh`,
                  },
                  {
                    title: "Energia potencial elástica",
                    formula: String.raw`E_{p,e} = \frac{1}{2}kx^2`,
                  },
                  {
                    title: "Energia mecânica",
                    formula: String.raw`E_m = E_c + E_p`,
                  },
                  {
                    title: "Conservação da energia mecânica",
                    formula: String.raw`E_{m,i} = E_{m,f}`,
                  },
                  {
                    title: "Forças não conservativas",
                    formula: String.raw`E_{m,i} + W_{\text{nc}} = E_{m,f}`,
                  },
                  {
                    title: "Trabalho do atrito",
                    formula: String.raw`W_{\text{at}} = -f_cd`,
                  },
                  {
                    title: "Potência média",
                    formula: String.raw`P = \frac{W}{\Delta t}`,
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <p className="font-black text-slate-950 mb-3">
                      {item.title}
                    </p>
                    <FormulaBlock formula={item.formula} />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              icon={AlertTriangle}
              title="Armadilhas e erros comuns"
              accent="from-red-700 to-rose-800"
            >
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "Confundir trabalho com esforço físico.",
                  "Esquecer o cosseno em W = Fd cosθ.",
                  "Usar o ângulo errado: θ é entre força e deslocamento.",
                  "Achar que normal nunca realiza trabalho.",
                  "Achar que força centrípeta realiza trabalho no MCU.",
                  "Confundir trabalho resultante com trabalho de uma força específica.",
                  "Usar conservação de energia mecânica mesmo com atrito.",
                  "Esquecer que atrito usa distância percorrida, não só deslocamento vetorial.",
                  "Errar o sinal do trabalho da força elástica.",
                  "Esquecer que energia cinética depende de v².",
                  "Usar energia para achar tração ou normal sem Newton.",
                  "Não separar energia dissipada de energia mecânica final.",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl bg-red-50 border border-red-200 p-4 text-red-900"
                  >
                    <p className="font-bold text-sm leading-6">{item}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              icon={Target}
              title="Estratégia de prova"
              accent="from-indigo-700 to-purple-800"
            >
              <p>
                Para resolver uma questão de Trabalho e Energia, siga esta
                sequência:
              </p>

              <ol className="space-y-3">
                {[
                  "Identifique o estado inicial e o estado final.",
                  "Veja se existe altura: pode haver energia potencial gravitacional.",
                  "Veja se existe velocidade: há energia cinética.",
                  "Veja se existe mola deformada: há energia potencial elástica.",
                  "Verifique se há atrito ou força dissipativa.",
                  "Veja se alguma força externa realiza trabalho.",
                  "Decida se a energia mecânica se conserva.",
                  "Se conservar, use Em,i = Em,f.",
                  "Se não conservar, use Em,i + Wnc = Em,f.",
                  "Se o foco for apenas variação de velocidade pelo trabalho total, use Wres = ΔEc.",
                  "Se pedir normal, tração ou contato, combine com Newton.",
                ].map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-black flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>

              <NoteBox title="Frase final para guardar" type="dark">
                Trabalho é transferência de energia. Energia é a contabilidade
                das transformações do movimento, da posição e da configuração do
                sistema. Quem entende isso para de tentar resolver tudo no braço
                com aceleração e começa a escolher a ferramenta certa.
              </NoteBox>
            </SectionCard>
          </div>
        )}
      </main>
    </div>
  );
}
