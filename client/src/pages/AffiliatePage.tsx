import { useState } from "react";
import { Redirect, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export function AffiliateDashboard({ admin = false }: { admin?: boolean }) {
  const [subject, setSubject] = useState<string>();
  const [from, setFrom] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  );
  const [until, setUntil] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [page, setPage] = useState(0);
  const query = trpc.affiliates.dashboard.useQuery(
    { subjectUserId: subject, from, until, page },
    { retry: false }
  );
  const data = query.data as any;
  const [message, setMessage] = useState("");
  const profile = trpc.affiliates.saveProfile.useMutation();
  const coupon = trpc.affiliates.saveCoupon.useMutation();
  const payout = trpc.affiliates.payout.useMutation();
  const settings = trpc.affiliates.saveSettings.useMutation();
  const release = trpc.affiliates.release.useMutation();
  const [edit, setEdit] = useState<any>(null);
  const money = (n: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(n ?? 0) / 100);
  async function perform(fn: () => Promise<unknown>) {
    try {
      setMessage("");
      await fn();
      setMessage("Registro confirmado.");
      await query.refetch();
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Operação não confirmada; preserve a chave e consulte novamente."
      );
    }
  }
  const inputClass = "rounded border bg-background p-2 text-foreground";
  return (
    <main className="mx-auto max-w-6xl space-y-5 p-6">
      <h1 className="text-2xl font-bold">
        {admin ? "Administração de afiliados" : "Painel do afiliado"}
      </h1>
      <p>
        O cupom identifica vendas atribuídas ao cupom; sozinho, não comprova
        qual vídeo ou publicação gerou a compra.
      </p>
      <p>
        {data?.commercialEnabled
          ? "Programa habilitado no banco; a operação também depende da habilitação do servidor."
          : "Novas compras com cupom permanecem desativadas até homologação e habilitação explícita."}
      </p>
      <div className="flex flex-wrap gap-3">
        <label>
          De (UTC){" "}
          <input
            className={inputClass}
            type="date"
            value={from}
            onChange={e => {
              setFrom(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <label>
          Até, exclusivo (UTC){" "}
          <input
            className={inputClass}
            type="date"
            value={until}
            onChange={e => {
              setUntil(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <button onClick={() => void query.refetch()}>Atualizar</button>
      </div>
      {query.isLoading && <p role="status">Carregando painel...</p>}
      {query.error && <p role="alert">{query.error.message}</p>}
      {message && <p role="status">{message}</p>}
      {admin && data?.affiliates && (
        <label>
          Afiliado{" "}
          <select
            className={inputClass}
            value={subject ?? ""}
            onChange={e => {
              setSubject(e.target.value || undefined);
              setPage(0);
              setEdit(null);
            }}
          >
            <option value="">Minha conta</option>
            {data.affiliates.map((a: any) => (
              <option key={a.id} value={a.user_id}>
                {a.label}
                {a.active ? "" : " (desativado)"}
              </option>
            ))}
          </select>
        </label>
      )}
      {data?.affiliate ? (
        <>
          <h2 className="text-xl font-bold">{data.affiliate.label}</h2>
          <p>
            Referência do próximo pagamento: {data.nextReferenceDate}. Essa data
            é uma referência, não uma transferência automática.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Pendentes", data.pendingCents],
              ["Liberadas (acumuladas)", data.releasedCents],
              ["Pagas", data.paidCents],
              ["Ajustes de estorno", data.reversedCents],
              [
                "Saldo liberado",
                Number(data.releasedCents) - Number(data.paidCents),
              ],
            ].map(([label, n]) => (
              <div className="rounded border p-4" key={String(label)}>
                <p>{label}</p>
                <strong>{money(Number(n))}</strong>
              </div>
            ))}
          </div>
          <h3 className="font-bold">Cupons e links</h3>
          {data.coupons?.map((c: any) => (
            <div key={c.id} className="rounded border p-3">
              <p>
                {c.code} · {c.discount_bps / 100}% de desconto ·{" "}
                {c.commission_bps / 100}% de comissão ·{" "}
                {c.active ? "ativo" : "desativado"}
              </p>
              <p className="break-all">
                {typeof window !== "undefined" ? window.location.origin : ""}
                /planos?cupom={encodeURIComponent(c.code)}
              </p>
              {admin && (
                <button onClick={() => setEdit(c)}>Editar cupom</button>
              )}
            </div>
          ))}
          <h3 className="font-bold">Vendas confirmadas por dia (UTC)</h3>
          {data.salesByDay?.map((r: any) => (
            <p key={r.day}>
              {r.day}: {r.sales} venda(s), líquido após estornos{" "}
              {money(r.sold_cents)}
            </p>
          ))}
          <p>
            No período: {data.periodConfirmedSales} confirmações históricas,
            incluindo vendas posteriormente estornadas · valor líquido{" "}
            {money(data.periodNetCents)}.
          </p>
          <h3 className="font-bold">Vendas no período · {data.saleCount}</h3>
          {data.sales?.map((s: any) => (
            <div key={s.payment_id} className="rounded border p-3">
              <p>
                {s.created_at} · vendido {money(s.paid_cents)} · estornado{" "}
                {money(s.refunded_cents)} · comissão {money(s.commission_cents)}{" "}
                ·{" "}
                {s.chargeback
                  ? "chargeback"
                  : s.approved
                    ? s.released
                      ? "liberada"
                      : "pendente de liberação"
                    : "pagamento não confirmado"}
              </p>
              {admin && s.approved && !s.released && s.commission_cents > 0 && (
                <button
                  disabled={release.isPending}
                  onClick={() =>
                    void perform(() =>
                      release.mutateAsync({ paymentId: s.payment_id })
                    )
                  }
                >
                  Liberar comissão
                </button>
              )}
            </div>
          ))}
          <h3 className="font-bold">
            Repasses registrados · {data.payoutCount}
          </h3>
          {data.payouts?.map((p: any) => (
            <p key={p.id}>
              {p.paid_on}: {money(p.amount_cents)} · referência: {p.reference}
            </p>
          ))}
          <h3 className="font-bold">
            Lançamentos e ajustes · {data.adjustmentCount}
          </h3>
          {data.adjustments?.map((entry: any) => (
            <p key={entry.id}>
              {entry.created_at}: {money(entry.delta_cents)} · {entry.reason}
            </p>
          ))}
          <div className="flex gap-4">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>
              Anterior
            </button>
            <span>Página {page + 1} · 20 registros por lista</span>
            <button
              disabled={
                (page + 1) * 20 >=
                Math.max(
                  Number(data.saleCount),
                  Number(data.payoutCount),
                  Number(data.adjustmentCount)
                )
              }
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </button>
          </div>
        </>
      ) : (
        data &&
        !query.error && <p>Nenhum perfil de afiliado vinculado a esta conta.</p>
      )}
      {admin && (
        <section className="space-y-5 border-t pt-5">
          <h2 className="text-xl font-bold">Configurações administrativas</h2>
          <form
            className="flex flex-wrap gap-3"
            onSubmit={e => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void perform(() =>
                profile.mutateAsync({
                  userId: String(f.get("userId")),
                  label: String(f.get("label")),
                  active: f.has("active"),
                })
              );
            }}
          >
            <input
              className={inputClass}
              name="userId"
              placeholder="UUID da conta existente"
              required
            />
            <input
              className={inputClass}
              name="label"
              placeholder="Nome do afiliado"
              required
              maxLength={100}
            />
            <label>
              <input type="checkbox" name="active" /> Ativo
            </label>
            <button disabled={profile.isPending}>
              Vincular / atualizar conta
            </button>
          </form>
          <form
            className="flex gap-3"
            onSubmit={e => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void perform(() =>
                settings.mutateAsync({ payoutDay: Number(f.get("day")) })
              );
            }}
          >
            <label>
              Dia de referência mensal (1–31; último dia nos meses menores){" "}
              <input
                className={inputClass}
                name="day"
                type="number"
                min={1}
                max={31}
                defaultValue={data?.payoutDay ?? 10}
                required
              />
            </label>
            <button disabled={settings.isPending}>Salvar dia</button>
          </form>
          {data?.affiliate && (
            <>
              <form
                key={edit?.id ?? "new"}
                className="flex flex-wrap gap-3"
                onSubmit={e => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void perform(() =>
                    coupon.mutateAsync({
                      id: edit?.id,
                      affiliateId: data.affiliate.id,
                      code: String(f.get("code")),
                      active: f.has("active"),
                      discountBps: Math.round(Number(f.get("discount")) * 100),
                      commissionBps: Math.round(
                        Number(f.get("commission")) * 100
                      ),
                      startsAt: f.get("start")
                        ? new Date(String(f.get("start")) + "Z").toISOString()
                        : null,
                      expiresAt: f.get("end")
                        ? new Date(String(f.get("end")) + "Z").toISOString()
                        : null,
                      maxUses: f.get("limit") ? Number(f.get("limit")) : null,
                      planIds: String(f.get("plans")).trim()
                        ? String(f.get("plans"))
                            .split(",")
                            .map(x => x.trim())
                        : null,
                    })
                  );
                }}
              >
                <input
                  className={inputClass}
                  name="code"
                  placeholder="Código do cupom"
                  required
                  defaultValue={edit?.code}
                />
                <label>
                  Desconto %{" "}
                  <input
                    className={inputClass}
                    name="discount"
                    type="number"
                    min={0}
                    max={99}
                    step="0.01"
                    required
                    defaultValue={(edit?.discount_bps ?? 0) / 100}
                  />
                </label>
                <label>
                  Comissão %{" "}
                  <input
                    className={inputClass}
                    name="commission"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    required
                    defaultValue={(edit?.commission_bps ?? 0) / 100}
                  />
                </label>
                <label>
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={edit?.active ?? false}
                  />
                  Ativo
                </label>
                <label>
                  Início UTC{" "}
                  <input
                    className={inputClass}
                    name="start"
                    type="datetime-local"
                    defaultValue={edit?.starts_at?.slice(0, 16)}
                  />
                </label>
                <label>
                  Fim UTC{" "}
                  <input
                    className={inputClass}
                    name="end"
                    type="datetime-local"
                    defaultValue={edit?.expires_at?.slice(0, 16)}
                  />
                </label>
                <input
                  className={inputClass}
                  name="limit"
                  placeholder="Limite de usos (opcional)"
                  type="number"
                  min={1}
                  defaultValue={edit?.max_uses ?? ""}
                />
                <input
                  className={inputClass}
                  name="plans"
                  placeholder="UUIDs dos planos, separados por vírgula; vazio = todos"
                  defaultValue={edit?.plan_ids?.join(",") ?? ""}
                />
                <button disabled={coupon.isPending}>
                  {edit ? "Salvar edição" : "Criar cupom"}
                </button>
                <button type="button" onClick={() => setEdit(null)}>
                  Novo cupom
                </button>
              </form>
              <form
                className="flex flex-wrap gap-3"
                onSubmit={e => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void perform(async () => {
                    const k = `affiliate-payout:${data.affiliate.id}`;
                    let requestKey = localStorage.getItem(k);
                    if (!requestKey) {
                      requestKey = crypto.randomUUID();
                      localStorage.setItem(k, requestKey);
                    }
                    return payout.mutateAsync({
                      affiliateId: data.affiliate.id,
                      requestKey,
                      amountCents: Math.round(Number(f.get("amount")) * 100),
                      paidOn: String(f.get("date")),
                      reference: String(f.get("reference")),
                    });
                  });
                }}
              >
                <h3 className="w-full font-bold">
                  Registrar transferência já feita fora do sistema
                </h3>
                <input
                  className={inputClass}
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Valor em reais"
                  required
                />
                <input
                  className={inputClass}
                  name="date"
                  type="date"
                  required
                />
                <input
                  className={inputClass}
                  name="reference"
                  placeholder="Referência única da transferência externa"
                  required
                  maxLength={160}
                />
                <button disabled={payout.isPending}>
                  Confirmar registro (não envia Pix)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Iniciar outro registro de repasse? Antes, confira se o anterior foi confirmado no histórico."
                      )
                    )
                      localStorage.removeItem(
                        `affiliate-payout:${data.affiliate.id}`
                      );
                  }}
                >
                  Iniciar outro registro
                </button>
              </form>
            </>
          )}
        </section>
      )}
      <Link href="/minha-assinatura">Minha assinatura</Link>
    </main>
  );
}
export default function AffiliatePage() {
  const auth = useSupabaseAuth();
  if (auth.loading) return <p role="status">Carregando sessão...</p>;
  if (auth.error)
    return (
      <div role="alert">
        Sessão indisponível.{" "}
        <button onClick={() => void auth.retry()}>Tentar novamente</button>
      </div>
    );
  if (!auth.isAuthenticated) return <Redirect to="/login" />;
  return <AffiliateDashboard />;
}
