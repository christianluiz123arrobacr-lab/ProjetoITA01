import { useState, useSyncExternalStore } from "react";
const listeners = new Set<() => void>();
export let state = {
  profile: "student",
  mode: "ready",
  coupon: "available",
  recovery: "pending",
  notice: "",
  revision: 0,
};
export const change = (patch: Partial<typeof state>) => {
  state = { ...state, ...patch, revision: state.revision + 1 };
  listeners.forEach(fn => fn());
};
export function usePreview() {
  return useSyncExternalStore(
    fn => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => state
  );
}
export function useSupabaseAuth() {
  const s = usePreview();
  const authenticated = s.profile !== "anonymous";
  return {
    isAuthenticated: authenticated,
    loading: s.mode === "session",
    recovering: false,
    error: null,
    user: authenticated ? { id: "simulation-" + s.profile } : null,
    retry: () => change({ mode: "ready" }),
  };
}
export const getReferralHint = () => null;
export const clearReferralHint = () => {};
export const supabase = {
  auth: {
    signInWithPassword: async () => {
      change({
        profile: "student",
        notice: "Login simulado. Nenhum dado foi enviado.",
      });
      return { error: null };
    },
  },
};
export const formatPlanPrice = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100
  );
const plan = (slug: string, name: string, price: number, founder = false) => ({
  id: slug,
  slug,
  dbSlugCandidates: [slug],
  name,
  amountCents: price,
  currency: "BRL",
  description:
    "Dados demonstrativos: substituem o catálogo real apenas nesta prévia.",
  isBeta: founder,
  hasAvailableSlots: true,
  requiresLegacyFounderEligibility: founder,
  legacyFounderEligible: state.profile === "founder",
  hasValidInvite: false,
  canCheckout: !founder || state.profile === "founder",
  checkoutBlockReason:
    founder && state.profile !== "founder" ? "legacy_founder_required" : null,
  isCurrentPlan: false,
  displayOrder: 0,
});
export async function loadPublicBillingPlans() {
  if (state.mode === "catalog-error")
    throw new Error("Catálogo simulado indisponível");
  return [
    plan("normal", "Plano normal · simulado", 1190),
    plan("legacy-founder", "Beta Fundador · simulado", 900, true),
  ];
}
export async function getBillingCapabilities() {
  return { mercadoPagoEnabled: true, manualPixFallbackEnabled: false };
}
export async function getReferralPricingPreview() {
  return { eligible: state.profile === "referral", plans: [] };
}
export const PIX_PAYMENT_INFO = {
  key: "SIMULADO",
  whatsapp: "",
  displayKey: "Simulado — não pagar",
};
const noPayment = async () => {
  change({
    notice: "Ação de pagamento interceptada. Nenhuma cobrança foi criada.",
  });
  throw new Error(
    "Prévia: nenhum pagamento foi criado. Use Recuperar compra anterior para explorar os estados."
  );
};
export const createPrepaidCheckout = noPayment;
export const createCardSubscriptionCheckout = noPayment;
export const createMercadoPagoPixPayment = noPayment;
export const requestManualSubscription = noPayment;
function useMutation(run: (input: any) => Promise<any>, options: any = {}) {
  const [value, set] = useState<any>({
    isPending: false,
    data: null,
    error: null,
  });
  const mutateAsync = async (input: any, callbacks: any = {}) => {
    const context = await options.onMutate?.(input);
    set({ isPending: true, data: null, error: null });
    try {
      await new Promise(r => setTimeout(r, 400));
      const data = await run(input);
      set({ isPending: false, data, error: null });
      options.onSuccess?.(data, input, context);
      callbacks.onSuccess?.(data);
      return data;
    } catch (error) {
      set({ isPending: false, data: null, error });
      options.onError?.(error, input, context);
      throw error;
    }
  };
  return {
    ...value,
    reset: () => set({ isPending: false, data: null, error: null }),
    mutateAsync,
    mutate: (input: any, callbacks: any) => {
      void mutateAsync(input, callbacks).catch(() => {});
    },
  };
}
function offers(slug: string) {
  const base = slug === "legacy-founder" ? 900 : 1190;
  if (slug === "legacy-founder" && state.profile !== "founder") return [];
  return [1, 2, 3, 6, 12].map(months => {
    const subtotalCents = base * months;
    const discountCents = months >= 6 ? Math.round(subtotalCents * 0.05) : 0;
    const referralDiscountCents =
      state.profile === "referral"
        ? Math.floor((subtotalCents - discountCents) * 0.1)
        : 0;
    return {
      months,
      subtotalCents,
      discountCents,
      referralDiscountCents,
      finalCents: subtotalCents - discountCents - referralDiscountCents,
    };
  });
}
export const trpc = {
  billing: {
    prepaidOffers: {
      useQuery: ({ planSlug }: any) => {
        const s = usePreview();
        return {
          data:
            s.mode === "loading" || s.mode === "error"
              ? undefined
              : s.mode === "empty"
                ? []
                : offers(planSlug),
          isLoading: s.mode === "loading",
          isFetching: s.mode === "loading",
          error: s.mode === "error" || s.mode === "cached-error" ? new Error("Simulado") : null,
          refetch: () => change({ mode: "ready" }),
        };
      },
    },
    recoverPrepaidCheckout: {
      useMutation: (options: any) =>
        useMutation(async () => {
          change({ notice: "Recuperação simulada: nenhuma consulta externa." });
          if (state.recovery === "uncertain")
            throw new Error(
              "Tentativa incerta simulada. Aguarde e recupere novamente; não crie outra cobrança."
            );
          if (state.recovery === "approved")
            return { paymentStatus: "approved" };
          if (state.recovery === "closed") return { paymentStatus: "expired" };
          return { paymentStatus: "pending" };
        }, options),
    },
  },
  affiliates: {
    preview: {
      useMutation: () =>
        useMutation(async ({ planSlug, months, code }: any) => {
          if (
            state.coupon !== "available" ||
            code !== "VETOR" ||
            state.profile === "referral"
          )
            throw new Error("Cupom indisponível");
          const offer = offers(planSlug).find(x => x.months === months)!;
          const couponDiscountCents = Math.round(
            (offer.subtotalCents - offer.discountCents) * 0.05
          );
          return {
            code,
            months,
            couponDiscountCents,
            totalCents:
              offer.subtotalCents - offer.discountCents - couponDiscountCents,
          };
        }),
    },
  },
  auth: {
    registerStudent: {
      useMutation: () =>
        useMutation(async () => ({ referralStatus: "unavailable" })),
    },
  },
  legal: {
    publicConfig: {
      useQuery: () => ({ data: { whatsappConsentAvailable: false } }),
    },
  },
};

// Explicit UI-only sample DTOs. Never call a service or write to a database.
const sampleAffiliate = {
  id: "11111111-1111-4111-8111-111111111111",
  label: "Parceiro demonstrativo",
  active: true,
};
const sampleCoupon = {
  id: "22222222-2222-4222-8222-222222222222",
  affiliate_id: sampleAffiliate.id,
  code: "VETOR",
  active: true,
  discount_bps: 500,
  commission_bps: 1000,
  plan_ids: null,
  starts_at: null,
  expires_at: null,
  max_uses: null,
};
Object.assign(trpc.affiliates, {
  dashboard: {
    useQuery: () => {
      const s = usePreview();
      const affiliate =
        s.mode === "affiliate-none"
          ? null
          : { ...sampleAffiliate, active: s.mode !== "affiliate-inactive" };
      const empty = s.mode === "affiliate-empty";
      return {
        data:
          s.mode === "error"
            ? undefined
            : {
                affiliate,
                commercialEnabled: false,
                nextReferenceDate: "2026-11-10",
                payoutDay: 10,
                pendingCents: 1800,
                releasedCents: 6000,
                paidCents: 2500,
                reversedCents: 300,
                periodConfirmedSales: empty ? 0 : 3,
                periodNetCents: empty ? 0 : 18300,
                affiliates: [
                  {
                    ...sampleAffiliate,
                    user_id: "33333333-3333-4333-8333-333333333333",
                  },
                ],
                coupons: [sampleCoupon],
                salesByDay: empty
                  ? []
                  : [
                      { day: "2026-10-25", sales: 1, sold_cents: 6000 },
                      { day: "2026-10-26", sales: 1, sold_cents: 5000 },
                      { day: "2026-10-28", sales: 1, sold_cents: 7300 },
                    ],
                sales: empty
                  ? []
                  : [
                      {
                        payment_id: "44444444-4444-4444-8444-444444444444",
                        created_at: "2026-10-28T12:00:00Z",
                        paid_cents: 7300,
                        refunded_cents: 0,
                        commission_cents: 730,
                        approved: true,
                        released: false,
                        chargeback: false,
                      },
                    ],
                saleCount: empty ? 0 : 1,
                payouts: [
                  {
                    id: "paid",
                    paid_on: "2026-10-10",
                    amount_cents: 2500,
                    reference: "DEMO-TRANSFERENCIA",
                  },
                ],
                payoutCount: 1,
                adjustments: [
                  {
                    id: "entry",
                    created_at: "2026-10-26",
                    delta_cents: -300,
                    reason: "partial_refund",
                  },
                ],
                adjustmentCount: 1,
              },
        isLoading: s.mode === "loading",
        isFetching: s.mode === "loading",
        error:
          s.mode === "error"
            ? {
                message: "Falha demonstrativa",
                data: { code: "SERVICE_UNAVAILABLE" },
              }
            : null,
        refetch: async () => change({ mode: "ready" }),
      };
    },
  },
  searchAccounts: {
    useQuery: () => {
      const [data, setData] = useState<any>();
      return {
        data,
        error: null,
        isFetching: false,
        refetch: async () =>
          setData([
            {
              id: "33333333-3333-4333-8333-333333333333",
              nome: "Conta de demonstração",
              email: "teste@example.invalid",
              ativo: true,
            },
          ]),
      };
    },
  },
  planOptions: {
    useQuery: () => ({
      data: [
        {
          id: "55555555-5555-4555-8555-555555555555",
          name: "Plano normal",
          is_active: true,
        },
        {
          id: "66666666-6666-4666-8666-666666666666",
          name: "Plano arquivado",
          is_active: false,
        },
      ],
      isLoading: false,
      error: null,
    }),
  },
  ...Object.fromEntries(
    ["saveProfile", "saveCoupon", "saveSettings", "payout", "release"].map(
      name => [
        name,
        {
          useMutation: () =>
            useMutation(async () => {
              change({
                notice:
                  "Registro somente simulado. Nenhum dado financeiro foi alterado.",
              });
              return { confirmed: true };
            }),
        },
      ]
    )
  ),
});
