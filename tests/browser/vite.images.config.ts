import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "../..");
export default defineConfig({
  root: import.meta.dirname,
  publicDir: path.join(root, "client/public"),
  plugins: [react(), tailwind()],
  resolve: {
    alias: [
      {
        find: "@/hooks/useSupabaseAuth",
        replacement: path.join(import.meta.dirname, "imageMocks.ts"),
      },
      {
        find: "@/lib/trpc",
        replacement: path.join(import.meta.dirname, "imageMocks.ts"),
      },
      {
        find: "@/components/question-notes/QuestionScratchpad",
        replacement: path.join(import.meta.dirname, "imageMocks.ts"),
      },
      { find: "@", replacement: path.join(root, "client/src") },
      { find: "@shared", replacement: path.join(root, "shared") },
    ],
  },
  server: { host: "127.0.0.1", port: 5192, fs: { allow: [root] } },
});
