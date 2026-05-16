# AER Integrity

AER Phase 5 adds deterministic tamper-evidence without network calls or external
trust infrastructure.

## Hashes

- `raw.sha256` is the SHA-256 hash of the complete source JSONL file.
- `actions[].recordHash` is the SHA-256 hash of the original JSONL line that
  produced that action. Multiple actions emitted from one record share the same
  line hash.
- `integrity.aerSha256` is the SHA-256 hash of a canonical AER payload with the
  `integrity` block removed.

The canonical AER payload recursively sorts object keys before hashing. Arrays
keep their original order.

`--with-disk` can improve mutation diffs when the trace does not include prior
file content, but it reads the current filesystem. Those hashes are best-effort
disk snapshot evidence unless conversion runs against a known pre-mutation
checkout.

## Verify

```sh
aer verify run.aer.json run.jsonl
```

`aer verify` fails if:

- the AER payload no longer matches `integrity.aerSha256`
- the JSONL no longer matches `raw.sha256`
- any action `recordHash` no longer matches its source JSONL line
- a signature block exists and its Ed25519 signature does not verify

## Sign

```sh
aer sign run.aer.json --key ed25519-private.pem
```

Signing embeds:

- the Ed25519 public key exported from the private key
- a base64 signature over the canonical AER payload

AER does not provide PKI, identity binding, or key custody in Phase 5. Consumers
decide whether the embedded public key is trusted.
