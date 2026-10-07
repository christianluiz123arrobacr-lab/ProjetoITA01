# Exportação PDF: correção do timeout

## Causa e solução

O endpoint fazia até 20 viagens sequenciais ao Supabase (200 questões por vez,
até 4.000), carregava a relação `resolucoes` e filtrava em memória. Uma seleção
pequena não atingia o limite de parada, consumindo os 30 segundos da Vercel antes
de iniciar o gerador no navegador.

Agora `questions.exportPdfData` usa **uma RPC**: `export_question_pdf_data`.
Filtros, prática, ordenação e limite são aplicados no PostgreSQL. Somente até
120 questões são transferidas, com uma lista explícita de campos para enunciado,
alternativas, imagens, metadados e gabarito. Não existe consulta a `resolucoes`,
paginação HTTP ou fallback para a antiga varredura. O limite da Vercel continua
30 segundos. O layout do PDF não foi alterado.

## Migration necessária antes de publicar

Aplicar **manualmente**, no ambiente correspondente à aplicação:

`supabase/migrations/202610060001_optimize_question_pdf_export.sql`

Cria a RPC, três auxiliares de normalização e índices pequenos para ano,
instituição, dificuldade e última tentativa. Não modifica questões, respostas,
assinaturas, políticas RLS existentes ou dados de usuários. Somente `service_role`
pode executar a RPC; o frontend continua chamando o endpoint autenticado.
Autorização de assinatura/perfil e rate limit permanecem no procedimento tRPC.

O rollback `supabase/rollbacks/202610060001_optimize_question_pdf_export.rollback.sql`
é somente para emergência, após restaurar a aplicação anterior. **Não executar
normalmente.** Migration ausente gera erro controlado; não há fallback lento.

Nenhum SQL foi executado remotamente. Migration e rollback foram exercitados
somente em PostgreSQL/WASM local em memória, sem credenciais ou conexão de rede.

## Arquivos alterados

- `server/routers.ts`, `server/questionPdfExport.ts`: procedimento protegido e seleção única.
- `shared/questionPdf.ts`: identificador opcional de correlação, sem mudar filtros.
- `client/src/services/questions.service.ts`: busca e mapeamento instrumentados.
- `client/src/pages/QuestionBankPage.tsx`: diferencia falha do servidor e do PDF.
- `client/src/lib/questionPdfDiagnostics.ts`: logs seguros e mensagens por etapa.
- `client/src/lib/questionPdfGenerator.ts`: tempos de recursos/montagem/download.
- `server/questionPdfExport.test.ts`: regressão SQL e fluxo de exportação.
- `package.json`, `package-lock.json`: PGlite somente para testes.
- Migration e rollback listados acima; este relatório.

## Compatibilidade

- Normalização equivale a `trim`, minúsculas, decomposição NFD e remoção de
  marcas U+0300–U+036F; não usa `unaccent` para evitar expandir letras ligadas.
- Arrays `conteudos`/`assuntos` não vazios têm prioridade; arrays vazios/nulos
  usam os escalares legados. `conteudo` nulo usa `assunto`, mas texto vazio não
  é reinterpretado. `disciplina` nula usa a grafia legada `diciplina` se existir.
- Taxonomia canônica importada e texto legado são preservados; texto que parece
  JSON não é automaticamente convertido em array. Não se cria nova taxonomia.
- Busca mantém substring literal, inclusive `%`, `_`, acentos e passagem entre
  campos consecutivos. Não é substituída por LIKE ou busca por palavras.
- Prática usa a tentativa mais recente por `answered_at`, somente do usuário
  autenticado. Empates usam `attempt_number` decrescente e `id` crescente.
- Questões ordenadas por `created_at DESC, id ASC`; somente publicadas.
  Limite 120 e indicador de truncamento preservados; `totalMatched` passa a
  contar todas as correspondências, sem o antigo teto de varredura de 4.000.
- Imagens, alternativas maiúsculas/minúsculas, `options` legadas, texto após
  imagem e metadados de imagem são mantidos para o mapeador existente.

## Diagnóstico

Logs estruturados `question_pdf_export`: etapas `server_search`, `mapping`,
`resources`, `generation`, `download`, duração, correlação e códigos seguros
quando disponíveis. Não registram filtros, identificadores de aluno, enunciados,
alternativas, respostas, URLs dos recursos, tokens ou mensagens internas.
No frontend, 504 é identificado como demora do servidor, separado de falha de
montagem ou acionamento do download. A etapa de download confirma o acionamento
do navegador, não a gravação física do arquivo no disco.

## Verificação local

PGlite é uma dependência somente de desenvolvimento para executar SQL real nos
testes; não entra no bundle da aplicação nem se conecta a banco remoto.

```sh
npm run test -- server/questionPdfExport.test.ts server/questionPdf.test.ts server/questionPdfUnicode.test.ts server/questionPdfErrors.test.ts
npm run build
git diff --check
```

- 95 testes direcionados passaram: 4.000 registros/15 correspondentes/uma RPC,
  combinações de filtros comparadas ao predicado JS anterior, acentos e arrays,
  valores legados/JSONL, prática e empates, seleção além de 4.000, limite exato
  120/121, truncamento, projeção sem resoluções, privilégios da RPC, rollback e
  falhas seguras.
- Fluxo serviço → RPC local → `mapQuestao` → gerador real → blob PDF → click de
  download testado com DOM e recursos simulados. Não é teste em produção.
- Medição local representativa: busca das 15 em 16–23 ms, mapeamento 1 ms,
  montagem 11 ms e recursos locais 4 ms. Rede Vercel/Supabase e recursos reais
  não foram medidos; esses números não são promessa de desempenho remoto.
- Build cliente/servidor passou (aviso já existente de chunks grandes).
- Suíte completa: 602 passaram, 7 falharam, 3 ignorados. As mesmas sete falhas
  foram reproduzidas em cópia isolada de HEAD anterior: criação de questão (2),
  dificuldade (1), integração de dificuldade (2), InteractiveQuiz (1), VET (1).
  Nenhuma delas foi corrigida ou alterada nesta entrega.
- `npm run check` detectou erros TypeScript já presentes no editor de resolução,
  exports de dificuldade e um select antigo em `routers.ts`; não apresentou
  erros novos nos arquivos desta correção.

Antes de publicação futura: aplicar migration manualmente, depois validar uma
seleção pequena com usuário autorizado e comparar os logs de busca/geração.
Sem commit, push, merge, deploy ou operação no Supabase remoto nesta etapa.
