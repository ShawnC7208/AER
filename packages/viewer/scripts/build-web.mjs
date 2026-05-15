import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const output = resolve(root, "examples/dist/browser.js");

await mkdir(dirname(output), { recursive: true });
await esbuild.build({
  entryPoints: [resolve(root, "packages/viewer/src/browser.ts")],
  outfile: output,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  sourcemap: true,
  logLevel: "info",
  plugins: [
    {
      name: "workspace-source",
      setup(build) {
        build.onResolve({ filter: /^@aer\/core$/ }, () => ({
          path: resolve(root, "packages/core/src/index.ts"),
        }));
        build.onResolve({ filter: /^@aer\/adapter-claude-code$/ }, () => ({
          path: resolve(root, "packages/adapter-claude-code/src/index.ts"),
        }));
      },
    },
  ],
});
