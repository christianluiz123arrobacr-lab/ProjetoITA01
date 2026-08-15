import { normalizeMathSource } from "./mathRendering";

export type RichQuestionNode =
  | { type: "text"; value: string }
  | { type: "inlineMath"; value: string }
  | { type: "blockMath"; value: string }
  | { type: "lineBreak" }
  | { type: "image"; url: string; placement: "statement" | "option" };

const RICH_DELIMITER = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([^\n]+?\\\)|\n)/g;

/**
 * Semantic source of truth for question layout. Delimiters—not formula height
 * or content heuristics—are the only thing that determines inline vs block.
 */
export function parseRichQuestionText(source?: string | null): RichQuestionNode[] {
  const value = normalizeMathSource(source ?? "");
  const nodes: RichQuestionNode[] = [];
  let cursor = 0;
  for (const match of Array.from(value.matchAll(RICH_DELIMITER))) {
    const index = match.index ?? 0;
    if (index > cursor) nodes.push({ type: "text", value: value.slice(cursor, index) });
    const token = match[0];
    if (token === "\n") nodes.push({ type: "lineBreak" });
    else if (token.startsWith("$$")) nodes.push({ type: "blockMath", value: token.slice(2, -2) });
    else if (token.startsWith("\\[")) nodes.push({ type: "blockMath", value: token.slice(2, -2) });
    else if (token.startsWith("\\(")) nodes.push({ type: "inlineMath", value: token.slice(2, -2) });
    else nodes.push({ type: "inlineMath", value: token.slice(1, -1) });
    cursor = index + token.length;
  }
  if (cursor < value.length) nodes.push({ type: "text", value: value.slice(cursor) });
  return nodes;
}

export function buildQuestionRichContent(input: {
  statement?: string | null;
  imageUrl?: string | null;
  statementAfterImage?: string | null;
}): RichQuestionNode[] {
  return [
    ...parseRichQuestionText(input.statement),
    ...(input.imageUrl ? [{ type: "image" as const, url: input.imageUrl, placement: "statement" as const }] : []),
    ...parseRichQuestionText(input.statementAfterImage),
  ];
}

export function serializeRichQuestionText(nodes: RichQuestionNode[]) {
  return nodes.map(node => {
    if (node.type === "text") return node.value;
    if (node.type === "lineBreak") return "\n";
    if (node.type === "inlineMath") return `$${node.value}$`;
    if (node.type === "blockMath") return `$$${node.value}$$`;
    return "";
  }).join("");
}

export function groupRichQuestionContent(nodes: RichQuestionNode[]) {
  const groups: Array<{ type: "content"; nodes: RichQuestionNode[] } | Extract<RichQuestionNode, { type: "image" }>> = [];
  let content: RichQuestionNode[] = [];
  const flush = () => { if (content.length) groups.push({ type: "content", nodes: content }); content = []; };
  for (const node of nodes) {
    if (node.type === "image") { flush(); groups.push(node); }
    else content.push(node);
  }
  flush(); return groups;
}
