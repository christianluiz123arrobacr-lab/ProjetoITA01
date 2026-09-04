import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  BookOpen,
  Beaker,
  ArrowRight,
  BarChart3,
  BookMarked,
  Zap,
  List,
  LogIn,
  Trophy,
  BrainCircuit,
  UserCircle2,
  CreditCard,
  BadgeCheck,
  ChevronDown,
  Layers3,
} from "lucide-react";

export default function LandingPage() {
  const { isAuthenticated, loading } = useSupabaseAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="theme-page min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Bar */}
      <div className="w-full px-5 pt-5 sm:px-8 sm:pt-6 lg:px-10">
        <div className="flex justify-end">
          {loading ? (
            <Button
              disabled
              className="bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-300 font-semibold px-6 py-2 rounded-full flex items-center gap-2 cursor-wait"
            >
              Carregando...
            </Button>
          ) : isAuthenticated ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((current) => !current)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white dark:bg-blue-600 flex items-center justify-center">
                  <UserCircle2 className="w-5 h-5" />
                </div>

                <span className="hidden sm:inline text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Conta
                </span>

                <ChevronDown
                  className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${
                    profileMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg z-50 dark:border-slate-700 dark:bg-slate-900">
                  <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Minha conta
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Gerencie seu perfil e assinatura
                    </p>
                  </div>

                  <div className="py-2 space-y-1">
                    <Link href="/perfil">
                      <button
                        type="button"
                        onClick={() => setProfileMenuOpen(false)}
                        className="w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <UserCircle2 className="w-4 h-4 text-slate-500" />
                        Ver perfil
                      </button>
                    </Link>

                    <Link href="/minha-assinatura">
                      <button
                        type="button"
                        onClick={() => setProfileMenuOpen(false)}
                        className="w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <BadgeCheck className="w-4 h-4 text-emerald-600" />
                        Minha assinatura
                      </button>
                    </Link>

                    <Link href="/planos">
                      <button
                        type="button"
                        onClick={() => setProfileMenuOpen(false)}
                        className="w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <CreditCard className="w-4 h-4 text-cyan-600" />
                        Ver planos
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2 rounded-full flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <section className="px-6 pb-14 pt-4 text-center sm:pt-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Projeto Vetor</p>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4 tracking-tight">
          <span className="font-bold">Domine Exatas</span>
          <span className="text-slate-600 dark:text-slate-300 font-normal">
            {" "}
            para vestibulares e{" "}
          </span>
          <span className="font-bold">concursos militares</span>
        </h1>

        <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto">
          Teoria, questões, simulados e resolução inteligente em um só lugar.
        </p>

        <div className="flex gap-3 justify-center flex-wrap mb-6">
          <Link href="/fisica">
            <Button className="vetor-action-primary font-bold py-3 px-7 rounded-lg text-base shadow-sm">
              Explorar disciplinas <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>

          <Link href="/banco-de-questoes">
            <Button className="vetor-action-secondary font-bold py-3 px-7 rounded-lg text-base">
              Acessar banco de questões <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>

        </div>

        <div className="mx-auto grid max-w-2xl grid-cols-3 gap-2 text-sm">
          <Link href="/progress"><a className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-300"><BarChart3 className="h-4 w-4" />Progresso</a></Link>
          <Link href="/ranking"><a className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-300"><Trophy className="h-4 w-4" />Ranking</a></Link>
          <Link href="/vet"><a className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-semibold text-slate-700 transition hover:border-violet-200 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-violet-500 dark:hover:text-violet-300"><BrainCircuit className="h-4 w-4" />VET</a></Link>
        </div>
      </section>

      {/* Disciplinas */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-5">
          {/* Matemática */}
          <div className="vetor-surface overflow-hidden border-blue-100 dark:border-blue-900">
            <div className="bg-blue-50 p-8 text-slate-900 min-h-56 flex flex-col justify-between dark:bg-blue-950/50 dark:text-slate-100">
              <div>
                <Calculator className="w-9 h-9 mb-5 text-blue-600" />
                <h3 className="text-3xl font-bold mb-3">Matemática</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  Álgebra, geometria, trigonometria, funções e cálculo
                  estratégico
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300"><span>Em desenvolvimento</span></div>
            </div>
          </div>

          {/* Física */}
          <div className="vetor-surface overflow-hidden transition hover:-translate-y-0.5 hover:border-violet-200 dark:border-violet-900">
            <div className="bg-violet-50 p-8 text-slate-900 min-h-56 flex flex-col justify-between dark:bg-violet-950/50 dark:text-slate-100">
              <div>
                <BookOpen className="w-9 h-9 mb-5 text-violet-600" />
                <h3 className="text-3xl font-bold mb-3">Física</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  Mecânica, termologia, ondulatória, óptica, eletricidade e
                  moderna
                </p>
              </div>
            </div>

            <div className="p-6">
              <Link href="/fisica">
                <Button className="w-full vetor-action-primary font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                  Explorar Física <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Química */}
          <div className="vetor-surface overflow-hidden border-amber-100 dark:border-amber-900">
            <div className="bg-amber-50 p-8 text-slate-900 min-h-56 flex flex-col justify-between dark:bg-amber-950/40 dark:text-slate-100">
              <div>
                <Beaker className="w-9 h-9 mb-5 text-amber-600" />
                <h3 className="text-3xl font-bold mb-3">Química</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  Geral, físico-química, orgânica e questões de alto nível
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"><span>Em desenvolvimento</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Banco de Questões */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-blue-700 bg-blue-700 p-8 md:p-10 text-white shadow-lg overflow-hidden relative">

            <div className="grid md:grid-cols-2 gap-12 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10"><Layers3 className="h-5 w-5" /></div>
                  <h3 className="text-3xl font-bold">
                    Banco de Questões
                  </h3>
                </div>

                <p className="text-lg text-blue-100 mb-8 leading-relaxed">
                  Resolva questões de Matemática, Física e Química com filtros
                  por prova, assunto, ano e dificuldade.
                </p>

                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <List className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-base">
                      Questões comentadas
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-base">
                      Análise de desempenho
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <BookMarked className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-base">
                      Caderno de erros
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Zap className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-base">
                      Simulados estratégicos
                    </span>
                  </div>
                </div>

                <Link href="/banco-de-questoes">
                  <Button className="bg-white hover:bg-blue-50 text-blue-800 font-bold py-3 px-7 rounded-lg flex items-center gap-2 text-base">
                    Começar Agora <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>

              <div className="hidden md:flex items-center justify-center relative h-80">
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-80 h-56 bg-white rounded-xl shadow-lg border border-white overflow-hidden z-10">
                    <div className="bg-slate-50 h-full p-6 text-sm text-slate-700 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                          <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                          <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                        </div>

                        <div className="text-xs font-semibold text-slate-400">
                          Questões
                        </div>

                        <div className="w-4 h-4 bg-slate-300 rounded"></div>
                      </div>

                      <div className="mb-4">
                        <div className="font-bold text-slate-900 text-sm mb-3">
                          Um móvel percorre 120 m em 6 s com velocidade
                          constante. Qual é sua velocidade?
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            id="opt1"
                            className="w-4 h-4 cursor-pointer"
                          />
                          <label
                            htmlFor="opt1"
                            className="text-sm cursor-pointer"
                          >
                            A: 10 m/s
                          </label>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            id="opt2"
                            className="w-4 h-4 cursor-pointer"
                            defaultChecked
                          />
                          <label
                            htmlFor="opt2"
                            className="text-sm font-semibold cursor-pointer"
                          >
                            B: 20 m/s
                          </label>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            id="opt3"
                            className="w-4 h-4 cursor-pointer"
                          />
                          <label
                            htmlFor="opt3"
                            className="text-sm cursor-pointer"
                          >
                            C: 80 m/s
                          </label>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            id="opt4"
                            className="w-4 h-4 cursor-pointer"
                          />
                          <label
                            htmlFor="opt4"
                            className="text-sm cursor-pointer"
                          >
                            D: 40 m/s
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20">
                    <div className="w-48 h-80 bg-slate-900 rounded-2xl shadow-lg border-4 border-slate-900 overflow-hidden relative">
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-slate-950 rounded-b-3xl z-50"></div>

                      <div className="bg-blue-600 h-full p-4 flex flex-col justify-between text-white">
                        <div className="flex justify-between items-center text-xs mt-3 px-2">
                          <span className="font-bold text-sm">9:41</span>
                          <div className="flex gap-1">
                            <div className="w-1.5 h-2.5 bg-white rounded-sm"></div>
                            <div className="w-1.5 h-2.5 bg-white rounded-sm"></div>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                          <BookMarked className="mb-3 h-8 w-8" />
                          <div className="font-bold text-base mb-2">
                            Questões
                          </div>
                          <div className="text-xs opacity-75 leading-tight">
                            <div>Filtros</div>
                            <div>avançados</div>
                            <div>por prova</div>
                          </div>
                        </div>

                        <div className="h-1 bg-white/30 rounded-full mb-3 mx-auto w-8"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
