import { convert } from "@aer/adapter-claude-code";
import { parseAER } from "@aer/core";
import { renderHTML } from "./render.js";

const dropzone = document.querySelector<HTMLElement>("[data-dropzone]");
const fileInput = document.querySelector<HTMLInputElement>("[data-file-input]");
const output = document.querySelector<HTMLIFrameElement>("[data-output]");
const status = document.querySelector<HTMLElement>("[data-status]");
const exampleButton = document.querySelector<HTMLButtonElement>("[data-example]");

dropzone?.addEventListener("click", () => fileInput?.click());
dropzone?.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.dataset.active = "true";
});
dropzone?.addEventListener("dragleave", () => {
  delete dropzone.dataset.active;
});
dropzone?.addEventListener("drop", (event) => {
  event.preventDefault();
  delete dropzone.dataset.active;
  const file = event.dataTransfer?.files[0];
  if (file) void renderFile(file);
});
fileInput?.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) void renderFile(file);
});
exampleButton?.addEventListener("click", () => {
  void renderExample();
});

async function renderFile(file: File): Promise<void> {
  setStatus(`Reading ${file.name}...`);
  const text = await file.text();
  renderText(text, file.name);
}

async function renderExample(): Promise<void> {
  setStatus("Loading example...");
  const response = await fetch("./daily-research.jsonl");
  if (!response.ok) throw new Error(`Could not load example: ${response.status}`);
  renderText(await response.text(), "daily-research.jsonl");
}

function renderText(text: string, name: string): void {
  try {
    const aer = name.endsWith(".aer.json")
      ? parseAER(JSON.parse(text))
      : convert(text, { rawPath: name });
    const html = renderHTML(aer);
    if (output) {
      output.srcdoc = html;
      output.hidden = false;
    }
    setStatus(`Rendered ${name}`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
  }
}

function setStatus(message: string, isError = false): void {
  if (!status) return;
  status.textContent = message;
  status.dataset.error = isError ? "true" : "false";
}
