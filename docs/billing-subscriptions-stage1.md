# Assinaturas — Etapa 1: integração local e publicação manual

## Estado atual
Revisão de homologação e preparação dos ambientes: ver `docs/prepaid-homologation-status.md`. Não há ambiente nativo/sandbox configurado nesta máquina; testes reais continuam pendentes. Os diagnósticos foram consolidados com consulta de investigação sem dados do comprador.
A base anterior foi integrada ao checkout pré-pago existente. Nenhum commit, push, deploy, SQL remoto ou chamada autenticada ao Supabase/Mercado Pago real foi executado. A documentação pública do provedor foi consultada para confirmar os endpoints de recuperação.

A implementação local está pronta para revisão e homologação. **Ainda não há aprovação de publicação em produção**: faltam concorrência MVCC nativa, homologação Mercado Pago/Supabase e teste visual autenticado. PGlite não demonstra concorrência de duas conexões PostgreSQL.

## Fluxos existentes auditados
| Fluxo | Evidência e comportamento confirmado | Compatibilidade necessária |
|---|---|---|
| Cadastro/login | `LoginPage.tsx`, `RegisterPage.tsx`, `server/routers.ts` auth: Supabase Auth e cadastro pelo backend; atribuição de indicação faz parte do cadastro. `PricingPage.tsx` direciona usuário ao login e exige sessão para criar pagamento. | Manter identidade validada pelo servidor; compra não pode confiar em userId/preço enviados pelo cliente. |
| Catálogo | `billing.listPublicPlans`, `getPlanForCheckout` em `billingService.ts`, `billing_plans`; preços em centavos, ativo/público e capacidade. Admin usa `updateBillingPlan`. | Não duplicar planos para durações; mensalidade recorrente continua separada de pacote. |
| Fundador | `legacyFounderPricing.ts`: slugs Beta antigos retirados; plano `legacy-founder`, entitlement `legacy_founder_eligible` ou convite válido; preço contratado preservado em metadata no serviço de cobrança. | Desconto futuro deve partir do preço autorizado/contratado, jamais substituir elegibilidade por seleção visual. |
| Assinatura e acesso | `platformAccess.ts`, `accessConsistency.ts`, RPC canônica, ledger das migrations de billing. Aprovação agrega acesso; estorno reconstrói ledger. | Preservar acesso futuro/promocional e histórico; dias promocionais continuam recompensas, não pagamentos. |
| Pré-pago | `createPrepaidCheckout`: 1/2/3 meses, Pix ou preferência de cartão. Seletor em `PricingPage` e `MinhaAssinaturaPage`, tipos em `billing.service.ts`; RPC `apply_approved_prepaid_payment` aceita somente 1/2/3 na migration `202608280001`. | Abrir 6/12 exige mudar todos esses contratos e a aplicação SQL, não apenas UI. Não foi feito nesta base. |
| Recorrência | `createCardSubscriptionCheckout`, reserva exclusiva e `executeReservedCardCheckout`, preapproval Mercado Pago; estados/reconciliação em `billingOrchestration.ts`. | Não modificar recorrências existentes. Pré-pago não renova automaticamente. O fluxo existente pode cancelar recorrência após aprovar troca por pacote; não foi alterado. |
| Pix | `createPixPayment`: reserva, prazo de pagamento e chave por payment id. | Preservar expiração e conciliação de resultado incerto. |
| Valores no provedor | `processApprovedPayment` compara centavos/moeda com pagamento local; `financialRules.ts`, `billingStatusMapper.ts`; criação usa centavos convertidos para o provedor. | Snapshot e valor final precisam existir antes de chamar provedor; novas configs não podem reprecificar compras antigas. |
| Webhook | `webhookSignature.ts` HMAC/timingSafeEqual, `processMercadoPagoWebhook` valida assinatura antes de claim; `runClaimedBillingWebhook` processa/fecha claim. Duplicatas processadas retornam sucesso, em processamento retornam 409. | Preservar claims, reconciliação oficial e aplicação idempotente do ledger. Isso não garante idempotência da criação de um novo pacote. |
| Estados | `billingStatusMapper.ts`, aprovação/reconciliação/reversão em `billingService.ts`: pending/approved/rejected/expired/refunded/chargeback/failed. | Não conceder acesso antes de aprovado, não apagar histórico em falha. |
| Vagas/convites | `planCapacity.ts`, `202609060001_billing_plan_capacity.sql`, reserva com locks de usuário/plano e convite. | Duração não deve multiplicar vagas nem ignorar uma reserva; preservar locks existentes. |
| Indicação | `referralService.ts`; `202609060002_referral_program.sql`, `202609080001_referral_checkout_fix.sql`: atribuição persistida, versão de campanha, claims exclusivos, elegibilidade e primeira compra; desconto de percentual usa floor em centavos; cartão recorrente não recebe esse desconto. | Preservar condições e recompensas reais; não aplicar benefício apenas porque existe um código no navegador. |
| Recompensa/estorno | `referral_reconcile_payment`, `referral_grant` e ledger incorporam rewards separados e revogam/recalculam no estorno. | Não criar pagamentos fictícios. Esta entrega não escreve em pagamentos, recompensas ou assinaturas. |
| Admin | `adminProcedure` exige admin no backend. Configuração de campanha e planos é administrativa. | Editor/aluno não podem editar ou consultar a nova configuração administrativa. |


## Recuperação e fronteiras de falha

- A chave UUID é persistida no navegador por usuário/plano/duração/método. Refresh e retry mantêm a mesma chave; chave ausente em abas antigas é rejeitada pelo backend antes de criar cobrança. LocalStorage indisponível resulta em erro antes da chamada, sem fallback que gere novas identidades.
- Uma intenção nova é explícita na interface (“Iniciar outra compra se a anterior já estiver encerrada”). Uma chave nova não contorna pagamento pendente/incerto: o SQL recupera a tentativa existente ou rejeita condições diferentes.
- `prepare_prepaid_checkout` usa locks de campanha/usuário/plano e cria reserva, pagamento, snapshot, claim de desconto e tentativa na mesma transação. Toda chave que recupera uma tentativa recebe um alias persistido; esse alias continua associado ao pagamento mesmo depois da aprovação/estorno.
- Snapshot preserva preço mensal autorizado, meses, revisão, percentual/centavos da duração, subtotal líquido, desconto de indicação, total, moeda contratada, título, prazo e referência da assinatura. Mudanças posteriores não reprecificam tentativa existente.
- A aquisição `prepared → submitted` é um compare-and-swap no banco. Só o vencedor faz POST. Não há lease que, ao expirar, autorize outra cobrança. Nenhum caminho de falha marca automaticamente o pagamento como fracassado/libera a tentativa.
- Depois de `submitted`, retries fazem GET por external_reference e GET do recurso identificado. Uma busca vazia, múltipla, erro ou valor divergente mantém incerteza e retorna erro temporário; nunca habilita outro POST.
- Retorno tardio pode concluir a mesma tentativa; a conclusão serializa no registro e retorna o resultado já confirmado. Se a gravação falhar ou sua resposta se perder, a identidade permanece. Não escreve status/aprovação/acesso, que podem ter sido atualizados por webhook antes do retorno.
- APIs oficiais: [busca de preferências](https://www.mercadopago.com.co/developers/en/reference/online-payments/checkout-pro-preferences/search-preferences/get) usa elements/total e busca limitada aos últimos 90 dias; [referência de pagamentos/preferências](https://www.mercadopago.com.ar/developers/pt/reference/online-payments/checkout-pro-preferences/overview) documenta consulta por external_reference e detalhe. A implementação não trata o cabeçalho X-Idempotency-Key das preferências como garantia suficiente.
- Uma queda depois do claim mas antes do POST fica bloqueada para reenvio automático, pois não é possível provar ausência do envio. Continua identificável e consultável; se o provedor nunca localizar recurso, exige investigação de suporte. **Não há reset automático nem ferramenta para apagar tentativa incerta.** Não remover registros, aliases ou resetar submitted para prepared em produção.
- Após mais de 90 dias, preferência incerta sem ID recuperado pode exigir suporte do Mercado Pago. Ausência na busca não é autorização para criar outra preferência. Uma tentativa pronta ainda usa o resultado persistido.
- A interface oferece “Recuperar compra anterior” independentemente das ofertas atuais: o backend procura somente tentativas do usuário autenticado naquele plano e usa a chave já persistida. Isso permite recuperação em outro dispositivo, com preço/duração desativados ou capacidade esgotada depois da criação. Sem registro anterior, o endpoint falha antes de preparar qualquer compra.
- O mesmo usuário pode ter nova compra intencional depois de encerrada a anterior, com nova chave e regras atuais. Reabrir uma chave antiga nunca cria pagamento novo. Compras pendentes antigas, que não têm tentativa, bloqueiam nova criação enquanto ainda pagáveis conforme a regra SQL; devem ser reconciliadas pelo fluxo existente.

## Durações e preço

1/2/3 meses sem configuração explícita preservam a oferta antiga habilitada e sem desconto. Registro administrativo explícito, inclusive desativado, prevalece. Isso evita desligar as ofertas existentes e evita habilitar desconto novo. 6/12 ficam desativados sem registro habilitado. A sugestão 5% para 2/3/6 aparece no admin, mas não altera automaticamente ofertas.

O administrador edita as mesmas opções por plano, sem duplicar planos. Prévia pública autenticada e preparação SQL usam preço do servidor. O contrato de criação é estrito: planSlug, durationMonths, paymentMethod e attemptKey; não recebe preço/desconto/total como autoridade.

Aritmética: preço mensal em centavos × meses; desconto da duração em pontos base, arredondamento half up uma vez no total; depois indicação oficial sobre o líquido. Exemplo: 1190 × 6 = 7140; duração 5% = 357; líquido 6783; indicação 10% com floor existente = 678; total 6105. Valores precisam caber no integer financeiro.

`referral_calculate_discount` mantém validação de aluno ativo, campanha/versionamento, primeira compra, claim único, métodos elegíveis, limite de desconto e mínimo de um centavo. A nova preparação grava o claim com a base líquida correta na própria transação, sem chamar o antigo `referral_price_payment`, cujo guard de preço integral impediria a composição autorizada pelo usuário. Não há cupom de afiliado/comissão/repasses nem alteração do cartão recorrente.

O RPC de aprovação pré-paga passou a aceitar 6/12 e usa o ledger existente. O início da contagem respeita o acesso acumulado; não adiciona dias aproximados. O wrapper ordena lock da campanha/usuário antes do pagamento. Uma ambiguidade preexistente entre coluna subscription_id e parâmetro de saída em `recalculate_mercadopago_access_after_reversal` foi confirmada pelo teste e corrigida com alias da tabela, mantendo o restante da função.

Fundador é verificado no servidor e novamente na preparação SQL por entitlement/convite, preservando regras de plano ativo/público, capacidade e reserva existente. Recompensas permanecem registros próprios de acesso gratuito; aprovação e estorno continuam pelo webhook/reconciliação oficial, sem concessão na criação/recuperação do checkout.

## Arquivos principais
- `shared/planDurations.ts`: schema e aritmética de prévia.
- `server/billing/planDurations.ts`, `AdminPlanDurations.tsx`, aba existente de `AdminBillingPage.tsx`: configuração/admin.
- `server/billing/prepaidCheckout.ts`: protocolo de submissão/recuperação com dependências testáveis.
- `billingService.ts`: integração com identidade validada, ofertas e preparação; remove o caminho antigo que criava pagamento a cada chamada.
- `mercadoPagoClient.ts`: consultas oficiais por referência e detalhe; rejeita resultados múltiplos.
- `billingStatusMapper.ts`: tipos para 6/12.
- `server/routers.ts`: contrato estrito de tentativa, períodos e oferta autenticada; admin continua exclusivo para configuração.
- `billing.service.ts`: identidade persistida por usuário e intenção explícita; usa recuperação central da sessão.
- `PrepaidOptions.tsx`, `PricingPage.tsx`, `MinhaAssinaturaPage.tsx`: mesmos fluxos de compra com opções habilitadas e valores do servidor. Página anônima pede login sem consultar endpoint protegido.

## Ordem exata do SQL manual / publicação
1. Pausar novas compras durante aplicação e troca de versão; não apagar pagamentos/reservas pendentes. Confirmar no ambiente a presença das migrations anteriores de billing, fundador, capacidade e indicação (inclusive referral_checkout_fix).
2. Aplicar `supabase/migrations/202610280001_billing_plan_duration_configuration.sql` caso ainda não aplicada. Se já aplicada, diagnosticar; não repetir CREATE nem apagar configurações existentes.
3. Aplicar `supabase/migrations/202610280002_prepaid_checkout_recovery.sql`. Cria tentativas/aliases e três RPCs; amplia aprovação pré-paga e corrige a referência ambígua do estorno. Não altera pagamentos históricos nem habilita ofertas comerciais novas.
4. Rodar os diagnósticos somente leitura `supabase/diagnostics/202610280001_billing_plan_duration_configuration.sql` e `202610280002_prepaid_checkout_recovery.sql`. Tabelas/funções presentes, RLS true, anon/authenticated sem acesso e funções apenas service_role. Depois que existirem, a consulta de contagem por estado não deve falhar.
5. Publicar backend e frontend juntos, após homologação abaixo. Recarregar abas antigas; chamadas sem attemptKey serão rejeitadas com segurança. Retomar compras após smoke test. Não voltar ao código antigo de criação com tentativas novas pendentes.
6. Configurar/habilitar somente períodos/descontos desejados no admin. Nenhuma sugestão implica ativação automática.

Ambas migrations têm BEGIN/COMMIT: falha aborta a transação, não confirma objetos parciais. Em erro, ROLLBACK na sessão e investigar; não reaplicar cegamente nem descartar tabelas existentes.

Rollbacks não são instalação normal. Ordem inversa: 002, depois 001, com código/checkout pausados. Rollback 002 bloqueia se houver QUALQUER tentativa (mesmo preparada) ou pagamento 6/12, pois apagar a identidade permitiria cobrança duplicada. Nesses casos usar correção para frente e manter os registros. Exportar configuração antes de rollback 001; ele bloqueia enquanto a tabela de tentativas existir. O rollback 002 restaura funções anteriores, inclusive a implementação preexistente da reversão; não é uma correção financeira nem deve ser usado depois de começar a cobrar.

## Testes e limites
- Testes de concorrência controlada em JavaScript: chamadas simultâneas, timeout depois de aceito, falha no banco após resposta, queda antes de POST, retorno tardio, valor divergente e recuperação de preferência no cartão. Verificam no máximo um POST.
- HTTP simulado dos endpoints oficiais: formato elements/total, pagamentos results/paging, GET do detalhe, vazio sem POST e múltiplos resultados recusados.
- PGlite com migrations reais de billing/capacidade/indicação mais 001/002: aliases persistentes após aprovação; preço imutável apesar de edição/desativação; duração desativada; um pagamento local; claim único; desconto sequencial; aprovação repetida; seis e doze meses de calendário; fundador não elegível/elegível; recompensa única e revogada; estorno/chargeback; RLS e rollback bloqueado.
- Testes anteriores de pagamentos, fundador, indicação, preços/arredondamento e permissões administrativas também foram executados.
- Resultado final: **145 testes aprovados, 1 pulado, em 15 arquivos de billing**. O teste pulado é o runner legado opcional de indicação que exige instalação em tmp/referral-sql; o novo teste SQL desta entrega executou com o PGlite já instalado no projeto. **Build cliente/servidor aprovado**, com aviso existente de tamanho de chunks; **git diff --check aprovado**. **TypeScript: os mesmos 11 erros preexistentes**, nos mesmos arquivos (AdminResolutionEditorPage, tipos de QuestionDifficulty e cast do parser em routers), sem erros novos nesta entrega. A suíte completa do projeto não foi reexecutada nesta continuação.

**Pendente:** PostgreSQL nativo não disponível nesta máquina (psql/postgres/Docker não localizados). Roteiro em `docs/prepaid-native-concurrency.md`; não chamar os testes PGlite de prova de MVCC. Homologar também duas abas/dispositivos, planos de vagas limitadas, edição concorrente e expiração de reserva, pausas de rede reais e respostas tardias no sandbox Mercado Pago/Supabase. Testar visualmente admin, aluno elegível/não elegível e retomada após refresh. Não houve teste de sessão/cobrança real nem aprovação de produção.

Na homologação, verificar: total local igual ao provedor; repetição da tentativa mantendo payment_id/referência; webhook/reconciliação aprovando uma vez; cancelamento de recorrência apenas após pacote aprovado; preservação de acesso/promocional; estorno e chargeback retirando somente o período/recompensa correspondente. Casos incertos não devem liberar compra nova até esclarecer o recurso oficial.

## Base para etapa posterior
A duração é opção por plan_id/months; snapshot no pagamento guarda valores reais e política aplicada. Cupom/afiliado deve compor um quote validado antes da transação, sem recalcular pagamentos passados nem expor configurações administrativas. Nenhuma regra de combinação com afiliados foi criada.
