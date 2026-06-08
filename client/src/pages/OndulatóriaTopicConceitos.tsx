import { useMemo, useState, type ElementType } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Atom,
  BookOpen,
  CheckCircle2,
  Compass,
  Eye,
  Gauge,
  Layers3,
  LineChart,
  Radio,
  Route,
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
  | "pulse"
  | "transverseLongitudinal"
  | "classification"
  | "spatialTemporal"
  | "mediumChange"
  | "phase"
  | "wavefront";

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
    title: "Frequência e período",
    formula: String.raw`f=\frac{1}{T}`,
    description: "A frequência é o inverso do período: ela mede quantas oscilações completas ocorrem por segundo.",
    terms: ["f: frequência, em hertz.", "T: período, em segundos.", "1 Hz = 1 s^{-1}."],
    interpretation: ["Período grande significa frequência pequena.", "Período pequeno significa frequência grande.", "Use quando a questão relacionar tempo de oscilação e número de oscilações."],
    derivation: ["Se uma oscilação completa dura T segundos, em 1 segundo ocorre 1/T oscilação.", "Por isso, f = 1/T. A forma inversa é T = 1/f."],
  },
  {
    title: "Relação fundamental das ondas",
    formula: String.raw`v=\lambda f`,
    description: "Relaciona velocidade de propagação, comprimento de onda e frequência em uma onda periódica.",
    terms: ["v: velocidade de propagação da onda.", "λ: comprimento de onda.", "f: frequência."],
    interpretation: ["Em um mesmo meio, se v permanece constante, frequência maior implica comprimento de onda menor.", "Na mudança de meio, se f permanece constante, λ muda junto com v."],
    derivation: ["Durante um período T, a onda avança um comprimento de onda λ.", "Como velocidade é distância dividida por tempo, v = λ/T.", "Como f = 1/T, então v = λf."],
  },
  {
    title: "Velocidade usando período",
    formula: String.raw`v=\frac{\lambda}{T}`,
    description: "Forma útil quando o problema fornece o período em vez da frequência.",
    terms: ["v: velocidade de propagação.", "λ: comprimento de onda.", "T: período."],
    interpretation: ["Use diretamente quando o gráfico temporal fornece T.", "Evita colocar T no lugar de f em v = λf."],
    derivation: ["Em um período, a onda percorre um comprimento de onda.", "Logo, v = λ/T."],
  },
  {
    title: "Frequência angular",
    formula: String.raw`\omega=2\pi f=\frac{2\pi}{T}`,
    description: "Mede a rapidez com que a fase evolui no tempo.",
    terms: ["ω: frequência angular.", "f: frequência.", "T: período.", "2π rad: fase de uma oscilação completa."],
    interpretation: ["f mede ciclos por segundo.", "ω mede radianos por segundo.", "Elas diferem por um fator 2π."],
    derivation: ["Uma oscilação completa corresponde a 2π rad.", "Se ocorrem f oscilações por segundo, a fase percorre 2πf rad/s.", "Assim, ω = 2πf = 2π/T."],
  },
  {
    title: "Número de onda",
    formula: String.raw`k=\frac{2\pi}{\lambda}`,
    description: "Mede a rapidez com que a fase varia no espaço.",
    terms: ["k: número de onda.", "λ: comprimento de onda.", "2π rad: repetição espacial completa."],
    interpretation: ["ω mede variação de fase no tempo.", "k mede variação de fase no espaço.", "Prepara a equação da onda, onde aparecem kx e ωt."],
    derivation: ["Ao longo de uma distância λ, a onda completa uma repetição espacial.", "Uma repetição completa corresponde a 2π rad.", "Logo, k = 2π/λ."],
  },
  {
    title: "Diferença de fase espacial",
    formula: String.raw`\Delta\varphi=\frac{2\pi}{\lambda}\Delta x=k\Delta x`,
    description: "Relaciona a separação espacial entre dois pontos da onda com a diferença de fase entre eles.",
    terms: ["Δφ: diferença de fase.", "Δx: separação espacial.", "λ: comprimento de onda.", "k: número de onda."],
    interpretation: ["Se Δx = λ, então Δφ = 2π e os pontos estão em fase.", "Se Δx = λ/2, então Δφ = π e os pontos estão em oposição de fase."],
    derivation: ["Uma distância λ corresponde a 2π rad.", "Por proporção, Δx corresponde a (2π/λ)Δx.", "Como k = 2π/λ, também vale Δφ = kΔx."],
  },
  {
    title: "Energia e amplitude",
    formula: String.raw`E\propto A^2`,
    description: "Em muitos modelos ondulatórios lineares, a energia ou a intensidade associada à onda cresce com o quadrado da amplitude.",
    terms: ["E: energia associada à onda.", "A: amplitude.", "∝: proporcional a."],
    interpretation: ["Maior amplitude costuma significar maior energia transportada.", "Dobrar a amplitude pode quadruplicar a energia associada, dependendo do modelo.", "A forma exata depende do tipo de onda e da grandeza analisada."],
    warning: "Use como ideia geral para modelos lineares. Intensidade, potência média e energia específica dependem do tipo de onda.",
  },
];

const theorySections: TheorySection[] = [
  {
    icon: BookOpen,
    title: "Contexto físico e importância das ondas",
    accent: "bg-blue-700",
    paragraphs: [
      "Ondulatória começa com uma ideia simples, mas presente em quase toda a Física: uma perturbação pode se propagar, levando energia de uma região para outra.",
      "Quando ouvimos alguém falando, o som chega por meio de uma perturbação de pressão no ar. Quando enxergamos um objeto, a luz chega aos olhos como onda eletromagnética. Quando uma pedra cai na água, a superfície passa a apresentar ondulações. Quando ocorre um terremoto, a energia se espalha pela Terra na forma de ondas sísmicas.",
      "Essa página é a base para o resto da Ondulatória. Antes de estudar equação da onda, ondas em cordas, interferência, difração, acústica, tubos sonoros e Doppler, é preciso entender frequência, período, comprimento de onda, velocidade de propagação, fase e amplitude.",
      "A definição central é que onda é uma perturbação que se propaga transportando energia. O resto do conteúdo nasce dessa frase.",
    ],
    formulas: [
      {
        title: "Ideia central",
        formula: String.raw`\text{onda}=\text{perturbação que se propaga transportando energia}`,
        description: "A onda não é apenas uma forma bonita no espaço. Ela é uma perturbação que se desloca e leva energia.",
        terms: ["perturbação: alteração em relação a um estado de equilíbrio.", "propagação: deslocamento da perturbação pelo espaço e pelo tempo.", "energia: aquilo que é transferido pela onda."],
        interpretation: ["A matéria do meio pode oscilar localmente.", "A perturbação se desloca.", "Em geral, não há transporte líquido de matéria junto com a onda."],
      },
    ],
    notes: [
      {
        title: "Por que isso importa para prova?",
        type: "success",
        body: "Muitas questões de ondas não são difíceis pela conta, mas pela interpretação: o enunciado muda o meio, troca o tipo de gráfico ou mistura velocidade da onda com velocidade das partículas.",
      },
    ],
  },
  {
    icon: Waves,
    title: "O que é uma onda",
    accent: "bg-slate-950",
    paragraphs: [
      "Uma onda é uma perturbação que se propaga no espaço e no tempo. Uma perturbação é uma alteração em relação a um estado de equilíbrio.",
      "Em uma corda esticada, a perturbação pode ser uma deformação para cima ou para baixo. Na superfície da água, pode ser uma elevação ou uma depressão. No ar, pode ser uma região de compressão ou rarefação. Na luz, envolve oscilações dos campos elétrico e magnético.",
      "O ponto mais importante é que a onda transporta energia, mas não transporta matéria de forma líquida ao longo da propagação. Isso não significa que as partículas do meio ficam paradas. Elas se movem, mas geralmente oscilam em torno de posições de equilíbrio.",
      "Imagine uma rolha flutuando na água. Quando uma onda passa, a rolha sobe e desce. Ela não acompanha a onda por longas distâncias como se fosse carregada até a margem. A energia passa; a matéria oscila localmente.",
      "Em uma corda, ocorre algo parecido. A perturbação pode se propagar para a direita enquanto os pontos da corda sobem e descem. Por isso, é essencial diferenciar a velocidade da onda da velocidade das partículas do meio.",
      "Essa ideia conecta Ondulatória com MHS: cada ponto do meio pode executar uma oscilação local, enquanto o padrão dessa oscilação se propaga. Em MHS, estudamos uma oscilação localizada. Em ondas, estudamos uma oscilação que se transmite pelo espaço.",
    ],
    diagram: {
      kind: "pulse",
      title: "pulso e transporte de energia",
      caption: "A perturbação se propaga ao longo da corda enquanto cada ponto do meio oscila localmente.",
    },
    notes: [
      {
        title: "Distinção essencial",
        type: "info",
        body: "Velocidade da onda é a velocidade da perturbação. Velocidade das partículas do meio é a velocidade da oscilação local.",
      },
    ],
  },
  {
    icon: Activity,
    title: "Pulso, trem de ondas e onda periódica",
    accent: "bg-cyan-700",
    paragraphs: [
      "Nem toda onda aparece como uma sequência infinita de cristas e vales. Um pulso é uma perturbação única que se propaga. Se você dá apenas uma sacudida em uma corda esticada, a deformação isolada que viaja pela corda é um pulso.",
      "Um trem de ondas é uma sequência de perturbações. Se a extremidade da corda é movimentada repetidamente, várias perturbações são produzidas em sequência.",
      "Uma onda periódica é aquela cujo padrão se repete regularmente no espaço e no tempo. Ela possui amplitude, período, frequência, comprimento de onda, velocidade de propagação e fase.",
      "Muitos problemas de vestibular usam ondas periódicas porque elas permitem relações matemáticas simples. A repetição espacial é medida pelo comprimento de onda; a repetição temporal é medida pelo período.",
    ],
    bullets: [
      "Pulso: perturbação única.",
      "Trem de ondas: sequência de perturbações.",
      "Onda periódica: padrão repetido no espaço e no tempo.",
      "Comprimento de onda mede repetição espacial.",
      "Período mede repetição temporal.",
    ],
  },
  {
    icon: Radio,
    title: "Meio material e classificação quanto à natureza",
    accent: "bg-purple-700",
    paragraphs: [
      "Para estudar uma onda, uma pergunta aparece logo no começo: ela precisa de meio material para se propagar?",
      "Um meio material é uma região formada por matéria, como ar, água, metal, uma corda, uma mola, o solo ou qualquer substância composta por partículas.",
      "Ondas mecânicas precisam de meio material. O som precisa de ar, água, metal ou outro meio. Uma onda em uma corda precisa da corda. Uma onda sísmica precisa da Terra.",
      "Ondas eletromagnéticas não precisam de meio material. A luz do Sol chega à Terra atravessando o espaço. Ondas de rádio, micro-ondas, infravermelho, ultravioleta, raio X e raio gama também podem se propagar no vácuo.",
      "No vácuo, todas as ondas eletromagnéticas se propagam com velocidade aproximadamente igual a 3,0 · 10⁸ m/s.",
    ],
    formulas: [
      {
        title: "Velocidade da luz no vácuo",
        formula: String.raw`c\approx 3{,}0\cdot 10^8\,\mathrm{m/s}`,
        description: "Velocidade de propagação das ondas eletromagnéticas no vácuo.",
        terms: ["c: velocidade da luz no vácuo.", "m/s: unidade de velocidade no SI."],
        interpretation: ["Luz, rádio, micro-ondas, infravermelho, ultravioleta e raios X são ondas eletromagnéticas.", "No vácuo, todas se propagam com a mesma velocidade c.", "Elas diferem pela frequência e pelo comprimento de onda."],
      },
    ],
    diagram: {
      kind: "classification",
      title: "natureza e dimensão das ondas",
      caption: "A classificação depende da necessidade de meio, da direção de vibração e da dimensão de propagação.",
    },
    notes: [
      { title: "Regra curta", type: "success", body: "Som é mecânico e não se propaga no vácuo. Luz é eletromagnética e se propaga no vácuo." },
    ],
  },
  {
    icon: Compass,
    title: "Classificação quanto à direção de vibração",
    accent: "bg-emerald-700",
    paragraphs: [
      "Quanto à direção de vibração, as ondas podem ser transversais, longitudinais ou mistas. Essa classificação compara a direção de oscilação com a direção de propagação.",
      "Uma onda é transversal quando a direção de vibração é perpendicular à direção de propagação. Em uma corda, por exemplo, a onda pode se propagar horizontalmente enquanto os pontos da corda sobem e descem.",
      "Uma onda é longitudinal quando a vibração ocorre paralelamente à direção de propagação. O exemplo mais importante é o som no ar: as moléculas oscilam para frente e para trás na mesma direção em que a perturbação sonora avança.",
      "Em ondas longitudinais, aparecem compressões e rarefações. Compressão é uma região em que as partículas ficam mais próximas; rarefação é uma região em que ficam mais afastadas.",
      "Algumas ondas podem ter comportamento misto. Ondas na superfície da água, por exemplo, podem envolver componentes verticais e horizontais do movimento das partículas.",
    ],
    diagram: {
      kind: "transverseLongitudinal",
      title: "transversal e longitudinal",
      caption: "Na transversal, vibração e propagação são perpendiculares. Na longitudinal, são paralelas.",
    },
    bullets: [
      "Onda em corda: mecânica e transversal.",
      "Som no ar: mecânica e longitudinal.",
      "Luz: eletromagnética e transversal.",
      "Ondas na superfície da água: comportamento superficial/misto, muitas vezes representado como transversal em modelos simples.",
    ],
  },
  {
    icon: Layers3,
    title: "Classificação quanto à dimensão de propagação",
    accent: "bg-indigo-700",
    paragraphs: [
      "Quanto à dimensão de propagação, as ondas podem ser unidimensionais, bidimensionais ou tridimensionais.",
      "Ondas unidimensionais se propagam ao longo de uma linha. Exemplos: onda em uma corda ideal, onda em uma mola esticada e pulso em um fio.",
      "Ondas bidimensionais se propagam sobre uma superfície. Exemplos: ondas na superfície da água, ondulações em uma membrana e ondas em uma superfície elástica.",
      "Ondas tridimensionais se propagam pelo espaço. Exemplos: som no ar, luz emitida por uma lâmpada, ondas de rádio emitidas por uma antena e ondas sísmicas no interior da Terra.",
      "Em ondas tridimensionais, a energia pode se espalhar em várias direções. Por isso, em muitos casos, a intensidade diminui com a distância, pois a mesma energia se distribui por uma região cada vez maior.",
    ],
    notes: [
      { title: "Cuidado de linguagem", type: "info", body: "A dimensão se refere à propagação da onda, não necessariamente à direção de vibração das partículas do meio." },
    ],
  },
  {
    icon: LineChart,
    title: "Elementos de uma onda periódica",
    accent: "bg-blue-700",
    paragraphs: [
      "Uma onda periódica apresenta um padrão que se repete no espaço e no tempo. Para descrevê-la, usamos crista, vale, linha de equilíbrio, amplitude, comprimento de onda, período, frequência, velocidade de propagação e fase.",
      "Em uma onda transversal, a crista é o ponto de maior deslocamento positivo em relação à posição de equilíbrio. O vale é o ponto de maior deslocamento negativo.",
      "Em ondas longitudinais, como o som, usamos mais os termos compressão e rarefação, pois não existe parte de cima e parte de baixo no mesmo sentido visual.",
      "A linha de equilíbrio é a posição que o meio ocuparia se não houvesse perturbação. A amplitude é o afastamento máximo em relação a essa linha.",
      "O comprimento de onda é a distância entre dois pontos consecutivos em mesma fase. Em ondas transversais, pode ser a distância entre duas cristas consecutivas; em ondas longitudinais, pode ser a distância entre duas compressões consecutivas.",
    ],
    formulas: [
      {
        title: "Amplitude",
        formula: String.raw`A=\text{afastamento máximo em relação ao equilíbrio}`,
        description: "Amplitude mede o deslocamento máximo de um ponto do meio em relação à posição de equilíbrio.",
        terms: ["A: amplitude.", "Equilíbrio: posição do meio sem perturbação."],
        interpretation: ["Amplitude não é a distância total entre crista e vale.", "A distância entre crista e vale é 2A.", "Maior amplitude costuma estar associada a maior energia transportada."],
      },
      {
        title: "Comprimento de onda",
        formula: String.raw`\lambda=\text{distância entre pontos consecutivos em mesma fase}`,
        description: "Comprimento de onda mede a repetição espacial do padrão ondulatório.",
        terms: ["λ: comprimento de onda.", "Mesma fase: pontos no mesmo estado de oscilação."],
        interpretation: ["Entre cristas consecutivas: λ.", "Entre vales consecutivos: λ.", "Entre compressões consecutivas: λ.", "Entre rarefações consecutivas: λ."],
      },
    ],
    notes: [
      { title: "Armadilha clássica", type: "warning", body: "Se a distância vertical entre crista e vale é 0,50 m, a amplitude é 0,25 m. Amplitude é medida do equilíbrio até a crista, não da crista até o vale." },
    ],
  },
  {
    icon: Gauge,
    title: "Período, frequência e velocidade de propagação",
    accent: "bg-slate-950",
    paragraphs: [
      "O período é o tempo necessário para uma oscilação completa. A frequência é o número de oscilações por unidade de tempo. Essas duas grandezas são inversas.",
      "A velocidade de propagação é a velocidade com que a perturbação se desloca pelo meio. Ela não é, em geral, a velocidade de uma partícula do meio.",
      "A relação fundamental das ondas nasce da ideia de que, durante um período, a onda avança um comprimento de onda.",
      "Se a questão fornece frequência, use v = λf. Se fornece período, use v = λ/T ou calcule antes f = 1/T.",
    ],
    formulas: [formulas[0], formulas[1], formulas[2]],
  },
  {
    icon: Target,
    title: "Frequência vem da fonte, velocidade vem do meio",
    accent: "bg-red-700",
    paragraphs: [
      "Uma das ideias mais importantes da Ondulatória é esta: a frequência é determinada pela fonte, a velocidade é determinada pelo meio e o comprimento de onda se ajusta pela relação v = λf.",
      "Se uma fonte vibra com frequência f, ela impõe esse ritmo à onda. Se a onda muda de meio, a fonte continua vibrando no mesmo ritmo. Por isso, em uma mudança comum de meio, a frequência geralmente permanece a mesma.",
      "Mas a velocidade depende do meio. Se a velocidade muda e a frequência permanece constante, o comprimento de onda muda.",
      "Essa ideia é essencial em refração de ondas e em Óptica. Quando a luz passa do ar para o vidro, sua frequência permanece a mesma, mas sua velocidade diminui e seu comprimento de onda também diminui.",
      "Atenção: isso vale para uma fronteira parada entre meios. Quando há movimento relativo entre fonte, observador ou meio, pode aparecer o Efeito Doppler, que será estudado depois.",
    ],
    diagram: {
      kind: "mediumChange",
      title: "mudança de meio",
      caption: "A frequência é mantida pela fonte. A velocidade muda com o meio. O comprimento de onda se ajusta.",
    },
    notes: [
      { title: "Frase para guardar", type: "success", body: "Fonte define f. Meio define v. A relação v = λf ajusta λ." },
    ],
  },
  {
    icon: Sigma,
    title: "Frequência angular, número de onda e fase",
    accent: "bg-purple-700",
    paragraphs: [
      "Em ondas periódicas, é útil falar em fase. A fase indica em que etapa da oscilação um ponto está.",
      "A frequência angular mede a rapidez com que a fase evolui no tempo. Uma oscilação completa corresponde a 2π radianos.",
      "O número de onda mede a rapidez com que a fase varia no espaço. Ele é a grandeza espacial análoga à frequência angular.",
      "Essa comparação é importante: ω mede variação de fase no tempo; k mede variação de fase no espaço.",
      "Dois pontos estão em fase quando realizam a mesma etapa da oscilação ao mesmo tempo. Dois pontos estão em oposição de fase quando estão em etapas opostas da oscilação.",
    ],
    formulas: [formulas[3], formulas[4], formulas[5]],
    diagram: {
      kind: "phase",
      title: "fase e oposição de fase",
      caption: "Pontos separados por λ estão em fase; pontos separados por λ/2 estão em oposição de fase.",
    },
  },
  {
    icon: Eye,
    title: "Gráfico espacial e gráfico temporal",
    accent: "bg-cyan-700",
    paragraphs: [
      "Uma onda pode ser representada por gráficos diferentes. O gráfico espacial mostra a forma da onda em um instante fixo. Geralmente é um gráfico y × x.",
      "No gráfico espacial, o eixo horizontal representa posição. Nele medimos comprimento de onda, amplitude, cristas e vales.",
      "O gráfico temporal mostra o movimento de um ponto específico do meio ao longo do tempo. Geralmente é um gráfico y × t.",
      "No gráfico temporal, o eixo horizontal representa tempo. Nele medimos período, frequência e amplitude.",
      "Essa diferença é uma das maiores fontes de erro em prova. Em gráfico y × x, mede-se λ. Em gráfico y × t, mede-se T. Em ambos, podemos medir amplitude, porque ela aparece no eixo vertical.",
    ],
    diagram: {
      kind: "spatialTemporal",
      title: "gráfico espacial versus temporal",
      caption: "No gráfico y × x medimos λ. No gráfico y × t medimos T. A amplitude aparece nos dois.",
    },
    notes: [
      { title: "Erro que derruba ponto fácil", type: "warning", body: "Não tente medir comprimento de onda em gráfico temporal nem período em gráfico espacial sem informação adicional." },
    ],
  },
  {
    icon: Route,
    title: "Frente de onda e raio de onda",
    accent: "bg-emerald-700",
    paragraphs: [
      "Frente de onda é o conjunto de pontos que vibram em mesma fase. Em ondas circulares na água, por exemplo, as frentes de onda podem ser círculos concêntricos.",
      "Raio de onda é uma linha perpendicular à frente de onda que indica a direção de propagação.",
      "Na Óptica Geométrica, os raios luminosos indicam justamente a direção de propagação da luz.",
      "Essa relação entre frente de onda e raio será útil em reflexão, refração, difração e Óptica.",
    ],
    diagram: {
      kind: "wavefront",
      title: "frente de onda e raio",
      caption: "A frente de onda reúne pontos em mesma fase; o raio indica a direção de propagação.",
    },
  },
  {
    icon: Zap,
    title: "Energia em uma onda",
    accent: "bg-orange-700",
    paragraphs: [
      "Ondas transportam energia. Em uma onda na corda, há energia cinética associada ao movimento dos pontos da corda e energia potencial associada à deformação. Em uma onda sonora, há energia associada às variações de pressão e ao movimento das partículas do meio. Em uma onda eletromagnética, há energia nos campos elétrico e magnético.",
      "Em muitos modelos ondulatórios lineares, a energia transportada ou a intensidade associada à onda cresce com o quadrado da amplitude.",
      "Essa ideia precisa ser usada com cuidado. A forma exata depende do tipo de onda e da grandeza analisada. Mas, como regra qualitativa, maior amplitude costuma significar maior energia transportada.",
    ],
    formulas: [formulas[6]],
  },
  {
    icon: Target,
    title: "Como atacar uma questão de ondas",
    accent: "bg-slate-950",
    paragraphs: [
      "Em questões de ondas, o primeiro passo não é sair aplicando fórmula. O primeiro passo é descobrir que tipo de informação o enunciado entregou: espaço, tempo, meio, frequência, comprimento de onda, fase ou classificação.",
      "Se o enunciado traz um gráfico y × x, o eixo horizontal é posição. Nesse caso, procure comprimento de onda. Se traz um gráfico y × t, o eixo horizontal é tempo. Nesse caso, procure período.",
      "Depois disso, conecte as grandezas. Se você tem T, calcule f = 1/T. Se você tem λ e f, use v = λf. Se a onda mudou de meio, lembre que a frequência geralmente continua determinada pela fonte, enquanto velocidade e comprimento de onda se ajustam.",
      "Esse roteiro evita o erro mais comum: olhar uma senoide bonita e medir a grandeza errada. A curva pode ser idêntica visualmente, mas o eixo horizontal decide tudo.",
    ],
    bullets: [
      "Veja se o gráfico é y × x ou y × t.",
      "Se for y × x, extraia λ.",
      "Se for y × t, extraia T.",
      "Use f = 1/T quando o período aparecer.",
      "Use v = λf ou v = λ/T conforme os dados.",
      "Se mudou de meio, mantenha f e ajuste λ junto com v.",
      "Classifique a onda por definição, não por aparência.",
      "Nunca confunda velocidade da onda com velocidade das partículas do meio.",
    ],
    notes: [
      {
        title: "Modo militar",
        type: "success",
        body: "Prova militar gosta de questão curta com leitura traiçoeira: gráfico espacial, gráfico temporal, unidade misturada e alternativa parecida. O método evita cair nessa pescaria barata.",
      },
    ],
  },
  {
    icon: ShieldCheck,
    title: "Como identificar o tipo de onda em prova",
    accent: "bg-blue-700",
    paragraphs: [
      "Para classificar uma onda, não decore uma lista infinita. Faça perguntas simples.",
      "Ela precisa de meio material? Se sim, é mecânica. Ela pode se propagar no vácuo? Se sim, é eletromagnética.",
      "A vibração é perpendicular ou paralela à propagação? Se é perpendicular, a onda é transversal. Se é paralela, é longitudinal.",
      "A propagação ocorre em linha, superfície ou espaço? Isso define se a onda é unidimensional, bidimensional ou tridimensional.",
      "O enunciado fala de cristas e vales ou compressões e rarefações? Isso ajuda a reconhecer se a representação é transversal ou longitudinal.",
    ],
    bullets: [
      "Precisa de meio material? Mecânica.",
      "Propaga-se no vácuo? Eletromagnética.",
      "Vibração perpendicular à propagação? Transversal.",
      "Vibração paralela à propagação? Longitudinal.",
      "Propaga-se em linha? Unidimensional.",
      "Propaga-se em superfície? Bidimensional.",
      "Propaga-se no espaço? Tridimensional.",
    ],
  },
];

const examples: ExampleItem[] = [
  {
    title: "Amplitude e comprimento de onda em gráfico espacial",
    level: "leitura de gráfico",
    statement: "Um gráfico espacial y × x mostra uma onda transversal em uma corda em determinado instante. A crista está a 0,20 m acima da linha de equilíbrio, e a distância entre duas cristas consecutivas é 0,80 m. Determine a amplitude e o comprimento de onda.",
    idea: "Como o gráfico é y × x, o eixo horizontal representa posição. A distância entre cristas consecutivas fornece λ. A amplitude é o afastamento máximo em relação ao equilíbrio.",
    steps: ["A crista está a 0,20 m acima da linha de equilíbrio.", "Logo, A = 0,20 m.", "A distância entre cristas consecutivas é 0,80 m.", "Como o comprimento de onda é a distância entre pontos consecutivos em mesma fase, λ = 0,80 m."],
    answer: "A = 0,20 m e λ = 0,80 m.",
    test: "A questão queria testar leitura de gráfico espacial e a diferença entre amplitude e distância crista-vale.",
  },
  {
    title: "Período e frequência",
    level: "aplicação direta",
    statement: "Um ponto de uma corda realiza 5 oscilações completas em 2 s. Determine a frequência e o período.",
    idea: "Frequência é número de oscilações por unidade de tempo. Depois usamos T = 1/f.",
    steps: ["A frequência é f = 5/2.", "Logo, f = 2,5 Hz.", "O período é T = 1/f.", "Assim, T = 1/2,5 = 0,40 s."],
    answer: "f = 2,5 Hz e T = 0,40 s.",
    test: "A questão queria testar a definição de frequência e a relação inversa entre frequência e período.",
  },
  {
    title: "Velocidade de propagação",
    level: "aplicação direta",
    statement: "Uma onda periódica tem comprimento de onda λ = 0,50 m e frequência f = 20 Hz. Determine sua velocidade de propagação.",
    idea: "Use a relação fundamental v = λf.",
    steps: ["Substitua λ = 0,50 m e f = 20 Hz.", "v = 0,50 · 20.", "v = 10 m/s."],
    answer: "v = 10 m/s.",
    test: "A questão queria testar aplicação direta da relação fundamental das ondas.",
  },
  {
    title: "Encontrando comprimento de onda",
    level: "aplicação direta",
    statement: "Uma onda sonora se propaga no ar com velocidade v = 340 m/s e frequência f = 170 Hz. Determine o comprimento de onda.",
    idea: "Use v = λf e isole λ.",
    steps: ["Da relação v = λf, temos λ = v/f.", "λ = 340/170.", "λ = 2 m."],
    answer: "λ = 2 m.",
    test: "A questão queria testar manipulação da relação fundamental e interpretação do comprimento de onda em som.",
  },
  {
    title: "Mudança de meio",
    level: "conceitual importante",
    statement: "Uma onda passa de um meio para outro. Sua frequência permanece constante, mas sua velocidade cai pela metade. O que acontece com o comprimento de onda?",
    idea: "Se f permanece constante, v e λ são diretamente proporcionais pela relação v = λf.",
    steps: ["No primeiro meio: v₁ = λ₁f.", "No segundo meio: v₂ = λ₂f.", "Como a frequência é a mesma, v₂/v₁ = λ₂/λ₁.", "Se v₂ = v₁/2, então λ₂ = λ₁/2."],
    answer: "O comprimento de onda também cai pela metade.",
    test: "A questão queria testar a ideia de que, na mudança comum de meio, a frequência permanece determinada pela fonte.",
  },
  {
    title: "Classificação de ondas",
    level: "conceitual",
    statement: "Classifique: som no ar, luz no vácuo, onda em corda e onda na superfície da água.",
    idea: "Use o roteiro: precisa de meio? direção de vibração? dimensão de propagação?",
    steps: ["Som no ar: mecânica, longitudinal e tridimensional.", "Luz no vácuo: eletromagnética, transversal e tridimensional.", "Onda em corda: mecânica, transversal e unidimensional.", "Onda na superfície da água: mecânica, superficial/bidimensional, frequentemente tratada como transversal em modelo simples, mas com comportamento real misto."],
    answer: "Som: mecânica longitudinal. Luz: eletromagnética transversal. Corda: mecânica transversal. Água: mecânica superficial, geralmente bidimensional.",
    test: "A questão queria testar classificação conceitual sem depender só da aparência visual da onda.",
  },
  {
    title: "Gráfico temporal",
    level: "leitura de gráfico",
    statement: "Um gráfico y × t mostra que duas cristas consecutivas passam por um ponto com intervalo de 0,25 s. Determine o período, a frequência e explique por que não dá para obter λ apenas desse gráfico.",
    idea: "O gráfico é temporal. O eixo horizontal representa tempo. O intervalo entre cristas fornece T, não λ.",
    steps: ["O intervalo entre cristas consecutivas é 0,25 s.", "Logo, T = 0,25 s.", "A frequência é f = 1/T = 1/0,25 = 4 Hz.", "Não é possível obter λ diretamente porque o gráfico não fornece distâncias espaciais."],
    answer: "T = 0,25 s, f = 4 Hz. Não dá para obter λ apenas do gráfico temporal sem informação adicional.",
    test: "A questão queria testar a diferença entre gráfico temporal e espacial.",
  },
  {
    title: "Fase",
    level: "conceitual com fórmula",
    statement: "Dois pontos de uma onda periódica estão separados por λ/2. Determine a diferença de fase entre eles e explique o significado físico.",
    idea: "Use Δφ = (2π/λ)Δx, com Δx = λ/2.",
    steps: ["Δφ = (2π/λ)(λ/2).", "Cancelando λ, obtemos Δφ = π.", "Diferença de fase π significa oposição de fase.", "Se um ponto está na crista, o outro está no vale."],
    answer: "Δφ = π rad. Os pontos estão em oposição de fase.",
    test: "A questão queria testar relação entre separação espacial e fase.",
  },
  {
    title: "Combinando gráfico espacial e temporal",
    level: "militar/intermediário",
    statement: "Para uma mesma onda, um gráfico y × x mostra que a distância entre duas cristas consecutivas é 0,80 m. Outro gráfico y × t, feito para um ponto fixo do meio, mostra que o intervalo entre duas cristas consecutivas é 0,20 s. Determine λ, T, f e v.",
    idea: "O gráfico espacial fornece λ. O gráfico temporal fornece T. Depois usamos f = 1/T e v = λf.",
    steps: ["Do gráfico y × x, a distância entre cristas consecutivas é λ = 0,80 m.", "Do gráfico y × t, o intervalo entre cristas consecutivas é T = 0,20 s.", "A frequência é f = 1/T = 1/0,20 = 5 Hz.", "A velocidade é v = λf = 0,80 · 5 = 4,0 m/s."],
    answer: "λ = 0,80 m, T = 0,20 s, f = 5 Hz e v = 4,0 m/s.",
    test: "A questão queria testar a leitura correta dos dois tipos de gráfico. É exatamente o tipo de pegadinha limpa que prova militar gosta.",
  },
  {
    title: "Questão mista de grandezas",
    level: "revisão geral",
    statement: "Uma onda periódica em uma corda tem amplitude 0,04 m, comprimento de onda 0,60 m e frequência 5 Hz. Determine velocidade, período e interprete cada grandeza.",
    idea: "Use v = λf e T = 1/f. A amplitude não entra na velocidade, mas indica afastamento máximo e está ligada à energia.",
    steps: ["Dados: A = 0,04 m, λ = 0,60 m e f = 5 Hz.", "v = λf = 0,60 · 5 = 3,0 m/s.", "T = 1/f = 1/5 = 0,20 s.", "A amplitude indica afastamento máximo de 4 cm em relação ao equilíbrio."],
    answer: "v = 3,0 m/s e T = 0,20 s.",
    test: "A questão queria testar interpretação conjunta das grandezas fundamentais.",
  },
];

const traps = [
  "Achar que a onda transporta matéria junto com ela.",
  "Confundir velocidade da onda com velocidade das partículas do meio.",
  "Achar que a partícula marcada acompanha a onda ao longo da propagação.",
  "Confundir amplitude com distância crista-vale.",
  "Confundir período com frequência.",
  "Esquecer que f = 1/T.",
  "Usar T no lugar de f em v = λf.",
  "Confundir gráfico y × x com gráfico y × t.",
  "Tentar medir λ em gráfico temporal.",
  "Tentar medir T em gráfico espacial.",
  "Achar que som se propaga no vácuo.",
  "Achar que toda onda transversal é eletromagnética.",
  "Achar que toda onda mecânica é longitudinal.",
  "Confundir crista/vale com compressão/rarefação.",
  "Confundir frequência angular ω com frequência f.",
  "Confundir número de onda k com frequência.",
  "Achar que mudança de meio sempre muda a frequência.",
  "Esquecer unidades, especialmente cm, mm, μm e nm.",
];

const checklist = [
  "Sei definir onda como perturbação que se propaga transportando energia?",
  "Sei explicar por que não há transporte líquido de matéria?",
  "Sei diferenciar pulso, trem de ondas e onda periódica?",
  "Sei explicar a diferença entre a onda se propagando e a partícula do meio oscilando?",
  "Sei diferenciar onda mecânica e eletromagnética?",
  "Sei explicar por que som não se propaga no vácuo?",
  "Sei explicar por que luz se propaga no vácuo?",
  "Sei diferenciar onda transversal e longitudinal?",
  "Sei reconhecer compressões e rarefações?",
  "Sei classificar ondas por dimensão de propagação?",
  "Sei identificar amplitude e não confundir com crista-vale?",
  "Sei identificar comprimento de onda?",
  "Sei diferenciar período e frequência?",
  "Sei usar v = λf e v = λ/T?",
  "Sei explicar que frequência vem da fonte e velocidade vem do meio?",
  "Sei interpretar gráfico y × x?",
  "Sei interpretar gráfico y × t?",
  "Sei usar k = 2π/λ?",
  "Sei reconhecer pontos em fase e oposição de fase?",
  "Sei converter unidades corretamente?",
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

function NoteCard({ title, type, body }: { title: string; type: NoteType; body: string }) {
  const styles = {
    info: { wrap: "border-blue-200 bg-blue-50", icon: "text-blue-700", Icon: Sparkles },
    warning: { wrap: "border-amber-200 bg-amber-50", icon: "text-amber-700", Icon: AlertTriangle },
    success: { wrap: "border-emerald-200 bg-emerald-50", icon: "text-emerald-700", Icon: CheckCircle2 },
  }[type];
  const Icon = styles.Icon;
  return (
    <div className={`rounded-2xl border p-5 ${styles.wrap}`}>
      <div className="mb-3 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${styles.icon}`} />
        <h4 className="text-base font-black text-slate-950">{title}</h4>
      </div>
      <p className="text-justify text-[1.02rem] leading-8 text-slate-700">{body}</p>
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
        <p className="text-justify text-[1.02rem] leading-8 text-slate-700">{item.description}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950">Termo a termo</h4>
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
            <h4 className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950">Interpretação</h4>
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
            <h4 className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-blue-950">Demonstração e leitura de prova</h4>
            <div className="space-y-3">
              {item.derivation.map((line) => (
                <p key={line} className="text-sm leading-7 text-slate-700">{line}</p>
              ))}
            </div>
          </div>
        ) : null}
        {item.warning ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-900">{item.warning}</div>
        ) : null}
      </div>
    </article>
  );
}

function WaveDiagram({ diagram }: { diagram: NonNullable<TheorySection["diagram"]> }) {
  return (
    <div className="my-7 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200 bg-slate-950 px-6 py-4">
        <h3 className="text-lg font-black text-white">Diagrama visual: {diagram.title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-300">{diagram.caption}</p>
      </div>
      <div className="overflow-x-auto p-5 md:p-7">
        <div className="min-w-[720px] rounded-2xl bg-white p-5">
          {diagram.kind === "pulse" && <PulseDiagram />}
          {diagram.kind === "transverseLongitudinal" && <TransverseLongitudinalDiagram />}
          {diagram.kind === "classification" && <ClassificationDiagram />}
          {diagram.kind === "spatialTemporal" && <SpatialTemporalDiagram />}
          {diagram.kind === "mediumChange" && <MediumChangeDiagram />}
          {diagram.kind === "phase" && <PhaseDiagram />}
          {diagram.kind === "wavefront" && <WavefrontDiagram />}
        </div>
      </div>
    </div>
  );
}

function PulseDiagram() {
  return (
    <svg viewBox="0 0 820 300" className="h-auto w-full">
      <defs><marker id="pulseArrow" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#2563eb" /></marker></defs>
      <line x1="70" y1="185" x2="750" y2="185" stroke="#cbd5e1" strokeWidth="4" />
      <path d="M80 185 C170 185, 190 185, 230 120 C260 72, 310 72, 340 120 C380 185, 410 185, 740 185" fill="none" stroke="#0f172a" strokeWidth="7" strokeLinecap="round" />
      <line x1="430" y1="95" x2="610" y2="95" stroke="#2563eb" strokeWidth="6" markerEnd="url(#pulseArrow)" />
      <text x="445" y="75" className="fill-blue-700 text-[18px] font-black">propagação da perturbação</text>
      <line x1="285" y1="185" x2="285" y2="120" stroke="#dc2626" strokeWidth="5" />
      <text x="300" y="158" className="fill-red-700 text-[16px] font-black">ponto do meio oscila</text>
      <text x="110" y="250" className="fill-slate-700 text-[16px] font-black">a onda avança; a matéria oscila localmente</text>
    </svg>
  );
}

function TransverseLongitudinalDiagram() {
  return (
    <svg viewBox="0 0 820 340" className="h-auto w-full">
      <defs>
        <marker id="propArrow" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#2563eb" /></marker>
        <marker id="vibArrow" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#dc2626" /></marker>
      </defs>
      <text x="70" y="35" className="fill-slate-950 text-[20px] font-black">onda transversal</text>
      <path d="M70 115 C115 55, 160 55, 205 115 C250 175, 295 175, 340 115 C385 55, 430 55, 475 115" fill="none" stroke="#0f172a" strokeWidth="6" />
      <line x1="95" y1="215" x2="260" y2="215" stroke="#2563eb" strokeWidth="5" markerEnd="url(#propArrow)" />
      <text x="105" y="245" className="fill-blue-700 text-[15px] font-black">propagação</text>
      <line x1="370" y1="170" x2="370" y2="80" stroke="#dc2626" strokeWidth="5" markerEnd="url(#vibArrow)" />
      <text x="390" y="130" className="fill-red-700 text-[15px] font-black">vibração</text>
      <text x="500" y="35" className="fill-slate-950 text-[20px] font-black">onda longitudinal</text>
      {Array.from({ length: 18 }, (_, i) => {
        const dense = (i > 3 && i < 8) || (i > 11 && i < 15);
        return <circle key={i} cx={520 + i * (dense ? 11 : 16)} cy={125} r={6} fill={dense ? "#2563eb" : "#94a3b8"} />;
      })}
      <line x1="520" y1="215" x2="700" y2="215" stroke="#2563eb" strokeWidth="5" markerEnd="url(#propArrow)" />
      <text x="545" y="245" className="fill-blue-700 text-[15px] font-black">propagação</text>
      <line x1="610" y1="165" x2="690" y2="165" stroke="#dc2626" strokeWidth="5" markerEnd="url(#vibArrow)" />
      <text x="595" y="192" className="fill-red-700 text-[15px] font-black">vibração paralela</text>
      <text x="540" y="88" className="fill-slate-700 text-[14px] font-black">compressões e rarefações</text>
    </svg>
  );
}

function ClassificationDiagram() {
  const boxes = [["Natureza", "mecânica", "eletromagnética"], ["Vibração", "transversal", "longitudinal"], ["Dimensão", "1D", "2D", "3D"]];
  return (
    <svg viewBox="0 0 820 300" className="h-auto w-full">
      {boxes.map((box, i) => (
        <g key={box[0]} transform={`translate(${75 + i * 245},55)`}>
          <rect width="200" height="160" rx="22" fill="#f8fafc" stroke="#0f172a" strokeWidth="4" />
          <text x="24" y="40" className="fill-slate-950 text-[20px] font-black">{box[0]}</text>
          {box.slice(1).map((item, j) => (
            <g key={item}>
              <circle cx="28" cy={78 + j * 34} r="6" fill="#2563eb" />
              <text x="45" y={84 + j * 34} className="fill-slate-700 text-[16px] font-bold">{item}</text>
            </g>
          ))}
        </g>
      ))}
      <text x="180" y="260" className="fill-slate-700 text-[16px] font-black">classifique por definição, não por aparência</text>
    </svg>
  );
}

function SpatialTemporalDiagram() {
  const wavePath = (x0: number, y0: number, color: string) => {
    const points = Array.from({ length: 150 }, (_, i) => {
      const x = x0 + i * 2.05;
      const y = y0 - Math.sin(i / 12) * 34;
      return `${i === 0 ? "M" : "L"}${x} ${y}`;
    }).join(" ");
    return <path d={points} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />;
  };

  return (
    <svg viewBox="0 0 820 390" className="h-auto w-full">
      <defs>
        <marker id="graphArrow" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#0f172a" />
        </marker>
      </defs>

      <text x="78" y="35" className="fill-slate-950 text-[20px] font-black">gráfico espacial: y × x</text>
      <line x1="75" y1="155" x2="390" y2="155" stroke="#0f172a" strokeWidth="3" markerEnd="url(#graphArrow)" />
      <line x1="75" y1="235" x2="75" y2="70" stroke="#0f172a" strokeWidth="3" markerEnd="url(#graphArrow)" />
      <text x="380" y="180" className="fill-slate-700 text-[15px] font-black">x</text>
      <text x="54" y="82" className="fill-slate-700 text-[15px] font-black">y</text>
      {wavePath(80, 155, "#2563eb")}
      <line x1="118" y1="250" x2="270" y2="250" stroke="#dc2626" strokeWidth="5" />
      <text x="177" y="276" className="fill-red-700 text-[17px] font-black">λ</text>
      <line x1="118" y1="155" x2="118" y2="121" stroke="#16a34a" strokeWidth="5" />
      <text x="130" y="142" className="fill-emerald-700 text-[17px] font-black">A</text>
      <rect x="84" y="302" width="278" height="52" rx="16" fill="#eff6ff" stroke="#bfdbfe" />
      <text x="103" y="326" className="fill-blue-900 text-[14px] font-black">eixo horizontal em metros</text>
      <text x="103" y="346" className="fill-blue-900 text-[14px] font-bold">mede comprimento de onda λ</text>

      <text x="498" y="35" className="fill-slate-950 text-[20px] font-black">gráfico temporal: y × t</text>
      <line x1="490" y1="155" x2="805" y2="155" stroke="#0f172a" strokeWidth="3" markerEnd="url(#graphArrow)" />
      <line x1="490" y1="235" x2="490" y2="70" stroke="#0f172a" strokeWidth="3" markerEnd="url(#graphArrow)" />
      <text x="794" y="180" className="fill-slate-700 text-[15px] font-black">t</text>
      <text x="469" y="82" className="fill-slate-700 text-[15px] font-black">y</text>
      {wavePath(495, 155, "#16a34a")}
      <line x1="533" y1="250" x2="685" y2="250" stroke="#dc2626" strokeWidth="5" />
      <text x="594" y="276" className="fill-red-700 text-[17px] font-black">T</text>
      <line x1="533" y1="155" x2="533" y2="121" stroke="#16a34a" strokeWidth="5" />
      <text x="545" y="142" className="fill-emerald-700 text-[17px] font-black">A</text>
      <rect x="505" y="302" width="278" height="52" rx="16" fill="#ecfdf5" stroke="#bbf7d0" />
      <text x="524" y="326" className="fill-emerald-900 text-[14px] font-black">eixo horizontal em segundos</text>
      <text x="524" y="346" className="fill-emerald-900 text-[14px] font-bold">mede período T</text>
    </svg>
  );
}

function MediumChangeDiagram() {
  return (
    <svg viewBox="0 0 820 330" className="h-auto w-full">
      <defs><marker id="mediumArrow" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#0f172a" /></marker></defs>
      <rect x="60" y="50" width="330" height="210" rx="22" fill="#eff6ff" stroke="#2563eb" strokeWidth="4" />
      <rect x="430" y="50" width="330" height="210" rx="22" fill="#ecfdf5" stroke="#16a34a" strokeWidth="4" />
      <text x="175" y="88" className="fill-blue-700 text-[20px] font-black">meio 1</text>
      <text x="545" y="88" className="fill-emerald-700 text-[20px] font-black">meio 2</text>
      <path d="M85 160 C125 110, 165 110, 205 160 C245 210, 285 210, 325 160" fill="none" stroke="#2563eb" strokeWidth="6" />
      <path d="M455 160 C485 125, 515 125, 545 160 C575 195, 605 195, 635 160 C665 125, 695 125, 725 160" fill="none" stroke="#16a34a" strokeWidth="6" />
      <line x1="392" y1="160" x2="428" y2="160" stroke="#0f172a" strokeWidth="5" markerEnd="url(#mediumArrow)" />
      <text x="120" y="245" className="fill-slate-700 text-[15px] font-black">v₁ maior → λ₁ maior</text>
      <text x="488" y="245" className="fill-slate-700 text-[15px] font-black">v₂ menor → λ₂ menor</text>
      <text x="285" y="300" className="fill-red-700 text-[17px] font-black">frequência permanece determinada pela fonte</text>
    </svg>
  );
}

function PhaseDiagram() {
  return (
    <svg viewBox="0 0 820 330" className="h-auto w-full">
      <path d="M70 160 C115 95, 160 95, 205 160 C250 225, 295 225, 340 160 C385 95, 430 95, 475 160 C520 225, 565 225, 610 160 C655 95, 700 95, 745 160" fill="none" stroke="#0f172a" strokeWidth="6" />
      <line x1="115" y1="255" x2="385" y2="255" stroke="#2563eb" strokeWidth="5" />
      <text x="235" y="282" className="fill-blue-700 text-[17px] font-black">λ: mesma fase</text>
      <line x1="115" y1="70" x2="250" y2="70" stroke="#dc2626" strokeWidth="5" />
      <text x="155" y="55" className="fill-red-700 text-[17px] font-black">λ/2: oposição</text>
      <circle cx="115" cy="95" r="9" fill="#2563eb" />
      <circle cx="385" cy="95" r="9" fill="#2563eb" />
      <circle cx="250" cy="225" r="9" fill="#dc2626" />
      <text x="88" y="42" className="fill-slate-950 text-[20px] font-black">fase compara estados de oscilação</text>
    </svg>
  );
}

function WavefrontDiagram() {
  return (
    <svg viewBox="0 0 820 330" className="h-auto w-full">
      <defs><marker id="rayArrow" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#dc2626" /></marker></defs>
      {[70, 130, 190, 250].map((x) => <line key={x} x1={x} y1="60" x2={x} y2="260" stroke="#2563eb" strokeWidth="5" />)}
      {[95, 155, 215].map((x) => <line key={x} x1={x} y1="160" x2={x + 115} y2="160" stroke="#dc2626" strokeWidth="5" markerEnd="url(#rayArrow)" />)}
      <text x="72" y="300" className="fill-blue-700 text-[16px] font-black">frentes de onda planas</text>
      <text x="142" y="145" className="fill-red-700 text-[16px] font-black">raios perpendiculares</text>
      <circle cx="590" cy="165" r="20" fill="#0f172a" />
      {[45, 80, 115].map((r) => <circle key={r} cx="590" cy="165" r={r} fill="none" stroke="#16a34a" strokeWidth="4" />)}
      <line x1="590" y1="165" x2="720" y2="110" stroke="#dc2626" strokeWidth="5" markerEnd="url(#rayArrow)" />
      <text x="505" y="300" className="fill-emerald-700 text-[16px] font-black">frentes circulares</text>
    </svg>
  );
}

function ParticleVsWaveAnimation() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <style>{`
        @keyframes wave-slide {
          from { transform: translateX(0px); }
          to { transform: translateX(150px); }
        }
        @keyframes particle-oscillate {
          0%, 100% { transform: translateY(0px); }
          25% { transform: translateY(-42px); }
          75% { transform: translateY(42px); }
        }
        .wave-pattern-slide {
          animation: wave-slide 4s linear infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .particle-local-oscillation {
          animation: particle-oscillate 2s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        @media (prefers-reduced-motion: reduce) {
          .wave-pattern-slide,
          .particle-local-oscillation {
            animation: none;
          }
        }
      `}</style>

      <div className="bg-blue-700 px-7 py-6 text-white md:px-9">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">
              Animação: partícula do meio versus onda
            </h2>
            <p className="mt-1 text-sm font-semibold text-blue-100">
              A perturbação avança; um ponto do meio apenas oscila localmente.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-7 px-7 py-7 md:px-9 md:py-9 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <svg viewBox="0 0 820 330" className="min-w-[720px]">
            <defs>
              <marker id="movingWaveArrow" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
              </marker>
            </defs>
            <rect x="30" y="35" width="760" height="250" rx="28" fill="#ffffff" stroke="#e2e8f0" />
            <line x1="70" y1="170" x2="750" y2="170" stroke="#cbd5e1" strokeWidth="3" />
            <g className="wave-pattern-slide">
              <path
                d="M-80 170 C-35 105, 10 105, 55 170 C100 235, 145 235, 190 170 C235 105, 280 105, 325 170 C370 235, 415 235, 460 170 C505 105, 550 105, 595 170 C640 235, 685 235, 730 170 C775 105, 820 105, 865 170"
                fill="none"
                stroke="#0f172a"
                strokeWidth="7"
                strokeLinecap="round"
              />
            </g>
            <line x1="505" y1="78" x2="690" y2="78" stroke="#2563eb" strokeWidth="6" markerEnd="url(#movingWaveArrow)" />
            <text x="525" y="58" className="fill-blue-700 text-[18px] font-black">onda se propaga</text>

            <line x1="315" y1="85" x2="315" y2="255" stroke="#94a3b8" strokeWidth="3" strokeDasharray="8 8" />
            <g className="particle-local-oscillation">
              <circle cx="315" cy="170" r="13" fill="#dc2626" />
            </g>
            <text x="95" y="305" className="fill-red-700 text-[17px] font-black">partícula marcada: sobe e desce, mas não viaja junto com a onda</text>
          </svg>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-black text-slate-950">O que está se movendo?</h3>
            <p className="mt-2 text-justify text-[1.02rem] leading-8 text-slate-700">
              O desenho separa duas coisas: o padrão da onda se desloca horizontalmente, enquanto a partícula marcada oscila perto da própria posição de equilíbrio.
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 className="text-lg font-black text-emerald-950">Leitura física</h3>
            <p className="mt-2 text-justify text-[1.02rem] leading-8 text-slate-700">
              A onda transporta energia. O meio transmite a perturbação por oscilações locais. É por isso que velocidade da onda e velocidade da partícula do meio não são a mesma grandeza.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function WaveRelationSimulator() {
  const [lambda, setLambda] = useState(0.8);
  const [frequency, setFrequency] = useState(5);

  const velocity = useMemo(() => lambda * frequency, [lambda, frequency]);
  const period = useMemo(() => 1 / frequency, [frequency]);
  const omega = useMemo(() => 2 * Math.PI * frequency, [frequency]);
  const k = useMemo(() => (2 * Math.PI) / lambda, [lambda]);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="bg-slate-950 px-7 py-6 text-white md:px-9">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20"><SlidersHorizontal className="h-6 w-6" /></div>
          <div>
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">Simulador rápido: relação fundamental</h2>
            <p className="mt-1 text-sm font-semibold text-slate-300">Ajuste comprimento de onda e frequência para ver velocidade, período, frequência angular e número de onda.</p>
          </div>
        </div>
      </div>
      <div className="grid gap-7 px-7 py-7 md:px-9 md:py-9 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Comprimento de onda</span>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">{decimalComma(lambda, 2)} m</span>
            </div>
            <input type="range" min="0.1" max="5" step="0.1" value={lambda} onChange={(e) => setLambda(Number(e.target.value))} className="w-full accent-blue-700" />
          </label>
          <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Frequência</span>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">{decimalComma(frequency, 1)} Hz</span>
            </div>
            <input type="range" min="0.5" max="30" step="0.5" value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} className="w-full accent-blue-700" />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[["v", `${decimalComma(velocity, 2)} m/s`], ["T", `${decimalComma(period, 3)} s`], ["ω", `${decimalComma(omega, 2)} rad/s`], ["k", `${decimalComma(k, 2)} rad/m`]].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
            </div>
          ))}
          <div className="sm:col-span-2 rounded-3xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-justify text-[1.02rem] leading-8 text-slate-700">A frequência mede repetição no tempo. O comprimento de onda mede repetição no espaço. A velocidade conecta os dois: se a fonte muda a frequência em um mesmo meio, o comprimento de onda se ajusta.</p>
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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20"><Icon className="h-6 w-6" /></div>
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">{section.title}</h2>
        </div>
      </div>
      <div className="space-y-6 px-7 py-7 md:px-9 md:py-9">
        {section.paragraphs.map((paragraph) => <p key={paragraph} className="text-justify text-[1.06rem] leading-9 text-slate-700">{paragraph}</p>)}
        {section.diagram ? <WaveDiagram diagram={section.diagram} /> : null}
        {section.formulas ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {section.formulas.filter(Boolean).map((formula) => <FormulaCard key={formula.title} item={formula} />)}
          </div>
        ) : null}
        {section.bullets ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <ul className="space-y-3">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3 text-[1.02rem] leading-8 text-slate-700">
                  <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-blue-600" /><span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {section.notes ? <div className="space-y-4">{section.notes.map((note) => <NoteCard key={note.title} title={note.title} type={note.type} body={note.body} />)}</div> : null}
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
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">Exemplo {index + 1} · {example.level}</p>
            <h3 className="mt-1 text-2xl font-black">{example.title}</h3>
          </div>
          <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black">resolvido</div>
        </div>
      </div>
      <div className="space-y-5 px-6 py-6 md:px-8 md:py-8">
        <div>
          <h4 className="text-base font-black text-slate-950">Enunciado</h4>
          <p className="mt-2 rounded-2xl bg-slate-50 p-4 text-justify text-[1.02rem] leading-8 text-slate-700">{example.statement}</p>
        </div>
        <NoteCard title="Ideia antes da conta" type="info" body={example.idea} />
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h4 className="mb-4 text-base font-black text-slate-950">Desenvolvimento</h4>
          <div className="space-y-4">
            {example.steps.map((step, stepIndex) => (
              <div key={step} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">{stepIndex + 1}</div>
                <p className="pt-0.5 text-[1.02rem] leading-8 text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold leading-8 text-emerald-950">{example.answer}</div>
        <NoteCard title="O que a questão queria testar" type="warning" body={example.test} />
      </div>
    </article>
  );
}

function SummaryMapPanel() {
  const items = [
    ["Definição", "Onda é perturbação que se propaga transportando energia."],
    ["Matéria", "As partículas oscilam localmente; a perturbação se propaga."],
    ["Natureza", "Mecânicas precisam de meio; eletromagnéticas não."],
    ["Vibração", "Transversal: perpendicular. Longitudinal: paralela."],
    ["Grandezas", "A, λ, T, f, v, ω e k descrevem a onda periódica."],
    ["Relação central", "v = λf conecta repetição espacial e temporal."],
    ["Mudança de meio", "Fonte define f; meio define v; λ se ajusta."],
    ["Gráficos", "y × x fornece λ; y × t fornece T."],
  ];
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="bg-blue-700 px-7 py-6 text-white md:px-9">
        <div className="flex items-center gap-4"><Atom className="h-7 w-7" /><h2 className="text-2xl font-black tracking-tight md:text-3xl">Mapa mental dos conceitos fundamentais</h2></div>
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

export default function OndulatoriaTopicConceitos() {
  const [activeTab, setActiveTab] = useState<Tab>("teoria");
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-5">
            <Link href="/ondulatoria" className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition-colors hover:text-blue-700"><ArrowLeft className="h-6 w-6" /></Link>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">OSCILAÇÕES E ONDAS</p>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">Ondas: Conceitos Fundamentais</h1>
            </div>
          </div>
          <nav className="hidden items-center gap-3 md:flex">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`rounded-full px-7 py-3 text-lg font-black transition ${activeTab === tab.id ? "bg-slate-950 text-white shadow-[0_10px_30px_rgba(15,23,42,0.22)]" : "text-slate-600 hover:text-slate-950"}`}>{tab.label}</button>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
        <section className="overflow-hidden rounded-[2.2rem] bg-slate-950 px-8 py-10 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] md:px-10 md:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-cyan-300"><Sparkles className="h-4 w-4" />base para militares</div>
              <h2 className="mt-7 max-w-4xl text-4xl font-black leading-[1.08] tracking-tight md:text-6xl">Ondas são perturbações que carregam energia. O resto é aprender a medir essa repetição.</h2>
              <p className="mt-6 max-w-3xl text-lg leading-9 text-slate-300">Uma página completa sobre natureza das ondas, classificação, amplitude, período, frequência, comprimento de onda, fase, número de onda, gráficos e mudança de meio.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[{ value: String(theorySections.length), label: "Seções" }, { value: String(formulas.length), label: "Fórmulas" }, { value: "8", label: "Visuais" }, { value: "MIL", label: "Foco" }].map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
                  <p className="text-4xl font-black text-white">{item.value}</p>
                  <p className="mt-1 text-sm font-black uppercase tracking-[0.18em] text-slate-300">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <div className="mt-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm md:hidden">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`rounded-2xl px-4 py-3 text-left font-black ${activeTab === tab.id ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700"}`}>{tab.label}</button>
          ))}
        </div>
        {activeTab === "teoria" ? (
          <div className="mt-10 space-y-8">
            {theorySections.map((section) => (
              <div key={section.title} className="space-y-8">
                <TheorySectionCard section={section} />
                {section.title === "O que é uma onda" ? <ParticleVsWaveAnimation /> : null}
                {section.title === "Período, frequência e velocidade de propagação" ? <WaveRelationSimulator /> : null}
              </div>
            ))}
          </div>
        ) : null}
        {activeTab === "exemplos" ? <div className="mt-10 space-y-8">{examples.map((example, index) => <ExampleCard key={example.title} example={example} index={index} />)}</div> : null}
        {activeTab === "resumo" ? (
          <div className="mt-10 space-y-8">
            <SummaryMapPanel />
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="bg-slate-950 px-7 py-6 text-white md:px-9"><div className="flex items-center gap-4"><Sigma className="h-7 w-7" /><h2 className="text-2xl font-black tracking-tight md:text-3xl">Fórmulas principais</h2></div></div>
              <div className="grid gap-5 px-7 py-7 md:grid-cols-2 md:px-9 md:py-9">{formulas.filter(Boolean).map((formula) => <FormulaCard key={formula.title} item={formula} />)}</div>
            </section>
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="bg-red-700 px-7 py-6 text-white md:px-9"><div className="flex items-center gap-4"><AlertTriangle className="h-7 w-7" /><h2 className="text-2xl font-black tracking-tight md:text-3xl">Armadilhas clássicas</h2></div></div>
              <div className="grid gap-4 px-7 py-7 md:grid-cols-2 md:px-9 md:py-9">{traps.map((trap) => <div key={trap} className="flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4"><AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-red-700" /><p className="text-[1.01rem] leading-7 text-slate-700">{trap}</p></div>)}</div>
            </section>
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="bg-emerald-700 px-7 py-6 text-white md:px-9"><div className="flex items-center gap-4"><ShieldCheck className="h-7 w-7" /><h2 className="text-2xl font-black tracking-tight md:text-3xl">Checklist de domínio</h2></div></div>
              <div className="grid gap-4 px-7 py-7 md:grid-cols-2 md:px-9 md:py-9">{checklist.map((item) => <div key={item} className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-700" /><p className="text-[1.01rem] leading-7 text-slate-700">{item}</p></div>)}</div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
