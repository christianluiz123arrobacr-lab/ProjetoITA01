import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import ContentBlockRenderer from "../ContentBlockRenderer";
import {
  getContentPageWithBlocks,
  type ContentBlockRow,
  type ContentPageRow,
} from "@/services/contentPages.service";

export default function ContentPageRenderer({
  slug,
}: {
  slug: string;
}) {
  const [page, setPage] = useState<ContentPageRow | null>(null);
  const [blocks, setBlocks] = useState<ContentBlockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadContent() {
      try {
        setLoading(true);
        setError("");

        const data = await getContentPageWithBlocks(slug);

        if (!active) return;

        setPage(data.page);
        setBlocks(data.blocks);
      } catch (err) {
        console.error("Erro ao carregar conteúdo dinâmico:", err);
        if (!active) return;
        setError("Não foi possível carregar esta página no momento.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadContent();

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="theme-page min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 px-6 py-5 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
          <p className="text-slate-700 font-medium">Carregando conteúdo...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="theme-page min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg border border-red-200 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h2 className="text-xl font-bold text-red-700 mb-2">Erro ao carregar página</h2>
              <p className="text-red-600">{error || "Página não encontrada."}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-page min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <header className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 mb-3">
              {page.subject || "Conteúdo"}
            </p>

            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-3">
              {page.title}
            </h1>

            {page.description ? (
              <p className="text-slate-600 text-lg leading-relaxed">{page.description}</p>
            ) : null}
          </div>
        </header>

        <main className="space-y-6">
          {blocks.map((block) => (
            <ContentBlockRenderer key={block.id} block={block} />
          ))}
        </main>
      </div>
    </div>
  );
}
