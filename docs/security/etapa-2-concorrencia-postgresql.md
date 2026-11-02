# Etapa 2: concorrência MVCC — roteiro pendente

Não foi executado: esta máquina não oferece `psql`, `postgres`, `pg_ctl` ou Docker. PGlite tem uma conexão serializada e não prova os cenários abaixo. O roteiro usa dois processos/conexões e transações mantidas abertas como barreiras, não atrasos presumidos.

## Preparação exclusivamente local

Em PostgreSQL 15+ local descartável, como superusuário de teste, crie uma base **nova e vazia**, chamada `vet_import_review`. Não use dump com dados pessoais, conexão Supabase, produção ou ambiente compartilhado. Na raiz do repositório:

```powershell
createdb -h 127.0.0.1 -U postgres vet_import_review
psql -X -h 127.0.0.1 -U postgres -d vet_import_review -f supabase/tests/question_import_mvcc_setup.sql
```

O setup recusa outro nome de base, servidor não local ou uma tabela de questões existente. Cria somente fixtures sintéticas; os três papéis sem login são globais ao cluster de teste. Não execute esse setup no SQL Editor do Supabase.

Abra **dois terminais**, A e B, com `psql -X -h 127.0.0.1 -U postgres -d vet_import_review`. Em ambos:

```sql
\set VERBOSITY verbose
\set actor '00000000-0000-4000-8000-000000000001'
\set batch '10000000-0000-4000-8000-000000000001'
\set old '20000000-0000-4000-8000-000000000001'
\set fresh '20000000-0000-4000-8000-000000000002'
```

## 1. Finalizar/finalizar, finalizar/cancelar, finalizar/confirmar e limpar

A executa e **não faz COMMIT**:

```sql
select vet_test_batch(:'batch');
begin;
select vet_import_control(:'batch',:'actor','claim',:'old','{"kind":"finalize"}');
```

B tenta cada claim, fora de transação explícita:

```sql
select vet_import_control(:'batch',:'actor','claim',:'fresh','{"kind":"finalize"}');
select vet_import_control(:'batch',:'actor','claim',:'fresh','{"kind":"cancel"}');
select vet_import_control(:'batch',:'actor','claim',:'fresh','{"kind":"edit"}');
select vet_import_control(:'batch',:'actor','claim',:'fresh','{"kind":"cleanup"}');
```

Enquanto A mantém a linha, cada chamada de B deve falhar com `55P03` em aproximadamente dois segundos (lock timeout), sem mutação. A faz `commit;`. Repetidas enquanto a posse ainda vale, as chamadas de B devem falhar com `40001 IMPORT_BUSY`. Confirmar imagem exige primeiro posse `edit`; o mesmo bloqueio se aplica. Repita com um novo UUID de lote e A assumindo `cancel`: B não pode finalizar depois da liberação nem confirmar uma imagem cancelada (`55000`). Para testar a ordem inversa, A assume `edit`, B tenta `finalize`; só depois de A confirmar/liberar B poderá validar os slots.

## 2. Expiração, substituição da posse e execução antiga

A inicia e expira **apenas a fixture local**, sob o lock da linha:

```sql
select vet_import_control(:'batch',:'actor','start',:'old');
begin;
select set_config('vet.import_batch',:'batch',true);
update question_import_batches set lease_until=clock_timestamp()-interval '1 second' where id=:'batch';
commit;
```

B assume nova posse:

```sql
select vet_import_control(:'batch',:'actor','claim',:'fresh','{"kind":"finalize"}');
```

A tenta `renew`, `release`, `complete` e item usando `old`:

```sql
select vet_import_control(:'batch',:'actor','renew',:'old');
select vet_import_control(:'batch',:'actor','release',:'old');
select vet_import_control(:'batch',:'actor','complete',:'old','{"expected_count":0,"result":{}}');
select vet_import_commit_item(:'batch',:'actor',:'old','q1',
  jsonb_build_object('import_source_id',:'batch'||'-source','enunciado','Teste'),'[]',0);
```

Todas devem falhar `40001`; o token de B não pode mudar. B confirma um item, repete a chamada e conclui:

```sql
select vet_import_commit_item(:'batch',:'actor',:'fresh','q1',
  jsonb_build_object('import_source_id',:'batch'||'-source','enunciado','Teste'),
  '[{"tipo":"texto","texto":"Resolução","ordem":1}]',0);
-- Repetir exatamente a chamada acima: mesmo resultado, uma questão e um bloco.
select vet_import_control(:'batch',:'actor','complete',:'fresh','{"expected_count":1,"result":{"status":"completed"}}');
select count(*) from question_import_items where batch_id=:'batch';
```

Interromper o cliente após o commit do item/conclusão e consultar `snapshot` deve mostrar o resultado confirmado. Repetir `claim finalize` de um lote concluído devolve seu resultado sem reabri-lo. Edite/apague editorialmente a questão e repita: não deve recriar nem sobrescrever conteúdo.

## 3. Referência manual contra tombstone e ordem de locks

Use outro lote nos dois terminais: `\set batch '10000000-0000-4000-8000-000000000003'`. A cria, assume `edit`, registra uma candidata e libera; nos dois terminais capture o mesmo caminho:

```sql
-- Apenas A: select vet_test_batch(:'batch');
select 'question-imports/'||batch_id||'/'||id||'/30000000-0000-4000-8000-000000000001.png' path
from question_import_image_slots where batch_id=:'batch' \gset
-- Apenas A, uma vez:
select vet_import_control(:'batch',:'actor','claim',:'old','{"kind":"edit"}');
select vet_import_control(:'batch',:'actor','register',:'old',jsonb_build_object('import_key','q1','slot_id','fig','path',:'path','url','https://storage.test/'||:'path'));
select vet_import_control(:'batch',:'actor','release',:'old');
```

A abre transação e cria referência manual (também testar UPDATE de questão e INSERT/UPDATE de resolução):

```sql
begin;
insert into questoes(enunciado) values('![Figura](https://storage.test/'||:'path'||')');
-- Não confirmar ainda.
```

B assume cancelamento e tenta planejar remoção. Deve encontrar contenção controlada (`55P03`/`40001`), não apagar o arquivo e não entrar em deadlock. A confirma. B retoma a limpeza com a posse correspondente e `plan_delete`: o arquivo deve ficar `retained`, e não pode estar no array de remoção.

Repita com um novo lote, ordem inversa: B confirma cancelamento, abre transação, faz `plan_delete` e mantém a transação aberta. A tenta INSERT/UPDATE com o caminho tombstonado: `55P03` imediato no asset ocupado, ou `40001` na trava do caminho; faça rollback se abriu transação. B confirma; A repete e deve receber `55000 IMPORT_FILE_DISCARDED`, inclusive com URL `/object/sign/`, query string ou Markdown. Nenhuma remoção real de Storage faz parte desse teste.

Para adoção legada, preparar a referência na fixture **antes** de registrar a candidata; A mantém o INSERT aberto e B chama `discover` sob posse de limpeza: a trava do caminho deve rejeitar a descoberta até A terminar. Após A confirmar, o planner deve detectar a referência histórica. Para múltiplos assets, trocar a ordem dos dois URLs no UPDATE não pode criar espera cíclica: as travas são ordenadas e não bloqueantes.

## Critérios e limitações

Inspecione `pg_locks`/`pg_stat_activity` no outro terminal durante as barreiras, registre códigos e tempos e confira contagens/estados depois de cada disputa. `40P01`, arquivo referenciado em plano de remoção, posse roubada ou contagem duplicada reprovam o teste. Em erro de transação explícita execute `ROLLBACK` antes do próximo cenário. Recrie a base descartável ou use novos UUIDs, sem truncar tabelas em ambiente compartilhado.

Ainda precisam de homologação separada: erro/timeout real do SDK, remoção com resposta perdida, upload tardio com assinatura ainda válida, ausência definitiva após 130 minutos, permissões efetivas e duas instâncias HTTP. O Storage não participa da transação PostgreSQL; não declarar essa etapa aprovada por executar somente estes SQLs.
