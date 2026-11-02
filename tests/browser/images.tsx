// Isolated fixture: real worker/review/quiz/PDF, synthetic images, NO Storage/auth client.
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./rankingFixture.css";
import { useImageUploadReview } from "../../client/src/components/admin/useImageUploadReview";
import { generateQuestionPdf } from "../../client/src/lib/questionPdfGenerator";
import { InteractiveQuiz } from "../../client/src/components/InteractiveQuiz";
import type { Question } from "../../client/src/types/question";
const blob = (canvas: HTMLCanvasElement, type = "image/png", quality = 1) =>
  new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), type, quality));
function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (const b of Array.from(bytes)) {
    c ^= b;
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
async function synthetic(photo = false) {
  const c = document.createElement("canvas");
  c.width = photo ? 900 : 800;
  c.height = photo ? 600 : 470;
  const x = c.getContext("2d")!;
  if (photo) {
    const pixels = x.createImageData(c.width, c.height);
    let n = 123;
    for (let i = 0; i < pixels.data.length; i += 4) {
      n = (1664525 * n + 1013904223) >>> 0;
      pixels.data[i] = n & 255;
      pixels.data[i + 1] = (n >>> 8) & 255;
      pixels.data[i + 2] = (n >>> 16) & 255;
      pixels.data[i + 3] = 255;
    }
    x.putImageData(pixels, 0, 0);
  } else {
    x.fillStyle = "white";
    x.fillRect(0, 0, 800, 430);
  }
  x.fillStyle = "black";
  x.font = "bold 24px Arial";
  x.fillText("TOPO — Questão sintética: sinais e fórmulas", 24, 36);
  x.font = "18px Arial";
  x.fillText("Texto pequeno: 0,001; −3; +7; 1 ≠ l; x² + y² = r²", 24, 75);
  x.fillText("Fração:  (2x + 1) / (x − 3)     Expoente: 10⁻⁶ m", 24, 108);
  x.font = "12px Arial";
  x.fillText(
    "Detalhe fino: a₁ = 2,5 × 10⁻³; confira ponto decimal, sinais e índices.",
    24,
    138
  );
  x.lineWidth = 1;
  x.strokeStyle = "black";
  x.beginPath();
  x.moveTo(40, 330);
  x.lineTo(40, 175);
  x.moveTo(40, 330);
  x.lineTo(320, 330);
  x.moveTo(40, 320);
  x.lineTo(110, 270);
  x.lineTo(180, 260);
  x.lineTo(300, 180);
  x.stroke();
  x.font = "15px Arial";
  x.fillText("Gráfico v × t", 60, 190);
  x.fillText("t (s)", 285, 355);
  x.beginPath();
  x.moveTo(460, 330);
  x.lineTo(560, 175);
  x.lineTo(700, 330);
  x.closePath();
  x.stroke();
  x.fillText("A", 445, 350);
  x.fillText("B", 555, 160);
  x.fillText("C", 705, 350);
  x.fillText("Diagrama — linha de 1 pixel", 450, 390);
  if (photo) {
    const b = new Uint8Array(
      await (await blob(c, "image/jpeg", 1)).arrayBuffer()
    );
    const exif = new Uint8Array([
      255, 225, 0, 34, 69, 120, 105, 102, 0, 0, 73, 73, 42, 0, 8, 0, 0, 0, 1, 0,
      18, 1, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0,
    ]);
    return new File(
      [b.slice(0, 2), exif, b.slice(2)],
      "foto-orientacao-6.jpg",
      { type: "image/jpeg" }
    );
  }
  const b = new Uint8Array(await (await blob(c)).arrayBuffer());
  const data = new TextEncoder().encode("Comment\0" + "x".repeat(600_000)),
    chunk = new Uint8Array(data.length + 12),
    view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set([116, 69, 88, 116], 4);
  chunk.set(data, 8);
  view.setUint32(chunk.length - 4, crc32(chunk.slice(4, -4)));
  return new File(
    [b.slice(0, 33), chunk, b.slice(33)],
    "prova-texto-transparencia.png",
    { type: "image/png" }
  );
}
function question(url: string, id: string): Question {
  return {
    id,
    codigo: id,
    statement: "Confira a figura e a alternativa. $x^2+1$",
    imageUrl: url,
    imageAlt: "Fórmulas, gráfico e diagrama sintéticos",
    subject: "fisica",
    topic: "Dinâmica",
    exam: "ITA",
    year: 2026,
    difficulty: "medio",
    correctOptionId: "a",
    options: [
      { id: "a", label: "A", text: "Opção com figura", imageUrl: url },
      { id: "b", label: "B", text: "Outra opção" },
    ],
  };
}
async function comparePixels(a: File, b: File) {
  const pixels = async (file: File) => {
    const bitmap = await createImageBitmap(file);
    const c = document.createElement("canvas");
    c.width = bitmap.width;
    c.height = bitmap.height;
    const x = c.getContext("2d")!;
    x.drawImage(bitmap, 0, 0);
    bitmap.close();
    return x.getImageData(0, 0, c.width, c.height).data;
  };
  const original = await pixels(a),
    prepared = await pixels(b);
  let equal = original.length === prepared.length,
    transparent = false;
  for (let i = 0; i < original.length; i++) {
    if (original[i] !== prepared[i]) equal = false;
    if (i % 4 === 3 && original[i] === 0) transparent = true;
  }
  return `Pixels RGBA idênticos: ${equal}; transparência no original: ${transparent}.`;
}
function Fixture() {
  const { reviewAndUpload, reviewUi } = useImageUploadReview();
  const [files, setFiles] = useState<{ original: File; prepared: File } | null>(
      null
    ),
    [url, setUrl] = useState(""),
    [status, setStatus] = useState(""),
    [fail, setFail] = useState(false);
  const calls = React.useRef(0);
  async function run(photo = false) {
    const f = await synthetic(photo);
    try {
      await reviewAndUpload(f, async (prepared, controls) => {
        controls.stage("Enviando arquivo");
        const start = performance.now();
        await new Promise(r => setTimeout(r, 150));
        if (controls.signal.aborted)
          throw new DOMException("Cancelado", "AbortError");
        if (fail && calls.current++ === 0)
          throw new Error(
            "Falha sintética. Tente novamente; a preparada será reutilizada."
          );
        const uploadMs = Math.round(performance.now() - start);
        const comparison = photo ? "" : await comparePixels(f, prepared);
        controls.stage("Confirmando arquivo");
        setFiles({ original: f, prepared });
        setUrl(URL.createObjectURL(prepared));
        setStatus(
          `Upload SIMULADO: ${uploadMs} ms · ${prepared.name} · ${prepared.type} · ${prepared.size} bytes. ${comparison}`
        );
      });
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Cancelado");
    }
  }
  async function pdf() {
    if (!files) return;
    setStatus("Gerando PDF local…");
    await generateQuestionPdf({
      questions: [
        question(URL.createObjectURL(files.original), "ORIGINAL"),
        question(URL.createObjectURL(files.prepared), "PREPARADA"),
      ],
      filterSummary: "Comparação sintética local",
    });
    setStatus("PDF local gerado; nenhum upload remoto.");
  }
  return (
    <main className="mx-auto max-w-5xl space-y-4 p-5">
      <h1 className="text-2xl font-bold">
        Teste local de imagens — sem Supabase
      </h1>
      <div className="flex flex-wrap gap-3">
        <button className="rounded border p-3" onClick={() => void run()}>
          Testar documento PNG
        </button>
        <button className="rounded border p-3" onClick={() => void run(true)}>
          Testar JPEG orientado
        </button>
        <button
          className="rounded border p-3"
          disabled={!files}
          onClick={() => void pdf()}
        >
          Exportar comparação PDF
        </button>
      </div>
      <label>
        <input
          type="checkbox"
          checked={fail}
          onChange={e => {
            setFail(e.target.checked);
            calls.current = 0;
          }}
        />{" "}
        Falhar primeiro envio (simulado)
      </label>
      <p role="status">{status}</p>
      {reviewUi}
      {url && <InteractiveQuiz questions={[question(url, "TESTE-LOCAL")]} />}
    </main>
  );
}
const root = createRoot(document.getElementById("root")!);
root.render(<Fixture />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
