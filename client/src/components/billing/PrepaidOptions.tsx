import { selectCurrentOffer } from "@/lib/checkoutPresentation";
import React, { useEffect, useId, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function PrepaidOptions({
  planSlug,
  disabled,
  onBuy,
}: {
  planSlug: string;
  disabled: boolean;
  onBuy: (
    method: "card" | "pix",
    months: 1 | 2 | 3 | 6 | 12,
    newAttempt: boolean,
    couponCode?: string
  ) => void;
}) {
  const { isAuthenticated, loading, user } = useSupabaseAuth();
  const id = useId();
  const version = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      version.current++;
    };
  }, []);
  const identity = useRef(user?.id);
  identity.current = user?.id;
  const offers = trpc.billing.prepaidOffers.useQuery(
    { planSlug },
    { retry: false, enabled: isAuthenticated && !loading }
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [fresh, setFresh] = useState(false);
  const [coupon, setCoupon] = useState(
    () => new URLSearchParams(window.location.search).get("cupom") ?? ""
  );
  const preview = trpc.affiliates.preview.useMutation();
  const [validated, setValidated] = useState<{
    code: string;
    months: number;
    couponDiscountCents: number;
    totalCents: number;
    plan: string;
    owner: string | undefined;
  } | null>(null);
  const [message, setMessage] = useState("");
  const recovery = trpc.billing.recoverPrepaidCheckout.useMutation({
    onMutate: () => ({ owner: user?.id }),
    onSuccess: (result, _variables, context) => {
      if (!mounted.current || identity.current !== context?.owner) return;
      if (result.paymentStatus && result.paymentStatus !== "pending")
        setMessage(
          result.paymentStatus === "approved"
            ? "Compra aprovada. Consulte Minha assinatura."
            : "Compra encerrada. Consulte seu histórico."
        );
      else if (result.checkoutUrl) window.location.assign(result.checkoutUrl);
      else
        setMessage(
          "Compra ainda sem confirmação. Tente recuperar novamente em instantes."
        );
    },
    onError: (error, _variables, context) => {
      if (mounted.current && identity.current === context?.owner)
        setMessage(error.message);
    },
  });
  useEffect(() => {
    version.current++;
    setValidated(null);
    preview.reset();
  }, [user?.id, planSlug]);
  const offer = selectCurrentOffer(
    offers.data,
    selected,
    !!offers.error || offers.isLoading || offers.isFetchedAfterMount === false
  );
  const code = coupon.trim().toUpperCase();
  const valid =
    !!code &&
    validated?.code === code &&
    validated?.months === offer?.months &&
    validated?.plan === planSlug &&
    validated?.owner === user?.id &&
    !preview.isPending;
  const money = (n: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(n / 100);
  function reset() {
    version.current++;
    setValidated(null);
    preview.reset();
  }
  if (loading) return <p role="status">Verificando sua sessão…</p>;
  if (!isAuthenticated)
    return (
      <div className="rounded-2xl border p-4 space-y-3">
        <p>Entre ou crie sua conta para consultar os períodos disponíveis.</p>
        <div className="flex gap-4">
          {["login", "cadastro"].map(path => (
            <a
              key={path}
              className="underline"
              href={
                "/" +
                path +
                "?returnTo=" +
                encodeURIComponent("/planos" + window.location.search)
              }
            >
              {path === "login" ? "Entrar" : "Criar conta"}
            </a>
          ))}
        </div>
      </div>
    );
  return (
    <div className="space-y-5 rounded-2xl border border-border bg-background p-4 text-foreground sm:p-5">
      <div>
        <h3 className="font-bold">Pacote pré-pago</h3>
        <p className="text-sm text-muted-foreground">
          Pagamento único · sem renovação automática
        </p>
      </div>
      <button
        type="button"
        className="text-sm underline underline-offset-4"
        disabled={recovery.isPending}
        onClick={() => {
          setMessage("");
          recovery.mutate({ planSlug });
        }}
      >
        {recovery.isPending ? "Consultando…" : "Recuperar compra anterior"}
      </button>
      {message && (
        <p role="status" className="rounded-xl bg-muted p-3 text-sm">
          {message}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Tentativa sem resposta? Recupere a compra anterior antes de iniciar
        outra.
      </p>
      {(offers.isLoading ||
        (offers.isFetchedAfterMount === false && !offers.error)) && (
        <p role="status">Consultando períodos e preços…</p>
      )}
      {offers.error && (
        <p role="alert">
          Não foi possível consultar os pacotes.{" "}
          <button className="underline" onClick={() => void offers.refetch()}>
            Tentar novamente
          </button>
        </p>
      )}
      <div
        role="group"
        aria-label="Duração do acesso"
        className="grid grid-cols-3 gap-2"
      >
        {(!offers.error &&
        !offers.isLoading &&
        offers.isFetchedAfterMount !== false
          ? offers.data
          : []
        )?.map(row => (
          <button
            key={row.months}
            type="button"
            disabled={disabled}
            aria-pressed={offer?.months === row.months}
            onClick={() => {
              reset();
              setSelected(row.months);
            }}
            className="rounded-xl border border-border p-3 text-sm font-semibold aria-pressed:border-cyan-500 aria-pressed:bg-cyan-500/15"
          >
            {row.months} {row.months === 1 ? "mês" : "meses"}
          </button>
        ))}
      </div>
      {!offer &&
        selected !== null &&
        !offers.error &&
        !offers.isLoading &&
        offers.isFetchedAfterMount !== false && (
          <p role="status">
            O período selecionado não está disponível. Escolha outra duração.
          </p>
        )}
      {offer && (
        <>
          <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-medium">
              Cupom (opcional)
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                id={id}
                className="min-w-0 flex-1 rounded-xl border border-border bg-background p-2 uppercase"
                value={coupon}
                maxLength={32}
                disabled={disabled}
                onChange={e => {
                  reset();
                  setCoupon(e.target.value);
                }}
              />
              <button
                type="button"
                className="rounded-xl border px-3 py-2"
                disabled={disabled || !code || preview.isPending}
                onClick={() => {
                  const request = ++version.current;
                  const owner = user?.id;
                  preview.mutate(
                    { planSlug, months: offer.months, code },
                    {
                      onSuccess: data => {
                        if (
                          mounted.current &&
                          version.current === request &&
                          identity.current === owner
                        )
                          setValidated({ ...data, plan: planSlug, owner });
                      },
                    }
                  );
                }}
              >
                {preview.isPending ? "Validando…" : "Aplicar"}
              </button>
              {coupon && (
                <button
                  type="button"
                  disabled={disabled}
                  className="underline"
                  onClick={() => {
                    reset();
                    setCoupon("");
                  }}
                >
                  Remover
                </button>
              )}
            </div>
            {valid && (
              <p
                role="status"
                className="text-sm text-emerald-700 dark:text-emerald-300"
              >
                Cupom aplicado à prévia.
              </p>
            )}
            {preview.error && (
              <p role="alert" className="text-sm">
                Cupom inválido, indisponível ou incompatível com sua conta.
                Cupom e indicação não podem ser combinados. Remova o cupom para
                continuar sem ele.
              </p>
            )}
          </div>
          <dl className="space-y-2 rounded-xl bg-muted/60 p-4 text-sm">
            {[
              [
                "Duração",
                offer.months + (offer.months === 1 ? " mês" : " meses"),
              ],
              ["Preço original do período", money(offer.subtotalCents)],
              ["Desconto pela duração", money(offer.discountCents)],
              [
                valid ? "Desconto do cupom" : "Benefício de indicação",
                money(
                  valid
                    ? validated!.couponDiscountCents
                    : offer.referralDiscountCents
                ),
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-3 border-t border-border pt-3 text-lg font-bold">
              <dt>Total a pagar agora</dt>
              <dd>{money(valid ? validated!.totalCents : offer.finalCents)}</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Acesso por {offer.months} {offer.months === 1 ? "mês" : "meses"} de
            calendário após confirmação, respeitando o acesso acumulado. Ao
            término, será necessária uma nova compra para manter o acesso pago.
          </p>
          <label className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              disabled={disabled}
              checked={fresh}
              onChange={e => setFresh(e.target.checked)}
            />{" "}
            Iniciar outra compra se a anterior já estiver encerrada
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["pix", "card"] as const).map(method => (
              <button
                type="button"
                key={method}
                disabled={
                  disabled ||
                  recovery.isPending ||
                  offers.isFetching ||
                  (!!code && !valid)
                }
                onClick={() => {
                  onBuy(method, offer.months, fresh, valid ? code : undefined);
                  setFresh(false);
                }}
                className="rounded-xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
              >
                {method === "pix" ? "Pagar via Pix" : "Pagar com cartão"}
              </button>
            ))}
          </div>
        </>
      )}
      {!offers.error &&
        !offers.isLoading &&
        offers.isFetchedAfterMount !== false &&
        offers.data?.length === 0 && (
          <p>
            Nenhum período disponível. Você ainda pode recuperar uma compra
            anterior.
          </p>
        )}
    </div>
  );
}
