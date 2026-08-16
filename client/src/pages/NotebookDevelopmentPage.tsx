import { ArrowLeft, Construction, NotebookPen } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { NOTEBOOK_DEVELOPMENT_MESSAGE } from "@shared/featureAvailability";

export default function NotebookDevelopmentPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-lg rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Construction className="h-8 w-8" />
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-blue-700">
          <NotebookPen className="h-4 w-4" /> Caderno
        </div>
        <h1 className="mt-3 text-2xl font-black text-slate-950">Em desenvolvimento</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {NOTEBOOK_DEVELOPMENT_MESSAGE} Estamos preparando uma experiência de escrita mais estável e completa.
        </p>
        <Link href="/plataforma">
          <Button className="mt-6"><ArrowLeft className="mr-2 h-4 w-4" />Voltar para a plataforma</Button>
        </Link>
      </section>
    </main>
  );
}
