# Autenticação e acesso — Etapa 1

## Escopo e diagnóstico

Implementação local na branch `integracao-pr68-pr69-v2`, sobre `99e7ea295af335e8c0ff6cbfb943dc07ee396b84`. No início, não havia mudanças versionadas; apenas `.codex-remote-attachments/`, que não foi alterada nem incluída. Não foram feitos commit, push, merge, deploy, SQL remoto, alteração de ambiente ou escrita em dados de produção. Não há migration necessária.

Mecanismos comprovados no código e em testes com provedor simulado:

- Uma leitura SDK que falhava deixava `snapshot.error` impedindo novas leituras, sem recuperação automática.
- Logout não invalidava imediatamente a leitura em andamento: uma resposta antiga podia restaurar a sessão. Dois testes comportamentais adicionados antes da correção falharam para esses mecanismos e passaram depois.
- O AdminGuard substituía seus filhos por uma tela de erro após falha da revalidação, mesmo com confirmação anterior. Isso desmontava componentes internos e podia apagar estado local.
- O contexto fazia validação de token e duas consultas de papéis também em requisições exclusivamente públicas com token.
- Um único link de batch podia agrupar verificações de acesso com consultas de página demoradas. A espera compartilhada foi reproduzida com transporte simulado; não foi afirmado que esse era o batch específico dos incidentes em produção.

Não foi comprovado qual indisponibilidade, timeout, resposta do Supabase ou condição de rede iniciou cada episódio real. A confirmação operacional depende dos logs completos do Vercel/Supabase, após publicação autorizada. Não foram acessados esses serviços para esta implementação.

## Sessão, renovação e navegação

O controlador usa uma operação compartilhada com até três tentativas, esperas de 1 e 2 segundos e limite original de 8 segundos por espera do SDK. Falhas rápidas transitórias recuperam sem reload. Uma operação SDK ainda pendente após timeout é reutilizada nas tentativas seguintes, não multiplicada. Uma sessão anteriormente conhecida não é apagada por indisponibilidade, mas as chamadas aguardam recuperação e não enviam uma requisição protegida sem credencial.

Após esgotar o ciclo, há erro recuperável, sem polling. A tentativa manual é compartilhada e uma nova montagem também pode iniciar um ciclo limitado, inclusive quando o listener permanente de `main.tsx` continua ativo. Leitura bem-sucedida limpa o erro. `getSession()` continua usando a renovação suportada pelo SDK, em vez de enviar um JWT expirado simplesmente armazenado no controlador.

Revisões de estado, cancelamento da espera e invalidação imediata protegem logout, troca de usuário e renovação contra leituras antigas. Tokens comprovadamente rejeitados não são reutilizados. Eventos de refresh atrasados não desfazem logout; o término de um logout antigo não desfaz um login novo. Os callbacks SDK não aguardam chamadas SDK, evitando a corrida com seu lock. O controlador oferece `dispose()` para cancelar esperas, remover o listener SDK e limpar assinantes.

O transporte respeita cancelamento individual enquanto aguarda recuperação compartilhada, sem interromper outros consumidores. Mantém limite de 25 segundos para cabeçalhos/corpo e aborta a requisição real. Não há reload ou redirecionamento novo por erro temporário. Os consumidores de assinatura, indicação e contratação diferenciam falha temporária de ausência de sessão; a mudança nessas páginas se limita a isso, sem alterar suas regras comerciais.

## Revalidação administrativa

- Entrada inicial ainda precisa de papel confirmado pelo servidor; aluno e editor em área exclusiva de admin continuam bloqueados.
- O intervalo periódico de cinco minutos foi mantido. Revalidação saudável em segundo plano não desmonta o editor.
- Após falha transitória, a confirmação visual anterior só vale para o mesmo usuário e papéis permitidos, por até 60 segundos desde a primeira falha. Retentativas não reiniciam esse prazo.
- Durante esse período, o mesmo editor permanece montado, com aviso acessível e conteúdo `inert`. Novas leituras e escritas tRPC ficam suspensas para aquele usuário, exceto as verificações necessárias à recuperação. Backend e RLS continuam obrigatórios; isso não é uma autorização em cache.
- Existem no máximo duas rechecagens automáticas, aos 2 e 6 segundos de cada incidente, além da tentativa manual sem cliques concorrentes.
- Recuperação exige uma resposta nova de permissões; limpar o erro local da sessão não basta para liberar um resultado de papéis antigo.
- Logout, troca de usuário, credencial invalidada e revogação explícita invalidam a confirmação anterior. Outro usuário não herda conteúdo ou permissão.
- Depois do prazo, a tela fica bloqueada de forma controlada. Rascunhos já salvos nos mecanismos existentes não são alterados. Não foi criado armazenamento local de conteúdo protegido, nem prometida preservação indefinida de todos os campos não salvos. Componentes internos podem desmontar ao expirar o prazo; salvar trabalho regularmente continua importante.

## Backend e desempenho

O adaptador tRPC passou a criar contexto com autenticação sob demanda. Os middlewares protegidos e `auth.me` aguardam a mesma validação real do Supabase, compartilhada somente dentro da requisição. Não existe cache de papel entre requisições. Os outros consumidores diretos de `createContext` mantêm validação imediata. A resposta pública de planos, que é opcionalmente personalizada, continua solicitando identidade validada no servidor.

A resolução de papel preserva a regra existente: `admin_users` reconhece admin/editor; o fallback de `profiles` reconhece admin. Há uma inconsistência preexistente: a avaliação de acesso à plataforma também reconhece editor em `profiles`. Essa regra não foi ampliada nem reformulada nesta etapa; deve ser analisada separadamente caso se deseje unificá-la.

O perfil `role, ativo` já lido e validado na requisição é reutilizado na avaliação de acesso do mesmo usuário. Um perfil de outro usuário nunca é aproveitado. Falha em qualquer consulta de papéis continua indisponibilidade, sem concessão de papel ou rebaixamento silencioso. Credencial comprovadamente inválida resulta em 401; papel insuficiente em 403; indisponibilidade em 503. As regras de assinatura, termos obrigatórios e pagamentos não foram alteradas.

Dois links de batch separados isolam `auth.me` e `auth.getAccessStatus` das consultas das páginas. Essas duas verificações ainda podem compartilhar entre si um batch e sua validação de token/papéis. Não é necessário aumentar o timeout da função.

Evidências com mocks, não medições de produção:

- Requisição só pública: antes, uma chamada de token e duas consultas de papéis; agora, nenhuma dessas três operações.
- Com token simulado de 1 s e papéis simulados de 2 s em paralelo, o caminho público anterior aguardava 3 s; o novo caminho público não espera essas operações.
- Quatro procedimentos protegidos concorrentes no mesmo contexto: uma validação de token e duas consultas de papéis. Uma nova requisição valida novamente e vê revogação.
- A avaliação estudantil reutiliza o perfil da mesma requisição: uma leitura de perfil a menos, mantendo a busca de pagamento pendente e a RPC canônica.
- Uma consulta de página simulada de 5 s não segura a resposta de acesso. Duas verificações de acesso simultâneas compartilham um batch separado, sem essa consulta de página.
- Três consumidores simultâneos durante falha recuperável compartilham duas leituras SDK no cenário falha-uma-vez, não três ciclos independentes.

Logs adicionados contêm evento, correlação, etapa, duração, resultado, tentativa, status HTTP ou código sanitizado conforme o caminho. Não incluem token, cookie, e-mail, enunciados ou conteúdo de arquivos. Tempos de sessão, transporte, token, papéis e consultas secundárias de acesso são observáveis separadamente. IDs locais de correlação de sessão/transporte são próprios desses ciclos; o backend usa seu ID de requisição de autenticação.

Consultas PostgREST e fetch são realmente abortados quando há suporte a AbortSignal. `auth.getSession()` e `auth.getUser()` não oferecem sinal por chamada nessa API: o limite encerra a espera, não significa cancelamento físico da operação SDK. Resultados tardios não reautorizam o contexto nem substituem estado mais recente. Esse limite é explicitamente diferente de cancelamento real.

## Arquivos alterados

Raiz: `C:/Users/lene-/OneDrive/Documentos/GitHub/ProjetoITA01`.

- Sessão e transporte: `client/src/lib/authSession.ts`, `client/src/lib/trpcTransport.ts`, `client/src/hooks/useSupabaseAuth.ts`, `shared/authRecovery.ts`.
- Continuidade administrativa: `client/src/components/admin/AdminGuard.tsx`, novo `client/src/lib/adminRevalidation.ts`.
- Consumidores da sessão: `client/src/components/SubscriptionGuard.tsx`, `client/src/pages/ReferralPage.tsx`, `client/src/pages/PricingPage.tsx`.
- Contexto/middlewares/acesso: `server/_core/context.ts`, `server/_core/trpc.ts`, `server/_core/platformAccess.ts`, `server/_core/index.ts`, `api/trpc/[trpc].ts`, pequenos ajustes em `server/routers.ts` nas chamadas de autenticação/perfil.
- Testes: `server/clientAuthRecovery.test.ts`, `server/authenticationRecovery.test.ts`, novos `server/authStageOne.test.ts` e `server/adminGuardInterval.test.ts`.
- Fixture visual local: `server/testing/serveAuthStageOne.ts`, `client/__tests__/auth-stage-one.html`, `client/src/testing/authStageOne.tsx`, `client/src/testing/authStageOneSdk.ts`.
- Este relatório: `docs/auth-access-stage-one.md`.

## Validação

Testes direcionados: 78 aprovados em sete arquivos. Exercitam sessão válida/ausente/inválida, erros/timeout, limites e deduplicação, recuperação em nova montagem, cancelamento individual, logout/troca/renewal e respostas antigas, autorização de papéis, revogação, perfil indisponível, batch separado e logs sem dados privados. O QueryObserver real foi mantido inscrito por vários intervalos de cinco minutos com relógio simulado, incluindo interrupção de polling após erro e retomada depois de recuperação. Os novos testes principais exercitam comportamentos, não apenas strings de código.

Comando direcionado:

```powershell
npm run test -- server/adminGuardInterval.test.ts server/authStageOne.test.ts server/clientAuthRecovery.test.ts server/authenticationRecovery.test.ts server/subscriptionAccessNavigation.test.ts server/privateRouterAccess.test.ts server/studentRegistrationFlow.test.ts
```

`npm run build`: cliente Vite e servidor esbuild aprovados, com aviso preexistente de chunks grandes. `git diff --check`: aprovado. Algumas primeiras execuções sofreram EPERM de leitura/socket no sandbox; os testes/build e a fixture foram repetidos localmente fora dessa restrição, sem acesso ao Supabase remoto.

`npm run check`: os mesmos 11 erros preexistentes medidos antes das alterações, sem erros novos:

- Sete no editor de resoluções: imports matemáticos duplicados e referência `supabase` inexistente.
- Dois nas exportações do tipo `QuestionDifficulty` em `client/src/types/question.ts`.
- Um no cast da seleção do caderno em `server/routers.ts:455`.
- Um no import de `QuestionDifficulty` em `shared/questionImportSchema.ts`.

Suíte completa: 662 aprovados, 7 falhas preexistentes e 3 ignorados, em 76 arquivos. Não há falhas novas identificadas. As sete falhas, também conhecidas na versão anterior, são: duas em `adminQuestionCreateIntegrity`, uma em `difficulty`, duas em `difficultyIntegration`, uma em `interactiveQuizState` e uma em `vetEngine`. Elas não foram corrigidas para ampliar esta tarefa. A de VET usa uma procura textual sensível às quebras de linha e não comprova falha operacional de autenticação.

Validação no navegador local com React, QueryClient, transporte e AdminGuard reais, e SDK/respostas inteiramente simulados: admin/editor permitido, campos mantidos durante falha, conteúdo inerte enquanto incerto, recuperação no mesmo componente (montagem 1), outro usuário com nova montagem e campo vazio, e revogação exibindo Acesso negado. Aviso verificado nos temas claro e escuro. Não foram usados usuários reais. Não foi afirmada validação com Supabase ou sessão real de longa duração em produção; o ciclo periódico foi coberto com relógio simulado.

Para repetir a validação visual, sem contas ou banco real:

```powershell
node --import tsx server/testing/serveAuthStageOne.ts
```

Abrir `http://127.0.0.1:5179/__tests__/auth-stage-one.html`. Preencher Rascunho, usar Falhar revalidação e Recuperar provedor; conferir texto e contador de montagem. Usar Revogar papel e Trocar usuário para verificar bloqueio e isolamento. Essa fixture não faz parte da entrada do build de produção e não deve ser usada como autenticação real.

## Ações manuais e limites

Nenhum SQL precisa ser executado. A entrega está somente no workspace, sem commit/push/deploy. Publicação e inspeção operacional ficam para autorização posterior. Depois de publicar, verificar logs correlacionados e medir tempos com sessões reais, inclusive renovação após inatividade em dispositivos diferentes. Isso é necessário para atribuir a causa de cada episódio de produção e confirmar o ganho real de latência.

Nenhuma dependência nova, migração, taxonomia, fórmula de ranking, otimização de dashboard ou alteração comercial foi adicionada.

## Revisão para publicação autorizada — 08/10/2026

O usuário autorizou posteriormente commit e push para `origin/integracao-pr68-pr69-v2`, pela integração existente da Vercel, sem deploy manual. A revisão de sessão, concorrência, prazo administrativo, middlewares e batches não identificou regressões novas. Depois de `git fetch origin`, as referências local/remota estavam alinhadas (0/0), sem necessidade de merge. Foram repetidos os 78 testes direcionados (aprovados), build cliente/servidor (aprovado), verificação de whitespace (aprovada) e TypeScript (somente os mesmos 11 erros preexistentes). A fixture e seus marcadores não aparecem no bundle de produção. O staging desta publicação deve ser explícito, excluindo `.codex-remote-attachments/`.

A situação do push/deployment e seu SHA serão informados na entrega final. Esses resultados não equivalem a teste com sessão real; entrada administrativa, renovação após inatividade e revalidação periódica com Supabase real ainda precisam de confirmação operacional. Nenhum SQL, alteração de ambiente, papel ou dados de usuários está autorizado nesta publicação.
