# Revisão das interfaces de afiliados e contratação

Implementação nas páginas reais sobre HEAD 2366add, preservando o checkout e as permissões financeiras. Estado inicial limpo, exceto anexos locais não versionados. Sem commit, push, deploy, SQL remoto, credenciais, alterações comerciais ou cobranças reais. Não é necessária migration.

## Causas confirmadas e correções

- AffiliatePage misturava painel e formulários administrativos, exigia IDs e mostrava históricos em parágrafos. Agora há componentes separados: AffiliateReport (indicadores/gráfico/históricos), ReportState (consulta/estados/paginação), AdminAffiliateDashboard (diretório/ações), AffiliateForms (modais). AdminAffiliatesPage preserva AdminGuard restrito a admin e AdminLayout.
- Login tinha gradiente fixo de slate-950 sob textos controlados pelo tema claro. Cadastro tinha labels claras e inputs com slate-950/50. Removidos fundos e blocos promocionais excessivos; superfícies, labels, placeholders e autofill usam tokens. CommerceHeader utiliza ThemeContext existente, sem segundo mecanismo de tema.
- TanStack Query pode conservar data após erro de refetch: PrepaidOptions mostrava erro e continuava lendo data. Agora não há oferta utilizável com erro, carregamento ou cache ainda não revalidado após montagem. Duração escolhida que desaparece não é substituída silenciosamente. Recuperação fica separada e continua usando o snapshot no servidor. Também foram protegidas respostas após desmontagem/troca de conta.
- loadPublicBillingPlans engolia erro e retornava vazio com um log alegando fallback. Agora propaga o erro para a apresentação recuperável. Nenhum preço alternativo foi criado.
- Fundador era apresentado mesmo bloqueado. showPlanForCheckout exige identidade resolvida e os flags canônicos retornados pelo servidor (entitlement ou convite), inclusive associação do catálogo à identidade atual. Nome do plano não prova elegibilidade. Direitos de quem já é fundador e validação backend permanecem.
- Cards agora são escolhas compactas alinhadas; um único checkout abaixo corresponde ao plano escolhido, com um só campo de cupom. Valores são os do servidor; singular/plural corrigido. Métodos adicionais ficam expansíveis.

## Administração e finanças

Busca de contas por nome/email é um endpoint adminProcedure, com 20 resultados por busca, validação de caracteres, escape de curingas e somente id/nome/email/ativo. O afiliado e o editor não podem usá-lo. Planos são consultados por endpoint administrativo paginado internamente, com somente id/nome/ativo; a interface usa nomes e checkboxes. Todos os planos preserva planIds=null; seleção específica preserva lista de IDs.

Criar/editar vínculo, cupom, dia de referência, liberar comissão e registrar repasse usam os mesmos schemas/RPCs. Modais têm foco inicial, Escape e retorno do foco ao acionador. Liberação tem confirmação; repasse exige confirmação de transferência já realizada, referência e data. Identidade de repasse persistida por afiliado e opção explícita de outra transferência foram preservadas; não há Pix automático.

Saldos são rotulados históricos. Confirmações, valor líquido e vendas são identificados como do período; gráficos usam salesByDay real e oferecem tabela acessível. Não há visitas, conversões, crescimento ou atribuição a vídeos inventados. Estados de carregamento, falha/refetch, ausência de vínculo, nenhuma venda e vínculo desativado são tratados. FORBIDDEN não concede dados nem cria vínculo; a tela orienta contato com administração.

## Verificação

182 testes de billing aprovados, 1 opcional pulado, 23 arquivos. Novos testes verificam fundador (entitlement/convite/visitante/em resolução), preço em cache com erro e ausência de botão de compra, remoção do prazo sem fallback silencioso, autorização das buscas administrativas para aluno/editor/anônimo e rejeição de filtro injetado. Testes anteriores de isolamento, repasses, idempotência e recuperação continuam aprovados.

Build cliente/servidor aprovado, com aviso preexistente de chunks grandes. TypeScript: os mesmos 11 erros preexistentes em AdminResolutionEditorPage, exports QuestionDifficulty e cast do parser em routers. Nenhum novo erro observado. git diff --check aprovado. A suíte fora de billing não foi executada.

Revisão interativa no navegador usando componentes reais e serviços simulados explícitos: 390px, tablet 768px e desktop 1440px; claro/escuro; seleção de plano/prazo, cupom, busca de conta, planos por nome no modal, Tab, Shift+Tab, Enter, Escape com retorno do foco, feedback Copiado, carregamento/erro e contas sem vínculo/inativas. Nenhum overflow da página foi observado nas larguras verificadas; tabelas têm rolagem local. Revisão por teclado é pontual, não auditoria completa de acessibilidade.

Reproduzido cached-error na fixture: dados antigos continuam disponíveis no mock, erro é mostrado, mas total do pacote e Pagar via Pix não são renderizados. Visitante/aluno inelegível não têm card fundador. Gráfico/tabela, cores de login nos dois temas e modais foram inspecionados por capturas, não só por renderização estática.

## Prévia e capturas

Executar: node node_modules/vite/bin/vite.js --config tools/billing-preview/vite.config.ts

Abrir http://127.0.0.1:5197/afiliados, /admin/afiliados, /login, /cadastro ou /planos. Na barra, alternar perfil/estado. Para login/cadastro usar perfil Sem login. A fixture usa aliases Vite locais, não carrega .env e bloqueia conexões externas por CSP. O conteúdo administrativo real é exercitado; o layout/guard externo de produção não é reproduzido pela fixture.

Capturas em tmp/affiliate-redesign: afiliado-claro/escuro, afiliado-sem-vinculo-celular, afiliado-sem-vendas-celular, admin-claro/escuro, admin-cupom-claro/escuro, admin-repasse-celular, login-claro/escuro, cadastro-celular-claro/escuro, planos-desktop-claro/escuro e planos-erro-cache-celular.

Continuam pendentes contas reais de homologação, Supabase, integração Mercado Pago sandbox, PostgreSQL nativo MVCC e autofill/tecnologias assistivas em todos os navegadores. Mock não valida autenticação real, persistência, cobrança nem concessão de acesso. Programa comercial não foi habilitado.
