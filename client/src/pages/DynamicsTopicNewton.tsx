import { useState } from "react";
import { ChevronDown, ChevronUp, ArrowLeft, BookOpen, AlertTriangle, Lightbulb, Target, Zap, Shield } from "lucide-react";
import { Link } from "wouter";
import { MathFormula } from "@/components/MathFormula";

export default function DynamicsTopicNewton() {
  const [openExamples, setOpenExamples] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"teoria" | "exemplos" | "resumo">("teoria");

  const toggleExample = (id: string) => {
    setOpenExamples(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dinamica">
              <a className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </a>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Leis de Newton</h1>
              <p className="text-xs text-slate-500">Dinâmica — Fundamentos</p>
            </div>
          </div>
          <div className="flex gap-2">
            {(["teoria", "exemplos", "resumo"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* ===== ABA TEORIA ===== */}
        {activeTab === "teoria" && (
          <div className="space-y-10">

            {/* PARTE 1 — CONTEXTO HISTÓRICO */}
            <section className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-5">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Parte 1 — Contexto Físico e Histórico</h2>
                </div>
              </div>
              <div className="p-8 space-y-5">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-5 rounded-r-xl">
                  <p className="text-slate-700 leading-relaxed">
                    A <strong>Dinâmica</strong> é a parte da Mecânica que tenta responder a uma pergunta mais profunda do que a Cinemática. A Cinemática pergunta: <em>"Como o corpo se move?"</em> — ela descreve posição, velocidade, aceleração, trajetória e gráficos. A Dinâmica pergunta: <em>"Por que o corpo se move desse jeito?"</em> — ela quer saber quais interações fazem um corpo acelerar, frear, mudar de direção, permanecer parado ou continuar em movimento retilíneo uniforme.
                  </p>
                  <p className="text-slate-700 leading-relaxed mt-3">
                    Dizer que um bloco tem aceleração de <MathFormula formula="2 \text{ m/s}^2" /> é Cinemática. Explicar que essa aceleração ocorre porque a força resultante sobre ele é diferente de zero é Dinâmica.
                  </p>
                </div>

                <p className="text-slate-700 leading-relaxed">
                  Durante muito tempo, a explicação do movimento foi contaminada por uma ideia intuitiva, mas errada: a ideia de que uma força seria necessária para <strong>manter</strong> um corpo em movimento. Essa ideia parece razoável no cotidiano — quando você empurra uma mesa, ela só se move enquanto você continua empurrando. O problema é que o cotidiano está cheio de atrito e resistência do ar. O que faz a mesa parar não é a ausência da força da mão. É a presença de forças resistentes.
                </p>

                <p className="text-slate-700 leading-relaxed">
                  A grande virada conceitual veio com <strong>Galileu</strong> e foi consolidada por <strong>Newton</strong>. Galileu percebeu que, se reduzirmos os efeitos resistivos, um corpo tende a manter seu movimento por mais tempo. No limite ideal de ausência de atrito, um corpo lançado em uma superfície horizontal continuaria em movimento retilíneo uniforme indefinidamente. Essa ideia muda tudo: <strong>o movimento não precisa ser sustentado por uma força. O que precisa de força resultante é a mudança do movimento.</strong>
                </p>

                <div className="bg-slate-900 rounded-xl p-6 text-center">
                  <p className="text-amber-400 font-bold text-lg mb-2">A Ideia Central da Dinâmica</p>
                  <p className="text-white text-xl font-semibold">Força resultante não mantém velocidade.</p>
                  <p className="text-white text-xl font-semibold">Força resultante <span className="text-green-400">muda</span> velocidade.</p>
                </div>

                <p className="text-slate-700 leading-relaxed">
                  Newton organizou essa visão em três leis fundamentais que formam a base da Mecânica Clássica. Essas leis conectam três conceitos centrais: <strong>força</strong> (uma interação), <strong>massa</strong> (a resistência do corpo a mudanças no movimento) e <strong>aceleração</strong> (a mudança da velocidade vetorial). A Segunda Lei resume essa relação:
                </p>
                <div className="bg-slate-900 rounded-xl p-5 text-center">
                  <MathFormula formula="\vec{F}_{\text{res}} = m\vec{a}" display={true} />
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Por isso, em Dinâmica, a pergunta correta não é "Existe força?", mas sim: <strong>"Qual é a força resultante?"</strong> Um corpo pode ter várias forças atuando nele e, mesmo assim, ter força resultante nula — nesse caso, ele não acelera.
                </p>
              </div>
            </section>

            {/* PARTE 2 — IDEIA INTUITIVA */}
            <section className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-5">
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Parte 2 — Ideia Intuitiva do Conteúdo</h2>
                </div>
              </div>
              <div className="p-8 space-y-5">
                <p className="text-slate-700 leading-relaxed">
                  A velocidade é uma grandeza vetorial — possui módulo, direção e sentido. Então mudar a velocidade pode significar três coisas: aumentar o módulo (carro arrancando), diminuir o módulo (carro freando) ou mudar a direção (carro fazendo uma curva com rapidez constante). Por isso, existe aceleração sempre que a velocidade vetorial muda — mesmo que o velocímetro marque sempre o mesmo valor.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="font-bold text-green-800 mb-1">Força como Interação</p>
                    <p className="text-slate-700 text-sm">Força não é algo que o corpo "possui". É uma interação entre corpos. Sempre que você desenhar uma força, deve conseguir responder: <em>"Quem exerce essa força?"</em></p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="font-bold text-blue-800 mb-1">Massa como Resistência</p>
                    <p className="text-slate-700 text-sm">Massa está associada à inércia — a tendência de manter o estado de movimento. Quanto maior a massa, maior a dificuldade de alterar a velocidade.</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <p className="font-bold text-purple-800 mb-1">Aceleração como Efeito</p>
                    <p className="text-slate-700 text-sm">A aceleração não aponta necessariamente no sentido do movimento. Ela aponta no sentido da força resultante. Velocidade e aceleração podem ter sentidos opostos.</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <p className="font-bold text-slate-800 mb-3">O Papel da Força Resultante</p>
                  <p className="text-slate-700 text-sm mb-3">Imagine um bloco sendo puxado por <MathFormula formula="30 \text{ N}" /> para a direita e sofrendo atrito de <MathFormula formula="10 \text{ N}" /> para a esquerda. A força resultante horizontal é:</p>
                  <div className="bg-slate-900 rounded-lg p-3 text-center">
                    <MathFormula formula="F_{\text{res}} = 30 - 10 = 20 \text{ N}" display={true} />
                  </div>
                  <p className="text-slate-700 text-sm mt-3">A aceleração depende desses <strong>20 N que sobraram</strong>, não dos 30 N aplicados separadamente. A Dinâmica não pergunta quais forças existem — ela pergunta qual força sobra depois da soma vetorial.</p>
                </div>
              </div>
            </section>

            {/* PARTE 3 — DEFINIÇÕES FORMAIS */}
            <section className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
              <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-8 py-5">
                <h2 className="text-xl font-bold text-white">Parte 3 — Definições Formais</h2>
              </div>
              <div className="p-8 space-y-8">

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">1</span>
                    Força
                  </h3>
                  <p className="text-slate-700 leading-relaxed mb-3">
                    Força é uma grandeza física <strong>vetorial</strong> associada à interação entre corpos, capaz de alterar o estado de movimento de um corpo e/ou produzir deformações. A unidade de força no SI é o <strong>newton</strong> (<MathFormula formula="\text{N}" />).
                  </p>
                  <div className="bg-slate-900 rounded-xl p-4 text-center">
                    <MathFormula formula="1 \text{ N} = 1 \text{ kg} \cdot \frac{\text{m}}{\text{s}^2}" display={true} />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">2</span>
                    Força Resultante
                  </h3>
                  <p className="text-slate-700 leading-relaxed mb-3">
                    A força resultante sobre um corpo é a <strong>soma vetorial</strong> de todas as forças que atuam nesse corpo.
                  </p>
                  <div className="bg-slate-900 rounded-xl p-4 text-center mb-3">
                    <MathFormula formula="\vec{F}_{\text{res}} = \vec{F}_1 + \vec{F}_2 + \vec{F}_3 + \cdots" display={true} />
                  </div>
                  <p className="text-slate-700 text-sm">Se as forças forem perpendiculares, o módulo da resultante é calculado por Pitágoras: <MathFormula formula="F_{\text{res}} = \sqrt{F_x^2 + F_y^2}" /></p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <h4 className="font-bold text-blue-800 mb-2">Massa</h4>
                    <p className="text-slate-700 text-sm leading-relaxed">Grandeza escalar associada à inércia. Unidade: <MathFormula formula="\text{kg}" />. Mede a resistência que um corpo oferece a mudanças em seu movimento.</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                    <h4 className="font-bold text-purple-800 mb-2">Inércia</h4>
                    <p className="text-slate-700 text-sm leading-relaxed">Tendência que um corpo tem de manter seu estado de movimento. <strong>Inércia não é força</strong> — é uma propriedade da matéria. Não se deve desenhar uma "força de inércia" em DCLs de referenciais inerciais.</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-green-800 mb-3">Primeira Lei de Newton (Lei da Inércia)</h3>
                  <blockquote className="border-l-4 border-green-500 pl-4 italic text-slate-700 mb-4">
                    "Todo corpo tende a permanecer em repouso ou em movimento retilíneo uniforme, a menos que uma força resultante externa atue sobre ele."
                  </blockquote>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <MathFormula formula="\vec{F}_{\text{res}} = \vec{0}" display={true} />
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <MathFormula formula="\vec{a} = \vec{0}" display={true} />
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <MathFormula formula="\vec{v} = \text{constante}" display={true} />
                    </div>
                  </div>
                  <p className="text-slate-700 text-sm mt-3"><strong>Equilíbrio não significa necessariamente repouso.</strong> Um corpo em MRU também está em equilíbrio.</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Segunda Lei de Newton (Princípio Fundamental da Dinâmica)</h3>
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-xl p-8 mb-5">
                    <p className="text-slate-400 text-sm text-center mb-2">Equação Fundamental</p>
                    <div className="bg-black/50 rounded-xl p-5 text-center mb-6">
                      <MathFormula formula="\vec{F}_{\text{res}} = m\vec{a}" display={true} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-800/70 rounded-lg p-4 text-center">
                        <p className="text-indigo-400 font-bold text-lg mb-1"><MathFormula formula="\vec{F}_{\text{res}}" /></p>
                        <p className="text-slate-300 text-xs">Soma vetorial de todas as forças sobre o corpo</p>
                        <p className="text-slate-400 text-xs mt-1">Unidade: N</p>
                      </div>
                      <div className="bg-slate-800/70 rounded-lg p-4 text-center">
                        <p className="text-green-400 font-bold text-lg mb-1"><MathFormula formula="m" /></p>
                        <p className="text-slate-300 text-xs">Massa do corpo — mede a inércia</p>
                        <p className="text-slate-400 text-xs mt-1">Unidade: kg</p>
                      </div>
                      <div className="bg-slate-800/70 rounded-lg p-4 text-center">
                        <p className="text-amber-400 font-bold text-lg mb-1"><MathFormula formula="\vec{a}" /></p>
                        <p className="text-slate-300 text-xs">Aceleração vetorial — consequência da força</p>
                        <p className="text-slate-400 text-xs mt-1">Unidade: m/s²</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-700 mt-6 pt-5 space-y-3">
                      <p className="text-slate-400 text-sm text-center mb-3">Demonstração — Como chegamos em F = ma</p>
                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <p className="text-slate-300 text-sm font-semibold mb-2">Passo 1 — Proporcionalidade com a Força</p>
                        <p className="text-slate-400 text-sm">Experimentos mostram que, para uma mesma massa, dobrar a força dobra a aceleração:</p>
                        <div className="text-center mt-2"><MathFormula formula="a \propto F_{\text{res}}" display={true} /></div>
                      </div>
                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <p className="text-slate-300 text-sm font-semibold mb-2">Passo 2 — Proporcionalidade inversa com a Massa</p>
                        <p className="text-slate-400 text-sm">Para uma mesma força, dobrar a massa reduz a aceleração pela metade:</p>
                        <div className="text-center mt-2"><MathFormula formula="a \propto \frac{1}{m}" display={true} /></div>
                      </div>
                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <p className="text-slate-300 text-sm font-semibold mb-2">Passo 3 — Síntese</p>
                        <p className="text-slate-400 text-sm">Combinando as duas proporcionalidades e introduzindo a constante de proporcionalidade (que é 1 no SI):</p>
                        <div className="text-center mt-2"><MathFormula formula="F_{\text{res}} = m \cdot a" display={true} /></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    A Segunda Lei é vetorial. Em duas dimensões, ela se decompõe em dois eixos:
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="bg-slate-900 rounded-xl p-4 text-center">
                      <MathFormula formula="\sum F_x = ma_x" display={true} />
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 text-center">
                      <MathFormula formula="\sum F_y = ma_y" display={true} />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-rose-800 mb-3">Terceira Lei de Newton (Ação e Reação)</h3>
                  <blockquote className="border-l-4 border-rose-500 pl-4 italic text-slate-700 mb-4">
                    "Para toda ação, existe uma reação de mesma intensidade, mesma direção e sentido oposto, atuando em corpos diferentes."
                  </blockquote>
                  <div className="bg-white rounded-xl p-4 text-center mb-4">
                    <MathFormula formula="\vec{F}_{A \to B} = -\vec{F}_{B \to A}" display={true} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-rose-200">
                      <p className="font-bold text-rose-700 text-sm mb-1">Mesma Natureza</p>
                      <p className="text-slate-600 text-xs">Ação e reação são sempre do mesmo tipo de força (gravitacional, elétrica, de contato...)</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-rose-200">
                      <p className="font-bold text-rose-700 text-sm mb-1">Mesma Intensidade</p>
                      <p className="text-slate-600 text-xs">Os módulos são sempre iguais: <MathFormula formula="|\vec{F}_{A \to B}| = |\vec{F}_{B \to A}|" /></p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-rose-200">
                      <p className="font-bold text-rose-700 text-sm mb-1">Corpos Diferentes</p>
                      <p className="text-slate-600 text-xs">As forças atuam em corpos diferentes — por isso não se cancelam no mesmo DCL.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">Diagrama de Corpo Livre (DCL)</h3>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    O DCL é a representação gráfica de todas as forças que atuam sobre um único corpo isolado. É a etapa mais importante em problemas de Dinâmica.
                  </p>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                    <p className="font-bold text-indigo-800 mb-3">Passos para Construir um DCL Correto</p>
                    <ol className="space-y-2">
                      {[
                        "Escolha o corpo a ser analisado.",
                        "Isole mentalmente esse corpo.",
                        "Desenhe apenas as forças que atuam sobre ele.",
                        "Não desenhe forças que esse corpo exerce nos outros.",
                        "Identifique quem exerce cada força.",
                        "Escolha eixos convenientes.",
                        "Decomponha forças inclinadas quando necessário.",
                        "Aplique a Segunda Lei em cada eixo."
                      ].map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                          <span className="text-slate-700 text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Força Peso</h3>
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-xl p-7 mb-4">
                    <p className="text-slate-400 text-sm text-center mb-2">Peso é a força gravitacional exercida por um astro sobre um corpo</p>
                    <div className="bg-black/50 rounded-xl p-4 text-center mb-4">
                      <MathFormula formula="P = mg" display={true} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-800/70 rounded-lg p-3 text-center">
                        <p className="text-amber-400 font-bold mb-1"><MathFormula formula="P" /></p>
                        <p className="text-slate-300 text-xs">Força peso — aponta para baixo (N)</p>
                      </div>
                      <div className="bg-slate-800/70 rounded-lg p-3 text-center">
                        <p className="text-green-400 font-bold mb-1"><MathFormula formula="m" /></p>
                        <p className="text-slate-300 text-xs">Massa — não muda com o planeta (kg)</p>
                      </div>
                      <div className="bg-slate-800/70 rounded-lg p-3 text-center">
                        <p className="text-blue-400 font-bold mb-1"><MathFormula formula="g" /></p>
                        <p className="text-slate-300 text-xs">Aceleração gravitacional local (m/s²)</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                    <p className="font-bold text-red-800 mb-1">Armadilha Clássica</p>
                    <p className="text-slate-700 text-sm">Massa é medida em kg. Peso é força, medido em N. Dizer "meu peso é 70 kg" é fisicamente errado. A massa é 70 kg. O peso na Terra (<MathFormula formula="g = 10 \text{ m/s}^2" />) é <MathFormula formula="P = 700 \text{ N}" />.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Força Normal</h3>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    A força normal é a força de contato exercida por uma superfície sobre um corpo, <strong>perpendicular à superfície</strong>. A normal deve ser determinada pela Segunda Lei no eixo perpendicular à superfície — ela <strong>não é sempre igual ao peso</strong>.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-800 text-white">
                          <th className="p-3 text-left rounded-tl-lg">Situação</th>
                          <th className="p-3 text-center">Fórmula da Normal</th>
                          <th className="p-3 text-left rounded-tr-lg">Observação</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-slate-50">
                          <td className="p-3 border-b border-slate-200">Superfície horizontal (sem aceleração)</td>
                          <td className="p-3 border-b border-slate-200 text-center"><MathFormula formula="N = mg" /></td>
                          <td className="p-3 border-b border-slate-200">Caso mais simples</td>
                        </tr>
                        <tr className="bg-white">
                          <td className="p-3 border-b border-slate-200">Plano inclinado (sem aceleração perpendicular)</td>
                          <td className="p-3 border-b border-slate-200 text-center"><MathFormula formula="N = mg\cos\theta" /></td>
                          <td className="p-3 border-b border-slate-200">N é menor que P</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="p-3 border-b border-slate-200">Elevador acelerando para cima</td>
                          <td className="p-3 border-b border-slate-200 text-center"><MathFormula formula="N = m(g+a)" /></td>
                          <td className="p-3 border-b border-slate-200">Pessoa "mais pesada"</td>
                        </tr>
                        <tr className="bg-white">
                          <td className="p-3 border-b border-slate-200">Elevador acelerando para baixo</td>
                          <td className="p-3 border-b border-slate-200 text-center"><MathFormula formula="N = m(g-a)" /></td>
                          <td className="p-3 border-b border-slate-200">Pessoa "mais leve"</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="p-3">Queda livre</td>
                          <td className="p-3 text-center"><MathFormula formula="N = 0" /></td>
                          <td className="p-3">Ausência aparente de peso</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Força de Tração</h3>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Tração é a força exercida por fios, cordas ou cabos esticados. Em um <strong>fio ideal</strong> (massa desprezível e inextensível), a tração tem o mesmo módulo ao longo de todo o fio.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-800 text-white">
                          <th className="p-3 text-left rounded-tl-lg">Situação</th>
                          <th className="p-3 text-center">Fórmula da Tração</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-slate-50">
                          <td className="p-3 border-b border-slate-200">Bloco pendurado em repouso</td>
                          <td className="p-3 border-b border-slate-200 text-center"><MathFormula formula="T = mg" /></td>
                        </tr>
                        <tr className="bg-white">
                          <td className="p-3 border-b border-slate-200">Bloco subindo acelerado</td>
                          <td className="p-3 border-b border-slate-200 text-center"><MathFormula formula="T = m(g+a)" /></td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="p-3">Bloco descendo acelerado</td>
                          <td className="p-3 text-center"><MathFormula formula="T = m(g-a)" /></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Atrito Estático e Cinético</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                      <h4 className="font-bold text-orange-800 mb-3">Atrito Estático</h4>
                      <p className="text-slate-700 text-sm mb-3">Atua quando não há escorregamento. Ele se ajusta conforme a tendência de escorregamento, até atingir um valor máximo.</p>
                      <div className="bg-white rounded-lg p-3 text-center mb-2">
                        <MathFormula formula="f_e \leq \mu_e N" display={true} />
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <MathFormula formula="f_{e,\text{máx}} = \mu_e N" display={true} />
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                        <p className="text-red-700 text-xs"><strong>Erro clássico:</strong> usar <MathFormula formula="f_e = \mu_e N" /> sempre. Isso só vale na iminência de escorregar.</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                      <h4 className="font-bold text-blue-800 mb-3">Atrito Cinético</h4>
                      <p className="text-slate-700 text-sm mb-3">Atua quando há escorregamento relativo entre as superfícies.</p>
                      <div className="bg-white rounded-lg p-3 text-center mb-3">
                        <MathFormula formula="f_c = \mu_c N" display={true} />
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <MathFormula formula="\mu_e > \mu_c" display={true} />
                      </div>
                      <p className="text-slate-600 text-xs mt-2">É mais difícil iniciar o movimento do que mantê-lo após o deslizamento começar.</p>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* PARTE 4 — DEMONSTRAÇÕES */}
            <section className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
              <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-8 py-5">
                <h2 className="text-xl font-bold text-white">Parte 4 — Demonstrações Matemáticas</h2>
              </div>
              <div className="p-8 space-y-8">

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Plano Inclinado Sem Atrito</h3>
                  <p className="text-slate-700 text-sm mb-4">Bloco de massa <MathFormula formula="m" /> em plano inclinado de ângulo <MathFormula formula="\theta" />, sem atrito. Forças: peso <MathFormula formula="\vec{P}" /> (vertical para baixo) e normal <MathFormula formula="\vec{N}" /> (perpendicular ao plano).</p>
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="font-semibold text-slate-700 text-sm mb-2">Eixo y (perpendicular ao plano) — <MathFormula formula="a_y = 0" /></p>
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="N - mg\cos\theta = 0 \implies N = mg\cos\theta" display={true} />
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="font-semibold text-slate-700 text-sm mb-2">Eixo x (paralelo ao plano)</p>
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="mg\sin\theta = ma \implies a = g\sin\theta" display={true} />
                      </div>
                    </div>
                  </div>
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl mt-3">
                    <p className="text-amber-800 text-sm"><strong>Conclusão importante:</strong> sem atrito, a aceleração do bloco no plano inclinado independe da massa.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Plano Inclinado Com Atrito Cinético (Bloco Descendo)</h3>
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="font-semibold text-slate-700 text-sm mb-2">Normal e Atrito</p>
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="N = mg\cos\theta \quad f_c = \mu_c mg\cos\theta" display={true} />
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="font-semibold text-slate-700 text-sm mb-2">Eixo paralelo — Aceleração</p>
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="a = g(\sin\theta - \mu_c\cos\theta)" display={true} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Condição de Iminência de Escorregamento</h3>
                  <p className="text-slate-700 text-sm mb-3">Na iminência de descer, o atrito estático assume valor máximo. No eixo paralelo, o bloco ainda está em equilíbrio:</p>
                  <div className="bg-slate-900 rounded-xl p-5 text-center">
                    <MathFormula formula="mg\sin\theta = \mu_e mg\cos\theta \implies \tan\theta = \mu_e" display={true} />
                  </div>
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl mt-3">
                    <p className="text-amber-800 text-sm"><strong>Resultado importante:</strong> no ângulo crítico de escorregamento, <MathFormula formula="\mu_e = \tan\theta" />. Muito cobrado em problemas experimentais de atrito.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Sistema de Dois Blocos em Superfície Horizontal</h3>
                  <p className="text-slate-700 text-sm mb-3">Blocos <MathFormula formula="m_1" /> e <MathFormula formula="m_2" /> em contato, força <MathFormula formula="F" /> empurrando <MathFormula formula="m_1" />, sem atrito.</p>
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="font-semibold text-slate-700 text-sm mb-2">Sistema completo — Aceleração</p>
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="a = \frac{F}{m_1 + m_2}" display={true} />
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="font-semibold text-slate-700 text-sm mb-2">Isolando <MathFormula formula="m_2" /> — Força de Contato</p>
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="C = m_2 a = \frac{m_2 F}{m_1 + m_2}" display={true} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Máquina de Atwood Ideal</h3>
                  <p className="text-slate-700 text-sm mb-3">Dois blocos <MathFormula formula="m_1" /> e <MathFormula formula="m_2" /> (<MathFormula formula="m_2 > m_1" />) ligados por fio ideal em polia ideal.</p>
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="font-semibold text-slate-700 text-sm mb-2">Aceleração</p>
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="a = \frac{(m_2 - m_1)g}{m_1 + m_2}" display={true} />
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="font-semibold text-slate-700 text-sm mb-2">Tração no fio</p>
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="T = \frac{2m_1 m_2 g}{m_1 + m_2}" display={true} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Elevador Acelerado</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="font-semibold text-slate-700 text-sm mb-2">Acelerando para cima</p>
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="N = m(g+a)" display={true} />
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="font-semibold text-slate-700 text-sm mb-2">Acelerando para baixo</p>
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="N = m(g-a)" display={true} />
                      </div>
                    </div>
                  </div>
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl mt-3">
                    <p className="text-amber-800 text-sm">Em queda livre (<MathFormula formula="a = g" />): <MathFormula formula="N = 0" />. A pessoa não perdeu seu peso (<MathFormula formula="P = mg" /> continua existindo). O que desapareceu foi a <strong>normal do piso</strong> sobre a pessoa.</p>
                  </div>
                </div>

              </div>
            </section>

            {/* PARTE 5 — CASOS ESPECIAIS */}
            <section className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
              <div className="bg-gradient-to-r from-teal-600 to-cyan-700 px-8 py-5">
                <h2 className="text-xl font-bold text-white">Parte 5 — Casos Especiais e Interpretação Gráfica</h2>
              </div>
              <div className="p-8 space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="p-3 text-left rounded-tl-lg">Caso</th>
                        <th className="p-3 text-left">Condição</th>
                        <th className="p-3 text-left rounded-tr-lg">Efeito no Movimento</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-slate-50"><td className="p-3 border-b border-slate-200">F resultante nula</td><td className="p-3 border-b border-slate-200"><MathFormula formula="\vec{F}_{\text{res}} = \vec{0}" /></td><td className="p-3 border-b border-slate-200">Velocidade constante (repouso ou MRU)</td></tr>
                      <tr className="bg-white"><td className="p-3 border-b border-slate-200">F paralela e no sentido de v</td><td className="p-3 border-b border-slate-200"><MathFormula formula="\vec{F}_{\text{res}} \parallel \vec{v}" /> (mesmo sentido)</td><td className="p-3 border-b border-slate-200">Módulo da velocidade aumenta</td></tr>
                      <tr className="bg-slate-50"><td className="p-3 border-b border-slate-200">F paralela e oposta a v</td><td className="p-3 border-b border-slate-200"><MathFormula formula="\vec{F}_{\text{res}} \parallel \vec{v}" /> (sentido oposto)</td><td className="p-3 border-b border-slate-200">Módulo da velocidade diminui</td></tr>
                      <tr className="bg-white"><td className="p-3 border-b border-slate-200">F perpendicular a v</td><td className="p-3 border-b border-slate-200"><MathFormula formula="\vec{F}_{\text{res}} \perp \vec{v}" /></td><td className="p-3 border-b border-slate-200">Direção da velocidade muda (MCU)</td></tr>
                      <tr className="bg-slate-50"><td className="p-3">Normal nula</td><td className="p-3"><MathFormula formula="a = g" /> (queda livre)</td><td className="p-3">Ausência aparente de peso</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-slate-900 rounded-xl p-5">
                    <p className="text-indigo-400 font-bold mb-2">Gráfico <MathFormula formula="F_{\text{res}} \times a" /></p>
                    <p className="text-slate-300 text-sm mb-3">Reta passando pela origem. O coeficiente angular é a massa:</p>
                    <div className="bg-black/50 rounded-lg p-3 text-center">
                      <MathFormula formula="m = \frac{\Delta F_{\text{res}}}{\Delta a}" display={true} />
                    </div>
                  </div>
                  <div className="bg-slate-900 rounded-xl p-5">
                    <p className="text-green-400 font-bold mb-2">Gráfico <MathFormula formula="v \times t" /></p>
                    <p className="text-slate-300 text-sm mb-3">A inclinação representa a aceleração:</p>
                    <div className="bg-black/50 rounded-lg p-3 text-center">
                      <MathFormula formula="a = \frac{\Delta v}{\Delta t}" display={true} />
                    </div>
                    <p className="text-slate-400 text-xs mt-2">Inclinação nula: a = 0, logo F_res = 0.</p>
                  </div>
                </div>

                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-xl">
                  <p className="font-bold text-indigo-800 mb-1">A Ponte Dinâmica ↔ Cinemática</p>
                  <p className="text-slate-700 text-sm">Se a questão dá força → você acha aceleração (<MathFormula formula="a = F/m" />) → usa Cinemática. Se a questão dá gráfico v×t → você acha aceleração (inclinação) → usa Dinâmica (<MathFormula formula="F = ma" />). Essa transição é muito comum em provas fortes.</p>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* ===== ABA EXEMPLOS ===== */}
        {activeTab === "exemplos" && (
          <div className="space-y-6">
            <p className="text-slate-600 text-sm">Clique em cada exemplo para ver a resolução completa.</p>

            {[
              {
                id: "ex1",
                title: "Exemplo 1 — Bloco em Superfície Horizontal Sem Atrito",
                enunciado: "Um bloco de massa m = 5 kg está sobre uma superfície horizontal sem atrito. Uma força horizontal constante de módulo F = 20 N puxa o bloco para a direita. Determine a aceleração do bloco.",
                content: (
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="font-semibold text-slate-700 text-sm mb-2">Eixo x — Aceleração</p>
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="F = ma \implies 20 = 5a \implies a = 4 \text{ m/s}^2" display={true} />
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="font-bold text-green-800">Resposta: <MathFormula formula="a = 4 \text{ m/s}^2" /></p>
                    </div>
                  </div>
                )
              },
              {
                id: "ex2",
                title: "Exemplo 2 — Bloco com Atrito Cinético",
                enunciado: "Um bloco de massa m = 10 kg está sobre uma superfície horizontal. Uma força F = 50 N puxa o bloco. O coeficiente de atrito cinético é μc = 0,2. Considere g = 10 m/s². Determine a aceleração.",
                content: (
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="font-semibold text-slate-700 text-sm mb-2">Normal e Atrito</p>
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="N = 100 \text{ N} \quad f_c = 0{,}2 \cdot 100 = 20 \text{ N}" display={true} />
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="font-semibold text-slate-700 text-sm mb-2">Eixo x</p>
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="50 - 20 = 10a \implies a = 3 \text{ m/s}^2" display={true} />
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="font-bold text-green-800">Resposta: <MathFormula formula="a = 3 \text{ m/s}^2" /></p>
                    </div>
                  </div>
                )
              },
              {
                id: "ex3",
                title: "Exemplo 3 — Plano Inclinado Sem Atrito",
                enunciado: "Um bloco está sobre um plano inclinado sem atrito, com ângulo θ = 30°. Considere g = 10 m/s². Determine a aceleração do bloco ao longo do plano.",
                content: (
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="a = g\sin\theta = 10 \cdot \sin 30° = 5 \text{ m/s}^2" display={true} />
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="font-bold text-green-800">Resposta: <MathFormula formula="a = 5 \text{ m/s}^2" /></p>
                      <p className="text-slate-600 text-sm mt-1">Sem atrito, a aceleração não depende da massa.</p>
                    </div>
                  </div>
                )
              },
              {
                id: "ex4",
                title: "Exemplo 4 — Plano Inclinado Com Atrito",
                enunciado: "Um bloco desce um plano inclinado de ângulo θ = 37°. O coeficiente de atrito cinético é μc = 0,25. Considere g = 10 m/s², sin 37° = 0,6 e cos 37° = 0,8. Determine a aceleração.",
                content: (
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="a = g(\sin\theta - \mu_c\cos\theta) = 10(0{,}6 - 0{,}25 \cdot 0{,}8) = 4 \text{ m/s}^2" display={true} />
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="font-bold text-green-800">Resposta: <MathFormula formula="a = 4 \text{ m/s}^2" /></p>
                    </div>
                  </div>
                )
              },
              {
                id: "ex5",
                title: "Exemplo 5 — Sistema de Dois Blocos",
                enunciado: "Dois blocos, m₁ = 2 kg e m₂ = 3 kg, estão em contato sobre uma superfície horizontal sem atrito. Uma força F = 20 N empurra m₁. Determine: a) a aceleração do sistema; b) a força de contato entre os blocos.",
                content: (
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="font-semibold text-slate-700 text-sm mb-2">a) Sistema completo</p>
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="a = \frac{20}{2+3} = 4 \text{ m/s}^2" display={true} />
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="font-semibold text-slate-700 text-sm mb-2">b) Isolando m₂</p>
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="C = 3 \cdot 4 = 12 \text{ N}" display={true} />
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="font-bold text-green-800">Respostas: <MathFormula formula="a = 4 \text{ m/s}^2" /> e <MathFormula formula="C = 12 \text{ N}" /></p>
                    </div>
                  </div>
                )
              },
              {
                id: "ex6",
                title: "Exemplo 6 — Máquina de Atwood",
                enunciado: "Dois blocos m₁ = 2 kg e m₂ = 3 kg estão ligados por fio ideal em polia ideal. Considere g = 10 m/s². Determine a aceleração e a tração.",
                content: (
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="font-semibold text-slate-700 text-sm mb-2">Aceleração</p>
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="a = \frac{(3-2) \cdot 10}{3+2} = 2 \text{ m/s}^2" display={true} />
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="font-semibold text-slate-700 text-sm mb-2">Tração</p>
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="T = m_1(g+a) = 2(10+2) = 24 \text{ N}" display={true} />
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="font-bold text-green-800">Respostas: <MathFormula formula="a = 2 \text{ m/s}^2" /> e <MathFormula formula="T = 24 \text{ N}" /></p>
                      <p className="text-slate-600 text-sm mt-1">A tração não é igual ao peso de nenhum dos blocos — ambos estão acelerando.</p>
                    </div>
                  </div>
                )
              },
              {
                id: "ex7",
                title: "Exemplo 7 — Elevador Acelerado",
                enunciado: "Uma pessoa de massa m = 70 kg está dentro de um elevador que acelera para cima com a = 2 m/s². Considere g = 10 m/s². Determine a força normal exercida pelo piso sobre a pessoa.",
                content: (
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="N = m(g+a) = 70(10+2) = 840 \text{ N}" display={true} />
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="font-bold text-green-800">Resposta: <MathFormula formula="N = 840 \text{ N}" /></p>
                      <p className="text-slate-600 text-sm mt-1">O peso real é 700 N, mas a normal é 840 N — a pessoa sente-se mais pesada.</p>
                    </div>
                  </div>
                )
              },
              {
                id: "ex8",
                title: "Exemplo 8 — Ação e Reação, Normal e Peso",
                enunciado: "Um livro de massa m = 2 kg está parado sobre uma mesa horizontal. Considere g = 10 m/s². Determine a normal sobre o livro e identifique corretamente os pares de ação e reação.",
                content: (
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="bg-slate-900 rounded-lg p-3 text-center">
                        <MathFormula formula="N = mg = 2 \cdot 10 = 20 \text{ N}" display={true} />
                      </div>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                      <p className="font-bold text-rose-800 mb-2">Pares de Ação e Reação Corretos</p>
                      <p className="text-slate-700 text-sm mb-1"><strong>Par 1:</strong> Peso da Terra sobre o livro ↔ Peso do livro sobre a Terra</p>
                      <p className="text-slate-700 text-sm"><strong>Par 2:</strong> Normal da mesa sobre o livro ↔ Normal do livro sobre a mesa</p>
                    </div>
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                      <p className="text-red-700 text-sm"><strong>Peso e normal NÃO são par de ação e reação</strong> — eles atuam no mesmo corpo (o livro). Pares de ação e reação atuam em corpos diferentes.</p>
                    </div>
                  </div>
                )
              },
            ].map(ex => (
              <div key={ex.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
                <button
                  onClick={() => toggleExample(ex.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800">{ex.title}</h3>
                    <p className="text-slate-500 text-sm mt-1">{ex.enunciado}</p>
                  </div>
                  {openExamples[ex.id] ? <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" /> : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" />}
                </button>
                {openExamples[ex.id] && (
                  <div className="px-6 pb-6 border-t border-slate-100 pt-4">
                    {ex.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ===== ABA RESUMO ===== */}
        {activeTab === "resumo" && (
          <div className="space-y-8">

            <section className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
              <div className="bg-gradient-to-r from-red-600 to-rose-700 px-8 py-5">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Armadilhas e Erros Comuns</h2>
                </div>
              </div>
              <div className="p-8 space-y-4">
                {[
                  { title: "Força mantém movimento", text: "Força resultante não mantém movimento — ela altera movimento. Corpo em MRU tem força resultante nula." },
                  { title: "Confundir força resultante com força aplicada", text: "Se F_aplicada = 40 N e atrito = 15 N, a força resultante é 25 N. A aceleração vem dos 25 N, não dos 40 N." },
                  { title: "Confundir massa com peso", text: "Massa em kg. Peso em N. Um corpo de 10 kg tem peso P = 100 N (com g = 10 m/s²)." },
                  { title: "Normal sempre vale mg", text: "A normal só vale mg em superfície horizontal sem aceleração. Em plano inclinado: N = mg·cos θ. Em elevador: N = m(g±a)." },
                  { title: "Peso e normal são ação e reação", text: "Não são! Ambos atuam no mesmo corpo. Ação e reação atuam em corpos diferentes." },
                  { title: "Colocar ação e reação no mesmo DCL", text: "No DCL de um corpo, desenhe apenas as forças que atuam naquele corpo. Nunca a força que ele exerce em outro." },
                  { title: "Usar fe = μe·N sempre", text: "A relação geral é fe ≤ μe·N. A igualdade só ocorre na iminência de escorregamento." },
                  { title: "Esquecer que aceleração é vetorial", text: "Um carro em curva com rapidez constante tem aceleração — a direção da velocidade muda." },
                ].map((trap, i) => (
                  <div key={i} className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-xl">
                    <p className="font-bold text-red-800 text-sm mb-1">{trap.title}</p>
                    <p className="text-slate-700 text-sm">{trap.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
              <div className="bg-gradient-to-r from-indigo-700 to-purple-800 px-8 py-5">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Sequência Segura para Qualquer Problema</h2>
                </div>
              </div>
              <div className="p-8">
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                  <ol className="space-y-2">
                    {["Escolha o corpo ou sistema.", "Faça o DCL.", "Escolha eixos convenientes.", "Escreva ΣF = ma em cada eixo.", "Escreva os vínculos geométricos.", "Resolva o sistema de equações.", "Verifique se o resultado faz sentido físico."].map((s, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                        <span className="text-slate-700 text-sm">{s}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="text-red-700 text-sm mt-4 font-semibold">Pular o DCL é pedir para errar com confiança.</p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
              <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-8 py-5">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Resumo das Fórmulas</h2>
                </div>
              </div>
              <div className="p-8 space-y-5">
                <div className="bg-slate-900 rounded-xl p-6 text-center">
                  <p className="text-amber-400 font-bold text-lg mb-3">A Ideia Central da Dinâmica</p>
                  <p className="text-white text-xl font-semibold">Força resultante não mantém movimento.</p>
                  <p className="text-white text-xl font-semibold">Força resultante <span className="text-green-400">altera</span> movimento.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="p-3 text-left rounded-tl-lg">Lei</th>
                        <th className="p-3 text-left">Enunciado</th>
                        <th className="p-3 text-center">Fórmula</th>
                        <th className="p-3 text-left rounded-tr-lg">Condição</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-slate-50">
                        <td className="p-3 border-b border-slate-200 font-semibold">1ª Lei</td>
                        <td className="p-3 border-b border-slate-200">Inércia</td>
                        <td className="p-3 border-b border-slate-200 text-center"><MathFormula formula="\vec{F}_{\text{res}} = \vec{0} \Rightarrow \vec{a} = \vec{0}" /></td>
                        <td className="p-3 border-b border-slate-200">Repouso ou MRU</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="p-3 border-b border-slate-200 font-semibold">2ª Lei</td>
                        <td className="p-3 border-b border-slate-200">Princípio Fundamental</td>
                        <td className="p-3 border-b border-slate-200 text-center"><MathFormula formula="\vec{F}_{\text{res}} = m\vec{a}" /></td>
                        <td className="p-3 border-b border-slate-200">Referencial inercial</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="p-3 font-semibold">3ª Lei</td>
                        <td className="p-3">Ação e Reação</td>
                        <td className="p-3 text-center"><MathFormula formula="\vec{F}_{A \to B} = -\vec{F}_{B \to A}" /></td>
                        <td className="p-3">Corpos diferentes</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="p-3 text-left rounded-tl-lg">Força</th>
                        <th className="p-3 text-center">Fórmula Geral</th>
                        <th className="p-3 text-left rounded-tr-lg">Observação</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-slate-50"><td className="p-3 border-b border-slate-200">Peso</td><td className="p-3 border-b border-slate-200 text-center"><MathFormula formula="P = mg" /></td><td className="p-3 border-b border-slate-200">Aponta para baixo; depende do planeta</td></tr>
                      <tr className="bg-white"><td className="p-3 border-b border-slate-200">Normal</td><td className="p-3 border-b border-slate-200 text-center"><MathFormula formula="N = \text{pela 2ª Lei}" /></td><td className="p-3 border-b border-slate-200">Não é sempre mg</td></tr>
                      <tr className="bg-slate-50"><td className="p-3 border-b border-slate-200">Tração</td><td className="p-3 border-b border-slate-200 text-center"><MathFormula formula="T = \text{pela 2ª Lei}" /></td><td className="p-3 border-b border-slate-200">Não é sempre mg</td></tr>
                      <tr className="bg-white"><td className="p-3 border-b border-slate-200">Atrito Estático</td><td className="p-3 border-b border-slate-200 text-center"><MathFormula formula="f_e \leq \mu_e N" /></td><td className="p-3 border-b border-slate-200">Ajusta-se; igualdade só na iminência</td></tr>
                      <tr className="bg-slate-50"><td className="p-3">Atrito Cinético</td><td className="p-3 text-center"><MathFormula formula="f_c = \mu_c N" /></td><td className="p-3">Valor fixo durante o deslizamento</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

          </div>
        )}

      </main>
    </div>
  );
}
