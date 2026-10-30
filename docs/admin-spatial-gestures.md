# Bancada administrativa de Geometria Espacial por Gestos

Esta bancada é separada do simulador de alunos. A câmera só é aberta por ação explícita do administrador. Vídeo e landmarks são processados no navegador; a aplicação não os grava nem envia ao backend.

## Uso

- Abra **Diagnóstico** para observar FPS da câmera, frequência de inferência, atualizações da cena SVG, tempo por resultado, idade da última observação, confiança fornecida pelo rastreador e estado de cada mão. A taxa de inferência é limitada a aproximadamente 15 Hz; o desempenho real depende do dispositivo. Zero atualizações da cena quando ela está parada é esperado.
- **Mover** é o modo inicial: faça pinça com indicador sobre um objeto para capturá-lo. Duas mãos podem mover dois objetos diferentes. Uma mão não pode assumir o objeto já capturado pela outra. Soltar uma pinça libera somente aquele objeto.
- Em **Ferramentas → Transformar**, escolha **Rotacionar** e inicie a pinça com o indicador sobre o objeto. A pinça configurada com médio ou mindinho também funciona neste modo. O deslocamento contínuo gira o objeto; soltar encerra sem mudança adicional. Arrastar o fundo com mouse continua girando apenas a câmera.
- **Escalar** é um modo explícito: duas pinças alteram a escala do objeto selecionado. A distância inicial é registrada novamente a cada operação. No modo Mover, duas pinças em objetos diferentes **não** escalam nada.
- O cursor é atualizado em cada quadro visual a partir da observação local mais recente. A cena SVG é atualizada quando a geometria muda; nenhuma meta fixa de FPS de rastreamento é prometida.
- No painel **Análise**, é possível selecionar vértices, arestas, faces ou um ponto livre na face. O encaixe prioriza vértice, depois aresta, depois face. A medição entre dois vértices ou pontos da superfície usa coordenadas 3D transformadas e atualiza quando os sólidos mudam. Comprimento de aresta e área de faces planas também usam a malha transformada. Faces de superfícies curvas exibem explicitamente uma aproximação poligonal.

## Limitações técnicas

O motor atual é uma cena 3D projetada em SVG, não uma cena Three.js. A escolha de face usa interseção de raio com triângulos da malha; para a esfera, cilindro e cone, isso representa a malha poligonal, não uma superfície analítica perfeita. Medidas como ângulo entre arestas, distância ponto–plano, interseção de planos e paralelismo ainda não são oferecidas como resultados exatos. Não devem ser simuladas com centros ou coordenadas de tela.

A visualização da câmera e o esqueleto já existem, mas não há segmentação corporal nem mapa de profundidade. Para que um sólido passe *realmente* atrás do corpo, será necessário segmentar a pessoa por quadro, calibrar a câmera e compor vídeo e cena com máscara de profundidade/oclusão. Uma webcam RGB comum não fornece profundidade física precisa por si só; nenhuma oclusão artificial foi adicionada.

Os testes automatizados usam landmarks e malhas simulados. A precisão física, a estabilidade em cruzamento rápido das mãos e a fluidez em hardware real precisam de uma sessão manual com webcam autorizada pelo usuário. O botão de calibração atual ajusta a referência de profundidade; sensibilidade, suavização e zona morta ficam nas configurações existentes e podem ser restauradas ao padrão.
