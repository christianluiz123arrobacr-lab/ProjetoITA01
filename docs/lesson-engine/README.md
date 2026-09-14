# Motor de aulas — schema 1

O arquivo `lesson-v1.example.json` é o contrato de intercâmbio do MVP. `metadata` identifica a aula e `lesson` contém somente blocos estruturados. Os valores de `discipline`, `content` e `subject` precisam existir na taxonomia das questões do ambiente de destino.

No ADM, abra **Conteúdo → Aulas**, entre em uma aula e use **Validar sem importar**. A validação ocorre no servidor e não altera o rascunho. Depois use **Importar no rascunho**, confirme a substituição, revise o preview e salve manualmente. Importar nunca publica.

Imagens usam caminhos relativos dentro do bucket público `lesson-images`; Base64, URL externa, HTML e JavaScript são rejeitados. Cada bloco precisa de um `id` estável e único.
