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
- Vários slots de `enunciado`/`contexto` são exibidos na ordem declarada em `imagens`, mesmo se os arquivos forem enviados em outra ordem. O texto de `enunciado` fica antes da lista, e `enunciado_pos_imagem` depois dela.
- A finalização grava cada URL, localização, `slot_id`, ordem, texto alternativo e legenda em `image_metadata`. `url_imagem` recebe a primeira imagem como fallback legado; o renderer não a duplica.
- Cadastro e edição individuais usam a mesma lista: é possível enviar vários arquivos, adicionar URL HTTPS, editar textos, remover associações e usar **Subir/Descer** para ordenar. Salvar sem alterar mantém as imagens e os metadados de alternativas/resolução.

Exemplo de dois slots no mesmo objeto de questão (além dos demais campos canônicos):

```json
"imagens": [
  { "slot_id": "figura-1", "local": "enunciado", "obrigatoria": true, "nome_arquivo_esperado": "figura-1.png", "texto_alternativo": "Diagrama inicial", "legenda": "Figura 1" },
  { "slot_id": "figura-2", "local": "enunciado", "obrigatoria": true, "nome_arquivo_esperado": "figura-2.png", "texto_alternativo": "Diagrama complementar", "legenda": "Figura 2" }
]
```

O armazenamento de várias imagens reutiliza o JSONB existente; não exige criar outra coluna. URLs sobrescritas por uma versão anterior do importador e que nunca foram guardadas nos metadados não podem ser reconstruídas automaticamente: nesses casos é necessário reenviar os arquivos.

Veja [`public/question-import/questoes-v2.example.json`](../../public/question-import/questoes-v2.example.json).

## Segurança e limites

- Administradores e editores podem importar em lote e enviar imagens. Os endpoints validam proprietário, lote, questão e slot no backend; cada usuário acessa somente seus próprios rascunhos.
- Upload usa URL assinada; nenhuma `service_role` vai para o navegador.
- São aceitos PNG, JPEG e WebP de até 3 MB e até 12.000 × 12.000 pixels.
- O backend baixa e inspeciona assinatura binária e dimensões antes de aceitar o arquivo.
- SVG, executáveis, arquivo disfarçado, `data:`, Base64, JavaScript e URL externa no formato v2 são rejeitados.
- Os buckets e campos atuais das questões são reutilizados; não há renderer paralelo.

## Banco de dados

Antes de usar o novo fluxo, aplique manualmente a migration `202609210001_question_import_batches_with_images.sql`. O rollback correspondente está versionado. O código não executa migration remota automaticamente.

Se a importação em lote já funciona para administradores, liberar o mesmo fluxo para editores exige somente a atualização do código. Não há SQL adicional para executar, nem é necessário reaplicar a migration existente.
