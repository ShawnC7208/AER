import { existsSync, readFileSync, statSync } from "node:fs";
import { basename } from "node:path";
import { convert } from "@aer/adapter-claude-code";
import { type AER, parseAER } from "@aer/core";

export function readTextFile(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch (err) {
    fail(`cannot read '${path}': ${errorMessage(err)}`);
  }
}

export function loadAER(input: string): AER {
  let source: string;
  try {
    source = readFileSync(input, "utf8");
  } catch (err) {
    throw new Error(`cannot read '${input}': ${errorMessage(err)}`);
  }

  try {
    if (input.endsWith(".aer.json")) return parseAER(JSON.parse(source));
    return parseAER(convert(source, { rawPath: basename(input) }));
  } catch (err) {
    throw new Error(`cannot load '${input}': ${errorMessage(err)}`);
  }
}

export function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

export function readFileIfExists(path: string): string | undefined {
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function fail(message: string): never {
  process.stderr.write(`aer: ${message}\n`);
  process.exit(1);
}
