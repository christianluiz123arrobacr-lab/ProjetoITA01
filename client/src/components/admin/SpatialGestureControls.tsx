import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import {
  Camera,
  CirclePlus,
  Hand,
  Maximize2,
  Rotate3D,
  ScanLine,
  Trash2,
  X,
} from "lucide-react";
import {
  GestureDwell,
  HAND_CONNECTIONS,
  mapCursor,
  type Point,
} from "@/lib/gestures/gestureEngine";
import {
  analyzeSpatialHand,
  depthWithDeadZone,
  normalizeAngleDelta,
  safeScaleFactor,
  unprojectScreenDelta,
  type SpatialHand,
  type Vec3,
} from "@/lib/gestures/spatialGestureEngine";
import {
  createHandTracker,
  type HandTracker,
} from "@/lib/gestures/handTracker";
import "./spatialGestureControls.css";

export type SpatialTarget = "outer" | "inner";
export type SpatialSolid =
  | "cube"
  | "box"
  | "regularPrism"
  | "pyramid"
  | "cylinder"
  | "cone"
  | "sphere";

type CameraState = "off" | "permission" | "loading" | "active" | "unavailable";
type Manipulation = "idle" | "captured" | "rotating" | "scaling";

type Props = {
  rootRef: RefObject<HTMLDivElement | null>;
  sceneRef: RefObject<HTMLDivElement | null>;
  selectedTarget: SpatialTarget;
  selectedLabel: string;
  rotationX: number;
  rotationY: number;
  canDeleteSelected: boolean;
  onSelectTarget(target: SpatialTarget): void;
  onMove(target: SpatialTarget, delta: Vec3): void;
  onRotate(target: SpatialTarget, delta: Vec3): void;
  onScale(target: SpatialTarget, factor: number): void;
  onCreateSolid(solid: SpatialSolid): void;
  onDeleteSelected(): void;
};

const TOOLS: Array<{ id: SpatialSolid; label: string }> = [
  { id: "cube", label: "Cubo" },
  { id: "box", label: "Paralelepípedo" },
  { id: "regularPrism", label: "Prisma" },
  { id: "pyramid", label: "Pirâmide" },
  { id: "cylinder", label: "Cilindro" },
  { id: "cone", label: "Cone" },
  { id: "sphere", label: "Esfera" },
];

const CONNECTIONS = HAND_CONNECTIONS as number[][];

function handDistance(a: SpatialHand, b: SpatialHand) {
  return Math.hypot(
    a.indexPinch.x - b.indexPinch.x,
    a.indexPinch.y - b.indexPinch.y
  );
}

export default function SpatialGestureControls({
  rootRef,
  sceneRef,
  selectedTarget,
  selectedLabel,
  rotationX,
  rotationY,
  canDeleteSelected,
  onSelectTarget,
  onMove,
  onRotate,
  onScale,
  onCreateSolid,
  onDeleteSelected,
}: Props) {
  const [camera, setCamera] = useState<CameraState>("off");
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [handsDetected, setHandsDetected] = useState(0);
  const [gestureLabel, setGestureLabel] = useState("Nenhum");
  const [manipulation, setManipulation] = useState<Manipulation>("idle");
  const [capturedTarget, setCapturedTarget] = useState<SpatialTarget | null>(
    null
  );
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);
  const [toolMenu, setToolMenu] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrated, setCalibrated] = useState(false);
  const [depthDirection, setDepthDirection] = useState("centro");
  const [feedback, setFeedback] = useState(
    "Ative a câmera quando quiser usar os gestos."
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackerRef = useRef<HandTracker | null>(null);
  const frameRef = useRef(0);
  const generationRef = useRef(0);
  const optionsRef = useRef({ gesturesEnabled, showSkeleton, toolMenu });
  const latestRef = useRef({
    rotationX,
    rotationY,
    onSelectTarget,
    onMove,
    onRotate,
    onScale,
    onCreateSolid,
  });
  const selectedRef = useRef(selectedTarget);
  const openDwellRef = useRef(new GestureDwell());
  const fistDwellRef = useRef(new GestureDwell());
  const actionDwellRef = useRef(new GestureDwell());
  const calibrationDwellRef = useRef(new GestureDwell());
  const manipulationRef = useRef<Manipulation>("idle");
  const captureTargetRef = useRef<SpatialTarget | null>(null);
  const smoothCursorRef = useRef<{ x: number; y: number } | null>(null);
  const smoothDepthRef = useRef<number | null>(null);
  const lastMoveRef = useRef<{ x: number; y: number; depth: number } | null>(
    null
  );
  const lastRotateRef = useRef<{ x: number; y: number; roll: number } | null>(
    null
  );
  const scaleRef = useRef<{ distance: number; since: number } | null>(null);
  const calibratedDepthRef = useRef<number | null>(null);
  const calibratingRef = useRef(false);
  const lastSeenRef = useRef(0);

  optionsRef.current = { gesturesEnabled, showSkeleton, toolMenu };
  latestRef.current = {
    rotationX,
    rotationY,
    onSelectTarget,
    onMove,
    onRotate,
    onScale,
    onCreateSolid,
  };
  selectedRef.current = selectedTarget;

  function hideCursor() {
    if (cursorRef.current) cursorRef.current.hidden = true;
  }

  function finishManipulation(message?: string) {
    manipulationRef.current = "idle";
    captureTargetRef.current = null;
    lastMoveRef.current = null;
    lastRotateRef.current = null;
    scaleRef.current = null;
    setManipulation("idle");
    setCapturedTarget(null);
    setDepthDirection("centro");
    if (message) setFeedback(message);
  }

  function clearRecognition() {
    openDwellRef.current.reset();
    fistDwellRef.current.reset();
    actionDwellRef.current.reset();
    calibrationDwellRef.current.reset();
    smoothCursorRef.current = null;
    smoothDepthRef.current = null;
    setHoveredTarget(null);
    hideCursor();
  }

  function releaseResources() {
    generationRef.current += 1;
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    trackerRef.current?.close();
    trackerRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    overlayRef.current?.getContext("2d")?.clearRect(0, 0, 640, 480);
    clearRecognition();
    finishManipulation();
  }

  function stopCamera() {
    releaseResources();
    setCamera("off");
    setHandsDetected(0);
    setGestureLabel("Nenhum");
    setCalibrating(false);
    calibratingRef.current = false;
    setFeedback("Câmera desligada. Mouse e teclado permanecem disponíveis.");
  }

  useEffect(() => {
    const onHidden = () => {
      if (document.hidden) stopCamera();
    };
    const onPageHide = () => releaseResources();
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      releaseResources();
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  useEffect(() => {
    if (!gesturesEnabled) {
      finishManipulation("Modo gestos desligado.");
      clearRecognition();
    }
  }, [gesturesEnabled]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root
      .querySelectorAll("[data-gesture-hover]")
      .forEach(element => element.removeAttribute("data-gesture-hover"));
    if (hoveredTarget === "outer" || hoveredTarget === "inner") {
      root
        .querySelector(`[data-spatial-object-target="${hoveredTarget}"]`)
        ?.setAttribute("data-gesture-hover", "true");
    }
  }, [hoveredTarget, rootRef]);

  function drawHands(allPoints: Point[][], analyzed: SpatialHand[]) {
    const context = overlayRef.current?.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, 640, 480);
    if (!optionsRef.current.showSkeleton) return;

    allPoints.forEach((points, handIndex) => {
      context.strokeStyle = handIndex === 0 ? "#67e8f9" : "#c4b5fd";
      context.fillStyle = "#f8fafc";
      context.lineWidth = 2;
      CONNECTIONS.forEach(chain => {
        context.beginPath();
        chain.forEach((index, pointIndex) => {
          const point = points[index];
          const x = (1 - point.x) * 640;
          const y = point.y * 480;
          if (pointIndex === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.stroke();
      });
      points.forEach(point => {
        context.beginPath();
        context.arc((1 - point.x) * 640, point.y * 480, 4, 0, Math.PI * 2);
        context.fill();
      });
      if (analyzed[handIndex]?.gesture.includes("Pinch")) {
        const finger = analyzed[handIndex].gesture === "middlePinch" ? 12 : 8;
        context.strokeStyle = "#34d399";
        context.lineWidth = 6;
        context.beginPath();
        context.moveTo((1 - points[4].x) * 640, points[4].y * 480);
        context.lineTo((1 - points[finger].x) * 640, points[finger].y * 480);
        context.stroke();
      }
    });
  }

  function targetAt(x: number, y: number) {
    const root = rootRef.current;
    if (!root) return null;
    // Center marks, measurement guides and labels are intentionally non-targets;
    // scan the hit stack until the underlying solid or approved control appears.
    const element = document
      .elementsFromPoint(x, y)
      .map(hit =>
        hit.closest<HTMLElement>(
          "[data-spatial-object-target],[data-spatial-gesture-action]"
        )
      )
      .find(candidate => candidate && root.contains(candidate));
    if (!element) return null;
    return (
      element.dataset.spatialObjectTarget ??
      (element.dataset.spatialGestureAction
        ? `action:${element.dataset.spatialGestureAction}`
        : null)
    );
  }

  function setCaptured(
    target: SpatialTarget,
    hand: SpatialHand,
    cursor: { x: number; y: number }
  ) {
    latestRef.current.onSelectTarget(target);
    captureTargetRef.current = target;
    manipulationRef.current = "captured";
    lastMoveRef.current = { x: cursor.x, y: cursor.y, depth: hand.depth };
    smoothDepthRef.current = hand.depth;
    setCapturedTarget(target);
    setManipulation("captured");
    setFeedback(
      `${target === "inner" ? "Sólido interno" : "Sólido externo"} capturado. Solte a pinça para finalizar.`
    );
  }

  function runAction(target: string) {
    const action = target.replace(/^action:/, "");
    if (action.startsWith("solid:")) {
      const solid = action.slice(6) as SpatialSolid;
      if (TOOLS.some(tool => tool.id === solid))
        latestRef.current.onCreateSolid(solid);
      setToolMenu(false);
      optionsRef.current.toolMenu = false;
      setFeedback("Sólido criado e selecionado.");
      return;
    }
    if (action === "close-tools") {
      setToolMenu(false);
      optionsRef.current.toolMenu = false;
      setFeedback("Menu de ferramentas fechado.");
      return;
    }
    const button = rootRef.current?.querySelector<HTMLButtonElement>(
      `[data-spatial-gesture-action="${CSS.escape(action)}"]`
    );
    button?.click();
  }

  function processGestures(hands: SpatialHand[], now: number) {
    const primary = hands[0];
    if (!primary) return;
    lastSeenRef.current = now;

    if (calibratingRef.current) {
      const ready = calibrationDwellRef.current.update(
        primary.gesture === "open" ? "open" : "none",
        primary.anchor,
        now,
        null
      );
      if (ready === "open") {
        calibratedDepthRef.current = primary.depth;
        setCalibrated(true);
        setCalibrating(false);
        calibratingRef.current = false;
        setFeedback(
          "Calibração concluída. Use sua posição confortável como referência."
        );
      }
      return;
    }

    const fist = fistDwellRef.current.update(
      primary.gesture === "fist" ? "fist" : "none",
      primary.anchor,
      now,
      null
    );
    if (fist === "fist") {
      if (manipulationRef.current !== "idle")
        finishManipulation("Manipulação cancelada pelo punho fechado.");
      else if (optionsRef.current.toolMenu) {
        setToolMenu(false);
        optionsRef.current.toolMenu = false;
        setFeedback("Menu de ferramentas fechado.");
      }
      return;
    }
    // Keep the current manipulation latched while the fist dwell is pending;
    // otherwise the ordinary pinch-release path would finish it too early.
    if (primary.gesture === "fist") return;

    if (
      hands.length === 2 &&
      hands.every(hand => hand.gesture === "indexPinch") &&
      manipulationRef.current !== "rotating"
    ) {
      const distance = handDistance(hands[0], hands[1]);
      const scaleState = scaleRef.current;
      if (!scaleState) scaleRef.current = { distance, since: now };
      else if (now - scaleState.since >= 250) {
        const factor = safeScaleFactor(distance, scaleState.distance);
        if (factor !== 1)
          latestRef.current.onScale(
            captureTargetRef.current ?? selectedRef.current,
            factor
          );
        scaleRef.current = { distance, since: scaleState.since };
        manipulationRef.current = "scaling";
        captureTargetRef.current =
          captureTargetRef.current ?? selectedRef.current;
        setCapturedTarget(captureTargetRef.current);
        setManipulation("scaling");
        setFeedback(
          "Escala com duas mãos: afaste para aumentar e aproxime para reduzir."
        );
      }
      return;
    }
    if (manipulationRef.current === "scaling")
      finishManipulation("Escala finalizada com segurança.");
    scaleRef.current = null;

    if (primary.gesture === "middlePinch") {
      const current = {
        x: primary.anchor.x,
        y: primary.anchor.y,
        roll: primary.roll,
      };
      if (manipulationRef.current !== "rotating") {
        const event = actionDwellRef.current.update(
          "pinch",
          primary.anchor,
          now,
          "rotate"
        );
        if (event === "pinch") {
          manipulationRef.current = "rotating";
          captureTargetRef.current = selectedRef.current;
          lastRotateRef.current = current;
          setCapturedTarget(selectedRef.current);
          setManipulation("rotating");
          setFeedback(
            "Rotação capturada. Gire o punho; feche a mão para cancelar."
          );
        }
      } else if (lastRotateRef.current) {
        const previous = lastRotateRef.current;
        const roll =
          normalizeAngleDelta(current.roll, previous.roll) * (180 / Math.PI);
        latestRef.current.onRotate(
          captureTargetRef.current ?? selectedRef.current,
          {
            x: (previous.y - current.y) * 90,
            y: (current.x - previous.x) * 90,
            z: roll * 0.65,
          }
        );
        lastRotateRef.current = current;
      }
      return;
    }
    if (manipulationRef.current === "rotating")
      finishManipulation("Rotação finalizada.");

    const mapped = mapCursor(
      primary.cursor,
      window.innerWidth,
      window.innerHeight
    );
    const previousCursor = smoothCursorRef.current ?? mapped;
    const cursor = {
      x: previousCursor.x + (mapped.x - previousCursor.x) * 0.28,
      y: previousCursor.y + (mapped.y - previousCursor.y) * 0.28,
    };
    smoothCursorRef.current = cursor;
    if (cursorRef.current) {
      cursorRef.current.hidden = false;
      cursorRef.current.style.transform = `translate3d(${cursor.x}px,${cursor.y}px,0)`;
      cursorRef.current.dataset.mode = manipulationRef.current;
    }

    const target = targetAt(cursor.x, cursor.y);
    setHoveredTarget(target);

    if (primary.gesture === "indexPinch") {
      if (manipulationRef.current === "captured" && lastMoveRef.current) {
        const rect = sceneRef.current?.getBoundingClientRect();
        const depth =
          smoothDepthRef.current === null
            ? primary.depth
            : smoothDepthRef.current +
              (primary.depth - smoothDepthRef.current) * 0.22;
        smoothDepthRef.current = depth;
        const previous = lastMoveRef.current;
        const svgScale = rect ? 980 / Math.max(rect.width, 1) : 1;
        const reference = calibratedDepthRef.current ?? previous.depth;
        const depthDelta = depthWithDeadZone(
          depth,
          previous.depth,
          0.0018,
          6 / Math.max(reference, 0.08)
        );
        const world = unprojectScreenDelta(
          (cursor.x - previous.x) * svgScale,
          (cursor.y - previous.y) * svgScale,
          depthDelta,
          latestRef.current.rotationX,
          latestRef.current.rotationY
        );
        const stable =
          Math.hypot(cursor.x - previous.x, cursor.y - previous.y) < 180;
        if (stable)
          latestRef.current.onMove(
            captureTargetRef.current ?? selectedRef.current,
            world
          );
        setDepthDirection(
          depthDelta > 0.02 ? "perto" : depthDelta < -0.02 ? "longe" : "centro"
        );
        lastMoveRef.current = { x: cursor.x, y: cursor.y, depth };
        return;
      }

      const event = actionDwellRef.current.update(
        "pinch",
        primary.anchor,
        now,
        target
      );
      if (event === "pinch" && target) {
        if (target === "outer" || target === "inner")
          setCaptured(target, primary, cursor);
        else runAction(target);
      }
      return;
    }

    if (manipulationRef.current === "captured")
      finishManipulation("Objeto solto na posição atual.");
    actionDwellRef.current.update("none", primary.anchor, now, null);

    const open = openDwellRef.current.update(
      primary.gesture === "open" ? "open" : "none",
      primary.anchor,
      now,
      null
    );
    if (open === "open" && !optionsRef.current.toolMenu) {
      setToolMenu(true);
      optionsRef.current.toolMenu = true;
      setFeedback("Menu geométrico aberto. Aponte e confirme com a pinça.");
    }
  }

  async function startCamera() {
    releaseResources();
    const generation = generationRef.current;
    setCamera("permission");
    setFeedback("Aguardando sua permissão. O microfone não será solicitado.");
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
      if (generation !== generationRef.current) {
        media.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = media;
      if (!videoRef.current) throw new Error("unmounted");
      videoRef.current.srcObject = media;
      await videoRef.current.play();
      setCamera("loading");
      setFeedback("Câmera ativa. Preparando rastreamento local de duas mãos…");
      const tracker = await createHandTracker({ numHands: 2 });
      if (generation !== generationRef.current) {
        tracker.close();
        return;
      }
      trackerRef.current = tracker;
      lastSeenRef.current = performance.now();
      setCamera("active");
      setFeedback(
        "Rastreamento pronto. Calibre a mão para melhorar a profundidade."
      );
      media.getVideoTracks()[0]?.addEventListener(
        "ended",
        () => {
          if (generation === generationRef.current) stopCamera();
        },
        { once: true }
      );

      let lastInference = 0;
      let lastVideoTime = -1;
      const tick = (now: number) => {
        if (generation !== generationRef.current || !videoRef.current) return;
        if (
          now - lastInference >= 66 &&
          videoRef.current.readyState >= 2 &&
          videoRef.current.currentTime !== lastVideoTime
        ) {
          lastInference = now;
          lastVideoTime = videoRef.current.currentTime;
          try {
            const result = tracker.detectForVideo(videoRef.current, now);
            const reliablePoints = result.landmarks.filter(
              (points, index) =>
                points.length === 21 &&
                (result.handedness[index]?.[0]?.score ?? 0) >= 0.75
            );
            const hands = reliablePoints
              .map(analyzeSpatialHand)
              .filter((hand): hand is SpatialHand => hand !== null);
            drawHands(reliablePoints, hands);
            setHandsDetected(hands.length);
            setGestureLabel(
              hands.length === 2 &&
                hands.every(hand => hand.gesture === "indexPinch")
                ? "Duas pinças"
                : hands[0]?.gesture === "indexPinch"
                  ? "Pinça indicador"
                  : hands[0]?.gesture === "middlePinch"
                    ? "Pinça dedo médio"
                    : hands[0]?.gesture === "open"
                      ? "Palma aberta"
                      : hands[0]?.gesture === "fist"
                        ? "Punho fechado"
                        : "Nenhum"
            );

            if (!hands.length) {
              if (now - lastSeenRef.current > 350) {
                if (manipulationRef.current !== "idle")
                  finishManipulation(
                    "Mão perdida: objeto solto sem aplicar saltos."
                  );
                clearRecognition();
              }
              if (now - lastSeenRef.current > 1200)
                setFeedback(
                  "Mão não encontrada. Melhore a iluminação e mantenha a mão inteira dentro do quadro."
                );
            } else if (optionsRef.current.gesturesEnabled)
              processGestures(hands, now);
            else hideCursor();
          } catch {
            releaseResources();
            setCamera("unavailable");
            setFeedback(
              "O rastreamento foi interrompido. A geometria continua disponível por mouse e teclado."
            );
            return;
          }
        }
        if (generation === generationRef.current)
          frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    } catch {
      if (generation !== generationRef.current) return;
      releaseResources();
      setCamera("unavailable");
      setFeedback(
        "Câmera indisponível. Confira a permissão e continue usando mouse e teclado."
      );
    }
  }

  const busy = camera === "permission" || camera === "loading";
  const status =
    camera === "permission"
      ? "Aguardando permissão"
      : camera === "loading"
        ? "Carregando rastreador"
        : camera === "active"
          ? "Câmera ativa"
          : camera === "unavailable"
            ? "Câmera indisponível"
            : "Câmera desligada";

  return (
    <>
      <section
        className="spatial-gesture-console"
        aria-label="Controle por gestos"
      >
        <div className="spatial-gesture-console__intro">
          <span>Experimental · Somente ADM</span>
          <strong>Processamento local da câmera</strong>
          <p>Nenhum vídeo, áudio ou ponto da mão é enviado ou gravado.</p>
        </div>
        <div className="spatial-gesture-console__buttons">
          <button
            type="button"
            onClick={() => void startCamera()}
            disabled={busy || camera === "active"}
          >
            <Camera size={16} /> Ativar câmera
          </button>
          <button
            type="button"
            onClick={stopCamera}
            disabled={camera === "off"}
          >
            <X size={16} /> Desativar
          </button>
          <button
            type="button"
            aria-pressed={gesturesEnabled}
            onClick={() => setGesturesEnabled(value => !value)}
          >
            <Hand size={16} /> Gestos:{" "}
            {gesturesEnabled ? "ativados" : "desativados"}
          </button>
          <button
            type="button"
            aria-pressed={showSkeleton}
            onClick={() => setShowSkeleton(value => !value)}
          >
            <ScanLine size={16} /> {showSkeleton ? "Ocultar" : "Mostrar"}{" "}
            esqueleto
          </button>
          <button
            type="button"
            disabled={camera !== "active"}
            onClick={() => {
              setCalibrating(true);
              calibratingRef.current = true;
              setFeedback(
                "Mantenha uma palma aberta e confortável por 1 segundo."
              );
              calibrationDwellRef.current.reset();
            }}
          >
            <Maximize2 size={16} /> Calibrar mão
          </button>
          <button
            type="button"
            aria-expanded={toolMenu}
            onClick={() => {
              setToolMenu(value => {
                optionsRef.current.toolMenu = !value;
                return !value;
              });
            }}
          >
            <CirclePlus size={16} /> Ferramentas
          </button>
          <button
            type="button"
            disabled={!canDeleteSelected}
            onClick={onDeleteSelected}
          >
            <Trash2 size={16} /> Remover interno
          </button>
        </div>
        <div className="spatial-gesture-console__status" aria-live="polite">
          <span>
            <i data-ok={camera === "active"} /> {status}
          </span>
          <span>
            {handsDetected} mão{handsDetected === 1 ? "" : "s"}
          </span>
          <span>Gesto: {gestureLabel}</span>
          <span>Objeto: {selectedLabel}</span>
          <span>
            Estado: {manipulation === "idle" ? "livre" : manipulation}
          </span>
          <span>
            Calibração:{" "}
            {calibrated ? "pronta" : calibrating ? "em andamento" : "pendente"}
          </span>
        </div>
        <p className="spatial-gesture-console__feedback">{feedback}</p>
      </section>

      {toolMenu && (
        <div
          className="spatial-tool-radial"
          role="group"
          aria-label="Ferramentas geométricas"
        >
          <span>
            <BoxIcon />
          </span>
          {TOOLS.map((tool, index) => (
            <button
              key={tool.id}
              type="button"
              data-spatial-gesture-action={`solid:${tool.id}`}
              data-highlight={hoveredTarget === `action:solid:${tool.id}`}
              style={{ "--tool-index": index } as CSSProperties}
              onClick={() => {
                onCreateSolid(tool.id);
                setToolMenu(false);
                optionsRef.current.toolMenu = false;
                setFeedback(`${tool.label} criado e selecionado.`);
              }}
            >
              {tool.label}
            </button>
          ))}
          <button
            type="button"
            className="spatial-tool-radial__close"
            data-spatial-gesture-action="close-tools"
            data-highlight={hoveredTarget === "action:close-tools"}
            onClick={() => {
              setToolMenu(false);
              optionsRef.current.toolMenu = false;
            }}
          >
            Fechar
          </button>
        </div>
      )}

      {manipulation === "rotating" && (
        <div className="spatial-rotation-guide" aria-hidden="true">
          <Rotate3D /> X · Y · Z
        </div>
      )}
      {manipulation === "captured" && (
        <div className="spatial-depth-guide">
          longe <b data-direction={depthDirection}>◆</b> perto
        </div>
      )}

      <aside
        className="spatial-webcam"
        data-active={camera === "active" || busy}
      >
        <div>
          <video ref={videoRef} autoPlay muted playsInline />
          <canvas
            ref={overlayRef}
            width={640}
            height={480}
            hidden={!showSkeleton}
          />
        </div>
        <p>
          {camera === "active"
            ? `${handsDetected} mão(s) · ${gestureLabel}`
            : status}
        </p>
      </aside>
      <div
        ref={cursorRef}
        className="spatial-air-cursor"
        hidden
        data-hover={Boolean(hoveredTarget)}
        aria-hidden="true"
      />
      {capturedTarget && (
        <span className="sr-only" aria-live="polite">
          Objeto {capturedTarget} capturado
        </span>
      )}
    </>
  );
}

function BoxIcon() {
  return <span aria-hidden="true">◇</span>;
}
