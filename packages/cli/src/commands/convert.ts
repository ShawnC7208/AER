import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { convert } from "@aer/adapter-claude-code";
import { parseAER } from "@aer/core";

export interface ConvertCommandOptions {
  output?: string;
  withDisk?: boolean;
}

export function runConvert(input: string, opts: ConvertCommandOptions = {}): void {
  const jsonl = readFileSync(input, "utf8");
  const convertOptions = { rawPath: basename(input), ...(opts.withDisk ? { withDisk: true } : {}) };
  const aer = parseAER(convert(jsonl, convertOptions));
  const serialized = `${JSON.stringify(aer, null, 2)}\n`;

  if (opts.output) {
    writeFileSync(opts.output, serialized);
    process.stderr.write(`Wrote ${opts.output}\n`);
    return;
  }

  process.stdout.write(serialized);
}
