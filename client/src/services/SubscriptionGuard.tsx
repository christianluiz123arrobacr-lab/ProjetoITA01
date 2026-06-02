import { type ReactNode, useEffect, useState } from "react";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import {
  checkPlatformAccess,
  getCachedPlatformAccess,
} from "@/services/access.service";

type SubscriptionGuardProps = {
  children: ReactNode;
};

type AccessState = "checking" | "allowed" | "blocked" | "unauthenticated";

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { isAuthenticated, loading: authLoading, user } = useSupabaseAuth();

  const [accessState, setAccessState] = useState<AccessState>("checking");

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      if (authLoading) return;

      if (!isAuthenticated || !user) {
        if (!cancelled) {
          setAccessState("unauthenticated");
        }

        return;
      }

      const cached = getCachedPlatformAccess(user.id);

      if (cached && !cancelled) {
        setAccessState(cached.status);
      } else if (!cancelled) {
        setAccessState("checking");
      }

      try {
        const freshAccess = await checkPlatformAccess(user.id, {
          forceRefresh: true,
        });

        if (!cancelled) {
          setAccessState(freshAccess.status);
        }
      } catch (error) {
        console.error("Erro inesperado ao verificar assinatura:", error);

        if (!cancelled && !cached) {
          setAccessState("blocked");
        }
      }
    }

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user]);

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
