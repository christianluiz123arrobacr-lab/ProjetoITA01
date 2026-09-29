import { useEffect, useState } from "react";
import { trpcClient } from "@/lib/trpcClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const statuses: Record<string, string> = {
  approved: "Aprovado",
  pending: "Pendente",
  rejected: "Recusado",
  failed: "Falhou",
  canceled: "Cancelado",
  expired: "Expirado",
  refunded: "Reembolsado",
  chargeback: "Contestado",
  in_process: "Em processamento",
};
const date = (value: string) => new Date(value).toLocaleString("pt-BR");

export default function PaymentHistory() {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    trpcClient.billing.getPaymentHistory
      .query({ page })
      .then(data => {
        if (alive) setResult(data);
      })
      .catch(() => {
        if (alive) setError("NÃ£o foi possÃ­vel carregar os pagamentos.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [page, retry]);
  return (
    <Card className="mx-auto mt-6 w-full max-w-4xl border-white/10 bg-white/[0.04] p-6 text-white">
      <h2 className="text-xl font-black">HistÃ³rico de pagamentos</h2>
      {loading ? (
        <p role="status" className="mt-4">
          Carregando pagamentos...
        </p>
      ) : error ? (
        <div role="alert" className="mt-4">
          <p>{error}</p>
          <Button onClick={() => setRetry(v => v + 1)}>Tentar novamente</Button>
        </div>
      ) : (
        <>
          {!result?.items.length && (
            <p className="mt-4 text-slate-300">
              Nenhum pagamento registrado. Acessos legados podem existir sem
              registro financeiro.
            </p>
          )}
          <div className="mt-4 space-y-3">
            {result?.items.map((payment: any) => (
              <div
                key={payment.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <p className="font-bold">
                  {payment.billing_plans?.name ?? "Plano nÃ£o identificado"} â€¢{" "}
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: payment.currency || "BRL",
                  }).format(payment.amount_cents / 100)}
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  {payment.payment_method === "mercadopago_pix"
                    ? "Pix"
                    : payment.payment_method === "mercadopago_card"
                      ? "CartÃ£o"
                      : "Pagamento manual"}{" "}
                  â€¢ {statuses[payment.status] ?? "Em anÃ¡lise"}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Criado em {date(payment.created_at)}
                  {payment.approved_at
                    ? ` â€¢ Aprovado em ${date(payment.approved_at)}`
                    : ""}
                </p>
                {payment.access_duration_value && (
                  <p className="mt-1 text-sm text-slate-300">
                    DuraÃ§Ã£o: {payment.access_duration_value}{" "}
                    {payment.access_duration_unit === "months"
                      ? payment.access_duration_value === 1
                        ? "mÃªs"
                        : "meses"
                      : "dias"}
                  </p>
                )}
              </div>
            ))}
          </div>
          {result?.total > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <Button disabled={page === 0} onClick={() => setPage(v => v - 1)}>
                Anterior
              </Button>
              <span>
                PÃ¡gina {page + 1} de{" "}
                {Math.ceil(result.total / result.pageSize)}
              </span>
              <Button
                disabled={(page + 1) * result.pageSize >= result.total}
                onClick={() => setPage(v => v + 1)}
              >
                PrÃ³xima
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
