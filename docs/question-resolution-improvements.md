# Quadro de resolução — interface e resposta do ponteiro

## Escopo

Entrega local, sem commit/push/deploy. Nenhuma migration, API, permissão, dado remoto ou integração de Drive alterada. O adaptador IndexedDB e seu formato de documento continuam os mesmos. `InteractiveQuiz.tsx` e `NotebookEditorPage.tsx` não foram modificados.

## Interface

- Lado a lado permanece padrão, com o mesmo `ResizablePanelGroup` e divisor.
- Em desktop (a partir de 900 px), **Janela flutuante** coloca o painel existente sobre o quadro. O conteúdo não é reparentado nem remontado ao mudar o modo.
- Arrastar a barra de título move a janela. As oito bordas/cantos redimensionam. Setas também movem/redimensionam; Shift amplia o passo.
- Os limites são recalculados por `ResizeObserver`, mantendo a janela dentro da área disponível.
- **Recolher questão** ou soltar a barra perto dos últimos 40 px da área inferior oculta a janela. **Restaurar questão** fica no cabeçalho. **Lado a lado** retorna ao divisor anterior.
- Em telas estreitas, continuam as abas Questão/Rascunho; o modo flutuante não é imposto.
- Preferências de janela são apenas estado em memória nesta etapa: não há novo armazenamento de conteúdo ou dados da questão.
- Aviso de armazenamento e exclusão local foram para **Ações**, mantendo confirmação antes de apagar. Erros continuam visíveis; status de gravação permanece acessível a leitores de tela, sem faixa fixa ociosa.
- Páginas ficam em **Pág.**, e os painéis secundários de ferramentas são sobrepostos e fecháveis. A barra principal local ocupa 44 px; começar a escrever fecha as opções.
- Tema escuro corrigido com CSS limitado ao painel da questão deste fluxo, incluindo etiquetas, fundo do cabeçalho, textos Markdown, metadados e feedback. Não inverte as imagens nem altera o tema global.

## Causas verificadas no código e correções

Não foi medida latência física de hardware. A análise do caminho dos eventos mostrou:

1. O código já usava `getCoalescedEvents()` e `requestAnimationFrame`; não era correto simplesmente acrescentá-los como se não existissem.
2. O descarte por distância mínima de 0,55 unidades ignorava mudança de pressão com pouco movimento. No quadro local, a amostra agora é aceita por movimento **ou** mudança de pressão; pressão/largura continuam vinculadas à própria amostra.
3. Alguns navegadores podem omitir o evento pai mais recente da lista coalescida. O quadro local o inclui quando traz posição/pressão nova e não duplica a última amostra.
4. A largura renderizada aplicava redução artificial no trecho final de um traço ainda em movimento. A ponta ficava fina até novos pontos chegarem. O quadro local mantém a largura da amostra, preservando contorno quadrático e suavização geométrica. Não há filtro de pressão herdando a largura anterior.
5. No fim do gesto havia outra suavização posicional que não aparecia na prévia. O quadro local agora confirma os mesmos pontos da prévia, que já é desenhada com curvas; formas perfeitas continuam disponíveis.
6. A borracha restringia a aplicação efetiva a intervalos de 55 ms, redesenhava antes de apagar e repetia o desenho pelo efeito React. O quadro local aplica em cada frame solicitado, processa apenas segmentos novos (com um ponto de sobreposição), preserva a trajetória completa no fechamento e evita o segundo redesenho do mesmo resultado.
7. O cache de traços confirmados foi mantido: a escrita não redesenha todos os traços antigos a cada movimento. A prévia também é preservada quando outro efeito solicita um redesenho durante a escrita.

Essas mudanças de renderização/processamento estão condicionadas a `embedded && persistence.destination === "browser"`. O caderno independente mantém seus limiares, taper, suavização e persistência anteriores. Dados antigos não são regravados por conversão nem migrados nesta entrega.

## Arquivos

- `client/src/components/question-notes/QuestionResolutionLayout.tsx`: janela, limites, teclado e modo lado a lado.
- `client/src/components/question-notes/floatingQuestionWindow.ts`: geometria pura de contenção/redimensionamento.
- `client/src/components/question-notes/questionResolution.css`: alças e tema escuro estritamente local.
- `client/src/components/question-notes/QuestionScratchpad.tsx`: ações secundárias e remoção das faixas permanentes.
- `client/src/components/study-canvas/StudyCanvasWorkspace.tsx`: barra compacta e pipeline local de desenho/borracha.
- `client/src/components/study-canvas/studyCanvasInk.ts`: seleção de amostras e conservação da pressão.
- `server/questionResolutionWindow.test.ts`: novos testes unitários de janela e amostras.
- `server/studyCanvasBrush.test.ts`: atualização de assert de código-fonte para a assinatura parametrizada do contorno.

## Validação

68 testes direcionados aprovados em oito arquivos: janela/amostras, persistência local, guardas de ponteiro, tinta, pincéis, papel, contrato do Drive e exportação PDF. São testes unitários/contratos; não equivalem a testes físicos com caneta.

`npm run check` continua com os 11 erros preexistentes documentados na entrega anterior (AdminResolutionEditorPage, tipos de dificuldade e select de instituição no router). Nenhum novo erro nesses arquivos da entrega.

O primeiro build foi bloqueado pelo sandbox ao resolver `superjson` (EPERM); a execução autorizada fora do sandbox passou, inclusive a repetição sobre os arquivos finais (cliente e servidor). `git diff --check` passou; apenas avisos de conversão LF/CRLF do Git, sem erro de whitespace.

**Validação visual pendente:** a tentativa de acessar a fixture no navegador foi rejeitada pela política de acesso do controle do navegador. Não houve contorno desse bloqueio. Não foram validados visualmente tema claro/escuro, desktop/celular, arraste, ferramentas, download ou toque/caneta física nesta entrega.

### Conferência manual pendente

Na fixture local (`npx vite --config tests/browser/vite.questionDraft.config.ts`, URL `/questionDraft.html`) ou com conta de teste autorizada:

1. Abrir Rascunhar e ajustar o divisor; desenhar e selecionar uma alternativa.
2. Alternar Janela flutuante/Lado a lado e conferir que desenho, alternativa e largura do divisor permanecem.
3. Mover pela barra, redimensionar pelos oito lados/cantos e via teclado. Tentar sair da viewport e reduzir a janela do navegador.
4. Recolher pelo botão e arrastando a barra até embaixo; restaurar e escrever com a questão recolhida.
5. Navegar entre questões e retornar; confirmar isolamento e restauração do rascunho local.
6. Alternar tema e conferir etiquetas, Markdown, progresso, imagens e resposta certa/errada.
7. Em viewport menor que 900 px, alternar abas e conferir ausência de janela flutuante invasiva.
8. Testar traços lentos/rápidos, pressão e espessura com caneta física, além de mouse e toque; desfazer/refazer; apagar área e traço inteiro; trocar páginas e exportar.
9. Conferir que o caderno independente mantém o fluxo anterior de gravação no Google Drive.
