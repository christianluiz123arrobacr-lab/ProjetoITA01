import { Link } from "wouter";
import { ArrowLeft, BookOpen, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MathFormula } from "@/components/MathFormula";

export default function TermologiaTopicCalorimetria() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-slate-50 to-orange-50">
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
            <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Calorimetria</h1>
              <p className="text-xs text-slate-600">Termologia - Calor Sensível e Latente</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        
        {/* Seção 0: Introdução */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-bold text-lg">0</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Introdução: Os Dois Tipos de Calor</h2>
          </div>

          <p className="text-lg text-slate-700 leading-relaxed mb-6">
            Quando você aquece água em uma panela, duas coisas diferentes podem acontecer:
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
            <p className="text-slate-700 mb-2">
              <strong>1. Calor Sensível:</strong> A temperatura da água sobe (você sente o calor). A água permanece líquida, mas fica mais quente.
            </p>
            <p className="text-slate-700">
              <strong>2. Calor Latente:</strong> A água começa a fervir (100°C) e se transforma em vapor. A temperatura não muda, mas a água muda de estado.
            </p>
          </div>

          <p className="text-slate-700">
            A <strong>Calorimetria</strong> é a ciência que estuda e calcula esses dois tipos de transferência de calor. Ela responde perguntas como: "Quanto calor preciso para aquecer 1 litro de água de 20°C para 80°C?" ou "Quanto calor preciso para transformar gelo em vapor?"
          </p>
        </div>

        {/* Seção 1: Calor Sensível */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-bold text-lg">1</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Calor Sensível: Q = mcΔT</h2>
          </div>

          <p className="text-slate-700 mb-6">
            <strong>Calor sensível</strong> é aquele que você consegue "sentir" - ele muda a temperatura de um corpo sem mudar seu estado físico. É o calor que sobe o termômetro.
          </p>

          {/* Contexto Histórico */}
          <div className="bg-amber-50 border-l-4 border-amber-600 p-6 rounded-lg mb-6">
            <h4 className="font-bold text-amber-900 mb-3">📜 Contexto Histórico</h4>
            <p className="text-amber-900 text-sm leading-relaxed">
              Em 1760, o físico escocês <strong>Joseph Black</strong> revolucionou a compreensão do calor ao distinguir entre "quantidade de calor" (o que hoje chamamos de calor sensível) e "intensidade de calor" (temperatura). Ele descobriu que diferentes materiais requerem diferentes quantidades de calor para variar sua temperatura na mesma quantidade - nasceu o conceito de <strong>capacidade térmica específica</strong>. Essa descoberta foi fundamental para a termodinâmica moderna.
            </p>
          </div>

          {/* Fórmula */}
          <div className="bg-slate-900 text-white rounded-lg p-6 mb-6">
            <MathFormula formula={String.raw`$$Q = m \cdot c \cdot \Delta T$$`} className="text-center text-2xl mb-4" />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 p-3 rounded">
                <p className="text-sm text-slate-300">Q: Calor sensível</p>
                <p className="text-slate-400">Unidade: Joule (J)</p>
              </div>
              <div className="bg-slate-800 p-3 rounded">
                <p className="text-sm text-slate-300">m: Massa do corpo</p>
                <p className="text-slate-400">Unidade: kg</p>
              </div>
              <div className="bg-slate-800 p-3 rounded">
                <p className="text-sm text-slate-300">c: Calor específico</p>
                <p className="text-slate-400">Unidade: J/(kg·°C)</p>
              </div>
              <div className="bg-slate-800 p-3 rounded">
                <p className="text-sm text-slate-300">ΔT: Variação de temperatura</p>
                <p className="text-slate-400">Unidade: °C ou K</p>
              </div>
            </div>
          </div>

          {/* Explicação Simples */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
            <h4 className="font-bold text-blue-900 mb-3">🔍 Entendendo a Fórmula</h4>
            <p className="text-blue-900 text-sm mb-3">
              A fórmula diz que o calor necessário é <strong>proporcional a três coisas</strong>:
            </p>
            <ul className="text-blue-900 text-sm space-y-2">
              <li><strong>• Massa (m):</strong> Quanto mais água você quer aquecer, mais calor precisa. Dobrar a massa = dobrar o calor.</li>
              <li><strong>• Calor específico (c):</strong> Cada material é diferente. Água precisa de muito calor (4.186 J/kg·°C), mas ferro precisa de pouco (450 J/kg·°C).</li>
              <li><strong>• Variação de temperatura (ΔT):</strong> Quanto maior a diferença entre temperatura inicial e final, mais calor é necessário.</li>
            </ul>
          </div>

          {/* Capacidade Térmica */}
          <div className="bg-white border-2 border-slate-300 p-6 rounded-lg mb-6">
            <h4 className="font-bold text-slate-900 mb-3">⚡ Capacidade Térmica vs Calor Específico</h4>
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded">
                <p className="text-sm text-slate-700"><strong>Calor Específico (c):</strong> Quantidade de calor por unidade de massa. <MathFormula formula={String.raw`$c = \frac{Q}{m \cdot \Delta T}$`} /> (J/kg·°C)</p>
              </div>
              <div className="bg-slate-50 p-3 rounded">
                <p className="text-sm text-slate-700"><strong>Capacidade Térmica (C):</strong> Quantidade de calor para variar 1°C de todo o objeto. <MathFormula formula={String.raw`$C = m \cdot c = \frac{Q}{\Delta T}$`} /> (J/°C)</p>
              </div>
            </div>
          </div>

          {/* Aprofundamento: Capacidade Térmica vs Calor Específico */}
          <div className="bg-purple-50 border-l-4 border-purple-600 p-6 rounded-lg mb-6">
            <h4 className="font-bold text-purple-900 mb-4">🔬 Aprofundamento: Capacidade Térmica (C) vs Calor Específico (c)</h4>
            <p className="text-purple-900 text-sm mb-4">
              Esses dois conceitos são frequentemente confundidos, mas são <strong>fundamentalmente diferentes</strong>. Vamos entender a distinção:
            </p>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border-l-4 border-blue-500">
                <p className="text-sm text-slate-700 mb-2"><strong>Calor Específico (c):</strong> Quantidade de calor necessária para elevar a temperatura de <strong>1 kg</strong> de uma substância em <strong>1°C</strong>.</p>
                <p className="text-xs text-slate-600">Unidade: J/(kg·°C) ou J/(kg·K)</p>
                <p className="text-xs text-slate-600 mt-1"><strong>Propriedade do material:</strong> Cada material tem seu próprio c. A água sempre tem c = 4.186 J/(kg·°C), independentemente da quantidade.</p>
              </div>
              
              <div className="bg-white p-4 rounded border-l-4 border-green-500">
                <p className="text-sm text-slate-700 mb-2"><strong>Capacidade Térmica (C):</strong> Quantidade de calor necessária para elevar a temperatura de <strong>um objeto específico</strong> em <strong>1°C</strong>.</p>
                <p className="text-xs text-slate-600">Unidade: J/°C ou J/K</p>
                <p className="text-xs text-slate-600 mt-1"><strong>Propriedade do objeto:</strong> Depende da massa E do material. 1 litro de água tem C diferente de 2 litros de água.</p>
              </div>
            </div>
          </div>

          {/* Relação Matemática */}
          <div className="bg-slate-900 text-white rounded-lg p-6 mb-6">
            <h4 className="font-bold text-white mb-4">📐 Relação Matemática entre C e c</h4>
            <MathFormula formula={String.raw`$$C = m \cdot c$$`} className="text-center text-2xl mb-4" />
            
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-slate-800 p-3 rounded">
                <p className="text-slate-300">C: Capacidade Térmica</p>
                <p className="text-slate-400">J/°C</p>
              </div>
              <div className="bg-slate-800 p-3 rounded">
                <p className="text-slate-300">m: Massa</p>
                <p className="text-slate-400">kg</p>
              </div>
              <div className="bg-slate-800 p-3 rounded">
                <p className="text-slate-300">c: Calor Específico</p>
                <p className="text-slate-400">J/(kg·°C)</p>
              </div>
            </div>
            
            <p className="text-slate-300 text-sm mt-4 text-center">
              <strong>Interpretação:</strong> A capacidade térmica é o calor específico multiplicado pela massa. Quanto mais massa, maior a capacidade térmica.
            </p>
          </div>

          {/* Exemplos Práticos de Distinção */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
            <h4 className="font-bold text-blue-900 mb-3">💡 Exemplos Práticos da Distinção</h4>
            <div className="space-y-3 text-blue-900 text-sm">
              <div className="bg-white p-3 rounded">
                <p className="font-bold">Exemplo 1: Dois copos de água</p>
                <p>• Copo A: 100 mL de água → c = 4.186 J/(kg·°C), C ≈ 418,6 J/°C</p>
                <p>• Copo B: 200 mL de água → c = 4.186 J/(kg·°C), C ≈ 837,2 J/°C</p>
                <p className="text-xs mt-1"><strong>Conclusão:</strong> O calor específico é igual, mas a capacidade térmica é diferente! O copo B precisa de mais calor para aumentar 1°C.</p>
              </div>
              
              <div className="bg-white p-3 rounded">
                <p className="font-bold">Exemplo 2: Água vs Ferro (mesma massa)</p>
                <p>• 1 kg de água → c = 4.186 J/(kg·°C), C = 4.186 J/°C</p>
                <p>• 1 kg de ferro → c = 450 J/(kg·°C), C = 450 J/°C</p>
                <p className="text-xs mt-1"><strong>Conclusão:</strong> A capacidade térmica é diferente porque o calor específico é diferente! A água precisa de muito mais calor para aumentar 1°C.</p>
              </div>
            </div>
          </div>

          {/* Fórmulas Equivalentes */}
          <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-lg mb-6">
            <h4 className="font-bold text-green-900 mb-4">🔄 Fórmulas Equivalentes para Calor Sensível</h4>
            <p className="text-green-900 text-sm mb-3">Existem duas formas de calcular o calor sensível, dependendo se você conhece c ou C:</p>
            
            <div className="space-y-3">
              <div className="bg-white p-3 rounded">
                <p className="text-sm text-slate-700 mb-1"><strong>Forma 1 (usando calor específico):</strong></p>
                <MathFormula formula={String.raw`$Q = m \cdot c \cdot \Delta T$`} className="text-center" />
              </div>
              
              <div className="bg-white p-3 rounded">
                <p className="text-sm text-slate-700 mb-1"><strong>Forma 2 (usando capacidade térmica):</strong></p>
                <MathFormula formula={String.raw`$Q = C \cdot \Delta T$`} className="text-center" />
              </div>
              
              <div className="bg-white p-3 rounded">
                <p className="text-sm text-slate-700 mb-1"><strong>Demonstração que são equivalentes:</strong></p>
                <p className="text-xs text-slate-600">Substituindo <MathFormula formula={String.raw`$C = m \cdot c$`} /> na Forma 2:</p>
                <MathFormula formula={String.raw`$Q = (m \cdot c) \cdot \Delta T = m \cdot c \cdot \Delta T$`} className="text-center" />
                <p className="text-xs text-slate-600 mt-1">Obtemos a Forma 1! ✓</p>
              </div>
            </div>
          </div>

          {/* Tabela de Calores Específicos */}
          <div className="bg-slate-50 rounded-lg p-6 mb-6">
            <h4 className="font-bold text-slate-900 mb-4">📊 Calores Específicos de Materiais Comuns</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-200">
                    <th className="text-left p-3 font-bold text-slate-900">Material</th>
                    <th className="text-center p-3 font-bold text-slate-900">c (J/kg·°C)</th>
                    <th className="text-center p-3 font-bold text-slate-900">C para 1 kg (J/°C)</th>
                    <th className="text-left p-3 font-bold text-slate-900">Observação</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="bg-white border-b">
                    <td className="p-3 text-slate-700"><strong>Água</strong></td>
                    <td className="text-center p-3 text-slate-700">4.186</td>
                    <td className="text-center p-3 text-slate-700">4.186</td>
                    <td className="p-3 text-slate-600">Maior entre comuns - por isso aquece lentamente</td>
                  </tr>
                  <tr className="bg-blue-50 border-b">
                    <td className="p-3 text-slate-700"><strong>Ferro</strong></td>
                    <td className="text-center p-3 text-slate-700">450</td>
                    <td className="text-center p-3 text-slate-700">450</td>
                    <td className="p-3 text-slate-600">Aquece rápido - por isso panelas de ferro são eficientes</td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td className="p-3 text-slate-700"><strong>Cobre</strong></td>
                    <td className="text-center p-3 text-slate-700">385</td>
                    <td className="text-center p-3 text-slate-700">385</td>
                    <td className="p-3 text-slate-600">Excelente condutor térmico</td>
                  </tr>
                  <tr className="bg-blue-50 border-b">
                    <td className="p-3 text-slate-700"><strong>Vidro</strong></td>
                    <td className="text-center p-3 text-slate-700">840</td>
                    <td className="text-center p-3 text-slate-700">840</td>
                    <td className="p-3 text-slate-600">Isolante térmico moderado</td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td className="p-3 text-slate-700"><strong>Alumínio</strong></td>
                    <td className="text-center p-3 text-slate-700">897</td>
                    <td className="text-center p-3 text-slate-700">897</td>
                    <td className="p-3 text-slate-600">Bom condutor, usado em panelas</td>
                  </tr>
                  <tr className="bg-blue-50 border-b">
                    <td className="p-3 text-slate-700"><strong>Ouro</strong></td>
                    <td className="text-center p-3 text-slate-700">129</td>
                    <td className="text-center p-3 text-slate-700">129</td>
                    <td className="p-3 text-slate-600">Aquece muito rápido</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-3 text-slate-700"><strong>Chumbo</strong></td>
                    <td className="text-center p-3 text-slate-700">130</td>
                    <td className="text-center p-3 text-slate-700">130</td>
                    <td className="p-3 text-slate-600">Aquece muito rápido</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
              <p className="text-yellow-900 text-sm">
                <strong>Nota:</strong> A coluna "C para 1 kg" mostra a capacidade térmica se você tiver exatamente 1 kg do material. Para outras massas, multiplique c pela massa desejada.
              </p>
            </div>
          </div>

          {/* Dedução */}
          <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-lg">
            <h4 className="font-bold text-green-900 mb-4">📐 Dedução da Fórmula</h4>
            <div className="space-y-3 text-green-900 text-sm">
              <div className="bg-white p-3 rounded">
                <p><strong>Passo 1:</strong> Experimentalmente, observa-se que o calor é proporcional à massa: <MathFormula formula={String.raw`$Q \propto m$`} /></p>
              </div>
              <div className="bg-white p-3 rounded">
                <p><strong>Passo 2:</strong> O calor é proporcional à variação de temperatura: <MathFormula formula={String.raw`$Q \propto \Delta T$`} /></p>
              </div>
              <div className="bg-white p-3 rounded">
                <p><strong>Passo 3:</strong> Combinando: <MathFormula formula={String.raw`$Q \propto m \cdot \Delta T$`} /></p>
              </div>
              <div className="bg-white p-3 rounded">
                <p><strong>Passo 4:</strong> Introduzindo a constante de proporcionalidade (calor específico): <MathFormula formula={String.raw`$Q = m \cdot c \cdot \Delta T$`} /></p>
              </div>
            </div>
          </div>
        </div>

        {/* Seção 2: Calor Latente */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-bold text-lg">2</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Calor Latente: Q = mL</h2>
          </div>

          <p className="text-slate-700 mb-6">
            <strong>Calor latente</strong> é aquele que <strong>não muda a temperatura</strong>, mas muda o estado físico (sólido → líquido → gás). É "escondido" - você não sente pelo termômetro, mas a energia está sendo usada para quebrar as ligações moleculares.
          </p>

          {/* Contexto Histórico */}
          <div className="bg-amber-50 border-l-4 border-amber-600 p-6 rounded-lg mb-6">
            <h4 className="font-bold text-amber-900 mb-3">📜 Contexto Histórico</h4>
            <p className="text-amber-900 text-sm leading-relaxed">
              Joseph Black também descobriu o calor latente em 1760. Ele observou que quando gelo a 0°C recebe calor, sua temperatura não muda enquanto está derretendo - toda a energia vai para quebrar a estrutura cristalina do gelo. Esse conceito foi revolucionário porque mostrou que calor e temperatura não são a mesma coisa. O termo "latente" vem do latim "latens" (escondido), porque o calor está "escondido" na mudança de estado.
            </p>
          </div>

          {/* Fórmula */}
          <div className="bg-slate-900 text-white rounded-lg p-6 mb-6">
            <MathFormula formula={String.raw`$$Q = m \cdot L$$`} className="text-center text-2xl mb-4" />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 p-3 rounded">
                <p className="text-sm text-slate-300">Q: Calor latente</p>
                <p className="text-slate-400">Unidade: Joule (J)</p>
              </div>
              <div className="bg-slate-800 p-3 rounded">
                <p className="text-sm text-slate-300">m: Massa do corpo</p>
                <p className="text-slate-400">Unidade: kg</p>
              </div>
              <div className="bg-slate-800 p-3 rounded col-span-2">
                <p className="text-sm text-slate-300">L: Calor latente específico</p>
                <p className="text-slate-400">Unidade: J/kg (depende do tipo de mudança)</p>
              </div>
            </div>
          </div>

          {/* Explicação Simples */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
            <h4 className="font-bold text-blue-900 mb-3">🔍 Por Que a Temperatura Não Muda?</h4>
            <p className="text-blue-900 text-sm mb-3">
              Imagine as moléculas de água como pessoas em um salão de baile (líquido). Quando você aquece com calor sensível, elas dançam mais rápido (temperatura sobe). Mas quando chega a hora de sair do salão (mudança de estado), elas precisam quebrar as correntes que as prendem à porta. Todo o calor vai para quebrar essas correntes, não para dançar mais rápido. Por isso a temperatura fica constante durante a mudança de estado.
            </p>
          </div>

          {/* Tipos de Mudança de Estado */}
          <div className="bg-slate-50 rounded-lg p-6 mb-6">
            <h4 className="font-bold text-slate-900 mb-4">🔄 Tipos de Mudança de Estado</h4>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded border-l-4 border-blue-500">
                <p className="text-slate-700 mb-1"><strong>Fusão (Sólido → Líquido):</strong> Gelo derretendo em água</p>
                <p className="text-slate-600 text-sm">Calor latente de fusão da água: 334.000 J/kg (a 0°C)</p>
              </div>
              <div className="bg-white p-4 rounded border-l-4 border-red-500">
                <p className="text-slate-700 mb-1"><strong>Vaporização (Líquido → Gás):</strong> Água fervendo em vapor</p>
                <p className="text-slate-600 text-sm">Calor latente de vaporização da água: 2.260.000 J/kg (a 100°C)</p>
              </div>
              <div className="bg-white p-4 rounded border-l-4 border-cyan-500">
                <p className="text-slate-700 mb-1"><strong>Sublimação (Sólido → Gás):</strong> Gelo virar vapor direto</p>
                <p className="text-slate-600 text-sm">Calor latente de sublimação da água: 2.594.000 J/kg</p>
              </div>
              <div className="bg-white p-4 rounded border-l-4 border-purple-500">
                <p className="text-slate-700 mb-1"><strong>Condensação (Gás → Líquido):</strong> Vapor virando água</p>
                <p className="text-slate-600 text-sm">Libera 2.260.000 J/kg (inverso da vaporização)</p>
              </div>
              <div className="bg-white p-4 rounded border-l-4 border-green-500">
                <p className="text-slate-700 mb-1"><strong>Solidificação (Líquido → Sólido):</strong> Água congelando</p>
                <p className="text-slate-600 text-sm">Libera 334.000 J/kg (inverso da fusão)</p>
              </div>
            </div>
          </div>

          {/* Tabela de Calores Latentes */}
          <div className="bg-slate-50 rounded-lg p-6">
            <h4 className="font-bold text-slate-900 mb-4">📊 Calores Latentes Específicos</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-200">
                    <th className="text-left p-3 font-bold text-slate-900">Material</th>
                    <th className="text-center p-3 font-bold text-slate-900">Fusão (J/kg)</th>
                    <th className="text-center p-3 font-bold text-slate-900">Vaporização (J/kg)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white border-b">
                    <td className="p-3 text-slate-700"><strong>Água</strong></td>
                    <td className="text-center p-3 text-slate-700">334.000</td>
                    <td className="text-center p-3 text-slate-700">2.260.000</td>
                  </tr>
                  <tr className="bg-blue-50 border-b">
                    <td className="p-3 text-slate-700"><strong>Álcool Etílico</strong></td>
                    <td className="text-center p-3 text-slate-700">104.000</td>
                    <td className="text-center p-3 text-slate-700">838.000</td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td className="p-3 text-slate-700"><strong>Chumbo</strong></td>
                    <td className="text-center p-3 text-slate-700">23.000</td>
                    <td className="text-center p-3 text-slate-700">870.000</td>
                  </tr>
                  <tr className="bg-blue-50">
                    <td className="p-3 text-slate-700"><strong>Ferro</strong></td>
                    <td className="text-center p-3 text-slate-700">272.000</td>
                    <td className="text-center p-3 text-slate-700">6.300.000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Seção 3: Comparação */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-bold text-lg">3</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Comparação: Sensível vs Latente</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-200">
                  <th className="text-left p-3 font-bold text-slate-900">Característica</th>
                  <th className="text-left p-3 font-bold text-slate-900">Calor Sensível</th>
                  <th className="text-left p-3 font-bold text-slate-900">Calor Latente</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white border-b">
                  <td className="p-3 font-bold text-slate-700">Fórmula</td>
                  <td className="p-3 text-slate-700"><MathFormula formula={String.raw`$Q = mc\Delta T$`} /></td>
                  <td className="p-3 text-slate-700"><MathFormula formula={String.raw`$Q = mL$`} /></td>
                </tr>
                <tr className="bg-blue-50 border-b">
                  <td className="p-3 font-bold text-slate-700">Temperatura</td>
                  <td className="p-3 text-slate-700">Muda (sobe ou desce)</td>
                  <td className="p-3 text-slate-700">Não muda (constante)</td>
                </tr>
                <tr className="bg-white border-b">
                  <td className="p-3 font-bold text-slate-700">Estado Físico</td>
                  <td className="p-3 text-slate-700">Permanece o mesmo</td>
                  <td className="p-3 text-slate-700">Muda (sólido ↔ líquido ↔ gás)</td>
                </tr>
                <tr className="bg-blue-50 border-b">
                  <td className="p-3 font-bold text-slate-700">Você Sente?</td>
                  <td className="p-3 text-slate-700">Sim (pelo termômetro)</td>
                  <td className="p-3 text-slate-700">Não (temperatura constante)</td>
                </tr>
                <tr className="bg-white border-b">
                  <td className="p-3 font-bold text-slate-700">Exemplo</td>
                  <td className="p-3 text-slate-700">Água de 20°C para 80°C</td>
                  <td className="p-3 text-slate-700">Gelo derretendo a 0°C</td>
                </tr>
                <tr className="bg-blue-50">
                  <td className="p-3 font-bold text-slate-700">Energia Usada Para</td>
                  <td className="p-3 text-slate-700">Aumentar movimento molecular</td>
                  <td className="p-3 text-slate-700">Quebrar ligações moleculares</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Seção 4: Curva de Aquecimento */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-bold text-lg">4</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Curva de Aquecimento da Água</h2>
          </div>

          <p className="text-slate-700 mb-6">
            Quando você aquece gelo até transformá-lo em vapor, a curva de temperatura vs calor tem 5 fases distintas:
          </p>

          <div className="bg-slate-50 rounded-lg p-6 mb-6">
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border-l-4 border-blue-500">
                <p className="text-sm text-slate-700 mb-1"><strong>Fase 1 (Aquecimento do Gelo):</strong> Gelo de -20°C a 0°C</p>
                <p className="text-xs text-slate-600">Calor sensível: <MathFormula formula={String.raw`$Q = m \cdot 2100 \cdot \Delta T$`} /> (c_gelo ≈ 2.100 J/kg·°C)</p>
              </div>
              <div className="bg-white p-4 rounded border-l-4 border-cyan-500">
                <p className="text-sm text-slate-700 mb-1"><strong>Fase 2 (Fusão):</strong> Gelo a 0°C → Água a 0°C</p>
                <p className="text-xs text-slate-600">Calor latente: <MathFormula formula={String.raw`$Q = m \cdot 334.000$`} /> (temperatura constante)</p>
              </div>
              <div className="bg-white p-4 rounded border-l-4 border-green-500">
                <p className="text-sm text-slate-700 mb-1"><strong>Fase 3 (Aquecimento da Água):</strong> Água de 0°C a 100°C</p>
                <p className="text-xs text-slate-600">Calor sensível: <MathFormula formula={String.raw`$Q = m \cdot 4.186 \cdot \Delta T$`} /> (c_água = 4.186 J/kg·°C)</p>
              </div>
              <div className="bg-white p-4 rounded border-l-4 border-red-500">
                <p className="text-sm text-slate-700 mb-1"><strong>Fase 4 (Vaporização):</strong> Água a 100°C → Vapor a 100°C</p>
                <p className="text-xs text-slate-600">Calor latente: <MathFormula formula={String.raw`$Q = m \cdot 2.260.000$`} /> (temperatura constante)</p>
              </div>
              <div className="bg-white p-4 rounded border-l-4 border-orange-500">
                <p className="text-sm text-slate-700 mb-1"><strong>Fase 5 (Aquecimento do Vapor):</strong> Vapor de 100°C a 150°C</p>
                <p className="text-xs text-slate-600">Calor sensível: <MathFormula formula={String.raw`$Q = m \cdot 2000 \cdot \Delta T$`} /> (c_vapor ≈ 2.000 J/kg·°C)</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
            <h4 className="font-bold text-yellow-900 mb-2">⚠️ Observação Importante</h4>
            <p className="text-yellow-900 text-sm">
              Note que as fases 2 e 4 (mudança de estado) têm <strong>linhas horizontais</strong> no gráfico - a temperatura não muda! Mas o calor continua sendo absorvido. Isso é o calor latente em ação.
            </p>
          </div>
        </div>

        {/* Seção 5: Passo-a-Passo */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-bold text-lg">5</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Passo-a-Passo Prático</h2>
          </div>

          <p className="text-slate-700 mb-6">
            Como resolver problemas de calorimetria em 6 etapas:
          </p>

          <div className="space-y-4">
            <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <div>
                  <p className="font-bold text-green-900">Identifique o tipo de calor</p>
                  <p className="text-green-800 text-sm">Muda temperatura? → Sensível. Muda estado? → Latente.</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <div>
                  <p className="font-bold text-green-900">Organize os dados</p>
                  <p className="text-green-800 text-sm">Escreva m, c (ou L), T_inicial, T_final, ΔT. Use unidades consistentes (kg, J, °C).</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
                <div>
                  <p className="font-bold text-green-900">Escolha a fórmula</p>
                  <p className="text-green-800 text-sm">Sensível: Q = mcΔT. Latente: Q = mL.</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">4</div>
                <div>
                  <p className="font-bold text-green-900">Substitua os valores</p>
                  <p className="text-green-800 text-sm">Cuidado com as unidades! Converta se necessário.</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">5</div>
                <div>
                  <p className="font-bold text-green-900">Calcule</p>
                  <p className="text-green-800 text-sm">Faça a multiplicação e obtenha o resultado em Joules.</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">6</div>
                <div>
                  <p className="font-bold text-green-900">Verifique o resultado</p>
                  <p className="text-green-800 text-sm">Faz sentido? Maior massa = maior calor? Maior ΔT = maior calor?</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção 6: Exemplos Resolvidos */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-bold text-lg">6</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Exemplos Resolvidos ITA/IME</h2>
          </div>

          <div className="space-y-6">
            {/* Exemplo 1 */}
            <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
              <h4 className="font-bold text-slate-900 mb-3">Exemplo 1: Aquecimento de Água (Sensível)</h4>
              <p className="text-slate-700 mb-3">
                <strong>Problema:</strong> Quanto calor é necessário para aquecer 2 kg de água de 20°C para 80°C?
              </p>
              <div className="bg-white p-4 rounded">
                <p className="text-slate-700 mb-2"><strong>Solução:</strong></p>
                <p className="text-slate-600 mb-1">Dados: m = 2 kg, c = 4.186 J/kg·°C, ΔT = 80 - 20 = 60°C</p>
                <p className="text-slate-600 mb-1">Fórmula: <MathFormula formula={String.raw`$Q = m \cdot c \cdot \Delta T$`} /></p>
                <p className="text-slate-600 mb-1">Substituição: <MathFormula formula={String.raw`$Q = 2 \cdot 4.186 \cdot 60$`} /></p>
                <p className="text-slate-600"><strong>Resultado: Q = 502.320 J ≈ 502 kJ</strong></p>
              </div>
            </div>

            {/* Exemplo 2 */}
            <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-500">
              <h4 className="font-bold text-slate-900 mb-3">Exemplo 2: Fusão de Gelo (Latente)</h4>
              <p className="text-slate-700 mb-3">
                <strong>Problema:</strong> Quanto calor é necessário para derreter 0,5 kg de gelo a 0°C em água a 0°C?
              </p>
              <div className="bg-white p-4 rounded">
                <p className="text-slate-700 mb-2"><strong>Solução:</strong></p>
                <p className="text-slate-600 mb-1">Dados: m = 0,5 kg, L_fusão = 334.000 J/kg</p>
                <p className="text-slate-600 mb-1">Fórmula: <MathFormula formula={String.raw`$Q = m \cdot L$`} /></p>
                <p className="text-slate-600 mb-1">Substituição: <MathFormula formula={String.raw`$Q = 0,5 \cdot 334.000$`} /></p>
                <p className="text-slate-600"><strong>Resultado: Q = 167.000 J = 167 kJ</strong></p>
              </div>
            </div>

            {/* Exemplo 3 */}
            <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
              <h4 className="font-bold text-slate-900 mb-3">Exemplo 3: Processo Completo (Sensível + Latente)</h4>
              <p className="text-slate-700 mb-3">
                <strong>Problema:</strong> Quanto calor é necessário para transformar 1 kg de gelo a -10°C em vapor a 100°C?
              </p>
              <div className="bg-white p-4 rounded">
                <p className="text-slate-700 mb-2"><strong>Solução:</strong></p>
                <p className="text-slate-600 mb-1"><strong>Etapa 1 (Aquecimento do gelo):</strong> <MathFormula formula={String.raw`$Q_1 = 1 \cdot 2.100 \cdot (0 - (-10)) = 21.000 \text{ J}$`} /></p>
                <p className="text-slate-600 mb-1"><strong>Etapa 2 (Fusão):</strong> <MathFormula formula={String.raw`$Q_2 = 1 \cdot 334.000 = 334.000 \text{ J}$`} /></p>
                <p className="text-slate-600 mb-1"><strong>Etapa 3 (Aquecimento da água):</strong> <MathFormula formula={String.raw`$Q_3 = 1 \cdot 4.186 \cdot 100 = 418.600 \text{ J}$`} /></p>
                <p className="text-slate-600 mb-1"><strong>Etapa 4 (Vaporização):</strong> <MathFormula formula={String.raw`$Q_4 = 1 \cdot 2.260.000 = 2.260.000 \text{ J}$`} /></p>
                <p className="text-slate-600"><strong>Total: Q = 21.000 + 334.000 + 418.600 + 2.260.000 = 3.033.600 J ≈ 3.034 kJ</strong></p>
              </div>
            </div>

            {/* Exemplo 4 */}
            <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-500">
              <h4 className="font-bold text-slate-900 mb-3">Exemplo 4: Mistura de Temperaturas (Conservação)</h4>
              <p className="text-slate-700 mb-3">
                <strong>Problema:</strong> Misturamos 1 kg de água a 80°C com 2 kg de água a 20°C. Qual é a temperatura final?
              </p>
              <div className="bg-white p-4 rounded">
                <p className="text-slate-700 mb-2"><strong>Solução:</strong></p>
                <p className="text-slate-600 mb-1">Princípio: <MathFormula formula={String.raw`$Q_{\text{cedido}} = Q_{\text{recebido}}$`} /></p>
                <p className="text-slate-600 mb-1"><MathFormula formula={String.raw`$m_1 \cdot c \cdot (T_f - T_1) = m_2 \cdot c \cdot (T_2 - T_f)$`} /></p>
                <p className="text-slate-600 mb-1"><MathFormula formula={String.raw`$1 \cdot (T_f - 80) = 2 \cdot (20 - T_f)$`} /></p>
                <p className="text-slate-600 mb-1"><MathFormula formula={String.raw`$T_f - 80 = 40 - 2T_f$`} /></p>
                <p className="text-slate-600 mb-1"><MathFormula formula={String.raw`$3T_f = 120$`} /></p>
                <p className="text-slate-600"><strong>Resultado: T_f = 40°C</strong></p>
              </div>
            </div>

            {/* Exemplo 5 */}
            <div className="bg-indigo-50 rounded-lg p-6 border-l-4 border-indigo-500">
              <h4 className="font-bold text-slate-900 mb-3">Exemplo 5: Vaporização (Latente)</h4>
              <p className="text-slate-700 mb-3">
                <strong>Problema:</strong> Quanto calor é necessário para vaporizar 0,2 kg de água a 100°C?
              </p>
              <div className="bg-white p-4 rounded">
                <p className="text-slate-700 mb-2"><strong>Solução:</strong></p>
                <p className="text-slate-600 mb-1">Dados: m = 0,2 kg, L_vap = 2.260.000 J/kg</p>
                <p className="text-slate-600 mb-1">Fórmula: <MathFormula formula={String.raw`$Q = m \cdot L$`} /></p>
                <p className="text-slate-600 mb-1">Substituição: <MathFormula formula={String.raw`$Q = 0,2 \cdot 2.260.000$`} /></p>
                <p className="text-slate-600"><strong>Resultado: Q = 452.000 J = 452 kJ</strong></p>
              </div>
            </div>
          </div>
        </div>

        {/* Seção 7: Aplicações Práticas */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-bold text-lg">7</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Aplicações Práticas</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-bold text-slate-900 mb-2">🚿 Aquecimento de Água (Chuveiro)</h4>
              <p className="text-slate-700 text-sm">Um chuveiro elétrico aquece água usando calor sensível. A potência do chuveiro (em watts) determina quanto calor é transferido por segundo. Por isso chuveiros mais potentes aquecem a água mais rápido.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-cyan-500">
              <h4 className="font-bold text-slate-900 mb-2">❄️ Mudança de Estado (Gelo e Vapor)</h4>
              <p className="text-slate-700 text-sm">Por que o gelo demora para derreter? Porque o calor latente de fusão é alto (334 kJ/kg). Por que a água demora para fervir? Porque o calor latente de vaporização é muito alto (2.260 kJ/kg) - é por isso que cozinhar com vapor é tão eficiente.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-green-500">
              <h4 className="font-bold text-slate-900 mb-2">🧪 Calorimetria em Laboratório</h4>
              <p className="text-slate-700 text-sm">Calorímetros medem o calor liberado ou absorvido em reações químicas. Usando Q = mcΔT, podemos calcular a energia de uma reação observando a mudança de temperatura.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <h4 className="font-bold text-slate-900 mb-2">🏠 Isolamento Térmico de Casas</h4>
              <p className="text-slate-700 text-sm">Materiais isolantes (lã de vidro, poliestireno) têm baixa condutividade térmica. Eles reduzem a transferência de calor, mantendo a casa quente no inverno e fresca no verão, economizando energia.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-red-500">
              <h4 className="font-bold text-slate-900 mb-2">❄️ Refrigeração (Ar-Condicionado)</h4>
              <p className="text-slate-700 text-sm">O ar-condicionado usa o calor latente de vaporização para resfriar. Um fluido refrigerante evapora dentro da casa (absorvendo calor latente) e condensa fora (liberando calor latente). É muito mais eficiente que usar apenas calor sensível.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-orange-500">
              <h4 className="font-bold text-slate-900 mb-2">☀️ Aquecimento Solar</h4>
              <p className="text-slate-700 text-sm">Painéis solares usam a radiação do sol para aquecer água. A água absorve calor sensível, aumentando sua temperatura. Depois, essa água quente é armazenada em tanques para uso posterior.</p>
            </div>
          </div>
        </div>

        {/* Erros Comuns */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-yellow-900 mb-4">⚠️ Erros Comuns</h3>
          <ul className="space-y-3 text-yellow-900">
            <li className="flex gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Confundir calor sensível com latente:</strong> Sensível muda temperatura; latente muda estado. Não misture!</span>
            </li>
            <li className="flex gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Esquecer que temperatura não muda durante mudança de estado:</strong> Se está derretendo ou fervendo, ΔT = 0!</span>
            </li>
            <li className="flex gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Usar unidades inconsistentes:</strong> Sempre use kg, J, e °C (ou K). Converta se necessário.</span>
            </li>
            <li className="flex gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Esquecer de considerar todas as etapas:</strong> Se o gelo precisa derreter E depois aquecer, calcule ambas!</span>
            </li>
            <li className="flex gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Usar valores errados de c ou L:</strong> Sempre verifique a tabela - cada material é diferente!</span>
            </li>
          </ul>
        </div>

        {/* Dicas Práticas */}
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6">
          <h3 className="text-xl font-bold text-green-900 mb-4">💡 Dicas Práticas</h3>
          <ul className="space-y-3 text-green-900">
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Desenhe diagramas:</strong> Represente as etapas de aquecimento e mudança de estado para não esquecer nenhuma.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Use unidades consistentes:</strong> Sempre em Joules, kg e Celsius/Kelvin.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Verifique seu resultado:</strong> A temperatura final deve estar entre as temperaturas iniciais (em problemas de mistura).</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Lembre-se da conservação de energia:</strong> Em um sistema isolado, o calor cedido = calor recebido.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Pratique com exemplos:</strong> Quanto mais você praticar, mais fácil fica identificar o tipo de calor e escolher a fórmula correta.</span>
            </li>
          </ul>
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
