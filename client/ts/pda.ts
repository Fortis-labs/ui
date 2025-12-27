import { FORTIS_MULTISIG_PROGRAM_ADDRESS } from "./generated";
import { toUtfBytes } from "./utils";
import { PublicKey } from "@solana/web3.js";
import { Address, address, getAddressFromPublicKey, ReadonlyUint8Array, getProgramDerivedAddress, ProgramDerivedAddress, ProgramDerivedAddressBump, getU64Encoder, getU64Decoder } from "@solana/kit";

const SEED_PREFIX = toUtfBytes("multisig");
const SEED_MULTISIG = toUtfBytes("multisig");
const SEED_VAULT = toUtfBytes("vault");
const SEED_TRANSACTION = toUtfBytes("transaction");
const SEED_PROPOSAL = toUtfBytes("proposal");
const SEED_EPHEMERAL_SIGNER = toUtfBytes("ephemeral_signer");
const prgramId = FORTIS_MULTISIG_PROGRAM_ADDRESS
export const FORTIS_TREASURY = address("5wBH8hqU4PxVCFXmu3JR6Kegdy2Vq8K7fZnRgN5ZJEr2");
export function getMultisigPda({
  createKey,
  programId = new PublicKey(FORTIS_MULTISIG_PROGRAM_ADDRESS),
}: {
  createKey: PublicKey;
  programId?: PublicKey;
}): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEED_PREFIX, SEED_MULTISIG, createKey.toBytes()],
    programId
  );
}
export function getVaultPda({
  multisigPda,
  programId = new PublicKey(FORTIS_MULTISIG_PROGRAM_ADDRESS),
}: {
  multisigPda: PublicKey;
  programId?: PublicKey;
}): [PublicKey, number] {


  return PublicKey.findProgramAddressSync(
    [SEED_PREFIX, multisigPda.toBytes(), SEED_VAULT],
    programId
  );
}


export function getEphemeralSignerPda({
  transactionPda,
  ephemeralSignerIndex,
  programId = new PublicKey(FORTIS_MULTISIG_PROGRAM_ADDRESS),
}: {
  transactionPda: PublicKey;
  ephemeralSignerIndex: number;
  programId?: PublicKey;
}): [PublicKey, number] {
  const buf = new Uint8Array([ephemeralSignerIndex]); // ✅ works

  return PublicKey.findProgramAddressSync(
    [
      SEED_PREFIX,
      transactionPda.toBytes(),
      SEED_EPHEMERAL_SIGNER,
      buf,
    ],
    programId
  );
}

export function getTransactionPda({
  multisigPda,
  index,
  programId = new PublicKey(FORTIS_MULTISIG_PROGRAM_ADDRESS),
}: {
  multisigPda: PublicKey;
  /** Transaction index. */
  index: bigint;
  programId?: PublicKey;
}): [PublicKey, number] {
  const buf = Uint8Array.from(getU64Encoder().encode(index));

  return PublicKey.findProgramAddressSync(
    [SEED_PREFIX, multisigPda.toBytes(), SEED_TRANSACTION, buf],
    programId
  );
}


export function getProposalPda({
  multisigPda,
  transactionIndex,
  programId = new PublicKey(FORTIS_MULTISIG_PROGRAM_ADDRESS),
}: {
  multisigPda: PublicKey;
  transactionIndex: bigint;
  programId?: PublicKey;
}): [PublicKey, number] {
  const buf = Uint8Array.from(getU64Encoder().encode(transactionIndex));
  return PublicKey.findProgramAddressSync(
    [
      SEED_PREFIX,
      multisigPda.toBytes(),
      SEED_TRANSACTION,
      buf,
      SEED_PROPOSAL,
    ],
    programId
  );
}