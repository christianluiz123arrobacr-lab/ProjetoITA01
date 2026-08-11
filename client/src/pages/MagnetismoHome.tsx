import { Card } from "@/components/ui/card";
import { BookOpen, MessageCircle, ArrowLeft, Play, BarChart3, Calculator, HelpCircle, TrendingUp, Magnet } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function MagnetismoHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/fisica-iii" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <Magnet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Magnetismo</h1>
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
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-rose-600/5 to-transparent" />
        <div className="container py-16 md:py-24 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
                  Domine o <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">Magnetismo</span>
                </h2>
                <p className="text-xl text-slate-600">
                  Explore os fenômenos magnéticos: campo magnético, força de Lorentz, indução eletromagnética e equações de Maxwell com rigor matemático e aplicações práticas.
                </p>
              </div>
              <div className="flex gap-4 flex-wrap">
                <Link href="/magnetismo/topic/forca-magnetica">
                  <Button size="lg" className="bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white">
                    Começar a Aprender
                  </Button>
                </Link>
                <Link href="/magnetismo/simulator">
                  <Button size="lg" variant="outline" className="border-red-300 hover:bg-red-50">
                    <Play className="w-4 h-4 mr-2" />
                    Simulador Visual
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl bg-slate-900 flex items-center justify-center">
              {/* Placeholder for banner image */}
              <Magnet className="w-32 h-32 text-red-500 animate-pulse" />
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
              <Link href="/magnetismo/topic/forca-magnetica">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-red-400">
                  <BookOpen className="w-8 h-8 text-red-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Guia Completo</h3>
                  <p className="text-xs text-slate-600 mt-1">Explicações detalhadas</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/magnetismo/simulator">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-red-400">
                  <Calculator className="w-8 h-8 text-red-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Calculadora</h3>
                  <p className="text-xs text-slate-600 mt-1">Calcule qualquer variável</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/magnetismo/topic/forca-magnetica">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-red-400">
                  <BarChart3 className="w-8 h-8 text-red-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Fórmulas</h3>
                  <p className="text-xs text-slate-600 mt-1">Derivações completas</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/magnetismo/quiz">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-red-400">
                  <HelpCircle className="w-8 h-8 text-red-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Quiz</h3>
                  <p className="text-xs text-slate-600 mt-1">Teste seu conhecimento</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/magnetismo/graphs">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-red-400">
                  <TrendingUp className="w-8 h-8 text-red-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Gráficos</h3>
                  <p className="text-xs text-slate-600 mt-1">Visualizações dinâmicas</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/magnetismo/simulator">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-red-400">
                  <Play className="w-8 h-8 text-red-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
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
            <Link href="/magnetismo/topic/forca-magnetica">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-red-500 cursor-pointer hover:border-red-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🧲</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Campo e Força Magnética</h4>
                    <p className="text-slate-600 mb-4">Força de Lorentz, movimento de cargas em campos magnéticos e força sobre correntes.</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                        Vetor Campo Magnético
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                        Força de Lorentz
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                        Movimento de Cargas (Ciclotron)
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>
            
            <Link href="/magnetismo/topic/fontes-campo">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-red-500 cursor-pointer hover:border-red-700 opacity-60">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🌀</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Fontes de Campo (Em Breve)</h4>
                    <p className="text-slate-600 mb-4">Lei de Biot-Savart e Lei de Ampère para cálculo de campos.</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                        Lei de Biot-Savart
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                        Lei de Ampère
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
