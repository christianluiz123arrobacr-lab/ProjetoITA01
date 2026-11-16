# Navegação, Admin, contatos e ranking — entrega local de 15/10/2026

## Escopo e preservação

Branch `integracao-pr68-pr69-v2`, partindo de `df31a7549ff75bb790c0793f54fde87930dac610`. O Git estava limpo, exceto `.codex-remote-attachments/`, que não foi alterado nem incluído em staging. Não foram encontrados arquivos `AGENTS.md` no repositório ou nos diretórios ancestrais consultados.

Não houve commit, push, merge, deploy, alteração de variáveis, consulta/escrita no Supabase remoto ou alteração de arquivos/imagens existentes. SQL foi executado **somente no PostgreSQL local sintético PGlite dos testes**. Nenhuma dependência foi adicionada.

## 1. Causas comprovadas e limites da investigação

### Banco de questões

O quiz usava `questions.length` tanto para o progresso quanto para a conclusão. Esse array contém apenas os lotes já transferidos: responder 20 poderia concluir um treino de 91. A tela também dependia da primeira busca filtrada para preencher os cartões gerais. Ambos os problemas foram confirmados no código.

Agora:

- Abertura/limpeza não busca enunciados, alternativas nem uma lista de questões. Uma RPC autenticada agregada retorna os totais **gerais de questões publicadas**, disciplinas e dificuldades, independentemente dos filtros.
- Aplicar captura uma lista compacta e ordenada de IDs e o total, sem gabaritos. Somente os corpos de 20 questões são carregados por vez. Os próximos corpos são antecipados quando faltam cinco questões no lote.
- A captura de IDs é importante para filtros de prática: responder uma questão pode removê-la da consulta viva de “não respondidas”. Reexecutar a consulta por offset deslocaria o próximo lote. O treino mantém a seleção escolhida no momento de Aplicar; novas questões entram somente em uma nova aplicação.
- Anterior/próxima percorrem o total real. Não há paginação, contador de carregados ou botão manual para acrescentar questões. O clique em próxima no limite aguarda o lote e avança depois de ele chegar.
- Respostas e o tempo da questão atual não são reiniciados ao acrescentar um lote. Conclusão exige todos os corpos presentes e todas as questões do total respondidas.
- Falha de rede, IDs repetidos, total inconsistente ou questão removida/não publicada durante a leitura não viram conclusão. Há mensagem e tentativa manual; reaplicar é uma ação explícita quando a seleção não pode mais ser recuperada.
- Autoria das resoluções passa a ser consultada para a questão atual: a consulta anterior enviava o array crescente inteiro e excederia o limite de 100 IDs do endpoint.

### Busca administrativa

A busca usava cada tecla diretamente na chave da consulta. A RPC compartilhada materializava `q.*`/`to_jsonb(q)`, incluindo textos e alternativas extensos, antes de filtrar; construía estruturas voltadas ao aluno e consultava suas tentativas mesmo no caminho administrativo.

A busca agora tem debounce de 350 ms, cancelamento por `AbortSignal`, chave por filtros/página e descarte de resposta cancelada. A consulta administrativa usa uma visão estreita de metadados, sem conversão da questão inteira antes dos filtros. O enunciado só participa quando há busca textual e depois dos demais filtros; projeção da questão e resumo de resoluções ficam limitados à página. Contagem exata, ordenação, facetas, publicação, semântica de acentos/capitalização e formatos legados/JSONL foram comparados com a RPC anterior.

Não se aumentou o timeout. Nenhum índice novo foi acrescentado: o custo identificado era trabalho repetido/materialização larga. Os índices existentes de resoluções/tentativas continuam intactos; o teste de plano confirma o uso do índice de resoluções quando consultado por questão. Não há evidência local que justifique acrescentar um índice textual ou de cargo sem conhecer o plano e a distribuição de produção.

### Autenticação/cargo

O contexto validava o token e fazia duas chamadas independentes (`admin_users` e `profiles`). Uma falha em qualquer uma tornava a autenticação indisponível. Isso explica o mecanismo de `stage: roles`, mas **não prova qual consulta/erro do provedor provocou cada ocorrência em produção**.

Uma RPC resolve as duas fontes em um único statement/snapshot. Mantém exatamente a precedência anterior: admin/editor em `admin_users`; depois admin em `profiles`; senão aluno. Perfil ativo é reutilizado somente na mesma requisição. Não há cache de cargo entre requisições. Duplicidade de identidade, resposta malformada, erro ou timeout falham fechados com indisponibilidade, sem conceder acesso e sem transformar indisponibilidade em token inválido. Validação real do token e limites de espera continuam presentes.

Os logs seguros distinguem `supabase_auth`, `roles` e RPC de negócio, com códigos, duração e correlação. A nova RPC precisa da migration antes da publicação; não há fallback silencioso para cargo presumido.

### Dashboard e importação

Não foram acessados logs completos do Vercel. Portanto, não há comprovação de timeout da `vet_admin_dashboard`, nem da etapa exata da falha histórica da importação. O SQL do dashboard foi preservado.

O dashboard admite uma única repetição automática após 1 s para erro temporário de serviço/rede, mantém dados de uma atualização anterior e oferece tentativa manual. Autenticação definitiva, autorização, validação, migration ausente e resposta estruturalmente inválida não recebem essa repetição.

Na importação, retomada e cancelamento tinham callbacks com `await` sem tratamento da rejeição. Agora apresentam mensagens recuperáveis. Falha de listagem de lotes é exibida, em vez de parecer ausência de lotes. A criação/finalização não têm retry automático; a finalização concluída continua retornando o resultado persistido, e as chaves únicas de importação existentes continuam impedindo duplicação das questões.

O middleware acrescenta operação, código, duração e correlação para os endpoints de importação; falha de cargo continua registrada no contexto, antes dessas operações. A rotina de erro de banco registra apenas descrição constante da etapa e código sanitizado. Upload direto ao Storage deve ser confirmado no Network do navegador: esse trânsito não passa pela função Vercel. Não se atribuiu uma falha de Storage/arquivo ao provedor de autenticação sem evidência.

## 2. Arquivos e comportamento alterados

- `QuestionBankPage.tsx`, `useAppliedQuestionBrowse`/`appliedQuestionBrowse.ts`, `progressiveQuiz.ts`, `InteractiveQuiz.tsx`, `shared/questionBrowse.ts`: totais separados, seleção estável, navegação/progresso real e carregamento interno.
- `AdminQuestionsPage.tsx`, `useDebouncedValue.ts`, `adminQuestionBrowse.ts`: debounce, cancelamento e proteção contra resposta antiga.
- `server/_core/context.ts`: snapshot de cargo validado e revalidado por requisição.
- `server/performanceStageTwo.ts`, `server/routers.ts`: RPC administrativa especializada, totais agregados, códigos de falha e correlação.
- `AdminDashboardPage.tsx`, `transientRetry.ts`: recuperação limitada, sem descartar dados exibidos.
- `AdminQuestionBatchImportPage.tsx`, `server/_core/trpc.ts`, `questionImportBatchService.ts`: erros recuperáveis e diagnóstico. Nenhum algoritmo de upload, conversão ou validação de imagens foi modificado.
- `shared/legalContact.ts`, `LegalPage.tsx`, `server/legal/legalService.ts`: e-mail `projetovetoroficial@gmail.com`, exibição `(66) 97170-3627`, ligação `tel:+5566971703627`, compartilhados pelos quatro documentos. Responsável e versões de aceite foram preservados. As antigas variáveis de contato não são mais a fonte destes contatos públicos; nenhuma variável foi editada.
- `RankingPage.tsx`, `ranking.css`: fundos/bordas/cores escuros dos badges e destaques antes não cobertos pelo tema comum. Pontos, ordem e estatísticas não foram alterados.
- Testes atualizados/adicionados: `navigationRecovery`, `authenticationRecovery`, `performanceStageTwo`, `performanceStageTwoClient`, `appliedFiltersAndImages`, `questionImportAuthorization` e fixture isolada em `tests/browser/`.

## 3. SQL local para aplicação manual futura

Migration: `supabase/migrations/202610150001_browse_and_role_snapshot.sql`.

Rollback: `supabase/rollbacks/202610150001_browse_and_role_snapshot.rollback.sql`.

Depende da Etapa 2 (`202610080001_performance_stage_two.sql`). A migration cria visão de metadados e RPCs de cargo, totais gerais e busca administrativa, restritas a `service_role`. Recria a RPC de alunos preservando sua consulta e acrescentando somente IDs compactos da seleção inicial e sua impressão determinística. Resolve dinamicamente as duas grafias de disciplina e a eventual ausência de agrupamento legado. Não altera registros históricos, imagens, usuários, papéis ou assinaturas.

**Antes de publicar este código**, o responsável deve aplicar manualmente a migration no SQL Editor do Supabase. Não executar o rollback normalmente. Ele serve apenas para reversão planejada, após restaurar o backend/cliente anteriores. Migration, rollback e reaplicação foram testados em PGlite local, sem `CASCADE`.

## 4. Validação e medição

- Testes direcionados de navegação, seleção, debounce/cancelamento, sessão/cargos, autorização/importação e compatibilidade: 134 aprovados.
- SQL/serviços de desempenho: 22 aprovados na execução dedicada; 2.500 questões sintéticas, 15 no recorte. Comparação de resultados completos com a RPC anterior, prática pela tentativa mais recente, legado/JSONL, privilégios, revogação e rollback/reaplicação.
- Um `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` da consulta interna administrativa registrou 813,573 ms de execução e 1,294 ms de planejamento em PGlite local durante a validação. Não é medição ou promessa de desempenho em produção. As durações variam com o aquecimento e a concorrência dos testes.
- `npm run build`: cliente Vite e backend esbuild aprovados. Aviso preexistente de chunks maiores que 500 kB.
- `npm run check`: os mesmos 11 erros TypeScript já documentados: sete no editor de resoluções, três referências ao export ausente `QuestionDifficulty`, um parser de seleção com `instituição` no endpoint de cadernos. Nenhum erro novo; não foram corrigidos problemas fora do escopo.
- `git diff --check`: aprovado.
- Ranking real renderizado com dados sintéticos locais no navegador, claro/escuro, desktop e 390 × 844; pódio, badges, estado vazio, erro e carregamento inspecionados. Sem sessão real ou comunicação com Supabase. Fixture usa configuração Vite separada e não é importada pelo build de produção. Execução: `npx vite --config tests/browser/vite.ranking.config.ts`, acessar `/ranking.html?theme=dark` ou `theme=light`; estados `state=empty`, `error`, `loading`.

Suíte completa: **758 testes — 748 aprovados, 7 falhas preexistentes, 3 ignorados**. Permanecem duas asserções de integridade de criação de questões, três testes de dificuldade/apresentação, uma asserção de dependências do quiz e uma asserção de isolamento do VET. Não houve falha nova nesta execução.

## 5. Auditoria das imagens — sem modificação

| Caminho | Formatos/limite | Envio e validação existentes |
| --- | --- | --- |
| Cadastro/edição de enunciado (`StatementImagesEditor`) | PNG, JPEG, WebP; 3 MiB por arquivo; até 30 imagens | Arquivo original enviado pela URL assinada. Frontend verifica MIME/extensão/tamanho. Confirmação no backend verifica propriedade do caminho, baixa os bytes e verifica assinatura, MIME declarado, tamanho e dimensões de 1 a 12.000 por eixo. |
| Lote (`questionImportBatchService`) | PNG, JPEG, WebP; 3 MiB por arquivo | Validação do lote, proprietário, chave e slot antes da URL assinada; original enviado diretamente. Confirmação baixa bytes e usa o mesmo inspetor de assinatura/dimensões. Inválido é rejeitado pelo fluxo existente. Finalização exige slots obrigatórios prontos. |
| Upload genérico/legado de resolução | PNG, JPEG, WebP; frontend limita a 3 MiB | O handler genérico assina o caminho pelo MIME declarado e o frontend envia o original. Esse caminho **não possui a mesma confirmação binária obrigatória** dos novos enunciados/lotes. É uma diferença preexistente, apenas documentada, não corrigida nesta tarefa. |

`uploadToSignedStorageUrl` passa o próprio `File` ao Supabase; não há conversão ou compressão nesse helper. O inspetor verifica cabeçalhos/estrutura e dimensões, não uma decodificação integral de todos os pixels nem remoção de metadados. URLs legadas/informadas manualmente não passam pela inspeção de bytes de um novo upload. Nenhum arquivo existente foi convertido, redimensionado, migrado ou apagado nesta entrega.

Recomendação legal separada: revisar com o responsável a descrição dos recursos opcionais efetivamente habilitados e da câmera local do laboratório administrativo. Não se alteraram compromissos, práticas declaradas, consentimentos ou versões dos documentos nesta tarefa; somente contatos.

## 6. Pendências de ambiente real

1. Aplicação manual do SQL antes de uma publicação futura; conferir o schema e índices reais sem executar o rollback por rotina.
2. Com autorização posterior, correlacionar logs do Vercel: token → `roles` → `vet_admin_browse_questions`/`vet_admin_dashboard`/endpoint da importação. Registrar plano e duração reais em recortes representativos. A hipótese de indisponibilidade do provedor não foi comprovada remotamente.
3. Testar sessões reais de aluno/admin/editor, revogação e inatividade. Os testes desta entrega usam mocks e banco sintético.
4. Fazer uma importação real autorizada, com Storage, confirmação e retry da finalização, observando o Network. Nenhum lote real foi criado.
5. A navegação foi exercitada em testes de estado e consultas reais do TanStack com transportes simulados; o percurso completo respondendo questões no ambiente real ainda deve ser conferido. O teste visual de navegador nesta etapa cobriu o ranking.

**Entrega apenas local e revisável.**
