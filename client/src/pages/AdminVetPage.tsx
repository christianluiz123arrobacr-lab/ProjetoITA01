import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import { trpc } from "@/lib/trpc";

type WeightRow = { id: string; exam: string; subject: string; conteudo: string; weight: number };

export default function AdminVetPage() {
  const utils = trpc.useUtils();
  const saveWeight = trpc.vet.adminUpsertWeight.useMutation();
  const refreshStats = trpc.vet.refreshCollectiveStats.useMutation();
  const [weights, setWeights] = useState<WeightRow[]>([]);
  const [form, setForm] = useState({ exam: "ITA", subject: "fisica", conteudo: "", weight: "5" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [statsStatus, setStatsStatus] = useState<{ groups: number; lastUpdatedAt: string | null } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [loadedWeights, status] = await Promise.all([
        utils.vet.adminListWeights.fetch(),
        utils.vet.getCollectiveStatsStatus.fetch(),
      ]);
      setWeights(loadedWeights as WeightRow[]);
      setStatsStatus(status);
    }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function submit() {
    setMessage("");
    await saveWeight.mutateAsync({ ...form, weight: Number(form.weight) });
    setMessage("Peso editorial salvo. A análise histórica continua independente deste ajuste.");
    setForm(current => ({ ...current, conteudo: "" }));
    await load();
  }

  return (
    <AdminGuard>
      <AdminLayout title="VET ADM" subtitle="Pesos editoriais e estatísticas coletivas do motor estratégico.">
        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <Card className="space-y-4 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Configurar peso editorial</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">Opcional, de 0 a 10. Sem configuração, o VET usa peso padrão e mantém a análise histórica automática.</p>
            {(["exam", "subject", "conteudo", "weight"] as const).map(key => (
              <label className="block" key={key}>
                <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{key === "exam" ? "Prova" : key === "subject" ? "Disciplina" : key === "conteudo" ? "Conteúdo" : "Peso (0–10)"}</span>
                <input type={key === "weight" ? "number" : "text"} min={key === "weight" ? 0 : undefined} max={key === "weight" ? 10 : undefined} step={key === "weight" ? .5 : undefined} value={form[key]} onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2" />
              </label>
            ))}
            <Button onClick={() => void submit()} disabled={!form.conteudo.trim() || saveWeight.isPending}><Save className="mr-2 h-4 w-4" />Salvar peso</Button>
            {message && <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p>}
          </Card>

          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Pesos configurados</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{weights.length} ajuste(s)</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Atualização coletiva manual • {statsStatus?.groups ?? 0} grupo(s) • última atualização: {statsStatus?.lastUpdatedAt ? new Date(statsStatus.lastUpdatedAt).toLocaleString("pt-BR") : "ainda não executada"}</p>
                <p className="text-xs text-slate-400">Privacidade: mínimo de 10 tentativas e 5 alunos por grupo.</p>
              </div>
              <Button variant="outline" onClick={async () => { const result = await refreshStats.mutateAsync(); setMessage(`${result.updatedGroups} grupo(s) coletivo(s) atualizado(s).`); await load(); }} disabled={refreshStats.isPending}><RefreshCw className="mr-2 h-4 w-4" />Atualizar estatísticas coletivas agora</Button>
            </div>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-slate-500 dark:text-slate-400"><th className="p-2">Prova</th><th className="p-2">Disciplina</th><th className="p-2">Conteúdo</th><th className="p-2">Peso</th></tr></thead><tbody>{weights.map(row => <tr className="border-b" key={row.id}><td className="p-2">{row.exam}</td><td className="p-2">{row.subject}</td><td className="p-2">{row.conteudo}</td><td className="p-2 font-bold">{Number(row.weight)}</td></tr>)}</tbody></table></div>
            )}
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
