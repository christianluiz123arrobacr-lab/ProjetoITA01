import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { checkPlatformAccess } from "@/services/access.service";

type SubscriptionGuardProps = {
  children: ReactNode;
};

type AccessState = "checking" | "allowed" | "blocked" | "unauthenticated";

const ACCESS_RECHECK_INTERVAL_MS = 60 * 1000;

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { isAuthenticated, loading: authLoading, user } = useSupabaseAuth();
  const [accessState, setAccessState] = useState<AccessState>("checking");

  const runAccessCheck = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (authLoading) return;

      if (!isAuthenticated || !user) {
        setAccessState("unauthenticated");
        return;
      }

      if (!options.silent) {
        setAccessState("checking");
      }

      try {
        const result = await checkPlatformAccess(user.id, {
          forceRefresh: true,
        });

        setAccessState(result.status);
      } catch (error) {
        console.error("Erro inesperado ao verificar assinatura:", error);
        setAccessState("blocked");
      }
    },
    [authLoading, isAuthenticated, user]
  );

  useEffect(() => {
    let cancelled = false;

    async function initialCheck() {
      if (cancelled) return;
      await runAccessCheck();
    }

    initialCheck();

    return () => {
      cancelled = true;
    };
  }, [runAccessCheck]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) return;

    const intervalId = window.setInterval(() => {
      runAccessCheck({ silent: true });
    }, ACCESS_RECHECK_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        runAccessCheck({ silent: true });
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [authLoading, isAuthenticated, runAccessCheck, user]);

  if (authLoading || accessState === "checking") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>

          <h1 className="text-xl font-black text-slate-950">
            Verificando assinatura
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Estamos conferindo se sua conta tem acesso ativo à plataforma.
          </p>
        </div>
      </div>
    );
  }

  if (accessState === "unauthenticated") {
    return <Redirect to="/" />;
  }

  if (accessState === "blocked") {
    return <Redirect to="/assinatura-pendente" />;
  }

  return <>{children}</>;
}
