# Painel de afiliados: experiência e navegação

## Investigação no HEAD e escopo
Base: `9b72bab6e43e5d6407bc12d8cbdfad2e5d5c974a`, branch `integracao-pr68-pr69-v2`. Inicialmente só havia anexos locais não versionados. Referência: vídeo local `317800.mp4`, 6,97 segundos; quadros no início/meio/final mostram painel modular, cards de destaque e navegação compacta. Composição adaptada aos tokens azuis do Vetor, sem marca ou dados comerciais da referência.

Componentes reais: `AffiliatePage` monta `CommerceHeader`, `useAffiliateReport`, `ReportState` e `AffiliateReport`. `AdminAffiliatesPage` mantém `AdminGuard` (somente admin), `AdminLayout` e `AdminAffiliateDashboard`; este reutiliza filtro e relatório, preservando formulários e ações financeiras.

## Navegação e acesso
- Entrada existente: menu da plataforma → Indique e Ganhe (`/indique-e-ganhe`, conforme rota existente) → link `/afiliados` em `ReferralPage`. O link existente ganhou apresentação de card. O mesmo menu de conta autenticada em LandingPage agora oferece também acesso direto ao painel, sem novo menu ou consulta global. O atalho não concede acesso a dados: o servidor continua exigindo vínculo e autorização.
- `/afiliados` exige sessão confirmada no hook existente; login preserva retorno fixo `/afiliados`. Cabeçalho mantém identidade e tema. Nova ação superior `Voltar à plataforma` usa `/plataforma`, rota existente com seus próprios controles de acesso.
- Endpoint `affiliates.dashboard` usa `protectedProcedure`, identidade do contexto e RPC `affiliate_dashboard`. O SQL exige perfil ativo, encontra `affiliate_profiles.user_id` e só permite assunto diferente ao admin. Editor e aluno afiliado consultam somente a própria conta. Editor sem vínculo recebe affiliate nulo; aluno sem vínculo recebe FORBIDDEN. A interface trata ambos sem fabricar vínculo ou valores.
- Afiliado desativado conserva histórico; checkout exige vínculo ativo. Admin conserva consulta de terceiros e mutações administrativas; editor continua impedido de buscar contas, editar cupons, liberar comissões ou registrar repasses. Nenhuma alteração de autorização/backend nesta entrega.

## Design e dados reais
- Cards alinhados: saldo disponível = releasedCents - paidCents (pode ser negativo após reversões; não é truncado), comissões aguardando, repasses externos, liberadas acumuladas e reduções por estorno. Todos históricos.
- Saudação usa apenas label do afiliado já autorizado. Data de referência em pt-BR, explicitamente sem garantia de pagamento nem transferência automática.
- Abas, contornos, sombras leves e ícones Lucide existentes. Tokens bg-card, foreground, muted-foreground, primary, border nos dois temas; sem alteração global de CSS. Spinner respeita reduced motion.
- Gráfico Recharts existente agora alterna contagem de confirmações e valor líquido por dia UTC. Ambos usam `salesByDay` da mesma resposta, e a tabela acessível usa os mesmos registros. Não se criou métrica de comissão ou crescimento.
- `periodConfirmedSales` conta vendas aprovadas pela data confirmed_at; inclui vendas posteriormente estornadas. `periodNetCents` e sold_cents somam paid_cents - refunded_cents; não são comissão e seguem exatamente o SQL existente (inclusive seu tratamento atual de chargeback). A UI explica essa definição; não recalcula contabilidade.
- Cupons mostram código, estado cadastral separado do fechamento comercial, percentuais, validade UTC com hora, limite global e restrição a planos sem expor IDs. Copiar código/link conserva try/catch e confirmação role=status. `/planos?cupom=...` só preenche, não valida nem atribui visitas.
- Vendas não mostram compradores ou UUIDs. API projeta criação, valores, estornos, aprovação/liberação/contestação; lista filtrada por created_at UTC. Repasses e lançamentos contábeis são históricos e paginados; ajustes têm sinais e descrição. Paginação existente de 20 por lista foi preservada.
- Erro temporário agora tem explicação própria, diferente de ausência de autorização. Nenhum zero é desenhado quando a consulta falha.

## Datas
`affiliatePeriod.ts` centraliza dias UTC, atalhos mês atual (até hoje), mês anterior e últimos 30 dias incluindo hoje, formato brasileiro e validação de até 366 dias. Datas editadas só são aplicadas pelo botão. Data final exibida é inclusiva; consulta envia o dia UTC seguinte como limite exclusivo. Mesma regra vale no relatório compartilhado do admin. Viradas de ano/mês, ano bissexto, intervalo invertido, vazio e datas impossíveis têm testes. Saldos, cupons, repasses e ajustes não são filtrados; interface informa isso explicitamente. A mudança não converte para horário de Brasília, preservando a semântica UTC do servidor.

## Informações não disponíveis
A projeção de vendas não fornece código de cupom nem plano/prazo. API não retorna total por cupom nem série confiável de comissão gerada no período. Não foram derivados da página parcial de 20 linhas nem inventados. Essas melhorias exigem extensão autorizada da consulta. IDs de planos restritos não são apresentados ao afiliado; rótulos de planos exigiriam projeção adicional segura.

## Configuração e preservação
Código mantém dupla trava: affiliate_settings.commercial_enabled e AFFILIATE_CHECKOUT_ENABLED. A configuração remota não foi consultada nesta tarefa; último diagnóstico fornecido pelo usuário indicava false. A prévia usa programa fechado por padrão. Nenhum cupom foi ativado, nenhum dado real alterado, nenhum pagamento criado. Cálculos, snapshots, indicação, fundador, checkout, ledger, liberações e repasses não foram modificados. Nenhuma migration nova é necessária. Nenhum SQL remoto, commit, push ou deploy realizado.

## Validação
- Suite billing: 186 testes aprovados, 1 opcional ignorado; 23 arquivos aprovados, 1 ignorado. Inclui 4 novos testes de datas UTC; autorização por papéis, isolamento de outro afiliado, privacidade, paginação, estados comerciais e financeiro já cobertos nos testes existentes. Logs `tmp/affiliate-panel/tests.txt`.
- Build cliente/servidor aprovado; advertência existente de chunks grandes. Log `tmp/affiliate-panel/build.txt`.
- TypeScript: mesmos 11 erros preexistentes em AdminResolutionEditorPage, QuestionDifficulty e cast em server/routers.ts, sem erros novos nos arquivos alterados. Log `tmp/affiliate-panel/types.txt`.
- git diff --check aprovado.
- Prévia isolada `http://127.0.0.1:5197/afiliados`: componentes reais com mocks, sem credenciais/serviços. Conferidos desktop, 390px, temas claro/escuro, ausência de overflow, atalhos, estados sem vínculo/sem vendas/desativado/erro, cópia com sucesso, Tab entre botões. Admin conserva botões de criar/editar/repasse no componente real. A prévia não reproduz o guard/layout administrativos externos nem autenticação real. Capturas em `tmp/affiliate-panel/`.
- Falha de clipboard mantém tratamento no código, mas não foi forçada no navegador nesta execução. Carregamento da sessão deve continuar sendo validado com provedor real; spinner do relatório e erro foram revisados no código. A consulta mock não filtra dados financeiros ao trocar datas: conversão foi testada em unidade e regras SQL revistas; homologação real do intervalo ainda pendente.
- Retorno `/plataforma` e entrada via ReferralPage conferidos no código; fixture não monta a plataforma completa. Validação autenticada ponta a ponta dessas rotas ainda pendente.
- Nenhum teste PGlite foi apresentado como concorrência MVCC nativa. Permanecem pendentes PostgreSQL nativo com conexões independentes, Supabase de homologação e Mercado Pago sandbox, incluindo aprovação, retorno tardio e reversões reais. Esta entrega visual não homologa pagamentos nem autoriza abertura comercial.

## Arquivos
`AffiliatePage.tsx` (composição/retorno), `ReferralPage.tsx` (entrada existente), `LandingPage.tsx` (atalho no menu autenticado), `AffiliateReport.tsx` (cards/gráfico/cupons/históricos), `ReportState.tsx` (filtro/estados), `affiliatePeriod.ts` (datas), `affiliatePeriod.test.ts` (regressões) e este relatório. Componentes compartilhados afetam visualmente o relatório administrativo, conservando todas as ações.
