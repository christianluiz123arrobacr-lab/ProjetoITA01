import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
const root = process.cwd();
const mock = path.join(root, "tools/billing-preview/mocks.ts");
export default defineConfig({
  root: path.join(root, "tools/billing-preview"),
  envDir: false,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      ...[
        "@/hooks/useSupabaseAuth",
        "@/services/billing.service",
        "@/lib/trpc",
        "@/lib/supabase",
        "@/lib/referralHint",
      ].map(find => ({ find, replacement: mock })),
      { find: "@", replacement: path.join(root, "client/src") },
      { find: "@shared", replacement: path.join(root, "shared") },
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 5197,
    strictPort: true,
    hmr: false,
    fs: { allow: [root] },
    headers: {
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws://127.0.0.1:5197; form-action 'none'; frame-src 'self'; base-uri 'self'",
    },
  },
  publicDir: path.join(root, "client/public"),
});
