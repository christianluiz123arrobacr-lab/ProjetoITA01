import React from "react";
import { createRoot } from "react-dom/client";
import { Route, Switch, Link } from "wouter";
import PricingPage from "@/pages/PricingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import { change, usePreview } from "./mocks";
import "./preview.css";
function scenario(patch: Record<string,string>) {
 const params=new URLSearchParams(location.search);
 for(const [key,value] of Object.entries(patch))params.set(key,value);
 location.search=params.toString();
}
function Preview() {
  const s = usePreview();
  const [mobile, setMobile] = React.useState(new URLSearchParams(location.search).get("mobile")==="1");
  const [dark, setDark] = React.useState(new URLSearchParams(location.search).get("theme")==="dark");
  return (
    <>
      <aside className="border-b bg-amber-100 p-4 text-slate-950">
        <h1 className="font-bold">
          PRÉVIA LOCAL · todos os preços, descontos e ações são simulados
        </h1>
        <p className="text-sm">
          Sem Supabase, Mercado Pago ou credenciais. Não informe dados reais.
          Cupom demonstrativo: VETOR. Os 5% e todos os períodos abaixo são
          exemplos da fixture, não configuração comercial.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label>
            Perfil{" "}
            <select
              aria-label="Perfil simulado"
              value={s.profile}
              onChange={e => scenario({ profile: e.target.value })}
            >
              {[
                ["anonymous", "Sem login"],
                ["student", "Aluno normal"],
                ["founder", "Fundador elegível"],
                ["ineligible", "Fundador não elegível"],
                ["referral", "Aluno com indicação"],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado{" "}
            <select
              aria-label="Estado simulado"
              value={s.mode}
              onChange={e => scenario({ mode: e.target.value })}
            >
              {[
                ["ready", "Disponível"],
                ["session", "Carregando sessão"],
                ["loading", "Carregando preços"],
                ["error", "Erro nos preços"],
                ["empty", "Oferta desativada"],
                ["catalog-error", "Erro no catálogo"],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cupom{" "}
            <select
              aria-label="Cupom simulado"
              value={s.coupon}
              onChange={e => scenario({ coupon: e.target.value })}
            >
              <option value="available">Disponível (VETOR)</option>
              <option value="closed">Programa indisponível</option>
            </select>
          </label>
          <label>
            Recuperação{" "}
            <select
              aria-label="Recuperação simulada"
              value={s.recovery}
              onChange={e => scenario({ recovery: e.target.value })}
            >
              {[
                ["pending", "Pendente"],
                ["uncertain", "Incerta"],
                ["approved", "Aprovada"],
                ["closed", "Encerrada"],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <button
            className="rounded border border-slate-500 px-3 py-1"
            onClick={() => {
              document.documentElement.classList.toggle("dark");
              setDark(!dark);
              const url=new URL(location.href);url.searchParams.set("theme",dark?"light":"dark");history.replaceState(null,"",url);
            }}
          >
            Alternar claro/escuro
          </button>
          <button
            className="rounded border border-slate-500 px-3 py-1"
            onClick={() => scenario({mobile:mobile?"0":"1"})}
          >
            {mobile ? "Abrir desktop" : "Abrir celular (390px)"}
          </button>
          <Link href="/planos">Planos</Link>
          <Link href="/login?returnTo=%2Fplanos">Login</Link>
          <Link href="/cadastro?returnTo=%2Fplanos">Cadastro</Link>
        </div>
        <p role="status" className="mt-2 font-semibold">
          {s.notice}
        </p>
      </aside>
      {mobile ? (
        <iframe
          key={String(dark)}
          title="Prévia celular 390px"
          src={
            "/planos?embedded=1&profile=" +
            s.profile +
            "&mode=" +
            s.mode +
            "&coupon=" +
            s.coupon +
            "&recovery=" +
            s.recovery
          }
          className="mx-auto block h-[850px] w-[390px] max-w-full border"
        />
      ) : (
        <Scene />
      )}
    </>
  );
}
function Scene() {
  return (
    <>
      <p className="bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-slate-950">
        SIMULAÇÃO LOCAL · valores e ações fictícios · não informe dados reais
      </p>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/cadastro" component={RegisterPage} />
        <Route>
          <PricingPage />
        </Route>
      </Switch>
    </>
  );
}
const params = new URLSearchParams(location.search);
if(params.get("theme")==="dark")document.documentElement.classList.add("dark");
{
  change({
    profile: params.get("profile") ?? "student",
    mode: params.get("mode") ?? "ready",
    coupon: params.get("coupon") ?? "available",
    recovery: params.get("recovery") ?? "pending",
  });
  if (window.parent.document.documentElement.classList.contains("dark"))
    document.documentElement.classList.add("dark");
}
createRoot(document.getElementById("root")!).render(
  params.has("embedded") ? <Scene /> : <Preview />
);
