import { useMemo, useState, type ElementType, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Brain,
  ChevronDown,
  ChevronUp,
  Compass,
  Gauge,
  Layers,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { Link } from "wouter";

const eletrostaticaMarkdown = String.raw`
# Eletrostática

## 1. Contexto físico e histórico

A Eletrostática é a parte da Eletricidade que estuda as cargas elétricas em repouso e os efeitos produzidos por elas. Quando falamos em cargas “em repouso”, estamos dizendo que o foco não está em correntes elétricas atravessando circuitos, nem em campos magnéticos variáveis, nem em motores, resistores ou geradores funcionando. O foco está em entender como corpos eletrizados interagem, como produzem forças, como criam campos elétricos, como armazenam energia e como se comportam quando atingem equilíbrio eletrostático.

A palavra “eletrostática” pode ser separada em duas ideias:

- “eletro”, ligada aos fenômenos elétricos;
- “estática”, ligada a uma situação sem movimento macroscópico persistente de cargas.

Isso não significa que nada microscópico esteja acontecendo. Em um metal, por exemplo, os elétrons livres podem se reorganizar rapidamente quando um corpo carregado se aproxima. Mas, depois que o equilíbrio eletrostático é atingido, não há corrente elétrica permanente dentro do condutor.

Essa distinção é importante. Um condutor pode ter elétrons livres. Esses elétrons podem se mover durante um curto intervalo enquanto o sistema se reorganiza. Mas, no equilíbrio eletrostático, eles já se distribuíram de tal forma que não existe mais campo elétrico resultante no interior do material condutor capaz de manter um movimento ordenado de cargas.

Historicamente, a Eletricidade começou com observações simples. Um dos registros mais antigos vem da Grécia antiga, quando se percebeu que o âmbar, ao ser atritado com certos tecidos ou peles, adquiria a capacidade de atrair pequenos corpos, como palhas, penas e fragmentos leves de matéria. Em grego, âmbar era chamado de *élektron*, daí surgiram palavras como elétron e eletricidade.

Durante muito tempo, esse tipo de fenômeno foi visto quase como curiosidade. Um material esfregado atraindo pedacinhos de papel parecia algo isolado, sem grande conexão com a estrutura profunda da matéria. Só depois, com o desenvolvimento do método experimental e com cientistas como William Gilbert, Stephen Gray, Charles Du Fay, Benjamin Franklin, Charles Coulomb, Faraday e outros, a eletricidade passou a ser organizada como uma teoria física consistente.

William Gilbert estudou fenômenos elétricos e magnéticos e ajudou a separar a atração elétrica da atração magnética. Isso foi importante porque, por fora, ambas parecem “forças misteriosas à distância”. Mas elas têm naturezas diferentes.

Stephen Gray mostrou que a eletricidade podia ser transmitida de um corpo para outro por contato, abrindo caminho para a distinção entre materiais condutores e isolantes.

Du Fay propôs a existência de dois tipos de eletricidade, que mais tarde seriam reinterpretados como cargas positivas e negativas.

Benjamin Franklin ajudou a consolidar uma linguagem de cargas positivas e negativas. Hoje sabemos que, nos processos comuns de eletrização, o que realmente se transfere de um corpo para outro são elétrons. Um corpo fica positivo quando perde elétrons e fica negativo quando ganha elétrons.

Coulomb, no século XVIII, deu um passo decisivo: mediu quantitativamente a força entre corpos eletrizados e chegou à lei que hoje leva seu nome. A Lei de Coulomb mostrou que a força elétrica entre cargas puntiformes depende do produto das cargas e diminui com o quadrado da distância entre elas.

A partir daí, a Eletrostática deixou de ser apenas uma coleção de fenômenos curiosos e passou a ser uma teoria matemática poderosa.

A Eletrostática é importante porque serve como base para vários conteúdos posteriores:

- campo elétrico;
- potencial elétrico;
- energia potencial elétrica;
- capacitores;
- corrente elétrica;
- circuitos;
- eletrodinâmica;
- eletromagnetismo;
- eletrônica;
- descargas atmosféricas;
- física moderna.

Muitos fenômenos cotidianos têm origem eletrostática:

- o choque ao tocar uma maçaneta depois de andar sobre um tapete;
- o cabelo arrepiado ao encostar em um gerador eletrostático;
- o balão que gruda na parede depois de ser atritado no cabelo;
- a roupa que “cola” no corpo em dias secos;
- faíscas ao tirar um casaco de lã;
- raios em tempestades;
- funcionamento de impressoras e copiadoras;
- para-raios;
- blindagem eletrostática;
- atração de pequenos papéis por uma régua atritada.

O objetivo da Eletrostática não é apenas calcular força entre cargas. Isso seria reduzir um assunto enorme a uma continha com $F = kq_1q_2/d^2$, o que empobrece bastante o estudo de um conteúdo tão central.

O objetivo real é entender uma cadeia de ideias:

1. A matéria possui cargas elétricas.
2. Essas cargas podem estar equilibradas ou em excesso.
3. Corpos eletrizados interagem.
4. Essa interação pode ser descrita por forças.
5. Cargas criam campos elétricos no espaço.
6. Campos elétricos determinam forças sobre outras cargas.
7. A configuração de cargas pode armazenar energia potencial elétrica.
8. O potencial elétrico descreve energia por unidade de carga.
9. Condutores respondem de maneira especial porque possuem cargas livres.
10. Fenômenos como indução, blindagem eletrostática e poder das pontas surgem da redistribuição dessas cargas.

A Eletrostática é, portanto, o estudo de como a carga elétrica organiza forças, campos, potenciais e energia no espaço.

---

## 2. Ideia intuitiva de carga elétrica

Carga elétrica é uma propriedade da matéria associada às interações elétricas.

Assim como a massa está associada à interação gravitacional, a carga elétrica está associada à interação elétrica. Um corpo com massa interage gravitacionalmente. Um corpo com carga elétrica interage eletricamente.

Mas existe uma diferença essencial.

A gravidade, no modelo clássico usual, é sempre atrativa. Massas se atraem.

A interação elétrica pode ser atrativa ou repulsiva. Cargas de sinais opostos se atraem. Cargas de mesmo sinal se repelem.

Na estrutura básica da matéria, temos três partículas importantes para começar:

- prótons;
- nêutrons;
- elétrons.

Os prótons ficam no núcleo do átomo e possuem carga positiva.

Os elétrons ficam na eletrosfera e possuem carga negativa.

Os nêutrons ficam no núcleo e não possuem carga elétrica resultante.

A carga elétrica elementar é representada por $e$ e vale aproximadamente:

$$
e = 1{,}6 \times 10^{-19} \ \text{C}
$$

A carga do próton é:

$$
q_p = +e
$$

A carga do elétron é:

$$
q_e = -e
$$

A carga do nêutron é:

$$
q_n = 0
$$

Um corpo eletricamente neutro não é um corpo sem cargas. Esse é um erro muito comum.

Um corpo neutro possui cargas positivas e negativas em quantidades equivalentes, de modo que a soma algébrica das cargas é zero.

Por exemplo, se um corpo possui $N$ prótons e $N$ elétrons, sua carga total é:

$$
Q = N(+e) + N(-e)
$$

$$
Q = Ne - Ne
$$

$$
Q = 0
$$

Então, um corpo neutro tem cargas, sim. Ele apenas tem equilíbrio entre cargas positivas e negativas.

Um corpo positivamente eletrizado possui falta de elétrons. Isso acontece quando ele perde elétrons. Como os prótons permanecem presos no núcleo, o corpo fica com mais carga positiva do que negativa.

Um corpo negativamente eletrizado possui excesso de elétrons. Isso acontece quando ele ganha elétrons.

Portanto:

- corpo neutro: número de prótons igual ao número de elétrons;
- corpo positivo: perdeu elétrons;
- corpo negativo: ganhou elétrons.

É importante insistir nesse ponto: nos processos comuns de eletrização, normalmente quem se move são os elétrons, não os prótons.

Os prótons estão presos no núcleo atômico. Tirar prótons de um corpo envolveria alterações nucleares, não simples eletrização por atrito, contato ou indução. Então, quando uma questão diz que um corpo ficou positivo, não pense que ele “ganhou prótons”. Ele ficou positivo porque perdeu elétrons.

### Por que usamos o coulomb?

A unidade de carga elétrica no Sistema Internacional é o coulomb, símbolo $\text{C}$.

O coulomb é uma unidade grande quando comparada à carga de um único elétron. Como:

$$
e = 1{,}6 \times 10^{-19} \ \text{C}
$$

uma carga de $1 \ \text{C}$ corresponde a uma quantidade gigantesca de cargas elementares.

O número de elétrons correspondente a $1 \ \text{C}$ é:

$$
n = \frac{1}{1{,}6 \times 10^{-19}}
$$

$$
n \approx 6{,}25 \times 10^{18}
$$

Ou seja, $1 \ \text{C}$ equivale ao módulo da carga de aproximadamente $6{,}25 \times 10^{18}$ elétrons.

Por isso, em Eletrostática de laboratório e vestibular, aparecem muito submúltiplos do coulomb:

$$
1 \ \text{mC} = 10^{-3} \ \text{C}
$$

$$
1 \ \mu\text{C} = 10^{-6} \ \text{C}
$$

$$
1 \ \text{nC} = 10^{-9} \ \text{C}
$$

$$
1 \ \text{pC} = 10^{-12} \ \text{C}
$$

### Exemplos cotidianos

Quando você esfrega um balão no cabelo, pode haver transferência de elétrons entre os materiais. Dependendo dos materiais envolvidos, o balão pode ficar eletrizado negativamente e o cabelo positivamente. Como os fios de cabelo ficam com cargas de mesmo sinal entre si, eles se repelem e podem se arrepiar.

Quando você anda sobre um tapete em um dia seco e depois toca uma maçaneta metálica, cargas acumuladas no seu corpo podem se transferir rapidamente para a maçaneta, gerando uma pequena descarga elétrica. Essa descarga é o “choquinho”.

Quando uma régua plástica atritada atrai pedacinhos de papel, isso não significa necessariamente que o papel estava eletrizado. O papel pode estar neutro e sofrer polarização, isto é, uma reorganização local de cargas.

A ideia central é:

> carga elétrica é uma propriedade da matéria que pode estar equilibrada ou em excesso. Quando há desequilíbrio, aparecem interações elétricas perceptíveis.

---

## 3. Princípios fundamentais da carga elétrica

A Eletrostática se apoia em princípios fundamentais. Eles são simples de enunciar, mas profundos na aplicação.

Os três mais importantes são:

1. atração e repulsão;
2. conservação da carga elétrica;
3. quantização da carga elétrica.

---

## 3.1 Atração e repulsão

Cargas elétricas de mesmo sinal se repelem.

Cargas elétricas de sinais opostos se atraem.

Assim:

- positivo com positivo: repulsão;
- negativo com negativo: repulsão;
- positivo com negativo: atração.

Em linguagem simbólica:

$$
(+,+) \Rightarrow \text{repulsão}
$$

$$
(-,-) \Rightarrow \text{repulsão}
$$

$$
(+,-) \Rightarrow \text{atração}
$$

Esse princípio parece simples, mas o aluno erra quando tenta aplicá-lo sem olhar o sistema inteiro.

Por exemplo, se um corpo eletrizado atrai um corpo neutro, isso não significa necessariamente que o corpo neutro tenha carga oposta. Um corpo neutro pode ser atraído por um corpo eletrizado devido à indução ou polarização.

Imagine um bastão negativo aproximado de uma esfera metálica neutra. Os elétrons livres da esfera são repelidos para o lado mais distante. O lado próximo fica com excesso relativo de cargas positivas. Como esse lado positivo fica mais perto do bastão negativo, a atração pode ser maior que a repulsão do lado distante. Resultado: a esfera neutra é atraída.

Então, a frase “corpos se atraem, logo têm sinais opostos” é perigosa.

O correto é:

> se dois corpos puntiformes eletrizados se atraem, suas cargas têm sinais opostos; mas, para corpos extensos ou neutros polarizáveis, a atração também pode ocorrer por redistribuição de cargas.

Essa é uma sutileza pequena no texto e enorme na prova.

---

## 3.2 Conservação da carga elétrica

A carga elétrica total de um sistema eletricamente isolado se conserva.

Isso significa que, em processos comuns, carga elétrica não é criada nem destruída. Ela é transferida ou redistribuída.

A expressão fundamental é:

$$
\sum Q_{\text{antes}} = \sum Q_{\text{depois}}
$$

Se dois corpos neutros são atritados e um deles fica com carga $+Q$, o outro deve ficar com carga $-Q$, desde que o sistema esteja isolado.

Antes:

$$
Q_{\text{total, antes}} = 0
$$

Depois:

$$
Q_{\text{total, depois}} = (+Q) + (-Q)
$$

$$
Q_{\text{total, depois}} = 0
$$

A carga total foi conservada.

### Exemplo com atrito

Um bastão de vidro e um tecido de seda estão inicialmente neutros.

Após o atrito, suponha que o vidro fique com carga $+4 \ \mu\text{C}$.

Pela conservação da carga, a seda deve ficar com carga:

$$
Q_{\text{seda}} = -4 \ \mu\text{C}
$$

A carga total continua sendo:

$$
Q_{\text{total}} = +4 \ \mu\text{C} - 4 \ \mu\text{C}
$$

$$
Q_{\text{total}} = 0
$$

### Exemplo com contato

Duas esferas condutoras idênticas têm cargas $Q_1 = +6 \ \mu\text{C}$ e $Q_2 = -2 \ \mu\text{C}$.

A carga total antes do contato é:

$$
Q_{\text{total}} = Q_1 + Q_2
$$

$$
Q_{\text{total}} = +6 \ \mu\text{C} - 2 \ \mu\text{C}
$$

$$
Q_{\text{total}} = +4 \ \mu\text{C}
$$

Se as esferas são idênticas, após o contato a carga se divide igualmente:

$$
Q_f = \frac{Q_{\text{total}}}{2}
$$

$$
Q_f = \frac{+4 \ \mu\text{C}}{2}
$$

$$
Q_f = +2 \ \mu\text{C}
$$

Cada esfera fica com:

$$
Q_f = +2 \ \mu\text{C}
$$

A soma continua sendo:

$$
+2 \ \mu\text{C} + +2 \ \mu\text{C} = +4 \ \mu\text{C}
$$

A carga total se conserva. O que mudou foi a distribuição.

---

## 3.3 Quantização da carga elétrica

A carga elétrica é quantizada. Isso significa que ela aparece em múltiplos inteiros da carga elementar.

A fórmula é:

$$
Q = ne
$$

ou, considerando o sinal:

$$
Q = \pm ne
$$

Em que:

- $Q$ é a carga elétrica total;
- $n$ é um número inteiro;
- $e$ é a carga elementar;
- $e = 1{,}6 \times 10^{-19} \ \text{C}$.

A carga do próton é:

$$
+e = +1{,}6 \times 10^{-19} \ \text{C}
$$

A carga do elétron é:

$$
-e = -1{,}6 \times 10^{-19} \ \text{C}
$$

Como elétrons são transferidos em unidades inteiras, um corpo pode ganhar 1 elétron, 2 elétrons, 3 elétrons, mas não pode ganhar $0{,}5$ elétron em um processo comum.

Por isso, não faz sentido um corpo ter carga:

$$
Q = 0{,}5e
$$

ou:

$$
Q = 2{,}3e
$$

Em processos comuns, a carga deve ser múltiplo inteiro de $e$.

### Exemplo numérico 1

Um corpo perdeu $5{,}0 \times 10^{12}$ elétrons. Determine sua carga.

Se perdeu elétrons, ficou positivo.

A carga adquirida é:

$$
Q = ne
$$

Substituindo:

$$
Q = 5{,}0 \times 10^{12} \cdot 1{,}6 \times 10^{-19}
$$

Multiplicando os números:

$$
5{,}0 \cdot 1{,}6 = 8{,}0
$$

Multiplicando as potências:

$$
10^{12} \cdot 10^{-19} = 10^{-7}
$$

Logo:

$$
Q = 8{,}0 \times 10^{-7} \ \text{C}
$$

Como o corpo perdeu elétrons:

$$
Q = +8{,}0 \times 10^{-7} \ \text{C}
$$

### Exemplo numérico 2

Um corpo está eletrizado com carga:

$$
Q = -3{,}2 \times 10^{-6} \ \text{C}
$$

Quantos elétrons ele ganhou?

Como a carga é negativa, ele ganhou elétrons.

Usamos:

$$
|Q| = ne
$$

Então:

$$
n = \frac{|Q|}{e}
$$

Substituindo:

$$
n = \frac{3{,}2 \times 10^{-6}}{1{,}6 \times 10^{-19}}
$$

Dividindo os coeficientes:

$$
\frac{3{,}2}{1{,}6} = 2
$$

Dividindo as potências:

$$
\frac{10^{-6}}{10^{-19}} = 10^{13}
$$

Logo:

$$
n = 2 \times 10^{13}
$$

O corpo ganhou:

$$
2 \times 10^{13} \ \text{elétrons}
$$

---

## 4. Condutores, isolantes e semicondutores

A resposta de um material a fenômenos elétricos depende muito da liberdade de movimento de suas cargas internas.

A diferença entre condutor e isolante não é a existência ou ausência de cargas. Todos os materiais comuns possuem prótons e elétrons. A diferença está em como essas cargas conseguem se mover dentro do material.

---

## 4.1 Condutores

Condutores são materiais que possuem cargas elétricas livres para se movimentar com relativa facilidade.

Nos metais, essas cargas móveis são principalmente os elétrons livres. Eles não pertencem rigidamente a um único átomo. Em uma imagem simplificada, podemos pensar nos íons positivos do metal formando uma estrutura relativamente fixa, enquanto parte dos elétrons se movimenta pelo material.

Exemplos de condutores:

- cobre;
- alumínio;
- prata;
- ouro;
- ferro;
- grafite;
- soluções iônicas;
- gases ionizados.

O cobre é muito usado em fios elétricos porque conduz bem. O plástico ao redor do fio é isolante, impedindo contato elétrico acidental.

Em um condutor eletrizado em equilíbrio, o excesso de carga fica na superfície externa. Isso acontece porque as cargas livres se repelem e se redistribuem até atingir uma configuração estável.

Se colocamos cargas em excesso dentro de um condutor, elas não ficam paradas no volume interno como se o material fosse uma esponja elétrica. Elas se movem até a superfície. Isso é consequência da mobilidade das cargas e da repulsão elétrica entre cargas de mesmo sinal.

### Condutor sólido e solução condutora

Em metais, os portadores móveis são elétrons.

Em soluções iônicas, como água com sal dissolvido, os portadores móveis são íons positivos e negativos.

Em gases ionizados, como em descargas elétricas, podem se mover elétrons e íons.

Então, “corrente elétrica” nem sempre significa elétrons se movendo. Em metal, sim. Em solução, também há movimento de íons. Mas, nos problemas básicos de Eletrostática envolvendo esferas metálicas, pense principalmente em elétrons livres.

---

## 4.2 Isolantes

Isolantes são materiais nos quais as cargas não se movem livremente pelo material.

Exemplos:

- vidro;
- borracha;
- plástico;
- madeira seca;
- ar seco;
- porcelana;
- lã;
- seda;
- isopor.

É importante entender:

> isolante não significa material sem carga.

Todo material comum possui prótons e elétrons. A diferença é que, em um isolante, essas cargas não se deslocam facilmente por grandes distâncias dentro do material.

Por isso, se você eletriza uma região de um isolante, a carga tende a permanecer mais localizada. Já em um condutor, a carga se redistribui pela superfície.

Um bastão plástico atritado, por exemplo, pode ficar eletrizado em uma região específica. Como o plástico é isolante, a carga não se espalha facilmente por todo o bastão.

---

## 4.3 Semicondutores

Semicondutores são materiais com comportamento intermediário entre condutores e isolantes.

Exemplos:

- silício;
- germânio.

Eles são fundamentais na eletrônica moderna porque sua condutividade pode ser controlada. É por causa deles que existem diodos, transistores, microchips, processadores, sensores e praticamente toda a eletrônica atual.

Neste tópico, não vamos aprofundar semicondutores, porque isso pertence mais à Física Moderna e à Eletrônica. Mas vale guardar a ideia: eles não são bons condutores como metais nem bons isolantes como vidro ou borracha. Eles são materiais cuja condutividade pode ser ajustada por temperatura, impurezas, campos elétricos e luz.

---

## 5. Processos de eletrização

Eletrizar um corpo significa alterar o equilíbrio entre suas cargas positivas e negativas.

Em processos comuns, isso ocorre pela transferência ou redistribuição de elétrons.

Os principais processos são:

- eletrização por atrito;
- eletrização por contato;
- eletrização por indução.

---

## 5.1 Eletrização por atrito

A eletrização por atrito ocorre quando dois corpos, inicialmente neutros e de materiais diferentes, são atritados entre si e trocam elétrons.

Após o atrito:

- um corpo perde elétrons e fica positivo;
- o outro ganha elétrons e fica negativo.

Se o sistema é isolado, as cargas adquiridas têm mesmo módulo e sinais opostos.

Se um corpo fica com carga $+Q$, o outro fica com carga $-Q$.

A carga total antes era:

$$
Q_{\text{antes}} = 0
$$

A carga total depois é:

$$
Q_{\text{depois}} = (+Q) + (-Q)
$$

$$
Q_{\text{depois}} = 0
$$

A carga se conserva.

### O atrito cria cargas?

Não. Essa frase é perigosa.

O atrito não cria carga elétrica do nada. Ele favorece a transferência de elétrons entre materiais. A carga total do sistema continua se conservando.

Se um corpo ficou negativo, é porque ganhou elétrons.

Se outro ficou positivo, é porque perdeu elétrons.

O atrito apenas facilitou a troca.

### Exemplos

Quando um pente plástico é atritado no cabelo, pode ocorrer transferência de elétrons. O pente fica eletrizado e passa a atrair pequenos pedaços de papel.

Quando um balão é esfregado no cabelo, ele pode ficar eletrizado e grudar em uma parede neutra devido à polarização das cargas na parede.

Quando vidro é atritado com seda, um pode perder elétrons e o outro ganhar elétrons.

Quando plástico é atritado com lã, a transferência de elétrons depende da natureza dos materiais.

### Série triboelétrica

A série triboelétrica organiza materiais de acordo com sua tendência de perder ou ganhar elétrons quando atritados com outros materiais.

Não vale transformar isso em decoreba cega. A ideia importante é:

> materiais diferentes têm diferentes tendências de segurar elétrons. Quando atritados, um pode ceder elétrons com mais facilidade e o outro pode recebê-los.

O material que perde elétrons fica positivo.

O material que ganha elétrons fica negativo.

---

## 5.2 Eletrização por contato

A eletrização por contato ocorre quando um corpo eletrizado toca outro corpo condutor.

Durante o contato, cargas se redistribuem entre os corpos até que o sistema atinja equilíbrio eletrostático.

Se os corpos forem condutores idênticos, a carga total se divide igualmente.

Para duas esferas condutoras idênticas com cargas iniciais $Q_1$ e $Q_2$, após o contato cada uma fica com:

$$
Q_f = \frac{Q_1 + Q_2}{2}
$$

Essa fórmula só vale diretamente para corpos idênticos.

Se os corpos não forem idênticos, a divisão de carga depende das dimensões, formas e capacitâncias dos corpos. Em termos mais avançados, no equilíbrio eles ficam no mesmo potencial, não necessariamente com cargas iguais.

### Por que esferas idênticas ficam com cargas iguais?

Porque, sendo idênticas, têm a mesma geometria e a mesma capacidade de distribuir carga. Ao serem colocadas em contato, formam temporariamente um único condutor. As cargas se movimentam até que não haja diferença de potencial entre elas. Como são idênticas, a distribuição final fica simétrica.

### Exemplo numérico 1

Duas esferas metálicas idênticas têm cargas:

$$
Q_1 = +8 \ \mu\text{C}
$$

$$
Q_2 = 0
$$

Após contato e separação, a carga final de cada uma é:

$$
Q_f = \frac{Q_1 + Q_2}{2}
$$

$$
Q_f = \frac{8 + 0}{2}
$$

$$
Q_f = +4 \ \mu\text{C}
$$

Cada esfera fica com:

$$
Q_f = +4 \ \mu\text{C}
$$

### Exemplo numérico 2

Duas esferas metálicas idênticas têm cargas:

$$
Q_1 = +10 \ \mu\text{C}
$$

$$
Q_2 = -4 \ \mu\text{C}
$$

A carga total é:

$$
Q_{\text{total}} = +10 - 4
$$

$$
Q_{\text{total}} = +6 \ \mu\text{C}
$$

Como são idênticas:

$$
Q_f = \frac{+6}{2}
$$

$$
Q_f = +3 \ \mu\text{C}
$$

Cada esfera fica com:

$$
Q_f = +3 \ \mu\text{C}
$$

### Contato com a Terra

A Terra pode funcionar como um enorme reservatório de cargas. Quando um condutor é aterrado, elétrons podem entrar ou sair dele, dependendo da situação.

Isso será essencial para entender a eletrização por indução.

---

## 5.3 Eletrização por indução

A eletrização por indução é uma das partes mais importantes e mais confundidas da Eletrostática.

Na indução, não é necessário contato entre o corpo carregado e o corpo que será eletrizado.

O corpo carregado que provoca a separação de cargas é chamado de indutor.

O corpo que sofre a influência é chamado de induzido.

A ideia básica é:

> um corpo eletrizado, ao ser aproximado de um condutor neutro, reorganiza as cargas livres desse condutor.

Vamos analisar com calma.

### Caso 1: bastão negativo aproximado de esfera metálica neutra

Considere um bastão negativamente eletrizado aproximado de uma esfera metálica neutra.

A esfera tem elétrons livres. Como o bastão é negativo, ele repele os elétrons da esfera para o lado mais distante.

Então:

- o lado próximo ao bastão fica com falta relativa de elétrons, portanto fica positivo;
- o lado distante fica com excesso de elétrons, portanto fica negativo.

A esfera como um todo ainda está neutra, porque não houve perda nem ganho total de elétrons. Apenas houve separação interna de cargas.

Essa etapa é apenas indução no sentido de separação de cargas. Ainda não houve eletrização líquida da esfera.

Agora conectamos a esfera à Terra por meio de um fio condutor.

Como o bastão negativo repele os elétrons, esses elétrons podem escapar da esfera para a Terra.

A Terra funciona como um enorme reservatório de cargas, capaz de receber ou fornecer elétrons sem grande alteração de seu potencial.

A sequência correta é:

1. aproximar o bastão negativo;
2. aterrar a esfera;
3. permitir que elétrons escapem para a Terra;
4. retirar o aterramento mantendo o bastão próximo;
5. afastar o bastão.

Bastão negativo aproximado de esfera neutra:

1. Bastão negativo repele elétrons da esfera.
2. Elétrons se afastam para o lado oposto.
3. Com aterramento, elétrons vão para a Terra.
4. Retira-se o aterramento.
5. Afasta-se o bastão.

Depois disso, a esfera fica com falta de elétrons. Portanto, fica carregada positivamente.

Resultado:

$$
\text{indutor negativo} \Rightarrow \text{induzido positivo}
$$

### Caso 2: bastão positivo aproximado de esfera metálica neutra

Agora considere um bastão positivamente eletrizado aproximado de uma esfera metálica neutra.

O bastão positivo atrai os elétrons livres da esfera para o lado mais próximo.

Então:

- o lado próximo ao bastão fica com excesso de elétrons, portanto fica negativo;
- o lado distante fica com falta relativa de elétrons, portanto fica positivo.

Sem aterramento, a esfera continua neutra. Só houve separação interna de cargas.

Agora aterramos a esfera.

Como o bastão positivo atrai elétrons, elétrons da Terra sobem pelo fio terra e entram na esfera.

A esfera passa a receber elétrons.

Depois, retiramos o aterramento mantendo o bastão próximo.

Por fim, afastamos o bastão.

A esfera fica com excesso de elétrons. Portanto, fica carregada negativamente.

Resultado:

$$
\text{indutor positivo} \Rightarrow \text{induzido negativo}
$$

### Regra geral da indução com aterramento

Em uma eletrização por indução com aterramento, o corpo induzido termina com carga de sinal oposto ao do corpo indutor.

Assim:

$$
\text{indutor negativo} \Rightarrow \text{induzido positivo}
$$

$$
\text{indutor positivo} \Rightarrow \text{induzido negativo}
$$

### Sem aterramento há eletrização?

Não necessariamente.

Sem aterramento, se apenas aproximamos um corpo carregado de um condutor neutro, ocorre separação de cargas, mas a carga líquida total do condutor continua zero.

O lado próximo pode ficar com sinal oposto ao do indutor, e o lado distante pode ficar com sinal igual ao do indutor, mas a soma total das cargas continua nula.

Então:

> sem aterramento, há indução/separação de cargas; com aterramento e procedimento correto, pode haver eletrização líquida.

### A ordem das etapas importa

A ordem correta é:

1. aproximar o indutor;
2. aterrar o induzido;
3. retirar o aterramento;
4. afastar o indutor.

Se você afastar o indutor antes de retirar o aterramento, as cargas podem se redistribuir e voltar pela conexão com a Terra. Resultado: você pode desfazer a eletrização.

É uma ordem aparentemente simples, mas muito cobrada em prova.

### Erros comuns em indução

#### Erro 1: achar que precisa encostar

Na indução, não precisa haver contato entre indutor e induzido.

Se encostar, já podemos ter eletrização por contato, que é outro processo.

#### Erro 2: retirar o indutor antes do aterramento

A sequência fica errada.

O correto é retirar primeiro o fio terra, mantendo o indutor próximo. Só depois afastar o indutor.

#### Erro 3: confundir separação de cargas com eletrização líquida

Separar cargas dentro de um condutor neutro não significa que ele ficou eletrizado.

Eletrização líquida significa que o corpo passou a ter carga total diferente de zero.

#### Erro 4: errar o sentido do fluxo de elétrons

Elétrons são negativos.

Indutor negativo repele elétrons.

Indutor positivo atrai elétrons.

Em aterramento:

- se elétrons saem do corpo, ele fica positivo;
- se elétrons entram no corpo, ele fica negativo.

---

## 6. Polarização elétrica

A polarização elétrica ocorre principalmente em isolantes.

Em um condutor, cargas livres podem se deslocar por grandes distâncias. Em um isolante, isso não acontece. Mas as cargas internas das moléculas podem se deslocar ligeiramente ou se orientar.

Isso produz uma separação local de cargas, mesmo que o corpo continue globalmente neutro.

### O que é polarização?

Polarização é uma reorganização microscópica das cargas dentro de um material, especialmente isolante, quando ele é colocado próximo de um corpo eletrizado ou dentro de um campo elétrico.

Em um átomo ou molécula, as cargas positivas e negativas não ficam necessariamente rigidamente fixas em uma posição absoluta. Sob ação de um campo elétrico externo, pode ocorrer um pequeno deslocamento relativo entre o centro das cargas positivas e o centro das cargas negativas.

O material como um todo pode continuar neutro, mas cada pequena região passa a ter um lado ligeiramente mais positivo e outro ligeiramente mais negativo.

Isso é a polarização.

### Por que um corpo neutro pode ser atraído por um corpo carregado?

Imagine uma régua plástica carregada negativamente aproximada de pequenos pedaços de papel neutro.

O papel é globalmente neutro. Mas, quando a régua se aproxima, as cargas no papel se reorganizam ligeiramente.

A região do papel mais próxima da régua negativa fica com caráter positivo relativo, porque os elétrons são ligeiramente repelidos para regiões mais afastadas.

A região mais distante fica com caráter negativo relativo.

Como a parte positiva está mais perto da régua negativa do que a parte negativa, a atração entre a régua e a parte positiva do papel é mais intensa que a repulsão entre a régua e a parte negativa.

Resultado: o papel é atraído.

O papel continua globalmente neutro, mas polarizado.

### Balão grudando na parede

Um balão atritado no cabelo pode ficar eletrizado negativamente.

Ao aproximá-lo de uma parede neutra, as cargas nas moléculas da parede se reorganizam ligeiramente. A região mais próxima do balão fica com caráter positivo relativo.

O balão negativo é atraído por essa região positiva próxima. Como essa atração ocorre a uma distância menor que a repulsão da região negativa mais afastada, o resultado é uma força atrativa.

Por isso, o balão pode grudar na parede.

A parede não precisa estar carregada. Ela pode estar neutra e polarizada.

### Régua atraindo pedaços de papel

A régua atritada fica eletrizada.

Os pedaços de papel são neutros.

A aproximação da régua polariza o papel.

O lado do papel mais próximo da régua fica com carga efetiva oposta à da régua.

A atração domina.

Resultado: os pedacinhos de papel sobem ou grudam na régua.

### Polarização em moléculas polares e apolares

Em moléculas polares, já existe uma separação natural de cargas: uma região é mais positiva e outra mais negativa. Um campo elétrico externo pode orientar parcialmente essas moléculas.

Em moléculas apolares, a distribuição de cargas é simétrica em média. Mas um campo externo pode deformar levemente essa distribuição, induzindo uma separação momentânea de cargas.

Nos dois casos, pode ocorrer polarização.

### Diferença entre eletrização, indução e polarização

A eletrização altera a carga líquida do corpo.

A indução em condutores envolve separação de cargas livres. Com aterramento adequado, pode produzir eletrização líquida.

A polarização em isolantes envolve deslocamentos microscópicos ou orientação de cargas internas, sem necessariamente haver transferência líquida de carga.

Podemos resumir:

- eletrização: o corpo termina com carga total diferente de zero;
- indução em condutores: cargas livres se redistribuem, podendo haver eletrização com aterramento;
- polarização em isolantes: cargas internas se reorganizam localmente, mas o corpo pode continuar globalmente neutro.

Essa distinção é muito cobrada porque explica por que um corpo neutro pode ser atraído por um corpo eletrizado.

A frase correta é:

> um corpo carregado pode atrair um corpo neutro por polarização ou indução.

A frase errada é:

> se atraiu, então o outro corpo tem carga oposta.

Nem sempre. A realidade física tem nuances.

---

## 7. Lei de Coulomb

A Lei de Coulomb mede a intensidade da força elétrica entre duas cargas puntiformes em repouso.

Carga puntiforme é uma idealização: tratamos o corpo eletrizado como se suas dimensões fossem desprezíveis em comparação com a distância entre os corpos.

Antes da fórmula, a ideia física é esta:

- quanto maior o módulo das cargas, maior a força elétrica;
- quanto maior a distância entre as cargas, menor a força elétrica;
- a força diminui com o quadrado da distância;
- a força elétrica atua ao longo da linha que une as cargas.

Se uma das cargas dobra, a força dobra.

Se as duas cargas dobram, a força fica quatro vezes maior.

Se a distância dobra, a força fica quatro vezes menor.

Se a distância triplica, a força fica nove vezes menor.

Isso é consequência da dependência com $d^2$.

A fórmula é:

$$
F = k \frac{|q_1q_2|}{d^2}
$$

Em que:

- $F$ é o módulo da força elétrica;
- $k$ é a constante eletrostática do meio;
- $q_1$ e $q_2$ são as cargas elétricas;
- $d$ é a distância entre as cargas;
- o valor absoluto indica que a fórmula calcula o módulo da força.

No vácuo, a constante eletrostática é aproximadamente:

$$
k_0 \approx 9{,}0 \times 10^9 \ \text{N}\cdot\text{m}^2/\text{C}^2
$$

No ar, em muitos problemas de Ensino Médio, usamos aproximadamente o mesmo valor:

$$
k_{\text{ar}} \approx k_0
$$

A força elétrica pode ser atrativa ou repulsiva:

- cargas de mesmo sinal: repulsão;
- cargas de sinais opostos: atração.

A fórmula escalar calcula apenas o módulo. O sentido precisa ser analisado separadamente.

### Unidade das grandezas

No Sistema Internacional:

- força em newton, $\text{N}$;
- carga em coulomb, $\text{C}$;
- distância em metro, $\text{m}$;
- constante $k$ em $\text{N}\cdot\text{m}^2/\text{C}^2$.

Muito cuidado com unidades:

$$
1 \ \mu\text{C} = 10^{-6} \ \text{C}
$$

$$
1 \ \text{nC} = 10^{-9} \ \text{C}
$$

$$
1 \ \text{cm} = 10^{-2} \ \text{m}
$$

Não converter unidade é uma das maneiras mais eficientes de errar uma questão que você sabia fazer.

### Exemplo rápido com conversão

Duas cargas possuem:

$$
q_1 = 4 \ \mu\text{C}
$$

$$
q_2 = 2 \ \mu\text{C}
$$

A distância entre elas é:

$$
d = 30 \ \text{cm}
$$

Antes de usar Coulomb, convertemos:

$$
q_1 = 4 \times 10^{-6} \ \text{C}
$$

$$
q_2 = 2 \times 10^{-6} \ \text{C}
$$

$$
d = 30 \times 10^{-2} \ \text{m}
$$

$$
d = 0{,}30 \ \text{m}
$$

Agora sim:

$$
F = k \frac{|q_1q_2|}{d^2}
$$

### Natureza vetorial da força elétrica

Embora a fórmula acima forneça o módulo, a força elétrica é vetor.

Isso significa que ela tem:

- módulo;
- direção;
- sentido.

A direção da força entre duas cargas puntiformes é a reta que une as cargas.

O sentido depende dos sinais:

- se as cargas têm mesmo sinal, cada uma é repelida para longe da outra;
- se têm sinais opostos, cada uma é atraída em direção à outra.

Pela Terceira Lei de Newton, as forças entre as duas cargas têm mesmo módulo e sentidos opostos.

Se $q_1$ exerce força em $q_2$, então $q_2$ exerce força em $q_1$ com mesmo módulo e sentido contrário.

---

## 8. Comparação entre Lei de Coulomb e Gravitação Universal

A Lei de Coulomb tem uma estrutura muito parecida com a Lei da Gravitação Universal de Newton.

A força elétrica entre duas cargas puntiformes é:

$$
F_e = k \frac{|q_1q_2|}{d^2}
$$

A força gravitacional entre duas massas é:

$$
F_g = G \frac{m_1m_2}{d^2}
$$

As semelhanças são claras:

- ambas são forças à distância;
- ambas dependem do produto das grandezas envolvidas;
- ambas diminuem com o quadrado da distância;
- ambas atuam ao longo da reta que une os corpos;
- ambas obedecem a uma lei do inverso do quadrado.

Mas as diferenças são fundamentais.

A gravidade é sempre atrativa, porque massa gravitacional é sempre positiva no modelo clássico.

A força elétrica pode ser atrativa ou repulsiva, porque existem cargas positivas e negativas.

A força elétrica é muito mais intensa que a gravitacional em escala microscópica.

Por exemplo, entre um próton e um elétron, a atração elétrica é absurdamente maior que a atração gravitacional. Por isso, na estrutura atômica, a gravidade é completamente desprezível diante da interação elétrica.

Então surge uma pergunta natural:

> se a força elétrica é tão intensa, por que a matéria comum não explode eletricamente?

A resposta é: neutralidade elétrica aproximada.

A matéria comum possui enormes quantidades de cargas positivas e negativas, mas em geral elas se equilibram quase perfeitamente. Um objeto macroscópico costuma ter carga líquida muito pequena em comparação com a quantidade total de prótons e elétrons que possui.

Se houvesse um desequilíbrio grande de cargas, as forças elétricas seriam gigantescas.

Por isso, a neutralidade elétrica da matéria é uma das razões pelas quais o mundo macroscópico parece mecanicamente estável.

### Diferença conceitual importante

A gravidade domina em escalas astronômicas porque grandes corpos, como planetas e estrelas, têm enormes massas e geralmente são eletricamente neutros.

A eletricidade domina em escalas atômicas e moleculares porque as interações entre prótons e elétrons são muito mais intensas que a gravidade.

A estabilidade dos átomos, ligações químicas, propriedades dos materiais e fenômenos elétricos do cotidiano têm raiz eletromagnética, não gravitacional.

Em outras palavras: você não atravessa o chão não porque a gravidade “segura os átomos” do seu pé no chão, mas porque interações eletromagnéticas entre os átomos impedem a interpenetração da matéria. O chão te empurra para cima por forças de contato que, no fundo, têm origem eletromagnética.

---

## 9. Princípio da superposição

Quando várias cargas atuam sobre uma carga, a força resultante é a soma vetorial das forças individuais.

A expressão é:

$$
\vec{F}_{\text{res}} = \vec{F}_1 + \vec{F}_2 + \vec{F}_3 + \cdots
$$

Isso parece simples, mas contém uma armadilha enorme:

> não se deve somar módulos automaticamente.

Força é vetor. Tem módulo, direção e sentido.

Se duas forças estão na mesma direção e mesmo sentido, os módulos se somam.

Se estão na mesma direção e sentidos opostos, os módulos se subtraem.

Se formam ângulo, precisamos usar decomposição vetorial, Teorema de Pitágoras, Lei dos Cossenos ou simetria.

### Cargas em linha

Se três cargas estão sobre a mesma reta, as forças sobre uma carga escolhida também estarão nessa reta.

Nesse caso, podemos escolher um sentido positivo, por exemplo, para a direita.

Forças para a direita entram positivas.

Forças para a esquerda entram negativas.

Depois somamos algebraicamente.

### Cargas formando ângulo

Se as forças formam ângulo entre si, não podemos simplesmente somar os módulos.

Se forem perpendiculares, usamos:

$$
F_{\text{res}} = \sqrt{F_1^2 + F_2^2}
$$

Se formarem outro ângulo, podemos usar decomposição em eixos ou Lei dos Cossenos:

$$
F_{\text{res}}^2 = F_1^2 + F_2^2 + 2F_1F_2\cos\theta
$$

O ângulo $\theta$ é o ângulo entre os vetores força.

### Simetria

Em problemas com distribuições simétricas de cargas, algumas componentes podem se cancelar.

Por exemplo, uma carga colocada sobre o eixo de simetria de duas cargas iguais pode sofrer forças laterais que se cancelam, restando apenas uma componente na direção do eixo.

Esse raciocínio aparece muito em questões fortes, porque reduz contas grandes a uma análise de simetria.

### Roteiro para superposição

1. Escolha a carga que será analisada.
2. Desenhe a força exercida por cada carga sobre ela.
3. Determine se cada força é atrativa ou repulsiva.
4. Calcule os módulos separadamente.
5. Some vetorialmente.
6. Use simetria quando existir.
7. Só no final escreva o módulo e o sentido da resultante.

---

## 10. Campo elétrico

O conceito de campo elétrico foi criado para descrever a influência que uma carga produz no espaço ao seu redor.

Em vez de pensar apenas que uma carga age diretamente sobre outra à distância, dizemos que uma carga cria um campo elétrico no espaço. Quando outra carga é colocada nesse campo, ela sofre força elétrica.

Essa ideia muda a forma de pensar a interação elétrica.

Uma carga fonte cria campo.

Uma carga de prova sente esse campo.

O campo elétrico em um ponto é definido como força elétrica por unidade de carga de prova positiva colocada naquele ponto.

A definição é:

$$
\vec{E} = \frac{\vec{F}}{q}
$$

Em que:

- $\vec{E}$ é o campo elétrico;
- $\vec{F}$ é a força elétrica;
- $q$ é a carga de prova.

A unidade de campo elétrico é:

$$
\text{N/C}
$$

Campo elétrico é vetor. Portanto, possui módulo, direção e sentido.

A relação acima também pode ser escrita como:

$$
\vec{F} = q\vec{E}
$$

Essa fórmula mostra que, se conhecemos o campo elétrico em um ponto, podemos descobrir a força sobre uma carga colocada ali.

### Carga positiva e carga negativa no campo

Se $q > 0$, a força tem o mesmo sentido do campo:

$$
\vec{F} = q\vec{E}
$$

com $q$ positivo.

Se $q < 0$, a força tem sentido oposto ao campo.

Esse ponto é fundamental.

O campo elétrico é definido usando uma carga de prova positiva. Então, por convenção, o sentido do campo é o sentido da força que atuaria sobre uma carga positiva.

Uma carga negativa sofre força contrária ao campo.

### Campo existe sem carga de prova?

Sim.

O campo elétrico em um ponto é uma propriedade da região do espaço causada pelas cargas fontes.

A carga de prova serve apenas para medir ou detectar esse campo.

É como dizer que existe temperatura em uma sala mesmo antes de colocar um termômetro ali. O termômetro mede a temperatura, mas não cria a temperatura. A carga de prova mede o campo, mas não cria o campo principal.

Claro que, em uma análise rigorosa, qualquer carga de prova também interfere no sistema. Por isso, idealmente imaginamos uma carga de prova pequena o suficiente para não alterar significativamente a distribuição de cargas fontes.

---

## 11. Campo elétrico gerado por carga puntiforme

Vamos deduzir o campo elétrico produzido por uma carga puntiforme $Q$.

Considere uma carga fonte $Q$ e uma carga de prova $q$ colocada a uma distância $d$.

Pela Lei de Coulomb, o módulo da força elétrica entre elas é:

$$
F = k\frac{|Qq|}{d^2}
$$

Pela definição de campo elétrico:

$$
E = \frac{F}{|q|}
$$

Substituindo:

$$
E = \frac{k\frac{|Qq|}{d^2}}{|q|}
$$

Como $|Qq| = |Q||q|$, temos:

$$
E = \frac{k|Q||q|}{d^2|q|}
$$

Cancelando $|q|$:

$$
E = k\frac{|Q|}{d^2}
$$

Essa é a expressão do módulo do campo elétrico produzido por uma carga puntiforme:

$$
E = k\frac{|Q|}{d^2}
$$

Observe algo muito importante:

> o campo elétrico produzido por $Q$ não depende da carga de prova $q$.

A carga de prova apenas sente o campo. O campo é gerado pela carga fonte $Q$.

### Sentido do campo

Se a carga fonte $Q$ é positiva, o campo elétrico aponta para fora dela.

Se a carga fonte $Q$ é negativa, o campo elétrico aponta para dentro dela.

Em linguagem visual:

- carga positiva: campo saindo;
- carga negativa: campo entrando.

Por quê?

Porque o campo é definido como o sentido da força sobre uma carga positiva de prova.

Se $Q$ é positiva, ela repele uma carga positiva de prova. Logo, o campo aponta para longe de $Q$.

Se $Q$ é negativa, ela atrai uma carga positiva de prova. Logo, o campo aponta em direção a $Q$.

### Comparação com Lei de Coulomb

A Lei de Coulomb calcula força entre duas cargas:

$$
F = k\frac{|q_1q_2|}{d^2}
$$

O campo de uma carga calcula a influência de uma carga fonte no espaço:

$$
E = k\frac{|Q|}{d^2}
$$

A força depende das duas cargas.

O campo depende da carga fonte e do ponto do espaço.

Depois, se colocarmos uma carga $q$ naquele ponto, a força será:

$$
\vec{F} = q\vec{E}
$$

Essa separação é muito importante: primeiro o campo existe, depois a carga colocada ali sofre força.

---

## 12. Linhas de campo elétrico

Linhas de campo elétrico são uma representação visual do campo elétrico.

Elas não são fios reais, nem trajetórias obrigatórias de partículas. São uma ferramenta gráfica para indicar direção, sentido e intensidade relativa do campo.

As regras principais são:

- linhas de campo saem de cargas positivas;
- linhas de campo entram em cargas negativas;
- a tangente à linha em cada ponto indica a direção do campo elétrico naquele ponto;
- maior densidade de linhas indica campo mais intenso;
- linhas de campo não se cruzam.

### Por que linhas de campo não se cruzam?

Se duas linhas de campo se cruzassem em um ponto, isso significaria que o campo elétrico teria duas direções diferentes no mesmo ponto.

Mas o campo elétrico em um ponto tem uma única direção e um único sentido.

Portanto, linhas de campo não se cruzam.

### Carga positiva isolada

As linhas saem radialmente da carga positiva.

Isso representa que uma carga positiva de prova seria repelida para longe da carga fonte positiva.

### Carga negativa isolada

As linhas entram radialmente na carga negativa.

Isso representa que uma carga positiva de prova seria atraída para a carga fonte negativa.

### Dipolo elétrico

Um dipolo elétrico é formado por duas cargas de mesmo módulo e sinais opostos.

As linhas de campo saem da carga positiva e entram na carga negativa.

Próximo às cargas, o campo é mais intenso. Longe do dipolo, o campo enfraquece.

### Duas cargas positivas iguais

As linhas saem das duas cargas.

Na região entre elas, as linhas se afastam, indicando repulsão. No ponto médio entre duas cargas positivas iguais, os campos gerados por elas podem se cancelar, pois têm mesmo módulo e sentidos opostos.

### Placas paralelas

Entre duas placas paralelas extensas, uma positiva e outra negativa, o campo elétrico na região central é aproximadamente uniforme.

As linhas saem da placa positiva e chegam à placa negativa.

Elas são aproximadamente retas, paralelas e igualmente espaçadas.

---

## 13. Campo elétrico uniforme

Um campo elétrico uniforme é aquele que possui mesmo módulo, mesma direção e mesmo sentido em todos os pontos de uma região.

O exemplo mais importante é o campo entre duas placas paralelas eletrizadas, desprezando efeitos de borda.

Entre as placas, as linhas de campo são aproximadamente retas e paralelas.

Se uma carga $q$ é colocada em um campo uniforme $\vec{E}$, ela sofre força:

$$
\vec{F} = q\vec{E}
$$

Se $q$ é positiva, a força aponta no mesmo sentido do campo.

Se $q$ é negativa, a força aponta no sentido oposto.

### Movimento de uma carga em campo uniforme

Se uma partícula carregada é abandonada em um campo elétrico uniforme, ela pode acelerar sob ação da força elétrica.

Pela Segunda Lei de Newton:

$$
F = ma
$$

Como:

$$
F = qE
$$

temos:

$$
ma = qE
$$

Logo:

$$
a = \frac{qE}{m}
$$

Se quisermos o módulo:

$$
a = \frac{|q|E}{m}
$$

O sentido da aceleração depende do sinal da carga.

Para carga positiva, aceleração no sentido do campo.

Para carga negativa, aceleração no sentido oposto ao campo.

### Campo uniforme e placas paralelas

Em placas paralelas, se a diferença de potencial entre as placas é $U$ e a distância entre elas é $d$, o campo uniforme ideal é:

$$
E = \frac{U}{d}
$$

Essa relação será discutida melhor na parte de potencial elétrico, mas já vale guardar:

- maior tensão entre as placas: campo maior;
- maior distância entre as placas: campo menor.

---

## 14. Trabalho da força elétrica

A força elétrica pode realizar trabalho sobre uma carga.

Isso conecta Eletrostática com Trabalho e Energia.

Quando uma carga se desloca sob ação de uma força elétrica, sua energia cinética pode aumentar ou diminuir. Essa variação depende do trabalho realizado pela força elétrica.

Em um caso simples, com campo elétrico uniforme e deslocamento paralelo ao campo, temos:

$$
W = Fd
$$

Como:

$$
F = qE
$$

então:

$$
W = qEd
$$

Essa expressão deve ser usada com cuidado.

Ela vale diretamente quando:

- o campo é uniforme;
- a força elétrica é constante;
- o deslocamento é paralelo ao campo;
- a convenção de sinais está bem definida.

Se o deslocamento não for paralelo ao campo, entra o cosseno do ângulo:

$$
W = qEd\cos\theta
$$

em que $\theta$ é o ângulo entre o campo elétrico e o deslocamento, para carga positiva. Para uma carga negativa, o sinal de $q$ já altera o sentido da força.

### Trabalho positivo e negativo

Se a força elétrica favorece o movimento da carga, o trabalho é positivo.

Se a força elétrica se opõe ao movimento da carga, o trabalho é negativo.

Se a força elétrica é perpendicular ao deslocamento, o trabalho é nulo.

### Relação com energia cinética

Pelo Teorema da Energia Cinética:

$$
W_{\text{res}} = \Delta E_c
$$

Se a única força que realiza trabalho é a força elétrica, então:

$$
W_{\text{el}} = \Delta E_c
$$

Isso é muito útil em problemas de partículas carregadas aceleradas por campos elétricos.

---

## 15. Energia potencial elétrica

Energia potencial elétrica é a energia associada à configuração de cargas elétricas.

Quando duas cargas estão separadas por uma distância, existe uma energia associada a essa configuração.

Para duas cargas puntiformes $q_1$ e $q_2$, separadas por uma distância $d$, a energia potencial elétrica é:

$$
E_p = k\frac{q_1q_2}{d}
$$

Aqui, diferente da Lei de Coulomb, não usamos módulo no produto das cargas. O sinal importa.

### Sinal da energia potencial elétrica

Se as cargas têm mesmo sinal, o produto $q_1q_2$ é positivo. Então:

$$
E_p > 0
$$

Se as cargas têm sinais opostos, o produto $q_1q_2$ é negativo. Então:

$$
E_p < 0
$$

O zero de energia potencial elétrica, para cargas puntiformes, costuma ser adotado no infinito.

Isso significa que:

$$
E_p = 0
$$

quando as cargas estão infinitamente afastadas.

### Cargas de mesmo sinal

Cargas de mesmo sinal se repelem.

Para aproximá-las, é necessário realizar trabalho externo contra a repulsão elétrica.

Por isso, uma configuração com cargas iguais próximas possui energia potencial positiva.

Quanto mais próximas, maior a energia potencial positiva.

### Cargas de sinais opostos

Cargas de sinais opostos se atraem.

Para afastá-las, é necessário fornecer energia ao sistema.

Quando estão próximas, a energia potencial elétrica é negativa.

Isso indica que o sistema está em uma configuração “ligada” em relação ao infinito: seria necessário fornecer energia para separar as cargas até o infinito.

### Trabalho da força elétrica e energia potencial

Para forças conservativas, o trabalho da força está relacionado à variação da energia potencial por:

$$
W_{\text{el}} = -\Delta E_p
$$

Ou seja:

$$
W_{\text{el}} = -(E_{p,f} - E_{p,i})
$$

Logo:

$$
W_{\text{el}} = E_{p,i} - E_{p,f}
$$

Se a força elétrica realiza trabalho positivo, a energia potencial elétrica diminui.

Se a força elétrica realiza trabalho negativo, a energia potencial elétrica aumenta.

Isso é análogo ao peso na gravidade: quando o peso realiza trabalho positivo em uma queda, a energia potencial gravitacional diminui.

---

## 16. Potencial elétrico

Potencial elétrico é energia potencial elétrica por unidade de carga.

A definição é:

$$
V = \frac{E_p}{q}
$$

O potencial elétrico é uma grandeza escalar.

Sua unidade é o volt, símbolo $\text{V}$.

Como:

$$
V = \frac{E_p}{q}
$$

temos:

$$
1 \ \text{V} = 1 \ \text{J/C}
$$

Ou seja, um ponto tem potencial de $1 \ \text{V}$ quando uma carga de $1 \ \text{C}$ teria energia potencial de $1 \ \text{J}$ naquele ponto.

### Potencial gerado por carga puntiforme

Para uma carga fonte $Q$, o potencial elétrico em um ponto a uma distância $d$ é:

$$
V = k\frac{Q}{d}
$$

Aqui o sinal de $Q$ importa.

Se $Q$ é positiva:

$$
V > 0
$$

Se $Q$ é negativa:

$$
V < 0
$$

O potencial não é vetor. Ele não aponta para lugar nenhum. Ele é um número associado a cada ponto do espaço.

### Campo elétrico versus potencial elétrico

Campo elétrico é vetor.

Potencial elétrico é escalar.

Campo elétrico está ligado à força elétrica por unidade de carga:

$$
\vec{E} = \frac{\vec{F}}{q}
$$

Potencial elétrico está ligado à energia potencial por unidade de carga:

$$
V = \frac{E_p}{q}
$$

Campo responde à pergunta:

> que força uma carga sofreria nesse ponto?

Potencial responde à pergunta:

> quanta energia por unidade de carga existe nesse ponto?

Essa diferença é essencial.

### Força, campo, energia potencial e potencial

Vamos organizar:

#### Força elétrica

A força elétrica depende da carga que sofre a força.

$$
\vec{F} = q\vec{E}
$$

Unidade:

$$
\text{N}
$$

É vetor.

#### Campo elétrico

O campo elétrico é produzido pelas cargas fontes e existe no espaço.

$$
\vec{E} = \frac{\vec{F}}{q}
$$

Unidade:

$$
\text{N/C}
$$

É vetor.

#### Energia potencial elétrica

A energia potencial elétrica pertence ao sistema de cargas.

$$
E_p = k\frac{q_1q_2}{d}
$$

Unidade:

$$
\text{J}
$$

É escalar.

#### Potencial elétrico

O potencial elétrico é energia potencial por unidade de carga.

$$
V = \frac{E_p}{q}
$$

Unidade:

$$
\text{V}
$$

É escalar.

Essa separação evita uma quantidade enorme de erros.

---

## 17. Diferença de potencial elétrico

Diferença de potencial elétrico, ou tensão elétrica, é a diferença entre os potenciais elétricos de dois pontos.

Podemos definir:

$$
U = V_A - V_B
$$

ou, em outra convenção comum:

$$
\Delta V = V_B - V_A
$$

O importante é saber qual convenção está sendo usada.

Neste material, quando uma carga se desloca de $A$ para $B$, usaremos com frequência:

$$
W_{\text{el}} = q(V_A - V_B)
$$

Essa fórmula diz que o trabalho da força elétrica depende da carga e da diferença de potencial entre o ponto inicial e o ponto final.

Se definirmos:

$$
U_{AB} = V_A - V_B
$$

então:

$$
W_{\text{el}} = qU_{AB}
$$

### Interpretação física

Cargas positivas tendem espontaneamente a se mover para potenciais menores, quando estão livres sob ação apenas da força elétrica.

Isso ocorre porque a força elétrica realiza trabalho positivo e a energia potencial diminui.

Para uma carga positiva:

- descer potencial tende a ser espontâneo;
- subir potencial exige trabalho externo.

Para elétrons, a análise exige cuidado, porque sua carga é negativa.

Elétrons sofrem força no sentido oposto ao campo elétrico.

Por isso, em circuitos e campos elétricos, o movimento de elétrons costuma ser oposto ao sentido convencional do campo.

### Relação com energia

A variação da energia potencial elétrica é:

$$
\Delta E_p = q(V_B - V_A)
$$

O trabalho da força elétrica é:

$$
W_{\text{el}} = -\Delta E_p
$$

Logo:

$$
W_{\text{el}} = -q(V_B - V_A)
$$

ou:

$$
W_{\text{el}} = q(V_A - V_B)
$$

Essa é uma das relações mais importantes de Eletrostática.

---

## 18. Relação entre campo elétrico e potencial elétrico

O campo elétrico e o potencial elétrico estão profundamente relacionados.

De forma conceitual:

> o campo elétrico aponta na direção em que o potencial elétrico diminui mais rapidamente.

Em uma dimensão, de forma mais avançada, podemos escrever:

$$
E = -\frac{dV}{dx}
$$

Mas, para o Ensino Médio, o caso mais importante é o campo uniforme.

Em um campo elétrico uniforme, a relação entre módulo do campo, diferença de potencial e distância é:

$$
E = \frac{U}{d}
$$

Em que:

- $E$ é o módulo do campo elétrico;
- $U$ é a diferença de potencial entre as placas;
- $d$ é a distância entre elas.

Unidades:

$$
E = \frac{\text{V}}{\text{m}}
$$

Assim:

$$
[E] = \text{V/m}
$$

Mas também sabemos que:

$$
[E] = \text{N/C}
$$

Portanto:

$$
1 \ \text{N/C} = 1 \ \text{V/m}
$$

Essas duas unidades são equivalentes para campo elétrico.

### Analogia do relevo

Uma analogia útil é pensar no potencial elétrico como uma espécie de altitude elétrica.

Em uma montanha, objetos tendem a descer espontaneamente para regiões mais baixas, se houver caminho livre.

No campo elétrico, cargas positivas tendem a se mover para potenciais menores.

O campo elétrico seria como a inclinação do terreno: quanto maior a variação de potencial em uma distância pequena, maior o campo.

Mas atenção: é apenas uma analogia. Potencial elétrico não é altura real, e carga elétrica não é bolinha rolando literalmente em uma montanha. A analogia ajuda a visualizar, mas a Física está nas equações.

### Campo nulo e potencial constante

Se o campo elétrico é nulo em uma região, o potencial é constante nessa região.

Mas potencial constante não significa necessariamente potencial igual a zero.

Um condutor em equilíbrio eletrostático pode ter campo interno nulo e ainda assim estar em um potencial diferente de zero.

Esse ponto é muito importante.

Campo nulo não significa potencial nulo.

Significa ausência de variação espacial do potencial.

---

## 19. Condutores em equilíbrio eletrostático

Um condutor está em equilíbrio eletrostático quando suas cargas livres não apresentam movimento ordenado permanente.

Em equilíbrio eletrostático, todo condutor possui propriedades fundamentais:

1. o campo elétrico no interior do condutor é nulo;
2. o excesso de carga fica na superfície externa;
3. todos os pontos do condutor têm o mesmo potencial;
4. o campo elétrico na superfície é perpendicular à superfície.

Vamos entender cada uma.

---

## 19.1 Campo elétrico interno nulo

No interior de um condutor em equilíbrio eletrostático:

$$
E_{\text{int}} = 0
$$

Por quê?

Porque, se existisse campo elétrico dentro do condutor, os elétrons livres sofreriam força elétrica.

Como:

$$
\vec{F} = q\vec{E}
$$

um campo não nulo produziria força sobre as cargas livres.

Se há força resultante sobre cargas livres, elas se movem de maneira ordenada.

Mas isso seria corrente elétrica.

Então, o condutor não estaria em equilíbrio eletrostático.

Logo, para que haja equilíbrio, o campo elétrico interno precisa ser nulo.

---

## 19.2 Cargas em excesso ficam na superfície

Em um condutor, as cargas livres se repelem e se movimentam até ficarem o mais afastadas possível umas das outras.

No equilíbrio, o excesso de carga se distribui na superfície externa do condutor.

Dentro do material condutor, o campo deve ser nulo. A distribuição superficial de cargas é justamente o que garante essa condição.

Isso vale para condutores isolados em equilíbrio eletrostático.

---

## 19.3 Potencial constante

Se o campo elétrico dentro do condutor é nulo, não há variação de potencial entre dois pontos internos.

Assim, todo o condutor fica no mesmo potencial.

Dizemos que o condutor é equipotencial.

Matematicamente:

$$
V = \text{constante}
$$

Isso vale para todos os pontos do condutor, tanto no interior quanto na superfície.

---

## 19.4 Campo perpendicular à superfície

Na superfície de um condutor em equilíbrio, o campo elétrico externo deve ser perpendicular à superfície.

Se houvesse componente tangencial do campo na superfície, essa componente empurraria as cargas livres ao longo da superfície.

As cargas se moveriam, e o condutor não estaria em equilíbrio.

Portanto, no equilíbrio, a componente tangencial do campo deve ser nula.

O campo externo, quando existe, deve ser normal à superfície.

---

## 20. Blindagem eletrostática e gaiola de Faraday

Blindagem eletrostática é o fenômeno pelo qual um condutor pode proteger seu interior contra campos elétricos externos estacionários.

Quando um condutor é colocado em uma região com campo elétrico externo, suas cargas livres se redistribuem.

Essa redistribuição produz um campo induzido que cancela o campo elétrico no interior do condutor.

No equilíbrio:

$$
E_{\text{int}} = 0
$$

Essa é a base da gaiola de Faraday.

### O que é uma gaiola de Faraday?

Uma gaiola de Faraday é uma estrutura condutora que protege seu interior de campos elétricos externos.

Ela pode ser uma caixa metálica, uma malha condutora ou uma estrutura condutora fechada.

As cargas em excesso ficam na superfície externa.

O interior permanece protegido.

### Exemplos

Exemplos de blindagem eletrostática:

- carro durante tempestade;
- cabos blindados;
- equipamentos eletrônicos protegidos;
- gaiolas metálicas em laboratório;
- salas blindadas para medições sensíveis.

### Carro durante tempestade

Um erro comum é dizer que o carro protege por causa dos pneus de borracha.

A proteção principal não vem dos pneus.

A proteção vem da estrutura metálica do carro.

Se um raio atinge o carro, as cargas tendem a se distribuir pela parte externa da lataria, e a corrente segue preferencialmente pela superfície metálica, não pelo interior onde estão os passageiros.

O ideal é permanecer dentro do carro, sem tocar partes metálicas conectadas à parte externa.

### Blindagem não é mágica

Blindagem eletrostática funciona para campos elétricos em regime eletrostático ou quase eletrostático.

Campos eletromagnéticos variáveis, ondas de rádio e altas frequências envolvem detalhes adicionais. Ainda assim, o princípio de redistribuição de cargas em condutores é a base de muitos sistemas de proteção.

---

## 21. Poder das pontas

Em condutores, a carga tende a se concentrar mais em regiões de menor raio de curvatura, isto é, regiões mais pontiagudas.

Quanto mais pontiaguda a região, maior pode ser a densidade superficial de carga.

Isso gera um campo elétrico mais intenso próximo à ponta.

Esse fenômeno é conhecido como poder das pontas.

### Por que pontas intensificam o campo?

Em uma superfície pontiaguda, as cargas ficam mais concentradas em uma região pequena.

Como o campo elétrico próximo à superfície depende da densidade de carga, o campo pode ficar muito intenso.

Se o campo for suficientemente intenso, pode ionizar o ar ao redor.

Ionizar o ar significa arrancar elétrons de moléculas do ar, criando íons e elétrons livres.

Isso pode facilitar descargas elétricas.

### Fenômenos relacionados

O poder das pontas aparece em:

- para-raios;
- corona elétrica;
- faíscas;
- descargas em pontas;
- eletrização do ar;
- dispositivos eletrostáticos.

### Para-raios

O para-raios não “puxa raios magicamente”.

Ele oferece um caminho preferencial e seguro para a descarga elétrica, conduzindo a corrente para a Terra por meio de um sistema adequado de aterramento.

A ponta favorece a intensificação do campo elétrico local e pode contribuir para a ionização do ar nas proximidades.

Mas o ponto principal é: o para-raios fornece um caminho mais seguro para a descarga, reduzindo riscos para a estrutura protegida.

---

## 22. Gráficos importantes

A interpretação gráfica ajuda a diferenciar campo, potencial e energia.

---

## 22.1 Campo elétrico de carga puntiforme

Para uma carga puntiforme:

$$
E = k\frac{|Q|}{d^2}
$$

Então:

$$
E \propto \frac{1}{d^2}
$$

O gráfico $E \times d$ é uma curva decrescente.

Quando $d$ aumenta, $E$ diminui rapidamente.

Se a distância dobra:

$$
E' = \frac{E}{4}
$$

Se a distância triplica:

$$
E' = \frac{E}{9}
$$

O campo elétrico cai com o quadrado da distância.

---

## 22.2 Potencial elétrico de carga puntiforme

Para uma carga puntiforme:

$$
V = k\frac{Q}{d}
$$

Então:

$$
V \propto \frac{1}{d}
$$

O potencial também diminui quando a distância aumenta, mas diminui mais lentamente que o campo.

Se a distância dobra:

$$
V' = \frac{V}{2}
$$

Se a distância triplica:

$$
V' = \frac{V}{3}
$$

O potencial cai com a primeira potência da distância.

### Comparação

Campo:

$$
E \propto \frac{1}{d^2}
$$

Potencial:

$$
V \propto \frac{1}{d}
$$

Logo, o campo diminui mais rapidamente com a distância.

---

## 22.3 Energia potencial elétrica

Para duas cargas puntiformes:

$$
E_p = k\frac{q_1q_2}{d}
$$

A energia potencial elétrica também depende de $1/d$.

Mas o sinal depende do produto $q_1q_2$.

Se as cargas têm mesmo sinal:

$$
E_p > 0
$$

Se as cargas têm sinais opostos:

$$
E_p < 0
$$

Para cargas de sinais opostos, quando a distância aumenta, $E_p$ se aproxima de zero por valores negativos.

Para cargas de mesmo sinal, quando a distância aumenta, $E_p$ se aproxima de zero por valores positivos.

---

## 23. Análise dimensional

A análise dimensional é uma forma de verificar a coerência das fórmulas.

---

## 23.1 Lei de Coulomb

A Lei de Coulomb é:

$$
F = k\frac{|q_1q_2|}{d^2}
$$

Queremos que $F$ saia em newtons.

Então:

$$
[k] = \frac{[F]d^2}{q^2}
$$

Logo:

$$
[k] = \frac{\text{N}\cdot\text{m}^2}{\text{C}^2}
$$

Portanto:

$$
[k] = \text{N}\cdot\text{m}^2/\text{C}^2
$$

Isso explica a unidade da constante eletrostática.

---

## 23.2 Campo elétrico

Pela definição:

$$
E = \frac{F}{q}
$$

Temos:

$$
[E] = \frac{\text{N}}{\text{C}}
$$

Logo:

$$
[E] = \text{N/C}
$$

Também, em campo uniforme:

$$
E = \frac{U}{d}
$$

Como $U$ é medido em volts e $d$ em metros:

$$
[E] = \text{V/m}
$$

Portanto:

$$
1 \ \text{N/C} = 1 \ \text{V/m}
$$

---

## 23.3 Potencial elétrico

Pela definição:

$$
V = \frac{E_p}{q}
$$

Então:

$$
[V] = \frac{\text{J}}{\text{C}}
$$

Logo:

$$
[V] = \text{J/C}
$$

Por definição:

$$
1 \ \text{J/C} = 1 \ \text{V}
$$

### Exemplo 1 — Força elétrica entre duas cargas

Duas cargas puntiformes estão separadas por uma distância de $30 \ \text{cm}$ no ar.

As cargas são:

$$
q_1 = +4 \ \mu\text{C}
$$

$$
q_2 = -2 \ \mu\text{C}
$$

Considere:

$$
k = 9{,}0 \times 10^9 \ \text{N}\cdot\text{m}^2/\text{C}^2
$$

Determine o módulo da força elétrica entre elas e diga se a força é atrativa ou repulsiva.

Primeiro, convertemos as unidades:

$$
q_1 = 4 \times 10^{-6} \ \text{C}
$$

$$
q_2 = -2 \times 10^{-6} \ \text{C}
$$

$$
d = 30 \ \text{cm} = 0{,}30 \ \text{m}
$$

Usamos a Lei de Coulomb:

$$
F = k\frac{|q_1q_2|}{d^2}
$$

Substituindo:

$$
F = 9{,}0 \times 10^9 \cdot \frac{|(4 \times 10^{-6})(-2 \times 10^{-6})|}{(0{,}30)^2}
$$

O produto das cargas em módulo é:

$$
|q_1q_2| = 8 \times 10^{-12}
$$

A distância ao quadrado é:

$$
d^2 = 0{,}09
$$

Logo:

$$
F = 9{,}0 \times 10^9 \cdot \frac{8 \times 10^{-12}}{0{,}09}
$$

Calculando:

$$
9{,}0 \times 10^9 \cdot 8 \times 10^{-12} = 72 \times 10^{-3}
$$

$$
72 \times 10^{-3} = 0{,}072
$$

Então:

$$
F = \frac{0{,}072}{0{,}09}
$$

$$
F = 0{,}8 \ \text{N}
$$

Como as cargas possuem sinais opostos, a força é atrativa.

Resposta:

$$
F = 0{,}8 \ \text{N}
$$

A força é de atração.

---

### Exemplo 2 — Determinar se a força é atrativa ou repulsiva

Considere duas cargas:

$$
q_1 = -5 \ \mu\text{C}
$$

$$
q_2 = -8 \ \mu\text{C}
$$

As duas cargas são negativas.

Cargas de mesmo sinal se repelem.

Portanto, a força elétrica entre elas é repulsiva.

Não é necessário fazer conta para descobrir se a força é atrativa ou repulsiva. A conta determina o módulo. O sinal das cargas determina a natureza da interação.

Resposta:

$$
(-,-) \Rightarrow \text{repulsão}
$$

---

### Exemplo 3 — Conservação da carga em contato entre esferas idênticas

Duas esferas metálicas idênticas possuem cargas:

$$
Q_1 = +12 \ \mu\text{C}
$$

$$
Q_2 = -4 \ \mu\text{C}
$$

Elas são colocadas em contato e depois separadas. Determine a carga final de cada esfera.

Como as esferas são idênticas, a carga total se divide igualmente.

Primeiro, calculamos a carga total:

$$
Q_{\text{total}} = Q_1 + Q_2
$$

$$
Q_{\text{total}} = +12 - 4
$$

$$
Q_{\text{total}} = +8 \ \mu\text{C}
$$

Como são duas esferas idênticas:

$$
Q_f = \frac{Q_{\text{total}}}{2}
$$

$$
Q_f = \frac{+8}{2}
$$

$$
Q_f = +4 \ \mu\text{C}
$$

Cada esfera fica com:

$$
Q_f = +4 \ \mu\text{C}
$$

A carga total antes era $+8 \ \mu\text{C}$ e continua sendo $+8 \ \mu\text{C}$ depois.

O que mudou foi a distribuição da carga.

---

### Exemplo 4 — Quantização da carga e número de elétrons transferidos

Um corpo possui carga elétrica:

$$
Q = -6{,}4 \times 10^{-6} \ \text{C}
$$

Determine quantos elétrons esse corpo ganhou.

Como a carga é negativa, o corpo ganhou elétrons.

Usamos:

$$
|Q| = ne
$$

Então:

$$
n = \frac{|Q|}{e}
$$

Substituindo:

$$
n = \frac{6{,}4 \times 10^{-6}}{1{,}6 \times 10^{-19}}
$$

Dividindo os coeficientes:

$$
\frac{6{,}4}{1{,}6} = 4
$$

Dividindo as potências:

$$
\frac{10^{-6}}{10^{-19}} = 10^{13}
$$

Logo:

$$
n = 4 \times 10^{13}
$$

Resposta:

$$
4 \times 10^{13} \ \text{elétrons}
$$

O corpo ganhou $4 \times 10^{13}$ elétrons.

---

### Exemplo 5 — Três cargas em linha

Três cargas estão alinhadas sobre uma reta.

A carga central é:

$$
q_0 = +2 \ \mu\text{C}
$$

À esquerda dela, a $0{,}20 \ \text{m}$, há:

$$
q_1 = +3 \ \mu\text{C}
$$

À direita dela, a $0{,}30 \ \text{m}$, há:

$$
q_2 = -4 \ \mu\text{C}
$$

Determine o sentido da força resultante sobre $q_0$.

Vamos analisar os sentidos antes das contas.

A carga $q_1$ é positiva e $q_0$ também é positiva. Portanto, $q_1$ repele $q_0$.

Como $q_1$ está à esquerda, a repulsão empurra $q_0$ para a direita.

Agora analisamos $q_2$.

A carga $q_2$ é negativa e $q_0$ é positiva. Portanto, há atração.

Como $q_2$ está à direita, ela puxa $q_0$ para a direita.

As duas forças sobre $q_0$ apontam para a direita.

Logo, a força resultante também aponta para a direita.

Neste exemplo, nem precisamos calcular para saber o sentido.

Se o problema pedisse o módulo, usaríamos Coulomb em cada interação e somaríamos os módulos, pois os sentidos são iguais.

---

### Exemplo 6 — Superposição vetorial em duas dimensões

Uma carga positiva $q$ está na origem de um sistema de coordenadas. Duas cargas positivas iguais estão posicionadas simetricamente em relação ao eixo vertical, uma à esquerda e outra à direita.

Cada uma exerce sobre $q$ uma força de mesmo módulo.

Como as cargas são positivas, ambas repelem $q$.

As componentes horizontais das forças são opostas e se cancelam.

As componentes verticais têm o mesmo sentido e se somam.

Portanto, a resultante fica ao longo do eixo de simetria.

Esse tipo de raciocínio é muito importante.

Em vez de calcular tudo mecanicamente, percebemos que a simetria elimina parte do problema.

Em situações simétricas:

- componentes opostas se cancelam;
- componentes de mesmo sentido se somam;
- a resultante costuma ficar sobre o eixo de simetria.

Esse é um padrão muito comum em questões de nível mais alto.

---

### Exemplo 7 — Campo elétrico gerado por carga puntiforme

Uma carga puntiforme positiva possui:

$$
Q = +5 \ \mu\text{C}
$$

Determine o módulo do campo elétrico em um ponto a $0{,}50 \ \text{m}$ da carga.

Primeiro, convertemos:

$$
Q = 5 \times 10^{-6} \ \text{C}
$$

A fórmula do campo gerado por carga puntiforme é:

$$
E = k\frac{|Q|}{d^2}
$$

Substituindo:

$$
E = 9{,}0 \times 10^9 \cdot \frac{5 \times 10^{-6}}{(0{,}50)^2}
$$

Calculando:

$$
(0{,}50)^2 = 0{,}25
$$

$$
9{,}0 \times 10^9 \cdot 5 \times 10^{-6} = 45 \times 10^3
$$

Então:

$$
E = \frac{45 \times 10^3}{0{,}25}
$$

$$
E = 180 \times 10^3
$$

$$
E = 1{,}8 \times 10^5 \ \text{N/C}
$$

Como a carga fonte é positiva, o campo aponta para fora da carga.

Resposta:

$$
E = 1{,}8 \times 10^5 \ \text{N/C}
$$

---

### Exemplo 8 — Força sobre carga em campo uniforme

Uma carga:

$$
q = -3 \ \mu\text{C}
$$

é colocada em uma região onde existe campo elétrico uniforme de módulo:

$$
E = 2{,}0 \times 10^4 \ \text{N/C}
$$

Determine o módulo da força elétrica e o sentido em relação ao campo.

Primeiro, convertemos:

$$
q = -3 \times 10^{-6} \ \text{C}
$$

O módulo da força é:

$$
F = |q|E
$$

Substituindo:

$$
F = 3 \times 10^{-6} \cdot 2{,}0 \times 10^4
$$

$$
F = 6{,}0 \times 10^{-2} \ \text{N}
$$

Logo:

$$
F = 0{,}06 \ \text{N}
$$

Como a carga é negativa, a força elétrica tem sentido oposto ao campo elétrico.

Resposta:

$$
F = 0{,}06 \ \text{N}
$$

Sentido: oposto ao campo.

---

### Exemplo 9 — Potencial elétrico gerado por carga puntiforme

Uma carga puntiforme:

$$
Q = +2 \ \mu\text{C}
$$

gera potencial elétrico em um ponto situado a:

$$
d = 0{,}40 \ \text{m}
$$

Determine o potencial nesse ponto.

Usamos:

$$
V = k\frac{Q}{d}
$$

Convertendo:

$$
Q = 2 \times 10^{-6} \ \text{C}
$$

Substituindo:

$$
V = 9{,}0 \times 10^9 \cdot \frac{2 \times 10^{-6}}{0{,}40}
$$

Calculando:

$$
9{,}0 \times 10^9 \cdot 2 \times 10^{-6} = 18 \times 10^3
$$

Então:

$$
V = \frac{18 \times 10^3}{0{,}40}
$$

$$
V = 45 \times 10^3
$$

$$
V = 4{,}5 \times 10^4 \ \text{V}
$$

Como a carga fonte é positiva, o potencial é positivo.

Resposta:

$$
V = +4{,}5 \times 10^4 \ \text{V}
$$

---

### Exemplo 10 — Trabalho da força elétrica usando diferença de potencial

Uma carga:

$$
q = +2 \times 10^{-6} \ \text{C}
$$

se desloca de um ponto $A$ para um ponto $B$.

Os potenciais são:

$$
V_A = 120 \ \text{V}
$$

$$
V_B = 40 \ \text{V}
$$

Determine o trabalho realizado pela força elétrica.

Usamos:

$$
W_{\text{el}} = q(V_A - V_B)
$$

Substituindo:

$$
W_{\text{el}} = 2 \times 10^{-6}(120 - 40)
$$

$$
W_{\text{el}} = 2 \times 10^{-6} \cdot 80
$$

$$
W_{\text{el}} = 160 \times 10^{-6}
$$

$$
W_{\text{el}} = 1{,}6 \times 10^{-4} \ \text{J}
$$

Resposta:

$$
W_{\text{el}} = 1{,}6 \times 10^{-4} \ \text{J}
$$

Como o trabalho é positivo, a força elétrica favoreceu o deslocamento da carga positiva de $A$ para $B$.

---

### Exemplo 11 — Energia potencial elétrica entre duas cargas

Duas cargas puntiformes são:

$$
q_1 = +3 \ \mu\text{C}
$$

$$
q_2 = +2 \ \mu\text{C}
$$

A distância entre elas é:

$$
d = 0{,}60 \ \text{m}
$$

Determine a energia potencial elétrica do sistema.

Usamos:

$$
E_p = k\frac{q_1q_2}{d}
$$

Convertendo:

$$
q_1 = 3 \times 10^{-6} \ \text{C}
$$

$$
q_2 = 2 \times 10^{-6} \ \text{C}
$$

Substituindo:

$$
E_p = 9{,}0 \times 10^9 \cdot \frac{(3 \times 10^{-6})(2 \times 10^{-6})}{0{,}60}
$$

Produto das cargas:

$$
(3 \times 10^{-6})(2 \times 10^{-6}) = 6 \times 10^{-12}
$$

Então:

$$
E_p = 9{,}0 \times 10^9 \cdot \frac{6 \times 10^{-12}}{0{,}60}
$$

$$
9{,}0 \times 10^9 \cdot 6 \times 10^{-12} = 54 \times 10^{-3}
$$

$$
54 \times 10^{-3} = 0{,}054
$$

Logo:

$$
E_p = \frac{0{,}054}{0{,}60}
$$

$$
E_p = 0{,}09 \ \text{J}
$$

Como as cargas possuem mesmo sinal, a energia potencial é positiva.

Resposta:

$$
E_p = +0{,}09 \ \text{J}
$$

---

### Exemplo 12 — Condutor em equilíbrio eletrostático

Uma esfera metálica eletrizada está em equilíbrio eletrostático.

O que podemos afirmar sobre o campo elétrico no interior da esfera, a distribuição de cargas e o potencial?

Como a esfera é condutora e está em equilíbrio eletrostático:

$$
E_{\text{int}} = 0
$$

O excesso de carga fica na superfície externa.

Todos os pontos da esfera estão no mesmo potencial.

O campo elétrico externo na superfície é perpendicular à superfície.

Portanto:

- campo interno nulo;
- cargas em excesso na superfície;
- potencial constante;
- campo externo perpendicular à superfície.

Isso ocorre porque, se houvesse campo dentro do condutor, os elétrons livres se moveriam, e o sistema não estaria em equilíbrio.

---

### Exemplo 13 — Nível ITA/IME: simetria e campo resultante

Duas cargas iguais positivas $+Q$ estão fixas nos pontos $(-a,0)$ e $(+a,0)$.

Queremos analisar o campo elétrico em um ponto $P$ sobre o eixo $y$, em $(0,y)$.

Cada carga produz campo elétrico em $P$.

Como as cargas são iguais e estão simetricamente posicionadas, os módulos dos campos são iguais.

Os campos possuem componentes horizontais opostas.

Essas componentes se cancelam.

As componentes verticais têm o mesmo sentido e se somam.

Portanto, o campo resultante aponta ao longo do eixo $y$.

A distância de cada carga até $P$ é:

$$
r = \sqrt{a^2 + y^2}
$$

O módulo do campo de cada carga é:

$$
E = k\frac{Q}{r^2}
$$

A componente vertical de cada campo é:

$$
E_y = E\frac{y}{r}
$$

Como há duas cargas:

$$
E_{\text{res}} = 2E_y
$$

Logo:

$$
E_{\text{res}} = 2 \cdot k\frac{Q}{r^2} \cdot \frac{y}{r}
$$

$$
E_{\text{res}} = \frac{2kQy}{r^3}
$$

Como:

$$
r = \sqrt{a^2 + y^2}
$$

temos:

$$
E_{\text{res}} = \frac{2kQy}{(a^2+y^2)^{3/2}}
$$

Esse exemplo mostra como simetria reduz um problema vetorial aparentemente difícil.

---

### Exemplo 14 — Nível ITA/IME: potencial no mesmo sistema simétrico

Usando o mesmo sistema anterior, com duas cargas $+Q$ em $(-a,0)$ e $(+a,0)$, determine o potencial elétrico no ponto $P = (0,y)$.

Potencial elétrico é escalar.

Isso muda tudo.

Não precisamos decompor vetores.

O potencial de cada carga é:

$$
V = k\frac{Q}{r}
$$

Como as distâncias são iguais:

$$
r = \sqrt{a^2 + y^2}
$$

O potencial resultante é a soma escalar:

$$
V_{\text{res}} = V_1 + V_2
$$

$$
V_{\text{res}} = k\frac{Q}{r} + k\frac{Q}{r}
$$

$$
V_{\text{res}} = \frac{2kQ}{r}
$$

Substituindo $r$:

$$
V_{\text{res}} = \frac{2kQ}{\sqrt{a^2+y^2}}
$$

Observe a diferença:

- campo elétrico é vetor e exige decomposição;
- potencial elétrico é escalar e pode ser somado diretamente.

Esse é um ponto muito importante em prova difícil.

---

### Exemplo 15 — Campo nulo, potencial não nulo

Duas cargas iguais positivas $+Q$ estão colocadas em posições simétricas: uma à esquerda e outra à direita de um ponto central $O$.

No ponto central, os campos elétricos têm mesmo módulo e sentidos opostos.

Logo:

$$
\vec{E}_{\text{res}} = 0
$$

Mas o potencial elétrico é escalar.

Cada carga positiva produz potencial positivo no ponto $O$.

Então:

$$
V_{\text{res}} = V_1 + V_2
$$

Como ambos são positivos:

$$
V_{\text{res}} > 0
$$

Portanto, é possível ter:

$$
E = 0
$$

e:

$$
V \neq 0
$$

Isso derruba uma confusão clássica.

Campo nulo não significa potencial nulo.

Campo nulo significa que não há variação espacial local do potencial naquele ponto, ou que as contribuições vetoriais se cancelam.

---

### Exemplo 16 — Potencial nulo, campo não nulo

Considere duas cargas de mesmo módulo e sinais opostos: $+Q$ e $-Q$.

No ponto médio entre elas, os potenciais têm mesmo módulo e sinais opostos.

Logo:

$$
V_{\text{res}} = 0
$$

Mas os campos elétricos podem ter o mesmo sentido nesse ponto.

O campo da carga positiva aponta para longe dela.

O campo da carga negativa aponta em direção a ela.

No ponto médio entre $+Q$ e $-Q$, esses dois campos apontam no mesmo sentido.

Logo:

$$
E_{\text{res}} \neq 0
$$

Portanto, é possível ter:

$$
V = 0
$$

e:

$$
E \neq 0
$$

Isso é muito importante.

Potencial nulo não significa campo nulo.

---

### Exemplo 17 — Energia e conservação em Eletrostática

Uma carga positiva $q$ é abandonada do repouso em um ponto $A$ de potencial $V_A$ e se desloca espontaneamente até um ponto $B$ de potencial $V_B$, com $V_A > V_B$.

Despreze outras forças.

A energia potencial elétrica inicial é:

$$
E_{p,A} = qV_A
$$

A energia potencial elétrica final é:

$$
E_{p,B} = qV_B
$$

A variação da energia potencial é:

$$
\Delta E_p = q(V_B - V_A)
$$

Como $V_B < V_A$, temos:

$$
\Delta E_p < 0
$$

A energia potencial diminui.

Como a energia mecânica se conserva, essa diminuição vira aumento de energia cinética:

$$
\Delta E_c = -\Delta E_p
$$

Então:

$$
\Delta E_c = q(V_A - V_B)
$$

Se a carga parte do repouso:

$$
\frac{1}{2}mv^2 = q(V_A - V_B)
$$

Essa equação é muito usada em problemas de partículas aceleradas por diferença de potencial.

---

## 25. Armadilhas e erros comuns

### 25.1 Achar que corpo positivo ganhou prótons

Corpo positivo, em eletrização comum, perdeu elétrons.

Prótons ficam presos no núcleo.

Não trate eletrização comum como processo nuclear.

---

### 25.2 Confundir corpo neutro com corpo sem carga

Corpo neutro possui cargas positivas e negativas em quantidades equivalentes.

Ele não é vazio de cargas.

A soma algébrica é zero, mas as cargas existem.

---

### 25.3 Esquecer que elétrons são as cargas móveis em metais

Em metais, quem se move com facilidade são elétrons livres.

Quando um corpo metálico perde elétrons, fica positivo.

Quando ganha elétrons, fica negativo.

---

### 25.4 Confundir indução com contato

Na indução, não precisa encostar.

Se houver contato, o processo pode se tornar eletrização por contato.

Na indução com aterramento, a sequência correta das etapas é essencial.

---

### 25.5 Achar que toda atração indica cargas opostas

Um corpo carregado pode atrair um corpo neutro por polarização ou indução.

Então, atração não prova automaticamente que os corpos têm cargas opostas.

---

### 25.6 Esquecer a polarização

A polarização explica por que corpos neutros podem ser atraídos por corpos carregados.

Isso aparece em régua atraindo papel, balão grudando na parede e vários problemas conceituais.

---

### 25.7 Usar Lei de Coulomb sem converter unidades

Sempre converta para o SI:

$$
\mu\text{C} \rightarrow \text{C}
$$

$$
\text{cm} \rightarrow \text{m}
$$

$$
\text{mm} \rightarrow \text{m}
$$

Usar centímetros direto em Coulomb é uma forma clássica de transformar uma questão simples em desastre numérico.

---

### 25.8 Somar módulos em vez de vetores

Força elétrica e campo elétrico são vetores.

Potencial elétrico e energia potencial elétrica são escalares.

Não trate tudo igual.

---

### 25.9 Confundir campo elétrico com força elétrica

Campo elétrico existe no espaço e é produzido por cargas fontes.

Força elétrica é o efeito do campo sobre uma carga colocada naquele ponto.

A relação é:

$$
\vec{F} = q\vec{E}
$$

---

### 25.10 Esquecer o sinal da carga em $F = qE$

Se $q$ é positiva, força e campo têm mesmo sentido.

Se $q$ é negativa, força e campo têm sentidos opostos.

Esse erro é muito comum em movimento de elétrons.

---

### 25.11 Confundir potencial elétrico com energia potencial elétrica

Potencial elétrico é energia por unidade de carga:

$$
V = \frac{E_p}{q}
$$

Energia potencial elétrica é energia do sistema:

$$
E_p = qV
$$

Potencial é medido em volts.

Energia é medida em joules.

---

### 25.12 Achar que potencial é vetor

Potencial elétrico é escalar.

Campo elétrico é vetor.

Não existe “sentido do potencial” como existe sentido do campo.

---

### 25.13 Confundir $E = kQ/d^2$ com $V = kQ/d$

Campo elétrico de carga puntiforme:

$$
E = k\frac{|Q|}{d^2}
$$

Potencial elétrico de carga puntiforme:

$$
V = k\frac{Q}{d}
$$

Campo cai com $1/d^2$.

Potencial cai com $1/d$.

---

### 25.14 Achar que campo interno de condutor em equilíbrio não é nulo

No interior de um condutor em equilíbrio eletrostático:

$$
E_{\text{int}} = 0
$$

Se não fosse nulo, cargas livres se moveriam.

---

### 25.15 Achar que carga em condutor fica espalhada no volume

Em um condutor em equilíbrio eletrostático, o excesso de carga fica na superfície externa.

---

### 25.16 Achar que para-raios atrai raios magicamente

O para-raios oferece um caminho preferencial e seguro para a descarga.

Ele não funciona por magia nem por “chamar” raios de forma simples.

---

## 26. Pontos importantes para ITA/IME e vestibulares difíceis

Em provas mais exigentes, Eletrostática raramente aparece apenas como substituição direta na Lei de Coulomb.

O aluno precisa dominar relações conceituais e vetoriais.

### 26.1 Superposição vetorial

Força elétrica e campo elétrico exigem soma vetorial.

Em uma dimensão, use sinais.

Em duas dimensões, decomponha vetores ou use simetria.

### 26.2 Simetria

Muitas questões difíceis ficam simples quando se percebe a simetria.

Componentes podem se cancelar.

Potenciais podem se somar mesmo quando campos se cancelam.

### 26.3 Análise de sinais

Sinal importa muito em:

- carga elétrica;
- energia potencial elétrica;
- potencial elétrico;
- trabalho da força elétrica.

Não coloque módulo onde o sinal é essencial.

### 26.4 Campo versus força

Campo não é força.

Campo é força por unidade de carga.

A força depende da carga colocada no campo.

### 26.5 Potencial versus energia potencial

Potencial é energia por carga.

Energia potencial pertence ao sistema.

Essa diferença é central.

### 26.6 Gráficos

Domine:

$$
E \propto \frac{1}{d^2}
$$

$$
V \propto \frac{1}{d}
$$

$$
E_p \propto \frac{1}{d}
$$

E saiba interpretar o sinal de $V$ e $E_p$.

### 26.7 Condutores em equilíbrio

Saiba que:

- campo interno é nulo;
- potencial é constante;
- carga em excesso fica na superfície;
- campo externo é perpendicular à superfície.

### 26.8 Blindagem e poder das pontas

Esses temas aparecem em questões conceituais e aplicações.

Não trate como curiosidade. Eles são consequência direta da redistribuição de cargas em condutores.

### 26.9 Energia em problemas eletrostáticos

Muitas questões podem ser resolvidas com conservação de energia.

Use:

$$
W_{\text{el}} = -\Delta E_p
$$

e:

$$
W_{\text{el}} = \Delta E_c
$$

quando a força elétrica for responsável pela variação da energia cinética.

### 26.10 Diferença de potencial acelerando partículas

Se uma carga parte do repouso e é acelerada por uma diferença de potencial:

$$
\frac{1}{2}mv^2 = q(V_A - V_B)
$$

para carga positiva se deslocando de $A$ para $B$ com $V_A > V_B$.

De forma geral, use conservação de energia e cuidado com o sinal da carga.

---

## 27. Como reconhecer questões de Eletrostática

Questões de Eletrostática costumam trazer sinais claros no enunciado.

Procure palavras e ideias como:

- cargas puntiformes;
- corpos eletrizados;
- bastão carregado;
- esfera metálica;
- indução;
- aterramento;
- condutores;
- campo elétrico;
- potencial elétrico;
- diferença de potencial;
- linhas de campo;
- blindagem;
- para-raios;
- força entre cargas;
- equilíbrio de cargas;
- distribuição simétrica de cargas.

### Roteiro mental para resolver

1. Identifique as cargas e seus sinais.
2. Verifique se o problema é de eletrização, força, campo, potencial ou energia.
3. Converta todas as unidades para o SI.
4. Faça um desenho.
5. Determine sentidos antes das contas.
6. Use superposição quando houver várias cargas.
7. Separe claramente força, campo, potencial e energia.
8. Confira os sinais.
9. Confira as unidades.
10. Interprete fisicamente o resultado.

### Escolha da ferramenta certa

Se o problema pede força entre cargas, pense em Lei de Coulomb e superposição vetorial.

Se pede campo em um ponto, pense em campo elétrico e soma vetorial.

Se pede potencial, lembre que potencial é escalar.

Se pede velocidade de partícula carregada, pense em trabalho, energia e diferença de potencial.

Se envolve condutor em equilíbrio, pense em campo interno nulo, potencial constante e carga na superfície.

---

## 28. Resumo final organizado

### Carga elétrica

Carga elétrica é propriedade da matéria associada às interações elétricas.

Corpo positivo perdeu elétrons.

Corpo negativo ganhou elétrons.

Corpo neutro possui equilíbrio entre cargas positivas e negativas.

### Quantização da carga

$$
Q = ne
$$

A carga aparece em múltiplos inteiros da carga elementar.

$$
e = 1{,}6 \times 10^{-19} \ \text{C}
$$

### Conservação da carga

$$
\sum Q_{\text{antes}} = \sum Q_{\text{depois}}
$$

Carga elétrica não é criada nem destruída em processos comuns. Ela é transferida ou redistribuída.

### Eletrização

Principais processos:

- atrito;
- contato;
- indução.

Na indução com aterramento, o induzido fica com sinal oposto ao indutor.

### Polarização

Polarização é a reorganização microscópica das cargas internas de um material.

Ela explica por que corpos neutros podem ser atraídos por corpos carregados.

### Lei de Coulomb

$$
F = k\frac{|q_1q_2|}{d^2}
$$

A fórmula fornece o módulo da força.

O sentido depende dos sinais das cargas.

### Campo elétrico

$$
\vec{E} = \frac{\vec{F}}{q}
$$

Campo elétrico é vetor.

Unidade:

$$
\text{N/C}
$$

### Força sobre carga em campo

$$
\vec{F} = q\vec{E}
$$

Carga positiva sofre força no sentido do campo.

Carga negativa sofre força no sentido oposto.

### Campo de carga puntiforme

$$
E = k\frac{|Q|}{d^2}
$$

Carga positiva gera campo para fora.

Carga negativa gera campo para dentro.

### Potencial elétrico

$$
V = k\frac{Q}{d}
$$

Potencial é escalar.

Unidade:

$$
1 \ \text{V} = 1 \ \text{J/C}
$$

### Energia potencial elétrica

$$
E_p = k\frac{q_1q_2}{d}
$$

Mesmo sinal:

$$
E_p > 0
$$

Sinais opostos:

$$
E_p < 0
$$

### Trabalho da força elétrica

$$
W_{\text{el}} = q(V_A - V_B)
$$

Também:

$$
W_{\text{el}} = -\Delta E_p
$$

### Campo uniforme

$$
E = \frac{U}{d}
$$

Unidades equivalentes:

$$
1 \ \text{N/C} = 1 \ \text{V/m}
$$

### Condutor em equilíbrio eletrostático

Em equilíbrio eletrostático:

- campo interno nulo;
- cargas em excesso na superfície;
- potencial constante;
- campo externo perpendicular à superfície.

### Blindagem eletrostática

Condutores podem proteger seu interior contra campos elétricos externos.

Esse é o princípio da gaiola de Faraday.

### Poder das pontas

Regiões pontiagudas concentram mais cargas e podem produzir campos elétricos intensos.

Isso está ligado a para-raios, corona elétrica e descargas.

### Ideia final

A Eletrostática não é uma coleção de fórmulas isoladas. Ela é o estudo de como cargas elétricas criam forças, campos, potenciais e energia no espaço.

Quem entende a diferença entre força, campo, potencial e energia consegue resolver problemas muito mais variados do que quem apenas decora expressões.
`;

type Tab = "teoria" | "exemplos" | "resumo";

type MarkdownSection = {
  id: string;
  title: string;
  content: string;
};

type ExampleBlock = {
  id: string;
  title: string;
  content: string;
};

function normalizeContent(markdown: string) {
  return markdown.replace(/^#\s+Eletrostática\s*/i, "").trim();
}

function getBefore(markdown: string, marker: string) {
  const index = markdown.indexOf(marker);
  return index === -1 ? markdown : markdown.slice(0, index).trim();
}

function getFrom(markdown: string, marker: string) {
  const index = markdown.indexOf(marker);
  return index === -1 ? "" : markdown.slice(index).trim();
}

function getBetween(markdown: string, startMarker: string, endMarker: string) {
  const start = markdown.indexOf(startMarker);

  if (start === -1) return "";

  const end = markdown.indexOf(endMarker, start + startMarker.length);

  return end === -1
    ? markdown.slice(start).trim()
    : markdown.slice(start, end).trim();
}

function splitMarkdownSections(markdown: string): MarkdownSection[] {
  const cleaned = normalizeContent(markdown);
  const chunks = cleaned.split(/\n(?=##\s+)/g).filter(Boolean);

  return chunks.map((chunk, index) => {
    const match = chunk.match(/^##\s+(.+)$/m);
    const rawTitle = match?.[1]?.trim() || `Seção ${index + 1}`;
    const content = chunk.replace(/^##\s+.+\n?/, "").trim();

    return {
      id: `section-${index + 1}`,
      title: rawTitle,
      content,
    };
  });
}

function splitExamples(markdown: string): ExampleBlock[] {
  const withoutTitle = markdown
    .replace(/^##\s+24\.\s+Exemplos resolvidos\s*/i, "")
    .trim();

  const chunks = withoutTitle
    .split(/\n(?=###\s+Exemplo\s+\d+)/g)
    .filter(Boolean);

  if (chunks.length === 0 && withoutTitle) {
    return [
      {
        id: "example-all",
        title: "Exemplos resolvidos",
        content: withoutTitle,
      },
    ];
  }

  return chunks.map((chunk, index) => {
    const match = chunk.match(/^###\s+(.+)$/m);
    const rawTitle = match?.[1]?.trim() || `Exemplo ${index + 1}`;
    const content = chunk.replace(/^###\s+.+\n?/, "").trim();

    return {
      id: `example-${index + 1}`,
      title: rawTitle,
      content,
    };
  });
}

function CompactTabHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  accent = "from-slate-950 via-slate-900 to-yellow-950",
}: {
  icon: ElementType;
  eyebrow: string;
  title: string;
  description: string;
  accent?: string;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${accent} border border-slate-800 shadow-[0_18px_55px_rgba(15,23,42,0.18)] p-6 md:p-8`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.22),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.14),transparent_34%)]" />

      <div className="relative">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-yellow-300">
          <Icon className="h-4 w-4" />
          {eyebrow}
        </div>

        <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">
          {title}
        </h2>

        <p className="mt-3 max-w-3xl leading-7 text-slate-300">
          {description}
        </p>
      </div>
    </section>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
  accent = "from-yellow-500 to-orange-600",
}: {
  icon: ElementType;
  title: string;
  children: ReactNode;
  accent?: string;
}) {
  return (
    <section className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className={`bg-gradient-to-r ${accent} px-6 py-4`}>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/20 bg-white/15 p-2">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {title}
          </h2>
        </div>
      </div>
      <div className="p-6 md:p-8">{children}</div>
    </section>
  );
}

function NoteBox({
  title,
  children,
  type = "info",
}: {
  title: string;
  children: ReactNode;
  type?: "info" | "warning" | "success" | "dark" | "danger";
}) {
  const styles = {
    info: "border-l-4 border-blue-500 bg-blue-50 text-blue-950",
    warning: "border-l-4 border-amber-500 bg-amber-50 text-amber-950",
    success: "border-l-4 border-emerald-500 bg-emerald-50 text-emerald-950",
    danger: "border-l-4 border-red-500 bg-red-50 text-red-950",
    dark: "border border-slate-700 bg-slate-900 text-slate-200",
  };

  const Icon =
    type === "warning"
      ? AlertTriangle
      : type === "success"
        ? ShieldCheck
        : type === "danger"
          ? AlertTriangle
          : type === "dark"
            ? Brain
            : Lightbulb;

  return (
    <div className={`rounded-2xl border p-5 ${styles[type]}`}>
      <div className="mb-2 flex items-center gap-2 font-black">
        <Icon className="h-5 w-5 shrink-0" />
        {title}
      </div>

      <div className="text-sm md:text-base leading-7">{children}</div>
    </div>
  );
}

function markdownText(children: ReactNode) {
  if (typeof children === "string") return children;

  if (Array.isArray(children)) {
    return children
      .map((child) => (typeof child === "string" ? child : ""))
      .join("")
      .trim();
  }

  return "";
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="pt-6 pb-1 text-xl md:text-2xl font-bold text-slate-900 border-b border-slate-200">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="pt-4 pb-1 text-lg md:text-xl font-bold text-slate-800">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="pt-3 text-base font-bold text-slate-800">{children}</h4>
  ),
  p: ({ children }) => {
    const text = markdownText(children).toLowerCase();
    if (
      text.startsWith("atenção") ||
      text.startsWith("cuidado") ||
      text.startsWith("erro clássico")
    ) {
      return (
        <NoteBox title="Atenção" type="warning">
          <p>{children}</p>
        </NoteBox>
      );
    }
    return <p className="leading-7 text-slate-700 mb-0">{children}</p>;
  },
  ul: ({ children }) => (
    <ul className="my-3 space-y-1 leading-7 text-slate-700 pl-5 list-disc">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1 pl-6 leading-7 text-slate-700 marker:font-bold marker:text-indigo-600">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="pl-1 text-slate-700">{children}</li>
  ),

    blockquote: ({ children }) => (
    <div className="my-5 rounded-xl border-l-4 border-indigo-500 bg-indigo-50 p-5 text-indigo-950">
      <div className="mb-2 flex items-center gap-2 font-bold">
        <Lightbulb className="h-5 w-5 text-indigo-600" />
        <span className="text-indigo-700">Ideia importante</span>
      </div>
      <blockquote className="space-y-3 leading-7 text-slate-700">{children}</blockquote>
    </div>
  ),

  strong: ({ children }) => (
    <strong className="font-black text-slate-950">{children}</strong>
  ),

  em: ({ children }) => <em className="text-slate-800">{children}</em>,

  hr: () => <hr className="my-8 border-slate-200" />,

  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full min-w-[620px] border-collapse bg-white text-sm">
        {children}
      </table>
    </div>
  ),

  th: ({ children }) => (
    <th className="border-b border-slate-200 bg-slate-950 px-4 py-3 text-left font-black text-white">
      {children}
    </th>
  ),

  td: ({ children }) => (
    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
      {children}
    </td>
  ),
};

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="space-y-2 text-slate-700 [&_.katex-display]:my-2 [&_.katex-display]:overflow-x-auto [&_.katex-display]:rounded-xl [&_.katex-display]:border [&_.katex-display]:border-slate-700 [&_.katex-display]:bg-slate-900 [&_.katex-display]:px-6 [&_.katex-display]:py-4 [&_.katex-display]:text-slate-100 [&_.katex]:text-inherit [&_.katex-display_.katex]:text-slate-100">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function ExampleAccordion({ example }: { example: ExampleBlock }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full px-6 py-4 text-left transition-colors hover:bg-slate-50 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <Target className="h-4 w-4 text-indigo-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {example.title}
          </h3>
        </div>
        <div className="shrink-0 rounded-full bg-slate-100 p-1.5 text-slate-600">
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-6 py-5">
          <MarkdownContent content={example.content} />
        </div>
      )}
    </div>
  );
}

export default function EletricidadeTopicEletrostatica() {
  const [activeTab, setActiveTab] = useState<Tab>("teoria");

  const normalizedMarkdown = useMemo(
    () => normalizeContent(eletrostaticaMarkdown),
    []
  );

  const theoryMarkdown = useMemo(() => {
    const mainTheory = getBefore(
      normalizedMarkdown,
      "## 24. Exemplos resolvidos"
    );

    const strategicTheory = getBetween(
      normalizedMarkdown,
      "## 25. Armadilhas e erros comuns",
      "## 28. Resumo final organizado"
    );

    return [mainTheory, strategicTheory].filter(Boolean).join("\n\n---\n\n");
  }, [normalizedMarkdown]);

  const examplesMarkdown = useMemo(
    () =>
      getBetween(
        normalizedMarkdown,
        "## 24. Exemplos resolvidos",
        "## 25. Armadilhas e erros comuns"
      ),
    [normalizedMarkdown]
  );

  const summaryMarkdown = useMemo(
    () => getFrom(normalizedMarkdown, "## 28. Resumo final organizado"),
    [normalizedMarkdown]
  );

  const theorySections = useMemo(
    () => splitMarkdownSections(theoryMarkdown),
    [theoryMarkdown]
  );

  const examples = useMemo(
    () => splitExamples(examplesMarkdown),
    [examplesMarkdown]
  );

  const summarySections = useMemo(
    () => splitMarkdownSections(summaryMarkdown),
    [summaryMarkdown]
  );

  const theoryIcons = [
    BookOpen,
    Zap,
    ShieldCheck,
    Layers,
    Compass,
    Gauge,
    Brain,
    Target,
    Lightbulb,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-yellow-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/eletricidade">
              <a className="rounded-full border border-slate-200 bg-white p-2 transition-colors hover:bg-slate-100">
                <ArrowLeft className="h-5 w-5 text-slate-700" />
              </a>
            </Link>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-700">
                Eletricidade
              </p>

              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-950">
                Eletrostática
              </h1>
            </div>
          </div>

          <div className="hidden gap-2 md:flex">
            {(["teoria", "exemplos", "resumo"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-black capitalize transition-colors ${
                  activeTab === tab
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto flex max-w-5xl gap-2 px-4 pb-4 md:hidden">
          {(["teoria", "exemplos", "resumo"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-black capitalize transition-colors ${
                activeTab === tab
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8 md:px-6 md:py-10">
        {activeTab === "teoria" && (
          <>
            <section className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-yellow-950 p-7 shadow-[0_24px_75px_rgba(15,23,42,0.35)] md:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.32),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.20),transparent_32%)]" />

              <div className="relative grid items-end gap-8 lg:grid-cols-[1.35fr_0.65fr]">
                <div>
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                    <Sparkles className="h-4 w-4" />
                    Teoria completa
                  </div>

                  <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tight text-white">
                    Cargas criam forças, campos, potenciais e energia.
                  </h2>

                  <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                    A Eletrostática explica como corpos eletrizados interagem,
                    como os condutores se reorganizam e por que conceitos como
                    campo, potencial e energia são indispensáveis para resolver
                    problemas de verdade, não só decorar fórmulas soltas.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["28", "seções"],
                    ["12+", "exemplos"],
                    ["ITA", "foco"],
                    ["IME", "nível"],
                  ].map(([value, label]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur"
                    >
                      <p className="text-2xl font-black text-white">{value}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-300">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="space-y-8">
              {theorySections.map((section, index) => {
                const Icon = theoryIcons[index % theoryIcons.length];

                const accent =
                  index % 3 === 0
                    ? "from-yellow-500 to-orange-600"
                    : index % 3 === 1
                      ? "from-slate-950 to-yellow-800"
                      : "from-orange-600 to-red-700";

                return (
                  <SectionCard
                    key={section.id}
                    icon={Icon}
                    title={section.title}
                    accent={accent}
                  >
                    <MarkdownContent content={section.content} />
                  </SectionCard>
                );
              })}
            </div>
          </>
        )}

        {activeTab === "exemplos" && (
          <>
            <CompactTabHeader
              icon={Target}
              eyebrow="Treino comentado"
              title="Exemplos resolvidos"
              description="Questões em ordem de construção: carga, força, campo, potencial, energia, superposição e condutores. Aqui a conta vem depois da interpretação."
              accent="from-slate-950 via-slate-900 to-orange-950"
            />

            <div className="space-y-5">
              {examples.length > 0 ? (
                examples.map((example) => (
                  <ExampleAccordion key={example.id} example={example} />
                ))
              ) : (
                <SectionCard icon={Target} title="Exemplos resolvidos">
                  <MarkdownContent content={examplesMarkdown} />
                </SectionCard>
              )}
            </div>
          </>
        )}

        {activeTab === "resumo" && (
          <>
            <CompactTabHeader
              icon={Brain}
              eyebrow="Mapa final"
              title="Resumo de Eletrostática"
              description="As fórmulas principais e as ideias que seguram o conteúdo inteiro: carga, conservação, força elétrica, campo, potencial, energia e equilíbrio eletrostático."
              accent="from-slate-950 via-slate-900 to-yellow-950"
            />

            <div className="space-y-8">
              {summarySections.length > 0 ? (
                summarySections.map((section, index) => {
                  const Icon = index === 0 ? Brain : Lightbulb;

                  return (
                    <SectionCard
                      key={section.id}
                      icon={Icon}
                      title={section.title}
                      accent={
                        index === 0
                          ? "from-yellow-500 to-orange-600"
                          : "from-slate-950 to-yellow-800"
                      }
                    >
                      <MarkdownContent content={section.content} />
                    </SectionCard>
                  );
                })
              ) : (
                <SectionCard icon={Brain} title="Resumo final">
                  <MarkdownContent content={summaryMarkdown} />
                </SectionCard>
              )}

              <NoteBox title="Ideia central" type="dark">
                A Eletrostática não é um amontoado de fórmulas. Ela descreve
                como a carga elétrica organiza forças, campos, potenciais e
                energia no espaço. Quando essa diferença fica clara, o aluno
                para de tentar adivinhar fórmula e começa a enxergar a Física
                por trás do problema.
              </NoteBox>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
