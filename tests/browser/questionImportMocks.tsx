import React, { useState, useSyncExternalStore, type ReactNode } from "react";
import {
  parseQuestionImportPayload,
  parseQuestionImportJsonText,
} from "../../shared/questionImportSchema";
const listeners = new Set<() => void>();
let version = 0;
const notify = () => {
  version++;
  listeners.forEach(fn => fn());
};
const batches: any[] = [];
function seed(name: string, n: number, image = false) {
  const parsed = parseQuestionImportPayload({
    formato: "questoes-v2",
    questoes: Array.from({ length: n }, (_, i) => ({
      chave_importacao: `${name}-${i}`,
      disciplina: "Física",
      conteudo: "Mecânica",
      assunto: "Cinemática",
      banca: "ITA",
      ano: 2026,
      dificuldade: "medio",
      enunciado: `Questão sintética ${i + 1}. Determine a velocidade.`,
      alternativas: { a: "10 m/s", b: "20 m/s" },
      resposta: "a",
      resolucao: "Dividir distância pelo tempo.",
      imagens: image
        ? [
            {
              slot_id: "fig",
              local: "enunciado",
              obrigatoria: true,
              texto_alternativo: "Diagrama",
            },
          ]
        : [],
    })),
  });
  const d = {
    id: crypto.randomUUID(),
    revision: 0,
    status: "draft",
    format: "questoes-v2",
    source_name: name,
    validation_summary: parsed.summary,
    payload: {
      questions: parsed.questoes.map(p => p.item),
      previews: parsed.questoes,
    },
    slots: image
      ? [
          {
            id: crypto.randomUUID(),
            import_key: parsed.questoes[0].item.chave_importacao,
            slot_id: "fig",
            location: "enunciado",
            required: true,
            alt_text: "Diagrama",
            status: "pending",
          },
        ]
      : [],
    progress: [] as any[],
    cleanup_pending: false,
  };
  batches.push(d);
  return d;
}
seed("Rascunho sem imagens", 4);
seed("Imagem obrigatória pendente", 1, true);
const partial = seed("Retomar parcial", 3);
partial.status = "finalizing";
partial.progress.push({
  import_key: partial.payload.questions[0].chave_importacao,
  result: { status: "criada" },
});
seed("Resposta perdida ao concluir", 1);
const clone = (d: any) => structuredClone(d);
async function act(name: string, input: any) {
  await new Promise(resolve => setTimeout(resolve, 180));
  const d = batches.find(b => b.id === input?.batchId);
  if (name === "createQuestionImportDraft") {
    const parsed = parseQuestionImportJsonText(input.rawJson),
      next = seed("Novo rascunho", 1);
    next.payload = {
      questions: parsed.questoes.map(p => p.item),
      previews: parsed.questoes,
    };
    next.validation_summary = parsed.summary;
    notify();
    return clone(next);
  }
  if (!d) throw new Error("Lote sintético não encontrado");
  if (name === "cancelQuestionImportDraft") {
    if (d.status !== "draft") throw new Error("Cancelamento bloqueado");
    d.status = "cancelled";
    d.revision++;
    notify();
    return clone(d);
  }
  if (name === "finalizeQuestionImportDraft") {
    if (d.status === "completed") return clone(d.result);
    if (d.slots.some((s: any) => s.required && s.status !== "ready"))
      throw new Error("Imagem pendente");
    d.status = "finalizing";
    d.revision++;
    const q = d.payload.questions[d.progress.length];
    if (q)
      d.progress.push({
        import_key: q.chave_importacao,
        result: { status: "criada" },
      });
    if (d.progress.length === d.payload.questions.length)
      d.status = "completed";
    d.result = {
      status: d.status,
      createdCount: d.progress.length,
      duplicatedCount: 0,
      skippedInvalidCount: 0,
      failedCount: 0,
      confirmedCount: d.progress.length,
      pendingCount: d.payload.questions.length - d.progress.length,
    };
    notify();
    if (d.source_name === "Resposta perdida ao concluir")
      throw new Error("Resposta perdida simulada: consulte o estado salvo.");
    return clone(d.result);
  }
  throw new Error(`Operação ${name} indisponível na fixture`);
}
function useMutation(name: string) {
  const [isPending, setPending] = useState(false);
  return {
    isPending,
    mutateAsync: async (input: any) => {
      setPending(true);
      try {
        return await act(name, input);
      } finally {
        setPending(false);
      }
    },
  };
}
function useQuery(name: string) {
  useSyncExternalStore(
    fn => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => version
  );
  return {
    data: name === "getQuestionSuggestions" ? [] : batches.map(clone),
    isLoading: false,
    isError: false,
    error: null,
    refetch: async () => {
      notify();
    },
  };
}
const utils = {
  client: {
    admin: {
      getQuestionImportDraft: {
        query: async ({ batchId }: { batchId: string }) =>
          clone(batches.find(d => d.id === batchId)),
      },
    },
  },
};
export const trpc = {
  useUtils: () => utils,
  admin: new Proxy({} as any, {
    get: (_, name: string) => ({
      useMutation: () => useMutation(name),
      useQuery: () => useQuery(name),
    }),
  }),
};
export const uploadToSignedStorageUrl = async () => {
  throw new Error("Envio remoto bloqueado na fixture");
};
export default function FixtureLayout({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <main className="space-y-5">
      {title && <h1 className="text-2xl font-bold">{title}</h1>}
      {children}
    </main>
  );
}
