import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { ServerResponse } from "node:http";
import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "../_core/supabaseAdmin.js";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const NOTEBOOK_MIME = "application/vnd.projeto-vetor.notebook+json";
const FOLDER_NAME = "Projeto Vetor - Cadernos";
const APP_PROPERTIES = {
  projetoVetorType: "notebook",
  projetoVetorVersion: "1",
};
const MAX_DOCUMENT_BYTES = 8_000_000;
const OAUTH_COOKIE = "pv_google_drive_pkce";

type ConnectionRow = {
  user_id: string;
  encrypted_refresh_token: string;
  google_account_email: string | null;
  folder_id: string | null;
};
export type NotebookDocument = {
  version: 1;
  name: string;
  createdAt: string;
  modifiedAt: string;
  paper: { size: "a5" | "a4" | "a3" | "infinite"; lined: boolean };
  pages: Array<{ id: string; elements: unknown[] }>;
};
export type NotebookSummary = {
  id: string;
  name: string;
  modifiedTime: string;
  paper: NotebookDocument["paper"];
  version: string;
};

function required(
  name:
    | "GOOGLE_DRIVE_CLIENT_ID"
    | "GOOGLE_DRIVE_CLIENT_SECRET"
    | "GOOGLE_DRIVE_REDIRECT_URI"
    | "GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY"
) {
  const value = process.env[name];
  if (!value) {
    console.error(`[google-drive] variável ausente: ${name}`);
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "A conexão com o Google Drive ainda não está configurada.",
    });
  }
  return value;
}
function encryptionKey() {
  const raw = required("GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY");
  const decoded = Buffer.from(raw, "base64");
  return decoded.length === 32
    ? decoded
    : createHash("sha256").update(raw).digest();
}
export function encryptGoogleToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}
export function decryptGoogleToken(payload: string) {
  const [version, iv, tag, data] = payload.split(".");
  if (version !== "v1" || !iv || !tag || !data)
    throw new Error("invalid encrypted token");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(iv, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function stateSecret() {
  return createHash("sha256")
    .update(required("GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY") + ":oauth-state")
    .digest();
}
function signState(payload: object) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", stateSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}
function verifyState(value: string) {
  const [body, signature] = value.split(".");
  if (!body || !signature) throw new Error("invalid state");
  const expected = createHmac("sha256", stateSecret()).update(body).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    throw new Error("invalid state");
  const payload = JSON.parse(
    Buffer.from(body, "base64url").toString("utf8")
  ) as { userId?: unknown; exp?: unknown; nonce?: unknown };
  if (
    typeof payload.userId !== "string" ||
    typeof payload.exp !== "number" ||
    payload.exp < Date.now() ||
    typeof payload.nonce !== "string"
  )
    throw new Error("expired state");
  return payload as { userId: string; exp: number; nonce: string };
}
function parseCookies(header?: string) {
  return Object.fromEntries(
    (header ?? "")
      .split(";")
      .map(part => part.trim().split("="))
      .filter(parts => parts.length === 2)
      .map(([key, value]) => [key, decodeURIComponent(value)])
  );
}

export function createGoogleDriveConnectUrl(
  userId: string,
  res: ServerResponse
) {
  const redirectUri = required("GOOGLE_DRIVE_REDIRECT_URI");
  const verifier = randomBytes(48).toString("base64url");
  const nonce = randomBytes(18).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const cookieValue = Buffer.from(
    JSON.stringify({ verifier, nonce, exp: Date.now() + 10 * 60_000 })
  ).toString("base64url");
  res.setHeader(
    "Set-Cookie",
    `${OAUTH_COOKIE}=${cookieValue}; HttpOnly; ${redirectUri.startsWith("https://") ? "Secure; " : ""}SameSite=Lax; Path=/api/google-drive/callback; Max-Age=600`
  );
  const params = new URLSearchParams({
    client_id: required("GOOGLE_DRIVE_CLIENT_ID"),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: DRIVE_SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: signState({ userId, nonce, exp: Date.now() + 10 * 60_000 }),
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}
async function tokenRequest(params: URLSearchParams) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!response.ok) throw new Error(`google token ${response.status}`);
  return (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
}
export async function handleGoogleDriveCallback(
  query: { code?: string; state?: string },
  cookieHeader?: string
) {
  if (!query.code || !query.state) throw new Error("missing oauth callback");
  const state = verifyState(query.state);
  const cookie = parseCookies(cookieHeader)[OAUTH_COOKIE];
  if (!cookie) throw new Error("missing pkce cookie");
  const pkce = JSON.parse(
    Buffer.from(cookie, "base64url").toString("utf8")
  ) as { verifier?: unknown; nonce?: unknown; exp?: unknown };
  if (
    typeof pkce.verifier !== "string" ||
    pkce.nonce !== state.nonce ||
    typeof pkce.exp !== "number" ||
    pkce.exp < Date.now()
  )
    throw new Error("invalid pkce cookie");
  const tokens = await tokenRequest(
    new URLSearchParams({
      code: query.code,
      client_id: required("GOOGLE_DRIVE_CLIENT_ID"),
      client_secret: required("GOOGLE_DRIVE_CLIENT_SECRET"),
      redirect_uri: required("GOOGLE_DRIVE_REDIRECT_URI"),
      grant_type: "authorization_code",
      code_verifier: pkce.verifier,
    })
  );
  if (!tokens.refresh_token) throw new Error("missing refresh token");
  const { error } = await supabaseAdmin.from("google_drive_connections").upsert(
    {
      user_id: state.userId,
      encrypted_refresh_token: encryptGoogleToken(tokens.refresh_token),
      token_expiry: new Date(
        Date.now() + (tokens.expires_in ?? 3600) * 1000
      ).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw new Error("connection persistence failed");
}
async function connection(userId: string): Promise<ConnectionRow> {
  const { data, error } = await supabaseAdmin
    .from("google_drive_connections")
    .select("user_id, encrypted_refresh_token, google_account_email, folder_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data)
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Conecte novamente seu Google Drive.",
    });
  return data as ConnectionRow;
}
async function accessToken(userId: string) {
  const row = await connection(userId);
  try {
    const token = await tokenRequest(
      new URLSearchParams({
        client_id: required("GOOGLE_DRIVE_CLIENT_ID"),
        client_secret: required("GOOGLE_DRIVE_CLIENT_SECRET"),
        refresh_token: decryptGoogleToken(row.encrypted_refresh_token),
        grant_type: "refresh_token",
      })
    );
    return { token: token.access_token, row };
  } catch {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Sua conexão com o Google Drive expirou. Reconecte sua conta.",
    });
  }
}
async function driveFetch(token: string, url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: { authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  if (!response.ok) {
    if (response.status === 401)
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Reconecte seu Google Drive.",
      });
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Não foi possível acessar seu Google Drive agora.",
    });
  }
  return response;
}
async function ensureFolder(userId: string, token: string, row: ConnectionRow) {
  if (row.folder_id) return row.folder_id;
  const query = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const found = (await (
    await driveFetch(
      token,
      `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id)&pageSize=1`
    )
  ).json()) as { files?: Array<{ id: string }> };
  let folderId = found.files?.[0]?.id;
  if (!folderId) {
    const created = (await (
      await driveFetch(
        token,
        "https://www.googleapis.com/drive/v3/files?fields=id",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: FOLDER_NAME,
            mimeType: "application/vnd.google-apps.folder",
          }),
        }
      )
    ).json()) as { id: string };
    folderId = created.id;
  }
  await supabaseAdmin
    .from("google_drive_connections")
    .update({ folder_id: folderId, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  return folderId;
}
export function safeNotebookName(name: string) {
  const normalized = name.trim().replace(/\s+/g, " ");
  if (
    !normalized ||
    normalized.length > 80 ||
    /[\\/:*?"<>|\u0000-\u001f]/.test(normalized)
  )
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Use um nome válido com até 80 caracteres.",
    });
  return normalized;
}
function assertDocumentSize(document: NotebookDocument) {
  const body = JSON.stringify(document);
  if (Buffer.byteLength(body, "utf8") > MAX_DOCUMENT_BYTES)
    throw new TRPCError({
      code: "PAYLOAD_TOO_LARGE",
      message: "Este caderno ultrapassou o limite de tamanho.",
    });
  return body;
}
export function isProjectVetorNotebookMetadata(metadata: {
  mimeType?: string;
  appProperties?: Record<string, string>;
  trashed?: boolean;
}) {
  return (
    !metadata.trashed &&
    metadata.mimeType === NOTEBOOK_MIME &&
    metadata.appProperties?.projetoVetorType === "notebook" &&
    metadata.appProperties?.projetoVetorVersion === "1"
  );
}
async function ownedFile(userId: string, fileId: string) {
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(fileId))
    throw new TRPCError({ code: "BAD_REQUEST", message: "Caderno inválido." });
  const { token } = await accessToken(userId);
  const metadata = (await (
    await driveFetch(
      token,
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,appProperties,modifiedTime,trashed`
    )
  ).json()) as {
    id: string;
    mimeType: string;
    appProperties?: Record<string, string>;
    modifiedTime: string;
    trashed?: boolean;
  };
  if (!isProjectVetorNotebookMetadata(metadata))
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Este arquivo não é um caderno válido do Projeto Vetor.",
    });
  return { token, metadata };
}
function multipart(metadata: object, body: string) {
  const boundary = `pv-${randomBytes(12).toString("hex")}`;
  return {
    contentType: `multipart/related; boundary=${boundary}`,
    body: `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${NOTEBOOK_MIME}\r\n\r\n${body}\r\n--${boundary}--`,
  };
}

export async function googleDriveStatus(userId: string) {
  const { data } = await supabaseAdmin
    .from("google_drive_connections")
    .select("google_account_email, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  return {
    connected: Boolean(data),
    accountEmail: data?.google_account_email ?? null,
  };
}
export async function disconnectGoogleDrive(userId: string) {
  await supabaseAdmin
    .from("google_drive_connections")
    .delete()
    .eq("user_id", userId);
  return { success: true };
}
export async function listNotebooks(
  userId: string
): Promise<NotebookSummary[]> {
  const { token } = await accessToken(userId);
  const query = encodeURIComponent(
    `appProperties has { key='projetoVetorType' and value='notebook' } and trashed=false`
  );
  const data = (await (
    await driveFetch(
      token,
      `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id,name,modifiedTime,appProperties)&orderBy=modifiedTime desc`
    )
  ).json()) as {
    files?: Array<{
      id: string;
      name: string;
      modifiedTime: string;
      appProperties?: Record<string, string>;
    }>;
  };
  return (data.files ?? []).map(file => ({
    id: file.id,
    name: file.name.replace(/\.projeto-vetor\.json$/, ""),
    modifiedTime: file.modifiedTime,
    paper: {
      size:
        (file.appProperties?.paperSize as NotebookDocument["paper"]["size"]) ||
        "a4",
      lined: file.appProperties?.lined === "true",
    },
    version: file.appProperties?.projetoVetorVersion ?? "1",
  }));
}
export async function createNotebook(
  userId: string,
  name: string,
  paper: NotebookDocument["paper"]
) {
  const safe = safeNotebookName(name);
  const { token, row } = await accessToken(userId);
  const folderId = await ensureFolder(userId, token, row);
  const now = new Date().toISOString();
  const document: NotebookDocument = {
    version: 1,
    name: safe,
    createdAt: now,
    modifiedAt: now,
    paper,
    pages: [{ id: randomBytes(10).toString("hex"), elements: [] }],
  };
  const upload = multipart(
    {
      name: `${safe}.projeto-vetor.json`,
      parents: [folderId],
      mimeType: NOTEBOOK_MIME,
      appProperties: {
        ...APP_PROPERTIES,
        paperSize: paper.size,
        lined: String(paper.lined),
      },
    },
    assertDocumentSize(document)
  );
  const created = (await (
    await driveFetch(
      token,
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime",
      {
        method: "POST",
        headers: { "content-type": upload.contentType },
        body: upload.body,
      }
    )
  ).json()) as { id: string; modifiedTime: string };
  return { id: created.id, document, modifiedTime: created.modifiedTime };
}
export async function getNotebook(userId: string, fileId: string) {
  const { token, metadata } = await ownedFile(userId, fileId);
  const response = await driveFetch(
    token,
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`
  );
  const document = (await response.json()) as NotebookDocument;
  if (document.version !== 1 || !Array.isArray(document.pages))
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "O caderno possui um formato incompatível.",
    });
  return { document, modifiedTime: metadata.modifiedTime };
}
export async function updateNotebook(
  userId: string,
  fileId: string,
  document: NotebookDocument,
  expectedModifiedTime: string,
  force = false
) {
  const { token, metadata } = await ownedFile(userId, fileId);
  if (!force && metadata.modifiedTime !== expectedModifiedTime)
    throw new TRPCError({
      code: "CONFLICT",
      message: "Este caderno foi alterado em outro dispositivo.",
    });
  const now = new Date().toISOString();
  const updated = {
    ...document,
    name: safeNotebookName(document.name),
    modifiedAt: now,
  };
  const upload = multipart(
    {
      name: `${updated.name}.projeto-vetor.json`,
      appProperties: {
        ...APP_PROPERTIES,
        paperSize: updated.paper.size,
        lined: String(updated.paper.lined),
      },
    },
    assertDocumentSize(updated)
  );
  const result = (await (
    await driveFetch(
      token,
      `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=multipart&fields=id,modifiedTime`,
      {
        method: "PATCH",
        headers: { "content-type": upload.contentType },
        body: upload.body,
      }
    )
  ).json()) as { id: string; modifiedTime: string };
  return {
    id: result.id,
    modifiedTime: result.modifiedTime,
    document: updated,
  };
}
export async function renameNotebook(
  userId: string,
  fileId: string,
  name: string
) {
  const { token } = await ownedFile(userId, fileId);
  const safe = safeNotebookName(name);
  await driveFetch(
    token,
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: `${safe}.projeto-vetor.json` }),
    }
  );
  return { id: fileId, name: safe };
}
export async function trashNotebook(userId: string, fileId: string) {
  const { token } = await ownedFile(userId, fileId);
  await driveFetch(
    token,
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,trashed`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trashed: true }),
    }
  );
  return { id: fileId, trashed: true };
}
