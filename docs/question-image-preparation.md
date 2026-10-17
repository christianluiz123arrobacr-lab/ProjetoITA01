# Preparação segura de novas imagens de questões

## Uso

Ao escolher uma imagem no cadastro/edição de enunciado ou alternativa, ou em um
slot da importação em lote, abre-se uma revisão **antes** de gerar URL assinada.
Compare original/resultado e escolha **Usar preparada** ou **Manter original**.
A janela informa MIME, dimensões, tamanho, tempo de preparação e eventuais avisos.
Só o arquivo escolhido é enviado. No lote, os nomes **originais** determinam os
slots antes de qualquer conversão, e os arquivos são revisados sequencialmente.

## Política de qualidade e limites

- 400 KiB (409.600 bytes) é uma meta, não um bloqueio. Não há redimensionamento
  automático nem ampliação. Uma economia inferior a 5% não troca o original.
- Padrão **Documento, fórmulas ou diagrama**: PNG de 8 bits pode ser recodificado
  como PNG; JPEG/WebP são preservados para não acumular perda em texto/fórmulas.
- **Fotografia** é uma escolha explícita: tenta WebP com perda, qualidades 0,95 e
  0,90. WebP de qualidade alta **não** é tratado como sem perdas. Confira a prévia.
- O MIME efetivo e a assinatura binária precisam corresponder à saída; se o
  navegador não produzir o formato solicitado, mantém-se o original.
- APNG e WebP animado não são recodificados. PNG com profundidade diferente de 8
  bits também fica intacto. A transparência não recebe fundo opaco. A orientação
  EXIF é aplicada pelo decoder (`createImageBitmap`, `from-image`). Metadados
  auxiliares podem ser removidos na versão recodificada; manter original preserva-os.
- Worker com OffscreenCanvas, até 8 MP e 15 segundos por tentativa. Acima de 8 MP,
  não se decodifica para preparação/prévia automática. Sem recursos confiáveis,
  preserva-se o original; não há recodificação pesada alternativa na thread da UI.
- Mantido o teto de **3 MiB**, inclusive para a entrada original, e dimensões de
  1 a 12.000 pixels por eixo. Um original acima do teto não é aberto para tentar
  fazê-lo caber. Os limites estão no schema/inspector compartilhados e na
  confirmação do servidor. A migration local existente de lotes configura os
  buckets com PNG/JPEG/WebP e até 3.145.728 bytes (preservando teto menor existente).
  A configuração remota não foi consultada: pode ser mais restritiva.

## Upload, retry e substituição

URLs assinadas usam nome, extensão e MIME do arquivo final. O transporte com
AbortSignal segue o protocolo FormData/PUT do SDK instalado; consumidores antigos
continuam no SDK. O backend verifica novamente bytes, MIME, tamanho e dimensões;
a preparação do navegador não é uma validação de segurança nem um decoder completo.

Retries conservam o File preparado. No lote, conservam também o ticket e o envio
já concluído, repetindo só a confirmação quando possível. Cada substituta tem um
path novo, limitado ao lote e slot do usuário autorizado. Preparar não altera a
imagem anterior. Somente depois de validar os bytes e gravar a nova referência
(com comparação da referência anterior) remove-se a imagem substituída.
Falha de limpeza posterior não desfaz uma confirmação bem-sucedida.

Cancelar interrompe preparação/PUT e solicita descarte da candidata não associada;
o servidor não descarta o path atualmente associado. A confirmação persistente é
uma etapa curta não cancelável pela janela: aguarde sua resposta. Falha temporária
de confirmação mantém a candidata para retry. O cancelamento/limpeza de rascunhos
expirados também enumera candidatas abandonadas nos diretórios dos slots do lote.
Não foi criado agendamento remoto: a limpeza usa a ação existente. Fechamento
abrupto/rede indisponível pode adiar a limpeza; não há promessa de zero órfãos.

Imagens antigas, referências já persistidas, JSON/JSONL e renderizadores não são
migrados. **Nenhuma migration nova é necessária**. Não há SQL a aplicar nesta entrega.

## Escopo e validação local

O editor manual de resoluções permanece separado e inalterado: tem fluxo próprio
de blocos e upload, cuja conversão exigiria uma entrega independente. Os slots
de resolução da importação em lote usam a preparação comum normalmente.

Fixture isolada: `npx vite --config tests/browser/vite.images.config.ts`, abrir
`http://127.0.0.1:5192/images.html` (ou porta informada). Usa Worker, revisão, quiz
e gerador PDF reais, mas **Storage, usuário e envio são simulados**. Não é rota do
produto nem entrada do build de produção. Arquivos são exclusivamente sintéticos.

Resultados observados no navegador disponível:

- PNG com texto pequeno, sinais, expoentes, gráfico, traços de 1 px e transparência:
  625,1 KiB → 39,2 KiB, 800 × 470 preservados, preparação ~93 ms.
  O original inclui metadados volumosos sintéticos: essa redução não representa
  a taxa esperada para qualquer imagem de prova real.
  Uma segunda verificação do navegador comparou os pixels RGBA do original e da
  preparada: idênticos, inclusive a região transparente.
- JPEG sintético com EXIF 6: original 900 × 600, WebP orientado 600 × 900;
  1.546,7 KiB → 446,6 KiB, ~681 ms. Acima da meta, envio ainda permitido.
- Retry após falha sintética reutiliza a preparação. Envio simulado ~150 ms:
  **não** é medição de rede/Supabase. Sem testes de upload remoto nesta tarefa.
- PDF gerado pelo exportador existente com original/preparada e imagens nas
  alternativas, renderizado com Poppler e inspecionado: nenhuma perda visível
  adicional no PNG sintético. O exportador não foi alterado. Isso não certifica
  scans reais, todos os celulares, navegadores, perfis de cor ou tipos de imagem.

Testes unitários usam bytes/Storage simulados e cobrem limites, formato real,
animação, associação antes da conversão, cancelamento, retry e preservação da antiga.
Qualidade visual deve continuar sendo conferida pelo autor, especialmente para
fotografias e documentos JPEG/WebP mantidos acima da meta.

## Resultado das verificações desta entrega

- Testes direcionados: **56 aprovados** em 5 arquivos (preparação, transporte,
  substituição, imagens do importador e autorização).
- `npm run build`: cliente e servidor aprovados; permanece o aviso de chunks grandes.
- `git diff --check`: aprovado.
- Suíte completa: **780 testes**, 770 aprovados, 7 falhas preexistentes e 3 pulados.
  Nenhuma falha nova. As falhas anteriores são duas asserções textuais do editor
  de criação, três de dificuldade, uma de dependências do quiz e uma do VET.
- `npm run check`: continuam os **11 erros preexistentes**, sem erro novo:
  7 no editor manual de resoluções (imports duplicados e `supabase` ausente),
  3 no tipo `QuestionDifficulty` não exportado e 1 no select de instituição
  do router de cadernos. Não foram corrigidos por serem fora deste escopo.
- Sem autenticação/Storage reais no teste visual; sem certificação de scans reais
  ou da latência da rede. Testes com dados reais devem ser feitos pelo responsável
  em ambiente apropriado antes da publicação.

Nenhum commit, push, merge, deploy, upload real ou SQL remoto foi executado.
