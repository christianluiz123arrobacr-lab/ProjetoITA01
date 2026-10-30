# Homologação da Etapa 1 — 28/10/2026

## Resultado e evidência de ambiente

**Não aprovada para publicação em produção.** Nesta sessão foram verificados PATH e locais usuais de instalação: psql, postgres, pg_ctl, Docker, Podman e Supabase CLI não foram localizados. Não há BILLING_SQL_TEST_DATABASE_URL configurada. Assim, o roteiro `prepaid-native-concurrency.md` não foi executado com conexões nativas independentes.

O repositório tem somente `.env.example`; não há arquivo `.env` local. SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, MERCADO_PAGO_ACCESS_TOKEN e MERCADO_PAGO_WEBHOOK_SECRET não estão configuradas no processo. Foram conferidas somente presença/ausência, sem imprimir credenciais. Nenhum serviço remoto foi acessado para testes, nenhuma cobrança foi criada e nenhum SQL remoto foi executado.

Não foi possível autenticar os perfis de aluno/fundador nem executar validação visual real de ofertas, refresh e tentativa incerta. A revisão do componente e seus controles não substitui esse teste. Nenhum resultado com mocks é apresentado como aprovação de sessão real.

## Verificações locais

Reexecutado `node node_modules/vitest/vitest.mjs run server/billing --maxWorkers=2 --minWorkers=2 --silent`: **145 testes aprovados, 1 pulado, 15 arquivos**. O resultado fica registrado em `tmp/prepaid-homologation-tests.txt`. A suíte cobre preço, fundador, indicação, concorrência simulada, fronteiras de falha e SQL real em PGlite; continua sem prova MVCC nativa ou integração real do provedor. Após consolidar o diagnóstico de investigação, foi reexecutado `prepaidRecoverySql.test.ts`: **1 teste aprovado**, incluindo execução dos dois diagnósticos no banco local descartável. `git diff --check` aprovado.

O build e TypeScript da implementação anterior estão documentados no relatório principal; nesta revisão de ambiente foram alterados documentos, SQL de diagnóstico somente leitura e o teste que valida os diagnósticos. O código de produção não foi alterado. Não se declara novo build por executar apenas testes/documentação.

## Preparação do PostgreSQL local

1. Disponibilizar servidor PostgreSQL nativo e ferramentas psql/pg_ctl no PATH, ou Supabase CLI com Docker funcionando. Criar banco **descartável e local**, sem copiar dados pessoais de produção.
2. Instalar o schema do projeto com suas dependências: profiles/auth, billing, fundador, capacidade e indicação, antes das migrations desta etapa. O bootstrap mínimo de `server/billing/tests/referralBootstrap.sql` é fixture para banco descartável; não deve ser aplicado em Supabase remoto nem produção. As dependências efetivas usadas pelo teste podem ser conferidas em `prepaidRecoverySql.test.ts`.
3. Aplicar 001 e 002 em seguida, em transações próprias. Configurar `BILLING_SQL_TEST_DATABASE_URL` apenas no ambiente local, apontando para loopback. Não colocar URL/senha no chat ou em arquivos rastreados.
4. Abrir dois terminais psql no mesmo banco e executar `docs/prepaid-native-concurrency.md`. Registrar quem bloqueou, quem confirmou, payment_id, quantidades, revisões e duração dos locks. Para disputa de última vaga, usar dois usuários sintéticos e plano com uma vaga; exatamente um deve conseguir reservar. Para disputa de configuração, manter transação de edição aberta e verificar que a preparação espera e usa uma revisão confirmada, sem misturar preço e desconto.
5. Para as verificações nativas já existentes, `npm run test:billing:sql` exige banco preparado e psql; esse comando não substitui os testes específicos com duas conexões do roteiro.

## Preparação de homologação Supabase / Mercado Pago

1. O proprietário deve identificar um projeto Supabase isolado de teste. A existência de uma URL ou token não basta para autorizar seu uso como homologação. Não reutilizar o projeto, usuários ou credenciais de produção.
2. Aplicar **manualmente nesse projeto de teste**, após conferir as migrations históricas exigidas:
   - `supabase/migrations/202610280001_billing_plan_duration_configuration.sql`, somente se ainda não aplicada;
   - `supabase/migrations/202610280002_prepaid_checkout_recovery.sql`.
3. Executar manualmente os diagnósticos 001 e 002, nessa ordem, **depois** das migrations. A consulta de contagem do diagnóstico 002 depende das tabelas novas. Não rodar rollback para instalar nada. Se já houver objetos, diagnosticar em vez de repetir CREATE ou apagar dados.
4. Configurar localmente as variáveis da instância de teste: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY e VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY do mesmo projeto; BILLING_MODE=mercadopago; MERCADO_PAGO_ACCESS_TOKEN e MERCADO_PAGO_WEBHOOK_SECRET exclusivos da integração de teste; APP_BASE_URL da instância de teste. Chave service_role e token Mercado Pago ficam só no backend. Não copiar valores para mensagens, logs, Git ou variáveis VITE.
5. No Mercado Pago, usar aplicação/contas e credenciais de teste com comprador de teste. Confirmar no painel que a operação específica é suportada no ambiente de teste. Se Pix, estorno ou chargeback não forem suportados nessa modalidade, marcar pendente; não pagar Pix real para contornar essa limitação. Não aceitar apenas prefixo do token como prova de que uma operação não movimentará dinheiro real.
6. Para receber notificações reais do sandbox, disponibilizar URL HTTPS de teste acessível ao provedor. APP_BASE_URL gera `/api/mercadopago/webhook` e retorno `/assinatura-pendente`. Configurar a assinatura do webhook correspondente à aplicação de teste. O token opcional de URL não substitui a assinatura exigida pelo fluxo. Não usar a URL pública de produção.
7. O comando local em PowerShell pode ser iniciado com `$env:NODE_ENV='development'` e depois `node node_modules/tsx/dist/cli.mjs server/_core/index.ts`; o projeto usa PORT (padrão 3000). Configurar os segredos pelo mecanismo local privado escolhido, com arquivo ignorado ou variáveis de ambiente. Esta sessão não criou configuração nem iniciou servidor com credenciais reais.

## Matriz visual e financeira a executar

Criar contas fictícias pelo fluxo de cadastro do ambiente isolado: aluno comum; fundador com entitlement/convite válido; aluno sem entitlement/convite. Usar um administrador de teste para configurar planos e períodos. Não conceder fundador alterando contas reais.

| Cenário | Conferência obrigatória | Executado com serviços reais? |
|---|---|---|
| Aluno comum | Somente períodos habilitados; desconto/total em centavos; tentar período desativado diretamente deve falhar | Não |
| Fundador elegível / não elegível | Permitir somente conta autorizada; nenhuma cobrança no perfil não elegível | Não |
| Indicação | Base após desconto de duração; claim e campanha corretos; recompensa somente depois de acesso aplicado | Não |
| Refresh / outro dispositivo | Recuperar mesma tentativa, payment_id e referência, inclusive após desativar duração ou esgotar vaga | Não |
| Pendência / timeout / retorno tardio | Uma submissão, GETs de recuperação; busca vazia exibe incerteza sem habilitar cobrança nova | Não |
| Aprovação / webhook repetido / reconciliação | Valor/moeda/referência local iguais ao detalhe oficial; período e reward não duplicados | Não |
| Estorno / chargeback | Recalcular ledger e revogar recompensa correspondente, sem apagar histórico ou acesso de outra compra | Não |
| Edição concorrente / última vaga | Duas conexões PostgreSQL independentes; revisão e capacidade corretas, sem deadlock | Não |

Quando houver operação suportada no sandbox, registrar identificadores sintéticos, valor em centavos, estados, quantidade de POSTs, período antes/depois e contagem de recompensa. Não anexar tokens, CPF, dados de cartão, email ou respostas integrais do provedor ao relatório.

## Investigação de tentativa incerta

1. Manter a tentativa, aliases, payment_id e snapshot. Não apagar, não alterar submitted para prepared e não gerar outra cobrança porque a busca retornou vazia.
2. Pela opção “Recuperar compra anterior”, repetir a consulta da mesma tentativa. Se a resposta anterior foi perdida, uma busca oficial pode localizar o recurso e completar o resultado persistido.
3. O operador autorizado pode usar o diagnóstico somente leitura para obter estado, referência, ID de recurso já persistido e valor. Confrontar com o recurso oficial no ambiente correto do Mercado Pago. Verificar unicidade, moeda e total antes de reconciliar pelo fluxo administrativo existente.
4. Resultado múltiplo, divergência, indisponibilidade ou ausência não comprovada mantém bloqueio. Uma queda após claim e antes do POST é indistinguível de envio com resposta perdida: não há liberação automática segura. Preferência sem ID e com mais de 90 dias pode exigir suporte do Mercado Pago.
5. Reembolso/chargeback e aprovação devem passar pela reconciliação oficial e ledger, sem UPDATE manual de acesso/reward. Se o suporte não conseguir provar o desfecho, manter pendente e investigar; não inventar pagamento aprovado ou cancelado.

## Ordem consolidada

Pré-requisitos históricos → migration 001 (se ausente) → migration 002 → diagnóstico 001 → diagnóstico 002 → homologação nativa/visual/sandbox → decisão de publicação. Rollbacks são operações excepcionais em ordem inversa; 002 recusa remoção com tentativas/pagamentos novos. Nenhuma dessas etapas remotas foi executada pelo agente.
