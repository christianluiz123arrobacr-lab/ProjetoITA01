import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Archive, BookOpen, Eye, History, Loader2, Pencil, Plus, Search } from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

const fieldClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export default function AdminLessonsPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [status, setStatus] = useState<"all" | "draft" | "published" | "archived">("all");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", description: "", discipline: "", content: "", subject: "", level: "", displayOrder: 0 });
  const taxonomy = trpc.lessons.taxonomy.useQuery();
  const list = trpc.lessons.list.useQuery({ search, discipline, status });
  const create = trpc.lessons.create.useMutation({ onSuccess: data => navigate(`/admin/aulas/${data.id}`) });
  const archive = trpc.lessons.archive.useMutation({ onSuccess: () => list.refetch() });
  const selectedDiscipline = taxonomy.data?.find(item => item.name === form.discipline);
  const selectedContent = selectedDiscipline?.contents.find(item => item.name === form.content);
  const disciplineOptions = useMemo(() => taxonomy.data?.map(item => item.name) ?? [], [taxonomy.data]);

  function setTitle(title: string) { setForm(current => ({ ...current, title, slug: current.slug === slugify(current.title) || !current.slug ? slugify(title) : current.slug })); }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    create.mutate({ ...form, level: form.level.trim() || null });
  }

  return <AdminGuard allowedRoles={["admin"]}><AdminLayout title="Aulas" subtitle="Conteúdo estruturado com rascunho, preview e versões publicadas.">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-bold text-slate-950 dark:text-white">Motor de aulas</h2><p className="text-sm text-slate-500 dark:text-slate-400">As aulas legadas permanecem separadas e intactas.</p></div>
      <Button onClick={() => setCreating(value => !value)}><Plus className="mr-2 h-4 w-4" />Nova aula</Button>
    </div>

    {creating && <Card className="border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200">Título<input className={fieldClass} value={form.title} onChange={e => setTitle(e.target.value)} required /></label>
        <label className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200">Slug<input className={fieldClass} value={form.slug} onChange={e => setForm({ ...form, slug: slugify(e.target.value) })} required /></label>
        <label className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200 md:col-span-2">Descrição<textarea className="min-h-20 w-full rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></label>
        <label className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200">Disciplina<select className={fieldClass} value={form.discipline} onChange={e => setForm({ ...form, discipline: e.target.value, content: "", subject: "" })} required><option value="">Selecione</option>{disciplineOptions.map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200">Conteúdo<select className={fieldClass} value={form.content} onChange={e => setForm({ ...form, content: e.target.value, subject: "" })} required><option value="">Selecione</option>{selectedDiscipline?.contents.map(item => <option key={item.name}>{item.name}</option>)}</select></label>
        <label className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200">Assunto<select className={fieldClass} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required><option value="">Selecione</option>{selectedContent?.subjects.map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200">Nível opcional<input className={fieldClass} value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} /></label>
        {create.error && <p className="text-sm text-red-600 md:col-span-2">{create.error.message}</p>}
        <div className="flex gap-2 md:col-span-2"><Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar rascunho</Button><Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancelar</Button></div>
      </form>
    </Card>}

    <Card className="border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="grid gap-3 md:grid-cols-[1fr_220px_180px]">
        <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input aria-label="Buscar por título" className={`${fieldClass} pl-9`} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por título" /></label>
        <select aria-label="Filtrar por disciplina" className={fieldClass} value={discipline} onChange={e => setDiscipline(e.target.value)}><option value="">Todas as disciplinas</option>{disciplineOptions.map(value => <option key={value}>{value}</option>)}</select>
        <select aria-label="Filtrar por status" className={fieldClass} value={status} onChange={e => setStatus(e.target.value as typeof status)}><option value="all">Ativas</option><option value="draft">Somente rascunho</option><option value="published">Publicadas</option><option value="archived">Arquivadas</option></select>
      </div>
    </Card>

    {list.isLoading ? <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-cyan-600" /></div> : list.error ? <Card className="p-6 text-red-600">{list.error.message}</Card> : !list.data?.length ? <Card className="p-10 text-center"><BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-400" /><p className="text-slate-500">Nenhuma aula encontrada.</p></Card> : <div className="space-y-3">{list.data.map(row => {
      const versionRelation = Array.isArray(row.lesson_versions) ? row.lesson_versions[0] : row.lesson_versions;
      const version = versionRelation && typeof versionRelation === "object" && "version_number" in versionRelation ? Number(versionRelation.version_number) : null;
      const rowStatus = row.archived_at ? "Arquivada" : row.current_published_version_id ? "Publicada" : "Rascunho";
      return <Card key={row.id} className="border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-950 dark:text-white">{row.title}</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">{rowStatus}{version ? ` · v${version}` : ""}</span></div><p className="text-sm text-slate-500 dark:text-slate-400">{row.discipline} · {row.content} · {row.subject}</p><p className="mt-1 text-xs text-slate-400">Atualizada em {new Date(row.updated_at).toLocaleString("pt-BR")}</p></div><div className="flex flex-wrap gap-2"><Link href={`/admin/aulas/${row.id}`}><Button size="sm" variant="outline"><Pencil className="mr-1 h-4 w-4" />Editar</Button></Link><Link href={`/admin/aulas/${row.id}?tab=preview`}><Button size="sm" variant="outline"><Eye className="mr-1 h-4 w-4" />Preview</Button></Link><Link href={`/admin/aulas/${row.id}?tab=history`}><Button size="sm" variant="outline"><History className="mr-1 h-4 w-4" />Histórico</Button></Link><Button size="sm" variant="outline" onClick={() => archive.mutate({ lessonId: row.id, archived: !row.archived_at })}><Archive className="mr-1 h-4 w-4" />{row.archived_at ? "Restaurar" : "Arquivar"}</Button></div></div></Card>;
    })}</div>}
  </AdminLayout></AdminGuard>;
}
