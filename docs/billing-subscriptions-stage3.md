# Assinaturas — Etapa 3: experiência de contratação

Implementação local sobre as Etapas 1 e 2 não commitadas. Nenhum SQL remoto, commit, push, deploy ou configuração comercial foi executado. Não se presume que as migrations anteriores estejam aplicadas.

## Alterações

- PricingPage reorganiza conta → plano/prazo → pagamento → confirmação, com cards alinhados, descrição real do catálogo e cores semânticas para claro/escuro. Remove os benefícios promocionais fixos do catálogo anterior para não prometer recursos não descritos no plano.
- Pacotes pré-pagos aparecem primeiro. Recorrência, Pix mensal e contingência manual permanecem em seção expansível separada, com os mesmos serviços e permissões. Nenhum plano, preço ou desconto foi criado.
- PrepaidOptions mostra apenas períodos retornados pelo servidor, resumo em centavos formatado, indicação ou cupom validado, aplicar/remover cupom e mensagens de erro. Código preenchido por URL não é cupom validado. Respostas tardias são invalidadas quando código, prazo, plano ou identidade mudam.
- Recuperação continua disponível independentemente da disponibilidade da oferta. Não modifica a identidade persistente nem o snapshot de compras existentes. Tentativa incerta não autoriza outra cobrança.
- Login e cadastro aceitam retorno exclusivamente para /planos, preservando seus parâmetros. Login comum mantém /plataforma. Cadastro existente é reutilizado; conta já autenticada não precisa se cadastrar novamente. Destinos externos/admin são recusados.
- Fundador continua visível com explicação e compra desabilitada quando inelegível; o servidor permanece responsável pela verificação. Cupons não ativam o programa comercial e a combinação com indicação permanece bloqueada.

## Validação

174 testes aprovados e 1 opcional pulado em billing (20 arquivos). Incluem os testes anteriores de fundador, indicação, autorização, preços, pagamento e recuperação; 7 novos testes de retorno seguro e 6 de apresentação React renderizada com dados simulados. Após o último ajuste, 23 testes relacionados à apresentação/fundador/indicação reexecutados e aprovados. Testes antigos que dependiam de texto da tela foram atualizados para o layout novo.

Build cliente/servidor aprovado, com aviso existente de chunks grandes. git diff --check aprovado. TypeScript mantém os 11 erros documentados anteriormente em AdminResolutionEditorPage, exports QuestionDifficulty e cast do parser em routers; sem novo erro observado.

Renderização estática de React não prova comportamento interativo de teclado, responsividade ou aparência em navegador. A tentativa de abrir /planos no navegador local confirmou um bloqueio antes de montar a aplicação: “As variáveis do Supabase não foram configuradas”, em client/src/lib/supabase.ts. Não foi concluída validação visual, autenticada ou anônima, nem interação com contas reais. Nenhuma credencial de produção foi usada para contornar esse bloqueio. Os formulários existentes de login/cadastro preservam seus campos e ações e passaram a usar tokens de tema, assim como a tela de planos e o seletor. A recuperação e a prévia de cupom também ignoram respostas de outra identidade após troca de conta.

## Como revisar e pendências

Com o ambiente local configurado, abrir /planos no servidor de desenvolvimento (127.0.0.1:5195 nesta sessão). Conferir 390px e 1440px, claro/escuro, Tab/Shift+Tab/Enter e abrir as seções com teclado. Verificar conta anônima, aluno autenticado, fundador elegível/inelegível, indicação, cupom fechado, falha de consulta e recuperar compra após refresh. Conferir visualmente os formulários existentes de conta e os modais de pagamento antes da publicação.

PostgreSQL nativo com conexões independentes, Supabase de homologação, Mercado Pago sandbox, aprovação, webhook, estorno e chargeback reais continuam pendentes. PGlite e mocks não comprovam MVCC nem homologação financeira. Nenhum teste real foi declarado aprovado.

## SQL e publicação

Nenhuma migration nova nesta etapa. A sequência anterior continua: 202610280001_billing_plan_duration_configuration.sql → 202610280002_prepaid_checkout_recovery.sql → 202610290001_affiliate_program.sql, somente as ausentes, após diagnóstico manual no ambiente de destino. Executar os diagnósticos correspondentes depois. Não reaplicar automaticamente nem usar rollbacks como instalação. Publicação continua dependente da homologação anterior e da revisão visual/interativa indicada acima.

## Prévia visual isolada (continuação)

Disponível em tools/billing-preview; instruções no README desse diretório. URL local http://127.0.0.1:5197/planos. Usa componentes reais, com configuração Vite separada, mocks de auth/billing/tRPC e bloqueio CSP de conexões externas. Não carrega .env e não entra no build de produção. Não requer migration.

Verificação em navegador com dados simulados: desktop 1440px e celular 390px sem overflow nas telas observadas, claro/escuro, cupom, prazo por Enter, Tab entre campos, login fictício, fundador elegível e bloqueado, erro/carregamento e recuperação incerta. Capturas locais em tmp/billing-preview. Cenários recarregam o documento; não representam persistência real de uma compra. Foi observado aviso preexistente de anchors aninhados no PublicHeader; alterações compartilhadas foram evitadas nesta tarefa. As homologações reais permanecem pendentes.
