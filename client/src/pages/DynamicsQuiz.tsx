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
    question: "Uma força de 20 N é aplicada a um objeto de 4 kg. Qual é a aceleração resultante?",
    options: ["5 m/s²", "80 m/s²", "0.2 m/s²", "4 m/s²"],
    correct: 0,
    explanation: "Usando F = m*a, temos: a = F/m = 20/4 = 5 m/s^2"
  },
  {
    id: 2,
    question: "Qual é a energia cinética de um objeto de 2 kg movendo-se a 3 m/s?",
    options: ["6 J", "9 J", "12 J", "18 J"],
    correct: 1,
    explanation: "Ec = 0.5*m*v^2 = 0.5*2*3^2 = 0.5*2*9 = 9 J"
  },
  {
    id: 3,
    question: "Um objeto de 5 kg está a 10 m de altura. Qual é sua energia potencial? (g = 10 m/s²)",
    options: ["50 J", "150 J", "500 J", "1000 J"],
    correct: 2,
    explanation: "Ep = m*g*h = 5*10*10 = 500 J"
  },
  {
    id: 4,
    question: "Qual é o momentum de um objeto de 3 kg movendo-se a 4 m/s?",
    options: ["7 kg·m/s", "12 kg·m/s", "1.33 kg·m/s", "12 m/s"],
    correct: 1,
    explanation: "p = m*v = 3*4 = 12 kg*m/s"
  },
  {
    id: 5,
    question: "Uma força de 10 N é aplicada a um objeto durante 5 segundos. Qual é o impulso?",
    options: ["2 N·s", "15 N·s", "50 N·s", "0.5 N·s"],
    correct: 2,
    explanation: "I = F*Delta t = 10*5 = 50 N*s"
  },
  {
    id: 6,
    question: "Em um sistema isolado, qual grandeza é sempre conservada em uma colisão?",
    options: ["Energia cinética", "Momentum", "Força", "Aceleração"],
    correct: 1,
    explanation: "Em um sistema isolado, o momentum total é sempre conservado, mesmo que a energia cinética não seja (colisões inelásticas)."
  }
];

export default function DynamicsQuiz() {
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
    ctx.strokeStyle = "#9333ea";
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Inner border
    ctx.strokeStyle = "#c084fc";
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
    ctx.fillText("Quiz de Dinâmica", width / 2, 170);

    // Decorative line
    ctx.strokeStyle = "#9333ea";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.lineTo(width - 200, 200);
    ctx.stroke();

    // Content
    ctx.fillStyle = "#334155";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Parabéns! Você completou o Quiz de Dinâmica", width / 2, 280);

    // Score
    ctx.fillStyle = "#9333ea";
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
    link.download = `certificado-dinamica-${Date.now()}.png`;
    link.click();
  };

  const handleShare = () => {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    const message = `🎓 Consegui ${percentage}% de acerto no Quiz de Dinâmica do Projeto Vetor! Vem estudar comigo: https://chat.whatsapp.com/Grwi9hUFvFbA91gShvZGqI`;
    window.open(`https://chat.whatsapp.com/Grwi9hUFvFbA91gShvZGqI`, "_blank");
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
          <div className="container py-4 flex items-center gap-4">
            <Link href="/dinamica">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dinamica">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Quiz de Dinâmica</h1>
          </div>
          <div className="text-sm font-semibold text-slate-600">
            Questão {currentQuestion + 1}/{quizQuestions.length}
          </div>
        </div>
      </header>

      <section className="container py-12 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Card className="w-full max-w-2xl p-8 shadow-xl">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg">
              <p className="text-lg font-semibold text-slate-900">{question.question}</p>
            </div>

            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className="w-full p-4 text-left border-2 border-slate-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-transparent group-hover:bg-purple-600" />
                    </div>
                    <span className="font-medium text-slate-700">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
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
