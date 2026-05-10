import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import { convert } from "@aer/adapter-claude-code";
import { parseAER } from "@aer/core";

export interface ConvertCommandOptions {
  output?: string;
  withDisk?: boolean;
}

export function runConvert(input: string, opts: ConvertCommandOptions = {}): void {
  let jsonl: string;
  try {
    jsonl = readFileSync(input, "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`aer: cannot read '${input}': ${msg}\n`);
    process.exit(1);
  }

  let aer: ReturnType<typeof parseAER>;
  try {
    const convertOptions = {
      rawPath: basename(input),
      ...(opts.withDisk ? { withDisk: true } : {}),
    };
    aer = parseAER(convert(jsonl, convertOptions));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`aer: conversion failed: ${msg}\n`);
    process.exit(1);
  }

  const serialized = `${JSON.stringify(aer, null, 2)}\n`;

  if (opts.output) {
    try {
      mkdirSync(dirname(opts.output), { recursive: true });
      writeFileSync(opts.output, serialized);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`aer: cannot write '${opts.output}': ${msg}\n`);
      process.exit(1);
    }
    process.stderr.write(`Wrote ${opts.output}\n`);
    return;
  }

  process.stdout.write(serialized);
}
