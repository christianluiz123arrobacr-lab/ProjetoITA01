import { describe, expect, it } from "vitest";
import {
  compileFunctionExpression,
  FunctionEvaluationError,
  parseFunctionExpression,
  parseFunctionSimulatorStorage,
  safeEvaluate,
  shouldBreakCurve,
} from "../client/src/lib/functionExpressionParser";

const value = (expression: string, x: number) =>
  compileFunctionExpression(expression).evaluate(x);

describe("interpretador seguro do simulador de funções", () => {
  it.each([
    ["x^2", 3, 9],
    ["2x + 3", 2, 7],
    ["-x^2", 3, -9],
    ["(x + 1)(x - 2)", 3, 4],
    ["sqrt(x)", 9, 3],
    ["abs(x)", -4, 4],
    ["|x|", -5, 5],
    ["sen(x)", Math.PI / 2, 1],
    ["sin(x)", Math.PI / 2, 1],
    ["cos(x)", 0, 1],
    ["tan(x)", 0, 0],
    ["tg(x)", 0, 0],
    ["2^x", 3, 8],
    ["log(x)", 100, 2],
    ["ln(x)", Math.E, 1],
    ["log2(x)", 8, 3],
    ["3(x + 1)", 2, 9],
    ["2sen(x)", Math.PI / 2, 2],
    ["x(x + 1)", 2, 6],
    ["f(x) = x^2", 4, 16],
    ["y = 2x + 3", 4, 11],
  ])("avalia %s em x=%s", (expression, x, expected) =>
    expect(value(expression, x)).toBeCloseTo(expected, 10)
  );

  it("respeita precedência e potência associativa", () => {
    expect(value("2 + 3 * 4", 0)).toBe(14);
    expect(value("2^3^2", 0)).toBe(512);
    expect(value("(-x)^2", 3)).toBe(9);
  });
  it("aceita pi, π, e e exp", () => {
    expect(value("pi", 0)).toBeCloseTo(Math.PI);
    expect(value("π", 0)).toBeCloseTo(Math.PI);
    expect(value("exp(1)", 0)).toBeCloseTo(Math.E);
  });
  it("rejeita expressão incompleta, função desconhecida, outra variável e parêntese aberto", () => {
    expect(() => parseFunctionExpression("x +")).toThrow(
      "Expressão incompleta."
    );
    expect(() => parseFunctionExpression("foo(x)")).toThrow(
      "Função matemática não reconhecida."
    );
    expect(() => parseFunctionExpression("z + 1")).toThrow(
      "Use apenas x como variável."
    );
    expect(() => parseFunctionExpression("(x + 1")).toThrow(
      "Parênteses não fechados."
    );
  });
  it("não executa texto JavaScript", () => {
    expect(() => parseFunctionExpression("alert(1)")).toThrow(
      "Função matemática não reconhecida."
    );
    expect(() => parseFunctionExpression("x;window.location")).toThrow();
  });
  it("informa divisão por zero e trata domínio inválido", () => {
    expect(() => value("1/x", 0)).toThrow(FunctionEvaluationError);
    expect(safeEvaluate(compileFunctionExpression("sqrt(x)"), -1)).toBeNull();
    expect(safeEvaluate(compileFunctionExpression("log(x)"), 0)).toBeNull();
  });
  it("interrompe curvas em descontinuidades de 1/x e tan(x)", () => {
    const reciprocal = compileFunctionExpression("1/x");
    expect(
      shouldBreakCurve(
        { x: -0.01, y: reciprocal.evaluate(-0.01) },
        { x: 0.01, y: reciprocal.evaluate(0.01) },
        20
      )
    ).toBe(true);
    const tangent = compileFunctionExpression("tan(x)");
    expect(
      shouldBreakCurve(
        { x: 1.56, y: tangent.evaluate(1.56) },
        { x: 1.58, y: tangent.evaluate(1.58) },
        20
      )
    ).toBe(true);
  });
  it("valida e rejeita armazenamento local corrompido", () => {
    expect(parseFunctionSimulatorStorage("não é json")).toBeNull();
    expect(
      parseFunctionSimulatorStorage(JSON.stringify({ functions: [] }))
    ).toBeNull();
    const valid = JSON.stringify({
      functions: [{ expression: "x", color: "#2563eb", visible: true }],
      view: { centerX: 0, centerY: 0, scaleX: 48, scaleY: 48 },
      showGrid: true,
      equalScale: true,
      selectedIndex: 0,
    });
    expect(parseFunctionSimulatorStorage(valid)?.functions[0].expression).toBe(
      "x"
    );
  });
});
