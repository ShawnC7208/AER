import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@aer/core": fileURLToPath(new URL("../core/src/index.ts", import.meta.url)),
      "@aer/adapter-claude-code": fileURLToPath(
        new URL("../adapter-claude-code/src/index.ts", import.meta.url),
      ),
    },
  },
});
