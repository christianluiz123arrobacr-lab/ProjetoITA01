export type FunctionAst =
  | { type: "number"; value: number }
  | { type: "variable" }
  | { type: "unary"; operator: "+" | "-"; value: FunctionAst }
  | {
      type: "binary";
      operator: "+" | "-" | "*" | "/" | "^";
      left: FunctionAst;
      right: FunctionAst;
    }
  | { type: "call"; name: SupportedFunction; argument: FunctionAst };

type SupportedFunction =
  | "sen"
  | "sin"
  | "cos"
  | "tan"
  | "tg"
  | "sqrt"
  | "abs"
  | "log"
  | "ln"
  | "log2"
  | "exp";
type Token = {
  type: "number" | "identifier" | "operator" | "left" | "right" | "end";
  value: string;
};

const FUNCTIONS = new Set<SupportedFunction>([
  "sen",
  "sin",
  "cos",
  "tan",
  "tg",
  "sqrt",
  "abs",
  "log",
  "ln",
  "log2",
  "exp",
]);

export class FunctionExpressionError extends Error {
  constructor(public readonly userMessage: string) {
    super(userMessage);
    this.name = "FunctionExpressionError";
  }
}

export class FunctionEvaluationError extends Error {
  constructor(public readonly userMessage: string) {
    super(userMessage);
    this.name = "FunctionEvaluationError";
  }
}

export function normalizeFunctionExpression(input: string) {
  const trimmed = String(input ?? "")
    .trim()
    .replace(/−/g, "-")
    .replace(/π/g, "pi");
  const assignment = trimmed.match(
    /^(?:(?:[a-zA-Z]\w*\s*\(\s*x\s*\))|y)\s*=\s*(.+)$/i
  );
  return (assignment?.[1] ?? trimmed).trim();
}

function expandAbsoluteBars(value: string) {
  let opened = false;
  let result = "";
  for (const char of value) {
    if (char !== "|") {
      result += char;
      continue;
    }
    result += opened ? ")" : "abs(";
    opened = !opened;
  }
  if (opened) throw new FunctionExpressionError("Módulo não fechado.");
  return result;
}

function rawTokens(expression: string): Token[] {
  const source = expandAbsoluteBars(expression.toLowerCase());
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (/[0-9.]/.test(char)) {
      const match = source
        .slice(index)
        .match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/);
      if (!match) throw new FunctionExpressionError("Número inválido.");
      tokens.push({ type: "number", value: match[0] });
      index += match[0].length;
      continue;
    }
    if (/[a-z_]/.test(char)) {
      const match = source.slice(index).match(/^[a-z_]\w*/)?.[0] ?? "";
      tokens.push({ type: "identifier", value: match });
      index += match.length;
      continue;
    }
    if ("+-*/^".includes(char)) tokens.push({ type: "operator", value: char });
    else if (char === "(") tokens.push({ type: "left", value: char });
    else if (char === ")") tokens.push({ type: "right", value: char });
    else
      throw new FunctionExpressionError(
        "Use apenas números, x, operadores e funções matemáticas válidas."
      );
    index += 1;
  }
  return tokens;
}

function canEnd(token: Token) {
  return (
    token.type === "number" ||
    token.type === "identifier" ||
    token.type === "right"
  );
}
function canStart(token: Token) {
  return (
    token.type === "number" ||
    token.type === "identifier" ||
    token.type === "left"
  );
}

function tokenize(expression: string) {
  const raw = rawTokens(expression);
  const result: Token[] = [];
  raw.forEach((token, index) => {
    const previous = raw[index - 1];
    const previousIsFunction =
      previous?.type === "identifier" &&
      FUNCTIONS.has(previous.value as SupportedFunction);
    if (
      previous &&
      canEnd(previous) &&
      canStart(token) &&
      !(previousIsFunction && token.type === "left")
    ) {
      result.push({ type: "operator", value: "*" });
    }
    result.push(token);
  });
  result.push({ type: "end", value: "" });
  return result;
}

export function parseFunctionExpression(input: string): FunctionAst {
  const expression = normalizeFunctionExpression(input);
  if (!expression) throw new FunctionExpressionError("Expressão incompleta.");
  if (expression.length > 300)
    throw new FunctionExpressionError(
      "A expressão deve ter no máximo 300 caracteres."
    );
  const tokens = tokenize(expression);
  if (tokens.length > 256)
    throw new FunctionExpressionError("A expressão possui elementos demais.");
  let position = 0;
  const peek = () => tokens[position];
  const take = () => tokens[position++];

  const parse = (minimumBinding = 0): FunctionAst => {
    const first = take();
    let left: FunctionAst;
    if (first.type === "number")
      left = { type: "number", value: Number(first.value) };
    else if (first.type === "identifier") {
      if (first.value === "x") left = { type: "variable" };
      else if (first.value === "pi") left = { type: "number", value: Math.PI };
      else if (first.value === "e") left = { type: "number", value: Math.E };
      else if (FUNCTIONS.has(first.value as SupportedFunction)) {
        if (peek().type !== "left")
          throw new FunctionExpressionError(
            "Informe o argumento da função entre parênteses."
          );
        take();
        const argument = parse(0);
        if (take().type !== "right")
          throw new FunctionExpressionError("Parênteses não fechados.");
        left = {
          type: "call",
          name: first.value as SupportedFunction,
          argument,
        };
      } else if (/^[a-z]/.test(first.value)) {
        throw new FunctionExpressionError(
          first.value.length === 1
            ? "Use apenas x como variável."
            : "Função matemática não reconhecida."
        );
      } else throw new FunctionExpressionError("Expressão inválida.");
    } else if (
      first.type === "operator" &&
      (first.value === "+" || first.value === "-")
    ) {
      left = { type: "unary", operator: first.value, value: parse(25) };
    } else if (first.type === "left") {
      left = parse(0);
      if (take().type !== "right")
        throw new FunctionExpressionError("Parênteses não fechados.");
    } else
      throw new FunctionExpressionError(
        first.type === "end"
          ? "Expressão incompleta."
          : "Operador em posição inválida."
      );

    while (peek().type === "operator") {
      const operator = peek().value as "+" | "-" | "*" | "/" | "^";
      const binding =
        operator === "+" || operator === "-"
          ? 10
          : operator === "*" || operator === "/"
            ? 20
            : 30;
      if (binding < minimumBinding) break;
      take();
      const right = parse(operator === "^" ? binding : binding + 1);
      left = { type: "binary", operator, left, right };
    }
    return left;
  };

  const ast = parse();
  if (peek().type === "right")
    throw new FunctionExpressionError("Parêntese fechado sem abertura.");
  if (peek().type !== "end")
    throw new FunctionExpressionError("Expressão inválida.");
  return ast;
}

export function evaluateFunctionAst(ast: FunctionAst, x: number): number {
  if (ast.type === "number") return ast.value;
  if (ast.type === "variable") return x;
  if (ast.type === "unary")
    return ast.operator === "-"
      ? -evaluateFunctionAst(ast.value, x)
      : evaluateFunctionAst(ast.value, x);
  if (ast.type === "binary") {
    const left = evaluateFunctionAst(ast.left, x);
    const right = evaluateFunctionAst(ast.right, x);
    if (ast.operator === "+") return left + right;
    if (ast.operator === "-") return left - right;
    if (ast.operator === "*") return left * right;
    if (ast.operator === "/") {
      if (Math.abs(right) < 1e-14)
        throw new FunctionEvaluationError(
          "Não é possível dividir por zero nesse ponto."
        );
      return left / right;
    }
    return Math.pow(left, right);
  }
  const value = evaluateFunctionAst(ast.argument, x);
  const operations: Record<SupportedFunction, (number: number) => number> = {
    sen: Math.sin,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    tg: Math.tan,
    sqrt: Math.sqrt,
    abs: Math.abs,
    log: Math.log10,
    ln: Math.log,
    log2: Math.log2,
    exp: Math.exp,
  };
  const result = operations[ast.name](value);
  if (!Number.isFinite(result))
    throw new FunctionEvaluationError(
      "A função não está definida nesse ponto."
    );
  return result;
}

export type CompiledFunction = {
  expression: string;
  ast: FunctionAst;
  evaluate: (x: number) => number;
};
export function compileFunctionExpression(input: string): CompiledFunction {
  const expression = normalizeFunctionExpression(input);
  const ast = parseFunctionExpression(expression);
  return {
    expression,
    ast,
    evaluate: (x: number) => evaluateFunctionAst(ast, x),
  };
}

export function safeEvaluate(compiled: CompiledFunction, x: number) {
  try {
    const value = compiled.evaluate(x);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function shouldBreakCurve(
  previous: { x: number; y: number } | null,
  current: { x: number; y: number } | null,
  visibleYRange: number
) {
  if (
    !previous ||
    !current ||
    !Number.isFinite(previous.y) ||
    !Number.isFinite(current.y)
  )
    return true;
  if (
    Math.abs(previous.y) > visibleYRange * 20 ||
    Math.abs(current.y) > visibleYRange * 20
  )
    return true;
  return Math.abs(current.y - previous.y) > Math.max(visibleYRange * 1.5, 20);
}

export type FunctionSimulatorStoredState = {
  functions: Array<{ expression: string; color: string; visible: boolean }>;
  view: { centerX: number; centerY: number; scaleX: number; scaleY: number };
  showGrid: boolean;
  equalScale: boolean;
  selectedIndex: number;
};

export function parseFunctionSimulatorStorage(
  raw: string | null
): FunctionSimulatorStoredState | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const state = value as Partial<FunctionSimulatorStoredState>;
    if (
      !Array.isArray(state.functions) ||
      state.functions.length < 1 ||
      state.functions.length > 5
    )
      return null;
    if (
      !state.functions.every(
        item =>
          item &&
          typeof item.expression === "string" &&
          typeof item.color === "string" &&
          /^#[0-9a-f]{6}$/i.test(item.color) &&
          typeof item.visible === "boolean"
      )
    )
      return null;
    const view = state.view;
    if (
      !view ||
      ![view.centerX, view.centerY, view.scaleX, view.scaleY].every(
        Number.isFinite
      ) ||
      view.scaleX! < 8 ||
      view.scaleX! > 500 ||
      view.scaleY! < 8 ||
      view.scaleY! > 500
    )
      return null;
    if (
      typeof state.showGrid !== "boolean" ||
      typeof state.equalScale !== "boolean" ||
      !Number.isInteger(state.selectedIndex) ||
      state.selectedIndex! < 0 ||
      state.selectedIndex! >= state.functions.length
    )
      return null;
    return state as FunctionSimulatorStoredState;
  } catch {
    return null;
  }
}
