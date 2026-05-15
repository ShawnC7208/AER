import { spawn } from "node:child_process";
import { existsSync, mkdirSync, unwatchFile, watchFile, writeFileSync } from "node:fs";
import { dirname, extname } from "node:path";
import { pathToFileURL } from "node:url";
import { renderHTML } from "@aer/viewer";
import { errorMessage, fail, isDirectory, loadAER } from "./shared.js";

export interface ViewCommandOptions {
  output?: string;
  open?: boolean;
  watch?: boolean;
  debounceMs?: number;
  watchPersistent?: boolean;
}

export interface WatchHandle {
  close(): void;
}

export function runView(input: string, opts: ViewCommandOptions = {}): WatchHandle | undefined {
  if (isDirectory(input)) fail("view accepts a single .jsonl or .aer.json file, not a directory");

  const output = opts.output ?? defaultOutputPath(input);
  const initialOk = renderToFile(input, output, true);
  if (!initialOk) process.exit(1);

  if (opts.open) openHtml(output);
  if (opts.watch) {
    return watchInput(input, output, opts.debounceMs ?? 150, opts.watchPersistent ?? true);
  }
  return undefined;
}

function renderToFile(input: string, output: string, fatal: boolean): boolean {
  let html: string;
  try {
    html = renderHTML(loadAER(input));
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, html);
  } catch (err) {
    const message = `render failed for '${input}': ${errorMessage(err)}`;
    if (fatal) fail(message);
    process.stderr.write(`aer: ${message}\n`);
    return false;
  }
  process.stderr.write(`Wrote ${output}\n`);
  return true;
}

function defaultOutputPath(input: string): string {
  if (input.endsWith(".aer.json")) return input.replace(/\.aer\.json$/, ".aer.html");
  const extension = extname(input);
  return extension ? `${input.slice(0, -extension.length)}.aer.html` : `${input}.aer.html`;
}

function watchInput(
  input: string,
  output: string,
  debounceMs: number,
  persistent: boolean,
): WatchHandle {
  let timer: NodeJS.Timeout | undefined;
  process.stderr.write(`Watching ${input}\n`);
  const listener = (): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      renderToFile(input, output, false);
    }, debounceMs);
  };
  watchFile(input, { interval: Math.max(debounceMs, 50), persistent }, listener);
  return {
    close() {
      if (timer) clearTimeout(timer);
      unwatchFile(input, listener);
    },
  };
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
