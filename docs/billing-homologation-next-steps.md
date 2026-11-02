# Próximo passo: ambientes reais de teste

As permissões corrigidas e commercial_enabled=false foram confirmados pelo usuário por resultados manuais. Nenhum ambiente remoto foi acessado pelo agente. A aprovação da prévia não valida pagamentos.

## Verificação local nesta continuação

Não existe .env local, somente .env.example. As variáveis de Supabase, Mercado Pago, APP_BASE_URL e BILLING_SQL_TEST_DATABASE_URL estão ausentes no processo; foram verificadas sem imprimir valores. psql/postgres/Docker/Podman/Supabase CLI não foram encontrados no PATH. Assim, ainda não se pode iniciar homologação real nem concorrência nativa.

## Preparação em sequência

1. Identificar um projeto Supabase separado para testes. Se não existir, o proprietário precisa criá-lo. Não usar o projeto atual de produção nem clonar dados pessoais reais. Informar apenas se o ambiente existe; não enviar segredos pelo chat.
2. Confirmar o schema instalado nesse projeto de teste com o diagnóstico publication_preflight. Um projeto vazio exige também o schema e dependências históricas; as quatro migrations recentes não constituem instalação completa. Não aplicar referralBootstrap.sql em Supabase remoto: é fixture local simplificada.
3. Depois da análise do diagnóstico do projeto de teste, aplicar manualmente somente os SQLs ausentes. Ordem recente: 202610280001 → 202610280002 → 202610290001 → 202610290004. Os números 002/003 de 29/10 são diagnósticos, não migrations. Repetir diagnósticos e confirmar as permissões e commercial_enabled=false no projeto de teste, independentemente do resultado no outro projeto.
4. Identificar a aplicação e os recursos de teste do Mercado Pago. Confirmar ambiente, credenciais e contas sintéticas para o fluxo usado antes de qualquer solicitação de pagamento. Prefixo de token sozinho não prova segurança. Nunca usar cartão ou Pix real para contornar limitações do sandbox.
5. Configurar os segredos do projeto isolado diretamente no ambiente local privado e ignorado pelo Git. SUPABASE_URL e VITE_SUPABASE_URL precisam apontar ao mesmo projeto de teste. Service role e token Mercado Pago ficam só no servidor. Manter AFFILIATE_CHECKOUT_ENABLED=false e MANUAL_PIX_FALLBACK_ENABLED=false. Não colar chaves no chat.
6. Disponibilizar somente a instância de teste em HTTPS para webhook, se autorizado posteriormente. Não publicar nem alterar a Vercel nesta preparação. Nenhum endpoint de produção deve ser usado como retorno/notificação de homologação.
7. Criar perfis fictícios no ambiente de teste e executar primeiro consulta de catálogo/login sem cobrança; depois uma compra suportada no sandbox. Registrar total, referência, tentativa, aprovação, webhook repetido, recuperação e efeito único no acesso/recompensa. Recursos não suportados no sandbox permanecem pendentes, especialmente Pix, estorno ou chargeback conforme a modalidade.
8. Concorrência nativa deve ocorrer separadamente em banco PostgreSQL local descartável, com duas conexões, conforme prepaid-native-concurrency.md e as disputas de cupom/repasse no relatório da Etapa 2. Não usar produção. Não apresentar PGlite como prova MVCC.

Nenhum SQL remoto, cobrança, commit, push ou deploy foi executado. O próximo passo depende da identificação dos ambientes pelo proprietário.
