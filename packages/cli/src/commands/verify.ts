import { createPublicKey, verify as verifySignature } from "node:crypto";
import { type AER, canonicalAERPayload, parseAER, verifyIntegrity } from "@aer/core";
import { errorMessage, fail, readTextFile } from "./shared.js";

export function runVerify(aerPath: string, jsonlPath: string): void {
  let aer: AER;
  try {
    aer = parseAER(JSON.parse(readTextFile(aerPath)));
  } catch (err) {
    fail(`cannot load AER '${aerPath}': ${errorMessage(err)}`);
  }

  const jsonl = readTextFile(jsonlPath);
  const result = verifyIntegrity(aer, jsonl);
  const signature = aer.integrity?.signature;

  if (signature) {
    try {
      const publicKey = createPublicKey(signature.publicKey);
      if (publicKey.asymmetricKeyType !== "ed25519") {
        result.issues.push({
          path: "integrity.signature.publicKey",
          message: "public key must be Ed25519",
        });
      } else {
        const ok = verifySignature(
          null,
          Buffer.from(canonicalAERPayload(aer)),
          publicKey,
          Buffer.from(signature.signature, "base64"),
        );
        if (!ok) {
          result.issues.push({
            path: "integrity.signature",
            message: "signature verification failed",
          });
        }
      }
    } catch (err) {
      result.issues.push({
        path: "integrity.signature",
        message: `signature verification failed: ${errorMessage(err)}`,
      });
    }
  }

  if (result.issues.length > 0) {
    process.stderr.write(`aer: integrity verification failed for '${aerPath}'\n`);
    for (const issue of result.issues) {
      process.stderr.write(`- ${issue.path}: ${issue.message}\n`);
    }
    process.exit(1);
  }

  const signed = signature ? " signed" : "";
  process.stdout.write(`Verified${signed} AER: ${aerPath}\n`);
}
