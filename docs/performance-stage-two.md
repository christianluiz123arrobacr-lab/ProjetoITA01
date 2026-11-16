# Desempenho — Etapa 2

Entrega local sobre `50e367ccb8d0b21f44fb8ee8dfe075efb3a68142`, na branch
`integracao-pr68-pr69-v2`. Não publicada. Sem alterações no Supabase remoto,
variáveis de ambiente, dados históricos ou controlador de autenticação.

## Causas e mudanças

- Dashboard: contagens e identificação de questões sem resolução exigiam baixar
  todas as questões e todos os blocos. Agora `vet_admin_dashboard` retorna um
  snapshot com totais e até cinco registros por lista. `NOT EXISTS` conta questões,
  não blocos. A regra de texto/URL preenchidos preserva `String.trim`, inclusive
  espaços Unicode. O card de imagens mantém a regra anterior `url_imagem IS NOT
  NULL`; não foi redefinido para contar apenas imagens renderizáveis. Exemplos sem
  resolução continuam por ID; registros recentes têm desempate determinístico.
- Alunos: `vet_admin_student_statistics` agrega o histórico inteiro antes de juntar
  perfis. Repetições contam como tentativas; acertos únicos são separados. Perfis
  sem tentativas recebem zero; datas desconhecidas permanecem nulas. A lista não
  foi paginada para não alterar busca e resolução canônica de assinaturas. A união
  com planos, pagamentos e `resolveEffectiveBillingAccess` permanece no backend.
- Questões: novos endpoints `questions.browse`, `questions.details` e
  `admin.browseQuestions` permitem filtros globais, facetas, contagem exata e página
  limitada (20 pública, 25 administrativa, máximo 100 por requisição). A listagem
  leva metadados e trecho de enunciado; detalhes completos são buscados só para os
  IDs necessários. Gabarito, resolução e campos privados não entram no DTO público;
  questões não publicadas são excluídas tanto da listagem quanto dos detalhes.
- Filtros: instituições, anos, disciplinas, dificuldade, busca, conteúdos/assuntos
  múltiplos, `assuntos_por_conteudo`, filtros VET de prova/período e prática são
  aplicados no banco. Arrays vazios usam os fallbacks escalares anteriores; strings
  JSON legadas não são reinterpretadas nem reescritas. Facetas públicas mantêm a
  cascata dos filtros; facetas administrativas representam toda a base autorizada.
  Busca pública é por campo, não por frase artificial concatenando campos. Prática
  considera apenas a última tentativa do usuário, com desempate por número/ID.
- Quiz: prática da página tem rótulo explícito. “Praticar conjunto completo” busca
  todas as páginas/IDs e seus detalhes, com cancelamento e detecção de mudança de
  total. Caderno preserva o limite anterior de 100 questões do conjunto filtrado.
  PDF mantém seu endpoint separado, filtros, limite 120 e indicação de truncamento.
  Não havia seleção manual de IDs entre páginas nessa tela para migrar.
- Compatibilidade: `questions.list`/`admin.listQuestions` conservam seus retornos
  antigos para consumidores que requerem conjunto completo; não são mais chamados
  pelas telas principais de listagem. Home/QuestionBank legados mantêm quiz completo
  e agora tratam falhas recuperáveis, sem transformar indisponibilidade em `[]`.
  Esses contratos legados ainda podem transferir conjuntos maiores; não se alega
  que todos os endpoints de leitura integral foram eliminados.
- Sugestões: uma RPC retorna valores distintos e grupos compactos preservando
  grafia e campos simples/arrays. Criação, edição e importação usam cache curto e
  retry manual; falha não limpa formulários nem bloqueia edição desnecessariamente.
- Cache: 30 segundos para páginas/dashboard, 60 para sugestões; mutações de
  criação/edição/publicação/exclusão/importação/resoluções invalidam leituras
  relevantes. O isolamento na troca de usuário continua usando o mecanismo da
  Etapa 1. Chaves por filtro e reset síncrono da página impedem respostas antigas
  de substituir filtros novos.
- Erros: RPCs têm limite de espera de 15 segundos, erro temporário controlado e
  diagnóstico de operação, consultas, linhas, bytes e duração, sem conteúdo ou
  identificadores pessoais. Migration ausente retorna 503 e instrução clara, nunca
  fallback pesado ou métricas falsas.

## Arquivos

- `server/routers.ts`, `server/performanceStageTwo.ts`.
- `shared/questionBrowse.ts`.
- `client/src/pages/AdminDashboardPage.tsx`, `AdminQuestionsPage.tsx`,
  `QuestionBankPage.tsx`, `AdminQuestionCreatePage.tsx`, `AdminQuestionEditPage.tsx`,
  `AdminQuestionBatchImportPage.tsx`, `Home.tsx`, `QuestionBank.tsx`.
- `client/src/services/questions.service.ts`, `client/src/hooks/useFilterPage.ts`,
  `client/src/lib/questionCache.ts`, `client/src/main.tsx`.
- `server/performanceStageTwo.test.ts`, `performanceStageTwoClient.test.ts`,
  `statistics.test.ts`; migration e rollback abaixo.

## SQL e aplicação manual obrigatória antes de publicar

Migration: `supabase/migrations/202610080001_performance_stage_two.sql`.
Rollback: `supabase/rollbacks/202610080001_performance_stage_two.rollback.sql`.

As funções são `SECURITY INVOKER`, `search_path = ''`, com execução concedida apenas
a `service_role`. O navegador chama tRPC; não recebe credenciais nem parâmetros
administrativos livres. O backend verifica admin/editor antes de consultas
administrativas; a lista de alunos continua exclusiva de admin. RLS não é alterada.
Índices para FK de resolução e última tentativa só são criados se não houver
equivalente utilizável; o índice existente da exportação PDF é reaproveitado.

1. Antes de publicar o código, abra o projeto correto no painel Supabase.
2. Entre em **SQL Editor → New query**.
3. Abra o arquivo da **migration**, copie seu conteúdo integral e execute uma vez.
4. Confirme sucesso e a recarga do schema; em caso de erro, não publique ainda.
5. Depois, autorize a publicação e teste as páginas e permissões com contas reais.

Não executar o rollback normalmente. Ele serve somente para desfazer esta etapa,
depois de restaurar um backend que não dependa das novas funções. Não apaga questões,
resoluções, tentativas ou assinaturas. Esta etapa não executou SQL remoto.
O PDF continua dependendo de sua migration já existente, de 202610060001;
não reaplique migrations antigas indiscriminadamente.

## Validação local e medição

Dados sintéticos em PostgreSQL/WASM PGlite, dependência de desenvolvimento já
existente; sem conexão remota. Migration, permissões, consultas, plano de índice,
rollback e reaplicação foram executados localmente. O teste de plano verifica o
índice de resolução para `questao_id`; não substitui `EXPLAIN ANALYZE` em produção.

Comando reproduzível:

```text
npm test -- server/performanceStageTwo.test.ts server/performanceStageTwoClient.test.ts server/statistics.test.ts server/questionPdfExport.test.ts server/questionPublicDto.test.ts server/authStageOne.test.ts server/privateRouterAccess.test.ts --disableConsoleIntercept
npm run build
npm run check
git diff --check
```

99 testes direcionados aprovados (incluindo o teste adicional de retorno A → B → A):
19 SQL, 16 contratos/cache/autorização, 28 PDF,
22 autenticação, 5 estatísticas, 5 separação de acesso e 4 DTO público.
Build cliente/servidor aprovado, com aviso preexistente de chunks grandes.
TypeScript manteve os mesmos 11 erros preexistentes: sete no editor de resoluções,
dois no tipo de dificuldade, um no parser de seleção do caderno e um no schema de
importação. Não foram corrigidos por estarem fora do escopo.

Suíte completa final: **697 aprovados, 7 falhas preexistentes e 3 ignorados**, sem
falhas novas. As falhas preexistentes são duas em `adminQuestionCreateIntegrity`,
uma em `difficulty`, duas em `difficultyIntegration`, uma em `interactiveQuizState`
e uma em `vetEngine`. Um teste adicional de procura textual de dificuldade falhou
na primeira execução por troca de aspas; o formato esperado foi preservado e a
suíte completa foi repetida. `git diff --check` aprovado.

Cenário: 2.500 questões, 2.495 blocos, apenas 15 correspondentes aos filtros.

| Dashboard | Antes | Depois |
| --- | ---: | ---: |
| Consultas Supabase estimadas pelo algoritmo anterior | 19 | 1 |
| Registros volumosos/listas recentes | 4.995 | até 20 |
| JSON medido localmente | 10.744.196 bytes | 43.223 bytes |
| Tempo local de leitura/agregação, execução direcionada | 142 ms | 207 ms |

Os bytes/linhas anteriores representam as duas varreduras volumosas, sem somar as
listas recentes e os outros cards; portanto são uma estimativa conservadora do
volume transferido pelo algoritmo antigo. As 19 chamadas são calculadas a partir
das páginas de 500 linhas e das nove consultas adicionais, não tráfego remoto medido.
O tempo anterior mede leituras locais, sem latência das 19 chamadas HTTP nem o
cálculo JS completo; o posterior inclui agregação SQL. Portanto, o teste demonstra
redução de consultas/transferência (~99,6%), não melhora de CPU nem rapidez real de
produção. Na execução isolada, páginas aquecidas levaram aproximadamente 1,4–5,1 s;
primeiro planejamento/filtros novos chegaram a 7–8,2 s no WASM. Em execução conjunta
houve valores maiores por contenção. A listagem retorna os 15 resultados em uma RPC,
sem varredura HTTP sequencial; detalhes são outra requisição limitada. Não foi
prometido um tempo de produção com esses dados.

## Ainda depende de teste real

Aplicação manual do SQL, tempo/planos em PostgreSQL nativo, latência PostgREST,
base histórica real, filtros com contas distintas, publicação/exclusão durante
paginação, tema claro/escuro e navegação/quiz em navegador. Os testes de cache usam
QueryClient/QueryObserver reais, mas não aprovam interação visual ou sessão real.
Nenhum deployment, commit, push ou dado de produção foi alterado nesta entrega.
