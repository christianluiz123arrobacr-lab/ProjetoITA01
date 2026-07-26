import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleGoogleDriveCallback } from "../../server/googleDrive/googleDriveService.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Método não permitido." });
    return;
  }
  try {
    await handleGoogleDriveCallback(
      {
        code: typeof req.query.code === "string" ? req.query.code : undefined,
        state:
          typeof req.query.state === "string" ? req.query.state : undefined,
      },
      req.headers.cookie
    );
    res.setHeader(
      "Set-Cookie",
      "pv_google_drive_pkce=; HttpOnly; Secure; SameSite=Lax; Path=/api/google-drive/callback; Max-Age=0"
    );
    res.redirect(302, "/caderno?drive=connected");
  } catch (error) {
    console.error(
      "[google-drive] callback failed",
      error instanceof Error ? error.message : "unknown"
    );
    res.redirect(302, "/caderno?drive=error");
  }
}
