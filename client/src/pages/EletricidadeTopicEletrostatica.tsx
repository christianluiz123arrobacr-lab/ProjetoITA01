import type { ReactNode } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Info,
  Lightbulb,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MathFormula } from "@/components/MathFormula";

type SectionProps = {
  number: number;
  title: string;
  children: ReactNode;
};

type BoxProps = {
  title?: string;
  children: ReactNode;
  variant?: "info" | "warning" | "success" | "tip" | "dark";
};

function Section({ number, title, children }: SectionProps) {
  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-yellow-500 text-white font-black">
          {number}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-2xl md:text-3xl font-black text-slate-950 mb-5">
            {title}
          </h2>

          <div className="space-y-5 text-slate-700 leading-8">{children}</div>
        </div>
      </div>
    </section>
  );
}

function SubTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xl md:text-2xl font-black text-slate-900 pt-3">
      {children}
    </h3>
  );
}

function Box({ title, children, variant = "info" }: BoxProps) {
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-950",
    warning: "border-orange-200 bg-orange-50 text-orange-950",
    success: "border-emerald-200 bg-emerald-50 text-emerald-950",
    tip: "border-yellow-200 bg-yellow-50 text-yellow-950",
    dark: "border-slate-700 bg-slate-950 text-slate-100",
  };

  const Icon =
    variant === "warning"
      ? AlertTriangle
      : variant === "success"
        ? CheckCircle2
        : variant === "tip"
          ? Lightbulb
          : Info;

  return (
    <div className={`rounded-2xl border p-5 ${styles[variant]}`}>
      {title && (
        <div className="mb-3 flex items-center gap-2 font-black">
          <Icon className="h-5 w-5 shrink-0" />
          <span>{title}</span>
        </div>
      )}

      <div className="space-y-3 text-sm md:text-base leading-7">{children}</div>
    </div>
  );
}

function FormulaBox({
  formula,
  note,
}: {
  formula: string;
  note?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <MathFormula formula={formula} className="text-lg" />
      {note && <div className="mt-3 text-sm text-slate-600">{note}</div>}
    </div>
  );
}

function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ExampleCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-5 md:p-6 border-slate-200 bg-slate-50">
      <h4 className="text-lg font-black text-slate-950 mb-4">{title}</h4>
      <div className="space-y-4 text-slate-700 leading-8">{children}</div>
    </Card>
  );
}

export default function EletricidadeTopicEletrostatica() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-slate-50 to-orange-50">
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/70">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/eletricidade">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>

            <div>
              <h1 className="text-xl font-black text-slate-900">
                Eletricidade
              </h1>
              <p className="text-xs text-slate-600">Eletrostática</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 md:py-12 max-w-6xl">
        <section className="mb-8 rounded-[2rem] border border-yellow-200 bg-white p-6 md:p-10 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 text-sm font-black text-yellow-900">
                <BookOpen className="h-4 w-4" />
                Teoria completa
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-950">
                Eletrostática
              </h1>

              <p className="mt-5 text-lg leading-8 text-slate-700">
                Estudo das cargas elétricas em repouso e dos efeitos produzidos
                por elas: forças elétricas, campos, potenciais, energia,
                eletrização, condutores em equilíbrio e fenômenos clássicos como
                blindagem eletrostática e poder das pontas.
              </p>
            </div>

            <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-5 max-w-sm">
              <p className="text-sm font-black text-yellow-900 mb-2">
                Ideia central
              </p>

              <p className="text-sm leading-7 text-slate-700">
                Eletrostática não é uma lista de fórmulas. É o estudo de como a
                carga elétrica organiza interações, campos e energia no espaço.
              </p>
            </div>
          </div>
        </section>

        <div className="space-y-8">
          <Section number={1} title="Contexto físico e histórico">
            <p>
              A Eletrostática é a parte da Eletricidade que estuda as cargas
              elétricas em repouso e os efeitos produzidos por elas. Quando
              falamos em cargas “em repouso”, o foco não está em correntes
              elétricas permanentes atravessando circuitos, nem em campos
              magnéticos variáveis, nem em motores, resistores ou geradores. O
              objetivo é entender como corpos eletrizados interagem, como
              produzem forças, como criam campos elétricos, como armazenam
              energia e como se comportam em equilíbrio.
            </p>

            <p>
              A palavra eletrostática junta duas ideias: “eletro”, ligada aos
              fenômenos elétricos, e “estática”, ligada a uma situação sem
              movimento macroscópico permanente de cargas. Isso não significa
              que nada microscópico aconteça. Em um metal, por exemplo, elétrons
              livres podem se reorganizar rapidamente até que o equilíbrio
              eletrostático seja atingido.
            </p>

            <p>
              Historicamente, fenômenos elétricos foram observados muito antes
              de serem compreendidos. Na Grécia antiga, já se sabia que o âmbar,
              ao ser atritado com certos materiais, podia atrair pequenos corpos.
              Em grego, âmbar era chamado de <em>élektron</em>, origem de termos
              como elétron e eletricidade.
            </p>

            <p>
              Com o avanço da experimentação, cientistas como William Gilbert,
              Benjamin Franklin, Charles Coulomb, Faraday e Maxwell ajudaram a
              transformar observações curiosas em uma teoria física profunda.
              Franklin consolidou a linguagem de cargas positivas e negativas.
              Coulomb quantificou a força elétrica entre corpos carregados.
              Faraday trouxe a ideia de campo como algo físico e não apenas como
              um artifício matemático.
            </p>

            <Box title="Por que esse conteúdo importa?" variant="tip">
              <p>
                A Eletrostática é base para Campo Elétrico, Potencial Elétrico,
                Capacitores, Eletrodinâmica e Eletromagnetismo. Se essa base fica
                fraca, o aluno passa o resto da Eletricidade tentando decorar
                fórmula sem saber o que está acontecendo. Uma tragédia acadêmica
                bem comum, infelizmente.
              </p>
            </Box>

            <BulletList
              items={[
                "choques ao tocar maçanetas em dias secos;",
                "balão grudando na parede depois de ser atritado;",
                "cabelos arrepiados por cargas de mesmo sinal;",
                "faíscas ao tirar um casaco de lã;",
                "raios em tempestades;",
                "blindagem eletrostática em carros e cabos;",
                "funcionamento de impressoras, copiadoras e para-raios.",
              ]}
            />

            <p>
              O objetivo real da Eletrostática é entender uma cadeia de ideias:
              a matéria possui cargas elétricas; essas cargas podem estar
              equilibradas ou em excesso; corpos eletrizados interagem; essa
              interação pode ser descrita por forças; cargas criam campos no
              espaço; campos podem realizar trabalho; configurações de cargas
              armazenam energia; e condutores respondem de maneira especial
              porque possuem cargas livres.
            </p>
          </Section>

          <Section number={2} title="Ideia intuitiva de carga elétrica">
            <p>
              Carga elétrica é uma propriedade da matéria associada às
              interações elétricas. Assim como a massa está associada à
              interação gravitacional, a carga elétrica está associada à
              interação elétrica.
            </p>

            <p>
              A diferença é importante: a gravidade clássica entre massas é
              sempre atrativa, enquanto a interação elétrica pode ser atrativa ou
              repulsiva. Isso acontece porque existem dois tipos de carga:
              positiva e negativa.
            </p>

            <FormulaBox
              formula="e = 1{,}6 \times 10^{-19} \ \text{C}"
              note="Esse é o valor aproximado da carga elétrica elementar."
            />

            <div className="grid gap-4 md:grid-cols-3">
              <Box title="Próton" variant="success">
                <p>Fica no núcleo do átomo e possui carga positiva.</p>
                <MathFormula formula="q_p = +e" />
              </Box>

              <Box title="Elétron" variant="info">
                <p>Fica na eletrosfera e possui carga negativa.</p>
                <MathFormula formula="q_e = -e" />
              </Box>

              <Box title="Nêutron" variant="tip">
                <p>Fica no núcleo e não possui carga elétrica resultante.</p>
                <MathFormula formula="q_n = 0" />
              </Box>
            </div>

            <p>
              Um corpo eletricamente neutro não é um corpo sem cargas. Ele possui
              cargas positivas e negativas em quantidades equivalentes, de modo
              que a soma algébrica das cargas seja zero.
            </p>

            <FormulaBox formula="Q = N(+e) + N(-e) = 0" />

            <p>
              Um corpo positivamente eletrizado possui falta de elétrons. Isso
              acontece quando ele perde elétrons. Um corpo negativamente
              eletrizado possui excesso de elétrons. Isso acontece quando ele
              ganha elétrons.
            </p>

            <Box title="Erro clássico" variant="warning">
              <p>
                Quando um corpo fica positivo, ele não ganhou prótons. Nos
                processos comuns de eletrização, normalmente quem se desloca são
                os elétrons. Os prótons estão presos no núcleo atômico. Tirar
                prótons de um corpo seria outro tipo de processo, ligado à Física
                Nuclear, não à eletrização comum.
              </p>
            </Box>

            <BulletList
              items={[
                "corpo neutro: número de prótons igual ao número de elétrons;",
                "corpo positivo: perdeu elétrons;",
                "corpo negativo: ganhou elétrons.",
              ]}
            />
          </Section>

          <Section number={3} title="Princípios fundamentais da carga elétrica">
            <SubTitle>3.1 Atração e repulsão</SubTitle>

            <p>
              Cargas elétricas de mesmo sinal se repelem. Cargas elétricas de
              sinais opostos se atraem.
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              <FormulaBox formula="(+,+) \Rightarrow \text{repulsão}" />
              <FormulaBox formula="(-,-) \Rightarrow \text{repulsão}" />
              <FormulaBox formula="(+,-) \Rightarrow \text{atração}" />
            </div>

            <p>
              Esse princípio parece simples, mas pode enganar. Se um corpo
              eletrizado atrai um corpo neutro, isso não significa
              necessariamente que o corpo neutro tenha carga oposta. Corpos
              neutros podem ser atraídos por eletrização induzida ou por
              polarização.
            </p>

            <Box title="Cuidado conceitual" variant="warning">
              <p>
                A frase “se atrai, então tem sinal oposto” só é segura para
                cargas puntiformes já eletrizadas. Em corpos extensos, neutros ou
                polarizáveis, a redistribuição de cargas também pode gerar
                atração.
              </p>
            </Box>

            <SubTitle>3.2 Conservação da carga elétrica</SubTitle>

            <p>
              A carga elétrica total de um sistema eletricamente isolado se
              conserva. Em processos comuns, carga elétrica não é criada nem
              destruída. Ela é transferida ou redistribuída.
            </p>

            <FormulaBox formula="\sum Q_{\text{antes}} = \sum Q_{\text{depois}}" />

            <p>
              Se dois corpos inicialmente neutros são atritados e um deles fica
              com carga $+Q$, o outro deve ficar com carga $-Q$, desde que o
              sistema esteja isolado. A carga total continua sendo zero.
            </p>

            <FormulaBox formula="(+Q) + (-Q) = 0" />

            <SubTitle>3.3 Quantização da carga elétrica</SubTitle>

            <p>
              A carga elétrica é quantizada. Isso significa que ela aparece em
              múltiplos inteiros da carga elementar.
            </p>

            <FormulaBox formula="Q = \pm ne" />

            <p>
              Aqui, $n$ representa a quantidade de cargas elementares
              transferidas e deve ser um número inteiro. O sinal de $Q$ depende
              do processo físico: se o corpo perdeu elétrons, $Q$ é positivo; se
              ganhou elétrons, $Q$ é negativo.
            </p>

            <Box title="Exemplo rápido" variant="info">
              <p>
                Se um corpo ganhou $2 \times 10^{13}$ elétrons, sua carga será
                negativa:
              </p>

              <MathFormula formula="Q = -ne" />
              <MathFormula formula="Q = -(2 \times 10^{13})(1{,}6 \times 10^{-19})" />
              <MathFormula formula="Q = -3{,}2 \times 10^{-6} \ \text{C}" />
            </Box>
          </Section>

          <Section number={4} title="Condutores, isolantes e semicondutores">
            <SubTitle>Condutores</SubTitle>

            <p>
              Condutores são materiais que possuem cargas elétricas livres para
              se movimentar com relativa facilidade. Nos metais, essas cargas
              móveis são principalmente os elétrons livres.
            </p>

            <BulletList
              items={[
                "cobre;",
                "alumínio;",
                "prata;",
                "ouro;",
                "ferro;",
                "grafite;",
                "soluções iônicas;",
                "gases ionizados.",
              ]}
            />

            <p>
              Em um condutor eletrizado em equilíbrio, o excesso de carga se
              distribui na superfície externa. Isso acontece porque as cargas
              livres se repelem e se reorganizam até atingir uma configuração de
              equilíbrio.
            </p>

            <SubTitle>Isolantes</SubTitle>

            <p>
              Isolantes são materiais nos quais as cargas não se movem
              livremente pelo material. Isso não significa que eles não tenham
              cargas. Todo material comum possui prótons e elétrons. A diferença
              é a mobilidade dessas cargas.
            </p>

            <BulletList
              items={[
                "vidro;",
                "borracha;",
                "plástico;",
                "madeira seca;",
                "ar seco;",
                "porcelana;",
                "lã;",
                "seda;",
                "isopor.",
              ]}
            />

            <SubTitle>Semicondutores</SubTitle>

            <p>
              Semicondutores têm comportamento intermediário entre condutores e
              isolantes. Exemplos clássicos são o silício e o germânio. Sua
              condutividade pode ser controlada, o que os torna fundamentais em
              diodos, transistores, processadores, sensores e microchips.
            </p>
          </Section>

          <Section number={5} title="Processos de eletrização">
            <p>
              Eletrizar um corpo significa alterar o equilíbrio entre suas
              cargas positivas e negativas. Em processos comuns, isso ocorre por
              transferência ou redistribuição de elétrons.
            </p>

            <SubTitle>5.1 Eletrização por atrito</SubTitle>

            <p>
              A eletrização por atrito ocorre quando dois corpos de materiais
              diferentes são atritados entre si e trocam elétrons. Um corpo perde
              elétrons e fica positivo; o outro ganha elétrons e fica negativo.
            </p>

            <FormulaBox formula="Q_{\text{antes}} = Q_{\text{depois}}" />

            <p>
              Exemplos comuns são pente e cabelo, balão e cabelo, vidro e seda,
              plástico e lã. A série triboelétrica organiza materiais de acordo
              com a tendência de perder ou ganhar elétrons, mas o ponto principal
              não é decorar a lista. O ponto é entender que materiais diferentes
              seguram elétrons com intensidades diferentes.
            </p>

            <SubTitle>5.2 Eletrização por contato</SubTitle>

            <p>
              A eletrização por contato ocorre quando um corpo eletrizado toca
              outro corpo condutor. Durante o contato, cargas se redistribuem até
              que o sistema atinja equilíbrio.
            </p>

            <p>
              Para duas esferas condutoras idênticas, a carga total se divide
              igualmente:
            </p>

            <FormulaBox formula="Q_f = \frac{Q_1 + Q_2}{2}" />

            <Box title="Limitação da fórmula" variant="warning">
              <p>
                Essa expressão vale diretamente para dois condutores idênticos,
                isolados e colocados em contato. Se os corpos tiverem tamanhos
                diferentes, formas diferentes ou se houver aterramento, a análise
                muda.
              </p>
            </Box>

            <SubTitle>5.3 Eletrização por indução</SubTitle>

            <p>
              A eletrização por indução ocorre sem contato direto entre o corpo
              carregado e o corpo que será eletrizado. O corpo carregado é o
              indutor. O corpo que sofre a influência é o induzido.
            </p>

            <p>
              Considere um bastão negativamente eletrizado aproximado de uma
              esfera metálica neutra. O bastão repele os elétrons livres da
              esfera para a região mais distante. A parte próxima fica com falta
              relativa de elétrons e, portanto, com predominância positiva.
            </p>

            <p>
              Se a esfera for aterrada enquanto o bastão está próximo, elétrons
              podem escapar para a Terra. Depois retiramos o aterramento e, por
              fim, afastamos o bastão. A esfera fica positivamente eletrizada.
            </p>

            <Box title="Regra importante" variant="success">
              <p>
                Na indução com aterramento, o corpo induzido termina eletrizado
                com sinal oposto ao sinal do indutor.
              </p>
            </Box>

            <p>
              Se o indutor fosse positivo, ele atrairia elétrons da Terra para a
              esfera durante o aterramento. Depois de retirar o fio terra e
              afastar o indutor, a esfera ficaria negativamente eletrizada.
            </p>
          </Section>

          <Section number={6} title="Polarização elétrica">
            <p>
              Polarização é a reorganização interna de cargas em um material sem
              que necessariamente haja eletrização líquida do corpo. Ela é muito
              importante em isolantes.
            </p>

            <p>
              Em um isolante, as cargas não se deslocam livremente por grandes
              distâncias, mas podem sofrer pequenos deslocamentos internos. Isso
              cria regiões com predominância relativa de carga positiva e
              negativa.
            </p>

            <p>
              É por isso que um balão carregado pode grudar em uma parede neutra.
              O campo elétrico do balão reorganiza as cargas nas moléculas da
              parede. A parte mais próxima fica com carga efetiva de sinal
              oposto ao balão, produzindo atração.
            </p>

            <Box title="Diferenças importantes" variant="info">
              <BulletList
                items={[
                  "eletrização: o corpo ganha ou perde carga líquida;",
                  "indução em condutores: cargas livres se redistribuem e pode haver eletrização com aterramento;",
                  "polarização em isolantes: cargas internas se deslocam ligeiramente, mas o corpo pode continuar neutro.",
                ]}
              />
            </Box>
          </Section>

          <Section number={7} title="Lei de Coulomb">
            <p>
              A Lei de Coulomb mede a intensidade da força elétrica entre duas
              cargas puntiformes em repouso.
            </p>

            <p>
              A ideia física é direta: quanto maiores as cargas, maior a força.
              Quanto maior a distância, menor a força. Mais precisamente, a força
              diminui com o quadrado da distância.
            </p>

            <FormulaBox formula="F = k \frac{|q_1 q_2|}{d^2}" />

            <div className="grid gap-4 md:grid-cols-2">
              <Box title="Termos da fórmula" variant="dark">
                <p>
                  $F$ é o módulo da força elétrica, medido em newtons.
                  $q_1$ e $q_2$ são as cargas elétricas, medidas em coulombs.
                  $d$ é a distância entre as cargas, medida em metros. $k$ é a
                  constante eletrostática do meio.
                </p>
              </Box>

              <Box title="Constante no vácuo" variant="dark">
                <MathFormula formula="k_0 \approx 9{,}0 \times 10^9 \ \text{N} \cdot \text{m}^2/\text{C}^2" />
                <p>
                  No ar, em muitos problemas de vestibular, usamos o mesmo valor
                  aproximado do vácuo.
                </p>
              </Box>
            </div>

            <p>
              A fórmula escalar calcula apenas o módulo da força. O sentido deve
              ser analisado separadamente: sinais iguais geram repulsão; sinais
              opostos geram atração.
            </p>

            <Box title="Efeito da distância" variant="tip">
              <p>
                Se a distância dobra, a força cai para um quarto. Se a distância
                triplica, a força cai para um nono.
              </p>

              <MathFormula formula="F \propto \frac{1}{d^2}" />
            </Box>
          </Section>

          <Section
            number={8}
            title="Comparação entre Lei de Coulomb e Gravitação Universal"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormulaBox formula="F_e = k \frac{|q_1 q_2|}{d^2}" />
              <FormulaBox formula="F_g = G \frac{m_1m_2}{d^2}" />
            </div>

            <p>
              As duas leis têm estrutura semelhante: dependem do produto das
              grandezas envolvidas e diminuem com o quadrado da distância. Ambas
              atuam ao longo da linha que une os corpos.
            </p>

            <p>
              Mas há diferenças fundamentais. A força gravitacional é sempre
              atrativa. A força elétrica pode ser atrativa ou repulsiva. Além
              disso, a força elétrica é imensamente mais intensa que a
              gravitacional em escala microscópica.
            </p>

            <Box title="Por que a matéria não explode eletricamente?" variant="info">
              <p>
                Porque a matéria comum é aproximadamente neutra. As cargas
                positivas dos prótons e negativas dos elétrons se compensam em
                grande parte. Pequenos desequilíbrios podem gerar forças
                elétricas perceptíveis, mas a neutralidade global mantém a
                matéria estável em escala macroscópica.
              </p>
            </Box>
          </Section>

          <Section number={9} title="Princípio da superposição">
            <p>
              Quando várias cargas atuam sobre uma carga, a força resultante é a
              soma vetorial das forças individuais.
            </p>

            <FormulaBox formula="\vec{F}_{\text{res}} = \vec{F}_1 + \vec{F}_2 + \vec{F}_3 + \cdots" />

            <p>
              Esse ponto é essencial: não se somam módulos automaticamente. Em
              geral, é preciso desenhar as forças, analisar sentidos, decompor em
              componentes e somar vetorialmente.
            </p>

            <Box title="Roteiro seguro" variant="success">
              <BulletList
                items={[
                  "desenhe as cargas e seus sinais;",
                  "determine se cada interação é atrativa ou repulsiva;",
                  "desenhe cada força sobre a carga analisada;",
                  "calcule os módulos pela Lei de Coulomb;",
                  "some vetorialmente, usando sinais ou componentes.",
                ]}
              />
            </Box>
          </Section>

          <Section number={10} title="Campo elétrico">
            <p>
              O conceito de campo elétrico foi criado para descrever a influência
              que uma carga produz no espaço ao seu redor. Em vez de pensar
              apenas que uma carga “age diretamente” sobre outra, podemos dizer
              que uma carga cria um campo, e esse campo exerce força sobre outras
              cargas colocadas na região.
            </p>

            <p>
              O campo elétrico em um ponto é definido como a força elétrica por
              unidade de carga de prova positiva colocada naquele ponto.
            </p>

            <FormulaBox formula="\vec{E} = \frac{\vec{F}}{q}" />

            <p>
              A unidade de campo elétrico é newton por coulomb:
            </p>

            <FormulaBox formula="[E] = \text{N/C}" />

            <p>
              A relação inversa também é muito importante:
            </p>

            <FormulaBox formula="\vec{F} = q\vec{E}" />

            <Box title="Cuidado com o sinal da carga" variant="warning">
              <p>
                Se $q &gt; 0$, a força tem o mesmo sentido do campo. Se $q &lt;
                0$, a força tem sentido oposto ao campo. Esse detalhe derruba
                muita gente em movimento de partículas carregadas.
              </p>
            </Box>
          </Section>

          <Section number={11} title="Campo gerado por uma carga puntiforme">
            <p>
              Uma carga puntiforme $Q$ cria campo elétrico no espaço ao seu
              redor. Para encontrar o módulo desse campo, partimos da Lei de
              Coulomb.
            </p>

            <FormulaBox formula="F = k\frac{|Qq|}{d^2}" />
            <FormulaBox formula="E = \frac{F}{|q|}" />
            <FormulaBox formula="E = k\frac{|Q|}{d^2}" />

            <p>
              Note que o campo depende da carga geradora $Q$ e da distância $d$,
              mas não depende da carga de prova $q$. A carga de prova apenas
              “sente” o campo que já existia ali.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Box title="Carga positiva" variant="success">
                <p>Gera campo elétrico apontando para fora.</p>
              </Box>

              <Box title="Carga negativa" variant="info">
                <p>Gera campo elétrico apontando para dentro.</p>
              </Box>
            </div>
          </Section>

          <Section number={12} title="Linhas de campo elétrico">
            <p>
              Linhas de campo são representações visuais do campo elétrico. Elas
              ajudam a enxergar direção, sentido e intensidade relativa do campo.
            </p>

            <BulletList
              items={[
                "saem de cargas positivas;",
                "entram em cargas negativas;",
                "a tangente à linha indica a direção do campo;",
                "maior densidade de linhas indica campo mais intenso;",
                "linhas de campo não se cruzam.",
              ]}
            />

            <p>
              Em uma carga positiva isolada, as linhas saem radialmente. Em uma
              carga negativa isolada, entram radialmente. Em um dipolo elétrico,
              as linhas saem da carga positiva e chegam à carga negativa. Entre
              placas paralelas ideais, as linhas são praticamente retas,
              paralelas e igualmente espaçadas.
            </p>
          </Section>

          <Section number={13} title="Campo elétrico uniforme">
            <p>
              Um campo elétrico é uniforme quando tem mesmo módulo, mesma direção
              e mesmo sentido em todos os pontos de uma região. O exemplo mais
              comum é a região entre duas placas paralelas eletrizadas, longe das
              bordas.
            </p>

            <FormulaBox formula="\vec{F} = q\vec{E}" />

            <p>
              Uma carga positiva colocada nesse campo acelera no sentido do
              campo. Uma carga negativa acelera no sentido oposto. Essa ideia é
              usada em tubos de raios catódicos, aceleradores de partículas e em
              muitos problemas de movimento de cargas.
            </p>
          </Section>

          <Section number={14} title="Trabalho da força elétrica">
            <p>
              A força elétrica pode realizar trabalho sobre uma carga. Se a carga
              se desloca sob ação da força elétrica, pode ganhar ou perder
              energia cinética.
            </p>

            <p>
              Em um campo elétrico uniforme, com deslocamento paralelo ao campo,
              temos:
            </p>

            <FormulaBox formula="W = Fd" />
            <FormulaBox formula="F = qE" />
            <FormulaBox formula="W = qEd" />

            <p>
              Essa expressão vale para o caso específico de força constante e
              deslocamento paralelo ao campo. Em situações mais gerais, é melhor
              trabalhar com diferença de potencial.
            </p>
          </Section>

          <Section number={15} title="Energia potencial elétrica">
            <p>
              Energia potencial elétrica é a energia associada à configuração de
              cargas. Duas cargas separadas por certa distância formam um sistema
              que pode armazenar energia devido à interação elétrica.
            </p>

            <FormulaBox formula="E_{p,e} = k\frac{q_1q_2}{d}" />

            <p>
              O sinal dessa energia é muito importante.
            </p>

            <BulletList
              items={[
                "cargas de mesmo sinal produzem energia potencial positiva;",
                "cargas de sinais opostos produzem energia potencial negativa;",
                "adota-se normalmente energia potencial zero quando as cargas estão infinitamente afastadas.",
              ]}
            />

            <p>
              Para afastar cargas de sinais opostos, é necessário fornecer
              energia ao sistema, pois elas se atraem. Para aproximar cargas de
              mesmo sinal, também é necessário fornecer energia, pois elas se
              repelem.
            </p>
          </Section>

          <Section number={16} title="Potencial elétrico">
            <p>
              Potencial elétrico é energia potencial elétrica por unidade de
              carga. Ele indica quanta energia potencial uma carga teria, por
              coulomb, se fosse colocada em determinado ponto.
            </p>

            <FormulaBox formula="V = \frac{E_p}{q}" />

            <p>
              A unidade de potencial elétrico é o volt:
            </p>

            <FormulaBox formula="1 \ \text{V} = 1 \ \text{J/C}" />

            <p>
              Para uma carga puntiforme geradora $Q$, o potencial em um ponto a
              uma distância $d$ é:
            </p>

            <FormulaBox formula="V = k\frac{Q}{d}" />

            <Box title="Campo versus potencial" variant="info">
              <BulletList
                items={[
                  "campo elétrico é vetor;",
                  "potencial elétrico é escalar;",
                  "campo está ligado à força por unidade de carga;",
                  "potencial está ligado à energia por unidade de carga.",
                ]}
              />
            </Box>
          </Section>

          <Section number={17} title="Diferença de potencial elétrico">
            <p>
              A diferença de potencial, também chamada de tensão elétrica,
              compara o potencial elétrico entre dois pontos.
            </p>

            <FormulaBox formula="U = V_A - V_B" />

            <p>
              O trabalho da força elétrica ao levar uma carga de $A$ para $B$ é:
            </p>

            <FormulaBox formula="W_{\text{el}} = q(V_A - V_B)" />

            <p>
              Cargas positivas tendem espontaneamente a se mover para potenciais
              menores quando estão livres sob ação apenas da força elétrica.
              Elétrons, por terem carga negativa, sofrem força no sentido oposto
              ao campo elétrico.
            </p>
          </Section>

          <Section
            number={18}
            title="Relação entre campo elétrico e potencial elétrico"
          >
            <p>
              O campo elétrico aponta na direção em que o potencial diminui mais
              rapidamente. Em campo uniforme, a relação entre campo e diferença
              de potencial é:
            </p>

            <FormulaBox formula="E = \frac{U}{d}" />

            <p>
              A unidade $\text{N/C}$ é equivalente a $\text{V/m}$:
            </p>

            <FormulaBox formula="1 \ \text{N/C} = 1 \ \text{V/m}" />

            <Box title="Analogia útil" variant="tip">
              <p>
                Podemos pensar no potencial como uma espécie de “altura
                elétrica” e no campo como uma “inclinação”. Cargas positivas
                tendem a se mover no sentido de queda do potencial. A analogia
                ajuda, mas não deve ser levada ao pé da letra.
              </p>
            </Box>
          </Section>

          <Section number={19} title="Condutores em equilíbrio eletrostático">
            <p>
              Um condutor está em equilíbrio eletrostático quando suas cargas
              livres não apresentam movimento ordenado permanente. Nesse estado,
              algumas propriedades são fundamentais.
            </p>

            <BulletList
              items={[
                "o campo elétrico no interior do condutor é nulo;",
                "o excesso de carga fica na superfície externa;",
                "todos os pontos do condutor ficam no mesmo potencial;",
                "o campo elétrico na superfície é perpendicular à superfície.",
              ]}
            />

            <p>
              Se houvesse campo elétrico dentro do condutor, os elétrons livres
              se moveriam. Portanto, não haveria equilíbrio. O equilíbrio exige
              campo interno nulo.
            </p>
          </Section>

          <Section number={20} title="Blindagem eletrostática e gaiola de Faraday">
            <p>
              A blindagem eletrostática ocorre quando um condutor protege seu
              interior contra campos elétricos externos. As cargas livres do
              condutor se redistribuem de modo a anular o campo elétrico no seu
              interior.
            </p>

            <p>
              Esse é o princípio da gaiola de Faraday. Em uma estrutura
              condutora, as cargas ficam na superfície externa e o interior fica
              protegido.
            </p>

            <BulletList
              items={[
                "carro durante tempestade;",
                "cabos blindados;",
                "equipamentos eletrônicos protegidos;",
                "gaiolas metálicas em laboratório.",
              ]}
            />

            <Box title="Carro e tempestade" variant="warning">
              <p>
                No caso do carro, a proteção principal não vem da borracha dos
                pneus. Vem da estrutura metálica, que conduz as cargas pela parte
                externa e reduz o campo no interior.
              </p>
            </Box>
          </Section>

          <Section number={21} title="Poder das pontas">
            <p>
              Em regiões pontiagudas de condutores, há maior concentração de
              cargas. Como consequência, o campo elétrico próximo a pontas pode
              ser muito intenso.
            </p>

            <p>
              Isso explica fenômenos como corona elétrica, faíscas, descargas em
              pontas e o funcionamento de para-raios.
            </p>

            <Box title="Para-raios" variant="info">
              <p>
                O para-raios não “atrai raios magicamente”. Ele oferece um
                caminho preferencial e seguro para a descarga elétrica, conduzindo
                a corrente para a Terra e reduzindo riscos para a estrutura
                protegida.
              </p>
            </Box>
          </Section>

          <Section number={22} title="Gráficos importantes">
            <SubTitle>Campo elétrico de carga puntiforme</SubTitle>

            <FormulaBox formula="E = k\frac{|Q|}{d^2}" />

            <p>
              O gráfico $E \times d$ decai com o inverso do quadrado da
              distância. Quando $d$ aumenta, o campo diminui rapidamente.
            </p>

            <SubTitle>Potencial elétrico de carga puntiforme</SubTitle>

            <FormulaBox formula="V = k\frac{Q}{d}" />

            <p>
              O potencial decai com o inverso da distância. Ele diminui mais
              lentamente que o campo elétrico.
            </p>

            <Box title="Comparação essencial" variant="tip">
              <BulletList
                items={[
                  "campo elétrico cai como $1/d^2$;",
                  "potencial elétrico cai como $1/d$;",
                  "energia potencial elétrica também depende de $1/d$.",
                ]}
              />
            </Box>
          </Section>

          <Section number={23} title="Análise dimensional">
            <p>
              A análise dimensional ajuda a verificar se as fórmulas fazem
              sentido.
            </p>

            <SubTitle>Lei de Coulomb</SubTitle>

            <FormulaBox formula="F = k\frac{|q_1q_2|}{d^2}" />

            <p>
              Para que o resultado seja uma força em newtons, a unidade de $k$
              deve ser:
            </p>

            <FormulaBox formula="[k] = \text{N} \cdot \text{m}^2/\text{C}^2" />

            <SubTitle>Campo elétrico</SubTitle>

            <FormulaBox formula="E = \frac{F}{q}" />
            <FormulaBox formula="[E] = \text{N/C}" />

            <SubTitle>Potencial elétrico</SubTitle>

            <FormulaBox formula="V = \frac{E_p}{q}" />
            <FormulaBox formula="[V] = \text{J/C}" />
            <FormulaBox formula="1 \ \text{J/C} = 1 \ \text{V}" />
          </Section>

          <Section number={24} title="Exemplos resolvidos">
            <div className="grid gap-5">
              <ExampleCard title="Exemplo 1 — Força elétrica entre duas cargas">
                <p>
                  Duas cargas $q_1 = +2{,}0 \ \mu\text{C}$ e $q_2 = -3{,}0
                  \ \mu\text{C}$ estão separadas por $d = 0{,}30 \ \text{m}$ no
                  vácuo. Determine o módulo da força elétrica.
                </p>

                <FormulaBox formula="F = k\frac{|q_1q_2|}{d^2}" />
                <FormulaBox formula="F = 9{,}0\times10^9\frac{|(2{,}0\times10^{-6})(-3{,}0\times10^{-6})|}{(0{,}30)^2}" />
                <FormulaBox formula="F = 0{,}60 \ \text{N}" />

                <p>
                  Como as cargas têm sinais opostos, a força é de atração.
                </p>
              </ExampleCard>

              <ExampleCard title="Exemplo 2 — Sinal da força">
                <p>
                  Se duas cargas são positivas, a interação é repulsiva. Se uma
                  é positiva e outra negativa, a interação é atrativa. A fórmula
                  escalar dá o módulo; o sentido vem da análise dos sinais.
                </p>
              </ExampleCard>

              <ExampleCard title="Exemplo 3 — Eletrização por contato">
                <p>
                  Duas esferas idênticas têm cargas $+10 \ \mu\text{C}$ e $-4
                  \ \mu\text{C}$. Após contato, a carga total é:
                </p>

                <FormulaBox formula="Q_{\text{total}} = +10 - 4 = +6 \ \mu\text{C}" />
                <FormulaBox formula="Q_f = \frac{+6}{2} = +3 \ \mu\text{C}" />

                <p>Cada esfera fica com $+3 \ \mu\text{C}$.</p>
              </ExampleCard>

              <ExampleCard title="Exemplo 4 — Quantização da carga">
                <p>
                  Um corpo tem carga $Q = -3{,}2 \times 10^{-6} \ \text{C}$.
                  Quantos elétrons ele ganhou?
                </p>

                <FormulaBox formula="n = \frac{|Q|}{e}" />
                <FormulaBox formula="n = \frac{3{,}2\times10^{-6}}{1{,}6\times10^{-19}}" />
                <FormulaBox formula="n = 2\times10^{13}" />

                <p>O corpo ganhou $2\times10^{13}$ elétrons.</p>
              </ExampleCard>

              <ExampleCard title="Exemplo 5 — Três cargas em linha">
                <p>
                  Em problemas com três cargas alinhadas, calcule a força de cada
                  uma sobre a carga analisada e use sinal para indicar sentido.
                  Forças para a direita podem ser positivas; forças para a
                  esquerda, negativas.
                </p>

                <FormulaBox formula="F_{\text{res}} = F_{\text{direita}} - F_{\text{esquerda}}" />

                <p>
                  O erro comum é somar os módulos como se todas as forças
                  apontassem para o mesmo lado.
                </p>
              </ExampleCard>

              <ExampleCard title="Exemplo 6 — Campo elétrico de uma carga">
                <p>
                  Uma carga $Q = +4{,}0 \ \mu\text{C}$ gera campo elétrico a
                  $0{,}20 \ \text{m}$ de distância.
                </p>

                <FormulaBox formula="E = k\frac{|Q|}{d^2}" />
                <FormulaBox formula="E = 9{,}0\times10^9\frac{4{,}0\times10^{-6}}{(0{,}20)^2}" />
                <FormulaBox formula="E = 9{,}0\times10^5 \ \text{N/C}" />

                <p>
                  Como $Q$ é positiva, o campo aponta para fora da carga.
                </p>
              </ExampleCard>

              <ExampleCard title="Exemplo 7 — Força em campo uniforme">
                <p>
                  Uma carga $q = -2{,}0 \ \mu\text{C}$ é colocada em um campo
                  uniforme $E = 5{,}0\times10^4 \ \text{N/C}$.
                </p>

                <FormulaBox formula="F = |q|E" />
                <FormulaBox formula="F = (2{,}0\times10^{-6})(5{,}0\times10^4)" />
                <FormulaBox formula="F = 0{,}10 \ \text{N}" />

                <p>
                  Como a carga é negativa, a força aponta no sentido oposto ao
                  campo.
                </p>
              </ExampleCard>

              <ExampleCard title="Exemplo 8 — Potencial elétrico">
                <p>
                  Uma carga $Q = +6{,}0 \ \mu\text{C}$ gera potencial a $0{,}30
                  \ \text{m}$ de distância.
                </p>

                <FormulaBox formula="V = k\frac{Q}{d}" />
                <FormulaBox formula="V = 9{,}0\times10^9\frac{6{,}0\times10^{-6}}{0{,}30}" />
                <FormulaBox formula="V = 1{,}8\times10^5 \ \text{V}" />
              </ExampleCard>

              <ExampleCard title="Exemplo 9 — Trabalho pela diferença de potencial">
                <p>
                  Uma carga $q = 2{,}0 \times 10^{-6} \ \text{C}$ se desloca de
                  um ponto $A$ com $V_A = 100 \ \text{V}$ para um ponto $B$ com
                  $V_B = 40 \ \text{V}$.
                </p>

                <FormulaBox formula="W_{\text{el}} = q(V_A - V_B)" />
                <FormulaBox formula="W_{\text{el}} = 2{,}0\times10^{-6}(100 - 40)" />
                <FormulaBox formula="W_{\text{el}} = 1{,}2\times10^{-4} \ \text{J}" />
              </ExampleCard>

              <ExampleCard title="Exemplo 10 — Condutor em equilíbrio">
                <p>
                  Uma esfera metálica eletrizada está em equilíbrio
                  eletrostático. O campo elétrico em seu interior é nulo, o
                  excesso de carga fica na superfície externa e todos os pontos
                  da esfera estão no mesmo potencial.
                </p>

                <p>
                  Se houvesse campo no interior, os elétrons livres se moveriam.
                  Como o sistema está em equilíbrio, esse movimento ordenado não
                  pode existir.
                </p>
              </ExampleCard>
            </div>
          </Section>

          <Section number={25} title="Armadilhas e erros comuns">
            <BulletList
              items={[
                "achar que corpo positivo ganhou prótons;",
                "confundir corpo neutro com corpo sem cargas;",
                "esquecer que elétrons são as cargas móveis em metais;",
                "confundir indução com contato;",
                "achar que toda atração significa cargas opostas;",
                "usar a Lei de Coulomb sem analisar o sentido da força;",
                "somar forças elétricas como escalares em problemas vetoriais;",
                "confundir campo elétrico com força elétrica;",
                "esquecer que carga negativa sofre força oposta ao campo;",
                "confundir potencial elétrico com energia potencial elétrica;",
                "achar que potencial é vetor;",
                "usar centímetros em vez de metros na Lei de Coulomb;",
                "confundir $E = kQ/d^2$ com $V = kQ/d$;",
                "achar que o campo no interior de um condutor em equilíbrio não é nulo.",
              ]}
            />
          </Section>

          <Section number={26} title="Pontos importantes para ITA/IME">
            <p>
              Em provas mais difíceis, Eletrostática costuma ser cobrada com
              ênfase em interpretação, simetria, sinais e relações entre
              grandezas. Decorar fórmulas isoladas não basta.
            </p>

            <BulletList
              items={[
                "dominar superposição vetorial;",
                "usar simetria para simplificar campos e forças;",
                "diferenciar força, campo, potencial e energia;",
                "interpretar sinais em energia potencial elétrica;",
                "entender condutores em equilíbrio eletrostático;",
                "comparar gráficos $E \\times d$ e $V \\times d$;",
                "converter corretamente microcoulomb, centímetro e milímetro para SI;",
                "analisar movimento de cargas negativas em campos elétricos;",
                "combinar conservação de energia com trabalho da força elétrica.",
              ]}
            />
          </Section>

          <Section number={27} title="Como reconhecer questões de Eletrostática">
            <p>
              Questões de Eletrostática costumam aparecer com alguns sinais bem
              claros no enunciado.
            </p>

            <BulletList
              items={[
                "cargas puntiformes;",
                "corpos eletrizados;",
                "bastão carregado;",
                "esfera metálica;",
                "indução;",
                "aterramento;",
                "condutores;",
                "campo elétrico;",
                "potencial elétrico;",
                "diferença de potencial;",
                "linhas de campo;",
                "blindagem;",
                "para-raios;",
                "força entre cargas.",
              ]}
            />

            <Box title="Roteiro mental" variant="success">
              <BulletList
                items={[
                  "identifique as cargas e seus sinais;",
                  "verifique se o problema envolve eletrização, força, campo, potencial ou energia;",
                  "converta todas as unidades para o SI;",
                  "desenhe a situação;",
                  "determine sentidos antes de fazer contas;",
                  "use superposição quando houver várias cargas;",
                  "separe força, campo, potencial e energia;",
                  "confira sinais e unidades no final.",
                ]}
              />
            </Box>
          </Section>

          <Section number={28} title="Resumo final organizado">
            <div className="grid gap-4 md:grid-cols-2">
              <FormulaBox formula="Q = ne" note="Quantização da carga elétrica." />
              <FormulaBox
                formula="\sum Q_{\text{antes}} = \sum Q_{\text{depois}}"
                note="Conservação da carga elétrica."
              />
              <FormulaBox
                formula="F = k\frac{|q_1q_2|}{d^2}"
                note="Lei de Coulomb."
              />
              <FormulaBox
                formula="\vec{E} = \frac{\vec{F}}{q}"
                note="Definição de campo elétrico."
              />
              <FormulaBox
                formula="\vec{F} = q\vec{E}"
                note="Força sobre uma carga em campo elétrico."
              />
              <FormulaBox
                formula="E = k\frac{|Q|}{d^2}"
                note="Campo de uma carga puntiforme."
              />
              <FormulaBox
                formula="V = k\frac{Q}{d}"
                note="Potencial de uma carga puntiforme."
              />
              <FormulaBox
                formula="E_{p,e} = k\frac{q_1q_2}{d}"
                note="Energia potencial elétrica."
              />
              <FormulaBox
                formula="W_{\text{el}} = q(V_A - V_B)"
                note="Trabalho da força elétrica."
              />
              <FormulaBox formula="E = \frac{U}{d}" note="Campo uniforme." />
            </div>

            <Box title="Ideia final" variant="dark">
              <p>
                A Eletrostática não deve ser estudada como uma coleção de
                fórmulas soltas. Ela é o estudo de como cargas elétricas criam
                forças, campos, potenciais e energia no espaço. Quem entende a
                diferença entre força, campo, potencial e energia deixa de
                decorar mecanicamente e começa a resolver problemas de verdade.
              </p>
            </Box>
          </Section>
        </div>
      </main>
    </div>
  );
}
