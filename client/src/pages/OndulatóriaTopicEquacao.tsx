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
  GitBranch,
  Layers3,
  LineChart,
  MoveRight,
  Route,
  ShieldCheck,
  Sigma,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react";
import { Link } from "wouter";

import { MathFormula } from "@/components/MathFormula";

type Tab = "teoria" | "exemplos" | "resumo";
type NoteType = "info" | "warning" | "success";
type DiagramKind =
  | "functionWave"
  | "spatialTemporal"
  | "phaseSign"
  | "differential"
  | "reflection"
  | "mediumChange"
  | "readFunction"
  | "phaseShift"
  | "generalShape";

type FormulaSummary = {
  title: string;
  formula: string;
  explanation: string[];
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
    title: "Função de onda progressiva",
    formula: String.raw`y(x,t)=A\cos(kx-\omega t+\varphi_0)`,
    explanation: [
      "Essa expressão descreve o deslocamento y de cada ponto do meio, identificado pela posição x, em cada instante t. Ela não é a trajetória de uma partícula viajando pelo eixo x; é uma fotografia matemática do estado do meio inteiro.",
      "A amplitude A controla o afastamento máximo. O número de onda k controla a repetição no espaço. A frequência angular ω controla a repetição no tempo. A fase inicial φ₀ desloca a onda em relação à origem escolhida.",
      "Use essa forma quando a onda for senoidal, progressiva e unidimensional. Em prova, a primeira atitude é comparar a função dada com essa forma e extrair A, k, ω, φ₀ e o sinal entre kx e ωt.",
    ],
    warning:
      "Seno e cosseno representam o mesmo tipo de onda senoidal, mudando apenas a fase inicial. O sentido de propagação depende do sinal entre kx e ωt, não de usar seno ou cosseno.",
  },
  {
    title: "Número de onda",
    formula: String.raw`k=\frac{2\pi}{\lambda}`,
    explanation: [
      "O número de onda mede a rapidez com que a fase muda quando andamos no espaço. Se a onda completa uma repetição espacial ao avançar λ, a fase muda 2π radianos nessa distância.",
      "Por isso k é 2π dividido pelo comprimento de onda. λ pequeno significa repetição espacial rápida e k grande. λ grande significa repetição espacial lenta e k pequeno.",
      "Essa fórmula prepara diretamente a equação da onda: em expressões como y(x,t)=Acos(kx−ωt+φ₀), o termo kx é a parte espacial da fase. Ele diz como a onda muda quando mudamos a posição.",
      "Use k=2π/λ para transformar o coeficiente de x em comprimento de onda, ou para montar uma função de onda a partir de λ.",
    ],
    warning:
      "O coeficiente de x não é λ. O coeficiente de x é k. O comprimento de onda é λ=2π/k. Essa troca é um dos erros mais comuns.",
  },
  {
    title: "Frequência angular",
    formula: String.raw`\omega=2\pi f=\frac{2\pi}{T}`,
    explanation: [
      "A frequência angular mede a rapidez com que a fase muda no tempo. Uma oscilação completa corresponde a 2π radianos; se isso acontece em um período T, então ω=2π/T.",
      "Como f=1/T, também temos ω=2πf. A frequência f mede ciclos por segundo; a frequência angular ω mede radianos por segundo.",
      "Na função de onda, ω aparece multiplicando t porque controla a evolução temporal da fase. Quando um ponto fixo do meio oscila, é ω que determina a rapidez dessa oscilação.",
      "Use ω quando a função de onda fornece o coeficiente de t. A partir dele, você encontra T=2π/ω e f=ω/(2π).",
    ],
    warning:
      "Se ω=20π rad/s, a frequência não é 20π Hz. Ela é f=ω/(2π)=10 Hz. A prova adora essa armadilha barata, e ela funciona mais do que deveria.",
  },
  {
    title: "Velocidade da onda pela fase",
    formula: String.raw`v=\frac{\omega}{k}`,
    explanation: [
      "Essa fórmula aparece quando a função de onda fornece diretamente k e ω. Ela diz a velocidade com que um ponto de fase constante, como uma crista, se desloca.",
      "Como k=2π/λ e ω=2πf, a razão ω/k vira λf. Portanto, v=ω/k é a mesma ideia de v=λf escrita na linguagem da fase.",
      "A unidade confirma a interpretação: (rad/s)/(rad/m)=m/s. A razão entre repetição temporal e repetição espacial dá a velocidade de propagação do padrão ondulatório.",
      "Use v=ω/k quando a questão der uma expressão como y(x,t)=0,04cos(5πx−20πt). Nesse caso, k=5π, ω=20π e v=4 m/s.",
    ],
    warning:
      "Não inverta. k/ω tem unidade s/m, não m/s. Parece pouco, mas é o tipo de pouco que joga a alternativa correta pela janela.",
  },
  {
    title: "Relação fundamental das ondas",
    formula: String.raw`v=\lambda f=\frac{\lambda}{T}`,
    explanation: [
      "Durante um período T, a onda avança exatamente um comprimento de onda λ. Como velocidade é distância dividida por tempo, temos v=λ/T.",
      "Como f=1/T, obtemos v=λf. Essa fórmula conecta repetição espacial com repetição temporal.",
      "Use v=λf quando tiver frequência. Use v=λ/T quando tiver período. Use v=ω/k quando estiver lendo uma função de onda.",
      "Na mudança de meio, a frequência geralmente permanece determinada pela fonte. Se v muda e f permanece, λ se ajusta.",
    ],
  },
  {
    title: "Diferença de fase espacial",
    formula: String.raw`\Delta\varphi=k\Delta x=\frac{2\pi}{\lambda}\Delta x`,
    explanation: [
      "Essa relação compara o estado de oscilação de dois pontos separados por uma distância Δx no mesmo instante.",
      "Se Δx=λ, então Δφ=2π e os pontos estão em fase. Se Δx=λ/2, então Δφ=π e os pontos estão em oposição de fase.",
      "Use quando a questão perguntar se dois pontos estão em fase, em oposição ou com alguma defasagem intermediária.",
    ],
  },
  {
    title: "Equação diferencial da onda",
    formula: String.raw`\frac{\partial^2 y}{\partial t^2}=v^2\frac{\partial^2 y}{\partial x^2}`,
    explanation: [
      "Essa é a forma matemática mais geral da propagação ondulatória unidimensional em muitos modelos. Ela não descreve apenas uma onda específica; descreve a condição que uma função deve satisfazer para representar uma onda que se propaga com velocidade v.",
      "A derivada segunda no espaço mede a curvatura espacial da perturbação. A derivada segunda no tempo está ligada à aceleração temporal de um ponto do meio.",
      "A equação diz que a forma como a onda se curva no espaço está ligada à forma como cada ponto do meio acelera no tempo. Em uma corda, essa ligação vem das forças restauradoras produzidas pela curvatura.",
      "A função senoidal y=Acos(kx−ωt) satisfaz essa equação quando v=ω/k. Isso amarra função de onda, fase e velocidade em uma única estrutura.",
    ],
  },
  {
    title: "Amplitude e energia em modelos lineares",
    formula: String.raw`E\propto A^2`,
    explanation: [
      "Em muitos modelos ondulatórios lineares, a energia ou a intensidade associada à onda cresce com o quadrado da amplitude.",
      "Isso significa que, dentro do mesmo modelo físico, dobrar a amplitude pode quadruplicar a energia associada. Mas essa leitura precisa de contexto.",
      "Não é uma lei universal para qualquer onda em qualquer situação. A forma exata depende do tipo de onda e da grandeza analisada: corda, som, luz, intensidade, potência média e energia por unidade de comprimento não são sempre descritas pela mesma expressão completa.",
      "Para prova, a leitura segura é: ondas semelhantes, no mesmo modelo, com maior amplitude geralmente carregam mais energia, frequentemente com dependência quadrática.",
    ],
    warning:
      "Use E∝A² como ideia típica de modelos lineares, não como licença para sair aplicando sem verificar o contexto. A Física já é cheia de armadilhas; não precisa fabricar mais uma.",
  },,
  {
    title: "Seno e cosseno como escolhas de fase",
    formula: String.raw`A\sin(\alpha)=A\cos\left(\alpha-\frac{\pi}{2}\right)`,
    explanation: [
      "Seno e cosseno não representam tipos diferentes de onda. Eles representam a mesma oscilação escrita com referências de fase diferentes.",
      "Quando uma questão usa seno, você lê A, k e ω do mesmo jeito. A diferença é que a fase inicial equivalente muda.",
      "Essa ideia evita um erro comum: achar que trocar seno por cosseno muda velocidade, frequência ou comprimento de onda. Não muda. Muda apenas a fase escolhida como referência.",
      "Use essa equivalência quando quiser comparar duas ondas ou reescrever uma função em uma forma mais familiar.",
    ],
  },
  {
    title: "Forma geral de uma onda progressiva",
    formula: String.raw`y(x,t)=F(x-vt)\quad\text{ou}\quad y(x,t)=G(x+vt)`,
    explanation: [
      "A onda senoidal é apenas um caso particular. Uma onda progressiva pode ter uma forma qualquer que se desloca sem deformar.",
      "A expressão F(x−vt) representa uma forma que se propaga para +x. À medida que t aumenta, é preciso aumentar x para manter o mesmo argumento da função.",
      "A expressão G(x+vt) representa uma forma que se propaga para −x. À medida que t aumenta, é preciso diminuir x para manter o mesmo argumento.",
      "Essa leitura é muito forte para ITA/IME porque mostra que a ideia de propagação não depende de a onda ser senoide. O essencial é a forma viajar como um padrão.",
    ],
  }
];

const theorySections: TheorySection[] = [
  {
    icon: BookOpen,
    title: "Por que precisamos de uma equação da onda",
    accent: "bg-blue-700",
    paragraphs: [
      "Na página anterior, estudamos amplitude, comprimento de onda, período, frequência, velocidade de propagação, fase e número de onda. Agora queremos fazer algo mais forte: escrever matematicamente a onda inteira.",
      "No Movimento Harmônico Simples, acompanhamos uma partícula ou um sistema oscilante. A posição depende apenas do tempo. Em uma onda, existem muitos pontos do meio, e cada ponto pode ter um deslocamento diferente no mesmo instante.",
      "Por isso usamos y(x,t). A variável x identifica o ponto do meio. A variável t identifica o instante observado. O valor y indica o deslocamento daquele ponto em relação ao equilíbrio.",
      "A diferença essencial é: MHS é oscilação local; onda é uma oscilação local que se propaga. A função de onda permite responder onde estão as cristas, qual é o sentido de propagação, qual é a velocidade e qual é o estado de oscilação de cada ponto.",
      "Também é importante separar dois usos da expressão 'equação da onda'. Às vezes falamos da função de onda, como y(x,t)=Acos(kx−ωt+φ₀), que descreve uma onda específica. Em outro momento falamos da equação diferencial da onda, que é a condição geral que uma função deve satisfazer para representar propagação ondulatória.",
    ],
    diagram: {
      kind: "functionWave",
      title: "função de onda como descrição do meio",
      caption: "A função y(x,t) diz o deslocamento de cada ponto x em cada instante t.",
    },
    notes: [
      {
        title: "Ideia que organiza tudo",
        type: "success",
        body: "x identifica o ponto do meio. t identifica o instante. y é o deslocamento. Confundir isso com trajetória de uma partícula é o primeiro passo para fazer uma questão inteira elegantemente errada.",
      },
    ],
  },
  {
    icon: Eye,
    title: "Função de onda: o significado de y(x,t)",
    accent: "bg-slate-950",
    paragraphs: [
      "A função y(x,t) descreve o deslocamento de cada ponto do meio em cada instante. Se imaginarmos uma corda ao longo do eixo x, cada ponto da corda possui uma posição x e pode sofrer um deslocamento vertical y quando a onda passa.",
      "Se fixamos o tempo, por exemplo t=t₀, obtemos y(x,t₀). Agora o tempo está congelado e vemos a forma espacial da onda naquele instante. Esse é um gráfico y × x, uma fotografia da onda.",
      "Se fixamos a posição, por exemplo x=x₀, obtemos y(x₀,t). Agora acompanhamos um ponto específico do meio ao longo do tempo. Esse é um gráfico y × t, o filme da oscilação de um ponto.",
      "No gráfico espacial y × x, medimos comprimento de onda λ. No gráfico temporal y × t, medimos período T. Nos dois, podemos medir amplitude A. Essa distinção é tão importante que deveria vir com alarme sonoro, mas infelizmente só temos texto e bom senso.",
    ],
    diagram: {
      kind: "spatialTemporal",
      title: "duas leituras da mesma função",
      caption: "Fixar t gera gráfico espacial. Fixar x gera gráfico temporal.",
    },
  },
  {
    icon: Waves,
    title: "Forma senoidal de uma onda progressiva",
    accent: "bg-purple-700",
    paragraphs: [
      "Uma onda progressiva é uma onda que se propaga pelo meio, transportando energia de uma região para outra. Uma das formas mais importantes é a onda senoidal progressiva.",
      "A forma y(x,t)=Acos(kx−ωt+φ₀) descreve uma onda senoidal que se propaga no sentido positivo do eixo x. Também poderíamos usar seno, pois seno e cosseno diferem apenas por uma fase inicial.",
      "A expressão dentro do cosseno é a fase da onda. Ela determina se um ponto está na crista, no vale, passando pelo equilíbrio, subindo ou descendo.",
      "Cada termo carrega informação física: A mede o deslocamento máximo, k controla a repetição espacial, ω controla a repetição temporal e φ₀ ajusta a posição inicial da onda em relação à origem escolhida.",
    ],
    formulas: [formulas[0]],
  },
  {
    icon: Sparkles,
    title: "Fase inicial, seno e cosseno",
    accent: "bg-indigo-700",
    paragraphs: [
      "A fase inicial φ₀ não muda o tipo de onda. Ela apenas informa como a onda está posicionada em relação à origem escolhida para espaço e tempo.",
      "Duas ondas podem ter a mesma amplitude, o mesmo comprimento de onda, a mesma frequência e a mesma velocidade, mas aparecerem deslocadas uma em relação à outra por causa da fase inicial.",
      "Por isso, seno e cosseno não são ondas fisicamente diferentes. Eles são duas maneiras de escrever a mesma oscilação com referências de fase diferentes.",
      "Em prova, isso importa muito: se a função vier em seno, você não precisa entrar em pânico como se a trigonometria tivesse mudado de país. Leia A, k, ω e φ₀ normalmente.",
    ],
    formulas: [formulas[8]],
    diagram: {
      kind: "phaseShift",
      title: "fase inicial desloca a onda",
      caption: "Duas ondas iguais podem estar deslocadas apenas por diferença de fase.",
    },
    notes: [
      {
        title: "O que a fase inicial não faz",
        type: "info",
        body: "A fase inicial não altera amplitude, frequência, período, comprimento de onda nem velocidade. Ela altera o estado da onda no ponto e no instante escolhidos como referência.",
      },
    ],
  },
  {
    icon: Sigma,
    title: "Amplitude, número de onda e frequência angular",
    accent: "bg-cyan-700",
    paragraphs: [
      "A amplitude A é o coeficiente fora do seno ou do cosseno. Como essas funções variam entre −1 e 1, o deslocamento da onda varia entre −A e A. Portanto, A é o afastamento máximo em relação ao equilíbrio.",
      "O número de onda k é o coeficiente de x. Ele mede como a fase muda no espaço e é a ponte direta para a equação da onda. Quando aparecer kx em uma função, pense: parte espacial da fase.",
      "A frequência angular ω é o coeficiente de t. Ela mede como a fase muda no tempo. Quando aparecer ωt, pense: parte temporal da fase.",
      "Essa separação é o coração da função de onda. k organiza a repetição no espaço; ω organiza a repetição no tempo. A onda existe porque essas duas repetições estão amarradas numa fase única.",
    ],
    formulas: [formulas[1], formulas[2], formulas[7]],
    notes: [
      {
        title: "Ponte para a próxima leitura",
        type: "info",
        body: "Quando estudamos y(x,t)=Acos(kx−ωt+φ₀), o termo kx mostra como a fase varia ao andar no espaço, enquanto ωt mostra como a fase varia ao passar o tempo.",
      },
    ],
  },
  {
    icon: Compass,
    title: "Fase e sentido de propagação",
    accent: "bg-red-700",
    paragraphs: [
      "A fase da onda é a expressão dentro da função trigonométrica. Para y(x,t)=Acos(kx−ωt+φ₀), a fase é φ(x,t)=kx−ωt+φ₀.",
      "Para determinar o sentido de propagação, acompanhamos um ponto de fase constante, como uma crista. Se esse ponto se desloca para valores maiores de x quando o tempo aumenta, a onda vai para +x. Se se desloca para valores menores, vai para −x.",
      "Para kx−ωt=constante, obtemos x=(ω/k)t+constante. Quando t aumenta, x aumenta. Logo, a onda se propaga para +x.",
      "Para kx+ωt=constante, obtemos x=−(ω/k)t+constante. Quando t aumenta, x diminui. Logo, a onda se propaga para −x.",
      "A frase de memória é útil: kx−ωt vai para +x; kx+ωt vai para −x. Mas a demonstração por fase constante é o que salva quando a função aparece escrita de um jeito menos bonitinho.",
    ],
    formulas: [formulas[5]],
    diagram: {
      kind: "phaseSign",
      title: "fase constante e sentido de propagação",
      caption: "O sinal entre kx e ωt indica para onde a fase constante se desloca.",
    },
  },
  {
    icon: GitBranch,
    title: "Forma geral da onda progressiva",
    accent: "bg-purple-700",
    paragraphs: [
      "A forma senoidal é extremamente importante, mas ela não é a única forma possível de uma onda progressiva.",
      "Uma função do tipo F(x−vt) representa uma forma qualquer se deslocando para o sentido positivo de x. Pode ser um pulso, uma deformação localizada ou uma forma não senoidal.",
      "Uma função do tipo G(x+vt) representa uma forma qualquer se deslocando para o sentido negativo de x.",
      "Essa ideia mostra que a equação da onda é mais ampla do que seno e cosseno. A senoide é o caso mais organizado para cálculo, mas a propagação é uma ideia mais geral: o padrão se desloca mantendo sua forma.",
    ],
    formulas: [formulas[9]],
    diagram: {
      kind: "generalShape",
      title: "forma qualquer se propagando",
      caption: "A onda não precisa ser senoidal: qualquer forma F(x−vt) pode se deslocar para +x sem deformar.",
    },
    notes: [
      {
        title: "Ponto forte para ITA/IME",
        type: "success",
        body: "Quando você entende F(x−vt), para de tratar onda como senoide obrigatória. A senoide é uma ferramenta poderosa, mas a ideia de propagação é mais ampla.",
      },
    ],
  },
  {
    icon: Gauge,
    title: "Velocidade da onda",
    accent: "bg-emerald-700",
    paragraphs: [
      "A velocidade da onda pode ser obtida pela relação fundamental v=λf, mas quando lemos uma função de onda, a forma mais direta é v=ω/k.",
      "Essa fórmula não é uma novidade solta. Como k=2π/λ e ω=2πf, a razão ω/k vira λf. Portanto, v=ω/k é a mesma Física de v=λf escrita em linguagem de fase.",
      "A unidade confirma: ω tem unidade rad/s, k tem unidade rad/m, e a razão entre eles dá m/s. Em prova, isso também serve para detectar inversões absurdas, como k/ω.",
    ],
    formulas: [formulas[3], formulas[4]],
  },
  {
    icon: ShieldCheck,
    title: "Como ler uma função de onda em 30 segundos",
    accent: "bg-blue-700",
    paragraphs: [
      "Dada uma função de onda, você não deve ficar olhando para ela como se fosse uma entidade mística. Leia os coeficientes com método.",
      "Compare a função dada com y(x,t)=Acos(kx−ωt+φ₀) ou y(x,t)=Asen(kx−ωt+φ₀). O coeficiente fora da trigonométrica é A. O coeficiente de x é k. O coeficiente de t é ω. O termo constante é a fase inicial.",
      "Depois calcule λ=2π/k, T=2π/ω, f=ω/(2π) e v=ω/k. Por fim, veja o sinal entre kx e ωt para determinar o sentido de propagação.",
      "Esse roteiro é praticamente um detector de questão de prova militar. A banca mostra uma função trigonométrica; você desmonta a função em grandezas físicas.",
    ],
    diagram: {
      kind: "readFunction",
      title: "leitura rápida da função",
      caption: "Cada pedaço da função fornece uma grandeza física diferente.",
    },
    bullets: [
      "Coeficiente fora da função trigonométrica → amplitude A.",
      "Coeficiente de x → número de onda k.",
      "Coeficiente de t → frequência angular ω.",
      "Termo constante → fase inicial φ₀.",
      "λ=2π/k, T=2π/ω, f=ω/(2π), v=ω/k.",
      "kx−ωt → propagação para +x; kx+ωt → propagação para −x.",
    ],
  },
  {
    icon: Activity,
    title: "Equação diferencial da onda unidimensional",
    accent: "bg-slate-950",
    paragraphs: [
      "A função de onda descreve uma onda específica. A equação diferencial da onda descreve uma condição geral de propagação ondulatória.",
      "A forma ∂²y/∂t²=v²∂²y/∂x² relaciona aceleração temporal e curvatura espacial. Em uma corda, a curvatura gera força restauradora, e essa força gera aceleração dos pontos do meio.",
      "A função y=Acos(kx−ωt) satisfaz essa equação quando v=ω/k. Ao derivar duas vezes em relação a x, aparece −k²y. Ao derivar duas vezes em relação a t, aparece −ω²y. Substituindo, sobra ω²=v²k².",
      "Esse trecho é mais matemático, mas vale ouro: ele mostra que a velocidade da onda não é um enfeite. Ela está embutida na estrutura da equação diferencial.",
    ],
    formulas: [formulas[6]],
    diagram: {
      kind: "differential",
      title: "curvatura espacial e aceleração temporal",
      caption: "A equação da onda liga a forma no espaço ao movimento no tempo.",
    },
  },
  {
    icon: Eye,
    title: "Gráficos espacial e temporal a partir da função",
    accent: "bg-indigo-700",
    paragraphs: [
      "Para obter um gráfico espacial, fixe o tempo. Por exemplo, em t=0, a função y(x,t)=Acos(kx−ωt) vira y(x,0)=Acos(kx). Esse gráfico mostra a forma da onda naquele instante.",
      "No gráfico espacial, o eixo horizontal é posição. Nele medimos amplitude, comprimento de onda, cristas e vales. Não medimos período diretamente, porque não há tempo no eixo horizontal.",
      "Para obter um gráfico temporal, fixe a posição. Em x=0, a função vira y(0,t)=Acos(−ωt). Como cosseno é par, y(0,t)=Acos(ωt). Esse gráfico mostra como um ponto específico do meio oscila no tempo.",
      "No gráfico temporal, medimos amplitude, período e frequência. Não medimos comprimento de onda diretamente. Para achar λ a partir de um gráfico temporal, é preciso conhecer a velocidade ou outra informação espacial.",
    ],
    diagram: {
      kind: "spatialTemporal",
      title: "gráfico espacial e temporal",
      caption: "Fixar uma variável transforma a função de duas variáveis em uma leitura de gráfico.",
    },
  },
  {
    icon: Route,
    title: "Reflexão de ondas: prévia necessária",
    accent: "bg-orange-700",
    paragraphs: [
      "Reflexão ocorre quando uma onda encontra uma fronteira e retorna ao meio de origem. Aqui vamos tratar apenas a ideia inicial, porque a análise completa de superposição e ondas estacionárias vem depois.",
      "Em uma extremidade fixa, o ponto final da corda não pode se deslocar. O pulso refletido volta invertido. Dizemos que há inversão de fase.",
      "Em uma extremidade livre, o ponto final pode se mover. O pulso refletido volta sem inversão.",
      "Esse conteúdo é simples, mas muito cobrado: extremidade fixa inverte; extremidade livre não inverte. Parece frase de camiseta, mas ao menos funciona.",
    ],
    diagram: {
      kind: "reflection",
      title: "extremidade fixa e livre",
      caption: "A fronteira determina se o pulso refletido inverte ou não.",
    },
  },
  {
    icon: MoveRight,
    title: "Refração e mudança de meio",
    accent: "bg-cyan-700",
    paragraphs: [
      "Refração de ondas ocorre quando a onda passa de um meio para outro e sua velocidade muda. Em uma fronteira parada, a frequência geralmente permanece determinada pela fonte.",
      "A regra mental continua sendo: fonte define f, meio define v, e v=λf ajusta λ.",
      "No meio 1, temos v₁=λ₁f. No meio 2, temos v₂=λ₂f. Como f é a mesma, v₁/v₂=λ₁/λ₂.",
      "Se a velocidade diminui, o comprimento de onda diminui. Se a velocidade aumenta, o comprimento de onda aumenta. Se λ muda, k também muda, pois k=2π/λ.",
      "Se houver movimento relativo entre fonte e observador, entra Efeito Doppler. Aqui, não vamos misturar tudo na mesma panela, porque aí vira sopa conceitual com cheiro de erro.",
    ],
    diagram: {
      kind: "mediumChange",
      title: "mudança de meio na função de onda",
      caption: "Ao mudar v e λ, o número de onda k muda; a frequência angular pode permanecer igual se f não mudar.",
    },
  },
];

const examples: ExampleItem[] = [
  {
    title: "Extraindo grandezas da função de onda",
    level: "leitura direta",
    statement:
      "Uma onda em uma corda é descrita por y(x,t)=0,05cos(4πx−20πt), com x e y em metros e t em segundos. Determine A, k, ω, λ, T, f, v e o sentido de propagação.",
    idea:
      "Compare a função com y(x,t)=Acos(kx−ωt+φ₀). O número fora é A, o coeficiente de x é k e o coeficiente de t é ω.",
    steps: [
      "A=0,05 m, k=4π rad/m e ω=20π rad/s.",
      "λ=2π/k=2π/(4π)=0,50 m.",
      "T=2π/ω=2π/(20π)=0,10 s.",
      "f=1/T=10 Hz, ou f=ω/(2π)=10 Hz.",
      "v=ω/k=(20π)/(4π)=5 m/s.",
      "Como a fase tem kx−ωt, a onda se propaga para +x.",
    ],
    answer:
      "A=0,05 m, k=4π rad/m, ω=20π rad/s, λ=0,50 m, T=0,10 s, f=10 Hz, v=5 m/s e sentido +x.",
    test:
      "A questão queria testar a leitura completa da função de onda. É o exercício-padrão para saber se o aluno enxerga Física dentro da trigonometria.",
  },
  {
    title: "Função com fase inicial",
    level: "fase inicial",
    statement:
      "Uma onda é descrita por y(x,t)=0,02sen(2πx−10πt+π/3). Determine amplitude, comprimento de onda, frequência, fase inicial, velocidade e sentido de propagação.",
    idea:
      "A forma em seno é lida do mesmo modo. A fase inicial desloca a onda, mas não muda A, λ, f ou v.",
    steps: [
      "A=0,02 m, k=2π rad/m, ω=10π rad/s e φ₀=π/3.",
      "λ=2π/k=2π/(2π)=1,0 m.",
      "f=ω/(2π)=10π/(2π)=5 Hz.",
      "v=ω/k=(10π)/(2π)=5 m/s.",
      "Como a fase tem kx−ωt, o sentido é +x.",
    ],
    answer:
      "A=0,02 m, λ=1,0 m, f=5 Hz, φ₀=π/3, v=5 m/s e sentido +x.",
    test:
      "A questão queria testar que seno e cosseno são equivalentes com ajuste de fase, e que fase inicial não é enfeite.",
  },
  {
    title: "Propagação para −x com números",
    level: "sinal da fase",
    statement:
      "A onda y(x,t)=0,03cos(6πx+18πt) está no SI. Determine amplitude, comprimento de onda, frequência, velocidade e sentido de propagação.",
    idea:
      "O sinal positivo entre kx e ωt indica propagação para −x. As grandezas são extraídas normalmente pelos módulos dos coeficientes.",
    steps: [
      "A=0,03 m, k=6π rad/m e ω=18π rad/s.",
      "λ=2π/k=2π/(6π)=1/3 m.",
      "f=ω/(2π)=18π/(2π)=9 Hz.",
      "v=ω/k=(18π)/(6π)=3 m/s.",
      "Como a fase é kx+ωt, a propagação é para −x.",
    ],
    answer:
      "A=0,03 m, λ=1/3 m, f=9 Hz, v=3 m/s e sentido −x.",
    test:
      "A questão queria testar o sinal da fase com valores numéricos, não só a regra decorada no vazio.",
  },
  {
    title: "Atenção a unidades fora do SI",
    level: "unidades",
    statement:
      "Uma onda é dada por y(x,t)=6cos(20x−80t), com y em centímetros, x em metros e t em segundos. Determine amplitude em metros, k, ω, λ, f e v.",
    idea:
      "O coeficiente fora da função trigonométrica está na unidade de y. Como y está em centímetros, a amplitude precisa ser convertida para metros se quisermos tudo no SI.",
    steps: [
      "A=6 cm=0,06 m.",
      "k=20 rad/m e ω=80 rad/s.",
      "λ=2π/k=2π/20=π/10 m, aproximadamente 0,314 m.",
      "f=ω/(2π)=80/(2π)=40/π Hz, aproximadamente 12,7 Hz.",
      "v=ω/k=80/20=4 m/s.",
    ],
    answer:
      "A=0,06 m, k=20 rad/m, ω=80 rad/s, λ=π/10 m, f=40/π Hz e v=4 m/s.",
    test:
      "A questão queria testar unidade. O aluno que lê A=6 m entrega uma onda gigante e uma resposta trágica.",
  },
  {
    title: "Forma equivalente da fase",
    level: "cuidado algébrico",
    statement:
      "A função y(x,t)=Acos(ωt−kx) representa propagação para qual sentido? Explique sem decorar.",
    idea:
      "O cosseno é uma função par: cos(θ)=cos(−θ). Então cos(ωt−kx)=cos(kx−ωt).",
    steps: [
      "A fase dada é ωt−kx.",
      "Podemos escrever ωt−kx=−(kx−ωt).",
      "Como cos(−α)=cos(α), temos cos(ωt−kx)=cos(kx−ωt).",
      "A forma kx−ωt corresponde a propagação para +x.",
    ],
    answer:
      "A onda se propaga para +x.",
    test:
      "A questão queria testar se o aluno decide o sentido mecanicamente ou se sabe reescrever a fase antes de concluir.",
  },
  {
    title: "Gráfico espacial a partir da função",
    level: "gráfico y × x",
    statement:
      "A onda y(x,t)=0,04cos(5πx−20πt) está no SI. Determine a função que representa o gráfico espacial no instante t=0 e interprete amplitude e comprimento de onda.",
    idea:
      "Para gráfico espacial, fixamos o tempo. O eixo horizontal será posição x, então poderemos medir λ.",
    steps: [
      "Em t=0: y(x,0)=0,04cos(5πx−20π·0).",
      "Logo, y(x,0)=0,04cos(5πx).",
      "A=0,04 m e k=5π rad/m.",
      "λ=2π/(5π)=0,40 m.",
    ],
    answer:
      "y(x,0)=0,04cos(5πx), A=0,04 m e λ=0,40 m.",
    test:
      "A questão queria testar que o gráfico espacial nasce ao fixar t e que nele se mede comprimento de onda, não período.",
  },
  {
    title: "Gráfico temporal a partir da função",
    level: "gráfico y × t",
    statement:
      "Para a mesma onda y(x,t)=0,04cos(5πx−20πt), determine a função temporal do ponto x=0 e interprete amplitude, período e frequência.",
    idea:
      "Para gráfico temporal, fixamos a posição. O eixo horizontal será tempo, então medimos T e f.",
    steps: [
      "Em x=0: y(0,t)=0,04cos(5π·0−20πt).",
      "Logo, y(0,t)=0,04cos(−20πt).",
      "Como cos é par, y(0,t)=0,04cos(20πt).",
      "A=0,04 m, ω=20π rad/s, T=2π/(20π)=0,10 s e f=10 Hz.",
    ],
    answer:
      "y(0,t)=0,04cos(20πt), A=0,04 m, T=0,10 s e f=10 Hz.",
    test:
      "A questão queria testar que o gráfico temporal nasce ao fixar x e que nele não se mede λ diretamente.",
  },
  {
    title: "Diferença de fase entre dois pontos",
    level: "fase espacial",
    statement:
      "Uma onda tem comprimento de onda λ=0,80 m. Determine a diferença de fase entre dois pontos separados por Δx=0,20 m.",
    idea:
      "Use Δφ=(2π/λ)Δx. A separação é um quarto do comprimento de onda.",
    steps: [
      "Δφ=(2π/0,80)·0,20.",
      "A razão 0,20/0,80 é 1/4.",
      "Logo, Δφ=2π·(1/4)=π/2.",
    ],
    answer:
      "Δφ=π/2 rad. Os pontos estão separados por um quarto de ciclo.",
    test:
      "A questão queria testar fase espacial sem desenho. O desenho ajuda, mas a fórmula resolve.",
  },
  {
    title: "Verificação na equação da onda",
    level: "demonstração",
    statement:
      "Mostre que y(x,t)=Acos(kx−ωt) satisfaz ∂²y/∂t²=v²∂²y/∂x² quando v=ω/k.",
    idea:
      "Derive duas vezes em x e duas vezes em t. Depois substitua na equação diferencial.",
    steps: [
      "Derivando duas vezes em x: ∂²y/∂x²=−k²y.",
      "Derivando duas vezes em t: ∂²y/∂t²=−ω²y.",
      "Substituindo: −ω²y=v²(−k²y).",
      "Cancelando −y: ω²=v²k².",
      "Logo, v=ω/k.",
    ],
    answer:
      "A função satisfaz a equação da onda quando v=ω/k.",
    test:
      "A questão queria testar a conexão entre função senoidal, derivadas segundas e velocidade de propagação.",
  },
  {
    title: "Mudança de meio",
    level: "refração básica",
    statement:
      "Uma onda tem frequência 20 Hz e comprimento de onda 0,50 m no meio 1. Ao passar para o meio 2, sua velocidade passa a ser 6 m/s. Determine a velocidade no meio 1, o comprimento de onda no meio 2 e o que permaneceu constante.",
    idea:
      "A frequência é determinada pela fonte e permanece constante na passagem comum entre meios. Use v=λf em cada meio.",
    steps: [
      "No meio 1: v₁=λ₁f=0,50·20=10 m/s.",
      "No meio 2: v₂=6 m/s e f=20 Hz.",
      "λ₂=v₂/f=6/20=0,30 m.",
      "A frequência permaneceu constante; velocidade e comprimento de onda mudaram.",
    ],
    answer:
      "v₁=10 m/s, λ₂=0,30 m e f permaneceu constante.",
    test:
      "A questão queria testar a regra: fonte define f, meio define v e λ se ajusta.",
  },
  {
    title: "Reflexão em extremidade fixa e livre",
    level: "conceitual",
    statement:
      "Um pulso se propaga em uma corda e atinge uma extremidade. Em um caso, a extremidade está fixa; em outro, está livre. Em qual caso o pulso volta invertido?",
    idea:
      "Extremidade fixa impõe deslocamento nulo e gera inversão. Extremidade livre pode se mover e não inverte o pulso.",
    steps: [
      "Na extremidade fixa, o ponto final não pode se deslocar.",
      "O pulso refletido volta invertido: há inversão de fase.",
      "Na extremidade livre, o ponto final pode se mover.",
      "O pulso refletido volta sem inversão.",
    ],
    answer:
      "Extremidade fixa: inverte. Extremidade livre: não inverte.",
    test:
      "A questão queria testar reflexão básica de pulsos, conteúdo que prepara ondas estacionárias.",
  },
  {
    title: "Questão estilo prova militar: função e mudança de meio",
    level: "militar forte",
    statement:
      "Uma onda no meio 1 é descrita por y(x,t)=0,03cos(4πx−24πt), no SI. Ao passar para o meio 2, sua velocidade cai pela metade, sem mudar a frequência. Determine A, λ₁, f, v₁, v₂, λ₂ e uma nova forma possível da função no meio 2 mantendo propagação para +x.",
    idea:
      "Extraia as grandezas no meio 1. Na mudança de meio, f e ω permanecem; v e λ mudam. Se λ muda, k também muda.",
    steps: [
      "A=0,03 m, k₁=4π rad/m e ω=24π rad/s.",
      "λ₁=2π/(4π)=0,50 m.",
      "f=ω/(2π)=24π/(2π)=12 Hz.",
      "v₁=λ₁f=0,50·12=6 m/s.",
      "Como a velocidade cai pela metade, v₂=3 m/s.",
      "λ₂=v₂/f=3/12=0,25 m.",
      "k₂=2π/λ₂=2π/0,25=8π rad/m.",
      "Como ω permanece 24π, uma função possível é y₂(x,t)=0,03cos(8πx−24πt).",
    ],
    answer:
      "A=0,03 m, λ₁=0,50 m, f=12 Hz, v₁=6 m/s, v₂=3 m/s, λ₂=0,25 m e y₂(x,t)=0,03cos(8πx−24πt).",
    test:
      "A questão mistura leitura de função de onda, mudança de meio e interpretação de k. É exatamente o tipo de coisa que separa entendimento de decoreba com sorte.",
  },
];

const traps = [
  "Achar que y(x,t) é a trajetória de uma partícula viajando pelo eixo x.",
  "Esquecer que x e t são variáveis independentes.",
  "Confundir gráfico espacial y × x com gráfico temporal y × t.",
  "Medir λ em gráfico temporal.",
  "Medir T em gráfico espacial.",
  "Confundir k com ω.",
  "Confundir frequência f com frequência angular ω.",
  "Esquecer que k=2π/λ.",
  "Esquecer que ω=2πf.",
  "Usar v=λf com unidades misturadas.",
  "Trocar o sentido de propagação por ler o sinal sem pensar.",
  "Não reescrever fases equivalentes antes de decidir o sentido.",
  "Achar que seno e cosseno são ondas fisicamente diferentes.",
  "Achar que toda onda progressiva precisa ser senoidal.",
  "Ignorar a fase inicial φ₀.",
  "Achar que mudança de meio sempre muda a frequência.",
  "Esquecer que extremidade fixa inverte o pulso.",
  "Esquecer que extremidade livre não inverte o pulso.",
  "Tratar E∝A² como lei universal fora de modelos lineares.",
];

const checklist = [
  "Sei explicar o que significa y(x,t)?",
  "Sei diferenciar função de onda e equação diferencial da onda?",
  "Sei identificar A, k, ω e φ₀ em uma função?",
  "Sei calcular λ=2π/k?",
  "Sei calcular T=2π/ω e f=ω/(2π)?",
  "Sei calcular v=ω/k?",
  "Sei determinar sentido de propagação por fase constante?",
  "Sei reconhecer que kx−ωt vai para +x e kx+ωt vai para −x?",
  "Sei lidar com formas equivalentes como cos(ωt−kx)?",
  "Sei explicar por que seno e cosseno diferem apenas por fase?",
  "Sei interpretar F(x−vt) e G(x+vt)?",
  "Sei fixar t para obter gráfico espacial?",
  "Sei fixar x para obter gráfico temporal?",
  "Sei calcular diferença de fase espacial?",
  "Sei explicar a equação diferencial da onda?",
  "Sei verificar y=Acos(kx−ωt) na equação da onda?",
  "Sei explicar reflexão em extremidade fixa e livre?",
  "Sei resolver mudança de meio mantendo f constante?",
  "Sei ajustar k quando λ muda?",
  "Sei cuidar de unidades fora do SI?",
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
        <div className="space-y-4">
          {item.explanation.map((line) => (
            <p key={line} className="text-justify text-[1.02rem] leading-8 text-slate-700">
              {line}
            </p>
          ))}
        </div>
        {item.warning ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-900">
            {item.warning}
          </div>
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
      <div className="p-5 md:p-7">
        <div className="mx-auto w-full max-w-5xl rounded-2xl bg-white p-5">
          {diagram.kind === "functionWave" && <FunctionWaveDiagram />}
          {diagram.kind === "spatialTemporal" && <SpatialTemporalDiagram />}
          {diagram.kind === "phaseSign" && <PhaseSignDiagram />}
          {diagram.kind === "differential" && <DifferentialDiagram />}
          {diagram.kind === "reflection" && <ReflectionDiagram />}
          {diagram.kind === "mediumChange" && <MediumChangeDiagram />}
          {diagram.kind === "readFunction" && <ReadFunctionDiagram />}
          {diagram.kind === "phaseShift" && <PhaseShiftDiagram />}
          {diagram.kind === "generalShape" && <GeneralShapeDiagram />}
        </div>
      </div>
    </div>
  );
}

function FunctionWaveDiagram() {
  return (
    <svg viewBox="0 0 900 360" className="h-auto w-full">
      <path d="M80 190 C140 95, 205 95, 265 190 C325 285, 390 285, 450 190 C510 95, 575 95, 635 190 C695 285, 760 285, 820 190" fill="none" stroke="#0f172a" strokeWidth="7" strokeLinecap="round" />
      <line x1="80" y1="190" x2="830" y2="190" stroke="#cbd5e1" strokeWidth="3" />
      <line x1="200" y1="190" x2="200" y2="98" stroke="#dc2626" strokeWidth="5" />
      <text x="215" y="145" className="fill-red-700 text-[18px] font-black">A</text>
      <line x1="200" y1="315" x2="450" y2="315" stroke="#2563eb" strokeWidth="5" />
      <text x="313" y="345" className="fill-blue-700 text-[18px] font-black">λ</text>
      <circle cx="575" cy="96" r="10" fill="#16a34a" />
      <text x="600" y="105" className="fill-emerald-700 text-[18px] font-black">ponto x no instante t</text>
      <text x="230" y="45" className="fill-slate-950 text-[24px] font-black">y(x,t): deslocamento de cada ponto do meio</text>
    </svg>
  );
}

function SpatialTemporalDiagram() {
  const wavePath = (x0: number, y0: number, color: string) => {
    const points = Array.from({ length: 120 }, (_, i) => {
      const x = x0 + i * 2.3;
      const y = y0 - Math.sin(i / 11) * 32;
      return `${i === 0 ? "M" : "L"}${x} ${y}`;
    }).join(" ");
    return <path d={points} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />;
  };

  return (
    <svg viewBox="0 0 900 370" className="h-auto w-full">
      <text x="110" y="38" className="fill-slate-950 text-[22px] font-black">fixe t → gráfico espacial</text>
      <line x1="85" y1="150" x2="395" y2="150" stroke="#cbd5e1" strokeWidth="3" />
      {wavePath(85, 150, "#2563eb")}
      <line x1="120" y1="235" x2="270" y2="235" stroke="#dc2626" strokeWidth="5" />
      <text x="180" y="265" className="fill-red-700 text-[18px] font-black">λ</text>
      <text x="135" y="315" className="fill-slate-700 text-[16px] font-bold">eixo horizontal: posição x</text>

      <text x="535" y="38" className="fill-slate-950 text-[22px] font-black">fixe x → gráfico temporal</text>
      <line x1="510" y1="150" x2="820" y2="150" stroke="#cbd5e1" strokeWidth="3" />
      {wavePath(510, 150, "#16a34a")}
      <line x1="545" y1="235" x2="695" y2="235" stroke="#dc2626" strokeWidth="5" />
      <text x="606" y="265" className="fill-red-700 text-[18px] font-black">T</text>
      <text x="560" y="315" className="fill-slate-700 text-[16px] font-bold">eixo horizontal: tempo t</text>
    </svg>
  );
}

function PhaseSignDiagram() {
  return (
    <svg viewBox="0 0 900 360" className="h-auto w-full">
      <defs>
        <marker id="rightArrowEq" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
        </marker>
        <marker id="leftArrowEq" markerWidth="12" markerHeight="12" refX="1" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M9,0 L9,6 L0,3 z" fill="#dc2626" />
        </marker>
      </defs>
      <rect x="70" y="65" width="330" height="210" rx="24" fill="#eff6ff" stroke="#2563eb" strokeWidth="4" />
      <text x="110" y="115" className="fill-blue-700 text-[24px] font-black">kx − ωt</text>
      <line x1="125" y1="170" x2="320" y2="170" stroke="#2563eb" strokeWidth="7" markerEnd="url(#rightArrowEq)" />
      <text x="150" y="220" className="fill-slate-950 text-[18px] font-black">propaga para +x</text>

      <rect x="500" y="65" width="330" height="210" rx="24" fill="#fef2f2" stroke="#dc2626" strokeWidth="4" />
      <text x="545" y="115" className="fill-red-700 text-[24px] font-black">kx + ωt</text>
      <line x1="755" y1="170" x2="560" y2="170" stroke="#dc2626" strokeWidth="7" markerEnd="url(#leftArrowEq)" />
      <text x="580" y="220" className="fill-slate-950 text-[18px] font-black">propaga para −x</text>
      <text x="215" y="325" className="fill-slate-700 text-[17px] font-bold">a regra nasce da fase constante, não de superstição algébrica</text>
    </svg>
  );
}

function PhaseShiftDiagram() {
  return (
    <svg viewBox="0 0 900 360" className="h-auto w-full">
      <line x1="85" y1="180" x2="825" y2="180" stroke="#cbd5e1" strokeWidth="3" />
      <path d="M90 180 C145 85, 205 85, 260 180 C315 275, 375 275, 430 180 C485 85, 545 85, 600 180 C655 275, 715 275, 770 180" fill="none" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" />
      <path d="M150 180 C205 85, 265 85, 320 180 C375 275, 435 275, 490 180 C545 85, 605 85, 660 180 C715 275, 775 275, 830 180" fill="none" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" strokeDasharray="14 12" />
      <text x="110" y="55" className="fill-blue-700 text-[20px] font-black">φ₀ = 0</text>
      <text x="640" y="55" className="fill-red-700 text-[20px] font-black">φ₀ ≠ 0</text>
      <line x1="260" y1="310" x2="320" y2="310" stroke="#0f172a" strokeWidth="5" />
      <text x="220" y="340" className="fill-slate-950 text-[17px] font-black">mesma onda, fase deslocada</text>
      <text x="235" y="25" className="fill-slate-950 text-[24px] font-black">fase inicial muda a posição da onda, não sua natureza</text>
    </svg>
  );
}

function GeneralShapeDiagram() {
  return (
    <svg viewBox="0 0 900 360" className="h-auto w-full">
      <defs>
        <marker id="generalArrow" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
        </marker>
      </defs>
      <line x1="70" y1="230" x2="830" y2="230" stroke="#cbd5e1" strokeWidth="4" />
      <path d="M90 230 C150 230, 160 230, 190 190 C220 145, 255 150, 275 210 C295 270, 330 275, 360 215 C390 155, 435 165, 455 225 C480 230, 540 230, 815 230" fill="none" stroke="#0f172a" strokeWidth="7" strokeLinecap="round" />
      <path d="M195 230 C255 230, 265 230, 295 190 C325 145, 360 150, 380 210 C400 270, 435 275, 465 215 C495 155, 540 165, 560 225 C585 230, 645 230, 815 230" fill="none" stroke="#16a34a" strokeWidth="7" strokeLinecap="round" opacity="0.55" />
      <line x1="565" y1="95" x2="720" y2="95" stroke="#2563eb" strokeWidth="6" markerEnd="url(#generalArrow)" />
      <text x="580" y="75" className="fill-blue-700 text-[18px] font-black">F(x−vt): anda para +x</text>
      <text x="120" y="55" className="fill-slate-950 text-[24px] font-black">a forma pode ser qualquer, não apenas senoide</text>
      <text x="190" y="315" className="fill-slate-700 text-[17px] font-black">o padrão inteiro se desloca mantendo a forma</text>
    </svg>
  );
}

function DifferentialDiagram() {
  return (
    <svg viewBox="0 0 900 360" className="h-auto w-full">
      <path d="M100 185 C160 85, 230 85, 290 185 C350 285, 420 285, 480 185 C540 85, 610 85, 670 185 C725 275, 785 275, 835 205" fill="none" stroke="#0f172a" strokeWidth="7" strokeLinecap="round" />
      <path d="M245 135 C280 155, 315 185, 340 225" fill="none" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" />
      <text x="175" y="95" className="fill-red-700 text-[18px] font-black">curvatura espacial</text>
      <line x1="570" y1="185" x2="570" y2="100" stroke="#2563eb" strokeWidth="6" />
      <line x1="570" y1="185" x2="570" y2="270" stroke="#2563eb" strokeWidth="6" />
      <text x="590" y="195" className="fill-blue-700 text-[18px] font-black">aceleração temporal</text>
      <text x="210" y="325" className="fill-slate-950 text-[22px] font-black">∂²y/∂t² = v² ∂²y/∂x²</text>
    </svg>
  );
}

function ReflectionDiagram() {
  return (
    <svg viewBox="0 0 900 360" className="h-auto w-full">
      <defs>
        <marker id="refArrow" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
        </marker>
      </defs>
      <text x="105" y="45" className="fill-slate-950 text-[22px] font-black">extremidade fixa</text>
      <line x1="90" y1="160" x2="390" y2="160" stroke="#cbd5e1" strokeWidth="4" />
      <line x1="390" y1="70" x2="390" y2="250" stroke="#0f172a" strokeWidth="8" />
      <path d="M115 160 C150 95, 190 95, 225 160" fill="none" stroke="#2563eb" strokeWidth="6" />
      <path d="M255 160 C290 225, 330 225, 365 160" fill="none" stroke="#dc2626" strokeWidth="6" />
      <text x="135" y="285" className="fill-red-700 text-[17px] font-black">volta invertido</text>

      <text x="555" y="45" className="fill-slate-950 text-[22px] font-black">extremidade livre</text>
      <line x1="500" y1="160" x2="800" y2="160" stroke="#cbd5e1" strokeWidth="4" />
      <circle cx="800" cy="160" r="18" fill="none" stroke="#0f172a" strokeWidth="6" />
      <path d="M520 160 C555 95, 595 95, 630 160" fill="none" stroke="#2563eb" strokeWidth="6" />
      <path d="M655 160 C690 95, 730 95, 765 160" fill="none" stroke="#16a34a" strokeWidth="6" />
      <text x="565" y="285" className="fill-emerald-700 text-[17px] font-black">volta sem inversão</text>
    </svg>
  );
}

function MediumChangeDiagram() {
  return (
    <svg viewBox="0 0 900 360" className="h-auto w-full">
      <rect x="70" y="70" width="350" height="215" rx="24" fill="#eff6ff" stroke="#2563eb" strokeWidth="4" />
      <rect x="480" y="70" width="350" height="215" rx="24" fill="#ecfdf5" stroke="#16a34a" strokeWidth="4" />
      <text x="190" y="110" className="fill-blue-700 text-[22px] font-black">meio 1</text>
      <text x="600" y="110" className="fill-emerald-700 text-[22px] font-black">meio 2</text>
      <path d="M100 180 C140 125, 180 125, 220 180 C260 235, 300 235, 340 180" fill="none" stroke="#2563eb" strokeWidth="6" />
      <path d="M505 180 C535 145, 565 145, 595 180 C625 215, 655 215, 685 180 C715 145, 745 145, 775 180" fill="none" stroke="#16a34a" strokeWidth="6" />
      <text x="130" y="255" className="fill-slate-700 text-[17px] font-black">λ₁ maior → k₁ menor</text>
      <text x="530" y="255" className="fill-slate-700 text-[17px] font-black">λ₂ menor → k₂ maior</text>
      <text x="270" y="330" className="fill-red-700 text-[17px] font-black">f e ω permanecem se a fonte não muda</text>
    </svg>
  );
}

function ReadFunctionDiagram() {
  const rows = [
    ["0,04", "amplitude A"],
    ["5πx", "número de onda k"],
    ["20πt", "frequência angular ω"],
    ["sinal −", "propagação para +x"],
  ];
  return (
    <svg viewBox="0 0 900 380" className="h-auto w-full">
      <text x="85" y="60" className="fill-slate-950 text-[26px] font-black">y(x,t)=0,04 cos(5πx − 20πt)</text>
      {rows.map((row, i) => (
        <g key={row[0]} transform={`translate(${95 + (i % 2) * 385},${110 + Math.floor(i / 2) * 105})`}>
          <rect width="330" height="75" rx="20" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" />
          <text x="24" y="32" className="fill-blue-700 text-[20px] font-black">{row[0]}</text>
          <text x="24" y="58" className="fill-slate-700 text-[16px] font-bold">{row[1]}</text>
        </g>
      ))}
      <text x="205" y="350" className="fill-slate-950 text-[20px] font-black">depois: λ=2π/k, T=2π/ω, f=ω/2π e v=ω/k</text>
    </svg>
  );
}

function WaveFunctionSimulator() {
  const [k, setK] = useState(5);
  const [omega, setOmega] = useState(20);
  const [amplitude, setAmplitude] = useState(4);

  const lambda = useMemo(() => (2 * Math.PI) / k, [k]);
  const period = useMemo(() => (2 * Math.PI) / omega, [omega]);
  const frequency = useMemo(() => omega / (2 * Math.PI), [omega]);
  const velocity = useMemo(() => omega / k, [omega, k]);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="bg-slate-950 px-7 py-6 text-white md:px-9">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Gauge className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">Simulador rápido: lendo k e ω</h2>
            <p className="mt-1 text-sm font-semibold text-slate-300">Ajuste A, k e ω para ver como a função entrega λ, T, f e v.</p>
          </div>
        </div>
      </div>
      <div className="grid gap-7 px-7 py-7 md:px-9 md:py-9 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          {[
            ["Amplitude A", amplitude, setAmplitude, 1, 10, 0.5, "cm"],
            ["Número de onda k", k, setK, 1, 20, 0.5, "rad/m"],
            ["Frequência angular ω", omega, setOmega, 2, 60, 1, "rad/s"],
          ].map(([label, value, setter, min, max, step, unit]) => (
            <label key={String(label)} className="block rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">{String(label)}</span>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">{decimalComma(Number(value), 2)} {String(unit)}</span>
              </div>
              <input type="range" min={Number(min)} max={Number(max)} step={Number(step)} value={Number(value)} onChange={(e) => (setter as (value: number) => void)(Number(e.target.value))} className="w-full accent-blue-700" />
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["λ", `${decimalComma(lambda, 3)} m`],
            ["T", `${decimalComma(period, 3)} s`],
            ["f", `${decimalComma(frequency, 2)} Hz`],
            ["v", `${decimalComma(velocity, 2)} m/s`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
            </div>
          ))}
          <div className="sm:col-span-2 rounded-3xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-justify text-[1.02rem] leading-8 text-slate-700">
              Em uma função de onda, k controla a escala espacial e ω controla a escala temporal. A velocidade aparece como a razão entre eles: v = ω/k.
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
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">{section.title}</h2>
        </div>
      </div>
      <div className="space-y-6 px-7 py-7 md:px-9 md:py-9">
        {section.paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-justify text-[1.06rem] leading-9 text-slate-700">{paragraph}</p>
        ))}
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
                  <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {section.notes ? (
          <div className="space-y-4">
            {section.notes.map((note) => <NoteCard key={note.title} title={note.title} type={note.type} body={note.body} />)}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ExampleCard({ example, index, open, onToggle }: { example: ExampleItem; index: number; open: boolean; onToggle: () => void }) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-5 px-6 py-6 text-left md:px-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Exemplo {index + 1} · {example.level}</p>
          <h3 className="mt-2 text-xl font-black text-slate-950 md:text-2xl">{example.title}</h3>
          <p className="mt-3 text-[1.02rem] leading-8 text-slate-700">{example.statement}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
          <span className={`text-xl font-black transition ${open ? "rotate-45" : ""}`}>+</span>
        </div>
      </button>
      {open ? (
        <div className="space-y-5 border-t border-slate-200 px-6 py-6 md:px-8 md:py-8">
          <NoteCard title="Ideia antes da conta" type="info" body={example.idea} />
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
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
      ) : null}
    </article>
  );
}

function SummaryMapPanel() {
  const items = [
    ["Função de onda", "y(x,t) descreve o deslocamento de cada ponto x no instante t."],
    ["Dois sentidos de equação", "Função de onda descreve uma onda específica; equação diferencial descreve a condição geral de propagação."],
    ["Número de onda", "k=2π/λ controla a variação espacial da fase."],
    ["Fase inicial", "φ₀ desloca a onda, mas não altera A, λ, f ou v."],
    ["Forma geral", "F(x−vt) vai para +x; G(x+vt) vai para −x."],
    ["Frequência angular", "ω=2πf=2π/T controla a variação temporal da fase."],
    ["Velocidade", "v=ω/k=λf conecta fase, espaço e tempo."],
    ["Sentido", "kx−ωt vai para +x; kx+ωt vai para −x, pela fase constante."],
    ["Gráficos", "Fixe t para y×x; fixe x para y×t."],
    ["Mudança de meio", "f e ω permanecem se a fonte não muda; v, λ e k podem mudar."],
  ];

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="bg-blue-700 px-7 py-6 text-white md:px-9">
        <div className="flex items-center gap-4">
          <Atom className="h-7 w-7" />
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">Resumo que realmente importa</h2>
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

function SurvivalPanel() {
  const rules = [
    ["coeficiente fora", "amplitude A"],
    ["coeficiente de x", "número de onda k"],
    ["coeficiente de t", "frequência angular ω"],
    ["termo constante", "fase inicial φ₀"],
    ["kx − ωt", "propagação para +x"],
    ["kx + ωt", "propagação para −x"],
    ["λ = 2π/k", "repetição espacial"],
    ["T = 2π/ω", "repetição temporal"],
    ["f = ω/(2π)", "ciclos por segundo"],
    ["v = ω/k", "velocidade da onda"],
    ["mudou de meio", "f fica; v, λ e k mudam"],
    ["extremidade fixa", "pulso reflete invertido"],
    ["extremidade livre", "pulso reflete sem inversão"],
  ];

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="bg-slate-950 px-7 py-6 text-white md:px-9">
        <div className="flex items-center gap-4">
          <ShieldCheck className="h-7 w-7" />
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">Quadro de sobrevivência em prova</h2>
        </div>
      </div>
      <div className="grid gap-4 px-7 py-7 md:grid-cols-2 lg:grid-cols-3 md:px-9 md:py-9">
        {rules.map(([trigger, meaning]) => (
          <div key={trigger} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-700">{trigger}</p>
            <p className="mt-2 text-lg font-black leading-7 text-slate-950">{meaning}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function OndulatoriaTopicEquacao() {
  const [activeTab, setActiveTab] = useState<Tab>("teoria");
  const [openExample, setOpenExample] = useState(0);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-5">
            <Link href="/ondulatoria" className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition-colors hover:text-blue-700">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">OSCILAÇÕES E ONDAS</p>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">Equação da Onda</h1>
            </div>
          </div>
          <nav className="hidden items-center gap-3 md:flex">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`rounded-full px-7 py-3 text-lg font-black transition ${activeTab === tab.id ? "bg-slate-950 text-white shadow-[0_10px_30px_rgba(15,23,42,0.22)]" : "text-slate-600 hover:text-slate-950"}`}>
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
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
                <Sparkles className="h-4 w-4" />
                função de onda · foco militares
              </div>
              <h2 className="mt-7 max-w-4xl text-4xl font-black leading-[1.08] tracking-tight md:text-6xl">
                A onda inteira escrita numa função: espaço, tempo, fase e propagação.
              </h2>
              <p className="mt-6 max-w-3xl text-lg leading-9 text-slate-300">
                Uma página completa para ler y(x,t), extrair grandezas, determinar sentido de propagação, entender v=ω/k e conectar a função senoidal à equação diferencial da onda.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { value: String(theorySections.length), label: "Seções" },
                { value: String(formulas.length), label: "Fórmulas" },
                { value: String(examples.length), label: "Exemplos" },
                { value: "MIL", label: "Foco" },
              ].map((item) => (
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
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`rounded-2xl px-4 py-3 text-left font-black ${activeTab === tab.id ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "teoria" ? (
          <div className="mt-10 space-y-8">
            {theorySections.map((section) => (
              <div key={section.title} className="space-y-8">
                <TheorySectionCard section={section} />
                {section.title === "Velocidade da onda" ? <WaveFunctionSimulator /> : null}
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "exemplos" ? (
          <div className="mt-10 space-y-5">
            {examples.map((example, index) => (
              <ExampleCard key={example.title} example={example} index={index} open={openExample === index} onToggle={() => setOpenExample(openExample === index ? -1 : index)} />
            ))}
          </div>
        ) : null}

        {activeTab === "resumo" ? (
          <div className="mt-10 space-y-8">
            <SummaryMapPanel />
            <SurvivalPanel />

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="bg-slate-950 px-7 py-6 text-white md:px-9">
                <div className="flex items-center gap-4">
                  <Sigma className="h-7 w-7" />
                  <h2 className="text-2xl font-black tracking-tight md:text-3xl">Fórmulas essenciais</h2>
                </div>
              </div>
              <div className="grid gap-5 px-7 py-7 md:grid-cols-2 md:px-9 md:py-9">
                {formulas.filter(Boolean).map((formula) => <FormulaCard key={formula.title} item={formula} />)}
              </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="bg-red-700 px-7 py-6 text-white md:px-9">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="h-7 w-7" />
                  <h2 className="text-2xl font-black tracking-tight md:text-3xl">Armadilhas clássicas</h2>
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
                  <CheckCircle2 className="h-7 w-7" />
                  <h2 className="text-2xl font-black tracking-tight md:text-3xl">Checklist de domínio</h2>
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

            <section className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] md:p-9">
              <div className="flex items-center gap-4">
                <Zap className="h-7 w-7 text-cyan-300" />
                <h2 className="text-2xl font-black">Ideia final</h2>
              </div>
              <p className="mt-5 text-justify text-lg leading-9 text-slate-200">
                A função de onda não é uma expressão trigonométrica aleatória. Ela é um pacote completo de informação física: amplitude, repetição espacial, repetição temporal, fase, velocidade e sentido de propagação. Quem sabe ler cada termo entende a onda. Quem só decora fica refém do primeiro sinal negativo que aparecer.
              </p>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
