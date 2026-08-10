import { safeSmilesSchema } from "@shared/chemistryContent";

type Atom = { symbol: string; x: number; y: number };
type Bond = { from: number; to: number; order: number };

// Deterministic, dependency-free SVG renderer for the restricted educational SMILES subset.
// It never evaluates or embeds input markup; only parsed atom labels and bond primitives are emitted.
export function smilesToSvg(smiles: string, width = 520, height = 220): string {
  const valid = safeSmilesSchema.parse(smiles);
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const branches: number[] = [];
  const rings = new Map<string, number>();
  let current = -1, order = 1;
  for (let i = 0; i < valid.length;) {
    const c = valid[i];
    if (c === "(") { branches.push(current); i++; continue; }
    if (c === ")") { current = branches.pop() ?? current; i++; continue; }
    if (c === "=") { order = 2; i++; continue; }
    if (c === "#") { order = 3; i++; continue; }
    if (/\d/.test(c)) { const previous = rings.get(c); if (previous == null) rings.set(c, current); else { bonds.push({ from: previous, to: current, order }); rings.delete(c); } order = 1; i++; continue; }
    const match = valid.slice(i).match(/^(Cl|Br|[BCNOPSFIconps])/);
    if (!match) throw new Error("SMILES não suportado ou inválido");
    const symbol = match[1];
    const index = atoms.length;
    const angle = index % 2 ? -0.38 : 0.38;
    atoms.push({ symbol, x: 60 + index * 70, y: height / 2 + Math.sin(angle) * 55 });
    if (current >= 0) bonds.push({ from: current, to: index, order });
    current = index; order = 1; i += symbol.length;
  }
  if (!atoms.length || branches.length || rings.size) throw new Error("SMILES incompleto ou inválido");
  const maxX = Math.max(...atoms.map(a => a.x)) + 60;
  const line = (b: Bond) => {
    const a = atoms[b.from], c = atoms[b.to], dx = c.x-a.x, dy=c.y-a.y, len=Math.hypot(dx,dy)||1, ox=-dy/len*5, oy=dx/len*5;
    return Array.from({length:b.order},(_,n)=>{const shift=(n-(b.order-1)/2);return `<line x1="${a.x+ox*shift}" y1="${a.y+oy*shift}" x2="${c.x+ox*shift}" y2="${c.y+oy*shift}"/>`;}).join("");
  };
  const labels = atoms.map(a => a.symbol.toLowerCase() === "c" ? "" : `<text x="${a.x}" y="${a.y+6}" text-anchor="middle">${a.symbol}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.max(width,maxX)} ${height}" role="img"><g stroke="#172033" stroke-width="3" stroke-linecap="round">${bonds.map(line).join("")}</g><g fill="#172033" font-family="Arial,sans-serif" font-size="22" font-weight="600">${labels}</g></svg>`;
}
