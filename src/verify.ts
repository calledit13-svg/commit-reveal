/**
 * verify.ts — the end-to-end check anyone can run, trusting nothing but
 * the Solana chain itself.
 *
 * Given a transaction signature (public — it's whatever the caller shared
 * on the proof card) and the fields revealed after the fact, this answers
 * one question: does the hash on-chain, sealed before the outcome was
 * known, match a hash of the now-disclosed fields? If yes, the call is
 * provably genuine and untampered. If no, it's provably fabricated.
 */

import { Connection } from "@solana/web3.js";
import { CommitmentFields, hashCommitment } from "./hash";
import { readCommitmentMemo } from "./memo";

export interface VerificationResult {
    valid: boolean;
    onChainHash: string | null;
    recomputedHash: string;
}

export async function verifyRevealedCall(
    connection: Connection,
    commitSignature: string,
    revealedFields: CommitmentFields
  ): Promise<VerificationResult> {
    const onChainHash = await readCommitmentMemo(connection, commitSignature);
    const recomputedHash = hashCommitment(revealedFields);

  return {
        valid: onChainHash !== null && onChainHash === recomputedHash,
        onChainHash,
        recomputedHash,
  };
}
