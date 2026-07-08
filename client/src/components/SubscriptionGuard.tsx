import { type ReactNode, useEffect, useState } from "react";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { trpc } from "@/lib/trpc";

type SubscriptionGuardProps = {
  children: ReactNode;
};

type AccessState = "checking" | "allowed" | "blocked" | "unauthenticated";

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { isAuthenticated, loading: authLoading } = useSupabaseAuth();

  const [accessState, setAccessState] = useState<AccessState>("checking");

  const accessStatusQuery = trpc.auth.getAccessStatus.useQuery(undefined, {
    enabled: !authLoading && isAuthenticated,
    retry: false,
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

    if (accessStatusQuery.isLoading || accessStatusQuery.isFetching) {
      setAccessState("checking");
      return;
    }

    if (accessStatusQuery.error) {
      console.error("Erro ao verificar assinatura:", accessStatusQuery.error);
      setAccessState("blocked");
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

  if (accessState === "blocked") {
    return <Redirect to="/assinatura-pendente" />;
  }

  return <>{children}</>;
}
