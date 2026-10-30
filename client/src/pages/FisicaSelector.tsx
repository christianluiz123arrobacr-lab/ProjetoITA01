import { Link } from "wouter";
import { BookOpen, Flame, Waves, Eye, ArrowRight, Zap, Magnet, Atom, Sparkles, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FisicaSelector() {
  return (
    <div className="theme-page min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950/40 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700 dark:bg-slate-950/85">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Física Educacional</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">Projeto Vetor</p>
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
              <Button variant="outline" size="sm" className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-950">
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Escolha seu <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Caminho</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
            Selecione entre Física I, II ou III para começar seus estudos.
          </p>
        </div>

        {/* Main Cards Section */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-20">
          {/* Física I - Mecânica */}
          <div className="group">
            <Link href="/fisica-i">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-400 cursor-pointer h-full flex flex-col">
                <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-10 text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-bold mb-2">Física I</h3>
                  <p className="text-blue-100 mb-4 text-base">Mecânica - O Movimento e as Forças</p>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="space-y-4 mb-8 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-blue-600 font-bold">1</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Cinemática</h4>
                        <p className="text-slate-600 text-sm">Velocidade, aceleração e movimento</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-blue-600 font-bold">2</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Dinâmica</h4>
                        <p className="text-slate-600 text-sm">Forças, leis de Newton e energia</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-blue-600 font-bold">3</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Estática</h4>
                        <p className="text-slate-600 text-sm">Equilíbrio, torque e hidrostática</p>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white group-hover:gap-2 mt-auto">
                    Explorar Física I
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </Link>
          </div>

          {/* Física II - Termologia, Ondulatória, Óptica */}
          <div className="group">
            <Link href="/fisica-ii">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-purple-400 cursor-pointer h-full flex flex-col">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-10 text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Flame className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-bold mb-2">Física II</h3>
                  <p className="text-purple-100 mb-4 text-base">Termologia, Ondulatória e Óptica</p>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="space-y-4 mb-8 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Flame className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Termologia</h4>
                        <p className="text-slate-600 text-sm">Temperatura, calor e termodinâmica</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Waves className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Ondulatória</h4>
                        <p className="text-slate-600 text-sm">Ondas, som e fenômenos ondulatórios</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Eye className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Óptica</h4>
                        <p className="text-slate-600 text-sm">Luz, lentes e fenômenos ópticos</p>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white group-hover:gap-2 mt-auto">
                    Explorar Física II
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </Link>
          </div>

          {/* Física III - Eletromagnetismo */}
          <div className="group">
            <Link href="/fisica-iii">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-yellow-400 cursor-pointer h-full flex flex-col">
                <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-10 text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-bold mb-2">Física III</h3>
                  <p className="text-yellow-100 mb-4 text-base">Eletricidade, Magnetismo e Moderna</p>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="space-y-4 mb-8 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Zap className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Eletricidade</h4>
                        <p className="text-slate-600 text-sm">Cargas, campos e circuitos elétricos</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Magnet className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Eletromagnetismo</h4>
                        <p className="text-slate-600 text-sm">Campos magnéticos, indução e ondas</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Atom className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Física Moderna</h4>
                        <p className="text-slate-600 text-sm">Relatividade e física quântica</p>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white group-hover:gap-2 mt-auto">
                    Explorar Física III
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* AI Resolver Featured Section */}
        <div className="max-w-7xl mx-auto mb-12">
          <Link href="/ia-resolver">
            <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-2xl shadow-2xl overflow-hidden border border-indigo-400 cursor-pointer hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <div className="p-8 md:p-12 text-white flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Brain className="w-5 h-5" />
                    </div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">NOVO</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-2">IA Resolutora Premium</h3>
                  <p className="text-base md:text-lg text-indigo-100 mb-4 max-w-2xl">
                    Envie suas questoes de Fisica (texto ou foto) e receba resolucoes didaticas completas com LaTeX automatico.
                  </p>
                  <Button className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold gap-2">
                    <Sparkles className="w-4 h-4" />
                    Comecar Agora
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="hidden md:flex items-center justify-center flex-shrink-0 ml-8">
                  <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                    <Brain className="w-12 h-12 text-white/50" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Main Cards Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-12 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Como Usar</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-lg">1</span>
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Escolha sua Disciplina</h4>
              <p className="text-slate-600 text-sm">Selecione entre Física I, II ou III para começar</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold text-lg">2</span>
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Estude os Tópicos</h4>
              <p className="text-slate-600 text-sm">Aprenda com explicações didáticas e exemplos práticos</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 font-bold text-lg">3</span>
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Pratique e Teste</h4>
              <p className="text-slate-600 text-sm">Use simuladores, gráficos e quizzes para consolidar</p>
            </div>
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
