import { useEffect, useState } from "react";
import { Redirect, Route, Switch } from "wouter";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";

import ErrorBoundary from "./components/ErrorBoundary";
import SubscriptionGuard from "./components/SubscriptionGuard";
import { ThemeProvider } from "./contexts/ThemeContext";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

import Landing from "./pages/Landing";
import LandingPage from "./pages/LandingPage";
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

import ProfilePage from "./pages/ProfilePage";
import MinhaAssinaturaPage from "./pages/MinhaAssinaturaPage";
import RankingPage from "./pages/RankingPage";

import VetPage from "./pages/VetPage";
import VetDiagnosisPage from "./pages/VetDiagnosisPage";
import VetObjectivePage from "./pages/VetObjectivePage";
import VetPlanPage from "./pages/VetPlanPage";
import VetQuestionsPage from "./pages/VetQuestionsPage";
import VetTrainingPage from "./pages/VetTrainingPage";
import VetPrioritiesPage from "./pages/VetPrioritiesPage";
import VetLevelPage from "./pages/VetLevelPage";
import VetMockPage from "./pages/VetMockPage";
import VetMockResultPage from "./pages/VetMockResultPage";

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

import OndulatoriaHome from "./pages/OndulatóriaHome";
import OndulatoriaTopicConceitos from "./pages/OndulatóriaTopicConceitos";
import OndulatoriaTopicMHS from "./pages/OndulatóriaTopicMHS";
import OndulatoriaTopicEquacao from "./pages/OndulatóriaTopicEquacao";
import OndulatoriaTopicFenomenos from "./pages/OndulatóriaTopicFenomenos";
import OndulatoriaTopicSom from "./pages/OndulatóriaTopicSom";
import OndulatoriaTopicLuz from "./pages/OndulatóriaTopicLuz";
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

      try {
        setAccessState("checking");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, ativo")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.warn("Erro ao buscar perfil na entrada:", profileError);
        }

        if (profile?.role === "admin") {
          if (!cancelled) {
            setAccessState("allowed");
          }

          return;
        }

        if (profile?.ativo === false) {
          if (!cancelled) {
            setAccessState("blocked");
          }

          return;
        }

        const { data: hasActiveSubscription, error: rpcError } =
          await supabase.rpc("user_has_active_subscription", {
            target_user_id: user.id,
          });

        if (!rpcError && typeof hasActiveSubscription === "boolean") {
          if (!cancelled) {
            setAccessState(hasActiveSubscription ? "allowed" : "blocked");
          }

          return;
        }

        console.warn(
          "RPC user_has_active_subscription falhou na entrada. Usando fallback:",
          rpcError
        );

        const now = new Date().toISOString();

        const { data: subscription, error: subscriptionError } = await supabase
          .from("billing_subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .in("status", ["active", "trialing"])
          .or(`current_period_end.is.null,current_period_end.gte.${now}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subscriptionError) {
          console.warn(
            "Erro ao buscar assinatura ativa na entrada:",
            subscriptionError
          );
        }

        if (!cancelled) {
          setAccessState(subscription ? "allowed" : "blocked");
        }
      } catch (error) {
        console.warn("Erro inesperado na entrada do site:", error);

        if (!cancelled) {
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
            Rumo ao ITA
          </p>

          <p className="mt-2 text-sm text-slate-300">
            Verificando acesso...
          </p>
        </div>
      </div>
    );
  }

  if (accessState === "allowed") {
