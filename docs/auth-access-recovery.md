# Correção do ciclo de autenticação e acesso

## Evidência e causa

No código anterior, qualquer erro ou exceção de `supabaseAdmin.auth.getUser`
deixava `ctx.user` nulo. Os middlewares retornavam 401, indistinguível de uma
credencial realmente inválida. O cliente redirecionava globalmente para login
pela mensagem desse erro, enquanto o login redirecionava para a plataforma
quando a sessão local ainda existia. Essa combinação permite o ciclo de
remontagem e chamadas repetidas. A leitura da sessão também não tinha catch
nem prazo limite; erros do SDK podiam deixar o carregamento infinito.

A captura de produção comprova os 401, não a causa original desses 401.
Ainda é necessário confirmar nos logs completos se havia token ausente,
token inválido ou falha temporária do provedor. Nenhuma consulta de produção
foi realizada neste trabalho.

## Comportamento corrigido

- Contexto distingue `missing`, `invalid`, `unavailable` e `verified`.
- Somente códigos conhecidos de credenciais inválidas comprovam invalididade;
  um 401 sem código reconhecido é tratado conservadoramente como indisponibilidade.
- Indisponibilidade da validação ou consulta de papéis retorna 503 nos gates
  protegidos e em `auth.me`, sem atribuir papel nem conceder acesso.
- Rotas públicas continuam disponíveis sem depender de um gate autenticado.
- Perfil, pagamento pendente, RPC canônica e metadados de assinatura têm espera
  limitada. Falhas técnicas não viram 401. O comportamento de pagamento pendente
  bloqueado é preservado. Telemetria de último acesso não impede acesso já validado.
- A leitura da sessão é compartilhada entre hooks e transporte, tem timeout
  de 8 segundos e expõe erro e recuperação manual.
- O transporte limita a requisição completa, incluindo corpo, a 25 segundos;
  cancela o fetch ao terminar/expirar. Não envia uma requisição sem token quando
  a leitura da sessão falha.
- O logout automático só ocorre com resposta explícita de credencial inválida
  e corresponde ao token enviado. Respostas antigas não apagam uma sessão nova;
  eventos do SDK com o token rejeitado não reativam a sessão.
- Não há redirecionamento global nem reload em resposta a erro de consulta.
  Guards bloqueiam também quando um erro chega após dados antes válidos.
- Consultas de acesso não fazem retries automáticos; seu recheck periódico
  para ao entrar em erro. Outros erros tRPC elegíveis têm no máximo uma nova
  tentativa após 2 segundos. Cache de permissões é limpo na troca de usuário.
- Logs novos incluem estágio, classificação, duração ou correlação, sem token,
  cookie, e-mail ou mensagem bruta do provedor.

## Arquivos alterados

- `shared/authRecovery.ts`
- `server/_core/context.ts`
- `server/_core/trpc.ts`
- `server/_core/platformAccess.ts`
- `server/routers.ts`
- `api/trpc/[trpc].ts`
- `client/src/lib/authSession.ts`
- `client/src/lib/trpcTransport.ts`
- `client/src/hooks/useSupabaseAuth.ts`
- `client/src/_core/hooks/useAuth.ts`
- `client/src/main.tsx`
- `client/src/App.tsx`
- `client/src/pages/LoginPage.tsx`
- `client/src/components/SubscriptionGuard.tsx`
- `client/src/components/admin/AdminGuard.tsx`
- `server/authenticationRecovery.test.ts`
- `server/clientAuthRecovery.test.ts`
- `server/subscriptionAccessNavigation.test.ts`
- `server/studentRegistrationFlow.test.ts`
- Este relatório.

## Validação local

- Testes direcionados: **55 passaram**, em seis arquivos; incluem sessão válida
  para os três papéis, ausência/invalidade/expiração de token, erro e timeout do
  provedor, 401/503 serializados por HTTP, falha de sessão no cliente, cancelamento
  de fetch, recuperação manual, bloqueio seguro e prevenção do retorno de token rejeitado.
- `npm run build`: **passou**, cliente Vite e servidor esbuild. Aviso de tamanho
  dos bundles, sem falha de build.
- `git diff --check`: **passou**.
- Suíte completa: **634 passaram, 7 falharam, 3 ignorados**. As sete falhas
  preexistentes estão em `adminQuestionCreateIntegrity` (2), `difficulty` (1),
  `difficultyIntegration` (2), `interactiveQuizState` (1) e `vetEngine` (1).
  A expectativa antiga da assinatura do logger foi atualizada e passou.
- A verificação TypeScript anterior apresentou 11 erros fora da correção de
  autenticação: editor de resoluções, tipo de dificuldade e parser de seleção
  de questões. Eles não foram corrigidos por pertencerem a outro escopo.

Os testes usam Supabase e sessões simulados; o teste HTTP usa o adaptador real
do tRPC com provedor simulado. Não representam uma validação em produção.

## Confirmar após uma publicação autorizada

Nos logs do Vercel, correlacionar `authentication_check` e o erro tRPC por
`correlation_id`, observando `outcome`, `stage`, `code` e `duration_ms`.
`missing` identifica ausência de credencial; `invalid` um código conhecido
de invalididade; `unavailable` aponta o estágio em que a confirmação falhou.
Para erros secundários, observar `platform_access_check` e seu estágio.

Nenhuma migration é necessária. Não houve SQL remoto, alteração de dados,
commit, push, merge nem deploy.
