import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname } from "node:path";
import { pathToFileURL } from "node:url";
import { convert } from "@aer/adapter-claude-code";
import { parseAER } from "@aer/core";
import { renderHTML } from "@aer/viewer";

export interface ViewCommandOptions {
  output?: string;
  open?: boolean;
}

export function runView(input: string, opts: ViewCommandOptions = {}): void {
  let source: string;
  try {
    source = readFileSync(input, "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`aer: cannot read '${input}': ${msg}\n`);
    process.exit(1);
  }

  let html: string;
  try {
    const aer = input.endsWith(".aer.json")
      ? parseAER(JSON.parse(source))
      : convert(source, { rawPath: basename(input) });
    html = renderHTML(aer);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`aer: render failed: ${msg}\n`);
    process.exit(1);
  }

  const output = opts.output ?? defaultOutputPath(input);
  try {
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, html);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`aer: cannot write '${output}': ${msg}\n`);
    process.exit(1);
  }

  process.stderr.write(`Wrote ${output}\n`);
  if (opts.open) openHtml(output);
}

function defaultOutputPath(input: string): string {
  if (input.endsWith(".aer.json")) return input.replace(/\.aer\.json$/, ".aer.html");
  const extension = extname(input);
  return extension ? `${input.slice(0, -extension.length)}.aer.html` : `${input}.aer.html`;
}

function openHtml(path: string): void {
  const url = pathToFileURL(path).toString();
  const command =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];

  if (!existsSync(path)) {
    process.stderr.write(`aer: cannot open '${path}': file does not exist\n`);
    return;
  }
  const child = spawn(command, args, { detached: true, stdio: "ignore" });
  child.unref();
}
