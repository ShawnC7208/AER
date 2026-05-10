import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@aer/core": fileURLToPath(new URL("../core/src/index.ts", import.meta.url)),
    },
  },
});
