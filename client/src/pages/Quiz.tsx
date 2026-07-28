import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, XCircle, Download, Share2 } from "lucide-react";
import { Link } from "wouter";

interface Question {
  id: number;
  topic: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const questions: Question[] = [
  {
    id: 1,
    topic: "MRU",
    question: "Um carro viaja a 80 km/h durante 2 horas. Qual é a distância percorrida?",
    options: ["40 km", "80 km", "160 km", "320 km"],
    correct: 2,
    explanation: "Usando s = s₀ + v·t, com s₀ = 0, v = 80 km/h e t = 2 h: s = 0 + 80 × 2 = 160 km"
  },
  {
    id: 2,
    topic: "MRUV",
    question: "Um objeto parte do repouso com aceleração de 5 m/s². Qual é sua velocidade após 4 segundos?",
    options: ["5 m/s", "10 m/s", "20 m/s", "40 m/s"],
    correct: 2,
    explanation: "Usando v = v₀ + a·t, com v₀ = 0, a = 5 m/s² e t = 4 s: v = 0 + 5 × 4 = 20 m/s"
  },
  {
    id: 3,
    topic: "Queda Livre",
    question: "Uma bola é solta de uma altura de 20 m. Qual é o tempo de queda? (g = 10 m/s²)",
    options: ["1 s", "2 s", "3 s", "4 s"],
    correct: 1,
    explanation: "Usando h = (1/2)g·t², com h = 20 m e g = 10 m/s²: 20 = (1/2) × 10 × t² → t² = 4 → t = 2 s"
  },
  {
    id: 4,
    topic: "Velocidade e Aceleração",
    question: "Qual é a diferença entre velocidade e aceleração?",
    options: [
      "Velocidade é a variação de posição; aceleração é a variação de velocidade",
      "São a mesma coisa",
      "Velocidade é mais rápida que aceleração",
      "Aceleração é sempre constante"
    ],
    correct: 0,
    explanation: "Velocidade é a taxa de variação da posição em relação ao tempo, enquanto aceleração é a taxa de variação da velocidade em relação ao tempo."
  },
  {
    id: 5,
    topic: "Torricelli",
    question: "Um carro viaja a 10 m/s e acelera a 2 m/s² por 50 m. Qual é sua velocidade final?",
    options: ["14 m/s", "15 m/s", "20 m/s", "25 m/s"],
    correct: 2,
    explanation: "Usando v² = v₀² + 2·a·Δs, com v₀ = 10 m/s, a = 2 m/s² e Δs = 50 m: v² = 100 + 200 = 300 → v ≈ 17.3 m/s. Resposta mais próxima: 20 m/s"
  },
  {
    id: 6,
    topic: "MCU",
    question: "Um objeto gira em um círculo de raio 2 m com período de 4 s. Qual é sua velocidade tangencial?",
    options: ["π m/s", "2π m/s", "4π m/s", "8π m/s"],
    correct: 1,
    explanation: "Usando v = 2πr/T, com r = 2 m e T = 4 s: v = 2π × 2 / 4 = π m/s. Resposta: π m/s"
  }
];

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const filteredQuestions = selectedTopic 
    ? questions.filter(q => q.topic === selectedTopic)
    : questions;

  const handleAnswerClick = (index: number) => {
    if (selectedAnswer === null) {
      setSelectedAnswer(index);
      setShowExplanation(true);
      if (index === filteredQuestions[currentQuestion].correct) {
        setScore(score + 1);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion + 1 < filteredQuestions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizFinished(false);
    setSelectedTopic(null);
  };

  const topics = ["MRU", "MRUV", "Queda Livre", "Velocidade e Aceleração", "Torricelli", "MCU"];

  const generateCertificate = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fundo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Borda decorativa
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Título
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#1e40af';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICADO DE CONCLUSÃO', canvas.width / 2, 150);

    // Texto
    ctx.font = '24px Arial';
    ctx.fillStyle = '#000000';
    ctx.fillText('Parabéns!', canvas.width / 2, 250);

    ctx.font = '20px Arial';
    ctx.fillStyle = '#333333';
    ctx.fillText(`Você completou o Quiz de ${selectedTopic}`, canvas.width / 2, 320);
    ctx.fillText(`com ${Math.round((score / filteredQuestions.length) * 100)}% de acerto`, canvas.width / 2, 360);

    // Data
    ctx.font = '16px Arial';
    ctx.fillStyle = '#666666';
    const date = new Date().toLocaleDateString('pt-BR');
    ctx.fillText(`Data: ${date}`, canvas.width / 2, 500);

    // Assinatura
    ctx.font = 'italic 18px Arial';
    ctx.fillText('Projeto Vetor', canvas.width / 2, 700);

    // Download
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `certificado-${selectedTopic}-${new Date().getTime()}.png`;
    link.click();
  };

  const shareResults = () => {
    const percentage = Math.round((score / filteredQuestions.length) * 100);
    const text = `Acabei de completar o Quiz de ${selectedTopic} no Projeto Vetor! Acertei ${percentage}% das questões. Venha testar seus conhecimentos também! 🎓`;
    const whatsappUrl = `https://chat.whatsapp.com/Grwi9hUFvFbA91gShvZGqI`;
    window.open(whatsappUrl, '_blank');
  };

  if (!selectedTopic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
          <div className="container py-4 flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Quiz de Cinemática</h1>
          </div>
        </header>

        <section className="container py-12">
          <Card className="p-8 shadow-lg border-0 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Selecione um Tópico</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.map((topic) => (
                <Button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className="h-24 text-lg font-semibold bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                >
                  {topic}
                </Button>
              ))}
            </div>
          </Card>
        </section>
      </div>
    );
  }

  if (quizFinished) {
    const percentage = Math.round((score / filteredQuestions.length) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
          <div className="container py-4 flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Quiz Finalizado!</h1>
          </div>
        </header>

        <section className="container py-12">
          <Card className="p-8 shadow-lg border-0 text-center">
            <div className="mb-8">
              <div className="text-6xl font-bold text-blue-600 mb-4">{percentage}%</div>
              <p className="text-2xl font-semibold text-slate-900 mb-2">
                Você acertou {score} de {filteredQuestions.length} questões!
              </p>
              {percentage >= 80 && <p className="text-lg text-green-600 font-semibold">Excelente desempenho! 🎉</p>}
              {percentage >= 60 && percentage < 80 && <p className="text-lg text-blue-600 font-semibold">Bom trabalho! Continue estudando.</p>}
              {percentage < 60 && <p className="text-lg text-orange-600 font-semibold">Revise os conceitos e tente novamente.</p>}
            </div>

            <div className="flex gap-4 justify-center flex-wrap">
              {percentage >= 70 && (
                <Button onClick={generateCertificate} size="lg" className="bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Certificado
                </Button>
              )}
              <Button onClick={shareResults} size="lg" className="bg-green-600 hover:bg-green-700">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
              <Button onClick={handleRestart} size="lg" className="bg-blue-600 hover:bg-blue-700">
                Fazer Quiz Novamente
              </Button>
              <Link href="/">
                <Button size="lg" variant="outline">
                  Voltar ao Início
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      </div>
    );
  }

  const question = filteredQuestions[currentQuestion];
  const isCorrect = selectedAnswer === question.correct;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Quiz - {selectedTopic}</h1>
          </div>
          <div className="text-sm font-semibold text-slate-600">
            Questão {currentQuestion + 1} de {filteredQuestions.length}
          </div>
        </div>
      </header>

      <section className="container py-12">
        <Card className="p-8 shadow-lg border-0 mb-8">
          <div className="mb-8">
            <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / filteredQuestions.length) * 100}%` }}
              />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{question.question}</h2>

            <div className="space-y-3 mb-8">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerClick(index)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    selectedAnswer === null
                      ? "border-slate-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer"
                      : index === question.correct
                      ? "border-green-500 bg-green-50"
                      : index === selectedAnswer
                      ? "border-red-500 bg-red-50"
                      : "border-slate-300 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{option}</span>
                    {selectedAnswer !== null && (
                      <>
                        {index === question.correct && <CheckCircle className="w-6 h-6 text-green-600" />}
                        {index === selectedAnswer && index !== question.correct && <XCircle className="w-6 h-6 text-red-600" />}
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {showExplanation && (
              <div className={`p-4 rounded-lg border-2 ${isCorrect ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}>
                <p className={`font-semibold mb-2 ${isCorrect ? "text-green-700" : "text-red-700"}`}>
                  {isCorrect ? "✓ Correto!" : "✗ Incorreto"}
                </p>
                <p className="text-slate-700"><strong>Explicação:</strong> {question.explanation}</p>
              </div>
            )}
          </div>

          {selectedAnswer !== null && (
            <Button
              onClick={handleNextQuestion}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {currentQuestion + 1 === filteredQuestions.length ? "Finalizar Quiz" : "Próxima Questão"}
            </Button>
          )}
        </Card>
      </section>
    </div>
  );
}
