import { Link } from "wouter";
import { ArrowLeft, Activity, Lightbulb, AlertTriangle, CheckCircle2, Info, Target, Compass, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MathFormula } from "@/components/MathFormula";
import { Card } from "@/components/ui/card";

export default function DinamicaTopicPrimeiraLei() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dinamica">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Dinâmica</h1>
              <p className="text-xs text-slate-600 font-medium">Primeira Lei de Newton (Inércia)</p>
            </div>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-12 max-w-5xl">

        {/* ===================== INTRODUÇÃO ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-600" />
            A Primeira Lei de Newton: O Princípio da Inércia
          </h2>
          
          <div className="space-y-6">
            <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-3">A Quebra de um Paradigma de 2000 Anos</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Antes de entrarmos nas fórmulas e definições matemáticas, precisamos entender o tamanho da revolução intelectual que a Primeira Lei de Newton causou. Para compreender a inércia, você precisa primeiro desaprender o que o seu próprio "senso comum" diz sobre o movimento. Durante mais de dois milênios, a humanidade inteira — incluindo os maiores sábios da antiguidade — acreditou na física proposta pelo filósofo grego <strong>Aristóteles</strong>.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6" />
                    O Erro do Senso Comum (Aristóteles)
                  </h4>
                  <p className="text-slate-700 text-sm leading-relaxed mb-3">
                    Aristóteles observava o mundo ao seu redor e concluía: <em>"O estado natural e perfeito de todos os corpos é o repouso absoluto. Para que um corpo se mova, e continue se movendo, é estritamente necessária a ação de uma força constante empurrando-o."</em>
                  </p>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    Parece extremamente lógico, não é? Se você empurra um livro pesado sobre uma mesa de madeira e solta, o que acontece? Ele para quase imediatamente. Se você para de pedalar uma bicicleta em uma rua plana, ela vai perdendo velocidade até parar. O nosso cérebro, baseado na experiência diária, nos diz que o movimento "morre" naturalmente e precisa de força para "viver". Esse foi o erro que travou a ciência por 2000 anos.
                  </p>
                </div>
                
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-sm text-slate-100">
                  <h4 className="font-bold text-emerald-400 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-6 h-6" />
                    A Genialidade de Galileu Galilei
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">
                    No século XVII, Galileu Galilei fez o que ninguém havia feito: ele imaginou um mundo ideal. Ele percebeu que o livro não para porque "quer" parar ou porque o repouso é seu estado natural. O livro para porque existe uma força invisível "roubando" seu movimento: o <strong>atrito</strong>!
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Galileu propôs um experimento mental revolucionário: imagine uma superfície perfeitamente lisa, como gelo polido, e uma esfera perfeitamente redonda. Se você der um empurrão nessa esfera, e não houver atrito nem resistência do ar, ela não vai parar nunca. Ela deslizará em linha reta, com velocidade constante, pela eternidade. Galileu concluiu a maior verdade da cinemática: <em>"O movimento retilíneo uniforme é um estado tão natural e eterno quanto o próprio repouso."</em>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded p-6">
              <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-600" />
                O Enunciado Oficial de Newton
              </h4>
              <blockquote className="border-l-4 border-teal-500 pl-4 italic text-slate-700 text-lg my-4">
                "Todo corpo continua em seu estado de repouso ou de movimento retilíneo uniforme, a menos que seja forçado a mudar aquele estado por forças aplicadas sobre ele."
              </blockquote>
              <p className="text-slate-700 mt-4">
                Em linguagem moderna e matemática: Se a força resultante sobre um corpo é nula (<MathFormula formula="\vec{F}_R = \vec{0}" display={false} />), sua aceleração é nula (<MathFormula formula="\vec{a} = \vec{0}" display={false} />).
              </p>
            </div>
          </div>
        </div>

        {/* ===================== O CONCEITO DE INÉRCIA ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">🧠 O Que é Inércia, Afinal?</h2>
          
          <div className="space-y-8">
            <p className="text-slate-700 leading-relaxed text-lg">
              A primeira coisa que você precisa gravar na mente é: <strong>Inércia não é uma força. Inércia não é uma energia.</strong> Você nunca vai calcular "quantos Newtons de inércia" um corpo tem. Inércia é uma <strong>propriedade intrínseca da matéria</strong>. É a "preguiça" cósmica, a teimosia absoluta que todo corpo tem de manter exatamente o que está fazendo no momento. Se ele está parado, ele "quer" continuar parado. Se ele está a 100 km/h para o norte, ele "quer" continuar a 100 km/h para o norte, para sempre.
            </p>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 rounded-xl p-6 shadow-xl">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-emerald-400 mb-4">A Medida da Inércia: A Massa</h4>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    Como medimos o quão "preguiçoso" ou "teimoso" um corpo é? Através da sua <strong>Massa</strong>. A massa de um corpo é a medida quantitativa da sua inércia. Quanto maior a massa, maior a dificuldade de alterar seu estado de movimento.
                  </p>
                  <ul className="space-y-4 text-sm text-slate-300">
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 mt-1 text-lg">•</span>
                      <span><strong>Muita Massa (Muita Inércia):</strong> Imagine um trem de carga de 500 toneladas parado. É preciso uma força colossal das locomotivas para fazê-lo começar a andar. Agora imagine esse mesmo trem a 80 km/h. É preciso uma força de frenagem absurda, ao longo de quilômetros, para obrigá-lo a parar. A inércia dele é gigantesca.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 mt-1 text-lg">•</span>
                      <span><strong>Pouca Massa (Pouca Inércia):</strong> Imagine uma bola de ping-pong de 2 gramas. Um leve sopro a tira do repouso. Se ela estiver voando na sua direção, você a para com um dedo sem sentir dor. A inércia dela é minúscula.</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-slate-800/50 p-5 rounded-lg border border-slate-700 flex flex-col justify-center">
                  <h4 className="font-semibold text-amber-400 mb-3 flex items-center gap-2 text-lg">
                    <Lightbulb className="w-5 h-5" />
                    Propriedade de Ouro: A Equivalência Dinâmica
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    Para a física newtoniana, estar em <strong>Repouso Absoluto</strong> ou estar em <strong>Movimento Retilíneo Uniforme (MRU)</strong> é exatamente a mesma coisa do ponto de vista dinâmico. Não há diferença matemática nas forças.
                  </p>
                  <div className="bg-slate-900 p-3 rounded border border-slate-600 text-center">
                    <p className="text-emerald-400 font-mono text-sm">Repouso = Equilíbrio Estático</p>
                    <p className="text-emerald-400 font-mono text-sm mt-1">MRU = Equilíbrio Dinâmico</p>
                    <p className="text-white font-bold mt-2">Em ambos: Força Resultante = 0</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Exemplos do Cotidiano */}
            <div className="mt-10">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">A Inércia no Nosso Dia a Dia (Por que usamos cinto de segurança?)</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-slate-800 mb-3 text-lg">1. A Freada Brusca do Ônibus</h4>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    Você está em pé no corredor de um ônibus viajando a 60 km/h. De repente, um cachorro cruza a rua e o motorista pisa fundo no freio. O que acontece com você? Você é violentamente "jogado" para frente. Mas preste atenção na física: você não foi jogado para frente. Não existe nenhuma força te empurrando.
                  </p>
                  <p className="text-slate-700 text-sm leading-relaxed mt-2">
                    O que realmente aconteceu: O ônibus freou (sofreu uma força externa), mas <strong>você não</strong>. Por inércia, o seu corpo apenas tentou continuar fazendo o que já estava fazendo: viajar a 60 km/h para frente. O ônibus parou, você continuou. É por isso que precisamos nos segurar nas barras: para que a barra aplique em nós a força necessária para mudarmos nosso estado de movimento junto com o ônibus.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-slate-800 mb-3 text-lg">2. A Arrancada do Carro Esportivo</h4>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    Você está sentado no banco do passageiro de um carro esportivo parado no semáforo. O sinal fica verde e o motorista acelera com tudo. Você sente suas costas sendo "esmagadas" contra o banco. Novamente, não há uma força te empurrando para trás.
                  </p>
                  <p className="text-slate-700 text-sm leading-relaxed mt-2">
                    O que realmente aconteceu: Seu corpo estava em repouso e, por inércia, a tendência natural dele é continuar exatamente ali, parado em relação ao solo. O carro, no entanto, foi violentamente acelerado para frente. O banco do carro avança contra as suas costas e te empurra para frente, obrigando o seu corpo a sair do repouso e acompanhar o carro. A sensação de ser esmagado é apenas a força normal do banco vencendo a sua inércia.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ===================== ARMADILHAS E ERROS CONCEITUAIS ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">⚠️ Armadilhas e Erros Conceituais Clássicos</h2>
          
          <div className="space-y-6">
            <p className="text-slate-700 leading-relaxed text-lg">
              A Primeira Lei de Newton é a que mais derruba alunos em provas de alto nível (como ITA e IME), não por cálculos complexos, mas por <strong>pegadinhas conceituais</strong>.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl">
                <h4 className="font-bold text-red-900 mb-2">Erro 1: "Se não tem força, ele para"</h4>
                <p className="text-slate-700 text-sm leading-relaxed">
                  <strong>A Armadilha:</strong> Achar que o movimento precisa de força para se manter.<br/>
                  <strong>A Verdade:</strong> Se a força resultante for zero, um corpo em movimento continuará em MRU para sempre. Ele só para se houver uma força contra (como o atrito).
                </p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl">
                <h4 className="font-bold text-red-900 mb-2">Erro 2: "Força centrífuga é inércia"</h4>
                <p className="text-slate-700 text-sm leading-relaxed">
                  <strong>A Armadilha:</strong> Achar que a "força" que te joga para fora na curva é uma força real.<br/>
                  <strong>A Verdade:</strong> Não existe força te puxando para fora. Seu corpo apenas quer seguir em <strong>linha reta</strong> (inércia). O carro faz a curva, você tenta seguir reto.
                </p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl">
                <h4 className="font-bold text-red-900 mb-2">Erro 3: "Inércia depende da velocidade"</h4>
                <p className="text-slate-700 text-sm leading-relaxed">
                  <strong>A Armadilha:</strong> Achar que um caminhão a 100 km/h tem mais inércia que o mesmo caminhão a 10 km/h.<br/>
                  <strong>A Verdade:</strong> A inércia depende <strong>exclusivamente da massa</strong>. A velocidade não altera a inércia do corpo (na física clássica).
                </p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl">
                <h4 className="font-bold text-red-900 mb-2">Erro 4: "MRU e Repouso são diferentes"</h4>
                <p className="text-slate-700 text-sm leading-relaxed">
                  <strong>A Armadilha:</strong> Achar que a Força Resultante = 0 significa apenas que o corpo está parado.<br/>
                  <strong>A Verdade:</strong> Força Resultante = 0 significa <strong>Equilíbrio</strong>. Pode ser Equilíbrio Estático (repouso) ou Equilíbrio Dinâmico (MRU).
                </p>
              </div>
            </div>
          </div>
        </div>

{/* ===================== EXEMPLOS RESOLVIDOS ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">📝 Exemplos Resolvidos: Primeira Lei</h2>

          <div className="space-y-8">
            {/* Exemplo 1 */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-200">
                <h5 className="font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Exemplo 1: O Paraquedista e a Velocidade Terminal
                </h5>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-slate-700 leading-relaxed">
                  Um paraquedista de 80 kg salta de um avião. Após alguns segundos de queda livre acelerada, ele abre o paraquedas. A resistência do ar aumenta drasticamente até que ele atinge a chamada "velocidade terminal", passando a cair com uma velocidade constante de 5 m/s em linha reta. Qual é a força resultante sobre o paraquedista neste exato momento?
                </p>

                <div className="bg-emerald-50/50 p-5 rounded-lg border border-emerald-100 space-y-4">
                  <p className="font-semibold text-emerald-900">
                    Resolução Passo a Passo e Análise Física:
                  </p>

                  <p className="text-slate-700 text-sm leading-relaxed">
                    1. <strong>Identificação do Estado de Movimento:</strong> O problema afirma categoricamente que ele cai com <strong>velocidade constante</strong> e em linha reta para baixo.
                    <br />
                    2. <strong>Tradução Cinemática:</strong> Movimento em linha reta com velocidade constante é a definição exata e rigorosa de <strong>Movimento Retilíneo Uniforme (MRU)</strong>.
                    <br />
                    3. <strong>Aplicação da Primeira Lei:</strong> Pela Primeira Lei de Newton, sabemos que se um corpo está em MRU, ele encontra-se em um estado de <strong>Equilíbrio Dinâmico</strong>.
                    <br />
                    4. <strong>Conclusão Dinâmica:</strong> A condição necessária e suficiente para o equilíbrio, seja estático ou dinâmico, é que a soma vetorial de todas as forças atuantes seja nula. Portanto, a força resultante sobre ele é obrigatoriamente <strong>ZERO</strong>.
                  </p>

                  <div className="bg-slate-900 p-4 rounded-lg mt-4 text-center shadow-inner">
                    <MathFormula
                      formula="\vec{F}_R = \vec{P} + \vec{F}_{ar} = 0 \text{ N}"
                      display={true}
                      className="text-emerald-400"
                    />
                  </div>

                  <p className="text-slate-600 text-sm italic mt-4 border-l-2 border-emerald-300 pl-3">
                    <strong>Aprofundamento:</strong> Isso não significa que não há forças atuando sobre ele. Significa que a força de resistência do ar, que aponta para cima, cresceu até se igualar perfeitamente em módulo à força peso, que aponta para baixo. Elas se anulam vetorialmente, resultando em uma força líquida nula. O corpo para de acelerar, mas não para de cair.
                  </p>
                </div>
              </div>
            </div>

            {/* Exemplo 2 */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-200">
                <h5 className="font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Exemplo 2: A Moeda no Trem-Bala
                </h5>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-slate-700 leading-relaxed">
                  Você está em um trem-bala viajando a impressionantes 300 km/h em uma via perfeitamente retilínea e horizontal. Você pega uma moeda e a joga verticalmente para cima. Desprezando a resistência do ar dentro do vagão, onde a moeda vai cair? Ela vai voar para trás e bater no passageiro de trás?
                </p>

                <div className="bg-emerald-50/50 p-5 rounded-lg border border-emerald-100 space-y-4">
                  <p className="font-semibold text-emerald-900">
                    Resolução Passo a Passo e Análise Física:
                  </p>

                  <p className="text-slate-700 text-sm leading-relaxed">
                    1. <strong>Estado Inicial:</strong> Antes de ser lançada, a moeda está na sua mão. Portanto, ela já possui a mesma velocidade horizontal do trem: <strong>300 km/h em relação ao solo</strong>.
                    <br />
                    2. <strong>O Lançamento:</strong> Ao ser lançada para cima, você aplica uma força apenas na direção vertical. Não há nenhuma força horizontal atuando sobre a moeda enquanto ela está no ar, já que desprezamos a resistência do ar.
                    <br />
                    3. <strong>Aplicação da Inércia:</strong> Pela Primeira Lei de Newton, como a força resultante na direção horizontal é zero, a moeda <strong>mantém sua velocidade horizontal constante</strong> por inércia. Ela continua viajando a 300 km/h para a frente.
                    <br />
                    4. <strong>Conclusão Relativa:</strong> Como você, o trem e a moeda continuam se deslocando para a frente exatamente com a mesma velocidade horizontal, a moeda acompanha o seu movimento e cai <strong>exatamente de volta na sua mão</strong>.
                  </p>

                  <p className="text-slate-600 text-sm italic mt-4 border-l-2 border-emerald-300 pl-3">
                    <strong>Aprofundamento:</strong> Este é o famoso Princípio da Relatividade de Galileu. Para um observador dentro do trem, a moeda faz um movimento puramente vertical de sobe e desce. Para um observador parado fora do trem olhando pela janela, a moeda descreve uma trajetória parabólica, pois ela sobe e vai para a frente ao mesmo tempo. As leis da física são as mesmas em qualquer referencial inercial.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* ===================== SEGUNDA LEI DE NEWTON ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200 mt-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Zap className="w-8 h-8 text-amber-500" />
            A Segunda Lei de Newton: O Princípio Fundamental da Dinâmica
          </h2>
          
          <div className="space-y-8">
            {/* Contexto Histórico */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-6 rounded-r-xl">
              <h3 className="text-xl font-bold text-amber-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Contexto Histórico: A Quantificação do Movimento
              </h3>
              <p className="text-slate-700 leading-relaxed mb-3">
                A Primeira Lei nos disse o que acontece quando a Força Resultante é zero (o corpo fica em MRU ou repouso). Mas e se a Força Resultante <strong>não for zero</strong>? O que acontece quando o equilíbrio é quebrado?
              </p>
              <p className="text-slate-700 leading-relaxed mb-3">
                No século XVII, Isaac Newton publicou sua obra-prima, o <em>Principia Mathematica</em>. Nele, Newton não apenas disse que uma força causa mudança de movimento, ele <strong>quantificou</strong> essa mudança. Ele percebeu que a força não gera velocidade diretamente, mas sim <strong>aceleração</strong> (a taxa de variação da velocidade). E mais: ele percebeu que a massa do corpo atua como uma resistência natural a essa aceleração.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Newton originalmente formulou essa lei em termos de "Quantidade de Movimento" (Momento Linear), afirmando que a força resultante é a derivada do momento no tempo (<MathFormula formula="\vec{F} = \frac{d\vec{p}}{dt}" display={false} />). Para corpos de massa constante, essa genialidade matemática se simplifica na equação mais famosa da física clássica.
              </p>
            </div>

            {/* A Equação Fundamental e Demonstração */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 rounded-xl p-6 mb-6 shadow-xl">
              <div className="flex flex-col items-center justify-center mb-8">
                <h3 className="text-amber-400 font-bold tracking-widest uppercase text-sm mb-4">A Equação Fundamental</h3>
                <div className="bg-black/50 p-6 rounded-xl border border-slate-600 shadow-inner">
                  <MathFormula formula="\vec{F}_R = m \cdot \vec{a}" display={true} className="text-4xl text-white" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-600">
                  <div className="text-amber-400 font-bold text-xl mb-2">F<sub className="text-sm">R</sub></div>
                  <h4 className="text-white font-semibold mb-2">Força Resultante</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    A soma vetorial de <strong>todas</strong> as forças que atuam no corpo. É a <strong>causa</strong> da mudança de movimento. Medida em Newtons (N).
                  </p>
                </div>
                
                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-600">
                  <div className="text-emerald-400 font-bold text-xl mb-2">m</div>
                  <h4 className="text-white font-semibold mb-2">Massa (Inércia)</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    A resistência do corpo à mudança. Quanto maior a massa, mais força é necessária para gerar a mesma aceleração. Medida em quilogramas (kg).
                  </p>
                </div>

                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-600">
                  <div className="text-blue-400 font-bold text-xl mb-2">a</div>
                  <h4 className="text-white font-semibold mb-2">Aceleração</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    A <strong>consequência</strong> da força. É a taxa de variação da velocidade. A aceleração tem <strong>sempre a mesma direção e sentido</strong> da Força Resultante. Medida em m/s².
                  </p>
                </div>
              </div>

              <h4 className="font-semibold text-amber-400 mb-4 text-xl border-t border-slate-700 pt-6">A Demonstração Lógica (Como Newton chegou lá?)</h4>
              <p className="text-slate-300 leading-relaxed mb-6">
                A equação <MathFormula formula="F = m \cdot a" display={false} /> não caiu do céu. Ela é a união de duas observações experimentais diretas que você mesmo pode testar no dia a dia:
              </p>
              
              <div className="space-y-4">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="font-semibold text-amber-400 mb-2">Passo 1: Aceleração é diretamente proporcional à Força</p>
                  <p className="text-sm text-slate-300 leading-relaxed mb-2">
                    Se você empurrar um carrinho de supermercado com o dobro da força, ele vai acelerar o dobro. Se triplicar a força, a aceleração triplica. Matematicamente, escrevemos:
                  </p>
                  <div className="bg-slate-900 p-2 rounded text-center border border-slate-700">
                    <MathFormula formula="a \propto F" display={true} />
                  </div>
                </div>
                
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="font-semibold text-amber-400 mb-2">Passo 2: Aceleração é inversamente proporcional à Massa</p>
                  <p className="text-sm text-slate-300 leading-relaxed mb-2">
                    Se você aplicar a mesma força em um carrinho vazio e em um carrinho cheio (com o dobro da massa), o carrinho cheio terá apenas metade da aceleração. A massa "freia" a aceleração. Matematicamente:
                  </p>
                  <div className="bg-slate-900 p-2 rounded text-center border border-slate-700">
                    <MathFormula formula="a \propto \frac{1}{m}" display={true} />
                  </div>
                </div>
                
                <div className="bg-slate-800/50 p-4 rounded-lg border border-amber-500/30">
                  <p className="font-semibold text-amber-400 mb-2">Passo 3: A Síntese Genial</p>
                  <p className="text-sm text-slate-300 leading-relaxed mb-2">
                    Juntando as duas observações em uma única equação, Newton concluiu que a aceleração é igual à força dividida pela massa. Multiplicando cruzado, chegamos à forma clássica:
                  </p>
                  <div className="bg-slate-900 p-3 rounded text-center border border-amber-500/50">
                    <MathFormula formula="a = \frac{F}{m} \implies F = m \cdot a" display={true} />
                  </div>
                </div>
              </div>
            </div>

                        {/* Exemplo Resolvido da 2ª Lei */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mt-8">
              <div className="bg-slate-50 p-4 border-b border-slate-200">
                <h5 className="font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-600" />
                  Exemplo 3: O Bloco Empurrado (A Ponte entre Dinâmica e Cinemática)
                </h5>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-700 leading-relaxed">
                  Um bloco de massa <strong>m = 5 kg</strong> encontra-se inicialmente em repouso (<MathFormula formula="v_0 = 0" display={false} />) sobre uma superfície horizontal perfeitamente lisa (sem atrito). Uma força resultante constante de <strong>20 N</strong> passa a atuar sobre ele na direção horizontal. Qual será a velocidade exata do bloco após 4 segundos de aplicação dessa força?
                </p>
                <div className="bg-amber-50/50 p-5 rounded-lg border border-amber-100 space-y-4">
                  <p className="font-semibold text-amber-900">Resolução Passo a Passo e Análise Física:</p>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    Este é o problema clássico que conecta os dois mundos da mecânica. A Dinâmica (Força e Massa) descobre a aceleração. A Cinemática (MRUV) pega essa aceleração e descobre o futuro do corpo (velocidade e posição).
                  </p>
                  <p className="text-slate-700 text-sm leading-relaxed mt-2">
                    <strong>Passo 1: O Mundo da Dinâmica (Descobrindo a Aceleração)</strong><br/>
                    Usamos a Segunda Lei de Newton para descobrir qual aceleração essa força de 20 N consegue impor a essa massa de 5 kg.
                  </p>
                  <div className="bg-slate-900 p-3 rounded-lg text-center shadow-inner">
                    <MathFormula formula="F_R = m \cdot a \implies 20 = 5 \cdot a \implies a = \frac{20}{5} = 4 \text{ m/s}^2" display={true} className="text-amber-400" />
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed mt-4">
                    <strong>Passo 2: O Mundo da Cinemática (Prevendo o Futuro)</strong><br/>
                    Agora que sabemos que a aceleração é constante e vale 4 m/s², o movimento é um MRUV. Queremos a velocidade após um tempo <MathFormula formula="t = 4 \text{ s}" display={false} />. Usamos a Equação Horária da Velocidade:
                  </p>
                  <div className="bg-slate-900 p-3 rounded-lg text-center shadow-inner">
                    <MathFormula formula="v = v_0 + a \cdot t \implies v = 0 + 4 \cdot 4 \implies v = 16 \text{ m/s}" display={true} className="text-amber-400" />
                  </div>
                  <p className="text-slate-600 text-sm italic mt-4 border-l-2 border-amber-300 pl-3">
                    <strong>Aprofundamento:</strong> Se a força parasse de atuar exatamente no instante t = 4s, o que aconteceria? Pela Primeira Lei (Inércia), a aceleração zeraria instantaneamente, e o bloco continuaria viajando para sempre em MRU com a velocidade constante de 16 m/s.
                  </p>
                </div>
                </div>
              </div>
            </div>

            {/* Por que funciona? */}
            <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded p-6 mt-8">
              <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Por que a Segunda Lei funciona tão bem?
              </h4>
              <p className="text-slate-700 leading-relaxed mb-3">
                A Segunda Lei de Newton é uma das equações mais bem-sucedidas da história da ciência porque ela estabelece uma ponte perfeita entre o mundo invisível das causas (Forças) e o mundo visível dos efeitos (Movimento). Antes de Newton, os cientistas tentavam descrever o movimento apenas observando-o (Cinemática). Newton deu o passo além: ele descobriu a "engrenagem" por trás do movimento.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Ela funciona porque a natureza é determinística em escalas macroscópicas. Se você conhece a massa de um objeto e todas as forças atuando sobre ele, você pode prever exatamente onde ele estará e qual será sua velocidade em qualquer instante futuro. Foi usando exatamente essa equação (<MathFormula formula="F = ma" display={false} />) que a NASA calculou as trajetórias para enviar o homem à Lua!
              </p>
            </div>

            {/* Questão de Vestibular */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mt-8">
              <div className="bg-slate-800 p-4 border-b border-slate-700">
                <h5 className="font-bold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-400" />
                  Como cai no Vestibular? (Exemplo Prático)
                </h5>
              </div>
              <div className="p-6 space-y-4 bg-slate-50">
                <p className="text-slate-700 italic">
                  "Um carro de 1000 kg viaja a 72 km/h quando o motorista avista um obstáculo e pisa no freio, parando completamente após 5 segundos. Qual foi a intensidade da força de frenagem aplicada pelos freios?"
                </p>
                
                <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                  <p className="font-semibold text-slate-800">Resolução:</p>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    Neste tipo de questão, fazemos o caminho inverso do Exemplo 3. A cinemática nos dá os dados do movimento, e nós usamos isso para descobrir a força.
                  </p>
                  
                  <div className="space-y-2">
                    <p className="text-slate-700 text-sm font-bold">Passo 1: Converter unidades</p>
                    <p className="text-slate-600 text-sm">Velocidade inicial: <MathFormula formula="v_0 = 72 \text{ km/h} \div 3,6 = 20 \text{ m/s}" display={false} /></p>
                    <p className="text-slate-600 text-sm">Velocidade final: <MathFormula formula="v = 0" display={false} /> (ele parou)</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-slate-700 text-sm font-bold">Passo 2: Achar a aceleração (Cinemática)</p>
                    <div className="bg-slate-50 p-2 rounded text-center">
                      <MathFormula formula="v = v_0 + a \cdot t \implies 0 = 20 + a \cdot 5 \implies 5a = -20 \implies a = -4 \text{ m/s}^2" display={true} />
                    </div>
                    <p className="text-slate-600 text-xs italic text-center">O sinal negativo indica que é uma desaceleração (frenagem).</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-slate-700 text-sm font-bold">Passo 3: Achar a Força (Dinâmica)</p>
                    <div className="bg-slate-50 p-2 rounded text-center">
                      <MathFormula formula="F_R = m \cdot |a| \implies F_R = 1000 \cdot 4 = 4000 \text{ N}" display={true} />
                    </div>
                  </div>
                  
                  <p className="text-slate-800 font-bold mt-4">
                    Resposta: A força de frenagem foi de 4000 Newtons.
                  </p>
                </div>
              </div>
            </div>
          </div>

        {/* ===================== TERCEIRA LEI DE NEWTON ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200 mt-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Compass className="w-8 h-8 text-rose-500" />
            A Terceira Lei de Newton: Ação e Reação
          </h2>
          
          <div className="space-y-8">
            {/* Contexto Histórico */}
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 border-l-4 border-rose-500 p-6 rounded-r-xl">
              <h3 className="text-xl font-bold text-rose-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Contexto Histórico: A Simetria do Universo e a Natureza das Interações
              </h3>
              <p className="text-slate-700 leading-relaxed mb-3">
                A Primeira Lei define a inércia (o estado natural). A Segunda Lei quantifica a força (a causa da mudança). Mas Newton percebeu que faltava uma peça fundamental no quebra-cabeça mecânico: <strong>de onde vêm as forças e como elas se comportam na origem?</strong>
              </p>
              <p className="text-slate-700 leading-relaxed mb-3">
                Até o século XVII, o pensamento dominante (herança aristotélica) tratava a força como uma propriedade que um corpo "possuía" e simplesmente "jogava" sobre outro, como um raio ou um feitiço unidirecional. Newton, com sua visão genial, percebeu que as forças não são entidades isoladas, mas sim <strong>interações mútuas e simultâneas</strong> entre dois corpos. Não existe força solitária no universo. Toda força nasce de um "aperto de mãos" entre duas massas.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Essa descoberta revelou uma simetria profunda e inquebrável na natureza: você não pode tocar sem ser tocado. Se você empurra o universo, o universo empurra você de volta com a exata mesma intensidade, no mesmo instante. Essa lei é tão universal que se aplica desde o choque de duas bolas de bilhar até a atração gravitacional entre a Terra e a Lua.
              </p>
            </div>

            {/* O Enunciado Oficial */}
            <div className="bg-rose-50 border border-rose-200 rounded p-6">
              <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-600" />
                O Enunciado Oficial
              </h4>
              <blockquote className="border-l-4 border-rose-500 pl-4 italic text-slate-700 text-lg my-4">
                "A toda ação há sempre uma reação oposta e de igual intensidade: as ações mútuas de dois corpos um sobre o outro são sempre iguais e dirigidas em sentidos opostos."
              </blockquote>
            </div>

            {/* A Equação Fundamental e Demonstração */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 rounded-xl p-6 mb-6 shadow-xl">
              <div className="flex flex-col items-center justify-center mb-8">
                <h3 className="text-rose-400 font-bold tracking-widest uppercase text-sm mb-4">A Simetria Matemática</h3>
                <div className="bg-black/50 p-6 rounded-xl border border-slate-600 shadow-inner">
                  <MathFormula formula="\vec{F}_{AB} = -\vec{F}_{BA}" display={true} className="text-4xl text-white" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-10">
                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-600">
                  <div className="text-rose-400 font-bold text-xl mb-2">F<sub className="text-sm">AB</sub></div>
                  <h4 className="text-white font-semibold mb-2">Ação</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    A força que o corpo <strong>A</strong> exerce sobre o corpo <strong>B</strong>.
                  </p>
                </div>
                
                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-600">
                  <div className="text-pink-400 font-bold text-xl mb-2">-F<sub className="text-sm">BA</sub></div>
                  <h4 className="text-white font-semibold mb-2">Reação</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    A força que o corpo <strong>B</strong> exerce de volta sobre o corpo <strong>A</strong>. O sinal negativo indica que ela tem <strong>sentido oposto</strong>.
                  </p>
                </div>
              </div>

              <h4 className="font-semibold text-rose-400 mb-4 text-xl border-t border-slate-700 pt-6">As 3 Regras de Ouro do Par Ação-Reação</h4>
              <p className="text-slate-300 leading-relaxed mb-6">
                Para que duas forças formem um par de Ação e Reação, elas precisam obrigatoriamente obedecer a três regras simultâneas:
              </p>
              
              <div className="space-y-4">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="font-semibold text-rose-400 mb-2">Regra 1: Mesma Natureza</p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Ambas as forças devem ser do mesmo tipo. Se a ação é uma força gravitacional, a reação também é gravitacional. Se a ação é magnética, a reação é magnética. Se a ação é de contato (Normal), a reação é de contato.
                  </p>
                </div>
                
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="font-semibold text-rose-400 mb-2">Regra 2: Mesma Intensidade e Direção, Sentidos Opostos</p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Se você empurra a parede com 50 N na horizontal para a direita, a parede te empurra com exatos 50 N na horizontal para a esquerda. A simetria é perfeita.
                  </p>
                </div>
                
                <div className="bg-slate-800/50 p-4 rounded-lg border border-rose-500/30">
                  <p className="font-semibold text-rose-400 mb-2">Regra 3: Corpos Diferentes (A Regra Suprema)</p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    A ação atua no corpo B. A reação atua no corpo A. <strong>Por atuarem em corpos diferentes, as forças de ação e reação NUNCA se anulam!</strong> Você não pode somar as duas para calcular a força resultante em um único corpo.
                  </p>
                </div>
              </div>
            </div>

            {/* Por que funciona? */}
            <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded p-6 mt-8">
              <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Por que a Terceira Lei funciona? (A Conservação do Momento)
              </h4>
              <p className="text-slate-700 leading-relaxed mb-3">
                A Terceira Lei não é apenas uma regra arbitrária inventada por Newton. Ela é a manifestação macroscópica de um dos princípios mais sagrados e inquebráveis de todo o universo: a <strong>Conservação do Momento Linear</strong>.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Em um sistema isolado (sem forças externas), a quantidade total de movimento não pode mudar. Se o corpo A ganha momento para a direita ao empurrar o corpo B, o corpo B <strong>precisa</strong> ganhar a exata mesma quantidade de momento para a esquerda, para que a soma total continue sendo a mesma. A única forma matemática de isso acontecer é se a força que A faz em B for exatamente igual e oposta à força que B faz em A. A Terceira Lei é a garantia de que o universo não cria movimento do nada!
              </p>
            </div>

            {/* Armadilhas e Erros Conceituais */}
            <div className="mt-10">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">⚠️ Armadilhas Clássicas de Prova</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl">
                  <h4 className="font-bold text-red-900 mb-2">Erro 1: Peso e Normal são Ação e Reação</h4>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    <strong>A Armadilha:</strong> Como o Peso puxa para baixo e a Normal empurra para cima, e ambas se anulam num livro sobre a mesa, muitos acham que formam um par.<br/>
                    <strong>A Verdade:</strong> É o erro mais comum! Elas violam duas regras: atuam no <strong>mesmo corpo</strong> (o livro) e têm <strong>naturezas diferentes</strong> (Peso é gravitacional, Normal é eletromagnética de contato). A reação do Peso do livro está no centro da Terra. A reação da Normal está na mesa.
                  </p>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl">
                  <h4 className="font-bold text-red-900 mb-2">Erro 2: O mais forte faz mais força</h4>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    <strong>A Armadilha:</strong> Achar que num choque entre um caminhão e um fusca, o caminhão faz uma força maior no fusca do que o fusca faz no caminhão.<br/>
                    <strong>A Verdade:</strong> As forças são <strong>exatamente iguais</strong>. O fusca amassa mais não porque sofreu mais força, mas porque sua estrutura é mais frágil e sua massa é menor (logo, sofre maior aceleração, pela 2ª Lei: <MathFormula formula="a = F/m" display={false} />).
                  </p>
                </div>
              </div>
            </div>

                        {/* Aprofundamento: A Força Normal e o Plano Inclinado */}
            <div className="mt-12 bg-slate-900 rounded-2xl p-8 shadow-xl border border-slate-700 text-slate-100">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Zap className="w-7 h-7 text-amber-400" />
                Aprofundamento: A Força Normal e o Plano Inclinado
              </h3>
              <p className="text-slate-300 leading-relaxed mb-6">
                A Força Normal (<MathFormula formula="\vec{N}" display={false} />) é a força de contato que uma superfície exerce sobre um corpo apoiado nela. Ela é a <strong>reação</strong> da superfície à compressão que o corpo faz sobre ela. Entender a Normal é o segredo para resolver a grande maioria das questões de dinâmica, especialmente em planos inclinados.
              </p>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Superfície Horizontal */}
                <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-600">
                  <h4 className="font-bold text-amber-400 mb-4 text-lg border-b border-slate-700 pb-2">1. Superfície Horizontal</h4>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    Quando um bloco está em repouso sobre uma mesa horizontal, ele comprime a mesa com uma força igual ao seu Peso. A mesa reage empurrando o bloco para cima com a Força Normal.
                  </p>
                  <div className="bg-black/40 p-4 rounded-lg text-center mb-4">
                    <MathFormula formula="N = P = m \cdot g" display={true} className="text-white" />
                  </div>
                  <p className="text-slate-400 text-xs italic">
                    *Atenção: N = P apenas porque não há outras forças verticais e a superfície é horizontal. Elas se anulam, mas <strong>não são</strong> par de ação e reação!
                  </p>
                </div>

                {/* Plano Inclinado */}
                <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-600">
                  <h4 className="font-bold text-amber-400 mb-4 text-lg border-b border-slate-700 pb-2">2. O Plano Inclinado</h4>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    Se inclinarmos a superfície em um ângulo <MathFormula formula="\theta" display={false} />, o Peso continua apontando para o centro da Terra, mas a Normal continua perpendicular (90°) à superfície. O Peso se decompõe em duas partes:
                  </p>
                  <ul className="space-y-3 text-sm text-slate-300 mb-4">
                    <li><span className="text-amber-400 font-bold">P<sub>x</sub>:</span> Puxa o bloco rampa abaixo (<MathFormula formula="P_x = P \cdot \sin(\theta)" display={false} />)</li>
                    <li><span className="text-amber-400 font-bold">P<sub>y</sub>:</span> Comprime o bloco contra a rampa (<MathFormula formula="P_y = P \cdot \cos(\theta)" display={false} />)</li>
                  </ul>
                  <div className="bg-black/40 p-4 rounded-lg text-center">
                    <MathFormula formula="N = P_y = m \cdot g \cdot \cos(\theta)" display={true} className="text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-amber-900/30 border-l-4 border-amber-500 p-5 rounded-r-xl">
                <h4 className="font-bold text-amber-400 mb-2">Por que isso é tão cobrado?</h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  A Força Normal é crucial porque ela determina a <strong>Força de Atrito</strong> (<MathFormula formula="F_{at} = \mu \cdot N" display={false} />). No plano inclinado, como a Normal é menor que o Peso (<MathFormula formula="\cos(\theta) < 1" display={false} />), o atrito máximo possível também diminui. É por isso que é mais fácil escorregar em uma rampa íngreme: não é só porque a gravidade puxa mais forte para baixo (<MathFormula formula="P_x" display={false} />), mas também porque o atrito fica mais fraco (a Normal diminui)!
                </p>
              </div>
            </div>

            {/* Exemplos Práticos */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">Como usamos a Terceira Lei na prática?</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-3 text-lg">1. Como nós andamos?</h4>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    Você já parou para pensar em como consegue andar para frente? Você não se empurra para frente. O que você faz é empurrar o chão para <strong>trás</strong> com o seu pé (força de atrito).
                  </p>
                  <p className="text-slate-700 text-sm leading-relaxed mt-2">
                    Pela Terceira Lei, o chão reage e empurra o seu pé para <strong>frente</strong> com a mesma intensidade. É a força do chão sobre você que te faz andar! Se não houvesse atrito (como no gelo liso), você não conseguiria empurrar o chão para trás, o chão não te empurraria para frente, e você não sairia do lugar.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-3 text-lg">2. O Foguete no Espaço</h4>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    Como um foguete acelera no vácuo do espaço, onde não há ar para ele "se apoiar" ou empurrar contra?
                  </p>
                  <p className="text-slate-700 text-sm leading-relaxed mt-2">
                    Ele não precisa de ar. O motor do foguete faz uma força colossal empurrando os gases da combustão para <strong>trás</strong> (Ação). Imediatamente, os gases reagem e empurram o foguete para <strong>frente</strong> com a mesma força (Reação). É uma aplicação pura e direta da Terceira Lei de Newton.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ===================== FORÇA PESO E GRAVIDADE ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200 mt-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-600" />
            A Força Peso: A Gravidade em Ação
          </h2>
          
          <div className="space-y-8">
            {/* Contexto Histórico */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-6 rounded-r-xl">
              <h3 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Contexto Histórico: A Maçã, a Lua e a Unificação do Universo
              </h3>
              <p className="text-slate-700 leading-relaxed mb-3">
                A lenda popular diz que Isaac Newton descobriu a gravidade quando uma maçã caiu em sua cabeça enquanto ele descansava sob uma árvore. A verdade histórica é muito mais profunda, elegante e revolucionária: a genialidade de Newton não foi descobrir que as coisas caem (qualquer camponês da época sabia disso perfeitamente), mas sim perceber que <strong>a força invisível que puxa a maçã para o chão é a exata mesma força que mantém a Lua orbitando a Terra</strong>.
              </p>
              <p className="text-slate-700 leading-relaxed mb-3">
                Antes de Newton, a ciência (fortemente influenciada por Aristóteles e pela Igreja) acreditava que o universo era dividido em dois reinos com regras completamente distintas: as leis que governavam a Terra (física terrestre, imperfeita e corruptível) eram completamente diferentes das leis que governavam os astros (física celeste, perfeita e eterna).
              </p>
              <p className="text-slate-700 leading-relaxed">
                Newton destruiu essa barreira e unificou o universo com uma única equação. Ele provou matematicamente que a gravidade é universal. O Peso que você sente nas suas pernas empurrando o chão agora nada mais é do que a Força de Atração Gravitacional que a massa colossal do planeta Terra exerce sobre a sua massa.
              </p>
            </div>

            {/* A Equação Fundamental */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 rounded-xl p-6 mb-6 shadow-xl">
              <div className="flex flex-col items-center justify-center mb-8">
                <h3 className="text-blue-400 font-bold tracking-widest uppercase text-sm mb-4">A Equação do Peso</h3>
                <div className="bg-black/50 p-6 rounded-xl border border-slate-600 shadow-inner">
                  <MathFormula formula="\vec{P} = m \cdot \vec{g}" display={true} className="text-4xl text-white" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-600">
                  <div className="text-blue-400 font-bold text-xl mb-2">P</div>
                  <h4 className="text-white font-semibold mb-2">Força Peso (N)</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    A força de atração gravitacional. É um vetor que aponta <strong>sempre e invariavelmente</strong> para o centro do planeta. Não importa se o corpo está em um plano inclinado, voando ou caindo: o Peso aponta para baixo.
                  </p>
                </div>
                
                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-600">
                  <div className="text-cyan-400 font-bold text-xl mb-2">m</div>
                  <h4 className="text-white font-semibold mb-2">Massa (kg)</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    A quantidade de matéria e a medida da inércia. É uma propriedade intrínseca e absoluta do corpo. <strong>A massa não muda</strong> se você for para a Lua, para Marte ou para o espaço profundo.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-600">
                  <div className="text-teal-400 font-bold text-xl mb-2">g</div>
                  <h4 className="text-white font-semibold mb-2">Gravidade (m/s²)</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    A aceleração gravitacional local. Depende da massa do planeta e da distância até o centro dele. Na superfície da Terra é ~9,8 m/s² (frequentemente arredondada para 10 m/s² em provas para facilitar os cálculos).
                  </p>
                </div>
              </div>
            </div>

            {/* Demonstração: De onde vem P = mg? */}
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-6">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Demonstração: De onde vem a fórmula do Peso?
              </h4>
              <p className="text-slate-700 leading-relaxed mb-3">
                Muitos alunos acham que <MathFormula formula="P = mg" display={false} /> é uma lei nova e independente. Não é! Ela é simplesmente a <strong>Segunda Lei de Newton (<MathFormula formula="F = ma" display={false} />)</strong> aplicada ao caso específico da queda livre. Veja como a dedução é elegante e direta:
              </p>
              <ul className="space-y-4 text-slate-700 mb-6 ml-4 list-disc">
                <li><strong>Passo 1:</strong> Imagine que você solta uma pedra no ar. Se ignorarmos a resistência do ar, a única força atuando sobre ela é a atração da Terra (o Peso). Logo, a Força Resultante é o próprio Peso: <MathFormula formula="F_R = P" display={false} />.</li>
                <li><strong>Passo 2:</strong> Galileu já havia provado que todos os corpos em queda livre caem com a mesma aceleração, que chamamos de aceleração da gravidade (<MathFormula formula="g" display={false} />). Logo, a aceleração do corpo é: <MathFormula formula="a = g" display={false} />.</li>
                <li><strong>Passo 3:</strong> Substituindo essas duas verdades na Segunda Lei de Newton (<MathFormula formula="F_R = m \cdot a" display={false} />), chegamos inevitavelmente à fórmula do Peso.</li>
              </ul>
              <div className="bg-white p-5 rounded-lg border border-blue-200 text-center shadow-sm">
                <MathFormula formula="F_R = m \cdot a \implies P = m \cdot g" display={true} className="text-xl" />
              </div>
            </div>

            {/* Armadilhas */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl">
                <h4 className="font-bold text-red-900 mb-2">Erro Clássico: Massa vs. Peso</h4>
                <p className="text-slate-700 text-sm leading-relaxed">
                  <strong>A Armadilha:</strong> Subir na balança da farmácia e dizer "Eu peso 70 kg".<br/><br/>
                  <strong>A Verdade:</strong> Na física, isso é um crime conceitual grave! 70 kg é a sua <strong>massa</strong> (a quantidade de matéria que forma o seu corpo). O seu <strong>Peso</strong> na Terra é uma força, medida em Newtons, de aproximadamente 700 N (<MathFormula formula="P = 70 \cdot 10" display={false} />). Se você viajar para a Lua, sua massa continuará sendo exatamente 70 kg (você não perdeu pedaços do seu corpo na viagem), mas o seu Peso cairá para cerca de 112 N, porque a gravidade lunar é muito mais fraca. A balança da farmácia, na verdade, mede a Força Normal e divide por 10 para te mostrar a massa.
                </p>
              </div>
              <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl">
                <h4 className="font-bold text-red-900 mb-2">Erro Clássico: O Peso no Plano Inclinado</h4>
                <p className="text-slate-700 text-sm leading-relaxed">
                  <strong>A Armadilha:</strong> Desenhar o vetor Peso perpendicular à rampa em um plano inclinado.<br/><br/>
                  <strong>A Verdade:</strong> O Peso <strong>nunca</strong> se importa com a inclinação do chão onde você está pisando. Ele é a atração entre o seu centro de massa e o centro da Terra. Portanto, o vetor Peso deve ser desenhado <strong>sempre perfeitamente na vertical, apontando para baixo</strong>. Quem fica perpendicular à rampa é a Força Normal, não o Peso!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== FORÇA DE TRAÇÃO ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200 mt-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Activity className="w-8 h-8 text-purple-600" />
            A Força de Tração (ou Tensão)
          </h2>
          
          <div className="space-y-8">
            <p className="text-slate-700 leading-relaxed text-lg">
              A Tração (<MathFormula formula="\vec{T}" display={false} />) é a força transmitida através de fios, cordas, cabos ou correntes quando eles são esticados. Diferente do Peso (que atua à distância) ou da Normal (que atua por compressão), a Tração atua exclusivamente por <strong>tração</strong> (puxão). Você não consegue empurrar um bloco usando uma corda mole; você só consegue puxá-lo. A corda é a "mensageira" que transmite a força de uma ponta à outra.
            </p>

            {/* O Fio Ideal */}
            <div className="bg-purple-50 border-l-4 border-purple-500 rounded p-6">
              <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                O Pulo do Gato: O Conceito de "Fio Ideal"
              </h4>
              <p className="text-slate-700 leading-relaxed mb-4">
                Em 99% das questões de vestibular e concursos militares, você lerá a expressão "fio ideal" ou "fio inextensível e de massa desprezível". Muitos alunos ignoram essa frase achando que é apenas "enfeite" do enunciado. Não é! Essa frase é a autorização matemática para você resolver a questão. Ela tem duas consequências vitais:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-lg border border-purple-200 shadow-sm">
                  <h5 className="font-bold text-purple-800 mb-2">1. Inextensível (Não estica)</h5>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Se o fio não estica como um elástico, isso garante que todos os blocos ligados por ele andarão exatamente a mesma distância, no mesmo tempo. Conclusão de ouro: <strong>todos os blocos do sistema terão exatamente a mesma velocidade e a mesma aceleração escalar</strong>. Eles se movem como se fossem um corpo único.
                  </p>
                </div>
                <div className="bg-white p-5 rounded-lg border border-purple-200 shadow-sm">
                  <h5 className="font-bold text-purple-800 mb-2">2. Massa Desprezível (Sem peso próprio)</h5>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Se a corda não tem massa, ela não "gasta" força para ser acelerada (<MathFormula formula="F = 0 \cdot a = 0" display={false} />). Conclusão de ouro: <strong>a força de Tração é rigorosamente igual em todos os pontos do fio</strong>. A força que puxa o bloco A numa ponta é a exata mesma força que puxa o bloco B na outra ponta.
                  </p>
                </div>
              </div>
            </div>

            {/* Exemplo Prático: Máquina de Atwood */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mt-8">
              <div className="bg-slate-800 p-5 border-b border-slate-700">
                <h5 className="font-bold text-white flex items-center gap-2 text-lg">
                  <Target className="w-6 h-6 text-purple-400" />
                  Exemplo Clássico e Resolvido: A Máquina de Atwood (Polia)
                </h5>
              </div>
              <div className="p-8 space-y-6 bg-slate-50">
                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                  <p className="text-slate-700 leading-relaxed">
                    <strong>O Problema:</strong> Dois blocos, A (massa = 6 kg) e B (massa = 4 kg), estão ligados por um fio ideal que passa por uma polia ideal (sem atrito e sem massa), pendurados um de cada lado. O sistema é solto do repouso. Calcule a aceleração do sistema e a Tração no fio. (Adote <MathFormula formula="g = 10 \text{ m/s}^2" display={false} />).
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                  <h6 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3">Resolução pelo Método do Sistema (O mais rápido e seguro):</h6>
                  
                  <div className="space-y-3">
                    <p className="text-slate-800 font-bold flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                      Olhar para o sistema como um todo (O "Cabo de Guerra")
                    </p>
                    <p className="text-slate-600 text-sm leading-relaxed pl-8">
                      As forças de Tração são forças <strong>internas</strong> ao sistema (A puxa B para cima, B puxa A para cima). Para achar a aceleração global, nós ignoramos as forças internas e olhamos apenas para as forças externas que tentam mover o sistema. É um cabo de guerra entre os Pesos!
                    </p>
                    <ul className="text-slate-600 text-sm ml-12 list-disc space-y-1">
                      <li>O Peso de A tenta girar a polia para o lado dele: <MathFormula formula="P_A = m_A \cdot g = 6 \cdot 10 = 60 \text{ N}" display={false} /></li>
                      <li>O Peso de B tenta girar a polia para o outro lado: <MathFormula formula="P_B = m_B \cdot g = 4 \cdot 10 = 40 \text{ N}" display={false} /></li>
                    </ul>
                    <p className="text-slate-600 text-sm pl-8 mt-2">A força resultante externa é a diferença entre eles (o bloco A ganha o cabo de guerra):</p>
                    <div className="bg-slate-50 p-3 rounded-lg text-center ml-8 border border-slate-100">
                      <MathFormula formula="F_R = P_A - P_B = 60 - 40 = 20 \text{ N}" display={true} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-slate-800 font-bold flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                      Aplicar a 2ª Lei de Newton para o sistema inteiro
                    </p>
                    <p className="text-slate-600 text-sm leading-relaxed pl-8">
                      A massa total que essa força resultante de 20 N precisa arrastar é a soma das massas de todos os blocos presos ao fio (<MathFormula formula="6 + 4 = 10 \text{ kg}" display={false} />).
                    </p>
                    <div className="bg-slate-50 p-3 rounded-lg text-center ml-8 border border-slate-100">
                      <MathFormula formula="F_R = m_{total} \cdot a \implies 20 = 10 \cdot a \implies a = 2 \text{ m/s}^2" display={true} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-slate-800 font-bold flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                      Isolar um bloco para achar a Tração (A Força Interna Revelada)
                    </p>
                    <p className="text-slate-600 text-sm leading-relaxed pl-8">
                      Agora que sabemos a aceleração global do sistema (2 m/s²), podemos aplicar a Segunda Lei de Newton olhando para apenas um bloco isoladamente. Ao fazer isso, a Tração (que antes era interna e invisível) passa a ser uma força externa atuando sobre aquele bloco específico. Vamos escolher o Bloco B.
                    </p>
                    <p className="text-slate-600 text-sm leading-relaxed pl-8 mt-2">
                      Sabemos que o Bloco A é mais pesado, então o Bloco B está <strong>subindo acelerado</strong> a 2 m/s². Se ele sobe acelerado, a força que puxa para cima (Tração) tem que ser obrigatoriamente maior que a força que puxa para baixo (Peso de B). A Força Resultante sobre o Bloco B será a diferença entre elas:
                    </p>
                    <div className="bg-slate-50 p-4 rounded-lg text-center ml-8 border border-slate-100 shadow-inner">
                      <MathFormula formula="F_{R(B)} = m_B \cdot a" display={true} className="mb-2 text-purple-900" />
                      <MathFormula formula="T - P_B = m_B \cdot a" display={true} className="mb-2 text-purple-900" />
                      <MathFormula formula="T - 40 = 4 \cdot 2" display={true} className="mb-2 text-purple-900" />
                      <MathFormula formula="T = 40 + 8 \implies T = 48 \text{ N}" display={true} className="text-purple-900 font-bold" />
                    </div>
                    <p className="text-slate-600 text-sm italic pl-8 mt-4 border-l-2 border-purple-300 ml-8 pl-3">
                      <strong>Dica de Ouro para Provas:</strong> Como o fio é ideal, a Tração é a mesma em toda a sua extensão. Se você fizesse o cálculo isolando o Bloco A (que está descendo acelerado, logo o Peso ganha da Tração: <MathFormula formula="P_A - T = m_A \cdot a" display={false} />), a conta seria: <MathFormula formula="60 - T = 6 \cdot 2 \implies T = 60 - 12 = 48 \text{ N}" display={false} />. O resultado é rigorosamente o mesmo! Use o bloco que tiver a conta mais fácil.
                    </p>
                  </div>
                  
                  <div className="bg-purple-900 text-white p-4 rounded-lg text-center mt-6 shadow-md">
                    <p className="font-bold text-lg">
                      Resposta Final: A aceleração é 2 m/s² e a Tração no fio é 48 N.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>
    </div>
  );
}
