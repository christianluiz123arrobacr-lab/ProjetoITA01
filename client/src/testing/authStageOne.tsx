import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import { trpc } from "@/lib/trpc";
import { createAuthenticatedTrpcLink } from "@/lib/trpcTransport";
import { authSession } from "@/lib/authSession";
import { fixtureSession } from "./authStageOneSdk";
import "../index.css";

let mode = "valid";
let mounts = 0;
let role = "admin";
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const fetcher: typeof fetch = async input => {
  const user = authSession.getSnapshot().session?.user;
  const entry = mode === "unavailable"
    ? { error: { json: { message: "Temporariamente indisponível.", code: -32603, data: { code: "SERVICE_UNAVAILABLE", httpStatus: 503, authStatus: "unavailable" } } } }
    : { result: { data: { json: user ? { id: user.id, role: mode === "revoked" ? "student" : role } : null } } };
  return new Response(JSON.stringify(String(input).includes("batch=1") ? [entry] : entry), { status: mode === "unavailable" ? 503 : 200, headers: { "content-type": "application/json" } });
};
const client = trpc.createClient({ links: [createAuthenticatedTrpcLink(authSession, fetcher)] });
let userId: string | undefined;
authSession.subscribe(() => { const next = authSession.getSnapshot().session?.user.id; if (next !== userId) { queryClient.clear(); userId = next; } });
function Editor() {
  const [text, setText] = useState("");
  const [number, setNumber] = useState(0);
  useEffect(() => { mounts++; setNumber(mounts); }, []);
  return <section className="p-6"><h1 className="text-xl">Editor simulado — montagem {number}</h1><label>Rascunho<textarea aria-label="Rascunho" value={text} onChange={e => setText(e.target.value)} className="block border p-3 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" /></label><button className="border p-2" onClick={() => void client.auth.me.query()}>Operação do editor</button></section>;
}
function Fixture() {
  const recheck = (next: string) => { mode = next; void queryClient.invalidateQueries(); };
  return <><nav className="flex gap-3 p-4 flex-wrap bg-slate-200 text-slate-900">
    <button onClick={() => recheck("unavailable")}>Falhar revalidação</button>
    <button onClick={() => recheck("valid")}>Recuperar provedor</button>
    <button onClick={() => recheck("revoked")}>Revogar papel</button>
    <button onClick={() => { role = "editor"; recheck("valid"); }}>Papel editor</button>
    <button onClick={() => { role = "admin"; recheck("valid"); }}>Papel admin</button>
    <button onClick={() => { fixtureSession(null); }}>Logout</button>
    <button onClick={() => { fixtureSession({ access_token: "fixture-other", user: { id: "fixture-other" } } as never); }}>Trocar usuário</button>
    <button onClick={() => document.documentElement.classList.toggle("dark")}>Alternar tema</button>
  </nav><AdminGuard><Editor /></AdminGuard></>;
}
createRoot(document.getElementById("root")!).render(<trpc.Provider client={client} queryClient={queryClient}><QueryClientProvider client={queryClient}><Fixture /></QueryClientProvider></trpc.Provider>);
