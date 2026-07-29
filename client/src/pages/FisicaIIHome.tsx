import { Link } from "wouter";
import { ArrowLeft, BookOpen, Flame, Waves, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FisicaIIHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Física II</h1>
                <p className="text-xs text-slate-600">Termologia, Ondulatória e Óptica</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Bem-vindo à Física II
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Explore Termologia, Ondulatória e Óptica com explicações didáticas, simuladores interativos e ferramentas de aprendizado.
          </p>
        </div>

        {/* Disciplinas */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Termologia */}
          <Link href="/termologia">
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-red-400 cursor-pointer">
              <div className="bg-gradient-to-br from-red-500 to-orange-600 p-8 text-white">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Flame className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold mb-2">Termologia</h3>
                <p className="text-red-100">Calor e Temperatura</p>
              </div>
              <div className="p-8">
                <ul className="space-y-3 mb-8 text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Temperatura e Calor
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Calorimetria
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Termodinâmica
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Dilatação Térmica
                  </li>
                </ul>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                  Começar Agora
                </Button>
              </div>
            </div>
          </Link>

          {/* Ondulatória */}
          <Link href="/ondulatoria">
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-cyan-400 cursor-pointer">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-8 text-white">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Waves className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold mb-2">Ondulatória</h3>
                <p className="text-cyan-100">Ondas e Som</p>
              </div>
              <div className="p-8">
                <ul className="space-y-3 mb-8 text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-600 rounded-full"></span>
                    Conceitos Fundamentais
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-600 rounded-full"></span>
                    Movimento Harmônico Simples
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-600 rounded-full"></span>
                    Som e Acústica
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-600 rounded-full"></span>
                    Interferência e Difração
                  </li>
                </ul>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                  Começar Agora
                </Button>
              </div>
            </div>
          </Link>

          {/* Óptica */}
          <Link href="/optica">
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-yellow-400 cursor-pointer">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-8 text-white">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Eye className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold mb-2">Óptica</h3>
              <p className="text-yellow-100">Luz e Visão</p>
            </div>
            <div className="p-8">
              <ul className="space-y-3 mb-8 text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                  Óptica Geométrica
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                  Lentes e Espelhos
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                  Refração e Reflexão
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                  Óptica Ondulatória
                </li>
              </ul>
              <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
                Começar Agora
              </Button>
            </div>
          </div>
          </Link>
        </div>

        {/* Info Box */}
        
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
