import { useRoute } from "wouter";
import { BookOpen, Loader2 } from "lucide-react";
import { LessonRenderer } from "@/components/lessons/LessonRenderer";
import { trpc } from "@/lib/trpc";

export default function LessonPage() {
  const [, params] = useRoute("/aulas/:slug");
  const lesson = trpc.lessons.published.useQuery({ slug: params?.slug ?? "" }, { enabled: Boolean(params?.slug), retry: false });
  if (lesson.isLoading) return <main className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-cyan-600" /><span className="sr-only">Carregando aula</span></main>;
  if (lesson.error || !lesson.data) return <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 text-center"><BookOpen className="mb-4 h-10 w-10 text-slate-400" /><h1 className="text-2xl font-bold text-slate-950 dark:text-white">Aula indisponível</h1><p className="mt-2 text-slate-600 dark:text-slate-300">Esta aula não foi publicada ou não está disponível no momento.</p></main>;
  const { lesson: metadata, version } = lesson.data;
  return <main className="px-4 py-8 sm:px-6 md:py-12"><article className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><header className="border-b border-slate-200 bg-gradient-to-br from-cyan-50 to-white px-6 py-8 dark:border-slate-800 dark:from-cyan-950/30 dark:to-slate-900 md:px-10 md:py-12"><p className="mb-3 text-sm font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">{metadata.discipline} · {metadata.content}</p><h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">{metadata.title}</h1><p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300 md:text-lg">{metadata.description}</p><div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400"><span className="rounded-full bg-white px-3 py-1 dark:bg-slate-800">{metadata.subject}</span>{metadata.level && <span className="rounded-full bg-white px-3 py-1 dark:bg-slate-800">{metadata.level}</span>}<span className="rounded-full bg-white px-3 py-1 dark:bg-slate-800">Versão {version.version_number}</span></div></header><div className="px-6 py-8 md:px-10 md:py-12"><LessonRenderer lesson={version.content_json} /></div></article></main>;
}
