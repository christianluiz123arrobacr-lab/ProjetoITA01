# Motor de aulas — schemas 1 e 2

Os arquivos `lesson-v1.example.json` e `lesson-v2.example.json` documentam os contratos aceitos. `metadata` identifica a aula e `lesson` contém somente blocos estruturados. Os valores de `discipline`, `content` e `subject` precisam existir na taxonomia das questões do ambiente de destino.

No ADM, abra **Conteúdo → Aulas**, entre em uma aula e use **Validar sem importar**. A validação ocorre no servidor e não altera o rascunho. Depois use **Importar no rascunho**, confirme a substituição, revise o preview e salve manualmente. Importar nunca publica.

Imagens usam caminhos relativos dentro do bucket `lesson-images`; Base64, URL externa, HTML e JavaScript são rejeitados. Cada bloco, coluna e passo de demonstração precisa de um `id` estável e único no documento.

## Compatibilidade

- Aulas v1 continuam válidas, editáveis, exportáveis e renderizadas sem republicação.
- A importação preserva a versão declarada; não há conversão silenciosa.
- O editor oferece uma conversão explícita de v1 para v2. Ela apenas muda a versão e preserva os blocos simples existentes.
- Aulas novas começam em v2.
- V2 permite blocos simples na raiz, `section` e `grid`. Uma seção aceita blocos simples e grids; colunas de grid aceitam somente blocos simples. Seções e grids não podem ser aninhados indefinidamente.

## Blocos v2

`formula_card` organiza fórmula, termos, unidade SI, condições, observações e uma demonstração opcional. `derivation` contém passos identificados e pode iniciar aberto ou recolhido. O conteúdo escolhe somente variantes semânticas fechadas; classes CSS nunca vêm do JSON.

Os presets de grid são `one`, `two`, `three`, `four`, `one_third_two_thirds` e `two_thirds_one_third`. Todas as combinações empilham no celular pelo mesmo `LessonRenderer` usado no preview e na leitura do aluno.

## Publicação e acesso

O rascunho continua separado dos snapshots imutáveis. A publicação valida conteúdo e taxonomia no servidor e cria uma nova versão. A rota de leitura verifica o acesso ativo antes de consultar o slug; a RLS aplica a mesma exigência às tabelas. Administradores mantêm acesso integral.

Para habilitar a fase 1 no banco, aplique manualmente `supabase/migrations/202609150001_lesson_engine_phase1.sql` depois da migration do MVP. O rollback recusa execução se já existirem documentos v2, evitando perda silenciosa.
