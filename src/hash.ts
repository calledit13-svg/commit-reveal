/**
 * hash.ts — the canonical commit-reveal hash recipe.
 *
 * This is the single most important file in the library: every commitment
 * ever sealed, and every reveal ever verified, depends on this function
 * producing byte-for-byte identical output given the same inputs.
 *
 * NOTE: this implementation encodes the recipe as documented (pipe-delimited
 * fields, SHA-256). If your production system's recipe differs in field
 * order, delimiter, or encoding, replace the body of buildCommitmentPreimage()
 * below to match exactly — every existing on-chain commitment was sealed
 * with the production recipe, and this library is only useful if it can
 * reproduce that recipe precisely. Do not change this file casually once
 * it has verified even one real commitment.
 */

import { createHash } from "crypto";

export interface CommitmentFields {
    /** e.g. "solana" */
  chain: string;
    /** contract address (CA) of the token being called */
  contractAddress: string;
    /** call direction, e.g. "long" | "short" */
  direction: string;
    /** market cap (MC) at the moment of the call, as a plain decimal string */
  marketCap: string;
    /** price at the moment of the call, as a plain decimal string */
  price: string;
    /** random salt chosen at commit time; never revealed until the reveal step */
  salt: string;
}

/**
 * Builds the exact preimage string that gets hashed. Field order and the
 * "|" delimiter are the frozen recipe — changing either breaks verification
 * of every commitment sealed before the change.
 */
export function buildCommitmentPreimage(fields: CommitmentFields): string {
    const { chain, contractAddress, direction, marketCap, price, salt } = fields;
    return [chain, contractAddress, direction, marketCap, price, salt].join("|");
}

/**
 * Hashes a set of commitment fields with SHA-256, returning the hex digest
 * that gets written into the Solana memo at commit time.
 */
export function hashCommitment(fields: CommitmentFields): string {
    const preimage = buildCommitmentPreimage(fields);
    return createHash("sha256").update(preimage, "utf8").digest("hex");
}

/**
 * Reveal-time check: recompute the hash from the now-disclosed fields
 * (including the salt) and compare it to the hash that was actually
 * written on-chain at commit time.
 */
export function verifyCommitment(
    fields: CommitmentFields,
    onChainHash: string
  ): boolean {
    return hashCommitment(fields) === onChainHash.toLowerCase();
}
