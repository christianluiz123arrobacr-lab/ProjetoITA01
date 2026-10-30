-- Auditoria somente de leitura. Execute manualmente no SQL Editor se desejar
-- confirmar os dados de produção. Não corrige nem altera registros.

-- O mesmo critério do renderer: imagem com URL; demais blocos com texto.
with resolution_state as (
  select q.id, q.codigo, q.import_batch_id, q.import_source_id,
    count(r.id) as blocks_total,
    count(r.id) filter (where case when lower(trim(coalesce(r.tipo, ''))) = 'imagem'
      then nullif(trim(coalesce(r.url_imagem, '')), '') is not null
      else nullif(trim(coalesce(r.texto, '')), '') is not null end) as blocks_renderable
  from public.questoes q
  left join public.resolucoes r on r.questao_id = q.id
  group by q.id, q.codigo, q.import_batch_id, q.import_source_id
)
select count(*) as questions_total,
  count(*) filter (where blocks_total = 0) as without_any_block,
  count(*) filter (where blocks_renderable = 0) as without_renderable_resolution,
  count(*) filter (where blocks_total > 0 and blocks_renderable = 0) as only_empty_or_invalid_blocks
from resolution_state;

-- IDs que precisam de recuperação ou revisão de conteúdo; lote só quando
-- import_batch_id foi realmente gravado na questão.
with resolution_state as (
  select q.id, q.codigo, q.import_batch_id, q.import_source_id,
    count(r.id) as blocks_total,
    count(r.id) filter (where case when lower(trim(coalesce(r.tipo, ''))) = 'imagem'
      then nullif(trim(coalesce(r.url_imagem, '')), '') is not null
      else nullif(trim(coalesce(r.texto, '')), '') is not null end) as blocks_renderable
  from public.questoes q
  left join public.resolucoes r on r.questao_id = q.id
  group by q.id, q.codigo, q.import_batch_id, q.import_source_id
)
select * from resolution_state where blocks_renderable = 0 order by import_batch_id nulls first, id;

-- Blocos órfãos (normalmente impedidos por FK), sem apagar nada.
select r.id, r.questao_id, r.tipo
from public.resolucoes r
left join public.questoes q on q.id = r.questao_id
where q.id is null;

-- Tentativas canônicas por aluno. last_seen_at é observado, não inferido
-- de created_at, updated_at ou answered_at.
select p.id as user_id, p.last_seen_at,
  count(a.id) as total_attempts,
  count(distinct a.question_id) as distinct_answered,
  count(distinct a.question_id) filter (where a.is_correct = true) as distinct_correct,
  count(a.id) filter (where a.is_correct = true) as correct_attempts,
  round(100.0 * count(a.id) filter (where a.is_correct = true) / nullif(count(a.id), 0), 2) as accuracy_percent,
  max(a.answered_at) as last_answered_at
from public.profiles p
left join public.user_question_attempts a on a.user_id = p.id
group by p.id, p.last_seen_at
order by total_attempts desc, p.id;
