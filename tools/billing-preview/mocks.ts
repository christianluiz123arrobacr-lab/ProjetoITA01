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
          error: s.mode === "error" ? new Error("Simulado") : null,
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
