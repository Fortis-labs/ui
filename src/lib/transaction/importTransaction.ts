'use client';
import * as multisig from '../../../client/ts/generated';
import * as multisig_pda from '../../../client/ts/pda';
import * as multisig_ixs from '../../../client/ts/instructions';
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { decodeAndDeserialize } from './decodeAndDeserialize';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { loadLookupTables } from './getAccountsForSimulation';
import { waitForConfirmation } from '~/lib/transactionConfirmation';

export const importTransaction = async (
  tx: string,
  connection: Connection,
  multisigPda: string,
  votingDeadline: bigint,
  wallet: WalletContextState
) => {
  if (!wallet.publicKey) {
    throw 'Please connect your wallet.';
  }
  try {
    const { message, version } = decodeAndDeserialize(tx);
    const account = await connection.getAccountInfo(new PublicKey(multisigPda));

    if (!account) {
      throw new Error('Multisig account not found');
    }
    //wallet.signTransaction
    const multisigInfo =
      multisig.getMultisigCodec().decode(account.data);

    const transactionMessage = new TransactionMessage(message);

    const addressLookupTableAccounts =
      version === 0
        ? await loadLookupTables(connection, transactionMessage.compileToV0Message())
        : [];

    const transactionIndex = Number(multisigInfo.transactionIndex) + 1;
    const transactionIndexBN = BigInt(transactionIndex);

    const proposalCreateIx = await multisig_ixs.proposalCreate({
      creator: wallet.publicKey,
      multisigPda: new PublicKey(multisigPda),
      ephemeralSigners: 0,
      votingDeadline: votingDeadline,
      transactionMessage: transactionMessage,
      addressLookupTableAccounts: addressLookupTableAccounts,
      transactionIndex: transactionIndexBN,
    });
    const proposalApproveIx = await multisig_ixs.proposalApprove({
      member: wallet.publicKey,
      multisigPda: new PublicKey(multisigPda),
      transactionIndex: transactionIndexBN,
    });


    const blockhash = (await connection.getLatestBlockhash()).blockhash;

    const wrappedMessage = new TransactionMessage({
      instructions: [proposalCreateIx, proposalApproveIx],
      payerKey: wallet.publicKey,
      recentBlockhash: blockhash,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(wrappedMessage);

    const signature = await wallet.sendTransaction(transaction, connection, {
      skipPreflight: true,
    });
    console.log('Transaction signature', signature);
    toast.loading('Confirming...', {
      id: 'transaction',
    });

    const hasSent = await waitForConfirmation(connection, [signature]);
    if (!hasSent.every((s) => !!s)) {
      throw `Unable to confirm transaction`;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};