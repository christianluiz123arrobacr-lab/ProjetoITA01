import type { ScratchpadPoint, ScratchpadShape, ScratchpadStroke } from "@/services/question-notes.service";

export type ShapeRecognition = { shape: ScratchpadShape; confidence: number };
const distance = (a: ScratchpadPoint, b: ScratchpadPoint) => Math.hypot(a.x-b.x, a.y-b.y);
const segmentDistance = (p: ScratchpadPoint, a: ScratchpadPoint, b: ScratchpadPoint) => {
  const dx=b.x-a.x, dy=b.y-a.y, l=dx*dx+dy*dy;
  const t=l ? Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)) : 0;
  return distance(p,{x:a.x+t*dx,y:a.y+t*dy});
};

export function getShapeVertices(shape: ScratchpadShape, a: ScratchpadPoint, z: ScratchpadPoint) {
  let minX=Math.min(a.x,z.x), maxX=Math.max(a.x,z.x), minY=Math.min(a.y,z.y), maxY=Math.max(a.y,z.y);
  if (shape === "square" || shape === "circle") {
    const side=Math.max(maxX-minX,maxY-minY), cx=(minX+maxX)/2, cy=(minY+maxY)/2;
    minX=cx-side/2; maxX=cx+side/2; minY=cy-side/2; maxY=cy+side/2;
  }
  const cx=(minX+maxX)/2, cy=(minY+maxY)/2;
  if (shape === "triangle") return [{x:cx,y:minY},{x:maxX,y:maxY},{x:minX,y:maxY}];
  if (shape === "diamond") return [{x:cx,y:minY},{x:maxX,y:cy},{x:cx,y:maxY},{x:minX,y:cy}];
  if (shape === "pentagon") return Array.from({length:5},(_,i)=>({x:cx+Math.cos(-Math.PI/2+i*Math.PI*2/5)*(maxX-minX)/2,y:cy+Math.sin(-Math.PI/2+i*Math.PI*2/5)*(maxY-minY)/2}));
  return [{x:minX,y:minY},{x:maxX,y:minY},{x:maxX,y:maxY},{x:minX,y:maxY}];
}

export function recognizePerfectShape(stroke: ScratchpadStroke): ShapeRecognition | null {
  const p=stroke.points;
  if (p.length<6) return null;
  const xs=p.map(v=>v.x), ys=p.map(v=>v.y), minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys);
  const w=maxX-minX,h=maxY-minY,diag=Math.hypot(w,h);
  if (diag<35) return null;
  const direct=distance(p[0],p[p.length-1]);
  const straight=p.reduce((s,v)=>s+segmentDistance(v,p[0],p[p.length-1]),0)/p.length/Math.max(direct,1);
  if (direct/diag>.45 && straight<.045) return {shape:"line",confidence:Math.min(.99,1-straight*8)};
  if (distance(p[0],p[p.length-1])/diag>.25) return null;
  const cx=(minX+maxX)/2,cy=(minY+maxY)/2,rx=w/2,ry=h/2;
  const ellipseError=p.reduce((s,v)=>s+Math.abs(Math.hypot((v.x-cx)/Math.max(rx,1),(v.y-cy)/Math.max(ry,1))-1),0)/p.length;
  const rectError=p.reduce((s,v)=>s+Math.min(Math.abs(v.x-minX),Math.abs(v.x-maxX),Math.abs(v.y-minY),Math.abs(v.y-maxY))/diag,0)/p.length;
  const candidates: ScratchpadShape[]=["triangle","diamond","pentagon"];
  const polygonScores=candidates.map(shape=>{
    const vertices=getShapeVertices(shape,{x:minX,y:minY},{x:maxX,y:maxY});
    const error=p.reduce((sum,v)=>sum+Math.min(...vertices.map((q,i)=>segmentDistance(v,q,vertices[(i+1)%vertices.length]))),0)/p.length/diag;
    return {shape,error};
  }).sort((a,b)=>a.error-b.error);
  if (ellipseError<.115 && ellipseError<rectError*2.2 && ellipseError<polygonScores[0].error*2.2)
    return {shape:w/h>.84&&w/h<1.19?"circle":"ellipse",confidence:Math.max(.7,1-ellipseError*2.5)};
  if (polygonScores[0].error<.035 && polygonScores[0].error<rectError*.82)
    return {shape:polygonScores[0].shape,confidence:Math.max(.7,1-polygonScores[0].error*7)};
  if (rectError<.035) return {shape:w/h>.82&&w/h<1.22?"square":"rectangle",confidence:Math.max(.7,1-rectError*7)};
  return null;
}
