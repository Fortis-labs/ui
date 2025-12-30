
import { getMultisigDecoder, getProposalDecoder } from '../../client/ts/generated';
import * as multisig_pda from '../../client/ts/pda';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Connection, PublicKey } from '@solana/web3.js';
import { useMultisigData } from './useMultisigData';
import { useMultisigAddress } from './useMultisigAddress';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';

// load multisig
export const useMultisig = () => {
  const { connection, rpcUrl } = useMultisigData();
  const { multisigAddress } = useMultisigAddress();

  return useSuspenseQuery({
    queryKey: ['multisig', multisigAddress, rpcUrl],
    queryFn: async () => {
      if (!multisigAddress) return null;
      try {
        const multisigPubkey = new PublicKey(multisigAddress);
        const decoder = getMultisigDecoder();
        const accountInfo = await connection.getAccountInfo(multisigPubkey);
        if (!accountInfo) {
          throw new Error("Multisig not found");
        }
        console.log("multisig data size", accountInfo.data.length)
        return decoder.decode(accountInfo.data);
      } catch (error) {
        console.error(error);
        return null;
      }
    },
  });
};

export const useBalance = (address: PublicKey | null) => {
  const { connection, rpcUrl } = useMultisigData();

  return useSuspenseQuery({
    queryKey: ['balance', address?.toBase58(), rpcUrl],
    queryFn: async () => {
      if (!address) return 0;
      try {
        return connection.getBalance(address);
      } catch (error) {
        console.error(error);
        return null;
      }
    },
  });
};

export const useGetTokens = (address: PublicKey | null) => {

  const { connection, rpcUrl } = useMultisigData();

  return useSuspenseQuery({
    queryKey: ['tokenBalances', address?.toBase58(), rpcUrl],
    queryFn: async () => {
      if (!address) return 0;
      try {
        const classicTokens = await connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_PROGRAM_ID,
        });
        const t22Tokens = await connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_2022_PROGRAM_ID,
        });
        return classicTokens.value.concat(t22Tokens.value);
      } catch (error) {
        console.error(error);
        return null;
      }
    },
  });
};
// Transactions
async function fetchTransactionDataBatch(
  connection: Connection,
  multisigPda: PublicKey,
  indices: bigint[],
  programId: PublicKey
) {
  // 1️⃣ Compute all transaction PDAs and proposal PDAs
  const transactionPdas = indices.map(index =>
    multisig_pda.getTransactionPda({ multisigPda, index, programId })[0]
  );
  const proposalPdas = indices.map(index =>
    multisig_pda.getProposalPda({ multisigPda, transactionIndex: index, programId })[0]
  );

  // 2️⃣ Fetch proposal accounts in batch
  const proposalAccounts = await connection.getMultipleAccountsInfo(
    proposalPdas.map(p => new PublicKey(p))
  );

  // 3️⃣ Decode proposals
  const decoder = getProposalDecoder();
  const results = indices.map((index, i) => {
    const accountInfo = proposalAccounts[i];
    const proposal = accountInfo ? decoder.decode(accountInfo.data) : null;
    return {
      transactionPda: transactionPdas[i],
      proposal,
      index,
    };
  });

  return results;
}
export const useTransactions = (startIndex: number, endIndex: number) => {
  const { connection, programId, multisigAddress, rpcUrl } = useMultisigData();

  return useSuspenseQuery({
    queryKey: [
      'transactions',
      { startIndex, endIndex, multisigAddress, programId: programId.toBase58() }, rpcUrl
    ],
    queryFn: async () => {
      if (!multisigAddress) return null;
      const multisigPda = new PublicKey(multisigAddress);

      const indices: bigint[] = [];
      for (let i = startIndex; i >= endIndex; i--) {
        indices.push(BigInt(i));
      }

      // batch in chunks of 50 to respect RPC limits
      const chunkSize = 80;
      const results: any[] = [];
      for (let i = 0; i < indices.length; i += chunkSize) {
        const chunk = indices.slice(i, i + chunkSize);
        const batchResult = await fetchTransactionDataBatch(connection, multisigPda, chunk, programId);
        results.push(...batchResult);
      }

      return results;
    },
  });
};
