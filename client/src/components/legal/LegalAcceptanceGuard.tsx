import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Loader2, LogOut, ShieldCheck } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { trpc } from "@/lib/trpc";
import { LEGAL_ROUTES } from "@shared/legalDocuments";

const documentLinks = [
  ["Termos de Uso", "/termos-de-uso"],
  ["Política de Privacidade", "/politica-de-privacidade"],
  ["Assinaturas e reembolso", "/assinaturas-cancelamento-e-reembolso"],
  ["Regras do Indique e Ganhe", "/regras-indique-e-ganhe"],
] as const;

export default function LegalAcceptanceGuard({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { isAuthenticated, loading, signOut } = useSupabaseAuth();
  const [accepted, setAccepted] = useState(false);
  const utils = trpc.useUtils();
  const publicConfig = trpc.legal.publicConfig.useQuery();
  const isLegalPage = LEGAL_ROUTES.some(route => location === route);
  const status = trpc.legal.acceptanceStatus.useQuery(undefined, {
    enabled: isAuthenticated && !loading && !isLegalPage,
    retry: false,
  });
  const accept = trpc.legal.acceptCurrent.useMutation({
    onSuccess: () => utils.legal.acceptanceStatus.invalidate(),
  });

  if (loading || !isAuthenticated || isLegalPage || status.data?.required === false) return <>{children}</>;

  return (
    <div className="theme-page flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section role="dialog" aria-modal="true" aria-labelledby="legal-title" className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <ShieldCheck className="h-9 w-9 text-cyan-600 dark:text-cyan-300" />
        <h1 id="legal-title" className="mt-4 text-2xl font-black">Atualizamos nossos termos</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Os documentos esclarecem o funcionamento da plataforma, assinaturas, privacidade e segurança dos dados.</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {documentLinks.map(([label, href]) => <Link key={href} href={href}><a target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-slate-700 dark:hover:bg-slate-800">{label}</a></Link>)}
        </div>
        {status.isError ? (
          <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">Não foi possível confirmar seu aceite. Tente novamente ou saia da conta.</p>
        ) : (
          <label className="mt-6 flex items-start gap-3 text-sm"><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} className="mt-1 h-4 w-4" />Li e concordo com os Termos de Uso e a Política de Privacidade.</label>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" disabled={!accepted || accept.isPending || status.isError || status.isLoading} onClick={() => accept.mutate({ accepted: true })} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50">{accept.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Continuar</button>
          <button type="button" onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold dark:border-slate-700"><LogOut className="h-4 w-4" />Sair</button>
          {publicConfig.data?.contactEmail && <a href={`mailto:${publicConfig.data.contactEmail}`} className="inline-flex items-center rounded-xl px-3 py-3 text-sm font-semibold text-cyan-700 hover:underline dark:text-cyan-300">Falar com o suporte</a>}
        </div>
        {accept.error && <p className="mt-3 text-sm text-red-600 dark:text-red-300">Não foi possível registrar o aceite.</p>}
      </section>
    </div>
  );
}
