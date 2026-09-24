import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  INITIAL_SPATIAL_INTERACTION,
  StablePoseGate,
  transitionSpatialInteraction,
  type SpatialInteractionContext,
  type SpatialInteractionEvent,
} from "../client/src/lib/gestures/spatialInteractionMachine";

function run(
  current: SpatialInteractionContext,
  ...events: SpatialInteractionEvent[]
) {
  return events.reduce(transitionSpatialInteraction, current);
}

describe("spatial interaction state priority", () => {
  it("gives an open menu absolute priority over scene transforms", () => {
    const selected = run(INITIAL_SPATIAL_INTERACTION, {
      type: "SELECT_OBJECT",
      objectId: "cube-1",
    });
    const menu = run(selected, { type: "OPEN_MENU" });

    expect(menu.state).toBe("menu_open");
    expect(
      run(
        menu,
        { type: "START_OBJECT_DRAG", objectId: "cube-1" },
        { type: "START_OBJECT_ROTATION" },
        { type: "START_OBJECT_SCALE" }
      )
    ).toEqual(menu);
  });

  it("drags and fixes the menu without releasing control to the scene", () => {
    const menu = run(INITIAL_SPATIAL_INTERACTION, { type: "OPEN_MENU" });
    const dragging = run(menu, { type: "START_MENU_DRAG" });
    expect(dragging.state).toBe("menu_dragging");
    expect(run(dragging, { type: "END_MENU_DRAG" }).state).toBe("menu_open");
  });

  it("requires gesture release after a menu action before scene interaction", () => {
    const menu = run(INITIAL_SPATIAL_INTERACTION, { type: "OPEN_MENU" });
    const completed = run(menu, {
      type: "MENU_ACTION_COMPLETE",
      selectedObjectId: "sphere-1",
    });

    expect(completed).toMatchObject({
      state: "cancelled",
      selectedObjectId: "sphere-1",
      releaseRequired: true,
    });
    expect(
      run(completed, { type: "START_OBJECT_DRAG", objectId: "sphere-1" })
    ).toEqual(completed);
    expect(run(completed, { type: "GESTURES_RELEASED" }).state).toBe(
      "object_selected"
    );
  });

  it("allows only one object transform and cancels safely on tracking loss", () => {
    const selected = run(INITIAL_SPATIAL_INTERACTION, {
      type: "SELECT_OBJECT",
      objectId: "cone-1",
    });
    const dragging = run(selected, {
      type: "START_OBJECT_DRAG",
      objectId: "cone-1",
    });
    expect(dragging.state).toBe("object_dragging");
    expect(run(dragging, { type: "START_OBJECT_ROTATION" })).toEqual(dragging);
    expect(run(dragging, { type: "OPEN_MENU" })).toEqual(dragging);

    const lost = run(dragging, { type: "TRACKING_LOST" });
    expect(lost).toMatchObject({
      state: "cancelled",
      activeObjectId: null,
      releaseRequired: true,
    });
    expect(run(lost, { type: "GESTURES_RELEASED" }).state).toBe(
      "object_selected"
    );
  });
});

describe("stable pose gate", () => {
  it("fires once only after stable dwell and resets after release", () => {
    const gate = new StablePoseGate();
    expect(
      gate.update({ key: "open", x: 0.5, y: 0.5, now: 0, durationMs: 800, stability: 0.05 })
    ).toBe(false);
    expect(
      gate.update({ key: "open", x: 0.51, y: 0.5, now: 799, durationMs: 800, stability: 0.05 })
    ).toBe(false);
    expect(
      gate.update({ key: "open", x: 0.51, y: 0.5, now: 800, durationMs: 800, stability: 0.05 })
    ).toBe(true);
    expect(
      gate.update({ key: "open", x: 0.51, y: 0.5, now: 1600, durationMs: 800, stability: 0.05 })
    ).toBe(false);
    gate.update({ key: null, x: 0, y: 0, now: 1700, durationMs: 0, stability: 0 });
    expect(
      gate.update({ key: "open", x: 0.5, y: 0.5, now: 1800, durationMs: 800, stability: 0.05 })
    ).toBe(false);
  });

  it("restarts dwell after unstable movement", () => {
    const gate = new StablePoseGate();
    gate.update({ key: "rotate", x: 0.2, y: 0.2, now: 0, durationMs: 300, stability: 0.03 });
    gate.update({ key: "rotate", x: 0.4, y: 0.2, now: 280, durationMs: 300, stability: 0.03 });
    expect(
      gate.update({ key: "rotate", x: 0.4, y: 0.2, now: 300, durationMs: 300, stability: 0.03 })
    ).toBe(false);
    expect(
      gate.update({ key: "rotate", x: 0.4, y: 0.2, now: 580, durationMs: 300, stability: 0.03 })
    ).toBe(true);
  });
});

describe("administrative isolation", () => {
  const appSource = readFileSync(
    new URL("../client/src/App.tsx", import.meta.url),
    "utf8"
  );
  const adminPageSource = readFileSync(
    new URL(
      "../client/src/pages/AdminSpatialGestureWorkspacePage.tsx",
      import.meta.url
    ),
    "utf8"
  );
  const controlsSource = readFileSync(
    new URL(
      "../client/src/components/admin/SpatialGestureWorkspaceControls.tsx",
      import.meta.url
    ),
    "utf8"
  );

  it("keeps the gesture workspace on the protected administrative route", () => {
    expect(appSource).toContain(
      '() => import("./pages/AdminSpatialGestureWorkspacePage")'
    );
    expect(appSource).toContain(
      'path="/admin/matematica/geometria-espacial"'
    );
    expect(adminPageSource).toContain('<AdminGuard allowedRoles={["admin"]}>');
    expect(appSource).toContain(
      'path="/simuladores/geometria-espacial"'
    );
    expect(appSource).toContain("component={SpatialGeometrySimulatorPage}");
  });

  it("requests the webcam only inside the explicit start action", () => {
    expect(controlsSource.match(/getUserMedia\(/g)).toHaveLength(1);
    const start = controlsSource.indexOf("async function startCamera()");
    const request = controlsSource.indexOf("getUserMedia(");
    expect(start).toBeGreaterThan(-1);
    expect(request).toBeGreaterThan(start);
  });
});
