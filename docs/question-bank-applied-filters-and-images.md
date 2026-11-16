# Banco, análise, PDF, privacidade e várias imagens

Entrega iniciada em 14/10/2026. Publicação depende da aplicação manual da migration indicada abaixo. Nenhum acesso ao Supabase remoto foi realizado nesta entrega.

## Causas e comportamento final

- Banco: os controles alimentavam diretamente a chave de `questions.browse`, incluindo na abertura sem filtro. Agora os controles são um rascunho; **Aplicar filtros** cria a seleção aplicada. Sem seleção significativa, a consulta de questões permanece desabilitada. Limpar remove seleção e resultados. O recorte recebido pela URL do VET é aplicado na abertura.
- Opções: o endpoint autenticado `questions.filterOptions` usa um RPC que retorna apenas listas de opções de questões publicadas. Não retorna enunciados, alternativas, IDs, resoluções ou gabaritos. Mudanças de busca textual/status/dificuldade não provocam novas consultas de opções.
- Resultados: consulta progressiva de 20, com rolagem e botão **Carregar mais questões**. Não há número de página nem ação para buscar todo o conjunto. A chave inclui usuário, filtros aplicados e aplicação; respostas anteriores são canceladas/ignoradas e os IDs são deduplicados mantendo a ordem. O quiz permanece montado quando acrescenta um lote e seu cronômetro não reinicia ao anexar questões. Alterar controles mostra aviso de pendência; resumo, estatísticas, PDF, caderno e quiz continuam usando a seleção aplicada.
- Análise: `globalChange` reconstruía os filtros omitindo o período e limpava os campos do intervalo. Além disso, o cálculo removia anos/limites inexistentes nas opções da nova combinação. Ambos foram corrigidos. Trocas globais e conteúdo/assunto preservam ano/intervalo; somente o controle de período o altera. Resultados vazios mantêm o período. A análise anterior continua visível enquanto atualiza.
- Rosquinha: o limite era 5%. `OTHER_CONTENT_SHARE_THRESHOLD` agora vale 3. Fatias com 3% permanecem individuais, com tolerância para arredondamento numérico; a maior fatia continua preservada e a soma/membros de Outros são mantidos.
- PDF: o código era mapeado mas nunca desenhado. Agora aparece como **Código: …**, abaixo do número sequencial e antes das tags. Códigos longos quebram por largura medida e cada linha respeita a quebra de página. A seleção também passa banca e intervalo aplicados do VET, anteriormente omitidos pelo contrato de PDF. O limite continua 120 e o gabarito/autorizações permanecem nos fluxos existentes.
- Imagens: vários slots escreviam no mesmo `url_imagem`. Agora a ordem declarada no JSON governa preview e finalização, e todas as URLs e metadados ficam no JSONB `image_metadata`. O campo escalar guarda a primeira como compatibilidade. O renderer prefere a lista e não duplica o fallback. Cadastro/edição usam um editor compartilhado com uploads assinados, confirmação binária no servidor, URL HTTPS, texto alternativo, legenda e ordenação. Alternativas/resoluções são preservadas ao salvar. Banco/quiz, PDF, caderno, preview administrativo e página pública recebem todas as imagens.

## SQL manual necessário

A única migration nova desta entrega é:

`supabase/migrations/202610140001_question_filter_facets.sql`

Ela cria `vet_question_filter_facets(jsonb)`, restrita ao backend `service_role`, e atualiza `export_question_pdf_data` para respeitar banca e intervalo. Não altera registros históricos, RLS, tabelas ou colunas. Depende das migrations já existentes de exportação PDF (`202610060001`) e desempenho (`202610080001`). Não reaplique essas migrations antigas se já foram instaladas.

Antes de publicar o backend dependente, abra a migration nova, copie seu SQL completo para uma nova consulta no SQL Editor do Supabase e execute uma vez. O arquivo contém uma transação. Nenhum SQL remoto foi executado nesta entrega.

O SQL completo de reversão está em:

`supabase/rollbacks/202610140001_question_filter_facets.rollback.sql`

Não execute o rollback normalmente. Para uma reversão planejada, restaure primeiro o backend anterior e só então aplique esse arquivo; ele restaura a função anterior de PDF e remove apenas o RPC novo de opções.

As migrations, rollback e persistência JSONB foram exercitados apenas em PGlite local, com dados sintéticos.

## Privacidade e configuração

A política passou a explicar cadastro, tentativas e desempenho, cobrança/suporte, IA com texto/imagem solicitada pelo usuário, integração de áudio condicional, analytics Umami opcional, WhatsApp de cobrança com consentimento, Mercado Pago, Supabase/Vercel e conexão/desconexão do Google Drive.

Auditoria de áudio: `server/_core/voiceTranscription.ts` contém o cliente de transcrição; não foi encontrada chamada ativa fora de exemplos em comentários. Portanto, a política não anuncia transcrição ativa. IA usa `OPENAI_API_URL`/`OPENAI_API_KEY`/`OPENAI_MODEL`; áudio dependeria de `FORGE_API_URL`/`FORGE_API_KEY`. Não foram lidas nem alteradas configurações de produção.

Analytics depende de `VITE_ANALYTICS_ENDPOINT` e `VITE_ANALYTICS_WEBSITE_ID`. WhatsApp depende da flag, credenciais, templates, execução do job e consentimento `billing_whatsapp_opt_in`. Não foi encontrado envio de marketing usando esse consentimento. Os rótulos de cadastro/perfil foram esclarecidos para **lembretes de cobrança e vencimento**, sem marcar opções ou criar consentimentos.

`LEGAL_CONTACT_PHONE` é server-side, opcional, vazio no `.env.example`. Só valores com dígitos e separadores comuns, entre 8 e 15 dígitos, viram link `tel:`. `LEGAL_CONTACT_EMAIL` continua validado; cada canal ausente aparece como em configuração. Responsável legal e contatos oficiais continuam pendentes de informação pelo operador.

A versão de privacidade passou de `2026-09-07` para `2026-10-14`, pois foram incluídas informações substantivas sobre os tratamentos e integrações. O fluxo existente poderá solicitar novo aceite aos alunos. A versão dos Termos e do consentimento WhatsApp foi preservada, assim como os registros anteriores. Os demais documentos mantêm as condições compatíveis encontradas no código; preços, benefícios e direitos não foram alterados.

## Arquivos principais

- Banco: `QuestionBankPage.tsx`, `useAppliedQuestionBrowse.ts`, `appliedQuestionBrowse.ts`, `questionBrowse.ts`, `questionCache.ts`, `server/routers.ts` e a migration/rollback acima.
- Análise: `VetExamAnalysisPage.tsx`, `shared/vet/examAnalysis.ts` e testes de análise.
- Imagens: `shared/questionImages.ts`, `shared/questionImportSchema.ts`, `server/questions/questionImportImages.ts`, `StatementImagesEditor.tsx`, páginas individuais/lote, mapeamento `questions.service.ts`, modelo `Question`, rich content, quiz, caderno, DTO e renderer públicos.
- PDF: `questionPdfGenerator.ts`, `questionPdfLayout.ts`, `shared/questionPdf.ts` e teste Unicode/PDF real.
- Legal: `LegalPage.tsx`, `legalConfig.ts`, `legalService.ts`, `legalDocuments.ts`, `.env.example` e rótulos de consentimento no cadastro/perfil.
- Novos testes: `appliedFiltersAndImages.test.ts`, `questionFacetsSql.test.ts`; contratos administrativos e de PDF também foram ampliados.

## Validação e limitações

Resultados medidos em 15/10/2026:

- Testes direcionados: **207/207 aprovados**, em 13 arquivos. Incluem observador de consulta sem aplicação inicial, aplicação/limpeza, lotes de 20, cancelamento de respostas antigas, ordem/deduplicação, 10 trocas de filtros com período, limite de Outros, código extraído do PDF real, validação de telefone, autorização e persistência/releitura/renderização das imagens.
- Suíte completa: **744 testes; 734 aprovados, 7 falhas e 3 ignorados**. Base anterior: 707; 697 aprovados, as mesmas 7 falhas e 3 ignorados. As 37 verificações acrescentadas não introduziram falhas novas.
- As 7 falhas anteriores são 2 verificações de integridade do editor de criação, 1 de apresentação/peso de dificuldade, 2 de integração de dificuldade, 1 de derivação de estado do quiz e 1 de isolamento das estatísticas do VET. Os nomes dos testes que falharam foram comparados com a execução-base.
- `npm run check`: os mesmos **11 erros preexistentes**, sem novo erro: imports duplicados/referências a `supabase` no editor de resolução; tipo `QuestionDifficulty` ausente nas exportações existentes; e interpretação do nome de coluna acentuado no select do caderno. Linhas deslocadas ou a inclusão de `image_metadata` no mesmo select não representam uma nova categoria de erro.
- `npm run build`: cliente Vite e servidor esbuild aprovados. Permanece o aviso anterior sobre bundles maiores que 500 kB.
- `git diff --check`: aprovado.
- PGlite: migration, rollback e reaplicação aprovados; banco sintético de 2.500 questões públicas e 1 privada. As opções retornam menos de 1 KB no cenário testado. Os tempos locais em WebAssembly não são um benchmark de produção.

Os testes usam banco local sintético, observadores reais do TanStack Query com transporte simulado, persistência/releitura JSONB e renderização HTML/PDF. Isso não equivale a upload no storage de produção ou teste com sessão real.

Ainda requerem validação visual em navegador com sessão de teste e infraestrutura local/staging: comportamento da rolagem em dispositivos reais, navegação completa dos formulários, envio efetivo ao storage e layout do PDF com o conjunto real de imagens. Nenhuma dessas verificações deve alterar o Supabase remoto nesta etapa.

Imagens que a versão antiga já havia sobrescrito sem conservar as URLs não podem ser recuperadas automaticamente. Remover uma associação na edição não apaga arquivos antigos do storage, preservando eventuais referências existentes.
