import type { IncomingMessage, ServerResponse } from "node:http";
import { listPublicSitemapEntries, PUBLIC_SITE_ORIGIN } from "../server/publicQuestions.js";

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!);
export function buildSitemapXml(entries: Array<{ slug: string; lastmod: string | null }>) {
  const staticUrls = ["/", "/planos", "/login", "/cadastro"];
  const urls = staticUrls.map((path) => `  <url><loc>${PUBLIC_SITE_ORIGIN}${path}</loc></url>`).concat(entries.map((entry) => `  <url><loc>${escapeXml(`${PUBLIC_SITE_ORIGIN}/questoes/${entry.slug}`)}</loc>${entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod.slice(0, 10))}</lastmod>` : ""}</url>`));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
export default async function sitemap(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") { res.statusCode = 405; res.end(); return; }
  try { const xml = buildSitemapXml(await listPublicSitemapEntries()); res.statusCode = 200; res.setHeader("Content-Type", "application/xml; charset=utf-8"); res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600"); res.end(req.method === "HEAD" ? undefined : xml); }
  catch (error) { console.error("[sitemap]", error instanceof Error ? error.message : error); res.statusCode = 503; res.setHeader("Content-Type", "text/plain; charset=utf-8"); res.end("Sitemap temporariamente indisponível."); }
}
