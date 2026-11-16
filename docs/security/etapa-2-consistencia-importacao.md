# Etapa 2 — Consistência e recuperação da importação

Base: `6a52f78`, branch `integracao-pr68-pr69-v2`. Implementação local; nenhum acesso ou SQL remoto, commit, push, merge ou deploy nesta etapa.

## Causas reconfirmadas

O serviço anterior lia `draft`, mas não assumia `finalizing`. Dois finalizadores podiam passar pela leitura. Cancelamento apagava arquivos antes de atualizar o lote, sem condição de estado nem checagem de linhas afetadas. Alteração de slots e remoção de inválidas usavam a mesma sequência de leitura/gravação separadas. A conclusão ignorava ausência de linhas atualizadas.

A questão tinha índice único em `import_source_id`, mas a resolução era gravada em outra chamada. A recuperação verificava contagem e depois inseria blocos: havia corrida entre essas chamadas. A compensação apagava questões; uma resposta perdida poderia levar a remoção ou reparo de conteúdo já confirmado. Vários retornos `{error}` da limpeza não eram conferidos.

## Garantias e limites de atomicidade

Cada sessão tem `operation_id`, `operation_kind`, `lease_until` e `revision`. Uma RPC bloqueia a linha com `FOR UPDATE`, confere papel e propriedade e concede posse por 60 segundos. Outra operação recebe conflito enquanto essa posse estiver válida. Escritas conferem o identificador e a validade da posse dentro da transação. O identificador de execução não vai para o navegador.

A atomicidade é **por questão**: questão nova, blocos, resultado individual e progresso são confirmados pela mesma chamada `vet_import_commit_item`. Se um bloco ou o journal falhar, toda essa transação é revertida. Não existe DELETE compensatório. Itens anteriores permanecem confirmados.

O índice global de `questoes.import_source_id`, o journal único por `(batch_id, import_key)` e o índice de blocos `(import_item_id, import_block_index)` fazem a idempotência persistente. Um retry retorna o resultado do journal; lote concluído retorna exatamente seu resultado persistido. Duplicatas de outros lotes não reescrevem questões ou resoluções. A remoção editorial posterior de uma questão não a recria no retry: o journal conserva o resultado histórico.

Banco e Storage não constituem uma transação única. A segurança da limpeza usa um registro persistente por arquivo e tombstones: antes de pedir remoção ao Storage, o arquivo entra em `delete_pending` dentro do banco. Ele jamais pode ser novamente associado. Triggers em questões/resoluções serializam referências e tombstones e rejeitam referências a caminhos descartados. Uma trava transacional por caminho físico também sincroniza referências manuais a caminhos legados ainda sem registro com a descoberta desses arquivos. Arquivos que já foram usados ficam `retained`, mesmo se uma edição posterior remover a referência.

## Estados e recuperação

| Estado persistido | Ações permitidas |
| --- | --- |
| `draft` sem posse válida | Editar, preparar/confirmar/substituir/remover imagens, remover inválidas, finalizar ou cancelar |
| `draft` com posse válida | Apenas a execução proprietária pode concluir a operação iniciada |
| `finalizing` | Continuar somente os itens ainda não confirmados; edição e cancelamento bloqueados |
| `completed` | Consultar/retornar resultado e limpar candidatas elegíveis; conteúdo e imagens utilizadas preservados |
| `cancelled` | Consultar e retomar limpeza; nunca finalizar ou voltar a editar |

A finalização assume a posse, obtém o snapshot de payload/slots/progresso e valida antes de mudar para `finalizing`. Assim, imagem obrigatória ausente deixa o lote em `draft`. A posse impede uma alteração concorrente entre a validação e o início.

Cada requisição processa no máximo **uma questão**, com orçamento de 15 segundos para as RPCs da finalização. A tela solicita a próxima etapa após a resposta e consulta o progresso salvo. Não há worker dependente de continuar após a resposta HTTP. Cada item renova a posse; entre etapas a posse é liberada. Se a instância morrer ou perder a resposta, a posse expira após 60 segundos. A execução antiga não pode gravar nem liberar a posse de quem retomou; a RPC de item também verifica expiração antes da confirmação final.

Depois de iniciar a importação, expirar a posse não torna o lote cancelável: ele continua `finalizing`. Fechar a aba preserva os itens; abrir os lotes salvos e usar **Retomar itens pendentes** continua o processamento. Em caso de nova falha, investigar a disponibilidade do banco/migration; não apagar questões válidas.

O cancelamento assume e persiste `cancelled` antes da limpeza. Se processamento venceu, cancelar recebe conflito/estado incompatível sem apagar arquivos. Sessões legadas em `draft` que já tenham questões vinculadas também não podem ser canceladas.

## Uploads e limpeza

Cada candidata é registrada antes da emissão da URL assinada. A confirmação verifica novamente lote, slot, estado, posse, conteúdo real, dimensões e `previousPath`. A substituição mantém a imagem anterior até confirmar a nova. A limpeza automática de substituição atinge apenas o caminho anterior, evitando descartar candidatas de outras abas.

Estado do arquivo: `candidate → ready → retained`, ou `candidate/ready elegível → delete_pending → deleted`. `retained` é permanente nesta entrega. Antes de descartar, também são verificadas referências reais em questões e resoluções. Slots prontos do rascunho e imagens dos itens confirmados são preservados. Ao concluir, imagens de itens inválidos/ignorados sem confirmação tornam-se candidatas à limpeza; referências manuais continuam protegidas. Cancelados sem conteúdo confirmado podem descartar seus uploads. Lotes legados já concluídos preservam seus slots prontos quando não existe journal capaz de distinguir os itens.

SDK do Storage instalado documenta validade de duas horas para URLs assinadas de upload. Tombstones ficam pendentes por pelo menos 130 minutos para rechecagem de uploads tardios; após remoção confirmada além desse prazo podem ficar `deleted`. O bloqueio de reassociação permanece mesmo depois disso. Não há promessa de transação com o Storage ou de remoção física imediata. Falhas `{error}`, exceções e timeout de remoção mantêm pendência persistida. Não transformam conteúdo confirmado em falha.

**Limpar arquivos temporários** é a ação explícita na tela para retomar pendências do lote. A manutenção existente de expirados continua restrita ao proprietário, exclui `finalizing` e processa até cinco lotes por chamada. Cada passo de limpeza planeja até três arquivos. A descoberta de candidatas legadas percorre uma página de três arquivos de um diretório de slot, com cursor persistido. Exclusão efetiva ou resultado incerto reinicia o cursor para evitar saltar arquivos quando a listagem muda. Repetir a manutenção avança; caminhos históricos não reconhecidos são preservados para revisão manual. Nenhum agendamento remoto foi criado.

Associações confirmadas em outras questões/resoluções são preservadas mesmo fora do lote. A descoberta só aceita diretórios UUID do próprio lote/slot. Não há listagem ou remoção geral de bucket. Logs usam eventos/etapas/códigos seguros, sem conteúdo, arquivos, URLs assinadas ou tokens.

## Interface e compatibilidade

A tela existente conserva preview, slots, preparo de imagens, associação, taxonomia e permissões. Ela exibe estado e quantidade confirmada do servidor, falha recuperável e pendência de limpeza. Ações incompatíveis ficam desabilitadas. Em erro/timeout consulta o estado antes de liberar retry; sem resposta, mantém incerteza e consulta a cada três segundos, sem consultas sobrepostas. Respostas com revisão anterior não sobrescrevem estado mais novo.

JSON antigo, JSONL (um objeto por linha) e `questoes-v2` passam pela normalização existente. A leitura textual agora aceita JSONL diretamente; antes exigia `JSON.parse` do documento inteiro. O endpoint legado `importQuestionBatch` também utiliza a sessão/journal: sua chave de requisição é exclusiva por usuário; repetir com outro conteúdo é rejeitado. Ele retorna `status`/progresso e deve ser chamado novamente enquanto `status=finalizing`. A tela atual já usa a finalização em etapas. As duas rotas de finalização agora exigem `protocolVersion: 2`; sem esse marcador, retornam PRECONDITION_FAILED antes de qualquer item. O arquivo JSON não precisa desse campo: ele pertence à requisição HTTP, enviada pela tela. Abas antigas precisam recarregar; não recebem uma conclusão parcial com formato antigo.

Lotes concluídos anteriormente conservam seu resultado, inclusive falhas históricas; não são reabertos automaticamente. Para pendências históricas, importar somente os itens faltantes em novo rascunho e revisar os resultados. Uma questão legada existente sem blocos recebe `requiresReview`; não há reparo automático, pois a ausência também pode ser resultado de edição legítima. A interface mostra esse aviso e a resolução deve ser revisada editorialmente. Não há deduplicação ou limpeza destrutiva automática de dados históricos.

## Migration manual e ordem de publicação

1. Pausar o uso da importação durante a janela de atualização, impedir novas chamadas e aguardar as requisições antigas terminarem. Fechar/recarregar abas antigas; não basta apenas esconder o botão. Evitar também gravações editoriais de questões/resoluções durante a curta aplicação do DDL.
2. Executar, se desejado, o diagnóstico somente de leitura `supabase/diagnostics/202610200001_question_import_recovery.sql`.
3. Aplicar **obrigatoriamente antes do novo backend** `supabase/migrations/202610200001_question_import_recovery.sql` no SQL Editor do Supabase. Depende das migrations existentes de metadados de importação, lotes/imagens e resolução canônica de papéis da Etapa 1.
4. Confirmar sucesso integral do SQL. O arquivo contém BEGIN/COMMIT, lock_timeout local de 5 segundos e statement_timeout local de 60 segundos. Se falhar, não publicar: a transação não deve ser confirmada parcialmente; reverter a transação abortada na sessão, investigar o diagnóstico e repetir o arquivo inteiro. Não executar trechos isolados. Se recovery_already_installed não for NULL, não reaplicar cegamente este CREATE FUNCTION: investigar a versão instalada primeiro.
5. Publicar juntos o backend/cliente desta entrega (não foi feito nesta tarefa). Uma aba antiga será instruída a recarregar. Conferir editor/admin e aluno bloqueado, lote sem imagens, imagem obrigatória, progresso de mais de um item, resposta perdida, edição manual e retomada.
6. Retomar o uso somente depois dessas verificações e da validação concorrente pendente abaixo. Não manter simultaneamente o backend anterior atendendo importações. Não executar o rollback normalmente.

As novas tabelas têm RLS e acesso direto revogado de anon/authenticated. Somente service-role executa as RPCs; o journal concede apenas SELECT direto ao backend. As RPCs revalidam papel e propriedade. A migration cria campos/tabelas/índices/funções/triggers; não corrige nem remove conteúdo histórico. Índice de origem inválido ou duplicatas fazem a aplicação falhar sem deduplicar: utilizar o diagnóstico e resolver os casos editorialmente antes de repetir.

O backend anterior **não é compatível para mutações de importação durante essa janela**: triggers rejeitam escritas antigas sem protocolo. Consultas anteriores podem continuar lendo as colunas existentes. Pausar o importador é necessário também porque o reparo de resoluções do backend antigo não conhece o journal novo. Não executar a migration e continuar usando o backend anterior para importar.

O rollback de emergência `supabase/rollbacks/202610200001_question_import_recovery.rollback.sql` não deve ser executado normalmente. Exige importador pausado e backend dependente revertido; remove apenas funções/triggers desta etapa, conservando journal, tombstones, colunas e índices. Não reverte a Etapa 1 nem restaura/remove questões ou resoluções.

## Arquivos e validação

Arquivos alterados/criados, por responsabilidade:

- Serviço, normalização de blocos e rotas: `server/questions/questionImportBatchService.ts`, `server/questions/resolutionPayload.ts`, `server/routers.ts`.
- Interface e leitura textual: `client/src/pages/AdminQuestionBatchImportPage.tsx`, `shared/questionImportSchema.ts`.
- Testes: `server/questionImportRecovery.test.ts`, `server/testing/questionImportDatabase.ts`, `server/questionImportAuthorization.test.ts`, `server/questionImportImages.test.ts`, `server/statistics.test.ts`; `server/questionImageReplacement.test.ts` foi substituído pela cobertura SQL consolidada.
- SQL: migration, diagnóstico e rollback `202610200001_question_import_recovery` nos diretórios correspondentes de `supabase/`.
- Fixture isolada: `tests/browser/questionImport.html`, `tests/browser/questionImport.tsx`, `tests/browser/questionImportMocks.tsx`, `tests/browser/vite.questionImport.config.ts`.
- Relatório: este documento. Nenhuma alteração nas áreas de ranking, pagamentos, autenticação ou Google Drive.

Testes: `server/questionImportRecovery.test.ts` e banco descartável em `server/testing/questionImportDatabase.ts`; contratos de autorização/imagens/estatística atualizados. Os antigos oito testes de substituição baseados somente em mocks foram consolidados nos cenários de banco real do arquivo de recuperação, incluindo falta/invalidade de arquivo, erro de gravação, troca concorrente e retry.

Baseline antes das alterações: TypeScript com 11 erros preexistentes; suíte anterior com sete falhas conhecidas. Os seis arquivos direcionados iniciais passaram em 67 testes.

Resultados anteriores à revisão final (atualização ao final deste documento):

- 38/38 cenários de recuperação com SQL real local aprovados. Os nove arquivos direcionados de importação/autorização/Etapa 1 totalizam 205 testes aprovados na suíte final.
- Suíte completa: **951 testes, 941 aprovados, sete falhas preexistentes e três ignorados**. Comando: `node node_modules/vitest/vitest.mjs run --maxWorkers=2 --minWorkers=2 --silent --reporter=json`.
- As sete falhas permanecem nos mesmos casos da base: duas em `adminQuestionCreateIntegrity.test.ts`, uma em `difficulty.test.ts`, duas em `difficultyIntegration.test.ts`, uma em `interactiveQuizState.test.ts` e uma em `vet/vetEngine.test.ts`. Nenhuma falha nova permaneceu.
- `npm run build` aprovado para cliente e servidor; servidor recompilado após os últimos ajustes. Aviso de chunks grandes já existente. Fixture ausente dos bundles de produção.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: os mesmos 11 erros da base, sem erro novo. Eles estão em `AdminResolutionEditorPage.tsx` (imports duplicados e `supabase` ausente), `client/src/types/question.ts` e `shared/questionImportSchema.ts` (export de tipo ausente), e no cast da seleção Unicode de `server/routers.ts`.
- `git diff --check` aprovado. Nenhum staging/commit, push, merge ou deploy. HEAD continua `6a52f78fcdfff427dee751d0d8a33140496a0cbe`; `.codex-remote-attachments/` foi preservado.

Validação visual com a skill de navegação, na fixture local: retomada de 1/3 para 3/3 itens confirmados; bloqueio por imagem obrigatória ausente; cancelamento confirmado e controles de edição desabilitados; resposta perdida seguida de consulta que confirma a conclusão e remove o erro transitório. São dados sintéticos, sem autenticação real ou Storage remoto. O upload real não é habilitado nessa fixture. A configuração é exclusiva de testes e não integra o build de produção.

Reprodução local: `node node_modules/vitest/vitest.mjs run server/questionImportRecovery.test.ts`; para a tela, `node node_modules/vite/bin/vite.js --config tests/browser/vite.questionImport.config.ts`, abrindo `/questionImport.html` em `http://127.0.0.1:5195`. O servidor temporário utilizado foi encerrado.

Os testes SQL usam PostgreSQL em WASM/PGlite descartável com transações, constraints, funções e triggers reais. O Storage é simulado com SDK retornando sucesso/erro e arquivos sintéticos. Chamadas simultâneas exercitam a interlevação das requisições, mas o PGlite serializa sua conexão; **isso não comprova concorrência MVCC entre conexões PostgreSQL independentes**. Não havia PostgreSQL nativo/Docker disponível. Repetir as disputas em ambiente de homologação com conexões independentes e instâncias distintas da Vercel continua necessário.

Também dependem de homologação: Storage real, upload tardio/expiração de URL, políticas/grants efetivos do projeto remoto, latência e prazo real da Vercel, autenticação real de editor/admin e retomada entre dispositivos. Nenhum desses serviços foi acessado nesta implementação.

## Revisão final do código e SQL efetivos — 20/10/2026

Não foi uma revisão apenas do relatório: foram lidos a migration/rollback completos, serviço, normalização de blocos, schemas, tela, rotas editoriais, publicação pública e consumidores. As alterações da Etapa 1 e os anexos locais foram preservados. Nenhuma operação remota ou de Git/publicação foi executada.

### Defeitos encontrados e corrigidos nesta revisão

1. **Conclusão falsa em aba antiga.** O cliente anterior fazia uma única chamada e anunciava conclusão. As duas rotas agora exigem `protocolVersion: 2` antes de chamar o serviço. A tela atual envia o marcador e continua enquanto `finalizing`. Clientes externos da rota legada também precisam enviar o marcador e repetir com a mesma chave/conteúdo. Nenhum consumidor ativo dessa rota foi encontrado no repositório além da invalidação de cache; as fixtures usam a rota nova. Uma aba antiga recebe instrução de recarregar, não um resultado parcial apresentado como completo.
2. **Backend legado sem sessão persistida escapava do fence.** O trigger verificava apenas IDs existentes em batches. Agora qualquer INSERT com `import_batch_id` exige o protocolo transacional, incluindo a antiga chave stateless. Cadastro editorial normal não envia esse metadado e permanece permitido.
3. **Possível ciclo de locks com edição manual.** O BEFORE INSERT da duplicata podia adquirir locks de imagens antes de pedir FOR UPDATE na questão já existente; a edição fazia o contrário. A duplicata agora é somente lida. Locks de referência por caminho usam tentativa não bloqueante, em ordem; locks de assets no trigger usam NOWAIT. Contenção aborta a transação com conflito recuperável, em vez de esperar mantendo locks de questão/resolução. RPCs limitam esperas por locks a dois segundos. Não é afirmação de ausência de todo deadlock possível no banco remoto: triggers externas e MVCC real ainda precisam ser validados.
4. **Referências em Markdown/aliases não eram detectadas.** A comparação JSON da URL inteira falhava quando a URL estava dentro de um texto ou usava `/object/sign/`. O trigger e o planner reconhecem o caminho físico também em textos, URLs assinadas e percent-encoding ASCII, sem acessar rede. A trava usa esse mesmo caminho. O índice por `storage_path` evita varredura do ledger no trigger; edições sem imagens importadas têm saída rápida. Uma referência não reconhecida não deve ser “adivinhada”: formatos históricos fora dos caminhos aceitos continuam preservados para revisão.
5. **Adoção legada sem trava de referência.** Claim/adoption agora usa a mesma trava de caminho que registro e descoberta; não pode intercalar silenciosamente uma referência antiga ainda não registrada.
6. **Snapshot misturava revisões.** Três consultas separadas podiam combinar lote antigo com slots/journal novos. A leitura agora usa RPC sob o mesmo lock de batch das mutações, omite `operation_id` e retorna um snapshot coerente.
7. **Pendência de varredura podia desaparecer.** Uma falha no SDK na primeira página podia deixar `cleanup_pending=false`. `cleanup_scan_pending` persiste a descoberta incompleta e é rearmado em cada manutenção; falha não parece limpeza concluída. Remoção/resultado incerto reinicia o cursor. Manutenção de expirados prioriza `updated_at` mais antigo, evitando selecionar indefinidamente os mesmos primeiros cinco lotes.
8. **Checagens incompletas de efeito/expiração.** Journal suprimido por trigger agora aborta mesmo sem blocos; confirmação/tombstone/slots e escritas finais relevantes verificam FOUND. A atualização final de batch revalida token e prazo depois de eventuais esperas; uma operação de descoberta também verifica prazo antes do retorno. Os metadados autoritativos são incorporados antes de construir a lista de colunas do INSERT.
9. **Preflight do índice insuficiente.** Um índice homônimo, único e válido em coluna errada era aceito. Agora confere tabela, coluna, número de chaves e predicado. Falhas no índice ou no meio do DDL são testadas sem deixar colunas/journal parciais. A migration inteira permanece transacional; timeouts locais evitam espera indefinida.

### Garantias examinadas

| Caminho/disputa | Evidência no código/SQL |
| --- | --- |
| Aquisição/renovação/liberação/retomada | Mesma linha de batch FOR UPDATE; token e prazo obrigatórios; nova posse somente após expiração; release/renew/complete antigos rejeitados depois da troca |
| Finalizar/finalizar | Claim exclusivo + journal único por item + índice global de origem; uma questão por requisição |
| Finalizar/cancelar/limpar/confirmar | Operação e status verificados sob o lock; `finalizing` não é editável/cancelável; cleanup terminal não pode assumir lote em finalização |
| Questão/blocos/journal/progresso | Uma função/transação por item, contagem de blocos e verificação de journal; falha de qualquer parte reverte tudo desse item |
| Resposta perdida | Retry lê journal/resultado concluído; lease expirada permite retomar itens faltantes |
| Edição/exclusão posterior | Journal mantém o resultado histórico; FK de question_id usa SET NULL; retry não recria nem repara automaticamente |
| Referência/remoção | Trigger antes da escrita, locks por caminho e asset, tombstone confirmado antes do SDK; caminho descartado não pode ser reutilizado |
| Substituição | Novo caminho UUID, old path preservado até confirmação, compare de previousPath no banco; limpeza apenas da candidata elegível |
| Upload tardio | Ledger criado antes da URL; tombstone mantém pendência por 130 minutos e rejeita confirmação; nova manutenção remove upload tardio simulado |
| Erro de Storage/resultado incerto | Pendência persistida e cursor reiniciado; não desfaz conteúdo nem associação confirmada |
| Autorização | Middleware admin/editor existente + papel/propriedade revalidados nas RPCs; grants diretos revogados nas tabelas novas e EXECUTE revogado de anon/authenticated |

O progresso é o journal: não é uma contagem independente que possa confirmar sem conteúdo. Resultados históricos podem conter o ID de uma questão posteriormente apagada; isso é intencional, não indica recriação. Assets utilizados ficam conservadoramente retidos; esta etapa não tenta coletar imagens editoriais posteriormente desassociadas.

### Inventário dos escritores ativos afetados

- `server/routers.ts`: createQuestion, updateQuestion, setQuestionPublished usam `adminOrEditorProcedure` e payload editorial canônico, sem metadados de lote. SaveResolutionBlock e saveResolutionBlocks inserem/atualizam com o normalizador compartilhado; UPDATE não apaga o vínculo de journal. DeleteResolutionBlock e deleteQuestion continuam possíveis: apagar blocos não apaga journal; apagar questão nulifica o FK do journal, preservando o resultado. Não foi adicionada obrigação de posse de lote a essas edições legítimas.
- `server/publicQuestions.ts`: setPublicQuestionPublication continua exclusivo de admin e atualiza somente campos de publicação; o trigger aplica proteção de imagem também nesse UPDATE. A separação de publicação da Etapa 1 permanece intacta.
- Importação atual e importQuestionBatch: ambos usam a mesma sessão, RPC de item e validação; não existe escritor alternativo ativo no frontend que ignore o resultado parcial. Versões de navegador/backend anteriores são explicitamente bloqueadas e precisam da janela de pausa.
- `createAdminImageUpload`, `confirmAdminStatementImage`, `discardAdminPreparedImage`: permanecem com suas autorizações/prefixos próprios. A limpeza deste lote só remove caminhos UUID de question-imports pertencentes ao batch/slot, nunca statement-images ou um diretório genérico. Referências editoriais que apontem para um caminho importado passam pelos triggers, independentemente da tela usada.
- `AdminResolutionEditorPage.tsx`: utiliza mutações tRPC para gravar; suas consultas antigas com variável `supabase` ausente e imports duplicados são problemas TypeScript preexistentes. Não foram corrigidos aqui, nem foi declarada validação funcional com sessão real desse editor.
- Não há outro INSERT/UPDATE/DELETE de questões/resoluções nas migrations ativas fora da nova função de item. Outros consumidores (VET, aulas, PDF, listagens) só leem essas tabelas. As chamadas de deleteUser encontradas são compensações de cadastro, antes de existir lote; não há fluxo ativo de exclusão de proprietário de batches. A exclusão administrativa externa desse proprietário é bloqueada pela preservação do histórico/FKs e requer política específica futura, não um cascade destrutivo silencioso.

### Pendências e critério de publicação

O roteiro [etapa-2-concorrencia-postgresql.md](etapa-2-concorrencia-postgresql.md) e o setup `supabase/tests/question_import_mvcc_setup.sql` permitem executar as disputas em PostgreSQL nativo local com duas conexões independentes e barreiras controladas. **Esse teste não foi executado e continua pendente.** Não havia PostgreSQL/Docker disponível; nenhum serviço foi instalado ou remoto acessado. O setup é de teste, NÃO é uma segunda migration e NÃO deve ser aplicado no Supabase.

Também faltam validação de Storage real, assinaturas ainda válidas, latência/timeout de instâncias distintas, RLS/grants/triggers efetivos do projeto e sessão real admin/editor. O diagnóstico foi ampliado para expor dependências, triggers externas, políticas e versão já instalada. Referências históricas exigem scan conservador das tabelas de conteúdo no planner; o número de arquivos por passo é limitado a três, mas o custo real deve ser medido no ambiente de homologação. Pausar/adiar a limpeza em contenção é preferível a remover uma imagem em uso.

Não se trata de aprovação irrestrita para produção: seguir a sequência manual acima e concluir os testes pendentes antes de retomar o importador. O único arquivo de aplicação no Supabase é `supabase/migrations/202610200001_question_import_recovery.sql`; diagnóstico é leitura, rollback é emergência e setup MVCC é exclusivamente local.

### Validação da revisão final

- Nove arquivos direcionados, **219/219 testes aprovados**, incluindo 50 cenários SQL de recuperação. Comando: `node node_modules/vitest/vitest.mjs run server/questionImportRecovery.test.ts server/questionImportAuthorization.test.ts server/questionImportImages.test.ts server/questionImportSchema.test.ts server/questionImportSelection.test.ts server/questionImportTaxonomy.test.ts server/statistics.test.ts server/privacyAuthorization.test.ts server/adminAccessSql.test.ts --maxWorkers=1 --minWorkers=1 --silent`.
- Novas regressões cobertas: aba antiga rejeitada antes da escrita; cliente legado atualizado recebe `finalizing`; snapshot sem token; Markdown em enunciado/alternativa/resolução; alias assinado e percent-encoding; upload tardio simulado; journal silenciosamente suprimido; índice homônimo errado; falha no meio do DDL sem alterações parciais; operações editoriais normais; pendência da descoberta após falha; token antigo incapaz de renovar/liberar/concluir.
- `npm run build` aprovado: cliente e servidor, aviso preexistente de chunks grandes. Nenhuma dependência nova.
- Suíte completa final confirmada na continuação: **965 testes, 955 aprovados, sete falhas preexistentes e três ignorados**. Nenhuma falha nova. As sete falhas continuam nos mesmos casos de baseline: duas em adminQuestionCreateIntegrity, uma em difficulty, duas em difficultyIntegration, uma em interactiveQuizState e uma em vet/vetEngine. Os nove arquivos direcionados também passaram integralmente (219/219).
- TypeScript: **os mesmos 11 erros preexistentes**, nos mesmos arquivos/causas documentados acima; nenhuma falha nova. Testes são excluídos pelo tsconfig existente e foram executados pelo Vitest.
- `git diff --check` aprovado, também conferidos os arquivos novos da entrega com `git diff --no-index --check`; apenas avisos de conversão LF/CRLF, sem erro de whitespace.
- SQL executado somente em PGlite descartável; não houve SQL nativo, Storage real, migration remota, rollback remoto, commit, push, merge ou deploy. O HEAD permanece `6a52f78fcdfff427dee751d0d8a33140496a0cbe`.
