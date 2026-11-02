import { describe, expect, it } from "vitest";
import { calculateImmediatePointWidth, getSafeCanvasPixelRatio, normalizePointerPressure } from "../client/src/components/study-canvas/studyCanvasInk";
import { getShapeVertices, recognizePerfectShape } from "../client/src/components/study-canvas/studyCanvasShapes";
import type { ScratchpadPoint, ScratchpadStroke } from "../client/src/services/question-notes.service";

const stroke = (points: ScratchpadPoint[]): ScratchpadStroke => ({ id:"test", tool:"pen", color:"#000000", size:4, brush:"pen", points });
const closedPolygon = (vertices: ScratchpadPoint[]) => {
  const points: ScratchpadPoint[]=[];
  vertices.forEach((a,i)=>{ const b=vertices[(i+1)%vertices.length]; for(let n=0;n<12;n++) points.push({x:a.x+(b.x-a.x)*n/12,y:a.y+(b.y-a.y)*n/12}); });
  points.push(vertices[0]); return points;
};

describe("study canvas ink quality", () => {
  it("applies pressure to the same sample instead of inheriting the previous width", () => {
    const previous={x:0,y:0,time:1,pressure:.1,width:1};
    const high=calculateImmediatePointWidth({point:{x:1,y:0,time:2,pressure:1},previousPoint:previous,size:8,brush:"pen"});
    const low=calculateImmediatePointWidth({point:{x:1,y:0,time:2,pressure:.1},previousPoint:{...previous,width:20},size:8,brush:"pen"});
    expect(high).toBeGreaterThan(low*2);
  });
  it("uses stable mouse/touch fallbacks and caps high-DPR bitmaps", () => {
    expect(normalizePointerPressure(0,"mouse")).toBe(.65);
    expect(normalizePointerPressure(0,"touch")).toBe(.55);
    expect(getSafeCanvasPixelRatio(4,1200,1600)).toBeGreaterThan(1);
    expect(getSafeCanvasPixelRatio(4,1200,1600)).toBeLessThanOrEqual(2.5);
  });
  it.each([
    ["triangle",[{x:100,y:10},{x:190,y:190},{x:10,y:190}]],
    ["diamond",[{x:100,y:10},{x:190,y:100},{x:100,y:190},{x:10,y:100}]],
    ["pentagon",getShapeVertices("pentagon",{x:10,y:10},{x:190,y:190})],
  ] as const)("recognizes a confident %s", (shape, vertices) => {
    expect(recognizePerfectShape(stroke(closedPolygon([...vertices])))?.shape).toBe(shape);
  });
  it("recognizes circles and rejects writing-like open paths", () => {
    const circle=Array.from({length:65},(_,i)=>({x:100+80*Math.cos(i*Math.PI*2/64),y:100+80*Math.sin(i*Math.PI*2/64)}));
    expect(recognizePerfectShape(stroke(circle))?.shape).toBe("circle");
    expect(recognizePerfectShape(stroke([{x:0,y:0},{x:20,y:20},{x:10,y:40},{x:30,y:60},{x:15,y:80},{x:40,y:100}]))).toBeNull();
  });
});
