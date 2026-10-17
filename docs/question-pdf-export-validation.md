# Correção da exportação de listas de questões

A reprodução com as questões públicas identificou a falha em Q00826:
`\underbrace` produz U+23DF no MathML, mas a fonte Unicode suplementar do PDF
não contém esse glifo. A exceção interrompia a lista inteira e a interface
exibia somente um erro genérico de navegador.

As chaves inferiores e superiores agora são desenhadas com curvas vetoriais
na largura da expressão, com a anotação posicionada abaixo/acima e com seus
espaços preservados. Não há substituição nem alteração da fórmula cadastrada.
Falhas de fonte/logo e símbolos ainda não suportados recebem mensagens próprias,
sem expor outros erros internos. O carregamento da fonte permite nova tentativa.

Validação local:

- 67 testes de PDF aprovados, incluindo regressões de chaves e recuperação de fonte.
- Build Vite do cliente e esbuild do servidor aprovados; aviso existente de bundles grandes.
- `git diff --check` aprovado.
- Reprodução de enunciados e alternativas das 2.525 questões públicas, uma por
  exportação, sem falhas após a correção. Essa reprodução não verifica imagens
  remotas nem usa a rota autenticada de exportação.
- Navegador: PDF sintético com matriz, chaves, alternativas e imagem gerado;
  lista sintética de 120 questões sem imagens gerada (63 páginas).
- Arquivo de regressão de duas páginas conferido com PDFium; chaves e legendas
  legíveis, com cabeçalho, marca d'água, alternativas e gabarito preservados.
- O navegador integrado não disponibilizou o evento de download para confirmar
  o salvamento físico; geração do Blob e acionamento do download foram verificados.

Não houve escrita no banco, migration ou alteração nas regras de acesso.
A suíte completa não foi reexecutada nesta correção concentrada no PDF.
