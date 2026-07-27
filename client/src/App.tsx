import { Suspense, useEffect, useState } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { Redirect, Route, Switch, useLocation } from "wouter";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";

import ErrorBoundary from "./components/ErrorBoundary";
import SubscriptionGuard from "./components/SubscriptionGuard";
import StudentSidebar from "./components/layout/StudentSidebar";
import { ThemeProvider } from "./contexts/ThemeContext";

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import {
  checkPlatformAccess,
  getCachedPlatformAccess,
} from "@/services/access.service";

import Landing from "./pages/Landing";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PricingPage from "./pages/PricingPage";
import SubscriptionPendingPage from "./pages/SubscriptionPendingPage";

const AdminDashboardPage = lazyWithRetry(
  "AdminDashboardPage",
  () => import("./pages/AdminDashboardPage")
);
const AdminUsersPage = lazyWithRetry(
  "AdminUsersPage",
  () => import("./pages/AdminUsersPage")
);
const AdminBillingPage = lazyWithRetry(
  "AdminBillingPage",
  () => import("./pages/AdminBillingPage")
);
const AdminQuestionsPage = lazyWithRetry(
  "AdminQuestionsPage",
  () => import("./pages/AdminQuestionsPage")
);
const AdminQuestionCreatePage = lazyWithRetry(
  "AdminQuestionCreatePage",
  () => import("./pages/AdminQuestionCreatePage")
);
const AdminQuestionBatchImportPage = lazyWithRetry(
  "AdminQuestionBatchImportPage",
  () => import("./pages/AdminQuestionBatchImportPage")
);
const AdminQuestionEditPage = lazyWithRetry(
  "AdminQuestionEditPage",
  () => import("./pages/AdminQuestionEditPage")
);
const AdminQuestionReportsPage = lazyWithRetry(
  "AdminQuestionReportsPage",
  () => import("./pages/AdminQuestionReportsPage")
);
const AdminResolutionsPage = lazyWithRetry(
  "AdminResolutionsPage",
  () => import("./pages/AdminResolutionsPage")
);
const AdminResolutionEditorPage = lazyWithRetry(
  "AdminResolutionEditorPage",
  () => import("./pages/AdminResolutionEditorPage")
);
const AdminUploadsPage = lazyWithRetry(
  "AdminUploadsPage",
  () => import("./pages/AdminUploadsPage")
);
const AdminVetPage = lazyWithRetry(
  "AdminVetPage",
  () => import("./pages/AdminVetPage")
);
const AdminLogsPage = lazyWithRetry(
  "AdminLogsPage",
  () => import("./pages/AdminLogsPage")
);
const AdminProfilesPage = lazyWithRetry(
  "AdminProfilesPage",
  () => import("./pages/AdminProfilesPage")
);
const AdminSpatialGeometryPrototypePage = lazyWithRetry(
  "AdminSpatialGeometryPrototypePage",
  () => import("./pages/AdminSpatialGeometryPrototypePage")
);
const AdminMolecularGeometryPrototypePage = lazyWithRetry(
  "AdminMolecularGeometryPrototypePage",
  () => import("./pages/AdminMolecularGeometryPrototypePage")
);

import Home from "./pages/Home";
import DinamicaHome from "./pages/DinamicaHome";
import Calculator from "./pages/Calculator";
import Formulas from "./pages/Formulas";
import Learn from "./pages/Learn";
const Quiz = lazyWithRetry("Quiz", () => import("./pages/Quiz"));
import Graphs from "./pages/Graphs";

import DynamicsLearn from "./pages/DynamicsLearn";
import DynamicsCalculator from "./pages/DynamicsCalculator";
import DynamicsFormulas from "./pages/DynamicsFormulas";
const DynamicsQuiz = lazyWithRetry(
  "DynamicsQuiz",
  () => import("./pages/DynamicsQuiz")
);
import DynamicsGraphs from "./pages/DynamicsGraphs";
import DynamicsSimulator from "./pages/DynamicsSimulator";

import CinematicaSimulator from "./pages/CinematicaSimulator";
import CinematicaGraphs from "./pages/CinematicaGraphs";
const CinematicaQuiz = lazyWithRetry(
  "CinematicaQuiz",
  () => import("./pages/CinematicaQuiz")
);
import CinematicaTopicBases from "./pages/CinematicaTopicBases";
import CinematicaTopicVelocidade from "./pages/CinematicaTopicVelocidade";
import CinematicaTopicMRU from "./pages/CinematicaTopicMRU";
import CinematicaTopicMRUV from "./pages/CinematicaTopicMRUV";
import CinematicaTopicCircular from "./pages/CinematicaTopicCircular";
import CinematicaTopicQuedaLivre from "./pages/CinematicaTopicQuedaLivre";

const Progress = lazyWithRetry("Progress", () => import("./pages/Progress"));
const IAResolver = lazyWithRetry(
  "IAResolver",
  () => import("./pages/IAResolver")
);
const QuestionBank = lazyWithRetry(
  "QuestionBankPage",
  () => import("./pages/QuestionBankPage")
);
const NotebookDevelopmentPage = lazyWithRetry(
  "NotebookDevelopmentPage",
  () => import("./pages/NotebookDevelopmentPage")
);
const SimulatorsPage = lazyWithRetry(
  "SimulatorsPage",
  () => import("./pages/SimulatorsPage")
);
const FunctionSimulatorPage = lazyWithRetry(
  "FunctionSimulatorPage",
  () => import("./pages/FunctionSimulatorPage")
);
const SpatialGeometrySimulatorPage = lazyWithRetry(
  "SpatialGeometrySimulatorPage",
  () => import("./pages/SpatialGeometrySimulatorPage")
);
const MolecularGeometrySimulatorPage = lazyWithRetry(
  "MolecularGeometrySimulatorPage",
  () => import("./pages/MolecularGeometrySimulatorPage")
);

import ProfilePage from "./pages/ProfilePage";
import PublicProfilePage from "./pages/PublicProfilePage";
import ErrorNotebook from "./pages/ErrorNotebook";
import MinhaAssinaturaPage from "./pages/MinhaAssinaturaPage";
import RankingPage from "./pages/RankingPage";

const VetPage = lazyWithRetry("VetPage", () => import("./pages/VetPage"));
const VetDiagnosisPage = lazyWithRetry(
  "VetDiagnosisPage",
  () => import("./pages/VetDiagnosisPage")
);
const VetObjectivePage = lazyWithRetry(
  "VetObjectivePage",
  () => import("./pages/VetObjectivePage")
);
const VetPlanPage = lazyWithRetry(
  "VetPlanPage",
  () => import("./pages/VetPlanPage")
);
const VetQuestionsPage = lazyWithRetry(
  "VetQuestionsPage",
  () => import("./pages/VetQuestionsPage")
);
const VetTrainingPage = lazyWithRetry(
  "VetTrainingPage",
  () => import("./pages/VetTrainingPage")
);
const VetPrioritiesPage = lazyWithRetry(
  "VetPrioritiesPage",
  () => import("./pages/VetPrioritiesPage")
);
const VetLevelPage = lazyWithRetry(
  "VetLevelPage",
  () => import("./pages/VetLevelPage")
);
const VetMockPage = lazyWithRetry(
  "VetMockPage",
  () => import("./pages/VetMockPage")
);
const VetMockResultPage = lazyWithRetry(
  "VetMockResultPage",
  () => import("./pages/VetMockResultPage")
);

import DynamicsTopicNewton from "./pages/DynamicsTopicNewton";
import DynamicsTopicFriction from "./pages/DynamicsTopicFriction";
import DynamicsTopicEnergy from "./pages/DynamicsTopicEnergy";
import DynamicsTopicMomentum from "./pages/DynamicsTopicMomentum";
import DynamicsTopicPower from "./pages/DynamicsTopicPower";

import EstaticaHome from "./pages/EstaticaHome";
import EstaticaGraphs from "./pages/EstaticaGraphs";
const EstaticaQuiz = lazyWithRetry(
  "EstaticaQuiz",
  () => import("./pages/EstaticaQuiz")
);
import EstaticaSimulator from "./pages/EstaticaSimulator";
import EstaticaTopicEquilibrio from "./pages/EstaticaTopicEquilibrio";
import EstaticaTopicTorque from "./pages/EstaticaTopicTorque";
import EstaticaTopicMaquinas from "./pages/EstaticaTopicMaquinas";
import EstaticaTopicHidrostatica from "./pages/EstaticaTopicHidrostatica";

import FisicaSelector from "./pages/FisicaSelector";
import FisicaIHome from "./pages/FisicaIHome";
import FisicaIIHome from "./pages/FisicaIIHome";
import FisicaIIIHome from "./pages/FisicaIIIHome";

import EletricidadeHome from "./pages/EletricidadeHome";
import EletricidadeTopicEletrostatica from "./pages/EletricidadeTopicEletrostatica";
import EletricidadeTopicEletrodinamica from "./pages/EletricidadeTopicEletrodinamica";
import EletricidadeTopicCapacitoresIndutores from "./pages/EletricidadeTopicCapacitoresIndutores";
import EletricidadeTopicMagnetismo from "./pages/EletricidadeTopicMagnetismo";
import EletricidadeTopicPotencialEletrico from "./pages/EletricidadeTopicPotencialEletrico";
import EletricidadeTopicDieletricos from "./pages/EletricidadeTopicDieletricos";
import EletricidadeTopicCircuitosAC from "./pages/EletricidadeTopicCircuitosAC";
import EletricidadeTopicOndasEletromagneticas from "./pages/EletricidadeTopicOndasEletromagneticas";

import EletromagnetismoHome from "./pages/EletromagnetismoHome";
import EletromagnetismoTopicCamposMagneticos from "./pages/EletromagnetismoTopicCamposMagneticos";
import EletromagnetismoTopicInducaoEletromagnetica from "./pages/EletromagnetismoTopicInducaoEletromagnetica";
import EletromagnetismoTopicEquacoesMacwell from "./pages/EletromagnetismoTopicEquacoesMacwell";
import EletromagnetismoTopicOndasAvancado from "./pages/EletromagnetismoTopicOndasAvancado";
import EletromagnetismoTopicAplicacoes from "./pages/EletromagnetismoTopicAplicacoes";
import EletromagnetismoTopicRadiacao from "./pages/EletromagnetismoTopicRadiacao";

import MagnetismoHome from "./pages/MagnetismoHome";
import MagnetismoTopicForcaMagnetica from "./pages/MagnetismoTopicForcaMagnetica";

import TermologiaHome from "./pages/TermologiaHome";
import TermologiaGraphs from "./pages/TermologiaGraphs";
const TermologiaQuiz = lazyWithRetry(
  "TermologiaQuiz",
  () => import("./pages/TermologiaQuiz")
);
import TermologiaSimulator from "./pages/TermologiaSimulator";
import TermologiaTopicTemperatura from "./pages/TermologiaTopicTemperatura";
import TermologiaTopicCalor from "./pages/TermologiaTopicCalor";
import TermologiaTopicCalorimetria from "./pages/TermologiaTopicCalorimetria";
import TermologiaTopicTermodinamica from "./pages/TermologiaTopicTermodinamica";
import TermologiaTopicDilatacao from "./pages/TermologiaTopicDilatacao";

import MecanicaHome from "./pages/MecanicaHome";
import MecanicaTopicCinematica from "./pages/MecanicaTopicCinematica";
import MecanicaTopicDinamica from "./pages/MecanicaTopicDinamica";

import OndulatoriaHome from "./pages/OndulatóriaHome";
import OndulatoriaTopicConceitos from "./pages/OndulatóriaTopicConceitos";
import OndulatoriaTopicMHS from "./pages/OndulatóriaTopicMHS";
import OndulatoriaTopicEquacao from "./pages/OndulatóriaTopicEquacao";
import OndulatoriaTopicFenomenos from "./pages/OndulatóriaTopicFenomenos";
import OndulatoriaTopicSom from "./pages/OndulatóriaTopicSom";
import OndulatoriaTopicLuz from "./pages/OndulatóriaTopicLuz";
import OndulatoriaSimulator from "./pages/OndulatoriaSimulator";
import OndulatoriaGraphs from "./pages/OndulatoriaGraphs";
const OndulatoriaQuiz = lazyWithRetry(
  "OndulatoriaQuiz",
  () => import("./pages/OndulatoriaQuiz")
);

import OpticaHome from "./pages/OpticaHome";
import OpticaTopicConceitos from "./pages/OpticaTopicConceitos";
import OpticaTopicLentes from "./pages/OpticaTopicLentes";
import OpticaTopicFisica from "./pages/OpticaTopicFisica";
import OpticaTopicFenomenos from "./pages/OpticaTopicFenomenos";
import OpticaSimulator from "./pages/OpticaSimulator";
import OpticaGraphs from "./pages/OpticaGraphs";
const OpticaQuiz = lazyWithRetry(
  "OpticaQuiz",
  () => import("./pages/OpticaQuiz")
);

import FisicaModernaHome from "./pages/FisicaModernaHome";
import FisicaModernaTopicRelatividade from "./pages/FisicaModernaTopicRelatividade";
import FisicaModernaTopicQuantica from "./pages/FisicaModernaTopicQuantica";
import FisicaModernaTopicAtomo from "./pages/FisicaModernaTopicAtomo";
import FisicaModernaTopicParticulas from "./pages/FisicaModernaTopicParticulas";
import FisicaModernaTopicAplicacoes from "./pages/FisicaModernaTopicAplicacoes";

type RootAccessState = "checking" | "allowed" | "blocked" | "public";

function RootGate() {
  const { isAuthenticated, loading: authLoading, user } = useSupabaseAuth();
  const [accessState, setAccessState] = useState<RootAccessState>("checking");

  useEffect(() => {
    let cancelled = false;

    async function checkRootAccess() {
      if (authLoading) return;

      if (!isAuthenticated || !user) {
        if (!cancelled) {
          setAccessState("public");
        }

        return;
      }

      const cached = getCachedPlatformAccess(user.id);

      if (cached && !cancelled) {
        setAccessState(cached.status === "allowed" ? "allowed" : "blocked");
      } else if (!cancelled) {
        setAccessState("checking");
      }

      try {
        const freshAccess = await checkPlatformAccess(user.id, {
          forceRefresh: true,
        });

        if (!cancelled) {
          setAccessState(
            freshAccess.status === "allowed" ? "allowed" : "blocked"
          );
        }
      } catch (error) {
        console.warn("Erro inesperado na entrada do site:", error);

        if (!cancelled && !cached) {
          setAccessState("blocked");
        }
      }
    }

    checkRootAccess();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user]);

  if (authLoading || accessState === "checking") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] px-8 py-6 text-center shadow-2xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">
            Projeto Vetor
          </p>

          <p className="mt-2 text-sm text-slate-300">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (accessState === "allowed") {
    return <Redirect to="/plataforma" />;
  }

  if (accessState === "blocked") {
    return <Redirect to="/assinatura-pendente" />;
  }

  return <Landing />;
}

function PrivateRouter() {
  const [location] = useLocation();
  const legacyAdminPrefix = "/plataforma/admin";
  const isLegacyAdminRoute =
    location === legacyAdminPrefix ||
    location.startsWith(`${legacyAdminPrefix}/`);
  const isAdminRoute = location.startsWith("/admin") || isLegacyAdminRoute;
  const [studentMenuOpen, setStudentMenuOpen] = useState(false);

  if (isLegacyAdminRoute) {
    const normalizedAdminPath = location.replace(
      /^\/plataforma\/admin/,
      "/admin"
    );

    return <Redirect to={normalizedAdminPath || "/admin"} />;
  }

  return (
    <SubscriptionGuard>
      {!isAdminRoute ? (
        <StudentSidebar
          expanded={studentMenuOpen}
          onExpandedChange={setStudentMenuOpen}
        />
      ) : null}

      <div
        className={
          isAdminRoute
            ? ""
            : studentMenuOpen
              ? "min-h-screen transition-[padding] duration-200 md:pl-72"
              : "min-h-screen transition-[padding] duration-200 md:pl-[76px]"
        }
      >
        <Suspense
          fallback={
            <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
              Carregando página...
            </div>
          }
        >
          <Switch>
            {/* Admin */}
            <Route path="/admin" component={AdminDashboardPage} />
            <Route path="/admin/usuarios" component={AdminUsersPage} />
            <Route path="/admin/profiles" component={AdminProfilesPage} />
            <Route path="/admin/assinaturas" component={AdminBillingPage} />

            <Route path="/admin/questoes" component={AdminQuestionsPage} />
            <Route
              path="/admin/questoes/nova"
              component={AdminQuestionCreatePage}
            />
            <Route
              path="/admin/questoes/importar-lote"
              component={AdminQuestionBatchImportPage}
            />

            <Route path="/admin/reports" component={AdminQuestionReportsPage} />
            <Route
              path="/admin/questoes/relatorios"
              component={AdminQuestionReportsPage}
            />

            <Route
              path="/admin/questoes/:id"
              component={AdminQuestionEditPage}
            />

            <Route path="/admin/resolucoes" component={AdminResolutionsPage} />
            <Route
              path="/admin/resolucoes/:questaoId"
              component={AdminResolutionEditorPage}
            />

            <Route path="/admin/uploads" component={AdminUploadsPage} />
            <Route path="/admin/vet" component={AdminVetPage} />
            <Route path="/admin/logs" component={AdminLogsPage} />
            <Route
              path="/admin/matematica/geometria-espacial"
              component={AdminSpatialGeometryPrototypePage}
            />
            <Route
              path="/admin/quimica/geometria-molecular"
              component={AdminMolecularGeometryPrototypePage}
            />

            {/* Entrada geral da plataforma */}
            <Route path="/plataforma" component={LandingPage} />

            {/* Seletor de Física */}
            <Route path="/fisica" component={FisicaSelector} />

            {/* Física por frentes */}
            <Route path="/fisica-i" component={FisicaIHome} />
            <Route path="/fisica-ii" component={FisicaIIHome} />
            <Route path="/fisica-iii" component={FisicaIIIHome} />

            {/* Banco de questões */}
            <Route path="/banco-questoes" component={QuestionBank} />
            <Route path="/banco-de-questoes" component={QuestionBank} />
            <Route path="/caderno/:documentId" component={NotebookDevelopmentPage} />
            <Route path="/caderno" component={NotebookDevelopmentPage} />

            {/* Central de simuladores */}
            <Route path="/simuladores" component={SimulatorsPage} />
            <Route
              path="/simuladores/funcoes"
              component={FunctionSimulatorPage}
            />
            <Route
              path="/simuladores/geometria-espacial"
              component={SpatialGeometrySimulatorPage}
            />
            <Route
              path="/simuladores/geometria-molecular"
              component={MolecularGeometrySimulatorPage}
            />

            {/* Perfil, assinatura, ranking e caderno de erros */}
            <Route path="/perfil" component={ProfilePage} />
            <Route path="/perfil/:userId" component={PublicProfilePage} />
            <Route path="/caderno-de-erros" component={ErrorNotebook} />
            <Route path="/minha-assinatura" component={MinhaAssinaturaPage} />
            <Route path="/ranking" component={RankingPage} />

            <Route path="/vet" component={VetPage} />
            <Route path="/vet/diagnostico" component={VetDiagnosisPage} />
            <Route path="/vet/objetivo" component={VetObjectivePage} />
            <Route path="/vet/plano" component={VetPlanPage} />
            <Route path="/vet/questoes" component={VetQuestionsPage} />
            <Route path="/vet/treino" component={VetTrainingPage} />
            <Route path="/vet/prioridades" component={VetPrioritiesPage} />
            <Route path="/vet/nivelamento" component={VetLevelPage} />
            <Route path="/vet/simulado" component={VetMockPage} />
            <Route
              path="/vet/simulado/resultado"
              component={VetMockResultPage}
            />

            {/* Perfil, assinatura, ranking e caderno de erros */}
            <Route path="/perfil" component={ProfilePage} />
            <Route path="/perfil/:userId" component={PublicProfilePage} />
            <Route path="/caderno-de-erros" component={ErrorNotebook} />
            <Route path="/minha-assinatura" component={MinhaAssinaturaPage} />
            <Route path="/ranking" component={RankingPage} />

            {/* Cinemática */}
            <Route path="/cinematica" component={Home} />
            <Route path="/cinematica/learn" component={Learn} />
            <Route path="/cinematica/quiz" component={Quiz} />
            <Route path="/cinematica/graphs" component={Graphs} />
            <Route path="/cinematica/graphs-new" component={CinematicaGraphs} />
            <Route path="/cinematica/calculator" component={Calculator} />
            <Route path="/cinematica/formulas" component={Formulas} />
            <Route path="/cinematica/quiz-new" component={CinematicaQuiz} />
            <Route
              path="/cinematica/simulator"
              component={CinematicaSimulator}
            />
            <Route
              path="/cinematica/topic/bases"
              component={CinematicaTopicBases}
            />
            <Route
              path="/cinematica/topic/velocidade"
              component={CinematicaTopicVelocidade}
            />
            <Route
              path="/cinematica/topic/mru"
              component={CinematicaTopicMRU}
            />
            <Route
              path="/cinematica/topic/mruv"
              component={CinematicaTopicMRUV}
            />
            <Route
              path="/cinematica/topic/mcu"
              component={CinematicaTopicCircular}
            />
            <Route
              path="/cinematica/topic/circular"
              component={CinematicaTopicCircular}
            />
            <Route
              path="/cinematica/topic/queda-livre"
              component={CinematicaTopicQuedaLivre}
            />

            {/* Dinâmica */}
            <Route path="/dinamica" component={DinamicaHome} />
            <Route path="/dinamica/learn" component={DynamicsLearn} />
            <Route path="/dinamica/quiz" component={DynamicsQuiz} />
            <Route path="/dinamica/calculator" component={DynamicsCalculator} />
            <Route path="/dinamica/formulas" component={DynamicsFormulas} />
            <Route path="/dinamica/graphs" component={DynamicsGraphs} />
            <Route path="/dinamica/simulator" component={DynamicsSimulator} />
            <Route
              path="/dinamica/topic/newton"
              component={DynamicsTopicNewton}
            />
            <Route
              path="/dinamica/topic/atrito"
              component={DynamicsTopicFriction}
            />
            <Route
              path="/dinamica/topic/energy"
              component={DynamicsTopicEnergy}
            />
            <Route
              path="/dinamica/topic/momentum"
              component={DynamicsTopicMomentum}
            />
            <Route
              path="/dinamica/topic/power"
              component={DynamicsTopicPower}
            />

            {/* Estática */}
            <Route path="/estatica" component={EstaticaHome} />
            <Route path="/estatica/graphs" component={EstaticaGraphs} />
            <Route path="/estatica/quiz" component={EstaticaQuiz} />
            <Route path="/estatica/simulator" component={EstaticaSimulator} />
            <Route
              path="/estatica/topic/equilibrio"
              component={EstaticaTopicEquilibrio}
            />
            <Route
              path="/estatica/topic/torque"
              component={EstaticaTopicTorque}
            />
            <Route
              path="/estatica/topic/maquinas"
              component={EstaticaTopicMaquinas}
            />
            <Route
              path="/estatica/topic/hidrostatica"
              component={EstaticaTopicHidrostatica}
            />

            {/* Termologia */}
            <Route path="/termologia" component={TermologiaHome} />
            <Route path="/termologia/graphs" component={TermologiaGraphs} />
            <Route path="/termologia/quiz" component={TermologiaQuiz} />
            <Route
              path="/termologia/simulator"
              component={TermologiaSimulator}
            />
            <Route
              path="/termologia/topic/temperatura"
              component={TermologiaTopicTemperatura}
            />
            <Route
              path="/termologia/topic/calor"
              component={TermologiaTopicCalor}
            />
            <Route
              path="/termologia/topic/calorimetria"
              component={TermologiaTopicCalorimetria}
            />
            <Route
              path="/termologia/topic/termodinamica"
              component={TermologiaTopicTermodinamica}
            />
            <Route
              path="/termologia/topic/dilatacao"
              component={TermologiaTopicDilatacao}
            />

            {/* Mecânica */}
            <Route path="/mecanica" component={MecanicaHome} />
            <Route
              path="/mecanica/topic/cinematica"
              component={MecanicaTopicCinematica}
            />
            <Route
              path="/mecanica/topic/dinamica"
              component={MecanicaTopicDinamica}
            />

            {/* Ondulatória */}
            <Route path="/ondulatoria" component={OndulatoriaHome} />
            <Route
              path="/ondulatoria/topic/conceitos"
              component={OndulatoriaTopicConceitos}
            />
            <Route
              path="/ondulatoria/topic/mhs"
              component={OndulatoriaTopicMHS}
            />
            <Route
              path="/ondulatoria/topic/equacao"
              component={OndulatoriaTopicEquacao}
            />
            <Route
              path="/ondulatoria/topic/fenomenos"
              component={OndulatoriaTopicFenomenos}
            />
            <Route
              path="/ondulatoria/topic/som"
              component={OndulatoriaTopicSom}
            />
            <Route
              path="/ondulatoria/topic/luz"
              component={OndulatoriaTopicLuz}
            />
            <Route
              path="/ondulatoria/simulator"
              component={OndulatoriaSimulator}
            />
            <Route path="/ondulatoria/quiz" component={OndulatoriaQuiz} />
            <Route path="/ondulatoria/graphs" component={OndulatoriaGraphs} />

            {/* Óptica */}
            <Route path="/optica" component={OpticaHome} />
            <Route
              path="/optica/topic/conceitos"
              component={OpticaTopicConceitos}
            />
            <Route path="/optica/topic/lentes" component={OpticaTopicLentes} />
            <Route
              path="/optica/topic/fenomenos"
              component={OpticaTopicFenomenos}
            />
            <Route path="/optica/topic/fisica" component={OpticaTopicFisica} />
            <Route path="/optica/simulator" component={OpticaSimulator} />
            <Route path="/optica/graphs" component={OpticaGraphs} />
            <Route path="/optica/quiz" component={OpticaQuiz} />

            {/* Eletricidade */}
            <Route path="/eletricidade" component={EletricidadeHome} />
            <Route
              path="/eletricidade/topic/eletrostatica"
              component={EletricidadeTopicEletrostatica}
            />
            <Route
              path="/eletricidade/topic/eletrodinamica"
              component={EletricidadeTopicEletrodinamica}
            />
            <Route
              path="/eletricidade/topic/capacitores-indutores"
              component={EletricidadeTopicCapacitoresIndutores}
            />
            <Route
              path="/eletricidade/topic/magnetismo"
              component={EletricidadeTopicMagnetismo}
            />
            <Route
              path="/eletricidade/topic/potencial-eletrico"
              component={EletricidadeTopicPotencialEletrico}
            />
            <Route
              path="/eletricidade/topic/dieletricos"
              component={EletricidadeTopicDieletricos}
            />
            <Route
              path="/eletricidade/topic/circuitos-ac"
              component={EletricidadeTopicCircuitosAC}
            />
            <Route
              path="/eletricidade/topic/ondas-eletromagneticas"
              component={EletricidadeTopicOndasEletromagneticas}
            />

            {/* Eletromagnetismo */}
            <Route path="/eletromagnetismo" component={EletromagnetismoHome} />
            <Route
              path="/eletromagnetismo/topic/campos-magneticos"
              component={EletromagnetismoTopicCamposMagneticos}
            />
            <Route
              path="/eletromagnetismo/topic/inducao-eletromagnetica"
              component={EletromagnetismoTopicInducaoEletromagnetica}
            />
            <Route
              path="/eletromagnetismo/topic/equacoes-maxwell"
              component={EletromagnetismoTopicEquacoesMacwell}
            />
            <Route
              path="/eletromagnetismo/topic/ondas-eletromagneticas-avancado"
              component={EletromagnetismoTopicOndasAvancado}
            />
            <Route
              path="/eletromagnetismo/topic/aplicacoes-eletromagnetismo"
              component={EletromagnetismoTopicAplicacoes}
            />
            <Route
              path="/eletromagnetismo/topic/radiacao-eletromagnetica"
              component={EletromagnetismoTopicRadiacao}
            />

            {/* Magnetismo */}
            <Route path="/magnetismo" component={MagnetismoHome} />
            <Route
              path="/magnetismo/topic/forca-magnetica"
              component={MagnetismoTopicForcaMagnetica}
            />

            {/* Física moderna */}
            <Route path="/fisica-moderna" component={FisicaModernaHome} />
            <Route
              path="/fisica-moderna/topic/relatividade"
              component={FisicaModernaTopicRelatividade}
            />
            <Route
              path="/fisica-moderna/topic/quantica"
              component={FisicaModernaTopicQuantica}
            />
            <Route
              path="/fisica-moderna/topic/atomo"
              component={FisicaModernaTopicAtomo}
            />
            <Route
              path="/fisica-moderna/topic/particulas"
              component={FisicaModernaTopicParticulas}
            />
            <Route
              path="/fisica-moderna/topic/aplicacoes"
              component={FisicaModernaTopicAplicacoes}
            />

            {/* Área do aluno */}
            <Route path="/progress" component={Progress} />
            <Route path="/ia-resolver" component={IAResolver} />

            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </div>
    </SubscriptionGuard>
  );
}

function Router() {
  return (
    <Switch>
      {/* Entrada inteligente */}
      <Route path="/" component={RootGate} />

      {/* Rotas públicas */}
      <Route path="/landing" component={Landing} />
      <Route path="/login" component={LoginPage} />
      <Route path="/cadastro" component={RegisterPage} />
      <Route path="/planos" component={PricingPage} />
      <Route path="/assinatura-pendente" component={SubscriptionPendingPage} />

      {/* Todo o resto exige login + assinatura, com exceção de admin liberado pelo guard */}
      <Route>
        <PrivateRouter />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
