import { ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { ADMIN_RECOVERY_GRACE_MS, adminAccessRecheck, evaluateAdminAccess, suspendAdminRequests, type AdminConfirmation } from "@/lib/adminRevalidation";

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
  const { user, loading, error: authError, recovering: sessionRecovering, retry: retrySession } = useSupabaseAuth();
  const [, setLocation] = useLocation();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !loading && !authError && Boolean(user?.id),
    retry: false,
    staleTime: ADMIN_ACCESS_RECHECK_MS,
    gcTime: ADMIN_ACCESS_CACHE_MS,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchInterval: adminAccessRecheck,
    refetchIntervalInBackground: false,
  });

  const [status, setStatus] = useState<AdminGuardStatus>("checking-auth");
  const [role, setRole] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const confirmation = useRef<AdminConfirmation | null>(null);
  const requestOwner = useRef(Symbol("admin-guard"));
  const [now, setNow] = useState(Date.now);
  const [retrying, setRetrying] = useState(false);
  const recoveryBusy = useRef(false);
  const latestRecovery = useRef<() => Promise<void>>(async () => {});

  const allowedRolesKey = useMemo(
    () => [...allowedRoles].sort().join("|"),
    [allowedRoles]
  );
  const code = meQuery.error?.data?.code;
  const definitive = code === "FORBIDDEN" || (code === "UNAUTHORIZED" && meQuery.error?.data?.authStatus === "invalid");
  const waitingForFreshConfirmation = confirmation.current?.failedAt != null && meQuery.dataUpdatedAt <= confirmation.current.failedAt;
  const decision = evaluateAdminAccess(confirmation.current, {
    userId: user?.id, responseUserId: meQuery.data?.id, role: meQuery.data?.role,
    loading: loading || meQuery.isLoading || (meQuery.isFetching && !meQuery.data),
    failed: !!authError || !!meQuery.error || waitingForFreshConfirmation, definitive, roles: allowedRoles, now: Math.max(now, Date.now()),
  });
  useLayoutEffect(() => {
    confirmation.current = decision.confirmation;
    suspendAdminRequests(requestOwner.current, user?.id && decision.status !== "allowed" ? user.id : null);
    return () => suspendAdminRequests(requestOwner.current, null);
  }, [user?.id, decision.status, decision.confirmation?.failedAt, decision.confirmation?.role]);
  const recover = async () => {
    if (recoveryBusy.current || meQuery.isFetching || sessionRecovering) return;
    recoveryBusy.current = true;
    setRetrying(true);
    try { if (authError) await retrySession(); await meQuery.refetch(); }
    finally { recoveryBusy.current = false; setRetrying(false); }
  };
  latestRecovery.current = recover;
  useEffect(() => {
    const failedAt = decision.confirmation?.failedAt;
    if (failedAt == null) return;
    const deadline = setTimeout(() => setNow(Date.now()), Math.max(0, failedAt + ADMIN_RECOVERY_GRACE_MS - Date.now()));
    // At most two delayed automatic rechecks per incident, not per error render.
    const attempts = [2000, 6000].map(delay => setTimeout(() => {
      if (Date.now() < failedAt + ADMIN_RECOVERY_GRACE_MS) void latestRecovery.current();
    }, Math.max(0, failedAt + delay - Date.now())));
    return () => { clearTimeout(deadline); attempts.forEach(clearTimeout); };
  }, [user?.id, decision.confirmation?.failedAt]);

  useEffect(() => {
    if (loading) {
      setStatus("checking-auth");
      return;
    }

    if (authError) { setStatus("error"); setErrorMessage("Não foi possível carregar sua sessão. Tente novamente."); return; }

    if (!user?.id) {
      setStatus("redirecting");
      const timer = setTimeout(() => {
        setLocation("/login");
      }, 150);
      return () => clearTimeout(timer);
    }

    if (meQuery.error) {
      setStatus("error");
      setErrorMessage(
        "Não foi possível validar suas permissões administrativas no momento."
      );
      return;
    }

    if (meQuery.isLoading || (meQuery.isFetching && !meQuery.data)) {
      setStatus("checking-role");
      setErrorMessage("");
      return;
    }

    const userRole = meQuery.data?.id === user.id ? meQuery.data.role : null;
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
    authError,
    setLocation,
    allowedRolesKey,
    meQuery.data?.role,
    meQuery.error,
    meQuery.isFetching,
    meQuery.isLoading,
  ]);

  if (decision.status === "allowed" || decision.status === "recovering") {
    const paused = decision.status === "recovering";
    return <div>
      <div aria-live="polite">
        {paused && <div role="status" className="border border-amber-300 bg-amber-50 text-amber-950 dark:bg-amber-950 dark:text-amber-100 p-3 flex flex-wrap gap-3 items-center">
          <span>A confirmação de acesso está temporariamente indisponível. Seu trabalho foi mantido; as operações estão pausadas.</span>
          <Button variant="outline" disabled={retrying || meQuery.isFetching || sessionRecovering} onClick={() => void recover()}>Tentar novamente</Button>
        </div>}
      </div>
      <div inert={paused} aria-busy={paused}>{children}</div>
    </div>;
  }

  if (
    !authError && !meQuery.error && (loading || status === "checking-auth" ||
    status === "checking-role" ||
    status === "redirecting")
  ) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <Card className="p-8 w-full max-w-md text-center border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-slate-600 dark:text-slate-300 animate-spin" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Verificando acesso
          </h2>

          <p className="text-slate-600 dark:text-slate-300">
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <Card className="p-8 w-full max-w-md text-center border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-red-500 dark:text-red-300" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            Acesso negado
          </h2>

          <p className="text-slate-600 dark:text-slate-300 mb-2">
            Você não tem permissão para acessar a área administrativa.
          </p>

          {role ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Seu perfil atual é: <span className="font-semibold">{role}</span>
            </p>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
      <Card className="p-8 w-full max-w-md text-center border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-yellow-50 dark:bg-yellow-950 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
          Erro ao validar acesso
        </h2>

        <p className="text-slate-600 dark:text-slate-300 mb-4">
          {decision.confirmation?.failedAt != null && decision.status === "error"
            ? "A confirmação não foi restabelecida no prazo. As operações continuam bloqueadas. Rascunhos já salvos não foram alterados."
            : errorMessage ||
            "Ocorreu um problema ao verificar suas permissões administrativas."}
        </p>

        <div className="flex justify-center gap-3 flex-wrap">
          <Button variant="outline" disabled={loading || retrying || sessionRecovering || meQuery.isFetching} onClick={() => void recover()}>
            Tentar novamente
          </Button>

          <Button onClick={() => setLocation("/")}>Ir para o site</Button>
        </div>
      </Card>
    </div>
  );
}
