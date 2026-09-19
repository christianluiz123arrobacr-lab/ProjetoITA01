import type { IncomingMessage, ServerResponse } from "node:http";
import { createContext } from "../../server/_core/context.js";

export default async function publicQuestionSession(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.end(JSON.stringify({ authenticated: false }));
    return;
  }
  const context = await createContext({ req, res });
  res.statusCode = context.user ? 200 : 401;
  res.end(JSON.stringify({ authenticated: Boolean(context.user) }));
}
