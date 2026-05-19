import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import { Link } from "wouter";
import { MRUSimulator } from "@/components/MRUSimulator";
import { MRUVSimulator } from "@/components/MRUVSimulator";
import { FreeFallSimulator } from "@/components/FreeFallSimulator";
import { CircularMotionSimulator } from "@/components/CircularMotionSimulator";
import { DynamicsLaunchSimulator } from "@/components/DynamicsLaunchSimulator";

export default function CinematicaSimulator() {
  const [isRunning, setIsRunning] = useState(true);
  const [resetTrigger, setResetTrigger] = useState(0);

  const handleReset = () => {
    setIsRunning(true);
    setResetTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container py-4 flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>

          <h1 className="text-lg sm:text-2xl font-bold text-slate-900">
            Simulador de Cinemática
          </h1>
        </div>
      </header>

      <section className="container py-6 md:py-12">
        <Tabs defaultValue="mru" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-4 sm:mb-8 gap-1 sm:gap-0 h-auto">
            <TabsTrigger value="mru" className="text-xs sm:text-sm">
              MRU
            </TabsTrigger>

            <TabsTrigger value="mruv" className="text-xs sm:text-sm">
              MRUV
            </TabsTrigger>

            <TabsTrigger
              value="freefall"
              className="text-xs sm:text-sm hidden sm:inline-flex"
            >
              Queda
            </TabsTrigger>

            <TabsTrigger value="circular" className="text-xs sm:text-sm">
              Circular
            </TabsTrigger>

            <TabsTrigger
              value="launch"
              className="text-xs sm:text-sm hidden lg:inline-flex"
            >
              Lançamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mru">
            <Card className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  Movimento Retilíneo Uniforme (MRU)
                </h3>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsRunning(!isRunning)}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    {isRunning ? (
                      <Pause className="w-4 h-4 mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    {isRunning ? "Pausar" : "Iniciar"}
                  </Button>

                  <Button onClick={handleReset} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Resetar
                  </Button>
                </div>
              </div>

              <MRUSimulator
                isRunning={isRunning}
                resetTrigger={resetTrigger}
              />
            </Card>
          </TabsContent>

          <TabsContent value="mruv">
            <Card className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  Movimento Retilíneo Uniformemente Variado (MRUV)
                </h3>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsRunning(!isRunning)}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    {isRunning ? (
                      <Pause className="w-4 h-4 mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    {isRunning ? "Pausar" : "Iniciar"}
                  </Button>

                  <Button onClick={handleReset} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Resetar
                  </Button>
                </div>
              </div>

              <MRUVSimulator
                isRunning={isRunning}
                resetTrigger={resetTrigger}
              />
            </Card>
          </TabsContent>

          <TabsContent value="freefall">
            <Card className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  Queda Livre
                </h3>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsRunning(!isRunning)}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    {isRunning ? (
                      <Pause className="w-4 h-4 mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    {isRunning ? "Pausar" : "Iniciar"}
                  </Button>

                  <Button onClick={handleReset} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Resetar
                  </Button>
                </div>
              </div>

              <FreeFallSimulator
                isRunning={isRunning}
                resetTrigger={resetTrigger}
              />
            </Card>
          </TabsContent>

          <TabsContent value="circular">
            <Card className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  Movimento Circular Uniforme (MCU)
                </h3>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsRunning(!isRunning)}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    {isRunning ? (
                      <Pause className="w-4 h-4 mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    {isRunning ? "Pausar" : "Iniciar"}
                  </Button>

                  <Button onClick={handleReset} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Resetar
                  </Button>
                </div>
              </div>

              <CircularMotionSimulator
                isRunning={isRunning}
                resetTrigger={resetTrigger}
              />
            </Card>
          </TabsContent>

          <TabsContent value="launch">
            <Card className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  Lançamentos
                </h3>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsRunning(!isRunning)}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    {isRunning ? (
                      <Pause className="w-4 h-4 mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    {isRunning ? "Pausar" : "Iniciar"}
                  </Button>

                  <Button onClick={handleReset} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Resetar
                  </Button>
                </div>
              </div>

              <DynamicsLaunchSimulator
                isRunning={isRunning}
                resetTrigger={resetTrigger}
              />
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
