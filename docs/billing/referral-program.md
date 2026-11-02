# Assinaturas e programa de indicação

As migrations continuam pendentes de aplicação no Supabase de produção. A publicação do código só deve ser considerada ativa após essa etapa.

## Migrations e implantação

Aplicar antes do backend novo, em ordem:

1. `supabase/migrations/202609060001_billing_plan_capacity.sql`: regra única de vagas para catálogo, ADM e checkout; reserva manual também protegida por locks.
2. `supabase/migrations/202609060002_referral_program.sql`: versões, códigos, vínculos, descontos, recompensas, auditoria, acesso promocional e integração com o ledger.

A campanha começa desativada/sem configuração. O ADM salva a primeira versão em Assinaturas. Cada salvamento cria um snapshot novo; indicações iniciadas mantêm suas condições e metas por versão. Edições não reescrevem recompensas concedidas. Desativar a versão atual interrompe novos benefícios inclusive das versões anteriores. Estornos continuam sendo processados.

Há scripts correspondentes em `supabase/rollbacks/`, executados em ordem inversa. Foram executados no teste local. Exportar a auditoria antes de remover as tabelas; rollback de schema não é um estorno de benefícios já concedidos. O plano promocional só é removido se não tiver referências, preservando assinaturas existentes. Desabilitar a campanha e parar o backend novo antes de um rollback operacional.

## Regras

- Assinaturas active/trialing com prazo válido ocupam vaga; prazo nulo representa acesso sem vencimento. Manual_review com reserva/período válido reserva vaga; sem ambos os prazos, continua válido até decisão administrativa.
- Pending com reserva ainda válida ocupa vaga temporária (`pending_reservations_count`). Pending expirado, acesso vencido e estados negativos não ocupam. `used_slots` soma acesso, análise manual e reservas pendentes válidas.
- A barra pública é informativa; os checkouts consultam a mesma função após obter os locks SQL.
- Histórico usa `billing_payments.user_id`, com páginas de 20, ordenação por criação/ID, plano, valor, método, status, datas e duração. Também fica disponível para usuário autenticado sem acesso ativo. Nenhum pagamento legado é inventado.
- Código aleatório gerado no servidor; `?ref` é apenas uma pista não confiável persistida na sessão do navegador e validada no cadastro/checkout. Falha de atribuição não desfaz uma conta criada; o checkout tenta novamente.
- Um indicado por vida; autoindicação por ID/e-mail do Auth normalizado é recusada. Participantes precisam ser alunos ativos. A atribuição tem rate limit e não usa e-mail editável do perfil como identidade.
- Só pagamento positivo, aprovado e com acesso aplicado confirma indicação. Cadastro, pagamento sem aplicação, falhas e pagamentos gratuitos não confirmam. Nenhuma chamada de confirmação/concessão está exposta ao frontend.
- Desconto percentual limitado a 90%, conforme decisão do usuário. Desconto fixo deve ser estritamente menor que o preço do plano; não há cobrança zerada. Desconto apenas em Pix e pacotes pré-pagos, nunca no cartão recorrente.
- Reserva de desconto é única por indicado. Não é reciclada automaticamente após falha ambígua do gateway: uma aprovação tardia não pode gerar dois descontos de primeiro pagamento. O preço é recalculado no SQL antes de criar a cobrança externa.
- Dias extras do indicado são concedidos após pagamento elegível. Esta implementação não oferece uma modalidade de cadastro gratuito integral. Benefício integral não é representado por uma cobrança fictícia de R$ 0.
- Recompensas estendem o ledger de acesso e preservam períodos manuais/legados por um registro de acesso não financeiro. Sem assinatura, criam acesso num plano promocional oculto, sem preço de venda nem limite de vagas de plano pago. Uma compra posterior converte apenas essa raiz promocional para o plano comprado.
- Estorno/chargeback remove a confirmação e revoga recompensas cujo limiar deixou de ser atendido. Novas confirmações válidas podem reabilitar a mesma linha de recompensa, com evento de auditoria, sem duplicar a meta. Replays não concedem dias novamente.
- Tabelas novas têm FKs, índices, unicidades e RLS; anon/authenticated não têm escrita nem execução dos RPCs. Endpoints de configuração e métricas administrativas exigem admin no backend; SQL também valida o ator administrativo.
- Listas de indicação usam “Novo aluno”. Painéis mostram os 100 registros mais recentes; métricas usam todos os registros. WhatsApp substitui somente placeholders permitidos como texto e a URL usa encodeURIComponent.

## Testes locais

Foi autorizada a instalação isolada de PGlite 0.5.8 em `tmp/referral-sql`; não há alteração nas dependências ou lockfile da aplicação.

Para reproduzir, após autorizar a instalação da ferramenta local:

```sh
npm install --prefix tmp/referral-sql --no-save --package-lock=false @electric-sql/pglite@0.5.8
node server/billing/tests/runReferralSqlTests.mjs
npx vitest run server/billing/referralProgram.test.ts server/billing/referralSql.test.ts
npm run build
npm test
git diff --check
```

O wrapper Vitest SQL é ignorado explicitamente quando essa ferramenta local não está instalada; o runner direto exige a instalação. Os testes criam um PostgreSQL em memória, reconstroem somente as tabelas-base de faturamento e aplicam as migrations reais de faturamento. Não usam credenciais, rede ou dados de produção. PGlite usa uma conexão: testa idempotência, constraints, transações e permissões, mas não simula contenção entre duas conexões PostgreSQL independentes.

Há testes de vagas, reserva manual, bloqueio por lotação, histórico mensal/pré-pago, estados de pagamento, duplicação, autoindicação, metas, descontos, validade, estorno, restauração, RLS, vencimento legado, plano promocional, compra posterior e rollback.

## Diagnóstico histórico

Não foi consultado o banco remoto; portanto, não é possível afirmar quantos pagamentos históricos reais estão sem registro. `diagnose-legacy-payments.sql` é uma consulta somente leitura para localizar candidatos. Só extratos/registros do provedor com identidade, valor, moeda e status verificáveis podem fundamentar uma futura migração financeira. Preço do plano e período de acesso não bastam.

## Validação final

- Testes direcionados: 24/24 aprovados (12 de preço legado e 12 novos, incluindo o wrapper SQL).
- Runner SQL: 39 verificações aprovadas, incluindo as duas migrations e rollback.
- `npm run build`: aprovado; aviso de chunks grandes já existente.
- `npm test`: 420 aprovados e 8 falhas. Cópia de HEAD `71a87ac3525da1cac65027aad9a5f0555c1c34df`: 408 aprovados e as mesmas 8 falhas, com nomes comparados automaticamente. Nenhuma falha nova.
- `git diff --check`: aprovado.
- Verificação adicional TypeScript: 89 erros tanto no código atual quanto na cópia de HEAD; mensagens comparadas sem os números de linha, sem erros novos.

Falhas preexistentes, mantidas fora deste escopo:

- server/adminQuestionCreateIntegrity.test.ts > integridade do editor de criação de questões > mantém somente a implementação TRPC atual da resolução importada
- server/adminQuestionCreateIntegrity.test.ts > integridade do editor de criação de questões > salva a questão, depois os blocos, conclui a mensagem e só então navega
- server/difficulty.test.ts > question difficulty > defines very hard presentation and weight
- server/difficultyIntegration.test.ts > difficulty integration > renders the question-bank level in the fixed order and violet color
- server/difficultyIntegration.test.ts > difficulty integration > profile, public profile and VET use the centralized weight
- server/interactiveQuizState.test.ts > estado e derivações do InteractiveQuiz > não recalcula completionData quando muda somente a alternativa selecionada
- server/privateRouterAccess.test.ts > separação de acesso administrativo e assinatura > não monta SubscriptionGuard em admin e mantém o guard para alunos
- server/vet/vetEngine.test.ts > VET canônico > isola estatísticas de perfil no usuário autenticado

## Arquivos alterados/criados

- `client/src/App.tsx`
- `client/src/components/admin/AdminReferralProgram.tsx`
- `client/src/components/billing/PaymentHistory.tsx`
- `client/src/lib/referralHint.ts`
- `client/src/pages/AdminBillingPage.tsx`
- `client/src/pages/LandingPage.tsx`
- `client/src/pages/MinhaAssinaturaPage.tsx`
- `client/src/pages/PricingPage.tsx`
- `client/src/pages/ReferralPage.tsx`
- `client/src/pages/RegisterPage.tsx`
- `client/src/services/billing.service.ts`
- `docs/billing/diagnose-legacy-payments.sql`
- `docs/billing/referral-program.md`
- `server/billing/billingService.ts`
- `server/billing/legacyFounderPricing.test.ts`
- `server/billing/paymentHistory.ts`
- `server/billing/planCapacity.ts`
- `server/billing/referralProgram.test.ts`
- `server/billing/referralService.ts`
- `server/billing/referralSql.test.ts`
- `server/billing/tests/referralBootstrap.sql`
- `server/billing/tests/referralDatabase.mjs`
- `server/billing/tests/runReferralSqlTests.mjs`
- `server/routers.ts`
- `shared/referralProgram.ts`
- `supabase/migrations/202609060001_billing_plan_capacity.sql`
- `supabase/migrations/202609060002_referral_program.sql`
- `supabase/rollbacks/202609060001_billing_plan_capacity.sql`
- `supabase/rollbacks/202609060002_referral_program.sql`
