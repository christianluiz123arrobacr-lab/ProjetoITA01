import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAccessStatus: vi.fn(),
}));

vi.mock("@/lib/trpcClient", () => ({
  trpcClient: {
    auth: {
      getAccessStatus: {
        query: mocks.getAccessStatus,
      },
    },
  },
}));

import {
  ACCESS_STILL_PROCESSING_MESSAGE,
  getPendingAccessMessage,
  redirectToPlatformIfAccessAllowed,
  setCachedPlatformAccess,
} from "../client/src/services/access.service";

const pendingPage = readFileSync(
  new URL("../client/src/pages/SubscriptionPendingPage.tsx", import.meta.url),
  "utf8"
);
const guard = readFileSync(
  new URL("../client/src/components/SubscriptionGuard.tsx", import.meta.url),
  "utf8"
);
const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const app = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const paymentMigration = readFileSync(
  new URL(
    "../supabase/migrations/202607280002_fix_active_subscription_conflict.sql",
    import.meta.url
  ),
  "utf8"
);

function createSessionStorage() {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    clear: vi.fn(() => values.clear()),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    get length() {
      return values.size;
    },
  } satisfies Storage;
}

describe("navegação por acesso canônico", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { sessionStorage: createSessionStorage() });
    mocks.getAccessStatus.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mantém assinatura pending com acesso canônico blocked na tela pendente", async () => {
    mocks.getAccessStatus.mockResolvedValue({ accessState: "blocked", blockReason: "no_subscription" });
    const replace = vi.fn();

    await expect(redirectToPlatformIfAccessAllowed("user-1", replace)).resolves.toBe(false);
    expect(replace).not.toHaveBeenCalled();
    expect(getPendingAccessMessage("pending", "blocked")).toBe("");
  });

  it("não navega com assinatura local active se o acesso canônico está blocked", async () => {
    mocks.getAccessStatus.mockResolvedValue({ accessState: "blocked", blockReason: "access_processing" });
    const replace = vi.fn();

    await expect(redirectToPlatformIfAccessAllowed("user-2", replace)).resolves.toBe(false);
    expect(replace).not.toHaveBeenCalled();
    expect(getPendingAccessMessage("active", "blocked")).toBe(
      ACCESS_STILL_PROCESSING_MESSAGE
    );
  });

  it("redireciona uma única vez quando o acesso canônico está allowed", async () => {
    mocks.getAccessStatus.mockResolvedValue({ accessState: "allowed" });
    const replace = vi.fn();

    await expect(redirectToPlatformIfAccessAllowed("user-3", replace)).resolves.toBe(true);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/plataforma");
  });

  it("invalida o cache bloqueado e força nova consulta antes de redirecionar", async () => {
    setCachedPlatformAccess("user-4", { status: "blocked" });
    mocks.getAccessStatus.mockResolvedValue({ accessState: "allowed" });
    const replace = vi.fn();

    await redirectToPlatformIfAccessAllowed("user-4", replace);

    expect(window.sessionStorage.removeItem).toHaveBeenCalled();
    expect(mocks.getAccessStatus).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/plataforma");
  });

  it("não navega quando a consulta canônica falha temporariamente", async () => {
    mocks.getAccessStatus.mockRejectedValue(new Error("network unavailable"));
    const replace = vi.fn();

    await expect(redirectToPlatformIfAccessAllowed("user-5", replace)).rejects.toThrow(
      "network unavailable"
    );
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("integração da tela pendente e do guard", () => {
  it("sincroniza no clique e confirma o acesso canônico sem redirecionar por status local", () => {
    const syncPosition = pendingPage.indexOf("syncMyMercadoPagoPaymentStatus()");
    const canonicalPosition = pendingPage.indexOf(
      "confirmCanonicalAccess(normalizedSubscription)"
    );

    expect(syncPosition).toBeGreaterThan(-1);
    expect(canonicalPosition).toBeGreaterThan(syncPosition);
    expect(pendingPage).toContain("redirectToPlatformIfAccessAllowed(user.id,");
    expect(pendingPage).not.toMatch(
      /\["active",\s*"trialing"\]\.includes\(data\.status\)[\s\S]{0,250}location\.replace/
    );
  });

  it("mantém erro temporário no guard e oferece nova tentativa sem redirecionar", () => {
    expect(guard).toContain('setAccessState("error")');
    expect(guard).toContain("Tentar novamente");
    expect(guard).toContain("accessStatusQuery.refetch()");
    expect(guard).not.toMatch(
      /if \(accessStatusQuery\.error\)[\s\S]{0,180}setAccessState\("blocked"\)/
    );
  });

  it("não converte falha temporária da entrada em falsa pendência", () => {
    expect(app).toContain('setAccessState("error")');
    expect(app).not.toMatch(/catch \(error\)[\s\S]{0,220}setAccessState\("blocked"\)/);
    expect(app).toContain("Não foi possível verificar seu acesso");
  });

  it("não mostra ao usuário o erro bruto de uma resposta não JSON", () => {
    expect(pendingPage).toContain("getSafeApiErrorMessage(");
    expect(pendingPage).not.toMatch(/error instanceof Error\s*\? error\.message/);
  });

  it("usa exclusivamente a RPC canônica para estudantes e preserva acesso por papel", () => {
    const start = router.indexOf("getAccessStatus: protectedProcedure");
    const end = router.indexOf("logout: publicProcedure", start);
    const procedure = router.slice(start, end);

    expect(procedure).toContain('role === "admin" || role === "editor"');
    expect(procedure).toContain('rpc("user_has_active_subscription"');
    expect(procedure).not.toContain('source: "fallback"');
    expect(procedure).not.toContain('.in("status", ["active", "trialing"])');
    expect(procedure).toContain('code: "INTERNAL_SERVER_ERROR"');
  });

  it("mantém aplicação aprovada transacional antes de marcar acesso ativo", () => {
    expect(paymentMigration).toContain("update public.billing_payments");
    expect(paymentMigration).toContain("access_applied_at = v_now");
    expect(paymentMigration).toContain("public.rebuild_mercadopago_access_ledger");
    expect(paymentMigration).toContain("only final approved payments may grant access");
  });
});
