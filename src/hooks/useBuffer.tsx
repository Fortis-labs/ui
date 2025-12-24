import { PublicKey, AccountInfo, ParsedAccountData, RpcResponseAndContext } from '@solana/web3.js';
import { useSuspenseQuery } from '@tanstack/react-query';
import invariant from 'invariant';
import { useMultisigData } from '../hooks/useMultisigData';

export interface BufferInfo {
    authority: string;
}

export const useBuffer = (bufferAddress: string | null) => {
    const { connection, multisigAddress } = useMultisigData();

    // Helper to parse account info
    const getParsed = (
        account: RpcResponseAndContext<AccountInfo<Buffer | ParsedAccountData> | null>
    ) => {
        const { value } = account;
        if (value && value.data && 'parsed' in value.data) {
            return value.data.parsed;
        }
        return null;
    };

    const getParsedAccount = async (address: PublicKey) => {
        const accountInfo = await connection.getParsedAccountInfo(address);
        return getParsed(accountInfo);
    };

    const fetchBufferAuthority = async (bufferAddr: PublicKey): Promise<string> => {
        // Get raw account info
        const accountInfo = await connection.getAccountInfo(bufferAddr);
        invariant(accountInfo, `Buffer account ${bufferAddr.toBase58()} not found`);
        if (accountInfo.data.length < 37) throw new Error('Buffer account data too short');

        // Extract authority bytes (Solana buffer layout: offset 5-36)
        const authBytes = accountInfo.data.slice(5, 37);
        const authorityPubkey = new PublicKey(authBytes);

        return authorityPubkey.toBase58();
    };

    return useSuspenseQuery({
        queryKey: ['bufferAuthority', bufferAddress],
        queryFn: async (): Promise<BufferInfo | null> => {
            if (!bufferAddress || !multisigAddress) return null;

            try {
                const authority = await fetchBufferAuthority(new PublicKey(bufferAddress));
                return { authority };
            } catch (err) {
                console.error('Failed to fetch buffer authority:', err);
                return null;
            }
        },

    });
};
