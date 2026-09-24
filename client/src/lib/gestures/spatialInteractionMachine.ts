export type SpatialInteractionState =
  | "idle"
  | "menu_open"
  | "menu_dragging"
  | "object_selected"
  | "object_dragging"
  | "object_rotating"
  | "object_scaling"
  | "cancelled";

export type SpatialInteractionContext = {
  state: SpatialInteractionState;
  selectedObjectId: string | null;
  activeObjectId: string | null;
  releaseRequired: boolean;
};

export type SpatialInteractionEvent =
  | { type: "OPEN_MENU" }
  | { type: "START_MENU_DRAG" }
  | { type: "END_MENU_DRAG" }
  | { type: "CLOSE_MENU" }
  | { type: "MENU_ACTION_COMPLETE"; selectedObjectId?: string | null }
  | { type: "SELECT_OBJECT"; objectId: string }
  | { type: "START_OBJECT_DRAG"; objectId: string }
  | { type: "START_OBJECT_ROTATION" }
  | { type: "START_OBJECT_SCALE" }
  | { type: "END_TRANSFORM" }
  | { type: "DELETE_SELECTION" }
  | { type: "CANCEL" }
  | { type: "TRACKING_LOST" }
  | { type: "GESTURES_RELEASED" };

export const INITIAL_SPATIAL_INTERACTION: SpatialInteractionContext = {
  state: "idle",
  selectedObjectId: null,
  activeObjectId: null,
  releaseRequired: false,
};

export function isMenuState(state: SpatialInteractionState) {
  return state === "menu_open" || state === "menu_dragging";
}

export function isTransformState(state: SpatialInteractionState) {
  return (
    state === "object_dragging" ||
    state === "object_rotating" ||
    state === "object_scaling"
  );
}

function restingState(selectedObjectId: string | null): SpatialInteractionState {
  return selectedObjectId ? "object_selected" : "idle";
}

export function transitionSpatialInteraction(
  current: SpatialInteractionContext,
  event: SpatialInteractionEvent
): SpatialInteractionContext {
  switch (event.type) {
    case "OPEN_MENU":
      if (isTransformState(current.state) || current.state === "cancelled") return current;
      return { ...current, state: "menu_open", activeObjectId: null };

    case "START_MENU_DRAG":
      return current.state === "menu_open"
        ? { ...current, state: "menu_dragging", activeObjectId: null }
        : current;

    case "END_MENU_DRAG":
      return current.state === "menu_dragging"
        ? { ...current, state: "menu_open", activeObjectId: null }
        : current;

    case "CLOSE_MENU":
      return isMenuState(current.state)
        ? {
            ...current,
            state: "cancelled",
            activeObjectId: null,
            releaseRequired: true,
          }
        : current;

    case "MENU_ACTION_COMPLETE": {
      if (!isMenuState(current.state)) return current;
      const selectedObjectId =
        event.selectedObjectId === undefined
          ? current.selectedObjectId
          : event.selectedObjectId;
      return {
        state: "cancelled",
        selectedObjectId,
        activeObjectId: null,
        releaseRequired: true,
      };
    }

    case "SELECT_OBJECT":
      if (isMenuState(current.state) || current.state === "cancelled") return current;
      return {
        state: "object_selected",
        selectedObjectId: event.objectId,
        activeObjectId: null,
        releaseRequired: false,
      };

    case "START_OBJECT_DRAG":
      if (
        isMenuState(current.state) ||
        isTransformState(current.state) ||
        current.state === "cancelled"
      ) {
        return current;
      }
      return {
        state: "object_dragging",
        selectedObjectId: event.objectId,
        activeObjectId: event.objectId,
        releaseRequired: false,
      };

    case "START_OBJECT_ROTATION":
      if (
        !current.selectedObjectId ||
        isMenuState(current.state) ||
        isTransformState(current.state) ||
        current.state === "cancelled"
      ) {
        return current;
      }
      return {
        ...current,
        state: "object_rotating",
        activeObjectId: current.selectedObjectId,
      };

    case "START_OBJECT_SCALE":
      if (
        !current.selectedObjectId ||
        isMenuState(current.state) ||
        isTransformState(current.state) ||
        current.state === "cancelled"
      ) {
        return current;
      }
      return {
        ...current,
        state: "object_scaling",
        activeObjectId: current.selectedObjectId,
      };

    case "END_TRANSFORM":
      return isTransformState(current.state)
        ? {
            ...current,
            state: restingState(current.selectedObjectId),
            activeObjectId: null,
          }
        : current;

    case "DELETE_SELECTION":
      return {
        state: "idle",
        selectedObjectId: null,
        activeObjectId: null,
        releaseRequired: false,
      };

    case "CANCEL":
    case "TRACKING_LOST":
      return {
        ...current,
        state: "cancelled",
        activeObjectId: null,
        releaseRequired: true,
      };

    case "GESTURES_RELEASED":
      return current.state === "cancelled"
        ? {
            ...current,
            state: restingState(current.selectedObjectId),
            activeObjectId: null,
            releaseRequired: false,
          }
        : current;
  }
}

export class StablePoseGate {
  private key: string | null = null;
  private since = 0;
  private anchor = { x: 0, y: 0 };
  private fired = false;
  private cooldownUntil = 0;

  reset(cooldownUntil = 0) {
    this.key = null;
    this.since = 0;
    this.fired = false;
    this.cooldownUntil = Math.max(this.cooldownUntil, cooldownUntil);
  }

  update(options: {
    key: string | null;
    x: number;
    y: number;
    now: number;
    durationMs: number;
    stability: number;
  }) {
    const { key, x, y, now, durationMs, stability } = options;
    if (!key) {
      this.key = null;
      this.fired = false;
      return false;
    }
    if (key !== this.key) {
      this.key = key;
      this.since = now;
      this.anchor = { x, y };
      this.fired = false;
      return false;
    }
    if (Math.hypot(x - this.anchor.x, y - this.anchor.y) > stability) {
      this.since = now;
      this.anchor = { x, y };
      return false;
    }
    if (this.fired || now < this.cooldownUntil || now - this.since < durationMs)
      return false;
    this.fired = true;
    return true;
  }
}
