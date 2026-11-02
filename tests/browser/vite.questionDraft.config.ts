import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "../.."),
  mock = path.join(import.meta.dirname, "questionDraftMocks.ts");
export default defineConfig({
  root: import.meta.dirname,
  publicDir: path.join(root, "client/public"),
  plugins: [react(), tailwind()],
  resolve: {
    alias: [
      { find: "@/hooks/useSupabaseAuth", replacement: mock },
      { find: "@/lib/trpc", replacement: mock },
      { find: "@/lib/authSession", replacement: mock },
      { find: "@/services/question-notes.service", replacement: mock },
      {
        find: "@/components/question-notes/QuestionScratchpad",
        replacement: path.join(
          root,
          "client/src/components/question-notes/QuestionScratchpad.tsx"
        ),
      },
      { find: "@", replacement: path.join(root, "client/src") },
      { find: "@shared", replacement: path.join(root, "shared") },
    ],
  },
  server: { host: "127.0.0.1", port: 5194, fs: { allow: [root] } },
});
