import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Save,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

type VetProfileRow = {
  id: string;
  user_id: string;
  target_exam: string;
  months_until_exam: number;
  hours_per_day: number;
  focus_subject: string;
  study_days_per_week?: number | null;
  study_weekdays?: string[] | null;
};

const EXAM_OPTIONS = [
  { value: "ITA", label: "ITA" },
  { value: "IME", label: "IME" },
  { value: "FUVEST", label: "FUVEST" },
  { value: "UNICAMP", label: "UNICAMP" },
  { value: "ENEM", label: "ENEM" },
  { value: "EFOMM", label: "EFOMM" },
  { value: "EPCAR", label: "EPCAR" },
  { value: "EsPCEx", label: "EsPCEx" },
  { value: "Escola Naval", label: "Escola Naval" },
  { value: "Colégio Naval", label: "Colégio Naval" },
  { value: "EEAR", label: "EEAR" },
];

const SUBJECT_OPTIONS = [
  { value: "todas", label: "Todas" },
  { value: "matematica", label: "Matemática" },
  { value: "fisica", label: "Física" },
  { value: "quimica", label: "Química" },
];

const WEEKDAYS = [
  { value: "segunda", label: "Segunda" },
  { value: "terca", label: "Terça" },
  { value: "quarta", label: "Quarta" },
  { value: "quinta", label: "Quinta" },
  { value: "sexta", label: "Sexta" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
];

function normalizeNumber(value: string, fallback: number) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) return fallback;

  return parsed;
}

function getUrgencyLabel(months: number) {
  if (months <= 1) return "urgência máxima";
  if (months <= 2) return "muito urgente";
  if (months <= 4) return "urgente";
  if (months <= 6) return "moderado";
  if (months <= 9) return "planejável";
  return "longo prazo";
}

function getUrgencyDescription(months: number) {
  if (months <= 1) {
    return "Pouquíssimo tempo. O VET vai priorizar ataque e reduzir qualquer treino aleatório.";
  }

  if (months <= 2) {
    return "Tempo apertado. O foco precisa ser gargalo, recorrência e conteúdo de maior peso.";
  }

  if (months <= 4) {
    return "Ainda dá para corrigir rota, mas o treino precisa ser bem direcionado.";
  }

  if (months <= 6) {
    return "Boa janela para equilibrar ataque, consolidação e manutenção.";
  }

  if (months <= 9) {
    return "Você tem tempo para construir base e evoluir com consistência.";
  }

  return "Janela longa. O VET pode distribuir melhor a preparação e evitar desespero gourmet.";
}

function getSubjectLabel(value: string) {
  const found = SUBJECT_OPTIONS.find((item) => item.value === value);
  return found?.label ?? value;
}

function toggleWeekday(list: string[], day: string) {
  if (list.includes(day)) {
    return list.filter((item) => item !== day);
  }

  return [...list, day];
}

export default function VetObjectivePage() {
  const { user, loading: authLoading } = useSupabaseAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileId, setProfileId] = useState<string | null>(null);

  const [targetExam, setTargetExam] = useState("ITA");
  const [monthsUntilExam, setMonthsUntilExam] = useState("6");
  const [hoursPerDay, setHoursPerDay] = useState("3");
  const [focusSubject, setFocusSubject] = useState("todas");
  const [studyWeekdays, setStudyWeekdays] = useState<string[]>([
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
  ]);

  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const { data, error: profileError } = await supabase
          .from("user_vet_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(profileError);
          setError("Não foi possível carregar seu objetivo do VET.");
          setLoading(false);
          return;
        }

        const profile = data as VetProfileRow | null;

        if (profile) {
          setProfileId(profile.id);
          setTargetExam(profile.target_exam || "ITA");
          setMonthsUntilExam(String(profile.months_until_exam || 6));
          setHoursPerDay(String(profile.hours_per_day || 3));
          setFocusSubject(profile.focus_subject || "todas");

          if (Array.isArray(profile.study_weekdays)) {
            setStudyWeekdays(profile.study_weekdays);
          } else if (profile.study_days_per_week) {
            setStudyWeekdays(WEEKDAYS.slice(0, profile.study_days_per_week).map((day) => day.value));
          }
        }
      } catch (err) {
        console.error(err);
        setError("Ocorreu um erro inesperado ao carregar o objetivo.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadProfile();
    }
  }, [user?.id, authLoading]);

  const monthsNumber = normalizeNumber(monthsUntilExam, 6);
  const hoursNumber = normalizeNumber(hoursPerDay, 3);
  const studyDaysPerWeek = studyWeekdays.length;
  const weeklyHours = studyDaysPerWeek * hoursNumber;

  const urgencyLabel = getUrgencyLabel(monthsNumber);
  const urgencyDescription = getUrgencyDescription(monthsNumber);

  const objectiveSummary = useMemo(() => {
    return {
      exam: targetExam,
      subject: getSubjectLabel(focusSubject),
      months: monthsNumber,
      hoursPerDay: hoursNumber,
      studyDays: studyDaysPerWeek,
      weeklyHours,
    };
  }, [
    targetExam,
    focusSubject,
    monthsNumber,
    hoursNumber,
    studyDaysPerWeek,
    weeklyHours,
  ]);

  async function handleSave() {
    if (!user?.id) {
      setError("Você precisa estar logado para configurar o VET.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    const payload = {
      user_id: user.id,
      target_exam: targetExam,
      months_until_exam: Math.max(1, monthsNumber),
      hours_per_day: Math.max(0.5, hoursNumber),
      focus_subject: focusSubject,
      study_days_per_week: studyDaysPerWeek,
      study_weekdays: studyWeekdays,
    };

    try {
      if (profileId) {
        const { error: updateError } = await supabase
          .from("user_vet_profiles")
          .update(payload)
          .eq("id", profileId);

        if (updateError) {
          console.error(updateError);
          setError("Não foi possível atualizar seu objetivo.");
          return;
        }
      } else {
        const { data, error: insertError } = await supabase
          .from("user_vet_profiles")
          .insert(payload)
          .select("*")
          .single();

        if (insertError) {
          console.error(insertError);
          setError("Não foi possível salvar seu objetivo.");
          return;
        }

        const createdProfile = data as VetProfileRow;
        setProfileId(createdProfile.id);
      }

      setSuccessMessage("Objetivo VET salvo com sucesso.");
    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro inesperado ao salvar o objetivo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-50">
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/50">
        <div className="container py-4 flex items-center gap-4">
          <Link href="/vet">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Objetivo VET
            </h1>
            <p className="text-sm text-slate-500">
              Configure a régua usada pelo motor estratégico
            </p>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {authLoading || loading ? (
          <Card className="p-8 bg-white">
            <div className="flex items-center gap-3 text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Carregando objetivo...
            </div>
          </Card>
        ) : !user ? (
          <Card className="p-8 bg-white border-slate-200 rounded-3xl">
            <p className="text-slate-700">
              Você precisa estar logado para configurar o VET.
            </p>
          </Card>
        ) : (
          <>
            <Card className="p-6 md:p-8 border-emerald-200 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white overflow-hidden relative rounded-3xl shadow-lg">
              <div className="absolute top-0 right-0 h-52 w-52 rounded-full bg-white/10 blur-2xl -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 h-52 w-52 rounded-full bg-white/10 blur-2xl -ml-24 -mb-24" />

              <div className="relative grid lg:grid-cols-[1.3fr_0.7fr] gap-6 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-xs font-bold text-emerald-50 mb-4">
                    <Sparkles className="w-3.5 h-3.5" />
                    Configuração estratégica
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                    Diga ao VET qual guerra você está tentando vencer
                  </h2>

                  <p className="text-emerald-50 leading-relaxed max-w-3xl">
                    O objetivo define a régua do diagnóstico, do plano, das questões
                    recomendadas, do treino e do simulado. Sem isso, o VET vira
                    só um conselheiro motivacional com gráfico bonito, e já temos
                    tragédias suficientes.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-7">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-2xl px-6 py-5 font-bold"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar objetivo
                        </>
                      )}
                    </Button>

                    <Link href="/vet/diagnostico">
                      <Button
                        variant="outline"
                        className="rounded-2xl px-6 py-5 font-bold border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                      >
                        Abrir diagnóstico
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="rounded-3xl bg-white/12 border border-white/20 p-5 backdrop-blur-sm">
                  <p className="text-sm uppercase tracking-wide text-emerald-100 font-bold mb-4">
                    Resumo atual
                  </p>

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">
                        Prova-alvo
                      </p>
                      <p className="font-bold">{objectiveSummary.exam}</p>
                    </div>

                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">
                        Foco
                      </p>
                      <p className="font-bold">{objectiveSummary.subject}</p>
                    </div>

                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">
                        Carga semanal
                      </p>
                      <p className="font-bold">
                        {objectiveSummary.weeklyHours.toFixed(1)}h
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {error ? (
              <Card className="p-5 border-red-200 bg-red-50 rounded-3xl">
                <p className="text-red-700 font-medium">{error}</p>
              </Card>
            ) : null}

            {successMessage ? (
              <Card className="p-5 border-emerald-200 bg-emerald-50 rounded-3xl">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <p className="text-emerald-700 font-medium">
                    {successMessage}
                  </p>
                </div>
              </Card>
            ) : null}

            <section className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-700" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Configuração principal
                    </h2>
                    <p className="text-sm text-slate-500">
                      Esses dados alimentam todo o motor do VET.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Prova-alvo
                    </label>

                    <select
                      value={targetExam}
                      onChange={(event) => setTargetExam(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {EXAM_OPTIONS.map((exam) => (
                        <option key={exam.value} value={exam.value}>
                          {exam.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Disciplina foco
                    </label>

                    <select
                      value={focusSubject}
                      onChange={(event) => setFocusSubject(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {SUBJECT_OPTIONS.map((subject) => (
                        <option key={subject.value} value={subject.value}>
                          {subject.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Meses até a prova
                    </label>

                    <input
                      type="number"
                      min={1}
                      max={36}
                      step={1}
                      value={monthsUntilExam}
                      onChange={(event) => setMonthsUntilExam(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Horas por dia
                    </label>

                    <input
                      type="number"
                      min={0.5}
                      max={16}
                      step={0.5}
                      value={hoursPerDay}
                      onChange={(event) => setHoursPerDay(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <Clock3 className="w-5 h-5 text-blue-700" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Leitura do tempo
                    </h2>
                    <p className="text-sm text-slate-500">
                      O VET ajusta a agressividade pelo prazo.
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 mb-5">
                  <p className="text-sm text-slate-500 mb-1">
                    Urgência detectada
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {urgencyLabel}
                  </p>
                </div>

                <p className="text-slate-600 leading-relaxed">
                  {urgencyDescription}
                </p>
              </Card>
            </section>

            <Card className="p-6 bg-white border-slate-200 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-violet-700" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Dias de estudo
                  </h2>
                  <p className="text-sm text-slate-500">
                    Isso ajuda o treino recomendado a distribuir os blocos na semana.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                {WEEKDAYS.map((day) => {
                  const active = studyWeekdays.includes(day.value);

                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() =>
                        setStudyWeekdays((prev) => toggleWeekday(prev, day.value))
                      }
                      className={`rounded-full border px-4 py-2 text-sm font-bold transition-all ${
                        active
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="w-4 h-4 text-slate-500" />
                    <p className="text-sm font-bold text-slate-700">
                      Dias por semana
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {studyDaysPerWeek}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="w-4 h-4 text-slate-500" />
                    <p className="text-sm font-bold text-slate-700">
                      Horas por dia
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {hoursNumber.toFixed(1)}h
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit className="w-4 h-4 text-slate-500" />
                    <p className="text-sm font-bold text-slate-700">
                      Carga semanal
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {weeklyHours.toFixed(1)}h
                  </p>
                </div>
              </div>
            </Card>

            <section className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6">
              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Resumo configurado
                    </h2>
                    <p className="text-sm text-slate-500">
                      O que será usado pelo motor.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                    <span className="text-slate-500">Prova</span>
                    <span className="font-bold text-slate-900">
                      {objectiveSummary.exam}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                    <span className="text-slate-500">Foco</span>
                    <span className="font-bold text-slate-900">
                      {objectiveSummary.subject}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                    <span className="text-slate-500">Tempo</span>
                    <span className="font-bold text-slate-900">
                      {objectiveSummary.months} mês(es)
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                    <span className="text-slate-500">Dias</span>
                    <span className="font-bold text-slate-900">
                      {objectiveSummary.studyDays} por semana
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Carga</span>
                    <span className="font-bold text-slate-900">
                      {objectiveSummary.weeklyHours.toFixed(1)}h/semana
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5 text-slate-700" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Próximo passo
                    </h2>
                    <p className="text-sm text-slate-500">
                      Depois de salvar, rode o diagnóstico.
                    </p>
                  </div>
                </div>

                <p className="text-slate-600 leading-relaxed mb-5">
                  O objetivo é a entrada do VET. Depois de salvar, o diagnóstico
                  cruza essa configuração com seu histórico de questões, os últimos
                  anos da prova, pesos por conteúdo e média dos alunos.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar objetivo
                      </>
                    )}
                  </Button>

                  <Link href="/vet/diagnostico">
                    <Button variant="outline" className="rounded-2xl">
                      Abrir diagnóstico
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
