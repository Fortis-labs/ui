import { fromLegacyPublicKey } from '@solana/compat';
import { Buffer } from "buffer";
import { VaultTransactionMessage, getVaultTransactionMessageEncoder, MessageAddressTableLookup, CompiledInstruction, getCompiledInstructionEncoder, getCompiledInstructionCodec } from "./generated";
import {
  AccountMeta,
  AddressLookupTableAccount,
  Connection,
  PublicKey,
  VersionedTransaction,
  TransactionInstruction,
  TransactionMessage,
} from "@solana/web3.js";
import {
  AddressesByLookupTableAddress,
  compressTransactionMessageUsingAddressLookupTables,
} from '@solana/transaction-messages';
import { getEphemeralSignerPda } from "./pda";
import invariant from "invariant";
import { compileToWrappedMessageV0 } from "./utils/compileToWrappedMessageV0";
import { address, getAddressFromPublicKey, ReadonlyUint8Array, Instruction, AccountRole, Address, fetchAddressesForLookupTables } from "@solana/kit";
import * as kit from "@solana/kit";
import { lookup } from "dns";

export function toUtfBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}


const MAX_TX_SIZE_BYTES = 1232;
const STRING_LEN_SIZE = 4;
export function getAvailableMemoSize(
  txWithoutMemo: VersionedTransaction
): number {
  const txSize = txWithoutMemo.serialize().length;
  return (
    MAX_TX_SIZE_BYTES -
    txSize -
    STRING_LEN_SIZE -
    // Sometimes long memo can trigger switching from 1 to 2 bytes length encoding in Compact-u16,
    // so we reserve 1 extra byte to make sure.
    1
  );
}

export function isStaticWritableIndex(
  message: VaultTransactionMessage,
  index: number
) {
  const numAccountKeys = message.accountKeys.length;
  const { numSigners, numWritableSigners, numWritableNonSigners } = message;

  if (index >= numAccountKeys) {
    // `index` is not a part of static `accountKeys`.
    return false;
  }

  if (index < numWritableSigners) {
    // `index` is within the range of writable signer keys.
    return true;
  }

  if (index >= numSigners) {
    // `index` is within the range of non-signer keys.
    const indexIntoNonSigners = index - numSigners;
    // Whether `index` is within the range of writable non-signer keys.
    return indexIntoNonSigners < numWritableNonSigners;
  }

  return false;
}

export function isSignerIndex(message: VaultTransactionMessage, index: number) {
  return index < message.numSigners;
}

/** We use custom serialization for `transaction_message` that ensures as small byte size as possible. */
export async function transactionMessageToMultisigTransactionMessageBytes({
  message,
  addressLookupTableAccounts,
}: {
  message: TransactionMessage;
  addressLookupTableAccounts: AddressLookupTableAccount[];

}): Promise<ReadonlyUint8Array> {



  const compiledMessage = compileToWrappedMessageV0({
    payerKey: message.payerKey,
    instructions: message.instructions,
    addressLookupTableAccounts,
  });

  const encoder = getVaultTransactionMessageEncoder();

  let compiled_ixs: CompiledInstruction[] = [];
  for (const msg_cix of compiledMessage.compiledInstructions) {
    compiled_ixs.push({
      programIdIndex: msg_cix.programIdIndex,
      accountIndexes: new Uint8Array(msg_cix.accountKeyIndexes ?? []),
      data: msg_cix.data ?? new Uint8Array(),
    });
  }
  let alts: MessageAddressTableLookup[] = [];
  for (const alt of compiledMessage.addressTableLookups) {
    alts.push({
      accountKey: fromLegacyPublicKey(alt.accountKey),
      writableIndexes: Uint8Array.from(alt.writableIndexes),
      readonlyIndexes: Uint8Array.from(alt.readonlyIndexes)
    });
  }

  const bytes = encoder.encode({
    numSigners: compiledMessage.header.numRequiredSignatures,
    numWritableSigners: compiledMessage.header.numRequiredSignatures - compiledMessage.header.numReadonlySignedAccounts,
    numWritableNonSigners: compiledMessage.staticAccountKeys.length - compiledMessage.header.numRequiredSignatures - compiledMessage.header.numReadonlyUnsignedAccounts,
    accountKeys: compiledMessage.staticAccountKeys.map((pk) => fromLegacyPublicKey(pk)),
    addressTableLookups: alts,
    instructions: compiled_ixs,
  });

  return bytes;
}

export function toLegacyTransactionInstruction(
  instruction: Instruction,
  signerAccountIndexes: number[]
): TransactionInstruction {
  const signerSet = new Set(signerAccountIndexes);

  const keys = (instruction.accounts ?? []).map((acct, index) => {
    const pubkey = new PublicKey(acct.address);

    // base flags from role
    let { isSigner, isWritable } = roleToFlags(acct.role);

    // 🔥 FORCE signer if index is listed
    if (signerSet.has(index)) {
      isSigner = true;
    }

    return { pubkey, isSigner, isWritable };
  });

  const data =
    instruction.data instanceof Uint8Array
      ? Buffer.from(instruction.data)
      : Buffer.alloc(0);

  const programId = new PublicKey(instruction.programAddress);

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
}

// Convert AccountRole back to isSigner / isWritable flags
function roleToFlags(role: AccountRole): { isSigner: boolean; isWritable: boolean } {
  switch (role) {
    case AccountRole.WRITABLE_SIGNER:
      return { isSigner: true, isWritable: true };
    case AccountRole.READONLY_SIGNER:
      return { isSigner: true, isWritable: false };
    case AccountRole.WRITABLE:
      return { isSigner: false, isWritable: true };
    case AccountRole.READONLY:
    default:
      return { isSigner: false, isWritable: false };
  }
}
/** Populate remaining accounts required for execution of the transaction. */
export async function accountsForTransactionExecute({
  connection,
  transactionPda,
  vaultPda,
  message,
  ephemeralSignerBumps,
  programId,
  addressLookupTableAccounts: localAddressLookupTableAccounts,
}: {
  connection: Connection;
  message: VaultTransactionMessage;
  ephemeralSignerBumps: number[];
  vaultPda: PublicKey;
  transactionPda: PublicKey;
  programId?: PublicKey;
  addressLookupTableAccounts?: AddressLookupTableAccount[];
}): Promise<{
  /** Account metas used in the `message`. */
  accountMetas: AccountMeta[];
  /** Address lookup table accounts used in the `message`. */
  lookupTableAccounts: AddressLookupTableAccount[];
}> {
  const ephemeralSignerPdas = await Promise.all(
    ephemeralSignerBumps.map(async (_, additionalSignerIndex) => {
      const [pda] = await getEphemeralSignerPda({
        transactionPda: transactionPda,
        ephemeralSignerIndex: additionalSignerIndex,
      });
      return pda;
    })
  );

  const addressLookupTableKeys = message.addressTableLookups.map(
    ({ accountKey }) => accountKey
  );
  const addressLookupTableAccounts = new Map(
    await Promise.all(
      addressLookupTableKeys.map(async (key) => {

        const localAccount = localAddressLookupTableAccounts?.find((a) => a.key.toBase58() === key)
        if (localAccount) {
          return [key, localAccount] as const;
        }

        const { value } = await connection.getAddressLookupTable(new PublicKey(key));
        if (!value) {
          throw new Error(
            `Address lookup table account ${key} not found`
          );
        }
        return [key, value] as const;
      })
    )
  );

  // Populate account metas required for execution of the transaction.
  const accountMetas: AccountMeta[] = [];
  // First add the lookup table accounts used by the transaction. They are needed for on-chain validation.
  accountMetas.push(
    ...addressLookupTableKeys.map((key) => {
      return { pubkey: new PublicKey(key), isSigner: false, isWritable: false };
    })
  );

  // Then add static account keys included into the message.
  for (const [accountIndex, accountKey] of message.accountKeys.entries()) {
    let accountKey_pubKey = new PublicKey(accountKey);
    accountMetas.push({
      pubkey: new PublicKey(accountKey),
      isWritable: isStaticWritableIndex(message, accountIndex),
      // NOTE: vaultPda and ephemeralSignerPdas cannot be marked as signers,
      // because they are PDAs and hence won't have their signatures on the transaction.
      isSigner:
        isSignerIndex(message, accountIndex) &&
        !accountKey_pubKey.equals(vaultPda) &&
        !ephemeralSignerPdas.some((k) => accountKey_pubKey.equals(k)),
    });
  }
  // Then add accounts that will be loaded with address lookup tables.
  for (const lookup of message.addressTableLookups) {
    const lookupTableAccount = addressLookupTableAccounts.get(
      lookup.accountKey
    );
    invariant(
      lookupTableAccount,
      `Address lookup table account ${lookup.accountKey} not found`
    );

    for (const accountIndex of lookup.writableIndexes) {
      const pubkey: PublicKey =
        lookupTableAccount.state.addresses[accountIndex];
      invariant(
        pubkey,
        `Address lookup table account ${lookup.accountKey} does not contain address at index ${accountIndex}`
      );
      accountMetas.push({
        pubkey,
        isWritable: true,
        // Accounts in address lookup tables can not be signers.
        isSigner: false,
      });
    }
    for (const accountIndex of lookup.readonlyIndexes) {
      const pubkey: PublicKey =
        lookupTableAccount.state.addresses[accountIndex];
      invariant(
        pubkey,
        `Address lookup table account ${lookup.accountKey} does not contain address at index ${accountIndex}`
      );
      accountMetas.push({
        pubkey,
        isWritable: false,
        // Accounts in address lookup tables can not be signers.
        isSigner: false,
      });
    }
  }

  return {
    accountMetas,
    lookupTableAccounts: [...addressLookupTableAccounts.values()],
  };
}