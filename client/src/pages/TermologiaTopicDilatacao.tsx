import { Link } from "wouter";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MathFormula } from "@/components/MathFormula";

export default function TermologiaTopicDilatacao() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-slate-50 to-green-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/termologia">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-lime-600 to-green-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Dilatação Térmica</h1>
              <p className="text-xs text-slate-600">Termologia</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Introdução */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">📏 O que é Dilatação Térmica?</h2>
          <p className="text-lg text-slate-700 leading-relaxed mb-6">
            Dilatação térmica é o <strong>aumento de volume de um corpo quando sua temperatura aumenta</strong>. Quando as moléculas se movem mais rápido (temperatura maior), elas ocupam mais espaço, fazendo o corpo expandir. É por isso que os trilhos de trem têm espaços entre eles!
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-slate-700">
              <strong>Analogia:</strong> Pense em um estacionamento lotado. Quando as pessoas (moléculas) começam a se mover mais (temperatura aumenta), elas precisam de mais espaço, e o "volume" do grupo aumenta.
            </p>
          </div>
        </div>

        {/* Tipos de Dilatação */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">📊 Tipos de Dilatação</h2>
          
          <div className="space-y-6">
            {/* Dilatação Linear */}
            <div className="border-l-4 border-red-500 pl-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-3">1. Dilatação Linear</h3>
              <p className="text-slate-700 mb-4">
                Ocorre quando consideramos apenas uma dimensão (comprimento). É usada para fios, barras e trilhos.
              </p>
              <div className="bg-gradient-to-r from-red-100 to-orange-100 border-2 border-red-400 rounded-lg p-6 mb-4">
                <MathFormula formula={String.raw`$$\Delta L = L_0 \cdot \alpha \cdot \Delta T$$`} className="text-center text-lg mb-2" />
                <div className="text-center text-sm text-slate-700">
                  <p><strong>ΔL:</strong> Variação de comprimento (em m)</p>
                  <p><strong>L₀:</strong> Comprimento inicial (em m)</p>
                  <p><strong>α:</strong> Coeficiente de dilatação linear (em K⁻¹)</p>
                  <p><strong>ΔT:</strong> Variação de temperatura (em K)</p>
                </div>
              </div>
            </div>

            {/* Dilatação Superficial */}
            <div className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-3">2. Dilatação Superficial</h3>
              <p className="text-slate-700 mb-4">
                Ocorre quando consideramos duas dimensões (área). É usada para placas e superfícies.
              </p>
              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-blue-400 rounded-lg p-6 mb-4">
                <MathFormula formula={String.raw`$$\Delta A = A_0 \cdot \beta \cdot \Delta T$$`} className="text-center text-lg mb-2" />
                <div className="text-center text-sm text-slate-700">
                  <p><strong><MathFormula formula={String.raw`$\beta = 2\alpha$`} /></strong> (coeficiente de dilatação superficial)</p>
                </div>
              </div>
            </div>

            {/* Dilatação Volumétrica */}
            <div className="border-l-4 border-green-500 pl-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-3">3. Dilatação Volumétrica</h3>
              <p className="text-slate-700 mb-4">
                Ocorre quando consideramos três dimensões (volume). É usada para sólidos e líquidos.
              </p>
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 rounded-lg p-6 mb-4">
                <MathFormula formula={String.raw`$$\Delta V = V_0 \cdot \gamma \cdot \Delta T$$`} className="text-center text-lg mb-2" />
                <div className="text-center text-sm text-slate-700">
                  <p><strong><MathFormula formula={String.raw`$\gamma = 3\alpha$`} /></strong> (coeficiente de dilatação volumétrica)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coeficientes de Dilatação */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">📋 Coeficientes de Dilatação Linear</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-slate-700">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="text-left p-2">Material</th>
                  <th className="text-left p-2">α (×10⁻⁶ K⁻¹)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="p-2">Alumínio</td>
                  <td className="p-2">23</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2">Ferro</td>
                  <td className="p-2">12</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2">Cobre</td>
                  <td className="p-2">17</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2">Vidro</td>
                  <td className="p-2">8</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2">Invar (liga Fe-Ni)</td>
                  <td className="p-2">0,9</td>
                </tr>
                <tr>
                  <td className="p-2">Água (líquida)</td>
                  <td className="p-2">207</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-6">
            <p className="text-yellow-900">
              <strong>Curiosidade:</strong> O Invar é uma liga especial que quase não dilata! É usada em instrumentos de precisão e relógios.
            </p>
          </div>
        </div>

        {/* Exemplos Práticos */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">📝 Exemplos Práticos</h2>
          
          <div className="space-y-6">
            {/* Exemplo 1 */}
            <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-500">
              <h4 className="font-bold text-slate-900 mb-3">Exemplo 1: Dilatação Linear</h4>
              <p className="text-slate-700 mb-3">
                <strong>Problema:</strong> Um trilho de ferro tem 100 m de comprimento a 20°C. Qual será seu comprimento a 40°C?
              </p>
              <div className="bg-white p-4 rounded">
                <p className="text-slate-700 mb-2"><strong>Dados:</strong></p>
                <p className="text-slate-600"><MathFormula formula={String.raw`$L_0 = 100 \text{ m}$`} /></p>
                <p className="text-slate-600"><MathFormula formula={String.raw`$\alpha = 12 \times 10^{-6} \text{ K}^{-1}$`} /></p>
                <p className="text-slate-600"><MathFormula formula={String.raw`$\Delta T = 40 - 20 = 20 \text{ K}$`} /></p>
                <p className="text-slate-700 mt-3 mb-2"><strong>Cálculo:</strong></p>
                <p className="text-slate-600"><MathFormula formula={String.raw`$\Delta L = 100 \cdot 12 \cdot 10^{-6} \cdot 20 = 0,024 \text{ m} = 2,4 \text{ cm}$`} /></p>
                <p className="text-slate-600 mt-2"><strong>Comprimento final:</strong> <MathFormula formula={String.raw`$L = 100 + 0,024 = 100,024 \text{ m}$`} /></p>
              </div>
            </div>

            {/* Exemplo 2 */}
            <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
              <h4 className="font-bold text-slate-900 mb-3">Exemplo 2: Dilatação Volumétrica</h4>
              <p className="text-slate-700 mb-3">
                <strong>Problema:</strong> Um cubo de alumínio tem 1 m³ a 25°C. Qual será seu volume a 100°C?
              </p>
              <div className="bg-white p-4 rounded">
                <p className="text-slate-700 mb-2"><strong>Dados:</strong></p>
                <p className="text-slate-600"><MathFormula formula={String.raw`$V_0 = 1 \text{ m}^3$`} /></p>
                <p className="text-slate-600"><MathFormula formula={String.raw`$\alpha = 23 \times 10^{-6} \text{ K}^{-1} \Rightarrow \gamma = 3\alpha = 69 \times 10^{-6} \text{ K}^{-1}$`} /></p>
                <p className="text-slate-600"><MathFormula formula={String.raw`$\Delta T = 100 - 25 = 75 \text{ K}$`} /></p>
                <p className="text-slate-700 mt-3 mb-2"><strong>Cálculo:</strong></p>
                <p className="text-slate-600"><MathFormula formula={String.raw`$\Delta V = 1 \cdot 69 \cdot 10^{-6} \cdot 75 = 0,005175 \text{ m}^3$`} /></p>
                <p className="text-slate-600 mt-2"><strong>Volume final:</strong> <MathFormula formula={String.raw`$V = 1 + 0,005175 = 1,005175 \text{ m}^3$`} /></p>
              </div>
            </div>
          </div>
        </div>

        {/* Aplicações Práticas */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">🏗️ Aplicações Práticas</h2>
          
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded border-l-4 border-slate-400">
              <p className="text-slate-700"><strong>Trilhos de trem:</strong> Têm espaços entre eles para permitir dilatação sem danificar a estrutura.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded border-l-4 border-slate-400">
              <p className="text-slate-700"><strong>Pontes:</strong> Possuem juntas de dilatação para absorver a expansão térmica.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded border-l-4 border-slate-400">
              <p className="text-slate-700"><strong>Fios de eletricidade:</strong> Ficam mais compridos no calor, por isso precisam de folga.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded border-l-4 border-slate-400">
              <p className="text-slate-700"><strong>Termômetros:</strong> Funcionam porque o mercúrio dilata com a temperatura!</p>
            </div>
          </div>
        </div>

        {/* Erros Comuns */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-yellow-900 mb-4">⚠️ Erros Comuns</h3>
          <ul className="space-y-3 text-yellow-900">
            <li className="flex gap-3">
              <span className="font-bold">❌</span>
              <span><strong>Confundir α, β e γ:</strong> Linear usa α; superficial usa β = 2α; volumétrica usa γ = 3α.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">❌</span>
              <span><strong>Esquecer que α é muito pequeno:</strong> Geralmente está em 10⁻⁶! Não esqueça a potência de 10.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">❌</span>
              <span><strong>Usar ΔT em Celsius em vez de Kelvin:</strong> Para ΔT, tanto faz, mas verifique a unidade de α.</span>
            </li>
          </ul>
        </div>

        {/* Dicas Práticas */}
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-green-900 mb-4">💡 Dicas Práticas</h3>
          <ul className="space-y-3 text-green-900">
            <li className="flex gap-3">
              <span className="font-bold">✅</span>
              <span><strong>Memorize a relação:</strong> β = 2α e γ = 3α. Assim você só precisa memorizar α!</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">✅</span>
              <span><strong>Pense em dimensões:</strong> 1D (linear) → 2D (superficial) → 3D (volumétrica).</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">✅</span>
              <span><strong>Água é especial:</strong> Tem dilatação anômala! Expande ao congelar (por isso o gelo flutua).</span>
            </li>
          </ul>
        </div>

        {/* Próximos Passos */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-blue-900 mb-4">🚀 Próximos Passos</h3>
          <p className="text-blue-900 mb-4">Parabéns! Você completou todos os tópicos de Termologia. Agora:</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/termologia/graphs">
              <Button className="bg-blue-600 hover:bg-blue-700">Ver Gráficos</Button>
            </Link>
            <Link href="/termologia/quiz">
              <Button variant="outline">Fazer Quiz</Button>
            </Link>
            <Link href="/termologia/simulator">
              <Button variant="outline">Usar Simulador</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p>© 2026 Projeto Vetor. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
