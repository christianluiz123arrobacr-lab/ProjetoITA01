# Banco de Questões: resolução dividida e rascunho local

## Interface

O controle **Rascunhar** abre a questão completa e interativa à esquerda e o
motor de escrita existente à direita. Proporção inicial 45/55, com mínimo de 35%
para cada painel. O divisor aceita mouse e teclado (setas), com rótulo acessível.
Acima de 900 px, os dois painéis ficam visíveis; abaixo disso, os controles
**Questão / Rascunho** alternam apenas a visibilidade, sem desmontar o quiz.
Voltar ao banco preserva respostas, posição e filtros. Cada painel tem rolagem
independente. A área usa `100dvh` e cabeçalho próprio, acima do cabeçalho do site.

O canvas mantém ferramentas, pressão, captura de ponteiro, heurística de palma,
histórico e renderização existentes. O painel usa o modo de folha já existente:
A4, largura lógica 1200, sem reescalar os pontos antigos. A área vertical é maior
que o antigo quadro 1200×700; os pontos legados mantêm suas coordenadas. Barras
extensas rolam horizontalmente. Tela cheia e exportação permanecem no motor.
Os atalhos do rascunho local exigem quadro aberto/ativo e foco dentro dele.

## Persistência

- IndexedDB `vetor-question-drafts`, store `drafts`, chave JSON `[userId, questionId]`.
- Documento estruturado com páginas, traços e imagens incorporadas, não screenshot.
- Teto de 8 MiB por documento (tamanho JSON UTF-8 estimado antes da transação).
  A quota real do navegador pode ser menor; o teto não garante espaço disponível.
- Confirmação de sucesso apenas após `transaction.oncomplete`. Falhas/quota são
  apresentadas sem limpar o indicador de alterações não salvas.
- Debounce de 650 ms. Ao recolher/trocar questão/desmontar ou ocultar a página,
  tenta concluir o salvamento local. Fechamento abrupto não garante a conclusão.
- Cada adaptador captura a conta/questão. Escritas são serializadas por sessão.
  Resposta de importação atrasada usa inserção condicional para não substituir
  um documento local criado enquanto a leitura estava em andamento.
- Exclusão é somente da conta/questão atuais; grava documento vazio como marcador
  para impedir reimportação de uma nota antiga que o aluno decidiu excluir.
- Não existe sincronização entre dispositivos, criptografia do armazenamento,
  garantia de retenção ou coordenação de edições simultâneas em várias abas.
  Em várias abas, gravações normais seguem a última transação confirmada.

## Transição dos rascunhos antigos

1. Usa primeiro um documento IndexedDB já existente e valida sua identidade.
2. Sem ele, migra o backup `v3:question-note:<userId>:<questionId>` do localStorage,
   mantendo o backup original. JSON inválido não é substituído silenciosamente.
3. Somente se nenhum documento local existir, consulta `notes.getQuestionNote`.
   A chamada é apenas leitura, com espera limitada; verifica a conta antes/depois
   e a identidade do registro retornado.
4. Uma importação local confirmada, inclusive resultado remoto vazio, impede
   novas consultas dessa nota. Falha de rede não grava marcador de sucesso e
   oferece retry antes de escrever. Se o aluno escrever, o novo documento local
   passa a ter prioridade e não será sobrescrito depois por uma nota antiga.

Nenhuma anotação remota é apagada ou alterada. Os endpoints/tabelas/RLS existentes
permanecem. Não é necessária migration ou SQL. O adaptador local não possui método
de escrita remota; o cleanup legado de nuvem é ignorado para esse destino.
Respostas, tentativas, gabarito e estatísticas continuam usando o quiz original.

## Google Drive

`NotebookEditorPage.tsx`, serviços e endpoints de Drive não foram editados.
Seu `StudyCanvasPersistence` sem `destination: "browser"` conserva o caminho
de leitura/gravação, autosave, conflitos e exportação. O status identifica
**Salvo no Google Drive**, separadamente de **Salvo neste navegador**.
O teste visual do provedor foi simulado, não feito em conta real de Drive.

## Arquivos principais

- `client/src/components/question-notes/QuestionResolutionLayout.tsx`: layout
  estável, divisor e alternância móvel, sem duplicar o quiz.
- `QuestionScratchpad.tsx`: adaptador local por identidade e transição legada.
- `client/src/lib/localQuestionDraft.ts`: IndexedDB, migração e exclusão local.
- `StudyCanvasWorkspace.tsx`: destino explícito, debounce/flush locais, apresentação
  embutida e mensagens. Não reescreve o algoritmo da tinta.
- `studyCanvasPointerGuards.ts`: escopo dos atalhos locais.
- `InteractiveQuiz.tsx` / `QuestionBankPage.tsx`: integração opcional do modo dividido.
- `server/localQuestionDraft.test.ts` e `server/studyCanvasPointerGuards.test.ts`:
  isolamento, migração, concorrência, falhas, teto e escopo de teclado.

## Validação

Testes direcionados: **56 aprovados** em 7 arquivos, incluindo testes existentes
de tinta, pincéis, papel, PDF e contratos/autosave do editor Drive.

`npm run build` (cliente/servidor) e `git diff --check`: aprovados. Permanece o
aviso preexistente de chunks grandes. Suíte completa: **795 testes**, 785 aprovados,
7 falhas preexistentes e 3 pulados, sem falha nova. As falhas anteriores são duas
asserções textuais do editor de criação, três de dificuldade, uma de dependências
do quiz e uma do VET. `npm run check` mantém os mesmos 11 erros preexistentes
(7 no editor de resoluções, 3 do tipo QuestionDifficulty e 1 do select do router
de cadernos), sem erro novo desta entrega.

Fixture de navegador: `npx vite --config tests/browser/vite.questionDraft.config.ts`
e `http://127.0.0.1:5194/questionDraft.html` (ou porta indicada). Usa quiz, canvas,
eventos de mouse e IndexedDB reais. Sessão, tentativas, leitura legada e Drive são
simulados e não acessam o Supabase. A simulação de quota rejeita a gravação sem
esgotar a quota real. A fixture não entra no build do produto.

Verificado nesta fixture:

- Desenho com mouse, confirmação de salvamento e recuperação após reload.
- Resposta e resultado mantidos ao abrir/fechar, navegar e ajustar o divisor.
- Arraste do divisor e ajuste por teclado.
- Navegação entre questões sem misturar documentos; recuperação do desenho anterior.
- Viewport 390×844, alternância móvel preservando resposta e traços.
- Troca entre duas contas sintéticas: a segunda não vê o desenho da primeira.
- Falha de quota simulada: aviso de erro, sem sucesso falso; retry bem-sucedido.
- Tema claro/escuro, ferramentas e mensagem do provedor Drive simulado.
- Contador de `notes.saveQuestionNote` permaneceu em zero durante esses fluxos.

Não foram validados caneta física, palma real, conta autenticada de produção,
Google Drive real, quota real esgotada, encerramento forçado do processo ou todos
os navegadores. A migração de notas reais ainda requer teste autorizado com conta
real. Não houve commit, push, merge, deploy ou SQL remoto nesta implementação.
