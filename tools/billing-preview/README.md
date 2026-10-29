# Prévia local isolada da Etapa 3

Executar na raiz do repositório:

    node node_modules/vite/bin/vite.js --config tools/billing-preview/vite.config.ts

Abrir http://127.0.0.1:5197/planos . Se a porta estiver ocupada, encerrar apenas a instância desta prévia; strictPort impede trocar a URL silenciosamente.

Usa PricingPage, PrepaidOptions, LoginPage, RegisterPage, PublicHeader e o CSS reais. A configuração Vite exclusiva substitui serviços de billing, autenticação, tRPC e dica de indicação por mocks em memória. Nenhum arquivo do aplicativo de produção foi modificado para montar a prévia. A fixture não é importada pelo App nem pelo entrypoint de produção.

Sem arquivo .env, sem credenciais e sem Supabase. envDir=false impede carregar arquivos de ambiente. CSP impede conexões externas, submissão nativa de formulários e frames externos. Servidor vinculado apenas a 127.0.0.1. Ações de compra são interceptadas e retornam uma mensagem, nunca uma URL de checkout. Não informar dados reais nos formulários.

## Controles

- Perfil: sem login, aluno normal, fundador elegível, não elegível e indicação.
- Estado: disponível, sessão carregando, preços carregando, erro, oferta desativada, erro de catálogo.
- Cupom: disponível ou programa fechado; usar VETOR para sucesso, outro código para inválido.
- Recuperação: pendente, incerta, aprovada ou encerrada.
- Tema claro/escuro; celular em iframe de 390px (usa media queries reais), ou redimensionar o navegador.
- Links de login/cadastro abrem os formulários reais. Login aceita valores fictícios e conecta apenas a sessão em memória. Cadastro não grava uma conta.
- Cada mudança de cenário remonta a tela para limpar estados anteriores. Refresh reinicia a simulação; não é teste da persistência real da compra.

Todos os valores, nomes do catálogo de exemplo, descontos e habilitação de 1/2/3/6/12 meses são fictícios; não representam a configuração comercial. O cálculo local serve só à fixture; a aplicação real continua usando o backend.

## Verificações executadas no navegador

Desktop 1440px e celular 390px, tema claro e escuro; screenshots em tmp/billing-preview.
Sem overflow horizontal observado nas telas de planos e cadastro em 390px.
Seleção de 2 meses com Enter, e Tab do email para senha no login.
Login com aluno@example.invalid e senha fictícia retornou aos planos.
Fundador elegível disponibilizou os períodos; não elegível permaneceu bloqueado.
Cupom VETOR em 6 meses mostrou 71,40 - 3,57 - 3,39 = 64,44, apenas exemplo.
Remoção, cupom indisponível, carregamento, falha de preços e recuperação incerta verificados.
Pagamento Pix simulado retornou mensagem explícita sem cobrança.
Cadastro foi aberto e inspecionado, sem enviar consentimento.
O console identificou aviso preexistente de links aninhados em PublicHeader (Link envolvendo a). Esta prévia não modifica esse componente compartilhado.

## Pendências reais

Não homologa autenticação, catálogo ou elegibilidade do Supabase, snapshot/idempotência, refresh real da tentativa, Mercado Pago, webhooks, pagamentos, devoluções ou MVCC nativo. A revisão por teclado foi pontual; não equivale a auditoria completa de acessibilidade. Dados simulados não demonstram que o backend aceita os mesmos valores. Não foi executado SQL remoto, commit, push ou deploy.
