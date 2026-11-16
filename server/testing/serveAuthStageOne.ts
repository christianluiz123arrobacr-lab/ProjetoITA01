import { createServer } from "vite";
import config from "../../vite.config";
import path from "node:path";
async function main() {
const server = await createServer({ ...config, configFile: false, plugins: [{
  name: "local-auth-fixture-only", enforce: "pre",
  resolveId(id, importer) {
    if (id === "./supabase" && importer?.replace(/\\/g, "/").endsWith("/lib/authSession.ts")) return path.resolve("client/src/testing/authStageOneSdk.ts");
  },
}, ...config.plugins ?? []], server: { ...config.server, host: "127.0.0.1", port: 5179, strictPort: true } });
await server.listen();
console.info("Local mock-only fixture: http://127.0.0.1:5179/__tests__/auth-stage-one.html");
}
void main().catch(() => { console.error("Não foi possível iniciar a fixture local."); process.exitCode = 1; });
