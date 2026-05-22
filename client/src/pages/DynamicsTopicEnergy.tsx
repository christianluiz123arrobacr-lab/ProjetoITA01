Fechado. Aqui está o código completo atualizado, já com as melhorias que falei:

diferença entre trabalho específico e trabalho resultante;

energia mecânica não é energia total;

escolha do sistema físico;

potência mais bem explicada, incluindo $P = Fv$;

seção “quando energia engana o aluno”;

mais didática nas partes conceituais;

banner grandão só em Teoria;

Exemplos e Resumo com cabeçalho compacto, sem aquele outdoor invadindo tudo como se tivesse comprado o site.


Substitui o arquivo inteiro por este:

import { useState, type ElementType, type ReactNode } from "react";
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
    <div className="my-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-black border border-slate-700 shadow-[0_18px_45px_rgba(15,23,42,0.24)] p-5 overflow-x-auto">
      <div className="text-slate-100 [&_.katex]:text-slate-100 [&_.katex-display]:my-0">
        <MathFormula formula={formula} display={true} />
      </div>
    </div>
  );
}

function InlineFormula({ formula }: { formula: string }) {
  return (
    <span className="inline-flex align-middle mx-1 rounded-md bg-slate-950 border border-slate-700 px-2 py-0.5 text-slate-100 [&_.katex]:text-slate-100">
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
  icon: ElementType;
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

function CompactTabHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  accent = "from-slate-950 via-slate-900 to-slate-800",
}: {
  icon: ElementType;
  eyebrow: string;
  title: string;
  description: string;
  accent?: string;
}) {
  return (
    <section
      className={`rounded-[1.75rem] bg-gradient-to-br ${accent} border border-slate-800 shadow-[0_18px_55px_rgba(15,23,42,0.18)] p-6 md:p-8 overflow-hidden relative`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.16),transparent_32%)]" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-4 py-2 text-amber-300 text-xs font-black uppercase tracking-[0.16em] mb-4">
          <Icon className="w-4 h-4" />
          {eyebrow}
        </div>

        <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">
          {title}
        </h2>

        <p className="mt-3 text-slate-300 leading-7 max-w-3xl">
          {description}
        </p>
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
  type?: "info" | "warning" | "success" | "dark" | "danger";
}) {
  const styles = {
    info: "bg-indigo-50 border-indigo-200 text-indigo-950",
    warning: "bg-amber-50 border-amber-200 text-amber-950",
    success: "bg-emerald-50 border-emerald-200 text-emerald-950",
    danger: "bg-red-50 border-red-200 text-red-950",
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
        "Uma força de 50 N puxa um bloco por 10 m. A força faz 60° com a direção do deslocamento. Determine o trabalho realizado pela força.",
      content: (
        <>
          <p>
            A força não está totalmente na direção do deslocamento. Só a
            componente da força paralela ao deslocamento realiza trabalho. A
            componente perpendicular pode existir, alterar a normal ou influenciar
            outra força, mas nesse deslocamento específico ela não transfere
            energia para o movimento horizontal.
          </p>

          <FormulaBlock formula={String.raw`W = Fd\cos\theta`} />

          <p>Substituindo os dados:</p>

          <FormulaBlock
            formula={String.raw`W = 50 \cdot 10 \cdot \cos 60^\circ`}
          />

          <p>Como:</p>

          <FormulaBlock formula={String.raw`\cos 60^\circ = \frac{1}{2}`} />

          <p>Então:</p>

          <FormulaBlock
            formula={String.raw`W = 50 \cdot 10 \cdot \frac{1}{2}`}
          />

          <FormulaBlock formula={String.raw`W = 250 \ \text{J}`} />

          <NoteBox title="Interpretação física" type="success">
            A força total é 50 N, mas apenas sua componente na direção do
            deslocamento realiza trabalho. É por isso que o cosseno aparece. Ele
            seleciona a parte da força que realmente participa da transferência
            de energia.
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
            A questão pede velocidade depois de um deslocamento. Isso é um
            convite quase educado para usar trabalho e energia. Como há força
            aplicada e atrito, vamos calcular o trabalho resultante.
          </p>

          <FormulaBlock formula={String.raw`W_{\text{res}} = \Delta E_c`} />

          <p>Na horizontal simples:</p>

          <FormulaBlock
            formula={String.raw`N = mg = 4 \cdot 10 = 40 \ \text{N}`}
          />

          <p>O atrito cinético é:</p>

          <FormulaBlock
            formula={String.raw`f_c = \mu_c N = 0{,}2 \cdot 40 = 8 \ \text{N}`}
          />

          <p>Trabalho da força aplicada:</p>

          <FormulaBlock
            formula={String.raw`W_F = Fd = 30 \cdot 5 = 150 \ \text{J}`}
          />

          <p>Trabalho do atrito:</p>

          <FormulaBlock
            formula={String.raw`W_{\text{at}} = -f_cd = -8 \cdot 5 = -40 \ \text{J}`}
          />

          <p>Trabalho resultante:</p>

          <FormulaBlock
            formula={String.raw`W_{\text{res}} = 150 - 40 = 110 \ \text{J}`}
          />

          <p>Como o bloco parte do repouso:</p>

          <FormulaBlock formula={String.raw`E_{c,i} = 0`} />

          <FormulaBlock
            formula={String.raw`W_{\text{res}} = E_{c,f} - E_{c,i}`}
          />

          <FormulaBlock
            formula={String.raw`110 = \frac{1}{2} \cdot 4 \cdot v^2`}
          />

          <FormulaBlock formula={String.raw`110 = 2v^2`} />

          <FormulaBlock formula={String.raw`v^2 = 55`} />

          <FormulaBlock
            formula={String.raw`v = \sqrt{55} \approx 7{,}4 \ \text{m/s}`}
          />

          <NoteBox title="Resposta" type="success">
            A velocidade final é aproximadamente{" "}
            <InlineFormula formula={String.raw`7{,}4 \ \text{m/s}`} />. A força
            aplicada forneceu energia, mas o atrito retirou parte dela. O saldo
            virou energia cinética.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex3",
      title: "Exemplo 3 — Queda livre por energia",
      statement:
        "Um corpo é abandonado de uma altura de 20 m. Despreze a resistência do ar e use g = 10 m/s². Determine a velocidade imediatamente antes de chegar ao solo.",
      content: (
        <>
          <p>
            Sem resistência do ar, só o peso realiza trabalho. Como o peso é uma
            força conservativa, a energia mecânica se conserva.
          </p>

          <FormulaBlock formula={String.raw`E_{m,i} = E_{m,f}`} />

          <p>
            No topo, o corpo tem energia potencial gravitacional. No solo,
            escolhendo o solo como nível de referência, essa energia virou
            energia cinética.
          </p>

          <FormulaBlock formula={String.raw`mgh = \frac{1}{2}mv^2`} />

          <p>A massa cancela:</p>

          <FormulaBlock formula={String.raw`gh = \frac{v^2}{2}`} />

          <FormulaBlock formula={String.raw`v = \sqrt{2gh}`} />

          <p>Substituindo:</p>

          <FormulaBlock
            formula={String.raw`v = \sqrt{2 \cdot 10 \cdot 20}`}
          />

          <FormulaBlock formula={String.raw`v = \sqrt{400}`} />

          <FormulaBlock formula={String.raw`v = 20 \ \text{m/s}`} />

          <NoteBox title="Ideia física" type="success">
            A velocidade final não depende da massa quando a resistência do ar é
            desprezada. A altura determina a energia disponível para virar
            movimento.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex4",
      title: "Exemplo 4 — Rampa sem atrito",
      statement:
        "Um bloco parte do repouso do alto de uma rampa sem atrito de altura vertical 5 m. Use g = 10 m/s². Determine a velocidade no fim da rampa.",
      content: (
        <>
          <p>
            A normal não realiza trabalho porque é perpendicular ao deslocamento
            ao longo da rampa. Como não há atrito, a energia mecânica se
            conserva.
          </p>

          <FormulaBlock formula={String.raw`mgh = \frac{1}{2}mv^2`} />

          <FormulaBlock formula={String.raw`v = \sqrt{2gh}`} />

          <FormulaBlock
            formula={String.raw`v = \sqrt{2 \cdot 10 \cdot 5}`}
          />

          <FormulaBlock formula={String.raw`v = \sqrt{100}`} />

          <FormulaBlock formula={String.raw`v = 10 \ \text{m/s}`} />

          <NoteBox title="Detalhe importante" type="info">
            Sem atrito, a velocidade final depende da altura perdida, não do
            comprimento da rampa. Uma rampa mais longa muda o tempo de descida,
            mas não a energia final nesse modelo ideal.
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
            Agora há atrito. A energia mecânica não se conserva. O atrito
            realiza trabalho negativo e transforma parte da energia mecânica em
            energia interna e calor.
          </p>

          <FormulaBlock
            formula={String.raw`E_{m,i} + W_{\text{at}} = E_{m,f}`}
          />

          <p>A altura da rampa é:</p>

          <FormulaBlock
            formula={String.raw`h = d\sin\theta = 10 \cdot 0{,}6 = 6 \ \text{m}`}
          />

          <p>No plano inclinado:</p>

          <FormulaBlock formula={String.raw`N = mg\cos\theta`} />

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

          <FormulaBlock formula={String.raw`40 = \frac{1}{2}v^2`} />

          <FormulaBlock formula={String.raw`v^2 = 80`} />

          <FormulaBlock
            formula={String.raw`v = \sqrt{80} \approx 8{,}9 \ \text{m/s}`}
          />

          <NoteBox title="Interpretação física" type="warning">
            Sem atrito, a velocidade seria maior. Parte da energia potencial
            gravitacional virou energia cinética, mas outra parte foi dissipada.
            A energia total não sumiu, mas a energia mecânica diminuiu.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex6",
      title: "Exemplo 6 — Mola lançando bloco",
      statement:
        "Uma mola de constante 200 N/m é comprimida 0,10 m. Um bloco de 0,50 kg é lançado sobre uma superfície sem atrito. Determine a velocidade quando a mola volta à posição natural.",
      content: (
        <>
          <p>
            A energia potencial elástica inicial vira energia cinética. Como não
            há atrito, a energia mecânica se conserva.
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
            A energia potencial elástica é sempre positiva no modelo:
            <FormulaBlock
              formula={String.raw`E_{p,e} = \frac{1}{2}kx^2`}
            />
            Mas o trabalho da força elástica depende do processo. Durante a
            compressão, a força da mola é contrária ao deslocamento e seu
            trabalho é negativo:
            <FormulaBlock
              formula={String.raw`W_{\text{el}} = -\frac{1}{2}kx^2`}
            />
            Durante a expansão, a mola pode realizar trabalho positivo sobre o
            bloco.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex7",
      title: "Exemplo 7 — Distância até parar",
      statement:
        "Um bloco é lançado com velocidade inicial de 10 m/s sobre uma superfície horizontal rugosa. O coeficiente de atrito cinético é 0,25 e g = 10 m/s². Determine a distância até parar.",
      content: (
        <>
          <p>
            O atrito retira toda a energia cinética inicial do bloco. Como o
            bloco para, a energia cinética final é zero.
          </p>

          <FormulaBlock formula={String.raw`W_{\text{at}} = \Delta E_c`} />

          <p>Na horizontal:</p>

          <FormulaBlock formula={String.raw`N = mg`} />

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

          <FormulaBlock
            formula={String.raw`\mu_c gd = \frac{1}{2}v_0^2`}
          />

          <FormulaBlock
            formula={String.raw`d = \frac{v_0^2}{2\mu_c g}`}
          />

          <p>Substituindo:</p>

          <FormulaBlock
            formula={String.raw`d = \frac{10^2}{2 \cdot 0{,}25 \cdot 10}`}
          />

          <FormulaBlock formula={String.raw`d = \frac{100}{5}`} />

          <FormulaBlock formula={String.raw`d = 20 \ \text{m}`} />

          <NoteBox title="Maldade de prova" type="info">
            Como a energia cinética depende de{" "}
            <InlineFormula formula={String.raw`v^2`} />, dobrar a velocidade
            inicial quadruplica a energia cinética e, nesse tipo de situação,
            também quadruplica a distância de parada.
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
            A tração não realiza trabalho porque é perpendicular ao deslocamento
            instantâneo. A energia potencial gravitacional perdida vira energia
            cinética.
          </p>

          <p>A altura em relação ao ponto mais baixo é:</p>

          <FormulaBlock formula={String.raw`h = L(1-\cos\theta)`} />

          <FormulaBlock formula={String.raw`h = 2(1-\cos60^\circ)`} />

          <FormulaBlock
            formula={String.raw`h = 2\left(1-\frac{1}{2}\right) = 1 \ \text{m}`}
          />

          <p>Conservando energia:</p>

          <FormulaBlock formula={String.raw`mgh = \frac{1}{2}mv^2`} />

          <FormulaBlock formula={String.raw`v = \sqrt{2gh}`} />

          <FormulaBlock
            formula={String.raw`v = \sqrt{2 \cdot 10 \cdot 1}`}
          />

          <FormulaBlock
            formula={String.raw`v = \sqrt{20} \approx 4{,}5 \ \text{m/s}`}
          />

          <NoteBox title="Ideia forte" type="success">
            Energia acha a velocidade. Se a questão pedisse a tração no ponto
            mais baixo, aí seria necessário usar Newton na direção radial:
            <FormulaBlock
              formula={String.raw`\sum F_c = m\frac{v^2}{R}`}
            />
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
            Esse exemplo é excelente porque mostra uma ideia madura: energia e
            Newton não são inimigos. Energia acha velocidade. Newton acha força
            de contato.
          </p>

          <p>No topo do looping, a condição mínima para manter contato é:</p>

          <FormulaBlock formula={String.raw`N = 0`} />

          <p>No topo, o peso aponta para o centro. Na condição mínima:</p>

          <FormulaBlock
            formula={String.raw`mg = m\frac{v_{\text{topo}}^2}{R}`}
          />

          <p>Cancelando a massa:</p>

          <FormulaBlock formula={String.raw`v_{\text{topo}}^2 = gR`} />

          <p>
            Agora usamos energia entre o ponto inicial, de altura{" "}
            <InlineFormula formula={String.raw`H`} />, e o topo do looping, de
            altura <InlineFormula formula={String.raw`2R`} />.
          </p>

          <FormulaBlock
            formula={String.raw`mgH = mg(2R) + \frac{1}{2}mv_{\text{topo}}^2`}
          />

          <p>Cancelando a massa e substituindo:</p>

          <FormulaBlock
            formula={String.raw`gH = 2gR + \frac{1}{2}gR`}
          />

          <FormulaBlock formula={String.raw`H = 2R + \frac{R}{2}`} />

          <FormulaBlock formula={String.raw`H_{\min} = \frac{5R}{2}`} />

          <NoteBox title="Interpretação" type="success">
            A parte <InlineFormula formula={String.raw`2R`} /> serve para chegar
            à altura do topo. A parte{" "}
            <InlineFormula formula={String.raw`\frac{R}{2}`} /> fornece a
            velocidade mínima necessária para que o carrinho continue com
            aceleração centrípeta suficiente.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex10",
      title: "Exemplo 10 — Gráfico força versus deslocamento",
      statement:
        "Uma força varia com a posição: de 0 a 4 m cresce linearmente de 0 a 20 N; de 4 m a 8 m permanece em 20 N; de 8 m a 10 m cai linearmente até 0. Calcule o trabalho total.",
      content: (
        <>
          <p>
            Quando a questão dá gráfico ou descreve força variável, o trabalho é
            área sob o gráfico <InlineFormula formula={String.raw`F \times x`} />
            . Não saia procurando fórmula pronta antes de olhar a área, esse é
            o tipo de pressa que transforma questão fácil em tragédia grega.
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

          <FormulaBlock formula={String.raw`W = W_1 + W_2 + W_3`} />

          <FormulaBlock formula={String.raw`W = 40 + 80 + 20`} />

          <FormulaBlock formula={String.raw`W = 140 \ \text{J}`} />

          <NoteBox title="Observação de prova" type="info">
            Se alguma parte do gráfico estivesse abaixo do eixo, aquela área
            entraria negativa. O trabalho total é a soma algébrica das áreas.
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
            Esse é o tipo de questão em que tentar acompanhar aceleração em cada
            trecho é pedir sofrimento gratuito. Energia é melhor porque o
            problema pede um estado final: a compressão máxima.
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

          <p>Usando a raiz positiva:</p>

          <FormulaBlock
            formula={String.raw`x = \frac{-5 + \sqrt{5^2 - 4 \cdot 200 \cdot (-70)}}{2 \cdot 200}`}
          />

          <FormulaBlock
            formula={String.raw`x = \frac{-5 + \sqrt{56025}}{400}`}
          />

          <FormulaBlock formula={String.raw`x \approx 0{,}58 \ \text{m}`} />

          <NoteBox title="Resposta" type="success">
            A compressão máxima é aproximadamente{" "}
            <InlineFormula formula={String.raw`0{,}58 \ \text{m}`} />. A energia
            gravitacional inicial foi dividida entre energia elástica e energia
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
            <Link href="/dinamica">
              <a className="rounded-full border border-slate-200 bg-white p-2 hover:bg-slate-100 transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </a>
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
        {activeTab === "teoria" && (
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
                  Newton pergunta quais forças atuam agora. Energia pergunta
                  como o sistema começou, como terminou e o que foi transformado
                  no caminho. Uma abordagem não substitui a outra; as duas
                  juntas param de fazer o aluno sofrer igual personagem
                  secundário em filme ruim.
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
                    <p className="text-3xl font-black text-white">
                      {item.value}
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "teoria" && (
          <div className="space-y-10">
            <SectionCard
              icon={BookOpen}
              title="Contexto físico: por que energia mudou a Mecânica"
              accent="from-orange-600 to-rose-700"
            >
              <p>
                O conceito de energia é uma das ideias mais importantes da
                Física porque permite enxergar o movimento como transformação.
                Antes de energia virar uma ferramenta central, muitos problemas
                eram resolvidos pelo caminho clássico: desenhar forças, aplicar{" "}
                <InlineFormula formula={String.raw`\sum F = ma`} />, encontrar
                aceleração e depois usar Cinemática.
              </p>

              <p>
                Esse método continua indispensável. O problema é que ele pode
                ser mais trabalhoso do que necessário quando a pergunta só quer
                comparar início e fim. Se a questão pede velocidade final,
                altura máxima, distância até parar ou compressão de uma mola, a
                energia geralmente é mais direta.
              </p>

              <p>
                A grande vantagem da energia é que muitas vezes você não precisa
                saber como o corpo se moveu em cada instante. Você só precisa
                saber de onde ele saiu, onde chegou e quais transformações
                aconteceram no caminho. Isso é absurdamente poderoso, porque
                evita acompanhar aceleração ponto a ponto quando a questão nem
                pediu isso.
              </p>

              <div className="grid md:grid-cols-2 gap-5">
                <NoteBox title="Análise por Newton" type="info">
                  Newton pergunta: quais forças atuam agora? Qual é a força
                  resultante? Qual aceleração ela produz? É uma análise local,
                  instante a instante.
                </NoteBox>

                <NoteBox title="Análise por energia" type="success">
                  Energia pergunta: que energia havia no começo? Que energia há
                  no final? Houve transformação? Houve perda mecânica? É uma
                  análise global.
                </NoteBox>
              </div>

              <p>
                Em uma rampa sem atrito, Newton calcula a componente do peso,
                acha a aceleração e depois usa uma equação horária ou de
                Torricelli. Energia compara o topo com a base:
              </p>

              <FormulaBlock formula={String.raw`mgh = \frac{1}{2}mv^2`} />

              <p>A massa cancela:</p>

              <FormulaBlock formula={String.raw`v = \sqrt{2gh}`} />

              <p>
                A mudança de mentalidade é esta: Newton acompanha o mecanismo do
                movimento; energia acompanha o saldo das transformações. Uma
                abordagem mostra o que acontece em cada ponto. A outra mostra
                como o sistema troca energia entre estados.
              </p>

              <NoteBox title="Ponte mental para guardar" type="dark">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-black text-white mb-2">Newton</p>
                    <p>forças → aceleração → movimento</p>
                  </div>
                  <div>
                    <p className="font-black text-white mb-2">Energia</p>
                    <p>estado inicial → transformação → estado final</p>
                  </div>
                </div>
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Lightbulb}
              title="Trabalho: transferência de energia por uma força"
              accent="from-indigo-600 to-purple-700"
            >
              <p>
                No cotidiano, trabalho significa esforço, cansaço ou atividade.
                Em Física, trabalho é mais específico: é a transferência de
                energia feita por uma força ao longo de um deslocamento.
              </p>

              <FormulaBlock formula={String.raw`W = Fd\cos\theta`} />

              <p>
                O ângulo <InlineFormula formula={String.raw`\theta`} /> é o
                ângulo entre a força e o deslocamento. Não é necessariamente o
                ângulo com a horizontal. Essa confusão parece pequena, mas
                derruba mais gente do que deveria, o que infelizmente não
                surpreende ninguém.
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
                  Fazer força não basta.
                  <FormulaBlock formula={String.raw`W = 0`} />
                </NoteBox>
              </div>

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Trabalho não é esforço
              </h3>

              <p>
                Uma pessoa segurando uma caixa pesada parada se cansa. O corpo
                dela gasta energia internamente para manter os músculos
                contraídos. Mas, mecanicamente, se a caixa não se desloca, a
                força feita sobre a caixa não realiza trabalho sobre ela.
              </p>

              <FormulaBlock formula={String.raw`d = 0 \Rightarrow W = 0`} />

              <p>
                Um garçom carregando uma bandeja horizontalmente também ilustra
                bem isso. A força que sustenta a bandeja é vertical. O
                deslocamento é horizontal. Como força e deslocamento são
                perpendiculares:
              </p>

              <FormulaBlock
                formula={String.raw`W = Fd\cos90^\circ = 0`}
              />

              <p>
                Empurrar uma parede que não se move também não realiza trabalho
                mecânico sobre a parede. Sua dignidade talvez sofra trabalho
                negativo, mas a parede não.
              </p>

              <FormulaBlock
                formula={String.raw`1 \ \text{J} = 1 \ \text{N}\cdot\text{m}`}
              />

              <p>
                Trabalho e energia têm a mesma unidade porque trabalho é um modo
                de transferir energia.
              </p>
            </SectionCard>

            <SectionCard
              icon={Target}
              title="Trabalho específico e trabalho resultante"
              accent="from-cyan-700 to-blue-800"
            >
              <p>
                Uma confusão clássica é misturar o trabalho de uma força
                específica com o trabalho resultante. Essa diferença precisa
                ficar cristalina, porque o Teorema da Energia Cinética usa o
                trabalho resultante, não o trabalho de qualquer força aleatória
                escolhida pela ansiedade do aluno.
              </p>

              <div className="grid md:grid-cols-2 gap-5">
                <NoteBox title="Trabalho de uma força específica" type="info">
                  Analisa apenas uma força. Pode ser o trabalho do peso, do
                  atrito, da normal, da tração, da força aplicada ou da força
                  elástica.
                  <FormulaBlock formula={String.raw`W_F = Fd\cos\theta`} />
                </NoteBox>

                <NoteBox title="Trabalho resultante" type="success">
                  É a soma dos trabalhos de todas as forças que atuam sobre o
                  corpo.
                  <FormulaBlock
                    formula={String.raw`W_{\text{res}} = W_1 + W_2 + W_3 + \cdots`}
                  />
                </NoteBox>
              </div>

              <p>
                Imagine um bloco sendo puxado para a direita por uma força
                aplicada, enquanto o atrito atua para a esquerda. A força
                aplicada realiza trabalho positivo. O atrito realiza trabalho
                negativo. A normal e o peso podem realizar trabalho nulo se o
                deslocamento for horizontal.
              </p>

              <FormulaBlock
                formula={String.raw`W_{\text{res}} = W_{\text{aplicada}} + W_{\text{atrito}} + W_N + W_P`}
              />

              <p>Se:</p>

              <FormulaBlock formula={String.raw`W_N = 0`} />

              <FormulaBlock formula={String.raw`W_P = 0`} />

              <p>Então:</p>

              <FormulaBlock
                formula={String.raw`W_{\text{res}} = W_{\text{aplicada}} + W_{\text{atrito}}`}
              />

              <NoteBox title="Onde o aluno erra" type="danger">
                Se a questão pede variação da energia cinética, não basta pegar
                o trabalho da força aplicada e fingir que o atrito não existe.
                O certo é usar:
                <FormulaBlock
                  formula={String.raw`W_{\text{res}} = \Delta E_c`}
                />
                O trabalho resultante é o saldo energético de todas as forças.
              </NoteBox>
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
                O peso é uma força conservativa. Em um campo gravitacional
                uniforme, seu trabalho depende apenas da variação de altura, não
                do caminho percorrido.
              </p>

              <FormulaBlock formula={String.raw`W_P = mg(h_i - h_f)`} />

              <p>
                Se o corpo desce,{" "}
                <InlineFormula formula={String.raw`h_i > h_f`} />, então{" "}
                <InlineFormula formula={String.raw`W_P > 0`} />. O peso ajuda o
                movimento e a energia cinética pode aumentar.
              </p>

              <p>
                Se o corpo sobe,{" "}
                <InlineFormula formula={String.raw`h_f > h_i`} />, então{" "}
                <InlineFormula formula={String.raw`W_P < 0`} />. O peso se opõe
                ao movimento e a energia cinética pode diminuir.
              </p>

              <NoteBox
                title="Relação com energia potencial gravitacional"
                type="info"
              >
                A variação da energia potencial gravitacional é:
                <FormulaBlock
                  formula={String.raw`\Delta E_{p,g} = mg(h_f - h_i)`}
                />
                Portanto:
                <FormulaBlock
                  formula={String.raw`W_P = -\Delta E_{p,g}`}
                />
              </NoteBox>

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Trabalho da normal
              </h3>

              <p>
                Em muitos problemas básicos, a normal não realiza trabalho porque
                ela é perpendicular ao deslocamento. Um bloco deslizando sobre
                uma mesa horizontal tem deslocamento horizontal e normal
                vertical.
              </p>

              <FormulaBlock formula={String.raw`W_N = Nd\cos90^\circ = 0`} />

              <p>
                Mas isso não é uma lei universal. A normal pode realizar
                trabalho quando tem componente na direção do deslocamento do
                corpo ou do ponto de aplicação.
              </p>

              <NoteBox title="Exemplo importante" type="warning">
                Em um elevador subindo, a normal sobre a pessoa aponta para cima
                e a pessoa se desloca para cima. A normal pode realizar trabalho
                positivo. Se o elevador sobe com velocidade constante, o peso
                realiza trabalho negativo de mesmo módulo e a energia cinética
                não muda.
              </NoteBox>

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Trabalho do atrito
              </h3>

              <p>
                O atrito cinético geralmente realiza trabalho negativo, pois se
                opõe ao deslizamento relativo entre as superfícies.
              </p>

              <FormulaBlock formula={String.raw`W_{\text{at}} = -f_cd`} />

              <FormulaBlock formula={String.raw`f_c = \mu_c N`} />

              <FormulaBlock formula={String.raw`W_{\text{at}} = -\mu_c Nd`} />

              <p>Em uma superfície horizontal simples:</p>

              <FormulaBlock formula={String.raw`N = mg`} />

              <FormulaBlock
                formula={String.raw`W_{\text{at}} = -\mu_c mgd`}
              />

              <NoteBox title="Distância não é sempre deslocamento" type="danger">
                No trabalho do atrito cinético, o{" "}
                <InlineFormula formula={String.raw`d`} /> usado normalmente é a
                distância percorrida ao longo do contato com atrito. Se o corpo
                vai 5 m para frente e depois 5 m para trás, o deslocamento final
                pode ser zero, mas o atrito dissipou energia nos 10 m
                percorridos.
              </NoteBox>

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Trabalho da força elástica
              </h3>

              <p>A força elástica é variável. Para uma mola ideal:</p>

              <FormulaBlock formula={String.raw`F_e = kx`} />

              <p>Em forma orientada:</p>

              <FormulaBlock formula={String.raw`F_e = -kx`} />

              <p>
                O sinal negativo indica que a força elástica é restauradora. Ela
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
                Quando a mola relaxa, a força elástica pode realizar trabalho
                positivo sobre o bloco.
              </NoteBox>

              <p>Forma geral do trabalho da força elástica:</p>

              <FormulaBlock
                formula={String.raw`W_{\text{el}} = \frac{1}{2}kx_i^2 - \frac{1}{2}kx_f^2`}
              />
            </SectionCard>

            <SectionCard
              icon={Zap}
              title="Energia cinética, energia potencial e energia mecânica"
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
                velocidade quadruplica a energia cinética.
              </p>

              <FormulaBlock
                formula={String.raw`v' = 2v \Rightarrow E_c' = 4E_c`}
              />

              <p>
                É por isso que frenagem, acidentes e distância de parada ficam
                muito mais sérios em altas velocidades. A natureza cobra no
                quadrado, sem parcelamento e sem SAC.
              </p>

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Teorema da Energia Cinética
              </h3>

              <FormulaBlock formula={String.raw`W_{\text{res}} = \Delta E_c`} />

              <p>
                O trabalho resultante é igual à variação da energia cinética. Se
                o trabalho resultante é positivo, a energia cinética aumenta. Se
                é negativo, diminui. Se é nulo, a energia cinética permanece
                constante.
              </p>

              <p>Demonstração para força resultante constante em uma dimensão:</p>

              <FormulaBlock formula={String.raw`F_{\text{res}} = ma`} />

              <FormulaBlock formula={String.raw`F_{\text{res}}d = mad`} />

              <p>Usando a equação:</p>

              <FormulaBlock formula={String.raw`v_f^2 = v_i^2 + 2ad`} />

              <FormulaBlock
                formula={String.raw`ad = \frac{v_f^2 - v_i^2}{2}`}
              />

              <p>Substituindo:</p>

              <FormulaBlock
                formula={String.raw`W_{\text{res}} = m\frac{v_f^2 - v_i^2}{2}`}
              />

              <FormulaBlock
                formula={String.raw`W_{\text{res}} = \frac{1}{2}mv_f^2 - \frac{1}{2}mv_i^2`}
              />

              <FormulaBlock formula={String.raw`W_{\text{res}} = \Delta E_c`} />

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Energia potencial gravitacional
              </h3>

              <FormulaBlock formula={String.raw`E_{p,g} = mgh`} />

              <p>
                A energia potencial gravitacional depende do nível de referência
                escolhido. Você pode escolher o chão, uma mesa ou outro ponto
                como altura zero. O valor absoluto muda, mas a variação de
                energia potencial é o que interessa fisicamente.
              </p>

              <FormulaBlock
                formula={String.raw`\Delta E_{p,g} = mg(h_f - h_i)`}
              />

              <NoteBox title="Referência não é enfeite" type="info">
                Se um livro está 2 m acima do chão, sua energia potencial em
                relação ao chão é{" "}
                <InlineFormula formula={String.raw`mg\cdot2`} />. Se você
                escolher uma mesa de 1 m como referência, a altura em relação à
                mesa será 1 m. O valor da energia potencial muda, mas a variação
                entre dois pontos continua representando o trabalho do peso.
              </NoteBox>

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Energia potencial elástica
              </h3>

              <FormulaBlock formula={String.raw`E_{p,e} = \frac{1}{2}kx^2`} />

              <p>
                A mola comprimida e a mola esticada armazenam energia. Na
                posição natural, se adotada como referência,{" "}
                <InlineFormula formula={String.raw`x = 0`} /> e a energia
                potencial elástica é nula.
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
              title="Conservação, dissipação e energia total"
              accent="from-blue-700 to-indigo-800"
            >
              <p>
                A energia mecânica se conserva quando apenas forças
                conservativas realizam trabalho. Peso e força elástica são os
                principais exemplos na Mecânica básica.
              </p>

              <FormulaBlock formula={String.raw`E_{m,i} = E_{m,f}`} />

              <p>Ou:</p>

              <FormulaBlock
                formula={String.raw`E_{c,i} + E_{p,i} = E_{c,f} + E_{p,f}`}
              />

              <NoteBox title="Conservação não significa tudo constante" type="info">
                Em uma queda livre sem resistência do ar, a energia potencial
                gravitacional diminui e a energia cinética aumenta. Nenhuma das
                duas se conserva isoladamente. A soma se conserva.
              </NoteBox>

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Energia mecânica não é energia total
              </h3>

              <p>
                Quando há atrito, costuma-se dizer que “perdeu energia”. Essa
                frase é perigosa. O que se perde é energia mecânica, não energia
                total. A energia total não desaparece; ela é transformada em
                energia térmica, som, deformações microscópicas e energia
                interna das superfícies.
              </p>

              <div className="grid md:grid-cols-2 gap-5">
                <NoteBox title="Energia mecânica" type="warning">
                  É a soma das energias associadas ao movimento, posição e
                  configuração mecânica do sistema.
                  <FormulaBlock formula={String.raw`E_m = E_c + E_p`} />
                </NoteBox>

                <NoteBox title="Energia total" type="success">
                  Inclui todas as formas de energia, inclusive energia térmica,
                  energia interna, som e deformações microscópicas.
                </NoteBox>
              </div>

              <p>
                Quando forças não conservativas realizam trabalho, a energia
                mecânica varia.
              </p>

              <FormulaBlock
                formula={String.raw`W_{\text{nc}} = \Delta E_m`}
              />

              <p>De modo explícito:</p>

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
                energia mecânica final fica menor:
                <FormulaBlock formula={String.raw`E_{m,f} < E_{m,i}`} />
                Também podemos escrever:
                <FormulaBlock
                  formula={String.raw`E_{m,i} = E_{m,f} + E_{\text{dissipada}}`}
                />
              </NoteBox>

              <p>Para atrito cinético:</p>

              <FormulaBlock
                formula={String.raw`E_{\text{dissipada}} = f_cd`}
              />

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Receitas seguras
              </h3>

              <div className="grid md:grid-cols-3 gap-5">
                <NoteBox title="Sem atrito" type="success">
                  Se só há forças conservativas:
                  <FormulaBlock formula={String.raw`E_{m,i} = E_{m,f}`} />
                </NoteBox>

                <NoteBox title="Com atrito" type="warning">
                  Se há dissipação:
                  <FormulaBlock
                    formula={String.raw`E_{m,i} + W_{\text{at}} = E_{m,f}`}
                  />
                </NoteBox>

                <NoteBox title="Com força externa" type="info">
                  Se uma força externa injeta ou retira energia:
                  <FormulaBlock
                    formula={String.raw`E_{m,i} + W_{\text{ext}} + W_{\text{nc}} = E_{m,f}`}
                  />
                </NoteBox>
              </div>
            </SectionCard>

            <SectionCard
              icon={Brain}
              title="Escolha do sistema físico"
              accent="from-slate-800 to-slate-950"
            >
              <p>
                Energia não vive solta no universo como se fosse uma moeda
                mágica. Quando você usa conservação de energia, precisa pensar
                qual sistema está analisando. Essa parte é mais avançada, mas
                deixa a explicação mais honesta e evita vários erros em questões
                difíceis.
              </p>

              <p>
                Se você analisa apenas o bloco, o peso é uma força externa
                exercida pela Terra sobre ele. Se você analisa o sistema
                bloco-Terra, a energia potencial gravitacional pertence ao
                sistema.
              </p>

              <p>
                Se você analisa apenas o bloco colidindo com uma mola, a força
                elástica é externa ao bloco. Se você analisa o sistema
                bloco-mola, a energia potencial elástica pertence ao sistema.
              </p>

              <div className="grid md:grid-cols-2 gap-5">
                <NoteBox title="Sistema bloco-Terra" type="info">
                  Permite usar energia potencial gravitacional:
                  <FormulaBlock formula={String.raw`E_{p,g} = mgh`} />
                </NoteBox>

                <NoteBox title="Sistema bloco-mola" type="success">
                  Permite usar energia potencial elástica:
                  <FormulaBlock formula={String.raw`E_{p,e} = \frac{1}{2}kx^2`} />
                </NoteBox>
              </div>

              <NoteBox title="Regra prática" type="dark">
                Antes de aplicar conservação de energia, pergunte: o sistema
                inclui os corpos que armazenam energia potencial? Se a resposta
                for sim, você pode tratar essa energia como parte da energia
                mecânica do sistema. Se não, ela aparece como trabalho de uma
                força externa.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={BarChart3}
              title="Gráficos, força variável e interpretação avançada"
              accent="from-violet-700 to-fuchsia-800"
            >
              <h3 className="text-xl font-black text-slate-950">
                Gráfico força versus deslocamento
              </h3>

              <p>
                A fórmula <InlineFormula formula={String.raw`W = Fd`} /> só vale
                diretamente quando a força é constante e paralela ao
                deslocamento. Mas muitas forças variam com a posição. A força
                elástica é o exemplo mais famoso.
              </p>

              <p>
                Quando a força muda, não faz sentido escolher um único valor de
                força para o deslocamento inteiro. A ideia é quebrar o caminho
                em pedaços muito pequenos. Em cada pedacinho, a força quase não
                muda. Calculamos o pequeno trabalho e depois somamos tudo.
              </p>

              <FormulaBlock formula={String.raw`dW = F(x)\,dx`} />

              <FormulaBlock
                formula={String.raw`W = \int_{x_i}^{x_f} F(x)\,dx`}
              />

              <p>
                No gráfico <InlineFormula formula={String.raw`F \times x`} />,
                essa integral é a área sob a curva. Área acima do eixo gera
                trabalho positivo. Área abaixo gera trabalho negativo.
              </p>

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Gráfico energia potencial versus posição
              </h3>

              <p>
                Para forças conservativas em uma dimensão, existe uma relação
                entre força e energia potencial:
              </p>

              <FormulaBlock formula={String.raw`F = -\frac{dU}{dx}`} />

              <p>
                A ideia física é que a força aponta no sentido em que a energia
                potencial diminui mais rapidamente. O sinal negativo indica isso.
                A mola, por exemplo, sempre tenta voltar para a posição em que a
                energia potencial elástica é mínima.
              </p>

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Energia é escalar
              </h3>

              <p>
                Energia geralmente fornece módulo de velocidade, altura,
                distância, compressão ou variação de energia. Ela não entrega
                automaticamente a direção vetorial do movimento.
              </p>

              <NoteBox title="Exemplo de prova" type="warning">
                Em um looping, energia pode achar a velocidade no topo. Mas para
                achar normal, tração ou força de contato, você precisa voltar
                para Newton:
                <FormulaBlock
                  formula={String.raw`\sum F_c = m\frac{v^2}{R}`}
                />
              </NoteBox>

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Trabalho resultante zero com força real
              </h3>

              <p>
                No movimento circular uniforme, existe força centrípeta e existe
                aceleração centrípeta. Mas a força centrípeta é perpendicular ao
                deslocamento instantâneo.
              </p>

              <FormulaBlock formula={String.raw`W_c = 0`} />

              <p>
                Ela muda a direção da velocidade, mas não muda o módulo da
                velocidade. Por isso, a energia cinética permanece constante.
              </p>
            </SectionCard>

            <SectionCard
              icon={Gauge}
              title="Potência: rapidez da transferência de energia"
              accent="from-amber-600 to-orange-700"
            >
              <p>
                Trabalho mede quanta energia foi transferida. Potência mede quão
                rápido essa transferência aconteceu. Essa diferença é simples,
                mas muito importante.
              </p>

              <p>
                Imagine duas pessoas levantando a mesma caixa até a mesma altura.
                As duas aumentam a energia potencial gravitacional da caixa pela
                mesma quantidade. Mas, se uma faz isso em menos tempo, ela
                desenvolve maior potência.
              </p>

              <FormulaBlock formula={String.raw`P = \frac{W}{\Delta t}`} />

              <p>Como trabalho é transferência de energia, também podemos escrever:</p>

              <FormulaBlock formula={String.raw`P = \frac{\Delta E}{\Delta t}`} />

              <p>
                A unidade de potência no Sistema Internacional é o watt:
              </p>

              <FormulaBlock formula={String.raw`1 \ \text{W} = 1 \ \frac{\text{J}}{\text{s}}`} />

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Potência instantânea em movimento retilíneo
              </h3>

              <p>
                Se uma força atua na mesma direção da velocidade, podemos usar:
              </p>

              <FormulaBlock formula={String.raw`P = Fv`} />

              <p>
                De forma mais geral, quando existe ângulo entre força e
                velocidade:
              </p>

              <FormulaBlock formula={String.raw`P = Fv\cos\theta`} />

              <p>
                Isso aparece muito em problemas de motores, carros, elevadores,
                esteiras, bombas d'água e rendimento. Quando o enunciado falar
                em “por segundo”, “taxa”, “rapidez de realização de trabalho” ou
                “potência”, a cabeça deve acender essa luz.
              </p>

              <NoteBox title="Rendimento" type="info">
                Rendimento mede a fração da energia ou potência que virou efeito
                útil.
                <FormulaBlock
                  formula={String.raw`\eta = \frac{E_{\text{útil}}}{E_{\text{total}}}`}
                />
                Ou:
                <FormulaBlock
                  formula={String.raw`\eta = \frac{P_{\text{útil}}}{P_{\text{total}}}`}
                />
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Brain}
              title="O que energia responde e onde ela engana o aluno"
              accent="from-slate-800 to-black"
            >
              <div className="grid md:grid-cols-2 gap-5">
                <NoteBox title="Energia é excelente para achar..." type="dark">
                  <BulletList
                    items={[
                      "velocidade em determinado ponto;",
                      "altura máxima ou mínima;",
                      "compressão máxima de mola;",
                      "distância até parar;",
                      "energia dissipada por atrito;",
                      "variação de energia cinética;",
                      "comparação entre estado inicial e final.",
                    ]}
                  />
                </NoteBox>

                <NoteBox title="Energia não costuma dar diretamente..." type="dark">
                  <BulletList
                    items={[
                      "normal;",
                      "tração;",
                      "força de contato;",
                      "direção vetorial da velocidade;",
                      "aceleração instantânea;",
                      "detalhes do movimento ponto a ponto;",
                      "forças internas de sistemas com vínculos.",
                    ]}
                  />
                </NoteBox>
              </div>

              <p>
                A regra prática é simples: energia é ótima para velocidade,
                altura, distância e deformação. Newton é melhor para força,
                aceleração instantânea e vínculo. O aluno forte não casa com uma
                fórmula; ele escolhe a ferramenta certa. Parece pouco, mas já
                coloca a pessoa acima da média, o que diz muito sobre a média.
              </p>

              <h3 className="text-xl font-black text-slate-950 pt-4">
                Quando energia engana
              </h3>

              <div className="grid md:grid-cols-2 gap-5">
                <NoteBox title="Energia pode dar velocidade, mas não força" type="warning">
                  Em um looping, energia acha a velocidade. A normal exige
                  dinâmica centrípeta:
                  <FormulaBlock
                    formula={String.raw`\sum F_c = m\frac{v^2}{R}`}
                  />
                </NoteBox>

                <NoteBox title="Energia pode dar altura, mas não tempo" type="warning">
                  Se a questão pede tempo de subida ou tempo de queda, energia
                  sozinha normalmente não basta. Aí entra Cinemática.
                </NoteBox>

                <NoteBox title="Energia pode dar compressão, mas não aceleração" type="warning">
                  Em uma mola, energia acha a compressão máxima. Mas a aceleração
                  instantânea depende da força elástica:
                  <FormulaBlock formula={String.raw`F = kx`} />
                </NoteBox>

                <NoteBox title="Energia mostra o saldo, não o filme inteiro" type="warning">
                  Energia compara estados. Ela não descreve necessariamente o
                  movimento completo entre eles.
                </NoteBox>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === "exemplos" && (
          <div className="space-y-6">
            <CompactTabHeader
              icon={Calculator}
              eyebrow="Treino guiado"
              title="Exemplos resolvidos"
              description="Aqui a ideia é aplicar trabalho, energia cinética, energia potencial, conservação, dissipação e gráficos em situações reais de prova. Clique em cada exemplo para abrir a resolução completa."
              accent="from-slate-950 via-slate-900 to-indigo-950"
            />

            {examples.map((example) => (
              <ExampleAccordion key={example.id} example={example} />
            ))}
          </div>
        )}

        {activeTab === "resumo" && (
          <div className="space-y-10">
            <CompactTabHeader
              icon={Target}
              eyebrow="Revisão estratégica"
              title="Resumo de Trabalho e Energia"
              description="Um fechamento organizado com fórmulas, armadilhas e roteiro de prova. A ideia é revisar rápido sem transformar o cérebro em sopa de símbolos."
              accent="from-slate-950 via-slate-900 to-emerald-950"
            />

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
                    title: "Trabalho resultante",
                    formula: String.raw`W_{\text{res}} = W_1 + W_2 + W_3 + \cdots`,
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
                  {
                    title: "Potência em movimento retilíneo",
                    formula: String.raw`P = Fv\cos\theta`,
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
                  "Falar que energia foi perdida, quando o correto é energia mecânica foi transformada.",
                  "Esquecer que atrito usa distância percorrida, não só deslocamento vetorial.",
                  "Errar o sinal do trabalho da força elástica.",
                  "Esquecer que energia cinética depende de v².",
                  "Usar energia para achar tração ou normal sem Newton.",
                  "Não definir corretamente o sistema físico analisado.",
                  "Não separar energia dissipada de energia mecânica final.",
                  "Confundir potência com trabalho total.",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl bg-red-50 border border-red-200 p-4 text-red-950"
                  >
                    <p className="font-bold text-sm leading-6">{item}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              icon={Target}
              title="Roteiro de resolução em prova"
              accent="from-indigo-700 to-purple-800"
            >
              <p>
                Para resolver uma questão de Trabalho e Energia, siga esta
                sequência:
              </p>

              <ol className="space-y-3">
                {[
                  "Identifique o estado inicial e o estado final.",
                  "Defina qual sistema físico está sendo analisado.",
                  "Veja se existe altura: pode haver energia potencial gravitacional.",
                  "Veja se existe velocidade: há energia cinética.",
                  "Veja se existe mola deformada: há energia potencial elástica.",
                  "Verifique se há atrito ou força dissipativa.",
                  "Veja se alguma força externa realiza trabalho.",
                  "Diferencie trabalho específico e trabalho resultante.",
                  "Decida se a energia mecânica se conserva.",
                  "Se conservar, use Em,i = Em,f.",
                  "Se não conservar, use Em,i + Wnc = Em,f.",
                  "Se o foco for apenas variação de velocidade pelo trabalho total, use Wres = ΔEc.",
                  "Se aparecer potência, procure tempo, taxa de energia ou P = Fv cosθ.",
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

Agora ficou mais parrudo. Se der erro de import do Gauge, troca Gauge por Zap no import e no card de potência, porque dependendo da versão do lucide-react, às vezes o ícone resolve fazer greve, aparentemente inspirado por bibliotecas JavaScript em geral.
