import {
  displayDay,
  presetPeriod,
  shiftDay,
  validPeriod,
} from "@/lib/affiliatePeriod";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AffiliateReport, Empty, action, field } from "./AffiliateReport";
export function useAffiliateReport(subject?: string) {
  const [range, setRange] = useState(() => presetPeriod("last30"));
  const [draft, setDraft] = useState(range);
  const [invalid, setInvalid] = useState(false);
  const [page, setPage] = useState(0);
  const query = trpc.affiliates.dashboard.useQuery(
    {
      subjectUserId: subject,
      from: range.from,
      until: shiftDay(range.end, 1),
      page,
    },
    { retry: false }
  );
  function apply(next: typeof range) {
    if (!validPeriod(next.from, next.end)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setDraft(next);
    setRange(next);
    setPage(0);
    if (next.from === range.from && next.end === range.end)
      void query.refetch();
  }
  return {
    query,
    from: range.from,
    until: shiftDay(range.end, 1),
    page,
    setPage,
    filter: (
      <form
        className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
        onSubmit={e => {
          e.preventDefault();
          apply(draft);
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Período de análise</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {displayDay(range.from)} a {displayDay(range.end)} · dias em UTC
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["month", "Este mês"],
              ["previous", "Mês anterior"],
              ["last30", "Últimos 30 dias"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={action}
                onClick={() => apply(presetPeriod(key))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="min-w-0 flex-1 text-xs font-medium">
            Data inicial
            <input
              type="date"
              required
              className={field}
              value={draft.from}
              onChange={e => setDraft({ ...draft, from: e.target.value })}
            />
          </label>
          <label className="min-w-0 flex-1 text-xs font-medium">
            Data final (incluída)
            <input
              type="date"
              required
              className={field}
              value={draft.end}
              onChange={e => setDraft({ ...draft, end: e.target.value })}
            />
          </label>
          <button disabled={query.isFetching} className={action}>
            {query.isFetching ? "Consultando…" : "Aplicar período"}
          </button>
        </div>
        {invalid && (
          <p role="alert" className="text-sm text-destructive">
            Escolha datas válidas em ordem, com no máximo 366 dias.
          </p>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          Filtra o gráfico e as confirmações pela data de confirmação; a lista
          de vendas pela data de criação. Saldos, cupons, repasses e ajustes
          continuam históricos.
        </p>
      </form>
    ),
  };
}
export function ReportState({
  report,
  onEdit,
  onRelease,
  busy,
}: {
  report: ReturnType<typeof useAffiliateReport>;
  onEdit?: (c: any) => void;
  onRelease?: (id: string) => void;
  busy?: boolean;
}) {
  const { query, page, setPage } = report;
  const data = query.data as any;
  if (query.isLoading)
    return (
      <div
        role="status"
        className="rounded-2xl border bg-card p-10 text-center"
      >
        <LoaderCircle
          aria-hidden="true"
          className="mx-auto mb-3 h-7 w-7 animate-spin motion-reduce:animate-none text-primary"
        />
        Carregando seu painel…
      </div>
    );
  if (query.error)
    return (
      <div role="alert" className="rounded-2xl border p-6">
        <h2 className="font-bold">
          {query.error.data?.code === "FORBIDDEN"
            ? "Não há acesso ao programa nesta conta"
            : "Não foi possível carregar o painel"}
        </h2>
        <p className="my-3 text-sm text-muted-foreground">
          {query.error.data?.code === "FORBIDDEN"
            ? "Esta conta não possui acesso autorizado ao painel. Se esperava um vínculo, consulte a administração."
            : "A consulta está indisponível. Seus valores não foram substituídos por zero; tente novamente."}
        </p>
        <button className={action} onClick={() => void query.refetch()}>
          Tentar novamente
        </button>
      </div>
    );
  if (!data?.affiliate)
    return (
      <Empty title="Sua conta ainda não está vinculada ao programa">
        O cadastro é feito pela administração. Quando houver um vínculo
        autorizado, seus cupons e resultados aparecerão aqui.
      </Empty>
    );
  return (
    <>
      <AffiliateReport
        key={data.affiliate.id}
        data={data}
        onEdit={onEdit}
        onRelease={onRelease}
        busy={busy}
      />
      <div className="flex items-center justify-between gap-3">
        <button
          className={action}
          disabled={page === 0 || query.isFetching}
          onClick={() => setPage(page - 1)}
        >
          Anterior
        </button>
        <span className="text-xs text-muted-foreground">
          Página {page + 1} · até 20 por lista
        </span>
        <button
          className={action}
          disabled={
            query.isFetching ||
            (page + 1) * 20 >=
              Math.max(data.saleCount, data.payoutCount, data.adjustmentCount)
          }
          onClick={() => setPage(page + 1)}
        >
          Próxima
        </button>
      </div>
    </>
  );
}
