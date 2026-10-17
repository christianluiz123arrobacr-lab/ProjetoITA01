import { useEffect, useState } from "react";
import { InteractiveQuiz } from "@/components/InteractiveQuiz";
import { getQuestions } from "@/services/questions.service";
import type { Question, QuestionDifficulty, QuestionSubject } from "@/types/question";

export default function QuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subject, setSubject] = useState<QuestionSubject | "">("");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | "">("");
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  useEffect(() => {
    let current = true;
    async function loadQuestions() {
      setQuestionsLoading(true);
      try {
      const data = await getQuestions({
        subject: subject || undefined,
        difficulty: difficulty || undefined,
        isPublished: true,
      });

      if (current) { setQuestions(data); setLoadError(false); }
      } catch { if (current) setLoadError(true); }
      finally { if (current) setQuestionsLoading(false); }
    }

    void loadQuestions();
    return () => { current = false; };
  }, [subject, difficulty, reload]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Banco de Questões
          </h1>
          <p className="text-slate-600 mb-6">
            Filtre por disciplina e dificuldade para praticar com questões reais.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Disciplina
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as QuestionSubject | "")}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                <option value="fisica">Física</option>
                <option value="matematica">Matemática</option>
                <option value="quimica">Química</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Dificuldade
              </label>
              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as QuestionDifficulty | "")
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                <option value="facil">Fácil</option>
                <option value="medio">Médio</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>
          </div>
        </div>

        {loadError ? <div role="alert">Não foi possível carregar as questões. <button onClick={() => setReload(value => value + 1)}>Tentar novamente</button></div> : questionsLoading ? <p role="status">Carregando questões...</p> : <InteractiveQuiz questions={questions} />}
      </div>
    </div>
  );
}
