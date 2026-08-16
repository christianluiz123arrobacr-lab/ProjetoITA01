import { type ReactNode, useEffect, useState } from "react";
import { Redirect } from "wouter";
import { AlertTriangle, Loader2, RefreshCcw } from "lucide-react";

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { trpc } from "@/lib/trpc";

type SubscriptionGuardProps = {
  children: ReactNode;
};

type AccessState = "checking" | "allowed" | "blocked" | "error" | "unauthenticated";

const ACCESS_RECHECK_MS = 5 * 60 * 1000;
const ACCESS_CACHE_MS = 30 * 60 * 1000;

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { isAuthenticated, loading: authLoading } = useSupabaseAuth();

  const [accessState, setAccessState] = useState<AccessState>("checking");

  const accessStatusQuery = trpc.auth.getAccessStatus.useQuery(undefined, {
    enabled: !authLoading && isAuthenticated,
    retry: false,
    staleTime: ACCESS_RECHECK_MS,
    gcTime: ACCESS_CACHE_MS,
    refetchOnMount: false,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    refetchInterval: ACCESS_RECHECK_MS,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (authLoading) {
      setAccessState("checking");
      return;
    }

    if (!isAuthenticated) {
      setAccessState("unauthenticated");
      return;
    }

    if (
      accessStatusQuery.isLoading ||
      (accessStatusQuery.isFetching && !accessStatusQuery.data)
    ) {
      setAccessState("checking");
      return;
    }

    if (accessStatusQuery.error) {
      console.error("Erro ao verificar assinatura:", accessStatusQuery.error);
      setAccessState("error");
      return;
    }

    if (accessStatusQuery.data?.accessState) {
      setAccessState(accessStatusQuery.data.accessState);
    }
  }, [
    accessStatusQuery.data?.accessState,
    accessStatusQuery.error,
    accessStatusQuery.isFetching,
    accessStatusQuery.isLoading,
    authLoading,
    isAuthenticated,
  ]);

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

  if (accessState === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-6">
        <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-black text-slate-950">
            Não foi possível verificar seu acesso
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            O serviço está temporariamente indisponível. Sua assinatura não foi
            considerada bloqueada; tente consultar novamente.
          </p>
          <button
            type="button"
            onClick={() => {
              setAccessState("checking");
              void accessStatusQuery.refetch();
            }}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
          >
            <RefreshCcw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (accessState === "blocked") {
    return <Redirect to="/assinatura-pendente" />;
  }

  return <>{children}</>;
}
