# Etapa 3 — leituras completas e falhas transitórias

Revisão local em 21/10/2026, base `47478c615e7ddcc1433dca96b75c2b8744bc82f5`,
branch `integracao-pr68-pr69-v2`. Sem consultas a serviços do projeto, dados reais,
SQL remoto, alterações de ambiente, commit, push, merge ou deploy.

Foram relidos o roteiro original da auditoria fornecido no anexo, os relatórios
versionados das Etapas 1/2 e os caminhos atuais. Não existe relatório separado da
auditoria original em `docs/security` neste HEAD; achados não foram tratados como
comprovados apenas por menções anteriores. A tabela inicial foi apresentada na
conversa antes da primeira edição. O grupo implementado é de **leituras completas
e classificação de indisponibilidade**, com contratos e cálculos preservados.

O responsável informou publicação/teste real das Etapas 1/2 e uma importação
pequena bem-sucedida. Isso não comprova as disputas MVCC da Etapa 2: o teste com
duas conexões PostgreSQL independentes **continua pendente**, conforme
`docs/security/etapa-2-concorrencia-postgresql.md`. Nenhum teste serializado foi
apresentado como substituto dessa validação.

## Confirmado e corrigido

| Achado | Evidência original no HEAD | Alcance/gravidade | Correção |
| --- | --- | --- | --- |
| VET truncado | `server/vet/vetService.ts`, `getCanonicalVetAnalysis`: `.limit(10000)` em tentativas/questões, pesos/coletivos sem páginas | Média: dados pessoais, prioridades e incidência incompletos | Todas essas coleções paginadas com predicados originais e ordem estável |
| Histórico/percentuais truncados | `server/routers.ts`: `getMyAttempts`, `getErrorNotebook`, `getQuestionOptionStats`, `getEvolution` | Média: progresso, revisão e distribuição incorretos após o limite | Todas as páginas; propriedade, filtros e projeção summary preservados |
| Reports e referências truncados | `admin.listQuestionReports` e seus `IN` de questões/perfis sem páginas | Média: painel incompleto e referências ausentes | Reports paginados e referências em grupos de 200 IDs também paginados |
| Falha tratada como histórico vazio | `getRecommendedQuestions` e `createMockSession` ignoravam erro da leitura de tentativas | Média: questões já tentadas classificadas como inéditas | Falha explícita; histórico do simulado é lido antes da inserção do rascunho |
| Drive temporariamente indisponível virava conexão expirada | `connection`, `accessToken`, fallback de `googleDriveStatus` | Média: exigência falsa de reconexão | Erros de banco/rede/429/5xx/timeout/resposta inválida são 503; ausência real ou `invalid_grant` em 400/401 mantém reconexão |
| Mais de um pagamento pendente derrubava verificação | `getPlatformAccessDecision`: `maybeSingle()` sem limite em uma pergunta de existência | Média: 503 recorrente com sessão válida | `limit(1)` antes do singleton; RPC canônica continua decidindo permitir/negar |
| APIs públicas confundiam indisponibilidade com sessão ausente | `api/public-question/session.ts` e `register.ts` usavam somente `ctx.user` para retornar 401; ambas são chamadas pela página pública | Média: classificação falsa de autenticação fora do tRPC | Retornam 503 para `authentication.status=unavailable`, sem registro de tentativa; ausência/invalidade continuam 401 |

`server/_core/databaseRead.ts` limita cada leitura a oito segundos e a paginação
inteira a quinze segundos. Não faz retry automático. `{ error }`, exceção,
timeout e resultado inválido não viram lista vazia ou contagem parcial.
Uma página curta não é tratada como fim: a leitura avança pelo número recebido
até uma página vazia, inclusive se o projeto limitar respostas a menos de 500.
As referências de reports usam lotes de IDs, prazo total e a mesma regra.
Logs têm etapa, código sanitizado e duração, sem filtros, linhas, tokens ou PII.

A compatibilidade do VET com colunas históricas e tabelas opcionais ausentes
foi mantida somente para os códigos de schema já reconhecidos. Uma falha de rede
não ativa esse fallback. Não houve mudança dos pesos, regras comerciais,
taxonomia, fórmula de precisão ou expansão de tentativas por conteúdo.

A renovação do Google tem prazo de seis segundos incluindo leitura do corpo;
aborta a requisição e não repete a operação. Erro `invalid_client`, falha de
criptografia/configuração ou resposta ambígua não revogam a conexão salva. Nenhum
token é apagado e nenhuma chamada para salvar um caderno é iniciada sem obter a
credencial. Não foi alterado o caminho de escrita/autosave dos documentos.

## Achados restantes: grupos que exigem revisão própria

| Achado | Evidência e classificação | Decisão nesta entrega |
| --- | --- | --- |
| Cron sem entrada Vercel | `vercel.json` agenda `/api/cron/billing-reminders`, mas não existe `api/cron/billing-reminders.ts`; handler existe apenas em `server/_core/index.ts` | Confirmado no código. Não ativar automaticamente: a rota executaria envios reais após publicação |
| Segredo do cron em query | Handler Express aceita `req.query.secret`; sem segredo configurado nega 401 | Confirmado. Na revisão do job, compartilhar handler serverless/Express, aceitar somente Bearer e rejeitar antes de qualquer efeito. Não é uma rota livre hoje |
| Lembretes incompletos e resultado incerto | `whatsappReminders.ts`: três coleções sem paginação; `upsert/update` ignorados; fetch sem prazo; envio externo e log não são transação; retry administrativo não assume posse | Confirmado, alta confiabilidade. Correção envolve disparos/duplicação e recuperação de escrita; grupo bloqueado para evitar ativação ou reenvio indevido. Inclui revisão dos critérios de vencimento sem mudar negócio nesta etapa |
| Leitura direta pode contornar assinatura | `202606230001_core_rls_policies.sql`: política `questoes_public_read_published` permite SELECT de `publicada` a authenticated, sem assinatura. A migration pública de agosto revoga anon, mas não authenticated | Confirmado nos SQLs versionados; exposição real depende de grants/policies remotos. Alterar política teria efeito amplo. Diagnóstico somente leitura entregue; nenhuma política alterada |
| Limpeza editorial fora do protocolo de lotes | `discardAdminPreparedImage` lê referências e depois remove no Storage, sem lock persistente com edições concorrentes; `confirmAdminStatementImage` ignora retorno da limpeza de arquivo inválido | Confirmado. Etapa 2 protege `question-imports`, não todos os caminhos `statement-images`. Não executar limpeza adicional nem criar garantia ampla sem protocolo próprio |
| Persistência VET não transacional | `createMockSession` e `completeMockSession`: atualizações e consultas secundárias com erros ignorados; criação de sessão/itens em chamadas separadas | Confirmado. Só a leitura prévia foi corrigida; atomicidade de sessões exige revisão de escrita/RPC separada |
| Outros relatórios/listas ainda limitados | `listBillingSubscriptions`, `loadBillingAccessPayments`, `getBillingConsistencyReport`, `listResolutionOverview`, `adminListWeights` e listagens administrativas sem todas as páginas | Confirmado por inspeção. Não declarar a paginação de todo o projeto concluída. Próximo grupo de leituras administrativas, com contratos próprios |
| Drive além da renovação | `listNotebooks` não segue `nextPageToken`; `driveFetch` ainda usa erro genérico para algumas falhas da API; `disconnectGoogleDrive`/persistência de pasta ignoram `{ error }` | Confirmado. Listagem completa e coordenação de escritas/conflitos permanecem para um grupo próprio; nenhuma remoção/compensação foi introduzida |

Esses grupos são reportados, sem correção destrutiva ou migration que altere
globalmente consumidores, acessos, notificações ou dados históricos. A revisão
não autoriza declarar encerrados todos os achados da auditoria.

## Achados antigos descartados ou já tratados nos caminhos examinados

- **Truncamento do dashboard/estatística administrativa principal:** o caminho
  atual usa `performanceRpc`, `vet_admin_dashboard` e
  `vet_admin_student_statistics`, com agregação SQL/resultado JSONB. Não é a
  antiga descarga limitada de tentativas para somar no cliente. A suíte existente
  verifica mais de mil registros; não foi reescrito nesta etapa.
- **Ranking público retornando tentativas brutas:** `publicStats.getRankingData`
  pagina entradas no servidor e usa o DTO agregado da Etapa 1. Não foi
  reconfirmado o vazamento antigo nesse endpoint. Isso não remove a necessidade
  de revisar separadamente perfis públicos e os grants diretos.
- **Todo erro tRPC causando logout:** `client/src/main.tsx` registra código/status;
  `trpcTransport.ts` só rejeita token diante de `authStatus=invalid` com código de
  autenticação. `context.ts`/`platformAccess.ts` já preservam indisponibilidade
  como 503; `getLatestUserBillingSubscription` também faz isso quando chamado pela
  verificação canônica. A exceção confirmada fora do tRPC nas APIs públicas foi
  corrigida acima.
- **Storage da importação ignorando `{ error }`:** o serviço atual da Etapa 2
  examina remoção/listagem e mantém tombstones/pendência. O defeito antigo não foi
  presumido vigente nesse caminho. As ressalvas editoriais e de validação real
  são específicas e permanecem na tabela anterior.
- **Chave anon ou qualquer console como segredo/vulnerabilidade:** não
  reconfirmado. A classificação depende dos privilégios e do conteúdo efetivo,
  com os limites da busca registrados abaixo.

## Autorizações, navegador, CORS, logs e segredos

- O caminho de produção em Vercel é `api/trpc/[trpc].ts` → router atual. Contexto
  autentica sob demanda, valida token e resolve papel por requisição. Falha
  temporária de autenticação/assinatura permanece 503 e falha fechada. Os testes
  anteriores de recuperação, revogação e cliente continuam necessários.
- Históricos usam `ctx.user.id`; reports continuam `adminOrEditorProcedure`.
  Regras da Etapa 1 não foram relaxadas. Novos testes exercitam os handlers reais
  para anônimo/aluno/editor/admin com banco simulado.
- Navegador usa URL/chave anon do Supabase para Auth e upload assinado. Não foi
  encontrado uso de `service_role` no cliente. O editor antigo de resoluções
  ainda contém três consultas diretas com variável `supabase` ausente, já na
  baseline TypeScript. Isso não comprova funcionamento nem acesso remoto seguro.
- `google_drive_connections` revoga anon/authenticated nos SQLs versionados;
  tentativas são gravadas pela RPC canônica com EXECUTE somente service_role.
  As tabelas/rotinas de importação da Etapa 2 mantêm seus grants restritos.
  Estado aplicado no Supabase não foi consultado.
- Não foi encontrado wildcard/reflexão de CORS nos handlers ativos examinados.
  Autenticação tRPC lê Bearer, não o cookie do legado Express. A origem OpenAI
  permitida pela CSP não significa que uma chave foi enviada ao cliente.
- Busca local nos arquivos rastreados por formatos de tokens, chaves privadas e
  URIs de banco não confirmou segredo real. Só `.env.example` é rastreado hoje.
  Histórico não é shallow; a revisão dos caminhos `.env` históricos encontrou
  nomes de configuração pública do Supabase, sem reproduzir valores. Não houve
  varredura forense de todos os blobs binários/de todos os segredos possíveis.
- Console é transporte de logs no servidor, não uma vulnerabilidade por si só.
  Logs antigos crus ainda existem em caminhos Express/integrações; revisão de
  padronização global não foi misturada a esta correção. O caminho de Storage
  legado `server/storage.ts` não tem consumidor em um endpoint ativo identificado;
  não foi classificado automaticamente como exposição de produção.

## Dependências

Instalado e lockfile foram comparados: axios 1.16.0, express 4.22.1, multer 2.1.1,
jose 6.1.0, Vite 7.3.3, Vitest 2.1.9, esbuild 0.25.12, tRPC server 11.17.0,
Supabase JS 2.105.3, React 19.2.6 e KaTeX 0.16.45. Não inferir a versão instalada
apenas do intervalo do package.json.

`npm audit --offline --json --ignore-scripts` retornou zero alertas. Esse resultado
depende do material local/cache e **não confirma ausência de advisories atuais**.
Nenhum registry/serviço de advisory foi consultado remotamente nesta tarefa.
Vitest/Vite são usados em testes/build/desenvolvimento; isso não demonstra uma
exposição em endpoint de produção. Multer está instalado mas não foi localizado
em um upload ativo; os uploads atuais usam Storage assinado. Axios aparece no SDK
OAuth Express legado, diferente do caminho tRPC da Vercel; jose tem uso efetivo
em assinaturas. Nenhum pacote/lockfile foi atualizado sem exposição confirmada.

## Arquivos e validação

- `server/_core/databaseRead.ts`: paginação, prazo, erro sanitizado e referências.
- `server/vet/vetService.ts`: VET completo e compatibilidade histórica.
- `server/routers.ts`: históricos, distribuições, evolução, reports e consultas
  prévias às recomendações/simulados; sem reescrita geral do router.
- `server/googleDrive/googleDriveService.ts`: leitura da conexão/status e
  classificação/timeout da renovação.
- `server/_core/platformAccess.ts`: existência de pagamento pendente.
- `api/public-question/session.ts`, `api/public-question/register.ts`: classificação
  temporária antes de expor sessão ou iniciar registro/rate limit.
- `server/stageThreeReads.test.ts`, `server/googleDriveRecovery.test.ts`,
  `server/publicQuestionAuthRecovery.test.ts`: cenários comportamentais.
- `authenticationRecovery.test.ts`, `subscriptionAccessNavigation.test.ts` e
  `lessons/platformAccess.test.ts`: mocks atualizados para suportar LIMIT sem
  enfraquecer expectativas. `vet/vetEngine.test.ts` mantém as checagens de códigos
  de schema; as expectativas de nomes de variáveis foram substituídas por testes
  executáveis de fallback no serviço real.
- `supabase/diagnostics/202610210001_stage_three_read_access.sql`: somente catálogos,
  políticas, RLS/grants e assinaturas de funções; não retorna conteúdo de usuários.

Baseline executada antes das edições: **965 testes, 955 aprovados, sete falhas e
três ignorados**. Falhas: adminQuestionCreateIntegrity (2), difficulty (1),
difficultyIntegration (2), interactiveQuizState (1), vet/vetEngine (1). TypeScript:
os mesmos 11 erros documentados das etapas anteriores.

Validações já concluídas:

- **195/195 testes direcionados** em oito arquivos, incluindo os 47 cenários novos
  de leituras, Drive e APIs públicas. Os testes usam dados sintéticos/SDK simulado
  e executam o router, o motor VET e os handlers HTTP reais.
- `npm run build`: cliente e servidor aprovados; aviso preexistente de chunks
  grandes. Inspeção de `dist/public` não encontrou nomes de credenciais privadas
  nem as fixtures/segredos sintéticos novos.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: **os mesmos
  11 erros preexistentes**, sem erros novos. A checagem global continua falhando
  nos imports/variável do editor de resoluções, exports de QuestionDifficulty e
  no cast da seleção Unicode em notebooks. Não foram corrigidos fora do escopo.
- `git diff --check` aprovado; arquivos novos também inspecionados sem whitespace
  inválido. Nenhum arquivo anexado foi alterado ou incluído em staging.
- As cinco consultas do diagnóstico foram executadas somente contra os catálogos
  de um PGlite local vazio/descartável para conferir sintaxe. Zero tabelas do
  projeto nesse banco: isso **não valida os grants/RLS remotos nem MVCC**.
- **Suíte completa final: 1.012 testes, 1.002 aprovados, as mesmas sete falhas da
  baseline e três ignorados. Nenhuma falha nova.** A comparação usou o nome de
  cada cenário falho, não apenas a quantidade. Permanecem duas falhas em
  adminQuestionCreateIntegrity, uma em difficulty, duas em difficultyIntegration,
  uma em interactiveQuizState e uma em vet/vetEngine. Relatórios JSON locais
  ignorados pelo Git: `tmp/etapa3-baseline-tests.json` e
  `tmp/etapa3-final-complete-tests.json`.

Comandos de reprodução:

```powershell
node node_modules/vitest/vitest.mjs run server/publicQuestionAuthRecovery.test.ts server/stageThreeReads.test.ts server/googleDriveRecovery.test.ts server/authenticationRecovery.test.ts server/googleDriveNotebook.test.ts server/privacyAuthorization.test.ts server/subscriptionAccessNavigation.test.ts server/lessons/platformAccess.test.ts --maxWorkers=2 --minWorkers=2 --silent
node node_modules/vitest/vitest.mjs run --maxWorkers=2 --minWorkers=2 --silent
npm run build
node node_modules/typescript/bin/tsc --noEmit --incremental false
git diff --check
```

## Passos manuais e limites

Não há migration nem rollback nesta entrega. O SQL em `diagnostics` é opcional e
somente leitura; não é um script de aplicação. Não executar o setup MVCC em
produção. Antes de alterar RLS, o responsável deverá conferir o diagnóstico e os
consumidores, definir a política efetiva e testá-la em ambiente descartável.

Antes de futura publicação autorizada: terminar o grupo local e revisar o diff;
após publicação, validar volumes/latência reais, sessões de cada papel, múltiplos
pagamentos pendentes, indisponibilidade/renovação do Google com conta de teste e
nenhuma perda do rascunho. Esse teste de integração real não ocorreu aqui.

As leituras paginadas são várias consultas ordenadas, não um snapshot MVCC único;
mudanças concorrentes entre páginas e o custo de históricos muito grandes ainda
precisam de medição. O prazo encerra a leitura com 503, sem publicar soma parcial.
A correção não promete atender volumes ilimitados em uma função de 30 segundos.
O cron continua sem validação Vercel, e RLS/Storage/grants continuam sem inspeção
remota. O resultado de auditoria offline não substitui advisories atualizados.
