import { ArrowLeft, Handshake, ShieldCheck } from "lucide-react";
import { action } from "@/components/affiliates/AffiliateReport";
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
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">
              PARCEIROS · PROJETO VETOR
            </p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight">
              <Handshake className="text-primary" aria-hidden="true" />
              Painel do afiliado
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {(report.query.data as any)?.affiliate?.label
                ? `Olá, ${(report.query.data as any).affiliate.label}. Acompanhe seus resultados e próximos passos.`
                : "Seus cupons, resultados e repasses em um só lugar."}
            </p>
          </div>
          <a
            href="/plataforma"
            className={action + " inline-flex items-center gap-2"}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar à plataforma
          </a>
        </header>
        <p className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck
            className="h-5 w-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <span>
            {(report.query.data as any)?.commercialEnabled === false
              ? "Programa comercial fechado: novas compras com cupom estão desativadas."
              : "Compras com cupom dependem da habilitação comercial."}{" "}
            O cupom atribui vendas, mas não identifica qual vídeo ou publicação
            gerou a compra.
          </span>
        </p>
        {report.filter}
        <ReportState report={report} />
      </main>
    </div>
  );
}
export default function AffiliatePage() {
  const auth = useSupabaseAuth();
  if (auth.loading)
    return (
      <div className="commerce-surface min-h-screen bg-background text-foreground">
        <CommerceHeader />
        <p role="status" className="p-12 text-center">
          Carregando sessão…
        </p>
      </div>
    );
  if (auth.error)
    return (
      <div
        role="alert"
        className="commerce-surface min-h-screen bg-background p-8 text-foreground"
      >
        Não foi possível confirmar sua sessão.{" "}
        <button onClick={() => void auth.retry()}>Tentar novamente</button>
      </div>
    );
  if (!auth.isAuthenticated)
    return <Redirect to="/login?returnTo=%2Fafiliados" />;
  return <Dashboard key={auth.user?.id} />;
}
