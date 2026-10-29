import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
export const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(n ?? 0) / 100
  );
export const action =
  "rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50";
export const field =
  "w-full min-w-0 rounded-xl border border-input bg-background p-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary";
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
        {children}
      </p>
    </div>
  );
}
export function AffiliateReport({
  data,
  onEdit,
  onRelease,
  busy = false,
}: {
  data: any;
  onEdit?: (c: any) => void;
  onRelease?: (id: string) => void;
  busy?: boolean;
}) {
  const [tab, setTab] = useState("Visão geral");
  const [copied, setCopied] = useState("");
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("Copiado.");
    } catch {
      setCopied("Não foi possível copiar. Selecione o código ou link.");
    }
  }
  const table = (heads: string[], rows: React.ReactNode[][]) => (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-muted">
          <tr>
            {heads.map(h => (
              <th key={h} className="p-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              {r.map((c, j) => (
                <td key={j} className={"p-3 " + (j > 0 ? "tabular-nums" : "")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <div className="min-w-0 space-y-5">
      {!data.affiliate.active && (
        <p role="status" className="rounded-xl bg-muted p-4 text-sm">
          Seu vínculo está desativado. O histórico continua disponível; novas
          compras com seus cupons estão indisponíveis.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
          <p className="text-sm">Saldo liberado a receber · histórico</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {money(data.releasedCents - data.paidCents)}
          </p>
          <p className="mt-3 text-xs">
            Referência: {data.nextReferenceDate}. Não representa transferência
            automática.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Aguardando liberação", data.pendingCents],
            ["Repasses registrados", data.paidCents],
            ["Liberadas acumuladas", data.releasedCents],
            ["Ajustes por estorno", data.reversedCents],
          ].map(([l, v]) => (
            <div key={String(l)} className="rounded-2xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{l}</p>
              <p className="mt-2 font-bold tabular-nums">{money(Number(v))}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Os saldos acima são históricos. As datas filtram confirmações, valores e
        vendas do período.
      </p>
      <div
        role="group"
        aria-label="Seções do painel"
        className="flex flex-wrap gap-2"
      >
        {["Visão geral", "Vendas", "Cupons", "Repasses", "Ajustes"].map(t => (
          <button
            key={t}
            aria-pressed={tab === t}
            className={
              action +
              " aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            }
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Visão geral" && (
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-bold">Vendas confirmadas no período (UTC)</h2>
          <p className="my-3 text-sm text-muted-foreground">
            {data.periodConfirmedSales} confirmações históricas ·{" "}
            {money(data.periodNetCents)} líquidos após estornos
          </p>
          {data.salesByDay?.length ? (
            <>
              <div
                className="h-56"
                aria-label="Gráfico de valor líquido vendido por dia"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.salesByDay}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis
                      tickFormatter={v => money(v)}
                      width={80}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip formatter={v => money(Number(v))} />
                    <Area
                      dataKey="sold_cents"
                      name="Valor líquido"
                      stroke="var(--primary)"
                      fill="var(--primary)"
                      fillOpacity={0.12}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <details>
                <summary className="cursor-pointer text-sm">
                  Ver dados do gráfico em tabela
                </summary>
                {table(
                  ["Dia UTC", "Confirmações", "Valor líquido"],
                  data.salesByDay.map((r: any) => [
                    r.day,
                    r.sales,
                    money(r.sold_cents),
                  ])
                )}
              </details>
            </>
          ) : (
            <Empty title="Ainda sem vendas neste período">
              Suas vendas confirmadas aparecerão aqui. Experimente outro
              período.
            </Empty>
          )}
        </section>
      )}
      {tab === "Cupons" && (
        <section className="space-y-3">
          <h2 className="font-bold">Seus cupons</h2>
          {copied && <p role="status">{copied}</p>}
          {data.coupons?.length ? (
            data.coupons.map((c: any) => (
              <div key={c.id} className="rounded-2xl border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <code className="text-lg font-bold">{c.code}</code>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs">
                    {!data.commercialEnabled
                      ? "Programa fechado"
                      : c.active && data.affiliate.active
                        ? "Ativo"
                        : "Indisponível"}
                  </span>
                </div>
                <p className="my-3 text-sm text-muted-foreground">
                  {c.discount_bps / 100}% de desconto · {c.commission_bps / 100}
                  % de comissão
                </p>
                <p className="mb-3 break-all text-xs">
                  {location.origin}/planos?cupom={encodeURIComponent(c.code)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button className={action} onClick={() => void copy(c.code)}>
                    Copiar código
                  </button>
                  <button
                    className={action}
                    onClick={() =>
                      void copy(
                        location.origin +
                          "/planos?cupom=" +
                          encodeURIComponent(c.code)
                      )
                    }
                  >
                    Copiar link
                  </button>
                  {onEdit && (
                    <button className={action} onClick={() => onEdit(c)}>
                      Editar
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <Empty title="Nenhum cupom cadastrado">
              Os cupons vinculados a você serão exibidos nesta seção.
            </Empty>
          )}
        </section>
      )}
      {tab === "Vendas" &&
        (data.sales?.length ? (
          table(
            ["Criada em", "Valor", "Estorno", "Comissão", "Situação"],
            data.sales.map((s: any) => [
              new Date(s.created_at).toLocaleDateString("pt-BR"),
              money(s.paid_cents),
              money(s.refunded_cents),
              money(s.commission_cents),
              <div className="space-y-2">
                <span className="inline-block rounded-full bg-muted px-2 py-1 text-xs">
                  {s.chargeback
                    ? "Contestada"
                    : s.approved
                      ? s.released
                        ? "Liberada"
                        : "Aguardando liberação"
                      : "Não confirmada"}
                </span>
                {onRelease &&
                  s.approved &&
                  !s.released &&
                  s.commission_cents > 0 && (
                    <button
                      disabled={busy}
                      className={action}
                      onClick={() => onRelease(s.payment_id)}
                    >
                      Liberar comissão
                    </button>
                  )}
              </div>,
            ])
          )
        ) : (
          <Empty title="Nenhuma venda neste período" />
        ))}
      {tab === "Repasses" &&
        (data.payouts?.length ? (
          table(
            ["Data", "Valor pago", "Referência"],
            data.payouts.map((p: any) => [
              p.paid_on,
              money(p.amount_cents),
              p.reference,
            ])
          )
        ) : (
          <Empty title="Nenhum repasse registrado">
            Aqui aparecem transferências já realizadas e registradas pela
            administração.
          </Empty>
        ))}
      {tab === "Ajustes" &&
        (data.adjustments?.length ? (
          table(
            ["Data", "Valor", "Motivo"],
            data.adjustments.map((e: any) => [
              new Date(e.created_at).toLocaleDateString("pt-BR"),
              money(e.delta_cents),
              (
                {
                  partial_refund: "Estorno parcial",
                  chargeback: "Contestação",
                  refund: "Estorno",
                } as any
              )[e.reason] ?? e.reason,
            ])
          )
        ) : (
          <Empty title="Nenhum ajuste registrado" />
        ))}
    </div>
  );
}
