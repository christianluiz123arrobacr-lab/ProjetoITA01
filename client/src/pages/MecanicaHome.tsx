import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Zap, BarChart3, Brain } from "lucide-react";

export default function MecanicaHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-cyan-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Mecânica - Nível ITA/IME</h1>
              <p className="text-xs text-slate-600">Física I</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12 max-w-6xl">
        
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-lg p-12 mb-12 border border-slate-200">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Mecânica: O Movimento e as Forças</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Explore os fundamentos da Mecânica em nível ITA/IME com explicações rigorosas, 
            exemplos de questões militares (ESPCEX, EFOMM, EEAR, AFA) e simuladores interativos.
          </p>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          
          {/* Cinemática */}
          <Link href="/mecanica/topic/cinematica">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer h-full">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Cinemática</h3>
              <p className="text-slate-600 mb-4">
                MRU, MRUV, Lançamentos e Movimento Circular Uniforme com análise completa.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">MRU</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">MRUV</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Lançamentos</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">MCU</span>
              </div>
            </div>
          </Link>

          {/* Dinâmica */}
          <Link href="/mecanica/topic/dinamica">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200 hover:shadow-xl hover:border-red-300 transition-all cursor-pointer h-full">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Dinâmica</h3>
              <p className="text-slate-600 mb-4">
                Leis de Newton, Forças Especiais e Aplicações Práticas com exemplos militares.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">Leis de Newton</span>
                <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">Forças</span>
                <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">Atrito</span>
              </div>
            </div>
          </Link>

          {/* Gravitação */}
          <div className="bg-slate-100 rounded-2xl shadow-lg p-8 border border-slate-300 opacity-50">
            <div className="w-12 h-12 bg-slate-300 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Gravitação</h3>
            <p className="text-slate-600 mb-4">
              Em breve: Órbitas, Satélites e Leis de Kepler
            </p>
            <Button disabled className="w-full">Em Desenvolvimento</Button>
          </div>

          {/* Estática */}
          <div className="bg-slate-100 rounded-2xl shadow-lg p-8 border border-slate-300 opacity-50">
            <div className="w-12 h-12 bg-slate-300 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Estática</h3>
            <p className="text-slate-600 mb-4">
              Em breve: Equilíbrio, Torque e Centro de Massa
            </p>
            <Button disabled className="w-full">Em Desenvolvimento</Button>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">📚 Padrão de Excelência</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-bold text-slate-900 mb-2">✅ 100% em LaTeX</h4>
              <p className="text-slate-700 text-sm">Todas as fórmulas e explicações em notação matemática rigorosa.</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2">🎯 Exemplos Militares</h4>
              <p className="text-slate-700 text-sm">Questões reais de ESPCEX, EFOMM, EEAR e AFA com resolução completa.</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2">🚀 Nível ITA/IME</h4>
              <p className="text-slate-700 text-sm">Explicações profundas com análise crítica e variações completas.</p>
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
