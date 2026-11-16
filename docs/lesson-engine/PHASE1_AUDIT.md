# Auditoria da fase 1

O fluxo preservado é: criar identidade e rascunho v2, salvar manualmente, visualizar pelo mesmo renderer do aluno, publicar snapshot imutável, editar novo rascunho, republicar, consultar histórico, restaurar uma versão para o rascunho, validar/importar JSON sem publicação e exportar a versão declarada.

Garantias verificadas por código e testes:

- preview e aluno usam `LessonRenderer`;
- rascunhos e histórico permanecem administrativos;
- publicação mantém controle otimista por `updated_at` e snapshots numerados imutáveis;
- restauração não altera nem apaga versões publicadas;
- importação inválida não substitui o estado atual;
- v1 permanece compatível e a conversão para v2 exige ação explícita;
- containers têm profundidade fechada e limite total de elementos;
- grids não usam largura fixa e empilham em telas menores;
- fórmulas são validadas recursivamente e ficam em áreas com overflow local;
- falhas de um bloco exibem fallback isolado;
- o editor sinaliza mudanças locais e intercepta atualização, fechamento e navegação antes de perder conteúdo.

A proteção paga é aplicada antes da consulta de aula na API e novamente na RLS. A mensagem de bloqueio não contém slug, título nem qualquer trecho do conteúdo.
