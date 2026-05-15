#!/usr/bin/env node
import { Command } from "commander";
import { runConvert } from "./commands/convert.js";
import { runView } from "./commands/view.js";

const program = new Command();

program
  .name("aer")
  .description("Convert agent logs into Agent Execution Records.")
  .version("0.1.0");

program
  .command("convert")
  .argument("<input.jsonl>", "Claude Code JSONL file")
  .option("-o, --output <output.aer.json>", "write AER JSON to a file")
  .option("--with-disk", "read files from disk when the trace lacks before content")
  .action((input: string, options: { output?: string; withDisk?: boolean }) => {
    runConvert(input, {
      ...(options.output ? { output: options.output } : {}),
      ...(options.withDisk ? { withDisk: true } : {}),
    });
  });

program
  .command("view")
  .argument("<input>", "Claude Code JSONL or AER JSON file")
  .option("-o, --output <output.html>", "write rendered HTML to a file")
  .option("--open", "open the rendered HTML in the system browser")
  .action((input: string, options: { output?: string; open?: boolean }) => {
    runView(input, {
      ...(options.output ? { output: options.output } : {}),
      ...(options.open ? { open: true } : {}),
    });
  });

program.parse();
