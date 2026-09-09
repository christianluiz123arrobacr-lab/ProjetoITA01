import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  defaultReferralCampaign,
  referralCampaignSchema,
  type ReferralCampaignConfig,
} from "../../../../shared/referralProgram";

export default function AdminReferralProgram() {
  const query = trpc.referrals.admin.useQuery(undefined, { retry: false });
  const save = trpc.referrals.save.useMutation();
  const [draft, setDraft] = useState<ReferralCampaignConfig | null>(null);
  const [message, setMessage] = useState("");
  const data = query.data as any;
  const config = draft ?? data?.campaign ?? defaultReferralCampaign;
  function set(key: keyof ReferralCampaignConfig, value: unknown) {
    setDraft({ ...config, [key]: value });
    setMessage("");
  }
  const input =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
  const fields: [keyof ReferralCampaignConfig, string, number, number][] = [
    ["goal", "Indicações por recompensa", 1, 1000],
    ["reward_days", "Dias de acesso do indicador", 1, 3650],
    ["discount", "Desconto (% até 90 ou valor em centavos)", 0, 10000000],
    ["extra_days", "Dias extras do indicado", 0, 3650],
  ];
  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      <h2 className="text-2xl font-bold">
        Programa de indicação — Indique e Ganhe
      </h2>
      {query.isLoading ? (
        <p role="status">Carregando campanha...</p>
      ) : query.error ? (
        <div role="alert">
          <p>Não foi possível carregar a campanha.</p>
          <Button onClick={() => query.refetch()}>Tentar novamente</Button>
        </div>
      ) : (
        <>
          <form
            className="mt-5 space-y-4"
            onSubmit={async event => {
              event.preventDefault();
              setMessage("");
              const parsed = referralCampaignSchema.safeParse(config);
              if (!parsed.success) {
                setMessage(parsed.error.issues.map(i => i.message).join(" "));
                return;
              }
              try {
                await save.mutateAsync(parsed.data);
                await query.refetch();
                setDraft(null);
                setMessage(
                  "Nova versão salva. Recompensas anteriores preservadas."
                );
              } catch (error) {
                setMessage(
                  error instanceof Error
                    ? error.message
                    : "Não foi possível salvar."
                );
              }
            }}
          >
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={e => set("enabled", e.target.checked)}
              />
              Campanha ativa
            </label>
            <label className="block">
              Título
              <input
                className={input}
                value={config.title}
                maxLength={120}
                onChange={e => set("title", e.target.value)}
                required
              />
            </label>
            <label className="block">
              Explicação
              <textarea
                className={input}
                value={config.description}
                maxLength={3000}
                onChange={e => set("description", e.target.value)}
                required
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map(([key, label, min, max]) => (
                <label key={key}>
                  {label}
                  <input
                    type="number"
                    min={min}
                    max={
                      key === "discount" && config.benefit === "percent"
                        ? 90
                        : max
                    }
                    step="1"
                    className={input}
                    value={config[key] as number}
                    onChange={e => set(key, e.target.valueAsNumber)}
                    required
                  />
                </label>
              ))}
              <label>
                Benefício do indicado
                <select
                  className={input}
                  value={config.benefit}
                  onChange={e => set("benefit", e.target.value)}
                >
                  <option value="none">Sem benefício</option>
                  <option value="percent">
                    Desconto percentual no primeiro pagamento
                  </option>
                  <option value="fixed">
                    Desconto fixo no primeiro pagamento (centavos)
                  </option>
                  <option value="days">Dias extras de acesso</option>
                </select>
              </label>
              <label>
                Limite de recompensas por indicador (vazio: ilimitado)
                <input
                  type="number"
                  min="1"
                  step="1"
                  className={input}
                  value={config.max_rewards ?? ""}
                  onChange={e =>
                    set(
                      "max_rewards",
                      e.target.value === "" ? null : e.target.valueAsNumber
                    )
                  }
                />
              </label>
              {(["starts_at", "ends_at"] as const).map(key => (
                <label key={key}>
                  {key === "starts_at" ? "Início" : "Fim"} (UTC)
                  <input
                    type="datetime-local"
                    className={input}
                    value={config[key]?.slice(0, 16) ?? ""}
                    onChange={e =>
                      set(
                        key,
                        e.target.value
                          ? new Date(e.target.value + "Z").toISOString()
                          : null
                      )
                    }
                  />
                </label>
              ))}
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.allow_stacking}
                onChange={e => set("allow_stacking", e.target.checked)}
              />
              Permitir acúmulo com outras promoções
            </label>
            <label className="block">
              Texto do botão WhatsApp
              <input
                className={input}
                value={config.whatsapp_label}
                maxLength={100}
                onChange={e => set("whatsapp_label", e.target.value)}
                required
              />
            </label>
            <label className="block">
              Mensagem do WhatsApp
              <textarea
                className={input}
                value={config.whatsapp_message}
                maxLength={2000}
                onChange={e => set("whatsapp_message", e.target.value)}
                required
              />
            </label>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Placeholders:{" "}
              {
                "{nome}, {link}, {beneficio_indicado}, {recompensa_indicador}, {meta_indicacoes}"
              }
              . Cada salvamento cria uma versão auditável. Descontos são válidos
              apenas para Pix e pacotes pré-pagos; percentual máximo de 90%. Não
              são criadas cobranças zeradas.
            </p>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Salvando..." : "Salvar campanha"}
            </Button>
            <p role="status">{message}</p>
          </form>
          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              ["Pendentes", data?.metrics.pending],
              ["Confirmadas", data?.metrics.confirmed],
              ["Recompensas", data?.metrics.rewards],
              [
                "Conversão",
                `${data?.metrics.total ? Math.round((data.metrics.confirmed / data.metrics.total) * 100) : 0}%`,
              ],
              ["Dias concedidos", data?.metrics.days],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800"
              >
                <p className="text-sm">{label}</p>
                <p className="text-2xl font-bold">{value ?? 0}</p>
              </div>
            ))}
          </div>
          <details className="mt-5">
            <summary className="cursor-pointer font-semibold">
              Auditoria de recompensas e confirmações (100 mais recentes)
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="p-2">Data</th>
                    <th className="p-2">Dias / status</th>
                    <th className="p-2">Pagamento</th>
                    <th className="p-2">Versão</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.rewards ?? []).map((r: any) => (
                    <tr
                      key={r.id}
                      className="border-t border-slate-200 dark:border-slate-700"
                    >
                      <td className="p-2">
                        {new Date(r.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="p-2">
                        {r.days} / {r.revoked_at ? "Revertida" : "Concedida"}
                      </td>
                      <td className="p-2">{r.payment_id}</td>
                      <td className="p-2">{r.version_id}</td>
                    </tr>
                  ))}
                  {(data?.referrals ?? []).map((r: any) => (
                    <tr
                      key={r.id}
                      className="border-t border-slate-200 dark:border-slate-700"
                    >
                      <td className="p-2">
                        {new Date(r.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="p-2">{r.status}</td>
                      <td className="p-2">{r.payment_id ?? "—"}</td>
                      <td className="p-2">{r.version_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">
              Versões anteriores
            </summary>
            <ul className="mt-3 space-y-2">
              {(data?.versions ?? []).map((v: any) => (
                <li key={v.id}>
                  <details>
                    <summary>
                      {new Date(v.created_at).toLocaleString("pt-BR")} •{" "}
                      {v.title} • {v.id}
                    </summary>
                    <pre className="overflow-x-auto whitespace-pre-wrap p-3 text-xs">
                      {JSON.stringify(v, null, 2)}
                    </pre>
                  </details>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}
