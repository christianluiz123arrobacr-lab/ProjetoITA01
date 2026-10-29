import { Redirect } from "wouter";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import CommerceHeader from "@/components/billing/CommerceHeader";
import {
  useAffiliateReport,
  ReportState,
} from "@/components/affiliates/ReportState";
function Dashboard() {
  const report = useAffiliateReport();
  return (
    <div className="commerce-surface min-h-screen bg-background text-foreground">
      <CommerceHeader />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <header>
          <p className="text-sm font-semibold text-primary">
            PARCEIROS · PROJETO VETOR
          </p>
          <h1 className="mt-2 text-3xl font-bold">Painel do afiliado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acompanhe seus cupons, resultados e repasses.
          </p>
        </header>
        <p className="rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
          {(report.query.data as any)?.commercialEnabled === false ? "Programa comercial fechado: novas compras com cupom estão desativadas." : "Compras com cupom dependem da habilitação comercial."} O cupom atribui
          vendas, mas não identifica qual vídeo ou publicação gerou a compra.
        </p>
        {report.filter}
        <ReportState report={report} />
      </main>
    </div>
  );
}
export default function AffiliatePage() {
  const auth = useSupabaseAuth();
  if (auth.loading) return <p role="status">Carregando sessão…</p>;
  if (auth.error)
    return (
      <div role="alert">
        Não foi possível confirmar sua sessão.{" "}
        <button onClick={() => void auth.retry()}>Tentar novamente</button>
      </div>
    );
  if (!auth.isAuthenticated) return <Redirect to="/login" />;
  return <Dashboard key={auth.user?.id} />;
}
