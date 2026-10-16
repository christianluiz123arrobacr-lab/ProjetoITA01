import type { StudyCanvasDocument } from "@/components/study-canvas/StudyCanvasWorkspace";
import type {
  QuestionNote,
  ScratchpadStroke,
} from "@/services/question-notes.service";

export const MAX_LOCAL_QUESTION_DRAFT_BYTES = 8 * 1024 * 1024;
const DATABASE = "vetor-question-drafts";
const STORE = "drafts";
export const questionDraftKey = (userId: string, questionId: string) =>
  JSON.stringify([userId, questionId]);
export const oldQuestionDraftKey = (userId: string, questionId: string) =>
  `v3:question-note:${userId}:${questionId}`;
export type LocalQuestionDraft = {
  key: string;
  userId: string;
  questionId: string;
  document: StudyCanvasDocument;
  updatedAt: string;
};
export type QuestionDraftStore = {
  read(key: string): Promise<LocalQuestionDraft | undefined>;
  write(
    record: LocalQuestionDraft,
    onlyIfAbsent?: boolean
  ): Promise<LocalQuestionDraft>;
};

function storageError() {
  return new Error(
    "Não foi possível salvar ou abrir o rascunho neste navegador. Verifique o espaço disponível e as permissões de armazenamento. Exporte uma cópia antes de sair."
  );
}
let database: Promise<IDBDatabase> | undefined;
function openDatabase() {
  if (!database)
    database = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(storageError());
        return;
      }
      let finished = false;
      const fail = () => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          reject(storageError());
        }
      };
      const timer = setTimeout(fail, 8000);
      const request = indexedDB.open(DATABASE, 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore(STORE, { keyPath: "key" });
      request.onerror = fail;
      request.onblocked = fail;
      request.onsuccess = () => {
        const db = request.result;
        if (finished) {
          db.close();
          return;
        }
        finished = true;
        clearTimeout(timer);
        db.onversionchange = () => {
          db.close();
          database = undefined;
        };
        resolve(db);
      };
    }).catch(error => {
      database = undefined;
      throw error;
    });
  return database;
}
export const indexedQuestionDraftStore: QuestionDraftStore = {
  async read(key) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly"),
        request = tx.objectStore(STORE).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(storageError());
      tx.onabort = () => reject(storageError());
    });
  },
  async write(record, onlyIfAbsent = false) {
    if (
      new Blob([JSON.stringify(record.document)]).size >
      MAX_LOCAL_QUESTION_DRAFT_BYTES
    )
      throw new Error(
        "Não foi possível salvar: este rascunho ultrapassa 8 MiB. Remova imagens/páginas ou exporte uma cópia. A versão anterior permanece salva."
      );
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite"),
        store = tx.objectStore(STORE);
      let result = record;
      if (onlyIfAbsent) {
        const read = store.get(record.key);
        read.onsuccess = () => {
          if (read.result) result = read.result;
          else store.put(record);
        };
      } else store.put(record);
      // A successful request is NOT a committed transaction (quota can fail later).
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(storageError());
    });
  },
};

export function emptyQuestionDocument(): StudyCanvasDocument {
  return {
    activePageId: "page-1",
    pages: [
      { id: "page-1", title: "Página 1", strokes: [], backgroundType: "grid" },
    ],
  };
}
export function legacyQuestionDocument(value: unknown): StudyCanvasDocument {
  const raw = value as {
    pages?: StudyCanvasDocument["pages"];
    activePageId?: string;
    strokes?: ScratchpadStroke[];
    backgroundType?: string;
    background_type?: string;
  } | null;
  const meta = raw?.strokes?.find(
    stroke => stroke.tool === "meta" || stroke.id === "__scratchpad_pages_v1"
  );
  const payload = meta?.payload as
    | {
        kind?: string;
        pages?: StudyCanvasDocument["pages"];
        activePageId?: string;
      }
    | undefined;
  const pages =
    payload?.kind === "scratchpad-pages-v1" ? payload.pages : raw?.pages;
  if (Array.isArray(pages) && pages.length) {
    const active = payload?.activePageId ?? raw?.activePageId;
    return {
      pages,
      activePageId: pages.some(page => page.id === active)
        ? active!
        : pages[0].id,
    };
  }
  const document = emptyQuestionDocument();
  document.pages[0].strokes = Array.isArray(raw?.strokes)
    ? raw.strokes.filter(stroke => stroke.tool !== "meta")
    : [];
  const background = raw?.backgroundType ?? raw?.background_type;
  if (
    ["grid", "dots", "lined", "blank", "cartesian"].includes(background ?? "")
  )
    document.pages[0].backgroundType = background as "grid";
  return document;
}

/** No remote writes are available on this adapter. IDs are captured, never read from a later session. */
export function createLocalQuestionPersistence({
  userId,
  questionId,
  store = indexedQuestionDraftStore,
  legacyStorage,
  readRemote,
  onLegacyError,
}: {
  userId: string;
  questionId: string;
  store?: QuestionDraftStore;
  legacyStorage?: Pick<Storage, "getItem" | "removeItem">;
  readRemote: () => Promise<QuestionNote | null>;
  onLegacyError?: () => void;
}) {
  const key = questionDraftKey(userId, questionId);
  const ownDocument = (stored: LocalQuestionDraft) => {
    if (
      stored.key !== key ||
      stored.userId !== userId ||
      stored.questionId !== questionId
    )
      throw new Error(
        "O rascunho não pertence à conta e à questão atuais. Nenhum dado foi substituído."
      );
    return stored.document;
  };
  const record = (document: StudyCanvasDocument): LocalQuestionDraft => ({
    key,
    userId,
    questionId,
    document,
    updatedAt: new Date().toISOString(),
  });
  let queue: Promise<unknown> = Promise.resolve();
  let removed = false;
  const serial = <T>(task: () => Promise<T>): Promise<T> => {
    const job = queue.catch(() => undefined).then(task);
    queue = job;
    return job;
  };
  return {
    destination: "browser" as const,
    async load() {
      await queue.catch(() => undefined);
      const local = await store.read(key);
      if (local) return ownDocument(local);
      // Preserve the original backup, even after a successful IndexedDB migration.
      let old: string | null = null;
      try {
        old =
          legacyStorage?.getItem(oldQuestionDraftKey(userId, questionId)) ??
          null;
      } catch {
        throw storageError();
      }
      if (old) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(old);
        } catch {
          throw new Error(
            "O backup local antigo não pôde ser lido. Ele foi preservado; não será substituído automaticamente."
          );
        }
        return ownDocument(
          await serial(() =>
            store.write(record(legacyQuestionDocument(parsed)), true)
          )
        );
      }
      let remote: QuestionNote | null;
      try {
        remote = await readRemote();
        if (
          remote &&
          (remote.user_id !== userId || remote.question_id !== questionId)
        )
          throw new Error("Conta ou questão alterada durante a leitura antiga");
      } catch {
        onLegacyError?.();
        return emptyQuestionDocument();
      }
      // An empty committed record also marks a successful 'no legacy note' lookup.
      // The transaction must not replace a local save from another tab/in-flight edit.
      return ownDocument(
        await serial(() =>
          store.write(record(legacyQuestionDocument(remote)), true)
        )
      );
    },
    save(document: StudyCanvasDocument) {
      return serial(async () => {
        if (!removed) await store.write(record(document));
      });
    },
    async remove() {
      // Tombstone prevents importing the deleted legacy cloud note on the next visit.
      removed = true;
      try {
        await serial(() => store.write(record(emptyQuestionDocument())));
      } catch (error) {
        removed = false;
        throw error;
      }
      let legacyBackupRemoved = true;
      try {
        legacyStorage?.removeItem(oldQuestionDraftKey(userId, questionId));
      } catch {
        legacyBackupRemoved = false;
      }
      return { legacyBackupRemoved };
    },
  };
}
