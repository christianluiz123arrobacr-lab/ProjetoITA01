import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useState } from "react";
import { useAffiliateReport, ReportState } from "./ReportState";
import { action, field } from "./AffiliateReport";
import AffiliateForms from "./AffiliateForms";
export default function AdminAffiliateDashboard() {
  const auth = useSupabaseAuth();
  const [subject, setSubject] = useState<string>();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<string | null>(null);
  const [edit, setEdit] = useState<any>(null);
  const [releaseId, setReleaseId] = useState<string>();
  const [message, setMessage] = useState("");
  const report = useAffiliateReport(subject);
  const data = report.query.data as any;
  function open(next: string, value: any = null) {
    setEdit(value);
    setMode(next);
  }
  return (
    <div className="min-w-0 space-y-5 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">
          Gerencie vínculos, cupons e transferências já realizadas. Compras com
          cupom continuam sujeitas à habilitação comercial.
        </p>
        <button
          className={action + " bg-primary text-primary-foreground"}
          onClick={() => open("profile")}
        >
          Adicionar afiliado
        </button>
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-3 rounded-2xl border bg-card p-4">
          <label className="block text-sm font-semibold">
            Buscar afiliado
            <input
              className={field + " mt-2"}
              placeholder="Nome de exibição"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </label>
          {data?.affiliates
            ?.filter((a: any) =>
              a.label.toLowerCase().includes(search.toLowerCase())
            )
            .map((a: any) => (
              <button
                className={action + " w-full text-left aria-pressed:bg-muted"}
                aria-pressed={subject === a.user_id}
                key={a.id}
                onClick={() => {
                  setSubject(a.user_id);
                  report.setPage(0);
                  setMode(null);
                }}
              >
                <span className="block">{a.label}</span>
                <span className="text-xs text-muted-foreground">
                  {a.active ? "Ativo" : "Desativado"}
                </span>
              </button>
            ))}
          <button
            className={action + " w-full"}
            onClick={() => open("settings", { payoutDay: data?.payoutDay })}
          >
            Dia de referência
          </button>
        </aside>
        <section className="min-w-0 space-y-5">
          {data?.affiliate && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold">{data.affiliate.label}</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  className={action}
                  onClick={() =>
                    open("profile", {
                      ...data.affiliate,
                      user_id: subject ?? auth.user?.id,
                    })
                  }
                >
                  Editar vínculo
                </button>
                <button className={action} onClick={() => open("coupon")}>
                  Criar cupom
                </button>
                <button className={action} onClick={() => open("payout")}>
                  Registrar repasse
                </button>
              </div>
            </div>
          )}
          {report.filter}
          {message && (
            <p role="status" className="rounded-xl bg-muted p-3">
              {message}
            </p>
          )}
          <ReportState
            report={report}
            onEdit={c => open("coupon", c)}
            onRelease={id => {
              setReleaseId(id);
              open("release");
            }}
          />
        </section>
      </div>
      <AffiliateForms
        mode={mode}
        edit={edit}
        affiliate={data?.affiliate}
        releaseId={releaseId}
        close={() => setMode(null)}
        saved={async () => {
          setMessage("Registro confirmado.");
          await report.query.refetch();
        }}
      />
    </div>
  );
}
