import "dotenv/config";
import { randomUUID } from "node:crypto";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { supabaseAdmin } from "./supabaseAdmin";
import { serveStatic, setupVite } from "./vite";
import { registerGoogleDriveRoutes } from "../googleDrive/googleDriveRoutes.js";
import { runBillingReminderJob } from "../billing/whatsappReminders.js";

const READINESS_TIMEOUT_MS = 3_000;

async function canReachDatabase() {
  const readinessCheck = supabaseAdmin
    .from("profiles")
    .select("id", { head: true })
    .limit(1);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error("database readiness timeout")),
        READINESS_TIMEOUT_MS
      );
    });

    const { error } = await Promise.race([readinessCheck, timeout]);
    return !error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use((req, res, next) => {
    const requestId = req.header("x-request-id") || randomUUID();
    const startedAt = Date.now();

    res.setHeader("x-request-id", requestId);
    res.on("finish", () => {
      if (!req.path.startsWith("/api/")) return;

      console.info(
        JSON.stringify({
          event: "http_request",
          requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt,
        })
      );
    });

    next();
  });

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/cron/billing-reminders", async (req, res) => {
    const secret = process.env.CRON_SECRET;
    const provided = req.header("authorization")?.replace(/^Bearer\s+/i, "") ?? req.query.secret;
    if (!secret || provided !== secret) { res.status(401).json({ error: "unauthorized" }); return; }
    try { res.status(200).json(await runBillingReminderJob()); }
    catch (error) { console.error("[billing-reminders] failed", error); res.status(500).json({ error: "billing_reminders_failed" }); }
  });

  app.get("/api/ready", async (_req, res) => {
    try {
      const databaseReady = await canReachDatabase();

      if (!databaseReady) {
        res.status(503).json({ status: "unavailable" });
        return;
      }

      res.status(200).json({ status: "ready" });
    } catch (error) {
      console.error("[readiness] database check failed", error);
      res.status(503).json({ status: "unavailable" });
    }
  });

  // Keep request bodies bounded. Larger uploads should use signed storage flows.
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  registerGoogleDriveRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
