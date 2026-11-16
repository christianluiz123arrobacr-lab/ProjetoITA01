# Assinaturas — Etapa 2: afiliados, cupons e repasses

## Estado e preservação da Etapa 1

Implementação local sobre as alterações ainda não commitadas da Etapa 1. Foram relidos os relatórios de billing/homologação e o protocolo de preparação/recuperação do pacote. Os arquivos anteriores foram preservados; não houve reset, commit, push, deploy, SQL remoto, cobrança real ou alteração de credenciais.

**Compras com cupom permanecem desativadas.** A migration cria `affiliate_settings.commercial_enabled=false`; o backend também exige `AFFILIATE_CHECKOUT_ENABLED=true`, que não foi configurado nesta tarefa. `.env.example` documenta o padrão false. A interface administrativa não oferece um atalho para ignorar a homologação. Ativar um cupom ou afiliado não ativa o programa comercial global.

Não há aprovação para publicar em produção: seguem pendentes PostgreSQL nativo com conexões independentes, Supabase de homologação, sandbox Mercado Pago e verificação visual com contas reais de teste. Esses ambientes não estavam configurados na revisão da Etapa 1; não foram inventadas credenciais nem executadas chamadas remotas.

## Funcionalidades e permissões

- `/admin/afiliados` integra o menu administrativo e tem `AdminGuard` restrito a admin. Admin vincula UUID de conta existente (obtido em Alunos e acessos), define nome de exibição, ativa/desativa, cria/edita cupons, desconto, comissão, validade UTC, limite e planos por UUID. IDs são chaves existentes, não criação de usuários ou novos papéis.
- `/afiliados` é uma área separada, autenticada, independente de assinatura paga. Afiliado enxerga somente seu relatório. Afiliado desativado conserva acesso ao histórico se a conta continuar ativa, mas seu cupom deixa de ser válido para compra nova.
- Admin pode consultar outro afiliado selecionando-o no painel administrativo. Editor pode abrir `/afiliados`, consultar o próprio perfil vinculado ou ver ausência de perfil; não consegue consultar outro afiliado nem criar/editar configuração ou repasse.
- Aluno sem vínculo não recebe dados do programa. Usuário sem sessão falha no middleware; autorização de sujeito/ator também ocorre em SQL. Não se atribui papel `affiliate` em profiles: vínculo é uma relação separada, preservando aluno/editor/admin.
- RLS e revogação de grants impedem leitura/escrita direta pelo navegador. Somente service_role executa as funções; ator vem da identidade validada no backend. SQL confere novamente admin ativo para mutações, inclusive após revogação de papel.
- O DTO do afiliado exclui nome/email/telefone/documento do comprador e metadados de pagamento. Mostra valores, datas, estado financeiro, cupons próprios e referências dos repasses recebidos. Identificadores de pagamento para ações administrativas não incluem dados pessoais do aluno.

## Preço, reserva e snapshot

Cupom é uma opção exclusivamente do pacote pré-pago existente. O campo mínimo foi acrescentado em `PrepaidOptions`, compartilhado por Planos e Minha assinatura. O link `/planos?cupom=CODIGO` preenche esse campo; o usuário valida antes de comprar. Preço, desconto e comissão enviados como campos extras são rejeitados por schemas estritos.

`affiliate_coupon_quote` valida habilitação global e do backend, conta ativa, cupom/afiliado ativo, validade, plano, duração, fundador/convite e limite. A preparação repete essas regras sob lock. A prévia não reserva uso e pode mudar antes da preparação; somente o snapshot confirmado é contratado.

Ordem do cálculo: base mensal × meses → desconto por duração (half up) → cupom sobre o líquido (half up) → comissão sobre o efetivamente pago antes das taxas (half up). Exemplo: 10000 centavos menos duração 5% = 9500; cupom 5% = 9025; comissão 10% = 903. Percentuais em pontos base, totais em centavos; pagamento zero e valores fora dos limites são rejeitados. O número de meses não multiplica lançamentos de comissão.

`prepare_affiliate_prepaid_checkout` reutiliza a preparação da Etapa 1, na mesma transação, sem chamar provedor. Reserva, pagamento, snapshot e venda do afiliado confirmam juntos ou sofrem rollback juntos. O snapshot copia cupom, afiliado, revisão, percentuais, base e política; edição posterior não altera comissão nem total de compra já iniciada.

Os locks novos seguem `affiliate-finance → referral-program → usuário → plano`; o lock global financeiro serializa configurações, limites, criação de venda, reconciliação e repasse durante transações curtas. Nenhum lock é mantido durante HTTP externo. Isso é o desenho verificado no código; ausência de deadlock sob concorrência nativa ainda precisa ser testada.

O limite de usos considera reservas pendentes/incertas e usos confirmados. Rejeição/expiração/falha oficialmente observada antes de aprovação libera a reserva; uma busca vazia ou timeout não libera uso. Estorno de compra confirmada conserva o uso histórico, evitando reciclagem de cupom por reembolso.

Chave do navegador também considera cupom. Repetição recupera a mesma tentativa, aliases e pagamento. Trocar/remover cupom de tentativa existente gera conflito, em vez de reprecificar. Recuperar compra anterior usa o cupom do snapshot do banco, mesmo depois de desativado/globalmente fechado. Nenhum retry em estado incerto habilita outro POST. A aprovação de acesso continua na reconciliação oficial da Etapa 1; não ocorre na criação do cupom ou da comissão.

## Combinações que continuam bloqueadas

- Acúmulo com “Indique e Ganhe”: para não inventar quais benefícios podem coexistir, compra com cupom é bloqueada em qualquer conta que já tenha atribuição de indicação. Esse é um bloqueio conservador temporário, inclusive para atribuição histórica; a política definitiva ainda precisa ser decidida. Compra normal sem cupom e o programa de indicação não são alterados.
- Comissão em recorrências: somente pagamentos associados à venda pré-paga pelo wrapper recebem comissão. Não se propaga atribuição a preapprovals, novas cobranças recorrentes ou renovações futuras.
- Atribuição por vídeo/campanha não foi implementada. Link e cupom só comprovam a utilização do código, não qual conteúdo provocou a compra. O painel comunica essa limitação.

## Confirmação, ajustes e repasses

Após `processApprovedPayment` concluir os controles existentes de valor/moeda, acesso e indicação, chama `affiliate_reconcile_payment`. Chargeback, reclamação e reconciliação administrativa convergem pelo mesmo processamento existente. O hook funciona também com o programa global desativado, pois desativação comercial não pode impedir ajuste de vendas históricas.

Comissão exige status aprovado e `access_applied_at` confirmado. Antes disso vale zero. Entradas imutáveis guardam deltas/revisão e a venda mantém projeção de saldo. Duplicata gera delta zero e não cria outro lançamento. Total devolvido é cumulativo e nunca diminui por resposta antiga; chargeback é persistente. Reembolso parcial reduz proporcionalmente a comissão sobre o líquido mantido, com o mesmo arredondamento. Valor de reembolso ausente em um status parcial não é tratado como zero: uma venda afiliada exige informação oficial completa e mantém erro recuperável para retry.

O campo oficial `transaction_amount_refunded` é validado na resposta do Mercado Pago. [A documentação do provedor](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/response-handling/query-results?scope=prod) confirma que um pagamento pode permanecer `approved` com detalhe `partially_refunded`; não basta olhar apenas o status para a comissão. Cancelamento antes de aprovação não gera comissão. Cancelar renovação futura sem devolver dinheiro não é tratado como estorno.

Comissões aprovadas aguardam liberação manual do admin. Liberar não transfere dinheiro. O painel diferencia pendentes, liberadas acumuladas, pagas, ajustes e saldo. Dia mensal pode ser 1–31; em mês menor a referência cai no último dia. Não é promessa de transferência automática.

O admin realiza a transferência fora do sistema e registra valor positivo, data já ocorrida e referência única da transação. A referência é texto; não há upload novo de comprovante nem URL arbitrária de documento. A chave UUID fica no navegador por afiliado até iniciar explicitamente outro registro. SQL também impede duplicata de referência (trim/case normalizados) por afiliado: duas sessões com UUIDs distintos não registram a mesma transferência duas vezes. Mesma identidade com dados diferentes produz conflito.

Repasse só cabe no saldo liberado atual, sob o mesmo lock da reconciliação. O registro é imutável e auditado; não afirma envio automático de Pix. Estorno posterior não apaga pagamento externo: reduz comissão e pode deixar saldo negativo a compensar com comissões futuras. O diagnóstico mostra esse saldo; não tentar corrigir apagando repasse ou reescrevendo histórico.

Períodos são UTC, com data final exclusiva e máximo de 366 dias por consulta. Totais de saldo são históricos, sem limite de download; vendas diárias são agregadas no banco. Vendas, lançamentos e repasses têm páginas de 20 e contagens totais explícitas. O painel mostra confirmações históricas, inclusive vendas depois estornadas; não afirma que cada confirmação representa uma assinatura ainda ativa.

## Arquivos principais

- `shared/affiliates.ts`, extensão de `shared/planDurations.ts`: schemas e cálculo.
- `server/billing/affiliates.ts`: endpoints de painel, prévia, administração, liberação e repasse; erros sanitizados e ausência de resposta não são confirmação.
- `server/billing/prepaidCheckout.ts`, `billingService.ts`, `mercadoPagoClient.ts`, `server/routers.ts`: contrato do cupom, recuperação e hook oficial de comissão.
- `AffiliatePage.tsx`, `AdminAffiliatesPage.tsx`, `App.tsx`, menus e `AdminBillingPage.tsx`: painéis e navegação.
- `PrepaidOptions.tsx`, `billing.service.ts`, `PricingPage.tsx`, `MinhaAssinaturaPage.tsx`: interface mínima no checkout atual.
- Migration/diagnóstico/rollback `202610290001_affiliate_program` e testes de API, SQL e cálculo.

## Ordem manual das migrations

1. Conferir dependências históricas de billing, fundador, capacidade, indicação e respectivas correções. Não assumir aplicação remota a partir do Git.
2. `supabase/migrations/202610280001_billing_plan_duration_configuration.sql`, se ainda ausente.
3. `supabase/migrations/202610280002_prepaid_checkout_recovery.sql`, se ainda ausente.
4. `supabase/migrations/202610290001_affiliate_program.sql`.
5. Diagnósticos somente leitura das três versões, depois de suas migrations. O diagnóstico de afiliados deve mostrar RLS ativo, nenhum acesso anon/authenticated, grants somente service_role, commercial_enabled false, ledger/projeção consistentes e saldo explícito após repasses.

Todas têm transação BEGIN/COMMIT; falha não confirma objetos parciais. Se a execução falhar, abortar a transação e investigar, sem reaplicar CREATE cegamente. O backend desta etapa depende da migration nova inclusive para processar pagamentos sem afiliado: o hook precisa existir e retorna sem efeitos quando não há venda atribuída. Portanto aplicar/verificar SQL **antes** de qualquer publicação futura do backend, mesmo com o programa fechado.

Não há SQL de ativação nesta entrega. Configurar afiliados/cupons não abre vendas. Somente depois da homologação e das decisões pendentes deve ser autorizada uma ativação explícita tanto do banco quanto do backend.

Rollback excepcional: pausar checkout com cupom e retirar backend dependente primeiro. Executar rollback 202610290001 antes de qualquer rollback da Etapa 1. Ele bloqueia se houver venda ou repasse; com histórico financeiro usar correção para frente. Sem vendas, exportar perfis/cupons/auditoria antes de remover; tabelas são novas, não remove contas nem muda papéis de profiles. Nunca executar rollback como instalação.

## Validação e pendências

Os testes novos exercitam cálculo 903 centavos do exemplo, pacote de seis meses, papéis, isolamento entre afiliados, conta sem vínculo, cupom inválido/futuro/expirado/desativado/fora de plano/limite, fundador, duas barreiras de ativação, indicação bloqueada, snapshots, recuperação, pagamento pendente, aprovação repetida, ajuste parcial, chargeback persistente, repasse simultâneo/retry/chave conflitante/referência duplicada e dívida após repasse. SQL de migração/rollback/diagnóstico roda apenas em PGlite descartável, com o schema e as migrations reais de billing; a fixture adicional de paginação representa repasses históricos após estornos.

PGlite serializa chamadas: Promise.all nesses testes **não prova MVCC nem ausência de deadlocks nativos**. Repetir em duas conexões PostgreSQL locais: mesma tentativa/cupom de último uso; dois usuários disputando limite; edição/desativação concorrente; liberação/repasse versus reembolso; dois repasses competindo pelo mesmo saldo e mesma referência. Reter a primeira transação até a segunda bloquear e conferir resultado após COMMIT/ROLLBACK.

Resultado final: **161 testes de billing aprovados, 1 teste opcional pulado, em 18 arquivos** (`tmp/affiliates-verified-tests.txt`). O teste pulado é o runner legado que depende de instalação opcional em tmp/referral-sql; os testes SQL novos executaram com o PGlite disponível no projeto. Após a última ampliação do diagnóstico, o teste SQL de afiliados foi reexecutado e aprovado. **Build cliente/servidor aprovado**, com aviso preexistente de chunks grandes. **git diff --check aprovado**, inclusive conferência de whitespace dos arquivos novos. **TypeScript mantém os mesmos 11 erros preexistentes**, nos mesmos arquivos: AdminResolutionEditorPage, exports de QuestionDifficulty e cast do parser em routers. Não houve erro novo. A suíte completa fora de billing não foi executada.

Continuam pendentes contas de homologação e sandbox para testar webhook verdadeiro, devolução parcial, chargeback, retorno tardio e experiência visual. Testes simulados não validam uma sessão real nem o comportamento visual em produção. O roteiro de PostgreSQL nativo da Etapa 1 deve ser ampliado com as disputas de cupom/repasse descritas acima; não havia PostgreSQL nativo/Docker configurado nesta máquina.

## Próxima etapa

A Etapa 3 poderá redesenhar o checkout sobre os schemas/RPCs e snapshots existentes. Não deve calcular comissão no navegador, propagar cupom para recorrências, inferir campanha de um código ou ativar combinações com indicação sem decisão explícita. Homologação da Etapa 1 continua pré-requisito; esta implementação não a substitui.
