import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, AlertCircle, Lightbulb, Activity, Target, Zap, TrendingUp, TrendingDown, Minus, Box, CheckCircle2, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { MathFormula } from "@/components/MathFormula";

export default function CinematicaTopicVelocidade() {
  useEffect(() => {
    if ((window as any).MathJax) {
      (window as any).MathJax.contentDocument = document;
      (window as any).MathJax.typesetPromise().catch((err: any) => console.log(err));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container py-4 flex items-center gap-4">
          <Link href="/cinematica">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Velocidade e Aceleração</h1>
        </div>
      </header>

      <section className="container py-6 md:py-12 space-y-6 md:space-y-12">
        {/* ===================== 1. CONTEXTO HISTÓRICO E CONCEITUAL ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">1. Contexto Histórico e Conceitual</h2>
          </div>
          <div className="space-y-6 text-slate-700 leading-relaxed">
            <p>
              A compreensão do movimento é um dos pilares da física clássica. Historicamente, a transição do pensamento aristotélico para o galileano marcou o nascimento da ciência moderna. Para <strong>Aristóteles</strong>, o movimento era uma "qualidade" intrínseca do objeto, e a velocidade dependia da "força" aplicada. Foi <strong>Galileu Galilei</strong> quem, através de experimentos rigorosos com planos inclinados, percebeu que a velocidade é uma relação geométrica e temporal, independente da natureza do objeto em queda livre (no vácuo).
            </p>
            <p>
              Na física de elite, como exigido pelo <strong>ITA e IME</strong>, a velocidade não é apenas um número. Ela é a <strong>taxa de variação da posição</strong>. A grande sacada conceitual, explorada profundamente por autores como <strong>Renato Brito</strong>, é entender que o movimento pode ser analisado sob duas óticas: a <strong>escalar</strong>, que se preocupa com o "rastro" deixado na trajetória (o caminho percorrido), e a <strong>vetorial</strong>, que foca na mudança líquida de posição no espaço tridimensional.
            </p>
            <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500 italic">
              "A velocidade média é uma abstração matemática que substitui um movimento complexo e variável por um movimento uniforme hipotético que produziria o mesmo efeito (deslocamento ou distância) no mesmo intervalo de tempo." — <em>Reflexão baseada no Tópicos de Física.</em>
            </div>
          </div>
        </div>

        {/* ===================== 2. DEFINIÇÕES PRECISAS ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">2. Definições Precisas</h2>
          </div>
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-2xl font-bold text-blue-700 mb-4">Velocidade Escalar Média (<MathFormula formula="v_{em}" display={false} />)</h3>
                <div className="text-slate-600 mb-6 leading-relaxed">
                  É a grandeza escalar que mede a rapidez com que um móvel percorre uma <strong>distância total</strong> (<MathFormula formula="d" display={false} />) ao longo de uma trajetória, independentemente da direção ou sentido. Ela ignora o caráter vetorial e foca apenas no "comprimento do rastro".
                </div>
                <div className="bg-blue-100/50 p-4 rounded-xl text-blue-900 font-medium text-sm border border-blue-200">
                  <strong>Observação Importante:</strong> Em um movimento de "vai e vem", a velocidade escalar média nunca será zero se houve movimento, pois a distância <MathFormula formula="d" display={false} /> é sempre cumulativa e positiva.
                </div>
              </div>
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-2xl font-bold text-purple-700 mb-4">Velocidade Vetorial Média (<MathFormula formula="\vec{v}_m" display={false} />)</h3>
                <div className="text-slate-600 mb-6 leading-relaxed">
                  É a grandeza vetorial definida pela razão entre o <strong>vetor deslocamento</strong> (<MathFormula formula="\Delta \vec{r}" display={false} />) e o intervalo de tempo. Ela aponta sempre na mesma direção e sentido do vetor deslocamento (da posição inicial para a final).
                </div>
                <div className="bg-purple-100/50 p-4 rounded-xl text-purple-900 font-medium text-sm border border-purple-200">
                  <strong>Observação Importante:</strong> Se um móvel completa uma volta e retorna ao ponto de partida, seu deslocamento é nulo (<MathFormula formula="\Delta \vec{r} = \vec{0}" display={false} />), logo sua velocidade vetorial média é <strong>zero</strong>, mesmo que ele tenha corrido a 100 km/h.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== 3. DEDUÇÕES MATEMÁTICAS COMPLETAS ===================== */}
        <div className="bg-slate-900 rounded-3xl shadow-2xl p-10 mb-8 text-white border border-slate-800">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">3. Deduções Matemáticas Completas</h2>
          </div>
          <div className="space-y-10">
            <div className="relative pl-8 border-l-2 border-blue-500/30">
              <div className="absolute -left-[9px] top-0 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
              <h4 className="text-xl font-semibold text-blue-300 mb-4">A Abstração da Velocidade Escalar</h4>
              <div className="text-slate-400 mb-6 leading-relaxed">
                Considere um móvel que percorre sucessivos trechos <MathFormula formula="\Delta s_1, \Delta s_2, \dots, \Delta s_n" display={false} /> em intervalos <MathFormula formula="\Delta t_1, \Delta t_2, \dots, \Delta t_n" display={false} />. A distância total <MathFormula formula="d" display={false} /> é a soma dos módulos desses deslocamentos:
              </div>
              <div className="bg-slate-800/80 p-8 rounded-2xl border border-slate-700 text-center shadow-inner mb-6">
                <MathFormula formula="v_{em} = \frac{\sum_{i=1}^{n} |\Delta s_i|}{\sum_{i=1}^{n} \Delta t_i} = \frac{d_{total}}{\Delta t_{total}}" className="text-3xl" />
              </div>
              <div className="bg-slate-700/40 p-6 rounded-xl border border-slate-600 text-sm space-y-3">
                <p className="text-slate-300 font-semibold mb-3">Legenda dos Termos:</p>
                <div className="grid md:grid-cols-2 gap-4 text-slate-400">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-bold min-w-fit"><MathFormula formula="v_{em}" display={false} /></span>
                    <span>Velocidade escalar média (m/s)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-bold min-w-fit"><MathFormula formula="\sum_{i=1}^{n} |\Delta s_i|" display={false} /></span>
                    <span>Soma dos módulos de todos os deslocamentos parciais (m)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-bold min-w-fit"><MathFormula formula="d_{total}" display={false} /></span>
                    <span>Distância total percorrida (m)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-bold min-w-fit"><MathFormula formula="\Delta t_{total}" display={false} /></span>
                    <span>Intervalo de tempo total (s)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative pl-8 border-l-2 border-purple-500/30">
              <div className="absolute -left-[9px] top-0 w-4 h-4 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
              <h4 className="text-xl font-semibold text-purple-300 mb-4">O Rigor do Vetor Deslocamento</h4>
              <div className="text-slate-400 mb-6 leading-relaxed">
                No espaço tridimensional, a posição é dada pelo vetor <MathFormula formula="\vec{r}(t) = x(t)\hat{i} + y(t)\hat{j} + z(t)\hat{k}" display={false} />. O deslocamento entre <MathFormula formula="t_1" display={false} /> e <MathFormula formula="t_2" display={false} /> é a diferença vetorial:
              </div>
              <div className="bg-slate-800/80 p-8 rounded-2xl border border-slate-700 text-center shadow-inner mb-6">
                <MathFormula formula="\vec{v}_m = \frac{\vec{r}(t_2) - \vec{r}(t_1)}{t_2 - t_1} = \frac{\Delta \vec{r}}{\Delta t}" className="text-3xl" />
              </div>
              <div className="bg-slate-700/40 p-6 rounded-xl border border-slate-600 text-sm space-y-3">
                <p className="text-slate-300 font-semibold mb-3">Legenda dos Termos:</p>
                <div className="grid md:grid-cols-2 gap-4 text-slate-400">
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold min-w-fit"><MathFormula formula="\vec{v}_m" display={false} /></span>
                    <span>Velocidade vetorial média (m/s) - Vetor!</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold min-w-fit"><MathFormula formula="\vec{r}(t_2)" display={false} /></span>
                    <span>Vetor posição final no instante <MathFormula formula="t_2" display={false} /> (m)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold min-w-fit"><MathFormula formula="\vec{r}(t_1)" display={false} /></span>
                    <span>Vetor posição inicial no instante <MathFormula formula="t_1" display={false} /> (m)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold min-w-fit"><MathFormula formula="\Delta \vec{r}" display={false} /></span>
                    <span>Vetor deslocamento (m) - sempre aponta de inicial para final</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold min-w-fit"><MathFormula formula="\Delta t" display={false} /></span>
                    <span>Intervalo de tempo (s)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold min-w-fit"><MathFormula formula="\hat{i}, \hat{j}, \hat{k}" display={false} /></span>
                    <span>Versores unitários nas direções x, y, z</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-sm text-slate-500 italic">
                *Observe que o módulo da velocidade vetorial média <MathFormula formula="|\vec{v}_m|" display={false} /> NÃO é necessariamente igual à velocidade escalar média <MathFormula formula="v_{em}" display={false} />.
              </div>
            </div>
          </div>
        </div>

        {/* ===================== 4. TERMO-A-TERMO EM GRID 2 COLUNAS ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <Box className="w-6 h-6 text-slate-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">4. Termo-a-termo</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="group p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all">
              <div className="flex items-start gap-4">
                <div className="text-3xl font-black text-blue-600/20 group-hover:text-blue-600/40 transition-colors"><MathFormula formula="v_m" display={false} /></div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">Velocidade Média</p>
                  <div className="text-sm text-slate-600 leading-relaxed">Representa a taxa média de variação da posição. No SI, é expressa em <MathFormula formula="m/s" display={false} />. Para converter de <MathFormula formula="km/h" display={false} /> para <MathFormula formula="m/s" display={false} />, dividimos por 3,6.</div>
                </div>
              </div>
            </div>
            <div className="group p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all">
              <div className="flex items-start gap-4">
                <div className="text-3xl font-black text-blue-600/20 group-hover:text-blue-600/40 transition-colors"><MathFormula formula="\Delta s" display={false} /></div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">Deslocamento Escalar</p>
                  <div className="text-sm text-slate-600 leading-relaxed">É a diferença entre a posição final e a inicial na trajetória (<MathFormula formula="s_f - s_i" display={false} />). Pode ser negativo se o móvel se mover contra a orientação da trajetória.</div>
                </div>
              </div>
            </div>
            <div className="group p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all">
              <div className="flex items-start gap-4">
                <div className="text-3xl font-black text-blue-600/20 group-hover:text-blue-600/40 transition-colors"><MathFormula formula="d" display={false} /></div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">Distância Percorrida</p>
                  <div className="text-sm text-slate-600 leading-relaxed">É o comprimento real do caminho percorrido. É sempre maior ou igual ao módulo do deslocamento escalar (<MathFormula formula="d \geq |\Delta s|" display={false} />).</div>
                </div>
              </div>
            </div>
            <div className="group p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all">
              <div className="flex items-start gap-4">
                <div className="text-3xl font-black text-blue-600/20 group-hover:text-blue-600/40 transition-colors"><MathFormula formula="\Delta t" display={false} /></div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">Intervalo de Tempo</p>
                  <p className="text-sm text-slate-600 leading-relaxed">Duração do fenômeno observado. Na física clássica, o tempo é absoluto e flui uniformemente para todos os referenciais inerciais.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== 5. RELAÇÃO MATEMÁTICA ===================== */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-10 mb-8 rounded-3xl shadow-xl text-white">
          <div className="flex items-center gap-4 mb-6">
            <TrendingUp className="w-10 h-10 text-blue-200" />
            <h3 className="text-3xl font-bold">5. Relação Matemática Fundamental</h3>
          </div>
          <div className="space-y-6">
            <p className="text-blue-100 text-lg leading-relaxed">
              A relação entre a velocidade escalar e a vetorial é uma das questões conceituais mais cobradas em provas de alto nível. A regra de ouro é:
            </p>
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 text-center">
              <MathFormula formula="v_{em} \geq |\vec{v}_m|" className="text-4xl font-bold" />
            </div>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h4 className="font-bold text-green-300 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Igualdade (=)
                </h4>
                <p className="text-sm text-blue-100">Ocorre <strong>apenas</strong> se o movimento for retilíneo e mantiver o mesmo sentido durante todo o intervalo. Nesse caso, a distância é igual ao módulo do deslocamento.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Desigualdade (&gt;)
                </h4>
                <p className="text-sm text-blue-100">Ocorre se a trajetória for <strong>curva</strong> (pois a corda é menor que o arco) ou se houver <strong>inversão de sentido</strong> (pois a distância continua somando enquanto o deslocamento subtrai).</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== 6. TABELAS COMPARATIVAS ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-slate-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">6. Tabela Comparativa</h2>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-5 text-left font-bold uppercase tracking-wider">Propriedade</th>
                  <th className="p-5 text-center font-bold uppercase tracking-wider">Velocidade Escalar Média</th>
                  <th className="p-5 text-center font-bold uppercase tracking-wider">Velocidade Vetorial Média</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-5 font-bold text-slate-800 bg-slate-50/50">Natureza Física</td>
                  <td className="p-5 text-center text-slate-600 italic">Escalar (apenas módulo)</td>
                  <td className="p-5 text-center text-slate-600 italic">Vetorial (módulo, direção e sentido)</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-5 font-bold text-slate-800 bg-slate-50/50">Dependência da Trajetória</td>
                  <td className="p-5 text-center text-slate-600">Total (depende de cada curva e desvio)</td>
                  <td className="p-5 text-center text-slate-600">Nula (depende apenas dos pontos inicial e final)</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-5 font-bold text-slate-800 bg-slate-50/50">Sinal Matemático</td>
                  <td className="p-5 text-center text-green-700 font-semibold">Sempre <MathFormula formula="\geq 0" display={false} /></td>
                  <td className="p-5 text-center text-slate-600">Pode ser <MathFormula formula="< 0" display={false} /> (conforme o eixo)</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-5 font-bold text-slate-800 bg-slate-50/50">Significado Prático</td>
                  <td className="p-5 text-center text-slate-600">Consumo de combustível / Cansaço</td>
                  <td className="p-5 text-center text-slate-600">Eficácia da navegação / Objetivo final</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ===================== 7. EXEMPLOS RESOLVIDOS ITA/IME ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">7. Exemplos Resolvidos</h2>
          </div>
          <div className="space-y-10">
            {/* Exemplo 1 */}
            <div className="bg-green-50/30 border border-green-100 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                
                <h4 className="text-xl font-bold text-green-900">A Armadilha da Média Aritmética</h4>
              </div>
              <div className="text-slate-700 mb-6 leading-relaxed text-lg">
                Um avião percorre a distância entre duas cidades A e B com velocidade constante <MathFormula formula="v_1" display={false} /> e retorna de B para A com velocidade constante <MathFormula formula="v_2" display={false} />. Determine a velocidade escalar média para a viagem completa de ida e volta.
              </div>
              <div className="bg-white p-8 rounded-2xl border border-green-200 shadow-inner">
                <p className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" /> Resolução:
                </p>
                <div className="space-y-6 text-slate-700">
                  <div className="flex gap-4 items-start">
                    <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1">1</span>
                    <p>Seja <MathFormula formula="L" display={false} /> a distância entre A e B. A distância total percorrida é <MathFormula formula="d = 2L" display={false} />.</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1">2</span>
                    <p>O tempo de ida é <MathFormula formula="t_1 = L/v_1" display={false} /> e o tempo de volta é <MathFormula formula="t_2 = L/v_2" display={false} />.</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1">3</span>
                    <p>O tempo total é <MathFormula formula="T = t_1 + t_2 = \frac{L}{v_1} + \frac{L}{v_2} = L \left( \frac{v_1 + v_2}{v_1 v_2} \right)" display={false} />.</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1">4</span>
                    <p>Aplicando a definição: <MathFormula formula="v_m = \frac{2L}{T} = \frac{2L}{L \frac{v_1 + v_2}{v_1 v_2}} = \frac{2 v_1 v_2}{v_1 + v_2}" display={false} />.</p>
                  </div>
                  <div className="bg-green-900 text-white p-6 rounded-2xl mt-6 shadow-lg">
                    <p className="text-xs uppercase tracking-widest text-green-400 mb-2 font-bold">Conclusão:</p>
                    <div className="text-lg leading-relaxed">
                      A velocidade média em trechos de <strong>distâncias iguais</strong> é a <strong>Média Harmônica</strong> das velocidades. Nunca use a média aritmética (<MathFormula formula="(v_1+v_2)/2" display={false} />), pois o móvel passa mais tempo no trecho mais lento!
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Exemplo 2 */}
            <div className="bg-blue-50/30 border border-blue-100 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                
                <h4 className="text-xl font-bold text-blue-900">Velocidade Vetorial em Trajetória Curva</h4>
              </div>
              <div className="text-slate-700 mb-6 leading-relaxed text-lg">
                Uma partícula percorre uma semicircunferência de raio <MathFormula formula="R = 10 \text{ m}" display={false} /> em um intervalo de tempo <MathFormula formula="\Delta t = 5 \text{ s}" display={false} /> com velocidade escalar constante. Determine a velocidade escalar média e o módulo da velocidade vetorial média. (Use <MathFormula formula="\pi = 3" display={false} />).
              </div>
              <div className="bg-white p-8 rounded-2xl border border-blue-200 shadow-inner">
                <p className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" /> Resolução:
                </p>
                <div className="space-y-6 text-slate-700">
                  <p><strong>1. Velocidade Escalar Média:</strong> A distância percorrida é o comprimento do arco (metade da circunferência): <MathFormula formula="d = \pi R = 3 \cdot 10 = 30 \text{ m}" display={false} />.</p>
                  <div className="bg-slate-50 p-4 rounded-lg text-center font-mono">
                    <MathFormula formula="v_{em} = \frac{30}{5} = 6 \text{ m/s}" />
                  </div>
                  <p><strong>2. Velocidade Vetorial Média:</strong> O deslocamento é o vetor que liga o início ao fim do diâmetro: <MathFormula formula="|\Delta \vec{r}| = 2R = 20 \text{ m}" display={false} />.</p>
                  <div className="bg-slate-50 p-4 rounded-lg text-center font-mono">
                    <MathFormula formula="|\vec{v}_m| = \frac{20}{5} = 4 \text{ m/s}" />
                  </div>
                  <div className="bg-blue-900 text-white p-6 rounded-2xl mt-6 shadow-lg">
                    <p className="text-xs uppercase tracking-widest text-blue-400 mb-2 font-bold">Análise:</p>
                    <div className="text-lg leading-relaxed">
                      Note que <MathFormula formula="6 \text{ m/s} > 4 \text{ m/s}" display={false} />, confirmando a relação <MathFormula formula="v_{em} > |\vec{v}_m|" display={false} /> para trajetórias curvas. O vetor velocidade média "corta caminho" por dentro da curva!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== 8. APLICAÇÕES PRÁTICAS ===================== */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl p-10 mb-8 text-white border border-slate-700">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">8. Aplicações Práticas e Engenharia</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-colors">
              <h4 className="text-xl font-bold text-blue-300 mb-4">Sistemas de GPS</h4>
              <p className="text-sm text-slate-400 leading-relaxed">Os algoritmos de GPS utilizam a velocidade vetorial instantânea para recalcular rotas em tempo real, mas usam a velocidade escalar média histórica para prever o tempo de chegada (ETA) com precisão.</p>
            </div>
            <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-colors">
              <h4 className="text-xl font-bold text-blue-300 mb-4">Monitoramento de Tráfego</h4>
              <p className="text-sm text-slate-400 leading-relaxed">Radares de trecho (comuns na Europa e em testes no Brasil) medem a velocidade escalar média entre dois pontos distantes, impedindo que motoristas freiem apenas "em cima" do radar.</p>
            </div>
            <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-colors">
              <h4 className="text-xl font-bold text-blue-300 mb-4">Balística e Defesa</h4>
              <p className="text-sm text-slate-400 leading-relaxed">No cálculo de trajetórias de projéteis, a distinção entre a velocidade escalar (que afeta o arrasto do ar) e a vetorial (que define o ponto de impacto) é vital para a precisão do disparo.</p>
            </div>
          </div>
        </div>


        {/* ===================== BLOCO: ACELERAÇÃO ESCALAR E VETORIAL ===================== */}
        <div className="mt-16">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center border border-orange-500/30">
              <TrendingUp className="w-9 h-9 text-orange-400" />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-slate-900">Aceleração Escalar e Vetorial</h2>
              <p className="text-slate-500 mt-1">A taxa de variação da velocidade no tempo</p>
            </div>
          </div>

          {/* 1. Contexto Histórico */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                <Activity className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">1. Contexto Histórico e Conceitual</h3>
            </div>
            <p className="text-slate-700 leading-relaxed mb-4">
              A aceleração foi o conceito que mais desafiou os filósofos naturais antes de Galileu. Aristóteles acreditava que um objeto em queda "acelerava" porque estava buscando seu "lugar natural", sem jamais quantificar essa variação. Foi <strong>Galileu Galilei</strong>, em seus experimentos com planos inclinados na cidade de Pisa (século XVII), quem demonstrou pela primeira vez que a variação da velocidade é <em>uniforme no tempo</em> na queda livre, e não uniforme no espaço.
            </p>
            <p className="text-slate-700 leading-relaxed mb-4">
              <strong>Isaac Newton</strong> formalizou o conceito ao estabelecer a Segunda Lei da Dinâmica: a aceleração é proporcional à força resultante aplicada ao objeto e inversamente proporcional à sua massa. Isso transformou a aceleração de uma mera descrição cinemática em uma grandeza com causa física identificável.
            </p>
            <p className="text-slate-700 leading-relaxed mb-4">
              Na física moderna, a aceleração é definida como a <strong>taxa de variação do vetor velocidade em relação ao tempo</strong>. Essa definição vetorial é fundamental: um objeto pode estar acelerando mesmo que sua rapidez (módulo da velocidade) seja constante, desde que a <em>direção</em> da velocidade esteja mudando — como ocorre no movimento circular uniforme.
            </p>
            <blockquote className="border-l-4 border-orange-400 pl-6 py-3 bg-orange-50 rounded-r-xl text-slate-600 italic">
              "A aceleração não é apenas 'ir mais rápido'. É qualquer mudança no vetor velocidade: de módulo, de direção ou de sentido. Essa distinção é o que separa o raciocínio físico correto do senso comum." — Reflexão baseada no Tópicos de Física.
            </blockquote>
          </div>

          {/* 2. Definições Precisas */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                <Target className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">2. Definições Precisas</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                <h4 className="text-xl font-bold text-orange-700 mb-3">Aceleração Escalar Média <MathFormula formula="a_m" display={false} /></h4>
                <p className="text-slate-700 leading-relaxed mb-4">
                  É a grandeza escalar que mede a variação da <strong>velocidade escalar</strong> (rapidez) por unidade de tempo. Ela indica o quanto a rapidez do móvel aumentou ou diminuiu, em média, em um dado intervalo.
                </p>
                <p className="text-slate-700 leading-relaxed mb-4">
                  É importante notar que a aceleração escalar média pode ser <strong>positiva</strong> (o móvel está acelerando, ganhando rapidez) ou <strong>negativa</strong> (o móvel está desacelerando, perdendo rapidez). No linguajar popular, a desaceleração é chamada de "frenagem", mas na física ela é simplesmente uma aceleração com sinal contrário ao da velocidade.
                </p>
                <div className="bg-orange-100 border border-orange-300 rounded-xl p-4 text-sm text-orange-800">
                  <strong>Observação Importante:</strong> Uma aceleração escalar nula não significa que o objeto está parado. Significa que a rapidez é constante — como em um carro em velocidade de cruzeiro em uma estrada reta.
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <h4 className="text-xl font-bold text-red-700 mb-3">Aceleração Vetorial Média <MathFormula formula="\vec{a}_m" display={false} /></h4>
                <p className="text-slate-700 leading-relaxed mb-4">
                  É a grandeza vetorial definida pela variação do <strong>vetor velocidade</strong> por unidade de tempo. Ela captura qualquer mudança no vetor velocidade: de módulo, de direção ou de sentido.
                </p>
                <div className="text-slate-700 leading-relaxed mb-4">
                  O vetor aceleração média aponta na mesma direção e sentido da <em>variação</em> do vetor velocidade (<MathFormula formula="\Delta\vec{v} = \vec{v}_f - \vec{v}_i" display={false} />), e não necessariamente na direção do movimento. Essa é uma das fontes de confusão mais comuns em problemas de física.
                </div>
                <div className="bg-red-100 border border-red-300 rounded-xl p-4 text-sm text-red-800">
                  <strong>Observação Importante:</strong> Em uma curva, mesmo que a rapidez seja constante, o vetor velocidade muda de direção, portanto há aceleração vetorial. Esse é o princípio do movimento circular uniforme.
                </div>
              </div>
            </div>
          </div>

          {/* 3. Deduções Matemáticas */}
          <div className="bg-slate-900 rounded-3xl shadow-2xl p-10 mb-8 text-white border border-slate-800">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center border border-orange-500/30">
                <Zap className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-3xl font-bold tracking-tight">3. Deduções Matemáticas Completas</h3>
            </div>
            <div className="space-y-10">
              <div className="relative pl-8 border-l-2 border-orange-500/30">
                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                <h4 className="text-xl font-semibold text-orange-300 mb-4">Aceleração Escalar Média</h4>
                <div className="text-slate-400 mb-6 leading-relaxed">
                  Considere um móvel com velocidade escalar <MathFormula formula="v_i" display={false} /> no instante <MathFormula formula="t_i" display={false} /> e velocidade escalar <MathFormula formula="v_f" display={false} /> no instante <MathFormula formula="t_f" display={false} />. A variação da velocidade escalar é <MathFormula formula="\Delta v = v_f - v_i" display={false} /> e o intervalo de tempo é <MathFormula formula="\Delta t = t_f - t_i" display={false} />. A aceleração escalar média é definida como:
                </div>
                <div className="bg-slate-800/80 p-8 rounded-2xl border border-slate-700 text-center shadow-inner mb-6">
                  <MathFormula formula="a_m = \frac{\Delta v}{\Delta t} = \frac{v_f - v_i}{t_f - t_i}" className="text-3xl" />
                </div>
                <div className="bg-slate-700/40 p-6 rounded-xl border border-slate-600 text-sm">
                  <p className="text-slate-300 font-semibold mb-3">Legenda dos Termos:</p>
                  <div className="grid md:grid-cols-2 gap-4 text-slate-400">
                    <div className="flex items-start gap-3">
                      <span className="text-orange-400 font-bold min-w-fit"><MathFormula formula="a_m" display={false} /></span>
                      <span>Aceleração escalar média (m/s²)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-orange-400 font-bold min-w-fit"><MathFormula formula="\Delta v" display={false} /></span>
                      <span>Variação da velocidade escalar (m/s) — pode ser positiva ou negativa</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-orange-400 font-bold min-w-fit"><MathFormula formula="v_f" display={false} /></span>
                      <span>Velocidade escalar final (m/s)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-orange-400 font-bold min-w-fit"><MathFormula formula="v_i" display={false} /></span>
                      <span>Velocidade escalar inicial (m/s)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-orange-400 font-bold min-w-fit"><MathFormula formula="\Delta t" display={false} /></span>
                      <span>Intervalo de tempo (s) — sempre positivo</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative pl-8 border-l-2 border-red-500/30">
                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                <h4 className="text-xl font-semibold text-red-300 mb-4">Aceleração Vetorial Média</h4>
                <div className="text-slate-400 mb-6 leading-relaxed">
                  No espaço tridimensional, o vetor velocidade é <MathFormula formula="\vec{v}(t) = v_x\hat{i} + v_y\hat{j} + v_z\hat{k}" display={false} />. A variação do vetor velocidade entre dois instantes é a diferença vetorial <MathFormula formula="\Delta\vec{v} = \vec{v}_f - \vec{v}_i" display={false} />. A aceleração vetorial média é:
                </div>
                <div className="bg-slate-800/80 p-8 rounded-2xl border border-slate-700 text-center shadow-inner mb-6">
                  <MathFormula formula="\vec{a}_m = \frac{\Delta\vec{v}}{\Delta t} = \frac{\vec{v}_f - \vec{v}_i}{t_f - t_i}" className="text-3xl" />
                </div>
                <div className="bg-slate-700/40 p-6 rounded-xl border border-slate-600 text-sm">
                  <p className="text-slate-300 font-semibold mb-3">Legenda dos Termos:</p>
                  <div className="grid md:grid-cols-2 gap-4 text-slate-400">
                    <div className="flex items-start gap-3">
                      <span className="text-red-400 font-bold min-w-fit"><MathFormula formula="\vec{a}_m" display={false} /></span>
                      <span>Aceleração vetorial média (m/s²) — Vetor!</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-red-400 font-bold min-w-fit"><MathFormula formula="\Delta\vec{v}" display={false} /></span>
                      <span>Variação do vetor velocidade (m/s) — aponta de <MathFormula formula="\vec{v}_i" display={false} /> para <MathFormula formula="\vec{v}_f" display={false} /></span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-red-400 font-bold min-w-fit"><MathFormula formula="\vec{v}_f" display={false} /></span>
                      <span>Vetor velocidade final (m/s)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-red-400 font-bold min-w-fit"><MathFormula formula="\vec{v}_i" display={false} /></span>
                      <span>Vetor velocidade inicial (m/s)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-red-400 font-bold min-w-fit"><MathFormula formula="\hat{i}, \hat{j}, \hat{k}" display={false} /></span>
                      <span>Versores unitários nas direções x, y, z</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-sm text-slate-500 italic">
                  *O vetor <MathFormula formula="\vec{a}_m" display={false} /> aponta na direção de <MathFormula formula="\Delta\vec{v}" display={false} />, que é a diferença vetorial <MathFormula formula="\vec{v}_f - \vec{v}_i" display={false} />, e não necessariamente na direção do movimento.
                </div>
              </div>
            </div>
          </div>

          {/* 4. Termo-a-termo em Grid */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                <Box className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">4. Termo-a-Termo</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { symbol: "a_m", name: "Aceleração Média", desc: "Grandeza que mede a variação da velocidade por unidade de tempo. No SI, é expressa em m/s². Pode ser positiva (aceleração) ou negativa (desaceleração)." },
                { symbol: "\\Delta v", name: "Variação da Velocidade", desc: "Diferença entre a velocidade final e a inicial (vf − vi). É positiva quando o móvel ganha rapidez e negativa quando perde. Expressa em m/s." },
                { symbol: "v_f", name: "Velocidade Final", desc: "Velocidade do móvel ao final do intervalo de tempo considerado. Expressa em m/s." },
                { symbol: "v_i", name: "Velocidade Inicial", desc: "Velocidade do móvel no início do intervalo de tempo considerado. Expressa em m/s." },
                { symbol: "\\Delta t", name: "Intervalo de Tempo", desc: "Duração do intervalo observado (tf − ti). É sempre positivo na física clássica. Expresso em segundos (s)." },
                { symbol: "\\vec{a}_m", name: "Aceleração Vetorial Média", desc: "Versão vetorial da aceleração. Aponta na direção da variação do vetor velocidade (Δv⃗). Pode ter direção diferente do movimento." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 bg-orange-50 border border-orange-100 rounded-2xl p-5">
                  <div className="min-w-[80px] flex items-center justify-center bg-orange-100 rounded-xl p-3">
                    <MathFormula formula={item.symbol} display={false} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 mb-1">{item.name}</p>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Relação Matemática */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">5. Relação Matemática Fundamental</h3>
            </div>
            <p className="text-slate-700 leading-relaxed mb-6">
              Assim como na velocidade, existe uma relação fundamental entre a aceleração escalar e o módulo da aceleração vetorial. A aceleração vetorial captura <em>qualquer</em> variação no vetor velocidade, enquanto a escalar captura apenas a variação no módulo (rapidez). A regra geral é:
            </p>
            <div className="bg-slate-900 p-8 rounded-2xl text-center mb-6">
              <MathFormula formula="|\vec{a}_m| \geq |a_m|" className="text-3xl text-white" />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <h4 className="font-bold text-green-700 mb-3">Igualdade (<MathFormula formula="=" display={false} />)</h4>
                <p className="text-slate-700 leading-relaxed">
                  Ocorre quando o movimento é <strong>retilíneo</strong> (a direção da velocidade não muda). Nesse caso, toda a variação do vetor velocidade é de módulo, e a aceleração escalar e vetorial coincidem.
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <h4 className="font-bold text-amber-700 mb-3">Desigualdade (<MathFormula formula=">" display={false} />)</h4>
                <p className="text-slate-700 leading-relaxed">
                  Ocorre quando o movimento é <strong>curvilíneo</strong> (a direção da velocidade muda). Mesmo que a rapidez seja constante, o vetor velocidade varia em direção, gerando uma aceleração vetorial não nula com aceleração escalar nula.
                </p>
              </div>
            </div>
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h4 className="font-bold text-blue-700 mb-3">O Caso Clássico: Movimento Circular Uniforme</h4>
              <div className="text-slate-700 leading-relaxed">
                Um objeto em movimento circular uniforme tem <strong>rapidez constante</strong> (<MathFormula formula="a_m = 0" display={false} />), mas o vetor velocidade muda de direção a cada instante. Portanto, <MathFormula formula="|\vec{a}_m| > 0" display={false} />. Essa aceleração aponta para o centro da circunferência e é chamada de <strong>aceleração centrípeta</strong>. Esse é o exemplo mais poderoso para demonstrar a diferença entre aceleração escalar e vetorial.
              </div>
            </div>
          </div>

          {/* 6. Tabela Comparativa */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">6. Tabela Comparativa</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-4 text-left rounded-tl-xl">Propriedade</th>
                    <th className="p-4 text-left">Aceleração Escalar Média</th>
                    <th className="p-4 text-left rounded-tr-xl">Aceleração Vetorial Média</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ["Natureza Física", "Escalar (apenas módulo e sinal)", "Vetorial (módulo, direção e sentido)"],
                    ["O que mede", "Variação da rapidez (módulo da velocidade)", "Variação do vetor velocidade completo"],
                    ["Pode ser nula com movimento curvilíneo?", "Sim (rapidez constante em curva)", "Não (direção da velocidade muda)"],
                    ["Sinal Matemático", "Positivo (acelera) ou negativo (desacelera)", "Definido pela direção de Δv⃗"],
                    ["Unidade no SI", "m/s²", "m/s² (com direção)"],
                  ].map(([prop, esc, vet], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-orange-50"}>
                      <td className="p-4 font-semibold text-slate-700">{prop}</td>
                      <td className="p-4 text-slate-600">{esc}</td>
                      <td className="p-4 text-slate-600">{vet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 7. Exemplos Resolvidos */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                <Lightbulb className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">7. Exemplos Resolvidos</h3>
            </div>
            <div className="space-y-8">
              {/* Exemplo 1 */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-800 p-5">
                  <h4 className="text-white font-bold text-lg">Exemplo 1 — Aceleração Escalar em Frenagem</h4>
                  <div className="text-slate-300 mt-2">
                    Um automóvel trafega a <MathFormula formula="v_i = 72 \text{ km/h}" display={false} /> e freia até parar completamente em <MathFormula formula="\Delta t = 5 \text{ s}" display={false} />. Calcule a aceleração escalar média durante a frenagem.
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="bg-orange-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                    <div className="text-slate-700">Converter a velocidade inicial para m/s: <MathFormula formula="v_i = \frac{72}{3{,}6} = 20 \text{ m/s}" display={false} /></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-orange-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                    <div className="text-slate-700">A velocidade final é <MathFormula formula="v_f = 0 \text{ m/s}" display={false} /> (parado).</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-orange-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                    <p className="text-slate-700">Aplicar a definição:</p>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-xl text-center">
                    <MathFormula formula="a_m = \frac{v_f - v_i}{\Delta t} = \frac{0 - 20}{5} = -4 \text{ m/s}^2" className="text-white" />
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <p className="text-orange-800 text-sm"><strong>Análise:</strong> O sinal negativo indica desaceleração — a aceleração é contrária ao sentido do movimento. O módulo de 4 m/s² significa que o carro perde 4 m/s de velocidade a cada segundo.</p>
                  </div>
                </div>
              </div>

              {/* Exemplo 2 */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-800 p-5">
                  <h4 className="text-white font-bold text-lg">Exemplo 2 — Aceleração Vetorial em Curva</h4>
                  <div className="text-slate-300 mt-2">
                    Uma partícula percorre uma curva de 90° em <MathFormula formula="\Delta t = 2 \text{ s}" display={false} /> mantendo rapidez constante de <MathFormula formula="v = 10 \text{ m/s}" display={false} />. O vetor velocidade inicial aponta para o Leste (<MathFormula formula="+x" display={false} />) e o final aponta para o Norte (<MathFormula formula="+y" display={false} />). Determine o módulo da aceleração vetorial média.
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                    <div className="text-slate-700">Identificar os vetores velocidade: <MathFormula formula="\vec{v}_i = 10\hat{i} \text{ m/s}" display={false} /> e <MathFormula formula="\vec{v}_f = 10\hat{j} \text{ m/s}" display={false} /></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                    <div className="text-slate-700">Calcular a variação vetorial: <MathFormula formula="\Delta\vec{v} = \vec{v}_f - \vec{v}_i = 10\hat{j} - 10\hat{i} = (-10\hat{i} + 10\hat{j}) \text{ m/s}" display={false} /></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                    <div className="text-slate-700">Calcular o módulo de <MathFormula formula="\Delta\vec{v}" display={false} />:</div>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-xl text-center">
                    <MathFormula formula="|\Delta\vec{v}| = \sqrt{(-10)^2 + 10^2} = \sqrt{200} = 10\sqrt{2} \text{ m/s}" className="text-white" />
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                    <p className="text-slate-700">Calcular a aceleração vetorial média:</p>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-xl text-center">
                    <MathFormula formula="|\vec{a}_m| = \frac{|\Delta\vec{v}|}{\Delta t} = \frac{10\sqrt{2}}{2} = 5\sqrt{2} \approx 7{,}07 \text{ m/s}^2" className="text-white" />
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="text-red-800 text-sm"><strong>Análise:</strong> A aceleração escalar média é zero (rapidez constante), mas a aceleração vetorial média é <MathFormula formula="5\sqrt{2} \text{ m/s}^2" display={false} />. Isso demonstra que a aceleração vetorial captura mudanças de direção que a escalar ignora completamente.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 8. Aplicações Práticas */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">8. Aplicações Práticas</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <h4 className="font-bold text-slate-800 mb-3">Engenharia Aeronáutica</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Pilotos de caça suportam acelerações de até 9g (≈ 88 m/s²) em manobras. O corpo humano tolera melhor acelerações na direção frente-costas do que cabeça-pés, o que influencia o design das cabines.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <h4 className="font-bold text-slate-800 mb-3">Sistemas de Freio ABS</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  O ABS monitora a aceleração escalar das rodas em tempo real. Quando detecta desaceleração excessiva (roda travando), libera e reaplica o freio para manter a aceleração dentro de um limite seguro.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <h4 className="font-bold text-slate-800 mb-3">Acelerômetros e Smartphones</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  O acelerômetro do seu celular mede a aceleração vetorial nos três eixos (x, y, z). Essa informação é usada para detectar orientação da tela, contar passos e identificar quedas em sistemas de emergência.
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* ============================================================
            BLOCO 3: MOVIMENTO ACELERADO E RETARDADO
            ============================================================ */}
        <div className="my-8 border-t-2 border-orange-100" />

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Movimento Acelerado e Retardado</h2>
              <p className="text-slate-500 mt-1">A classificação do movimento variado segundo a variação do módulo da velocidade</p>
            </div>
          </div>

          {/* 1. Contexto Histórico */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Contexto Histórico e Conceitual
            </h3>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                A necessidade de classificar os movimentos variados surgiu dos estudos sistemáticos de <strong>Galileu Galilei</strong> (1564–1642) sobre a queda dos corpos. Ao observar que os objetos não caem com velocidade constante, mas sim com velocidade crescente, Galileu percebeu que era necessário distinguir entre diferentes tipos de variação de velocidade.
              </p>
              <p>
                Antes de Galileu, Aristóteles acreditava que corpos mais pesados caíam mais rapidamente, sem se preocupar com a variação da velocidade ao longo da queda. Foi Galileu quem, por meio de experimentos com planos inclinados, demonstrou que todos os corpos sofrem a mesma aceleração gravitacional — e que essa aceleração é constante.
              </p>
              <p>
                Newton, posteriormente, formalizou esses conceitos ao estabelecer a relação entre força e aceleração, tornando a classificação do movimento em acelerado, retardado e uniforme uma ferramenta fundamental da mecânica clássica. O <em>Tópicos de Física</em> ressalta que essa classificação é essencial para a análise correta do movimento antes de se aplicar qualquer equação horária.
              </p>
              <div className="bg-orange-50 p-5 rounded-xl border-l-4 border-orange-500 italic">
                "É importante salientar que o conceito de aceleração escalar diz respeito não apenas aos casos em que o corpo ganha velocidade, mas também aos casos em que ele perde velocidade. O sinal da aceleração, por si só, não determina se o movimento é acelerado ou retardado." — <em>Tópicos de Física, Vol. 1.</em>
              </div>
            </div>
          </div>

          {/* 2. Definições Precisas */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Definições Precisas
            </h3>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl mb-6">
              <p className="text-amber-800 font-semibold mb-1">Movimento Variado</p>
              <p className="text-amber-700 leading-relaxed">O movimento de uma partícula é dito <strong>variado</strong> quando sua velocidade escalar instantânea varia no decorrer do tempo, ou seja, quando a aceleração escalar instantânea é diferente de zero em algum instante do intervalo considerado.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-green-50 rounded-xl border border-green-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h4 className="font-bold text-green-800 text-lg">Acelerado</h4>
                </div>
                <p className="text-green-700 text-sm leading-relaxed mb-3">
                  Um movimento é <strong>acelerado</strong> quando o módulo da velocidade escalar instantânea é sempre <strong>crescente</strong> com o passar do tempo. Isso ocorre quando v e α têm o <strong>mesmo sinal</strong>.
                </p>
                <div className="bg-green-100 rounded-lg p-3 text-center">
                  <MathFormula formula="|v(t_2)| > |v(t_1)|" inline={false} />
                  <p className="text-green-600 text-xs mt-1">para todo t₂ &gt; t₁</p>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-green-700 text-xs font-medium">Casos possíveis:</p>
                  <p className="text-green-700 text-xs">• v &gt; 0 e α &gt; 0 → acelerado progressivo</p>
                  <p className="text-green-700 text-xs">• v &lt; 0 e α &lt; 0 → acelerado retrógrado</p>
                </div>
              </div>

              <div className="bg-red-50 rounded-xl border border-red-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <h4 className="font-bold text-red-800 text-lg">Retardado</h4>
                </div>
                <p className="text-red-700 text-sm leading-relaxed mb-3">
                  Um movimento é <strong>retardado</strong> quando o módulo da velocidade escalar instantânea é sempre <strong>decrescente</strong> com o passar do tempo. Isso ocorre quando v e α têm <strong>sinais opostos</strong>.
                </p>
                <div className="bg-red-100 rounded-lg p-3 text-center">
                  <MathFormula formula="|v(t_2)| < |v(t_1)|" inline={false} />
                  <p className="text-red-600 text-xs mt-1">para todo t₂ &gt; t₁</p>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-red-700 text-xs font-medium">Casos possíveis:</p>
                  <p className="text-red-700 text-xs">• v &gt; 0 e α &lt; 0 → retardado progressivo</p>
                  <p className="text-red-700 text-xs">• v &lt; 0 e α &gt; 0 → retardado retrógrado</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Minus className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-blue-800 text-lg">Uniforme</h4>
                </div>
                <p className="text-blue-700 text-sm leading-relaxed mb-3">
                  Um movimento é <strong>uniforme</strong> quando a velocidade escalar instantânea é <strong>constante e diferente de zero</strong>. A aceleração é nula.
                </p>
                <div className="bg-blue-100 rounded-lg p-3 text-center">
                  <MathFormula formula="\alpha = 0 \;\text{e}\; v \neq 0" inline={false} />
                  <p className="text-blue-600 text-xs mt-1">aceleração nula</p>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-blue-700 text-xs font-medium">Características:</p>
                  <p className="text-blue-700 text-xs">• v = constante ≠ 0</p>
                  <p className="text-blue-700 text-xs">• Espaços iguais em tempos iguais</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
              <p className="text-yellow-800 font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Observação Importante — O Erro Mais Comum
              </p>
              <p className="text-yellow-700 text-sm leading-relaxed">
                Um carro freando tem aceleração escalar diferente de zero — ela é apenas contrária ao sentido do movimento. Portanto, "movimento retardado" <strong>não significa "aceleração negativa"</strong>. O que determina a classificação é a relação entre os sinais de v e α, não o sinal isolado de α. Um objeto com v &lt; 0 e α &lt; 0 está em movimento <strong>acelerado</strong> (retrógrado), pois o módulo de v cresce.
              </p>
            </div>
          </div>

          {/* 3. Deduções Matemáticas */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              Deduções Matemáticas Completas
            </h3>

            <div className="bg-slate-900 rounded-xl p-6 text-white mb-4">
              <p className="text-slate-300 text-sm mb-4 leading-relaxed">A aceleração escalar média é definida como a variação da velocidade escalar por unidade de tempo. Partindo da definição operacional:</p>
              <div className="text-center mb-4">
                <MathFormula formula="\alpha_m = \frac{\Delta v}{\Delta t} = \frac{v_f - v_i}{t_f - t_i}" inline={false} />
              </div>
              <p className="text-slate-300 text-sm mb-4 leading-relaxed">Para determinar se o movimento é acelerado ou retardado em um dado instante, analisamos o produto <strong>v · α</strong>. Esse critério é derivado diretamente da definição de módulo crescente ou decrescente:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-900/50 rounded-lg p-4 text-center">
                  <MathFormula formula="v \cdot \alpha > 0 \Rightarrow \text{Acelerado}" inline={false} />
                  <p className="text-green-300 text-xs mt-2">Mesmo sinal: módulo de v cresce</p>
                </div>
                <div className="bg-red-900/50 rounded-lg p-4 text-center">
                  <MathFormula formula="v \cdot \alpha < 0 \Rightarrow \text{Retardado}" inline={false} />
                  <p className="text-red-300 text-xs mt-2">Sinais opostos: módulo de v decresce</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm mt-4 leading-relaxed">A unidade de aceleração no SI é derivada diretamente da razão entre as unidades de velocidade e tempo:</p>
              <div className="text-center mt-2">
                <MathFormula formula="\text{unid}(\alpha) = \frac{\text{unid}(v)}{\text{unid}(t)} = \frac{\text{m/s}}{\text{s}} = \text{m/s}^2" inline={false} />
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl border border-orange-200 p-5">
              <p className="font-semibold text-orange-800 mb-3">Legenda — O que cada termo representa:</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <span className="bg-orange-200 text-orange-800 text-xs font-bold px-2 py-1 rounded whitespace-nowrap">α_m</span>
                  <span className="text-slate-700 text-sm">Aceleração escalar média — taxa de variação da velocidade no intervalo Δt. Unidade: m/s². Pode ser positiva ou negativa.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-orange-200 text-orange-800 text-xs font-bold px-2 py-1 rounded whitespace-nowrap">Δv</span>
                  <span className="text-slate-700 text-sm">Variação da velocidade escalar: Δv = v_f − v_i. Positiva se v aumentou, negativa se v diminuiu. Unidade: m/s.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-orange-200 text-orange-800 text-xs font-bold px-2 py-1 rounded whitespace-nowrap">v_i, v_f</span>
                  <span className="text-slate-700 text-sm">Velocidades escalares instantâneas inicial e final. Podem ser positivas (sentido positivo) ou negativas (sentido negativo). Unidade: m/s.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-orange-200 text-orange-800 text-xs font-bold px-2 py-1 rounded whitespace-nowrap">Δt</span>
                  <span className="text-slate-700 text-sm">Intervalo de tempo: Δt = t_f − t_i. É sempre positivo, pois o tempo flui em um único sentido. Unidade: s.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-orange-200 text-orange-800 text-xs font-bold px-2 py-1 rounded whitespace-nowrap">v · α</span>
                  <span className="text-slate-700 text-sm">Produto entre velocidade e aceleração escalar — o critério fundamental para classificar o movimento. Analisa apenas o sinal do produto.</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Termo-a-Termo em Grid */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              Análise Termo-a-Termo: O Critério dos Sinais
            </h3>

            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <div className="grid grid-cols-4 bg-slate-800 text-white text-sm font-semibold">
                <div className="p-3 text-center">Sinal de v</div>
                <div className="p-3 text-center">Sinal de α</div>
                <div className="p-3 text-center">Produto v·α</div>
                <div className="p-3 text-center">Classificação</div>
              </div>
              <div className="grid grid-cols-4 border-b border-slate-100 text-sm">
                <div className="p-3 text-center font-semibold text-green-600">v &gt; 0</div>
                <div className="p-3 text-center font-semibold text-green-600">α &gt; 0</div>
                <div className="p-3 text-center font-semibold text-green-600">v·α &gt; 0</div>
                <div className="p-3 text-center"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">Acelerado Progressivo</span></div>
              </div>
              <div className="grid grid-cols-4 border-b border-slate-100 text-sm bg-slate-50">
                <div className="p-3 text-center font-semibold text-green-600">v &lt; 0</div>
                <div className="p-3 text-center font-semibold text-green-600">α &lt; 0</div>
                <div className="p-3 text-center font-semibold text-green-600">v·α &gt; 0</div>
                <div className="p-3 text-center"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">Acelerado Retrógrado</span></div>
              </div>
              <div className="grid grid-cols-4 border-b border-slate-100 text-sm">
                <div className="p-3 text-center font-semibold text-red-600">v &gt; 0</div>
                <div className="p-3 text-center font-semibold text-red-600">α &lt; 0</div>
                <div className="p-3 text-center font-semibold text-red-600">v·α &lt; 0</div>
                <div className="p-3 text-center"><span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">Retardado Progressivo</span></div>
              </div>
              <div className="grid grid-cols-4 border-b border-slate-100 text-sm bg-slate-50">
                <div className="p-3 text-center font-semibold text-red-600">v &lt; 0</div>
                <div className="p-3 text-center font-semibold text-red-600">α &gt; 0</div>
                <div className="p-3 text-center font-semibold text-red-600">v·α &lt; 0</div>
                <div className="p-3 text-center"><span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">Retardado Retrógrado</span></div>
              </div>
              <div className="grid grid-cols-4 text-sm">
                <div className="p-3 text-center font-semibold text-blue-600">v ≠ 0</div>
                <div className="p-3 text-center font-semibold text-blue-600">α = 0</div>
                <div className="p-3 text-center font-semibold text-blue-600">v·α = 0</div>
                <div className="p-3 text-center"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">Uniforme</span></div>
              </div>
            </div>
          </div>

          {/* 5. Relação Matemática */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
              Relação Matemática: Aceleração e Variação de Velocidade
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-3">Aceleração Escalar Média</h4>
                <div className="text-center mb-3">
                  <MathFormula formula="\alpha_m = \frac{v_f - v_i}{\Delta t}" inline={false} />
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">A aceleração média é a razão entre a variação da velocidade escalar e o intervalo de tempo. Seu sinal depende exclusivamente da diferença v_f − v_i, não do sinal isolado de v_f ou v_i.</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-3">Critério de Classificação</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></span>
                    <MathFormula formula="v \cdot \alpha_m > 0 \Rightarrow \text{Acelerado}" display={false} />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></span>
                    <MathFormula formula="v \cdot \alpha_m < 0 \Rightarrow \text{Retardado}" display={false} />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></span>
                    <MathFormula formula="\alpha_m = 0 \Rightarrow \text{Uniforme}" display={false} />
                  </div>
                </div>
                <p className="text-slate-600 text-sm mt-3">Este critério é válido para qualquer instante do movimento, não apenas para a média do intervalo.</p>
              </div>
            </div>
          </div>

          {/* 6. Tabela Comparativa */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">6</span>
              Tabela Comparativa
            </h3>

            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <div className="grid grid-cols-4 bg-slate-800 text-white text-sm font-semibold">
                <div className="p-3">Propriedade</div>
                <div className="p-3 text-center text-green-300">Acelerado</div>
                <div className="p-3 text-center text-red-300">Retardado</div>
                <div className="p-3 text-center text-blue-300">Uniforme</div>
              </div>
              <div className="grid grid-cols-4 border-b border-slate-100 text-sm">
                <div className="p-3 font-medium text-slate-700">Módulo de v</div>
                <div className="p-3 text-center text-green-700">Crescente com o tempo</div>
                <div className="p-3 text-center text-red-700">Decrescente com o tempo</div>
                <div className="p-3 text-center text-blue-700">Constante no tempo</div>
              </div>
              <div className="grid grid-cols-4 border-b border-slate-100 text-sm bg-slate-50">
                <div className="p-3 font-medium text-slate-700">Aceleração α</div>
                <div className="p-3 text-center text-green-700">α ≠ 0, mesmo sinal que v</div>
                <div className="p-3 text-center text-red-700">α ≠ 0, sinal oposto a v</div>
                <div className="p-3 text-center text-blue-700">α = 0</div>
              </div>
              <div className="grid grid-cols-4 border-b border-slate-100 text-sm">
                <div className="p-3 font-medium text-slate-700">Produto v·α</div>
                <div className="p-3 text-center text-green-700">&gt; 0 (positivo)</div>
                <div className="p-3 text-center text-red-700">&lt; 0 (negativo)</div>
                <div className="p-3 text-center text-blue-700">= 0</div>
              </div>
              <div className="grid grid-cols-4 border-b border-slate-100 text-sm bg-slate-50">
                <div className="p-3 font-medium text-slate-700">Exemplo clássico</div>
                <div className="p-3 text-center text-green-700">Queda livre</div>
                <div className="p-3 text-center text-red-700">Freagem de carro</div>
                <div className="p-3 text-center text-blue-700">Luz no vácuo</div>
              </div>
              <div className="grid grid-cols-4 text-sm">
                <div className="p-3 font-medium text-slate-700">Gráfico |v|(t)</div>
                <div className="p-3 text-center text-green-700">Crescente (sobe)</div>
                <div className="p-3 text-center text-red-700">Decrescente (desce)</div>
                <div className="p-3 text-center text-blue-700">Constante (horizontal)</div>
              </div>
            </div>
          </div>

          {/* 7. Exemplos Resolvidos */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">7</span>
              Exemplos Resolvidos
            </h3>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">Exemplo 1</span>
                <span className="text-slate-500 text-sm">Classificação por análise de sinais</span>
              </div>
              <p className="text-slate-700 mb-4">
                Um automóvel se move numa rodovia com velocidade escalar de −20 m/s (sentido retrógrado). Ao acionar o freio, sua aceleração escalar é de +4 m/s². Classifique o movimento e determine em quanto tempo o carro para.
              </p>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="font-semibold text-slate-800 mb-3">Resolução:</p>
                <p className="text-slate-700 text-sm mb-2"><strong>Passo 1 — Classificação:</strong></p>
                <div className="text-center mb-3">
                  <MathFormula formula="v \cdot \alpha = (-20) \cdot (+4) = -80 < 0 \Rightarrow \textbf{Movimento Retardado}" inline={false} />
                </div>
                <p className="text-slate-700 text-sm mb-2 mt-3"><strong>Passo 2 — Tempo para parar (v_f = 0):</strong></p>
                <div className="text-center mb-2">
                  <MathFormula formula="\alpha_m = \frac{v_f - v_i}{\Delta t} \Rightarrow 4 = \frac{0 - (-20)}{\Delta t}" inline={false} />
                </div>
                <div className="text-center mb-2">
                  <MathFormula formula="\Delta t = \frac{20}{4} = 5 \text{ s}" inline={false} />
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                  <p className="text-orange-800 text-sm"><strong>Conclusão:</strong> O movimento é retardado (v e α têm sinais opostos). O carro para em 5 s. Note que a aceleração positiva com velocidade negativa significa desaceleração — um erro conceitual muito comum em provas.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">Exemplo 2</span>
                <span className="text-slate-500 text-sm">Pêndulo — alternância entre acelerado e retardado</span>
              </div>
              <p className="text-slate-700 mb-4">
                Um pêndulo oscila entre os pontos A (extremo esquerdo) e B (extremo direito), passando pelo ponto O (equilíbrio). Considerando o sentido de A para B como positivo, classifique o movimento nas fases: (a) de A até O; (b) de O até B.
              </p>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="font-semibold text-slate-800 mb-3">Resolução:</p>
                <p className="text-slate-700 text-sm mb-2"><strong>(a) De A até O (descida):</strong></p>
                <p className="text-slate-700 text-sm mb-2 leading-relaxed">O pêndulo parte do repouso em A (v = 0) e ganha velocidade até O (v máxima). A velocidade é positiva e crescente, portanto a aceleração é positiva.</p>
                <div className="text-center mb-3">
                  <MathFormula formula="v > 0,\; \alpha > 0 \Rightarrow v \cdot \alpha > 0 \Rightarrow \textbf{Acelerado}" inline={false} />
                </div>
                <p className="text-slate-700 text-sm mb-2 mt-3"><strong>(b) De O até B (subida):</strong></p>
                <p className="text-slate-700 text-sm mb-2 leading-relaxed">O pêndulo parte de O com velocidade máxima e desacelera até parar em B. A velocidade ainda é positiva, mas decrescente, portanto a aceleração é negativa.</p>
                <div className="text-center mb-3">
                  <MathFormula formula="v > 0,\; \alpha < 0 \Rightarrow v \cdot \alpha < 0 \Rightarrow \textbf{Retardado}" inline={false} />
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                  <p className="text-orange-800 text-sm"><strong>Conclusão:</strong> O mesmo objeto pode ter seu movimento classificado de formas diferentes em diferentes fases do trajeto. A classificação é sempre local, referente a um intervalo de tempo específico.</p>
                </div>
              </div>
            </div>
          </div>

          {/* 8. Aplicações Práticas */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">8</span>
              Aplicações Práticas
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="font-bold text-slate-800 mb-2">Sistema ABS (Antilock Braking System)</h4>
                <p className="text-slate-600 text-sm leading-relaxed">O ABS monitora a aceleração escalar das rodas em tempo real. Quando detecta que v·α &lt; 0 com |α| muito elevado (risco de travamento), libera e reaplica os freios ciclicamente, mantendo o movimento retardado sem travar as rodas.</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="font-bold text-slate-800 mb-2">Decolagem e Pouso de Aeronaves</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Na decolagem, a aeronave realiza um movimento acelerado (v &gt; 0, α &gt; 0) até atingir a velocidade de sustentação. No pouso, realiza um movimento retardado (v &gt; 0, α &lt; 0) com uso de reversores de empuxo e freios.</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="font-bold text-slate-800 mb-2">Acelerômetros em Smartphones</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Os acelerômetros medem a aceleração vetorial do dispositivo nos três eixos. Aplicativos de física usam esses dados para classificar o movimento em tempo real, demonstrando experimentalmente os conceitos de acelerado e retardado.</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="font-bold text-slate-800 mb-2">Foguetes e Propulsão Espacial</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Durante o lançamento, um foguete realiza movimento acelerado. Ao desligar os motores no espaço (sem atmosfera), o movimento torna-se uniforme. Na reentrada atmosférica, o atrito causa movimento retardado.</p>
              </div>
            </div>
          </div>
        </div>


        {/* ===================== INTERPRETAÇÃO GRÁFICA — VELOCIDADE E ACELERAÇÃO ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Interpretação Gráfica — Velocidade e Aceleração</h2>

          <p className="text-slate-700 leading-relaxed mb-6">
            A análise gráfica é uma das ferramentas mais poderosas para resolver problemas de Cinemática. Em provas de alto nível, muitas questões são resolvidas <strong>exclusivamente</strong> pela leitura de gráficos, sem aplicar fórmulas. Dominar a linguagem gráfica é tão importante quanto dominar as equações. Aqui, analisamos os três gráficos fundamentais e as informações que cada um fornece.
          </p>

          {/* Gráfico v x t */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-blue-900 mb-4">Gráfico Velocidade × Tempo (v × t)</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              O gráfico <strong>v × t</strong> é, sem dúvida, o mais importante da Cinemática. Ele concentra duas informações fundamentais em uma única representação: a <strong>inclinação</strong> da curva fornece a aceleração, e a <strong>área</strong> sob a curva fornece o deslocamento.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white border border-blue-100 rounded-lg p-4">
                <h4 className="font-bold text-blue-800 mb-2">Inclinação = Aceleração</h4>
                <p className="text-slate-700 text-sm leading-relaxed mb-2">
                  A inclinação (coeficiente angular) da reta tangente à curva v(t) em qualquer ponto fornece a <strong>aceleração instantânea</strong> naquele instante. Se o gráfico é uma reta, a aceleração é constante (MRUV). Se é uma curva, a aceleração varia com o tempo.
                </p>
                <div className="bg-blue-100 rounded p-2 text-center">
                  <MathFormula formula="a(t) = \frac{dv}{dt} = \text{inclinação da tangente ao gráfico } v \times t" />
                </div>
                <div className="mt-2 text-xs text-slate-600">
                  <p><strong>Legenda:</strong> <MathFormula formula="a(t)" display={false} /> = aceleração instantânea (m/s²); <MathFormula formula="dv/dt" display={false} /> = derivada da velocidade em relação ao tempo.</p>
                </div>
              </div>
              <div className="bg-white border border-blue-100 rounded-lg p-4">
                <h4 className="font-bold text-blue-800 mb-2">Área = Deslocamento</h4>
                <div className="text-slate-700 text-sm leading-relaxed mb-2">
                  A área entre a curva v(t) e o eixo do tempo, no intervalo de <MathFormula formula="t_1" display={false} /> a <MathFormula formula="t_2" display={false} />, fornece o <strong>deslocamento escalar</strong> do móvel nesse intervalo. Áreas acima do eixo t são positivas (avanço); áreas abaixo são negativas (recuo).
                </div>
                <div className="bg-blue-100 rounded p-2 text-center">
                  <MathFormula formula="\Delta s = \int_{t_1}^{t_2} v(t) \, dt = \text{área (com sinal) sob } v \times t" />
                </div>
                <div className="mt-2 text-xs text-slate-600">
                  <p><strong>Legenda:</strong> <MathFormula formula="\Delta s" display={false} /> = deslocamento escalar (m); a integral representa a soma das áreas com sinal.</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-blue-100 rounded-lg p-4">
              <h4 className="font-bold text-blue-800 mb-2">Leitura Qualitativa do Gráfico v × t</h4>
              <ul className="text-slate-700 text-sm space-y-2">
                <li><strong>Reta horizontal (v = constante):</strong> MRU. Aceleração zero. Área = retângulo.</li>
                <li><strong>Reta inclinada para cima:</strong> MRUV acelerado. Aceleração positiva constante. Área = trapézio.</li>
                <li><strong>Reta inclinada para baixo:</strong> MRUV retardado (se v &gt; 0) ou acelerado retrógrado (se v cruza o zero). Aceleração negativa constante.</li>
                <li><strong>Curva v(t) cruzando o eixo t:</strong> O móvel inverte o sentido do movimento. A velocidade muda de sinal. A distância percorrida exige calcular as áreas separadamente (acima e abaixo).</li>
                <li><strong>Reta passando pela origem:</strong> Velocidade proporcional ao tempo. Aceleração constante e o móvel parte do repouso.</li>
              </ul>
            </div>
          </div>

          {/* Gráfico s x t */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-green-900 mb-4">Gráfico Posição × Tempo (s × t)</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              O gráfico <strong>s × t</strong> mostra a posição do móvel em cada instante. Sua principal informação está na <strong>inclinação</strong>, que fornece a velocidade. A forma da curva revela a natureza do movimento.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white border border-green-100 rounded-lg p-4">
                <h4 className="font-bold text-green-800 mb-2">Inclinação = Velocidade</h4>
                <div className="bg-green-100 rounded p-2 text-center mb-2">
                  <MathFormula formula="v(t) = \frac{ds}{dt} = \text{inclinação da tangente ao gráfico } s \times t" />
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">
                  Se o gráfico s × t é uma <strong>reta</strong>, a inclinação é constante e o movimento é uniforme (MRU). Se é uma <strong>parábola</strong>, a inclinação varia linearmente e o movimento é uniformemente variado (MRUV). A concavidade da parábola indica o sinal da aceleração.
                </p>
              </div>
              <div className="bg-white border border-green-100 rounded-lg p-4">
                <h4 className="font-bold text-green-800 mb-2">Concavidade = Sinal da Aceleração</h4>
                <ul className="text-slate-700 text-sm space-y-2">
                  <li><strong>Concavidade para cima (∪):</strong> Aceleração positiva (<MathFormula formula="a > 0" display={false} />).</li>
                  <li><strong>Concavidade para baixo (∩):</strong> Aceleração negativa (<MathFormula formula="a < 0" display={false} />).</li>
                  <li><strong>Sem concavidade (reta):</strong> Aceleração nula (<MathFormula formula="a = 0" display={false} />).</li>
                  <li><strong>Ponto de inflexão:</strong> A aceleração muda de sinal naquele instante.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Gráfico a x t */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-orange-900 mb-4">Gráfico Aceleração × Tempo (a × t)</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              O gráfico <strong>a × t</strong> mostra como a aceleração varia ao longo do tempo. Sua principal informação está na <strong>área</strong>, que fornece a variação de velocidade.
            </p>

            <div className="bg-white border border-orange-100 rounded-lg p-4 mb-4">
              <h4 className="font-bold text-orange-800 mb-2">Área = Variação de Velocidade</h4>
              <div className="bg-orange-100 rounded p-2 text-center mb-2">
                <MathFormula formula="\Delta v = \int_{t_1}^{t_2} a(t) \, dt = \text{área (com sinal) sob } a \times t" />
              </div>
              <div className="text-xs text-slate-600 mb-2">
                <p><strong>Legenda:</strong> <MathFormula formula="\Delta v = v_f - v_i" display={false} /> = variação da velocidade (m/s); a integral representa a soma das áreas com sinal sob a curva a(t).</p>
              </div>
              <div className="text-slate-700 text-sm leading-relaxed">
                Se a aceleração é constante, o gráfico a × t é uma <strong>reta horizontal</strong> e a área é um retângulo: <MathFormula formula="\Delta v = a \cdot \Delta t" display={false} />. Se a aceleração varia, a área pode ser um triângulo, trapézio ou figura irregular, exigindo cálculo integral ou decomposição geométrica.
              </div>
            </div>

            <div className="bg-white border border-orange-100 rounded-lg p-4">
              <h4 className="font-bold text-orange-800 mb-2">Resumo das Relações Gráficas</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-orange-100">
                      <th className="border border-orange-300 p-2 text-left">Gráfico</th>
                      <th className="border border-orange-300 p-2 text-left">Inclinação fornece</th>
                      <th className="border border-orange-300 p-2 text-left">Área fornece</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border border-orange-200 p-2">s × t</td><td className="border border-orange-200 p-2">Velocidade (v)</td><td className="border border-orange-200 p-2">—</td></tr>
                    <tr><td className="border border-orange-200 p-2">v × t</td><td className="border border-orange-200 p-2">Aceleração (a)</td><td className="border border-orange-200 p-2">Deslocamento (Δs)</td></tr>
                    <tr><td className="border border-orange-200 p-2">a × t</td><td className="border border-orange-200 p-2">—</td><td className="border border-orange-200 p-2">Variação de velocidade (Δv)</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== ARMADILHAS — VELOCIDADE E ACELERAÇÃO ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Armadilhas e Erros Conceituais Clássicos</h2>

          <p className="text-slate-700 leading-relaxed mb-6">
            Os conceitos de velocidade e aceleração são terreno fértil para armadilhas conceituais. Muitas dessas confusões são tão comuns que os elaboradores de provas as exploram deliberadamente. Conhecer esses erros é uma vantagem estratégica decisiva.
          </p>

          <div className="space-y-4">
            <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-5">
              <h4 className="font-bold text-red-800 mb-2">Erro 1: Confundir Velocidade Negativa com "Desaceleração"</h4>
              <div className="text-slate-700 text-sm leading-relaxed mb-2">
                Este é o erro mais perigoso e mais explorado. Uma velocidade negativa (<MathFormula formula="v < 0" display={false} />) significa apenas que o móvel se move no <strong>sentido oposto</strong> ao adotado como positivo. Não tem nada a ver com "frear" ou "desacelerar". Um carro andando de ré com velocidade crescente (em módulo) tem velocidade negativa e está <strong>acelerando</strong> (no sentido negativo). Desaceleração (retardamento) ocorre quando <MathFormula formula="v \cdot a < 0" display={false} />, ou seja, quando a aceleração se opõe à velocidade.
              </div>
              <div className="bg-red-100 rounded p-3 text-sm">
                <strong>Como evitar:</strong> Nunca associe o sinal da velocidade ao conceito de "acelerado" ou "retardado". O critério correto é o produto <MathFormula formula="v \cdot a" display={false} />: positivo = acelerado; negativo = retardado.
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-5">
              <h4 className="font-bold text-red-800 mb-2">Erro 2: Achar que Aceleração Zero Implica Repouso</h4>
              <div className="text-slate-700 text-sm leading-relaxed mb-2">
                Aceleração zero (<MathFormula formula="a = 0" display={false} />) significa que a velocidade <strong>não está mudando</strong>. Isso pode significar que o corpo está em repouso (v = 0 e a = 0), mas também pode significar que ele está em <strong>Movimento Retilíneo Uniforme</strong> (v = constante ≠ 0 e a = 0). Um avião voando a 900 km/h em linha reta e altitude constante tem aceleração zero, mas está muito longe do repouso.
              </div>
              <div className="bg-red-100 rounded p-3 text-sm">
                <strong>Como evitar:</strong> Aceleração zero → velocidade constante. Velocidade constante pode ser zero (repouso) ou diferente de zero (MRU). São dois casos distintos.
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-5">
              <h4 className="font-bold text-red-800 mb-2">Erro 3: Usar Média Aritmética para Velocidade Média</h4>
              <div className="text-slate-700 text-sm leading-relaxed mb-2">
                A velocidade média <strong>não é</strong> a média aritmética das velocidades, exceto em um caso muito específico (MRUV, onde <MathFormula formula="v_m = (v_i + v_f)/2" display={false} /> vale apenas porque a velocidade varia linearmente). No caso geral, a velocidade média é <MathFormula formula="v_m = d_{total} / \Delta t_{total}" display={false} />. O exemplo clássico: um carro percorre metade do caminho a 60 km/h e a outra metade a 120 km/h. A média aritmética daria 90 km/h, mas a velocidade média real é 80 km/h (média harmônica).
              </div>
              <div className="bg-red-100 rounded p-3 text-sm">
                <strong>Como evitar:</strong> Sempre volte à definição fundamental: <MathFormula formula="v_m = d_{total} / \Delta t_{total}" display={false} />. Calcule o tempo de cada trecho separadamente e some.
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-5">
              <h4 className="font-bold text-red-800 mb-2">Erro 4: Confundir Aceleração Escalar com Vetorial</h4>
              <div className="text-slate-700 text-sm leading-relaxed mb-2">
                A aceleração escalar (<MathFormula formula="\alpha" display={false} />) mede como o módulo da velocidade muda ao longo da trajetória. A aceleração vetorial (<MathFormula formula="\vec{a}" display={false} />) mede como o vetor velocidade muda no espaço. Em um movimento circular uniforme, a aceleração escalar é <strong>zero</strong> (o módulo da velocidade não muda), mas a aceleração vetorial é <strong>não-nula</strong> (a direção da velocidade muda constantemente). Esse é um dos conceitos mais confusos e mais cobrados.
              </div>
              <div className="bg-red-100 rounded p-3 text-sm">
                <strong>Como evitar:</strong> Lembre-se: a aceleração escalar se preocupa com "mais rápido ou mais devagar"; a vetorial se preocupa com "mudança de direção também". No MCU, o módulo não muda, mas a direção sim.
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-5">
              <h4 className="font-bold text-red-800 mb-2">Erro 5: Achar que Velocidade Instantânea = Velocidade Média</h4>
              <p className="text-slate-700 text-sm leading-relaxed mb-2">
                A velocidade instantânea é o valor da velocidade em um <strong>instante específico</strong>. A velocidade média é a razão entre deslocamento e tempo para um <strong>intervalo</strong>. Elas só coincidem no MRU (velocidade constante). Em qualquer outro tipo de movimento, a velocidade instantânea varia ao longo do tempo e a média é apenas um "resumo" do intervalo. Graficamente, a velocidade média é a inclinação da <strong>secante</strong> (reta que liga dois pontos), enquanto a instantânea é a inclinação da <strong>tangente</strong> (reta que toca um único ponto).
              </p>
              <div className="bg-red-100 rounded p-3 text-sm">
                <strong>Como evitar:</strong> Se o problema pede velocidade em um instante (ex: "em t = 3 s"), é instantânea. Se pede velocidade "entre t = 0 e t = 5 s", é média. A distinção está no "quando" vs. "durante quanto tempo".
              </div>
            </div>
          </div>
        </div>

        {/* ===================== CONEXÃO VETORIAL — VELOCIDADE E ACELERAÇÃO ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Conexão Vetorial — Relação Geométrica entre Velocidade e Aceleração</h2>

          <div className="text-slate-700 leading-relaxed mb-6">
            A relação geométrica entre os vetores <MathFormula formula="\vec{v}" display={false} /> e <MathFormula formula="\vec{a}" display={false} /> é um dos conceitos mais profundos e elegantes da Cinemática. Ela revela que a aceleração não apenas muda a "rapidez" do móvel, mas também pode mudar a <strong>direção</strong> do seu movimento. Essa análise vetorial é indispensável para compreender movimentos em duas ou três dimensões.
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-purple-900 mb-4">Decomposição da Aceleração: Tangencial e Centrípeta</h3>
            <div className="text-slate-700 leading-relaxed mb-4">
              Em qualquer movimento curvilíneo, o vetor aceleração pode ser decomposto em duas componentes perpendiculares entre si: a <strong>aceleração tangencial</strong> (<MathFormula formula="\vec{a}_T" display={false} />) e a <strong>aceleração centrípeta</strong> (<MathFormula formula="\vec{a}_C" display={false} />). Cada uma tem um papel físico distinto e fundamental.
            </div>
            <div className="bg-white border border-purple-100 rounded-lg p-4 text-center mb-4">
              <MathFormula formula="\vec{a} = \vec{a}_T + \vec{a}_C" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-purple-100 rounded-lg p-4">
                <h4 className="font-bold text-purple-800 mb-2">Aceleração Tangencial (<MathFormula formula="\vec{a}_T" display={false} />)</h4>
                <div className="text-slate-700 text-sm leading-relaxed mb-2">
                  É a componente da aceleração na <strong>direção da velocidade</strong> (tangente à trajetória). Ela é responsável por alterar o <strong>módulo</strong> da velocidade (fazer o móvel "acelerar" ou "frear"). Se <MathFormula formula="\vec{a}_T" display={false} /> tem o mesmo sentido de <MathFormula formula="\vec{v}" display={false} />, o módulo da velocidade aumenta. Se tem sentido oposto, o módulo diminui.
                </div>
                <div className="bg-purple-100 rounded p-2 text-center">
                  <MathFormula formula="a_T = \frac{dv}{dt}" />
                </div>
                <div className="mt-2 text-xs text-slate-600">
                  <p><strong>Legenda:</strong> <MathFormula formula="a_T" display={false} /> = módulo da aceleração tangencial (m/s²); <MathFormula formula="dv/dt" display={false} /> = taxa de variação do módulo da velocidade.</p>
                </div>
              </div>
              <div className="bg-white border border-purple-100 rounded-lg p-4">
                <h4 className="font-bold text-purple-800 mb-2">Aceleração Centrípeta (<MathFormula formula="\vec{a}_C" display={false} />)</h4>
                <p className="text-slate-700 text-sm leading-relaxed mb-2">
                  É a componente da aceleração <strong>perpendicular à velocidade</strong>, apontando sempre para o centro de curvatura da trajetória. Ela é responsável por alterar a <strong>direção</strong> da velocidade (fazer o móvel "curvar"). Mesmo que o módulo da velocidade não mude (como no MCU), a aceleração centrípeta é não-nula se a trajetória é curva.
                </p>
                <div className="bg-purple-100 rounded p-2 text-center">
                  <MathFormula formula="a_C = \frac{v^2}{R}" />
                </div>
                <div className="mt-2 text-xs text-slate-600">
                  <p><strong>Legenda:</strong> <MathFormula formula="a_C" display={false} /> = módulo da aceleração centrípeta (m/s²); <MathFormula formula="v" display={false} /> = módulo da velocidade (m/s); <MathFormula formula="R" display={false} /> = raio de curvatura da trajetória (m).</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-indigo-900 mb-4">Casos Fundamentais da Relação entre Velocidade e Aceleração</h3>

            <div className="space-y-4">
              <div className="bg-white border border-indigo-100 rounded-lg p-4">
                <h4 className="font-bold text-indigo-800 mb-2">Caso 1: Aceleração paralela à velocidade (mesmo sentido)</h4>
                <div className="text-slate-700 text-sm leading-relaxed">
                  <MathFormula formula="\vec{a} \parallel \vec{v}" display={false} /> e mesmo sentido → Movimento <strong>retilíneo acelerado</strong>. O módulo da velocidade aumenta. A aceleração centrípeta é zero (trajetória reta). Toda a aceleração é tangencial.
                </div>
              </div>
              <div className="bg-white border border-indigo-100 rounded-lg p-4">
                <h4 className="font-bold text-indigo-800 mb-2">Caso 2: Aceleração paralela à velocidade (sentido oposto)</h4>
                <div className="text-slate-700 text-sm leading-relaxed">
                  <MathFormula formula="\vec{a} \parallel \vec{v}" display={false} /> e sentido oposto → Movimento <strong>retilíneo retardado</strong>. O módulo da velocidade diminui. A aceleração centrípeta é zero. Toda a aceleração é tangencial (mas oposta a v).
                </div>
              </div>
              <div className="bg-white border border-indigo-100 rounded-lg p-4">
                <h4 className="font-bold text-indigo-800 mb-2">Caso 3: Aceleração perpendicular à velocidade</h4>
                <div className="text-slate-700 text-sm leading-relaxed">
                  <MathFormula formula="\vec{a} \perp \vec{v}" display={false} /> → Movimento <strong>circular uniforme</strong> (MCU). O módulo da velocidade <strong>não muda</strong> (a tangencial é zero), mas a direção muda constantemente. Toda a aceleração é centrípeta. Este é o caso mais contra-intuitivo: há aceleração, mas a "rapidez" não muda.
                </div>
              </div>
              <div className="bg-white border border-indigo-100 rounded-lg p-4">
                <h4 className="font-bold text-indigo-800 mb-2">Caso 4: Aceleração oblíqua à velocidade</h4>
                <div className="text-slate-700 text-sm leading-relaxed">
                  <MathFormula formula="\vec{a}" display={false} /> forma um ângulo com <MathFormula formula="\vec{v}" display={false} /> → Movimento <strong>curvilíneo não-uniforme</strong>. Tanto o módulo quanto a direção da velocidade mudam simultaneamente. A aceleração tem componente tangencial (muda o módulo) e centrípeta (muda a direção). Exemplo: um carro acelerando em uma curva.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-amber-900 mb-4">Módulo da Aceleração Total</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Como as componentes tangencial e centrípeta são sempre perpendiculares entre si, o módulo da aceleração total é obtido pelo Teorema de Pitágoras:
            </p>
            <div className="bg-white border border-amber-100 rounded-lg p-4 text-center mb-4">
              <MathFormula formula="a = \sqrt{a_T^2 + a_C^2} = \sqrt{\left(\frac{dv}{dt}\right)^2 + \left(\frac{v^2}{R}\right)^2}" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-white border border-amber-100 rounded p-3 text-center">
                <div className="font-bold text-amber-800 mb-1"><MathFormula formula="a" display={false} /></div>
                <p className="text-slate-600">Módulo da aceleração total (m/s²)</p>
              </div>
              <div className="bg-white border border-amber-100 rounded p-3 text-center">
                <div className="font-bold text-amber-800 mb-1"><MathFormula formula="a_T" display={false} /></div>
                <p className="text-slate-600">Aceleração tangencial (m/s²)</p>
              </div>
              <div className="bg-white border border-amber-100 rounded p-3 text-center">
                <div className="font-bold text-amber-800 mb-1"><MathFormula formula="a_C" display={false} /></div>
                <p className="text-slate-600">Aceleração centrípeta (m/s²)</p>
              </div>
              <div className="bg-white border border-amber-100 rounded p-3 text-center">
                <div className="font-bold text-amber-800 mb-1"><MathFormula formula="R" display={false} /></div>
                <p className="text-slate-600">Raio de curvatura da trajetória (m)</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== EXERCÍCIOS PROGRESSIVOS — VELOCIDADE E ACELERAÇÃO ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Exercícios Progressivos</h2>

          <p className="text-slate-700 leading-relaxed mb-6">
            A prática é o caminho para a maestria. Os exercícios abaixo estão organizados em ordem crescente de dificuldade, integrando os conceitos de velocidade média, aceleração e classificação de movimentos. Tente resolver cada um antes de consultar a resposta.
          </p>

          {/* Exercício 1 - Básico */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">Nível 1 — Conceitual</span>
            </div>
            <div className="text-slate-700 leading-relaxed mb-4">
              <strong>Exercício 1:</strong> Um carro se move em linha reta. Em um dado instante, sua velocidade é <MathFormula formula="v = -20 \text{ m/s}" display={false} /> e sua aceleração é <MathFormula formula="a = -5 \text{ m/s}^2" display={false} />. Classifique o movimento como acelerado ou retardado. O módulo da velocidade está aumentando ou diminuindo?
            </div>
            <details className="bg-white border border-green-100 rounded-lg p-4">
              <summary className="font-bold text-green-800 cursor-pointer">Ver Resposta</summary>
              <div className="mt-3 text-slate-700 text-sm leading-relaxed space-y-2">
                <p>Calculamos o produto <MathFormula formula="v \cdot a" display={false} />:</p>
                <div className="bg-green-100 rounded p-2 text-center">
                  <MathFormula formula="v \cdot a = (-20) \cdot (-5) = +100 > 0" />
                </div>
                <p>Como <MathFormula formula="v \cdot a > 0" display={false} />, o movimento é <strong>acelerado</strong>. O módulo da velocidade está <strong>aumentando</strong>.</p>
                <p><strong>Interpretação física:</strong> O carro se move no sentido negativo (ré) e a aceleração também aponta no sentido negativo. Como ambos apontam na mesma direção, o carro está "ganhando velocidade" no sentido da ré. Cuidado: muitos alunos veem o sinal negativo da aceleração e concluem erroneamente que é retardado.</p>
              </div>
            </details>
          </div>

          {/* Exercício 2 - Intermediário */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-full">Nível 2 — Aplicação</span>
            </div>
            <p className="text-slate-700 leading-relaxed mb-4">
              <strong>Exercício 2:</strong> Um motorista percorre 120 km de uma cidade A até uma cidade B a 60 km/h. No retorno, de B para A, ele percorre o mesmo trajeto a 40 km/h. Determine: (a) a velocidade escalar média para a viagem completa (ida e volta); (b) a velocidade vetorial média para a viagem completa.
            </p>
            <details className="bg-white border border-yellow-100 rounded-lg p-4">
              <summary className="font-bold text-yellow-800 cursor-pointer">Ver Resposta</summary>
              <div className="mt-3 text-slate-700 text-sm leading-relaxed space-y-2">
                <p><strong>(a) Velocidade escalar média:</strong></p>
                <p>Distância total: <MathFormula formula="d = 120 + 120 = 240 \text{ km}" display={false} /></p>
                <p>Tempo de ida: <MathFormula formula="t_1 = 120/60 = 2 \text{ h}" display={false} /></p>
                <p>Tempo de volta: <MathFormula formula="t_2 = 120/40 = 3 \text{ h}" display={false} /></p>
                <div className="bg-yellow-100 rounded p-2 text-center">
                  <MathFormula formula="v_{em} = \frac{d}{\Delta t} = \frac{240}{2 + 3} = \frac{240}{5} = 48 \text{ km/h}" />
                </div>
                <p>Note que 48 km/h é a <strong>média harmônica</strong> de 60 e 40: <MathFormula formula="v_m = \frac{2 \cdot 60 \cdot 40}{60 + 40} = \frac{4800}{100} = 48" display={false} /></p>
                <p><strong>(b) Velocidade vetorial média:</strong></p>
                <div className="bg-yellow-100 rounded p-2 text-center">
                  <MathFormula formula="\vec{v}_m = \frac{\Delta \vec{r}}{\Delta t} = \frac{0}{5} = 0 \text{ km/h}" />
                </div>
                <p>O deslocamento é zero porque o motorista voltou ao ponto de partida. A velocidade vetorial média é <strong>zero</strong>, apesar de ter percorrido 240 km.</p>
              </div>
            </details>
          </div>

          {/* Exercício 3 - Avançado */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">Nível 3 — Avançado</span>
            </div>
            <div className="text-slate-700 leading-relaxed mb-4">
              <strong>Exercício 3:</strong> O gráfico v × t de um móvel em trajetória retilínea mostra uma reta que parte de <MathFormula formula="v = 10 \text{ m/s}" display={false} /> em <MathFormula formula="t = 0" display={false} /> e atinge <MathFormula formula="v = -5 \text{ m/s}" display={false} /> em <MathFormula formula="t = 6 \text{ s}" display={false} />. Determine: (a) a aceleração; (b) o instante em que o móvel inverte o sentido; (c) o deslocamento total entre t = 0 e t = 6 s; (d) a distância total percorrida.
            </div>
            <details className="bg-white border border-orange-100 rounded-lg p-4">
              <summary className="font-bold text-orange-800 cursor-pointer">Ver Resposta</summary>
              <div className="mt-3 text-slate-700 text-sm leading-relaxed space-y-2">
                <p><strong>(a) Aceleração:</strong> Como o gráfico é uma reta, a aceleração é constante:</p>
                <div className="bg-orange-100 rounded p-2 text-center">
                  <MathFormula formula="a = \frac{\Delta v}{\Delta t} = \frac{-5 - 10}{6 - 0} = \frac{-15}{6} = -2{,}5 \text{ m/s}^2" />
                </div>
                <p><strong>(b) Inversão de sentido:</strong> Ocorre quando v = 0:</p>
                <div className="bg-orange-100 rounded p-2 text-center">
                  <MathFormula formula="0 = 10 + (-2{,}5) \cdot t \implies t = \frac{10}{2{,}5} = 4 \text{ s}" />
                </div>
                <p><strong>(c) Deslocamento (área com sinal):</strong></p>
                <p>De t = 0 a t = 4 s (triângulo acima do eixo): <MathFormula formula="A_1 = \frac{10 \cdot 4}{2} = +20 \text{ m}" display={false} /></p>
                <p>De t = 4 s a t = 6 s (triângulo abaixo do eixo): <MathFormula formula="A_2 = \frac{5 \cdot 2}{2} = -5 \text{ m}" display={false} /></p>
                <div className="bg-orange-100 rounded p-2 text-center">
                  <MathFormula formula="\Delta s = A_1 + A_2 = 20 + (-5) = 15 \text{ m}" />
                </div>
                <p><strong>(d) Distância percorrida (soma dos módulos):</strong></p>
                <div className="bg-orange-100 rounded p-2 text-center">
                  <MathFormula formula="d = |A_1| + |A_2| = 20 + 5 = 25 \text{ m}" />
                </div>
                <p><strong>Conclusão:</strong> O deslocamento (15 m) é menor que a distância (25 m) porque houve inversão de sentido em t = 4 s. Este é um exemplo perfeito de como a área "com sinal" e "sem sinal" do gráfico v × t fornecem informações diferentes.</p>
              </div>
            </details>
          </div>

          {/* Exercício 4 - Desafio */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">Nível 4 — Desafio</span>
            </div>
            <div className="text-slate-700 leading-relaxed mb-4">
              <strong>Exercício 4:</strong> Uma partícula descreve uma circunferência de raio <MathFormula formula="R = 5 \text{ m}" display={false} /> com velocidade escalar que varia segundo <MathFormula formula="v(t) = 3t \text{ (m/s)}" display={false} />. No instante <MathFormula formula="t = 2 \text{ s}" display={false} />, determine: (a) a aceleração tangencial; (b) a aceleração centrípeta; (c) o módulo da aceleração total.
            </div>
            <details className="bg-white border border-red-100 rounded-lg p-4">
              <summary className="font-bold text-red-800 cursor-pointer">Ver Resposta</summary>
              <div className="mt-3 text-slate-700 text-sm leading-relaxed space-y-2">
                <p>Em <MathFormula formula="t = 2 \text{ s}" display={false} />: <MathFormula formula="v = 3 \cdot 2 = 6 \text{ m/s}" display={false} /></p>
                <p><strong>(a) Aceleração tangencial:</strong></p>
                <div className="bg-red-100 rounded p-2 text-center">
                  <MathFormula formula="a_T = \frac{dv}{dt} = \frac{d(3t)}{dt} = 3 \text{ m/s}^2" />
                </div>
                <p><strong>(b) Aceleração centrípeta:</strong></p>
                <div className="bg-red-100 rounded p-2 text-center">
                  <MathFormula formula="a_C = \frac{v^2}{R} = \frac{6^2}{5} = \frac{36}{5} = 7{,}2 \text{ m/s}^2" />
                </div>
                <p><strong>(c) Módulo da aceleração total:</strong></p>
                <div className="bg-red-100 rounded p-2 text-center">
                  <MathFormula formula="a = \sqrt{a_T^2 + a_C^2} = \sqrt{3^2 + 7{,}2^2} = \sqrt{9 + 51{,}84} = \sqrt{60{,}84} \approx 7{,}8 \text{ m/s}^2" />
                </div>
                <p><strong>Observação:</strong> Note que a aceleração centrípeta (7,2 m/s²) é muito maior que a tangencial (3 m/s²). Isso significa que, neste instante, a maior parte da aceleração está sendo "usada" para mudar a direção do movimento, não para aumentar a rapidez. O ângulo entre <MathFormula formula="\vec{a}" display={false} /> e <MathFormula formula="\vec{v}" display={false} /> é <MathFormula formula="\theta = \arctan(a_C / a_T) = \arctan(7{,}2 / 3) \approx 67°" display={false} />.</p>
              </div>
            </details>
          </div>
        </div>

        {/* ===================== SÍNTESE — VELOCIDADE E ACELERAÇÃO ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Síntese — Conexão Entre os Conceitos</h2>

          <p className="text-slate-700 leading-relaxed mb-6">
            Os conceitos de velocidade e aceleração formam uma cadeia lógica inseparável. Cada conceito se constrói sobre o anterior, e dominá-los em conjunto é o que permite resolver problemas complexos com clareza e eficiência.
          </p>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Cadeia Lógica: Velocidade → Aceleração → Classificação</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                <div>
                  <p className="font-bold text-slate-900">Velocidade Média e Escalar</p>
                  <p className="text-slate-700 text-sm">Definimos como o móvel se desloca ao longo do tempo. A escalar mede o "rastro"; a vetorial mede a "eficácia" do deslocamento.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                <div>
                  <p className="font-bold text-slate-900">Aceleração Escalar e Vetorial</p>
                  <p className="text-slate-700 text-sm">Definimos como a velocidade muda ao longo do tempo. A escalar mede se o móvel fica "mais rápido ou mais lento"; a vetorial inclui mudanças de direção.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                <div>
                  <p className="font-bold text-slate-900">Classificação: Acelerado, Retardado, Uniforme</p>
                  <p className="text-slate-700 text-sm">Com base no produto v·a, classificamos o movimento. Se v·a &gt; 0, acelerado. Se v·a &lt; 0, retardado. Se a = 0, uniforme.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
                <div>
                  <p className="font-bold text-slate-900">Próximo Passo: MRU e MRUV</p>
                  <p className="text-slate-700 text-sm">Com esses conceitos dominados, estamos prontos para estudar os dois modelos fundamentais: o Movimento Retilíneo Uniforme (a = 0) e o Uniformemente Variado (a = constante).</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h4 className="font-bold text-amber-900 mb-3">Mapa de Relações</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-amber-100">
                    <th className="border border-amber-300 p-2 text-left">Conceito</th>
                    <th className="border border-amber-300 p-2 text-left">Fórmula Fundamental</th>
                    <th className="border border-amber-300 p-2 text-left">O que mede</th>
                    <th className="border border-amber-300 p-2 text-left">Unidade SI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border border-amber-200 p-2">Velocidade Escalar Média</td><td className="border border-amber-200 p-2">d / Δt</td><td className="border border-amber-200 p-2">Rapidez média ao longo da trajetória</td><td className="border border-amber-200 p-2">m/s</td></tr>
                  <tr><td className="border border-amber-200 p-2">Velocidade Vetorial Média</td><td className="border border-amber-200 p-2">Δr / Δt</td><td className="border border-amber-200 p-2">Taxa média de mudança de posição</td><td className="border border-amber-200 p-2">m/s</td></tr>
                  <tr><td className="border border-amber-200 p-2">Aceleração Escalar Média</td><td className="border border-amber-200 p-2">Δv / Δt</td><td className="border border-amber-200 p-2">Taxa de variação do módulo da velocidade</td><td className="border border-amber-200 p-2">m/s²</td></tr>
                  <tr><td className="border border-amber-200 p-2">Aceleração Vetorial</td><td className="border border-amber-200 p-2">Δv⃗ / Δt</td><td className="border border-amber-200 p-2">Taxa de variação do vetor velocidade</td><td className="border border-amber-200 p-2">m/s²</td></tr>
                  <tr><td className="border border-amber-200 p-2">Aceleração Tangencial</td><td className="border border-amber-200 p-2">dv/dt</td><td className="border border-amber-200 p-2">Mudança do módulo da velocidade</td><td className="border border-amber-200 p-2">m/s²</td></tr>
                  <tr><td className="border border-amber-200 p-2">Aceleração Centrípeta</td><td className="border border-amber-200 p-2">v²/R</td><td className="border border-amber-200 p-2">Mudança da direção da velocidade</td><td className="border border-amber-200 p-2">m/s²</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </section>

      <footer className="bg-slate-900 text-white py-12 mt-12">
        <div className="container text-center">
          <p className="text-slate-400 mb-4">Projeto Vetor</p>
          <div className="flex justify-center gap-6">
            <Link href="/cinematica/topic/bases" className="text-blue-400 hover:text-blue-300 transition-colors">Bases da Cinemática</Link>
            <span className="text-slate-700">|</span>
            <Link href="/cinematica" className="text-blue-400 hover:text-blue-300 transition-colors">Menu Principal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
