import { Card } from "@/components/ui/card";
import { BookOpen, MessageCircle, ArrowLeft, Play, BarChart3, Calculator, HelpCircle, TrendingUp, Zap } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function EletricidadeHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50 to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/fisica-iii" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Eletricidade</h1>
              <p className="text-xs text-slate-500">Projeto Vetor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/progress">
              <Button variant="outline" size="sm">Progresso</Button>
            </Link>
            <a href="https://youtube.com/@projetoita-z4x?si=dIghaQjMiHZzk4R5" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">Sobre</Button>
            </a>
            <a href="https://chat.whatsapp.com/Grwi9hUFvFbA91gShvZGqI" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/10 via-orange-600/5 to-transparent" />
        <div className="container py-16 md:py-24 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
                  Domine a <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">Eletricidade</span>
                </h2>
                <p className="text-xl text-slate-600">
                  Explore os fundamentos da eletricidade: cargas elétricas, campos, potencial, circuitos e eletrodinâmica com rigor matemático e aplicações práticas.
                </p>
              </div>
              <div className="flex gap-4 flex-wrap">
                <Link href="/eletricidade/topic/eletrostatica">
                  <Button size="lg" className="bg-gradient-to-r from-yellow-600 to-orange-500 hover:from-yellow-700 hover:to-orange-600 text-white">
                    Começar a Aprender
                  </Button>
                </Link>
                <Link href="/eletricidade/simulator">
                  <Button size="lg" variant="outline" className="border-yellow-300 hover:bg-yellow-50">
                    <Play className="w-4 h-4 mr-2" />
                    Simulador Visual
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl bg-slate-900 flex items-center justify-center">
              {/* Placeholder for banner image */}
              <Zap className="w-32 h-32 text-yellow-500 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container py-12">
        {/* Ferramentas de Aprendizado - Navigation Cards */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-slate-900 mb-8">Ferramentas de Aprendizado</h3>
          <div className="grid md:grid-cols-6 gap-4">
            <div className="group">
              <Link href="/eletricidade/topic/eletrostatica">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-yellow-400">
                  <BookOpen className="w-8 h-8 text-yellow-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Guia Completo</h3>
                  <p className="text-xs text-slate-600 mt-1">Explicações detalhadas</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/eletricidade/simulator">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-yellow-400">
                  <Calculator className="w-8 h-8 text-yellow-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Calculadora</h3>
                  <p className="text-xs text-slate-600 mt-1">Calcule qualquer variável</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/eletricidade/topic/eletrostatica">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-yellow-400">
                  <BarChart3 className="w-8 h-8 text-yellow-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Fórmulas</h3>
                  <p className="text-xs text-slate-600 mt-1">Derivações completas</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/eletricidade/quiz">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-yellow-400">
                  <HelpCircle className="w-8 h-8 text-yellow-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Quiz</h3>
                  <p className="text-xs text-slate-600 mt-1">Teste seu conhecimento</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/eletricidade/graphs">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-yellow-400">
                  <TrendingUp className="w-8 h-8 text-yellow-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Gráficos</h3>
                  <p className="text-xs text-slate-600 mt-1">Visualizações dinâmicas</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/eletricidade/simulator">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-yellow-400">
                  <Play className="w-8 h-8 text-yellow-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Simulador</h3>
                  <p className="text-xs text-slate-600 mt-1">Animações interativas</p>
                </Card>
              </Link>
            </div>
          </div>
        </div>

        {/* Tópicos Principais */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-slate-900 mb-8">Tópicos Principais</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/eletricidade/topic/eletrostatica">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-yellow-500 cursor-pointer hover:border-yellow-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">⚡</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Eletrostática</h4>
                    <p className="text-slate-600 mb-4">Estudo das cargas elétricas em repouso, Lei de Coulomb e Campo Elétrico.</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                        Carga Elétrica e Lei de Coulomb
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                        Campo Elétrico
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                        Potencial Elétrico e Trabalho
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>
            
            <Link href="/eletricidade/topic/eletrodinamica">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-yellow-500 cursor-pointer hover:border-yellow-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🔋</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Eletrodinâmica</h4>
                    <p className="text-slate-600 mb-4">Corrente elétrica, resistência, leis de Ohm e circuitos elétricos.</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                        Corrente e Resistência
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                        Leis de Kirchhoff
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                        Capacitores e Indutores
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/eletricidade/topic/magnetismo">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-orange-500 cursor-pointer hover:border-orange-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🧲</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Magnetismo</h4>
                    <p className="text-slate-600 mb-4">Campos magnéticos, força de Lorentz e indução eletromagnética.</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                        Lei de Ampère
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                        Força de Lorentz
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                        Lei de Faraday e Transformadores
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/eletricidade/topic/potencial-eletrico">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-purple-500 cursor-pointer hover:border-purple-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">⚙️</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Potencial Elétrico</h4>
                    <p className="text-slate-600 mb-4">Potencial, trabalho e energia em campos elétricos.</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Definição de Potencial
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Trabalho e Diferença de Potencial
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Superfícies Equipotenciais
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/eletricidade/topic/dieletricos">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-green-500 cursor-pointer hover:border-green-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🔬</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Dielétricos</h4>
                    <p className="text-slate-600 mb-4">Polarização e comportamento de materiais isolantes.</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                        Polarização de Dielétricos
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                        Constante Dielétrica
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                        Capacitores com Dielétricos
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/eletricidade/topic/circuitos-ac">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-blue-500 cursor-pointer hover:border-blue-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">〰️</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Circuitos AC</h4>
                    <p className="text-slate-600 mb-4">Corrente alternada, impedância e ressonância.</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Tensão e Corrente Alternada
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Impedância e Reatância
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Potência e Ressonância
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/eletricidade/topic/ondas-eletromagneticas">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-red-500 cursor-pointer hover:border-red-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">📡</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Ondas Eletromagnéticas</h4>
                    <p className="text-slate-600 mb-4">Propagação de campos E e B, espectro eletromagnético.</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                        Equações de Maxwell
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                        Propagação de Ondas
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                        Espectro Eletromagnético
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
