import { useState } from "react";
import { Link, Redirect } from "wouter";
import { Copy, Gift, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Button } from "@/components/ui/button";
import {
  referralBenefitText,
  referralShareMessage,
} from "../../../shared/referralProgram";

export default function ReferralPage() {
  const { isAuthenticated, loading, user } = useSupabaseAuth();
  const query = trpc.referrals.mine.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const [message, setMessage] = useState("");
  if (loading)
    return (
      <p className="p-8" role="status">
        Carregando...
      </p>
    );
  if (!isAuthenticated) return <Redirect to="/login" />;
  const data = query.data as any;
  const c = data?.campaign;
  const link = data?.code
    ? `${window.location.origin}/cadastro?ref=${encodeURIComponent(data.code)}`
    : "";
  const progress = c ? data.confirmed % c.goal : 0;
  const panel =
    "rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900";
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/">← Voltar ao início</Link>
        <h1 className="text-3xl font-black">{c?.title ?? "Indique e Ganhe"}</h1>
        {query.isLoading ? (
          <p role="status">Carregando indicações...</p>
        ) : query.error ? (
          <div role="alert" className={panel}>
            <p>Não foi possível carregar o programa.</p>
            <Button onClick={() => query.refetch()}>Tentar novamente</Button>
          </div>
        ) : (
          <>
            {!data?.live ? (
              <div className={panel}>
                <p>
                  A campanha está desativada ou fora do período de validade.
                  Nenhum novo benefício será concedido.
                </p>
              </div>
            ) : (
              <section className={panel}>
                <p className="whitespace-pre-wrap">{c.description}</p>
                <p className="mt-3">
                  A cada {c.goal} indicações confirmadas, você recebe{" "}
                  {c.reward_days} dias de acesso.
                </p>
                <p className="mt-2">{referralBenefitText(c)}</p>
                {["percent", "fixed"].includes(c.benefit) && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Desconto aplicado pelo servidor no primeiro pagamento
                    elegível por Pix ou pacote pré-pago.
                  </p>
                )}
                <p className="mt-5 font-semibold">
                  {progress} de {c.goal} indicações confirmadas para a próxima
                  recompensa
                </p>
                <div
                  role="progressbar"
                  aria-label="Progresso de indicações"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={c.goal}
                  className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
                >
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${(progress / c.goal) * 100}%` }}
                  />
                </div>
                <label
                  className="mt-6 block text-sm font-semibold"
                  htmlFor="referral-link"
                >
                  Seu link pessoal
                </label>
                <input
                  id="referral-link"
                  readOnly
                  value={link}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950"
                />
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(link);
                        setMessage("Link copiado.");
                      } catch {
                        setMessage(
                          "Não foi possível copiar. Selecione o link acima."
                        );
                      }
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar link
                  </Button>
                  <Button asChild>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(referralShareMessage(c, typeof user?.user_metadata?.nome === "string" ? user.user_metadata.nome.slice(0, 120) : "um amigo", link))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {c.whatsapp_label}
                    </a>
                  </Button>
                </div>
                <p role="status" className="mt-2 text-sm">
                  {message}
                </p>
              </section>
            )}
            <section className={panel}>
              <h2 className="text-xl font-bold">Suas indicações</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Até 100 registros mais recentes. A confirmação exige pagamento
                aprovado e acesso aplicado.
              </p>
              {!data?.referrals.length ? (
                <p className="mt-4">Você ainda não tem indicações.</p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
                  {data.referrals.map((r: any) => (
                    <li
                      className="flex flex-wrap justify-between gap-3 py-3"
                      key={r.id}
                    >
                      <span>
                        Novo aluno •{" "}
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </span>
                      <span>
                        {r.status === "confirmed"
                          ? "Confirmada"
                          : r.status === "reversed"
                            ? "Revertida"
                            : "Aguardando pagamento"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className={panel}>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Gift />
                Recompensas recebidas
              </h2>
              {!data?.rewards.length ? (
                <p className="mt-4">Suas recompensas aparecerão aqui.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {data.rewards.map((r: any) => (
                    <li key={r.id}>
                      {r.days} dias •{" "}
                      {new Date(r.created_at).toLocaleDateString("pt-BR")} •{" "}
                      {r.revoked_at ? "Revertida após estorno" : "Concedida"}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
