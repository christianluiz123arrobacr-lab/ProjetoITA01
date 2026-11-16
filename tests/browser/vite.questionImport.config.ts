import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "../.."),
  mock = path.join(import.meta.dirname, "questionImportMocks.tsx");
export default defineConfig({
  root: import.meta.dirname,
  publicDir: false,
  plugins: [react(), tailwind()],
  resolve: {
    alias: [
      { find: "@/components/admin/AdminGuard", replacement: mock },
      { find: "@/components/admin/AdminLayout", replacement: mock },
      { find: "@/lib/trpc", replacement: mock },
      { find: "@/lib/signedStorageUpload", replacement: mock },
      { find: "@", replacement: path.join(root, "client/src") },
      { find: "@shared", replacement: path.join(root, "shared") },
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 5195,
    strictPort: true,
    fs: { allow: [root] },
  },
});
