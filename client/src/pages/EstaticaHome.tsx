import { Link } from "wouter";
import { ArrowLeft, BookOpen, Calculator, BarChart3, HelpCircle, TrendingUp, Play, MessageCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MathFormula } from "@/components/MathFormula";

export default function EstaticaHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-orange-400 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Estática</h1>
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
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-orange-600/5 to-transparent" />
        <div className="container py-16 md:py-24 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
                  Entenda o <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Equilíbrio</span>
                </h2>
                <p className="text-xl text-slate-600">
                  Explore a estática: como os corpos permanecem em equilíbrio, o papel do torque e as aplicações práticas em estruturas e máquinas.
                </p>
              </div>
              <div className="flex gap-4 flex-wrap">
                <Link href="/estatica/learn">
                  <Button size="lg" className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600">
                    Começar a Aprender
                  </Button>
                </Link>
                <Link href="/estatica/simulator">
                  <Button size="lg" variant="outline" className="border-amber-300 hover:bg-amber-50">
                    <Play className="w-4 h-4 mr-2" />
                    Simulador Visual
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="/images/estatica-banner.png" 
                alt="Estática" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container py-12">
        {/* Navigation Cards */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-slate-900 mb-8">Ferramentas de Aprendizado</h3>
          <div className="grid md:grid-cols-6 gap-4">
            <div className="group">
              <Link href="/estatica/learn">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-amber-400">
                  <BookOpen className="w-8 h-8 text-amber-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Guia Completo</h3>
                  <p className="text-xs text-slate-600 mt-1">Explicações detalhadas</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/estatica/calculator">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-amber-400">
                  <Calculator className="w-8 h-8 text-amber-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Calculadora</h3>
                  <p className="text-xs text-slate-600 mt-1">Calcule qualquer variável</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/estatica/formulas">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-amber-400">
                  <BarChart3 className="w-8 h-8 text-amber-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Fórmulas</h3>
                  <p className="text-xs text-slate-600 mt-1">Derivações completas</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/estatica/quiz">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-amber-400">
                  <HelpCircle className="w-8 h-8 text-amber-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Quiz</h3>
                  <p className="text-xs text-slate-600 mt-1">Teste seu conhecimento</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/estatica/graphs">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-amber-400">
                  <TrendingUp className="w-8 h-8 text-amber-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Gráficos</h3>
                  <p className="text-xs text-slate-600 mt-1">Visualizações dinâmicas</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/estatica/simulator">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-amber-400">
                  <Play className="w-8 h-8 text-amber-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Simulador</h3>
                  <p className="text-xs text-slate-600 mt-1">Animações interativas</p>
                </Card>
              </Link>
            </div>

          </div>
        </div>

        {/* Topics Grid */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-slate-900 mb-8">Tópicos Principais</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/estatica/topic/equilibrio">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-amber-500 cursor-pointer hover:border-amber-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">⚖️</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Equilíbrio de Forças</h4>
                    <p className="text-slate-600 mb-4">Quando as forças se equilibram e o corpo permanece em repouso ou movimento uniforme.</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                        Primeira Condição de Equilíbrio
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                        <span>Fórmula: <MathFormula formula={String.raw`$$$$\\sum \\vec{F} = 0$$$$`} className="inline text-sm" /></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                        Aplicações Práticas
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href="/estatica/topic/torque">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-amber-500 cursor-pointer hover:border-amber-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🔄</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Torque e Momento</h4>
                    <p className="text-slate-600 mb-4">Como as forças causam rotação e como manter o equilíbrio rotacional.</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                        Segunda Condição de Equilíbrio
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                        <span>Fórmula: <MathFormula formula={String.raw`$$$$\\sum \\tau = 0$$$$`} className="inline text-sm" /></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                        Centro de Massa e Gravidade
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href="/estatica/topic/maquinas">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-amber-500 cursor-pointer hover:border-amber-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🔧</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Máquinas Simples</h4>
                    <p className="text-slate-600 mb-4">Como as máquinas simples usam a estática para facilitar o trabalho.</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                        Alavancas e Polias
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                        Vantagem Mecânica
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                        Aplicações no Mundo Real
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href="/estatica/topic/hidrostatica">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-amber-500 cursor-pointer hover:border-amber-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">💧</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Hidrostática</h4>
                    <p className="text-slate-600 mb-4">Fluidos em equilíbrio: pressão, empuxo e vasos comunicantes.</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                        Pressão Hidrostática
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                        Princípio de Arquimedes
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                        Vasos Comunicantes
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Fórmulas Principais */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-slate-900 mb-8">Fórmulas Principais</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Equilíbrio de Forças", formula: "\\sum \\vec{F} = 0", color: "amber", link: "/estatica/topic/equilibrio" },
              { title: "Torque/Momento", formula: "\\tau = \\vec{r} \\times \\vec{F}", color: "orange", link: "/estatica/topic/torque" },
              { title: "Equilíbrio Rotacional", formula: "\\sum \\tau = 0", color: "yellow", link: "/estatica/topic/torque" },
              { title: "Vantagem Mecânica", formula: "VM = \\frac{F_r}{F_a}", color: "red", link: "/estatica/topic/maquinas" },
              { title: "Centro de Massa", formula: "\\bar{x} = \\frac{\\sum m_i x_i}{\\sum m_i}", color: "pink", link: "/estatica/topic/torque" },
              { title: "Pressao Hidrostatica", formula: "P = P_0 + \\rho g h", color: "cyan", link: "/estatica/topic/hidrostatica" },
              { title: "Empuxo", formula: "E = \\rho \\cdot g \\cdot V", color: "blue", link: "/estatica/topic/hidrostatica" },
            ].map((item, index) => (
              <Link key={index} href={item.link}>
                <Card className={`p-6 bg-gradient-to-br from-${item.color}-50 to-${item.color}-100 border-0 hover:shadow-lg transition-all cursor-pointer`}>
                  <h4 className="font-bold text-slate-900 mb-4">{item.title}</h4>
                  <div className="bg-white rounded-lg p-4 overflow-x-auto">
                    <MathFormula formula={item.formula} className="text-lg" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
