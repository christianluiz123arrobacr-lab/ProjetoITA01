# Preparação de publicação — Etapas 1, 2 e 3

## Estado local

Branch verificada: integracao-pr68-pr69-v2. HEAD e37b4dcc1265acc397f00ae117301a0db746e21d. Origin: christianluiz123arrobacr-lab/ProjetoITA01. As referências locais HEAD/origin estavam 0/0; isso não confirma o remoto atual porque não houve fetch nesta preparação. Staging vazio. As três etapas continuam modificações locais; anexos .codex-remote-attachments não fazem parte da entrega. tools/billing-preview é uma prévia separada e não é importada pelo aplicativo.

Nenhum SQL remoto, variável remota, commit, push ou deploy foi executado nesta preparação. Aprovação visual da prévia não homologa pagamentos ou concorrência.

## Primeiro: diagnóstico sem alterações

No SQL Editor do projeto Supabase que será usado na publicação, abrir uma consulta nova e colar integralmente:

`supabase/diagnostics/202610290002_billing_stages_publication_preflight.sql`

Executar apenas esse diagnóstico e enviar o JSON da coluna publication_diagnostic (copiar célula ou exportar o resultado). Ele consulta catálogos, não lê cadastros ou pagamentos e funciona com tabelas das etapas ausentes. Não executa as funções de billing. Não é migration nem registra uma migration como aplicada.

O resultado lista tabelas, colunas/tipos, constraints/índices, RLS, grants e assinaturas das funções de dependência. Para 11 funções das etapas compara um hash do corpo, normalizando somente espaços, com os arquivos locais. Também mostra se a tabela de histórico do Supabase existe, mas não usa esse histórico para presumir instalação manual. Hash idêntico não comprova todo o contrato: conferir também permissões, assinatura, security definer e search_path. Diferença pode ser uma edição legítima ou versão antiga; exige revisão, nunca reaplicação cega.

Decidir somente depois do resultado:

- Objetos completos, corpos compatíveis e permissões corretas: não reaplicar a migration.
- Etapa totalmente ausente e dependências presentes: candidata a aplicar, após a revisão do resultado.
- Etapa parcial, corpo divergente, tipo/constraint diferente, grant ao navegador ou dependência ausente: parar e preparar diagnóstico/correção específica. Não apagar tabelas, não executar rollback e não reaplicar CREATE para tentar resolver.

## Ordem condicional das migrations

Somente as que forem confirmadas como ausentes, nesta ordem:

1. 202610280001_billing_plan_duration_configuration.sql
2. 202610280002_prepaid_checkout_recovery.sql
3. 202610290001_affiliate_program.sql

Etapa 3 não tem migration. Dependências históricas de billing, capacidade, fundador/convites e indicação devem ser verificadas antes. Não presumir a aplicação pelos relatos anteriores ou pelo nome do arquivo. Cada migration usa BEGIN/COMMIT; em falha, abortar a transação e investigar antes de qualquer tentativa adicional. Rollbacks não fazem parte da instalação.

## Depois da aplicação manual

Reexecutar o preflight e conferir ausência de objetos faltantes/divergentes. Somente quando as três etapas estiverem presentes, rodar os diagnósticos existentes, completos:

1. supabase/diagnostics/202610280001_billing_plan_duration_configuration.sql
2. supabase/diagnostics/202610280002_prepaid_checkout_recovery.sql
3. supabase/diagnostics/202610290001_affiliate_program.sql

Esses diagnósticos contêm consultas a tabelas reais e não devem ser executados antes da instalação correspondente. O último mostra commercial_enabled: exigir false. Se vier true, parar e reportar; esta preparação não autoriza mudança remota. Conferir também no ambiente do backend que AFFILIATE_CHECKOUT_ENABLED está ausente/false; .env.example=false só documenta o padrão e não comprova a configuração na Vercel. Não habilitar cupons comerciais, novos períodos ou descontos como parte do deploy.

Esperado: RLS ativo nas novas tabelas; anon/authenticated/PUBLIC sem grants de leitura/escrita ou execução das novas RPCs; somente service_role além do proprietário nas funções; corpos compatíveis; ledger de comissões sem divergências. Investigar tentativas submetidas/incertas preservando IDs, aliases e snapshots; busca vazia não autoriza nova cobrança. Resultados de diagnóstico financeiro devem ser tratados como operacionais, sem publicação pública.

## Ordem de publicação futura (ainda não autorizada)

1. Homologar no ambiente de teste antes de produção. Planejar pausa de novas compras enquanto SQL e versão são trocados; não interromper deliberadamente a confirmação/reconciliação de pagamentos existentes.
2. Confirmar dependências/diagnóstico; aplicar manualmente apenas SQL ausente. SQL deve preceder o backend: o hook de comissão depende da função nova mesmo com o programa de afiliados fechado.
3. Verificar os diagnósticos e os dois bloqueios comerciais. Não voltar ao código antigo de criação de pacotes quando já existirem tentativas novas.
4. Publicar backend e frontend juntos na mesma versão, pelo fluxo existente da Vercel, após nova autorização. Se houver separação técnica, backend compatível primeiro e frontend logo depois, mantendo novas compras pausadas no intervalo. Não publicar o frontend que usa RPCs inexistentes.
5. Confirmar SHA, build, Ready e URL do deployment. Recarregar abas antigas e verificar os fluxos com contas autorizadas de teste. Só retomar compras após a verificação; não confundir push com deploy aprovado.

Não abrir vendas de afiliados nesta publicação. Não ativar configuração comercial só para testar cupom. Testes de pagamento só com ambiente e credenciais de teste explicitamente configurados; não usar produção para homologação.

## Pendências antes da aprovação de produção

- PostgreSQL nativo com duas conexões: mesma compra, última vaga, limite de cupom, configuração concorrente e repasse versus estorno. PGlite não comprova MVCC.
- Supabase de homologação: RLS/grants, perfis reais e recuperação em abas/dispositivos.
- Mercado Pago sandbox: valor local versus oficial, envio aceito com resposta perdida, resposta tardia, aprovação/pendência/rejeição, webhook e reconciliação duplicados, estorno parcial/total e chargeback; acesso/recompensa/comissão uma única vez.
- Fluxo completo com autenticação real, refresh e oferta desativada. A prévia aprovada usa dados e ações simulados.

Nenhum desses testes reais foi declarado aprovado por esta preparação.

## Resultado enviado pelo usuário — preflight

As 10 tabelas das etapas estão presentes com RLS, índices listados válidos e 11 corpos de função compatíveis com os arquivos locais. Dependências listadas presentes. Não reaplicar as três migrations. Ausência da tabela de histórico não invalida instalação manual.

Bloqueio confirmado: apply_approved_prepaid_payment e recalculate_mercadopago_access_after_reversal têm EXECUTE explícito para anon e authenticated. Ambas são SECURITY DEFINER; a função de reversão escreve estado financeiro sem revalidar identidade chamadora. CREATE OR REPLACE conserva ACL anterior, e revogar PUBLIC não remove grants explícitos de anon/authenticated. Não foi feita chamada exploratória dessas funções nem alteração remota.

As tabelas novas também mostram permissões de escrita de service_role além do SELECT previsto nos arquivos. Isso não é grant ao navegador, mas deve ser considerado na revisão de privilégio mínimo.

Próximo passo: diagnóstico somente leitura 202610290003_billing_effective_permissions.sql. Verificar permissões efetivas das funções internas de dependência e commercial_enabled antes de preparar correção manual específica. Não publicar até corrigir o bloqueio; não restaurar esses grants ao navegador como solução de compatibilidade. Nenhum SQL corretivo foi executado.

## Complemento das imagens e correção local preparada

As imagens mostram anon_can_execute=true nas cinco rotinas SECURITY DEFINER de aplicar pagamento comum/pré-pago, reconstruir ledger, registrar reversão e reservar checkout. Os helpers de data/lock também são públicos, mas são SECURITY INVOKER e não foram incluídos nesta correção: não confundir uma função pura com uma rotina financeira privilegiada.

Correção manual nova: supabase/migrations/202610290004_restrict_internal_billing_execution.sql, DEPOIS das três migrations já instaladas. Revoga PUBLIC/anon/authenticated dessas cinco assinaturas e conserva EXECUTE para service_role. Não altera corpos, dados, preços nem ativação comercial. Confirma privilégios efetivos e aborta a transação se herança de papel ainda der acesso ao navegador. Não desfazer essa correção reabrindo execução pública; eventual falha exige correção para frente.

Depois da aplicação manual, reexecutar supabase/diagnostics/202610290003_billing_effective_permissions.sql. Para as cinco rotinas: anon=false, authenticated=false e service=true. O resultado de affiliate_settings não foi mostrado nas imagens: ainda confirmar commercial_enabled=false. Também falta verificar o gate da Vercel, sem alterar variável nesta tarefa.

Teste local PGlite: emula grants explícitos legados, aplica a correção duas vezes, testa chamadas diretas recusadas para anon/authenticated nas cinco funções, confere service_role autorizado e corpos preservados. Testes SQL de pré-pago/afiliados anteriores também passaram: 3 arquivos/3 testes. Isso não é homologação MVCC nativa nem sandbox. git diff --check aprovado. Sem alterações de código de runtime nesta correção, não houve necessidade de repetir build do frontend. Nenhum SQL remoto foi executado.

## Autorização de envio e validação final

O usuário autorizou explicitamente commit e push para origin/integracao-pr68-pr69-v2, ciente de que o push pode acionar a integração Vercel antes da homologação real. Homologação nativa/sandbox continua pendente; não é declarada aprovação financeira. O usuário confirmou commercial_enabled=false e as permissões corrigidas pelos resultados manuais. Nenhum SQL remoto ou variável remota foi alterado pelo agente.

Após fetch, HEAD e a branch remota estavam alinhados. Validação final: 177 testes aprovados, 1 opcional pulado em 22 arquivos; build cliente/servidor aprovado; mesmos 11 erros TypeScript preexistentes, sem erro novo; diff check aprovado. Prévia isolada não foi encontrada no JavaScript de produção. Anexos e arquivos temporários excluídos do staging.
