const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
})[character]!);

function replaceBracedCommand(source: string, command: string, replacement: (parts: string[]) => string, argumentCount: number) {
  let result = source;
  let cursor = 0;
  while ((cursor = result.indexOf(command, cursor)) >= 0) {
    const parts: string[] = [];
    let position = cursor + command.length;
    let valid = true;
    for (let argument = 0; argument < argumentCount; argument += 1) {
      while (/\s/.test(result[position] || "")) position += 1;
      if (result[position] !== "{") { valid = false; break; }
      let depth = 1;
      const start = ++position;
      while (position < result.length && depth > 0) {
        if (result[position] === "{") depth += 1;
        if (result[position] === "}") depth -= 1;
        position += 1;
      }
      if (depth !== 0) { valid = false; break; }
      parts.push(result.slice(start, position - 1));
    }
    if (!valid) { cursor += command.length; continue; }
    result = `${result.slice(0, cursor)}${replacement(parts)}${result.slice(position)}`;
    cursor += 1;
  }
  return result;
}

export function latexToSearchText(latex: string): string {
  let text = String(latex ?? "").trim();
  text = text.replace(/^\$\$?|\$\$?$/g, "").replace(/^\\\(|\\\)$/g, "").replace(/^\\\[|\\\]$/g, "");
  for (let pass = 0; pass < 8; pass += 1) {
    const before = text;
    text = replaceBracedCommand(text, "\\frac", ([numerator, denominator]) => ` ${latexToSearchText(numerator)} sobre ${latexToSearchText(denominator)} `, 2);
    text = replaceBracedCommand(text, "\\sqrt", ([value]) => ` raiz quadrada de ${latexToSearchText(value)} `, 1);
    if (text === before) break;
  }
  const commands: Record<string, string> = {
    times: "vezes", cdot: "vezes", div: "dividido por", leq: "menor ou igual a", le: "menor ou igual a",
    geq: "maior ou igual a", ge: "maior ou igual a", neq: "diferente de", approx: "aproximadamente",
    pm: "mais ou menos", infty: "infinito", alpha: "alfa", beta: "beta", gamma: "gama", delta: "delta",
    theta: "teta", lambda: "lambda", mu: "mi", pi: "pi", rho: "rô", sigma: "sigma", omega: "ômega",
    degree: "graus", circ: "graus", rightarrow: "resulta em", to: "tende a",
  };
  text = text
    .replace(/\\(?:left|right|displaystyle|textstyle)\b/g, "")
    .replace(/\\text\s*\{([^{}]*)\}/g, " $1 ")
    .replace(/\^\s*\{([^{}]+)\}/g, " elevado a $1 ")
    .replace(/\^\s*([A-Za-z0-9+-]+)/g, " elevado a $1 ")
    .replace(/_\s*\{([^{}]+)\}/g, " índice $1 ")
    .replace(/_\s*([A-Za-z0-9+-]+)/g, " índice $1 ")
    .replace(/\\([A-Za-z]+)/g, (_, command: string) => commands[command] ? ` ${commands[command]} ` : " ")
    .replace(/<=/g, " menor ou igual a ").replace(/>=/g, " maior ou igual a ")
    .replace(/=/g, " igual a ").replace(/\+/g, " mais ").replace(/−|-/g, " menos ")
    .replace(/\{/g, " ").replace(/\}/g, " ").replace(/\\,/g, " ").replace(/~/g, " ")
    .replace(/\s+/g, " ").trim();
  return text;
}

const MATH_PATTERN = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$(?!\$)[^$\n]+\$)/g;

export function renderSearchableMath(value: unknown): string {
  const source = typeof value === "string" ? value : "";
  let cursor = 0;
  let output = "";
  MATH_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MATH_PATTERN.exec(source)) !== null) {
    const index = match.index;
    output += escapeHtml(source.slice(cursor, index));
    const original = match[0];
    const accessible = latexToSearchText(original);
    output += `<span class="math-source" aria-label="${escapeHtml(accessible)}">${escapeHtml(original)}</span><span class="sr-only">(${escapeHtml(accessible)})</span>`;
    cursor = index + original.length;
  }
  return output + escapeHtml(source.slice(cursor));
}
