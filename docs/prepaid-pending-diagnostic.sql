-- SOMENTE LEITURA. Execute como operador autorizado; não publique o resultado.
-- Substitua o UUID pela conta e ajuste a janela para o horário UTC da ocorrência.
-- Captura: 01/11 23:37 no painel; confirme o fuso do painel antes de converter.
with filtro as (
 select '00000000-0000-0000-0000-000000000000'::uuid as usuario,
        '2026-11-01T00:00:00Z'::timestamptz as inicio,
        '2026-11-03T00:00:00Z'::timestamptz as fim
)
select a.id as tentativa_id, a.state, a.created_at, a.submitted_at,
 a.method, a.months, a.payment_id, p.status as pagamento_status,
 a.result is not null as tem_resultado,
 coalesce(p.gateway_payment_id,a.result->>'providerResourceId') as recurso_externo_id,
 a.attempt_key, 'mp-prepaid-'||a.payment_id::text as chave_idempotencia_provedor,
 'payment:'||a.payment_id::text||':subscription:'||(a.snapshot->>'subscription_id') as referencia_externa,
 a.snapshot->>'total_cents' as valor_congelado_centavos, p.amount_cents as valor_pagamento_centavos,
 p.currency, a.snapshot ? 'affiliate' as snapshot_tem_cupom,
 exists(select 1 from public.billing_prepaid_attempt_keys k where k.attempt_id=a.id) as tem_alias
from public.billing_prepaid_attempts a
join public.billing_payments p on p.id=a.payment_id
cross join filtro f
where a.user_id=f.usuario and a.created_at>=f.inicio and a.created_at<f.fim
order by a.created_at desc, a.id
limit 30;
