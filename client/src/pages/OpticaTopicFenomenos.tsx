import { useState, type ElementType } from "react";
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
type DiagramKind = "reflectionRefraction" | "totalReflection" | "prismDispersion" | "apparentDepth" | "mirage" | "parallelSlab" | "rainbowDrop";

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
    title: "O papel dos fenômenos ópticos",
    accent: "bg-purple-700",
    paragraphs: [
      "Fenômenos ópticos são efeitos observáveis ligados ao modo como a luz interage com superfícies, interfaces e meios transparentes. Esta página fica entre os fundamentos da Óptica e os sistemas de imagem: ela pega reflexão, refração e índice de refração e mostra como essas ideias aparecem em situações reais.",
      "O ponto central é perceber que a luz pode voltar ao meio de origem, atravessar uma interface, mudar velocidade, mudar direção, separar-se em cores, ficar presa por reflexão total ou até seguir uma trajetória curva quando o índice do meio varia gradualmente.",
      "Essa página não deve ser lida como uma coleção de fenômenos soltos. Reflexão, refração, dispersão, reflexão total, arco-íris e miragens são variações de uma mesma ideia: a trajetória da luz depende da geometria da interface e das propriedades ópticas dos meios.",
      "Em prova, o erro quase nunca é decorar a fórmula errada por completo. O erro costuma ser mais sutil: medir o ângulo pela superfície, confundir meio de incidência com meio de refração, tentar usar ângulo limite no sentido errado ou esquecer que uma imagem aparente não é a posição real do objeto.",
    ],
    notes: [
      {
        title: "Papel desta página",
        type: "success",
        body: "Esta página aprofunda os fenômenos geométricos da luz antes de lentes, espelhos esféricos e Óptica Física. Ela é o elo entre fundamentos e aplicações.",
      },
    ],
  },
  {
    id: 2,
    icon: Brain,
    title: "Mapa dos fenômenos e das fórmulas",
    accent: "bg-slate-950",
    paragraphs: [
      "Antes de sair aplicando equação, identifique o fenômeno. A mesma luz pode refletir, refratar, dispersar ou sofrer reflexão total, mas cada caso tem uma leitura física diferente.",
      "O mapa abaixo serve como um guia de decisão. Ele evita aquela cena deprimente em que o aluno sabe todas as fórmulas, mas escolhe a única que não pertence ao problema.",
    ],
    bullets: [
      "Reflexão simples: a luz retorna ao meio de origem; use i = r.",
      "Refração: a luz passa para outro meio; use n₁ sen i = n₂ sen r.",
      "Profundidade aparente: o olho prolonga raios refratados; para observação quase normal, use h_ap ≈ h/n.",
      "Lâmina de faces paralelas: o raio sai paralelo ao incidente, mas sofre desvio lateral.",
      "Reflexão total: use sen L = n₂/n₁, somente se a luz vai do maior índice para o menor índice.",
      "Dispersão e prismas: aplique a ideia de Snell para cada cor, pois cada frequência pode ter índice diferente.",
      "Miragens: o índice muda gradualmente no ar; o raio curva aos poucos, não por uma interface única.",
    ],
    notes: [
      {
        title: "Regra de sobrevivência",
        type: "info",
        body: "Primeiro desenhe o caminho da luz. Depois escolha a fórmula. A fórmula sem desenho é só uma aposta com letras gregas.",
      },
    ],
  },
  {
    id: 3,
    icon: Eye,
    title: "Reflexão regular e reflexão difusa",
    accent: "bg-blue-700",
    paragraphs: [
      "Reflexão é o retorno da luz ao meio de origem após atingir uma superfície. A lei da reflexão afirma que o ângulo de incidência é igual ao ângulo de reflexão, sempre medidos em relação à normal.",
      "Na reflexão regular, uma superfície muito lisa, como um espelho plano ideal, reflete raios paralelos de maneira organizada. A imagem é nítida porque a informação direcional dos raios é preservada de modo ordenado.",
      "Na reflexão difusa, uma superfície irregular espalha raios em várias direções. É por isso que conseguimos ver uma parede, uma folha de papel ou uma mesa a partir de diferentes posições. Esses objetos não têm luz própria; eles espalham a luz que recebem.",
      "Reflexão difusa não significa que a lei da reflexão deixou de valer. Cada pequeno trecho da superfície ainda obedece i = r. O que muda é que as normais microscópicas têm orientações diferentes, espalhando os raios refletidos.",
    ],
    formulas: [formulas[0]],
    bullets: [
      "Reflexão regular: superfície lisa, raios refletidos organizados e imagem nítida.",
      "Reflexão difusa: superfície irregular, raios espalhados e visão possível de vários ângulos.",
      "A lei i = r vale localmente em ambos os casos.",
      "A diferença está na organização das normais microscópicas da superfície.",
    ],
    notes: [
      {
        title: "Armadilha clássica",
        type: "warning",
        body: "Reflexão difusa não é reflexão desobediente. Ela apenas ocorre em uma superfície com muitas normais locais diferentes.",
      },
    ],
  },
  {
    id: 4,
    icon: Waves,
    title: "Refração e índice de refração",
    accent: "bg-cyan-700",
    paragraphs: [
      "Refração é a passagem da luz de um meio para outro com mudança de velocidade. Quando a incidência não é perpendicular à interface, essa mudança de velocidade geralmente vem acompanhada de mudança de direção.",
      "O índice de refração mede o quanto a luz fica mais lenta em um meio em comparação com o vácuo. Quanto maior o índice, menor a velocidade da luz naquele meio. Em linguagem de prova, dizemos que o meio de maior índice é mais refringente.",
      "A frequência da luz não muda na passagem de um meio para outro. Quem muda é a velocidade e, junto dela, o comprimento de onda. Esse detalhe é fundamental para não transformar refração em uma mudança mágica de cor.",
      "Uma forma intuitiva de entender o desvio é imaginar a frente de onda atravessando a interface. Se uma parte da frente de onda entra primeiro em uma região onde a luz fica mais lenta, essa parte atrasa em relação à outra. Essa diferença de velocidades gira a frente de onda e muda a direção do raio.",
    ],
    formulas: [formulas[1], formulas[2]],
    diagram: {
      kind: "reflectionRefraction",
      title: "reflexão e refração na interface",
      caption: "Na interface entre dois meios, parte da luz pode refletir e parte pode refratar.",
    },
    notes: [
      {
        title: "Previsão antes da conta",
        type: "success",
        body: "Entrou em meio de maior índice: aproxima da normal. Entrou em meio de menor índice: afasta da normal. Incidência normal: muda velocidade, mas não muda direção.",
      },
    ],
  },
  {
    id: 5,
    icon: Calculator,
    title: "Lei de Snell-Descartes na prática",
    accent: "bg-indigo-800",
    paragraphs: [
      "A Lei de Snell-Descartes é a principal ferramenta matemática para refração. Ela relaciona os índices dos meios com os senos dos ângulos medidos em relação à normal.",
      "Mas a fórmula sozinha não resolve o problema. Antes de substituir valores, identifique o meio de incidência, o meio de refração, a normal, o ângulo dado e o sentido esperado do desvio.",
      "Se o raio entra em meio de maior índice, deve aproximar-se da normal. Se entra em meio de menor índice, deve afastar-se da normal. Se sua conta contradiz essa previsão, desconfie da conta, não da Física. A Física tem defeitos, mas esse não costuma ser um deles.",
      "Também existe um caso especial importante: incidência normal. Se o raio chega perpendicularmente à interface, ele não sofre desvio angular. Mesmo assim, sua velocidade e seu comprimento de onda mudam ao entrar no outro meio.",
    ],
    formulas: [formulas[2]],
    bullets: [
      "Desenhe a interface e a normal.",
      "Identifique n₁ e n₂ pelo sentido do raio.",
      "Confira se o ângulo foi dado pela normal ou pela superfície.",
      "Faça a previsão qualitativa do desvio.",
      "Aplique Snell e confira se o resultado faz sentido.",
    ],
  },
  {
    id: 6,
    icon: Eye,
    title: "Profundidade aparente",
    accent: "bg-emerald-700",
    paragraphs: [
      "Quando olhamos um objeto no fundo de uma piscina, ele parece mais próximo da superfície do que realmente está. O objeto não subiu. O fundo da piscina não resolveu colaborar com a humanidade. O que mudou foi o caminho dos raios luminosos ao saírem da água para o ar.",
      "Os raios vindos do objeto refratam ao passar da água para o ar e chegam ao olho com uma direção diferente. O cérebro prolonga esses raios em linha reta, como se eles tivessem vindo de uma posição mais rasa. Essa posição é a imagem aparente.",
      "Para observação quase normal, uma aproximação útil é h_ap ≈ h/n, quando o objeto está em um líquido de índice n e é observado do ar. Essa expressão captura a ideia mais cobrada: meios mais refringentes fazem o objeto parecer mais próximo da superfície.",
      "Exemplos cotidianos aparecem em piscina aparentemente rasa, colher parecendo quebrada em um copo, peixe parecendo mais próximo da superfície e objetos submersos vistos de fora da água.",
    ],
    formulas: [formulas[4]],
    diagram: {
      kind: "apparentDepth",
      title: "profundidade aparente",
      caption: "O prolongamento dos raios refratados faz o objeto parecer mais raso.",
    },
    notes: [
      {
        title: "Armadilha clássica",
        type: "warning",
        body: "A profundidade aparente é uma imagem geométrica criada pela refração. Não confunda posição aparente com deslocamento real do objeto.",
      },
    ],
  },
  {
    id: 7,
    icon: Target,
    title: "Lâmina de faces paralelas",
    accent: "bg-slate-950",
    paragraphs: [
      "Uma lâmina de faces paralelas é um bloco transparente com duas faces planas e paralelas. Quando um raio entra obliquamente, ele refrata na primeira face, percorre a lâmina e refrata novamente ao sair.",
      "Como as faces são paralelas, o raio emergente sai paralelo ao raio incidente. Porém, ele não sai pela mesma linha: a trajetória sofre um deslocamento lateral.",
      "Esse fenômeno é uma armadilha boa de prova porque o aluno vê duas refrações e espera um grande desvio angular final. Mas, em uma lâmina de faces paralelas imersa no mesmo meio antes e depois, o efeito final não é mudar a direção do raio; é deslocar a trajetória.",
      "O desvio lateral aumenta quando a espessura da lâmina aumenta, quando o ângulo de incidência aumenta e quando a diferença entre os índices de refração aumenta. A fórmula do desvio lateral resume essa geometria.",
    ],
    formulas: [formulas[5]],
    diagram: {
      kind: "parallelSlab",
      title: "lâmina de faces paralelas",
      caption: "O raio sai paralelo ao incidente, mas lateralmente deslocado.",
    },
    notes: [
      {
        title: "Resumo mental",
        type: "success",
        body: "A lâmina não muda a direção final do raio; ela desloca a trajetória. Paralelo não significa coincidente.",
      },
    ],
  },
  {
    id: 8,
    icon: Zap,
    title: "Ângulo limite e reflexão total",
    accent: "bg-red-700",
    paragraphs: [
      "Reflexão total ocorre quando a luz tenta passar de um meio mais refringente para outro menos refringente e não consegue emergir. Em vez de haver raio refratado, toda a luz retorna ao meio original por reflexão.",
      "A progressão física é importante: para ângulos pequenos, há refração; conforme o ângulo de incidência aumenta, o raio refratado se afasta cada vez mais da normal; no ângulo limite, ele sairia rasante à superfície; para ângulos maiores, não há raio refratado.",
      "Esse fenômeno exige duas condições obrigatórias. A luz deve estar indo do meio de maior índice para o meio de menor índice, e o ângulo de incidência deve ser maior que o ângulo limite.",
      "Reflexão total aparece em fibras ópticas, prismas de binóculos, brilho de diamantes e certas miragens. Em fibras ópticas, a luz fica confinada no núcleo por sucessivas reflexões totais, carregando informação por longas distâncias.",
    ],
    formulas: [formulas[3]],
    diagram: {
      kind: "totalReflection",
      title: "reflexão total",
      caption: "Acima do ângulo limite, o raio não emerge: ele reflete totalmente.",
    },
    bullets: [
      "i < L: há raio refratado.",
      "i = L: raio refratado rasante.",
      "i > L: ocorre reflexão total.",
      "Só existe se n₁ > n₂ no sentido de propagação da luz.",
    ],
  },
  {
    id: 9,
    icon: Rainbow,
    title: "Dispersão da luz e prismas",
    accent: "bg-orange-700",
    paragraphs: [
      "Dispersão é a separação da luz em diferentes cores porque o índice de refração do meio depende do comprimento de onda. A luz branca não ganha cores dentro do prisma; ela já contém várias frequências. O prisma apenas separa essas componentes.",
      "Ao entrar no prisma, cada cor sofre refração. Ao sair, sofre nova refração. Como cada frequência tem índice ligeiramente diferente, os desvios não são iguais. O resultado é a abertura do feixe em um espectro.",
      "Em prismas comuns, o violeta costuma sofrer maior desvio que o vermelho, pois geralmente encontra maior índice de refração no material. O vermelho, de maior comprimento de onda, tende a desviar menos.",
      "O desvio total em um prisma depende do ângulo do prisma, dos índices de refração e da cor da luz. Em estudos mais avançados aparece o desvio mínimo, mas aqui o essencial é entender que dispersão é refração seletiva por comprimento de onda.",
    ],
    diagram: {
      kind: "prismDispersion",
      title: "dispersão em prisma",
      caption: "A luz branca se separa porque diferentes comprimentos de onda sofrem desvios diferentes.",
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
    id: 10,
    icon: Sun,
    title: "Arco-íris",
    accent: "bg-blue-800",
    paragraphs: [
      "O arco-íris é uma aplicação natural de refração, dispersão e reflexão interna em gotículas de água. A luz solar entra na gota, refrata, separa-se em cores, sofre reflexão interna e sai por nova refração.",
      "Cada cor emerge da gota em um ângulo ligeiramente diferente. Por isso, o observador recebe luz vermelha, laranja, amarela, verde, azul e violeta de diferentes conjuntos de gotículas em direções específicas.",
      "O arco-íris não é um objeto fixo no céu. Ele depende da posição do observador, da direção da luz solar e das gotas que enviam luz para aquele observador. Duas pessoas próximas não veem exatamente o mesmo conjunto de gotas produzindo o arco.",
      "O arco primário envolve uma reflexão interna dentro da gota. O arco secundário, quando aparece, envolve duas reflexões internas e apresenta ordem das cores invertida e menor intensidade.",
    ],
    diagram: {
      kind: "rainbowDrop",
      title: "formação do arco-íris",
      caption: "A gota combina refração, dispersão e reflexão interna.",
    },
    bullets: [
      "Entrada na gota: refração e dispersão.",
      "Interior da gota: reflexão interna.",
      "Saída da gota: nova refração.",
      "Cada cor emerge em ângulo diferente.",
      "O arco depende da posição do observador.",
    ],
  },
  {
    id: 11,
    icon: Waves,
    title: "Miragens",
    accent: "bg-cyan-700",
    paragraphs: [
      "Miragem não é alucinação nem truque psicológico. É um fenômeno óptico real causado pela variação gradual do índice de refração do ar com a temperatura.",
      "Próximo a um solo muito quente, o ar fica menos denso e possui menor índice de refração. Camadas mais altas, menos aquecidas, têm índice maior. Como o índice muda gradualmente, o raio não sofre uma quebra brusca como em uma interface plana; ele curva aos poucos.",
      "O olho recebe esses raios curvados e o cérebro os prolonga em linha reta. O resultado pode ser uma imagem aparente do céu ou de objetos distantes no chão, criando a impressão de água em estradas quentes.",
      "A ideia é parecida com profundidade aparente: o cérebro prolonga raios recebidos em linha reta, mesmo quando a trajetória real foi desviada por refração. A diferença é que, na miragem, o desvio ocorre continuamente em um meio com índice variável.",
    ],
    diagram: {
      kind: "mirage",
      title: "miragem por gradiente de índice",
      caption: "O índice varia com a temperatura do ar, curvando a trajetória da luz.",
    },
    notes: [
      {
        title: "Ideia de prova",
        type: "success",
        body: "Miragem é refração em meio não homogêneo. Não é reflexão em uma poça imaginária no asfalto.",
      },
    ],
  },
  {
    id: 12,
    icon: ShieldCheck,
    title: "Estratégia de prova",
    accent: "bg-emerald-700",
    paragraphs: [
      "Para resolver questões de fenômenos ópticos, comece pelo desenho. Marque a interface, a normal, o sentido de propagação da luz e os meios envolvidos. Depois faça uma previsão física do comportamento do raio.",
      "Se houver refração, pergunte se o raio entra em maior ou menor índice. Se houver reflexão total, confira primeiro se a luz vai do maior índice para o menor. Se houver prisma ou arco-íris, lembre que cores diferentes sofrem desvios diferentes. Se houver lâmina paralela, espere deslocamento lateral, não desvio angular final.",
      "A conta entra depois como confirmação quantitativa. Quando o resultado numérico contradiz a previsão física, quase sempre o erro está na escolha do ângulo, na troca dos meios ou no uso de uma fórmula fora do fenômeno correto.",
    ],
    bullets: [
      "Desenhe a normal sempre que houver reflexão ou refração.",
      "Confira se o ângulo foi medido pela normal ou pela superfície.",
      "Antes de calcular, preveja se o raio aproxima ou afasta da normal.",
      "Use ângulo limite apenas do maior índice para o menor índice.",
      "Em prismas e arco-íris, pense em refração + dispersão.",
      "Em miragens, pense em índice variável e trajetória curva.",
    ],
  },
];

const examples: ExampleItem[] = [
  {
    title: "Refração do ar para a água",
    level: "básico com Snell",
    statement:
      "Um raio passa do ar para a água com ângulo de incidência de 45°. Considere n_ar = 1,0 e n_água = 1,4. Determine aproximadamente sen r e diga se o raio aproxima ou afasta da normal.",
    idea:
      "A luz entra em meio de maior índice. Antes da conta, já esperamos que o raio se aproxime da normal.",
    steps: [
      "Use n₁ sen i = n₂ sen r.",
      "Substitua: 1,0 · sen45° = 1,4 · sen r.",
      "Como sen45° ≈ 0,707, temos sen r ≈ 0,707/1,4.",
      "sen r ≈ 0,505.",
      "Como sen r < sen45°, o ângulo refratado é menor que o ângulo de incidência.",
    ],
    answer:
      "sen r ≈ 0,505. O raio aproxima-se da normal.",
    test:
      "A questão queria testar a previsão física antes da conta: maior índice significa menor velocidade e aproximação da normal.",
  },
  {
    title: "Refração da água para o ar",
    level: "intermediário",
    statement:
      "Um raio passa da água para o ar com ângulo de incidência de 30°. Considere n_água = 1,33 e n_ar = 1,0. Determine sen r e interprete o desvio.",
    idea:
      "A luz sai de maior índice para menor índice, então o raio deve afastar-se da normal.",
    steps: [
      "Use n₁ sen i = n₂ sen r.",
      "Substitua: 1,33 · sen30° = 1,0 · sen r.",
      "Como sen30° = 0,5, temos sen r = 1,33 · 0,5.",
      "sen r = 0,665.",
      "Como sen r > sen30°, o ângulo refratado é maior que o incidente.",
    ],
    answer:
      "sen r = 0,665. O raio afasta-se da normal.",
    test:
      "A questão queria testar a leitura do sentido de propagação. Trocar os meios inverte a previsão do desvio.",
  },
  {
    title: "Ângulo limite água-ar",
    level: "intermediário",
    statement:
      "Determine o seno do ângulo limite para a passagem da luz da água para o ar. Use n_água = 1,33 e n_ar = 1,0.",
    idea:
      "Ângulo limite só existe quando a luz vai do maior índice para o menor índice. Aqui isso acontece: água para ar.",
    steps: [
      "Use sen L = n₂/n₁.",
      "Aqui, n₁ = 1,33 e n₂ = 1,0.",
      "sen L = 1,0/1,33.",
      "sen L ≈ 0,752.",
    ],
    answer:
      "sen L ≈ 0,752. Para ângulos maiores que L, ocorre reflexão total.",
    test:
      "A questão queria testar as duas condições da reflexão total: maior índice para menor índice e incidência acima do limite.",
  },
  {
    title: "Fibra óptica e reflexão total",
    level: "aplicação conceitual",
    statement:
      "Em uma fibra óptica, a luz se propaga no núcleo de maior índice e encontra a interface com a casca de menor índice. Explique por que a luz pode permanecer confinada no núcleo.",
    idea:
      "Se a incidência na interface núcleo-casca for maior que o ângulo limite, a luz sofre reflexão total sucessivas vezes.",
    steps: [
      "O núcleo possui índice maior que a casca.",
      "A luz tenta passar do maior índice para o menor índice.",
      "Nessa condição, existe ângulo limite.",
      "Se o ângulo de incidência for maior que o limite, não há raio refratado.",
      "A luz reflete totalmente e continua dentro do núcleo.",
    ],
    answer:
      "A fibra óptica guia a luz por reflexões totais sucessivas no interior do núcleo.",
    test:
      "A questão queria testar reflexão total como aplicação, não apenas como fórmula isolada.",
  },
  {
    title: "Profundidade aparente",
    level: "básico aplicado",
    statement:
      "Um objeto está a 2,0 m de profundidade em um líquido de índice 1,25 e é observado quase verticalmente do ar. Estime a profundidade aparente.",
    idea:
      "Para observação quase normal do ar, usamos h_ap ≈ h/n.",
    steps: [
      "Use h_ap ≈ h/n.",
      "Substitua: h_ap ≈ 2,0/1,25.",
      "h_ap ≈ 1,6 m.",
      "A imagem aparente fica mais próxima da superfície que o objeto real.",
    ],
    answer:
      "A profundidade aparente é aproximadamente 1,6 m.",
    test:
      "A questão queria testar a diferença entre posição real e imagem aparente criada pela refração.",
  },
  {
    title: "Desvio lateral em lâmina",
    level: "intermediário com geometria",
    statement:
      "Uma lâmina de espessura e = 4,0 cm produz refração com i = 45° e r = 30°. Estime o desvio lateral usando d = e sen(i-r)/cos r.",
    idea:
      "Em lâmina de faces paralelas, o raio emergente sai paralelo ao incidente, mas deslocado lateralmente.",
    steps: [
      "Use d = e sen(i-r)/cos r.",
      "i - r = 15°.",
      "d = 4,0 · sen15°/cos30°.",
      "Usando sen15° ≈ 0,259 e cos30° ≈ 0,866, temos d ≈ 4,0 · 0,259/0,866.",
      "d ≈ 1,2 cm.",
    ],
    answer:
      "O desvio lateral é aproximadamente 1,2 cm.",
    test:
      "A questão queria testar que lâmina paralela desloca o raio sem alterar sua direção final.",
  },
  {
    title: "Prisma e dispersão",
    level: "conceitual de prova",
    statement:
      "Um feixe de luz branca atravessa um prisma de vidro. Em geral, qual cor sofre maior desvio: vermelho ou violeta? Explique.",
    idea:
      "A dispersão ocorre porque o índice de refração depende do comprimento de onda. Em vidro comum, o violeta costuma ter índice maior que o vermelho.",
    steps: [
      "A luz branca contém várias frequências.",
      "Cada frequência encontra índice de refração ligeiramente diferente no vidro.",
      "Maior índice implica maior desvio na refração.",
      "Em geral, o violeta tem índice maior que o vermelho no vidro.",
    ],
    answer:
      "O violeta sofre maior desvio que o vermelho em prismas comuns.",
    test:
      "A questão queria testar que o prisma separa cores já presentes na luz branca; ele não cria frequências novas.",
  },
  {
    title: "Arco-íris",
    level: "conceitual organizado",
    statement:
      "Explique por que o arco-íris depende de refração, dispersão e reflexão interna em gotículas de água.",
    idea:
      "A gota funciona como um pequeno sistema óptico: a luz entra, separa cores, reflete internamente e sai novamente desviada.",
    steps: [
      "Ao entrar na gota, a luz sofre refração.",
      "Como o índice depende da cor, ocorre dispersão.",
      "No interior da gota, há reflexão interna.",
      "Ao sair, a luz sofre nova refração.",
      "Cada cor emerge em ângulo diferente para o observador.",
    ],
    answer:
      "O arco-íris resulta da combinação de refração, dispersão e reflexão interna nas gotículas.",
    test:
      "A questão queria testar o encadeamento físico do fenômeno, não apenas a palavra 'dispersão'.",
  },
  {
    title: "Miragem em estrada quente",
    level: "conceitual avançado",
    statement:
      "Explique por que uma estrada quente pode parecer molhada à distância.",
    idea:
      "O ar perto do solo está mais quente, menos denso e com menor índice. Como o índice varia gradualmente, os raios curvam.",
    steps: [
      "O solo quente aquece as camadas de ar próximas a ele.",
      "Essas camadas têm menor densidade e menor índice de refração.",
      "A luz vinda do céu ou de objetos distantes curva ao atravessar camadas com índices diferentes.",
      "O olho recebe o raio curvado e o prolonga em linha reta.",
      "Esse prolongamento cria uma imagem aparente no chão, parecida com reflexão em água.",
    ],
    answer:
      "A miragem é causada por refração em ar com índice variável, não por água real na estrada.",
    test:
      "A questão queria testar que miragem é fenômeno óptico real, causado por gradiente de índice.",
  },
];

const traps = [
  "Medir ângulo pela superfície em vez da normal.",
  "Achar que reflexão difusa não obedece à lei i = r.",
  "Achar que refração sempre muda a direção do raio.",
  "Esquecer que incidência normal muda velocidade, mas não muda direção.",
  "Trocar n₁ e n₂ na Lei de Snell.",
  "Usar ângulo limite quando a luz vai do menor índice para o maior índice.",
  "Achar que p' negativo ou imagem aparente significam objeto impossível ou deslocado de verdade.",
  "Pensar que a lâmina de faces paralelas muda a direção final do raio.",
  "Achar que a luz branca ganha cores no prisma, em vez de entender que ela já contém várias frequências.",
  "Confundir reflexão total com reflexão comum.",
  "Explicar miragem como ilusão psicológica, e não como refração em índice variável.",
];

const checklist = [
  "Sei desenhar a normal antes de usar qualquer fórmula?",
  "Sei diferenciar reflexão regular e difusa?",
  "Sei prever se o raio aproxima ou afasta da normal?",
  "Sei aplicar Snell identificando corretamente n₁ e n₂?",
  "Sei explicar profundidade aparente por prolongamento de raios?",
  "Sei explicar por que lâmina paralela desloca, mas não muda a direção final?",
  "Sei aplicar as duas condições da reflexão total?",
  "Sei explicar fibra óptica por reflexão total?",
  "Sei explicar dispersão sem dizer que o prisma cria cores?",
  "Sei organizar a formação do arco-íris em etapas?",
  "Sei explicar miragem por gradiente de índice?",
  "Sei escolher a fórmula a partir do fenômeno, e não por aparência algébrica?",
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
          {diagram.kind === "parallelSlab" && <ParallelSlabDiagram />}
          {diagram.kind === "rainbowDrop" && <RainbowDropDiagram />}
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


function ParallelSlabDiagram() {
  return (
    <svg viewBox="0 0 820 320" className="h-auto w-full">
      <defs>
        <marker id="arrowSlab" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
        </marker>
      </defs>
      <polygon points="300,55 560,55 500,265 240,265" fill="#dbeafe" stroke="#0f172a" strokeWidth="4" />
      <line x1="90" y1="95" x2="300" y2="145" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" markerEnd="url(#arrowSlab)" />
      <line x1="300" y1="145" x2="500" y2="205" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" markerEnd="url(#arrowSlab)" />
      <line x1="500" y1="205" x2="725" y2="255" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" markerEnd="url(#arrowSlab)" />
      <line x1="90" y1="145" x2="725" y2="295" stroke="#94a3b8" strokeWidth="3" strokeDasharray="10 10" />
      <line x1="725" y1="255" x2="725" y2="295" stroke="#dc2626" strokeWidth="3" strokeDasharray="8 8" />
      <text x="95" y="80" className="fill-blue-700 text-[15px] font-black">raio incidente</text>
      <text x="590" y="245" className="fill-blue-700 text-[15px] font-black">raio emergente paralelo</text>
      <text x="605" y="292" className="fill-red-700 text-[15px] font-black">desvio lateral</text>
      <text x="335" y="45" className="fill-slate-900 text-[17px] font-black">lâmina de faces paralelas</text>
    </svg>
  );
}

function RainbowDropDiagram() {
  return (
    <svg viewBox="0 0 820 320" className="h-auto w-full">
      <defs>
        <marker id="arrowRain" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#0f172a" />
        </marker>
      </defs>
      <circle cx="410" cy="160" r="105" fill="#dbeafe" stroke="#0f172a" strokeWidth="4" />
      <line x1="95" y1="125" x2="318" y2="145" stroke="#facc15" strokeWidth="7" strokeLinecap="round" markerEnd="url(#arrowRain)" />
      <path d="M318 145 Q405 90 500 135" fill="none" stroke="#facc15" strokeWidth="5" strokeLinecap="round" />
      <path d="M500 135 Q455 225 350 220" fill="none" stroke="#facc15" strokeWidth="5" strokeLinecap="round" />
      <line x1="350" y1="220" x2="165" y2="265" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" markerEnd="url(#arrowRain)" />
      <line x1="350" y1="220" x2="170" y2="235" stroke="#7c3aed" strokeWidth="5" strokeLinecap="round" markerEnd="url(#arrowRain)" />
      <text x="90" y="105" className="fill-slate-900 text-[16px] font-black">luz solar</text>
      <text x="548" y="135" className="fill-slate-700 text-[15px] font-black">reflexão interna</text>
      <text x="120" y="287" className="fill-red-700 text-[15px] font-black">vermelho</text>
      <text x="115" y="225" className="fill-violet-700 text-[15px] font-black">violeta</text>
      <text x="325" y="295" className="fill-slate-700 text-[15px] font-black">refração + dispersão + reflexão interna</text>
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
            {section.title}
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

function ExampleCard({ example }: { example: ExampleItem }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <div className="bg-red-700 px-6 py-5 text-white">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-100">
              Exemplo resolvido · {example.level}
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
                {section.id === 5 ? <SnellSimulator /> : null}
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "exemplos" ? (
          <div className="mt-10 space-y-8">
            {examples.map((example) => (
              <ExampleCard key={example.title} example={example} />
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
