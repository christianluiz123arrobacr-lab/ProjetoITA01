# Importação administrativa de questões com imagens

O importador aceita o formato histórico e o formato versionado `questoes-v2`. JSON antigo sem `imagens` continua válido e não exige uploads.

## Fluxo

1. Acesse **Admin > Questões > Importar lote JSON**.
2. Carregue ou cole o JSON e clique em **Validar e salvar rascunho**.
3. Revise questões válidas/inválidas e os slots de imagem.
4. Envie imagens individualmente ou use **Associar vários arquivos**. A associação automática tenta primeiro `nome_arquivo_esperado` e depois `slot_id`; ambiguidades exigem seleção manual.
5. Confira miniatura, nome, MIME real, tamanho, dimensões, texto alternativo e legenda.
6. Clique em **Concluir importação**. Imagens obrigatórias pendentes bloqueiam a operação.

O rascunho é persistido por 30 dias e pode ser retomado na própria tela. Cancelar remove os uploads temporários conhecidos. A finalização é idempotente por `chave_importacao`/`import_source_id`.

## Contrato `questoes-v2`

- `chave_importacao`: obrigatória, estável e única por questão ao longo das reimportações.
- `imagens`: opcional; pode ter zero ou vários slots.
- `slot_id`: obrigatório e único dentro da questão.
- `local`: `enunciado`, `contexto`, `alternativa` ou `resolucao`.
- `alternativa`: letra `A`–`E` (ou índice zero-based via `indice_alternativa`) quando `local` for `alternativa`.
- `obrigatoria`: impede a finalização sem arquivo válido.
- `texto_alternativo`: obrigatório para slots obrigatórios; fica separado da legenda e do nome do arquivo.

Veja [`public/question-import/questoes-v2.example.json`](../../public/question-import/questoes-v2.example.json).

## Segurança e limites

- Endpoints são exclusivos de administradores e validam proprietário, lote, questão e slot no backend.
- Upload usa URL assinada; nenhuma `service_role` vai para o navegador.
- São aceitos PNG, JPEG e WebP de até 3 MB e até 12.000 × 12.000 pixels.
- O backend baixa e inspeciona assinatura binária e dimensões antes de aceitar o arquivo.
- SVG, executáveis, arquivo disfarçado, `data:`, Base64, JavaScript e URL externa no formato v2 são rejeitados.
- Os buckets e campos atuais das questões são reutilizados; não há renderer paralelo.

## Banco de dados

Antes de usar o novo fluxo, aplique manualmente a migration `202609210001_question_import_batches_with_images.sql`. O rollback correspondente está versionado. O código não executa migration remota automaticamente.
