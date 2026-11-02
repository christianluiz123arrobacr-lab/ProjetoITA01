import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { action, field } from "./AffiliateReport";
type Props = {
  mode: string | null;
  edit: any;
  affiliate: any;
  close: () => void;
  saved: () => Promise<unknown>;
  releaseId?: string;
};
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
export default function AffiliateForms(props: Props) {
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Dialog
      open={!!props.mode}
      onOpenChange={open => {
        if (!open) props.close();
      }}
    >
      <DialogContent
        className="commerce-surface max-h-[90vh] overflow-y-auto sm:max-w-xl motion-reduce:animate-none"
        onOpenAutoFocus={() => {
          opener.current = document.activeElement as HTMLElement;
        }}
        onCloseAutoFocus={event => {
          event.preventDefault();
          opener.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {
              (
                {
                  profile: "Vincular conta de afiliado",
                  coupon: "Configurar cupom",
                  payout: "Registrar repasse realizado",
                  settings: "Dia de referência",
                  release: "Confirmar liberação",
                } as any
              )[props.mode ?? ""]
            }
          </DialogTitle>
          <DialogDescription>
            As ações são validadas pelo servidor. Salvar configurações não
            habilita o programa comercial.
          </DialogDescription>
        </DialogHeader>
        {props.mode && (
          <Form key={props.mode + (props.edit?.id ?? "")} {...props} />
        )}
      </DialogContent>
    </Dialog>
  );
}
function Form({ mode, edit, affiliate, close, saved, releaseId }: Props) {
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [account, setAccount] = useState<any>(
    edit?.user_id ? { id: edit.user_id, nome: edit.label } : null
  );
  const [all, setAll] = useState(!edit?.plan_ids);
  const accounts = trpc.affiliates.searchAccounts.useQuery(
    { search },
    { enabled: false, retry: false }
  );
  const plans = trpc.affiliates.planOptions.useQuery(undefined, {
    enabled: mode === "coupon",
    retry: false,
  });
  const profile = trpc.affiliates.saveProfile.useMutation();
  const coupon = trpc.affiliates.saveCoupon.useMutation();
  const payout = trpc.affiliates.payout.useMutation();
  const settings = trpc.affiliates.saveSettings.useMutation();
  const release = trpc.affiliates.release.useMutation();
  const busy =
    profile.isPending ||
    coupon.isPending ||
    payout.isPending ||
    settings.isPending ||
    release.isPending;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      if (mode === "profile") {
        if (!account)
          throw new Error("Busque e selecione uma conta existente.");
        await profile.mutateAsync({
          userId: account.id,
          label: String(f.get("label")),
          active: f.has("active"),
        });
      }
      if (mode === "settings")
        await settings.mutateAsync({ payoutDay: Number(f.get("day")) });
      if (mode === "release")
        await release.mutateAsync({ paymentId: releaseId! });
      if (mode === "coupon") {
        if (plans.error || plans.isLoading)
          throw new Error("Aguarde a consulta dos planos.");
        const planIds = all ? null : f.getAll("plans").map(String);
        if (!all && !planIds?.length)
          throw new Error("Selecione pelo menos um plano ou Todos os planos.");
        await coupon.mutateAsync({
          id: edit?.id,
          affiliateId: affiliate.id,
          code: String(f.get("code")),
          active: f.has("active"),
          discountBps: Math.round(Number(f.get("discount")) * 100),
          commissionBps: Math.round(Number(f.get("commission")) * 100),
          startsAt: f.get("start")
            ? new Date(String(f.get("start")) + "Z").toISOString()
            : null,
          expiresAt: f.get("end")
            ? new Date(String(f.get("end")) + "Z").toISOString()
            : null,
          maxUses: f.get("limit") ? Number(f.get("limit")) : null,
          planIds,
        });
      }
      if (mode === "payout") {
        const key = "affiliate-payout:" + affiliate.id;
        let requestKey = localStorage.getItem(key);
        if (!requestKey) {
          requestKey = crypto.randomUUID();
          localStorage.setItem(key, requestKey);
        }
        await payout.mutateAsync({
          affiliateId: affiliate.id,
          requestKey,
          amountCents: Math.round(Number(f.get("amount")) * 100),
          paidOn: String(f.get("date")),
          reference: String(f.get("reference")),
        });
      }
      await saved();
      close();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível confirmar. Preserve a chave e tente novamente."
      );
    }
  }
  return (
    <form className="space-y-4" onSubmit={e => void submit(e)}>
      {mode === "profile" && (
        <>
          <Field label="Buscar conta por nome ou e-mail">
            <div className="flex gap-2">
              <input
                className={field}
                value={search}
                minLength={2}
                maxLength={80}
                onChange={e => setSearch(e.target.value)}
              />
              <button
                type="button"
                className={action}
                disabled={search.trim().length < 2 || accounts.isFetching}
                onClick={() => void accounts.refetch()}
              >
                Buscar
              </button>
            </div>
          </Field>
          <p className="text-xs text-muted-foreground">
            Até 20 resultados por busca. Refine o nome ou e-mail se necessário.
          </p>
          {accounts.error && <p role="alert">{accounts.error.message}</p>}
          {accounts.data?.map((u: any) => (
            <button
              type="button"
              key={u.id}
              className={action + " block w-full text-left"}
              aria-pressed={account?.id === u.id}
              onClick={() => setAccount(u)}
            >
              {u.nome} · {u.email}
              {!u.ativo ? " · conta inativa" : ""}
            </button>
          ))}
          {accounts.data?.length === 0 && <p>Nenhuma conta encontrada.</p>}
          {account && (
            <p className="rounded-xl bg-muted p-3 text-sm">
              Conta selecionada: {account.nome}
            </p>
          )}
          <Field label="Nome de exibição do afiliado">
            <input
              className={field}
              name="label"
              defaultValue={edit?.label}
              required
              maxLength={100}
            />
          </Field>
          <label className="flex gap-2">
            <input
              type="checkbox"
              name="active"
              defaultChecked={edit?.active ?? false}
            />
            Vínculo ativo
          </label>
        </>
      )}
      {mode === "settings" && (
        <Field label="Dia mensal de referência (1–31)">
          <input
            className={field}
            type="number"
            name="day"
            min={1}
            max={31}
            defaultValue={edit?.payoutDay ?? 10}
            required
          />
          <span className="text-xs text-muted-foreground">
            Em meses menores, usa o último dia. Não agenda transferência
            automática.
          </span>
        </Field>
      )}
      {mode === "coupon" && (
        <>
          <Field label="Código">
            <input
              className={field}
              name="code"
              defaultValue={edit?.code}
              required
              minLength={3}
              maxLength={32}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Desconto (%)">
              <input
                className={field}
                name="discount"
                type="number"
                min={0}
                max={99}
                step="0.01"
                defaultValue={(edit?.discount_bps ?? 0) / 100}
                required
              />
            </Field>
            <Field label="Comissão (%)">
              <input
                className={field}
                name="commission"
                type="number"
                min={0}
                max={100}
                step="0.01"
                defaultValue={(edit?.commission_bps ?? 0) / 100}
                required
              />
            </Field>
          </div>
          <label className="flex gap-2">
            <input
              type="checkbox"
              name="active"
              defaultChecked={edit?.active ?? false}
            />
            Cupom ativo (sujeito à habilitação do programa)
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Início (UTC)">
              <input
                className={field}
                type="datetime-local"
                name="start"
                defaultValue={edit?.starts_at?.slice(0, 16)}
              />
            </Field>
            <Field label="Término (UTC)">
              <input
                className={field}
                type="datetime-local"
                name="end"
                defaultValue={edit?.expires_at?.slice(0, 16)}
              />
            </Field>
          </div>
          <Field label="Limite de usos (opcional)">
            <input
              className={field}
              name="limit"
              type="number"
              min={1}
              defaultValue={edit?.max_uses ?? ""}
            />
          </Field>
          <fieldset className="space-y-2 rounded-xl border p-3">
            <legend className="px-1 text-sm font-semibold">
              Planos elegíveis
            </legend>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={all}
                onChange={e => setAll(e.target.checked)}
              />
              Todos os planos
            </label>
            {plans.isLoading && <p>Consultando planos…</p>}
            {plans.error && (
              <p role="alert">
                Erro nos planos.{" "}
                <button type="button" onClick={() => void plans.refetch()}>
                  Tentar novamente
                </button>
              </p>
            )}
            {!all &&
              plans.data?.map((p: any) => (
                <label key={p.id} className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="plans"
                    value={p.id}
                    defaultChecked={edit?.plan_ids?.includes(p.id)}
                  />
                  {p.name} · {p.is_active ? "Ativo" : "Inativo"}
                </label>
              ))}
          </fieldset>
        </>
      )}
      {mode === "payout" && (
        <>
          <p className="text-sm text-muted-foreground">
            Registre somente uma transferência já realizada fora do sistema.
            Nenhum Pix será enviado.
          </p>
          <Field label="Valor transferido (R$)">
            <input
              className={field}
              type="number"
              name="amount"
              min="0.01"
              step="0.01"
              required
            />
          </Field>
          <Field label="Data da transferência">
            <input
              className={field}
              name="date"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              required
            />
          </Field>
          <Field label="Referência única da transferência">
            <input
              className={field}
              name="reference"
              maxLength={160}
              required
            />
          </Field>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" required />
            Confirmo que a transferência já foi realizada e os dados estão
            corretos.
          </label>
          <button
            type="button"
            className={action}
            onClick={() => {
              localStorage.removeItem("affiliate-payout:" + affiliate.id);
              setError(
                "Nova identidade preparada. Use apenas para uma transferência diferente, nunca para repetir uma operação sem resposta."
              );
            }}
          >
            Iniciar registro de outra transferência
          </button>
          <p className="text-xs text-muted-foreground">
            Repetir o envio preserva a identidade do registro anterior.
          </p>
        </>
      )}
      {mode === "release" && (
        <p>
          Confirma liberar esta comissão para compor o saldo a receber? Esta
          ação não transfere dinheiro.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive p-3 text-sm"
        >
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <button
          className={action}
          type="button"
          disabled={busy}
          onClick={close}
        >
          Cancelar
        </button>
        <button
          className={action + " bg-primary text-primary-foreground"}
          disabled={busy}
        >
          {busy
            ? "Confirmando…"
            : mode === "release"
              ? "Confirmar liberação"
              : "Salvar"}
        </button>
      </div>
    </form>
  );
}
