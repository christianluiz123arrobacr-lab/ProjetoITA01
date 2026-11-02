import { useCallback, useMemo, useState } from "react";
import { StudyCanvasWorkspace } from "@/components/study-canvas/StudyCanvasWorkspace";
import { createLocalQuestionPersistence } from "@/lib/localQuestionDraft";
import { getQuestionNote } from "@/services/question-notes.service";
import { authSession } from "@/lib/authSession";

type QuestionScratchpadProps = {
  userId?: string | null;
  questionId: string;
  questionCode?: string | null;
  embedded?: boolean;
  active?: boolean;
};

async function legacyRead(userId: string, questionId: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    if (authSession.getSnapshot().session?.user.id !== userId)
      throw new Error("Conta alterada");
    const result = await Promise.race([
      getQuestionNote({ userId, questionId }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Leitura antiga indisponível")),
          8000
        );
      }),
    ]);
    if (authSession.getSnapshot().session?.user.id !== userId)
      throw new Error("Conta alterada");
    return result;
  } finally {
    clearTimeout(timer);
  }
}
/** Every question adapter is explicitly browser-only, including non-bank quiz uses. */
export function QuestionScratchpad(props: QuestionScratchpadProps) {
  return props.userId ? (
    <LocalQuestionScratchpad
      key={`${props.userId}:${props.questionId}`}
      {...props}
      userId={props.userId}
    />
  ) : (
    <p className="p-3 text-sm">
      Entre na sua conta para usar o rascunho local desta questão.
    </p>
  );
}
function LocalQuestionScratchpad({
  userId,
  questionId,
  questionCode,
  embedded = false,
  active = true,
}: QuestionScratchpadProps & { userId: string }) {
  const [revision, setRevision] = useState(0);
  const [legacyError, setLegacyError] = useState(false);
  const [error, setError] = useState("");
  const [state, setState] = useState({
    dirty: false,
    saving: false,
    error: "",
  });
  const [deleting, setDeleting] = useState(false);
  const changed = useCallback(
    (next: typeof state) =>
      setState(previous =>
        previous.dirty === next.dirty &&
        previous.saving === next.saving &&
        previous.error === next.error
          ? previous
          : next
      ),
    []
  );
  const persistence = useMemo(
    () =>
      createLocalQuestionPersistence({
        userId,
        questionId,
        legacyStorage: {
          getItem: key => window.localStorage.getItem(key),
          removeItem: key => window.localStorage.removeItem(key),
        },
        readRemote: () => legacyRead(userId, questionId),
        onLegacyError: () => setLegacyError(true),
      }),
    [userId, questionId, revision]
  );
  async function remove() {
    if (
      !window.confirm(
        "Excluir o rascunho desta questão somente deste navegador? A anotação antiga na nuvem não será alterada."
      )
    )
      return;
    setDeleting(true);
    setError("");
    try {
      const result = await persistence.remove();
      setRevision(value => value + 1);
      setLegacyError(false);
      if (!result.legacyBackupRemoved)
        setError(
          "Rascunho excluído do IndexedDB, mas não foi possível remover o backup antigo deste navegador. Ele não será importado novamente."
        );
    } catch {
      setError(
        "Não foi possível excluir o rascunho local. Verifique o armazenamento e tente novamente."
      );
    } finally {
      setDeleting(false);
    }
  }
  return (
    <section
      aria-label="Rascunho local da questão"
      className={`${embedded ? "flex h-full min-h-0 flex-col" : ""} bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100`}
    >
      {!embedded ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3 text-xs dark:border-slate-700">
          <p className="flex-1">
            Salvo apenas neste navegador e nesta conta. Não sincroniza entre
            dispositivos; limpar os dados do site pode apagar o rascunho.
          </p>
          <button
            type="button"
            disabled={deleting || state.saving}
            onClick={() => void remove()}
            className="rounded border px-3 py-2 text-red-700 disabled:opacity-50 dark:text-red-300"
          >
            Excluir rascunho local
          </button>
        </div>
      ) : null}
      {legacyError ? (
        <div
          role="alert"
          className="p-3 text-sm text-amber-800 dark:text-amber-200"
        >
          Não foi possível verificar a anotação antiga. Você pode rascunhar
          localmente ou tentar recuperar antes de escrever. Nenhum dado remoto
          foi alterado.{" "}
          <button
            disabled={state.dirty || state.saving}
            className="underline disabled:opacity-50"
            onClick={() => {
              setLegacyError(false);
              setRevision(value => value + 1);
            }}
          >
            Tentar recuperar anotação antiga
          </button>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
      {state.error && !legacyError ? (
        <button
          type="button"
          className="m-3 rounded border p-2 text-sm"
          disabled={state.dirty || state.saving}
          onClick={() => setRevision(value => value + 1)}
        >
          Tentar abrir novamente
        </button>
      ) : null}
      <StudyCanvasWorkspace
        key={revision}
        userId={userId}
        questionId={questionId}
        questionCode={questionCode}
        persistence={persistence}
        disableLocalDraft
        initiallyOpen={embedded}
        hideLauncher={embedded}
        embedded={embedded}
        compactMode={embedded}
        active={active && !deleting}
        onStateChange={changed}
        secondaryActions={
          embedded ? (
            <>
              <span className="max-w-64 shrink-0 whitespace-normal text-xs text-slate-300">
                Salvo apenas neste navegador e nesta conta. Limpar os dados do
                site pode apagar o rascunho.
              </span>
              <button
                type="button"
                disabled={deleting || state.saving}
                onClick={() => void remove()}
                className="shrink-0 rounded border border-red-700 px-3 py-2 text-xs text-red-200 disabled:opacity-50"
              >
                Excluir rascunho local
              </button>
            </>
          ) : undefined
        }
      />
    </section>
  );
}
