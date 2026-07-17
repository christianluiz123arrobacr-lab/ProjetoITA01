import { ArrowLeft, Box } from "lucide-react";
import { Link } from "wouter";
import { SpatialGeometrySimulator } from "@/components/simulators/SpatialGeometrySimulator";
import { Button } from "@/components/ui/button";

export default function SpatialGeometrySimulatorPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                Matemática
              </p>
              <h1 className="text-xl font-black text-slate-950 sm:text-2xl">
                Geometria Espacial 3D
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Explore sólidos, medidas, cortes, planificações e relações de
                inscrição.
              </p>
            </div>
          </div>

          <Link href="/simuladores">
            <Button
              variant="outline"
              className="w-full gap-2 rounded-2xl sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para simuladores
            </Button>
          </Link>
        </header>

        <SpatialGeometrySimulator initialFullscreen={false} />
      </div>
    </main>
  );
}
