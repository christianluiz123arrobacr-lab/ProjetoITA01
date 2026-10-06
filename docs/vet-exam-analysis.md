# Análise das provas

A página `/vet/analise-provas` está no roteador privado e na navegação do VET.
O endpoint `vet.getExamAnalysis` exige autenticação e acesso válido à plataforma.
Ela funciona independentemente da configuração de objetivo do aluno e não altera
diagnóstico, prioridades ou plano de estudos.

## Dados e contagens

A fonte é `questoes`, apenas com `publicada = true`. O serviço lê todas as páginas
de metadados, ordenadas por ID, usando o paginador existente. Nenhum enunciado,
gabarito, resolução, ID de questão ou dado de aluno é enviado pela análise.
Instituição (`instituição`), disciplina (`disciplina`), banca/prova (`banca`) e ano
(`ano`) usam os valores cadastrados. Não existe filtro de fase no modelo consultado.

Cada ID conta uma vez. Conteúdos usam `conteudos` com fallback para `conteudo`;
assuntos usam `assuntos` com fallback para `assunto`. Relações explícitas de
`assuntos_por_conteudo` são respeitadas. Sem relação explícita, uma lista plana de
assuntos só é atribuída se houver um único conteúdo. Questões antigas multiconteúdo
sem vínculo explícito são sinalizadas como sem vínculo, sem alterar a taxonomia.

As barras de incidência permitem sobreposição. O percentual de conteúdo divide
questões distintas daquele conteúdo pelo total do recorte; o de assunto divide
questões distintas com aquele assunto pelo total do conteúdo selecionado.
O percentual anual divide as questões selecionadas pelo total da instituição e
disciplinas naquele ano, com os filtros ativos. Sem seleção de conteúdo, esse
percentual é 100%, pois o numerador corresponde ao próprio total anual.

Somente anos cadastrados entram no gráfico. Intervalos ausentes são rotulados
“Sem dados”, sem barras zero. Questões sem ano são incluídas no total e informadas
separadamente; não entram na série anual. Zero de incidência em um ano com questões
da disciplina significa ausência do conteúdo/assunto naquele conjunto conhecido.
A cobertura descreve o banco disponível, sem afirmar que representa provas completas.

## Navegação e validação

Os filtros dependentes inválidos são removidos. Selecionar conteúdo ou assunto
preserva instituição, disciplina, banca e ano. A tabela oferece alternativa textual
ao gráfico. O link ao banco reaproveita os parâmetros existentes `institution`,
`subject` e `topics`. Ano, banca e assunto precisam ser refinados no próprio banco,
conforme avisado na página; nenhum parâmetro sem suporte foi acrescentado.

Testes: `npx vitest run server/vet/examAnalysis.test.ts server/vet/examAnalysisService.test.ts`.
Não há migration nem alterações de RLS nesta entrega.
