import { ArrowRight, BookOpen, Box, BrainCircuit, GraduationCap, MessageCircle, NotebookPen, Trophy } from "lucide-react";
import { Link } from "wouter";
import CommerceHeader from "@/components/billing/CommerceHeader";
import { SUPPORT_WHATSAPP_URL } from "@/config/help";

const guides = [
  {
    id: "banco-de-questoes", title: "Banco de questões", icon: BookOpen,
    description: "Encontre questões de provas e pratique com o recorte que você quer estudar.",
    location: "Menu da plataforma → Banco de questões",
    action: ["Abrir banco de questões", "/banco-de-questoes"],
    steps: [
      "Use a busca por código ou palavra-chave, ou filtre por instituição, ano, disciplina, conteúdo, assunto e dificuldade. Também dá para filtrar pelo status da prática.",
      "Abra a questão que quer resolver. Leia o enunciado, escolha uma alternativa e envie a resposta.",
      "Depois de responder, confira o resultado e leia a resolução comentada quando ela estiver cadastrada. Use a navegação do exercício para avançar.",
    ],
  },
  {
    id: "rascunho", title: "Resolução escrita e rascunho", icon: NotebookPen,
    description: "Use o quadro da própria questão para organizar cálculos e raciocínios enquanto resolve.",
    location: "Banco de questões → exercício → Rascunho",
    action: ["Abrir banco de questões", "/banco-de-questoes"],
    steps: [
      "Abra uma questão e selecione Rascunho. Use as ferramentas do quadro, como caneta e borracha, para registrar o passo a passo.",
      "Ao voltar para a mesma questão com a mesma conta e navegador, você pode retomar o rascunho salvo localmente. Limpar os dados do site pode apagá-lo; ele não sincroniza entre dispositivos.",
      "O rascunho é separado da resposta enviada e da resolução comentada. O Caderno independente do menu está em desenvolvimento.",
    ],
  },
  {
    id: "vet", title: "VET", icon: BrainCircuit,
    description: "Organize seus estudos e acompanhe seu desempenho em relação à prova que você escolheu.",
    location: "Menu da plataforma → VET",
    action: ["Acessar VET", "/vet"],
    steps: ["Comece pelo Objetivo. Registre tentativas no Banco de questões para que as análises pessoais tenham dados. Use as áreas abaixo conforme a sua etapa de estudo."],
  },
  {
    id: "simuladores", title: "Simuladores", icon: Box,
    description: "Explore conceitos de Física, Matemática e Química em ferramentas interativas.",
    location: "Menu da plataforma → Simuladores",
    action: ["Abrir simuladores", "/simuladores"],
    steps: [
      "Escolha uma disciplina e abra um simulador no catálogo. Em Física, por exemplo, abra Cinemática ou Óptica; em Matemática, Simulador de Funções ou Geometria Espacial 3D; em Química, Geometria Molecular 3D.",
      "Selecione um cenário ou tema e ajuste os controles disponíveis. Observe como a simulação muda: em Funções, compare os gráficos; em Geometria Espacial 3D, explore os sólidos.",
    ],
  },
  {
    id: "ranking", title: "Ranking", icon: Trophy,
    description: "Acompanhe a classificação e os indicadores de desempenho da comunidade.",
    location: "Menu da plataforma → Ranking",
    action: ["Abrir ranking", "/ranking"],
    steps: [
      "Abra o Ranking para consultar a classificação semanal, sua posição quando disponível e indicadores como pontuação, precisão e acertos em questões muito difíceis.",
      "Resolva questões com a sua conta para registrar tentativas. Os resultados registrados alimentam a classificação e as estatísticas exibidas.",
    ],
  },
  {
    id: "aulas", title: "Explicações e aulas", icon: GraduationCap,
    description: "A área de explicações por disciplina está em desenvolvimento.",
    location: "Início da plataforma → Explorar Física",
    action: ["Explorar Física", "/fisica"],
    steps: [
      "Física já tem uma área de estudo com tópicos que você pode explorar. Em Início, os cartões de Matemática e Química aparecem como Em desenvolvimento.",
      "O projeto também tem uma tela de aula por link: quando uma aula for publicada e você tiver o link, abra-o com sua conta. As resoluções comentadas cadastradas no Banco de questões já podem ser consultadas após responder.",
    ],
  },
] as const;

const vetGuides = [
  ["Objetivo", "/vet/objetivo", "Escolha a prova-alvo, o tempo até a prova, as horas de estudo por dia e a disciplina de foco. Salve para usar essa referência nas outras áreas do VET."],
  ["Diagnóstico", "/vet/diagnostico", "Depois de resolver questões, abra para ver o aproveitamento, pontos fortes e críticos, erros recentes e itens de revisão. A leitura depende das tentativas registradas."],
  ["Nivelamento", "/vet/nivelamento", "Com o objetivo configurado e tentativas registradas, compare seu desempenho com a referência da prova. Use essa leitura como orientação de estudo."],
  ["Prioridades", "/vet/prioridades", "No painel do VET, abra Prioridades para identificar conteúdos que merecem atenção. A lista usa o desempenho registrado e organiza o que atacar, consolidar ou manter."],
  ["Plano VET", "/vet/plano", "Consulte a divisão de conteúdos em Ataque, Consolidação e Manutenção. Use as recomendações para decidir o próximo bloco de estudo a partir do objetivo e do histórico."],
  ["Treino", "/vet/treino", "Veja sugestões de blocos e distribuição do tempo de estudo entre Ataque, Consolidação e Manutenção. O plano usa as horas definidas no Objetivo e a análise das tentativas."],
  ["Questões", "/vet/questoes", "Escolha um recorte sugerido de Ataque, Consolidação, Manutenção ou Revisão de erro e abra a prática correspondente. As sugestões se baseiam nos conteúdos analisados no seu histórico."],
  ["Simulado", "/vet/simulado", "Selecione Misto VET, Ataque, Consolidação ou Manutenção e clique para iniciar. Responda as questões selecionadas para a sessão; ao concluir, veja o resultado. O histórico permite retomar sessões em andamento e consultar as concluídas."],
  ["Análise das provas", "/vet/analise-provas", "Escolha instituição, disciplina, banca/prova e período. Veja a distribuição dos conteúdos e a incidência por ano nas questões disponíveis no banco. A análise usa questões cadastradas; anos sem dados não significam ausência do tema na prova."],
] as const;

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500";

export default function HelpCenterPage() {
  return (
    <div className="theme-page min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <CommerceHeader />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-white to-cyan-50 p-6 dark:border-cyan-900 dark:from-slate-900 dark:to-cyan-950 sm:p-9">
          <p className="text-sm font-bold text-blue-700 dark:text-cyan-300">Projeto Vetor</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Central de Ajuda</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate-700 dark:text-slate-200">Encontre as ferramentas da plataforma, aprenda a usá-las ou fale com o suporte se precisar de ajuda.</p>
          <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={`mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800 ${focus}`}>
            <MessageCircle className="size-5 shrink-0" aria-hidden="true" /> Falar com o suporte pelo WhatsApp
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        </div>

        <nav aria-label="Seções do guia" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map(({ id, title, icon: Icon }) => (
            <a key={id} href={`#${id}`} className={`flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm font-semibold hover:border-blue-500 ${focus}`}>
              <Icon className="size-5 shrink-0 text-blue-700 dark:text-cyan-300" aria-hidden="true" /> {title}
            </a>
          ))}
        </nav>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">Você pode ler este guia sem conta. Para abrir as ferramentas, entre na sua conta e tenha acesso à área do aluno.</p>

        {guides.map(({ id, title, icon: Icon, description, location, steps, action: [label, href] }) => (
          <section key={id} id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 rounded-2xl border border-border bg-card p-5 sm:p-7">
            <h2 id={`${id}-title`} className="flex items-center gap-3 text-xl font-black sm:text-2xl">
              <Icon className="size-6 shrink-0 text-blue-700 dark:text-cyan-300" aria-hidden="true" /> {title}
            </h2>
            <p className="mt-2 leading-relaxed">{description}</p>
            <p className="mt-4 text-sm font-semibold text-blue-800 dark:text-cyan-300">Onde encontrar: {location}</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {steps.map(step => <li key={step}>{step}</li>)}
            </ol>
            {id === "vet" && (
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {vetGuides.map(([name, path, instructions]) => (
                  <details key={path} className="self-start rounded-xl border border-border bg-background">
                    <summary className={`cursor-pointer rounded-xl px-4 py-3 font-semibold ${focus}`}>{name}</summary>
                    <p className="px-4 pb-3 text-sm leading-relaxed">{instructions}</p>
                    <Link href={path} className={`mx-4 mb-4 inline-flex rounded text-sm font-semibold text-blue-800 underline dark:text-cyan-300 ${focus}`}>Abrir {name}</Link>
                  </details>
                ))}
              </div>
            )}
            <Link href={href} className={`mt-5 inline-flex items-center gap-2 rounded-xl border border-blue-300 px-4 py-2.5 text-sm font-bold text-blue-800 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-200 dark:hover:bg-blue-950 ${focus}`}>
              {label} <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
            </Link>
          </section>
        ))}
      </main>
    </div>
  );
}
