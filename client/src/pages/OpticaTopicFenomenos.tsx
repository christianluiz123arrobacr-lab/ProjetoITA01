import { useMemo, useState, type ElementType } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Brain,
  Calculator,
  CheckCircle2,
  Eye,
  Lightbulb,
  Rainbow,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Waves,
  Zap,
} from "lucide-react";
import { Link } from "wouter";

import { MathFormula } from "@/components/MathFormula";

type Tab = "teoria" | "exemplos" | "resumo";
type NoteType = "info" | "warning" | "success";
type DiagramKind = "reflectionRefraction" | "totalReflection" | "prismDispersion" | "apparentDepth" | "mirage";

type FormulaSummary = {
  title: string;
  formula: string;
  description: string;
  terms: string[];
  interpretation: string[];
  warning?: string;
};

type TheorySection = {
  id: number;
  icon: ElementType;
  title: string;
  accent: string;
  paragraphs: string[];
  bullets?: string[];
  formulas?: FormulaSummary[];
  diagram?: {
    kind: DiagramKind;
    title: string;
    caption: string;
  };
  notes?: {
    title: string;
    type: NoteType;
    body: string;
  }[];
};

type ExampleItem = {
  title: string;
  level: string;
  statement: string;
  idea: string;
  steps: string[];
  answer: string;
  test: string;
};

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "teoria", label: "Teoria" },
  { id: "exemplos", label: "Exemplos" },
  { id: "resumo", label: "Resumo" },
];

const formulas: FormulaSummary[] = [
  {
    title: "Lei da reflexão",
    formula: String.raw`i=r`,
    description:
      "Na reflexão, o ângulo de incidência é igual ao ângulo de reflexão. Ambos são medidos em relação à normal.",
    terms: [
      "i: ângulo entre o raio incidente e a normal.",
      "r: ângulo entre o raio refletido e a normal.",
      "normal: reta perpendicular à superfície no ponto de incidência.",
    ],
    interpretation: [
      "A reflexão é simétrica em relação à normal.",
      "Medir o ângulo pela superfície é um dos erros mais comuns.",
    ],
  },
  {
    title: "Índice de refração",
    formula: String.raw`n=\frac{c}{v}`,
    description:
      "O índice de refração mede quantas vezes a luz é mais rápida no vácuo do que no meio considerado.",
    terms: [
      "n: índice de refração absoluto.",
      "c: velocidade da luz no vácuo.",
      "v: velocidade da luz no meio.",
    ],
    interpretation: [
      "Quanto maior n, menor a velocidade da luz no meio.",
      "Meio mais refringente significa, em geral, meio de maior índice.",
    ],
  },
  {
    title: "Lei de Snell-Descartes",
    formula: String.raw`n_1\sin i=n_2\sin r`,
    description:
      "Relaciona os índices de refração dos meios com os ângulos de incidência e refração.",
    terms: [
      "n₁: índice do meio de incidência.",
      "n₂: índice do meio para onde a luz passa.",
      "i: ângulo de incidência, medido pela normal.",
      "r: ângulo de refração, medido pela normal.",
    ],
    interpretation: [
      "Se n₂ > n₁, o raio aproxima-se da normal.",
      "Se n₂ < n₁, o raio afasta-se da normal.",
      "Se i = 0°, há mudança de velocidade, mas não há desvio angular.",
    ],
    warning:
      "Snell só funciona corretamente se os ângulos forem medidos em relação à normal. A superfície não é referência de ângulo.",
  },
  {
    title: "Ângulo limite",
    formula: String.raw`\sin L=\frac{n_2}{n_1}`,
    description:
      "Usado quando a luz tenta passar de um meio mais refringente para outro menos refringente.",
    terms: [
      "L: ângulo limite.",
      "n₁: índice do meio de onde a luz vem.",
      "n₂: índice do meio para onde a luz tentaria passar.",
    ],
    interpretation: [
      "Só existe se n₁ > n₂.",
      "No ângulo limite, o raio refratado sairia rasante à interface.",
      "Para incidência maior que L, ocorre reflexão total.",
    ],
    warning:
      "Se n₁ ≤ n₂, não há ângulo limite para essa passagem. Não invente reflexão total onde ela não pode existir.",
  },
  {
    title: "Profundidade aparente",
    formula: String.raw`h_{\text{ap}}\approx \frac{h}{n}`,
    description:
      "Aproximação para observação quase normal de um objeto submerso visto do ar.",
    terms: [
      "h_ap: profundidade aparente.",
      "h: profundidade real.",
      "n: índice de refração do líquido em relação ao ar.",
    ],
    interpretation: [
      "Objetos submersos parecem mais rasos do que realmente estão.",
      "É uma consequência da refração dos raios ao sair da água.",
    ],
  },
  {
    title: "Desvio lateral em lâmina",
    formula: String.raw`d=e\frac{\sin(i-r)}{\cos r}`,
    description:
      "Deslocamento lateral de um raio ao atravessar uma lâmina de faces paralelas.",
    terms: [
      "d: desvio lateral.",
      "e: espessura da lâmina.",
      "i: ângulo de incidência.",
      "r: ângulo de refração dentro da lâmina.",
    ],
    interpretation: [
      "O raio emergente sai paralelo ao incidente.",
      "Apesar de sair paralelo, ele é deslocado lateralmente.",
    ],
  },
];

const theorySections: TheorySection[] = [
  {
    id: 1,
    icon: BookOpen,
    title: "O que são fenômenos ópticos",
    accent: "bg-purple-700",
    paragraphs: [
      "Fenômenos ópticos são efeitos observáveis ligados à propagação, reflexão, refração, dispersão e desvio da luz em diferentes meios. Esta página fica entre os fundamentos da Óptica e os sistemas de imagem: ela pega as leis básicas e mostra onde elas aparecem no mundo real.",
      "Aqui entram reflexão regular e difusa, refração, índice de refração, Lei de Snell-Descartes, profundidade aparente, lâminas de faces paralelas, prismas, dispersão, reflexão total, fibras ópticas, arco-íris e miragens.",
      "A ideia central é simples: a luz muda de comportamento quando encontra superfícies, interfaces ou meios com índices diferentes. A parte difícil, claro, é a prova transformar isso em desenho torto com ângulo escondido, porque a civilização aparentemente achou isso necessário.",
    ],
    notes: [
      {
        title: "Papel desta página",
        type: "success",
        body: "Esta página aprofunda os fenômenos geométricos antes de lentes, espelhos esféricos e Óptica Física. Ela é o elo entre fundamentos e aplicações.",
      },
    ],
  },
  {
    id: 2,
    icon: Eye,
    title: "Reflexão regular e difusa",
    accent: "bg-slate-950",
    paragraphs: [
      "Reflexão é o retorno da luz ao meio de origem após atingir uma superfície. A lei da reflexão afirma que o ângulo de incidência é igual ao ângulo de reflexão, sempre medidos em relação à normal.",
      "Na reflexão regular, uma superfície muito lisa reflete raios paralelos de forma organizada. É o caso ideal de espelhos planos. Na reflexão difusa, uma superfície irregular espalha os raios em várias direções. É por isso que conseguimos ver uma parede, uma folha de papel ou uma mesa a partir de muitos ângulos.",
      "Reflexão difusa não significa ausência de lei da reflexão. Cada ponto microscópico da superfície ainda obedece i = r. O que muda é que as normais locais variam, espalhando os raios refletidos.",
    ],
    formulas: [formulas[0]],
    bullets: [
      "Reflexão regular: superfície lisa, raios refletidos organizados.",
      "Reflexão difusa: superfície irregular, raios espalhados.",
      "A visão cotidiana de objetos depende muito da reflexão difusa.",
      "Em cada ponto da superfície, a lei i = r continua valendo.",
    ],
  },
  {
    id: 3,
    icon: Waves,
    title: "Refração e índice de refração",
    accent: "bg-blue-700",
    paragraphs: [
      "Refração é a passagem da luz de um meio para outro com mudança de velocidade. Quando a incidência não é perpendicular à interface, essa mudança de velocidade geralmente vem acompanhada de mudança de direção.",
      "O índice de refração mede o quanto a luz fica mais lenta em um meio em comparação com o vácuo. Quanto maior o índice, menor a velocidade da luz no meio. Vidro, água, ar e outros meios desviam a luz de formas diferentes justamente por terem índices diferentes.",
      "A frequência da luz não muda na passagem de um meio para outro. Quem muda é a velocidade e, junto dela, o comprimento de onda. Esse detalhe conecta fenômenos ópticos com o que a gente já estudou em fundamentos e também prepara terreno para dispersão.",
    ],
    formulas: [formulas[1], formulas[2]],
    diagram: {
      kind: "reflectionRefraction",
      title: "reflexão e refração",
      caption:
        "Na interface entre dois meios, parte da luz pode refletir e parte pode refratar.",
    },
    notes: [
      {
        title: "Como prever o desvio",
        type: "info",
        body: "Entrou em meio de maior índice: aproxima da normal. Entrou em meio de menor índice: afasta da normal.",
      },
    ],
  },
  {
    id: 4,
    icon: Calculator,
    title: "Lei de Snell-Descartes na prática",
    accent: "bg-cyan-700",
    paragraphs: [
      "A Lei de Snell-Descartes é a principal ferramenta matemática para refração. Ela relaciona os índices dos meios com os senos dos ângulos medidos em relação à normal.",
      "Mas a fórmula sozinha não resolve o problema. Antes de substituir valores, é preciso identificar o meio de incidência, o meio de refração, a normal, o ângulo dado e o sentido esperado do desvio.",
      "Em prova, uma boa resolução começa desenhando a normal e fazendo uma previsão qualitativa. Se a conta disser que o raio afastou da normal ao entrar em um meio de maior índice, alguém mentiu. Normalmente foi você com o sinal ou com o ângulo, uma tradição triste.",
    ],
    formulas: [formulas[2]],
    bullets: [
      "Identifique meio 1 e meio 2.",
      "Desenhe a normal.",
      "Verifique se o ângulo dado foi medido pela normal ou pela superfície.",
      "Preveja se o raio aproxima ou afasta da normal.",
      "Só depois aplique Snell.",
    ],
  },
  {
    id: 5,
    icon: Eye,
    title: "Profundidade aparente",
    accent: "bg-indigo-800",
    paragraphs: [
      "Quando olhamos um objeto no fundo de uma piscina, ele parece mais próximo da superfície do que realmente está. Isso acontece porque os raios vindos do objeto refratam ao sair da água para o ar e chegam ao olho com uma direção diferente.",
      "O observador prolonga mentalmente os raios em linha reta, como se eles tivessem vindo de uma posição mais rasa. Essa posição é a imagem aparente do objeto.",
      "Para observação quase normal, uma aproximação útil é h_ap ≈ h/n, quando o objeto está em um líquido de índice n e é observado do ar. Essa expressão não é uma lei universal para qualquer ângulo, mas captura bem a ideia física mais cobrada.",
    ],
    formulas: [formulas[4]],
    diagram: {
      kind: "apparentDepth",
      title: "profundidade aparente",
      caption:
        "O prolongamento dos raios refratados faz o objeto parecer mais raso.",
    },
    notes: [
      {
        title: "Armadilha clássica",
        type: "warning",
        body: "O objeto não subiu. A imagem aparente é que aparece mais próxima da superfície por causa da refração.",
      },
    ],
  },
  {
    id: 6,
    icon: Target,
    title: "Lâmina de faces paralelas",
    accent: "bg-emerald-700",
    paragraphs: [
      "Uma lâmina de faces paralelas é um bloco transparente com duas faces planas e paralelas. Quando um raio entra obliquamente, ele sofre refração na primeira face, percorre a lâmina e sofre nova refração ao sair.",
      "Como as faces são paralelas, o raio emergente sai paralelo ao raio incidente. Porém, ele não sai no mesmo alinhamento: aparece deslocado lateralmente.",
      "Esse fenômeno é importante porque mostra que nem toda refração muda a direção final do raio. Às vezes, a direção final é a mesma, mas a trajetória foi deslocada.",
    ],
    formulas: [formulas[5]],
    notes: [
      {
        title: "Resumo mental",
        type: "success",
        body: "Lâmina de faces paralelas não muda a direção final do raio; ela provoca desvio lateral.",
      },
    ],
  },
  {
    id: 7,
    icon: Zap,
    title: "Ângulo limite e reflexão total",
    accent: "bg-red-700",
    paragraphs: [
      "Reflexão total ocorre quando a luz, tentando passar de um meio mais refringente para outro menos refringente, não consegue emergir e retorna completamente ao meio original.",
      "À medida que o ângulo de incidência aumenta, o raio refratado se afasta da normal. No ângulo limite, ele sairia rasante à superfície, com ângulo de refração igual a 90°. Para incidências maiores, não há raio refratado: ocorre reflexão total.",
      "Esse fenômeno exige duas condições: a luz deve ir do meio de maior índice para o meio de menor índice, e o ângulo de incidência deve ser maior que o ângulo limite.",
    ],
    formulas: [formulas[3]],
    diagram: {
      kind: "totalReflection",
      title: "reflexão total",
      caption:
        "Acima do ângulo limite, o raio não emerge: ele reflete totalmente.",
    },
    bullets: [
      "Só ocorre de maior índice para menor índice.",
      "No ângulo limite, o raio refratado é rasante.",
      "Para i > L, ocorre reflexão total.",
      "Aplicações: fibra óptica, prismas, miragens e brilho de diamantes.",
    ],
  },
  {
    id: 8,
    icon: Rainbow,
    title: "Dispersão da luz e prismas",
    accent: "bg-orange-700",
    paragraphs: [
      "Dispersão é a separação da luz em diferentes cores por causa da dependência do índice de refração com o comprimento de onda. Em muitos materiais, cores diferentes têm velocidades diferentes e, por isso, sofrem desvios diferentes.",
      "Um prisma evidencia esse efeito: a luz branca entra, sofre refração na primeira face, atravessa o vidro e refrata novamente ao sair. Como cada cor desvia de forma ligeiramente diferente, o feixe emergente se abre em um espectro.",
      "O violeta costuma sofrer maior desvio que o vermelho em prismas comuns, porque em geral apresenta maior índice de refração no material. Isso não significa que a frequência mudou; significa que cada frequência propagou-se com velocidade diferente no meio.",
    ],
    diagram: {
      kind: "prismDispersion",
      title: "dispersão em prisma",
      caption:
        "A luz branca se separa porque diferentes comprimentos de onda sofrem desvios diferentes.",
    },
    notes: [
      {
        title: "Ponto essencial",
        type: "info",
        body: "Dispersão não é mudança de frequência. É separação de frequências que já existiam na luz branca.",
      },
    ],
  },
  {
    id: 9,
    icon: Sun,
    title: "Arco-íris",
    accent: "bg-blue-800",
    paragraphs: [
      "O arco-íris é uma aplicação natural de refração, dispersão e reflexão interna em gotículas de água. A luz solar entra na gota, refrata, dispersa, reflete internamente e refrata novamente ao sair.",
      "Cada cor emerge em ângulos ligeiramente diferentes. Por isso, o observador vê uma separação angular das cores no céu.",
      "O arco-íris não está em uma posição fixa no espaço como um objeto material. Ele depende da posição do Sol, das gotas de água e do observador. Mudar de observador muda o conjunto de gotas que contribui para a imagem observada.",
    ],
    bullets: [
      "Entrada na gota: refração e dispersão.",
      "Dentro da gota: reflexão interna.",
      "Saída da gota: nova refração.",
      "Cores aparecem em ângulos diferentes para o observador.",
    ],
  },
  {
    id: 10,
    icon: Waves,
    title: "Miragens",
    accent: "bg-slate-950",
    paragraphs: [
      "Miragens ocorrem quando a luz atravessa camadas de ar com diferentes temperaturas e, portanto, diferentes índices de refração. Como o índice muda gradualmente, o raio luminoso se curva aos poucos.",
      "Em dias muito quentes, o ar próximo ao solo pode ficar mais quente e menos refringente que o ar acima. Raios vindos do céu podem se curvar e chegar aos olhos como se tivessem vindo do chão. O cérebro interpreta isso como uma imagem semelhante a água no asfalto.",
      "A miragem não é alucinação. É uma imagem óptica real no sentido de ser causada por raios luminosos seguindo trajetórias curvas em um meio não homogêneo. A interpretação errada é nossa, porque o cérebro insiste em prolongar os raios como se tivessem vindo em linha reta.",
    ],
    diagram: {
      kind: "mirage",
      title: "miragem",
      caption:
        "Gradientes de índice curvam os raios e criam imagens aparentes.",
    },
    notes: [
      {
        title: "Ideia central",
        type: "success",
        body: "Miragem é refração em meio não homogêneo, não imaginação do observador.",
      },
    ],
  },
  {
    id: 11,
    icon: Brain,
    title: "Como resolver questões de fenômenos ópticos",
    accent: "bg-purple-700",
    paragraphs: [
      "Questões de fenômenos ópticos costumam misturar desenho, interpretação e fórmula. O erro mais comum é tentar aplicar Snell ou ângulo limite sem entender o caminho da luz.",
      "O método seguro começa pelo desenho: trace a interface, marque a normal, identifique os meios, preveja o sentido do desvio e só depois aplique a fórmula.",
      "Em problemas com prismas, arco-íris ou dispersão, lembre que cores diferentes têm índices diferentes. Em problemas de reflexão total, verifique primeiro se a luz está indo do meio mais refringente para o menos refringente.",
    ],
    bullets: [
      "Desenhe a interface e a normal.",
      "Identifique os índices dos meios.",
      "Preveja se o raio aproxima ou afasta da normal.",
      "Veja se há condição para reflexão total.",
      "Em prismas e arco-íris, analise dispersão.",
      "Em miragens, pense em índice variando gradualmente.",
    ],
  },
];

const examples: ExampleItem[] = [
  {
    title: "Refração do ar para a água",
    level: "básico",
    statement:
      "Um raio passa do ar para a água com ângulo de incidência de 30°. Considere n_ar = 1 e n_água = 4/3. Determine sen r.",
    idea:
      "Como a luz entra em meio de maior índice, o raio deve aproximar-se da normal. Logo, esperamos r menor que 30°.",
    steps: [
      "Use Snell: n₁ sen i = n₂ sen r.",
      "Substitua: 1 · sen30° = (4/3) sen r.",
      "Como sen30° = 1/2, temos 1/2 = (4/3) sen r.",
      "Logo, sen r = 3/8.",
    ],
    answer:
      "sen r = 3/8. O raio aproxima-se da normal, como previsto.",
    test:
      "A questão queria testar Snell e previsão qualitativa do desvio.",
  },
  {
    title: "Ângulo limite água-ar",
    level: "intermediário",
    statement:
      "Determine o seno do ângulo limite para luz passando da água para o ar. Use n_água = 4/3 e n_ar = 1.",
    idea:
      "Reflexão total pode ocorrer porque a luz tenta sair de meio mais refringente para menos refringente.",
    steps: [
      "Use sen L = n₂/n₁.",
      "Aqui, n₁ = 4/3 e n₂ = 1.",
      "sen L = 1/(4/3).",
      "sen L = 3/4.",
    ],
    answer:
      "O seno do ângulo limite é 3/4.",
    test:
      "A questão queria testar se você sabe que ângulo limite só existe de maior índice para menor índice.",
  },
  {
    title: "Profundidade aparente",
    level: "intermediário",
    statement:
      "Um objeto está a 2,0 m de profundidade em uma piscina. Para observação quase normal, estime a profundidade aparente. Use n = 4/3.",
    idea:
      "Objeto submerso visto do ar parece mais raso. Use h_ap ≈ h/n.",
    steps: [
      "Use h_ap ≈ h/n.",
      "h_ap ≈ 2,0/(4/3).",
      "h_ap ≈ 2,0 · 3/4.",
      "h_ap ≈ 1,5 m.",
    ],
    answer:
      "A profundidade aparente é aproximadamente 1,5 m.",
    test:
      "A questão queria testar a interpretação da imagem aparente, não o deslocamento real do objeto.",
  },
  {
    title: "Desvio lateral em lâmina",
    level: "intermediário",
    statement:
      "Um raio atravessa uma lâmina de faces paralelas. Qual é a principal característica do raio emergente em relação ao incidente?",
    idea:
      "Em faces paralelas, o raio desvia dentro da lâmina, mas emerge paralelo ao raio incidente.",
    steps: [
      "Na primeira face, o raio refrata e muda de direção.",
      "Dentro da lâmina, segue com ângulo r.",
      "Na segunda face, refrata novamente.",
      "Como as faces são paralelas, o raio emergente sai paralelo ao incidente.",
      "Mesmo assim, há deslocamento lateral.",
    ],
    answer:
      "O raio emergente é paralelo ao incidente, mas lateralmente deslocado.",
    test:
      "A questão queria testar conceito, não conta. Lâmina paralela desloca, mas não muda a direção final.",
  },
  {
    title: "Prisma e dispersão",
    level: "conceitual",
    statement:
      "Por que a luz branca se separa em cores ao atravessar um prisma?",
    idea:
      "O índice de refração do material depende do comprimento de onda da luz.",
    steps: [
      "A luz branca contém várias frequências.",
      "Cada frequência pode ter índice de refração diferente no prisma.",
      "Índices diferentes produzem desvios diferentes.",
      "Assim, as cores emergem separadas.",
    ],
    answer:
      "A separação ocorre por dispersão: diferentes cores sofrem desvios diferentes.",
    test:
      "A questão queria testar que dispersão não é criação de cores; é separação das componentes já presentes.",
  },
  {
    title: "Fibra óptica",
    level: "aplicação",
    statement:
      "Explique por que fibras ópticas conseguem guiar luz por longas distâncias.",
    idea:
      "A fibra usa reflexão total entre o núcleo e a casca.",
    steps: [
      "O núcleo tem índice maior que a casca.",
      "A luz tenta passar do núcleo para a casca.",
      "Se o ângulo de incidência for maior que o limite, ocorre reflexão total.",
      "Assim, o raio fica confinado dentro do núcleo.",
    ],
    answer:
      "A luz é guiada por sucessivas reflexões totais internas.",
    test:
      "A questão queria testar as condições de reflexão total aplicadas a tecnologia.",
  },
];

const traps = [
  "Medir ângulos pela superfície em vez da normal.",
  "Aplicar Snell sem identificar meio 1 e meio 2.",
  "Achar que toda refração muda direção; na incidência normal não há desvio angular.",
  "Esquecer que a frequência da luz não muda na passagem de meio.",
  "Inventar ângulo limite quando a luz vai de menor índice para maior índice.",
  "Achar que lâmina de faces paralelas muda a direção final do raio.",
  "Confundir dispersão com mudança de frequência.",
  "Achar que miragem é ilusão psicológica, e não refração em meio não homogêneo.",
  "Confundir reflexão difusa com desobediência à lei da reflexão.",
];

const checklist = [
  "Sei desenhar a normal antes de usar Snell?",
  "Sei prever aproximação ou afastamento da normal?",
  "Sei explicar índice de refração como relação entre c e v?",
  "Sei calcular ângulo limite?",
  "Sei dizer quando ocorre reflexão total?",
  "Sei explicar fibra óptica por reflexão total?",
  "Sei interpretar profundidade aparente?",
  "Sei explicar dispersão em prismas?",
  "Sei explicar arco-íris sem inventar magia colorida?",
  "Sei diferenciar reflexão regular e difusa?",
];

function FormulaBlock({ formula }: { formula: string }) {
  return (
    <div className="my-4 overflow-x-auto rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.24)]">
      <div className="text-slate-100 [&_.katex]:text-slate-100 [&_.katex-display]:my-0">
        <MathFormula formula={formula} display={true} />
      </div>
    </div>
  );
}

function NoteCard({
  title,
  type,
  body,
}: {
  title: string;
  type: NoteType;
  body: string;
}) {
  const styles = {
    info: {
      wrap: "border-blue-200 bg-blue-50",
      icon: "text-blue-700",
      Icon: Lightbulb,
    },
    warning: {
      wrap: "border-amber-200 bg-amber-50",
      icon: "text-amber-700",
      Icon: AlertTriangle,
    },
    success: {
      wrap: "border-emerald-200 bg-emerald-50",
      icon: "text-emerald-700",
      Icon: CheckCircle2,
    },
  }[type];

  const Icon = styles.Icon;

  return (
    <div className={`rounded-2xl border p-5 ${styles.wrap}`}>
      <div className="mb-3 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${styles.icon}`} />
        <h4 className="text-base font-black text-slate-950">{title}</h4>
      </div>
      <p className="text-justify text-[1.02rem] leading-8 text-slate-700">
        {body}
      </p>
    </div>
  );
}

function FormulaCard({ item }: { item: FormulaSummary }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
      </div>
      <div className="p-6">
        <FormulaBlock formula={item.formula} />
        <p className="text-justify text-[1.02rem] leading-8 text-slate-700">
          {item.description}
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950">
              Termo a termo
            </h4>
            <ul className="space-y-2">
              {item.terms.map((term, index) => (
                <li key={index} className="flex gap-2 text-sm leading-6 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950">
              Interpretação
            </h4>
            <ul className="space-y-2">
              {item.interpretation.map((line, index) => (
                <li key={index} className="flex gap-2 text-sm leading-6 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {item.warning ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-900">
            {item.warning}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function OpticsDiagram({ diagram }: { diagram: NonNullable<TheorySection["diagram"]> }) {
  return (
    <div className="my-7 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200 bg-slate-950 px-6 py-4">
        <h3 className="text-lg font-black text-white">Diagrama visual: {diagram.title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-300">{diagram.caption}</p>
      </div>

      <div className="overflow-x-auto p-5 md:p-7">
        <div className="min-w-[720px] rounded-2xl bg-white p-5">
          {diagram.kind === "reflectionRefraction" && <ReflectionRefractionDiagram />}
          {diagram.kind === "totalReflection" && <TotalReflectionDiagram />}
          {diagram.kind === "prismDispersion" && <PrismDispersionDiagram />}
          {diagram.kind === "apparentDepth" && <ApparentDepthDiagram />}
          {diagram.kind === "mirage" && <MirageDiagram />}
        </div>
      </div>
    </div>
  );
}

function ReflectionRefractionDiagram() {
  return (
    <svg viewBox="0 0 820 320" className="h-auto w-full">
      <defs>
        <marker id="arrowBlueFen" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
        </marker>
        <marker id="arrowRedFen" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#dc2626" />
        </marker>
      </defs>
      <rect x="50" y="170" width="720" height="90" fill="#dbeafe" />
      <line x1="50" y1="170" x2="770" y2="170" stroke="#0f172a" strokeWidth="4" />
      <line x1="410" y1="45" x2="410" y2="285" stroke="#64748b" strokeWidth="3" strokeDasharray="8 8" />
      <line x1="245" y1="75" x2="410" y2="170" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" markerEnd="url(#arrowBlueFen)" />
      <line x1="410" y1="170" x2="565" y2="80" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" markerEnd="url(#arrowRedFen)" />
      <line x1="410" y1="170" x2="520" y2="250" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" markerEnd="url(#arrowBlueFen)" />
      <text x="215" y="62" className="fill-blue-700 text-[15px] font-black">incidente</text>
      <text x="560" y="70" className="fill-red-700 text-[15px] font-black">refletido</text>
      <text x="525" y="265" className="fill-emerald-700 text-[15px] font-black">refratado</text>
      <text x="425" y="64" className="fill-slate-700 text-[15px] font-black">normal</text>
      <text x="65" y="150" className="fill-slate-700 text-[15px] font-bold">meio 1</text>
      <text x="65" y="225" className="fill-slate-700 text-[15px] font-bold">meio 2</text>
    </svg>
  );
}

function TotalReflectionDiagram() {
  return (
    <svg viewBox="0 0 820 300" className="h-auto w-full">
      <defs>
        <marker id="arrowTir" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
        </marker>
      </defs>
      <rect x="50" y="160" width="720" height="100" fill="#bfdbfe" />
      <line x1="50" y1="160" x2="770" y2="160" stroke="#0f172a" strokeWidth="4" />
      <line x1="410" y1="45" x2="410" y2="280" stroke="#64748b" strokeWidth="3" strokeDasharray="8 8" />
      <line x1="250" y1="245" x2="410" y2="160" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" markerEnd="url(#arrowTir)" />
      <line x1="410" y1="160" x2="590" y2="245" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" markerEnd="url(#arrowTir)" />
      <line x1="410" y1="160" x2="690" y2="160" stroke="#f59e0b" strokeWidth="4" strokeDasharray="8 8" />
      <text x="610" y="148" className="fill-amber-700 text-[15px] font-black">raio rasante no limite</text>
      <text x="235" y="270" className="fill-blue-700 text-[15px] font-black">incidente no meio mais refringente</text>
      <text x="575" y="270" className="fill-blue-700 text-[15px] font-black">reflexão total</text>
      <text x="65" y="145" className="fill-slate-700 text-[15px] font-bold">menor n</text>
      <text x="65" y="220" className="fill-slate-700 text-[15px] font-bold">maior n</text>
    </svg>
  );
}

function PrismDispersionDiagram() {
  return (
    <svg viewBox="0 0 820 300" className="h-auto w-full">
      <polygon points="360,55 250,245 495,245" fill="#e0f2fe" stroke="#0f172a" strokeWidth="4" />
      <line x1="70" y1="150" x2="285" y2="150" stroke="#facc15" strokeWidth="7" strokeLinecap="round" />
      <line x1="285" y1="150" x2="375" y2="150" stroke="#facc15" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
      <line x1="450" y1="148" x2="710" y2="95" stroke="#7c3aed" strokeWidth="5" strokeLinecap="round" />
      <line x1="450" y1="150" x2="710" y2="135" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
      <line x1="450" y1="152" x2="710" y2="175" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" />
      <line x1="450" y1="154" x2="710" y2="215" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />
      <text x="70" y="132" className="fill-slate-900 text-[16px] font-black">luz branca</text>
      <text x="625" y="85" className="fill-violet-700 text-[15px] font-black">violeta</text>
      <text x="650" y="230" className="fill-red-700 text-[15px] font-black">vermelho</text>
    </svg>
  );
}

function ApparentDepthDiagram() {
  return (
    <svg viewBox="0 0 820 320" className="h-auto w-full">
      <rect x="60" y="145" width="700" height="135" fill="#bfdbfe" opacity="0.85" />
      <line x1="60" y1="145" x2="760" y2="145" stroke="#0f172a" strokeWidth="4" />
      <circle cx="365" cy="245" r="13" fill="#dc2626" />
      <circle cx="430" cy="190" r="10" fill="#ef4444" opacity="0.35" />
      <line x1="365" y1="245" x2="520" y2="145" stroke="#2563eb" strokeWidth="4" />
      <line x1="520" y1="145" x2="650" y2="80" stroke="#2563eb" strokeWidth="4" />
      <line x1="650" y1="80" x2="430" y2="190" stroke="#94a3b8" strokeWidth="3" strokeDasharray="9 9" />
      <text x="300" y="270" className="fill-red-700 text-[15px] font-black">objeto real</text>
      <text x="445" y="205" className="fill-slate-700 text-[15px] font-black">imagem aparente</text>
      <text x="642" y="70" className="fill-slate-900 text-[15px] font-black">olho</text>
      <text x="80" y="130" className="fill-slate-700 text-[15px] font-bold">superfície</text>
    </svg>
  );
}

function MirageDiagram() {
  return (
    <svg viewBox="0 0 820 300" className="h-auto w-full">
      <rect x="40" y="225" width="740" height="40" fill="#fde68a" />
      <text x="60" y="252" className="fill-amber-900 text-[15px] font-black">solo quente</text>
      <line x1="105" y1="85" x2="105" y2="190" stroke="#0f172a" strokeWidth="5" />
      <polygon points="105,85 90,120 120,120" fill="#0f172a" />
      <text x="82" y="75" className="fill-slate-900 text-[15px] font-black">objeto</text>
      <path d="M105 85 C240 120, 380 205, 520 215 C610 220, 670 185, 735 120" fill="none" stroke="#2563eb" strokeWidth="5" />
      <path d="M520 215 C430 230, 275 235, 105 190" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="9 9" />
      <circle cx="740" cy="120" r="10" fill="#0f172a" />
      <text x="710" y="103" className="fill-slate-900 text-[15px] font-black">observador</text>
      <text x="260" y="285" className="fill-slate-700 text-[15px] font-black">raio curvado por gradiente de índice</text>
    </svg>
  );
}

function SnellSimulator() {
  const [n1, setN1] = useState(1);
  const [n2, setN2] = useState(1.5);
  const [angle, setAngle] = useState(35);

  const sinR = (n1 * Math.sin((angle * Math.PI) / 180)) / n2;
  const hasRefraction = Math.abs(sinR) <= 1;
  const refractedAngle = hasRefraction ? (Math.asin(sinR) * 180) / Math.PI : null;
  const critical = n1 > n2 ? (Math.asin(n2 / n1) * 180) / Math.PI : null;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="bg-slate-950 px-7 py-6 text-white md:px-9">
        <div className="flex items-center gap-4">
          <Calculator className="h-7 w-7" />
          <div>
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">Simulador rápido de Snell</h2>
            <p className="mt-1 text-sm font-semibold text-slate-300">
              Altere os índices e o ângulo para ver se há refração ou reflexão total.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-7 px-7 py-7 md:px-9 md:py-9 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">n₁</span>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">{n1.toFixed(2)}</span>
            </div>
            <input type="range" min="1" max="2.2" step="0.05" value={n1} onChange={(event) => setN1(Number(event.target.value))} className="w-full accent-blue-700" />
          </label>

          <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">n₂</span>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">{n2.toFixed(2)}</span>
            </div>
            <input type="range" min="1" max="2.2" step="0.05" value={n2} onChange={(event) => setN2(Number(event.target.value))} className="w-full accent-blue-700" />
          </label>

          <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Ângulo de incidência</span>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">{angle}°</span>
            </div>
            <input type="range" min="0" max="80" step="1" value={angle} onChange={(event) => setAngle(Number(event.target.value))} className="w-full accent-blue-700" />
          </label>

          <FormulaBlock formula={String.raw`${n1.toFixed(2)}\sin ${angle}^{\circ}=${n2.toFixed(2)}\sin r`} />
        </div>

        <div className="space-y-5">
          <div className={`rounded-3xl border p-6 ${hasRefraction ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Resultado</p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">
              {hasRefraction ? `Refração com r ≈ ${refractedAngle?.toFixed(1)}°` : "Reflexão total"}
            </h3>
            <p className="mt-3 text-[1.02rem] leading-8 text-slate-700">
              {hasRefraction
                ? n2 > n1
                  ? "O raio entra em meio de maior índice e aproxima-se da normal."
                  : n2 < n1
                    ? "O raio entra em meio de menor índice e afasta-se da normal."
                    : "Os índices são iguais; não há mudança de direção por diferença de índice."
                : "Não existe seno real para o ângulo refratado. A luz permanece no meio 1 por reflexão total."}
            </p>
          </div>

          {critical !== null ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-700">Ângulo limite</p>
              <p className="mt-2 text-2xl font-black text-slate-950">L ≈ {critical.toFixed(1)}°</p>
              <p className="mt-3 text-[1.02rem] leading-8 text-slate-700">
                Como n₁ &gt; n₂, há possibilidade de reflexão total para incidências acima desse valor.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Sem ângulo limite</p>
              <p className="mt-2 text-[1.02rem] leading-8 text-slate-700">
                Com n₁ ≤ n₂, a luz não está tentando sair de meio mais refringente para menos refringente.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TheorySectionCard({ section }: { section: TheorySection }) {
  const Icon = section.icon;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className={`${section.accent} px-7 py-6 text-white md:px-9`}>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Icon className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">
            {section.id}. {section.title}
          </h2>
        </div>
      </div>

      <div className="space-y-6 px-7 py-7 md:px-9 md:py-9">
        {section.paragraphs.map((paragraph, index) => (
          <p key={index} className="text-justify text-[1.06rem] leading-9 text-slate-700">
            {paragraph}
          </p>
        ))}

        {section.diagram ? <OpticsDiagram diagram={section.diagram} /> : null}

        {section.formulas ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {section.formulas.map((formula) => (
              <FormulaCard key={formula.title} item={formula} />
            ))}
          </div>
        ) : null}

        {section.bullets ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <ul className="space-y-3">
              {section.bullets.map((bullet, index) => (
                <li key={index} className="flex gap-3 text-[1.02rem] leading-8 text-slate-700">
                  <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {section.notes ? (
          <div className="space-y-4">
            {section.notes.map((note, index) => (
              <NoteCard key={index} title={note.title} type={note.type} body={note.body} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ExampleCard({ example, index }: { example: ExampleItem; index: number }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <div className="bg-red-700 px-6 py-5 text-white">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-100">
              Exemplo {index + 1} · {example.level}
            </p>
            <h3 className="mt-1 text-2xl font-black">{example.title}</h3>
          </div>
          <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black">
            resolvido
          </div>
        </div>
      </div>

      <div className="space-y-5 px-6 py-6 md:px-8 md:py-8">
        <div>
          <h4 className="text-base font-black text-slate-950">Enunciado</h4>
          <p className="mt-2 rounded-2xl bg-slate-50 p-4 text-justify text-[1.02rem] leading-8 text-slate-700">
            {example.statement}
          </p>
        </div>

        <NoteCard title="Ideia antes da conta" type="info" body={example.idea} />

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h4 className="mb-4 text-base font-black text-slate-950">Desenvolvimento</h4>
          <div className="space-y-4">
            {example.steps.map((step, stepIndex) => (
              <div key={stepIndex} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                  {stepIndex + 1}
                </div>
                <p className="pt-0.5 text-[1.02rem] leading-8 text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold leading-8 text-emerald-950">
          {example.answer}
        </div>

        <NoteCard title="O que a questão queria testar" type="warning" body={example.test} />
      </div>
    </article>
  );
}

export default function OpticaTopicFenomenos() {
  const [activeTab, setActiveTab] = useState<Tab>("teoria");

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="container flex items-center justify-between gap-4 py-5">
          <div className="flex items-center gap-5">
            <Link href="/optica" className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition-colors hover:text-blue-700">
              <ArrowLeft className="h-6 w-6" />
            </Link>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">
                ÓPTICA
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">
                Fenômenos Ópticos
              </h1>
            </div>
          </div>

          <nav className="hidden items-center gap-3 md:flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-7 py-3 text-lg font-black transition ${
                  activeTab === tab.id
                    ? "bg-slate-950 text-white shadow-[0_10px_30px_rgba(15,23,42,0.22)]"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="container py-10 md:py-12">
        <section className="overflow-hidden rounded-[2.2rem] bg-slate-950 px-8 py-10 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] md:px-10 md:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-amber-300">
                <Sparkles className="h-4 w-4" />
                teoria completa
              </div>

              <h2 className="mt-7 max-w-4xl text-4xl font-black leading-[1.08] tracking-tight md:text-6xl">
                Reflexão, refração, dispersão e miragens sem decorar desenho torto.
              </h2>

              <p className="mt-6 max-w-3xl text-lg leading-9 text-slate-300">
                Aprofunde os fenômenos clássicos da Óptica Geométrica: Snell, reflexão total,
                prismas, arco-íris, profundidade aparente, lâminas e fibras ópticas.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { value: String(theorySections.length), label: "Seções" },
                { value: String(formulas.length), label: "Fórmulas" },
                { value: "5", label: "Diagramas" },
                { value: "ITA", label: "Foco" },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
                  <p className="text-4xl font-black text-white">{item.value}</p>
                  <p className="mt-1 text-sm font-black uppercase tracking-[0.18em] text-slate-300">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm md:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl px-4 py-3 text-left font-black ${
                activeTab === tab.id ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "teoria" ? (
          <div className="mt-10 space-y-8">
            {theorySections.map((section) => (
              <div key={section.id} className="space-y-8">
                <TheorySectionCard section={section} />
                {section.id === 4 ? <SnellSimulator /> : null}
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "exemplos" ? (
          <div className="mt-10 space-y-8">
            {examples.map((example, index) => (
              <ExampleCard key={example.title} example={example} index={index} />
            ))}
          </div>
        ) : null}

        {activeTab === "resumo" ? (
          <div className="mt-10 space-y-8">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="bg-slate-950 px-7 py-6 text-white md:px-9">
                <div className="flex items-center gap-4">
                  <Target className="h-7 w-7" />
                  <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                    Fórmulas principais
                  </h2>
                </div>
              </div>

              <div className="grid gap-5 px-7 py-7 md:grid-cols-2 md:px-9 md:py-9">
                {formulas.map((formula) => (
                  <FormulaCard key={formula.title} item={formula} />
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="bg-red-700 px-7 py-6 text-white md:px-9">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="h-7 w-7" />
                  <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                    Armadilhas clássicas
                  </h2>
                </div>
              </div>

              <div className="grid gap-4 px-7 py-7 md:grid-cols-2 md:px-9 md:py-9">
                {traps.map((trap) => (
                  <div key={trap} className="flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                    <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-red-700" />
                    <p className="text-[1.01rem] leading-7 text-slate-700">{trap}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="bg-emerald-700 px-7 py-6 text-white md:px-9">
                <div className="flex items-center gap-4">
                  <ShieldCheck className="h-7 w-7" />
                  <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                    Checklist de domínio
                  </h2>
                </div>
              </div>

              <div className="grid gap-4 px-7 py-7 md:grid-cols-2 md:px-9 md:py-9">
                {checklist.map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
                    <p className="text-[1.01rem] leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
