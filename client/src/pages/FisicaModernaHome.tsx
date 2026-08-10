import { Card } from "@/components/ui/card";
import { BookOpen, MessageCircle, ArrowLeft, Play, BarChart3, Calculator, HelpCircle, TrendingUp, Atom } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function FisicaModernaHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/fisica-iii" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Atom className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Física Moderna</h1>
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
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/5 to-transparent" />
        <div className="container py-16 md:py-24 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
                  Explore a <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Física Moderna</span>
                </h2>
                <p className="text-xl text-slate-600">
                  Descubra as revoluções científicas do século XX: Relatividade, Física Quântica, Átomo, Partículas Elementares e suas aplicações tecnológicas.
                </p>
              </div>
              <div className="flex gap-4 flex-wrap">
                <Link href="/fisica-moderna/topic/relatividade">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white">
                    Começar a Aprender
                  </Button>
                </Link>
                <Link href="/fisica-moderna/simulator">
                  <Button size="lg" variant="outline" className="border-purple-300 hover:bg-purple-50">
                    <Play className="w-4 h-4 mr-2" />
                    Simulador Visual
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl bg-slate-900 flex items-center justify-center">
              {/* Placeholder for banner image */}
              <Atom className="w-32 h-32 text-purple-500 animate-pulse" />
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
              <Link href="/fisica-moderna/topic/relatividade">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-400">
                  <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Guia Completo</h3>
                  <p className="text-xs text-slate-600 mt-1">Explicações detalhadas</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/fisica-moderna/simulator">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-400">
                  <Calculator className="w-8 h-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Calculadora</h3>
                  <p className="text-xs text-slate-600 mt-1">Calcule qualquer variável</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/fisica-moderna/topic/relatividade">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-400">
                  <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Fórmulas</h3>
                  <p className="text-xs text-slate-600 mt-1">Derivações completas</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/fisica-moderna/quiz">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-400">
                  <HelpCircle className="w-8 h-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Quiz</h3>
                  <p className="text-xs text-slate-600 mt-1">Teste seu conhecimento</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/fisica-moderna/graphs">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-400">
                  <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Gráficos</h3>
                  <p className="text-xs text-slate-600 mt-1">Visualizações dinâmicas</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/fisica-moderna/simulator">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-400">
                  <Play className="w-8 h-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
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
            <Link href="/fisica-moderna/topic/relatividade">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-purple-500 cursor-pointer hover:border-purple-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">⚡</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Relatividade Restrita</h4>
                    <p className="text-slate-600 mb-4">Teoria de Einstein (1905): dilatação do tempo, contração do espaço, E=mc² e paradoxos relativísticos.</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Postulados de Einstein
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Transformações de Lorentz
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Equivalência Massa-Energia
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>
            
            <Link href="/fisica-moderna/topic/quantica">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-purple-500 cursor-pointer hover:border-purple-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🌊</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Física Quântica</h4>
                    <p className="text-slate-600 mb-4">Radiação de corpo negro, efeito fotoelétrico, dualidade onda-partícula e princípio da incerteza.</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Hipótese de Planck
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Efeito Fotoelétrico
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Dualidade Onda-Partícula
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/fisica-moderna/topic/atomo">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-pink-500 cursor-pointer hover:border-pink-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">⚛️</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Átomo e Núcleo</h4>
                    <p className="text-slate-600 mb-4">Modelos atômicos, espectros, radioatividade (alfa, beta, gama), fissão e fusão nuclear.</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-pink-600 rounded-full"></span>
                        Modelo de Bohr
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-pink-600 rounded-full"></span>
                        Radioatividade
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-pink-600 rounded-full"></span>
                        Fissão e Fusão
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/fisica-moderna/topic/particulas">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-pink-500 cursor-pointer hover:border-pink-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🔬</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Partículas Elementares</h4>
                    <p className="text-slate-600 mb-4">Modelo padrão, quarks, léptons, bósons (Higgs), antimatéria e aceleradores de partículas.</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-pink-600 rounded-full"></span>
                        Modelo Padrão
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-pink-600 rounded-full"></span>
                        Quarks e Léptons
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-pink-600 rounded-full"></span>
                        Bóson de Higgs
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/fisica-moderna/topic/aplicacoes">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-purple-500 cursor-pointer hover:border-purple-700 md:col-span-2">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">💡</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Aplicações Tecnológicas</h4>
                    <p className="text-slate-600 mb-4">Laser, LED, semicondutores, transistores, energia nuclear, computação quântica, GPS, nanotecnologia e ressonância magnética.</p>
                    <div className="grid md:grid-cols-2 gap-x-8">
                      <ul className="space-y-2 text-sm text-slate-700">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                          Laser e LED
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                          Semicondutores
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                          Energia Nuclear
                        </li>
                      </ul>
                      <ul className="space-y-2 text-sm text-slate-700">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                          Computação Quântica
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                          GPS e Relatividade
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                          Nanotecnologia
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Por que estudar Física Moderna? */}
        <div className="mb-16">
          <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <h3 className="text-3xl font-bold text-slate-900 mb-6">Por que estudar Física Moderna?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl text-white">🚀</span>
                </div>
                <h4 className="font-bold text-slate-900">Revolução Científica</h4>
                <p className="text-slate-700 text-sm">
                  Compreenda as duas maiores revoluções científicas do século XX: Relatividade e Mecânica Quântica, que transformaram nossa visão do universo.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl text-white">💻</span>
                </div>
                <h4 className="font-bold text-slate-900">Tecnologia Moderna</h4>
                <p className="text-slate-700 text-sm">
                  Descubra como a Física Moderna está por trás de tecnologias essenciais: computadores, smartphones, GPS, energia nuclear e medicina.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl text-white">🎓</span>
                </div>
                <h4 className="font-bold text-slate-900">Essencial para ITA/IME</h4>
                <p className="text-slate-700 text-sm">
                  Tópico fundamental em provas de vestibulares de excelência, com questões conceituais e aplicações práticas que exigem raciocínio profundo.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Estatísticas */}
        <div className="mb-16">
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 text-center border-t-4 border-purple-500">
              <div className="text-4xl font-bold text-purple-600 mb-2">5</div>
              <p className="text-slate-600 font-medium">Tópicos Principais</p>
            </Card>
            <Card className="p-6 text-center border-t-4 border-pink-500">
              <div className="text-4xl font-bold text-pink-600 mb-2">20+</div>
              <p className="text-slate-600 font-medium">Conceitos Fundamentais</p>
            </Card>
            <Card className="p-6 text-center border-t-4 border-purple-500">
              <div className="text-4xl font-bold text-purple-600 mb-2">30+</div>
              <p className="text-slate-600 font-medium">Exemplos Resolvidos</p>
            </Card>
            <Card className="p-6 text-center border-t-4 border-pink-500">
              <div className="text-4xl font-bold text-pink-600 mb-2">10+</div>
              <p className="text-slate-600 font-medium">Aplicações Práticas</p>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="p-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <h3 className="text-3xl font-bold mb-4">Pronto para explorar o universo quântico?</h3>
            <p className="text-lg mb-8 text-purple-100">
              Comece sua jornada pela Física Moderna e descubra os segredos do espaço-tempo, da matéria e da energia.
            </p>
            <Link href="/fisica-moderna/topic/relatividade">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
                Começar Agora
              </Button>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  );
}
