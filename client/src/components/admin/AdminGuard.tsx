import { ReactNode, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";

type AdminRole = "admin" | "editor";

type AdminGuardProps = {
  children: ReactNode;
  allowedRoles?: AdminRole[];
};

type AdminGuardStatus =
  | "checking-auth"
  | "redirecting"
  | "checking-role"
  | "allowed"
  | "forbidden"
  | "error";

const DEFAULT_ALLOWED_ROLES: AdminRole[] = ["admin", "editor"];
const ADMIN_ACCESS_RECHECK_MS = 5 * 60 * 1000;
const ADMIN_ACCESS_CACHE_MS = 30 * 60 * 1000;

export default function AdminGuard({
  children,
  allowedRoles = DEFAULT_ALLOWED_ROLES,
}: AdminGuardProps) {
  const { user, loading } = useSupabaseAuth();
  const [, setLocation] = useLocation();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !loading && Boolean(user?.id),
    retry: false,
    staleTime: ADMIN_ACCESS_RECHECK_MS,
    gcTime: ADMIN_ACCESS_CACHE_MS,
    refetchOnMount: false,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    refetchInterval: ADMIN_ACCESS_RECHECK_MS,
    refetchIntervalInBackground: false,
  });

  const [status, setStatus] = useState<AdminGuardStatus>("checking-auth");
  const [role, setRole] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const allowedRolesKey = useMemo(
    () => [...allowedRoles].sort().join("|"),
    [allowedRoles]
  );

  useEffect(() => {
    if (loading) {
      setStatus("checking-auth");
      return;
    }

    if (!user?.id) {
      setStatus("redirecting");
      setTimeout(() => {
        setLocation("/login");
      }, 150);
      return;
    }

    if (meQuery.isLoading || (meQuery.isFetching && !meQuery.data)) {
      setStatus("checking-role");
      setErrorMessage("");
      return;
    }

    if (meQuery.error) {
      console.error("Erro ao verificar acesso administrativo no backend:", meQuery.error);
      setStatus("error");
      setErrorMessage(
        "Não foi possível validar suas permissões administrativas no momento."
      );
      return;
    }

    const userRole = meQuery.data?.role ?? null;
    setRole(userRole);

    const allowedSet = new Set(allowedRoles);

    if (!userRole || !allowedSet.has(userRole as AdminRole)) {
      setStatus("forbidden");
      return;
    }

    setStatus("allowed");
  }, [
    user?.id,
    loading,
    setLocation,
    allowedRolesKey,
    meQuery.data?.role,
    meQuery.error,
    meQuery.isFetching,
    meQuery.isLoading,
  ]);

  if (status === "allowed") {
    return <>{children}</>;
  }

  if (
    status === "checking-auth" ||
    status === "checking-role" ||
    status === "redirecting"
  ) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="p-8 w-full max-w-md text-center border-slate-200 shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Verificando acesso
          </h2>

          <p className="text-slate-600">
            {status === "checking-auth" && "Validando autenticação..."}
            {status === "checking-role" &&
              "Validando permissões administrativas..."}
            {status === "redirecting" && "Redirecionando para o login..."}
          </p>
        </Card>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="p-8 w-full max-w-md text-center border-slate-200 shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-red-500" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Acesso negado
          </h2>

          <p className="text-slate-600 mb-2">
            Você não tem permissão para acessar a área administrativa.
          </p>

          {role ? (
            <p className="text-sm text-slate-500">
              Seu perfil atual é: <span className="font-semibold">{role}</span>
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Nenhum papel administrativo foi encontrado para este usuário.
            </p>
          )}

          <div className="mt-6 flex justify-center">
            <Button variant="outline" onClick={() => setLocation("/")}>
              Voltar para o site
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="p-8 w-full max-w-md text-center border-slate-200 shadow-sm">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-yellow-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          Erro ao validar acesso
        </h2>

        <p className="text-slate-600 mb-4">
          {errorMessage ||
            "Ocorreu um problema ao verificar suas permissões administrativas."}
        </p>

        <div className="flex justify-center gap-3 flex-wrap">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>

          <Button onClick={() => setLocation("/")}>Ir para o site</Button>
        </div>
      </Card>
    </div>
  );
}
