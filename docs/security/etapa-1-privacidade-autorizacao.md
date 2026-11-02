# Etapa 1 — privacidade e autorização

Base reconfirmada: `eb86f9602dbca887b6582338f983092f3bbd6821`, branch
`integracao-pr68-pr69-v2`. Entrega local, sem publicação nem SQL remoto.

## Mudanças

1. **Ranking:** `publicStats.getRankingData` retorna apenas `ranking` e
   `seasonRanking`, com DTO explícito de agregados por participante. Não devolve
   tentativas, IDs de questões, alternativas ou horários de respostas. Nome,
   identificador para o perfil, avatar e métricas públicas são explícitos. A última
   atividade é somente uma data de calendário. Apenas perfis ativos participam.
   Pontos 2/4/8/16, primeiro acerto único dentro do recorte, precisão por tentativa,
   médias diárias legadas, desempates, sequência, períodos e variação de posição
   foram preservados. O fuso do navegador é validado no servidor.
   O cálculo anterior está congelado em fixture somente de testes e comparado
   para os cinco períodos e quatro disciplinas. Sem novo cache compartilhado.
   O histórico próprio e o contrato existente do perfil público não foram
   removidos nem reformulados nesta etapa.
2. **Premium:** os procedimentos abaixo usam `platformAccessProcedure`, que chama
   a decisão canônica antes do handler. O PDF deixou de ter regra paralela.
   Falha na RPC de assinatura, inclusive com pagamento pendente, é 503 e não
   cancelamento/bloqueio definitivo. A regra de múltiplos pagamentos pendentes
   não foi reformulada nesta etapa.
3. **Edição:** schema editorial estrito compartilhado com cadastro/edição.
   Propriedades desconhecidas, identidade de banco, autoria/importação e SEO são
   rejeitadas antes da escrita, inclusive para admin pelo caminho genérico.
   `codigo` permanece editável como na interface existente. `publicada` continua
   editorial; `is_public`, slug e demais controles SEO usam a operação exclusiva
   do administrador. O objeto de escrita é reconstruído após a normalização.
   A importação mantém seu construtor canônico e o papel é obtido da sessão.
4. **Revogação:** RPC transacional limpa `admin_users` e o papel legado de
   `profiles`, deixando a conta como aluno. Valida novamente o ator no banco,
   protege o último admin efetivo e serializa alterações concorrentes de papel.
   Não há fallback para duas escritas se faltar a migration. Contas legadas
   aparecem na lista administrativa; sua troca de papel exige concessão explícita
   por e-mail, enquanto a remoção funciona diretamente. Nenhum legado é removido
   automaticamente. Caches locais de papel/acesso/listagem são invalidados após
   sucesso. O servidor resolve papel a cada requisição, sem cache entre elas.
5. **Blocos:** função SQL usa join explícito entre página publicada e bloco
   visível no mesmo snapshot, com allowlist JSON e ordenação por ordem/ID.
   Não depende de FK implícita do PostgREST nem de colunas opcionais presentes em
   todas as versões da tabela. Página privada ou inexistente retorna `[]`, sem
   metadados. `getWithBlocks` reutiliza essa consulta; preview separado exige
   editor/admin e pode mostrar rascunhos e blocos invisíveis.

## Matriz de permissões

| Operação                                                    | Anônimo | Aluno ativo | Aluno vencido/sem acesso | Aluno bloqueado | Editor/admin                | Provedor indisponível                    |
| ----------------------------------------------------------- | ------- | ----------- | ------------------------ | --------------- | --------------------------- | ---------------------------------------- |
| Banco premium, tentativa, VET, IA, PDF, questões vinculadas | 401     | Permitido   | 403                      | 403             | Exceção canônica            | 503, sem efeito privado/pago             |
| Ranking agregado                                            | Público | Público     | Público                  | Público         | Público                     | Não exige sessão                         |
| Histórico próprio                                           | 401     | Próprio     | Próprio                  | Próprio         | Próprio                     | Falha de autenticação não concede acesso |
| Edição/importação/resolução                                 | Negado  | Negado      | Negado                   | Negado          | Permitido conforme operação | Falha fechada                            |
| Publicação SEO/revogação                                    | Negado  | Negado      | Negado                   | Negado          | Somente admin               | Falha fechada                            |
| Blocos publicados e visíveis                                | Público | Público     | Público                  | Público         | Público                     | Erro explícito, não conteúdo privado     |
| Preview de página                                           | Negado  | Negado      | Negado                   | Negado          | Permitido                   | Falha fechada                            |

Exceções de editor/admin e tratamento de `ativo` seguem a regra canônica já
existente; esta etapa não redefine bloqueio de funcionários.

### Endpoints premium cobertos

- `questions`: globalStats, filterOptions, browse, details, list, getById,
  exportPdfData.
- `notebooks.linkedQuestions`: fecha caminho alternativo de enunciados. As demais
  operações de Drive/cadernos não foram reformuladas.
- `quiz`: recordAttempt e getQuestionOptionStats.
- `vet`: getExamAnalysis, getAnalysis, getObjective, saveObjective, getLearningData,
  getRecommendedQuestions, createMockSession, getMockSession, completeMockSession,
  submitMockAnswer, getMockResult, listMockHistory e getEvolution.
- `ai.solvePhysics`: mantém os limites existentes de 20 solicitações/usuário/hora
  e 60/IP/hora. Não foi encontrada uma permissão/crédito de IA por plano aplicada
  pelo produto atual; não se inventou um novo sistema comercial.

Planos, checkout, histórico/cancelamento/sincronização de pagamento, recuperação
de acesso, configurações legais, SEO, sitemap e demonstração de questão pública
mantêm seus caminhos anteriores. `publicada` não é tratado como `is_public`.

## SQL manual e ordem de publicação

1. Revisar e aplicar **antes do backend novo**, no SQL Editor do Supabase:
   `supabase/migrations/202610190001_stage_one_privacy_authorization.sql`.
2. Confirmar criação das duas funções e permissões: apenas `service_role` pode
   executá-las diretamente; o navegador usa os handlers autorizados do servidor.
3. Só depois publicar o código, quando houver autorização separada.

A migration é aditiva e não altera usuários históricos ao ser aplicada. A RPC só
revoga uma conta quando solicitada explicitamente por administrador autorizado.
O lock de tabelas dura a transação administrativa e pode esperar por outra
escrita; validar esse comportamento com o tráfego real em homologação.

Rollback de emergência:
`supabase/rollbacks/202610190001_stage_one_privacy_authorization.rollback.sql`.
**Não executar normalmente.** Reverter primeiro o backend dependente. O rollback
remove somente as funções novas; não restaura cargos já revogados.

## Validação

- Seis testes de reprodução falharam na base anterior às correções.
- Testes exercitam callers/adapter HTTP reais, com Supabase e IA simulados.
- SQL executado somente em PGlite local, com tabelas e usuários sintéticos:
  representação única/legada/dupla, editor/aluno, último admin, erro após DELETE
  com rollback completo, permissões das funções, nova requisição após revogação,
  páginas publicadas/privadas/inexistentes, ordem e invisibilidade dos blocos.
- Fixtures comparam ranking antigo/novo, empates, repetição, períodos e filtros.
- Importador, páginas públicas, PDF, autenticação e cache têm testes de regressão.

Base TypeScript medida antes de editar: 11 erros (7 no editor de resolução,
3 em exportações de QuestionDifficulty, 1 na seleção tipada de notebooks).
Base da suíte: 807 testes, 797 aprovados, 7 falhos e 3 ignorados. Falhas:
adminQuestionCreateIntegrity (2), difficultyIntegration (2), difficulty (1),
interactiveQuizState (1), vet/vetEngine (1). Não corrigidos fora do escopo.

Resultados finais:

- **246 testes direcionados aprovados**, em 15 arquivos; nova rodada dos quatro
  arquivos centrais aprovou todos os seus 118 testes após a revisão final.
- **Suíte completa: 924 testes**, com 914 aprovados, as mesmas 7 falhas
  preexistentes descritas acima e 3 ignorados. Nenhuma falha nova.
- **Build cliente/servidor aprovado** (`npm run build`); aviso de chunks grandes
  mantido. Backend recompilado depois da revisão final do agregador.
- **TypeScript:** os mesmos 11 erros da base, sem erro novo. Portanto a checagem
  global ainda não está verde; esses defeitos não foram ocultados nem corrigidos
  fora do escopo.
- **git diff --check aprovado**. Nenhum commit, push, merge, PR ou deploy.

Não houve validação com sessão real ou produção; mocks não comprovam RLS remoto.
O teste PostgreSQL verifica atomicidade de falha intermediária, mas não simula
clientes PostgreSQL independentes concorrentes. Não foi implementada atualização
em tempo real da interface de outro navegador: o backend nega na próxima
requisição, enquanto o guard visual segue a revalidação existente.
Esta etapa protege os handlers examinados, não substitui a revisão dos GRANTs,
RLS e acessos diretos ao Supabase do achado 13, excluído deste escopo.

## Arquivos da entrega

- Contratos: shared/publicRanking.ts, shared/questionEditorial.ts.
- Servidor: server/routers.ts, server/publicRanking.ts, server/adminAccess.ts,
  server/\_core/trpc.ts, server/\_core/platformAccess.ts.
- Cliente: RankingPage, AdminQuestionCreatePage, AdminQuestionEditPage,
  AdminUsersPage, main.tsx e lib/roleCache.ts.
- SQL: migration e rollback acima.
- Testes: privacyAuthorization, adminAccessSql, rankingDataIntegrity, roleCache;
  fixture testing/legacyRankingReference; ajustes de contratos nos testes de IA,
  páginas públicas, PDF, performance e fixture visual de ranking.
- Também foram ajustadas referências aos middlewares/contratos nos testes
  adminQuestionCreateIntegrity, attemptQuestionUuidMigration, difficultySupport,
  interactiveQuizState, subscriptionAccessNavigation e
  questions/questionPagination, sem alterar as expectativas funcionais alheias
  à etapa. As falhas preexistentes continuam identificadas acima.

Sem alterações de concorrência da importação, dependências, pagamentos, webhook,
Drive ou arquitetura geral. Antes de publicar, confirmar funções/permissões em
homologação e testar aluno ativo/vencido e revogação com sessões reais.
