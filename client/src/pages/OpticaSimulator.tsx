import { Link } from "wouter";
import { ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefractionSimulator } from "@/components/RefractionSimulator";
import { MirrorsSimulator } from "@/components/MirrorsSimulator";
import { LensesSimulator } from "@/components/LensesSimulator";

export default function OpticaSimulator() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
        <div className="container flex items-center justify-between gap-4 py-4">
          <Link
            href="/optica"
            className="flex items-center gap-2 text-slate-600 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-sm">
              <Eye className="h-6 w-6 text-white" />
            </div>

            <div className="text-right sm:text-left">
              <h1 className="text-lg font-bold text-slate-900 sm:text-2xl">
                Simuladores de Óptica
              </h1>
              <p className="text-xs text-slate-600 sm:text-sm">
                Refração, espelhos e lentes no padrão visual novo
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="container py-6 md:py-10">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              Refração
            </p>
            <h2 className="mt-2 text-lg font-black text-slate-900">
              Lei de Snell
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Analise mudança de meio, desvio do raio, ângulo crítico e reflexão
              total interna.
            </p>
          </Card>

          <Card className="border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Reflexão
            </p>
            <h2 className="mt-2 text-lg font-black text-slate-900">
              Espelhos esféricos
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Veja foco, centro, raios principais, natureza da imagem e aumento
              linear.
            </p>
          </Card>

          <Card className="border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-600">
              Sistemas ópticos
            </p>
            <h2 className="mt-2 text-lg font-black text-slate-900">
              Lentes delgadas
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Trabalhe com lentes convergentes, divergentes, potência em
              dioptrias e formação de imagens.
            </p>
          </Card>
        </div>

        <Card className="mb-6 border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                Óptica geométrica
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Simule os principais fenômenos de luz
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Use os controles para alterar os dados e observe como os raios,
                imagens e equações mudam automaticamente. A luz anda em linha
                reta, mas a prova faz questão de entortar sua paz.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-bold text-slate-900">Padrão:</span>{" "}
              controles + visualização + resultados + equações
            </div>
          </div>
        </Card>

        <Tabs defaultValue="refracao" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-2 rounded-2xl bg-slate-100 p-2 sm:grid-cols-3">
            <TabsTrigger value="refracao" className="py-3 text-sm font-bold">
              Refração
            </TabsTrigger>

            <TabsTrigger value="espelhos" className="py-3 text-sm font-bold">
              Espelhos
            </TabsTrigger>

            <TabsTrigger value="lentes" className="py-3 text-sm font-bold">
              Lentes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="refracao" className="mt-6">
            <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-xl font-black text-slate-900">
                  Refração da luz
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Lei de Snell-Descartes, desvio do raio e reflexão total.
                </p>
              </div>

              <div className="p-4 md:p-6">
                <RefractionSimulator />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="espelhos" className="mt-6">
            <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-xl font-black text-slate-900">
                  Espelhos esféricos
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Espelho côncavo, convexo, equação de Gauss e aumento linear.
                </p>
              </div>

              <div className="p-4 md:p-6">
                <MirrorsSimulator />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="lentes" className="mt-6">
            <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-xl font-black text-slate-900">
                  Lentes esféricas delgadas
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Lentes convergentes, divergentes, potência e formação de
                  imagens.
                </p>
              </div>

              <div className="p-4 md:p-6">
                <LensesSimulator />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
