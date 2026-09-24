import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Camera,
  Hand,
  Box,
  X,
  Activity,
  Orbit,
  FlaskConical,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  classifyHand,
  GestureDwell,
  HAND_CONNECTIONS,
  mapCursor,
} from "@/lib/gestures/gestureEngine";
import {
  createHandTracker,
  type HandTracker,
} from "@/lib/gestures/handTracker";
import "./adminGestureLab.css";

const items = [
  { id: "spatial", label: "Geometria Espacial", icon: Box },
  { id: "functions", label: "Simulador de Funções", icon: Activity },
  { id: "3d", label: "Funções 3D", icon: Orbit },
  { id: "molecular", label: "Geometria Molecular", icon: FlaskConical },
  { id: "close", label: "Fechar menu", icon: X },
];
type CameraState = "off" | "permission" | "loading" | "active" | "unavailable";

// Mount camera lifecycle only after the existing server-backed admin guard.
export default function AdminGestureLabPage() {
  return (
    <AdminGuard allowedRoles={["admin"]}>
      <GestureLaboratory />
    </AdminGuard>
  );
}

export function GestureLaboratory() {
  const [, navigate] = useLocation();
  const [camera, setCamera] = useState<CameraState>("off");
  const [gestures, setGestures] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [detected, setDetected] = useState(false);
  const [menu, setMenu] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [feedback, setFeedback] = useState(
    "Abra a palma por 1 segundo para começar."
  );
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const confidence = useRef<HTMLOutputElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const menuElement = useRef<HTMLDivElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const tracker = useRef<HandTracker | null>(null);
  const frame = useRef(0);
  const generation = useRef(0);
  const dwell = useRef(new GestureDwell());
  const smooth = useRef<{ x: number; y: number } | null>(null);
  const options = useRef({ gestures, tracking, menu });
  options.current = { gestures, tracking, menu };
  const actions = useRef<(id: string) => void>(() => {});

  function release() {
    generation.current++;
    cancelAnimationFrame(frame.current);
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
    tracker.current?.close();
    tracker.current = null;
    if (video.current) video.current.srcObject = null;
    canvas.current?.getContext("2d")?.clearRect(0, 0, 640, 480);
    if (cursor.current) cursor.current.hidden = true;
    dwell.current.reset();
    smooth.current = null;
  }
  function stop() {
    release();
    setCamera("off");
    setDetected(false);
    setHover(null);
  }
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) stop();
    };
    const unload = () => release();
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", unload);
    return () => {
      release();
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", unload);
    };
  }, []);
  useEffect(() => {
    if (menu) {
      menuElement.current?.scrollIntoView({ block: "center" });
      menuElement.current
        ?.querySelector<HTMLButtonElement>("button")
        ?.focus({ preventScroll: true });
    } else opener.current?.focus({ preventScroll: true });
  }, [menu]);

  function closeMenu() {
    options.current.menu = false;
    setMenu(false);
    setHover(null);
    dwell.current.reset();
    opener.current?.focus({ preventScroll: true });
  }
  actions.current = (id: string) => {
    if (id === "spatial") {
      release();
      navigate("/admin/matematica/geometria-espacial");
    } else if (id === "close") closeMenu();
    else setFeedback("Este módulo entrará nas próximas demonstrações.");
  };

  async function start() {
    release();
    const run = generation.current;
    setCamera("permission");
    setFeedback(
      "Autorize a câmera no navegador. Nenhum áudio será solicitado."
    );
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
        throw new Error("unsupported");
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });
      if (run !== generation.current) {
        media.getTracks().forEach(track => track.stop());
        return;
      }
      stream.current = media;
      const element = video.current;
      if (!element) throw new Error("unmounted");
      element.srcObject = media;
      await element.play();
      if (run !== generation.current) return;
      setCamera("loading");
      setFeedback("Câmera ativa. Preparando rastreamento local…");
      const model = await createHandTracker();
      if (run !== generation.current) {
        model.close();
        return;
      }
      tracker.current = model;
      setCamera("active");
      setFeedback("Palma aberta: abrir • Pinça: selecionar • Punho: fechar");
      media.getVideoTracks()[0].addEventListener(
        "ended",
        () => {
          if (run === generation.current) stop();
        },
        { once: true }
      );
      let last = 0,
        lastVideo = -1;
      const tick = (now: number) => {
        if (run !== generation.current) return;
        // Maximum 15 inferences/s, never overlapping or repeating video frames.
        if (
          now - last >= 66 &&
          element.readyState >= 2 &&
          element.currentTime !== lastVideo
        ) {
          last = now;
          lastVideo = element.currentTime;
          try {
            const result = model.detectForVideo(element, now);
            const points = result.landmarks[0];
            const score = result.handedness[0]?.[0]?.score ?? 0;
            const reliable = points?.length === 21 && score >= 0.75;
            setDetected(Boolean(reliable));
            const ctx = canvas.current?.getContext("2d");
            ctx?.clearRect(0, 0, 640, 480);
            if (confidence.current)
              confidence.current.value = reliable
                ? `Confiança lateralidade: ${Math.round(score * 100)}% · detecção ≥75%`
                : "Sem mão confiável";
            if (!reliable) {
              dwell.current.reset();
              smooth.current = null;
              setHover(null);
              if (cursor.current) cursor.current.hidden = true;
            } else {
              const gesture = classifyHand(points);
              if (options.current.tracking && ctx) {
                ctx.strokeStyle = "#67e8f9";
                ctx.lineWidth = 2;
                HAND_CONNECTIONS.forEach(chain => {
                  ctx.beginPath();
                  chain.forEach((index, i) => {
                    const p = points[index];
                    if (i === 0) ctx.moveTo((1 - p.x) * 640, p.y * 480);
                    else ctx.lineTo((1 - p.x) * 640, p.y * 480);
                  });
                  ctx.stroke();
                });
                points.forEach(p => {
                  ctx.beginPath();
                  ctx.arc((1 - p.x) * 640, p.y * 480, 4, 0, Math.PI * 2);
                  ctx.fillStyle = "#e2e8f0";
                  ctx.fill();
                });
                if (gesture === "pinch") {
                  ctx.strokeStyle = "#34d399";
                  ctx.lineWidth = 6;
                  ctx.beginPath();
                  ctx.moveTo((1 - points[4].x) * 640, points[4].y * 480);
                  ctx.lineTo((1 - points[8].x) * 640, points[8].y * 480);
                  ctx.stroke();
                }
              }
              if (options.current.gestures) {
                const mapped = mapCursor(
                  points[8],
                  window.innerWidth,
                  window.innerHeight
                );
                const prev = smooth.current ?? mapped;
                const next = {
                  x: prev.x + (mapped.x - prev.x) * 0.3,
                  y: prev.y + (mapped.y - prev.y) * 0.3,
                };
                smooth.current = next;
                if (cursor.current) {
                  cursor.current.hidden = false;
                  cursor.current.style.transform = `translate3d(${next.x}px,${next.y}px,0)`;
                  cursor.current.dataset.pinch = String(gesture === "pinch");
                }
                const target =
                  document
                    .elementFromPoint(next.x, next.y)
                    ?.closest<HTMLElement>("[data-gesture-item]")?.dataset
                    .gestureItem ?? null;
                setHover(target);
                const event = dwell.current.update(
                  gesture,
                  points[9],
                  now,
                  target
                );
                if (event === "open" && !options.current.menu) {
                  options.current.menu = true;
                  setMenu(true);
                  setFeedback(
                    "Menu aberto. Aponte e mantenha a pinça por um instante."
                  );
                }
                if (event === "fist") {
                  options.current.menu = false;
                  setMenu(false);
                  setHover(null);
                  setFeedback("Interação cancelada.");
                  opener.current?.focus({ preventScroll: true });
                }
                if (event === "pinch" && options.current.menu && target)
                  actions.current(target);
              }
            }
          } catch {
            release();
            setCamera("unavailable");
            setDetected(false);
            setFeedback(
              "Não foi possível manter o rastreamento. Use os controles ou tente ativar a câmera novamente."
            );
            return;
          }
        }
        if (run === generation.current)
          frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    } catch {
      if (run !== generation.current) return;
      release();
      setCamera("unavailable");
      setDetected(false);
      setFeedback(
        "Câmera ou rastreamento indisponível. Confira a permissão, feche outros aplicativos de câmera e tente novamente. Mouse e teclado continuam disponíveis."
      );
    }
  }

  const busy = camera === "permission" || camera === "loading";
  const button = "gesture-button";
  return (
    <AdminLayout
      title="Laboratório de Gestos"
      subtitle="Controle simuladores com a câmera e movimentos da mão."
    >
      <div
        className="gesture-lab"
        onKeyDown={event => {
          if (event.key === "Escape") closeMenu();
        }}
      >
        <div className="gesture-lab-heading">
          <Hand size={28} />
          <div>
            <span className="gesture-eyebrow">
              PROJETO VETOR · EXPERIMENTAL
            </span>
            <h2>Seu próximo movimento.</h2>
          </div>
        </div>
        <p>Demonstração experimental — processamento local na sua câmera</p>
        <div className="gesture-controls">
          <button
            className={button}
            disabled={busy || camera === "active"}
            onClick={() => void start()}
          >
            <Camera size={16} /> Ativar câmera
          </button>
          <button className={button} disabled={camera === "off"} onClick={stop}>
            Desativar câmera
          </button>
          <button
            className={button}
            aria-pressed={gestures}
            onClick={() => {
              options.current.gestures = !gestures;
              setGestures(!gestures);
              dwell.current.reset();
              setHover(null);
              if (cursor.current) cursor.current.hidden = true;
            }}
          >
            Modo gestos: {gestures ? "desativar" : "ativar"}
          </button>
          <label className={button}>
            <input
              type="checkbox"
              checked={tracking}
              onChange={event => {
                options.current.tracking = event.target.checked;
                setTracking(event.target.checked);
                canvas.current?.getContext("2d")?.clearRect(0, 0, 640, 480);
              }}
            />{" "}
            Mostrar rastreamento da mão
          </label>
        </div>
        <p role="status" className="gesture-status">
          {camera === "permission"
            ? "Aguardando permissão"
            : camera === "loading"
              ? "Câmera ativa · carregando rastreamento"
              : camera === "unavailable"
                ? "Câmera indisponível"
                : camera === "active"
                  ? "Câmera ativa"
                  : "Câmera desligada"}{" "}
          ·{" "}
          {!gestures
            ? "Modo gestos desligado"
            : detected
              ? "Mão detectada"
              : "Rastreamento não encontrado"}
        </p>
        <div className="gesture-stage">
          <div className="gesture-intro" hidden={menu}>
            <div className="gesture-orb">
              <Hand size={48} />
            </div>
            <h3>Explore com as mãos</h3>
            <p>Mostre a palma inteira e mantenha-a estável por 1 segundo.</p>
            <button
              ref={opener}
              className={button}
              aria-expanded={menu}
              onClick={() => {
                setMenu(true);
                options.current.menu = true;
                setFeedback(
                  "Menu aberto. Use mouse, teclado ou aponte e mantenha a pinça."
                );
              }}
            >
              Abrir menu radial
            </button>
          </div>
          {menu && (
            <div
              ref={menuElement}
              className="gesture-radial"
              role="group"
              aria-label="Menu radial de simuladores"
            >
              <span className="gesture-radial-center" aria-hidden="true">
                VETOR
                <br />
                GESTOS
              </span>
              {items.map((item, index) => (
                <button
                  key={item.id}
                  data-gesture-item={item.id}
                  data-highlight={hover === item.id}
                  className={`gesture-option gesture-option-${index}`}
                  onClick={() => actions.current(item.id)}
                >
                  <item.icon size={24} />
                  <span>{item.label}</span>
                  {item.id !== "spatial" && item.id !== "close" && (
                    <small>Em breve</small>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="gesture-feedback" aria-live="polite">
          {feedback}
        </p>
        <div className="gesture-instructions">
          <span>01 · Palma aberta: menu</span>
          <span>02 · Indicador: cursor</span>
          <span>03 · Pinça por 300 ms: selecionar</span>
          <span>04 · Punho por 1 s: cancelar</span>
        </div>
        <p className="gesture-privacy">
          Uma mão por vez, bem iluminada e de frente para a câmera. Nenhuma
          imagem ou ponto da mão é enviado ao servidor. Biblioteca e modelo são
          baixados ao ativar. O simulador abre nesta aba e a câmera é desligada.
        </p>
        <div
          className="gesture-camera"
          data-active={camera !== "off" && camera !== "unavailable"}
        >
          <div className="gesture-video">
            <video ref={video} autoPlay muted playsInline />
            <canvas ref={canvas} width={640} height={480} hidden={!tracking} />
          </div>
          <output ref={confidence} hidden={!tracking}>
            Sem mão confiável
          </output>
          <span>
            Prévia local · câmera {camera === "active" ? "ativa" : "desligada"}
          </span>
        </div>
        <div
          ref={cursor}
          className="gesture-cursor"
          hidden
          aria-hidden="true"
        />
      </div>
    </AdminLayout>
  );
}
