import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  Camera,
  CameraOff,
  Crosshair,
  Eye,
  EyeOff,
  GripHorizontal,
  Hand,
  HelpCircle,
  RotateCcw,
  Settings2,
  Shapes,
  X,
} from "lucide-react";
import { HAND_CONNECTIONS, mapCursor, type Point } from "@/lib/gestures/gestureEngine";
import { createHandTracker, type HandTracker } from "@/lib/gestures/handTracker";
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
  INITIAL_SPATIAL_INTERACTION,
  StablePoseGate,
  isMenuState,
  isTransformState,
  transitionSpatialInteraction,
  type SpatialInteractionContext,
  type SpatialInteractionEvent,
  type SpatialInteractionState,
} from "@/lib/gestures/spatialInteractionMachine";
import "./spatialGestureWorkspace.css";

export type GestureMenuAction =
  | `create:${string}`
  | `view:${string}`
  | `toggle:${string}`
  | `scene:${string}`
  | `tool:${string}`
  | `transform:${string}`;

export type GesturePreferences = {
  rotationPinch: "pinky" | "middle";
  sensitivity: number;
  smoothing: number;
  deadZone: number;
  menuDwellMs: number;
  showSkeleton: boolean;
};

type CameraState = "off" | "permission" | "loading" | "active" | "unavailable";
type MenuSection = "root" | "create" | "transform" | "geometry" | "view" | "measure" | "scene";

type Props = {
  sceneRef: RefObject<HTMLDivElement | null>;
  selectedObjectId: string | null;
  selectedLabel: string;
  rotationX: number;
  rotationY: number;
  canUndo: boolean;
  canRedo: boolean;
  snapEnabled: boolean;
  onSelectObject(id: string): void;
  onMove(id: string, delta: Vec3): void;
  onRotate(id: string, delta: Vec3): void;
  onScale(id: string, factor: number): void;
  onMenuAction(action: GestureMenuAction): { selectedObjectId?: string | null; message?: string } | void;
  onResetScene(): void;
  onInteractionChange(state: SpatialInteractionState): void;
};

const STORAGE_KEY = "projeto-vetor:admin-spatial-gesture-preferences:v2";
const DEFAULT_PREFERENCES: GesturePreferences = {
  rotationPinch: "pinky",
  sensitivity: 1,
  smoothing: 0.34,
  deadZone: 0.014,
  menuDwellMs: 850,
  showSkeleton: false,
};

const MENU_SECTIONS: Array<{ id: MenuSection; label: string }> = [
  { id: "create", label: "Criar" },
  { id: "transform", label: "Transformar" },
  { id: "geometry", label: "Geometria" },
  { id: "view", label: "Visualizar" },
  { id: "measure", label: "Medir" },
  { id: "scene", label: "Cena" },
];

const SECTION_ACTIONS: Record<Exclude<MenuSection, "root">, Array<{ id: GestureMenuAction; label: string }>> = {
  create: [
    { id: "create:cube", label: "Cubo" },
    { id: "create:box", label: "Paralelepípedo" },
    { id: "create:regularPrism", label: "Prisma regular" },
    { id: "create:pyramid", label: "Pirâmide" },
    { id: "create:cylinder", label: "Cilindro" },
    { id: "create:cone", label: "Cone" },
    { id: "create:sphere", label: "Esfera" },
  ],
  transform: [
    { id: "transform:move", label: "Mover" },
    { id: "transform:rotate", label: "Rotacionar" },
    { id: "transform:scale", label: "Escalar" },
    { id: "tool:properties", label: "Propriedades" },
  ],
  geometry: [
    { id: "scene:inscribed-cube-sphere", label: "Esfera no cubo" },
    { id: "scene:inscribed-cylinder-cone", label: "Cone no cilindro" },
    { id: "tool:dimensions", label: "Dimensões" },
    { id: "tool:cuts", label: "Cortes" },
    { id: "toggle:net", label: "Planificação" },
  ],
  view: [
    { id: "toggle:axes", label: "Eixos" },
    { id: "toggle:grid", label: "Grade" },
    { id: "toggle:center", label: "Centros" },
    { id: "toggle:faces", label: "Faces" },
    { id: "view:iso", label: "Isométrica" },
    { id: "view:front", label: "Frontal" },
    { id: "view:top", label: "Superior" },
    { id: "toggle:auto-rotate", label: "Rotação automática" },
    { id: "toggle:fullscreen", label: "Tela cheia" },
  ],
  measure: [
    { id: "tool:measure", label: "Medir centros" },
    { id: "tool:formulas", label: "Fórmulas" },
    { id: "tool:metrics", label: "Áreas e volumes" },
    { id: "tool:cuts", label: "Cortes" },
  ],
  scene: [
    { id: "scene:undo", label: "Desfazer" },
    { id: "scene:redo", label: "Refazer" },
    { id: "scene:duplicate", label: "Duplicar" },
    { id: "scene:delete", label: "Excluir" },
    { id: "scene:clear", label: "Limpar" },
    { id: "toggle:snap", label: "Encaixe magnético" },
  ],
};

const CONNECTIONS = HAND_CONNECTIONS as number[][];

function loadPreferences(): GesturePreferences {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<GesturePreferences>;
    return {
      rotationPinch: parsed.rotationPinch === "middle" ? "middle" : "pinky",
      sensitivity: Math.max(0.75, Math.min(1.35, Number(parsed.sensitivity) || 1)),
      smoothing: Math.max(0.12, Math.min(0.68, Number(parsed.smoothing) || 0.34)),
      deadZone: Math.max(0.006, Math.min(0.035, Number(parsed.deadZone) || 0.014)),
      menuDwellMs: Math.max(550, Math.min(1500, Number(parsed.menuDwellMs) || 850)),
      showSkeleton: Boolean(parsed.showSkeleton),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function handDistance(a: SpatialHand, b: SpatialHand) {
  return Math.hypot(a.indexPinch.x - b.indexPinch.x, a.indexPinch.y - b.indexPinch.y);
}

function gestureText(gesture: SpatialHand["gesture"], rotationPinch: GesturePreferences["rotationPinch"]) {
  if (gesture === "open") return "Palma aberta";
  if (gesture === "indexPinch") return "Pinça de seleção";
  if (gesture === "pinkyPinch") return rotationPinch === "pinky" ? "Pinça de rotação" : "Polegar + mindinho";
  if (gesture === "middlePinch") return rotationPinch === "middle" ? "Pinça de rotação" : "Polegar + médio";
  if (gesture === "fist") return "Punho fechado";
  return "Mão detectada";
}

export default function SpatialGestureWorkspaceControls(props: Props) {
  const [camera, setCamera] = useState<CameraState>("off");
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const [cameraVisible, setCameraVisible] = useState(true);
  const [preferences, setPreferences] = useState(loadPreferences);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [handsDetected, setHandsDetected] = useState(0);
  const [gestureLabel, setGestureLabel] = useState("Nenhum");
  const [feedback, setFeedback] = useState("Câmera desligada. Mouse e teclado estão disponíveis.");
  const [calibrating, setCalibrating] = useState(false);
  const [calibrated, setCalibrated] = useState(false);
  const [depthDirection, setDepthDirection] = useState("centro");
  const [menuSection, setMenuSection] = useState<MenuSection>("root");
  const [menuPosition, setMenuPosition] = useState({ x: 0.5, y: 0.48 });
  const [hoveredMenuAction, setHoveredMenuAction] = useState<string | null>(null);
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<SpatialInteractionContext>({
    ...INITIAL_SPATIAL_INTERACTION,
    selectedObjectId: props.selectedObjectId,
    state: props.selectedObjectId ? "object_selected" : "idle",
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackerRef = useRef<HandTracker | null>(null);
  const frameRef = useRef(0);
  const generationRef = useRef(0);
  const lastInferenceRef = useRef(0);
  const interactionRef = useRef(interaction);
  const preferencesRef = useRef(preferences);
  const gesturesEnabledRef = useRef(gesturesEnabled);
  const calibratingRef = useRef(calibrating);
  const latestRef = useRef(props);
  const smoothedCursorRef = useRef<{ x: number; y: number } | null>(null);
  const previousHandRef = useRef<SpatialHand | null>(null);
  const previousRollRef = useRef<number | null>(null);
  const previousScaleRef = useRef<number | null>(null);
  const depthReferenceRef = useRef<number | null>(null);
  const menuDragOffsetRef = useRef({ x: 0, y: 0 });
  const lostSinceRef = useRef<number | null>(null);
  const releasedFramesRef = useRef(0);
  const openGateRef = useRef(new StablePoseGate());
  const actionGateRef = useRef(new StablePoseGate());
  const rotateGateRef = useRef(new StablePoseGate());
  const scaleGateRef = useRef(new StablePoseGate());
  const fistGateRef = useRef(new StablePoseGate());
  const calibrationGateRef = useRef(new StablePoseGate());

  latestRef.current = props;
  interactionRef.current = interaction;
  preferencesRef.current = preferences;
  gesturesEnabledRef.current = gesturesEnabled;
  calibratingRef.current = calibrating;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if (isMenuState(interactionRef.current.state) || isTransformState(interactionRef.current.state)) return;
    const next: SpatialInteractionContext = {
      ...interactionRef.current,
      selectedObjectId: props.selectedObjectId,
      activeObjectId: null,
      state: props.selectedObjectId ? "object_selected" : "idle",
    };
    interactionRef.current = next;
    setInteraction(next);
  }, [props.selectedObjectId]);

  function dispatch(event: SpatialInteractionEvent) {
    const next = transitionSpatialInteraction(interactionRef.current, event);
    if (next === interactionRef.current) return next;
    interactionRef.current = next;
    setInteraction(next);
    latestRef.current.onInteractionChange(next.state);
    return next;
  }

  function clearGestureReferences() {
    previousHandRef.current = null;
    previousRollRef.current = null;
    previousScaleRef.current = null;
    smoothedCursorRef.current = null;
    releasedFramesRef.current = 0;
    openGateRef.current.reset();
    actionGateRef.current.reset();
    rotateGateRef.current.reset();
    scaleGateRef.current.reset();
    fistGateRef.current.reset();
  }

  function stopCamera(message = "Câmera desligada. Mouse e teclado continuam disponíveis.") {
    generationRef.current += 1;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    trackerRef.current?.close();
    trackerRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    const canvas = overlayRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    dispatch({ type: "TRACKING_LOST" });
    dispatch({ type: "GESTURES_RELEASED" });
    clearGestureReferences();
    setHandsDetected(0);
    setGestureLabel("Nenhum");
    setCamera("off");
    setFeedback(message);
  }

  useEffect(() => {
    const handlePageHide = () => stopCamera("Câmera encerrada ao sair da página.");
    const handleVisibility = () => {
      if (document.hidden && streamRef.current) stopCamera("Câmera pausada porque a página foi ocultada.");
    };
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibility);
      stopCamera();
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isMenuState(interactionRef.current.state)) {
        setMenuSection("root");
        dispatch({ type: "CLOSE_MENU" });
        setFeedback("Menu fechado. Solte a mão para voltar à cena.");
      } else if (isTransformState(interactionRef.current.state)) {
        dispatch({ type: "CANCEL" });
        setFeedback("Transformação cancelada.");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function drawHands(points: Point[][], width: number, height: number) {
    const canvas = overlayRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, width, height);
    if (!preferencesRef.current.showSkeleton) return;
    context.lineWidth = 2;
    context.strokeStyle = "#67e8f9";
    context.fillStyle = "#f8fafc";
    points.forEach(hand => {
      CONNECTIONS.forEach(chain => {
        context.beginPath();
        chain.forEach((index, position) => {
          const point = hand[index];
          const x = (1 - point.x) * width;
          const y = point.y * height;
          if (position === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.stroke();
      });
      hand.forEach((point, index) => {
        context.beginPath();
        context.arc((1 - point.x) * width, point.y * height, index === 4 || index === 8 ? 4 : 2.5, 0, Math.PI * 2);
        context.fill();
      });
    });
  }

  function pointerTarget(x: number, y: number) {
    const state = interactionRef.current.state;
    const elements = document.elementsFromPoint(x, y);
    if (isMenuState(state)) {
      const menu = menuRef.current;
      if (!menu) return null;
      for (const element of elements) {
        const target = element.closest<HTMLElement>("[data-gesture-menu-action],[data-gesture-menu-drag]");
        if (target && menu.contains(target)) return target;
      }
      return null;
    }
    const scene = latestRef.current.sceneRef.current;
    if (!scene) return null;
    for (const element of elements) {
      const target = element.closest<HTMLElement>("[data-spatial-object-id]");
      if (target && scene.contains(target)) return target;
    }
    return null;
  }

  function closeMenu(message: string, gestureDriven = true) {
    setMenuSection("root");
    setHoveredMenuAction(null);
    dispatch({ type: "CLOSE_MENU" });
    if (!gestureDriven) dispatch({ type: "GESTURES_RELEASED" });
    setFeedback(message);
  }

  function performMenuAction(action: string, gestureDriven = true) {
    if (action.startsWith("section:")) {
      setMenuSection(action.slice(8) as MenuSection);
      setFeedback(`${action.slice(8)}: escolha uma ferramenta.`);
      actionGateRef.current.reset(performance.now() + 250);
      return;
    }
    if (action === "menu:back") {
      setMenuSection("root");
      actionGateRef.current.reset(performance.now() + 250);
      return;
    }
    if (action === "menu:center") {
      setMenuPosition({ x: 0.5, y: 0.48 });
      setFeedback("Menu reposicionado.");
      actionGateRef.current.reset(performance.now() + 350);
      return;
    }
    if (action === "menu:close") {
      closeMenu(gestureDriven ? "Menu fechado. Solte a pinça para voltar à cena." : "Menu fechado.", gestureDriven);
      return;
    }
    const result = latestRef.current.onMenuAction(action as GestureMenuAction);
    const selectedObjectId = result?.selectedObjectId;
    setMenuSection("root");
    setHoveredMenuAction(null);
    dispatch({ type: "MENU_ACTION_COMPLETE", selectedObjectId });
    if (!gestureDriven) dispatch({ type: "GESTURES_RELEASED" });
    setFeedback(result?.message ?? "Ação aplicada. Solte a pinça para voltar à cena.");
  }

  function openMenuWithControls() {
    if (interactionRef.current.state === "cancelled") dispatch({ type: "GESTURES_RELEASED" });
    const next = dispatch({ type: "OPEN_MENU" });
    if (isMenuState(next.state)) {
      setMenuSection("root");
      setFeedback("Menu aberto. Enquanto ele estiver visível, a cena fica bloqueada.");
    }
  }

  function processTrackedHands(hands: SpatialHand[], now: number) {
    const primary = hands[0];
    const settings = preferencesRef.current;
    const rawCursor = mapCursor(primary.cursor, window.innerWidth, window.innerHeight);
    const previousCursor = smoothedCursorRef.current ?? rawCursor;
    const adaptive = Math.min(0.72, settings.smoothing + Math.hypot(rawCursor.x - previousCursor.x, rawCursor.y - previousCursor.y) / 900);
    const cursor = {
      x: previousCursor.x + (rawCursor.x - previousCursor.x) * adaptive,
      y: previousCursor.y + (rawCursor.y - previousCursor.y) * adaptive,
    };
    smoothedCursorRef.current = cursor;
    if (cursorRef.current) {
      cursorRef.current.hidden = false;
      cursorRef.current.style.transform = `translate3d(${cursor.x}px, ${cursor.y}px, 0)`;
    }
    const target = pointerTarget(cursor.x, cursor.y);
    const menuAction = target?.dataset.gestureMenuAction ?? null;
    const objectId = target?.dataset.spatialObjectId ?? null;
    setHoveredMenuAction(menuAction ?? (target?.hasAttribute("data-gesture-menu-drag") ? "menu:drag" : null));
    setHoveredObjectId(objectId);
    setGestureLabel(gestureText(primary.gesture, settings.rotationPinch));
    lostSinceRef.current = null;

    const fistFired = fistGateRef.current.update({
      key: primary.gesture === "fist" ? "fist" : null,
      x: primary.anchor.x,
      y: primary.anchor.y,
      now,
      durationMs: 700,
      stability: 0.07,
    });
    if (fistFired) {
      const wasMenuOpen = isMenuState(interactionRef.current.state);
      setMenuSection("root");
      dispatch({ type: "CANCEL" });
      setFeedback(wasMenuOpen ? "Menu fechado pelo punho." : "Interação cancelada pelo punho.");
      clearGestureReferences();
      return;
    }

    const activeState = interactionRef.current.state;
    const pinchesActive = hands.some(hand => hand.gesture === "indexPinch" || hand.gesture === "middlePinch" || hand.gesture === "pinkyPinch");
    if (activeState === "cancelled") {
      releasedFramesRef.current = pinchesActive || primary.gesture === "fist" || primary.gesture === "open" ? 0 : releasedFramesRef.current + 1;
      if (releasedFramesRef.current >= 4) {
        dispatch({ type: "GESTURES_RELEASED" });
        setFeedback("Controle devolvido à cena.");
      }
      return;
    }

    if (activeState === "menu_dragging") {
      if (primary.gesture !== "indexPinch") {
        dispatch({ type: "END_MENU_DRAG" });
        actionGateRef.current.reset(now + 300);
        setFeedback("Menu fixado na nova posição.");
        return;
      }
      const next = {
        x: Math.max(0.18, Math.min(0.82, (cursor.x - menuDragOffsetRef.current.x) / window.innerWidth)),
        y: Math.max(0.2, Math.min(0.78, (cursor.y - menuDragOffsetRef.current.y) / window.innerHeight)),
      };
      setMenuPosition(current => ({ x: current.x + (next.x - current.x) * 0.42, y: current.y + (next.y - current.y) * 0.42 }));
      setFeedback("Movendo menu… solte a pinça para fixar.");
      return;
    }

    if (activeState === "menu_open") {
      // Absolute priority: while the menu is open no scene branch below runs.
      if (primary.gesture !== "indexPinch") {
        actionGateRef.current.update({ key: null, x: primary.anchor.x, y: primary.anchor.y, now, durationMs: 0, stability: 0 });
        return;
      }
      const targetKey = target?.hasAttribute("data-gesture-menu-drag") ? "menu:drag" : menuAction;
      const confirmed = actionGateRef.current.update({
        key: targetKey,
        x: primary.indexPinch.x,
        y: primary.indexPinch.y,
        now,
        durationMs: 260,
        stability: 0.045,
      });
      if (!confirmed || !targetKey) return;
      if (targetKey === "menu:drag") {
        const rect = menuRef.current?.getBoundingClientRect();
        menuDragOffsetRef.current = {
          x: rect ? cursor.x - rect.left - rect.width / 2 : 0,
          y: rect ? cursor.y - rect.top - rect.height / 2 : 0,
        };
        dispatch({ type: "START_MENU_DRAG" });
        setFeedback("Menu capturado.");
      } else performMenuAction(targetKey);
      return;
    }

    if (activeState === "object_scaling") {
      if (hands.length < 2 || hands[0].gesture !== "indexPinch" || hands[1].gesture !== "indexPinch") {
        dispatch({ type: "END_TRANSFORM" });
        previousScaleRef.current = null;
        setFeedback("Escala finalizada.");
        return;
      }
      const distance = handDistance(hands[0], hands[1]);
      if (previousScaleRef.current !== null && interactionRef.current.activeObjectId) {
        latestRef.current.onScale(interactionRef.current.activeObjectId, safeScaleFactor(distance, previousScaleRef.current));
      }
      previousScaleRef.current = distance;
      return;
    }

    const rotationGesture = settings.rotationPinch === "pinky" ? "pinkyPinch" : "middlePinch";
    if (activeState === "object_rotating") {
      if (primary.gesture !== rotationGesture) {
        dispatch({ type: "END_TRANSFORM" });
        previousRollRef.current = null;
        previousHandRef.current = null;
        setFeedback("Rotação finalizada.");
        return;
      }
      const previous = previousHandRef.current;
      const previousRoll = previousRollRef.current;
      const activeId = interactionRef.current.activeObjectId;
      if (previous && previousRoll !== null && activeId) {
        const rollDelta = normalizeAngleDelta(primary.roll, previousRoll);
        const dx = primary.anchor.x - previous.anchor.x;
        const dy = primary.anchor.y - previous.anchor.y;
        const dead = settings.deadZone * 0.8;
        latestRef.current.onRotate(activeId, {
          x: Math.abs(dy) > dead ? -dy * 150 * settings.sensitivity : 0,
          y: Math.abs(dx) > dead ? dx * 150 * settings.sensitivity : 0,
          z: Math.abs(rollDelta) > 0.018 ? (rollDelta * 180) / Math.PI : 0,
        });
      }
      previousHandRef.current = primary;
      previousRollRef.current = primary.roll;
      setFeedback("Rotação ativa");
      return;
    }

    if (activeState === "object_dragging") {
      if (primary.gesture !== "indexPinch") {
        dispatch({ type: "END_TRANSFORM" });
        previousHandRef.current = null;
        depthReferenceRef.current = primary.depth;
        setDepthDirection("centro");
        setFeedback("Objeto fixado na posição final.");
        return;
      }
      const previous = previousHandRef.current;
      const activeId = interactionRef.current.activeObjectId;
      if (previous && activeId) {
        const dx = (previous.cursor.x - primary.cursor.x) * window.innerWidth;
        const dy = (primary.cursor.y - previous.cursor.y) * window.innerHeight;
        const reference = depthReferenceRef.current ?? primary.depth;
        const depth = depthWithDeadZone(primary.depth, reference, settings.deadZone, 4.6 * settings.sensitivity);
        if (Math.abs(depth) > 0.9) {
          depthReferenceRef.current = primary.depth;
        } else {
          const sceneRect = latestRef.current.sceneRef.current?.getBoundingClientRect();
          const sceneScale = Math.max(100, Math.min(sceneRect?.width ?? 700, sceneRect?.height ?? 550) / 4.2);
          latestRef.current.onMove(
            activeId,
            unprojectScreenDelta(dx, dy, depth, latestRef.current.rotationX, latestRef.current.rotationY, sceneScale)
          );
          setDepthDirection(depth > 0.035 ? "perto" : depth < -0.035 ? "longe" : "centro");
        }
      }
      previousHandRef.current = primary;
      return;
    }

    if (hands.length >= 2 && hands[0].gesture === "indexPinch" && hands[1].gesture === "indexPinch" && interactionRef.current.selectedObjectId) {
      const distance = handDistance(hands[0], hands[1]);
      const confirmed = scaleGateRef.current.update({ key: "two-hand-scale", x: distance, y: 0, now, durationMs: 280, stability: 0.055 });
      if (confirmed) {
        previousScaleRef.current = distance;
        dispatch({ type: "START_OBJECT_SCALE" });
        setFeedback("Escala ativa");
      }
      return;
    }
    scaleGateRef.current.update({ key: null, x: 0, y: 0, now, durationMs: 0, stability: 0 });

    if (primary.gesture === rotationGesture && interactionRef.current.selectedObjectId) {
      const confirmed = rotateGateRef.current.update({ key: rotationGesture, x: primary.anchor.x, y: primary.anchor.y, now, durationMs: 330, stability: 0.045 });
      if (confirmed) {
        previousHandRef.current = primary;
        previousRollRef.current = primary.roll;
        dispatch({ type: "START_OBJECT_ROTATION" });
        setFeedback("Rotação ativa");
      }
      return;
    }
    rotateGateRef.current.update({ key: null, x: 0, y: 0, now, durationMs: 0, stability: 0 });

    if (primary.gesture === "indexPinch" && objectId) {
      const confirmed = actionGateRef.current.update({ key: `object:${objectId}`, x: primary.indexPinch.x, y: primary.indexPinch.y, now, durationMs: 300, stability: 0.045 });
      if (confirmed) {
        latestRef.current.onSelectObject(objectId);
        depthReferenceRef.current = primary.depth;
        previousHandRef.current = primary;
        dispatch({ type: "START_OBJECT_DRAG", objectId });
        setFeedback("Objeto capturado. Mova a mão ou aproxime/afaste para profundidade.");
      }
      return;
    }
    actionGateRef.current.update({ key: null, x: 0, y: 0, now, durationMs: 0, stability: 0 });

    const canOpen = primary.gesture === "open" && !isTransformState(interactionRef.current.state);
    const opened = openGateRef.current.update({
      key: canOpen ? "open-menu" : null,
      x: primary.anchor.x,
      y: primary.anchor.y,
      now,
      durationMs: settings.menuDwellMs,
      stability: 0.05,
    });
    if (opened) {
      setMenuSection("root");
      dispatch({ type: "OPEN_MENU" });
      setFeedback("Menu aberto. A cena está bloqueada até você fechar e soltar os gestos.");
    }

    if (calibratingRef.current && primary.gesture === "open") {
      const complete = calibrationGateRef.current.update({ key: "calibrate", x: primary.anchor.x, y: primary.anchor.y, now, durationMs: 700, stability: 0.045 });
      if (complete) {
        depthReferenceRef.current = primary.depth;
        setCalibrating(false);
        setCalibrated(true);
        setFeedback("Calibração concluída na posição atual da mão.");
      }
    }
  }

  async function startCamera() {
    if (streamRef.current) return;
    const generation = ++generationRef.current;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera("unavailable");
      setFeedback("Este navegador não disponibiliza câmera. Use mouse e teclado.");
      return;
    }
    try {
      setCamera("permission");
      setFeedback("Aguardando permissão da câmera…");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      if (generation !== generationRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = stream;
      if (!videoRef.current) throw new Error("video-unavailable");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCamera("loading");
      setFeedback("Carregando o rastreamento local…");
      const tracker = await createHandTracker({ numHands: 2 });
      if (generation !== generationRef.current) {
        tracker.close();
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      trackerRef.current = tracker;
      setCamera("active");
      setFeedback("Câmera ativa. Mostre a mão inteira dentro do quadro.");
      const loop = (now: number) => {
        if (generation !== generationRef.current || !trackerRef.current || !videoRef.current) return;
        frameRef.current = requestAnimationFrame(loop);
        if (now - lastInferenceRef.current < 66 || videoRef.current.readyState < 2) return;
        lastInferenceRef.current = now;
        const result = trackerRef.current.detectForVideo(videoRef.current, now);
        const trustedPoints = result.landmarks.filter((_, index) => (result.handedness[index]?.[0]?.score ?? 0) >= 0.72);
        const hands = trustedPoints
          .map(points => analyzeSpatialHand(points, preferencesRef.current.sensitivity))
          .filter((hand): hand is SpatialHand => Boolean(hand));
        drawHands(trustedPoints, videoRef.current.videoWidth || 640, videoRef.current.videoHeight || 480);
        setHandsDetected(hands.length);
        if (!gesturesEnabledRef.current) {
          setGestureLabel("Modo desligado");
          if (cursorRef.current) cursorRef.current.hidden = true;
          return;
        }
        if (!hands.length) {
          if (cursorRef.current) cursorRef.current.hidden = true;
          setGestureLabel("Mão não encontrada");
          lostSinceRef.current ??= now;
          if (now - lostSinceRef.current > 360 && interactionRef.current.state !== "cancelled") {
            dispatch({ type: "TRACKING_LOST" });
            setFeedback("Mão perdida. A interação foi liberada com segurança.");
            clearGestureReferences();
          } else if (interactionRef.current.state === "cancelled" && now - lostSinceRef.current > 520) {
            dispatch({ type: "GESTURES_RELEASED" });
          }
          return;
        }
        processTrackedHands(hands, now);
      };
      frameRef.current = requestAnimationFrame(loop);
    } catch {
      stopCamera("Não foi possível iniciar a câmera ou o rastreamento. Confira a permissão e use os controles normais.");
      setCamera("unavailable");
    }
  }

  const menuOpen = isMenuState(interaction.state);
  const statusLabel = interaction.state.replaceAll("_", " ");

  return (
    <>
      <header className="gesture-workspace-toolbar" aria-label="Controles do laboratório por gestos">
        <div className="gesture-workspace-toolbar__brand">
          <span><Hand size={16} /> Experimental · somente ADM</span>
          <p>Processamento local — nenhuma imagem sai deste navegador.</p>
        </div>
        <div className="gesture-workspace-toolbar__actions">
          <button type="button" onClick={camera === "active" ? () => stopCamera() : startCamera}>
            {camera === "active" ? <CameraOff size={16} /> : <Camera size={16} />}
            {camera === "active" ? "Desativar" : "Ativar câmera"}
          </button>
          <button type="button" aria-pressed={gesturesEnabled} onClick={() => setGesturesEnabled(value => !value)}>
            <Hand size={16} /> Gestos {gesturesEnabled ? "ativos" : "desligados"}
          </button>
          <button type="button" aria-pressed={menuOpen} onClick={openMenuWithControls}>
            <Shapes size={16} /> Ferramentas
          </button>
          <button type="button" disabled={camera !== "active"} onClick={() => { setCalibrating(true); calibrationGateRef.current.reset(); setFeedback("Mantenha a palma aberta na posição confortável."); }}>
            <Crosshair size={16} /> Calibrar
          </button>
          <button type="button" aria-pressed={preferences.showSkeleton} onClick={() => setPreferences(value => ({ ...value, showSkeleton: !value.showSkeleton }))}>
            {preferences.showSkeleton ? <EyeOff size={16} /> : <Eye size={16} />}
            {preferences.showSkeleton ? "Ocultar pontos" : "Exibir pontos"}
          </button>
          <button type="button" aria-pressed={settingsOpen} onClick={() => setSettingsOpen(value => !value)}>
            <Settings2 size={16} /> Configurar gestos
          </button>
          <button type="button" aria-pressed={helpOpen} onClick={() => setHelpOpen(value => !value)}>
            <HelpCircle size={16} /> Ajuda
          </button>
          <button type="button" onClick={props.onResetScene}><RotateCcw size={16} /> Resetar cena</button>
        </div>
        <div className="gesture-workspace-toolbar__status" aria-live="polite">
          <span data-active={camera === "active"}>{camera === "active" ? "Câmera ativa" : camera === "permission" ? "Aguardando permissão" : camera === "loading" ? "Carregando rastreador" : camera === "unavailable" ? "Câmera indisponível" : "Câmera desligada"}</span>
          <span>{handsDetected ? `${handsDetected} mão${handsDetected > 1 ? "s" : ""}` : "Sem mão"}</span>
          <span data-mode={interaction.state}>{statusLabel}</span>
          <span>{props.selectedLabel}</span>
          <span>Encaixe {props.snapEnabled ? "ativo" : "desligado"}</span>
          <strong>{feedback}</strong>
        </div>
      </header>

      {settingsOpen ? (
        <aside className="gesture-settings-panel" aria-label="Configurar gestos">
          <div><h2>Configurar gestos</h2><button type="button" aria-label="Fechar configurações" onClick={() => setSettingsOpen(false)}><X /></button></div>
          <label>Pinça de rotação
            <select value={preferences.rotationPinch} onChange={event => setPreferences(value => ({ ...value, rotationPinch: event.target.value as GesturePreferences["rotationPinch"] }))}>
              <option value="pinky">Polegar + mindinho</option>
              <option value="middle">Polegar + dedo médio</option>
            </select>
          </label>
          <label>Sensibilidade <output>{preferences.sensitivity.toFixed(2)}</output>
            <input type="range" min="0.75" max="1.35" step="0.05" value={preferences.sensitivity} onChange={event => setPreferences(value => ({ ...value, sensitivity: Number(event.target.value) }))} />
          </label>
          <label>Suavização <output>{preferences.smoothing.toFixed(2)}</output>
            <input type="range" min="0.12" max="0.68" step="0.04" value={preferences.smoothing} onChange={event => setPreferences(value => ({ ...value, smoothing: Number(event.target.value) }))} />
          </label>
          <label>Zona morta <output>{preferences.deadZone.toFixed(3)}</output>
            <input type="range" min="0.006" max="0.035" step="0.001" value={preferences.deadZone} onChange={event => setPreferences(value => ({ ...value, deadZone: Number(event.target.value) }))} />
          </label>
          <label>Tempo para abrir menu <output>{preferences.menuDwellMs} ms</output>
            <input type="range" min="550" max="1500" step="50" value={preferences.menuDwellMs} onChange={event => setPreferences(value => ({ ...value, menuDwellMs: Number(event.target.value) }))} />
          </label>
          <button type="button" className="gesture-panel-reset" onClick={() => setPreferences(DEFAULT_PREFERENCES)}>Restaurar padrão</button>
          <p>Selecionar/mover: polegar + indicador. Rotacionar: {preferences.rotationPinch === "pinky" ? "polegar + mindinho" : "polegar + médio"}. Escalar: pinça com duas mãos.</p>
        </aside>
      ) : null}

      {helpOpen ? (
        <aside className="gesture-help-panel" aria-label="Ajuda de gestos">
          <div><h2>Gestos disponíveis</h2><button type="button" aria-label="Fechar ajuda" onClick={() => setHelpOpen(false)}><X /></button></div>
          <p><b>Palma aberta:</b> abre as ferramentas quando nada está sendo transformado.</p>
          <p><b>Indicador + polegar:</b> escolhe menus ou captura o objeto apontado.</p>
          <p><b>{preferences.rotationPinch === "pinky" ? "Mindinho" : "Dedo médio"} + polegar:</b> rotaciona o selecionado.</p>
          <p><b>Duas pinças:</b> altera a escala.</p>
          <p><b>Punho fechado:</b> cancela e solta com segurança.</p>
        </aside>
      ) : null}

      {menuOpen ? (
        <div
          ref={menuRef}
          className="gesture-command-menu"
          data-state={interaction.state}
          style={{ left: `${menuPosition.x * 100}%`, top: `${menuPosition.y * 100}%` }}
          role="dialog"
          aria-label="Menu de ferramentas geométricas"
        >
          <button type="button" className="gesture-command-menu__grip" data-gesture-menu-drag data-highlight={hoveredMenuAction === "menu:drag"} aria-label="Arrastar menu">
            <GripHorizontal size={20} /><span>Pinça aqui para mover</span>
          </button>
          <div className="gesture-command-menu__heading">
            <div><small>{menuSection === "root" ? "Ferramentas" : "Categoria"}</small><h2>{menuSection === "root" ? "Comandos da cena" : MENU_SECTIONS.find(item => item.id === menuSection)?.label}</h2></div>
            <button type="button" data-gesture-menu-action="menu:close" data-highlight={hoveredMenuAction === "menu:close"} onClick={() => performMenuAction("menu:close", false)} aria-label="Fechar menu"><X /></button>
          </div>
          <div className="gesture-command-menu__grid">
            {menuSection === "root"
              ? MENU_SECTIONS.map(item => (
                  <button key={item.id} type="button" data-gesture-menu-action={`section:${item.id}`} data-highlight={hoveredMenuAction === `section:${item.id}`} onClick={() => performMenuAction(`section:${item.id}`, false)}>
                    <span>{item.label}</span><small>{item.id === "create" ? "7 sólidos" : item.id === "scene" ? "Histórico e objetos" : "Abrir ferramentas"}</small>
                  </button>
                ))
              : SECTION_ACTIONS[menuSection].map(item => (
                  <button key={item.id} type="button" data-gesture-menu-action={item.id} data-highlight={hoveredMenuAction === item.id} onClick={() => performMenuAction(item.id, false)} disabled={(item.id === "scene:undo" && !props.canUndo) || (item.id === "scene:redo" && !props.canRedo)}>
                    <span>{item.label}</span><small>Apontar + pinça</small>
                  </button>
                ))}
          </div>
          <footer>
            {menuSection !== "root" ? <button type="button" data-gesture-menu-action="menu:back" onClick={() => performMenuAction("menu:back", false)}>Voltar</button> : <span>O menu tem prioridade sobre a cena.</span>}
            <button type="button" data-gesture-menu-action="menu:center" onClick={() => performMenuAction("menu:center", false)}><Crosshair size={14} /> Reposicionar</button>
          </footer>
        </div>
      ) : null}

      <div ref={cursorRef} className="gesture-air-cursor" data-mode={interaction.state} data-hover={Boolean(hoveredMenuAction || hoveredObjectId)} hidden />

      {interaction.state === "object_dragging" ? <div className="gesture-mode-indicator">Movendo · profundidade <b data-direction={depthDirection}>{depthDirection}</b></div> : null}
      {interaction.state === "object_rotating" ? <div className="gesture-mode-indicator gesture-mode-indicator--rotation">Rotação ativa · {preferences.rotationPinch === "pinky" ? "polegar + mindinho" : "polegar + médio"}</div> : null}
      {interaction.state === "object_scaling" ? <div className="gesture-mode-indicator">Escala ativa · duas mãos</div> : null}
      {calibrating ? <div className="gesture-mode-indicator">Calibrando · mantenha a palma aberta e estável</div> : null}

      <aside className="gesture-webcam" data-active={camera === "active"} data-visible={cameraVisible}>
        <button type="button" aria-label={cameraVisible ? "Ocultar câmera" : "Mostrar câmera"} onClick={() => setCameraVisible(value => !value)}>{cameraVisible ? <EyeOff /> : <Eye />}</button>
        <div><video ref={videoRef} playsInline muted /><canvas ref={overlayRef} hidden={!preferences.showSkeleton} /></div>
        <p>{camera === "active" ? `${gestureLabel}${calibrated ? " · calibrada" : ""}` : "Webcam local"}</p>
      </aside>
    </>
  );
}
