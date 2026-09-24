import type { ComponentType } from "react";
import { Link } from "wouter";
import {
  Activity,
  ArrowRight,
  Atom,
  Box,
  CircleGauge,
  ChartNoAxesCombined,
  FlaskConical,
  Orbit,
  Thermometer,
  Waves,
  Weight,
} from "lucide-react";

type SimulatorDiscipline = "Física" | "Matemática" | "Química";

type SimulatorCatalogItem = {
  title: string;
  discipline: SimulatorDiscipline;
  description: string;
  topics: string[];
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const simulators: SimulatorCatalogItem[] = [
  {
    title: "Cinemática",
    discipline: "Física",
    description: "MRU, MRUV, queda livre, movimento circular e lançamentos.",
    topics: [
      "MRU",
      "MRUV",
      "Queda livre",
      "Movimento circular",
      "Lançamento horizontal",
      "Lançamento oblíquo",
    ],
    href: "/cinematica/simulator",
    icon: Activity,
  },
  {
    title: "Dinâmica",
    discipline: "Física",
    description:
      "Segunda Lei de Newton, colisões, força centrípeta e plano inclinado.",
    topics: [
      "Leis de Newton",
      "Plano inclinado",
      "Atrito",
      "Força centrípeta",
      "Colisões",
      "Quantidade de movimento",
    ],
    href: "/dinamica/simulator",
    icon: Weight,
  },
  {
    title: "Estática e Hidrostática",
    discipline: "Física",
    description:
      "Equilíbrio de forças, torque, máquinas simples e Lei de Stevin.",
    topics: [
      "Equilíbrio",
      "Torque",
      "Alavancas",
      "Máquinas simples",
      "Pressão",
      "Lei de Stevin",
      "Empuxo",
    ],
    href: "/estatica/simulator",
    icon: CircleGauge,
  },
  {
    title: "Termologia",
    discipline: "Física",
    description: "Temperatura, calorimetria, dilatação e mudanças de estado.",
    topics: [
      "Escalas termométricas",
      "Calorimetria",
      "Dilatação térmica",
      "Mudanças de estado",
      "Propagação de calor",
    ],
    href: "/termologia/simulator",
    icon: Thermometer,
  },
  {
    title: "Ondulatória",
    discipline: "Física",
    description:
      "Ondas progressivas, ondas estacionárias, interferência e efeito Doppler.",
    topics: [
      "Ondas progressivas",
      "Ondas estacionárias",
      "Interferência",
      "Reflexão",
      "Refração",
      "Efeito Doppler",
    ],
    href: "/ondulatoria/simulator",
    icon: Waves,
  },
  {
    title: "Óptica",
    discipline: "Física",
    description: "Refração, espelhos esféricos e lentes delgadas.",
    topics: [
      "Refração",
      "Espelhos planos",
      "Espelhos esféricos",
      "Lentes delgadas",
      "Formação de imagens",
    ],
    href: "/optica/simulator",
    icon: Orbit,
  },
  {
    title: "Simulador de Funções",
    discipline: "Matemática",
    description:
      "Construa, compare e explore gráficos de funções em um plano cartesiano interativo.",
    topics: [
      "Função afim",
      "Função quadrática",
      "Polinômios",
      "Função modular",
      "Exponenciais",
      "Logaritmos",
      "Trigonometria",
      "Funções racionais",
    ],
    href: "/simuladores/funcoes",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Geometria Espacial 3D",
    discipline: "Matemática",
    description:
      "Sólidos tridimensionais, inscrições, cortes, planificações, volumes, áreas e interseções.",
    topics: [
      "Cubo",
      "Prismas",
      "Pirâmides",
      "Cilindros",
      "Cones",
      "Esferas",
      "Sólidos inscritos",
      "Interseções",
      "Cortes",
      "Planificações",
    ],
    href: "/simuladores/geometria-espacial",
    icon: Box,
  },
  {
    title: "Geometria Molecular 3D",
    discipline: "Química",
    description:
      "Modelos VSEPR, pares eletrônicos, ângulos de ligação e geometrias moleculares.",
    topics: [
      "Geometria linear",
      "Angular",
      "Trigonal plana",
      "Tetraédrica",
      "Piramidal",
      "Bipiramidal",
      "Octaédrica",
      "Pares eletrônicos livres",
      "Ângulos de ligação",
    ],
    href: "/simuladores/geometria-molecular",
    icon: Atom,
  },
];

const disciplines: SimulatorDiscipline[] = ["Física", "Matemática", "Química"];

export default function SimulatorsPage() {
  return (
    <main className="theme-page min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl border border-blue-100 bg-white px-6 py-7 shadow-sm sm:px-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                Laboratórios interativos
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                Simuladores
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Explore ferramentas interativas de Física, Matemática e Química.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-8 space-y-10">
          {disciplines.map(discipline => {
            const disciplineSimulators = simulators.filter(
              simulator => simulator.discipline === discipline
            );

            return (
              <section
                key={discipline}
                aria-labelledby={`simuladores-${discipline}`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-blue-600" />
                  <h2
                    id={`simuladores-${discipline}`}
                    className="text-xl font-black text-slate-900"
                  >
                    {discipline}
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {disciplineSimulators.map(simulator => {
                    const Icon = simulator.icon;

                    return (
                      <Link key={simulator.href} href={simulator.href}>
                        <a className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                              {simulator.discipline}
                            </span>
                          </div>

                          <h3 className="mt-4 text-lg font-black text-slate-900">
                            {simulator.title}
                          </h3>
                          <p className="mt-1.5 text-sm leading-6 text-slate-600">
                            {simulator.description}
                          </p>

                          <ul
                            className="mt-4 flex flex-wrap gap-1.5"
                            aria-label="Experiências disponíveis"
                          >
                            {simulator.topics.map(topic => (
                              <li
                                key={topic}
                                className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                              >
                                {topic}
                              </li>
                            ))}
                          </ul>

                          <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-700">
                            Abrir simulador
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </span>
                        </a>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
