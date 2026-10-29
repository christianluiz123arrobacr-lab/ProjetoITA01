import { displayDay } from "@/lib/affiliatePeriod";
import {
  Wallet,
  CalendarDays,
  ArrowUpRight,
  Ticket,
  CircleCheck,
  Clock3,
} from "lucide-react";
import { useState } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
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
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
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
  const [chartMetric, setChartMetric] = useState<"sales" | "sold_cents">(
    "sales"
  );
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
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm lg:row-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Disponível para repasse</p>
            <Wallet size={22} aria-hidden="true" />
          </div>
          <p className="mt-5 text-4xl font-bold tracking-tight tabular-nums">
            {money(data.releasedCents - data.paidCents)}
          </p>
          <p className="mt-2 text-xs opacity-90">
            Comissões liberadas menos repasses registrados · histórico
          </p>
          <div className="mt-7 rounded-xl border border-current/20 bg-background/10 p-3">
            <p className="flex items-center gap-2 text-sm">
              <CalendarDays size={16} aria-hidden="true" />
              Referência: {displayDay(data.nextReferenceDate)}
            </p>
            <p className="mt-2 text-xs leading-relaxed opacity-90">
              Data de referência, sem garantia de pagamento. O repasse é
              realizado externamente e registrado pela administração.
            </p>
          </div>
        </section>
        {[
          [
            "Aguardando liberação",
            data.pendingCents,
            "Histórico · sujeito à revisão",
            Clock3,
          ],
          [
            "Repasses registrados",
            data.paidCents,
            "Histórico · pagamentos externos",
            ArrowUpRight,
          ],
          [
            "Comissões liberadas",
            data.releasedCents,
            "Acumulado histórico",
            CircleCheck,
          ],
          [
            "Ajustes por estorno",
            data.reversedCents,
            "Reduções acumuladas no histórico",
            Wallet,
          ],
        ].map(([label, value, note, Icon]: any) => (
          <section
            key={label}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon
                size={18}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums">
              {money(value)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{note}</p>
          </section>
        ))}
      </div>
      <div
        role="group"
        aria-label="Seções do painel"
        className="flex flex-wrap gap-1 rounded-2xl border border-border bg-card p-2"
      >
        {["Visão geral", "Vendas", "Cupons", "Repasses", "Ajustes"].map(t => (
          <button
            key={t}
            aria-pressed={tab === t}
            className={
              action +
              " border-transparent aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            }
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Visão geral" && (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Resultados do período · UTC
              </p>
              <h2 className="mt-2 text-xl font-bold">Vendas confirmadas</h2>
            </div>
            <div
              role="group"
              aria-label="Métrica do gráfico"
              className="flex gap-1 rounded-xl bg-muted p-1"
            >
              {[
                ["sales", "Confirmações"],
                ["sold_cents", "Valor líquido"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  aria-pressed={chartMetric === key}
                  className="rounded-lg px-3 py-2 text-xs font-semibold aria-pressed:bg-card aria-pressed:shadow-sm focus-visible:outline-2 focus-visible:outline-primary"
                  onClick={() => setChartMetric(key as typeof chartMetric)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p className="my-3 text-sm text-muted-foreground">
            {data.periodConfirmedSales} confirmações no período ·{" "}
            {money(data.periodNetCents)} líquidos após estornos
          </p>
          {data.salesByDay?.length ? (
            <>
              <div
                className="h-56"
                aria-label={
                  chartMetric === "sales"
                    ? "Gráfico de confirmações por dia UTC"
                    : "Gráfico de valor líquido por dia UTC"
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.salesByDay}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="day"
                      tickFormatter={v => displayDay(String(v)).slice(0, 5)}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={v =>
                        chartMetric === "sales" ? String(v) : money(v)
                      }
                      allowDecimals={chartMetric !== "sales"}
                      width={80}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      labelFormatter={v => displayDay(String(v))}
                      formatter={v =>
                        chartMetric === "sales" ? Number(v) : money(Number(v))
                      }
                      contentStyle={{
                        background: "var(--card)",
                        color: "var(--foreground)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={chartMetric}
                      name={
                        chartMetric === "sales"
                          ? "Confirmações"
                          : "Valor líquido"
                      }
                      stroke="var(--primary)"
                      fill="var(--primary)"
                      fillOpacity={0.12}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="my-4 text-xs leading-relaxed text-muted-foreground">
                Confirmações seguem a data da aprovação, inclusive vendas
                posteriormente estornadas. O valor líquido desconta estornos
                registrados; não representa comissão. Dias sem registros não
                acrescentam vendas.
              </p>
              <details>
                <summary className="cursor-pointer text-sm">
                  Ver dados do gráfico em tabela
                </summary>
                {table(
                  ["Dia UTC", "Confirmações", "Valor líquido"],
                  data.salesByDay.map((r: any) => [
                    displayDay(r.day),
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
                  <code className="flex min-w-0 items-center gap-2 break-all text-lg font-bold">
                    <Ticket
                      size={20}
                      className="shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    {c.code}
                  </code>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs">
                    {!data.commercialEnabled
                      ? "Programa fechado"
                      : c.active && data.affiliate.active
                        ? "Cadastro ativo"
                        : "Indisponível"}
                  </span>
                </div>
                <p className="my-3 text-sm text-muted-foreground">
                  {c.discount_bps / 100}% de desconto · {c.commission_bps / 100}
                  % de comissão
                </p>
                <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                  Status cadastral: {c.active ? "ativo" : "inativo"}. Validade
                  UTC:{" "}
                  {c.starts_at
                    ? new Date(c.starts_at).toLocaleString("pt-BR", {timeZone:"UTC"})
                    : "sem início definido"}{" "}
                  até{" "}
                  {c.expires_at
                    ? new Date(c.expires_at).toLocaleString("pt-BR", {timeZone:"UTC"})
                    : "sem término definido"}
                  .{" "}
                  {c.max_uses
                    ? `Limite total: ${c.max_uses} usos (inclui reservas pendentes).`
                    : "Sem limite total de usos configurado."}{" "}
                  {c.plan_ids
                    ? "Restrito a planos selecionados pela administração."
                    : "Sem restrição adicional de plano."}
                </p>
                <p className="mb-2 text-xs text-muted-foreground">
                  O link preenche o cupom; preço e elegibilidade são validados
                  no checkout.
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
      {tab === "Vendas" && (
        <p className="text-xs text-muted-foreground">
          Vendas criadas no período · datas UTC. Confirmação e liberação são
          etapas diferentes. Dados dos compradores são preservados.
        </p>
      )}
      {tab === "Repasses" && (
        <p className="text-xs text-muted-foreground">
          Histórico de pagamentos feitos externamente e registrados pela
          administração. Esta página não transfere dinheiro.
        </p>
      )}
      {tab === "Ajustes" && (
        <p className="text-xs text-muted-foreground">
          Histórico contábil de comissões: créditos positivos e reduções
          negativas. Inclui ajustes de confirmação e estorno.
        </p>
      )}
      {tab === "Vendas" &&
        (data.sales?.length ? (
          table(
            ["Criada em (UTC)", "Valor", "Estorno", "Comissão", "Situação"],
            data.sales.map((s: any) => [
              displayDay(s.created_at),
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
              displayDay(p.paid_on),
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
              displayDay(e.created_at),
              (e.delta_cents > 0 ? "+" : "") + money(e.delta_cents),
              (
                {
                  approved: "Comissão de venda confirmada",
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
