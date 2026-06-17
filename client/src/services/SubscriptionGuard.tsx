import { type ReactNode, useEffect, useState } from "react";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

type SubscriptionGuardProps = {
  children: ReactNode;
};

type AccessState = "checking" | "allowed" | "blocked" | "unauthenticated";

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { isAuthenticated, loading: authLoading } = useSupabaseAuth();

  const [accessState, setAccessState] = useState<AccessState>("checking");

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | undefined;

    async function checkAccess(showLoading = false) {
      if (authLoading) return;

      if (!isAuthenticated) {
        if (!cancelled) {
          setAccessState("unauthenticated");
        }
        return;
      }

      try {
        if (showLoading) {
          setAccessState("checking");
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (!cancelled) {
            setAccessState("unauthenticated");
          }
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, ativo")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.warn("Erro ao buscar perfil:", profileError);
        }

        if (profile?.role === "admin") {
          if (!cancelled) {
            setAccessState("allowed");
          }
          return;
        }

        if (profile?.ativo === false) {
          if (!cancelled) {
            setAccessState("blocked");
          }
          return;
        }

        const { data: hasActiveSubscription, error: rpcError } =
          await supabase.rpc("user_has_active_subscription", {
            target_user_id: user.id,
          });

        if (!rpcError && typeof hasActiveSubscription === "boolean") {
          if (!cancelled) {
            setAccessState(hasActiveSubscription ? "allowed" : "blocked");
          }
          return;
        }

        console.warn(
          "RPC user_has_active_subscription falhou. Usando fallback em billing_subscriptions:",
          rpcError
        );

        const now = new Date().toISOString();

        const { data: subscription, error: subscriptionError } = await supabase
          .from("billing_subscriptions")
          .select("id, status, current_period_end, user_id")
          .eq("user_id", user.id)
          .in("status", ["active", "trialing"])
          .or(`current_period_end.is.null,current_period_end.gte.${now}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subscriptionError) {
          console.error("Erro ao verificar assinatura:", subscriptionError);

          if (!cancelled) {
            setAccessState("blocked");
          }
          return;
        }

        if (!cancelled) {
          setAccessState(subscription ? "allowed" : "blocked");
        }
      } catch (error) {
        console.error("Erro inesperado ao verificar assinatura:", error);

        if (!cancelled) {
          setAccessState("blocked");
        }
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkAccess(false);
      }
    }

    checkAccess(true);

    if (!authLoading && isAuthenticated) {
      intervalId = window.setInterval(() => checkAccess(false), 60_000);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      cancelled = true;

      if (intervalId) {
        window.clearInterval(intervalId);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [authLoading, isAuthenticated]);

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
