# Análise das provas do VET

Página privada: `/vet/analise-provas`. Endpoint `vet.getExamAnalysis` exige
autenticação e acesso válido à plataforma antes de consultar ou reutilizar dados.
Não depende de objetivo configurado nem altera pesos, diagnóstico, pontuação ou plano.

## Fonte e metodologia

Somente `questoes.publicada = true`, leitura completa paginada e ordenada por ID.
Cada ID conta uma vez. Nenhum ID, enunciado, gabarito ou dado pessoal sai pelo endpoint.
Instituição, disciplina, banca e ano usam os registros existentes; não existe fase.
Conteúdos e assuntos respeitam os campos canônicos e `assuntos_por_conteudo`.
O fallback de assuntos planos só é seguro para uma questão de conteúdo único.
Vínculos ambíguos não são inventados e ficam sinalizados na interface.

- **Rosca proporcional:** cada questão distribui peso total 1 entre N conteúdos
  distintos (1/N para cada). Sem conteúdo: “Não informado”. A soma é 100%,
  salvo arredondamento visual. Peso fracionário não é quantidade inteira de questões.
  Parcelas abaixo de 5% entram em “Outros”, preservando a maior parcela.
  Seus membros continuam consultáveis e selecionáveis.
- **Incidência:** questões distintas com uma tag / total do recorte.
  Tags podem se sobrepor. No resumo de assuntos, a base é o conteúdo selecionado.
- **Evolução:** linhas com eixo numérico, pontos e até cinco séries de conteúdos
  ou cinco assuntos do conteúdo selecionado. Base percentual: total anual da
  instituição/disciplina/banca, independente da seleção de conteúdo/assunto.
  Sem seleção de séries, só volume anual. Anos sem base são nulos e interrompem
  linhas; zero só quando existe base e nenhuma questão da tag.
  Questões sem ano ficam no resumo, não na série. Tooltip e tabela textual
  mostram ano, série, quantidade, base e percentual.
- **Períodos:** todos, ano ou intervalo inclusivo. Limites vêm do banco; inválidos
  são rejeitados e filtros dependentes incompatíveis são removidos.
  A/B usam os mesmos filtros globais, independentemente do intervalo principal,
  exibindo bases e diferença B−A em pontos percentuais.
  Maior aumento/redução só aparece com dados em cada ano dos dois períodos.
  Desempates são alfabéticos. Isso descreve o banco, não prova cobertura completa,
  tendência oficial ou previsão de questões futuras.

## Navegação, tema e desempenho

Banco reaproveita `institution`, `subject`, `topics` e `block`; amplia a leitura
compatível para `subtopics`, `years`, `exam`, `yearFrom` e `yearTo`.
Parâmetros são decodificados uma vez e validados. Banca/intervalo formam um
recorte removível acima dos filtros existentes. “Não informado” não é transportado;
nesses casos a análise avisa que o destino é mais amplo.

Seleções de séries e métrica são locais, sem nova leitura. O serviço mantém apenas
metadados públicos em cache de processo por 60 segundos, com leitura concorrente
deduplicada e descarte de falhas. Autorização continua anterior ao cache.
Não é cache de desempenho de aluno ou armazenamento persistente.

`vetTheme.css` é restrito a `.vet-theme.theme-page` e à preferência existente
do ThemeContext. Trata superfícies semânticas claras legadas, cabeçalhos,
inputs, ícones e badges; preserva os destaques fortes. Não usa `!important`
nem muda o tema de outras áreas. Todos os módulos VET participam do escopo.
O cartão de análise permanece em “Outros módulos” na parte inferior da home.

## Validação

`npx vitest run server/vet/examAnalysis.test.ts server/vet/examAnalysisEvolution.test.ts server/vet/examAnalysisService.test.ts server/questions/questionPagination.test.ts`

Também executar build, diff-check e TypeScript. A revisão de interface local pode
usar dados simulados, sem autenticação ou Supabase remoto; isso não substitui
homologação autenticada com os registros reais.

Não há SQL, migration ou alterações de RLS nesta entrega.
