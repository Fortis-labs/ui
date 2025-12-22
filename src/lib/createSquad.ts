'use client';
import * as web3 from '@solana/web3.js';
import { PublicKey, Transaction } from '@solana/web3.js';
import * as multisig_pda from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/pda';
import * as multisig_ixs from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/instructions';
export async function createMultisig(
  connection: web3.Connection,
  user: PublicKey,
  members: PublicKey[],
  threshold: number,
  createKey: PublicKey,
  rentCollector?: PublicKey,
) {
  try {
    const multisigPda = (await multisig_pda.getMultisigPda({ createKey: createKey }))[0];
    const configTreasury = multisig_pda.FORTIS_TREASURY;
    const ix = await multisig_ixs.multisigCreate({
      treasury: new PublicKey(configTreasury.toString()),
      creator: user,
      multisigPda: new PublicKey(multisigPda.toString()),
      threshold,
      members,
      createKey: createKey,
      rentCollector: rentCollector ? rentCollector : null,
    });

    const tx = new Transaction().add(ix);

    tx.feePayer = user;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    return { transaction: tx, multisig: multisigPda };
  } catch (err) {
    throw err;
  }
}