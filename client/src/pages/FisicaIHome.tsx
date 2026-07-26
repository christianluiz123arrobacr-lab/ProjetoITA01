import { Link } from "wouter";
import { ArrowLeft, BookOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FisicaIHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      {/* Header */}
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Física I - Mecânica</h1>
                <p className="text-xs text-slate-600">Cinemática, Dinâmica e Estática</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Bem-vindo à Física I
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Estude os fundamentos da Mecânica com explicações didáticas, simuladores interativos e ferramentas de aprendizado.
          </p>
        </div>

        {/* Disciplinas */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Cinemática */}
          <Link href="/cinematica">
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-blue-400 cursor-pointer">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 text-white">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold mb-2">Cinemática</h3>
                <p className="text-blue-100">O estudo do movimento</p>
              </div>
              <div className="p-8">
                <ul className="space-y-3 mb-8 text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    Velocidade e Aceleração
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    Movimento Retilíneo
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    Movimento Circular
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    Queda Livre
                  </li>
                </ul>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Explorar
                </Button>
              </div>
            </div>
          </Link>

          {/* Dinâmica */}
          <Link href="/dinamica">
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-purple-400 cursor-pointer">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-8 text-white">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold mb-2">Dinâmica</h3>
                <p className="text-purple-100">As causas do movimento</p>
              </div>
              <div className="p-8">
                <ul className="space-y-3 mb-8 text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Leis de Newton
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Força e Atrito
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Trabalho e Energia
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Momentum e Impulso
                  </li>
                </ul>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Explorar
                </Button>
              </div>
            </div>
          </Link>

          {/* Estática */}
          <Link href="/estatica">
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-amber-400 cursor-pointer">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-8 text-white">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold mb-2">Estática</h3>
                <p className="text-amber-100">O equilíbrio dos corpos</p>
              </div>
              <div className="p-8">
                <ul className="space-y-3 mb-8 text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                    Equilíbrio de Forças
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                    Torque e Momento
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                    Máquinas Simples
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                    Hidrostática
                  </li>
                </ul>
                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                  Explorar
                </Button>
              </div>
            </div>
          </Link>
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
