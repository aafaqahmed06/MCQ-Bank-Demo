import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      // Mirrors tsconfig.json's "@/*" path so tests can use the same
      // import style as the rest of the codebase.
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
});
