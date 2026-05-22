import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";

import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";

import Landing from "./pages/Landing";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PricingPage from "./pages/PricingPage";
import SubscriptionPendingPage from "./pages/SubscriptionPendingPage";

import Home from "./pages/Home";
import DinamicaHome from "./pages/DinamicaHome";
import Calculator from "./pages/Calculator";
import Formulas from "./pages/Formulas";
import Learn from "./pages/Learn";
import Quiz from "./pages/Quiz";
import Graphs from "./pages/Graphs";

import DynamicsLearn from "./pages/DynamicsLearn";
import DynamicsCalculator from "./pages/DynamicsCalculator";
import DynamicsFormulas from "./pages/DynamicsFormulas";
import DynamicsQuiz from "./pages/DynamicsQuiz";
import DynamicsGraphs from "./pages/DynamicsGraphs";
import DynamicsSimulator from "./pages/DynamicsSimulator";

import CinematicaSimulator from "./pages/CinematicaSimulator";
import CinematicaGraphs from "./pages/CinematicaGraphs";
import CinematicaQuiz from "./pages/CinematicaQuiz";
import CinematicaTopicBases from "./pages/CinematicaTopicBases";
import CinematicaTopicVelocidade from "./pages/CinematicaTopicVelocidade";
import CinematicaTopicMRU from "./pages/CinematicaTopicMRU";
import CinematicaTopicMRUV from "./pages/CinematicaTopicMRUV";
import CinematicaTopicCircular from "./pages/CinematicaTopicCircular";
import CinematicaTopicQuedaLivre from "./pages/CinematicaTopicQuedaLivre";

import Progress from "./pages/Progress";
import IAResolver from "./pages/IAResolver";
import QuestionBank from "./pages/QuestionBankPage";

import DynamicsTopicNewton from "./pages/DynamicsTopicNewton";
import DynamicsTopicFriction from "./pages/DynamicsTopicFriction";
import DynamicsTopicEnergy from "./pages/DynamicsTopicEnergy";
import DynamicsTopicMomentum from "./pages/DynamicsTopicMomentum";
import DynamicsTopicPower from "./pages/DynamicsTopicPower";

import EstaticaHome from "./pages/EstaticaHome";
import EstaticaGraphs from "./pages/EstaticaGraphs";
import EstaticaQuiz from "./pages/EstaticaQuiz";
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
import TermologiaQuiz from "./pages/TermologiaQuiz";
import TermologiaSimulator from "./pages/TermologiaSimulator";
import TermologiaTopicTemperatura from "./pages/TermologiaTopicTemperatura";
import TermologiaTopicCalor from "./pages/TermologiaTopicCalor";
import TermologiaTopicCalorimetria from "./pages/TermologiaTopicCalorimetria";
import TermologiaTopicTermodinamica from "./pages/TermologiaTopicTermodinamica";
import TermologiaTopicDilatacao from "./pages/TermologiaTopicDilatacao";

import MecanicaHome from "./pages/MecanicaHome";
import MecanicaTopicCinematica from "./pages/MecanicaTopicCinematica";
import MecanicaTopicDinamica from "./pages/MecanicaTopicDinamica";

import OndulatoriaHome from "./pages/Ondulat#U00f3riaHome";
import OndulatoriaTopicConceitos from "./pages/Ondulat#U00f3riaTopicConceitos";
import OndulatoriaTopicMHS from "./pages/Ondulat#U00f3riaTopicMHS";
import OndulatoriaTopicEquacao from "./pages/Ondulat#U00f3riaTopicEquacao";
import OndulatoriaTopicFenomenos from "./pages/Ondulat#U00f3riaTopicFenomenos";
import OndulatoriaTopicSom from "./pages/Ondulat#U00f3riaTopicSom";
import OndulatoriaTopicLuz from "./pages/Ondulat#U00f3riaTopicLuz";
import OndulatoriaSimulator from "./pages/OndulatoriaSimulator";
import OndulatoriaGraphs from "./pages/OndulatoriaGraphs";
import OndulatoriaQuiz from "./pages/OndulatoriaQuiz";

import OpticaHome from "./pages/OpticaHome";
import OpticaTopicConceitos from "./pages/OpticaTopicConceitos";
import OpticaTopicLentes from "./pages/OpticaTopicLentes";
import OpticaTopicFenomenos from "./pages/OpticaTopicFenomenos";
import OpticaSimulator from "./pages/OpticaSimulator";
import OpticaGraphs from "./pages/OpticaGraphs";
import OpticaQuiz from "./pages/OpticaQuiz";

import FisicaModernaHome from "./pages/FisicaModernaHome";
import FisicaModernaTopicRelatividade from "./pages/FisicaModernaTopicRelatividade";
import FisicaModernaTopicQuantica from "./pages/FisicaModernaTopicQuantica";
import FisicaModernaTopicAtomo from "./pages/FisicaModernaTopicAtomo";
import FisicaModernaTopicParticulas from "./pages/FisicaModernaTopicParticulas";
import FisicaModernaTopicAplicacoes from "./pages/FisicaModernaTopicAplicacoes";

function PrivateRouter() {
  return (
    <ProtectedRoute>
      <Switch>
        {/* Entrada da plataforma depois do login */}
        <Route path="/fisica" component={FisicaSelector} />

        {/* Física por frentes */}
        <Route path="/fisica-i" component={FisicaIHome} />
        <Route path="/fisica-ii" component={FisicaIIHome} />
        <Route path="/fisica-iii" component={FisicaIIIHome} />

        {/* Banco de questões */}
        <Route path="/banco-questoes" component={QuestionBank} />

        {/* Cinemática */}
        <Route path="/cinematica" component={Home} />
        <Route path="/cinematica/learn" component={Learn} />
        <Route path="/cinematica/quiz" component={Quiz} />
        <Route path="/cinematica/graphs" component={Graphs} />
        <Route path="/cinematica/graphs-new" component={CinematicaGraphs} />
        <Route path="/cinematica/calculator" component={Calculator} />
        <Route path="/cinematica/formulas" component={Formulas} />
        <Route path="/cinematica/quiz-new" component={CinematicaQuiz} />
        <Route path="/cinematica/simulator" component={CinematicaSimulator} />
        <Route path="/cinematica/topic/bases" component={CinematicaTopicBases} />
        <Route path="/cinematica/topic/velocidade" component={CinematicaTopicVelocidade} />
        <Route path="/cinematica/topic/mru" component={CinematicaTopicMRU} />
        <Route path="/cinematica/topic/mruv" component={CinematicaTopicMRUV} />
        <Route path="/cinematica/topic/circular" component={CinematicaTopicCircular} />
        <Route path="/cinematica/topic/queda-livre" component={CinematicaTopicQuedaLivre} />

        {/* Dinâmica */}
        <Route path="/dinamica" component={DinamicaHome} />
        <Route path="/dinamica/learn" component={DynamicsLearn} />
        <Route path="/dinamica/quiz" component={DynamicsQuiz} />
        <Route path="/dinamica/calculator" component={DynamicsCalculator} />
        <Route path="/dinamica/formulas" component={DynamicsFormulas} />
        <Route path="/dinamica/graphs" component={DynamicsGraphs} />
        <Route path="/dinamica/simulator" component={DynamicsSimulator} />
        <Route path="/dinamica/topic/newton" component={DynamicsTopicNewton} />
        <Route path="/dinamica/topic/atrito" component={DynamicsTopicFriction} />
        <Route path="/dinamica/topic/energy" component={DynamicsTopicEnergy} />
        <Route path="/dinamica/topic/momentum" component={DynamicsTopicMomentum} />
        <Route path="/dinamica/topic/power" component={DynamicsTopicPower} />

        {/* Estática */}
        <Route path="/estatica" component={EstaticaHome} />
        <Route path="/estatica/graphs" component={EstaticaGraphs} />
        <Route path="/estatica/quiz" component={EstaticaQuiz} />
        <Route path="/estatica/simulator" component={EstaticaSimulator} />
        <Route path="/estatica/topic/equilibrio" component={EstaticaTopicEquilibrio} />
        <Route path="/estatica/topic/torque" component={EstaticaTopicTorque} />
        <Route path="/estatica/topic/maquinas" component={EstaticaTopicMaquinas} />
        <Route path="/estatica/topic/hidrostatica" component={EstaticaTopicHidrostatica} />

        {/* Termologia */}
        <Route path="/termologia" component={TermologiaHome} />
        <Route path="/termologia/graphs" component={TermologiaGraphs} />
        <Route path="/termologia/quiz" component={TermologiaQuiz} />
        <Route path="/termologia/simulator" component={TermologiaSimulator} />
        <Route path="/termologia/topic/temperatura" component={TermologiaTopicTemperatura} />
        <Route path="/termologia/topic/calor" component={TermologiaTopicCalor} />
        <Route path="/termologia/topic/calorimetria" component={TermologiaTopicCalorimetria} />
        <Route path="/termologia/topic/termodinamica" component={TermologiaTopicTermodinamica} />
        <Route path="/termologia/topic/dilatacao" component={TermologiaTopicDilatacao} />

        {/* Mecânica */}
        <Route path="/mecanica" component={MecanicaHome} />
        <Route path="/mecanica/topic/cinematica" component={MecanicaTopicCinematica} />
        <Route path="/mecanica/topic/dinamica" component={MecanicaTopicDinamica} />

        {/* Ondulatória */}
        <Route path="/ondulatoria" component={OndulatoriaHome} />
        <Route path="/ondulatoria/topic/conceitos" component={OndulatoriaTopicConceitos} />
        <Route path="/ondulatoria/topic/mhs" component={OndulatoriaTopicMHS} />
        <Route path="/ondulatoria/topic/equacao" component={OndulatoriaTopicEquacao} />
        <Route path="/ondulatoria/topic/fenomenos" component={OndulatoriaTopicFenomenos} />
        <Route path="/ondulatoria/topic/som" component={OndulatoriaTopicSom} />
        <Route path="/ondulatoria/topic/luz" component={OndulatoriaTopicLuz} />
        <Route path="/ondulatoria/simulator" component={OndulatoriaSimulator} />
        <Route path="/ondulatoria/quiz" component={OndulatoriaQuiz} />
        <Route path="/ondulatoria/graphs" component={OndulatoriaGraphs} />

        {/* Óptica */}
        <Route path="/optica" component={OpticaHome} />
        <Route path="/optica/topic/conceitos" component={OpticaTopicConceitos} />
        <Route path="/optica/topic/lentes" component={OpticaTopicLentes} />
        <Route path="/optica/topic/fenomenos" component={OpticaTopicFenomenos} />
        <Route path="/optica/simulator" component={OpticaSimulator} />
        <Route path="/optica/graphs" component={OpticaGraphs} />
        <Route path="/optica/quiz" component={OpticaQuiz} />

        {/* Eletricidade */}
        <Route path="/eletricidade" component={EletricidadeHome} />
        <Route path="/eletricidade/topic/eletrostatica" component={EletricidadeTopicEletrostatica} />
        <Route path="/eletricidade/topic/eletrodinamica" component={EletricidadeTopicEletrodinamica} />
        <Route path="/eletricidade/topic/capacitores-indutores" component={EletricidadeTopicCapacitoresIndutores} />
        <Route path="/eletricidade/topic/magnetismo" component={EletricidadeTopicMagnetismo} />
        <Route path="/eletricidade/topic/potencial-eletrico" component={EletricidadeTopicPotencialEletrico} />
        <Route path="/eletricidade/topic/dieletricos" component={EletricidadeTopicDieletricos} />
        <Route path="/eletricidade/topic/circuitos-ac" component={EletricidadeTopicCircuitosAC} />
        <Route path="/eletricidade/topic/ondas-eletromagneticas" component={EletricidadeTopicOndasEletromagneticas} />

        {/* Eletromagnetismo */}
        <Route path="/eletromagnetismo" component={EletromagnetismoHome} />
        <Route path="/eletromagnetismo/topic/campos-magneticos" component={EletromagnetismoTopicCamposMagneticos} />
        <Route path="/eletromagnetismo/topic/inducao-eletromagnetica" component={EletromagnetismoTopicInducaoEletromagnetica} />
        <Route path="/eletromagnetismo/topic/equacoes-maxwell" component={EletromagnetismoTopicEquacoesMacwell} />
        <Route path="/eletromagnetismo/topic/ondas-eletromagneticas-avancado" component={EletromagnetismoTopicOndasAvancado} />
        <Route path="/eletromagnetismo/topic/aplicacoes-eletromagnetismo" component={EletromagnetismoTopicAplicacoes} />
        <Route path="/eletromagnetismo/topic/radiacao-eletromagnetica" component={EletromagnetismoTopicRadiacao} />

        {/* Magnetismo */}
        <Route path="/magnetismo" component={MagnetismoHome} />
        <Route path="/magnetismo/topic/forca-magnetica" component={MagnetismoTopicForcaMagnetica} />

        {/* Física moderna */}
        <Route path="/fisica-moderna" component={FisicaModernaHome} />
        <Route path="/fisica-moderna/topic/relatividade" component={FisicaModernaTopicRelatividade} />
        <Route path="/fisica-moderna/topic/quantica" component={FisicaModernaTopicQuantica} />
        <Route path="/fisica-moderna/topic/atomo" component={FisicaModernaTopicAtomo} />
        <Route path="/fisica-moderna/topic/particulas" component={FisicaModernaTopicParticulas} />
        <Route path="/fisica-moderna/topic/aplicacoes" component={FisicaModernaTopicAplicacoes} />

        {/* Área do aluno */}
        <Route path="/progress" component={Progress} />
        <Route path="/ia-resolver" component={IAResolver} />

        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      {/* Rotas públicas */}
      <Route path="/" component={Landing} />
      <Route path="/landing" component={Landing} />
      <Route path="/login" component={LoginPage} />
      <Route path="/cadastro" component={RegisterPage} />
      <Route path="/planos" component={PricingPage} />
      <Route path="/assinatura-pendente" component={SubscriptionPendingPage} />

      {/* Todo o resto exige login */}
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
