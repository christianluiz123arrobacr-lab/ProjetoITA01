import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AffiliateReport, Empty, action, field } from "./AffiliateReport";
export function useAffiliateReport(subject?: string) {
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
  return {
    query,
    from,
    until,
    page,
    setPage,
    filter: (
      <form
        className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4"
        onSubmit={e => {
          e.preventDefault();
          void query.refetch();
        }}
      >
        <label className="text-xs font-medium">
          De (UTC)
          <input
            type="date"
            className={field}
            value={from}
            onChange={e => {
              setFrom(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <label className="text-xs font-medium">
          Até, exclusivo (UTC)
          <input
            type="date"
            className={field}
            value={until}
            onChange={e => {
              setUntil(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <button disabled={query.isFetching} className={action}>
          Atualizar
        </button>
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
          Se você ainda não tem um vínculo de afiliado, entre em contato com a
          administração. Nenhum vínculo é criado automaticamente.
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
