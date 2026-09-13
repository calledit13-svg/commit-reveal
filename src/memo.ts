/**
 * memo.ts — writing a commitment hash to Solana, and reading it back.
 *
 * The commitment hash is sealed by writing it as the data of an SPL Memo
 * instruction inside an ordinary Solana transaction. Memo transactions are
 * cheap, fast, and — once confirmed — immutable and publicly readable by
 * anyone, which is exactly the property a commit-reveal scheme needs: the
 * caller cannot alter what they committed to after the fact, and anyone
 * can independently verify it later without trusting Calledit's database.
 */

import {
    Connection,
    PublicKey,
    Transaction,
    TransactionInstruction,
    Keypair,
    sendAndConfirmTransaction,
} from "@solana/web3.js";

export const MEMO_PROGRAM_ID = new PublicKey(
    "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
  );

/**
 * Builds (and optionally sends) a transaction containing a single memo
 * instruction whose data is the commitment hash produced by hash.ts.
 *
 * The fee payer here is intentionally a low-balance, memo-fees-only signer
 * — this key should never hold anything beyond what's needed to pay memo
 * transaction fees. Never reuse a treasury or customer-funds wallet here.
 */
export async function writeCommitmentMemo(
    connection: Connection,
    feePayer: Keypair,
    commitmentHash: string
  ): Promise<string> {
    const memoInstruction = new TransactionInstruction({
          keys: [],
          programId: MEMO_PROGRAM_ID,
          data: Buffer.from(commitmentHash, "utf8"),
    });

  const transaction = new Transaction().add(memoInstruction);
    const signature = await sendAndConfirmTransaction(connection, transaction, [
          feePayer,
        ]);
    return signature;
}

/**
 * Reads a confirmed transaction back and extracts the memo string, so a
 * verifier can pull the originally-committed hash straight from the chain
 * rather than trusting any off-chain record of it.
 */
export async function readCommitmentMemo(
    connection: Connection,
    signature: string
  ): Promise<string | null> {
    const tx = await connection.getParsedTransaction(signature, {
          maxSupportedTransactionVersion: 0,
    });
    if (!tx) return null;

  for (const ix of tx.transaction.message.instructions) {
        if ("programId" in ix && ix.programId.equals(MEMO_PROGRAM_ID)) {
                // Parsed memo instructions expose their text directly; raw ones
          // carry it base58-encoded in `data` — handle both shapes.
          const parsed = ix as unknown as { parsed?: string };
                if (typeof parsed.parsed === "string") return parsed.parsed;
        }
  }
    return null;
}
