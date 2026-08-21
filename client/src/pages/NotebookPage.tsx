import { useState } from "react";
import {
  Cloud,
  MoreVertical,
  NotebookPen,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  validateNotebookName,
  type NotebookPaperSize,
} from "@/lib/notebookDocument";

export default function NotebookPage() {
  const utils = trpc.useUtils();
  const status = trpc.googleDrive.status.useQuery();
  const driveReady = status.data?.connected === true && status.data.requiresReconnect !== true;
  const notebooks = trpc.notebooks.list.useQuery(undefined, {
    enabled: driveReady,
    retry: false,
  });
  const connect = trpc.googleDrive.connectUrl.useQuery(undefined, {
    enabled: false,
  });
  const create = trpc.notebooks.create.useMutation({
    onSuccess: data => {
      void utils.notebooks.list.invalidate();
      window.location.href = `/caderno/${data.id}`;
    },
  });
  const rename = trpc.notebooks.rename.useMutation({
    onSuccess: () => void utils.notebooks.list.invalidate(),
  });
  const remove = trpc.notebooks.delete.useMutation({
    onSuccess: () => void utils.notebooks.list.invalidate(),
  });
  const [dialog, setDialog] = useState(false);
  const [name, setName] = useState("");
  const [paper, setPaper] = useState<NotebookPaperSize>("a4");
  const validation = validateNotebookName(name);
  const connectDrive = async () => {
    const result = await connect.refetch();
    if (result.data?.url) window.location.href = result.data.url;
  };
  if (status.isLoading)
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <p className="text-slate-600">Verificando Google Drive...</p>
      </main>
    );
  if (
    status.isError ||
    new URLSearchParams(window.location.search).get("drive") === "error"
  )
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <section className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <Cloud className="mx-auto h-12 w-12 text-rose-500" />
          <h1 className="mt-4 text-xl font-black">
            Não foi possível acessar seu Google Drive agora.
          </h1>
          <p className="mt-2 text-slate-600">
            Verifique sua conexão ou reconecte sua conta.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="outline" onClick={() => status.refetch()}>
              Tentar novamente
            </Button>
            <Button onClick={connectDrive}>Reconectar Google Drive</Button>
          </div>
        </section>
      </main>
    );
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <NotebookPen />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                Área pessoal
              </p>
              <h1 className="text-3xl font-black text-slate-950">
                Meu caderno
              </h1>
              <p className="mt-1 text-slate-600">
                Crie folhas para resolver questões, estudar e organizar suas
                anotações.
              </p>
            </div>
          </div>
          {driveReady && (
            <Button onClick={() => setDialog(true)} className="rounded-2xl">
              <Plus className="mr-2 h-4 w-4" />
              Novo caderno
            </Button>
          )}
        </header>
        {status.data?.requiresReconnect ? (
          <section className="rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
            <Cloud className="mx-auto h-14 w-14 text-amber-500" />
            <h2 className="mt-4 text-2xl font-black">Reconecte seu Google Drive</h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-600">
              Precisamos da nova permissão para manter o caderno editável na área privada do aplicativo. Seus arquivos antigos não serão apagados.
            </p>
            <Button onClick={connectDrive} className="mt-6 rounded-2xl">Reconectar Google Drive</Button>
          </section>
        ) : !status.data?.connected ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Cloud className="mx-auto h-14 w-14 text-blue-500" />
            <h2 className="mt-4 text-2xl font-black">
              Conecte seu Google Drive
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-600">
              Seus cadernos editáveis ficam na área privada do Projeto Vetor no Google Drive. Somente PDFs exportados aparecem na pasta visível.
            </p>
            <Button onClick={connectDrive} className="mt-6 rounded-2xl">
              Conectar Google Drive
            </Button>
          </section>
        ) : notebooks.isError ? (
          <section className="rounded-3xl border border-rose-200 bg-white p-8 text-center">
            <p className="font-semibold text-rose-700">
              Não foi possível acessar seu Google Drive agora. Verifique sua
              conexão ou reconecte sua conta.
            </p>
            <Button
              variant="outline"
              onClick={() => notebooks.refetch()}
              className="mt-4"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </section>
        ) : notebooks.data?.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <NotebookPen className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-lg font-bold">
              Você ainda não criou nenhum caderno.
            </p>
            <Button onClick={() => setDialog(true)} className="mt-4">
              Criar primeiro caderno
            </Button>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {notebooks.data?.map(item => (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex justify-between">
                  <NotebookPen className="h-7 w-7 text-blue-600" />
                  <button
                    aria-label={`Opções de ${item.name}`}
                    title="Renomear"
                    onClick={() => {
                      const next = window.prompt("Novo nome", item.name);
                      if (next) {
                        const checked = validateNotebookName(next);
                        if (checked.valid)
                          rename.mutate({
                            documentId: item.id,
                            name: checked.name,
                          });
                      }
                    }}
                  >
                    <MoreVertical />
                  </button>
                </div>
                <h2 className="mt-4 truncate text-lg font-black">
                  {item.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Atualizado em{" "}
                  {new Date(item.modifiedTime).toLocaleString("pt-BR")}
                </p>
                <p className="mt-1 text-xs font-bold uppercase text-cyan-700">
                  {item.paper.size} •{" "}
                  {item.paper.lined ? "com linhas" : "sem linhas"} • Salvo no
                  Drive
                </p>
                <div className="mt-5 flex gap-2">
                  <Link href={`/caderno/${item.id}`}>
                    <Button>Abrir</Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="text-rose-600"
                    onClick={() =>
                      window.confirm(`Excluir ${item.name}?`) &&
                      remove.mutate({ documentId: item.id })
                    }
                  >
                    Excluir
                  </Button>
                </div>
              </article>
            ))}
          </section>
        )}
        {dialog && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          >
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
              <h2 className="text-xl font-black">Novo caderno</h2>
              <label className="mt-4 block text-sm font-bold">
                Nome do caderno
                <input
                  autoFocus
                  maxLength={80}
                  value={name}
                  onChange={event => setName(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border px-3"
                />
              </label>
              {!validation.valid && name && (
                <p className="mt-1 text-sm text-rose-600">{validation.error}</p>
              )}
              <fieldset className="mt-4">
                <legend className="text-sm font-bold">
                  Tipo inicial de folha
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["a5", "a4", "a3", "infinite"] as const).map(size => (
                    <label key={size} className="rounded-xl border p-3">
                      <input
                        type="radio"
                        checked={paper === size}
                        onChange={() => setPaper(size)}
                      />{" "}
                      {size === "infinite"
                        ? "Folha infinita"
                        : size.toUpperCase()}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  disabled={!validation.valid || create.isPending}
                  onClick={() =>
                    validation.valid &&
                    create.mutate({
                      name: validation.name,
                      paper: { size: paper, lined: false },
                    })
                  }
                >
                  Criar caderno
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
