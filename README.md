# commit-reveal

A tamper-proof commit-reveal primitive for Solana. Seal a claim on-chain
before its outcome is known; prove afterward, to anyone, that the claim
was never altered.

Extracted from and used in production by [Calledit](https://calledit.buzz),
an on-chain trade-call notary — released standalone so any project needing
the same guarantee can build on it directly: prediction markets, provenance
and journalism tools, on-chain reputation systems, dispute resolution, or
any other case where "this was said at time T, and cannot have been
changed since" has value.

## Why this exists

Every claim-tracking system that stores claims in an editable database has
the same weakness: the person who made the claim (or whoever runs the
                                                  database) can quietly edit or delete it once the outcome is known. This
library removes that weakness by never storing the plaintext claim
anywhere until reveal time — only its hash, sealed on-chain via a Solana
memo transaction, before the outcome exists.

## How it works

1. Commit. The caller signs a commitment with their wallet. The six
   claim fields (chain, contractAddress, direction, marketCap,
                    price, salt) are joined with | and hashed with SHA-256. Only the
   hash — never the plaintext fields — is written on-chain, as the data of
   an SPL Memo instruction.
2. Reveal. Later, the caller discloses the plaintext fields, including
   the salt. Anyone can now recompute the hash and compare it to what was
   sealed on-chain at commit time.
3. Verify. If the hashes match, the claim is provably genuine and
   unaltered — no trust in Calledit, or in any off-chain record, required.

## Installation

```bash
npm install @calledit/commit-reveal
```

## Usage

```ts
import {
    hashCommitment,
    writeCommitmentMemo,
    verifyRevealedCall,
  } from "@calledit/commit-reveal";
import { Connection, Keypair } from "@solana/web3.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");

// --- commit ---
const fields = {
    chain: "solana",
    contractAddress: "So11111111111111111111111111111111111111112",
    direction: "long",
    marketCap: "42000000",
    price: "0.0031",
    salt: crypto.randomUUID(),
  };

const hash = hashCommitment(fields);
const signature = await writeCommitmentMemo(connection, feePayerKeypair, hash);
// `signature` is what gets shown on the caller's proof card.

// --- reveal / verify, any time later, by anyone ---
const result = await verifyRevealedCall(connection, signature, fields);
console.log(result.valid); // true if untampered
```

## A note on the hash recipe

buildCommitmentPreimage() in src/hash.ts is the frozen recipe: field
order and delimiter are load-bearing. Every commitment ever sealed depends
on this function's output staying identical. Before treating this package
as a drop-in replacement for any existing production implementation,
confirm the recipe matches byte-for-byte — a silent mismatch would mean
old commitments stop verifying.

## Security

This library handles the integrity guarantee the whole system depends on.
It has not yet had an independent security audit — that's underway. Until
an audit report is published here, treat this as a reference
implementation rather than a hardened one.

## License

MIT
