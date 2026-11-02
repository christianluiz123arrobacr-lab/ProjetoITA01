import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { calculateDurationPrice } from "../../../../shared/planDurations";

function DurationRow({ planId, baseCents, currency, row, refresh }: {
  planId: string; baseCents: number; currency: string;
  row: { months: number; enabled: boolean; discountBps: number; revision: number }; refresh: () => void;
}) {
  const [enabled, setEnabled] = useState(row.enabled);
  const [percent, setPercent] = useState(String(row.discountBps / 100));
  const save = trpc.billing.durations.save.useMutation({ onSuccess: refresh });
  const discountBps = Math.round(Number(percent) * 100);
  let price: ReturnType<typeof calculateDurationPrice> | null = null;
  try { price = calculateDurationPrice(baseCents, row.months, discountBps); } catch { /* Invalid form value is shown below. */ }
  const money = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100);
  return <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
    <span>{row.months} {row.months === 1 ? "mês" : "meses"}</span>
    <label><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} /> Disponível no checkout</label>
    <label>Desconto (%) <input className="w-20 rounded border bg-background p-1" type="number" min="0" max="99" step="0.01" value={percent} onChange={e => setPercent(e.target.value)} /></label>
    <span>{price ? `${money(price.subtotalCents)} − ${money(price.discountCents)} = ${money(price.totalCents)}` : "Preço ou desconto inválido"}</span>
    <Button disabled={!price || percent.trim() === "" || save.isPending} onClick={() => save.mutate({ planId, months: row.months as 1 | 2 | 3 | 6 | 12, enabled, discountBps, expectedRevision: row.revision })}>Salvar duração</Button>
    {save.error && <span role="alert">{save.error.message}</span>}
  </div>;
}

export default function AdminPlanDurations() {
  const query = trpc.billing.durations.list.useQuery(undefined, { retry: false });
  return <section className="space-y-4 rounded-xl border p-5">
    <h3 className="font-bold">Durações e descontos dos pacotes pré-pagos</h3>
    <p>Sugestão de configuração: 5% para 2, 3 e 6 meses. Essa sugestão não é aplicada automaticamente.</p>
    <p>Configurações salvas valem para novas compras. Compras iniciadas preservam seus preços. Os períodos existentes de 1/2/3 meses mantêm preço integral até configuração; 6/12 precisam ser habilitados. A indicação elegível é aplicada após o desconto por duração.</p>
    {query.isLoading && <p>Carregando durações...</p>}
    {query.error && <p role="alert">Não foi possível carregar. Confira a migration de durações. <button onClick={() => void query.refetch()}>Tentar novamente</button></p>}
    {query.data?.map(plan => <div key={plan.id} className="space-y-2">
      <h4 className="font-semibold">{plan.name} ({plan.slug}) · base mensal: {plan.price_cents / 100} {plan.currency ?? "BRL"}</h4>
      {plan.durations.map(row => <DurationRow key={`${row.months}:${row.revision}`} planId={plan.id} baseCents={plan.price_cents} currency={plan.currency ?? "BRL"} row={row} refresh={() => void query.refetch()} />)}
    </div>)}
  </section>;
}
