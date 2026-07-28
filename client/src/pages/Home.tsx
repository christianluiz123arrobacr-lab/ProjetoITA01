import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BookOpen,
  Zap,
  Target,
  MessageCircle,
  ArrowLeft,
  Play,
  BarChart3,
  Calculator,
  HelpCircle,
  TrendingUp,
  Activity,
  RotateCw,
  Compass,
} from "lucide-react";
import { Link } from "wouter";
import { InteractiveQuiz } from "@/components/InteractiveQuiz";
import { getQuestions } from "@/services/questions.service";
import type { Question } from "@/types/question";

export default function Home() {
  let { user, loading, error, isAuthenticated, logout } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    async function load() {
      const data = await getQuestions({
        subject: "fisica",
        topic: "cinematica",
      });
      setQuestions(data);
    }

    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Cinemática</h1>
              <p className="text-xs text-slate-500">Projeto Vetor</p>
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent" />
        <div className="container py-16 md:py-24 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
                  Entenda o{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Movimento
                  </span>
                </h2>
                <p className="text-xl text-slate-600">
                  Explore a cinemática: como os objetos se movem, as fórmulas que
                  descrevem o movimento e as aplicações práticas no mundo real.
                </p>
              </div>

              <div className="flex gap-4 flex-wrap">
                <Link href="/cinematica/learn">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                  >
                    Começar a Aprender
                  </Button>
                </Link>

                <Link href="/cinematica/simulator">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-blue-300 hover:bg-blue-50"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Simulador Visual
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/images/hero_cinematica.png"
                alt="Cinemática"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container py-12">
        {/* Ferramentas de Aprendizado - Navigation Cards */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-slate-900 mb-8">
            Ferramentas de Aprendizado
          </h3>

          <div className="grid md:grid-cols-6 gap-4">
            <div className="group">
              <Link href="/cinematica/learn">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-400">
                  <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Guia Completo</h3>
                  <p className="text-xs text-slate-600 mt-1">Explicações detalhadas</p>
                </Card>
              </Link>
            </div>

            <div className="group">
              <Link href="/cinematica/calculator">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-400">
                  <Calculator className="w-8 h-8 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Calculadora</h3>
                  <p className="text-xs text-slate-600 mt-1">Calcule qualquer variável</p>
                </Card>
              </Link>
            </div>

            <div className="group">
              <Link href="/cinematica/formulas">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-400">
                  <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Fórmulas</h3>
                  <p className="text-xs text-slate-600 mt-1">Derivações completas</p>
                </Card>
              </Link>
            </div>

            <div className="group">
              <Link href="/cinematica/quiz-new">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-400">
                  <HelpCircle className="w-8 h-8 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Quiz</h3>
                  <p className="text-xs text-slate-600 mt-1">Teste seu conhecimento</p>
                </Card>
              </Link>
            </div>

            <div className="group">
              <Link href="/cinematica/graphs-new">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-400">
                  <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Gráficos</h3>
                  <p className="text-xs text-slate-600 mt-1">Visualizações dinâmicas</p>
                </Card>
              </Link>
            </div>

            <div className="group">
              <Link href="/cinematica/simulator">
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-400">
                  <Play className="w-8 h-8 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900">Simulador</h3>
                  <p className="text-xs text-slate-600 mt-1">Animações interativas</p>
                </Card>
              </Link>
            </div>
          </div>
        </div>

        {/* Banco de Questões */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-slate-900 mb-8">
            🔥 Pratique com Questões Reais
          </h3>
          <InteractiveQuiz questions={questions} />
        </div>

        {/* Tópicos Principais */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-slate-900 mb-8">
            Tópicos Principais
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Bases da Cinemática */}
            <Link href="/cinematica/topic/bases">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-blue-500 cursor-pointer hover:border-blue-700">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Compass className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">
                      Bases da Cinemática
                    </h4>
                    <p className="text-slate-600 mb-4 text-sm">
                      Os fundamentos essenciais: referencial, trajetória e a distinção
                      entre deslocamento (
                      <span className="font-mono text-blue-700">Δs</span>) e distância
                      percorrida.
                    </p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Referencial e Movimento Relativo
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Ponto Material vs. Corpo Extenso
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Espaço, Deslocamento e Trajetória
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Velocidade e Aceleração */}
            <Link href="/cinematica/topic/velocidade">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-blue-500 cursor-pointer hover:border-blue-700">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">
                      Velocidade e Aceleração
                    </h4>
                    <p className="text-slate-600 mb-4 text-sm">
                      Análise das taxas de variação: como a posição muda no tempo e
                      como a velocidade evolui.
                    </p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Velocidade Média e Instantânea
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Aceleração Escalar e Vetorial
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Movimentos Acelerados e Retardados
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Movimento Retilíneo Uniforme */}
            <Link href="/cinematica/topic/mru">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-blue-500 cursor-pointer hover:border-blue-700">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">
                      Movimento Retilíneo Uniforme
                    </h4>
                    <p className="text-slate-600 mb-4 text-sm">
                      O movimento com velocidade constante, descrito pela função
                      horária <span className="font-mono text-blue-700">s = s₀ + vt</span>{" "}
                      e suas propriedades gráficas.
                    </p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Equação Horária do Espaço
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Gráficos e Interpretação de Áreas
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Problemas de Encontro e Perseguição
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Movimento Uniformemente Variado */}
            <Link href="/cinematica/topic/mruv">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-blue-500 cursor-pointer hover:border-blue-700">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">
                      Movimento Uniformemente Variado
                    </h4>
                    <p className="text-slate-600 mb-4 text-sm">
                      Aceleração constante e velocidade linear: de Torricelli à função
                      horária do segundo grau.
                    </p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Equações Fundamentais e Deduções
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Equação de Torricelli
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Gráficos e Propriedades da Parábola
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Movimento Circular Uniforme */}
            <Link href="/cinematica/topic/mcu">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-blue-500 cursor-pointer hover:border-blue-700">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <RotateCw className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">
                      Movimento Circular Uniforme
                    </h4>
                    <p className="text-slate-600 mb-4 text-sm">
                      Trajetórias curvas com velocidade constante em módulo: período,
                      frequência e aceleração centrípeta.
                    </p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Período (T) e Frequência (f)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Velocidade Angular (ω) e Tangencial
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Aceleração Centrípeta e Transmissão
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Cinemática Vetorial e Relativa */}
            <Link href="/cinematica/topic/vetorial">
              <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-blue-500 cursor-pointer hover:border-blue-700">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">
                      Cinemática Vetorial e Relativa
                    </h4>
                    <p className="text-slate-600 mb-4 text-sm">
                      A visão de elite: composição de movimentos, vetores posição e o
                      Princípio de Galileu.
                    </p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Vetores Velocidade e Aceleração
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Composição de Movimentos
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        Movimento Relativo e Vínculos
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
