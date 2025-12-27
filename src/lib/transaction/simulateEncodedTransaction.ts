'use client';
import { toast } from 'sonner';
import { decodeAndDeserialize } from './decodeAndDeserialize';
import { Connection, VersionedTransaction } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { getAccountsForSimulation } from './getAccountsForSimulation';

export const simulateEncodedTransaction = async (
  tx: string,
  connection: Connection,
  wallet: WalletContextState
) => {
  if (!wallet.publicKey) {
    throw 'Please connect your wallet.';
  }
  try {
    const { message, version } = decodeAndDeserialize(tx);
    console.log("message version", version);
    const transaction = new VersionedTransaction(message.compileToV0Message());

    const keys = await getAccountsForSimulation(connection, transaction, version === 'legacy');

    toast.loading('Simulating...', {
      id: 'simulation',
    });
    const { value } = await connection.simulateTransaction(transaction, {
      sigVerify: false,
      replaceRecentBlockhash: true,
      commitment: 'confirmed',
      accounts: {
        encoding: 'base64',
        addresses: keys,
      },
    });

    if (value.err) {
      console.error(value.err);
      throw 'Simulation failed';
    }
  } catch (error: any) {
    console.error(error);
    throw new Error(error);
  }
};
//4XXJuXUSqBGQprPkKNGgWqDbxW7eqQiN8Ubvwrc384HYiQ8mRfjgK8MGLEurzzCm7azmioKLhQgaxcx3C5neexMEcW9ZZ6TcrJMw2mLX8gNbusZwvYYgMvTFz5yvcNYUqdy2pVCDisR1JpE1d28HLavkiNQHXkcGN46HoTSenMmBamTRaE3y7Wa7AnUiwoBe3qw3Pbn72cdNxuvRpDfAbqY8kG
//6GhS2ZJaE317xrcfP9CeXR76R6fUa3RkCZyYZeLiKHtcc91ygBKr9ShtEYY9QZvJfCjV1AErrDMbDRnGX2sQwHXdEhsRfJpPNoANPaAqB4t4h8CpWeBiX1K7geuTTJGrbgaGPKTRguphrcudw33AqMY7aPx2tyVmHpM2sddS2BBRAWRM3NvQdY9C1Qo5K59mSpwX3r8TNQus3ZQT