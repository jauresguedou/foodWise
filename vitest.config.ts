import { defineConfig } from "vitest/config";
import path from "node:path";

// Vitest needs the same alias resolution Next.js uses.
// This keeps the test environment consistent with the app code and avoids false failures.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
