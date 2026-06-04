import { useMemo, useState, type ElementType, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Brain,
  Calculator,
  ChevronDown,
  ChevronUp,
  Compass,
  Eye,
  Glasses,
  Layers,
  Lightbulb,
  Microscope,
  Orbit,
  Rainbow,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  Telescope,
  Waves,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { MathFormula } from "@/components/MathFormula";

type Tab = "teoria" | "exemplos" | "resumo";
type ContentGroup = "theory" | "examples" | "summary";

type ContentNode =
  | { type: "paragraph"; text: string }
  | { type: "subheading"; text: string }
  | { type: "formula"; formula: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

type ContentSection = {
  title: string;
  rawTitle: string;
  group: ContentGroup;
  nodes: ContentNode[];
};

type FormulaSummary = {
  title: string;
  formula: string;
  description: string;
};

const contentSections: ContentSection[] = [
  {
    "title": "Contexto físico e histórico",
    "rawTitle": "1. Contexto físico e histórico",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A Óptica é o ramo da Física que estuda a luz e os fenômenos associados à sua propagação, reflexão, refração, formação de imagens, dispersão, interação com instrumentos e percepção visual. Em termos mais diretos: a Óptica tenta responder como enxergamos, como a luz viaja, como espelhos e lentes formam imagens, por que um lápis parece quebrado dentro da água, como um telescópio revela astros distantes, como um microscópio amplia estruturas pequenas e como um simples par de óculos corrige defeitos da visão."
      },
      {
        "type": "paragraph",
        "text": "Poucos temas da Física são tão ligados à experiência cotidiana quanto a Óptica. Antes mesmo de qualquer fórmula, a luz aparece como condição básica da observação. Sem luz, não vemos diretamente os objetos. Vemos porque a luz chega aos nossos olhos, seja emitida por uma fonte luminosa, seja refletida por uma superfície. Por isso, a Óptica nasceu naturalmente da tentativa humana de entender a visão, as sombras, os reflexos, os instrumentos de aumento e os fenômenos atmosféricos."
      },
      {
        "type": "paragraph",
        "text": "A importância da Óptica aparece em várias áreas:"
      },
      {
        "type": "list",
        "items": [
          "na visão humana, pois o olho funciona como um sistema óptico;",
          "nos óculos e lentes de contato, que corrigem problemas visuais;",
          "na fotografia e nas câmeras, que formam imagens por lentes;",
          "na astronomia, com lunetas, telescópios e espelhos gigantes;",
          "na microscopia, que permite ver estruturas invisíveis a olho nu;",
          "na medicina, com endoscópios, lasers, exames por imagem e fibras ópticas;",
          "nas telecomunicações, com fibras ópticas transportando informação por luz;",
          "na engenharia, em sensores, lasers, instrumentos de medição e sistemas de segurança;",
          "nos vestibulares, porque Óptica mistura Física, geometria, trigonometria e interpretação."
        ]
      },
      {
        "type": "paragraph",
        "text": "Historicamente, a natureza da luz foi discutida por muito tempo. Uma das primeiras grandes ideias era imaginar a luz como algo emitido pelos olhos ou pelos objetos. Com o tempo, essa visão foi sendo substituída pela ideia de que a luz se propaga a partir de fontes luminosas e chega aos olhos."
      },
      {
        "type": "paragraph",
        "text": "Na Física clássica, duas interpretações ganharam destaque."
      },
      {
        "type": "paragraph",
        "text": "A primeira é o modelo corpuscular, associado fortemente a Newton. Nesse modelo, a luz seria formada por pequenas partículas emitidas pelas fontes luminosas. Essa ideia explicava bem alguns fenômenos, como a propagação retilínea e a reflexão."
      },
      {
        "type": "paragraph",
        "text": "A segunda é o modelo ondulatório, defendido por Huygens e fortalecido depois por Young e Fresnel. Nesse modelo, a luz seria uma onda. Essa visão explica com mais naturalidade fenômenos como interferência, difração e polarização, que são difíceis de entender pensando apenas em partículas."
      },
      {
        "type": "paragraph",
        "text": "Mais tarde, Maxwell mostrou que a luz é uma onda eletromagnética. Isso significa que a luz é formada por oscilações de campos elétricos e magnéticos que se propagam no espaço. Essa foi uma das grandes unificações da Física: a Óptica passou a ser entendida como parte do Eletromagnetismo."
      },
      {
        "type": "paragraph",
        "text": "No século XX, a Física Moderna mostrou que a luz também apresenta comportamento quântico. Em certos fenômenos, como o efeito fotoelétrico, a luz se comporta como se fosse formada por pacotes de energia chamados fótons. Assim, a visão moderna é mais rica: a luz possui comportamento ondulatório e corpuscular, dependendo do fenômeno observado."
      },
      {
        "type": "paragraph",
        "text": "Mas, para boa parte dos problemas de vestibular envolvendo espelhos, lentes, refração, sombras, câmaras escuras e instrumentos ópticos, usamos uma aproximação chamada Óptica Geométrica."
      },
      {
        "type": "paragraph",
        "text": "A Óptica Geométrica trata a luz como raios luminosos que se propagam em linha reta em meios homogêneos. Essa aproximação funciona muito bem quando as dimensões dos objetos, aberturas e instrumentos são muito maiores que o comprimento de onda da luz. Nesses casos, podemos ignorar efeitos ondulatórios como difração e interferência e resolver muitos problemas usando geometria."
      },
      {
        "type": "paragraph",
        "text": "Portanto, a Óptica Geométrica não é a teoria completa da luz. Ela é uma aproximação extremamente útil dentro de uma teoria maior. E é justamente por isso que ela cai tanto em prova: com poucas ideias físicas e muita geometria, ela consegue explicar uma quantidade enorme de fenômenos."
      }
    ]
  },
  {
    "title": "Ideia intuitiva da Óptica",
    "rawTitle": "2. Ideia intuitiva da Óptica",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A ideia central da Óptica é estudar o comportamento da luz: como ela se propaga, como interage com superfícies, como muda de direção ao atravessar meios diferentes e como forma imagens."
      },
      {
        "type": "paragraph",
        "text": "Quando olhamos para um objeto, não estamos “tocando” o objeto com os olhos. A informação visual chega até nós por meio da luz. Se o objeto emite luz, como uma lâmpada ou uma tela, essa luz chega diretamente ao olho. Se o objeto não emite luz própria, como um livro, uma mesa ou uma parede, ele é visto porque reflete luz proveniente de alguma fonte."
      },
      {
        "type": "paragraph",
        "text": "Existem várias formas de olhar para a luz."
      },
      {
        "type": "subheading",
        "text": "Luz como raio luminoso"
      },
      {
        "type": "paragraph",
        "text": "Na Óptica Geométrica, representamos a luz por raios luminosos. Um raio luminoso é uma linha orientada que indica a direção e o sentido de propagação da luz."
      },
      {
        "type": "paragraph",
        "text": "Essa representação é uma idealização. Um raio isolado não existe como objeto físico separado. Ele é uma ferramenta geométrica. Usamos raios porque, em muitos problemas, o que interessa é o caminho da luz."
      },
      {
        "type": "paragraph",
        "text": "Essa ideia é muito útil para estudar:"
      },
      {
        "type": "list",
        "items": [
          "sombras;",
          "espelhos;",
          "lentes;",
          "câmaras escuras;",
          "periscópios;",
          "telescópios;",
          "formação de imagens."
        ]
      },
      {
        "type": "subheading",
        "text": "Luz como feixe luminoso"
      },
      {
        "type": "paragraph",
        "text": "Um feixe luminoso é um conjunto de raios luminosos. Dependendo do comportamento dos raios, o feixe pode ser:"
      },
      {
        "type": "list",
        "items": [
          "convergente, quando os raios se aproximam;",
          "divergente, quando os raios se afastam;",
          "paralelo ou cilíndrico, quando os raios seguem paralelos."
        ]
      },
      {
        "type": "paragraph",
        "text": "Essa linguagem é muito importante em espelhos e lentes. Uma lente convergente, por exemplo, tende a transformar um feixe paralelo em um feixe convergente. Uma lente divergente tende a espalhar os raios."
      },
      {
        "type": "subheading",
        "text": "Luz como onda eletromagnética"
      },
      {
        "type": "paragraph",
        "text": "Quando precisamos explicar cor, frequência, comprimento de onda, interferência, difração ou polarização, a representação por raios não é suficiente. Aí precisamos lembrar que a luz é uma onda eletromagnética."
      },
      {
        "type": "paragraph",
        "text": "Essa visão é essencial para entender, por exemplo:"
      },
      {
        "type": "list",
        "items": [
          "por que a luz branca pode se decompor em cores;",
          "por que diferentes cores refratam de maneiras diferentes;",
          "por que ocorre difração em fendas muito pequenas;",
          "por que a frequência da luz não muda ao passar de um meio para outro."
        ]
      },
      {
        "type": "subheading",
        "text": "Luz como energia transportada"
      },
      {
        "type": "paragraph",
        "text": "A luz transporta energia. Quando a luz solar aquece uma superfície, quando um laser corta um material, quando uma célula fotovoltaica gera eletricidade ou quando a retina detecta luz, há transferência de energia."
      },
      {
        "type": "paragraph",
        "text": "Na Óptica Geométrica, geralmente não estudamos profundamente essa parte energética, mas ela está presente. A luz não é apenas “algo que mostra objetos”; ela é uma forma de transporte de energia eletromagnética."
      },
      {
        "type": "subheading",
        "text": "Por que usamos raios de luz?"
      },
      {
        "type": "paragraph",
        "text": "Usamos raios de luz porque, em muitas situações, o comprimento de onda da luz é muito pequeno comparado às dimensões envolvidas."
      },
      {
        "type": "paragraph",
        "text": "A luz visível tem comprimento de onda da ordem de centenas de nanômetros. Um nanômetro vale:"
      },
      {
        "type": "formula",
        "formula": "1\\ \\mathrm{nm} = 10^{-9}\\ \\mathrm{m}"
      },
      {
        "type": "paragraph",
        "text": "Como espelhos, lentes, objetos e distâncias de vestibular normalmente têm dimensões muito maiores que isso, a propagação da luz pode ser aproximada por linhas retas."
      },
      {
        "type": "paragraph",
        "text": "Essa aproximação funciona bem quando:"
      },
      {
        "type": "list",
        "items": [
          "os obstáculos são grandes comparados ao comprimento de onda;",
          "as aberturas são grandes comparadas ao comprimento de onda;",
          "não estamos interessados em interferência ou difração;",
          "queremos estudar formação de imagens por geometria."
        ]
      },
      {
        "type": "paragraph",
        "text": "Ela falha ou fica incompleta quando:"
      },
      {
        "type": "list",
        "items": [
          "a luz passa por fendas muito estreitas;",
          "ocorre interferência;",
          "ocorre difração perceptível;",
          "precisamos explicar polarização;",
          "precisamos analisar a natureza quântica da luz."
        ]
      },
      {
        "type": "paragraph",
        "text": "A Óptica Geométrica é, portanto, uma teoria de caminhos. Ela pergunta: por onde a luz vai? A Óptica Ondulatória pergunta: como a onda se comporta? A Física Moderna pergunta: como a energia da luz é quantizada? Cada visão serve para um tipo de problema."
      }
    ]
  },
  {
    "title": "Natureza da luz",
    "rawTitle": "3. Natureza da luz",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A luz é uma onda eletromagnética. Isso significa que ela corresponde à propagação de campos elétricos e magnéticos oscilantes no espaço."
      },
      {
        "type": "paragraph",
        "text": "Em uma onda eletromagnética, o campo elétrico e o campo magnético oscilam perpendicularmente entre si e também perpendicularmente à direção de propagação. Isso torna a luz uma onda transversal."
      },
      {
        "type": "paragraph",
        "text": "A relação fundamental entre velocidade, comprimento de onda e frequência é:"
      },
      {
        "type": "formula",
        "formula": "v = \\lambda f"
      },
      {
        "type": "paragraph",
        "text": "Em que:"
      },
      {
        "type": "list",
        "items": [
          "$v$ é a velocidade de propagação da luz no meio;",
          "$\\lambda$ é o comprimento de onda;",
          "$f$ é a frequência da luz."
        ]
      },
      {
        "type": "paragraph",
        "text": "O comprimento de onda $\\lambda$ representa a distância entre dois pontos equivalentes consecutivos da onda, como duas cristas consecutivas. A frequência $f$ representa quantas oscilações ocorrem por segundo. A velocidade $v$ representa com que rapidez a onda se propaga no meio."
      },
      {
        "type": "paragraph",
        "text": "No vácuo, a luz se propaga com velocidade aproximadamente igual a:"
      },
      {
        "type": "formula",
        "formula": "c \\approx 3{,}0 \\times 10^8\\ \\mathrm{m/s}"
      },
      {
        "type": "paragraph",
        "text": "Essa é uma das constantes mais importantes da Física."
      },
      {
        "type": "paragraph",
        "text": "Em meios materiais, como água, vidro, acrílico ou diamante, a luz se propaga com velocidade menor que no vácuo. Por isso definimos o índice de refração absoluto:"
      },
      {
        "type": "formula",
        "formula": "n = \\frac{c}{v}"
      },
      {
        "type": "paragraph",
        "text": "Como $v \\leq c$ em meios materiais comuns, o índice de refração costuma ser maior ou igual a 1."
      },
      {
        "type": "subheading",
        "text": "O que muda quando a luz passa de um meio para outro?"
      },
      {
        "type": "paragraph",
        "text": "Quando a luz passa de um meio para outro, como do ar para a água, três grandezas merecem atenção:"
      },
      {
        "type": "list",
        "items": [
          "frequência;",
          "velocidade;",
          "comprimento de onda."
        ]
      },
      {
        "type": "paragraph",
        "text": "A frequência da luz não muda na refração. Ela é determinada pela fonte emissora. Se uma luz verde incide na água, sua frequência continua sendo a frequência correspondente ao verde. O que muda é a velocidade de propagação no novo meio."
      },
      {
        "type": "paragraph",
        "text": "Como:"
      },
      {
        "type": "formula",
        "formula": "v = \\lambda f"
      },
      {
        "type": "paragraph",
        "text": "se a frequência $f$ permanece constante e a velocidade $v$ muda, então o comprimento de onda $\\lambda$ também muda."
      },
      {
        "type": "paragraph",
        "text": "Se a luz entra em um meio onde sua velocidade diminui, seu comprimento de onda diminui."
      },
      {
        "type": "paragraph",
        "text": "Se a luz entra em um meio onde sua velocidade aumenta, seu comprimento de onda aumenta."
      },
      {
        "type": "paragraph",
        "text": "Portanto:"
      },
      {
        "type": "list",
        "items": [
          "frequência não muda na refração;",
          "velocidade muda;",
          "comprimento de onda muda."
        ]
      },
      {
        "type": "paragraph",
        "text": "Esse detalhe é uma armadilha clássica. Muita gente acha que a frequência muda porque a cor “parece” mudar em alguns contextos. Mas, na passagem de meio, a frequência da luz permanece a mesma. O que muda é a velocidade e o comprimento de onda."
      },
      {
        "type": "subheading",
        "text": "Luz visível e espectro eletromagnético"
      },
      {
        "type": "paragraph",
        "text": "A luz visível é apenas uma pequena faixa do espectro eletromagnético."
      },
      {
        "type": "paragraph",
        "text": "O espectro eletromagnético inclui, em ordem geral de frequência crescente:"
      },
      {
        "type": "list",
        "items": [
          "ondas de rádio;",
          "micro-ondas;",
          "infravermelho;",
          "luz visível;",
          "ultravioleta;",
          "raios X;",
          "raios gama."
        ]
      },
      {
        "type": "paragraph",
        "text": "A luz visível corresponde à faixa que o olho humano consegue detectar. Dentro dela, temos cores como vermelho, laranja, amarelo, verde, azul, anil e violeta."
      },
      {
        "type": "paragraph",
        "text": "Em termos aproximados:"
      },
      {
        "type": "list",
        "items": [
          "o vermelho tem maior comprimento de onda e menor frequência dentro da luz visível;",
          "o violeta tem menor comprimento de onda e maior frequência dentro da luz visível."
        ]
      },
      {
        "type": "paragraph",
        "text": "No vácuo, todas as cores da luz visível se propagam com a mesma velocidade $c$. Em meios materiais dispersivos, como vidro, diferentes cores podem ter velocidades ligeiramente diferentes. Isso causa a dispersão luminosa, responsável pela decomposição da luz branca em prismas."
      }
    ]
  },
  {
    "title": "Princípios da Óptica Geométrica",
    "rawTitle": "4. Princípios da Óptica Geométrica",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A Óptica Geométrica se apoia em princípios simples, mas extremamente poderosos. Esses princípios permitem estudar sombras, câmaras escuras, espelhos, lentes e muitos instrumentos ópticos usando geometria."
      },
      {
        "type": "paragraph",
        "text": "Os três princípios principais são:"
      },
      {
        "type": "list",
        "items": [
          "propagação retilínea da luz;",
          "independência dos raios luminosos;",
          "reversibilidade dos raios luminosos."
        ]
      }
    ]
  },
  {
    "title": "Princípio da propagação retilínea da luz",
    "rawTitle": "4.1 Princípio da propagação retilínea da luz",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Em meios homogêneos, transparentes e isotrópicos, a luz se propaga em linha reta."
      },
      {
        "type": "paragraph",
        "text": "Um meio homogêneo é aquele que tem as mesmas propriedades em todos os pontos. Um meio isotrópico é aquele cujas propriedades são as mesmas em todas as direções. Se essas condições são satisfeitas, e se não estamos considerando efeitos ondulatórios como difração, podemos representar a trajetória da luz por linhas retas."
      },
      {
        "type": "paragraph",
        "text": "Esse princípio explica diversos fenômenos."
      },
      {
        "type": "subheading",
        "text": "Formação de sombras"
      },
      {
        "type": "paragraph",
        "text": "Se a luz se propaga em linha reta e encontra um obstáculo opaco, a região atrás do obstáculo pode deixar de receber luz diretamente. Forma-se uma sombra."
      },
      {
        "type": "paragraph",
        "text": "Quanto mais bem definida for a fonte luminosa e quanto mais retilínea for a propagação, mais nítida será a sombra."
      },
      {
        "type": "subheading",
        "text": "Eclipses"
      },
      {
        "type": "paragraph",
        "text": "Eclipses solares e lunares são grandes exemplos astronômicos da propagação retilínea da luz."
      },
      {
        "type": "paragraph",
        "text": "No eclipse solar, a Lua fica entre o Sol e a Terra. Como a Lua bloqueia parte da luz solar, forma-se uma região de sombra sobre a Terra."
      },
      {
        "type": "paragraph",
        "text": "No eclipse lunar, a Terra fica entre o Sol e a Lua. A Lua entra na sombra projetada pela Terra."
      },
      {
        "type": "subheading",
        "text": "Câmara escura"
      },
      {
        "type": "paragraph",
        "text": "A câmara escura de orifício funciona porque os raios luminosos provenientes da parte superior do objeto atravessam o orifício e chegam à parte inferior da tela, enquanto os raios provenientes da parte inferior do objeto chegam à parte superior da tela. A imagem fica invertida por causa da propagação retilínea."
      },
      {
        "type": "subheading",
        "text": "Alinhamento visual"
      },
      {
        "type": "paragraph",
        "text": "Quando olhamos por uma fresta, por uma mira ou por um tubo estreito, estamos explorando o fato de que a luz se propaga aproximadamente em linha reta. A visão direta depende de um caminho retilíneo entre o objeto e o olho."
      },
      {
        "type": "subheading",
        "text": "Feixes luminosos"
      },
      {
        "type": "paragraph",
        "text": "Lasers e lanternas em ambientes com partículas suspensas no ar permitem visualizar aproximadamente a trajetória dos feixes. O feixe parece uma linha porque os raios se propagam em trajetórias retilíneas no meio homogêneo."
      }
    ]
  },
  {
    "title": "Princípio da independência dos raios luminosos",
    "rawTitle": "4.2 Princípio da independência dos raios luminosos",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Quando dois ou mais raios luminosos se cruzam, cada um continua sua trajetória como se o outro não existisse."
      },
      {
        "type": "paragraph",
        "text": "Isso é o princípio da independência dos raios luminosos."
      },
      {
        "type": "paragraph",
        "text": "Imagine dois feixes de laser se cruzando no ar. Depois do cruzamento, cada feixe continua seu caminho original. Eles não “batem” um no outro como bolas. A luz, nas condições comuns da Óptica Geométrica, não altera a trajetória de outro raio luminoso apenas por cruzá-lo."
      },
      {
        "type": "paragraph",
        "text": "Esse princípio aparece em situações cotidianas:"
      },
      {
        "type": "list",
        "items": [
          "faróis de carros em sentidos opostos;",
          "projetores iluminando uma mesma região;",
          "feixes de lanternas cruzados;",
          "luzes de palco;",
          "múltiplas fontes iluminando um objeto."
        ]
      },
      {
        "type": "paragraph",
        "text": "Se dois carros estão em uma estrada à noite, os feixes dos faróis podem se cruzar. Um feixe não desvia o outro. Cada um segue sua trajetória."
      },
      {
        "type": "paragraph",
        "text": "Esse princípio permite analisar separadamente os raios em construções geométricas. Em espelhos e lentes, traçamos raios notáveis cruzando-se sem considerar que eles interagem entre si. O cruzamento dos raios indica a posição da imagem, não uma colisão física entre raios."
      }
    ]
  },
  {
    "title": "Princípio da reversibilidade dos raios luminosos",
    "rawTitle": "4.3 Princípio da reversibilidade dos raios luminosos",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Se a luz percorre certo caminho de um ponto $A$ até um ponto $B$, ela poderia percorrer o mesmo caminho no sentido inverso, de $B$ até $A$, desde que as condições do meio permaneçam as mesmas."
      },
      {
        "type": "paragraph",
        "text": "Esse é o princípio da reversibilidade dos raios luminosos."
      },
      {
        "type": "paragraph",
        "text": "Ele é muito importante em:"
      },
      {
        "type": "list",
        "items": [
          "espelhos planos;",
          "espelhos esféricos;",
          "lentes;",
          "sistemas ópticos;",
          "periscópios;",
          "câmeras;",
          "instrumentos de observação."
        ]
      },
      {
        "type": "paragraph",
        "text": "Um exemplo simples: se uma pessoa consegue ver os olhos de outra através de um espelho plano, a outra pessoa também consegue ver seus olhos pelo mesmo espelho, desde que olhe na direção adequada. O caminho da luz pode ser invertido."
      },
      {
        "type": "paragraph",
        "text": "Nos espelhos, se um raio que sai de um ponto incide no espelho e chega ao olho, podemos pensar o caminho ao contrário: um raio saindo do olho poderia seguir o mesmo trajeto inverso até o objeto."
      },
      {
        "type": "paragraph",
        "text": "Nas lentes, o princípio também ajuda a entender raios notáveis. Se um raio paralelo ao eixo principal passa pelo foco após atravessar uma lente convergente, então um raio que passa pelo foco antes da lente emerge paralelo ao eixo principal."
      },
      {
        "type": "paragraph",
        "text": "A reversibilidade não significa que todo fenômeno físico do universo seja reversível em qualquer condição. Ela é um princípio geométrico válido para trajetórias ópticas em meios estacionários e sem processos dissipativos relevantes."
      }
    ]
  },
  {
    "title": "Meios ópticos",
    "rawTitle": "5. Meios ópticos",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Para estudar a propagação da luz, precisamos classificar os meios por onde ela passa ou tenta passar."
      }
    ]
  },
  {
    "title": "Meio transparente",
    "rawTitle": "5.1 Meio transparente",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Um meio transparente permite a passagem da luz com pouca dispersão, possibilitando a formação nítida de imagens através dele."
      },
      {
        "type": "paragraph",
        "text": "Exemplos:"
      },
      {
        "type": "list",
        "items": [
          "vidro limpo;",
          "ar;",
          "água limpa;",
          "acrílico transparente;",
          "certos cristais."
        ]
      },
      {
        "type": "paragraph",
        "text": "Quando olhamos através de uma janela limpa, conseguimos ver objetos do outro lado com nitidez. Isso caracteriza um meio transparente."
      }
    ]
  },
  {
    "title": "Meio translúcido",
    "rawTitle": "5.2 Meio translúcido",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Um meio translúcido permite a passagem parcial da luz, mas espalha os raios de modo que não conseguimos formar imagens nítidas através dele."
      },
      {
        "type": "paragraph",
        "text": "Exemplos:"
      },
      {
        "type": "list",
        "items": [
          "vidro fosco;",
          "papel vegetal;",
          "plástico leitoso;",
          "cortina fina;",
          "água turva."
        ]
      },
      {
        "type": "paragraph",
        "text": "A luz atravessa, mas a imagem fica borrada ou indefinida."
      }
    ]
  },
  {
    "title": "Meio opaco",
    "rawTitle": "5.3 Meio opaco",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Um meio opaco não permite a passagem significativa da luz visível."
      },
      {
        "type": "paragraph",
        "text": "Exemplos:"
      },
      {
        "type": "list",
        "items": [
          "madeira;",
          "metal;",
          "parede de concreto;",
          "papelão grosso;",
          "pedra."
        ]
      },
      {
        "type": "paragraph",
        "text": "Quando a luz encontra um corpo opaco, parte pode ser refletida e parte absorvida, mas a luz não atravessa de modo perceptível."
      }
    ]
  },
  {
    "title": "Meio homogêneo",
    "rawTitle": "5.4 Meio homogêneo",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Um meio homogêneo apresenta as mesmas propriedades em todos os seus pontos."
      },
      {
        "type": "paragraph",
        "text": "Exemplos aproximados:"
      },
      {
        "type": "list",
        "items": [
          "ar em uma pequena região com temperatura uniforme;",
          "água pura em repouso;",
          "vidro uniforme."
        ]
      },
      {
        "type": "paragraph",
        "text": "Em um meio homogêneo, a luz tende a se propagar em linha reta, desde que o meio também seja isotrópico."
      }
    ]
  },
  {
    "title": "Meio heterogêneo",
    "rawTitle": "5.5 Meio heterogêneo",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Um meio heterogêneo apresenta propriedades que variam de ponto para ponto."
      },
      {
        "type": "paragraph",
        "text": "Exemplos:"
      },
      {
        "type": "list",
        "items": [
          "ar com grandes variações de temperatura;",
          "água com regiões de salinidade diferente;",
          "atmosfera terrestre em grande escala;",
          "vidro com composição irregular."
        ]
      },
      {
        "type": "paragraph",
        "text": "Em meios heterogêneos, a luz pode sofrer desvios progressivos. Miragens, por exemplo, envolvem variações do índice de refração do ar com a temperatura."
      }
    ]
  },
  {
    "title": "Meio isotrópico",
    "rawTitle": "5.6 Meio isotrópico",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Um meio isotrópico apresenta as mesmas propriedades ópticas em todas as direções."
      },
      {
        "type": "paragraph",
        "text": "Exemplos aproximados:"
      },
      {
        "type": "list",
        "items": [
          "vidro comum;",
          "água;",
          "ar em condições simples."
        ]
      },
      {
        "type": "paragraph",
        "text": "Em um meio isotrópico, a velocidade da luz em um ponto não depende da direção de propagação."
      }
    ]
  },
  {
    "title": "Meio anisotrópico",
    "rawTitle": "5.7 Meio anisotrópico",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Um meio anisotrópico apresenta propriedades ópticas que dependem da direção."
      },
      {
        "type": "paragraph",
        "text": "Exemplos:"
      },
      {
        "type": "list",
        "items": [
          "certos cristais;",
          "calcita;",
          "materiais birrefringentes."
        ]
      },
      {
        "type": "paragraph",
        "text": "Em meios anisotrópicos, a luz pode se comportar de forma mais complexa, podendo até se dividir em raios com diferentes velocidades e polarizações. Esse estudo é mais avançado, mas a ideia básica é: nem todo meio responde igualmente em todas as direções."
      }
    ]
  },
  {
    "title": "Fontes luminosas",
    "rawTitle": "5.8 Fontes luminosas",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Uma fonte luminosa é qualquer corpo que emite ou reflete luz."
      },
      {
        "type": "subheading",
        "text": "Fonte primária"
      },
      {
        "type": "paragraph",
        "text": "Fonte primária é aquela que emite luz própria."
      },
      {
        "type": "paragraph",
        "text": "Exemplos:"
      },
      {
        "type": "list",
        "items": [
          "Sol;",
          "lâmpada acesa;",
          "chama;",
          "tela ligada;",
          "estrela;",
          "laser."
        ]
      },
      {
        "type": "subheading",
        "text": "Fonte secundária"
      },
      {
        "type": "paragraph",
        "text": "Fonte secundária é aquela que não emite luz própria, mas reflete luz recebida de outra fonte."
      },
      {
        "type": "paragraph",
        "text": "Exemplos:"
      },
      {
        "type": "list",
        "items": [
          "Lua;",
          "planetas;",
          "parede iluminada;",
          "livro;",
          "pessoa;",
          "mesa."
        ]
      },
      {
        "type": "paragraph",
        "text": "A Lua não tem luz própria no sentido óptico usual. Ela é vista porque reflete luz solar."
      },
      {
        "type": "subheading",
        "text": "Fonte puntiforme"
      },
      {
        "type": "paragraph",
        "text": "Uma fonte puntiforme é uma fonte cujas dimensões podem ser desprezadas em relação às distâncias envolvidas."
      },
      {
        "type": "paragraph",
        "text": "Ela é uma idealização. Nenhuma fonte real é perfeitamente puntiforme, mas muitas podem ser tratadas assim em certos problemas."
      },
      {
        "type": "paragraph",
        "text": "Com fonte puntiforme, a sombra tende a ter contornos mais definidos e não aparece penumbra em situações simples."
      },
      {
        "type": "subheading",
        "text": "Fonte extensa"
      },
      {
        "type": "paragraph",
        "text": "Uma fonte extensa tem dimensões relevantes no problema."
      },
      {
        "type": "paragraph",
        "text": "Exemplos:"
      },
      {
        "type": "list",
        "items": [
          "Sol;",
          "lâmpada grande;",
          "painel luminoso;",
          "janela iluminada."
        ]
      },
      {
        "type": "paragraph",
        "text": "Com fonte extensa, podem aparecer regiões de sombra e penumbra."
      },
      {
        "type": "paragraph",
        "text": "A diferença entre fonte puntiforme e fonte extensa é fundamental para entender eclipses, sombras suaves, iluminação de ambientes e penumbras."
      }
    ]
  },
  {
    "title": "Sombra e penumbra",
    "rawTitle": "6. Sombra e penumbra",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A formação de sombra e penumbra é uma consequência direta da propagação retilínea da luz."
      },
      {
        "type": "paragraph",
        "text": "Quando a luz encontra um objeto opaco, os raios que seriam bloqueados por esse objeto não chegam a certas regiões. Essas regiões recebem menos luz ou nenhuma luz direta, dependendo da geometria da fonte."
      }
    ]
  },
  {
    "title": "Sombra própria",
    "rawTitle": "6.1 Sombra própria",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Sombra própria é a região do próprio corpo que não recebe luz diretamente da fonte."
      },
      {
        "type": "paragraph",
        "text": "Imagine uma esfera iluminada por uma lâmpada. A parte da esfera voltada para a lâmpada fica iluminada. A parte oposta fica escura. Essa região escura no próprio objeto é a sombra própria."
      }
    ]
  },
  {
    "title": "Sombra projetada",
    "rawTitle": "6.2 Sombra projetada",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Sombra projetada é a região escura formada sobre uma superfície ou anteparo atrás do objeto."
      },
      {
        "type": "paragraph",
        "text": "Por exemplo, quando uma pessoa fica entre uma lâmpada e uma parede, aparece uma sombra na parede. Essa é a sombra projetada."
      }
    ]
  },
  {
    "title": "Penumbra",
    "rawTitle": "6.3 Penumbra",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Penumbra é uma região parcialmente iluminada. Ela recebe luz de apenas parte da fonte extensa."
      },
      {
        "type": "paragraph",
        "text": "A penumbra aparece quando a fonte luminosa tem tamanho relevante."
      },
      {
        "type": "paragraph",
        "text": "Se uma fonte extensa ilumina um obstáculo, alguns pontos atrás do obstáculo podem receber luz de uma parte da fonte, mas não de toda. Esses pontos ficam parcialmente iluminados. Isso é penumbra."
      }
    ]
  },
  {
    "title": "Fonte puntiforme e fonte extensa",
    "rawTitle": "6.4 Fonte puntiforme e fonte extensa",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Com uma fonte puntiforme, a região atrás do obstáculo tende a ser dividida em apenas duas partes:"
      },
      {
        "type": "list",
        "items": [
          "região iluminada;",
          "região de sombra."
        ]
      },
      {
        "type": "paragraph",
        "text": "Com uma fonte extensa, aparecem três regiões:"
      },
      {
        "type": "list",
        "items": [
          "região totalmente iluminada;",
          "região de penumbra;",
          "região de sombra total."
        ]
      },
      {
        "type": "paragraph",
        "text": "Isso acontece porque diferentes pontos da fonte extensa emitem raios em direções diferentes. O obstáculo pode bloquear a luz de alguns pontos da fonte, mas não de todos."
      }
    ]
  },
  {
    "title": "Eclipses",
    "rawTitle": "6.5 Eclipses",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Eclipse solar"
      },
      {
        "type": "paragraph",
        "text": "No eclipse solar, a Lua fica entre o Sol e a Terra. A Lua bloqueia a luz solar em certas regiões da Terra."
      },
      {
        "type": "paragraph",
        "text": "Como o Sol é uma fonte extensa, aparecem regiões de:"
      },
      {
        "type": "list",
        "items": [
          "sombra, onde ocorre eclipse total;",
          "penumbra, onde ocorre eclipse parcial."
        ]
      },
      {
        "type": "subheading",
        "text": "Eclipse lunar"
      },
      {
        "type": "paragraph",
        "text": "No eclipse lunar, a Terra fica entre o Sol e a Lua. A Lua entra na sombra projetada pela Terra."
      },
      {
        "type": "paragraph",
        "text": "A depender da posição da Lua em relação à sombra e à penumbra da Terra, o eclipse pode ser total, parcial ou penumbral."
      },
      {
        "type": "paragraph",
        "text": "A geometria dos eclipses é uma aplicação direta da propagação retilínea da luz. Parece coisa astronômica sofisticada, mas a base é literalmente “luz anda reto e objeto opaco bloqueia”. A natureza às vezes faz espetáculos grandiosos com ideias simples."
      }
    ]
  },
  {
    "title": "Câmara escura de orifício",
    "rawTitle": "7. Câmara escura de orifício",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A câmara escura de orifício é um dispositivo simples que mostra de forma muito clara a propagação retilínea da luz."
      },
      {
        "type": "paragraph",
        "text": "Ela consiste em uma caixa fechada com um pequeno orifício em uma das faces e uma tela na face oposta. Um objeto iluminado colocado à frente do orifício forma uma imagem invertida na tela interna."
      }
    ]
  },
  {
    "title": "Por que a imagem fica invertida?",
    "rawTitle": "7.1 Por que a imagem fica invertida?",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Considere um objeto vertical colocado diante do orifício."
      },
      {
        "type": "paragraph",
        "text": "Um raio luminoso que sai da parte superior do objeto atravessa o orifício e chega à parte inferior da tela."
      },
      {
        "type": "paragraph",
        "text": "Um raio que sai da parte inferior do objeto atravessa o orifício e chega à parte superior da tela."
      },
      {
        "type": "paragraph",
        "text": "Como os raios se propagam em linha reta, eles se cruzam no orifício. Por isso, a imagem formada fica invertida."
      },
      {
        "type": "paragraph",
        "text": "Essa inversão não é mágica nem depende de lente. É pura geometria."
      }
    ]
  },
  {
    "title": "Relação geométrica",
    "rawTitle": "7.2 Relação geométrica",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A relação entre o tamanho da imagem, o tamanho do objeto e as distâncias é:"
      },
      {
        "type": "formula",
        "formula": "\\frac{i}{o} = \\frac{p'}{p}"
      },
      {
        "type": "paragraph",
        "text": "Em que:"
      },
      {
        "type": "list",
        "items": [
          "$i$ é o tamanho da imagem;",
          "$o$ é o tamanho do objeto;",
          "$p'$ é a distância da imagem ao orifício;",
          "$p$ é a distância do objeto ao orifício."
        ]
      },
      {
        "type": "paragraph",
        "text": "Essa relação vem de semelhança de triângulos."
      },
      {
        "type": "paragraph",
        "text": "O triângulo formado pelo objeto e pelo orifício é semelhante ao triângulo formado pela imagem e pelo orifício. Como os ângulos correspondentes são iguais, as razões entre lados correspondentes também são iguais."
      },
      {
        "type": "paragraph",
        "text": "Assim:"
      },
      {
        "type": "formula",
        "formula": "\\frac{\\text{tamanho da imagem}}{\\text{tamanho do objeto}} = \\frac{\\text{distância da imagem ao orifício}}{\\text{distância do objeto ao orifício}}"
      },
      {
        "type": "paragraph",
        "text": "Ou seja:"
      },
      {
        "type": "formula",
        "formula": "\\frac{i}{o} = \\frac{p'}{p}"
      }
    ]
  },
  {
    "title": "Interpretação física",
    "rawTitle": "7.3 Interpretação física",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Se a tela está mais longe do orifício, a imagem aumenta."
      },
      {
        "type": "paragraph",
        "text": "Se o objeto está mais longe do orifício, a imagem diminui."
      },
      {
        "type": "paragraph",
        "text": "Isso faz sentido geometricamente: quanto mais distante está o objeto, menor é o ângulo visual que ele ocupa no orifício, e menor tende a ser sua imagem na tela."
      }
    ]
  },
  {
    "title": "Exemplo resolvido: câmara escura",
    "rawTitle": "7.4 Exemplo resolvido: câmara escura",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Um objeto de altura $o = 1{,}80\\ \\mathrm{m}$ está a $p = 6{,}0\\ \\mathrm{m}$ do orifício de uma câmara escura. A distância entre o orifício e a tela é $p' = 0{,}20\\ \\mathrm{m}$. Determine a altura da imagem formada."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "A relação da câmara escura é:"
      },
      {
        "type": "formula",
        "formula": "\\frac{i}{o} = \\frac{p'}{p}"
      },
      {
        "type": "paragraph",
        "text": "Substituindo os valores:"
      },
      {
        "type": "formula",
        "formula": "\\frac{i}{1{,}80} = \\frac{0{,}20}{6{,}0}"
      },
      {
        "type": "paragraph",
        "text": "Calculando a razão:"
      },
      {
        "type": "formula",
        "formula": "\\frac{0{,}20}{6{,}0} = \\frac{1}{30}"
      },
      {
        "type": "paragraph",
        "text": "Então:"
      },
      {
        "type": "formula",
        "formula": "\\frac{i}{1{,}80} = \\frac{1}{30}"
      },
      {
        "type": "paragraph",
        "text": "Multiplicando:"
      },
      {
        "type": "formula",
        "formula": "i = \\frac{1{,}80}{30}"
      },
      {
        "type": "formula",
        "formula": "i = 0{,}060\\ \\mathrm{m}"
      },
      {
        "type": "paragraph",
        "text": "Convertendo para centímetros:"
      },
      {
        "type": "formula",
        "formula": "0{,}060\\ \\mathrm{m} = 6{,}0\\ \\mathrm{cm}"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "A imagem tem altura:"
      },
      {
        "type": "formula",
        "formula": "i = 6{,}0\\ \\mathrm{cm}"
      },
      {
        "type": "paragraph",
        "text": "A imagem é invertida."
      },
      {
        "type": "subheading",
        "text": "Interpretação"
      },
      {
        "type": "paragraph",
        "text": "O objeto é grande, mas está relativamente longe do orifício. A tela está bem próxima do orifício. Por isso, a imagem formada é muito menor que o objeto. A inversão ocorre porque os raios vindos da parte superior e inferior do objeto se cruzam no orifício."
      }
    ]
  },
  {
    "title": "Reflexão da luz",
    "rawTitle": "8. Reflexão da luz",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Reflexão é o fenômeno em que a luz incide sobre uma superfície e retorna ao meio de origem."
      },
      {
        "type": "paragraph",
        "text": "Quando um raio luminoso atinge uma superfície refletora, como um espelho, parte da luz pode voltar. Dependendo da superfície, essa reflexão pode ser regular ou difusa."
      }
    ]
  },
  {
    "title": "Reflexão regular",
    "rawTitle": "8.1 Reflexão regular",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A reflexão regular ocorre em superfícies lisas e polidas, onde raios incidentes paralelos são refletidos também de forma organizada."
      },
      {
        "type": "paragraph",
        "text": "Exemplos:"
      },
      {
        "type": "list",
        "items": [
          "espelho plano;",
          "superfície metálica polida;",
          "água muito calma;",
          "vidro refletivo."
        ]
      },
      {
        "type": "paragraph",
        "text": "A reflexão regular permite formação nítida de imagens."
      }
    ]
  },
  {
    "title": "Reflexão difusa",
    "rawTitle": "8.2 Reflexão difusa",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A reflexão difusa ocorre em superfícies rugosas, nas quais raios incidentes paralelos são refletidos em várias direções."
      },
      {
        "type": "paragraph",
        "text": "Exemplos:"
      },
      {
        "type": "list",
        "items": [
          "parede;",
          "papel;",
          "madeira;",
          "tecido;",
          "chão áspero."
        ]
      },
      {
        "type": "paragraph",
        "text": "A reflexão difusa é a razão pela qual conseguimos ver objetos comuns de várias posições. Uma folha de papel não forma uma imagem como um espelho, mas espalha luz em muitas direções, permitindo que seja vista de diferentes ângulos."
      },
      {
        "type": "paragraph",
        "text": "Sem reflexão difusa, o mundo visual seria um pesadelo de espelhos e brilhos. A parede da sala pareceria um laboratório de laser mal administrado."
      }
    ]
  },
  {
    "title": "Leis da reflexão",
    "rawTitle": "8.3 Leis da reflexão",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A reflexão obedece a duas leis principais."
      },
      {
        "type": "subheading",
        "text": "Primeira lei da reflexão"
      },
      {
        "type": "paragraph",
        "text": "O raio incidente, o raio refletido e a normal à superfície no ponto de incidência pertencem ao mesmo plano."
      },
      {
        "type": "paragraph",
        "text": "Essa lei garante que o problema pode ser analisado em um plano geométrico."
      },
      {
        "type": "subheading",
        "text": "Segunda lei da reflexão"
      },
      {
        "type": "paragraph",
        "text": "O ângulo de incidência é igual ao ângulo de reflexão:"
      },
      {
        "type": "formula",
        "formula": "i = r"
      },
      {
        "type": "paragraph",
        "text": "Em que:"
      },
      {
        "type": "list",
        "items": [
          "$i$ é o ângulo de incidência;",
          "$r$ é o ângulo de reflexão."
        ]
      },
      {
        "type": "paragraph",
        "text": "Atenção: esses ângulos são medidos em relação à normal, não em relação à superfície."
      }
    ]
  },
  {
    "title": "Elementos da reflexão",
    "rawTitle": "8.4 Elementos da reflexão",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Raio incidente"
      },
      {
        "type": "paragraph",
        "text": "É o raio que chega à superfície refletora."
      },
      {
        "type": "subheading",
        "text": "Raio refletido"
      },
      {
        "type": "paragraph",
        "text": "É o raio que sai da superfície após a reflexão."
      },
      {
        "type": "subheading",
        "text": "Normal"
      },
      {
        "type": "paragraph",
        "text": "É uma reta perpendicular à superfície no ponto de incidência."
      },
      {
        "type": "subheading",
        "text": "Ângulo de incidência"
      },
      {
        "type": "paragraph",
        "text": "É o ângulo entre o raio incidente e a normal."
      },
      {
        "type": "subheading",
        "text": "Ângulo de reflexão"
      },
      {
        "type": "paragraph",
        "text": "É o ângulo entre o raio refletido e a normal."
      },
      {
        "type": "paragraph",
        "text": "O erro clássico é medir o ângulo em relação à superfície. Se o enunciado der ângulo com a superfície, você precisa converter para ângulo com a normal."
      },
      {
        "type": "paragraph",
        "text": "Como a normal é perpendicular à superfície, se o raio faz ângulo $\\theta$ com a superfície, ele faz ângulo $90^\\circ - \\theta$ com a normal."
      }
    ]
  },
  {
    "title": "Aplicações cotidianas",
    "rawTitle": "8.5 Aplicações cotidianas",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A reflexão aparece em:"
      },
      {
        "type": "list",
        "items": [
          "espelhos;",
          "retrovisores;",
          "periscópios;",
          "superfícies metálicas;",
          "água calma;",
          "projetores;",
          "telescópios refletores;",
          "iluminação arquitetônica;",
          "visão de objetos não luminosos."
        ]
      },
      {
        "type": "paragraph",
        "text": "Vemos a maioria dos objetos porque eles refletem luz. A luz sai de uma fonte, incide no objeto, reflete de forma difusa e chega aos nossos olhos."
      }
    ]
  },
  {
    "title": "Espelhos planos",
    "rawTitle": "9. Espelhos planos",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Um espelho plano é uma superfície refletora plana e polida capaz de produzir reflexão regular."
      },
      {
        "type": "paragraph",
        "text": "A formação de imagem em espelho plano pode ser entendida pela reflexão dos raios luminosos e pelo prolongamento dos raios refletidos."
      }
    ]
  },
  {
    "title": "Formação da imagem",
    "rawTitle": "9.1 Formação da imagem",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Quando um objeto está diante de um espelho plano, raios de luz saem do objeto, refletem no espelho e chegam ao olho do observador."
      },
      {
        "type": "paragraph",
        "text": "O olho interpreta os raios refletidos como se viessem de um ponto atrás do espelho. Esse ponto é a imagem virtual do objeto."
      },
      {
        "type": "paragraph",
        "text": "A imagem não está realmente atrás do espelho. Ela é formada pelo prolongamento geométrico dos raios refletidos."
      }
    ]
  },
  {
    "title": "Características da imagem no espelho plano",
    "rawTitle": "9.2 Características da imagem no espelho plano",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A imagem formada por um espelho plano é:"
      },
      {
        "type": "list",
        "items": [
          "virtual;",
          "direita;",
          "de mesmo tamanho que o objeto;",
          "simétrica em relação ao plano do espelho;",
          "enantiomorfa."
        ]
      },
      {
        "type": "subheading",
        "text": "Imagem virtual"
      },
      {
        "type": "paragraph",
        "text": "Uma imagem virtual é formada pelo prolongamento dos raios luminosos. Os raios refletidos não passam realmente pelo ponto da imagem; eles apenas parecem vir de lá."
      },
      {
        "type": "paragraph",
        "text": "Por isso, uma imagem virtual não pode ser projetada diretamente em uma tela."
      },
      {
        "type": "subheading",
        "text": "Imagem direita"
      },
      {
        "type": "paragraph",
        "text": "A imagem tem a mesma orientação vertical do objeto. Se você está em pé diante do espelho, sua imagem também aparece em pé."
      },
      {
        "type": "subheading",
        "text": "Mesmo tamanho"
      },
      {
        "type": "paragraph",
        "text": "O espelho plano não aumenta nem diminui o objeto. Assim:"
      },
      {
        "type": "formula",
        "formula": "i = o"
      },
      {
        "type": "subheading",
        "text": "Simetria"
      },
      {
        "type": "paragraph",
        "text": "A distância do objeto ao espelho é igual à distância da imagem ao espelho:"
      },
      {
        "type": "formula",
        "formula": "d_o = d_i"
      },
      {
        "type": "paragraph",
        "text": "Em que:"
      },
      {
        "type": "list",
        "items": [
          "$d_o$ é a distância do objeto ao espelho;",
          "$d_i$ é a distância da imagem ao espelho."
        ]
      },
      {
        "type": "subheading",
        "text": "Enantiomorfismo"
      },
      {
        "type": "paragraph",
        "text": "A imagem em espelho plano apresenta inversão lateral aparente. A mão direita da pessoa parece ser a esquerda da imagem."
      },
      {
        "type": "paragraph",
        "text": "Tecnicamente, o espelho inverte a direção perpendicular ao plano do espelho, não simplesmente “esquerda e direita” de forma absoluta. Mas, no cotidiano, percebemos isso como inversão lateral."
      }
    ]
  },
  {
    "title": "Campo visual em espelhos planos",
    "rawTitle": "9.3 Campo visual em espelhos planos",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "O campo visual de um espelho plano é a região do espaço que pode ser vista por um observador através do espelho."
      },
      {
        "type": "paragraph",
        "text": "Para determinar o campo visual, usamos a ideia de imagem do observador ou traçamos raios extremos que partem do olho, refletem nas bordas do espelho e delimitam a região visível."
      },
      {
        "type": "paragraph",
        "text": "Um espelho maior aumenta o campo visual."
      },
      {
        "type": "paragraph",
        "text": "A posição do observador também altera a região vista."
      },
      {
        "type": "paragraph",
        "text": "Isso explica por que retrovisores precisam ser ajustados e por que mudar a posição da cabeça muda o que se vê no espelho."
      }
    ]
  },
  {
    "title": "Associação de espelhos planos",
    "rawTitle": "9.4 Associação de espelhos planos",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Quando dois espelhos planos formam entre si um ângulo $\\alpha$, podem ser formadas várias imagens de um objeto colocado entre eles."
      },
      {
        "type": "paragraph",
        "text": "Quando $\\frac{360^\\circ}{\\alpha}$ é inteiro, uma fórmula bastante usada para o número de imagens é:"
      },
      {
        "type": "formula",
        "formula": "N = \\frac{360^\\circ}{\\alpha} - 1"
      },
      {
        "type": "paragraph",
        "text": "Em que:"
      },
      {
        "type": "list",
        "items": [
          "$N$ é o número de imagens;",
          "$\\alpha$ é o ângulo entre os espelhos."
        ]
      },
      {
        "type": "paragraph",
        "text": "Essa fórmula funciona diretamente quando o objeto está sobre o plano bissetor do ângulo e quando $\\frac{360^\\circ}{\\alpha}$ é inteiro."
      },
      {
        "type": "paragraph",
        "text": "Quando $\\frac{360^\\circ}{\\alpha}$ não é inteiro, ou quando o objeto não está posicionado simetricamente, o número de imagens pode depender da posição do objeto. Nesses casos, é preciso analisar a geometria com mais cuidado."
      }
    ]
  },
  {
    "title": "Exemplo resolvido: espelho plano",
    "rawTitle": "9.5 Exemplo resolvido: espelho plano",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Uma pessoa está a $2{,}0\\ \\mathrm{m}$ de um espelho plano. A que distância a imagem está da pessoa?"
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Em espelho plano, a distância da imagem ao espelho é igual à distância do objeto ao espelho:"
      },
      {
        "type": "formula",
        "formula": "d_i = d_o"
      },
      {
        "type": "paragraph",
        "text": "Como:"
      },
      {
        "type": "formula",
        "formula": "d_o = 2{,}0\\ \\mathrm{m}"
      },
      {
        "type": "paragraph",
        "text": "temos:"
      },
      {
        "type": "formula",
        "formula": "d_i = 2{,}0\\ \\mathrm{m}"
      },
      {
        "type": "paragraph",
        "text": "A distância entre pessoa e imagem é a soma da distância da pessoa ao espelho com a distância da imagem ao espelho:"
      },
      {
        "type": "formula",
        "formula": "D = d_o + d_i"
      },
      {
        "type": "formula",
        "formula": "D = 2{,}0 + 2{,}0"
      },
      {
        "type": "formula",
        "formula": "D = 4{,}0\\ \\mathrm{m}"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "A imagem está a:"
      },
      {
        "type": "formula",
        "formula": "D = 4{,}0\\ \\mathrm{m}"
      },
      {
        "type": "paragraph",
        "text": "da pessoa."
      },
      {
        "type": "subheading",
        "text": "Interpretação"
      },
      {
        "type": "paragraph",
        "text": "A imagem parece estar atrás do espelho à mesma distância que a pessoa está à frente. Por isso, a distância pessoa-imagem é o dobro da distância pessoa-espelho."
      }
    ]
  },
  {
    "title": "Exemplo resolvido: associação de espelhos planos",
    "rawTitle": "9.6 Exemplo resolvido: associação de espelhos planos",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Dois espelhos planos formam entre si um ângulo de $60^\\circ$. Um objeto é colocado entre eles, sobre a bissetriz do ângulo. Determine o número de imagens formadas."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Usamos:"
      },
      {
        "type": "formula",
        "formula": "N = \\frac{360^\\circ}{\\alpha} - 1"
      },
      {
        "type": "paragraph",
        "text": "Substituindo:"
      },
      {
        "type": "formula",
        "formula": "N = \\frac{360^\\circ}{60^\\circ} - 1"
      },
      {
        "type": "formula",
        "formula": "N = 6 - 1"
      },
      {
        "type": "formula",
        "formula": "N = 5"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "São formadas:"
      },
      {
        "type": "formula",
        "formula": "N = 5"
      },
      {
        "type": "paragraph",
        "text": "imagens."
      },
      {
        "type": "subheading",
        "text": "Interpretação"
      },
      {
        "type": "paragraph",
        "text": "Quanto menor o ângulo entre os espelhos, maior tende a ser o número de imagens. Espelhos quase paralelos produzem muitas imagens sucessivas."
      }
    ]
  },
  {
    "title": "Espelhos esféricos",
    "rawTitle": "10. Espelhos esféricos",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Espelhos esféricos são espelhos cuja superfície refletora corresponde a uma parte de uma superfície esférica."
      },
      {
        "type": "paragraph",
        "text": "Eles podem ser côncavos ou convexos."
      }
    ]
  },
  {
    "title": "Espelho côncavo",
    "rawTitle": "10.1 Espelho côncavo",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Um espelho côncavo tem a superfície refletora voltada para o lado interno da esfera."
      },
      {
        "type": "paragraph",
        "text": "Ele pode concentrar raios luminosos paralelos ao eixo principal, fazendo-os convergir para uma região próxima ao foco."
      },
      {
        "type": "paragraph",
        "text": "Por isso, o espelho côncavo é chamado de espelho convergente."
      },
      {
        "type": "paragraph",
        "text": "Ele pode formar imagens reais ou virtuais, direitas ou invertidas, maiores, menores ou iguais, dependendo da posição do objeto."
      }
    ]
  },
  {
    "title": "Espelho convexo",
    "rawTitle": "10.2 Espelho convexo",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Um espelho convexo tem a superfície refletora voltada para o lado externo da esfera."
      },
      {
        "type": "paragraph",
        "text": "Ele tende a espalhar os raios refletidos, como se viessem de um foco virtual atrás do espelho."
      },
      {
        "type": "paragraph",
        "text": "Por isso, o espelho convexo é chamado de espelho divergente."
      },
      {
        "type": "paragraph",
        "text": "Ele sempre forma imagem virtual, direita e menor que o objeto."
      }
    ]
  },
  {
    "title": "Elementos dos espelhos esféricos",
    "rawTitle": "10.3 Elementos dos espelhos esféricos",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Vértice"
      },
      {
        "type": "paragraph",
        "text": "O vértice $V$ é o ponto central da superfície refletora."
      },
      {
        "type": "subheading",
        "text": "Centro de curvatura"
      },
      {
        "type": "paragraph",
        "text": "O centro de curvatura $C$ é o centro da esfera da qual o espelho faz parte."
      },
      {
        "type": "subheading",
        "text": "Raio de curvatura"
      },
      {
        "type": "paragraph",
        "text": "O raio de curvatura $R$ é a distância entre o vértice e o centro de curvatura."
      },
      {
        "type": "subheading",
        "text": "Eixo principal"
      },
      {
        "type": "paragraph",
        "text": "O eixo principal é a reta que passa pelo vértice e pelo centro de curvatura."
      },
      {
        "type": "subheading",
        "text": "Foco"
      },
      {
        "type": "paragraph",
        "text": "O foco $F$ é o ponto para onde convergem, ou de onde parecem divergir, os raios que incidem paralelamente ao eixo principal."
      },
      {
        "type": "paragraph",
        "text": "No espelho côncavo, o foco é real e fica na frente do espelho."
      },
      {
        "type": "paragraph",
        "text": "No espelho convexo, o foco é virtual e fica atrás do espelho."
      },
      {
        "type": "subheading",
        "text": "Distância focal"
      },
      {
        "type": "paragraph",
        "text": "A distância focal $f$ é a distância entre o vértice e o foco."
      },
      {
        "type": "paragraph",
        "text": "Para espelhos esféricos de pequena abertura, vale:"
      },
      {
        "type": "formula",
        "formula": "f = \\frac{R}{2}"
      },
      {
        "type": "paragraph",
        "text": "Essa relação é válida dentro da aproximação paraxial, isto é, para raios próximos ao eixo principal e formando pequenos ângulos."
      }
    ]
  },
  {
    "title": "Significado físico do foco",
    "rawTitle": "10.4 Significado físico do foco",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "O foco é um ponto essencial porque indica como o espelho modifica feixes de luz paralelos ao eixo principal."
      },
      {
        "type": "paragraph",
        "text": "No espelho côncavo, raios paralelos ao eixo principal refletem e passam pelo foco. Por isso, ele pode concentrar luz e calor. Essa propriedade aparece em espelhos solares, refletores e telescópios."
      },
      {
        "type": "paragraph",
        "text": "No espelho convexo, raios paralelos refletem divergindo. Seus prolongamentos parecem vir do foco atrás do espelho. Por isso, o foco é virtual."
      }
    ]
  },
  {
    "title": "Raios notáveis em espelhos esféricos",
    "rawTitle": "11. Raios notáveis em espelhos esféricos",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A construção de imagens em espelhos esféricos é feita com raios notáveis. Eles são chamados de notáveis porque têm trajetórias fáceis de prever."
      }
    ]
  },
  {
    "title": "Raio paralelo ao eixo principal",
    "rawTitle": "11.1 Raio paralelo ao eixo principal",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Todo raio que incide paralelamente ao eixo principal reflete passando pelo foco, no caso do espelho côncavo."
      },
      {
        "type": "paragraph",
        "text": "No espelho convexo, o raio reflete divergindo de modo que seu prolongamento passa pelo foco virtual."
      }
    ]
  },
  {
    "title": "Raio que passa pelo foco",
    "rawTitle": "11.2 Raio que passa pelo foco",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Todo raio que passa pelo foco antes de incidir no espelho reflete paralelamente ao eixo principal."
      },
      {
        "type": "paragraph",
        "text": "No espelho convexo, usamos o prolongamento em direção ao foco virtual."
      },
      {
        "type": "paragraph",
        "text": "Esse raio é o inverso do raio paralelo, por causa do princípio da reversibilidade dos raios luminosos."
      }
    ]
  },
  {
    "title": "Raio que passa pelo centro de curvatura",
    "rawTitle": "11.3 Raio que passa pelo centro de curvatura",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Todo raio que passa pelo centro de curvatura incide perpendicularmente à superfície do espelho."
      },
      {
        "type": "paragraph",
        "text": "Isso acontece porque o raio da esfera é perpendicular à superfície esférica no ponto de incidência."
      },
      {
        "type": "paragraph",
        "text": "Se o raio incide perpendicularmente, ele reflete sobre si mesmo."
      }
    ]
  },
  {
    "title": "Raio que incide no vértice",
    "rawTitle": "11.4 Raio que incide no vértice",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Um raio que incide no vértice reflete obedecendo à lei da reflexão, de maneira simétrica em relação ao eixo principal."
      },
      {
        "type": "paragraph",
        "text": "O ângulo de incidência é igual ao ângulo de reflexão."
      }
    ]
  },
  {
    "title": "Por que esses raios funcionam?",
    "rawTitle": "11.5 Por que esses raios funcionam?",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Esses raios são consequências geométricas das leis da reflexão e da geometria da esfera."
      },
      {
        "type": "paragraph",
        "text": "Eles não são “regras decoradas do além”. Cada um nasce da relação entre:"
      },
      {
        "type": "list",
        "items": [
          "eixo principal;",
          "foco;",
          "centro de curvatura;",
          "normal local;",
          "lei da reflexão."
        ]
      },
      {
        "type": "paragraph",
        "text": "Em prova, usar raios notáveis ajuda a prever se a imagem será real, virtual, direita, invertida, maior ou menor antes mesmo de usar fórmula."
      }
    ]
  },
  {
    "title": "Formação de imagens em espelhos côncavos",
    "rawTitle": "12. Formação de imagens em espelhos côncavos",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "O espelho côncavo é o mais rico em possibilidades. A imagem depende da posição do objeto em relação ao centro de curvatura $C$, ao foco $F$ e ao vértice $V$."
      }
    ]
  },
  {
    "title": "Objeto além do centro de curvatura",
    "rawTitle": "12.1 Objeto além do centro de curvatura",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Quando o objeto está além de $C$, a imagem se forma entre $C$ e $F$."
      },
      {
        "type": "paragraph",
        "text": "Características:"
      },
      {
        "type": "list",
        "items": [
          "real;",
          "invertida;",
          "menor que o objeto;",
          "formada na frente do espelho."
        ]
      },
      {
        "type": "paragraph",
        "text": "Interpretação: os raios refletidos se cruzam realmente na frente do espelho. Como a imagem é real, pode ser projetada em uma tela."
      }
    ]
  },
  {
    "title": "Objeto no centro de curvatura",
    "rawTitle": "12.2 Objeto no centro de curvatura",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Quando o objeto está em $C$, a imagem também se forma em $C$."
      },
      {
        "type": "paragraph",
        "text": "Características:"
      },
      {
        "type": "list",
        "items": [
          "real;",
          "invertida;",
          "mesmo tamanho que o objeto;",
          "formada na frente do espelho."
        ]
      },
      {
        "type": "paragraph",
        "text": "Esse caso é simétrico. O objeto e a imagem ficam à mesma distância do espelho."
      }
    ]
  },
  {
    "title": "Objeto entre o centro de curvatura e o foco",
    "rawTitle": "12.3 Objeto entre o centro de curvatura e o foco",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Quando o objeto está entre $C$ e $F$, a imagem se forma além de $C$."
      },
      {
        "type": "paragraph",
        "text": "Características:"
      },
      {
        "type": "list",
        "items": [
          "real;",
          "invertida;",
          "maior que o objeto;",
          "formada na frente do espelho."
        ]
      },
      {
        "type": "paragraph",
        "text": "Esse caso é usado para ampliar imagens reais. A imagem aumenta, mas fica invertida."
      }
    ]
  },
  {
    "title": "Objeto no foco",
    "rawTitle": "12.4 Objeto no foco",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Quando o objeto está no foco, os raios refletidos saem paralelos."
      },
      {
        "type": "paragraph",
        "text": "A imagem se forma no infinito."
      },
      {
        "type": "paragraph",
        "text": "Características:"
      },
      {
        "type": "list",
        "items": [
          "imagem no infinito;",
          "raios refletidos paralelos;",
          "não se forma imagem finita em uma tela comum."
        ]
      },
      {
        "type": "paragraph",
        "text": "Esse é um caso limite. Pela equação de Gauss:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{f} = \\frac{1}{p} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "se:"
      },
      {
        "type": "formula",
        "formula": "p = f"
      },
      {
        "type": "paragraph",
        "text": "então:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{f} = \\frac{1}{f} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = 0"
      },
      {
        "type": "paragraph",
        "text": "Isso indica:"
      },
      {
        "type": "formula",
        "formula": "p' \\to \\infty"
      }
    ]
  },
  {
    "title": "Objeto entre o foco e o vértice",
    "rawTitle": "12.5 Objeto entre o foco e o vértice",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Quando o objeto está entre $F$ e $V$, os raios refletidos divergem. Seus prolongamentos se encontram atrás do espelho."
      },
      {
        "type": "paragraph",
        "text": "Características:"
      },
      {
        "type": "list",
        "items": [
          "virtual;",
          "direita;",
          "maior que o objeto;",
          "formada atrás do espelho."
        ]
      },
      {
        "type": "paragraph",
        "text": "Esse é o caso do espelho de maquiagem ou espelho de dentista, quando usado com o objeto próximo. A imagem aparece ampliada e direita."
      }
    ]
  },
  {
    "title": "Tabela-resumo do espelho côncavo",
    "rawTitle": "12.6 Tabela-resumo do espelho côncavo",
    "group": "theory",
    "nodes": [
      {
        "type": "table",
        "headers": [
          "Posição do objeto",
          "Posição da imagem",
          "Natureza",
          "Orientação",
          "Tamanho"
        ],
        "rows": [
          [
            "Além de $C$",
            "Entre $C$ e $F$",
            "Real",
            "Invertida",
            "Menor"
          ],
          [
            "Em $C$",
            "Em $C$",
            "Real",
            "Invertida",
            "Igual"
          ],
          [
            "Entre $C$ e $F$",
            "Além de $C$",
            "Real",
            "Invertida",
            "Maior"
          ],
          [
            "Em $F$",
            "No infinito",
            "Imprópria",
            "-",
            "-"
          ],
          [
            "Entre $F$ e $V$",
            "Atrás do espelho",
            "Virtual",
            "Direita",
            "Maior"
          ]
        ]
      }
    ]
  },
  {
    "title": "Formação de imagens em espelhos convexos",
    "rawTitle": "13. Formação de imagens em espelhos convexos",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "O espelho convexo é mais simples que o côncavo."
      },
      {
        "type": "paragraph",
        "text": "Para qualquer posição real do objeto diante do espelho convexo, a imagem é sempre:"
      },
      {
        "type": "list",
        "items": [
          "virtual;",
          "direita;",
          "menor que o objeto;",
          "localizada atrás do espelho;",
          "formada entre o foco virtual e o vértice."
        ]
      },
      {
        "type": "paragraph",
        "text": "Isso acontece porque o espelho convexo é divergente. Os raios refletidos se afastam, e seus prolongamentos se encontram atrás do espelho."
      }
    ]
  },
  {
    "title": "Aplicações",
    "rawTitle": "13.1 Aplicações",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Espelhos convexos são usados em:"
      },
      {
        "type": "list",
        "items": [
          "retrovisores de veículos;",
          "espelhos de segurança em lojas;",
          "corredores;",
          "estacionamentos;",
          "esquinas com pouca visibilidade."
        ]
      },
      {
        "type": "paragraph",
        "text": "A vantagem do espelho convexo é ampliar o campo visual. Ele permite ver uma região maior."
      },
      {
        "type": "paragraph",
        "text": "A desvantagem é que as imagens aparecem menores e podem dar uma percepção enganosa de distância. Por isso, em retrovisores, é comum o aviso de que os objetos podem estar mais próximos do que parecem."
      }
    ]
  },
  {
    "title": "Equação dos espelhos esféricos",
    "rawTitle": "14. Equação dos espelhos esféricos",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A equação de Gauss para espelhos esféricos relaciona a distância focal, a distância do objeto e a distância da imagem:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{f} = \\frac{1}{p} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "Em que:"
      },
      {
        "type": "list",
        "items": [
          "$f$ é a distância focal;",
          "$p$ é a distância do objeto ao espelho;",
          "$p'$ é a distância da imagem ao espelho."
        ]
      },
      {
        "type": "paragraph",
        "text": "Essa equação é válida na aproximação paraxial."
      }
    ]
  },
  {
    "title": "Convenção de sinais",
    "rawTitle": "14.1 Convenção de sinais",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Uma convenção comum no Ensino Médio brasileiro é a convenção de Gauss:"
      },
      {
        "type": "list",
        "items": [
          "espelho côncavo: $f > 0$;",
          "espelho convexo: $f < 0$;",
          "objeto real diante do espelho: $p > 0$;",
          "imagem real diante do espelho: $p' > 0$;",
          "imagem virtual atrás do espelho: $p' < 0$."
        ]
      },
      {
        "type": "paragraph",
        "text": "Essa convenção precisa ser usada com coerência. Misturar convenções é a receita perfeita para transformar Óptica em numerologia."
      }
    ]
  },
  {
    "title": "Aumento linear transversal",
    "rawTitle": "14.2 Aumento linear transversal",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "O aumento linear transversal é:"
      },
      {
        "type": "formula",
        "formula": "A = \\frac{i}{o} = -\\frac{p'}{p}"
      },
      {
        "type": "paragraph",
        "text": "Em que:"
      },
      {
        "type": "list",
        "items": [
          "$A$ é o aumento linear transversal;",
          "$i$ é o tamanho da imagem;",
          "$o$ é o tamanho do objeto;",
          "$p'$ é a distância da imagem;",
          "$p$ é a distância do objeto."
        ]
      },
      {
        "type": "paragraph",
        "text": "O sinal de $A$ indica a orientação da imagem:"
      },
      {
        "type": "list",
        "items": [
          "$A > 0$: imagem direita;",
          "$A < 0$: imagem invertida."
        ]
      },
      {
        "type": "paragraph",
        "text": "O módulo de $A$ indica o tamanho relativo:"
      },
      {
        "type": "list",
        "items": [
          "$|A| > 1$: imagem maior que o objeto;",
          "$|A| = 1$: imagem do mesmo tamanho;",
          "$|A| < 1$: imagem menor que o objeto."
        ]
      }
    ]
  },
  {
    "title": "Exemplo resolvido: espelho côncavo",
    "rawTitle": "14.3 Exemplo resolvido: espelho côncavo",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Um objeto está a $30\\ \\mathrm{cm}$ de um espelho côncavo de distância focal $10\\ \\mathrm{cm}$. Determine a posição da imagem e suas características."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Dados:"
      },
      {
        "type": "formula",
        "formula": "p = 30\\ \\mathrm{cm}"
      },
      {
        "type": "formula",
        "formula": "f = 10\\ \\mathrm{cm}"
      },
      {
        "type": "paragraph",
        "text": "Usamos:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{f} = \\frac{1}{p} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "Substituindo:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{10} = \\frac{1}{30} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "Isolando:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = \\frac{1}{10} - \\frac{1}{30}"
      },
      {
        "type": "paragraph",
        "text": "MMC:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = \\frac{3}{30} - \\frac{1}{30}"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = \\frac{2}{30}"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = \\frac{1}{15}"
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "p' = 15\\ \\mathrm{cm}"
      },
      {
        "type": "paragraph",
        "text": "Agora calculamos o aumento:"
      },
      {
        "type": "formula",
        "formula": "A = -\\frac{p'}{p}"
      },
      {
        "type": "formula",
        "formula": "A = -\\frac{15}{30}"
      },
      {
        "type": "formula",
        "formula": "A = -0{,}5"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "A imagem está a:"
      },
      {
        "type": "formula",
        "formula": "p' = 15\\ \\mathrm{cm}"
      },
      {
        "type": "paragraph",
        "text": "na frente do espelho."
      },
      {
        "type": "paragraph",
        "text": "Como $p' > 0$, a imagem é real."
      },
      {
        "type": "paragraph",
        "text": "Como $A < 0$, a imagem é invertida."
      },
      {
        "type": "paragraph",
        "text": "Como $|A| = 0{,}5$, a imagem é menor que o objeto."
      },
      {
        "type": "subheading",
        "text": "Interpretação"
      },
      {
        "type": "paragraph",
        "text": "O objeto está além do centro de curvatura, pois $R = 2f = 20\\ \\mathrm{cm}$ e $p = 30\\ \\mathrm{cm}$. Portanto, a imagem deve ser real, invertida e menor, entre o foco e o centro. A conta confirmou a construção geométrica."
      }
    ]
  },
  {
    "title": "Exemplo resolvido: espelho convexo",
    "rawTitle": "14.4 Exemplo resolvido: espelho convexo",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Um objeto está a $20\\ \\mathrm{cm}$ de um espelho convexo cuja distância focal tem módulo $10\\ \\mathrm{cm}$. Determine a posição da imagem."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Para espelho convexo:"
      },
      {
        "type": "formula",
        "formula": "f = -10\\ \\mathrm{cm}"
      },
      {
        "type": "paragraph",
        "text": "Objeto real:"
      },
      {
        "type": "formula",
        "formula": "p = 20\\ \\mathrm{cm}"
      },
      {
        "type": "paragraph",
        "text": "Usamos:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{f} = \\frac{1}{p} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "Substituindo:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{-10} = \\frac{1}{20} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = -\\frac{1}{10} - \\frac{1}{20}"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = -\\frac{2}{20} - \\frac{1}{20}"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = -\\frac{3}{20}"
      },
      {
        "type": "paragraph",
        "text": "Assim:"
      },
      {
        "type": "formula",
        "formula": "p' = -\\frac{20}{3}\\ \\mathrm{cm}"
      },
      {
        "type": "formula",
        "formula": "p' \\approx -6{,}7\\ \\mathrm{cm}"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "A imagem está a aproximadamente:"
      },
      {
        "type": "formula",
        "formula": "p' \\approx -6{,}7\\ \\mathrm{cm}"
      },
      {
        "type": "paragraph",
        "text": "O sinal negativo indica que a imagem é virtual e está atrás do espelho."
      },
      {
        "type": "subheading",
        "text": "Interpretação"
      },
      {
        "type": "paragraph",
        "text": "Isso combina com a propriedade do espelho convexo: a imagem sempre é virtual, direita e menor."
      }
    ]
  },
  {
    "title": "Refração da luz",
    "rawTitle": "15. Refração da luz",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Refração é o fenômeno em que a luz passa de um meio para outro e sofre mudança de velocidade."
      },
      {
        "type": "paragraph",
        "text": "Quando a incidência é oblíqua, isto é, quando o raio não incide perpendicularmente à superfície de separação, essa mudança de velocidade geralmente provoca mudança de direção."
      },
      {
        "type": "paragraph",
        "text": "Exemplos cotidianos:"
      },
      {
        "type": "list",
        "items": [
          "um lápis parece quebrado dentro de um copo com água;",
          "o fundo de uma piscina parece mais raso;",
          "lentes desviam raios luminosos;",
          "prismas decompõem luz branca;",
          "miragens ocorrem na atmosfera;",
          "fibras ópticas guiam luz."
        ]
      }
    ]
  },
  {
    "title": "Índice de refração absoluto",
    "rawTitle": "15.1 Índice de refração absoluto",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "O índice de refração absoluto de um meio é definido por:"
      },
      {
        "type": "formula",
        "formula": "n = \\frac{c}{v}"
      },
      {
        "type": "paragraph",
        "text": "Em que:"
      },
      {
        "type": "list",
        "items": [
          "$n$ é o índice de refração;",
          "$c$ é a velocidade da luz no vácuo;",
          "$v$ é a velocidade da luz no meio."
        ]
      },
      {
        "type": "paragraph",
        "text": "Como a luz se propaga mais lentamente em meios materiais comuns do que no vácuo, normalmente:"
      },
      {
        "type": "formula",
        "formula": "n \\geq 1"
      },
      {
        "type": "paragraph",
        "text": "Quanto maior o índice de refração, menor a velocidade da luz no meio."
      },
      {
        "type": "paragraph",
        "text": "Isso vem diretamente da fórmula:"
      },
      {
        "type": "formula",
        "formula": "n = \\frac{c}{v}"
      },
      {
        "type": "paragraph",
        "text": "Se $v$ diminui, $n$ aumenta."
      },
      {
        "type": "paragraph",
        "text": "Meios com maior índice de refração são chamados mais refringentes."
      },
      {
        "type": "paragraph",
        "text": "Meios com menor índice são menos refringentes."
      }
    ]
  },
  {
    "title": "Frequência, velocidade e comprimento de onda na refração",
    "rawTitle": "15.2 Frequência, velocidade e comprimento de onda na refração",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Quando a luz passa de um meio para outro:"
      },
      {
        "type": "list",
        "items": [
          "a frequência permanece constante;",
          "a velocidade muda;",
          "o comprimento de onda muda."
        ]
      },
      {
        "type": "paragraph",
        "text": "A frequência é determinada pela fonte."
      },
      {
        "type": "paragraph",
        "text": "Como:"
      },
      {
        "type": "formula",
        "formula": "v = \\lambda f"
      },
      {
        "type": "paragraph",
        "text": "se $f$ permanece constante e $v$ muda, então $\\lambda$ também deve mudar."
      },
      {
        "type": "paragraph",
        "text": "Se a luz entra em um meio mais refringente, sua velocidade diminui e seu comprimento de onda diminui."
      },
      {
        "type": "paragraph",
        "text": "Se entra em um meio menos refringente, sua velocidade aumenta e seu comprimento de onda aumenta."
      }
    ]
  },
  {
    "title": "Lei de Snell-Descartes",
    "rawTitle": "16. Lei de Snell-Descartes",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A Lei de Snell-Descartes relaciona os ângulos de incidência e refração com os índices de refração dos meios."
      },
      {
        "type": "paragraph",
        "text": "A fórmula é:"
      },
      {
        "type": "formula",
        "formula": "n_1 \\sin i = n_2 \\sin r"
      },
      {
        "type": "paragraph",
        "text": "Em que:"
      },
      {
        "type": "list",
        "items": [
          "$n_1$ é o índice de refração do meio de incidência;",
          "$n_2$ é o índice de refração do meio de refração;",
          "$i$ é o ângulo de incidência;",
          "$r$ é o ângulo de refração."
        ]
      },
      {
        "type": "paragraph",
        "text": "Os ângulos $i$ e $r$ são medidos em relação à normal, nunca em relação à superfície."
      }
    ]
  },
  {
    "title": "Meio menos refringente para mais refringente",
    "rawTitle": "16.1 Meio menos refringente para mais refringente",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Se a luz passa de um meio menos refringente para um mais refringente, então:"
      },
      {
        "type": "formula",
        "formula": "n_2 > n_1"
      },
      {
        "type": "paragraph",
        "text": "Pela Lei de Snell:"
      },
      {
        "type": "formula",
        "formula": "n_1 \\sin i = n_2 \\sin r"
      },
      {
        "type": "paragraph",
        "text": "Como $n_2$ é maior, $\\sin r$ deve ser menor que $\\sin i$."
      },
      {
        "type": "paragraph",
        "text": "Para ângulos entre $0^\\circ$ e $90^\\circ$, seno menor significa ângulo menor."
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "r < i"
      },
      {
        "type": "paragraph",
        "text": "O raio se aproxima da normal."
      },
      {
        "type": "paragraph",
        "text": "Exemplo: luz passando do ar para a água."
      }
    ]
  },
  {
    "title": "Meio mais refringente para menos refringente",
    "rawTitle": "16.2 Meio mais refringente para menos refringente",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Se a luz passa de um meio mais refringente para um menos refringente, então:"
      },
      {
        "type": "formula",
        "formula": "n_2 < n_1"
      },
      {
        "type": "paragraph",
        "text": "Pela Lei de Snell:"
      },
      {
        "type": "formula",
        "formula": "n_1 \\sin i = n_2 \\sin r"
      },
      {
        "type": "paragraph",
        "text": "Como $n_2$ é menor, $\\sin r$ deve ser maior que $\\sin i$."
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "r > i"
      },
      {
        "type": "paragraph",
        "text": "O raio se afasta da normal."
      },
      {
        "type": "paragraph",
        "text": "Exemplo: luz passando da água para o ar."
      }
    ]
  },
  {
    "title": "Incidência normal",
    "rawTitle": "16.3 Incidência normal",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Se o raio incide perpendicularmente à superfície, então:"
      },
      {
        "type": "formula",
        "formula": "i = 0^\\circ"
      },
      {
        "type": "paragraph",
        "text": "Pela Lei de Snell:"
      },
      {
        "type": "formula",
        "formula": "n_1 \\sin 0^\\circ = n_2 \\sin r"
      },
      {
        "type": "paragraph",
        "text": "Como:"
      },
      {
        "type": "formula",
        "formula": "\\sin 0^\\circ = 0"
      },
      {
        "type": "paragraph",
        "text": "temos:"
      },
      {
        "type": "formula",
        "formula": "0 = n_2 \\sin r"
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "\\sin r = 0"
      },
      {
        "type": "paragraph",
        "text": "Então:"
      },
      {
        "type": "formula",
        "formula": "r = 0^\\circ"
      },
      {
        "type": "paragraph",
        "text": "Portanto, na incidência normal, a luz não sofre desvio de direção. Ela muda de velocidade, mas não muda de direção."
      }
    ]
  },
  {
    "title": "Exemplo resolvido: Lei de Snell",
    "rawTitle": "16.4 Exemplo resolvido: Lei de Snell",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Um raio de luz passa do ar para a água. Considere $n_{\\text{ar}} = 1{,}0$, $n_{\\text{água}} = 1{,}33$ e ângulo de incidência $i = 30^\\circ$. Determine o seno do ângulo de refração."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Usamos:"
      },
      {
        "type": "formula",
        "formula": "n_1 \\sin i = n_2 \\sin r"
      },
      {
        "type": "paragraph",
        "text": "Substituindo:"
      },
      {
        "type": "formula",
        "formula": "1{,}0 \\cdot \\sin 30^\\circ = 1{,}33 \\sin r"
      },
      {
        "type": "paragraph",
        "text": "Como:"
      },
      {
        "type": "formula",
        "formula": "\\sin 30^\\circ = 0{,}5"
      },
      {
        "type": "paragraph",
        "text": "temos:"
      },
      {
        "type": "formula",
        "formula": "0{,}5 = 1{,}33 \\sin r"
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "\\sin r = \\frac{0{,}5}{1{,}33}"
      },
      {
        "type": "formula",
        "formula": "\\sin r \\approx 0{,}376"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "formula",
        "formula": "\\sin r \\approx 0{,}376"
      },
      {
        "type": "paragraph",
        "text": "Como a luz passou do ar para a água, o raio se aproxima da normal."
      },
      {
        "type": "subheading",
        "text": "Interpretação"
      },
      {
        "type": "paragraph",
        "text": "A água tem índice maior que o ar. Portanto, a luz fica mais lenta e se aproxima da normal."
      }
    ]
  },
  {
    "title": "Reflexão total",
    "rawTitle": "17. Reflexão total",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Reflexão total é o fenômeno em que a luz, ao tentar passar de um meio mais refringente para um menos refringente, não consegue emergir e é totalmente refletida de volta para o meio de origem."
      },
      {
        "type": "paragraph",
        "text": "Esse fenômeno só ocorre quando duas condições são satisfeitas:"
      },
      {
        "type": "list",
        "items": [
          "a luz passa do meio mais refringente para o menos refringente;",
          "o ângulo de incidência é maior que o ângulo limite."
        ]
      }
    ]
  },
  {
    "title": "Ângulo limite",
    "rawTitle": "17.1 Ângulo limite",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "O ângulo limite $L$ é o ângulo de incidência para o qual o raio refratado emerge rasante à superfície, isto é:"
      },
      {
        "type": "formula",
        "formula": "r = 90^\\circ"
      },
      {
        "type": "paragraph",
        "text": "Pela Lei de Snell:"
      },
      {
        "type": "formula",
        "formula": "n_1 \\sin L = n_2 \\sin 90^\\circ"
      },
      {
        "type": "paragraph",
        "text": "Como:"
      },
      {
        "type": "formula",
        "formula": "\\sin 90^\\circ = 1"
      },
      {
        "type": "paragraph",
        "text": "temos:"
      },
      {
        "type": "formula",
        "formula": "n_1 \\sin L = n_2"
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "\\sin L = \\frac{n_2}{n_1}"
      },
      {
        "type": "paragraph",
        "text": "com:"
      },
      {
        "type": "formula",
        "formula": "n_1 > n_2"
      },
      {
        "type": "paragraph",
        "text": "Essa fórmula só faz sentido quando a luz está indo do meio mais refringente para o menos refringente."
      }
    ]
  },
  {
    "title": "Condições para reflexão total",
    "rawTitle": "17.2 Condições para reflexão total",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Para ocorrer reflexão total:"
      },
      {
        "type": "formula",
        "formula": "n_1 > n_2"
      },
      {
        "type": "paragraph",
        "text": "e:"
      },
      {
        "type": "formula",
        "formula": "i > L"
      },
      {
        "type": "paragraph",
        "text": "Se:"
      },
      {
        "type": "formula",
        "formula": "i = L"
      },
      {
        "type": "paragraph",
        "text": "o raio emerge rasante."
      },
      {
        "type": "paragraph",
        "text": "Se:"
      },
      {
        "type": "formula",
        "formula": "i < L"
      },
      {
        "type": "paragraph",
        "text": "ocorre refração."
      },
      {
        "type": "paragraph",
        "text": "Se:"
      },
      {
        "type": "formula",
        "formula": "i > L"
      },
      {
        "type": "paragraph",
        "text": "ocorre reflexão total."
      }
    ]
  },
  {
    "title": "Aplicações",
    "rawTitle": "17.3 Aplicações",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Fibra óptica"
      },
      {
        "type": "paragraph",
        "text": "Na fibra óptica, a luz sofre sucessivas reflexões totais internas, propagando-se ao longo do fio mesmo quando ele se curva."
      },
      {
        "type": "paragraph",
        "text": "Isso permite transmissão de informação por grandes distâncias com baixa perda."
      },
      {
        "type": "subheading",
        "text": "Prismas"
      },
      {
        "type": "paragraph",
        "text": "Prismas podem ser usados para refletir luz por reflexão total em instrumentos ópticos."
      },
      {
        "type": "subheading",
        "text": "Brilho de diamantes"
      },
      {
        "type": "paragraph",
        "text": "O diamante tem alto índice de refração. Isso favorece reflexões internas e dispersão, contribuindo para seu brilho característico."
      },
      {
        "type": "subheading",
        "text": "Miragens"
      },
      {
        "type": "paragraph",
        "text": "Miragens envolvem variações do índice de refração do ar com a temperatura. Em algumas condições, raios luminosos sofrem desvios contínuos e podem produzir imagens aparentes."
      }
    ]
  },
  {
    "title": "Exemplo resolvido: ângulo limite",
    "rawTitle": "17.4 Exemplo resolvido: ângulo limite",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Um raio de luz se propaga na água, cujo índice de refração é $n_1 = 1{,}33$, e tenta passar para o ar, cujo índice é $n_2 = 1{,}0$. Determine o seno do ângulo limite."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Usamos:"
      },
      {
        "type": "formula",
        "formula": "\\sin L = \\frac{n_2}{n_1}"
      },
      {
        "type": "paragraph",
        "text": "Substituindo:"
      },
      {
        "type": "formula",
        "formula": "\\sin L = \\frac{1{,}0}{1{,}33}"
      },
      {
        "type": "formula",
        "formula": "\\sin L \\approx 0{,}752"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "formula",
        "formula": "\\sin L \\approx 0{,}752"
      },
      {
        "type": "subheading",
        "text": "Interpretação"
      },
      {
        "type": "paragraph",
        "text": "Se a luz incidir da água para o ar com ângulo maior que $L$, ocorrerá reflexão total. Se incidir com ângulo menor, haverá refração."
      }
    ]
  },
  {
    "title": "Dioptro plano e profundidade aparente",
    "rawTitle": "18. Dioptro plano e profundidade aparente",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Dioptro é uma superfície de separação entre dois meios transparentes com índices de refração diferentes."
      },
      {
        "type": "paragraph",
        "text": "Um dioptro plano é uma interface plana, como a superfície tranquila entre água e ar."
      },
      {
        "type": "paragraph",
        "text": "Esse tema explica por que objetos dentro da água parecem estar mais rasos do que realmente estão."
      }
    ]
  },
  {
    "title": "Profundidade aparente",
    "rawTitle": "18.1 Profundidade aparente",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Quando olhamos quase perpendicularmente para um objeto submerso, os raios de luz que saem do objeto passam da água para o ar. Ao sair da água, eles se afastam da normal."
      },
      {
        "type": "paragraph",
        "text": "O olho prolonga os raios refratados em linha reta para trás e interpreta que o objeto está em uma posição mais próxima da superfície."
      },
      {
        "type": "paragraph",
        "text": "Por isso, o objeto parece menos profundo."
      },
      {
        "type": "paragraph",
        "text": "Para observação quase normal, vale:"
      },
      {
        "type": "formula",
        "formula": "\\frac{h'}{h} = \\frac{n_{\\text{observador}}}{n_{\\text{objeto}}}"
      },
      {
        "type": "paragraph",
        "text": "Em que:"
      },
      {
        "type": "list",
        "items": [
          "$h'$ é a profundidade aparente;",
          "$h$ é a profundidade real;",
          "$n_{\\text{observador}}$ é o índice do meio onde está o observador;",
          "$n_{\\text{objeto}}$ é o índice do meio onde está o objeto."
        ]
      },
      {
        "type": "paragraph",
        "text": "Se o observador está no ar e o objeto na água:"
      },
      {
        "type": "formula",
        "formula": "\\frac{h'}{h} = \\frac{n_{\\text{ar}}}{n_{\\text{água}}}"
      },
      {
        "type": "paragraph",
        "text": "Como:"
      },
      {
        "type": "formula",
        "formula": "n_{\\text{ar}} < n_{\\text{água}}"
      },
      {
        "type": "paragraph",
        "text": "temos:"
      },
      {
        "type": "formula",
        "formula": "h' < h"
      },
      {
        "type": "paragraph",
        "text": "O objeto parece mais raso."
      }
    ]
  },
  {
    "title": "Exemplo resolvido: profundidade aparente",
    "rawTitle": "18.2 Exemplo resolvido: profundidade aparente",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Um peixe está a $2{,}0\\ \\mathrm{m}$ de profundidade em um lago. Um observador no ar olha quase perpendicularmente para a superfície. Considere $n_{\\text{ar}} = 1{,}0$ e $n_{\\text{água}} = 1{,}33$. Determine a profundidade aparente do peixe."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Usamos:"
      },
      {
        "type": "formula",
        "formula": "\\frac{h'}{h} = \\frac{n_{\\text{observador}}}{n_{\\text{objeto}}}"
      },
      {
        "type": "paragraph",
        "text": "Substituindo:"
      },
      {
        "type": "formula",
        "formula": "\\frac{h'}{2{,}0} = \\frac{1{,}0}{1{,}33}"
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "h' = 2{,}0 \\cdot \\frac{1{,}0}{1{,}33}"
      },
      {
        "type": "formula",
        "formula": "h' \\approx 1{,}50\\ \\mathrm{m}"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "A profundidade aparente é aproximadamente:"
      },
      {
        "type": "formula",
        "formula": "h' \\approx 1{,}50\\ \\mathrm{m}"
      },
      {
        "type": "subheading",
        "text": "Interpretação"
      },
      {
        "type": "paragraph",
        "text": "O peixe está a $2{,}0\\ \\mathrm{m}$ de profundidade real, mas parece estar a apenas $1{,}50\\ \\mathrm{m}$. É por isso que tentar pegar algo dentro da água mirando diretamente na posição aparente dá errado."
      }
    ]
  },
  {
    "title": "Lâmina de faces paralelas",
    "rawTitle": "19. Lâmina de faces paralelas",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Uma lâmina de faces paralelas é um meio transparente limitado por duas superfícies planas e paralelas."
      },
      {
        "type": "paragraph",
        "text": "Exemplos:"
      },
      {
        "type": "list",
        "items": [
          "placa de vidro;",
          "janela;",
          "lâmina de acrílico;",
          "parede de aquário."
        ]
      },
      {
        "type": "paragraph",
        "text": "Quando um raio atravessa uma lâmina de faces paralelas, ele sofre refração ao entrar e ao sair."
      },
      {
        "type": "paragraph",
        "text": "Como as faces são paralelas, o raio emergente sai paralelo ao raio incidente, desde que o meio externo seja o mesmo nos dois lados."
      },
      {
        "type": "paragraph",
        "text": "Porém, o raio sofre um deslocamento lateral."
      }
    ]
  },
  {
    "title": "Desvio lateral",
    "rawTitle": "19.1 Desvio lateral",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "O desvio lateral $d$ é a distância entre a direção original do raio incidente e a direção paralela do raio emergente."
      },
      {
        "type": "paragraph",
        "text": "Uma expressão usada para o desvio lateral é:"
      },
      {
        "type": "formula",
        "formula": "d = e \\frac{\\sin(i-r)}{\\cos r}"
      },
      {
        "type": "paragraph",
        "text": "Em que:"
      },
      {
        "type": "list",
        "items": [
          "$d$ é o desvio lateral;",
          "$e$ é a espessura da lâmina;",
          "$i$ é o ângulo de incidência;",
          "$r$ é o ângulo de refração dentro da lâmina."
        ]
      },
      {
        "type": "paragraph",
        "text": "Essa fórmula mostra que o desvio depende da espessura da lâmina e dos ângulos envolvidos."
      },
      {
        "type": "paragraph",
        "text": "Se a incidência for normal:"
      },
      {
        "type": "formula",
        "formula": "i = 0^\\circ"
      },
      {
        "type": "paragraph",
        "text": "então:"
      },
      {
        "type": "formula",
        "formula": "r = 0^\\circ"
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "\\sin(i-r) = \\sin 0^\\circ = 0"
      },
      {
        "type": "paragraph",
        "text": "Assim:"
      },
      {
        "type": "formula",
        "formula": "d = 0"
      },
      {
        "type": "paragraph",
        "text": "Na incidência normal, não há desvio lateral."
      }
    ]
  },
  {
    "title": "Interpretação física",
    "rawTitle": "19.2 Interpretação física",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Na primeira face, o raio muda de direção ao entrar no material."
      },
      {
        "type": "paragraph",
        "text": "Na segunda face, como a superfície é paralela à primeira, o raio muda de direção novamente e sai paralelo ao raio original."
      },
      {
        "type": "paragraph",
        "text": "O resultado é que a direção final é a mesma, mas a trajetória foi deslocada lateralmente."
      },
      {
        "type": "paragraph",
        "text": "Esse fenômeno explica por que objetos vistos através de um vidro espesso podem parecer ligeiramente deslocados."
      }
    ]
  },
  {
    "title": "Prismas ópticos",
    "rawTitle": "20. Prismas ópticos",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Um prisma óptico é um corpo transparente limitado por superfícies planas não paralelas, geralmente formando um ângulo entre si."
      },
      {
        "type": "paragraph",
        "text": "Quando a luz atravessa um prisma, ela sofre refração ao entrar e ao sair. Como as faces não são paralelas, o raio emergente não sai paralelo ao incidente. Ele sofre um desvio angular."
      }
    ]
  },
  {
    "title": "Elementos do prisma",
    "rawTitle": "20.1 Elementos do prisma",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Ângulo do prisma"
      },
      {
        "type": "paragraph",
        "text": "É o ângulo entre as faces refratoras do prisma. Costuma ser representado por $A$."
      },
      {
        "type": "subheading",
        "text": "Desvio angular"
      },
      {
        "type": "paragraph",
        "text": "É o ângulo entre a direção original do raio incidente e a direção do raio emergente. Costuma ser representado por $\\delta$."
      },
      {
        "type": "subheading",
        "text": "Desvio mínimo"
      },
      {
        "type": "paragraph",
        "text": "Para certa posição do prisma, o desvio angular assume valor mínimo. Essa condição é importante em estudos mais avançados de prismas."
      },
      {
        "type": "subheading",
        "text": "Dispersão luminosa"
      },
      {
        "type": "paragraph",
        "text": "Dispersão é a decomposição da luz branca em suas cores componentes."
      },
      {
        "type": "paragraph",
        "text": "Ela ocorre porque o índice de refração do material depende da frequência da luz. Assim, diferentes cores se propagam com velocidades diferentes dentro do prisma e sofrem desvios diferentes."
      }
    ]
  },
  {
    "title": "Por que a luz branca se decompõe?",
    "rawTitle": "20.2 Por que a luz branca se decompõe?",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A luz branca é uma mistura de várias frequências visíveis."
      },
      {
        "type": "paragraph",
        "text": "Em um prisma de vidro, cada cor tem um índice de refração ligeiramente diferente. Em meios comuns:"
      },
      {
        "type": "list",
        "items": [
          "o violeta costuma ter maior índice de refração;",
          "o vermelho costuma ter menor índice de refração."
        ]
      },
      {
        "type": "paragraph",
        "text": "Como maior índice significa menor velocidade no meio e maior desvio na refração, o violeta sofre maior desvio que o vermelho."
      },
      {
        "type": "paragraph",
        "text": "Assim, ao atravessar o prisma, a luz branca se abre em um espectro colorido."
      },
      {
        "type": "paragraph",
        "text": "A ordem típica do menor para o maior desvio é:"
      },
      {
        "type": "formula",
        "formula": "\\text{vermelho} \\to \\text{laranja} \\to \\text{amarelo} \\to \\text{verde} \\to \\text{azul} \\to \\text{violeta}"
      },
      {
        "type": "paragraph",
        "text": "O vermelho desvia menos."
      },
      {
        "type": "paragraph",
        "text": "O violeta desvia mais."
      }
    ]
  },
  {
    "title": "Lentes esféricas",
    "rawTitle": "21. Lentes esféricas",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Lentes esféricas são meios transparentes limitados por duas superfícies, das quais pelo menos uma é esférica."
      },
      {
        "type": "paragraph",
        "text": "Elas desviam a luz por refração e podem formar imagens."
      },
      {
        "type": "paragraph",
        "text": "As lentes podem ser convergentes ou divergentes."
      }
    ]
  },
  {
    "title": "Lentes convergentes",
    "rawTitle": "21.1 Lentes convergentes",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Uma lente convergente tende a fazer raios paralelos ao eixo principal convergirem para um foco real."
      },
      {
        "type": "paragraph",
        "text": "Em geral, no ar, lentes mais espessas no centro que nas bordas são convergentes."
      },
      {
        "type": "paragraph",
        "text": "Exemplos:"
      },
      {
        "type": "list",
        "items": [
          "biconvexa;",
          "plano-convexa;",
          "côncavo-convexa, dependendo das curvaturas."
        ]
      },
      {
        "type": "paragraph",
        "text": "A lente convergente pode formar imagens reais ou virtuais, dependendo da posição do objeto."
      }
    ]
  },
  {
    "title": "Lentes divergentes",
    "rawTitle": "21.2 Lentes divergentes",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Uma lente divergente tende a fazer raios paralelos ao eixo principal divergirem como se viessem de um foco virtual."
      },
      {
        "type": "paragraph",
        "text": "Em geral, no ar, lentes mais finas no centro que nas bordas são divergentes."
      },
      {
        "type": "paragraph",
        "text": "Exemplos:"
      },
      {
        "type": "list",
        "items": [
          "bicôncava;",
          "plano-côncava;",
          "convexo-côncava, dependendo das curvaturas."
        ]
      },
      {
        "type": "paragraph",
        "text": "A lente divergente, para objeto real, forma sempre imagem virtual, direita e menor."
      }
    ]
  },
  {
    "title": "Tipos principais de lentes",
    "rawTitle": "21.3 Tipos principais de lentes",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Biconvexa"
      },
      {
        "type": "paragraph",
        "text": "Possui duas faces convexas. Normalmente é convergente no ar."
      },
      {
        "type": "subheading",
        "text": "Plano-convexa"
      },
      {
        "type": "paragraph",
        "text": "Possui uma face plana e outra convexa. Normalmente é convergente no ar."
      },
      {
        "type": "subheading",
        "text": "Côncavo-convexa"
      },
      {
        "type": "paragraph",
        "text": "Possui uma face côncava e outra convexa. Pode ser convergente ou divergente dependendo das curvaturas."
      },
      {
        "type": "subheading",
        "text": "Bicôncava"
      },
      {
        "type": "paragraph",
        "text": "Possui duas faces côncavas. Normalmente é divergente no ar."
      },
      {
        "type": "subheading",
        "text": "Plano-côncava"
      },
      {
        "type": "paragraph",
        "text": "Possui uma face plana e outra côncava. Normalmente é divergente no ar."
      },
      {
        "type": "subheading",
        "text": "Convexo-côncava"
      },
      {
        "type": "paragraph",
        "text": "Possui uma face convexa e outra côncava. Pode ser convergente ou divergente dependendo das curvaturas."
      }
    ]
  },
  {
    "title": "Como as lentes desviam a luz?",
    "rawTitle": "21.4 Como as lentes desviam a luz?",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "As lentes desviam luz por refração."
      },
      {
        "type": "paragraph",
        "text": "Quando um raio entra na lente, ele muda de velocidade e pode mudar de direção. Ao sair da lente, muda novamente de meio e sofre nova refração."
      },
      {
        "type": "paragraph",
        "text": "O efeito combinado das duas refrações faz com que o raio seja desviado."
      },
      {
        "type": "paragraph",
        "text": "Na lente convergente, o conjunto das refrações aproxima os raios do eixo principal."
      },
      {
        "type": "paragraph",
        "text": "Na lente divergente, o conjunto das refrações afasta os raios do eixo principal."
      }
    ]
  },
  {
    "title": "Elementos das lentes",
    "rawTitle": "22. Elementos das lentes",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Centro óptico"
      },
      {
        "type": "paragraph",
        "text": "É o ponto da lente pelo qual um raio luminoso atravessa sem sofrer desvio angular apreciável, na aproximação de lentes delgadas."
      },
      {
        "type": "subheading",
        "text": "Eixo principal"
      },
      {
        "type": "paragraph",
        "text": "É a reta que passa pelo centro óptico e pelos centros de curvatura das faces da lente."
      },
      {
        "type": "subheading",
        "text": "Foco imagem"
      },
      {
        "type": "paragraph",
        "text": "É o ponto onde convergem, ou de onde parecem divergir, raios que incidem paralelamente ao eixo principal."
      },
      {
        "type": "paragraph",
        "text": "Na lente convergente, o foco imagem é real."
      },
      {
        "type": "paragraph",
        "text": "Na lente divergente, o foco imagem é virtual."
      },
      {
        "type": "subheading",
        "text": "Foco objeto"
      },
      {
        "type": "paragraph",
        "text": "É o ponto associado ao caminho inverso dos raios. Um raio que passa pelo foco objeto, no caso da lente convergente, emerge paralelo ao eixo principal."
      },
      {
        "type": "subheading",
        "text": "Distância focal"
      },
      {
        "type": "paragraph",
        "text": "É a distância entre o centro óptico e o foco."
      },
      {
        "type": "subheading",
        "text": "Pontos antiprincipais"
      },
      {
        "type": "paragraph",
        "text": "São pontos localizados a uma distância $2f$ do centro óptico, um de cada lado da lente. Eles são úteis na construção de imagens, especialmente em lentes convergentes."
      }
    ]
  },
  {
    "title": "Foco real e foco virtual",
    "rawTitle": "22.1 Foco real e foco virtual",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Um foco real é aquele por onde os raios passam efetivamente."
      },
      {
        "type": "paragraph",
        "text": "Um foco virtual é aquele por onde passam apenas os prolongamentos dos raios."
      },
      {
        "type": "paragraph",
        "text": "Na lente convergente, raios paralelos ao eixo principal atravessam a lente e convergem para o foco real."
      },
      {
        "type": "paragraph",
        "text": "Na lente divergente, raios paralelos atravessam a lente e divergem. Seus prolongamentos passam pelo foco virtual."
      }
    ]
  },
  {
    "title": "Raios notáveis nas lentes",
    "rawTitle": "23. Raios notáveis nas lentes",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Assim como nos espelhos, as lentes têm raios notáveis que facilitam a construção de imagens."
      }
    ]
  },
  {
    "title": "Lente convergente",
    "rawTitle": "23.1 Lente convergente",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Raio paralelo ao eixo principal"
      },
      {
        "type": "paragraph",
        "text": "Um raio que incide paralelo ao eixo principal emerge passando pelo foco imagem."
      },
      {
        "type": "subheading",
        "text": "Raio que passa pelo foco objeto"
      },
      {
        "type": "paragraph",
        "text": "Um raio que passa pelo foco objeto emerge paralelo ao eixo principal."
      },
      {
        "type": "subheading",
        "text": "Raio que passa pelo centro óptico"
      },
      {
        "type": "paragraph",
        "text": "Um raio que passa pelo centro óptico atravessa a lente sem desvio angular apreciável."
      }
    ]
  },
  {
    "title": "Lente divergente",
    "rawTitle": "23.2 Lente divergente",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Raio paralelo ao eixo principal"
      },
      {
        "type": "paragraph",
        "text": "Um raio que incide paralelo ao eixo principal emerge divergindo como se viesse do foco imagem virtual."
      },
      {
        "type": "subheading",
        "text": "Raio dirigido ao foco do outro lado"
      },
      {
        "type": "paragraph",
        "text": "Um raio dirigido ao foco do lado oposto emerge paralelo ao eixo principal."
      },
      {
        "type": "subheading",
        "text": "Raio que passa pelo centro óptico"
      },
      {
        "type": "paragraph",
        "text": "Atravessa sem desvio angular apreciável."
      }
    ]
  },
  {
    "title": "Como esses raios ajudam?",
    "rawTitle": "23.3 Como esses raios ajudam?",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A imagem se forma no ponto onde os raios emergentes se cruzam, se a imagem for real."
      },
      {
        "type": "paragraph",
        "text": "Se os raios emergentes divergem, prolongamos esses raios para trás. O ponto onde os prolongamentos se cruzam indica a posição da imagem virtual."
      },
      {
        "type": "paragraph",
        "text": "Raios notáveis evitam que o aluno tente “adivinhar” a imagem. Eles transformam o problema em geometria."
      }
    ]
  },
  {
    "title": "Formação de imagens em lentes convergentes",
    "rawTitle": "24. Formação de imagens em lentes convergentes",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A lente convergente tem comportamento parecido, em alguns aspectos, com o espelho côncavo. Ela pode formar imagens reais ou virtuais dependendo da posição do objeto."
      }
    ]
  },
  {
    "title": "Objeto além de $2f$",
    "rawTitle": "24.1 Objeto além de $2f$",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Quando o objeto está além de $2f$, a imagem se forma entre $f$ e $2f$ do outro lado da lente."
      },
      {
        "type": "paragraph",
        "text": "Características:"
      },
      {
        "type": "list",
        "items": [
          "real;",
          "invertida;",
          "menor que o objeto;",
          "formada do lado oposto ao objeto."
        ]
      }
    ]
  },
  {
    "title": "Objeto em $2f$",
    "rawTitle": "24.2 Objeto em $2f$",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Quando o objeto está em $2f$, a imagem se forma em $2f$ do outro lado."
      },
      {
        "type": "paragraph",
        "text": "Características:"
      },
      {
        "type": "list",
        "items": [
          "real;",
          "invertida;",
          "mesmo tamanho do objeto;",
          "formada do lado oposto."
        ]
      }
    ]
  },
  {
    "title": "Objeto entre $f$ e $2f$",
    "rawTitle": "24.3 Objeto entre $f$ e $2f$",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Quando o objeto está entre $f$ e $2f$, a imagem se forma além de $2f$ do outro lado."
      },
      {
        "type": "paragraph",
        "text": "Características:"
      },
      {
        "type": "list",
        "items": [
          "real;",
          "invertida;",
          "maior que o objeto;",
          "formada do lado oposto."
        ]
      }
    ]
  },
  {
    "title": "Objeto no foco",
    "rawTitle": "24.4 Objeto no foco",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Quando o objeto está no foco, os raios emergem paralelos."
      },
      {
        "type": "paragraph",
        "text": "A imagem se forma no infinito."
      },
      {
        "type": "paragraph",
        "text": "Esse é um caso limite."
      }
    ]
  },
  {
    "title": "Objeto entre o foco e a lente",
    "rawTitle": "24.5 Objeto entre o foco e a lente",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Quando o objeto está entre o foco e a lente, os raios emergem divergentes. Seus prolongamentos se encontram do mesmo lado do objeto."
      },
      {
        "type": "paragraph",
        "text": "Características:"
      },
      {
        "type": "list",
        "items": [
          "virtual;",
          "direita;",
          "maior que o objeto;",
          "formada do mesmo lado do objeto."
        ]
      },
      {
        "type": "paragraph",
        "text": "Esse é o funcionamento básico da lupa."
      }
    ]
  },
  {
    "title": "Tabela-resumo da lente convergente",
    "rawTitle": "24.6 Tabela-resumo da lente convergente",
    "group": "theory",
    "nodes": [
      {
        "type": "table",
        "headers": [
          "Posição do objeto",
          "Posição da imagem",
          "Natureza",
          "Orientação",
          "Tamanho"
        ],
        "rows": [
          [
            "Além de $2f$",
            "Entre $f$ e $2f$",
            "Real",
            "Invertida",
            "Menor"
          ],
          [
            "Em $2f$",
            "Em $2f$",
            "Real",
            "Invertida",
            "Igual"
          ],
          [
            "Entre $f$ e $2f$",
            "Além de $2f$",
            "Real",
            "Invertida",
            "Maior"
          ],
          [
            "Em $f$",
            "No infinito",
            "Imprópria",
            "-",
            "-"
          ],
          [
            "Entre $f$ e a lente",
            "Mesmo lado do objeto",
            "Virtual",
            "Direita",
            "Maior"
          ]
        ]
      }
    ]
  },
  {
    "title": "Formação de imagens em lentes divergentes",
    "rawTitle": "25. Formação de imagens em lentes divergentes",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A lente divergente, para objetos reais, sempre forma imagem:"
      },
      {
        "type": "list",
        "items": [
          "virtual;",
          "direita;",
          "menor;",
          "localizada entre o foco e a lente;",
          "do mesmo lado do objeto."
        ]
      },
      {
        "type": "paragraph",
        "text": "Isso acontece porque a lente divergente espalha os raios. Os raios emergentes não se cruzam do outro lado. Seus prolongamentos para trás se cruzam no mesmo lado do objeto."
      },
      {
        "type": "paragraph",
        "text": "Lentes divergentes são usadas para corrigir miopia, pois ajudam a fazer os raios chegarem ao olho com divergência adequada, deslocando a formação da imagem para a retina."
      }
    ]
  },
  {
    "title": "Equação das lentes delgadas",
    "rawTitle": "26. Equação das lentes delgadas",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A equação das lentes delgadas tem a mesma forma algébrica da equação dos espelhos:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{f} = \\frac{1}{p} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "Em que:"
      },
      {
        "type": "list",
        "items": [
          "$f$ é a distância focal;",
          "$p$ é a distância do objeto à lente;",
          "$p'$ é a distância da imagem à lente."
        ]
      },
      {
        "type": "paragraph",
        "text": "Apesar da semelhança com espelhos, a interpretação geométrica é diferente, pois na lente a luz atravessa o sistema, enquanto no espelho a luz retorna ao meio de origem."
      }
    ]
  },
  {
    "title": "Convenção de sinais",
    "rawTitle": "26.1 Convenção de sinais",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Uma convenção comum para lentes delgadas é:"
      },
      {
        "type": "list",
        "items": [
          "lente convergente: $f > 0$;",
          "lente divergente: $f < 0$;",
          "objeto real: $p > 0$;",
          "imagem real: $p' > 0$;",
          "imagem virtual: $p' < 0$."
        ]
      },
      {
        "type": "paragraph",
        "text": "O aumento linear é:"
      },
      {
        "type": "formula",
        "formula": "A = \\frac{i}{o} = -\\frac{p'}{p}"
      },
      {
        "type": "paragraph",
        "text": "O sinal de $A$ indica orientação:"
      },
      {
        "type": "list",
        "items": [
          "$A > 0$: imagem direita;",
          "$A < 0$: imagem invertida."
        ]
      },
      {
        "type": "paragraph",
        "text": "O módulo indica tamanho:"
      },
      {
        "type": "list",
        "items": [
          "$|A| > 1$: imagem maior;",
          "$|A| = 1$: imagem igual;",
          "$|A| < 1$: imagem menor."
        ]
      }
    ]
  },
  {
    "title": "Exemplo resolvido: lente convergente",
    "rawTitle": "26.2 Exemplo resolvido: lente convergente",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Um objeto está a $30\\ \\mathrm{cm}$ de uma lente convergente de distância focal $10\\ \\mathrm{cm}$. Determine a posição e as características da imagem."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Dados:"
      },
      {
        "type": "formula",
        "formula": "p = 30\\ \\mathrm{cm}"
      },
      {
        "type": "formula",
        "formula": "f = 10\\ \\mathrm{cm}"
      },
      {
        "type": "paragraph",
        "text": "Usamos:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{f} = \\frac{1}{p} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "Substituindo:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{10} = \\frac{1}{30} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "Isolando:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = \\frac{1}{10} - \\frac{1}{30}"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = \\frac{3}{30} - \\frac{1}{30}"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = \\frac{2}{30}"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = \\frac{1}{15}"
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "p' = 15\\ \\mathrm{cm}"
      },
      {
        "type": "paragraph",
        "text": "O aumento é:"
      },
      {
        "type": "formula",
        "formula": "A = -\\frac{p'}{p}"
      },
      {
        "type": "formula",
        "formula": "A = -\\frac{15}{30}"
      },
      {
        "type": "formula",
        "formula": "A = -0{,}5"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "A imagem se forma a:"
      },
      {
        "type": "formula",
        "formula": "p' = 15\\ \\mathrm{cm}"
      },
      {
        "type": "paragraph",
        "text": "do outro lado da lente."
      },
      {
        "type": "paragraph",
        "text": "Como $p' > 0$, é real."
      },
      {
        "type": "paragraph",
        "text": "Como $A < 0$, é invertida."
      },
      {
        "type": "paragraph",
        "text": "Como $|A| < 1$, é menor."
      },
      {
        "type": "subheading",
        "text": "Interpretação"
      },
      {
        "type": "paragraph",
        "text": "O objeto está além de $2f$, pois $2f = 20\\ \\mathrm{cm}$ e $p = 30\\ \\mathrm{cm}$. Portanto, a imagem deve ser real, invertida e menor, entre $f$ e $2f$. A conta confirma a construção."
      }
    ]
  },
  {
    "title": "Exemplo resolvido: lente divergente",
    "rawTitle": "26.3 Exemplo resolvido: lente divergente",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Um objeto está a $20\\ \\mathrm{cm}$ de uma lente divergente de distância focal $-10\\ \\mathrm{cm}$. Determine a posição da imagem."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Dados:"
      },
      {
        "type": "formula",
        "formula": "p = 20\\ \\mathrm{cm}"
      },
      {
        "type": "formula",
        "formula": "f = -10\\ \\mathrm{cm}"
      },
      {
        "type": "paragraph",
        "text": "Usamos:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{f} = \\frac{1}{p} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "Substituindo:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{-10} = \\frac{1}{20} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "Isolando:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = -\\frac{1}{10} - \\frac{1}{20}"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = -\\frac{2}{20} - \\frac{1}{20}"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = -\\frac{3}{20}"
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "p' = -\\frac{20}{3}\\ \\mathrm{cm}"
      },
      {
        "type": "formula",
        "formula": "p' \\approx -6{,}7\\ \\mathrm{cm}"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "A imagem se forma a aproximadamente:"
      },
      {
        "type": "formula",
        "formula": "p' \\approx -6{,}7\\ \\mathrm{cm}"
      },
      {
        "type": "paragraph",
        "text": "O sinal negativo indica imagem virtual, do mesmo lado do objeto."
      },
      {
        "type": "subheading",
        "text": "Interpretação"
      },
      {
        "type": "paragraph",
        "text": "Isso combina com a lente divergente: imagem virtual, direita e menor, entre a lente e o foco."
      }
    ]
  },
  {
    "title": "Vergência de uma lente",
    "rawTitle": "27. Vergência de uma lente",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Vergência, também chamada de convergência, mede a capacidade de uma lente convergir ou divergir raios luminosos."
      },
      {
        "type": "paragraph",
        "text": "A vergência é definida por:"
      },
      {
        "type": "formula",
        "formula": "V = \\frac{1}{f}"
      },
      {
        "type": "paragraph",
        "text": "com $f$ medido em metros."
      },
      {
        "type": "paragraph",
        "text": "A unidade de vergência é a dioptria:"
      },
      {
        "type": "formula",
        "formula": "1\\ \\mathrm{di} = 1\\ \\mathrm{m^{-1}}"
      },
      {
        "type": "paragraph",
        "text": "Popularmente, dioptria é chamada de “grau”."
      }
    ]
  },
  {
    "title": "Sinal da vergência",
    "rawTitle": "27.1 Sinal da vergência",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Para lente convergente:"
      },
      {
        "type": "formula",
        "formula": "f > 0"
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "V > 0"
      },
      {
        "type": "paragraph",
        "text": "Para lente divergente:"
      },
      {
        "type": "formula",
        "formula": "f < 0"
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "V < 0"
      }
    ]
  },
  {
    "title": "Interpretação",
    "rawTitle": "27.2 Interpretação",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Quanto menor o módulo da distância focal, maior o módulo da vergência."
      },
      {
        "type": "paragraph",
        "text": "Uma lente com distância focal pequena desvia os raios mais fortemente."
      },
      {
        "type": "paragraph",
        "text": "Uma lente com distância focal grande desvia os raios mais suavemente."
      }
    ]
  },
  {
    "title": "Exemplo resolvido: vergência",
    "rawTitle": "27.3 Exemplo resolvido: vergência",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Uma lente convergente tem distância focal $f = 50\\ \\mathrm{cm}$. Determine sua vergência em dioptrias."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Primeiro convertemos para metros:"
      },
      {
        "type": "formula",
        "formula": "50\\ \\mathrm{cm} = 0{,}50\\ \\mathrm{m}"
      },
      {
        "type": "paragraph",
        "text": "A vergência é:"
      },
      {
        "type": "formula",
        "formula": "V = \\frac{1}{f}"
      },
      {
        "type": "paragraph",
        "text": "Substituindo:"
      },
      {
        "type": "formula",
        "formula": "V = \\frac{1}{0{,}50}"
      },
      {
        "type": "formula",
        "formula": "V = 2{,}0\\ \\mathrm{di}"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "A vergência é:"
      },
      {
        "type": "formula",
        "formula": "V = +2{,}0\\ \\mathrm{di}"
      },
      {
        "type": "paragraph",
        "text": "O sinal positivo indica lente convergente."
      }
    ]
  },
  {
    "title": "Exemplo resolvido: lente divergente",
    "rawTitle": "27.4 Exemplo resolvido: lente divergente",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Uma lente divergente tem distância focal $f = -25\\ \\mathrm{cm}$. Determine sua vergência."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Convertendo para metros:"
      },
      {
        "type": "formula",
        "formula": "f = -0{,}25\\ \\mathrm{m}"
      },
      {
        "type": "paragraph",
        "text": "Calculando:"
      },
      {
        "type": "formula",
        "formula": "V = \\frac{1}{f}"
      },
      {
        "type": "formula",
        "formula": "V = \\frac{1}{-0{,}25}"
      },
      {
        "type": "formula",
        "formula": "V = -4{,}0\\ \\mathrm{di}"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "A vergência é:"
      },
      {
        "type": "formula",
        "formula": "V = -4{,}0\\ \\mathrm{di}"
      },
      {
        "type": "paragraph",
        "text": "O sinal negativo indica lente divergente."
      }
    ]
  },
  {
    "title": "Associação de lentes delgadas",
    "rawTitle": "28. Associação de lentes delgadas",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Quando lentes delgadas são justapostas, isto é, colocadas muito próximas uma da outra, a vergência equivalente é a soma das vergências individuais:"
      },
      {
        "type": "formula",
        "formula": "V_{\\text{eq}} = V_1 + V_2 + V_3 + \\cdots"
      },
      {
        "type": "paragraph",
        "text": "Como:"
      },
      {
        "type": "formula",
        "formula": "V = \\frac{1}{f}"
      },
      {
        "type": "paragraph",
        "text": "também podemos escrever:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{f_{\\text{eq}}} = \\frac{1}{f_1} + \\frac{1}{f_2} + \\frac{1}{f_3} + \\cdots"
      },
      {
        "type": "paragraph",
        "text": "Essa relação é válida para lentes delgadas justapostas no mesmo meio."
      }
    ]
  },
  {
    "title": "Aplicações",
    "rawTitle": "28.1 Aplicações",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Associação de lentes aparece em:"
      },
      {
        "type": "list",
        "items": [
          "óculos;",
          "instrumentos ópticos;",
          "microscópios;",
          "lunetas;",
          "câmeras;",
          "sistemas de correção visual;",
          "lentes compostas."
        ]
      },
      {
        "type": "paragraph",
        "text": "Na prática, muitos instrumentos usam combinações de lentes para corrigir aberrações e obter imagens melhores."
      }
    ]
  },
  {
    "title": "Exemplo resolvido",
    "rawTitle": "28.2 Exemplo resolvido",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Duas lentes delgadas justapostas têm vergências $V_1 = +3{,}0\\ \\mathrm{di}$ e $V_2 = -1{,}0\\ \\mathrm{di}$. Determine a vergência equivalente."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Usamos:"
      },
      {
        "type": "formula",
        "formula": "V_{\\text{eq}} = V_1 + V_2"
      },
      {
        "type": "paragraph",
        "text": "Substituindo:"
      },
      {
        "type": "formula",
        "formula": "V_{\\text{eq}} = 3{,}0 + (-1{,}0)"
      },
      {
        "type": "formula",
        "formula": "V_{\\text{eq}} = 2{,}0\\ \\mathrm{di}"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "A vergência equivalente é:"
      },
      {
        "type": "formula",
        "formula": "V_{\\text{eq}} = +2{,}0\\ \\mathrm{di}"
      },
      {
        "type": "paragraph",
        "text": "O sistema equivalente é convergente."
      }
    ]
  },
  {
    "title": "Instrumentos ópticos",
    "rawTitle": "29. Instrumentos ópticos",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Instrumentos ópticos são sistemas que usam reflexão, refração, lentes e espelhos para formar, ampliar, registrar ou corrigir imagens."
      }
    ]
  },
  {
    "title": "Lupa",
    "rawTitle": "29.1 Lupa",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A lupa é uma lente convergente usada com o objeto colocado entre o foco e a lente."
      },
      {
        "type": "paragraph",
        "text": "Nesse caso, a imagem formada é:"
      },
      {
        "type": "list",
        "items": [
          "virtual;",
          "direita;",
          "ampliada;",
          "do mesmo lado do objeto."
        ]
      },
      {
        "type": "paragraph",
        "text": "A lupa não projeta uma imagem real em uma tela. Ela fornece ao olho uma imagem virtual ampliada."
      }
    ]
  },
  {
    "title": "Microscópio composto",
    "rawTitle": "29.2 Microscópio composto",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "O microscópio composto usa duas lentes convergentes principais:"
      },
      {
        "type": "list",
        "items": [
          "objetiva;",
          "ocular."
        ]
      },
      {
        "type": "paragraph",
        "text": "A objetiva fica próxima do objeto e forma uma imagem real, invertida e ampliada."
      },
      {
        "type": "paragraph",
        "text": "A ocular funciona como uma lupa, ampliando a imagem formada pela objetiva."
      },
      {
        "type": "paragraph",
        "text": "O resultado é uma imagem final muito aumentada."
      }
    ]
  },
  {
    "title": "Luneta astronômica",
    "rawTitle": "29.3 Luneta astronômica",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A luneta astronômica usa lentes para observar objetos muito distantes."
      },
      {
        "type": "paragraph",
        "text": "Ela possui:"
      },
      {
        "type": "list",
        "items": [
          "objetiva, de grande distância focal;",
          "ocular, de menor distância focal."
        ]
      },
      {
        "type": "paragraph",
        "text": "A objetiva forma uma imagem real de um objeto distante. A ocular amplia essa imagem."
      },
      {
        "type": "paragraph",
        "text": "Em lunetas astronômicas simples, a imagem final pode ser invertida, o que não é um grande problema para observar astros."
      }
    ]
  },
  {
    "title": "Telescópio",
    "rawTitle": "29.4 Telescópio",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Telescópios podem usar lentes ou espelhos."
      },
      {
        "type": "paragraph",
        "text": "Telescópios refratores usam lentes."
      },
      {
        "type": "paragraph",
        "text": "Telescópios refletores usam espelhos, geralmente espelhos côncavos grandes, para coletar luz e formar imagens."
      },
      {
        "type": "paragraph",
        "text": "Espelhos são muito usados em telescópios modernos porque podem ser construídos com grandes dimensões e evitam certos problemas de dispersão cromática associados a lentes."
      }
    ]
  },
  {
    "title": "Câmera fotográfica",
    "rawTitle": "29.5 Câmera fotográfica",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Uma câmera usa uma lente convergente para formar uma imagem real sobre um sensor ou filme."
      },
      {
        "type": "paragraph",
        "text": "A imagem formada no sensor é:"
      },
      {
        "type": "list",
        "items": [
          "real;",
          "invertida;",
          "geralmente menor que o objeto."
        ]
      },
      {
        "type": "paragraph",
        "text": "O foco é ajustado alterando a posição relativa entre lente e sensor ou ajustando o sistema óptico interno."
      }
    ]
  },
  {
    "title": "Olho humano",
    "rawTitle": "29.6 Olho humano",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "O olho humano funciona como um sistema óptico convergente."
      },
      {
        "type": "paragraph",
        "text": "A córnea e o cristalino desviam a luz e formam uma imagem real e invertida sobre a retina."
      },
      {
        "type": "paragraph",
        "text": "O cérebro interpreta essa imagem e constrói a percepção visual."
      }
    ]
  },
  {
    "title": "Projetor",
    "rawTitle": "29.7 Projetor",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Um projetor usa uma lente convergente para formar uma imagem real, ampliada e invertida sobre uma tela."
      },
      {
        "type": "paragraph",
        "text": "Para que a imagem projetada fique direita na tela, o objeto interno ou o sistema óptico é organizado de forma adequada."
      }
    ]
  },
  {
    "title": "Óptica da visão",
    "rawTitle": "30. Óptica da visão",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "O olho humano é um sistema óptico sofisticado, formado por várias estruturas que trabalham juntas para formar imagens na retina."
      }
    ]
  },
  {
    "title": "Estruturas principais do olho",
    "rawTitle": "30.1 Estruturas principais do olho",
    "group": "theory",
    "nodes": [
      {
        "type": "subheading",
        "text": "Córnea"
      },
      {
        "type": "paragraph",
        "text": "É a parte transparente externa do olho. Ela realiza grande parte da refração da luz que entra no olho."
      },
      {
        "type": "subheading",
        "text": "Cristalino"
      },
      {
        "type": "paragraph",
        "text": "É uma lente flexível que ajusta sua forma para focalizar objetos em diferentes distâncias. Esse ajuste é chamado acomodação visual."
      },
      {
        "type": "subheading",
        "text": "Retina"
      },
      {
        "type": "paragraph",
        "text": "É a região sensível à luz no fundo do olho. Nela se forma a imagem real e invertida."
      },
      {
        "type": "subheading",
        "text": "Pupila"
      },
      {
        "type": "paragraph",
        "text": "É a abertura por onde a luz entra no olho."
      },
      {
        "type": "subheading",
        "text": "Íris"
      },
      {
        "type": "paragraph",
        "text": "É a estrutura colorida que controla o tamanho da pupila, regulando a quantidade de luz que entra."
      },
      {
        "type": "subheading",
        "text": "Nervo óptico"
      },
      {
        "type": "paragraph",
        "text": "Transmite as informações visuais da retina para o cérebro."
      }
    ]
  },
  {
    "title": "Formação da imagem na retina",
    "rawTitle": "30.2 Formação da imagem na retina",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A córnea e o cristalino convergem os raios luminosos, formando uma imagem sobre a retina."
      },
      {
        "type": "paragraph",
        "text": "Essa imagem é:"
      },
      {
        "type": "list",
        "items": [
          "real;",
          "invertida;",
          "menor que o objeto."
        ]
      },
      {
        "type": "paragraph",
        "text": "O cérebro interpreta os sinais recebidos e constrói a percepção de uma imagem direita."
      }
    ]
  },
  {
    "title": "Miopia",
    "rawTitle": "30.3 Miopia",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Na miopia, a pessoa tem dificuldade para enxergar objetos distantes."
      },
      {
        "type": "paragraph",
        "text": "A imagem de objetos distantes se forma antes da retina."
      },
      {
        "type": "paragraph",
        "text": "Isso pode ocorrer porque o olho é muito alongado ou porque o sistema óptico é convergente demais."
      },
      {
        "type": "paragraph",
        "text": "Correção:"
      },
      {
        "type": "list",
        "items": [
          "usa-se lente divergente."
        ]
      },
      {
        "type": "paragraph",
        "text": "A lente divergente faz os raios chegarem ao olho mais abertos, deslocando o foco para trás, até a retina."
      }
    ]
  },
  {
    "title": "Hipermetropia",
    "rawTitle": "30.4 Hipermetropia",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Na hipermetropia, a pessoa tem dificuldade para enxergar objetos próximos."
      },
      {
        "type": "paragraph",
        "text": "A imagem tenderia a se formar depois da retina."
      },
      {
        "type": "paragraph",
        "text": "Isso pode ocorrer porque o olho é curto demais ou porque o sistema óptico é pouco convergente."
      },
      {
        "type": "paragraph",
        "text": "Correção:"
      },
      {
        "type": "list",
        "items": [
          "usa-se lente convergente."
        ]
      },
      {
        "type": "paragraph",
        "text": "A lente convergente ajuda a focalizar os raios antes, trazendo a imagem para a retina."
      }
    ]
  },
  {
    "title": "Presbiopia",
    "rawTitle": "30.5 Presbiopia",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Presbiopia é a dificuldade de acomodação visual que surge geralmente com a idade."
      },
      {
        "type": "paragraph",
        "text": "O cristalino perde flexibilidade, dificultando a focalização de objetos próximos."
      },
      {
        "type": "paragraph",
        "text": "Correção:"
      },
      {
        "type": "list",
        "items": [
          "lentes convergentes para perto;",
          "lentes multifocais ou bifocais, dependendo do caso."
        ]
      }
    ]
  },
  {
    "title": "Astigmatismo",
    "rawTitle": "30.6 Astigmatismo",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "No astigmatismo, a curvatura da córnea ou do cristalino não é perfeitamente regular."
      },
      {
        "type": "paragraph",
        "text": "Raios em diferentes planos focalizam em posições diferentes, causando imagem distorcida ou borrada."
      },
      {
        "type": "paragraph",
        "text": "Correção:"
      },
      {
        "type": "list",
        "items": [
          "lentes cilíndricas."
        ]
      },
      {
        "type": "paragraph",
        "text": "Essas lentes compensam a assimetria do sistema óptico do olho."
      }
    ]
  },
  {
    "title": "Interpretação gráfica e geométrica",
    "rawTitle": "31. Interpretação gráfica e geométrica",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Muitos problemas de Óptica são, no fundo, problemas de geometria."
      },
      {
        "type": "paragraph",
        "text": "Antes de aplicar fórmula, é fundamental desenhar."
      },
      {
        "type": "paragraph",
        "text": "Em Óptica, o desenho não é decoração. É parte da solução."
      }
    ]
  },
  {
    "title": "O que marcar no desenho?",
    "rawTitle": "31.1 O que marcar no desenho?",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Em espelhos e lentes, marque:"
      },
      {
        "type": "list",
        "items": [
          "eixo principal;",
          "vértice ou centro óptico;",
          "foco;",
          "centro de curvatura, no caso de espelhos;",
          "posição do objeto;",
          "raios notáveis;",
          "posição esperada da imagem."
        ]
      },
      {
        "type": "paragraph",
        "text": "Em refração, marque:"
      },
      {
        "type": "list",
        "items": [
          "interface entre os meios;",
          "normal;",
          "raio incidente;",
          "raio refratado;",
          "ângulos em relação à normal;",
          "índices de refração."
        ]
      }
    ]
  },
  {
    "title": "Semelhança de triângulos",
    "rawTitle": "31.2 Semelhança de triângulos",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A câmara escura, o aumento linear e várias construções ópticas usam semelhança de triângulos."
      },
      {
        "type": "paragraph",
        "text": "Quando dois triângulos têm ângulos correspondentes iguais, seus lados correspondentes são proporcionais."
      },
      {
        "type": "paragraph",
        "text": "É daí que surgem relações como:"
      },
      {
        "type": "formula",
        "formula": "\\frac{i}{o} = \\frac{p'}{p}"
      },
      {
        "type": "paragraph",
        "text": "e:"
      },
      {
        "type": "formula",
        "formula": "A = \\frac{i}{o} = -\\frac{p'}{p}"
      }
    ]
  },
  {
    "title": "Trigonometria",
    "rawTitle": "31.3 Trigonometria",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Refração, prismas, reflexão total e lâminas exigem trigonometria."
      },
      {
        "type": "paragraph",
        "text": "A Lei de Snell usa seno:"
      },
      {
        "type": "formula",
        "formula": "n_1 \\sin i = n_2 \\sin r"
      },
      {
        "type": "paragraph",
        "text": "O ângulo limite usa:"
      },
      {
        "type": "formula",
        "formula": "\\sin L = \\frac{n_2}{n_1}"
      },
      {
        "type": "paragraph",
        "text": "A lâmina de faces paralelas pode envolver:"
      },
      {
        "type": "formula",
        "formula": "d = e \\frac{\\sin(i-r)}{\\cos r}"
      }
    ]
  },
  {
    "title": "Convenção de sinais",
    "rawTitle": "31.4 Convenção de sinais",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Em espelhos e lentes, a conta só tem sentido se a convenção de sinais for mantida do começo ao fim."
      },
      {
        "type": "paragraph",
        "text": "Não adianta decorar fórmula se você troca sinal no meio como quem troca de canal. O resultado pode até sair bonito, mas fisicamente errado."
      },
      {
        "type": "paragraph",
        "text": "Sempre pergunte:"
      },
      {
        "type": "list",
        "items": [
          "o elemento é convergente ou divergente?",
          "a imagem é real ou virtual?",
          "o objeto é real?",
          "o sinal de $f$ está correto?",
          "o sinal de $p'$ faz sentido?"
        ]
      }
    ]
  },
  {
    "title": "Fórmula não substitui interpretação",
    "rawTitle": "31.5 Fórmula não substitui interpretação",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Antes de confiar na conta, pergunte:"
      },
      {
        "type": "list",
        "items": [
          "a imagem deveria ser real ou virtual?",
          "deveria ser maior ou menor?",
          "deveria ser direita ou invertida?",
          "o raio deveria aproximar ou afastar da normal?",
          "o resultado respeita o caso limite?"
        ]
      },
      {
        "type": "paragraph",
        "text": "Essa verificação evita erros absurdos."
      }
    ]
  },
  {
    "title": "Casos especiais importantes",
    "rawTitle": "32. Casos especiais importantes",
    "group": "theory",
    "nodes": []
  },
  {
    "title": "Objeto no foco",
    "rawTitle": "32.1 Objeto no foco",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Em espelho côncavo ou lente convergente, quando o objeto está no foco, a imagem se forma no infinito."
      },
      {
        "type": "paragraph",
        "text": "Isso ocorre porque os raios emergem paralelos."
      },
      {
        "type": "paragraph",
        "text": "Pela equação:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{f} = \\frac{1}{p} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "se:"
      },
      {
        "type": "formula",
        "formula": "p = f"
      },
      {
        "type": "paragraph",
        "text": "então:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = 0"
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "p' \\to \\infty"
      }
    ]
  },
  {
    "title": "Objeto muito distante",
    "rawTitle": "32.2 Objeto muito distante",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Quando o objeto está muito distante, os raios que chegam ao sistema óptico são aproximadamente paralelos."
      },
      {
        "type": "paragraph",
        "text": "Em espelhos côncavos e lentes convergentes, a imagem se forma aproximadamente no foco."
      },
      {
        "type": "paragraph",
        "text": "Esse caso aparece em:"
      },
      {
        "type": "list",
        "items": [
          "câmeras fotografando objetos distantes;",
          "telescópios;",
          "luz solar incidindo em espelhos ou lentes."
        ]
      }
    ]
  },
  {
    "title": "Imagem no infinito",
    "rawTitle": "32.3 Imagem no infinito",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A imagem está no infinito quando os raios emergentes saem paralelos."
      },
      {
        "type": "paragraph",
        "text": "Isso ocorre quando o objeto está no foco de uma lente convergente ou espelho côncavo."
      }
    ]
  },
  {
    "title": "Raios paralelos",
    "rawTitle": "32.4 Raios paralelos",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Raios paralelos ao eixo principal são associados ao foco."
      },
      {
        "type": "paragraph",
        "text": "Em sistema convergente, raios paralelos convergem para o foco."
      },
      {
        "type": "paragraph",
        "text": "Em sistema divergente, raios paralelos divergem como se viessem do foco virtual."
      }
    ]
  },
  {
    "title": "Incidência normal",
    "rawTitle": "32.5 Incidência normal",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Na incidência normal:"
      },
      {
        "type": "formula",
        "formula": "i = 0^\\circ"
      },
      {
        "type": "paragraph",
        "text": "Então, pela Lei de Snell:"
      },
      {
        "type": "formula",
        "formula": "r = 0^\\circ"
      },
      {
        "type": "paragraph",
        "text": "Não há desvio de direção, embora possa haver mudança de velocidade."
      }
    ]
  },
  {
    "title": "Ângulo limite",
    "rawTitle": "32.6 Ângulo limite",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "O ângulo limite só existe quando a luz vai do meio mais refringente para o menos refringente."
      },
      {
        "type": "paragraph",
        "text": "A fórmula é:"
      },
      {
        "type": "formula",
        "formula": "\\sin L = \\frac{n_2}{n_1}"
      },
      {
        "type": "paragraph",
        "text": "com:"
      },
      {
        "type": "formula",
        "formula": "n_1 > n_2"
      }
    ]
  },
  {
    "title": "Lente com distância focal negativa",
    "rawTitle": "32.7 Lente com distância focal negativa",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Lente divergente tem:"
      },
      {
        "type": "formula",
        "formula": "f < 0"
      },
      {
        "type": "paragraph",
        "text": "Sua vergência também é negativa:"
      },
      {
        "type": "formula",
        "formula": "V < 0"
      }
    ]
  },
  {
    "title": "Espelho convexo",
    "rawTitle": "32.8 Espelho convexo",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Espelho convexo tem:"
      },
      {
        "type": "formula",
        "formula": "f < 0"
      },
      {
        "type": "paragraph",
        "text": "Para objeto real, forma imagem virtual, direita e menor."
      }
    ]
  },
  {
    "title": "Imagem virtual",
    "rawTitle": "32.9 Imagem virtual",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Imagem virtual é formada por prolongamentos de raios."
      },
      {
        "type": "paragraph",
        "text": "Ela não pode ser projetada diretamente em uma tela."
      },
      {
        "type": "paragraph",
        "text": "Mas pode ser vista pelo olho, porque o olho interpreta os raios divergentes como vindos daquele ponto."
      }
    ]
  },
  {
    "title": "Aplicações práticas",
    "rawTitle": "33. Aplicações práticas",
    "group": "theory",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A Óptica aparece em muitos dispositivos reais."
      },
      {
        "type": "subheading",
        "text": "Óculos"
      },
      {
        "type": "paragraph",
        "text": "Corrigem defeitos de visão usando lentes convergentes, divergentes ou cilíndricas."
      },
      {
        "type": "subheading",
        "text": "Lentes de contato"
      },
      {
        "type": "paragraph",
        "text": "Funcionam de modo semelhante aos óculos, mas ficam diretamente sobre a córnea."
      },
      {
        "type": "subheading",
        "text": "Câmeras"
      },
      {
        "type": "paragraph",
        "text": "Usam lentes convergentes para formar imagens reais sobre sensores."
      },
      {
        "type": "subheading",
        "text": "Telescópios"
      },
      {
        "type": "paragraph",
        "text": "Coletam luz de objetos distantes e formam imagens ampliadas. Podem usar lentes ou espelhos."
      },
      {
        "type": "subheading",
        "text": "Microscópios"
      },
      {
        "type": "paragraph",
        "text": "Usam combinações de lentes para ampliar objetos pequenos."
      },
      {
        "type": "subheading",
        "text": "Fibra óptica"
      },
      {
        "type": "paragraph",
        "text": "Usa reflexão total interna para conduzir luz e transmitir informações."
      },
      {
        "type": "subheading",
        "text": "Lasers"
      },
      {
        "type": "paragraph",
        "text": "Produzem luz altamente direcionada e coerente, usada em medicina, indústria, comunicações e medições."
      },
      {
        "type": "subheading",
        "text": "Retrovisores"
      },
      {
        "type": "paragraph",
        "text": "Espelhos convexos ampliam o campo visual."
      },
      {
        "type": "subheading",
        "text": "Faróis"
      },
      {
        "type": "paragraph",
        "text": "Usam espelhos e lentes para direcionar luz."
      },
      {
        "type": "subheading",
        "text": "Periscópios"
      },
      {
        "type": "paragraph",
        "text": "Usam reflexão em espelhos ou prismas para permitir visão indireta."
      },
      {
        "type": "subheading",
        "text": "Projetores"
      },
      {
        "type": "paragraph",
        "text": "Usam lentes para formar imagens reais ampliadas em telas."
      },
      {
        "type": "subheading",
        "text": "Exames médicos"
      },
      {
        "type": "paragraph",
        "text": "Endoscópios, lasers cirúrgicos, tomografias ópticas e fibras ópticas dependem de princípios de Óptica."
      },
      {
        "type": "subheading",
        "text": "Astronomia"
      },
      {
        "type": "paragraph",
        "text": "Telescópios ópticos permitem observar planetas, estrelas, galáxias e fenômenos distantes."
      }
    ]
  },
  {
    "title": "Exemplos resolvidos",
    "rawTitle": "34. Exemplos resolvidos",
    "group": "examples",
    "nodes": []
  },
  {
    "title": "Exemplo — Câmara escura",
    "rawTitle": "Exemplo 1 — Câmara escura",
    "group": "examples",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Um objeto de $2{,}0\\ \\mathrm{m}$ de altura está a $10\\ \\mathrm{m}$ do orifício de uma câmara escura. A tela está a $0{,}50\\ \\mathrm{m}$ do orifício. Determine a altura da imagem."
      },
      {
        "type": "subheading",
        "text": "Ideia física"
      },
      {
        "type": "paragraph",
        "text": "A imagem se forma por propagação retilínea da luz. Os raios se cruzam no orifício, formando uma imagem invertida. O tamanho é determinado por semelhança de triângulos."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Usamos:"
      },
      {
        "type": "formula",
        "formula": "\\frac{i}{o} = \\frac{p'}{p}"
      },
      {
        "type": "paragraph",
        "text": "Substituindo:"
      },
      {
        "type": "formula",
        "formula": "\\frac{i}{2{,}0} = \\frac{0{,}50}{10}"
      },
      {
        "type": "formula",
        "formula": "\\frac{i}{2{,}0} = 0{,}05"
      },
      {
        "type": "formula",
        "formula": "i = 2{,}0 \\cdot 0{,}05"
      },
      {
        "type": "formula",
        "formula": "i = 0{,}10\\ \\mathrm{m}"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "A imagem tem altura:"
      },
      {
        "type": "formula",
        "formula": "i = 0{,}10\\ \\mathrm{m}"
      },
      {
        "type": "paragraph",
        "text": "ou:"
      },
      {
        "type": "formula",
        "formula": "i = 10\\ \\mathrm{cm}"
      },
      {
        "type": "paragraph",
        "text": "Ela é invertida."
      }
    ]
  },
  {
    "title": "Exemplo — Espelho plano",
    "rawTitle": "Exemplo 2 — Espelho plano",
    "group": "examples",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Um objeto está a $1{,}5\\ \\mathrm{m}$ de um espelho plano. Determine a distância entre o objeto e sua imagem."
      },
      {
        "type": "subheading",
        "text": "Ideia física"
      },
      {
        "type": "paragraph",
        "text": "No espelho plano, a imagem fica atrás do espelho à mesma distância que o objeto está à frente."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Temos:"
      },
      {
        "type": "formula",
        "formula": "d_o = 1{,}5\\ \\mathrm{m}"
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "d_i = 1{,}5\\ \\mathrm{m}"
      },
      {
        "type": "paragraph",
        "text": "A distância objeto-imagem é:"
      },
      {
        "type": "formula",
        "formula": "D = d_o + d_i"
      },
      {
        "type": "formula",
        "formula": "D = 1{,}5 + 1{,}5"
      },
      {
        "type": "formula",
        "formula": "D = 3{,}0\\ \\mathrm{m}"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "A distância entre objeto e imagem é:"
      },
      {
        "type": "formula",
        "formula": "D = 3{,}0\\ \\mathrm{m}"
      }
    ]
  },
  {
    "title": "Exemplo — Espelho esférico",
    "rawTitle": "Exemplo 3 — Espelho esférico",
    "group": "examples",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Um objeto está a $40\\ \\mathrm{cm}$ de um espelho côncavo de distância focal $20\\ \\mathrm{cm}$. Determine a posição da imagem."
      },
      {
        "type": "subheading",
        "text": "Ideia física"
      },
      {
        "type": "paragraph",
        "text": "O objeto está no centro de curvatura, pois:"
      },
      {
        "type": "formula",
        "formula": "R = 2f = 40\\ \\mathrm{cm}"
      },
      {
        "type": "paragraph",
        "text": "Nesse caso, esperamos imagem real, invertida e de mesmo tamanho, também em $C$."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Usamos:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{f} = \\frac{1}{p} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "Substituindo:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{20} = \\frac{1}{40} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "Isolando:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = \\frac{1}{20} - \\frac{1}{40}"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = \\frac{2}{40} - \\frac{1}{40}"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = \\frac{1}{40}"
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "p' = 40\\ \\mathrm{cm}"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "A imagem se forma a:"
      },
      {
        "type": "formula",
        "formula": "p' = 40\\ \\mathrm{cm}"
      },
      {
        "type": "paragraph",
        "text": "na frente do espelho."
      },
      {
        "type": "paragraph",
        "text": "Ela é real, invertida e de mesmo tamanho que o objeto."
      }
    ]
  },
  {
    "title": "Exemplo — Refração e Lei de Snell",
    "rawTitle": "Exemplo 4 — Refração e Lei de Snell",
    "group": "examples",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Um raio passa do ar para um vidro de índice $1{,}5$, com ângulo de incidência $30^\\circ$. Determine $\\sin r$."
      },
      {
        "type": "subheading",
        "text": "Ideia física"
      },
      {
        "type": "paragraph",
        "text": "A luz passa de um meio menos refringente para um mais refringente. Portanto, aproxima-se da normal."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Usamos:"
      },
      {
        "type": "formula",
        "formula": "n_1 \\sin i = n_2 \\sin r"
      },
      {
        "type": "paragraph",
        "text": "Substituindo:"
      },
      {
        "type": "formula",
        "formula": "1{,}0 \\cdot \\sin 30^\\circ = 1{,}5 \\sin r"
      },
      {
        "type": "paragraph",
        "text": "Como:"
      },
      {
        "type": "formula",
        "formula": "\\sin 30^\\circ = 0{,}5"
      },
      {
        "type": "paragraph",
        "text": "temos:"
      },
      {
        "type": "formula",
        "formula": "0{,}5 = 1{,}5 \\sin r"
      },
      {
        "type": "formula",
        "formula": "\\sin r = \\frac{0{,}5}{1{,}5}"
      },
      {
        "type": "formula",
        "formula": "\\sin r = \\frac{1}{3}"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "formula",
        "formula": "\\sin r = \\frac{1}{3}"
      }
    ]
  },
  {
    "title": "Exemplo — Reflexão total",
    "rawTitle": "Exemplo 5 — Reflexão total",
    "group": "examples",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Um raio de luz passa de um meio de índice $n_1 = 1{,}5$ para o ar, de índice $n_2 = 1{,}0$. Determine o seno do ângulo limite."
      },
      {
        "type": "subheading",
        "text": "Ideia física"
      },
      {
        "type": "paragraph",
        "text": "A reflexão total pode ocorrer porque a luz vai do meio mais refringente para o menos refringente."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Usamos:"
      },
      {
        "type": "formula",
        "formula": "\\sin L = \\frac{n_2}{n_1}"
      },
      {
        "type": "paragraph",
        "text": "Substituindo:"
      },
      {
        "type": "formula",
        "formula": "\\sin L = \\frac{1{,}0}{1{,}5}"
      },
      {
        "type": "formula",
        "formula": "\\sin L = \\frac{2}{3}"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "formula",
        "formula": "\\sin L = \\frac{2}{3}"
      },
      {
        "type": "paragraph",
        "text": "Se $i > L$, ocorre reflexão total."
      }
    ]
  },
  {
    "title": "Exemplo — Profundidade aparente",
    "rawTitle": "Exemplo 6 — Profundidade aparente",
    "group": "examples",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Um objeto está a $3{,}0\\ \\mathrm{m}$ de profundidade na água. Um observador no ar olha quase perpendicularmente. Considere $n_{\\text{água}} = 1{,}5$ e $n_{\\text{ar}} = 1{,}0$. Determine a profundidade aparente."
      },
      {
        "type": "subheading",
        "text": "Ideia física"
      },
      {
        "type": "paragraph",
        "text": "O objeto parece mais raso porque os raios se afastam da normal ao sair da água para o ar."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Usamos:"
      },
      {
        "type": "formula",
        "formula": "\\frac{h'}{h} = \\frac{n_{\\text{observador}}}{n_{\\text{objeto}}}"
      },
      {
        "type": "paragraph",
        "text": "Substituindo:"
      },
      {
        "type": "formula",
        "formula": "\\frac{h'}{3{,}0} = \\frac{1{,}0}{1{,}5}"
      },
      {
        "type": "formula",
        "formula": "h' = 3{,}0 \\cdot \\frac{1}{1{,}5}"
      },
      {
        "type": "formula",
        "formula": "h' = 2{,}0\\ \\mathrm{m}"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "A profundidade aparente é:"
      },
      {
        "type": "formula",
        "formula": "h' = 2{,}0\\ \\mathrm{m}"
      }
    ]
  },
  {
    "title": "Exemplo — Lente delgada",
    "rawTitle": "Exemplo 7 — Lente delgada",
    "group": "examples",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Um objeto está a $60\\ \\mathrm{cm}$ de uma lente convergente de distância focal $20\\ \\mathrm{cm}$. Determine a posição da imagem e o aumento."
      },
      {
        "type": "subheading",
        "text": "Ideia física"
      },
      {
        "type": "paragraph",
        "text": "O objeto está além de $2f$, pois $2f = 40\\ \\mathrm{cm}$. Esperamos imagem real, invertida e menor."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Usamos:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{f} = \\frac{1}{p} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "Substituindo:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{20} = \\frac{1}{60} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "Isolando:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = \\frac{1}{20} - \\frac{1}{60}"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = \\frac{3}{60} - \\frac{1}{60}"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = \\frac{2}{60}"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{p'} = \\frac{1}{30}"
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "p' = 30\\ \\mathrm{cm}"
      },
      {
        "type": "paragraph",
        "text": "O aumento é:"
      },
      {
        "type": "formula",
        "formula": "A = -\\frac{p'}{p}"
      },
      {
        "type": "formula",
        "formula": "A = -\\frac{30}{60}"
      },
      {
        "type": "formula",
        "formula": "A = -0{,}5"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "A imagem se forma a:"
      },
      {
        "type": "formula",
        "formula": "p' = 30\\ \\mathrm{cm}"
      },
      {
        "type": "paragraph",
        "text": "do outro lado da lente."
      },
      {
        "type": "paragraph",
        "text": "O aumento é:"
      },
      {
        "type": "formula",
        "formula": "A = -0{,}5"
      },
      {
        "type": "paragraph",
        "text": "Logo, a imagem é real, invertida e menor."
      }
    ]
  },
  {
    "title": "Exemplo — Vergência",
    "rawTitle": "Exemplo 8 — Vergência",
    "group": "examples",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Uma lente tem vergência $V = -2{,}0\\ \\mathrm{di}$. Determine sua distância focal e diga se ela é convergente ou divergente."
      },
      {
        "type": "subheading",
        "text": "Ideia física"
      },
      {
        "type": "paragraph",
        "text": "Vergência negativa indica lente divergente."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Usamos:"
      },
      {
        "type": "formula",
        "formula": "V = \\frac{1}{f}"
      },
      {
        "type": "paragraph",
        "text": "Logo:"
      },
      {
        "type": "formula",
        "formula": "f = \\frac{1}{V}"
      },
      {
        "type": "paragraph",
        "text": "Substituindo:"
      },
      {
        "type": "formula",
        "formula": "f = \\frac{1}{-2{,}0}"
      },
      {
        "type": "formula",
        "formula": "f = -0{,}50\\ \\mathrm{m}"
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "A distância focal é:"
      },
      {
        "type": "formula",
        "formula": "f = -0{,}50\\ \\mathrm{m}"
      },
      {
        "type": "paragraph",
        "text": "A lente é divergente."
      }
    ]
  },
  {
    "title": "Exemplo — Defeito da visão",
    "rawTitle": "Exemplo 9 — Defeito da visão",
    "group": "examples",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Uma pessoa míope forma a imagem de objetos distantes antes da retina. Que tipo de lente corrige esse defeito?"
      },
      {
        "type": "subheading",
        "text": "Ideia física"
      },
      {
        "type": "paragraph",
        "text": "A miopia corresponde a um sistema óptico excessivamente convergente ou olho alongado. A imagem se forma antes da retina. Precisamos fazer os raios chegarem ao olho menos convergentes."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "A lente adequada é divergente."
      },
      {
        "type": "paragraph",
        "text": "Ela espalha os raios antes de entrarem no olho, deslocando o foco para trás até a retina."
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "A miopia é corrigida com lente divergente."
      }
    ]
  },
  {
    "title": "Exemplo — Problema conceitual de vestibular difícil",
    "rawTitle": "Exemplo 10 — Problema conceitual de vestibular difícil",
    "group": "examples",
    "nodes": [
      {
        "type": "subheading",
        "text": "Enunciado"
      },
      {
        "type": "paragraph",
        "text": "Um raio de luz passa de um meio $A$ para um meio $B$. No meio $B$, a velocidade da luz é menor. Analise as afirmações:"
      },
      {
        "type": "list",
        "items": [
          "O índice de refração do meio $B$ é maior que o do meio $A$.",
          "A frequência da luz diminui ao entrar no meio $B$.",
          "Se a incidência for oblíqua, o raio se aproxima da normal."
        ]
      },
      {
        "type": "paragraph",
        "text": "Determine quais afirmações são corretas."
      },
      {
        "type": "subheading",
        "text": "Resolução"
      },
      {
        "type": "paragraph",
        "text": "Se a velocidade da luz diminui no meio $B$, então, pelo índice:"
      },
      {
        "type": "formula",
        "formula": "n = \\frac{c}{v}"
      },
      {
        "type": "paragraph",
        "text": "menor velocidade implica maior índice de refração. Portanto, a afirmação 1 é correta."
      },
      {
        "type": "paragraph",
        "text": "A frequência da luz não muda na refração. Ela é determinada pela fonte. Portanto, a afirmação 2 é falsa."
      },
      {
        "type": "paragraph",
        "text": "Se o raio vai para um meio de maior índice de refração, então se aproxima da normal. Portanto, a afirmação 3 é correta."
      },
      {
        "type": "subheading",
        "text": "Resposta"
      },
      {
        "type": "paragraph",
        "text": "São corretas:"
      },
      {
        "type": "formula",
        "formula": "1 \\text{ e } 3"
      },
      {
        "type": "subheading",
        "text": "Interpretação"
      },
      {
        "type": "paragraph",
        "text": "A questão mistura três ideias clássicas: índice, frequência e desvio. Esse tipo de mistura é muito comum em vestibulares difíceis."
      }
    ]
  },
  {
    "title": "Armadilhas e erros comuns",
    "rawTitle": "35. Armadilhas e erros comuns",
    "group": "summary",
    "nodes": []
  },
  {
    "title": "Confundir imagem real com imagem virtual",
    "rawTitle": "35.1 Confundir imagem real com imagem virtual",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Imagem real é formada pelo cruzamento efetivo dos raios luminosos e pode ser projetada em uma tela."
      },
      {
        "type": "paragraph",
        "text": "Imagem virtual é formada pelo prolongamento dos raios e não pode ser projetada diretamente."
      },
      {
        "type": "paragraph",
        "text": "Como evitar: pergunte se os raios realmente se cruzam ou se apenas seus prolongamentos se cruzam."
      }
    ]
  },
  {
    "title": "Achar que toda imagem virtual é menor",
    "rawTitle": "35.2 Achar que toda imagem virtual é menor",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Errado."
      },
      {
        "type": "paragraph",
        "text": "Em espelho plano, a imagem virtual tem mesmo tamanho do objeto."
      },
      {
        "type": "paragraph",
        "text": "Em espelho côncavo com objeto entre foco e vértice, a imagem virtual é maior."
      },
      {
        "type": "paragraph",
        "text": "Em lente convergente usada como lupa, a imagem virtual é maior."
      },
      {
        "type": "paragraph",
        "text": "Em espelho convexo e lente divergente, a imagem virtual é menor."
      }
    ]
  },
  {
    "title": "Errar sinal de $p'$, $f$ ou $A$",
    "rawTitle": "35.3 Errar sinal de $p'$, $f$ ou $A$",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Esse erro acontece quando o aluno usa fórmula sem entender o tipo de imagem e o tipo de sistema óptico."
      },
      {
        "type": "paragraph",
        "text": "Como evitar:"
      },
      {
        "type": "list",
        "items": [
          "determine antes se o sistema é convergente ou divergente;",
          "identifique se a imagem é real ou virtual;",
          "confira se o sinal do aumento combina com a orientação."
        ]
      }
    ]
  },
  {
    "title": "Confundir espelho côncavo com convexo",
    "rawTitle": "35.4 Confundir espelho côncavo com convexo",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Espelho côncavo é convergente e pode formar vários tipos de imagem."
      },
      {
        "type": "paragraph",
        "text": "Espelho convexo é divergente e sempre forma imagem virtual, direita e menor."
      }
    ]
  },
  {
    "title": "Confundir lente convergente com divergente",
    "rawTitle": "35.5 Confundir lente convergente com divergente",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "No ar:"
      },
      {
        "type": "list",
        "items": [
          "lente convergente costuma ser mais espessa no centro;",
          "lente divergente costuma ser mais fina no centro."
        ]
      },
      {
        "type": "paragraph",
        "text": "Mas o comportamento depende do meio externo e do índice relativo. Em vestibulares básicos, considera-se lente no ar."
      }
    ]
  },
  {
    "title": "Esquecer que frequência não muda na refração",
    "rawTitle": "35.6 Esquecer que frequência não muda na refração",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Na refração:"
      },
      {
        "type": "list",
        "items": [
          "frequência permanece constante;",
          "velocidade muda;",
          "comprimento de onda muda."
        ]
      },
      {
        "type": "paragraph",
        "text": "Esse erro acontece porque muitos alunos associam cor apenas ao meio. A frequência é determinada pela fonte."
      }
    ]
  },
  {
    "title": "Achar que índice maior significa velocidade maior",
    "rawTitle": "35.7 Achar que índice maior significa velocidade maior",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "É o contrário."
      },
      {
        "type": "paragraph",
        "text": "Como:"
      },
      {
        "type": "formula",
        "formula": "n = \\frac{c}{v}"
      },
      {
        "type": "paragraph",
        "text": "maior índice significa menor velocidade da luz no meio."
      }
    ]
  },
  {
    "title": "Confundir reflexão total com refração comum",
    "rawTitle": "35.8 Confundir reflexão total com refração comum",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Reflexão total só ocorre quando a luz vai do meio mais refringente para o menos refringente e incide com ângulo maior que o limite."
      },
      {
        "type": "paragraph",
        "text": "Se a luz vai do menos para o mais refringente, não ocorre reflexão total."
      }
    ]
  },
  {
    "title": "Aplicar fórmula sem desenhar",
    "rawTitle": "35.9 Aplicar fórmula sem desenhar",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Óptica sem desenho é chute com símbolos."
      },
      {
        "type": "paragraph",
        "text": "Desenhe:"
      },
      {
        "type": "list",
        "items": [
          "raios;",
          "normal;",
          "eixo principal;",
          "foco;",
          "posição do objeto;",
          "posição esperada da imagem."
        ]
      }
    ]
  },
  {
    "title": "Trocar ângulo com a superfície por ângulo com a normal",
    "rawTitle": "35.10 Trocar ângulo com a superfície por ângulo com a normal",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "As leis da reflexão e da refração usam ângulos medidos em relação à normal."
      },
      {
        "type": "paragraph",
        "text": "Se o enunciado der ângulo com a superfície, converta:"
      },
      {
        "type": "formula",
        "formula": "\\theta_{\\text{normal}} = 90^\\circ - \\theta_{\\text{superfície}}"
      }
    ]
  },
  {
    "title": "Misturar centímetros e metros em vergência",
    "rawTitle": "35.11 Misturar centímetros e metros em vergência",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Na vergência:"
      },
      {
        "type": "formula",
        "formula": "V = \\frac{1}{f}"
      },
      {
        "type": "paragraph",
        "text": "a distância focal deve estar em metros."
      },
      {
        "type": "paragraph",
        "text": "Se usar centímetros, o resultado fica errado."
      }
    ]
  },
  {
    "title": "Pontos importantes para ITA, IME e vestibulares difíceis",
    "rawTitle": "36. Pontos importantes para ITA, IME e vestibulares difíceis",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Em provas difíceis, Óptica raramente é só substituição direta."
      },
      {
        "type": "paragraph",
        "text": "Ela costuma misturar:"
      },
      {
        "type": "list",
        "items": [
          "geometria plana;",
          "semelhança de triângulos;",
          "trigonometria;",
          "análise de sinais;",
          "refração em interfaces;",
          "reflexão total;",
          "lentes e espelhos em sequência;",
          "instrumentos ópticos;",
          "interpretação física da imagem;",
          "casos limites."
        ]
      }
    ]
  },
  {
    "title": "Estratégia para questões difíceis",
    "rawTitle": "36.1 Estratégia para questões difíceis",
    "group": "summary",
    "nodes": [
      {
        "type": "subheading",
        "text": "Desenhe primeiro"
      },
      {
        "type": "paragraph",
        "text": "Antes de qualquer fórmula, desenhe o sistema."
      },
      {
        "type": "paragraph",
        "text": "Um desenho ruim ainda é melhor do que fórmula jogada no escuro."
      },
      {
        "type": "subheading",
        "text": "Identifique o elemento óptico"
      },
      {
        "type": "paragraph",
        "text": "Pergunte:"
      },
      {
        "type": "list",
        "items": [
          "é espelho plano?",
          "espelho côncavo?",
          "espelho convexo?",
          "lente convergente?",
          "lente divergente?",
          "interface refratora?",
          "prisma?",
          "lâmina?"
        ]
      },
      {
        "type": "subheading",
        "text": "Marque foco, centro e eixo"
      },
      {
        "type": "paragraph",
        "text": "Em espelhos e lentes, marque:"
      },
      {
        "type": "list",
        "items": [
          "eixo principal;",
          "foco;",
          "centro de curvatura ou centro óptico;",
          "posição do objeto."
        ]
      },
      {
        "type": "subheading",
        "text": "Decida a natureza da imagem antes da conta"
      },
      {
        "type": "paragraph",
        "text": "Antes de calcular, tente prever:"
      },
      {
        "type": "list",
        "items": [
          "real ou virtual?",
          "direita ou invertida?",
          "maior ou menor?",
          "mesmo lado ou lado oposto?"
        ]
      },
      {
        "type": "paragraph",
        "text": "Depois, veja se a conta confirma."
      },
      {
        "type": "subheading",
        "text": "Mantenha coerência de sinais"
      },
      {
        "type": "paragraph",
        "text": "Escolha uma convenção e siga até o fim."
      },
      {
        "type": "subheading",
        "text": "Teste casos limites"
      },
      {
        "type": "paragraph",
        "text": "Pergunte:"
      },
      {
        "type": "list",
        "items": [
          "se o objeto vai para o foco, a imagem vai ao infinito?",
          "se o objeto está muito longe, a imagem vai ao foco?",
          "se o ângulo de incidência é zero, o raio desvia?",
          "se o índice aumenta, o raio aproxima da normal?"
        ]
      },
      {
        "type": "paragraph",
        "text": "Esses testes revelam erros rapidamente."
      }
    ]
  },
  {
    "title": "Mistura de elementos ópticos",
    "rawTitle": "36.2 Mistura de elementos ópticos",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Questões avançadas podem colocar uma lente formando uma imagem que vira objeto para outra lente ou espelho."
      },
      {
        "type": "paragraph",
        "text": "Nesses casos:"
      },
      {
        "type": "list",
        "items": [
          "resolva o primeiro elemento óptico;",
          "encontre a imagem formada;",
          "use essa imagem como objeto para o próximo elemento;",
          "mantenha sinais e posições com cuidado."
        ]
      },
      {
        "type": "paragraph",
        "text": "A imagem de um sistema pode ser objeto real ou virtual para o próximo sistema. Esse tipo de questão separa quem entende de quem só decorou uma tabela e torce para a banca ter piedade."
      }
    ]
  },
  {
    "title": "Resumo final organizado",
    "rawTitle": "37. Resumo final organizado",
    "group": "summary",
    "nodes": []
  },
  {
    "title": "Princípios da Óptica Geométrica",
    "rawTitle": "37.1 Princípios da Óptica Geométrica",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A Óptica Geométrica estuda a luz por meio de raios luminosos."
      },
      {
        "type": "paragraph",
        "text": "Princípios:"
      },
      {
        "type": "list",
        "items": [
          "propagação retilínea da luz;",
          "independência dos raios luminosos;",
          "reversibilidade dos raios luminosos."
        ]
      },
      {
        "type": "paragraph",
        "text": "A propagação retilínea explica:"
      },
      {
        "type": "list",
        "items": [
          "sombras;",
          "eclipses;",
          "câmara escura;",
          "alinhamentos;",
          "formação geométrica de imagens."
        ]
      }
    ]
  },
  {
    "title": "Natureza da luz",
    "rawTitle": "37.2 Natureza da luz",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "A luz é uma onda eletromagnética."
      },
      {
        "type": "paragraph",
        "text": "Relação fundamental:"
      },
      {
        "type": "formula",
        "formula": "v = \\lambda f"
      },
      {
        "type": "paragraph",
        "text": "No vácuo:"
      },
      {
        "type": "formula",
        "formula": "c \\approx 3{,}0 \\times 10^8\\ \\mathrm{m/s}"
      },
      {
        "type": "paragraph",
        "text": "Na refração:"
      },
      {
        "type": "list",
        "items": [
          "a frequência não muda;",
          "a velocidade muda;",
          "o comprimento de onda muda."
        ]
      }
    ]
  },
  {
    "title": "Meios ópticos",
    "rawTitle": "37.3 Meios ópticos",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Meio transparente permite visão nítida."
      },
      {
        "type": "paragraph",
        "text": "Meio translúcido permite passagem parcial da luz, mas sem imagem nítida."
      },
      {
        "type": "paragraph",
        "text": "Meio opaco não permite passagem significativa da luz."
      },
      {
        "type": "paragraph",
        "text": "Meio homogêneo tem propriedades iguais em todos os pontos."
      },
      {
        "type": "paragraph",
        "text": "Meio isotrópico tem propriedades iguais em todas as direções."
      }
    ]
  },
  {
    "title": "Sombra e penumbra",
    "rawTitle": "37.4 Sombra e penumbra",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Com fonte puntiforme, forma-se sombra bem definida."
      },
      {
        "type": "paragraph",
        "text": "Com fonte extensa, aparecem sombra e penumbra."
      },
      {
        "type": "paragraph",
        "text": "Penumbra é região parcialmente iluminada."
      }
    ]
  },
  {
    "title": "Câmara escura",
    "rawTitle": "37.5 Câmara escura",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Relação:"
      },
      {
        "type": "formula",
        "formula": "\\frac{i}{o} = \\frac{p'}{p}"
      },
      {
        "type": "paragraph",
        "text": "A imagem é invertida devido à propagação retilínea da luz."
      }
    ]
  },
  {
    "title": "Reflexão",
    "rawTitle": "37.6 Reflexão",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Leis da reflexão:"
      },
      {
        "type": "formula",
        "formula": "i = r"
      },
      {
        "type": "paragraph",
        "text": "O raio incidente, o raio refletido e a normal pertencem ao mesmo plano."
      },
      {
        "type": "paragraph",
        "text": "Ângulos são medidos em relação à normal."
      },
      {
        "type": "paragraph",
        "text": "Reflexão regular forma imagem nítida."
      },
      {
        "type": "paragraph",
        "text": "Reflexão difusa espalha luz e permite ver objetos comuns."
      }
    ]
  },
  {
    "title": "Espelho plano",
    "rawTitle": "37.7 Espelho plano",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Imagem em espelho plano:"
      },
      {
        "type": "list",
        "items": [
          "virtual;",
          "direita;",
          "mesmo tamanho;",
          "simétrica;",
          "enantiomorfa."
        ]
      },
      {
        "type": "paragraph",
        "text": "Distâncias:"
      },
      {
        "type": "formula",
        "formula": "d_o = d_i"
      },
      {
        "type": "paragraph",
        "text": "Associação de espelhos:"
      },
      {
        "type": "formula",
        "formula": "N = \\frac{360^\\circ}{\\alpha} - 1"
      },
      {
        "type": "paragraph",
        "text": "quando aplicável diretamente."
      }
    ]
  },
  {
    "title": "Espelhos esféricos",
    "rawTitle": "37.8 Espelhos esféricos",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Relação entre foco e raio:"
      },
      {
        "type": "formula",
        "formula": "f = \\frac{R}{2}"
      },
      {
        "type": "paragraph",
        "text": "Equação de Gauss:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{f} = \\frac{1}{p} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "Aumento:"
      },
      {
        "type": "formula",
        "formula": "A = \\frac{i}{o} = -\\frac{p'}{p}"
      },
      {
        "type": "paragraph",
        "text": "Espelho côncavo é convergente."
      },
      {
        "type": "paragraph",
        "text": "Espelho convexo é divergente."
      },
      {
        "type": "paragraph",
        "text": "Espelho convexo sempre forma imagem virtual, direita e menor."
      }
    ]
  },
  {
    "title": "Refração",
    "rawTitle": "37.9 Refração",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Índice de refração:"
      },
      {
        "type": "formula",
        "formula": "n = \\frac{c}{v}"
      },
      {
        "type": "paragraph",
        "text": "Maior índice significa menor velocidade."
      },
      {
        "type": "paragraph",
        "text": "Lei de Snell-Descartes:"
      },
      {
        "type": "formula",
        "formula": "n_1 \\sin i = n_2 \\sin r"
      },
      {
        "type": "paragraph",
        "text": "Do meio menos refringente para o mais refringente, o raio aproxima da normal."
      },
      {
        "type": "paragraph",
        "text": "Do meio mais refringente para o menos refringente, o raio afasta da normal."
      }
    ]
  },
  {
    "title": "Reflexão total",
    "rawTitle": "37.10 Reflexão total",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Condições:"
      },
      {
        "type": "list",
        "items": [
          "luz indo do meio mais refringente para o menos refringente;",
          "ângulo de incidência maior que o ângulo limite."
        ]
      },
      {
        "type": "paragraph",
        "text": "Ângulo limite:"
      },
      {
        "type": "formula",
        "formula": "\\sin L = \\frac{n_2}{n_1}"
      },
      {
        "type": "paragraph",
        "text": "com:"
      },
      {
        "type": "formula",
        "formula": "n_1 > n_2"
      },
      {
        "type": "paragraph",
        "text": "Aplicações:"
      },
      {
        "type": "list",
        "items": [
          "fibra óptica;",
          "prismas;",
          "miragens;",
          "brilho de diamantes."
        ]
      }
    ]
  },
  {
    "title": "Dioptro plano",
    "rawTitle": "37.11 Dioptro plano",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Para observação quase normal:"
      },
      {
        "type": "formula",
        "formula": "\\frac{h'}{h} = \\frac{n_{\\text{observador}}}{n_{\\text{objeto}}}"
      },
      {
        "type": "paragraph",
        "text": "Objeto na água visto do ar parece mais raso."
      }
    ]
  },
  {
    "title": "Lâmina de faces paralelas",
    "rawTitle": "37.12 Lâmina de faces paralelas",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "O raio emergente sai paralelo ao incidente, mas deslocado lateralmente."
      },
      {
        "type": "paragraph",
        "text": "Desvio lateral:"
      },
      {
        "type": "formula",
        "formula": "d = e \\frac{\\sin(i-r)}{\\cos r}"
      }
    ]
  },
  {
    "title": "Prismas",
    "rawTitle": "37.13 Prismas",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Prismas desviam raios por refração."
      },
      {
        "type": "paragraph",
        "text": "A luz branca se dispersa porque diferentes cores têm diferentes índices de refração no material."
      },
      {
        "type": "paragraph",
        "text": "Em meios comuns:"
      },
      {
        "type": "list",
        "items": [
          "vermelho desvia menos;",
          "violeta desvia mais."
        ]
      }
    ]
  },
  {
    "title": "Lentes",
    "rawTitle": "37.14 Lentes",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Lente convergente:"
      },
      {
        "type": "list",
        "items": [
          "$f > 0$;",
          "pode formar imagens reais ou virtuais;",
          "usada em lupas, câmeras, projetores e correção da hipermetropia."
        ]
      },
      {
        "type": "paragraph",
        "text": "Lente divergente:"
      },
      {
        "type": "list",
        "items": [
          "$f < 0$;",
          "forma imagem virtual, direita e menor;",
          "usada na correção da miopia."
        ]
      },
      {
        "type": "paragraph",
        "text": "Equação das lentes:"
      },
      {
        "type": "formula",
        "formula": "\\frac{1}{f} = \\frac{1}{p} + \\frac{1}{p'}"
      },
      {
        "type": "paragraph",
        "text": "Aumento:"
      },
      {
        "type": "formula",
        "formula": "A = \\frac{i}{o} = -\\frac{p'}{p}"
      }
    ]
  },
  {
    "title": "Vergência",
    "rawTitle": "37.15 Vergência",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Vergência:"
      },
      {
        "type": "formula",
        "formula": "V = \\frac{1}{f}"
      },
      {
        "type": "paragraph",
        "text": "com $f$ em metros."
      },
      {
        "type": "paragraph",
        "text": "Unidade:"
      },
      {
        "type": "formula",
        "formula": "1\\ \\mathrm{di} = 1\\ \\mathrm{m^{-1}}"
      },
      {
        "type": "paragraph",
        "text": "Lente convergente:"
      },
      {
        "type": "formula",
        "formula": "V > 0"
      },
      {
        "type": "paragraph",
        "text": "Lente divergente:"
      },
      {
        "type": "formula",
        "formula": "V < 0"
      },
      {
        "type": "paragraph",
        "text": "Associação de lentes justapostas:"
      },
      {
        "type": "formula",
        "formula": "V_{\\text{eq}} = V_1 + V_2 + V_3 + \\cdots"
      }
    ]
  },
  {
    "title": "Instrumentos ópticos",
    "rawTitle": "37.16 Instrumentos ópticos",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Lupa: lente convergente formando imagem virtual ampliada."
      },
      {
        "type": "paragraph",
        "text": "Microscópio: objetiva forma imagem real ampliada; ocular amplia novamente."
      },
      {
        "type": "paragraph",
        "text": "Luneta: objetiva forma imagem de objeto distante; ocular amplia."
      },
      {
        "type": "paragraph",
        "text": "Telescópio: pode usar lentes ou espelhos para coletar luz."
      },
      {
        "type": "paragraph",
        "text": "Câmera: lente convergente forma imagem real no sensor."
      },
      {
        "type": "paragraph",
        "text": "Projetor: lente forma imagem real ampliada na tela."
      },
      {
        "type": "paragraph",
        "text": "Olho humano: sistema convergente que forma imagem real na retina."
      }
    ]
  },
  {
    "title": "Visão",
    "rawTitle": "37.17 Visão",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Miopia:"
      },
      {
        "type": "list",
        "items": [
          "imagem se forma antes da retina;",
          "corrigida por lente divergente."
        ]
      },
      {
        "type": "paragraph",
        "text": "Hipermetropia:"
      },
      {
        "type": "list",
        "items": [
          "imagem tenderia a se formar depois da retina;",
          "corrigida por lente convergente."
        ]
      },
      {
        "type": "paragraph",
        "text": "Presbiopia:"
      },
      {
        "type": "list",
        "items": [
          "perda de acomodação;",
          "corrigida com lentes adequadas para perto."
        ]
      },
      {
        "type": "paragraph",
        "text": "Astigmatismo:"
      },
      {
        "type": "list",
        "items": [
          "focalização diferente em planos diferentes;",
          "corrigido por lentes cilíndricas."
        ]
      }
    ]
  },
  {
    "title": "Erros comuns",
    "rawTitle": "37.18 Erros comuns",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Cuidado com:"
      },
      {
        "type": "list",
        "items": [
          "imagem real versus virtual;",
          "ângulo medido com a normal;",
          "sinais de $f$, $p'$ e $A$;",
          "frequência na refração;",
          "índice de refração e velocidade;",
          "reflexão total;",
          "vergência com $f$ em metros;",
          "uso de fórmula sem desenho;",
          "confusão entre lente convergente e divergente;",
          "confusão entre espelho côncavo e convexo."
        ]
      }
    ]
  },
  {
    "title": "Estratégia final de prova",
    "rawTitle": "37.19 Estratégia final de prova",
    "group": "summary",
    "nodes": [
      {
        "type": "paragraph",
        "text": "Para resolver Óptica bem:"
      },
      {
        "type": "list",
        "items": [
          "desenhe a situação;",
          "identifique o fenômeno;",
          "marque normal, eixo, foco e centro quando necessário;",
          "preveja qualitativamente a imagem ou o desvio;",
          "escolha a fórmula;",
          "mantenha unidades e sinais coerentes;",
          "interprete fisicamente o resultado."
        ]
      },
      {
        "type": "paragraph",
        "text": "Óptica não é uma coleção de fórmulas soltas. É geometria da luz. Quem entende os caminhos da luz, os raios notáveis, a relação entre refração e velocidade, e a diferença entre imagem real e virtual resolve muito mais do que quem só decora tabela."
      }
    ]
  }
];

const formulaSummary: FormulaSummary[] = [
  {
    "title": "Relação fundamental da onda",
    "formula": "v = \\lambda f",
    "description": "Liga velocidade, comprimento de onda e frequência da luz."
  },
  {
    "title": "Velocidade da luz no vácuo",
    "formula": "c \\approx 3{,}0 \\times 10^8\\ \\mathrm{m/s}",
    "description": "Constante usada como referência para definir índice de refração."
  },
  {
    "title": "Índice de refração absoluto",
    "formula": "n = \\frac{c}{v}",
    "description": "Quanto maior o índice, menor a velocidade da luz no meio."
  },
  {
    "title": "Câmara escura",
    "formula": "\\frac{i}{o} = \\frac{p'}{p}",
    "description": "Relação de semelhança de triângulos entre imagem, objeto e distâncias."
  },
  {
    "title": "Leis da reflexão",
    "formula": "i = r",
    "description": "Ângulos medidos em relação à normal, não em relação à superfície."
  },
  {
    "title": "Espelhos planos associados",
    "formula": "N = \\frac{360^\\circ}{\\alpha} - 1",
    "description": "Número de imagens para casos simétricos e divisão inteira."
  },
  {
    "title": "Foco do espelho esférico",
    "formula": "f = \\frac{R}{2}",
    "description": "Válida para espelhos esféricos de pequena abertura."
  },
  {
    "title": "Equação de Gauss",
    "formula": "\\frac{1}{f} = \\frac{1}{p} + \\frac{1}{p'}",
    "description": "Relaciona foco, posição do objeto e posição da imagem."
  },
  {
    "title": "Aumento linear transversal",
    "formula": "A = \\frac{i}{o} = -\\frac{p'}{p}",
    "description": "O sinal indica orientação; o módulo indica ampliação ou redução."
  },
  {
    "title": "Lei de Snell-Descartes",
    "formula": "n_1 \\sin i = n_2 \\sin r",
    "description": "Relaciona índices de refração e ângulos medidos pela normal."
  },
  {
    "title": "Ângulo limite",
    "formula": "\\sin L = \\frac{n_2}{n_1}",
    "description": "Só vale quando a luz passa do meio mais refringente para o menos refringente."
  },
  {
    "title": "Profundidade aparente",
    "formula": "\\frac{h'}{h} = \\frac{n_{\\text{observador}}}{n_{\\text{objeto}}}",
    "description": "Explica por que objetos submersos parecem mais rasos."
  },
  {
    "title": "Desvio lateral em lâmina",
    "formula": "d = e\\frac{\\sin(i-r)}{\\cos r}",
    "description": "Mostra o deslocamento lateral em lâminas de faces paralelas."
  },
  {
    "title": "Vergência",
    "formula": "V = \\frac{1}{f}",
    "description": "Mede o poder de convergência ou divergência da lente, com f em metros."
  },
  {
    "title": "Associação de lentes",
    "formula": "V_{\\text{eq}} = V_1 + V_2 + \\cdots",
    "description": "Para lentes delgadas justapostas, somamos as vergências."
  }
];

const sectionIcons: ElementType[] = [
  Sparkles,
  Eye,
  Waves,
  Compass,
  Layers,
  Lightbulb,
  BookOpen,
  ScanLine,
  Rainbow,
  Telescope,
  Glasses,
  Microscope,
  Calculator,
  Target,
  ShieldCheck,
  Brain,
  Zap,
  Orbit,
];

const sectionAccents = [
  "from-orange-600 via-amber-500 to-yellow-500",
  "from-sky-600 via-cyan-500 to-blue-500",
  "from-violet-600 via-purple-500 to-fuchsia-500",
  "from-emerald-600 via-teal-500 to-cyan-500",
  "from-rose-600 via-pink-500 to-orange-500",
  "from-slate-800 via-slate-700 to-slate-900",
];

const tabItems: Array<{ id: Tab; label: string; description: string }> = [
  {
    id: "teoria",
    label: "Teoria completa",
    description: "fundamentos, espelhos, refração, lentes e visão",
  },
  {
    id: "exemplos",
    label: "Exemplos resolvidos",
    description: "contas comentadas e interpretação física",
  },
  {
    id: "resumo",
    label: "Resumo e prova",
    description: "fórmulas, armadilhas e estratégia ITA/IME",
  },
];

function FormulaBlock({ formula }: { formula: string }) {
  return (
    <div className="my-5 overflow-x-auto rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-5 shadow-[0_18px_45px_rgba(15,23,42,0.24)]">
      <div className="text-slate-100 [&_.katex]:text-slate-100 [&_.katex-display]:my-0">
        <MathFormula formula={formula} display={true} />
      </div>
    </div>
  );
}

function InlineMathText({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/g).filter(Boolean);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          return (
            <MathFormula
              key={index}
              formula={part.slice(1, -1)}
              inline={true}
              className="text-slate-900 [&_.katex]:text-slate-900"
            />
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function DarkInlineMathText({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/g).filter(Boolean);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          return (
            <MathFormula
              key={index}
              formula={part.slice(1, -1)}
              inline={true}
              className="text-slate-100 [&_.katex]:text-slate-100"
            />
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function SectionCard({
  icon: Icon,
  title,
  accent,
  children,
  defaultOpen = false,
}: {
  icon: ElementType;
  title: string;
  accent: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={`flex w-full items-center justify-between gap-4 bg-gradient-to-r ${accent} px-6 py-5 text-left md:px-8`}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/20 bg-white/15 p-2">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white md:text-2xl">
            <DarkInlineMathText text={title} />
          </h2>
        </div>
        <div className="rounded-full bg-white/15 p-2 text-white">
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {isOpen && <div className="space-y-5 p-6 md:p-8">{children}</div>}
    </section>
  );
}

function FormulaSummaryCard({ item }: { item: FormulaSummary }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_18px_45px_rgba(15,23,42,0.25)]">
      <div className="border-b border-slate-700 px-5 py-4">
        <h3 className="text-base font-black text-blue-300">{item.title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">{item.description}</p>
      </div>
      <div className="overflow-x-auto px-4 py-6 text-slate-100 [&_.katex]:text-slate-100 [&_.katex-display]:my-0">
        <MathFormula formula={item.formula} display={true} />
      </div>
    </div>
  );
}

function NodeRenderer({ node }: { node: ContentNode }) {
  if (node.type === "paragraph") {
    return (
      <p className="text-base leading-8 text-slate-700 md:text-[1.02rem]">
        <InlineMathText text={node.text} />
      </p>
    );
  }

  if (node.type === "subheading") {
    return (
      <h3 className="pt-4 text-lg font-black tracking-tight text-slate-900 md:text-xl">
        <InlineMathText text={node.text} />
      </h3>
    );
  }

  if (node.type === "formula") {
    return <FormulaBlock formula={node.formula} />;
  }

  if (node.type === "list") {
    return (
      <ul className="grid gap-3 md:grid-cols-2">
        {node.items.map((item, index) => (
          <li
            key={index}
            className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700"
          >
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
            <span>
              <InlineMathText text={item} />
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-100">
          <tr>
            {node.headers.map((header, index) => (
              <th key={index} className="px-4 py-3 text-left font-black text-slate-900">
                <InlineMathText text={header} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {node.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-orange-50/50">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 leading-7 text-slate-700">
                  <InlineMathText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContentSectionBlock({ section, index }: { section: ContentSection; index: number }) {
  const Icon = sectionIcons[index % sectionIcons.length];
  const accent = sectionAccents[index % sectionAccents.length];
  const defaultOpen = index < 3;

  return (
    <SectionCard icon={Icon} title={section.title} accent={accent} defaultOpen={defaultOpen}>
      {section.nodes.length === 0 ? (
        <p className="text-base leading-8 text-slate-700">
          Esta parte organiza os blocos seguintes da explicação.
        </p>
      ) : (
        section.nodes.map((node, nodeIndex) => (
          <NodeRenderer key={`${section.title}-${nodeIndex}`} node={node} />
        ))
      )}
    </SectionCard>
  );
}

function HeroFormulaPanel() {
  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-950/85 p-5 text-slate-100 shadow-2xl backdrop-blur md:p-7">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-orange-500/15 p-2 text-orange-300">
          <Waves className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-black">A luz em três leituras</h3>
          <p className="text-sm text-slate-400">raio, onda e energia</p>
        </div>
      </div>

      <div className="grid gap-3">
        {[
          { label: "Onda", formula: "v = \\lambda f" },
          { label: "Índice", formula: "n = \\frac{c}{v}" },
          { label: "Snell", formula: "n_1\\sin i = n_2\\sin r" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-orange-300">
              {item.label}
            </p>
            <div className="text-slate-100 [&_.katex]:text-slate-100 [&_.katex-display]:my-0">
              <MathFormula formula={item.formula} display={true} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OpticaTopicConceitos() {
  const [activeTab, setActiveTab] = useState<Tab>("teoria");

  const groupedSections = useMemo(() => {
    const theory = contentSections.filter((section) => section.group === "theory");
    const examples = contentSections.filter((section) => section.group === "examples");
    const summary = contentSections.filter((section) => section.group === "summary");

    return { theory, examples, summary };
  }, []);

  const activeSections =
    activeTab === "teoria"
      ? groupedSections.theory
      : activeTab === "exemplos"
        ? groupedSections.examples.filter((section) => section.nodes.length > 0)
        : groupedSections.summary;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/70 to-yellow-50">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
        <div className="container flex items-center justify-between gap-4 py-4">
          <Link
            href="/optica"
            className="flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-orange-700"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar para Óptica
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-yellow-400 text-white shadow-lg">
              <Eye className="h-6 w-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black text-slate-900">Óptica</h1>
              <p className="text-xs font-semibold text-slate-500">guia completo para vestibulares fortes</p>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.18),transparent_32%)]" />
        <div className="container relative grid gap-10 py-14 md:grid-cols-[1.15fr_0.85fr] md:items-center md:py-20">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-orange-400/10 px-4 py-2 text-sm font-bold text-orange-200">
              <Sparkles className="h-4 w-4" />
              Óptica geométrica, instrumentos e visão
            </div>

            <div className="space-y-5">
              <h2 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                Luz, imagem e desvio sem virar decoreba de fórmula
              </h2>
              <p className="max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
                Esta página organiza a explicação completa de Óptica em blocos de aula: fundamentos, reflexão,
                espelhos, refração, lentes, instrumentos ópticos, visão, exemplos resolvidos e estratégia de prova.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Blocos teóricos", value: groupedSections.theory.length },
                { label: "Exemplos", value: groupedSections.examples.filter((section) => section.nodes.length > 0).length },
                { label: "Fórmulas-chave", value: formulaSummary.length },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-3xl font-black text-white">{item.value}</p>
                  <p className="text-sm font-semibold text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <HeroFormulaPanel />
        </div>
      </section>

      <main className="container py-10 md:py-14">
        <div className="mb-8 grid gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_16px_45px_rgba(15,23,42,0.08)] md:grid-cols-3">
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl px-5 py-4 text-left transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-orange-600 to-yellow-500 text-white shadow-lg"
                  : "bg-slate-50 text-slate-700 hover:bg-orange-50"
              }`}
            >
              <span className="block text-base font-black">{tab.label}</span>
              <span className={`mt-1 block text-sm ${activeTab === tab.id ? "text-orange-50" : "text-slate-500"}`}>
                {tab.description}
              </span>
            </button>
          ))}
        </div>

        {activeTab === "resumo" && (
          <div className="mb-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {formulaSummary.map((item) => (
              <FormulaSummaryCard key={item.title} item={item} />
            ))}
          </div>
        )}

        {activeTab === "teoria" && (
          <div className="mb-8 rounded-3xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
            <div className="flex gap-4">
              <div className="hidden rounded-2xl bg-orange-500/15 p-3 text-orange-700 sm:block">
                <Lightbulb className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900">Como estudar esta página</h2>
                <p className="leading-8 text-slate-700">
                  A ordem foi reorganizada para ficar mais natural: primeiro a natureza da luz e os princípios,
                  depois reflexão, espelhos, refração, lentes, instrumentos e visão. É a sequência menos criminosa
                  para quem quer entender em vez de só colecionar fórmula no caderno.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "exemplos" && (
          <div className="mb-8 rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
            <div className="flex gap-4">
              <div className="hidden rounded-2xl bg-blue-500/15 p-3 text-blue-700 sm:block">
                <Calculator className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900">Exemplos com ideia física antes da conta</h2>
                <p className="leading-8 text-slate-700">
                  A conta aparece, mas não manda sozinha. Em Óptica, desenho, sinal e interpretação valem quase tanto
                  quanto substituir número. Fórmula sem desenho é só superstição com fração.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {activeSections.map((section, index) => (
            <ContentSectionBlock key={`${activeTab}-${section.title}-${index}`} section={section} index={index} />
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-7 text-slate-100 shadow-[0_24px_70px_rgba(15,23,42,0.28)] md:p-9">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl space-y-3">
              <h2 className="text-2xl font-black md:text-3xl">Fechamento de Óptica</h2>
              <p className="leading-8 text-slate-300">
                O núcleo da matéria é simples: acompanhe o caminho da luz, respeite a normal, desenhe antes de calcular
                e mantenha a convenção de sinais. O resto é o teatro humano de transformar geometria em sofrimento.
              </p>
            </div>
            <div className="grid gap-3 text-sm font-bold text-slate-300 sm:grid-cols-2 md:min-w-[320px] md:grid-cols-1">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                <DarkInlineMathText text="Frequência não muda na refração: $f$ fica constante." />
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                <DarkInlineMathText text="Ângulos de reflexão e refração são sempre medidos pela normal." />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
