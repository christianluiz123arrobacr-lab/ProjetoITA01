import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Atom,
  BadgeInfo,
  Beaker,
  Brain,
  Eye,
  EyeOff,
  PauseCircle,
  PlayCircle,
  Rotate3D,
  RotateCcw,
  Sparkles,
} from "lucide-react";

type Vec3 = {
  x: number;
  y: number;
  z: number;
};

type ProjectedPoint = {
  x: number;
  y: number;
  z: number;
  perspective: number;
};

type AtomPoint = {
  label: string;
  element: string;
  position: Vec3;
};

type LonePairPoint = {
  label: string;
  position: Vec3;
};

type MoleculeGeometry = {
  formula: string;
  name: string;
  centralAtom: string;
  vsepr: string;
  electronGeometry: string;
  molecularGeometry: string;
  idealAngle: string;
  realAngle: string;
  bondingPairs: number;
  lonePairs: number;
  atoms: AtomPoint[];
  lonePairPositions: LonePairPoint[];
  shortExplanation: string;
  angleExplanation: string;
  vestibularNote: string;
  commonMistake: string;
};

type RenderObject =
  | {
      type: "central";
      key: string;
      z: number;
      point: ProjectedPoint;
    }
  | {
      type: "atom";
      key: string;
      z: number;
      atom: AtomPoint;
      point: ProjectedPoint;
    }
  | {
      type: "lonePair";
      key: string;
      z: number;
      pair: LonePairPoint;
      point: ProjectedPoint;
    };

type ExplanationMode = "resumo" | "completa";

type VseprModelDefinition = {
  key: string;
  bondingPairs: number;
  lonePairs: number;
  electronGeometry: string;
  molecularGeometry: string;
  typicalAngle: string;
  explanation: string;
};

function toSubscriptNumber(value: number) {
  const map: Record<string, string> = {
    "0": "₀",
    "1": "₁",
    "2": "₂",
    "3": "₃",
    "4": "₄",
    "5": "₅",
    "6": "₆",
    "7": "₇",
    "8": "₈",
    "9": "₉",
  };

  return String(value)
    .split("")
    .map(digit => map[digit] ?? digit)
    .join("");
}

function buildVseprLabel(bondingPairs: number, lonePairs: number) {
  return `AX${toSubscriptNumber(bondingPairs)}${
    lonePairs > 0 ? `E${lonePairs > 1 ? toSubscriptNumber(lonePairs) : ""}` : ""
  }`;
}

const VSEPR_MODELS: VseprModelDefinition[] = [
  {
    key: "AX₂",
    bondingPairs: 2,
    lonePairs: 0,
    electronGeometry: "Linear",
    molecularGeometry: "Linear",
    typicalAngle: "180°",
    explanation:
      "Duas regiões eletrônicas se afastam ao máximo ficando em lados opostos do átomo central.",
  },
  {
    key: "AX₃",
    bondingPairs: 3,
    lonePairs: 0,
    electronGeometry: "Trigonal plana",
    molecularGeometry: "Trigonal plana",
    typicalAngle: "120°",
    explanation:
      "Três regiões eletrônicas se distribuem no mesmo plano, formando ângulos de 120°.",
  },
  {
    key: "AX₂E",
    bondingPairs: 2,
    lonePairs: 1,
    electronGeometry: "Trigonal plana",
    molecularGeometry: "Angular",
    typicalAngle: "< 120°",
    explanation:
      "Há três regiões eletrônicas, mas uma delas é par livre. Como o par livre não aparece como átomo, a forma molecular fica angular.",
  },
  {
    key: "AX₄",
    bondingPairs: 4,
    lonePairs: 0,
    electronGeometry: "Tetraédrica",
    molecularGeometry: "Tetraédrica",
    typicalAngle: "109,5°",
    explanation:
      "Quatro regiões ligantes se afastam no espaço formando um tetraedro regular.",
  },
  {
    key: "AX₃E",
    bondingPairs: 3,
    lonePairs: 1,
    electronGeometry: "Tetraédrica",
    molecularGeometry: "Piramidal trigonal",
    typicalAngle: "≈ 107°",
    explanation:
      "A geometria eletrônica é tetraédrica, mas um par livre comprime as três ligações, formando uma pirâmide trigonal.",
  },
  {
    key: "AX₂E₂",
    bondingPairs: 2,
    lonePairs: 2,
    electronGeometry: "Tetraédrica",
    molecularGeometry: "Angular",
    typicalAngle: "≈ 104,5°",
    explanation:
      "Dois pares livres repelem mais fortemente os pares ligantes, comprimindo bastante o ângulo entre as ligações.",
  },
  {
    key: "AX₅",
    bondingPairs: 5,
    lonePairs: 0,
    electronGeometry: "Bipiramidal trigonal",
    molecularGeometry: "Bipiramidal trigonal",
    typicalAngle: "90°, 120° e 180°",
    explanation:
      "Cinco regiões eletrônicas formam duas posições axiais e três posições equatoriais.",
  },
  {
    key: "AX₄E",
    bondingPairs: 4,
    lonePairs: 1,
    electronGeometry: "Bipiramidal trigonal",
    molecularGeometry: "Gangorra",
    typicalAngle: "< 90° e < 120°",
    explanation:
      "O par livre ocupa uma posição equatorial, e os quatro ligantes restantes formam uma estrutura em gangorra.",
  },
  {
    key: "AX₃E₂",
    bondingPairs: 3,
    lonePairs: 2,
    electronGeometry: "Bipiramidal trigonal",
    molecularGeometry: "Forma de T",
    typicalAngle: "≈ 90° e 180°",
    explanation:
      "Dois pares livres ocupam posições que reduzem repulsões, deixando três ligantes em forma de T.",
  },
  {
    key: "AX₂E₃",
    bondingPairs: 2,
    lonePairs: 3,
    electronGeometry: "Bipiramidal trigonal",
    molecularGeometry: "Linear",
    typicalAngle: "180°",
    explanation:
      "Três pares livres ocupam posições equatoriais, e os dois ligantes ficam em posições axiais opostas.",
  },
  {
    key: "AX₆",
    bondingPairs: 6,
    lonePairs: 0,
    electronGeometry: "Octaédrica",
    molecularGeometry: "Octaédrica",
    typicalAngle: "90° e 180°",
    explanation:
      "Seis regiões ligantes se distribuem em três eixos perpendiculares.",
  },
  {
    key: "AX₄E₂",
    bondingPairs: 4,
    lonePairs: 2,
    electronGeometry: "Octaédrica",
    molecularGeometry: "Quadrado planar",
    typicalAngle: "90° e 180°",
    explanation:
      "Dois pares livres ficam em posições opostas, e os quatro ligantes permanecem no mesmo plano.",
  },
  {
    key: "AX₆E",
    bondingPairs: 6,
    lonePairs: 1,
    electronGeometry: "Sete regiões eletrônicas",
    molecularGeometry: "Octaédrica distorcida",
    typicalAngle: "Distorcido",
    explanation:
      "Seis ligantes e um par livre geram uma estrutura distorcida, típica de casos mais avançados.",
  },
];

const MOLECULES: MoleculeGeometry[] = [
  {
    formula: "H₂O",
    name: "Água",
    centralAtom: "O",
    vsepr: "AX₂E₂",
    electronGeometry: "Tetraédrica",
    molecularGeometry: "Angular",
    idealAngle: "109,5°",
    realAngle: "≈ 104,5°",
    bondingPairs: 2,
    lonePairs: 2,
    atoms: [
      {
        label: "H",
        element: "H",
        position: { x: -1.08, y: -0.72, z: 0.62 },
      },
      {
        label: "H",
        element: "H",
        position: { x: 1.08, y: -0.72, z: 0.62 },
      },
    ],
    lonePairPositions: [
      {
        label: "par livre",
        position: { x: -0.92, y: 1.0, z: -0.55 },
      },
      {
        label: "par livre",
        position: { x: 0.92, y: 1.0, z: -0.55 },
      },
    ],
    shortExplanation:
      "O oxigênio tem quatro regiões eletrônicas ao redor: duas ligações O-H e dois pares livres.",
    angleExplanation:
      "A distribuição eletrônica ideal é tetraédrica, com ângulo de 109,5°. Porém, os pares livres ocupam mais espaço e repelem mais fortemente do que os pares ligantes. Essa repulsão comprime as ligações O-H, reduzindo o ângulo para aproximadamente 104,5°.",
    vestibularNote:
      "Em prova, o ponto central é perceber que a geometria eletrônica é tetraédrica, mas a geometria molecular é angular, porque os pares livres não aparecem como átomos ligados.",
    commonMistake:
      "Achar que H₂O seria linear porque tem apenas dois hidrogênios ligados ao oxigênio. O erro é ignorar os dois pares livres do oxigênio.",
  },
  {
    formula: "NH₃",
    name: "Amônia",
    centralAtom: "N",
    vsepr: "AX₃E",
    electronGeometry: "Tetraédrica",
    molecularGeometry: "Piramidal trigonal",
    idealAngle: "109,5°",
    realAngle: "≈ 107°",
    bondingPairs: 3,
    lonePairs: 1,
    atoms: [
      {
        label: "H",
        element: "H",
        position: { x: -1.15, y: -0.78, z: 0.46 },
      },
      {
        label: "H",
        element: "H",
        position: { x: 1.15, y: -0.78, z: 0.46 },
      },
      {
        label: "H",
        element: "H",
        position: { x: 0, y: -1.05, z: -1.05 },
      },
    ],
    lonePairPositions: [
      {
        label: "par livre",
        position: { x: 0, y: 1.15, z: 0 },
      },
    ],
    shortExplanation:
      "O nitrogênio tem quatro regiões eletrônicas: três ligações N-H e um par livre.",
    angleExplanation:
      "A geometria eletrônica é tetraédrica, mas como uma das regiões é um par livre, a forma molecular observada fica piramidal trigonal. O par livre repele os pares ligantes e comprime o ângulo H-N-H de 109,5° para aproximadamente 107°.",
    vestibularNote:
      "A sequência clássica é CH₄, NH₃ e H₂O: tetraédrica, piramidal trigonal e angular. O ângulo diminui conforme aumenta o número de pares livres.",
    commonMistake:
      "Confundir geometria eletrônica com geometria molecular. Em NH₃, a distribuição eletrônica é tetraédrica, mas a forma da molécula é piramidal trigonal.",
  },
  {
    formula: "CH₄",
    name: "Metano",
    centralAtom: "C",
    vsepr: "AX₄",
    electronGeometry: "Tetraédrica",
    molecularGeometry: "Tetraédrica",
    idealAngle: "109,5°",
    realAngle: "109,5°",
    bondingPairs: 4,
    lonePairs: 0,
    atoms: [
      {
        label: "H",
        element: "H",
        position: { x: 1, y: 1, z: 1 },
      },
      {
        label: "H",
        element: "H",
        position: { x: -1, y: -1, z: 1 },
      },
      {
        label: "H",
        element: "H",
        position: { x: -1, y: 1, z: -1 },
      },
      {
        label: "H",
        element: "H",
        position: { x: 1, y: -1, z: -1 },
      },
    ],
    lonePairPositions: [],
    shortExplanation:
      "O carbono tem quatro regiões eletrônicas, todas correspondentes a ligações C-H.",
    angleExplanation:
      "Como não há pares livres no carbono, as quatro ligações se distribuem da forma mais afastada possível no espaço, formando um tetraedro regular. Por isso, o ângulo H-C-H é de aproximadamente 109,5°.",
    vestibularNote:
      "CH₄ é o exemplo clássico de geometria tetraédrica sem distorção por pares livres.",
    commonMistake:
      "Desenhar o metano como se fosse plano. A molécula é tridimensional, com os hidrogênios apontando para os vértices de um tetraedro.",
  },
  {
    formula: "CO₂",
    name: "Dióxido de carbono",
    centralAtom: "C",
    vsepr: "AX₂",
    electronGeometry: "Linear",
    molecularGeometry: "Linear",
    idealAngle: "180°",
    realAngle: "180°",
    bondingPairs: 2,
    lonePairs: 0,
    atoms: [
      {
        label: "O",
        element: "O",
        position: { x: -1.7, y: 0, z: 0 },
      },
      {
        label: "O",
        element: "O",
        position: { x: 1.7, y: 0, z: 0 },
      },
    ],
    lonePairPositions: [],
    shortExplanation:
      "O carbono central possui duas regiões eletrônicas ao redor, correspondentes às duas ligações duplas C=O.",
    angleExplanation:
      "Na teoria VSEPR, uma ligação dupla conta como uma região eletrônica. Assim, o carbono tem duas regiões ao redor dele. A maior separação possível entre duas regiões é 180°, por isso a molécula é linear.",
    vestibularNote:
      "Mesmo tendo ligações duplas, o CO₂ é tratado como AX₂ para geometria molecular.",
    commonMistake:
      "Contar cada ligação dupla como duas direções diferentes. Para geometria molecular, cada ligação dupla ocupa uma região eletrônica.",
  },
  {
    formula: "BF₃",
    name: "Trifluoreto de boro",
    centralAtom: "B",
    vsepr: "AX₃",
    electronGeometry: "Trigonal plana",
    molecularGeometry: "Trigonal plana",
    idealAngle: "120°",
    realAngle: "120°",
    bondingPairs: 3,
    lonePairs: 0,
    atoms: [
      {
        label: "F",
        element: "F",
        position: { x: 0, y: 1.45, z: 0 },
      },
      {
        label: "F",
        element: "F",
        position: { x: -1.25, y: -0.72, z: 0 },
      },
      {
        label: "F",
        element: "F",
        position: { x: 1.25, y: -0.72, z: 0 },
      },
    ],
    lonePairPositions: [],
    shortExplanation:
      "O boro possui três regiões eletrônicas ligantes e nenhum par livre no átomo central.",
    angleExplanation:
      "Três regiões eletrônicas se afastam ao máximo em um plano, formando ângulos de 120° entre si. Por isso, BF₃ apresenta geometria trigonal plana.",
    vestibularNote:
      "BF₃ é um exemplo importante de molécula trigonal plana e também aparece em discussões sobre exceções ao octeto.",
    commonMistake:
      "Forçar uma geometria tetraédrica por pensar apenas no octeto. O boro em BF₃ tem três regiões eletrônicas ao redor.",
  },
  {
    formula: "SO₂",
    name: "Dióxido de enxofre",
    centralAtom: "S",
    vsepr: "AX₂E",
    electronGeometry: "Trigonal plana",
    molecularGeometry: "Angular",
    idealAngle: "120°",
    realAngle: "≈ 119°",
    bondingPairs: 2,
    lonePairs: 1,
    atoms: [
      {
        label: "O",
        element: "O",
        position: { x: -1.25, y: -0.55, z: 0 },
      },
      {
        label: "O",
        element: "O",
        position: { x: 1.25, y: -0.55, z: 0 },
      },
    ],
    lonePairPositions: [
      {
        label: "par livre",
        position: { x: 0, y: 1.25, z: 0 },
      },
    ],
    shortExplanation:
      "O enxofre tem três regiões eletrônicas: duas regiões ligantes S-O e um par livre.",
    angleExplanation:
      "A geometria eletrônica é trigonal plana, com ângulo ideal próximo de 120°. Como uma das três regiões é um par livre, a molécula fica angular. O par livre repele mais fortemente as ligações, gerando pequena compressão no ângulo.",
    vestibularNote:
      "SO₂ é um exemplo clássico de molécula angular derivada de uma geometria eletrônica trigonal plana.",
    commonMistake:
      "Achar que toda molécula com dois átomos ligados ao central é linear. Pares livres mudam a forma molecular.",
  },
  {
    formula: "PCl₅",
    name: "Pentacloreto de fósforo",
    centralAtom: "P",
    vsepr: "AX₅",
    electronGeometry: "Bipiramidal trigonal",
    molecularGeometry: "Bipiramidal trigonal",
    idealAngle: "90°, 120° e 180°",
    realAngle: "90°, 120° e 180°",
    bondingPairs: 5,
    lonePairs: 0,
    atoms: [
      {
        label: "Cl",
        element: "Cl",
        position: { x: 0, y: 1.65, z: 0 },
      },
      {
        label: "Cl",
        element: "Cl",
        position: { x: 0, y: -1.65, z: 0 },
      },
      {
        label: "Cl",
        element: "Cl",
        position: { x: 1.45, y: 0, z: 0 },
      },
      {
        label: "Cl",
        element: "Cl",
        position: { x: -0.72, y: 0, z: 1.25 },
      },
      {
        label: "Cl",
        element: "Cl",
        position: { x: -0.72, y: 0, z: -1.25 },
      },
    ],
    lonePairPositions: [],
    shortExplanation:
      "O fósforo central tem cinco regiões eletrônicas ligantes e nenhum par livre.",
    angleExplanation:
      "Cinco regiões eletrônicas se organizam em uma bipirâmide trigonal: duas posições axiais e três posições equatoriais. Por isso, aparecem ângulos de 90°, 120° e 180°.",
    vestibularNote:
      "PCl₅ é exemplo clássico de expansão do octeto e geometria bipiramidal trigonal.",
    commonMistake:
      "Tentar encaixar cinco ligações em uma geometria tetraédrica. Com cinco regiões, o arranjo correto é bipiramidal trigonal.",
  },
  {
    formula: "SF₆",
    name: "Hexafluoreto de enxofre",
    centralAtom: "S",
    vsepr: "AX₆",
    electronGeometry: "Octaédrica",
    molecularGeometry: "Octaédrica",
    idealAngle: "90° e 180°",
    realAngle: "90° e 180°",
    bondingPairs: 6,
    lonePairs: 0,
    atoms: [
      {
        label: "F",
        element: "F",
        position: { x: 1.5, y: 0, z: 0 },
      },
      {
        label: "F",
        element: "F",
        position: { x: -1.5, y: 0, z: 0 },
      },
      {
        label: "F",
        element: "F",
        position: { x: 0, y: 1.5, z: 0 },
      },
      {
        label: "F",
        element: "F",
        position: { x: 0, y: -1.5, z: 0 },
      },
      {
        label: "F",
        element: "F",
        position: { x: 0, y: 0, z: 1.5 },
      },
      {
        label: "F",
        element: "F",
        position: { x: 0, y: 0, z: -1.5 },
      },
    ],
    lonePairPositions: [],
    shortExplanation:
      "O enxofre central apresenta seis regiões eletrônicas ligantes ao redor.",
    angleExplanation:
      "Seis regiões eletrônicas se afastam ao máximo formando uma geometria octaédrica. As ligações ficam orientadas em três eixos perpendiculares, gerando ângulos de 90° e 180°.",
    vestibularNote:
      "SF₆ é exemplo típico de geometria octaédrica e expansão do octeto.",
    commonMistake:
      "Pensar que seis ligantes ficariam em uma estrutura plana. A geometria octaédrica é tridimensional.",
  },
  {
    formula: "XeF₄",
    name: "Tetrafluoreto de xenônio",
    centralAtom: "Xe",
    vsepr: "AX₄E₂",
    electronGeometry: "Octaédrica",
    molecularGeometry: "Quadrado planar",
    idealAngle: "90° e 180°",
    realAngle: "90° e 180°",
    bondingPairs: 4,
    lonePairs: 2,
    atoms: [
      {
        label: "F",
        element: "F",
        position: { x: 1.45, y: 0, z: 0 },
      },
      {
        label: "F",
        element: "F",
        position: { x: -1.45, y: 0, z: 0 },
      },
      {
        label: "F",
        element: "F",
        position: { x: 0, y: 1.45, z: 0 },
      },
      {
        label: "F",
        element: "F",
        position: { x: 0, y: -1.45, z: 0 },
      },
    ],
    lonePairPositions: [
      {
        label: "par livre",
        position: { x: 0, y: 0, z: 1.45 },
      },
      {
        label: "par livre",
        position: { x: 0, y: 0, z: -1.45 },
      },
    ],
    shortExplanation:
      "O xenônio tem seis regiões eletrônicas: quatro ligações Xe-F e dois pares livres.",
    angleExplanation:
      "A geometria eletrônica é octaédrica. Os dois pares livres ocupam posições opostas para reduzir a repulsão entre eles. Assim, os quatro átomos de flúor ficam no mesmo plano, formando uma geometria quadrado planar.",
    vestibularNote:
      "XeF₄ é um caso muito bom para mostrar a diferença entre geometria eletrônica e geometria molecular.",
    commonMistake:
      "Achar que quatro ligantes sempre significam geometria tetraédrica. Em XeF₄ existem dois pares livres no átomo central, e o arranjo vem de uma geometria eletrônica octaédrica.",
  },
  {
    formula: "H₃O⁺",
    name: "Íon hidrônio",
    centralAtom: "O",
    vsepr: "AX₃E",
    electronGeometry: "Tetraédrica",
    molecularGeometry: "Piramidal trigonal",
    idealAngle: "109,5°",
    realAngle: "≈ 113°",
    bondingPairs: 3,
    lonePairs: 1,
    atoms: [
      {
        label: "H",
        element: "H",
        position: { x: -1.15, y: -0.78, z: 0.46 },
      },
      {
        label: "H",
        element: "H",
        position: { x: 1.15, y: -0.78, z: 0.46 },
      },
      {
        label: "H",
        element: "H",
        position: { x: 0, y: -1.05, z: -1.05 },
      },
    ],
    lonePairPositions: [
      {
        label: "par livre",
        position: { x: 0, y: 1.15, z: 0 },
      },
    ],
    shortExplanation:
      "No íon hidrônio, o oxigênio central possui três ligações O-H e um par livre.",
    angleExplanation:
      "A distribuição eletrônica é tetraédrica, mas como existe um par livre, a geometria molecular observada é piramidal trigonal. O ângulo H-O-H fica próximo de 113°, com influência da carga positiva e da organização eletrônica ao redor do oxigênio.",
    vestibularNote:
      "H₃O⁺ é útil para comparar com NH₃: ambos são AX₃E, mas o átomo central e a carga mudam detalhes do ângulo.",
    commonMistake:
      "Achar que a carga positiva elimina todos os pares livres. O H₃O⁺ ainda possui um par livre no oxigênio.",
  },
  {
    formula: "NH₄⁺",
    name: "Íon amônio",
    centralAtom: "N",
    vsepr: "AX₄",
    electronGeometry: "Tetraédrica",
    molecularGeometry: "Tetraédrica",
    idealAngle: "109,5°",
    realAngle: "109,5°",
    bondingPairs: 4,
    lonePairs: 0,
    atoms: [
      {
        label: "H",
        element: "H",
        position: { x: 1, y: 1, z: 1 },
      },
      {
        label: "H",
        element: "H",
        position: { x: -1, y: -1, z: 1 },
      },
      {
        label: "H",
        element: "H",
        position: { x: -1, y: 1, z: -1 },
      },
      {
        label: "H",
        element: "H",
        position: { x: 1, y: -1, z: -1 },
      },
    ],
    lonePairPositions: [],
    shortExplanation:
      "No NH₄⁺, o nitrogênio possui quatro ligações N-H e nenhum par livre no átomo central.",
    angleExplanation:
      "Como existem quatro regiões ligantes e nenhum par livre, elas se afastam ao máximo formando uma geometria tetraédrica regular, com ângulos de 109,5°.",
    vestibularNote:
      "NH₄⁺ é um bom contraste com NH₃: o NH₃ é AX₃E e piramidal, enquanto o NH₄⁺ é AX₄ e tetraédrico.",
    commonMistake:
      "Pensar que NH₄⁺ teria a mesma geometria do NH₃. A protonação remove o par livre como região não ligante e gera quatro ligações.",
  },
  {
    formula: "NO₃⁻",
    name: "Íon nitrato",
    centralAtom: "N",
    vsepr: "AX₃",
    electronGeometry: "Trigonal plana",
    molecularGeometry: "Trigonal plana",
    idealAngle: "120°",
    realAngle: "120°",
    bondingPairs: 3,
    lonePairs: 0,
    atoms: [
      {
        label: "O",
        element: "O",
        position: { x: 0, y: 1.45, z: 0 },
      },
      {
        label: "O",
        element: "O",
        position: { x: -1.25, y: -0.72, z: 0 },
      },
      {
        label: "O",
        element: "O",
        position: { x: 1.25, y: -0.72, z: 0 },
      },
    ],
    lonePairPositions: [],
    shortExplanation:
      "No nitrato, o nitrogênio central possui três regiões eletrônicas ligantes ao redor.",
    angleExplanation:
      "Três regiões eletrônicas se afastam ao máximo em um plano, formando ângulos de 120°. A ressonância distribui a carga e torna as ligações N-O equivalentes em uma representação média.",
    vestibularNote:
      "NO₃⁻ é clássico para geometria trigonal plana e ressonância.",
    commonMistake:
      "Achar que uma ligação dupla localizada muda a geometria. Para VSEPR, cada ligação ao oxigênio conta como uma região eletrônica ao redor do nitrogênio.",
  },
  {
    formula: "NO₂⁻",
    name: "Íon nitrito",
    centralAtom: "N",
    vsepr: "AX₂E",
    electronGeometry: "Trigonal plana",
    molecularGeometry: "Angular",
    idealAngle: "120°",
    realAngle: "≈ 115°",
    bondingPairs: 2,
    lonePairs: 1,
    atoms: [
      {
        label: "O",
        element: "O",
        position: { x: -1.25, y: -0.55, z: 0 },
      },
      {
        label: "O",
        element: "O",
        position: { x: 1.25, y: -0.55, z: 0 },
      },
    ],
    lonePairPositions: [
      {
        label: "par livre",
        position: { x: 0, y: 1.25, z: 0 },
      },
    ],
    shortExplanation:
      "No nitrito, o nitrogênio central possui duas regiões ligantes e um par livre.",
    angleExplanation:
      "A geometria eletrônica é trigonal plana, mas como uma das regiões é um par livre, a geometria molecular fica angular. O par livre comprime o ângulo em relação ao valor ideal de 120°.",
    vestibularNote:
      "NO₂⁻ é um bom exemplo de AX₂E, parecido na lógica com SO₂ e O₃.",
    commonMistake:
      "Achar que NO₂⁻ é linear por ter dois oxigênios ligados ao nitrogênio. O par livre torna a molécula angular.",
  },
  {
    formula: "CO₃²⁻",
    name: "Íon carbonato",
    centralAtom: "C",
    vsepr: "AX₃",
    electronGeometry: "Trigonal plana",
    molecularGeometry: "Trigonal plana",
    idealAngle: "120°",
    realAngle: "120°",
    bondingPairs: 3,
    lonePairs: 0,
    atoms: [
      {
        label: "O",
        element: "O",
        position: { x: 0, y: 1.45, z: 0 },
      },
      {
        label: "O",
        element: "O",
        position: { x: -1.25, y: -0.72, z: 0 },
      },
      {
        label: "O",
        element: "O",
        position: { x: 1.25, y: -0.72, z: 0 },
      },
    ],
    lonePairPositions: [],
    shortExplanation:
      "No carbonato, o carbono central possui três regiões eletrônicas ligantes.",
    angleExplanation:
      "As três regiões se distribuem em um plano com ângulos de 120°. A ressonância torna as ligações C-O equivalentes na estrutura média.",
    vestibularNote:
      "CO₃²⁻ costuma aparecer em questões envolvendo ressonância, geometria trigonal plana e íons poliatômicos.",
    commonMistake:
      "Tratar uma ligação dupla como se criasse uma direção extra. Para geometria molecular, cada ligação C-O é uma região ao redor do carbono.",
  },
  {
    formula: "SO₃",
    name: "Trióxido de enxofre",
    centralAtom: "S",
    vsepr: "AX₃",
    electronGeometry: "Trigonal plana",
    molecularGeometry: "Trigonal plana",
    idealAngle: "120°",
    realAngle: "120°",
    bondingPairs: 3,
    lonePairs: 0,
    atoms: [
      {
        label: "O",
        element: "O",
        position: { x: 0, y: 1.45, z: 0 },
      },
      {
        label: "O",
        element: "O",
        position: { x: -1.25, y: -0.72, z: 0 },
      },
      {
        label: "O",
        element: "O",
        position: { x: 1.25, y: -0.72, z: 0 },
      },
    ],
    lonePairPositions: [],
    shortExplanation:
      "No SO₃, o enxofre central possui três regiões eletrônicas ligantes e nenhum par livre no átomo central.",
    angleExplanation:
      "Com três regiões eletrônicas ao redor do enxofre, a maior separação ocorre em um plano, formando uma geometria trigonal plana com ângulos de 120°.",
    vestibularNote:
      "SO₃ é útil para comparar com SO₂: SO₃ é trigonal plano, enquanto SO₂ é angular por ter par livre.",
    commonMistake:
      "Confundir SO₂ e SO₃. O SO₂ possui par livre no enxofre; o SO₃ não.",
  },
  {
    formula: "SO₄²⁻",
    name: "Íon sulfato",
    centralAtom: "S",
    vsepr: "AX₄",
    electronGeometry: "Tetraédrica",
    molecularGeometry: "Tetraédrica",
    idealAngle: "109,5°",
    realAngle: "≈ 109,5°",
    bondingPairs: 4,
    lonePairs: 0,
    atoms: [
      {
        label: "O",
        element: "O",
        position: { x: 1, y: 1, z: 1 },
      },
      {
        label: "O",
        element: "O",
        position: { x: -1, y: -1, z: 1 },
      },
      {
        label: "O",
        element: "O",
        position: { x: -1, y: 1, z: -1 },
      },
      {
        label: "O",
        element: "O",
        position: { x: 1, y: -1, z: -1 },
      },
    ],
    lonePairPositions: [],
    shortExplanation:
      "No sulfato, o enxofre central apresenta quatro regiões eletrônicas ligantes.",
    angleExplanation:
      "Quatro regiões ligantes se afastam ao máximo em uma geometria tetraédrica, com ângulos próximos de 109,5°.",
    vestibularNote: "SO₄²⁻ é um exemplo importante de íon tetraédrico.",
    commonMistake:
      "Focar apenas nas cargas formais e esquecer que a geometria ao redor do enxofre é tetraédrica.",
  },
  {
    formula: "PO₄³⁻",
    name: "Íon fosfato",
    centralAtom: "P",
    vsepr: "AX₄",
    electronGeometry: "Tetraédrica",
    molecularGeometry: "Tetraédrica",
    idealAngle: "109,5°",
    realAngle: "≈ 109,5°",
    bondingPairs: 4,
    lonePairs: 0,
    atoms: [
      {
        label: "O",
        element: "O",
        position: { x: 1, y: 1, z: 1 },
      },
      {
        label: "O",
        element: "O",
        position: { x: -1, y: -1, z: 1 },
      },
      {
        label: "O",
        element: "O",
        position: { x: -1, y: 1, z: -1 },
      },
      {
        label: "O",
        element: "O",
        position: { x: 1, y: -1, z: -1 },
      },
    ],
    lonePairPositions: [],
    shortExplanation:
      "No fosfato, o fósforo central possui quatro regiões eletrônicas ligantes.",
    angleExplanation:
      "As quatro regiões ligantes se organizam em um tetraedro, resultando em ângulos próximos de 109,5°.",
    vestibularNote:
      "PO₄³⁻ é comum em questões de íons poliatômicos e geometria tetraédrica.",
    commonMistake:
      "Achar que a carga do íon muda automaticamente a geometria. A geometria depende das regiões eletrônicas ao redor do átomo central.",
  },
  {
    formula: "HCN",
    name: "Ácido cianídrico",
    centralAtom: "C",
    vsepr: "AX₂",
    electronGeometry: "Linear",
    molecularGeometry: "Linear",
    idealAngle: "180°",
    realAngle: "180°",
    bondingPairs: 2,
    lonePairs: 0,
    atoms: [
      {
        label: "H",
        element: "H",
        position: { x: -1.7, y: 0, z: 0 },
      },
      {
        label: "N",
        element: "N",
        position: { x: 1.7, y: 0, z: 0 },
      },
    ],
    lonePairPositions: [],
    shortExplanation:
      "No HCN, o carbono central possui duas regiões eletrônicas: uma ligação com H e uma ligação tripla com N.",
    angleExplanation:
      "A ligação tripla conta como uma única região eletrônica para VSEPR. Assim, o carbono possui duas regiões, que se afastam em 180°, formando uma molécula linear.",
    vestibularNote:
      "HCN é um exemplo bom para lembrar que ligação simples, dupla ou tripla conta como uma região ao redor do átomo central.",
    commonMistake:
      "Contar a ligação tripla como três direções. Para geometria, ela é uma região eletrônica.",
  },
  {
    formula: "O₃",
    name: "Ozônio",
    centralAtom: "O",
    vsepr: "AX₂E",
    electronGeometry: "Trigonal plana",
    molecularGeometry: "Angular",
    idealAngle: "120°",
    realAngle: "≈ 117°",
    bondingPairs: 2,
    lonePairs: 1,
    atoms: [
      {
        label: "O",
        element: "O",
        position: { x: -1.25, y: -0.55, z: 0 },
      },
      {
        label: "O",
        element: "O",
        position: { x: 1.25, y: -0.55, z: 0 },
      },
    ],
    lonePairPositions: [
      {
        label: "par livre",
        position: { x: 0, y: 1.25, z: 0 },
      },
    ],
    shortExplanation:
      "No ozônio, o oxigênio central possui duas regiões ligantes e um par livre.",
    angleExplanation:
      "A geometria eletrônica é trigonal plana, mas a presença de um par livre faz a geometria molecular ser angular, com ângulo menor que 120°.",
    vestibularNote: "O₃ é importante para comparar com SO₂ e NO₂⁻.",
    commonMistake:
      "Achar que O₃ é linear por possuir três átomos em sequência. O par livre no átomo central torna a molécula angular.",
  },
  {
    formula: "XeF₂",
    name: "Difluoreto de xenônio",
    centralAtom: "Xe",
    vsepr: "AX₂E₃",
    electronGeometry: "Bipiramidal trigonal",
    molecularGeometry: "Linear",
    idealAngle: "180°",
    realAngle: "180°",
    bondingPairs: 2,
    lonePairs: 3,
    atoms: [
      {
        label: "F",
        element: "F",
        position: { x: -1.7, y: 0, z: 0 },
      },
      {
        label: "F",
        element: "F",
        position: { x: 1.7, y: 0, z: 0 },
      },
    ],
    lonePairPositions: [
      {
        label: "par livre",
        position: { x: 0, y: 1.35, z: 0 },
      },
      {
        label: "par livre",
        position: { x: -1.15, y: -0.7, z: 0 },
      },
      {
        label: "par livre",
        position: { x: 1.15, y: -0.7, z: 0 },
      },
    ],
    shortExplanation:
      "No XeF₂, o xenônio central tem duas ligações Xe-F e três pares livres.",
    angleExplanation:
      "A geometria eletrônica é bipiramidal trigonal. Os três pares livres ocupam posições equatoriais, reduzindo repulsões. As duas ligações Xe-F ficam em posições axiais opostas, gerando geometria molecular linear.",
    vestibularNote:
      "XeF₂ é um exemplo clássico de molécula linear apesar de possuir pares livres.",
    commonMistake:
      "Achar que qualquer molécula com pares livres precisa ser angular. Em XeF₂, a disposição dos pares livres mantém as ligações opostas.",
  },
  {
    formula: "ClF₃",
    name: "Trifluoreto de cloro",
    centralAtom: "Cl",
    vsepr: "AX₃E₂",
    electronGeometry: "Bipiramidal trigonal",
    molecularGeometry: "Forma de T",
    idealAngle: "90° e 180°",
    realAngle: "≈ 87,5° e 180°",
    bondingPairs: 3,
    lonePairs: 2,
    atoms: [
      {
        label: "F",
        element: "F",
        position: { x: 0, y: 1.55, z: 0 },
      },
      {
        label: "F",
        element: "F",
        position: { x: 0, y: -1.55, z: 0 },
      },
      {
        label: "F",
        element: "F",
        position: { x: 1.45, y: 0, z: 0 },
      },
    ],
    lonePairPositions: [
      {
        label: "par livre",
        position: { x: -0.95, y: 0, z: 1.05 },
      },
      {
        label: "par livre",
        position: { x: -0.95, y: 0, z: -1.05 },
      },
    ],
    shortExplanation:
      "No ClF₃, o cloro central possui três ligações Cl-F e dois pares livres.",
    angleExplanation:
      "A geometria eletrônica é bipiramidal trigonal. Os pares livres ocupam posições que reduzem repulsões, deixando os átomos ligados em uma disposição em forma de T.",
    vestibularNote:
      "ClF₃ é importante para visualizar que pares livres podem gerar geometrias menos intuitivas, como forma de T.",
    commonMistake:
      "Pensar que três ligantes sempre formam trigonal plana. Aqui existem dois pares livres no átomo central.",
  },
  {
    formula: "SF₄",
    name: "Tetrafluoreto de enxofre",
    centralAtom: "S",
    vsepr: "AX₄E",
    electronGeometry: "Bipiramidal trigonal",
    molecularGeometry: "Gangorra",
    idealAngle: "90°, 120° e 180°",
    realAngle: "< 90° e < 120°",
    bondingPairs: 4,
    lonePairs: 1,
    atoms: [
      {
        label: "F",
        element: "F",
        position: { x: 0, y: 1.55, z: 0 },
      },
      {
        label: "F",
        element: "F",
        position: { x: 0, y: -1.55, z: 0 },
      },
      {
        label: "F",
        element: "F",
        position: { x: 1.35, y: 0, z: 0.95 },
      },
      {
        label: "F",
        element: "F",
        position: { x: 1.35, y: 0, z: -0.95 },
      },
    ],
    lonePairPositions: [
      {
        label: "par livre",
        position: { x: -1.2, y: 0, z: 0 },
      },
    ],
    shortExplanation:
      "No SF₄, o enxofre central possui quatro ligações S-F e um par livre.",
    angleExplanation:
      "A geometria eletrônica é bipiramidal trigonal. O par livre ocupa uma posição equatorial, reduzindo repulsões, e a geometria molecular resultante é chamada de gangorra.",
    vestibularNote:
      "SF₄ é exemplo clássico de AX₄E, uma das geometrias mais fáceis de errar em prova.",
    commonMistake:
      "Achar que quatro ligantes sempre indicam tetraédrica. Em SF₄ há um par livre adicional, totalizando cinco regiões eletrônicas.",
  },
  {
    formula: "XeF₆",
    name: "Hexafluoreto de xenônio",
    centralAtom: "Xe",
    vsepr: "AX₆E",
    electronGeometry: "Sete regiões eletrônicas",
    molecularGeometry: "Octaédrica distorcida",
    idealAngle: "≈ 90° e 180°",
    realAngle: "distorcido",
    bondingPairs: 6,
    lonePairs: 1,
    atoms: [
      {
        label: "F",
        element: "F",
        position: { x: 1.5, y: 0, z: 0 },
      },
      {
        label: "F",
        element: "F",
        position: { x: -1.5, y: 0, z: 0 },
      },
      {
        label: "F",
        element: "F",
        position: { x: 0, y: 1.5, z: 0 },
      },
      {
        label: "F",
        element: "F",
        position: { x: 0, y: -1.5, z: 0 },
      },
      {
        label: "F",
        element: "F",
        position: { x: 0, y: 0, z: 1.5 },
      },
      {
        label: "F",
        element: "F",
        position: { x: 0, y: 0, z: -1.5 },
      },
    ],
    lonePairPositions: [
      {
        label: "par livre",
        position: { x: 1.05, y: 1.05, z: 1.05 },
      },
    ],
    shortExplanation:
      "No XeF₆, o xenônio possui seis ligações Xe-F e um par livre, gerando uma estrutura distorcida.",
    angleExplanation:
      "A presença de um par livre causa distorção na geometria esperada. Por isso, a molécula costuma ser descrita como octaédrica distorcida.",
    vestibularNote:
      "XeF₆ é mais avançada e serve para mostrar que nem todas as geometrias reais são perfeitamente ideais.",
    commonMistake:
      "Tratar XeF₆ como uma octaédrica perfeita sem considerar o par livre no xenônio.",
  },
  {
    formula: "HNO₃",
    name: "Ácido nítrico",
    centralAtom: "N",
    vsepr: "AX₃",
    electronGeometry: "Trigonal plana",
    molecularGeometry: "Trigonal plana",
    idealAngle: "120°",
    realAngle: "≈ 120°",
    bondingPairs: 3,
    lonePairs: 0,
    atoms: [
      {
        label: "O",
        element: "O",
        position: { x: 0, y: 1.45, z: 0 },
      },
      {
        label: "O",
        element: "O",
        position: { x: -1.25, y: -0.72, z: 0 },
      },
      {
        label: "OH",
        element: "O",
        position: { x: 1.25, y: -0.72, z: 0 },
      },
    ],
    lonePairPositions: [],
    shortExplanation:
      "No HNO₃, a geometria principal é analisada ao redor do nitrogênio, que se liga a três regiões contendo oxigênio.",
    angleExplanation:
      "Ao redor do nitrogênio há três regiões eletrônicas, que se organizam em uma geometria trigonal plana, com ângulos próximos de 120°. A estrutura real envolve ressonância entre ligações N-O.",
    vestibularNote:
      "Para vestibular, o mais importante é reconhecer o arranjo trigonal plano ao redor do nitrogênio.",
    commonMistake:
      "Tentar analisar a molécula inteira como se todos os átomos estivessem ao redor de um único centro sem distinguir o centro geométrico principal.",
  },
];

function rotatePoint(point: Vec3, angleX: number, angleY: number): Vec3 {
  const xRad = (angleX * Math.PI) / 180;
  const yRad = (angleY * Math.PI) / 180;

  const cosX = Math.cos(xRad);
  const sinX = Math.sin(xRad);
  const cosY = Math.cos(yRad);
  const sinY = Math.sin(yRad);

  const yAfterX = point.y * cosX - point.z * sinX;
  const zAfterX = point.y * sinX + point.z * cosX;

  const xAfterY = point.x * cosY + zAfterX * sinY;
  const zAfterY = -point.x * sinY + zAfterX * cosY;

  return {
    x: xAfterY,
    y: yAfterX,
    z: zAfterY,
  };
}

function projectPoint(point: Vec3): ProjectedPoint {
  const distance = 6;
  const scale = 110;
  const perspective = distance / (distance - point.z);

  return {
    x: 380 + point.x * scale * perspective,
    y: 280 - point.y * scale * perspective,
    z: point.z,
    perspective,
  };
}

function normalizeAngleDifference(angle: number) {
  let value = angle;

  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;

  return value;
}

function buildAngleArcPath(
  center: ProjectedPoint,
  first: ProjectedPoint,
  second: ProjectedPoint,
  radius = 76
) {
  const vectorA = {
    x: first.x - center.x,
    y: first.y - center.y,
  };

  const vectorB = {
    x: second.x - center.x,
    y: second.y - center.y,
  };

  const lengthA = Math.hypot(vectorA.x, vectorA.y);
  const lengthB = Math.hypot(vectorB.x, vectorB.y);

  if (lengthA === 0 || lengthB === 0) {
    return {
      path: "",
      labelX: center.x,
      labelY: center.y,
    };
  }

  const startAngle = Math.atan2(vectorA.y, vectorA.x);
  const endAngle = Math.atan2(vectorB.y, vectorB.x);
  const delta = normalizeAngleDifference(endAngle - startAngle);

  const sweepFlag = delta >= 0 ? 1 : 0;
  const largeArcFlag = Math.abs(delta) > Math.PI ? 1 : 0;

  const start = {
    x: center.x + Math.cos(startAngle) * radius,
    y: center.y + Math.sin(startAngle) * radius,
  };

  const end = {
    x: center.x + Math.cos(endAngle) * radius,
    y: center.y + Math.sin(endAngle) * radius,
  };

  const midAngle = startAngle + delta / 2;

  const label = {
    x: center.x + Math.cos(midAngle) * (radius + 46),
    y: center.y + Math.sin(midAngle) * (radius + 46),
  };

  return {
    path: `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`,
    labelX: label.x,
    labelY: label.y,
  };
}

function getElementVisual(element: string) {
  switch (element) {
    case "H":
      return {
        fill: "#f8fafc",
        stroke: "#cbd5e1",
        text: "#0f172a",
      };
    case "O":
      return {
        fill: "#ef4444",
        stroke: "#fecaca",
        text: "#ffffff",
      };
    case "N":
      return {
        fill: "#3b82f6",
        stroke: "#bfdbfe",
        text: "#ffffff",
      };
    case "C":
      return {
        fill: "#0f172a",
        stroke: "#64748b",
        text: "#ffffff",
      };
    case "F":
      return {
        fill: "#10b981",
        stroke: "#a7f3d0",
        text: "#ffffff",
      };
    case "Cl":
      return {
        fill: "#16a34a",
        stroke: "#bbf7d0",
        text: "#ffffff",
      };
    case "B":
      return {
        fill: "#f97316",
        stroke: "#fed7aa",
        text: "#ffffff",
      };
    case "P":
      return {
        fill: "#7c3aed",
        stroke: "#ddd6fe",
        text: "#ffffff",
      };
    case "S":
      return {
        fill: "#eab308",
        stroke: "#fef08a",
        text: "#0f172a",
      };
    case "Xe":
      return {
        fill: "#6d28d9",
        stroke: "#ddd6fe",
        text: "#ffffff",
      };
    default:
      return {
        fill: "#06b6d4",
        stroke: "#a5f3fc",
        text: "#ffffff",
      };
  }
}

export function MolecularGeometrySimulator() {
  const [selectedFormula, setSelectedFormula] = useState("H₂O");
  const [rotationX, setRotationX] = useState(20);
  const [rotationY, setRotationY] = useState(-25);
  const [showLonePairs, setShowLonePairs] = useState(true);
  const [showAngleArc, setShowAngleArc] = useState(true);
  const [explanationMode, setExplanationMode] =
    useState<ExplanationMode>("resumo");
  const [builderBondingPairs, setBuilderBondingPairs] = useState(2);
  const [builderLonePairs, setBuilderLonePairs] = useState(2);
  const [autoRotate, setAutoRotate] = useState(false);

  const molecule = useMemo(() => {
    return (
      MOLECULES.find(item => item.formula === selectedFormula) ?? MOLECULES[0]
    );
  }, [selectedFormula]);

  useEffect(() => {
    if (!autoRotate) return;

    const intervalId = window.setInterval(() => {
      setRotationY(current => {
        const next = current + 1.2;
        return next > 180 ? -180 : next;
      });
    }, 60);

    return () => window.clearInterval(intervalId);
  }, [autoRotate]);

  const centralPoint = projectPoint(
    rotatePoint({ x: 0, y: 0, z: 0 }, rotationX, rotationY)
  );

  const projectedAtoms = molecule.atoms.map((atom, index) => {
    const rotated = rotatePoint(atom.position, rotationX, rotationY);

    return {
      atom,
      point: projectPoint(rotated),
      key: `${atom.element}-${atom.label}-${index}`,
    };
  });

  const projectedLonePairs = molecule.lonePairPositions.map((pair, index) => {
    const rotated = rotatePoint(pair.position, rotationX, rotationY);

    return {
      pair,
      point: projectPoint(rotated),
      key: `lone-pair-${index}`,
    };
  });

  const angleArc =
    projectedAtoms.length >= 2
      ? buildAngleArcPath(
          centralPoint,
          projectedAtoms[0].point,
          projectedAtoms[1].point
        )
      : null;

  const discoverySteps = [
    {
      title: "1. Escolher o átomo central",
      description: `O átomo central considerado é ${molecule.centralAtom}. É ao redor dele que analisamos as regiões eletrônicas.`,
    },
    {
      title: "2. Contar regiões eletrônicas",
      description: `A molécula possui ${molecule.bondingPairs} região(ões) ligante(s) e ${molecule.lonePairs} par(es) livre(s) ao redor do átomo central.`,
    },
    {
      title: "3. Montar o modelo VSEPR",
      description: `Com esses dados, o modelo fica ${molecule.vsepr}. A letra A representa o átomo central, X representa átomos ligados e E representa pares livres.`,
    },
    {
      title: "4. Determinar a geometria eletrônica",
      description: `Considerando ligações e pares livres, a geometria eletrônica é ${molecule.electronGeometry.toLowerCase()}.`,
    },
    {
      title: "5. Determinar a geometria molecular",
      description: `Observando apenas os átomos ligados, a geometria molecular é ${molecule.molecularGeometry.toLowerCase()}.`,
    },
    {
      title: "6. Entender o ângulo",
      description: `O ângulo ideal seria ${molecule.idealAngle}, mas o ângulo observado/aproximado é ${molecule.realAngle}. A diferença aparece por causa da repulsão entre as regiões eletrônicas, especialmente quando há pares livres.`,
    },
  ];

  const comparisonMolecules = ["CH₄", "NH₃", "H₂O"]
    .map(formula => MOLECULES.find(item => item.formula === formula))
    .filter(Boolean) as MoleculeGeometry[];

  const isInMainComparison = comparisonMolecules.some(
    item => item.formula === molecule.formula
  );

  const builderVsepr = buildVseprLabel(builderBondingPairs, builderLonePairs);

  const builderModel = VSEPR_MODELS.find(model => model.key === builderVsepr);

  const builderExamples = MOLECULES.filter(item => item.vsepr === builderVsepr);

  const shortGeometrySummary = `${molecule.formula} é uma espécie do tipo ${
    molecule.vsepr
  }. A geometria eletrônica é ${molecule.electronGeometry.toLowerCase()} e a geometria molecular é ${molecule.molecularGeometry.toLowerCase()}. O ângulo típico é ${
    molecule.realAngle
  }. ${
    molecule.lonePairs > 0
      ? `A presença de ${molecule.lonePairs} par(es) livre(s) aumenta a repulsão e pode comprimir os ângulos.`
      : "Como não há pares livres no átomo central, a geometria molecular coincide com a organização das regiões ligantes."
  }`;

  const centralRenderObject: RenderObject = {
    type: "central",
    key: "central",
    z: centralPoint.z,
    point: centralPoint,
  };

  const renderObjects: RenderObject[] = [
    ...projectedAtoms.map((item): RenderObject => {
      return {
        type: "atom",
        key: item.key,
        z: item.point.z,
        atom: item.atom,
        point: item.point,
      };
    }),
    ...(showLonePairs
      ? projectedLonePairs.map((item): RenderObject => {
          return {
            type: "lonePair",
            key: item.key,
            z: item.point.z,
            pair: item.pair,
            point: item.point,
          };
        })
      : []),
    centralRenderObject,
  ].sort((a, b) => a.z - b.z);

  function resetRotation() {
    setRotationX(20);
    setRotationY(-25);
    setAutoRotate(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="overflow-hidden border-slate-200 dark:[.admin-theme_&]:border-slate-700 bg-white dark:[.admin-theme_&]:bg-slate-900">
        <div className="border-b border-slate-100 dark:[.admin-theme_&]:border-slate-700 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:[.admin-theme_&]:text-purple-300">
                <Atom className="h-4 w-4" />
                Visualização 3D didática
              </div>

              <h2 className="mt-1 text-2xl font-black text-slate-900 dark:[.admin-theme_&]:text-slate-100">
                {molecule.formula} · {molecule.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:[.admin-theme_&]:text-slate-400">
                Modelo {molecule.vsepr}, geometria molecular{" "}
                {molecule.molecularGeometry.toLowerCase()}.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={selectedFormula}
                onChange={event => setSelectedFormula(event.target.value)}
                className="rounded-2xl border border-slate-200 dark:[.admin-theme_&]:border-slate-700 bg-white dark:[.admin-theme_&]:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:[.admin-theme_&]:text-slate-300 outline-none focus:border-slate-900"
              >
                {MOLECULES.map(item => (
                  <option key={item.formula} value={item.formula}>
                    {item.formula} · {item.name}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLonePairs(current => !current)}
                className="gap-2 rounded-2xl"
              >
                {showLonePairs ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {showLonePairs ? "Ocultar pares" : "Mostrar pares"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAngleArc(current => !current)}
                className="gap-2 rounded-2xl"
              >
                {showAngleArc ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {showAngleArc ? "Ocultar arco" : "Mostrar arco"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
          <div className="relative min-h-[560px] overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950">
            <div className="absolute left-6 top-6 z-20 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-200">
                Ângulo
              </p>
              <p className="mt-1 text-2xl font-black">{molecule.realAngle}</p>
            </div>

            <div className="absolute bottom-6 left-6 z-20 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-200">
                Tipo VSEPR
              </p>
              <p className="mt-1 text-xl font-black">{molecule.vsepr}</p>
            </div>

            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 760 560"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <radialGradient id="centralGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </radialGradient>

                <filter
                  id="softShadow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feDropShadow
                    dx="0"
                    dy="8"
                    stdDeviation="8"
                    floodColor="#000000"
                    floodOpacity="0.35"
                  />
                </filter>
              </defs>

              <rect width="760" height="560" fill="transparent" />

              <g opacity="0.18">
                <circle cx="120" cy="100" r="90" fill="#a855f7" />
                <circle cx="660" cy="460" r="120" fill="#06b6d4" />
                <circle cx="420" cy="80" r="60" fill="#22c55e" />
              </g>

              {projectedAtoms.map(item => (
                <line
                  key={`bond-${item.key}`}
                  x1={centralPoint.x}
                  y1={centralPoint.y}
                  x2={item.point.x}
                  y2={item.point.y}
                  stroke="#a5f3fc"
                  strokeWidth={Math.max(4, 7 * item.point.perspective)}
                  strokeLinecap="round"
                  opacity="0.88"
                />
              ))}

              {showAngleArc && angleArc?.path && (
                <g>
                  <path
                    d={angleArc.path}
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="5"
                    strokeLinecap="round"
                    opacity="0.95"
                  />

                  <circle
                    cx={angleArc.labelX}
                    cy={angleArc.labelY}
                    r="34"
                    fill="#facc15"
                    opacity="0.95"
                  />

                  <text
                    x={angleArc.labelX}
                    y={angleArc.labelY + 5}
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="900"
                    fill="#1e293b"
                  >
                    {molecule.realAngle}
                  </text>
                </g>
              )}

              {showLonePairs &&
                projectedLonePairs.map(item => (
                  <line
                    key={`lone-line-${item.key}`}
                    x1={centralPoint.x}
                    y1={centralPoint.y}
                    x2={item.point.x}
                    y2={item.point.y}
                    stroke="#e9d5ff"
                    strokeWidth="3"
                    strokeDasharray="9 9"
                    strokeLinecap="round"
                    opacity="0.58"
                  />
                ))}

              {renderObjects.map(object => {
                if (object.type === "central") {
                  const radius = 42;

                  return (
                    <g key={object.key} filter="url(#softShadow)">
                      <circle
                        cx={object.point.x}
                        cy={object.point.y}
                        r={radius + 18}
                        fill="url(#centralGlow)"
                      />

                      <circle
                        cx={object.point.x}
                        cy={object.point.y}
                        r={radius}
                        fill="#06b6d4"
                        stroke="#a5f3fc"
                        strokeWidth="5"
                      />

                      <text
                        x={object.point.x}
                        y={object.point.y + 8}
                        textAnchor="middle"
                        fontSize="24"
                        fontWeight="900"
                        fill="#ffffff"
                      >
                        {molecule.centralAtom}
                      </text>
                    </g>
                  );
                }

                if (object.type === "lonePair") {
                  const radius = 26 * object.point.perspective;

                  return (
                    <g key={object.key} filter="url(#softShadow)">
                      <circle
                        cx={object.point.x}
                        cy={object.point.y}
                        r={radius + 10}
                        fill="#a855f7"
                        opacity="0.18"
                      />

                      <circle
                        cx={object.point.x - radius * 0.28}
                        cy={object.point.y}
                        r={radius * 0.32}
                        fill="#e9d5ff"
                        stroke="#ffffff"
                        strokeWidth="2"
                        opacity="0.9"
                      />

                      <circle
                        cx={object.point.x + radius * 0.28}
                        cy={object.point.y}
                        r={radius * 0.32}
                        fill="#e9d5ff"
                        stroke="#ffffff"
                        strokeWidth="2"
                        opacity="0.9"
                      />

                      <text
                        x={object.point.x}
                        y={object.point.y + radius + 18}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="800"
                        fill="#f5d0fe"
                      >
                        par livre
                      </text>
                    </g>
                  );
                }

                const visual = getElementVisual(object.atom.element);
                const radius = Math.max(24, 32 * object.point.perspective);

                return (
                  <g key={object.key} filter="url(#softShadow)">
                    <circle
                      cx={object.point.x}
                      cy={object.point.y}
                      r={radius}
                      fill={visual.fill}
                      stroke={visual.stroke}
                      strokeWidth="4"
                    />

                    <text
                      x={object.point.x}
                      y={object.point.y + 6}
                      textAnchor="middle"
                      fontSize={object.atom.label.length > 1 ? 15 : 20}
                      fontWeight="900"
                      fill={visual.text}
                    >
                      {object.atom.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="border-l border-slate-100 dark:[.admin-theme_&]:border-slate-700 bg-slate-50 dark:[.admin-theme_&]:bg-slate-900 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:[.admin-theme_&]:text-slate-100">
              <Rotate3D className="h-4 w-4" />
              Controle de rotação
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:[.admin-theme_&]:text-slate-400">
                  <span>Rotação vertical</span>
                  <span>{rotationX}°</span>
                </div>

                <input
                  type="range"
                  min="-80"
                  max="80"
                  value={rotationX}
                  onChange={event => setRotationX(Number(event.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:[.admin-theme_&]:text-slate-400">
                  <span>Rotação horizontal</span>
                  <span>{Math.round(rotationY)}°</span>
                </div>

                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={rotationY}
                  onChange={event => setRotationY(Number(event.target.value))}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAutoRotate(current => !current)}
                  className="gap-2 rounded-2xl"
                >
                  {autoRotate ? (
                    <PauseCircle className="h-4 w-4" />
                  ) : (
                    <PlayCircle className="h-4 w-4" />
                  )}
                  {autoRotate ? "Pausar" : "Girar"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={resetRotation}
                  className="gap-2 rounded-2xl"
                >
                  <RotateCcw className="h-4 w-4" />
                  Resetar
                </Button>
              </div>

              <div className="rounded-2xl border border-purple-100 dark:[.admin-theme_&]:border-purple-800 bg-white dark:[.admin-theme_&]:bg-slate-900 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-700 dark:[.admin-theme_&]:text-purple-300">
                  Leitura rápida
                </p>

                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500 dark:[.admin-theme_&]:text-slate-400">Pares ligantes</span>
                    <strong className="text-slate-900 dark:[.admin-theme_&]:text-slate-100">
                      {molecule.bondingPairs}
                    </strong>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500 dark:[.admin-theme_&]:text-slate-400">Pares livres</span>
                    <strong className="text-slate-900 dark:[.admin-theme_&]:text-slate-100">
                      {molecule.lonePairs}
                    </strong>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500 dark:[.admin-theme_&]:text-slate-400">Geometria eletrônica</span>
                    <strong className="text-right text-slate-900 dark:[.admin-theme_&]:text-slate-100">
                      {molecule.electronGeometry}
                    </strong>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500 dark:[.admin-theme_&]:text-slate-400">Geometria molecular</span>
                    <strong className="text-right text-slate-900 dark:[.admin-theme_&]:text-slate-100">
                      {molecule.molecularGeometry}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:[.admin-theme_&]:border-slate-700 bg-white dark:[.admin-theme_&]:bg-slate-900 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:[.admin-theme_&]:text-slate-400">
                  Legenda visual
                </p>

                <div className="mt-3 space-y-3 text-xs text-slate-700 dark:[.admin-theme_&]:text-slate-300">
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded-full bg-cyan-500 ring-2 ring-cyan-200 dark:[.admin-theme_&]:ring-cyan-800" />
                    <span>Átomo central</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:[.admin-theme_&]:ring-emerald-800" />
                    <span>Átomo ligado</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex gap-1">
                      <span className="h-3 w-3 rounded-full bg-purple-300 ring-1 ring-purple-100 dark:[.admin-theme_&]:ring-purple-800" />
                      <span className="h-3 w-3 rounded-full bg-purple-300 ring-1 ring-purple-100 dark:[.admin-theme_&]:ring-purple-800" />
                    </span>
                    <span>Par livre de elétrons</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="h-[3px] w-8 rounded-full bg-cyan-300" />
                    <span>Ligação química</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="h-[3px] w-8 rounded-full bg-yellow-400" />
                    <span>Ângulo destacado</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-100 dark:[.admin-theme_&]:border-cyan-800 bg-cyan-50 dark:[.admin-theme_&]:bg-cyan-950 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:[.admin-theme_&]:text-cyan-300">
                  Protótipo interno
                </p>

                <p className="mt-2 text-xs leading-5 text-cyan-900 dark:[.admin-theme_&]:text-cyan-200">
                  Esta visualização é didática. Átomos, ligações, pares livres e
                  ângulos ficam no mesmo SVG, então o alinhamento não quebra
                  quando a tela muda de tamanho.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:[.admin-theme_&]:border-slate-700 bg-slate-50/80 dark:[.admin-theme_&]:bg-slate-900/80 p-5">
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:[.admin-theme_&]:text-slate-100">
                <Beaker className="h-4 w-4" />
                Montar geometria por VSEPR
              </div>

              <h3 className="mt-2 text-xl font-black text-slate-900 dark:[.admin-theme_&]:text-slate-100">
                Escolha X e E
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:[.admin-theme_&]:text-slate-300">
                Monte o modelo geral da molécula usando a notação AXE. Aqui, X
                representa átomos ligados ao átomo central e E representa pares
                livres. Finalmente uma forma de estudar sem decorar molécula por
                molécula feito papagaio com jaleco.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:[.admin-theme_&]:text-slate-400">
                    Átomos ligados ao central
                  </label>

                  <select
                    value={builderBondingPairs}
                    onChange={event =>
                      setBuilderBondingPairs(Number(event.target.value))
                    }
                    className="w-full rounded-2xl border border-slate-200 dark:[.admin-theme_&]:border-slate-700 bg-white dark:[.admin-theme_&]:bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-700 dark:[.admin-theme_&]:text-slate-300 outline-none focus:border-slate-900"
                  >
                    {[2, 3, 4, 5, 6].map(value => (
                      <option key={value} value={value}>
                        {value} átomo(s) ligado(s)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:[.admin-theme_&]:text-slate-400">
                    Pares livres no central
                  </label>

                  <select
                    value={builderLonePairs}
                    onChange={event =>
                      setBuilderLonePairs(Number(event.target.value))
                    }
                    className="w-full rounded-2xl border border-slate-200 dark:[.admin-theme_&]:border-slate-700 bg-white dark:[.admin-theme_&]:bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-700 dark:[.admin-theme_&]:text-slate-300 outline-none focus:border-slate-900"
                  >
                    {[0, 1, 2, 3].map(value => (
                      <option key={value} value={value}>
                        {value} par(es) livre(s)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:[.admin-theme_&]:border-slate-700 bg-white dark:[.admin-theme_&]:bg-slate-900 p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-purple-700 dark:[.admin-theme_&]:text-purple-300">
                    Modelo montado
                  </p>

                  <p className="mt-1 text-4xl font-black text-slate-900 dark:[.admin-theme_&]:text-slate-100">
                    {builderVsepr}
                  </p>
                </div>

                {builderModel ? (
                  <div className="rounded-2xl border border-emerald-200 dark:[.admin-theme_&]:border-emerald-800 bg-emerald-50 dark:[.admin-theme_&]:bg-emerald-950 px-4 py-3 text-right">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:[.admin-theme_&]:text-emerald-300">
                      Ângulo típico
                    </p>

                    <p className="mt-1 text-xl font-black text-emerald-900 dark:[.admin-theme_&]:text-emerald-200">
                      {builderModel.typicalAngle}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-orange-200 dark:[.admin-theme_&]:border-orange-800 bg-orange-50 dark:[.admin-theme_&]:bg-orange-950 px-4 py-3 text-right">
                    <p className="text-xs font-bold uppercase tracking-wide text-orange-700 dark:[.admin-theme_&]:text-orange-300">
                      Atenção
                    </p>

                    <p className="mt-1 text-sm font-black text-orange-900 dark:[.admin-theme_&]:text-orange-200">
                      Modelo não cadastrado
                    </p>
                  </div>
                )}
              </div>

              {builderModel ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 dark:[.admin-theme_&]:bg-slate-900 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:[.admin-theme_&]:text-slate-400">
                      Geometria eletrônica
                    </p>

                    <p className="mt-1 text-lg font-black text-slate-900 dark:[.admin-theme_&]:text-slate-100">
                      {builderModel.electronGeometry}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 dark:[.admin-theme_&]:bg-slate-900 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:[.admin-theme_&]:text-slate-400">
                      Geometria molecular
                    </p>

                    <p className="mt-1 text-lg font-black text-slate-900 dark:[.admin-theme_&]:text-slate-100">
                      {builderModel.molecularGeometry}
                    </p>
                  </div>
                </div>
              ) : null}

              {builderModel ? (
                <p className="mt-4 text-sm leading-7 text-slate-700 dark:[.admin-theme_&]:text-slate-300">
                  {builderModel.explanation}
                </p>
              ) : (
                <p className="mt-4 text-sm leading-7 text-slate-700 dark:[.admin-theme_&]:text-slate-300">
                  Essa combinação ainda não está cadastrada no protótipo. Isso
                  não significa que seja impossível, só significa que ainda não
                  vale a pena botar o simulador para fingir certeza onde ele não
                  tem. Um raro momento de honestidade técnica.
                </p>
              )}

              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:[.admin-theme_&]:text-slate-400">
                  Exemplos cadastrados
                </p>

                {builderExamples.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {builderExamples.map(example => (
                      <button
                        key={example.formula}
                        type="button"
                        onClick={() => setSelectedFormula(example.formula)}
                        className="rounded-2xl border border-slate-200 dark:[.admin-theme_&]:border-slate-700 bg-slate-50 dark:[.admin-theme_&]:bg-slate-900 px-4 py-2 text-sm font-bold text-slate-700 dark:[.admin-theme_&]:text-slate-300 transition hover:border-purple-300 dark:[.admin-theme_&]:hover:border-purple-800 hover:bg-purple-50 dark:[.admin-theme_&]:hover:bg-purple-950 hover:text-purple-900 dark:[.admin-theme_&]:hover:text-purple-200"
                      >
                        {example.formula} · {example.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500 dark:[.admin-theme_&]:text-slate-400">
                    Nenhuma molécula cadastrada com esse modelo ainda.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="border-slate-200 dark:[.admin-theme_&]:border-slate-700 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:[.admin-theme_&]:text-emerald-300">
            <Atom className="h-4 w-4" />
            Comparação clássica
          </div>

          <h2 className="mt-2 text-2xl font-black text-slate-900 dark:[.admin-theme_&]:text-slate-100">
            CH₄ × NH₃ × H₂O
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600 dark:[.admin-theme_&]:text-slate-300">
            Essas três moléculas ajudam a enxergar uma regra essencial: quando
            aumenta o número de pares livres no átomo central, a repulsão
            eletrônica aumenta e o ângulo entre as ligações diminui.
          </p>

          <div className="mt-5 grid gap-3">
            {comparisonMolecules.map((item, index) => {
              const active = item.formula === molecule.formula;

              return (
                <button
                  key={item.formula}
                  type="button"
                  onClick={() => setSelectedFormula(item.formula)}
                  className={[
                    "rounded-2xl border p-4 text-left transition-all",
                    active
                      ? "border-emerald-400 dark:[.admin-theme_&]:border-emerald-800 bg-emerald-50 dark:[.admin-theme_&]:bg-emerald-950 shadow-sm"
                      : "border-slate-200 dark:[.admin-theme_&]:border-slate-700 bg-slate-50 dark:[.admin-theme_&]:bg-slate-900 hover:border-emerald-200 dark:[.admin-theme_&]:hover:border-emerald-800 hover:bg-emerald-50/50 dark:[.admin-theme_&]:hover:bg-emerald-950/50",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-slate-900 dark:[.admin-theme_&]:text-slate-100">
                        {item.formula}
                      </p>

                      <p className="text-sm font-semibold text-slate-600 dark:[.admin-theme_&]:text-slate-300">
                        {item.molecularGeometry}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:[.admin-theme_&]:text-slate-400">
                        Ângulo
                      </p>

                      <p className="text-lg font-black text-emerald-700 dark:[.admin-theme_&]:text-emerald-300">
                        {item.realAngle}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-white dark:[.admin-theme_&]:bg-slate-900 px-2 py-2">
                      <p className="font-semibold text-slate-500 dark:[.admin-theme_&]:text-slate-400">
                        Pares livres
                      </p>

                      <p className="mt-1 text-lg font-black text-slate-900 dark:[.admin-theme_&]:text-slate-100">
                        {item.lonePairs}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white dark:[.admin-theme_&]:bg-slate-900 px-2 py-2">
                      <p className="font-semibold text-slate-500 dark:[.admin-theme_&]:text-slate-400">Modelo</p>

                      <p className="mt-1 text-sm font-black text-slate-900 dark:[.admin-theme_&]:text-slate-100">
                        {item.vsepr}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white dark:[.admin-theme_&]:bg-slate-900 px-2 py-2">
                      <p className="font-semibold text-slate-500 dark:[.admin-theme_&]:text-slate-400">Ordem</p>

                      <p className="mt-1 text-lg font-black text-slate-900 dark:[.admin-theme_&]:text-slate-100">
                        {index + 1}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-emerald-200 dark:[.admin-theme_&]:border-emerald-800 bg-emerald-50 dark:[.admin-theme_&]:bg-emerald-950 p-4">
            <p className="text-sm font-black text-emerald-950 dark:[.admin-theme_&]:text-emerald-200">
              Ideia principal
            </p>

            <p className="mt-2 text-sm leading-7 text-emerald-900 dark:[.admin-theme_&]:text-emerald-200">
              CH₄ não possui pares livres no carbono e mantém o ângulo
              tetraédrico de 109,5°. NH₃ tem um par livre no nitrogênio, então o
              ângulo cai para cerca de 107°. H₂O tem dois pares livres no
              oxigênio, então a compressão é maior e o ângulo cai para cerca de
              104,5°.
            </p>
          </div>

          {!isInMainComparison && (
            <div className="mt-4 rounded-2xl border border-slate-200 dark:[.admin-theme_&]:border-slate-700 bg-slate-50 dark:[.admin-theme_&]:bg-slate-900 p-4">
              <p className="text-sm font-semibold text-slate-700 dark:[.admin-theme_&]:text-slate-300">
                A molécula atual não faz parte dessa comparação clássica, mas a
                lógica dos pares livres continua valendo para entender
                distorções de ângulo.
              </p>
            </div>
          )}
        </Card>

        <Card className="border-slate-200 dark:[.admin-theme_&]:border-slate-700 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-700 dark:[.admin-theme_&]:text-cyan-300">
            <Brain className="h-4 w-4" />
            Como descobrir essa geometria?
          </div>

          <h2 className="mt-2 text-2xl font-black text-slate-900 dark:[.admin-theme_&]:text-slate-100">
            Raciocínio passo a passo
          </h2>

          <div className="mt-5 space-y-3">
            {discoverySteps.map(step => (
              <div
                key={step.title}
                className="rounded-2xl border border-slate-200 dark:[.admin-theme_&]:border-slate-700 bg-slate-50 dark:[.admin-theme_&]:bg-slate-900 p-4"
              >
                <p className="text-sm font-black text-slate-900 dark:[.admin-theme_&]:text-slate-100">
                  {step.title}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700 dark:[.admin-theme_&]:text-slate-300">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-slate-200 dark:[.admin-theme_&]:border-slate-700 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:[.admin-theme_&]:text-purple-300">
                <BadgeInfo className="h-4 w-4" />
                Explicação da geometria
              </div>

              <h2 className="mt-2 text-2xl font-black text-slate-900 dark:[.admin-theme_&]:text-slate-100">
                Por que {molecule.formula} tem esse formato?
              </h2>
            </div>

            <div className="flex rounded-2xl border border-slate-200 dark:[.admin-theme_&]:border-slate-700 bg-slate-50 dark:[.admin-theme_&]:bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => setExplanationMode("resumo")}
                className={[
                  "rounded-xl px-3 py-2 text-xs font-black transition",
                  explanationMode === "resumo"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 dark:[.admin-theme_&]:text-slate-400 hover:text-slate-900 dark:[.admin-theme_&]:hover:text-slate-100",
                ].join(" ")}
              >
                Resumo
              </button>

              <button
                type="button"
                onClick={() => setExplanationMode("completa")}
                className={[
                  "rounded-xl px-3 py-2 text-xs font-black transition",
                  explanationMode === "completa"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 dark:[.admin-theme_&]:text-slate-400 hover:text-slate-900 dark:[.admin-theme_&]:hover:text-slate-100",
                ].join(" ")}
              >
                Completa
              </button>
            </div>
          </div>

          {explanationMode === "resumo" ? (
            <div className="mt-5 rounded-2xl border border-purple-200 dark:[.admin-theme_&]:border-purple-800 bg-purple-50 dark:[.admin-theme_&]:bg-purple-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-700 dark:[.admin-theme_&]:text-purple-300">
                Resumo de prova
              </p>

              <p className="mt-2 text-sm leading-7 text-purple-950 dark:[.admin-theme_&]:text-purple-200">
                {shortGeometrySummary}
              </p>
            </div>
          ) : (
            <>
              <p className="mt-4 text-sm leading-7 text-slate-700 dark:[.admin-theme_&]:text-slate-300">
                {molecule.shortExplanation}
              </p>

              <div className="mt-5 rounded-2xl border border-slate-200 dark:[.admin-theme_&]:border-slate-700 bg-slate-50 dark:[.admin-theme_&]:bg-slate-900 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:[.admin-theme_&]:text-slate-400">
                  Relação entre pares eletrônicos e ângulo
                </p>

                <p className="mt-2 text-sm leading-7 text-slate-700 dark:[.admin-theme_&]:text-slate-300">
                  {molecule.angleExplanation}
                </p>
              </div>
            </>
          )}
        </Card>

        <Card className="border-slate-200 dark:[.admin-theme_&]:border-slate-700 p-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 dark:[.admin-theme_&]:border-slate-700 bg-slate-50 dark:[.admin-theme_&]:bg-slate-900 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:[.admin-theme_&]:text-slate-400">
                Ângulo ideal
              </p>

              <p className="mt-2 text-2xl font-black text-slate-900 dark:[.admin-theme_&]:text-slate-100">
                {molecule.idealAngle}
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-200 dark:[.admin-theme_&]:border-cyan-800 bg-cyan-50 dark:[.admin-theme_&]:bg-cyan-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:[.admin-theme_&]:text-cyan-300">
                Ângulo real/aproximado
              </p>

              <p className="mt-2 text-2xl font-black text-cyan-900 dark:[.admin-theme_&]:text-cyan-200">
                {molecule.realAngle}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-purple-200 dark:[.admin-theme_&]:border-purple-800 bg-purple-50 dark:[.admin-theme_&]:bg-purple-950 p-4">
            <div className="flex items-start gap-3">
              <Brain className="mt-0.5 h-5 w-5 text-purple-700 dark:[.admin-theme_&]:text-purple-300" />

              <div>
                <p className="font-bold text-purple-950 dark:[.admin-theme_&]:text-purple-200">
                  Como pensar em vestibular
                </p>

                <p className="mt-2 text-sm leading-7 text-purple-900 dark:[.admin-theme_&]:text-purple-200">
                  {molecule.vestibularNote}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-orange-200 dark:[.admin-theme_&]:border-orange-800 bg-orange-50 dark:[.admin-theme_&]:bg-orange-950 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-orange-600 dark:[.admin-theme_&]:text-orange-300" />

              <div>
                <p className="font-bold text-orange-950 dark:[.admin-theme_&]:text-orange-200">Erro comum</p>

                <p className="mt-2 text-sm leading-7 text-orange-900 dark:[.admin-theme_&]:text-orange-200">
                  {molecule.commonMistake}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 dark:[.admin-theme_&]:border-slate-700 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:[.admin-theme_&]:text-slate-300">
            <Beaker className="h-4 w-4" />
            Padrão usado
          </div>

          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between rounded-2xl bg-slate-50 dark:[.admin-theme_&]:bg-slate-900 px-4 py-3">
              <span className="text-slate-500 dark:[.admin-theme_&]:text-slate-400">Fórmula</span>
              <strong className="text-slate-900 dark:[.admin-theme_&]:text-slate-100">{molecule.formula}</strong>
            </div>

            <div className="flex justify-between rounded-2xl bg-slate-50 dark:[.admin-theme_&]:bg-slate-900 px-4 py-3">
              <span className="text-slate-500 dark:[.admin-theme_&]:text-slate-400">Átomo central</span>
              <strong className="text-slate-900 dark:[.admin-theme_&]:text-slate-100">{molecule.centralAtom}</strong>
            </div>

            <div className="flex justify-between rounded-2xl bg-slate-50 dark:[.admin-theme_&]:bg-slate-900 px-4 py-3">
              <span className="text-slate-500 dark:[.admin-theme_&]:text-slate-400">Modelo VSEPR</span>
              <strong className="text-slate-900 dark:[.admin-theme_&]:text-slate-100">{molecule.vsepr}</strong>
            </div>

            <div className="flex justify-between rounded-2xl bg-slate-50 dark:[.admin-theme_&]:bg-slate-900 px-4 py-3">
              <span className="text-slate-500 dark:[.admin-theme_&]:text-slate-400">Geometria eletrônica</span>
              <strong className="text-right text-slate-900 dark:[.admin-theme_&]:text-slate-100">
                {molecule.electronGeometry}
              </strong>
            </div>

            <div className="flex justify-between rounded-2xl bg-slate-50 dark:[.admin-theme_&]:bg-slate-900 px-4 py-3">
              <span className="text-slate-500 dark:[.admin-theme_&]:text-slate-400">Geometria molecular</span>
              <strong className="text-right text-slate-900 dark:[.admin-theme_&]:text-slate-100">
                {molecule.molecularGeometry}
              </strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
