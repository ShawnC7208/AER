import { generateKeyPairSync } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { convert } from "@aer/adapter-claude-code";
import { describe, expect, it, vi } from "vitest";
import { runSign } from "../src/commands/sign.js";
import { runVerify } from "../src/commands/verify.js";

describe("@aer/cli verify and sign", () => {
  it("verifies an AER against its source JSONL", () => {
    const dir = mkdtempSync(join(tmpdir(), "aer-verify-valid-"));
    const jsonlPath = join(dir, "input.jsonl");
    const aerPath = join(dir, "input.aer.json");
    const source = jsonl();
    writeFileSync(jsonlPath, source);
    writeFileSync(aerPath, `${JSON.stringify(convert(source, { rawPath: "input.jsonl" }))}\n`);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    runVerify(aerPath, jsonlPath);

    expect(stdout.mock.calls.join("")).toContain("Verified AER:");
    stdout.mockRestore();
  });

  it("detects a modified JSONL line", () => {
    const dir = mkdtempSync(join(tmpdir(), "aer-verify-jsonl-tamper-"));
    const jsonlPath = join(dir, "input.jsonl");
    const aerPath = join(dir, "input.aer.json");
    const source = jsonl();
    writeFileSync(jsonlPath, source.replace("verify this", "verify that"));
    writeFileSync(aerPath, `${JSON.stringify(convert(source, { rawPath: "input.jsonl" }))}\n`);
    const exit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("exit:1");
    }) as never);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    expect(() => runVerify(aerPath, jsonlPath)).toThrow("exit:1");
    expect(stderr.mock.calls.join("")).toContain("raw.sha256");
    expect(stderr.mock.calls.join("")).toContain("recordHash");

    exit.mockRestore();
    stderr.mockRestore();
  });

  it("detects a modified AER manifest payload", () => {
    const dir = mkdtempSync(join(tmpdir(), "aer-verify-aer-tamper-"));
    const jsonlPath = join(dir, "input.jsonl");
    const aerPath = join(dir, "input.aer.json");
    const source = jsonl();
    const aer = convert(source, { rawPath: "input.jsonl" });
    aer.run.goal = "tampered";
    writeFileSync(jsonlPath, source);
    writeFileSync(aerPath, `${JSON.stringify(aer)}\n`);
    const exit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("exit:1");
    }) as never);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    expect(() => runVerify(aerPath, jsonlPath)).toThrow("exit:1");
    expect(stderr.mock.calls.join("")).toContain("integrity.aerSha256");

    exit.mockRestore();
    stderr.mockRestore();
  });

  it("signs an AER and verifies the Ed25519 signature", () => {
    const dir = mkdtempSync(join(tmpdir(), "aer-sign-"));
    const jsonlPath = join(dir, "input.jsonl");
    const aerPath = join(dir, "input.aer.json");
    const keyPath = join(dir, "ed25519.pem");
    const source = jsonl();
    const { privateKey } = generateKeyPairSync("ed25519");
    writeFileSync(jsonlPath, source);
    writeFileSync(aerPath, `${JSON.stringify(convert(source, { rawPath: "input.jsonl" }))}\n`);
    writeFileSync(keyPath, privateKey.export({ type: "pkcs8", format: "pem" }).toString());
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    runSign(aerPath, { key: keyPath });
    runVerify(aerPath, jsonlPath);

    const signed = JSON.parse(readFileSync(aerPath, "utf8"));
    expect(signed.integrity.signature.algorithm).toBe("Ed25519");
    expect(stdout.mock.calls.join("")).toContain("Verified signed AER:");

    stdout.mockRestore();
    stderr.mockRestore();
  });

  it("rejects non-Ed25519 signing keys", () => {
    const dir = mkdtempSync(join(tmpdir(), "aer-sign-rsa-"));
    const aerPath = join(dir, "input.aer.json");
    const keyPath = join(dir, "rsa.pem");
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    writeFileSync(aerPath, `${JSON.stringify(convert(jsonl(), { rawPath: "input.jsonl" }))}\n`);
    writeFileSync(keyPath, privateKey.export({ type: "pkcs8", format: "pem" }).toString());
    const exit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("exit:1");
    }) as never);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    expect(() => runSign(aerPath, { key: keyPath })).toThrow("exit:1");
    expect(stderr.mock.calls.join("")).toContain("Ed25519");

    exit.mockRestore();
    stderr.mockRestore();
  });

  it("reports malformed signature material as a verification failure", () => {
    const dir = mkdtempSync(join(tmpdir(), "aer-verify-bad-signature-"));
    const jsonlPath = join(dir, "input.jsonl");
    const aerPath = join(dir, "input.aer.json");
    const source = jsonl();
    const aer = convert(source, { rawPath: "input.jsonl" });
    aer.integrity = {
      algorithm: "sha256",
      aerSha256: aer.integrity?.aerSha256 ?? "",
      signature: { algorithm: "Ed25519", publicKey: "not a pem", signature: "not base64" },
    };
    writeFileSync(jsonlPath, source);
    writeFileSync(aerPath, `${JSON.stringify(aer)}\n`);
    const exit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("exit:1");
    }) as never);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    expect(() => runVerify(aerPath, jsonlPath)).toThrow("exit:1");
    expect(stderr.mock.calls.join("")).toContain("integrity.signature");

    exit.mockRestore();
    stderr.mockRestore();
  });
});

function jsonl(): string {
  return [
    JSON.stringify({
      type: "user",
      timestamp: "2026-01-01T00:00:00.000Z",
      sessionId: "sample-session",
      message: { role: "user", content: "verify this" },
    }),
  ].join("\n");
}
