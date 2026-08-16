import { Link } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  BarChart3,
  HelpCircle,
  TrendingUp,
  Play,
  MessageCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MathFormula } from "@/components/MathFormula";

export default function DinamicaHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dinâmica</h1>
              <p className="text-xs text-slate-500">
                Projeto Vetor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/progress">
              <Button variant="outline" size="sm">
                Progresso
              </Button>
            </Link>

            <a
              href="https://youtube.com/@projetoita-z4x?si=dIghaQjMiHZzk4R5"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                Sobre
              </Button>
            </a>

            <a
              href="https://chat.whatsapp.com/Grwi9hUFvFbA91gShvZGqI"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-purple-600/5 to-transparent" />

        <div className="container py-16 md:py-24 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
                  Entenda as{" "}
                  <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                    Causas
                  </span>
                </h2>

                <p className="text-xl text-slate-600">
                  Explore a dinâmica: como as forças causam movimento, as leis
                  que governam o universo e as aplicações práticas no mundo real.
                </p>
              </div>

              <div className="flex gap-4 flex-wrap">
                <Link href="/dinamica/learn">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  >
                    Começar a Aprender
                  </Button>
                </Link>

                <Link href="/dinamica/simulator">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-purple-300 hover:bg-purple-50"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Simulador Visual
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/images/dinamica-banner.png"
                alt="Dinâmica"
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
          <h3 className="text-3xl font-bold text-slate-900 mb-8">
            Ferramentas de Aprendizado
          </h3>

          <div className="grid md:grid-cols-6 gap-4">
            <div className="group">
              <Link href="/dinamica/learn">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-400">
                  <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Guia Completo</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Explicações detalhadas
                  </p>
                </Card>
              </Link>
            </div>

            <div className="group">
              <Link href="/dinamica/calculator">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-400">
                  <Calculator className="w-8 h-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Calculadora</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Calcule qualquer variável
                  </p>
                </Card>
              </Link>
            </div>

            <div className="group">
              <Link href="/dinamica/formulas">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-400">
                  <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Fórmulas</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Derivações completas
                  </p>
                </Card>
              </Link>
            </div>

            <div className="group">
              <Link href="/dinamica/quiz">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-400">
                  <HelpCircle className="w-8 h-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Quiz</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Teste seu conhecimento
                  </p>
                </Card>
              </Link>
            </div>

            <div className="group">
              <Link href="/dinamica/graphs">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-400">
                  <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Gráficos</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Visualizações dinâmicas
                  </p>
                </Card>
              </Link>
            </div>

            <div className="group">
              <Link href="/dinamica/simulator">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-400">
                  <Play className="w-8 h-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Simulador</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Animações interativas
                  </p>
                </Card>
              </Link>
            </div>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-slate-900 mb-8">
            Tópicos Principais
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/dinamica/topic/newton">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-purple-500 cursor-pointer hover:border-purple-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">⚙️</div>

                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">
                      As Três Leis de Newton
                    </h4>

                    <p className="text-slate-600 mb-4">
                      Os princípios fundamentais que governam o movimento de
                      todos os corpos.
                    </p>

                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Primeira Lei: Lei da Inércia
                      </li>

                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        <span>
                          Segunda Lei:{" "}
                          <MathFormula
                            formula={String.raw`\vec{F}_{\text{res}} = m\vec{a}`}
                            className="inline text-sm"
                          />
                        </span>
                      </li>

                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Terceira Lei: Ação e Reação
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/dinamica/topic/atrito">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-purple-500 cursor-pointer hover:border-purple-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">💪</div>

                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">
                      Atrito
                    </h4>

                    <p className="text-slate-600 mb-4">
                      Entenda a força de atrito estático, a força de atrito
                      cinético, a normal e o sentido correto do atrito.
                    </p>

                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Força de atrito estático
                      </li>

                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Força de atrito cinético
                      </li>

                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Sentido do atrito e tendência de escorregamento
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/dinamica/topic/energy">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-purple-500 cursor-pointer hover:border-purple-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">⚡</div>

                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">
                      Trabalho e Energia
                    </h4>

                    <p className="text-slate-600 mb-4">
                      Como o trabalho transfere energia e como a energia se
                      conserva.
                    </p>

                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Trabalho de uma Força
                      </li>

                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Energia Cinética e Potencial
                      </li>

                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Conservação de Energia
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/dinamica/topic/momentum">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-purple-500 cursor-pointer hover:border-purple-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">💥</div>

                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">
                      Momentum e Colisões
                    </h4>

                    <p className="text-slate-600 mb-4">
                      A quantidade de movimento e como os objetos interagem em
                      colisões.
                    </p>

                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Definição de Momentum
                      </li>

                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Colisões Elásticas e Inelásticas
                      </li>

                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Conservação de Momentum
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/dinamica/topic/power">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-purple-500 cursor-pointer hover:border-purple-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🔋</div>

                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">
                      Potência e Eficiência
                    </h4>

                    <p className="text-slate-600 mb-4">
                      Como medir a rapidez de realização de trabalho e a
                      eficiência de sistemas.
                    </p>

                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Definição de Potência
                      </li>

                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Eficiência Energética
                      </li>

                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Aplicações Práticas
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
          <h3 className="text-3xl font-bold text-slate-900 mb-8">
            Fórmulas Principais
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Segunda Lei de Newton",
                formula: "\\vec{F}_{\\text{res}} = m\\vec{a}",
                color: "purple",
                link: "/dinamica/topic/newton",
              },
              {
                title: "Força de Atrito",
                formula: "f = \\mu \\cdot N",
                color: "orange",
                link: "/dinamica/topic/atrito",
              },
              {
                title: "Trabalho",
                formula: "W = F \\cdot d \\cdot \\cos(\\theta)",
                color: "green",
                link: "/dinamica/topic/energy",
              },
              {
                title: "Energia Cinética",
                formula: "E_c = \\frac{1}{2} \\cdot m \\cdot v^2",
                color: "red",
                link: "/dinamica/topic/energy",
              },
              {
                title: "Energia Potencial",
                formula: "E_p = m \\cdot g \\cdot h",
                color: "blue",
                link: "/dinamica/topic/energy",
              },
              {
                title: "Momentum",
                formula: "p = m \\cdot v",
                color: "indigo",
                link: "/dinamica/topic/momentum",
              },
            ].map((item, index) => (
              <Link key={index} href={item.link}>
                <Card
                  className={`p-6 bg-gradient-to-br from-${item.color}-50 to-${item.color}-100 border-0 hover:shadow-lg transition-all cursor-pointer`}
                >
                  <h4 className="font-bold text-slate-900 mb-4">
                    {item.title}
                  </h4>

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
