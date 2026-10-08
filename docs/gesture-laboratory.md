# Laboratório administrativo de gestos — fases 1 e 2

Entrada: menu do ADM → **Laboratório de Gestos**, `/admin/laboratorio-gestos`.
O componente só monta depois do `AdminGuard` confirmar `admin` pela consulta
autenticada existente. Não há entrada no menu do aluno. O simulador real continua
em `/simuladores/geometria-espacial`, sem alterações.

## Funcionamento

- MediaPipe Tasks Vision **0.10.21**, Hand Landmarker, até duas mãos, delegate CPU.
  O módulo ESM e o WASM são carregados do jsDelivr; o modelo float16 versionado
  vem do armazenamento público do MediaPipe. Nenhum download entra no Git.
- A página é um chunk lazy. Biblioteca, modelo e permissão de câmera só são
  solicitados depois de **Ativar câmera**. Não há captura de áudio.
- Inferência local limitada a 15 vezes por segundo, sem chamadas sobrepostas e
  sem reprocessar o mesmo frame. Cursor espelhado com margem de 24 px e
  suavização exponencial de 0,3. O cursor só aciona itens do menu do laboratório.
- Palma com cinco dedos estendidos, estável por 1.000 ms: abre menu. Pinça sobre
  o mesmo item por 300 ms: confirma. Punho por 1.000 ms: cancela.
- Cooldown de 1.200 ms e trava até soltar o gesto. Mudar de alvo reinicia o
  tempo da pinça, sem liberar uma pinça já acionada. Perder a mão reinicia o
  reconhecimento. A classificação usa distâncias normalizadas pelo tamanho da
  palma e ângulos, sem exigir que a mão esquerda/direita tenha orientação fixa.
- Os limiares de detecção/presença/tracking são 0,75. O percentual que a API
  fornece em `handedness` mede a confiança na **lateralidade**, não a precisão
  dos pontos. A interface identifica essa distinção e não inventa uma medida.
- **Geometria Espacial** navega na mesma aba para `/admin/matematica/geometria-espacial`
  e encerra a câmera. Evita bloqueio
  de pop-ups acionados por inferência; o laboratório precisa ser reaberto para
  outra sessão. Os demais módulos mostram aviso de disponibilidade futura.
- Mouse, Tab, Enter/Espaço e Escape funcionam sem câmera. O menu centraliza-se
  na tela ao abrir e esconde os controles que ficariam atrás dele.

## Geometria Espacial administrativa

A rota `/admin/matematica/geometria-espacial` monta uma página própria atrás do
`AdminGuard`. Ela conserva os controles tradicionais do protótipo administrativo
e acrescenta um console de gestos carregado somente nessa página. A página e o
componente público em `/simuladores/geometria-espacial` não foram modificados.

- indicador controla o cursor; uma pinça mantida por 300 ms seleciona e captura;
- a mão capturada move o objeto no plano da câmera por projeção inversa e usa a
  profundidade relativa dos landmarks para deslocamento real em Z;
- pinça de polegar e médio rotaciona o objeto com base no punho e na mão;
- duas pinças estáveis alteram a escala proporcional com limites incrementais;
- palma aberta estável abre ferramentas com os sete sólidos já suportados;
- punho fechado cancela a manipulação ou fecha as ferramentas, sem apagar;
- perda da mão solta a captura e invalida a referência para evitar saltos;
- a calibração guarda somente uma referência efêmera de profundidade no browser.

O cursor usa `elementsFromPoint` como raycast da interface e somente aceita alvos
marcados dentro da raiz da página. Campos numéricos, fórmulas, cortes, medições,
projeções, precisão de coordenadas e ajustes detalhados continuam disponíveis por
mouse e teclado.

## Privacidade e ciclo de vida

Nenhum frame, landmark, foto, áudio ou dado biométrico é enviado ao backend.
Não há persistência, telemetria nova, chaves ou alteração de banco/autenticação.
As requisições externas são somente downloads de biblioteca/WASM/modelo.
Desativar, sair da rota, ocultar a aba ou descarregar o documento interrompe
tracks, cancela o animation frame e fecha o tracker. Uma geração de sessão
impede que permissões/downloads atrasados reativem uma câmera já cancelada.

`vercel.json` permite `camera=(self)` e compilação WASM somente nos documentos
do laboratório e da Geometria Espacial administrativa. O atalho usa navegação
completa para receber esses headers; as demais páginas conservam o bloqueio de
câmera. Microfone e geolocalização continuam bloqueados. HTTPS ou localhost é
necessário.

## Validação e limites

`server/gestureLab.test.ts` cobre classificação de mão aberta/espelhada,
pinça/punho, dados inválidos, limites do cursor, estabilidade, perda de mão,
dwell, troca de alvo, cooldown, repetição, projeção 3D, profundidade, rotação e
escala. Inclui também o isolamento da política de câmera por rota. Os 15 testes
do laboratório e os 2 testes existentes de logout/autorização administrativa passaram.
O build Vite + esbuild e `git diff --check` passaram. Como npm não está instalado
neste ambiente, foram executados diretamente os dois comandos do script build.
Uma checagem adicional de TypeScript encontrou 13 erros em quatro arquivos
preexistentes, sem erros nos arquivos desta entrega; eles não foram corrigidos.

Também foi usado um navegador Chrome local com câmera sintética e landmarks
controlados para conferir o guard real (respostas de autenticação simuladas),
controles, teclado, navegação, limpeza, permissão negada e layout. O runtime e
modelo reais do MediaPipe foram inicializados sob o CSP do laboratório.
Esses testes não equivalem à validação física de precisão com uma webcam.

Antes de considerar a demonstração estável, um administrador deve testar com
a própria mão: iluminação, distância, palma estável, pinça sem repetição,
punho, checkbox dos pontos, câmera desligando ao sair e retorno ao simulador.
Não foram testadas contas reais nem feitos pedidos de câmera ao usuário por
automação. Acesso do aluno foi verificado pelo guard e pela preservação da rota.

Esta versão não faz segmentação corporal, oclusão por silhueta, gravação, envio de
vídeo ou controle de outros simuladores. Inferência roda na thread principal com
frequência limitada; computadores lentos podem apresentar pausas. Profundidade de
webcam é uma estimativa relativa e exige calibração. Downloads precisam de rede na
primeira ativação. Falhas de câmera/WASM mostram fallback sem erros crus.

Referência: https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js
