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
  Telescope,
  Waves,
  Zap,
} from "lucide-react";
import { Link } from "wouter";

import { MathFormula } from "@/components/MathFormula";

type Tab = "teoria" | "exemplos" | "resumo";
type NoteType = "info" | "warning" | "success";
type DiagramKind = "wave" | "young" | "singleSlit" | "rayleigh" | "polarization";

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
    title: "Relação fundamental da onda",
    formula: String.raw`v=\lambda f`,
    description:
      "Relaciona velocidade de propagação, comprimento de onda e frequência. É a base para entender o que muda quando a luz entra em outro meio.",
    terms: [
      "v: velocidade de propagação da onda no meio.",
      "λ: comprimento de onda.",
      "f: frequência da onda.",
    ],
    interpretation: [
      "Se a frequência permanece constante e a velocidade muda, o comprimento de onda também muda.",
      "Na refração, a fonte continua impondo a frequência; o meio altera velocidade e comprimento de onda.",
    ],
  },
  {
    title: "Diferença de fase",
    formula: String.raw`\Delta\varphi=\frac{2\pi}{\lambda}\Delta`,
    description:
      "Conecta diferença de caminho com diferença de fase. É a ponte entre geometria e interferência.",
    terms: [
      "Δφ: diferença de fase.",
      "λ: comprimento de onda.",
      "Δ: diferença de caminho percorrido pelas ondas.",
    ],
    interpretation: [
      "Δ = λ corresponde a uma volta completa de fase: 2π.",
      "Δ = λ/2 corresponde a oposição de fase: π.",
    ],
  },
  {
    title: "Interferência construtiva",
    formula: String.raw`\Delta=m\lambda`,
    description:
      "Condição para ondas coerentes chegarem em fase e se reforçarem.",
    terms: [
      "Δ: diferença de caminho.",
      "m: ordem de interferência, inteiro.",
      "λ: comprimento de onda.",
    ],
    interpretation: [
      "Produz máximo de intensidade.",
      "No padrão de Young, corresponde às franjas claras.",
    ],
  },
  {
    title: "Interferência destrutiva",
    formula: String.raw`\Delta=\left(m+\frac{1}{2}\right)\lambda`,
    description:
      "Condição para ondas chegarem em oposição de fase e se cancelarem.",
    terms: [
      "m: inteiro não negativo.",
      "m + 1/2: múltiplo semi-inteiro do comprimento de onda.",
      "λ: comprimento de onda.",
    ],
    interpretation: [
      "Produz mínimo de intensidade.",
      "No padrão de Young, corresponde às franjas escuras.",
    ],
  },
  {
    title: "Young: máximos",
    formula: String.raw`d\sin\theta=m\lambda`,
    description:
      "Condição angular para franjas claras no experimento de dupla fenda.",
    terms: [
      "d: distância entre as fendas.",
      "θ: ângulo da franja em relação ao centro.",
      "m: ordem do máximo.",
      "λ: comprimento de onda.",
    ],
    interpretation: [
      "A franja central corresponde a m = 0.",
      "Quanto maior λ, maior o ângulo para uma mesma ordem.",
    ],
  },
  {
    title: "Young: posição linear",
    formula: String.raw`y_m=\frac{m\lambda D}{d}`,
    description:
      "Posição aproximada da franja clara na tela para pequenos ângulos.",
    terms: [
      "y_m: posição da franja de ordem m.",
      "D: distância entre fendas e tela.",
      "d: distância entre as fendas.",
      "λ: comprimento de onda.",
    ],
    interpretation: [
      "Aumentar D afasta as franjas.",
      "Aumentar d aproxima as franjas.",
    ],
  },
  {
    title: "Espaçamento entre franjas",
    formula: String.raw`\Delta y=\frac{\lambda D}{d}`,
    description:
      "Distância entre duas franjas claras consecutivas no padrão de Young.",
    terms: [
      "Δy: espaçamento entre franjas.",
      "λ: comprimento de onda.",
      "D: distância até a tela.",
      "d: distância entre fendas.",
    ],
    interpretation: [
      "Franjas mais espaçadas indicam maior λ ou maior D.",
      "Fendas mais afastadas deixam o padrão mais comprimido.",
    ],
  },
  {
    title: "Fenda única: mínimos",
    formula: String.raw`a\sin\theta=m\lambda`,
    description:
      "Condição dos mínimos de difração por fenda única.",
    terms: [
      "a: largura da fenda.",
      "θ: ângulo até o mínimo.",
      "m: ordem do mínimo, com m = 1, 2, 3, ...",
      "λ: comprimento de onda.",
    ],
    interpretation: [
      "Essa fórmula dá mínimos, não máximos. Sim, a Física colocou uma pegadinha aqui.",
      "Quanto menor a fenda, maior o espalhamento angular.",
    ],
    warning:
      "Na dupla fenda, d senθ = mλ dá máximos. Na fenda única, a senθ = mλ dá mínimos.",
  },
  {
    title: "Rede de difração",
    formula: String.raw`d\sin\theta=m\lambda`,
    description:
      "Condição dos máximos principais em uma rede com muitas fendas.",
    terms: [
      "d: espaçamento entre fendas consecutivas.",
      "m: ordem do máximo.",
      "θ: ângulo de observação.",
      "λ: comprimento de onda.",
    ],
    interpretation: [
      "Com muitas fendas, os máximos ficam mais estreitos e definidos.",
      "Cores diferentes aparecem em ângulos diferentes.",
    ],
  },
  {
    title: "Critério de Rayleigh",
    formula: String.raw`\theta_{\min}\approx 1{,}22\frac{\lambda}{D}`,
    description:
      "Estimativa do menor ângulo resolvível por uma abertura circular.",
    terms: [
      "θ_min: menor separação angular resolvível.",
      "λ: comprimento de onda.",
      "D: diâmetro da abertura.",
      "1,22: fator associado ao padrão de difração circular.",
    ],
    interpretation: [
      "Aumentar D melhora a resolução.",
      "Diminuir λ melhora a resolução.",
      "Aumentar ampliação não resolve detalhe que a difração já apagou.",
    ],
  },
  {
    title: "Lei de Malus",
    formula: String.raw`I=I_0\cos^2\theta`,
    description:
      "Intensidade transmitida por um analisador quando a luz incidente já está polarizada.",
    terms: [
      "I: intensidade transmitida.",
      "I_0: intensidade incidente polarizada no analisador.",
      "θ: ângulo entre a polarização da luz e o eixo do analisador.",
    ],
    interpretation: [
      "θ = 0°: transmissão máxima.",
      "θ = 90°: bloqueio ideal.",
      "θ = 45°: intensidade cai pela metade.",
    ],
    warning:
      "Para luz natural atravessando o primeiro polarizador ideal, a intensidade vira I0/2 antes de aplicar Malus no analisador.",
  },
  {
    title: "Ângulo de Brewster",
    formula: String.raw`\tan\theta_B=\frac{n_2}{n_1}`,
    description:
      "Ângulo em que a luz refletida fica fortemente polarizada.",
    terms: [
      "θ_B: ângulo de Brewster.",
      "n_1: índice do meio de incidência.",
      "n_2: índice do meio refratado.",
    ],
    interpretation: [
      "Ajuda a entender por que óculos polarizados reduzem reflexos.",
      "A polarização por reflexão depende da geometria e dos índices dos meios.",
    ],
  },
];

const theorySections: TheorySection[] = [
  {
    id: 1,
    icon: BookOpen,
    title: "Contexto físico: quando os raios deixam de bastar",
    accent: "bg-purple-700",
    paragraphs: [
      "A Óptica Física é a parte da Óptica que estuda fenômenos em que a natureza ondulatória da luz se torna indispensável. A Óptica Geométrica, com raios luminosos, explica muito bem reflexão, refração, lentes, espelhos e formação de imagens quando as dimensões envolvidas são muito maiores que o comprimento de onda da luz.",
      "Mas a luz não é apenas um risquinho obediente andando em linha reta para facilitar a vida do aluno. O modelo de raio é uma aproximação. Ele funciona muito bem em muitas situações, mas falha quando surgem fenômenos como interferência, difração, polarização, franjas claras e escuras, cores em películas finas e limite de resolução de instrumentos.",
      "A Óptica Física trata a luz como onda eletromagnética. Isso significa que a luz possui campos elétrico e magnético oscilantes, perpendiculares entre si e à direção de propagação. É essa estrutura ondulatória que explica superposição, fase, coerência e polarização.",
      "A leitura mais segura é esta: quando a questão pergunta apenas para onde a luz vai, a Óptica Geométrica costuma bastar. Quando a questão pergunta como a luz se soma, se cancela, se espalha ou tem sua direção de oscilação selecionada, a Óptica Física entra em cena.",
    ],
    notes: [
      {
        title: "Ideia central",
        type: "success",
        body: "Óptica Geométrica pergunta para onde o raio vai. Óptica Física pergunta como as ondas se superpõem, se espalham e oscilam.",
      },
      {
        title: "Ponto de prova",
        type: "warning",
        body: "Se o fenômeno envolve franja, fenda estreita, padrão de intensidade, resolução ou polarizador, provavelmente você saiu da Óptica Geométrica e entrou na Óptica Física.",
      },
    ],
  },
  {
    id: 2,
    icon: Waves,
    title: "Luz como onda eletromagnética",
    accent: "bg-slate-950",
    paragraphs: [
      "Dizer que a luz é onda significa dizer que ela transporta energia por meio de uma perturbação que se propaga. No som, a perturbação envolve compressões e rarefações do ar. Na corda, envolve deslocamentos da própria corda. Na luz, a perturbação envolve campos elétrico e magnético oscilantes.",
      "A luz não precisa de meio material para se propagar. Ela pode viajar no vácuo com velocidade aproximadamente igual a c = 3,0 × 10^8 m/s. Essa é uma diferença fundamental em relação ao som, que precisa de um meio mecânico.",
      "A luz é uma onda transversal: a propagação ocorre em uma direção, enquanto o campo elétrico oscila em uma direção perpendicular a ela. Esse detalhe não é enfeite teórico. É exatamente o que torna possível o fenômeno da polarização.",
    ],
    formulas: [formulas[0]],
    diagram: {
      kind: "wave",
      title: "onda eletromagnética transversal",
      caption:
        "A direção de propagação é perpendicular às oscilações do campo elétrico e do campo magnético.",
    },
    bullets: [
      "A luz pode sofrer superposição.",
      "A luz pode produzir interferência construtiva e destrutiva.",
      "A luz pode difratar ao passar por pequenas aberturas.",
      "A luz pode ser polarizada porque é transversal.",
    ],
  },
  {
    id: 3,
    icon: Target,
    title: "Limite da Óptica Geométrica",
    accent: "bg-blue-700",
    paragraphs: [
      "O modelo de raios funciona muito bem quando as dimensões características do sistema são muito maiores que o comprimento de onda. Se a abertura, obstáculo ou lente tem tamanho muito maior que λ, os efeitos ondulatórios até existem, mas costumam ser pouco perceptíveis.",
      "A luz visível tem comprimentos de onda da ordem de centenas de nanômetros, aproximadamente entre 400 nm e 700 nm. Por isso, em portas, janelas e espelhos cotidianos, ela parece se propagar quase em linha reta.",
      "Quando a abertura ou obstáculo tem dimensão comparável ao comprimento de onda, a aproximação geométrica começa a falhar. A luz se espalha, interfere consigo mesma e forma padrões que só fazem sentido pela descrição ondulatória.",
    ],
    formulas: [
      {
        title: "Regime geométrico",
        formula: String.raw`a\gg\lambda`,
        description:
          "Quando a dimensão característica é muito maior que o comprimento de onda, a Óptica Geométrica costuma funcionar bem.",
        terms: ["a: dimensão da abertura ou obstáculo.", "λ: comprimento de onda."],
        interpretation: ["Sombras ficam mais definidas.", "A descrição por raios se torna uma boa aproximação."],
      },
      {
        title: "Regime ondulatório evidente",
        formula: String.raw`a\sim\lambda`,
        description:
          "Quando a dimensão característica é comparável ao comprimento de onda, difração e interferência ficam relevantes.",
        terms: ["a: tamanho da fenda, abertura ou obstáculo.", "λ: comprimento de onda."],
        interpretation: ["A luz se espalha de forma perceptível.", "O padrão de intensidade deixa de ser explicado só por raios."],
      },
    ],
    notes: [
      {
        title: "Comparação útil",
        type: "info",
        body: "O som contorna portas com facilidade porque tem comprimento de onda muito maior que o da luz visível. A luz também difrata, mas isso fica evidente em escalas muito menores.",
      },
    ],
  },
  {
    id: 4,
    icon: Calculator,
    title: "Grandezas ondulatórias, fase e caminho",
    accent: "bg-cyan-700",
    paragraphs: [
      "Para entender interferência e difração, não basta saber que existe comprimento de onda. É preciso entender frequência, período, velocidade, fase, diferença de fase e diferença de caminho.",
      "A fase indica em que ponto do ciclo a onda está. Duas ondas podem ter mesma frequência e mesmo comprimento de onda, mas chegarem a um ponto em estados diferentes do ciclo. Se chegam em fase, reforçam. Se chegam em oposição de fase, podem cancelar.",
      "A diferença de caminho é a diferença entre os percursos feitos por duas ondas até um ponto. Ela se transforma em diferença de fase. É essa conexão que cria franjas claras e escuras no experimento de Young.",
      "A regra prática é simples: se a diferença de caminho equivale a um número inteiro de comprimentos de onda, as ondas chegam em fase. Se equivale a um número semi-inteiro de comprimentos de onda, chegam em oposição de fase. A beleza disso é que uma diferença geométrica vira uma diferença luminosa na tela.",
    ],
    formulas: [formulas[0], formulas[1], formulas[2], formulas[3]],
    notes: [
      {
        title: "Como pensar",
        type: "success",
        body: "Interferência não depende apenas de duas ondas chegarem ao mesmo ponto. Depende de como elas chegam: em fase, em oposição ou em uma fase intermediária.",
      },
    ],
  },
  {
    id: 5,
    icon: Brain,
    title: "Superposição e coerência",
    accent: "bg-indigo-800",
    paragraphs: [
      "O princípio da superposição afirma que, quando duas ondas chegam ao mesmo ponto, a perturbação resultante é a soma das perturbações individuais. No caso da luz, a grandeza ondulatória relevante é o campo elétrico, e a intensidade observada está relacionada ao quadrado da amplitude do campo.",
      "Interferência construtiva ocorre quando as ondas se reforçam. Interferência destrutiva ocorre quando tendem a se cancelar. Entre esses extremos, há interferência parcial, produzindo intensidades intermediárias.",
      "Para observar um padrão estável de interferência, as fontes devem ser coerentes, isto é, manter diferença de fase constante. Duas lâmpadas comuns não produzem franjas estáveis facilmente porque seus processos microscópicos de emissão são independentes e desordenados.",
      "Young resolveu isso usando uma única fonte para iluminar duas fendas. As fendas se comportam como fontes secundárias coerentes. É uma ideia experimental simples e genial, duas palavras que raramente aparecem juntas quando o aluno olha a fórmula pela primeira vez.",
    ],
    bullets: [
      "Construtiva: crista com crista, máximo de intensidade.",
      "Destrutiva: crista com vale, mínimo de intensidade.",
      "Coerência: diferença de fase constante no tempo.",
      "Sem coerência estável, o padrão se embaralha e as franjas desaparecem na média.",
    ],
  },
  {
    id: 6,
    icon: Rainbow,
    title: "Experimento de Young",
    accent: "bg-red-700",
    paragraphs: [
      "O experimento de Young é a demonstração clássica da interferência da luz. Uma fonte ilumina duas fendas estreitas e próximas; a luz que sai dessas fendas se espalha, se superpõe e forma na tela um padrão de franjas claras e escuras.",
      "Cada ponto da tela recebe luz vinda das duas fendas. Em certos pontos, as ondas chegam em fase e produzem franja clara. Em outros, chegam em oposição de fase e produzem franja escura.",
      "A diferença de caminho entre as ondas vindas das duas fendas é aproximadamente Δ = d senθ. Para pequenos ângulos, usamos senθ ≈ tgθ ≈ y/D. Daí surgem as posições das franjas.",
    ],
    formulas: [formulas[4], formulas[5], formulas[6]],
    diagram: {
      kind: "young",
      title: "experimento de Young",
      caption:
        "Duas fendas coerentes produzem diferença de caminho e um padrão de franjas na tela.",
    },
    notes: [
      {
        title: "Leitura física da fórmula",
        type: "info",
        body: "Aumentar λ ou D aumenta o espaçamento entre franjas. Aumentar d aproxima as franjas.",
      },
      {
        title: "Armadilha",
        type: "warning",
        body: "d é a distância entre as fendas. D é a distância até a tela. Trocar os dois é uma forma eficiente de criar uma resposta absurda com aparência matemática.",
      },
    ],
  },
  {
    id: 7,
    icon: Sparkles,
    title: "Interferência em películas finas",
    accent: "bg-purple-700",
    paragraphs: [
      "Películas finas produzem cores porque raios refletidos em superfícies diferentes da película se superpõem. Um raio reflete na superfície superior; outro entra na película, reflete na superfície inferior e sai novamente. Esses raios percorrem caminhos diferentes e podem sofrer inversões de fase.",
      "Quando a luz reflete em uma interface com meio de maior índice de refração, pode ocorrer inversão de fase equivalente a π, isto é, meia onda. Essa inversão muda as condições de máximo e mínimo.",
      "Bolhas de sabão, manchas de óleo e revestimentos antirreflexo dependem dessa interferência. A cor observada muda com a espessura da película, o índice dos meios e o ângulo de observação.",
    ],
    bullets: [
      "Bolhas de sabão: cores por interferência em película fina.",
      "Óleo sobre água: cores variam com espessura e ângulo.",
      "Revestimento antirreflexo: usa interferência destrutiva para reduzir reflexão.",
      "Inversão de fase: depende do índice do meio em que ocorre a reflexão.",
    ],
    notes: [
      {
        title: "Ponto de cuidado",
        type: "warning",
        body: "Películas finas combinam diferença de caminho com inversões de fase. Não use as condições de Young automaticamente sem analisar a reflexão.",
      },
    ],
  },
  {
    id: 8,
    icon: Sun,
    title: "Difração e fenda única",
    accent: "bg-orange-700",
    paragraphs: [
      "Difração é o espalhamento de uma onda ao passar por uma abertura ou contornar um obstáculo. Ela fica mais evidente quando a dimensão da abertura ou obstáculo é comparável ao comprimento de onda.",
      "Na difração por fenda única, a luz atravessa uma fenda estreita e forma um padrão com máximo central largo e intenso, mínimos escuros laterais e máximos secundários mais fracos.",
      "A condição a senθ = mλ fornece os mínimos de difração. Esse ponto é perigoso porque a fórmula se parece com a condição de máximos da dupla fenda. A aparência algébrica é parecida; o fenômeno cobrado é outro. A Física, como sempre, escolheu a opção menos amigável.",
      "O máximo central se alarga quando o comprimento de onda aumenta ou quando a fenda fica mais estreita. Por isso, fendas pequenas espalham mais a luz.",
      "Essa é uma ideia contraintuitiva para quem vem da Óptica Geométrica: diminuir a abertura não melhora indefinidamente a definição. Depois de certo ponto, a abertura pequena aumenta a difração e piora a nitidez. A natureza, como sempre, cobra pedágio.",
    ],
    formulas: [formulas[7]],
    diagram: {
      kind: "singleSlit",
      title: "difração por fenda única",
      caption:
        "A fenda finita produz um máximo central largo e mínimos laterais.",
    },
    notes: [
      {
        title: "Diferença essencial",
        type: "success",
        body: "Dupla fenda: interferência entre duas fontes coerentes. Fenda única: interferência entre diferentes partes da mesma abertura.",
      },
    ],
  },
  {
    id: 9,
    icon: Waves,
    title: "Rede de difração",
    accent: "bg-blue-800",
    paragraphs: [
      "Uma rede de difração possui muitas fendas ou ranhuras igualmente espaçadas. Ela funciona como uma versão refinada do experimento de múltiplas fendas.",
      "Com muitas fendas, os máximos principais ficam mais estreitos, intensos e bem definidos. Isso permite medir comprimentos de onda com precisão muito maior do que em uma dupla fenda comum.",
      "Como a condição d senθ = mλ depende de λ, comprimentos de onda diferentes aparecem em ângulos diferentes. A rede separa a luz em cores e é uma ferramenta central na espectroscopia.",
    ],
    formulas: [formulas[8]],
    bullets: [
      "Usada em espectroscopia.",
      "Permite separar cores por comprimento de onda.",
      "Máximos ficam mais estreitos com muitas fendas.",
      "Ajuda a identificar elementos químicos e composição de estrelas.",
    ],
  },
  {
    id: 10,
    icon: Telescope,
    title: "Limite de resolução e Critério de Rayleigh",
    accent: "bg-slate-950",
    paragraphs: [
      "Instrumentos ópticos não conseguem distinguir detalhes arbitrariamente pequenos. Mesmo um ponto luminoso não forma uma imagem pontual perfeita: por causa da difração, ele forma um padrão com máximo central e anéis, conhecido como disco de Airy.",
      "Resolver dois objetos significa conseguir distingui-los como separados. O Critério de Rayleigh diz que dois pontos estão aproximadamente resolvidos quando o máximo central de um coincide com o primeiro mínimo do outro.",
      "Para abertura circular, a separação angular mínima é aproximadamente θ_min = 1,22 λ/D. Isso mostra que telescópios maiores têm melhor resolução e que comprimentos de onda menores permitem distinguir detalhes menores.",
      "Aumentar a ampliação sem melhorar a resolução não cria detalhe novo. Só aumenta uma imagem borrada. É cruel, mas pelo menos é honesto.",
      "Por isso, telescópios e microscópios não são limitados apenas por qualidade de lente ou espelho. Mesmo em um sistema ideal, a difração impõe um limite físico. O instrumento pode aumentar a imagem, mas não pode recuperar informação que o padrão de difração já misturou.",
    ],
    formulas: [formulas[9]],
    diagram: {
      kind: "rayleigh",
      title: "Critério de Rayleigh",
      caption:
        "Dois padrões de difração são resolvidos quando o máximo de um cai perto do primeiro mínimo do outro.",
    },
    notes: [
      {
        title: "Ponto de prova",
        type: "warning",
        body: "θ no critério de Rayleigh é separação angular e deve ser tratada em radianos.",
      },
    ],
  },
  {
    id: 11,
    icon: ShieldCheck,
    title: "Polarização e Lei de Malus",
    accent: "bg-emerald-700",
    paragraphs: [
      "Polarização descreve a direção de oscilação do campo elétrico da luz. Esse fenômeno só faz sentido porque a luz é uma onda transversal. Uma onda longitudinal, no sentido usual, não teria uma direção transversal de oscilação para selecionar.",
      "Luz natural é geralmente não polarizada: seu campo elétrico oscila em várias direções perpendiculares à propagação. Um polarizador seleciona uma dessas direções e transmite apenas a componente compatível com seu eixo.",
      "Se luz natural atravessa um polarizador ideal, a intensidade transmitida fica I0/2. Depois disso, se a luz polarizada atravessa outro polarizador, chamado analisador, aplicamos a Lei de Malus: I = I0 cos²θ.",
      "Quando os eixos dos polarizadores são paralelos, a transmissão é máxima. Quando são perpendiculares, a transmissão ideal é nula. Com 45°, a intensidade transmitida pelo analisador é metade da luz polarizada incidente nele.",
      "O cuidado mais importante é separar duas situações: luz natural passando pelo primeiro polarizador e luz já polarizada passando por um analisador. No primeiro caso, um polarizador ideal transmite metade da intensidade. No segundo, a Lei de Malus decide a fração transmitida.",
    ],
    formulas: [formulas[10]],
    diagram: {
      kind: "polarization",
      title: "polarização e analisador",
      caption:
        "O polarizador seleciona uma direção de oscilação do campo elétrico.",
    },
    notes: [
      {
        title: "Cuidado com luz natural",
        type: "warning",
        body: "Não aplique Malus diretamente na luz natural como se ela já estivesse polarizada. Primeiro polarizador ideal: I = I0/2.",
      },
    ],
  },
  {
    id: 12,
    icon: Rainbow,
    title: "Polarização por reflexão e ângulo de Brewster",
    accent: "bg-cyan-700",
    paragraphs: [
      "A luz refletida por uma superfície pode ficar parcialmente polarizada. Em um ângulo especial, chamado ângulo de Brewster, a luz refletida é fortemente polarizada.",
      "A relação tanθ_B = n2/n1 permite calcular esse ângulo quando a luz passa do meio 1 para o meio 2. Esse fenômeno ajuda a explicar por que óculos polarizados reduzem reflexos em superfícies como água, vidro e asfalto.",
      "A ideia prática é que certos reflexos têm forte componente polarizada em uma direção. O polarizador dos óculos bloqueia parte dessa componente, reduzindo brilho incômodo.",
    ],
    formulas: [formulas[11]],
  },
  {
    id: 13,
    icon: Brain,
    title: "Como não misturar tudo em prova",
    accent: "bg-red-700",
    paragraphs: [
      "Interferência, difração e polarização são fenômenos ondulatórios, mas não são a mesma coisa. Interferência depende da superposição de ondas coerentes. Difração depende do espalhamento da onda por aberturas ou obstáculos. Polarização depende da direção de oscilação do campo elétrico.",
      "A maior armadilha é usar uma fórmula parecida no fenômeno errado. d senθ = mλ pode aparecer em Young e em rede de difração como máximo. Já a senθ = mλ na fenda única representa mínimo. O símbolo parecido não perdoa falta de interpretação.",
      "O método seguro é identificar o fenômeno antes da fórmula: há duas fendas? uma fenda? muitas fendas? abertura circular? polarizadores? Só depois escolha a relação matemática.",
    ],
    bullets: [
      "Interferência: superposição de ondas coerentes.",
      "Difração: espalhamento por abertura ou obstáculo.",
      "Rayleigh: limite de resolução por difração.",
      "Polarização: direção de oscilação do campo elétrico.",
      "Malus: intensidade transmitida por analisador.",
    ],
  },

  {
    id: 14,
    icon: Calculator,
    title: "Como escolher a fórmula certa",
    accent: "bg-blue-700",
    paragraphs: [
      "Óptica Física tem um problema irritante: fórmulas parecidas aparecem em fenômenos diferentes. Se o aluno escolhe fórmula olhando só o formato algébrico, erra com confiança, que é o pior tipo de erro.",
      "O caminho correto é identificar o fenômeno antes da conta. A pergunta não é 'qual fórmula parece familiar?'. A pergunta é: existe uma fenda, duas fendas, muitas fendas, abertura circular, película fina ou polarizador?",
      "Essa seção funciona como um mapa de decisão. Ela não substitui a teoria, mas impede que você use a fórmula certa no lugar errado, uma especialidade humana infelizmente bem documentada.",
    ],
    bullets: [
      "Duas fendas coerentes: use Young, com máximos em d senθ = mλ e espaçamento Δy = λD/d.",
      "Uma fenda única: use mínimos de difração em a senθ = mλ.",
      "Muitas fendas: use rede de difração, com máximos principais em d senθ = mλ.",
      "Abertura circular e resolução: use Rayleigh, θ_min ≈ 1,22λ/D.",
      "Polarizadores: use I = I0/2 para luz natural no primeiro polarizador e Malus para analisadores.",
      "Reflexo polarizado: use Brewster, tanθ_B = n2/n1.",
      "Película fina: analise diferença de caminho e inversões de fase antes de decidir máximo ou mínimo.",
    ],
    notes: [
      {
        title: "Regra de prova",
        type: "success",
        body: "Primeiro identifique o fenômeno. Depois escolha a fórmula. A ordem inversa é como colocar o gabarito antes da pergunta e torcer pela benevolência do universo.",
      },
    ],
  },
  {
    id: 15,
    icon: Brain,
    title: "Leitura de gráficos de intensidade",
    accent: "bg-indigo-800",
    paragraphs: [
      "Em Óptica Física, muitos resultados aparecem como padrões de intensidade. O aluno não deve enxergar as fórmulas apenas como números; deve enxergar a forma do padrão luminoso.",
      "No experimento de Young ideal, as franjas aparecem regularmente espaçadas. Na fenda única, o máximo central é muito mais largo e intenso que os máximos laterais. Em uma rede de difração, os máximos principais ficam estreitos e bem definidos.",
      "No Critério de Rayleigh, a intensidade ajuda a entender por que dois pontos próximos podem se misturar. Quando os padrões de difração se sobrepõem demais, o instrumento deixa de distinguir os objetos separadamente.",
    ],
    bullets: [
      "Young: franjas claras e escuras aproximadamente periódicas.",
      "Fenda única: máximo central largo; laterais menores.",
      "Rede: máximos estreitos e bem definidos.",
      "Rayleigh: resolução depende da separação entre padrões de difração.",
      "Malus: intensidade varia com cos²θ.",
    ],
  },

];

const examples: ExampleItem[] = [
  {
    title: "Interferência por diferença de caminho",
    level: "básico conceitual",
    statement:
      "Duas ondas luminosas coerentes chegam a um ponto com diferença de caminho igual a 3λ. Determine o tipo de interferência.",
    idea:
      "Diferença de caminho igual a múltiplo inteiro de λ significa que as ondas chegam em fase.",
    steps: [
      "A condição de interferência construtiva é Δ = mλ.",
      "Foi dado Δ = 3λ.",
      "Logo, m = 3, que é inteiro.",
      "As ondas chegam em fase e se reforçam.",
    ],
    answer:
      "Ocorre interferência construtiva, formando máximo de intensidade.",
    test:
      "A questão queria testar se você reconhece múltiplos inteiros de λ como reforço, não como cancelamento.",
  },
  {
    title: "Espaçamento entre franjas no experimento de Young",
    level: "intermediário",
    statement:
      "Em um experimento de Young, λ = 600 nm, D = 2,0 m e d = 0,30 mm. Determine o espaçamento entre franjas.",
    idea:
      "Use Δy = λD/d e converta tudo para o SI antes de fazer a conta.",
    steps: [
      "Converta λ: 600 nm = 6,0 × 10^-7 m.",
      "Converta d: 0,30 mm = 3,0 × 10^-4 m.",
      "Use Δy = λD/d.",
      "Δy = (6,0 × 10^-7 · 2,0)/(3,0 × 10^-4).",
      "Δy = 4,0 × 10^-3 m.",
    ],
    answer:
      "O espaçamento entre franjas é 4,0 mm.",
    test:
      "A questão queria testar conversão de unidades e a diferença entre d e D. Sim, essa troca é o tropeço padrão.",
  },
  {
    title: "Posição de franja clara",
    level: "intermediário",
    statement:
      "No mesmo arranjo, determine a posição da franja clara de ordem m = 3.",
    idea:
      "A posição da franja clara é y_m = mλD/d. Como Δy já seria λD/d, basta multiplicar por m.",
    steps: [
      "Use y_m = mλD/d.",
      "Como λD/d = 4,0 mm, então y_3 = 3 · 4,0 mm.",
      "y_3 = 12 mm.",
    ],
    answer:
      "A terceira franja clara está a 12 mm do máximo central.",
    test:
      "A questão queria testar se você entende ordem de franja como posição relativa ao centro, não como número total de franjas.",
  },
  {
    title: "Difração por fenda única",
    level: "intermediário para avançado",
    statement:
      "Luz de comprimento de onda 500 nm passa por uma fenda de largura 0,10 mm. Determine aproximadamente o ângulo do primeiro mínimo.",
    idea:
      "Para fenda única, a senθ = mλ dá mínimos. Para o primeiro mínimo, m = 1.",
    steps: [
      "Converta λ: 500 nm = 5,0 × 10^-7 m.",
      "Converta a: 0,10 mm = 1,0 × 10^-4 m.",
      "Use a senθ = mλ.",
      "Para m = 1: senθ = λ/a.",
      "senθ = 5,0 × 10^-7 / 1,0 × 10^-4 = 5,0 × 10^-3.",
      "Para pequeno ângulo, θ ≈ 5,0 × 10^-3 rad.",
    ],
    answer:
      "O primeiro mínimo ocorre em θ ≈ 5,0 × 10^-3 rad.",
    test:
      "A questão queria testar a diferença entre difração de fenda única e interferência de dupla fenda.",
  },
  {
    title: "Critério de Rayleigh",
    level: "nível prova difícil",
    statement:
      "Um telescópio tem abertura circular de diâmetro 0,20 m e observa luz de λ = 500 nm. Estime a menor separação angular resolvível.",
    idea:
      "Use θ_min ≈ 1,22λ/D com λ e D em metros.",
    steps: [
      "Converta λ: 500 nm = 5,0 × 10^-7 m.",
      "Use θ_min ≈ 1,22λ/D.",
      "θ_min ≈ 1,22 · 5,0 × 10^-7 / 0,20.",
      "θ_min ≈ 3,05 × 10^-6 rad.",
    ],
    answer:
      "A menor separação angular resolvível é aproximadamente 3,05 × 10^-6 rad.",
    test:
      "A questão queria testar que resolução depende de difração, não só de aumento. Ampliação sem resolução é zoom em borrão, o que parece moderno, mas não ajuda.",
  },
  {
    title: "Lei de Malus",
    level: "intermediário",
    statement:
      "Luz já polarizada de intensidade I0 atravessa um analisador cujo eixo faz 60° com a direção de polarização da luz. Determine a intensidade transmitida.",
    idea:
      "Como a luz já está polarizada, aplicamos diretamente I = I0 cos²θ.",
    steps: [
      "Use I = I0 cos²θ.",
      "Para θ = 60°, cos60° = 1/2.",
      "Logo, cos²60° = 1/4.",
      "I = I0/4.",
    ],
    answer:
      "A intensidade transmitida é I0/4.",
    test:
      "A questão queria testar a aplicação direta de Malus. Se a luz fosse natural antes do primeiro polarizador, haveria o fator I0/2 antes.",
  },

  {
    title: "Luz natural atravessando dois polarizadores",
    level: "intermediário clássico",
    statement:
      "Luz natural de intensidade I0 atravessa dois polarizadores ideais. O segundo faz 60° com o primeiro. Determine a intensidade final.",
    idea:
      "O primeiro polarizador recebe luz natural, então transmite metade. Só depois aplicamos Malus para o segundo polarizador.",
    steps: [
      "Depois do primeiro polarizador: I1 = I0/2.",
      "No segundo polarizador, use Malus: I2 = I1 cos²60°.",
      "Como cos60° = 1/2, temos cos²60° = 1/4.",
      "Logo, I2 = (I0/2) · (1/4).",
      "I2 = I0/8.",
    ],
    answer:
      "A intensidade final é I0/8.",
    test:
      "A questão queria testar se você não aplica Malus diretamente na luz natural. Primeiro vem o fator 1/2 do primeiro polarizador.",
  },
  {
    title: "Rayleigh com separação linear",
    level: "avançado aplicado",
    statement:
      "Um instrumento possui separação angular mínima resolvível θ = 2,0 × 10^-6 rad. Dois pontos estão a 5,0 km de distância do instrumento. Qual a menor separação linear entre eles para serem resolvidos?",
    idea:
      "Para pequenos ângulos, a separação linear é aproximadamente s = Lθ.",
    steps: [
      "Converta a distância: L = 5,0 km = 5,0 × 10^3 m.",
      "Use s ≈ Lθ.",
      "s ≈ 5,0 × 10^3 · 2,0 × 10^-6.",
      "s ≈ 1,0 × 10^-2 m.",
      "Logo, s ≈ 1,0 cm.",
    ],
    answer:
      "A menor separação linear resolvível é aproximadamente 1,0 cm.",
    test:
      "A questão queria conectar resolução angular com separação linear. Rayleigh dá ângulo; a geometria transforma isso em distância real.",
  },

];

const traps = [
  "Confundir interferência com difração.",
  "Usar fórmula de máximo de Young em mínimo de fenda única.",
  "Trocar d, distância entre fendas, com D, distância até a tela.",
  "Esquecer de converter nanômetros para metros.",
  "Usar θ em graus quando a aproximação exige radianos.",
  "Achar que aumentar ampliação sempre melhora resolução.",
  "Aplicar Malus diretamente em luz natural sem considerar o primeiro polarizador.",
  "Confundir ângulo entre polarizadores com ângulo em relação à direção de propagação.",
  "Usar Malus sem separar primeiro polarizador e analisador.",
  "Ignorar inversão de fase em películas finas.",
  "Achar que difração só ocorre em fendas, e não também em obstáculos.",
];

const checklist = [
  "Sei explicar por que a Óptica Geométrica é uma aproximação?",
  "Sei diferenciar interferência, difração e polarização?",
  "Sei usar diferença de caminho para máximo e mínimo?",
  "Sei resolver o experimento de Young com d, D, y e λ?",
  "Sei calcular espaçamento entre franjas?",
  "Sei interpretar mínimos de fenda única?",
  "Sei usar o Critério de Rayleigh em radianos?",
  "Sei aplicar corretamente a Lei de Malus?",
  "Sei tratar luz natural atravessando o primeiro polarizador?",
  "Sei evitar confundir fórmulas parecidas em fenômenos diferentes?",
  "Sei decidir a fórmula correta a partir do fenômeno físico?",
  "Sei transformar resolução angular em separação linear usando s ≈ Lθ?",
];


function decimalComma(value: number, digits = 2) {
  if (!Number.isFinite(value)) return "∞";
  const fixed = value.toFixed(digits);
  return fixed.replace(".", ",").replace(/,?0+$/, "");
}

function YoungSimulator() {
  const [lambdaNm, setLambdaNm] = useState(600);
  const [distanceScreen, setDistanceScreen] = useState(2);
  const [slitMm, setSlitMm] = useState(0.3);

  const spacingMm = useMemo(() => {
    const lambda = lambdaNm * 1e-9;
    const d = slitMm * 1e-3;
    return (lambda * distanceScreen / d) * 1000;
  }, [lambdaNm, distanceScreen, slitMm]);

  const fringes = [-3, -2, -1, 0, 1, 2, 3];

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="bg-slate-950 px-7 py-6 text-white md:px-9">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Rainbow className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">
              Simulador rápido de Young
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-300">
              Mude λ, D e d para ver o espaçamento entre franjas.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-7 px-7 py-7 md:px-9 md:py-9 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Comprimento de onda</span>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">{lambdaNm} nm</span>
            </div>
            <input type="range" min="400" max="700" step="10" value={lambdaNm} onChange={(e) => setLambdaNm(Number(e.target.value))} className="w-full accent-blue-700" />
          </label>

          <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Distância até a tela</span>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">{decimalComma(distanceScreen, 1)} m</span>
            </div>
            <input type="range" min="0.5" max="5" step="0.1" value={distanceScreen} onChange={(e) => setDistanceScreen(Number(e.target.value))} className="w-full accent-blue-700" />
          </label>

          <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Distância entre fendas</span>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">{decimalComma(slitMm, 2)} mm</span>
            </div>
            <input type="range" min="0.1" max="1.2" step="0.05" value={slitMm} onChange={(e) => setSlitMm(Number(e.target.value))} className="w-full accent-blue-700" />
          </label>

          <FormulaBlock formula={String.raw`\Delta y \approx ${decimalComma(spacingMm, 2)}\,\mathrm{mm}`} />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
          <div className="border-b border-slate-200 bg-white px-5 py-4">
            <h3 className="text-lg font-black text-slate-950">Padrão qualitativo na tela</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Quanto maior Δy, mais afastadas ficam as franjas. O desenho é qualitativo, o cálculo é o que vale.
            </p>
          </div>
          <div className="overflow-x-auto p-5">
            <svg viewBox="0 0 760 300" className="min-w-[680px]">
              <rect x="40" y="35" width="680" height="230" rx="24" fill="#020617" />
              <line x1="380" y1="45" x2="380" y2="255" stroke="#334155" strokeWidth="2" />
              {fringes.map((m) => {
                const x = 380 + m * Math.min(82, Math.max(22, spacingMm * 8));
                const opacity = m === 0 ? 1 : 0.72;
                return (
                  <g key={m}>
                    <rect x={x - 7} y="58" width="14" height="184" rx="7" fill="#facc15" opacity={opacity} />
                    <text x={x - 8} y="278" className="fill-slate-600 text-[13px] font-black">{m}</text>
                  </g>
                );
              })}
              <text x="75" y="25" className="fill-slate-900 text-[16px] font-black">franjas claras: m = -3 ... 3</text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

function MalusSimulator() {
  const [angle, setAngle] = useState(45);
  const ratio = useMemo(() => Math.cos((angle * Math.PI) / 180) ** 2, [angle]);
  const naturalTwoPolarizers = 0.5 * ratio;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="bg-emerald-700 px-7 py-6 text-white md:px-9">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">
              Simulador da Lei de Malus
            </h2>
            <p className="mt-1 text-sm font-semibold text-emerald-100">
              Veja como a intensidade muda com o ângulo entre polarização e analisador.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-7 px-7 py-7 md:px-9 md:py-9 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Ângulo θ</span>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">{angle}°</span>
            </div>
            <input type="range" min="0" max="90" step="1" value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full accent-emerald-700" />
          </label>

          <FormulaBlock formula={String.raw`\frac{I}{I_0}=\cos^2(${angle}^{\circ})\approx ${decimalComma(ratio, 3)}`} />
          <FormulaBlock formula={String.raw`\text{luz natural + 2 polarizadores: }\frac{I}{I_0}\approx ${decimalComma(naturalTwoPolarizers, 3)}`} />

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-[1.02rem] leading-8 text-amber-950">
            Primeiro polarizador com luz natural: transmite metade. Segundo polarizador: aplica Malus. Esse detalhe derruba questão com uma eficiência quase ofensiva.
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
          <div className="border-b border-slate-200 bg-white px-5 py-4">
            <h3 className="text-lg font-black text-slate-950">Curva qualitativa I/I₀ = cos²θ</h3>
          </div>
          <div className="overflow-x-auto p-5">
            <svg viewBox="0 0 760 300" className="min-w-[680px]">
              <line x1="70" y1="245" x2="710" y2="245" stroke="#0f172a" strokeWidth="3" />
              <line x1="70" y1="245" x2="70" y2="45" stroke="#0f172a" strokeWidth="3" />
              <path
                d={Array.from({ length: 91 }, (_, a) => {
                  const x = 70 + (a / 90) * 620;
                  const y = 245 - Math.cos((a * Math.PI) / 180) ** 2 * 180;
                  return `${a === 0 ? "M" : "L"}${x} ${y}`;
                }).join(" ")}
                fill="none"
                stroke="#059669"
                strokeWidth="5"
              />
              <circle cx={70 + (angle / 90) * 620} cy={245 - ratio * 180} r="8" fill="#dc2626" />
              <text x="62" y="35" className="fill-slate-700 text-[14px] font-black">I/I₀</text>
              <text x="690" y="275" className="fill-slate-700 text-[14px] font-black">θ</text>
              <text x="56" y="265" className="fill-slate-700 text-[13px] font-bold">0</text>
              <text x="52" y="72" className="fill-slate-700 text-[13px] font-bold">1</text>
              <text x="365" y="275" className="fill-slate-700 text-[13px] font-bold">45°</text>
              <text x="675" y="275" className="fill-slate-700 text-[13px] font-bold">90°</text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

function PhenomenaMapPanel() {
  const items = [
    ["Interferência", "superposição de ondas coerentes"],
    ["Difração", "espalhamento por abertura ou obstáculo"],
    ["Young", "duas fendas coerentes formando franjas"],
    ["Fenda única", "mínimos por cancelamento dentro da própria abertura"],
    ["Rayleigh", "limite de resolução causado pela difração"],
    ["Polarização", "seleção da direção de oscilação do campo elétrico"],
    ["Malus", "intensidade transmitida por analisador"],
    ["Brewster", "polarização por reflexão em ângulo especial"],
  ];

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="bg-blue-700 px-7 py-6 text-white md:px-9">
        <div className="flex items-center gap-4">
          <Brain className="h-7 w-7" />
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">
            Mapa mental dos fenômenos
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

function OpticsPhysicalDiagram({ diagram }: { diagram: NonNullable<TheorySection["diagram"]> }) {
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
          {diagram.kind === "wave" && <WaveDiagram />}
          {diagram.kind === "young" && <YoungDiagram />}
          {diagram.kind === "singleSlit" && <SingleSlitDiagram />}
          {diagram.kind === "rayleigh" && <RayleighDiagram />}
          {diagram.kind === "polarization" && <PolarizationDiagram />}
        </div>
      </div>
    </div>
  );
}

function WaveDiagram() {
  const points = Array.from({ length: 120 }, (_, index) => {
    const x = 40 + index * 5.8;
    const y = 125 - Math.sin(index / 8) * 42;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 780 260" className="h-auto w-full">
      <defs>
        <marker id="waveArrow" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#0f172a" />
        </marker>
      </defs>

      <line x1="40" y1="125" x2="735" y2="125" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="8 8" />
      <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
      <line x1="65" y1="210" x2="705" y2="210" stroke="#0f172a" strokeWidth="4" markerEnd="url(#waveArrow)" />
      <text x="285" y="240" className="fill-slate-900 text-[18px] font-black">propagação da luz</text>
      <line x1="390" y1="70" x2="390" y2="180" stroke="#dc2626" strokeWidth="5" markerEnd="url(#waveArrow)" />
      <text x="410" y="92" className="fill-red-700 text-[16px] font-black">campo elétrico oscilando</text>
      <text x="58" y="38" className="fill-slate-900 text-[20px] font-black">onda transversal</text>
      <text x="58" y="62" className="fill-slate-600 text-[15px] font-bold">oscilação perpendicular à propagação</text>
    </svg>
  );
}

function YoungDiagram() {
  return (
    <svg viewBox="0 0 820 330" className="h-auto w-full">
      <defs>
        <marker id="youngArrow" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
        </marker>
      </defs>

      <line x1="80" y1="50" x2="80" y2="280" stroke="#0f172a" strokeWidth="8" />
      <line x1="76" y1="133" x2="84" y2="133" stroke="#facc15" strokeWidth="18" />
      <line x1="76" y1="197" x2="84" y2="197" stroke="#facc15" strokeWidth="18" />
      <text x="50" y="308" className="fill-slate-700 text-[15px] font-black">duas fendas</text>

      <line x1="740" y1="40" x2="740" y2="290" stroke="#0f172a" strokeWidth="6" />
      {[70, 105, 140, 175, 210, 245].map((y, index) => (
        <rect key={y} x="730" y={y} width="20" height="16" rx="8" fill={index % 2 === 0 ? "#facc15" : "#111827"} />
      ))}
      <text x="700" y="315" className="fill-slate-700 text-[15px] font-black">tela</text>

      <path d="M85 133 C230 60, 420 70, 740 78" fill="none" stroke="#2563eb" strokeWidth="4" markerEnd="url(#youngArrow)" />
      <path d="M85 197 C250 230, 440 235, 740 218" fill="none" stroke="#2563eb" strokeWidth="4" markerEnd="url(#youngArrow)" />
      <path d="M85 133 C250 145, 440 160, 740 175" fill="none" stroke="#16a34a" strokeWidth="4" markerEnd="url(#youngArrow)" />
      <path d="M85 197 C250 185, 440 178, 740 175" fill="none" stroke="#16a34a" strokeWidth="4" markerEnd="url(#youngArrow)" />

      <line x1="80" y1="305" x2="740" y2="305" stroke="#64748b" strokeWidth="2" />
      <text x="386" y="300" className="fill-slate-700 text-[15px] font-black">D</text>
      <line x1="48" y1="133" x2="48" y2="197" stroke="#64748b" strokeWidth="2" />
      <text x="25" y="170" className="fill-slate-700 text-[15px] font-black">d</text>

      <text x="205" y="42" className="fill-slate-950 text-[20px] font-black">diferença de caminho gera franjas</text>
    </svg>
  );
}

function SingleSlitDiagram() {
  return (
    <svg viewBox="0 0 820 300" className="h-auto w-full">
      <defs>
        <linearGradient id="slitPattern" x1="0" x2="1">
          <stop offset="0%" stopColor="#111827" />
          <stop offset="45%" stopColor="#facc15" />
          <stop offset="55%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
      </defs>

      <line x1="130" y1="35" x2="130" y2="112" stroke="#0f172a" strokeWidth="12" />
      <line x1="130" y1="188" x2="130" y2="265" stroke="#0f172a" strokeWidth="12" />
      <text x="92" y="287" className="fill-slate-700 text-[15px] font-black">fenda a</text>

      {[70, 100, 130, 160, 190, 220].map((y) => (
        <line key={y} x1="25" y1={y} x2="120" y2={y} stroke="#2563eb" strokeWidth="4" />
      ))}

      <path d="M138 150 C250 80, 390 50, 720 50" fill="none" stroke="#2563eb" strokeWidth="4" />
      <path d="M138 150 C260 110, 410 95, 720 95" fill="none" stroke="#2563eb" strokeWidth="3" opacity="0.75" />
      <path d="M138 150 C280 150, 440 150, 720 150" fill="none" stroke="#f59e0b" strokeWidth="7" />
      <path d="M138 150 C260 190, 410 205, 720 205" fill="none" stroke="#2563eb" strokeWidth="3" opacity="0.75" />
      <path d="M138 150 C250 220, 390 250, 720 250" fill="none" stroke="#2563eb" strokeWidth="4" />

      <line x1="740" y1="40" x2="740" y2="260" stroke="#0f172a" strokeWidth="6" />
      <rect x="744" y="75" width="22" height="150" rx="11" fill="url(#slitPattern)" opacity="0.95" />
      <text x="690" y="285" className="fill-slate-700 text-[15px] font-black">máximo central largo</text>
    </svg>
  );
}

function RayleighDiagram() {
  return (
    <div className="space-y-4">
      <svg viewBox="0 0 820 300" className="h-auto w-full">
        <text x="70" y="40" className="fill-slate-950 text-[20px] font-black">dois pontos próximos</text>
        <circle cx="145" cy="95" r="9" fill="#facc15" />
        <circle cx="190" cy="95" r="9" fill="#facc15" />

        <text x="430" y="40" className="fill-slate-950 text-[20px] font-black">padrões de difração</text>
        <path d="M360 230 C390 220, 400 160, 430 120 C460 80, 500 80, 530 120 C560 160, 570 220, 600 230" fill="none" stroke="#2563eb" strokeWidth="5" />
        <path d="M440 230 C470 220, 480 160, 510 120 C540 80, 580 80, 610 120 C640 160, 650 220, 680 230" fill="none" stroke="#dc2626" strokeWidth="5" />
        <line x1="530" y1="120" x2="530" y2="245" stroke="#64748b" strokeWidth="2" strokeDasharray="8 8" />
        <text x="475" y="270" className="fill-slate-700 text-[15px] font-black">limite de resolução</text>
      </svg>

      <FormulaBlock formula={String.raw`\theta_{\min}\approx 1{,}22\frac{\lambda}{D}`} />
    </div>
  );
}

function PolarizationDiagram() {
  return (
    <svg viewBox="0 0 820 310" className="h-auto w-full">
      <defs>
        <marker id="polArrow" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#0f172a" />
        </marker>
      </defs>

      <text x="45" y="35" className="fill-slate-950 text-[18px] font-black">luz natural</text>
      {[0, 30, 60, 90, 120, 150].map((angle, index) => (
        <line
          key={angle}
          x1="120"
          y1="150"
          x2={120 + Math.cos((angle * Math.PI) / 180) * 62}
          y2={150 + Math.sin((angle * Math.PI) / 180) * 62}
          stroke={index % 2 === 0 ? "#2563eb" : "#dc2626"}
          strokeWidth="4"
          strokeLinecap="round"
        />
      ))}

      <rect x="285" y="55" width="70" height="190" rx="16" fill="#0f172a" />
      {[80, 105, 130, 155, 180, 205, 230].map((y) => (
        <line key={y} x1="305" y1={y} x2="335" y2={y} stroke="#e2e8f0" strokeWidth="3" />
      ))}
      <text x="270" y="270" className="fill-slate-700 text-[15px] font-black">polarizador</text>

      <line x1="380" y1="150" x2="540" y2="150" stroke="#2563eb" strokeWidth="5" markerEnd="url(#polArrow)" />
      <line x1="460" y1="90" x2="460" y2="210" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
      <text x="415" y="235" className="fill-blue-700 text-[15px] font-black">polarizada</text>

      <rect x="610" y="55" width="70" height="190" rx="16" fill="#334155" transform="rotate(35 645 150)" />
      <text x="600" y="270" className="fill-slate-700 text-[15px] font-black">analisador</text>

      <text x="585" y="38" className="fill-slate-950 text-[18px] font-black">I = I0 cos²θ</text>
    </svg>
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

        {section.diagram ? <OpticsPhysicalDiagram diagram={section.diagram} /> : null}

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
            <Link
              href="/optica"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition-colors hover:text-blue-700"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">
                ÓPTICA
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">
                Óptica Física
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
                Franjas, fendas e polarizadores: aqui a luz para de fingir que é só raio.
              </h2>

              <p className="mt-6 max-w-3xl text-lg leading-9 text-slate-300">
                Interferência, difração, Critério de Rayleigh, polarização e Lei de Malus
                com interpretação física, fórmulas comentadas, diagramas e foco em prova.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { value: String(theorySections.length), label: "Seções" },
                { value: String(formulas.length), label: "Fórmulas" },
                { value: "7", label: "Diagramas" },
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
                {section.id === 6 ? <YoungSimulator /> : null}
                {section.id === 11 ? <MalusSimulator /> : null}
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
            <PhenomenaMapPanel />

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
