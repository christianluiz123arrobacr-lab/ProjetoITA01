import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { Link } from "wouter";

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const quizQuestions: Question[] = [
  {
    id: 1,
    question: "Um objeto real é colocado a 30 cm de uma lente convergente de distância focal 10 cm. A imagem formada é:",
    options: ["Real, invertida e menor", "Virtual, direita e maior", "Real, invertida e maior", "Virtual, direita e menor"],
    correct: 0,
    explanation: "Usando Gauss: 1/10 = 1/30 + 1/p'. 1/p' = 3/30 - 1/30 = 2/30. p' = 15 cm. Como p' > 0, é real. Aumento A = -p'/p = -15/30 = -0,5. Invertida e menor."
  },
  {
    id: 2,
    question: "Um raio de luz incide de um meio A (n=1,5) para um meio B (n=1,0). O ângulo limite para reflexão total é:",
    options: ["arcsen(2/3)", "arcsen(3/2)", "45 graus", "60 graus"],
    correct: 0,
    explanation: "O ângulo limite L é dado por sen(L) = n_menor / n_maior. sen(L) = 1,0 / 1,5 = 2/3. Logo, L = arcsen(2/3)."
  },
  {
    id: 3,
    question: "Dois espelhos planos formam um ângulo de 60 graus entre si. Quantas imagens são formadas de um objeto pontual colocado entre eles?",
    options: ["5", "6", "4", "7"],
    correct: 0,
    explanation: "O número de imagens é n = (360/α) - 1. n = (360/60) - 1 = 6 - 1 = 5 imagens."
  },
  {
    id: 4,
    question: "Uma lente plano-convexa de vidro (n=1,5) tem raio de curvatura 20 cm. Qual é sua vergência no ar?",
    options: ["2,5 di", "5,0 di", "10,0 di", "0,5 di"],
    correct: 0,
    explanation: "Equação dos Fabricantes: V = (n-1)(1/R1 + 1/R2). R1=0,2m, R2=infinito. V = (1,5-1)(1/0,2) = 0,5 * 5 = 2,5 di."
  },
  {
    id: 5,
    question: "Na experiência de Young (fenda dupla), a distância entre franjas claras consecutivas aumenta se:",
    options: ["Aumentarmos a distância entre as fendas", "Diminuirmos o comprimento de onda", "Aumentarmos a distância ao anteparo", "Usarmos luz violeta em vez de vermelha"],
    correct: 2,
    explanation: "A interfranja é dada por i = λD/d. Para aumentar i, podemos aumentar λ, aumentar D (distância ao anteparo) ou diminuir d (distância entre fendas)."
  }
];

export default function OpticaQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleAnswer = (index: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = index;
    setSelectedAnswers(newAnswers);

    if (index === quizQuestions[currentQuestion].correct) {
      setScore(score + 1);
    }

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const generateCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1200;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = "#f97316"; // Laranja Óptica
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Inner border
    ctx.strokeStyle = "#fdba74";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // Title
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("CERTIFICADO DE CONCLUSÃO", width / 2, 120);

    // Subtitle
    ctx.fillStyle = "#64748b";
    ctx.font = "24px Arial";
    ctx.fillText("Quiz de Óptica - Nível ITA/IME", width / 2, 170);

    // Decorative line
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.lineTo(width - 200, 200);
    ctx.stroke();

    // Content
    ctx.fillStyle = "#334155";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Parabéns! Você completou o módulo de Óptica Geométrica e Física.", width / 2, 280);

    // Score
    ctx.fillStyle = "#f97316";
    ctx.font = "bold 36px Arial";
    ctx.fillText(`Pontuação: ${score}/${quizQuestions.length}`, width / 2, 360);

    // Percentage
    const percentage = Math.round((score / quizQuestions.length) * 100);
    ctx.fillStyle = "#334155";
    ctx.font = "24px Arial";
    ctx.fillText(`${percentage}% de acerto`, width / 2, 420);

    // Footer
    ctx.fillStyle = "#64748b";
    ctx.font = "16px Arial";
    ctx.fillText("Projeto Vetor", width / 2, 700);
    ctx.fillText(new Date().toLocaleDateString("pt-BR"), width / 2, 750);

    // Download
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `certificado-optica-${Date.now()}.png`;
    link.click();
  };

  const handleShare = () => {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    window.open(`https://wa.me/?text=Consegui ${percentage}% de acerto no Quiz de Óptica do Projeto Vetor!`, "_blank");
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowResults(false);
    setSelectedAnswers([]);
  };

  if (showResults) {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    const passed = percentage >= 70;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-50">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
          <div className="container py-4 flex items-center gap-4">
            <Link href="/optica">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Resultados do Quiz</h1>
          </div>
        </header>

        <section className="container py-12 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="w-full max-w-md p-8 shadow-xl">
            <div className="text-center space-y-6">
              <div className={`text-6xl font-bold ${passed ? "text-green-600" : "text-orange-600"}`}>
                {percentage}%
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 mb-2">
                  {passed ? "Excelente! 🎉" : "Bom esforço! 💪"}
                </p>
                <p className="text-slate-600">
                  Você acertou {score} de {quizQuestions.length} questões
                </p>
              </div>

              {passed && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 font-semibold">✓ Você conquistou o certificado!</p>
                </div>
              )}

              <div className="space-y-3">
                {passed && (
                  <>
                    <Button onClick={generateCertificate} className="w-full bg-green-600 hover:bg-green-700">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Certificado
                    </Button>
                    <Button onClick={handleShare} variant="outline" className="w-full">
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar no WhatsApp
                    </Button>
                  </>
                )}
                <Button onClick={resetQuiz} variant="outline" className="w-full">
                  Tentar Novamente
                </Button>
              </div>
            </div>
          </Card>
        </section>

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    );
  }

  const question = quizQuestions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/optica">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Quiz de Óptica</h1>
          </div>
          <div className="text-sm font-semibold text-slate-600">
            Questão {currentQuestion + 1}/{quizQuestions.length}
          </div>
        </div>
      </header>

      <section className="container py-12 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Card className="w-full max-w-2xl p-8 shadow-xl">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-100 to-amber-100 p-4 rounded-lg">
              <p className="text-lg font-semibold text-slate-900">{question.question}</p>
            </div>

            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className="w-full p-4 text-left border-2 border-slate-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-transparent group-hover:bg-orange-600" />
                    </div>
                    <span className="font-medium text-slate-700">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
              />
            </div>
          </div>
        </Card>
      </section>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
