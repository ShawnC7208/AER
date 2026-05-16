import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, sep } from "node:path";
import { convert } from "@aer/adapter-claude-code";
import { parseAER } from "@aer/core";
import { errorMessage, fail, isDirectory, readFileIfExists, readTextFile } from "./shared.js";

export interface ConvertCommandOptions {
  output?: string;
  withDisk?: boolean;
}

export function runConvert(input: string, opts: ConvertCommandOptions = {}): void {
  if (isDirectory(input)) {
    runConvertDirectory(input, opts);
    return;
  }

  const aer = convertFile(input, opts);
  const serialized = `${JSON.stringify(aer, null, 2)}\n`;

  if (opts.output) {
    writeOutput(opts.output, serialized);
    return;
  }

  process.stdout.write(serialized);
}

function runConvertDirectory(input: string, opts: ConvertCommandOptions): void {
  const files = findJsonlFiles(input);
  if (files.length === 0) fail(`no .jsonl files found in '${input}'`);

  const outputDir = opts.output ?? "aer-out";
  let written = 0;
  for (const file of files) {
    const aer = convertFile(file, opts, relativeRawPath(input, file));
    const output = join(outputDir, `${safeRelativeStem(input, file)}.aer.json`);
    writeOutput(output, `${JSON.stringify(aer, null, 2)}\n`);
    written += 1;
  }
  process.stderr.write(`Converted ${written} file${written === 1 ? "" : "s"} to ${outputDir}\n`);
}

function convertFile(
  input: string,
  opts: ConvertCommandOptions,
  rawPath = basename(input),
): ReturnType<typeof parseAER> {
  const jsonl = readTextFile(input);
  let aer: ReturnType<typeof parseAER>;
  try {
    const convertOptions = {
      rawPath,
      ...(opts.withDisk ? { withDisk: true } : {}),
      ...(opts.withDisk ? { readFile: readFileIfExists } : {}),
    };
    aer = parseAER(convert(jsonl, convertOptions));
  } catch (err) {
    fail(`conversion failed for '${input}': ${errorMessage(err)}`);
  }
  return aer;
}

function findJsonlFiles(dir: string): string[] {
  const found: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...findJsonlFiles(path));
    } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
      found.push(path);
    }
  }
  return found.sort((a, b) => a.localeCompare(b));
}

function safeRelativeStem(root: string, file: string): string {
  return relativeRawPath(root, file)
    .replace(/\.jsonl$/, "")
    .split("/")
    .join("__");
}

function relativeRawPath(root: string, file: string): string {
  return relative(root, file).split(sep).join("/");
}

function writeOutput(output: string, serialized: string): void {
  try {
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, serialized);
  } catch (err) {
    fail(`cannot write '${output}': ${errorMessage(err)}`);
  }
  process.stderr.write(`Wrote ${output}\n`);
}
