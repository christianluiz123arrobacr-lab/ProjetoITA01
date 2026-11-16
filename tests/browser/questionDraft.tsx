import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./rankingFixture.css";
import { InteractiveQuiz } from "../../client/src/components/InteractiveQuiz";
import { StudyCanvasWorkspace } from "../../client/src/components/study-canvas/StudyCanvasWorkspace";
import {
  emptyQuestionDocument,
  indexedQuestionDraftStore,
} from "../../client/src/lib/localQuestionDraft";
import { fixtureAccount, fixtureStats } from "./questionDraftMocks";
import type { Question } from "../../client/src/types/question";
const questions: Question[] = [1, 2].map(n => ({
  id: `draft-fixture-q${n}`,
  codigo: `LOCAL-${n}`,
  statement: `Questão sintética ${n}: calcule $x^2+1$ para $x=2$.`,
  subject: "fisica",
  topic: "Dinâmica",
  exam: "ITA",
  year: 2026,
  difficulty: "medio",
  correctOptionId: "a",
  options: [
    { id: "a", label: "A", text: "Cinco" },
    { id: "b", label: "B", text: "Seis" },
  ],
}));
const actualWrite = indexedQuestionDraftStore.write;
let simulateQuota = false;
indexedQuestionDraftStore.write = (record, absent) =>
  simulateQuota
    ? Promise.reject(new Error("Quota simulada: não foi salvo."))
    : actualWrite(record, absent);
function Fixture() {
  const [stats, setStats] = useState({ ...fixtureStats }),
    [drive, setDrive] = useState(false),
    [driveSaves, setDriveSaves] = useState(0),
    [account, setAccount] = useState("A"),
    [dark, setDark] = useState(false),
    [quota, setQuota] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setStats({ ...fixtureStats }), 200);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);
  const driveAdapter = useMemo(
    () => ({
      load: async () => emptyQuestionDocument(),
      save: async () => {
        setDriveSaves(n => n + 1);
      },
    }),
    []
  );
  return (
    <main className="theme-page min-h-screen bg-slate-100 p-4 dark:bg-slate-950 dark:text-white">
      <h1 className="text-xl font-bold">
        Fixture local: quiz e canvas reais; autenticação, tentativas, legado e
        Drive simulados
      </h1>
      <div className="my-3 flex flex-wrap gap-2">
        <button
          className="rounded border p-2"
          onClick={() => {
            const next = account === "A" ? "B" : "A";
            setAccount(next);
            fixtureAccount(`draft-fixture-${next}`);
          }}
        >
          Conta {account}: trocar
        </button>
        <button className="rounded border p-2" onClick={() => setDark(v => !v)}>
          Alternar tema
        </button>
        <button
          className="rounded border p-2"
          onClick={() => setDrive(v => !v)}
        >
          Alternar fixture de caderno Drive
        </button>
        <label>
          <input
            type="checkbox"
            checked={quota}
            onChange={event => {
              simulateQuota = event.target.checked;
              setQuota(simulateQuota);
            }}
          />
          Simular quota
        </label>
      </div>
      <p>
        Leituras legadas: {stats.reads} · Escritas remotas de rascunho:{" "}
        {stats.writes} · Tentativas do quiz: {stats.attempts} · Saves Drive
        simulado: {driveSaves}
      </p>
      {drive ? (
        <StudyCanvasWorkspace
          questionId="drive-fixture"
          persistence={driveAdapter}
          initiallyOpen
          autosaveIntervalMs={1000}
        />
      ) : (
        <InteractiveQuiz
          questions={questions}
          enableResolutionWorkspace
          optionFeedbackTheme="question-bank"
        />
      )}
    </main>
  );
}
const root = createRoot(document.getElementById("root")!);
root.render(<Fixture />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
