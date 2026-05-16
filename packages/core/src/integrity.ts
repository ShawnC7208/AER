import { sha256 } from "./hash.js";
import type { AER, IntegrityManifest } from "./types.js";

export interface IntegrityIssue {
  path: string;
  message: string;
}

export interface IntegrityVerificationResult {
  ok: boolean;
  issues: IntegrityIssue[];
  aerSha256: string;
  rawSha256?: string;
}

export function attachIntegrity(aer: AER): AER {
  const copy = cloneWithoutIntegrity(aer);
  const integrity: IntegrityManifest = {
    algorithm: "sha256",
    aerSha256: sha256(canonicalJson(copy)),
  };
  return { ...copy, integrity };
}

export function canonicalAERPayload(aer: AER): string {
  return canonicalJson(cloneWithoutIntegrity(aer));
}

export function verifyIntegrity(aer: AER, rawJsonl?: string): IntegrityVerificationResult {
  const aerSha256 = sha256(canonicalAERPayload(aer));
  const issues: IntegrityIssue[] = [];

  if (!aer.integrity) {
    issues.push({ path: "integrity", message: "missing integrity manifest" });
  } else if (aer.integrity.aerSha256 !== aerSha256) {
    issues.push({
      path: "integrity.aerSha256",
      message: `expected ${aer.integrity.aerSha256}, computed ${aerSha256}`,
    });
  }

  let rawSha256: string | undefined;
  if (rawJsonl !== undefined) {
    rawSha256 = sha256(rawJsonl);
    if (aer.raw.sha256 !== rawSha256) {
      issues.push({
        path: "raw.sha256",
        message: `expected ${aer.raw.sha256}, computed ${rawSha256}`,
      });
    }

    const lineHashes = rawLineHashes(rawJsonl);
    for (const action of aer.actions) {
      if (!action.recordHash) {
        issues.push({ path: `actions.${action.id}.recordHash`, message: "missing record hash" });
        continue;
      }
      const expected = lineHashes[action.recordIndex];
      if (!expected) {
        issues.push({
          path: `actions.${action.id}.recordIndex`,
          message: `record index ${action.recordIndex} does not exist in JSONL`,
        });
        continue;
      }
      if (action.recordHash !== expected) {
        issues.push({
          path: `actions.${action.id}.recordHash`,
          message: `expected ${action.recordHash}, computed ${expected}`,
        });
      }
    }
  }

  return { ok: issues.length === 0, issues, aerSha256, ...(rawSha256 ? { rawSha256 } : {}) };
}

export function rawLineHashes(jsonl: string): string[] {
  return jsonl
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => sha256(line));
}

function cloneWithoutIntegrity(aer: AER): AER {
  const { integrity: _integrity, ...rest } = aer;
  return JSON.parse(JSON.stringify(rest)) as AER;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortObject(value));
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = sortObject((value as Record<string, unknown>)[key]);
      return acc;
    }, {});
}
