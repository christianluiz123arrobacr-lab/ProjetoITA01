import { useMemo, useState, type ElementType } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Atom,
  BookOpen,
  Brain,
  Calculator,
  CheckCircle2,
  Gauge,
  GitBranch,
  LineChart,
  MoveHorizontal,
  Repeat2,
  RotateCcw,
  ShieldCheck,
  Sigma,
  SlidersHorizontal,
  Sparkles,
  Target,
  Waves,
  Zap,
} from "lucide-react";
import { Link } from "wouter";

import { MathFormula } from "@/components/MathFormula";

type Tab = "teoria" | "exemplos" | "resumo";
type NoteType = "info" | "warning" | "success";
type DiagramKind =
  | "spring"
  | "mcu"
  | "graphs"
  | "energy"
  | "pendulum"
  | "verticalSpring"
  | "springAssociation"
  | "potentialWell";

type FormulaSummary = {
  title: string;
  formula: string;
  description: string;
  terms: string[];
  interpretation: string[];
  derivation?: string[];
  warning?: string;
};

type TheorySection = {
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
    title: "Assinatura do MHS",
    formula: String.raw`a=-\omega^2x`,
    description:
      "Um movimento é harmônico simples quando a aceleração é proporcional ao deslocamento em relação ao equilíbrio e tem sentido oposto a ele.",
    terms: [
      "a: aceleração instantânea.",
      "x: posição medida a partir do equilíbrio.",
      "ω: frequência angular.",
      "sinal negativo: aceleração aponta para o equilíbrio.",
    ],
    interpretation: [
      "No equilíbrio, x = 0 e a = 0.",
      "Nas extremidades, |x| é máximo e |a| também é máximo.",
      "Essa relação é a forma mais direta de reconhecer MHS.",
    ],
    derivation: [
      "A ideia começa pela forma geral de uma oscilação senoidal, como x(t) = A cos(ωt + φ₀).",
      "Derivando duas vezes em relação ao tempo, obtemos a(t) = -Aω² cos(ωt + φ₀).",
      "Como A cos(ωt + φ₀) é justamente x(t), então a(t) = -ω²x(t).",
      "Em prova militar, essa é a assinatura: se a aceleração puder ser escrita proporcional a -x, o movimento é MHS.",
    ],
  },
  {
    title: "Força restauradora linear",
    formula: String.raw`F=-Cx`,
    description:
      "Forma geral da força resultante que produz MHS. A constante C depende do sistema físico analisado.",
    terms: [
      "F: força resultante restauradora.",
      "C: constante restauradora efetiva.",
      "x: deslocamento em relação ao equilíbrio.",
    ],
    interpretation: [
      "Se C > 0, a força tem sentido contrário ao deslocamento.",
      "Para uma mola ideal, C = k.",
      "Em questões difíceis, C pode vir de uma combinação de molas, gravidade, geometria ou aproximações.",
    ],
    derivation: [
      "Pela Segunda Lei de Newton, a força resultante é F = ma.",
      "Se o movimento é MHS, então a = -ω²x.",
      "Logo F = m(-ω²x) = -mω²x.",
      "Chamando mω² de C, obtemos F = -Cx. Para uma mola ideal, essa constante C é o próprio k.",
    ],
  },
  {
    title: "Frequência angular efetiva",
    formula: String.raw`\omega=\sqrt{\frac{C}{m}}`,
    description:
      "Quando a força restauradora efetiva é F = -Cx, a frequência angular depende da constante restauradora e da massa.",
    terms: [
      "ω: frequência angular.",
      "C: constante restauradora efetiva.",
      "m: massa oscilante.",
    ],
    interpretation: [
      "Maior C deixa a oscilação mais rápida.",
      "Maior massa aumenta a inércia e deixa a oscilação mais lenta.",
    ],
    derivation: [
      "Partimos da força restauradora efetiva F = -Cx.",
      "Aplicando F = ma, temos ma = -Cx, portanto a = -(C/m)x.",
      "Comparando com a forma do MHS, a = -ω²x, concluímos que ω² = C/m.",
      "Assim, ω = √(C/m). Essa fórmula é essencial para sistemas que não são uma mola simples.",
    ],
  },
  {
    title: "Equação horária",
    formula: String.raw`x(t)=A\cos(\omega t+\varphi_0)`,
    description:
      "Descreve a posição do oscilador no tempo. Também pode ser escrita com seno, desde que a fase inicial seja ajustada.",
    terms: [
      "A: amplitude.",
      "ω: frequência angular.",
      "φ₀: fase inicial.",
      "ωt + φ₀: fase do movimento.",
    ],
    interpretation: [
      "A fase determina em que ponto do ciclo o corpo está.",
      "A fase inicial é definida pelas condições iniciais.",
      "Seno e cosseno representam o mesmo tipo de movimento com escolhas diferentes de fase.",
    ],
    derivation: [
      "A equação diferencial do MHS é d²x/dt² + ω²x = 0.",
      "As funções seno e cosseno têm uma propriedade especial: ao derivá-las duas vezes, elas voltam a si mesmas com sinal negativo.",
      "Por isso a solução natural é senoidal ou cossenoidal.",
      "A fase inicial φ₀ entra para ajustar a posição e o sentido da velocidade no instante inicial.",
    ],
  },
  {
    title: "Velocidade no MHS",
    formula: String.raw`v(t)=-A\omega\sin(\omega t+\varphi_0)`,
    description:
      "Obtida derivando a equação horária da posição em relação ao tempo.",
    terms: [
      "v(t): velocidade instantânea.",
      "Aω: valor máximo do módulo da velocidade.",
      "seno: mostra a defasagem entre posição e velocidade.",
    ],
    interpretation: [
      "A velocidade é máxima no equilíbrio.",
      "A velocidade é nula nas extremidades.",
    ],
    derivation: [
      "A velocidade é a derivada da posição: v = dx/dt.",
      "Derivando x(t) = A cos(ωt + φ₀), usamos a regra da cadeia.",
      "A derivada de cos(ωt + φ₀) é -ω sen(ωt + φ₀).",
      "Portanto, v(t) = -Aω sen(ωt + φ₀).",
    ],
  },
  {
    title: "Velocidade máxima",
    formula: String.raw`v_{\max}=A\omega`,
    description:
      "Módulo da velocidade quando o corpo passa pela posição de equilíbrio.",
    terms: ["A: amplitude.", "ω: frequência angular."],
    interpretation: [
      "No equilíbrio, a energia cinética é máxima.",
      "Nas extremidades, a velocidade é zero.",
    ],
    derivation: [
      "Da expressão v(t) = -Aω sen(ωt + φ₀), o maior valor possível do módulo do seno é 1.",
      "Logo, o maior módulo da velocidade é Aω.",
      "Fisicamente, isso ocorre no equilíbrio, onde toda a energia mecânica está na forma cinética.",
    ],
  },
  {
    title: "Relação entre velocidade e posição",
    formula: String.raw`v^2=\omega^2(A^2-x^2)`,
    description:
      "Permite encontrar a velocidade em uma posição sem conhecer o instante.",
    terms: [
      "v: velocidade na posição x.",
      "A: amplitude.",
      "x: posição em relação ao equilíbrio.",
      "ω: frequência angular.",
    ],
    interpretation: [
      "Em x = 0, o módulo da velocidade é máximo.",
      "Em x = ±A, a velocidade é zero.",
      "O sinal da velocidade depende do sentido do movimento.",
    ],
    derivation: [
      "Pela energia no massa-mola, E = Ec + Ep.",
      "Temos (1/2)kA² = (1/2)mv² + (1/2)kx².",
      "Multiplicando por 2 e usando k/m = ω², obtemos v² = ω²(A² - x²).",
      "Essa relação é ótima quando a questão fornece posição e não pede o instante.",
    ],
  },
  {
    title: "Aceleração máxima",
    formula: String.raw`a_{\max}=\omega^2A`,
    description:
      "Módulo máximo da aceleração, atingido nas extremidades.",
    terms: ["ω: frequência angular.", "A: amplitude."],
    interpretation: [
      "A aceleração é nula no equilíbrio.",
      "A aceleração é máxima em módulo quando o afastamento é máximo.",
    ],
    derivation: [
      "No MHS, a = -ω²x.",
      "O maior valor de |x| é a amplitude A.",
      "Portanto, o maior módulo da aceleração é a_max = ω²A.",
      "Ela ocorre nas extremidades, não no equilíbrio.",
    ],
  },
  {
    title: "Período do massa-mola",
    formula: String.raw`T=2\pi\sqrt{\frac{m}{k}}`,
    description:
      "Período de um sistema massa-mola ideal em torno da posição de equilíbrio.",
    terms: ["T: período.", "m: massa.", "k: constante elástica da mola."],
    interpretation: [
      "Aumentar a massa aumenta o período.",
      "Aumentar a rigidez da mola diminui o período.",
      "No modelo ideal, não depende da amplitude.",
    ],
    derivation: [
      "Para a mola ideal, F = -kx.",
      "Pela Segunda Lei, ma = -kx, então a = -(k/m)x.",
      "Comparando com a = -ω²x, obtemos ω = √(k/m).",
      "Como T = 2π/ω, resulta T = 2π√(m/k).",
    ],
  },
  {
    title: "Período do pêndulo simples",
    formula: String.raw`T=2\pi\sqrt{\frac{\ell}{g}}`,
    description:
      "Período aproximado de um pêndulo simples para pequenas oscilações.",
    terms: [
      "ℓ: comprimento do fio.",
      "g: aceleração da gravidade.",
      "T: período.",
    ],
    interpretation: [
      "No modelo ideal, não depende da massa.",
      "Para pequenas oscilações, não depende da amplitude.",
      "A fórmula usa a aproximação senθ ≈ θ em radianos.",
    ],
    derivation: [
      "A força tangencial restauradora é aproximadamente F_t = -mg senθ.",
      "Para pequenos ângulos em radianos, senθ ≈ θ.",
      "Como o deslocamento ao longo do arco é x ≈ ℓθ, então θ ≈ x/ℓ.",
      "Assim, F_t ≈ -mg(x/ℓ). Pela Segunda Lei, a = -(g/ℓ)x.",
      "Comparando com a = -ω²x, obtemos ω = √(g/ℓ) e T = 2π√(ℓ/g).",
    ],
    warning:
      "Para ângulos grandes, o movimento continua periódico, mas não é exatamente MHS.",
  },
  {
    title: "Energia mecânica total",
    formula: String.raw`E=\frac{1}{2}kA^2`,
    description:
      "Energia total do sistema massa-mola ideal, conservada na ausência de dissipação.",
    terms: ["k: constante elástica.", "A: amplitude.", "E: energia mecânica total."],
    interpretation: [
      "Nas extremidades, a energia é potencial elástica.",
      "No equilíbrio, a energia é cinética.",
    ],
    derivation: [
      "Nas extremidades, x = ±A e v = 0.",
      "Nesse ponto, toda a energia mecânica está na forma potencial elástica.",
      "Como Ep = (1/2)kx², substituindo x = A temos E = (1/2)kA².",
      "É por isso que a energia total depende do quadrado da amplitude.",
    ],
  },
  {
    title: "Energia usando frequência angular",
    formula: String.raw`E=\frac{1}{2}m\omega^2A^2`,
    description:
      "Forma equivalente da energia total, usando k = mω².",
    terms: ["m: massa.", "ω: frequência angular.", "A: amplitude."],
    interpretation: [
      "Útil quando a questão fornece m, ω e A, mas não fornece k.",
      "Reforça a ligação entre energia e frequência angular.",
    ],
    derivation: [
      "No massa-mola, ω² = k/m.",
      "Logo, k = mω².",
      "Substituindo em E = (1/2)kA², obtemos E = (1/2)mω²A².",
      "Essa forma é útil quando a questão trabalha diretamente com frequência angular.",
    ],
  },
  {
    title: "Molas em paralelo",
    formula: String.raw`k_{\mathrm{eq}}=k_1+k_2+\cdots`,
    description:
      "Molas em paralelo somam rigidez. Para o mesmo deslocamento, as forças restauradoras se somam.",
    terms: [
      "k_eq: constante equivalente.",
      "k₁, k₂, ...: constantes das molas associadas.",
    ],
    interpretation: [
      "O sistema fica mais rígido.",
      "A frequência angular aumenta.",
      "O período diminui.",
    ],
  },
  {
    title: "Molas em série",
    formula: String.raw`\frac{1}{k_{\mathrm{eq}}}=\frac{1}{k_1}+\frac{1}{k_2}+\cdots`,
    description:
      "Molas em série reduzem a rigidez equivalente, pois a deformação total se divide entre elas.",
    terms: [
      "k_eq: constante equivalente.",
      "k₁, k₂, ...: constantes das molas associadas.",
    ],
    interpretation: [
      "O sistema fica mais flexível.",
      "A frequência angular diminui.",
      "O período aumenta.",
    ],
  },,

  {
    title: "Potencial perto do equilíbrio",
    formula: String.raw`U(x)\approx U(0)+\frac{1}{2}Cx^2`,
    description:
      "Aproximação da energia potencial perto de um equilíbrio estável. O gráfico localmente se comporta como uma parábola.",
    terms: [
      "U(x): energia potencial em função da posição.",
      "U(0): energia potencial no equilíbrio escolhido como origem.",
      "C: curvatura efetiva da energia potencial perto do mínimo.",
      "x: pequeno deslocamento em relação ao equilíbrio.",
    ],
    interpretation: [
      "Perto de um mínimo de energia, muitos sistemas se comportam como osciladores harmônicos.",
      "Essa é uma das razões pelas quais o MHS aparece em tantos contextos físicos.",
    ],
  },
  {
    title: "Força a partir da energia potencial",
    formula: String.raw`F=-\frac{dU}{dx}`,
    description:
      "A força conservativa é o negativo da derivada da energia potencial. Se U é aproximadamente quadrática, a força é restauradora linear.",
    terms: [
      "F: força associada à energia potencial.",
      "dU/dx: taxa de variação da energia potencial com a posição.",
      "sinal negativo: a força aponta no sentido de diminuir a energia potencial.",
    ],
    interpretation: [
      "Se U(x) ≈ U(0) + Cx²/2, então F = -Cx.",
      "Isso liga equilíbrio estável, energia mínima e Movimento Harmônico Simples.",
    ],
  },
  {
    title: "Energia em x = A/2",
    formula: String.raw`x=\frac{A}{2}\quad\Rightarrow\quad E_p=\frac{E}{4}\ \text{ e }\ E_c=\frac{3E}{4}`,
    description:
      "Resultado clássico para mostrar que a energia potencial elástica cresce com o quadrado da posição.",
    terms: [
      "A: amplitude do MHS.",
      "E_p: energia potencial elástica.",
      "E_c: energia cinética.",
      "E: energia mecânica total.",
    ],
    interpretation: [
      "Metade da amplitude não significa metade da energia potencial.",
      "Como E_p depende de x², em x = A/2 ela vale apenas um quarto da energia total.",
    ],
  },

];

const theorySections: TheorySection[] = [
  {
    icon: BookOpen,
    title: "Contexto físico e importância do MHS",
    accent: "bg-purple-700",
    paragraphs: [
      "O Movimento Harmônico Simples é um dos modelos mais importantes da Física porque descreve o comportamento de sistemas que oscilam em torno de uma posição de equilíbrio estável. Ele aparece em massa-mola, pêndulos de pequena amplitude, vibração de cordas, instrumentos musicais, moléculas oscilando em torno de posições de equilíbrio e até em modelos elétricos.",
      "Nem todo movimento de ida e volta é MHS. Para ser harmônico simples, o movimento precisa obedecer a uma lei específica: o sistema deve sofrer uma ação restauradora proporcional ao afastamento em relação ao equilíbrio e voltada para esse equilíbrio.",
      "A ideia física é simples, mas poderosa. Quando um corpo é afastado do equilíbrio, surge uma força que tenta trazê-lo de volta. Ao chegar ao equilíbrio, o corpo não para, pois possui velocidade. Ele ultrapassa a posição central, passa a sofrer uma força contrária ao movimento, desacelera, para por um instante na extremidade e retorna.",
      "Esse ciclo entre afastamento, força restauradora, aceleração, passagem pelo equilíbrio, inércia e inversão do movimento é a base do MHS. O modelo é importante porque muitos sistemas reais, quando analisados perto do equilíbrio, podem ser aproximados por uma força restauradora linear.",
    ],
    formulas: [formulas[1], formulas[2]],
    notes: [
      {
        title: "Ideia central",
        type: "success",
        body: "MHS não é apenas um movimento que vai e volta. É um vai e volta em que a aceleração é proporcional ao deslocamento e aponta para o equilíbrio.",
      },
      {
        title: "Leitura de prova",
        type: "info",
        body: "Em questões difíceis, o enunciado muitas vezes não diz que o movimento é MHS. Você precisa mostrar que a força resultante pode ser escrita como F = -Cx.",
      },
    ],
  },
  {
    icon: MoveHorizontal,
    title: "Oscilação, equilíbrio estável e força restauradora",
    accent: "bg-slate-950",
    paragraphs: [
      "Considere um bloco preso a uma mola horizontal ideal, sobre uma superfície sem atrito. Existe uma posição em que a mola não está deformada e a força elástica é nula. Essa é a posição de equilíbrio do sistema.",
      "Se o bloco é puxado para a direita, a mola fica esticada e puxa o bloco para a esquerda. Se o bloco é empurrado para a esquerda, a mola fica comprimida e empurra o bloco para a direita. Em ambos os casos, a força aponta para a posição de equilíbrio.",
      "Esse comportamento caracteriza uma força restauradora. O termo não significa que o corpo necessariamente pare no equilíbrio, mas que a força tenta reduzir o afastamento em relação a ele.",
      "No equilíbrio, a força resultante pode ser zero, mas a velocidade pode ser máxima. Nas extremidades, a velocidade é zero por um instante, mas a força restauradora é máxima em módulo. Essa diferença entre força, velocidade e posição é uma das chaves do tema.",
    ],
    diagram: {
      kind: "spring",
      title: "massa-mola em torno do equilíbrio",
      caption:
        "A força elástica sempre aponta para a posição de equilíbrio e cresce com o afastamento.",
    },
    bullets: [
      "No equilíbrio: força e aceleração nulas, velocidade máxima.",
      "Nas extremidades: velocidade nula, força e aceleração máximas em módulo.",
      "A amplitude é o afastamento máximo em relação ao equilíbrio.",
      "A distância entre as extremidades é 2A, não A.",
    ],
  },
  {
    icon: Sigma,
    title: "Condição matemática do MHS",
    accent: "bg-blue-700",
    paragraphs: [
      "A forma mais direta de reconhecer um MHS é observar a relação entre aceleração e posição. O movimento é harmônico simples quando a aceleração é proporcional ao deslocamento em relação ao equilíbrio e possui sentido oposto a esse deslocamento.",
      "Essa relação mostra que a aceleração não é constante. Ela muda conforme o corpo se aproxima ou se afasta do equilíbrio. Quanto maior o afastamento, maior o módulo da aceleração. No equilíbrio, a aceleração é nula.",
      "O sinal negativo tem significado físico. Se o corpo está à direita do equilíbrio, a aceleração aponta para a esquerda. Se está à esquerda, a aceleração aponta para a direita. Em todos os casos, a aceleração tenta restaurar o equilíbrio.",
    ],
    formulas: [formulas[0]],
    notes: [
      {
        title: "Assinatura do movimento",
        type: "success",
        body: "Quando você conseguir escrever a aceleração como a = -ω²x, encontrou um MHS.",
      },
    ],
  },
  {
    icon: Brain,
    title: "MHS como aproximação perto de um mínimo de energia",
    accent: "bg-emerald-700",
    paragraphs: [
      "Uma das razões mais profundas para o MHS aparecer tanto é que muitos sistemas físicos têm uma posição de equilíbrio estável associada a um mínimo de energia potencial.",
      "Perto desse mínimo, mesmo que a energia potencial real tenha uma forma complicada, a curva pode ser aproximada por uma parábola. Essa aproximação local transforma o sistema em um oscilador harmônico para pequenos deslocamentos.",
      "A força associada à energia potencial é F = -dU/dx. Se, perto do equilíbrio, a energia se comporta como U(x) ≈ U(0) + Cx²/2, então a força fica F = -Cx. Essa é exatamente a forma de uma força restauradora linear.",
      "Essa ideia explica por que moléculas, estruturas mecânicas, sistemas elétricos, pêndulos de pequena amplitude e vários sistemas físicos reais podem ser tratados como MHS quando estudados perto do equilíbrio. O modelo não é apenas um caso de mola; ele é uma aproximação universal para pequenas oscilações estáveis.",
    ],
    formulas: [
      {
        title: "Potencial perto do equilíbrio",
        formula: String.raw`U(x)\approx U(0)+\frac{1}{2}Cx^2`,
        description:
          "Aproximação da energia potencial perto de um equilíbrio estável. O gráfico localmente se comporta como uma parábola.",
        terms: [
          "U(x): energia potencial em função da posição.",
          "U(0): energia potencial no equilíbrio escolhido como origem.",
          "C: curvatura efetiva da energia potencial perto do mínimo.",
          "x: pequeno deslocamento em relação ao equilíbrio.",
        ],
        interpretation: [
          "Perto de um mínimo de energia, muitos sistemas se comportam como osciladores harmônicos.",
          "Essa é uma das razões pelas quais o MHS aparece em tantos contextos físicos.",
        ],
      },
      {
        title: "Força a partir da energia potencial",
        formula: String.raw`F=-\frac{dU}{dx}`,
        description:
          "A força conservativa é o negativo da derivada da energia potencial. Se U é aproximadamente quadrática, a força é restauradora linear.",
        terms: [
          "F: força associada à energia potencial.",
          "dU/dx: taxa de variação da energia potencial com a posição.",
          "sinal negativo: a força aponta no sentido de diminuir a energia potencial.",
        ],
        interpretation: [
          "Se U(x) ≈ U(0) + Cx²/2, então F = -Cx.",
          "Isso liga equilíbrio estável, energia mínima e Movimento Harmônico Simples.",
        ],
      },
    ],
    diagram: {
      kind: "potentialWell",
      title: "mínimo de energia potencial",
      caption:
        "Perto de um equilíbrio estável, a energia potencial pode ser aproximada por uma parábola, gerando força restauradora linear.",
    },
    notes: [
      {
        title: "Nível alto",
        type: "success",
        body: "Para ITA/IME, essa ideia é valiosa: se a energia tem mínimo e pode ser aproximada por uma parábola, pequenas oscilações tendem a ser harmônicas.",
      },
    ],
  },
  {
    icon: Activity,
    title: "Sistema massa-mola horizontal",
    accent: "bg-cyan-700",
    paragraphs: [
      "O sistema massa-mola horizontal ideal é o exemplo mais limpo de Movimento Harmônico Simples. A mola obedece à Lei de Hooke e a superfície não oferece atrito. Assim, a única força horizontal relevante é a força elástica.",
      "A força elástica é proporcional à deformação da mola e contrária ao deslocamento. Aplicando a Segunda Lei de Newton, chegamos à relação a = -(k/m)x, que tem exatamente a forma de um MHS.",
      "A frequência angular depende da rigidez da mola e da massa. Uma mola mais rígida responde com força maior para o mesmo deslocamento, aumentando a frequência. Uma massa maior possui maior inércia, tornando a oscilação mais lenta.",
      "A demonstração é curta e importante: da Lei de Hooke, F = -kx. Pela Segunda Lei, ma = -kx. Então a = -(k/m)x. Comparando com a assinatura a = -ω²x, aparece ω² = k/m. A partir daí, como T = 2π/ω, surge o período T = 2π√(m/k).",
      "No modelo ideal, o período não depende da amplitude. Isso vale enquanto a mola obedece à Lei de Hooke e enquanto dissipações puderem ser desprezadas.",
    ],
    formulas: [formulas[8], formulas[2]],
    notes: [
      {
        title: "Interpretação física",
        type: "info",
        body: "O período do massa-mola nasce da disputa entre rigidez e inércia: k tenta restaurar rapidamente; m resiste à aceleração.",
      },
    ],
  },
  {
    icon: GitBranch,
    title: "Molas associadas e constante equivalente",
    accent: "bg-indigo-800",
    paragraphs: [
      "Em problemas mais elaborados, a massa pode estar presa a mais de uma mola. Nesses casos, o primeiro passo não é aplicar período imediatamente, mas descobrir qual é a constante restauradora efetiva do conjunto.",
      "Quando molas atuam em paralelo, elas sofrem o mesmo deslocamento e suas forças restauradoras se somam. O sistema fica mais rígido, a frequência angular aumenta e o período diminui.",
      "Quando molas estão em série, a força é a mesma em cada mola, mas a deformação total se reparte entre elas. O sistema fica mais flexível, a frequência angular diminui e o período aumenta.",
      "Depois de encontrar k_eq, o problema volta a ser um massa-mola comum: ω = √(k_eq/m) e T = 2π√(m/k_eq). A dificuldade real costuma estar em reconhecer a associação correta.",
    ],
    formulas: [formulas[12], formulas[13]],
    diagram: {
      kind: "springAssociation",
      title: "molas em paralelo e em série",
      caption:
        "Associações mudam a constante restauradora efetiva e, portanto, alteram o período.",
    },
    notes: [
      {
        title: "Estratégia",
        type: "success",
        body: "Reduza a associação a uma constante equivalente. Depois trate o sistema como um oscilador com k_eq.",
      },
    ],
  },
  {
    icon: RotateCcw,
    title: "Pêndulo simples",
    accent: "bg-emerald-700",
    paragraphs: [
      "O pêndulo simples é formado por uma pequena massa presa a um fio leve e inextensível, oscilando sob ação da gravidade. Para pequenas oscilações, ele realiza aproximadamente MHS.",
      "A força responsável por restaurar o movimento é a componente tangencial do peso. Essa componente vale -mg senθ. Para ângulos pequenos, em radianos, usamos senθ ≈ θ. Como o deslocamento ao longo do arco é aproximadamente x = ℓθ, a força passa a ser proporcional a -x.",
      "Essa aproximação leva à relação a = -(g/ℓ)x. Comparando com a = -ω²x, obtemos ω = √(g/ℓ) e o período T = 2π√(ℓ/g).",
      "A demonstração também explica por que a massa não aparece no período. A força restauradora tangencial é proporcional a m, mas a inércia também é proporcional a m. Na equação ma = F, a massa cancela. O que sobra é a razão entre gravidade e comprimento.",
      "O período do pêndulo simples, para pequenas oscilações, não depende da massa. Também não depende da amplitude enquanto a aproximação de pequenos ângulos continuar válida.",
    ],
    formulas: [formulas[9]],
    diagram: {
      kind: "pendulum",
      title: "força restauradora no pêndulo",
      caption:
        "Para pequenos ângulos, a componente tangencial do peso é aproximadamente proporcional ao deslocamento.",
    },
    notes: [
      {
        title: "Condição de validade",
        type: "warning",
        body: "A fórmula T = 2π√(ℓ/g) depende da aproximação senθ ≈ θ. Para ângulos grandes, o período passa a depender da amplitude.",
      },
    ],
  },
  {
    icon: Atom,
    title: "MHS como projeção do movimento circular uniforme",
    accent: "bg-blue-800",
    paragraphs: [
      "Uma forma muito útil de entender o MHS é enxergá-lo como a projeção de um movimento circular uniforme sobre um diâmetro. Imagine uma partícula girando em uma circunferência de raio A com velocidade angular constante ω.",
      "Se observarmos apenas a projeção horizontal dessa partícula, ela vai e volta entre -A e +A. Essa projeção realiza Movimento Harmônico Simples.",
      "Essa interpretação explica naturalmente por que aparecem seno, cosseno, fase e frequência angular no MHS. A fase do MHS corresponde ao ângulo associado ao movimento circular auxiliar.",
      "Também fica claro por que a velocidade do oscilador é máxima no equilíbrio e nula nas extremidades: isso vem da projeção da velocidade tangencial do movimento circular.",
    ],
    diagram: {
      kind: "mcu",
      title: "projeção do MCU",
      caption:
        "A projeção horizontal de uma partícula em MCU descreve um MHS.",
    },
    notes: [
      {
        title: "Leitura visual",
        type: "info",
        body: "O círculo auxiliar ajuda a interpretar fase inicial, seno, cosseno e defasagens entre posição, velocidade e aceleração.",
      },
    ],
  },
  {
    icon: Calculator,
    title: "Equação horária, fase inicial e escolha entre seno e cosseno",
    accent: "bg-red-700",
    paragraphs: [
      "A posição no MHS pode ser escrita por uma função senoidal ou cossenoidal. A forma x(t) = A cos(ωt + φ₀) é muito usada, mas x(t) = A sen(ωt + φ₀) descreve o mesmo tipo de movimento quando a fase inicial é escolhida corretamente.",
      "A amplitude A é o afastamento máximo em relação ao equilíbrio. A frequência angular ω mede a rapidez com que a fase evolui. A fase inicial φ₀ indica em que ponto do ciclo o corpo estava no instante escolhido como t = 0.",
      "Se o corpo começa na extremidade positiva com velocidade nula, o cosseno sem fase inicial costuma ser a escolha mais simples. Se começa no equilíbrio indo para o sentido positivo, o seno sem fase inicial costuma ser mais direto.",
      "Quando a fase inicial não é evidente, o procedimento deve ser cuidadoso: use a posição inicial para encontrar os possíveis valores de φ₀ e use o sinal da velocidade inicial para escolher o quadrante correto.",
    ],
    formulas: [formulas[3]],
    bullets: [
      "Use x(0) = A cosφ₀ para obter cosφ₀ = x(0)/A.",
      "Lembre que v(0) = -Aω senφ₀.",
      "Se v(0) < 0, então senφ₀ > 0.",
      "Se v(0) > 0, então senφ₀ < 0.",
      "A posição inicial pode dar dois ângulos possíveis; a velocidade inicial escolhe o correto.",
    ],
    notes: [
      {
        title: "Cuidado",
        type: "warning",
        body: "A posição inicial sozinha não determina completamente o movimento. Em uma mesma posição, o corpo pode estar indo ou voltando.",
      },
    ],
  },
  {
    icon: Gauge,
    title: "Velocidade e aceleração no MHS",
    accent: "bg-orange-700",
    paragraphs: [
      "A velocidade é obtida derivando a posição em relação ao tempo. Se a posição é cossenoidal, a velocidade aparece como uma função senoidal defasada.",
      "A velocidade é máxima em módulo quando o corpo passa pelo equilíbrio. Nas extremidades, ela é zero, pois o corpo para momentaneamente antes de inverter o sentido do movimento.",
      "A aceleração é a derivada da velocidade e também pode ser escrita diretamente como a = -ω²x. Essa relação mostra que a aceleração está em oposição de fase com a posição.",
      "No equilíbrio, a aceleração é nula. Nas extremidades, o módulo da aceleração é máximo. Esse é um dos pontos mais importantes do tema, pois muita gente confunde velocidade máxima com aceleração máxima.",
    ],
    formulas: [formulas[4], formulas[5], formulas[6], formulas[7]],
    notes: [
      {
        title: "Resumo físico",
        type: "success",
        body: "Velocidade máxima no equilíbrio. Aceleração máxima nas extremidades. Trocar isso é abrir uma avenida para erro.",
      },
    ],
  },
  {
    icon: Zap,
    title: "Energia no MHS",
    accent: "bg-slate-950",
    paragraphs: [
      "A análise energética do MHS é uma das ferramentas mais importantes para resolver questões sem precisar encontrar o instante do movimento. Em um sistema massa-mola ideal, a energia mecânica total se conserva.",
      "Nas extremidades, a velocidade é zero e a energia está na forma potencial elástica. No equilíbrio, a elongação é zero e a energia está na forma cinética. Entre esses pontos, a energia se divide continuamente entre cinética e potencial.",
      "A energia total depende da amplitude ao quadrado. Isso significa que dobrar a amplitude quadruplica a energia mecânica do oscilador.",
      "Em uma posição intermediária, como x = A/2, a energia potencial é apenas um quarto da energia total, pois depende de x². O restante, três quartos da energia total, está na forma cinética. Essa leitura é muito útil em questões conceituais e numéricas.",
      "Esse caso mostra uma armadilha recorrente: metade da amplitude não significa metade da energia potencial. Como a energia elástica depende do quadrado da posição, a distribuição de energia não é linear com x.",
    ],
    formulas: [
      formulas[10],
      formulas[11],
      {
        title: "Energia em x = A/2",
        formula: String.raw`x=\frac{A}{2}\quad\Rightarrow\quad E_p=\frac{E}{4}\ \text{ e }\ E_c=\frac{3E}{4}`,
        description:
          "Resultado clássico para mostrar que a energia potencial elástica cresce com o quadrado da posição.",
        terms: [
          "A: amplitude do MHS.",
          "E_p: energia potencial elástica.",
          "E_c: energia cinética.",
          "E: energia mecânica total.",
        ],
        interpretation: [
          "Metade da amplitude não significa metade da energia potencial.",
          "Como E_p depende de x², em x = A/2 ela vale apenas um quarto da energia total.",
        ],
      },
    ],
    diagram: {
      kind: "energy",
      title: "troca de energia",
      caption:
        "Energia potencial máxima nas extremidades e energia cinética máxima no equilíbrio.",
    },
    notes: [
      {
        title: "Atalho útil",
        type: "info",
        body: "Se a questão não pede tempo, energia costuma ser o caminho mais limpo.",
      },
    ],
  },
  {
    icon: LineChart,
    title: "Gráficos de posição, velocidade e aceleração",
    accent: "bg-cyan-700",
    paragraphs: [
      "Os gráficos do MHS guardam praticamente todas as informações importantes do movimento. A partir de x(t), é possível obter amplitude, período, frequência, frequência angular, fase inicial e até estimativas de velocidade e aceleração máximas.",
      "O gráfico da posição é senoidal ou cossenoidal. O gráfico da velocidade está defasado em relação ao da posição. O gráfico da aceleração está em oposição de fase com a posição.",
      "Quando x é máximo positivo, a aceleração é máxima negativa e a velocidade é zero. Quando x passa pelo equilíbrio, a aceleração é zero e a velocidade tem módulo máximo.",
      "Em provas, gráficos são usados para testar interpretação, não apenas cálculo. O aluno precisa saber ler amplitude, período e estado inicial do movimento.",
    ],
    diagram: {
      kind: "graphs",
      title: "x(t), v(t) e a(t)",
      caption:
        "Os três gráficos têm o mesmo período, mas aparecem defasados entre si.",
    },
    notes: [
      {
        title: "Leitura de gráfico",
        type: "success",
        body: "Uma oscilação completa exige voltar à mesma posição com a mesma velocidade, não apenas passar pelo mesmo ponto.",
      },
    ],
  },
  {
    icon: Waves,
    title: "MHS vertical",
    accent: "bg-purple-700",
    paragraphs: [
      "No sistema massa-mola vertical, a gravidade atua junto com a força elástica. Isso desloca a posição de equilíbrio, mas não altera o período da oscilação em torno desse novo equilíbrio.",
      "No equilíbrio estático, a força elástica equilibra o peso. Assim, kx₀ = mg, de onde x₀ = mg/k. Essa deformação indica quanto a mola alonga até sustentar a massa em repouso.",
      "Depois que usamos a nova posição de equilíbrio como referência, o movimento em torno dela é descrito pela mesma relação do massa-mola horizontal: T = 2π√(m/k).",
      "A armadilha é medir a elongação dinâmica a partir do comprimento natural da mola. Para o MHS vertical, a origem correta é a posição de equilíbrio, não a posição natural.",
      "Existem duas grandezas diferentes: a deformação estática x₀ = mg/k, que localiza o novo equilíbrio, e a elongação dinâmica x, que mede o deslocamento em relação a esse equilíbrio. Misturar essas duas quantidades é o erro clássico do massa-mola vertical.",
    ],
    diagram: {
      kind: "verticalSpring",
      title: "equilíbrio no massa-mola vertical",
      caption:
        "A gravidade desloca o equilíbrio, mas a oscilação ocorre em torno dele.",
    },
    formulas: [
      {
        title: "Deformação de equilíbrio",
        formula: String.raw`x_0=\frac{mg}{k}`,
        description:
          "Alongamento estático da mola vertical até que a força elástica equilibre o peso.",
        terms: ["m: massa.", "g: gravidade.", "k: constante elástica."],
        interpretation: [
          "Esse valor define a nova posição de equilíbrio.",
          "A oscilação deve ser medida em torno dessa posição.",
        ],
      },
      formulas[8],
    ],
  },
  {
    icon: Repeat2,
    title: "Oscilações amortecidas, forçadas e ressonância",
    accent: "bg-emerald-700",
    paragraphs: [
      "O MHS ideal conserva energia e mantém amplitude constante. Sistemas reais, porém, costumam perder energia por atrito, resistência do ar ou dissipações internas. Quando a amplitude diminui com o tempo, temos uma oscilação amortecida.",
      "Uma oscilação forçada ocorre quando uma força externa periódica atua sobre o sistema. Se essa força externa tem frequência próxima da frequência natural do oscilador, a transferência de energia pode se tornar muito eficiente.",
      "Esse fenômeno é chamado de ressonância. Ele aparece em balanços, instrumentos musicais, estruturas mecânicas, circuitos elétricos e muitos outros sistemas.",
      "Nesta página, ressonância entra como ideia física, não como desenvolvimento matemático completo. O ponto importante é reconhecer que ritmo importa: uma força pequena, aplicada repetidamente no tempo certo, pode gerar grande amplitude.",
    ],
    notes: [
      {
        title: "Conexão com Ondulatória",
        type: "info",
        body: "MHS é a base para entender vibração, ressonância, ondas estacionárias e fenômenos ondulatórios em geral.",
      },
    ],
  },
  {
    icon: Target,
    title: "Como resolver uma questão de MHS",
    accent: "bg-blue-700",
    paragraphs: [
      "O método mais seguro é começar pela física do sistema, não pela fórmula. Primeiro identifique a posição de equilíbrio. Depois escolha a origem nessa posição e escreva o deslocamento x a partir dela.",
      "Em seguida, analise a força resultante para um pequeno deslocamento. Se a força puder ser escrita como F = -Cx, com C positivo, o sistema realiza MHS. A constante C pode ser uma constante elástica, uma constante equivalente de molas, uma aproximação gravitacional ou uma constante efetiva criada pela geometria do problema.",
      "Depois de encontrar C, use ω = √(C/m). A partir de ω, vêm o período, a frequência, a velocidade máxima, a aceleração máxima e as equações horárias.",
      "Se a questão não pede o instante, energia costuma ser o caminho mais limpo. Se envolve gráfico, extraia primeiro A e T. Se envolve fase inicial, use x(0) e v(0), pois a posição sozinha não define o movimento completo.",
    ],
    bullets: [
      "Identifique a posição de equilíbrio.",
      "Meça x a partir do equilíbrio, não de uma posição qualquer.",
      "Escreva a força resultante para um pequeno deslocamento.",
      "Procure a forma F = -Cx.",
      "Use ω = √(C/m).",
      "Se não precisar do tempo, tente energia.",
      "Se houver gráfico, extraia A e T antes de fazer contas.",
      "Se houver fase inicial, use posição e velocidade iniciais.",
    ],
    formulas: [
      {
        title: "Equação diferencial do MHS",
        formula: String.raw`\frac{d^2x}{dt^2}+\omega^2x=0`,
        description:
          "Forma diferencial do oscilador harmônico simples. Suas soluções são senoidais ou cossenoidais.",
        terms: [
          "d²x/dt²: aceleração.",
          "ω²x: termo restaurador proporcional à posição.",
        ],
        interpretation: [
          "Se a equação do movimento chegar nessa forma, o movimento é MHS.",
          "A solução envolve seno e cosseno.",
        ],
      },
    ],
    notes: [
      {
        title: "Roteiro de prova",
        type: "success",
        body: "O erro comum é aplicar fórmula antes de definir o equilíbrio. Em MHS, a origem correta quase sempre decide o problema.",
      },
    ],
  },
];

const examples: ExampleItem[] = [
  {
    title: "Leitura de amplitude, período e frequência",
    level: "básico conceitual",
    statement:
      "Um gráfico de posição mostra um corpo oscilando entre +0,20 m e -0,20 m. O movimento se repete a cada 4,0 s. Determine amplitude, período, frequência e frequência angular.",
    idea:
      "A amplitude é o afastamento máximo em relação ao equilíbrio, não a distância total entre extremos.",
    steps: [
      "Como o corpo oscila entre +0,20 m e -0,20 m, a amplitude é A = 0,20 m.",
      "O período é o tempo de repetição: T = 4,0 s.",
      "A frequência é f = 1/T = 1/4,0 = 0,25 Hz.",
      "A frequência angular é ω = 2π/T = 2π/4,0 = π/2 rad/s.",
    ],
    answer:
      "A = 0,20 m, T = 4,0 s, f = 0,25 Hz e ω = π/2 rad/s.",
    test:
      "A questão queria testar leitura de gráfico e a diferença entre amplitude e distância total entre extremos.",
  },
  {
    title: "Sistema massa-mola",
    level: "aplicação direta",
    statement:
      "Uma massa de 0,50 kg está presa a uma mola horizontal de constante elástica 200 N/m. Determine a frequência angular, o período e a frequência.",
    idea:
      "Para massa-mola ideal, use ω = √(k/m), depois relacione ω com T e f.",
    steps: [
      "Calcule ω = √(k/m).",
      "ω = √(200/0,50) = √400 = 20 rad/s.",
      "O período é T = 2π/ω = 2π/20 = π/10 s.",
      "A frequência é f = ω/(2π) = 20/(2π) = 10/π Hz.",
    ],
    answer:
      "ω = 20 rad/s, T = π/10 s e f = 10/π Hz.",
    test:
      "A questão queria testar a relação entre rigidez, massa, frequência angular, período e frequência.",
  },
  {
    title: "Equação horária simples",
    level: "leitura algébrica",
    statement:
      "Um corpo realiza MHS segundo x(t) = 0,10 cos(4πt), com x em metros e t em segundos. Determine amplitude, frequência angular, período, frequência, posição inicial e velocidade inicial.",
    idea:
      "Compare a equação dada com x(t) = A cos(ωt + φ₀).",
    steps: [
      "Da equação, A = 0,10 m.",
      "Da equação, ω = 4π rad/s.",
      "O período é T = 2π/ω = 2π/(4π) = 0,50 s.",
      "A frequência é f = 1/T = 2,0 Hz.",
      "A posição inicial é x(0) = 0,10 cos(0) = 0,10 m.",
      "Como v(t) = -Aω sen(ωt), então v(0) = 0.",
    ],
    answer:
      "A = 0,10 m, ω = 4π rad/s, T = 0,50 s, f = 2,0 Hz, x(0) = 0,10 m e v(0) = 0.",
    test:
      "A questão queria testar leitura da equação horária e interpretação das condições iniciais.",
  },
  {
    title: "Fase inicial não trivial",
    level: "intermediário importante",
    statement:
      "Um oscilador tem amplitude A e frequência angular ω. No instante t = 0, sua posição é x(0) = A/2 e sua velocidade é negativa. Escreva uma possível equação horária na forma x(t) = A cos(ωt + φ₀).",
    idea:
      "A posição inicial determina cosφ₀ = 1/2. A velocidade negativa decide qual dos ângulos possíveis deve ser usado.",
    steps: [
      "Em t = 0: x(0) = A cosφ₀.",
      "Como x(0) = A/2, temos cosφ₀ = 1/2.",
      "As possibilidades principais são φ₀ = π/3 ou φ₀ = -π/3.",
      "A velocidade é v(t) = -Aω sen(ωt + φ₀).",
      "Em t = 0: v(0) = -Aω senφ₀.",
      "Para v(0) ser negativa, precisamos senφ₀ > 0.",
      "Logo, escolhemos φ₀ = π/3.",
    ],
    answer:
      "Uma equação possível é x(t) = A cos(ωt + π/3).",
    test:
      "A questão queria testar que a posição inicial sozinha não determina a fase. O sentido da velocidade decide entre fases possíveis.",
  },
  {
    title: "Velocidade máxima",
    level: "aplicação direta",
    statement:
      "Um oscilador tem amplitude 0,25 m e frequência angular 8,0 rad/s. Determine sua velocidade máxima.",
    idea:
      "A velocidade máxima ocorre no equilíbrio e vale v_max = Aω.",
    steps: [
      "Use v_max = Aω.",
      "Substitua A = 0,25 m e ω = 8,0 rad/s.",
      "v_max = 0,25 · 8,0 = 2,0 m/s.",
    ],
    answer:
      "A velocidade máxima é 2,0 m/s.",
    test:
      "A questão queria testar a relação entre amplitude, frequência angular e velocidade máxima.",
  },
  {
    title: "Aceleração máxima",
    level: "aplicação direta",
    statement:
      "Um corpo realiza MHS com amplitude 0,15 m e frequência angular 10 rad/s. Determine a aceleração máxima em módulo.",
    idea:
      "A aceleração máxima ocorre nas extremidades, onde |x| = A.",
    steps: [
      "Use a_max = ω²A.",
      "Substitua ω = 10 rad/s e A = 0,15 m.",
      "a_max = 10² · 0,15 = 100 · 0,15 = 15 m/s².",
    ],
    answer:
      "A aceleração máxima em módulo é 15 m/s².",
    test:
      "A questão queria testar que a aceleração máxima ocorre nas extremidades, não no equilíbrio.",
  },
  {
    title: "Energia no MHS",
    level: "intermediário",
    statement:
      "Uma massa de 0,20 kg realiza MHS com amplitude 0,10 m e frequência angular 20 rad/s. Determine a energia mecânica total, a velocidade máxima e a energia cinética no equilíbrio.",
    idea:
      "Use E = (1/2)mω²A² e v_max = Aω. No equilíbrio, toda a energia é cinética.",
    steps: [
      "Calcule E = (1/2)mω²A².",
      "E = (1/2) · 0,20 · 20² · 0,10².",
      "E = 0,10 · 400 · 0,01 = 0,40 J.",
      "v_max = Aω = 0,10 · 20 = 2,0 m/s.",
      "No equilíbrio, E_c = E = 0,40 J.",
    ],
    answer:
      "E = 0,40 J, v_max = 2,0 m/s e E_c no equilíbrio é 0,40 J.",
    test:
      "A questão queria testar conservação de energia e velocidade máxima no equilíbrio.",
  },
  {
    title: "Energia em posição intermediária",
    level: "intermediário conceitual",
    statement:
      "Em um sistema massa-mola ideal, a amplitude é A. Determine a fração da energia mecânica que está na forma potencial elástica quando x = A/2.",
    idea:
      "A energia potencial elástica depende de x², enquanto a energia total depende de A².",
    steps: [
      "A energia total é E = (1/2)kA².",
      "Na posição x = A/2, a energia potencial é E_p = (1/2)k(A/2)².",
      "E_p = (1/2)kA²/4.",
      "Comparando com E = (1/2)kA², temos E_p = E/4.",
      "Logo, a energia cinética é 3E/4.",
    ],
    answer:
      "Em x = A/2, 1/4 da energia está como potencial elástica e 3/4 está como cinética.",
    test:
      "A questão queria testar que energia potencial elástica depende do quadrado da posição, não da posição diretamente.",
  },
  {
    title: "Pêndulo simples",
    level: "aplicação direta",
    statement:
      "Um pêndulo simples de comprimento 1,0 m oscila com pequena amplitude em um local onde g = 10 m/s². Determine o período.",
    idea:
      "Para pequenas oscilações, use T = 2π√(ℓ/g).",
    steps: [
      "Substitua ℓ = 1,0 m e g = 10 m/s².",
      "T = 2π√(1,0/10).",
      "T = 2π√0,1.",
      "Como √0,1 ≈ 0,316, T ≈ 6,28 · 0,316 ≈ 1,98 s.",
    ],
    answer:
      "O período é aproximadamente 2,0 s.",
    test:
      "A questão queria testar a fórmula do pêndulo simples e o fato de o período não depender da massa.",
  },
  {
    title: "Massa-mola vertical",
    level: "intermediário",
    statement:
      "Uma massa de 0,50 kg é presa a uma mola vertical de constante 100 N/m. Use g = 10 m/s². Determine a deformação de equilíbrio e o período de oscilação em torno do equilíbrio.",
    idea:
      "A gravidade define o equilíbrio estático, mas o período em torno do equilíbrio continua sendo o do massa-mola.",
    steps: [
      "No equilíbrio: kx₀ = mg.",
      "x₀ = mg/k = (0,50 · 10)/100 = 0,05 m.",
      "O período é T = 2π√(m/k).",
      "T = 2π√(0,50/100) = 2π√0,005.",
      "Como √0,005 ≈ 0,0707, então T ≈ 0,44 s.",
    ],
    answer:
      "x₀ = 0,05 m e T ≈ 0,44 s.",
    test:
      "A questão queria testar a diferença entre deformação estática e oscilação em torno do equilíbrio.",
  },
  {
    title: "Molas em paralelo",
    level: "intermediário",
    statement:
      "Uma massa m está presa a duas molas em paralelo, de constantes k₁ = 100 N/m e k₂ = 300 N/m. Determine a constante equivalente e a frequência angular em função de m.",
    idea:
      "Em paralelo, as forças restauradoras se somam para o mesmo deslocamento.",
    steps: [
      "Para molas em paralelo: k_eq = k₁ + k₂.",
      "k_eq = 100 + 300 = 400 N/m.",
      "A frequência angular é ω = √(k_eq/m).",
      "Logo, ω = √(400/m).",
    ],
    answer:
      "k_eq = 400 N/m e ω = √(400/m).",
    test:
      "A questão queria testar associação de molas antes de aplicar a fórmula do MHS.",
  },
  {
    title: "Força restauradora efetiva",
    level: "nível prova difícil",
    statement:
      "Um corpo de massa 2,0 kg move-se sob ação de uma força resultante F = -18x, com F em newtons e x em metros. Mostre que o movimento é MHS e determine a frequência angular e o período.",
    idea:
      "Se a força tem a forma F = -Cx, o movimento é MHS, com ω = √(C/m).",
    steps: [
      "Compare F = -18x com F = -Cx.",
      "Assim, C = 18 N/m.",
      "Pela Segunda Lei: ma = -18x.",
      "Como m = 2,0 kg, temos a = -9x.",
      "Comparando com a = -ω²x, obtemos ω² = 9.",
      "Logo, ω = 3 rad/s.",
      "O período é T = 2π/ω = 2π/3 s.",
    ],
    answer:
      "O movimento é MHS, com ω = 3 rad/s e T = 2π/3 s.",
    test:
      "A questão queria testar reconhecimento de MHS escondido por meio de uma força restauradora efetiva.",
  },
];

const traps = [
  "Achar que qualquer movimento de vai e volta é MHS.",
  "Confundir amplitude com a distância total entre as extremidades.",
  "Usar a posição natural da mola como origem no MHS vertical.",
  "Esquecer que o sinal negativo em a = -ω²x tem significado físico.",
  "Achar que velocidade máxima ocorre nas extremidades.",
  "Achar que aceleração máxima ocorre no equilíbrio.",
  "Confundir período com frequência.",
  "Usar graus na fase quando as equações usam radianos.",
  "Achar que a massa altera o período do pêndulo simples ideal.",
  "Achar que a amplitude altera o período no MHS ideal.",
  "Aplicar a fórmula do pêndulo para ângulos grandes sem cuidado.",
  "Usar k de uma mola individual quando o sistema tem molas associadas.",
  "Esquecer que posição não determina sozinha o sentido da velocidade.",
  "Confundir energia potencial máxima com energia cinética máxima.",
  "Esquecer que, em x = A/2, a energia potencial é E/4, não E/2.",
  "Determinar fase inicial usando só posição e ignorando o sentido da velocidade.",
];

const checklist = [
  "Sei explicar o que é equilíbrio estável?",
  "Sei diferenciar oscilação qualquer de MHS?",
  "Sei reconhecer a condição a = -ω²x?",
  "Sei escrever uma força restauradora na forma F = -Cx?",
  "Sei interpretar amplitude, período, frequência e frequência angular?",
  "Sei usar a equação horária com fase inicial?",
  "Sei determinar velocidade e aceleração a partir da posição?",
  "Sei dizer onde velocidade e aceleração são máximas?",
  "Sei resolver sistema massa-mola horizontal?",
  "Sei resolver massa-mola vertical usando o equilíbrio correto?",
  "Sei trabalhar com molas em série e paralelo?",
  "Sei resolver pêndulo simples para pequenas oscilações?",
  "Sei usar energia para encontrar velocidade em posição intermediária?",
  "Sei interpretar gráficos de x(t), v(t) e a(t)?",
  "Sei reconhecer MHS escondido em uma força efetiva?",
  "Sei explicar por que pequenos deslocamentos perto de um mínimo de energia podem gerar MHS?",
  "Sei montar um roteiro de resolução antes de escolher fórmula?",
];

function decimalComma(value: number, digits = 2) {
  if (!Number.isFinite(value)) return "∞";
  const fixed = value.toFixed(digits);
  return fixed.replace(".", ",").replace(/,?0+$/, "");
}

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
      Icon: Sparkles,
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
              {item.terms.map((term) => (
                <li key={term} className="flex gap-2 text-sm leading-6 text-slate-700">
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
              {item.interpretation.map((line) => (
                <li key={line} className="flex gap-2 text-sm leading-6 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {item.derivation ? (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <h4 className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-blue-950">
              Demonstração e leitura de prova
            </h4>
            <div className="space-y-3">
              {item.derivation.map((line) => (
                <p key={line} className="text-sm leading-7 text-slate-700">
                  {line}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {item.warning ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-900">
            {item.warning}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function MhsDiagram({ diagram }: { diagram: NonNullable<TheorySection["diagram"]> }) {
  return (
    <div className="my-7 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200 bg-slate-950 px-6 py-4">
        <h3 className="text-lg font-black text-white">
          Diagrama visual: {diagram.title}
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-300">{diagram.caption}</p>
      </div>

      <div className="overflow-x-auto p-5 md:p-7">
        <div className="min-w-[720px] rounded-2xl bg-white p-5">
          {diagram.kind === "spring" && <SpringDiagram />}
          {diagram.kind === "mcu" && <McuProjectionDiagram />}
          {diagram.kind === "graphs" && <GraphsDiagram />}
          {diagram.kind === "energy" && <EnergyDiagram />}
          {diagram.kind === "pendulum" && <PendulumDiagram />}
          {diagram.kind === "verticalSpring" && <VerticalSpringDiagram />}
          {diagram.kind === "springAssociation" && <SpringAssociationDiagram />}
          {diagram.kind === "potentialWell" && <PotentialWellDiagram />}
        </div>
      </div>
    </div>
  );
}


function PotentialWellDiagram() {
  return (
    <svg viewBox="0 0 820 330" className="h-auto w-full">
      <defs>
        <marker id="potentialArrow" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#dc2626" />
        </marker>
      </defs>

      <line x1="80" y1="260" x2="760" y2="260" stroke="#0f172a" strokeWidth="4" />
      <line x1="120" y1="285" x2="120" y2="40" stroke="#0f172a" strokeWidth="4" />
      <text x="745" y="288" className="fill-slate-700 text-[16px] font-black">x</text>
      <text x="88" y="35" className="fill-slate-700 text-[16px] font-black">U</text>

      <path
        d="M155 80 C250 260, 520 260, 705 80"
        fill="none"
        stroke="#2563eb"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <line x1="430" y1="72" x2="430" y2="268" stroke="#64748b" strokeWidth="3" strokeDasharray="8 8" />
      <circle cx="430" cy="238" r="10" fill="#16a34a" />
      <text x="384" y="305" className="fill-emerald-700 text-[16px] font-black">equilíbrio estável</text>

      <circle cx="545" cy="178" r="9" fill="#dc2626" />
      <line x1="545" y1="178" x2="495" y2="205" stroke="#dc2626" strokeWidth="5" markerEnd="url(#potentialArrow)" />
      <text x="558" y="170" className="fill-red-700 text-[16px] font-black">F aponta para o mínimo</text>

      <text x="195" y="52" className="fill-slate-950 text-[20px] font-black">
        perto do mínimo, a curva parece uma parábola
      </text>
      <text x="230" y="112" className="fill-blue-700 text-[17px] font-black">
        U(x) ≈ U(0) + Cx²/2
      </text>
    </svg>
  );
}

function SpringCoil({
  x,
  y,
  length,
  amplitude = 18,
  turns = 8,
}: {
  x: number;
  y: number;
  length: number;
  amplitude?: number;
  turns?: number;
}) {
  const points: string[] = [`${x},${y}`];
  const step = length / (turns * 2);
  for (let i = 1; i < turns * 2; i++) {
    points.push(`${x + i * step},${y + (i % 2 === 0 ? -amplitude : amplitude)}`);
  }
  points.push(`${x + length},${y}`);
  return <polyline points={points.join(" ")} fill="none" stroke="#0f172a" strokeWidth="5" strokeLinejoin="round" />;
}

function SpringDiagram() {
  return (
    <svg viewBox="0 0 820 300" className="h-auto w-full">
      <defs>
        <marker id="springArrowLeft" markerWidth="12" markerHeight="12" refX="3" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M9,0 L9,6 L0,3 z" fill="#dc2626" />
        </marker>
        <marker id="springArrowRight" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
        </marker>
      </defs>

      <rect x="45" y="70" width="22" height="145" rx="4" fill="#0f172a" />
      <SpringCoil x={70} y={145} length={280} />
      <rect x="350" y="102" width="92" height="86" rx="16" fill="#dbeafe" stroke="#0f172a" strokeWidth="5" />
      <text x="382" y="153" className="fill-slate-950 text-[22px] font-black">m</text>

      <line x1="80" y1="245" x2="725" y2="245" stroke="#94a3b8" strokeWidth="3" />
      <line x1="396" y1="60" x2="396" y2="255" stroke="#64748b" strokeWidth="3" strokeDasharray="8 8" />
      <text x="360" y="280" className="fill-slate-700 text-[16px] font-black">equilíbrio</text>

      <line x1="530" y1="145" x2="440" y2="145" stroke="#dc2626" strokeWidth="6" markerEnd="url(#springArrowLeft)" />
      <text x="495" y="122" className="fill-red-700 text-[16px] font-black">F restauradora</text>

      <line x1="396" y1="238" x2="535" y2="238" stroke="#2563eb" strokeWidth="5" markerEnd="url(#springArrowRight)" />
      <text x="455" y="227" className="fill-blue-700 text-[16px] font-black">x</text>

      <text x="82" y="38" className="fill-slate-950 text-[20px] font-black">deslocamento para a direita → força para a esquerda</text>
    </svg>
  );
}

function McuProjectionDiagram() {
  const cx = 245;
  const cy = 150;
  const r = 90;
  const angle = Math.PI / 4;
  const px = cx + r * Math.cos(angle);
  const py = cy - r * Math.sin(angle);

  return (
    <svg viewBox="0 0 820 320" className="h-auto w-full">
      <circle cx={cx} cy={cy} r={r} fill="#eff6ff" stroke="#0f172a" strokeWidth="5" />
      <line x1={cx - r - 30} y1={cy} x2={cx + r + 30} y2={cy} stroke="#64748b" strokeWidth="3" />
      <line x1={cx} y1={cy - r - 30} x2={cx} y2={cy + r + 30} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 8" />
      <line x1={cx} y1={cy} x2={px} y2={py} stroke="#2563eb" strokeWidth="5" />
      <circle cx={px} cy={py} r="10" fill="#2563eb" />
      <line x1={px} y1={py} x2={px} y2={cy} stroke="#dc2626" strokeWidth="4" strokeDasharray="8 8" />
      <circle cx={px} cy={cy} r="9" fill="#dc2626" />
      <text x="130" y="285" className="fill-slate-700 text-[16px] font-black">círculo auxiliar</text>
      <text x="318" y="170" className="fill-red-700 text-[16px] font-black">projeção em MHS</text>

      <line x1="465" y1={cy} x2="750" y2={cy} stroke="#0f172a" strokeWidth="4" />
      <line x1="610" y1="70" x2="610" y2="230" stroke="#94a3b8" strokeWidth="3" strokeDasharray="8 8" />
      <circle cx="610" cy={cy} r="8" fill="#0f172a" />
      <circle cx="710" cy={cy} r="8" fill="#dc2626" />
      <circle cx="510" cy={cy} r="8" fill="#dc2626" />
      <text x="497" y="255" className="fill-slate-700 text-[15px] font-black">-A</text>
      <text x="604" y="255" className="fill-slate-700 text-[15px] font-black">0</text>
      <text x="703" y="255" className="fill-slate-700 text-[15px] font-black">+A</text>
      <text x="484" y="35" className="fill-slate-950 text-[20px] font-black">a projeção oscila entre -A e +A</text>
    </svg>
  );
}

function GraphsDiagram() {
  const makeWave = (y0: number, amp: number, phase: number, color: string) => {
    const points = Array.from({ length: 160 }, (_, i) => {
      const x = 55 + i * 4.4;
      const y = y0 - Math.cos(i / 13 + phase) * amp;
      return `${i === 0 ? "M" : "L"}${x} ${y}`;
    }).join(" ");
    return <path d={points} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />;
  };

  return (
    <svg viewBox="0 0 820 360" className="h-auto w-full">
      {[85, 180, 275].map((y) => (
        <line key={y} x1="55" y1={y} x2="760" y2={y} stroke="#cbd5e1" strokeWidth="2" />
      ))}

      {makeWave(85, 35, 0, "#2563eb")}
      {makeWave(180, 35, Math.PI / 2, "#16a34a")}
      {makeWave(275, 35, Math.PI, "#dc2626")}

      <text x="25" y="90" className="fill-blue-700 text-[18px] font-black">x(t)</text>
      <text x="25" y="185" className="fill-green-700 text-[18px] font-black">v(t)</text>
      <text x="25" y="280" className="fill-red-700 text-[18px] font-black">a(t)</text>
      <text x="340" y="335" className="fill-slate-700 text-[16px] font-black">mesmo período, fases diferentes</text>
    </svg>
  );
}

function EnergyDiagram() {
  return (
    <svg viewBox="0 0 820 320" className="h-auto w-full">
      <line x1="90" y1="170" x2="730" y2="170" stroke="#0f172a" strokeWidth="4" />
      <line x1="410" y1="70" x2="410" y2="245" stroke="#94a3b8" strokeWidth="3" strokeDasharray="8 8" />

      {[
        { x: 130, label: "-A", ep: "Ep máx", ec: "Ec = 0" },
        { x: 410, label: "0", ep: "Ep = 0", ec: "Ec máx" },
        { x: 690, label: "+A", ep: "Ep máx", ec: "Ec = 0" },
      ].map((item) => (
        <g key={item.label}>
          <circle cx={item.x} cy="170" r="12" fill={item.label === "0" ? "#16a34a" : "#dc2626"} />
          <text x={item.x - 10} y="205" className="fill-slate-950 text-[16px] font-black">{item.label}</text>
          <rect x={item.x - 70} y="65" width="140" height="70" rx="18" fill={item.label === "0" ? "#dcfce7" : "#fee2e2"} stroke={item.label === "0" ? "#16a34a" : "#dc2626"} />
          <text x={item.x - 42} y="95" className="fill-slate-950 text-[14px] font-black">{item.ep}</text>
          <text x={item.x - 42} y="118" className="fill-slate-700 text-[14px] font-bold">{item.ec}</text>
        </g>
      ))}

      <text x="245" y="280" className="fill-slate-700 text-[16px] font-black">a energia total permanece constante no MHS ideal</text>
    </svg>
  );
}

function PendulumDiagram() {
  return (
    <svg viewBox="0 0 820 330" className="h-auto w-full">
      <defs>
        <marker id="pendArrow" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#dc2626" />
        </marker>
      </defs>

      <line x1="410" y1="35" x2="410" y2="275" stroke="#94a3b8" strokeWidth="3" strokeDasharray="8 8" />
      <line x1="410" y1="35" x2="535" y2="235" stroke="#0f172a" strokeWidth="5" />
      <circle cx="535" cy="235" r="28" fill="#dbeafe" stroke="#0f172a" strokeWidth="5" />
      <path d="M410 90 A80 80 0 0 1 455 105" fill="none" stroke="#2563eb" strokeWidth="4" />
      <text x="460" y="105" className="fill-blue-700 text-[18px] font-black">θ</text>
      <line x1="535" y1="235" x2="535" y2="295" stroke="#64748b" strokeWidth="5" />
      <text x="548" y="285" className="fill-slate-700 text-[16px] font-black">mg</text>
      <line x1="535" y1="235" x2="470" y2="270" stroke="#dc2626" strokeWidth="5" markerEnd="url(#pendArrow)" />
      <text x="445" y="295" className="fill-red-700 text-[16px] font-black">componente restauradora</text>
      <text x="250" y="45" className="fill-slate-950 text-[20px] font-black">para pequenos ângulos: senθ ≈ θ</text>
    </svg>
  );
}

function VerticalSpringDiagram() {
  return (
    <svg viewBox="0 0 820 350" className="h-auto w-full">
      <line x1="210" y1="45" x2="610" y2="45" stroke="#0f172a" strokeWidth="8" />
      <SpringCoil x={390} y={55} length={190} amplitude={16} turns={7} />
      <g transform="rotate(90 485 150)">
        <SpringCoil x={390} y={150} length={190} amplitude={16} turns={7} />
      </g>
      <rect x="440" y="230" width="90" height="70" rx="16" fill="#dbeafe" stroke="#0f172a" strokeWidth="5" />
      <line x1="560" y1="65" x2="700" y2="65" stroke="#94a3b8" strokeWidth="3" strokeDasharray="8 8" />
      <line x1="560" y1="265" x2="700" y2="265" stroke="#16a34a" strokeWidth="4" />
      <text x="610" y="55" className="fill-slate-700 text-[15px] font-black">posição natural</text>
      <text x="604" y="255" className="fill-emerald-700 text-[15px] font-black">equilíbrio</text>
      <line x1="675" y1="65" x2="675" y2="265" stroke="#2563eb" strokeWidth="4" />
      <text x="690" y="170" className="fill-blue-700 text-[18px] font-black">x₀ = mg/k</text>
      <text x="155" y="325" className="fill-slate-700 text-[16px] font-black">a oscilação deve ser medida em torno do equilíbrio deslocado</text>
    </svg>
  );
}

function SpringAssociationDiagram() {
  return (
    <svg viewBox="0 0 820 330" className="h-auto w-full">
      <text x="110" y="38" className="fill-slate-950 text-[20px] font-black">paralelo: rigidez soma</text>
      <rect x="70" y="75" width="18" height="125" rx="4" fill="#0f172a" />
      <SpringCoil x={95} y={105} length={165} amplitude={12} turns={6} />
      <SpringCoil x={95} y={170} length={165} amplitude={12} turns={6} />
      <rect x="270" y="108" width="75" height="65" rx="14" fill="#dbeafe" stroke="#0f172a" strokeWidth="5" />
      <text x="130" y="245" className="fill-blue-700 text-[16px] font-black">k_eq = k₁ + k₂</text>

      <text x="520" y="38" className="fill-slate-950 text-[20px] font-black">série: rigidez reduz</text>
      <rect x="455" y="75" width="18" height="125" rx="4" fill="#0f172a" />
      <SpringCoil x={485} y={138} length={110} amplitude={12} turns={5} />
      <SpringCoil x={600} y={138} length={110} amplitude={12} turns={5} />
      <rect x="718" y="108" width="75" height="65" rx="14" fill="#fee2e2" stroke="#0f172a" strokeWidth="5" />
      <text x="510" y="245" className="fill-red-700 text-[16px] font-black">1/k_eq = 1/k₁ + 1/k₂</text>
    </svg>
  );
}

function MassSpringSimulator() {
  const [mass, setMass] = useState(0.5);
  const [spring, setSpring] = useState(100);
  const [amplitude, setAmplitude] = useState(0.1);

  const omega = useMemo(() => Math.sqrt(spring / mass), [spring, mass]);
  const period = useMemo(() => (2 * Math.PI) / omega, [omega]);
  const frequency = useMemo(() => 1 / period, [period]);
  const vmax = useMemo(() => amplitude * omega, [amplitude, omega]);
  const amax = useMemo(() => amplitude * omega ** 2, [amplitude, omega]);
  const energy = useMemo(() => 0.5 * spring * amplitude ** 2, [spring, amplitude]);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="bg-slate-950 px-7 py-6 text-white md:px-9">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <SlidersHorizontal className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">
              Simulador rápido de massa-mola
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-300">
              Ajuste massa, mola e amplitude para ver como o oscilador responde.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-7 px-7 py-7 md:px-9 md:py-9 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Massa</span>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">{decimalComma(mass, 2)} kg</span>
            </div>
            <input type="range" min="0.1" max="5" step="0.1" value={mass} onChange={(e) => setMass(Number(e.target.value))} className="w-full accent-blue-700" />
          </label>

          <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Constante elástica</span>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">{decimalComma(spring, 0)} N/m</span>
            </div>
            <input type="range" min="20" max="500" step="10" value={spring} onChange={(e) => setSpring(Number(e.target.value))} className="w-full accent-blue-700" />
          </label>

          <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Amplitude</span>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">{decimalComma(amplitude, 2)} m</span>
            </div>
            <input type="range" min="0.02" max="0.5" step="0.01" value={amplitude} onChange={(e) => setAmplitude(Number(e.target.value))} className="w-full accent-blue-700" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["ω", `${decimalComma(omega, 2)} rad/s`],
            ["T", `${decimalComma(period, 3)} s`],
            ["f", `${decimalComma(frequency, 3)} Hz`],
            ["v máx", `${decimalComma(vmax, 3)} m/s`],
            ["a máx", `${decimalComma(amax, 3)} m/s²`],
            ["E", `${decimalComma(energy, 4)} J`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
            </div>
          ))}

          <div className="sm:col-span-2 rounded-3xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-justify text-[1.02rem] leading-8 text-slate-700">
              A massa altera o período porque muda a inércia. A constante elástica altera o período porque muda a força restauradora. A amplitude muda energia, velocidade máxima e aceleração máxima, mas não muda o período no modelo ideal.
            </p>
          </div>
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
            {section.title}
          </h2>
        </div>
      </div>

      <div className="space-y-6 px-7 py-7 md:px-9 md:py-9">
        {section.paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-justify text-[1.06rem] leading-9 text-slate-700">
            {paragraph}
          </p>
        ))}

        {section.diagram ? <MhsDiagram diagram={section.diagram} /> : null}

        {section.formulas ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {section.formulas.filter(Boolean).map((formula) => (
              <FormulaCard key={formula.title} item={formula} />
            ))}
          </div>
        ) : null}

        {section.bullets ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <ul className="space-y-3">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3 text-[1.02rem] leading-8 text-slate-700">
                  <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {section.notes ? (
          <div className="space-y-4">
            {section.notes.map((note) => (
              <NoteCard key={note.title} title={note.title} type={note.type} body={note.body} />
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
      <div className="bg-blue-700 px-6 py-5 text-white">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
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
              <div key={step} className="flex gap-4">
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

function SummaryMapPanel() {
  const items = [
    ["Assinatura", "a = -ω²x: aceleração proporcional e oposta ao deslocamento."],
    ["Força restauradora", "F = -Cx: força aponta para o equilíbrio."],
    ["Massa-mola", "T = 2π√(m/k): rigidez e inércia definem o período."],
    ["Pêndulo", "T = 2π√(ℓ/g): válido para pequenas oscilações."],
    ["Energia", "E = (1/2)kA²: energia total depende de A²."],
    ["Gráficos", "x, v e a têm o mesmo período, mas fases diferentes."],
    ["Vertical", "A gravidade desloca o equilíbrio; a elongação dinâmica é medida a partir dele."],
    ["Mínimo de energia", "Perto de um equilíbrio estável, U pode ser aproximada por uma parábola."],
    ["Modo prova", "Defina o equilíbrio, procure F = -Cx e só depois escolha a ferramenta."],
    ["ITA/IME", "O foco é reconhecer MHS escondido pela força efetiva."],
  ];

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="bg-blue-700 px-7 py-6 text-white md:px-9">
        <div className="flex items-center gap-4">
          <Brain className="h-7 w-7" />
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">
            Mapa mental do MHS
          </h2>
        </div>
      </div>
      <div className="grid gap-4 px-7 py-7 md:grid-cols-2 md:px-9 md:py-9">
        {items.map(([title, description]) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-black text-slate-950">{title}</h3>
            <p className="mt-2 text-[1.02rem] leading-8 text-slate-700">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function OndulatoriaTopicMHS() {
  const [activeTab, setActiveTab] = useState<Tab>("teoria");

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-5">
            <Link
              href="/ondulatoria"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition-colors hover:text-blue-700"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">
                OSCILAÇÕES E ONDAS
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">
                Movimento Harmônico Simples
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

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
        <section className="overflow-hidden rounded-[2.2rem] bg-slate-950 px-8 py-10 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] md:px-10 md:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-amber-300">
                <Sparkles className="h-4 w-4" />
                foco ITA · IME · militares
              </div>

              <h2 className="mt-7 max-w-4xl text-4xl font-black leading-[1.08] tracking-tight md:text-6xl">
                MHS: força restauradora, energia, fase e gráficos sem decorar no escuro.
              </h2>

              <p className="mt-6 max-w-3xl text-lg leading-9 text-slate-300">
                Uma página completa sobre MHS para provas militares e vestibulares fortes:
                massa-mola, pêndulo simples, fase, gráficos, energia, molas associadas,
                MHS vertical e reconhecimento de força restauradora efetiva.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { value: String(theorySections.length), label: "Seções" },
                { value: String(formulas.length), label: "Fórmulas" },
                { value: "8", label: "Diagramas" },
                { value: "MIL", label: "Foco" },
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
              <div key={section.title} className="space-y-8">
                <TheorySectionCard section={section} />
                {section.title === "Sistema massa-mola horizontal" ? <MassSpringSimulator /> : null}
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
            <SummaryMapPanel />

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="bg-slate-950 px-7 py-6 text-white md:px-9">
                <div className="flex items-center gap-4">
                  <Sigma className="h-7 w-7" />
                  <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                    Fórmulas principais
                  </h2>
                </div>
              </div>

              <div className="grid gap-5 px-7 py-7 md:grid-cols-2 md:px-9 md:py-9">
                {formulas.filter(Boolean).map((formula) => (
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
