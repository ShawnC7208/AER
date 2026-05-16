import { createPrivateKey, createPublicKey, sign } from "node:crypto";
import type { KeyObject } from "node:crypto";
import { writeFileSync } from "node:fs";
import { type AER, attachIntegrity, canonicalAERPayload, parseAER } from "@aer/core";
import { errorMessage, fail, readTextFile } from "./shared.js";

export interface SignCommandOptions {
  key: string;
  output?: string;
}

export function runSign(input: string, opts: SignCommandOptions): void {
  let aer: AER;
  try {
    aer = attachIntegrity(parseAER(JSON.parse(readTextFile(input))));
  } catch (err) {
    fail(`cannot load AER '${input}': ${errorMessage(err)}`);
  }

  let privateKey: KeyObject;
  try {
    privateKey = createPrivateKey(readTextFile(opts.key));
  } catch (err) {
    fail(`cannot read Ed25519 private key '${opts.key}': ${errorMessage(err)}`);
  }
  if (privateKey.asymmetricKeyType !== "ed25519") {
    fail(`cannot sign '${input}': key must be an Ed25519 private key`);
  }

  const publicKey = createPublicKey(privateKey).export({ type: "spki", format: "pem" }).toString();
  const integrity = aer.integrity;
  if (!integrity) fail(`cannot sign '${input}': missing integrity manifest`);
  aer.integrity = {
    algorithm: "sha256",
    aerSha256: integrity.aerSha256,
    signature: {
      algorithm: "Ed25519",
      publicKey,
      signature: sign(null, Buffer.from(canonicalAERPayload(aer)), privateKey).toString("base64"),
    },
  };

  const output = opts.output ?? input;
  try {
    writeFileSync(output, `${JSON.stringify(aer, null, 2)}\n`);
  } catch (err) {
    fail(`cannot write signed AER '${output}': ${errorMessage(err)}`);
  }
  process.stderr.write(`Signed ${output}\n`);
}
